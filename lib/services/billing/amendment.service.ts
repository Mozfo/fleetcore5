/**
 * Amendment Service - Subscription Modification Orchestration
 *
 * This service orchestrates mid-term subscription modifications:
 * 1. Create amendments for plan changes, upgrades, downgrades
 * 2. Manage approval workflow (submit, approve, reject)
 * 3. Apply amendments with proration calculations
 * 4. Batch operations for CRON jobs (apply due amendments, reminders)
 *
 * @module lib/services/billing/amendment.service
 */

import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import {
  Prisma,
  amendment_type,
  amendment_status,
  billing_interval,
  proration_behavior,
} from "@prisma/client";
import {
  ValidationError,
  NotFoundError,
  BusinessRuleError,
} from "@/lib/core/errors";
import { logger } from "@/lib/logger";

// =============================================================================
// TYPES
// =============================================================================

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Amendment base type
 */
export type Amendment = Prisma.bil_amendmentsGetPayload<object>;

/**
 * Amendment with relations
 *
 * NOTE: Relations are NOT defined in Prisma schema.
 * We define this as a composite type manually.
 */
export type AmendmentWithRelations = Amendment;

/**
 * Paginated result type
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Parameters for creating an amendment
 */
export interface CreateAmendmentInput {
  tenantId: string;
  subscriptionId: string;
  scheduleId?: string;
  userId: string;
  amendmentType: amendment_type;
  effectiveDate: Date;
  newPlanId?: string;
  newQuantity?: number;
  newPrice?: number;
  newBillingCycle?: billing_interval;
  prorationBehavior?: proration_behavior;
  requiresApproval?: boolean;
  reason?: string;
  internalNotes?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Parameters for updating an amendment
 */
export interface UpdateAmendmentInput {
  effectiveDate?: Date;
  newPlanId?: string;
  newQuantity?: number;
  newPrice?: number;
  newBillingCycle?: billing_interval;
  prorationBehavior?: proration_behavior;
  reason?: string;
  internalNotes?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Proration calculation result
 */
export interface ProrationResult {
  credit: number;
  debit: number;
  netAmount: number;
  daysRemaining: number;
  daysInPeriod: number;
  effectiveDate: Date;
}

/**
 * Amendment preview (before application)
 */
export interface AmendmentPreview {
  amendment: Amendment;
  proration: ProrationResult;
  oldPlan: { id: string; name: string | null; price: number } | null;
  newPlan: { id: string; name: string | null; price: number } | null;
  mrrImpact: number;
}

/**
 * Filters for listing amendments
 */
export interface AmendmentFilters {
  status?: amendment_status;
  amendmentType?: amendment_type;
  tenantId?: string;
  subscriptionId?: string;
  scheduleId?: string;
  effectiveDateFrom?: Date;
  effectiveDateTo?: Date;
  page?: number;
  limit?: number;
}

// =============================================================================
// ALLOWED STATUS TRANSITIONS
// =============================================================================

const ALLOWED_TRANSITIONS: Record<amendment_status, amendment_status[]> = {
  draft: ["pending_approval", "approved", "canceled"],
  pending_approval: ["approved", "rejected", "canceled"],
  approved: ["applied", "canceled"],
  applied: [],
  rejected: [],
  canceled: [],
};

/**
 * Check if a status transition is allowed
 */
function isTransitionAllowed(
  from: amendment_status,
  to: amendment_status
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// SERVICE
// =============================================================================

/**
 * Amendment Service
 *
 * Orchestrates subscription modification requests, approval workflows,
 * and application with proration.
 */
export class AmendmentService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  // ===========================================================================
  // REFERENCE GENERATION
  // ===========================================================================

  /**
   * Generate a unique amendment reference
   * Format: AMD-YYYY-NNNNN (e.g., AMD-2025-00001)
   */
  async generateAmendmentReference(
    tenantId: string,
    tx?: PrismaTransaction
  ): Promise<string> {
    const client = tx || this.prisma;
    const year = new Date().getFullYear();
    const prefix = `AMD-${year}-`;

    const lastAmendment = await client.bil_amendments.findFirst({
      where: {
        tenant_id: tenantId,
        amendment_reference: { startsWith: prefix },
        deleted_at: null,
      },
      orderBy: { amendment_reference: "desc" },
    });

    let nextNumber = 1;
    if (lastAmendment?.amendment_reference) {
      const match =
        lastAmendment.amendment_reference.match(/AMD-\d{4}-(\d{5})$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(5, "0")}`;
  }

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  /**
   * Create a new amendment
   */
  async createAmendment(input: CreateAmendmentInput): Promise<Amendment> {
    logger.info({ input }, "[AmendmentService] Creating amendment");

    // Validate subscription exists and is active
    const subscription = await this.prisma.clt_subscriptions.findUnique({
      where: { id: input.subscriptionId },
      include: {
        xgunea8: true,
      },
    });

    if (!subscription) {
      throw new NotFoundError(
        `Subscription not found: ${input.subscriptionId}`
      );
    }

    if (subscription.status !== "active") {
      throw new BusinessRuleError(
        `Cannot create amendment for subscription with status: ${subscription.status}`,
        "subscription_not_active"
      );
    }

    // Validate schedule if provided
    if (input.scheduleId) {
      const schedule = await this.prisma.bil_subscription_schedules.findFirst({
        where: { id: input.scheduleId, deleted_at: null },
      });

      if (!schedule) {
        throw new NotFoundError(`Schedule not found: ${input.scheduleId}`);
      }
    }

    // Validate new plan if provided
    if (input.newPlanId) {
      const newPlan = await this.prisma.bil_billing_plans.findFirst({
        where: { id: input.newPlanId, deleted_at: null },
      });

      if (!newPlan) {
        throw new NotFoundError(`New plan not found: ${input.newPlanId}`);
      }

      if (newPlan.status !== "active") {
        throw new BusinessRuleError(
          `Cannot change to plan with status: ${newPlan.status}`,
          "plan_not_active"
        );
      }
    }

    // Validate effective date is not in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (input.effectiveDate < now) {
      throw new ValidationError("Effective date cannot be in the past");
    }

    // Get current plan price
    const currentPlan = subscription.xgunea8;
    const currentPrice = currentPlan?.monthly_fee ?? null;

    const result = await this.prisma.$transaction(async (tx) => {
      const reference = await this.generateAmendmentReference(
        input.tenantId,
        tx
      );

      const amendment = await tx.bil_amendments.create({
        data: {
          amendment_reference: reference,
          tenant_id: input.tenantId,
          subscription_id: input.subscriptionId,
          schedule_id: input.scheduleId,
          amendment_type: input.amendmentType,
          status: "draft",
          // Store current values from subscription
          old_plan_id: subscription.plan_id,
          old_quantity: null, // Schema doesn't have quantity on subscription
          old_price: currentPrice,
          old_billing_cycle: subscription.billing_cycle,
          // New values
          new_plan_id: input.newPlanId,
          new_quantity: input.newQuantity,
          new_price: input.newPrice,
          new_billing_cycle: input.newBillingCycle,
          // Dates
          effective_date: input.effectiveDate,
          // Proration
          proration_behavior: input.prorationBehavior || "create_prorations",
          // Approval
          requires_approval: input.requiresApproval ?? false,
          // Notes
          reason: input.reason,
          internal_notes: input.internalNotes,
          // Metadata
          metadata: input.metadata ?? Prisma.JsonNull,
          // Audit
          created_by: input.userId,
        },
      });

      return amendment;
    });

    logger.info(
      { amendmentId: result.id, reference: result.amendment_reference },
      "[AmendmentService] Amendment created"
    );

    return result;
  }

  /**
   * Update an amendment
   */
  async updateAmendment(
    id: string,
    tenantId: string,
    input: UpdateAmendmentInput,
    userId: string
  ): Promise<Amendment> {
    logger.info(
      { id, tenantId, input },
      "[AmendmentService] Updating amendment"
    );

    const amendment = await this.getAmendment(id, tenantId);

    if (!amendment) {
      throw new NotFoundError(`Amendment not found: ${id}`);
    }

    // Only allow updates for draft amendments
    if (amendment.status !== "draft") {
      throw new BusinessRuleError(
        `Cannot update amendment with status: ${amendment.status}. Only draft amendments can be updated.`,
        "amendment_not_draft"
      );
    }

    // Validate new plan if changing
    if (input.newPlanId && input.newPlanId !== amendment.new_plan_id) {
      const newPlan = await this.prisma.bil_billing_plans.findFirst({
        where: { id: input.newPlanId, deleted_at: null },
      });

      if (!newPlan || newPlan.status !== "active") {
        throw new ValidationError("New plan not found or not active");
      }
    }

    const updated = await this.prisma.bil_amendments.update({
      where: { id },
      data: {
        effective_date: input.effectiveDate,
        new_plan_id: input.newPlanId,
        new_quantity: input.newQuantity,
        new_price: input.newPrice,
        new_billing_cycle: input.newBillingCycle,
        proration_behavior: input.prorationBehavior,
        reason: input.reason,
        internal_notes: input.internalNotes,
        metadata: input.metadata,
        updated_by: userId,
        updated_at: new Date(),
      },
    });

    logger.info({ amendmentId: id }, "[AmendmentService] Amendment updated");

    return updated;
  }

  /**
   * Soft delete an amendment
   */
  async deleteAmendment(
    id: string,
    tenantId: string,
    deletedBy: string
  ): Promise<void> {
    logger.info({ id, tenantId }, "[AmendmentService] Deleting amendment");

    const amendment = await this.getAmendment(id, tenantId);

    if (!amendment) {
      throw new NotFoundError(`Amendment not found: ${id}`);
    }

    // Only allow deletion of draft or rejected amendments
    if (!["draft", "rejected", "canceled"].includes(amendment.status)) {
      throw new BusinessRuleError(
        `Cannot delete amendment with status: ${amendment.status}`,
        "amendment_not_deletable"
      );
    }

    await this.prisma.bil_amendments.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: deletedBy,
      },
    });

    logger.info({ amendmentId: id }, "[AmendmentService] Amendment deleted");
  }

  // ===========================================================================
  // WORKFLOW
  // ===========================================================================

  /**
   * Submit amendment for approval
   */
  async submitForApproval(
    id: string,
    tenantId: string,
    submittedBy: string
  ): Promise<Amendment> {
    logger.info({ id, tenantId }, "[AmendmentService] Submitting for approval");

    const amendment = await this.getAmendment(id, tenantId);

    if (!amendment) {
      throw new NotFoundError(`Amendment not found: ${id}`);
    }

    if (amendment.status !== "draft") {
      throw new BusinessRuleError(
        `Cannot submit amendment with status: ${amendment.status}. Only draft amendments can be submitted.`,
        "amendment_not_draft"
      );
    }

    // Determine next status based on requires_approval
    const nextStatus: amendment_status = amendment.requires_approval
      ? "pending_approval"
      : "approved";

    const updated = await this.prisma.bil_amendments.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(nextStatus === "approved" && {
          approved_by: submittedBy,
          approved_at: new Date(),
        }),
        updated_by: submittedBy,
        updated_at: new Date(),
      },
    });

    logger.info(
      { amendmentId: id, newStatus: nextStatus },
      "[AmendmentService] Amendment submitted"
    );

    return updated;
  }

  /**
   * Approve an amendment
   */
  async approveAmendment(
    id: string,
    tenantId: string,
    approvedBy: string
  ): Promise<Amendment> {
    logger.info(
      { id, tenantId, approvedBy },
      "[AmendmentService] Approving amendment"
    );

    const amendment = await this.getAmendment(id, tenantId);

    if (!amendment) {
      throw new NotFoundError(`Amendment not found: ${id}`);
    }

    if (!isTransitionAllowed(amendment.status, "approved")) {
      throw new BusinessRuleError(
        `Cannot approve amendment with status: ${amendment.status}`,
        "invalid_status_transition"
      );
    }

    const updated = await this.prisma.bil_amendments.update({
      where: { id },
      data: {
        status: "approved",
        approved_by: approvedBy,
        approved_at: new Date(),
        updated_by: approvedBy,
        updated_at: new Date(),
      },
    });

    logger.info({ amendmentId: id }, "[AmendmentService] Amendment approved");

    return updated;
  }

  /**
   * Reject an amendment
   */
  async rejectAmendment(
    id: string,
    tenantId: string,
    rejectedBy: string,
    reason: string
  ): Promise<Amendment> {
    logger.info(
      { id, tenantId, rejectedBy, reason },
      "[AmendmentService] Rejecting amendment"
    );

    const amendment = await this.getAmendment(id, tenantId);

    if (!amendment) {
      throw new NotFoundError(`Amendment not found: ${id}`);
    }

    if (!isTransitionAllowed(amendment.status, "rejected")) {
      throw new BusinessRuleError(
        `Cannot reject amendment with status: ${amendment.status}`,
        "invalid_status_transition"
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new ValidationError("Rejection reason is required");
    }

    const updated = await this.prisma.bil_amendments.update({
      where: { id },
      data: {
        status: "rejected",
        rejected_by: rejectedBy,
        rejected_at: new Date(),
        rejection_reason: reason,
        updated_by: rejectedBy,
        updated_at: new Date(),
      },
    });

    logger.info({ amendmentId: id }, "[AmendmentService] Amendment rejected");

    return updated;
  }

  /**
   * Apply an approved amendment
   */
  async applyAmendment(id: string, tenantId: string): Promise<Amendment> {
    logger.info({ id, tenantId }, "[AmendmentService] Applying amendment");

    const amendment = await this.getAmendmentWithRelations(id, tenantId);

    if (!amendment) {
      throw new NotFoundError(`Amendment not found: ${id}`);
    }

    if (amendment.status !== "approved") {
      throw new BusinessRuleError(
        `Cannot apply amendment with status: ${amendment.status}. Only approved amendments can be applied.`,
        "amendment_not_approved"
      );
    }

    // Check if effective date has arrived
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const effectiveDate = new Date(amendment.effective_date);
    effectiveDate.setHours(0, 0, 0, 0);

    if (effectiveDate > now) {
      throw new BusinessRuleError(
        `Cannot apply amendment before effective date: ${amendment.effective_date.toISOString()}`,
        "effective_date_not_reached"
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Calculate proration if needed
      let prorationAmount = 0;
      if (amendment.proration_behavior === "create_prorations") {
        const proration = await this.calculateProrationInternal(amendment);
        prorationAmount = proration.netAmount;
      }

      // Apply changes to subscription
      const updateData: Prisma.clt_subscriptionsUpdateInput = {
        updated_at: new Date(),
      };

      if (amendment.new_plan_id) {
        updateData.xgunea8 = { connect: { id: amendment.new_plan_id } };
      }
      if (amendment.new_billing_cycle) {
        updateData.billing_cycle = amendment.new_billing_cycle;
      }

      await tx.clt_subscriptions.update({
        where: { id: amendment.subscription_id },
        data: updateData,
      });

      // Update amendment status
      const updated = await tx.bil_amendments.update({
        where: { id },
        data: {
          status: "applied",
          applied_at: new Date(),
          proration_amount: prorationAmount,
          updated_at: new Date(),
        },
      });

      return updated;
    });

    logger.info(
      { amendmentId: id, appliedAt: result.applied_at },
      "[AmendmentService] Amendment applied"
    );

    return result;
  }

  /**
   * Cancel an amendment
   */
  async cancelAmendment(
    id: string,
    tenantId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<Amendment> {
    logger.info(
      { id, tenantId, reason },
      "[AmendmentService] Canceling amendment"
    );

    const amendment = await this.getAmendment(id, tenantId);

    if (!amendment) {
      throw new NotFoundError(`Amendment not found: ${id}`);
    }

    if (!isTransitionAllowed(amendment.status, "canceled")) {
      throw new BusinessRuleError(
        `Cannot cancel amendment with status: ${amendment.status}`,
        "invalid_status_transition"
      );
    }

    const currentMetadata =
      typeof amendment.metadata === "object" && amendment.metadata !== null
        ? amendment.metadata
        : {};

    const updated = await this.prisma.bil_amendments.update({
      where: { id },
      data: {
        status: "canceled",
        metadata: {
          ...currentMetadata,
          cancellation_reason: reason,
          canceled_by: cancelledBy,
          canceled_at: new Date().toISOString(),
        },
        updated_by: cancelledBy,
        updated_at: new Date(),
      },
    });

    logger.info({ amendmentId: id }, "[AmendmentService] Amendment canceled");

    return updated;
  }

  // ===========================================================================
  // PRORATION
  // ===========================================================================

  /**
   * Calculate proration for an amendment
   */
  async calculateProration(
    id: string,
    tenantId: string
  ): Promise<ProrationResult> {
    const amendment = await this.getAmendmentWithRelations(id, tenantId);

    if (!amendment) {
      throw new NotFoundError(`Amendment not found: ${id}`);
    }

    return this.calculateProrationInternal(amendment);
  }

  /**
   * Preview amendment before application
   */
  async previewAmendment(
    id: string,
    tenantId: string
  ): Promise<AmendmentPreview> {
    const amendment = await this.getAmendmentWithRelations(id, tenantId);

    if (!amendment) {
      throw new NotFoundError(`Amendment not found: ${id}`);
    }

    const proration = await this.calculateProrationInternal(amendment);

    // Calculate MRR impact
    const oldPrice = Number(amendment.old_price || 0);
    const newPrice = Number(amendment.new_price || 0);
    const mrrImpact = newPrice - oldPrice;

    // NOTE: Relations (old_plan, new_plan) are NOT in schema.
    // Return null for plan details - must be fetched separately if needed.
    return {
      amendment,
      proration,
      oldPlan: amendment.old_plan_id
        ? { id: amendment.old_plan_id, name: null, price: oldPrice }
        : null,
      newPlan: amendment.new_plan_id
        ? { id: amendment.new_plan_id, name: null, price: newPrice }
        : null,
      mrrImpact,
    };
  }

  /**
   * Internal proration calculation
   *
   * NOTE: Relations are NOT in Prisma schema.
   * We fetch subscription separately via subscription_id.
   */
  private async calculateProrationInternal(
    amendment: AmendmentWithRelations
  ): Promise<ProrationResult> {
    const effectiveDate = new Date(amendment.effective_date);

    // Fetch subscription separately (no relation in schema)
    const subscription = await this.prisma.clt_subscriptions.findUnique({
      where: { id: amendment.subscription_id },
      select: {
        current_period_start: true,
        current_period_end: true,
      },
    });

    // Get current billing period (fallback to 30 days from now if no subscription)
    const now = new Date();
    const periodStart = subscription?.current_period_start
      ? new Date(subscription.current_period_start)
      : now;
    const periodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate days
    const totalDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.ceil(
      (periodEnd.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate amounts
    // Use old_price and new_price from amendment (stored at creation time)
    const oldDailyRate =
      Number(amendment.old_price || 0) / Math.max(totalDays, 1);
    const newDailyRate =
      Number(amendment.new_price || 0) / Math.max(totalDays, 1);

    const credit = oldDailyRate * Math.max(daysRemaining, 0);
    const debit = newDailyRate * Math.max(daysRemaining, 0);
    const netAmount = debit - credit;

    return {
      credit: Math.round(credit * 100) / 100,
      debit: Math.round(debit * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      daysRemaining: Math.max(daysRemaining, 0),
      daysInPeriod: totalDays,
      effectiveDate,
    };
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  /**
   * Get an amendment by ID
   */
  async getAmendment(id: string, tenantId: string): Promise<Amendment | null> {
    return this.prisma.bil_amendments.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
    });
  }

  /**
   * Get an amendment with all relations
   */
  async getAmendmentWithRelations(
    id: string,
    tenantId: string
  ): Promise<AmendmentWithRelations | null> {
    // NOTE: Relations are NOT defined in Prisma schema.
    // Return base amendment - related data must be fetched separately if needed.
    return this.prisma.bil_amendments.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
    });
  }

  /**
   * Get an amendment by reference
   */
  async getAmendmentByReference(
    reference: string,
    tenantId: string
  ): Promise<Amendment | null> {
    return this.prisma.bil_amendments.findFirst({
      where: {
        amendment_reference: reference,
        tenant_id: tenantId,
        deleted_at: null,
      },
    });
  }

  /**
   * List amendments with filters
   */
  async listAmendments(
    tenantId: string,
    filters?: AmendmentFilters
  ): Promise<PaginatedResult<Amendment>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.bil_amendmentsWhereInput = {
      tenant_id: tenantId,
      deleted_at: null,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.amendmentType && { amendment_type: filters.amendmentType }),
      ...(filters?.tenantId && { tenant_id: filters.tenantId }),
      ...(filters?.subscriptionId && {
        subscription_id: filters.subscriptionId,
      }),
      ...(filters?.scheduleId && { schedule_id: filters.scheduleId }),
      ...(filters?.effectiveDateFrom && {
        effective_date: { gte: filters.effectiveDateFrom },
      }),
      ...(filters?.effectiveDateTo && {
        effective_date: { lte: filters.effectiveDateTo },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.bil_amendments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.bil_amendments.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get amendments by subscription
   */
  async getAmendmentsBySubscription(
    subscriptionId: string,
    tenantId: string
  ): Promise<Amendment[]> {
    return this.prisma.bil_amendments.findMany({
      where: {
        subscription_id: subscriptionId,
        tenant_id: tenantId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Get amendments by schedule
   */
  async getAmendmentsBySchedule(
    scheduleId: string,
    tenantId: string
  ): Promise<Amendment[]> {
    return this.prisma.bil_amendments.findMany({
      where: {
        schedule_id: scheduleId,
        tenant_id: tenantId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Get pending amendments (awaiting approval)
   */
  async getPendingAmendments(tenantId: string): Promise<Amendment[]> {
    return this.prisma.bil_amendments.findMany({
      where: {
        tenant_id: tenantId,
        status: "pending_approval",
        deleted_at: null,
      },
      orderBy: { created_at: "asc" },
    });
  }

  /**
   * Get amendments ready to apply (approved and effective date reached)
   */
  async getAmendmentsToApply(tenantId: string): Promise<Amendment[]> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return this.prisma.bil_amendments.findMany({
      where: {
        tenant_id: tenantId,
        status: "approved",
        effective_date: { lte: now },
        deleted_at: null,
      },
      orderBy: { effective_date: "asc" },
    });
  }

  // ===========================================================================
  // BATCH OPERATIONS (CRON)
  // ===========================================================================

  /**
   * Apply all due amendments
   * Returns the number of amendments applied
   */
  async applyDueAmendments(tenantId: string): Promise<number> {
    logger.info({ tenantId }, "[AmendmentService] Applying due amendments");

    const amendmentsToApply = await this.getAmendmentsToApply(tenantId);

    let appliedCount = 0;

    for (const amendment of amendmentsToApply) {
      try {
        await this.applyAmendment(amendment.id, tenantId);
        appliedCount++;
      } catch (error) {
        logger.error(
          { amendmentId: amendment.id, error },
          "[AmendmentService] Failed to apply amendment"
        );
      }
    }

    logger.info(
      { tenantId, appliedCount },
      "[AmendmentService] Due amendments processed"
    );

    return appliedCount;
  }

  /**
   * Send approval reminders for pending amendments
   * Returns the number of reminders that would be sent
   */
  async sendApprovalReminders(
    tenantId: string,
    daysThreshold: number
  ): Promise<number> {
    logger.info(
      { tenantId, daysThreshold },
      "[AmendmentService] Checking for approval reminders"
    );

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const pendingAmendments = await this.prisma.bil_amendments.findMany({
      where: {
        tenant_id: tenantId,
        status: "pending_approval",
        created_at: { lte: thresholdDate },
        deleted_at: null,
      },
    });

    // In a real implementation, this would trigger notification service
    logger.info(
      { tenantId, reminderCount: pendingAmendments.length },
      "[AmendmentService] Approval reminders identified"
    );

    return pendingAmendments.length;
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  /**
   * Count amendments by status
   */
  async countByStatus(
    tenantId: string
  ): Promise<Record<amendment_status, number>> {
    const counts = await this.prisma.bil_amendments.groupBy({
      by: ["status"],
      where: {
        tenant_id: tenantId,
        deleted_at: null,
      },
      _count: true,
    });

    const result: Record<amendment_status, number> = {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      applied: 0,
      rejected: 0,
      canceled: 0,
    };

    for (const count of counts) {
      result[count.status] = count._count;
    }

    return result;
  }

  /**
   * Count amendments by type
   */
  async countByType(tenantId: string): Promise<Record<amendment_type, number>> {
    const counts = await this.prisma.bil_amendments.groupBy({
      by: ["amendment_type"],
      where: {
        tenant_id: tenantId,
        deleted_at: null,
      },
      _count: true,
    });

    const result: Record<amendment_type, number> = {
      upgrade: 0,
      downgrade: 0,
      quantity_change: 0,
      plan_change: 0,
      billing_change: 0,
      cancel_immediate: 0,
      cancel_scheduled: 0,
      pause: 0,
      resume: 0,
    };

    for (const count of counts) {
      result[count.amendment_type] = count._count;
    }

    return result;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const amendmentService = new AmendmentService();
