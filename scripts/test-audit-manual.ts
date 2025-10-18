import { prisma } from "../lib/prisma";
import { auditLog, serializeForAudit } from "../lib/audit";
import { logger } from "../lib/logger";

async function testAuditLog() {
  try {
    logger.info("🧪 Starting Manual Audit Log Tests...");

    // Prérequis: Obtenir un tenant_id et member_id valides depuis la DB
    const tenant = await prisma.adm_tenants.findFirst();
    const member = await prisma.adm_members.findFirst({
      where: { tenant_id: tenant?.id },
    });

    if (!tenant || !member) {
      throw new Error(
        "❌ No tenant or member found in DB - please seed data first"
      );
    }

    logger.info({ tenantId: tenant.id, memberId: member.id }, "Using test data");

    // TEST 1: CREATE avec snapshot + metadata
    logger.info("📝 Test 1: CREATE avec snapshot + metadata");
    await auditLog({
      tenantId: tenant.id,
      action: "create",
      entityType: "vehicle",
      entityId: "00000000-0000-0000-0000-000000000001",
      performedBy: member.id,
      snapshot: serializeForAudit({
        plate: "ABC123",
        model: "Toyota Corolla",
        year: 2023,
      }),
      metadata: { source: "manual_test", version: "1.0", test: "step1a2" },
    });
    logger.info("✅ Test 1 passed");

    // TEST 2: UPDATE avec changes + reason
    logger.info("📝 Test 2: UPDATE avec changes + reason");
    await auditLog({
      tenantId: tenant.id,
      action: "update",
      entityType: "driver",
      entityId: "00000000-0000-0000-0000-000000000002",
      performedBy: member.id,
      changes: serializeForAudit({
        name: { old: "John Doe", new: "Jane Doe" },
        status: { old: "active", new: "inactive" },
        email: { old: "john@example.com", new: "jane@example.com" },
      }),
      reason: "User profile update requested by admin",
    });
    logger.info("✅ Test 2 passed");

    // TEST 3: DELETE avec reason seulement
    logger.info("📝 Test 3: DELETE avec reason seulement");
    await auditLog({
      tenantId: tenant.id,
      action: "delete",
      entityType: "document",
      entityId: "00000000-0000-0000-0000-000000000003",
      performedBy: member.id,
      reason: "GDPR deletion request - user requested account removal",
    });
    logger.info("✅ Test 3 passed");

    // TEST 4: WEBHOOK avec performedByClerkId + metadata
    logger.info("📝 Test 4: WEBHOOK avec performedByClerkId + metadata");
    await auditLog({
      tenantId: tenant.id,
      action: "create",
      entityType: "organization",
      entityId: tenant.id,
      performedBy: member.id,
      performedByClerkId: "user_2testClerkId123xyz",
      metadata: serializeForAudit({
        source: "clerk_webhook",
        event_type: "organization.created",
        webhook_id: "wh_123abc",
      }),
      ipAddress: "192.168.1.100",
      userAgent: "ClerkWebhook/1.0",
    });
    logger.info("✅ Test 4 passed");

    // Vérification DB
    logger.info("🔍 Vérification insertions DB...");
    const logs = await prisma.adm_audit_logs.findMany({
      where: { tenant_id: tenant.id },
      orderBy: { timestamp: "desc" },
      take: 4,
    });

    logger.info({ count: logs.length }, "Logs insérés dans adm_audit_logs");

    logs.forEach((log, i) => {
      logger.info(
        {
          testNumber: i + 1,
          id: log.id,
          action: log.action,
          entity: log.entity,
          entityId: log.entity_id,
          memberId: log.member_id,
          timestamp: log.timestamp.toISOString(),
          changes: log.changes,
        },
        `Log ${i + 1}`
      );
    });

    // Validation structure JSONB
    logger.info("🔍 Validation structure JSONB...");

    const test1 = logs.find((l) => l.action === "create" && l.entity === "vehicle");
    const test2 = logs.find((l) => l.action === "update" && l.entity === "driver");
    const test3 = logs.find((l) => l.action === "delete" && l.entity === "document");
    const test4 = logs.find(
      (l) => l.action === "create" && l.entity === "organization"
    );

    if (test1) {
      const changes = test1.changes as Record<string, unknown>;
      logger.info(
        {
          hasSnapshot: !!changes._audit_snapshot,
          hasMetadata: !!changes._audit_metadata,
        },
        "Test 1 - CREATE validation"
      );
    }

    if (test2) {
      const changes = test2.changes as Record<string, unknown>;
      logger.info(
        {
          hasName: !!(changes as Record<string, unknown>).name,
          hasReason: !!changes._audit_reason,
        },
        "Test 2 - UPDATE validation"
      );
    }

    if (test3) {
      const changes = test3.changes as Record<string, unknown>;
      logger.info(
        {
          hasReason: !!changes._audit_reason,
          onlyAuditFields: Object.keys(changes).every((k) =>
            k.startsWith("_audit_")
          ),
        },
        "Test 3 - DELETE validation"
      );
    }

    if (test4) {
      const changes = test4.changes as Record<string, unknown>;
      logger.info(
        {
          hasClerkId: !!changes._audit_clerk_id,
          hasMetadata: !!changes._audit_metadata,
        },
        "Test 4 - WEBHOOK validation"
      );
    }

    logger.info("✅ TOUS LES TESTS MANUELS PASSÉS");
  } catch (error) {
    logger.error({ error }, "❌ ERREUR TESTS MANUELS");
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testAuditLog();
