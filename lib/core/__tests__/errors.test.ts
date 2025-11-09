/**
 * Tests for Custom Error Classes
 * lib/core/errors.ts
 */

import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
  BusinessRuleError,
  isPrismaError,
  assertDefined,
} from "../errors";

describe("AppError", () => {
  it("should create error with message and default 500 status", () => {
    const error = new AppError("Something went wrong");
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe("AppError");
    expect(error.code).toBeUndefined();
  });

  it("should create error with custom status code and code", () => {
    const error = new AppError("Custom error", 418, "TEAPOT");
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe("TEAPOT");
  });
});

describe("ValidationError", () => {
  it("should create validation error with 400 status", () => {
    const error = new ValidationError("Invalid email format");
    expect(error.message).toBe("Invalid email format");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.name).toBe("ValidationError");
  });

  it("should be instance of AppError", () => {
    const error = new ValidationError("Invalid input");
    expect(error).toBeInstanceOf(AppError);
  });
});

describe("NotFoundError", () => {
  it("should create not found error with 404 status", () => {
    const error = new NotFoundError("User");
    expect(error.message).toBe("User not found");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.name).toBe("NotFoundError");
  });

  it("should be instance of AppError", () => {
    const error = new NotFoundError("Vehicle");
    expect(error).toBeInstanceOf(AppError);
  });
});

describe("UnauthorizedError", () => {
  it("should create unauthorized error with 401 status and default message", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Unauthorized");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.name).toBe("UnauthorizedError");
  });

  it("should accept custom message", () => {
    const error = new UnauthorizedError("Invalid token");
    expect(error.message).toBe("Invalid token");
  });
});

describe("ForbiddenError", () => {
  it("should create forbidden error with 403 status and default message", () => {
    const error = new ForbiddenError();
    expect(error.message).toBe("Forbidden");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.name).toBe("ForbiddenError");
  });

  it("should accept custom message", () => {
    const error = new ForbiddenError("Insufficient permissions");
    expect(error.message).toBe("Insufficient permissions");
  });
});

describe("ConflictError", () => {
  it("should create conflict error with 409 status", () => {
    const error = new ConflictError("Email already exists");
    expect(error.message).toBe("Email already exists");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
    expect(error.name).toBe("ConflictError");
  });

  it("should be instance of AppError", () => {
    const error = new ConflictError("Duplicate entry");
    expect(error).toBeInstanceOf(AppError);
  });
});

describe("DatabaseError", () => {
  it("should create database error with 500 status", () => {
    const error = new DatabaseError("Connection failed");
    expect(error.message).toBe("Connection failed");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("DATABASE_ERROR");
    expect(error.name).toBe("DatabaseError");
    expect(error.originalError).toBeUndefined();
  });

  it("should store original error", () => {
    const prismaError = { code: "P2002", message: "Unique constraint" };
    const error = new DatabaseError("Prisma error occurred", prismaError);
    expect(error.originalError).toEqual(prismaError);
    expect(error.message).toBe("Prisma error occurred");
  });

  it("should be instance of AppError", () => {
    const error = new DatabaseError("DB error");
    expect(error).toBeInstanceOf(AppError);
  });

  it("should handle complex original errors", () => {
    const complexError = new Error("Native DB error");
    const error = new DatabaseError("Database timeout", complexError);
    expect(error.originalError).toBe(complexError);
  });
});

describe("BusinessRuleError", () => {
  it("should create business rule error with 422 status", () => {
    const error = new BusinessRuleError(
      "Cannot delete driver with active trips",
      "driver_has_active_trips"
    );
    expect(error.message).toBe("Cannot delete driver with active trips");
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("BUSINESS_RULE_VIOLATION");
    expect(error.name).toBe("BusinessRuleError");
    expect(error.rule).toBe("driver_has_active_trips");
    expect(error.details).toBeUndefined();
  });

  it("should store rule and details", () => {
    const error = new BusinessRuleError(
      "Insufficient balance",
      "minimum_balance_required",
      { currentBalance: 50, minimumRequired: 100 }
    );
    expect(error.rule).toBe("minimum_balance_required");
    expect(error.details).toEqual({
      currentBalance: 50,
      minimumRequired: 100,
    });
  });

  it("should be instance of AppError", () => {
    const error = new BusinessRuleError("Rule violation", "test_rule");
    expect(error).toBeInstanceOf(AppError);
  });

  it("should handle empty details object", () => {
    const error = new BusinessRuleError("Rule violation", "test_rule", {});
    expect(error.details).toEqual({});
  });
});

describe("isPrismaError", () => {
  it("should return true for valid Prisma error", () => {
    const prismaError = { code: "P2002", message: "Unique constraint" };
    expect(isPrismaError(prismaError)).toBe(true);
  });

  it("should return false for non-objects", () => {
    expect(isPrismaError(null)).toBe(false);
    expect(isPrismaError(undefined)).toBe(false);
    expect(isPrismaError("string")).toBe(false);
    expect(isPrismaError(123)).toBe(false);
  });

  it("should return false for objects without code property", () => {
    expect(isPrismaError({})).toBe(false);
    expect(isPrismaError({ message: "error" })).toBe(false);
  });

  it("should return false for objects with non-string code", () => {
    expect(isPrismaError({ code: 123 })).toBe(false);
    expect(isPrismaError({ code: null })).toBe(false);
  });
});

describe("assertDefined", () => {
  it("should return value if defined", () => {
    expect(assertDefined("test", "Error")).toBe("test");
    expect(assertDefined(123, "Error")).toBe(123);
    expect(assertDefined(false, "Error")).toBe(false);
    expect(assertDefined("", "Error")).toBe("");
  });

  it("should throw error if value is null", () => {
    expect(() => assertDefined(null, "Value is required")).toThrow(
      "Value is required"
    );
  });

  it("should throw error if value is undefined", () => {
    expect(() => assertDefined(undefined, "Value is required")).toThrow(
      "Value is required"
    );
  });

  it("should narrow type correctly", () => {
    const value: string | undefined = "test";
    const result = assertDefined(value, "Must be defined");
    // TypeScript should infer result as string (not string | undefined)
    expect(result).toBe("test");
  });
});
