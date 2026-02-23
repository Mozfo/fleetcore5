"use server";

/**
 * CRM Opportunity Server Actions
 *
 * Server Actions for opportunity pipeline operations.
 * Security:
 * 1. Authentication via requireCrmAuth (HQ org check)
 * 2. Zod input validation
 * 3. Tenant isolation via session.orgId
 *
 * Business Logic:
 * - Stage changes reset stage_entered_at and update probability
 * - Forecast = expected_value * (probability / 100)
 * - Won/Lost status changes set respective dates
 *
 * @module lib/actions/crm/opportunity.actions
 */

import { requireCrmAuth } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getAuditLogUuids } from "@/lib/utils/audit-resolver";
import type { OpportunityStage, OpportunityStatus } from "@/types/crm";
import {
  getStageProbability,
  getStageMaxDays,
  OPPORTUNITY_STAGE_VALUES,
} from "@/lib/config/opportunity-stages";
import type { Prisma, opportunity_status } from "@prisma/client";
import { orderService } from "@/lib/services/crm/order.service";
import { BILLING_CYCLES } from "@/lib/validators/crm/order.validators";
import { NotFoundError, ValidationError } from "@/lib/core/errors";
import { sendOrderCreatedNotification } from "@/lib/services/notification";

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

/**
 * Schema for marking an opportunity as WON (Quote-to-Cash)
 *
 * This schema validates the full contract parameters needed to create an Order
 * when an opportunity is won. All values are required for proper order creation.
 */
const MarkAsWonSchema = z.object({
  opportunityId: z.string().uuid("Invalid opportunity ID"),
  totalValue: z.number().min(100, "Total value must be at least 100"),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .default("EUR"),
  billingCycle: z.enum(BILLING_CYCLES),
  effectiveDate: z.coerce.date(),
  durationMonths: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 month")
    .max(120, "Duration cannot exceed 120 months"),
  autoRenew: z.boolean().default(false),
  noticePeriodDays: z.number().int().min(0).max(365).default(30),
  notes: z.string().max(2000).optional().nullable(),
});

type MarkAsWonInput = z.infer<typeof MarkAsWonSchema>;

const MarkLostSchema = z.object({
  opportunityId: z.string().uuid("Invalid opportunity ID"),
  loss_reason: z.string().max(50).optional(),
  loss_notes: z.string().max(1000).optional(),
});

/**
 * Schema for creating a new opportunity (manual creation)
 * Note: lead_id is required as per database schema
 */
const CreateOpportunitySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  lead_id: z.string().uuid("Lead selection is required"),
  expected_value: z.number().min(0, "Value must be positive"),
  currency: z.string().length(3, "Currency must be 3 letters").default("EUR"),
  stage: z.enum(OPPORTUNITY_STAGE_VALUES),
  expected_close_date: z.coerce.date(),
  assigned_to: z.string().uuid("Invalid assignee ID").optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type CreateOpportunityData = z.infer<typeof CreateOpportunitySchema>;

// ============================================================================
// Types
// ============================================================================

export type UpdateOpportunityData = z.infer<typeof UpdateOpportunitySchema>;

export type CreateOpportunityResult =
  | {
      success: true;
      opportunity: {
        id: string;
        lead_id: string;
        stage: OpportunityStage;
        status: OpportunityStatus;
        expected_value: number | null;
        probability_percent: number | null;
        forecast_value: number | null;
        expected_close_date: string | null;
        created_at: string;
      };
    }
  | { success: false; error: string };

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

/**
 * Result type for markOpportunityWonAction (Quote-to-Cash)
 *
 * Returns both the updated opportunity AND the created order
 */
export type MarkAsWonResult =
  | {
      success: true;
      data: {
        opportunity: {
          id: string;
          status: OpportunityStatus;
          won_date: string;
          won_value: number;
        };
        order: {
          id: string;
          order_reference: string;
          order_code: string;
          total_value: number;
          monthly_value: number;
          annual_value: number;
          effective_date: string;
          expiry_date: string;
        };
      };
    }
  | { success: false; error: string };

// ============================================================================
// Actions
// ============================================================================

/**
 * Server Action: Create a new opportunity (manual creation)
 *
 * Business Logic:
 * - Validates input against CreateOpportunitySchema
 * - Sets probability_percent based on stage config
 * - Calculates forecast_value = expected_value * (probability / 100)
 * - Sets max_days_in_stage based on stage config
 * - Records stage_entered_at timestamp
 * - If lead_id provided, links opportunity to lead
 *
 * @param data - Opportunity creation data
 */
export async function createOpportunityAction(
  data: CreateOpportunityData
): Promise<CreateOpportunityResult> {
  try {
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId, orgId } = session;

    // 2. Validation
    const validation = CreateOpportunitySchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    const validData = validation.data;

    // 5. Verify lead exists and belongs to tenant
    const lead = await db.crm_leads.findFirst({
      where: {
        id: validData.lead_id,
        tenant_id: session.orgId,
        deleted_at: null,
      },
      select: { id: true },
    });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    // 6. Calculate auto-populated fields
    const probability = getStageProbability(validData.stage);
    const forecastValue = validData.expected_value
      ? (validData.expected_value * probability) / 100
      : null;
    const maxDaysInStage = getStageMaxDays(validData.stage);

    // 7. Create the opportunity
    const opportunity = await db.crm_opportunities.create({
      data: {
        lead_id: validData.lead_id,
        stage: validData.stage,
        status: "open" as opportunity_status,
        expected_value: validData.expected_value,
        currency: validData.currency,
        probability_percent: probability,
        forecast_value: forecastValue,
        expected_close_date: validData.expected_close_date,
        assigned_to: validData.assigned_to ?? undefined,
        notes: validData.notes ?? undefined,
        max_days_in_stage: maxDaysInStage,
        stage_entered_at: new Date(),
        metadata: {
          opportunity_name: validData.name,
          created_manually: true,
        },
        tenant_id: session.orgId,
      },
    });

    // 8. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_opportunity",
          entity_id: opportunity.id,
          action: "CREATE",
          new_values: {
            opportunity_name: validData.name,
            expected_value: validData.expected_value,
            stage: validData.stage,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 9. Revalidate paths
    revalidatePath("/[locale]/(app)/crm/opportunities");

    logger.info(
      { opportunityId: opportunity.id, userId },
      "[createOpportunityAction] Opportunity created"
    );

    return {
      success: true,
      opportunity: {
        id: opportunity.id,
        lead_id: opportunity.lead_id,
        stage: opportunity.stage,
        status: opportunity.status,
        expected_value: opportunity.expected_value
          ? Number(opportunity.expected_value)
          : null,
        probability_percent: opportunity.probability_percent
          ? Number(opportunity.probability_percent)
          : null,
        forecast_value: opportunity.forecast_value
          ? Number(opportunity.forecast_value)
          : null,
        expected_close_date:
          opportunity.expected_close_date?.toISOString() || null,
        created_at: opportunity.created_at.toISOString(),
      },
    };
  } catch (error) {
    logger.error({ error }, "[createOpportunityAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create opportunity";
    return { success: false, error: errorMessage };
  }
}

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
    // 1. Authentication & Authorization
    const { userId } = await requireCrmAuth();

    // 2. Validation
    const validation = UpdateStageSchema.safeParse({ opportunityId, stage });
    if (!validation.success) {
      return { success: false, error: "Invalid input" };
    }

    // 3. Fetch current opportunity
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

    // 6. Prevent stage change if not open
    if (current.status !== "open") {
      return {
        success: false,
        error: `Cannot change stage: opportunity is ${current.status}`,
      };
    }

    const oldStage = current.stage;
    const now = new Date();

    // 7. Calculate new values
    const newProbability = getStageProbability(stage);
    const newMaxDays = getStageMaxDays(stage);
    const expectedValue = current.expected_value
      ? Number(current.expected_value)
      : null;
    const newForecast =
      expectedValue !== null ? expectedValue * (newProbability / 100) : null;

    // 8. Build update data with stage transition tracking
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

    // 9. Update
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

    // 10. Log
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
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId, orgId } = session;

    // 2. Validation
    const validation = UpdateOpportunitySchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // 5. Fetch old opportunity for audit log (with tenant filter)
    const old = await db.crm_opportunities.findFirst({
      where: { id: opportunityId, tenant_id: session.orgId },
    });

    if (!old) {
      return { success: false, error: "Opportunity not found" };
    }

    // 6. Prepare update data
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
        updateData.mfiaerr = {
          connect: { id: validatedData.assigned_to },
        };
      } else {
        updateData.mfiaerr = {
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

    // 7. Update
    const updated = await db.crm_opportunities.update({
      where: { id: opportunityId },
      data: updateData,
      include: {
        xva1wvf: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            company_name: true,
          },
        },
        mfiaerr: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    // 8. Audit log
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
 * Server Action: Mark opportunity as WON (Quote-to-Cash)
 *
 * This action orchestrates the complete Quote-to-Cash flow:
 * 1. Validates contract parameters (totalValue, billingCycle, duration)
 * 2. Creates an Order via OrderService (with auto-generated reference)
 * 3. Updates opportunity status to 'won' with contract_id link
 * 4. Returns both opportunity and order data
 *
 * All operations are wrapped in a transaction by OrderService.
 *
 * @param params - Contract parameters for order creation
 * @returns Opportunity and Order data on success
 */
export async function markOpportunityWonAction(
  params: MarkAsWonInput
): Promise<MarkAsWonResult> {
  try {
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId } = session;

    // 2. Validation with Zod schema
    const validation = MarkAsWonSchema.safeParse(params);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Invalid input",
      };
    }
    const validated = validation.data;

    // 5. Create order via OrderService
    // This handles:
    // - Opportunity validation (exists, not already won)
    // - Order creation with auto-generated reference
    // - Opportunity update to 'won' status
    // - All in a single transaction
    const result = await orderService.createOrderFromOpportunity({
      opportunityId: validated.opportunityId,
      tenantId: session.orgId,
      userId,
      totalValue: validated.totalValue,
      currency: validated.currency,
      billingCycle: validated.billingCycle,
      effectiveDate: validated.effectiveDate,
      durationMonths: validated.durationMonths,
      autoRenew: validated.autoRenew,
      noticePeriodDays: validated.noticePeriodDays,
      metadata: validated.notes ? { notes: validated.notes } : undefined,
    });

    // 6. Log success
    logger.info(
      {
        opportunityId: validated.opportunityId,
        orderId: result.order.id,
        orderReference: result.order.order_reference,
        totalValue: validated.totalValue,
        userId,
      },
      "[markOpportunityWonAction] Opportunity marked as WON with Order created"
    );

    // 7. Revalidate cache for both pages
    revalidatePath("/[locale]/(app)/crm/opportunities", "page");
    revalidatePath("/[locale]/(app)/crm/orders", "page");

    // 8. Send order created notification (async, non-blocking)
    sendOrderCreatedNotification(result.order.id).catch((err) => {
      logger.error(
        {
          err: err instanceof Error ? err.message : String(err),
          orderId: result.order.id,
          orderReference: result.order.order_reference,
        },
        "[markOpportunityWonAction] Failed to send order created notification"
      );
    });

    // 9. Return combined result
    return {
      success: true,
      data: {
        opportunity: {
          id: result.opportunity.id,
          status: "won" as OpportunityStatus,
          won_date: new Date().toISOString(),
          won_value: validated.totalValue,
        },
        order: {
          id: result.order.id,
          order_reference: result.order.order_reference || "",
          order_code: result.order.order_code || "",
          total_value: Number(result.order.total_value),
          monthly_value: result.calculations.monthlyValue,
          annual_value: result.calculations.annualValue,
          effective_date: result.order.effective_date.toISOString(),
          expiry_date: result.calculations.expiryDate.toISOString(),
        },
      },
    };
  } catch (error) {
    // Handle specific errors from OrderService
    if (error instanceof NotFoundError) {
      logger.warn(
        { error: error.message, opportunityId: params.opportunityId },
        "[markOpportunityWonAction] Opportunity not found"
      );
      return { success: false, error: error.message };
    }

    if (error instanceof ValidationError) {
      logger.warn(
        { error: error.message, opportunityId: params.opportunityId },
        "[markOpportunityWonAction] Validation error"
      );
      return { success: false, error: error.message };
    }

    // Log unexpected errors
    logger.error(
      { error, opportunityId: params.opportunityId },
      "[markOpportunityWonAction] Unexpected error"
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to mark opportunity as won";
    return { success: false, error: errorMessage };
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
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId } = session;

    // 2. Validation
    const validation = MarkLostSchema.safeParse({
      opportunityId,
      loss_reason,
      loss_notes,
    });
    if (!validation.success) {
      return { success: false, error: "Invalid input" };
    }

    // 5. Fetch opportunity (with tenant filter)
    const current = await db.crm_opportunities.findFirst({
      where: { id: opportunityId, tenant_id: session.orgId },
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

    // 6. Build update data
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

    // 7. Update
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
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();

    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 50, 100);

    // 4. Build where clause (with tenant filter)
    const where: Prisma.crm_opportunitiesWhereInput = {
      deleted_at: null,
      tenant_id: session.orgId,
    };

    if (options?.stage) where.stage = options.stage;
    if (options?.status) where.status = options.status as opportunity_status;

    // 5. Query
    const [opportunities, total] = await Promise.all([
      db.crm_opportunities.findMany({
        where,
        include: {
          xva1wvf: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
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
          mfiaerr: {
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
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId } = session;

    // 2. Validation
    if (!opportunityId || typeof opportunityId !== "string") {
      return { success: false, error: "Invalid opportunity ID" };
    }

    // 5. Check opportunity exists (with tenant filter)
    const current = await db.crm_opportunities.findFirst({
      where: { id: opportunityId, tenant_id: session.orgId },
      select: { id: true, deleted_at: true },
    });

    if (!current) {
      return { success: false, error: "Opportunity not found" };
    }

    if (current.deleted_at) {
      return { success: false, error: "Opportunity already deleted" };
    }

    // 6. Soft delete
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
