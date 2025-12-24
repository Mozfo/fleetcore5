/**
 * Quote Service - CRM Quote Orchestration
 *
 * This service orchestrates the complete quote workflow:
 * 1. Create quotes from opportunities with items
 * 2. Manage quote lifecycle (draft → sent → viewed → accepted/rejected → converted)
 * 3. Handle versioning for quote revisions
 * 4. Convert accepted quotes to orders
 * 5. Batch operations for CRON jobs (expire overdue quotes)
 *
 * @module lib/services/crm/quote.service
 */

import { prisma } from "@/lib/prisma";
import {
  QuoteRepository,
  quoteRepository,
} from "@/lib/repositories/crm/quote.repository";
import type {
  Quote,
  QuoteWithItems,
  QuoteWithRelations,
  QuoteItemCreateInput,
  QuoteUpdateInput,
  QuoteFilters,
} from "@/lib/repositories/crm/quote.repository";
import { OrderService, orderService } from "./order.service";
import type { Order } from "@/lib/repositories/crm/order.repository";
import {
  ValidationError,
  NotFoundError,
  BusinessRuleError,
} from "@/lib/core/errors";
import type { PaginatedResult } from "@/lib/core/types";
import { logger } from "@/lib/logger";
import { quote_status } from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Parameters for creating a quote
 *
 * NOTE: billing_cycle uses Prisma enum billing_interval (only "month" | "year")
 */
export interface CreateQuoteParams {
  opportunityId: string;
  providerId: string;
  userId: string;
  validUntil: Date;
  validFrom?: Date;
  contractStartDate?: Date;
  contractDurationMonths?: number;
  billingCycle?: "month" | "year";
  currency?: string;
  discountType?: "percentage" | "fixed_amount";
  discountValue?: number;
  taxRate?: number;
  notes?: string;
  termsAndConditions?: string;
  items: CreateQuoteItemParams[];
}

/**
 * Parameters for creating a quote item
 * Uses Prisma enum values: quote_item_type, item_recurrence
 */
export interface CreateQuoteItemParams {
  itemType: "plan" | "addon" | "service" | "custom";
  recurrence?: "one_time" | "recurring";
  planId?: string;
  addonId?: string;
  serviceId?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity?: number;
  unitPrice: number;
  lineDiscountType?: "percentage" | "fixed_amount";
  lineDiscountValue?: number;
  sortOrder?: number;
}

/**
 * Parameters for updating a quote
 *
 * NOTE: billing_cycle uses Prisma enum billing_interval (only "month" | "year")
 */
export interface UpdateQuoteParams {
  validUntil?: Date;
  contractStartDate?: Date;
  contractDurationMonths?: number;
  billingCycle?: "month" | "year";
  discountType?: "percentage" | "fixed_amount";
  discountValue?: number;
  taxRate?: number;
  notes?: string;
  termsAndConditions?: string;
}

/**
 * Result of quote sending
 */
export interface SendQuoteResult {
  quote: Quote;
  publicUrl: string;
  sentAt: Date;
}

/**
 * Result of quote conversion to order
 */
export interface QuoteConversionResult {
  quote: Quote;
  order: Order;
  convertedAt: Date;
}

// =============================================================================
// ALLOWED STATUS TRANSITIONS
// =============================================================================

const ALLOWED_TRANSITIONS: Record<quote_status, quote_status[]> = {
  draft: ["sent"],
  sent: ["viewed", "accepted", "rejected", "expired"],
  viewed: ["accepted", "rejected", "expired"],
  accepted: ["converted"],
  rejected: [],
  expired: [],
  converted: [],
};

/**
 * Check if a status transition is allowed
 */
function isTransitionAllowed(from: quote_status, to: quote_status): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// SERVICE
// =============================================================================

/**
 * Quote Service
 *
 * Orchestrates quote creation, workflow management, and conversion to orders.
 *
 * @example
 * ```typescript
 * // Create a quote
 * const quote = await quoteService.createQuote({
 *   opportunityId: "opp-uuid",
 *   providerId: "provider-uuid",
 *   userId: "user-uuid",
 *   validUntil: new Date("2025-02-28"),
 *   items: [{ itemType: "plan", name: "Fleet Pro", quantity: 10, unitPrice: 99 }]
 * });
 *
 * // Send to client
 * const { publicUrl } = await quoteService.sendQuote(quote.id, providerId, userId);
 *
 * // Client accepts
 * await quoteService.acceptQuote(quote.id, providerId);
 *
 * // Convert to order
 * const { order } = await quoteService.convertToOrder(quote.id, providerId, userId);
 * ```
 */
export class QuoteService {
  private quoteRepo: QuoteRepository;
  private orderService: OrderService;

  constructor() {
    this.quoteRepo = quoteRepository;
    this.orderService = orderService;
  }

  // ===========================================================================
  // CRUD WITH BUSINESS LOGIC
  // ===========================================================================

  /**
   * Create a new quote with items
   *
   * - Validates opportunity exists
   * - Generates reference and code
   * - Creates quote with items
   * - Recalculates totals
   *
   * @param params - Quote creation parameters
   * @returns Created quote with items
   * @throws {NotFoundError} If opportunity not found
   * @throws {ValidationError} If validation fails
   */
  async createQuote(params: CreateQuoteParams): Promise<QuoteWithItems> {
    const {
      opportunityId,
      providerId,
      userId,
      validUntil,
      validFrom,
      contractStartDate,
      contractDurationMonths = 12,
      billingCycle = "month",
      currency = "EUR",
      discountType,
      discountValue,
      taxRate,
      notes,
      termsAndConditions,
      items,
    } = params;

    // Validate opportunity exists
    const opportunity = await prisma.crm_opportunities.findFirst({
      where: {
        id: opportunityId,
        deleted_at: null,
      },
    });

    if (!opportunity) {
      throw new NotFoundError(`Opportunity ${opportunityId}`);
    }

    // Validate items
    if (!items || items.length === 0) {
      throw new ValidationError("At least one item is required");
    }

    // Validate valid_until is in the future
    if (validUntil <= new Date()) {
      throw new ValidationError("valid_until must be in the future");
    }

    // Map items to repository format
    const repoItems: QuoteItemCreateInput[] = items.map((item, index) => ({
      item_type: item.itemType,
      recurrence: item.recurrence ?? "recurring",
      plan_id: item.planId,
      addon_id: item.addonId,
      service_id: item.serviceId,
      name: item.name,
      description: item.description,
      sku: item.sku,
      quantity: item.quantity ?? 1,
      unit_price: item.unitPrice,
      line_discount_type: item.lineDiscountType,
      line_discount_value: item.lineDiscountValue,
      sort_order: item.sortOrder ?? index,
    }));

    // Create quote with transaction
    const quote = await prisma.$transaction(async (tx) => {
      return this.quoteRepo.createQuote(
        {
          opportunity_id: opportunityId,
          provider_id: providerId,
          created_by: userId,
          valid_until: validUntil,
          valid_from: validFrom,
          contract_start_date: contractStartDate,
          contract_duration_months: contractDurationMonths,
          billing_cycle: billingCycle,
          currency,
          discount_type: discountType,
          discount_value: discountValue,
          tax_rate: taxRate,
          notes,
          terms_and_conditions: termsAndConditions,
        },
        repoItems,
        tx
      );
    });

    logger.info(
      {
        quoteId: quote.id,
        quoteReference: quote.quote_reference,
        quoteCode: quote.quote_code,
        opportunityId,
        itemCount: items.length,
        totalValue: quote.total_value?.toString(),
      },
      "[QuoteService] Quote created"
    );

    return quote;
  }

  /**
   * Update a quote
   *
   * Only draft quotes can be updated.
   *
   * @param id - Quote UUID
   * @param providerId - Provider UUID
   * @param userId - User making the update
   * @param params - Update parameters
   * @returns Updated quote
   * @throws {NotFoundError} If quote not found
   * @throws {BusinessRuleError} If quote is not in draft status
   */
  async updateQuote(
    id: string,
    providerId: string,
    userId: string,
    params: UpdateQuoteParams
  ): Promise<Quote> {
    const quote = await this.quoteRepo.findByIdWithProvider(id, providerId);

    if (!quote) {
      throw new NotFoundError(`Quote ${id}`);
    }

    if (quote.status !== "draft") {
      throw new BusinessRuleError(
        "Only draft quotes can be updated",
        "quote_not_draft",
        { currentStatus: quote.status }
      );
    }

    const updateData: QuoteUpdateInput = {};
    if (params.validUntil !== undefined)
      updateData.valid_until = params.validUntil;
    if (params.contractStartDate !== undefined)
      updateData.contract_start_date = params.contractStartDate;
    if (params.contractDurationMonths !== undefined)
      updateData.contract_duration_months = params.contractDurationMonths;
    if (params.billingCycle !== undefined)
      updateData.billing_cycle = params.billingCycle;
    if (params.discountType !== undefined)
      updateData.discount_type = params.discountType;
    if (params.discountValue !== undefined)
      updateData.discount_value = params.discountValue;
    if (params.taxRate !== undefined) updateData.tax_rate = params.taxRate;
    if (params.notes !== undefined) updateData.notes = params.notes;
    if (params.termsAndConditions !== undefined)
      updateData.terms_and_conditions = params.termsAndConditions;

    const updated = await this.quoteRepo.updateQuote(
      id,
      providerId,
      updateData,
      userId
    );

    logger.info(
      {
        quoteId: id,
        quoteReference: quote.quote_reference,
        userId,
        updates: Object.keys(updateData),
      },
      "[QuoteService] Quote updated"
    );

    return updated;
  }

  /**
   * Delete a quote (soft delete)
   *
   * Only draft quotes can be deleted.
   *
   * @param id - Quote UUID
   * @param providerId - Provider UUID
   * @param deletedBy - User making the deletion
   * @param reason - Optional deletion reason
   * @throws {NotFoundError} If quote not found
   * @throws {BusinessRuleError} If quote is not in draft status
   */
  async deleteQuote(
    id: string,
    providerId: string,
    deletedBy: string,
    reason?: string
  ): Promise<void> {
    const quote = await this.quoteRepo.findByIdWithProvider(id, providerId);

    if (!quote) {
      throw new NotFoundError(`Quote ${id}`);
    }

    if (quote.status !== "draft") {
      throw new BusinessRuleError(
        "Only draft quotes can be deleted",
        "quote_not_draft",
        { currentStatus: quote.status }
      );
    }

    await this.quoteRepo.softDeleteQuote(id, providerId, deletedBy, reason);

    logger.info(
      {
        quoteId: id,
        quoteReference: quote.quote_reference,
        deletedBy,
        reason,
      },
      "[QuoteService] Quote deleted"
    );
  }

  // ===========================================================================
  // WORKFLOW STATUS
  // ===========================================================================

  /**
   * Send a quote to the client
   *
   * - Generates public token if not present
   * - Sets status to 'sent'
   * - Records sent_at timestamp
   *
   * @param id - Quote UUID
   * @param providerId - Provider UUID
   * @param sentBy - User sending the quote
   * @returns Send result with public URL
   * @throws {NotFoundError} If quote not found
   * @throws {BusinessRuleError} If quote is not in draft status
   */
  async sendQuote(
    id: string,
    providerId: string,
    sentBy: string
  ): Promise<SendQuoteResult> {
    const quote = await this.quoteRepo.findByIdWithProvider(id, providerId);

    if (!quote) {
      throw new NotFoundError(`Quote ${id}`);
    }

    if (!isTransitionAllowed(quote.status, "sent")) {
      throw new BusinessRuleError(
        `Cannot send quote in ${quote.status} status`,
        "invalid_status_transition",
        { currentStatus: quote.status, targetStatus: "sent" }
      );
    }

    // Generate public token if not present
    let publicToken = quote.public_token;
    if (!publicToken) {
      publicToken = await this.quoteRepo.setPublicToken(id, providerId, sentBy);
    }

    // Update status
    const updated = await this.quoteRepo.updateQuote(
      id,
      providerId,
      {
        status: "sent",
        sent_at: new Date(),
      },
      sentBy
    );

    const publicUrl = `/quotes/view/${publicToken}`;

    logger.info(
      {
        quoteId: id,
        quoteReference: quote.quote_reference,
        sentBy,
        publicToken: publicToken.substring(0, 8) + "...",
      },
      "[QuoteService] Quote sent"
    );

    // TODO: Send notification to client via NotificationService

    return {
      quote: updated,
      publicUrl,
      sentAt: updated.sent_at ?? new Date(),
    };
  }

  /**
   * Mark a quote as viewed
   *
   * Called when client opens the public link.
   *
   * @param id - Quote UUID
   * @param providerId - Provider UUID
   * @returns Updated quote
   */
  async markAsViewed(id: string, providerId: string): Promise<Quote> {
    const quote = await this.quoteRepo.findByIdWithProvider(id, providerId);

    if (!quote) {
      throw new NotFoundError(`Quote ${id}`);
    }

    const now = new Date();
    const updateData: QuoteUpdateInput = {
      last_viewed_at: now,
      view_count: (quote.view_count ?? 0) + 1,
    };

    // Set first_viewed_at if not already set
    if (!quote.first_viewed_at) {
      updateData.first_viewed_at = now;
    }

    // Transition to viewed if currently sent
    if (quote.status === "sent") {
      updateData.status = "viewed";
    }

    const updated = await this.quoteRepo.updateQuote(
      id,
      providerId,
      updateData,
      "system"
    );

    logger.info(
      {
        quoteId: id,
        quoteReference: quote.quote_reference,
        viewCount: updated.view_count,
        isFirstView: !quote.first_viewed_at,
      },
      "[QuoteService] Quote viewed"
    );

    return updated;
  }

  /**
   * Accept a quote
   *
   * @param id - Quote UUID
   * @param providerId - Provider UUID
   * @param acceptedBy - Optional identifier of who accepted
   * @returns Updated quote
   * @throws {NotFoundError} If quote not found
   * @throws {BusinessRuleError} If quote cannot be accepted
   */
  async acceptQuote(
    id: string,
    providerId: string,
    acceptedBy?: string
  ): Promise<Quote> {
    const quote = await this.quoteRepo.findByIdWithProvider(id, providerId);

    if (!quote) {
      throw new NotFoundError(`Quote ${id}`);
    }

    if (!isTransitionAllowed(quote.status, "accepted")) {
      throw new BusinessRuleError(
        `Cannot accept quote in ${quote.status} status`,
        "invalid_status_transition",
        { currentStatus: quote.status, targetStatus: "accepted" }
      );
    }

    // Check if quote has expired
    if (quote.valid_until && quote.valid_until < new Date()) {
      throw new BusinessRuleError(
        "Cannot accept expired quote",
        "quote_expired",
        { validUntil: quote.valid_until }
      );
    }

    const updated = await this.quoteRepo.updateQuote(
      id,
      providerId,
      {
        status: "accepted",
        accepted_at: new Date(),
      },
      acceptedBy ?? "client"
    );

    logger.info(
      {
        quoteId: id,
        quoteReference: quote.quote_reference,
        acceptedBy,
      },
      "[QuoteService] Quote accepted"
    );

    // TODO: Notify sales owner via NotificationService

    return updated;
  }

  /**
   * Reject a quote
   *
   * @param id - Quote UUID
   * @param providerId - Provider UUID
   * @param reason - Optional rejection reason
   * @returns Updated quote
   * @throws {NotFoundError} If quote not found
   * @throws {BusinessRuleError} If quote cannot be rejected
   */
  async rejectQuote(
    id: string,
    providerId: string,
    reason?: string
  ): Promise<Quote> {
    const quote = await this.quoteRepo.findByIdWithProvider(id, providerId);

    if (!quote) {
      throw new NotFoundError(`Quote ${id}`);
    }

    if (!isTransitionAllowed(quote.status, "rejected")) {
      throw new BusinessRuleError(
        `Cannot reject quote in ${quote.status} status`,
        "invalid_status_transition",
        { currentStatus: quote.status, targetStatus: "rejected" }
      );
    }

    const updated = await this.quoteRepo.updateQuote(
      id,
      providerId,
      {
        status: "rejected",
        rejected_at: new Date(),
        rejection_reason: reason,
      },
      "client"
    );

    logger.info(
      {
        quoteId: id,
        quoteReference: quote.quote_reference,
        rejectionReason: reason,
      },
      "[QuoteService] Quote rejected"
    );

    // TODO: Notify sales owner via NotificationService

    return updated;
  }

  /**
   * Expire a quote
   *
   * @param id - Quote UUID
   * @param providerId - Provider UUID
   * @returns Updated quote
   * @throws {NotFoundError} If quote not found
   * @throws {BusinessRuleError} If quote cannot be expired
   */
  async expireQuote(id: string, providerId: string): Promise<Quote> {
    const quote = await this.quoteRepo.findByIdWithProvider(id, providerId);

    if (!quote) {
      throw new NotFoundError(`Quote ${id}`);
    }

    if (!isTransitionAllowed(quote.status, "expired")) {
      throw new BusinessRuleError(
        `Cannot expire quote in ${quote.status} status`,
        "invalid_status_transition",
        { currentStatus: quote.status, targetStatus: "expired" }
      );
    }

    const updated = await this.quoteRepo.updateQuote(
      id,
      providerId,
      {
        status: "expired",
        expired_at: new Date(),
      },
      "system"
    );

    logger.info(
      {
        quoteId: id,
        quoteReference: quote.quote_reference,
      },
      "[QuoteService] Quote expired"
    );

    return updated;
  }

  // ===========================================================================
  // VERSIONING
  // ===========================================================================

  /**
   * Create a new version of an existing quote
   *
   * @param originalQuoteId - Original quote UUID
   * @param providerId - Provider UUID
   * @param createdBy - User creating the new version
   * @returns New quote version
   * @throws {NotFoundError} If original quote not found
   */
  async createNewVersion(
    originalQuoteId: string,
    providerId: string,
    createdBy: string
  ): Promise<QuoteWithItems> {
    const original = await this.quoteRepo.findWithItems(
      originalQuoteId,
      providerId
    );

    if (!original) {
      throw new NotFoundError(`Quote ${originalQuoteId}`);
    }

    const newVersion = await prisma.$transaction(async (tx) => {
      return this.quoteRepo.createNewVersion(
        originalQuoteId,
        providerId,
        createdBy,
        tx
      );
    });

    logger.info(
      {
        originalQuoteId,
        newQuoteId: newVersion.id,
        newQuoteReference: newVersion.quote_reference,
        version: newVersion.quote_version,
        createdBy,
      },
      "[QuoteService] New quote version created"
    );

    return newVersion;
  }

  // ===========================================================================
  // CONVERSION TO ORDER
  // ===========================================================================

  /**
   * Convert an accepted quote to an order
   *
   * @param id - Quote UUID
   * @param providerId - Provider UUID
   * @param convertedBy - User converting the quote
   * @returns Conversion result with order
   * @throws {NotFoundError} If quote not found
   * @throws {BusinessRuleError} If quote is not accepted
   */
  async convertToOrder(
    id: string,
    providerId: string,
    convertedBy: string
  ): Promise<QuoteConversionResult> {
    const quote = await this.quoteRepo.findWithItems(id, providerId);

    if (!quote) {
      throw new NotFoundError(`Quote ${id}`);
    }

    if (quote.status !== "accepted") {
      throw new BusinessRuleError(
        "Only accepted quotes can be converted to orders",
        "quote_not_accepted",
        { currentStatus: quote.status }
      );
    }

    // Create order from quote via OrderService
    const orderResult = await this.orderService.createOrderFromOpportunity({
      opportunityId: quote.opportunity_id,
      providerId,
      userId: convertedBy,
      totalValue: Number(quote.total_value ?? 0),
      currency: quote.currency,
      billingCycle: this.mapBillingCycle(quote.billing_cycle),
      effectiveDate: quote.contract_start_date ?? new Date(),
      durationMonths: quote.contract_duration_months ?? 12,
      autoRenew: false,
    });

    // Update quote status to converted
    const updatedQuote = await this.quoteRepo.updateQuote(
      id,
      providerId,
      {
        status: "converted",
        converted_to_order_id: orderResult.order.id,
        converted_at: new Date(),
      },
      convertedBy
    );

    logger.info(
      {
        quoteId: id,
        quoteReference: quote.quote_reference,
        orderId: orderResult.order.id,
        orderReference: orderResult.order.order_reference,
        convertedBy,
      },
      "[QuoteService] Quote converted to order"
    );

    return {
      quote: updatedQuote,
      order: orderResult.order,
      convertedAt: updatedQuote.converted_at ?? new Date(),
    };
  }

  /**
   * Map quote billing_cycle to order billing_cycle format
   *
   * Both Prisma billing_interval and OrderService now use "month" | "year".
   */
  private mapBillingCycle(cycle: string | null | undefined): "month" | "year" {
    if (cycle === "year") {
      return "year";
    }
    return "month";
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  /**
   * Get a quote by ID
   */
  async getQuote(id: string, providerId: string): Promise<Quote | null> {
    return this.quoteRepo.findByIdWithProvider(id, providerId);
  }

  /**
   * Get a quote with items
   */
  async getQuoteWithItems(
    id: string,
    providerId: string
  ): Promise<QuoteWithItems | null> {
    return this.quoteRepo.findWithItems(id, providerId);
  }

  /**
   * Get a quote with all relations
   */
  async getQuoteWithRelations(
    id: string,
    providerId: string
  ): Promise<QuoteWithRelations | null> {
    return this.quoteRepo.findWithRelations(id, providerId);
  }

  /**
   * Get a quote by public token (no provider filtering)
   */
  async getQuoteByPublicToken(token: string): Promise<QuoteWithItems | null> {
    return this.quoteRepo.findByPublicToken(token);
  }

  /**
   * Get a quote by reference
   */
  async getQuoteByReference(
    reference: string,
    providerId: string
  ): Promise<Quote | null> {
    return this.quoteRepo.findByReference(reference, providerId);
  }

  /**
   * List quotes with pagination and filters
   */
  async listQuotes(
    providerId: string,
    filters?: QuoteFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<Quote>> {
    return this.quoteRepo.findAllWithFilters(
      providerId,
      filters,
      page,
      pageSize
    );
  }

  /**
   * Get quotes by opportunity
   */
  async getQuotesByOpportunity(
    opportunityId: string,
    providerId: string
  ): Promise<Quote[]> {
    return this.quoteRepo.findByOpportunity(opportunityId, providerId);
  }

  /**
   * Get version history of a quote
   */
  async getVersionHistory(
    quoteId: string,
    providerId: string
  ): Promise<Quote[]> {
    return this.quoteRepo.findVersionHistory(quoteId, providerId);
  }

  /**
   * Get the latest version of a quote for an opportunity
   */
  async getLatestVersion(
    opportunityId: string,
    providerId: string
  ): Promise<Quote | null> {
    return this.quoteRepo.getLatestVersion(opportunityId, providerId);
  }

  // ===========================================================================
  // BATCH OPERATIONS (FOR CRON)
  // ===========================================================================

  /**
   * Expire all overdue quotes for a provider
   *
   * Finds quotes where valid_until < now AND status in [sent, viewed]
   * and marks them as expired.
   *
   * @param providerId - Provider UUID
   * @returns Number of quotes expired
   */
  async expireOverdueQuotes(providerId: string): Promise<number> {
    const expiredQuotes = await this.quoteRepo.findExpired(providerId);

    let count = 0;
    for (const quote of expiredQuotes) {
      try {
        await this.expireQuote(quote.id, providerId);
        count++;
      } catch (error) {
        logger.warn(
          {
            quoteId: quote.id,
            quoteReference: quote.quote_reference,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "[QuoteService] Failed to expire quote"
        );
      }
    }

    logger.info(
      {
        providerId,
        expiredCount: count,
        totalFound: expiredQuotes.length,
      },
      "[QuoteService] Batch quote expiration completed"
    );

    return count;
  }

  /**
   * Get quotes expiring soon
   *
   * @param providerId - Provider UUID
   * @param days - Number of days to check
   * @returns Quotes expiring within the specified days
   */
  async getExpiringSoonQuotes(
    providerId: string,
    days: number
  ): Promise<Quote[]> {
    return this.quoteRepo.findExpiringSoon(providerId, days);
  }

  /**
   * Count quotes by status
   */
  async countByStatus(
    providerId: string
  ): Promise<Partial<Record<quote_status, number>>> {
    return this.quoteRepo.countByStatus(providerId);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Singleton instance of QuoteService
 */
export const quoteService = new QuoteService();
