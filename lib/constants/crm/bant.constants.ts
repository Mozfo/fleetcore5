/**
 * BANT qualification constants — shared between LeadBantSection and drag dialogs.
 */

export interface BantOption {
  value: string;
  label: string;
  qualifying: boolean;
}

export const BANT_BUDGET_OPTIONS: BantOption[] = [
  { value: "confirmed", label: "Confirmed", qualifying: true },
  { value: "planned", label: "Planned", qualifying: true },
  { value: "no_budget", label: "No Budget", qualifying: false },
  { value: "unknown", label: "Unknown", qualifying: false },
];

export const BANT_AUTHORITY_OPTIONS: BantOption[] = [
  { value: "decision_maker", label: "Decision Maker", qualifying: true },
  { value: "influencer", label: "Influencer", qualifying: false },
  { value: "user", label: "User", qualifying: false },
  { value: "unknown", label: "Unknown", qualifying: false },
];

export const BANT_NEED_OPTIONS: BantOption[] = [
  { value: "critical", label: "Critical", qualifying: true },
  { value: "important", label: "Important", qualifying: true },
  { value: "nice_to_have", label: "Nice to Have", qualifying: false },
  { value: "none", label: "None", qualifying: false },
];

export const BANT_TIMELINE_OPTIONS: BantOption[] = [
  { value: "immediate", label: "Immediate", qualifying: true },
  { value: "this_quarter", label: "This Quarter", qualifying: true },
  { value: "this_year", label: "This Year", qualifying: false },
  { value: "no_timeline", label: "No Timeline", qualifying: false },
];

export const BANT_DIMENSIONS = [
  { key: "budget" as const, options: BANT_BUDGET_OPTIONS },
  { key: "authority" as const, options: BANT_AUTHORITY_OPTIONS },
  { key: "need" as const, options: BANT_NEED_OPTIONS },
  { key: "timeline" as const, options: BANT_TIMELINE_OPTIONS },
] as const;

export type BantKey = (typeof BANT_DIMENSIONS)[number]["key"];

export function isQualifying(
  options: BantOption[],
  value: string | null | undefined
): boolean {
  if (!value) return false;
  return options.find((o) => o.value === value)?.qualifying === true;
}

export function findLabel(
  options: BantOption[],
  value: string | null | undefined
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}
