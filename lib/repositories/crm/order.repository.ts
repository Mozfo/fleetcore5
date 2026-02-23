import { BaseRepository } from "@/lib/core/base.repository";
import { PrismaClient, crm_orders } from "@prisma/client";
import type { SortFieldWhitelist } from "@/lib/core/validation";
import type { PrismaTransaction } from "@/lib/core/types";
import { prisma } from "@/lib/prisma";

/**
 * Whitelist of fields allowed for sorting orders.
 * Excludes notes, metadata, and soft-delete fields.
 */
export const ORDER_SORT_FIELDS = [
  "id",
  "order_reference",
  "order_code",
  "contract_date",
  "effective_date",
  "expiry_date",
  "total_value",
  "monthly_value",
  "annual_value",
  "status",
  "order_type",
  "fulfillment_status",
  "billing_cycle",
  "currency",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * Base Order type from Prisma
 */
export type Order = crm_orders;

/**
 * Input type for creating a new order
 */
export interface OrderCreateInput {
  opportunity_id: string;
  lead_id: string;
  tenant_id: string;
  order_type?: "new" | "renewal" | "upgrade" | "downgrade" | "amendment";
  total_value: number;
  currency: string;
  billing_cycle?: "month" | "year";
  effective_date: Date;
  expiry_date?: Date;
  monthly_value?: number;
  annual_value?: number;
  auto_renew?: boolean;
  notice_period_days?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Input type for updating an order
 */
export interface OrderUpdateInput {
  status?: string;
  fulfillment_status?:
    | "pending"
    | "ready_for_fulfillment"
    | "in_progress"
    | "fulfilled"
    | "active"
    | "cancelled"
    | "expired";
  total_value?: number;
  monthly_value?: number;
  annual_value?: number;
  fulfilled_at?: Date;
  activated_at?: Date;
  cancelled_at?: Date;
  cancellation_reason?: string;
}

/**
 * Order with relations (lead, opportunity, quote, agreements)
 */
export type OrderWithRelations = crm_orders & {
  crm_leads?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    company_name: string | null;
  };
  crm_opportunities_crm_orders_opportunity_idTocrm_opportunities?: {
    id: string;
    title: string;
    stage: string;
    status: string;
  } | null;
  crm_quotes?: {
    id: string;
    quote_reference: string;
    status: string;
  } | null;
  crm_agreements?: Array<{
    id: string;
    agreement_reference: string;
    agreement_type: string;
    status: string;
  }>;
};

/**
 * Repository for managing CRM orders
 *
 * Orders are commercial contracts confirmed from opportunities.
 * Multi-division isolation via tenant_id column (FleetCore France, UAE, etc.)
 *
 * @module lib/repositories/crm/order.repository
 */
export class OrderRepository extends BaseRepository<Order> {
  constructor(prisma: PrismaClient) {
    super(prisma.crm_orders, prisma);
  }

  /**
   * Get whitelist of fields allowed for sorting
   */
  protected getSortWhitelist(): SortFieldWhitelist {
    return ORDER_SORT_FIELDS;
  }

  /**
   * Find an order by ID with relations
   *
   * @param id - Order UUID
   * @param tenantId - Optional tenant ID for multi-division filtering
   * @returns Order with relations or null
   */
  async findByIdWithRelations(
    id: string,
    tenantId?: string
  ): Promise<OrderWithRelations | null> {
    return await this.model.findFirst({
      where: {
        id,
        deleted_at: null,
        ...(tenantId && { tenant_id: tenantId }),
      },
      include: {
        crm_leads: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            company_name: true,
          },
        },
        crm_opportunities_crm_orders_opportunity_idTocrm_opportunities: {
          select: {
            id: true,
            title: true,
            stage: true,
            status: true,
          },
        },
        crm_quotes: {
          select: {
            id: true,
            quote_reference: true,
            status: true,
          },
        },
        crm_agreements: {
          where: { deleted_at: null },
          select: {
            id: true,
            agreement_reference: true,
            agreement_type: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Find orders by opportunity ID
   *
   * @param opportunityId - Opportunity UUID
   * @param tenantId - Optional tenant ID for filtering
   * @returns Array of orders linked to the opportunity
   */
  async findByOpportunityId(
    opportunityId: string,
    tenantId?: string
  ): Promise<Order[]> {
    return await this.model.findMany({
      where: {
        opportunity_id: opportunityId,
        deleted_at: null,
        ...(tenantId && { tenant_id: tenantId }),
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Find orders by lead ID
   *
   * @param leadId - Lead UUID
   * @param tenantId - Optional tenant ID for filtering
   * @returns Array of orders linked to the lead
   */
  async findByLeadId(leadId: string, tenantId?: string): Promise<Order[]> {
    return await this.model.findMany({
      where: {
        lead_id: leadId,
        deleted_at: null,
        ...(tenantId && { tenant_id: tenantId }),
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Generate a unique order reference for the given year
   * Format: ORD-YYYY-NNNNN (e.g., ORD-2025-00001)
   *
   * Sequence resets at the beginning of each calendar year.
   * Supports optional transaction context for atomic order creation.
   *
   * @param year - Calendar year (e.g., 2025)
   * @param tx - Optional Prisma transaction for atomic operations
   * @returns Next available unique order reference for the year
   */
  async generateOrderReference(
    year: number,
    tx?: PrismaTransaction
  ): Promise<string> {
    // 1. Determine model (transaction-aware)
    const model = tx ? tx.crm_orders : this.model;

    // 2. Build prefix for the year
    const prefix = `ORD-${year}-`;

    // 3. Find the last order_reference of the year (DESC alphabetical sort)
    const lastOrder = await model.findFirst({
      where: {
        order_reference: { startsWith: prefix },
        deleted_at: null,
      },
      orderBy: { order_reference: "desc" },
      select: { order_reference: true },
    });

    // 4. Calculate next sequence number
    let nextSequence = 1;

    if (lastOrder?.order_reference) {
      const parts = lastOrder.order_reference.split("-");
      if (parts.length === 3) {
        const currentSeq = parseInt(parts[2], 10);
        if (!isNaN(currentSeq)) {
          nextSequence = currentSeq + 1;
        }
      }
    }

    // 5. Format with 5-digit padding
    const paddedSeq = nextSequence.toString().padStart(5, "0");

    // 6. Return complete reference
    return `${prefix}${paddedSeq}`;
  }

  /**
   * Generate a unique order code for the given year
   * Format: O2025-NNN (e.g., O2025-001)
   *
   * Shorter code for quick reference in UI and communications.
   * Sequence resets at the beginning of each calendar year.
   *
   * @param year - Calendar year (e.g., 2025)
   * @param tx - Optional Prisma transaction for atomic operations
   * @returns Next available unique order code for the year
   */
  async generateOrderCode(
    year: number,
    tx?: PrismaTransaction
  ): Promise<string> {
    // 1. Determine model (transaction-aware)
    const model = tx ? tx.crm_orders : this.model;

    // 2. Build prefix for the year
    const prefix = `O${year}-`;

    // 3. Find the last order_code of the year (DESC alphabetical sort)
    const lastOrder = await model.findFirst({
      where: {
        order_code: { startsWith: prefix },
        deleted_at: null,
      },
      orderBy: { order_code: "desc" },
      select: { order_code: true },
    });

    // 4. Calculate next sequence number
    let nextSequence = 1;

    if (lastOrder?.order_code) {
      const parts = lastOrder.order_code.split("-");
      if (parts.length === 2) {
        const currentSeq = parseInt(parts[1], 10);
        if (!isNaN(currentSeq)) {
          nextSequence = currentSeq + 1;
        }
      }
    }

    // 5. Format with 3-digit padding
    const paddedSeq = nextSequence.toString().padStart(3, "0");

    // 6. Return complete code
    return `${prefix}${paddedSeq}`;
  }

  /**
   * Create a new order with auto-generated reference and code
   *
   * This method wraps the standard create to automatically generate
   * order_reference and order_code, ensuring uniqueness.
   *
   * @param data - Order creation input
   * @param userId - User ID for audit trail
   * @param tx - Optional Prisma transaction for atomic operations
   * @returns Created order with generated codes
   */
  async createOrder(
    data: OrderCreateInput,
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Order> {
    const year = new Date().getFullYear();
    const model = tx ? tx.crm_orders : this.model;

    // Generate unique codes
    const orderReference = await this.generateOrderReference(year, tx);
    const orderCode = await this.generateOrderCode(year, tx);

    return await model.create({
      data: {
        ...data,
        order_reference: orderReference,
        order_code: orderCode,
        contract_date: new Date(),
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Update an existing order
   *
   * @param id - Order UUID
   * @param data - Update input
   * @param userId - User ID for audit trail
   * @param tenantId - Optional tenant ID for multi-division filtering
   * @returns Updated order
   */
  async updateOrder(
    id: string,
    data: OrderUpdateInput,
    userId: string,
    tenantId?: string
  ): Promise<Order> {
    return await this.model.update({
      where: {
        id,
        deleted_at: null,
        ...(tenantId && { tenant_id: tenantId }),
      },
      data: {
        ...data,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Count active orders for a tenant (division)
   *
   * @param tenantId - Tenant UUID
   * @returns Count of active orders
   */
  async countActiveOrders(tenantId: string): Promise<number> {
    return await this.model.count({
      where: {
        tenant_id: tenantId,
        status: "active",
        fulfillment_status: {
          notIn: ["cancelled", "expired"],
        },
        deleted_at: null,
      },
    });
  }

  /**
   * Find orders expiring within a number of days
   *
   * @param tenantId - Tenant UUID
   * @param days - Number of days from now
   * @returns Array of orders expiring soon
   */
  async findExpiringWithinDays(
    tenantId: string,
    days: number
  ): Promise<Order[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.model.findMany({
      where: {
        tenant_id: tenantId,
        expiry_date: {
          gte: now,
          lte: futureDate,
        },
        status: "active",
        deleted_at: null,
      },
      orderBy: { expiry_date: "asc" },
    });
  }

  /**
   * Find orders eligible for auto-renewal
   *
   * @param tenantId - Tenant UUID
   * @param daysBeforeExpiry - Days before expiry to check
   * @returns Array of orders eligible for renewal
   */
  async findAutoRenewable(
    tenantId: string,
    daysBeforeExpiry: number
  ): Promise<Order[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

    return await this.model.findMany({
      where: {
        tenant_id: tenantId,
        auto_renew: true,
        renewal_date: {
          gte: now,
          lte: futureDate,
        },
        status: "active",
        deleted_at: null,
      },
      orderBy: { renewal_date: "asc" },
    });
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Singleton instance of OrderRepository
 * Use this for standard operations outside of transactions
 */
export const orderRepository = new OrderRepository(prisma);
