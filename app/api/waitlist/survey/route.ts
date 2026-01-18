/**
 * Waitlist Survey API
 *
 * V6.3 - Endpoint to confirm opt-in and collect fleet size from email survey
 *
 * GET /api/waitlist/survey?id=xxx
 * - Returns waitlist entry info including GDPR status
 *
 * PATCH /api/waitlist/survey
 * Body: {
 *   id: string (waitlist entry UUID),
 *   fleet_size: string,
 *   marketing_consent: boolean (required for GDPR countries)
 * }
 *
 * @module app/api/waitlist/survey/route
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { geoIPService } from "@/lib/services/geo/geoip.service";

// ============================================================================
// VALIDATION
// ============================================================================

const SurveySchema = z.object({
  id: z.string().uuid(),
  fleet_size: z.string().min(1),
  marketing_consent: z.boolean().optional(), // Required for GDPR countries
});

// ============================================================================
// GET - Fetch waitlist entry info
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MISSING_ID", message: "ID required" },
        },
        { status: 400 }
      );
    }

    const entry = await db.crm_waitlist.findUnique({
      where: { id },
      include: {
        crm_countries: {
          select: {
            country_code: true,
            country_name_en: true,
            country_name_fr: true,
            country_gdpr: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Entry not found" },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: entry.id,
        email: entry.email,
        country_code: entry.country_code,
        country_name_en: entry.crm_countries?.country_name_en,
        country_name_fr: entry.crm_countries?.country_name_fr,
        is_gdpr_country: entry.crm_countries?.country_gdpr === true,
        already_consented: entry.marketing_consent === true,
      },
    });
  } catch (error) {
    logger.error({ error }, "[Waitlist Survey GET] Failed");
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Error" } },
      { status: 500 }
    );
  }
}

// ============================================================================
// HANDLER
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = SurveySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { id, fleet_size, marketing_consent } = validation.data;

    // Find the waitlist entry with country info
    const existing = await db.crm_waitlist.findUnique({
      where: { id },
      include: {
        crm_countries: {
          select: { country_gdpr: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Waitlist entry not found",
          },
        },
        { status: 404 }
      );
    }

    const isGdprCountry = existing.crm_countries?.country_gdpr === true;

    // For GDPR countries, marketing_consent is required
    if (isGdprCountry && marketing_consent !== true) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GDPR_CONSENT_REQUIRED",
            message: "Marketing consent is required for GDPR countries",
          },
        },
        { status: 400 }
      );
    }

    // Get client IP for GDPR documentation
    const clientIP = geoIPService.getClientIP(request);

    // Update fleet size AND confirm opt-in
    const updated = await db.crm_waitlist.update({
      where: { id },
      data: {
        fleet_size,
        marketing_consent: marketing_consent === true,
        // GDPR documentation: record consent timestamp and IP
        ...(isGdprCountry &&
          marketing_consent === true && {
            gdpr_consent: true,
            gdpr_consent_at: new Date(),
            gdpr_consent_ip: clientIP,
          }),
      },
    });

    logger.info(
      { id, fleet_size, email: updated.email },
      "[Waitlist Survey] Opt-in confirmed and fleet size updated"
    );

    return NextResponse.json({
      success: true,
      message: "Thank you for sharing your fleet details!",
      data: {
        id: updated.id,
        fleet_size: updated.fleet_size,
      },
    });
  } catch (error) {
    logger.error({ error }, "[Waitlist Survey] Failed to update");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
