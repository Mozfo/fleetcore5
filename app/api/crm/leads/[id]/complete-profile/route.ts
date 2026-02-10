/**
 * PATCH /api/crm/leads/[id]/complete-profile
 *
 * V6.6 - Complete lead profile (Wizard Step 3)
 *
 * Saves first_name, last_name, phone, company_name, fleet_size.
 * Sets wizard_completed = true.
 * Does NOT change status (remains email_verified until booking/callback).
 *
 * Prerequisites:
 * - Lead must exist and have email_verified = true
 *
 * Security:
 * - Public endpoint (no auth required - wizard flow)
 *
 * @module app/api/crm/leads/[id]/complete-profile/route
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { wizardLeadService } from "@/lib/services/crm/wizard-lead.service";
import { logger } from "@/lib/logger";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const completeProfileSchema = z.object({
  first_name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name too long")
    .trim(),
  last_name: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name too long")
    .trim(),
  phone: z.string().min(1, "Phone is required").trim().optional(),
  company_name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name too long")
    .trim(),
  fleet_size: z.string().min(1, "Fleet size is required"),
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
    const validationResult = completeProfileSchema.safeParse(body);

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
    const lead = await wizardLeadService.getLeadById(leadId);

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
            message: "Email must be verified before completing profile",
          },
        },
        { status: 400 }
      );
    }

    // Idempotent: if already completed, return success
    if (lead.wizard_completed) {
      logger.info(
        { leadId },
        "[CompleteProfile] Profile already completed - returning success"
      );
      return NextResponse.json({
        success: true,
        data: {
          leadId: lead.id,
          status: lead.status,
          profile_completed: true,
        },
      });
    }

    // Get client IP for GDPR audit
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const {
      first_name,
      last_name,
      phone,
      company_name,
      fleet_size,
      gdpr_consent,
    } = validationResult.data;

    // Complete profile via service
    await wizardLeadService.completeProfile(leadId, {
      first_name,
      last_name,
      company_name,
      phone,
      fleet_size,
      gdpr_consent,
      consent_ip: gdpr_consent ? clientIp : undefined,
    });

    logger.info(
      {
        leadId,
        company_name,
        fleet_size,
        gdpr_consent,
      },
      "[CompleteProfile] Profile completed successfully"
    );

    return NextResponse.json({
      success: true,
      data: {
        leadId,
        status: lead.status,
        profile_completed: true,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[CompleteProfile] Failed to complete profile"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to complete profile",
        },
      },
      { status: 500 }
    );
  }
}
