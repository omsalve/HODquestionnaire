/**
 * The two founders. Each answers the whole questionnaire on their own page at
 * `/{id}`, on their own device, and sends their own submission.
 *
 * The id names the page route (src/app/{id}/page.tsx), keys the browser draft
 * and is stored in every manifest, so never change one after answers exist.
 */
export const FOUNDER_IDS = ["mahek", "dhanshree"] as const;
export type FounderId = (typeof FOUNDER_IDS)[number];

export const FOUNDER_NAMES: Record<FounderId, string> = {
  mahek: "Mahek",
  dhanshree: "Dhanshree",
};

export function isFounderId(value: string): value is FounderId {
  return (FOUNDER_IDS as readonly string[]).includes(value);
}
