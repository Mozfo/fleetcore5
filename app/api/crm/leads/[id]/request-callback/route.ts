/**
 * POST /api/crm/leads/[id]/request-callback
 *
 * V6.6 - Request callback (Wizard Step 4 alternative)
 *
 * When user prefers a callback instead of booking a Cal.com slot.
 * Sets callback_requested = true, status = 'callback_requested'.
 *
 * Prerequisites:
 * - Lead must exist
 * - Lead must have wizard_completed = true (profile filled in Step 3)
 *
 * Security:
 * - Public endpoint (no auth required - wizard flow)
 *
 * @module app/api/crm/leads/[id]/request-callback/route
 */

import { NextRequest, NextResponse } from "next/server";
import { wizardLeadService } from "@/lib/services/crm/wizard-lead.service";
import { NotificationQueueService } from "@/lib/services/notification/queue.service";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Fetch lead to verify prerequisites
    const lead = await wizardLeadService.getLeadById(leadId);

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "LEAD_NOT_FOUND",
            message: "Lead not found",
          },
        },
        { status: 404 }
      );
    }

    // Check wizard is completed (profile filled in Step 3)
    if (!lead.wizard_completed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROFILE_NOT_COMPLETED",
            message: "Profile must be completed before requesting callback",
          },
        },
        { status: 400 }
      );
    }

    // Idempotent: if already requested, return success
    if (lead.callback_requested) {
      logger.info(
        { leadId },
        "[RequestCallback] Callback already requested - returning success"
      );
      return NextResponse.json({
        success: true,
        data: {
          leadId: lead.id,
          status: "callback_requested",
          callback_requested_at: lead.callback_requested_at?.toISOString(),
        },
      });
    }

    // Request callback via service
    const updatedLead = await wizardLeadService.requestCallback(leadId);

    // Queue callback confirmation email
    try {
      const queueService = new NotificationQueueService(prisma);
      await queueService.queueNotification({
        templateCode: "callback_confirmation",
        recipientEmail: lead.email,
        locale: lead.language || "en",
        variables: {
          first_name: lead.first_name || "",
          last_name: lead.last_name || "",
          company_name: lead.company_name || "",
          phone: lead.phone || "",
          fleet_size: lead.fleet_size || "",
        },
        leadId,
        idempotencyKey: `callback_confirmation_${leadId}`,
        processImmediately: true,
      });
    } catch (emailError) {
      logger.warn(
        { leadId, error: emailError },
        "[RequestCallback] Failed to queue confirmation email (non-blocking)"
      );
    }

    logger.info(
      { leadId, email: lead.email },
      "[RequestCallback] Callback requested successfully"
    );

    return NextResponse.json({
      success: true,
      data: {
        leadId: updatedLead.id,
        status: updatedLead.status,
        callback_requested_at: updatedLead.callback_requested_at?.toISOString(),
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[RequestCallback] Failed to request callback"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to request callback",
        },
      },
      { status: 500 }
    );
  }
}
