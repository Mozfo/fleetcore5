/**
 * Validate Middleware Tests
 *
 * Tests Zod validation helper functions for Next.js requests.
 * Total: 4 tests covering validate(), validateBody(), validateQuery(), validateParams().
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  validate,
  validateBody,
  validateQuery,
  validateParams,
} from "../validate.middleware";
import { ValidationError } from "@/lib/core/errors";

// Test schemas
const TestSchema = z.object({
  name: z.string().min(2),
  age: z.number().min(18),
});

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

describe("Validate Middleware", () => {
  describe("validate()", () => {
    it("should validate and return type-safe data", async () => {
      const validData = {
        name: "John Doe",
        age: 25,
      };

      const result = await validate(TestSchema, validData);

      expect(result.name).toBe("John Doe");
      expect(result.age).toBe(25);
    });

    it("should throw ValidationError for invalid data", async () => {
      const invalidData = {
        name: "J", // Too short
        age: 15, // Below minimum
      };

      await expect(validate(TestSchema, invalidData)).rejects.toThrow(
        ValidationError
      );

      await expect(validate(TestSchema, invalidData)).rejects.toThrow(
        /Validation failed/
      );
    });
  });

  describe("validateBody()", () => {
    it("should extract and validate JSON body", async () => {
      const mockReq = {
        json: async () => ({ name: "Jane Doe", age: 30 }),
      } as never;

      const result = await validateBody(mockReq, TestSchema);

      expect(result.name).toBe("Jane Doe");
      expect(result.age).toBe(30);
    });

    it("should throw ValidationError for invalid JSON", async () => {
      const mockReq = {
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as never;

      await expect(validateBody(mockReq, TestSchema)).rejects.toThrow(
        ValidationError
      );

      await expect(validateBody(mockReq, TestSchema)).rejects.toThrow(
        /Invalid JSON/
      );
    });
  });

  describe("validateQuery()", () => {
    it("should extract and validate query params with coercion", async () => {
      const searchParams = new URLSearchParams({
        page: "2",
        limit: "50",
      });

      const mockReq = {
        nextUrl: {
          searchParams,
        },
      } as never;

      const result = await validateQuery(mockReq, QuerySchema);

      expect(result.page).toBe(2); // Coerced from string
      expect(result.limit).toBe(50); // Coerced from string
    });

    it("should apply defaults for missing query params", async () => {
      const searchParams = new URLSearchParams(); // Empty

      const mockReq = {
        nextUrl: {
          searchParams,
        },
      } as never;

      const result = await validateQuery(mockReq, QuerySchema);

      expect(result.page).toBe(1); // Default value
      expect(result.limit).toBe(20); // Default value
    });
  });

  describe("validateParams()", () => {
    const ParamsSchema = z.object({
      id: z.string().uuid(),
    });

    it("should validate route params", async () => {
      const params = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = await validateParams(params, ParamsSchema);

      expect(result.id).toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("should throw ValidationError for invalid params", async () => {
      const params = {
        id: "not-a-uuid",
      };

      await expect(validateParams(params, ParamsSchema)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
