/**
 * Notification Validators
 * Zod schemas for notification service input validation
 */

import { z } from "zod";

/**
 * ISO 3166-1 alpha-2 country code (2 uppercase letters)
 * Examples: FR, GB, AE, SA, US, etc.
 */
export const countryCodeSchema = z
  .string()
  .length(2)
  .regex(
    /^[A-Z]{2}$/,
    "Country code must be 2 uppercase letters (ISO 3166-1 alpha-2)"
  )
  .describe("ISO 3166-1 alpha-2 country code");

/**
 * ISO 639-1 locale code (2 lowercase letters, optional region)
 * Examples: en, fr, ar, en-US, fr-FR, ar-SA
 */
export const localeSchema = z
  .string()
  .regex(
    /^[a-z]{2}(-[A-Z]{2})?$/,
    "Locale must be ISO 639-1 format (e.g., 'en', 'fr', 'en-US')"
  )
  .describe("ISO 639-1 locale code");

/**
 * Notification channel enum
 */
export const notificationChannelSchema = z
  .enum(["email", "sms", "slack", "webhook", "push"])
  .describe("Notification channel");

/**
 * Notification status enum
 */
export const notificationStatusSchema = z
  .enum([
    "pending",
    "sent",
    "delivered",
    "bounced",
    "opened",
    "clicked",
    "failed",
  ])
  .describe("Notification status");

/**
 * Template variable value (primitive types + Date)
 */
const templateValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.date(),
  z.null(),
]);

/**
 * Template variables (key-value pairs)
 * Keys: variable names (alphanumeric + underscore)
 * Values: string | number | boolean | Date | null
 */
export const templateVariablesSchema = z
  .record(z.string().regex(/^[a-zA-Z0-9_]+$/), templateValueSchema)
  .describe("Template variables for {{placeholder}} replacement");

/**
 * Send email notification schema
 * Used by POST /api/v1/notifications/send
 */
export const sendEmailSchema = z.object({
  recipientEmail: z
    .string()
    .email("Invalid email address")
    .describe("Recipient email address"),

  recipientPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Phone must be E.164 format (+1234567890)")
    .optional()
    .describe("Recipient phone number (E.164 format)"),

  templateCode: z
    .string()
    .min(1, "Template code cannot be empty")
    .max(100, "Template code too long (max 100 chars)")
    .regex(
      /^[a-z0-9_]+$/,
      "Template code must be lowercase alphanumeric with underscores"
    )
    .describe("Template code (e.g., 'lead_confirmation', 'member_welcome')"),

  variables: templateVariablesSchema.describe(
    "Template variables (e.g., {user_name: 'John', tenant_name: 'FleetCore'})"
  ),

  userId: z
    .string()
    .uuid("Invalid user ID")
    .optional()
    .describe("User ID for cascade level 1"),

  tenantId: z
    .string()
    .uuid("Invalid tenant ID")
    .optional()
    .describe("Tenant ID for cascade level 3"),

  leadId: z
    .string()
    .uuid("Invalid lead ID")
    .optional()
    .describe("Lead ID for cascade level 4"),

  countryCode: countryCodeSchema
    .optional()
    .describe("Country code for cascade level 5"),

  fallbackLocale: localeSchema
    .optional()
    .default("en")
    .describe("Fallback locale (cascade level 6)"),

  metadata: z
    .object({
      ipAddress: z
        .string()
        .max(45)
        .optional()
        .describe("Client IP address (IPv4 or IPv6)"),
      userAgent: z.string().max(500).optional().describe("Client user agent"),
      sessionId: z.string().uuid().optional().describe("Session ID"),
      requestId: z.string().uuid().optional().describe("Request ID"),
    })
    .optional()
    .describe("Request metadata for tracking"),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

/**
 * Query notification history schema
 * Used by GET /api/v1/notifications/history
 */
export const queryHistorySchema = z.object({
  tenantId: z
    .string()
    .uuid("Invalid tenant ID")
    .optional()
    .describe("Filter by tenant ID"),

  recipientId: z
    .string()
    .uuid("Invalid recipient ID")
    .optional()
    .describe("Filter by recipient member ID"),

  recipientEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .describe("Filter by recipient email"),

  status: notificationStatusSchema.optional().describe("Filter by status"),

  templateCode: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .optional()
    .describe("Filter by template code"),

  channel: notificationChannelSchema.optional().describe("Filter by channel"),

  startDate: z.coerce.date().optional().describe("Filter from date (ISO 8601)"),

  endDate: z.coerce.date().optional().describe("Filter to date (ISO 8601)"),

  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be positive")
    .default(1)
    .describe("Page number (1-indexed)"),

  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be positive")
    .max(100, "Limit cannot exceed 100")
    .default(20)
    .describe("Items per page (max 100)"),

  sortBy: z
    .enum([
      "created_at",
      "sent_at",
      "delivered_at",
      "opened_at",
      "clicked_at",
      "failed_at",
      "status",
      "template_code",
      "recipient_email",
    ])
    .optional()
    .default("created_at")
    .describe("Sort field"),

  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc")
    .describe("Sort order"),
});

export type QueryHistoryInput = z.infer<typeof queryHistorySchema>;

/**
 * Update notification status schema (for Resend webhooks)
 * Used internally by handleResendWebhook()
 */
export const updateNotificationStatusSchema = z.object({
  id: z
    .string()
    .uuid("Invalid notification ID")
    .describe("Notification log ID"),

  status: notificationStatusSchema.describe("New status"),

  sent_at: z.coerce.date().optional().describe("Sent timestamp"),

  delivered_at: z.coerce.date().optional().describe("Delivered timestamp"),

  opened_at: z.coerce.date().optional().describe("Opened timestamp"),

  clicked_at: z.coerce.date().optional().describe("Clicked timestamp"),

  failed_at: z.coerce.date().optional().describe("Failed timestamp"),

  error_message: z
    .string()
    .max(1000)
    .optional()
    .describe("Error message (max 1000 chars)"),

  external_id: z
    .string()
    .max(255)
    .optional()
    .describe("Resend message ID (e.g., 're_abc123')"),
});

export type UpdateNotificationStatusInput = z.infer<
  typeof updateNotificationStatusSchema
>;

/**
 * Resend webhook event schema
 * Used by POST /api/webhooks/resend
 */
export const resendWebhookSchema = z.object({
  type: z
    .enum([
      "email.sent",
      "email.delivered",
      "email.bounced",
      "email.opened",
      "email.clicked",
    ])
    .describe("Resend webhook event type"),

  data: z
    .object({
      email_id: z.string().describe("Resend email ID"),
      created_at: z.string().datetime().describe("Event timestamp (ISO 8601)"),
      from: z.string().email().optional().describe("Sender email"),
      to: z.array(z.string().email()).optional().describe("Recipient emails"),
      subject: z.string().optional().describe("Email subject"),
    })
    .describe("Webhook payload data"),
});

export type ResendWebhookInput = z.infer<typeof resendWebhookSchema>;

/**
 * Get notification stats schema
 * Used by GET /api/v1/notifications/stats
 */
export const getStatsSchema = z.object({
  tenantId: z
    .string()
    .uuid("Invalid tenant ID")
    .optional()
    .describe("Filter by tenant ID"),

  startDate: z.coerce.date().optional().describe("Filter from date (ISO 8601)"),

  endDate: z.coerce.date().optional().describe("Filter to date (ISO 8601)"),
});

export type GetStatsInput = z.infer<typeof getStatsSchema>;

/**
 * Select template schema (internal)
 * Parameters for NotificationService.selectTemplate()
 */
export const selectTemplateSchema = z.object({
  templateCode: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/)
    .describe("Template code"),

  channel: notificationChannelSchema.describe("Notification channel"),

  userId: z.string().uuid().optional().describe("User ID for cascade level 1"),

  tenantId: z
    .string()
    .uuid()
    .optional()
    .describe("Tenant ID for cascade level 3"),

  leadId: z.string().uuid().optional().describe("Lead ID for cascade level 4"),

  countryCode: countryCodeSchema
    .optional()
    .describe("Country code for cascade level 5"),

  fallbackLocale: localeSchema.describe("Fallback locale (cascade level 6)"),
});

export type SelectTemplateInput = z.infer<typeof selectTemplateSchema>;

/**
 * Utility: Validate template code format
 * Helper for custom validation
 */
export function isValidTemplateCode(code: string): boolean {
  return /^[a-z0-9_]+$/.test(code) && code.length > 0 && code.length <= 100;
}

/**
 * Utility: Validate ISO country code
 * Helper for custom validation
 */
export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Utility: Validate ISO locale code
 * Helper for custom validation
 */
export function isValidLocale(locale: string): boolean {
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale);
}
