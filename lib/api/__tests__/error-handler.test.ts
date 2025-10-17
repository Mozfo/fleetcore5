import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { handleApiError, ErrorCode } from "../error-handler";
import { ValidationError, NotFoundError } from "@/lib/core/errors";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

// Mock logger and Sentry (avoid real calls during tests)
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("handleApiError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Pattern A: Full validation routes", () => {
    it("should format ZodError with 400 status and validation details", async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      let error: z.ZodError | undefined;
      try {
        schema.parse({ email: "invalid", age: 15 });
      } catch (e) {
        error = e as z.ZodError;
      }

      const response = handleApiError(error as z.ZodError, {
        path: "/api/v1/drivers",
        tenantId: "tenant-123",
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(body.error.message).toBe("Validation failed");
      expect(body.error.details).toBeDefined();
      expect(Array.isArray(body.error.details)).toBe(true);
      expect(body.error.path).toBe("/api/v1/drivers");
      expect(body.error.timestamp).toBeDefined();
      expect(body.error.request_id).toBeDefined();
    });

    it("should format ValidationError with 400 status", async () => {
      const error = new ValidationError("Driver is already suspended");

      const response = handleApiError(error, {
        path: "/api/v1/drivers/123/suspend",
        userId: "user-456",
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(body.error.message).toBe("Driver is already suspended");
      expect(body.error.details).toBeUndefined();
      expect(body.error.timestamp).toBeDefined();
    });

    it("should format NotFoundError with 404 status", async () => {
      const error = new NotFoundError("Driver");

      const response = handleApiError(error, {
        path: "/api/v1/drivers/550e8400-e29b-41d4-a716-446655440000",
      });

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error.code).toBe(ErrorCode.NOT_FOUND);
      expect(body.error.message).toContain("Driver");
      expect(body.error.timestamp).toBeDefined();
    });
  });

  describe("Pattern B: Simplified routes + Internal errors", () => {
    it("should format unknown error with 500 status and generic message", async () => {
      const error = new Error("Database connection failed");

      const response = handleApiError(error, {
        path: "/api/v1/drivers",
        tenantId: "tenant-123",
      });

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(body.error.message).toBe("An unexpected error occurred");
      // Verify technical message is NOT exposed
      expect(body.error.message).not.toContain("Database connection");
      expect(body.error.details).toBeUndefined();
    });

    it("should NOT expose technical details for Prisma errors", async () => {
      // Simulate Prisma P2002 error (unique constraint)
      const prismaError = new Error("Unique constraint failed on email");
      prismaError.name = "PrismaClientKnownRequestError";

      const response = handleApiError(prismaError, { path: "/api/v1/drivers" });

      expect(response.status).toBe(500);

      const body = await response.json();
      // Generic message only
      expect(body.error.message).toBe("An unexpected error occurred");
      // Prisma details NOT exposed
      expect(body.error.message).not.toContain("Unique constraint");
      expect(body.error.message).not.toContain("P2002");
    });
  });

  describe("Logging and tracking", () => {
    it("should log client errors (400, 404) with warn level", () => {
      const error = new NotFoundError("Driver");
      handleApiError(error, { path: "/api/v1/drivers/123" });

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.NOT_FOUND,
          statusCode: 404,
        }),
        expect.stringContaining("API client error")
      );
    });

    it("should log and track 500 errors with Sentry", () => {
      const error = new Error("Unexpected crash");
      handleApiError(error, {
        path: "/api/v1/drivers",
        tenantId: "tenant-123",
        userId: "user-456",
      });

      // Verify Pino logging
      expect(logger.error).toHaveBeenCalled();

      // Verify Sentry capture
      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          contexts: expect.objectContaining({
            fleetcore: expect.objectContaining({
              tenantId: "tenant-123",
              userId: "user-456",
            }),
          }),
        })
      );
    });
  });

  describe("Request ID generation", () => {
    it("should generate request_id if not provided in context", async () => {
      const error = new NotFoundError("Driver");
      const response = handleApiError(error, { path: "/api/test" });

      const body = await response.json();
      expect(body.error.request_id).toBeDefined();
      expect(body.error.request_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("should use provided request_id from context", async () => {
      const customRequestId = "custom-req-123";
      const error = new NotFoundError("Driver");
      const response = handleApiError(error, {
        path: "/api/test",
        request_id: customRequestId,
      });

      const body = await response.json();
      expect(body.error.request_id).toBe(customRequestId);
    });
  });

  describe("Prisma error handling (Phase 3.3)", () => {
    it("should map P2002 unique constraint to 409 CONFLICT", async () => {
      // Simulate Prisma P2002 unique constraint error
      const prismaError = Object.assign(
        new Error("Unique constraint failed on the fields: (`email`)"),
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["email"] },
        }
      );
      // Make it a PrismaClientKnownRequestError
      Object.setPrototypeOf(
        prismaError,
        Object.getPrototypeOf(
          new (
            await import("@prisma/client")
          ).Prisma.PrismaClientKnownRequestError("Test error", {
            code: "P2002",
            clientVersion: "5.0.0",
          })
        )
      );

      const response = handleApiError(prismaError, {
        path: "/api/v1/drivers",
        tenantId: "tenant-123",
      });

      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.error.code).toBe(ErrorCode.CONFLICT);
      expect(body.error.message).toBe(
        "A record with this value already exists"
      );
      // Security: NO technical details exposed
      expect(body.error.message).not.toContain("P2002");
      expect(body.error.message).not.toContain("email");
      expect(body.error.message).not.toContain("Unique constraint");
    });

    it("should map P2025 record not found to 404 NOT_FOUND", async () => {
      // Simulate Prisma P2025 record not found error
      const prismaError = Object.assign(
        new Error("Record to update not found."),
        {
          code: "P2025",
          clientVersion: "5.0.0",
          meta: { cause: "Record to update not found." },
        }
      );
      Object.setPrototypeOf(
        prismaError,
        Object.getPrototypeOf(
          new (
            await import("@prisma/client")
          ).Prisma.PrismaClientKnownRequestError("Test error", {
            code: "P2025",
            clientVersion: "5.0.0",
          })
        )
      );

      const response = handleApiError(prismaError, {
        path: "/api/v1/drivers/123",
      });

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error.code).toBe(ErrorCode.NOT_FOUND);
      expect(body.error.message).toBe("The requested resource was not found");
      // Security: NO Prisma code exposed
      expect(body.error.message).not.toContain("P2025");
    });

    it("should map P2003 foreign key constraint to 400 VALIDATION_ERROR", async () => {
      // Simulate Prisma P2003 foreign key constraint error
      const prismaError = Object.assign(
        new Error("Foreign key constraint failed on the field: `vehicle_id`"),
        {
          code: "P2003",
          clientVersion: "5.0.0",
          meta: { field_name: "vehicle_id" },
        }
      );
      Object.setPrototypeOf(
        prismaError,
        Object.getPrototypeOf(
          new (
            await import("@prisma/client")
          ).Prisma.PrismaClientKnownRequestError("Test error", {
            code: "P2003",
            clientVersion: "5.0.0",
          })
        )
      );

      const response = handleApiError(prismaError, {
        path: "/api/v1/drivers/123/assign",
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(body.error.message).toBe(
        "This operation violates a data relationship constraint"
      );
      // Security: NO field names exposed
      expect(body.error.message).not.toContain("vehicle_id");
      expect(body.error.message).not.toContain("Foreign key");
    });

    it("should handle unmapped Prisma errors as 500 INTERNAL_ERROR", async () => {
      // Simulate unmapped Prisma error (e.g., P9999 doesn't exist)
      const prismaError = Object.assign(new Error("Unknown database error"), {
        code: "P9999",
        clientVersion: "5.0.0",
      });
      Object.setPrototypeOf(
        prismaError,
        Object.getPrototypeOf(
          new (
            await import("@prisma/client")
          ).Prisma.PrismaClientKnownRequestError("Test error", {
            code: "P9999",
            clientVersion: "5.0.0",
          })
        )
      );

      const response = handleApiError(prismaError, {
        path: "/api/v1/drivers",
      });

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(body.error.message).toBe("An unexpected error occurred");
      // Verify logger.error was called (but NOT Sentry - Prisma errors shouldn't go to Sentry)
      expect(logger.error).toHaveBeenCalled();
    });

    it("should NEVER expose Prisma technical details to client", async () => {
      // Simulate P2002 with detailed metadata
      const prismaError = Object.assign(
        new Error(
          "Unique constraint failed on the fields: (`tenant_id`,`driver_license_number`,`deleted_at`)"
        ),
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: {
            target: ["tenant_id", "driver_license_number", "deleted_at"],
            table: "rid_drivers",
            constraint:
              "rid_drivers_tenant_id_driver_license_number_deleted_at_key",
          },
        }
      );
      Object.setPrototypeOf(
        prismaError,
        Object.getPrototypeOf(
          new (
            await import("@prisma/client")
          ).Prisma.PrismaClientKnownRequestError("Test error", {
            code: "P2002",
            clientVersion: "5.0.0",
          })
        )
      );

      const response = handleApiError(prismaError, {
        path: "/api/v1/drivers",
      });

      const body = await response.json();
      // Security assertions: NONE of these should be in the response
      expect(body.error.message).not.toContain("P2002");
      expect(body.error.message).not.toContain("tenant_id");
      expect(body.error.message).not.toContain("driver_license_number");
      expect(body.error.message).not.toContain("deleted_at");
      expect(body.error.message).not.toContain("rid_drivers");
      expect(body.error.message).not.toContain("constraint");
      expect(JSON.stringify(body)).not.toContain("P2002");
      expect(JSON.stringify(body)).not.toContain("rid_drivers");
      // Only generic message
      expect(body.error.message).toBe(
        "A record with this value already exists"
      );
    });
  });
});
