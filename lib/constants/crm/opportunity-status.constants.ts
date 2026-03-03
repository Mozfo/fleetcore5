/**
 * Opportunity Status Constants — Single Source of Truth
 *
 * DB CHECK constraint: open, won, lost, on_hold, cancelled
 *
 * Consumers:
 * - types/crm.ts (re-exports OPPORTUNITY_STATUS_VALUES)
 * - lib/validators/crm/opportunity.validators.ts (Zod enum)
 * - lib/validators/crm.validators.ts (Zod enum)
 * - app/api/v1/crm/opportunities/[id]/route.ts (Zod enum)
 * - lib/hooks/useOpportunityStatuses.ts (DEFAULT_OPPORTUNITY_STATUSES fallback)
 *
 * @module lib/constants/crm/opportunity-status.constants
 */

export const OPPORTUNITY_STATUSES = [
  "open",
  "won",
  "lost",
  "on_hold",
  "cancelled",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const TERMINAL_OPPORTUNITY_STATUSES = [
  "won",
  "lost",
  "cancelled",
] as const;

export const ACTIVE_OPPORTUNITY_STATUSES = ["open", "on_hold"] as const;
