/**
 * Phase 2 Integration Tests
 * Tests core database operations for:
 * 1. Create Opportunity with assigned_to (FK fix validation)
 * 2. Create Activity on Lead
 * 3. Create Activity on Opportunity
 * 4. Update Opportunity Stage (drag & drop simulation)
 */

import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  getStageProbability,
  getStageMaxDays,
} from "@/lib/config/opportunity-stages";
import type { Prisma } from "@prisma/client";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testCreateOpportunityWithAssignedTo(): Promise<void> {
  const testName = "Create Opportunity with assigned_to";
  logger.info(`\n=== TEST: ${testName} ===`);

  try {
    // V6.3: Get a valid lead (qualified → proposal_sent)
    const lead = await db.crm_leads.findFirst({
      where: { deleted_at: null, status: "proposal_sent" },
      select: { id: true, tenant_id: true },
    });

    if (!lead || !lead.tenant_id) {
      throw new Error("No proposal_sent lead with tenant_id found for test");
    }

    // Get a valid employee for assigned_to
    const employee = await db.clt_members.findFirst({
      where: { tenant_id: lead.tenant_id, deleted_at: null },
      select: { id: true },
    });

    if (!employee) {
      throw new Error("No employee found for assigned_to test");
    }

    // Create opportunity WITH assigned_to using raw SQL
    const testId = crypto.randomUUID();
    const testNotes = `TEST_INTEGRATION_${Date.now()}`;

    await db.$executeRaw`
      INSERT INTO crm_opportunities (
        id, lead_id, assigned_to, stage, status, expected_value,
        probability_percent, tenant_id, notes
      ) VALUES (
        ${testId}::uuid,
        ${lead.id}::uuid,
        ${employee.id}::uuid,
        'qualification',
        'open',
        1000,
        20,
        ${lead.tenant_id}::uuid,
        ${testNotes}
      )
    `;

    // Verify it was created
    const created = await db.crm_opportunities.findUnique({
      where: { id: testId },
      select: { id: true, assigned_to: true, notes: true },
    });

    if (!created) {
      throw new Error("Opportunity was not created");
    }

    logger.info(
      {
        id: created.id,
        assigned_to: created.assigned_to,
      },
      "PASS: Opportunity created with assigned_to"
    );

    // Cleanup
    await db.crm_opportunities.delete({ where: { id: testId } });
    logger.info("Cleanup complete");

    results.push({ name: testName, passed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, `FAIL: ${testName}`);
    results.push({ name: testName, passed: false, error: message });
  }
}

async function testCreateActivityOnLead(): Promise<void> {
  const testName = "Create Activity on Lead";
  logger.info(`\n=== TEST: ${testName} ===`);

  try {
    // Get a valid lead with provider
    const lead = await db.crm_leads.findFirst({
      where: { deleted_at: null },
      select: { id: true, tenant_id: true },
    });

    if (!lead || !lead.tenant_id) {
      throw new Error("No lead with tenant_id found for test");
    }

    // Get an employee for created_by
    const employee = await db.clt_members.findFirst({
      where: { tenant_id: lead.tenant_id, deleted_at: null },
      select: { id: true },
    });

    if (!employee) {
      throw new Error("No employee found");
    }

    // Create activity on lead using raw SQL
    const testId = crypto.randomUUID();
    const testSubject = `TEST_ACTIVITY_LEAD_${Date.now()}`;

    await db.$executeRaw`
      INSERT INTO crm_activities (
        id, lead_id, opportunity_id, tenant_id,
        activity_type, subject, description, created_by
      ) VALUES (
        ${testId}::uuid,
        ${lead.id}::uuid,
        NULL,
        ${lead.tenant_id}::uuid,
        'note',
        ${testSubject},
        'Integration test - activity on lead',
        ${employee.id}::uuid
      )
    `;

    // Verify it was created
    const result = await db.$queryRaw<
      Array<{ id: string; lead_id: string; opportunity_id: string | null }>
    >`SELECT id, lead_id, opportunity_id FROM crm_activities WHERE id = ${testId}::uuid`;

    if (result.length === 0) {
      throw new Error("Activity was not created");
    }

    logger.info(
      {
        id: result[0].id,
        lead_id: result[0].lead_id,
        opportunity_id: result[0].opportunity_id,
      },
      "PASS: Activity created on lead"
    );

    // Cleanup
    await db.$executeRaw`DELETE FROM crm_activities WHERE id = ${testId}::uuid`;
    logger.info("Cleanup complete");

    results.push({ name: testName, passed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, `FAIL: ${testName}`);
    results.push({ name: testName, passed: false, error: message });
  }
}

async function testCreateActivityOnOpportunity(): Promise<void> {
  const testName = "Create Activity on Opportunity";
  logger.info(`\n=== TEST: ${testName} ===`);

  try {
    // Get a valid opportunity with its lead
    const opportunity = await db.crm_opportunities.findFirst({
      where: { deleted_at: null, status: "open" },
      select: {
        id: true,
        lead_id: true,
        tenant_id: true,
      },
    });

    if (!opportunity) {
      throw new Error("No open opportunity found for test");
    }

    // Get an employee for created_by
    const employee = await db.clt_members.findFirst({
      where: { tenant_id: opportunity.tenant_id, deleted_at: null },
      select: { id: true },
    });

    if (!employee) {
      throw new Error("No employee found");
    }

    // Create activity on opportunity using raw SQL
    const testId = crypto.randomUUID();
    const testSubject = `TEST_ACTIVITY_OPP_${Date.now()}`;

    await db.$executeRaw`
      INSERT INTO crm_activities (
        id, lead_id, opportunity_id, tenant_id,
        activity_type, subject, description, created_by
      ) VALUES (
        ${testId}::uuid,
        ${opportunity.lead_id}::uuid,
        ${opportunity.id}::uuid,
        ${opportunity.tenant_id}::uuid,
        'meeting',
        ${testSubject},
        'Integration test - activity on opportunity',
        ${employee.id}::uuid
      )
    `;

    // Verify it was created
    const result = await db.$queryRaw<
      Array<{ id: string; lead_id: string; opportunity_id: string | null }>
    >`SELECT id, lead_id, opportunity_id FROM crm_activities WHERE id = ${testId}::uuid`;

    if (result.length === 0) {
      throw new Error("Activity was not created");
    }

    logger.info(
      {
        id: result[0].id,
        lead_id: result[0].lead_id,
        opportunity_id: result[0].opportunity_id,
      },
      "PASS: Activity created on opportunity"
    );

    // Cleanup
    await db.$executeRaw`DELETE FROM crm_activities WHERE id = ${testId}::uuid`;
    logger.info("Cleanup complete");

    results.push({ name: testName, passed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, `FAIL: ${testName}`);
    results.push({ name: testName, passed: false, error: message });
  }
}

async function testUpdateOpportunityStage(): Promise<void> {
  const testName = "Update Opportunity Stage (Drag & Drop)";
  logger.info(`\n=== TEST: ${testName} ===`);

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
      throw new Error("No open opportunity found");
    }

    logger.info(
      {
        id: opportunity.id,
        currentStage: opportunity.stage,
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

    results.push({ name: testName, passed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, `FAIL: ${testName}`);
    results.push({ name: testName, passed: false, error: message });
  }
}

async function runAllTests(): Promise<void> {
  logger.info("========================================");
  logger.info("  PHASE 2 INTEGRATION TESTS");
  logger.info("========================================");

  await testCreateOpportunityWithAssignedTo();
  await testCreateActivityOnLead();
  await testCreateActivityOnOpportunity();
  await testUpdateOpportunityStage();

  // Summary
  logger.info("\n========================================");
  logger.info("  SUMMARY");
  logger.info("========================================");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const result of results) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    logger.info(`${status}: ${result.name}`);
    if (result.error) {
      logger.info(`   Error: ${result.error}`);
    }
  }

  logger.info(`\nTotal: ${passed}/${results.length} passed`);

  if (failed > 0) {
    process.exit(1);
  }
}

void runAllTests()
  .catch((error) => {
    logger.error({ error }, "Test suite failed");
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });
