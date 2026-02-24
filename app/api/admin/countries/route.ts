import { NextResponse } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET — return operational countries (JOIN crm_countries + dir_country_locales) */
export async function GET() {
  try {
    await requireCrmApiAuth();

    const countries = await prisma.crm_countries.findMany({
      where: { is_operational: true },
      orderBy: { country_name_en: "asc" },
      select: {
        country_code: true,
        country_name_en: true,
        country_name_fr: true,
        flag_emoji: true,
        phone_prefix: true,
        phone_example: true,
        phone_min_digits: true,
      },
    });

    // Enrich with currency/timezone from dir_country_locales
    const codes = countries.map((c) => c.country_code);
    const locales = await prisma.dir_country_locales.findMany({
      where: { country_code: { in: codes }, deleted_at: null },
      select: {
        country_code: true,
        currency: true,
        timezone: true,
      },
    });
    const localeMap = new Map(locales.map((l) => [l.country_code, l]));

    const data = countries.map((c) => {
      const locale = localeMap.get(c.country_code);
      return {
        country_code: c.country_code,
        country_name_en: c.country_name_en,
        country_name_fr: c.country_name_fr,
        flag_emoji: c.flag_emoji,
        phone_prefix: c.phone_prefix,
        phone_example: c.phone_example,
        phone_min_digits: c.phone_min_digits,
        currency: locale?.currency ?? "EUR",
        timezone: locale?.timezone ?? "UTC",
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
