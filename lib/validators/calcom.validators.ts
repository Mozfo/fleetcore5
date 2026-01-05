/**
 * Cal.com Webhook Validators
 * V6.2-5: Validation schemas for Cal.com webhook payloads
 */

import { z } from "zod";

/**
 * Cal.com webhook trigger events
 */
export const CalcomTriggerEvent = z.enum([
  "BOOKING_CREATED",
  "BOOKING_RESCHEDULED",
  "BOOKING_CANCELLED",
]);

export type CalcomTriggerEvent = z.infer<typeof CalcomTriggerEvent>;

/**
 * Attendee schema
 */
export const calcomAttendeeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  timeZone: z.string().optional(),
  language: z.union([z.string(), z.object({ locale: z.string() })]).optional(),
});

/**
 * Cal.com webhook payload schema
 * Based on Cal.com documentation: https://cal.com/docs/developing/guides/automation/webhooks
 */
export const calcomWebhookPayloadSchema = z.object({
  uid: z.string().min(1, "Booking UID is required"),
  startTime: z.string().datetime({ offset: true }).or(z.string().min(1)),
  endTime: z.string().optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  status: z.string().optional(),
  attendees: z
    .array(calcomAttendeeSchema)
    .min(1, "At least one attendee required"),
  organizer: z
    .object({
      email: z.string().email().optional(),
      name: z.string().optional(),
      timeZone: z.string().optional(),
    })
    .optional(),
});

/**
 * Full Cal.com webhook request schema
 */
export const calcomWebhookSchema = z.object({
  triggerEvent: CalcomTriggerEvent,
  createdAt: z.string().optional(),
  payload: calcomWebhookPayloadSchema,
});

export type CalcomWebhookRequest = z.infer<typeof calcomWebhookSchema>;
export type CalcomWebhookPayload = z.infer<typeof calcomWebhookPayloadSchema>;
export type CalcomAttendee = z.infer<typeof calcomAttendeeSchema>;

/**
 * Activity types for crm_lead_activities
 */
export const CALCOM_ACTIVITY_TYPES = {
  BOOKING_CREATED: "booking_created",
  BOOKING_RESCHEDULED: "booking_rescheduled",
  BOOKING_CANCELLED: "booking_cancelled",
} as const;

/**
 * Activity titles (French) for crm_lead_activities
 */
export const CALCOM_ACTIVITY_TITLES = {
  BOOKING_CREATED: "Demo booking créée via Cal.com",
  BOOKING_RESCHEDULED: "Demo booking reprogrammée via Cal.com",
  BOOKING_CANCELLED: "Demo booking annulée via Cal.com",
} as const;
