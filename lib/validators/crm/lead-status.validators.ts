/**
 * Lead Status & Qualification Validators
 * V6.2-6: Validation schemas for status transitions and CPT qualification
 *
 * @module lib/validators/crm/lead-status.validators
 */

import { z } from "zod";

/**
 * 10 statuts V6.2.1 du workflow lead
 * Source: crm_settings.lead_status_workflow
 *
 * V6.2.1 adds payment_pending between proposal_sent and converted
 * for Stripe checkout flow tracking.
 */
export const leadStatusEnum = z.enum([
  "new",
  "demo_scheduled",
  "qualified",
  "demo_completed",
  "proposal_sent",
  "payment_pending", // V6.2.1: Stripe checkout flow
  "converted",
  "lost",
  "nurturing",
  "disqualified",
]);

export type LeadStatus = z.infer<typeof leadStatusEnum>;

/**
 * Update status request validation
 *
 * - status: Le nouveau statut cible
 * - loss_reason_code: Obligatoire si status = lost ou disqualified
 * - loss_reason_detail: Obligatoire si la raison a requires_detail = true
 *
 * @example
 * const body = {
 *   status: "lost",
 *   loss_reason_code: "chose_competitor",
 *   loss_reason_detail: "Went with Tourmo"
 * };
 */
export const updateStatusSchema = z.object({
  status: leadStatusEnum,
  loss_reason_code: z.string().min(1).max(50).optional(),
  loss_reason_detail: z.string().max(500).optional(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

/**
 * CPT Score levels
 */
export const cptChallengesScore = z.enum(["high", "medium", "low"]);
export const cptPriorityScore = z.enum(["high", "medium", "low"]);
export const cptTimingScore = z.enum(["hot", "warm", "cool", "cold"]);

/**
 * CPT Qualification request validation
 *
 * Framework CPT (Challenges, Priority, Timing):
 * - challenges: Pain points et problemes a resoudre
 * - priority: Budget et autorite de decision
 * - timing: Quand ils veulent implementer
 *
 * Chaque critere a:
 * - response: Texte libre decrivant la reponse du prospect
 * - score: Niveau de qualification (high/medium/low ou hot/warm/cool/cold)
 *
 * @example
 * const body = {
 *   challenges: {
 *     response: "Excel nightmare, 3 hours/week reconciliation",
 *     score: "high"
 *   },
 *   priority: {
 *     response: "Budget approved Q1",
 *     score: "high"
 *   },
 *   timing: {
 *     response: "Want to start ASAP",
 *     score: "hot"
 *   }
 * };
 */
export const qualifyLeadSchema = z.object({
  challenges: z.object({
    response: z
      .string()
      .min(1, "Response required")
      .max(1000, "Response too long"),
    score: cptChallengesScore,
  }),
  priority: z.object({
    response: z
      .string()
      .min(1, "Response required")
      .max(1000, "Response too long"),
    score: cptPriorityScore,
  }),
  timing: z.object({
    response: z
      .string()
      .min(1, "Response required")
      .max(1000, "Response too long"),
    score: cptTimingScore,
  }),
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
  qualification_score: number;
  recommendation: "proceed" | "nurture" | "disqualify";
  suggested_action?: string;
  status_updated: boolean;
  qualified_date: string;
}
