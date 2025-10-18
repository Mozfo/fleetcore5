/**
 * Vitest Setup - CI Mode
 *
 * Automatically mocks @vercel/kv in CI environment
 * to allow tests to run without actual KV connection.
 *
 * Mocks location: lib/cache/__mocks__/tenant-mapping.ts
 */

import { vi } from "vitest";

// Mock @vercel/kv module entirely in CI
vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(() => Promise.resolve(null)), // Simulate cache miss
    set: vi.fn(() => Promise.resolve("OK")),
    del: vi.fn(() => Promise.resolve(1)),
  },
}));

// Use manual mocks for tenant-mapping in CI
// This automatically uses lib/cache/__mocks__/tenant-mapping.ts
vi.mock("@/lib/cache/tenant-mapping");
