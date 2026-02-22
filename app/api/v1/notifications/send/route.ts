/**
 * POST /api/v1/notifications/send
 * Send email notification using NotificationService
 * Requires authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { sendEmailSchema } from "@/lib/validators/notification.validators";
import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = sendEmailSchema.parse(body);

    // Initialize notification service
    const notificationService = new NotificationService(prisma);

    // Send email
    const result = await notificationService.sendEmail({
      recipientEmail: validatedData.recipientEmail,
      recipientPhone: validatedData.recipientPhone,
      templateCode: validatedData.templateCode,
      variables: validatedData.variables,
      userId: validatedData.userId,
      tenantId: validatedData.tenantId,
      leadId: validatedData.leadId,
      countryCode: validatedData.countryCode,
      fallbackLocale: validatedData.fallbackLocale,
      metadata: validatedData.metadata,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        messageId: result.messageId,
        locale: result.locale,
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

    // Internal server error
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
