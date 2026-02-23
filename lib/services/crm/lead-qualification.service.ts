/**
 * Lead Qualification Service - V6.3
 * Gestion de la qualification CPT (Challenges, Priority, Timing)
 *
 * Ce service est le SEUL point d'acces pour:
 * - Charger le framework de qualification depuis crm_settings
 * - Calculer les scores CPT
 * - Determiner la recommandation (proceed/nurture/disqualify)
 * - Auto-update le statut si recommendation = proceed → proposal_sent
 *
 * V6.3: 8 statuts - "qualified" remplacé par "proposal_sent"
 * ZERO HARDCODING: Toutes les regles viennent de crm_settings.qualification_framework
 *
 * @module lib/services/crm/lead-qualification.service
 */

import { prisma } from "@/lib/prisma";
import { CrmSettingsRepository } from "@/lib/repositories/crm/settings.repository";
import { leadStatusService } from "@/lib/services/crm/lead-status.service";
import { logger } from "@/lib/logger";
import type {
  QualifyLeadInput,
  QualificationResult,
} from "@/lib/validators/crm/lead-status.validators";

// ===== TYPES & INTERFACES =====

/**
 * Score weights configuration from crm_settings.qualification_framework.score_weights
 */
export interface ScoreWeights {
  challenges: { high: number; medium: number; low: number };
  priority: { high: number; medium: number; low: number };
  timing: { hot: number; warm: number; cool: number; cold: number };
}

/**
 * Thresholds configuration from crm_settings.qualification_framework.thresholds
 */
export interface Thresholds {
  proceed: number;
  nurture: number;
}

/**
 * Full qualification framework from crm_settings
 */
export interface QualificationFramework {
  version: string;
  framework: string;
  questions: unknown[];
  disqualification_triggers: unknown[];
  score_weights: ScoreWeights;
  thresholds: Thresholds;
}

/**
 * CPT notes stored in qualification_notes (JSON as TEXT)
 */
export interface QualificationNotes {
  framework: string;
  qualified_by: string;
  qualified_at: string;
  challenges: {
    response: string;
    score: string;
    points: number;
  };
  priority: {
    response: string;
    score: string;
    points: number;
  };
  timing: {
    response: string;
    score: string;
    points: number;
  };
  total_score: number;
  recommendation: string;
}

// ===== SERVICE CLASS =====

/**
 * LeadQualificationService - Gestion de la qualification CPT
 *
 * Charge les regles depuis crm_settings.qualification_framework:
 * - score_weights: Points par niveau (high/medium/low, hot/warm/cool/cold)
 * - thresholds: Seuils de decision (proceed >= 70, nurture >= 40)
 *
 * @example
 * ```typescript
 * import { leadQualificationService } from "@/lib/services/crm/lead-qualification.service";
 *
 * const result = await leadQualificationService.qualifyLead(leadId, {
 *   challenges: { response: "Excel nightmare...", score: "high" },
 *   priority: { response: "Budget approved...", score: "high" },
 *   timing: { response: "ASAP", score: "hot" },
 * }, userId);
 *
 * if (result.recommendation === "proceed") {
 *   // V6.3: Status auto-updated to "proposal_sent"
 * }
 * ```
 */
export class LeadQualificationService {
  private settingsRepo: CrmSettingsRepository;
  private frameworkCache: QualificationFramework | null = null;

  constructor() {
    this.settingsRepo = new CrmSettingsRepository(prisma);
  }

  // ============================================
  // FRAMEWORK METHODS
  // ============================================

  /**
   * Get qualification framework from crm_settings
   * Uses cache to reduce DB queries
   */
  async getFramework(): Promise<QualificationFramework> {
    if (this.frameworkCache) {
      return this.frameworkCache;
    }

    const setting =
      await this.settingsRepo.getSettingValue<QualificationFramework>(
        "qualification_framework"
      );

    if (!setting) {
      throw new Error("qualification_framework not found in crm_settings");
    }

    // Validate required fields exist
    if (!setting.score_weights || !setting.thresholds) {
      throw new Error(
        "qualification_framework is missing score_weights or thresholds. Run migration V6.2-6."
      );
    }

    this.frameworkCache = setting;
    return setting;
  }

  /**
   * Get score weights from framework
   */
  async getScoreWeights(): Promise<ScoreWeights> {
    const framework = await this.getFramework();
    return framework.score_weights;
  }

  /**
   * Get thresholds from framework
   */
  async getThresholds(): Promise<Thresholds> {
    const framework = await this.getFramework();
    return framework.thresholds;
  }

  // ============================================
  // SCORE CALCULATION
  // ============================================

  /**
   * Calculate total CPT score from responses
   */
  async calculateScore(cpt: QualifyLeadInput): Promise<{
    total: number;
    challengesPoints: number;
    priorityPoints: number;
    timingPoints: number;
  }> {
    const weights = await this.getScoreWeights();

    const challengesPoints = weights.challenges[cpt.challenges.score];
    const priorityPoints = weights.priority[cpt.priority.score];
    const timingPoints = weights.timing[cpt.timing.score];

    return {
      total: challengesPoints + priorityPoints + timingPoints,
      challengesPoints,
      priorityPoints,
      timingPoints,
    };
  }

  /**
   * Determine recommendation based on score and thresholds
   */
  async getRecommendation(
    score: number
  ): Promise<"proceed" | "nurture" | "disqualify"> {
    const thresholds = await this.getThresholds();

    if (score >= thresholds.proceed) {
      return "proceed";
    } else if (score >= thresholds.nurture) {
      return "nurture";
    } else {
      return "disqualify";
    }
  }

  // ============================================
  // QUALIFICATION (MAIN METHOD)
  // ============================================

  /**
   * Qualify a lead using CPT framework
   *
   * Flow:
   * 1. Validate lead status (NOT converted/disqualified)
   * 2. Calculate score from CPT responses
   * 3. Determine recommendation
   * 4. Update crm_leads with qualification data
   * 5. Create activity in crm_lead_activities
   * 6. If proceed: auto-update status to "proposal_sent" (V6.3)
   * 7. Return result with recommendation
   *
   * @param leadId - Lead UUID
   * @param cpt - CPT qualification input
   * @param performedBy - auth user_id who performed the qualification
   * @returns QualificationResult with score, recommendation, and status_updated flag
   */
  async qualifyLead(
    leadId: string,
    cpt: QualifyLeadInput,
    performedBy: string
  ): Promise<QualificationResult> {
    // 1. Validate lead exists and status is valid for qualification
    const lead = await prisma.crm_leads.findUnique({
      where: { id: leadId },
      select: { id: true, status: true, email: true, tenant_id: true },
    });

    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Cannot qualify already converted or disqualified leads
    const invalidStatuses = ["converted", "disqualified"];
    if (lead.status && invalidStatuses.includes(lead.status)) {
      throw new Error(`Cannot qualify lead with status: ${lead.status}`);
    }

    // 2. Calculate score
    const scoreResult = await this.calculateScore(cpt);
    const { total, challengesPoints, priorityPoints, timingPoints } =
      scoreResult;

    // 3. Determine recommendation
    const recommendation = await this.getRecommendation(total);

    // 4. Build qualification notes (stored as JSON in TEXT column)
    const qualifiedAt = new Date();
    const qualificationNotes: QualificationNotes = {
      framework: "CPT",
      qualified_by: performedBy,
      qualified_at: qualifiedAt.toISOString(),
      challenges: {
        response: cpt.challenges.response,
        score: cpt.challenges.score,
        points: challengesPoints,
      },
      priority: {
        response: cpt.priority.response,
        score: cpt.priority.score,
        points: priorityPoints,
      },
      timing: {
        response: cpt.timing.response,
        score: cpt.timing.score,
        points: timingPoints,
      },
      total_score: total,
      recommendation,
    };

    // 5. Resolve tenant_id for activity log
    let activityTenantId = lead.tenant_id;
    if (!activityTenantId) {
      const hqTenant = await prisma.adm_tenants.findFirst({
        where: { tenant_type: "headquarters" },
        select: { id: true },
      });
      activityTenantId = hqTenant?.id ?? null;
    }

    // 6. Update lead and create activity in transaction
    await prisma.$transaction(async (tx) => {
      // Update lead with qualification data
      await tx.crm_leads.update({
        where: { id: leadId },
        data: {
          qualification_score: total,
          qualification_notes: JSON.stringify(qualificationNotes),
          qualified_date: qualifiedAt,
          updated_at: new Date(),
        },
      });

      // Create activity
      if (activityTenantId) {
        await tx.crm_lead_activities.create({
          data: {
            tenant_id: activityTenantId,
            lead_id: leadId,
            activity_type: "lead_qualified",
            title: `Lead qualified with CPT score: ${total}/100`,
            description: `Recommendation: ${recommendation}. Challenges: ${cpt.challenges.score}, Priority: ${cpt.priority.score}, Timing: ${cpt.timing.score}`,
            performed_by: performedBy,
            created_at: new Date(),
          },
        });
      }
    });

    logger.info(
      {
        leadId,
        score: total,
        recommendation,
        performedBy,
      },
      "[LeadQualificationService] Lead qualified"
    );

    // 6. V6.3: Auto-update status to "proposal_sent" if recommendation = proceed
    let statusUpdated = false;
    if (recommendation === "proceed") {
      const statusResult = await leadStatusService.updateStatus(
        leadId,
        "proposal_sent", // V6.3: qualified status removed
        { performedBy }
      );
      statusUpdated = statusResult.success;

      if (!statusResult.success) {
        logger.warn(
          { leadId, error: statusResult.error },
          "[LeadQualificationService] Failed to auto-update status to proposal_sent"
        );
      }
    }

    // 7. Build result
    const result: QualificationResult = {
      success: true,
      leadId,
      qualification_score: total,
      recommendation,
      status_updated: statusUpdated,
      qualified_date: qualifiedAt.toISOString(),
    };

    // Add suggested action for non-proceed recommendations
    if (recommendation === "disqualify") {
      result.suggested_action = "Consider disqualifying this lead";
    } else if (recommendation === "nurture") {
      result.suggested_action = "Consider moving this lead to nurturing";
    }

    return result;
  }

  /**
   * Clear caches (useful for testing or when settings change)
   */
  clearCache(): void {
    this.frameworkCache = null;
  }
}

// ===== SINGLETON INSTANCE =====

/**
 * Default LeadQualificationService instance
 */
export const leadQualificationService = new LeadQualificationService();
