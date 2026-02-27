/**
 * Fleet Size Server Helper
 *
 * Single source of truth for valid fleet_size values.
 * Reads from crm_settings.fleet_size_options with in-memory cache (5 min).
 *
 * Usage (server-side only):
 *   import { getValidFleetSizeValues } from "@/lib/helpers/fleet-size.server";
 *   const validSizes = await getValidFleetSizeValues();
 *
 * @module lib/helpers/fleet-size.server
 */

import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ── Cache ────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedValues: string[] | null = null;
let cachedAt = 0;

// ── Fallback (aligned with crm_settings source of truth) ────────────────

const FALLBACK_FLEET_SIZES = ["2-10", "11-50", "50+"];

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Returns the list of valid fleet_size values from crm_settings.
 * Results are cached in memory for 5 minutes.
 * Falls back to ["2-10", "11-50", "50+"] if DB is unavailable.
 */
export async function getValidFleetSizeValues(): Promise<string[]> {
  const now = Date.now();

  if (cachedValues && now - cachedAt < CACHE_TTL_MS) {
    return cachedValues;
  }

  try {
    const setting = await db.crm_settings.findUnique({
      where: { setting_key: "fleet_size_options" },
      select: { setting_value: true },
    });

    if (setting?.setting_value) {
      const value = setting.setting_value as {
        options?: Array<{
          value: string;
          is_active?: boolean;
        }>;
      };

      if (value.options && Array.isArray(value.options)) {
        const active = value.options
          .filter((o) => o.is_active !== false)
          .map((o) => o.value);

        if (active.length > 0) {
          cachedValues = active;
          cachedAt = now;
          return active;
        }
      }
    }
  } catch (error) {
    logger.warn(
      { error },
      "[fleet-size.server] Failed to load fleet_size_options from DB, using fallback"
    );
  }

  // Fallback
  cachedValues = FALLBACK_FLEET_SIZES;
  cachedAt = now;
  return FALLBACK_FLEET_SIZES;
}
