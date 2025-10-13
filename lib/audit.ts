import { Prisma } from "@prisma/client";
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
  | "import";

export type AuditEntityType =
  | "organization"
  | "member"
  | "invitation"
  | "driver"
  | "vehicle"
  | "vehicle_assignment"
  | "vehicle_maintenance"
  | "vehicle_expense"
  | "revenue_import"
  | "payment"
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
  performedByClerkId?: string | null;
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
    // TODO: Phase 2 - Enable audit logging when adm_audit_logs table is created
    logger.info(
      {
        tenant_id: options.tenantId,
        action: options.action,
        entity_type: options.entityType,
        entity_id: options.entityId,
        performed_by: options.performedBy,
      },
      "[AUDIT] Log entry"
    );

    // await prisma.adm_audit_logs.create({
    //   data: {
    //     tenant_id: options.tenantId,
    //     action: options.action,
    //     entity_type: options.entityType,
    //     entity_id: options.entityId,
    //     snapshot: options.snapshot ?? undefined,
    //     changes: options.changes ?? undefined,
    //     performed_by: options.performedBy ?? undefined,
    //     performed_by_clerk_id: options.performedByClerkId ?? undefined,
    //     ip_address: options.ipAddress ?? undefined,
    //     user_agent: options.userAgent ?? undefined,
    //     reason: options.reason ?? undefined,
    //     metadata: options.metadata ?? undefined,
    //   },
    // });
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
