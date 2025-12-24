/**
 * Amendment Sync Service
 *
 * Applique les Amendments FleetCore sur Stripe.
 * Gère les changements de plan, quantité, et cycle de facturation.
 * Direction: FleetCore → Stripe uniquement
 */

import Stripe from "stripe";
import { stripeClientService } from "./stripe-client.service";
import { createFleetCoreMetadata } from "@/lib/config/stripe.config";
import { logger } from "@/lib/logger";

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Input pour applyAmendmentToStripe
 */
export interface AmendmentApplyData {
  // IDs FleetCore
  providerId: string;
  tenantId: string;
  amendmentId: string;
  subscriptionId: string; // ID FleetCore

  // ID Stripe de la subscription à modifier
  stripeSubscriptionId: string;

  // Type d'amendment
  amendmentType:
    | "upgrade"
    | "downgrade"
    | "plan_change"
    | "quantity_change"
    | "billing_change";

  // Nouvelles valeurs (selon le type)
  newPriceId?: string; // Pour upgrade/downgrade/plan_change
  newQuantity?: number; // Pour quantity_change
  newBillingInterval?: "month" | "year"; // Pour billing_change

  // Comportement de prorata
  prorationBehavior: "create_prorations" | "none" | "always_invoice";

  // Appliquer immédiatement ou à la prochaine période
  effectiveImmediately: boolean;

  // Date d'effet (si pas immédiat)
  effectiveDate?: Date;
}

/**
 * Résultat de l'application d'un amendment
 */
export interface AmendmentResult {
  success: boolean;
  subscription?: Stripe.Subscription;
  prorationInvoice?: Stripe.Invoice;
  error?: string;

  // Détails du changement
  changes: {
    previousPriceId?: string;
    newPriceId?: string;
    previousQuantity?: number;
    newQuantity?: number;
    prorationAmount?: number; // En centimes
  };
}

/**
 * Données pour créer une facture de prorata
 */
export interface ProrationData {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  description: string;
  amount: number; // En centimes, peut être négatif (crédit)
  metadata: Record<string, string>;
}

// =============================================================================
// SERVICE
// =============================================================================

export class AmendmentSyncService {
  private static instance: AmendmentSyncService;

  private constructor() {}

  public static getInstance(): AmendmentSyncService {
    if (!AmendmentSyncService.instance) {
      AmendmentSyncService.instance = new AmendmentSyncService();
    }
    return AmendmentSyncService.instance;
  }

  /**
   * Point d'entrée principal - dispatch selon le type d'amendment
   */
  async applyAmendmentToStripe(
    data: AmendmentApplyData
  ): Promise<AmendmentResult> {
    // Vérifier Stripe configuré
    if (!stripeClientService.isConfigured()) {
      return {
        success: false,
        error: "Stripe not configured",
        changes: {},
      };
    }

    try {
      logger.info(
        { amendmentId: data.amendmentId, type: data.amendmentType },
        "[AmendmentSync] Applying amendment to Stripe"
      );

      switch (data.amendmentType) {
        case "upgrade":
        case "downgrade":
        case "plan_change":
          return this.handleUpgradeDowngrade(data);

        case "quantity_change":
          return this.handleQuantityChange(data);

        case "billing_change":
          return this.handleBillingChange(data);

        default:
          return {
            success: false,
            error: `Unknown amendment type: ${data.amendmentType}`,
            changes: {},
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, amendmentId: data.amendmentId },
        "[AmendmentSync] Failed to apply amendment to Stripe"
      );
      return {
        success: false,
        error: errorMessage,
        changes: {},
      };
    }
  }

  /**
   * Gère les changements de plan (upgrade/downgrade)
   */
  async handleUpgradeDowngrade(
    data: AmendmentApplyData
  ): Promise<AmendmentResult> {
    if (!stripeClientService.isConfigured()) {
      return {
        success: false,
        error: "Stripe not configured",
        changes: {},
      };
    }

    if (!data.newPriceId) {
      return {
        success: false,
        error: "newPriceId is required for upgrade/downgrade",
        changes: {},
      };
    }

    try {
      // 1. Récupérer le subscription item actuel
      const subscriptionItem = await this.getSubscriptionItem(
        data.stripeSubscriptionId
      );

      if (!subscriptionItem) {
        return {
          success: false,
          error: "Could not find subscription item",
          changes: {},
        };
      }

      // Extraire le price ID précédent
      const previousPriceId =
        typeof subscriptionItem.price === "string"
          ? subscriptionItem.price
          : subscriptionItem.price.id;

      // 2. Construire les paramètres de mise à jour
      const updateParams: Stripe.SubscriptionUpdateParams = {
        items: [
          {
            id: subscriptionItem.id,
            price: data.newPriceId,
          },
        ],
        proration_behavior: this.mapProrationBehavior(data.prorationBehavior),
        metadata: this.buildAmendmentMetadata(data),
      };

      // 3. Gérer la date d'effet
      if (!data.effectiveImmediately && data.effectiveDate) {
        updateParams.proration_date = Math.floor(
          data.effectiveDate.getTime() / 1000
        );
      }

      // 4. Appliquer la mise à jour
      const subscription = await stripeClientService.updateSubscription(
        data.stripeSubscriptionId,
        updateParams
      );

      logger.info(
        {
          amendmentId: data.amendmentId,
          subscriptionId: subscription.id,
          previousPriceId,
          newPriceId: data.newPriceId,
        },
        "[AmendmentSync] Applied upgrade/downgrade"
      );

      return {
        success: true,
        subscription,
        changes: {
          previousPriceId,
          newPriceId: data.newPriceId,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, amendmentId: data.amendmentId },
        "[AmendmentSync] Failed to apply upgrade/downgrade"
      );
      return {
        success: false,
        error: errorMessage,
        changes: {},
      };
    }
  }

  /**
   * Gère les changements de quantité
   */
  async handleQuantityChange(
    data: AmendmentApplyData
  ): Promise<AmendmentResult> {
    if (!stripeClientService.isConfigured()) {
      return {
        success: false,
        error: "Stripe not configured",
        changes: {},
      };
    }

    if (data.newQuantity === undefined || data.newQuantity < 0) {
      return {
        success: false,
        error: "newQuantity is required and must be >= 0",
        changes: {},
      };
    }

    try {
      // 1. Récupérer le subscription item actuel
      const subscriptionItem = await this.getSubscriptionItem(
        data.stripeSubscriptionId
      );

      if (!subscriptionItem) {
        return {
          success: false,
          error: "Could not find subscription item",
          changes: {},
        };
      }

      const previousQuantity = subscriptionItem.quantity || 1;

      // 2. Construire les paramètres de mise à jour
      const updateParams: Stripe.SubscriptionUpdateParams = {
        items: [
          {
            id: subscriptionItem.id,
            quantity: data.newQuantity,
          },
        ],
        proration_behavior: this.mapProrationBehavior(data.prorationBehavior),
        metadata: this.buildAmendmentMetadata(data),
      };

      // 3. Gérer la date d'effet
      if (!data.effectiveImmediately && data.effectiveDate) {
        updateParams.proration_date = Math.floor(
          data.effectiveDate.getTime() / 1000
        );
      }

      // 4. Appliquer la mise à jour
      const subscription = await stripeClientService.updateSubscription(
        data.stripeSubscriptionId,
        updateParams
      );

      logger.info(
        {
          amendmentId: data.amendmentId,
          subscriptionId: subscription.id,
          previousQuantity,
          newQuantity: data.newQuantity,
        },
        "[AmendmentSync] Applied quantity change"
      );

      return {
        success: true,
        subscription,
        changes: {
          previousQuantity,
          newQuantity: data.newQuantity,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, amendmentId: data.amendmentId },
        "[AmendmentSync] Failed to apply quantity change"
      );
      return {
        success: false,
        error: errorMessage,
        changes: {},
      };
    }
  }

  /**
   * Gère les changements de cycle de facturation
   *
   * Note: Changer le billing interval nécessite un nouveau price avec
   * le nouvel interval. Le newPriceId doit être fourni avec le bon interval.
   */
  async handleBillingChange(
    data: AmendmentApplyData
  ): Promise<AmendmentResult> {
    if (!stripeClientService.isConfigured()) {
      return {
        success: false,
        error: "Stripe not configured",
        changes: {},
      };
    }

    if (!data.newPriceId) {
      return {
        success: false,
        error:
          "newPriceId is required for billing change (price with new interval)",
        changes: {},
      };
    }

    try {
      // 1. Récupérer le subscription item actuel
      const subscriptionItem = await this.getSubscriptionItem(
        data.stripeSubscriptionId
      );

      if (!subscriptionItem) {
        return {
          success: false,
          error: "Could not find subscription item",
          changes: {},
        };
      }

      const previousPriceId =
        typeof subscriptionItem.price === "string"
          ? subscriptionItem.price
          : subscriptionItem.price.id;

      // 2. Construire les paramètres de mise à jour
      const updateParams: Stripe.SubscriptionUpdateParams = {
        items: [
          {
            id: subscriptionItem.id,
            price: data.newPriceId,
          },
        ],
        proration_behavior: this.mapProrationBehavior(data.prorationBehavior),
        metadata: this.buildAmendmentMetadata(data),
      };

      // 3. Gérer la date d'effet - pour billing change, on peut vouloir
      // commencer le nouveau cycle à une date spécifique
      if (!data.effectiveImmediately && data.effectiveDate) {
        updateParams.proration_date = Math.floor(
          data.effectiveDate.getTime() / 1000
        );
      }

      // 4. Appliquer la mise à jour
      const subscription = await stripeClientService.updateSubscription(
        data.stripeSubscriptionId,
        updateParams
      );

      logger.info(
        {
          amendmentId: data.amendmentId,
          subscriptionId: subscription.id,
          previousPriceId,
          newPriceId: data.newPriceId,
          newBillingInterval: data.newBillingInterval,
        },
        "[AmendmentSync] Applied billing change"
      );

      return {
        success: true,
        subscription,
        changes: {
          previousPriceId,
          newPriceId: data.newPriceId,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, amendmentId: data.amendmentId },
        "[AmendmentSync] Failed to apply billing change"
      );
      return {
        success: false,
        error: errorMessage,
        changes: {},
      };
    }
  }

  /**
   * Crée une facture de prorata immédiate
   *
   * Utile pour facturer immédiatement un ajustement au lieu d'attendre
   * la prochaine facture récurrente.
   */
  async createProrationInvoice(
    data: ProrationData
  ): Promise<Stripe.Invoice | null> {
    if (!stripeClientService.isConfigured()) {
      logger.warn(
        "[AmendmentSync] Cannot create proration invoice - Stripe not configured"
      );
      return null;
    }

    try {
      // 1. Créer la facture
      const invoice = await stripeClientService.createInvoice({
        customer: data.stripeCustomerId,
        subscription: data.stripeSubscriptionId,
        description: data.description,
        metadata: data.metadata,
        auto_advance: false, // Ne pas envoyer automatiquement
      });

      // 2. Finaliser la facture pour la rendre payable
      const finalizedInvoice = await stripeClientService.finalizeInvoice(
        invoice.id
      );

      logger.info(
        {
          invoiceId: finalizedInvoice.id,
          amount: data.amount,
          subscriptionId: data.stripeSubscriptionId,
        },
        "[AmendmentSync] Created proration invoice"
      );

      return finalizedInvoice;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, customerId: data.stripeCustomerId },
        "[AmendmentSync] Failed to create proration invoice"
      );
      return null;
    }
  }

  // =========================================================================
  // HELPERS PRIVÉS
  // =========================================================================

  /**
   * Récupère le premier subscription item d'une subscription
   */
  private async getSubscriptionItem(
    stripeSubscriptionId: string
  ): Promise<Stripe.SubscriptionItem | null> {
    const client = stripeClientService.getClient();
    if (!client) {
      return null;
    }

    try {
      const subscription = await client.subscriptions.retrieve(
        stripeSubscriptionId,
        {
          expand: ["items.data.price"],
        }
      );

      // Retourner le premier item (la plupart des subscriptions n'ont qu'un item)
      if (subscription.items.data.length > 0) {
        return subscription.items.data[0];
      }

      return null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, stripeSubscriptionId },
        "[AmendmentSync] Failed to get subscription item"
      );
      return null;
    }
  }

  /**
   * Mappe le proration behavior FleetCore vers Stripe
   */
  private mapProrationBehavior(
    behavior: "create_prorations" | "none" | "always_invoice"
  ): Stripe.SubscriptionUpdateParams.ProrationBehavior {
    const map: Record<
      string,
      Stripe.SubscriptionUpdateParams.ProrationBehavior
    > = {
      create_prorations: "create_prorations",
      none: "none",
      always_invoice: "always_invoice",
    };
    return map[behavior] || "create_prorations";
  }

  /**
   * Construit les metadata pour l'amendment
   */
  private buildAmendmentMetadata(
    data: AmendmentApplyData
  ): Record<string, string> {
    const baseMetadata = createFleetCoreMetadata({
      providerId: data.providerId,
      tenantId: data.tenantId,
      amendmentId: data.amendmentId,
      subscriptionId: data.subscriptionId,
    });

    return {
      ...baseMetadata,
      amendment_type: data.amendmentType,
      effective_immediately: data.effectiveImmediately.toString(),
      ...(data.effectiveDate && {
        effective_date: data.effectiveDate.toISOString(),
      }),
    };
  }
}

// Export singleton
export const amendmentSyncService = AmendmentSyncService.getInstance();
