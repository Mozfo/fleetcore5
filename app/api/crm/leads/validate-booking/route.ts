/**
 * GET /api/crm/leads/validate-booking?uid=xxx
 *
 * V6.2.4 - Validate a booking exists for reschedule page
 *
 * Returns:
 * - valid: boolean - true if booking exists and is active
 * - leadName: string - first name of the lead
 * - bookingDate: string - scheduled date (ISO format)
 *
 * @module app/api/crm/leads/validate-booking/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_UID",
            message: "Booking UID is required",
          },
        },
        { status: 400 }
      );
    }

    // Find lead by booking UID
    const lead = await prisma.crm_leads.findFirst({
      where: {
        booking_calcom_uid: uid,
        deleted_at: null,
      },
      select: {
        id: true,
        first_name: true,
        email: true,
        booking_slot_at: true,
        booking_calcom_uid: true,
        status: true,
      },
    });

    if (!lead) {
      logger.info({ uid }, "[ValidateBooking] No lead found for booking UID");
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
        },
      });
    }

    // Check if booking is still valid (not cancelled, not in the past)
    const bookingDate = lead.booking_slot_at;
    const isPastBooking = bookingDate && new Date(bookingDate) < new Date();

    // For demo_scheduled status, booking is valid
    const isValidStatus = lead.status === "demo_scheduled";

    logger.info(
      {
        uid,
        leadId: lead.id,
        status: lead.status,
        isPastBooking,
        isValidStatus,
      },
      "[ValidateBooking] Booking validation result"
    );

    return NextResponse.json({
      success: true,
      data: {
        valid: isValidStatus && !isPastBooking,
        leadName: lead.first_name || undefined,
        bookingDate: bookingDate?.toISOString() || undefined,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[ValidateBooking] Failed to validate booking"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to validate booking",
        },
      },
      { status: 500 }
    );
  }
}
