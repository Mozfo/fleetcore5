/**
 * Cron Worker: Demo Reminder J-1 (Anti-No-Show)
 *
 * Endpoint: GET /api/cron/demo-reminders/j1
 * Schedule: Daily at 9:00 UTC (10h Paris, 13h Dubai)
 * Trigger: External service (pg_cron, cron-job.org) - NOT Vercel native cron
 * Security: Protected by CRON_SECRET header
 *
 * V6.2.9 - Sends J-1 reminder email to leads with scheduled demos
 *
 * Flow:
 * 1. Query leads with booking_slot_at between NOW()+20h and NOW()+28h
 * 2. Generate confirmation_token for each lead
 * 3. Send DemoReminderJ1 email with confirm + reschedule links
 * 4. Update j1_reminder_sent_at to prevent duplicates
 *
 * @module app/api/cron/demo-reminders/j1/route
 */

import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { DemoReminderJ1 } from "@/emails/templates/DemoReminderJ1";
import type { EmailLocale } from "@/lib/i18n/email-translations";

// ============================================================================
// CONFIG
// ============================================================================

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds max

const _SUPPORTED_LOCALES: EmailLocale[] = ["en", "fr", "ar"];
const DEFAULT_LOCALE: EmailLocale = "en";

// Country to locale mapping (simplified)
const COUNTRY_LOCALE_MAP: Record<string, EmailLocale> = {
  FR: "fr",
  AE: "en", // UAE uses English for business
  SA: "ar",
  MA: "fr", // Morocco uses French
  TN: "fr", // Tunisia uses French
  DZ: "fr", // Algeria uses French
  EG: "ar",
  JO: "ar",
  LB: "ar",
  KW: "ar",
  QA: "ar",
  BH: "ar",
  OM: "ar",
};

// ============================================================================
// TYPES
// ============================================================================

interface LeadToNotify {
  id: string;
  email: string;
  first_name: string | null;
  company_name: string | null;
  phone: string | null;
  fleet_size: string | null;
  country_code: string | null;
  booking_slot_at: Date;
  booking_calcom_uid: string | null;
}

interface ProcessResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{ leadId: string; error: string }>;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get locale for a country code
 */
function getLocaleForCountry(countryCode: string | null): EmailLocale {
  if (!countryCode) return DEFAULT_LOCALE;
  return COUNTRY_LOCALE_MAP[countryCode.toUpperCase()] || DEFAULT_LOCALE;
}

/**
 * Format date for email (localized)
 */
function formatBookingDate(date: Date, locale: EmailLocale): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const localeMap: Record<EmailLocale, string> = {
    en: "en-US",
    fr: "fr-FR",
    ar: "ar-SA",
  };

  return new Intl.DateTimeFormat(localeMap[locale], options).format(date);
}

/**
 * Format time for email (localized)
 */
function formatBookingTime(date: Date, locale: EmailLocale): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale === "en",
  };

  const localeMap: Record<EmailLocale, string> = {
    en: "en-US",
    fr: "fr-FR",
    ar: "ar-SA",
  };

  return new Intl.DateTimeFormat(localeMap[locale], options).format(date);
}

/**
 * Get timezone abbreviation from date
 */
function getTimezoneAbbr(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const sign = offset >= 0 ? "+" : "-";
  return `GMT${sign}${hours}`;
}

/**
 * Get fleet size label
 */
function getFleetSizeLabel(fleetSize: string | null): string {
  if (!fleetSize) return "N/A";

  const labels: Record<string, string> = {
    "1": "1 vehicle",
    "2-5": "2-5 vehicles",
    "6-10": "6-10 vehicles",
    "11-20": "11-20 vehicles",
    "21-50": "21-50 vehicles",
    "51-100": "51-100 vehicles",
    "100+": "100+ vehicles",
  };

  return labels[fleetSize] || fleetSize;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // ========================================
    // SECURITY: Validate cron secret
    // ========================================
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error({}, "[DemoReminderJ1] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    // Accept both Bearer token and x-cron-secret header
    const xCronSecret = request.headers.get("x-cron-secret");
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || xCronSecret === cronSecret;

    if (!isAuthorized) {
      logger.warn(
        { authHeader: authHeader ? "present" : "missing" },
        "[DemoReminderJ1] Unauthorized request"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ========================================
    // CHECK: Resend API key
    // ========================================
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      logger.error({}, "[DemoReminderJ1] RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fleetcore.io";

    // ========================================
    // QUERY: Leads to notify (J-1 window)
    // ========================================
    const now = new Date();
    const minTime = new Date(now.getTime() + 20 * 60 * 60 * 1000); // +20 hours
    const maxTime = new Date(now.getTime() + 28 * 60 * 60 * 1000); // +28 hours

    logger.info(
      {
        minTime: minTime.toISOString(),
        maxTime: maxTime.toISOString(),
      },
      "[DemoReminderJ1] Querying leads in J-1 window"
    );

    const leadsToNotify = await prisma.crm_leads.findMany({
      where: {
        status: "demo_scheduled",
        booking_slot_at: {
          gte: minTime,
          lte: maxTime,
        },
        j1_reminder_sent_at: null,
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        company_name: true,
        phone: true,
        fleet_size: true,
        country_code: true,
        booking_slot_at: true,
        booking_calcom_uid: true,
      },
    });

    logger.info(
      { count: leadsToNotify.length },
      "[DemoReminderJ1] Found leads to notify"
    );

    if (leadsToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No leads to notify",
        sent: 0,
        failed: 0,
        skipped: 0,
        durationMs: Date.now() - startTime,
      });
    }

    // ========================================
    // PROCESS: Send emails
    // ========================================
    const result: ProcessResult = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    for (const lead of leadsToNotify as LeadToNotify[]) {
      try {
        // Skip if missing critical data
        if (!lead.email || !lead.booking_slot_at) {
          logger.warn(
            { leadId: lead.id },
            "[DemoReminderJ1] Skipping lead - missing email or booking"
          );
          result.skipped++;
          continue;
        }

        // Generate confirmation token
        const confirmationToken = randomUUID();

        // Determine locale
        const locale = getLocaleForCountry(lead.country_code);

        // Build URLs
        const confirmUrl = `${baseUrl}/api/crm/leads/confirm-attendance?token=${confirmationToken}`;
        const rescheduleUrl = lead.booking_calcom_uid
          ? `${baseUrl}/book-demo/reschedule?uid=${lead.booking_calcom_uid}`
          : `${baseUrl}/book-demo`;

        // Format date/time
        const bookingDate = formatBookingDate(lead.booking_slot_at, locale);
        const bookingTime = formatBookingTime(lead.booking_slot_at, locale);
        const timezone = getTimezoneAbbr(lead.booking_slot_at);

        // Render email
        const html = await render(
          DemoReminderJ1({
            locale,
            firstName: lead.first_name || "there",
            companyName: lead.company_name || "your company",
            bookingDate,
            bookingTime,
            timezone,
            phone: lead.phone || "N/A",
            fleetSize: getFleetSizeLabel(lead.fleet_size),
            confirmUrl,
            rescheduleUrl,
          })
        );

        // Send email
        const subject =
          locale === "fr"
            ? `Demain à ${bookingTime} - Merci de confirmer votre démo FleetCore`
            : locale === "ar"
              ? `غداً في ${bookingTime} - يرجى تأكيد عرض FleetCore التوضيحي`
              : `Tomorrow at ${bookingTime} - Please confirm your FleetCore demo`;

        const { error: sendError } = await resend.emails.send({
          from: "FleetCore <demos@fleetcore.io>",
          to: lead.email,
          subject,
          html,
        });

        if (sendError) {
          throw new Error(sendError.message);
        }

        // Update lead with token and sent timestamp
        await prisma.crm_leads.update({
          where: { id: lead.id },
          data: {
            confirmation_token: confirmationToken,
            j1_reminder_sent_at: new Date(),
          },
        });

        logger.info(
          { leadId: lead.id, email: lead.email, locale },
          "[DemoReminderJ1] Email sent successfully"
        );

        result.sent++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logger.error(
          { leadId: lead.id, error: errorMessage },
          "[DemoReminderJ1] Failed to send email"
        );
        result.failed++;
        result.errors.push({ leadId: lead.id, error: errorMessage });
      }
    }

    // ========================================
    // RESPONSE
    // ========================================
    const duration = Date.now() - startTime;

    logger.info(
      { ...result, durationMs: duration },
      "[DemoReminderJ1] Cron completed"
    );

    return NextResponse.json({
      success: true,
      ...result,
      durationMs: duration,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const duration = Date.now() - startTime;

    logger.error(
      { error: errorMessage, durationMs: duration },
      "[DemoReminderJ1] Cron failed"
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}
