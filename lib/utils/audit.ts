/**
 * Audit Trail Utility
 *
 * Provides helper functions for serializing data for audit logs.
 * Handles date conversion, BigInt serialization, and sensitive field exclusion.
 */

/**
 * Type for objects with before/after states (update operations)
 */
interface BeforeAfter {
  before?: unknown;
  after?: unknown;
}

/**
 * Type for cleaned audit data (primitive values)
 */
type CleanedValue = string | number | boolean | null;

/**
 * Interface for cleaned audit data (supports recursive nesting)
 */
interface CleanedData {
  [key: string]: CleanedValue | CleanedData | CleanedData[];
}

/**
 * Serialize data for audit trail
 *
 * Converts dates to ISO strings, removes sensitive/metadata fields, handles special types.
 * Supports both single objects and { before, after } change objects.
 *
 * @param data - The data to serialize (can be object or { before, after })
 * @returns JSON string suitable for storage in audit logs
 */
export function serializeForAudit(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "{}";
  }

  // Handle { before, after } objects for update operations
  const beforeAfter = data as BeforeAfter;
  if (beforeAfter.before !== undefined || beforeAfter.after !== undefined) {
    return JSON.stringify(
      {
        before: cleanForAudit(beforeAfter.before),
        after: cleanForAudit(beforeAfter.after),
      },
      null,
      2
    );
  }

  // Handle single object (create operations)
  return JSON.stringify(cleanForAudit(data), null, 2);
}

/**
 * Clean an object for audit logging
 *
 * - Converts Date objects to ISO strings
 * - Converts BigInt to strings
 * - Excludes metadata, created_at, updated_at fields
 * - Recursively cleans nested objects and arrays
 *
 * @param obj - The object to clean
 * @returns Cleaned object ready for JSON serialization
 */
function cleanForAudit(
  obj: unknown
): CleanedData | CleanedData[] | string | number | boolean | null {
  if (!obj || typeof obj !== "object") {
    if (
      typeof obj === "string" ||
      typeof obj === "number" ||
      typeof obj === "boolean"
    ) {
      return obj;
    }
    return null;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForAudit(item)) as CleanedData[];
  }

  const cleaned: CleanedData = {};

  // Fields to exclude from audit logs
  const excludeFields = ["metadata", "created_at", "updated_at", "deleted_at"];

  for (const [key, value] of Object.entries(obj)) {
    // Skip excluded fields
    if (excludeFields.includes(key)) {
      continue;
    }

    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      cleaned[key] = value.toISOString();
    }
    // Convert BigInt to strings (common in Prisma for large integers)
    else if (typeof value === "bigint") {
      cleaned[key] = value.toString();
    }
    // Recursively clean nested objects
    else if (typeof value === "object" && !Array.isArray(value)) {
      const nestedCleaned = cleanForAudit(value);
      if (nestedCleaned && typeof nestedCleaned === "object") {
        cleaned[key] = nestedCleaned as CleanedData;
      }
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      cleaned[key] = cleanForAudit(value) as CleanedData[];
    }
    // Keep primitive values as-is
    else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
