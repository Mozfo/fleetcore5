/**
 * Custom Error Classes
 * AppError, ValidationError, NotFoundError, UnauthorizedError, etc.
 */

/**
 * Base error class with HTTP status code support
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Validation Error - 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * Not Found Error - 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * Unauthorized Error - 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/**
 * Forbidden Error - 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/**
 * Conflict Error - 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/**
 * Interface for Prisma error objects
 * Used for type-safe error handling in BaseService
 */
export interface PrismaError {
  code?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * Type guard to check if error is a Prisma error
 */
export function isPrismaError(error: unknown): error is PrismaError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as PrismaError).code === "string"
  );
}

/**
 * Assert that a value is defined (not null or undefined)
 * Throws an error if the value is null or undefined
 *
 * @param value - The value to check
 * @param errorMessage - Custom error message to throw if value is not defined
 * @returns The value with a narrowed type (non-nullable)
 *
 * @example
 * const secret = assertDefined(process.env.API_KEY, 'API_KEY is required');
 * // secret is now typed as string, not string | undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  errorMessage: string
): T {
  if (value === null || value === undefined) {
    throw new Error(errorMessage);
  }
  return value;
}
