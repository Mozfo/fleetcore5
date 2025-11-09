/**
 * NotificationLogRepository
 * Repository for managing notification logs (adm_notification_logs)
 *
 * Pattern: Extends BaseRepository (has deleted_at for soft-delete)
 * Domain: ADM (Multi-tenant operational data, tenant_id NULLABLE for CRM events)
 */

import {
  PrismaClient,
  adm_notification_logs,
  notification_status,
  notification_channel,
} from "@prisma/client";
import { BaseRepository } from "@/lib/core/base.repository";
import type { SortFieldWhitelist } from "@/lib/core/validation";
import type { PaginatedResult, PaginationOptions } from "@/lib/core/types";

/**
 * Whitelist of sortable fields for adm_notification_logs table
 *
 * ✅ Included columns:
 * - Primary key: id
 * - Multi-tenant: tenant_id (nullable for CRM events)
 * - Business data: template_code, channel, status, locale_used
 * - Recipient: recipient_id, recipient_email
 * - Resend tracking: sent_at, delivered_at, opened_at, clicked_at, failed_at
 * - Timestamps: created_at, updated_at
 *
 * ❌ Excluded columns:
 * - PII: recipient_phone (potential privacy concern)
 * - JSONB: variables_data (not sortable, contains dynamic data)
 * - Large text: subject, body, error_message (performance risk)
 * - Metadata: ip_address, user_agent, session_id, request_id (not useful for sorting)
 */
export const NOTIFICATION_LOG_SORT_FIELDS = [
  "id",
  "tenant_id",
  "recipient_id",
  "recipient_email",
  "template_code",
  "channel",
  "locale_used",
  "status",
  "sent_at",
  "delivered_at",
  "opened_at",
  "clicked_at",
  "failed_at",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * Type alias from Prisma
 */
export type NotificationLog = adm_notification_logs;

/**
 * Resend webhook metadata for status updates
 */
export interface ResendWebhookMetadata {
  sent_at?: Date;
  delivered_at?: Date;
  opened_at?: Date;
  clicked_at?: Date;
  failed_at?: Date;
  error_message?: string;
  external_id?: string;
}

/**
 * NotificationLogRepository
 *
 * Manages notification logs with Resend webhook tracking:
 * - Multi-tenant logs (tenant_id NULLABLE for CRM pre-tenant events)
 * - Status lifecycle: pending → sent → delivered → opened/clicked
 * - Resend webhook tracking: sent_at, delivered_at, opened_at, clicked_at, failed_at
 * - Recipient tracking: by ID or email
 * - Template usage analytics: which templates are used most
 *
 * Key Features:
 * - Soft-delete support (BaseRepository)
 * - Resend webhook status updates
 * - Multi-tenant filtering (with null support for CRM)
 * - Status-based queries for analytics
 *
 * @example
 * ```typescript
 * const repo = new NotificationLogRepository();
 * const log = await repo.create({
 *   tenant_id: 'tenant-123',
 *   recipient_email: 'user@example.com',
 *   template_code: 'lead_confirmation',
 *   channel: 'email',
 *   locale_used: 'fr',
 *   status: 'pending'
 * }, 'system');
 * ```
 */
export class NotificationLogRepository extends BaseRepository<adm_notification_logs> {
  /**
   * Constructor with optional Prisma Client injection
   *
   * @param prismaClient - Optional PrismaClient instance for dependency injection
   *                       (useful for testing with mock or SQLite clients)
   *                       Defaults to singleton instance if not provided
   *
   * @example
   * ```typescript
   * // Production: Use singleton (default)
   * const repo = new NotificationLogRepository()
   * ```
   *
   * @example
   * ```typescript
   * // Testing: Inject test client
   * const testPrisma = new PrismaClient({ datasources: { db: { url: 'file:test.db' } } })
   * const repo = new NotificationLogRepository(testPrisma)
   * ```
   */
  constructor(prismaClient?: PrismaClient) {
    const prisma = prismaClient || new PrismaClient();
    super(prisma.adm_notification_logs, prisma);
  }

  /**
   * Get whitelist of sortable fields
   * Required by BaseRepository abstract method
   */
  protected getSortWhitelist(): SortFieldWhitelist {
    return NOTIFICATION_LOG_SORT_FIELDS;
  }

  /**
   * Enable soft-delete filtering
   * adm_notification_logs has deleted_at column
   */
  protected shouldFilterDeleted(): boolean {
    return true;
  }

  /**
   * Find logs by recipient ID
   *
   * @param recipientId - Recipient member ID (adm_members.id)
   * @param tenantId - Optional tenant ID for filtering
   * @param options - Pagination options
   * @returns Paginated list of notification logs
   *
   * @example
   * ```typescript
   * const logs = await repo.findByRecipient('member-123', 'tenant-456', { page: 1, limit: 20 });
   * // Returns all notifications sent to this member in this tenant
   * ```
   */
  async findByRecipient(
    recipientId: string,
    tenantId?: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<adm_notification_logs>> {
    const where: Record<string, unknown> = {
      recipient_id: recipientId,
    };

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    return await this.findMany(where, {
      ...options,
      sortBy: options.sortBy || "created_at",
      sortOrder: options.sortOrder || "desc",
    });
  }

  /**
   * Find logs by status
   *
   * @param status - Notification status
   * @param tenantId - Optional tenant ID for filtering
   * @param options - Pagination options
   * @returns Paginated list of notification logs
   *
   * @example
   * ```typescript
   * const failedLogs = await repo.findByStatus('failed', 'tenant-123');
   * // Returns all failed notifications for analytics or retry
   * ```
   */
  async findByStatus(
    status: notification_status,
    tenantId?: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<adm_notification_logs>> {
    const where: Record<string, unknown> = {
      status,
    };

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    return await this.findMany(where, {
      ...options,
      sortBy: options.sortBy || "created_at",
      sortOrder: options.sortOrder || "desc",
    });
  }

  /**
   * Find logs by template code
   * Useful for template usage analytics
   *
   * @param templateCode - Template code
   * @param tenantId - Optional tenant ID for filtering
   * @param options - Pagination options
   * @returns Paginated list of notification logs
   *
   * @example
   * ```typescript
   * const logs = await repo.findByTemplateCode('lead_confirmation', 'tenant-123');
   * // Returns all uses of this template for analytics
   * ```
   */
  async findByTemplateCode(
    templateCode: string,
    tenantId?: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<adm_notification_logs>> {
    const where: Record<string, unknown> = {
      template_code: templateCode,
    };

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    return await this.findMany(where, {
      ...options,
      sortBy: options.sortBy || "created_at",
      sortOrder: options.sortOrder || "desc",
    });
  }

  /**
   * Find logs by recipient email
   * Useful for CRM events (no recipient_id yet)
   *
   * @param email - Recipient email
   * @param options - Pagination options
   * @returns Paginated list of notification logs
   *
   * @example
   * ```typescript
   * const logs = await repo.findByEmail('user@example.com');
   * // Returns all notifications sent to this email (CRM + ADM)
   * ```
   */
  async findByEmail(
    email: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<adm_notification_logs>> {
    return await this.findMany(
      {
        recipient_email: email,
      },
      {
        ...options,
        sortBy: options.sortBy || "created_at",
        sortOrder: options.sortOrder || "desc",
      }
    );
  }

  /**
   * Update notification status from Resend webhook
   * Handles webhook events: email.sent, email.delivered, email.bounced, email.opened, email.clicked
   *
   * @param id - Notification log ID
   * @param status - New status
   * @param metadata - Resend webhook metadata (timestamps, error_message, external_id)
   * @returns Updated notification log
   *
   * @example
   * ```typescript
   * // Handle Resend webhook: email.delivered
   * const updated = await repo.updateStatus(logId, 'delivered', {
   *   delivered_at: new Date(),
   *   external_id: 're_abc123'
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Handle Resend webhook: email.bounced
   * const updated = await repo.updateStatus(logId, 'bounced', {
   *   failed_at: new Date(),
   *   error_message: 'Mailbox not found'
   * });
   * ```
   */
  async updateStatus(
    id: string,
    status: notification_status,
    metadata?: ResendWebhookMetadata
  ): Promise<adm_notification_logs> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date(),
    };

    // Apply webhook metadata
    if (metadata) {
      if (metadata.sent_at) updateData.sent_at = metadata.sent_at;
      if (metadata.delivered_at)
        updateData.delivered_at = metadata.delivered_at;
      if (metadata.opened_at) updateData.opened_at = metadata.opened_at;
      if (metadata.clicked_at) updateData.clicked_at = metadata.clicked_at;
      if (metadata.failed_at) updateData.failed_at = metadata.failed_at;
      if (metadata.error_message)
        updateData.error_message = metadata.error_message;
      if (metadata.external_id) updateData.external_id = metadata.external_id;
    }

    return await this.model.update({
      where: {
        id,
        deleted_at: null,
      },
      data: updateData,
    });
  }

  /**
   * Get notification statistics for a tenant
   *
   * @param tenantId - Optional tenant ID (null for CRM events)
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Statistics object with counts by status
   *
   * @example
   * ```typescript
   * const stats = await repo.getStats('tenant-123', new Date('2025-01-01'));
   * // stats => { total: 1000, sent: 950, delivered: 920, opened: 450, clicked: 120, failed: 50 }
   * ```
   */
  async getStats(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    bounced: number;
    opened: number;
    clicked: number;
    failed: number;
  }> {
    const where: Record<string, unknown> = {
      deleted_at: null,
    };

    if (tenantId !== undefined) {
      where.tenant_id = tenantId;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate)
        (where.created_at as Record<string, unknown>).gte = startDate;
      if (endDate) (where.created_at as Record<string, unknown>).lte = endDate;
    }

    const [total, pending, sent, delivered, bounced, opened, clicked, failed] =
      await Promise.all([
        this.model.count({ where }),
        this.model.count({ where: { ...where, status: "pending" } }),
        this.model.count({ where: { ...where, status: "sent" } }),
        this.model.count({ where: { ...where, status: "delivered" } }),
        this.model.count({ where: { ...where, status: "bounced" } }),
        this.model.count({ where: { ...where, status: "opened" } }),
        this.model.count({ where: { ...where, status: "clicked" } }),
        this.model.count({ where: { ...where, status: "failed" } }),
      ]);

    return {
      total,
      pending,
      sent,
      delivered,
      bounced,
      opened,
      clicked,
      failed,
    };
  }

  /**
   * Get template usage statistics
   * Returns top templates by usage count
   *
   * @param tenantId - Optional tenant ID
   * @param limit - Number of top templates to return (default: 10)
   * @returns List of templates with usage counts
   *
   * @example
   * ```typescript
   * const topTemplates = await repo.getTemplateStats('tenant-123', 5);
   * // Returns top 5 most-used templates with counts
   * ```
   */
  async getTemplateStats(
    tenantId?: string,
    limit: number = 10
  ): Promise<
    Array<{
      template_code: string;
      channel: notification_channel;
      count: number;
    }>
  > {
    const where: Record<string, unknown> = {
      deleted_at: null,
    };

    if (tenantId !== undefined) {
      where.tenant_id = tenantId;
    }

    const results = await this.model.groupBy({
      by: ["template_code", "channel"],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: limit,
    });

    return results.map(
      (r: {
        template_code: string;
        channel: notification_channel;
        _count: { id: number };
      }) => ({
        template_code: r.template_code,
        channel: r.channel,
        count: r._count.id,
      })
    );
  }

  /**
   * Find logs by external ID (Resend message ID)
   * Useful for webhook correlation
   *
   * @param externalId - Resend message ID (e.g., 're_abc123')
   * @returns Notification log or null
   *
   * @example
   * ```typescript
   * const log = await repo.findByExternalId('re_abc123');
   * if (log) {
   *   // Update status from Resend webhook
   *   await repo.updateStatus(log.id, 'delivered', { delivered_at: new Date() });
   * }
   * ```
   */
  async findByExternalId(
    externalId: string
  ): Promise<adm_notification_logs | null> {
    return await this.model.findFirst({
      where: {
        external_id: externalId,
        deleted_at: null,
      },
    });
  }
}
