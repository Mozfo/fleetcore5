/**
 * Direct test of stage change via Prisma
 * Tests the core database operation without auth
 */

import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  getStageProbability,
  getStageMaxDays,
} from "@/lib/config/opportunity-stages";
import type { Prisma } from "@prisma/client";

async function testStageChange() {
  logger.info("=== Testing Stage Change Operation ===");

  try {
    // 1. Get an open opportunity
    const opportunity = await db.crm_opportunities.findFirst({
      where: { status: "open", deleted_at: null },
      select: {
        id: true,
        stage: true,
        status: true,
        expected_value: true,
        metadata: true,
      },
    });

    if (!opportunity) {
      logger.error("No open opportunity found");
      process.exit(1);
    }

    logger.info(
      {
        id: opportunity.id,
        currentStage: opportunity.stage,
        status: opportunity.status,
      },
      "Found opportunity"
    );

    // 2. Determine new stage (cycle through stages)
    const stages = [
      "qualification",
      "demo",
      "proposal",
      "negotiation",
      "contract_sent",
    ];
    const currentIndex = stages.indexOf(opportunity.stage);
    const newStage = stages[(currentIndex + 1) % stages.length];

    logger.info({ from: opportunity.stage, to: newStage }, "Changing stage");

    // 3. Calculate new values
    const newProbability = getStageProbability(newStage);
    const newMaxDays = getStageMaxDays(newStage);
    const expectedValue = opportunity.expected_value
      ? Number(opportunity.expected_value)
      : null;
    const newForecast =
      expectedValue !== null ? expectedValue * (newProbability / 100) : null;

    // 4. Build update data
    const now = new Date();
    const existingMetadata =
      (opportunity.metadata as Record<string, unknown>) || {};
    const stageHistory =
      (existingMetadata.stage_history as Array<unknown>) || [];

    const updateData: Prisma.crm_opportunitiesUpdateInput = {
      stage: newStage,
      stage_entered_at: now,
      max_days_in_stage: newMaxDays,
      probability_percent: newProbability,
      forecast_value: newForecast,
      updated_at: now,
      metadata: {
        ...existingMetadata,
        stage_history: [
          ...stageHistory,
          {
            from: opportunity.stage,
            to: newStage,
            at: now.toISOString(),
          },
        ],
      } as Prisma.InputJsonValue,
    };

    // 5. Update
    const updated = await db.crm_opportunities.update({
      where: { id: opportunity.id },
      data: updateData,
      select: {
        id: true,
        stage: true,
        probability_percent: true,
        forecast_value: true,
        stage_entered_at: true,
      },
    });

    logger.info(
      {
        id: updated.id,
        newStage: updated.stage,
        probability: updated.probability_percent,
        forecast: updated.forecast_value,
      },
      "PASS: Stage updated successfully"
    );

    // 6. Revert for test cleanup
    logger.info("Reverting stage for cleanup...");
    await db.crm_opportunities.update({
      where: { id: opportunity.id },
      data: {
        stage: opportunity.stage,
        stage_entered_at: now,
        metadata: opportunity.metadata as Prisma.InputJsonValue,
      },
    });
    logger.info("Cleanup complete");
  } catch (error) {
    logger.error({ error }, "FAIL: Stage change failed");
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

void testStageChange();
