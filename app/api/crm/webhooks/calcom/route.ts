/**
 * POST /api/crm/webhooks/calcom
 * Cal.com webhook handler for booking events
 * V6.2-5: Handles BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
 * V6.5: Sends BookingConfirmation email on BOOKING_CREATED
 *
 * CUSTOM PAYLOAD from Cal.com (using their variable syntax):
 * {
 *   "triggerEvent": "{{triggerEvent}}",
 *   "uid": "{{uid}}",
 *   "startTime": "{{startTime}}",
 *   "endTime": "{{endTime}}",
 *   "attendees.0.email": "{{attendees.0.email}}",
 *   "attendees.0.name": "{{attendees.0.name}}",
 *   "metadata.videoCallUrl": "{{metadata.videoCallUrl}}"
 * }
 *
 * @see https://cal.com/docs/developing/guides/automation/webhooks
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  calcomCustomPayloadSchema,
  CALCOM_ACTIVITY_TYPES,
  CALCOM_ACTIVITY_TITLES,
} from "@/lib/validators/calcom.validators";
import { generateShortToken } from "@/lib/utils/token";
import { BookingConfirmation } from "@/emails/templates/BookingConfirmation";
import { EMAIL_FROM } from "@/lib/config/email.config";
import { URLS } from "@/lib/config/urls.config";
import type { EmailLocale } from "@/lib/i18n/email-translations";

const CALCOM_WEBHOOK_SECRET = process.env.CALCOM_WEBHOOK_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ============================================================================
// DATE/TIME HELPERS
// ============================================================================

function formatBookingDate(date: Date, locale: EmailLocale): string {
  const localeMap: Record<EmailLocale, string> = {
    en: "en-US",
    fr: "fr-FR",
    ar: "ar-SA",
  };
  return new Intl.DateTimeFormat(localeMap[locale], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatBookingTime(date: Date, locale: EmailLocale): string {
  const localeMap: Record<EmailLocale, string> = {
    en: "en-US",
    fr: "fr-FR",
    ar: "ar-SA",
  };
  return new Intl.DateTimeFormat(localeMap[locale], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale === "en",
  }).format(date);
}

function getTimezoneAbbr(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const sign = offset >= 0 ? "+" : "-";
  return `GMT${sign}${hours}`;
}

/**
 * Verify Cal.com webhook signature using HMAC-SHA256
 */
function verifyCalcomSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

/**
 * Split full name into first and last name
 * "John Doe" → { firstName: "John", lastName: "Doe" }
 * "John" → { firstName: "John", lastName: null }
 * "John Middle Doe" → { firstName: "John", lastName: "Middle Doe" }
 */
function splitFullName(fullName: string | undefined | null): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!fullName || !fullName.trim()) {
    return { firstName: null, lastName: null };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Get raw body for signature verification
    const rawBody = await request.text();

    // 2. Verify webhook signature
    if (CALCOM_WEBHOOK_SECRET) {
      const signature = request.headers.get("x-cal-signature-256");

      if (!signature) {
        logger.warn("[Cal.com Webhook] Missing signature header");
        return NextResponse.json(
          { error: "Missing webhook signature header" },
          { status: 401 }
        );
      }

      const isValid = verifyCalcomSignature(
        rawBody,
        signature,
        CALCOM_WEBHOOK_SECRET
      );

      if (!isValid) {
        logger.warn("[Cal.com Webhook] Invalid signature");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      logger.error(
        "[Cal.com Webhook] CALCOM_WEBHOOK_SECRET not configured in production"
      );
      return NextResponse.json(
        { error: "Webhook verification not configured" },
        { status: 500 }
      );
    }

    // 3. Parse and validate custom payload
    const body = JSON.parse(rawBody);

    // Handle ping test (both formats)
    if (body.triggerEvent === "PING" || body.event === "PING") {
      logger.info("[Cal.com Webhook] Ping test received");
      return NextResponse.json({ success: true, message: "Ping received" });
    }

    // Validate with Zod schema
    const payload = calcomCustomPayloadSchema.parse(body);

    // Extract email and name from dot-notation keys
    const attendeeEmail = payload["attendees.0.email"];
    const attendeeName = payload["attendees.0.name"];

    logger.info(
      {
        event: payload.triggerEvent,
        uid: payload.uid,
        email: attendeeEmail,
        name: attendeeName,
      },
      "[Cal.com Webhook] Received"
    );

    // 4. Look up lead by email
    const lead = await prisma.crm_leads.findFirst({
      where: {
        email: attendeeEmail.toLowerCase(),
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        status: true,
        first_name: true,
        last_name: true,
        country_code: true,
        reschedule_token: true,
        language: true,
        tenant_id: true,
      },
    });

    if (!lead) {
      logger.error(
        { email: attendeeEmail, uid: payload.uid },
        "[Cal.com Webhook] Lead not found"
      );
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 200 }
      );
    }

    // 5. Split full name into first and last name
    const { firstName, lastName } = splitFullName(attendeeName);

    // 6. Process based on event type
    let updateData: Record<string, unknown> = {};
    let newStatus: string | null = null;

    switch (payload.triggerEvent) {
      case "BOOKING_CREATED": {
        newStatus = "demo";

        // Generate reschedule_token if not already present
        const rescheduleToken = lead.reschedule_token || generateShortToken();

        updateData = {
          status: newStatus,
          booking_slot_at: new Date(payload.startTime),
          booking_calcom_uid: payload.uid,
          reschedule_token: rescheduleToken,
          // Only update name if lead doesn't have one yet
          ...(firstName && !lead.first_name && { first_name: firstName }),
          ...(lastName && !lead.last_name && { last_name: lastName }),
          updated_at: new Date(),
        };

        // CRITICAL: Update lead BEFORE sending email
        // This ensures the reschedule_token exists in DB when user clicks the link
        await prisma.crm_leads.update({
          where: { id: lead.id },
          data: updateData,
        });

        // Send BookingConfirmation email (after DB update)
        if (RESEND_API_KEY) {
          try {
            const resend = new Resend(RESEND_API_KEY);
            const baseUrl = URLS.public;
            const locale = (lead.language as EmailLocale) || "en";
            const bookingDate = new Date(payload.startTime);

            // Build URLs
            const rescheduleUrl = `${baseUrl}/${locale}/r/${rescheduleToken}`;
            const meetingUrl =
              payload["metadata.videoCallUrl"] ||
              `${baseUrl}/${locale}/book-demo`;

            // Format date/time
            const formattedDate = formatBookingDate(bookingDate, locale);
            const formattedTime = formatBookingTime(bookingDate, locale);
            const timezone = getTimezoneAbbr(bookingDate);

            // Render email
            const html = await render(
              BookingConfirmation({
                locale,
                firstName: firstName || lead.first_name || "there",
                bookingDate: formattedDate,
                bookingTime: formattedTime,
                timezone,
                meetingUrl,
                rescheduleUrl,
              })
            );

            // Subject based on locale
            const subject =
              locale === "fr"
                ? "✅ Votre démo FleetCore est confirmée"
                : locale === "ar"
                  ? "✅ تم تأكيد عرض FleetCore التوضيحي"
                  : "✅ Your FleetCore demo is confirmed";

            // Send email
            const { error: sendError } = await resend.emails.send({
              from: EMAIL_FROM,
              to: lead.email,
              subject,
              html,
            });

            if (sendError) {
              logger.error(
                { leadId: lead.id, error: sendError.message },
                "[Cal.com Webhook] Failed to send BookingConfirmation email"
              );
            } else {
              logger.info(
                { leadId: lead.id, email: lead.email, locale },
                "[Cal.com Webhook] BookingConfirmation email sent"
              );
            }
          } catch (emailError) {
            logger.error(
              {
                leadId: lead.id,
                error:
                  emailError instanceof Error
                    ? emailError.message
                    : String(emailError),
              },
              "[Cal.com Webhook] Error sending BookingConfirmation email"
            );
          }
        }

        // Skip the general update below since we already updated
        updateData = {};
        break;
      }

      case "BOOKING_RESCHEDULED":
        updateData = {
          booking_slot_at: new Date(payload.startTime),
          updated_at: new Date(),
        };
        break;

      case "BOOKING_CANCELLED":
      case "BOOKING_REJECTED":
        newStatus = "new"; // Return to new status, not lost (they may rebook)
        updateData = {
          status: newStatus,
          // Clear booking fields
          booking_slot_at: null,
          booking_calcom_uid: null,
          updated_at: new Date(),
        };
        break;
    }

    // 7. Update lead (skip if already updated in BOOKING_CREATED)
    if (Object.keys(updateData).length > 0) {
      await prisma.crm_leads.update({
        where: { id: lead.id },
        data: updateData,
      });
    }

    // 8. Resolve tenant_id for activity log (use lead's tenant or fallback to HQ)
    let activityTenantId = lead.tenant_id;
    if (!activityTenantId) {
      const hqTenant = await prisma.adm_tenants.findFirst({
        where: { tenant_type: "headquarters" },
        select: { id: true },
      });
      activityTenantId = hqTenant?.id ?? null;
    }

    // 9. Create activity log
    const activityType =
      CALCOM_ACTIVITY_TYPES[
        payload.triggerEvent as keyof typeof CALCOM_ACTIVITY_TYPES
      ] || "booking_event";
    const activityTitle =
      CALCOM_ACTIVITY_TITLES[
        payload.triggerEvent as keyof typeof CALCOM_ACTIVITY_TITLES
      ] || `Cal.com: ${payload.triggerEvent}`;

    if (activityTenantId) {
      await prisma.crm_lead_activities.create({
        data: {
          tenant_id: activityTenantId,
          lead_id: lead.id,
          activity_type: activityType,
          title: activityTitle,
          description: `Booking ${payload.uid} pour ${new Date(
            payload.startTime
          ).toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          metadata: {
            calcom_uid: payload.uid,
            start_time: payload.startTime,
            attendee_email: attendeeEmail,
            attendee_name: attendeeName,
            first_name: firstName,
            last_name: lastName,
            event: payload.triggerEvent,
            previous_status: lead.status,
            new_status: newStatus || lead.status,
          },
          performed_by_name: "Cal.com Webhook",
          is_completed: true,
          completed_at: new Date(),
        },
      });
    }

    // 10. Log success
    const duration = Date.now() - startTime;
    logger.info(
      {
        event: payload.triggerEvent,
        lead_id: lead.id,
        uid: payload.uid,
        firstName,
        lastName,
        duration_ms: duration,
      },
      "[Cal.com Webhook] Processed successfully"
    );

    return NextResponse.json({
      success: true,
      event: payload.triggerEvent,
      lead_id: lead.id,
      uid: payload.uid,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    if (error instanceof ZodError) {
      logger.warn(
        { issues: error.issues, duration_ms: duration },
        "[Cal.com Webhook] Validation failed"
      );
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        duration_ms: duration,
      },
      "[Cal.com Webhook] Error"
    );

    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 200 }
    );
  }
}
