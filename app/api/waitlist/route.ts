/**
 * Waitlist API
 *
 * V6.2.3 - Endpoint pour collecter les leads des pays non-opérationnels
 * V6.3   - Marketing email flow:
 * V6.4   - Server-side GeoIP detection (fixes race condition from frontend)
 *   - Creates pending waitlist entry (marketing_consent = false)
 *   - Sends marketing-focused email with:
 *     1. "Thank you for your interest" title
 *     2. Why FleetCore (benefits pitch)
 *     3. Help us prepare (link to survey)
 *     4. Stay informed (link to survey for opt-in)
 *   - GDPR consent collected via survey page (checkbox for EU countries)
 *   - Opt-in happens via survey page (marketing_consent = true)
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
import { Resend } from "resend";
import { render } from "@react-email/render";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { geoIPService } from "@/lib/services/geo/geoip.service";
import ExpansionOpportunity from "@/emails/templates/ExpansionOpportunity";
import type { EmailLocale } from "@/lib/i18n/email-translations";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================================
// SHORT TOKEN GENERATION
// ============================================================================
// Generates a 6-character alphanumeric token for short URLs (iOS Mail compatible)
// Uses base62 (a-z, A-Z, 0-9) = 62^6 = 56+ billion combinations
const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateShortToken(length = 6): string {
  let token = "";
  for (let i = 0; i < length; i++) {
    token += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return token;
}

// ============================================================================
// VALIDATION
// ============================================================================

const WaitlistSchema = z.object({
  email: z.string().email(),
  country_code: z.string().min(2).max(2),
  fleet_size: z.string().optional().nullable(), // Optional - collected via email survey
  gdpr_consent: z.boolean().optional().default(false),
  detected_country_code: z.string().min(2).max(2).optional().nullable(),
  locale: z.string().optional().default("en"),
  honeypot: z.string().max(0).optional(),
  marketing_consent: z.boolean().optional().default(false), // V6.3: false = pending, true = opted-in via email
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

    // V6.4: Server-side GeoIP detection (more reliable than frontend race condition)
    let serverDetectedCountry: string | null = null;
    try {
      serverDetectedCountry = await geoIPService.getCountryFromIP(clientIP);
    } catch (error) {
      logger.warn(
        { ip: clientIP, error },
        "[Waitlist] GeoIP detection failed - continuing without"
      );
    }

    // Use server detection, fallback to frontend if server returns null
    const finalDetectedCountry =
      serverDetectedCountry || data.detected_country_code || null;

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
      select: {
        is_operational: true,
        country_gdpr: true,
        country_name_en: true,
        country_name_fr: true,
        country_preposition_en: true,
        country_preposition_fr: true,
      },
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

    // Create waitlist entry using Prisma relation syntax
    // V6.3: marketing_consent = false (pending) until user clicks opt-in in email
    // V6.3.2: Generate short_token for iOS Mail compatible short URLs
    const waitlistEntry = await db.crm_waitlist.create({
      data: {
        email: data.email.toLowerCase().trim(),
        short_token: generateShortToken(),
        crm_countries: {
          connect: { country_code: data.country_code },
        },
        fleet_size: data.fleet_size || null,
        detected_country_code: finalDetectedCountry,
        ip_address: clientIP,
        marketing_consent: data.marketing_consent, // false = pending, true = opted-in
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

    // ========================================================================
    // V6.3 - SEND EXPANSION OPPORTUNITY EMAIL
    // ========================================================================
    try {
      const emailLocale = (data.locale === "fr" ? "fr" : "en") as EmailLocale;
      const countryName =
        emailLocale === "fr"
          ? country.country_name_fr
          : country.country_name_en;
      const countryPreposition =
        emailLocale === "fr"
          ? country.country_preposition_fr
          : country.country_preposition_en;

      // Build survey URL with short token for iOS Mail compatibility
      // Use fleetcore.io (not app.fleetcore.io) + locale + short token = ~31 chars vs 82
      const surveyUrl = `https://fleetcore.io/${emailLocale}/w/${waitlistEntry.short_token}`;

      const emailHtml = await render(
        ExpansionOpportunity({
          locale: emailLocale,
          country_preposition: countryPreposition || "",
          country_name: countryName || data.country_code,
          survey_url: surveyUrl,
        })
      );

      await resend.emails.send({
        from: "FleetCore <noreply@fleetcore.io>",
        to: data.email,
        subject:
          emailLocale === "fr"
            ? "FleetCore : +30% de CA pour les flottes VTC"
            : "FleetCore: +30% revenue for rideshare fleets",
        html: emailHtml,
      });

      logger.info(
        { email: data.email, country: data.country_code },
        "[Waitlist] ExpansionOpportunity email sent"
      );
    } catch (emailError) {
      // Log error but don't fail the request - waitlist entry was created
      logger.error(
        { error: emailError, email: data.email },
        "[Waitlist] Failed to send ExpansionOpportunity email"
      );
    }

    return NextResponse.json({
      success: true,
      message: "Added to waitlist",
      data: {
        id: waitlistEntry.id,
        country_code: waitlistEntry.country_code,
      },
    });
  } catch (error) {
    logger.error(
      {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      "[Waitlist] Failed to add to waitlist"
    );

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
