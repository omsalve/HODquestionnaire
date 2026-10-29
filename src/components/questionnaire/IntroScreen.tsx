"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Mic } from "@/components/Icons";
import { Button, Wordmark } from "@/components/ui";
import type { Draft } from "@/lib/draft";
import { countWord } from "@/lib/sections";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

export function IntroScreen({
  draft,
  founderName,
  otherFounderName,
  total,
  sectionCount,
  resumeStep,
  onChange,
  onBegin,
  onStartOver,
}: {
  draft: Draft;
  founderName: string;
  otherFounderName: string;
  total: number;
  sectionCount: number;
  resumeStep: number | null;
  onChange: (email: string, website: string) => void;
  onBegin: () => void;
  onStartOver: () => void;
}) {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const email = draft.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("That email address doesn't look right. Check it, or leave it blank.");
      return;
    }
    setEmailError(null);
    onBegin();
  };

  return (
    <main className="mx-auto w-full max-w-[42rem] px-6 pb-24 pt-[clamp(3rem,14vh,8rem)] sm:px-8">
      <Wordmark className="wordmark-in block" />
      <h1
        className="reveal-focus mt-5 font-serif text-[clamp(2.5rem,1.6rem+4.2vw,4.25rem)] leading-[1.02] tracking-[-0.022em] text-ink"
        style={delay(350)}
      >
        Discovery Questionnaire
      </h1>
      <p className="reveal mt-4 text-[1.0625rem] text-ink-2" style={delay(650)}>
        <span className="font-bold uppercase tracking-[0.14em] text-[0.8125rem] text-clay">{founderName}</span>
        <span className="mx-3 text-ink-3" aria-hidden="true">
          ·
        </span>
        Rebrand, digital relaunch and founder-led LinkedIn
      </p>
      <span aria-hidden="true" className="rule-draw mt-10 block h-px w-full bg-clay" style={delay(800)} />

      <div className="reveal mt-10 max-w-[60ch] space-y-5 text-[1.0625rem] leading-[1.7]" style={delay(1050)}>
        <p>
          Hi {founderName}. This questionnaire helps us understand the studio, the products, the two of you, and where
          you want to take the brand. Answers will shape the rebrand, the content on Instagram, Pinterest, YouTube and
          Meta ads, and each founder&rsquo;s LinkedIn voice.
        </p>
        <p className="text-ink-2">
          This copy is yours alone. {otherFounderName} answers the same questions on their own page, so answer in your
          own words, from your own point of view. Neither of you sees the other&rsquo;s answers.
        </p>
        <p className="flex gap-3 text-ink-2">
          <Mic size={16} className="mt-[0.35em] shrink-0 text-clay" />
          <span>
            Type your answers or record a voice note, whichever comes easier. Where pictures say it better, you can add
            photos too.
          </span>
        </p>
        <p className="text-ink-2">
          {total} questions in {countWord(sectionCount)} parts. Your answers save on this device as you go, so you can
          stop and come back.
        </p>
      </div>

      <form onSubmit={submit} className="reveal mt-14 space-y-8" style={delay(1250)} noValidate>
        <div>
          <label htmlFor="email" className="block text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-ink-2">
            Your email
            <span className="ml-2 font-normal normal-case tracking-normal text-ink-3">optional</span>
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            placeholder="So we can follow up"
            autoComplete="email"
            value={draft.email}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            onChange={(e) => onChange(e.target.value, draft.website)}
            className="mt-2 block h-11 w-full border-0 border-b border-rule bg-transparent px-0 text-[1.0625rem] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-clay"
          />
          {emailError && (
            <p id="email-error" role="alert" className="mt-3 text-[0.9375rem] text-danger">
              {emailError}
            </p>
          )}
        </div>
        {/* Honeypot: hidden from people, irresistible to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={draft.website}
            onChange={(e) => onChange(draft.email, e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
          <Button type="submit" variant="primary">
            {resumeStep ? `Continue from question ${resumeStep}` : "Begin"} <ArrowRight size={16} />
          </Button>
          {resumeStep &&
            (confirmReset ? (
              <span className="flex items-center gap-4 text-[0.9375rem]">
                <span className="text-ink-2">Clear every answer?</span>
                <Button variant="quiet" className="text-danger" onClick={onStartOver}>
                  Yes, start over
                </Button>
                <Button variant="quiet" onClick={() => setConfirmReset(false)}>
                  Keep them
                </Button>
              </span>
            ) : (
              <Button variant="quiet" onClick={() => setConfirmReset(true)}>
                Start over
              </Button>
            ))}
        </div>
      </form>

      <p className="reveal mt-16 text-[0.9375rem] text-ink-3" style={delay(1400)}>
        Not {founderName}?{" "}
        <Link href="/" className="text-ink-2 underline decoration-rule underline-offset-4 hover:decoration-clay">
          Choose your name
        </Link>
      </p>
    </main>
  );
}
