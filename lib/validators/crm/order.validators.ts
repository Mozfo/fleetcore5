/**
 * CRM Order Validators - Quote-to-Cash
 *
 * Zod schemas for Order validation in the Quote-to-Cash flow:
 * - CreateOrderFromOpportunitySchema: Create order from won opportunity (API)
 * - MarkAsWonFormSchema: UI form for MarkAsWonModal (string → number transforms)
 * - UpdateOrderStatusSchema: Update order status
 * - UpdateFulfillmentStatusSchema: Update fulfillment status
 *
 * Constants exported:
 * - BILLING_CYCLES: Valid billing cycle values
 * - FULFILLMENT_STATUSES: Valid fulfillment status values
 * - ORDER_TYPES: Valid order type values
 *
 * @module lib/validators/crm/order.validators
 */

import { z } from "zod";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Valid billing cycle values
 * Used in crm_orders.billing_cycle column
 */
export const BILLING_CYCLES = ["month", "year"] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

/**
 * Valid fulfillment status values
 * Used in crm_orders.fulfillment_status column (PostgreSQL ENUM)
 */
export const FULFILLMENT_STATUSES = [
  "pending",
  "ready_for_fulfillment",
  "in_progress",
  "fulfilled",
  "active",
  "cancelled",
  "expired",
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

/**
 * Valid order type values
 * Used in crm_orders.order_type column (PostgreSQL ENUM)
 */
export const ORDER_TYPES = [
  "new",
  "renewal",
  "upgrade",
  "downgrade",
  "amendment",
] as const;

export type OrderType = (typeof ORDER_TYPES)[number];

/**
 * Valid currencies (ISO 4217)
 * Most common currencies for FleetCore markets
 */
export const CURRENCIES = ["EUR", "USD", "AED", "GBP", "SAR", "QAR"] as const;

export type Currency = (typeof CURRENCIES)[number];

// =============================================================================
// API SCHEMAS
// =============================================================================

/**
 * Schema for creating an order from a won opportunity
 *
 * Used by POST /api/v1/crm/orders and OrderService.createOrderFromOpportunity()
 *
 * @example
 * ```typescript
 * const input = {
 *   opportunityId: "123e4567-e89b-12d3-a456-426614174000",
 *   totalValue: 60000,
 *   currency: "EUR",
 *   billingCycle: "monthly",
 *   effectiveDate: "2025-02-01",
 *   durationMonths: 12,
 *   autoRenew: true,
 *   noticePeriodDays: 30,
 * };
 * const validated = CreateOrderFromOpportunitySchema.parse(input);
 * ```
 */
export const CreateOrderFromOpportunitySchema = z.object({
  // Required: Opportunity reference
  opportunityId: z
    .string()
    .min(1, "Opportunity ID is required")
    .uuid("Opportunity ID must be a valid UUID"),

  // Required: Contract value
  totalValue: z
    .number()
    .positive("Total value must be positive")
    .min(100, "Total value must be at least 100"),

  // Required: Currency (defaults to EUR)
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO 4217 code")
    .transform((val) => val.toUpperCase())
    .default("EUR"),

  // Required: Billing cycle
  billingCycle: z
    .enum(BILLING_CYCLES)
    .describe(`Billing cycle must be one of: ${BILLING_CYCLES.join(", ")}`),

  // Required: Contract start date (cannot be in the past)
  effectiveDate: z.coerce.date().refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: "Effective date cannot be in the past" }
  ),

  // Required: Contract duration in months (1-120)
  durationMonths: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 month")
    .max(120, "Duration cannot exceed 120 months (10 years)"),

  // Optional: Auto-renewal
  autoRenew: z.boolean().default(false),

  // Optional: Notice period for cancellation (0-365 days)
  noticePeriodDays: z
    .number()
    .int("Notice period must be a whole number")
    .min(0, "Notice period cannot be negative")
    .max(365, "Notice period cannot exceed 365 days")
    .default(30),

  // Optional: Order type
  orderType: z.enum(ORDER_TYPES).default("new"),

  // Optional: Pre-calculated monthly value (if not provided, calculated automatically)
  monthlyValue: z.number().positive().optional(),

  // Optional: Pre-calculated annual value (if not provided, calculated automatically)
  annualValue: z.number().positive().optional(),

  // Optional: Notes
  notes: z
    .string()
    .max(2000, "Notes cannot exceed 2000 characters")
    .optional()
    .nullable(),

  // Optional: Additional metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateOrderFromOpportunityInput = z.infer<
  typeof CreateOrderFromOpportunitySchema
>;

// =============================================================================
// UI FORM SCHEMAS
// =============================================================================

/**
 * Schema for MarkAsWonModal form
 *
 * Handles string → number transformations for form inputs.
 * UI forms typically send string values that need to be coerced.
 *
 * @example
 * ```typescript
 * // Form data from UI (all strings from inputs)
 * const formData = {
 *   wonValue: "60000",
 *   billingCycle: "monthly",
 *   effectiveDate: "2025-02-01",
 *   durationMonths: "12",
 *   autoRenew: true,
 *   noticePeriodDays: "30",
 * };
 * const validated = MarkAsWonFormSchema.parse(formData);
 * // Result: { wonValue: 60000, durationMonths: 12, noticePeriodDays: 30, ... }
 * ```
 */
export const MarkAsWonFormSchema = z.object({
  // Won value (contract total) - string from input, transformed to number
  wonValue: z
    .string()
    .min(1, "Won value is required")
    .transform((val) => parseFloat(val.replace(/[,\s]/g, "")))
    .refine((val) => !isNaN(val), {
      message: "Won value must be a valid number",
    })
    .refine((val) => val >= 100, { message: "Won value must be at least 100" }),

  // Billing cycle - select dropdown
  billingCycle: z
    .enum(BILLING_CYCLES)
    .describe(`Billing cycle must be one of: ${BILLING_CYCLES.join(", ")}`),

  // Effective date - date input as string
  effectiveDate: z
    .string()
    .min(1, "Effective date is required")
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Invalid date format" }
    )
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: "Effective date cannot be in the past" }
    ),

  // Duration in months - string from input, transformed to number
  durationMonths: z
    .string()
    .min(1, "Duration is required")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), {
      message: "Duration must be a valid number",
    })
    .refine((val) => val >= 1, { message: "Duration must be at least 1 month" })
    .refine((val) => val <= 120, {
      message: "Duration cannot exceed 120 months",
    }),

  // Auto-renew checkbox
  autoRenew: z.boolean().default(false),

  // Notice period - string from input, transformed to number (default 30)
  noticePeriodDays: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 30))
    .refine((val) => !isNaN(val), {
      message: "Notice period must be a valid number",
    })
    .refine((val) => val >= 0, { message: "Notice period cannot be negative" })
    .refine((val) => val <= 365, {
      message: "Notice period cannot exceed 365 days",
    }),

  // Optional notes
  notes: z
    .string()
    .max(2000, "Notes cannot exceed 2000 characters")
    .optional()
    .nullable(),
});

export type MarkAsWonFormInput = z.infer<typeof MarkAsWonFormSchema>;

// =============================================================================
// STATUS UPDATE SCHEMAS
// =============================================================================

/**
 * Schema for updating order status
 *
 * Used by PATCH /api/v1/crm/orders/:id/status
 *
 * @example
 * ```typescript
 * const update = {
 *   orderId: "123e4567-e89b-12d3-a456-426614174000",
 *   status: "active",
 * };
 * const validated = UpdateOrderStatusSchema.parse(update);
 * ```
 */
export const UpdateOrderStatusSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .uuid("Order ID must be a valid UUID"),

  status: z
    .string()
    .min(1, "Status is required")
    .max(50, "Status cannot exceed 50 characters"),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

/**
 * Schema for updating order fulfillment status
 *
 * Used by PATCH /api/v1/crm/orders/:id/fulfillment
 *
 * Fulfillment status lifecycle:
 * pending → ready_for_fulfillment → in_progress → fulfilled → active
 *                                                           ↓
 *                                              cancelled / expired
 *
 * @example
 * ```typescript
 * const update = {
 *   orderId: "123e4567-e89b-12d3-a456-426614174000",
 *   fulfillmentStatus: "active",
 * };
 * const validated = UpdateFulfillmentStatusSchema.parse(update);
 * ```
 */
export const UpdateFulfillmentStatusSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .uuid("Order ID must be a valid UUID"),

  fulfillmentStatus: z
    .enum(FULFILLMENT_STATUSES)
    .describe(
      `Fulfillment status must be one of: ${FULFILLMENT_STATUSES.join(", ")}`
    ),
});

export type UpdateFulfillmentStatusInput = z.infer<
  typeof UpdateFulfillmentStatusSchema
>;

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

/**
 * Schema for querying/filtering orders
 *
 * Used by GET /api/v1/crm/orders
 *
 * @example
 * ```typescript
 * // Query: ?page=1&limit=20&fulfillmentStatus=active&billingCycle=monthly
 * const filters = OrderQuerySchema.parse(req.query);
 * ```
 */
export const OrderQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Sorting
  sortBy: z
    .enum([
      "created_at",
      "effective_date",
      "expiry_date",
      "total_value",
      "order_reference",
    ])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  // Filters
  status: z.string().optional(),
  fulfillmentStatus: z.enum(FULFILLMENT_STATUSES).optional(),
  orderType: z.enum(ORDER_TYPES).optional(),
  billingCycle: z.enum(BILLING_CYCLES).optional(),
  autoRenew: z.coerce.boolean().optional(),

  // Related entity filters
  opportunityId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),

  // Value range filters
  minValue: z.coerce.number().positive().optional(),
  maxValue: z.coerce.number().positive().optional(),

  // Date range filters
  effectiveDateAfter: z.coerce.date().optional(),
  effectiveDateBefore: z.coerce.date().optional(),
  expiryDateAfter: z.coerce.date().optional(),
  expiryDateBefore: z.coerce.date().optional(),

  // Expiring soon filter (days until expiry)
  expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),

  // Text search
  search: z.string().min(2).max(100).optional(),
});

export type OrderQueryInput = z.infer<typeof OrderQuerySchema>;

// =============================================================================
// CANCEL ORDER SCHEMA
// =============================================================================

/**
 * Schema for cancelling an order
 *
 * Used by POST /api/v1/crm/orders/:id/cancel
 *
 * @example
 * ```typescript
 * const cancel = {
 *   orderId: "123e4567-e89b-12d3-a456-426614174000",
 *   reason: "Customer requested cancellation",
 * };
 * const validated = CancelOrderSchema.parse(cancel);
 * ```
 */
export const CancelOrderSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .uuid("Order ID must be a valid UUID"),

  reason: z
    .string()
    .min(10, "Cancellation reason must be at least 10 characters")
    .max(500, "Cancellation reason cannot exceed 500 characters"),
});

export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
