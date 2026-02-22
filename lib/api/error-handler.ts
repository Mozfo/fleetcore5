/**
 * API Error Handler - Types & Architecture
 *
 * Centralized error handling system for FleetCore API routes.
 * Provides type-safe error responses with consistent JSON format.
 *
 * **Supported Patterns:**
 * - Pattern A (25 routes): POST/PATCH with Zod validation → full error handling
 * - Pattern B (4 routes): GET read-only → minimal error handling
 *
 * **Key Features:**
 * - Standardized JSON error responses
 * - Type-safe error codes and HTTP status mapping
 * - Context metadata for logging and debugging
 * - Reuses existing lib/core/errors.ts classes (AppError hierarchy)
 *
 * **Architecture Decision:**
 * We REUSE existing AppError classes from lib/core/errors.ts because:
 * 1. They already have statusCode and code properties
 * 2. Consistent with current codebase (25 routes use them)
 * 3. No need for duplication
 * 4. Type-safe with TypeScript
 *
 * **Related ADR:** docs/architecture/adr/003-api-error-handling.md (Phase 3.8)
 *
 * @module lib/api/error-handler
 * @since Phase 3.2A
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from "@/lib/core/errors";

// ============================================================================
// TYPES & INTERFACES (Phase 3.2A)
// ============================================================================

/**
 * Standardized JSON error response format
 *
 * This interface defines the shape of ALL error responses returned
 * by FleetCore API routes (POST, PATCH, DELETE, GET).
 *
 * Follows REST API envelope pattern with error wrapper for:
 * - Consistent structure across all error types
 * - Clear distinction between error and success responses
 * - Future extensibility (metadata at top level)
 *
 * @example
 * // Validation error response
 * {
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Validation failed",
 *     "details": {
 *       "email": "Invalid email format",
 *       "phone": "Phone number is required"
 *     },
 *     "path": "/api/v1/drivers",
 *     "timestamp": "2025-10-15T14:30:00.000Z",
 *     "request_id": "req_abc123"
 *   }
 * }
 *
 * @example
 * // Not found error response
 * {
 *   "error": {
 *     "code": "NOT_FOUND",
 *     "message": "Driver not found",
 *     "path": "/api/v1/drivers/123",
 *     "timestamp": "2025-10-15T14:30:00.000Z",
 *     "request_id": "req_xyz789"
 *   }
 * }
 *
 * @example
 * // Internal server error response
 * {
 *   "error": {
 *     "code": "INTERNAL_ERROR",
 *     "message": "An unexpected error occurred",
 *     "path": "/api/v1/vehicles",
 *     "timestamp": "2025-10-15T14:30:00.000Z",
 *     "request_id": "req_def456"
 *   }
 * }
 */
export interface ErrorResponse {
  /**
   * Error envelope containing all error details
   * Follows REST API envelope pattern for consistent error handling
   */
  error: {
    /**
     * Machine-readable error code (enum value)
     * Used for programmatic error handling by clients
     */
    code: ErrorCode;

    /**
     * Human-readable error message
     * Localized and safe to display to end users
     */
    message: string;

    /**
     * Optional detailed validation errors or additional context
     * Typically used for Zod validation errors (field-level errors)
     *
     * Can be either:
     * - Zod issues array: z.ZodIssue[]
     * - Custom validation object: Record<string, unknown>
     *
     * @example { "email": "Invalid format", "phone": "Required" }
     * @example [{ path: ["email"], message: "Invalid email" }]
     */
    details?: unknown[] | Record<string, unknown>;

    /**
     * API path that generated the error
     * Used for debugging and log correlation
     *
     * @example "/api/v1/drivers/123"
     */
    path?: string;

    /**
     * ISO 8601 timestamp when error occurred
     * Used for log correlation and debugging
     *
     * @example "2025-10-15T14:30:00.000Z"
     */
    timestamp: string;

    /**
     * Unique request identifier for log correlation
     * Generated per-request (future: from middleware)
     *
     * @example "req_abc123xyz789"
     */
    request_id?: string;
  };
}

/**
 * Error code enumeration
 *
 * Machine-readable error codes matching lib/core/errors.ts classes.
 * Used for client-side error handling and monitoring.
 *
 * **Mapping to HTTP Status Codes:**
 * - VALIDATION_ERROR → 400 Bad Request
 * - UNAUTHORIZED → 401 Unauthorized
 * - FORBIDDEN → 403 Forbidden
 * - NOT_FOUND → 404 Not Found
 * - CONFLICT → 409 Conflict
 * - INTERNAL_ERROR → 500 Internal Server Error
 *
 * @example
 * // In route handler
 * if (!driver) {
 *   return NextResponse.json(
 *     { code: ErrorCode.NOT_FOUND, message: "Driver not found" },
 *     { status: 404 }
 *   );
 * }
 */
export enum ErrorCode {
  /**
   * Input validation failed (Zod schema, field validation)
   * HTTP 400 Bad Request
   */
  VALIDATION_ERROR = "VALIDATION_ERROR",

  /**
   * User not authenticated (no valid token/session)
   * HTTP 401 Unauthorized
   */
  UNAUTHORIZED = "UNAUTHORIZED",

  /**
   * User authenticated but lacks permissions
   * HTTP 403 Forbidden
   */
  FORBIDDEN = "FORBIDDEN",

  /**
   * Requested resource does not exist
   * HTTP 404 Not Found
   */
  NOT_FOUND = "NOT_FOUND",

  /**
   * Resource conflict (duplicate key, constraint violation)
   * HTTP 409 Conflict
   */
  CONFLICT = "CONFLICT",

  /**
   * Unexpected server error (unhandled exceptions)
   * HTTP 500 Internal Server Error
   */
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Error context metadata
 *
 * Additional information passed to logging and monitoring systems.
 * NOT included in client response (internal use only).
 *
 * @example
 * // In error handler
 * const context: ErrorContext = {
 *   tenantId: "org_abc123",
 *   userId: "user_xyz789",
 *   path: "/api/v1/drivers",
 *   method: "POST",
 *   timestamp: new Date().toISOString(),
 *   request_id: "req_unique123",
 *   error_stack: error.stack
 * };
 *
 * // Logged to Pino/Sentry, NOT sent to client
 * logger.error({ ...context, error }, "API error occurred");
 */
export interface ErrorContext {
  /**
   * Tenant ID (auth orgId) for multi-tenant isolation
   * Used for filtering logs and debugging tenant-specific issues
   */
  tenantId?: string;

  /**
   * User ID (auth userId) who triggered the error
   * Used for user-specific debugging and audit trails
   */
  userId?: string;

  /**
   * Unique request identifier
   * Generated per-request for log correlation across services
   */
  request_id?: string;

  /**
   * API path that generated the error
   * @example "/api/v1/drivers/123"
   */
  path?: string;

  /**
   * HTTP method (GET, POST, PATCH, DELETE)
   */
  method?: string;

  /**
   * ISO 8601 timestamp when error occurred
   */
  timestamp: string;

  /**
   * Error stack trace (for 500 errors)
   * Only logged, never sent to client
   */
  error_stack?: string;

  /**
   * Additional custom metadata
   * Flexible object for route-specific context
   */
  metadata?: Record<string, unknown>;
}

/**
 * HTTP Status Code Mapping
 *
 * Maps ErrorCode enum values to HTTP status codes.
 * Type-safe constant using `as const` for literal types.
 *
 * @example
 * // In error handler
 * const statusCode = ERROR_STATUS_MAP[ErrorCode.NOT_FOUND]; // 404
 * return NextResponse.json(errorResponse, { status: statusCode });
 */
export const ERROR_STATUS_MAP = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INTERNAL_ERROR]: 500,
} as const;

/**
 * Type for valid HTTP status codes
 * Derived from ERROR_STATUS_MAP for type safety
 */
export type ErrorStatusCode =
  (typeof ERROR_STATUS_MAP)[keyof typeof ERROR_STATUS_MAP];

// ============================================================================
// ARCHITECTURE DECISION: Reuse lib/core/errors.ts Classes
// ============================================================================
/**
 * **Decision:** REUSE existing AppError class hierarchy from lib/core/errors.ts
 *
 * **Rationale:**
 * 1. ✅ Existing classes already have `statusCode` and `code` properties
 * 2. ✅ Consistent with current codebase (25 routes already use them)
 * 3. ✅ No duplication needed - DRY principle
 * 4. ✅ Type-safe with TypeScript
 * 5. ✅ Follows Next.js App Router patterns
 *
 * **Usage Pattern:**
 * ```typescript
 * import { ValidationError, NotFoundError, ConflictError } from "@/lib/core/errors";
 *
 * // In route handler
 * throw new NotFoundError("Driver"); // Caught by handleApiError()
 *
 * // Or explicit return
 * if (!driver) {
 *   const error = new NotFoundError("Driver");
 *   return handleApiError(error, context);
 * }
 * ```
 *
 * **Existing Classes (lib/core/errors.ts):**
 * - AppError (base class)
 * - ValidationError (400)
 * - NotFoundError (404)
 * - UnauthorizedError (401)
 * - ForbiddenError (403)
 * - ConflictError (409)
 *
 * **No new classes needed** - handleApiError() will:
 * 1. Accept AppError instances OR unknown errors
 * 2. Map AppError.code → ErrorCode enum
 * 3. Use AppError.statusCode → HTTP status
 * 4. Format as ErrorResponse interface
 * 5. Log to Pino with ErrorContext metadata
 * 6. Send to Sentry for 500 errors
 *
 * **Implementation:** Phase 3.2B will create handleApiError() function
 */

// ============================================================================
// TYPE TESTS - Compile-time validation
// ============================================================================
/**
 * TypeScript compile-time tests to validate type definitions
 * These tests ensure interfaces and types are correctly structured
 */

// Test: ErrorResponse must have required fields with error wrapper
const _testErrorResponse: ErrorResponse = {
  error: {
    code: ErrorCode.VALIDATION_ERROR,
    message: "Test error",
    timestamp: new Date().toISOString(),
  },
};

// Test: ErrorResponse with all optional fields
const _testErrorResponseFull: ErrorResponse = {
  error: {
    code: ErrorCode.NOT_FOUND,
    message: "Resource not found",
    details: { field: "email", reason: "Invalid format" },
    path: "/api/v1/test",
    timestamp: new Date().toISOString(),
    request_id: "req_test123",
  },
};

// Test: ErrorContext with all fields
const _testErrorContext: ErrorContext = {
  tenantId: "org_test123",
  userId: "user_test456",
  request_id: "req_test789",
  path: "/api/v1/drivers",
  method: "POST",
  timestamp: new Date().toISOString(),
  error_stack: "Error: Test\n  at ...",
  metadata: { custom: "value" },
};

// Test: ERROR_STATUS_MAP type inference
const _testStatusCode: ErrorStatusCode = 404; // Valid
// const _testInvalidStatusCode: ErrorStatusCode = 999; // ❌ Type error

// Test: ErrorCode enum values
const _testErrorCode: ErrorCode = ErrorCode.VALIDATION_ERROR; // Valid
// const _testInvalidErrorCode: ErrorCode = "INVALID_CODE"; // ❌ Type error

// Prevent accidental export of test constants
void _testErrorResponse;
void _testErrorResponseFull;
void _testErrorContext;
void _testStatusCode;
void _testErrorCode;

// ============================================================================
// HELPER FUNCTIONS (Phase 3.2B)
// ============================================================================

/**
 * Generate unique request ID for tracing
 *
 * Uses crypto.randomUUID() for RFC 4122 version 4 UUID generation.
 *
 * @returns UUID v4 string
 *
 * @example
 * const requestId = generateRequestId();
 * // "550e8400-e29b-41d4-a716-446655440000"
 */
function generateRequestId(): string {
  return randomUUID();
}

/**
 * Format Zod validation error into standardized ErrorResponse
 *
 * Transforms Zod validation errors (with issues array) into our
 * standardized error format with REST API envelope pattern.
 *
 * @param error - Zod validation error with issues array
 * @param context - Request context for logging and correlation
 * @returns ErrorResponse with VALIDATION_ERROR code and Zod issues in details
 *
 * @example
 * const schema = z.object({ email: z.string().email() });
 * try {
 *   schema.parse({ email: 'invalid' });
 * } catch (error) {
 *   return formatZodError(error as z.ZodError, { path: '/api/drivers' });
 * }
 */
function formatZodError(
  error: z.ZodError,
  context?: Partial<ErrorContext>
): ErrorResponse {
  return {
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: "Validation failed",
      details: error.issues, // Full Zod issues array
      path: context?.path,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id ?? generateRequestId(),
    },
  };
}

/**
 * Format custom ValidationError into standardized ErrorResponse
 *
 * Transforms our custom ValidationError class (lib/core/errors.ts)
 * into the standardized error format. Used for business rule violations.
 *
 * @param error - ValidationError from lib/core/errors.ts
 * @param context - Request context for logging and correlation
 * @returns ErrorResponse with VALIDATION_ERROR code
 *
 * @example
 * throw new ValidationError("Driver is already suspended");
 * // Caught and formatted:
 * return formatValidationError(error, { tenantId, userId });
 */
function formatValidationError(
  error: ValidationError,
  context?: Partial<ErrorContext>
): ErrorResponse {
  return {
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: error.message,
      details: undefined, // No additional details for business rule errors
      path: context?.path,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id ?? generateRequestId(),
    },
  };
}

/**
 * Format NotFoundError into standardized ErrorResponse
 *
 * Transforms our custom NotFoundError class (lib/core/errors.ts)
 * into the standardized error format.
 *
 * @param error - NotFoundError from lib/core/errors.ts
 * @param context - Request context for logging and correlation
 * @returns ErrorResponse with NOT_FOUND code
 *
 * @example
 * const driver = await driverService.getDriver(id);
 * if (!driver) throw new NotFoundError("Driver");
 * // Caught and formatted:
 * return formatNotFoundError(error, { path: '/api/drivers/123' });
 */
function formatNotFoundError(
  error: NotFoundError,
  context?: Partial<ErrorContext>
): ErrorResponse {
  return {
    error: {
      code: ErrorCode.NOT_FOUND,
      message: error.message, // e.g., "Driver not found"
      details: undefined,
      path: context?.path,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id ?? generateRequestId(),
    },
  };
}

/**
 * Format ConflictError into standardized ErrorResponse
 *
 * Transforms our custom ConflictError class (lib/core/errors.ts)
 * into the standardized error format.
 *
 * @param error - ConflictError from lib/core/errors.ts
 * @param context - Request context for logging and correlation
 * @returns ErrorResponse with CONFLICT code
 *
 * @example
 * const exists = await checkDuplicate(name);
 * if (exists) throw new ConflictError("Car make already exists");
 * // Caught and formatted:
 * return formatConflictError(error, { path: '/api/directory/makes' });
 */
function formatConflictError(
  error: ConflictError,
  context?: Partial<ErrorContext>
): ErrorResponse {
  return {
    error: {
      code: ErrorCode.CONFLICT,
      message: error.message, // e.g., "Car make already exists globally"
      details: undefined,
      path: context?.path,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id ?? generateRequestId(),
    },
  };
}

/**
 * Format unknown/internal error into standardized ErrorResponse
 *
 * SECURITY CRITICAL: This function handles all unexpected errors (500s) and
 * Prisma database errors. It NEVER exposes technical details to the client.
 * All technical information is logged server-side only (Pino + Sentry).
 *
 * **Phase 3.3 Enhancement:** Now detects Prisma errors (P2002, P2025, etc.)
 * and maps them to appropriate HTTP status codes (409, 404, 400) with
 * user-friendly messages.
 *
 * **Security guarantees:**
 * - ❌ Stack traces NEVER exposed to client
 * - ❌ Prisma error codes NEVER exposed to client (P2002, P2025, etc.)
 * - ❌ Field names NEVER exposed to client (email, license_number, etc.)
 * - ❌ Table names NEVER exposed to client (rid_drivers, flt_vehicles, etc.)
 * - ❌ Database details NEVER exposed to client
 * - ✅ User-friendly messages only (e.g., "A record with this value already exists")
 * - ✅ Full technical details logged server-side (Pino)
 * - ✅ Prisma errors tracked separately (not sent to Sentry - expected errors)
 * - ✅ Unknown 500 errors tracked in Sentry with context
 *
 * @param error - Unknown error (could be Error, Prisma error, etc.)
 * @param context - Request context for logging
 * @returns ErrorResponse with appropriate code and user-friendly message
 *
 * @example
 * // Prisma P2002 unique constraint violation
 * try {
 *   await prisma.driver.create({ data: { email: "duplicate@test.com" } });
 * } catch (error) {
 *   // Returns: 409 CONFLICT - "A record with this value already exists"
 *   return formatInternalError(error, { tenantId, userId });
 * }
 *
 * @example
 * // Prisma P2025 record not found
 * try {
 *   await prisma.driver.update({ where: { id: "missing" }, data: {...} });
 * } catch (error) {
 *   // Returns: 404 NOT_FOUND - "The requested resource was not found"
 *   return formatInternalError(error, { tenantId, userId });
 * }
 *
 * @example
 * // Unknown error (network, etc.)
 * try {
 *   await someUnexpectedOperation();
 * } catch (error) {
 *   // Returns: 500 INTERNAL_ERROR - "An unexpected error occurred"
 *   // + Sentry tracking
 *   return formatInternalError(error, { tenantId, userId });
 * }
 */
function formatInternalError(
  error: unknown,
  context?: Partial<ErrorContext>
): ErrorResponse {
  const enrichedContext: ErrorContext = {
    timestamp: new Date().toISOString(),
    request_id: context?.request_id ?? generateRequestId(),
    tenantId: context?.tenantId,
    userId: context?.userId,
    path: context?.path,
    method: context?.method,
    error_stack: error instanceof Error ? error.stack : undefined,
    metadata: context?.metadata,
  };

  // =========================================================================
  // PHASE 3.3: Detect and handle Prisma errors FIRST
  // =========================================================================
  if (isPrismaError(error)) {
    const prismaCode = error.code;
    const errorCode = mapPrismaCodeToErrorCode(prismaCode);
    const userMessage = getPrismaUserMessage(prismaCode);

    // Log Prisma error details server-side (with Prisma code for debugging)
    logger.error(
      {
        prisma_code: prismaCode, // P2002, P2025, etc. (server-side only)
        error_code: errorCode, // CONFLICT, NOT_FOUND, etc.
        message: error.message, // Full Prisma message (server-side only)
        error_meta: error.meta, // Prisma metadata (field names, etc.)
        context: enrichedContext,
      },
      `Prisma error: ${prismaCode}`
    );

    // NOTE: We DON'T send Prisma errors to Sentry
    // These are expected business logic errors (unique constraints, etc.)
    // NOT bugs that need tracking

    // Return user-friendly response (NO technical details)
    return {
      error: {
        code: errorCode, // CONFLICT, NOT_FOUND, VALIDATION_ERROR
        message: userMessage, // "A record with this value already exists"
        path: enrichedContext.path,
        timestamp: enrichedContext.timestamp,
        request_id: enrichedContext.request_id,
      },
    };
  }

  // =========================================================================
  // FALLBACK: Generic 500 errors (non-Prisma)
  // =========================================================================

  // 1. Log full error details server-side with Pino
  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
      error_stack: enrichedContext.error_stack,
      context: enrichedContext,
    },
    "Internal server error"
  );

  // 2. Capture in Sentry for production tracking (unknown errors only)
  if (error instanceof Error) {
    Sentry.captureException(error, {
      contexts: {
        fleetcore: {
          tenantId: enrichedContext.tenantId,
          userId: enrichedContext.userId,
          path: enrichedContext.path,
          request_id: enrichedContext.request_id,
        },
      },
    });
  }

  // 3. Return generic response to client (NEVER expose technical details)
  return {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "An unexpected error occurred", // Generic message only
      path: enrichedContext.path,
      timestamp: enrichedContext.timestamp,
      request_id: enrichedContext.request_id,
    },
  };
}

// ============================================================================
// PRISMA ERROR HELPERS (Phase 3.3)
// ============================================================================

/**
 * Type guard to detect Prisma errors
 *
 * Checks if an error is a PrismaClientKnownRequestError (has code property).
 * Used to identify database constraint violations and not-found errors.
 *
 * **Security Note:** This only detects Prisma errors internally.
 * Technical details are NEVER exposed to the client.
 *
 * @param error - Unknown error to check
 * @returns True if error is a Prisma known request error
 *
 * @example
 * if (isPrismaError(error)) {
 *   // Handle P2002, P2025, etc.
 *   const code = mapPrismaCodeToErrorCode(error.code);
 * }
 */
function isPrismaError(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    typeof error.code === "string"
  );
}

/**
 * Map Prisma error codes to FleetCore ErrorCode enum
 *
 * Translates Prisma database error codes (P2002, P2025, etc.) into our
 * standardized ErrorCode enum. Unknown codes default to INTERNAL_ERROR.
 *
 * **Priority mappings:**
 * - P2002 (unique constraint) → CONFLICT (409)
 * - P2025 (record not found) → NOT_FOUND (404)
 * - P2003 (foreign key constraint) → VALIDATION_ERROR (400)
 * - P2014 (required relation) → VALIDATION_ERROR (400)
 * - P2015 (related record not found) → NOT_FOUND (404)
 * - P2034 (transaction conflict) → CONFLICT (409)
 * - All other codes → INTERNAL_ERROR (500)
 *
 * @param prismaCode - Prisma error code (e.g., "P2002")
 * @returns Corresponding ErrorCode enum value
 *
 * @example
 * const errorCode = mapPrismaCodeToErrorCode("P2002");
 * // Returns ErrorCode.CONFLICT
 */
function mapPrismaCodeToErrorCode(prismaCode: string): ErrorCode {
  switch (prismaCode) {
    case "P2002": // Unique constraint failed
      return ErrorCode.CONFLICT;
    case "P2025": // Record to update/delete not found
      return ErrorCode.NOT_FOUND;
    case "P2003": // Foreign key constraint failed
      return ErrorCode.VALIDATION_ERROR;
    case "P2014": // Required relation violation
      return ErrorCode.VALIDATION_ERROR;
    case "P2015": // Related record not found
      return ErrorCode.NOT_FOUND;
    case "P2034": // Transaction write conflict
      return ErrorCode.CONFLICT;
    default:
      // Unknown Prisma error → generic 500
      return ErrorCode.INTERNAL_ERROR;
  }
}

/**
 * Generate user-friendly message for Prisma errors
 *
 * Returns generic, safe messages for database errors without exposing
 * technical details like field names, table names, or Prisma codes.
 *
 * **Security Critical:** NEVER exposes:
 * - Field names (e.g., "email", "license_number")
 * - Table names (e.g., "rid_drivers", "flt_vehicles")
 * - Prisma error codes (e.g., "P2002", "P2025")
 * - SQL constraint names
 *
 * @param prismaCode - Prisma error code (e.g., "P2002")
 * @returns Generic user-friendly message
 *
 * @example
 * const message = getPrismaUserMessage("P2002");
 * // "A record with this value already exists"
 *
 * @example
 * const message = getPrismaUserMessage("P2025");
 * // "The requested resource was not found"
 */
function getPrismaUserMessage(prismaCode: string): string {
  switch (prismaCode) {
    case "P2002":
      return "A record with this value already exists";
    case "P2025":
      return "The requested resource was not found";
    case "P2003":
      return "This operation violates a data relationship constraint";
    case "P2014":
      return "A required relationship is missing";
    case "P2015":
      return "A related record could not be found";
    case "P2034":
      return "This operation conflicts with another in progress";
    default:
      // Generic fallback for unmapped Prisma errors
      return "An unexpected error occurred";
  }
}

// ============================================================================
// MAIN ERROR HANDLER (Phase 3.2B)
// ============================================================================

/**
 * Central error handler for FleetCore API routes
 *
 * Transforms any error into standardized ErrorResponse with:
 * - Consistent JSON format (REST API envelope pattern)
 * - Appropriate HTTP status code
 * - Server-side logging (Pino - structured JSON logs)
 * - Production error tracking (Sentry for 500s only)
 * - Security: technical details never exposed to client
 *
 * **Supports 2 patterns automatically:**
 * - **Pattern A (25 routes):** Full validation (Zod + ValidationError + NotFoundError)
 * - **Pattern B (4 routes):** Simplified (NotFoundError + 500 fallback)
 *
 * **Error detection via instanceof:**
 * 1. `z.ZodError` → 400 with field-level validation details
 * 2. `ValidationError` → 400 with business rule message
 * 3. `NotFoundError` → 404 with resource name
 * 4. Unknown → 500 with generic message (details logged only)
 *
 * **Logging strategy:**
 * - 400/404 errors → `logger.warn()` (client errors)
 * - 500 errors → `logger.error()` + Sentry tracking
 *
 * @param error - Any error thrown in API route
 * @param context - Request context (tenantId, userId, path, method)
 * @returns NextResponse with standardized ErrorResponse and appropriate status code
 *
 * @example
 * // Pattern A: Full validation route (POST/PATCH)
 * export async function POST(request: NextRequest) {
 *   try {
 *     const tenantId = request.headers.get('x-tenant-id')!;
 *     const userId = request.headers.get('x-user-id')!;
 *
 *     const body = await request.json();
 *     const validated = driverSchema.parse(body); // May throw ZodError
 *
 *     const result = await driverService.create(validated); // May throw ValidationError
 *     return NextResponse.json(result, { status: 201 });
 *   } catch (error) {
 *     return handleApiError(error, {
 *       path: request.nextUrl.pathname,
 *       method: 'POST',
 *       tenantId,
 *       userId,
 *     });
 *   }
 * }
 *
 * @example
 * // Pattern B: Simple GET route
 * export async function GET(
 *   request: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   try {
 *     const driver = await driverService.getDriver(params.id);
 *     if (!driver) throw new NotFoundError("Driver"); // → 404
 *
 *     return NextResponse.json(driver);
 *   } catch (error) {
 *     return handleApiError(error, {
 *       path: request.nextUrl.pathname,
 *       method: 'GET',
 *     });
 *   }
 * }
 */
export function handleApiError(
  error: unknown,
  context?: Partial<ErrorContext>
): NextResponse<ErrorResponse> {
  // 1. Enrich context with default values
  const enrichedContext: ErrorContext = {
    timestamp: new Date().toISOString(),
    request_id: context?.request_id ?? generateRequestId(),
    tenantId: context?.tenantId,
    userId: context?.userId,
    path: context?.path,
    method: context?.method,
  };

  // 2. Determine error type and format response
  let errorResponse: ErrorResponse;
  let statusCode: number;

  if (error instanceof z.ZodError) {
    // Pattern A: Zod validation error (field-level validation)
    errorResponse = formatZodError(error, enrichedContext);
    statusCode = 400;
  } else if (error instanceof ValidationError) {
    // Pattern A: Custom ValidationError (business rule violations)
    errorResponse = formatValidationError(error, enrichedContext);
    statusCode = 400;
  } else if (error instanceof NotFoundError) {
    // Pattern A & B: NotFoundError (resource not found)
    errorResponse = formatNotFoundError(error, enrichedContext);
    statusCode = 404;
  } else if (error instanceof ConflictError) {
    // Pattern A: ConflictError (duplicate/conflict)
    errorResponse = formatConflictError(error, enrichedContext);
    statusCode = 409;
  } else if (error instanceof AppError) {
    // Auth errors (UnauthorizedError 401, ForbiddenError 403) and other AppError subclasses
    errorResponse = {
      error: {
        code: (error.code ?? ErrorCode.INTERNAL_ERROR) as ErrorCode,
        message: error.message,
        path: enrichedContext.path,
        timestamp: enrichedContext.timestamp,
        request_id: enrichedContext.request_id,
      },
    };
    statusCode = error.statusCode;
  } else {
    // Pattern B fallback + Prisma errors + unknown errors
    // Phase 3.3: formatInternalError now handles Prisma errors and returns
    // dynamic ErrorCode (CONFLICT, NOT_FOUND, etc.), so we use ERROR_STATUS_MAP
    errorResponse = formatInternalError(error, enrichedContext);
    statusCode = ERROR_STATUS_MAP[errorResponse.error.code]; // Dynamic lookup
  }

  // 3. Log client errors (400, 404) with warn level
  if (statusCode < 500) {
    logger.warn(
      {
        code: errorResponse.error.code,
        message: errorResponse.error.message,
        statusCode,
        context: enrichedContext,
      },
      `API client error: ${errorResponse.error.code}`
    );
  }
  // Note: 500 errors already logged in formatInternalError()

  // 4. Return NextResponse with appropriate status code
  return NextResponse.json(errorResponse, { status: statusCode });
}
