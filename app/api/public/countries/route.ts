import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

/**
 * GET /api/public/countries
 * Returns list of visible countries for request-demo dropdown
 * Operational countries (UAE, FR) → lead_confirmation
 * Expansion countries (ES, IT, DE...) → expansion_opportunity
 */
export async function GET(_request: NextRequest) {
  try {
    logger.info("[API] GET /api/public/countries - Fetching visible countries");

    const countries = await prisma.crm_countries.findMany({
      where: {
        is_visible: true,
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
