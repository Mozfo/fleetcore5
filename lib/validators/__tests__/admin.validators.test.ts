/**
 * Admin Validators Tests
 *
 * Covers all 8 Admin schemas (6 métier + 2 query) with valid and invalid cases.
 * Test pattern: 2 tests per schema (valid + invalid) = 16 tests total
 */

import { describe, it, expect } from "vitest";
import {
  TenantCreateSchema,
  TenantUpdateSchema,
  MemberInviteSchema,
  MemberUpdateSchema,
  MemberQuerySchema,
  RoleCreateSchema,
  RoleUpdateSchema,
  RoleQuerySchema,
} from "../admin.validators";

// ===== TENANT VALIDATORS (4 tests) =====

describe("TenantCreateSchema", () => {
  it("should validate valid tenant creation data", () => {
    const validData = {
      name: "Acme Logistics",
      slug: "acme-logistics",
      auth_organization_id: "550e8400-e29b-41d4-a716-446655440000",
      country_code: "fr",
      default_currency: "eur",
      timezone: "Europe/Paris",
      max_members: 50,
      max_vehicles: 200,
    };

    const result = TenantCreateSchema.parse(validData);

    expect(result.name).toBe("Acme Logistics");
    expect(result.country_code).toBe("FR"); // Transformed to uppercase
    expect(result.default_currency).toBe("EUR"); // Transformed to uppercase
    expect(result.max_members).toBe(50);
  });

  it("should reject invalid tenant creation data", () => {
    const invalidData = {
      name: "AB", // Too short
      slug: "Acme Logistics", // Not kebab-case
      auth_organization_id: "invalid_id", // Not a valid UUID
      country_code: "FRANCE", // Too long
      default_currency: "EURO", // Wrong length
      timezone: "AB", // Too short
      max_members: 0, // Below minimum
      max_vehicles: 20000, // Exceeds maximum
    };

    expect(() => TenantCreateSchema.parse(invalidData)).toThrow();
  });
});

describe("TenantUpdateSchema", () => {
  it("should validate partial tenant updates", () => {
    const partialUpdate = {
      max_members: 100,
      max_vehicles: 500,
    };

    const result = TenantUpdateSchema.parse(partialUpdate);
    expect(result.max_members).toBe(100);
    expect(result.max_vehicles).toBe(500);
  });

  it("should reject invalid partial updates", () => {
    const invalidUpdate = {
      slug: "Invalid Slug!", // Not kebab-case
      max_members: -10, // Negative
    };

    expect(() => TenantUpdateSchema.parse(invalidUpdate)).toThrow();
  });
});

// ===== MEMBER VALIDATORS (6 tests) =====

describe("MemberInviteSchema", () => {
  it("should validate valid member invitation", () => {
    const validData = {
      email: "john.doe@acme.com",
      role_id: "123e4567-e89b-12d3-a456-426614174000",
      invitation_type: "additional_user",
      custom_message: "Welcome to the team!",
    };

    const result = MemberInviteSchema.parse(validData);

    expect(result.email).toBe("john.doe@acme.com");
    expect(result.invitation_type).toBe("additional_user");
  });

  it("should reject invalid member invitation", () => {
    const invalidData = {
      email: "not-an-email",
      role_id: "invalid-uuid",
      invitation_type: "invalid_type",
      custom_message: "A".repeat(600), // Exceeds max length
    };

    expect(() => MemberInviteSchema.parse(invalidData)).toThrow();
  });
});

describe("MemberUpdateSchema", () => {
  it("should validate member profile updates", () => {
    const validUpdate = {
      first_name: "John",
      last_name: "Doe",
      preferred_language: "fr",
      notification_preferences: {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
      },
    };

    const result = MemberUpdateSchema.parse(validUpdate);

    expect(result.first_name).toBe("John");
    expect(result.preferred_language).toBe("fr");
    expect(result.notification_preferences?.email_enabled).toBe(true);
  });

  it("should reject invalid member updates", () => {
    const invalidUpdate = {
      first_name: "J", // Too short
      preferred_language: "es", // Not in enum
      notification_preferences: {
        email_enabled: "yes", // Should be boolean
        sms_enabled: false,
        push_enabled: true,
      },
    };

    expect(() => MemberUpdateSchema.parse(invalidUpdate)).toThrow();
  });
});

describe("MemberQuerySchema", () => {
  it("should validate and coerce member query parameters", () => {
    const query = {
      page: "2",
      limit: "30",
      sortBy: "email",
      sortOrder: "asc",
      status: "active",
      two_factor_enabled: "true",
      search: "john",
    };

    const result = MemberQuerySchema.parse(query);

    expect(result.page).toBe(2); // Coerced to number
    expect(result.limit).toBe(30);
    expect(result.status).toBe("active");
    expect(result.two_factor_enabled).toBe(true); // Coerced to boolean
    expect(result.search).toBe("john");
  });

  it("should apply defaults for missing member query params", () => {
    const emptyQuery = {};

    const result = MemberQuerySchema.parse(emptyQuery);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortBy).toBe("created_at");
    expect(result.sortOrder).toBe("desc");
  });
});

// ===== ROLE VALIDATORS (6 tests) =====

describe("RoleCreateSchema", () => {
  it("should validate valid role creation with CRUD permissions", () => {
    const validData = {
      name: "Fleet Manager",
      description: "Can manage vehicles and drivers",
      permissions: {
        vehicles: { create: true, read: true, update: true, delete: false },
        drivers: { create: true, read: true, update: true, delete: false },
        trips: { create: false, read: true, update: false, delete: false },
        leads: { create: false, read: false, update: false, delete: false },
        opportunities: {
          create: false,
          read: false,
          update: false,
          delete: false,
        },
        contracts: { create: false, read: false, update: false, delete: false },
      },
      is_system: false,
      max_members: 10,
    };

    const result = RoleCreateSchema.parse(validData);

    expect(result.name).toBe("Fleet Manager");
    expect(result.permissions.vehicles.create).toBe(true);
    expect(result.permissions.vehicles.delete).toBe(false);
    expect(result.is_system).toBe(false);
    expect(result.max_members).toBe(10);
  });

  it("should reject invalid role creation", () => {
    const invalidData = {
      name: "AB", // Too short
      description: "A".repeat(600), // Exceeds max
      permissions: {
        vehicles: { create: true, read: true }, // Missing update and delete
        drivers: { create: true, read: true, update: true, delete: false },
        trips: { create: false, read: true, update: false, delete: false },
        leads: { create: false, read: false, update: false, delete: false },
        opportunities: {
          create: false,
          read: false,
          update: false,
          delete: false,
        },
        contracts: { create: false, read: false, update: false, delete: false },
      },
      is_system: false,
    };

    expect(() => RoleCreateSchema.parse(invalidData)).toThrow();
  });

  it("should validate role without max_members (optional)", () => {
    const validData = {
      name: "Admin",
      description: "Full system access",
      permissions: {
        vehicles: { create: true, read: true, update: true, delete: true },
        drivers: { create: true, read: true, update: true, delete: true },
        trips: { create: true, read: true, update: true, delete: true },
        leads: { create: true, read: true, update: true, delete: true },
        opportunities: { create: true, read: true, update: true, delete: true },
        contracts: { create: true, read: true, update: true, delete: true },
      },
      is_system: true,
      // max_members is optional
    };

    const result = RoleCreateSchema.parse(validData);
    expect(result.name).toBe("Admin");
    expect(result.is_system).toBe(true);
  });
});

describe("RoleUpdateSchema", () => {
  it("should validate partial role updates", () => {
    const partialUpdate = {
      description: "Updated description",
      max_members: 20,
    };

    const result = RoleUpdateSchema.parse(partialUpdate);

    expect(result.description).toBe("Updated description");
    expect(result.max_members).toBe(20);
  });

  it("should reject invalid partial role updates", () => {
    const invalidUpdate = {
      name: "A", // Too short
      max_members: -5, // Negative
    };

    expect(() => RoleUpdateSchema.parse(invalidUpdate)).toThrow();
  });
});

describe("RoleQuerySchema", () => {
  it("should validate and coerce role query parameters", () => {
    const query = {
      page: "1",
      limit: "50",
      sortBy: "name",
      sortOrder: "asc",
      status: "active",
      is_system: false, // Use actual boolean instead of string
      search: "manager",
    };

    const result = RoleQuerySchema.parse(query);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
    expect(result.sortBy).toBe("name");
    expect(result.is_system).toBe(false);
    expect(result.search).toBe("manager");
  });

  it("should apply defaults for missing role query params", () => {
    const emptyQuery = {};

    const result = RoleQuerySchema.parse(emptyQuery);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortBy).toBe("name");
    expect(result.sortOrder).toBe("asc"); // Different default than other queries
  });
});
