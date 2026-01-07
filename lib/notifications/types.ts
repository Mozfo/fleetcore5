/**
 * Notification Types Registry
 *
 * Type-safe notification system with:
 * - Strongly-typed payloads for each notification type
 * - Priority levels for queue processing
 * - Channel support (email, sms, push, webhook)
 *
 * Best Practices 2025:
 * - Discriminated unions for type safety
 * - Exhaustive type checking at compile time
 * - Single Source of Truth for notification metadata
 *
 * @module lib/notifications/types
 * @see lib/services/notification/queue.service.ts
 */

// ============================================================================
// PRIORITY LEVELS
// ============================================================================

/**
 * Notification priority levels
 * - critical: Sent immediately, bypasses rate limits (alerts, security)
 * - high: Processed first in queue (transactional, time-sensitive)
 * - normal: Standard processing order (confirmations, updates)
 * - low: Processed when queue is clear (marketing, newsletters)
 */
export const NOTIFICATION_PRIORITIES = [
  "critical",
  "high",
  "normal",
  "low",
] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

// ============================================================================
// NOTIFICATION CHANNELS
// ============================================================================

/**
 * Supported notification channels
 * Maps to Prisma notification_channel enum
 */
export const NOTIFICATION_CHANNELS = [
  "email",
  "sms",
  "push",
  "slack",
  "webhook",
] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

// ============================================================================
// NOTIFICATION TYPE REGISTRY
// ============================================================================

/**
 * Master registry of all notification types
 *
 * Naming convention: {domain}.{entity}.{action}
 * - crm.lead.confirmation
 * - admin.member.welcome
 * - fleet.vehicle.inspection_reminder
 */
export const NOTIFICATION_REGISTRY = {
  // CRM Domain
  "crm.lead.confirmation": {
    templateCode: "lead_confirmation",
    channels: ["email"] as NotificationChannel[],
    priority: "high" as NotificationPriority,
    description: "Sent to lead after demo request submission",
  },
  "crm.lead.expansion": {
    templateCode: "expansion_opportunity",
    channels: ["email"] as NotificationChannel[],
    priority: "normal" as NotificationPriority,
    description: "Sent when lead is from unsupported country",
  },
  "crm.lead.followup": {
    templateCode: "lead_followup",
    channels: ["email"] as NotificationChannel[],
    priority: "normal" as NotificationPriority,
    description: "Follow-up email to leads who have not responded",
  },
  "crm.sales.assignment": {
    templateCode: "sales_rep_assignment",
    channels: ["email"] as NotificationChannel[],
    priority: "high" as NotificationPriority,
    description: "Sent to sales rep when lead is assigned",
  },
  "crm.lead.email_verification": {
    templateCode: "email_verification_code",
    channels: ["email"] as NotificationChannel[],
    priority: "critical" as NotificationPriority,
    description: "6-digit verification code for Book Demo wizard (V6.2.2)",
  },

  // Admin Domain
  "admin.member.welcome": {
    templateCode: "member_welcome",
    channels: ["email"] as NotificationChannel[],
    priority: "high" as NotificationPriority,
    description: "Sent to new team member after account creation",
  },
  "admin.member.password_reset": {
    templateCode: "member_password_reset",
    channels: ["email"] as NotificationChannel[],
    priority: "critical" as NotificationPriority,
    description: "Password reset link for member",
  },

  // Fleet Domain
  "fleet.vehicle.inspection_reminder": {
    templateCode: "vehicle_inspection_reminder",
    channels: ["email"] as NotificationChannel[],
    priority: "normal" as NotificationPriority,
    description: "Reminder when vehicle inspection is due",
  },
  "fleet.vehicle.insurance_expiry": {
    templateCode: "insurance_expiry_alert",
    channels: ["email"] as NotificationChannel[],
    priority: "high" as NotificationPriority,
    description: "Alert when vehicle insurance is expiring",
  },
  "fleet.vehicle.maintenance_scheduled": {
    templateCode: "maintenance_scheduled",
    channels: ["email"] as NotificationChannel[],
    priority: "normal" as NotificationPriority,
    description: "Notification when maintenance is scheduled",
  },
  "fleet.driver.onboarding": {
    templateCode: "driver_onboarding",
    channels: ["email"] as NotificationChannel[],
    priority: "high" as NotificationPriority,
    description: "Welcome email for new driver",
  },

  // Billing Domain
  "billing.customer.verification": {
    templateCode: "customer_verification",
    channels: ["email"] as NotificationChannel[],
    priority: "high" as NotificationPriority,
    description: "Sent after Stripe checkout for customer account verification",
  },

  // System Domain
  "system.alert.critical": {
    templateCode: "critical_alert",
    channels: ["email"] as NotificationChannel[],
    priority: "critical" as NotificationPriority,
    description: "Critical system alert requiring immediate attention",
  },
  "system.webhook.test": {
    templateCode: "webhook_test",
    channels: ["email"] as NotificationChannel[],
    priority: "low" as NotificationPriority,
    description: "Test notification for webhook verification",
  },
} as const;

/**
 * All valid notification type keys
 */
export type NotificationType = keyof typeof NOTIFICATION_REGISTRY;

/**
 * Get template code from notification type
 */
export type TemplateCodeFor<T extends NotificationType> =
  (typeof NOTIFICATION_REGISTRY)[T]["templateCode"];

// ============================================================================
// PAYLOAD INTERFACES
// ============================================================================

/**
 * CRM Lead Confirmation Payload
 * @see emails/templates/LeadConfirmation.tsx
 */
export interface LeadConfirmationPayload {
  first_name: string;
  company_name: string;
  fleet_size: string;
  country_preposition: string;
  country_name: string;
  phone_row?: string;
  message_row?: string;
}

/**
 * CRM Expansion Opportunity Payload
 * @see emails/templates/ExpansionOpportunity.tsx
 */
export interface ExpansionOpportunityPayload {
  first_name: string;
  company_name: string;
  fleet_size: string;
  country_preposition: string;
  country_name: string;
  phone_row?: string;
  message_row?: string;
}

/**
 * CRM Lead Followup Payload
 * @see emails/templates/LeadFollowup.tsx
 */
export interface LeadFollowupPayload {
  first_name: string;
  company_name: string;
  demo_link: string;
  sales_rep_name: string;
}

/**
 * Sales Rep Assignment Payload
 * @see emails/templates/SalesRepAssignment.tsx
 */
export interface SalesRepAssignmentPayload {
  employee_name: string;
  lead_name: string;
  company_name: string;
  priority: "urgent" | "high" | "medium" | "low";
  fit_score: number;
  qualification_score: number;
  lead_stage: string;
  fleet_size: string;
  country_code: string;
  lead_detail_url: string;
}

/**
 * Member Welcome Payload
 * @see emails/templates/MemberWelcome.tsx
 */
export interface MemberWelcomePayload {
  first_name: string;
  tenant_name: string;
  email: string;
  role: string;
  dashboard_url: string;
}

/**
 * Member Password Reset Payload
 * @see emails/templates/MemberPasswordReset.tsx
 */
export interface MemberPasswordResetPayload {
  first_name: string;
  reset_link: string;
  expiry_hours: string;
}

/**
 * Vehicle Inspection Reminder Payload
 * @see emails/templates/VehicleInspectionReminder.tsx
 */
export interface VehicleInspectionReminderPayload {
  fleet_manager_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  due_date: string;
  days_remaining: string;
  booking_link: string;
}

/**
 * Insurance Expiry Alert Payload
 * @see emails/templates/InsuranceExpiryAlert.tsx
 */
export interface InsuranceExpiryAlertPayload {
  fleet_manager_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  expiry_date: string;
  days_remaining: string;
  insurance_provider: string;
  policy_number: string;
  insurance_details_url: string;
}

/**
 * Maintenance Scheduled Payload
 * @see emails/templates/MaintenanceScheduled.tsx
 */
export interface MaintenanceScheduledPayload {
  driver_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  maintenance_date: string;
  maintenance_time: string;
  maintenance_location: string;
  maintenance_type: string;
  estimated_duration: string;
  maintenance_details_url: string;
}

/**
 * Driver Onboarding Payload
 * @see emails/templates/DriverOnboarding.tsx
 */
export interface DriverOnboardingPayload {
  driver_name: string;
  fleet_name: string;
  driver_id: string;
  start_date: string;
  fleet_manager_name: string;
  driver_portal_url: string;
}

/**
 * Critical Alert Payload
 * @see emails/templates/CriticalAlert.tsx
 */
export interface CriticalAlertPayload {
  alert_title: string;
  alert_time: string;
  severity: string;
  affected_items: string;
  alert_description: string;
  recommended_action: string;
  alert_url: string;
}

/**
 * Webhook Test Payload
 * @see emails/templates/WebhookTest.tsx
 */
export interface WebhookTestPayload {
  timestamp: string;
  test_id: string;
}

/**
 * Email Verification Code Payload - V6.2.2
 * @see emails/templates/EmailVerificationCode.tsx
 */
export interface EmailVerificationCodePayload {
  verification_code: string;
  expires_in_minutes: number;
}

/**
 * Customer Verification Payload - V6.2-8.5
 * @see emails/templates/CustomerVerification.tsx
 */
export interface CustomerVerificationPayload {
  company_name: string;
  tenant_code: string;
  verification_url: string;
  expires_in_hours: number;
}

// ============================================================================
// PAYLOAD TYPE MAP (Discriminated Union)
// ============================================================================

/**
 * Maps notification types to their payload interfaces
 * Enables type inference: PayloadFor<"crm.lead.confirmation"> -> LeadConfirmationPayload
 */
export interface NotificationPayloadMap {
  "crm.lead.confirmation": LeadConfirmationPayload;
  "crm.lead.expansion": ExpansionOpportunityPayload;
  "crm.lead.followup": LeadFollowupPayload;
  "crm.sales.assignment": SalesRepAssignmentPayload;
  "crm.lead.email_verification": EmailVerificationCodePayload;
  "admin.member.welcome": MemberWelcomePayload;
  "admin.member.password_reset": MemberPasswordResetPayload;
  "fleet.vehicle.inspection_reminder": VehicleInspectionReminderPayload;
  "fleet.vehicle.insurance_expiry": InsuranceExpiryAlertPayload;
  "fleet.vehicle.maintenance_scheduled": MaintenanceScheduledPayload;
  "fleet.driver.onboarding": DriverOnboardingPayload;
  "billing.customer.verification": CustomerVerificationPayload;
  "system.alert.critical": CriticalAlertPayload;
  "system.webhook.test": WebhookTestPayload;
}

/**
 * Type helper: Get payload type for a notification type
 * @example PayloadFor<"crm.lead.confirmation"> -> LeadConfirmationPayload
 */
export type PayloadFor<T extends NotificationType> = NotificationPayloadMap[T];

// ============================================================================
// SEND NOTIFICATION OPTIONS
// ============================================================================

/**
 * Options for sendNotification()
 */
export interface SendNotificationOptions {
  /** Force specific locale (overrides CASCADE algorithm) */
  forceLocale?: string;

  /** Schedule for future delivery (ISO date string) */
  scheduledFor?: string;

  /** Custom idempotency key (default: auto-generated) */
  idempotencyKey?: string;

  /** Process immediately in dev mode (default: true in dev) */
  processImmediately?: boolean;

  /** Additional context for lead */
  leadId?: string;

  /** Member ID for member-related notifications */
  memberId?: string;

  /** Tenant ID for tenant-scoped notifications (client context) */
  tenantId?: string;

  /** Provider ID for provider-scoped notifications (FleetCore division) */
  providerId?: string;

  /** Country code for locale resolution */
  countryCode?: string;
}

/**
 * Result from sendNotification()
 */
export interface SendNotificationResult {
  success: boolean;
  queueId?: string;
  error?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get notification registry entry for a type
 */
export function getNotificationConfig<T extends NotificationType>(type: T) {
  return NOTIFICATION_REGISTRY[type];
}

/**
 * Get template code for a notification type
 */
export function getTemplateCode<T extends NotificationType>(type: T): string {
  return NOTIFICATION_REGISTRY[type].templateCode;
}

/**
 * Get priority for a notification type
 */
export function getNotificationPriority<T extends NotificationType>(
  type: T
): NotificationPriority {
  return NOTIFICATION_REGISTRY[type].priority;
}

/**
 * Check if a notification type is valid
 */
export function isValidNotificationType(
  type: string
): type is NotificationType {
  return type in NOTIFICATION_REGISTRY;
}

/**
 * Get all notification types for a domain
 * @example getNotificationsByDomain("crm") -> ["crm.lead.confirmation", ...]
 */
export function getNotificationsByDomain(
  domain: "crm" | "admin" | "fleet" | "billing" | "system"
): NotificationType[] {
  return (Object.keys(NOTIFICATION_REGISTRY) as NotificationType[]).filter(
    (key) => key.startsWith(`${domain}.`)
  );
}
