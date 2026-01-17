/**
 * Lead Status & Qualification Validators
 * V6.3: Validation schemas for status transitions and CPT qualification
 *
 * @module lib/validators/crm/lead-status.validators
 */

import { z } from "zod";

/**
 * 8 statuts V6.3 du workflow lead (one-call close)
 * Source: crm_settings.lead_status_workflow
 *
 * V6.3: Suppression qualified/demo_completed (one-call close philosophy)
 * demo_scheduled → demo (renommé)
 */
export const leadStatusEnum = z.enum([
  "new",
  "demo", // V6.3: Renommé depuis demo_scheduled
  "proposal_sent",
  "payment_pending",
  "converted",
  "lost",
  "nurturing",
  "disqualified",
]);

export type LeadStatus = z.infer<typeof leadStatusEnum>;

/**
 * Update status request validation (V6.3)
 *
 * - status: Le nouveau statut cible
 * - loss_reason_code: Obligatoire si status = lost ou disqualified
 * - nurturing_reason_code: Obligatoire si status = nurturing (V6.3)
 * - reason_detail: Détail optionnel si la raison a requires_detail = true
 * - triggered_by: Source de la transition (V6.3: lead_action_only pour nurturing→demo)
 *
 * @example
 * const body = {
 *   status: "lost",
 *   loss_reason_code: "chose_competitor",
 *   reason_detail: "Went with Tourmo"
 * };
 */
export const updateStatusSchema = z.object({
  status: leadStatusEnum,
  loss_reason_code: z.string().min(1).max(50).optional(),
  nurturing_reason_code: z.string().min(1).max(50).optional(), // V6.3
  reason_detail: z.string().max(500).optional(),
  triggered_by: z.enum(["commercial", "lead", "system"]).optional(), // V6.3
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
