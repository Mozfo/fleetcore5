/**
 * Subscription Schedule Service - Billing Schedule Orchestration
 *
 * This service orchestrates multi-phase subscription schedules:
 * 1. Create and manage subscription schedules with multiple phases
 * 2. Handle phase transitions (automatic or manual)
 * 3. Lifecycle management (activate, complete, cancel, release)
 * 4. Batch operations for CRON jobs (phase transitions)
 *
 * @module lib/services/billing/subscription-schedule.service
 */

import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import {
  Prisma,
  schedule_status,
  schedule_end_behavior,
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
 * Subscription Schedule base type
 */
export type SubscriptionSchedule =
  Prisma.bil_subscription_schedulesGetPayload<object>;

/**
 * Schedule Phase base type
 */
export type SchedulePhase =
  Prisma.bil_subscription_schedule_phasesGetPayload<object>;

/**
 * Schedule with phases included
 *
 * NOTE: Relations (phases, tenant, order) are NOT defined in Prisma schema.
 * We define this as a composite type manually. Phases must be queried separately.
 */
export type ScheduleWithPhases = SubscriptionSchedule & {
  phases?: SchedulePhase[];
};

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
 * Parameters for creating a subscription schedule
 */
export interface CreateScheduleInput {
  tenantId: string;
  providerId: string;
  userId: string;
  orderId?: string;
  startDate: Date;
  endDate?: Date;
  endBehavior?: schedule_end_behavior;
  currency?: string;
  metadata?: Prisma.InputJsonValue;
  phases?: CreatePhaseInput[];
}

/**
 * Parameters for updating a subscription schedule
 */
export interface UpdateScheduleInput {
  endDate?: Date;
  endBehavior?: schedule_end_behavior;
  currency?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Parameters for creating a schedule phase
 */
export interface CreatePhaseInput {
  planId?: string;
  phaseName?: string;
  startDate: Date;
  endDate: Date;
  durationMonths?: number;
  unitPrice: number;
  quantity?: number;
  discountPercent?: number;
  discountAmount?: number;
  billingCycle?: billing_interval;
  prorationBehavior?: proration_behavior;
  trialDays?: number;
  stripePriceId?: string;
  stripeCouponId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Parameters for updating a phase
 */
export interface UpdatePhaseInput {
  phaseName?: string;
  startDate?: Date;
  endDate?: Date;
  durationMonths?: number;
  unitPrice?: number;
  quantity?: number;
  discountPercent?: number;
  discountAmount?: number;
  billingCycle?: billing_interval;
  prorationBehavior?: proration_behavior;
  trialDays?: number;
  stripePriceId?: string;
  stripeCouponId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Filters for listing schedules
 */
export interface ScheduleFilters {
  status?: schedule_status;
  tenantId?: string;
  orderId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  page?: number;
  limit?: number;
}

// =============================================================================
// ALLOWED STATUS TRANSITIONS
// =============================================================================

const ALLOWED_TRANSITIONS: Record<schedule_status, schedule_status[]> = {
  not_started: ["active", "canceled"],
  active: ["completed", "canceled", "released"],
  completed: [],
  canceled: [],
  released: [],
};

/**
 * Check if a status transition is allowed
 */
function isTransitionAllowed(
  from: schedule_status,
  to: schedule_status
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// SERVICE
// =============================================================================

/**
 * Subscription Schedule Service
 *
 * Orchestrates subscription schedule creation, phase management,
 * and lifecycle transitions.
 *
 * @example
 * ```typescript
 * // Create a schedule with phases
 * const schedule = await subscriptionScheduleService.createSchedule({
 *   tenantId: "tenant-uuid",
 *   providerId: "provider-uuid",
 *   userId: "user-uuid",
 *   startDate: new Date("2025-01-01"),
 *   phases: [
 *     { startDate: new Date("2025-01-01"), endDate: new Date("2025-06-30"), unitPrice: 99 },
 *     { startDate: new Date("2025-07-01"), endDate: new Date("2025-12-31"), unitPrice: 149 },
 *   ]
 * });
 * ```
 */
export class SubscriptionScheduleService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  // ===========================================================================
  // REFERENCE GENERATION
  // ===========================================================================

  /**
   * Generate a unique schedule reference
   * Format: SCH-YYYY-NNNNN (e.g., SCH-2025-00001)
   */
  async generateScheduleReference(
    providerId: string,
    tx?: PrismaTransaction
  ): Promise<string> {
    const client = tx || this.prisma;
    const year = new Date().getFullYear();
    const prefix = `SCH-${year}-`;

    const lastSchedule = await client.bil_subscription_schedules.findFirst({
      where: {
        provider_id: providerId,
        schedule_reference: { startsWith: prefix },
        deleted_at: null,
      },
      orderBy: { schedule_reference: "desc" },
    });

    let nextNumber = 1;
    if (lastSchedule?.schedule_reference) {
      const match = lastSchedule.schedule_reference.match(/SCH-\d{4}-(\d{5})$/);
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
   * Create a new subscription schedule
   */
  async createSchedule(
    input: CreateScheduleInput
  ): Promise<ScheduleWithPhases> {
    logger.info({ input }, "[SubscriptionScheduleService] Creating schedule");

    // Validate tenant exists
    const tenant = await this.prisma.adm_tenants.findUnique({
      where: { id: input.tenantId },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant not found: ${input.tenantId}`);
    }

    // Validate order if provided
    if (input.orderId) {
      const order = await this.prisma.crm_orders.findUnique({
        where: { id: input.orderId },
      });

      if (!order) {
        throw new NotFoundError(`Order not found: ${input.orderId}`);
      }
    }

    // Validate phases if provided
    if (input.phases && input.phases.length > 0) {
      this.validatePhases(input.phases);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const reference = await this.generateScheduleReference(
        input.providerId,
        tx
      );

      // Create schedule
      const schedule = await tx.bil_subscription_schedules.create({
        data: {
          schedule_reference: reference,
          tenant_id: input.tenantId,
          provider_id: input.providerId,
          order_id: input.orderId,
          status: "not_started",
          end_behavior: input.endBehavior || "cancel",
          start_date: input.startDate,
          end_date: input.endDate,
          currency: input.currency || "EUR",
          total_phases: input.phases?.length || 0,
          total_contract_value: 0,
          metadata: input.metadata ?? Prisma.JsonNull,
          created_by: input.userId,
        },
      });

      // Create phases if provided
      if (input.phases && input.phases.length > 0) {
        for (let i = 0; i < input.phases.length; i++) {
          const phase = input.phases[i];
          const phaseTotal = this.calculatePhaseTotal(phase);

          await tx.bil_subscription_schedule_phases.create({
            data: {
              schedule_id: schedule.id,
              provider_id: input.providerId,
              plan_id: phase.planId,
              phase_number: i + 1,
              phase_name: phase.phaseName,
              start_date: phase.startDate,
              end_date: phase.endDate,
              duration_months: phase.durationMonths,
              unit_price: phase.unitPrice,
              quantity: phase.quantity || 1,
              discount_percent: phase.discountPercent || 0,
              discount_amount: phase.discountAmount || 0,
              phase_total: phaseTotal,
              billing_cycle: phase.billingCycle || "month",
              proration_behavior:
                phase.prorationBehavior || "create_prorations",
              trial_days: phase.trialDays || 0,
              stripe_price_id: phase.stripePriceId,
              stripe_coupon_id: phase.stripeCouponId,
              metadata: phase.metadata ?? Prisma.JsonNull,
            },
          });
        }

        // Calculate total contract value
        const totalValue = input.phases.reduce(
          (sum, p) => sum + this.calculatePhaseTotal(p),
          0
        );

        await tx.bil_subscription_schedules.update({
          where: { id: schedule.id },
          data: { total_contract_value: totalValue },
        });
      }

      return schedule;
    });

    logger.info(
      { scheduleId: result.id, reference: result.schedule_reference },
      "[SubscriptionScheduleService] Schedule created"
    );

    return this.getScheduleWithPhases(
      result.id,
      input.providerId
    ) as Promise<ScheduleWithPhases>;
  }

  /**
   * Update a subscription schedule
   */
  async updateSchedule(
    id: string,
    providerId: string,
    input: UpdateScheduleInput,
    userId: string
  ): Promise<SubscriptionSchedule> {
    logger.info(
      { id, providerId, input },
      "[SubscriptionScheduleService] Updating schedule"
    );

    const schedule = await this.getSchedule(id, providerId);

    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${id}`);
    }

    // Only allow updates for not_started or active schedules
    if (!["not_started", "active"].includes(schedule.status)) {
      throw new BusinessRuleError(
        `Cannot update schedule with status: ${schedule.status}`,
        "schedule_not_updatable"
      );
    }

    const updated = await this.prisma.bil_subscription_schedules.update({
      where: { id },
      data: {
        end_date: input.endDate,
        end_behavior: input.endBehavior,
        currency: input.currency,
        metadata: input.metadata,
        updated_by: userId,
        updated_at: new Date(),
      },
    });

    logger.info(
      { scheduleId: id },
      "[SubscriptionScheduleService] Schedule updated"
    );

    return updated;
  }

  /**
   * Soft delete a subscription schedule
   */
  async deleteSchedule(
    id: string,
    providerId: string,
    deletedBy: string,
    reason?: string
  ): Promise<void> {
    logger.info(
      { id, providerId },
      "[SubscriptionScheduleService] Deleting schedule"
    );

    const schedule = await this.getSchedule(id, providerId);

    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${id}`);
    }

    // Only allow deletion of not_started schedules
    if (schedule.status !== "not_started") {
      throw new BusinessRuleError(
        `Cannot delete schedule with status: ${schedule.status}. Only not_started schedules can be deleted.`,
        "schedule_not_deletable"
      );
    }

    await this.prisma.bil_subscription_schedules.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: deletedBy,
        deletion_reason: reason,
      },
    });

    logger.info(
      { scheduleId: id },
      "[SubscriptionScheduleService] Schedule deleted"
    );
  }

  // ===========================================================================
  // PHASE MANAGEMENT
  // ===========================================================================

  /**
   * Add a phase to a schedule
   */
  async addPhase(
    scheduleId: string,
    providerId: string,
    input: CreatePhaseInput
  ): Promise<SchedulePhase> {
    logger.info(
      { scheduleId, providerId, input },
      "[SubscriptionScheduleService] Adding phase"
    );

    const schedule = await this.getScheduleWithPhases(scheduleId, providerId);

    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${scheduleId}`);
    }

    // Only allow adding phases to not_started or active schedules
    if (!["not_started", "active"].includes(schedule.status)) {
      throw new BusinessRuleError(
        `Cannot add phase to schedule with status: ${schedule.status}`,
        "schedule_not_updatable"
      );
    }

    // Validate phase dates
    const phases = schedule.phases ?? [];
    if (phases.length > 0) {
      const lastPhase = phases[phases.length - 1];
      if (input.startDate <= lastPhase.end_date) {
        throw new ValidationError(
          `Phase start date must be after the last phase end date (${lastPhase.end_date.toISOString()})`
        );
      }
    }

    const phaseNumber = phases.length + 1;
    const phaseTotal = this.calculatePhaseTotal(input);

    const result = await this.prisma.$transaction(async (tx) => {
      const phase = await tx.bil_subscription_schedule_phases.create({
        data: {
          schedule_id: scheduleId,
          provider_id: providerId,
          plan_id: input.planId,
          phase_number: phaseNumber,
          phase_name: input.phaseName,
          start_date: input.startDate,
          end_date: input.endDate,
          duration_months: input.durationMonths,
          unit_price: input.unitPrice,
          quantity: input.quantity || 1,
          discount_percent: input.discountPercent || 0,
          discount_amount: input.discountAmount || 0,
          phase_total: phaseTotal,
          billing_cycle: input.billingCycle || "month",
          proration_behavior: input.prorationBehavior || "create_prorations",
          trial_days: input.trialDays || 0,
          stripe_price_id: input.stripePriceId,
          stripe_coupon_id: input.stripeCouponId,
          metadata: input.metadata ?? Prisma.JsonNull,
        },
      });

      // Update schedule totals
      await tx.bil_subscription_schedules.update({
        where: { id: scheduleId },
        data: {
          total_phases: phaseNumber,
          total_contract_value: {
            increment: phaseTotal,
          },
        },
      });

      return phase;
    });

    logger.info(
      { scheduleId, phaseId: result.id, phaseNumber },
      "[SubscriptionScheduleService] Phase added"
    );

    return result;
  }

  /**
   * Update a phase
   */
  async updatePhase(
    phaseId: string,
    providerId: string,
    input: UpdatePhaseInput
  ): Promise<SchedulePhase> {
    logger.info(
      { phaseId, providerId, input },
      "[SubscriptionScheduleService] Updating phase"
    );

    const phase = await this.prisma.bil_subscription_schedule_phases.findFirst({
      where: {
        id: phaseId,
        provider_id: providerId,
      },
    });

    if (!phase) {
      throw new NotFoundError(`Phase not found: ${phaseId}`);
    }

    // Fetch schedule separately (no relation in schema)
    const schedule = await this.prisma.bil_subscription_schedules.findFirst({
      where: { id: phase.schedule_id },
    });

    // Only allow updates for not_started or active schedules
    if (!schedule || !["not_started", "active"].includes(schedule.status)) {
      throw new BusinessRuleError(
        `Cannot update phase in schedule with status: ${schedule?.status ?? "unknown"}`,
        "schedule_not_updatable"
      );
    }

    // Calculate old and new totals for updating schedule
    const oldTotal = Number(phase.phase_total);
    const newTotal = this.calculatePhaseTotal({
      unitPrice: input.unitPrice ?? Number(phase.unit_price),
      quantity: input.quantity ?? phase.quantity,
      discountPercent: input.discountPercent ?? Number(phase.discount_percent),
      discountAmount: input.discountAmount ?? Number(phase.discount_amount),
      startDate: input.startDate ?? phase.start_date,
      endDate: input.endDate ?? phase.end_date,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.bil_subscription_schedule_phases.update({
        where: { id: phaseId },
        data: {
          phase_name: input.phaseName,
          start_date: input.startDate,
          end_date: input.endDate,
          duration_months: input.durationMonths,
          unit_price: input.unitPrice,
          quantity: input.quantity,
          discount_percent: input.discountPercent,
          discount_amount: input.discountAmount,
          phase_total: newTotal,
          billing_cycle: input.billingCycle,
          proration_behavior: input.prorationBehavior,
          trial_days: input.trialDays,
          stripe_price_id: input.stripePriceId,
          stripe_coupon_id: input.stripeCouponId,
          metadata: input.metadata,
          updated_at: new Date(),
        },
      });

      // Update schedule total contract value
      await tx.bil_subscription_schedules.update({
        where: { id: phase.schedule_id },
        data: {
          total_contract_value: {
            increment: newTotal - oldTotal,
          },
        },
      });

      return updated;
    });

    logger.info({ phaseId }, "[SubscriptionScheduleService] Phase updated");

    return result;
  }

  /**
   * Remove a phase from a schedule
   */
  async removePhase(phaseId: string, providerId: string): Promise<void> {
    logger.info(
      { phaseId, providerId },
      "[SubscriptionScheduleService] Removing phase"
    );

    const phase = await this.prisma.bil_subscription_schedule_phases.findFirst({
      where: {
        id: phaseId,
        provider_id: providerId,
      },
    });

    if (!phase) {
      throw new NotFoundError(`Phase not found: ${phaseId}`);
    }

    // Fetch schedule separately (no relation in schema)
    const schedule = await this.prisma.bil_subscription_schedules.findFirst({
      where: { id: phase.schedule_id },
    });

    // Only allow removal for not_started schedules
    if (!schedule || schedule.status !== "not_started") {
      throw new BusinessRuleError(
        `Cannot remove phase from schedule with status: ${schedule?.status ?? "unknown"}`,
        "schedule_not_updatable"
      );
    }

    const phaseTotal = Number(phase.phase_total);

    await this.prisma.$transaction(async (tx) => {
      // Delete the phase
      await tx.bil_subscription_schedule_phases.delete({
        where: { id: phaseId },
      });

      // Renumber subsequent phases
      await tx.bil_subscription_schedule_phases.updateMany({
        where: {
          schedule_id: phase.schedule_id,
          phase_number: { gt: phase.phase_number },
        },
        data: {
          phase_number: { decrement: 1 },
        },
      });

      // Update schedule totals
      await tx.bil_subscription_schedules.update({
        where: { id: phase.schedule_id },
        data: {
          total_phases: { decrement: 1 },
          total_contract_value: { decrement: phaseTotal },
        },
      });
    });

    logger.info({ phaseId }, "[SubscriptionScheduleService] Phase removed");
  }

  /**
   * Get all phases for a schedule
   */
  async getPhases(
    scheduleId: string,
    providerId: string
  ): Promise<SchedulePhase[]> {
    const schedule = await this.getSchedule(scheduleId, providerId);

    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${scheduleId}`);
    }

    return this.prisma.bil_subscription_schedule_phases.findMany({
      where: { schedule_id: scheduleId },
      orderBy: { phase_number: "asc" },
    });
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Activate a schedule (start execution)
   */
  async activateSchedule(
    id: string,
    providerId: string
  ): Promise<SubscriptionSchedule> {
    logger.info(
      { id, providerId },
      "[SubscriptionScheduleService] Activating schedule"
    );

    const schedule = await this.getScheduleWithPhases(id, providerId);

    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${id}`);
    }

    if (schedule.status !== "not_started") {
      throw new BusinessRuleError(
        `Cannot activate schedule with status: ${schedule.status}. Only not_started schedules can be activated.`,
        "schedule_not_activatable"
      );
    }

    const schedulePhases = schedule.phases ?? [];
    if (schedulePhases.length === 0) {
      throw new BusinessRuleError(
        "Cannot activate schedule without phases. Add at least one phase first.",
        "schedule_has_no_phases"
      );
    }

    const firstPhase = schedulePhases[0];

    const updated = await this.prisma.bil_subscription_schedules.update({
      where: { id },
      data: {
        status: "active",
        current_phase_number: 1,
        current_phase_start: firstPhase.start_date,
        current_phase_end: firstPhase.end_date,
        updated_at: new Date(),
      },
    });

    logger.info(
      { scheduleId: id },
      "[SubscriptionScheduleService] Schedule activated"
    );

    return updated;
  }

  /**
   * Transition to the next phase
   */
  async transitionToNextPhase(
    id: string,
    providerId: string
  ): Promise<SubscriptionSchedule> {
    logger.info(
      { id, providerId },
      "[SubscriptionScheduleService] Transitioning to next phase"
    );

    const schedule = await this.getScheduleWithPhases(id, providerId);

    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${id}`);
    }

    if (schedule.status !== "active") {
      throw new BusinessRuleError(
        `Cannot transition phase for schedule with status: ${schedule.status}`,
        "schedule_not_active"
      );
    }

    const currentPhaseNumber = schedule.current_phase_number || 1;
    const nextPhaseNumber = currentPhaseNumber + 1;

    // Check if there's a next phase
    const nextPhase = (schedule.phases ?? []).find(
      (p) => p.phase_number === nextPhaseNumber
    );

    if (!nextPhase) {
      // No more phases - complete the schedule
      return this.completeSchedule(id, providerId);
    }

    const updated = await this.prisma.bil_subscription_schedules.update({
      where: { id },
      data: {
        current_phase_number: nextPhaseNumber,
        current_phase_start: nextPhase.start_date,
        current_phase_end: nextPhase.end_date,
        updated_at: new Date(),
      },
    });

    logger.info(
      {
        scheduleId: id,
        fromPhase: currentPhaseNumber,
        toPhase: nextPhaseNumber,
      },
      "[SubscriptionScheduleService] Phase transition completed"
    );

    return updated;
  }

  /**
   * Complete a schedule (mark as finished)
   */
  async completeSchedule(
    id: string,
    providerId: string
  ): Promise<SubscriptionSchedule> {
    logger.info(
      { id, providerId },
      "[SubscriptionScheduleService] Completing schedule"
    );

    const schedule = await this.getSchedule(id, providerId);

    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${id}`);
    }

    if (!isTransitionAllowed(schedule.status, "completed")) {
      throw new BusinessRuleError(
        `Cannot complete schedule with status: ${schedule.status}`,
        "invalid_status_transition"
      );
    }

    const updated = await this.prisma.bil_subscription_schedules.update({
      where: { id },
      data: {
        status: "completed",
        updated_at: new Date(),
      },
    });

    logger.info(
      { scheduleId: id },
      "[SubscriptionScheduleService] Schedule completed"
    );

    return updated;
  }

  /**
   * Cancel a schedule
   */
  async cancelSchedule(
    id: string,
    providerId: string,
    reason?: string
  ): Promise<SubscriptionSchedule> {
    logger.info(
      { id, providerId, reason },
      "[SubscriptionScheduleService] Canceling schedule"
    );

    const schedule = await this.getSchedule(id, providerId);

    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${id}`);
    }

    if (!isTransitionAllowed(schedule.status, "canceled")) {
      throw new BusinessRuleError(
        `Cannot cancel schedule with status: ${schedule.status}`,
        "invalid_status_transition"
      );
    }

    const updated = await this.prisma.bil_subscription_schedules.update({
      where: { id },
      data: {
        status: "canceled",
        metadata: {
          ...(schedule.metadata as object),
          cancellation_reason: reason,
          canceled_at: new Date().toISOString(),
        },
        updated_at: new Date(),
      },
    });

    logger.info(
      { scheduleId: id },
      "[SubscriptionScheduleService] Schedule canceled"
    );

    return updated;
  }

  /**
   * Release a schedule (convert to normal subscription)
   */
  async releaseSchedule(
    id: string,
    providerId: string
  ): Promise<SubscriptionSchedule> {
    logger.info(
      { id, providerId },
      "[SubscriptionScheduleService] Releasing schedule"
    );

    const schedule = await this.getSchedule(id, providerId);

    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${id}`);
    }

    if (!isTransitionAllowed(schedule.status, "released")) {
      throw new BusinessRuleError(
        `Cannot release schedule with status: ${schedule.status}`,
        "invalid_status_transition"
      );
    }

    const updated = await this.prisma.bil_subscription_schedules.update({
      where: { id },
      data: {
        status: "released",
        metadata: {
          ...(schedule.metadata as object),
          released_at: new Date().toISOString(),
        },
        updated_at: new Date(),
      },
    });

    logger.info(
      { scheduleId: id },
      "[SubscriptionScheduleService] Schedule released"
    );

    return updated;
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  /**
   * Get a schedule by ID
   */
  async getSchedule(
    id: string,
    providerId: string
  ): Promise<SubscriptionSchedule | null> {
    return this.prisma.bil_subscription_schedules.findFirst({
      where: {
        id,
        provider_id: providerId,
        deleted_at: null,
      },
    });
  }

  /**
   * Get a schedule with phases included
   */
  async getScheduleWithPhases(
    id: string,
    providerId: string
  ): Promise<ScheduleWithPhases | null> {
    // NOTE: Relations (phases, tenant, order) are NOT defined in Prisma schema.
    // We fetch schedule first, then phases separately.
    const schedule = await this.prisma.bil_subscription_schedules.findFirst({
      where: {
        id,
        provider_id: providerId,
        deleted_at: null,
      },
    });

    if (!schedule) return null;

    const phases = await this.prisma.bil_subscription_schedule_phases.findMany({
      where: { schedule_id: schedule.id },
      orderBy: { phase_number: "asc" },
    });

    return { ...schedule, phases };
  }

  /**
   * Get a schedule by reference
   */
  async getScheduleByReference(
    reference: string,
    providerId: string
  ): Promise<SubscriptionSchedule | null> {
    return this.prisma.bil_subscription_schedules.findFirst({
      where: {
        schedule_reference: reference,
        provider_id: providerId,
        deleted_at: null,
      },
    });
  }

  /**
   * List schedules with filters
   */
  async listSchedules(
    providerId: string,
    filters?: ScheduleFilters
  ): Promise<PaginatedResult<SubscriptionSchedule>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.bil_subscription_schedulesWhereInput = {
      provider_id: providerId,
      deleted_at: null,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.tenantId && { tenant_id: filters.tenantId }),
      ...(filters?.orderId && { order_id: filters.orderId }),
      ...(filters?.startDateFrom && {
        start_date: { gte: filters.startDateFrom },
      }),
      ...(filters?.startDateTo && { start_date: { lte: filters.startDateTo } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.bil_subscription_schedules.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.bil_subscription_schedules.count({ where }),
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
   * Get schedules by tenant
   */
  async getSchedulesByTenant(
    tenantId: string,
    providerId: string
  ): Promise<SubscriptionSchedule[]> {
    return this.prisma.bil_subscription_schedules.findMany({
      where: {
        tenant_id: tenantId,
        provider_id: providerId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Get schedules by order
   */
  async getSchedulesByOrder(
    orderId: string,
    providerId: string
  ): Promise<SubscriptionSchedule[]> {
    return this.prisma.bil_subscription_schedules.findMany({
      where: {
        order_id: orderId,
        provider_id: providerId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Get active schedules
   */
  async getActiveSchedules(
    providerId: string
  ): Promise<SubscriptionSchedule[]> {
    return this.prisma.bil_subscription_schedules.findMany({
      where: {
        provider_id: providerId,
        status: "active",
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  // ===========================================================================
  // BATCH OPERATIONS (CRON)
  // ===========================================================================

  /**
   * Check and process phase transitions for schedules
   * Returns the number of transitions performed
   */
  async checkPhaseTransitions(providerId: string): Promise<number> {
    logger.info(
      { providerId },
      "[SubscriptionScheduleService] Checking phase transitions"
    );

    const schedulesToTransition =
      await this.getSchedulesNeedingTransition(providerId);

    let transitionCount = 0;

    for (const schedule of schedulesToTransition) {
      try {
        await this.transitionToNextPhase(schedule.id, providerId);
        transitionCount++;
      } catch (error) {
        logger.error(
          { scheduleId: schedule.id, error },
          "[SubscriptionScheduleService] Failed to transition phase"
        );
      }
    }

    logger.info(
      { providerId, transitionCount },
      "[SubscriptionScheduleService] Phase transitions completed"
    );

    return transitionCount;
  }

  /**
   * Get schedules needing phase transition
   */
  async getSchedulesNeedingTransition(
    providerId: string
  ): Promise<SubscriptionSchedule[]> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return this.prisma.bil_subscription_schedules.findMany({
      where: {
        provider_id: providerId,
        status: "active",
        current_phase_end: { lt: now },
        deleted_at: null,
      },
    });
  }

  // ===========================================================================
  // CALCULATIONS
  // ===========================================================================

  /**
   * Recalculate total contract value
   */
  async recalculateTotalValue(
    id: string,
    providerId: string
  ): Promise<SubscriptionSchedule> {
    const schedule = await this.getScheduleWithPhases(id, providerId);

    if (!schedule) {
      throw new NotFoundError(`Schedule not found: ${id}`);
    }

    const totalValue = (schedule.phases ?? []).reduce(
      (sum, phase) => sum + Number(phase.phase_total),
      0
    );

    return this.prisma.bil_subscription_schedules.update({
      where: { id },
      data: {
        total_contract_value: totalValue,
        updated_at: new Date(),
      },
    });
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Calculate phase total from input
   */
  private calculatePhaseTotal(input: {
    unitPrice: number;
    quantity?: number;
    discountPercent?: number;
    discountAmount?: number;
    startDate?: Date;
    endDate?: Date;
  }): number {
    const quantity = input.quantity || 1;
    const subtotal = input.unitPrice * quantity;
    const percentDiscount = input.discountPercent
      ? subtotal * (input.discountPercent / 100)
      : 0;
    const fixedDiscount = input.discountAmount || 0;

    return Math.max(0, subtotal - percentDiscount - fixedDiscount);
  }

  /**
   * Validate phases array
   */
  private validatePhases(phases: CreatePhaseInput[]): void {
    if (phases.length === 0) {
      throw new ValidationError("At least one phase is required");
    }

    // Sort by start date
    const sortedPhases = [...phases].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    for (let i = 0; i < sortedPhases.length; i++) {
      const phase = sortedPhases[i];

      // Validate start date is before end date
      if (phase.startDate >= phase.endDate) {
        throw new ValidationError(
          `Phase ${i + 1}: start date must be before end date`
        );
      }

      // Validate no overlap with previous phase
      if (i > 0) {
        const previousPhase = sortedPhases[i - 1];
        if (phase.startDate <= previousPhase.endDate) {
          throw new ValidationError(
            `Phase ${i + 1}: start date overlaps with previous phase end date`
          );
        }
      }

      // Validate unit price
      if (phase.unitPrice < 0) {
        throw new ValidationError(
          `Phase ${i + 1}: unit price cannot be negative`
        );
      }
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const subscriptionScheduleService = new SubscriptionScheduleService();
