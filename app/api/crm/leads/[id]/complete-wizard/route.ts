/**
 * PATCH /api/crm/leads/[id]/complete-wizard
 *
 * V6.2.2 - Complete Book Demo wizard (public endpoint)
 *
 * Updates lead with business info from wizard step 3:
 * - first_name, last_name, company_name
 * - phone, country_code, fleet_size
 * - platforms_used (JSON array)
 * - gdpr_consent (boolean)
 * - wizard_completed: true
 * - status: "demo_booked" (if has booking)
 *
 * Prerequisites:
 * - Lead must exist and have email_verified = true
 *
 * Security:
 * - Public endpoint (no auth required)
 * - Lead must have valid email_verified status
 * - Rate limited via middleware
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
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  company_name: z.string().min(1, "Company name is required"),
  phone: z.string().nullable().optional(),
  country_code: z.string().min(2, "Country is required").max(2),
  fleet_size: z.string().min(1, "Fleet size is required"),
  platforms_used: z.array(z.string()).optional().default([]),
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
            message: "Invalid input data",
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

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
        crm_countries: {
          select: {
            country_code: true,
            country_gdpr: true,
          },
        },
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

    // Check if wizard already completed (idempotent - just return success)
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

    // Verify country exists
    const country = await prisma.crm_countries.findFirst({
      where: { country_code: data.country_code },
      select: { country_code: true, country_gdpr: true },
    });

    if (!country) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_COUNTRY",
            message: "Invalid country code",
          },
        },
        { status: 400 }
      );
    }

    // Check GDPR consent if required
    if (country.country_gdpr && !data.gdpr_consent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GDPR_CONSENT_REQUIRED",
            message: "GDPR consent is required for EU/EEA countries",
          },
        },
        { status: 400 }
      );
    }

    // Determine new status based on booking
    const hasBooking = !!(lead.booking_slot_at && lead.booking_calcom_uid);
    const newStatus = hasBooking ? "demo_booked" : lead.status;

    // Get client IP for GDPR audit
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Update lead with wizard data
    const updatedLead = await prisma.crm_leads.update({
      where: { id: leadId },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name,
        phone: data.phone || null,
        country_code: data.country_code,
        fleet_size: data.fleet_size,
        platforms_used: data.platforms_used,
        gdpr_consent: data.gdpr_consent,
        consent_ip: data.gdpr_consent ? clientIp : null,
        consent_at: data.gdpr_consent ? new Date() : null,
        wizard_completed: true,
        status: newStatus,
        updated_at: new Date(),
      },
    });

    logger.info(
      {
        leadId,
        email: lead.email,
        country_code: data.country_code,
        fleet_size: data.fleet_size,
        hasBooking,
        newStatus,
        gdpr_consent: data.gdpr_consent,
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
