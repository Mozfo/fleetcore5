/**
 * GET /api/crm/leads/[id]/booking-status
 *
 * V6.2.2 - Check lead booking status for Book Demo wizard
 *
 * Returns:
 * - Lead basic info (email, email_verified, first_name, last_name)
 * - Booking status (hasBooking, bookingSlotAt, canProceed)
 *
 * Public endpoint (no auth required) - called from Book Demo wizard
 *
 * @module app/api/crm/leads/[id]/booking-status/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leadId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_LEAD_ID",
            message: "Invalid lead ID format",
          },
        },
        { status: 400 }
      );
    }

    // Fetch lead with booking info
    const lead = await prisma.crm_leads.findFirst({
      where: {
        id: leadId,
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        email_verified: true,
        first_name: true,
        last_name: true,
        booking_slot_at: true,
        booking_calcom_uid: true,
        status: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "LEAD_NOT_FOUND",
            message: "Lead not found",
          },
        },
        { status: 404 }
      );
    }

    // Determine booking status
    const hasBooking = !!(lead.booking_slot_at && lead.booking_calcom_uid);
    const bookingSlotAt = lead.booking_slot_at?.toISOString() || null;

    // Lead can proceed to step 3 if:
    // 1. Email is verified
    // 2. Has a booking (optional for now - allow without booking)
    const canProceed = lead.email_verified && hasBooking;

    logger.info(
      {
        leadId,
        hasBooking,
        emailVerified: lead.email_verified,
        canProceed,
      },
      "[BookingStatus] Lead status checked"
    );

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        email: lead.email,
        email_verified: lead.email_verified,
        first_name: lead.first_name,
        last_name: lead.last_name,
      },
      data: {
        hasBooking,
        bookingSlotAt,
        canProceed,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[BookingStatus] Failed to check booking status"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to check booking status",
        },
      },
      { status: 500 }
    );
  }
}
