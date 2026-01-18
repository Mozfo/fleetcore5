/**
 * POST /api/crm/webhooks/calcom
 * Cal.com webhook handler for booking events
 * V6.2-5: Handles BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
 *
 * CUSTOM PAYLOAD from Cal.com (using their variable syntax):
 * {
 *   "triggerEvent": "{{triggerEvent}}",
 *   "uid": "{{uid}}",
 *   "startTime": "{{startTime}}",
 *   "endTime": "{{endTime}}",
 *   "attendees.0.email": "{{attendees.0.email}}",
 *   "attendees.0.name": "{{attendees.0.name}}"
 * }
 *
 * @see https://cal.com/docs/developing/guides/automation/webhooks
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  calcomCustomPayloadSchema,
  CALCOM_ACTIVITY_TYPES,
  CALCOM_ACTIVITY_TITLES,
} from "@/lib/validators/calcom.validators";

const CALCOM_WEBHOOK_SECRET = process.env.CALCOM_WEBHOOK_SECRET;

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
      case "BOOKING_CREATED":
        newStatus = "demo";
        updateData = {
          status: newStatus,
          booking_slot_at: new Date(payload.startTime),
          booking_calcom_uid: payload.uid,
          // Only update name if lead doesn't have one yet
          ...(firstName && !lead.first_name && { first_name: firstName }),
          ...(lastName && !lead.last_name && { last_name: lastName }),
          updated_at: new Date(),
        };
        break;

      case "BOOKING_RESCHEDULED":
        updateData = {
          booking_slot_at: new Date(payload.startTime),
          updated_at: new Date(),
        };
        break;

      case "BOOKING_CANCELLED":
      case "BOOKING_REJECTED":
        newStatus = "lost";
        updateData = {
          status: newStatus,
          loss_reason: "cancelled_by_lead",
          updated_at: new Date(),
        };
        break;
    }

    // 7. Update lead
    await prisma.crm_leads.update({
      where: { id: lead.id },
      data: updateData,
    });

    // 8. Create activity log
    const activityType =
      CALCOM_ACTIVITY_TYPES[
        payload.triggerEvent as keyof typeof CALCOM_ACTIVITY_TYPES
      ] || "booking_event";
    const activityTitle =
      CALCOM_ACTIVITY_TITLES[
        payload.triggerEvent as keyof typeof CALCOM_ACTIVITY_TITLES
      ] || `Cal.com: ${payload.triggerEvent}`;

    await prisma.crm_lead_activities.create({
      data: {
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

    // 9. Log success
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
