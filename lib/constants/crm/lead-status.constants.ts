/**
 * Lead Status Constants — Single Source of Truth
 *
 * Must match DB CHECK constraint on crm_leads.status.
 * 8 statuses total: 6 pipeline V7 + 2 operational (converted, payment_pending).
 *
 * @module lib/constants/crm/lead-status.constants
 */

/**
 * All valid lead statuses — matches crm_leads CHECK constraint exactly.
 *
 * Pipeline V7 (6): new → email_verified → callback_requested → qualified → nurturing | disqualified
 * Operational (2): payment_pending (Stripe flow), converted (customer conversion)
 */
export const LEAD_STATUSES = [
  "new",
  "email_verified",
  "callback_requested",
  "qualified",
  "payment_pending",
  "converted",
  "nurturing",
  "disqualified",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Kanban pipeline columns (V7 — the 3 active columns). */
export const KANBAN_STATUSES = [
  "email_verified",
  "callback_requested",
  "qualified",
] as const;

/** Outcome statuses shown in Kanban outcomes bar. */
export const OUTCOME_STATUSES = ["nurturing", "disqualified"] as const;

/** Terminal statuses — leads cannot transition OUT of these. */
export const TERMINAL_STATUSES = ["converted", "disqualified"] as const;
