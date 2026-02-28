/**
 * /api/v1/crm/leads/[id]/qualify
 * BANT Qualification with auto-status update (V7)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Qualifies a lead using BANT framework (Budget, Authority, Need, Timeline).
 * Qualifying values loaded from crm_settings.qualification_framework.
 *
 * Auto-Status Update:
 * - 4/4 criteria met → status updated to "qualified"
 * - 3/4 criteria met → nurturing (no auto-update)
 * - <=2/4 criteria met → disqualified (unless fleet_size > threshold → nurturing)
 *
 * Authentication: Middleware validates userId + FleetCore Admin org + CRM role
 *
 * @module app/api/v1/crm/leads/[id]/qualify
 */

import { NextRequest, NextResponse } from "next/server";
import { qualifyLeadSchema } from "@/lib/validators/crm/lead-status.validators";
import { leadQualificationService } from "@/lib/services/crm/lead-qualification.service";
import { logger } from "@/lib/logger";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { AppError } from "@/lib/core/errors";

/**
 * POST /api/v1/crm/leads/[id]/qualify
 * Qualify lead using BANT framework
 *
 * Request Body:
 * {
 *   bant_budget: "confirmed" | "planned" | "no_budget" | "unknown",
 *   bant_authority: "decision_maker" | "influencer" | "user" | "unknown",
 *   bant_need: "critical" | "important" | "nice_to_have" | "none",
 *   bant_timeline: "immediate" | "this_quarter" | "this_year" | "no_timeline"
 * }
 *
 * Response 200:
 * {
 *   success: true,
 *   data: {
 *     leadId, result, criteria_met, details, fleet_size_exception,
 *     status_updated, qualified_date
 *   }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireCrmApiAuth();
    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_UUID",
            message: "Invalid lead ID format",
          },
        },
        { status: 400 }
      );
    }

    // Parse and validate BANT input
    const body = await request.json();
    const parseResult = qualifyLeadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid BANT input data",
            details: parseResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // Call BANT qualification service
    const result = await leadQualificationService.qualifyLead(
      id,
      parseResult.data,
      userId
    );

    logger.info(
      {
        leadId: id,
        userId,
        result: result.result,
        criteriaMet: result.criteria_met,
        statusUpdated: result.status_updated,
      },
      "[CRM Lead Qualify] Lead qualified with BANT"
    );

    const messages: Record<string, string> = {
      qualified: `Lead qualified (${result.criteria_met}/4 BANT criteria met). Status updated to 'qualified'.`,
      nurturing: `Lead moved to nurturing (${result.criteria_met}/4 BANT criteria met).${result.fleet_size_exception ? " Fleet size exception applied." : ""}`,
      disqualified: `Lead disqualified (${result.criteria_met}/4 BANT criteria met).`,
    };

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: messages[result.result],
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: error.message },
          },
          { status: 404 }
        );
      }

      if (error.message.includes("Cannot qualify")) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "BUSINESS_ERROR", message: error.message },
          },
          { status: 400 }
        );
      }

      if (
        error.message.includes("not found in crm_settings") ||
        error.message.includes("missing criteria")
      ) {
        logger.error({ error }, "[CRM Lead Qualify] Configuration error");
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFIGURATION_ERROR",
              message:
                "CRM qualification settings not properly configured. Contact administrator.",
            },
          },
          { status: 500 }
        );
      }
    }

    logger.error({ error }, "[CRM Lead Qualify] Error qualifying lead");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while qualifying the lead",
        },
      },
      { status: 500 }
    );
  }
}
