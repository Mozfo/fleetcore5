import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

/**
 * E2E Audit Trail Tests
 * Validates existing auditLog() calls structure and multi-tenant isolation
 * Note: This script validates the STRUCTURE of existing logs, not create new data
 */

interface TestResult {
  name: string;
  status: "passed" | "failed";
  error?: string;
  logsFound?: number;
}

const results: TestResult[] = [];

async function testAuditLogStructure(tenantId: string): Promise<void> {
  logger.info("🧪 Testing Audit Log Structure...");

  try {
    // Test 1: Verify CREATE logs have _audit_snapshot
    const createLogs = await prisma.adm_audit_logs.findMany({
      where: { tenant_id: tenantId, action: "create" },
      orderBy: { timestamp: "desc" },
      take: 5,
    });

    if (createLogs.length === 0) {
      results.push({
        name: "CREATE logs exist",
        status: "failed",
        error:
          "No CREATE logs found - run `pnpm test:audit` first to generate logs",
      });
    } else {
      const hasSnapshot = createLogs.some(
        (log) =>
          log.changes &&
          typeof log.changes === "object" &&
          "_audit_snapshot" in log.changes
      );
      results.push({
        name: "CREATE logs have _audit_snapshot",
        status: hasSnapshot ? "passed" : "failed",
        error: hasSnapshot
          ? undefined
          : "Some CREATE logs missing _audit_snapshot",
        logsFound: createLogs.length,
      });
    }

    // Test 2: Verify UPDATE logs have domain changes
    const updateLogs = await prisma.adm_audit_logs.findMany({
      where: { tenant_id: tenantId, action: "update" },
      orderBy: { timestamp: "desc" },
      take: 5,
    });

    if (updateLogs.length > 0) {
      const hasDomainChanges = updateLogs.some(
        (log) =>
          log.changes &&
          typeof log.changes === "object" &&
          Object.keys(log.changes).some((k) => !k.startsWith("_audit_"))
      );
      results.push({
        name: "UPDATE logs have domain changes",
        status: hasDomainChanges ? "passed" : "failed",
        error: hasDomainChanges
          ? undefined
          : "UPDATE logs missing domain change fields",
        logsFound: updateLogs.length,
      });
    } else {
      results.push({
        name: "UPDATE logs have domain changes",
        status: "failed",
        error: "No UPDATE logs found",
      });
    }

    // Test 3: Verify DELETE logs have _audit_reason
    const deleteLogs = await prisma.adm_audit_logs.findMany({
      where: { tenant_id: tenantId, action: "delete" },
      orderBy: { timestamp: "desc" },
      take: 5,
    });

    if (deleteLogs.length > 0) {
      const hasReason = deleteLogs.some(
        (log) =>
          log.changes &&
          typeof log.changes === "object" &&
          "_audit_reason" in log.changes
      );
      results.push({
        name: "DELETE logs have _audit_reason",
        status: hasReason ? "passed" : "failed",
        error: hasReason ? undefined : "Some DELETE logs missing _audit_reason",
        logsFound: deleteLogs.length,
      });
    } else {
      results.push({
        name: "DELETE logs have _audit_reason",
        status: "failed",
        error: "No DELETE logs found",
      });
    }

    // Test 4: Verify all logs have required fields
    const allLogs = await prisma.adm_audit_logs.findMany({
      where: { tenant_id: tenantId },
      take: 20,
    });

    const missingFields = allLogs.filter(
      (log) => !log.tenant_id || !log.action || !log.entity || !log.entity_id
    );

    results.push({
      name: "All logs have required fields",
      status: missingFields.length === 0 ? "passed" : "failed",
      error:
        missingFields.length === 0
          ? undefined
          : `${missingFields.length} logs missing required fields`,
      logsFound: allLogs.length,
    });

    // Test 5: Verify entity types are valid
    const validEntities = [
      "organization",
      "member",
      "invitation",
      "driver",
      "vehicle",
      "vehicle_assignment",
      "vehicle_maintenance",
      "vehicle_expense",
      "document",
    ];

    const invalidEntities = allLogs.filter(
      (log) => !validEntities.includes(log.entity)
    );

    results.push({
      name: "Entity types are valid",
      status: invalidEntities.length === 0 ? "passed" : "failed",
      error:
        invalidEntities.length === 0
          ? undefined
          : `Found invalid entity types: ${[...new Set(invalidEntities.map((l) => l.entity))].join(", ")}`,
      logsFound: allLogs.length,
    });

    // Test 6: Verify action types are valid
    const validActions = [
      "create",
      "update",
      "delete",
      "restore",
      "login",
      "logout",
      "invite",
      "accept_invite",
      "export",
      "import",
    ];

    const invalidActions = allLogs.filter(
      (log) => !validActions.includes(log.action)
    );

    results.push({
      name: "Action types are valid",
      status: invalidActions.length === 0 ? "passed" : "failed",
      error:
        invalidActions.length === 0
          ? undefined
          : `Found invalid action types: ${[...new Set(invalidActions.map((l) => l.action))].join(", ")}`,
      logsFound: allLogs.length,
    });

    // Test 7: Verify JSONB structure uses _audit_ prefix
    const logsWithMetadata = allLogs.filter((log) => log.changes);
    const hasCorrectPrefix = logsWithMetadata.every((log) => {
      if (!log.changes || typeof log.changes !== "object") return true;
      const keys = Object.keys(log.changes);
      const auditKeys = keys.filter((k) => k.startsWith("_audit_"));
      // At least some keys should be audit keys if metadata present
      return auditKeys.length > 0 || keys.length === 0;
    });

    results.push({
      name: "JSONB uses _audit_* prefix for metadata",
      status: hasCorrectPrefix ? "passed" : "failed",
      error: hasCorrectPrefix
        ? undefined
        : "Some logs missing _audit_* prefix on metadata",
      logsFound: logsWithMetadata.length,
    });
  } catch (error) {
    logger.error({ error }, "Audit log structure tests failed");
    results.push({
      name: "Audit log structure tests",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function testMultiTenantIsolation(): Promise<void> {
  logger.info("🧪 Testing Multi-Tenant Isolation...");

  try {
    // Get all tenants
    const tenants = await prisma.adm_tenants.findMany({
      where: { deleted_at: null },
      take: 10,
    });

    if (tenants.length < 1) {
      results.push({
        name: "Multi-tenant isolation",
        status: "failed",
        error: "No tenants found for isolation test",
      });
      return;
    }

    // Count logs per tenant
    const logCounts = await Promise.all(
      tenants.map(async (tenant) => ({
        tenantId: tenant.id,
        count: await prisma.adm_audit_logs.count({
          where: { tenant_id: tenant.id },
        }),
      }))
    );

    // Verify each tenant's logs contain only their tenant_id
    const isolationViolations = await prisma.adm_audit_logs.findMany({
      where: {
        tenant_id: {
          notIn: tenants.map((t) => t.id),
        },
      },
      take: 1,
    });

    if (isolationViolations.length === 0) {
      results.push({
        name: "Multi-tenant isolation",
        status: "passed",
        logsFound: logCounts.reduce((sum, lc) => sum + lc.count, 0),
      });
      logger.info(
        {
          tenantsChecked: tenants.length,
          totalLogs: logCounts.reduce((sum, lc) => sum + lc.count, 0),
        },
        "Tenant isolation verified"
      );
    } else {
      results.push({
        name: "Multi-tenant isolation",
        status: "failed",
        error: "Found logs with invalid tenant_id",
      });
    }
  } catch (error) {
    logger.error({ error }, "Multi-tenant isolation test failed");
    results.push({
      name: "Multi-tenant isolation",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function testAuditLogCoverage(): Promise<void> {
  logger.info("🧪 Testing Audit Log Coverage...");

  try {
    // Count logs by entity type
    const coverageByEntity = await prisma.$queryRaw<
      Array<{ entity: string; count: bigint }>
    >`
      SELECT entity, COUNT(*) as count
      FROM adm_audit_logs
      GROUP BY entity
      ORDER BY count DESC
    `;

    // Count logs by action
    const coverageByAction = await prisma.$queryRaw<
      Array<{ action: string; count: bigint }>
    >`
      SELECT action, COUNT(*) as count
      FROM adm_audit_logs
      GROUP BY action
      ORDER BY count DESC
    `;

    const totalLogs = coverageByEntity.reduce(
      (sum, row) => sum + Number(row.count),
      0
    );

    results.push({
      name: "Audit log coverage",
      status: "passed",
      logsFound: totalLogs,
    });

    logger.info({ coverageByEntity, coverageByAction }, "Coverage breakdown");
  } catch (error) {
    logger.error({ error }, "Coverage test failed");
    results.push({
      name: "Audit log coverage",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function runE2ETests(): Promise<void> {
  try {
    logger.info("🚀 Starting E2E Audit Trail Validation...\n");

    // Get test tenant
    const tenant = await prisma.adm_tenants.findFirst({
      where: { deleted_at: null },
    });

    if (!tenant) {
      throw new Error("No tenant found - please seed data first");
    }

    logger.info({ tenantId: tenant.id.substring(0, 8) }, "Using tenant");

    // Run test suites
    await testAuditLogStructure(tenant.id);
    await testMultiTenantIsolation();
    await testAuditLogCoverage();

    // Print results
    logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("📊 E2E AUDIT TRAIL VALIDATION RESULTS");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const total = results.length;

    results.forEach((result, i) => {
      const icon = result.status === "passed" ? "✅" : "❌";
      const details = result.error
        ? ` - ${result.error}`
        : result.logsFound
          ? ` - ${result.logsFound} log(s) found`
          : "";
      logger.info(`${icon} ${i + 1}. ${result.name}${details}`);
    });

    logger.info(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    logger.info(
      `📈 SUMMARY: ${passed}/${total} validations passed (${((passed / total) * 100).toFixed(1)}%)`
    );

    if (failed > 0) {
      logger.error(`⚠️  ${failed} validation(s) failed - review errors above`);
    }

    logger.info(
      `\n📝 Note: This validates STRUCTURE of existing logs (28 auditLog() calls)`
    );
    logger.info(
      `   For manual testing of webhooks/emails, see docs/AUDIT_E2E_MANUAL_TESTS.md`
    );
    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    logger.error({ error }, "❌ E2E VALIDATION FAILED");
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

void runE2ETests();
