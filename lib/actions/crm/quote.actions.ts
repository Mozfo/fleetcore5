"use server";

/**
 * CRM Quote Server Actions
 *
 * Server Actions for quote lifecycle management in Quote-to-Cash flow.
 * Security:
 * 1. Admin Actions: requireCrmAuth (HQ org check)
 * 2. Public Actions: Token-based validation (no auth)
 * 3. All inputs validated with Zod schemas
 *
 * Action Categories:
 * - CRUD: create, update, delete (admin only)
 * - Workflow: send, accept, reject, convert (mixed auth)
 * - Versioning: createNewVersion (admin only)
 * - Queries: get, list, stats (admin only)
 * - Public: viewByToken, acceptByToken, rejectByToken (no auth)
 * - CRON: expireOverdue, getExpiringSoon (admin/system)
 *
 * @module lib/actions/crm/quote.actions
 */

import { requireCrmAuth } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getAuditLogUuids } from "@/lib/utils/audit-resolver";
import { getCurrentProviderId } from "@/lib/utils/provider-context";
import { quoteService } from "@/lib/services/crm/quote.service";
import {
  NotFoundError,
  ValidationError,
  BusinessRuleError,
} from "@/lib/core/errors";
import {
  CreateQuoteSchema,
  UpdateQuoteSchema,
  AcceptQuoteByTokenSchema,
  RejectQuoteByTokenSchema,
  ConvertQuoteToOrderSchema,
  ViewQuoteByTokenSchema,
  QuoteQuerySchema,
  type CreateQuoteInput,
  type UpdateQuoteInput,
  type ConvertQuoteToOrderInput,
  type QuoteQueryInput,
} from "@/lib/validators/crm/quote.validators";
import type {
  Quote,
  QuoteWithItems,
  QuoteWithRelations,
} from "@/lib/repositories/crm/quote.repository";
import type { Order } from "@/lib/repositories/crm/order.repository";
import type { quote_status } from "@prisma/client";

// =============================================================================
// INLINE SCHEMAS (not in validators)
// =============================================================================

const UuidSchema = z.string().uuid("Invalid ID format");
const DaysSchema = z.number().int().min(1).max(90).default(7);

// =============================================================================
// RESULT TYPES
// =============================================================================

/** Result for creating a quote */
export type CreateQuoteResult =
  | { success: true; quote: QuoteWithItems }
  | { success: false; error: string };

/** Result for updating a quote */
export type UpdateQuoteResult =
  | { success: true; quote: Quote }
  | { success: false; error: string };

/** Result for deleting a quote */
export type DeleteQuoteResult =
  | { success: true }
  | { success: false; error: string };

/** Result for sending a quote */
export type SendQuoteResult =
  | {
      success: true;
      data: {
        quote: Quote;
        publicUrl: string;
        sentAt: string;
      };
    }
  | { success: false; error: string };

/** Result for accepting a quote */
export type AcceptQuoteResult =
  | { success: true; quote: Quote }
  | { success: false; error: string };

/** Result for rejecting a quote */
export type RejectQuoteResult =
  | { success: true; quote: Quote }
  | { success: false; error: string };

/** Result for converting a quote to order */
export type ConvertQuoteResult =
  | {
      success: true;
      data: {
        quote: Quote;
        order: Order;
        convertedAt: string;
      };
    }
  | { success: false; error: string };

/** Result for creating a new quote version */
export type CreateVersionResult =
  | { success: true; quote: QuoteWithItems }
  | { success: false; error: string };

/** Result for getting a single quote */
export type GetQuoteResult =
  | { success: true; quote: Quote | null }
  | { success: false; error: string };

/** Result for getting a quote with items */
export type GetQuoteWithItemsResult =
  | { success: true; quote: QuoteWithItems | null }
  | { success: false; error: string };

/** Result for getting a quote with relations */
export type GetQuoteWithRelationsResult =
  | { success: true; quote: QuoteWithRelations | null }
  | { success: false; error: string };

/** Result for listing quotes */
export type ListQuotesResult =
  | {
      success: true;
      quotes: Quote[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }
  | { success: false; error: string };

/** Result for getting quote stats */
export type GetQuoteStatsResult =
  | { success: true; stats: Partial<Record<quote_status, number>> }
  | { success: false; error: string };

/** Result for viewing a quote by token (public) */
export type ViewQuoteByTokenResult =
  | { success: true; quote: QuoteWithItems }
  | { success: false; error: string };

/** Result for expiring overdue quotes */
export type ExpireOverdueResult =
  | { success: true; expiredCount: number }
  | { success: false; error: string };

/** Result for getting expiring soon quotes */
export type GetExpiringSoonResult =
  | { success: true; quotes: Quote[] }
  | { success: false; error: string };

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check admin authorization
 * Returns error message if not authorized, null if OK
 */
async function checkAdminAuth(): Promise<
  { userId: string; orgId: string; providerId: string } | { error: string }
> {
  try {
    const { userId, orgId } = await requireCrmAuth();

    const providerId = await getCurrentProviderId();
    if (!providerId) {
      return {
        error:
          "Provider context required. User must be linked to a provider in adm_provider_employees.",
      };
    }

    return { userId, orgId, providerId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return { error: message };
  }
}

// =============================================================================
// CRUD ACTIONS (Admin Only)
// =============================================================================

/**
 * Create a new quote with items
 *
 * @param input - Quote creation data (validated with CreateQuoteSchema)
 * @returns Created quote with items
 */
export async function createQuoteAction(
  input: CreateQuoteInput
): Promise<CreateQuoteResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate input
    const validation = CreateQuoteSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Map to service params
    const quote = await quoteService.createQuote({
      opportunityId: validated.opportunityId,
      providerId,
      userId,
      validUntil: validated.validUntil,
      validFrom: validated.validFrom,
      contractStartDate: validated.contractStartDate ?? undefined,
      contractDurationMonths: validated.contractDurationMonths,
      billingCycle: validated.billingCycle,
      currency: validated.currency,
      discountType: validated.discountType ?? undefined,
      discountValue: validated.discountValue ?? undefined,
      taxRate: validated.taxRate,
      notes: validated.notes ?? undefined,
      termsAndConditions: validated.termsAndConditions ?? undefined,
      items: validated.items.map((item) => ({
        itemType: item.itemType,
        recurrence: item.recurrence,
        planId: item.planId ?? undefined,
        addonId: item.addonId ?? undefined,
        serviceId: item.serviceId ?? undefined,
        name: item.name,
        description: item.description ?? undefined,
        sku: item.sku ?? undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineDiscountType: item.lineDiscountType ?? undefined,
        lineDiscountValue: item.lineDiscountValue ?? undefined,
        sortOrder: item.sortOrder,
      })),
    });

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_quote",
          entity_id: quote.id,
          action: "CREATE",
          new_values: {
            quote_reference: quote.quote_reference,
            opportunity_id: validated.opportunityId,
            total_value: quote.total_value?.toString(),
            item_count: validated.items.length,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/quotes", "page");
    revalidatePath("/[locale]/(app)/crm/opportunities", "page");

    logger.info(
      {
        quoteId: quote.id,
        quoteReference: quote.quote_reference,
        opportunityId: validated.opportunityId,
        userId,
      },
      "[createQuoteAction] Quote created"
    );

    return { success: true, quote };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }

    logger.error({ error }, "[createQuoteAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create quote";
    return { success: false, error: errorMessage };
  }
}

/**
 * Update a quote (draft status only)
 *
 * @param quoteId - Quote UUID
 * @param input - Update data
 * @returns Updated quote
 */
export async function updateQuoteAction(
  quoteId: string,
  input: UpdateQuoteInput
): Promise<UpdateQuoteResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate quoteId
    const idValidation = UuidSchema.safeParse(quoteId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid quote ID" };
    }

    // 3. Validate input
    const validation = UpdateQuoteSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 4. Update via service
    const quote = await quoteService.updateQuote(quoteId, providerId, userId, {
      validUntil: validated.validUntil,
      contractStartDate: validated.contractStartDate ?? undefined,
      contractDurationMonths: validated.contractDurationMonths,
      billingCycle: validated.billingCycle,
      discountType: validated.discountType ?? undefined,
      discountValue: validated.discountValue ?? undefined,
      taxRate: validated.taxRate,
      notes: validated.notes ?? undefined,
      termsAndConditions: validated.termsAndConditions ?? undefined,
    });

    // 5. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_quote",
          entity_id: quoteId,
          action: "UPDATE",
          new_values: validated,
          severity: "info",
          category: "operational",
        },
      });
    }

    // 6. Revalidate
    revalidatePath("/[locale]/(app)/crm/quotes", "page");

    logger.info(
      {
        quoteId,
        quoteReference: quote.quote_reference,
        userId,
        updates: Object.keys(validated),
      },
      "[updateQuoteAction] Quote updated"
    );

    return { success: true, quote };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, quoteId }, "[updateQuoteAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update quote";
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a quote (soft delete, draft status only)
 *
 * @param quoteId - Quote UUID
 * @param reason - Optional deletion reason
 * @returns Success status
 */
export async function deleteQuoteAction(
  quoteId: string,
  reason?: string
): Promise<DeleteQuoteResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate quoteId
    const idValidation = UuidSchema.safeParse(quoteId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid quote ID" };
    }

    // 3. Delete via service
    await quoteService.deleteQuote(quoteId, providerId, userId, reason);

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_quote",
          entity_id: quoteId,
          action: "DELETE",
          new_values: { reason },
          severity: "warning",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/quotes", "page");

    logger.info(
      { quoteId, userId, reason },
      "[deleteQuoteAction] Quote deleted"
    );

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, quoteId }, "[deleteQuoteAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete quote";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// WORKFLOW ACTIONS (Admin Only)
// =============================================================================

/**
 * Send a quote to the client
 *
 * Generates public token and sets status to 'sent'.
 *
 * @param quoteId - Quote UUID
 * @returns Quote with public URL
 */
export async function sendQuoteAction(
  quoteId: string
): Promise<SendQuoteResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate quoteId
    const idValidation = UuidSchema.safeParse(quoteId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid quote ID" };
    }

    // 3. Send via service
    const result = await quoteService.sendQuote(quoteId, providerId, userId);

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_quote",
          entity_id: quoteId,
          action: "UPDATE",
          new_values: {
            status: "sent",
            sent_at: result.sentAt.toISOString(),
            public_url: result.publicUrl,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/quotes", "page");

    logger.info(
      {
        quoteId,
        quoteReference: result.quote.quote_reference,
        publicUrl: result.publicUrl,
        userId,
      },
      "[sendQuoteAction] Quote sent"
    );

    return {
      success: true,
      data: {
        quote: result.quote,
        publicUrl: result.publicUrl,
        sentAt: result.sentAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, quoteId }, "[sendQuoteAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send quote";
    return { success: false, error: errorMessage };
  }
}

/**
 * Convert an accepted quote to an order (Admin)
 *
 * @param input - Conversion parameters
 * @returns Quote and created order
 */
export async function convertQuoteToOrderAction(
  input: ConvertQuoteToOrderInput
): Promise<ConvertQuoteResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate input
    const validation = ConvertQuoteToOrderSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Convert via service
    const result = await quoteService.convertToOrder(
      validated.quoteId,
      providerId,
      userId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_quote",
          entity_id: validated.quoteId,
          action: "CONVERT",
          new_values: {
            status: "converted",
            converted_to_order_id: result.order.id,
            order_reference: result.order.order_reference,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/quotes", "page");
    revalidatePath("/[locale]/(app)/crm/orders", "page");

    logger.info(
      {
        quoteId: validated.quoteId,
        quoteReference: result.quote.quote_reference,
        orderId: result.order.id,
        orderReference: result.order.order_reference,
        userId,
      },
      "[convertQuoteToOrderAction] Quote converted to order"
    );

    return {
      success: true,
      data: {
        quote: result.quote,
        order: result.order,
        convertedAt: result.convertedAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error(
      { error, quoteId: input.quoteId },
      "[convertQuoteToOrderAction] Error"
    );
    const errorMessage =
      error instanceof Error ? error.message : "Failed to convert quote";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// VERSIONING ACTIONS (Admin Only)
// =============================================================================

/**
 * Create a new version of an existing quote
 *
 * @param originalQuoteId - Original quote UUID
 * @returns New version of the quote
 */
export async function createQuoteVersionAction(
  originalQuoteId: string
): Promise<CreateVersionResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate quoteId
    const idValidation = UuidSchema.safeParse(originalQuoteId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid quote ID" };
    }

    // 3. Create version via service
    const newVersion = await quoteService.createNewVersion(
      originalQuoteId,
      providerId,
      userId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_quote",
          entity_id: newVersion.id,
          action: "CREATE",
          new_values: {
            quote_reference: newVersion.quote_reference,
            quote_version: newVersion.quote_version,
            parent_quote_id: originalQuoteId,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/quotes", "page");

    logger.info(
      {
        originalQuoteId,
        newQuoteId: newVersion.id,
        newQuoteReference: newVersion.quote_reference,
        version: newVersion.quote_version,
        userId,
      },
      "[createQuoteVersionAction] New quote version created"
    );

    return { success: true, quote: newVersion };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }

    logger.error(
      { error, originalQuoteId },
      "[createQuoteVersionAction] Error"
    );
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create quote version";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// QUERY ACTIONS (Admin Only)
// =============================================================================

/**
 * Get a single quote by ID
 *
 * @param quoteId - Quote UUID
 * @returns Quote or null
 */
export async function getQuoteAction(quoteId: string): Promise<GetQuoteResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate quoteId
    const idValidation = UuidSchema.safeParse(quoteId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid quote ID" };
    }

    // 3. Get via service
    const quote = await quoteService.getQuote(quoteId, providerId);

    return { success: true, quote };
  } catch (error) {
    logger.error({ error, quoteId }, "[getQuoteAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get quote";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get a quote with items
 *
 * @param quoteId - Quote UUID
 * @returns Quote with items or null
 */
export async function getQuoteWithItemsAction(
  quoteId: string
): Promise<GetQuoteWithItemsResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate quoteId
    const idValidation = UuidSchema.safeParse(quoteId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid quote ID" };
    }

    // 3. Get via service
    const quote = await quoteService.getQuoteWithItems(quoteId, providerId);

    return { success: true, quote };
  } catch (error) {
    logger.error({ error, quoteId }, "[getQuoteWithItemsAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get quote";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get a quote with all relations
 *
 * @param quoteId - Quote UUID
 * @returns Quote with relations or null
 */
export async function getQuoteWithRelationsAction(
  quoteId: string
): Promise<GetQuoteWithRelationsResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate quoteId
    const idValidation = UuidSchema.safeParse(quoteId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid quote ID" };
    }

    // 3. Get via service
    const quote = await quoteService.getQuoteWithRelations(quoteId, providerId);

    return { success: true, quote };
  } catch (error) {
    logger.error({ error, quoteId }, "[getQuoteWithRelationsAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get quote";
    return { success: false, error: errorMessage };
  }
}

/**
 * List quotes with pagination and filters
 *
 * @param query - Query parameters
 * @returns Paginated quotes
 */
export async function listQuotesAction(
  query?: QuoteQueryInput
): Promise<ListQuotesResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate query
    const validation = QuoteQuerySchema.safeParse(query || {});
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid query" };
    }
    const validated = validation.data;

    // 3. Build filters
    const filters = {
      status: validated.status,
      opportunityId: validated.opportunityId,
      currency: validated.currency,
      minValue: validated.minValue,
      maxValue: validated.maxValue,
      validFrom: validated.validFrom,
      validUntil: validated.validUntil,
      search: validated.search,
      sortBy: validated.sortBy,
      sortOrder: validated.sortOrder,
    };

    // 4. Get via service
    const result = await quoteService.listQuotes(
      providerId,
      filters,
      validated.page,
      validated.limit
    );

    return {
      success: true,
      quotes: result.data,
      total: result.total,
      page: result.page,
      pageSize: validated.limit,
      totalPages: result.totalPages,
    };
  } catch (error) {
    logger.error({ error }, "[listQuotesAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to list quotes";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get quotes by opportunity
 *
 * @param opportunityId - Opportunity UUID
 * @returns Quotes for the opportunity
 */
export async function getQuotesByOpportunityAction(
  opportunityId: string
): Promise<
  { success: true; quotes: Quote[] } | { success: false; error: string }
> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate opportunityId
    const idValidation = UuidSchema.safeParse(opportunityId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid opportunity ID" };
    }

    // 3. Get via service
    const quotes = await quoteService.getQuotesByOpportunity(
      opportunityId,
      providerId
    );

    return { success: true, quotes };
  } catch (error) {
    logger.error(
      { error, opportunityId },
      "[getQuotesByOpportunityAction] Error"
    );
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get quotes";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get version history of a quote
 *
 * @param quoteId - Quote UUID
 * @returns All versions of the quote
 */
export async function getVersionHistoryAction(
  quoteId: string
): Promise<
  { success: true; quotes: Quote[] } | { success: false; error: string }
> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate quoteId
    const idValidation = UuidSchema.safeParse(quoteId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid quote ID" };
    }

    // 3. Get via service
    const quotes = await quoteService.getVersionHistory(quoteId, providerId);

    return { success: true, quotes };
  } catch (error) {
    logger.error({ error, quoteId }, "[getVersionHistoryAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get version history";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get the latest version of a quote for an opportunity
 *
 * @param opportunityId - Opportunity UUID
 * @returns Latest quote version or null
 */
export async function getLatestVersionAction(
  opportunityId: string
): Promise<GetQuoteResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate opportunityId
    const idValidation = UuidSchema.safeParse(opportunityId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid opportunity ID" };
    }

    // 3. Get via service
    const quote = await quoteService.getLatestVersion(
      opportunityId,
      providerId
    );

    return { success: true, quote };
  } catch (error) {
    logger.error({ error, opportunityId }, "[getLatestVersionAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get latest version";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get quote statistics by status
 *
 * @returns Count of quotes per status
 */
export async function getQuoteStatsAction(): Promise<GetQuoteStatsResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Get via service
    const stats = await quoteService.countByStatus(providerId);

    return { success: true, stats };
  } catch (error) {
    logger.error({ error }, "[getQuoteStatsAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get quote stats";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// CRON ACTIONS (Admin/System)
// =============================================================================

/**
 * Expire all overdue quotes
 *
 * Used by CRON job to automatically expire quotes past valid_until.
 *
 * @returns Number of quotes expired
 */
export async function expireOverdueQuotesAction(): Promise<ExpireOverdueResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Expire via service
    const expiredCount = await quoteService.expireOverdueQuotes(providerId);

    logger.info(
      { providerId, expiredCount },
      "[expireOverdueQuotesAction] Expired overdue quotes"
    );

    return { success: true, expiredCount };
  } catch (error) {
    logger.error({ error }, "[expireOverdueQuotesAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to expire quotes";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get quotes expiring soon
 *
 * @param days - Number of days to look ahead (default 7)
 * @returns Quotes expiring within the specified days
 */
export async function getExpiringSoonQuotesAction(
  days?: number
): Promise<GetExpiringSoonResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate days
    const daysValidation = DaysSchema.safeParse(days ?? 7);
    if (!daysValidation.success) {
      return { success: false, error: "Invalid days parameter" };
    }

    // 3. Get via service
    const quotes = await quoteService.getExpiringSoonQuotes(
      providerId,
      daysValidation.data
    );

    return { success: true, quotes };
  } catch (error) {
    logger.error({ error, days }, "[getExpiringSoonQuotesAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get expiring quotes";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// PUBLIC ACTIONS (No Authentication)
// =============================================================================

/**
 * View a quote by public token (PUBLIC - No auth required)
 *
 * Used when a prospect opens the public quote link.
 * Increments view count and updates first/last viewed timestamps.
 *
 * @param token - Public access token
 * @returns Quote with items
 */
export async function viewQuoteByTokenAction(
  token: string
): Promise<ViewQuoteByTokenResult> {
  try {
    // 1. Validate token
    const validation = ViewQuoteByTokenSchema.safeParse({ token });
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid token" };
    }

    // 2. Get quote by token (no provider check - token is the auth)
    const quote = await quoteService.getQuoteByPublicToken(
      validation.data.token
    );

    if (!quote) {
      return { success: false, error: "Quote not found or expired" };
    }

    // 3. Validate quote has provider_id (data integrity check)
    if (!quote.provider_id) {
      logger.error(
        { quoteId: quote.id },
        "[viewQuoteByTokenAction] Quote missing provider_id - data integrity issue"
      );
      return { success: false, error: "Quote configuration error" };
    }

    // 4. Mark as viewed (uses provider_id from the quote itself)
    await quoteService.markAsViewed(quote.id, quote.provider_id);

    logger.info(
      {
        quoteId: quote.id,
        quoteReference: quote.quote_reference,
        viewCount: (quote.view_count ?? 0) + 1,
      },
      "[viewQuoteByTokenAction] Quote viewed"
    );

    return { success: true, quote };
  } catch (error) {
    logger.error({ error }, "[viewQuoteByTokenAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to view quote";
    return { success: false, error: errorMessage };
  }
}

/**
 * Accept a quote via public token (PUBLIC - No auth required)
 *
 * Used when a prospect accepts a quote from the public view page.
 *
 * @param params - Token and optional signature/acceptedBy
 * @returns Accepted quote
 */
export async function acceptQuoteByTokenAction(params: {
  token: string;
  signature?: string | null;
  acceptedBy?: string | null;
}): Promise<AcceptQuoteResult> {
  try {
    // 1. Validate input
    const validation = AcceptQuoteByTokenSchema.safeParse(params);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 2. Get quote by token (no provider check - token is the auth)
    const quote = await quoteService.getQuoteByPublicToken(validated.token);

    if (!quote) {
      return { success: false, error: "Quote not found or expired" };
    }

    // 3. Validate quote has provider_id (data integrity check)
    if (!quote.provider_id) {
      logger.error(
        { quoteId: quote.id },
        "[acceptQuoteByTokenAction] Quote missing provider_id - data integrity issue"
      );
      return { success: false, error: "Quote configuration error" };
    }

    // 4. Accept via service (uses provider_id from the quote itself)
    const result = await quoteService.acceptQuote(
      quote.id,
      quote.provider_id,
      validated.acceptedBy ?? undefined
    );

    logger.info(
      {
        quoteId: result.id,
        quoteReference: result.quote_reference,
        acceptedBy: validated.acceptedBy,
      },
      "[acceptQuoteByTokenAction] Quote accepted"
    );

    // 5. Revalidate (for admin dashboard)
    revalidatePath("/[locale]/(app)/crm/quotes", "page");

    return { success: true, quote: result };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error }, "[acceptQuoteByTokenAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to accept quote";
    return { success: false, error: errorMessage };
  }
}

/**
 * Reject a quote via public token (PUBLIC - No auth required)
 *
 * Used when a prospect rejects a quote from the public view page.
 *
 * @param params - Token and rejection reason
 * @returns Rejected quote
 */
export async function rejectQuoteByTokenAction(params: {
  token: string;
  rejectionReason: string;
}): Promise<RejectQuoteResult> {
  try {
    // 1. Validate input
    const validation = RejectQuoteByTokenSchema.safeParse(params);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 2. Get quote by token (no provider check - token is the auth)
    const quote = await quoteService.getQuoteByPublicToken(validated.token);

    if (!quote) {
      return { success: false, error: "Quote not found or expired" };
    }

    // 3. Validate quote has provider_id (data integrity check)
    if (!quote.provider_id) {
      logger.error(
        { quoteId: quote.id },
        "[rejectQuoteByTokenAction] Quote missing provider_id - data integrity issue"
      );
      return { success: false, error: "Quote configuration error" };
    }

    // 4. Reject via service (uses provider_id from the quote itself)
    const result = await quoteService.rejectQuote(
      quote.id,
      quote.provider_id,
      validated.rejectionReason
    );

    logger.info(
      {
        quoteId: result.id,
        quoteReference: result.quote_reference,
        rejectionReason: validated.rejectionReason,
      },
      "[rejectQuoteByTokenAction] Quote rejected"
    );

    // 5. Revalidate (for admin dashboard)
    revalidatePath("/[locale]/(app)/crm/quotes", "page");

    return { success: true, quote: result };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error }, "[rejectQuoteByTokenAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reject quote";
    return { success: false, error: errorMessage };
  }
}
