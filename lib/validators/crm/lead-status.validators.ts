/**
 * Lead Status & Qualification Validators
 * V7: BANT qualification
 *
 * @module lib/validators/crm/lead-status.validators
 */

import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/constants/crm/lead-status.constants";
import {
  BANT_BUDGET_VALUES,
  BANT_AUTHORITY_VALUES,
  BANT_NEED_VALUES,
  BANT_TIMELINE_VALUES,
} from "@/lib/constants/crm/bant.constants";

/**
 * V7 Lead statuses — derived from single source of truth.
 * @see lib/constants/crm/lead-status.constants.ts
 */
export const leadStatusEnum = z.enum(LEAD_STATUSES);

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

// ===== BANT Qualification Enums — derived from bant.constants.ts =====

export const bantBudgetEnum = z.enum(BANT_BUDGET_VALUES);
export const bantAuthorityEnum = z.enum(BANT_AUTHORITY_VALUES);
export const bantNeedEnum = z.enum(BANT_NEED_VALUES);
export const bantTimelineEnum = z.enum(BANT_TIMELINE_VALUES);

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
