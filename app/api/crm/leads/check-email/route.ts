/**
 * GET /api/crm/leads/check-email?email=xxx
 *
 * V6.2.4 - Check if email exists in crm_leads and has a booking
 *
 * Returns:
 * - exists: boolean - true if lead with this email exists
 * - hasBooking: boolean - true if lead has booking_slot_at set
 * - leadId: string | null - lead ID if exists
 *
 * Used by book-demo wizard to handle returning users:
 * - Email exists WITH booking → show reschedule option
 * - Email exists WITHOUT booking → continue normal flow
 * - Email doesn't exist → continue normal flow
 *
 * @module app/api/crm/leads/check-email/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_EMAIL",
            message: "Email parameter is required",
          },
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_EMAIL",
            message: "Invalid email format",
          },
        },
        { status: 400 }
      );
    }

    // Check if lead exists
    const lead = await prisma.crm_leads.findFirst({
      where: {
        email: { equals: email.toLowerCase().trim(), mode: "insensitive" },
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        status: true,
        booking_slot_at: true,
        booking_calcom_uid: true,
        email_verified: true,
      },
    });

    if (!lead) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          hasBooking: false,
          leadId: null,
        },
      });
    }

    // Check if lead has a booking
    const hasBooking = !!(lead.booking_slot_at && lead.booking_calcom_uid);

    logger.info(
      {
        email: email.toLowerCase().trim(),
        leadId: lead.id,
        hasBooking,
        status: lead.status,
      },
      "[CheckEmail] Email check result"
    );

    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        hasBooking,
        leadId: lead.id,
        emailVerified: lead.email_verified,
        status: lead.status,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "[CheckEmail] Failed to check email");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to check email",
        },
      },
      { status: 500 }
    );
  }
}
