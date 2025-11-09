/**
 * ClerkSyncService Unit Tests
 *
 * Following Prisma testing best practices for unit testing:
 * https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing
 *
 * Tests business logic with properly structured mocks.
 * Integration tests with real PostgreSQL will be added in CI/CD pipeline.
 *
 * Pattern: 8 tests total covering all webhook handlers
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ClerkSyncService } from "../clerk-sync.service";
import { NotFoundError } from "@/lib/core/errors";
import { SYSTEM_USER_ID } from "@/lib/constants/system";

// Create mock Prisma with transaction support
const createMockPrisma = () => {
  const mockModels = {
    adm_members: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    adm_invitations: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    adm_roles: {
      findFirst: vi.fn(),
    },
    adm_member_roles: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    adm_tenants: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    adm_tenant_lifecycle_events: {
      create: vi.fn(),
    },
    adm_audit_logs: {
      create: vi.fn().mockResolvedValue({ id: "audit-log-id" }),
    },
  };

  return {
    ...mockModels,
    $transaction: vi.fn(async (callback) => {
      // Execute transaction callback with mock tx
      return await callback(mockModels);
    }),
  };
};

describe("ClerkSyncService - Unit Tests", () => {
  let clerkSync: ClerkSyncService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    clerkSync = new ClerkSyncService(mockPrisma as never);
    vi.clearAllMocks();
  });

  // ===== USER CREATED TESTS (3 tests) =====

  describe("handleUserCreated()", () => {
    it("should create member from invitation and assign role", async () => {
      // Setup: No existing member (idempotence check)
      vi.mocked(mockPrisma.adm_members.findFirst).mockResolvedValueOnce(null);

      // Setup: Invitation exists
      const mockInvitation = {
        id: "invitation-123",
        tenant_id: "tenant-456",
        email: "john@acme.com",
        role: "member",
        status: "pending",
        expires_at: new Date(Date.now() + 86400000),
      };
      vi.mocked(mockPrisma.adm_invitations.findFirst).mockResolvedValue(
        mockInvitation as never
      );

      // Setup: Role exists
      const mockRole = {
        id: "role-789",
        tenant_id: "tenant-456",
        slug: "member",
        name: "Member",
      };
      vi.mocked(mockPrisma.adm_roles.findFirst).mockResolvedValue(
        mockRole as never
      );

      // Setup: Member creation returns new member
      const mockMember = {
        id: "member-abc",
        tenant_id: "tenant-456",
        clerk_user_id: "user_123",
        email: "john@acme.com",
        first_name: "John",
        last_name: "Doe",
      };
      vi.mocked(mockPrisma.adm_members.create).mockResolvedValue(
        mockMember as never
      );

      // Execute
      await clerkSync.handleUserCreated({
        clerkUserId: "user_123",
        email: "john@acme.com",
        firstName: "John",
        lastName: "Doe",
      });

      // Verify transaction was called
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      // Verify member created with correct data
      expect(mockPrisma.adm_members.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenant_id: "tenant-456",
          clerk_user_id: "user_123",
          email: "john@acme.com",
          first_name: "John",
          last_name: "Doe",
          status: "active",
        }),
      });

      // Verify role assigned
      expect(mockPrisma.adm_member_roles.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenant_id: "tenant-456",
          member_id: "member-abc",
          role_id: "role-789",
          is_primary: true,
          scope_type: "global",
        }),
      });

      // Verify invitation marked accepted
      expect(mockPrisma.adm_invitations.update).toHaveBeenCalledWith({
        where: { id: "invitation-123" },
        data: expect.objectContaining({
          status: "accepted",
          accepted_by_member_id: "member-abc",
        }),
      });

      // Verify audit log created
      expect(mockPrisma.adm_audit_logs.create).toHaveBeenCalled();
    });

    it("should be idempotent (duplicate webhook returns early)", async () => {
      // Setup: Member already exists
      const existingMember = {
        id: "member-existing",
        clerk_user_id: "user_123",
        email: "john@acme.com",
        deleted_at: null,
      };
      vi.mocked(mockPrisma.adm_members.findFirst).mockResolvedValue(
        existingMember as never
      );

      // Execute
      await clerkSync.handleUserCreated({
        clerkUserId: "user_123",
        email: "john@acme.com",
        firstName: "John",
        lastName: "Doe",
      });

      // Verify NO invitation lookup (returned early)
      expect(mockPrisma.adm_invitations.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockPrisma.adm_members.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if no invitation found", async () => {
      // Setup: No existing member
      vi.mocked(mockPrisma.adm_members.findFirst).mockResolvedValue(null);

      // Setup: No invitation
      vi.mocked(mockPrisma.adm_invitations.findFirst).mockResolvedValue(null);

      // Execute and expect error
      await expect(
        clerkSync.handleUserCreated({
          clerkUserId: "user_123",
          email: "noninvited@example.com",
          firstName: "Non",
          lastName: "Invited",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        clerkSync.handleUserCreated({
          clerkUserId: "user_123",
          email: "noninvited@example.com",
          firstName: "Non",
          lastName: "Invited",
        })
      ).rejects.toThrow(/No pending invitation found/);

      // Verify no member created
      expect(mockPrisma.adm_members.create).not.toHaveBeenCalled();
    });
  });

  // ===== USER UPDATED TEST (1 test) =====

  describe("handleUserUpdated()", () => {
    it("should update member fields if changed", async () => {
      const existingMember = {
        id: "member-123",
        tenant_id: "tenant-456",
        clerk_user_id: "user_123",
        email: "old@example.com",
        first_name: "OldFirst",
        last_name: "OldLast",
      };
      vi.mocked(mockPrisma.adm_members.findFirst).mockResolvedValue(
        existingMember as never
      );

      await clerkSync.handleUserUpdated({
        clerkUserId: "user_123",
        email: "new@example.com",
        firstName: "NewFirst",
        lastName: "NewLast",
      });

      // Verify update was called with changed fields
      expect(mockPrisma.adm_members.update).toHaveBeenCalledWith({
        where: { id: "member-123" },
        data: expect.objectContaining({
          email: "new@example.com",
          first_name: "NewFirst",
          last_name: "NewLast",
          updated_at: expect.any(Date),
          updated_by: SYSTEM_USER_ID, // System action
        }),
      });

      // Verify audit log created
      expect(mockPrisma.adm_audit_logs.create).toHaveBeenCalled();
    });
  });

  // ===== USER DELETED TEST (1 test) =====

  describe("handleUserDeleted()", () => {
    it("should soft delete member and revoke all active sessions", async () => {
      const existingMember = {
        id: "member-123",
        tenant_id: "tenant-456",
        clerk_user_id: "user_123",
        email: "john@acme.com",
      };
      vi.mocked(mockPrisma.adm_members.findFirst).mockResolvedValue(
        existingMember as never
      );

      await clerkSync.handleUserDeleted({
        clerkUserId: "user_123",
      });

      // Verify transaction was called
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      // Verify member soft deleted
      expect(mockPrisma.adm_members.update).toHaveBeenCalledWith({
        where: { id: "member-123" },
        data: expect.objectContaining({
          deleted_at: expect.any(Date),
          deleted_by: SYSTEM_USER_ID, // System action
          deletion_reason: "User deleted from Clerk",
          status: "inactive",
        }),
      });

      // Verify role assignments revoked
      expect(mockPrisma.adm_member_roles.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          member_id: "member-123",
        }),
        data: expect.objectContaining({
          valid_until: expect.any(Date),
        }),
      });

      // Verify audit log created
      expect(mockPrisma.adm_audit_logs.create).toHaveBeenCalled();
    });
  });

  // ===== ORGANIZATION CREATED TESTS (2 tests) =====

  describe("handleOrganizationCreated()", () => {
    it("should create tenant with default settings and lifecycle event", async () => {
      // Setup: No existing tenant (idempotence + slug checks)
      vi.mocked(mockPrisma.adm_tenants.findFirst).mockResolvedValue(null);

      const mockTenant = {
        id: "tenant-new",
        clerk_organization_id: "org_123",
        name: "Acme Corp",
        slug: "acme-corp",
        status: "active",
      };
      vi.mocked(mockPrisma.adm_tenants.create).mockResolvedValue(
        mockTenant as never
      );

      await clerkSync.handleOrganizationCreated({
        clerkOrgId: "org_123",
        name: "Acme Corp",
        subdomain: "acme-corp",
      });

      // Verify transaction was called
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      // Verify tenant created
      expect(mockPrisma.adm_tenants.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clerk_organization_id: "org_123",
          name: "Acme Corp",
          subdomain: "acme-corp",
          status: "active",
          country_code: "FR",
          default_currency: "EUR",
        }),
      });

      // Verify lifecycle event created
      expect(
        mockPrisma.adm_tenant_lifecycle_events.create
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenant_id: "tenant-new",
          event_type: "created",
          description: expect.stringContaining("Clerk organization webhook"),
        }),
      });

      // Verify audit log created
      expect(mockPrisma.adm_audit_logs.create).toHaveBeenCalled();
    });

    it("should be idempotent (duplicate webhook returns early)", async () => {
      const existingTenant = {
        id: "tenant-existing",
        clerk_organization_id: "org_123",
        name: "Acme Corp",
        deleted_at: null,
      };
      vi.mocked(mockPrisma.adm_tenants.findFirst).mockResolvedValue(
        existingTenant as never
      );

      await clerkSync.handleOrganizationCreated({
        clerkOrgId: "org_123",
        name: "Acme Corp",
      });

      // Verify NO transaction (returned early)
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockPrisma.adm_tenants.create).not.toHaveBeenCalled();
    });
  });

  // ===== ORGANIZATION DELETED TEST (1 test) =====

  describe("handleOrganizationDeleted()", () => {
    it("should soft delete tenant and suspend all members", async () => {
      const existingTenant = {
        id: "tenant-123",
        clerk_organization_id: "org_123",
        name: "Acme Corp",
      };
      vi.mocked(mockPrisma.adm_tenants.findFirst).mockResolvedValue(
        existingTenant as never
      );

      await clerkSync.handleOrganizationDeleted({
        clerkOrgId: "org_123",
      });

      // Verify transaction was called
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      // Verify tenant soft deleted (no deletion_reason field in schema)
      expect(mockPrisma.adm_tenants.update).toHaveBeenCalledWith({
        where: { id: "tenant-123" },
        data: expect.objectContaining({
          deleted_at: expect.any(Date),
          status: "cancelled",
        }),
      });

      // Verify all members suspended
      expect(mockPrisma.adm_members.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenant_id: "tenant-123",
        }),
        data: expect.objectContaining({
          status: "suspended",
          updated_by: SYSTEM_USER_ID, // System action
        }),
      });

      // Verify lifecycle event created
      expect(
        mockPrisma.adm_tenant_lifecycle_events.create
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenant_id: "tenant-123",
          event_type: "deleted",
        }),
      });

      // Verify audit log created
      expect(mockPrisma.adm_audit_logs.create).toHaveBeenCalled();
    });
  });
});
