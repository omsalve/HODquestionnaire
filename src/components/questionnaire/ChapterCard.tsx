"use client";

import { useEffect, type AnimationEvent, type CSSProperties } from "react";
import { countWord, pad2, type SectionInfo } from "@/lib/sections";

const HOLD_MS = 1500;

/**
 * Between sections, a full-page title card: the chapter number and name focus
 * in, a clay rule draws beneath, then the card wipes upward and the first
 * question of the chapter arrives. Any key or tap skips it.
 */
export function ChapterCard({ section, onDone }: { section: SectionInfo; onDone: () => void }) {
  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    // Safety net in case animationend never fires (backgrounded tab).
    const t = window.setTimeout(onDone, HOLD_MS + 1600);
    return () => {
      window.removeEventListener("keydown", skip);
      window.clearTimeout(t);
    };
  }, [onDone]);

  const onAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.animationName === "wipe-up") onDone();
  };

  const n = section.questionIds.length;

  return (
    <div
      className="chapter-card fixed inset-0 z-50 flex items-center bg-paper"
      style={{ "--hold": `${HOLD_MS}ms` } as CSSProperties}
      onAnimationEnd={onAnimationEnd}
      onClick={onDone}
      role="presentation"
    >
      <div className="mx-auto w-full max-w-[42rem] px-6 sm:px-8">
        <p
          className="reveal-focus font-serif text-[clamp(4rem,14vw,6rem)] leading-none tracking-[-0.02em] text-clay tabular-nums"
          aria-hidden="true"
        >
          {pad2(section.number)}
        </p>
        <h2
          className="reveal-focus mt-5 max-w-[18ch] font-serif text-[clamp(1.875rem,5vw,3rem)] leading-[1.1] tracking-[-0.012em] text-balance text-ink"
          style={{ "--delay": "160ms" } as CSSProperties}
        >
          {section.title}
        </h2>
        <span
          aria-hidden="true"
          className="rule-draw mt-9 block h-px w-full bg-clay"
          style={{ "--delay": "320ms" } as CSSProperties}
        />
        <p className="reveal mt-5 text-[0.9375rem] text-ink-2" style={{ "--delay": "520ms" } as CSSProperties}>
          {n === 1 ? "One question" : `${countWord(n).replace(/^\w/, (c) => c.toUpperCase())} questions`}
          {section.perPersonCount > 0 &&
            ` · ${section.perPersonCount === 1 ? "one" : countWord(section.perPersonCount)} answered by each founder`}
        </p>
      </div>
    </div>
  );
}
