import type { CSSProperties } from "react";
import Link from "next/link";
import { FOUNDER_IDS, FOUNDER_NAMES } from "@/config/founders";
import { QUESTIONS } from "@/config/questions";
import { ArrowRight } from "@/components/Icons";
import { Wordmark } from "@/components/ui";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

/** The front door: each founder picks their name and answers on their own page. */
export default function Home() {
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

      <p className="reveal mt-10 max-w-[56ch] text-[1.0625rem] leading-[1.7]" style={delay(1050)}>
        Each of you answers the {QUESTIONS.length} questions on your own, in your own time and from wherever you are.
        Choose your name to begin. Your answers save on your device as you go.
      </p>

      <nav className="reveal mt-12" style={delay(1250)} aria-labelledby="who">
        <h2 id="who" className="font-serif text-[1.375rem] text-ink">
          Who&rsquo;s answering?
        </h2>
        <ul className="mt-6 border-b border-rule">
          {FOUNDER_IDS.map((id) => (
            <li key={id} className="border-t border-rule">
              <Link
                href={`/${id}`}
                className="group -mx-3 flex min-h-20 items-center justify-between gap-6 rounded-[2px] px-3 transition-colors hover:bg-paper-2"
              >
                <span className="font-serif text-[clamp(1.75rem,1.4rem+1.6vw,2.25rem)] leading-tight tracking-[-0.012em] text-ink transition-colors group-hover:text-clay-deep">
                  {FOUNDER_NAMES[id]}
                </span>
                <ArrowRight
                  size={20}
                  className="shrink-0 text-clay transition-transform duration-300 ease-out group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
