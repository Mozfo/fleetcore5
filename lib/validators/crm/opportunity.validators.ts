/**
 * CRM Opportunity Validators
 *
 * Zod schemas for opportunity validation:
 * - CreateOpportunitySchema: Create new opportunity via API
 * - UpdateOpportunitySchema: Update existing opportunity
 *
 * @module lib/validators/crm/opportunity.validators
 */

import { z } from "zod";
import { OPPORTUNITY_STAGE_VALUES } from "@/lib/config/opportunity-stages";

/**
 * Valid opportunity status values
 */
const OPPORTUNITY_STATUS_VALUES = [
  "open",
  "won",
  "lost",
  "on_hold",
  "cancelled",
] as const;

/**
 * Schema for creating a new opportunity
 *
 * Required fields:
 * - expected_value: Deal value in currency
 *
 * Optional fields with defaults:
 * - lead_id: Link to existing lead (can create orphan opportunity)
 * - stage: Pipeline stage (default: "qualification")
 * - currency: Currency code (default: "EUR")
 * - expected_close_date: Expected closing date
 * - assigned_to: UUID of assigned employee
 * - notes: Additional notes
 * - metadata: Extra JSON data
 */
export const CreateOpportunitySchema = z.object({
  // Required - must link to existing lead (schema constraint)
  lead_id: z.string().uuid("Invalid lead ID"),

  // Required - deal value
  expected_value: z
    .number({ message: "Expected value is required" })
    .positive("Expected value must be positive")
    .max(100000000, "Expected value too large"),

  // Optional with defaults
  stage: z.enum(OPPORTUNITY_STAGE_VALUES).default("qualification"),
  status: z.enum(OPPORTUNITY_STATUS_VALUES).default("open"),
  currency: z
    .string()
    .length(3, "Currency must be 3-letter code")
    .default("EUR"),

  // Optional dates
  expected_close_date: z.string().datetime().optional().nullable(),

  // Optional assignment
  assigned_to: z.string().uuid("Invalid assigned_to ID").optional().nullable(),

  // Optional text fields
  notes: z.string().max(5000, "Notes too long").optional().nullable(),

  // Optional metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;

/**
 * Schema for updating an existing opportunity
 *
 * All fields optional - only provided fields are updated
 */
export const UpdateOpportunitySchema = z.object({
  stage: z.enum(OPPORTUNITY_STAGE_VALUES).optional(),
  status: z.enum(OPPORTUNITY_STATUS_VALUES).optional(),
  expected_value: z.number().positive().max(100000000).optional(),
  probability_percent: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
  expected_close_date: z.string().datetime().optional().nullable(),
  close_date: z.string().datetime().optional().nullable(),
  won_date: z.string().datetime().optional().nullable(),
  lost_date: z.string().datetime().optional().nullable(),
  loss_reason: z.string().max(100).optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>;
