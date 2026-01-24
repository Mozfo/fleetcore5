/**
 * GET /api/crm/leads/confirm-attendance?token=xxx
 *
 * V6.2.6 - Confirm lead attendance via J-1 email reminder
 *
 * When lead clicks "I'll be there" button in J-1 reminder email:
 * 1. Validates the confirmation_token
 * 2. Updates attendance_confirmed = true
 * 3. Returns lead details for the confirmation page
 *
 * Public endpoint (no auth required) - called from email link
 *
 * @module app/api/crm/leads/confirm-attendance/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Validate token presence
    if (!token || token.length < 10) {
      logger.warn(
        { token: token?.slice(0, 10) },
        "[ConfirmAttendance] Invalid or missing token"
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or missing confirmation token",
          },
        },
        { status: 400 }
      );
    }

    // Find lead by confirmation token
    const lead = await prisma.crm_leads.findFirst({
      where: {
        confirmation_token: token,
        deleted_at: null,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        company_name: true,
        email: true,
        booking_slot_at: true,
        booking_calcom_uid: true,
        attendance_confirmed: true,
        attendance_confirmed_at: true,
        reschedule_token: true,
        language: true,
      },
    });

    // Token not found
    if (!lead) {
      logger.warn(
        { tokenPrefix: token.slice(0, 10) },
        "[ConfirmAttendance] Token not found"
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Confirmation link is invalid or has expired",
          },
        },
        { status: 404 }
      );
    }

    // Check if already confirmed
    const alreadyConfirmed = lead.attendance_confirmed === true;

    // Update if not already confirmed
    if (!alreadyConfirmed) {
      await prisma.crm_leads.update({
        where: { id: lead.id },
        data: {
          attendance_confirmed: true,
          attendance_confirmed_at: new Date(),
        },
      });

      logger.info(
        { leadId: lead.id, email: lead.email },
        "[ConfirmAttendance] Attendance confirmed"
      );
    } else {
      logger.info(
        { leadId: lead.id, email: lead.email },
        "[ConfirmAttendance] Already confirmed"
      );
    }

    // Build reschedule URL using short token (iOS Mail compatible)
    const locale = lead.language || "en";
    const rescheduleUrl = lead.reschedule_token
      ? `/${locale}/r/${lead.reschedule_token}`
      : null;

    return NextResponse.json({
      success: true,
      data: {
        firstName: lead.first_name,
        lastName: lead.last_name,
        companyName: lead.company_name,
        email: lead.email,
        bookingSlotAt: lead.booking_slot_at?.toISOString() || null,
        bookingCalcomUid: lead.booking_calcom_uid,
        rescheduleUrl,
        alreadyConfirmed,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[ConfirmAttendance] Failed to confirm attendance"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to confirm attendance",
        },
      },
      { status: 500 }
    );
  }
}
