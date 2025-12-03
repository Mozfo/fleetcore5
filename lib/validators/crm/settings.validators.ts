/**
 * CRM Settings Validators - Zod Schemas for CRM Configuration
 *
 * This module provides validation for CRM settings management:
 * - Pipeline configuration (Lead stages + Opportunity stages)
 * - Loss reasons with recovery workflow
 * - Generic settings CRUD operations
 *
 * All configurations are stored in crm_settings table as JSONB
 * following the "ZERO HARDCODING" principle.
 *
 * @module lib/validators/crm/settings.validators
 */

import { z } from "zod";

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

/**
 * Setting categories for organization
 * Must match database CHECK constraint: crm_settings_category_check
 */
export const SettingCategoryEnum = z.enum(
  [
    "scoring",
    "assignment",
    "qualification",
    "stages",
    "workflows",
    "notifications",
    "sla",
    "validation",
    "integrations",
    "ui",
  ],
  { message: "Invalid setting category" }
);

export type SettingCategory = z.infer<typeof SettingCategoryEnum>;

/**
 * Data types for settings validation
 */
export const SettingDataTypeEnum = z.enum(
  ["object", "array", "string", "number", "boolean"],
  { message: "Invalid data type" }
);

export type SettingDataType = z.infer<typeof SettingDataTypeEnum>;

/**
 * Stage colors - consistent across Lead and Opportunity stages
 */
export const StageColorEnum = z.enum(
  [
    "blue",
    "purple",
    "green",
    "red",
    "yellow",
    "orange",
    "emerald",
    "gray",
    "indigo",
    "pink",
  ],
  { message: "Invalid stage color" }
);

export type StageColor = z.infer<typeof StageColorEnum>;

/**
 * Loss reason categories
 */
export const LossReasonCategoryEnum = z.enum(
  ["price", "product", "competition", "timing", "other"],
  { message: "Invalid loss reason category" }
);

export type LossReasonCategory = z.infer<typeof LossReasonCategoryEnum>;

/**
 * Lead stage auto-actions
 */
export const LeadAutoActionEnum = z.enum(
  [
    "assign_to_queue",
    "calculate_score",
    "archive",
    "add_to_sequence",
    "create_opportunity",
    "send_notification",
  ],
  { message: "Invalid lead auto action" }
);

export type LeadAutoAction = z.infer<typeof LeadAutoActionEnum>;

// =============================================================================
// GENERIC SETTINGS CRUD SCHEMAS
// =============================================================================

/**
 * Schema for creating a new CRM setting
 */
export const CreateSettingSchema = z.object({
  setting_key: z
    .string()
    .min(1, "Setting key is required")
    .max(100, "Setting key too long")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Setting key must be lowercase, start with letter, and contain only letters, numbers, underscores"
    ),
  setting_value: z.record(z.string(), z.unknown()),
  category: SettingCategoryEnum,
  data_type: SettingDataTypeEnum,
  description: z.string().max(500).optional().nullable(),
  display_label: z.string().max(100).optional().nullable(),
  help_text: z.string().max(500).optional().nullable(),
  ui_component: z.string().max(50).optional().nullable(),
  display_order: z.number().int().min(0).max(1000).optional().default(0),
  is_system: z.boolean().optional().default(false),
});

export type CreateSettingInput = z.infer<typeof CreateSettingSchema>;

/**
 * Schema for updating an existing CRM setting
 */
export const UpdateSettingSchema = z.object({
  setting_value: z.record(z.string(), z.unknown()).optional(),
  description: z.string().max(500).optional().nullable(),
  display_label: z.string().max(100).optional().nullable(),
  help_text: z.string().max(500).optional().nullable(),
  ui_component: z.string().max(50).optional().nullable(),
  display_order: z.number().int().min(0).max(1000).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateSettingInput = z.infer<typeof UpdateSettingSchema>;

/**
 * Schema for bulk updating multiple settings
 */
export const BulkUpdateSettingsSchema = z.object({
  updates: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.record(z.string(), z.unknown()),
      })
    )
    .min(1, "At least one update required")
    .max(10, "Maximum 10 updates per request"),
});

export type BulkUpdateSettingsInput = z.infer<typeof BulkUpdateSettingsSchema>;

// =============================================================================
// LEAD STAGES CONFIGURATION
// =============================================================================

/**
 * Single Lead stage configuration
 */
export const LeadStageSchema = z.object({
  value: z
    .string()
    .min(1, "Stage value required")
    .max(50, "Stage value too long")
    .regex(/^[a-z][a-z0-9_]*$/, "Stage value must be lowercase snake_case"),
  label_en: z.string().min(1).max(100),
  label_fr: z.string().min(1).max(100),
  color: StageColorEnum,
  order: z.number().int().min(1).max(20),
  is_active: z.boolean().default(true),
  auto_actions: z.array(LeadAutoActionEnum).default([]),
});

export type LeadStage = z.infer<typeof LeadStageSchema>;

/**
 * Complete Lead stages configuration
 */
export const LeadStagesConfigSchema = z.object({
  stages: z
    .array(LeadStageSchema)
    .min(2, "At least 2 stages required")
    .max(10, "Maximum 10 stages allowed"),
  transitions: z.record(z.string(), z.array(z.string())),
  default_stage: z.string().min(1),
});

export type LeadStagesConfig = z.infer<typeof LeadStagesConfigSchema>;

// =============================================================================
// OPPORTUNITY STAGES CONFIGURATION
// =============================================================================

/**
 * Single Opportunity stage configuration
 */
export const OpportunityStageSchema = z.object({
  value: z
    .string()
    .min(1, "Stage value required")
    .max(50, "Stage value too long")
    .regex(/^[a-z][a-z0-9_]*$/, "Stage value must be lowercase snake_case"),
  label_en: z.string().min(1).max(100),
  label_fr: z.string().min(1).max(100),
  probability: z.number().int().min(0).max(100),
  max_days: z.number().int().min(1).max(365),
  color: StageColorEnum,
  order: z.number().int().min(1).max(10),
  deal_rotting: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export type OpportunityStage = z.infer<typeof OpportunityStageSchema>;

/**
 * Final stages (Won/Lost) configuration
 */
export const FinalStagesSchema = z.object({
  won: z.object({
    label_en: z.string().min(1).max(100),
    label_fr: z.string().min(1).max(100),
    probability: z.literal(100),
  }),
  lost: z.object({
    label_en: z.string().min(1).max(100),
    label_fr: z.string().min(1).max(100),
    probability: z.literal(0),
  }),
});

export type FinalStages = z.infer<typeof FinalStagesSchema>;

/**
 * Deal rotting configuration
 */
export const DealRottingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  use_stage_max_days: z.boolean().default(true),
  global_threshold_days: z.number().int().min(1).max(365).nullable(),
  alert_owner: z.boolean().default(true),
  alert_manager: z.boolean().default(true),
  cron_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .default("08:00"),
});

export type DealRottingConfig = z.infer<typeof DealRottingConfigSchema>;

/**
 * Complete Opportunity pipeline configuration
 */
export const OpportunityPipelineConfigSchema = z.object({
  stages: z
    .array(OpportunityStageSchema)
    .min(2, "At least 2 stages required")
    .max(8, "Maximum 8 stages allowed"),
  final_stages: FinalStagesSchema,
  rotting: DealRottingConfigSchema,
});

export type OpportunityPipelineConfig = z.infer<
  typeof OpportunityPipelineConfigSchema
>;

// =============================================================================
// LOSS REASONS CONFIGURATION
// =============================================================================

/**
 * Single loss reason configuration
 */
export const LossReasonSchema = z.object({
  value: z
    .string()
    .min(1, "Value required")
    .max(50, "Value too long")
    .regex(/^[a-z][a-z0-9_]*$/, "Value must be lowercase snake_case"),
  label_en: z.string().min(1).max(100),
  label_fr: z.string().min(1).max(100),
  category: LossReasonCategoryEnum,
  order: z.number().int().min(1).max(100),
  is_active: z.boolean().default(true),
  is_recoverable: z.boolean().default(false),
  recovery_delay_days: z.number().int().min(1).max(365).optional().nullable(),
  require_competitor_name: z.boolean().default(false),
});

export type LossReason = z.infer<typeof LossReasonSchema>;

/**
 * Recovery workflow configuration
 */
export const RecoveryWorkflowConfigSchema = z.object({
  auto_create_followup: z.boolean().default(true),
  send_reminder_email: z.boolean().default(true),
  reminder_days_before: z.number().int().min(1).max(30).default(7),
  auto_reopen: z.boolean().default(false),
});

export type RecoveryWorkflowConfig = z.infer<
  typeof RecoveryWorkflowConfigSchema
>;

/**
 * Complete loss reasons configuration
 */
export const LossReasonsConfigSchema = z.object({
  default: z.string().nullable().default(null),
  reasons: z
    .array(LossReasonSchema)
    .min(1, "At least 1 reason required")
    .max(20, "Maximum 20 reasons allowed"),
  recovery_workflow: RecoveryWorkflowConfigSchema,
});

export type LossReasonsConfig = z.infer<typeof LossReasonsConfigSchema>;

// =============================================================================
// API REQUEST/RESPONSE SCHEMAS
// =============================================================================

/**
 * Query params for GET /api/v1/crm/settings
 */
export const GetSettingsQuerySchema = z.object({
  category: SettingCategoryEnum.optional(),
  include_inactive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

export type GetSettingsQuery = z.infer<typeof GetSettingsQuerySchema>;

/**
 * Response schema for single setting
 */
export const SettingResponseSchema = z.object({
  id: z.string().uuid(),
  setting_key: z.string(),
  setting_value: z.record(z.string(), z.unknown()),
  category: z.string(),
  data_type: z.string(),
  description: z.string().nullable(),
  display_label: z.string().nullable(),
  help_text: z.string().nullable(),
  ui_component: z.string().nullable(),
  display_order: z.number(),
  is_active: z.boolean(),
  is_system: z.boolean(),
  version: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export type SettingResponse = z.infer<typeof SettingResponseSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate that stage transitions reference valid stages
 */
export function validateStageTransitions(
  stages: { value: string }[],
  transitions: Record<string, string[]>
): { valid: boolean; errors: string[] } {
  const stageValues = new Set(stages.map((s) => s.value));
  const errors: string[] = [];

  for (const [from, toStages] of Object.entries(transitions)) {
    if (!stageValues.has(from)) {
      errors.push(`Transition from unknown stage: ${from}`);
    }
    for (const to of toStages) {
      if (!stageValues.has(to)) {
        errors.push(`Transition to unknown stage: ${to} (from ${from})`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate that default stage exists in stages list
 */
export function validateDefaultStage(
  stages: { value: string }[],
  defaultStage: string
): boolean {
  return stages.some((s) => s.value === defaultStage);
}

/**
 * Validate stage orders are unique and sequential
 */
export function validateStageOrders(stages: { order: number }[]): {
  valid: boolean;
  errors: string[];
} {
  const orders = stages.map((s) => s.order);
  const uniqueOrders = new Set(orders);
  const errors: string[] = [];

  if (uniqueOrders.size !== orders.length) {
    errors.push("Stage orders must be unique");
  }

  const sorted = [...orders].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      errors.push(`Stage orders must be sequential starting from 1`);
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}
