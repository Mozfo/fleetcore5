/**
 * POST /api/crm/webhooks/calcom
 * Cal.com webhook handler for booking events
 * V6.2-5: Handles BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
 *
 * Flow: Lead MUST exist when webhook arrives (Wizard Step 2)
 * - Step 1: Email → lead created (status = new)
 * - Step 2: Cal.com booking → webhook received (THIS ENDPOINT)
 * - Step 3: Phone required → wizard_completed = true
 *
 * @see https://cal.com/docs/developing/guides/automation/webhooks
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  calcomWebhookSchema,
  CALCOM_ACTIVITY_TYPES,
  CALCOM_ACTIVITY_TITLES,
  type CalcomTriggerEvent,
} from "@/lib/validators/calcom.validators";

const CALCOM_WEBHOOK_SECRET = process.env.CALCOM_WEBHOOK_SECRET;

/**
 * Verify Cal.com webhook signature using HMAC-SHA256
 * @see https://cal.com/docs/developing/guides/automation/webhooks
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

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

/**
 * Get activity title based on trigger event and locale
 */
function getActivityTitle(triggerEvent: CalcomTriggerEvent): string {
  return (
    CALCOM_ACTIVITY_TITLES[triggerEvent] || `Cal.com event: ${triggerEvent}`
  );
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

    // 3. Parse and validate webhook payload
    const body = JSON.parse(rawBody);

    // Handle Cal.com ping test (sends minimal payload)
    if (body.triggerEvent === "PING" || !body.payload) {
      logger.info("[Cal.com Webhook] Ping test received - responding OK");
      return NextResponse.json(
        { success: true, message: "Ping received" },
        { status: 200 }
      );
    }

    const { triggerEvent, payload } = calcomWebhookSchema.parse(body);

    // 4. Extract attendee email (first attendee is the lead)
    const attendeeEmail = payload.attendees[0]?.email;
    if (!attendeeEmail) {
      logger.error(
        { uid: payload.uid, triggerEvent },
        "[Cal.com Webhook] No attendee email in payload"
      );
      // Return 200 to avoid retries - this is a data issue
      return NextResponse.json(
        { success: false, error: "No attendee email in payload" },
        { status: 200 }
      );
    }

    // 5. Look up lead by email
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
      // CRITICAL: Lead MUST exist in V6.2 wizard flow
      // This is ABNORMAL - log ERROR not warning
      logger.error(
        {
          email: attendeeEmail,
          calcom_uid: payload.uid,
          triggerEvent,
          startTime: payload.startTime,
        },
        "[Cal.com Webhook] Lead not found for booking - this should not happen in V6.2 wizard flow"
      );
      // Return 200 to avoid retries
      return NextResponse.json(
        {
          success: false,
          error: "Lead not found for email",
          email: attendeeEmail,
        },
        { status: 200 }
      );
    }

    // 6. Process based on trigger event
    let updateData: Record<string, unknown> = {};
    let newStatus: string | null = null;

    switch (triggerEvent) {
      case "BOOKING_CREATED":
        newStatus = "demo_scheduled";
        updateData = {
          status: newStatus,
          booking_slot_at: new Date(payload.startTime),
          booking_calcom_uid: payload.uid,
          updated_at: new Date(),
        };
        break;

      case "BOOKING_RESCHEDULED":
        // Only update the booking time, don't change status
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

    // 7. Update lead in database
    await prisma.crm_leads.update({
      where: { id: lead.id },
      data: updateData,
    });

    // 8. Create activity log in crm_lead_activities
    const activityType = CALCOM_ACTIVITY_TYPES[triggerEvent];
    const activityTitle = getActivityTitle(triggerEvent);

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
          attendee_name: payload.attendees[0]?.name || null,
          trigger_event: triggerEvent,
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
        triggerEvent,
        lead_id: lead.id,
        lead_email: lead.email,
        calcom_uid: payload.uid,
        previous_status: lead.status,
        new_status: newStatus || "(unchanged)",
        duration_ms: duration,
      },
      "[Cal.com Webhook] Processed successfully"
    );

    // 10. Return success response
    return NextResponse.json(
      {
        success: true,
        event: triggerEvent,
        lead_id: lead.id,
        calcom_uid: payload.uid,
        status_changed: newStatus !== null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    // Validation error
    if (error instanceof ZodError) {
      logger.warn(
        { issues: error.issues, duration_ms: duration },
        "[Cal.com Webhook] Validation failed"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Log unexpected errors
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration_ms: duration,
      },
      "[Cal.com Webhook] Unexpected error"
    );

    // Return 200 to avoid Cal.com retries on permanent failures
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}
