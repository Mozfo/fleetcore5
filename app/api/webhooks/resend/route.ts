/**
 * POST /api/webhooks/resend
 * Resend webhook handler for email delivery events
 * Updates notification logs based on Resend events (sent/delivered/opened/clicked/bounced)
 * Public endpoint - secured by Resend webhook signature verification via Svix
 *
 * @see https://resend.com/docs/dashboard/webhooks/verify-webhook-requests
 */

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { resendWebhookSchema } from "@/lib/validators/notification.validators";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ZodError } from "zod";

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature (Resend uses Svix for signing)
    if (RESEND_WEBHOOK_SECRET) {
      const svixId = request.headers.get("svix-id");
      const svixTimestamp = request.headers.get("svix-timestamp");
      const svixSignature = request.headers.get("svix-signature");

      if (!svixId || !svixTimestamp || !svixSignature) {
        logger.warn("[Resend Webhook] Missing Svix headers");
        return NextResponse.json(
          { error: "Missing webhook signature headers" },
          { status: 401 }
        );
      }

      try {
        const wh = new Webhook(RESEND_WEBHOOK_SECRET);
        wh.verify(rawBody, {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        });
      } catch {
        logger.warn("[Resend Webhook] Invalid signature");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      // In production, signature verification is required
      logger.error(
        "[Resend Webhook] RESEND_WEBHOOK_SECRET not configured in production"
      );
      return NextResponse.json(
        { error: "Webhook verification not configured" },
        { status: 500 }
      );
    }

    // Parse and validate webhook payload
    const body = JSON.parse(rawBody);
    const validatedPayload = resendWebhookSchema.parse(body);

    // Initialize notification service
    const notificationService = new NotificationService(prisma);

    // Handle webhook event
    await notificationService.handleResendWebhook(validatedPayload);

    // Return success response (Resend expects 200)
    return NextResponse.json(
      {
        success: true,
        event: validatedPayload.type,
        emailId: validatedPayload.data.email_id,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Internal server error (still return 200 to avoid Resend retries on permanent failures)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}
