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
 *   "event": "{{triggerEvent}}",
 *   "uid": "{{uid}}",
 *   "startTime": "{{startTime}}",
 *   "endTime": "{{endTime}}",
 *   "attendee_email": "{{attendees.0.email}}",
 *   "attendee_first_name": "{{attendees.0.firstName}}",
 *   "attendee_last_name": "{{attendees.0.lastName}}",
 *   "notes": "{{responses.notes.value}}"
 * }
 */
export const calcomCustomPayloadSchema = z.object({
  event: z.enum([
    "BOOKING_CREATED",
    "BOOKING_RESCHEDULED",
    "BOOKING_CANCELLED",
    "PING",
  ]),
  uid: z.string().min(1, "Booking UID is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  attendee_email: z.string().email("Valid email required"),
  attendee_first_name: z.string().optional(),
  attendee_last_name: z.string().optional(),
  notes: z.string().optional(),
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
