"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Question } from "@/config/questions";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Check, Mic } from "@/components/Icons";
import { Button } from "@/components/ui";
import { isAnswered, type DraftAnswer, type DraftAnswers } from "@/lib/draft";
import { formatDuration } from "@/lib/format";
import { pad2, type SectionInfo } from "@/lib/sections";

function AnswerPreview({
  value,
  previews,
  label,
}: {
  value: DraftAnswer | undefined;
  previews: Record<string, string>;
  label: string;
}) {
  if (!value || !isAnswered(value)) return <p className="text-[0.9375rem] italic text-ink-3">No answer</p>;
  return (
    <div className="space-y-4">
      {value.text?.trim() && (
        <p className="whitespace-pre-wrap break-words text-[1.0625rem] leading-[1.7] text-ink">{value.text}</p>
      )}
      {value.voice &&
        (previews[value.voice.pathname] ? (
          <div className="max-w-[34rem]">
            <AudioPlayer
              src={previews[value.voice.pathname]}
              knownDuration={value.voice.durationSec}
              label={`voice note, ${label}`}
            />
          </div>
        ) : (
          <p className="flex items-center gap-2 text-ink-2">
            <Mic size={16} className="text-clay" /> Voice note saved · {formatDuration(value.voice.durationSec)}
          </p>
        ))}
      {value.images && value.images.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {value.images.map((img, i) => {
            const src = previews[img.pathname] ?? img.thumb;
            return (
              <li key={img.pathname}>
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object/data URLs
                  <img
                    src={src}
                    alt={`Photo ${i + 1}, ${label}`}
                    className="h-28 w-auto rounded-[2px] object-cover shadow-[0_1px_2px_rgb(36_32_30/0.08),0_8px_24px_-12px_rgb(36_32_30/0.25)]"
                  />
                ) : (
                  <span className="flex h-28 items-center gap-2 px-3 text-sm text-ink-2">
                    <Check size={16} className="text-clay" /> Photo {i + 1}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ReviewScreen({
  questions,
  sections,
  answers,
  previews,
  founderName,
  missing,
  submitting,
  error,
  onEdit,
  onSubmit,
}: {
  questions: Question[];
  sections: SectionInfo[];
  answers: DraftAnswers;
  previews: Record<string, string>;
  founderName: string;
  missing: Set<string>;
  submitting: boolean;
  error: string | null;
  onEdit: (questionIndex: number) => void;
  onSubmit: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), []);

  const indexById = new Map(questions.map((q, i) => [q.id, i]));
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const firstMissing = questions.findIndex((q) => missing.has(q.id));

  return (
    <main className="mx-auto w-full max-w-[46rem] px-6 pb-28 pt-[clamp(2.5rem,9vh,6rem)] sm:px-8">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="reveal-focus font-serif text-[clamp(2.25rem,1.6rem+3vw,3.5rem)] leading-[1.05] tracking-[-0.02em] outline-none"
      >
        Review your answers, {founderName}
      </h1>
      <p
        className="reveal mt-4 max-w-[52ch] text-[1.0625rem] text-ink-2"
        style={{ "--delay": "200ms" } as CSSProperties}
      >
        Read everything through once more. Edit any answer, then send it when you&rsquo;re ready.
      </p>
      <span
        aria-hidden="true"
        className="rule-draw mt-10 block h-px w-full bg-clay"
        style={{ "--delay": "300ms" } as CSSProperties}
      />

      <div className="reveal" style={{ "--delay": "450ms" } as CSSProperties}>
        {sections.map((section) => (
          <section key={section.number} className="mt-14" aria-labelledby={`review-section-${section.number}`}>
            {section.title && (
              <h2
                id={`review-section-${section.number}`}
                className="flex items-baseline gap-4 font-serif text-[1.5rem] text-ink"
              >
                <span className="text-clay tabular-nums">{pad2(section.number)}</span>
                {section.title}
              </h2>
            )}
            <ol className="mt-4">
              {section.questionIds.map((id) => {
                const index = indexById.get(id)!;
                const q = questions[index];
                const isMissing = missing.has(q.id);
                return (
                  <li key={id} className="border-t border-rule py-7">
                    <div className="flex items-start justify-between gap-6">
                      <p className="font-serif text-[1.125rem] leading-[1.4] text-ink">
                        <span className="mr-2 font-sans text-[0.8125rem] font-bold tabular-nums text-clay">
                          {index + 1}.
                        </span>
                        {q.prompt}
                      </p>
                      <Button
                        variant="quiet"
                        className="min-h-10 shrink-0 text-[0.875rem] underline decoration-rule underline-offset-4 hover:decoration-clay"
                        onClick={() => onEdit(index)}
                        aria-label={`Edit answer to question ${index + 1}`}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="mt-4 space-y-6">
                      <AnswerPreview
                        value={answers[q.id]}
                        previews={previews}
                        label={`Answer to question ${index + 1}`}
                      />
                      {isMissing && (
                        <p className="text-[0.9375rem] font-bold text-danger">This one needs an answer.</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}

        <div className="mt-6 border-t border-ink/80 pt-10">
          <p className="text-[1.0625rem] text-ink-2">
            <span className="font-bold tabular-nums text-ink">{answeredCount}</span> of {questions.length} questions
            answered.
            {missing.size > 0 && (
              <>
                {" "}
                <button
                  type="button"
                  className="text-danger underline underline-offset-4"
                  onClick={() => onEdit(firstMissing)}
                >
                  {missing.size === 1 ? "One required question" : `${missing.size} required questions`} still need
                  answers.
                </button>
              </>
            )}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Button variant="primary" onClick={onSubmit} disabled={submitting || missing.size > 0}>
              {submitting ? "Sending…" : "Send answers"}
            </Button>
            <p className="text-sm text-ink-2">You can&rsquo;t edit answers after sending.</p>
          </div>
          {error && (
            <p role="alert" className="mt-5 text-[0.9375rem] text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
