/**
 * Lead Qualification Service - V7
 * BANT qualification (Budget, Authority, Need, Timeline)
 *
 * This service is the ONLY entry point for:
 * - Loading BANT framework config from crm_settings.qualification_framework
 * - Evaluating 4 binary criteria (qualifying / not qualifying)
 * - Determining result: qualified (4/4), nurturing (3/4), disqualified (<=2/4)
 * - Fleet size exception: <=2/4 + fleet_size > threshold → nurturing instead of disqualified
 * - Auto-updating status to "qualified" if result = qualified
 *
 * ZERO HARDCODING: All qualifying values and thresholds come from crm_settings.
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
 * BANT criterion configuration from crm_settings
 */
interface BantCriterionConfig {
  allowed_values: string[];
  qualifying_values: string[];
}

/**
 * Full BANT qualification framework from crm_settings
 */
export interface QualificationFramework {
  version: string;
  framework: string;
  criteria: {
    budget: BantCriterionConfig;
    authority: BantCriterionConfig;
    need: BantCriterionConfig;
    timeline: BantCriterionConfig;
  };
  fleet_size_exception_threshold: number;
}

// ===== SERVICE CLASS =====

export class LeadQualificationService {
  private settingsRepo: CrmSettingsRepository;
  private frameworkCache: QualificationFramework | null = null;

  constructor() {
    this.settingsRepo = new CrmSettingsRepository(prisma);
  }

  // ============================================
  // FRAMEWORK METHODS
  // ============================================

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

    if (!setting.criteria) {
      throw new Error(
        "qualification_framework is missing criteria. Update crm_settings to V7 BANT format."
      );
    }

    this.frameworkCache = setting;
    return setting;
  }

  // ============================================
  // BANT EVALUATION
  // ============================================

  /**
   * Evaluate a single BANT criterion
   */
  private isQualifying(
    value: string,
    criterionConfig: BantCriterionConfig
  ): boolean {
    return criterionConfig.qualifying_values.includes(value);
  }

  /**
   * Evaluate all 4 BANT criteria and return details
   */
  async evaluateBant(input: QualifyLeadInput): Promise<{
    criteria_met: number;
    details: QualificationResult["details"];
  }> {
    const framework = await this.getFramework();
    const { criteria } = framework;

    const budgetQualifying = this.isQualifying(
      input.bant_budget,
      criteria.budget
    );
    const authorityQualifying = this.isQualifying(
      input.bant_authority,
      criteria.authority
    );
    const needQualifying = this.isQualifying(input.bant_need, criteria.need);
    const timelineQualifying = this.isQualifying(
      input.bant_timeline,
      criteria.timeline
    );

    const details: QualificationResult["details"] = {
      budget: { value: input.bant_budget, qualifying: budgetQualifying },
      authority: {
        value: input.bant_authority,
        qualifying: authorityQualifying,
      },
      need: { value: input.bant_need, qualifying: needQualifying },
      timeline: {
        value: input.bant_timeline,
        qualifying: timelineQualifying,
      },
    };

    const criteria_met = [
      budgetQualifying,
      authorityQualifying,
      needQualifying,
      timelineQualifying,
    ].filter(Boolean).length;

    return { criteria_met, details };
  }

  /**
   * Determine qualification result based on criteria met and fleet size
   */
  async determineResult(
    criteriaMet: number,
    fleetSize: string | null
  ): Promise<{
    result: "qualified" | "nurturing" | "disqualified";
    fleetSizeException: boolean;
  }> {
    if (criteriaMet === 4) {
      return { result: "qualified", fleetSizeException: false };
    }

    if (criteriaMet === 3) {
      return { result: "nurturing", fleetSizeException: false };
    }

    // <=2/4: check fleet_size exception
    const framework = await this.getFramework();
    const threshold = framework.fleet_size_exception_threshold;

    const numericFleetSize = this.parseFleetSize(fleetSize);
    if (numericFleetSize > threshold) {
      return { result: "nurturing", fleetSizeException: true };
    }

    return { result: "disqualified", fleetSizeException: false };
  }

  /**
   * Parse fleet_size string to number for comparison
   * Handles values like "50+", "100-200", "500+"
   */
  private parseFleetSize(fleetSize: string | null): number {
    if (!fleetSize) return 0;
    const cleaned = fleetSize.replace(/[^0-9]/g, "");
    return parseInt(cleaned, 10) || 0;
  }

  // ============================================
  // QUALIFICATION (MAIN METHOD)
  // ============================================

  /**
   * Qualify a lead using BANT framework
   *
   * Flow:
   * 1. Validate lead exists and status allows qualification
   * 2. Evaluate 4 BANT criteria
   * 3. Determine result (qualified / nurturing / disqualified)
   * 4. Write BANT values + result to crm_leads
   * 5. Create activity in crm_lead_activities
   * 6. If qualified: auto-update status to "qualified"
   * 7. Return result
   */
  async qualifyLead(
    leadId: string,
    bant: QualifyLeadInput,
    performedBy: string
  ): Promise<QualificationResult> {
    // 1. Validate lead exists and status allows qualification
    const lead = await prisma.crm_leads.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        status: true,
        email: true,
        tenant_id: true,
        fleet_size: true,
      },
    });

    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const invalidStatuses = ["converted", "disqualified"];
    if (lead.status && invalidStatuses.includes(lead.status)) {
      throw new Error(`Cannot qualify lead with status: ${lead.status}`);
    }

    // 2. Evaluate BANT criteria
    const { criteria_met, details } = await this.evaluateBant(bant);

    // 3. Determine result with fleet_size exception
    const { result, fleetSizeException } = await this.determineResult(
      criteria_met,
      lead.fleet_size
    );

    // 4. Write to DB in transaction
    const qualifiedAt = result === "qualified" ? new Date() : null;

    // Resolve member id from auth user id for bant_qualified_by
    const member = await prisma.adm_members.findFirst({
      where: { auth_user_id: performedBy, deleted_at: null },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.crm_leads.update({
        where: { id: leadId },
        data: {
          bant_budget: bant.bant_budget,
          bant_authority: bant.bant_authority,
          bant_need: bant.bant_need,
          bant_timeline: bant.bant_timeline,
          bant_qualified_at: qualifiedAt,
          bant_qualified_by: member?.id ?? null,
          qualification_notes: JSON.stringify({
            framework: "BANT",
            criteria_met,
            result,
            details,
            fleet_size_exception: fleetSizeException,
            performed_by: performedBy,
            performed_at: new Date().toISOString(),
          }),
          updated_at: new Date(),
        },
      });

      await tx.crm_lead_activities.create({
        data: {
          tenant_id: lead.tenant_id,
          lead_id: leadId,
          activity_type: "lead_qualified",
          title: `BANT qualification: ${criteria_met}/4 criteria met → ${result}`,
          description: `B:${bant.bant_budget} A:${bant.bant_authority} N:${bant.bant_need} T:${bant.bant_timeline}${fleetSizeException ? " (fleet size exception applied)" : ""}`,
          performed_by: member?.id ?? null,
          created_at: new Date(),
        },
      });
    });

    logger.info(
      { leadId, criteria_met, result, fleetSizeException, performedBy },
      "[LeadQualificationService] Lead qualified with BANT"
    );

    // 6. Auto-update status if qualified
    let statusUpdated = false;
    if (result === "qualified") {
      const statusResult = await leadStatusService.updateStatus(
        leadId,
        "qualified",
        { performedBy: member?.id ?? performedBy }
      );
      statusUpdated = statusResult.success;

      if (!statusResult.success) {
        logger.warn(
          { leadId, error: statusResult.error },
          "[LeadQualificationService] Failed to auto-update status to qualified"
        );
      }
    }

    return {
      success: true,
      leadId,
      result,
      criteria_met,
      details,
      fleet_size_exception: fleetSizeException,
      status_updated: statusUpdated,
      qualified_date: qualifiedAt?.toISOString() ?? null,
    };
  }

  /**
   * Clear caches (useful for testing or when settings change)
   */
  clearCache(): void {
    this.frameworkCache = null;
  }
}

// ===== SINGLETON INSTANCE =====

export const leadQualificationService = new LeadQualificationService();
