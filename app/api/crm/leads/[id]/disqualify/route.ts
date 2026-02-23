/**
 * POST /api/crm/leads/[id]/disqualify
 *
 * V6.6 - Disqualify a lead with audit trail + optional blacklist
 *
 * Admin endpoint: Requires authenticated user.
 * Sets status = 'disqualified' with reason, comment, and audit fields.
 * Optionally adds email to crm_blacklist.
 *
 * Security:
 * - Protected endpoint (auth required)
 *
 * @module app/api/crm/leads/[id]/disqualify/route
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { z } from "zod";
import { leadStatusService } from "@/lib/services/crm/lead-status.service";
import { resolveEmployeeId } from "@/lib/utils/audit-resolver";
import { logger } from "@/lib/logger";

// ============================================================================
// CONSTANTS
// ============================================================================

const DISQUALIFICATION_REASONS = [
  "fantasy_email",
  "competitor",
  "no_response",
  "wrong_market",
  "student_test",
  "duplicate",
  "other",
] as const;

const DEFAULT_TENANT_ID = "7ad8173c-68c5-41d3-9918-686e4e941cc0";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const disqualifySchema = z
  .object({
    reason: z.enum(DISQUALIFICATION_REASONS, {
      message: "Invalid disqualification reason",
    }),
    comment: z.string().max(1000).trim().optional().nullable(),
    blacklist: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      // Comment is required if reason is 'other'
      if (
        data.reason === "other" &&
        (!data.comment || data.comment.trim().length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Comment is required when reason is 'other'",
      path: ["comment"],
    }
  );

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }
    const { userId } = session;

    const { id: leadId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leadId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_LEAD_ID",
            message: "Invalid lead ID format",
          },
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = disqualifySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              validationResult.error.issues[0]?.message || "Invalid data",
          },
        },
        { status: 400 }
      );
    }

    const {
      reason,
      comment,
      blacklist: addToBlacklist,
    } = validationResult.data;

    // Resolve userId to provider employee UUID
    const employee = await resolveEmployeeId(userId);
    const employeeUuid = employee?.id || null;

    // Disqualify lead via service
    const result = await leadStatusService.disqualifyLead({
      leadId,
      reason,
      comment: comment || null,
      disqualifiedBy: employeeUuid,
      addToBlacklist: addToBlacklist ?? true,
      tenantId: DEFAULT_TENANT_ID,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DISQUALIFICATION_FAILED",
            message: result.error || "Failed to disqualify lead",
          },
        },
        { status: 400 }
      );
    }

    logger.info(
      { leadId, reason, addToBlacklist, disqualifiedBy: userId },
      "[Disqualify] Lead disqualified successfully"
    );

    return NextResponse.json({
      success: true,
      data: {
        leadId,
        status: "disqualified",
        blacklisted: addToBlacklist ?? true,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[Disqualify] Failed to disqualify lead"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to disqualify lead",
        },
      },
      { status: 500 }
    );
  }
}
