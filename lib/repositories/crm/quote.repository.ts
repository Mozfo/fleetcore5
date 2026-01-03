/**
 * Quote Repository - CRM Quote Data Access
 *
 * Repository for managing CRM quotes (devis).
 * Multi-division isolation via provider_id column.
 *
 * @module lib/repositories/crm/quote.repository
 */

import { BaseRepository } from "@/lib/core/base.repository";
import {
  PrismaClient,
  crm_quotes,
  crm_quote_items,
  Prisma,
  discount_type,
  quote_item_type,
  item_recurrence,
  billing_interval,
  quote_status,
} from "@prisma/client";
import type { SortFieldWhitelist } from "@/lib/core/validation";
import type { PrismaTransaction } from "@/lib/core/types";
import type { PaginatedResult } from "@/lib/core/types";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Whitelist of fields allowed for sorting quotes.
 */
export const QUOTE_SORT_FIELDS = [
  "id",
  "quote_reference",
  "quote_code",
  "quote_version",
  "status",
  "valid_from",
  "valid_until",
  "subtotal",
  "total_value",
  "monthly_recurring_value",
  "annual_recurring_value",
  "currency",
  "created_at",
  "updated_at",
  "sent_at",
  "accepted_at",
] as const satisfies SortFieldWhitelist;

/**
 * Base Quote type from Prisma
 */
export type Quote = crm_quotes;

/**
 * Quote item type from Prisma
 */
export type QuoteItem = crm_quote_items;

/**
 * Quote with items relation
 */
export type QuoteWithItems = Quote & {
  crm_quote_items: QuoteItem[];
};

/**
 * Quote with all relations
 */
export type QuoteWithRelations = Quote & {
  crm_quote_items: QuoteItem[];
  crm_opportunities?: {
    id: string;
    title: string;
    stage: string;
    status: string;
  };
  crm_orders?: Array<{
    id: string;
    order_reference: string | null;
    status: string;
  }>;
  parent_quote?: {
    id: string;
    quote_reference: string;
    quote_version: number;
  } | null;
  child_quotes?: Array<{
    id: string;
    quote_reference: string;
    quote_version: number;
  }>;
};

/**
 * Input type for creating a new quote
 * Uses Prisma enum types for type safety
 */
export interface QuoteCreateInput {
  opportunity_id: string;
  provider_id: string;
  created_by: string;
  valid_until: Date;
  valid_from?: Date;
  contract_start_date?: Date;
  contract_duration_months?: number;
  billing_cycle?: billing_interval;
  currency?: string;
  discount_type?: discount_type;
  discount_value?: number;
  tax_rate?: number;
  notes?: string;
  terms_and_conditions?: string;
  metadata?: Prisma.InputJsonValue;
  // Parent for versioning
  parent_quote_id?: string;
  quote_version?: number;
}

/**
 * Input type for creating a quote item
 * Uses Prisma enum types for type safety
 */
export interface QuoteItemCreateInput {
  item_type: quote_item_type;
  recurrence?: item_recurrence;
  plan_id?: string;
  addon_id?: string;
  service_id?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity?: number;
  unit_price: number;
  line_discount_type?: discount_type;
  line_discount_value?: number;
  sort_order?: number;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Input type for updating a quote
 */
export interface QuoteUpdateInput {
  status?: quote_status;
  valid_until?: Date;
  contract_start_date?: Date;
  contract_duration_months?: number;
  billing_cycle?: billing_interval;
  discount_type?: discount_type;
  discount_value?: number;
  tax_rate?: number;
  notes?: string;
  terms_and_conditions?: string;
  document_url?: string;
  document_generated_at?: Date;
  sent_at?: Date;
  first_viewed_at?: Date;
  last_viewed_at?: Date;
  view_count?: number;
  accepted_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;
  expired_at?: Date;
  converted_to_order_id?: string;
  converted_at?: Date;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Filters for querying quotes
 */
export interface QuoteFilters {
  status?: quote_status;
  opportunity_id?: string;
  from_date?: Date;
  to_date?: Date;
  min_value?: number;
  max_value?: number;
}

// =============================================================================
// REPOSITORY
// =============================================================================

/**
 * Repository for managing CRM quotes
 *
 * Quotes are proposals sent to prospects before order confirmation.
 * Multi-division isolation via provider_id column (FleetCore France, UAE, etc.)
 *
 * @example
 * ```typescript
 * const quote = await quoteRepository.createQuote({
 *   opportunity_id: "opp-uuid",
 *   provider_id: "provider-uuid",
 *   created_by: "user-uuid",
 *   valid_until: new Date("2025-02-28"),
 *   currency: "EUR",
 * }, [
 *   { item_type: "plan", name: "Fleet Pro", quantity: 10, unit_price: 99 }
 * ]);
 * // Creates quote QOT-2025-00001 with items
 * ```
 */
export class QuoteRepository extends BaseRepository<Quote> {
  constructor(prismaClient: PrismaClient) {
    super(prismaClient.crm_quotes, prismaClient);
  }

  /**
   * Get whitelist of fields allowed for sorting
   */
  protected getSortWhitelist(): SortFieldWhitelist {
    return QUOTE_SORT_FIELDS;
  }

  // ===========================================================================
  // REFERENCE GENERATION
  // ===========================================================================

  /**
   * Generate a unique quote reference for the given year
   * Format: QOT-YYYY-NNNNN (e.g., QOT-2025-00001)
   *
   * @param year - Calendar year (e.g., 2025)
   * @param tx - Optional Prisma transaction
   * @returns Next available unique quote reference
   */
  async generateQuoteReference(
    year: number,
    tx?: PrismaTransaction
  ): Promise<string> {
    const model = tx ? tx.crm_quotes : this.model;
    const prefix = `QOT-${year}-`;

    const lastQuote = await model.findFirst({
      where: {
        quote_reference: { startsWith: prefix },
        deleted_at: null,
      },
      orderBy: { quote_reference: "desc" },
      select: { quote_reference: true },
    });

    let nextSequence = 1;
    if (lastQuote?.quote_reference) {
      const parts = lastQuote.quote_reference.split("-");
      if (parts.length === 3) {
        const currentSeq = parseInt(parts[2], 10);
        if (!isNaN(currentSeq)) {
          nextSequence = currentSeq + 1;
        }
      }
    }

    return `${prefix}${nextSequence.toString().padStart(5, "0")}`;
  }

  /**
   * Generate a unique quote code for the given year
   * Format: Q2025-NNN (e.g., Q2025-001)
   *
   * @param year - Calendar year (e.g., 2025)
   * @param tx - Optional Prisma transaction
   * @returns Next available unique quote code
   */
  async generateQuoteCode(
    year: number,
    tx?: PrismaTransaction
  ): Promise<string> {
    const model = tx ? tx.crm_quotes : this.model;
    const prefix = `Q${year}-`;

    const lastQuote = await model.findFirst({
      where: {
        quote_code: { startsWith: prefix },
        deleted_at: null,
      },
      orderBy: { quote_code: "desc" },
      select: { quote_code: true },
    });

    let nextSequence = 1;
    if (lastQuote?.quote_code) {
      const parts = lastQuote.quote_code.split("-");
      if (parts.length === 2) {
        const currentSeq = parseInt(parts[1], 10);
        if (!isNaN(currentSeq)) {
          nextSequence = currentSeq + 1;
        }
      }
    }

    return `${prefix}${nextSequence.toString().padStart(3, "0")}`;
  }

  /**
   * Generate a secure public token for quote sharing
   * @returns 64-character hex token
   */
  generatePublicToken(): string {
    return randomBytes(32).toString("hex");
  }

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  /**
   * Create a new quote with auto-generated reference and code
   *
   * @param data - Quote creation input
   * @param items - Optional array of quote items
   * @param tx - Optional Prisma transaction
   * @returns Created quote with items
   */
  async createQuote(
    data: QuoteCreateInput,
    items?: QuoteItemCreateInput[],
    tx?: PrismaTransaction
  ): Promise<QuoteWithItems> {
    const year = new Date().getFullYear();
    const model = tx ? tx.crm_quotes : this.model;
    const itemModel = tx ? tx.crm_quote_items : this.prisma.crm_quote_items;

    // Generate unique codes
    const quoteReference = await this.generateQuoteReference(year, tx);
    const quoteCode = await this.generateQuoteCode(year, tx);

    // Create quote
    const quote = await model.create({
      data: {
        quote_reference: quoteReference,
        quote_code: quoteCode,
        opportunity_id: data.opportunity_id,
        provider_id: data.provider_id,
        created_by: data.created_by,
        updated_by: data.created_by,
        valid_from: data.valid_from ?? new Date(),
        valid_until: data.valid_until,
        contract_start_date: data.contract_start_date,
        contract_duration_months: data.contract_duration_months ?? 12,
        billing_cycle: data.billing_cycle ?? "month",
        currency: data.currency ?? "EUR",
        discount_type: data.discount_type,
        discount_value: data.discount_value ?? 0,
        tax_rate: data.tax_rate ?? 0,
        notes: data.notes,
        terms_and_conditions: data.terms_and_conditions,
        metadata: data.metadata ?? Prisma.JsonNull,
        parent_quote_id: data.parent_quote_id,
        quote_version: data.quote_version ?? 1,
        status: "draft",
      },
    });

    // Create items if provided
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lineDiscount = this.calculateLineDiscount(
          item.unit_price,
          item.quantity ?? 1,
          item.line_discount_type,
          item.line_discount_value
        );
        const lineTotal = item.unit_price * (item.quantity ?? 1) - lineDiscount;

        await itemModel.create({
          data: {
            quote_id: quote.id,
            provider_id: data.provider_id,
            item_type: item.item_type,
            recurrence: item.recurrence ?? "recurring",
            plan_id: item.plan_id,
            addon_id: item.addon_id,
            service_id: item.service_id,
            name: item.name,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity ?? 1,
            unit_price: item.unit_price,
            line_discount_type: item.line_discount_type,
            line_discount_value: item.line_discount_value ?? 0,
            line_discount_amount: lineDiscount,
            line_total: lineTotal,
            sort_order: item.sort_order ?? i,
            metadata: item.metadata ?? Prisma.JsonNull,
          },
        });
      }

      // Recalculate quote totals
      await this.recalculateTotals(quote.id, tx);
    }

    // Fetch final quote with items
    const result = await this.findWithItems(quote.id, data.provider_id, tx);
    if (!result) {
      throw new Error(`Failed to retrieve created quote: ${quote.id}`);
    }
    return result;
  }

  /**
   * Find a quote by ID with provider filtering
   */
  async findByIdWithProvider(
    id: string,
    providerId: string
  ): Promise<Quote | null> {
    return await this.model.findFirst({
      where: {
        id,
        provider_id: providerId,
        deleted_at: null,
      },
    });
  }

  /**
   * Find a quote by reference
   */
  async findByReference(
    reference: string,
    providerId: string
  ): Promise<Quote | null> {
    return await this.model.findFirst({
      where: {
        quote_reference: reference,
        provider_id: providerId,
        deleted_at: null,
      },
    });
  }

  /**
   * Find a quote with all items
   */
  async findWithItems(
    id: string,
    providerId: string,
    tx?: PrismaTransaction
  ): Promise<QuoteWithItems | null> {
    const model = tx ? tx.crm_quotes : this.model;
    return await model.findFirst({
      where: {
        id,
        provider_id: providerId,
        deleted_at: null,
      },
      include: {
        crm_quote_items: {
          orderBy: { sort_order: "asc" },
        },
      },
    });
  }

  /**
   * Find a quote with all relations
   */
  async findWithRelations(
    id: string,
    providerId: string
  ): Promise<QuoteWithRelations | null> {
    return await this.model.findFirst({
      where: {
        id,
        provider_id: providerId,
        deleted_at: null,
      },
      include: {
        crm_quote_items: {
          orderBy: { sort_order: "asc" },
        },
        crm_opportunities: {
          select: {
            id: true,
            title: true,
            stage: true,
            status: true,
          },
        },
        crm_orders: {
          where: { deleted_at: null },
          select: {
            id: true,
            order_reference: true,
            status: true,
          },
        },
        parent_quote: {
          select: {
            id: true,
            quote_reference: true,
            quote_version: true,
          },
        },
        child_quotes: {
          where: { deleted_at: null },
          select: {
            id: true,
            quote_reference: true,
            quote_version: true,
          },
        },
      },
    });
  }

  /**
   * Update a quote
   */
  async updateQuote(
    id: string,
    providerId: string,
    data: QuoteUpdateInput,
    userId: string
  ): Promise<Quote> {
    return await this.model.update({
      where: {
        id,
        provider_id: providerId,
        deleted_at: null,
      },
      data: {
        ...data,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Soft delete a quote
   */
  async softDeleteQuote(
    id: string,
    providerId: string,
    deletedBy: string,
    reason?: string
  ): Promise<void> {
    await this.model.update({
      where: {
        id,
        provider_id: providerId,
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
        deleted_by: deletedBy,
        deletion_reason: reason,
      },
    });
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  /**
   * Find quotes by opportunity
   */
  async findByOpportunity(
    opportunityId: string,
    providerId: string
  ): Promise<Quote[]> {
    return await this.model.findMany({
      where: {
        opportunity_id: opportunityId,
        provider_id: providerId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Find quotes by status
   */
  async findByStatus(
    status: quote_status,
    providerId: string
  ): Promise<Quote[]> {
    return await this.model.findMany({
      where: {
        status,
        provider_id: providerId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Find expired quotes (valid_until < now && status = sent)
   */
  async findExpired(providerId: string): Promise<Quote[]> {
    return await this.model.findMany({
      where: {
        provider_id: providerId,
        status: "sent",
        valid_until: { lt: new Date() },
        deleted_at: null,
      },
      orderBy: { valid_until: "asc" },
    });
  }

  /**
   * Find quotes expiring within N days
   */
  async findExpiringSoon(providerId: string, days: number): Promise<Quote[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.model.findMany({
      where: {
        provider_id: providerId,
        status: { in: ["sent", "viewed"] },
        valid_until: {
          gte: now,
          lte: futureDate,
        },
        deleted_at: null,
      },
      orderBy: { valid_until: "asc" },
    });
  }

  /**
   * Find all quotes with pagination and filters
   */
  async findAllWithFilters(
    providerId: string,
    filters: QuoteFilters = {},
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<Quote>> {
    const where: Prisma.crm_quotesWhereInput = {
      provider_id: providerId,
      deleted_at: null,
    };

    if (filters.status) where.status = filters.status;
    if (filters.opportunity_id) where.opportunity_id = filters.opportunity_id;
    if (filters.from_date || filters.to_date) {
      where.created_at = {
        ...(filters.from_date && { gte: filters.from_date }),
        ...(filters.to_date && { lte: filters.to_date }),
      };
    }
    if (filters.min_value !== undefined || filters.max_value !== undefined) {
      where.total_value = {
        ...(filters.min_value !== undefined && { gte: filters.min_value }),
        ...(filters.max_value !== undefined && { lte: filters.max_value }),
      };
    }

    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // ===========================================================================
  // VERSIONING
  // ===========================================================================

  /**
   * Find all versions of a quote (version history)
   */
  async findVersionHistory(
    parentQuoteId: string,
    providerId: string
  ): Promise<Quote[]> {
    return await this.model.findMany({
      where: {
        OR: [{ id: parentQuoteId }, { parent_quote_id: parentQuoteId }],
        provider_id: providerId,
        deleted_at: null,
      },
      orderBy: { quote_version: "asc" },
    });
  }

  /**
   * Get the latest version of a quote for an opportunity
   */
  async getLatestVersion(
    opportunityId: string,
    providerId: string
  ): Promise<Quote | null> {
    return await this.model.findFirst({
      where: {
        opportunity_id: opportunityId,
        provider_id: providerId,
        deleted_at: null,
      },
      orderBy: { quote_version: "desc" },
    });
  }

  /**
   * Create a new version of an existing quote
   */
  async createNewVersion(
    quoteId: string,
    providerId: string,
    userId: string,
    tx?: PrismaTransaction
  ): Promise<QuoteWithItems> {
    const existingQuote = await this.findWithItems(quoteId, providerId, tx);
    if (!existingQuote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    const newVersion = existingQuote.quote_version + 1;

    // Business rule: Quote versioning requires an opportunity
    // Standalone quotes (without opportunity) cannot be versioned
    if (!existingQuote.opportunity_id) {
      throw new Error(
        `Cannot create new version: Quote ${quoteId} has no associated opportunity. ` +
          `Quote versioning is only supported for opportunity-linked quotes.`
      );
    }

    // Map existing items to new version
    const items: QuoteItemCreateInput[] = existingQuote.crm_quote_items.map(
      (item) => ({
        item_type: item.item_type,
        recurrence: item.recurrence,
        plan_id: item.plan_id ?? undefined,
        addon_id: item.addon_id ?? undefined,
        service_id: item.service_id ?? undefined,
        name: item.name,
        description: item.description ?? undefined,
        sku: item.sku ?? undefined,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        line_discount_type: item.line_discount_type ?? undefined,
        line_discount_value: item.line_discount_value
          ? Number(item.line_discount_value)
          : undefined,
        sort_order: item.sort_order,
        metadata: item.metadata as Prisma.InputJsonValue,
      })
    );

    return this.createQuote(
      {
        opportunity_id: existingQuote.opportunity_id,
        provider_id: providerId,
        created_by: userId,
        valid_until: existingQuote.valid_until,
        valid_from: new Date(),
        contract_start_date: existingQuote.contract_start_date ?? undefined,
        contract_duration_months: existingQuote.contract_duration_months,
        billing_cycle: existingQuote.billing_cycle,
        currency: existingQuote.currency,
        discount_type: existingQuote.discount_type ?? undefined,
        discount_value: existingQuote.discount_value
          ? Number(existingQuote.discount_value)
          : undefined,
        tax_rate: existingQuote.tax_rate
          ? Number(existingQuote.tax_rate)
          : undefined,
        notes: existingQuote.notes ?? undefined,
        terms_and_conditions: existingQuote.terms_and_conditions ?? undefined,
        metadata: existingQuote.metadata as Prisma.InputJsonValue,
        parent_quote_id: existingQuote.parent_quote_id ?? existingQuote.id,
        quote_version: newVersion,
      },
      items,
      tx
    );
  }

  // ===========================================================================
  // PUBLIC ACCESS
  // ===========================================================================

  /**
   * Find a quote by public token (no provider filtering)
   */
  async findByPublicToken(token: string): Promise<QuoteWithItems | null> {
    return await this.model.findFirst({
      where: {
        public_token: token,
        deleted_at: null,
      },
      include: {
        crm_quote_items: {
          orderBy: { sort_order: "asc" },
        },
      },
    });
  }

  /**
   * Set public token for a quote
   */
  async setPublicToken(
    id: string,
    providerId: string,
    userId: string
  ): Promise<string> {
    const token = this.generatePublicToken();
    await this.model.update({
      where: {
        id,
        provider_id: providerId,
        deleted_at: null,
      },
      data: {
        public_token: token,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
    return token;
  }

  // ===========================================================================
  // CALCULATIONS
  // ===========================================================================

  /**
   * Calculate line discount amount
   */
  private calculateLineDiscount(
    unitPrice: number,
    quantity: number,
    discountType?: discount_type | null,
    discountValue?: number
  ): number {
    if (!discountType || !discountValue) return 0;

    const lineSubtotal = unitPrice * quantity;
    if (discountType === "percentage") {
      return lineSubtotal * (discountValue / 100);
    }
    // fixed_amount
    return Math.min(discountValue, lineSubtotal);
  }

  /**
   * Recalculate quote totals from items
   */
  async recalculateTotals(
    quoteId: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const model = tx ? tx.crm_quotes : this.model;
    const itemModel = tx ? tx.crm_quote_items : this.prisma.crm_quote_items;

    // Fetch quote and items
    const quote = await model.findFirst({
      where: { id: quoteId },
    });

    if (!quote) return;

    const items = await itemModel.findMany({
      where: { quote_id: quoteId },
    });

    // Calculate subtotal (sum of line_total)
    let subtotal = 0;
    let monthlyRecurring = 0;

    for (const item of items) {
      subtotal += Number(item.line_total);
      if (item.recurrence === "recurring") {
        monthlyRecurring += Number(item.line_total);
      }
    }

    // Calculate quote-level discount
    let discountAmount = 0;
    if (quote.discount_type && quote.discount_value) {
      if (quote.discount_type === "percentage") {
        discountAmount = subtotal * (Number(quote.discount_value) / 100);
      } else {
        discountAmount = Math.min(Number(quote.discount_value), subtotal);
      }
    }

    // Calculate tax
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (Number(quote.tax_rate) / 100);

    // Calculate total
    const totalValue = taxableAmount + taxAmount;

    // Calculate annual recurring
    const annualRecurring = monthlyRecurring * 12;

    // Update quote
    await model.update({
      where: { id: quoteId },
      data: {
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_value: totalValue,
        monthly_recurring_value: monthlyRecurring,
        annual_recurring_value: annualRecurring,
        updated_at: new Date(),
      },
    });
  }

  // ===========================================================================
  // ITEMS MANAGEMENT
  // ===========================================================================

  /**
   * Add an item to an existing quote
   */
  async addItem(
    quoteId: string,
    providerId: string,
    item: QuoteItemCreateInput,
    tx?: PrismaTransaction
  ): Promise<QuoteItem> {
    const itemModel = tx ? tx.crm_quote_items : this.prisma.crm_quote_items;

    const lineDiscount = this.calculateLineDiscount(
      item.unit_price,
      item.quantity ?? 1,
      item.line_discount_type,
      item.line_discount_value
    );
    const lineTotal = item.unit_price * (item.quantity ?? 1) - lineDiscount;

    const createdItem = await itemModel.create({
      data: {
        quote_id: quoteId,
        provider_id: providerId,
        item_type: item.item_type,
        recurrence: item.recurrence ?? "recurring",
        plan_id: item.plan_id,
        addon_id: item.addon_id,
        service_id: item.service_id,
        name: item.name,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity ?? 1,
        unit_price: item.unit_price,
        line_discount_type: item.line_discount_type,
        line_discount_value: item.line_discount_value ?? 0,
        line_discount_amount: lineDiscount,
        line_total: lineTotal,
        sort_order: item.sort_order ?? 0,
        metadata: item.metadata ?? Prisma.JsonNull,
      },
    });

    // Recalculate quote totals
    await this.recalculateTotals(quoteId, tx);

    return createdItem;
  }

  /**
   * Remove an item from a quote
   */
  async removeItem(
    itemId: string,
    quoteId: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const itemModel = tx ? tx.crm_quote_items : this.prisma.crm_quote_items;

    await itemModel.delete({
      where: { id: itemId },
    });

    // Recalculate quote totals
    await this.recalculateTotals(quoteId, tx);
  }

  /**
   * Update an item in a quote
   */
  async updateItem(
    itemId: string,
    quoteId: string,
    data: Partial<QuoteItemCreateInput>,
    tx?: PrismaTransaction
  ): Promise<QuoteItem> {
    const itemModel = tx ? tx.crm_quote_items : this.prisma.crm_quote_items;

    // Fetch existing item for calculations
    const existing = await itemModel.findFirst({
      where: { id: itemId },
    });

    if (!existing) throw new Error(`Item not found: ${itemId}`);

    const unitPrice = data.unit_price ?? Number(existing.unit_price);
    const quantity = data.quantity ?? existing.quantity;
    const discountType = data.line_discount_type ?? existing.line_discount_type;
    const discountValue =
      data.line_discount_value ??
      (existing.line_discount_value
        ? Number(existing.line_discount_value)
        : undefined);

    const lineDiscount = this.calculateLineDiscount(
      unitPrice,
      quantity,
      discountType,
      discountValue
    );
    const lineTotal = unitPrice * quantity - lineDiscount;

    // Build update data explicitly
    const updateData: Prisma.crm_quote_itemsUpdateInput = {
      line_discount_amount: lineDiscount,
      line_total: lineTotal,
      updated_at: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unit_price !== undefined) updateData.unit_price = data.unit_price;
    if (data.line_discount_type !== undefined)
      updateData.line_discount_type = data.line_discount_type;
    if (data.line_discount_value !== undefined)
      updateData.line_discount_value = data.line_discount_value;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
    if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updatedItem = await itemModel.update({
      where: { id: itemId },
      data: updateData,
    });

    // Recalculate quote totals
    await this.recalculateTotals(quoteId, tx);

    return updatedItem;
  }

  /**
   * Count quotes by status for a provider
   */
  async countByStatus(providerId: string): Promise<Record<string, number>> {
    const counts = await this.model.groupBy({
      by: ["status"],
      where: {
        provider_id: providerId,
        deleted_at: null,
      },
      _count: { id: true },
    });

    return counts.reduce(
      (
        acc: Record<string, number>,
        curr: { status: quote_status; _count: { id: number } }
      ) => {
        acc[curr.status] = curr._count.id;
        return acc;
      },
      {}
    );
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Singleton instance of QuoteRepository
 */
export const quoteRepository = new QuoteRepository(prisma);
