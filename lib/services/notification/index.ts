/**
 * Notification Module
 * Centralized exports for notification services
 *
 * Session #29: Added NotificationQueueService for Transactional Outbox Pattern
 */

// Core notification service (direct sending)
export { NotificationService } from "./notification.service";
export type {
  SelectedTemplate,
  RenderedTemplate,
  NotificationResult,
  SelectTemplateParams,
  SendEmailParams,
  GetHistoryParams,
} from "./notification.service";

// Queue service (recommended for production)
export { NotificationQueueService } from "./queue.service";
export type {
  QueueNotificationParams,
  QueueResult,
  ProcessQueueResult,
} from "./queue.service";
