/**
 * AuditService Tests
 *
 * Tests for audit log management, diff calculation, querying,
 * and suspicious behavior detection.
 *
 * Pattern: 12 tests total covering all 4 methods
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AuditService } from "../audit.service";

// Mock Prisma client
const mockPrisma = {
  adm_audit_logs: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
} as unknown as PrismaClient;

describe("AuditService", () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService(mockPrisma);
    vi.clearAllMocks();
  });

  // ===== GETDIFF TESTS (3 tests) =====

  describe("getDiff()", () => {
    it("should return only changed fields", () => {
      const oldValues = {
        name: "John",
        age: 30,
        city: "Paris",
        status: "active",
      };

      const newValues = {
        name: "John",
        age: 31,
        city: "London",
        status: "active",
      };

      const diff = auditService.getDiff(oldValues, newValues);

      expect(diff).toEqual({
        age: { old: 30, new: 31 },
        city: { old: "Paris", new: "London" },
      });
    });

    it("should handle removed keys (field deleted)", () => {
      const oldValues = {
        name: "John",
        age: 30,
        city: "Paris",
      };

      const newValues = {
        name: "John",
        age: 30,
        // city removed
      };

      const diff = auditService.getDiff(oldValues, newValues);

      expect(diff).toEqual({
        city: { old: "Paris", new: undefined },
      });
    });

    it("should return empty object for identical objects", () => {
      const oldValues = { name: "John", age: 30 };
      const newValues = { name: "John", age: 30 };

      const diff = auditService.getDiff(oldValues, newValues);

      expect(diff).toEqual({});
    });
  });

  // ===== LOGACTION TESTS (3 tests) =====

  describe("logAction()", () => {
    it("should create log with correct severity based on action", async () => {
      vi.mocked(mockPrisma.adm_audit_logs.create).mockResolvedValue({
        id: "log-123",
      } as never);

      // Test create action (should be info)
      await auditService.logAction({
        tenantId: "tenant-123",
        memberId: "member-456",
        entity: "lead",
        action: "create",
        entityId: "lead-789",
        newValues: { email: "test@example.com" },
      });

      expect(mockPrisma.adm_audit_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            severity: "info",
          }),
        })
      );

      vi.clearAllMocks();

      // Test delete action (should be warning)
      await auditService.logAction({
        tenantId: "tenant-123",
        memberId: "member-456",
        entity: "lead",
        action: "delete",
        entityId: "lead-789",
      });

      expect(mockPrisma.adm_audit_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            severity: "warning",
          }),
        })
      );
    });

    it("should determine category from entity type", async () => {
      vi.mocked(mockPrisma.adm_audit_logs.create).mockResolvedValue({
        id: "log-123",
      } as never);

      // CRM entity (lead) should be operational
      await auditService.logAction({
        tenantId: "tenant-123",
        memberId: "member-456",
        entity: "lead",
        action: "create",
        entityId: "lead-789",
      });

      expect(mockPrisma.adm_audit_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: "operational",
          }),
        })
      );

      vi.clearAllMocks();

      // Admin entity (tenant) should be security
      await auditService.logAction({
        tenantId: "tenant-123",
        memberId: "member-456",
        entity: "tenant",
        action: "create",
        entityId: "tenant-789",
      });

      expect(mockPrisma.adm_audit_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: "security",
          }),
        })
      );

      vi.clearAllMocks();

      // Financial entity (contract) should be financial
      await auditService.logAction({
        tenantId: "tenant-123",
        memberId: "member-456",
        entity: "contract",
        action: "create",
        entityId: "contract-789",
      });

      expect(mockPrisma.adm_audit_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: "financial",
          }),
        })
      );
    });

    it("should set retention_until based on category", async () => {
      vi.mocked(mockPrisma.adm_audit_logs.create).mockResolvedValue({
        id: "log-123",
      } as never);

      const now = new Date();

      // Security category (tenant) should have 2 year retention
      await auditService.logAction({
        tenantId: "tenant-123",
        memberId: "member-456",
        entity: "tenant",
        action: "create",
        entityId: "tenant-789",
      });

      const securityCall = vi.mocked(mockPrisma.adm_audit_logs.create).mock
        .calls[0][0];
      const securityRetention = securityCall.data.retention_until as Date;
      const securityDaysFromNow = Math.round(
        (securityRetention.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Should be approximately 730 days (2 years) within 1 day tolerance
      expect(securityDaysFromNow).toBeGreaterThanOrEqual(729);
      expect(securityDaysFromNow).toBeLessThanOrEqual(731);

      vi.clearAllMocks();

      // Operational category (lead) should have 1 year retention
      await auditService.logAction({
        tenantId: "tenant-123",
        memberId: "member-456",
        entity: "lead",
        action: "create",
        entityId: "lead-789",
      });

      const operationalCall = vi.mocked(mockPrisma.adm_audit_logs.create).mock
        .calls[0][0];
      const operationalRetention = operationalCall.data.retention_until as Date;
      const operationalDaysFromNow = Math.round(
        (operationalRetention.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Should be approximately 365 days (1 year) within 1 day tolerance
      expect(operationalDaysFromNow).toBeGreaterThanOrEqual(364);
      expect(operationalDaysFromNow).toBeLessThanOrEqual(366);
    });
  });

  // ===== QUERY TESTS (3 tests) =====

  describe("query()", () => {
    it("should always filter by tenantId (multi-tenant isolation)", async () => {
      vi.mocked(mockPrisma.adm_audit_logs.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.adm_audit_logs.count).mockResolvedValue(0);

      await auditService.query({
        tenantId: "tenant-123",
      });

      expect(mockPrisma.adm_audit_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenant_id: "tenant-123",
          }),
        })
      );

      expect(mockPrisma.adm_audit_logs.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenant_id: "tenant-123",
          }),
        })
      );
    });

    it("should filter by entity and action", async () => {
      vi.mocked(mockPrisma.adm_audit_logs.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.adm_audit_logs.count).mockResolvedValue(0);

      await auditService.query({
        tenantId: "tenant-123",
        entity: "lead",
        action: "create",
      });

      expect(mockPrisma.adm_audit_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenant_id: "tenant-123",
            entity: "lead",
            action: "create",
          }),
        })
      );
    });

    it("should paginate correctly with limit and offset", async () => {
      vi.mocked(mockPrisma.adm_audit_logs.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.adm_audit_logs.count).mockResolvedValue(100);

      const result = await auditService.query({
        tenantId: "tenant-123",
        limit: 50,
        offset: 25,
      });

      expect(mockPrisma.adm_audit_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 25,
          orderBy: { timestamp: "desc" },
        })
      );

      expect(result.total).toBe(100);
    });
  });

  // ===== DETECTSUSPICIOUSBEHAVIOR TESTS (3 tests) =====

  describe("detectSuspiciousBehavior()", () => {
    it("should alert on excessive read operations (100+ in 5 min)", async () => {
      // Mock 150 validation_failed logs (reads)
      const mockLogs = Array.from({ length: 150 }, () => ({
        action: "validation_failed",
      }));

      vi.mocked(mockPrisma.adm_audit_logs.findMany).mockResolvedValue(
        mockLogs as never
      );

      const result = await auditService.detectSuspiciousBehavior({
        tenantId: "tenant-123",
        memberId: "member-456",
        timeWindowMinutes: 5,
      });

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain("Excessive read operations");
      expect(result.reason).toContain("150 reads");
      expect(result.metrics.readCount).toBe(150);
    });

    it("should alert on excessive write operations (50+ in 5 min)", async () => {
      // Mock 75 create/update logs (writes)
      const mockLogs = Array.from({ length: 75 }, (_, i) => ({
        action: i % 2 === 0 ? "create" : "update",
      }));

      vi.mocked(mockPrisma.adm_audit_logs.findMany).mockResolvedValue(
        mockLogs as never
      );

      const result = await auditService.detectSuspiciousBehavior({
        tenantId: "tenant-123",
        memberId: "member-456",
        timeWindowMinutes: 5,
      });

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain("Excessive write operations");
      expect(result.reason).toContain("75 writes");
      expect(result.metrics.writeCount).toBe(75);
    });

    it("should alert on excessive delete operations (10+ in 5 min)", async () => {
      // Mock 15 delete logs
      const mockLogs = Array.from({ length: 15 }, () => ({
        action: "delete",
      }));

      vi.mocked(mockPrisma.adm_audit_logs.findMany).mockResolvedValue(
        mockLogs as never
      );

      const result = await auditService.detectSuspiciousBehavior({
        tenantId: "tenant-123",
        memberId: "member-456",
        timeWindowMinutes: 5,
      });

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain("Excessive delete operations");
      expect(result.reason).toContain("15 deletes");
      expect(result.metrics.deleteCount).toBe(15);
    });
  });
});
