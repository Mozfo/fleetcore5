/**
 * Public Fleet Size Options API
 *
 * Returns fleet size options from crm_settings for public pages
 * (waitlist survey, book demo, etc.)
 *
 * GET /api/public/fleet-size-options
 *
 * @module app/api/public/fleet-size-options/route
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// Default options matching crm_settings.fleet_size_options (critical_crm_settings.sql)
// These are fallbacks - actual values loaded from database
const DEFAULT_OPTIONS = [
  { value: "1-10", label_en: "1-10", label_fr: "1-10", order: 1 },
  { value: "11-50", label_en: "11-50", label_fr: "11-50", order: 2 },
  { value: "51-100", label_en: "51-100", label_fr: "51-100", order: 3 },
  { value: "101-500", label_en: "101-500", label_fr: "101-500", order: 4 },
  { value: "500+", label_en: "500+", label_fr: "500+", order: 5 },
];

export async function GET() {
  try {
    const setting = await db.crm_settings.findUnique({
      where: { setting_key: "fleet_size_options" },
      select: { setting_value: true },
    });

    if (setting?.setting_value) {
      const value = setting.setting_value as {
        options?: Array<{
          value: string;
          label_en: string;
          label_fr: string;
          label_ar?: string;
          order: number;
          is_active?: boolean;
        }>;
      };

      if (value.options && Array.isArray(value.options)) {
        // Filter active options and sort by order
        const activeOptions = value.options
          .filter((o) => o.is_active !== false)
          .sort((a, b) => a.order - b.order)
          .map((o) => ({
            value: o.value,
            label_en: o.label_en,
            label_fr: o.label_fr,
            label_ar: o.label_ar,
          }));

        return NextResponse.json({
          success: true,
          data: activeOptions,
        });
      }
    }

    // Return defaults if no settings found
    return NextResponse.json({
      success: true,
      data: DEFAULT_OPTIONS.map((o) => ({
        value: o.value,
        label_en: o.label_en,
        label_fr: o.label_fr,
      })),
    });
  } catch {
    // Return defaults on error
    return NextResponse.json({
      success: true,
      data: DEFAULT_OPTIONS.map((o) => ({
        value: o.value,
        label_en: o.label_en,
        label_fr: o.label_fr,
      })),
    });
  }
}
