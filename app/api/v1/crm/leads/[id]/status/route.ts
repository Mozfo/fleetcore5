/**
 * /api/v1/crm/leads/[id]/status
 * Lead status transitions with validation from crm_settings
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice (V6.2-6)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Context: Manages lead status transitions with workflow validation.
 * Transitions are validated against crm_settings.lead_status_workflow.
 * Lost/disqualified statuses require loss_reason_code.
 *
 * Authentication: Middleware validates userId + FleetCore Admin org + CRM role
 *
 * @module app/api/v1/crm/leads/[id]/status
 */

import { NextRequest, NextResponse } from "next/server";
import { updateStatusSchema } from "@/lib/validators/crm/lead-status.validators";
import { leadStatusService } from "@/lib/services/crm/lead-status.service";
import { logger } from "@/lib/logger";

/**
 * PATCH /api/v1/crm/leads/[id]/status
 * Update lead status with workflow validation
 *
 * Authentication: Via middleware (FleetCore Admin + CRM role)
 *
 * Request Body:
 * {
 *   status: string (one of 9 V6.2 statuses)
 *   loss_reason_code?: string (required if status = lost | disqualified)
 *   loss_reason_detail?: string (required if reason.requires_detail = true)
 * }
 *
 * Response 200: Status updated successfully
 * Response 400: Invalid transition, missing loss_reason, or validation error
 * Response 401: Unauthorized
 * Response 404: Lead not found
 * Response 500: Internal server error
 *
 * @example
 * // Transition to lost with reason
 * PATCH /api/v1/crm/leads/123/status
 * {
 *   "status": "lost",
 *   "loss_reason_code": "chose_competitor",
 *   "loss_reason_detail": "Went with Tourmo"
 * }
 */
export async function PATCH(
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
        "[CRM Lead Status] Missing auth headers - middleware may be misconfigured"
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
    const parseResult = updateStatusSchema.safeParse(body);

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

    const { status, loss_reason_code, reason_detail } = parseResult.data;

    // STEP 4: Call service to update status
    // Service handles: transition validation, loss reason validation, audit trail
    const result = await leadStatusService.updateStatus(id, status, {
      lossReasonCode: loss_reason_code,
      lossReasonDetail: reason_detail,
      performedBy: userId,
    });

    // STEP 5: Return response based on result
    if (!result.success) {
      // Determine appropriate status code
      const statusCode = result.error?.includes("not found") ? 404 : 400;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: statusCode === 404 ? "NOT_FOUND" : "INVALID_TRANSITION",
            message: result.error,
          },
        },
        { status: statusCode }
      );
    }

    // STEP 6: Success response
    logger.info(
      {
        leadId: id,
        userId,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
      },
      "[CRM Lead Status] Status updated"
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          leadId: result.leadId,
          previousStatus: result.previousStatus,
          newStatus: result.newStatus,
          transition_valid: true,
        },
        message: `Status changed from '${result.previousStatus}' to '${result.newStatus}'`,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ error }, "[CRM Lead Status] Error updating status");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while updating lead status",
        },
      },
      { status: 500 }
    );
  }
}
