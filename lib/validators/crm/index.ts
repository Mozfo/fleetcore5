/**
 * CRM Validators Barrel Export
 *
 * Centralized exports for all CRM validation schemas.
 * This module provides a clean import path for consumers:
 *
 * @example
 * ```typescript
 * import {
 *   CreateLeadSchema,
 *   CreateOpportunitySchema,
 *   CreateOrderFromOpportunitySchema,
 *   BILLING_CYCLES,
 * } from "@/lib/validators/crm";
 * ```
 *
 * @module lib/validators/crm
 */

// =============================================================================
// LEAD VALIDATORS
// =============================================================================
export {
  CreateLeadSchema,
  LeadCreationResponseSchema,
  ErrorResponseSchema,
  UpdateLeadSchema,
  type CreateLeadInput,
  type LeadCreationResponse,
  type ErrorResponse,
  type UpdateLeadInput,
} from "./lead.validators";

// =============================================================================
// OPPORTUNITY VALIDATORS
// =============================================================================
export {
  CreateOpportunitySchema,
  UpdateOpportunitySchema,
  type CreateOpportunityInput,
  type UpdateOpportunityInput,
} from "./opportunity.validators";

// =============================================================================
// ORDER VALIDATORS (Quote-to-Cash)
// =============================================================================
export {
  // Constants
  BILLING_CYCLES,
  FULFILLMENT_STATUSES,
  ORDER_TYPES,
  CURRENCIES,
  // Types from constants
  type BillingCycle,
  type FulfillmentStatus,
  type OrderType,
  type Currency,
  // API Schemas
  CreateOrderFromOpportunitySchema,
  type CreateOrderFromOpportunityInput,
  // UI Form Schemas
  MarkAsWonFormSchema,
  type MarkAsWonFormInput,
  // Status Update Schemas
  UpdateOrderStatusSchema,
  UpdateFulfillmentStatusSchema,
  type UpdateOrderStatusInput,
  type UpdateFulfillmentStatusInput,
  // Query Schema
  OrderQuerySchema,
  type OrderQueryInput,
  // Cancel Schema
  CancelOrderSchema,
  type CancelOrderInput,
} from "./order.validators";

// =============================================================================
// SETTINGS VALIDATORS
// =============================================================================
export {
  // Enums
  SettingCategoryEnum,
  SettingDataTypeEnum,
  StageColorEnum,
  LossReasonCategoryEnum,
  LeadAutoActionEnum,
  // Schemas
  LeadStageSchema,
  LeadStagesConfigSchema,
  OpportunityStageSchema,
  OpportunityPipelineConfigSchema,
  FinalStagesSchema,
  DealRottingConfigSchema,
  LossReasonSchema,
  CreateSettingSchema,
  UpdateSettingSchema,
  BulkUpdateSettingsSchema,
  // Types
  type SettingCategory,
  type LeadStage,
  type LeadStagesConfig,
  type OpportunityStage,
  type OpportunityPipelineConfig,
  type FinalStages,
  type DealRottingConfig,
  type LossReason,
  type CreateSettingInput,
  type UpdateSettingInput,
  type BulkUpdateSettingsInput,
} from "./settings.validators";

// =============================================================================
// LEAD STATUS & QUALIFICATION VALIDATORS (V6.2-6)
// =============================================================================
export {
  // Enums
  leadStatusEnum,
  cptChallengesScore,
  cptPriorityScore,
  cptTimingScore,
  // Schemas
  updateStatusSchema,
  qualifyLeadSchema,
  // Types
  type LeadStatus,
  type UpdateStatusInput,
  type QualifyLeadInput,
  type StatusTransitionResult,
  type QualificationResult,
} from "./lead-status.validators";
