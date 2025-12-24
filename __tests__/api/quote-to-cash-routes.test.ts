/**
 * Quote-to-Cash API Routes Integration Tests
 *
 * Lightweight integration tests for all Quote-to-Cash API routes.
 * Tests verify:
 * 1. Correct HTTP status codes
 * 2. Actions are called with correct parameters
 * 3. Response format is correct
 *
 * All actions are mocked - no real database calls.
 *
 * @module __tests__/api/quote-to-cash-routes.test.ts
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock quote actions
vi.mock("@/lib/actions/crm/quote.actions", () => ({
  listQuotesAction: vi.fn(),
  createQuoteAction: vi.fn(),
  getQuoteWithRelationsAction: vi.fn(),
  updateQuoteAction: vi.fn(),
  deleteQuoteAction: vi.fn(),
  sendQuoteAction: vi.fn(),
  convertQuoteToOrderAction: vi.fn(),
  createQuoteVersionAction: vi.fn(),
  getQuoteStatsAction: vi.fn(),
  viewQuoteByTokenAction: vi.fn(),
  acceptQuoteByTokenAction: vi.fn(),
  rejectQuoteByTokenAction: vi.fn(),
}));

// Mock order actions
vi.mock("@/lib/actions/crm/orders.actions", () => ({
  listOrdersAction: vi.fn(),
  createOrderAction: vi.fn(),
  getOrderAction: vi.fn(),
  updateOrderStatusAction: vi.fn(),
  fulfillOrderAction: vi.fn(),
  cancelOrderAction: vi.fn(),
  getOrderStatsAction: vi.fn(),
}));

// Mock agreement actions
vi.mock("@/lib/actions/crm/agreements.actions", () => ({
  listAgreementsAction: vi.fn(),
  createAgreementAction: vi.fn(),
  getAgreementWithRelationsAction: vi.fn(),
  updateAgreementAction: vi.fn(),
  deleteAgreementAction: vi.fn(),
  sendForSignatureAction: vi.fn(),
  recordClientSignatureAction: vi.fn(),
  recordProviderSignatureAction: vi.fn(),
  activateAgreementAction: vi.fn(),
  terminateAgreementAction: vi.fn(),
  createNewVersionAction: vi.fn(),
  getAgreementStatsAction: vi.fn(),
}));

// Import actions after mocking
import {
  listQuotesAction,
  createQuoteAction,
  getQuoteWithRelationsAction,
  updateQuoteAction,
  deleteQuoteAction,
  sendQuoteAction,
  convertQuoteToOrderAction,
  createQuoteVersionAction,
  getQuoteStatsAction,
  viewQuoteByTokenAction,
  acceptQuoteByTokenAction,
  rejectQuoteByTokenAction,
} from "@/lib/actions/crm/quote.actions";

import {
  listOrdersAction,
  createOrderAction,
  getOrderAction,
  updateOrderStatusAction,
  fulfillOrderAction,
  cancelOrderAction,
  getOrderStatsAction,
} from "@/lib/actions/crm/orders.actions";

import {
  listAgreementsAction,
  createAgreementAction,
  getAgreementWithRelationsAction,
  updateAgreementAction,
  deleteAgreementAction,
  sendForSignatureAction,
  recordClientSignatureAction,
  recordProviderSignatureAction,
  activateAgreementAction,
  terminateAgreementAction,
  createNewVersionAction,
  getAgreementStatsAction,
} from "@/lib/actions/crm/agreements.actions";

// Import route handlers
import {
  GET as listQuotes,
  POST as createQuote,
} from "@/app/api/v1/crm/quotes/route";
import {
  GET as getQuote,
  PUT as updateQuote,
  DELETE as deleteQuote,
} from "@/app/api/v1/crm/quotes/[id]/route";
import { POST as sendQuote } from "@/app/api/v1/crm/quotes/[id]/send/route";
import { POST as convertQuote } from "@/app/api/v1/crm/quotes/[id]/convert/route";
import { POST as createQuoteVersion } from "@/app/api/v1/crm/quotes/[id]/version/route";
import { GET as getQuoteStats } from "@/app/api/v1/crm/quotes/stats/route";

import { GET as viewPublicQuote } from "@/app/api/public/quotes/[token]/route";
import { POST as acceptPublicQuote } from "@/app/api/public/quotes/[token]/accept/route";
import { POST as rejectPublicQuote } from "@/app/api/public/quotes/[token]/reject/route";

import {
  GET as listOrders,
  POST as createOrder,
} from "@/app/api/v1/crm/orders/route";
import { GET as getOrder } from "@/app/api/v1/crm/orders/[id]/route";
import { PUT as updateOrderStatus } from "@/app/api/v1/crm/orders/[id]/status/route";
import { POST as fulfillOrder } from "@/app/api/v1/crm/orders/[id]/fulfill/route";
import { POST as cancelOrder } from "@/app/api/v1/crm/orders/[id]/cancel/route";
import { GET as getOrderStats } from "@/app/api/v1/crm/orders/stats/route";

import {
  GET as listAgreements,
  POST as createAgreement,
} from "@/app/api/v1/crm/agreements/route";
import {
  GET as getAgreement,
  PUT as updateAgreement,
  DELETE as deleteAgreement,
} from "@/app/api/v1/crm/agreements/[id]/route";
import { POST as sendForSignature } from "@/app/api/v1/crm/agreements/[id]/send-signature/route";
import { POST as recordClientSignature } from "@/app/api/v1/crm/agreements/[id]/client-signature/route";
import { POST as recordProviderSignature } from "@/app/api/v1/crm/agreements/[id]/provider-signature/route";
import { POST as activateAgreement } from "@/app/api/v1/crm/agreements/[id]/activate/route";
import { POST as terminateAgreement } from "@/app/api/v1/crm/agreements/[id]/terminate/route";
import { POST as createAgreementVersion } from "@/app/api/v1/crm/agreements/[id]/version/route";
import { GET as getAgreementStats } from "@/app/api/v1/crm/agreements/stats/route";

// =============================================================================
// TEST CONSTANTS
// =============================================================================

const TEST_UUID = "550e8400-e29b-41d4-a716-446655440001";
const TEST_TOKEN = "public_token_abc123";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createRequest(
  url: string,
  options?: { method?: string; body?: string }
): NextRequest {
  return new NextRequest(url, {
    method: options?.method,
    body: options?.body,
  });
}

function createRouteParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function createTokenParams(token: string): {
  params: Promise<{ token: string }>;
} {
  return { params: Promise.resolve({ token }) };
}

// =============================================================================
// TESTS: QUOTES ADMIN API
// =============================================================================

describe("Quotes Admin API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/crm/quotes", () => {
    test("returns 200 with quotes list", async () => {
      vi.mocked(listQuotesAction).mockResolvedValue({
        success: true,
        quotes: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });

      const request = createRequest(
        "http://localhost/api/v1/crm/quotes?page=1&limit=20"
      );
      const response = await listQuotes(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(listQuotesAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/crm/quotes", () => {
    test("returns 201 on successful creation", async () => {
      vi.mocked(createQuoteAction).mockResolvedValue({
        success: true,
        quote: { id: TEST_UUID, quote_reference: "QUO-2025-001" } as never,
      });

      const request = createRequest("http://localhost/api/v1/crm/quotes", {
        method: "POST",
        body: JSON.stringify({ opportunityId: TEST_UUID, items: [] }),
      });
      const response = await createQuote(request);

      expect(response.status).toBe(201);
      expect(createQuoteAction).toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/crm/quotes/[id]", () => {
    test("returns 200 with quote details", async () => {
      vi.mocked(getQuoteWithRelationsAction).mockResolvedValue({
        success: true,
        quote: { id: TEST_UUID, quote_reference: "QUO-2025-001" } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/quotes/${TEST_UUID}`
      );
      const response = await getQuote(request, createRouteParams(TEST_UUID));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(getQuoteWithRelationsAction).toHaveBeenCalledWith(TEST_UUID);
    });
  });

  describe("PUT /api/v1/crm/quotes/[id]", () => {
    test("returns 200 on successful update", async () => {
      vi.mocked(updateQuoteAction).mockResolvedValue({
        success: true,
        quote: { id: TEST_UUID } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/quotes/${TEST_UUID}`,
        {
          method: "PUT",
          body: JSON.stringify({ notes: "Updated notes" }),
        }
      );
      const response = await updateQuote(request, createRouteParams(TEST_UUID));

      expect(response.status).toBe(200);
      expect(updateQuoteAction).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/v1/crm/quotes/[id]", () => {
    test("returns 204 on successful deletion", async () => {
      vi.mocked(deleteQuoteAction).mockResolvedValue({ success: true });

      const request = createRequest(
        `http://localhost/api/v1/crm/quotes/${TEST_UUID}`,
        {
          method: "DELETE",
          body: JSON.stringify({ reason: "Test deletion" }),
        }
      );
      const response = await deleteQuote(request, createRouteParams(TEST_UUID));

      expect(response.status).toBe(204);
      expect(deleteQuoteAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/crm/quotes/[id]/send", () => {
    test("returns 200 on successful send", async () => {
      vi.mocked(sendQuoteAction).mockResolvedValue({
        success: true,
        data: {
          quote: { id: TEST_UUID } as never,
          publicUrl: "http://...",
          sentAt: new Date().toISOString(),
        },
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/quotes/${TEST_UUID}/send`,
        {
          method: "POST",
        }
      );
      const response = await sendQuote(request, createRouteParams(TEST_UUID));

      expect(response.status).toBe(200);
      expect(sendQuoteAction).toHaveBeenCalledWith(TEST_UUID);
    });
  });

  describe("POST /api/v1/crm/quotes/[id]/convert", () => {
    test("returns 201 on successful conversion", async () => {
      vi.mocked(convertQuoteToOrderAction).mockResolvedValue({
        success: true,
        data: {
          quote: { id: TEST_UUID } as never,
          order: { id: "order-uuid" } as never,
          convertedAt: new Date().toISOString(),
        },
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/quotes/${TEST_UUID}/convert`,
        {
          method: "POST",
          body: JSON.stringify({ quoteId: TEST_UUID }),
        }
      );
      const response = await convertQuote(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(201);
      expect(convertQuoteToOrderAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/crm/quotes/[id]/version", () => {
    test("returns 201 on successful version creation", async () => {
      vi.mocked(createQuoteVersionAction).mockResolvedValue({
        success: true,
        quote: { id: "new-uuid", quote_version: 2 } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/quotes/${TEST_UUID}/version`,
        {
          method: "POST",
        }
      );
      const response = await createQuoteVersion(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(201);
      expect(createQuoteVersionAction).toHaveBeenCalledWith(TEST_UUID);
    });
  });

  describe("GET /api/v1/crm/quotes/stats", () => {
    test("returns 200 with stats", async () => {
      vi.mocked(getQuoteStatsAction).mockResolvedValue({
        success: true,
        stats: { draft: 5, sent: 10, accepted: 3 },
      });

      const request = createRequest("http://localhost/api/v1/crm/quotes/stats");
      const response = await getQuoteStats(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(getQuoteStatsAction).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// TESTS: QUOTES PUBLIC API
// =============================================================================

describe("Quotes Public API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/public/quotes/[token]", () => {
    test("returns 200 with quote details", async () => {
      vi.mocked(viewQuoteByTokenAction).mockResolvedValue({
        success: true,
        quote: { id: TEST_UUID, quote_reference: "QUO-2025-001" } as never,
      });

      const request = createRequest(
        `http://localhost/api/public/quotes/${TEST_TOKEN}`
      );
      const response = await viewPublicQuote(
        request,
        createTokenParams(TEST_TOKEN)
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(viewQuoteByTokenAction).toHaveBeenCalledWith(TEST_TOKEN);
    });
  });

  describe("POST /api/public/quotes/[token]/accept", () => {
    test("returns 200 on successful accept", async () => {
      vi.mocked(acceptQuoteByTokenAction).mockResolvedValue({
        success: true,
        quote: { id: TEST_UUID, status: "accepted" } as never,
      });

      const request = createRequest(
        `http://localhost/api/public/quotes/${TEST_TOKEN}/accept`,
        {
          method: "POST",
          body: JSON.stringify({
            signature: "John Doe",
            acceptedBy: "john@example.com",
          }),
        }
      );
      const response = await acceptPublicQuote(
        request,
        createTokenParams(TEST_TOKEN)
      );

      expect(response.status).toBe(200);
      expect(acceptQuoteByTokenAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/public/quotes/[token]/reject", () => {
    test("returns 200 on successful reject", async () => {
      vi.mocked(rejectQuoteByTokenAction).mockResolvedValue({
        success: true,
        quote: { id: TEST_UUID, status: "rejected" } as never,
      });

      const request = createRequest(
        `http://localhost/api/public/quotes/${TEST_TOKEN}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ rejectionReason: "Price too high" }),
        }
      );
      const response = await rejectPublicQuote(
        request,
        createTokenParams(TEST_TOKEN)
      );

      expect(response.status).toBe(200);
      expect(rejectQuoteByTokenAction).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// TESTS: ORDERS ADMIN API
// =============================================================================

describe("Orders Admin API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/crm/orders", () => {
    test("returns 200 with orders list", async () => {
      vi.mocked(listOrdersAction).mockResolvedValue({
        success: true,
        orders: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });

      const request = createRequest(
        "http://localhost/api/v1/crm/orders?page=1&limit=20"
      );
      const response = await listOrders(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(listOrdersAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/crm/orders", () => {
    test("returns 201 on successful creation", async () => {
      vi.mocked(createOrderAction).mockResolvedValue({
        success: true,
        data: { order: { id: TEST_UUID }, activitiesCreated: 1 } as never,
      });

      const request = createRequest("http://localhost/api/v1/crm/orders", {
        method: "POST",
        body: JSON.stringify({ opportunityId: TEST_UUID, totalValue: 50000 }),
      });
      const response = await createOrder(request);

      expect(response.status).toBe(201);
      expect(createOrderAction).toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/crm/orders/[id]", () => {
    test("returns 200 with order details", async () => {
      vi.mocked(getOrderAction).mockResolvedValue({
        success: true,
        order: { id: TEST_UUID, order_reference: "ORD-2025-001" } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/orders/${TEST_UUID}`
      );
      const response = await getOrder(request, createRouteParams(TEST_UUID));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(getOrderAction).toHaveBeenCalledWith(TEST_UUID);
    });
  });

  describe("PUT /api/v1/crm/orders/[id]/status", () => {
    test("returns 200 on successful status update", async () => {
      vi.mocked(updateOrderStatusAction).mockResolvedValue({
        success: true,
        order: { id: TEST_UUID, status: "active" } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/orders/${TEST_UUID}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: "active" }),
        }
      );
      const response = await updateOrderStatus(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(200);
      expect(updateOrderStatusAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/crm/orders/[id]/fulfill", () => {
    test("returns 200 on successful fulfillment", async () => {
      vi.mocked(fulfillOrderAction).mockResolvedValue({
        success: true,
        order: { id: TEST_UUID, fulfillment_status: "fulfilled" } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/orders/${TEST_UUID}/fulfill`,
        {
          method: "POST",
        }
      );
      const response = await fulfillOrder(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(200);
      expect(fulfillOrderAction).toHaveBeenCalledWith(TEST_UUID);
    });
  });

  describe("POST /api/v1/crm/orders/[id]/cancel", () => {
    test("returns 200 on successful cancellation", async () => {
      vi.mocked(cancelOrderAction).mockResolvedValue({
        success: true,
        order: { id: TEST_UUID, status: "cancelled" } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/orders/${TEST_UUID}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({ reason: "Customer request" }),
        }
      );
      const response = await cancelOrder(request, createRouteParams(TEST_UUID));

      expect(response.status).toBe(200);
      expect(cancelOrderAction).toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/crm/orders/stats", () => {
    test("returns 200 with stats", async () => {
      vi.mocked(getOrderStatsAction).mockResolvedValue({
        success: true,
        activeCount: 15,
      });

      const request = createRequest("http://localhost/api/v1/crm/orders/stats");
      const response = await getOrderStats(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(getOrderStatsAction).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// TESTS: AGREEMENTS ADMIN API
// =============================================================================

describe("Agreements Admin API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/crm/agreements", () => {
    test("returns 200 with agreements list", async () => {
      vi.mocked(listAgreementsAction).mockResolvedValue({
        success: true,
        agreements: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });

      const request = createRequest(
        "http://localhost/api/v1/crm/agreements?page=1&limit=20"
      );
      const response = await listAgreements(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(listAgreementsAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/crm/agreements", () => {
    test("returns 201 on successful creation", async () => {
      vi.mocked(createAgreementAction).mockResolvedValue({
        success: true,
        agreement: {
          id: TEST_UUID,
          agreement_reference: "AGR-2025-001",
        } as never,
      });

      const request = createRequest("http://localhost/api/v1/crm/agreements", {
        method: "POST",
        body: JSON.stringify({ orderId: TEST_UUID, agreementType: "msa" }),
      });
      const response = await createAgreement(request);

      expect(response.status).toBe(201);
      expect(createAgreementAction).toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/crm/agreements/[id]", () => {
    test("returns 200 with agreement details", async () => {
      vi.mocked(getAgreementWithRelationsAction).mockResolvedValue({
        success: true,
        agreement: {
          id: TEST_UUID,
          agreement_reference: "AGR-2025-001",
        } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/agreements/${TEST_UUID}`
      );
      const response = await getAgreement(
        request,
        createRouteParams(TEST_UUID)
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(getAgreementWithRelationsAction).toHaveBeenCalledWith(TEST_UUID);
    });
  });

  describe("PUT /api/v1/crm/agreements/[id]", () => {
    test("returns 200 on successful update", async () => {
      vi.mocked(updateAgreementAction).mockResolvedValue({
        success: true,
        agreement: { id: TEST_UUID } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/agreements/${TEST_UUID}`,
        {
          method: "PUT",
          body: JSON.stringify({ governingLaw: "UK Law" }),
        }
      );
      const response = await updateAgreement(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(200);
      expect(updateAgreementAction).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/v1/crm/agreements/[id]", () => {
    test("returns 204 on successful deletion", async () => {
      vi.mocked(deleteAgreementAction).mockResolvedValue({ success: true });

      const request = createRequest(
        `http://localhost/api/v1/crm/agreements/${TEST_UUID}`,
        {
          method: "DELETE",
          body: JSON.stringify({ reason: "Test deletion" }),
        }
      );
      const response = await deleteAgreement(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(204);
      expect(deleteAgreementAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/crm/agreements/[id]/send-signature", () => {
    test("returns 200 on successful send", async () => {
      vi.mocked(sendForSignatureAction).mockResolvedValue({
        success: true,
        data: {
          agreement: { id: TEST_UUID } as never,
          publicToken: "token",
          sentAt: new Date(),
        },
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/agreements/${TEST_UUID}/send-signature`,
        {
          method: "POST",
        }
      );
      const response = await sendForSignature(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(200);
      expect(sendForSignatureAction).toHaveBeenCalledWith(TEST_UUID);
    });
  });

  describe("POST /api/v1/crm/agreements/[id]/client-signature", () => {
    test("returns 200 on successful signature", async () => {
      vi.mocked(recordClientSignatureAction).mockResolvedValue({
        success: true,
        agreement: { id: TEST_UUID, client_signed_at: new Date() } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/agreements/${TEST_UUID}/client-signature`,
        {
          method: "POST",
          body: JSON.stringify({
            signatoryName: "John Doe",
            signatoryEmail: "john@example.com",
          }),
        }
      );
      const response = await recordClientSignature(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(200);
      expect(recordClientSignatureAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/crm/agreements/[id]/provider-signature", () => {
    test("returns 200 on successful signature", async () => {
      vi.mocked(recordProviderSignatureAction).mockResolvedValue({
        success: true,
        agreement: { id: TEST_UUID, provider_signed_at: new Date() } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/agreements/${TEST_UUID}/provider-signature`,
        {
          method: "POST",
          body: JSON.stringify({ signatoryId: TEST_UUID }),
        }
      );
      const response = await recordProviderSignature(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(200);
      expect(recordProviderSignatureAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/crm/agreements/[id]/activate", () => {
    test("returns 200 on successful activation", async () => {
      vi.mocked(activateAgreementAction).mockResolvedValue({
        success: true,
        agreement: { id: TEST_UUID, status: "active" } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/agreements/${TEST_UUID}/activate`,
        {
          method: "POST",
        }
      );
      const response = await activateAgreement(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(200);
      expect(activateAgreementAction).toHaveBeenCalledWith(TEST_UUID);
    });
  });

  describe("POST /api/v1/crm/agreements/[id]/terminate", () => {
    test("returns 200 on successful termination", async () => {
      vi.mocked(terminateAgreementAction).mockResolvedValue({
        success: true,
        agreement: { id: TEST_UUID, status: "terminated" } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/agreements/${TEST_UUID}/terminate`,
        {
          method: "POST",
          body: JSON.stringify({ reason: "Client requested" }),
        }
      );
      const response = await terminateAgreement(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(200);
      expect(terminateAgreementAction).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/crm/agreements/[id]/version", () => {
    test("returns 201 on successful version creation", async () => {
      vi.mocked(createNewVersionAction).mockResolvedValue({
        success: true,
        agreement: { id: "new-uuid", version_number: 2 } as never,
      });

      const request = createRequest(
        `http://localhost/api/v1/crm/agreements/${TEST_UUID}/version`,
        {
          method: "POST",
        }
      );
      const response = await createAgreementVersion(
        request,
        createRouteParams(TEST_UUID)
      );

      expect(response.status).toBe(201);
      expect(createNewVersionAction).toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/crm/agreements/stats", () => {
    test("returns 200 with stats", async () => {
      vi.mocked(getAgreementStatsAction).mockResolvedValue({
        success: true,
        stats: {
          byStatus: { active: 10 },
          byType: { msa: 5 },
          averageTimeToSignature: 3.5,
        },
      });

      const request = createRequest(
        "http://localhost/api/v1/crm/agreements/stats"
      );
      const response = await getAgreementStats(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(getAgreementStatsAction).toHaveBeenCalled();
    });
  });
});
