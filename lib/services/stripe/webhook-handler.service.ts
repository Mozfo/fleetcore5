/**
 * Webhook Handler Service
 *
 * Traite les webhooks Stripe et synchronise Stripe → FleetCore.
 * Direction: Stripe → FleetCore uniquement
 *
 * Responsabilités:
 * - Dispatcher les événements vers les handlers appropriés
 * - Logger tous les événements dans stripe_webhook_logs
 * - Extraire les IDs FleetCore depuis les metadata Stripe
 * - Mettre à jour les entités FleetCore correspondantes
 */

import Stripe from "stripe";
import { stripeClientService } from "./stripe-client.service";
import { extractFleetCoreIds } from "@/lib/config/stripe.config";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { customerConversionService } from "@/lib/services/billing/customer-conversion.service";

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Résultat du traitement d'un webhook
 */
export interface WebhookHandlerResult {
  success: boolean;
  eventType: string;
  eventId: string;
  action: string;
  error?: string;
  fleetcoreIds?: {
    providerId?: string;
    tenantId?: string;
    orderId?: string;
    scheduleId?: string;
    subscriptionId?: string;
  };
}

/**
 * Données pour logger un webhook
 */
export interface WebhookLogData {
  eventId: string;
  eventType: string;
  stripeObjectId: string;
  providerId?: string;
  tenantId?: string;
  status: "received" | "processing" | "processed" | "failed" | "ignored";
  errorMessage?: string;
  payload?: Record<string, unknown>;
}

/**
 * Types d'événements supportés
 */
export type SupportedEventType =
  // Checkout Session (V6.2.1)
  | "checkout.session.completed"
  // Subscription Schedule
  | "subscription_schedule.created"
  | "subscription_schedule.updated"
  | "subscription_schedule.completed"
  | "subscription_schedule.canceled"
  | "subscription_schedule.released"
  | "subscription_schedule.aborted"
  // Subscription
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "customer.subscription.trial_will_end"
  | "customer.subscription.pending_update_applied"
  | "customer.subscription.pending_update_expired"
  // Invoice
  | "invoice.created"
  | "invoice.finalized"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "invoice.upcoming"
  | "invoice.marked_uncollectible"
  // Payment Intent
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  // Customer
  | "customer.updated"
  | "customer.deleted"
  // Payment Method
  | "payment_method.attached"
  | "payment_method.detached"
  | "payment_method.updated";

// =============================================================================
// SERVICE
// =============================================================================

export class WebhookHandlerService {
  private static instance: WebhookHandlerService;

  private constructor() {}

  public static getInstance(): WebhookHandlerService {
    if (!WebhookHandlerService.instance) {
      WebhookHandlerService.instance = new WebhookHandlerService();
    }
    return WebhookHandlerService.instance;
  }

  // =========================================================================
  // MAIN HANDLER - Point d'entrée principal
  // =========================================================================

  /**
   * Traite un événement Stripe
   * Dispatcher vers le handler approprié selon le type d'événement
   *
   * V6.2.1: Added idempotence check via stripe_webhook_logs
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<WebhookHandlerResult> {
    const eventType = event.type as SupportedEventType;
    const eventId = event.id;

    logger.info(
      { eventId, eventType },
      "[WebhookHandler] Received Stripe webhook event"
    );

    // =========================================================================
    // IDEMPOTENCE CHECK (V6.2.1)
    // =========================================================================
    const idempotenceResult = await this.checkIdempotence(eventId, eventType);
    if (idempotenceResult.skip) {
      return {
        success: true,
        eventType,
        eventId,
        action: "skipped_duplicate",
      };
    }

    try {
      // Dispatcher vers le handler approprié
      switch (eventType) {
        // =====================================================================
        // CHECKOUT SESSION (V6.2.1)
        // =====================================================================
        case "checkout.session.completed":
          return this.handleCheckoutSessionCompleted(
            event,
            idempotenceResult.logId
          );

        // =====================================================================
        // SUBSCRIPTION SCHEDULE EVENTS (6)
        // =====================================================================
        case "subscription_schedule.created":
          return this.handleScheduleCreated(event);
        case "subscription_schedule.updated":
          return this.handleScheduleUpdated(event);
        case "subscription_schedule.completed":
          return this.handleScheduleCompleted(event);
        case "subscription_schedule.canceled":
          return this.handleScheduleCanceled(event);
        case "subscription_schedule.released":
          return this.handleScheduleReleased(event);
        case "subscription_schedule.aborted":
          return this.handleScheduleAborted(event);

        // =====================================================================
        // SUBSCRIPTION EVENTS (6)
        // =====================================================================
        case "customer.subscription.created":
          return this.handleSubscriptionCreated(event);
        case "customer.subscription.updated":
          return this.handleSubscriptionUpdated(event);
        case "customer.subscription.deleted":
          return this.handleSubscriptionDeleted(event);
        case "customer.subscription.trial_will_end":
          return this.handleTrialWillEnd(event);
        case "customer.subscription.pending_update_applied":
          return this.handlePendingUpdateApplied(event);
        case "customer.subscription.pending_update_expired":
          return this.handlePendingUpdateExpired(event);

        // =====================================================================
        // INVOICE EVENTS (6)
        // =====================================================================
        case "invoice.created":
          return this.handleInvoiceCreated(event);
        case "invoice.finalized":
          return this.handleInvoiceFinalized(event);
        case "invoice.paid":
          return this.handleInvoicePaid(event);
        case "invoice.payment_failed":
          return this.handleInvoicePaymentFailed(event);
        case "invoice.upcoming":
          return this.handleInvoiceUpcoming(event);
        case "invoice.marked_uncollectible":
          return this.handleInvoiceUncollectible(event);

        // =====================================================================
        // PAYMENT INTENT EVENTS (2)
        // =====================================================================
        case "payment_intent.succeeded":
          return this.handlePaymentSucceeded(event);
        case "payment_intent.payment_failed":
          return this.handlePaymentFailed(event);

        // =====================================================================
        // CUSTOMER EVENTS (2)
        // =====================================================================
        case "customer.updated":
          return this.handleCustomerUpdated(event);
        case "customer.deleted":
          return this.handleCustomerDeleted(event);

        // =====================================================================
        // PAYMENT METHOD EVENTS (3)
        // =====================================================================
        case "payment_method.attached":
          return this.handlePaymentMethodAttached(event);
        case "payment_method.detached":
          return this.handlePaymentMethodDetached(event);
        case "payment_method.updated":
          return this.handlePaymentMethodUpdated(event);

        default:
          logger.warn(
            { eventId, eventType },
            "[WebhookHandler] Unhandled event type"
          );
          return {
            success: true,
            eventType,
            eventId,
            action: "ignored",
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, eventId, eventType },
        "[WebhookHandler] Failed to handle webhook event"
      );
      return {
        success: false,
        eventType,
        eventId,
        action: "error",
        error: errorMessage,
      };
    }
  }

  // =========================================================================
  // SUBSCRIPTION SCHEDULE HANDLERS (6)
  // =========================================================================

  /**
   * subscription_schedule.created
   * Log et sync du status dans FleetCore
   */
  private async handleScheduleCreated(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const schedule = event.data.object as Stripe.SubscriptionSchedule;
    const fleetcoreIds = extractFleetCoreIds(schedule.metadata);

    logger.info(
      {
        eventId: event.id,
        scheduleId: schedule.id,
        fleetcoreIds,
      },
      "[WebhookHandler] Schedule created in Stripe"
    );

    // TODO: Sync avec FleetCore - mettre à jour bil_subscription_schedules
    // await this.syncScheduleToFleetCore(schedule, 'created');

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "schedule_created",
      fleetcoreIds,
    };
  }

  /**
   * subscription_schedule.updated
   * Sync des phases dans FleetCore
   */
  private async handleScheduleUpdated(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const schedule = event.data.object as Stripe.SubscriptionSchedule;
    const fleetcoreIds = extractFleetCoreIds(schedule.metadata);

    logger.info(
      {
        eventId: event.id,
        scheduleId: schedule.id,
        status: schedule.status,
        phasesCount: schedule.phases.length,
      },
      "[WebhookHandler] Schedule updated in Stripe"
    );

    // TODO: Sync avec FleetCore - mettre à jour phases
    // await this.syncSchedulePhasesToFleetCore(schedule);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "schedule_updated",
      fleetcoreIds,
    };
  }

  /**
   * subscription_schedule.completed
   * Marquer comme completed dans FleetCore
   */
  private async handleScheduleCompleted(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const schedule = event.data.object as Stripe.SubscriptionSchedule;
    const fleetcoreIds = extractFleetCoreIds(schedule.metadata);

    logger.info(
      {
        eventId: event.id,
        scheduleId: schedule.id,
      },
      "[WebhookHandler] Schedule completed"
    );

    // TODO: Marquer schedule completed dans FleetCore
    // await this.updateScheduleStatus(fleetcoreIds.scheduleId, 'completed');

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "schedule_completed",
      fleetcoreIds,
    };
  }

  /**
   * subscription_schedule.canceled
   * Marquer comme canceled dans FleetCore
   */
  private async handleScheduleCanceled(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const schedule = event.data.object as Stripe.SubscriptionSchedule;
    const fleetcoreIds = extractFleetCoreIds(schedule.metadata);

    logger.info(
      {
        eventId: event.id,
        scheduleId: schedule.id,
      },
      "[WebhookHandler] Schedule canceled"
    );

    // TODO: Marquer schedule canceled dans FleetCore
    // await this.updateScheduleStatus(fleetcoreIds.scheduleId, 'canceled');

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "schedule_canceled",
      fleetcoreIds,
    };
  }

  /**
   * subscription_schedule.released
   * Créer subscription dans FleetCore (schedule converti en subscription)
   */
  private async handleScheduleReleased(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const schedule = event.data.object as Stripe.SubscriptionSchedule;
    const fleetcoreIds = extractFleetCoreIds(schedule.metadata);

    // Récupérer l'ID de la subscription créée
    const subscriptionId =
      typeof schedule.subscription === "string"
        ? schedule.subscription
        : schedule.subscription?.id;

    logger.info(
      {
        eventId: event.id,
        scheduleId: schedule.id,
        subscriptionId,
      },
      "[WebhookHandler] Schedule released - subscription created"
    );

    // TODO: Créer subscription dans FleetCore
    // await this.createSubscriptionFromSchedule(schedule, subscriptionId);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "schedule_released",
      fleetcoreIds,
    };
  }

  /**
   * subscription_schedule.aborted
   * Marquer comme aborted dans FleetCore
   */
  private async handleScheduleAborted(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const schedule = event.data.object as Stripe.SubscriptionSchedule;
    const fleetcoreIds = extractFleetCoreIds(schedule.metadata);

    logger.info(
      {
        eventId: event.id,
        scheduleId: schedule.id,
      },
      "[WebhookHandler] Schedule aborted"
    );

    // TODO: Marquer schedule aborted dans FleetCore
    // await this.updateScheduleStatus(fleetcoreIds.scheduleId, 'aborted');

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "schedule_aborted",
      fleetcoreIds,
    };
  }

  // =========================================================================
  // SUBSCRIPTION HANDLERS (6)
  // =========================================================================

  /**
   * customer.subscription.created
   * Créer subscription dans FleetCore
   */
  private async handleSubscriptionCreated(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const subscription = event.data.object as Stripe.Subscription;
    const fleetcoreIds = extractFleetCoreIds(subscription.metadata);

    logger.info(
      {
        eventId: event.id,
        subscriptionId: subscription.id,
        status: subscription.status,
        fleetcoreIds,
      },
      "[WebhookHandler] Subscription created"
    );

    // TODO: Créer subscription dans FleetCore
    // await this.createSubscriptionInFleetCore(subscription);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "subscription_created",
      fleetcoreIds,
    };
  }

  /**
   * customer.subscription.updated
   * Sync status dans FleetCore
   */
  private async handleSubscriptionUpdated(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const subscription = event.data.object as Stripe.Subscription;
    const fleetcoreIds = extractFleetCoreIds(subscription.metadata);
    const previousAttributes = event.data
      .previous_attributes as Partial<Stripe.Subscription>;

    logger.info(
      {
        eventId: event.id,
        subscriptionId: subscription.id,
        status: subscription.status,
        previousStatus: previousAttributes?.status,
      },
      "[WebhookHandler] Subscription updated"
    );

    // TODO: Sync subscription status dans FleetCore
    // await this.syncSubscriptionToFleetCore(subscription, previousAttributes);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "subscription_updated",
      fleetcoreIds,
    };
  }

  /**
   * customer.subscription.deleted
   * Marquer deleted dans FleetCore
   */
  private async handleSubscriptionDeleted(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const subscription = event.data.object as Stripe.Subscription;
    const fleetcoreIds = extractFleetCoreIds(subscription.metadata);

    logger.info(
      {
        eventId: event.id,
        subscriptionId: subscription.id,
      },
      "[WebhookHandler] Subscription deleted"
    );

    // TODO: Marquer subscription deleted dans FleetCore
    // await this.markSubscriptionDeleted(fleetcoreIds.subscriptionId);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "subscription_deleted",
      fleetcoreIds,
    };
  }

  /**
   * customer.subscription.trial_will_end
   * Notifier que le trial se termine bientôt (3 jours avant)
   */
  private async handleTrialWillEnd(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const subscription = event.data.object as Stripe.Subscription;
    const fleetcoreIds = extractFleetCoreIds(subscription.metadata);

    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;

    logger.info(
      {
        eventId: event.id,
        subscriptionId: subscription.id,
        trialEnd,
      },
      "[WebhookHandler] Trial will end soon"
    );

    // TODO: Envoyer notification trial ending
    // await this.sendTrialEndingNotification(subscription, trialEnd);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "trial_will_end_notification",
      fleetcoreIds,
    };
  }

  /**
   * customer.subscription.pending_update_applied
   * Sync les changements appliqués
   */
  private async handlePendingUpdateApplied(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const subscription = event.data.object as Stripe.Subscription;
    const fleetcoreIds = extractFleetCoreIds(subscription.metadata);

    logger.info(
      {
        eventId: event.id,
        subscriptionId: subscription.id,
      },
      "[WebhookHandler] Pending update applied"
    );

    // TODO: Sync les changements dans FleetCore
    // await this.syncSubscriptionToFleetCore(subscription);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "pending_update_applied",
      fleetcoreIds,
    };
  }

  /**
   * customer.subscription.pending_update_expired
   * Log l'expiration du pending update
   */
  private async handlePendingUpdateExpired(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const subscription = event.data.object as Stripe.Subscription;
    const fleetcoreIds = extractFleetCoreIds(subscription.metadata);

    logger.warn(
      {
        eventId: event.id,
        subscriptionId: subscription.id,
      },
      "[WebhookHandler] Pending update expired - customer did not confirm"
    );

    // TODO: Log et potentiellement notifier
    // await this.logPendingUpdateExpired(subscription);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "pending_update_expired",
      fleetcoreIds,
    };
  }

  // =========================================================================
  // INVOICE HANDLERS (6)
  // =========================================================================

  /**
   * invoice.created
   * Créer invoice dans FleetCore
   */
  private async handleInvoiceCreated(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const invoice = event.data.object as Stripe.Invoice;
    const fleetcoreIds = extractFleetCoreIds(invoice.metadata);

    logger.info(
      {
        eventId: event.id,
        invoiceId: invoice.id,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
      },
      "[WebhookHandler] Invoice created"
    );

    // TODO: Créer invoice dans FleetCore
    // await this.createInvoiceInFleetCore(invoice);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "invoice_created",
      fleetcoreIds,
    };
  }

  /**
   * invoice.finalized
   * Marquer finalized dans FleetCore
   */
  private async handleInvoiceFinalized(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const invoice = event.data.object as Stripe.Invoice;
    const fleetcoreIds = extractFleetCoreIds(invoice.metadata);

    logger.info(
      {
        eventId: event.id,
        invoiceId: invoice.id,
        number: invoice.number,
      },
      "[WebhookHandler] Invoice finalized"
    );

    // TODO: Marquer invoice finalized dans FleetCore
    // await this.updateInvoiceStatus(invoice.id, 'finalized');

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "invoice_finalized",
      fleetcoreIds,
    };
  }

  /**
   * invoice.paid
   * Marquer paid dans FleetCore
   */
  private async handleInvoicePaid(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const invoice = event.data.object as Stripe.Invoice;
    const fleetcoreIds = extractFleetCoreIds(invoice.metadata);

    logger.info(
      {
        eventId: event.id,
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        paidAt: invoice.status_transitions?.paid_at,
      },
      "[WebhookHandler] Invoice paid"
    );

    // TODO: Marquer invoice paid dans FleetCore
    // await this.updateInvoiceStatus(invoice.id, 'paid');

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "invoice_paid",
      fleetcoreIds,
    };
  }

  /**
   * invoice.payment_failed
   * Notifier et gérer retry
   */
  private async handleInvoicePaymentFailed(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const invoice = event.data.object as Stripe.Invoice;
    const fleetcoreIds = extractFleetCoreIds(invoice.metadata);

    logger.warn(
      {
        eventId: event.id,
        invoiceId: invoice.id,
        attemptCount: invoice.attempt_count,
        nextPaymentAttempt: invoice.next_payment_attempt,
      },
      "[WebhookHandler] Invoice payment failed"
    );

    // TODO: Notifier et mettre à jour FleetCore
    // await this.handlePaymentFailure(invoice);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "invoice_payment_failed",
      fleetcoreIds,
    };
  }

  /**
   * invoice.upcoming
   * Notifier de la prochaine facture
   */
  private async handleInvoiceUpcoming(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const invoice = event.data.object as Stripe.Invoice;
    const fleetcoreIds = extractFleetCoreIds(invoice.metadata);

    // Extraire l'ID de subscription depuis parent.subscription_details (Stripe v20)
    const subscriptionDetails = invoice.parent?.subscription_details;
    const subscriptionId = subscriptionDetails
      ? typeof subscriptionDetails.subscription === "string"
        ? subscriptionDetails.subscription
        : subscriptionDetails.subscription?.id
      : undefined;

    logger.info(
      {
        eventId: event.id,
        subscriptionId,
        amountDue: invoice.amount_due,
      },
      "[WebhookHandler] Upcoming invoice"
    );

    // TODO: Envoyer notification upcoming invoice
    // await this.sendUpcomingInvoiceNotification(invoice);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "invoice_upcoming_notification",
      fleetcoreIds,
    };
  }

  /**
   * invoice.marked_uncollectible
   * Marquer uncollectible dans FleetCore
   */
  private async handleInvoiceUncollectible(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const invoice = event.data.object as Stripe.Invoice;
    const fleetcoreIds = extractFleetCoreIds(invoice.metadata);

    logger.warn(
      {
        eventId: event.id,
        invoiceId: invoice.id,
        amountDue: invoice.amount_due,
      },
      "[WebhookHandler] Invoice marked uncollectible"
    );

    // TODO: Marquer invoice uncollectible dans FleetCore
    // await this.updateInvoiceStatus(invoice.id, 'uncollectible');

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "invoice_marked_uncollectible",
      fleetcoreIds,
    };
  }

  // =========================================================================
  // PAYMENT INTENT HANDLERS (2)
  // =========================================================================

  /**
   * payment_intent.succeeded
   * Log payment success
   */
  private async handlePaymentSucceeded(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const fleetcoreIds = extractFleetCoreIds(paymentIntent.metadata);

    logger.info(
      {
        eventId: event.id,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      "[WebhookHandler] Payment succeeded"
    );

    // TODO: Log payment success dans FleetCore
    // await this.logPaymentSuccess(paymentIntent);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "payment_succeeded",
      fleetcoreIds,
    };
  }

  /**
   * payment_intent.payment_failed
   * Log et notifier payment failure
   */
  private async handlePaymentFailed(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const fleetcoreIds = extractFleetCoreIds(paymentIntent.metadata);

    const lastError = paymentIntent.last_payment_error;

    logger.warn(
      {
        eventId: event.id,
        paymentIntentId: paymentIntent.id,
        errorCode: lastError?.code,
        errorMessage: lastError?.message,
      },
      "[WebhookHandler] Payment failed"
    );

    // TODO: Log et notifier payment failure
    // await this.handlePaymentFailure(paymentIntent);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "payment_failed",
      fleetcoreIds,
    };
  }

  // =========================================================================
  // CUSTOMER HANDLERS (2)
  // =========================================================================

  /**
   * customer.updated
   * Sync customer dans FleetCore
   */
  private async handleCustomerUpdated(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const customer = event.data.object as Stripe.Customer;
    const fleetcoreIds = extractFleetCoreIds(customer.metadata);

    logger.info(
      {
        eventId: event.id,
        customerId: customer.id,
        email: customer.email,
      },
      "[WebhookHandler] Customer updated"
    );

    // TODO: Sync customer dans FleetCore
    // await this.syncCustomerToFleetCore(customer);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "customer_updated",
      fleetcoreIds,
    };
  }

  /**
   * customer.deleted
   * Marquer customer deleted dans FleetCore
   */
  private async handleCustomerDeleted(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const customer = event.data.object as Stripe.Customer;
    const fleetcoreIds = extractFleetCoreIds(customer.metadata);

    logger.info(
      {
        eventId: event.id,
        customerId: customer.id,
      },
      "[WebhookHandler] Customer deleted"
    );

    // TODO: Marquer customer deleted dans FleetCore
    // await this.markCustomerDeleted(fleetcoreIds);

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "customer_deleted",
      fleetcoreIds,
    };
  }

  // =========================================================================
  // PAYMENT METHOD HANDLERS (3)
  // =========================================================================

  /**
   * payment_method.attached
   * Log attachment
   */
  private async handlePaymentMethodAttached(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const paymentMethod = event.data.object as Stripe.PaymentMethod;

    const customerId =
      typeof paymentMethod.customer === "string"
        ? paymentMethod.customer
        : paymentMethod.customer?.id;

    logger.info(
      {
        eventId: event.id,
        paymentMethodId: paymentMethod.id,
        customerId,
        type: paymentMethod.type,
      },
      "[WebhookHandler] Payment method attached"
    );

    // TODO: Log payment method attachment
    // await this.logPaymentMethodChange(paymentMethod, 'attached');

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "payment_method_attached",
    };
  }

  /**
   * payment_method.detached
   * Log detachment
   */
  private async handlePaymentMethodDetached(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const paymentMethod = event.data.object as Stripe.PaymentMethod;

    logger.info(
      {
        eventId: event.id,
        paymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
      },
      "[WebhookHandler] Payment method detached"
    );

    // TODO: Log payment method detachment
    // await this.logPaymentMethodChange(paymentMethod, 'detached');

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "payment_method_detached",
    };
  }

  /**
   * payment_method.updated
   * Log update
   */
  private async handlePaymentMethodUpdated(
    event: Stripe.Event
  ): Promise<WebhookHandlerResult> {
    const paymentMethod = event.data.object as Stripe.PaymentMethod;

    const customerId =
      typeof paymentMethod.customer === "string"
        ? paymentMethod.customer
        : paymentMethod.customer?.id;

    logger.info(
      {
        eventId: event.id,
        paymentMethodId: paymentMethod.id,
        customerId,
        type: paymentMethod.type,
      },
      "[WebhookHandler] Payment method updated"
    );

    // TODO: Log payment method update
    // await this.logPaymentMethodChange(paymentMethod, 'updated');

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: "payment_method_updated",
    };
  }

  // =========================================================================
  // CHECKOUT SESSION HANDLER (V6.2.1)
  // =========================================================================

  /**
   * checkout.session.completed
   * Convert lead to customer after successful payment
   *
   * V6.2.1: Main handler for lead conversion flow
   */
  private async handleCheckoutSessionCompleted(
    event: Stripe.Event,
    webhookLogId?: string
  ): Promise<WebhookHandlerResult> {
    const session = event.data.object as Stripe.Checkout.Session;
    const startTime = Date.now();

    logger.info(
      {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        metadata: session.metadata,
      },
      "[WebhookHandler] Checkout session completed"
    );

    // Only process successful payments
    if (session.payment_status !== "paid") {
      logger.warn(
        { sessionId: session.id, paymentStatus: session.payment_status },
        "[WebhookHandler] Checkout session not paid - skipping conversion"
      );
      await this.updateWebhookLog(
        webhookLogId,
        "ignored",
        null,
        Date.now() - startTime
      );
      return {
        success: true,
        eventType: event.type,
        eventId: event.id,
        action: "checkout_not_paid",
      };
    }

    // Check if this session has leadId metadata (our payment links)
    if (!session.metadata?.leadId) {
      logger.info(
        { sessionId: session.id },
        "[WebhookHandler] No leadId in metadata - not a FleetCore lead checkout"
      );
      await this.updateWebhookLog(
        webhookLogId,
        "ignored",
        null,
        Date.now() - startTime
      );
      return {
        success: true,
        eventType: event.type,
        eventId: event.id,
        action: "no_lead_metadata",
      };
    }

    // Convert lead to customer
    const result =
      await customerConversionService.convertLeadToCustomer(session);

    if (!result.success) {
      await this.updateWebhookLog(
        webhookLogId,
        "failed",
        result.error,
        Date.now() - startTime
      );
      return {
        success: false,
        eventType: event.type,
        eventId: event.id,
        action: "conversion_failed",
        error: result.error,
      };
    }

    // Update webhook log as processed
    await this.updateWebhookLog(
      webhookLogId,
      "processed",
      null,
      Date.now() - startTime
    );

    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      action: result.alreadyConverted ? "already_converted" : "lead_converted",
      fleetcoreIds: {
        tenantId: result.tenantId,
      },
    };
  }

  // =========================================================================
  // IDEMPOTENCE METHODS (V6.2.1)
  // =========================================================================

  /**
   * Check idempotence via stripe_webhook_logs
   *
   * Returns { skip: true } if event was already processed
   * Returns { skip: false, logId } if new event (creates log entry)
   */
  private async checkIdempotence(
    eventId: string,
    eventType: string
  ): Promise<{ skip: boolean; logId?: string }> {
    try {
      // Check if event already exists
      const existingLog = await prisma.stripe_webhook_logs.findFirst({
        where: { event_id: eventId },
      });

      if (existingLog) {
        if (existingLog.status === "processed") {
          logger.info(
            { eventId, status: existingLog.status },
            "[WebhookHandler] Event already processed - idempotent skip"
          );
          return { skip: true };
        }

        // Event exists but not processed (maybe failed before)
        // Allow retry but don't create new log
        logger.info(
          { eventId, status: existingLog.status },
          "[WebhookHandler] Retrying previously failed event"
        );
        return { skip: false, logId: existingLog.id };
      }

      // Create new log entry with status 'processing'
      const newLog = await prisma.stripe_webhook_logs.create({
        data: {
          event_id: eventId,
          event_type: eventType,
          payload: {},
          status: "processing",
          processed_at: new Date(),
        },
      });

      return { skip: false, logId: newLog.id };
    } catch (error) {
      // If idempotence check fails, log but continue processing
      logger.error(
        { error, eventId },
        "[WebhookHandler] Idempotence check failed - continuing anyway"
      );
      return { skip: false };
    }
  }

  /**
   * Update webhook log status after processing
   */
  private async updateWebhookLog(
    logId: string | undefined,
    status: "processed" | "failed" | "ignored",
    errorMessage: string | null | undefined,
    durationMs: number
  ): Promise<void> {
    if (!logId) return;

    try {
      await prisma.stripe_webhook_logs.update({
        where: { id: logId },
        data: {
          status,
          error_message: errorMessage,
          processing_duration_ms: durationMs,
          processed_at: new Date(),
        },
      });
    } catch (error) {
      logger.error(
        { error, logId },
        "[WebhookHandler] Failed to update webhook log"
      );
    }
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Vérifie la signature d'un webhook Stripe
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event | null {
    if (!stripeClientService.isConfigured()) {
      logger.error(
        "[WebhookHandler] Cannot verify webhook - Stripe not configured"
      );
      return null;
    }

    try {
      return stripeClientService.constructWebhookEvent(payload, signature);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage },
        "[WebhookHandler] Webhook signature verification failed"
      );
      return null;
    }
  }

  /**
   * Liste des types d'événements supportés
   */
  getSupportedEventTypes(): SupportedEventType[] {
    return [
      // Checkout Session (V6.2.1)
      "checkout.session.completed",
      // Subscription Schedule
      "subscription_schedule.created",
      "subscription_schedule.updated",
      "subscription_schedule.completed",
      "subscription_schedule.canceled",
      "subscription_schedule.released",
      "subscription_schedule.aborted",
      // Subscription
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "customer.subscription.trial_will_end",
      "customer.subscription.pending_update_applied",
      "customer.subscription.pending_update_expired",
      // Invoice
      "invoice.created",
      "invoice.finalized",
      "invoice.paid",
      "invoice.payment_failed",
      "invoice.upcoming",
      "invoice.marked_uncollectible",
      // Payment Intent
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      // Customer
      "customer.updated",
      "customer.deleted",
      // Payment Method
      "payment_method.attached",
      "payment_method.detached",
      "payment_method.updated",
    ];
  }
}

// Export singleton
export const webhookHandlerService = WebhookHandlerService.getInstance();
