/**
 * Billing Services - Module Exports
 *
 * This module exports all billing-related services for subscription
 * schedule management and mid-term amendments.
 *
 * @module lib/services/billing
 */

// =============================================================================
// SUBSCRIPTION SCHEDULE SERVICE
// =============================================================================

export {
  SubscriptionScheduleService,
  subscriptionScheduleService,
} from "./subscription-schedule.service";

export type {
  SubscriptionSchedule,
  SchedulePhase,
  ScheduleWithPhases,
  CreateScheduleInput,
  UpdateScheduleInput,
  CreatePhaseInput,
  UpdatePhaseInput,
  ScheduleFilters,
  PaginatedResult,
} from "./subscription-schedule.service";

// =============================================================================
// AMENDMENT SERVICE
// =============================================================================

export { AmendmentService, amendmentService } from "./amendment.service";

export type {
  Amendment,
  AmendmentWithRelations,
  CreateAmendmentInput,
  UpdateAmendmentInput,
  ProrationResult,
  AmendmentPreview,
  AmendmentFilters,
} from "./amendment.service";

// =============================================================================
// CATALOGUE SERVICE
// =============================================================================

export { CatalogueService, catalogueService } from "./catalogue.service";
