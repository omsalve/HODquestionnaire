# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind v4 on Vercel Pro. The user asked for Next 15 and then chose to keep the existing Next 16 scaffold. Storage is a private Vercel Blob store only: no database and no paid services (hard zero-cost constraint).

## Users

- **Respondents:** the two founders of House of Design, an interior design studio run by two women who are best friends. They answer the studio's discovery questionnaire before a rebrand, digital relaunch and founder-led LinkedIn engagement. They are not in the same place, so each answers on their own: the landing page asks who is answering and sends them to `/mahek` or `/dhanashree`. They may answer on a phone or a laptop, possibly in more than one sitting.
- **Admin:** the agency team running the engagement. They review submissions, then export each one as a ZIP to upload to Claude for synthesis.

## Product Purpose

A web version of the House of Design Discovery Questionnaire (originally a 5-page PDF). Each question is answered as text, voice or an image, and every answer stays linked to its question. Each founder answers the whole questionnaire separately and sends their own submission. Success: both founders complete it without friction, and the agency gets a clean, LLM-readable export per founder.

## Operating Context

- 34 questions in 8 sections, copied from the PDF; 8 of them are required. Every founder answers all of them.
- The founders are listed in `src/config/founders.ts`; each has a page at `src/app/{id}/page.tsx`.
- Questions are edited in `src/config/questions.ts`. There is no CMS.
- Exports (`manifest.json`, `answers.md` and ordered media files) are uploaded to Claude.

## Capabilities and Constraints

- Private Blob store; media is uploaded directly from the client and never passes through a function body.
- Drafts persist in localStorage, one per founder. No respondent auth. The admin area is protected by a single password.
- Must work on iOS Safari and Android Chrome (voice recording and the camera).

## Brand Commitments

- The visual language of the original PDF: an old-style serif for headings, a humanist sans (Lato) for body text, one muted clay-brown accent on white, numbered sections and dotted answer lines. (The PDF's ★ per-founder marker is gone: every answer is now one founder's.)
- The user asked for a minimal design with "a cinematic animation touch".

## Evidence on Hand

- House_of_Design_Discovery_Questionnaire.pdf (question copy and visual reference). No logo file, photography or testimonials have been supplied.

## Product Principles

1. Feel like the same document the founders already saw, just alive.
2. Never lose an answer: autosave, upload on confirm, verify before submit.
3. Each founder's voice stays separate: two pages, two drafts, two submissions.
4. Exports are written for an LLM reader first.
