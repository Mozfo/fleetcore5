/**
 * PATCH /api/crm/leads/[id]/complete-wizard
 *
 * V6.2.3 - Save business info and mark wizard as completed
 *
 * Called from step-3 after successful Cal.com booking.
 * Saves company_name, phone, fleet_size, gdpr_consent.
 * Sets wizard_completed=true and updates status to "demo".
 *
 * Prerequisites:
 * - Lead must exist and have email_verified = true
 *
 * Security:
 * - Public endpoint (no auth required)
 * - Lead must have valid email_verified status
 *
 * @module app/api/crm/leads/[id]/complete-wizard/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const completeWizardSchema = z.object({
  company_name: z.string().min(1),
  phone: z.string().min(1),
  fleet_size: z.string().min(1),
  gdpr_consent: z.boolean().optional().default(false),
  wizard_completed: z.literal(true),
});

// ============================================================================
// HANDLER
// ============================================================================

export async function PATCH(
  request: NextRequest,
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = completeWizardSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              validationResult.error.issues[0]?.message || "Invalid data",
          },
        },
        { status: 400 }
      );
    }

    // Fetch lead to verify prerequisites
    const lead = await prisma.crm_leads.findFirst({
      where: {
        id: leadId,
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        email_verified: true,
        booking_slot_at: true,
        booking_calcom_uid: true,
        status: true,
        wizard_completed: true,
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

    // Check email is verified
    if (!lead.email_verified) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_NOT_VERIFIED",
            message: "Email must be verified before completing wizard",
          },
        },
        { status: 400 }
      );
    }

    // Idempotent: if already completed, return success
    if (lead.wizard_completed) {
      logger.info(
        { leadId },
        "[CompleteWizard] Wizard already completed - returning success"
      );
      return NextResponse.json({
        success: true,
        message: "Wizard already completed",
      });
    }

    // Determine new status based on booking
    const hasBooking = !!(lead.booking_slot_at && lead.booking_calcom_uid);
    const newStatus = hasBooking ? "demo" : lead.status;

    // Get client IP for GDPR audit (same pattern as business-info route)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Update lead - save business info and mark wizard as completed
    const { company_name, phone, fleet_size, gdpr_consent } =
      validationResult.data;

    const updatedLead = await prisma.crm_leads.update({
      where: { id: leadId },
      data: {
        company_name,
        phone,
        fleet_size,
        gdpr_consent,
        consent_at: gdpr_consent ? new Date() : null,
        consent_ip: gdpr_consent ? clientIp : null,
        wizard_completed: true,
        status: newStatus,
        updated_at: new Date(),
      },
    });

    logger.info(
      {
        leadId,
        email: lead.email,
        hasBooking,
        newStatus,
        gdpr_consent,
        consent_ip: gdpr_consent ? clientIp : null,
      },
      "[CompleteWizard] Wizard completed successfully"
    );

    return NextResponse.json({
      success: true,
      message: "Wizard completed successfully",
      data: {
        id: updatedLead.id,
        email: updatedLead.email,
        status: updatedLead.status,
        wizard_completed: updatedLead.wizard_completed,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[CompleteWizard] Failed to complete wizard"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to complete wizard",
        },
      },
      { status: 500 }
    );
  }
}
