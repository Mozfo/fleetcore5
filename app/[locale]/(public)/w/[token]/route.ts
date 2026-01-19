/**
 * Short URL Redirect for Waitlist Survey
 *
 * V6.3.2 - iOS Mail compatible short URLs
 *
 * GET /[locale]/w/[token] → 302 redirect → /[db_locale]/waitlist-survey?id=[uuid]
 *
 * Example:
 *   /en/w/Xk9mP2 → /fr/waitlist-survey?id=2d025a27-... (if user's locale is fr)
 *
 * Note: The redirect uses the locale stored in DB (user's preference at signup)
 * not the URL locale, to ensure consistent language experience.
 *
 * @module app/[locale]/(public)/w/[token]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; token: string }> }
): Promise<NextResponse> {
  try {
    const { locale: urlLocale, token } = await params;

    if (!token || token.length < 4 || token.length > 8) {
      return NextResponse.redirect(new URL(`/${urlLocale}`, request.url));
    }

    // Find waitlist entry by short_token
    const entry = await db.crm_waitlist.findUnique({
      where: { short_token: token },
      select: {
        id: true,
        locale: true,
      },
    });

    if (!entry) {
      logger.warn({ token }, "[ShortURL] Token not found");
      return NextResponse.redirect(new URL(`/${urlLocale}`, request.url));
    }

    // Use locale from DB (user's preference) for consistent experience
    const targetLocale = entry.locale || urlLocale || "en";
    const redirectUrl = new URL(
      `/${targetLocale}/waitlist-survey?id=${entry.id}`,
      request.url
    );

    logger.info(
      { token, id: entry.id, locale: targetLocale },
      "[ShortURL] Redirecting to waitlist survey"
    );

    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    logger.error({ error }, "[ShortURL] Redirect failed");
    return NextResponse.redirect(new URL("/en", request.url));
  }
}
