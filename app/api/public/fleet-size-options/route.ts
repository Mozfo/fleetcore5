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

// Default options aligned with wizard Step 3 (source of truth)
// These are fallbacks - actual values loaded from database
const DEFAULT_OPTIONS = [
  { value: "2-10", label_en: "2-10", label_fr: "2-10", order: 1 },
  { value: "11-50", label_en: "11-50", label_fr: "11-50", order: 2 },
  { value: "50+", label_en: "50+", label_fr: "50+", order: 3 },
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
