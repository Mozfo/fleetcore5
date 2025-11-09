/**
 * AuditService Integration Tests with PostgreSQL Testcontainers
 *
 * Tests audit logging with REAL PostgreSQL database:
 * - logAction() creates audit logs with JSONB fields
 * - query() filters and paginates from real database
 * - detectSuspiciousBehavior() counts real audit logs
 * - String[] arrays (tags) work with PostgreSQL native support
 *
 * Pattern: 3 tests covering critical audit scenarios with production-parity database
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { AuditService } from "../audit.service";
import {
  getContainerManager,
  getTestPrisma,
  TEST_DATA,
} from "@/lib/core/__tests__/fixtures/postgresql-integration-setup";

describe("AuditService - Integration Tests (PostgreSQL)", () => {
  let auditService: AuditService;
  let testPrisma: ReturnType<typeof getTestPrisma>;
  const containerManager = getContainerManager();

  beforeAll(async () => {
    await containerManager.initialize();
  }, 60000);

  beforeEach(async () => {
    await containerManager.resetDatabase();
    // Get PostgreSQL test client
    testPrisma = getTestPrisma();
    // Create AuditService with test Prisma client (dependency injection)
    auditService = new AuditService(testPrisma as never);
  });

  afterAll(async () => {
    await containerManager.teardown();
  }, 60000);

  // ===== TEST 1: logAction Creates Audit Log in Real PostgreSQL =====

  it("logAction() creates audit log in PostgreSQL with JSONB and arrays", async () => {
    // Execute: Log a create action with newValues (JSONB) and reason (String[] tags)
    await auditService.logAction({
      tenantId: TEST_DATA.ACTIVE_TENANT_ID,
      memberId: TEST_DATA.MEMBER_ID,
      entity: "lead",
      action: "create",
      entityId: TEST_DATA.LEAD_ID_1,
      newValues: { company_name: "Acme Corp", email: "contact@acme.com" },
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      reason: "Initial lead import", // Will be stored in String[] tags field
    });

    // Verify: Audit log created in PostgreSQL
    const auditLog = await testPrisma.adm_audit_logs.findFirst({
      where: {
        tenant_id: TEST_DATA.ACTIVE_TENANT_ID,
        entity: "lead",
        action: "create",
        entity_id: TEST_DATA.LEAD_ID_1,
      },
    });

    expect(auditLog).toBeTruthy();
    if (!auditLog) throw new Error("Audit log not found");
    expect(auditLog.member_id).toBe(TEST_DATA.MEMBER_ID);
    expect(auditLog.ip_address).toBe("192.168.1.1");

    // Verify: Auto-determined severity and category
    expect(auditLog.severity).toBe("info"); // create action = info
    expect(auditLog.category).toBe("operational"); // lead entity = operational

    // Verify: JSONB new_values stored correctly (PostgreSQL native support)
    expect(auditLog.new_values).toBeTruthy();
    const newValues = auditLog.new_values as {
      company_name: string;
      email: string;
    };
    expect(newValues.company_name).toBe("Acme Corp");
    expect(newValues.email).toBe("contact@acme.com");

    // Verify: String[] tags array (PostgreSQL native support)
    expect(auditLog.tags).toBeTruthy();
    expect(Array.isArray(auditLog.tags)).toBe(true);
    expect(auditLog.tags).toContain("Initial lead import");
  });

  // ===== TEST 2: query() Filters and Paginates from Real PostgreSQL =====

  it("query() filters audit logs by entity and action from PostgreSQL", async () => {
    // Setup: Create multiple audit logs
    await auditService.logAction({
      tenantId: TEST_DATA.ACTIVE_TENANT_ID,
      memberId: TEST_DATA.MEMBER_ID,
      entity: "lead",
      action: "create",
      entityId: TEST_DATA.LEAD_ID_1,
    });

    await auditService.logAction({
      tenantId: TEST_DATA.ACTIVE_TENANT_ID,
      memberId: TEST_DATA.MEMBER_ID,
      entity: "lead",
      action: "update",
      entityId: TEST_DATA.LEAD_ID_1,
    });

    await auditService.logAction({
      tenantId: TEST_DATA.ACTIVE_TENANT_ID,
      memberId: TEST_DATA.MEMBER_ID,
      entity: "opportunity",
      action: "create",
      entityId: TEST_DATA.OPPORTUNITY_ID_1,
    });

    // Execute: Query for lead creates only
    const result = await auditService.query({
      tenantId: TEST_DATA.ACTIVE_TENANT_ID,
      entity: "lead" as never,
      action: "create" as never,
      limit: 10,
      offset: 0,
    });

    // Verify: Only lead creates returned
    expect(result.logs.length).toBe(1);
    expect(result.logs[0].entity).toBe("lead");
    expect(result.logs[0].action).toBe("create");
    expect(result.total).toBe(1);
  });

  // ===== TEST 3: detectSuspiciousBehavior Counts Real Audit Logs =====

  it("detectSuspiciousBehavior() detects excessive writes from PostgreSQL", async () => {
    // Setup: Create 60 write actions (exceeds 50 threshold)
    const promises = [];
    for (let i = 0; i < 60; i++) {
      // Generate valid UUIDs for each entity (increment last segment)
      const entityId = `00000000-0000-0000-0000-${String(100 + i).padStart(12, "0")}`;
      promises.push(
        auditService.logAction({
          tenantId: TEST_DATA.ACTIVE_TENANT_ID,
          memberId: TEST_DATA.MEMBER_ID,
          entity: "lead",
          action: i % 2 === 0 ? "create" : "update", // Mix creates and updates
          entityId,
        })
      );
    }

    await Promise.all(promises);

    // Execute: Detect suspicious behavior
    const result = await auditService.detectSuspiciousBehavior({
      tenantId: TEST_DATA.ACTIVE_TENANT_ID,
      memberId: TEST_DATA.MEMBER_ID,
      timeWindowMinutes: 5,
    });

    // Verify: Excessive writes detected
    expect(result.isSuspicious).toBe(true);
    expect(result.reason).toBeTruthy();
    expect(result.reason).toContain("Excessive write");
    expect(result.reason).toContain("60"); // 60 writes detected
  });
});
