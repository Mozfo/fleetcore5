# FLEETCORE - SPÉCIFICATION QUOTE-TO-CASH ENTERPRISE

## PARTIE 1 : ARCHITECTURE ET MODÈLE DE DONNÉES

**Version :** 1.0.0  
**Date :** 06 Décembre 2025  
**Auteur :** Architecture FleetCore  
**Statut :** SPÉCIFICATION VALIDÉE

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Analyse des Best Practices Industry](#2-analyse-des-best-practices-industry)
3. [Architecture Quote-to-Cash](#3-architecture-quote-to-cash)
4. [Table CRM_QUOTES](#4-table-crm_quotes)
5. [Table CRM_QUOTE_ITEMS](#5-table-crm_quote_items)
6. [Table CRM_ORDERS](#6-table-crm_orders-migration-crm_contracts)
7. [Table CRM_AGREEMENTS](#7-table-crm_agreements)
8. [Relations inter-tables](#8-relations-inter-tables)
9. [Migrations SQL](#9-migrations-sql)
10. [Validation et conformité](#10-validation-et-conformité)

---

## 1. VUE D'ENSEMBLE

### 1.1 Contexte et Objectif

FleetCore évolue vers une architecture **enterprise-grade** pour son module CRM/Billing. L'objectif est d'implémenter un workflow **Quote-to-Cash** complet aligné sur les best practices de l'industrie SaaS B2B.

**Problème identifié dans l'architecture actuelle :**

- La table `crm_contracts` mélange deux concepts distincts : l'engagement commercial (Order) et l'accord juridique (Agreement)
- Absence d'entité Quote pour la phase de négociation
- Pas de séparation claire entre les documents légaux (MSA, SLA, DPA)
- Impossible de gérer des deals multi-phases ou des modifications mid-term

**Solution proposée :**
Implémentation d'un modèle **Quote → Order → Agreement** inspiré de Salesforce CPQ, Stripe Billing et Chargebee.

### 1.2 Périmètre de la Partie 1

Cette partie couvre :

- ✅ Architecture conceptuelle Quote-to-Cash
- ✅ Table `crm_quotes` et `crm_quote_items`
- ✅ Migration `crm_contracts` → `crm_orders`
- ✅ Nouvelle table `crm_agreements`
- ✅ Relations et contraintes

**Hors périmètre (traité en Partie 2) :**

- Tables `bil_subscription_schedules` et `bil_amendments`
- Intégration Stripe détaillée

### 1.3 Bénéfices Enterprise-Grade

| Fonctionnalité  | Avant                   | Après                                  |
| --------------- | ----------------------- | -------------------------------------- |
| Négociation     | Pas de devis formel     | Quote versionné avec workflow approval |
| Deals complexes | 1 prix fixe             | Multi-phase, ramp-up, discounts        |
| Juridique       | Mélangé avec commercial | MSA/SLA/DPA séparés avec DocuSign      |
| Traçabilité     | Basique                 | Audit trail complet, compliance-ready  |

---

## 2. ANALYSE DES BEST PRACTICES INDUSTRY

### 2.1 Stripe Billing - Sales-Led B2B Model

**Pattern adopté par Stripe :**

```
Quote → Order → Subscription Schedule → Subscription → Invoice
```

**Éléments clés Stripe :**

- **Quote Object** : Durée de validité, lignes de devis, termes de paiement
- **Subscription Schedule** : Phases avec dates, prix différents par phase
- **Proration** : Calcul automatique des ajustements mid-term

**Source :** [Stripe Billing Documentation - Quotes](https://stripe.com/docs/billing/quotes)

### 2.2 Chargebee - Object Relationship Model

**Modèle Chargebee :**

```
Customer → Quote → Subscription → Invoice
            ↓
      Quote Line Items (Products/Plans)
```

**Points forts Chargebee :**

- Quotes avec versioning automatique
- Conversion Quote → Subscription en un clic
- Gestion des upgrades/downgrades avec proration

**Source :** [Chargebee Documentation - Quotes](https://www.chargebee.com/docs/2.0/quotes.html)

### 2.3 Salesforce CPQ - Quote-to-Order Workflow

**Pipeline Salesforce CPQ :**

```
Opportunity → Quote → Quote Line Items → Order → Order Products
                ↓
            Approval Process
                ↓
            Contract (si nécessaire)
```

**Best Practices Salesforce :**

- Quote = Proposition commerciale (peut être révisée)
- Order = Engagement confirmé (immutable après création)
- Contract = Document légal séparé

**Source :** [Salesforce CPQ Implementation Guide](https://help.salesforce.com/s/articleView?id=sf.cpq_quote_overview.htm)

### 2.4 Synthèse : Pattern Enterprise Retenu

```
┌─────────────────────────────────────────────────────────────────┐
│                    SALES DOMAIN (CRM)                           │
├─────────────────────────────────────────────────────────────────┤
│  Lead → Opportunity → Quote (v1, v2, v3...) → Order             │
│                                                ↓                │
│                                           Agreement(s)          │
│                                         (MSA, SLA, DPA)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BILLING DOMAIN (BIL)                          │
├─────────────────────────────────────────────────────────────────┤
│  Order → Subscription Schedule → Subscription → Invoice         │
│                    ↓                    ↓                       │
│             Schedule Phases        Amendments                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. ARCHITECTURE QUOTE-TO-CASH

### 3.1 Diagramme Entités-Relations

```
                                    ┌──────────────────┐
                                    │    crm_leads     │
                                    └────────┬─────────┘
                                             │
                                             ▼
                               ┌─────────────────────────┐
                               │   crm_opportunities     │
                               └────────────┬────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
                    ▼                                               │
          ┌─────────────────┐                                       │
          │   crm_quotes    │                                       │
          ├─────────────────┤                                       │
          │ • opportunity_id│◄──────────────────────────────────────┘
          │ • parent_quote_id (versioning)
          │ • status (draft→sent→accepted)
          │ • valid_until
          │ • total_value
          └────────┬────────┘
                   │
                   │ 1:N
                   ▼
        ┌──────────────────────┐
        │   crm_quote_items    │
        ├──────────────────────┤
        │ • quote_id           │
        │ • item_type (plan,   │
        │   addon, service)    │
        │ • quantity           │
        │ • unit_price         │
        └──────────────────────┘

          ┌─────────────────┐         ┌─────────────────────┐
          │   crm_orders    │────────▶│   crm_agreements    │
          ├─────────────────┤   1:N   ├─────────────────────┤
          │ • quote_id      │         │ • order_id          │
          │ • order_type    │         │ • agreement_type    │
          │ • fulfillment_  │         │   (MSA, SLA, DPA)   │
          │   status        │         │ • signature_method  │
          └────────┬────────┘         │ • signed_document_  │
                   │                  │   url               │
                   │                  └─────────────────────┘
                   ▼
   ┌───────────────────────────────┐
   │  bil_subscription_schedules  │◄───── (Partie 2)
   │  bil_tenant_subscriptions    │
   │  bil_amendments              │
   └───────────────────────────────┘
```

### 3.2 Workflow Quote-to-Cash Complet

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: QUALIFICATION                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Lead créé (formulaire, import, événement)                               │
│  2. Lead scoring automatique (fit + engagement)                             │
│  3. Lead qualifié → Conversion en Opportunity                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: SALES PIPELINE                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Opportunity créée avec expected_value                                   │
│  2. Progression : Prospecting → Qualification → Proposal → Negotiation      │
│  3. Commercial prépare proposition                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: QUOTING                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Quote v1 créé (draft)                                                   │
│     - Sélection plan(s)                                                     │
│     - Ajout add-ons et services                                             │
│     - Application discounts                                                 │
│     - Définition durée contrat                                              │
│  2. Quote envoyé au prospect (status: sent)                                 │
│  3. Prospect demande modifications                                          │
│  4. Quote v2 créé (parent_quote_id = v1.id)                                 │
│  5. Quote v2 accepté (status: accepted)                                     │
│  6. PDF Quote généré et stocké                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: CONTRACTING                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Quote accepté → Order créé automatiquement                              │
│     - order_type = 'new'                                                    │
│     - fulfillment_status = 'pending'                                        │
│  2. Agreement(s) créé(s) selon configuration :                              │
│     - MSA (Master Service Agreement) obligatoire                            │
│     - SLA (Service Level Agreement) si Enterprise                           │
│     - DPA (Data Processing Agreement) si RGPD                               │
│  3. Envoi signature électronique (DocuSign/PandaDoc)                        │
│  4. Client signe tous les documents                                         │
│  5. Agreement.status → 'signed'                                             │
│  6. Order.fulfillment_status → 'ready_for_fulfillment'                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: BILLING SETUP                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Order fulfilled → Subscription Schedule créé (si multi-phase)           │
│  2. Subscription créée dans bil_tenant_subscriptions                        │
│  3. Synchronisation Stripe :                                                │
│     - Customer créé/mis à jour                                              │
│     - Subscription créée                                                    │
│     - Payment method attaché                                                │
│  4. Première invoice générée (ou trial démarré)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: TENANT PROVISIONING                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Subscription active → Tenant créé dans adm_tenants                      │
│  2. Clerk Organization créée via API                                        │
│  3. Subdomain généré (abc-logistics.fleetcore.com)                          │
│  4. Settings tenant initialisés                                             │
│  5. Invitation envoyée au contact principal                                 │
│  6. Email welcome avec liens d'accès                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 7: ONGOING BILLING                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Invoice mensuelle/annuelle automatique                                  │
│  2. Usage metrics collectés (véhicules, drivers, API calls)                 │
│  3. Overages calculés vs quotas plan                                        │
│  4. Paiement automatique via Stripe                                         │
│  5. Webhooks Stripe → mise à jour statuts                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 8: LIFECYCLE MANAGEMENT                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  UPGRADE/DOWNGRADE:                                                         │
│  1. Amendment créé (type: upgrade/downgrade)                                │
│  2. Proration calculée automatiquement                                      │
│  3. Invoice proration générée                                               │
│  4. Subscription mise à jour                                                │
│                                                                             │
│  RENEWAL:                                                                   │
│  1. Alerte X jours avant expiry_date                                        │
│  2. Si auto_renew → Renewal automatique                                     │
│  3. Sinon → Quote renewal créé                                              │
│  4. Négociation nouveau tarif                                               │
│  5. Quote accepté → Order renewal créé                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 États et Transitions

#### États Quote (crm_quotes.status)

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
              ┌──────────┐                                │
              │  draft   │                                │
              └────┬─────┘                                │
                   │ [Send to customer]                   │
                   ▼                                      │
              ┌──────────┐                                │
              │   sent   │─────────────────┐              │
              └────┬─────┘                 │              │
                   │                       │              │
      ┌────────────┼────────────┐          │              │
      │            │            │          │              │
      ▼            ▼            ▼          ▼              │
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ accepted │ │ rejected │ │ expired  │ │  viewed  │───────┘
└────┬─────┘ └──────────┘ └──────────┘ └──────────┘
     │
     │ [Convert to Order]
     ▼
┌──────────┐
│converted │
└──────────┘
```

**Règles de transition :**

- `draft` → `sent` : Quote envoyé par email au prospect
- `sent` → `viewed` : Prospect a ouvert le lien du quote (tracking)
- `sent/viewed` → `accepted` : Prospect a accepté le quote
- `sent/viewed` → `rejected` : Prospect a refusé le quote
- `sent/viewed` → `expired` : Date `valid_until` dépassée sans réponse
- `accepted` → `converted` : Quote converti en Order

#### États Order (crm_orders.fulfillment_status)

```
              ┌──────────┐
              │ pending  │
              └────┬─────┘
                   │ [Agreements signed]
                   ▼
        ┌─────────────────────┐
        │ ready_for_fulfillment│
        └────────┬────────────┘
                 │ [Subscription created]
                 ▼
           ┌───────────┐
           │ fulfilled │
           └─────┬─────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
  ┌───────────┐    ┌───────────┐
  │  active   │    │ cancelled │
  └───────────┘    └───────────┘
```

#### États Agreement (crm_agreements.status)

```
              ┌──────────┐
              │  draft   │
              └────┬─────┘
                   │ [Send for signature]
                   ▼
        ┌─────────────────────┐
        │ pending_signature   │
        └────────┬────────────┘
                 │ [Signature received]
                 ▼
           ┌───────────┐
           │  signed   │
           └─────┬─────┘
                 │ [Effective date reached]
                 ▼
           ┌───────────┐
           │  active   │
           └─────┬─────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
  ┌───────────┐    ┌───────────┐
  │  expired  │    │terminated │
  └───────────┘    └───────────┘
```

---

## 4. TABLE CRM_QUOTES

### 4.1 Vue d'ensemble

**Rôle métier :** La table `crm_quotes` représente les propositions commerciales formelles envoyées aux prospects. Un quote est versionné (v1, v2, v3...) et permet de suivre l'historique complet des négociations.

**Position dans le workflow :** Un quote est créé à partir d'une opportunity en phase de négociation. Lorsqu'il est accepté, il génère automatiquement un order.

### 4.2 Schéma DDL Complet

```sql
-- =============================================================================
-- TABLE: crm_quotes
-- Description: Propositions commerciales versionnées
-- =============================================================================

-- Type ENUM pour le statut du quote
CREATE TYPE quote_status AS ENUM (
    'draft',           -- En cours de rédaction
    'sent',            -- Envoyé au prospect
    'viewed',          -- Prospect a consulté le quote
    'accepted',        -- Prospect a accepté
    'rejected',        -- Prospect a refusé
    'expired',         -- Date de validité dépassée
    'converted'        -- Converti en Order
);

-- Type ENUM pour le cycle de facturation
CREATE TYPE billing_interval AS ENUM (
    'monthly',
    'quarterly',
    'semi_annual',
    'annual'
);

-- Type ENUM pour le type de discount
CREATE TYPE discount_type AS ENUM (
    'percentage',      -- Remise en pourcentage
    'fixed_amount'     -- Remise en montant fixe
);

-- Table principale
CREATE TABLE crm_quotes (
    -- Identifiant
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

    -- Référence unique (affichée au client)
    quote_reference VARCHAR(50) NOT NULL,
    -- Format: QOT-YYYY-NNNNN (ex: QOT-2025-00001)

    -- Code interne (usage technique)
    quote_code VARCHAR(30) NOT NULL,
    -- Format: Q2025-NNN (ex: Q2025-001)

    -- Versioning
    quote_version INTEGER NOT NULL DEFAULT 1,
    parent_quote_id UUID REFERENCES crm_quotes(id) ON DELETE SET NULL,
    -- NULL si première version, sinon pointe vers version précédente

    -- Relation avec opportunity (obligatoire)
    opportunity_id UUID NOT NULL,
    -- FK vers crm_opportunities

    -- Statut du quote
    status quote_status NOT NULL DEFAULT 'draft',

    -- Validité
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    -- Règle: valid_until > valid_from
    -- Défaut recommandé: valid_from + 30 jours

    -- Termes du contrat proposé
    contract_start_date DATE,
    -- Date de début proposée pour le contrat

    contract_duration_months INTEGER NOT NULL DEFAULT 12,
    -- Durée en mois (12, 24, 36...)

    billing_cycle billing_interval NOT NULL DEFAULT 'monthly',
    -- Fréquence de facturation

    -- Montants
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    -- Code ISO 4217 (EUR, USD, AED)

    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    -- Somme des lignes avant discount

    discount_type discount_type,
    -- Type de remise (NULL si pas de remise)

    discount_value NUMERIC(15, 2) DEFAULT 0,
    -- Valeur de la remise (pourcentage ou montant)

    discount_amount NUMERIC(15, 2) GENERATED ALWAYS AS (
        CASE
            WHEN discount_type = 'percentage' THEN subtotal * discount_value / 100
            WHEN discount_type = 'fixed_amount' THEN discount_value
            ELSE 0
        END
    ) STORED,
    -- Montant de la remise calculé

    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    -- Taux de TVA (ex: 20.00 pour 20%)

    tax_amount NUMERIC(15, 2) GENERATED ALWAYS AS (
        (subtotal - COALESCE(
            CASE
                WHEN discount_type = 'percentage' THEN subtotal * discount_value / 100
                WHEN discount_type = 'fixed_amount' THEN discount_value
                ELSE 0
            END, 0
        )) * tax_rate / 100
    ) STORED,
    -- Montant TVA calculé

    total_value NUMERIC(15, 2) GENERATED ALWAYS AS (
        subtotal
        - COALESCE(
            CASE
                WHEN discount_type = 'percentage' THEN subtotal * discount_value / 100
                WHEN discount_type = 'fixed_amount' THEN discount_value
                ELSE 0
            END, 0
        )
        + ((subtotal - COALESCE(
            CASE
                WHEN discount_type = 'percentage' THEN subtotal * discount_value / 100
                WHEN discount_type = 'fixed_amount' THEN discount_value
                ELSE 0
            END, 0
        )) * tax_rate / 100)
    ) STORED,
    -- Montant total TTC

    -- Valeurs calculées pour analytics
    monthly_recurring_value NUMERIC(15, 2),
    -- MRR = total_value / contract_duration_months
    -- Mis à jour par trigger

    annual_recurring_value NUMERIC(15, 2),
    -- ARR = monthly_recurring_value * 12
    -- Mis à jour par trigger

    -- Conversion en Order
    converted_to_order_id UUID,
    -- Renseigné quand status = 'converted'
    converted_at TIMESTAMPTZ,

    -- Document PDF généré
    document_url TEXT,
    -- URL vers le PDF du quote (S3/Cloudflare R2)

    document_generated_at TIMESTAMPTZ,
    -- Date de dernière génération du PDF

    -- Tracking client
    sent_at TIMESTAMPTZ,
    -- Date d'envoi au prospect

    first_viewed_at TIMESTAMPTZ,
    -- Première consultation par le prospect

    last_viewed_at TIMESTAMPTZ,
    -- Dernière consultation

    view_count INTEGER NOT NULL DEFAULT 0,
    -- Nombre de consultations

    accepted_at TIMESTAMPTZ,
    -- Date d'acceptation

    rejected_at TIMESTAMPTZ,
    -- Date de refus

    rejection_reason TEXT,
    -- Motif de refus (si applicable)

    expired_at TIMESTAMPTZ,
    -- Date d'expiration (si applicable)

    -- Notes et métadonnées
    notes TEXT,
    -- Notes internes (non visibles par le prospect)

    terms_and_conditions TEXT,
    -- CGV spécifiques (override des CGV par défaut)

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Données additionnelles flexibles

    -- Audit trail
    created_by UUID NOT NULL,
    -- FK vers adm_provider_employees

    updated_by UUID,

    deleted_by UUID,

    deletion_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Contraintes
    CONSTRAINT quote_reference_unique UNIQUE (quote_reference) WHERE deleted_at IS NULL,
    CONSTRAINT quote_code_unique UNIQUE (quote_code) WHERE deleted_at IS NULL,
    CONSTRAINT valid_date_range CHECK (valid_until > valid_from),
    CONSTRAINT positive_subtotal CHECK (subtotal >= 0),
    CONSTRAINT positive_duration CHECK (contract_duration_months > 0),
    CONSTRAINT valid_discount_percentage CHECK (
        discount_type != 'percentage' OR (discount_value >= 0 AND discount_value <= 100)
    ),
    CONSTRAINT valid_discount_amount CHECK (
        discount_type != 'fixed_amount' OR discount_value >= 0
    ),
    CONSTRAINT valid_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

-- Index
CREATE INDEX idx_crm_quotes_opportunity_id ON crm_quotes(opportunity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_quotes_status ON crm_quotes(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_quotes_valid_until ON crm_quotes(valid_until) WHERE deleted_at IS NULL AND status = 'sent';
CREATE INDEX idx_crm_quotes_parent_quote_id ON crm_quotes(parent_quote_id) WHERE parent_quote_id IS NOT NULL;
CREATE INDEX idx_crm_quotes_created_by ON crm_quotes(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_quotes_created_at ON crm_quotes(created_at DESC) WHERE deleted_at IS NULL;

-- Trigger updated_at
CREATE TRIGGER set_crm_quotes_updated_at
    BEFORE UPDATE ON crm_quotes
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Trigger pour calculer MRR/ARR
CREATE OR REPLACE FUNCTION calculate_quote_recurring_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer MRR (Monthly Recurring Value)
    IF NEW.contract_duration_months > 0 THEN
        NEW.monthly_recurring_value := NEW.total_value / NEW.contract_duration_months;
        NEW.annual_recurring_value := NEW.monthly_recurring_value * 12;
    ELSE
        NEW.monthly_recurring_value := 0;
        NEW.annual_recurring_value := 0;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_quote_recurring
    BEFORE INSERT OR UPDATE ON crm_quotes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quote_recurring_values();

-- Commentaires
COMMENT ON TABLE crm_quotes IS 'Propositions commerciales versionnées pour FleetCore B2B SaaS';
COMMENT ON COLUMN crm_quotes.quote_reference IS 'Référence unique affichée au client (format: QOT-YYYY-NNNNN)';
COMMENT ON COLUMN crm_quotes.quote_version IS 'Numéro de version (1, 2, 3...)';
COMMENT ON COLUMN crm_quotes.parent_quote_id IS 'Référence à la version précédente pour le versioning';
COMMENT ON COLUMN crm_quotes.total_value IS 'Valeur totale TTC du contrat proposé (colonne générée)';
COMMENT ON COLUMN crm_quotes.monthly_recurring_value IS 'MRR calculé automatiquement';
```

### 4.3 Documentation des Colonnes Critiques

#### 4.3.1 quote_reference

| Aspect         | Description                                |
| -------------- | ------------------------------------------ |
| **Type**       | VARCHAR(50), NOT NULL                      |
| **Format**     | QOT-YYYY-NNNNN (ex: QOT-2025-00001)        |
| **Rôle**       | Identifiant unique visible par le client   |
| **Génération** | Automatique via fonction SQL               |
| **Règles**     | - Unique au niveau global (pas par tenant) |
|                | - Incrémentation séquentielle par année    |
|                | - Non modifiable après création            |

**Fonction de génération :**

```sql
CREATE OR REPLACE FUNCTION generate_quote_reference()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    next_number INTEGER;
    new_reference VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(quote_reference FROM 10) AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM crm_quotes
    WHERE quote_reference LIKE 'QOT-' || current_year || '-%';

    new_reference := 'QOT-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');
    RETURN new_reference;
END;
$$ LANGUAGE plpgsql;
```

#### 4.3.2 status

| Statut      | Description                  | Actions permises                              |
| ----------- | ---------------------------- | --------------------------------------------- |
| `draft`     | Quote en cours de rédaction  | Modifier, Supprimer, Envoyer                  |
| `sent`      | Quote envoyé au prospect     | Créer nouvelle version, Annuler               |
| `viewed`    | Prospect a consulté le quote | Créer nouvelle version, Annuler               |
| `accepted`  | Prospect a accepté           | Convertir en Order                            |
| `rejected`  | Prospect a refusé            | Créer nouvelle version (si encore dans délai) |
| `expired`   | Date de validité dépassée    | Créer nouvelle version                        |
| `converted` | Converti en Order            | Aucune (lecture seule)                        |

**Règles de transition :**

```sql
CREATE OR REPLACE FUNCTION validate_quote_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Définir les transitions valides
    IF OLD.status = 'draft' AND NEW.status NOT IN ('draft', 'sent') THEN
        RAISE EXCEPTION 'Invalid transition from draft to %', NEW.status;
    END IF;

    IF OLD.status = 'sent' AND NEW.status NOT IN ('sent', 'viewed', 'accepted', 'rejected', 'expired') THEN
        RAISE EXCEPTION 'Invalid transition from sent to %', NEW.status;
    END IF;

    IF OLD.status = 'viewed' AND NEW.status NOT IN ('viewed', 'accepted', 'rejected', 'expired') THEN
        RAISE EXCEPTION 'Invalid transition from viewed to %', NEW.status;
    END IF;

    IF OLD.status = 'accepted' AND NEW.status NOT IN ('accepted', 'converted') THEN
        RAISE EXCEPTION 'Invalid transition from accepted to %', NEW.status;
    END IF;

    IF OLD.status IN ('rejected', 'expired', 'converted') THEN
        RAISE EXCEPTION 'Cannot transition from terminal status %', OLD.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_quote_status
    BEFORE UPDATE OF status ON crm_quotes
    FOR EACH ROW
    EXECUTE FUNCTION validate_quote_status_transition();
```

#### 4.3.3 versioning (parent_quote_id)

**Concept :** Chaque quote peut avoir plusieurs versions. La nouvelle version pointe vers la précédente via `parent_quote_id`.

**Exemple de chaîne de versions :**

```
Quote v1 (id: aaa-111) → parent_quote_id: NULL
    ↓
Quote v2 (id: bbb-222) → parent_quote_id: aaa-111
    ↓
Quote v3 (id: ccc-333) → parent_quote_id: bbb-222 ← ACCEPTÉ
```

**Requête pour obtenir l'historique complet :**

```sql
WITH RECURSIVE quote_history AS (
    -- Quote de départ (le plus récent)
    SELECT id, quote_reference, quote_version, parent_quote_id, status, total_value, created_at
    FROM crm_quotes
    WHERE id = :current_quote_id

    UNION ALL

    -- Versions précédentes
    SELECT q.id, q.quote_reference, q.quote_version, q.parent_quote_id, q.status, q.total_value, q.created_at
    FROM crm_quotes q
    INNER JOIN quote_history qh ON q.id = qh.parent_quote_id
)
SELECT * FROM quote_history ORDER BY quote_version DESC;
```

### 4.4 Règles Métier

#### RM-QOT-001 : Création de Quote

```
RÈGLE: Un quote ne peut être créé que si:
  1. L'opportunity existe et n'est pas deleted
  2. L'opportunity.status = 'open'
  3. L'opportunity.stage IN ('proposal', 'negotiation', 'closing')
  4. L'utilisateur a la permission 'quotes.create'

VALIDATION:
  - opportunity_id obligatoire
  - valid_until > valid_from
  - contract_duration_months > 0
  - Au moins un quote_item doit être ajouté avant envoi
```

#### RM-QOT-002 : Envoi de Quote

```
RÈGLE: Un quote peut être envoyé (draft → sent) si:
  1. Au moins un quote_item existe
  2. subtotal > 0
  3. valid_until > CURRENT_DATE
  4. document_url est généré (PDF)

ACTIONS DÉCLENCHÉES:
  - sent_at = NOW()
  - Email envoyé au contact de l'opportunity
  - Notification au commercial owner
  - Audit log créé
```

#### RM-QOT-003 : Acceptation de Quote

```
RÈGLE: Un quote peut être accepté (sent/viewed → accepted) si:
  1. valid_until >= CURRENT_DATE (pas expiré)
  2. Aucun autre quote de cette opportunity n'est 'accepted'

ACTIONS DÉCLENCHÉES:
  - accepted_at = NOW()
  - Opportunity.stage → 'closing' (si pas déjà)
  - Notification au commercial et manager
  - Email de confirmation au prospect
```

#### RM-QOT-004 : Conversion en Order

```
RÈGLE: Un quote peut être converti en order (accepted → converted) si:
  1. status = 'accepted'
  2. converted_to_order_id IS NULL

ACTIONS DÉCLENCHÉES:
  - Création automatique de crm_orders avec toutes les données
  - converted_to_order_id = new_order.id
  - converted_at = NOW()
  - status = 'converted'
  - Opportunity.status = 'won'
  - Opportunity.won_date = NOW()
  - Opportunity.won_value = quote.total_value
  - Opportunity.contract_id = new_order.id
```

#### RM-QOT-005 : Expiration Automatique

```
RÈGLE: Les quotes sont automatiquement expirés quand:
  1. status IN ('sent', 'viewed')
  2. valid_until < CURRENT_DATE

JOB CRON: Quotidien à 00:05
  UPDATE crm_quotes
  SET status = 'expired', expired_at = NOW()
  WHERE status IN ('sent', 'viewed')
    AND valid_until < CURRENT_DATE
    AND deleted_at IS NULL;

ACTIONS DÉCLENCHÉES:
  - expired_at = NOW()
  - Email de notification au commercial
  - Tâche de follow-up créée
```

### 4.5 API Endpoints

| Méthode | Endpoint                             | Description                          |
| ------- | ------------------------------------ | ------------------------------------ |
| GET     | `/api/v1/crm/quotes`                 | Liste des quotes avec filtres        |
| GET     | `/api/v1/crm/quotes/:id`             | Détail d'un quote                    |
| GET     | `/api/v1/crm/quotes/:id/history`     | Historique des versions              |
| GET     | `/api/v1/crm/quotes/:id/pdf`         | Télécharger le PDF                   |
| POST    | `/api/v1/crm/quotes`                 | Créer un quote                       |
| PUT     | `/api/v1/crm/quotes/:id`             | Modifier un quote (draft uniquement) |
| POST    | `/api/v1/crm/quotes/:id/send`        | Envoyer au prospect                  |
| POST    | `/api/v1/crm/quotes/:id/accept`      | Marquer comme accepté                |
| POST    | `/api/v1/crm/quotes/:id/reject`      | Marquer comme refusé                 |
| POST    | `/api/v1/crm/quotes/:id/convert`     | Convertir en Order                   |
| POST    | `/api/v1/crm/quotes/:id/new-version` | Créer nouvelle version               |
| DELETE  | `/api/v1/crm/quotes/:id`             | Supprimer (soft delete)              |

---

## 5. TABLE CRM_QUOTE_ITEMS

### 5.1 Vue d'ensemble

**Rôle métier :** Les `crm_quote_items` représentent les lignes de détail d'un quote. Chaque ligne peut être un plan, un add-on, un service ponctuel ou une ligne personnalisée.

### 5.2 Schéma DDL Complet

```sql
-- =============================================================================
-- TABLE: crm_quote_items
-- Description: Lignes de détail des quotes
-- =============================================================================

-- Type ENUM pour le type de ligne
CREATE TYPE quote_item_type AS ENUM (
    'plan',           -- Plan d'abonnement principal
    'addon',          -- Module complémentaire récurrent
    'service',        -- Service ponctuel (setup, training...)
    'custom'          -- Ligne personnalisée
);

-- Type ENUM pour la récurrence
CREATE TYPE item_recurrence AS ENUM (
    'one_time',       -- Paiement unique
    'recurring'       -- Paiement récurrent
);

-- Table
CREATE TABLE crm_quote_items (
    -- Identifiant
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

    -- Relation avec quote (obligatoire)
    quote_id UUID NOT NULL REFERENCES crm_quotes(id) ON DELETE CASCADE,

    -- Ordre d'affichage
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Type de ligne
    item_type quote_item_type NOT NULL,

    -- Récurrence
    recurrence item_recurrence NOT NULL DEFAULT 'recurring',

    -- Référence au catalogue (optionnel selon item_type)
    plan_id UUID,
    -- FK vers bil_billing_plans si item_type = 'plan'

    addon_id UUID,
    -- FK vers bil_plan_addons si item_type = 'addon' (table future)

    service_id UUID,
    -- FK vers bil_services si item_type = 'service' (table future)

    -- Description
    name VARCHAR(200) NOT NULL,
    -- Nom affiché (copié depuis catalogue ou personnalisé)

    description TEXT,
    -- Description détaillée

    -- SKU (Stock Keeping Unit)
    sku VARCHAR(50),
    -- Code produit interne

    -- Quantité et prix
    quantity INTEGER NOT NULL DEFAULT 1,
    -- Nombre d'unités

    unit_price NUMERIC(15, 2) NOT NULL,
    -- Prix unitaire (peut être override du prix catalogue)

    -- Discount sur la ligne (optionnel)
    line_discount_type discount_type,

    line_discount_value NUMERIC(15, 2) DEFAULT 0,

    line_discount_amount NUMERIC(15, 2) GENERATED ALWAYS AS (
        CASE
            WHEN line_discount_type = 'percentage' THEN (quantity * unit_price) * line_discount_value / 100
            WHEN line_discount_type = 'fixed_amount' THEN line_discount_value
            ELSE 0
        END
    ) STORED,

    -- Total ligne
    line_total NUMERIC(15, 2) GENERATED ALWAYS AS (
        (quantity * unit_price) - COALESCE(
            CASE
                WHEN line_discount_type = 'percentage' THEN (quantity * unit_price) * line_discount_value / 100
                WHEN line_discount_type = 'fixed_amount' THEN line_discount_value
                ELSE 0
            END, 0
        )
    ) STORED,

    -- Métadonnées
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Ex: {"included_vehicles": 50, "included_drivers": 100}

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_unit_price CHECK (unit_price >= 0),
    CONSTRAINT valid_line_discount CHECK (
        line_discount_type IS NULL OR line_discount_value >= 0
    )
);

-- Index
CREATE INDEX idx_crm_quote_items_quote_id ON crm_quote_items(quote_id);
CREATE INDEX idx_crm_quote_items_item_type ON crm_quote_items(item_type);
CREATE INDEX idx_crm_quote_items_plan_id ON crm_quote_items(plan_id) WHERE plan_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER set_crm_quote_items_updated_at
    BEFORE UPDATE ON crm_quote_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Trigger pour recalculer le subtotal du quote
CREATE OR REPLACE FUNCTION update_quote_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculer subtotal du quote parent
    UPDATE crm_quotes
    SET subtotal = (
        SELECT COALESCE(SUM(line_total), 0)
        FROM crm_quote_items
        WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id)
    )
    WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_subtotal_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON crm_quote_items
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_subtotal();

-- Commentaires
COMMENT ON TABLE crm_quote_items IS 'Lignes de détail des propositions commerciales';
COMMENT ON COLUMN crm_quote_items.item_type IS 'Type de ligne: plan, addon, service, custom';
COMMENT ON COLUMN crm_quote_items.line_total IS 'Total de la ligne après discount (colonne générée)';
```

### 5.3 Exemples de Lignes

```json
// Exemple: Quote pour ABC Logistics - Plan Enterprise
{
  "quote_items": [
    {
      "sort_order": 1,
      "item_type": "plan",
      "recurrence": "recurring",
      "plan_id": "uuid-enterprise-plan",
      "name": "FleetCore Enterprise",
      "description": "Plan Enterprise - jusqu'à 100 véhicules et 200 chauffeurs",
      "sku": "PLAN-ENT-100",
      "quantity": 1,
      "unit_price": 199.0,
      "line_discount_type": "percentage",
      "line_discount_value": 10,
      "metadata": {
        "included_vehicles": 100,
        "included_drivers": 200,
        "included_api_calls": 100000
      }
    },
    {
      "sort_order": 2,
      "item_type": "addon",
      "recurrence": "recurring",
      "addon_id": "uuid-addon-gps",
      "name": "Module GPS Tracking",
      "description": "Suivi GPS temps réel avec historique 90 jours",
      "sku": "ADDON-GPS-PRO",
      "quantity": 1,
      "unit_price": 49.0,
      "line_discount_type": null
    },
    {
      "sort_order": 3,
      "item_type": "service",
      "recurrence": "one_time",
      "service_id": "uuid-service-setup",
      "name": "Setup & Configuration",
      "description": "Configuration initiale, import données, formation admin",
      "sku": "SVC-SETUP-ENT",
      "quantity": 1,
      "unit_price": 500.0,
      "line_discount_type": null
    },
    {
      "sort_order": 4,
      "item_type": "custom",
      "recurrence": "one_time",
      "name": "Migration données legacy",
      "description": "Import et nettoyage des données depuis système précédent",
      "quantity": 1,
      "unit_price": 750.0,
      "line_discount_type": null
    }
  ],
  "calculated_values": {
    "subtotal": 1319.1,
    "discount_amount": 0,
    "tax_amount": 263.82,
    "total_value": 1582.92
  }
}
```

---

## 6. TABLE CRM_ORDERS (Migration crm_contracts)

### 6.1 Vue d'ensemble

**Rôle métier :** La table `crm_orders` (renommée depuis `crm_contracts`) représente l'engagement commercial confirmé. Un order est créé lorsqu'un quote est accepté et converti.

**Migration stratégique :** Renommer `crm_contracts` → `crm_orders` pour clarifier la séparation entre :

- **Order** = Engagement commercial (termes, prix, durée)
- **Agreement** = Document juridique (MSA, SLA, signatures)

### 6.2 Plan de Migration

```sql
-- =============================================================================
-- MIGRATION: crm_contracts → crm_orders
-- =============================================================================

-- Étape 1: Renommer la table
ALTER TABLE crm_contracts RENAME TO crm_orders;

-- Étape 2: Renommer les contraintes
ALTER TABLE crm_orders RENAME CONSTRAINT crm_contracts_pkey TO crm_orders_pkey;

-- Étape 3: Renommer les index
ALTER INDEX crm_contracts_lead_id_idx RENAME TO crm_orders_lead_id_idx;
ALTER INDEX crm_contracts_opportunity_id_idx RENAME TO crm_orders_opportunity_id_idx;
ALTER INDEX crm_contracts_status_idx RENAME TO crm_orders_status_idx;
ALTER INDEX crm_contracts_effective_date_idx RENAME TO crm_orders_effective_date_idx;
ALTER INDEX crm_contracts_expiry_date_idx RENAME TO crm_orders_expiry_date_idx;

-- Étape 4: Mettre à jour le commentaire
COMMENT ON TABLE crm_orders IS 'Commandes confirmées suite à acceptation de quote - anciennement crm_contracts';
```

### 6.3 Nouvelles Colonnes à Ajouter

```sql
-- =============================================================================
-- ÉVOLUTIONS: crm_orders - Nouvelles colonnes enterprise
-- =============================================================================

-- Type ENUM pour le type d'order
CREATE TYPE order_type AS ENUM (
    'new',           -- Nouvelle commande
    'renewal',       -- Renouvellement
    'upgrade',       -- Upgrade de plan
    'downgrade',     -- Downgrade de plan
    'amendment'      -- Modification de termes
);

-- Type ENUM pour le statut de fulfillment
CREATE TYPE order_fulfillment_status AS ENUM (
    'pending',                -- En attente (agreements non signés)
    'ready_for_fulfillment',  -- Prêt (agreements signés)
    'in_progress',            -- Provisioning en cours
    'fulfilled',              -- Tenant provisionné
    'active',                 -- Contrat actif
    'cancelled',              -- Annulé
    'expired'                 -- Expiré
);

-- Ajouter les nouvelles colonnes
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS quote_id UUID;
-- Lien vers le quote d'origine

ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS order_type order_type NOT NULL DEFAULT 'new';
-- Type de commande

ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS fulfillment_status order_fulfillment_status NOT NULL DEFAULT 'pending';
-- Statut de fulfillment

ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS order_reference VARCHAR(50);
-- Référence unique (format: ORD-YYYY-NNNNN)

ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS order_code VARCHAR(30);
-- Code interne (format: O2025-NNN)

-- Colonnes billing
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS billing_cycle billing_interval NOT NULL DEFAULT 'monthly';
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS monthly_value NUMERIC(15, 2);
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS annual_value NUMERIC(15, 2);

-- Colonnes renewal
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS notice_period_days INTEGER NOT NULL DEFAULT 30;

-- Colonnes tenant
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- Créé lors du fulfillment

ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS subscription_id UUID;
-- Lien vers bil_tenant_subscriptions

-- Colonnes tracking
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- FK vers quote
ALTER TABLE crm_orders
ADD CONSTRAINT crm_orders_quote_id_fkey
FOREIGN KEY (quote_id) REFERENCES crm_quotes(id) ON DELETE SET NULL;

-- Index additionnels
CREATE INDEX IF NOT EXISTS idx_crm_orders_quote_id ON crm_orders(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_orders_order_type ON crm_orders(order_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_orders_fulfillment_status ON crm_orders(fulfillment_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_orders_tenant_id ON crm_orders(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_orders_subscription_id ON crm_orders(subscription_id) WHERE subscription_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_orders_reference_unique ON crm_orders(order_reference) WHERE deleted_at IS NULL;
```

### 6.4 Schéma Final crm_orders

```sql
-- =============================================================================
-- TABLE FINALE: crm_orders (après migration)
-- =============================================================================

-- Structure attendue
CREATE TABLE crm_orders (
    -- Identifiant
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

    -- Références
    order_reference VARCHAR(50) NOT NULL,       -- ORD-2025-00001
    order_code VARCHAR(30) NOT NULL,            -- O2025-001

    -- Relations CRM
    lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES crm_quotes(id) ON DELETE SET NULL,

    -- Type et statut
    order_type order_type NOT NULL DEFAULT 'new',
    status crm_contract_status NOT NULL DEFAULT 'draft',  -- Enum existant
    fulfillment_status order_fulfillment_status NOT NULL DEFAULT 'pending',

    -- Dates
    contract_date DATE NOT NULL,                -- Date de création order
    effective_date DATE NOT NULL,               -- Date d'effet
    expiry_date DATE,                           -- Date de fin
    renewal_date DATE,                          -- Date de renouvellement

    -- Valeurs financières
    total_value NUMERIC(18, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    billing_cycle billing_interval NOT NULL DEFAULT 'monthly',
    monthly_value NUMERIC(15, 2),               -- Calculé
    annual_value NUMERIC(15, 2),                -- Calculé

    -- Renouvellement
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    notice_period_days INTEGER NOT NULL DEFAULT 30,

    -- Relations downstream
    tenant_id UUID,                             -- Lien tenant créé
    subscription_id UUID,                       -- Lien subscription

    -- Tracking
    fulfilled_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,

    -- Métadonnées
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Audit
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    deletion_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### 6.5 Règles Métier crm_orders

#### RM-ORD-001 : Création depuis Quote

```
RÈGLE: Un order est créé automatiquement quand:
  1. Quote.status passe à 'accepted'
  2. Action 'convert' est appelée sur le quote

DONNÉES COPIÉES:
  - lead_id ← opportunity.lead_id
  - opportunity_id ← quote.opportunity_id
  - quote_id ← quote.id
  - total_value ← quote.total_value
  - currency ← quote.currency
  - billing_cycle ← quote.billing_cycle
  - effective_date ← quote.contract_start_date OR CURRENT_DATE
  - expiry_date ← effective_date + quote.contract_duration_months

STATUTS:
  - order.status = 'draft'
  - order.fulfillment_status = 'pending'
```

#### RM-ORD-002 : Transition vers Ready for Fulfillment

```
RÈGLE: Un order passe à 'ready_for_fulfillment' quand:
  1. Tous les agreements obligatoires sont signés
  2. Au minimum: MSA signé

VÉRIFICATION:
  SELECT COUNT(*)
  FROM crm_agreements
  WHERE order_id = :order_id
    AND agreement_type = 'msa'
    AND status = 'signed';
```

#### RM-ORD-003 : Fulfillment (Provisioning Tenant)

```
RÈGLE: Le fulfillment est déclenché quand:
  1. fulfillment_status = 'ready_for_fulfillment'
  2. effective_date <= CURRENT_DATE

ACTIONS:
  1. Créer tenant dans adm_tenants
  2. Créer organization Clerk
  3. Générer subdomain
  4. Créer subscription dans bil_tenant_subscriptions
  5. Envoyer invitation au contact principal
  6. Mettre à jour:
     - order.tenant_id = new_tenant.id
     - order.subscription_id = new_subscription.id
     - order.fulfillment_status = 'fulfilled'
     - order.fulfilled_at = NOW()
```

---

## 7. TABLE CRM_AGREEMENTS

### 7.1 Vue d'ensemble

**Rôle métier :** La table `crm_agreements` contient les documents juridiques associés à un order. Plusieurs types d'agreements peuvent être liés à un seul order.

**Types d'agreements supportés :**

- **MSA** (Master Service Agreement) : Contrat cadre principal
- **SLA** (Service Level Agreement) : Niveaux de service garantis
- **DPA** (Data Processing Agreement) : Accord traitement données RGPD
- **NDA** (Non-Disclosure Agreement) : Confidentialité
- **SOW** (Statement of Work) : Périmètre de travail spécifique

### 7.2 Schéma DDL Complet

```sql
-- =============================================================================
-- TABLE: crm_agreements
-- Description: Documents juridiques associés aux orders
-- =============================================================================

-- Type ENUM pour le type d'agreement
CREATE TYPE agreement_type AS ENUM (
    'msa',      -- Master Service Agreement
    'sla',      -- Service Level Agreement
    'dpa',      -- Data Processing Agreement
    'nda',      -- Non-Disclosure Agreement
    'sow',      -- Statement of Work
    'addendum', -- Avenant au contrat
    'other'     -- Autre type
);

-- Type ENUM pour le statut
CREATE TYPE agreement_status AS ENUM (
    'draft',              -- En cours de rédaction
    'pending_review',     -- En attente de revue interne
    'pending_signature',  -- Envoyé pour signature
    'signed',             -- Signé par toutes les parties
    'active',             -- Actif (effective_date atteinte)
    'expired',            -- Expiré
    'terminated',         -- Résilié
    'superseded'          -- Remplacé par une nouvelle version
);

-- Type ENUM pour la méthode de signature
CREATE TYPE signature_method AS ENUM (
    'electronic',   -- Signature électronique (DocuSign, PandaDoc)
    'wet_ink',      -- Signature manuscrite
    'click_wrap'    -- Acceptation par clic
);

-- Table
CREATE TABLE crm_agreements (
    -- Identifiant
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

    -- Référence unique
    agreement_reference VARCHAR(50) NOT NULL,
    -- Format: AGR-{TYPE}-YYYY-NNNNN (ex: AGR-MSA-2025-00001)

    -- Relation avec order (obligatoire)
    order_id UUID NOT NULL REFERENCES crm_orders(id) ON DELETE CASCADE,

    -- Type et version
    agreement_type agreement_type NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,

    -- Relation versioning
    parent_agreement_id UUID REFERENCES crm_agreements(id) ON DELETE SET NULL,
    -- NULL si première version

    -- Statut
    status agreement_status NOT NULL DEFAULT 'draft',

    -- Dates
    effective_date DATE,
    -- Date d'entrée en vigueur (peut être différente de la date de signature)

    expiry_date DATE,
    -- Date d'expiration (NULL si perpétuel)

    -- Signature électronique
    signature_method signature_method NOT NULL DEFAULT 'electronic',

    signature_provider VARCHAR(50),
    -- 'docusign', 'pandadoc', 'hellosign'

    provider_envelope_id TEXT,
    -- ID du document chez le provider

    provider_envelope_url TEXT,
    -- URL pour accéder au document chez le provider

    -- Signataires client
    client_signatory_name VARCHAR(200),
    client_signatory_email VARCHAR(255),
    client_signatory_title VARCHAR(100),
    client_signed_at TIMESTAMPTZ,
    client_signature_ip VARCHAR(45),

    -- Signataires FleetCore
    provider_signatory_id UUID,
    -- FK vers adm_provider_employees (qui signe côté FleetCore)

    provider_signatory_name VARCHAR(200),
    provider_signatory_title VARCHAR(100),
    provider_signed_at TIMESTAMPTZ,

    -- Documents
    document_url TEXT,
    -- URL vers le document non signé (template rempli)

    signed_document_url TEXT,
    -- URL vers le document signé final

    -- Termes légaux
    terms_version VARCHAR(20),
    -- Version des CGV/CGU utilisées (ex: "2025.01")

    governing_law VARCHAR(100),
    -- Droit applicable (ex: "UAE Law", "French Law")

    jurisdiction VARCHAR(100),
    -- Juridiction compétente (ex: "Dubai Courts", "Paris Commercial Court")

    -- Métadonnées
    custom_clauses JSONB DEFAULT '[]'::jsonb,
    -- Clauses spécifiques ajoutées pour ce client
    -- Format: [{"title": "...", "content": "..."}]

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Notes
    internal_notes TEXT,
    -- Notes internes (non visibles par le client)

    -- Audit
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_by UUID,
    deletion_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    sent_for_signature_at TIMESTAMPTZ,

    -- Contraintes
    CONSTRAINT agreement_reference_unique UNIQUE (agreement_reference) WHERE deleted_at IS NULL,
    CONSTRAINT valid_dates CHECK (expiry_date IS NULL OR expiry_date > effective_date),
    CONSTRAINT signed_requires_dates CHECK (
        status NOT IN ('signed', 'active') OR (client_signed_at IS NOT NULL)
    )
);

-- Index
CREATE INDEX idx_crm_agreements_order_id ON crm_agreements(order_id);
CREATE INDEX idx_crm_agreements_agreement_type ON crm_agreements(agreement_type);
CREATE INDEX idx_crm_agreements_status ON crm_agreements(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_agreements_effective_date ON crm_agreements(effective_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_agreements_expiry_date ON crm_agreements(expiry_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_agreements_provider_envelope_id ON crm_agreements(provider_envelope_id) WHERE provider_envelope_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER set_crm_agreements_updated_at
    BEFORE UPDATE ON crm_agreements
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Commentaires
COMMENT ON TABLE crm_agreements IS 'Documents juridiques (MSA, SLA, DPA...) associés aux commandes';
COMMENT ON COLUMN crm_agreements.agreement_type IS 'Type de document: msa, sla, dpa, nda, sow, addendum, other';
COMMENT ON COLUMN crm_agreements.provider_envelope_id IS 'Identifiant du document chez DocuSign/PandaDoc';
COMMENT ON COLUMN crm_agreements.signed_document_url IS 'URL vers le PDF signé final (stocké S3/R2)';
```

### 7.3 Workflow Signature Électronique

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WORKFLOW SIGNATURE DOCUSIGN                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. PRÉPARATION (status: draft)                                             │
│     - Template sélectionné selon agreement_type                             │
│     - Variables remplacées (nom client, dates, montants)                    │
│     - document_url généré et stocké                                         │
│                                                                             │
│  2. ENVOI (status: pending_signature)                                       │
│     - API DocuSign: CreateEnvelope                                          │
│       {                                                                     │
│         "emailSubject": "FleetCore - MSA to sign",                          │
│         "documents": [{ "documentBase64": "...", "name": "MSA" }],          │
│         "recipients": {                                                     │
│           "signers": [                                                      │
│             { "email": "client@abc.com", "name": "Ahmed...", "order": 1 },  │
│             { "email": "legal@fleetcore.com", "name": "...", "order": 2 }   │
│           ]                                                                 │
│         }                                                                   │
│       }                                                                     │
│     - provider_envelope_id stocké                                           │
│     - sent_for_signature_at = NOW()                                         │
│                                                                             │
│  3. TRACKING                                                                │
│     - Webhooks DocuSign reçus:                                              │
│       • recipient-viewed → log consultation                                 │
│       • recipient-signed → client_signed_at = NOW()                         │
│       • recipient-signed (2) → provider_signed_at = NOW()                   │
│       • envelope-completed → status = 'signed'                              │
│                                                                             │
│  4. FINALISATION (status: signed)                                           │
│     - API DocuSign: GetDocument                                             │
│     - PDF signé téléchargé et stocké                                        │
│     - signed_document_url mis à jour                                        │
│     - Notification aux parties prenantes                                    │
│     - Vérification si tous les agreements sont signés → Order.status        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Règles Métier crm_agreements

#### RM-AGR-001 : Création Automatique

```
RÈGLE: Les agreements sont créés automatiquement quand:
  1. Order est créé depuis Quote
  2. Selon configuration du plan/client:
     - MSA: TOUJOURS créé (obligatoire)
     - SLA: Si plan = 'enterprise' OU custom_clauses.sla = true
     - DPA: Si client.country IN (EU, UK) OU custom_clauses.dpa = true
     - NDA: Si custom_clauses.nda = true

TEMPLATES:
  - MSA → templates/agreements/msa_v2025.01.docx
  - SLA → templates/agreements/sla_v2025.01.docx
  - DPA → templates/agreements/dpa_v2025.01.docx
```

#### RM-AGR-002 : Validation Avant Envoi

```
RÈGLE: Un agreement peut être envoyé pour signature si:
  1. status = 'draft' ou 'pending_review'
  2. document_url est généré
  3. client_signatory_email est valide
  4. governing_law et jurisdiction sont renseignés

VALIDATION:
  - Email format valide
  - Document accessible (URL valide)
```

#### RM-AGR-003 : Webhooks DocuSign

```
ENDPOINT: POST /api/webhooks/docusign

EVENTS GÉRÉS:
  - envelope-sent → Log envoi
  - recipient-viewed → Log consultation
  - recipient-signed → Mise à jour signed_at
  - envelope-completed → status = 'signed'
  - envelope-declined → status = 'draft' + notification
  - envelope-voided → status = 'terminated'

SÉCURITÉ:
  - Validation signature HMAC DocuSign
  - Vérification envelope_id existe en base
```

---

## 8. RELATIONS INTER-TABLES

### 8.1 Diagramme des Foreign Keys

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RELATIONS CRM QUOTE-TO-CASH                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  crm_leads                                                                  │
│     │                                                                       │
│     │ 1:N                                                                   │
│     ▼                                                                       │
│  crm_opportunities ◄──────────────────────────────────────┐                 │
│     │                                                     │                 │
│     │ 1:N                                                 │                 │
│     ▼                                                     │                 │
│  crm_quotes ──────────────────┐                           │                 │
│     │                         │ versioning                │                 │
│     │ 1:N                     │ (parent_quote_id)         │                 │
│     ▼                         ▼                           │                 │
│  crm_quote_items          crm_quotes                      │                 │
│                                                           │                 │
│  crm_quotes.accepted                                      │                 │
│     │                                                     │                 │
│     │ conversion (1:1)                                    │                 │
│     ▼                                                     │                 │
│  crm_orders ◄─────────────────────────────────────────────┘                 │
│     │         (lead_id, opportunity_id, quote_id)                           │
│     │                                                                       │
│     │ 1:N                                                                   │
│     ▼                                                                       │
│  crm_agreements                                                             │
│     │                                                                       │
│     │ versioning                                                            │
│     ▼ (parent_agreement_id)                                                 │
│  crm_agreements                                                             │
│                                                                             │
│  crm_orders.fulfilled                                                       │
│     │                                                                       │
│     │ création (1:1)                                                        │
│     ▼                                                                       │
│  adm_tenants ──────────────────┐                                            │
│     │                          │                                            │
│     │                          │ tenant_id                                  │
│     ▼                          ▼                                            │
│  bil_tenant_subscriptions ◄────┘                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Contraintes Référentielles

```sql
-- =============================================================================
-- FOREIGN KEYS COMPLÈTES
-- =============================================================================

-- crm_quotes → crm_opportunities
ALTER TABLE crm_quotes
ADD CONSTRAINT crm_quotes_opportunity_id_fkey
FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id)
ON DELETE RESTRICT;
-- RESTRICT: Impossible de supprimer une opportunity avec quotes

-- crm_quotes → crm_quotes (versioning)
ALTER TABLE crm_quotes
ADD CONSTRAINT crm_quotes_parent_quote_id_fkey
FOREIGN KEY (parent_quote_id) REFERENCES crm_quotes(id)
ON DELETE SET NULL;

-- crm_quotes → crm_orders (conversion)
ALTER TABLE crm_quotes
ADD CONSTRAINT crm_quotes_converted_to_order_id_fkey
FOREIGN KEY (converted_to_order_id) REFERENCES crm_orders(id)
ON DELETE SET NULL;

-- crm_quote_items → crm_quotes
ALTER TABLE crm_quote_items
ADD CONSTRAINT crm_quote_items_quote_id_fkey
FOREIGN KEY (quote_id) REFERENCES crm_quotes(id)
ON DELETE CASCADE;
-- CASCADE: Suppression quote → suppression items

-- crm_quote_items → bil_billing_plans
ALTER TABLE crm_quote_items
ADD CONSTRAINT crm_quote_items_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES bil_billing_plans(id)
ON DELETE RESTRICT;

-- crm_orders → crm_quotes
ALTER TABLE crm_orders
ADD CONSTRAINT crm_orders_quote_id_fkey
FOREIGN KEY (quote_id) REFERENCES crm_quotes(id)
ON DELETE SET NULL;

-- crm_orders → crm_opportunities
ALTER TABLE crm_orders
ADD CONSTRAINT crm_orders_opportunity_id_fkey
FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id)
ON DELETE SET NULL;

-- crm_orders → crm_leads
ALTER TABLE crm_orders
ADD CONSTRAINT crm_orders_lead_id_fkey
FOREIGN KEY (lead_id) REFERENCES crm_leads(id)
ON DELETE SET NULL;

-- crm_orders → adm_tenants
ALTER TABLE crm_orders
ADD CONSTRAINT crm_orders_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
ON DELETE SET NULL;

-- crm_orders → bil_tenant_subscriptions
ALTER TABLE crm_orders
ADD CONSTRAINT crm_orders_subscription_id_fkey
FOREIGN KEY (subscription_id) REFERENCES bil_tenant_subscriptions(id)
ON DELETE SET NULL;

-- crm_agreements → crm_orders
ALTER TABLE crm_agreements
ADD CONSTRAINT crm_agreements_order_id_fkey
FOREIGN KEY (order_id) REFERENCES crm_orders(id)
ON DELETE CASCADE;

-- crm_agreements → crm_agreements (versioning)
ALTER TABLE crm_agreements
ADD CONSTRAINT crm_agreements_parent_agreement_id_fkey
FOREIGN KEY (parent_agreement_id) REFERENCES crm_agreements(id)
ON DELETE SET NULL;

-- crm_agreements → adm_provider_employees (signataire)
ALTER TABLE crm_agreements
ADD CONSTRAINT crm_agreements_provider_signatory_id_fkey
FOREIGN KEY (provider_signatory_id) REFERENCES adm_provider_employees(id)
ON DELETE SET NULL;
```

---

## 9. MIGRATIONS SQL

### 9.1 Script de Migration Principal

```sql
-- =============================================================================
-- MIGRATION: Quote-to-Cash Architecture Part 1
-- Version: 1.0.0
-- Date: 2025-12-06
-- Description: Création des tables crm_quotes, crm_quote_items, crm_agreements
--              et migration crm_contracts → crm_orders
-- =============================================================================

BEGIN;

-- Vérifier que les prérequis existent
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_opportunities') THEN
        RAISE EXCEPTION 'Table crm_opportunities must exist before running this migration';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'crm_contracts') THEN
        RAISE EXCEPTION 'Table crm_contracts must exist before running this migration';
    END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1: Création des types ENUM
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE quote_status AS ENUM (
        'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE billing_interval AS ENUM (
        'monthly', 'quarterly', 'semi_annual', 'annual'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM (
        'percentage', 'fixed_amount'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE quote_item_type AS ENUM (
        'plan', 'addon', 'service', 'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE item_recurrence AS ENUM (
        'one_time', 'recurring'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM (
        'new', 'renewal', 'upgrade', 'downgrade', 'amendment'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE order_fulfillment_status AS ENUM (
        'pending', 'ready_for_fulfillment', 'in_progress', 'fulfilled', 'active', 'cancelled', 'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE agreement_type AS ENUM (
        'msa', 'sla', 'dpa', 'nda', 'sow', 'addendum', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE agreement_status AS ENUM (
        'draft', 'pending_review', 'pending_signature', 'signed', 'active', 'expired', 'terminated', 'superseded'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE signature_method AS ENUM (
        'electronic', 'wet_ink', 'click_wrap'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- ÉTAPE 2: Création table crm_quotes
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm_quotes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    quote_reference VARCHAR(50) NOT NULL,
    quote_code VARCHAR(30) NOT NULL,
    quote_version INTEGER NOT NULL DEFAULT 1,
    parent_quote_id UUID,
    opportunity_id UUID NOT NULL,
    status quote_status NOT NULL DEFAULT 'draft',
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    contract_start_date DATE,
    contract_duration_months INTEGER NOT NULL DEFAULT 12,
    billing_cycle billing_interval NOT NULL DEFAULT 'monthly',
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_type discount_type,
    discount_value NUMERIC(15, 2) DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    monthly_recurring_value NUMERIC(15, 2),
    annual_recurring_value NUMERIC(15, 2),
    converted_to_order_id UUID,
    converted_at TIMESTAMPTZ,
    document_url TEXT,
    document_generated_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    first_viewed_at TIMESTAMPTZ,
    last_viewed_at TIMESTAMPTZ,
    view_count INTEGER NOT NULL DEFAULT 0,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    expired_at TIMESTAMPTZ,
    notes TEXT,
    terms_and_conditions TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_by UUID,
    deletion_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index crm_quotes
CREATE INDEX IF NOT EXISTS idx_crm_quotes_opportunity_id ON crm_quotes(opportunity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_quotes_status ON crm_quotes(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_quotes_valid_until ON crm_quotes(valid_until) WHERE deleted_at IS NULL AND status = 'sent';
CREATE INDEX IF NOT EXISTS idx_crm_quotes_parent_quote_id ON crm_quotes(parent_quote_id) WHERE parent_quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_quotes_created_by ON crm_quotes(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_quotes_created_at ON crm_quotes(created_at DESC) WHERE deleted_at IS NULL;

-- Contraintes crm_quotes
ALTER TABLE crm_quotes ADD CONSTRAINT IF NOT EXISTS quote_reference_unique
    UNIQUE (quote_reference);
ALTER TABLE crm_quotes ADD CONSTRAINT IF NOT EXISTS valid_date_range
    CHECK (valid_until > valid_from);
ALTER TABLE crm_quotes ADD CONSTRAINT IF NOT EXISTS positive_subtotal
    CHECK (subtotal >= 0);
ALTER TABLE crm_quotes ADD CONSTRAINT IF NOT EXISTS positive_duration
    CHECK (contract_duration_months > 0);

-- =============================================================================
-- ÉTAPE 3: Création table crm_quote_items
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm_quote_items (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    quote_id UUID NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    item_type quote_item_type NOT NULL,
    recurrence item_recurrence NOT NULL DEFAULT 'recurring',
    plan_id UUID,
    addon_id UUID,
    service_id UUID,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(15, 2) NOT NULL,
    line_discount_type discount_type,
    line_discount_value NUMERIC(15, 2) DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index crm_quote_items
CREATE INDEX IF NOT EXISTS idx_crm_quote_items_quote_id ON crm_quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_crm_quote_items_item_type ON crm_quote_items(item_type);
CREATE INDEX IF NOT EXISTS idx_crm_quote_items_plan_id ON crm_quote_items(plan_id) WHERE plan_id IS NOT NULL;

-- Contraintes crm_quote_items
ALTER TABLE crm_quote_items ADD CONSTRAINT IF NOT EXISTS positive_quantity
    CHECK (quantity > 0);
ALTER TABLE crm_quote_items ADD CONSTRAINT IF NOT EXISTS positive_unit_price
    CHECK (unit_price >= 0);

-- FK crm_quote_items
ALTER TABLE crm_quote_items ADD CONSTRAINT IF NOT EXISTS crm_quote_items_quote_id_fkey
    FOREIGN KEY (quote_id) REFERENCES crm_quotes(id) ON DELETE CASCADE;

-- =============================================================================
-- ÉTAPE 4: Migration crm_contracts → crm_orders
-- =============================================================================

-- Renommer la table
ALTER TABLE IF EXISTS crm_contracts RENAME TO crm_orders;

-- Ajouter les nouvelles colonnes
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS quote_id UUID;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS order_type order_type DEFAULT 'new';
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS fulfillment_status order_fulfillment_status DEFAULT 'pending';
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS order_reference VARCHAR(50);
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS order_code VARCHAR(30);
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS billing_cycle billing_interval DEFAULT 'monthly';
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS monthly_value NUMERIC(15, 2);
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS annual_value NUMERIC(15, 2);
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS notice_period_days INTEGER DEFAULT 30;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS subscription_id UUID;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Migrer contract_reference vers order_reference pour les enregistrements existants
UPDATE crm_orders
SET order_reference = REPLACE(contract_reference, 'CTR', 'ORD')
WHERE order_reference IS NULL AND contract_reference IS NOT NULL;

-- Index additionnels crm_orders
CREATE INDEX IF NOT EXISTS idx_crm_orders_quote_id ON crm_orders(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_orders_order_type ON crm_orders(order_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_orders_fulfillment_status ON crm_orders(fulfillment_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_orders_tenant_id ON crm_orders(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_orders_subscription_id ON crm_orders(subscription_id) WHERE subscription_id IS NOT NULL;

-- =============================================================================
-- ÉTAPE 5: Création table crm_agreements
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm_agreements (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    agreement_reference VARCHAR(50) NOT NULL,
    order_id UUID NOT NULL,
    agreement_type agreement_type NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    parent_agreement_id UUID,
    status agreement_status NOT NULL DEFAULT 'draft',
    effective_date DATE,
    expiry_date DATE,
    signature_method signature_method NOT NULL DEFAULT 'electronic',
    signature_provider VARCHAR(50),
    provider_envelope_id TEXT,
    provider_envelope_url TEXT,
    client_signatory_name VARCHAR(200),
    client_signatory_email VARCHAR(255),
    client_signatory_title VARCHAR(100),
    client_signed_at TIMESTAMPTZ,
    client_signature_ip VARCHAR(45),
    provider_signatory_id UUID,
    provider_signatory_name VARCHAR(200),
    provider_signatory_title VARCHAR(100),
    provider_signed_at TIMESTAMPTZ,
    document_url TEXT,
    signed_document_url TEXT,
    terms_version VARCHAR(20),
    governing_law VARCHAR(100),
    jurisdiction VARCHAR(100),
    custom_clauses JSONB DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    internal_notes TEXT,
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_by UUID,
    deletion_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    sent_for_signature_at TIMESTAMPTZ
);

-- Index crm_agreements
CREATE INDEX IF NOT EXISTS idx_crm_agreements_order_id ON crm_agreements(order_id);
CREATE INDEX IF NOT EXISTS idx_crm_agreements_agreement_type ON crm_agreements(agreement_type);
CREATE INDEX IF NOT EXISTS idx_crm_agreements_status ON crm_agreements(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_agreements_effective_date ON crm_agreements(effective_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_agreements_expiry_date ON crm_agreements(expiry_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_agreements_provider_envelope_id ON crm_agreements(provider_envelope_id) WHERE provider_envelope_id IS NOT NULL;

-- Contraintes crm_agreements
ALTER TABLE crm_agreements ADD CONSTRAINT IF NOT EXISTS agreement_reference_unique
    UNIQUE (agreement_reference);

-- FK crm_agreements
ALTER TABLE crm_agreements ADD CONSTRAINT IF NOT EXISTS crm_agreements_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES crm_orders(id) ON DELETE CASCADE;

-- =============================================================================
-- ÉTAPE 6: Triggers
-- =============================================================================

-- Trigger updated_at pour toutes les tables
CREATE TRIGGER IF NOT EXISTS set_crm_quotes_updated_at
    BEFORE UPDATE ON crm_quotes
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER IF NOT EXISTS set_crm_quote_items_updated_at
    BEFORE UPDATE ON crm_quote_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER IF NOT EXISTS set_crm_agreements_updated_at
    BEFORE UPDATE ON crm_agreements
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ÉTAPE 7: RLS Policies
-- =============================================================================

ALTER TABLE crm_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_agreements ENABLE ROW LEVEL SECURITY;

-- Policies temporaires pour développement
CREATE POLICY IF NOT EXISTS temp_allow_all_crm_quotes_dev
    ON crm_quotes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS temp_allow_all_crm_quote_items_dev
    ON crm_quote_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS temp_allow_all_crm_agreements_dev
    ON crm_agreements FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- ÉTAPE 8: Commentaires
-- =============================================================================

COMMENT ON TABLE crm_quotes IS 'Propositions commerciales versionnées pour FleetCore B2B SaaS';
COMMENT ON TABLE crm_quote_items IS 'Lignes de détail des propositions commerciales';
COMMENT ON TABLE crm_orders IS 'Commandes confirmées - anciennement crm_contracts';
COMMENT ON TABLE crm_agreements IS 'Documents juridiques (MSA, SLA, DPA) associés aux commandes';

COMMIT;
```

---

## 10. VALIDATION ET CONFORMITÉ

### 10.1 Checklist Technique

| Critère               | Statut | Notes                                              |
| --------------------- | ------ | -------------------------------------------------- |
| Types ENUM définis    | ✅     | 10 types ENUM créés                                |
| Tables créées         | ✅     | 4 tables (quotes, quote_items, orders, agreements) |
| Index optimisés       | ✅     | Index sur FK, status, dates                        |
| Contraintes intégrité | ✅     | CHECK, UNIQUE, FK                                  |
| Triggers updated_at   | ✅     | Sur toutes les tables                              |
| RLS activé            | ✅     | Policies dev temporaires                           |
| Commentaires          | ✅     | Sur tables et colonnes critiques                   |
| Migration réversible  | ✅     | Script rollback disponible                         |

### 10.2 Alignement Best Practices

| Source         | Pattern               | Implémentation FleetCore      |
| -------------- | --------------------- | ----------------------------- |
| Stripe         | Quote Object          | ✅ crm_quotes avec versioning |
| Stripe         | Subscription Schedule | (Partie 2)                    |
| Chargebee      | Quote Line Items      | ✅ crm_quote_items            |
| Salesforce CPQ | Quote → Order         | ✅ Conversion automatique     |
| Salesforce CPQ | Approval Process      | ✅ status workflow            |
| Industry       | Legal Separation      | ✅ crm_agreements séparé      |

### 10.3 Prochaines Étapes (Partie 2)

- [ ] Table `bil_subscription_schedules`
- [ ] Table `bil_subscription_schedule_phases`
- [ ] Table `bil_amendments`
- [ ] Intégration Stripe API complète
- [ ] Webhooks Stripe handlers
- [ ] Proration automatique

---

**FIN DE LA PARTIE 1**

_Document suivant : PARTIE 2 - Billing Enterprise avec Stripe (Subscription Schedules, Amendments)_
