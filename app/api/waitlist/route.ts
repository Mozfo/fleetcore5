/**
 * Waitlist API
 *
 * V6.2.3 - Endpoint pour collecter les leads des pays non-opérationnels
 *
 * POST /api/waitlist
 * Body: {
 *   email: string,
 *   country_code: string,
 *   fleet_size: string,
 *   gdpr_consent?: boolean,
 *   detected_country_code?: string,
 *   locale?: string
 * }
 *
 * @module app/api/waitlist/route
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { geoIPService } from "@/lib/services/geo/geoip.service";

// ============================================================================
// VALIDATION
// ============================================================================

const WaitlistSchema = z.object({
  email: z.string().email(),
  country_code: z.string().min(2).max(2),
  fleet_size: z.string().min(1),
  gdpr_consent: z.boolean().optional().default(false),
  detected_country_code: z.string().min(2).max(2).optional().nullable(),
  locale: z.string().optional().default("en"),
  honeypot: z.string().max(0).optional(),
});

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse body
    const body = await request.json();
    const validation = WaitlistSchema.safeParse(body);

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

    const data = validation.data;

    // Check honeypot (bot detection) - silently succeed
    if (data.honeypot && data.honeypot.length > 0) {
      logger.info(
        { email: data.email },
        "[Waitlist] Honeypot triggered - ignoring"
      );
      return NextResponse.json({ success: true, message: "Added to waitlist" });
    }

    // Get client IP for GDPR tracking
    const clientIP = geoIPService.getClientIP(request);

    // Check if email+country already exists
    const existing = await db.crm_waitlist.findFirst({
      where: {
        email: data.email.toLowerCase().trim(),
        country_code: data.country_code,
      },
    });

    if (existing) {
      logger.info(
        { email: data.email, country: data.country_code },
        "[Waitlist] Already on waitlist"
      );
      return NextResponse.json({
        success: false,
        error: {
          code: "ALREADY_ON_WAITLIST",
          message: "You are already on the waitlist for this country",
        },
      });
    }

    // Verify country exists and is not operational
    const country = await db.crm_countries.findUnique({
      where: { country_code: data.country_code },
      select: { is_operational: true, country_gdpr: true },
    });

    if (!country) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "COUNTRY_NOT_FOUND",
            message: "Country not found",
          },
        },
        { status: 400 }
      );
    }

    // If country is operational, they should use the normal flow
    if (country.is_operational) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "COUNTRY_OPERATIONAL",
            message:
              "This country is already operational. Please use the normal booking flow.",
          },
        },
        { status: 400 }
      );
    }

    // Create waitlist entry
    const waitlistEntry = await db.crm_waitlist.create({
      data: {
        email: data.email.toLowerCase().trim(),
        country_code: data.country_code,
        fleet_size: data.fleet_size,
        detected_country_code: data.detected_country_code || null,
        ip_address: clientIP,
        marketing_consent: true,
        gdpr_consent: country.country_gdpr ? data.gdpr_consent : null,
        gdpr_consent_at:
          country.country_gdpr && data.gdpr_consent ? new Date() : null,
        gdpr_consent_ip:
          country.country_gdpr && data.gdpr_consent ? clientIP : null,
        source: "wizard",
        locale: data.locale,
      },
    });

    logger.info(
      {
        id: waitlistEntry.id,
        email: data.email,
        country: data.country_code,
        fleetSize: data.fleet_size,
      },
      "[Waitlist] New entry created"
    );

    return NextResponse.json({
      success: true,
      message: "Added to waitlist",
      data: {
        id: waitlistEntry.id,
        country_code: waitlistEntry.country_code,
      },
    });
  } catch (error) {
    logger.error({ error }, "[Waitlist] Failed to add to waitlist");

    // Handle unique constraint violation gracefully
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({
        success: false,
        error: {
          code: "ALREADY_ON_WAITLIST",
          message: "You are already on the waitlist for this country",
        },
      });
    }

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
