/**
 * Opportunity Rotting Detection Service
 *
 * Detects opportunities that have been in the same stage
 * longer than the configured max_days_in_stage threshold.
 *
 * Called by cron job: /api/cron/opportunities/rotting
 * Schedule: Daily at 8:00 AM
 *
 * @module lib/services/crm/opportunity-rotting.service
 */

import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  getStageConfig,
  OPPORTUNITY_STAGES,
} from "@/lib/config/opportunity-stages";
import { NotificationQueueService } from "@/lib/services/notification/queue.service";
import { getTenantContext } from "@/lib/auth/server";

/**
 * Result of rotting detection
 */
export interface RottingDetectionResult {
  /** Number of opportunities checked */
  checked: number;
  /** Number of rotting opportunities detected */
  rotting: number;
  /** IDs of rotting opportunities */
  rottingIds: string[];
  /** Number of alerts created */
  alertsCreated: number;
  /** Errors encountered */
  errors: string[];
}

/**
 * Rotting opportunity with computed data
 */
export interface RottingOpportunity {
  id: string;
  stage: string;
  stageEnteredAt: Date;
  maxDays: number;
  daysInStage: number;
  daysOverdue: number;
  leadId: string | null;
  opportunityName: string | null;
  expectedValue: number | null;
  assignedTo: string | null;
}

/**
 * Service for detecting and alerting on rotting opportunities
 */
export class OpportunityRottingService {
  /**
   * Detect all rotting opportunities
   *
   * An opportunity is "rotting" when:
   * - status is 'open' (not won/lost)
   * - days since stage_entered_at > max_days_in_stage
   *
   * Applies tenant filter for multi-division isolation:
   * - Regular employees see only their division's opportunities
   * - CEO (tenantId = null) sees all opportunities
   */
  async detectRottingOpportunities(): Promise<RottingOpportunity[]> {
    const { tenantId } = await getTenantContext();

    // Fetch all open opportunities with stage timing data
    // Filter by tenant_id for multi-division isolation
    const opportunities = await db.crm_opportunities.findMany({
      where: {
        status: "open",
        tenant_id: tenantId ?? undefined,
      },
      select: {
        id: true,
        stage: true,
        stage_entered_at: true,
        max_days_in_stage: true,
        lead_id: true,
        expected_value: true,
        assigned_to: true,
        metadata: true,
      },
    });

    const now = new Date();
    const rottingOpportunities: RottingOpportunity[] = [];

    for (const opp of opportunities) {
      // Get max days from DB or fallback to config
      const stageConfig = getStageConfig(opp.stage);
      const maxDays = opp.max_days_in_stage ?? stageConfig?.maxDays ?? 14;

      // Calculate days in current stage
      const daysInStage = Math.floor(
        (now.getTime() - opp.stage_entered_at.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if rotting
      if (daysInStage > maxDays) {
        const metadata = opp.metadata as Record<string, unknown> | null;
        rottingOpportunities.push({
          id: opp.id,
          stage: opp.stage,
          stageEnteredAt: opp.stage_entered_at,
          maxDays,
          daysInStage,
          daysOverdue: daysInStage - maxDays,
          leadId: opp.lead_id,
          opportunityName: (metadata?.opportunity_name as string) || null,
          expectedValue: opp.expected_value ? Number(opp.expected_value) : null,
          assignedTo: opp.assigned_to,
        });
      }
    }

    return rottingOpportunities;
  }

  /**
   * Run full rotting detection and create alerts
   *
   * This is the main entry point called by the cron job.
   * It detects rotting opportunities and can create notifications.
   *
   * Applies tenant filter for multi-division isolation.
   */
  async processRottingOpportunities(): Promise<RottingDetectionResult> {
    const { tenantId } = await getTenantContext();

    const result: RottingDetectionResult = {
      checked: 0,
      rotting: 0,
      rottingIds: [],
      alertsCreated: 0,
      errors: [],
    };

    try {
      // Count total open opportunities (filtered by tenant)
      const totalOpen = await db.crm_opportunities.count({
        where: { status: "open", tenant_id: tenantId ?? undefined },
      });
      result.checked = totalOpen;

      // Detect rotting
      const rottingOpportunities = await this.detectRottingOpportunities();
      result.rotting = rottingOpportunities.length;
      result.rottingIds = rottingOpportunities.map((o) => o.id);

      // Log rotting opportunities
      if (rottingOpportunities.length > 0) {
        logger.warn(
          {
            count: rottingOpportunities.length,
            opportunities: rottingOpportunities.map((o) => ({
              id: o.id,
              stage: o.stage,
              daysInStage: o.daysInStage,
              daysOverdue: o.daysOverdue,
              opportunityName: o.opportunityName,
            })),
          },
          "[OpportunityRottingService] Rotting opportunities detected"
        );

        // Check if rotting notifications are enabled
        const notificationsEnabled = await this.areNotificationsEnabled();

        if (notificationsEnabled) {
          // Queue notifications for rotting opportunities
          const notificationService = new NotificationQueueService();

          for (const opp of rottingOpportunities) {
            if (opp.assignedTo) {
              try {
                // Get assignee email from clt_members
                const assignee = await db.clt_members.findUnique({
                  where: { id: opp.assignedTo },
                  select: { email: true, first_name: true },
                });

                if (assignee?.email) {
                  const queueResult =
                    await notificationService.queueNotification({
                      templateCode: "opportunity_rotting_alert",
                      recipientEmail: assignee.email,
                      locale: "en", // Default locale for internal notifications
                      variables: {
                        first_name: assignee.first_name || "Team member",
                        opportunity_id: opp.id,
                        opportunity_name:
                          opp.opportunityName || "Unnamed opportunity",
                        stage: opp.stage,
                        days_in_stage: opp.daysInStage,
                        days_overdue: opp.daysOverdue,
                        expected_value: opp.expectedValue,
                        max_days: opp.maxDays,
                      },
                      idempotencyKey: `rotting_${opp.id}_${new Date().toISOString().split("T")[0]}`,
                      processImmediately: false, // Let cron handle it
                    });

                  if (queueResult.success) {
                    result.alertsCreated++;
                  } else {
                    result.errors.push(
                      `Failed to queue notification for opp ${opp.id}: ${queueResult.error}`
                    );
                  }
                }
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                result.errors.push(
                  `Error notifying for opp ${opp.id}: ${errorMessage}`
                );
              }
            }
          }

          logger.info(
            { alertsCreated: result.alertsCreated },
            "[OpportunityRottingService] Rotting alerts queued"
          );
        }
      } else {
        logger.info(
          { checked: totalOpen },
          "[OpportunityRottingService] No rotting opportunities found"
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      logger.error(
        { error: errorMessage },
        "[OpportunityRottingService] Error processing rotting opportunities"
      );
      return result;
    }
  }

  /**
   * Get summary statistics for dashboard
   *
   * Applies tenant filter for multi-division isolation:
   * - Regular employees see only their division's statistics
   * - CEO (tenantId = null) sees global statistics
   */
  async getRottingSummary(): Promise<{
    total: number;
    rotting: number;
    byStage: Record<string, { total: number; rotting: number }>;
  }> {
    const { tenantId } = await getTenantContext();

    const opportunities = await db.crm_opportunities.findMany({
      where: { status: "open", tenant_id: tenantId ?? undefined },
      select: {
        id: true,
        stage: true,
        stage_entered_at: true,
        max_days_in_stage: true,
      },
    });

    const now = new Date();
    const byStage: Record<string, { total: number; rotting: number }> = {};

    // Initialize all stages
    for (const stage of OPPORTUNITY_STAGES) {
      byStage[stage.value] = { total: 0, rotting: 0 };
    }

    let rottingCount = 0;

    for (const opp of opportunities) {
      if (!byStage[opp.stage]) {
        byStage[opp.stage] = { total: 0, rotting: 0 };
      }
      byStage[opp.stage].total++;

      // stage_entered_at is now required (NOT NULL with default)
      const stageConfig = getStageConfig(opp.stage);
      const maxDays = opp.max_days_in_stage ?? stageConfig?.maxDays ?? 14;
      const daysInStage = Math.floor(
        (now.getTime() - opp.stage_entered_at.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysInStage > maxDays) {
        byStage[opp.stage].rotting++;
        rottingCount++;
      }
    }

    return {
      total: opportunities.length,
      rotting: rottingCount,
      byStage,
    };
  }

  /**
   * Check if rotting notifications are enabled
   * Reads from crm_settings: opportunity_stages.rotting.alert_owner
   *
   * Applies hybrid filter for crm_settings (system + custom per division).
   *
   * @returns true if notifications should be sent
   */
  private async areNotificationsEnabled(): Promise<boolean> {
    try {
      // crm_settings is a GLOBAL table (no tenant_id filter needed)
      const setting = await db.crm_settings.findFirst({
        where: {
          setting_key: "opportunity_stages",
          is_active: true,
          deleted_at: null,
        },
        select: { setting_value: true },
      });

      if (setting?.setting_value) {
        const value = setting.setting_value as {
          rotting?: { enabled?: boolean; alert_owner?: boolean };
        };

        // Check both rotting.enabled AND rotting.alert_owner
        const rottingConfig = value.rotting;
        return (
          rottingConfig?.enabled !== false &&
          rottingConfig?.alert_owner !== false
        );
      }

      // Default: enabled if setting doesn't exist
      return true;
    } catch (error) {
      logger.error(
        { error },
        "[OpportunityRottingService] Error checking notification settings"
      );
      return false;
    }
  }
}
