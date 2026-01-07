/**
 * /api/v1/crm/leads/[id]/qualify
 * CPT Qualification with auto-status update
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice (V6.2-6)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Context: Qualifies a lead using CPT framework (Challenges, Priority, Timing).
 * Score weights and thresholds are loaded from crm_settings.qualification_framework.
 *
 * Auto-Status Update:
 * - If recommendation = "proceed" (score >= 70): auto-update status to "qualified"
 * - If recommendation = "nurture" or "disqualify": suggestion only, no auto-update
 *
 * Authentication: Middleware validates userId + FleetCore Admin org + CRM role
 *
 * @module app/api/v1/crm/leads/[id]/qualify
 */

import { NextRequest, NextResponse } from "next/server";
import { qualifyLeadSchema } from "@/lib/validators/crm/lead-status.validators";
import { leadQualificationService } from "@/lib/services/crm/lead-qualification.service";
import { logger } from "@/lib/logger";

/**
 * POST /api/v1/crm/leads/[id]/qualify
 * Qualify lead using CPT framework
 *
 * Authentication: Via middleware (FleetCore Admin + CRM role)
 *
 * Request Body:
 * {
 *   challenges: { response: string, score: "high" | "medium" | "low" },
 *   priority: { response: string, score: "high" | "medium" | "low" },
 *   timing: { response: string, score: "hot" | "warm" | "cool" | "cold" }
 * }
 *
 * Response 200: Qualification complete
 * {
 *   success: true,
 *   data: {
 *     leadId: string,
 *     qualification_score: number (0-100),
 *     recommendation: "proceed" | "nurture" | "disqualify",
 *     status_updated: boolean,
 *     suggested_action?: string,
 *     qualified_date: string (ISO)
 *   }
 * }
 *
 * Response 400: Validation error or business logic error
 * Response 401: Unauthorized
 * Response 404: Lead not found
 * Response 500: Internal server error
 *
 * @example
 * // Qualify a lead
 * POST /api/v1/crm/leads/123/qualify
 * {
 *   "challenges": { "response": "Excel nightmare, 3h/week", "score": "high" },
 *   "priority": { "response": "Budget approved Q1", "score": "high" },
 *   "timing": { "response": "Want to start ASAP", "score": "hot" }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // STEP 1: Read authentication from middleware-injected headers
    const userId = request.headers.get("x-user-id");
    const orgId = request.headers.get("x-org-id");
    const { id } = await params;

    // Defensive check
    if (!userId || !orgId) {
      logger.error(
        { userId, orgId },
        "[CRM Lead Qualify] Missing auth headers - middleware may be misconfigured"
      );
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

    // STEP 2: Validate ID format
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

    // STEP 3: Parse and validate request body with Zod safeParse
    const body = await request.json();
    const parseResult = qualifyLeadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: parseResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // STEP 4: Call service to qualify lead
    const result = await leadQualificationService.qualifyLead(
      id,
      parseResult.data,
      userId
    );

    // STEP 5: Success response
    logger.info(
      {
        leadId: id,
        userId,
        score: result.qualification_score,
        recommendation: result.recommendation,
        statusUpdated: result.status_updated,
      },
      "[CRM Lead Qualify] Lead qualified"
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
        message:
          result.recommendation === "proceed"
            ? `Lead qualified with score ${result.qualification_score}/100. Status updated to 'qualified'.`
            : `Lead qualified with score ${result.qualification_score}/100. Recommendation: ${result.recommendation}.`,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle business logic errors (e.g., "Cannot qualify converted lead")
    if (error instanceof Error) {
      // Check if it's a "not found" error
      if (error.message.includes("not found")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          },
          { status: 404 }
        );
      }

      // Check if it's a business logic error (cannot qualify X status)
      if (error.message.includes("Cannot qualify")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "BUSINESS_ERROR",
              message: error.message,
            },
          },
          { status: 400 }
        );
      }

      // Check if it's a missing settings error
      if (
        error.message.includes("not found in crm_settings") ||
        error.message.includes("missing score_weights")
      ) {
        logger.error({ error }, "[CRM Lead Qualify] Configuration error");
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFIGURATION_ERROR",
              message:
                "CRM settings not properly configured. Contact administrator.",
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
