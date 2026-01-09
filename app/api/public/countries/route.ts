import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

/**
 * GET /api/public/countries
 * Returns list of countries for dropdowns
 *
 * Query params:
 * - operational=true → Only operational countries (for book-demo wizard)
 * - (default) → All visible countries (for request-demo, includes expansion)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationalOnly = searchParams.get("operational") === "true";

    logger.info(
      `[API] GET /api/public/countries - operationalOnly=${operationalOnly}`
    );

    const countries = await prisma.crm_countries.findMany({
      where: {
        is_visible: true,
        ...(operationalOnly && { is_operational: true }),
      },
      select: {
        id: true,
        country_code: true,
        country_name_en: true,
        country_name_fr: true,
        country_name_ar: true,
        flag_emoji: true,
        is_operational: true,
        country_gdpr: true,
        phone_prefix: true,
        phone_example: true,
        display_order: true,
      },
      orderBy: {
        display_order: "asc",
      },
    });

    logger.info(
      `[API] GET /api/public/countries - Found ${countries.length} countries`
    );

    return NextResponse.json({
      success: true,
      data: countries,
    });
  } catch (error) {
    logger.error({ error }, "[API] GET /api/public/countries - Error");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch countries",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
