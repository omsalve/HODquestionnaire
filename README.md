# House of Design: Discovery Questionnaire

A one-question-per-screen web version of the House of Design discovery questionnaire. Founders can type an answer, record a voice note on any question, and add photos where pictures help. Starred questions get one answer per founder. Admins review submissions and export each one as a ZIP to upload to Claude.

Stack: Next.js 16 (App Router, Cache Components), TypeScript, Tailwind v4 and zod, deployed on Vercel. The only storage is a **private Vercel Blob store**: no database and no paid services.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the three values
npm run dev
```

| Variable | What it is |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Read-write token of the private Blob store (see below). |
| `ADMIN_PASSWORD` | Password for `/admin`. |
| `ADMIN_SECRET` | 32+ random characters that sign the admin cookie. `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

No secret ever reaches the browser. Uploads use short-lived, path-scoped client tokens issued by `/api/upload`.

### Connecting a Blob store (Vercel dashboard)

1. Open the project in Vercel, go to **Storage**, choose **Create Database**, then **Blob**.
2. Set access to **Private**. This matters: media is only ever served through the authenticated admin proxy.
3. Connect the store to the project for all environments (Production, Preview and Development).
4. Check that **Settings → Environment Variables** now has `BLOB_READ_WRITE_TOKEN`. If it doesn't, copy it from the store's **.env.local** tab and add it. Client-upload tokens are signed with this token, so OIDC alone isn't enough.
5. Add `ADMIN_PASSWORD` and `ADMIN_SECRET`, then redeploy.
6. Locally: `vercel env pull .env.local`, or paste the values in by hand.

Blob on Vercel Pro stays within the plan's included usage at this volume. Client uploads incur no data-transfer charge.

### Testing on a phone

Recording and the camera need **https**. Use a Vercel preview deployment, or run `next dev --experimental-https` and open the LAN address. On plain `http://192.168…` the microphone is blocked, and the app says so.

## Editing questions

Edit `src/config/questions.ts`. Each entry looks like this:

```ts
{
  id: "q35-studio-walkthrough",  // stable slug, never reuse it for a different question
  type: "voice",                 // "text" | "voice" | "image"
  prompt: "Talk us through a corner of the studio you love.",
  helperText: "Up to three minutes.", // optional
  required: false,
  maxDurationSec: 180,           // recording limit, for voice questions and voice notes (default 180)
  multiline: true,               // text only
  voiceNote: false,              // text only: hide the "Record a voice note" button (shown by default)
  maxImages: 5,                  // allow up to N photos per answer (image questions default to 3)
  perPerson: true,               // ★ one answer slot per founder (any type)
  section: "Goals and wrap-up",  // consecutive questions with the same section form a chapter
}
```

- The array is validated with zod when the module loads. A malformed entry or a **duplicate id fails `npm run build`** with a readable error.
- Order in the array is the order on screen and in exports.
- `perPerson` slot labels default to `PEOPLE` in the same file. Respondents can type real names on the first screen.
- Every manifest stores a snapshot of all questions and each answered prompt. Editing a question later never breaks older submissions.
- There are commented voice and image examples at the end of the array.

**What each answer slot accepts.** Every answer slot (one per question, or one per founder on ★ questions) can combine:

| `type` | Shows | Also |
| --- | --- | --- |
| `text` | text box + **Record a voice note** button | photos if `maxImages` is set |
| `voice` | large record button | photos if `maxImages` is set |
| `image` | **Take a photo** (phones) / **Choose photos** | — |

The seeded questionnaire offers a voice note on all 34 questions, plus up to 5 photos on 7 (product range), 15 (admired studios), 17 (design signature), 18 (past projects) and 19 (how to show products). A required question counts as answered when its slot has writing, a recording or a photo.

## How it works

```
Browser ──(1) ask for upload token──▶ /api/upload   validates path, question, type, size; issues a 10-min token
   │
   └──(2) PUT media directly──▶ Vercel Blob (private)   submissions/{id}/{questionId}[.p1|.p2].{webm|m4a}
   │                                                    submissions/{id}/{questionId}[.p1|.p2].img{n}.jpg
   │
   └──(3) submit answers──▶ /api/submit   validates, HEADs every referenced blob, writes manifest.json once,
                                          and deletes media that was replaced or removed
```

- **Submission id** (`2026-10-25T14-03-11_x7k2p9`): created in the browser at the start of the session and sorts by time. It's stored in localStorage together with all drafts, so a refresh or a locked phone loses nothing. The draft is cleared after a successful submit.
- **Media** uploads when the respondent confirms it ("Save recording", or picking photos), with progress per file. Uploads give up after 3 minutes with a clear message instead of spinning. Photos are resized to a 2048px long edge and re-encoded as JPEG at 0.85, which also strips EXIF and GPS data. Several photos can be picked at once; each gets its own numbered file.
- **Voice** records with `audio/webm;codecs=opus` (Chrome, Firefox, Android) and falls back to `audio/mp4` (iOS Safari). The file extension follows the container the browser actually produced.
- **Spam:** a honeypot field, a minimum fill time, a submission-id age window, and strict path, type and size allowlists. A manifest can't be overwritten, and uploads stop once a submission is final.

### Manifest (`submissions/{id}/manifest.json`, schema in `src/lib/manifest.ts`)

```jsonc
{
  "version": 1,
  "submissionId": "2026-10-25T14-03-11_x7k2p9",
  "submittedAt": "2026-10-25T14:41:02.118Z",
  "respondent": { "name": "Riya & Ana", "email": "…", "people": { "p1": "Riya", "p2": "Ana" } },
  "userAgent": "…",
  "questions": [{ "id": "q01-origin-and-roles", "type": "text", "prompt": "…", "section": "…",
                  "perPerson": false, "required": false, "accepts": { "text": true, "voice": true, "images": 0 } }],
  "answers": {
    // Every answer slot is { text?, voice?, images? } — any combination.
    "q01-origin-and-roles": {
      "type": "text", "questionPrompt": "…", "text": "…",
      "voice": { "pathname": "submissions/…/q01-origin-and-roles.webm", "mimeType": "audio/webm",
                 "sizeBytes": 812345, "durationSec": 42.3 }
    },
    "q17-design-signature": {
      "type": "text", "questionPrompt": "…", "perPerson": true,
      "people": {
        "p1": { "person": "Riya", "text": "…",
                "images": [{ "pathname": "…/q17-design-signature.p1.img1.jpg", "mimeType": "image/jpeg",
                             "sizeBytes": 401234, "width": 2048, "height": 1536 }] },
        "p2": { "person": "Ana", "voice": { … } }
      }
    }
  }
}
```

## Admin

- `/admin`: password sign-in sets an httpOnly, HMAC-signed cookie that lasts 7 days. `src/proxy.ts` gates `/admin/*` and `/api/admin/*`, and every page and route checks again next to the read.
- The list shows submissions newest first (Blob `list` in folded mode) with date, respondent and answer count. Sessions that uploaded media but never submitted appear under **Started, never sent** and can be deleted.
- A submission's detail page shows every question in order with its answer. Audio and images stream through `/api/admin/media/{id}/{file}`, which supports Range requests for Safari.
- Each submission has **Download ZIP**, and the header has **Export all**. Both are streamed with `archiver`.
- **Delete** asks for an inline confirmation, then removes the manifest and all media.

### How exports map to questions

```
house-of-design-{id}.zip
├── manifest.json      the stored record, as above
├── answers.md                "## Q{n} [{type}] {prompt}", then the written answer and the
│                             filenames of any recording or photos for that answer
├── 01-voice.webm             media renamed by question number n (the position in the questionnaire)
├── 07-image-1.jpg            photos are numbered in the order they were added
├── 07-image-2.jpg
├── 02-voice-p1-riya.m4a      per-founder answers add the slot and name
└── 17-image-p2-ana-1.jpg
```

`Q{n}` in answers.md and the `NN-` prefix on files refer to the same question, so a file always sorts next to its question. Text answers live inline in answers.md (and in manifest.json), not as separate files. **Export all** puts each submission in its own `{submissionId}/` folder.

## Scripts

```bash
npm run dev        # local dev
npm run build      # production build (also validates questions)
npm run typecheck  # tsc --noEmit
npm run lint
```
