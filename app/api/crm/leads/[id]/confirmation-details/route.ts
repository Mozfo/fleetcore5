/**
 * GET /api/crm/leads/[id]/confirmation-details
 *
 * V6.2.2 - Get lead confirmation details for Book Demo wizard
 *
 * Returns:
 * - Lead info (email, first_name, last_name, company_name)
 * - Booking details (date/time, Cal.com UID for reschedule link)
 * - Wizard completion status
 *
 * Public endpoint (no auth required) - called from confirmation page
 *
 * @module app/api/crm/leads/[id]/confirmation-details/route
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

    // Fetch lead with confirmation details
    const lead = await prisma.crm_leads.findFirst({
      where: {
        id: leadId,
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        company_name: true,
        booking_slot_at: true,
        booking_calcom_uid: true,
        wizard_completed: true,
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

    // Check if wizard is completed (or has booking)
    const hasBooking = !!(lead.booking_slot_at && lead.booking_calcom_uid);
    const isComplete = lead.wizard_completed || hasBooking;

    if (!isComplete) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "WIZARD_NOT_COMPLETED",
            message: "Booking wizard not completed",
          },
        },
        { status: 400 }
      );
    }

    // Build Cal.com reschedule URL (using cal.eu for EU instance)
    const calcomOrigin =
      process.env.NEXT_PUBLIC_CALCOM_ORIGIN || "https://app.cal.eu";
    const calcomRescheduleUrl = lead.booking_calcom_uid
      ? `${calcomOrigin}/reschedule/${lead.booking_calcom_uid}`
      : null;

    logger.info(
      {
        leadId,
        hasBooking,
        wizardCompleted: lead.wizard_completed,
      },
      "[ConfirmationDetails] Lead confirmation retrieved"
    );

    return NextResponse.json({
      success: true,
      data: {
        lead: {
          id: lead.id,
          email: lead.email,
          firstName: lead.first_name,
          lastName: lead.last_name,
          companyName: lead.company_name,
        },
        booking: {
          dateTime: lead.booking_slot_at?.toISOString() || null,
          calcomUid: lead.booking_calcom_uid,
          rescheduleUrl: calcomRescheduleUrl,
        },
        status: lead.status,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[ConfirmationDetails] Failed to get confirmation details"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get confirmation details",
        },
      },
      { status: 500 }
    );
  }
}
