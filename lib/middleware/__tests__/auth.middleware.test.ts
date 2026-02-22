/**
 * Auth Middleware Tests
 *
 * Tests Better Auth integration with tenant validation via api-guard.
 * Total: 3 tests covering success, missing auth, and suspended tenant.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth } from "../auth.middleware";
import { UnauthorizedError, ForbiddenError } from "@/lib/core/errors";

// Mock api-guard (the actual auth implementation)
vi.mock("@/lib/auth/api-guard", () => ({
  requireTenantApiAuth: vi.fn(),
}));

import { requireTenantApiAuth } from "@/lib/auth/api-guard";

describe("Auth Middleware - requireAuth()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully authenticate user with active tenant", async () => {
    vi.mocked(requireTenantApiAuth).mockResolvedValue({
      userId: "user_123",
      tenantId: "tenant_001",
    });

    const mockReq = {} as never;
    const result = await requireAuth(mockReq);

    expect(result.userId).toBe("user_123");
    expect(result.tenantId).toBe("tenant_001");
  });

  it("should throw UnauthorizedError when user is not authenticated", async () => {
    vi.mocked(requireTenantApiAuth).mockRejectedValue(
      new UnauthorizedError("Not authenticated")
    );

    const mockReq = {} as never;

    await expect(requireAuth(mockReq)).rejects.toThrow(UnauthorizedError);
  });

  it("should throw ForbiddenError when tenant is suspended", async () => {
    vi.mocked(requireTenantApiAuth).mockRejectedValue(
      new ForbiddenError(
        'Access suspended. Organization "Test" has been suspended.'
      )
    );

    const mockReq = {} as never;

    await expect(requireAuth(mockReq)).rejects.toThrow(ForbiddenError);
    await expect(requireAuth(mockReq)).rejects.toThrow(/suspended/);
  });
});
