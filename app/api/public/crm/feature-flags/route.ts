/**
 * Public API: CRM Feature Flags
 *
 * GET /api/public/crm/feature-flags
 *
 * Returns UI feature flags from crm_settings.feature_flags
 * Used by sidebar to conditionally hide Opportunities and Quotes.
 *
 * This endpoint is public (no auth) because it only returns UI flags.
 *
 * V6.2-11: Phase 1 - Sidebar refactor
 *
 * @module app/api/public/crm/feature-flags/route
 */

import { NextResponse } from "next/server";
import { CrmSettingsRepository } from "@/lib/repositories/crm/settings.repository";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ============================================================================
// Types
// ============================================================================

interface FeatureFlagsValue {
  version: string;
  opportunities_enabled: boolean;
  quotes_enabled: boolean;
  description?: string;
}

// ============================================================================
// Handler
// ============================================================================

export async function GET() {
  try {
    const repo = new CrmSettingsRepository(db);
    const featureFlags =
      await repo.getSettingValue<FeatureFlagsValue>("feature_flags");

    // Default values if setting doesn't exist
    const flags = {
      opportunities_enabled: featureFlags?.opportunities_enabled ?? false,
      quotes_enabled: featureFlags?.quotes_enabled ?? false,
    };

    return NextResponse.json(
      {
        success: true,
        data: flags,
      },
      {
        status: 200,
        headers: {
          // Cache for 5 minutes (feature flags don't change often)
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  } catch (error) {
    logger.error(
      { error },
      "[PublicCrmFeatureFlags] Error fetching feature flags"
    );

    // Return default values on error (fail-safe: hide features)
    return NextResponse.json(
      {
        success: true,
        data: {
          opportunities_enabled: false,
          quotes_enabled: false,
        },
      },
      { status: 200 }
    );
  }
}
