import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  OrderRepository,
  type OrderWithRelations,
  type OrderCreateInput,
  type OrderUpdateInput,
} from "../order.repository";
import type { PrismaClient } from "@prisma/client";
import type { PrismaTransaction } from "@/lib/core/types";

describe("OrderRepository", () => {
  let repository: OrderRepository;
  let mockPrisma: {
    crm_orders: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      crm_orders: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    repository = new OrderRepository(mockPrisma as unknown as PrismaClient);
  });

  // ==========================================================================
  // generateOrderReference Tests
  // ==========================================================================

  describe("generateOrderReference", () => {
    it("should generate first order reference of the year (ORD-2025-00001)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue(null);

      const result = await repository.generateOrderReference(2025);

      expect(mockPrisma.crm_orders.findFirst).toHaveBeenCalledWith({
        where: {
          order_reference: { startsWith: "ORD-2025-" },
          deleted_at: null,
        },
        orderBy: { order_reference: "desc" },
        select: { order_reference: true },
      });

      expect(result).toBe("ORD-2025-00001");
    });

    it("should increment sequence number correctly (00042 → 00043)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_reference: "ORD-2025-00042",
      });

      const result = await repository.generateOrderReference(2025);

      expect(result).toBe("ORD-2025-00043");
    });

    it("should maintain 5-digit padding (00009 → 00010)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_reference: "ORD-2025-00009",
      });

      const result = await repository.generateOrderReference(2025);

      expect(result).toBe("ORD-2025-00010");
    });

    it("should handle large sequence numbers (99999 → 100000)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_reference: "ORD-2025-99999",
      });

      const result = await repository.generateOrderReference(2025);

      expect(result).toBe("ORD-2025-100000");
    });

    it("should reset sequence for new year (ORD-2026-00001)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue(null);

      const result = await repository.generateOrderReference(2026);

      expect(mockPrisma.crm_orders.findFirst).toHaveBeenCalledWith({
        where: {
          order_reference: { startsWith: "ORD-2026-" },
          deleted_at: null,
        },
        orderBy: { order_reference: "desc" },
        select: { order_reference: true },
      });

      expect(result).toBe("ORD-2026-00001");
    });

    it("should exclude soft-deleted orders from sequence calculation", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_reference: "ORD-2025-00050",
      });

      await repository.generateOrderReference(2025);

      expect(mockPrisma.crm_orders.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deleted_at: null,
        }),
        orderBy: expect.any(Object),
        select: expect.any(Object),
      });
    });

    it("should handle invalid format by restarting at 00001", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_reference: "ORD-2025-INVALID",
      });

      const result = await repository.generateOrderReference(2025);

      expect(result).toBe("ORD-2025-00001");
    });

    it("should support transaction context", async () => {
      const mockTx = {
        crm_orders: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      };

      const result = await repository.generateOrderReference(
        2025,
        mockTx as unknown as PrismaTransaction
      );

      expect(mockTx.crm_orders.findFirst).toHaveBeenCalledWith({
        where: {
          order_reference: { startsWith: "ORD-2025-" },
          deleted_at: null,
        },
        orderBy: { order_reference: "desc" },
        select: { order_reference: true },
      });

      expect(result).toBe("ORD-2025-00001");
      expect(mockPrisma.crm_orders.findFirst).not.toHaveBeenCalled();
    });

    it("should handle edge case with malformed reference (2 parts)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_reference: "ORD-2025",
      });

      const result = await repository.generateOrderReference(2025);

      expect(result).toBe("ORD-2025-00001");
    });
  });

  // ==========================================================================
  // generateOrderCode Tests
  // ==========================================================================

  describe("generateOrderCode", () => {
    it("should generate first order code of the year (O2025-001)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue(null);

      const result = await repository.generateOrderCode(2025);

      expect(mockPrisma.crm_orders.findFirst).toHaveBeenCalledWith({
        where: {
          order_code: { startsWith: "O2025-" },
          deleted_at: null,
        },
        orderBy: { order_code: "desc" },
        select: { order_code: true },
      });

      expect(result).toBe("O2025-001");
    });

    it("should increment sequence number correctly (042 → 043)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_code: "O2025-042",
      });

      const result = await repository.generateOrderCode(2025);

      expect(result).toBe("O2025-043");
    });

    it("should maintain 3-digit padding (009 → 010)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_code: "O2025-009",
      });

      const result = await repository.generateOrderCode(2025);

      expect(result).toBe("O2025-010");
    });

    it("should handle large sequence numbers (999 → 1000)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_code: "O2025-999",
      });

      const result = await repository.generateOrderCode(2025);

      expect(result).toBe("O2025-1000");
    });

    it("should reset sequence for new year (O2026-001)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue(null);

      const result = await repository.generateOrderCode(2026);

      expect(mockPrisma.crm_orders.findFirst).toHaveBeenCalledWith({
        where: {
          order_code: { startsWith: "O2026-" },
          deleted_at: null,
        },
        orderBy: { order_code: "desc" },
        select: { order_code: true },
      });

      expect(result).toBe("O2026-001");
    });

    it("should support transaction context", async () => {
      const mockTx = {
        crm_orders: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      };

      const result = await repository.generateOrderCode(
        2025,
        mockTx as unknown as PrismaTransaction
      );

      expect(mockTx.crm_orders.findFirst).toHaveBeenCalledWith({
        where: {
          order_code: { startsWith: "O2025-" },
          deleted_at: null,
        },
        orderBy: { order_code: "desc" },
        select: { order_code: true },
      });

      expect(result).toBe("O2025-001");
      expect(mockPrisma.crm_orders.findFirst).not.toHaveBeenCalled();
    });

    it("should handle invalid format by restarting at 001", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_code: "O2025-INVALID",
      });

      const result = await repository.generateOrderCode(2025);

      expect(result).toBe("O2025-001");
    });

    it("should handle edge case with malformed code (1 part)", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({
        order_code: "O2025",
      });

      const result = await repository.generateOrderCode(2025);

      expect(result).toBe("O2025-001");
    });
  });

  // ==========================================================================
  // createOrder Tests
  // ==========================================================================

  describe("createOrder", () => {
    const mockOrderInput: OrderCreateInput = {
      opportunity_id: "opp-1",
      lead_id: "lead-1",
      provider_id: "provider-1",
      total_value: 50000,
      currency: "EUR",
      effective_date: new Date("2025-01-01"),
      expiry_date: new Date("2026-01-01"),
    };

    it("should create order with auto-generated reference and code", async () => {
      mockPrisma.crm_orders.findFirst
        .mockResolvedValueOnce(null) // For generateOrderReference
        .mockResolvedValueOnce(null); // For generateOrderCode

      const mockCreatedOrder = {
        id: "order-1",
        ...mockOrderInput,
        order_reference: "ORD-2025-00001",
        order_code: "O2025-001",
        created_by: "user-1",
        updated_by: "user-1",
      };

      mockPrisma.crm_orders.create.mockResolvedValue(mockCreatedOrder);

      const result = await repository.createOrder(mockOrderInput, "user-1");

      expect(mockPrisma.crm_orders.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          opportunity_id: "opp-1",
          lead_id: "lead-1",
          provider_id: "provider-1",
          total_value: 50000,
          currency: "EUR",
          order_reference: "ORD-2025-00001",
          order_code: "O2025-001",
          created_by: "user-1",
          updated_by: "user-1",
        }),
      });

      expect(result.order_reference).toBe("ORD-2025-00001");
      expect(result.order_code).toBe("O2025-001");
    });

    it("should support transaction context for atomic creation", async () => {
      const mockTx = {
        crm_orders: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            id: "order-1",
            ...mockOrderInput,
            order_reference: "ORD-2025-00001",
            order_code: "O2025-001",
          }),
        },
      };

      await repository.createOrder(
        mockOrderInput,
        "user-1",
        mockTx as unknown as PrismaTransaction
      );

      expect(mockTx.crm_orders.create).toHaveBeenCalled();
      expect(mockPrisma.crm_orders.create).not.toHaveBeenCalled();
    });

    it("should set contract_date to current date", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue(null);
      mockPrisma.crm_orders.create.mockResolvedValue({
        id: "order-1",
        ...mockOrderInput,
      });

      await repository.createOrder(mockOrderInput, "user-1");

      const createCall = mockPrisma.crm_orders.create.mock.calls[0][0];
      expect(createCall.data.contract_date).toBeInstanceOf(Date);
    });
  });

  // ==========================================================================
  // updateOrder Tests
  // ==========================================================================

  describe("updateOrder", () => {
    const mockUpdateInput: OrderUpdateInput = {
      status: "active",
      fulfillment_status: "fulfilled",
      fulfilled_at: new Date("2025-01-15"),
    };

    it("should update order with audit trail", async () => {
      const mockUpdatedOrder = {
        id: "order-1",
        status: "active",
        fulfillment_status: "fulfilled",
        updated_by: "user-1",
      };

      mockPrisma.crm_orders.update.mockResolvedValue(mockUpdatedOrder);

      const result = await repository.updateOrder(
        "order-1",
        mockUpdateInput,
        "user-1"
      );

      expect(mockPrisma.crm_orders.update).toHaveBeenCalledWith({
        where: {
          id: "order-1",
          deleted_at: null,
        },
        data: expect.objectContaining({
          status: "active",
          fulfillment_status: "fulfilled",
          updated_by: "user-1",
          updated_at: expect.any(Date),
        }),
      });

      expect(result.status).toBe("active");
    });

    it("should filter by provider_id when provided", async () => {
      mockPrisma.crm_orders.update.mockResolvedValue({ id: "order-1" });

      await repository.updateOrder(
        "order-1",
        mockUpdateInput,
        "user-1",
        "provider-1"
      );

      expect(mockPrisma.crm_orders.update).toHaveBeenCalledWith({
        where: {
          id: "order-1",
          deleted_at: null,
          provider_id: "provider-1",
        },
        data: expect.any(Object),
      });
    });
  });

  // ==========================================================================
  // findByIdWithRelations Tests
  // ==========================================================================

  describe("findByIdWithRelations", () => {
    it("should find order with all relations", async () => {
      const mockOrder: Partial<OrderWithRelations> = {
        id: "order-1",
        order_reference: "ORD-2025-00001",
        crm_leads: {
          id: "lead-1",
          email: "contact@example.com",
          first_name: "Jean",
          last_name: "Dupont",
          company_name: "Example Corp",
        },
        crm_opportunities_crm_orders_opportunity_idTocrm_opportunities: {
          id: "opp-1",
          title: "Enterprise Deal",
          stage: "closed_won",
          status: "won",
        },
        crm_quotes: {
          id: "quote-1",
          quote_reference: "QUO-2025-00001",
          status: "converted",
        },
        crm_agreements: [
          {
            id: "agr-1",
            agreement_reference: "AGR-2025-00001",
            agreement_type: "msa",
            status: "signed",
          },
        ],
      };

      mockPrisma.crm_orders.findFirst.mockResolvedValue(mockOrder);

      const result = await repository.findByIdWithRelations("order-1");

      expect(mockPrisma.crm_orders.findFirst).toHaveBeenCalledWith({
        where: {
          id: "order-1",
          deleted_at: null,
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

      expect(result?.crm_leads?.email).toBe("contact@example.com");
      expect(result?.crm_quotes?.quote_reference).toBe("QUO-2025-00001");
      expect(result?.crm_agreements?.length).toBe(1);
    });

    it("should return null for non-existent order", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue(null);

      const result = await repository.findByIdWithRelations("non-existent");

      expect(result).toBeNull();
    });

    it("should filter by provider_id when provided", async () => {
      mockPrisma.crm_orders.findFirst.mockResolvedValue({ id: "order-1" });

      await repository.findByIdWithRelations("order-1", "provider-1");

      expect(mockPrisma.crm_orders.findFirst).toHaveBeenCalledWith({
        where: {
          id: "order-1",
          deleted_at: null,
          provider_id: "provider-1",
        },
        include: expect.any(Object),
      });
    });
  });

  // ==========================================================================
  // findByOpportunityId Tests
  // ==========================================================================

  describe("findByOpportunityId", () => {
    it("should find all orders for an opportunity", async () => {
      const mockOrders = [
        { id: "order-1", opportunity_id: "opp-1" },
        { id: "order-2", opportunity_id: "opp-1" },
      ];

      mockPrisma.crm_orders.findMany.mockResolvedValue(mockOrders);

      const result = await repository.findByOpportunityId("opp-1");

      expect(mockPrisma.crm_orders.findMany).toHaveBeenCalledWith({
        where: {
          opportunity_id: "opp-1",
          deleted_at: null,
        },
        orderBy: { created_at: "desc" },
      });

      expect(result).toHaveLength(2);
    });

    it("should filter by provider_id when provided", async () => {
      mockPrisma.crm_orders.findMany.mockResolvedValue([]);

      await repository.findByOpportunityId("opp-1", "provider-1");

      expect(mockPrisma.crm_orders.findMany).toHaveBeenCalledWith({
        where: {
          opportunity_id: "opp-1",
          deleted_at: null,
          provider_id: "provider-1",
        },
        orderBy: { created_at: "desc" },
      });
    });
  });

  // ==========================================================================
  // findByLeadId Tests
  // ==========================================================================

  describe("findByLeadId", () => {
    it("should find all orders for a lead", async () => {
      const mockOrders = [{ id: "order-1", lead_id: "lead-1" }];

      mockPrisma.crm_orders.findMany.mockResolvedValue(mockOrders);

      const result = await repository.findByLeadId("lead-1");

      expect(mockPrisma.crm_orders.findMany).toHaveBeenCalledWith({
        where: {
          lead_id: "lead-1",
          deleted_at: null,
        },
        orderBy: { created_at: "desc" },
      });

      expect(result).toHaveLength(1);
    });

    it("should filter by provider_id when provided", async () => {
      mockPrisma.crm_orders.findMany.mockResolvedValue([]);

      await repository.findByLeadId("lead-1", "provider-1");

      expect(mockPrisma.crm_orders.findMany).toHaveBeenCalledWith({
        where: {
          lead_id: "lead-1",
          deleted_at: null,
          provider_id: "provider-1",
        },
        orderBy: { created_at: "desc" },
      });
    });
  });

  // ==========================================================================
  // countActiveOrders Tests
  // ==========================================================================

  describe("countActiveOrders", () => {
    it("should count active orders excluding cancelled and expired", async () => {
      mockPrisma.crm_orders.count.mockResolvedValue(5);

      const result = await repository.countActiveOrders("provider-1");

      expect(mockPrisma.crm_orders.count).toHaveBeenCalledWith({
        where: {
          provider_id: "provider-1",
          status: "active",
          fulfillment_status: {
            notIn: ["cancelled", "expired"],
          },
          deleted_at: null,
        },
      });

      expect(result).toBe(5);
    });
  });

  // ==========================================================================
  // findExpiringWithinDays Tests
  // ==========================================================================

  describe("findExpiringWithinDays", () => {
    it("should find orders expiring within specified days", async () => {
      const mockOrders = [
        { id: "order-1", expiry_date: new Date("2025-01-15") },
        { id: "order-2", expiry_date: new Date("2025-01-20") },
      ];

      mockPrisma.crm_orders.findMany.mockResolvedValue(mockOrders);

      const result = await repository.findExpiringWithinDays("provider-1", 30);

      expect(mockPrisma.crm_orders.findMany).toHaveBeenCalledWith({
        where: {
          provider_id: "provider-1",
          expiry_date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          status: "active",
          deleted_at: null,
        },
        orderBy: { expiry_date: "asc" },
      });

      expect(result).toHaveLength(2);
    });
  });

  // ==========================================================================
  // findAutoRenewable Tests
  // ==========================================================================

  describe("findAutoRenewable", () => {
    it("should find orders eligible for auto-renewal", async () => {
      const mockOrders = [
        {
          id: "order-1",
          auto_renew: true,
          renewal_date: new Date("2025-01-15"),
        },
      ];

      mockPrisma.crm_orders.findMany.mockResolvedValue(mockOrders);

      const result = await repository.findAutoRenewable("provider-1", 30);

      expect(mockPrisma.crm_orders.findMany).toHaveBeenCalledWith({
        where: {
          provider_id: "provider-1",
          auto_renew: true,
          renewal_date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          status: "active",
          deleted_at: null,
        },
        orderBy: { renewal_date: "asc" },
      });

      expect(result).toHaveLength(1);
      expect(result[0].auto_renew).toBe(true);
    });
  });
});
