/**
 * Payment Link Service - V6.2.1
 * Génération de liens de paiement Stripe pour la conversion des leads
 *
 * Ce service gère:
 * - Validation du statut du lead (allowed_statuses from bil_settings)
 * - Récupération des prix depuis bil_billing_plans
 * - Création de Stripe Checkout Sessions
 * - Mise à jour du lead avec les infos Stripe
 * - Transition automatique vers payment_pending
 *
 * ZERO HARDCODING: Toutes les règles viennent de bil_settings
 *
 * @module lib/services/billing/payment-link.service
 */

import { prisma } from "@/lib/prisma";
import { stripeClientService } from "@/lib/services/stripe/stripe-client.service";
import { leadStatusService } from "@/lib/services/crm/lead-status.service";
import { logger } from "@/lib/logger";
import type Stripe from "stripe";

// ===== TYPES & INTERFACES =====

/**
 * Payment settings from bil_settings
 */
export interface PaymentSettings {
  version: string;
  payment_link: {
    allowed_statuses: string[];
    expiry_hours: number;
    reminder_hours: number;
  };
  first_month_free: {
    enabled: boolean;
    coupon_id: string;
  };
  checkout: {
    success_path: string;
    cancel_path: string;
  };
}

/**
 * Input for creating a payment link
 */
export interface CreatePaymentLinkInput {
  leadId: string;
  planCode: string; // "starter", "pro", "premium"
  billingCycle: "monthly" | "yearly";
  performedBy: string; // Clerk user_id du commercial
}

/**
 * Result of payment link creation
 */
export interface PaymentLinkResult {
  success: boolean;
  paymentLinkUrl?: string;
  checkoutSessionId?: string;
  expiresAt?: Date;
  leadId: string;
  statusUpdated: boolean;
  error?: string;
}

/**
 * Billing plan with Stripe price IDs
 */
interface BillingPlan {
  id: string;
  plan_code: string | null;
  plan_name: string;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
}

// ===== SERVICE CLASS =====

/**
 * PaymentLinkService - Génération de liens de paiement Stripe
 *
 * Flow:
 * 1. Valider lead.status IN (allowed_statuses de bil_settings)
 * 2. Récupérer prix depuis bil_billing_plans.stripe_price_id_monthly/yearly
 * 3. Créer Stripe Checkout Session avec:
 *    - price_id correspondant
 *    - coupon FIRST_MONTH_FREE (si first_month_free.enabled)
 *    - metadata: { leadId, planCode, billingCycle }
 *    - success_url / cancel_url
 * 4. Update crm_leads:
 *    - stripe_checkout_session_id
 *    - stripe_payment_link_url
 *    - payment_link_created_at
 *    - payment_link_expires_at
 * 5. Update lead.status = "payment_pending"
 * 6. Créer crm_lead_activities type="payment_link_created"
 * 7. Return result
 *
 * @example
 * ```typescript
 * import { paymentLinkService } from "@/lib/services/billing/payment-link.service";
 *
 * const result = await paymentLinkService.createPaymentLink({
 *   leadId: "uuid",
 *   planCode: "starter",
 *   billingCycle: "monthly",
 *   performedBy: "clerk_user_id",
 * });
 *
 * if (result.success) {
 *   // Use result.paymentLinkUrl
 * }
 * ```
 */
export class PaymentLinkService {
  private settingsCache: PaymentSettings | null = null;

  // ============================================
  // SETTINGS METHODS
  // ============================================

  /**
   * Get payment settings from bil_settings
   * Uses cache to reduce DB queries
   */
  async getPaymentSettings(): Promise<PaymentSettings> {
    if (this.settingsCache) {
      return this.settingsCache;
    }

    const setting = await prisma.bil_settings.findFirst({
      where: {
        setting_key: "payment_settings",
        is_active: true,
      },
      select: {
        setting_value: true,
      },
    });

    if (!setting) {
      throw new Error("payment_settings not found in bil_settings");
    }

    this.settingsCache = setting.setting_value as unknown as PaymentSettings;
    return this.settingsCache;
  }

  /**
   * Check if lead status allows payment link creation
   */
  async isStatusAllowed(status: string): Promise<boolean> {
    const settings = await this.getPaymentSettings();
    return settings.payment_link.allowed_statuses.includes(status);
  }

  // ============================================
  // PLAN METHODS
  // ============================================

  /**
   * Get billing plan with Stripe price IDs
   */
  async getBillingPlan(planCode: string): Promise<BillingPlan | null> {
    const plan = await prisma.bil_billing_plans.findFirst({
      where: {
        plan_code: planCode,
        deleted_at: null,
      },
      select: {
        id: true,
        plan_code: true,
        plan_name: true,
        stripe_price_id_monthly: true,
        stripe_price_id_yearly: true,
      },
    });

    return plan;
  }

  /**
   * Get Stripe price ID for plan and billing cycle
   */
  async getStripePriceId(
    planCode: string,
    billingCycle: "monthly" | "yearly"
  ): Promise<string | null> {
    const plan = await this.getBillingPlan(planCode);
    if (!plan) return null;

    return billingCycle === "monthly"
      ? plan.stripe_price_id_monthly
      : plan.stripe_price_id_yearly;
  }

  // ============================================
  // PAYMENT LINK CREATION
  // ============================================

  /**
   * Create a payment link for a lead
   */
  async createPaymentLink(
    input: CreatePaymentLinkInput
  ): Promise<PaymentLinkResult> {
    const { leadId, planCode, billingCycle, performedBy } = input;

    try {
      // 1. Get lead
      const lead = await prisma.crm_leads.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          email: true,
          status: true,
          first_name: true,
          last_name: true,
          company_name: true,
          stripe_checkout_session_id: true,
        },
      });

      if (!lead) {
        return {
          success: false,
          leadId,
          statusUpdated: false,
          error: "Lead not found",
        };
      }

      // 2. Validate status is allowed
      const isAllowed = await this.isStatusAllowed(lead.status || "new");
      if (!isAllowed) {
        return {
          success: false,
          leadId,
          statusUpdated: false,
          error: `Cannot create payment link for lead with status '${lead.status}'. Allowed statuses: ${(await this.getPaymentSettings()).payment_link.allowed_statuses.join(", ")}`,
        };
      }

      // 3. Check if payment link already exists
      if (lead.stripe_checkout_session_id) {
        return {
          success: false,
          leadId,
          statusUpdated: false,
          error: "Payment link already exists for this lead",
        };
      }

      // 4. Get Stripe price ID
      const priceId = await this.getStripePriceId(planCode, billingCycle);
      if (!priceId) {
        return {
          success: false,
          leadId,
          statusUpdated: false,
          error: `No Stripe price ID found for plan '${planCode}' with billing cycle '${billingCycle}'`,
        };
      }

      // 5. Get payment settings
      const settings = await this.getPaymentSettings();

      // 6. Calculate expiry
      const expiresAt = new Date();
      expiresAt.setHours(
        expiresAt.getHours() + settings.payment_link.expiry_hours
      );

      // 7. Build Stripe checkout session params
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.io";
      const successUrl = `${baseUrl}${settings.checkout.success_path}?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}${settings.checkout.cancel_path}?lead_id=${leadId}`;

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: lead.email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          leadId,
          planCode,
          billingCycle,
          performedBy,
        },
        subscription_data: {
          metadata: {
            leadId,
            planCode,
          },
        },
        expires_at: Math.floor(expiresAt.getTime() / 1000),
      };

      // Add coupon if first month free is enabled
      if (
        settings.first_month_free.enabled &&
        settings.first_month_free.coupon_id
      ) {
        sessionParams.discounts = [
          {
            coupon: settings.first_month_free.coupon_id,
          },
        ];
      }

      // 8. Create Stripe checkout session
      const session =
        await stripeClientService.createCheckoutSession(sessionParams);

      if (!session.url) {
        return {
          success: false,
          leadId,
          statusUpdated: false,
          error: "Stripe did not return a checkout URL",
        };
      }

      // 9. Update lead and create activity in transaction
      await prisma.$transaction(async (tx) => {
        // Update lead with Stripe info
        await tx.crm_leads.update({
          where: { id: leadId },
          data: {
            stripe_checkout_session_id: session.id,
            stripe_payment_link_url: session.url,
            payment_link_created_at: new Date(),
            payment_link_expires_at: expiresAt,
            updated_at: new Date(),
          },
        });

        // Create activity
        await tx.crm_lead_activities.create({
          data: {
            lead_id: leadId,
            activity_type: "payment_link_created",
            title: "Payment link created",
            description: `Plan: ${planCode}, Billing: ${billingCycle}, Expires: ${expiresAt.toISOString()}`,
            performed_by: performedBy,
            created_at: new Date(),
          },
        });
      });

      // 10. Update status to payment_pending
      const statusResult = await leadStatusService.updateStatus(
        leadId,
        "payment_pending",
        { performedBy }
      );

      logger.info(
        {
          leadId,
          planCode,
          billingCycle,
          sessionId: session.id,
          statusUpdated: statusResult.success,
        },
        "[PaymentLinkService] Payment link created"
      );

      return {
        success: true,
        paymentLinkUrl: session.url,
        checkoutSessionId: session.id,
        expiresAt,
        leadId,
        statusUpdated: statusResult.success,
      };
    } catch (error) {
      logger.error(
        { error, leadId, planCode, billingCycle },
        "[PaymentLinkService] Error creating payment link"
      );

      return {
        success: false,
        leadId,
        statusUpdated: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get payment link status for a lead
   */
  async getPaymentLinkStatus(leadId: string): Promise<{
    hasPaymentLink: boolean;
    url?: string;
    sessionId?: string;
    createdAt?: Date;
    expiresAt?: Date;
    isExpired?: boolean;
  }> {
    const lead = await prisma.crm_leads.findUnique({
      where: { id: leadId },
      select: {
        stripe_checkout_session_id: true,
        stripe_payment_link_url: true,
        payment_link_created_at: true,
        payment_link_expires_at: true,
      },
    });

    if (!lead || !lead.stripe_checkout_session_id) {
      return { hasPaymentLink: false };
    }

    const now = new Date();
    const isExpired = lead.payment_link_expires_at
      ? lead.payment_link_expires_at < now
      : false;

    return {
      hasPaymentLink: true,
      url: lead.stripe_payment_link_url || undefined,
      sessionId: lead.stripe_checkout_session_id,
      createdAt: lead.payment_link_created_at || undefined,
      expiresAt: lead.payment_link_expires_at || undefined,
      isExpired,
    };
  }

  /**
   * Clear settings cache (useful for testing)
   */
  clearCache(): void {
    this.settingsCache = null;
  }
}

// ===== SINGLETON INSTANCE =====

/**
 * Default PaymentLinkService instance
 */
export const paymentLinkService = new PaymentLinkService();
