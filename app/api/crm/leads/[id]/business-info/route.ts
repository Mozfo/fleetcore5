/**
 * PATCH /api/crm/leads/[id]/business-info
 *
 * V6.2.3 - Save business info from Book Demo wizard step-2
 *
 * Saves lead business info WITHOUT completing the wizard.
 * The wizard is completed after Cal.com booking in step-3.
 *
 * Updates:
 * - first_name, last_name, company_name
 * - phone
 * - platforms_used (JSON array)
 * - gdpr_consent (boolean)
 *
 * Note: country_code and fleet_size are now collected in Step 1
 * and are already saved on the lead. This API no longer requires them.
 *
 * Prerequisites:
 * - Lead must exist and have email_verified = true
 * - Lead must have country_code (from Step 1) for GDPR validation
 *
 * @module app/api/crm/leads/[id]/business-info/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const businessInfoSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  company_name: z.string().min(1, "Company name is required"),
  phone: z.string().nullable().optional(),
  platforms_used: z.array(z.string()).optional().default([]),
  gdpr_consent: z.boolean().optional().default(false),
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
    const validationResult = businessInfoSchema.safeParse(body);

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

    // Fetch lead to verify prerequisites (includes country_code from Step 1)
    const lead = await prisma.crm_leads.findFirst({
      where: {
        id: leadId,
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        email_verified: true,
        country_code: true,
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
            message: "Email must be verified first",
          },
        },
        { status: 400 }
      );
    }

    // Check lead has country_code from Step 1
    if (!lead.country_code) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "COUNTRY_NOT_SET",
            message: "Country must be set first (from Step 1)",
          },
        },
        { status: 400 }
      );
    }

    // Verify country exists and get GDPR flag
    const country = await prisma.crm_countries.findFirst({
      where: { country_code: lead.country_code },
      select: { country_code: true, country_gdpr: true },
    });

    if (!country) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_COUNTRY",
            message: "Invalid country code on lead",
          },
        },
        { status: 400 }
      );
    }

    // Check GDPR consent if required (based on lead's country from Step 1)
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

    // Get client IP for GDPR audit
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Update lead with business info (wizard NOT completed yet)
    // Note: country_code and fleet_size are already saved from Step 1
    const updatedLead = await prisma.crm_leads.update({
      where: { id: leadId },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name,
        phone: data.phone || null,
        platforms_used: data.platforms_used,
        gdpr_consent: data.gdpr_consent,
        consent_ip: data.gdpr_consent ? clientIp : null,
        consent_at: data.gdpr_consent ? new Date() : null,
        updated_at: new Date(),
      },
    });

    logger.info(
      {
        leadId,
        email: lead.email,
        country_code: lead.country_code,
        gdpr_consent: data.gdpr_consent,
      },
      "[BusinessInfo] Business info saved"
    );

    return NextResponse.json({
      success: true,
      message: "Business info saved",
      data: {
        id: updatedLead.id,
        email: updatedLead.email,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[BusinessInfo] Failed to save business info"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to save business info",
        },
      },
      { status: 500 }
    );
  }
}
