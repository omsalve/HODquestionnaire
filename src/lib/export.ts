import { DISPLAY_TIME_ZONE } from "@/config/questions";
import type { AnswerParts, Manifest } from "@/lib/manifest";
import { formatDuration } from "@/lib/format";

export { formatDuration };

/*
 * How an export maps to the questionnaire. Each submission is one founder's answers:
 *
 *   manifest.json        the exact stored record (structured, versioned)
 *   answers.md           every question in order: "## Q{n} [{type}] {prompt}" followed by the
 *                        written answer and the filenames of any recording or photos
 *   NN-voice.webm        media renamed by question number, so files sort in question order.
 *   NN-image-1.jpg       Photos are numbered in the order they were added.
 */

export interface ExportEntry {
  questionNumber: number;
  questionId: string;
  kind: "voice" | "image";
  /** 1-based photo position within the answer; undefined for voice. */
  position?: number;
  pathname: string;
  fileName: string;
}

export function formatDateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(typeof iso === "string" ? new Date(iso) : iso);
}

export function mediaEntries(manifest: Manifest): ExportEntry[] {
  const entries: ExportEntry[] = [];
  manifest.questions.forEach((q, index) => {
    const answer = manifest.answers[q.id];
    if (!answer) return;
    const questionNumber = index + 1;
    const n = String(questionNumber).padStart(2, "0");
    if (answer.voice) {
      const ext = answer.voice.mimeType === "audio/mp4" ? "m4a" : "webm";
      entries.push({
        questionNumber,
        questionId: q.id,
        kind: "voice",
        pathname: answer.voice.pathname,
        fileName: `${n}-voice.${ext}`,
      });
    }
    answer.images?.forEach((img, i) => {
      entries.push({
        questionNumber,
        questionId: q.id,
        kind: "image",
        position: i + 1,
        pathname: img.pathname,
        fileName: `${n}-image-${i + 1}.jpg`,
      });
    });
  });
  return entries;
}

function describeAnswer(parts: AnswerParts, files: Map<string, string>): string {
  const out: string[] = [];
  if (parts.text) out.push(parts.text);
  if (parts.voice) {
    out.push(
      `Voice recording: \`${files.get(parts.voice.pathname)}\` (${formatDuration(parts.voice.durationSec)}, ${parts.voice.mimeType})`,
    );
  }
  if (parts.images?.length) {
    const list = parts.images.map((img) => `\`${files.get(img.pathname)}\` (${img.width}×${img.height})`).join(", ");
    out.push(`${parts.images.length === 1 ? "Photo" : "Photos"}: ${list}`);
  }
  return out.length ? out.join("\n\n") : "_No answer._";
}

export function answersMarkdown(manifest: Manifest): string {
  const files = new Map(mediaEntries(manifest).map((e) => [e.pathname, e.fileName]));
  const { founder } = manifest;
  const answered = manifest.questions.filter((q) => manifest.answers[q.id]).length;

  const lines: string[] = [
    `# House of Design — Discovery Questionnaire: ${founder.name}`,
    "",
    `- Founder: ${founder.name}`,
    `- Submission: ${manifest.submissionId}`,
    `- Submitted: ${formatDateTime(manifest.submittedAt)} (${DISPLAY_TIME_ZONE}) — ${manifest.submittedAt}`,
  ];
  if (manifest.email) lines.push(`- Email: <${manifest.email}>`);
  lines.push(
    `- Answered: ${answered} of ${manifest.questions.length} questions`,
    "",
    `Every answer here is ${founder.name}'s own. The other founder answers the same questionnaire separately,`,
    "in a submission of their own. Any answer may combine writing, a voice recording and photos.",
    "Recordings and photos are attached as files named by question number; listen to recordings for the full answer.",
  );

  let section: string | undefined;
  manifest.questions.forEach((q, index) => {
    if (q.section && q.section !== section) {
      section = q.section;
      lines.push("", "---", "", `# ${section}`);
    }
    lines.push("", `## Q${index + 1} [${q.type}] ${q.prompt}`);

    const answer = manifest.answers[q.id];
    if (answer && answer.questionPrompt !== q.prompt) lines.push("", `_Prompt as answered: ${answer.questionPrompt}_`);
    lines.push("", answer ? describeAnswer(answer, files) : "_No answer._");
  });

  return `${lines.join("\n")}\n`;
}
