/**
 * Mock for Vercel KV in CI tests
 * Simulates cache behavior without actual KV connection
 */

import { vi } from "vitest";

const mockCache = new Map<string, string>();

export const getTenantIdFromCache = vi.fn(
  async (orgId: string): Promise<string | null> => {
    // Mock test organization (from batch3-test-results.json)
    if (orgId === "org_34EXxYF5pWSgjfzuoGlmcHA11aa") {
      return "550e8400-e29b-41d4-a716-446655440000"; // Mock tenant UUID
    }

    return mockCache.get(orgId) || null;
  }
);

export const setTenantIdInCache = vi.fn(
  async (orgId: string, tenantId: string): Promise<void> => {
    mockCache.set(orgId, tenantId);
  }
);

export const deleteTenantFromCache = vi.fn(
  async (orgId: string): Promise<void> => {
    mockCache.delete(orgId);
  }
);

export const getTenantCacheStats = vi.fn(async () => ({
  provider: "Mock KV",
  ttl: 3600,
  prefix: "clerk:",
}));
