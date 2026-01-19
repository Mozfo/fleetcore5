/**
 * Short URL Redirect for Reschedule/Cancel Booking
 *
 * V6.3.3 - iOS Mail compatible short URLs
 *
 * GET /[locale]/r/[token] → 302 redirect → /[locale]/book-demo/reschedule?uid=[calcom_uid]
 *
 * Example:
 *   /en/r/Xk9mP2 → /en/book-demo/reschedule?uid=xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *
 * @module app/[locale]/(public)/r/[token]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; token: string }> }
): Promise<NextResponse> {
  try {
    const { locale, token } = await params;

    if (!token || token.length < 4 || token.length > 8) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // Find lead by reschedule_token
    const lead = await db.crm_leads.findFirst({
      where: {
        reschedule_token: token,
        deleted_at: null,
      },
      select: {
        id: true,
        booking_calcom_uid: true,
      },
    });

    if (!lead || !lead.booking_calcom_uid) {
      logger.warn(
        { token },
        "[RescheduleShortURL] Token not found or no booking"
      );
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // Build redirect URL to reschedule page
    const redirectUrl = new URL(
      `/${locale}/book-demo/reschedule?uid=${lead.booking_calcom_uid}`,
      request.url
    );

    logger.info(
      { token, leadId: lead.id },
      "[RescheduleShortURL] Redirecting to reschedule page"
    );

    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    logger.error({ error }, "[RescheduleShortURL] Redirect failed");
    return NextResponse.redirect(new URL("/en", request.url));
  }
}
