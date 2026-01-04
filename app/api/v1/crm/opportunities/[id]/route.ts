/**
 * /api/v1/crm/opportunities/[id]
 * Opportunity detail operations (GET, PATCH, DELETE)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Context: This API manages opportunities in the sales pipeline.
 * Opportunities track deals from qualification to close.
 *
 * Pipeline Stages: qualification -> demo -> proposal -> negotiation -> contract_sent
 * Status: open (active), won, lost, on_hold, cancelled
 *
 * Authentication flow:
 * 1. Middleware validates: userId + FleetCore Admin org membership + CRM role
 * 2. Middleware injects: x-user-id, x-org-id headers
 * 3. This route trusts middleware validation
 *
 * @module app/api/v1/crm/opportunities/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { OpportunityStatus } from "@/types/crm";
import {
  getStageConfig,
  getStageProbability,
  getStageMaxDays,
  OPPORTUNITY_STAGE_VALUES,
} from "@/lib/config/opportunity-stages";
import type { Prisma } from "@prisma/client";

// Zod schema for updating an opportunity
const UpdateOpportunitySchema = z.object({
  stage: z.enum(OPPORTUNITY_STAGE_VALUES).optional(),
  status: z.enum(["open", "won", "lost", "on_hold", "cancelled"]).optional(),
  expected_value: z.number().min(0).optional().nullable(),
  probability_percent: z.number().min(0).max(100).optional().nullable(),
  currency: z.string().length(3).optional().nullable(),
  discount_amount: z.number().min(0).optional().nullable(),
  close_date: z.string().datetime().optional().nullable(),
  expected_close_date: z.string().datetime().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  pipeline_id: z.string().uuid().optional().nullable(),
  plan_id: z.string().uuid().optional().nullable(),
  loss_reason: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>;

/**
 * GET /api/v1/crm/opportunities/[id]
 * Retrieve detailed information for a specific opportunity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    const orgId = request.headers.get("x-org-id");
    const { id } = await params;

    if (!userId || !orgId) {
      logger.error(
        { userId, orgId },
        "[CRM Opportunity Detail] Missing auth headers"
      );
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_UUID",
            message: "Invalid opportunity ID format",
          },
        },
        { status: 400 }
      );
    }

    // Query opportunity with relations
    const opportunity = await db.crm_opportunities.findFirst({
      where: { id, deleted_at: null },
      include: {
        crm_leads_crm_opportunities_lead_idTocrm_leads: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            company_name: true,
            country_code: true,
            phone: true,
            fleet_size: true,
            crm_countries: {
              select: {
                country_code: true,
                country_name_en: true,
                country_name_fr: true,
                flag_emoji: true,
              },
            },
          },
        },
        clt_members_crm_opportunities_assigned_toToclt_members: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Opportunity not found or deleted",
          },
        },
        { status: 404 }
      );
    }

    // Calculate days in stage and rotting status
    const now = new Date();
    const stageEnteredAt = new Date(opportunity.stage_entered_at);
    const daysInStage = Math.floor(
      (now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const maxDays =
      opportunity.max_days_in_stage ?? getStageMaxDays(opportunity.stage);
    const isRotting = daysInStage > maxDays && opportunity.status === "open";

    // Extract relations
    const lead = opportunity.crm_leads_crm_opportunities_lead_idTocrm_leads;
    const assignedTo =
      opportunity.clt_members_crm_opportunities_assigned_toToclt_members;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: opportunity.id,
          lead_id: opportunity.lead_id,
          stage: opportunity.stage,
          status: opportunity.status as OpportunityStatus,
          expected_value: opportunity.expected_value
            ? Number(opportunity.expected_value)
            : null,
          probability_percent: opportunity.probability_percent
            ? Number(opportunity.probability_percent)
            : null,
          forecast_value: opportunity.forecast_value
            ? Number(opportunity.forecast_value)
            : null,
          won_value: opportunity.won_value
            ? Number(opportunity.won_value)
            : null,
          currency: opportunity.currency,
          discount_amount: opportunity.discount_amount
            ? Number(opportunity.discount_amount)
            : null,
          close_date: opportunity.close_date?.toISOString() ?? null,
          expected_close_date:
            opportunity.expected_close_date?.toISOString() ?? null,
          won_date: opportunity.won_date?.toISOString() ?? null,
          lost_date: opportunity.lost_date?.toISOString() ?? null,
          created_at: opportunity.created_at.toISOString(),
          updated_at: opportunity.updated_at?.toISOString() ?? null,
          stage_entered_at: opportunity.stage_entered_at.toISOString(),
          max_days_in_stage: maxDays,
          days_in_stage: daysInStage,
          is_rotting: isRotting,
          assigned_to: opportunity.assigned_to,
          owner_id: opportunity.owner_id,
          pipeline_id: opportunity.pipeline_id,
          plan_id: opportunity.plan_id,
          contract_id: opportunity.contract_id,
          loss_reason: opportunity.loss_reason,
          notes: opportunity.notes,
          metadata: opportunity.metadata as Record<string, unknown>,
          lead: lead
            ? {
                id: lead.id,
                first_name: lead.first_name,
                last_name: lead.last_name,
                email: lead.email,
                company_name: lead.company_name,
                country_code: lead.country_code,
                phone: lead.phone,
                fleet_size: lead.fleet_size,
                country: lead.crm_countries ?? null,
              }
            : undefined,
          assignedTo: assignedTo
            ? {
                id: assignedTo.id,
                first_name: assignedTo.first_name,
                last_name: assignedTo.last_name,
                email: assignedTo.email,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ error }, "[Opportunity Detail] Error fetching opportunity");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/crm/opportunities/[id]
 * Update an existing opportunity
 *
 * Business Logic:
 * - When stage changes: reset stage_entered_at, update probability, recalculate forecast
 * - When status -> "won": set won_date, close_date, won_value
 * - When status -> "lost": set lost_date, require loss_reason_id
 * - forecast_value = expected_value * (probability_percent / 100)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    const orgId = request.headers.get("x-org-id");
    const { id } = await params;

    if (!userId || !orgId) {
      logger.error(
        { userId, orgId },
        "[CRM Opportunity Update] Missing auth headers"
      );
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_UUID",
            message: "Invalid opportunity ID format",
          },
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData: UpdateOpportunityInput =
      UpdateOpportunitySchema.parse(body);

    // Check opportunity exists
    const existing = await db.crm_opportunities.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Opportunity not found or deleted",
          },
        },
        { status: 404 }
      );
    }

    // Build update data with business logic
    const updateData: Prisma.crm_opportunitiesUpdateInput = {
      updated_at: new Date(),
      clt_members_crm_opportunities_updated_byToclt_members: userId
        ? { connect: { id: userId } }
        : undefined,
    };

    // Copy validated fields
    if (validatedData.stage !== undefined)
      updateData.stage = validatedData.stage;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.expected_value !== undefined)
      updateData.expected_value = validatedData.expected_value;
    if (validatedData.currency !== undefined)
      updateData.currency = validatedData.currency;
    if (validatedData.discount_amount !== undefined)
      updateData.discount_amount = validatedData.discount_amount;
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes;
    if (validatedData.metadata !== undefined) {
      updateData.metadata = validatedData.metadata as Prisma.InputJsonValue;
    }

    // Handle date conversions
    if (validatedData.close_date !== undefined) {
      updateData.close_date = validatedData.close_date
        ? new Date(validatedData.close_date)
        : null;
    }
    if (validatedData.expected_close_date !== undefined) {
      updateData.expected_close_date = validatedData.expected_close_date
        ? new Date(validatedData.expected_close_date)
        : null;
    }

    // Handle relations via connect/disconnect
    if (validatedData.assigned_to !== undefined) {
      if (validatedData.assigned_to) {
        updateData.clt_members_crm_opportunities_assigned_toToclt_members = {
          connect: { id: validatedData.assigned_to },
        };
      } else {
        updateData.clt_members_crm_opportunities_assigned_toToclt_members = {
          disconnect: true,
        };
      }
    }

    if (validatedData.loss_reason !== undefined) {
      updateData.loss_reason = validatedData.loss_reason;
    }

    // Track probability for forecast calculation
    let newProbability: number | null = null;

    // BUSINESS LOGIC: Stage change
    if (validatedData.stage && validatedData.stage !== existing.stage) {
      const stageConfig = getStageConfig(validatedData.stage);
      updateData.stage_entered_at = new Date();
      updateData.max_days_in_stage = stageConfig?.maxDays ?? 14;

      // Update probability if not explicitly set
      if (validatedData.probability_percent === undefined) {
        newProbability = getStageProbability(validatedData.stage);
        updateData.probability_percent = newProbability;
      }
    }

    // Handle explicit probability
    if (validatedData.probability_percent !== undefined) {
      updateData.probability_percent = validatedData.probability_percent;
      newProbability = validatedData.probability_percent;
    }

    // BUSINESS LOGIC: Status change to WON
    if (validatedData.status === "won" && existing.status !== "won") {
      updateData.won_date = new Date();
      if (!updateData.close_date) updateData.close_date = new Date();
      // Set won_value to expected_value if not set
      if (existing.expected_value) {
        updateData.won_value = existing.expected_value;
      }
    }

    // BUSINESS LOGIC: Status change to LOST
    if (validatedData.status === "lost" && existing.status !== "lost") {
      updateData.lost_date = new Date();
      if (!updateData.close_date) updateData.close_date = new Date();
    }

    // BUSINESS LOGIC: Recalculate forecast_value
    const expectedValue =
      validatedData.expected_value !== undefined
        ? validatedData.expected_value
        : existing.expected_value
          ? Number(existing.expected_value)
          : null;

    const probability =
      newProbability !== null
        ? newProbability
        : existing.probability_percent
          ? Number(existing.probability_percent)
          : null;

    if (expectedValue !== null && probability !== null) {
      updateData.forecast_value = expectedValue * (probability / 100);
    }

    // Update opportunity
    const updated = await db.crm_opportunities.update({
      where: { id },
      data: updateData,
      include: {
        crm_leads_crm_opportunities_lead_idTocrm_leads: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            company_name: true,
            country_code: true,
          },
        },
        clt_members_crm_opportunities_assigned_toToclt_members: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    logger.info(
      {
        opportunityId: id,
        userId,
        changes: Object.keys(validatedData),
        oldStage: existing.stage,
        newStage: validatedData.stage || existing.stage,
        oldStatus: existing.status,
        newStatus: validatedData.status || existing.status,
      },
      "[Opportunity Update] Opportunity modified"
    );

    // Extract relations for response
    const lead = updated.crm_leads_crm_opportunities_lead_idTocrm_leads;
    const assignedTo =
      updated.clt_members_crm_opportunities_assigned_toToclt_members;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updated.id,
          lead_id: updated.lead_id,
          stage: updated.stage,
          status: updated.status as OpportunityStatus,
          expected_value: updated.expected_value
            ? Number(updated.expected_value)
            : null,
          probability_percent: updated.probability_percent
            ? Number(updated.probability_percent)
            : null,
          forecast_value: updated.forecast_value
            ? Number(updated.forecast_value)
            : null,
          currency: updated.currency,
          stage_entered_at: updated.stage_entered_at.toISOString(),
          max_days_in_stage: updated.max_days_in_stage,
          created_at: updated.created_at.toISOString(),
          updated_at: updated.updated_at?.toISOString() ?? null,
          lead: lead
            ? {
                id: lead.id,
                first_name: lead.first_name,
                last_name: lead.last_name,
                email: lead.email,
                company_name: lead.company_name,
              }
            : undefined,
          assignedTo: assignedTo
            ? {
                id: assignedTo.id,
                first_name: assignedTo.first_name,
                last_name: assignedTo.last_name,
                email: assignedTo.email,
              }
            : null,
        },
        message: "Opportunity updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    logger.error({ error }, "[Opportunity Update] Error updating opportunity");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/crm/opportunities/[id]
 * Soft delete an opportunity
 *
 * IMPORTANT: This is a SOFT DELETE only.
 * Hard deletes are FORBIDDEN for audit trail compliance.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    const orgId = request.headers.get("x-org-id");
    const { id } = await params;

    if (!userId || !orgId) {
      logger.error(
        { userId, orgId },
        "[CRM Opportunity Delete] Missing auth headers"
      );
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_UUID",
            message: "Invalid opportunity ID format",
          },
        },
        { status: 400 }
      );
    }

    // Check opportunity exists
    const existing = await db.crm_opportunities.findFirst({
      where: { id, deleted_at: null },
      include: {
        crm_leads_crm_opportunities_lead_idTocrm_leads: {
          select: { email: true, company_name: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Opportunity not found or already deleted",
          },
        },
        { status: 404 }
      );
    }

    // Parse optional deletion reason from body
    let deletionReason: string | undefined;
    try {
      const body = await request.json();
      deletionReason = body.reason;
    } catch {
      // No body provided, that's ok
    }

    // Soft delete
    await db.crm_opportunities.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
        deletion_reason: deletionReason,
      },
    });

    // Audit log
    const lead = existing.crm_leads_crm_opportunities_lead_idTocrm_leads;
    logger.warn(
      {
        opportunityId: id,
        deletedBy: userId,
        leadEmail: lead?.email,
        company: lead?.company_name,
        reason: deletionReason,
      },
      "[Opportunity Delete] Opportunity soft-deleted"
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({ error }, "[Opportunity Delete] Error deleting opportunity");
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
