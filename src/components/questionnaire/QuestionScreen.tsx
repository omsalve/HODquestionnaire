"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { answerModes, DEFAULT_MAX_DURATION_SEC, type Question } from "@/config/questions";
import { ImageAnswer } from "@/components/answers/ImageAnswer";
import { TextAnswer } from "@/components/answers/TextAnswer";
import { VoiceAnswer } from "@/components/answers/VoiceAnswer";
import { ArrowLeft, ArrowRight } from "@/components/Icons";
import { RevealText } from "@/components/questionnaire/RevealText";
import { Button } from "@/components/ui";
import type { DraftAnswer } from "@/lib/draft";

export function QuestionScreen({
  question,
  number,
  submissionId,
  answer,
  previews,
  autoFocus,
  nextLabel,
  error,
  canGoBack,
  onChange,
  onPreview,
  onBusy,
  onNext,
  onBack,
}: {
  question: Question;
  number: number;
  submissionId: string;
  answer: DraftAnswer;
  /** Local object URLs keyed by blob pathname. */
  previews: Record<string, string>;
  autoFocus: boolean;
  nextLabel: string;
  error: string | null;
  canGoBack: boolean;
  onChange: (update: (prev: DraftAnswer) => DraftAnswer) => void;
  onPreview: (pathname: string, url: string | undefined) => void;
  onBusy: (key: string, busy: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const modes = answerModes(question);
  const wordCount = question.prompt.split(/\s+/).length;
  // The answer area arrives as the last words of the prompt settle.
  const answerDelay = Math.min(wordCount, 36) * 26 + 260;
  const who = "this question";

  useEffect(() => {
    if (!autoFocus || !modes.text) headingRef.current?.focus({ preventScroll: true });
  }, [autoFocus, modes.text]);

  const voice = modes.voice && (
    <VoiceAnswer
      submissionId={submissionId}
      questionId={question.id}
      label={who}
      variant={question.type === "voice" ? "primary" : "note"}
      maxDurationSec={question.maxDurationSec ?? DEFAULT_MAX_DURATION_SEC}
      value={answer.voice}
      previewUrl={answer.voice ? previews[answer.voice.pathname] : undefined}
      onSaved={(v, url) => {
        onPreview(v.pathname, url);
        onChange((prev) => ({ ...prev, voice: v }));
      }}
      onRemove={() => onChange((prev) => ({ ...prev, voice: undefined }))}
      onBusyChange={(busy) => onBusy("voice", busy)}
    />
  );
  const photos = modes.images > 0 && (
    <ImageAnswer
      submissionId={submissionId}
      questionId={question.id}
      label={who}
      max={modes.images}
      variant={question.type === "image" ? "primary" : "note"}
      images={answer.images ?? []}
      previews={previews}
      onAdd={(img, url) => {
        onPreview(img.pathname, url);
        onChange((prev) => ({
          ...prev,
          images: [...(prev.images ?? []).filter((i) => i.pathname !== img.pathname), img],
        }));
      }}
      onRemove={(pathname) => {
        onPreview(pathname, undefined);
        onChange((prev) => ({
          ...prev,
          images: (prev.images ?? []).filter((i) => i.pathname !== pathname),
        }));
      }}
      onBusyChange={(busy) => onBusy("images", busy)}
    />
  );

  return (
    <article className="mx-auto w-full max-w-[42rem] px-6 pb-24 pt-[clamp(2.5rem,9vh,6rem)] sm:px-8">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-serif text-[clamp(1.5rem,1.05rem+1.9vw,2.125rem)] leading-[1.24] tracking-[-0.008em] text-pretty text-ink outline-none"
      >
        <span className="reveal mr-[0.3em] inline-block tabular-nums text-clay">{number}.</span>
        <RevealText text={question.prompt} delayMs={80} />
      </h1>

      {question.helperText && (
        <p
          className="reveal mt-5 max-w-prose text-[0.9375rem] text-ink-2"
          style={{ "--delay": `${answerDelay - 120}ms` } as CSSProperties}
        >
          {question.helperText}
        </p>
      )}

      <div className="reveal mt-10" style={{ "--delay": `${answerDelay}ms` } as CSSProperties}>
        {modes.text ? (
          <>
            <TextAnswer
              id={`answer-${question.id}`}
              label={question.prompt}
              multiline={question.multiline ?? true}
              value={answer.text ?? ""}
              autoFocus={autoFocus}
              placeholder={modes.voice ? "Write your answer, or record a voice note below…" : undefined}
              onChange={(text) => onChange((prev) => ({ ...prev, text }))}
              onSubmitShortcut={onNext}
            />
            {(voice || photos) && (
              <div className="mt-5 flex flex-wrap items-start gap-x-3 gap-y-6">
                {voice}
                {photos}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-wrap items-start gap-x-3 gap-y-8">
            {voice}
            {photos}
          </div>
        )}

        <nav className="mt-14 flex items-center justify-between gap-4" aria-label="Question navigation">
          <Button variant="quiet" onClick={onBack} disabled={!canGoBack}>
            <ArrowLeft size={16} /> Back
          </Button>
          <div className="flex items-center gap-5">
            <span className="hidden text-xs tracking-wide text-ink-3 pointer-fine:inline" aria-hidden="true">
              Ctrl / ⌘ + Enter
            </span>
            <Button variant="primary" onClick={onNext}>
              {nextLabel} <ArrowRight size={16} />
            </Button>
          </div>
        </nav>
        {error && (
          <p role="alert" className="mt-5 text-right text-[0.9375rem] text-danger">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
