import { headers } from "next/headers";
import { BlobPreconditionFailedError } from "@vercel/blob";
import { FOUNDER_NAMES } from "@/config/founders";
import { answerModes, QUESTIONS, getQuestion, type Question } from "@/config/questions";
import { deletePathnames, headOrNull, listSubmissionBlobs, manifestExists, writeManifest } from "@/lib/blob";
import {
  SubmitBodySchema,
  type AnswerParts,
  type ClientAnswer,
  type ImageFile,
  type Manifest,
  type ManifestAnswer,
  type VoiceFile,
} from "@/lib/manifest";
import { MEDIA_RULES, extForMime, manifestPathname, mediaPathname, parseMediaPathname } from "@/lib/paths";
import { assertFreshSubmissionId, MIN_FILL_TIME_MS, RuleError } from "@/lib/submission-rules";

/**
 * Finalises one founder's submission: validates every answer against the questionnaire,
 * confirms each referenced media blob exists in the store, writes
 * manifest.json once, and removes media the respondent replaced or removed.
 */
export async function POST(request: Request): Promise<Response> {
  const parsed = SubmitBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const emailIssue = parsed.error.issues.find((i) => i.path.includes("email"));
    return Response.json(
      { error: emailIssue ? emailIssue.message : "Some answers couldn't be read. Please review and try again." },
      { status: 400 },
    );
  }
  const body = parsed.data;

  try {
    const startedAt = assertFreshSubmissionId(body.submissionId);

    // Spam checks. Bots get a quiet success and nothing is written.
    if (body.website || Date.now() - startedAt.getTime() < MIN_FILL_TIME_MS) {
      return Response.json({ ok: true, submissionId: body.submissionId });
    }

    if (await manifestExists(body.submissionId)) {
      return Response.json({ error: "This questionnaire has already been submitted." }, { status: 409 });
    }

    for (const id of Object.keys(body.answers)) {
      if (!getQuestion(id)) throw new RuleError("The questionnaire changed while you were answering. Please reload.");
    }

    const answers: Record<string, ManifestAnswer> = {};
    const missing: string[] = [];

    for (const question of QUESTIONS) {
      const input = body.answers[question.id];
      const answer = input ? await verifyAnswer(body.submissionId, question, input) : null;
      if (!answer) {
        if (question.required) missing.push(question.id);
        continue;
      }
      answers[question.id] = { type: question.type, questionPrompt: question.prompt, ...answer };
    }

    if (missing.length > 0) {
      return Response.json({ error: "Some required questions still need an answer.", missing }, { status: 422 });
    }

    const manifest: Manifest = {
      version: 2,
      submissionId: body.submissionId,
      submittedAt: new Date().toISOString(),
      founder: { id: body.founder, name: FOUNDER_NAMES[body.founder] },
      email: body.email,
      userAgent: ((await headers()).get("user-agent") ?? "").slice(0, 500),
      questions: QUESTIONS.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        section: q.section,
        required: q.required,
        accepts: answerModes(q),
      })),
      answers,
    };

    await writeManifest(manifest);
    await removeOrphans(manifest).catch((error) => console.error("[submit] orphan cleanup failed", error));

    return Response.json({ ok: true, submissionId: manifest.submissionId });
  } catch (error) {
    if (error instanceof RuleError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof BlobPreconditionFailedError) {
      return Response.json({ error: "This questionnaire has already been submitted." }, { status: 409 });
    }
    console.error("[submit] failed", error);
    return Response.json({ error: "We couldn't save your answers just now. Please try again." }, { status: 500 });
  }
}

async function assertStored(pathname: string, mimeType: string, maxBytes: number): Promise<number> {
  const blob = await headOrNull(pathname);
  if (!blob) throw new RuleError("A recording or photo didn't finish uploading. Please add it again.");
  if (blob.size > maxBytes) throw new RuleError("A media file is larger than allowed.");
  if (!blob.contentType.startsWith(mimeType)) throw new RuleError("A media file has an unexpected format.");
  return blob.size;
}

/** Validates one answer against what the question accepts. Returns null when the answer is empty. */
async function verifyAnswer(
  submissionId: string,
  question: Question,
  input: ClientAnswer,
): Promise<AnswerParts | null> {
  const modes = answerModes(question);
  const out: AnswerParts = {};

  const text = input.text?.trim();
  if (text) {
    if (!modes.text) throw new RuleError(`“${question.prompt}” doesn't take a written answer.`);
    out.text = text;
  }

  if (input.voice) {
    if (!modes.voice) throw new RuleError(`“${question.prompt}” doesn't take a recording.`);
    const v = input.voice;
    const expected = mediaPathname(submissionId, question.id, {
      kind: "voice",
      ext: extForMime(v.mimeType) as "webm" | "m4a",
    });
    if (v.pathname !== expected) throw new RuleError("A recording points at the wrong file.");
    const sizeBytes = await assertStored(expected, v.mimeType, MEDIA_RULES.voice.maxBytes);
    out.voice = { ...v, sizeBytes } satisfies VoiceFile;
  }

  if (input.images?.length) {
    if (input.images.length > modes.images) throw new RuleError(`Too many photos for “${question.prompt}”.`);
    const seen = new Set<string>();
    out.images = await Promise.all(
      input.images.map(async (img): Promise<ImageFile> => {
        const p = parseMediaPathname(img.pathname);
        const valid =
          p &&
          p.submissionId === submissionId &&
          p.questionId === question.id &&
          p.ext === "jpg" &&
          (p.index ?? 0) <= modes.images &&
          !seen.has(img.pathname);
        if (!valid) throw new RuleError("A photo points at the wrong file.");
        seen.add(img.pathname);
        const sizeBytes = await assertStored(img.pathname, img.mimeType, MEDIA_RULES.image.maxBytes);
        return { ...img, sizeBytes };
      }),
    );
  }

  return out.text || out.voice || out.images?.length ? out : null;
}

async function removeOrphans(manifest: Manifest): Promise<void> {
  const keep = new Set<string>([manifestPathname(manifest.submissionId)]);
  for (const answer of Object.values(manifest.answers)) {
    if (answer.voice) keep.add(answer.voice.pathname);
    for (const img of answer.images ?? []) keep.add(img.pathname);
  }
  const blobs = await listSubmissionBlobs(manifest.submissionId);
  const orphans = blobs.map((b) => b.pathname).filter((p) => !keep.has(p));
  if (orphans.length) await deletePathnames(orphans);
}
