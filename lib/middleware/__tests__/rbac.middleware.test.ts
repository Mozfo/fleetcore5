/**
 * RBAC Middleware Tests
 *
 * Tests role-based access control with scope support (global/branch/team).
 * Total: 5 tests covering permission checks and scope validation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePermission, verifyScopeAccess } from "../rbac.middleware";
import { ForbiddenError, ValidationError } from "@/lib/core/errors";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    adm_member_roles: {
      findMany: vi.fn(),
    },
    crm_leads: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("RBAC Middleware - requirePermission()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should grant permission with global scope", async () => {
    // Mock user with global permission
    vi.mocked(prisma.adm_member_roles.findMany).mockResolvedValue([
      {
        scope_type: "global",
        scope_id: null,
        adm_roles: {
          id: "role_001",
          name: "Admin",
          status: "active",
          permissions: {
            leads: { create: true, read: true, update: true, delete: true },
          },
        },
      },
    ] as never);

    const result = await requirePermission(
      "user_123",
      "tenant_001",
      "leads.create"
    );

    expect(result.hasPermission).toBe(true);
    expect(result.scopeType).toBe("global");
    expect(result.scopeId).toBeNull();
  });

  it("should grant permission with branch scope", async () => {
    // Mock user with branch-scoped permission
    vi.mocked(prisma.adm_member_roles.findMany).mockResolvedValue([
      {
        scope_type: "branch",
        scope_id: "branch_north",
        adm_roles: {
          id: "role_002",
          name: "Branch Manager",
          status: "active",
          permissions: {
            leads: { create: true, read: true, update: true, delete: false },
          },
        },
      },
    ] as never);

    const result = await requirePermission(
      "user_123",
      "tenant_001",
      "leads.read"
    );

    expect(result.hasPermission).toBe(true);
    expect(result.scopeType).toBe("branch");
    expect(result.scopeId).toBe("branch_north");
  });

  it("should grant permission with team scope", async () => {
    // Mock user with team-scoped permission
    vi.mocked(prisma.adm_member_roles.findMany).mockResolvedValue([
      {
        scope_type: "team",
        scope_id: "team_sales",
        adm_roles: {
          id: "role_003",
          name: "Team Lead",
          status: "active",
          permissions: {
            leads: { create: false, read: true, update: true, delete: false },
          },
        },
      },
    ] as never);

    const result = await requirePermission(
      "user_123",
      "tenant_001",
      "leads.update"
    );

    expect(result.hasPermission).toBe(true);
    expect(result.scopeType).toBe("team");
    expect(result.scopeId).toBe("team_sales");
  });

  it("should deny permission when user has no matching role", async () => {
    // Mock user with no permission for this resource
    vi.mocked(prisma.adm_member_roles.findMany).mockResolvedValue([
      {
        scope_type: "global",
        scope_id: null,
        adm_roles: {
          id: "role_004",
          name: "Viewer",
          status: "active",
          permissions: {
            leads: { create: false, read: true, update: false, delete: false },
          },
        },
      },
    ] as never);

    await expect(
      requirePermission("user_123", "tenant_001", "leads.delete")
    ).rejects.toThrow(ForbiddenError);

    await expect(
      requirePermission("user_123", "tenant_001", "leads.delete")
    ).rejects.toThrow(/Permission denied/);
  });

  it("should throw ValidationError for invalid permission format", async () => {
    await expect(
      requirePermission("user_123", "tenant_001", "invalid")
    ).rejects.toThrow(ValidationError);

    await expect(
      requirePermission("user_123", "tenant_001", "invalid")
    ).rejects.toThrow(/Invalid permission format/);
  });
});

describe("RBAC Middleware - verifyScopeAccess()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow access when resource belongs to authorized scope", async () => {
    // Mock resource found in authorized branch
    vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
      id: "lead_001",
    } as never);

    await expect(
      verifyScopeAccess("branch", "branch_north", "crm_leads", "lead_001")
    ).resolves.toBeUndefined();
  });

  it("should deny access when resource not in authorized scope", async () => {
    // Mock resource not found in authorized branch
    vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

    await expect(
      verifyScopeAccess("branch", "branch_north", "crm_leads", "lead_001")
    ).rejects.toThrow(ForbiddenError);

    await expect(
      verifyScopeAccess("branch", "branch_north", "crm_leads", "lead_001")
    ).rejects.toThrow(/not in your authorized branch/);
  });
});
