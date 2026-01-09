/**
 * Cal.com Webhook Validators
 * V6.2-5: Validation schemas for Cal.com webhook payloads
 *
 * CUSTOM PAYLOAD: Cal.com is configured to send a flat structure
 * instead of the default nested { responses: { field: { label, value } } }
 *
 * @see https://cal.com/docs/developing/guides/automation/webhooks
 */

import { z } from "zod";

/**
 * Cal.com custom webhook payload schema
 *
 * Cal.com is configured with a custom payload template that sends
 * a flat structure with direct field access.
 *
 * Template configured in Cal.com:
 * {
 *   "triggerEvent": "{{triggerEvent}}",
 *   "uid": "{{uid}}",
 *   "startTime": "{{startTime}}",
 *   "endTime": "{{endTime}}",
 *   "attendees.0.email": "{{attendees.0.email}}",
 *   "attendees.0.name": "{{attendees.0.name}}"
 * }
 *
 * Note: Cal.com combines first + last name into a single "name" field.
 * We split it in the webhook handler.
 */
export const calcomCustomPayloadSchema = z.object({
  // Cal.com uses "triggerEvent" not "event"
  triggerEvent: z.enum([
    "BOOKING_CREATED",
    "BOOKING_RESCHEDULED",
    "BOOKING_CANCELLED",
    "BOOKING_REJECTED",
    "PING",
  ]),
  uid: z.string().min(1, "Booking UID is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  // Cal.com uses dot notation in the custom payload
  "attendees.0.email": z.string().email("Valid email required"),
  "attendees.0.name": z.string().optional(),
});

export type CalcomCustomPayload = z.infer<typeof calcomCustomPayloadSchema>;

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
