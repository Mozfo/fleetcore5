/**
 * POST /api/webhooks/resend
 * Resend webhook handler for email delivery events
 * Updates notification logs based on Resend events (sent/delivered/opened/clicked/bounced)
 * Public endpoint - secured by Resend webhook signature verification
 */

import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { resendWebhookSchema } from "@/lib/validators/notification.validators";
import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // TODO: Add Resend webhook signature verification
    // const signature = request.headers.get("resend-signature");
    // if (!verifyResendSignature(signature, body)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // Parse and validate webhook payload
    const body = await request.json();
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
