/**
 * CRM Quote Validators - Quote-to-Cash
 *
 * Zod schemas for Quote validation in the Quote-to-Cash flow.
 * Handles validation for quote creation, updates, workflow actions, and queries.
 *
 * Schemas exported:
 * - CreateQuoteSchema: Create new quote with items (API)
 * - CreateQuoteItemSchema: Create quote line item (nested)
 * - UpdateQuoteSchema: Update quote fields
 * - UpdateQuoteItemSchema: Update quote item fields
 * - AddQuoteItemSchema: Add item to existing quote
 * - AcceptQuoteSchema: Accept quote action
 * - RejectQuoteSchema: Reject quote with reason
 * - ConvertQuoteToOrderSchema: Convert accepted quote to order
 * - ViewQuoteByTokenSchema: Public quote view by token
 * - QuoteQuerySchema: Query/filter quotes
 * - QuoteItemQuerySchema: Query quote items
 * - QuoteStatusUpdateSchema: Status change validation
 *
 * Form Schemas (string → number transforms):
 * - CreateQuoteFormSchema: UI form for quote creation
 * - CreateQuoteItemFormSchema: UI form for item creation
 * - RejectQuoteFormSchema: UI form for rejection
 * - ConvertQuoteFormSchema: UI form for conversion
 *
 * NOTE: provider_id and created_by are NOT included in schemas.
 * They are injected at the action layer via getCurrentProviderId() and auth().
 * See: lib/utils/provider-context.ts
 *
 * @module lib/validators/crm/quote.validators
 */

import { z } from "zod";
import {
  DISCOUNT_TYPES,
  CURRENCIES,
  BILLING_INTERVALS,
  discountTypeSchema,
  currencySchema,
  billingIntervalSchema,
  taxRateSchema,
  durationMonthsSchema,
} from "./shared.validators";

// Re-export shared constants and schemas for convenience
export { DISCOUNT_TYPES, CURRENCIES, BILLING_INTERVALS };
export { discountTypeSchema, currencySchema, billingIntervalSchema };
export type {
  DiscountType,
  Currency,
  BillingInterval,
} from "./shared.validators";

// =============================================================================
// QUOTE-SPECIFIC CONSTANTS
// =============================================================================

/**
 * Quote status values
 *
 * Maps to PostgreSQL ENUM: quote_status
 * Represents the lifecycle of a quote in the sales process.
 *
 * Workflow: draft → sent → viewed → accepted/rejected/expired → converted
 *
 * @see prisma/schema.prisma enum quote_status
 */
export const QUOTE_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "converted",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/**
 * Quote item type values
 *
 * Maps to PostgreSQL ENUM: quote_item_type
 * Defines the type of item being quoted.
 *
 * - plan: Subscription plan (requires planId)
 * - addon: Additional feature (requires addonId)
 * - service: One-time or recurring service (requires serviceId)
 * - custom: Custom line item (no reference ID required)
 *
 * @see prisma/schema.prisma enum quote_item_type
 */
export const QUOTE_ITEM_TYPES = ["plan", "addon", "service", "custom"] as const;

export type QuoteItemType = (typeof QUOTE_ITEM_TYPES)[number];

/**
 * Item recurrence values
 *
 * Maps to PostgreSQL ENUM: item_recurrence
 * Defines whether an item is billed once or recurring.
 *
 * @see prisma/schema.prisma enum item_recurrence
 */
export const ITEM_RECURRENCES = ["one_time", "recurring"] as const;

export type ItemRecurrence = (typeof ITEM_RECURRENCES)[number];

/**
 * Valid status transitions for quote workflow
 *
 * Defines which status transitions are allowed.
 * Used for runtime validation of status changes.
 *
 * @example
 * ```typescript
 * const currentStatus: QuoteStatus = "sent";
 * const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus];
 * // allowedNext = ["viewed", "expired"]
 * ```
 */
export const VALID_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent"],
  sent: ["viewed", "expired"],
  viewed: ["accepted", "rejected", "expired"],
  accepted: ["converted"],
  rejected: [],
  expired: [],
  converted: [],
};

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * Schema for quote status validation
 */
export const quoteStatusSchema = z.enum(QUOTE_STATUSES);

/**
 * Schema for quote item type validation
 */
export const quoteItemTypeSchema = z.enum(QUOTE_ITEM_TYPES);

/**
 * Schema for item recurrence validation
 */
export const itemRecurrenceSchema = z.enum(ITEM_RECURRENCES);

// =============================================================================
// API SCHEMAS - Quote Items
// =============================================================================

/**
 * Schema for creating a quote item
 *
 * Used as a nested schema in CreateQuoteSchema and AddQuoteItemSchema.
 * Validates item data including conditional reference ID requirements.
 *
 * Validation rules:
 * - itemType "plan" requires planId
 * - itemType "addon" requires addonId
 * - itemType "service" requires serviceId
 * - itemType "custom" requires no reference ID
 * - Percentage discount cannot exceed 100%
 *
 * @example
 * ```typescript
 * const planItem = {
 *   itemType: "plan",
 *   planId: "uuid-plan",
 *   name: "FleetCore Pro",
 *   unitPrice: 99.99,
 *   quantity: 10,
 * };
 * const validated = CreateQuoteItemSchema.parse(planItem);
 * ```
 */
export const CreateQuoteItemSchema = z
  .object({
    /** Type of item: plan, addon, service, or custom */
    itemType: quoteItemTypeSchema.describe(
      "Type of item: plan, addon, service, or custom"
    ),

    /** Billing recurrence: one_time or recurring */
    recurrence: itemRecurrenceSchema.default("recurring"),

    /** Plan ID (required if itemType is "plan") */
    planId: z.string().uuid("Invalid plan ID format").optional().nullable(),

    /** Addon ID (required if itemType is "addon") */
    addonId: z.string().uuid("Invalid addon ID format").optional().nullable(),

    /** Service ID (required if itemType is "service") */
    serviceId: z
      .string()
      .uuid("Invalid service ID format")
      .optional()
      .nullable(),

    /** Item display name (1-200 chars) */
    name: z
      .string()
      .min(1, "Item name is required")
      .max(200, "Item name cannot exceed 200 characters"),

    /** Item description */
    description: z
      .string()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional()
      .nullable(),

    /** Stock Keeping Unit code */
    sku: z
      .string()
      .max(50, "SKU cannot exceed 50 characters")
      .optional()
      .nullable(),

    /** Quantity (minimum 1) */
    quantity: z
      .number()
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .default(1),

    /** Unit price (non-negative) */
    unitPrice: z.number().nonnegative("Unit price cannot be negative"),

    /** Line discount type: percentage or fixed_amount */
    lineDiscountType: discountTypeSchema.optional().nullable(),

    /** Line discount value (non-negative) */
    lineDiscountValue: z
      .number()
      .nonnegative("Discount value cannot be negative")
      .optional()
      .nullable(),

    /** Sort order for display (0-based) */
    sortOrder: z.number().int().min(0).default(0),

    /** Additional metadata */
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) => {
      // Validate reference ID based on item type
      if (data.itemType === "plan" && !data.planId) return false;
      if (data.itemType === "addon" && !data.addonId) return false;
      if (data.itemType === "service" && !data.serviceId) return false;
      return true;
    },
    {
      message:
        "Reference ID required: planId for plan, addonId for addon, serviceId for service",
      path: ["itemType"],
    }
  )
  .refine(
    (data) => {
      // Validate percentage discount doesn't exceed 100%
      if (
        data.lineDiscountType === "percentage" &&
        data.lineDiscountValue !== null &&
        data.lineDiscountValue !== undefined &&
        data.lineDiscountValue > 100
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["lineDiscountValue"],
    }
  );

/**
 * Schema for updating an existing quote item
 *
 * All fields are optional - only provided fields will be updated.
 *
 * @example
 * ```typescript
 * const update = {
 *   quantity: 15,
 *   unitPrice: 89.99,
 * };
 * const validated = UpdateQuoteItemSchema.parse(update);
 * ```
 */
export const UpdateQuoteItemSchema = z
  .object({
    name: z
      .string()
      .min(1, "Item name is required")
      .max(200, "Item name cannot exceed 200 characters")
      .optional(),
    description: z
      .string()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional()
      .nullable(),
    sku: z
      .string()
      .max(50, "SKU cannot exceed 50 characters")
      .optional()
      .nullable(),
    quantity: z
      .number()
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .optional(),
    unitPrice: z
      .number()
      .nonnegative("Unit price cannot be negative")
      .optional(),
    lineDiscountType: discountTypeSchema.optional().nullable(),
    lineDiscountValue: z
      .number()
      .nonnegative("Discount value cannot be negative")
      .optional()
      .nullable(),
    sortOrder: z.number().int().min(0).optional(),
    recurrence: itemRecurrenceSchema.optional(),
  })
  .refine(
    (data) => {
      if (
        data.lineDiscountType === "percentage" &&
        data.lineDiscountValue !== null &&
        data.lineDiscountValue !== undefined &&
        data.lineDiscountValue > 100
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["lineDiscountValue"],
    }
  );

/**
 * Schema for adding an item to an existing quote
 *
 * Same validation as CreateQuoteItemSchema.
 */
export const AddQuoteItemSchema = CreateQuoteItemSchema;

// =============================================================================
// API SCHEMAS - Quote
// =============================================================================

/**
 * Schema for creating a new quote
 *
 * Creates a quote from an opportunity with line items.
 *
 * NOTE: provider_id and created_by are NOT included.
 * They are injected at the action layer via:
 * - getCurrentProviderId() for provider_id
 * - auth() for created_by (user ID)
 *
 * Validation rules:
 * - validUntil must be in the future
 * - validUntil must be after validFrom (if provided)
 * - At least one item is required
 * - Percentage discount cannot exceed 100%
 *
 * @example
 * ```typescript
 * const input = {
 *   opportunityId: "uuid-opportunity",
 *   validUntil: new Date("2025-03-31"),
 *   contractDurationMonths: 12,
 *   billingCycle: "month",
 *   currency: "EUR",
 *   items: [
 *     {
 *       itemType: "plan",
 *       planId: "uuid-plan",
 *       name: "FleetCore Pro",
 *       unitPrice: 99.99,
 *       quantity: 10,
 *     },
 *   ],
 * };
 * const validated = CreateQuoteSchema.parse(input);
 * ```
 */
export const CreateQuoteSchema = z
  .object({
    /** Opportunity ID this quote belongs to */
    opportunityId: z
      .string()
      .min(1, "Opportunity ID is required")
      .uuid("Invalid opportunity ID format"),

    /** Quote validity end date (must be in the future) */
    validUntil: z.coerce
      .date()
      .refine((date) => date > new Date(), "Valid until must be in the future"),

    /** Quote validity start date (defaults to now) */
    validFrom: z.coerce.date().optional(),

    /** Contract start date (can be different from quote validity) */
    contractStartDate: z.coerce.date().optional().nullable(),

    /**
     * Contract duration in months (1-120)
     *
     * Business decision: Max 120 months (10 years) as upper bound.
     * Prisma only specifies > 0, but 10+ year contracts are unrealistic.
     */
    contractDurationMonths: durationMonthsSchema.default(12),

    /** Billing cycle frequency */
    billingCycle: billingIntervalSchema.default("month"),

    /** Currency (ISO 4217) */
    currency: currencySchema.default("EUR"),

    /** Quote-level discount type */
    discountType: discountTypeSchema.optional().nullable(),

    /** Quote-level discount value */
    discountValue: z
      .number()
      .nonnegative("Discount value cannot be negative")
      .optional()
      .nullable(),

    /** Tax rate percentage (0-100) */
    taxRate: taxRateSchema.default(0),

    /** Internal notes */
    notes: z
      .string()
      .max(5000, "Notes cannot exceed 5000 characters")
      .optional()
      .nullable(),

    /** Terms and conditions text */
    termsAndConditions: z
      .string()
      .max(50000, "Terms cannot exceed 50000 characters")
      .optional()
      .nullable(),

    /** Quote line items (minimum 1) */
    items: z
      .array(CreateQuoteItemSchema)
      .min(1, "At least one item is required"),
  })
  .refine(
    (data) => {
      // validUntil must be after validFrom
      if (data.validFrom && data.validUntil <= data.validFrom) {
        return false;
      }
      return true;
    },
    {
      message: "Valid until must be after valid from",
      path: ["validUntil"],
    }
  )
  .refine(
    (data) => {
      // Percentage discount cannot exceed 100%
      if (
        data.discountType === "percentage" &&
        data.discountValue !== null &&
        data.discountValue !== undefined &&
        data.discountValue > 100
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  );

/**
 * Schema for updating an existing quote
 *
 * All fields are optional - only provided fields will be updated.
 * Quote must be in "draft" status to be updated.
 *
 * NOTE: Status cannot be changed via update - use specific actions
 * (sendQuote, acceptQuote, rejectQuote, etc.)
 *
 * @example
 * ```typescript
 * const update = {
 *   validUntil: new Date("2025-04-30"),
 *   discountType: "percentage",
 *   discountValue: 10,
 * };
 * const validated = UpdateQuoteSchema.parse(update);
 * ```
 */
export const UpdateQuoteSchema = z
  .object({
    validUntil: z.coerce.date().optional(),
    contractStartDate: z.coerce.date().optional().nullable(),
    contractDurationMonths: durationMonthsSchema.optional(),
    billingCycle: billingIntervalSchema.optional(),
    discountType: discountTypeSchema.optional().nullable(),
    discountValue: z
      .number()
      .nonnegative("Discount value cannot be negative")
      .optional()
      .nullable(),
    taxRate: taxRateSchema.optional(),
    notes: z
      .string()
      .max(5000, "Notes cannot exceed 5000 characters")
      .optional()
      .nullable(),
    termsAndConditions: z
      .string()
      .max(50000, "Terms cannot exceed 50000 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (
        data.discountType === "percentage" &&
        data.discountValue !== null &&
        data.discountValue !== undefined &&
        data.discountValue > 100
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  );

// =============================================================================
// API SCHEMAS - Quote Actions
// =============================================================================

/**
 * Schema for accepting a quote
 *
 * Used when a client accepts a quote.
 * Optional signature and acceptedBy for tracking.
 *
 * @example
 * ```typescript
 * const input = {
 *   quoteId: "uuid-quote",
 *   signature: "John Doe",
 *   acceptedBy: "john.doe@company.com",
 * };
 * const validated = AcceptQuoteSchema.parse(input);
 * ```
 */
export const AcceptQuoteSchema = z.object({
  /** Quote ID to accept */
  quoteId: z.string().uuid("Invalid quote ID"),

  /** Optional signature text */
  signature: z
    .string()
    .max(500, "Signature cannot exceed 500 characters")
    .optional()
    .nullable(),

  /** Optional accepter name/email */
  acceptedBy: z
    .string()
    .max(200, "Accepted by cannot exceed 200 characters")
    .optional()
    .nullable(),
});

/**
 * Schema for rejecting a quote
 *
 * Requires a rejection reason for tracking and analysis.
 *
 * @example
 * ```typescript
 * const input = {
 *   quoteId: "uuid-quote",
 *   rejectionReason: "Price too high, going with competitor",
 * };
 * const validated = RejectQuoteSchema.parse(input);
 * ```
 */
export const RejectQuoteSchema = z.object({
  /** Quote ID to reject */
  quoteId: z.string().uuid("Invalid quote ID"),

  /** Reason for rejection (required) */
  rejectionReason: z
    .string()
    .min(1, "Rejection reason is required")
    .max(2000, "Rejection reason cannot exceed 2000 characters"),
});

// =============================================================================
// PUBLIC ACTION SCHEMAS (Token-based, no authentication)
// =============================================================================

/**
 * Schema for accepting a quote via public token
 *
 * Used when a prospect accepts a quote from the public view page.
 * No Clerk authentication required - token provides access.
 *
 * @example
 * ```typescript
 * const input = {
 *   token: "abc123xyz...",
 *   signature: "John Doe",
 *   acceptedBy: "john.doe@company.com",
 * };
 * const validated = AcceptQuoteByTokenSchema.parse(input);
 * ```
 */
export const AcceptQuoteByTokenSchema = z.object({
  /** Public access token */
  token: z.string().min(1, "Token is required"),

  /** Optional signature text */
  signature: z
    .string()
    .max(500, "Signature cannot exceed 500 characters")
    .optional()
    .nullable(),

  /** Optional accepter name/email */
  acceptedBy: z
    .string()
    .max(200, "Accepted by cannot exceed 200 characters")
    .optional()
    .nullable(),
});

/**
 * Schema for rejecting a quote via public token
 *
 * Used when a prospect rejects a quote from the public view page.
 * No Clerk authentication required - token provides access.
 *
 * @example
 * ```typescript
 * const input = {
 *   token: "abc123xyz...",
 *   rejectionReason: "Price too high",
 * };
 * const validated = RejectQuoteByTokenSchema.parse(input);
 * ```
 */
export const RejectQuoteByTokenSchema = z.object({
  /** Public access token */
  token: z.string().min(1, "Token is required"),

  /** Reason for rejection (required) */
  rejectionReason: z
    .string()
    .min(1, "Rejection reason is required")
    .max(2000, "Rejection reason cannot exceed 2000 characters"),
});

/**
 * Schema for converting an accepted quote to an order
 *
 * Creates an order from an accepted quote.
 * Optional effectiveDate allows scheduling when the order becomes active.
 *
 * @example
 * ```typescript
 * const input = {
 *   quoteId: "uuid-quote",
 *   effectiveDate: new Date("2025-02-01"),
 *   autoRenew: true,
 * };
 * const validated = ConvertQuoteToOrderSchema.parse(input);
 * ```
 */
export const ConvertQuoteToOrderSchema = z.object({
  /** Quote ID to convert */
  quoteId: z.string().uuid("Invalid quote ID"),

  /** When the order becomes effective (defaults to now) */
  effectiveDate: z.coerce.date().optional(),

  /** Whether the order auto-renews */
  autoRenew: z.boolean().default(false),

  /** Additional notes for the order */
  notes: z
    .string()
    .max(2000, "Notes cannot exceed 2000 characters")
    .optional()
    .nullable(),
});

/**
 * Schema for viewing a quote by public token
 *
 * Used for the public quote viewing feature (Phase 6).
 * Allows clients to view quotes without authentication.
 *
 * @example
 * ```typescript
 * const input = {
 *   token: "abc123xyz...", // 64-char token
 * };
 * const validated = ViewQuoteByTokenSchema.parse(input);
 * ```
 */
export const ViewQuoteByTokenSchema = z.object({
  /** Public access token (64 chars) */
  token: z.string().min(1, "Token is required").max(64, "Invalid token format"),
});

// =============================================================================
// UI FORM SCHEMAS
// =============================================================================

/**
 * Schema for quote creation form (UI)
 *
 * Handles string inputs from form fields with transforms to proper types.
 * Use CreateQuoteSchema for API validation.
 *
 * @example
 * ```typescript
 * const formData = {
 *   opportunityId: "uuid",
 *   validUntil: "2025-03-31",
 *   contractDurationMonths: "12",
 *   taxRate: "20",
 * };
 * const validated = CreateQuoteFormSchema.parse(formData);
 * ```
 */
export const CreateQuoteFormSchema = z.object({
  opportunityId: z.string().min(1, "Opportunity is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  validFrom: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractDurationMonths: z
    .string()
    .min(1, "Duration is required")
    .transform((val) => parseInt(val, 10)),
  billingCycle: billingIntervalSchema.default("month"),
  currency: currencySchema.default("EUR"),
  discountType: z.string().optional().nullable(),
  discountValue: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  taxRate: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0)),
  notes: z.string().max(5000).optional(),
  termsAndConditions: z.string().max(50000).optional(),
});

/**
 * Schema for quote item creation form (UI)
 *
 * Handles string inputs with transforms for quantity and price.
 *
 * @example
 * ```typescript
 * const formData = {
 *   itemType: "plan",
 *   planId: "uuid",
 *   name: "FleetCore Pro",
 *   quantity: "10",
 *   unitPrice: "99.99",
 * };
 * const validated = CreateQuoteItemFormSchema.parse(formData);
 * ```
 */
export const CreateQuoteItemFormSchema = z.object({
  itemType: quoteItemTypeSchema,
  recurrence: itemRecurrenceSchema.default("recurring"),
  planId: z.string().optional(),
  addonId: z.string().optional(),
  serviceId: z.string().optional(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().max(50).optional(),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .transform((val) => parseInt(val, 10)),
  unitPrice: z
    .string()
    .min(1, "Unit price is required")
    .transform((val) => parseFloat(val.replace(/[,\s]/g, ""))),
  lineDiscountType: z.string().optional().nullable(),
  lineDiscountValue: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
});

/**
 * Schema for quote rejection form (UI)
 *
 * @example
 * ```typescript
 * const formData = {
 *   rejectionReason: "Price too high",
 * };
 * const validated = RejectQuoteFormSchema.parse(formData);
 * ```
 */
export const RejectQuoteFormSchema = z.object({
  rejectionReason: z
    .string()
    .min(1, "Please provide a reason")
    .max(2000, "Reason cannot exceed 2000 characters"),
});

/**
 * Schema for quote conversion form (UI)
 *
 * @example
 * ```typescript
 * const formData = {
 *   effectiveDate: "2025-02-01",
 *   autoRenew: true,
 * };
 * const validated = ConvertQuoteFormSchema.parse(formData);
 * ```
 */
export const ConvertQuoteFormSchema = z.object({
  effectiveDate: z.string().optional(),
  autoRenew: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

/**
 * Schema for querying/filtering quotes
 *
 * Used by GET /api/v1/crm/quotes endpoint.
 * Supports pagination, filtering, and sorting.
 *
 * @example
 * ```typescript
 * const query = {
 *   page: 1,
 *   limit: 20,
 *   status: "sent",
 *   sortBy: "created_at",
 *   sortOrder: "desc",
 * };
 * const validated = QuoteQuerySchema.parse(query);
 * ```
 */
export const QuoteQuerySchema = z.object({
  /** Page number (1-based) */
  page: z.coerce.number().int().min(1).default(1),

  /** Items per page (1-100) */
  limit: z.coerce.number().int().min(1).max(100).default(20),

  /** Filter by status */
  status: quoteStatusSchema.optional(),

  /** Filter by opportunity */
  opportunityId: z.string().uuid().optional(),

  /** Filter by currency */
  currency: currencySchema.optional(),

  /** Filter by minimum total value */
  minValue: z.coerce.number().optional(),

  /** Filter by maximum total value */
  maxValue: z.coerce.number().optional(),

  /** Filter by valid from date (on or after) */
  validFrom: z.coerce.date().optional(),

  /** Filter by valid until date (on or before) */
  validUntil: z.coerce.date().optional(),

  /** Search in quote_reference, quote_code, notes */
  search: z.string().max(100).optional(),

  /** Sort field */
  sortBy: z
    .enum([
      "created_at",
      "updated_at",
      "valid_until",
      "total_value",
      "quote_reference",
    ])
    .default("created_at"),

  /** Sort direction */
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Schema for querying quote items
 *
 * @example
 * ```typescript
 * const query = {
 *   quoteId: "uuid",
 *   itemType: "plan",
 * };
 * const validated = QuoteItemQuerySchema.parse(query);
 * ```
 */
export const QuoteItemQuerySchema = z.object({
  /** Quote ID to get items for */
  quoteId: z.string().uuid("Invalid quote ID"),

  /** Filter by item type */
  itemType: quoteItemTypeSchema.optional(),

  /** Filter by recurrence */
  recurrence: itemRecurrenceSchema.optional(),
});

// =============================================================================
// STATUS UPDATE SCHEMA
// =============================================================================

/**
 * Schema for quote status updates
 *
 * Used internally for status transition validation.
 * Use specific action schemas (AcceptQuoteSchema, RejectQuoteSchema)
 * for user-facing operations.
 *
 * @example
 * ```typescript
 * const update = {
 *   quoteId: "uuid",
 *   newStatus: "sent",
 * };
 * const validated = QuoteStatusUpdateSchema.parse(update);
 *
 * // Check if transition is valid
 * const currentStatus = "draft";
 * const isValid = VALID_STATUS_TRANSITIONS[currentStatus].includes(update.newStatus);
 * ```
 */
export const QuoteStatusUpdateSchema = z.object({
  /** Quote ID */
  quoteId: z.string().uuid("Invalid quote ID"),

  /** New status */
  newStatus: quoteStatusSchema,

  /** Optional reason for status change */
  reason: z
    .string()
    .max(2000, "Reason cannot exceed 2000 characters")
    .optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// API Types
export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
export type CreateQuoteItemInput = z.infer<typeof CreateQuoteItemSchema>;
export type UpdateQuoteInput = z.infer<typeof UpdateQuoteSchema>;
export type UpdateQuoteItemInput = z.infer<typeof UpdateQuoteItemSchema>;
export type AddQuoteItemInput = z.infer<typeof AddQuoteItemSchema>;
export type AcceptQuoteInput = z.infer<typeof AcceptQuoteSchema>;
export type RejectQuoteInput = z.infer<typeof RejectQuoteSchema>;
export type ConvertQuoteToOrderInput = z.infer<
  typeof ConvertQuoteToOrderSchema
>;
export type ViewQuoteByTokenInput = z.infer<typeof ViewQuoteByTokenSchema>;

// Public Action Types (Token-based)
export type AcceptQuoteByTokenInput = z.infer<typeof AcceptQuoteByTokenSchema>;
export type RejectQuoteByTokenInput = z.infer<typeof RejectQuoteByTokenSchema>;

// Form Types
export type CreateQuoteFormInput = z.infer<typeof CreateQuoteFormSchema>;
export type CreateQuoteItemFormInput = z.infer<
  typeof CreateQuoteItemFormSchema
>;
export type RejectQuoteFormInput = z.infer<typeof RejectQuoteFormSchema>;
export type ConvertQuoteFormInput = z.infer<typeof ConvertQuoteFormSchema>;

// Query Types
export type QuoteQueryInput = z.infer<typeof QuoteQuerySchema>;
export type QuoteItemQueryInput = z.infer<typeof QuoteItemQuerySchema>;

// Status Types
export type QuoteStatusUpdateInput = z.infer<typeof QuoteStatusUpdateSchema>;
