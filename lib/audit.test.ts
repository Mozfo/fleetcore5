import { describe, it, expect } from "vitest";
import { buildChangesJSON } from "./audit";
import type { Prisma } from "@prisma/client";

describe("buildChangesJSON()", () => {
  // Test 1: Empty options should return null
  it("should return null when all options are empty", () => {
    const result = buildChangesJSON({});
    expect(result).toBeNull();
  });

  // Test 2: Reason should be stored with _audit_reason prefix
  it("should store reason with _audit_reason prefix", () => {
    const result = buildChangesJSON({
      reason: "User requested deletion",
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    expect(result._audit_reason).toBe("User requested deletion");
  });

  // Test 3: Metadata should be stored with _audit_metadata prefix
  it("should store metadata with _audit_metadata prefix", () => {
    const result = buildChangesJSON({
      metadata: { source: "api", version: "1.0" },
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    expect(result._audit_metadata).toEqual({ source: "api", version: "1.0" });
  });

  // Test 4: Snapshot should be stored with _audit_snapshot prefix
  it("should store snapshot with _audit_snapshot prefix", () => {
    const result = buildChangesJSON({
      snapshot: { id: "123", name: "John Doe", status: "active" },
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    expect(result._audit_snapshot).toEqual({
      id: "123",
      name: "John Doe",
      status: "active",
    });
  });

  // Test 5: PerformedByClerkId should be stored with _audit_clerk_id prefix
  it("should store performedByClerkId with _audit_clerk_id prefix", () => {
    const result = buildChangesJSON({
      performedByClerkId: "user_2abc123xyz",
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    expect(result._audit_clerk_id).toBe("user_2abc123xyz");
  });

  // Test 6: Should merge domain changes with audit metadata
  it("should merge domain changes with audit metadata", () => {
    const result = buildChangesJSON({
      changes: {
        name: { old: "John Doe", new: "Jane Doe" },
        status: { old: "active", new: "inactive" },
      },
      reason: "User profile update",
      metadata: { source: "api", ip: "192.168.1.1" },
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    // Domain changes should be present
    expect(result.name).toEqual({ old: "John Doe", new: "Jane Doe" });
    expect(result.status).toEqual({ old: "active", new: "inactive" });
    // Audit metadata should be prefixed
    expect(result._audit_reason).toBe("User profile update");
    expect(result._audit_metadata).toEqual({
      source: "api",
      ip: "192.168.1.1",
    });
  });

  // Test 7: Should preserve domain changes structure
  it("should preserve domain changes structure", () => {
    const result = buildChangesJSON({
      changes: {
        email: { old: "old@example.com", new: "new@example.com" },
        verified: { old: false, new: true },
      },
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    expect(result.email).toEqual({
      old: "old@example.com",
      new: "new@example.com",
    });
    expect(result.verified).toEqual({ old: false, new: true });
  });

  // Test 8: Should handle null values correctly
  it("should handle null values correctly", () => {
    const result = buildChangesJSON({
      reason: null,
      metadata: null,
      snapshot: null,
    });

    expect(result).toBeNull();
  });

  // Test 9: Should handle undefined values correctly
  it("should handle undefined values correctly", () => {
    const result = buildChangesJSON({
      reason: undefined,
      metadata: undefined,
      snapshot: undefined,
      performedByClerkId: undefined,
    });

    expect(result).toBeNull();
  });

  // Test 10: Should handle empty objects in changes
  it("should handle empty objects in changes", () => {
    const result = buildChangesJSON({
      changes: {},
    });

    // Empty object still counts as data
    expect(result).toBeNull();
  });

  // Test 11: Should handle complex nested changes
  it("should handle complex nested changes", () => {
    const result = buildChangesJSON({
      changes: {
        address: {
          old: { street: "123 Main St", city: "Boston" },
          new: { street: "456 Oak Ave", city: "New York" },
        },
        preferences: {
          old: { theme: "light", notifications: true },
          new: { theme: "dark", notifications: false },
        },
      },
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    expect(result.address).toEqual({
      old: { street: "123 Main St", city: "Boston" },
      new: { street: "456 Oak Ave", city: "New York" },
    });
    expect(result.preferences).toEqual({
      old: { theme: "light", notifications: true },
      new: { theme: "dark", notifications: false },
    });
  });

  // Test 12: Should handle all audit fields together
  it("should handle all audit fields together", () => {
    const result = buildChangesJSON({
      snapshot: { id: "123", name: "Test" },
      reason: "Migration",
      metadata: { tool: "script", version: "2.0" },
      performedByClerkId: "user_admin",
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    expect(result._audit_snapshot).toEqual({ id: "123", name: "Test" });
    expect(result._audit_reason).toBe("Migration");
    expect(result._audit_metadata).toEqual({ tool: "script", version: "2.0" });
    expect(result._audit_clerk_id).toBe("user_admin");
  });

  // Test 13: Should not conflict with _audit_ prefix in domain data
  it("should not conflict with _audit_ prefix in domain data", () => {
    const result = buildChangesJSON({
      changes: {
        _audit_custom: "domain value",
        name: { old: "A", new: "B" },
      },
      reason: "Test collision",
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    // Domain value with _audit_ prefix is preserved
    expect(result._audit_custom).toBe("domain value");
    // System audit metadata is added
    expect(result._audit_reason).toBe("Test collision");
    expect(result.name).toEqual({ old: "A", new: "B" });
  });

  // Test 14: Should return Prisma.InputJsonValue compatible type
  it("should return Prisma.InputJsonValue compatible type", () => {
    const result = buildChangesJSON({
      changes: { test: "value" },
    });

    // This should compile without TypeScript errors
    const _prismaValue: Prisma.InputJsonValue | null = result;

    expect(_prismaValue).toBeDefined();
    expect(typeof result).toBe("object");
  });
});
