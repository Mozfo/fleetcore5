# FLEETCORE - SPÉCIFICATION QUOTE-TO-CASH ENTERPRISE

## PARTIE 2 : BILLING ENTERPRISE AVEC STRIPE

**Version :** 1.0.0  
**Date :** 06 Décembre 2025  
**Auteur :** Architecture FleetCore  
**Statut :** SPÉCIFICATION VALIDÉE

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble Billing Enterprise](#1-vue-densemble-billing-enterprise)
2. [Intégration Stripe - Architecture](#2-intégration-stripe---architecture)
3. [Table BIL_SUBSCRIPTION_SCHEDULES](#3-table-bil_subscription_schedules)
4. [Table BIL_SUBSCRIPTION_SCHEDULE_PHASES](#4-table-bil_subscription_schedule_phases)
5. [Table BIL_AMENDMENTS](#5-table-bil_amendments)
6. [Stripe Objects Mapping](#6-stripe-objects-mapping)
7. [Webhooks Stripe](#7-webhooks-stripe)
8. [Proration et Calculs](#8-proration-et-calculs)
9. [Migrations SQL](#9-migrations-sql)
10. [Services TypeScript](#10-services-typescript)

---

## 1. VUE D'ENSEMBLE BILLING ENTERPRISE

### 1.1 Contexte

La Partie 2 complète l'architecture Quote-to-Cash avec les composants Billing nécessaires pour gérer :

- **Deals multi-phases** : Contrats avec évolution tarifaire sur plusieurs années
- **Subscription Schedules** : Planification des changements de pricing
- **Amendments** : Modifications mid-term avec proration automatique
- **Stripe Integration** : Synchronisation complète avec Stripe Billing

### 1.2 Positionnement dans l'Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PARTIE 1 (CRM - Déjà implémenté)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  crm_leads → crm_opportunities → crm_quotes → crm_orders → crm_agreements   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Order.fulfilled
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PARTIE 2 (BILLING - Cette spécification)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐                                            │
│  │ bil_subscription_schedules │ ◄── Deals multi-phases (multi-années)      │
│  └────────────┬────────────────┘                                            │
│               │                                                             │
│               │ 1:N                                                         │
│               ▼                                                             │
│  ┌─────────────────────────────────────┐                                    │
│  │ bil_subscription_schedule_phases   │ ◄── Year 1, Year 2, Year 3...      │
│  └─────────────────────────────────────┘                                    │
│               │                                                             │
│               │ creates                                                     │
│               ▼                                                             │
│  ┌─────────────────────────────┐                                            │
│  │ bil_tenant_subscriptions   │ ◄── Subscription active                    │
│  └────────────┬────────────────┘                                            │
│               │                                                             │
│               │ 1:N                                                         │
│               ▼                                                             │
│  ┌─────────────────────────────┐                                            │
│  │     bil_amendments         │ ◄── Upgrades, downgrades, modifications    │
│  └─────────────────────────────┘                                            │
│               │                                                             │
│               │ generates                                                   │
│               ▼                                                             │
│  ┌─────────────────────────────┐                                            │
│  │   bil_tenant_invoices      │ ◄── Proration invoices                     │
│  └─────────────────────────────┘                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Sync bidirectionnelle
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STRIPE BILLING                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Customer ← Subscription Schedule ← Subscription ← Invoice                  │
│                    ↓                                                        │
│             Schedule Phases                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Use Cases Enterprise

#### UC-1: Deal Multi-Années avec Ramp-Up

```
SCÉNARIO: ABC Logistics signe un contrat 3 ans avec tarif progressif

Year 1 (Phase 1):
  - Plan Enterprise: 99€/mois (discount 50% première année)
  - Billing: Monthly
  - Trial: 14 jours inclus

Year 2 (Phase 2):
  - Plan Enterprise: 149€/mois (discount 25%)
  - Billing: Monthly

Year 3 (Phase 3):
  - Plan Enterprise: 199€/mois (prix normal)
  - Billing: Annual (prepaid)
  - Bonus: Module GPS offert

IMPLÉMENTATION:
  - 1 bil_subscription_schedule
  - 3 bil_subscription_schedule_phases
  - Stripe: 1 SubscriptionSchedule avec 3 phases
```

#### UC-2: Upgrade Mid-Term avec Proration

```
SCÉNARIO: Client XYZ veut upgrader de Standard à Enterprise en milieu de mois

Situation actuelle (15 du mois):
  - Plan Standard: 49€/mois
  - Facturé: 1er au 30 du mois
  - Déjà payé pour le mois complet

Upgrade demandé:
  - Plan Enterprise: 199€/mois
  - Effectif immédiatement

Calcul proration:
  - Crédit Standard: 49€ × (15/30) = 24.50€
  - Débit Enterprise: 199€ × (15/30) = 99.50€
  - Montant dû: 99.50€ - 24.50€ = 75€

IMPLÉMENTATION:
  - 1 bil_amendment (type: upgrade)
  - 1 bil_tenant_invoice (type: proration)
  - Stripe: Subscription update + proration invoice
```

#### UC-3: Modification de Quantité

```
SCÉNARIO: Client ajoute 50 véhicules à sa flotte

Situation actuelle:
  - Plan Enterprise: 199€/mois base
  - Véhicules inclus: 100
  - Véhicules actuels: 95
  - Overage rate: 2€/véhicule/mois

Modification:
  - Nouveaux véhicules: 145 (+50)
  - Dépassement: 145 - 100 = 45 véhicules
  - Coût additionnel: 45 × 2€ = 90€/mois

IMPLÉMENTATION:
  - 1 bil_amendment (type: quantity_change)
  - Usage metrics updated
  - Stripe: Usage record reported
```

---

## 2. INTÉGRATION STRIPE - ARCHITECTURE

### 2.1 Vue d'Ensemble Stripe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STRIPE OBJECT MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │  Customer   │ ← Email, nom, metadata (tenant_id, order_id)               │
│  │  cus_xxx    │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         │ has many                                                          │
│         ▼                                                                   │
│  ┌─────────────────────┐        ┌─────────────────────────┐                 │
│  │ PaymentMethod       │        │ SubscriptionSchedule    │                 │
│  │ pm_xxx              │        │ sub_sched_xxx           │                 │
│  │ (card, sepa...)     │        │ (deals multi-phases)    │                 │
│  └─────────────────────┘        └───────────┬─────────────┘                 │
│                                             │                               │
│                                             │ has phases                    │
│                                             ▼                               │
│                                  ┌─────────────────────────┐                │
│                                  │ Schedule Phase          │                │
│                                  │ • start_date            │                │
│                                  │ • end_date              │                │
│                                  │ • items (prices)        │                │
│                                  │ • proration_behavior    │                │
│                                  └───────────┬─────────────┘                │
│                                              │                              │
│                                              │ creates/updates              │
│                                              ▼                              │
│  ┌─────────────────────┐        ┌─────────────────────────┐                 │
│  │    Subscription     │◄───────│ (current phase active)  │                 │
│  │    sub_xxx          │        └─────────────────────────┘                 │
│  │    • status         │                                                    │
│  │    • current_period │                                                    │
│  │    • items          │                                                    │
│  └──────────┬──────────┘                                                    │
│             │                                                               │
│             │ generates                                                     │
│             ▼                                                               │
│  ┌─────────────────────┐        ┌─────────────────────────┐                 │
│  │      Invoice        │        │    InvoiceItem          │                 │
│  │      in_xxx         │───────▶│    ii_xxx               │                 │
│  │      • status       │ has    │    • price              │                 │
│  │      • amount       │ many   │    • quantity           │                 │
│  └─────────────────────┘        │    • proration          │                 │
│                                 └─────────────────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mapping FleetCore ↔ Stripe

| FleetCore Entity           | Stripe Object        | Sync Direction | Notes                   |
| -------------------------- | -------------------- | -------------- | ----------------------- |
| adm_tenants                | Customer             | FC → Stripe    | metadata.tenant_id      |
| bil_billing_plans          | Product + Price      | FC → Stripe    | stripe_price_id stored  |
| bil_subscription_schedules | SubscriptionSchedule | FC ↔ Stripe   | Bidirectional           |
| bil_schedule_phases        | Schedule.phases[]    | FC → Stripe    | Part of schedule        |
| bil_tenant_subscriptions   | Subscription         | FC ↔ Stripe   | Bidirectional           |
| bil_tenant_invoices        | Invoice              | Stripe → FC    | Via webhooks            |
| bil_payment_methods        | PaymentMethod        | Stripe → FC    | Via webhooks            |
| bil_amendments             | (No direct object)   | FC only        | Triggers Stripe updates |

### 2.3 Configuration Stripe

```typescript
// lib/config/stripe.config.ts

export const STRIPE_CONFIG = {
  // API Version (important pour la compatibilité)
  apiVersion: "2024-11-20.acacia" as const,

  // Webhooks
  webhookEndpointUrl: process.env.STRIPE_WEBHOOK_URL,
  webhookSigningSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // ms

  // Proration settings
  prorationBehavior: "create_prorations" as const,

  // Billing thresholds
  billingThresholds: {
    amountGte: 100, // Minimum invoice amount (cents)
    resetBillingCycleAnchor: false,
  },

  // Payment settings
  paymentSettings: {
    paymentMethodTypes: ["card", "sepa_debit"],
    saveDefaultPaymentMethod: "on_subscription",
  },

  // Subscription schedule settings
  scheduleSettings: {
    endBehavior: "release" as const, // or 'cancel'
    prorationBehavior: "create_prorations" as const,
  },

  // Metadata keys (standardized)
  metadataKeys: {
    tenantId: "fleetcore_tenant_id",
    orderId: "fleetcore_order_id",
    subscriptionId: "fleetcore_subscription_id",
    scheduleId: "fleetcore_schedule_id",
    amendmentId: "fleetcore_amendment_id",
    environment: "fleetcore_environment",
  },
};
```

### 2.4 Stripe API Client

```typescript
// lib/services/stripe/stripe-client.service.ts

import Stripe from "stripe";
import { STRIPE_CONFIG } from "@/lib/config/stripe.config";

class StripeClientService {
  private static instance: StripeClientService;
  private client: Stripe;

  private constructor() {
    this.client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: STRIPE_CONFIG.apiVersion,
      maxNetworkRetries: STRIPE_CONFIG.maxRetries,
      typescript: true,
    });
  }

  public static getInstance(): StripeClientService {
    if (!StripeClientService.instance) {
      StripeClientService.instance = new StripeClientService();
    }
    return StripeClientService.instance;
  }

  public getClient(): Stripe {
    return this.client;
  }

  // Customer operations
  async createCustomer(
    params: Stripe.CustomerCreateParams
  ): Promise<Stripe.Customer> {
    return this.client.customers.create(params);
  }

  async updateCustomer(
    id: string,
    params: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    return this.client.customers.update(id, params);
  }

  // Subscription Schedule operations
  async createSubscriptionSchedule(
    params: Stripe.SubscriptionScheduleCreateParams
  ): Promise<Stripe.SubscriptionSchedule> {
    return this.client.subscriptionSchedules.create(params);
  }

  async updateSubscriptionSchedule(
    id: string,
    params: Stripe.SubscriptionScheduleUpdateParams
  ): Promise<Stripe.SubscriptionSchedule> {
    return this.client.subscriptionSchedules.update(id, params);
  }

  async releaseSubscriptionSchedule(
    id: string
  ): Promise<Stripe.SubscriptionSchedule> {
    return this.client.subscriptionSchedules.release(id);
  }

  async cancelSubscriptionSchedule(
    id: string
  ): Promise<Stripe.SubscriptionSchedule> {
    return this.client.subscriptionSchedules.cancel(id);
  }

  // Subscription operations
  async createSubscription(
    params: Stripe.SubscriptionCreateParams
  ): Promise<Stripe.Subscription> {
    return this.client.subscriptions.create(params);
  }

  async updateSubscription(
    id: string,
    params: Stripe.SubscriptionUpdateParams
  ): Promise<Stripe.Subscription> {
    return this.client.subscriptions.update(id, params);
  }

  async cancelSubscription(id: string): Promise<Stripe.Subscription> {
    return this.client.subscriptions.cancel(id);
  }

  // Invoice operations
  async createInvoice(
    params: Stripe.InvoiceCreateParams
  ): Promise<Stripe.Invoice> {
    return this.client.invoices.create(params);
  }

  async finalizeInvoice(id: string): Promise<Stripe.Invoice> {
    return this.client.invoices.finalizeInvoice(id);
  }

  async payInvoice(id: string): Promise<Stripe.Invoice> {
    return this.client.invoices.pay(id);
  }

  // Usage reporting
  async createUsageRecord(
    subscriptionItemId: string,
    params: Stripe.SubscriptionItemCreateUsageRecordParams
  ): Promise<Stripe.UsageRecord> {
    return this.client.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      params
    );
  }

  // Webhook verification
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    return this.client.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  }
}

export const stripeClient = StripeClientService.getInstance();
```

---

## 3. TABLE BIL_SUBSCRIPTION_SCHEDULES

### 3.1 Vue d'Ensemble

**Rôle métier :** La table `bil_subscription_schedules` représente les contrats multi-phases avec évolution tarifaire planifiée. Elle permet de gérer des deals complexes sur plusieurs années avec des changements de prix, de plan ou de fréquence de facturation à des dates prédéfinies.

**Mapping Stripe :** Correspond à l'objet `SubscriptionSchedule` de Stripe.

### 3.2 Schéma DDL Complet

```sql
-- =============================================================================
-- TABLE: bil_subscription_schedules
-- Description: Planification des subscriptions multi-phases
-- =============================================================================

-- Type ENUM pour le statut du schedule
CREATE TYPE schedule_status AS ENUM (
    'not_started',   -- Pas encore démarré (future start_date)
    'active',        -- En cours d'exécution
    'completed',     -- Toutes les phases terminées
    'canceled',      -- Annulé manuellement
    'released'       -- Libéré (subscription continue sans schedule)
);

-- Type ENUM pour le comportement en fin de schedule
CREATE TYPE schedule_end_behavior AS ENUM (
    'release',       -- Libérer la subscription (continue seule)
    'cancel',        -- Annuler la subscription
    'none'           -- Pas d'action automatique
);

-- Table principale
CREATE TABLE bil_subscription_schedules (
    -- Identifiant
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

    -- Tenant (multi-tenant)
    tenant_id UUID NOT NULL,

    -- Référence unique
    schedule_reference VARCHAR(50) NOT NULL,
    -- Format: SCH-YYYY-NNNNN (ex: SCH-2025-00001)

    -- Relations
    order_id UUID,
    -- Lien vers crm_orders (origine)

    subscription_id UUID,
    -- Lien vers bil_tenant_subscriptions (créée par le schedule)

    -- Stripe sync
    stripe_schedule_id VARCHAR(255),
    -- ID Stripe: sub_sched_xxx

    stripe_customer_id VARCHAR(255),
    -- ID Customer Stripe: cus_xxx

    stripe_subscription_id VARCHAR(255),
    -- ID Subscription Stripe: sub_xxx (créée par le schedule)

    -- Statut
    status schedule_status NOT NULL DEFAULT 'not_started',

    -- Période totale
    schedule_start DATE NOT NULL,
    -- Date de début du schedule

    schedule_end DATE,
    -- Date de fin du schedule (calculée ou définie)

    total_duration_months INTEGER NOT NULL,
    -- Durée totale en mois

    -- Phase courante
    current_phase_id UUID,
    -- Lien vers bil_subscription_schedule_phases

    current_phase_number INTEGER DEFAULT 0,
    -- Numéro de la phase actuelle (1, 2, 3...)

    -- Valeurs financières
    currency CHAR(3) NOT NULL DEFAULT 'EUR',

    total_contract_value NUMERIC(15, 2) NOT NULL,
    -- Valeur totale du contrat sur toutes les phases

    total_mrr NUMERIC(15, 2),
    -- MRR moyen sur la durée du contrat

    total_arr NUMERIC(15, 2),
    -- ARR (MRR × 12)

    -- Comportement
    end_behavior schedule_end_behavior NOT NULL DEFAULT 'release',
    -- Que faire quand le schedule se termine

    proration_behavior VARCHAR(50) NOT NULL DEFAULT 'create_prorations',
    -- Stripe proration: create_prorations, none, always_invoice

    -- Billing
    billing_cycle_anchor INTEGER,
    -- Jour du mois pour l'ancrage (1-28)

    collection_method VARCHAR(20) NOT NULL DEFAULT 'charge_automatically',
    -- charge_automatically ou send_invoice

    days_until_due INTEGER DEFAULT 0,
    -- Jours avant échéance (si send_invoice)

    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Notes
    notes TEXT,

    -- Tracking
    started_at TIMESTAMPTZ,
    -- Date réelle de démarrage

    completed_at TIMESTAMPTZ,
    -- Date de complétion

    canceled_at TIMESTAMPTZ,
    -- Date d'annulation

    released_at TIMESTAMPTZ,
    -- Date de libération

    last_synced_at TIMESTAMPTZ,
    -- Dernière synchronisation avec Stripe

    sync_error TEXT,
    -- Dernière erreur de sync (si applicable)

    -- Audit
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    deletion_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Contraintes
    CONSTRAINT schedule_reference_unique UNIQUE (schedule_reference) WHERE deleted_at IS NULL,
    CONSTRAINT positive_duration CHECK (total_duration_months > 0),
    CONSTRAINT positive_contract_value CHECK (total_contract_value >= 0),
    CONSTRAINT valid_schedule_dates CHECK (schedule_end IS NULL OR schedule_end > schedule_start)
);

-- Index
CREATE INDEX idx_bil_subscription_schedules_tenant_id
    ON bil_subscription_schedules(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bil_subscription_schedules_order_id
    ON bil_subscription_schedules(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_bil_subscription_schedules_subscription_id
    ON bil_subscription_schedules(subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX idx_bil_subscription_schedules_status
    ON bil_subscription_schedules(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bil_subscription_schedules_stripe_schedule_id
    ON bil_subscription_schedules(stripe_schedule_id) WHERE stripe_schedule_id IS NOT NULL;
CREATE INDEX idx_bil_subscription_schedules_schedule_start
    ON bil_subscription_schedules(schedule_start) WHERE deleted_at IS NULL;
CREATE INDEX idx_bil_subscription_schedules_current_phase_id
    ON bil_subscription_schedules(current_phase_id) WHERE current_phase_id IS NOT NULL;

-- Foreign Keys
ALTER TABLE bil_subscription_schedules
ADD CONSTRAINT bil_subscription_schedules_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

ALTER TABLE bil_subscription_schedules
ADD CONSTRAINT bil_subscription_schedules_order_id_fkey
FOREIGN KEY (order_id) REFERENCES crm_orders(id) ON DELETE SET NULL;

ALTER TABLE bil_subscription_schedules
ADD CONSTRAINT bil_subscription_schedules_subscription_id_fkey
FOREIGN KEY (subscription_id) REFERENCES bil_tenant_subscriptions(id) ON DELETE SET NULL;

-- Trigger updated_at
CREATE TRIGGER set_bil_subscription_schedules_updated_at
    BEFORE UPDATE ON bil_subscription_schedules
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE bil_subscription_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_bil_subscription_schedules
    ON bil_subscription_schedules
    FOR ALL
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid)
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- Commentaires
COMMENT ON TABLE bil_subscription_schedules IS
    'Planification des subscriptions multi-phases avec sync Stripe SubscriptionSchedule';
COMMENT ON COLUMN bil_subscription_schedules.stripe_schedule_id IS
    'ID Stripe SubscriptionSchedule (sub_sched_xxx)';
COMMENT ON COLUMN bil_subscription_schedules.end_behavior IS
    'Comportement à la fin du schedule: release (continue), cancel (stop), none';
```

### 3.3 Règles Métier

#### RM-SCH-001 : Création de Schedule

```
RÈGLE: Un schedule est créé quand:
  1. Order est fulfillé avec contract_duration > 12 mois
  2. OU Quote contient plusieurs phases de pricing
  3. OU Explicitement demandé pour deals enterprise

PRÉ-CONDITIONS:
  - tenant_id valide et actif
  - order_id avec status = 'fulfilled' ou 'active'
  - Au moins 2 phases définies
  - Stripe Customer existe

POST-CONDITIONS:
  - schedule créé avec status = 'not_started'
  - stripe_schedule_id renseigné
  - Phases créées dans bil_subscription_schedule_phases
```

#### RM-SCH-002 : Démarrage de Schedule

```
RÈGLE: Un schedule démarre automatiquement quand:
  1. schedule_start <= CURRENT_DATE
  2. status = 'not_started'
  3. Toutes les phases sont valides

ACTIONS:
  1. status → 'active'
  2. started_at = NOW()
  3. current_phase_id = première phase
  4. current_phase_number = 1
  5. Stripe: Schedule devient actif, crée Subscription
  6. stripe_subscription_id renseigné
  7. subscription_id créé/lié dans bil_tenant_subscriptions

JOB CRON: Quotidien à 00:10
  SELECT * FROM bil_subscription_schedules
  WHERE status = 'not_started'
    AND schedule_start <= CURRENT_DATE
    AND deleted_at IS NULL;
```

#### RM-SCH-003 : Transition de Phase

```
RÈGLE: Une phase se termine et la suivante démarre quand:
  1. phase.end_date <= CURRENT_DATE
  2. Phase suivante existe

ACTIONS:
  1. Marquer phase courante comme 'completed'
  2. current_phase_id = phase suivante
  3. current_phase_number++
  4. Stripe: Mise à jour automatique via Schedule
  5. Mettre à jour subscription avec nouveaux prix
  6. Notification au tenant (nouveau tarif)

SI DERNIÈRE PHASE:
  - status → 'completed'
  - completed_at = NOW()
  - Appliquer end_behavior (release, cancel, none)
```

#### RM-SCH-004 : Annulation de Schedule

```
RÈGLE: Un schedule peut être annulé si:
  1. status IN ('not_started', 'active')
  2. Utilisateur a permission 'subscriptions.cancel'

ACTIONS:
  1. status → 'canceled'
  2. canceled_at = NOW()
  3. Stripe: subscriptionSchedules.cancel()
  4. Subscription sous-jacente annulée selon proration
  5. Invoice finale générée si applicable
  6. Notification tenant + équipe CS
```

---

## 4. TABLE BIL_SUBSCRIPTION_SCHEDULE_PHASES

### 4.1 Vue d'Ensemble

**Rôle métier :** Chaque phase d'un schedule représente une période avec des conditions tarifaires spécifiques. Une phase définit le plan, le prix, les discounts et la fréquence de facturation pour une période donnée.

### 4.2 Schéma DDL Complet

```sql
-- =============================================================================
-- TABLE: bil_subscription_schedule_phases
-- Description: Phases individuelles d'un subscription schedule
-- =============================================================================

-- Type ENUM pour le statut de phase
CREATE TYPE phase_status AS ENUM (
    'scheduled',   -- Planifiée (future)
    'active',      -- En cours
    'completed',   -- Terminée
    'skipped'      -- Sautée (annulation partielle)
);

-- Table
CREATE TABLE bil_subscription_schedule_phases (
    -- Identifiant
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

    -- Relation avec schedule (obligatoire)
    schedule_id UUID NOT NULL,

    -- Numéro de phase (ordre)
    phase_number INTEGER NOT NULL,
    -- 1, 2, 3... (ordre chronologique)

    -- Nom/description de la phase
    phase_name VARCHAR(100),
    -- Ex: "Year 1 - Introductory Rate", "Year 2 - Standard Rate"

    phase_description TEXT,
    -- Description détaillée pour le client

    -- Statut
    status phase_status NOT NULL DEFAULT 'scheduled',

    -- Période
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    -- end_date = start_date suivante - 1 jour

    duration_months INTEGER NOT NULL,
    -- Durée de la phase en mois

    -- Plan et pricing
    plan_id UUID NOT NULL,
    -- FK vers bil_billing_plans

    stripe_price_id VARCHAR(255),
    -- ID du Price Stripe pour cette phase

    -- Prix (peut override le prix du plan)
    unit_price NUMERIC(15, 2) NOT NULL,
    -- Prix unitaire pour cette phase

    price_override BOOLEAN NOT NULL DEFAULT FALSE,
    -- TRUE si le prix est différent du plan standard

    original_plan_price NUMERIC(15, 2),
    -- Prix original du plan (pour référence)

    -- Discount
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    -- Remise en pourcentage (0-100)

    discount_reason VARCHAR(200),
    -- Raison de la remise

    -- Prix effectif (calculé)
    effective_price NUMERIC(15, 2) GENERATED ALWAYS AS (
        unit_price * (1 - COALESCE(discount_percent, 0) / 100)
    ) STORED,

    -- Billing
    billing_cycle billing_interval NOT NULL DEFAULT 'monthly',
    -- Fréquence de facturation pour cette phase

    -- Trial (optionnel, seulement phase 1 généralement)
    trial_days INTEGER DEFAULT 0,
    -- Jours d'essai gratuit

    trial_end DATE,
    -- Date de fin d'essai

    -- Quotas pour cette phase (override du plan si différent)
    max_vehicles INTEGER,
    max_drivers INTEGER,
    max_users INTEGER,
    -- NULL = utiliser les quotas du plan

    -- Add-ons inclus dans cette phase
    included_addons JSONB DEFAULT '[]'::jsonb,
    -- Format: [{"addon_id": "uuid", "included": true}]

    -- Valeurs calculées
    phase_value NUMERIC(15, 2),
    -- Valeur totale de la phase (effective_price × duration_months)

    phase_mrr NUMERIC(15, 2),
    -- MRR de la phase

    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT valid_phase_dates CHECK (end_date > start_date),
    CONSTRAINT positive_duration CHECK (duration_months > 0),
    CONSTRAINT positive_unit_price CHECK (unit_price >= 0),
    CONSTRAINT valid_discount CHECK (discount_percent >= 0 AND discount_percent <= 100),
    CONSTRAINT valid_trial_days CHECK (trial_days >= 0),
    CONSTRAINT unique_phase_number UNIQUE (schedule_id, phase_number)
);

-- Index
CREATE INDEX idx_bil_schedule_phases_schedule_id
    ON bil_subscription_schedule_phases(schedule_id);
CREATE INDEX idx_bil_schedule_phases_status
    ON bil_subscription_schedule_phases(status);
CREATE INDEX idx_bil_schedule_phases_start_date
    ON bil_subscription_schedule_phases(start_date);
CREATE INDEX idx_bil_schedule_phases_plan_id
    ON bil_subscription_schedule_phases(plan_id);

-- Foreign Keys
ALTER TABLE bil_subscription_schedule_phases
ADD CONSTRAINT bil_schedule_phases_schedule_id_fkey
FOREIGN KEY (schedule_id) REFERENCES bil_subscription_schedules(id) ON DELETE CASCADE;

ALTER TABLE bil_subscription_schedule_phases
ADD CONSTRAINT bil_schedule_phases_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES bil_billing_plans(id) ON DELETE RESTRICT;

-- Trigger updated_at
CREATE TRIGGER set_bil_schedule_phases_updated_at
    BEFORE UPDATE ON bil_subscription_schedule_phases
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Trigger pour calculer les valeurs
CREATE OR REPLACE FUNCTION calculate_phase_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la valeur de la phase
    NEW.phase_value := NEW.effective_price * NEW.duration_months;

    -- Calculer le MRR de la phase
    NEW.phase_mrr := NEW.effective_price;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_phase_values_trigger
    BEFORE INSERT OR UPDATE ON bil_subscription_schedule_phases
    FOR EACH ROW
    EXECUTE FUNCTION calculate_phase_values();

-- Commentaires
COMMENT ON TABLE bil_subscription_schedule_phases IS
    'Phases individuelles des subscription schedules avec pricing par période';
COMMENT ON COLUMN bil_subscription_schedule_phases.effective_price IS
    'Prix effectif après discount (colonne générée)';
COMMENT ON COLUMN bil_subscription_schedule_phases.price_override IS
    'TRUE si le prix diffère du prix standard du plan';
```

### 4.3 Exemple de Phases

```sql
-- Exemple: Deal 3 ans ABC Logistics

-- Phase 1: Year 1 avec discount 50%
INSERT INTO bil_subscription_schedule_phases (
    schedule_id,
    phase_number,
    phase_name,
    phase_description,
    status,
    start_date,
    end_date,
    duration_months,
    plan_id,
    unit_price,
    price_override,
    original_plan_price,
    discount_percent,
    discount_reason,
    billing_cycle,
    trial_days,
    max_vehicles,
    metadata
) VALUES (
    'schedule-uuid-123',
    1,
    'Year 1 - Introductory Rate',
    'First year with 50% discount as early adopter incentive',
    'scheduled',
    '2025-01-01',
    '2025-12-31',
    12,
    'plan-enterprise-uuid',
    199.00,
    TRUE,
    199.00,
    50.00,
    'Early adopter discount - signed before Jan 15',
    'monthly',
    14,
    100,
    '{"campaign": "early_bird_2025", "sales_rep": "karim"}'
);
-- effective_price = 199 × (1 - 50/100) = 99.50€/mois
-- phase_value = 99.50 × 12 = 1,194€

-- Phase 2: Year 2 avec discount 25%
INSERT INTO bil_subscription_schedule_phases (
    schedule_id,
    phase_number,
    phase_name,
    phase_description,
    status,
    start_date,
    end_date,
    duration_months,
    plan_id,
    unit_price,
    price_override,
    discount_percent,
    discount_reason,
    billing_cycle,
    max_vehicles
) VALUES (
    'schedule-uuid-123',
    2,
    'Year 2 - Growth Rate',
    'Second year with 25% loyalty discount',
    'scheduled',
    '2026-01-01',
    '2026-12-31',
    12,
    'plan-enterprise-uuid',
    199.00,
    FALSE,
    25.00,
    'Loyalty discount',
    'monthly',
    150  -- Augmentation quota véhicules
);
-- effective_price = 199 × (1 - 25/100) = 149.25€/mois
-- phase_value = 149.25 × 12 = 1,791€

-- Phase 3: Year 3 prix standard, facturation annuelle
INSERT INTO bil_subscription_schedule_phases (
    schedule_id,
    phase_number,
    phase_name,
    phase_description,
    status,
    start_date,
    end_date,
    duration_months,
    plan_id,
    unit_price,
    discount_percent,
    billing_cycle,
    max_vehicles,
    included_addons
) VALUES (
    'schedule-uuid-123',
    3,
    'Year 3 - Standard Rate',
    'Third year at standard pricing with annual billing',
    'scheduled',
    '2027-01-01',
    '2027-12-31',
    12,
    'plan-enterprise-uuid',
    199.00,
    0,
    'annual',
    200,
    '[{"addon_id": "addon-gps-uuid", "included": true, "reason": "loyalty_bonus"}]'
);
-- effective_price = 199€/mois (facturé annuellement = 2,388€)
-- phase_value = 199 × 12 = 2,388€

-- Total contract value = 1,194 + 1,791 + 2,388 = 5,373€
```

---

## 5. TABLE BIL_AMENDMENTS

### 5.1 Vue d'Ensemble

**Rôle métier :** La table `bil_amendments` enregistre toutes les modifications apportées à une subscription en cours. Chaque amendment génère potentiellement une invoice de proration et met à jour la subscription.

**Types d'amendments :**

- **Upgrade** : Passage à un plan supérieur
- **Downgrade** : Passage à un plan inférieur
- **Quantity Change** : Modification des quantités (véhicules, users...)
- **Billing Change** : Changement de cycle de facturation
- **Plan Change** : Changement de plan (même niveau)
- **Add-on Change** : Ajout/suppression d'add-ons

### 5.2 Schéma DDL Complet

```sql
-- =============================================================================
-- TABLE: bil_amendments
-- Description: Modifications de subscription avec proration
-- =============================================================================

-- Type ENUM pour le type d'amendment
CREATE TYPE amendment_type AS ENUM (
    'upgrade',           -- Passage plan supérieur
    'downgrade',         -- Passage plan inférieur
    'quantity_change',   -- Modification quantité
    'billing_change',    -- Changement cycle facturation
    'plan_change',       -- Changement plan même niveau
    'addon_add',         -- Ajout add-on
    'addon_remove',      -- Suppression add-on
    'discount_apply',    -- Application remise
    'discount_remove',   -- Suppression remise
    'price_adjustment',  -- Ajustement prix custom
    'pause',             -- Mise en pause
    'resume',            -- Reprise après pause
    'cancel_scheduled',  -- Annulation planifiée
    'cancel_immediate'   -- Annulation immédiate
);

-- Type ENUM pour le statut
CREATE TYPE amendment_status AS ENUM (
    'pending',           -- En attente de validation
    'approved',          -- Approuvé, en attente d'application
    'applied',           -- Appliqué
    'rejected',          -- Rejeté
    'cancelled',         -- Annulé
    'failed'             -- Échec d'application
);

-- Table
CREATE TABLE bil_amendments (
    -- Identifiant
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

    -- Tenant
    tenant_id UUID NOT NULL,

    -- Référence unique
    amendment_reference VARCHAR(50) NOT NULL,
    -- Format: AMD-YYYY-NNNNN (ex: AMD-2025-00001)

    -- Relations
    subscription_id UUID NOT NULL,
    -- Lien vers bil_tenant_subscriptions

    schedule_id UUID,
    -- Lien vers bil_subscription_schedules (si applicable)

    order_id UUID,
    -- Lien vers crm_orders (nouvelle commande si upgrade)

    -- Type et statut
    amendment_type amendment_type NOT NULL,
    status amendment_status NOT NULL DEFAULT 'pending',

    -- Date d'effet
    effective_date DATE NOT NULL,
    -- Date à laquelle l'amendment prend effet

    effective_immediately BOOLEAN NOT NULL DEFAULT FALSE,
    -- TRUE = maintenant, FALSE = fin de période

    -- Changements de plan
    previous_plan_id UUID,
    new_plan_id UUID,

    previous_plan_name VARCHAR(200),
    new_plan_name VARCHAR(200),

    -- Changements de quantité
    previous_quantity INTEGER,
    new_quantity INTEGER,
    quantity_delta INTEGER GENERATED ALWAYS AS (new_quantity - previous_quantity) STORED,

    -- Changements de prix
    previous_price NUMERIC(15, 2),
    new_price NUMERIC(15, 2),
    price_delta NUMERIC(15, 2) GENERATED ALWAYS AS (new_price - previous_price) STORED,

    -- Changements de billing
    previous_billing_cycle billing_interval,
    new_billing_cycle billing_interval,

    -- Add-on changes
    addon_changes JSONB DEFAULT '[]'::jsonb,
    -- Format: [{"addon_id": "uuid", "action": "add|remove", "price": 29.00}]

    -- Proration
    proration_behavior VARCHAR(50) NOT NULL DEFAULT 'create_prorations',
    -- create_prorations, none, always_invoice

    proration_date DATE,
    -- Date de calcul de la proration

    proration_amount NUMERIC(15, 2),
    -- Montant de la proration (positif = à payer, négatif = crédit)

    proration_invoice_id UUID,
    -- Lien vers bil_tenant_invoices (invoice de proration)

    stripe_proration_invoice_id VARCHAR(255),
    -- ID Invoice Stripe de proration

    -- Impact financier
    mrr_impact NUMERIC(15, 2),
    -- Impact sur le MRR (positif ou négatif)

    arr_impact NUMERIC(15, 2),
    -- Impact sur l'ARR

    -- Raison et notes
    reason TEXT NOT NULL,
    -- Raison de l'amendment

    internal_notes TEXT,
    -- Notes internes

    customer_notification TEXT,
    -- Message envoyé au client

    -- Approbation
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    -- TRUE si besoin d'approbation (ex: downgrades)

    requested_by_id UUID,
    -- Utilisateur qui a demandé

    approved_by_id UUID,
    -- Utilisateur qui a approuvé

    approved_at TIMESTAMPTZ,

    rejected_by_id UUID,

    rejected_at TIMESTAMPTZ,

    rejection_reason TEXT,

    -- Application
    applied_at TIMESTAMPTZ,

    applied_by_id UUID,

    -- Stripe sync
    stripe_amendment_applied BOOLEAN DEFAULT FALSE,

    stripe_sync_error TEXT,

    last_synced_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Audit
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_by UUID,
    deletion_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Contraintes
    CONSTRAINT amendment_reference_unique
        UNIQUE (amendment_reference) WHERE deleted_at IS NULL,
    CONSTRAINT valid_plan_change
        CHECK (
            (amendment_type NOT IN ('upgrade', 'downgrade', 'plan_change'))
            OR (previous_plan_id IS NOT NULL AND new_plan_id IS NOT NULL)
        ),
    CONSTRAINT valid_quantity_change
        CHECK (
            amendment_type != 'quantity_change'
            OR (previous_quantity IS NOT NULL AND new_quantity IS NOT NULL)
        )
);

-- Index
CREATE INDEX idx_bil_amendments_tenant_id
    ON bil_amendments(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bil_amendments_subscription_id
    ON bil_amendments(subscription_id);
CREATE INDEX idx_bil_amendments_schedule_id
    ON bil_amendments(schedule_id) WHERE schedule_id IS NOT NULL;
CREATE INDEX idx_bil_amendments_status
    ON bil_amendments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bil_amendments_amendment_type
    ON bil_amendments(amendment_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_bil_amendments_effective_date
    ON bil_amendments(effective_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_bil_amendments_proration_invoice_id
    ON bil_amendments(proration_invoice_id) WHERE proration_invoice_id IS NOT NULL;
CREATE INDEX idx_bil_amendments_created_at
    ON bil_amendments(created_at DESC) WHERE deleted_at IS NULL;

-- Foreign Keys
ALTER TABLE bil_amendments
ADD CONSTRAINT bil_amendments_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

ALTER TABLE bil_amendments
ADD CONSTRAINT bil_amendments_subscription_id_fkey
FOREIGN KEY (subscription_id) REFERENCES bil_tenant_subscriptions(id) ON DELETE CASCADE;

ALTER TABLE bil_amendments
ADD CONSTRAINT bil_amendments_schedule_id_fkey
FOREIGN KEY (schedule_id) REFERENCES bil_subscription_schedules(id) ON DELETE SET NULL;

ALTER TABLE bil_amendments
ADD CONSTRAINT bil_amendments_order_id_fkey
FOREIGN KEY (order_id) REFERENCES crm_orders(id) ON DELETE SET NULL;

ALTER TABLE bil_amendments
ADD CONSTRAINT bil_amendments_previous_plan_id_fkey
FOREIGN KEY (previous_plan_id) REFERENCES bil_billing_plans(id) ON DELETE SET NULL;

ALTER TABLE bil_amendments
ADD CONSTRAINT bil_amendments_new_plan_id_fkey
FOREIGN KEY (new_plan_id) REFERENCES bil_billing_plans(id) ON DELETE SET NULL;

ALTER TABLE bil_amendments
ADD CONSTRAINT bil_amendments_proration_invoice_id_fkey
FOREIGN KEY (proration_invoice_id) REFERENCES bil_tenant_invoices(id) ON DELETE SET NULL;

-- Trigger updated_at
CREATE TRIGGER set_bil_amendments_updated_at
    BEFORE UPDATE ON bil_amendments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Trigger pour calculer l'impact MRR/ARR
CREATE OR REPLACE FUNCTION calculate_amendment_impact()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer l'impact MRR si changement de prix
    IF NEW.new_price IS NOT NULL AND NEW.previous_price IS NOT NULL THEN
        NEW.mrr_impact := NEW.new_price - NEW.previous_price;
        NEW.arr_impact := NEW.mrr_impact * 12;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_amendment_impact_trigger
    BEFORE INSERT OR UPDATE ON bil_amendments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_amendment_impact();

-- RLS
ALTER TABLE bil_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_bil_amendments
    ON bil_amendments
    FOR ALL
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid)
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- Commentaires
COMMENT ON TABLE bil_amendments IS
    'Modifications de subscriptions avec calcul proration et sync Stripe';
COMMENT ON COLUMN bil_amendments.proration_amount IS
    'Montant proration: positif = à payer, négatif = crédit';
COMMENT ON COLUMN bil_amendments.mrr_impact IS
    'Impact sur MRR: positif = augmentation, négatif = diminution';
```

### 5.3 Règles Métier

#### RM-AMD-001 : Création d'Amendment Upgrade

```
RÈGLE: Un upgrade amendment peut être créé si:
  1. Subscription active existe
  2. new_plan.level > previous_plan.level
  3. Pas d'amendment pending sur cette subscription

PRORATION:
  - Crédit pour jours restants sur plan actuel
  - Débit pour jours restants sur nouveau plan
  - Invoice de proration générée
  - Paiement immédiat requis

EXEMPLE:
  Jour 15/30 du mois
  Plan actuel: Standard 49€/mois
  Nouveau plan: Enterprise 199€/mois

  Crédit: 49€ × (15/30) = 24.50€
  Débit: 199€ × (15/30) = 99.50€
  Proration: 99.50€ - 24.50€ = 75€ à payer
```

#### RM-AMD-002 : Création d'Amendment Downgrade

```
RÈGLE: Un downgrade amendment doit:
  1. requires_approval = TRUE
  2. effective_immediately = FALSE (fin de période)
  3. Notification équipe CS

TRAITEMENT:
  1. Status = 'pending'
  2. Email au manager pour approbation
  3. Si approuvé: planifié pour fin de période
  4. Crédit éventuel appliqué à facture suivante

EXCEPTION:
  Si dans les 14 premiers jours (période d'essai satisfaction)
  → Peut être immédiat sans approbation
```

#### RM-AMD-003 : Application d'Amendment

```
RÈGLE: Un amendment est appliqué quand:
  1. status = 'approved'
  2. effective_date <= CURRENT_DATE
  3. (OU effective_immediately = TRUE)

ACTIONS:
  1. Mettre à jour bil_tenant_subscriptions
  2. Sync avec Stripe (subscription.update)
  3. Générer invoice proration si applicable
  4. Envoyer notification client
  5. Créer audit log
  6. status → 'applied'
  7. applied_at = NOW()

JOB CRON: Quotidien à 00:15
  SELECT * FROM bil_amendments
  WHERE status = 'approved'
    AND effective_date <= CURRENT_DATE
    AND deleted_at IS NULL;
```

---

## 6. STRIPE OBJECTS MAPPING

### 6.1 Customer Mapping

```typescript
// lib/services/stripe/customer-sync.service.ts

interface CustomerSyncData {
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    line1: string;
    city: string;
    country: string;
    postal_code: string;
  };
  taxId?: {
    type: string;
    value: string;
  };
}

async function syncCustomerToStripe(
  data: CustomerSyncData
): Promise<Stripe.Customer> {
  const stripe = stripeClient.getClient();

  // Check if customer exists
  const tenant = await prisma.adm_tenants.findUnique({
    where: { id: data.tenantId },
    select: { stripe_customer_id: true },
  });

  const customerData:
    | Stripe.CustomerCreateParams
    | Stripe.CustomerUpdateParams = {
    email: data.email,
    name: data.name,
    phone: data.phone,
    address: data.address,
    metadata: {
      [STRIPE_CONFIG.metadataKeys.tenantId]: data.tenantId,
      [STRIPE_CONFIG.metadataKeys.environment]: process.env.NODE_ENV,
    },
  };

  let customer: Stripe.Customer;

  if (tenant?.stripe_customer_id) {
    // Update existing
    customer = await stripe.customers.update(
      tenant.stripe_customer_id,
      customerData
    );
  } else {
    // Create new
    customer = await stripe.customers.create(
      customerData as Stripe.CustomerCreateParams
    );

    // Store Stripe ID
    await prisma.adm_tenants.update({
      where: { id: data.tenantId },
      data: { stripe_customer_id: customer.id },
    });
  }

  // Add tax ID if provided
  if (data.taxId) {
    await stripe.customers.createTaxId(customer.id, {
      type: data.taxId.type as Stripe.TaxIdCreateParams.Type,
      value: data.taxId.value,
    });
  }

  return customer;
}
```

### 6.2 Subscription Schedule Mapping

```typescript
// lib/services/stripe/schedule-sync.service.ts

interface ScheduleSyncData {
  scheduleId: string;
  customerId: string;
  phases: {
    planId: string;
    stripePriceId: string;
    startDate: Date;
    endDate: Date;
    discountPercent?: number;
    trialDays?: number;
    billingCycleAnchor?: number;
  }[];
  endBehavior: "release" | "cancel" | "none";
  prorationBehavior?: string;
}

async function syncScheduleToStripe(
  data: ScheduleSyncData
): Promise<Stripe.SubscriptionSchedule> {
  const stripe = stripeClient.getClient();

  // Check if schedule exists
  const schedule = await prisma.bil_subscription_schedules.findUnique({
    where: { id: data.scheduleId },
    select: { stripe_schedule_id: true },
  });

  // Build phases array for Stripe
  const stripePhases: Stripe.SubscriptionScheduleCreateParams.Phase[] =
    data.phases.map((phase, index) => {
      const phaseData: Stripe.SubscriptionScheduleCreateParams.Phase = {
        items: [{ price: phase.stripePriceId }],
        start_date: Math.floor(phase.startDate.getTime() / 1000),
        end_date: Math.floor(phase.endDate.getTime() / 1000),
        proration_behavior: "create_prorations",
      };

      // Add trial for first phase only
      if (index === 0 && phase.trialDays && phase.trialDays > 0) {
        phaseData.trial_end = Math.floor(
          new Date(
            phase.startDate.getTime() + phase.trialDays * 24 * 60 * 60 * 1000
          ).getTime() / 1000
        );
      }

      // Add discount coupon if applicable
      if (phase.discountPercent && phase.discountPercent > 0) {
        // Note: Requires creating a coupon in Stripe first
        // phaseData.coupon = await getOrCreateCoupon(phase.discountPercent);
      }

      // Add billing cycle anchor
      if (phase.billingCycleAnchor) {
        phaseData.billing_cycle_anchor = "phase_start";
      }

      return phaseData;
    });

  let stripeSchedule: Stripe.SubscriptionSchedule;

  if (schedule?.stripe_schedule_id) {
    // Update existing schedule
    stripeSchedule = await stripe.subscriptionSchedules.update(
      schedule.stripe_schedule_id,
      {
        phases: stripePhases,
        end_behavior: data.endBehavior,
        metadata: {
          [STRIPE_CONFIG.metadataKeys.scheduleId]: data.scheduleId,
        },
      }
    );
  } else {
    // Create new schedule
    stripeSchedule = await stripe.subscriptionSchedules.create({
      customer: data.customerId,
      start_date: Math.floor(data.phases[0].startDate.getTime() / 1000),
      end_behavior: data.endBehavior,
      phases: stripePhases,
      metadata: {
        [STRIPE_CONFIG.metadataKeys.scheduleId]: data.scheduleId,
      },
    });

    // Store Stripe ID
    await prisma.bil_subscription_schedules.update({
      where: { id: data.scheduleId },
      data: {
        stripe_schedule_id: stripeSchedule.id,
        stripe_customer_id: data.customerId,
        last_synced_at: new Date(),
      },
    });
  }

  // If schedule has a subscription, store that ID too
  if (stripeSchedule.subscription) {
    const subscriptionId =
      typeof stripeSchedule.subscription === "string"
        ? stripeSchedule.subscription
        : stripeSchedule.subscription.id;

    await prisma.bil_subscription_schedules.update({
      where: { id: data.scheduleId },
      data: { stripe_subscription_id: subscriptionId },
    });
  }

  return stripeSchedule;
}
```

### 6.3 Amendment Application to Stripe

```typescript
// lib/services/stripe/amendment-sync.service.ts

interface AmendmentApplyData {
  amendmentId: string;
  subscriptionId: string;
  stripeSubscriptionId: string;
  amendmentType: string;
  newPriceId?: string;
  newQuantity?: number;
  prorationBehavior: string;
  effectiveImmediately: boolean;
}

async function applyAmendmentToStripe(data: AmendmentApplyData): Promise<{
  subscription: Stripe.Subscription;
  prorationInvoice?: Stripe.Invoice;
}> {
  const stripe = stripeClient.getClient();

  // Prepare update params based on amendment type
  const updateParams: Stripe.SubscriptionUpdateParams = {
    proration_behavior:
      data.prorationBehavior as Stripe.SubscriptionUpdateParams.ProrationBehavior,
    metadata: {
      [STRIPE_CONFIG.metadataKeys.amendmentId]: data.amendmentId,
      last_amendment_at: new Date().toISOString(),
    },
  };

  // Handle different amendment types
  switch (data.amendmentType) {
    case "upgrade":
    case "downgrade":
    case "plan_change":
      if (data.newPriceId) {
        // Get current subscription to find the item
        const currentSub = await stripe.subscriptions.retrieve(
          data.stripeSubscriptionId
        );
        const itemId = currentSub.items.data[0].id;

        updateParams.items = [
          {
            id: itemId,
            price: data.newPriceId,
          },
        ];
      }
      break;

    case "quantity_change":
      if (data.newQuantity !== undefined) {
        const currentSub = await stripe.subscriptions.retrieve(
          data.stripeSubscriptionId
        );
        const itemId = currentSub.items.data[0].id;

        updateParams.items = [
          {
            id: itemId,
            quantity: data.newQuantity,
          },
        ];
      }
      break;

    case "billing_change":
      // Billing cycle changes might require canceling and recreating
      // This is handled separately
      break;

    case "cancel_immediate":
      // Cancel immediately
      const canceledSub = await stripe.subscriptions.cancel(
        data.stripeSubscriptionId
      );
      return { subscription: canceledSub };

    case "cancel_scheduled":
      updateParams.cancel_at_period_end = true;
      break;

    case "pause":
      updateParams.pause_collection = { behavior: "void" };
      break;

    case "resume":
      updateParams.pause_collection = null;
      break;
  }

  // Apply the update
  const subscription = await stripe.subscriptions.update(
    data.stripeSubscriptionId,
    updateParams
  );

  // Check for proration invoice
  let prorationInvoice: Stripe.Invoice | undefined;

  if (data.prorationBehavior === "create_prorations") {
    // Fetch the latest invoice to see if it's a proration
    const invoices = await stripe.invoices.list({
      subscription: data.stripeSubscriptionId,
      limit: 1,
    });

    if (invoices.data.length > 0 && invoices.data[0].status === "draft") {
      // Finalize and pay the proration invoice
      prorationInvoice = await stripe.invoices.finalizeInvoice(
        invoices.data[0].id
      );

      if (prorationInvoice.amount_due > 0) {
        prorationInvoice = await stripe.invoices.pay(prorationInvoice.id);
      }
    }
  }

  // Update amendment with Stripe info
  await prisma.bil_amendments.update({
    where: { id: data.amendmentId },
    data: {
      stripe_amendment_applied: true,
      stripe_proration_invoice_id: prorationInvoice?.id,
      last_synced_at: new Date(),
      applied_at: new Date(),
      status: "applied",
    },
  });

  return { subscription, prorationInvoice };
}
```

---

## 7. WEBHOOKS STRIPE

### 7.1 Configuration des Webhooks

```typescript
// app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripeClient } from "@/lib/services/stripe/stripe-client.service";
import { handleStripeEvent } from "@/lib/services/stripe/webhook-handler.service";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripeClient.constructWebhookEvent(body, signature);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    await handleStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error handling webhook:", err);
    // Return 200 to acknowledge receipt (avoid Stripe retries for app errors)
    return NextResponse.json({ received: true, error: err.message });
  }
}

export const config = {
  api: {
    bodyParser: false, // Required for webhook signature verification
  },
};
```

### 7.2 Webhook Handler Service

```typescript
// lib/services/stripe/webhook-handler.service.ts

import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { STRIPE_CONFIG } from "@/lib/config/stripe.config";

type WebhookHandler = (event: Stripe.Event) => Promise<void>;

const handlers: Record<string, WebhookHandler> = {
  // Subscription Schedule events
  "subscription_schedule.created": handleScheduleCreated,
  "subscription_schedule.updated": handleScheduleUpdated,
  "subscription_schedule.completed": handleScheduleCompleted,
  "subscription_schedule.canceled": handleScheduleCanceled,
  "subscription_schedule.released": handleScheduleReleased,
  "subscription_schedule.aborted": handleScheduleAborted,

  // Subscription events
  "customer.subscription.created": handleSubscriptionCreated,
  "customer.subscription.updated": handleSubscriptionUpdated,
  "customer.subscription.deleted": handleSubscriptionDeleted,
  "customer.subscription.trial_will_end": handleTrialWillEnd,
  "customer.subscription.pending_update_applied": handlePendingUpdateApplied,
  "customer.subscription.pending_update_expired": handlePendingUpdateExpired,

  // Invoice events
  "invoice.created": handleInvoiceCreated,
  "invoice.finalized": handleInvoiceFinalized,
  "invoice.paid": handleInvoicePaid,
  "invoice.payment_failed": handleInvoicePaymentFailed,
  "invoice.upcoming": handleInvoiceUpcoming,
  "invoice.marked_uncollectible": handleInvoiceUncollectible,

  // Payment events
  "payment_intent.succeeded": handlePaymentSucceeded,
  "payment_intent.payment_failed": handlePaymentFailed,

  // Customer events
  "customer.updated": handleCustomerUpdated,
  "customer.deleted": handleCustomerDeleted,

  // Payment method events
  "payment_method.attached": handlePaymentMethodAttached,
  "payment_method.detached": handlePaymentMethodDetached,
  "payment_method.updated": handlePaymentMethodUpdated,
};

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  console.log(`Processing Stripe webhook: ${event.type}`);

  const handler = handlers[event.type];

  if (handler) {
    await handler(event);
  } else {
    console.log(`Unhandled event type: ${event.type}`);
  }

  // Log the event for debugging
  await prisma.stripe_webhook_logs.create({
    data: {
      event_id: event.id,
      event_type: event.type,
      payload: JSON.stringify(event.data.object),
      processed_at: new Date(),
    },
  });
}

// =============================================================================
// Subscription Schedule Handlers
// =============================================================================

async function handleScheduleCreated(event: Stripe.Event): Promise<void> {
  const schedule = event.data.object as Stripe.SubscriptionSchedule;
  const scheduleId = schedule.metadata?.[STRIPE_CONFIG.metadataKeys.scheduleId];

  if (!scheduleId) {
    console.log("Schedule created externally (no FleetCore ID), skipping");
    return;
  }

  await prisma.bil_subscription_schedules.update({
    where: { id: scheduleId },
    data: {
      stripe_schedule_id: schedule.id,
      status: mapStripeScheduleStatus(schedule.status),
      last_synced_at: new Date(),
    },
  });
}

async function handleScheduleUpdated(event: Stripe.Event): Promise<void> {
  const schedule = event.data.object as Stripe.SubscriptionSchedule;

  // Find by Stripe ID
  const localSchedule = await prisma.bil_subscription_schedules.findFirst({
    where: { stripe_schedule_id: schedule.id },
  });

  if (!localSchedule) {
    console.log("Schedule not found locally, skipping");
    return;
  }

  // Update status and current phase
  await prisma.bil_subscription_schedules.update({
    where: { id: localSchedule.id },
    data: {
      status: mapStripeScheduleStatus(schedule.status),
      current_phase_number: schedule.current_phase?.start_date
        ? findPhaseNumber(schedule)
        : localSchedule.current_phase_number,
      last_synced_at: new Date(),
    },
  });
}

async function handleScheduleCompleted(event: Stripe.Event): Promise<void> {
  const schedule = event.data.object as Stripe.SubscriptionSchedule;

  const localSchedule = await prisma.bil_subscription_schedules.findFirst({
    where: { stripe_schedule_id: schedule.id },
  });

  if (!localSchedule) return;

  await prisma.bil_subscription_schedules.update({
    where: { id: localSchedule.id },
    data: {
      status: "completed",
      completed_at: new Date(),
      last_synced_at: new Date(),
    },
  });

  // Notify tenant
  await sendScheduleCompletedNotification(localSchedule.tenant_id);
}

async function handleScheduleCanceled(event: Stripe.Event): Promise<void> {
  const schedule = event.data.object as Stripe.SubscriptionSchedule;

  const localSchedule = await prisma.bil_subscription_schedules.findFirst({
    where: { stripe_schedule_id: schedule.id },
  });

  if (!localSchedule) return;

  await prisma.bil_subscription_schedules.update({
    where: { id: localSchedule.id },
    data: {
      status: "canceled",
      canceled_at: new Date(),
      last_synced_at: new Date(),
    },
  });
}

async function handleScheduleReleased(event: Stripe.Event): Promise<void> {
  const schedule = event.data.object as Stripe.SubscriptionSchedule;

  const localSchedule = await prisma.bil_subscription_schedules.findFirst({
    where: { stripe_schedule_id: schedule.id },
  });

  if (!localSchedule) return;

  await prisma.bil_subscription_schedules.update({
    where: { id: localSchedule.id },
    data: {
      status: "released",
      released_at: new Date(),
      last_synced_at: new Date(),
    },
  });
}

async function handleScheduleAborted(event: Stripe.Event): Promise<void> {
  // Same as canceled for our purposes
  await handleScheduleCanceled(event);
}

// =============================================================================
// Invoice Handlers
// =============================================================================

async function handleInvoiceCreated(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;

  // Get tenant from customer metadata
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const tenant = await prisma.adm_tenants.findFirst({
    where: { stripe_customer_id: customerId },
  });

  if (!tenant) {
    console.log("Customer not found locally, skipping invoice");
    return;
  }

  // Check if invoice already exists
  const existingInvoice = await prisma.bil_tenant_invoices.findFirst({
    where: { stripe_invoice_id: invoice.id },
  });

  if (existingInvoice) return;

  // Create local invoice
  await prisma.bil_tenant_invoices.create({
    data: {
      tenant_id: tenant.id,
      subscription_id: findSubscriptionByStripeId(
        invoice.subscription as string
      ),
      invoice_number: invoice.number || `INV-${Date.now()}`,
      invoice_date: new Date(invoice.created * 1000),
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      subtotal: invoice.subtotal / 100,
      tax_amount: invoice.tax || 0,
      total_amount: invoice.total / 100,
      currency: invoice.currency.toUpperCase(),
      status: mapStripeInvoiceStatus(invoice.status),
      stripe_invoice_id: invoice.id,
      period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000)
        : null,
      period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000)
        : null,
    },
  });
}

async function handleInvoicePaid(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;

  const localInvoice = await prisma.bil_tenant_invoices.findFirst({
    where: { stripe_invoice_id: invoice.id },
  });

  if (!localInvoice) {
    // Create it first
    await handleInvoiceCreated(event);
    return;
  }

  await prisma.bil_tenant_invoices.update({
    where: { id: localInvoice.id },
    data: {
      status: "paid",
      paid_at: new Date(),
      amount_paid: invoice.amount_paid / 100,
      amount_due: 0,
    },
  });

  // Update subscription status if it was past_due
  if (localInvoice.subscription_id) {
    const subscription = await prisma.bil_tenant_subscriptions.findUnique({
      where: { id: localInvoice.subscription_id },
    });

    if (subscription?.status === "past_due") {
      await prisma.bil_tenant_subscriptions.update({
        where: { id: subscription.id },
        data: { status: "active" },
      });

      // Reactivate tenant if suspended
      await prisma.adm_tenants.update({
        where: { id: localInvoice.tenant_id, status: "suspended" },
        data: { status: "active" },
      });
    }
  }
}

async function handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;

  const localInvoice = await prisma.bil_tenant_invoices.findFirst({
    where: { stripe_invoice_id: invoice.id },
  });

  if (!localInvoice) return;

  // Get attempt count from metadata
  const attemptCount =
    (localInvoice.metadata as any)?.payment_attempt_count || 0;
  const newAttemptCount = attemptCount + 1;

  await prisma.bil_tenant_invoices.update({
    where: { id: localInvoice.id },
    data: {
      status: newAttemptCount >= 3 ? "overdue" : "sent",
      metadata: {
        ...(localInvoice.metadata as object),
        payment_attempt_count: newAttemptCount,
        last_payment_error: invoice.last_finalization_error?.message,
      },
    },
  });

  // If 3+ failures, suspend
  if (newAttemptCount >= 3) {
    await prisma.bil_tenant_subscriptions.update({
      where: { id: localInvoice.subscription_id! },
      data: { status: "past_due" },
    });

    await prisma.adm_tenants.update({
      where: { id: localInvoice.tenant_id },
      data: { status: "suspended" },
    });

    // Create support ticket
    await createPaymentFailureTicket(localInvoice.tenant_id, invoice.id);
  }

  // Send notification
  await sendPaymentFailedNotification(localInvoice.tenant_id, newAttemptCount);
}

// =============================================================================
// Helper Functions
// =============================================================================

function mapStripeScheduleStatus(
  status: Stripe.SubscriptionSchedule.Status
): string {
  const mapping: Record<string, string> = {
    not_started: "not_started",
    active: "active",
    completed: "completed",
    canceled: "canceled",
    released: "released",
  };
  return mapping[status] || "not_started";
}

function mapStripeInvoiceStatus(status: Stripe.Invoice.Status | null): string {
  const mapping: Record<string, string> = {
    draft: "draft",
    open: "sent",
    paid: "paid",
    uncollectible: "void",
    void: "void",
  };
  return mapping[status || "draft"] || "draft";
}

function findPhaseNumber(schedule: Stripe.SubscriptionSchedule): number {
  if (!schedule.phases) return 0;

  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < schedule.phases.length; i++) {
    const phase = schedule.phases[i];
    if (now >= phase.start_date && now < phase.end_date) {
      return i + 1;
    }
  }

  return schedule.phases.length;
}
```

---

## 8. PRORATION ET CALCULS

### 8.1 Algorithme de Proration

```typescript
// lib/services/billing/proration.service.ts

interface ProrationInput {
  previousPrice: number; // Prix mensuel précédent
  newPrice: number; // Nouveau prix mensuel
  currentPeriodStart: Date; // Début période actuelle
  currentPeriodEnd: Date; // Fin période actuelle
  changeDate: Date; // Date du changement
  billingCycle: "monthly" | "quarterly" | "annual";
}

interface ProrationResult {
  creditAmount: number; // Crédit pour l'ancien plan
  debitAmount: number; // Débit pour le nouveau plan
  netAmount: number; // Montant net (debit - credit)
  daysRemaining: number; // Jours restants dans la période
  totalDays: number; // Jours totaux dans la période
  prorationFactor: number; // Factor de proration (daysRemaining / totalDays)
}

export function calculateProration(input: ProrationInput): ProrationResult {
  const {
    previousPrice,
    newPrice,
    currentPeriodStart,
    currentPeriodEnd,
    changeDate,
  } = input;

  // Calculer les jours
  const totalDays = Math.ceil(
    (currentPeriodEnd.getTime() - currentPeriodStart.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const daysUsed = Math.ceil(
    (changeDate.getTime() - currentPeriodStart.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const daysRemaining = totalDays - daysUsed;

  // Facteur de proration
  const prorationFactor = daysRemaining / totalDays;

  // Calculer les montants
  const creditAmount = previousPrice * prorationFactor;
  const debitAmount = newPrice * prorationFactor;
  const netAmount = debitAmount - creditAmount;

  return {
    creditAmount: Math.round(creditAmount * 100) / 100,
    debitAmount: Math.round(debitAmount * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    daysRemaining,
    totalDays,
    prorationFactor: Math.round(prorationFactor * 10000) / 10000,
  };
}

// Exemples d'utilisation
/*
// Upgrade mid-month
const result = calculateProration({
  previousPrice: 49,
  newPrice: 199,
  currentPeriodStart: new Date('2025-12-01'),
  currentPeriodEnd: new Date('2025-12-31'),
  changeDate: new Date('2025-12-15'),
  billingCycle: 'monthly'
});

// Result:
// {
//   creditAmount: 25.81,  // 49 × (16/31)
//   debitAmount: 102.71,  // 199 × (16/31)
//   netAmount: 76.90,     // À payer
//   daysRemaining: 16,
//   totalDays: 31,
//   prorationFactor: 0.5161
// }
*/
```

### 8.2 Service de Calcul MRR/ARR

```typescript
// lib/services/billing/mrr-calculator.service.ts

interface MRRCalculationInput {
  subscriptions: {
    id: string;
    monthlyPrice: number;
    quantity: number;
    status: string;
    discountPercent?: number;
  }[];
}

interface MRRResult {
  totalMRR: number;
  totalARR: number;
  breakdown: {
    newMRR: number; // Nouveaux clients ce mois
    expansionMRR: number; // Upgrades
    contractionMRR: number; // Downgrades
    churnMRR: number; // Annulations
    netNewMRR: number; // Net change
  };
}

export function calculateMRR(input: MRRCalculationInput): MRRResult {
  let totalMRR = 0;

  for (const sub of input.subscriptions) {
    if (sub.status === "active" || sub.status === "trialing") {
      let subMRR = sub.monthlyPrice * sub.quantity;

      if (sub.discountPercent) {
        subMRR = subMRR * (1 - sub.discountPercent / 100);
      }

      totalMRR += subMRR;
    }
  }

  return {
    totalMRR: Math.round(totalMRR * 100) / 100,
    totalARR: Math.round(totalMRR * 12 * 100) / 100,
    breakdown: {
      newMRR: 0, // Calculated separately with historical data
      expansionMRR: 0,
      contractionMRR: 0,
      churnMRR: 0,
      netNewMRR: 0,
    },
  };
}

// Calculate MRR changes between periods
export function calculateMRRChanges(
  previousPeriod: MRRResult,
  currentPeriod: MRRResult,
  amendments: {
    type: string;
    mrrImpact: number;
  }[]
): MRRResult["breakdown"] {
  const breakdown = {
    newMRR: 0,
    expansionMRR: 0,
    contractionMRR: 0,
    churnMRR: 0,
    netNewMRR: 0,
  };

  for (const amendment of amendments) {
    switch (amendment.type) {
      case "upgrade":
        breakdown.expansionMRR += amendment.mrrImpact;
        break;
      case "downgrade":
        breakdown.contractionMRR += Math.abs(amendment.mrrImpact);
        break;
      case "cancel_immediate":
      case "cancel_scheduled":
        breakdown.churnMRR += Math.abs(amendment.mrrImpact);
        break;
    }
  }

  // New MRR = Total change - amendments
  breakdown.newMRR =
    currentPeriod.totalMRR -
    previousPeriod.totalMRR -
    breakdown.expansionMRR +
    breakdown.contractionMRR +
    breakdown.churnMRR;

  breakdown.netNewMRR =
    breakdown.newMRR +
    breakdown.expansionMRR -
    breakdown.contractionMRR -
    breakdown.churnMRR;

  return breakdown;
}
```

---

## 9. MIGRATIONS SQL

### 9.1 Script de Migration Complet

```sql
-- =============================================================================
-- MIGRATION: Quote-to-Cash Architecture Part 2 - Billing Enterprise
-- Version: 1.0.0
-- Date: 2025-12-06
-- Description: Création des tables bil_subscription_schedules,
--              bil_subscription_schedule_phases, bil_amendments
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1: Types ENUM
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE schedule_status AS ENUM (
        'not_started', 'active', 'completed', 'canceled', 'released'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE schedule_end_behavior AS ENUM (
        'release', 'cancel', 'none'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE phase_status AS ENUM (
        'scheduled', 'active', 'completed', 'skipped'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE amendment_type AS ENUM (
        'upgrade', 'downgrade', 'quantity_change', 'billing_change',
        'plan_change', 'addon_add', 'addon_remove', 'discount_apply',
        'discount_remove', 'price_adjustment', 'pause', 'resume',
        'cancel_scheduled', 'cancel_immediate'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE amendment_status AS ENUM (
        'pending', 'approved', 'applied', 'rejected', 'cancelled', 'failed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- ÉTAPE 2: Table bil_subscription_schedules
-- =============================================================================

CREATE TABLE IF NOT EXISTS bil_subscription_schedules (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    schedule_reference VARCHAR(50) NOT NULL,
    order_id UUID,
    subscription_id UUID,
    stripe_schedule_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status schedule_status NOT NULL DEFAULT 'not_started',
    schedule_start DATE NOT NULL,
    schedule_end DATE,
    total_duration_months INTEGER NOT NULL,
    current_phase_id UUID,
    current_phase_number INTEGER DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    total_contract_value NUMERIC(15, 2) NOT NULL,
    total_mrr NUMERIC(15, 2),
    total_arr NUMERIC(15, 2),
    end_behavior schedule_end_behavior NOT NULL DEFAULT 'release',
    proration_behavior VARCHAR(50) NOT NULL DEFAULT 'create_prorations',
    billing_cycle_anchor INTEGER,
    collection_method VARCHAR(20) NOT NULL DEFAULT 'charge_automatically',
    days_until_due INTEGER DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    sync_error TEXT,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    deletion_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index
CREATE INDEX IF NOT EXISTS idx_bil_subscription_schedules_tenant_id
    ON bil_subscription_schedules(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_subscription_schedules_order_id
    ON bil_subscription_schedules(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bil_subscription_schedules_status
    ON bil_subscription_schedules(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_subscription_schedules_stripe_schedule_id
    ON bil_subscription_schedules(stripe_schedule_id) WHERE stripe_schedule_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bil_subscription_schedules_reference_unique
    ON bil_subscription_schedules(schedule_reference) WHERE deleted_at IS NULL;

-- =============================================================================
-- ÉTAPE 3: Table bil_subscription_schedule_phases
-- =============================================================================

CREATE TABLE IF NOT EXISTS bil_subscription_schedule_phases (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    schedule_id UUID NOT NULL,
    phase_number INTEGER NOT NULL,
    phase_name VARCHAR(100),
    phase_description TEXT,
    status phase_status NOT NULL DEFAULT 'scheduled',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_months INTEGER NOT NULL,
    plan_id UUID NOT NULL,
    stripe_price_id VARCHAR(255),
    unit_price NUMERIC(15, 2) NOT NULL,
    price_override BOOLEAN NOT NULL DEFAULT FALSE,
    original_plan_price NUMERIC(15, 2),
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    discount_reason VARCHAR(200),
    billing_cycle billing_interval NOT NULL DEFAULT 'monthly',
    trial_days INTEGER DEFAULT 0,
    trial_end DATE,
    max_vehicles INTEGER,
    max_drivers INTEGER,
    max_users INTEGER,
    included_addons JSONB DEFAULT '[]'::jsonb,
    phase_value NUMERIC(15, 2),
    phase_mrr NUMERIC(15, 2),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_phase_number UNIQUE (schedule_id, phase_number),
    CONSTRAINT valid_phase_dates CHECK (end_date > start_date),
    CONSTRAINT positive_duration CHECK (duration_months > 0)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_bil_schedule_phases_schedule_id
    ON bil_subscription_schedule_phases(schedule_id);
CREATE INDEX IF NOT EXISTS idx_bil_schedule_phases_status
    ON bil_subscription_schedule_phases(status);
CREATE INDEX IF NOT EXISTS idx_bil_schedule_phases_plan_id
    ON bil_subscription_schedule_phases(plan_id);

-- =============================================================================
-- ÉTAPE 4: Table bil_amendments
-- =============================================================================

CREATE TABLE IF NOT EXISTS bil_amendments (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    amendment_reference VARCHAR(50) NOT NULL,
    subscription_id UUID NOT NULL,
    schedule_id UUID,
    order_id UUID,
    amendment_type amendment_type NOT NULL,
    status amendment_status NOT NULL DEFAULT 'pending',
    effective_date DATE NOT NULL,
    effective_immediately BOOLEAN NOT NULL DEFAULT FALSE,
    previous_plan_id UUID,
    new_plan_id UUID,
    previous_plan_name VARCHAR(200),
    new_plan_name VARCHAR(200),
    previous_quantity INTEGER,
    new_quantity INTEGER,
    previous_price NUMERIC(15, 2),
    new_price NUMERIC(15, 2),
    previous_billing_cycle billing_interval,
    new_billing_cycle billing_interval,
    addon_changes JSONB DEFAULT '[]'::jsonb,
    proration_behavior VARCHAR(50) NOT NULL DEFAULT 'create_prorations',
    proration_date DATE,
    proration_amount NUMERIC(15, 2),
    proration_invoice_id UUID,
    stripe_proration_invoice_id VARCHAR(255),
    mrr_impact NUMERIC(15, 2),
    arr_impact NUMERIC(15, 2),
    reason TEXT NOT NULL,
    internal_notes TEXT,
    customer_notification TEXT,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    requested_by_id UUID,
    approved_by_id UUID,
    approved_at TIMESTAMPTZ,
    rejected_by_id UUID,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    applied_at TIMESTAMPTZ,
    applied_by_id UUID,
    stripe_amendment_applied BOOLEAN DEFAULT FALSE,
    stripe_sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_by UUID,
    deletion_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index
CREATE INDEX IF NOT EXISTS idx_bil_amendments_tenant_id
    ON bil_amendments(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_amendments_subscription_id
    ON bil_amendments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_bil_amendments_status
    ON bil_amendments(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_amendments_amendment_type
    ON bil_amendments(amendment_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_amendments_effective_date
    ON bil_amendments(effective_date) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bil_amendments_reference_unique
    ON bil_amendments(amendment_reference) WHERE deleted_at IS NULL;

-- =============================================================================
-- ÉTAPE 5: Foreign Keys
-- =============================================================================

-- bil_subscription_schedules
ALTER TABLE bil_subscription_schedules
ADD CONSTRAINT IF NOT EXISTS bil_subscription_schedules_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

ALTER TABLE bil_subscription_schedules
ADD CONSTRAINT IF NOT EXISTS bil_subscription_schedules_order_id_fkey
FOREIGN KEY (order_id) REFERENCES crm_orders(id) ON DELETE SET NULL;

-- bil_subscription_schedule_phases
ALTER TABLE bil_subscription_schedule_phases
ADD CONSTRAINT IF NOT EXISTS bil_schedule_phases_schedule_id_fkey
FOREIGN KEY (schedule_id) REFERENCES bil_subscription_schedules(id) ON DELETE CASCADE;

ALTER TABLE bil_subscription_schedule_phases
ADD CONSTRAINT IF NOT EXISTS bil_schedule_phases_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES bil_billing_plans(id) ON DELETE RESTRICT;

-- bil_amendments
ALTER TABLE bil_amendments
ADD CONSTRAINT IF NOT EXISTS bil_amendments_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

ALTER TABLE bil_amendments
ADD CONSTRAINT IF NOT EXISTS bil_amendments_subscription_id_fkey
FOREIGN KEY (subscription_id) REFERENCES bil_tenant_subscriptions(id) ON DELETE CASCADE;

ALTER TABLE bil_amendments
ADD CONSTRAINT IF NOT EXISTS bil_amendments_schedule_id_fkey
FOREIGN KEY (schedule_id) REFERENCES bil_subscription_schedules(id) ON DELETE SET NULL;

-- =============================================================================
-- ÉTAPE 6: Triggers
-- =============================================================================

CREATE TRIGGER IF NOT EXISTS set_bil_subscription_schedules_updated_at
    BEFORE UPDATE ON bil_subscription_schedules
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER IF NOT EXISTS set_bil_schedule_phases_updated_at
    BEFORE UPDATE ON bil_subscription_schedule_phases
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER IF NOT EXISTS set_bil_amendments_updated_at
    BEFORE UPDATE ON bil_amendments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ÉTAPE 7: Table pour logs webhook Stripe
-- =============================================================================

CREATE TABLE IF NOT EXISTS stripe_webhook_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_event_type
    ON stripe_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_created_at
    ON stripe_webhook_logs(created_at DESC);

-- =============================================================================
-- ÉTAPE 8: RLS
-- =============================================================================

ALTER TABLE bil_subscription_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bil_subscription_schedule_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE bil_amendments ENABLE ROW LEVEL SECURITY;

-- Policies temporaires pour développement
CREATE POLICY IF NOT EXISTS temp_allow_all_bil_schedules_dev
    ON bil_subscription_schedules FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS temp_allow_all_bil_phases_dev
    ON bil_subscription_schedule_phases FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS temp_allow_all_bil_amendments_dev
    ON bil_amendments FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- ÉTAPE 9: Commentaires
-- =============================================================================

COMMENT ON TABLE bil_subscription_schedules IS
    'Planification des subscriptions multi-phases avec sync Stripe';
COMMENT ON TABLE bil_subscription_schedule_phases IS
    'Phases individuelles des schedules avec pricing par période';
COMMENT ON TABLE bil_amendments IS
    'Modifications de subscriptions avec proration et sync Stripe';
COMMENT ON TABLE stripe_webhook_logs IS
    'Logs des webhooks Stripe pour debugging et audit';

COMMIT;
```

---

## 10. SERVICES TYPESCRIPT

### 10.1 SubscriptionScheduleService

```typescript
// lib/services/billing/subscription-schedule.service.ts

import { prisma } from "@/lib/db";
import { stripeClient } from "@/lib/services/stripe/stripe-client.service";
import { syncScheduleToStripe } from "@/lib/services/stripe/schedule-sync.service";

interface CreateScheduleInput {
  tenantId: string;
  orderId: string;
  phases: {
    planId: string;
    startDate: Date;
    durationMonths: number;
    unitPrice: number;
    discountPercent?: number;
    billingCycle?: "monthly" | "quarterly" | "annual";
    trialDays?: number;
  }[];
  endBehavior?: "release" | "cancel" | "none";
}

export class SubscriptionScheduleService {
  async createSchedule(input: CreateScheduleInput): Promise<any> {
    // Validate tenant
    const tenant = await prisma.adm_tenants.findUnique({
      where: { id: input.tenantId },
      select: { id: true, stripe_customer_id: true, status: true },
    });

    if (!tenant || tenant.status !== "active") {
      throw new Error("Tenant not found or not active");
    }

    if (!tenant.stripe_customer_id) {
      throw new Error("Tenant has no Stripe customer");
    }

    // Calculate dates and totals
    let currentDate = input.phases[0].startDate;
    let totalContractValue = 0;

    const phasesWithDates = input.phases.map((phase, index) => {
      const startDate = new Date(currentDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + phase.durationMonths);

      const effectivePrice =
        phase.unitPrice * (1 - (phase.discountPercent || 0) / 100);
      const phaseValue = effectivePrice * phase.durationMonths;
      totalContractValue += phaseValue;

      currentDate = endDate;

      return {
        ...phase,
        phaseNumber: index + 1,
        startDate,
        endDate,
        effectivePrice,
        phaseValue,
      };
    });

    const scheduleEnd = phasesWithDates[phasesWithDates.length - 1].endDate;
    const totalDuration = input.phases.reduce(
      (sum, p) => sum + p.durationMonths,
      0
    );

    // Generate reference
    const scheduleReference = await this.generateScheduleReference();

    // Create schedule in DB
    const schedule = await prisma.bil_subscription_schedules.create({
      data: {
        tenant_id: input.tenantId,
        schedule_reference: scheduleReference,
        order_id: input.orderId,
        status: "not_started",
        schedule_start: phasesWithDates[0].startDate,
        schedule_end: scheduleEnd,
        total_duration_months: totalDuration,
        total_contract_value: totalContractValue,
        total_mrr: totalContractValue / totalDuration,
        total_arr: (totalContractValue / totalDuration) * 12,
        end_behavior: input.endBehavior || "release",
        stripe_customer_id: tenant.stripe_customer_id,
      },
    });

    // Create phases in DB
    for (const phase of phasesWithDates) {
      const plan = await prisma.bil_billing_plans.findUnique({
        where: { id: phase.planId },
        select: {
          id: true,
          stripe_price_id_monthly: true,
          price_monthly: true,
        },
      });

      await prisma.bil_subscription_schedule_phases.create({
        data: {
          schedule_id: schedule.id,
          phase_number: phase.phaseNumber,
          phase_name: `Phase ${phase.phaseNumber}`,
          status: "scheduled",
          start_date: phase.startDate,
          end_date: phase.endDate,
          duration_months: phase.durationMonths,
          plan_id: phase.planId,
          stripe_price_id: plan?.stripe_price_id_monthly,
          unit_price: phase.unitPrice,
          original_plan_price: plan?.price_monthly,
          discount_percent: phase.discountPercent || 0,
          billing_cycle: phase.billingCycle || "monthly",
          trial_days: phase.trialDays || 0,
          phase_value: phase.phaseValue,
          phase_mrr: phase.effectivePrice,
        },
      });
    }

    // Sync to Stripe
    const phases = await prisma.bil_subscription_schedule_phases.findMany({
      where: { schedule_id: schedule.id },
      orderBy: { phase_number: "asc" },
    });

    const stripeSchedule = await syncScheduleToStripe({
      scheduleId: schedule.id,
      customerId: tenant.stripe_customer_id,
      phases: phases.map((p) => ({
        planId: p.plan_id,
        stripePriceId: p.stripe_price_id!,
        startDate: p.start_date,
        endDate: p.end_date,
        discountPercent: Number(p.discount_percent),
        trialDays: p.trial_days || 0,
      })),
      endBehavior: input.endBehavior || "release",
    });

    return {
      schedule,
      phases,
      stripeSchedule,
    };
  }

  async getScheduleWithPhases(scheduleId: string): Promise<any> {
    const schedule = await prisma.bil_subscription_schedules.findUnique({
      where: { id: scheduleId },
      include: {
        phases: {
          orderBy: { phase_number: "asc" },
        },
      },
    });

    return schedule;
  }

  async cancelSchedule(scheduleId: string, reason: string): Promise<any> {
    const schedule = await prisma.bil_subscription_schedules.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    if (schedule.status === "completed" || schedule.status === "canceled") {
      throw new Error("Cannot cancel a completed or already canceled schedule");
    }

    // Cancel in Stripe
    if (schedule.stripe_schedule_id) {
      await stripeClient
        .getClient()
        .subscriptionSchedules.cancel(schedule.stripe_schedule_id);
    }

    // Update local
    const updated = await prisma.bil_subscription_schedules.update({
      where: { id: scheduleId },
      data: {
        status: "canceled",
        canceled_at: new Date(),
        notes: reason,
      },
    });

    return updated;
  }

  private async generateScheduleReference(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await prisma.$queryRaw<[{ max_num: number }]>`
      SELECT COALESCE(MAX(CAST(SUBSTRING(schedule_reference FROM 10) AS INTEGER)), 0) + 1 as max_num
      FROM bil_subscription_schedules
      WHERE schedule_reference LIKE ${"SCH-" + year + "-%"}
    `;

    const nextNum = result[0].max_num;
    return `SCH-${year}-${String(nextNum).padStart(5, "0")}`;
  }
}

export const subscriptionScheduleService = new SubscriptionScheduleService();
```

### 10.2 AmendmentService

```typescript
// lib/services/billing/amendment.service.ts

import { prisma } from "@/lib/db";
import { applyAmendmentToStripe } from "@/lib/services/stripe/amendment-sync.service";
import { calculateProration } from "@/lib/services/billing/proration.service";

interface CreateAmendmentInput {
  tenantId: string;
  subscriptionId: string;
  amendmentType: string;
  newPlanId?: string;
  newQuantity?: number;
  newPrice?: number;
  newBillingCycle?: string;
  effectiveDate: Date;
  effectiveImmediately?: boolean;
  reason: string;
  requiresApproval?: boolean;
}

export class AmendmentService {
  async createAmendment(input: CreateAmendmentInput): Promise<any> {
    // Get current subscription
    const subscription = await prisma.bil_tenant_subscriptions.findUnique({
      where: { id: input.subscriptionId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Get new plan if applicable
    let newPlan = null;
    if (input.newPlanId) {
      newPlan = await prisma.bil_billing_plans.findUnique({
        where: { id: input.newPlanId },
      });
    }

    // Calculate proration
    let prorationAmount = 0;

    if (["upgrade", "downgrade", "plan_change"].includes(input.amendmentType)) {
      const proration = calculateProration({
        previousPrice: Number(subscription.plan?.price_monthly || 0),
        newPrice: Number(newPlan?.price_monthly || input.newPrice || 0),
        currentPeriodStart: subscription.current_period_start!,
        currentPeriodEnd: subscription.current_period_end!,
        changeDate: input.effectiveImmediately
          ? new Date()
          : input.effectiveDate,
        billingCycle: subscription.billing_cycle as any,
      });

      prorationAmount = proration.netAmount;
    }

    // Determine if approval needed
    const requiresApproval =
      input.requiresApproval ??
      (input.amendmentType === "downgrade" || prorationAmount < -100); // Credit > 100€

    // Generate reference
    const amendmentReference = await this.generateAmendmentReference();

    // Create amendment
    const amendment = await prisma.bil_amendments.create({
      data: {
        tenant_id: input.tenantId,
        amendment_reference: amendmentReference,
        subscription_id: input.subscriptionId,
        amendment_type: input.amendmentType as any,
        status: requiresApproval ? "pending" : "approved",
        effective_date: input.effectiveDate,
        effective_immediately: input.effectiveImmediately || false,
        previous_plan_id: subscription.plan_id,
        new_plan_id: input.newPlanId,
        previous_plan_name: subscription.plan?.plan_name,
        new_plan_name: newPlan?.plan_name,
        previous_price: subscription.plan?.price_monthly,
        new_price: newPlan?.price_monthly || input.newPrice,
        previous_billing_cycle: subscription.billing_cycle as any,
        new_billing_cycle: input.newBillingCycle as any,
        proration_behavior: "create_prorations",
        proration_date: input.effectiveImmediately
          ? new Date()
          : input.effectiveDate,
        proration_amount: prorationAmount,
        mrr_impact:
          Number(newPlan?.price_monthly || input.newPrice || 0) -
          Number(subscription.plan?.price_monthly || 0),
        reason: input.reason,
        requires_approval: requiresApproval,
        created_by: input.tenantId, // Should be actual user ID
      },
    });

    // If approved and immediate, apply now
    if (!requiresApproval && input.effectiveImmediately) {
      await this.applyAmendment(amendment.id);
    }

    return amendment;
  }

  async approveAmendment(
    amendmentId: string,
    approvedById: string
  ): Promise<any> {
    const amendment = await prisma.bil_amendments.findUnique({
      where: { id: amendmentId },
    });

    if (!amendment || amendment.status !== "pending") {
      throw new Error("Amendment not found or not pending");
    }

    const updated = await prisma.bil_amendments.update({
      where: { id: amendmentId },
      data: {
        status: "approved",
        approved_by_id: approvedById,
        approved_at: new Date(),
      },
    });

    // If effective immediately, apply now
    if (amendment.effective_immediately) {
      await this.applyAmendment(amendmentId);
    }

    return updated;
  }

  async rejectAmendment(
    amendmentId: string,
    rejectedById: string,
    reason: string
  ): Promise<any> {
    return prisma.bil_amendments.update({
      where: { id: amendmentId },
      data: {
        status: "rejected",
        rejected_by_id: rejectedById,
        rejected_at: new Date(),
        rejection_reason: reason,
      },
    });
  }

  async applyAmendment(amendmentId: string): Promise<any> {
    const amendment = await prisma.bil_amendments.findUnique({
      where: { id: amendmentId },
      include: {
        subscription: true,
        new_plan: true,
      },
    });

    if (!amendment || amendment.status !== "approved") {
      throw new Error("Amendment not found or not approved");
    }

    const subscription = amendment.subscription;

    if (!subscription?.provider_subscription_id) {
      throw new Error("No Stripe subscription linked");
    }

    // Apply to Stripe
    const result = await applyAmendmentToStripe({
      amendmentId: amendment.id,
      subscriptionId: subscription.id,
      stripeSubscriptionId: subscription.provider_subscription_id,
      amendmentType: amendment.amendment_type,
      newPriceId: amendment.new_plan?.stripe_price_id_monthly || undefined,
      newQuantity: amendment.new_quantity || undefined,
      prorationBehavior: amendment.proration_behavior,
      effectiveImmediately: amendment.effective_immediately,
    });

    // Update local subscription
    await prisma.bil_tenant_subscriptions.update({
      where: { id: subscription.id },
      data: {
        plan_id: amendment.new_plan_id || subscription.plan_id,
        billing_cycle:
          amendment.new_billing_cycle || subscription.billing_cycle,
      },
    });

    // Create proration invoice if applicable
    if (result.prorationInvoice) {
      await prisma.bil_tenant_invoices.create({
        data: {
          tenant_id: amendment.tenant_id,
          subscription_id: subscription.id,
          invoice_number: `PRO-${Date.now()}`,
          invoice_date: new Date(),
          subtotal: result.prorationInvoice.subtotal / 100,
          total_amount: result.prorationInvoice.total / 100,
          currency: result.prorationInvoice.currency.toUpperCase(),
          status: result.prorationInvoice.status === "paid" ? "paid" : "sent",
          stripe_invoice_id: result.prorationInvoice.id,
          metadata: { amendment_id: amendment.id },
        },
      });
    }

    return amendment;
  }

  private async generateAmendmentReference(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await prisma.$queryRaw<[{ max_num: number }]>`
      SELECT COALESCE(MAX(CAST(SUBSTRING(amendment_reference FROM 10) AS INTEGER)), 0) + 1 as max_num
      FROM bil_amendments
      WHERE amendment_reference LIKE ${"AMD-" + year + "-%"}
    `;

    const nextNum = result[0].max_num;
    return `AMD-${year}-${String(nextNum).padStart(5, "0")}`;
  }
}

export const amendmentService = new AmendmentService();
```

---

**FIN DE LA PARTIE 2**

_Document suivant : PARTIE 3 - Workflows Intégrés et Guide d'Implémentation_
