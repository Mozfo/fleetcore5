"use server";

/**
 * CRM Order Server Actions
 *
 * Server Actions for order lifecycle management in Quote-to-Cash flow.
 * All actions require admin authentication.
 *
 * Security:
 * 1. All actions require requireCrmAuth (HQ org check)
 * 2. Tenant isolation via session.orgId
 * 3. All inputs validated with Zod schemas
 *
 * Action Categories:
 * - CRUD: createOrder (from opportunity)
 * - Workflow: updateStatus, updateFulfillment, cancel, activate, fulfill
 * - Queries: getOrder, list, byOpportunity, byLead, stats
 * - CRON: getExpiring, getAutoRenewable
 *
 * NOTE: Unlike quotes, orders have NO public actions.
 * All order management is admin-only.
 *
 * @module lib/actions/crm/orders.actions
 */

import { requireCrmAuth } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getAuditLogUuids } from "@/lib/utils/audit-resolver";
import { orderService } from "@/lib/services/crm/order.service";
import { orderRepository } from "@/lib/repositories/crm/order.repository";
import { NotFoundError, ValidationError } from "@/lib/core/errors";
import {
  CreateOrderFromOpportunitySchema,
  UpdateOrderStatusSchema,
  UpdateFulfillmentStatusSchema,
  CancelOrderSchema,
  OrderQuerySchema,
  type CreateOrderFromOpportunityInput,
  type UpdateOrderStatusInput,
  type UpdateFulfillmentStatusInput,
  type CancelOrderInput,
  type OrderQueryInput,
} from "@/lib/validators/crm/order.validators";
import type {
  Order,
  OrderWithRelations,
} from "@/lib/repositories/crm/order.repository";
import type { OrderCreationResult } from "@/lib/services/crm/order.service";

// =============================================================================
// INLINE SCHEMAS (not in validators)
// =============================================================================

const UuidSchema = z.string().uuid("Invalid ID format");
const DaysSchema = z.number().int().min(1).max(365).default(30);

// =============================================================================
// RESULT TYPES
// =============================================================================

/** Result for creating an order */
export type CreateOrderResult =
  | { success: true; data: OrderCreationResult }
  | { success: false; error: string };

/** Result for updating order status */
export type UpdateOrderStatusResult =
  | { success: true; order: Order }
  | { success: false; error: string };

/** Result for updating fulfillment status */
export type UpdateFulfillmentStatusResult =
  | { success: true; order: Order }
  | { success: false; error: string };

/** Result for cancelling an order */
export type CancelOrderResult =
  | { success: true; order: Order }
  | { success: false; error: string };

/** Result for getting a single order */
export type GetOrderResult =
  | { success: true; order: OrderWithRelations | null }
  | { success: false; error: string };

/** Result for listing orders */
export type ListOrdersResult =
  | {
      success: true;
      orders: Order[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }
  | { success: false; error: string };

/** Result for getting orders by opportunity/lead */
export type GetOrdersArrayResult =
  | { success: true; orders: Order[] }
  | { success: false; error: string };

/** Result for order stats */
export type GetOrderStatsResult =
  | { success: true; activeCount: number }
  | { success: false; error: string };

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check admin authorization
 * Returns error message if not authorized, context if OK
 * Tenant isolation via session.orgId
 */
async function checkAdminAuth(): Promise<
  { userId: string; orgId: string; tenantId: string } | { error: string }
> {
  try {
    const session = await requireCrmAuth();
    const { userId, orgId } = session;

    if (!orgId) {
      return { error: "Tenant context required" };
    }

    return { userId, orgId, tenantId: orgId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return { error: message };
  }
}

// =============================================================================
// CRUD ACTIONS (Admin Only)
// =============================================================================

/**
 * Create an order from a won opportunity
 *
 * This is the primary way to create orders in FleetCore.
 * Orders are created when an opportunity is marked as "won".
 *
 * @param input - Order creation data (validated with CreateOrderFromOpportunitySchema)
 * @returns Created order with opportunity update details
 */
export async function createOrderAction(
  input: CreateOrderFromOpportunityInput
): Promise<CreateOrderResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, tenantId } = authResult;

    // 2. Validate input
    const validation = CreateOrderFromOpportunitySchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Create via service
    const result = await orderService.createOrderFromOpportunity({
      opportunityId: validated.opportunityId,
      tenantId,
      userId,
      totalValue: validated.totalValue,
      currency: validated.currency,
      billingCycle: validated.billingCycle,
      effectiveDate: validated.effectiveDate,
      durationMonths: validated.durationMonths,
      autoRenew: validated.autoRenew,
      noticePeriodDays: validated.noticePeriodDays,
      monthlyValue: validated.monthlyValue,
      annualValue: validated.annualValue,
      orderType: validated.orderType,
      metadata: validated.metadata,
    });

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_order",
          entity_id: result.order.id,
          action: "CREATE",
          new_values: {
            order_reference: result.order.order_reference,
            opportunity_id: validated.opportunityId,
            total_value: validated.totalValue.toString(),
            currency: validated.currency,
            billing_cycle: validated.billingCycle,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/orders", "page");
    revalidatePath("/[locale]/(app)/crm/opportunities", "page");

    logger.info(
      {
        orderId: result.order.id,
        orderReference: result.order.order_reference,
        opportunityId: validated.opportunityId,
        totalValue: validated.totalValue,
        userId,
      },
      "[createOrderAction] Order created from opportunity"
    );

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }

    logger.error({ error }, "[createOrderAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create order";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// WORKFLOW ACTIONS (Admin Only)
// =============================================================================

/**
 * Update order status
 *
 * @param input - Order ID and new status
 * @returns Updated order
 */
export async function updateOrderStatusAction(
  input: UpdateOrderStatusInput
): Promise<UpdateOrderStatusResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, tenantId } = authResult;

    // 2. Validate input
    const validation = UpdateOrderStatusSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Update via service
    const order = await orderService.updateOrderStatus(
      validated.orderId,
      validated.status,
      userId,
      tenantId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_order",
          entity_id: validated.orderId,
          action: "UPDATE",
          new_values: {
            status: validated.status,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/orders", "page");

    logger.info(
      {
        orderId: validated.orderId,
        newStatus: validated.status,
        userId,
      },
      "[updateOrderStatusAction] Order status updated"
    );

    return { success: true, order };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, input }, "[updateOrderStatusAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update order status";
    return { success: false, error: errorMessage };
  }
}

/**
 * Update order fulfillment status
 *
 * Fulfillment lifecycle:
 * pending → ready_for_fulfillment → in_progress → fulfilled → active
 *                                                           ↓
 *                                              cancelled / expired
 *
 * @param input - Order ID and new fulfillment status
 * @returns Updated order
 */
export async function updateFulfillmentStatusAction(
  input: UpdateFulfillmentStatusInput
): Promise<UpdateFulfillmentStatusResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, tenantId } = authResult;

    // 2. Validate input
    const validation = UpdateFulfillmentStatusSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Update via service
    const order = await orderService.updateFulfillmentStatus(
      validated.orderId,
      validated.fulfillmentStatus,
      userId,
      tenantId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_order",
          entity_id: validated.orderId,
          action: "UPDATE",
          new_values: {
            fulfillment_status: validated.fulfillmentStatus,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/orders", "page");

    logger.info(
      {
        orderId: validated.orderId,
        newFulfillmentStatus: validated.fulfillmentStatus,
        userId,
      },
      "[updateFulfillmentStatusAction] Order fulfillment status updated"
    );

    return { success: true, order };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, input }, "[updateFulfillmentStatusAction] Error");
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update fulfillment status";
    return { success: false, error: errorMessage };
  }
}

/**
 * Cancel an order
 *
 * @param input - Order ID and cancellation reason
 * @returns Cancelled order
 */
export async function cancelOrderAction(
  input: CancelOrderInput
): Promise<CancelOrderResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, tenantId } = authResult;

    // 2. Validate input
    const validation = CancelOrderSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Cancel via service
    const order = await orderService.cancelOrder(
      validated.orderId,
      validated.reason,
      userId,
      tenantId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_order",
          entity_id: validated.orderId,
          action: "CANCEL",
          new_values: {
            status: "cancelled",
            fulfillment_status: "cancelled",
            cancellation_reason: validated.reason,
          },
          severity: "warning",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/orders", "page");

    logger.info(
      {
        orderId: validated.orderId,
        cancellationReason: validated.reason,
        userId,
      },
      "[cancelOrderAction] Order cancelled"
    );

    return { success: true, order };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, input }, "[cancelOrderAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to cancel order";
    return { success: false, error: errorMessage };
  }
}

/**
 * Activate an order (convenience action)
 *
 * Sets fulfillment_status to "active".
 * Typically called after fulfillment is complete.
 *
 * @param orderId - Order UUID
 * @returns Activated order
 */
export async function activateOrderAction(
  orderId: string
): Promise<UpdateFulfillmentStatusResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, tenantId } = authResult;

    // 2. Validate orderId
    const idValidation = UuidSchema.safeParse(orderId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid order ID" };
    }

    // 3. Update via service
    const order = await orderService.updateFulfillmentStatus(
      orderId,
      "active",
      userId,
      tenantId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_order",
          entity_id: orderId,
          action: "ACTIVATE",
          new_values: {
            fulfillment_status: "active",
            activated_at: new Date().toISOString(),
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/orders", "page");

    logger.info({ orderId, userId }, "[activateOrderAction] Order activated");

    return { success: true, order };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, orderId }, "[activateOrderAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to activate order";
    return { success: false, error: errorMessage };
  }
}

/**
 * Fulfill an order (convenience action)
 *
 * Sets fulfillment_status to "fulfilled".
 * Typically called when tenant/subscription has been provisioned.
 *
 * @param orderId - Order UUID
 * @returns Fulfilled order
 */
export async function fulfillOrderAction(
  orderId: string
): Promise<UpdateFulfillmentStatusResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, tenantId } = authResult;

    // 2. Validate orderId
    const idValidation = UuidSchema.safeParse(orderId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid order ID" };
    }

    // 3. Update via service
    const order = await orderService.updateFulfillmentStatus(
      orderId,
      "fulfilled",
      userId,
      tenantId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_order",
          entity_id: orderId,
          action: "FULFILL",
          new_values: {
            fulfillment_status: "fulfilled",
            fulfilled_at: new Date().toISOString(),
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/orders", "page");

    logger.info({ orderId, userId }, "[fulfillOrderAction] Order fulfilled");

    return { success: true, order };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, orderId }, "[fulfillOrderAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fulfill order";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// QUERY ACTIONS (Admin Only)
// =============================================================================

/**
 * Get an order by ID with relations
 *
 * @param orderId - Order UUID
 * @returns Order with relations or null
 */
export async function getOrderAction(orderId: string): Promise<GetOrderResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { tenantId } = authResult;

    // 2. Validate orderId
    const idValidation = UuidSchema.safeParse(orderId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid order ID" };
    }

    // 3. Get via service
    const order = await orderService.getOrderById(orderId, tenantId);

    return { success: true, order };
  } catch (error) {
    logger.error({ error, orderId }, "[getOrderAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get order";
    return { success: false, error: errorMessage };
  }
}

/**
 * List orders with pagination and filters
 *
 * @param query - Query parameters
 * @returns Paginated orders
 */
export async function listOrdersAction(
  query?: OrderQueryInput
): Promise<ListOrdersResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { tenantId } = authResult;

    // 2. Validate query
    const validation = OrderQuerySchema.safeParse(query || {});
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid query" };
    }
    const validated = validation.data;

    // 3. Build where clause
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      deleted_at: null,
    };

    if (validated.status) {
      where.status = validated.status;
    }
    if (validated.fulfillmentStatus) {
      where.fulfillment_status = validated.fulfillmentStatus;
    }
    if (validated.orderType) {
      where.order_type = validated.orderType;
    }
    if (validated.billingCycle) {
      where.billing_cycle = validated.billingCycle;
    }
    if (validated.autoRenew !== undefined) {
      where.auto_renew = validated.autoRenew;
    }
    if (validated.opportunityId) {
      where.opportunity_id = validated.opportunityId;
    }
    if (validated.leadId) {
      where.lead_id = validated.leadId;
    }

    // Value range filters
    if (validated.minValue || validated.maxValue) {
      where.total_value = {};
      if (validated.minValue) {
        (where.total_value as Record<string, number>).gte = validated.minValue;
      }
      if (validated.maxValue) {
        (where.total_value as Record<string, number>).lte = validated.maxValue;
      }
    }

    // Date range filters
    if (validated.effectiveDateAfter || validated.effectiveDateBefore) {
      where.effective_date = {};
      if (validated.effectiveDateAfter) {
        (where.effective_date as Record<string, Date>).gte =
          validated.effectiveDateAfter;
      }
      if (validated.effectiveDateBefore) {
        (where.effective_date as Record<string, Date>).lte =
          validated.effectiveDateBefore;
      }
    }

    if (validated.expiryDateAfter || validated.expiryDateBefore) {
      where.expiry_date = {};
      if (validated.expiryDateAfter) {
        (where.expiry_date as Record<string, Date>).gte =
          validated.expiryDateAfter;
      }
      if (validated.expiryDateBefore) {
        (where.expiry_date as Record<string, Date>).lte =
          validated.expiryDateBefore;
      }
    }

    // Expiring soon filter
    if (validated.expiringWithinDays) {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + validated.expiringWithinDays);
      where.expiry_date = { gte: now, lte: futureDate };
    }

    // Search filter
    if (validated.search) {
      where.OR = [
        {
          order_reference: { contains: validated.search, mode: "insensitive" },
        },
        { order_code: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    // 4. Calculate pagination
    const skip = (validated.page - 1) * validated.limit;

    // 5. Execute query using repository
    const [orders, total] = await Promise.all([
      orderRepository["model"].findMany({
        where,
        orderBy: { [validated.sortBy]: validated.sortOrder },
        skip,
        take: validated.limit,
      }),
      orderRepository["model"].count({ where }),
    ]);

    const totalPages = Math.ceil(total / validated.limit);

    return {
      success: true,
      orders,
      total,
      page: validated.page,
      pageSize: validated.limit,
      totalPages,
    };
  } catch (error) {
    logger.error({ error }, "[listOrdersAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to list orders";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get orders by opportunity
 *
 * @param opportunityId - Opportunity UUID
 * @returns Orders for the opportunity
 */
export async function getOrdersByOpportunityAction(
  opportunityId: string
): Promise<GetOrdersArrayResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { tenantId } = authResult;

    // 2. Validate opportunityId
    const idValidation = UuidSchema.safeParse(opportunityId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid opportunity ID" };
    }

    // 3. Get via service
    const orders = await orderService.getOrdersByOpportunity(
      opportunityId,
      tenantId
    );

    return { success: true, orders };
  } catch (error) {
    logger.error(
      { error, opportunityId },
      "[getOrdersByOpportunityAction] Error"
    );
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get orders";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get orders by lead
 *
 * @param leadId - Lead UUID
 * @returns Orders for the lead
 */
export async function getOrdersByLeadAction(
  leadId: string
): Promise<GetOrdersArrayResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { tenantId } = authResult;

    // 2. Validate leadId
    const idValidation = UuidSchema.safeParse(leadId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid lead ID" };
    }

    // 3. Get via service
    const orders = await orderService.getOrdersByLead(leadId, tenantId);

    return { success: true, orders };
  } catch (error) {
    logger.error({ error, leadId }, "[getOrdersByLeadAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get orders";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get order statistics
 *
 * Returns count of active orders for the current provider.
 *
 * @returns Active order count
 */
export async function getOrderStatsAction(): Promise<GetOrderStatsResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { tenantId } = authResult;

    // 2. Get count via service
    const activeCount = await orderService.countActiveOrders(tenantId);

    return { success: true, activeCount };
  } catch (error) {
    logger.error({ error }, "[getOrderStatsAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get order stats";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// CRON/ALERT ACTIONS (Admin Only)
// =============================================================================

/**
 * Get orders expiring within a number of days
 *
 * @param days - Number of days to look ahead (default 30)
 * @returns Orders expiring soon
 */
export async function getExpiringOrdersAction(
  days?: number
): Promise<GetOrdersArrayResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { tenantId } = authResult;

    // 2. Validate days
    const daysValidation = DaysSchema.safeParse(days ?? 30);
    if (!daysValidation.success) {
      return { success: false, error: "Invalid days parameter" };
    }

    // 3. Get via service
    const orders = await orderService.getExpiringOrders(
      tenantId,
      daysValidation.data
    );

    return { success: true, orders };
  } catch (error) {
    logger.error({ error, days }, "[getExpiringOrdersAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get expiring orders";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get orders eligible for auto-renewal
 *
 * @param daysBeforeExpiry - Days before expiry to check (default 30)
 * @returns Orders eligible for renewal
 */
export async function getAutoRenewableOrdersAction(
  daysBeforeExpiry?: number
): Promise<GetOrdersArrayResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { tenantId } = authResult;

    // 2. Validate days
    const daysValidation = DaysSchema.safeParse(daysBeforeExpiry ?? 30);
    if (!daysValidation.success) {
      return { success: false, error: "Invalid days parameter" };
    }

    // 3. Get via service
    const orders = await orderService.getAutoRenewableOrders(
      tenantId,
      daysValidation.data
    );

    return { success: true, orders };
  } catch (error) {
    logger.error(
      { error, daysBeforeExpiry },
      "[getAutoRenewableOrdersAction] Error"
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to get auto-renewable orders";
    return { success: false, error: errorMessage };
  }
}
