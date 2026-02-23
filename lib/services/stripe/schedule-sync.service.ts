/**
 * Schedule Sync Service
 *
 * Synchronise les SubscriptionSchedules de FleetCore vers Stripe.
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
 * Input pour syncScheduleToStripe
 */
export interface ScheduleSyncData {
  // IDs FleetCore
  tenantId: string;
  scheduleId: string; // ID FleetCore du schedule
  orderId?: string;

  // Customer Stripe (doit déjà exister)
  stripeCustomerId: string;

  // Phases à créer
  phases: SchedulePhaseData[];

  // Comportement à la fin
  endBehavior: "release" | "cancel" | "none";

  // ID Stripe existant (pour update) - optionnel
  stripeScheduleId?: string;
}

/**
 * Données d'une phase
 */
export interface SchedulePhaseData {
  // Price Stripe (doit déjà exister)
  stripePriceId: string;

  // Dates
  startDate: Date;
  endDate?: Date; // optionnel si c'est la dernière phase

  // Quantité
  quantity?: number;

  // Essai gratuit (uniquement première phase)
  trialDays?: number;

  // Remise (pourcentage)
  discountPercent?: number;

  // Metadata spécifique à cette phase
  metadata?: Record<string, string>;
}

/**
 * Résultat de la synchronisation
 */
export interface ScheduleSyncResult {
  success: boolean;
  stripeScheduleId: string;
  stripeSubscriptionId?: string; // Si schedule déjà actif
  phases: {
    startDate: Date;
    endDate?: Date;
    stripePriceId: string;
  }[];
  error?: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export class ScheduleSyncService {
  private static instance: ScheduleSyncService;

  private constructor() {}

  public static getInstance(): ScheduleSyncService {
    if (!ScheduleSyncService.instance) {
      ScheduleSyncService.instance = new ScheduleSyncService();
    }
    return ScheduleSyncService.instance;
  }

  /**
   * Synchronise un schedule FleetCore vers Stripe
   * Crée un nouveau schedule ou met à jour un existant
   */
  async syncScheduleToStripe(
    data: ScheduleSyncData
  ): Promise<ScheduleSyncResult> {
    // Vérifier que Stripe est configuré
    if (!stripeClientService.isConfigured()) {
      return {
        success: false,
        stripeScheduleId: "",
        phases: [],
        error: "Stripe not configured",
      };
    }

    try {
      // Construire les metadata FleetCore
      const metadata = createFleetCoreMetadata({
        tenantId: data.tenantId,
        scheduleId: data.scheduleId,
        orderId: data.orderId,
      });

      // Convertir les phases au format Stripe
      const stripePhases = this.convertPhasesToStripe(data.phases);

      // Mapper end_behavior
      const endBehavior = this.mapEndBehavior(data.endBehavior);

      if (data.stripeScheduleId) {
        // UPDATE existing schedule
        const schedule = await stripeClientService.updateSubscriptionSchedule(
          data.stripeScheduleId,
          {
            phases: stripePhases,
            end_behavior: endBehavior,
            metadata,
          }
        );

        logger.info(
          { scheduleId: data.scheduleId, stripeScheduleId: schedule.id },
          "[ScheduleSync] Updated schedule in Stripe"
        );

        return this.buildResult(schedule);
      } else {
        // CREATE new schedule
        const schedule = await stripeClientService.createSubscriptionSchedule({
          customer: data.stripeCustomerId,
          start_date: this.toUnixTimestamp(data.phases[0]?.startDate),
          phases: stripePhases,
          end_behavior: endBehavior,
          metadata,
        });

        logger.info(
          { scheduleId: data.scheduleId, stripeScheduleId: schedule.id },
          "[ScheduleSync] Created schedule in Stripe"
        );

        return this.buildResult(schedule);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, scheduleId: data.scheduleId },
        "[ScheduleSync] Failed to sync schedule to Stripe"
      );

      return {
        success: false,
        stripeScheduleId: data.stripeScheduleId || "",
        phases: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Met à jour les phases d'un schedule existant
   */
  async updateSchedulePhases(
    stripeScheduleId: string,
    phases: SchedulePhaseData[],
    metadata?: Record<string, string>
  ): Promise<ScheduleSyncResult> {
    if (!stripeClientService.isConfigured()) {
      return {
        success: false,
        stripeScheduleId,
        phases: [],
        error: "Stripe not configured",
      };
    }

    try {
      const stripePhases = this.convertPhasesToStripe(phases);

      const schedule = await stripeClientService.updateSubscriptionSchedule(
        stripeScheduleId,
        {
          phases: stripePhases,
          ...(metadata && { metadata }),
        }
      );

      logger.info(
        { stripeScheduleId, phasesCount: phases.length },
        "[ScheduleSync] Updated schedule phases"
      );

      return this.buildResult(schedule);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, stripeScheduleId },
        "[ScheduleSync] Failed to update schedule phases"
      );

      return {
        success: false,
        stripeScheduleId,
        phases: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Libère un schedule (le convertit en subscription standard)
   */
  async releaseSchedule(
    stripeScheduleId: string,
    preserveCancelDate?: boolean
  ): Promise<ScheduleSyncResult> {
    if (!stripeClientService.isConfigured()) {
      return {
        success: false,
        stripeScheduleId,
        phases: [],
        error: "Stripe not configured",
      };
    }

    try {
      const schedule = await stripeClientService.releaseSubscriptionSchedule(
        stripeScheduleId,
        preserveCancelDate ? { preserve_cancel_date: true } : undefined
      );

      logger.info(
        { stripeScheduleId, status: schedule.status },
        "[ScheduleSync] Released schedule"
      );

      return this.buildResult(schedule);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, stripeScheduleId },
        "[ScheduleSync] Failed to release schedule"
      );

      return {
        success: false,
        stripeScheduleId,
        phases: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Annule un schedule
   */
  async cancelSchedule(
    stripeScheduleId: string,
    invoiceNow?: boolean,
    prorate?: boolean
  ): Promise<ScheduleSyncResult> {
    if (!stripeClientService.isConfigured()) {
      return {
        success: false,
        stripeScheduleId,
        phases: [],
        error: "Stripe not configured",
      };
    }

    try {
      const params: Stripe.SubscriptionScheduleCancelParams = {};
      if (invoiceNow !== undefined) {
        params.invoice_now = invoiceNow;
      }
      if (prorate !== undefined) {
        params.prorate = prorate;
      }

      const schedule = await stripeClientService.cancelSubscriptionSchedule(
        stripeScheduleId,
        Object.keys(params).length > 0 ? params : undefined
      );

      logger.info(
        { stripeScheduleId, status: schedule.status },
        "[ScheduleSync] Canceled schedule"
      );

      return this.buildResult(schedule);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, stripeScheduleId },
        "[ScheduleSync] Failed to cancel schedule"
      );

      return {
        success: false,
        stripeScheduleId,
        phases: [],
        error: errorMessage,
      };
    }
  }

  // =========================================================================
  // HELPERS PRIVÉS
  // =========================================================================

  /**
   * Convertit les phases FleetCore au format Stripe
   *
   * Note: Dans Stripe SubscriptionSchedule:
   * - La première phase commence à la date start_date du schedule
   * - Les phases suivantes commencent automatiquement quand la précédente se termine
   * - Chaque phase doit avoir end_date, iterations, ou duration
   */
  private convertPhasesToStripe(
    phases: SchedulePhaseData[]
  ): Stripe.SubscriptionScheduleCreateParams.Phase[] {
    return phases.map((phase, index) => {
      const stripePhase: Stripe.SubscriptionScheduleCreateParams.Phase = {
        items: [
          {
            price: phase.stripePriceId,
            ...(phase.quantity && { quantity: phase.quantity }),
          },
        ],
        ...(phase.metadata && { metadata: phase.metadata }),
      };

      // End date - requis pour définir la durée de la phase
      // (sauf dernière phase si end_behavior = release)
      if (phase.endDate) {
        stripePhase.end_date = this.toUnixTimestamp(phase.endDate);
      }

      // Trial (uniquement première phase)
      if (index === 0 && phase.trialDays && phase.trialDays > 0) {
        const trialEnd = new Date(phase.startDate);
        trialEnd.setDate(trialEnd.getDate() + phase.trialDays);
        stripePhase.trial_end = this.toUnixTimestamp(trialEnd);
      }

      // Remise (via coupon)
      if (phase.discountPercent && phase.discountPercent > 0) {
        // Note: Pour utiliser des remises, il faut créer un coupon Stripe au préalable
        // Ici on ajoute juste le metadata pour tracking
        stripePhase.metadata = {
          ...stripePhase.metadata,
          discount_percent: phase.discountPercent.toString(),
        };
      }

      return stripePhase;
    });
  }

  /**
   * Mappe le comportement de fin FleetCore vers Stripe
   */
  private mapEndBehavior(
    behavior: "release" | "cancel" | "none"
  ): Stripe.SubscriptionScheduleCreateParams.EndBehavior {
    const map: Record<
      string,
      Stripe.SubscriptionScheduleCreateParams.EndBehavior
    > = {
      release: "release",
      cancel: "cancel",
      none: "none",
    };
    return map[behavior] || "cancel";
  }

  /**
   * Construit le résultat à partir de la réponse Stripe
   */
  private buildResult(
    schedule: Stripe.SubscriptionSchedule
  ): ScheduleSyncResult {
    // Extraire l'ID de subscription si présent
    let stripeSubscriptionId: string | undefined;
    if (schedule.subscription) {
      stripeSubscriptionId =
        typeof schedule.subscription === "string"
          ? schedule.subscription
          : schedule.subscription.id;
    }

    // Mapper les phases
    const phases = schedule.phases.map((phase) => {
      const item = phase.items[0];
      const stripePriceId =
        typeof item.price === "string" ? item.price : item.price?.id || "";

      return {
        startDate: new Date(phase.start_date * 1000),
        endDate: phase.end_date ? new Date(phase.end_date * 1000) : undefined,
        stripePriceId,
      };
    });

    return {
      success: true,
      stripeScheduleId: schedule.id,
      stripeSubscriptionId,
      phases,
    };
  }

  /**
   * Convertit une Date en timestamp Unix (secondes)
   */
  private toUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }
}

// Export singleton
export const scheduleSyncService = ScheduleSyncService.getInstance();
