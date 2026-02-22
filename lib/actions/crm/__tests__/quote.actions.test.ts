/**
 * Quote Actions Tests
 *
 * Comprehensive tests for quote.actions.ts covering:
 * - 16 Admin actions (auth, validation, service calls)
 * - 3 Public actions (token-based, no auth)
 * - Error handling (NotFoundError, BusinessRuleError, ValidationError)
 * - Provider isolation and data integrity checks
 *
 * @module lib/actions/crm/__tests__/quote.actions.test.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Test constant for admin org ID
const TEST_ADMIN_ORG_ID = "org_admin_test";

// =============================================================================
// HOISTED MOCKS - vi.hoisted for mocks used in vi.mock factories
// Must be hoisted BEFORE vi.mock calls which are also hoisted
// =============================================================================

const {
  mockAuth,
  mockDb,
  mockGetAuditLogUuids,
  mockGetCurrentProviderId,
  mockQuoteService,
} = vi.hoisted(() => {
  // Set env var in hoisted block - this runs before module imports
  process.env.FLEETCORE_ADMIN_ORG_ID = "org_admin_test";

  return {
    mockAuth: vi.fn(),
    mockDb: {
      adm_audit_logs: {
        create: vi.fn(),
      },
    },
    mockGetAuditLogUuids: vi.fn(),
    mockGetCurrentProviderId: vi.fn(),
    mockQuoteService: {
      createQuote: vi.fn(),
      updateQuote: vi.fn(),
      deleteQuote: vi.fn(),
      sendQuote: vi.fn(),
      acceptQuote: vi.fn(),
      rejectQuote: vi.fn(),
      convertToOrder: vi.fn(),
      createNewVersion: vi.fn(),
      getQuote: vi.fn(),
      getQuoteWithItems: vi.fn(),
      getQuoteWithRelations: vi.fn(),
      listQuotes: vi.fn(),
      getQuotesByOpportunity: vi.fn(),
      getVersionHistory: vi.fn(),
      getLatestVersion: vi.fn(),
      countByStatus: vi.fn(),
      expireOverdueQuotes: vi.fn(),
      getExpiringSoonQuotes: vi.fn(),
      getQuoteByPublicToken: vi.fn(),
      markAsViewed: vi.fn(),
    },
  };
});

// =============================================================================
// MOCKS
// =============================================================================

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock database
vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock audit log UUIDs
vi.mock("@/lib/utils/audit-resolver", () => ({
  getAuditLogUuids: () => mockGetAuditLogUuids(),
}));

// Mock provider context
vi.mock("@/lib/utils/provider-context", () => ({
  getCurrentProviderId: () => mockGetCurrentProviderId(),
}));

// Mock quote service
vi.mock("@/lib/services/crm/quote.service", () => ({
  quoteService: mockQuoteService,
}));

// Mock errors - matches real signatures from lib/core/errors.ts
vi.mock("@/lib/core/errors", () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(public resource: string) {
      super(`${resource} not found`);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(
      message: string,
      public field?: string
    ) {
      super(message);
      this.name = "ValidationError";
    }
  },
  BusinessRuleError: class BusinessRuleError extends Error {
    constructor(
      message: string,
      public rule: string,
      public details?: Record<string, unknown>
    ) {
      super(message);
      this.name = "BusinessRuleError";
    }
  },
}));

// Import after mocks
import {
  createQuoteAction,
  updateQuoteAction,
  deleteQuoteAction,
  sendQuoteAction,
  convertQuoteToOrderAction,
  createQuoteVersionAction,
  getQuoteAction,
  getQuoteWithItemsAction,
  getQuoteWithRelationsAction,
  listQuotesAction,
  getQuotesByOpportunityAction,
  getVersionHistoryAction,
  getLatestVersionAction,
  getQuoteStatsAction,
  expireOverdueQuotesAction,
  getExpiringSoonQuotesAction,
  viewQuoteByTokenAction,
  acceptQuoteByTokenAction,
  rejectQuoteByTokenAction,
} from "../quote.actions";
import { NotFoundError, BusinessRuleError } from "@/lib/core/errors";

// =============================================================================
// TEST CONSTANTS
// =============================================================================

const ADMIN_ORG_ID = TEST_ADMIN_ORG_ID;
const TEST_USER_ID = "user_test_123";
const TEST_PROVIDER_ID = "550e8400-e29b-41d4-a716-446655440001"; // Valid UUID
const TEST_TENANT_UUID = "550e8400-e29b-41d4-a716-446655440002"; // Valid UUID
const TEST_MEMBER_UUID = "550e8400-e29b-41d4-a716-446655440003"; // Valid UUID
const TEST_QUOTE_ID = "550e8400-e29b-41d4-a716-446655440004"; // Valid UUID
const TEST_OPPORTUNITY_ID = "550e8400-e29b-41d4-a716-446655440005"; // Valid UUID
const TEST_ORDER_ID = "550e8400-e29b-41d4-a716-446655440006"; // Valid UUID
const TEST_PLAN_ID = "550e8400-e29b-41d4-a716-446655440007"; // Valid UUID
const TEST_PUBLIC_TOKEN =
  "public-token-64chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

// Mock quote data
const mockQuote = {
  id: TEST_QUOTE_ID,
  quote_reference: "QT-2025-001",
  quote_code: "QT001",
  quote_version: 1,
  opportunity_id: TEST_OPPORTUNITY_ID,
  provider_id: TEST_PROVIDER_ID,
  status: "draft" as const,
  currency: "EUR",
  subtotal: 1000,
  total_value: 1200,
  tax_rate: 20,
  valid_from: new Date(),
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  created_at: new Date(),
  updated_at: new Date(),
  created_by: TEST_USER_ID,
  view_count: 0,
  first_viewed_at: null,
  last_viewed_at: null,
  public_token: null,
  sent_at: null,
  accepted_at: null,
  rejected_at: null,
  expired_at: null,
  converted_at: null,
  converted_to_order_id: null,
  parent_quote_id: null,
  contract_start_date: null,
  contract_duration_months: 12,
  billing_cycle: "month",
  discount_type: null,
  discount_value: null,
  notes: null,
  terms_and_conditions: null,
  rejection_reason: null,
  deleted_at: null,
  deleted_by: null,
  deletion_reason: null,
  metadata: null,
  monthly_recurring_value: null,
  annual_recurring_value: null,
};

const mockQuoteWithItems = {
  ...mockQuote,
  crm_quote_items: [
    {
      id: "item-1",
      quote_id: TEST_QUOTE_ID,
      item_type: "plan",
      name: "FleetCore Pro",
      quantity: 10,
      unit_price: 99.99,
      line_total: 999.9,
      recurrence: "recurring",
      sort_order: 0,
    },
  ],
};

const mockOrder = {
  id: TEST_ORDER_ID,
  order_reference: "ORD-2025-001",
  order_code: "ORD001",
  total_value: 1200,
  status: "pending_signature",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Setup authenticated admin context
 */
function setupAdminAuth() {
  mockAuth.mockResolvedValue({
    userId: TEST_USER_ID,
    orgId: ADMIN_ORG_ID,
  });
  mockGetCurrentProviderId.mockResolvedValue(TEST_PROVIDER_ID);
  mockGetAuditLogUuids.mockResolvedValue({
    tenantUuid: TEST_TENANT_UUID,
    memberUuid: TEST_MEMBER_UUID,
  });
}

/**
 * Setup unauthenticated context
 */
function setupNoAuth() {
  mockAuth.mockResolvedValue({
    userId: null,
    orgId: null,
  });
}

/**
 * Setup non-admin auth (different org)
 */
function setupNonAdminAuth() {
  mockAuth.mockResolvedValue({
    userId: TEST_USER_ID,
    orgId: "org_other_company",
  });
  mockGetCurrentProviderId.mockResolvedValue(TEST_PROVIDER_ID);
}

/**
 * Setup admin auth but no provider
 */
function setupAdminNoProvider() {
  mockAuth.mockResolvedValue({
    userId: TEST_USER_ID,
    orgId: ADMIN_ORG_ID,
  });
  mockGetCurrentProviderId.mockResolvedValue(null);
}

/**
 * Reset all mocks - use mockClear to preserve mock fn implementation
 */
function resetMocks() {
  mockAuth.mockClear();
  mockGetCurrentProviderId.mockClear();
  mockGetAuditLogUuids.mockClear();
  Object.values(mockQuoteService).forEach((fn) => fn.mockClear());
  mockDb.adm_audit_logs.create.mockClear();
}

// =============================================================================
// TESTS
// =============================================================================

describe("quote.actions.ts", () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // CRUD ACTIONS
  // ===========================================================================

  describe("createQuoteAction", () => {
    const validInput = {
      opportunityId: TEST_OPPORTUNITY_ID,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      contractDurationMonths: 12,
      billingCycle: "month" as const,
      currency: "EUR" as const,
      taxRate: 20,
      items: [
        {
          itemType: "plan" as const,
          planId: TEST_PLAN_ID, // Valid UUID
          name: "FleetCore Pro",
          unitPrice: 99.99,
          quantity: 10,
          recurrence: "recurring" as const,
          sortOrder: 0,
        },
      ],
    };

    it("should create a quote successfully", async () => {
      setupAdminAuth();
      mockQuoteService.createQuote.mockResolvedValue(mockQuoteWithItems);

      const result = await createQuoteAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote.id).toBe(TEST_QUOTE_ID);
        expect(result.quote.quote_reference).toBe("QT-2025-001");
      }
      expect(mockQuoteService.createQuote).toHaveBeenCalledTimes(1);
      expect(mockDb.adm_audit_logs.create).toHaveBeenCalledTimes(1);
    });

    it("should return error when not authenticated", async () => {
      setupNoAuth();

      const result = await createQuoteAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
      expect(mockQuoteService.createQuote).not.toHaveBeenCalled();
    });

    it("should return error when not admin", async () => {
      setupNonAdminAuth();

      const result = await createQuoteAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Forbidden: Admin access required");
      }
    });

    it("should return error when no provider context", async () => {
      setupAdminNoProvider();

      const result = await createQuoteAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Provider context required");
      }
    });

    it("should return validation error for invalid opportunityId", async () => {
      setupAdminAuth();

      const invalidInput = {
        ...validInput,
        opportunityId: "not-a-uuid",
      };

      const result = await createQuoteAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid opportunity ID");
      }
    });

    it("should return validation error for empty items", async () => {
      setupAdminAuth();

      const invalidInput = {
        ...validInput,
        items: [],
      };

      const result = await createQuoteAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("At least one item is required");
      }
    });

    it("should return validation error for past validUntil", async () => {
      setupAdminAuth();

      const invalidInput = {
        ...validInput,
        validUntil: new Date(Date.now() - 1000),
      };

      const result = await createQuoteAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Valid until must be in the future");
      }
    });

    it("should handle NotFoundError from service", async () => {
      setupAdminAuth();
      mockQuoteService.createQuote.mockRejectedValue(
        new NotFoundError("Opportunity")
      );

      const result = await createQuoteAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });
  });

  describe("updateQuoteAction", () => {
    const validUpdate = {
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      discountType: "percentage" as const,
      discountValue: 10,
    };

    it("should update a quote successfully", async () => {
      setupAdminAuth();
      mockQuoteService.updateQuote.mockResolvedValue({
        ...mockQuote,
        discount_type: "percentage",
        discount_value: 10,
      });

      const result = await updateQuoteAction(TEST_QUOTE_ID, validUpdate);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote.discount_type).toBe("percentage");
      }
      expect(mockQuoteService.updateQuote).toHaveBeenCalledWith(
        TEST_QUOTE_ID,
        TEST_PROVIDER_ID,
        TEST_USER_ID,
        expect.any(Object)
      );
    });

    it("should return error for invalid quote ID", async () => {
      setupAdminAuth();

      const result = await updateQuoteAction("invalid-uuid", validUpdate);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid quote ID");
      }
    });

    it("should handle BusinessRuleError for non-draft quote", async () => {
      setupAdminAuth();
      mockQuoteService.updateQuote.mockRejectedValue(
        new BusinessRuleError(
          "Only draft quotes can be updated",
          "quote_must_be_draft"
        )
      );

      const result = await updateQuoteAction(TEST_QUOTE_ID, validUpdate);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("draft");
      }
    });

    it("should return validation error for discount > 100%", async () => {
      setupAdminAuth();

      const invalidUpdate = {
        discountType: "percentage" as const,
        discountValue: 150,
      };

      const result = await updateQuoteAction(TEST_QUOTE_ID, invalidUpdate);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("100%");
      }
    });
  });

  describe("deleteQuoteAction", () => {
    it("should delete a quote successfully", async () => {
      setupAdminAuth();
      mockQuoteService.deleteQuote.mockResolvedValue(undefined);

      const result = await deleteQuoteAction(TEST_QUOTE_ID, "Duplicate quote");

      expect(result.success).toBe(true);
      expect(mockQuoteService.deleteQuote).toHaveBeenCalledWith(
        TEST_QUOTE_ID,
        TEST_PROVIDER_ID,
        TEST_USER_ID,
        "Duplicate quote"
      );
    });

    it("should return error for invalid quote ID", async () => {
      setupAdminAuth();

      const result = await deleteQuoteAction("not-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid quote ID");
      }
    });

    it("should handle NotFoundError", async () => {
      setupAdminAuth();
      mockQuoteService.deleteQuote.mockRejectedValue(
        new NotFoundError("Quote")
      );

      const result = await deleteQuoteAction(TEST_QUOTE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should handle BusinessRuleError for non-draft", async () => {
      setupAdminAuth();
      mockQuoteService.deleteQuote.mockRejectedValue(
        new BusinessRuleError(
          "Only draft quotes can be deleted",
          "quote_must_be_draft"
        )
      );

      const result = await deleteQuoteAction(TEST_QUOTE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("draft");
      }
    });
  });

  // ===========================================================================
  // WORKFLOW ACTIONS
  // ===========================================================================

  describe("sendQuoteAction", () => {
    it("should send a quote successfully", async () => {
      setupAdminAuth();
      const sentQuote = { ...mockQuote, status: "sent", sent_at: new Date() };
      mockQuoteService.sendQuote.mockResolvedValue({
        quote: sentQuote,
        publicUrl: "/quotes/view/abc123",
        sentAt: new Date(),
      });

      const result = await sendQuoteAction(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quote.status).toBe("sent");
        expect(result.data.publicUrl).toBe("/quotes/view/abc123");
        expect(result.data.sentAt).toBeDefined();
      }
    });

    it("should return error when not authenticated", async () => {
      setupNoAuth();

      const result = await sendQuoteAction(TEST_QUOTE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("should handle BusinessRuleError for wrong status", async () => {
      setupAdminAuth();
      mockQuoteService.sendQuote.mockRejectedValue(
        new BusinessRuleError(
          "Cannot send quote in sent status",
          "quote_already_sent"
        )
      );

      const result = await sendQuoteAction(TEST_QUOTE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("send");
      }
    });
  });

  describe("convertQuoteToOrderAction", () => {
    const validInput = {
      quoteId: TEST_QUOTE_ID,
      effectiveDate: new Date(),
      autoRenew: true,
    };

    it("should convert quote to order successfully", async () => {
      setupAdminAuth();
      mockQuoteService.convertToOrder.mockResolvedValue({
        quote: { ...mockQuote, status: "converted" },
        order: mockOrder,
        convertedAt: new Date(),
      });

      const result = await convertQuoteToOrderAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quote.status).toBe("converted");
        expect(result.data.order.id).toBe(TEST_ORDER_ID);
        expect(result.data.convertedAt).toBeDefined();
      }
    });

    it("should return validation error for invalid quoteId", async () => {
      setupAdminAuth();

      const invalidInput = { ...validInput, quoteId: "bad-uuid" };

      const result = await convertQuoteToOrderAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid quote ID");
      }
    });

    it("should handle BusinessRuleError for non-accepted quote", async () => {
      setupAdminAuth();
      mockQuoteService.convertToOrder.mockRejectedValue(
        new BusinessRuleError(
          "Only accepted quotes can be converted",
          "quote_not_accepted"
        )
      );

      const result = await convertQuoteToOrderAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("accepted");
      }
    });
  });

  // ===========================================================================
  // VERSIONING ACTIONS
  // ===========================================================================

  describe("createQuoteVersionAction", () => {
    it("should create new version successfully", async () => {
      setupAdminAuth();
      const newVersion = {
        ...mockQuoteWithItems,
        id: "new-quote-id",
        quote_version: 2,
        parent_quote_id: TEST_QUOTE_ID,
      };
      mockQuoteService.createNewVersion.mockResolvedValue(newVersion);

      const result = await createQuoteVersionAction(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote.quote_version).toBe(2);
        expect(result.quote.parent_quote_id).toBe(TEST_QUOTE_ID);
      }
    });

    it("should return error for invalid quote ID", async () => {
      setupAdminAuth();

      const result = await createQuoteVersionAction("invalid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid quote ID");
      }
    });

    it("should handle NotFoundError", async () => {
      setupAdminAuth();
      mockQuoteService.createNewVersion.mockRejectedValue(
        new NotFoundError("Quote")
      );

      const result = await createQuoteVersionAction(TEST_QUOTE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });
  });

  // ===========================================================================
  // QUERY ACTIONS
  // ===========================================================================

  describe("getQuoteAction", () => {
    it("should get quote by ID", async () => {
      setupAdminAuth();
      mockQuoteService.getQuote.mockResolvedValue(mockQuote);

      const result = await getQuoteAction(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote?.id).toBe(TEST_QUOTE_ID);
      }
    });

    it("should return null for non-existent quote", async () => {
      setupAdminAuth();
      mockQuoteService.getQuote.mockResolvedValue(null);

      const result = await getQuoteAction(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote).toBeNull();
      }
    });

    it("should return error for invalid ID", async () => {
      setupAdminAuth();

      const result = await getQuoteAction("bad");

      expect(result.success).toBe(false);
    });
  });

  describe("getQuoteWithItemsAction", () => {
    it("should get quote with items", async () => {
      setupAdminAuth();
      mockQuoteService.getQuoteWithItems.mockResolvedValue(mockQuoteWithItems);

      const result = await getQuoteWithItemsAction(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote?.crm_quote_items).toHaveLength(1);
        expect(result.quote?.crm_quote_items[0].name).toBe("FleetCore Pro");
      }
    });
  });

  describe("getQuoteWithRelationsAction", () => {
    it("should get quote with all relations", async () => {
      setupAdminAuth();
      const quoteWithRelations = {
        ...mockQuoteWithItems,
        crm_opportunities: { id: TEST_OPPORTUNITY_ID, title: "Big Deal" },
      };
      mockQuoteService.getQuoteWithRelations.mockResolvedValue(
        quoteWithRelations
      );

      const result = await getQuoteWithRelationsAction(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote?.crm_opportunities?.title).toBe("Big Deal");
      }
    });
  });

  describe("listQuotesAction", () => {
    // Default query params with required fields
    const defaultQuery = {
      page: 1,
      limit: 20,
      sortBy: "created_at" as const,
      sortOrder: "desc" as const,
    };

    it("should list quotes with pagination", async () => {
      setupAdminAuth();
      mockQuoteService.listQuotes.mockResolvedValue({
        data: [mockQuote],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await listQuotesAction(defaultQuery);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quotes).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
        expect(result.totalPages).toBe(1);
      }
    });

    it("should filter by status", async () => {
      setupAdminAuth();
      mockQuoteService.listQuotes.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const result = await listQuotesAction({
        ...defaultQuery,
        status: "sent",
      });

      expect(result.success).toBe(true);
      expect(mockQuoteService.listQuotes).toHaveBeenCalledWith(
        TEST_PROVIDER_ID,
        expect.objectContaining({ status: "sent" }),
        1,
        20
      );
    });

    it("should return validation error for invalid page", async () => {
      setupAdminAuth();

      const result = await listQuotesAction({ ...defaultQuery, page: 0 });

      expect(result.success).toBe(false);
    });
  });

  describe("getQuotesByOpportunityAction", () => {
    it("should get quotes by opportunity", async () => {
      setupAdminAuth();
      mockQuoteService.getQuotesByOpportunity.mockResolvedValue([mockQuote]);

      const result = await getQuotesByOpportunityAction(TEST_OPPORTUNITY_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quotes).toHaveLength(1);
      }
    });
  });

  describe("getVersionHistoryAction", () => {
    it("should get version history", async () => {
      setupAdminAuth();
      const versions = [
        mockQuote,
        { ...mockQuote, id: "v2", quote_version: 2 },
      ];
      mockQuoteService.getVersionHistory.mockResolvedValue(versions);

      const result = await getVersionHistoryAction(TEST_QUOTE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quotes).toHaveLength(2);
      }
    });
  });

  describe("getLatestVersionAction", () => {
    it("should get latest version", async () => {
      setupAdminAuth();
      mockQuoteService.getLatestVersion.mockResolvedValue(mockQuote);

      const result = await getLatestVersionAction(TEST_OPPORTUNITY_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote?.id).toBe(TEST_QUOTE_ID);
      }
    });
  });

  describe("getQuoteStatsAction", () => {
    it("should get quote statistics", async () => {
      setupAdminAuth();
      mockQuoteService.countByStatus.mockResolvedValue({
        draft: 5,
        sent: 3,
        accepted: 2,
        converted: 1,
      });

      const result = await getQuoteStatsAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.draft).toBe(5);
        expect(result.stats.sent).toBe(3);
      }
    });
  });

  // ===========================================================================
  // CRON ACTIONS
  // ===========================================================================

  describe("expireOverdueQuotesAction", () => {
    it("should expire overdue quotes", async () => {
      setupAdminAuth();
      mockQuoteService.expireOverdueQuotes.mockResolvedValue(3);

      const result = await expireOverdueQuotesAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.expiredCount).toBe(3);
      }
    });

    it("should require admin auth", async () => {
      setupNoAuth();

      const result = await expireOverdueQuotesAction();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("getExpiringSoonQuotesAction", () => {
    it("should get quotes expiring within days", async () => {
      setupAdminAuth();
      mockQuoteService.getExpiringSoonQuotes.mockResolvedValue([mockQuote]);

      const result = await getExpiringSoonQuotesAction(7);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quotes).toHaveLength(1);
      }
      expect(mockQuoteService.getExpiringSoonQuotes).toHaveBeenCalledWith(
        TEST_PROVIDER_ID,
        7
      );
    });

    it("should use default 7 days", async () => {
      setupAdminAuth();
      mockQuoteService.getExpiringSoonQuotes.mockResolvedValue([]);

      await getExpiringSoonQuotesAction();

      expect(mockQuoteService.getExpiringSoonQuotes).toHaveBeenCalledWith(
        TEST_PROVIDER_ID,
        7
      );
    });
  });

  // ===========================================================================
  // PUBLIC ACTIONS (No Authentication)
  // ===========================================================================

  describe("viewQuoteByTokenAction (PUBLIC)", () => {
    it("should view quote by token successfully", async () => {
      // No auth setup needed - this is public
      const quoteWithProvider = {
        ...mockQuoteWithItems,
        provider_id: TEST_PROVIDER_ID,
        public_token: TEST_PUBLIC_TOKEN,
      };
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue(
        quoteWithProvider
      );
      mockQuoteService.markAsViewed.mockResolvedValue(quoteWithProvider);

      const result = await viewQuoteByTokenAction(TEST_PUBLIC_TOKEN);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote.id).toBe(TEST_QUOTE_ID);
      }
      expect(mockQuoteService.getQuoteByPublicToken).toHaveBeenCalledWith(
        TEST_PUBLIC_TOKEN
      );
      expect(mockQuoteService.markAsViewed).toHaveBeenCalledWith(
        TEST_QUOTE_ID,
        TEST_PROVIDER_ID
      );
    });

    it("should return error for empty token", async () => {
      const result = await viewQuoteByTokenAction("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Token is required");
      }
    });

    it("should return error when quote not found", async () => {
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue(null);

      const result = await viewQuoteByTokenAction(TEST_PUBLIC_TOKEN);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Quote not found or expired");
      }
    });

    it("should return error when quote has no provider_id (data integrity)", async () => {
      const quoteNoProvider = {
        ...mockQuoteWithItems,
        provider_id: null, // Data integrity issue
      };
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue(quoteNoProvider);

      const result = await viewQuoteByTokenAction(TEST_PUBLIC_TOKEN);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Quote configuration error");
      }
      // Should NOT call markAsViewed
      expect(mockQuoteService.markAsViewed).not.toHaveBeenCalled();
    });
  });

  describe("acceptQuoteByTokenAction (PUBLIC)", () => {
    it("should accept quote by token successfully", async () => {
      const quoteWithProvider = {
        ...mockQuoteWithItems,
        provider_id: TEST_PROVIDER_ID,
        status: "viewed",
      };
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue(
        quoteWithProvider
      );
      mockQuoteService.acceptQuote.mockResolvedValue({
        ...quoteWithProvider,
        status: "accepted",
        accepted_at: new Date(),
      });

      const result = await acceptQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
        signature: "John Doe",
        acceptedBy: "john@company.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote.status).toBe("accepted");
      }
      expect(mockQuoteService.acceptQuote).toHaveBeenCalledWith(
        TEST_QUOTE_ID,
        TEST_PROVIDER_ID,
        "john@company.com"
      );
    });

    it("should accept quote without optional params", async () => {
      const quoteWithProvider = {
        ...mockQuoteWithItems,
        provider_id: TEST_PROVIDER_ID,
      };
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue(
        quoteWithProvider
      );
      mockQuoteService.acceptQuote.mockResolvedValue({
        ...quoteWithProvider,
        status: "accepted",
      });

      const result = await acceptQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
      });

      expect(result.success).toBe(true);
      expect(mockQuoteService.acceptQuote).toHaveBeenCalledWith(
        TEST_QUOTE_ID,
        TEST_PROVIDER_ID,
        undefined
      );
    });

    it("should return error for empty token", async () => {
      const result = await acceptQuoteByTokenAction({ token: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Token is required");
      }
    });

    it("should return error when quote not found", async () => {
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue(null);

      const result = await acceptQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Quote not found or expired");
      }
    });

    it("should return error when quote has no provider_id", async () => {
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue({
        ...mockQuoteWithItems,
        provider_id: null,
      });

      const result = await acceptQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Quote configuration error");
      }
      expect(mockQuoteService.acceptQuote).not.toHaveBeenCalled();
    });

    it("should handle BusinessRuleError from service", async () => {
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue({
        ...mockQuoteWithItems,
        provider_id: TEST_PROVIDER_ID,
      });
      mockQuoteService.acceptQuote.mockRejectedValue(
        new BusinessRuleError(
          "Cannot accept quote in draft status",
          "quote_wrong_status"
        )
      );

      const result = await acceptQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("draft");
      }
    });
  });

  describe("rejectQuoteByTokenAction (PUBLIC)", () => {
    it("should reject quote by token successfully", async () => {
      const quoteWithProvider = {
        ...mockQuoteWithItems,
        provider_id: TEST_PROVIDER_ID,
        status: "viewed",
      };
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue(
        quoteWithProvider
      );
      mockQuoteService.rejectQuote.mockResolvedValue({
        ...quoteWithProvider,
        status: "rejected",
        rejected_at: new Date(),
        rejection_reason: "Price too high",
      });

      const result = await rejectQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
        rejectionReason: "Price too high",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.quote.status).toBe("rejected");
        expect(result.quote.rejection_reason).toBe("Price too high");
      }
      expect(mockQuoteService.rejectQuote).toHaveBeenCalledWith(
        TEST_QUOTE_ID,
        TEST_PROVIDER_ID,
        "Price too high"
      );
    });

    it("should return error for empty token", async () => {
      const result = await rejectQuoteByTokenAction({
        token: "",
        rejectionReason: "Price too high",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Token is required");
      }
    });

    it("should return validation error for missing rejection reason", async () => {
      const result = await rejectQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
        rejectionReason: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Rejection reason is required");
      }
    });

    it("should return error when quote not found", async () => {
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue(null);

      const result = await rejectQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
        rejectionReason: "Not interested",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Quote not found or expired");
      }
    });

    it("should return error when quote has no provider_id", async () => {
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue({
        ...mockQuoteWithItems,
        provider_id: null,
      });

      const result = await rejectQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
        rejectionReason: "Not interested",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Quote configuration error");
      }
      expect(mockQuoteService.rejectQuote).not.toHaveBeenCalled();
    });

    it("should handle BusinessRuleError from service", async () => {
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue({
        ...mockQuoteWithItems,
        provider_id: TEST_PROVIDER_ID,
      });
      mockQuoteService.rejectQuote.mockRejectedValue(
        new BusinessRuleError(
          "Cannot reject quote in accepted status",
          "quote_already_accepted"
        )
      );

      const result = await rejectQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
        rejectionReason: "Changed mind",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("accepted");
      }
    });
  });

  // ===========================================================================
  // AUTH PATTERNS (Cross-cutting)
  // ===========================================================================

  describe("Admin Actions Auth Patterns", () => {
    const adminActions = [
      { name: "getQuoteAction", fn: () => getQuoteAction(TEST_QUOTE_ID) },
      {
        name: "getQuoteWithItemsAction",
        fn: () => getQuoteWithItemsAction(TEST_QUOTE_ID),
      },
      {
        name: "getQuoteWithRelationsAction",
        fn: () => getQuoteWithRelationsAction(TEST_QUOTE_ID),
      },
      { name: "listQuotesAction", fn: () => listQuotesAction() },
      {
        name: "getQuotesByOpportunityAction",
        fn: () => getQuotesByOpportunityAction(TEST_OPPORTUNITY_ID),
      },
      {
        name: "getVersionHistoryAction",
        fn: () => getVersionHistoryAction(TEST_QUOTE_ID),
      },
      {
        name: "getLatestVersionAction",
        fn: () => getLatestVersionAction(TEST_OPPORTUNITY_ID),
      },
      { name: "getQuoteStatsAction", fn: () => getQuoteStatsAction() },
      {
        name: "expireOverdueQuotesAction",
        fn: () => expireOverdueQuotesAction(),
      },
      {
        name: "getExpiringSoonQuotesAction",
        fn: () => getExpiringSoonQuotesAction(7),
      },
    ];

    adminActions.forEach(({ name, fn }) => {
      it(`${name} should require authentication`, async () => {
        setupNoAuth();

        const result = await fn();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Unauthorized");
        }
      });

      it(`${name} should require admin org`, async () => {
        setupNonAdminAuth();

        const result = await fn();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Forbidden: Admin access required");
        }
      });
    });
  });

  describe("Public Actions - No Auth Required", () => {
    it("viewQuoteByTokenAction should work without auth context", async () => {
      // Simulate no auth at all (mockAuth not called)
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue({
        ...mockQuoteWithItems,
        provider_id: TEST_PROVIDER_ID,
      });
      mockQuoteService.markAsViewed.mockResolvedValue(mockQuoteWithItems);

      const result = await viewQuoteByTokenAction(TEST_PUBLIC_TOKEN);

      expect(result.success).toBe(true);
      // Auth was never checked
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it("acceptQuoteByTokenAction should work without auth context", async () => {
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue({
        ...mockQuoteWithItems,
        provider_id: TEST_PROVIDER_ID,
      });
      mockQuoteService.acceptQuote.mockResolvedValue({
        ...mockQuoteWithItems,
        status: "accepted",
      });

      const result = await acceptQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
      });

      expect(result.success).toBe(true);
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it("rejectQuoteByTokenAction should work without auth context", async () => {
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue({
        ...mockQuoteWithItems,
        provider_id: TEST_PROVIDER_ID,
      });
      mockQuoteService.rejectQuote.mockResolvedValue({
        ...mockQuoteWithItems,
        status: "rejected",
      });

      const result = await rejectQuoteByTokenAction({
        token: TEST_PUBLIC_TOKEN,
        rejectionReason: "Not needed",
      });

      expect(result.success).toBe(true);
      expect(mockAuth).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // PROVIDER ISOLATION
  // ===========================================================================

  describe("Provider Isolation", () => {
    it("createQuoteAction should pass provider_id from context to service", async () => {
      setupAdminAuth();
      mockQuoteService.createQuote.mockResolvedValue(mockQuoteWithItems);

      await createQuoteAction({
        opportunityId: TEST_OPPORTUNITY_ID,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        contractDurationMonths: 12,
        billingCycle: "month",
        currency: "EUR",
        taxRate: 20,
        items: [
          {
            itemType: "plan",
            planId: TEST_PLAN_ID, // Valid UUID
            name: "Test",
            unitPrice: 100,
            quantity: 1,
            recurrence: "recurring",
            sortOrder: 0,
          },
        ],
      });

      expect(mockQuoteService.createQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: TEST_PROVIDER_ID,
        })
      );
    });

    it("public actions should use provider_id from quote", async () => {
      const differentProviderId = "different-provider-id";
      mockQuoteService.getQuoteByPublicToken.mockResolvedValue({
        ...mockQuoteWithItems,
        provider_id: differentProviderId,
      });
      mockQuoteService.acceptQuote.mockResolvedValue({
        ...mockQuoteWithItems,
        status: "accepted",
      });

      await acceptQuoteByTokenAction({ token: TEST_PUBLIC_TOKEN });

      expect(mockQuoteService.acceptQuote).toHaveBeenCalledWith(
        TEST_QUOTE_ID,
        differentProviderId, // Uses provider from quote, not context
        undefined
      );
    });
  });

  // ===========================================================================
  // AUDIT LOGGING
  // ===========================================================================

  describe("Audit Logging", () => {
    it("createQuoteAction should create audit log", async () => {
      setupAdminAuth();
      mockQuoteService.createQuote.mockResolvedValue(mockQuoteWithItems);

      await createQuoteAction({
        opportunityId: TEST_OPPORTUNITY_ID,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        contractDurationMonths: 12,
        billingCycle: "month",
        currency: "EUR",
        taxRate: 20,
        items: [
          {
            itemType: "plan",
            planId: TEST_PLAN_ID, // Valid UUID
            name: "Test",
            unitPrice: 100,
            quantity: 1,
            recurrence: "recurring",
            sortOrder: 0,
          },
        ],
      });

      expect(mockDb.adm_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenant_id: TEST_TENANT_UUID,
          member_id: TEST_MEMBER_UUID,
          entity: "crm_quote",
          entity_id: TEST_QUOTE_ID,
          action: "CREATE",
        }),
      });
    });

    it("deleteQuoteAction should create audit log with warning severity", async () => {
      setupAdminAuth();
      mockQuoteService.deleteQuote.mockResolvedValue(undefined);

      await deleteQuoteAction(TEST_QUOTE_ID, "Duplicate");

      expect(mockDb.adm_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entity: "crm_quote",
          action: "DELETE",
          severity: "warning",
        }),
      });
    });

    it("should not create audit log if UUIDs are missing", async () => {
      setupAdminAuth();
      mockGetAuditLogUuids.mockResolvedValue({
        tenantUuid: null,
        memberUuid: null,
      });
      mockQuoteService.createQuote.mockResolvedValue(mockQuoteWithItems);

      await createQuoteAction({
        opportunityId: TEST_OPPORTUNITY_ID,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        contractDurationMonths: 12,
        billingCycle: "month",
        currency: "EUR",
        taxRate: 20,
        items: [
          {
            itemType: "plan",
            planId: TEST_PLAN_ID, // Valid UUID
            name: "Test",
            unitPrice: 100,
            quantity: 1,
            recurrence: "recurring",
            sortOrder: 0,
          },
        ],
      });

      expect(mockDb.adm_audit_logs.create).not.toHaveBeenCalled();
    });
  });
});
