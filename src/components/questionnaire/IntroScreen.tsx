"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import type { PersonSlot } from "@/config/questions";
import { ArrowRight, Mic, StarMark } from "@/components/Icons";
import { Button, Wordmark } from "@/components/ui";
import type { Draft } from "@/lib/draft";
import { countWord } from "@/lib/sections";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

function Field({
  id,
  label,
  hint,
  ...input
}: { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="group">
      <label htmlFor={id} className="block text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-ink-2">
        {label}
        {hint && <span className="ml-2 font-normal normal-case tracking-normal text-ink-3">{hint}</span>}
      </label>
      <input
        id={id}
        className="mt-2 block h-11 w-full border-0 border-b border-rule bg-transparent px-0 text-[1.0625rem] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-clay"
        {...input}
      />
    </div>
  );
}

export function IntroScreen({
  draft,
  total,
  sectionCount,
  perPersonCount,
  defaultPeople,
  resumeStep,
  onChange,
  onBegin,
  onStartOver,
}: {
  draft: Draft;
  total: number;
  sectionCount: number;
  perPersonCount: number;
  defaultPeople: Record<PersonSlot, string>;
  resumeStep: number | null;
  onChange: (respondent: Draft["respondent"], website: string) => void;
  onBegin: () => void;
  onStartOver: () => void;
}) {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const { respondent } = draft;

  const setPerson = (slot: PersonSlot, value: string) =>
    onChange({ ...respondent, people: { ...respondent.people, [slot]: value } }, draft.website);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const email = respondent.email.trim();
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
        Rebrand, digital relaunch and founder-led LinkedIn
      </p>
      <span aria-hidden="true" className="rule-draw mt-10 block h-px w-full bg-clay" style={delay(800)} />

      <div className="reveal mt-10 max-w-[60ch] space-y-5 text-[1.0625rem] leading-[1.7]" style={delay(1050)}>
        <p>
          This questionnaire helps us understand the studio, the products, the two of you, and where you want to take
          the brand. Answers will shape the rebrand, the content on Instagram, Pinterest, YouTube and Meta ads, and each
          founder&rsquo;s LinkedIn voice.
        </p>
        <p className="flex gap-3 italic text-ink-2">
          <StarMark size={14} className="mt-[0.45em] shrink-0 text-clay" />
          <span>
            Questions marked with a star have two answer spaces, one for each founder, so we hear each view separately.
          </span>
        </p>
        <p className="flex gap-3 text-ink-2">
          <Mic size={16} className="mt-[0.35em] shrink-0 text-clay" />
          <span>
            Type your answers or record a voice note, whichever comes easier. Where pictures say it better, you can add
            photos too.
          </span>
        </p>
        <p className="text-ink-2">
          {total} questions in {countWord(sectionCount)} parts, {countWord(perPersonCount)} of them starred. Your
          answers save on this device as you go, so you can stop and come back.
        </p>
      </div>

      <form onSubmit={submit} className="reveal mt-14 space-y-8" style={delay(1250)} noValidate>
        <fieldset className="space-y-7">
          <legend className="mb-6 font-serif text-[1.375rem] text-ink">Who&rsquo;s answering</legend>
          <div className="grid gap-7 sm:grid-cols-2">
            <Field
              id="person-p1"
              label="First founder"
              placeholder={defaultPeople.p1}
              autoComplete="off"
              value={respondent.people.p1}
              onChange={(e) => setPerson("p1", e.target.value)}
            />
            <Field
              id="person-p2"
              label="Second founder"
              placeholder={defaultPeople.p2}
              autoComplete="off"
              value={respondent.people.p2}
              onChange={(e) => setPerson("p2", e.target.value)}
            />
          </div>
          <Field
            id="email"
            type="email"
            inputMode="email"
            label="Email"
            hint="optional"
            placeholder="So we can follow up"
            autoComplete="email"
            value={respondent.email}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            onChange={(e) => onChange({ ...respondent, email: e.target.value }, draft.website)}
          />
          {emailError && (
            <p id="email-error" role="alert" className="-mt-4 text-[0.9375rem] text-danger">
              {emailError}
            </p>
          )}
          {/* Honeypot: hidden from people, irresistible to bots. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={draft.website}
              onChange={(e) => onChange(respondent, e.target.value)}
            />
          </div>
        </fieldset>

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
    </main>
  );
}
