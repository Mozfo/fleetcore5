/**
 * Stripe Client Service - Singleton
 *
 * Encapsule toutes les interactions avec l'API Stripe.
 * Supporte stripe-mock pour développement/tests.
 */

import Stripe from "stripe";
import {
  STRIPE_CONFIG,
  STRIPE_API_VERSION,
  isStripeConfigured,
  isStripeMockMode,
} from "@/lib/config/stripe.config";
import { logger } from "@/lib/logger";

export class StripeClientService {
  private static instance: StripeClientService;
  private client: Stripe | null = null;
  private configured: boolean = false;

  private constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    // Vérifier si Stripe est configuré
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!isStripeConfigured() || !stripeSecretKey) {
      logger.warn(
        "[StripeClient] Stripe not configured. STRIPE_SECRET_KEY is missing."
      );
      logger.warn(
        "[StripeClient] Stripe operations will return null/throw errors."
      );

      if (STRIPE_CONFIG.features.strictMode) {
        throw new Error("Stripe is required in production but not configured");
      }
      return;
    }

    // Configuration du client
    const options: Stripe.StripeConfig = {
      apiVersion: STRIPE_API_VERSION,
      maxNetworkRetries: STRIPE_CONFIG.maxNetworkRetries,
      timeout: STRIPE_CONFIG.timeout,
    };

    // Support stripe-mock
    if (isStripeMockMode() && STRIPE_CONFIG.apiBase) {
      const mockUrl = new URL(STRIPE_CONFIG.apiBase);
      options.host = mockUrl.hostname;
      options.port = parseInt(mockUrl.port) || 12111;
      options.protocol = mockUrl.protocol.replace(":", "") as "http" | "https";
      logger.info(
        { apiBase: STRIPE_CONFIG.apiBase },
        "[StripeClient] Using stripe-mock"
      );
    }

    this.client = new Stripe(stripeSecretKey, options);
    this.configured = true;
    logger.info("[StripeClient] Stripe client initialized successfully");
  }

  // Singleton
  public static getInstance(): StripeClientService {
    if (!StripeClientService.instance) {
      StripeClientService.instance = new StripeClientService();
    }
    return StripeClientService.instance;
  }

  // Vérifier si configuré
  public isConfigured(): boolean {
    return this.configured;
  }

  // Obtenir le client (peut être null)
  public getClient(): Stripe | null {
    return this.client;
  }

  // Helper pour vérifier que le client est disponible
  private requireClient(): Stripe {
    if (!this.client) {
      throw new Error(
        "Stripe client not configured. Please set STRIPE_SECRET_KEY."
      );
    }
    return this.client;
  }

  // =========================================================================
  // CUSTOMER OPERATIONS
  // =========================================================================

  async createCustomer(
    params: Stripe.CustomerCreateParams
  ): Promise<Stripe.Customer> {
    const client = this.requireClient();
    return client.customers.create(params);
  }

  async updateCustomer(
    id: string,
    params: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    const client = this.requireClient();
    return client.customers.update(id, params);
  }

  // =========================================================================
  // SUBSCRIPTION SCHEDULE OPERATIONS
  // =========================================================================

  async createSubscriptionSchedule(
    params: Stripe.SubscriptionScheduleCreateParams
  ): Promise<Stripe.SubscriptionSchedule> {
    const client = this.requireClient();
    return client.subscriptionSchedules.create(params);
  }

  async updateSubscriptionSchedule(
    id: string,
    params: Stripe.SubscriptionScheduleUpdateParams
  ): Promise<Stripe.SubscriptionSchedule> {
    const client = this.requireClient();
    return client.subscriptionSchedules.update(id, params);
  }

  async releaseSubscriptionSchedule(
    id: string,
    params?: Stripe.SubscriptionScheduleReleaseParams
  ): Promise<Stripe.SubscriptionSchedule> {
    const client = this.requireClient();
    return client.subscriptionSchedules.release(id, params);
  }

  async cancelSubscriptionSchedule(
    id: string,
    params?: Stripe.SubscriptionScheduleCancelParams
  ): Promise<Stripe.SubscriptionSchedule> {
    const client = this.requireClient();
    return client.subscriptionSchedules.cancel(id, params);
  }

  // =========================================================================
  // SUBSCRIPTION OPERATIONS
  // =========================================================================

  async createSubscription(
    params: Stripe.SubscriptionCreateParams
  ): Promise<Stripe.Subscription> {
    const client = this.requireClient();
    return client.subscriptions.create(params);
  }

  async updateSubscription(
    id: string,
    params: Stripe.SubscriptionUpdateParams
  ): Promise<Stripe.Subscription> {
    const client = this.requireClient();
    return client.subscriptions.update(id, params);
  }

  async cancelSubscription(
    id: string,
    params?: Stripe.SubscriptionCancelParams
  ): Promise<Stripe.Subscription> {
    const client = this.requireClient();
    return client.subscriptions.cancel(id, params);
  }

  // =========================================================================
  // INVOICE OPERATIONS
  // =========================================================================

  async createInvoice(
    params: Stripe.InvoiceCreateParams
  ): Promise<Stripe.Invoice> {
    const client = this.requireClient();
    return client.invoices.create(params);
  }

  async finalizeInvoice(
    id: string,
    params?: Stripe.InvoiceFinalizeInvoiceParams
  ): Promise<Stripe.Invoice> {
    const client = this.requireClient();
    return client.invoices.finalizeInvoice(id, params);
  }

  async payInvoice(
    id: string,
    params?: Stripe.InvoicePayParams
  ): Promise<Stripe.Invoice> {
    const client = this.requireClient();
    return client.invoices.pay(id, params);
  }

  // =========================================================================
  // CHECKOUT SESSION OPERATIONS (V6.2.1)
  // =========================================================================

  async createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams
  ): Promise<Stripe.Checkout.Session> {
    const client = this.requireClient();
    return client.checkout.sessions.create(params);
  }

  async retrieveCheckoutSession(
    sessionId: string,
    params?: Stripe.Checkout.SessionRetrieveParams
  ): Promise<Stripe.Checkout.Session> {
    const client = this.requireClient();
    return client.checkout.sessions.retrieve(sessionId, params);
  }

  // =========================================================================
  // USAGE-BASED BILLING (Billing Meters API - Stripe v20+)
  // =========================================================================

  async createMeterEvent(
    params: Stripe.Billing.MeterEventCreateParams
  ): Promise<Stripe.Billing.MeterEvent> {
    const client = this.requireClient();
    return client.billing.meterEvents.create(params);
  }

  // =========================================================================
  // WEBHOOK VERIFICATION
  // =========================================================================

  constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    const client = this.requireClient();
    const secret = STRIPE_CONFIG.webhookSigningSecret;

    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    return client.webhooks.constructEvent(payload, signature, secret);
  }
}

// Export lazy singleton getter - prevents instantiation at build time
// The singleton is only created when actually used at runtime
let _instance: StripeClientService | null = null;

export const stripeClientService = {
  getInstance(): StripeClientService {
    if (!_instance) {
      _instance = StripeClientService.getInstance();
    }
    return _instance;
  },

  // Proxy methods for convenience (delegate to actual instance)
  isConfigured(): boolean {
    return this.getInstance().isConfigured();
  },

  getClient() {
    return this.getInstance().getClient();
  },

  constructWebhookEvent(payload: string | Buffer, signature: string) {
    return this.getInstance().constructWebhookEvent(payload, signature);
  },

  createCustomer(params: Parameters<StripeClientService["createCustomer"]>[0]) {
    return this.getInstance().createCustomer(params);
  },

  updateCustomer(
    id: string,
    params: Parameters<StripeClientService["updateCustomer"]>[1]
  ) {
    return this.getInstance().updateCustomer(id, params);
  },

  createSubscriptionSchedule(
    params: Parameters<StripeClientService["createSubscriptionSchedule"]>[0]
  ) {
    return this.getInstance().createSubscriptionSchedule(params);
  },

  updateSubscriptionSchedule(
    id: string,
    params: Parameters<StripeClientService["updateSubscriptionSchedule"]>[1]
  ) {
    return this.getInstance().updateSubscriptionSchedule(id, params);
  },

  releaseSubscriptionSchedule(
    id: string,
    params?: Parameters<StripeClientService["releaseSubscriptionSchedule"]>[1]
  ) {
    return this.getInstance().releaseSubscriptionSchedule(id, params);
  },

  cancelSubscriptionSchedule(
    id: string,
    params?: Parameters<StripeClientService["cancelSubscriptionSchedule"]>[1]
  ) {
    return this.getInstance().cancelSubscriptionSchedule(id, params);
  },

  createSubscription(
    params: Parameters<StripeClientService["createSubscription"]>[0]
  ) {
    return this.getInstance().createSubscription(params);
  },

  updateSubscription(
    id: string,
    params: Parameters<StripeClientService["updateSubscription"]>[1]
  ) {
    return this.getInstance().updateSubscription(id, params);
  },

  cancelSubscription(
    id: string,
    params?: Parameters<StripeClientService["cancelSubscription"]>[1]
  ) {
    return this.getInstance().cancelSubscription(id, params);
  },

  createInvoice(params: Parameters<StripeClientService["createInvoice"]>[0]) {
    return this.getInstance().createInvoice(params);
  },

  finalizeInvoice(
    id: string,
    params?: Parameters<StripeClientService["finalizeInvoice"]>[1]
  ) {
    return this.getInstance().finalizeInvoice(id, params);
  },

  payInvoice(
    id: string,
    params?: Parameters<StripeClientService["payInvoice"]>[1]
  ) {
    return this.getInstance().payInvoice(id, params);
  },

  createMeterEvent(
    params: Parameters<StripeClientService["createMeterEvent"]>[0]
  ) {
    return this.getInstance().createMeterEvent(params);
  },

  // V6.2.1: Checkout Session methods
  createCheckoutSession(
    params: Parameters<StripeClientService["createCheckoutSession"]>[0]
  ) {
    return this.getInstance().createCheckoutSession(params);
  },

  retrieveCheckoutSession(
    sessionId: string,
    params?: Parameters<StripeClientService["retrieveCheckoutSession"]>[1]
  ) {
    return this.getInstance().retrieveCheckoutSession(sessionId, params);
  },
};
