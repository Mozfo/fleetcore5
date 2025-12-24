/**
 * Stripe Services Module
 *
 * Ce module fournit tous les services pour l'intégration Stripe.
 *
 * Services disponibles :
 * - StripeClientService : Client Stripe singleton (wrapper API)
 * - ScheduleSyncService : Sync FleetCore → Stripe (Schedules)
 * - AmendmentSyncService : Sync FleetCore → Stripe (Amendments)
 * - WebhookHandlerService : Handler webhooks Stripe → FleetCore
 *
 * Configuration :
 * - Voir lib/config/stripe.config.ts pour la configuration
 * - Support stripe-mock via STRIPE_API_BASE
 *
 * Usage :
 * ```typescript
 * import {
 *   stripeClientService,
 *   scheduleSyncService,
 *   amendmentSyncService,
 *   webhookHandlerService,
 * } from '@/lib/services/stripe';
 * ```
 */

// ============================================================================
// SERVICES (Singletons)
// ============================================================================

export {
  StripeClientService,
  stripeClientService,
} from "./stripe-client.service";

export {
  ScheduleSyncService,
  scheduleSyncService,
} from "./schedule-sync.service";

export {
  AmendmentSyncService,
  amendmentSyncService,
} from "./amendment-sync.service";

export {
  WebhookHandlerService,
  webhookHandlerService,
} from "./webhook-handler.service";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// From schedule-sync.service
export type {
  ScheduleSyncData,
  SchedulePhaseData,
  ScheduleSyncResult,
} from "./schedule-sync.service";

// From amendment-sync.service
export type {
  AmendmentApplyData,
  AmendmentResult,
  ProrationData,
} from "./amendment-sync.service";

// From webhook-handler.service
export type {
  WebhookHandlerResult,
  WebhookLogData,
  SupportedEventType,
} from "./webhook-handler.service";

// ============================================================================
// RE-EXPORT CONFIG HELPERS (pour convenance)
// ============================================================================

export {
  STRIPE_CONFIG,
  STRIPE_API_VERSION,
  createFleetCoreMetadata,
  extractFleetCoreIds,
  isStripeConfigured,
  isStripeMockMode,
} from "@/lib/config/stripe.config";
