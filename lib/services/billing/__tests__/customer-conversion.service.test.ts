/**
 * CustomerConversionService - Unit Tests V6.2.1
 *
 * Tests for lead-to-customer conversion after Stripe checkout.
 *
 * @module lib/services/billing/__tests__/customer-conversion.service.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CustomerConversionService } from "../customer-conversion.service";
import { prisma } from "@/lib/prisma";
import { clerkService } from "@/lib/services/clerk/clerk.service";
import type Stripe from "stripe";

// ===== MOCKS =====

vi.mock("@/lib/prisma", () => ({
  prisma: {
    crm_leads: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    crm_settings: {
      findUnique: vi.fn(),
    },
    adm_tenants: {
      create: vi.fn(),
      update: vi.fn(),
    },
    clt_masterdata: {
      create: vi.fn(),
    },
    crm_lead_activities: {
      create: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
  },
}));

vi.mock("@/lib/services/clerk/clerk.service", () => ({
  clerkService: {
    createOrganization: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// ===== TEST DATA =====

const mockLead = {
  id: "lead-uuid-123",
  email: "contact@company.com",
  status: "payment_pending",
  first_name: "John",
  last_name: "Doe",
  company_name: "Test Company",
  phone: "+1234567890",
  country_code: "AE",
  lead_code: "LEAD-2026-001",
  fleet_size: "10",
  tenant_id: null,
  stripe_checkout_session_id: "cs_test_123",
};

const mockCheckoutSession = {
  id: "cs_test_456",
  payment_status: "paid",
  customer: "cus_test_123",
  subscription: "sub_test_123",
  metadata: {
    leadId: "lead-uuid-123",
    planCode: "starter",
    billingCycle: "monthly",
  },
} as unknown as Stripe.Checkout.Session;

const mockTenant = {
  id: "tenant-uuid-123",
  name: "Test Company",
  tenant_code: "C-ABC123",
  country_code: "AE",
};

const mockMasterdata = {
  id: "masterdata-uuid-123",
  tenant_id: "tenant-uuid-123",
  client_code: "C-ABC123",
};

/**
 * Mock segment thresholds from crm_settings
 * 4 segments: segment_1 (Solo), segment_2 (Small), segment_3 (Medium), segment_4 (Large)
 */
const mockSegmentThresholds = {
  setting_value: {
    version: "6.2.1",
    segments: [
      {
        code: "segment_1",
        min_fleet: 1,
        max_fleet: 1,
        plan_code: null,
        label_en: "Solo Driver",
        label_fr: "Chauffeur Indépendant",
        is_saas: false,
        description: "Individual driver with single vehicle - mobile app only",
      },
      {
        code: "segment_2",
        min_fleet: 2,
        max_fleet: 10,
        plan_code: "starter",
        label_en: "Small Fleet",
        label_fr: "Petite Flotte",
        is_saas: true,
        description: "Small fleet operations - Starter plan",
      },
      {
        code: "segment_3",
        min_fleet: 11,
        max_fleet: 19,
        plan_code: "pro",
        label_en: "Medium Fleet",
        label_fr: "Flotte Moyenne",
        is_saas: true,
        description: "Medium fleet operations - Pro plan",
      },
      {
        code: "segment_4",
        min_fleet: 20,
        max_fleet: null,
        plan_code: "premium",
        label_en: "Large Fleet",
        label_fr: "Grande Flotte",
        is_saas: true,
        negotiation_allowed: true,
        description: "Large fleet operations - Premium plan with negotiation",
      },
    ],
    escalation_threshold: 20,
    default_segment: "segment_2",
  },
};

// ===== TEST SUITES =====

describe("CustomerConversionService", () => {
  let service: CustomerConversionService;

  beforeEach(() => {
    service = CustomerConversionService.getInstance();
    // Clear segment cache to ensure fresh load for each test
    service.clearSegmentCache();
    vi.clearAllMocks();

    // Reset $transaction to default behavior (pass-through)
    vi.mocked(prisma.$transaction).mockImplementation((fn) =>
      fn(prisma as never)
    );

    // Default mock implementations
    vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(mockLead as never);
    vi.mocked(prisma.crm_settings.findUnique).mockResolvedValue(
      mockSegmentThresholds as never
    );
    vi.mocked(prisma.adm_tenants.create).mockResolvedValue(mockTenant as never);
    vi.mocked(prisma.clt_masterdata.create).mockResolvedValue(
      mockMasterdata as never
    );
    vi.mocked(prisma.crm_leads.update).mockResolvedValue({} as never);
    vi.mocked(prisma.crm_lead_activities.create).mockResolvedValue({} as never);
    vi.mocked(prisma.adm_tenants.update).mockResolvedValue({} as never);

    vi.mocked(clerkService.createOrganization).mockResolvedValue({
      success: true,
      organizationId: "org_clerk_123",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // SUITE 1: Metadata Validation
  // ============================================

  describe("Metadata Validation", () => {
    it("should fail if leadId is missing from metadata", async () => {
      const sessionWithoutLead = {
        ...mockCheckoutSession,
        metadata: {},
      } as unknown as Stripe.Checkout.Session;

      const result = await service.convertLeadToCustomer(sessionWithoutLead);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing leadId");
    });

    it("should extract planCode and billingCycle from metadata", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      // Verify clt_masterdata was created with plan info in metadata
      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              plan_code: "starter",
              billing_cycle: "monthly",
            }),
          }),
        })
      );
    });
  });

  // ============================================
  // SUITE 2: Idempotence
  // ============================================

  describe("Idempotence", () => {
    it("should return alreadyConverted=true if lead is already converted", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: "converted",
        tenant_id: "existing-tenant-123",
      } as never);

      const result = await service.convertLeadToCustomer(mockCheckoutSession);

      expect(result.success).toBe(true);
      expect(result.alreadyConverted).toBe(true);
      expect(result.tenantId).toBe("existing-tenant-123");
      expect(prisma.adm_tenants.create).not.toHaveBeenCalled();
    });

    it("should not convert if lead has tenant_id set", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        tenant_id: "existing-tenant-123",
      } as never);

      const result = await service.convertLeadToCustomer(mockCheckoutSession);

      expect(result.success).toBe(true);
      expect(result.alreadyConverted).toBe(true);
    });
  });

  // ============================================
  // SUITE 3: Status Validation
  // ============================================

  describe("Status Validation", () => {
    it("should fail if lead status is not payment_pending", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: "qualified",
      } as never);

      const result = await service.convertLeadToCustomer(mockCheckoutSession);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid lead status");
      expect(result.error).toContain("qualified");
    });

    it("should succeed with payment_pending status", async () => {
      const result = await service.convertLeadToCustomer(mockCheckoutSession);

      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // SUITE 4: Tenant Creation
  // ============================================

  describe("Tenant Creation", () => {
    it("should create tenant with correct data", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.adm_tenants.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Test Company",
            country_code: "AE",
            stripe_customer_id: "cus_test_123",
            stripe_subscription_id: "sub_test_123",
          }),
        })
      );
    });

    it("should generate tenant_code in C-XXXXXX format", async () => {
      const result = await service.convertLeadToCustomer(mockCheckoutSession);

      expect(result.tenantCode).toMatch(/^C-[A-Z0-9]{6}$/);
    });

    it("should use company_name for tenant name", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.adm_tenants.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Test Company",
          }),
        })
      );
    });

    it("should fallback to first_name + last_name if no company_name", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        company_name: null,
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.adm_tenants.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "John Doe",
          }),
        })
      );
    });

    it("should set verification_token with 24h expiry", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.adm_tenants.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            verification_token: expect.any(String),
            verification_token_expires_at: expect.any(Date),
          }),
        })
      );
    });
  });

  // ============================================
  // SUITE 5: clt_masterdata Creation
  // ============================================

  describe("clt_masterdata Creation", () => {
    it("should create masterdata with client_code = tenant_code", async () => {
      const result = await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            client_code: result.tenantCode,
          }),
        })
      );
    });

    it("should include origin_lead_id and origin_lead_code", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            origin_lead_id: "lead-uuid-123",
            origin_lead_code: "LEAD-2026-001",
          }),
        })
      );
    });

    it("should set segment_2 (Small Fleet) for fleet_size 10", async () => {
      // mockLead has fleet_size: "10" which falls in segment_2 (2-10)
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_2", // fleet_size = "10" -> segment_2 (Small Fleet)
          }),
        })
      );
    });

    it("should set segment_1 (Solo) for fleet_size 1", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        fleet_size: "1",
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_1", // fleet_size = "1" -> segment_1 (Solo)
          }),
        })
      );
    });

    it("should set segment_3 (Medium Fleet) for fleet_size 15", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        fleet_size: "15",
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_3", // fleet_size = "15" -> segment_3 (Medium Fleet)
          }),
        })
      );
    });

    it("should set segment_4 (Large Fleet) for fleet_size 50", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        fleet_size: "50",
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_4", // fleet_size = "50" -> segment_4 (Large Fleet)
          }),
        })
      );
    });

    it("should set primary_contact fields correctly", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            primary_contact_name: "John Doe",
            primary_contact_email: "contact@company.com",
            primary_contact_phone: "+1234567890",
          }),
        })
      );
    });
  });

  // ============================================
  // SUITE 6: Lead Update
  // ============================================

  describe("Lead Update", () => {
    it("should update lead status to converted", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "lead-uuid-123" },
          data: expect.objectContaining({
            status: "converted",
            converted_at: expect.any(Date),
          }),
        })
      );
    });

    it("should set tenant_id on lead", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenant_id: "tenant-uuid-123",
          }),
        })
      );
    });

    it("should create activity log for conversion", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.crm_lead_activities.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lead_id: "lead-uuid-123",
            activity_type: "lead_converted",
            performed_by: "system",
          }),
        })
      );
    });
  });

  // ============================================
  // SUITE 7: Clerk Organization
  // ============================================

  describe("Clerk Organization", () => {
    it("should create Clerk organization", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(clerkService.createOrganization).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Company",
          tenantId: "tenant-uuid-123",
        })
      );
    });

    it("should update tenant with clerk_organization_id", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.adm_tenants.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "tenant-uuid-123" },
          data: { clerk_organization_id: "org_clerk_123" },
        })
      );
    });

    it("should continue if Clerk creation fails", async () => {
      vi.mocked(clerkService.createOrganization).mockResolvedValue({
        success: false,
        error: "Clerk API error",
      });

      const result = await service.convertLeadToCustomer(mockCheckoutSession);

      expect(result.success).toBe(true);
      expect(result.clerkOrgId).toBeUndefined();
    });
  });

  // ============================================
  // SUITE 8: Error Handling
  // ============================================

  describe("Error Handling", () => {
    it("should return error if lead not found", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(null);

      const result = await service.convertLeadToCustomer(mockCheckoutSession);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Lead not found");
    });

    it("should return error if transaction fails", async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(
        new Error("Database error")
      );

      const result = await service.convertLeadToCustomer(mockCheckoutSession);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database error");
    });
  });

  // ============================================
  // SUITE 9: Stripe Data Extraction
  // ============================================

  describe("Stripe Data Extraction", () => {
    it("should extract customer ID from string", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.adm_tenants.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stripe_customer_id: "cus_test_123",
          }),
        })
      );
    });

    it("should extract subscription ID from string", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.adm_tenants.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stripe_subscription_id: "sub_test_123",
          }),
        })
      );
    });

    it("should handle customer as object", async () => {
      const sessionWithCustomerObject = {
        ...mockCheckoutSession,
        customer: { id: "cus_object_123" },
      } as unknown as Stripe.Checkout.Session;

      await service.convertLeadToCustomer(sessionWithCustomerObject);

      expect(prisma.adm_tenants.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stripe_customer_id: "cus_object_123",
          }),
        })
      );
    });
  });

  // ============================================
  // SUITE 10: Segment Thresholds Loading (V6.2.1)
  // ============================================

  describe("Segment Thresholds Loading", () => {
    it("should load segment_thresholds from crm_settings", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.crm_settings.findUnique).toHaveBeenCalledWith({
        where: { setting_key: "segment_thresholds" },
        select: { setting_value: true },
      });
    });

    it("should cache segment thresholds after first load", async () => {
      // First conversion - should load from DB
      await service.convertLeadToCustomer(mockCheckoutSession);

      // Second conversion - should use cache
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        id: "lead-uuid-456",
      } as never);

      await service.convertLeadToCustomer({
        ...mockCheckoutSession,
        metadata: {
          ...mockCheckoutSession.metadata,
          leadId: "lead-uuid-456",
        },
      } as never);

      // crm_settings.findUnique should only be called once (cached)
      expect(prisma.crm_settings.findUnique).toHaveBeenCalledTimes(1);
    });

    it("should fail conversion if segment_thresholds not found in crm_settings", async () => {
      vi.mocked(prisma.crm_settings.findUnique).mockResolvedValue(null);

      const result = await service.convertLeadToCustomer(mockCheckoutSession);

      expect(result.success).toBe(false);
      expect(result.error).toContain("segment_thresholds not found");
    });

    it("should determine segment_1 at lower boundary (fleet_size = 1)", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        fleet_size: "1",
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_1",
          }),
        })
      );
    });

    it("should determine segment_2 at lower boundary (fleet_size = 2)", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        fleet_size: "2",
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_2",
          }),
        })
      );
    });

    it("should determine segment_3 at lower boundary (fleet_size = 11)", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        fleet_size: "11",
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_3",
          }),
        })
      );
    });

    it("should determine segment_4 at lower boundary (fleet_size = 20)", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        fleet_size: "20",
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_4",
          }),
        })
      );
    });

    it("should determine segment_4 for large fleet (fleet_size = 500)", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        fleet_size: "500",
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_4",
          }),
        })
      );
    });

    it("should use default segment for null fleet_size", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        fleet_size: null,
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      // null fleet_size defaults to 1, which is segment_1
      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_1",
          }),
        })
      );
    });

    it("should use segment_1 for invalid fleet_size", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        fleet_size: "invalid",
      } as never);

      await service.convertLeadToCustomer(mockCheckoutSession);

      // Invalid fleet_size parses to NaN, defaults to 1 -> segment_1
      expect(prisma.clt_masterdata.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            segment: "segment_1",
          }),
        })
      );
    });

    it("should pass segment info to Clerk organization", async () => {
      await service.convertLeadToCustomer(mockCheckoutSession);

      // fleet_size = "10" -> segment_2 (Small Fleet)
      expect(clerkService.createOrganization).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            segment: "segment_2",
            segmentLabel: "Small Fleet",
            isSaas: true,
          }),
        })
      );
    });
  });

  // ============================================
  // SUITE 11: Session Already Processed Check
  // ============================================

  describe("isSessionAlreadyProcessed", () => {
    it("should return true if session was already processed", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        id: "lead-uuid-123",
        stripe_checkout_session_id: "cs_test_456",
        status: "converted",
      } as never);

      const result = await service.isSessionAlreadyProcessed("cs_test_456");

      expect(result).toBe(true);
    });

    it("should return false if session was not processed", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      const result = await service.isSessionAlreadyProcessed("cs_test_new");

      expect(result).toBe(false);
    });
  });
});
