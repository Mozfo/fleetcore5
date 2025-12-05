/**
 * Lead Score Recalculation API
 *
 * POST /api/v1/crm/leads/[id]/recalculate
 *
 * Triggers score recalculation for a specific lead.
 * All thresholds and weights loaded from crm_settings (NOT hardcoded).
 *
 * Auth: FleetCore Admin only
 *
 * @module app/api/v1/crm/leads/[id]/recalculate/route
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { LeadScoringService } from "@/lib/services/crm/lead-scoring.service";
import { logger } from "@/lib/logger";

const ADMIN_ORG_ID = process.env.FLEETCORE_ADMIN_ORG_ID;

// Request body schema
const RecalculateRequestSchema = z.object({
  force: z.boolean().optional().default(false),
});

/**
 * POST /api/v1/crm/leads/[id]/recalculate
 *
 * Recalculates scores for a specific lead and returns the result.
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing lead ID
 * @returns JSON response with recalculation result
 *
 * @example
 * ```bash
 * curl -X POST /api/v1/crm/leads/uuid-here/recalculate \
 *   -H "Authorization: Bearer ..." \
 *   -H "Content-Type: application/json" \
 *   -d '{"force": true}'
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // 3. Validate lead ID
    const { id: leadId } = await params;
    const uuidResult = z.string().uuid("Invalid lead ID").safeParse(leadId);
    if (!uuidResult.success) {
      return NextResponse.json(
        { error: "Invalid lead ID format" },
        { status: 400 }
      );
    }

    // 4. Parse request body (optional)
    let body: z.infer<typeof RecalculateRequestSchema> = { force: false };
    try {
      const rawBody = await request.json();
      const parseResult = RecalculateRequestSchema.safeParse(rawBody);
      if (parseResult.success) {
        body = parseResult.data;
      }
    } catch {
      // Empty body is fine, use defaults
    }

    // 5. Call scoring service
    const scoringService = new LeadScoringService();
    const result = await scoringService.recalculateScores(leadId);

    logger.info(
      {
        leadId,
        userId,
        stageChanged: result.stageChanged,
        previousStage: result.previousStage,
        newStage: result.newStage,
        force: body.force,
      },
      "[POST /recalculate] Score recalculation completed"
    );

    // 6. Return result
    return NextResponse.json({
      success: true,
      leadId: result.leadId,
      previousScores: result.previousScores,
      newScores: result.newScores,
      previousStage: result.previousStage,
      newStage: result.newStage,
      stageChanged: result.stageChanged,
      notificationQueued: result.notificationQueued,
    });
  } catch (error) {
    logger.error({ error }, "[POST /recalculate] Error");

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to recalculate scores" },
      { status: 500 }
    );
  }
}
