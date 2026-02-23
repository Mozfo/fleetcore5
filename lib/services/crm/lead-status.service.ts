/**
 * Lead Status Service - V6.2-6
 * Gestion des transitions de statut et validation des loss reasons
 *
 * Ce service est le SEUL point d'acces pour:
 * - Valider les transitions de statut (from crm_settings.lead_status_workflow)
 * - Valider les loss reasons (from crm_settings.lead_loss_reasons)
 * - Mettre a jour le statut avec audit trail
 *
 * ZERO HARDCODING: Toutes les regles viennent de crm_settings
 *
 * @module lib/services/crm/lead-status.service
 */

import { prisma } from "@/lib/prisma";
import { CrmSettingsRepository } from "@/lib/repositories/crm/settings.repository";
import { BlacklistService } from "./blacklist.service";
import { logger } from "@/lib/logger";
import type { StatusTransitionResult } from "@/lib/validators/crm/lead-status.validators";

// ===== TYPES & INTERFACES =====

/**
 * Status configuration from crm_settings.lead_status_workflow
 */
export interface StatusConfig {
  value: string;
  label_fr: string;
  label_en: string;
  phase: string;
  probability: number;
  color: string;
  icon: string;
  description: string;
  allowed_transitions: string[];
  auto_assign: boolean;
  sla_hours: number | null;
  is_terminal?: boolean;
  is_won?: boolean;
  requires_reason?: boolean;
}

/**
 * Status workflow from crm_settings
 */
export interface StatusWorkflow {
  version: string;
  statuses: StatusConfig[];
  phases: {
    value: string;
    label_fr: string;
    label_en: string;
    order: number;
  }[];
}

/**
 * Loss reason from crm_settings.lead_loss_reasons
 */
export interface LossReason {
  code: string;
  label_en: string;
  label_fr: string;
  category: "lost" | "disqualified";
  requires_detail: boolean;
  detail_field?: string;
}

/**
 * Loss reasons config from crm_settings
 */
export interface LossReasonsConfig {
  version: string;
  reasons: LossReason[];
}

/**
 * Options for status update
 */
export interface UpdateStatusOptions {
  lossReasonCode?: string;
  lossReasonDetail?: string;
  performedBy: string;
}

/**
 * Input for disqualifying a lead (V6.6)
 */
export interface DisqualifyLeadInput {
  leadId: string;
  reason: string;
  comment?: string | null;
  disqualifiedBy: string | null;
  addToBlacklist: boolean;
  tenantId: string;
}

// ===== SERVICE CLASS =====

/**
 * LeadStatusService - Gestion des statuts lead avec validation
 *
 * Charge les regles depuis crm_settings:
 * - lead_status_workflow: Statuts et transitions autorisees
 * - lead_loss_reasons: Raisons de perte/disqualification
 *
 * @example
 * ```typescript
 * import { leadStatusService } from "@/lib/services/crm/lead-status.service";
 *
 * // Valider une transition
 * const isValid = await leadStatusService.validateTransition("new", "demo");
 *
 * // Changer le statut
 * const result = await leadStatusService.updateStatus(leadId, "lost", {
 *   lossReasonCode: "chose_competitor",
 *   lossReasonDetail: "Went with Tourmo",
 *   performedBy: userId,
 * });
 * ```
 */
export class LeadStatusService {
  private settingsRepo: CrmSettingsRepository;
  private workflowCache: StatusWorkflow | null = null;
  private lossReasonsCache: LossReasonsConfig | null = null;

  constructor() {
    this.settingsRepo = new CrmSettingsRepository(prisma);
  }

  // ============================================
  // WORKFLOW METHODS
  // ============================================

  /**
   * Get status workflow from crm_settings
   * Uses cache to reduce DB queries
   */
  async getWorkflow(): Promise<StatusWorkflow> {
    if (this.workflowCache) {
      return this.workflowCache;
    }

    const setting = await this.settingsRepo.getSettingValue<StatusWorkflow>(
      "lead_status_workflow"
    );

    if (!setting) {
      throw new Error("lead_status_workflow not found in crm_settings");
    }

    this.workflowCache = setting;
    return setting;
  }

  /**
   * Get status config by value
   */
  async getStatusConfig(status: string): Promise<StatusConfig | null> {
    const workflow = await this.getWorkflow();
    return workflow.statuses.find((s) => s.value === status) || null;
  }

  /**
   * Get allowed transitions for a status
   */
  async getAllowedTransitions(currentStatus: string): Promise<string[]> {
    const config = await this.getStatusConfig(currentStatus);
    return config?.allowed_transitions || [];
  }

  /**
   * Validate if a transition is allowed
   */
  async validateTransition(
    currentStatus: string,
    newStatus: string
  ): Promise<boolean> {
    const allowed = await this.getAllowedTransitions(currentStatus);
    return allowed.includes(newStatus);
  }

  // ============================================
  // LOSS REASONS METHODS
  // ============================================

  /**
   * Get loss reasons from crm_settings
   */
  async getLossReasons(): Promise<LossReason[]> {
    if (this.lossReasonsCache) {
      return this.lossReasonsCache.reasons;
    }

    const setting =
      await this.settingsRepo.getSettingValue<LossReasonsConfig>(
        "lead_loss_reasons"
      );

    if (!setting) {
      throw new Error("lead_loss_reasons not found in crm_settings");
    }

    this.lossReasonsCache = setting;
    return setting.reasons;
  }

  /**
   * Get loss reasons by category
   */
  async getLossReasonsByCategory(
    category: "lost" | "disqualified"
  ): Promise<LossReason[]> {
    const reasons = await this.getLossReasons();
    return reasons.filter((r) => r.category === category);
  }

  /**
   * Validate a loss reason code
   */
  async validateLossReason(
    code: string,
    targetStatus: string
  ): Promise<{
    valid: boolean;
    requiresDetail: boolean;
    error?: string;
  }> {
    // Only lost and disqualified require reasons
    if (targetStatus !== "lost" && targetStatus !== "disqualified") {
      return { valid: true, requiresDetail: false };
    }

    const reasons = await this.getLossReasons();
    const reason = reasons.find((r) => r.code === code);

    if (!reason) {
      return {
        valid: false,
        requiresDetail: false,
        error: `Invalid loss reason code: ${code}`,
      };
    }

    // Check category matches target status
    if (reason.category !== targetStatus) {
      return {
        valid: false,
        requiresDetail: false,
        error: `Loss reason "${code}" is for "${reason.category}" status, not "${targetStatus}"`,
      };
    }

    return {
      valid: true,
      requiresDetail: reason.requires_detail,
    };
  }

  // ============================================
  // STATUS UPDATE
  // ============================================

  /**
   * Update lead status with validation and audit trail
   */
  async updateStatus(
    leadId: string,
    newStatus: string,
    options: UpdateStatusOptions
  ): Promise<StatusTransitionResult> {
    const { lossReasonCode, lossReasonDetail, performedBy } = options;

    try {
      // 1. Get current lead
      const lead = await prisma.crm_leads.findUnique({
        where: { id: leadId },
        select: { id: true, status: true, email: true, tenant_id: true },
      });

      if (!lead) {
        return {
          success: false,
          leadId,
          previousStatus: "",
          newStatus,
          error: "Lead not found",
        };
      }

      const previousStatus = lead.status || "new";

      // Resolve tenant_id for activity log
      let activityTenantId = lead.tenant_id;
      if (!activityTenantId) {
        const hqTenant = await prisma.adm_tenants.findFirst({
          where: { tenant_type: "headquarters" },
          select: { id: true },
        });
        activityTenantId = hqTenant?.id ?? null;
      }

      // 2. Validate transition
      const isValidTransition = await this.validateTransition(
        previousStatus,
        newStatus
      );
      if (!isValidTransition) {
        return {
          success: false,
          leadId,
          previousStatus,
          newStatus,
          error: `Invalid transition from '${previousStatus}' to '${newStatus}'`,
        };
      }

      // 3. Validate loss reason if required
      const statusConfig = await this.getStatusConfig(newStatus);
      if (statusConfig?.requires_reason) {
        if (!lossReasonCode) {
          return {
            success: false,
            leadId,
            previousStatus,
            newStatus,
            error: `loss_reason_code is required when status is '${newStatus}'`,
          };
        }

        const reasonValidation = await this.validateLossReason(
          lossReasonCode,
          newStatus
        );
        if (!reasonValidation.valid) {
          return {
            success: false,
            leadId,
            previousStatus,
            newStatus,
            error: reasonValidation.error,
          };
        }

        if (reasonValidation.requiresDetail && !lossReasonDetail) {
          return {
            success: false,
            leadId,
            previousStatus,
            newStatus,
            error: `loss_reason_detail is required for reason '${lossReasonCode}'`,
          };
        }
      }

      // 4. Build update data
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date(),
      };

      // Set loss reason fields if provided
      if (lossReasonCode) {
        updateData.loss_reason_code = lossReasonCode;
      }
      if (lossReasonDetail) {
        updateData.loss_reason_detail = lossReasonDetail;
      }

      // Set converted_at if status is converted
      if (newStatus === "converted" && statusConfig?.is_won) {
        updateData.converted_at = new Date();
      }

      // 5. Update lead and create activity in transaction
      await prisma.$transaction(async (tx) => {
        // Update lead
        await tx.crm_leads.update({
          where: { id: leadId },
          data: updateData,
        });

        // Create activity
        if (activityTenantId) {
          await tx.crm_lead_activities.create({
            data: {
              tenant_id: activityTenantId,
              lead_id: leadId,
              activity_type: "status_change",
              title: `Status changed from ${previousStatus} to ${newStatus}`,
              description: lossReasonCode
                ? `Reason: ${lossReasonCode}${lossReasonDetail ? ` - ${lossReasonDetail}` : ""}`
                : null,
              performed_by: performedBy,
              created_at: new Date(),
            },
          });
        }
      });

      logger.info(
        {
          leadId,
          previousStatus,
          newStatus,
          lossReasonCode,
          performedBy,
        },
        "[LeadStatusService] Status updated"
      );

      return {
        success: true,
        leadId,
        previousStatus,
        newStatus,
      };
    } catch (error) {
      logger.error(
        { error, leadId, newStatus },
        "[LeadStatusService] Error updating status"
      );
      return {
        success: false,
        leadId,
        previousStatus: "",
        newStatus,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================
  // DISQUALIFY LEAD (V6.6)
  // ============================================

  /**
   * Disqualify a lead with full audit trail
   *
   * - Disqualification is a terminal admin action: allowed from ANY status
   * - Sets disqualification fields (at, reason, comment, by)
   * - Creates activity in transaction
   * - Optionally adds email to blacklist
   */
  async disqualifyLead(
    input: DisqualifyLeadInput
  ): Promise<StatusTransitionResult> {
    const {
      leadId,
      reason,
      comment,
      disqualifiedBy,
      addToBlacklist,
      tenantId,
    } = input;

    try {
      // 1. Get current lead
      const lead = await prisma.crm_leads.findUnique({
        where: { id: leadId },
        select: { id: true, status: true, email: true },
      });

      if (!lead) {
        return {
          success: false,
          leadId,
          previousStatus: "",
          newStatus: "disqualified",
          error: "Lead not found",
        };
      }

      const previousStatus = lead.status || "new";

      // 2. Disqualification is a terminal admin action - allowed from ANY status
      // (no workflow transition validation needed)

      // 3. Update lead + activity in transaction
      await prisma.$transaction(async (tx) => {
        await tx.crm_leads.update({
          where: { id: leadId },
          data: {
            status: "disqualified",
            disqualified_at: new Date(),
            disqualification_reason: reason,
            disqualification_comment: comment || null,
            disqualified_by: disqualifiedBy,
            updated_at: new Date(),
          },
        });

        await tx.crm_lead_activities.create({
          data: {
            tenant_id: tenantId,
            lead_id: leadId,
            activity_type: "status_change",
            title: `Lead disqualified (from ${previousStatus})`,
            description: `Reason: ${reason}${comment ? ` - ${comment}` : ""}`,
            performed_by: disqualifiedBy,
            performed_by_name: disqualifiedBy ? null : "system",
            created_at: new Date(),
          },
        });
      });

      // 4. Add to blacklist if requested (outside transaction - non-blocking)
      if (addToBlacklist && lead.email) {
        try {
          const blacklistSvc = new BlacklistService();
          await blacklistSvc.addToBlacklist({
            tenantId,
            email: lead.email,
            reason: "disqualified",
            reasonComment: `Disqualified: ${reason}`,
            originalLeadId: leadId,
            blacklistedBy: disqualifiedBy,
          });
        } catch (blError) {
          logger.error(
            { error: blError, leadId, email: lead.email },
            "[LeadStatusService] Failed to add to blacklist (non-blocking)"
          );
        }
      }

      logger.info(
        { leadId, previousStatus, reason, disqualifiedBy, addToBlacklist },
        "[LeadStatusService] Lead disqualified"
      );

      return {
        success: true,
        leadId,
        previousStatus,
        newStatus: "disqualified",
      };
    } catch (error) {
      logger.error(
        { error, leadId },
        "[LeadStatusService] Error disqualifying lead"
      );
      return {
        success: false,
        leadId,
        previousStatus: "",
        newStatus: "disqualified",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Clear caches (useful for testing or when settings change)
   */
  clearCache(): void {
    this.workflowCache = null;
    this.lossReasonsCache = null;
  }
}

// ===== SINGLETON INSTANCE =====

/**
 * Default LeadStatusService instance
 */
export const leadStatusService = new LeadStatusService();
