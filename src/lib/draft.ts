import type { FounderId } from "@/config/founders";
import type { ImageFile, VoiceFile } from "@/lib/manifest";
import { createSubmissionId, isSubmissionId } from "@/lib/paths";

/**
 * One founder's in-progress questionnaire, mirrored to localStorage so a
 * refresh (or a phone locking mid-answer) never loses work. Each founder has
 * their own draft, so the two pages never mix answers even on a shared device.
 * Recordings and photos are stored as references to blobs that were already
 * uploaded, plus a tiny thumbnail per photo for the review screen.
 */

export type DraftImage = ImageFile & { thumb?: string };

/** One answer: any mix of writing, one recording and photos. */
export interface DraftAnswer {
  text?: string;
  voice?: VoiceFile;
  images?: DraftImage[];
}

export type DraftAnswers = Record<string, DraftAnswer>;

export interface Draft {
  version: 3;
  founder: FounderId;
  submissionId: string;
  step: number;
  email: string;
  /** Honeypot mirror. */
  website: string;
  answers: DraftAnswers;
}

const keyFor = (founder: FounderId) => `hod-questionnaire:draft:v3:${founder}`;

export function newDraft(founder: FounderId): Draft {
  return {
    version: 3,
    founder,
    submissionId: createSubmissionId(),
    step: 0,
    email: "",
    website: "",
    answers: {},
  };
}

export function loadDraft(founder: FounderId): Draft | null {
  try {
    const raw = window.localStorage.getItem(keyFor(founder));
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    if (
      draft?.version !== 3 ||
      draft.founder !== founder ||
      !isSubmissionId(draft.submissionId) ||
      typeof draft.answers !== "object"
    ) {
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft): boolean {
  try {
    window.localStorage.setItem(keyFor(draft.founder), JSON.stringify(draft));
    return true;
  } catch {
    // Quota exceeded: drop thumbnails, keep the answers.
    try {
      const lean: Draft = {
        ...draft,
        answers: Object.fromEntries(
          Object.entries(draft.answers).map(([id, v]) => [
            id,
            v.images ? { ...v, images: v.images.map((img) => ({ ...img, thumb: undefined })) } : v,
          ]),
        ),
      };
      window.localStorage.setItem(keyFor(draft.founder), JSON.stringify(lean));
      return true;
    } catch {
      return false;
    }
  }
}

export function clearDraft(founder: FounderId): void {
  try {
    window.localStorage.removeItem(keyFor(founder));
  } catch {
    /* storage unavailable */
  }
}

export function isAnswered(answer: DraftAnswer | undefined): boolean {
  if (!answer) return false;
  return !!answer.text?.trim() || !!answer.voice || (answer.images?.length ?? 0) > 0;
}
