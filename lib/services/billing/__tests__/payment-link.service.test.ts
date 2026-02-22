/**
 * PaymentLinkService - Unit Tests V6.3
 *
 * Tests for Stripe payment link generation and lead conversion flow.
 * V6.3: 8 statuts (removed demo_scheduled, qualified, demo_completed)
 *
 * @module lib/services/billing/__tests__/payment-link.service.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PaymentLinkService } from "../payment-link.service";
import { prisma } from "@/lib/prisma";
import { stripeClientService } from "@/lib/services/stripe/stripe-client.service";
import { leadStatusService } from "@/lib/services/crm/lead-status.service";
import { Decimal } from "@prisma/client/runtime/library";

// ===== MOCKS =====

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bil_settings: {
      findFirst: vi.fn(),
    },
    bil_billing_plans: {
      findFirst: vi.fn(),
    },
    crm_leads: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    crm_lead_activities: {
      create: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
  },
}));

vi.mock("@/lib/services/stripe/stripe-client.service", () => ({
  stripeClientService: {
    createCheckoutSession: vi.fn(),
  },
}));

vi.mock("@/lib/services/crm/lead-status.service", () => ({
  leadStatusService: {
    updateStatus: vi.fn(),
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

const mockPaymentSettings = {
  version: "6.3",
  payment_link: {
    // V6.3: 8 statuts - demo replaces demo_scheduled, qualified removed
    allowed_statuses: ["demo", "proposal_sent"],
    expiry_hours: 24,
    reminder_hours: 12,
  },
  first_month_free: {
    enabled: true,
    coupon_id: "FIRST_MONTH_FREE",
  },
  checkout: {
    success_path: "/payment-success",
    cancel_path: "/payment-cancelled",
  },
};

const mockBillingPlan = {
  id: "plan-uuid-123",
  plan_code: "starter",
  plan_name: "Starter Plan",
  stripe_price_id_monthly: "price_monthly_123",
  stripe_price_id_yearly: "price_yearly_123",
};

const mockLead = {
  id: "lead-uuid-123",
  email: "contact@company.com",
  status: "demo", // V6.3: valid status for payment link creation
  first_name: "John",
  last_name: "Doe",
  company_name: "Test Company",
  stripe_checkout_session_id: null,
};

const mockCheckoutSession = {
  id: "cs_test_123",
  url: "https://checkout.stripe.com/pay/cs_test_123",
};

// ===== TEST SUITES =====

describe("PaymentLinkService", () => {
  let service: PaymentLinkService;

  beforeEach(() => {
    service = new PaymentLinkService();
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(prisma.bil_settings.findFirst).mockResolvedValue({
      id: "setting-uuid",
      setting_key: "payment_settings",
      setting_value: mockPaymentSettings,
      category: "payment",
      data_type: "object",
      display_label: "Payment Settings",
      schema_version: "6.3",
      is_system: true,
      is_active: true,
      description: "Payment configuration",
      provider_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.mocked(prisma.bil_billing_plans.findFirst).mockResolvedValue({
      id: mockBillingPlan.id,
      plan_code: mockBillingPlan.plan_code,
      plan_name: mockBillingPlan.plan_name,
      stripe_price_id_monthly: mockBillingPlan.stripe_price_id_monthly,
      stripe_price_id_yearly: mockBillingPlan.stripe_price_id_yearly,
      monthly_fee: new Decimal(0),
      annual_fee: new Decimal(0),
      currency: "EUR",
      features: {},
      metadata: {},
      created_at: new Date(),
      created_by: null,
      updated_at: new Date(),
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
      deletion_reason: null,
      vat_rate: null,
      max_vehicles: null,
      max_drivers: null,
      max_users: null,
      version: 1,
      billing_interval: "month",
      status: "active",
      description_translations: null,
    });

    vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
      ...mockLead,
      phone: null,
      source: null,
      message: null,
      created_at: new Date(),
      updated_at: new Date(),
      country_code: null,
      fleet_size: null,
      current_software: null,
      assigned_to: null,
      qualification_score: 75,
      qualification_notes: null,
      qualified_date: new Date(),
      converted_date: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      metadata: null,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
      deletion_reason: null,
      lead_code: "L-XYZ789", // PostgreSQL trigger format (L-XXXXXX)
      industry: null,
      company_size: null,
      website_url: null,
      linkedin_url: null,
      city: null,
      lead_stage: "sales_qualified",
      fit_score: null,
      engagement_score: null,
      scoring: null,
      gdpr_consent: true,
      consent_at: new Date(),
      source_id: null,
      opportunity_id: null,
      next_action_date: null,
      priority: "medium",
      consent_ip: null,
      last_activity_at: new Date(),
      provider_id: null,
      stage_entered_at: new Date(),
      loss_reason_code: null,
      loss_reason_detail: null,
      competitor_name: null,
      booking_slot_at: null,
      booking_confirmed_at: null,
      booking_calcom_uid: null,
      platforms_used: [],
      wizard_completed: false,
      tenant_id: null,
      converted_at: null,
      stripe_payment_link_url: null,
      payment_link_created_at: null,
      payment_link_expires_at: null,
    } as never);

    vi.mocked(stripeClientService.createCheckoutSession).mockResolvedValue(
      mockCheckoutSession as unknown as Awaited<
        ReturnType<typeof stripeClientService.createCheckoutSession>
      >
    );

    vi.mocked(leadStatusService.updateStatus).mockResolvedValue({
      success: true,
      leadId: mockLead.id,
      previousStatus: "demo", // V6.3: demo is allowed status
      newStatus: "payment_pending",
    });

    vi.mocked(prisma.crm_leads.update).mockResolvedValue({} as never);
    vi.mocked(prisma.crm_lead_activities.create).mockResolvedValue({} as never);
  });

  afterEach(() => {
    service.clearCache();
  });

  // ============================================
  // SUITE 1: Settings Loading
  // ============================================

  describe("Settings Loading", () => {
    it("should load payment_settings from bil_settings", async () => {
      const settings = await service.getPaymentSettings();

      expect(settings).toBeDefined();
      expect(settings.version).toBe("6.3");
      // V6.3: demo replaces demo_scheduled, qualified removed
      expect(settings.payment_link.allowed_statuses).toContain("demo");
      expect(prisma.bil_settings.findFirst).toHaveBeenCalledWith({
        where: {
          setting_key: "payment_settings",
          is_active: true,
        },
        select: {
          setting_value: true,
        },
      });
    });

    it("should throw if payment_settings not found", async () => {
      vi.mocked(prisma.bil_settings.findFirst).mockResolvedValue(null);

      await expect(service.getPaymentSettings()).rejects.toThrow(
        "payment_settings not found in bil_settings"
      );
    });

    it("should cache settings after first load", async () => {
      await service.getPaymentSettings();
      await service.getPaymentSettings();

      expect(prisma.bil_settings.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // SUITE 2: Status Validation
  // V6.3: 8 statuts - demo and proposal_sent are allowed
  // ============================================

  describe("Status Validation", () => {
    it("should return true for allowed status 'demo'", async () => {
      // V6.3: demo replaces demo_scheduled
      const isAllowed = await service.isStatusAllowed("demo");
      expect(isAllowed).toBe(true);
    });

    it("should return true for allowed status 'proposal_sent'", async () => {
      const isAllowed = await service.isStatusAllowed("proposal_sent");
      expect(isAllowed).toBe(true);
    });

    it("should return false for disallowed status 'new'", async () => {
      const isAllowed = await service.isStatusAllowed("new");
      expect(isAllowed).toBe(false);
    });

    it("should return false for disallowed status 'converted'", async () => {
      const isAllowed = await service.isStatusAllowed("converted");
      expect(isAllowed).toBe(false);
    });

    it("should return false for disallowed status 'payment_pending'", async () => {
      // V6.3: payment_pending is after payment link creation
      const isAllowed = await service.isStatusAllowed("payment_pending");
      expect(isAllowed).toBe(false);
    });
  });

  // ============================================
  // SUITE 3: Plan & Price Retrieval
  // ============================================

  describe("Plan & Price Retrieval", () => {
    it("should get billing plan by code", async () => {
      const plan = await service.getBillingPlan("starter");

      expect(plan).toBeDefined();
      expect(plan?.plan_code).toBe("starter");
      expect(plan?.stripe_price_id_monthly).toBe("price_monthly_123");
    });

    it("should return null for non-existent plan", async () => {
      vi.mocked(prisma.bil_billing_plans.findFirst).mockResolvedValue(null);

      const plan = await service.getBillingPlan("unknown");
      expect(plan).toBeNull();
    });

    it("should get monthly Stripe price ID", async () => {
      const priceId = await service.getStripePriceId("starter", "monthly");
      expect(priceId).toBe("price_monthly_123");
    });

    it("should get yearly Stripe price ID", async () => {
      const priceId = await service.getStripePriceId("starter", "yearly");
      expect(priceId).toBe("price_yearly_123");
    });

    it("should return null for plan without price ID", async () => {
      vi.mocked(prisma.bil_billing_plans.findFirst).mockResolvedValue({
        ...mockBillingPlan,
        stripe_price_id_monthly: null,
        stripe_price_id_yearly: null,
      } as never);

      const priceId = await service.getStripePriceId("starter", "monthly");
      expect(priceId).toBeNull();
    });
  });

  // ============================================
  // SUITE 4: Payment Link Creation - Success
  // ============================================

  describe("Payment Link Creation - Success", () => {
    it("should create payment link for lead in demo status with monthly billing", async () => {
      const result = await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(result.success).toBe(true);
      expect(result.paymentLinkUrl).toBe(mockCheckoutSession.url);
      expect(result.checkoutSessionId).toBe(mockCheckoutSession.id);
      expect(result.expiresAt).toBeDefined();
      expect(result.statusUpdated).toBe(true);
    });

    it("should create Stripe checkout session with correct params", async () => {
      await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(stripeClientService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "subscription",
          payment_method_types: ["card"],
          customer_email: mockLead.email,
          line_items: [
            {
              price: "price_monthly_123",
              quantity: 1,
            },
          ],
          metadata: expect.objectContaining({
            leadId: mockLead.id,
            planCode: "starter",
            billingCycle: "monthly",
          }),
          discounts: [
            {
              coupon: "FIRST_MONTH_FREE",
            },
          ],
        })
      );
    });

    it("should update lead with Stripe info in transaction", async () => {
      await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockLead.id },
          data: expect.objectContaining({
            stripe_checkout_session_id: mockCheckoutSession.id,
            stripe_payment_link_url: mockCheckoutSession.url,
          }),
        })
      );
    });

    it("should create activity record", async () => {
      await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(prisma.crm_lead_activities.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lead_id: mockLead.id,
            activity_type: "payment_link_created",
            performed_by: "user-123",
          }),
        })
      );
    });

    it("should update lead status to payment_pending", async () => {
      await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(leadStatusService.updateStatus).toHaveBeenCalledWith(
        mockLead.id,
        "payment_pending",
        { performedBy: "user-123" }
      );
    });
  });

  // ============================================
  // SUITE 5: Payment Link Creation - Errors
  // ============================================

  describe("Payment Link Creation - Errors", () => {
    it("should fail if lead not found", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(null);

      const result = await service.createPaymentLink({
        leadId: "unknown-uuid",
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Lead not found");
    });

    it("should fail if lead status not allowed", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: "new",
      } as never);

      const result = await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot create payment link");
      expect(result.error).toContain("'new'");
    });

    it("should fail if payment link already exists", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        stripe_checkout_session_id: "cs_existing_123",
      } as never);

      const result = await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Payment link already exists for this lead");
    });

    it("should fail if no Stripe price ID configured", async () => {
      vi.mocked(prisma.bil_billing_plans.findFirst).mockResolvedValue(null);

      const result = await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "unknown-plan",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("No Stripe price ID found");
    });

    it("should fail if Stripe does not return URL", async () => {
      vi.mocked(stripeClientService.createCheckoutSession).mockResolvedValue({
        id: "cs_test_123",
        url: null,
      } as never);

      const result = await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Stripe did not return a checkout URL");
    });
  });

  // ============================================
  // SUITE 6: Coupon Handling
  // ============================================

  describe("Coupon Handling", () => {
    it("should include coupon when first_month_free is enabled", async () => {
      await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(stripeClientService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          discounts: [{ coupon: "FIRST_MONTH_FREE" }],
        })
      );
    });

    it("should not include coupon when first_month_free is disabled", async () => {
      vi.mocked(prisma.bil_settings.findFirst).mockResolvedValue({
        setting_value: {
          ...mockPaymentSettings,
          first_month_free: {
            enabled: false,
            coupon_id: "FIRST_MONTH_FREE",
          },
        },
      } as never);

      service.clearCache();

      await service.createPaymentLink({
        leadId: mockLead.id,
        planCode: "starter",
        billingCycle: "monthly",
        performedBy: "user-123",
      });

      expect(stripeClientService.createCheckoutSession).toHaveBeenCalledWith(
        expect.not.objectContaining({
          discounts: expect.anything(),
        })
      );
    });
  });

  // ============================================
  // SUITE 7: Payment Link Status
  // ============================================

  describe("Payment Link Status", () => {
    it("should return hasPaymentLink=false when no payment link", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        stripe_checkout_session_id: null,
        stripe_payment_link_url: null,
        payment_link_created_at: null,
        payment_link_expires_at: null,
      } as never);

      const status = await service.getPaymentLinkStatus(mockLead.id);

      expect(status.hasPaymentLink).toBe(false);
      expect(status.url).toBeUndefined();
    });

    it("should return payment link details when exists", async () => {
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        stripe_checkout_session_id: "cs_test_123",
        stripe_payment_link_url: "https://checkout.stripe.com/...",
        payment_link_created_at: createdAt,
        payment_link_expires_at: expiresAt,
      } as never);

      const status = await service.getPaymentLinkStatus(mockLead.id);

      expect(status.hasPaymentLink).toBe(true);
      expect(status.sessionId).toBe("cs_test_123");
      expect(status.url).toBe("https://checkout.stripe.com/...");
      expect(status.isExpired).toBe(false);
    });

    it("should detect expired payment link", async () => {
      const createdAt = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000);

      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        stripe_checkout_session_id: "cs_test_123",
        stripe_payment_link_url: "https://checkout.stripe.com/...",
        payment_link_created_at: createdAt,
        payment_link_expires_at: expiresAt,
      } as never);

      const status = await service.getPaymentLinkStatus(mockLead.id);

      expect(status.isExpired).toBe(true);
    });
  });
});
