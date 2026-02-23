/**
 * Quote Validators Tests
 *
 * Comprehensive tests for quote validation schemas.
 * Tests cover happy paths, validation errors, edge cases,
 * and Prisma ENUM alignment.
 *
 * @module lib/validators/crm/__tests__/quote.validators.test
 */

import { describe, it, expect } from "vitest";
import {
  // Constants
  QUOTE_STATUSES,
  QUOTE_ITEM_TYPES,
  ITEM_RECURRENCES,
  BILLING_INTERVALS,
  DISCOUNT_TYPES,
  CURRENCIES,
  VALID_STATUS_TRANSITIONS,
  // Base Schemas
  quoteStatusSchema,
  quoteItemTypeSchema,
  itemRecurrenceSchema,
  billingIntervalSchema,
  // API Schemas
  CreateQuoteItemSchema,
  CreateQuoteSchema,
  UpdateQuoteSchema,
  UpdateQuoteItemSchema,
  AcceptQuoteSchema,
  RejectQuoteSchema,
  ConvertQuoteToOrderSchema,
  ViewQuoteByTokenSchema,
  // Form Schemas
  CreateQuoteFormSchema,
  CreateQuoteItemFormSchema,
  RejectQuoteFormSchema,
  ConvertQuoteFormSchema,
  // Query Schemas
  QuoteQuerySchema,
  QuoteItemQuerySchema,
  // Status Schema
  QuoteStatusUpdateSchema,
} from "../quote.validators";

// =============================================================================
// HELPER DATA
// =============================================================================

const validUuid = "123e4567-e89b-12d3-a456-426614174000";
const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

const validPlanItem = {
  itemType: "plan" as const,
  planId: validUuid,
  name: "FleetCore Pro",
  unitPrice: 99.99,
  quantity: 10,
};

const validAddonItem = {
  itemType: "addon" as const,
  addonId: validUuid,
  name: "GPS Tracking",
  unitPrice: 19.99,
  quantity: 10,
};

const validServiceItem = {
  itemType: "service" as const,
  serviceId: validUuid,
  name: "Setup Service",
  unitPrice: 500,
  quantity: 1,
  recurrence: "one_time" as const,
};

const validCustomItem = {
  itemType: "custom" as const,
  name: "Custom Integration",
  unitPrice: 2000,
  quantity: 1,
};

const validQuote = {
  opportunityId: validUuid,
  validUntil: futureDate,
  items: [validPlanItem],
};

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe("Constants", () => {
  describe("QUOTE_STATUSES", () => {
    it("contains all 7 valid statuses", () => {
      expect(QUOTE_STATUSES).toHaveLength(7);
      expect(QUOTE_STATUSES).toContain("draft");
      expect(QUOTE_STATUSES).toContain("sent");
      expect(QUOTE_STATUSES).toContain("viewed");
      expect(QUOTE_STATUSES).toContain("accepted");
      expect(QUOTE_STATUSES).toContain("rejected");
      expect(QUOTE_STATUSES).toContain("expired");
      expect(QUOTE_STATUSES).toContain("converted");
    });
  });

  describe("QUOTE_ITEM_TYPES", () => {
    it("contains all 4 valid types", () => {
      expect(QUOTE_ITEM_TYPES).toHaveLength(4);
      expect(QUOTE_ITEM_TYPES).toContain("plan");
      expect(QUOTE_ITEM_TYPES).toContain("addon");
      expect(QUOTE_ITEM_TYPES).toContain("service");
      expect(QUOTE_ITEM_TYPES).toContain("custom");
    });
  });

  describe("ITEM_RECURRENCES", () => {
    it("contains both recurrence types", () => {
      expect(ITEM_RECURRENCES).toHaveLength(2);
      expect(ITEM_RECURRENCES).toContain("one_time");
      expect(ITEM_RECURRENCES).toContain("recurring");
    });
  });

  describe("BILLING_INTERVALS", () => {
    it("matches Prisma billing_interval enum exactly", () => {
      // Prisma schema.prisma:5405-5408
      // enum billing_interval { month, year }
      expect(BILLING_INTERVALS).toEqual(["month", "year"]);
    });

    it("does NOT contain incorrect values", () => {
      expect(BILLING_INTERVALS).not.toContain("monthly");
      expect(BILLING_INTERVALS).not.toContain("annual");
      expect(BILLING_INTERVALS).not.toContain("quarterly");
      expect(BILLING_INTERVALS).not.toContain("semi_annual");
    });
  });

  describe("DISCOUNT_TYPES", () => {
    it("contains percentage and fixed_amount", () => {
      expect(DISCOUNT_TYPES).toHaveLength(2);
      expect(DISCOUNT_TYPES).toContain("percentage");
      expect(DISCOUNT_TYPES).toContain("fixed_amount");
    });
  });

  describe("CURRENCIES", () => {
    it("contains valid ISO 4217 codes", () => {
      expect(CURRENCIES).toContain("EUR");
      expect(CURRENCIES).toContain("USD");
      expect(CURRENCIES).toContain("GBP");
      expect(CURRENCIES).toContain("AED");
      expect(CURRENCIES).toContain("QAR");
      expect(CURRENCIES).toContain("SAR");
    });
  });

  describe("VALID_STATUS_TRANSITIONS", () => {
    it("defines correct workflow for draft", () => {
      expect(VALID_STATUS_TRANSITIONS.draft).toEqual(["sent"]);
    });

    it("defines correct workflow for sent", () => {
      expect(VALID_STATUS_TRANSITIONS.sent).toContain("viewed");
      expect(VALID_STATUS_TRANSITIONS.sent).toContain("expired");
    });

    it("defines correct workflow for viewed", () => {
      expect(VALID_STATUS_TRANSITIONS.viewed).toContain("accepted");
      expect(VALID_STATUS_TRANSITIONS.viewed).toContain("rejected");
      expect(VALID_STATUS_TRANSITIONS.viewed).toContain("expired");
    });

    it("defines correct workflow for accepted", () => {
      expect(VALID_STATUS_TRANSITIONS.accepted).toEqual(["converted"]);
    });

    it("defines terminal states with no transitions", () => {
      expect(VALID_STATUS_TRANSITIONS.rejected).toEqual([]);
      expect(VALID_STATUS_TRANSITIONS.expired).toEqual([]);
      expect(VALID_STATUS_TRANSITIONS.converted).toEqual([]);
    });
  });
});

// =============================================================================
// BASE SCHEMAS TESTS
// =============================================================================

describe("Base Schemas", () => {
  describe("quoteStatusSchema", () => {
    it("accepts valid status 'draft'", () => {
      expect(() => quoteStatusSchema.parse("draft")).not.toThrow();
    });

    it("accepts valid status 'sent'", () => {
      expect(() => quoteStatusSchema.parse("sent")).not.toThrow();
    });

    it("accepts valid status 'converted'", () => {
      expect(() => quoteStatusSchema.parse("converted")).not.toThrow();
    });

    it("rejects invalid status", () => {
      expect(() => quoteStatusSchema.parse("invalid")).toThrow();
    });

    it("rejects empty string", () => {
      expect(() => quoteStatusSchema.parse("")).toThrow();
    });
  });

  describe("quoteItemTypeSchema", () => {
    it("accepts 'plan'", () => {
      expect(() => quoteItemTypeSchema.parse("plan")).not.toThrow();
    });

    it("accepts 'addon'", () => {
      expect(() => quoteItemTypeSchema.parse("addon")).not.toThrow();
    });

    it("accepts 'service'", () => {
      expect(() => quoteItemTypeSchema.parse("service")).not.toThrow();
    });

    it("accepts 'custom'", () => {
      expect(() => quoteItemTypeSchema.parse("custom")).not.toThrow();
    });

    it("rejects invalid type", () => {
      expect(() => quoteItemTypeSchema.parse("invalid")).toThrow();
    });
  });

  describe("billingIntervalSchema", () => {
    it("accepts 'month' (correct Prisma value)", () => {
      expect(() => billingIntervalSchema.parse("month")).not.toThrow();
    });

    it("accepts 'year' (correct Prisma value)", () => {
      expect(() => billingIntervalSchema.parse("year")).not.toThrow();
    });

    it("rejects 'quarterly' (not in Prisma enum)", () => {
      expect(() => billingIntervalSchema.parse("quarterly")).toThrow();
    });

    it("rejects 'semi_annual' (not in Prisma enum)", () => {
      expect(() => billingIntervalSchema.parse("semi_annual")).toThrow();
    });

    it("rejects 'monthly' (incorrect value)", () => {
      expect(() => billingIntervalSchema.parse("monthly")).toThrow();
    });

    it("rejects 'annual' (incorrect value)", () => {
      expect(() => billingIntervalSchema.parse("annual")).toThrow();
    });

    it("rejects 'weekly'", () => {
      expect(() => billingIntervalSchema.parse("weekly")).toThrow();
    });
  });

  describe("itemRecurrenceSchema", () => {
    it("accepts 'one_time'", () => {
      expect(() => itemRecurrenceSchema.parse("one_time")).not.toThrow();
    });

    it("accepts 'recurring'", () => {
      expect(() => itemRecurrenceSchema.parse("recurring")).not.toThrow();
    });

    it("rejects invalid recurrence", () => {
      expect(() => itemRecurrenceSchema.parse("monthly")).toThrow();
    });
  });
});

// =============================================================================
// CREATE QUOTE ITEM SCHEMA TESTS
// =============================================================================

describe("CreateQuoteItemSchema", () => {
  describe("Happy Path", () => {
    it("accepts valid plan item with planId", () => {
      const result = CreateQuoteItemSchema.parse(validPlanItem);
      expect(result.itemType).toBe("plan");
      expect(result.planId).toBe(validUuid);
    });

    it("accepts valid addon item with addonId", () => {
      const result = CreateQuoteItemSchema.parse(validAddonItem);
      expect(result.itemType).toBe("addon");
      expect(result.addonId).toBe(validUuid);
    });

    it("accepts valid service item with serviceId", () => {
      const result = CreateQuoteItemSchema.parse(validServiceItem);
      expect(result.itemType).toBe("service");
      expect(result.serviceId).toBe(validUuid);
    });

    it("accepts valid custom item without reference ID", () => {
      const result = CreateQuoteItemSchema.parse(validCustomItem);
      expect(result.itemType).toBe("custom");
      expect(result.planId).toBeUndefined();
    });

    it("accepts item with all optional fields", () => {
      const fullItem = {
        ...validPlanItem,
        description: "Full description",
        sku: "SKU-001",
        lineDiscountType: "percentage" as const,
        lineDiscountValue: 10,
        sortOrder: 5,
        metadata: { custom: "value" },
      };
      const result = CreateQuoteItemSchema.parse(fullItem);
      expect(result.description).toBe("Full description");
      expect(result.sku).toBe("SKU-001");
      expect(result.lineDiscountType).toBe("percentage");
    });

    it("applies default recurrence 'recurring'", () => {
      const result = CreateQuoteItemSchema.parse(validPlanItem);
      expect(result.recurrence).toBe("recurring");
    });

    it("applies default quantity 1", () => {
      const item = {
        itemType: "custom" as const,
        name: "Test",
        unitPrice: 100,
      };
      const result = CreateQuoteItemSchema.parse(item);
      expect(result.quantity).toBe(1);
    });

    it("applies default sortOrder 0", () => {
      const result = CreateQuoteItemSchema.parse(validPlanItem);
      expect(result.sortOrder).toBe(0);
    });
  });

  describe("Validation Errors", () => {
    it("rejects plan item without planId", () => {
      const item = {
        itemType: "plan" as const,
        name: "Test Plan",
        unitPrice: 100,
      };
      expect(() => CreateQuoteItemSchema.parse(item)).toThrow();
    });

    it("rejects addon item without addonId", () => {
      const item = {
        itemType: "addon" as const,
        name: "Test Addon",
        unitPrice: 50,
      };
      expect(() => CreateQuoteItemSchema.parse(item)).toThrow();
    });

    it("rejects service item without serviceId", () => {
      const item = {
        itemType: "service" as const,
        name: "Test Service",
        unitPrice: 200,
      };
      expect(() => CreateQuoteItemSchema.parse(item)).toThrow();
    });

    it("rejects empty name", () => {
      const item = {
        ...validCustomItem,
        name: "",
      };
      expect(() => CreateQuoteItemSchema.parse(item)).toThrow();
    });

    it("rejects name exceeding 200 chars", () => {
      const item = {
        ...validCustomItem,
        name: "x".repeat(201),
      };
      expect(() => CreateQuoteItemSchema.parse(item)).toThrow();
    });

    it("rejects negative quantity", () => {
      const item = {
        ...validCustomItem,
        quantity: -1,
      };
      expect(() => CreateQuoteItemSchema.parse(item)).toThrow();
    });

    it("rejects quantity 0", () => {
      const item = {
        ...validCustomItem,
        quantity: 0,
      };
      expect(() => CreateQuoteItemSchema.parse(item)).toThrow();
    });

    it("rejects negative unitPrice", () => {
      const item = {
        ...validCustomItem,
        unitPrice: -100,
      };
      expect(() => CreateQuoteItemSchema.parse(item)).toThrow();
    });

    it("rejects percentage discount > 100", () => {
      const item = {
        ...validCustomItem,
        lineDiscountType: "percentage" as const,
        lineDiscountValue: 101,
      };
      expect(() => CreateQuoteItemSchema.parse(item)).toThrow();
    });

    it("rejects invalid UUID for planId", () => {
      const item = {
        ...validPlanItem,
        planId: "not-a-uuid",
      };
      expect(() => CreateQuoteItemSchema.parse(item)).toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("accepts quantity 1 (minimum)", () => {
      const item = {
        ...validCustomItem,
        quantity: 1,
      };
      const result = CreateQuoteItemSchema.parse(item);
      expect(result.quantity).toBe(1);
    });

    it("accepts unitPrice 0 (free item)", () => {
      const item = {
        ...validCustomItem,
        unitPrice: 0,
      };
      const result = CreateQuoteItemSchema.parse(item);
      expect(result.unitPrice).toBe(0);
    });

    it("accepts percentage discount exactly 100", () => {
      const item = {
        ...validCustomItem,
        lineDiscountType: "percentage" as const,
        lineDiscountValue: 100,
      };
      const result = CreateQuoteItemSchema.parse(item);
      expect(result.lineDiscountValue).toBe(100);
    });

    it("handles undefined optional fields", () => {
      const item = {
        itemType: "custom" as const,
        name: "Test",
        unitPrice: 100,
      };
      const result = CreateQuoteItemSchema.parse(item);
      expect(result.description).toBeUndefined();
      expect(result.sku).toBeUndefined();
    });

    it("handles null optional fields", () => {
      const item = {
        ...validCustomItem,
        description: null,
        sku: null,
      };
      const result = CreateQuoteItemSchema.parse(item);
      expect(result.description).toBeNull();
      expect(result.sku).toBeNull();
    });
  });
});

// =============================================================================
// CREATE QUOTE SCHEMA TESTS
// =============================================================================

describe("CreateQuoteSchema", () => {
  describe("Happy Path", () => {
    it("accepts valid quote with one item", () => {
      const result = CreateQuoteSchema.parse(validQuote);
      expect(result.opportunityId).toBe(validUuid);
      expect(result.items).toHaveLength(1);
    });

    it("accepts valid quote with multiple items", () => {
      const quote = {
        ...validQuote,
        items: [
          validPlanItem,
          validAddonItem,
          validServiceItem,
          validCustomItem,
        ],
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.items).toHaveLength(4);
    });

    it("accepts quote with all optional fields", () => {
      const quote = {
        ...validQuote,
        validFrom: new Date(),
        contractStartDate: futureDate,
        contractDurationMonths: 24,
        billingCycle: "year" as const,
        currency: "USD" as const,
        discountType: "percentage" as const,
        discountValue: 10,
        taxRate: 20,
        notes: "Test notes",
        termsAndConditions: "Terms...",
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.contractDurationMonths).toBe(24);
      expect(result.billingCycle).toBe("year");
    });

    it("applies default billingCycle 'month'", () => {
      const result = CreateQuoteSchema.parse(validQuote);
      expect(result.billingCycle).toBe("month");
    });

    it("applies default currency 'EUR'", () => {
      const result = CreateQuoteSchema.parse(validQuote);
      expect(result.currency).toBe("EUR");
    });

    it("applies default contractDurationMonths 12", () => {
      const result = CreateQuoteSchema.parse(validQuote);
      expect(result.contractDurationMonths).toBe(12);
    });

    it("applies default taxRate 0", () => {
      const result = CreateQuoteSchema.parse(validQuote);
      expect(result.taxRate).toBe(0);
    });
  });

  describe("Required Fields", () => {
    it("rejects missing opportunityId", () => {
      const quote = {
        validUntil: futureDate,
        items: [validPlanItem],
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });

    it("rejects missing validUntil", () => {
      const quote = {
        opportunityId: validUuid,
        items: [validPlanItem],
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });

    it("rejects empty items array", () => {
      const quote = {
        opportunityId: validUuid,
        validUntil: futureDate,
        items: [],
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });

    it("rejects invalid opportunityId UUID", () => {
      const quote = {
        ...validQuote,
        opportunityId: "not-a-uuid",
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });
  });

  describe("Date Validations", () => {
    it("rejects validUntil in the past", () => {
      const quote = {
        ...validQuote,
        validUntil: pastDate,
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });

    it("rejects validUntil before validFrom", () => {
      const quote = {
        ...validQuote,
        validFrom: futureDate,
        validUntil: new Date(futureDate.getTime() - 1000),
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });

    it("accepts validUntil after validFrom", () => {
      const validFrom = new Date();
      const validUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const quote = {
        ...validQuote,
        validFrom,
        validUntil,
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.validFrom).toBeTruthy();
    });

    it("accepts future validUntil without validFrom", () => {
      const result = CreateQuoteSchema.parse(validQuote);
      expect(result.validFrom).toBeUndefined();
      expect(result.validUntil).toBeTruthy();
    });
  });

  describe("Discount Validations", () => {
    it("accepts percentage discount 50%", () => {
      const quote = {
        ...validQuote,
        discountType: "percentage" as const,
        discountValue: 50,
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.discountValue).toBe(50);
    });

    it("accepts percentage discount 100%", () => {
      const quote = {
        ...validQuote,
        discountType: "percentage" as const,
        discountValue: 100,
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.discountValue).toBe(100);
    });

    it("rejects percentage discount 101%", () => {
      const quote = {
        ...validQuote,
        discountType: "percentage" as const,
        discountValue: 101,
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });

    it("accepts fixed_amount discount any value", () => {
      const quote = {
        ...validQuote,
        discountType: "fixed_amount" as const,
        discountValue: 10000,
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.discountValue).toBe(10000);
    });

    it("rejects negative discount value", () => {
      const quote = {
        ...validQuote,
        discountType: "percentage" as const,
        discountValue: -10,
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });
  });

  describe("Tax Rate", () => {
    it("accepts taxRate 0", () => {
      const quote = {
        ...validQuote,
        taxRate: 0,
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.taxRate).toBe(0);
    });

    it("accepts taxRate 20", () => {
      const quote = {
        ...validQuote,
        taxRate: 20,
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.taxRate).toBe(20);
    });

    it("accepts taxRate 100", () => {
      const quote = {
        ...validQuote,
        taxRate: 100,
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.taxRate).toBe(100);
    });

    it("rejects taxRate > 100", () => {
      const quote = {
        ...validQuote,
        taxRate: 101,
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });

    it("rejects negative taxRate", () => {
      const quote = {
        ...validQuote,
        taxRate: -1,
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });
  });

  describe("Duration", () => {
    it("accepts contractDurationMonths 1", () => {
      const quote = {
        ...validQuote,
        contractDurationMonths: 1,
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.contractDurationMonths).toBe(1);
    });

    it("accepts contractDurationMonths 120", () => {
      const quote = {
        ...validQuote,
        contractDurationMonths: 120,
      };
      const result = CreateQuoteSchema.parse(quote);
      expect(result.contractDurationMonths).toBe(120);
    });

    it("rejects contractDurationMonths 0", () => {
      const quote = {
        ...validQuote,
        contractDurationMonths: 0,
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });

    it("rejects contractDurationMonths 121", () => {
      const quote = {
        ...validQuote,
        contractDurationMonths: 121,
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });

    it("rejects non-integer duration", () => {
      const quote = {
        ...validQuote,
        contractDurationMonths: 12.5,
      };
      expect(() => CreateQuoteSchema.parse(quote)).toThrow();
    });
  });
});

// =============================================================================
// UPDATE QUOTE SCHEMA TESTS
// =============================================================================

describe("UpdateQuoteSchema", () => {
  it("accepts empty object (no updates)", () => {
    const result = UpdateQuoteSchema.parse({});
    expect(result).toEqual({});
  });

  it("accepts partial update with one field", () => {
    const result = UpdateQuoteSchema.parse({ taxRate: 21 });
    expect(result.taxRate).toBe(21);
  });

  it("accepts full update with all fields", () => {
    const update = {
      validUntil: futureDate,
      contractStartDate: futureDate,
      contractDurationMonths: 24,
      billingCycle: "year" as const,
      discountType: "percentage" as const,
      discountValue: 15,
      taxRate: 19,
      notes: "Updated notes",
      termsAndConditions: "Updated terms",
    };
    const result = UpdateQuoteSchema.parse(update);
    expect(result.contractDurationMonths).toBe(24);
  });

  it("validates discount percentage <= 100", () => {
    const update = {
      discountType: "percentage" as const,
      discountValue: 101,
    };
    expect(() => UpdateQuoteSchema.parse(update)).toThrow();
  });

  it("validates taxRate 0-100", () => {
    expect(() => UpdateQuoteSchema.parse({ taxRate: 101 })).toThrow();
    expect(() => UpdateQuoteSchema.parse({ taxRate: -1 })).toThrow();
  });

  it("validates contractDurationMonths 1-120", () => {
    expect(() =>
      UpdateQuoteSchema.parse({ contractDurationMonths: 0 })
    ).toThrow();
    expect(() =>
      UpdateQuoteSchema.parse({ contractDurationMonths: 121 })
    ).toThrow();
  });

  it("accepts nullable fields", () => {
    const result = UpdateQuoteSchema.parse({
      contractStartDate: null,
      discountType: null,
      notes: null,
    });
    expect(result.contractStartDate).toBeNull();
    expect(result.discountType).toBeNull();
    expect(result.notes).toBeNull();
  });
});

// =============================================================================
// ACCEPT QUOTE SCHEMA TESTS
// =============================================================================

describe("AcceptQuoteSchema", () => {
  it("accepts valid quoteId", () => {
    const result = AcceptQuoteSchema.parse({ quoteId: validUuid });
    expect(result.quoteId).toBe(validUuid);
  });

  it("accepts quoteId with optional signature", () => {
    const result = AcceptQuoteSchema.parse({
      quoteId: validUuid,
      signature: "John Doe",
    });
    expect(result.signature).toBe("John Doe");
  });

  it("accepts quoteId with optional acceptedBy", () => {
    const result = AcceptQuoteSchema.parse({
      quoteId: validUuid,
      acceptedBy: "john.doe@company.com",
    });
    expect(result.acceptedBy).toBe("john.doe@company.com");
  });

  it("rejects invalid quoteId UUID", () => {
    expect(() => AcceptQuoteSchema.parse({ quoteId: "not-uuid" })).toThrow();
  });

  it("rejects empty quoteId", () => {
    expect(() => AcceptQuoteSchema.parse({ quoteId: "" })).toThrow();
  });

  it("rejects signature exceeding 500 chars", () => {
    const input = {
      quoteId: validUuid,
      signature: "x".repeat(501),
    };
    expect(() => AcceptQuoteSchema.parse(input)).toThrow();
  });
});

// =============================================================================
// REJECT QUOTE SCHEMA TESTS
// =============================================================================

describe("RejectQuoteSchema", () => {
  it("accepts valid rejection with reason", () => {
    const result = RejectQuoteSchema.parse({
      quoteId: validUuid,
      rejectionReason: "Price too high",
    });
    expect(result.rejectionReason).toBe("Price too high");
  });

  it("rejects missing rejectionReason", () => {
    expect(() => RejectQuoteSchema.parse({ quoteId: validUuid })).toThrow();
  });

  it("rejects empty rejectionReason", () => {
    expect(() =>
      RejectQuoteSchema.parse({ quoteId: validUuid, rejectionReason: "" })
    ).toThrow();
  });

  it("rejects rejectionReason exceeding 2000 chars", () => {
    const input = {
      quoteId: validUuid,
      rejectionReason: "x".repeat(2001),
    };
    expect(() => RejectQuoteSchema.parse(input)).toThrow();
  });

  it("rejects invalid quoteId UUID", () => {
    expect(() =>
      RejectQuoteSchema.parse({
        quoteId: "not-uuid",
        rejectionReason: "Test",
      })
    ).toThrow();
  });
});

// =============================================================================
// CONVERT QUOTE TO ORDER SCHEMA TESTS
// =============================================================================

describe("ConvertQuoteToOrderSchema", () => {
  it("accepts valid quoteId only", () => {
    const result = ConvertQuoteToOrderSchema.parse({ quoteId: validUuid });
    expect(result.quoteId).toBe(validUuid);
  });

  it("accepts with effectiveDate", () => {
    const result = ConvertQuoteToOrderSchema.parse({
      quoteId: validUuid,
      effectiveDate: futureDate,
    });
    expect(result.effectiveDate).toBeTruthy();
  });

  it("accepts with autoRenew true", () => {
    const result = ConvertQuoteToOrderSchema.parse({
      quoteId: validUuid,
      autoRenew: true,
    });
    expect(result.autoRenew).toBe(true);
  });

  it("accepts with notes", () => {
    const result = ConvertQuoteToOrderSchema.parse({
      quoteId: validUuid,
      notes: "Convert notes",
    });
    expect(result.notes).toBe("Convert notes");
  });

  it("applies default autoRenew false", () => {
    const result = ConvertQuoteToOrderSchema.parse({ quoteId: validUuid });
    expect(result.autoRenew).toBe(false);
  });

  it("rejects invalid quoteId UUID", () => {
    expect(() =>
      ConvertQuoteToOrderSchema.parse({ quoteId: "not-uuid" })
    ).toThrow();
  });
});

// =============================================================================
// VIEW QUOTE BY TOKEN SCHEMA TESTS
// =============================================================================

describe("ViewQuoteByTokenSchema", () => {
  it("accepts valid token", () => {
    const token = "abc123xyz456".repeat(5).slice(0, 64);
    const result = ViewQuoteByTokenSchema.parse({ token });
    expect(result.token).toBe(token);
  });

  it("rejects empty token", () => {
    expect(() => ViewQuoteByTokenSchema.parse({ token: "" })).toThrow();
  });

  it("rejects token exceeding 64 chars", () => {
    const token = "x".repeat(65);
    expect(() => ViewQuoteByTokenSchema.parse({ token })).toThrow();
  });
});

// =============================================================================
// FORM SCHEMAS TESTS
// =============================================================================

describe("Form Schemas", () => {
  describe("CreateQuoteFormSchema", () => {
    it("transforms string contractDurationMonths to number", () => {
      const form = {
        opportunityId: validUuid,
        validUntil: "2025-03-31",
        contractDurationMonths: "24",
      };
      const result = CreateQuoteFormSchema.parse(form);
      expect(result.contractDurationMonths).toBe(24);
      expect(typeof result.contractDurationMonths).toBe("number");
    });

    it("transforms string discountValue to number", () => {
      const form = {
        opportunityId: validUuid,
        validUntil: "2025-03-31",
        contractDurationMonths: "12",
        discountValue: "15.5",
      };
      const result = CreateQuoteFormSchema.parse(form);
      expect(result.discountValue).toBe(15.5);
    });

    it("transforms string taxRate to number", () => {
      const form = {
        opportunityId: validUuid,
        validUntil: "2025-03-31",
        contractDurationMonths: "12",
        taxRate: "20",
      };
      const result = CreateQuoteFormSchema.parse(form);
      expect(result.taxRate).toBe(20);
    });

    it("handles empty optional strings", () => {
      const form = {
        opportunityId: validUuid,
        validUntil: "2025-03-31",
        contractDurationMonths: "12",
        notes: "",
      };
      const result = CreateQuoteFormSchema.parse(form);
      expect(result.notes).toBe("");
    });
  });

  describe("CreateQuoteItemFormSchema", () => {
    it("transforms string quantity to number", () => {
      const form = {
        itemType: "custom" as const,
        name: "Test",
        quantity: "10",
        unitPrice: "99.99",
      };
      const result = CreateQuoteItemFormSchema.parse(form);
      expect(result.quantity).toBe(10);
      expect(typeof result.quantity).toBe("number");
    });

    it("transforms string unitPrice to number", () => {
      const form = {
        itemType: "custom" as const,
        name: "Test",
        quantity: "1",
        unitPrice: "99.99",
      };
      const result = CreateQuoteItemFormSchema.parse(form);
      expect(result.unitPrice).toBe(99.99);
    });

    it("handles formatted unitPrice with commas", () => {
      const form = {
        itemType: "custom" as const,
        name: "Test",
        quantity: "1",
        unitPrice: "1,234.56",
      };
      const result = CreateQuoteItemFormSchema.parse(form);
      expect(result.unitPrice).toBe(1234.56);
    });

    it("handles formatted unitPrice with spaces", () => {
      const form = {
        itemType: "custom" as const,
        name: "Test",
        quantity: "1",
        unitPrice: "1 234.56",
      };
      const result = CreateQuoteItemFormSchema.parse(form);
      expect(result.unitPrice).toBe(1234.56);
    });
  });

  describe("RejectQuoteFormSchema", () => {
    it("accepts valid rejection reason", () => {
      const result = RejectQuoteFormSchema.parse({
        rejectionReason: "Too expensive",
      });
      expect(result.rejectionReason).toBe("Too expensive");
    });

    it("rejects empty reason", () => {
      expect(() =>
        RejectQuoteFormSchema.parse({ rejectionReason: "" })
      ).toThrow();
    });
  });

  describe("ConvertQuoteFormSchema", () => {
    it("applies default autoRenew false", () => {
      const result = ConvertQuoteFormSchema.parse({});
      expect(result.autoRenew).toBe(false);
    });

    it("accepts optional fields", () => {
      const result = ConvertQuoteFormSchema.parse({
        effectiveDate: "2025-02-01",
        autoRenew: true,
        notes: "Conversion notes",
      });
      expect(result.autoRenew).toBe(true);
      expect(result.notes).toBe("Conversion notes");
    });
  });
});

// =============================================================================
// QUERY SCHEMAS TESTS
// =============================================================================

describe("QuoteQuerySchema", () => {
  it("applies default page 1", () => {
    const result = QuoteQuerySchema.parse({});
    expect(result.page).toBe(1);
  });

  it("applies default limit 20", () => {
    const result = QuoteQuerySchema.parse({});
    expect(result.limit).toBe(20);
  });

  it("applies default sortBy 'created_at'", () => {
    const result = QuoteQuerySchema.parse({});
    expect(result.sortBy).toBe("created_at");
  });

  it("applies default sortOrder 'desc'", () => {
    const result = QuoteQuerySchema.parse({});
    expect(result.sortOrder).toBe("desc");
  });

  it("coerces string page to number", () => {
    const result = QuoteQuerySchema.parse({ page: "5" });
    expect(result.page).toBe(5);
    expect(typeof result.page).toBe("number");
  });

  it("validates page >= 1", () => {
    expect(() => QuoteQuerySchema.parse({ page: 0 })).toThrow();
  });

  it("validates limit 1-100", () => {
    expect(() => QuoteQuerySchema.parse({ limit: 0 })).toThrow();
    expect(() => QuoteQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it("accepts all filter combinations", () => {
    const query = {
      page: 2,
      limit: 50,
      status: "sent" as const,
      opportunityId: validUuid,
      currency: "EUR" as const,
      minValue: 1000,
      maxValue: 10000,
      search: "test",
      sortBy: "total_value" as const,
      sortOrder: "asc" as const,
    };
    const result = QuoteQuerySchema.parse(query);
    expect(result.status).toBe("sent");
    expect(result.minValue).toBe(1000);
  });

  it("validates sortBy options", () => {
    expect(() => QuoteQuerySchema.parse({ sortBy: "invalid" })).toThrow();
  });
});

describe("QuoteItemQuerySchema", () => {
  it("requires quoteId", () => {
    expect(() => QuoteItemQuerySchema.parse({})).toThrow();
  });

  it("accepts valid quoteId", () => {
    const result = QuoteItemQuerySchema.parse({ quoteId: validUuid });
    expect(result.quoteId).toBe(validUuid);
  });

  it("accepts optional filters", () => {
    const result = QuoteItemQuerySchema.parse({
      quoteId: validUuid,
      itemType: "plan" as const,
      recurrence: "recurring" as const,
    });
    expect(result.itemType).toBe("plan");
    expect(result.recurrence).toBe("recurring");
  });
});

// =============================================================================
// STATUS UPDATE SCHEMA TESTS
// =============================================================================

describe("QuoteStatusUpdateSchema", () => {
  it("accepts valid status update", () => {
    const result = QuoteStatusUpdateSchema.parse({
      quoteId: validUuid,
      newStatus: "sent",
    });
    expect(result.newStatus).toBe("sent");
  });

  it("accepts optional reason", () => {
    const result = QuoteStatusUpdateSchema.parse({
      quoteId: validUuid,
      newStatus: "expired",
      reason: "Validity period ended",
    });
    expect(result.reason).toBe("Validity period ended");
  });

  it("rejects invalid status", () => {
    expect(() =>
      QuoteStatusUpdateSchema.parse({
        quoteId: validUuid,
        newStatus: "invalid",
      })
    ).toThrow();
  });
});

// =============================================================================
// PRISMA ENUM ALIGNMENT TESTS
// =============================================================================

describe("Prisma ENUM alignment", () => {
  it("BILLING_INTERVALS matches Prisma billing_interval enum exactly", () => {
    // Prisma schema.prisma:5405-5408
    // enum billing_interval { month, year }
    expect(BILLING_INTERVALS).toEqual(["month", "year"]);
  });

  it("billingIntervalSchema accepts 'month' (not 'monthly')", () => {
    expect(() => billingIntervalSchema.parse("month")).not.toThrow();
    expect(() => billingIntervalSchema.parse("monthly")).toThrow();
  });

  it("billingIntervalSchema accepts 'year' (not 'annual')", () => {
    expect(() => billingIntervalSchema.parse("year")).not.toThrow();
    expect(() => billingIntervalSchema.parse("annual")).toThrow();
  });

  it("QUOTE_STATUSES matches Prisma quote_status enum", () => {
    expect(QUOTE_STATUSES).toEqual([
      "draft",
      "sent",
      "viewed",
      "accepted",
      "rejected",
      "expired",
      "converted",
    ]);
  });

  it("QUOTE_ITEM_TYPES matches Prisma quote_item_type enum", () => {
    expect(QUOTE_ITEM_TYPES).toEqual(["plan", "addon", "service", "custom"]);
  });

  it("ITEM_RECURRENCES matches Prisma item_recurrence enum", () => {
    expect(ITEM_RECURRENCES).toEqual(["one_time", "recurring"]);
  });

  it("DISCOUNT_TYPES matches Prisma discount_type enum", () => {
    expect(DISCOUNT_TYPES).toEqual(["percentage", "fixed_amount"]);
  });
});

// =============================================================================
// TENANT ID PATTERN TESTS
// =============================================================================

describe("Tenant ID pattern", () => {
  it("CreateQuoteSchema does NOT include tenantId field", () => {
    // tenantId is injected via auth context at action layer
    const schema = CreateQuoteSchema;
    const result = schema.parse(validQuote);

    // The result should not have tenantId
    expect("tenantId" in result).toBe(false);
  });

  it("CreateQuoteSchema does NOT include createdBy field", () => {
    // createdBy is injected via auth() at action layer
    const schema = CreateQuoteSchema;
    const result = schema.parse(validQuote);

    // The result should not have createdBy
    expect("createdBy" in result).toBe(false);
  });

  it("accepts quote without tenantId in input", () => {
    // Should not require tenantId
    const quote = {
      opportunityId: validUuid,
      validUntil: futureDate,
      items: [validPlanItem],
    };
    expect(() => CreateQuoteSchema.parse(quote)).not.toThrow();
  });
});

// =============================================================================
// UPDATE QUOTE ITEM SCHEMA TESTS
// =============================================================================

describe("UpdateQuoteItemSchema", () => {
  it("accepts empty update", () => {
    const result = UpdateQuoteItemSchema.parse({});
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("accepts partial update", () => {
    const result = UpdateQuoteItemSchema.parse({
      quantity: 20,
      unitPrice: 79.99,
    });
    expect(result.quantity).toBe(20);
    expect(result.unitPrice).toBe(79.99);
  });

  it("validates percentage discount <= 100", () => {
    expect(() =>
      UpdateQuoteItemSchema.parse({
        lineDiscountType: "percentage",
        lineDiscountValue: 101,
      })
    ).toThrow();
  });

  it("accepts valid percentage discount", () => {
    const result = UpdateQuoteItemSchema.parse({
      lineDiscountType: "percentage",
      lineDiscountValue: 50,
    });
    expect(result.lineDiscountValue).toBe(50);
  });
});
