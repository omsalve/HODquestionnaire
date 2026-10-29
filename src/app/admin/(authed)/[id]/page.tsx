import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { DeleteSubmission } from "@/components/admin/DeleteSubmission";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ArrowLeft, Download } from "@/components/Icons";
import { buttonClass } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin-session";
import { readManifest } from "@/lib/blob";
import { formatDateTime } from "@/lib/export";
import { formatBytes, formatDuration } from "@/lib/format";
import type { AnswerParts, Manifest } from "@/lib/manifest";
import { isSubmissionId } from "@/lib/paths";
import { pad2 } from "@/lib/sections";

export const metadata: Metadata = { title: "Submission · House of Design" };

function mediaUrl(submissionId: string, pathname: string): string {
  return `/api/admin/media/${submissionId}/${encodeURIComponent(pathname.split("/").pop() ?? "")}`;
}

const SHADOW = "shadow-[0_1px_2px_rgb(36_32_30/0.08),0_8px_24px_-12px_rgb(36_32_30/0.25)]";

function Answer({ value, submissionId, label }: { value: AnswerParts; submissionId: string; label: string }) {
  const voice = value.voice;
  return (
    <div className="space-y-5">
      {value.text && (
        <p className="whitespace-pre-wrap break-words text-[1.0625rem] leading-[1.7] text-ink">{value.text}</p>
      )}
      {voice && (
        <div className="max-w-[34rem] space-y-2">
          <AudioPlayer
            src={mediaUrl(submissionId, voice.pathname)}
            knownDuration={voice.durationSec}
            label={`recording, ${label}`}
          />
          <p className="text-sm tabular-nums text-ink-3">
            Voice · {formatDuration(voice.durationSec)} · {voice.mimeType} · {formatBytes(voice.sizeBytes)} ·{" "}
            <a
              href={mediaUrl(submissionId, voice.pathname)}
              download
              className="text-ink-2 underline hover:text-clay-deep"
            >
              Download
            </a>
          </p>
        </div>
      )}
      {value.images && value.images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.images.map((img, i) => {
            const src = mediaUrl(submissionId, img.pathname);
            return (
              <li key={img.pathname}>
                <figure className="space-y-1.5">
                  <a href={src} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- authenticated private media */}
                    <img
                      src={src}
                      alt={`Photo ${i + 1}, ${label}`}
                      loading="lazy"
                      width={img.width}
                      height={img.height}
                      className={`aspect-[4/5] w-full rounded-[2px] bg-paper-2 object-cover ${SHADOW}`}
                    />
                  </a>
                  <figcaption className="text-xs tabular-nums text-ink-3">
                    {img.width}×{img.height} · {formatBytes(img.sizeBytes)}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function QuestionList({ manifest }: { manifest: Manifest }) {
  const sectionStarts = new Map<number, { number: number; title: string }>();
  manifest.questions.forEach((q, i) => {
    const prev = i > 0 ? manifest.questions[i - 1].section : undefined;
    if (q.section && q.section !== prev) sectionStarts.set(i, { number: sectionStarts.size + 1, title: q.section });
  });

  return (
    <ol className="mt-4">
      {manifest.questions.map((q, index) => {
        const answer = manifest.answers[q.id];
        const heading = sectionStarts.get(index);

        return (
          <li key={q.id}>
            {heading && (
              <h2 className="mt-14 flex items-baseline gap-4 font-serif text-[1.5rem] text-ink">
                <span className="tabular-nums text-clay">{pad2(heading.number)}</span>
                {heading.title}
              </h2>
            )}
            <article className="mt-4 border-t border-rule py-7">
              <p className="font-serif text-[1.1875rem] leading-[1.4] text-ink">
                <span className="mr-2 font-sans text-[0.8125rem] font-bold tabular-nums text-clay">{index + 1}.</span>
                {q.prompt}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-ink-3">
                {[
                  q.accepts.text && "text",
                  q.accepts.voice && "voice",
                  q.accepts.images > 0 && `up to ${q.accepts.images} photos`,
                  q.required && "required",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-5">
                {answer ? (
                  <Answer
                    value={answer}
                    submissionId={manifest.submissionId}
                    label={`${manifest.founder.name}'s answer to question ${index + 1}`}
                  />
                ) : (
                  <p className="text-[0.9375rem] italic text-ink-3">No answer</p>
                )}
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}

async function Detail({ params }: { params: PageProps<"/admin/[id]">["params"] }) {
  await requireAdminPage();
  const { id } = await params;
  const back = (
    <Link href="/admin" className={buttonClass("quiet", "min-h-10 text-sm")}>
      <ArrowLeft size={16} /> All submissions
    </Link>
  );

  if (!isSubmissionId(id)) {
    return (
      <>
        {back}
        <p className="mt-8 text-ink-2">That submission doesn&rsquo;t exist.</p>
      </>
    );
  }

  const result = await readManifest(id);
  if (result.status !== "ok") {
    return (
      <>
        {back}
        <h1 className="mt-8 font-serif text-[2rem]">No manifest</h1>
        <p className="mt-3 max-w-prose text-ink-2">
          {result.status === "missing"
            ? "This session uploaded media but was never submitted."
            : "The manifest for this submission couldn’t be read."}
        </p>
        <div className="mt-8">
          <DeleteSubmission submissionId={id} returnToList />
        </div>
      </>
    );
  }

  const m = result.manifest;
  const answered = m.questions.filter((q) => m.answers[q.id]).length;

  return (
    <>
      {back}
      <header className="mt-8">
        <h1 className="font-serif text-[clamp(2rem,1.6rem+2vw,3rem)] leading-[1.08] tracking-[-0.018em]">
          {m.founder.name}&rsquo;s answers
        </h1>
        <dl className="mt-5 grid gap-x-10 gap-y-3 text-[0.9375rem] sm:grid-cols-[auto_1fr]">
          <dt className="text-ink-3">Submitted</dt>
          <dd className="tabular-nums">{formatDateTime(m.submittedAt)}</dd>
          {m.email && (
            <>
              <dt className="text-ink-3">Email</dt>
              <dd>
                <a href={`mailto:${m.email}`} className="underline decoration-rule hover:decoration-clay">
                  {m.email}
                </a>
              </dd>
            </>
          )}
          <dt className="text-ink-3">Answered</dt>
          <dd className="tabular-nums">
            {answered} of {m.questions.length}
          </dd>
          <dt className="text-ink-3">Reference</dt>
          <dd className="break-all tabular-nums text-ink-2">{m.submissionId}</dd>
        </dl>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a href={`/api/admin/export/${m.submissionId}`} className={buttonClass("primary")} download>
            <Download size={16} /> Download ZIP
          </a>
          <DeleteSubmission submissionId={m.submissionId} returnToList />
        </div>
        <span aria-hidden="true" className="mt-10 block h-px w-full bg-clay" />
      </header>
      <QuestionList manifest={m} />
    </>
  );
}

export default function SubmissionPage({ params }: PageProps<"/admin/[id]">) {
  return (
    <main className="mx-auto w-full max-w-[48rem] px-6 pb-24 pt-8 sm:px-8">
      <Suspense fallback={<p className="mt-10 text-ink-2">Loading submission…</p>}>
        <Detail params={params} />
      </Suspense>
    </main>
  );
}
