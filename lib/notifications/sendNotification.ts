/**
 * sendNotification - Type-Safe Notification Facade
 *
 * Provides a type-safe API for sending notifications through the queue.
 * Payload types are automatically inferred from the notification type.
 *
 * @example
 * ```typescript
 * // Type-safe: payload must match LeadConfirmationPayload
 * await sendNotification("crm.lead.confirmation", "user@example.com", {
 *   first_name: "John",
 *   company_name: "Acme Corp",
 *   fleet_size: "50-100",
 *   country_preposition: "in",
 *   country_name: "France",
 * });
 * ```
 *
 * Best Practices 2025:
 * - Dependency injection via factory function
 * - Type inference from discriminated union
 * - Automatic idempotency key generation
 *
 * @module lib/notifications/sendNotification
 * @see lib/notifications/types.ts
 */

import { NotificationQueueService } from "@/lib/services/notification/queue.service";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  type NotificationType,
  type PayloadFor,
  type SendNotificationOptions,
  type SendNotificationResult,
  getTemplateCode,
  getNotificationPriority,
  isValidNotificationType,
} from "./types";

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let queueServiceInstance: NotificationQueueService | null = null;

/**
 * Get or create NotificationQueueService instance
 * Uses singleton pattern for efficiency
 */
function getQueueService(): NotificationQueueService {
  if (!queueServiceInstance) {
    queueServiceInstance = new NotificationQueueService(db);
  }
  return queueServiceInstance;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Send a typed notification through the queue
 *
 * @typeParam T - Notification type (inferred from first parameter)
 * @param type - Notification type from registry (e.g., "crm.lead.confirmation")
 * @param recipientEmail - Email address of the recipient
 * @param payload - Type-safe payload matching the notification type
 * @param options - Optional settings (locale, scheduling, idempotency)
 * @returns Result with success status and queue ID
 *
 * @example
 * ```typescript
 * // CRM Lead Confirmation
 * const result = await sendNotification(
 *   "crm.lead.confirmation",
 *   "lead@example.com",
 *   {
 *     first_name: "Marie",
 *     company_name: "Paris Fleet",
 *     fleet_size: "101-200",
 *     country_preposition: "en",
 *     country_name: "France",
 *   },
 *   { countryCode: "FR" }
 * );
 *
 * // System Critical Alert
 * await sendNotification(
 *   "system.alert.critical",
 *   "admin@fleetcore.com",
 *   {
 *     alert_title: "Database Connection Lost",
 *     alert_time: new Date().toISOString(),
 *     severity: "CRITICAL",
 *     affected_items: "All tenants",
 *     alert_description: "Primary database unreachable",
 *     recommended_action: "Check database server immediately",
 *     alert_url: "https://app.fleetcore.com/alerts/123",
 *   }
 * );
 * ```
 */
export async function sendNotification<T extends NotificationType>(
  type: T,
  recipientEmail: string,
  payload: PayloadFor<T>,
  options: SendNotificationOptions = {}
): Promise<SendNotificationResult> {
  // Validate notification type
  if (!isValidNotificationType(type)) {
    logger.error({ type }, "[sendNotification] Invalid notification type");
    return {
      success: false,
      error: `Invalid notification type: ${type}`,
    };
  }

  // Get configuration from registry
  const templateCode = getTemplateCode(type);
  const priority = getNotificationPriority(type);

  // Generate idempotency key if not provided
  const idempotencyKey =
    options.idempotencyKey ||
    generateIdempotencyKey(type, recipientEmail, options.leadId);

  logger.debug(
    {
      type,
      templateCode,
      priority,
      recipientEmail,
      idempotencyKey,
    },
    "[sendNotification] Queueing notification"
  );

  try {
    const queueService = getQueueService();

    const result = await queueService.queueNotification({
      channel: "email",
      templateCode,
      recipientEmail,
      variables: payload as unknown as Record<string, unknown>,
      locale: options.forceLocale,
      leadId: options.leadId,
      memberId: options.memberId,
      tenantId: options.tenantId,
      countryCode: options.countryCode,
      idempotencyKey,
      processImmediately: options.processImmediately,
    });

    if (result.success) {
      logger.info(
        {
          type,
          queueId: result.queueId,
          recipientEmail,
          priority,
        },
        "[sendNotification] Notification queued successfully"
      );
    } else {
      logger.warn(
        {
          type,
          error: result.error,
          recipientEmail,
        },
        "[sendNotification] Failed to queue notification"
      );
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      {
        type,
        recipientEmail,
        error: errorMessage,
      },
      "[sendNotification] Exception while queueing notification"
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// BATCH SENDING
// ============================================================================

/**
 * Send multiple notifications of the same type
 *
 * @param type - Notification type
 * @param recipients - Array of { email, payload } objects
 * @param options - Shared options for all notifications
 * @returns Array of results
 */
export async function sendNotificationBatch<T extends NotificationType>(
  type: T,
  recipients: Array<{
    email: string;
    payload: PayloadFor<T>;
    leadId?: string;
    memberId?: string;
  }>,
  options: Omit<SendNotificationOptions, "leadId" | "memberId"> = {}
): Promise<SendNotificationResult[]> {
  logger.info(
    { type, count: recipients.length },
    "[sendNotificationBatch] Starting batch send"
  );

  const results = await Promise.all(
    recipients.map((recipient) =>
      sendNotification(type, recipient.email, recipient.payload, {
        ...options,
        leadId: recipient.leadId,
        memberId: recipient.memberId,
      })
    )
  );

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  logger.info(
    { type, total: recipients.length, succeeded, failed },
    "[sendNotificationBatch] Batch send completed"
  );

  return results;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a deterministic idempotency key
 * Prevents duplicate notifications for the same event
 */
function generateIdempotencyKey(
  type: NotificationType,
  recipientEmail: string,
  entityId?: string
): string {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const baseKey = entityId
    ? `${type}_${entityId}_${date}`
    : `${type}_${recipientEmail}_${date}`;

  return baseKey;
}

/**
 * Helper to check if a notification was already sent (for external use)
 * Useful when you need to check before calling sendNotification
 */
export async function wasNotificationSent(
  idempotencyKey: string
): Promise<boolean> {
  const existing = await db.adm_notification_queue.findUnique({
    where: { idempotency_key: idempotencyKey },
    select: { id: true, status: true },
  });

  return existing !== null;
}
