/**
 * Configuration Stripe pour FleetCore
 *
 * DÉVELOPPEMENT/TESTS:
 *   - Utiliser stripe-mock : docker run -p 12111:12111 stripe/stripe-mock
 *   - Définir STRIPE_API_BASE=http://localhost:12111
 *   - STRIPE_SECRET_KEY peut être n'importe quelle valeur sk_test_*
 *
 * PRODUCTION:
 *   - Utiliser les vraies clés Stripe
 *   - Ne PAS définir STRIPE_API_BASE (utilise api.stripe.com par défaut)
 */

// API Version - doit correspondre à la version supportée par le package stripe v20.0.0
export const STRIPE_API_VERSION = "2025-11-17.clover" as const;

export const STRIPE_CONFIG = {
  // API Configuration
  apiVersion: STRIPE_API_VERSION,
  maxNetworkRetries: 3,
  timeout: 30000, // 30 secondes

  // Mock server configuration (pour développement/tests)
  // Si STRIPE_API_BASE est défini, le client pointera vers ce serveur
  apiBase: process.env.STRIPE_API_BASE || undefined,

  // Webhook configuration
  webhookSigningSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // Metadata keys - utilisés pour lier les objets Stripe aux entités FleetCore
  metadataKeys: {
    tenantId: "fleetcore_tenant_id",
    orderId: "fleetcore_order_id",
    scheduleId: "fleetcore_schedule_id",
    amendmentId: "fleetcore_amendment_id",
    subscriptionId: "fleetcore_subscription_id",
    environment: "fleetcore_environment",
  },

  // Préfixes pour les références (pour identifier les objets FleetCore dans Stripe)
  referencePrefix: "FC",

  // Feature flags
  features: {
    // Activer/désactiver la synchronisation automatique avec Stripe
    autoSync: process.env.STRIPE_AUTO_SYNC === "true",
    // Activer/désactiver les webhooks
    webhooksEnabled: process.env.STRIPE_WEBHOOKS_ENABLED !== "false",
    // Mode strict : échoue si Stripe n'est pas configuré
    strictMode: process.env.NODE_ENV === "production",
  },
} as const;

// Type pour les metadata keys
export type StripeMetadataKey = keyof typeof STRIPE_CONFIG.metadataKeys;

// Helper pour créer les metadata FleetCore
export function createFleetCoreMetadata(data: {
  tenantId?: string;
  orderId?: string;
  scheduleId?: string;
  amendmentId?: string;
  subscriptionId?: string;
}): Record<string, string> {
  const metadata: Record<string, string> = {
    [STRIPE_CONFIG.metadataKeys.environment]:
      process.env.NODE_ENV || "development",
  };

  if (data.tenantId) {
    metadata[STRIPE_CONFIG.metadataKeys.tenantId] = data.tenantId;
  }
  if (data.orderId) {
    metadata[STRIPE_CONFIG.metadataKeys.orderId] = data.orderId;
  }
  if (data.scheduleId) {
    metadata[STRIPE_CONFIG.metadataKeys.scheduleId] = data.scheduleId;
  }
  if (data.amendmentId) {
    metadata[STRIPE_CONFIG.metadataKeys.amendmentId] = data.amendmentId;
  }
  if (data.subscriptionId) {
    metadata[STRIPE_CONFIG.metadataKeys.subscriptionId] = data.subscriptionId;
  }

  return metadata;
}

// Helper pour extraire les IDs FleetCore depuis les metadata Stripe
export function extractFleetCoreIds(
  metadata: Record<string, string> | null | undefined
): {
  tenantId?: string;
  orderId?: string;
  scheduleId?: string;
  amendmentId?: string;
  subscriptionId?: string;
} {
  if (!metadata) return {};

  return {
    tenantId: metadata[STRIPE_CONFIG.metadataKeys.tenantId],
    orderId: metadata[STRIPE_CONFIG.metadataKeys.orderId],
    scheduleId: metadata[STRIPE_CONFIG.metadataKeys.scheduleId],
    amendmentId: metadata[STRIPE_CONFIG.metadataKeys.amendmentId],
    subscriptionId: metadata[STRIPE_CONFIG.metadataKeys.subscriptionId],
  };
}

// Vérifier si Stripe est configuré
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Vérifier si on utilise le mock server
export function isStripeMockMode(): boolean {
  return !!process.env.STRIPE_API_BASE;
}
