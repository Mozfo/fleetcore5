/**
 * Validation Helper - sortBy Whitelist Protection
 *
 * Provides compile-time and runtime validation for sortBy parameters
 * to prevent SQL injection via ORDER BY clause.
 *
 * Architecture:
 * - Type-safe: NonEmptyArray enforces whitelist at compile-time
 * - Defense in depth: Runtime check catches type system bypasses
 * - Non-blocking: Fire-and-forget audit logging (~0.001ms overhead)
 * - Multi-tenant aware: Logs with tenant context when available
 *
 * @module lib/core/validation
 */

import { auditLog } from "@/lib/audit";
import { ValidationError } from "@/lib/core/errors";

/**
 * Non-empty readonly array of sortable field names
 *
 * Compile-time defense: Prevents empty whitelists at definition site
 * TypeScript enforces at least 1 element via tuple syntax [T, ...T[]]
 *
 * @example
 * const VALID: SortFieldWhitelist = ["id", "email"] as const; //  OK
 * const EMPTY: SortFieldWhitelist = [] as const; // L TypeScript error
 */
type NonEmptyArray<T> = readonly [T, ...T[]];

/**
 * Whitelist of sortable fields for an entity
 *
 * Must contain at least 1 field (enforced at compile-time).
 * Use with `as const` to preserve literal types.
 *
 * @example
 * // Driver repository whitelist
 * export const DRIVER_SORT_FIELDS: SortFieldWhitelist = [
 *   "id",
 *   "created_at",
 *   "updated_at",
 *   "email",
 *   "first_name",
 *   "last_name",
 *   "driver_status",
 *   "rating",
 * ] as const;
 */
export type SortFieldWhitelist = NonEmptyArray<string>;

/**
 * Validates that a sortBy field exists in the entity's whitelist
 *
 * **Defense in Depth Strategy:**
 * 1. **Compile-time**: SortFieldWhitelist type prevents empty arrays
 * 2. **Runtime failsafe**: Catches type system bypasses (any, assertion)
 * 3. **Audit trail**: Fire-and-forget security logging (non-blocking)
 *
 * **Performance:**
 * - Success path: < 0.001ms (string comparison only)
 * - Failure path: ~0.001ms (audit runs asynchronously, doesn't block)
 *
 * **Audit Behavior:**
 * - With tenantId: Log created in adm_audit_logs with tenant context
 * - Without tenantId: Audit skipped (line 54 lib/audit.ts) - acceptable for system calls
 *
 * @param sortBy - Field name to validate (from user input)
 * @param whitelist - Non-empty array of allowed field names for this entity
 * @param tenantId - Optional tenant ID for audit context (omit for system-level calls)
 *
 * @throws {ValidationError} If sortBy not in whitelist (HTTP 400, code: VALIDATION_ERROR)
 * @throws {Error} If whitelist empty (development-time check, indicates bug)
 *
 * @example
 * // Valid sortBy
 * validateSortBy("email", DRIVER_SORT_FIELDS, "tenant-uuid-123");
 * //  Passes, no error, no audit log
 *
 * @example
 * // Invalid sortBy (injection attempt)
 * validateSortBy("deleted_at; DROP TABLE users--", DRIVER_SORT_FIELDS, "tenant-uuid-123");
 * // L Throws ValidationError
 * //  Audit log created in adm_audit_logs with action="validation_failed"
 *
 * @example
 * // System call without tenant context
 * validateSortBy("id", SYSTEM_SORT_FIELDS);
 * //  Works, audit skipped (no tenant context)
 */
export function validateSortBy(
  sortBy: string,
  whitelist: SortFieldWhitelist,
  tenantId?: string
): void {
  // 1. Runtime failsafe - Defense against type system bypasses
  // This should never trigger if TypeScript is used correctly, but protects
  // against edge cases: `as any` casts, JavaScript interop, etc.
  if (whitelist.length === 0) {
    throw new Error(
      "SECURITY: Whitelist cannot be empty. Check SortFieldWhitelist constant definition."
    );
  }

  // 2. Validate sortBy against whitelist
  // Note: .includes() is O(n) but n is small (~15 fields max), so ~0.0005ms
  if (!whitelist.includes(sortBy)) {
    // 3. Fire-and-forget audit (non-blocking)
    // Audit runs asynchronously and never blocks the validation flow.
    // Failures are logged internally by auditLog() in dev mode (line 100-102).
    //
    // tenantId behavior:
    // - If provided: Audit log created with tenant context
    // - If undefined: Audit skipped silently (line 54 lib/audit.ts)
    //   This is acceptable for system-level calls without tenant context.
    auditLog({
      tenantId: tenantId || undefined,
      action: "validation_failed",
      entityType: "system_parameter",
      entityId: "00000000-0000-0000-0000-000000000000", // System-level UUID for validation events
      metadata: {
        attempted_field: sortBy,
        allowed_fields: whitelist, // Full whitelist logged for forensic analysis
        validation_type: "sortby_whitelist",
      },
    }).catch(() => {
      // Silently fail - audit should never break main flow
      // Error logging handled internally by auditLog() in dev mode
      // Production: Silent failure is acceptable (best-effort logging)
    });

    // 4. Throw immediately (no await - non-blocking)
    // Error message shows full whitelist for developer experience
    // (colonnes = API contract, no security risk to expose)
    throw new ValidationError(
      `Invalid sortBy field: "${sortBy}". Allowed fields: ${whitelist.join(", ")}`
    );
  }

  //  Valid sortBy - proceed with query
}
