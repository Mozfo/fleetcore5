/**
 * GET /api/cron/nurturing
 *
 * V6.6 - Cron job for nurturing pipeline
 *
 * Endpoint: GET /api/cron/nurturing
 * Schedule: Every hour
 * Security: Protected by CRON_SECRET header
 *
 * Executes 5 sequential steps:
 * 1. Recovery notifications (leads with email_verified but wizard incomplete after 1h)
 * 2. Migration to crm_nurturing (after 24h without completion)
 * 3. J+1 nurturing emails (step 0 → step 1)
 * 4. J+7 nurturing emails (step 1 → step 2)
 * 5. Archive expired entries (step 2 sent > 24h ago)
 *
 * @module app/api/cron/nurturing/route
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nurturingService } from "@/lib/services/crm/nurturing.service";
import { logger } from "@/lib/logger";

// ============================================================================
// CONFIG
// ============================================================================

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_PROVIDER_ID = "7ad8173c-68c5-41d3-9918-686e4e941cc0";

// ============================================================================
// TYPES
// ============================================================================

interface StepResult {
  processed: number;
  errors: number;
}

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // ========================================
    // SECURITY: Validate cron secret
    // ========================================
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error({}, "[CronNurturing] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    const xCronSecret = request.headers.get("x-cron-secret");
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || xCronSecret === cronSecret;

    if (!isAuthorized) {
      logger.warn(
        { authHeader: authHeader ? "present" : "missing" },
        "[CronNurturing] Unauthorized request"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ========================================
    // STEP 1: Recovery notifications
    // Find leads with email_verified=true, wizard_completed=false,
    // created > 1h ago, no recovery notification sent yet
    // ========================================
    const step1Result: StepResult = { processed: 0, errors: 0 };

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const eligibleForRecovery = await prisma.crm_leads.findMany({
        where: {
          email_verified: true,
          wizard_completed: false,
          recovery_notification_sent_at: null,
          created_at: { lte: oneHourAgo },
          deleted_at: null,
          status: { in: ["new", "email_verified"] },
        },
        select: {
          id: true,
          email: true,
          language: true,
        },
        take: 50,
      });

      for (const lead of eligibleForRecovery) {
        try {
          // Mark as notified (actual email sending done by notification queue)
          await prisma.crm_leads.update({
            where: { id: lead.id },
            data: {
              recovery_notification_sent_at: new Date(),
              updated_at: new Date(),
            },
          });
          step1Result.processed++;
        } catch (err) {
          logger.error(
            { leadId: lead.id, error: err },
            "[CronNurturing] Step 1 - Failed to process lead"
          );
          step1Result.errors++;
        }
      }
    } catch (err) {
      logger.error({ error: err }, "[CronNurturing] Step 1 failed");
    }

    // ========================================
    // STEP 2: Migration to crm_nurturing
    // Find leads with email_verified=true, wizard_completed=false,
    // created > 24h ago, not yet migrated to nurturing
    // ========================================
    const step2Result: StepResult = { processed: 0, errors: 0 };

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const eligibleForMigration = await prisma.crm_leads.findMany({
        where: {
          email_verified: true,
          wizard_completed: false,
          created_at: { lte: twentyFourHoursAgo },
          deleted_at: null,
          status: { in: ["new", "email_verified"] },
          provider_id: { not: null },
        },
        take: 50,
      });

      for (const lead of eligibleForMigration) {
        try {
          // Create nurturing entry from lead (idempotent)
          await nurturingService.createFromLead(lead);

          // Update lead status to nurturing
          await prisma.crm_leads.update({
            where: { id: lead.id },
            data: {
              status: "nurturing",
              updated_at: new Date(),
            },
          });

          step2Result.processed++;
        } catch (err) {
          logger.error(
            { leadId: lead.id, error: err },
            "[CronNurturing] Step 2 - Failed to migrate lead"
          );
          step2Result.errors++;
        }
      }
    } catch (err) {
      logger.error({ error: err }, "[CronNurturing] Step 2 failed");
    }

    // ========================================
    // STEP 3: J+1 nurturing emails
    // nurturing_step=0, created >= 24h ago
    // ========================================
    const step3Result: StepResult = { processed: 0, errors: 0 };

    try {
      const eligible = await nurturingService.getEligibleForStep(
        1,
        DEFAULT_PROVIDER_ID
      );

      for (const entry of eligible) {
        try {
          // Advance to step 1 (actual email sending done by notification queue)
          await nurturingService.advanceNurturingStep(entry.id, 1);
          step3Result.processed++;
        } catch (err) {
          logger.error(
            { nurturingId: entry.id, error: err },
            "[CronNurturing] Step 3 - Failed to process J+1"
          );
          step3Result.errors++;
        }
      }
    } catch (err) {
      logger.error({ error: err }, "[CronNurturing] Step 3 failed");
    }

    // ========================================
    // STEP 4: J+7 nurturing emails
    // nurturing_step=1, last_nurturing_at >= 6 days ago
    // ========================================
    const step4Result: StepResult = { processed: 0, errors: 0 };

    try {
      const eligible = await nurturingService.getEligibleForStep(
        2,
        DEFAULT_PROVIDER_ID
      );

      for (const entry of eligible) {
        try {
          // Advance to step 2 (actual email sending done by notification queue)
          await nurturingService.advanceNurturingStep(entry.id, 2);
          step4Result.processed++;
        } catch (err) {
          logger.error(
            { nurturingId: entry.id, error: err },
            "[CronNurturing] Step 4 - Failed to process J+7"
          );
          step4Result.errors++;
        }
      }
    } catch (err) {
      logger.error({ error: err }, "[CronNurturing] Step 4 failed");
    }

    // ========================================
    // STEP 5: Archive expired entries
    // nurturing_step=2, last_nurturing_at >= 24h ago
    // ========================================
    const step5Result: StepResult = { processed: 0, errors: 0 };

    try {
      const archived =
        await nurturingService.archiveExpired(DEFAULT_PROVIDER_ID);
      step5Result.processed = archived;
    } catch (err) {
      logger.error({ error: err }, "[CronNurturing] Step 5 failed");
      step5Result.errors++;
    }

    // ========================================
    // RESPONSE
    // ========================================
    const duration = Date.now() - startTime;

    const summary = {
      step1_recovery: step1Result,
      step2_migration: step2Result,
      step3_j1_nurturing: step3Result,
      step4_j7_nurturing: step4Result,
      step5_archive: step5Result,
    };

    logger.info(
      { ...summary, durationMs: duration },
      "[CronNurturing] Cron completed"
    );

    return NextResponse.json({
      success: true,
      ...summary,
      durationMs: duration,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const duration = Date.now() - startTime;

    logger.error(
      { error: errorMessage, durationMs: duration },
      "[CronNurturing] Cron failed"
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}
