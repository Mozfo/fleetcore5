/**
 * Order Actions Tests
 *
 * Comprehensive tests for orders.actions.ts covering:
 * - 13 Admin actions (auth, validation, service calls)
 * - Error handling (NotFoundError, ValidationError)
 * - Provider isolation
 * - Audit logging
 *
 * All actions are ADMIN-only (no public actions for orders).
 *
 * @module lib/actions/crm/__tests__/orders.actions.test.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type {
  FulfillmentStatus,
  BillingCycle,
  OrderType,
  CreateOrderFromOpportunityInput,
  OrderQueryInput,
} from "@/lib/validators/crm/order.validators";

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
  mockGetCurrentTenantId,
  mockOrderService,
  mockOrderRepository,
} = vi.hoisted(() => {
  return {
    mockAuth: vi.fn(),
    mockDb: {
      adm_audit_logs: {
        create: vi.fn(),
      },
    },
    mockGetAuditLogUuids: vi.fn(),
    mockGetCurrentTenantId: vi.fn(),
    mockOrderService: {
      createOrderFromOpportunity: vi.fn(),
      getOrderById: vi.fn(),
      getOrdersByOpportunity: vi.fn(),
      getOrdersByLead: vi.fn(),
      updateOrderStatus: vi.fn(),
      updateFulfillmentStatus: vi.fn(),
      cancelOrder: vi.fn(),
      getExpiringOrders: vi.fn(),
      getAutoRenewableOrders: vi.fn(),
      countActiveOrders: vi.fn(),
    },
    mockOrderRepository: {
      model: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

// =============================================================================
// MODULE MOCKS
// =============================================================================

// Mock Better Auth server wrapper
vi.mock("@/lib/auth/server", () => ({
  requireCrmAuth: mockAuth,
}));

// Mock Next.js cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Prisma db
vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock audit log helper
vi.mock("@/lib/utils/audit-resolver", () => ({
  getAuditLogUuids: mockGetAuditLogUuids,
}));

// Mock tenant context
vi.mock("@/lib/utils/tenant-context", () => ({
  getCurrentTenantId: mockGetCurrentTenantId,
}));

// Mock order service
vi.mock("@/lib/services/crm/order.service", () => ({
  orderService: mockOrderService,
}));

// Mock order repository
vi.mock("@/lib/repositories/crm/order.repository", () => ({
  orderRepository: mockOrderRepository,
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
}));

// Import after mocks
import {
  createOrderAction,
  updateOrderStatusAction,
  updateFulfillmentStatusAction,
  cancelOrderAction,
  activateOrderAction,
  fulfillOrderAction,
  getOrderAction,
  listOrdersAction,
  getOrdersByOpportunityAction,
  getOrdersByLeadAction,
  getOrderStatsAction,
  getExpiringOrdersAction,
  getAutoRenewableOrdersAction,
} from "../orders.actions";
import { NotFoundError, ValidationError } from "@/lib/core/errors";

// =============================================================================
// TEST CONSTANTS
// =============================================================================

const ADMIN_ORG_ID = TEST_ADMIN_ORG_ID;
const TEST_USER_ID = "user_test_123";
const TEST_TENANT_ID = "550e8400-e29b-41d4-a716-446655440001"; // Valid UUID
const TEST_TENANT_UUID = "550e8400-e29b-41d4-a716-446655440002"; // Valid UUID
const TEST_MEMBER_UUID = "550e8400-e29b-41d4-a716-446655440003"; // Valid UUID
const TEST_ORDER_ID = "550e8400-e29b-41d4-a716-446655440004"; // Valid UUID
const TEST_OPPORTUNITY_ID = "550e8400-e29b-41d4-a716-446655440005"; // Valid UUID
const TEST_LEAD_ID = "550e8400-e29b-41d4-a716-446655440006"; // Valid UUID

// =============================================================================
// MOCK DATA
// =============================================================================

const mockOrder = {
  id: TEST_ORDER_ID,
  order_reference: "ORD-2025-00001",
  order_code: "O2025-001",
  opportunity_id: TEST_OPPORTUNITY_ID,
  lead_id: TEST_LEAD_ID,
  tenant_id: TEST_TENANT_ID,
  total_value: 60000,
  monthly_value: 5000,
  annual_value: 60000,
  currency: "EUR",
  billing_cycle: "monthly" as BillingCycle,
  effective_date: new Date("2025-02-01"),
  expiry_date: new Date("2026-02-01"),
  status: "active",
  fulfillment_status: "pending" as FulfillmentStatus,
  order_type: "new" as OrderType,
  auto_renew: false,
  created_at: new Date(),
  updated_at: new Date(),
  created_by: TEST_USER_ID,
  updated_by: TEST_USER_ID,
  deleted_at: null,
};

const mockOrderWithRelations = {
  ...mockOrder,
  crm_leads: {
    id: TEST_LEAD_ID,
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    company_name: "Test Corp",
  },
  crm_opportunities_crm_orders_opportunity_idTocrm_opportunities: {
    id: TEST_OPPORTUNITY_ID,
    title: "Test Opportunity",
    stage: "won",
    status: "won",
  },
};

const mockOrderCreationResult = {
  order: mockOrder,
  opportunity: {
    id: TEST_OPPORTUNITY_ID,
    leadId: TEST_LEAD_ID,
    previousStage: "negotiation",
    newStage: "won",
    previousStatus: "active",
    newStatus: "won",
  },
  calculations: {
    monthlyValue: 5000,
    annualValue: 60000,
    expiryDate: new Date("2026-02-01"),
  },
};

// =============================================================================
// TEST HELPERS
// =============================================================================

function setupAdminAuth(): void {
  mockAuth.mockResolvedValue({ userId: TEST_USER_ID, orgId: ADMIN_ORG_ID });
  mockGetCurrentTenantId.mockResolvedValue(TEST_TENANT_ID);
  mockGetAuditLogUuids.mockResolvedValue({
    tenantUuid: TEST_TENANT_UUID,
    memberUuid: TEST_MEMBER_UUID,
  });
}

function setupNoAuth(): void {
  mockAuth.mockRejectedValue(new Error("AUTH: Not authenticated"));
}

function setupWrongOrg(): void {
  mockAuth.mockRejectedValue(
    new Error("AUTH: Not a headquarters organization")
  );
}

function setupNoProvider(): void {
  mockAuth.mockResolvedValue({ userId: TEST_USER_ID, orgId: ADMIN_ORG_ID });
  mockGetCurrentTenantId.mockResolvedValue(null);
}

function resetMocks(): void {
  mockAuth.mockClear();
  mockGetCurrentTenantId.mockClear();
  mockGetAuditLogUuids.mockClear();
  mockDb.adm_audit_logs.create.mockClear();
  Object.values(mockOrderService).forEach((fn) => fn.mockClear());
  mockOrderRepository.model.findMany.mockClear();
  mockOrderRepository.model.count.mockClear();
}

/**
 * Factory function for creating valid CreateOrderFromOpportunityInput
 * Following TypeScript best practice: explicit type annotation ensures
 * type safety without 'as const' hacks on individual properties.
 */
function createValidOrderInput(
  overrides?: Partial<CreateOrderFromOpportunityInput>
): CreateOrderFromOpportunityInput {
  return {
    opportunityId: TEST_OPPORTUNITY_ID,
    totalValue: 60000,
    currency: "EUR",
    billingCycle: "month",
    effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    durationMonths: 12,
    autoRenew: false,
    noticePeriodDays: 30,
    orderType: "new",
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe("orders.actions.ts", () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // CRUD ACTIONS
  // ===========================================================================

  describe("createOrderAction", () => {
    // Use factory function for type-safe test input (no 'as const' needed)
    const validInput = createValidOrderInput();

    it("should create an order successfully", async () => {
      setupAdminAuth();
      mockOrderService.createOrderFromOpportunity.mockResolvedValue(
        mockOrderCreationResult
      );

      const result = await createOrderAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order.id).toBe(TEST_ORDER_ID);
        expect(result.data.order.order_reference).toBe("ORD-2025-00001");
        expect(result.data.opportunity.newStage).toBe("won");
      }
      expect(mockOrderService.createOrderFromOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          opportunityId: TEST_OPPORTUNITY_ID,
          tenantId: TEST_TENANT_ID,
          userId: TEST_USER_ID,
          totalValue: 60000,
        })
      );
    });

    it("should return error when not authenticated", async () => {
      setupNoAuth();

      const result = await createOrderAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("AUTH: Not authenticated");
      }
    });

    it("should return error when not admin org", async () => {
      setupWrongOrg();

      const result = await createOrderAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("AUTH: Not a headquarters organization");
      }
    });

    it("should return error when no provider context", async () => {
      setupNoProvider();

      const result = await createOrderAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Provider context required");
      }
    });

    it("should return validation error for invalid opportunity ID", async () => {
      setupAdminAuth();

      const result = await createOrderAction({
        ...validInput,
        opportunityId: "invalid-uuid",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("UUID");
      }
    });

    it("should return validation error for low total value", async () => {
      setupAdminAuth();

      const result = await createOrderAction({
        ...validInput,
        totalValue: 50, // Below minimum 100
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("100");
      }
    });

    it("should handle NotFoundError from service", async () => {
      setupAdminAuth();
      mockOrderService.createOrderFromOpportunity.mockRejectedValue(
        new NotFoundError("Opportunity")
      );

      const result = await createOrderAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should handle ValidationError from service", async () => {
      setupAdminAuth();
      mockOrderService.createOrderFromOpportunity.mockRejectedValue(
        new ValidationError("Opportunity is already won")
      );

      const result = await createOrderAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already won");
      }
    });
  });

  // ===========================================================================
  // WORKFLOW ACTIONS
  // ===========================================================================

  describe("updateOrderStatusAction", () => {
    const validInput = {
      orderId: TEST_ORDER_ID,
      status: "active",
    };

    it("should update order status successfully", async () => {
      setupAdminAuth();
      mockOrderService.updateOrderStatus.mockResolvedValue({
        ...mockOrder,
        status: "active",
      });

      const result = await updateOrderStatusAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order.status).toBe("active");
      }
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        TEST_ORDER_ID,
        "active",
        TEST_USER_ID,
        TEST_TENANT_ID
      );
    });

    it("should return error for invalid order ID", async () => {
      setupAdminAuth();

      const result = await updateOrderStatusAction({
        orderId: "invalid-uuid",
        status: "active",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("UUID");
      }
    });

    it("should handle NotFoundError", async () => {
      setupAdminAuth();
      mockOrderService.updateOrderStatus.mockRejectedValue(
        new NotFoundError("Order")
      );

      const result = await updateOrderStatusAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });
  });

  describe("updateFulfillmentStatusAction", () => {
    const validInput = {
      orderId: TEST_ORDER_ID,
      fulfillmentStatus: "fulfilled" as FulfillmentStatus,
    };

    it("should update fulfillment status successfully", async () => {
      setupAdminAuth();
      mockOrderService.updateFulfillmentStatus.mockResolvedValue({
        ...mockOrder,
        fulfillment_status: "fulfilled" as FulfillmentStatus,
        fulfilled_at: new Date(),
      });

      const result = await updateFulfillmentStatusAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order.fulfillment_status).toBe("fulfilled");
      }
    });

    it("should return error for invalid fulfillment status", async () => {
      setupAdminAuth();

      const result = await updateFulfillmentStatusAction({
        orderId: TEST_ORDER_ID,
        fulfillmentStatus: "invalid" as FulfillmentStatus,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("cancelOrderAction", () => {
    const validInput = {
      orderId: TEST_ORDER_ID,
      reason: "Customer requested cancellation due to budget constraints",
    };

    it("should cancel order successfully", async () => {
      setupAdminAuth();
      mockOrderService.cancelOrder.mockResolvedValue({
        ...mockOrder,
        status: "cancelled",
        fulfillment_status: "cancelled" as FulfillmentStatus,
        cancelled_at: new Date(),
        cancellation_reason: validInput.reason,
      });

      const result = await cancelOrderAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order.status).toBe("cancelled");
        expect(result.order.fulfillment_status).toBe("cancelled");
      }
    });

    it("should return error for short cancellation reason", async () => {
      setupAdminAuth();

      const result = await cancelOrderAction({
        orderId: TEST_ORDER_ID,
        reason: "Short", // Less than 10 chars
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("10 characters");
      }
    });

    it("should handle ValidationError for already cancelled order", async () => {
      setupAdminAuth();
      mockOrderService.cancelOrder.mockRejectedValue(
        new ValidationError("Order is already cancelled")
      );

      const result = await cancelOrderAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already cancelled");
      }
    });
  });

  describe("activateOrderAction", () => {
    it("should activate order successfully", async () => {
      setupAdminAuth();
      mockOrderService.updateFulfillmentStatus.mockResolvedValue({
        ...mockOrder,
        fulfillment_status: "active" as FulfillmentStatus,
        activated_at: new Date(),
      });

      const result = await activateOrderAction(TEST_ORDER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order.fulfillment_status).toBe("active");
      }
      expect(mockOrderService.updateFulfillmentStatus).toHaveBeenCalledWith(
        TEST_ORDER_ID,
        "active",
        TEST_USER_ID,
        TEST_TENANT_ID
      );
    });

    it("should return error for invalid order ID", async () => {
      setupAdminAuth();

      const result = await activateOrderAction("invalid-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid order ID");
      }
    });
  });

  describe("fulfillOrderAction", () => {
    it("should fulfill order successfully", async () => {
      setupAdminAuth();
      mockOrderService.updateFulfillmentStatus.mockResolvedValue({
        ...mockOrder,
        fulfillment_status: "fulfilled" as FulfillmentStatus,
        fulfilled_at: new Date(),
      });

      const result = await fulfillOrderAction(TEST_ORDER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order.fulfillment_status).toBe("fulfilled");
      }
      expect(mockOrderService.updateFulfillmentStatus).toHaveBeenCalledWith(
        TEST_ORDER_ID,
        "fulfilled",
        TEST_USER_ID,
        TEST_TENANT_ID
      );
    });

    it("should return error for invalid order ID", async () => {
      setupAdminAuth();

      const result = await fulfillOrderAction("invalid-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid order ID");
      }
    });
  });

  // ===========================================================================
  // QUERY ACTIONS
  // ===========================================================================

  describe("getOrderAction", () => {
    it("should get order by ID", async () => {
      setupAdminAuth();
      mockOrderService.getOrderById.mockResolvedValue(mockOrderWithRelations);

      const result = await getOrderAction(TEST_ORDER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order?.id).toBe(TEST_ORDER_ID);
        expect(result.order?.crm_leads?.email).toBe("test@example.com");
      }
    });

    it("should return null for non-existent order", async () => {
      setupAdminAuth();
      mockOrderService.getOrderById.mockResolvedValue(null);

      const result = await getOrderAction(TEST_ORDER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.order).toBeNull();
      }
    });

    it("should return error for invalid order ID", async () => {
      setupAdminAuth();

      const result = await getOrderAction("invalid-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid order ID");
      }
    });
  });

  describe("listOrdersAction", () => {
    const defaultQuery: OrderQueryInput = {
      page: 1,
      limit: 20,
      sortBy: "created_at",
      sortOrder: "desc",
    };

    it("should list orders with pagination", async () => {
      setupAdminAuth();
      mockOrderRepository.model.findMany.mockResolvedValue([mockOrder]);
      mockOrderRepository.model.count.mockResolvedValue(1);

      const result = await listOrdersAction(defaultQuery);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.orders).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
        expect(result.totalPages).toBe(1);
      }
    });

    it("should filter by fulfillment status", async () => {
      setupAdminAuth();
      mockOrderRepository.model.findMany.mockResolvedValue([]);
      mockOrderRepository.model.count.mockResolvedValue(0);

      const result = await listOrdersAction({
        ...defaultQuery,
        fulfillmentStatus: "active" as FulfillmentStatus,
      });

      expect(result.success).toBe(true);
      expect(mockOrderRepository.model.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ fulfillment_status: "active" }),
        })
      );
    });

    it("should filter by order type", async () => {
      setupAdminAuth();
      mockOrderRepository.model.findMany.mockResolvedValue([]);
      mockOrderRepository.model.count.mockResolvedValue(0);

      const result = await listOrdersAction({
        ...defaultQuery,
        orderType: "renewal" as OrderType,
      });

      expect(result.success).toBe(true);
      expect(mockOrderRepository.model.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ order_type: "renewal" }),
        })
      );
    });

    it("should return validation error for invalid page", async () => {
      setupAdminAuth();

      const result = await listOrdersAction({ ...defaultQuery, page: 0 });

      expect(result.success).toBe(false);
    });
  });

  describe("getOrdersByOpportunityAction", () => {
    it("should get orders by opportunity", async () => {
      setupAdminAuth();
      mockOrderService.getOrdersByOpportunity.mockResolvedValue([mockOrder]);

      const result = await getOrdersByOpportunityAction(TEST_OPPORTUNITY_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.orders).toHaveLength(1);
        expect(result.orders[0].opportunity_id).toBe(TEST_OPPORTUNITY_ID);
      }
    });

    it("should return error for invalid opportunity ID", async () => {
      setupAdminAuth();

      const result = await getOrdersByOpportunityAction("invalid-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid opportunity ID");
      }
    });
  });

  describe("getOrdersByLeadAction", () => {
    it("should get orders by lead", async () => {
      setupAdminAuth();
      mockOrderService.getOrdersByLead.mockResolvedValue([mockOrder]);

      const result = await getOrdersByLeadAction(TEST_LEAD_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.orders).toHaveLength(1);
        expect(result.orders[0].lead_id).toBe(TEST_LEAD_ID);
      }
    });

    it("should return error for invalid lead ID", async () => {
      setupAdminAuth();

      const result = await getOrdersByLeadAction("invalid-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid lead ID");
      }
    });
  });

  describe("getOrderStatsAction", () => {
    it("should get order stats", async () => {
      setupAdminAuth();
      mockOrderService.countActiveOrders.mockResolvedValue(42);

      const result = await getOrderStatsAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.activeCount).toBe(42);
      }
    });

    it("should require authentication", async () => {
      setupNoAuth();

      const result = await getOrderStatsAction();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("AUTH: Not authenticated");
      }
    });
  });

  // ===========================================================================
  // CRON/ALERT ACTIONS
  // ===========================================================================

  describe("getExpiringOrdersAction", () => {
    it("should get expiring orders with default days", async () => {
      setupAdminAuth();
      mockOrderService.getExpiringOrders.mockResolvedValue([mockOrder]);

      const result = await getExpiringOrdersAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.orders).toHaveLength(1);
      }
      expect(mockOrderService.getExpiringOrders).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        30 // default
      );
    });

    it("should get expiring orders with custom days", async () => {
      setupAdminAuth();
      mockOrderService.getExpiringOrders.mockResolvedValue([]);

      const result = await getExpiringOrdersAction(60);

      expect(result.success).toBe(true);
      expect(mockOrderService.getExpiringOrders).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        60
      );
    });

    it("should return error for invalid days", async () => {
      setupAdminAuth();

      const result = await getExpiringOrdersAction(0); // Invalid

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid days parameter");
      }
    });
  });

  describe("getAutoRenewableOrdersAction", () => {
    it("should get auto-renewable orders", async () => {
      setupAdminAuth();
      const autoRenewableOrder = { ...mockOrder, auto_renew: true };
      mockOrderService.getAutoRenewableOrders.mockResolvedValue([
        autoRenewableOrder,
      ]);

      const result = await getAutoRenewableOrdersAction(30);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.orders).toHaveLength(1);
        expect(result.orders[0].auto_renew).toBe(true);
      }
    });

    it("should use default days when not provided", async () => {
      setupAdminAuth();
      mockOrderService.getAutoRenewableOrders.mockResolvedValue([]);

      const result = await getAutoRenewableOrdersAction();

      expect(result.success).toBe(true);
      expect(mockOrderService.getAutoRenewableOrders).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        30 // default
      );
    });
  });

  // ===========================================================================
  // AUTH PATTERNS (Cross-cutting)
  // ===========================================================================

  describe("Admin Actions Auth Patterns", () => {
    const allActions = [
      {
        name: "createOrderAction",
        fn: (): Promise<unknown> => createOrderAction(createValidOrderInput()),
      },
      {
        name: "updateOrderStatusAction",
        fn: (): Promise<unknown> =>
          updateOrderStatusAction({
            orderId: TEST_ORDER_ID,
            status: "active",
          }),
      },
      {
        name: "updateFulfillmentStatusAction",
        fn: (): Promise<unknown> =>
          updateFulfillmentStatusAction({
            orderId: TEST_ORDER_ID,
            fulfillmentStatus: "fulfilled",
          }),
      },
      {
        name: "cancelOrderAction",
        fn: (): Promise<unknown> =>
          cancelOrderAction({
            orderId: TEST_ORDER_ID,
            reason: "Customer requested cancellation for testing",
          }),
      },
      {
        name: "activateOrderAction",
        fn: (): Promise<unknown> => activateOrderAction(TEST_ORDER_ID),
      },
      {
        name: "fulfillOrderAction",
        fn: (): Promise<unknown> => fulfillOrderAction(TEST_ORDER_ID),
      },
      {
        name: "getOrderAction",
        fn: (): Promise<unknown> => getOrderAction(TEST_ORDER_ID),
      },
      {
        name: "listOrdersAction",
        fn: (): Promise<unknown> => listOrdersAction(),
      },
      {
        name: "getOrdersByOpportunityAction",
        fn: (): Promise<unknown> =>
          getOrdersByOpportunityAction(TEST_OPPORTUNITY_ID),
      },
      {
        name: "getOrdersByLeadAction",
        fn: (): Promise<unknown> => getOrdersByLeadAction(TEST_LEAD_ID),
      },
      {
        name: "getOrderStatsAction",
        fn: (): Promise<unknown> => getOrderStatsAction(),
      },
      {
        name: "getExpiringOrdersAction",
        fn: (): Promise<unknown> => getExpiringOrdersAction(),
      },
      {
        name: "getAutoRenewableOrdersAction",
        fn: (): Promise<unknown> => getAutoRenewableOrdersAction(),
      },
    ];

    for (const { name, fn } of allActions) {
      it(`${name} should require authentication`, async () => {
        setupNoAuth();
        const result = (await fn()) as { success: boolean; error?: string };
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("AUTH: Not authenticated");
        }
      });

      it(`${name} should require admin org`, async () => {
        setupWrongOrg();
        const result = (await fn()) as { success: boolean; error?: string };
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("AUTH: Not a headquarters organization");
        }
      });
    }
  });

  // ===========================================================================
  // PROVIDER ISOLATION
  // ===========================================================================

  describe("Provider Isolation", () => {
    it("createOrderAction should pass tenant_id from context to service", async () => {
      setupAdminAuth();
      mockOrderService.createOrderFromOpportunity.mockResolvedValue(
        mockOrderCreationResult
      );

      await createOrderAction(createValidOrderInput());

      expect(mockOrderService.createOrderFromOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TEST_TENANT_ID,
        })
      );
    });

    it("getOrderAction should pass tenant_id to service", async () => {
      setupAdminAuth();
      mockOrderService.getOrderById.mockResolvedValue(mockOrderWithRelations);

      await getOrderAction(TEST_ORDER_ID);

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(
        TEST_ORDER_ID,
        TEST_TENANT_ID
      );
    });
  });

  // ===========================================================================
  // AUDIT LOGGING
  // ===========================================================================

  describe("Audit Logging", () => {
    it("createOrderAction should create audit log", async () => {
      setupAdminAuth();
      mockOrderService.createOrderFromOpportunity.mockResolvedValue(
        mockOrderCreationResult
      );

      await createOrderAction(createValidOrderInput());

      expect(mockDb.adm_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenant_id: TEST_TENANT_UUID,
          member_id: TEST_MEMBER_UUID,
          entity: "crm_order",
          entity_id: TEST_ORDER_ID,
          action: "CREATE",
        }),
      });
    });

    it("cancelOrderAction should create audit log with warning severity", async () => {
      setupAdminAuth();
      mockOrderService.cancelOrder.mockResolvedValue({
        ...mockOrder,
        status: "cancelled",
        fulfillment_status: "cancelled",
      });

      await cancelOrderAction({
        orderId: TEST_ORDER_ID,
        reason: "Customer requested cancellation for testing",
      });

      expect(mockDb.adm_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entity: "crm_order",
          entity_id: TEST_ORDER_ID,
          action: "CANCEL",
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
      mockOrderService.createOrderFromOpportunity.mockResolvedValue(
        mockOrderCreationResult
      );

      await createOrderAction(createValidOrderInput());

      expect(mockDb.adm_audit_logs.create).not.toHaveBeenCalled();
    });
  });
});
