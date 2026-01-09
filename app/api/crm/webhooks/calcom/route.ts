/**
 * POST /api/crm/webhooks/calcom
 * Cal.com webhook handler for booking events
 * V6.2-5: Handles BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
 *
 * CUSTOM PAYLOAD: Cal.com is configured to send a flat structure:
 * {
 *   "event": "BOOKING_CREATED",
 *   "uid": "abc123",
 *   "startTime": "2026-01-10T10:00:00Z",
 *   "endTime": "2026-01-10T10:30:00Z",
 *   "attendee_email": "john@company.com",
 *   "attendee_first_name": "John",
 *   "attendee_last_name": "Doe",
 *   "notes": "I manage 25 vehicles"
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

    // Handle ping test
    if (body.event === "PING") {
      logger.info("[Cal.com Webhook] Ping test received");
      return NextResponse.json({ success: true, message: "Ping received" });
    }

    // Validate with Zod schema
    const payload = calcomCustomPayloadSchema.parse(body);

    logger.info(
      {
        event: payload.event,
        uid: payload.uid,
        email: payload.attendee_email,
      },
      "[Cal.com Webhook] Received"
    );

    // 4. Look up lead by email
    const lead = await prisma.crm_leads.findFirst({
      where: {
        email: payload.attendee_email.toLowerCase(),
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
        { email: payload.attendee_email, uid: payload.uid },
        "[Cal.com Webhook] Lead not found"
      );
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 200 }
      );
    }

    // 5. Extract data directly from flat payload
    const firstName = payload.attendee_first_name?.trim() || null;
    const lastName = payload.attendee_last_name?.trim() || null;
    const notes = payload.notes?.trim() || null;

    // 6. Process based on event type
    let updateData: Record<string, unknown> = {};
    let newStatus: string | null = null;

    switch (payload.event) {
      case "BOOKING_CREATED":
        newStatus = "demo_scheduled";
        updateData = {
          status: newStatus,
          booking_slot_at: new Date(payload.startTime),
          booking_calcom_uid: payload.uid,
          ...(firstName && !lead.first_name && { first_name: firstName }),
          ...(lastName && !lead.last_name && { last_name: lastName }),
          ...(notes && { message: notes }),
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
        payload.event as keyof typeof CALCOM_ACTIVITY_TYPES
      ];
    const activityTitle =
      CALCOM_ACTIVITY_TITLES[
        payload.event as keyof typeof CALCOM_ACTIVITY_TITLES
      ] || `Cal.com: ${payload.event}`;

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
          attendee_email: payload.attendee_email,
          attendee_first_name: firstName,
          attendee_last_name: lastName,
          notes: notes,
          event: payload.event,
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
        event: payload.event,
        lead_id: lead.id,
        uid: payload.uid,
        duration_ms: duration,
      },
      "[Cal.com Webhook] Processed successfully"
    );

    return NextResponse.json({
      success: true,
      event: payload.event,
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
