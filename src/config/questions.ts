import { z } from "zod";

/**
 * The questionnaire. Editing this file is how questions change — there is no CMS.
 *
 * - `id` is a stable slug. It names the media files in Blob storage and keys the
 *   answers in every manifest, so never reuse an id for a different question.
 *   Renaming an id orphans it from older submissions (their manifests keep a
 *   snapshot of the prompt, so they stay readable).
 * - `type` is the main way to answer. Every answer slot can hold text, a voice
 *   recording and photos, depending on the question:
 *     text   → a text box, plus a "Record a voice note" button (unless voiceNote: false)
 *     voice  → a recorder
 *     image  → photo upload (up to maxImages, default 3)
 *   Any question can also take photos by setting `maxImages`.
 * - Each founder answers every question on their own page (see founders.ts),
 *   so each question has exactly one answer per submission.
 * - `section` groups consecutive questions under a chapter heading.
 *
 * The array is validated with zod when this module loads, so a malformed entry
 * or a duplicate id fails `next build` loudly.
 */

export const QUESTION_TYPES = ["text", "voice", "image"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Time zone used for dates in the admin area. */
export const DISPLAY_TIME_ZONE = "Asia/Kolkata";

export const DEFAULT_MAX_DURATION_SEC = 180;
export const DEFAULT_MAX_IMAGES = 3;
export const MAX_IMAGES_LIMIT = 10;

const QuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must be a lowercase slug like q01-intro"),
    type: z.enum(QUESTION_TYPES),
    prompt: z.string().trim().min(1),
    helperText: z.string().trim().min(1).optional(),
    required: z.boolean(),
    maxDurationSec: z.number().int().min(5).max(600).optional(),
    multiline: z.boolean().optional(),
    /** Text questions: offer a voice note next to the text box. Defaults to true. */
    voiceNote: z.boolean().optional(),
    /** Allow up to this many photos per answer slot. Image questions default to DEFAULT_MAX_IMAGES. */
    maxImages: z.number().int().min(1).max(MAX_IMAGES_LIMIT).optional(),
    section: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((q, ctx) => {
    if (q.maxDurationSec !== undefined && q.type !== "voice") {
      ctx.addIssue({ code: "custom", message: `${q.id}: maxDurationSec only applies to voice questions` });
    }
    if (q.voiceNote !== undefined && q.type !== "text") {
      ctx.addIssue({ code: "custom", message: `${q.id}: voiceNote only applies to text questions` });
    }
    if (q.multiline !== undefined && q.type !== "text") {
      ctx.addIssue({ code: "custom", message: `${q.id}: multiline only applies to text questions` });
    }
  });

export type Question = z.infer<typeof QuestionSchema>;

export interface AnswerModes {
  text: boolean;
  voice: boolean;
  /** Max photos per answer slot; 0 means none. */
  images: number;
}

/** Which parts an answer slot accepts for this question. */
export function answerModes(q: Pick<Question, "type" | "voiceNote" | "maxImages">): AnswerModes {
  return {
    text: q.type === "text",
    voice: q.type === "voice" || (q.type === "text" && q.voiceNote !== false),
    images: q.type === "image" ? (q.maxImages ?? DEFAULT_MAX_IMAGES) : (q.maxImages ?? 0),
  };
}

const QuestionnaireSchema = z
  .array(QuestionSchema)
  .min(1)
  .superRefine((questions, ctx) => {
    const seen = new Set<string>();
    for (const q of questions) {
      if (seen.has(q.id)) ctx.addIssue({ code: "custom", message: `Duplicate question id "${q.id}"` });
      seen.add(q.id);
    }
  });

const S = {
  founders: "Founders and partnership",
  business: "Business and products",
  clients: "Clients",
  brand: "Brand today and next",
  channels: "Brand channels: Instagram, Pinterest, YouTube, Meta ads",
  linkedin: "Founder-led LinkedIn",
  live: "Content from live projects",
  goals: "Goals and wrap-up",
} as const;

const RAW_QUESTIONS: z.input<typeof QuestionSchema>[] = [
  // 01 Founders and partnership
  {
    id: "q01-origin-and-roles",
    type: "text",
    section: S.founders,
    prompt:
      "How did the two of you start the studio, and how do you split the work today: design, clients, sourcing, execution, finance?",
    required: false,
    multiline: true,
  },
  {
    id: "q02-why-we-exist",
    type: "text",
    section: S.founders,
    prompt: "In one line, why does this studio exist, and what's the real reason clients choose you over others?",
    required: true,
    multiline: true,
  },
  {
    id: "q03-face-and-camera",
    type: "text",
    section: S.founders,
    prompt:
      "Which of you is the natural client-facing face? How comfortable is each of you on camera, and how much of the “two best friends, women-led” story are you happy to share publicly?",
    required: false,
    multiline: true,
  },

  // 02 Business and products
  {
    id: "q04-work-mix",
    type: "text",
    section: S.business,
    prompt:
      "What does your work mix look like: project types, typical size, your sweet spot, and how many projects run in parallel?",
    required: false,
    multiline: true,
  },
  {
    id: "q05-leads-and-cities",
    type: "text",
    section: S.business,
    prompt: "Where do leads come from (rough % split)? Which cities do you serve, and where do you want to grow?",
    required: false,
    multiline: true,
  },
  {
    id: "q06-bottlenecks",
    type: "text",
    section: S.business,
    prompt: "What's your biggest bottleneck right now, and when you lose a client, why does it usually happen?",
    required: false,
    multiline: true,
  },
  {
    id: "q07-product-range",
    type: "text",
    section: S.business,
    prompt:
      "Walk us through your product range: categories, whether they're made in-house, with partners, or curated, price bands, and your 3–5 hero products.",
    required: false,
    multiline: true,
    maxImages: 5,
    helperText: "Add photos of your hero products if you have them.",
  },
  {
    id: "q08-affordable-luxury",
    type: "text",
    section: S.business,
    prompt: "What does “affordable luxury” mean to you, and what makes your products feel luxury at that price?",
    required: true,
    multiline: true,
  },
  {
    id: "q09-product-line",
    type: "text",
    section: S.business,
    prompt:
      "Should products stay within projects or become a standalone line (D2C or retail)? If standalone, should they carry the same brand or a separate label?",
    required: false,
    multiline: true,
  },

  // 03 Clients
  {
    id: "q10-clients",
    type: "text",
    section: S.clients,
    prompt:
      "Describe your best client so far, the one you'd never take again, and who you want more of in the next 12 months.",
    required: false,
    multiline: true,
  },

  // 04 Brand today and next
  {
    id: "q11-name-and-identity",
    type: "text",
    section: S.brand,
    prompt:
      "Looking at your current name and identity: what's working, what feels outdated, what's non-negotiable, and are you open to a name change?",
    required: true,
    multiline: true,
  },
  {
    id: "q12-client-phrases",
    type: "text",
    section: S.brand,
    prompt: "How do clients describe you to others? Share actual phrases if you remember them.",
    required: false,
    multiline: true,
  },
  {
    id: "q13-words-and-references",
    type: "text",
    section: S.brand,
    prompt:
      "Give us three words you want associated with the studio and three you never want. If the studio were a hotel or a fashion label, which would it be?",
    required: true,
    multiline: true,
  },
  {
    id: "q14-studio-or-lifestyle",
    type: "text",
    section: S.brand,
    prompt:
      "Should the brand lean “design studio” (expertise, process) or “lifestyle brand” (aspiration, products, living)?",
    required: false,
    multiline: true,
  },
  {
    id: "q15-admired-and-competitors",
    type: "text",
    section: S.brand,
    prompt:
      "Which studios or interior brands, Indian or global, do you admire, including their feeds and websites? Who are your direct competitors that you need to look different from?",
    required: false,
    multiline: true,
    maxImages: 5,
    helperText: "Screenshots of feeds or websites you admire are welcome.",
  },

  // 05 Brand channels
  {
    id: "q16-channels-today",
    type: "text",
    section: S.channels,
    prompt:
      "Which channels are active today, including each founder's LinkedIn? Who runs them, how often do you post, and what has performed best? Is your Instagram attracting clients or mostly other designers?",
    required: false,
    multiline: true,
  },
  {
    id: "q17-design-signature",
    type: "text",
    section: S.channels,
    prompt:
      "What's your design signature, the recurring materials, palettes, forms, or styling choices that should show up in every post?",
    required: true,
    multiline: true,
    maxImages: 5,
    helperText: "Add photos of the materials, palettes or spaces that show it.",
  },
  {
    id: "q18-past-projects",
    type: "text",
    section: S.channels,
    prompt:
      "Which past projects represent the studio you want to become, and which should never appear again? What archive exists: photos, videos, before-and-after?",
    required: false,
    multiline: true,
    maxImages: 5,
    helperText: "Add photos of the projects you mean.",
  },
  {
    id: "q19-showing-products",
    type: "text",
    section: S.channels,
    prompt:
      "How should products be shown: in finished spaces, as styled shoots, as craft close-ups, or as a catalogue?",
    required: false,
    multiline: true,
    maxImages: 5,
    helperText: "Reference images help, yours or anyone else’s.",
  },
  {
    id: "q20-pinterest-youtube",
    type: "text",
    section: S.channels,
    prompt:
      "What role should Pinterest play (a reference library clients save from)? And YouTube (walkthroughs, project films, explainers, product stories)?",
    required: false,
    multiline: true,
  },
  {
    id: "q21-ads-and-website",
    type: "text",
    section: S.channels,
    prompt:
      "What should Meta ads and the website drive first: enquiries, product sales, or portfolio views? Which offering should lead, and what's the smallest project worth acquiring?",
    required: false,
    multiline: true,
  },
  {
    id: "q22-founders-on-channels",
    type: "text",
    section: S.channels,
    prompt: "Should the founders appear on brand channels at all, or should those stay purely about the work?",
    required: false,
    multiline: true,
  },

  // 06 Founder-led LinkedIn
  {
    id: "q23-strong-opinions",
    type: "text",
    section: S.linkedin,
    prompt:
      "What does each of you have strong opinions on? What do you know that clients don't: material trends, cost myths, vendor realities, why timelines slip?",
    required: true,
    multiline: true,
  },
  {
    id: "q24-territory",
    type: "text",
    section: S.linkedin,
    prompt: "How would you split territory between you? For example, one creative voice and one business voice.",
    required: true,
    multiline: true,
  },
  {
    id: "q25-linkedin-audience",
    type: "text",
    section: S.linkedin,
    prompt:
      "Who should be reading: HNI homeowners, CXOs, architects, developers, hospitality brands, corporate clients, vendors, future hires?",
    required: false,
    multiline: true,
  },
  {
    id: "q26-formats-and-time",
    type: "text",
    section: S.linkedin,
    prompt:
      "Which formats suit you? Should posts be ghostwritten from recorded sessions or drafted by you? How much time can each of you give per month?",
    required: false,
    multiline: true,
  },
  {
    id: "q27-two-year-perception",
    type: "text",
    section: S.linkedin,
    prompt: "In two years, do you want to be seen primarily as designers, entrepreneurs, or industry voices?",
    required: false,
    multiline: true,
  },

  // 07 Content from live projects
  {
    id: "q28-shootable-projects",
    type: "text",
    section: S.live,
    prompt:
      "Which current and upcoming projects can we shoot (timelines, stages, locations)? Do your contracts and clients allow it, including testimonials?",
    required: false,
    multiline: true,
  },
  {
    id: "q29-process-access",
    type: "text",
    section: S.live,
    prompt:
      "Which parts of your process can we document: material shortlisting, mood boards, vendor and factory visits, presentations, site progress? Which vendors and craftspeople would be comfortable on camera?",
    required: false,
    multiline: true,
  },
  {
    id: "q30-off-limits",
    type: "text",
    section: S.live,
    prompt:
      "What's off-limits across all content: pricing, suppliers, margins, specific clients, competitors, personal life?",
    required: false,
    multiline: true,
  },
  {
    id: "q31-shoot-logistics",
    type: "text",
    section: S.live,
    prompt:
      "How much notice do you get before key on-site moments, and who will be our on-ground point of contact for shoot days?",
    required: false,
    multiline: true,
  },

  // 08 Goals and wrap-up
  {
    id: "q32-success",
    type: "text",
    section: S.goals,
    prompt:
      "What does success look like at 6 months and at 12 months? What matters most right now: higher-value projects, more volume, product sales, or reputation?",
    required: true,
    multiline: true,
  },
  {
    id: "q33-relaunch-and-signoff",
    type: "text",
    section: S.goals,
    prompt: "Is there a relaunch date to anchor to? Who signs off on creative: both of you jointly, or split by area?",
    required: false,
    multiline: true,
  },
  {
    id: "q34-unsaid",
    type: "text",
    section: S.goals,
    prompt:
      "What do you want the studio to be known for that you haven't said out loud yet, and is there anything we didn't ask?",
    required: false,
    multiline: true,
  },

  // Voice and image questions use the same shape, for example:
  // {
  //   id: "q35-studio-walkthrough",
  //   type: "voice",
  //   section: S.goals,
  //   prompt: "Talk us through a corner of the studio you love.",
  //   helperText: "Up to three minutes. Speak freely.",
  //   required: false,
  //   maxDurationSec: 180,
  // },
  // {
  //   id: "q36-favourite-room",
  //   type: "image",
  //   section: S.goals,
  //   prompt: "Share a photo of a room that feels most like you.",
  //   required: false,
  //   maxImages: 5,
  // },
  // A text question can turn off its voice-note button with `voiceNote: false`.
];

function parseQuestions(raw: unknown): Question[] {
  const result = QuestionnaireSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid questionnaire in src/config/questions.ts\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const QUESTIONS: Question[] = parseQuestions(RAW_QUESTIONS);

const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return BY_ID.get(id);
}
