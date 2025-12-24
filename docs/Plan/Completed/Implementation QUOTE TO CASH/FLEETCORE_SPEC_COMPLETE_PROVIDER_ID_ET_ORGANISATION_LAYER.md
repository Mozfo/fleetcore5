# FLEETCORE - SPÉCIFICATION TECHNIQUE COMPLÈTE

## Chantier A : CRM Provider_ID + Chantier B : Organisation Layer Clients

**Version :** 2.0.0  
**Date :** 7 Décembre 2025  
**Auteur :** Architecture FleetCore  
**Statut :** SPÉCIFICATION À VALIDER  
**Prérequis :** Quote-to-Cash Étapes 0.1-0.4 complétées

---

## TABLE DES MATIÈRES

### PARTIE I - ANALYSE DE L'EXISTANT

1. [État Actuel du Schéma](#1-état-actuel-du-schéma)
2. [Deux Problèmes Distincts](#2-deux-problèmes-distincts)

### PARTIE II - CHANTIER A : CRM PROVIDER_ID

3. [Architecture Provider (Divisions FleetCore)](#3-architecture-provider-divisions-fleetcore)
4. [Tables à Créer - Chantier A](#4-tables-à-créer---chantier-a)
5. [Tables à Modifier - Chantier A](#5-tables-à-modifier---chantier-a)
6. [Migrations SQL - Chantier A](#6-migrations-sql---chantier-a)
7. [Seed Data - Chantier A](#7-seed-data---chantier-a)

### PARTIE III - CHANTIER B : ORGANISATION LAYER CLIENTS

8. [Architecture Organisation (Groupes Clients)](#8-architecture-organisation-groupes-clients)
9. [Tables à Créer - Chantier B](#9-tables-à-créer---chantier-b)
10. [Tables à Modifier - Chantier B](#10-tables-à-modifier---chantier-b)
11. [Migrations SQL - Chantier B](#11-migrations-sql---chantier-b)
12. [Workflow Wizard Mère-Fille](#12-workflow-wizard-mère-fille)

### PARTIE IV - IMPLÉMENTATION

13. [RLS Policies](#13-rls-policies)
14. [Modifications Code](#14-modifications-code)
15. [Plan d'Exécution Consolidé](#15-plan-dexécution-consolidé)
16. [Validation et Tests](#16-validation-et-tests)

---

# PARTIE I - ANALYSE DE L'EXISTANT

## 1. État Actuel du Schéma

### 1.1 Vérification Factuelle (SUPABASE_SCHEMA_REFERENCE.md)

| Table/Colonne                        | Existe ?            | Détails                                                    |
| ------------------------------------ | ------------------- | ---------------------------------------------------------- |
| `adm_providers`                      | ❌ **N'EXISTE PAS** | Table à créer                                              |
| `adm_provider_employees`             | ✅ Existe           | 16 colonnes, **SANS provider_id**                          |
| `adm_provider_employees.provider_id` | ❌ **N'EXISTE PAS** | Colonne à ajouter                                          |
| `adm_organizations`                  | ❌ **N'EXISTE PAS** | Table à créer                                              |
| `adm_organization_consents`          | ❌ **N'EXISTE PAS** | Table à créer                                              |
| `adm_tenants`                        | ✅ Existe           | **SANS** organization_id, hierarchy_type, parent_tenant_id |
| `adm_tenant_settings`                | ✅ Existe           | Pour stocker default_provider_id                           |
| `crm_orders.tenant_id`               | ✅ Existe           | **À RENOMMER** en provider_id                              |

### 1.2 Colonnes Actuelles de adm_provider_employees

```
adm_provider_employees (16 colonnes actuelles)
├── id UUID PK
├── clerk_user_id VARCHAR(255) NOT NULL
├── name VARCHAR(100) NOT NULL
├── email VARCHAR(255) NOT NULL
├── department VARCHAR(50) NULL
├── title VARCHAR(50) NULL
├── permissions JSONB NULL
├── status VARCHAR(50) DEFAULT 'active'
├── supervisor_id UUID FK (self-ref)
├── created_at, created_by
├── updated_at, updated_by
└── deleted_at, deleted_by, deletion_reason

⚠️ MANQUANT : provider_id (FK vers adm_providers)
```

### 1.3 Tables CRM Existantes (12 tables)

| Table               | tenant_id actuel     | provider_id à ajouter                             |
| ------------------- | -------------------- | ------------------------------------------------- |
| crm_leads           | ❌ Absent            | ✅ À ajouter                                      |
| crm_opportunities   | ❌ Absent            | ✅ À ajouter                                      |
| crm_quotes          | ❌ Absent            | ✅ À ajouter                                      |
| crm_quote_items     | ❌ Absent            | ✅ À ajouter                                      |
| crm_orders          | ⚠️ tenant_id présent | Renommer → provider_id + ajouter client_tenant_id |
| crm_agreements      | ❌ Absent            | ✅ À ajouter                                      |
| crm_addresses       | ❌ Absent            | ✅ À ajouter                                      |
| crm_lead_activities | ❌ Absent            | ✅ À ajouter                                      |
| crm_pipelines       | ❌ Absent            | ✅ À ajouter                                      |
| crm_settings        | ❌ Absent            | HYBRIDE (is_system + provider_id)                 |
| crm_lead_sources    | ❌ Absent            | HYBRIDE (is_system + provider_id)                 |
| crm_countries       | ❌ Absent            | HYBRIDE (is_system + provider_id)                 |

---

## 2. Deux Problèmes Distincts

### 2.1 PROBLÈME 1 : Isolation CRM entre divisions FleetCore

**Contexte :** FleetCore opère avec plusieurs équipes commerciales.

**Besoin :**

- FleetCore France gère ses leads/opportunities
- FleetCore UAE gère ses leads/opportunities
- Partenaires externes (futur) gèrent leurs leads
- CEO/CRM Manager peuvent switcher entre divisions
- Analytics consolidés multi-divisions

**Solution :** `provider_id` sur toutes les tables CRM

### 2.2 PROBLÈME 2 : Hiérarchie Clients (Mère-Fille)

**Contexte :** Les clients FleetCore peuvent avoir plusieurs locations (réglementation impose 1 tenant par pays).

**Besoin :**

- Client Alpha Transport Group (mère)
  - Alpha France (fille)
  - Alpha UAE (fille)
- Mère voit toutes les filles
- Filles ne voient pas la mère ni les sœurs
- Reporting consolidé au niveau mère
- Facturation consolidée (+5€/mois add-on)

**Solution :** `adm_organizations` + `parent_tenant_id` sur `adm_tenants`

### 2.3 DISTINCTION CRITIQUE

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEUX CONCEPTS SÉPARÉS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CHANTIER A : PROVIDERS (INTERNE FLEETCORE)                        │
│  ═══════════════════════════════════════════                        │
│                                                                      │
│  Table: adm_providers                                               │
│  Usage: Divisions commerciales FleetCore                            │
│  Scope: Module CRM uniquement                                       │
│  Discriminant: provider_id sur tables CRM                           │
│                                                                      │
│  FleetCore Admin                                                     │
│  ├── FleetCore France (provider)                                    │
│  ├── FleetCore UAE (provider)                                       │
│  └── Partner X (provider externe)                                   │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  CHANTIER B : ORGANISATIONS (CLIENTS EXTERNES)                      │
│  ══════════════════════════════════════════════                      │
│                                                                      │
│  Table: adm_organizations                                           │
│  Usage: Groupes de clients (parent-child)                           │
│  Scope: Tout le système (FLT, RID, BIL, etc.)                      │
│  Discriminant: organization_id + parent_tenant_id sur adm_tenants   │
│                                                                      │
│  Alpha Transport Group (organization)                               │
│  ├── Alpha France (tenant child)                                    │
│  ├── Alpha UAE (tenant child)                                       │
│  └── Alpha Saudi (tenant child)                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

⚠️ NE PAS MÉLANGER : Providers ≠ Organisations
```

---

# PARTIE II - CHANTIER A : CRM PROVIDER_ID

## 3. Architecture Provider (Divisions FleetCore)

### 3.1 Schéma Conceptuel

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE CRM PROVIDER_ID                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐                                            │
│  │    adm_providers    │ ◄── NOUVELLE TABLE                         │
│  │─────────────────────│                                            │
│  │ id UUID PK          │                                            │
│  │ code VARCHAR(50) UQ │  'FLEETCORE_ADMIN', 'FLEETCORE_FR'         │
│  │ name VARCHAR(200)   │  'FleetCore Admin', 'FleetCore France'     │
│  │ country_code CHAR(2)│  NULL, 'FR', 'AE'                          │
│  │ is_internal BOOLEAN │  true=division, false=partenaire           │
│  │ status VARCHAR(50)  │                                            │
│  └──────────┬──────────┘                                            │
│             │                                                        │
│             │ 1:N                                                    │
│             ▼                                                        │
│  ┌─────────────────────────────┐                                    │
│  │  adm_provider_employees     │ ◄── MODIFIER (add provider_id)     │
│  │─────────────────────────────│                                    │
│  │ id UUID PK                  │                                    │
│  │ provider_id UUID FK ◄────── │ NOUVEAU - NULL = accès global      │
│  │ clerk_user_id               │                                    │
│  │ name, email, department     │                                    │
│  │ ...                         │                                    │
│  └──────────┬──────────────────┘                                    │
│             │                                                        │
│             │ assigned_to / created_by                              │
│             ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │              TABLES CRM (12 tables) - ADD provider_id           ││
│  │─────────────────────────────────────────────────────────────────││
│  │ crm_leads           │ provider_id UUID NOT NULL FK              ││
│  │ crm_opportunities   │ provider_id UUID NOT NULL FK              ││
│  │ crm_quotes          │ provider_id UUID NOT NULL FK              ││
│  │ crm_quote_items     │ provider_id UUID NOT NULL FK              ││
│  │ crm_orders          │ provider_id UUID NOT NULL FK              ││
│  │                     │ client_tenant_id UUID NULL FK ◄── NOUVEAU ││
│  │ crm_agreements      │ provider_id UUID NOT NULL FK              ││
│  │ crm_addresses       │ provider_id UUID NOT NULL FK              ││
│  │ crm_lead_activities │ provider_id UUID NOT NULL FK              ││
│  │ crm_pipelines       │ provider_id UUID NOT NULL FK              ││
│  │ crm_settings        │ HYBRIDE (is_system + provider_id NULL)    ││
│  │ crm_lead_sources    │ HYBRIDE (is_system + provider_id NULL)    ││
│  │ crm_countries       │ HYBRIDE (is_system + provider_id NULL)    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────┐                                            │
│  │    adm_tenants      │ ◄── client_tenant_id référence ici        │
│  │─────────────────────│                                            │
│  │ id UUID PK          │                                            │
│  │ ...                 │                                            │
│  └─────────────────────┘                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Flow Order → Fulfillment → Tenant

```
ÉTAPE 1 : Order créé (Win Opportunity)
┌─────────────────────────────────────┐
│ crm_orders                          │
│─────────────────────────────────────│
│ provider_id = FLEETCORE_FR ✅       │  Division FleetCore qui gère
│ client_tenant_id = NULL ❌          │  Client pas encore créé
│ status = 'signed'                   │
└─────────────────────────────────────┘
              │
              ▼ Fulfillment Service

ÉTAPE 2 : Tenant Créé
┌─────────────────────────────────────┐
│ adm_tenants                         │
│─────────────────────────────────────│
│ id = 'tenant-xyz-123' ◄────────────┐│
│ name = 'Alpha Transport'           ││
│ status = 'active'                  ││
└────────────────────────────────────┘│
              │                       │
              ▼                       │
                                      │
ÉTAPE 3 : Order mis à jour            │
┌─────────────────────────────────────┐
│ crm_orders                          │
│─────────────────────────────────────│
│ provider_id = FLEETCORE_FR ✅       │  Traçabilité équipe
│ client_tenant_id = 'tenant-xyz' ✅ ─┘  Lien vers client
│ fulfillment_status = 'fulfilled'    │
│ fulfilled_at = NOW()                │
└─────────────────────────────────────┘
```

---

## 4. Tables à Créer - Chantier A

### 4.1 Table adm_providers

```sql
-- ============================================================================
-- TABLE: adm_providers
-- Description: Divisions commerciales FleetCore (interne et partenaires)
-- Usage: Discriminant pour isolation CRM
-- ============================================================================

CREATE TABLE adm_providers (
    -- ==========================================
    -- IDENTIFIANTS
    -- ==========================================
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ==========================================
    -- IDENTIFICATION
    -- ==========================================
    code VARCHAR(50) NOT NULL,           -- 'FLEETCORE_ADMIN', 'FLEETCORE_FR'
    name VARCHAR(200) NOT NULL,          -- 'FleetCore Admin', 'FleetCore France'

    -- ==========================================
    -- CLASSIFICATION
    -- ==========================================
    country_code CHAR(2),                -- NULL pour Admin, 'FR', 'AE'
    is_internal BOOLEAN NOT NULL DEFAULT true,  -- true=division, false=partenaire

    -- ==========================================
    -- CONFIGURATION
    -- ==========================================
    settings JSONB NOT NULL DEFAULT '{}',
    -- Ex: { "default_currency": "EUR", "timezone": "Europe/Paris" }

    metadata JSONB NOT NULL DEFAULT '{}',

    -- ==========================================
    -- STATUT
    -- ==========================================
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- Values: 'active', 'suspended', 'inactive'

    -- ==========================================
    -- AUDIT
    -- ==========================================
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT,

    -- ==========================================
    -- CONTRAINTES
    -- ==========================================
    CONSTRAINT adm_providers_code_unique UNIQUE (code),
    CONSTRAINT adm_providers_status_check CHECK (status IN ('active', 'suspended', 'inactive'))
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_adm_providers_code ON adm_providers(code);
CREATE INDEX idx_adm_providers_status ON adm_providers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_adm_providers_country ON adm_providers(country_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_adm_providers_internal ON adm_providers(is_internal) WHERE deleted_at IS NULL;

-- ==========================================
-- COMMENTAIRES
-- ==========================================
COMMENT ON TABLE adm_providers IS 'Divisions commerciales FleetCore et partenaires externes';
COMMENT ON COLUMN adm_providers.code IS 'Code unique: FLEETCORE_ADMIN, FLEETCORE_FR, FLEETCORE_AE';
COMMENT ON COLUMN adm_providers.is_internal IS 'true = division FleetCore interne, false = partenaire externe';
```

---

## 5. Tables à Modifier - Chantier A

### 5.1 adm_provider_employees (ADD provider_id)

```sql
-- Ajouter colonne provider_id
ALTER TABLE adm_provider_employees
ADD COLUMN provider_id UUID REFERENCES adm_providers(id);

-- NULL = accès à toutes les divisions (CEO, CRM Manager)
-- UUID = accès uniquement à cette division

-- Index
CREATE INDEX idx_adm_provider_employees_provider
ON adm_provider_employees(provider_id) WHERE deleted_at IS NULL;

-- Commentaire
COMMENT ON COLUMN adm_provider_employees.provider_id IS
'Division FleetCore assignée. NULL = accès global (CEO, CRM Manager)';
```

### 5.2 crm_orders (RENAME tenant_id + ADD client_tenant_id)

```sql
-- 1. Renommer tenant_id en provider_id
ALTER TABLE crm_orders RENAME COLUMN tenant_id TO provider_id;

-- 2. Supprimer l'ancienne FK
ALTER TABLE crm_orders DROP CONSTRAINT IF EXISTS fk_crm_orders_tenant;

-- 3. Créer la nouvelle FK vers adm_providers
ALTER TABLE crm_orders
ADD CONSTRAINT fk_crm_orders_provider
FOREIGN KEY (provider_id) REFERENCES adm_providers(id);

-- 4. Ajouter client_tenant_id (le vrai tenant client)
ALTER TABLE crm_orders
ADD COLUMN client_tenant_id UUID;

ALTER TABLE crm_orders
ADD CONSTRAINT fk_crm_orders_client_tenant
FOREIGN KEY (client_tenant_id) REFERENCES adm_tenants(id);

-- 5. Index
CREATE INDEX idx_crm_orders_provider_id ON crm_orders(provider_id);
CREATE INDEX idx_crm_orders_client_tenant_id ON crm_orders(client_tenant_id)
WHERE client_tenant_id IS NOT NULL;

-- 6. Commentaires
COMMENT ON COLUMN crm_orders.provider_id IS
'Division FleetCore qui gère ce deal (France, UAE, etc.)';
COMMENT ON COLUMN crm_orders.client_tenant_id IS
'Tenant client créé après Fulfillment - NULL avant fulfillment';
```

### 5.3 Tables CRM Core (8 tables) - ADD provider_id

```sql
-- Pattern répété pour chaque table :
-- crm_leads, crm_opportunities, crm_quotes, crm_quote_items,
-- crm_agreements, crm_addresses, crm_lead_activities, crm_pipelines

-- Exemple pour crm_leads :
ALTER TABLE crm_leads
ADD COLUMN provider_id UUID;

-- Backfill avec provider par défaut (sera créé dans seed)
-- UPDATE crm_leads SET provider_id = (SELECT id FROM adm_providers WHERE code = 'FLEETCORE_ADMIN');

-- Rendre NOT NULL après backfill
-- ALTER TABLE crm_leads ALTER COLUMN provider_id SET NOT NULL;

ALTER TABLE crm_leads
ADD CONSTRAINT fk_crm_leads_provider
FOREIGN KEY (provider_id) REFERENCES adm_providers(id);

CREATE INDEX idx_crm_leads_provider_id ON crm_leads(provider_id);
```

### 5.4 Tables CRM Hybrides (3 tables) - ADD is_system + provider_id

```sql
-- Pattern hybride pour : crm_settings, crm_lead_sources, crm_countries

-- Exemple pour crm_settings :
ALTER TABLE crm_settings
ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE crm_settings
ADD COLUMN provider_id UUID REFERENCES adm_providers(id);

-- Contrainte : soit système (provider_id NULL), soit custom (provider_id NOT NULL)
ALTER TABLE crm_settings
ADD CONSTRAINT crm_settings_system_or_provider
CHECK (
  (is_system = true AND provider_id IS NULL) OR
  (is_system = false AND provider_id IS NOT NULL)
);

-- Marquer les données existantes comme système
UPDATE crm_settings SET is_system = true WHERE provider_id IS NULL;

CREATE INDEX idx_crm_settings_provider_id ON crm_settings(provider_id)
WHERE provider_id IS NOT NULL;

COMMENT ON COLUMN crm_settings.is_system IS
'true = donnée système visible par tous, false = donnée custom division';
```

---

## 6. Migrations SQL - Chantier A

### 6.1 Migration A.1 : Créer adm_providers

```sql
-- ============================================================================
-- MIGRATION A.1: Création table adm_providers
-- Exécuter dans Supabase SQL Editor
-- ============================================================================

BEGIN;

-- Créer la table (voir section 4.1 pour le DDL complet)
CREATE TABLE IF NOT EXISTS adm_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    country_code CHAR(2),
    is_internal BOOLEAN NOT NULL DEFAULT true,
    settings JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT,
    CONSTRAINT adm_providers_code_unique UNIQUE (code),
    CONSTRAINT adm_providers_status_check CHECK (status IN ('active', 'suspended', 'inactive'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_adm_providers_code ON adm_providers(code);
CREATE INDEX IF NOT EXISTS idx_adm_providers_status ON adm_providers(status) WHERE deleted_at IS NULL;

COMMIT;
```

### 6.2 Migration A.2 : Seed adm_providers

```sql
-- ============================================================================
-- MIGRATION A.2: Seed des divisions FleetCore
-- ============================================================================

BEGIN;

-- FleetCore Admin (HQ virtuel)
INSERT INTO adm_providers (id, code, name, country_code, is_internal, settings, status)
VALUES (
    '7ad8173c-68c5-41d3-9918-686e4e941cc0',  -- UUID fixe pour référence
    'FLEETCORE_ADMIN',
    'FleetCore Admin',
    NULL,  -- Pas de pays spécifique
    true,
    '{"default_currency": "EUR", "is_headquarters": true}'::jsonb,
    'active'
);

-- FleetCore France
INSERT INTO adm_providers (id, code, name, country_code, is_internal, settings, status)
VALUES (
    uuid_generate_v4(),
    'FLEETCORE_FR',
    'FleetCore France',
    'FR',
    true,
    '{"default_currency": "EUR", "timezone": "Europe/Paris"}'::jsonb,
    'active'
);

-- FleetCore UAE
INSERT INTO adm_providers (id, code, name, country_code, is_internal, settings, status)
VALUES (
    uuid_generate_v4(),
    'FLEETCORE_AE',
    'FleetCore UAE',
    'AE',
    true,
    '{"default_currency": "AED", "timezone": "Asia/Dubai"}'::jsonb,
    'active'
);

COMMIT;
```

### 6.3 Migration A.3 : Modifier adm_provider_employees

```sql
-- ============================================================================
-- MIGRATION A.3: Ajouter provider_id sur adm_provider_employees
-- ============================================================================

BEGIN;

-- Ajouter la colonne
ALTER TABLE adm_provider_employees
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES adm_providers(id);

-- Index
CREATE INDEX IF NOT EXISTS idx_adm_provider_employees_provider
ON adm_provider_employees(provider_id) WHERE deleted_at IS NULL;

-- Commentaire
COMMENT ON COLUMN adm_provider_employees.provider_id IS
'Division FleetCore. NULL = accès global (CEO, CRM Manager)';

COMMIT;
```

### 6.4 Migration A.4 : Corriger crm_orders

```sql
-- ============================================================================
-- MIGRATION A.4: Corriger crm_orders (tenant_id → provider_id + client_tenant_id)
-- PRIORITÉ HAUTE - Débloque OrderService
-- ============================================================================

BEGIN;

-- 1. Vérifier si tenant_id existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_orders' AND column_name = 'tenant_id'
  ) THEN
    -- Renommer tenant_id en provider_id
    ALTER TABLE crm_orders RENAME COLUMN tenant_id TO provider_id;
    RAISE NOTICE 'Renamed tenant_id to provider_id';
  END IF;
END $$;

-- 2. Supprimer l'ancienne FK si existe
ALTER TABLE crm_orders DROP CONSTRAINT IF EXISTS fk_crm_orders_tenant;
ALTER TABLE crm_orders DROP CONSTRAINT IF EXISTS crm_orders_tenant_id_fkey;

-- 3. Backfill provider_id avec FleetCore Admin si vide
UPDATE crm_orders
SET provider_id = '7ad8173c-68c5-41d3-9918-686e4e941cc0'
WHERE provider_id IS NULL;

-- 4. Créer FK vers adm_providers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_crm_orders_provider'
  ) THEN
    ALTER TABLE crm_orders
    ADD CONSTRAINT fk_crm_orders_provider
    FOREIGN KEY (provider_id) REFERENCES adm_providers(id);
  END IF;
END $$;

-- 5. Ajouter client_tenant_id
ALTER TABLE crm_orders
ADD COLUMN IF NOT EXISTS client_tenant_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_crm_orders_client_tenant'
  ) THEN
    ALTER TABLE crm_orders
    ADD CONSTRAINT fk_crm_orders_client_tenant
    FOREIGN KEY (client_tenant_id) REFERENCES adm_tenants(id);
  END IF;
END $$;

-- 6. Index
CREATE INDEX IF NOT EXISTS idx_crm_orders_provider_id ON crm_orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_crm_orders_client_tenant_id ON crm_orders(client_tenant_id)
WHERE client_tenant_id IS NOT NULL;

-- 7. Commentaires
COMMENT ON COLUMN crm_orders.provider_id IS
'Division FleetCore qui gère ce deal';
COMMENT ON COLUMN crm_orders.client_tenant_id IS
'Tenant client créé après Fulfillment';

COMMIT;
```

### 6.5 Migration A.5 : Ajouter provider_id sur tables CRM Core

```sql
-- ============================================================================
-- MIGRATION A.5: Ajouter provider_id sur 8 tables CRM core
-- ============================================================================

BEGIN;

-- Liste des tables
DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'crm_leads',
        'crm_opportunities',
        'crm_quotes',
        'crm_quote_items',
        'crm_agreements',
        'crm_addresses',
        'crm_lead_activities',
        'crm_pipelines'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Ajouter colonne si n'existe pas
        EXECUTE format('
            ALTER TABLE %I ADD COLUMN IF NOT EXISTS provider_id UUID
        ', t);

        -- Backfill avec FleetCore Admin
        EXECUTE format('
            UPDATE %I SET provider_id = %L WHERE provider_id IS NULL
        ', t, '7ad8173c-68c5-41d3-9918-686e4e941cc0');

        -- Créer FK si n'existe pas
        EXECUTE format('
            DO $inner$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = %L
                ) THEN
                    ALTER TABLE %I
                    ADD CONSTRAINT %I
                    FOREIGN KEY (provider_id) REFERENCES adm_providers(id);
                END IF;
            END $inner$
        ', 'fk_' || t || '_provider', t, 'fk_' || t || '_provider');

        -- Créer index
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%s_provider_id ON %I(provider_id)
        ', t, t);

        RAISE NOTICE 'Added provider_id to %', t;
    END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- Après vérification, rendre NOT NULL
-- ============================================================================
-- ALTER TABLE crm_leads ALTER COLUMN provider_id SET NOT NULL;
-- ALTER TABLE crm_opportunities ALTER COLUMN provider_id SET NOT NULL;
-- etc.
```

### 6.6 Migration A.6 : Tables CRM Hybrides

```sql
-- ============================================================================
-- MIGRATION A.6: Pattern hybride sur crm_settings, crm_lead_sources, crm_countries
-- ============================================================================

BEGIN;

-- crm_settings
ALTER TABLE crm_settings
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

ALTER TABLE crm_settings
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES adm_providers(id);

UPDATE crm_settings SET is_system = true WHERE provider_id IS NULL AND is_system IS NULL;

ALTER TABLE crm_settings ALTER COLUMN is_system SET NOT NULL;
ALTER TABLE crm_settings ALTER COLUMN is_system SET DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_settings_system_or_provider'
  ) THEN
    ALTER TABLE crm_settings
    ADD CONSTRAINT crm_settings_system_or_provider
    CHECK (
      (is_system = true AND provider_id IS NULL) OR
      (is_system = false AND provider_id IS NOT NULL)
    );
  END IF;
END $$;

-- crm_lead_sources
ALTER TABLE crm_lead_sources
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

ALTER TABLE crm_lead_sources
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES adm_providers(id);

UPDATE crm_lead_sources SET is_system = true WHERE provider_id IS NULL AND is_system IS NULL;

ALTER TABLE crm_lead_sources ALTER COLUMN is_system SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_lead_sources_system_or_provider'
  ) THEN
    ALTER TABLE crm_lead_sources
    ADD CONSTRAINT crm_lead_sources_system_or_provider
    CHECK (
      (is_system = true AND provider_id IS NULL) OR
      (is_system = false AND provider_id IS NOT NULL)
    );
  END IF;
END $$;

-- crm_countries
ALTER TABLE crm_countries
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

ALTER TABLE crm_countries
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES adm_providers(id);

UPDATE crm_countries SET is_system = true WHERE provider_id IS NULL AND is_system IS NULL;

ALTER TABLE crm_countries ALTER COLUMN is_system SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_countries_system_or_provider'
  ) THEN
    ALTER TABLE crm_countries
    ADD CONSTRAINT crm_countries_system_or_provider
    CHECK (
      (is_system = true AND provider_id IS NULL) OR
      (is_system = false AND provider_id IS NOT NULL)
    );
  END IF;
END $$;

COMMIT;
```

---

## 7. Seed Data - Chantier A

### 7.1 Configuration dans adm_tenant_settings

```sql
-- ============================================================================
-- SEED: Configuration default_provider_id dans adm_tenant_settings
-- Note: Cette table est tenant-scoped, donc on utilise un tenant système
-- Alternative: Créer une table sys_settings globale
-- ============================================================================

-- Option 1: Si vous avez un tenant système
INSERT INTO adm_tenant_settings (tenant_id, setting_key, setting_value, category)
SELECT
    id,
    'default_provider_id',
    '"7ad8173c-68c5-41d3-9918-686e4e941cc0"'::jsonb,
    'crm'
FROM adm_tenants
WHERE name ILIKE '%fleetcore%' OR name ILIKE '%system%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Option 2: Créer une table sys_global_settings (recommandé)
-- Voir section 14 pour l'implémentation code
```

---

# PARTIE III - CHANTIER B : ORGANISATION LAYER CLIENTS

## 8. Architecture Organisation (Groupes Clients)

### 8.1 Schéma Conceptuel

```
┌─────────────────────────────────────────────────────────────────────┐
│                ARCHITECTURE ORGANISATION LAYER CLIENTS              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────┐                                       │
│  │    adm_organizations     │ ◄── NOUVELLE TABLE                    │
│  │──────────────────────────│                                       │
│  │ id UUID PK               │                                       │
│  │ code VARCHAR(50) UQ      │  'ALPHA_GROUP', 'BETA_FLEET'          │
│  │ name VARCHAR(200)        │  'Alpha Transport Group'              │
│  │ organization_type        │  'client' (vs 'provider' si besoin)   │
│  │ billing_email            │  Pour facturation groupe              │
│  │ settings JSONB           │  consolidated_reporting, etc.         │
│  │ status                   │                                       │
│  └───────────┬──────────────┘                                       │
│              │                                                       │
│              │ 1:N                                                   │
│              ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              adm_tenants (MODIFIÉ)                            │   │
│  │──────────────────────────────────────────────────────────────│   │
│  │ id UUID PK                                                    │   │
│  │ organization_id UUID FK ◄───────── NOUVEAU                   │   │
│  │ hierarchy_type ENUM ◄───────────── NOUVEAU (parent/child/    │   │
│  │                                              standalone)      │   │
│  │ parent_tenant_id UUID FK ◄──────── NOUVEAU (self-ref)        │   │
│  │ name, status, country_code                                    │   │
│  │ ...                                                           │   │
│  └───────────┬──────────────────────────────────────────────────┘   │
│              │                                                       │
│              │ child ──► parent                                     │
│              ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         adm_organization_consents (AUDIT TRAIL)              │   │
│  │──────────────────────────────────────────────────────────────│   │
│  │ child_tenant_id UUID FK                                       │   │
│  │ parent_tenant_id UUID FK                                      │   │
│  │ authorized_by_user_id                                         │   │
│  │ authorized_at TIMESTAMPTZ                                     │   │
│  │ cgv_version, privacy_policy_version                           │   │
│  │ permissions_granted JSONB                                     │   │
│  │ status ('active', 'revoked')                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Modèle Mère-Fille

```
ORGANISATION: Alpha Transport Group
│
├── MÈRE (parent): Alpha France HQ
│   │
│   │   ✅ Voit toutes les filles
│   │   ✅ Reporting consolidé
│   │   ✅ Reçoit la facturation
│   │   ✅ Peut accéder aux détails de chaque fille
│   │
│   ├── FILLE (child): Alpha UAE
│   │   │
│   │   │   ✅ Voit UNIQUEMENT ses propres données
│   │   │   ❌ Ne voit PAS la mère
│   │   │   ❌ Ne voit PAS les sœurs
│   │   │   ✅ Gère son scope en autonomie
│   │
│   └── FILLE (child): Alpha Saudi
│       │
│       │   ✅ Voit UNIQUEMENT ses propres données
│       │   ❌ Ne voit PAS la mère
│       │   ❌ Ne voit PAS Alpha UAE (sœur)
│
└── FACTURATION: +5€/mois add-on Multi-filiales
```

---

## 9. Tables à Créer - Chantier B

### 9.1 Table adm_organizations

```sql
-- ============================================================================
-- TABLE: adm_organizations
-- Description: Groupes de clients (holdings, groupes corporatifs)
-- Usage: Regroupement de tenants pour reporting consolidé et facturation
-- ============================================================================

-- ENUM pour type d'organisation
CREATE TYPE organization_type AS ENUM ('client', 'partner');

-- ENUM pour statut
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'churned');

CREATE TABLE adm_organizations (
    -- ==========================================
    -- IDENTIFIANTS
    -- ==========================================
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ==========================================
    -- IDENTIFICATION
    -- ==========================================
    code VARCHAR(50) NOT NULL,              -- 'ALPHA_GROUP', 'BETA_FLEET'
    name VARCHAR(255) NOT NULL,             -- 'Alpha Transport Group'
    legal_name VARCHAR(255),                -- Raison sociale légale
    slug VARCHAR(100),                      -- URL-friendly identifier

    -- ==========================================
    -- CLASSIFICATION
    -- ==========================================
    organization_type organization_type NOT NULL DEFAULT 'client',

    -- ==========================================
    -- LOCALISATION SIÈGE
    -- ==========================================
    headquarters_country CHAR(2),
    headquarters_address JSONB,
    -- Structure: { "street": "", "city": "", "postal_code": "", "country": "" }

    -- ==========================================
    -- CONTACT FACTURATION
    -- ==========================================
    billing_email VARCHAR(255),
    billing_address_id UUID,  -- FK vers crm_addresses si nécessaire

    -- ==========================================
    -- CONFIGURATION
    -- ==========================================
    settings JSONB NOT NULL DEFAULT '{}',
    -- Ex: { "consolidated_reporting": true, "default_currency": "EUR" }

    metadata JSONB NOT NULL DEFAULT '{}',

    -- ==========================================
    -- BRANDING
    -- ==========================================
    logo_url TEXT,
    primary_color VARCHAR(7),  -- #RRGGBB

    -- ==========================================
    -- STATUT
    -- ==========================================
    status organization_status NOT NULL DEFAULT 'active',

    -- ==========================================
    -- AUDIT
    -- ==========================================
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT,

    -- ==========================================
    -- CONTRAINTES
    -- ==========================================
    CONSTRAINT adm_organizations_code_unique UNIQUE (code)
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_adm_organizations_code ON adm_organizations(code);
CREATE INDEX idx_adm_organizations_status ON adm_organizations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_adm_organizations_type ON adm_organizations(organization_type);
CREATE UNIQUE INDEX idx_adm_organizations_slug_unique ON adm_organizations(slug) WHERE deleted_at IS NULL AND slug IS NOT NULL;

-- ==========================================
-- COMMENTAIRES
-- ==========================================
COMMENT ON TABLE adm_organizations IS 'Groupes de clients pour reporting consolidé et facturation groupe';
COMMENT ON COLUMN adm_organizations.code IS 'Code unique du groupe client';
```

### 9.2 Table adm_organization_consents

```sql
-- ============================================================================
-- TABLE: adm_organization_consents
-- Description: Audit trail des consentements de liaison mère-fille
-- Base légale: RGPD Recital 48 (Legitimate Interest intra-groupe)
-- ============================================================================

-- ENUM pour statut consentement
CREATE TYPE consent_status AS ENUM ('active', 'revoked', 'expired');

CREATE TABLE adm_organization_consents (
    -- ==========================================
    -- IDENTIFIANTS
    -- ==========================================
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ==========================================
    -- RELATIONS TENANT
    -- ==========================================
    child_tenant_id UUID NOT NULL REFERENCES adm_tenants(id),
    parent_tenant_id UUID NOT NULL REFERENCES adm_tenants(id),

    -- ==========================================
    -- AUTORISATION
    -- ==========================================
    authorized_by_user_id TEXT NOT NULL,      -- Clerk user ID
    authorized_by_member_id UUID,              -- FK vers adm_members si applicable
    authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ==========================================
    -- RÉVOCATION
    -- ==========================================
    revoked_at TIMESTAMPTZ,
    revoked_by_user_id TEXT,
    revoked_by_member_id UUID,
    revocation_reason TEXT,

    -- ==========================================
    -- CONTEXTE TECHNIQUE (AUDIT RGPD)
    -- ==========================================
    ip_address INET,
    user_agent TEXT,

    -- ==========================================
    -- VERSIONS DOCUMENTS LÉGAUX
    -- ==========================================
    cgv_version VARCHAR(20) NOT NULL,
    privacy_policy_version VARCHAR(20) NOT NULL,
    consent_screen_version VARCHAR(20) NOT NULL DEFAULT '1.0',

    -- ==========================================
    -- PERMISSIONS ACCORDÉES
    -- ==========================================
    permissions_granted JSONB NOT NULL DEFAULT '[]',
    -- Structure: ["view_vehicles", "view_drivers", "view_reports", "view_billing"]

    -- ==========================================
    -- CONTEXTE SPÉCIFIQUE CAS 2
    -- ==========================================
    was_existing_parent BOOLEAN DEFAULT FALSE,
    -- TRUE si le child était précédemment un parent

    acknowledged_implications BOOLEAN DEFAULT FALSE,
    -- TRUE si checkbox "Je comprends les implications" cochée

    -- ==========================================
    -- INVITATION
    -- ==========================================
    invitation_code VARCHAR(20),
    invitation_id UUID,

    -- ==========================================
    -- STATUT
    -- ==========================================
    status consent_status NOT NULL DEFAULT 'active',

    -- ==========================================
    -- AUDIT
    -- ==========================================
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ==========================================
    -- CONTRAINTES
    -- ==========================================
    CONSTRAINT chk_different_tenants CHECK (child_tenant_id != parent_tenant_id)
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_consents_child ON adm_organization_consents(child_tenant_id);
CREATE INDEX idx_consents_parent ON adm_organization_consents(parent_tenant_id);
CREATE INDEX idx_consents_status ON adm_organization_consents(status);
CREATE INDEX idx_consents_authorized_at ON adm_organization_consents(authorized_at);

-- Un seul consentement actif par paire child-parent
CREATE UNIQUE INDEX idx_consents_active_unique
ON adm_organization_consents(child_tenant_id, parent_tenant_id)
WHERE status = 'active';

-- ==========================================
-- COMMENTAIRES
-- ==========================================
COMMENT ON TABLE adm_organization_consents IS
'Audit trail des consentements liaison mère-fille (RGPD Recital 48)';
```

---

## 10. Tables à Modifier - Chantier B

### 10.1 adm_tenants (ADD organization_id, hierarchy_type, parent_tenant_id)

```sql
-- ============================================================================
-- MODIFICATION: adm_tenants - Ajout colonnes organisation
-- ============================================================================

-- ENUM pour hiérarchie
CREATE TYPE tenant_hierarchy_type AS ENUM ('parent', 'child', 'standalone');

-- Ajouter colonnes
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES adm_organizations(id) ON DELETE SET NULL;

ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS hierarchy_type tenant_hierarchy_type NOT NULL DEFAULT 'standalone';

ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES adm_tenants(id);

-- Contrainte : un parent ne peut pas avoir de parent
ALTER TABLE adm_tenants
ADD CONSTRAINT chk_parent_has_no_parent
CHECK (
    (hierarchy_type = 'parent' AND parent_tenant_id IS NULL) OR
    (hierarchy_type != 'parent')
);

-- Contrainte : un child doit avoir un parent
ALTER TABLE adm_tenants
ADD CONSTRAINT chk_child_has_parent
CHECK (
    (hierarchy_type = 'child' AND parent_tenant_id IS NOT NULL) OR
    (hierarchy_type != 'child')
);

-- Index
CREATE INDEX idx_adm_tenants_organization ON adm_tenants(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_adm_tenants_hierarchy ON adm_tenants(hierarchy_type);
CREATE INDEX idx_adm_tenants_parent ON adm_tenants(parent_tenant_id) WHERE parent_tenant_id IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN adm_tenants.organization_id IS 'Groupe client auquel appartient ce tenant';
COMMENT ON COLUMN adm_tenants.hierarchy_type IS 'Position dans la hiérarchie: parent, child, standalone';
COMMENT ON COLUMN adm_tenants.parent_tenant_id IS 'Tenant parent si hierarchy_type = child';
```

---

## 11. Migrations SQL - Chantier B

### 11.1 Migration B.1 : Créer adm_organizations

```sql
-- ============================================================================
-- MIGRATION B.1: Création table adm_organizations
-- ============================================================================

BEGIN;

-- ENUMs
CREATE TYPE IF NOT EXISTS organization_type AS ENUM ('client', 'partner');
CREATE TYPE IF NOT EXISTS organization_status AS ENUM ('active', 'suspended', 'churned');

-- Table (voir section 9.1 pour DDL complet)
CREATE TABLE IF NOT EXISTS adm_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    slug VARCHAR(100),
    organization_type organization_type NOT NULL DEFAULT 'client',
    headquarters_country CHAR(2),
    headquarters_address JSONB,
    billing_email VARCHAR(255),
    billing_address_id UUID,
    settings JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    logo_url TEXT,
    primary_color VARCHAR(7),
    status organization_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT,
    CONSTRAINT adm_organizations_code_unique UNIQUE (code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_adm_organizations_code ON adm_organizations(code);
CREATE INDEX IF NOT EXISTS idx_adm_organizations_status ON adm_organizations(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_adm_organizations_type ON adm_organizations(organization_type);

COMMIT;
```

### 11.2 Migration B.2 : Modifier adm_tenants

```sql
-- ============================================================================
-- MIGRATION B.2: Modifier adm_tenants pour hiérarchie
-- ============================================================================

BEGIN;

-- ENUM
DO $$ BEGIN
    CREATE TYPE tenant_hierarchy_type AS ENUM ('parent', 'child', 'standalone');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Colonnes
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES adm_organizations(id) ON DELETE SET NULL;

ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS hierarchy_type tenant_hierarchy_type NOT NULL DEFAULT 'standalone';

ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES adm_tenants(id);

-- Index
CREATE INDEX IF NOT EXISTS idx_adm_tenants_organization ON adm_tenants(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_adm_tenants_hierarchy ON adm_tenants(hierarchy_type);
CREATE INDEX IF NOT EXISTS idx_adm_tenants_parent ON adm_tenants(parent_tenant_id) WHERE parent_tenant_id IS NOT NULL;

-- Contraintes (ajout conditionnel)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_parent_has_no_parent') THEN
        ALTER TABLE adm_tenants
        ADD CONSTRAINT chk_parent_has_no_parent
        CHECK (
            (hierarchy_type = 'parent' AND parent_tenant_id IS NULL) OR
            (hierarchy_type != 'parent')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_child_has_parent') THEN
        ALTER TABLE adm_tenants
        ADD CONSTRAINT chk_child_has_parent
        CHECK (
            (hierarchy_type = 'child' AND parent_tenant_id IS NOT NULL) OR
            (hierarchy_type != 'child')
        );
    END IF;
END $$;

COMMIT;
```

### 11.3 Migration B.3 : Créer adm_organization_consents

```sql
-- ============================================================================
-- MIGRATION B.3: Création table adm_organization_consents
-- ============================================================================

BEGIN;

-- ENUM
DO $$ BEGIN
    CREATE TYPE consent_status AS ENUM ('active', 'revoked', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table (voir section 9.2 pour DDL complet)
CREATE TABLE IF NOT EXISTS adm_organization_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_tenant_id UUID NOT NULL REFERENCES adm_tenants(id),
    parent_tenant_id UUID NOT NULL REFERENCES adm_tenants(id),
    authorized_by_user_id TEXT NOT NULL,
    authorized_by_member_id UUID,
    authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by_user_id TEXT,
    revoked_by_member_id UUID,
    revocation_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    cgv_version VARCHAR(20) NOT NULL,
    privacy_policy_version VARCHAR(20) NOT NULL,
    consent_screen_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    permissions_granted JSONB NOT NULL DEFAULT '[]',
    was_existing_parent BOOLEAN DEFAULT FALSE,
    acknowledged_implications BOOLEAN DEFAULT FALSE,
    invitation_code VARCHAR(20),
    invitation_id UUID,
    status consent_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_different_tenants CHECK (child_tenant_id != parent_tenant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consents_child ON adm_organization_consents(child_tenant_id);
CREATE INDEX IF NOT EXISTS idx_consents_parent ON adm_organization_consents(parent_tenant_id);
CREATE INDEX IF NOT EXISTS idx_consents_status ON adm_organization_consents(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_consents_active_unique
ON adm_organization_consents(child_tenant_id, parent_tenant_id)
WHERE status = 'active';

COMMIT;
```

### 11.4 Migration B.4 : Migration données existantes

```sql
-- ============================================================================
-- MIGRATION B.4: Migration des tenants existants
-- ============================================================================

BEGIN;

-- Tenants avec parent_tenant_id → hierarchy_type = 'child'
UPDATE adm_tenants
SET hierarchy_type = 'child'
WHERE parent_tenant_id IS NOT NULL
AND hierarchy_type = 'standalone';

-- Tenants référencés comme parent → hierarchy_type = 'parent'
UPDATE adm_tenants
SET hierarchy_type = 'parent'
WHERE id IN (
    SELECT DISTINCT parent_tenant_id
    FROM adm_tenants
    WHERE parent_tenant_id IS NOT NULL
)
AND hierarchy_type = 'standalone';

COMMIT;
```

---

## 12. Workflow Wizard Mère-Fille

### 12.1 CAS 1 : Nouvelle filiale créée comme CHILD

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CAS 1 : NOUVEAU CLIENT DEVIENT CHILD             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PARENT (Alpha France)              CHILD (nouveau)                 │
│  ┌─────────────────────┐           ┌─────────────────────┐         │
│  │ Dashboard           │           │                     │         │
│  │                     │           │                     │         │
│  │ [Inviter filiale]   │──email──▶│ Crée son compte     │         │
│  │                     │           │ FleetCore           │         │
│  │ Code: ABC123        │           │                     │         │
│  └─────────────────────┘           │ Entre: ABC123       │         │
│                                    └──────────┬──────────┘         │
│                                               │                     │
│                                               ▼                     │
│                              ┌─────────────────────────────────┐   │
│                              │ "Alpha France veut vous         │   │
│                              │  ajouter comme filiale"         │   │
│                              │                                 │   │
│                              │  Ils pourront voir:             │   │
│                              │  • Vos véhicules               │   │
│                              │  • Vos conducteurs             │   │
│                              │  • Vos rapports                │   │
│                              │                                 │   │
│                              │  [Accepter]  [Refuser]          │   │
│                              └─────────────────────────────────┘   │
│                                               │                     │
│                                               ▼                     │
│                                         ✅ TERMINÉ                  │
│                                                                      │
│  STOCKAGE: adm_organization_consents                                │
│  - timestamp, IP, user_agent                                        │
│  - cgv_version, permissions_granted                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.2 CAS 2 : Client existant (PARENT) devient CHILD

```
┌─────────────────────────────────────────────────────────────────────┐
│               CAS 2 : CLIENT EXISTANT DEVIENT CHILD                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ÉCRAN 1 : AVERTISSEMENT                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Changement de statut                                     │   │
│  │─────────────────────────────────────────────────────────────│   │
│  │                                                              │   │
│  │  Vous allez devenir une filiale de "Alpha Group".           │   │
│  │                                                              │   │
│  │  Impacts :                                                   │   │
│  │  • Vos données EXISTANTES seront visibles par le groupe    │   │
│  │  • Vous ne pourrez plus ajouter vos propres filiales       │   │
│  │  • Facturation consolidée (+5€/mois)                        │   │
│  │                                                              │   │
│  │  ☐ Je comprends ces implications                            │   │
│  │                                                              │   │
│  │  [Continuer]  [Annuler]                                     │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ÉCRAN 2 : CONSENT (identique CAS 1)                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ "Alpha Group veut vous ajouter comme filiale"               │   │
│  │                                                              │   │
│  │  [Accepter]  [Refuser]                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ÉCRAN 3 : VALIDATION PARENT (code)                                │
│                              │                                      │
│                              ▼                                      │
│                         ✅ TERMINÉ                                  │
│                                                                      │
│  STOCKAGE: adm_organization_consents                                │
│  - was_existing_parent = TRUE                                       │
│  - acknowledged_implications = TRUE                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.3 Actions Support (PAYANTES)

| Action              | Qui peut faire        | Coût             |
| ------------------- | --------------------- | ---------------- |
| Ajouter une fille   | Client (self-service) | +5€/mois         |
| Retirer une fille   | Support uniquement    | ~150-300€ (1-2h) |
| Changer de mère     | Support uniquement    | ~150-300€        |
| Dissoudre un groupe | Support uniquement    | ~200-400€        |

---

# PARTIE IV - IMPLÉMENTATION

## 13. RLS Policies

### 13.1 RLS Provider Isolation (Chantier A)

```sql
-- ============================================================================
-- RLS: Isolation par provider_id pour tables CRM
-- Pattern: current_setting('app.current_provider_id')
-- ============================================================================

-- crm_leads
DROP POLICY IF EXISTS provider_isolation_crm_leads ON crm_leads;
CREATE POLICY provider_isolation_crm_leads ON crm_leads
FOR ALL TO authenticated
USING (
    -- Soit le provider_id correspond
    provider_id::text = (SELECT current_setting('app.current_provider_id', true))
    OR
    -- Soit accès global (CEO, CRM Manager)
    (SELECT current_setting('app.current_provider_id', true)) IS NULL
    OR
    (SELECT current_setting('app.current_provider_id', true)) = ''
);

-- Répéter pour : crm_opportunities, crm_quotes, crm_quote_items,
-- crm_orders, crm_agreements, crm_addresses, crm_lead_activities, crm_pipelines

-- Tables hybrides (crm_settings, crm_lead_sources, crm_countries)
DROP POLICY IF EXISTS provider_isolation_crm_settings ON crm_settings;
CREATE POLICY provider_isolation_crm_settings ON crm_settings
FOR ALL TO authenticated
USING (
    -- Données système visibles par tous
    is_system = true
    OR
    -- Données custom visibles par le provider
    provider_id::text = (SELECT current_setting('app.current_provider_id', true))
    OR
    -- Accès global
    (SELECT current_setting('app.current_provider_id', true)) IS NULL
);
```

### 13.2 RLS Hiérarchie Organisation (Chantier B)

```sql
-- ============================================================================
-- RLS: Accès hiérarchique parent → children
-- Le parent peut voir les données de ses children (avec consentement actif)
-- ============================================================================

-- Exemple sur flt_vehicles
DROP POLICY IF EXISTS organization_hierarchy_flt_vehicles ON flt_vehicles;
CREATE POLICY organization_hierarchy_flt_vehicles ON flt_vehicles
FOR SELECT
USING (
    -- Accès direct (même tenant)
    tenant_id::text = (SELECT current_setting('app.current_tenant_id', true))

    OR

    -- Accès hiérarchique (parent voit children avec consentement)
    (
        -- Le tenant courant est un parent
        EXISTS (
            SELECT 1 FROM adm_tenants
            WHERE id::text = (SELECT current_setting('app.current_tenant_id', true))
            AND hierarchy_type = 'parent'
        )
        AND
        -- Le tenant de la ressource est un child du parent courant
        tenant_id IN (
            SELECT c.child_tenant_id
            FROM adm_organization_consents c
            INNER JOIN adm_tenants parent ON parent.id = c.parent_tenant_id
            WHERE parent.id::text = (SELECT current_setting('app.current_tenant_id', true))
            AND c.status = 'active'
        )
    )
);

-- Politique pour les opérations d'écriture (plus restrictive)
DROP POLICY IF EXISTS organization_write_flt_vehicles ON flt_vehicles;
CREATE POLICY organization_write_flt_vehicles ON flt_vehicles
FOR INSERT
WITH CHECK (
    -- Seul le tenant propriétaire peut insérer
    tenant_id::text = (SELECT current_setting('app.current_tenant_id', true))
);
```

---

## 14. Modifications Code

### 14.1 schema.prisma (Chantier A + B)

```prisma
// ============================================
// NOUVELLE TABLE: adm_providers
// ============================================
model adm_providers {
  id             String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  code           String    @unique @db.VarChar(50)
  name           String    @db.VarChar(200)
  country_code   String?   @db.Char(2)
  is_internal    Boolean   @default(true)
  settings       Json      @default("{}")
  metadata       Json      @default("{}")
  status         String    @default("active") @db.VarChar(50)
  created_at     DateTime  @default(now()) @db.Timestamptz(6)
  created_by     String?   @db.Uuid
  updated_at     DateTime  @default(now()) @db.Timestamptz(6)
  updated_by     String?   @db.Uuid
  deleted_at     DateTime? @db.Timestamptz(6)
  deleted_by     String?   @db.Uuid
  deletion_reason String?

  // Relations
  employees      adm_provider_employees[]
  leads          crm_leads[]
  opportunities  crm_opportunities[]
  quotes         crm_quotes[]
  quote_items    crm_quote_items[]
  orders         crm_orders[]
  agreements     crm_agreements[]
  addresses      crm_addresses[]
  activities     crm_lead_activities[]
  pipelines      crm_pipelines[]
  settings_crm   crm_settings[]
  lead_sources   crm_lead_sources[]
  countries      crm_countries[]

  @@index([code])
  @@index([status])
}

// ============================================
// MODIFIÉ: adm_provider_employees (add provider_id)
// ============================================
model adm_provider_employees {
  // ... colonnes existantes ...

  provider_id    String?   @db.Uuid
  provider       adm_providers? @relation(fields: [provider_id], references: [id])

  @@index([provider_id])
}

// ============================================
// NOUVELLE TABLE: adm_organizations
// ============================================
model adm_organizations {
  id                    String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  code                  String    @unique @db.VarChar(50)
  name                  String    @db.VarChar(255)
  legal_name            String?   @db.VarChar(255)
  slug                  String?   @db.VarChar(100)
  organization_type     String    @default("client") @db.VarChar(50)
  headquarters_country  String?   @db.Char(2)
  headquarters_address  Json?
  billing_email         String?   @db.VarChar(255)
  settings              Json      @default("{}")
  metadata              Json      @default("{}")
  logo_url              String?
  primary_color         String?   @db.VarChar(7)
  status                String    @default("active") @db.VarChar(50)
  created_at            DateTime  @default(now()) @db.Timestamptz(6)
  created_by            String?   @db.Uuid
  updated_at            DateTime  @default(now()) @db.Timestamptz(6)
  updated_by            String?   @db.Uuid
  deleted_at            DateTime? @db.Timestamptz(6)
  deleted_by            String?   @db.Uuid
  deletion_reason       String?

  // Relations
  tenants               adm_tenants[]

  @@index([code])
  @@index([status])
}

// ============================================
// MODIFIÉ: adm_tenants (add organization hierarchy)
// ============================================
model adm_tenants {
  // ... colonnes existantes ...

  organization_id   String?       @db.Uuid
  organization      adm_organizations? @relation(fields: [organization_id], references: [id])

  hierarchy_type    String        @default("standalone") @db.VarChar(20)
  // Values: 'parent', 'child', 'standalone'

  parent_tenant_id  String?       @db.Uuid
  parent_tenant     adm_tenants?  @relation("TenantHierarchy", fields: [parent_tenant_id], references: [id])
  child_tenants     adm_tenants[] @relation("TenantHierarchy")

  // Consents
  consents_as_child  adm_organization_consents[] @relation("ConsentChild")
  consents_as_parent adm_organization_consents[] @relation("ConsentParent")

  // Orders clients
  client_orders     crm_orders[]  @relation("ClientTenant")

  @@index([organization_id])
  @@index([hierarchy_type])
  @@index([parent_tenant_id])
}

// ============================================
// NOUVELLE TABLE: adm_organization_consents
// ============================================
model adm_organization_consents {
  id                        String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  child_tenant_id           String    @db.Uuid
  child_tenant              adm_tenants @relation("ConsentChild", fields: [child_tenant_id], references: [id])
  parent_tenant_id          String    @db.Uuid
  parent_tenant             adm_tenants @relation("ConsentParent", fields: [parent_tenant_id], references: [id])
  authorized_by_user_id     String
  authorized_by_member_id   String?   @db.Uuid
  authorized_at             DateTime  @default(now()) @db.Timestamptz(6)
  revoked_at                DateTime? @db.Timestamptz(6)
  revoked_by_user_id        String?
  revoked_by_member_id      String?   @db.Uuid
  revocation_reason         String?
  ip_address                String?
  user_agent                String?
  cgv_version               String    @db.VarChar(20)
  privacy_policy_version    String    @db.VarChar(20)
  consent_screen_version    String    @default("1.0") @db.VarChar(20)
  permissions_granted       Json      @default("[]")
  was_existing_parent       Boolean   @default(false)
  acknowledged_implications Boolean   @default(false)
  invitation_code           String?   @db.VarChar(20)
  invitation_id             String?   @db.Uuid
  status                    String    @default("active") @db.VarChar(20)
  created_at                DateTime  @default(now()) @db.Timestamptz(6)
  updated_at                DateTime  @default(now()) @db.Timestamptz(6)

  @@index([child_tenant_id])
  @@index([parent_tenant_id])
  @@index([status])
}

// ============================================
// MODIFIÉ: crm_orders
// ============================================
model crm_orders {
  // ... colonnes existantes ...

  // Provider (division FleetCore)
  provider_id       String    @db.Uuid
  provider          adm_providers @relation(fields: [provider_id], references: [id])

  // Client tenant (après fulfillment)
  client_tenant_id  String?   @db.Uuid
  client_tenant     adm_tenants? @relation("ClientTenant", fields: [client_tenant_id], references: [id])

  @@index([provider_id])
  @@index([client_tenant_id])
}
```

### 14.2 Helper provider-context.ts

```typescript
// lib/utils/provider-context.ts

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PROVIDER_ID = "7ad8173c-68c5-41d3-9918-686e4e941cc0";

/**
 * Récupère le provider_id de l'utilisateur courant
 */
export async function getCurrentProviderId(): Promise<string | null> {
  const { userId } = auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const employee = await prisma.adm_provider_employees.findFirst({
    where: {
      clerk_user_id: userId,
      status: "active",
      deleted_at: null,
    },
    select: {
      provider_id: true,
    },
  });

  // NULL = accès global (CEO, CRM Manager)
  return employee?.provider_id ?? null;
}

/**
 * Récupère le provider_id par défaut
 */
export async function getDefaultProviderId(): Promise<string> {
  // Chercher dans adm_tenant_settings si configuré
  // Sinon retourner la constante
  return DEFAULT_PROVIDER_ID;
}

/**
 * Vérifie si l'utilisateur a accès à un provider spécifique
 */
export async function hasProviderAccess(
  userProviderId: string | null,
  targetProviderId: string
): Promise<boolean> {
  // Accès global = accès à tout
  if (userProviderId === null) {
    return true;
  }
  // Accès spécifique = doit correspondre
  return userProviderId === targetProviderId;
}
```

### 14.3 Helper organization-context.ts

```typescript
// lib/utils/organization-context.ts

import { prisma } from "@/lib/prisma";

/**
 * Récupère les tenants accessibles pour un tenant parent
 */
export async function getAccessibleTenants(
  currentTenantId: string
): Promise<string[]> {
  const tenant = await prisma.adm_tenants.findUnique({
    where: { id: currentTenantId },
    select: {
      id: true,
      hierarchy_type: true,
    },
  });

  if (!tenant) {
    return [currentTenantId];
  }

  // Standalone ou Child = uniquement son propre tenant
  if (tenant.hierarchy_type !== "parent") {
    return [currentTenantId];
  }

  // Parent = lui-même + tous ses children avec consentement actif
  const children = await prisma.adm_organization_consents.findMany({
    where: {
      parent_tenant_id: currentTenantId,
      status: "active",
    },
    select: {
      child_tenant_id: true,
    },
  });

  return [currentTenantId, ...children.map((c) => c.child_tenant_id)];
}

/**
 * Vérifie si le tenant courant peut voir un autre tenant
 */
export async function canAccessTenant(
  currentTenantId: string,
  targetTenantId: string
): Promise<boolean> {
  if (currentTenantId === targetTenantId) {
    return true;
  }

  const accessibleTenants = await getAccessibleTenants(currentTenantId);
  return accessibleTenants.includes(targetTenantId);
}
```

---

## 15. Plan d'Exécution Consolidé

### 15.1 Estimation Temporelle Complète

| Chantier | Étape | Temps    | Description                              |
| -------- | ----- | -------- | ---------------------------------------- |
| **A**    | A.1   | 30min    | Créer table adm_providers                |
| **A**    | A.2   | 15min    | Seed divisions FleetCore                 |
| **A**    | A.3   | 15min    | Modifier adm_provider_employees          |
| **A**    | A.4   | 30min    | Corriger crm_orders (rename + add)       |
| **A**    | A.5   | 1h       | ADD provider_id sur 8 tables CRM core    |
| **A**    | A.6   | 45min    | Pattern hybride sur 3 tables             |
| **A**    | A.7   | 30min    | RLS provider isolation                   |
| **A**    | A.8   | 30min    | Sync Prisma schema                       |
| **A**    | A.9   | 1h       | Modifier repositories (Order, Lead, Opp) |
| **A**    | A.10  | 45min    | Helper provider-context                  |
| **A**    | A.11  | 1h       | Tests unitaires Chantier A               |
|          |       | **~7h**  | **TOTAL CHANTIER A**                     |
| **B**    | B.1   | 30min    | Créer table adm_organizations            |
| **B**    | B.2   | 30min    | Modifier adm_tenants (3 colonnes)        |
| **B**    | B.3   | 30min    | Créer table adm_organization_consents    |
| **B**    | B.4   | 15min    | Migration données existantes             |
| **B**    | B.5   | 1h       | RLS hiérarchique                         |
| **B**    | B.6   | 30min    | Sync Prisma schema                       |
| **B**    | B.7   | 3h       | Middleware auth context (org + tenant)   |
| **B**    | B.8   | 4h       | UI header org/tenant switch              |
| **B**    | B.9   | 3h       | UI consent screens (wizard)              |
| **B**    | B.10  | 2h       | Services OrganizationService             |
| **B**    | B.11  | 1h30     | API endpoints                            |
| **B**    | B.12  | 2h       | Tests unitaires Chantier B               |
|          |       | **~19h** | **TOTAL CHANTIER B**                     |
|          |       | **~26h** | **TOTAL GLOBAL**                         |

### 15.2 Ordre d'Exécution (Dépendances)

```
PHASE 1 : CHANTIER A - BASE (Priorité HAUTE)
═══════════════════════════════════════════
├── A.1 : Créer adm_providers
├── A.2 : Seed divisions
├── A.3 : Modifier adm_provider_employees
├── A.4 : Corriger crm_orders ◄── DÉBLOQUE OrderService 0.4
├── A.5 : ADD provider_id sur 8 tables
├── A.6 : Pattern hybride 3 tables
├── A.7 : RLS provider
├── A.8 : Sync Prisma
├── A.9 : Modifier repositories
├── A.10 : Helper provider-context
└── A.11 : Tests

PHASE 2 : FINALISER QUOTE-TO-CASH 0.5-0.9
═════════════════════════════════════════
├── 0.5 : Schemas Zod
├── 0.6 : markOpportunityWonAction
├── 0.7 : MarkAsWonModal
├── 0.8 : Template notification
└── 0.9 : Tests unitaires

PHASE 3 : CHANTIER B - ORGANISATION LAYER (Après Quote-to-Cash)
═══════════════════════════════════════════════════════════════
├── B.1-B.4 : Tables SQL
├── B.5-B.6 : RLS + Prisma
├── B.7 : Middleware auth context
├── B.8 : UI header switch
├── B.9 : UI consent wizard
├── B.10-B.11 : Services + API
└── B.12 : Tests
```

---

## 16. Validation et Tests

### 16.1 Script Vérification Chantier A

```sql
-- ============================================================================
-- VÉRIFICATION POST-MIGRATION CHANTIER A
-- ============================================================================

-- 1. Vérifier adm_providers existe et seeded
SELECT code, name, country_code, is_internal, status
FROM adm_providers
WHERE deleted_at IS NULL
ORDER BY code;

-- Attendu: 3 lignes (FLEETCORE_ADMIN, FLEETCORE_FR, FLEETCORE_AE)

-- 2. Vérifier provider_id sur adm_provider_employees
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'adm_provider_employees'
AND column_name = 'provider_id';

-- 3. Vérifier crm_orders corrigé
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'crm_orders'
AND column_name IN ('provider_id', 'client_tenant_id', 'tenant_id')
ORDER BY column_name;

-- Attendu: provider_id (uuid, NO), client_tenant_id (uuid, YES), PAS de tenant_id

-- 4. Vérifier provider_id sur toutes tables CRM
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name LIKE 'crm_%'
AND column_name = 'provider_id'
ORDER BY table_name;

-- Attendu: 12 lignes
```

### 16.2 Script Vérification Chantier B

```sql
-- ============================================================================
-- VÉRIFICATION POST-MIGRATION CHANTIER B
-- ============================================================================

-- 1. Vérifier adm_organizations existe
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'adm_organizations';

-- 2. Vérifier colonnes adm_tenants
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'adm_tenants'
AND column_name IN ('organization_id', 'hierarchy_type', 'parent_tenant_id')
ORDER BY column_name;

-- 3. Vérifier adm_organization_consents existe
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'adm_organization_consents';

-- 4. Vérifier ENUMs créés
SELECT typname
FROM pg_type
WHERE typname IN ('organization_type', 'organization_status', 'tenant_hierarchy_type', 'consent_status');
```

---

## ANNEXES

### A. UUIDs de Référence

| Élément                  | UUID                                   | Usage                         |
| ------------------------ | -------------------------------------- | ----------------------------- |
| FleetCore Admin Provider | `7ad8173c-68c5-41d3-9918-686e4e941cc0` | Provider par défaut, backfill |

### B. Workflow Prisma FleetCore

```
⚠️ RAPPEL - WORKFLOW OBLIGATOIRE

1. Modifications SQL manuelles dans Supabase SQL Editor
2. Modifier schema.prisma manuellement (correspondance avec DB)
3. pnpm prisma generate

JAMAIS: prisma db push / db pull / migrate (provoque des drifts)
```

### C. Clause CGU Suggérée (Chantier B)

```markdown
## Article 12 - Partage de données entre organisations liées

12.1 FleetCore permet aux organisations de se lier en relation
parent-filiale pour une gestion consolidée de flotte.

12.2 En acceptant une invitation de liaison, vous autorisez
l'organisation parente à accéder à vos données de flotte,
conducteurs, véhicules et rapports financiers.

12.3 Cette autorisation peut être révoquée à tout moment via
les paramètres de votre organisation. La révocation peut
nécessiter l'intervention du support FleetCore.

12.4 Le partage de données entre organisations liées est fondé
sur l'intérêt légitime (RGPD Art. 6.1.f, Recital 48) pour
des fins administratives internes.

12.5 Vous restez responsable de l'information de vos propres
utilisateurs et conducteurs concernant ce partage.
```

---

## Historique des Révisions

| Version | Date       | Auteur                 | Changements                    |
| ------- | ---------- | ---------------------- | ------------------------------ |
| 1.0.0   | 2025-12-07 | Architecture FleetCore | Spec Provider_ID uniquement    |
| 2.0.0   | 2025-12-07 | Architecture FleetCore | Spec COMPLÈTE avec 2 chantiers |

---

_Document généré le 7 décembre 2025_
_FleetCore v2 - Architecture CRM Provider_ID + Organisation Layer Clients_
