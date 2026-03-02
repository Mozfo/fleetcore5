/**
 * Disqualification reasons — aligned with backend POST /api/crm/leads/[id]/disqualify
 */

export const DISQUALIFICATION_REASONS = [
  "fantasy_email",
  "competitor",
  "no_response",
  "wrong_market",
  "student_test",
  "duplicate",
  "other",
] as const;

export type DisqualificationReason = (typeof DISQUALIFICATION_REASONS)[number];
