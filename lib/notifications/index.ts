/**
 * FleetCore Notification System
 *
 * Type-safe notification API with:
 * - Strongly-typed payloads
 * - Transactional Outbox pattern
 * - Priority-based processing
 *
 * @example
 * ```typescript
 * import { sendNotification } from "@/lib/notifications";
 *
 * await sendNotification("crm.lead.confirmation", "user@example.com", {
 *   first_name: "John",
 *   company_name: "Acme Corp",
 *   fleet_size: "50-100",
 *   country_preposition: "in",
 *   country_name: "France",
 * });
 * ```
 *
 * @module lib/notifications
 */

// Main function
export {
  sendNotification,
  sendNotificationBatch,
  wasNotificationSent,
} from "./sendNotification";

// Types and interfaces
export type {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  PayloadFor,
  SendNotificationOptions,
  SendNotificationResult,
  // Payload interfaces
  LeadConfirmationPayload,
  ExpansionOpportunityPayload,
  LeadFollowupPayload,
  SalesRepAssignmentPayload,
  MemberWelcomePayload,
  MemberPasswordResetPayload,
  VehicleInspectionReminderPayload,
  InsuranceExpiryAlertPayload,
  MaintenanceScheduledPayload,
  DriverOnboardingPayload,
  CriticalAlertPayload,
  WebhookTestPayload,
} from "./types";

// Registry and utilities
export {
  NOTIFICATION_REGISTRY,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CHANNELS,
  getNotificationConfig,
  getTemplateCode,
  getNotificationPriority,
  isValidNotificationType,
  getNotificationsByDomain,
} from "./types";
