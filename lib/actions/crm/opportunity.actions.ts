"use server";

/**
 * CRM Opportunity Server Actions
 *
 * Server Actions for opportunity pipeline operations.
 * Uses Clerk auth() directly - no middleware tenant check required.
 *
 * Security:
 * 1. Authentication via Clerk auth()
 * 2. Zod input validation
 * 3. Authorization (FleetCore Admin only)
 *
 * Business Logic:
 * - Stage changes reset stage_entered_at and update probability
 * - Forecast = expected_value * (probability / 100)
 * - Won/Lost status changes set respective dates
 *
 * @module lib/actions/crm/opportunity.actions
 */

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getAuditLogUuids } from "@/lib/utils/clerk-uuid-mapper";
import type { OpportunityStage, OpportunityStatus } from "@/types/crm";
import {
  getStageProbability,
  getStageMaxDays,
  OPPORTUNITY_STAGE_VALUES,
} from "@/lib/config/opportunity-stages";
import type { Prisma, opportunity_status } from "@prisma/client";

const ADMIN_ORG_ID = process.env.FLEETCORE_ADMIN_ORG_ID;

// ============================================================================
// Schemas
// ============================================================================

const UpdateStageSchema = z.object({
  opportunityId: z.string().uuid("Invalid opportunity ID"),
  stage: z.enum(OPPORTUNITY_STAGE_VALUES),
});

const UpdateOpportunitySchema = z.object({
  expected_value: z.number().min(0).optional().nullable(),
  probability_percent: z.number().min(0).max(100).optional().nullable(),
  currency: z.string().length(3).optional().nullable(),
  discount_amount: z.number().min(0).optional().nullable(),
  close_date: z.string().datetime().optional().nullable(),
  expected_close_date: z.string().datetime().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

const MarkWonSchema = z.object({
  opportunityId: z.string().uuid("Invalid opportunity ID"),
  won_value: z.number().min(0).optional(),
});

const MarkLostSchema = z.object({
  opportunityId: z.string().uuid("Invalid opportunity ID"),
  loss_reason: z.string().max(50).optional(),
  loss_notes: z.string().max(1000).optional(),
});

// ============================================================================
// Types
// ============================================================================

export type UpdateOpportunityData = z.infer<typeof UpdateOpportunitySchema>;

export type UpdateStageResult =
  | {
      success: true;
      data: {
        id: string;
        stage: OpportunityStage;
        probability_percent: number;
        forecast_value: number | null;
        stage_entered_at: string;
      };
    }
  | { success: false; error: string };

export type UpdateOpportunityResult =
  | { success: true; opportunity: Record<string, unknown> }
  | { success: false; error: string };

export type MarkWonLostResult =
  | {
      success: true;
      data: {
        id: string;
        status: OpportunityStatus;
        won_date?: string;
        lost_date?: string;
        won_value?: number;
      };
    }
  | { success: false; error: string };

// ============================================================================
// Actions
// ============================================================================

/**
 * Server Action: Update opportunity stage (Kanban drag & drop)
 *
 * Business Logic:
 * - Reset stage_entered_at to now
 * - Update probability_percent based on stage config
 * - Recalculate forecast_value
 * - Update max_days_in_stage
 *
 * @param opportunityId - UUID of the opportunity
 * @param stage - New stage value
 */
export async function updateOpportunityStageAction(
  opportunityId: string,
  stage: OpportunityStage
): Promise<UpdateStageResult> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Validation
    const validation = UpdateStageSchema.safeParse({ opportunityId, stage });
    if (!validation.success) {
      return { success: false, error: "Invalid input" };
    }

    // 3. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // 4. Fetch current opportunity
    const current = await db.crm_opportunities.findUnique({
      where: { id: opportunityId },
      select: {
        id: true,
        stage: true,
        status: true,
        expected_value: true,
        metadata: true,
      },
    });

    if (!current) {
      return { success: false, error: "Opportunity not found" };
    }

    // 5. Prevent stage change if not open
    if (current.status !== "open") {
      return {
        success: false,
        error: `Cannot change stage: opportunity is ${current.status}`,
      };
    }

    const oldStage = current.stage;
    const now = new Date();

    // 6. Calculate new values
    const newProbability = getStageProbability(stage);
    const newMaxDays = getStageMaxDays(stage);
    const expectedValue = current.expected_value
      ? Number(current.expected_value)
      : null;
    const newForecast =
      expectedValue !== null ? expectedValue * (newProbability / 100) : null;

    // 7. Build update data with stage transition tracking
    const existingMetadata =
      (current.metadata as Record<string, unknown>) || {};
    const stageHistory =
      (existingMetadata.stage_history as Array<unknown>) || [];

    const updateData: Prisma.crm_opportunitiesUpdateInput = {
      stage,
      stage_entered_at: now,
      max_days_in_stage: newMaxDays,
      probability_percent: newProbability,
      forecast_value: newForecast,
      updated_at: now,
      metadata: {
        ...existingMetadata,
        stage_history: [
          ...stageHistory,
          {
            from: oldStage,
            to: stage,
            at: now.toISOString(),
          },
        ],
      } as Prisma.InputJsonValue,
    };

    // 8. Update
    const updated = await db.crm_opportunities.update({
      where: { id: opportunityId },
      data: updateData,
      select: {
        id: true,
        stage: true,
        probability_percent: true,
        forecast_value: true,
        stage_entered_at: true,
      },
    });

    // 9. Log
    if (process.env.NODE_ENV === "production") {
      logger.info(
        { opportunityId, oldStage, newStage: stage, userId },
        "[updateOpportunityStageAction] Stage updated"
      );
    }

    return {
      success: true,
      data: {
        id: updated.id,
        stage: updated.stage,
        probability_percent: updated.probability_percent
          ? Number(updated.probability_percent)
          : newProbability,
        forecast_value: updated.forecast_value
          ? Number(updated.forecast_value)
          : null,
        stage_entered_at: updated.stage_entered_at.toISOString(),
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      logger.error(
        { error, opportunityId },
        "[updateOpportunityStageAction] Error"
      );
    }
    return { success: false, error: "Failed to update opportunity stage" };
  }
}

/**
 * Server Action: Update opportunity fields (Drawer edit mode)
 *
 * @param opportunityId - UUID of the opportunity
 * @param data - Partial opportunity data to update
 */
export async function updateOpportunityAction(
  opportunityId: string,
  data: UpdateOpportunityData
): Promise<UpdateOpportunityResult> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // 3. Validation
    const validation = UpdateOpportunitySchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // 4. Fetch old opportunity for audit log
    const old = await db.crm_opportunities.findUnique({
      where: { id: opportunityId },
    });

    if (!old) {
      return { success: false, error: "Opportunity not found" };
    }

    // 5. Prepare update data
    const validatedData = validation.data;
    const updateData: Prisma.crm_opportunitiesUpdateInput = {
      updated_at: new Date(),
    };

    if (validatedData.expected_value !== undefined) {
      updateData.expected_value = validatedData.expected_value;
    }
    if (validatedData.probability_percent !== undefined) {
      updateData.probability_percent = validatedData.probability_percent;
    }
    if (validatedData.currency !== undefined) {
      updateData.currency = validatedData.currency;
    }
    if (validatedData.discount_amount !== undefined) {
      updateData.discount_amount = validatedData.discount_amount;
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    // Handle dates
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

    // Handle assigned_to relation
    if (validatedData.assigned_to !== undefined) {
      if (validatedData.assigned_to) {
        updateData.adm_members_crm_opportunities_assigned_toToadm_members = {
          connect: { id: validatedData.assigned_to },
        };
      } else {
        updateData.adm_members_crm_opportunities_assigned_toToadm_members = {
          disconnect: true,
        };
      }
    }

    // Recalculate forecast if value or probability changed
    const expectedValue =
      validatedData.expected_value !== undefined
        ? validatedData.expected_value
        : old.expected_value
          ? Number(old.expected_value)
          : null;

    const probability =
      validatedData.probability_percent !== undefined
        ? validatedData.probability_percent
        : old.probability_percent
          ? Number(old.probability_percent)
          : null;

    if (expectedValue !== null && probability !== null) {
      updateData.forecast_value = expectedValue * (probability / 100);
    }

    // 6. Update
    const updated = await db.crm_opportunities.update({
      where: { id: opportunityId },
      data: updateData,
      include: {
        crm_leads_crm_opportunities_lead_idTocrm_leads: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            company_name: true,
          },
        },
        adm_members_crm_opportunities_assigned_toToadm_members: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    // 7. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);

    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_opportunity",
          entity_id: opportunityId,
          action: "UPDATE",
          old_values: old,
          new_values: validatedData,
          severity: "info",
          category: "operational",
        },
      });
    }

    if (process.env.NODE_ENV === "production") {
      logger.info(
        { opportunityId, userId, changes: Object.keys(validatedData) },
        "[updateOpportunityAction] Opportunity updated"
      );
    }

    return {
      success: true,
      opportunity: updated as unknown as Record<string, unknown>,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      logger.error({ error, opportunityId }, "[updateOpportunityAction] Error");
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update opportunity";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action: Mark opportunity as WON
 *
 * Business Logic:
 * - Set status to "won"
 * - Set won_date to now
 * - Set close_date to now if not set
 * - Set won_value to expected_value if not provided
 *
 * @param opportunityId - UUID of the opportunity
 * @param won_value - Optional won value (defaults to expected_value)
 */
export async function markOpportunityWonAction(
  opportunityId: string,
  won_value?: number
): Promise<MarkWonLostResult> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Validation
    const validation = MarkWonSchema.safeParse({ opportunityId, won_value });
    if (!validation.success) {
      return { success: false, error: "Invalid input" };
    }

    // 3. Authorization
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // 4. Fetch opportunity
    const current = await db.crm_opportunities.findUnique({
      where: { id: opportunityId },
      select: { id: true, status: true, expected_value: true },
    });

    if (!current) {
      return { success: false, error: "Opportunity not found" };
    }

    if (current.status !== "open") {
      return {
        success: false,
        error: `Cannot mark as won: opportunity is ${current.status}`,
      };
    }

    const now = new Date();
    const finalWonValue =
      won_value ??
      (current.expected_value ? Number(current.expected_value) : undefined);

    // 5. Update
    const updated = await db.crm_opportunities.update({
      where: { id: opportunityId },
      data: {
        status: "won",
        won_date: now,
        close_date: now,
        won_value: finalWonValue,
        updated_at: now,
      },
      select: {
        id: true,
        status: true,
        won_date: true,
        won_value: true,
      },
    });

    if (process.env.NODE_ENV === "production") {
      logger.info(
        { opportunityId, userId, won_value: finalWonValue },
        "[markOpportunityWonAction] Opportunity marked as WON"
      );
    }

    return {
      success: true,
      data: {
        id: updated.id,
        status: updated.status as OpportunityStatus,
        won_date: updated.won_date?.toISOString(),
        won_value: updated.won_value ? Number(updated.won_value) : undefined,
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      logger.error(
        { error, opportunityId },
        "[markOpportunityWonAction] Error"
      );
    }
    return { success: false, error: "Failed to mark opportunity as won" };
  }
}

/**
 * Server Action: Mark opportunity as LOST
 *
 * Business Logic:
 * - Set status to "lost"
 * - Set lost_date to now
 * - Set close_date to now if not set
 * - Optionally set loss_reason (string key from crm_settings)
 *
 * @param opportunityId - UUID of the opportunity
 * @param loss_reason - Optional loss reason key (e.g., "price_too_high")
 * @param loss_notes - Optional notes about the loss
 */
export async function markOpportunityLostAction(
  opportunityId: string,
  loss_reason?: string,
  loss_notes?: string
): Promise<MarkWonLostResult> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Validation
    const validation = MarkLostSchema.safeParse({
      opportunityId,
      loss_reason,
      loss_notes,
    });
    if (!validation.success) {
      return { success: false, error: "Invalid input" };
    }

    // 3. Authorization
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // 4. Fetch opportunity
    const current = await db.crm_opportunities.findUnique({
      where: { id: opportunityId },
      select: { id: true, status: true, metadata: true },
    });

    if (!current) {
      return { success: false, error: "Opportunity not found" };
    }

    if (current.status !== "open") {
      return {
        success: false,
        error: `Cannot mark as lost: opportunity is ${current.status}`,
      };
    }

    const now = new Date();
    const existingMetadata =
      (current.metadata as Record<string, unknown>) || {};

    // 5. Build update data
    const updateData: Prisma.crm_opportunitiesUpdateInput = {
      status: "lost",
      lost_date: now,
      close_date: now,
      updated_at: now,
      metadata: {
        ...existingMetadata,
        loss_notes: loss_notes || undefined,
      } as Prisma.InputJsonValue,
    };

    // Set loss_reason (string key from crm_settings)
    if (loss_reason) {
      updateData.loss_reason = loss_reason;
    }

    // 6. Update
    const updated = await db.crm_opportunities.update({
      where: { id: opportunityId },
      data: updateData,
      select: {
        id: true,
        status: true,
        lost_date: true,
      },
    });

    if (process.env.NODE_ENV === "production") {
      logger.info(
        { opportunityId, userId, loss_reason },
        "[markOpportunityLostAction] Opportunity marked as LOST"
      );
    }

    return {
      success: true,
      data: {
        id: updated.id,
        status: updated.status as OpportunityStatus,
        lost_date: updated.lost_date?.toISOString(),
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      logger.error(
        { error, opportunityId },
        "[markOpportunityLostAction] Error"
      );
    }
    return { success: false, error: "Failed to mark opportunity as lost" };
  }
}

/**
 * Server Action: Get opportunities list (for initial data fetch)
 *
 * Returns paginated opportunities with relations.
 * Use for server-side rendering of the opportunities page.
 */
export async function getOpportunitiesAction(options?: {
  stage?: OpportunityStage;
  status?: OpportunityStatus;
  page?: number;
  limit?: number;
}): Promise<
  | {
      success: true;
      opportunities: Array<Record<string, unknown>>;
      total: number;
    }
  | { success: false; error: string }
> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Authorization
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 50, 100);

    // 3. Build where clause
    const where: Prisma.crm_opportunitiesWhereInput = {
      deleted_at: null,
    };

    if (options?.stage) where.stage = options.stage;
    if (options?.status) where.status = options.status as opportunity_status;

    // 4. Query
    const [opportunities, total] = await Promise.all([
      db.crm_opportunities.findMany({
        where,
        include: {
          crm_leads_crm_opportunities_lead_idTocrm_leads: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              company_name: true,
              country_code: true,
              crm_countries: {
                select: {
                  country_code: true,
                  country_name_en: true,
                  flag_emoji: true,
                },
              },
            },
          },
          adm_members_crm_opportunities_assigned_toToadm_members: {
            select: { id: true, first_name: true, last_name: true },
          },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.crm_opportunities.count({ where }),
    ]);

    return {
      success: true,
      opportunities: opportunities as unknown as Array<Record<string, unknown>>,
      total,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      logger.error({ error }, "[getOpportunitiesAction] Error");
    }
    return { success: false, error: "Failed to fetch opportunities" };
  }
}

/**
 * Server Action: Delete opportunity (soft delete)
 *
 * Business Logic:
 * - Soft delete (set deleted_at)
 * - Records deletion reason and who deleted
 *
 * @param opportunityId - UUID of the opportunity
 * @param reason - Optional reason for deletion
 */
export async function deleteOpportunityAction(
  opportunityId: string,
  reason?: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Validation
    if (!opportunityId || typeof opportunityId !== "string") {
      return { success: false, error: "Invalid opportunity ID" };
    }

    // 3. Authorization
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // 4. Check opportunity exists
    const current = await db.crm_opportunities.findUnique({
      where: { id: opportunityId },
      select: { id: true, deleted_at: true },
    });

    if (!current) {
      return { success: false, error: "Opportunity not found" };
    }

    if (current.deleted_at) {
      return { success: false, error: "Opportunity already deleted" };
    }

    // 5. Soft delete
    await db.crm_opportunities.update({
      where: { id: opportunityId },
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
        deletion_reason: reason || null,
      },
    });

    if (process.env.NODE_ENV === "production") {
      logger.info(
        { opportunityId, userId, reason },
        "[deleteOpportunityAction] Opportunity soft deleted"
      );
    }

    revalidatePath("/[locale]/(app)/crm/opportunities", "page");

    return { success: true };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      logger.error({ error, opportunityId }, "[deleteOpportunityAction] Error");
    }
    return { success: false, error: "Failed to delete opportunity" };
  }
}
