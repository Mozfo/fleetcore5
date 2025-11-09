/**
 * Auth Middleware Tests
 *
 * Tests Clerk authentication integration with tenant validation.
 * Total: 3 tests covering success, missing auth, and suspended tenant.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth } from "../auth.middleware";
import { UnauthorizedError, ForbiddenError } from "@/lib/core/errors";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    adm_tenants: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

describe("Auth Middleware - requireAuth()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully authenticate user with active tenant", async () => {
    // Mock Clerk auth returning valid user and org
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
      orgId: "org_abc",
    } as Awaited<ReturnType<typeof auth>>);

    // Mock Prisma finding active tenant
    vi.mocked(prisma.adm_tenants.findUnique).mockResolvedValue({
      id: "tenant_001",
      status: "active",
      name: "Test Tenant",
    } as never);

    // Create mock request
    const mockReq = {
      headers: new Headers(),
    } as never;

    const result = await requireAuth(mockReq);

    expect(result.userId).toBe("user_123");
    expect(result.tenantId).toBe("tenant_001");
    expect(result.headers.get("x-user-id")).toBe("user_123");
    expect(result.headers.get("x-tenant-id")).toBe("tenant_001");
  });

  it("should throw UnauthorizedError when user is not authenticated", async () => {
    // Mock Clerk auth returning no userId
    vi.mocked(auth).mockResolvedValue({
      userId: null,
      orgId: null,
    } as never);

    const mockReq = {} as never;

    await expect(requireAuth(mockReq)).rejects.toThrow(UnauthorizedError);
    await expect(requireAuth(mockReq)).rejects.toThrow(
      /Authentication required/
    );
  });

  it("should throw ForbiddenError when tenant is suspended", async () => {
    // Mock Clerk auth returning valid user
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
      orgId: "org_abc",
    } as Awaited<ReturnType<typeof auth>>);

    // Mock Prisma finding suspended tenant
    vi.mocked(prisma.adm_tenants.findUnique).mockResolvedValue({
      id: "tenant_001",
      status: "suspended",
      name: "Suspended Tenant",
    } as never);

    const mockReq = {} as never;

    await expect(requireAuth(mockReq)).rejects.toThrow(ForbiddenError);
    await expect(requireAuth(mockReq)).rejects.toThrow(/suspended/);
  });
});
