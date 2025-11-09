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
 * Database Error - 500 Internal Server Error
 *
 * Wraps database-level errors (Prisma errors, connection failures, query timeouts, etc.)
 * Stores the original error for debugging while providing a consistent error interface.
 *
 * @example
 * ```typescript
 * // Wrap Prisma error
 * try {
 *   await prisma.user.create({ data: invalidData })
 * } catch (error) {
 *   throw new DatabaseError('Failed to create user', error)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Handle in BaseService.handleError()
 * if (isPrismaError(error)) {
 *   throw new DatabaseError(`Database error in ${context}`, error)
 * }
 * ```
 */
export class DatabaseError extends AppError {
  /**
   * @param message - Human-readable error message
   * @param originalError - Original error object for debugging (optional)
   */
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(message, 500, "DATABASE_ERROR");
    this.name = "DatabaseError";
  }
}

/**
 * Business Rule Error - 422 Unprocessable Entity
 *
 * Thrown when a business logic validation fails (not data format validation).
 * Use ValidationError (400) for input format issues.
 * Use BusinessRuleError (422) for domain logic violations.
 *
 * @example
 * ```typescript
 * // Cannot delete driver with active trips
 * const activeTrips = await driverService.getActiveTrips(driverId)
 * if (activeTrips.length > 0) {
 *   throw new BusinessRuleError(
 *     'Cannot delete driver with active trips',
 *     'driver_has_active_trips',
 *     { driverId, activeTripCount: activeTrips.length }
 *   )
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Insufficient balance for withdrawal
 * if (account.balance < withdrawalAmount) {
 *   throw new BusinessRuleError(
 *     'Insufficient balance',
 *     'minimum_balance_required',
 *     {
 *       currentBalance: account.balance,
 *       requested: withdrawalAmount,
 *       minimumRequired: account.minimumBalance
 *     }
 *   )
 * }
 * ```
 */
export class BusinessRuleError extends AppError {
  /**
   * @param message - Human-readable error message
   * @param rule - Rule identifier (e.g., 'driver_has_active_trips')
   * @param details - Additional context about the violation (optional)
   */
  constructor(
    message: string,
    public rule: string,
    public details?: Record<string, unknown>
  ) {
    super(message, 422, "BUSINESS_RULE_VIOLATION");
    this.name = "BusinessRuleError";
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
