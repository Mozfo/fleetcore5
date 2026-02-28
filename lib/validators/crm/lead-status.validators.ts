/**
 * Lead Status & Qualification Validators
 * V7: BANT qualification
 *
 * @module lib/validators/crm/lead-status.validators
 */

import { z } from "zod";

/**
 * V7 Lead statuses
 * Source: crm_settings.lead_status_workflow + DB CHECK constraint
 */
export const leadStatusEnum = z.enum([
  "new",
  "email_verified",
  "callback_requested",
  "qualified",
  "payment_pending",
  "converted",
  "nurturing",
  "disqualified",
]);

export type LeadStatus = z.infer<typeof leadStatusEnum>;

/**
 * Update status request validation
 */
export const updateStatusSchema = z.object({
  status: leadStatusEnum,
  loss_reason_code: z.string().min(1).max(50).optional(),
  nurturing_reason_code: z.string().min(1).max(50).optional(),
  reason_detail: z.string().max(500).optional(),
  triggered_by: z.enum(["commercial", "lead", "system"]).optional(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// ===== BANT Qualification Enums =====

export const bantBudgetEnum = z.enum([
  "confirmed",
  "planned",
  "no_budget",
  "unknown",
]);

export const bantAuthorityEnum = z.enum([
  "decision_maker",
  "influencer",
  "user",
  "unknown",
]);

export const bantNeedEnum = z.enum([
  "critical",
  "important",
  "nice_to_have",
  "none",
]);

export const bantTimelineEnum = z.enum([
  "immediate",
  "this_quarter",
  "this_year",
  "no_timeline",
]);

/**
 * BANT Qualification request validation (V7)
 *
 * 4 binary criteria — no numeric scoring.
 * Qualifying values per criterion loaded from crm_settings.qualification_framework.
 *
 * @example
 * const body = {
 *   bant_budget: "confirmed",
 *   bant_authority: "decision_maker",
 *   bant_need: "critical",
 *   bant_timeline: "immediate"
 * };
 */
export const qualifyLeadSchema = z.object({
  bant_budget: bantBudgetEnum,
  bant_authority: bantAuthorityEnum,
  bant_need: bantNeedEnum,
  bant_timeline: bantTimelineEnum,
});

export type QualifyLeadInput = z.infer<typeof qualifyLeadSchema>;

/**
 * Types pour les reponses API
 */
export interface StatusTransitionResult {
  success: boolean;
  leadId: string;
  previousStatus: string;
  newStatus: string;
  error?: string;
}

export interface QualificationResult {
  success: boolean;
  leadId: string;
  result: "qualified" | "nurturing" | "disqualified";
  criteria_met: number;
  details: {
    budget: { value: string; qualifying: boolean };
    authority: { value: string; qualifying: boolean };
    need: { value: string; qualifying: boolean };
    timeline: { value: string; qualifying: boolean };
  };
  fleet_size_exception: boolean;
  status_updated: boolean;
  qualified_date: string | null;
}
