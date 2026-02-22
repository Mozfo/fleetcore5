/**
 * Provider Context Utilities Tests
 *
 * Tests for multi-division data isolation utilities:
 * - getCurrentProviderId(): Get current user's provider_id from auth session
 * - getProviderContext(): Get full provider context with global access flag
 * - buildProviderFilter(): Build Prisma where clause for provider filtering
 * - buildHybridProviderFilter(): Build filter for hybrid tables (system + custom)
 *
 * @module lib/utils/__tests__/provider-context.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCurrentProviderId,
  getProviderContext,
  buildProviderFilter,
  buildHybridProviderFilter,
} from "../provider-context";

// Mock Better Auth server wrapper
vi.mock("@/lib/auth/server", () => ({
  getSession: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    adm_provider_employees: {
      findFirst: vi.fn(),
    },
  },
}));

import { getSession } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

describe("Provider Context Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // getCurrentProviderId()
  // ==========================================================================
  describe("getCurrentProviderId()", () => {
    it("should return null when user is not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const result = await getCurrentProviderId();

      expect(result).toBeNull();
      expect(prisma.adm_provider_employees.findFirst).not.toHaveBeenCalled();
    });

    it("should return null when employee is not found", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user_123",
      } as never);

      vi.mocked(prisma.adm_provider_employees.findFirst).mockResolvedValue(
        null
      );

      const result = await getCurrentProviderId();

      expect(result).toBeNull();
      expect(prisma.adm_provider_employees.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ auth_user_id: "user_123" }, { clerk_user_id: "user_123" }],
          status: "active",
          deleted_at: null,
        },
        select: { provider_id: true },
      });
    });

    it("should return null when employee has no provider_id (global access)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user_ceo_456",
      } as never);

      // Mock Prisma finding employee with null provider_id (CEO/admin)
      vi.mocked(prisma.adm_provider_employees.findFirst).mockResolvedValue({
        provider_id: null,
      } as never);

      const result = await getCurrentProviderId();

      expect(result).toBeNull();
    });

    it("should return provider_id when employee has one", async () => {
      const expectedProviderId = "uuid-fleetcore-france";

      vi.mocked(getSession).mockResolvedValue({
        userId: "user_france_789",
      } as never);

      // Mock Prisma finding employee with provider_id
      vi.mocked(prisma.adm_provider_employees.findFirst).mockResolvedValue({
        provider_id: expectedProviderId,
      } as never);

      const result = await getCurrentProviderId();

      expect(result).toBe(expectedProviderId);
    });
  });

  // ==========================================================================
  // getProviderContext()
  // ==========================================================================
  describe("getProviderContext()", () => {
    it("should return empty context when user is not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const result = await getProviderContext();

      expect(result).toEqual({
        providerId: null,
        employeeId: null,
        isGlobalAccess: false,
      });
    });

    it("should return empty context when employee is not found", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user_unknown",
      } as never);

      vi.mocked(prisma.adm_provider_employees.findFirst).mockResolvedValue(
        null
      );

      const result = await getProviderContext();

      expect(result).toEqual({
        providerId: null,
        employeeId: null,
        isGlobalAccess: false,
      });
    });

    it("should return global access context for CEO (null provider_id)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        userId: "user_ceo",
      } as never);

      vi.mocked(prisma.adm_provider_employees.findFirst).mockResolvedValue({
        id: "employee_ceo_uuid",
        provider_id: null,
      } as never);

      const result = await getProviderContext();

      expect(result).toEqual({
        providerId: null,
        employeeId: "employee_ceo_uuid",
        isGlobalAccess: true,
      });
    });

    it("should return division-specific context for regular employee", async () => {
      const providerId = "uuid-fleetcore-uae";

      vi.mocked(getSession).mockResolvedValue({
        userId: "user_uae",
      } as never);

      vi.mocked(prisma.adm_provider_employees.findFirst).mockResolvedValue({
        id: "employee_uae_uuid",
        provider_id: providerId,
      } as never);

      const result = await getProviderContext();

      expect(result).toEqual({
        providerId: providerId,
        employeeId: "employee_uae_uuid",
        isGlobalAccess: false,
      });
    });
  });

  // ==========================================================================
  // buildProviderFilter()
  // ==========================================================================
  describe("buildProviderFilter()", () => {
    it("should return empty object when providerId is null (global access)", () => {
      const result = buildProviderFilter(null);

      expect(result).toEqual({});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it("should return { provider_id: uuid } when providerId is set", () => {
      const providerId = "uuid-fleetcore-france";

      const result = buildProviderFilter(providerId);

      expect(result).toEqual({ provider_id: providerId });
    });

    it("should work with different provider UUIDs", () => {
      const testCases = [
        "uuid-fleetcore-france",
        "uuid-fleetcore-uae",
        "uuid-fleetcore-germany",
        "550e8400-e29b-41d4-a716-446655440000",
      ];

      for (const providerId of testCases) {
        const result = buildProviderFilter(providerId);
        expect(result).toEqual({ provider_id: providerId });
      }
    });
  });

  // ==========================================================================
  // buildHybridProviderFilter()
  // ==========================================================================
  describe("buildHybridProviderFilter()", () => {
    it("should return empty object when providerId is null (CEO sees all)", () => {
      const result = buildHybridProviderFilter(null);

      expect(result).toEqual({});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it("should return OR filter when providerId is set", () => {
      const providerId = "uuid-fleetcore-france";

      const result = buildHybridProviderFilter(providerId);

      expect(result).toEqual({
        OR: [{ is_system: true }, { provider_id: providerId }],
      });
    });

    it("should include is_system: true in OR condition", () => {
      const providerId = "uuid-fleetcore-uae";

      const result = buildHybridProviderFilter(providerId);

      expect(result.OR).toBeDefined();
      expect(result.OR).toContainEqual({ is_system: true });
    });

    it("should include provider_id in OR condition", () => {
      const providerId = "uuid-fleetcore-germany";

      const result = buildHybridProviderFilter(providerId);

      expect(result.OR).toBeDefined();
      expect(result.OR).toContainEqual({ provider_id: providerId });
    });

    it("should have exactly 2 conditions in OR array", () => {
      const providerId = "uuid-test";

      const result = buildHybridProviderFilter(providerId);

      expect(result.OR).toHaveLength(2);
    });
  });
});
