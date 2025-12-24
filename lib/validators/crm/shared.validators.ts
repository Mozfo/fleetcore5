/**
 * Shared CRM Validators
 *
 * Common constants and schemas reused across CRM validators.
 * Centralizes shared types to avoid duplication between quote.validators.ts,
 * order.validators.ts, and agreement.validators.ts.
 *
 * Exports:
 * - DISCOUNT_TYPES: Discount type enum values
 * - CURRENCIES: ISO 4217 currency codes
 * - BILLING_INTERVALS: Billing interval enum values (matches Prisma)
 * - Corresponding Zod schemas and TypeScript types
 *
 * @module lib/validators/crm/shared.validators
 */

import { z } from "zod";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Discount type values
 *
 * Maps to PostgreSQL ENUM: discount_type
 * Used in crm_quotes and crm_quote_items for discount calculations.
 *
 * @see prisma/schema.prisma enum discount_type
 *
 * @example
 * ```typescript
 * const discountType: DiscountType = "percentage"; // 10% off
 * const discountType: DiscountType = "fixed_amount"; // 100 EUR off
 * ```
 */
export const DISCOUNT_TYPES = ["percentage", "fixed_amount"] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];

/**
 * Supported currencies (ISO 4217)
 *
 * Covers FleetCore's primary markets:
 * - EUR: Europe (France, Germany, etc.)
 * - USD: United States
 * - GBP: United Kingdom
 * - CHF: Switzerland
 * - CAD: Canada
 * - AED: United Arab Emirates
 * - QAR: Qatar
 * - SAR: Saudi Arabia
 *
 * @example
 * ```typescript
 * const currency: Currency = "EUR"; // Default for EU markets
 * const currency: Currency = "AED"; // UAE market
 * ```
 */
export const CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "CAD",
  "AED",
  "QAR",
  "SAR",
] as const;

export type Currency = (typeof CURRENCIES)[number];

/**
 * Billing interval values
 *
 * Maps to PostgreSQL ENUM: billing_interval
 * Defines the frequency of recurring billing.
 *
 * Values (from Prisma schema):
 * - month: Monthly billing
 * - year: Annual billing
 *
 * NOTE: Only "month" and "year" exist in Prisma billing_interval enum.
 *
 * @see prisma/schema.prisma enum billing_interval
 *
 * @example
 * ```typescript
 * const interval: BillingInterval = "month"; // Monthly subscription
 * const interval: BillingInterval = "year"; // Annual subscription
 * ```
 */
export const BILLING_INTERVALS = ["month", "year"] as const;

export type BillingInterval = (typeof BILLING_INTERVALS)[number];

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * Schema for discount type validation
 */
export const discountTypeSchema = z.enum(DISCOUNT_TYPES);

/**
 * Schema for currency validation
 */
export const currencySchema = z.enum(CURRENCIES);

/**
 * Schema for billing interval validation
 */
export const billingIntervalSchema = z.enum(BILLING_INTERVALS);

// =============================================================================
// REUSABLE FIELD SCHEMAS
// =============================================================================

/**
 * Monetary value schema
 *
 * For amounts, prices, totals (Decimal 15,2 in PostgreSQL).
 * Must be non-negative.
 *
 * @example
 * ```typescript
 * const priceSchema = z.object({
 *   unitPrice: monetaryValueSchema,
 *   total: monetaryValueSchema,
 * });
 * ```
 */
export const monetaryValueSchema = z
  .number()
  .nonnegative("Value cannot be negative");

/**
 * Tax rate schema (0-100%)
 *
 * For tax_rate fields (Decimal 5,2 in PostgreSQL).
 * Valid range: 0% to 100%.
 *
 * @example
 * ```typescript
 * const taxSchema = z.object({
 *   taxRate: taxRateSchema.default(20), // 20% VAT
 * });
 * ```
 */
export const taxRateSchema = z
  .number()
  .min(0, "Tax rate cannot be negative")
  .max(100, "Tax rate cannot exceed 100%");

/**
 * Duration in months schema (1-120)
 *
 * For contract_duration_months fields.
 * Business constraint: Max 120 months (10 years).
 *
 * Note: PostgreSQL only has CHECK > 0. The max 120 is a business decision
 * to prevent unrealistic contract lengths.
 *
 * @example
 * ```typescript
 * const contractSchema = z.object({
 *   durationMonths: durationMonthsSchema.default(12),
 * });
 * ```
 */
export const durationMonthsSchema = z
  .number()
  .int("Duration must be a whole number")
  .min(1, "Duration must be at least 1 month")
  .max(120, "Duration cannot exceed 120 months (10 years)");

/**
 * Percentage discount value schema (0-100)
 *
 * For discount_value when discount_type is "percentage".
 * Valid range: 0% to 100%.
 */
export const percentageValueSchema = z
  .number()
  .min(0, "Percentage cannot be negative")
  .max(100, "Percentage cannot exceed 100%");
