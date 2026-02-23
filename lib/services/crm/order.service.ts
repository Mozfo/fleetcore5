/**
 * Order Service - CRM Order Orchestration
 *
 * This service orchestrates order creation and management:
 * 1. Create order from won opportunity (with transaction)
 * 2. Calculate monthly/annual values from total
 * 3. Generate unique order reference and code
 * 4. Update opportunity status to 'won'
 * 5. Manage order lifecycle (status, fulfillment)
 *
 * Used by POST /api/v1/crm/orders endpoint to provide a single,
 * transactional operation for order creation from opportunities.
 *
 * @module lib/services/crm/order.service
 */

import { prisma } from "@/lib/prisma";
import {
  OrderRepository,
  orderRepository,
} from "@/lib/repositories/crm/order.repository";
import type {
  Order,
  OrderWithRelations,
  OrderUpdateInput,
} from "@/lib/repositories/crm/order.repository";
import { ValidationError, NotFoundError } from "@/lib/core/errors";
import { logger } from "@/lib/logger";

/**
 * Parameters for creating an order from an opportunity
 */
export interface CreateOrderFromOpportunityParams {
  opportunityId: string;
  tenantId: string;
  userId: string;
  totalValue: number;
  currency: string;
  billingCycle: "month" | "year";
  effectiveDate: Date;
  durationMonths: number;
  autoRenew?: boolean;
  noticePeriodDays?: number;
  monthlyValue?: number;
  annualValue?: number;
  orderType?: "new" | "renewal" | "upgrade" | "downgrade" | "amendment";
  metadata?: Record<string, unknown>;
}

/**
 * Result of order creation
 */
export interface OrderCreationResult {
  order: Order;
  opportunity: {
    id: string;
    leadId: string;
    previousStage: string;
    newStage: string;
    previousStatus: string;
    newStatus: string;
  };
  calculations: {
    monthlyValue: number;
    annualValue: number;
    expiryDate: Date;
  };
}

/**
 * Order Service
 *
 * Orchestrates order creation from opportunities and manages order lifecycle.
 * Uses transactions to ensure data consistency when creating orders
 * and updating opportunity status.
 *
 * @example
 * ```typescript
 * const result = await orderService.createOrderFromOpportunity({
 *   opportunityId: "opp-uuid",
 *   tenantId: "provider-uuid",
 *   userId: "user-uuid",
 *   totalValue: 60000,
 *   currency: "EUR",
 *   billingCycle: "month",
 *   effectiveDate: new Date("2025-02-01"),
 *   durationMonths: 12,
 *   autoRenew: true,
 * });
 * // Creates order ORD-2025-00001, updates opportunity to 'won'
 * ```
 */
export class OrderService {
  private orderRepo: OrderRepository;

  constructor() {
    this.orderRepo = orderRepository;
  }

  /**
   * Create order from a won opportunity
   *
   * Orchestrates complete order creation:
   * - Validates opportunity exists and is not already won
   * - Calculates monthly/annual values if not provided
   * - Calculates expiry date from effective date + duration
   * - Creates order with auto-generated reference and code
   * - Updates opportunity status to 'won' with contract_id link
   *
   * All operations are wrapped in a transaction for consistency.
   *
   * @param params - Order creation parameters
   * @returns Order creation result with calculations
   *
   * @throws {NotFoundError} If opportunity not found
   * @throws {ValidationError} If opportunity already won or closed
   * @throws {ValidationError} If total value is invalid
   */
  async createOrderFromOpportunity(
    params: CreateOrderFromOpportunityParams
  ): Promise<OrderCreationResult> {
    const {
      opportunityId,
      tenantId,
      userId,
      totalValue,
      currency,
      billingCycle,
      effectiveDate,
      durationMonths,
      autoRenew = false,
      noticePeriodDays = 30,
      orderType = "new",
      metadata,
    } = params;

    // STEP 1: Validate opportunity exists and is eligible
    // Note: crm_opportunities doesn't have tenant_id - division isolation happens at order level
    const opportunity = await prisma.crm_opportunities.findFirst({
      where: {
        id: opportunityId,
        deleted_at: null,
      },
    });

    if (!opportunity) {
      throw new NotFoundError(`Opportunity not found: ${opportunityId}`);
    }

    if (opportunity.stage === "won") {
      throw new ValidationError(
        `Opportunity ${opportunityId} is already won. Cannot create duplicate order.`
      );
    }

    // Check for terminal statuses (lost, cancelled)
    if (opportunity.status === "lost" || opportunity.status === "cancelled") {
      throw new ValidationError(
        `Opportunity ${opportunityId} is ${opportunity.status}. Cannot create order from ${opportunity.status} opportunity.`
      );
    }

    if (!opportunity.lead_id) {
      throw new ValidationError(
        `Opportunity ${opportunityId} has no associated lead. Lead is required for order creation.`
      );
    }

    // STEP 2: Validate total value
    if (totalValue < 100) {
      throw new ValidationError(
        `Total value must be at least 100. Received: ${totalValue}`
      );
    }

    // STEP 3: Calculate monthly and annual values
    let monthlyValue = params.monthlyValue;
    let annualValue = params.annualValue;

    if (!monthlyValue) {
      // Calculate monthly based on billing cycle
      switch (billingCycle) {
        case "month":
          monthlyValue = totalValue / durationMonths;
          break;
        case "year":
          monthlyValue = totalValue / 12;
          break;
      }
    }

    if (!annualValue) {
      annualValue = monthlyValue * 12;
    }

    // STEP 4: Calculate expiry date
    const expiryDate = new Date(effectiveDate);
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

    // STEP 5: Execute transaction (create order + update opportunity)
    const previousStage = opportunity.stage;
    const previousStatus = opportunity.status;

    const result = await prisma.$transaction(async (tx) => {
      // 5.1: Create order with auto-generated codes
      const order = await this.orderRepo.createOrder(
        {
          opportunity_id: opportunityId,
          lead_id: opportunity.lead_id,
          tenant_id: tenantId,
          order_type: orderType,
          total_value: totalValue,
          currency: currency.toUpperCase(),
          billing_cycle: billingCycle,
          effective_date: effectiveDate,
          expiry_date: expiryDate,
          monthly_value: monthlyValue,
          annual_value: annualValue,
          auto_renew: autoRenew,
          notice_period_days: noticePeriodDays,
          metadata,
        },
        userId,
        tx
      );

      // 5.2: Update opportunity to 'won' with contract_id link
      await tx.crm_opportunities.update({
        where: { id: opportunityId },
        data: {
          stage: "won",
          status: "won",
          won_date: new Date(),
          won_value: totalValue,
          contract_id: order.id,
          updated_by: userId,
          updated_at: new Date(),
        },
      });

      return order;
    });

    logger.info(
      {
        orderId: result.id,
        orderReference: result.order_reference,
        orderCode: result.order_code,
        opportunityId,
        totalValue,
        currency,
        billingCycle,
        durationMonths,
        effectiveDate,
        expiryDate,
      },
      "[OrderService] Order created from opportunity"
    );

    return {
      order: result,
      opportunity: {
        id: opportunityId,
        leadId: opportunity.lead_id,
        previousStage,
        newStage: "won",
        previousStatus,
        newStatus: "won",
      },
      calculations: {
        monthlyValue: monthlyValue,
        annualValue: annualValue,
        expiryDate,
      },
    };
  }

  /**
   * Get order by ID with relations
   *
   * @param id - Order UUID
   * @param tenantId - Optional provider ID for filtering
   * @returns Order with relations or null
   */
  async getOrderById(
    id: string,
    tenantId?: string
  ): Promise<OrderWithRelations | null> {
    return this.orderRepo.findByIdWithRelations(id, tenantId);
  }

  /**
   * Get orders by opportunity ID
   *
   * @param opportunityId - Opportunity UUID
   * @param tenantId - Optional provider ID for filtering
   * @returns Array of orders
   */
  async getOrdersByOpportunity(
    opportunityId: string,
    tenantId?: string
  ): Promise<Order[]> {
    return this.orderRepo.findByOpportunityId(opportunityId, tenantId);
  }

  /**
   * Get orders by lead ID
   *
   * @param leadId - Lead UUID
   * @param tenantId - Optional provider ID for filtering
   * @returns Array of orders
   */
  async getOrdersByLead(leadId: string, tenantId?: string): Promise<Order[]> {
    return this.orderRepo.findByLeadId(leadId, tenantId);
  }

  /**
   * Update order status
   *
   * @param id - Order UUID
   * @param status - New status
   * @param userId - User making the update
   * @param tenantId - Optional provider ID for filtering
   * @returns Updated order
   */
  async updateOrderStatus(
    id: string,
    status: string,
    userId: string,
    tenantId?: string
  ): Promise<Order> {
    const order = await this.orderRepo.findByIdWithRelations(id, tenantId);

    if (!order) {
      throw new NotFoundError(`Order not found: ${id}`);
    }

    const previousStatus = order.status;

    const updated = await this.orderRepo.updateOrder(
      id,
      { status },
      userId,
      tenantId
    );

    logger.info(
      {
        orderId: id,
        orderReference: order.order_reference,
        previousStatus,
        newStatus: status,
        userId,
      },
      "[OrderService] Order status updated"
    );

    return updated;
  }

  /**
   * Update order fulfillment status
   *
   * @param id - Order UUID
   * @param fulfillmentStatus - New fulfillment status
   * @param userId - User making the update
   * @param tenantId - Optional provider ID for filtering
   * @returns Updated order
   */
  async updateFulfillmentStatus(
    id: string,
    fulfillmentStatus: OrderUpdateInput["fulfillment_status"],
    userId: string,
    tenantId?: string
  ): Promise<Order> {
    const order = await this.orderRepo.findByIdWithRelations(id, tenantId);

    if (!order) {
      throw new NotFoundError(`Order not found: ${id}`);
    }

    const previousStatus = order.fulfillment_status;

    // Set timestamp based on new status
    const updateData: OrderUpdateInput = {
      fulfillment_status: fulfillmentStatus,
    };

    switch (fulfillmentStatus) {
      case "fulfilled":
        updateData.fulfilled_at = new Date();
        break;
      case "active":
        updateData.activated_at = new Date();
        break;
      case "cancelled":
        updateData.cancelled_at = new Date();
        break;
    }

    const updated = await this.orderRepo.updateOrder(
      id,
      updateData,
      userId,
      tenantId
    );

    logger.info(
      {
        orderId: id,
        orderReference: order.order_reference,
        previousFulfillmentStatus: previousStatus,
        newFulfillmentStatus: fulfillmentStatus,
        userId,
      },
      "[OrderService] Order fulfillment status updated"
    );

    return updated;
  }

  /**
   * Cancel an order
   *
   * @param id - Order UUID
   * @param reason - Cancellation reason
   * @param userId - User making the cancellation
   * @param tenantId - Optional provider ID for filtering
   * @returns Cancelled order
   */
  async cancelOrder(
    id: string,
    reason: string,
    userId: string,
    tenantId?: string
  ): Promise<Order> {
    const order = await this.orderRepo.findByIdWithRelations(id, tenantId);

    if (!order) {
      throw new NotFoundError(`Order not found: ${id}`);
    }

    if (order.fulfillment_status === "cancelled") {
      throw new ValidationError(`Order ${id} is already cancelled`);
    }

    const updated = await this.orderRepo.updateOrder(
      id,
      {
        status: "cancelled",
        fulfillment_status: "cancelled",
        cancelled_at: new Date(),
        cancellation_reason: reason,
      },
      userId,
      tenantId
    );

    logger.info(
      {
        orderId: id,
        orderReference: order.order_reference,
        cancellationReason: reason,
        userId,
      },
      "[OrderService] Order cancelled"
    );

    return updated;
  }

  /**
   * Get orders expiring within a number of days
   *
   * @param tenantId - Provider UUID
   * @param days - Number of days from now
   * @returns Array of expiring orders
   */
  async getExpiringOrders(tenantId: string, days: number): Promise<Order[]> {
    return this.orderRepo.findExpiringWithinDays(tenantId, days);
  }

  /**
   * Get orders eligible for auto-renewal
   *
   * @param tenantId - Provider UUID
   * @param daysBeforeExpiry - Days before expiry to check
   * @returns Array of auto-renewable orders
   */
  async getAutoRenewableOrders(
    tenantId: string,
    daysBeforeExpiry: number
  ): Promise<Order[]> {
    return this.orderRepo.findAutoRenewable(tenantId, daysBeforeExpiry);
  }

  /**
   * Count active orders for a provider (division)
   *
   * @param tenantId - Provider UUID
   * @returns Count of active orders
   */
  async countActiveOrders(tenantId: string): Promise<number> {
    return this.orderRepo.countActiveOrders(tenantId);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Singleton instance of OrderService
 * Use this for standard operations
 */
export const orderService = new OrderService();
