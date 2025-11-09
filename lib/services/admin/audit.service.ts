/**
 * Audit Service
 *
 * Centralized audit log management with querying, diff calculation,
 * and suspicious behavior detection for RGPD/SOC2 compliance.
 *
 * @module lib/services/admin/audit.service
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  auditLog as _auditLog,
  serializeForAudit,
  type AuditAction,
  type AuditEntityType,
} from "@/lib/audit";
import type { audit_severity, audit_category } from "@prisma/client";

/**
 * Parameters for logging an audit action
 */
export interface LogActionParams {
  tenantId: string;
  memberId: string | null; // null for system actions
  entity: AuditEntityType;
  action: AuditAction;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  reason?: string;
}

/**
 * Filters for querying audit logs
 */
export interface AuditQueryFilters {
  tenantId: string;
  entity?: AuditEntityType;
  action?: AuditAction;
  memberId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Paginated audit log query result
 */
export interface AuditQueryResult {
  logs: Array<{
    id: string;
    tenant_id: string;
    member_id: string | null;
    entity: string;
    entity_id: string;
    action: string;
    changes: Prisma.JsonValue | null;
    ip_address: string | null;
    user_agent: string | null;
    timestamp: Date;
    severity: audit_severity;
    category: audit_category;
    session_id: string | null;
    old_values: Prisma.JsonValue | null;
    new_values: Prisma.JsonValue | null;
    retention_until: Date | null;
    tags: string[];
  }>;
  total: number;
}

/**
 * Suspicious behavior detection result
 */
export interface SuspiciousBehaviorResult {
  isSuspicious: boolean;
  reason?: string;
  metrics: {
    readCount: number;
    writeCount: number;
    deleteCount: number;
  };
}

/**
 * Retention policy durations in days
 */
const RETENTION_POLICIES: Record<audit_category, number> = {
  security: 730, // 2 years
  financial: 3650, // 10 years
  compliance: 1095, // 3 years
  operational: 365, // 1 year
};

/**
 * Audit Service
 *
 * Provides centralized audit log management with automatic severity,
 * category, and retention policy determination based on entity type
 * and action.
 *
 * @example
 * ```typescript
 * const auditService = new AuditService();
 *
 * // Log a lead creation
 * await auditService.logAction({
 *   tenantId: 'tenant-123',
 *   memberId: 'member-456',
 *   entity: 'lead',
 *   action: 'create',
 *   entityId: 'lead-789',
 *   newValues: { email: 'john@acme.com', fleet_size: 25 }
 * });
 *
 * // Query audit logs
 * const result = await auditService.query({
 *   tenantId: 'tenant-123',
 *   entity: 'lead',
 *   limit: 20,
 *   offset: 0
 * });
 * ```
 */
export class AuditService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Calculate differences between old and new object values
   *
   * Performs shallow comparison and returns only fields that changed.
   *
   * @param oldValues - Original object state
   * @param newValues - Updated object state
   * @returns Object with changed fields in format { field: { old: X, new: Y } }
   *
   * @example
   * ```typescript
   * const diff = auditService.getDiff(
   *   { name: 'John', age: 30, city: 'Paris' },
   *   { name: 'John', age: 31, city: 'London' }
   * );
   * // Returns: { age: { old: 30, new: 31 }, city: { old: 'Paris', new: 'London' } }
   * ```
   */
  getDiff(
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
  ): Record<string, { old: unknown; new: unknown }> {
    const diff: Record<string, { old: unknown; new: unknown }> = {};

    // Check all keys in newValues
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        diff[key] = {
          old: oldValues[key],
          new: newValues[key],
        };
      }
    }

    // Check for removed keys (present in old but not in new)
    for (const key in oldValues) {
      if (!(key in newValues) && oldValues[key] !== undefined) {
        diff[key] = {
          old: oldValues[key],
          new: undefined,
        };
      }
    }

    return diff;
  }

  /**
   * Determine audit log severity based on action
   *
   * @param action - Audit action type
   * @returns Severity level (info, warning, error, critical)
   */
  private determineSeverity(action: AuditAction): audit_severity {
    const severityMap: Record<AuditAction, audit_severity> = {
      create: "info",
      update: "info",
      delete: "warning",
      restore: "info",
      login: "info",
      logout: "info",
      invite: "info",
      accept_invite: "info",
      export: "warning",
      import: "warning",
      validation_failed: "warning",
      ip_blocked: "critical",
    };

    return severityMap[action] || "info";
  }

  /**
   * Determine audit log category based on entity type
   *
   * @param entity - Entity type
   * @returns Category (security, financial, compliance, operational)
   */
  private determineCategory(entity: AuditEntityType): audit_category {
    const categoryMap: Partial<Record<AuditEntityType, audit_category>> = {
      // Admin entities - security
      tenant: "security",
      organization: "security",
      member: "security",
      role: "security",
      invitation: "security",
      // CRM entities - operational
      lead: "operational",
      opportunity: "operational",
      contract: "financial",
      // Fleet entities - operational
      driver: "operational",
      vehicle: "operational",
      vehicle_assignment: "operational",
      vehicle_maintenance: "operational",
      vehicle_expense: "financial",
      // Finance entities - financial
      revenue_import: "financial",
      payment: "financial",
      // System entities - compliance
      system_parameter: "compliance",
      document: "compliance",
      custom_field: "operational",
    };

    return categoryMap[entity] || "operational";
  }

  /**
   * Calculate retention expiry date based on category
   *
   * @param category - Audit log category
   * @returns Expiry date based on retention policy
   */
  private calculateRetentionUntil(category: audit_category): Date {
    const daysToRetain = RETENTION_POLICIES[category];
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + daysToRetain);
    return retentionDate;
  }

  /**
   * Log an audit action with automatic severity, category, and retention
   *
   * Creates an audit log entry in adm_audit_logs with automatic determination
   * of severity (based on action), category (based on entity), and retention
   * policy (based on category).
   *
   * @param params - Audit log parameters
   *
   * @example
   * ```typescript
   * // Log a lead update with diff
   * await auditService.logAction({
   *   tenantId: 'tenant-123',
   *   memberId: 'member-456',
   *   entity: 'lead',
   *   action: 'update',
   *   entityId: 'lead-789',
   *   oldValues: { fleet_size: 25, status: 'new' },
   *   newValues: { fleet_size: 30, status: 'qualified' },
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...',
   *   sessionId: 'session-abc',
   *   reason: 'Lead qualification completed'
   * });
   * ```
   */
  async logAction(params: LogActionParams): Promise<void> {
    const {
      tenantId,
      memberId,
      entity,
      action,
      entityId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      sessionId,
      reason,
    } = params;

    // Determine automatic fields
    const severity = this.determineSeverity(action);
    const category = this.determineCategory(entity);
    const retentionUntil = this.calculateRetentionUntil(category);

    // Calculate diff if both old and new values provided
    const changes =
      oldValues && newValues ? this.getDiff(oldValues, newValues) : undefined;

    // Create audit log
    await this.prisma.adm_audit_logs.create({
      data: {
        tenant_id: tenantId,
        member_id: memberId,
        entity: entity,
        entity_id: entityId,
        action: action,
        changes: changes ? serializeForAudit(changes) : undefined,
        old_values: oldValues ? serializeForAudit(oldValues) : undefined,
        new_values: newValues ? serializeForAudit(newValues) : undefined,
        ip_address: ipAddress || undefined,
        user_agent: userAgent || undefined,
        session_id: sessionId || undefined,
        severity: severity,
        category: category,
        retention_until: retentionUntil,
        tags: reason ? [reason] : [],
      },
    });
  }

  /**
   * Query audit logs with filters and pagination
   *
   * Always filters by tenantId for multi-tenant isolation.
   * Returns paginated results with total count.
   *
   * @param filters - Query filters
   * @returns Paginated audit logs with total count
   *
   * @example
   * ```typescript
   * // Query all lead actions in the last 30 days
   * const result = await auditService.query({
   *   tenantId: 'tenant-123',
   *   entity: 'lead',
   *   dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
   *   limit: 50,
   *   offset: 0
   * });
   *
   * // Total logs found: result.total
   * // Individual logs: result.logs
   * ```
   */
  async query(filters: AuditQueryFilters): Promise<AuditQueryResult> {
    const {
      tenantId,
      entity,
      action,
      memberId,
      dateFrom,
      dateTo,
      limit = 20,
      offset = 0,
    } = filters;

    // Build where clause
    const where: Prisma.adm_audit_logsWhereInput = {
      tenant_id: tenantId, // CRITICAL: Always filter by tenant
    };

    if (entity) {
      where.entity = entity;
    }

    if (action) {
      where.action = action;
    }

    if (memberId) {
      where.member_id = memberId;
    }

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        where.timestamp.gte = dateFrom;
      }
      if (dateTo) {
        where.timestamp.lte = dateTo;
      }
    }

    // Execute query with pagination
    const [logs, total] = await Promise.all([
      this.prisma.adm_audit_logs.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.adm_audit_logs.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Detect suspicious behavior patterns
   *
   * Analyzes audit logs for a specific member within a time window
   * and detects suspicious patterns such as:
   * - Excessive read operations (data scraping)
   * - Excessive write operations (bulk manipulation)
   * - Excessive delete operations (destructive behavior)
   *
   * @param params - Detection parameters
   * @returns Suspicious behavior detection result
   *
   * @example
   * ```typescript
   * // Check if member has suspicious behavior in last 5 minutes
   * const result = await auditService.detectSuspiciousBehavior({
   *   tenantId: 'tenant-123',
   *   memberId: 'member-456',
   *   timeWindowMinutes: 5
   * });
   *
   * if (result.isSuspicious) {
   *   // Alert: result.reason
   *   // Metrics: result.metrics
   *   // Trigger security notification
   * }
   * ```
   */
  async detectSuspiciousBehavior(params: {
    tenantId: string;
    memberId: string;
    timeWindowMinutes?: number;
  }): Promise<SuspiciousBehaviorResult> {
    const { tenantId, memberId, timeWindowMinutes = 5 } = params;

    // Calculate time window
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - timeWindowMinutes);

    // Query logs in time window
    const logs = await this.prisma.adm_audit_logs.findMany({
      where: {
        tenant_id: tenantId,
        member_id: memberId,
        timestamp: {
          gte: windowStart,
        },
      },
      select: {
        action: true,
      },
    });

    // Count by action type
    let readCount = 0;
    let writeCount = 0;
    let deleteCount = 0;

    for (const log of logs) {
      // Reads: validation_failed (query attempts)
      if (log.action === "validation_failed") {
        readCount++;
      }
      // Writes: create, update, import
      else if (
        log.action === "create" ||
        log.action === "update" ||
        log.action === "import"
      ) {
        writeCount++;
      }
      // Deletes: delete
      else if (log.action === "delete") {
        deleteCount++;
      }
    }

    const metrics = { readCount, writeCount, deleteCount };

    // Apply heuristics
    const thresholds = {
      maxReads: 100,
      maxWrites: 50,
      maxDeletes: 10,
    };

    if (readCount > thresholds.maxReads) {
      return {
        isSuspicious: true,
        reason: `Excessive read operations (${readCount} reads in ${timeWindowMinutes} minutes) - possible data scraping`,
        metrics,
      };
    }

    if (writeCount > thresholds.maxWrites) {
      return {
        isSuspicious: true,
        reason: `Excessive write operations (${writeCount} writes in ${timeWindowMinutes} minutes) - possible bulk manipulation`,
        metrics,
      };
    }

    if (deleteCount > thresholds.maxDeletes) {
      return {
        isSuspicious: true,
        reason: `Excessive delete operations (${deleteCount} deletes in ${timeWindowMinutes} minutes) - possible destructive behavior`,
        metrics,
      };
    }

    // No suspicious behavior detected
    return {
      isSuspicious: false,
      metrics,
    };
  }
}
