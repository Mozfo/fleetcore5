/**
 * Tests for BaseService
 * lib/core/base.service.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseService } from "../base.service";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
  AppError,
} from "../errors";
import type { BaseRepository } from "../base.repository";
import type { AuditEntityType } from "@/lib/audit";

// Mock dependencies
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn(),
  serializeForAudit: vi.fn((data) => data),
}));

// Concrete implementation for testing
class TestEntity {
  id!: string;
  tenant_id!: string;
  deleted_at!: Date | null;
}

class TestService extends BaseService<TestEntity> {
  public mockRepository: BaseRepository<TestEntity>;

  constructor(mockRepository: BaseRepository<TestEntity>) {
    super();
    this.mockRepository = mockRepository;
  }

  protected getRepository(): BaseRepository<TestEntity> {
    return this.mockRepository;
  }

  protected getEntityType(): AuditEntityType {
    return "driver";
  }

  // Expose prisma for mocking in tests
  public getPrismaForTest() {
    return this.prisma;
  }

  // Expose protected methods for testing
  public testValidateTenant(tenantId: string) {
    return this.validateTenant(tenantId);
  }

  public testCheckPermission(memberId: string, permission: string) {
    return this.checkPermission(memberId, permission);
  }

  public testHandleError(error: unknown, context: string): never {
    return this.handleError(error, context);
  }

  public testAudit(options: Parameters<BaseService<TestEntity>["audit"]>[0]) {
    return this.audit(options);
  }

  public testSoftDelete(
    id: string,
    tenantId: string,
    memberId: string,
    authUserId?: string,
    reason?: string
  ) {
    return this.softDelete(id, tenantId, memberId, authUserId, reason);
  }

  public testRestore(
    id: string,
    tenantId: string,
    memberId: string,
    authUserId?: string,
    reason?: string
  ) {
    return this.restore(id, tenantId, memberId, authUserId, reason);
  }
}

describe("BaseService", () => {
  let mockRepository: BaseRepository<TestEntity>;
  let service: TestService;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      softDelete: vi.fn(),
      restore: vi.fn(),
    } as unknown as BaseRepository<TestEntity>;

    service = new TestService(mockRepository);

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("validateTenant", () => {
    it("should throw ValidationError if tenantId is empty", async () => {
      await expect(service.testValidateTenant("")).rejects.toThrow(
        ValidationError
      );
      await expect(service.testValidateTenant("")).rejects.toThrow(
        "Tenant ID is required"
      );
    });

    it("should throw ValidationError if tenantId is not a string", async () => {
      await expect(
        service.testValidateTenant(null as unknown as string)
      ).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError if tenant does not exist", async () => {
      // Mock prisma.adm_tenants.findUnique to return null
      const prisma = service.getPrismaForTest();
      Object.defineProperty(prisma, "adm_tenants", {
        value: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        writable: true,
        configurable: true,
      });

      await expect(
        service.testValidateTenant("non-existent-tenant-id")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if tenant is suspended", async () => {
      // Mock prisma.adm_tenants.findUnique to return suspended tenant
      const prisma = service.getPrismaForTest();
      Object.defineProperty(prisma, "adm_tenants", {
        value: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ id: "tenant-1", status: "suspended" }),
        },
        writable: true,
        configurable: true,
      });

      await expect(service.testValidateTenant("tenant-1")).rejects.toThrow(
        ForbiddenError
      );
      await expect(service.testValidateTenant("tenant-1")).rejects.toThrow(
        /suspended/
      );
    });

    it("should not throw if tenant exists and is active", async () => {
      // Mock prisma.adm_tenants.findUnique to return active tenant
      const prisma = service.getPrismaForTest();
      Object.defineProperty(prisma, "adm_tenants", {
        value: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ id: "tenant-1", status: "active" }),
        },
        writable: true,
        configurable: true,
      });

      await expect(
        service.testValidateTenant("tenant-1")
      ).resolves.toBeUndefined();
    });
  });

  describe("checkPermission", () => {
    it("should throw NOT_IMPLEMENTED error", () => {
      expect(() =>
        service.testCheckPermission("member-1", "leads:delete")
      ).toThrow(/NOT_IMPLEMENTED/);
      expect(() =>
        service.testCheckPermission("member-1", "leads:delete")
      ).toThrow(/Phase 0.2/);
    });

    it("should include permission and memberId in error message", () => {
      expect(() =>
        service.testCheckPermission("member-123", "vehicles:update")
      ).toThrow(/member-123/);
      expect(() =>
        service.testCheckPermission("member-123", "vehicles:update")
      ).toThrow(/vehicles:update/);
    });
  });

  describe("handleError", () => {
    it("should convert Prisma P2002 to ConflictError", () => {
      const prismaError = { code: "P2002", message: "Unique constraint" };
      expect(() =>
        service.testHandleError(prismaError, "createDriver")
      ).toThrow(ConflictError);
      expect(() =>
        service.testHandleError(prismaError, "createDriver")
      ).toThrow(/Duplicate entry/);
    });

    it("should convert Prisma P2025 to NotFoundError", () => {
      const prismaError = { code: "P2025", message: "Record not found" };
      expect(() => service.testHandleError(prismaError, "updateLead")).toThrow(
        NotFoundError
      );
    });

    it("should convert Prisma P2003 to ValidationError", () => {
      const prismaError = { code: "P2003", message: "FK constraint" };
      expect(() =>
        service.testHandleError(prismaError, "deleteVehicle")
      ).toThrow(ValidationError);
      expect(() =>
        service.testHandleError(prismaError, "deleteVehicle")
      ).toThrow(/Foreign key constraint/);
    });

    it("should convert other Prisma errors to DatabaseError", () => {
      const prismaError = { code: "P9999", message: "Unknown error" };
      expect(() =>
        service.testHandleError(prismaError, "queryDatabase")
      ).toThrow(DatabaseError);
    });

    it("should re-throw AppError instances as-is", () => {
      const appError = new NotFoundError("Driver");
      expect(() => service.testHandleError(appError, "findDriver")).toThrow(
        NotFoundError
      );
    });

    it("should wrap unexpected errors in AppError", () => {
      const unexpectedError = new Error("Something went wrong");
      expect(() =>
        service.testHandleError(unexpectedError, "someOperation")
      ).toThrow(AppError);
      expect(() =>
        service.testHandleError(unexpectedError, "someOperation")
      ).toThrow(/Unexpected error/);
    });
  });

  describe("audit", () => {
    it("should call auditLog with correct parameters", async () => {
      const { auditLog } = await import("@/lib/audit");

      await service.testAudit({
        tenantId: "tenant-1",
        action: "delete",
        entityId: "entity-1",
        memberId: "member-1",
        authUserId: "auth-user-1",
        reason: "Test reason",
      });

      expect(auditLog).toHaveBeenCalledWith({
        tenantId: "tenant-1",
        action: "delete",
        entityType: "driver", // from getEntityType()
        entityId: "entity-1",
        performedBy: "member-1",
        performedByAuthId: "auth-user-1",
        changes: null,
        snapshot: null,
        reason: "Test reason",
      });
    });

    it("should serialize changes and snapshot", async () => {
      const { auditLog: _auditLog, serializeForAudit } = await import(
        "@/lib/audit"
      );

      const changes = { name: { old: "John", new: "Jane" } };
      const snapshot = { id: "1", name: "Jane" };

      await service.testAudit({
        tenantId: "tenant-1",
        action: "update",
        entityId: "entity-1",
        memberId: "member-1",
        changes,
        snapshot,
      });

      expect(serializeForAudit).toHaveBeenCalledWith(changes);
      expect(serializeForAudit).toHaveBeenCalledWith(snapshot);
    });
  });

  describe("softDelete", () => {
    it("should call repository softDelete with correct parameters", async () => {
      await service.testSoftDelete(
        "entity-1",
        "tenant-1",
        "member-1",
        "auth-user-1",
        "Test reason"
      );

      expect(mockRepository.softDelete).toHaveBeenCalledWith(
        "entity-1",
        "member-1",
        "Test reason",
        "tenant-1"
      );
    });

    it("should call audit after repository softDelete", async () => {
      const { auditLog } = await import("@/lib/audit");

      await service.testSoftDelete("entity-1", "tenant-1", "member-1");

      expect(mockRepository.softDelete).toHaveBeenCalled();
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "delete",
          entityId: "entity-1",
        })
      );
    });

    it("should handle optional authUserId and reason", async () => {
      const { auditLog } = await import("@/lib/audit");

      await service.testSoftDelete("entity-1", "tenant-1", "member-1");

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          performedByAuthId: undefined,
          reason: undefined,
        })
      );
    });
  });

  describe("restore", () => {
    it("should call repository restore with correct parameters", async () => {
      const restoredEntity = {
        id: "entity-1",
        tenant_id: "tenant-1",
        deleted_at: null,
      } as TestEntity;

      mockRepository.restore = vi.fn().mockResolvedValue(restoredEntity);

      const result = await service.testRestore(
        "entity-1",
        "tenant-1",
        "member-1"
      );

      expect(mockRepository.restore).toHaveBeenCalledWith(
        "entity-1",
        "member-1",
        "tenant-1"
      );
      expect(result).toEqual(restoredEntity);
    });

    it("should call audit after repository restore", async () => {
      const { auditLog } = await import("@/lib/audit");
      const restoredEntity = {
        id: "entity-1",
        tenant_id: "tenant-1",
        deleted_at: null,
      } as TestEntity;

      mockRepository.restore = vi.fn().mockResolvedValue(restoredEntity);

      await service.testRestore("entity-1", "tenant-1", "member-1");

      expect(mockRepository.restore).toHaveBeenCalled();
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "restore",
          entityId: "entity-1",
        })
      );
    });

    it("should handle optional reason", async () => {
      const { auditLog } = await import("@/lib/audit");
      const restoredEntity = {
        id: "entity-1",
        tenant_id: "tenant-1",
        deleted_at: null,
      } as TestEntity;

      mockRepository.restore = vi.fn().mockResolvedValue(restoredEntity);

      await service.testRestore(
        "entity-1",
        "tenant-1",
        "member-1",
        "auth-user-1",
        "Recovery requested"
      );

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: "Recovery requested",
        })
      );
    });
  });
});
