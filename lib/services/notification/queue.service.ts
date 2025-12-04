/**
 * NotificationQueueService
 * Transactional Outbox Pattern for reliable notification delivery
 *
 * Created: Session #29 (2025-11-28)
 * Purpose: Prevent accidental loss of notifications (Session #27 incident)
 *
 * Pattern: All notifications go through queue → worker processes → NotificationService sends
 * Benefits:
 * - Transactional: Queue insert in same DB transaction as business logic
 * - Reliable: Retries with exponential backoff
 * - Auditable: Full history in adm_notification_queue
 * - Decoupled: API routes don't directly send emails
 */

import {
  PrismaClient,
  Prisma,
  notification_channel,
  queue_status,
} from "@prisma/client";
import { BaseService } from "@/lib/core/base.service";
import { NotificationService } from "./notification.service";
import { logger } from "@/lib/logger";
import type { AuditEntityType } from "@/lib/audit";

/**
 * Parameters for queueNotification()
 */
export interface QueueNotificationParams {
  // Routing
  channel?: notification_channel;
  templateCode: string;
  locale?: string;

  // Recipient (at least one required)
  recipientEmail?: string;
  recipientPhone?: string;
  recipientUserId?: string;

  // Content
  variables: Record<string, unknown>;

  // Context (optional)
  leadId?: string;
  memberId?: string;
  tenantId?: string;
  countryCode?: string;

  // Idempotency (optional - prevents duplicates)
  idempotencyKey?: string;

  // Dev mode: process immediately instead of waiting for cron
  // Default: true in development, false in production
  processImmediately?: boolean;
}

/**
 * Result from queueNotification()
 */
export interface QueueResult {
  success: boolean;
  queueId?: string;
  error?: string;
}

/**
 * Result from processQueue()
 */
export interface ProcessQueueResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ queueId: string; error: string }>;
}

/**
 * NotificationQueueService
 *
 * Use this service instead of NotificationService.sendEmail() directly.
 * This ensures all notifications go through the queue for reliability.
 *
 * @example
 * ```typescript
 * // In API route (e.g., demo-leads/route.ts)
 * const queueService = new NotificationQueueService(db);
 * await queueService.queueNotification({
 *   templateCode: 'lead_confirmation',
 *   recipientEmail: lead.email,
 *   variables: { first_name: lead.first_name },
 *   leadId: lead.id,
 *   countryCode: lead.country_code,
 *   idempotencyKey: `lead_${lead.id}_confirmation`
 * });
 * // Email is queued - worker will send it
 * ```
 */
export class NotificationQueueService extends BaseService {
  private notificationService: NotificationService;

  constructor(prismaClient?: PrismaClient) {
    super(prismaClient);
    this.notificationService = new NotificationService(this.prisma);
  }

  protected getEntityType(): AuditEntityType {
    return "notification" as AuditEntityType;
  }

  /**
   * Queue a notification for later processing
   * This should be called within the same transaction as your business logic
   *
   * @param params - Notification parameters
   * @returns Queue result with ID
   *
   * @example
   * ```typescript
   * // Idempotent - safe to call multiple times
   * const result = await queueService.queueNotification({
   *   templateCode: 'lead_confirmation',
   *   recipientEmail: 'user@example.com',
   *   variables: { first_name: 'John' },
   *   idempotencyKey: 'lead_123_confirmation' // Prevents duplicates
   * });
   * ```
   */
  async queueNotification(
    params: QueueNotificationParams
  ): Promise<QueueResult> {
    try {
      // Validate recipient
      if (
        !params.recipientEmail &&
        !params.recipientPhone &&
        !params.recipientUserId
      ) {
        return {
          success: false,
          error: "At least one recipient (email, phone, or userId) is required",
        };
      }

      // Check idempotency (prevent duplicates)
      if (params.idempotencyKey) {
        const existing = await this.prisma.adm_notification_queue.findUnique({
          where: { idempotency_key: params.idempotencyKey },
          select: { id: true, status: true },
        });

        if (existing) {
          logger.info(
            { idempotencyKey: params.idempotencyKey, existingId: existing.id },
            "Duplicate notification prevented by idempotency key"
          );
          return {
            success: true,
            queueId: existing.id,
          };
        }
      }

      // Insert into queue
      const queued = await this.prisma.adm_notification_queue.create({
        data: {
          channel: params.channel || "email",
          template_code: params.templateCode,
          locale: params.locale || "en",
          recipient_email: params.recipientEmail,
          recipient_phone: params.recipientPhone,
          recipient_user_id: params.recipientUserId,
          variables: params.variables as Prisma.JsonObject,
          lead_id: params.leadId,
          member_id: params.memberId,
          tenant_id: params.tenantId,
          country_code: params.countryCode,
          status: "pending",
          attempts: 0,
          max_attempts: 3,
          idempotency_key: params.idempotencyKey,
        },
      });

      logger.info(
        {
          queueId: queued.id,
          templateCode: params.templateCode,
          recipientEmail: params.recipientEmail,
        },
        "Notification queued successfully"
      );

      // In development, process immediately (no need to wait for cron)
      const shouldProcessImmediately =
        params.processImmediately ?? process.env.NODE_ENV === "development";

      if (shouldProcessImmediately) {
        logger.info({ queueId: queued.id }, "Dev mode: processing immediately");
        await this.processOne(queued.id);
      }

      return {
        success: true,
        queueId: queued.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        { error: errorMessage, params },
        "Failed to queue notification"
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Process pending notifications in the queue
   * This should be called by a cron worker (e.g., every minute)
   *
   * @param batchSize - Number of notifications to process (default: 10)
   * @returns Processing results
   *
   * @example
   * ```typescript
   * // In cron worker endpoint
   * const result = await queueService.processQueue(10);
   * // result.processed => total processed
   * // result.succeeded => successfully sent
   * // result.failed => failed to send
   * ```
   */
  async processQueue(batchSize: number = 10): Promise<ProcessQueueResult> {
    const result: ProcessQueueResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Fetch pending notifications that are ready to process
      const pendingNotifications =
        await this.prisma.adm_notification_queue.findMany({
          where: {
            status: { in: ["pending", "failed"] },
            deleted_at: null,
            OR: [
              { next_retry_at: null },
              { next_retry_at: { lte: new Date() } },
            ],
            attempts: {
              lt: this.prisma.adm_notification_queue.fields.max_attempts,
            },
          },
          orderBy: { created_at: "asc" },
          take: batchSize,
        });

      for (const notification of pendingNotifications) {
        result.processed++;

        try {
          // Mark as processing
          await this.prisma.adm_notification_queue.update({
            where: { id: notification.id },
            data: {
              status: "processing",
              attempts: { increment: 1 },
            },
          });

          // Send via NotificationService
          if (
            notification.channel === "email" &&
            notification.recipient_email
          ) {
            const sendResult = await this.notificationService.sendEmail({
              recipientEmail: notification.recipient_email,
              templateCode: notification.template_code,
              variables: notification.variables as Record<string, unknown>,
              locale: notification.locale,
              leadId: notification.lead_id || undefined,
              tenantId: notification.tenant_id || undefined,
              countryCode: notification.country_code || undefined,
            });

            if (sendResult.success) {
              // Mark as sent
              await this.prisma.adm_notification_queue.update({
                where: { id: notification.id },
                data: {
                  status: "sent",
                  processed_at: new Date(),
                  last_error: null,
                },
              });
              result.succeeded++;

              logger.info(
                {
                  queueId: notification.id,
                  templateCode: notification.template_code,
                },
                "Notification sent successfully"
              );
            } else {
              throw new Error(
                sendResult.error || "Unknown error sending email"
              );
            }
          } else {
            // Additional channels (SMS, Slack, Webhook, Push) - Roadmap
            throw new Error(
              `Channel ${notification.channel} not yet implemented`
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          result.failed++;
          result.errors.push({ queueId: notification.id, error: errorMessage });

          // Calculate next retry with exponential backoff: 2^attempts minutes
          const nextRetry = new Date();
          nextRetry.setMinutes(
            nextRetry.getMinutes() + Math.pow(2, notification.attempts + 1)
          );

          // Check if max attempts reached
          const newStatus: queue_status =
            notification.attempts + 1 >= notification.max_attempts
              ? "failed"
              : "pending";

          await this.prisma.adm_notification_queue.update({
            where: { id: notification.id },
            data: {
              status: newStatus,
              last_error: errorMessage,
              next_retry_at: newStatus === "pending" ? nextRetry : null,
            },
          });

          logger.error(
            {
              queueId: notification.id,
              error: errorMessage,
              attempts: notification.attempts + 1,
              nextRetry: newStatus === "pending" ? nextRetry : null,
            },
            "Notification processing failed"
          );
        }
      }

      logger.info(result, "Queue processing completed");
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, "Queue processing error");

      return {
        ...result,
        errors: [...result.errors, { queueId: "system", error: errorMessage }],
      };
    }
  }

  /**
   * Process a single notification by ID
   * Used for immediate processing in dev mode
   *
   * @param queueId - Queue entry ID
   */
  private async processOne(queueId: string): Promise<void> {
    const notification = await this.prisma.adm_notification_queue.findUnique({
      where: { id: queueId },
    });

    if (!notification || notification.status !== "pending") {
      return;
    }

    try {
      // Mark as processing
      await this.prisma.adm_notification_queue.update({
        where: { id: queueId },
        data: {
          status: "processing",
          attempts: { increment: 1 },
        },
      });

      // Send via NotificationService
      if (notification.channel === "email" && notification.recipient_email) {
        const sendResult = await this.notificationService.sendEmail({
          recipientEmail: notification.recipient_email,
          templateCode: notification.template_code,
          variables: notification.variables as Record<string, unknown>,
          locale: notification.locale,
          leadId: notification.lead_id || undefined,
          tenantId: notification.tenant_id || undefined,
          countryCode: notification.country_code || undefined,
        });

        if (sendResult.success) {
          await this.prisma.adm_notification_queue.update({
            where: { id: queueId },
            data: {
              status: "sent",
              processed_at: new Date(),
              last_error: null,
            },
          });

          logger.info(
            { queueId, templateCode: notification.template_code },
            "Notification sent successfully (immediate)"
          );
        } else {
          throw new Error(sendResult.error || "Unknown error sending email");
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await this.prisma.adm_notification_queue.update({
        where: { id: queueId },
        data: {
          status: "failed",
          last_error: errorMessage,
        },
      });

      logger.error(
        { queueId, error: errorMessage },
        "Immediate notification failed"
      );
    }
  }

  /**
   * Cancel a queued notification
   *
   * @param queueId - Queue entry ID
   * @returns Success status
   */
  async cancelNotification(queueId: string): Promise<boolean> {
    try {
      const notification = await this.prisma.adm_notification_queue.findUnique({
        where: { id: queueId },
        select: { status: true },
      });

      if (!notification || notification.status === "sent") {
        return false;
      }

      await this.prisma.adm_notification_queue.update({
        where: { id: queueId },
        data: { status: "cancelled" },
      });

      logger.info({ queueId }, "Notification cancelled");
      return true;
    } catch (error) {
      logger.error({ queueId, error }, "Failed to cancel notification");
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const stats = await this.prisma.adm_notification_queue.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { deleted_at: null },
    });

    return stats.reduce(
      (acc, s) => {
        acc[s.status] = s._count.id;
        return acc;
      },
      {} as Record<queue_status, number>
    );
  }
}
