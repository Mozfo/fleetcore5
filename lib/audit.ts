import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { logger } from "./logger";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "login"
  | "logout"
  | "invite"
  | "accept_invite"
  | "export"
  | "import"
  | "validation_failed" // Security: sortBy validation failures and other input validation attempts
  | "ip_blocked"; // Security: IP whitelist access denied (system-level, tenantId: null)

export type AuditEntityType =
  // Admin entities
  | "tenant"
  | "organization"
  | "member"
  | "invitation"
  | "role"
  // CRM entities
  | "lead"
  | "opportunity"
  | "contract"
  // Fleet entities
  | "driver"
  | "vehicle"
  | "vehicle_assignment"
  | "vehicle_maintenance"
  | "vehicle_expense"
  // Finance entities
  | "revenue_import"
  | "payment"
  // System entities
  | "system_parameter"
  | "document"
  | "custom_field";

export interface AuditLogOptions {
  tenantId?: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  snapshot?: Prisma.InputJsonValue | null;
  changes?: Prisma.InputJsonValue | null;
  performedBy?: string | null;
  performedByAuthId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

/**
 * Create an audit log entry
 * Used for compliance (RGPD), security, and debugging
 */
export async function auditLog(options: AuditLogOptions): Promise<void> {
  try {
    // Allow null tenantId for system-level security events (ip_blocked, etc.)
    // Skip only if undefined (not provided at all)
    if (options.tenantId === undefined) {
      logger.warn(
        {
          action: options.action,
          entityType: options.entityType,
          entityId: options.entityId,
        },
        "[AUDIT] Skipping audit log - tenantId not provided"
      );
      return;
    }

    // Log to console in development
    logger.info(
      {
        tenant_id: options.tenantId,
        action: options.action,
        entity: options.entityType,
        entity_id: options.entityId,
        performed_by: options.performedBy,
      },
      "[AUDIT] Log entry"
    );

    // Insert audit log to database
    // Note: tenant_id is NOT NULL in schema but we skip validation above for null
    // This means system events (tenantId: null) will fail at DB level
    // We need to use a system tenant ID instead
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: options.tenantId ?? "00000000-0000-0000-0000-000000000000", // System tenant for null
        action: options.action,
        entity: options.entityType, // Corrected: entity (not entity_type)
        entity_id: options.entityId,
        member_id: options.performedBy ?? undefined, // Corrected: member_id (not performed_by)
        ip_address: options.ipAddress ?? undefined,
        user_agent: options.userAgent ?? undefined,
        changes:
          buildChangesJSON({
            changes: options.changes,
            snapshot: options.snapshot,
            reason: options.reason,
            metadata: options.metadata,
            performedByAuthId: options.performedByAuthId,
          }) ?? undefined,
      },
    });
  } catch (error) {
    // Audit should never break main flow - silently fail
    if (process.env.NODE_ENV === "development") {
      logger.error({ error }, "[AUDIT] Failed to log audit event");
    }
  }
}

/**
 * Serialize any object for audit logging
 * Converts Dates to ISO strings and removes undefined values
 */
export function serializeForAudit<T>(obj: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(obj)) as Prisma.InputJsonValue;
}

/**
 * Helper to capture changes between old and new objects
 */
export function captureChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};

  for (const key in newData) {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        old: oldData[key],
        new: newData[key],
      };
    }
  }

  return changes;
}

/**
 * Build JSONB structure for adm_audit_logs.changes column
 *
 * Combines domain changes with audit metadata using _audit_* prefix
 * to avoid conflicts with business data.
 *
 * @param options - Subset of audit log options containing JSONB fields
 * @returns JSONB object ready for Prisma insertion, or null if no data
 *
 * @example
 * // Update with changes and reason
 * buildChangesJSON({
 *   changes: { name: { old: "John", new: "Jane" } },
 *   reason: "User request"
 * })
 * // Returns: { name: { old: "John", new: "Jane" }, _audit_reason: "User request" }
 *
 * @example
 * // Create with snapshot and metadata
 * buildChangesJSON({
 *   snapshot: { id: "123", name: "John" },
 *   metadata: { source: "api" }
 * })
 * // Returns: { _audit_snapshot: {...}, _audit_metadata: {...} }
 */
export function buildChangesJSON(
  options: Pick<
    AuditLogOptions,
    "changes" | "snapshot" | "reason" | "metadata" | "performedByAuthId"
  >
): Prisma.InputJsonValue | null {
  const result: Record<string, unknown> = {};

  // 1. Add domain changes first (if present)
  if (
    options.changes !== null &&
    options.changes !== undefined &&
    typeof options.changes === "object" &&
    !Array.isArray(options.changes)
  ) {
    Object.assign(result, options.changes as Record<string, unknown>);
  }

  // 2. Add snapshot with _audit_ prefix
  if (options.snapshot !== null && options.snapshot !== undefined) {
    result._audit_snapshot = options.snapshot;
  }

  // 3. Add reason with _audit_ prefix
  if (options.reason !== null && options.reason !== undefined) {
    result._audit_reason = options.reason;
  }

  // 4. Add metadata with _audit_ prefix
  if (options.metadata !== null && options.metadata !== undefined) {
    result._audit_metadata = options.metadata;
  }

  // 5. Add performedByAuthId with _audit_ prefix
  if (
    options.performedByAuthId !== null &&
    options.performedByAuthId !== undefined
  ) {
    result._audit_auth_id = options.performedByAuthId;
  }

  // 6. Return null if no data (column is nullable)
  return Object.keys(result).length > 0
    ? (result as Prisma.InputJsonValue)
    : null;
}

/**
 * Extract IP address from request headers
 */
export function getIpFromRequest(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0] ||
    headers.get("x-real-ip") ||
    null
  );
}

/**
 * Extract User Agent from request headers
 */
export function getUserAgentFromRequest(headers: Headers): string | null {
  return headers.get("user-agent") || null;
}
