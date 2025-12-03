/**
 * Cron Worker: Detect Rotting Opportunities
 *
 * Endpoint: GET /api/cron/opportunities/rotting
 * Schedule: Daily at 8:00 AM UTC (configure in vercel.json)
 * Security: Protected by CRON_SECRET header
 *
 * Created: Session #30 (2025-12-01)
 * Purpose: Detect opportunities stuck in a stage too long
 *
 * Vercel cron config (add to vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/opportunities/rotting",
 *     "schedule": "0 8 * * *"
 *   }]
 * }
 */

import { NextResponse } from "next/server";
import { OpportunityRottingService } from "@/lib/services/crm/opportunity-rotting.service";
import { logger } from "@/lib/logger";

// Vercel cron jobs call GET
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds max for cron

/**
 * GET /api/cron/opportunities/rotting
 *
 * Called by Vercel cron daily to detect rotting opportunities.
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // SECURITY: Validate cron secret (Vercel sets Authorization header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error({}, "CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    // Vercel sends: Authorization: Bearer <CRON_SECRET>
    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn(
        { authHeader: authHeader ? "present but invalid" : "missing" },
        "Unauthorized cron request (rotting)"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process rotting detection
    const service = new OpportunityRottingService();
    const result = await service.processRottingOpportunities();

    const duration = Date.now() - startTime;

    logger.info(
      {
        ...result,
        durationMs: duration,
      },
      "Cron: opportunity rotting detection completed"
    );

    return NextResponse.json(
      {
        success: true,
        ...result,
        durationMs: duration,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const duration = Date.now() - startTime;

    logger.error(
      {
        error: errorMessage,
        durationMs: duration,
      },
      "Cron: opportunity rotting detection failed"
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
