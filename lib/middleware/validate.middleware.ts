/**
 * Validation Middleware - Zod Schema Validation Helpers
 *
 * Provides helper functions for validating request data against Zod schemas.
 * Pattern A: Helper functions called within route handlers (not wrapper HOCs).
 *
 * Key features:
 * - Generic validate() function for any data + schema
 * - validateBody() helper for Next.js request bodies
 * - validateQuery() helper for URL query parameters
 * - Transforms ZodError into user-friendly ValidationError
 * - Type-safe return values using schema inference
 *
 * @module lib/middleware/validate.middleware
 */

import type { ZodSchema, ZodError as _ZodError } from "zod";
import { ValidationError } from "@/lib/core/errors";
import type { NextRequest } from "next/server";

/**
 * Validation error detail
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

/**
 * Validate data against a Zod schema
 *
 * Generic validation function that parses data with a Zod schema and returns
 * type-safe validated data. Transforms Zod errors into user-friendly ValidationError.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate (can be unknown)
 *
 * @returns Validated and typed data (inferred from schema)
 *
 * @throws {ValidationError} If validation fails with detailed field-level errors
 *
 * @example
 * // In API route handler
 * export async function POST(req: NextRequest) {
 *   const body = await req.json();
 *   const validatedData = await validate(LeadCreateSchema, body);
 *
 *   // validatedData is type-safe (LeadCreateInput)
 *   const lead = await leadService.create(validatedData, tenantId, userId);
 *   return NextResponse.json(lead);
 * }
 */
export async function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    const result = schema.safeParse(data);

    if (!result.success) {
      // Transform ZodError into ValidationError with user-friendly details
      const errors: ValidationErrorDetail[] = result.error.issues.map(
        (err) => ({
          field: err.path.join(".") || "unknown",
          message: err.message,
          code: err.code,
        })
      );

      const errorMessage = `Validation failed. Please check the following fields: ${errors.map((e) => `${e.field} (${e.message})`).join(", ")}`;
      throw new ValidationError(errorMessage);
    }

    return result.data;
  } catch (error) {
    // Re-throw ValidationError as-is
    if (error instanceof ValidationError) {
      throw error;
    }

    // Handle unexpected errors
    const errorMsg =
      error instanceof Error ? error.message : "Unknown validation error";
    throw new ValidationError(`Invalid data format: ${errorMsg}`);
  }
}

/**
 * Validate Next.js request body
 *
 * Helper function that extracts JSON body from Next.js request and validates it.
 * Automatically handles JSON parsing and provides type-safe return value.
 *
 * @param req - Next.js request object
 * @param schema - Zod schema to validate body against
 *
 * @returns Validated and typed body data
 *
 * @throws {ValidationError} If body is invalid JSON or fails schema validation
 *
 * @example
 * export async function POST(req: NextRequest) {
 *   const data = await validateBody(req, LeadCreateSchema);
 *
 *   // data is type-safe (LeadCreateInput)
 *   const lead = await leadService.create(data, tenantId, userId);
 *   return NextResponse.json(lead);
 * }
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown;

  try {
    body = await req.json();
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to parse JSON body";
    throw new ValidationError(`Invalid JSON in request body: ${errorMsg}`);
  }

  return validate(schema, body);
}

/**
 * Validate Next.js query parameters
 *
 * Helper function that extracts query parameters from Next.js request URL and validates them.
 * Automatically converts URLSearchParams to object and provides type-safe return value.
 *
 * Perfect for GET endpoints with filtering, pagination, and sorting.
 *
 * @param req - Next.js request object
 * @param schema - Zod schema to validate query params against (use .coerce for numbers)
 *
 * @returns Validated and typed query parameters
 *
 * @throws {ValidationError} If query params fail schema validation
 *
 * @example
 * export async function GET(req: NextRequest) {
 *   const filters = await validateQuery(req, LeadQuerySchema);
 *
 *   // filters is type-safe (LeadQueryInput)
 *   // filters.page is number (coerced from string)
 *   // filters.sortBy has proper enum type
 *   const leads = await leadService.findAll(filters, tenantId);
 *   return NextResponse.json(leads);
 * }
 */
export async function validateQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  // Convert URLSearchParams to plain object
  const query: Record<string, string> = {};

  req.nextUrl.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return validate(schema, query);
}

/**
 * Validate route params (e.g., /api/leads/[id])
 *
 * Helper function for validating dynamic route parameters.
 * Useful for validating UUIDs, numeric IDs, or other param formats.
 *
 * @param params - Route params object from Next.js
 * @param schema - Zod schema to validate params against
 *
 * @returns Validated and typed params
 *
 * @throws {ValidationError} If params fail schema validation
 *
 * @example
 * // For route: /api/leads/[id]
 * const ParamsSchema = z.object({
 *   id: z.string().uuid()
 * });
 *
 * export async function GET(
 *   req: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   const { id } = await validateParams(params, ParamsSchema);
 *
 *   const lead = await leadService.findById(id, tenantId);
 *   return NextResponse.json(lead);
 * }
 */
export async function validateParams<T>(
  params: unknown,
  schema: ZodSchema<T>
): Promise<T> {
  return validate(schema, params);
}
