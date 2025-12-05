#!/usr/bin/env tsx
/**
 * Manual Script: Degrade Inactive Lead Scores
 *
 * Runs the score degradation process for leads that have been inactive
 * beyond the threshold configured in crm_settings.score_decay.
 *
 * Usage:
 *   pnpm exec tsx scripts/degrade-inactive-leads.ts
 *
 * Options:
 *   --dry-run    Show what would be changed without making updates
 *
 * Configuration:
 *   All thresholds loaded from crm_settings.score_decay (NOT hardcoded)
 *
 * @module scripts/degrade-inactive-leads
 */

import { LeadScoringService } from "@/lib/services/crm/lead-scoring.service";
import { CrmSettingsRepository } from "@/lib/repositories/crm/settings.repository";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const isDryRun = process.argv.includes("--dry-run");

function print(message: string) {
  process.stdout.write(message + "\n");
}

async function main() {
  print("=".repeat(60));
  print("Lead Score Degradation Script");
  print("=".repeat(60));
  print(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "LIVE"}`);
  print(`Time: ${new Date().toISOString()}`);
  print("");

  try {
    // 1. Load and display current configuration
    const settingsRepo = new CrmSettingsRepository(prisma);
    const decayConfig = await settingsRepo.getSettingValue<{
      enabled: boolean;
      inactivity_threshold_days: number;
      decay_type: string;
      decay_value: number;
      minimum_score: number;
    }>("score_decay");

    print("Configuration (from crm_settings.score_decay):");
    print("-".repeat(40));

    if (!decayConfig) {
      print("ERROR: score_decay setting not found!");
      print("Run the migration SQL to create this setting.");
      process.exit(1);
    }

    print(`  Enabled: ${decayConfig.enabled}`);
    print(
      `  Inactivity Threshold: ${decayConfig.inactivity_threshold_days} days`
    );
    print(`  Decay: ${decayConfig.decay_value}% (${decayConfig.decay_type})`);
    print(`  Minimum Score: ${decayConfig.minimum_score}`);
    print("");

    if (!decayConfig.enabled) {
      print("Score decay is DISABLED in settings. Exiting.");
      process.exit(0);
    }

    // 2. Preview: Count inactive leads
    const thresholdDate = new Date();
    thresholdDate.setDate(
      thresholdDate.getDate() - decayConfig.inactivity_threshold_days
    );

    const inactiveCount = await prisma.crm_leads.count({
      where: {
        deleted_at: null,
        lead_stage: { notIn: ["opportunity"] },
        OR: [
          { last_activity_at: { lt: thresholdDate } },
          { last_activity_at: null, created_at: { lt: thresholdDate } },
        ],
      },
    });

    print(
      `Found ${inactiveCount} inactive leads (older than ${decayConfig.inactivity_threshold_days} days)`
    );
    print("");

    if (inactiveCount === 0) {
      print("No leads to process. Exiting.");
      process.exit(0);
    }

    // 3. Execute or simulate
    if (isDryRun) {
      print("DRY RUN: Would process these leads...");

      const inactiveLeads = await prisma.crm_leads.findMany({
        where: {
          deleted_at: null,
          lead_stage: { notIn: ["opportunity"] },
          OR: [
            { last_activity_at: { lt: thresholdDate } },
            { last_activity_at: null, created_at: { lt: thresholdDate } },
          ],
        },
        select: {
          id: true,
          email: true,
          engagement_score: true,
          lead_stage: true,
          last_activity_at: true,
          created_at: true,
        },
        take: 10, // Limit preview
      });

      print("-".repeat(60));
      for (const lead of inactiveLeads) {
        const lastActivity = lead.last_activity_at ?? lead.created_at;
        const daysInactive = Math.floor(
          (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );
        const currentEngagement = Number(lead.engagement_score ?? 0);
        const projectedDecay =
          (currentEngagement * decayConfig.decay_value) / 100;
        const projectedNew = Math.max(
          currentEngagement - projectedDecay,
          decayConfig.minimum_score
        );

        print(
          `  ${lead.email.substring(0, 30).padEnd(30)} | ` +
            `Days: ${daysInactive.toString().padStart(3)} | ` +
            `Eng: ${currentEngagement.toFixed(0).padStart(3)} -> ${projectedNew.toFixed(0).padStart(3)} | ` +
            `Stage: ${lead.lead_stage}`
        );
      }

      if (inactiveCount > 10) {
        print(`  ... and ${inactiveCount - 10} more`);
      }
      print("-".repeat(60));
      print("");
      print("To apply changes, run without --dry-run flag");
    } else {
      print("Executing degradation...");
      print("");

      const scoringService = new LeadScoringService();
      const result = await scoringService.degradeInactiveScores();

      print("Results:");
      print("-".repeat(40));
      print(`  Processed: ${result.processed}`);
      print(`  Degraded:  ${result.degraded}`);
      print(`  Stage Changes: ${result.stageChanges}`);
      print(`  Errors: ${result.errors}`);
      print("");

      if (result.details.length > 0) {
        print("Details (first 10):");
        print("-".repeat(60));
        for (const detail of result.details.slice(0, 10)) {
          print(
            `  ${detail.leadId.substring(0, 8)}... | ` +
              `Days: ${detail.daysInactive.toString().padStart(3)} | ` +
              `Eng: ${detail.previousEngagement.toFixed(0).padStart(3)} -> ${detail.newEngagement.toFixed(0).padStart(3)} | ` +
              `Stage Changed: ${detail.stageChanged}`
          );
        }
        if (result.details.length > 10) {
          print(`  ... and ${result.details.length - 10} more`);
        }
      }

      logger.info(
        {
          processed: result.processed,
          degraded: result.degraded,
          stageChanges: result.stageChanges,
          errors: result.errors,
        },
        "[degrade-inactive-leads] Script completed"
      );
    }

    print("");
    print("=".repeat(60));
    print("Done!");
  } catch (error) {
    logger.error({ error }, "[degrade-inactive-leads] Script failed");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
