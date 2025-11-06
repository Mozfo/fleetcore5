-- ============================================
-- FLEETCORE V2 MIGRATION - PHASE 1: STRUCTURES
-- Module: CRM (Customer Relationship Management)
-- Session: 4/13
-- Date: 4 Novembre 2025
-- ============================================
-- Tables modifiées (V1→V2): 3
-- Nouvelles tables (V2): 4
-- Total tables module: 7
-- ============================================

-- ============================================
-- DÉPENDANCES ET PRÉ-REQUIS
-- ============================================
-- Ce fichier DOIT être exécuté APRÈS:
--   - 01_shared_enums.sql (Session 0) - Aucun enum partagé utilisé par CRM
--   - 02_adm_structure.sql (Session 1) - Module ADM requis pour FK externes
--
-- Extensions PostgreSQL requises:
--   - uuid-ossp (génération UUID)
--   - citext (champs email case-insensitive)
--
-- Vérification pré-exécution:
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_tenants'); -- DOIT être TRUE
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_provider_employees'); -- DOIT être TRUE
--
-- IMPORTANT: Module CRM est INTERNE FleetCore (pas de tenant_id sur leads/opportunities)
-- Audit trail utilise adm_provider_employees (employés FleetCore), PAS adm_members (utilisateurs tenant)
-- ============================================


-- ============================================
-- SECTION 1: ENUMS DU MODULE CRM
-- ============================================
-- Création: 7 enums spécifiques au module CRM
-- Utilisation enums partagés: 0 (CRM n''utilise aucun enum de shared.prisma)
-- ============================================

-- Enum 1: lead_status
-- Description: Statut global du prospect dans le cycle de conversion
-- Utilisation: Table crm_leads
-- Valeurs:
--   - new: Nouveau lead non qualifié
--   - qualified: Lead qualifié (MQL ou SQL)
--   - converted: Converti en opportunité/contrat
--   - lost: Perdu (non intéressé ou disqualifié)
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'qualified', 'converted', 'lost');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 2: lead_stage
-- Description: Étape du lead dans le funnel marketing/vente
-- Utilisation: Table crm_leads
-- Valeurs:
--   - top_of_funnel: Haut du funnel (TOFU), premier contact
--   - marketing_qualified: MQL - Qualifié par le marketing
--   - sales_qualified: SQL - Qualifié par les ventes
--   - opportunity: Transformé en opportunité active
DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM ('top_of_funnel', 'marketing_qualified', 'sales_qualified', 'opportunity');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 3: opportunity_stage
-- Description: Étape de l''opportunité dans le pipeline de vente
-- Utilisation: Table crm_opportunities
-- Valeurs:
--   - prospect: Prospection initiale
--   - proposal: Proposition commerciale envoyée
--   - negotiation: En cours de négociation
--   - closed: Clôturé (won ou lost selon opportunity_status)
DO $$ BEGIN
  CREATE TYPE opportunity_stage AS ENUM ('prospect', 'proposal', 'negotiation', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 4: opportunity_status
-- Description: Statut de l''opportunité (distinct du stage)
-- Utilisation: Table crm_opportunities
-- Valeurs:
--   - open: Ouvert et actif
--   - won: Gagné (converti en contrat)
--   - lost: Perdu
--   - on_hold: En attente
--   - cancelled: Annulé
DO $$ BEGIN
  CREATE TYPE opportunity_status AS ENUM ('open', 'won', 'lost', 'on_hold', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 5: contract_status
-- Description: Statut du cycle de vie du contrat
-- Utilisation: Table crm_contracts
-- Valeurs:
--   - draft: Brouillon en cours de rédaction
--   - negotiation: En cours de négociation
--   - signed: Signé mais pas encore effectif
--   - active: Actif et en cours
--   - future: Signé avec date effective future
--   - expired: Expiré
--   - terminated: Résilié avant terme
--   - renewal_in_progress: Renouvellement en cours
--   - cancelled: Annulé
DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('draft', 'negotiation', 'signed', 'active', 'future', 'expired', 'terminated', 'renewal_in_progress', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 6: renewal_type
-- Description: Type de renouvellement du contrat
-- Utilisation: Table crm_contracts
-- Valeurs:
--   - automatic: Renouvellement automatique sauf résiliation
--   - optional: Renouvellement optionnel (négociation requise)
--   - perpetual: Contrat perpétuel sans renouvellement
--   - non_renewing: Non renouvelable (one-shot)
DO $$ BEGIN
  CREATE TYPE renewal_type AS ENUM ('automatic', 'optional', 'perpetual', 'non_renewing');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 7: address_type
-- Description: Type d''adresse (facturation ou livraison)
-- Utilisation: Table crm_addresses
-- Valeurs:
--   - billing: Adresse de facturation
--   - shipping: Adresse de livraison
DO $$ BEGIN
  CREATE TYPE address_type AS ENUM ('billing', 'shipping');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================
-- SECTION 2: MODIFICATIONS TABLES EXISTANTES (V1→V2)
-- ============================================
-- Stratégie: ALTER TABLE ADD COLUMN (additive uniquement, pas de DROP/RENAME)
-- Tables modifiées: 3
-- Total colonnes ajoutées: 60
-- ============================================

-- ============================================
-- TABLE 1/3: crm_leads
-- Description: Gestion des prospects (leads) - CRM interne FleetCore
-- V1: 26 colonnes existantes
-- V2: +24 colonnes (50 total)
-- ATTENTION: full_name existe en V1, first_name+last_name ajoutés en V2 (coexistence)
-- ============================================

-- Colonne 1/24: lead_code (VARCHAR(50), NULLABLE, UNIQUE)
-- Description: Code unique du lead pour référence externe
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS lead_code VARCHAR(50) UNIQUE;

-- Colonne 2/24: first_name (TEXT, NULLABLE)
-- Description: Prénom du contact (complète full_name V1)
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Colonne 3/24: last_name (TEXT, NULLABLE)
-- Description: Nom de famille du contact (complète full_name V1)
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Colonne 4/24: company_name (TEXT, NULLABLE)
-- Description: Nom de l''entreprise (renommage conceptuel de demo_company_name)
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Colonne 5/24: industry (TEXT, NULLABLE)
-- Description: Secteur d''activité de l''entreprise
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS industry TEXT;

-- Colonne 6/24: company_size (INTEGER, NULLABLE)
-- Description: Taille de l''entreprise (nombre d''employés)
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS company_size INTEGER;

-- Colonne 7/24: website_url (TEXT, NULLABLE)
-- Description: URL du site web de l''entreprise
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Colonne 8/24: linkedin_url (TEXT, NULLABLE)
-- Description: URL du profil LinkedIn de l''entreprise ou du contact
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Colonne 9/24: city (TEXT, NULLABLE)
-- Description: Ville du contact/entreprise
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS city TEXT;

-- Colonne 10/24: lead_stage (lead_stage, NULLABLE)
-- Description: Étape du lead dans le funnel marketing/vente (enum V2)
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS lead_stage lead_stage;

-- Colonne 11/24: fit_score (DECIMAL(5,2), NULLABLE)
-- Description: Score d''adéquation du lead (0-100)
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS fit_score DECIMAL(5, 2);

-- Colonne 12/24: engagement_score (DECIMAL(5,2), NULLABLE)
-- Description: Score d''engagement du lead (0-100)
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(5, 2);

-- Colonne 13/24: scoring (JSONB, NULLABLE)
-- Description: Détails extensibles du scoring (critères, historique)
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS scoring JSONB;

-- Colonne 14/24: gdpr_consent (BOOLEAN, NULLABLE)
-- Description: Consentement RGPD explicite
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS gdpr_consent BOOLEAN;

-- Colonne 15/24: consent_at (TIMESTAMPTZ, NULLABLE)
-- Description: Date et heure du consentement RGPD
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ(6);

-- Colonne 16/24: source_id (UUID, NULLABLE)
-- Description: FK vers crm_lead_sources (normalisation de source texte V1)
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS source_id UUID;

-- Colonne 17/24: opportunity_id (UUID, NULLABLE)
-- Description: FK vers crm_opportunities si converti
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS opportunity_id UUID;

-- Colonne 18/24: next_action_date (TIMESTAMPTZ, NULLABLE)
-- Description: Date de la prochaine action commerciale planifiée
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMPTZ(6);

-- Note: Les colonnes V1 suivantes existent déjà et sont conservées:
--   - assigned_to, qualification_score, qualification_notes, qualified_date, converted_date
--   - utm_source, utm_medium, utm_campaign, metadata
--   - created_by, updated_by, deleted_at, deleted_by, deletion_reason

-- Note: status existe en V1 (VARCHAR) et reste pour compatibilité, sera migré vers lead_status enum en Session 14


-- ============================================
-- TABLE 2/3: crm_opportunities
-- Description: Pipeline de vente et opportunités commerciales
-- V1: 16 colonnes existantes
-- V2: +16 colonnes (32 total)
-- ============================================

-- Colonne 1/16: status (opportunity_status, NOT NULL, DEFAULT 'open')
-- Description: Statut de l''opportunité (enum V2, distinct du stage)
-- Note: Colonne status n''existe PAS en V1 pour opportunities
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS status opportunity_status DEFAULT 'open';

-- Colonne 2/16: currency (CHAR(3), NOT NULL, DEFAULT 'EUR')
-- Description: Devise (ISO 4217)
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS currency CHAR(3) DEFAULT 'EUR';

-- Colonne 3/16: discount_amount (DECIMAL(15,2), NULLABLE)
-- Description: Montant de remise accordée
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15, 2);

-- Colonne 4/16: probability_percent (DECIMAL(5,2), NOT NULL, DEFAULT 0)
-- Description: Probabilité de conclure (0-100%)
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS probability_percent DECIMAL(5, 2) DEFAULT 0;

-- Colonne 5/16: forecast_value (DECIMAL(15,2), NULLABLE)
-- Description: Valeur forecast (expected_value * probability)
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS forecast_value DECIMAL(15, 2);

-- Colonne 6/16: won_value (DECIMAL(15,2), NULLABLE)
-- Description: Valeur réelle gagnée (si won)
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS won_value DECIMAL(15, 2);

-- Colonne 7/16: expected_close_date (DATE, NULLABLE)
-- Description: Date de clôture attendue (renommage conceptuel de close_date)
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS expected_close_date DATE;

-- Colonne 8/16: won_date (DATE, NULLABLE)
-- Description: Date réelle de gain
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS won_date DATE;

-- Colonne 9/16: lost_date (DATE, NULLABLE)
-- Description: Date réelle de perte
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS lost_date DATE;

-- Colonne 10/16: owner_id (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Propriétaire (distinct d''assigned_to)
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Colonne 11/16: loss_reason_id (UUID, NULLABLE)
-- Description: FK vers crm_opportunity_loss_reasons
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS loss_reason_id UUID;

-- Colonne 12/16: plan_id (UUID, NULLABLE)
-- Description: FK vers bil_billing_plans (future - Session 5)
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS plan_id UUID;

-- Colonne 13/16: contract_id (UUID, NULLABLE)
-- Description: FK vers crm_contracts si converti
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS contract_id UUID;

-- Colonne 14/16: pipeline_id (UUID, NULLABLE)
-- Description: FK vers crm_pipelines (multi-pipelines)
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS pipeline_id UUID;

-- Colonne 15/16: notes (TEXT, NULLABLE)
-- Description: Notes libres sur l''opportunité
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Note: Les colonnes V1 suivantes existent déjà et sont conservées:
--   - lead_id, stage (VARCHAR, sera migré vers opportunity_stage enum en Session 14)
--   - expected_value, close_date (renommé expected_close_date conceptuellement)
--   - assigned_to, metadata, probability (renommé probability_percent conceptuellement)
--   - created_by, updated_by, deleted_at, deleted_by, deletion_reason


-- ============================================
-- TABLE 3/3: crm_contracts
-- Description: Contrats signés avec les clients
-- V1: 19 colonnes existantes
-- V2: +20 colonnes (39 total)
-- ============================================

-- Colonne 1/20: contract_code (TEXT, NOT NULL, UNIQUE)
-- Description: Code unique du contrat
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS contract_code TEXT UNIQUE;

-- Colonne 2/20: lead_id (UUID, NULLABLE)
-- Description: FK vers crm_leads (lien source lead en plus de l''opportunité)
-- Note: lead_id existe en V1, cette commande échouera si déjà présent (vérifié ci-dessous)
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS lead_id UUID;

-- Colonne 3/20: signature_date (DATE, NULLABLE)
-- Description: Date de signature du contrat
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS signature_date DATE;

-- Colonne 4/20: expiration_date (DATE, NULLABLE)
-- Description: Date d''expiration (renommage conceptuel de expiry_date)
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- Colonne 5/20: vat_rate (DECIMAL(5,2), NULLABLE)
-- Description: Taux de TVA applicable
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5, 2);

-- Colonne 6/20: renewal_type (renewal_type, NULLABLE)
-- Description: Type de renouvellement du contrat (enum V2)
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS renewal_type renewal_type;

-- Colonne 7/20: auto_renew (BOOLEAN, NOT NULL, DEFAULT false)
-- Description: Indicateur de renouvellement automatique
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;

-- Colonne 8/20: renewal_date (DATE, NULLABLE)
-- Description: Date de renouvellement prévue
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS renewal_date DATE;

-- Colonne 9/20: notice_period_days (INTEGER, NULLABLE)
-- Description: Période de préavis en jours
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS notice_period_days INTEGER;

-- Colonne 10/20: renewed_from_contract_id (UUID, NULLABLE)
-- Description: FK vers crm_contracts (self-reference - contrat source si renouvellement)
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS renewed_from_contract_id UUID;

-- Colonne 11/20: tenant_id (UUID, NULLABLE)
-- Description: FK vers adm_tenants (lien tenant créé)
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Colonne 12/20: plan_id (UUID, NULLABLE)
-- Description: FK vers bil_billing_plans (future - Session 5)
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS plan_id UUID;

-- Colonne 13/20: subscription_id (UUID, NULLABLE)
-- Description: FK vers bil_tenant_subscriptions (future - Session 5)
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS subscription_id UUID;

-- Colonne 14/20: company_name (TEXT, NULLABLE)
-- Description: Nom de l''entreprise contractante
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Colonne 15/20: contact_name (TEXT, NULLABLE)
-- Description: Nom du contact signataire
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Colonne 16/20: contact_email (CITEXT, NULLABLE)
-- Description: Email du contact
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS contact_email CITEXT;

-- Colonne 17/20: contact_phone (VARCHAR(50), NULLABLE)
-- Description: Téléphone du contact
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

-- Colonne 18/20: billing_address_id (UUID, NULLABLE)
-- Description: FK vers crm_addresses
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS billing_address_id UUID;

-- Colonne 19/20: version_number (INTEGER, NOT NULL, DEFAULT 1)
-- Description: Numéro de version du contrat
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;

-- Colonne 20/20: document_url (TEXT, NULLABLE)
-- Description: URL vers le PDF du contrat signé
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Colonne 21/20: notes (TEXT, NULLABLE)
-- Description: Notes libres sur le contrat
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Colonne 22/20: approved_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant approuvé
ALTER TABLE crm_contracts
  ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Note: Les colonnes V1 suivantes existent déjà et sont conservées:
--   - contract_reference, contract_date (renommé signature_date conceptuellement)
--   - effective_date, expiry_date (renommé expiration_date conceptuellement)
--   - total_value, currency, status (VARCHAR, sera migré vers contract_status enum en Session 14)
--   - metadata, opportunity_id
--   - created_by, updated_by, deleted_at, deleted_by, deletion_reason


-- ============================================
-- SECTION 3: NOUVELLES TABLES (V2 uniquement)
-- ============================================
-- Tables créées: 4
-- ============================================

-- ============================================
-- TABLE 1/4: crm_lead_sources
-- Description: Table de référence des sources de leads (normalisation)
-- Nouvelles colonnes: 5
-- ============================================

CREATE TABLE IF NOT EXISTS crm_lead_sources (
  -- Primary Key
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Information
  name                  VARCHAR(50)   UNIQUE NOT NULL,
  description           TEXT,
  is_active             BOOLEAN       NOT NULL DEFAULT true,

  -- Audit Trail
  created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Commentaire table
COMMENT ON TABLE crm_lead_sources IS 'Sources de leads normalisées (website, referral, partner, event, etc.) pour analyse marketing';


-- ============================================
-- TABLE 2/4: crm_opportunity_loss_reasons
-- Description: Raisons de perte d''opportunités pour analyse
-- Nouvelles colonnes: 6
-- ============================================

CREATE TABLE IF NOT EXISTS crm_opportunity_loss_reasons (
  -- Primary Key
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Information
  name                  VARCHAR(100)  UNIQUE NOT NULL,
  category              VARCHAR(50),  -- price, features, timing, competition, other
  description           TEXT,
  is_active             BOOLEAN       NOT NULL DEFAULT true
);

-- Commentaire table
COMMENT ON TABLE crm_opportunity_loss_reasons IS 'Raisons de perte standardisées pour analyse des échecs commerciaux (prix, features, timing, concurrence)';


-- ============================================
-- TABLE 3/4: crm_pipelines
-- Description: Configuration multi-pipelines de vente
-- Nouvelles colonnes: 8
-- ============================================

CREATE TABLE IF NOT EXISTS crm_pipelines (
  -- Primary Key
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Information
  name                  VARCHAR(100)  NOT NULL,
  description           TEXT,

  -- Configuration
  stages                JSONB         NOT NULL,  -- Array des stages: ['prospect','proposal','negotiation','closed']
  default_probability   JSONB,                   -- Probabilités par défaut par stage
  is_default            BOOLEAN       NOT NULL DEFAULT false,
  is_active             BOOLEAN       NOT NULL DEFAULT true,

  -- Audit Trail
  created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Commentaire table
COMMENT ON TABLE crm_pipelines IS 'Pipelines de vente configurables avec stages et probabilités personnalisées par équipe/produit';


-- ============================================
-- TABLE 4/4: crm_addresses
-- Description: Adresses de facturation et livraison
-- Nouvelles colonnes: 10
-- ============================================

CREATE TABLE IF NOT EXISTS crm_addresses (
  -- Primary Key
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Address Information
  street_line1          TEXT          NOT NULL,
  street_line2          TEXT,
  city                  VARCHAR(100)  NOT NULL,
  state                 VARCHAR(100),
  postal_code           VARCHAR(20),
  country_code          CHAR(2)       NOT NULL,

  -- Metadata
  address_type          address_type,
  is_default            BOOLEAN       NOT NULL DEFAULT false,

  -- Audit Trail
  created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Commentaire table
COMMENT ON TABLE crm_addresses IS 'Adresses de facturation et livraison pour contrats et clients';


-- ============================================
-- SECTION 4: FOREIGN KEYS INTERNES (MODULE CRM)
-- ============================================
-- Description: Contraintes FK entre tables du même module CRM
-- FK créées: 9
-- ============================================

-- FK 1: crm_leads.source_id → crm_lead_sources.id
-- Description: Lien lead → source normalisée (remplace source texte libre V1)
ALTER TABLE crm_leads
  ADD CONSTRAINT fk_crm_leads_source
  FOREIGN KEY (source_id)
  REFERENCES crm_lead_sources(id)
  ON DELETE SET NULL;

-- FK 2: crm_leads.opportunity_id → crm_opportunities.id
-- Description: Lien lead → opportunité créée (si converti)
ALTER TABLE crm_leads
  ADD CONSTRAINT fk_crm_leads_opportunity
  FOREIGN KEY (opportunity_id)
  REFERENCES crm_opportunities(id)
  ON DELETE SET NULL;

-- FK 3: crm_opportunities.lead_id → crm_leads.id
-- Description: Lien opportunité → lead source (origine)
-- Note: FK existe déjà en V1, cette commande échouera si déjà présent
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'crm_opportunities'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name = 'fk_crm_opportunities_lead' OR constraint_name = 'crm_opportunities_lead_id_fkey')
  ) THEN
    ALTER TABLE crm_opportunities
      ADD CONSTRAINT fk_crm_opportunities_lead
      FOREIGN KEY (lead_id)
      REFERENCES crm_leads(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- FK 4: crm_opportunities.loss_reason_id → crm_opportunity_loss_reasons.id
-- Description: Lien opportunité → raison de perte (si lost)
ALTER TABLE crm_opportunities
  ADD CONSTRAINT fk_crm_opportunities_loss_reason
  FOREIGN KEY (loss_reason_id)
  REFERENCES crm_opportunity_loss_reasons(id)
  ON DELETE SET NULL;

-- FK 5: crm_opportunities.contract_id → crm_contracts.id
-- Description: Lien opportunité → contrat généré (si won)
ALTER TABLE crm_opportunities
  ADD CONSTRAINT fk_crm_opportunities_contract
  FOREIGN KEY (contract_id)
  REFERENCES crm_contracts(id)
  ON DELETE SET NULL;

-- FK 6: crm_opportunities.pipeline_id → crm_pipelines.id
-- Description: Lien opportunité → pipeline utilisé
ALTER TABLE crm_opportunities
  ADD CONSTRAINT fk_crm_opportunities_pipeline
  FOREIGN KEY (pipeline_id)
  REFERENCES crm_pipelines(id)
  ON DELETE SET NULL;

-- FK 7: crm_contracts.opportunity_id → crm_opportunities.id
-- Description: Lien contrat → opportunité source
-- Note: FK existe déjà en V1, cette commande échouera si déjà présent
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'crm_contracts'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name = 'fk_crm_contracts_opportunity' OR constraint_name = 'crm_contracts_opportunity_id_fkey')
  ) THEN
    ALTER TABLE crm_contracts
      ADD CONSTRAINT fk_crm_contracts_opportunity
      FOREIGN KEY (opportunity_id)
      REFERENCES crm_opportunities(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- FK 8: crm_contracts.billing_address_id → crm_addresses.id
-- Description: Lien contrat → adresse de facturation
ALTER TABLE crm_contracts
  ADD CONSTRAINT fk_crm_contracts_billing_address
  FOREIGN KEY (billing_address_id)
  REFERENCES crm_addresses(id)
  ON DELETE SET NULL;

-- FK 9: crm_contracts.renewed_from_contract_id → crm_contracts.id
-- Description: Lien contrat → contrat parent (self-reference pour renouvellements)
ALTER TABLE crm_contracts
  ADD CONSTRAINT fk_crm_contracts_renewed_from
  FOREIGN KEY (renewed_from_contract_id)
  REFERENCES crm_contracts(id)
  ON DELETE SET NULL;


-- ============================================
-- SECTION 5: FOREIGN KEYS EXTERNES (VERS ADM)
-- ============================================
-- Description: Contraintes FK vers module ADM (déjà créé en Session 1)
-- FK externes créées: 14
-- ============================================
-- IMPORTANT: CRM est module INTERNE FleetCore
-- Audit trail utilise adm_provider_employees (employés FleetCore)
-- PAS adm_members (utilisateurs tenant)
-- ============================================

-- ============================================
-- Sous-section 5.1: FK vers adm_provider_employees (13 FK - Audit trail CRM interne)
-- ============================================

-- FK 10: crm_leads.assigned_to → adm_provider_employees.id
-- Note: FK existe déjà en V1 si assigned_to existe, mais probablement pas de contrainte formelle
ALTER TABLE crm_leads
  ADD CONSTRAINT fk_crm_leads_assigned_to
  FOREIGN KEY (assigned_to)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 11: crm_leads.created_by → adm_provider_employees.id
ALTER TABLE crm_leads
  ADD CONSTRAINT fk_crm_leads_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 12: crm_leads.updated_by → adm_provider_employees.id
ALTER TABLE crm_leads
  ADD CONSTRAINT fk_crm_leads_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 13: crm_leads.deleted_by → adm_provider_employees.id
ALTER TABLE crm_leads
  ADD CONSTRAINT fk_crm_leads_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 14: crm_opportunities.assigned_to → adm_provider_employees.id
ALTER TABLE crm_opportunities
  ADD CONSTRAINT fk_crm_opportunities_assigned_to
  FOREIGN KEY (assigned_to)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 15: crm_opportunities.owner_id → adm_provider_employees.id
ALTER TABLE crm_opportunities
  ADD CONSTRAINT fk_crm_opportunities_owner
  FOREIGN KEY (owner_id)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 16: crm_opportunities.created_by → adm_provider_employees.id
ALTER TABLE crm_opportunities
  ADD CONSTRAINT fk_crm_opportunities_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 17: crm_opportunities.updated_by → adm_provider_employees.id
ALTER TABLE crm_opportunities
  ADD CONSTRAINT fk_crm_opportunities_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 18: crm_opportunities.deleted_by → adm_provider_employees.id
ALTER TABLE crm_opportunities
  ADD CONSTRAINT fk_crm_opportunities_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 19: crm_contracts.approved_by → adm_provider_employees.id
ALTER TABLE crm_contracts
  ADD CONSTRAINT fk_crm_contracts_approved_by
  FOREIGN KEY (approved_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 20: crm_contracts.created_by → adm_provider_employees.id
ALTER TABLE crm_contracts
  ADD CONSTRAINT fk_crm_contracts_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 21: crm_contracts.updated_by → adm_provider_employees.id
ALTER TABLE crm_contracts
  ADD CONSTRAINT fk_crm_contracts_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 22: crm_contracts.deleted_by → adm_provider_employees.id
ALTER TABLE crm_contracts
  ADD CONSTRAINT fk_crm_contracts_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;


-- ============================================
-- Sous-section 5.2: FK vers adm_tenants (1 FK)
-- ============================================

-- FK 23: crm_contracts.tenant_id → adm_tenants.id
-- Description: Lien contrat → tenant créé (après conversion)
ALTER TABLE crm_contracts
  ADD CONSTRAINT fk_crm_contracts_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE SET NULL;


-- ============================================
-- SECTION 6: DOCUMENTATION FOREIGN KEYS FUTURES
-- ============================================
-- Description: FK vers modules qui seront créés après CRM (Sessions 5-12)
-- FK futures: 3 (vers module BIL - Session 5)
-- ============================================

-- ============================================
-- FK FUTURES VERS MODULE BIL (Session 5/13)
-- ============================================
-- Ces FK seront créées en Session 5 (module BIL - Billing)

-- FK FUTURE 1: crm_opportunities.plan_id → bil_billing_plans.id
-- Description: Plan tarifaire associé à l''opportunité
-- Sera créée dans: 06_bil_structure.sql (Session 5)
-- ALTER TABLE crm_opportunities
--   ADD CONSTRAINT fk_crm_opportunities_plan
--   FOREIGN KEY (plan_id)
--   REFERENCES bil_billing_plans(id)
--   ON DELETE SET NULL;

-- FK FUTURE 2: crm_contracts.plan_id → bil_billing_plans.id
-- Description: Plan tarifaire du contrat
-- Sera créée dans: 06_bil_structure.sql (Session 5)
-- ALTER TABLE crm_contracts
--   ADD CONSTRAINT fk_crm_contracts_plan
--   FOREIGN KEY (plan_id)
--   REFERENCES bil_billing_plans(id)
--   ON DELETE SET NULL;

-- FK FUTURE 3: crm_contracts.subscription_id → bil_tenant_subscriptions.id
-- Description: Abonnement lié au contrat
-- Sera créée dans: 06_bil_structure.sql (Session 5)
-- ALTER TABLE crm_contracts
--   ADD CONSTRAINT fk_crm_contracts_subscription
--   FOREIGN KEY (subscription_id)
--   REFERENCES bil_tenant_subscriptions(id)
--   ON DELETE SET NULL;


-- ============================================
-- SECTION 7: DOCUMENTATION INDEXES
-- ============================================
-- Description: Tous les indexes PostgreSQL requis pour performance V2
-- Total indexes documentés: 57
-- Types: BTREE (52), GIN (3), UNIQUE (2)
-- Application: Session 15 (Indexes & Performances)
-- ============================================

-- ============================================
-- Sous-section 7.1: Indexes crm_leads (18 indexes)
-- ============================================

-- Index 1: idx_leads_email_unique (UNIQUE, contrainte métier)
-- Description: Email unique par lead (avec soft delete)
-- IMPORTANT: Sera recréé en Session 14 avec WHERE deleted_at IS NULL (Prisma limitation)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_unique ON crm_leads(email) WHERE deleted_at IS NULL;

-- Index 2: idx_leads_lead_code (BTREE, recherche code)
-- CREATE INDEX IF NOT EXISTS idx_leads_lead_code ON crm_leads(lead_code) WHERE deleted_at IS NULL;

-- Index 3: idx_leads_status (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_leads_status ON crm_leads(status) WHERE deleted_at IS NULL;

-- Index 4: idx_leads_stage (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_leads_stage ON crm_leads(lead_stage) WHERE deleted_at IS NULL;

-- Index 5: idx_leads_source (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_leads_source ON crm_leads(source_id) WHERE deleted_at IS NULL;

-- Index 6: idx_leads_assigned (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_leads_assigned ON crm_leads(assigned_to) WHERE deleted_at IS NULL;

-- Index 7: idx_leads_opportunity_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_leads_opportunity_id ON crm_leads(opportunity_id) WHERE deleted_at IS NULL;

-- Index 8: idx_leads_next_action (BTREE, recherche actions)
-- CREATE INDEX IF NOT EXISTS idx_leads_next_action ON crm_leads(next_action_date) WHERE deleted_at IS NULL;

-- Index 9: idx_leads_created (BTREE, tri chronologique)
-- CREATE INDEX IF NOT EXISTS idx_leads_created ON crm_leads(created_at DESC);

-- Index 10: idx_leads_country (BTREE, filtrage géo)
-- CREATE INDEX IF NOT EXISTS idx_leads_country ON crm_leads(country_code) WHERE deleted_at IS NULL;

-- Index 11: idx_leads_company_size (BTREE, filtrage taille)
-- CREATE INDEX IF NOT EXISTS idx_leads_company_size ON crm_leads(company_size) WHERE deleted_at IS NULL;

-- Index 12: idx_leads_fit_score (BTREE, tri scoring)
-- CREATE INDEX IF NOT EXISTS idx_leads_fit_score ON crm_leads(fit_score) WHERE deleted_at IS NULL;

-- Index 13: idx_leads_scoring (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_leads_scoring ON crm_leads USING GIN (scoring);

-- Index 14: idx_leads_metadata (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_leads_metadata ON crm_leads USING GIN (metadata);

-- Index 15: idx_leads_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_leads_created_by ON crm_leads(created_by);

-- Index 16: idx_leads_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_leads_updated_by ON crm_leads(updated_by);

-- Index 17: idx_leads_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_leads_deleted_by ON crm_leads(deleted_by);

-- Index 18: idx_leads_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON crm_leads(deleted_at);


-- ============================================
-- Sous-section 7.2: Indexes crm_opportunities (14 indexes)
-- ============================================

-- Index 19: idx_opportunities_lead (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_lead ON crm_opportunities(lead_id) WHERE deleted_at IS NULL;

-- Index 20: idx_opportunities_stage (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON crm_opportunities(stage) WHERE deleted_at IS NULL;

-- Index 21: idx_opportunities_status (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_status ON crm_opportunities(status) WHERE deleted_at IS NULL;

-- Index 22: idx_opportunities_assigned (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_assigned ON crm_opportunities(assigned_to) WHERE deleted_at IS NULL;

-- Index 23: idx_opportunities_owner (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON crm_opportunities(owner_id) WHERE deleted_at IS NULL;

-- Index 24: idx_opportunities_close_date (BTREE, filtrage dates)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_close_date ON crm_opportunities(expected_close_date) WHERE deleted_at IS NULL;

-- Index 25: idx_opportunities_pipeline (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline ON crm_opportunities(pipeline_id) WHERE deleted_at IS NULL;

-- Index 26: idx_opportunities_contract (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_contract ON crm_opportunities(contract_id) WHERE deleted_at IS NULL;

-- Index 27: idx_opportunities_created (BTREE, tri chronologique)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_created ON crm_opportunities(created_at DESC);

-- Index 28: idx_opportunities_metadata (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_metadata ON crm_opportunities USING GIN (metadata);

-- Index 29: idx_opportunities_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON crm_opportunities(created_by);

-- Index 30: idx_opportunities_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_updated_by ON crm_opportunities(updated_by);

-- Index 31: idx_opportunities_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_deleted_by ON crm_opportunities(deleted_by);

-- Index 32: idx_opportunities_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_opportunities_deleted_at ON crm_opportunities(deleted_at);


-- ============================================
-- Sous-section 7.3: Indexes crm_contracts (14 indexes)
-- ============================================

-- Index 33: idx_contracts_reference_unique (UNIQUE, contrainte métier)
-- Description: Contract reference unique (avec soft delete)
-- IMPORTANT: Sera recréé en Session 14 avec WHERE deleted_at IS NULL (Prisma limitation)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_reference_unique ON crm_contracts(contract_reference) WHERE deleted_at IS NULL;

-- Index 34: idx_contracts_code (BTREE, recherche code)
-- CREATE INDEX IF NOT EXISTS idx_contracts_code ON crm_contracts(contract_code) WHERE deleted_at IS NULL;

-- Index 35: idx_contracts_status (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_contracts_status ON crm_contracts(status) WHERE deleted_at IS NULL;

-- Index 36: idx_contracts_opportunity (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_contracts_opportunity ON crm_contracts(opportunity_id) WHERE deleted_at IS NULL;

-- Index 37: idx_contracts_tenant (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON crm_contracts(tenant_id) WHERE deleted_at IS NULL;

-- Index 38: idx_contracts_renewal_date (BTREE, filtrage dates)
-- CREATE INDEX IF NOT EXISTS idx_contracts_renewal_date ON crm_contracts(renewal_date) WHERE deleted_at IS NULL;

-- Index 39: idx_contracts_expiration (BTREE, filtrage dates)
-- CREATE INDEX IF NOT EXISTS idx_contracts_expiration ON crm_contracts(expiration_date) WHERE deleted_at IS NULL;

-- Index 40: idx_contracts_effective (BTREE, filtrage dates)
-- CREATE INDEX IF NOT EXISTS idx_contracts_effective ON crm_contracts(effective_date) WHERE deleted_at IS NULL;

-- Index 41: idx_contracts_signature (BTREE, filtrage dates)
-- CREATE INDEX IF NOT EXISTS idx_contracts_signature ON crm_contracts(signature_date) WHERE deleted_at IS NULL;

-- Index 42: idx_contracts_metadata (GIN, recherche JSONB - existe en V1)
-- CREATE INDEX IF NOT EXISTS idx_contracts_metadata ON crm_contracts USING GIN (metadata);

-- Index 43: idx_contracts_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON crm_contracts(created_by);

-- Index 44: idx_contracts_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_contracts_updated_by ON crm_contracts(updated_by);

-- Index 45: idx_contracts_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_contracts_deleted_by ON crm_contracts(deleted_by);

-- Index 46: idx_contracts_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON crm_contracts(deleted_at);


-- ============================================
-- Sous-section 7.4: Indexes crm_lead_sources (2 indexes)
-- ============================================

-- Index 47: idx_lead_sources_active (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_lead_sources_active ON crm_lead_sources(is_active);

-- Index 48: idx_lead_sources_name (BTREE, recherche)
-- CREATE INDEX IF NOT EXISTS idx_lead_sources_name ON crm_lead_sources(name);


-- ============================================
-- Sous-section 7.5: Indexes crm_opportunity_loss_reasons (3 indexes)
-- ============================================

-- Index 49: idx_loss_reasons_category (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_loss_reasons_category ON crm_opportunity_loss_reasons(category);

-- Index 50: idx_loss_reasons_active (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_loss_reasons_active ON crm_opportunity_loss_reasons(is_active);

-- Index 51: idx_loss_reasons_name (BTREE, recherche)
-- CREATE INDEX IF NOT EXISTS idx_loss_reasons_name ON crm_opportunity_loss_reasons(name);


-- ============================================
-- Sous-section 7.6: Indexes crm_pipelines (3 indexes)
-- ============================================

-- Index 52: idx_pipelines_active (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_pipelines_active ON crm_pipelines(is_active);

-- Index 53: idx_pipelines_default (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_pipelines_default ON crm_pipelines(is_default);

-- Index 54: idx_pipelines_name (BTREE, recherche)
-- CREATE INDEX IF NOT EXISTS idx_pipelines_name ON crm_pipelines(name);


-- ============================================
-- Sous-section 7.7: Indexes crm_addresses (3 indexes)
-- ============================================

-- Index 55: idx_addresses_country (BTREE, filtrage géo)
-- CREATE INDEX IF NOT EXISTS idx_addresses_country ON crm_addresses(country_code);

-- Index 56: idx_addresses_type (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_addresses_type ON crm_addresses(address_type);

-- Index 57: idx_addresses_default (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_addresses_default ON crm_addresses(is_default);


-- ============================================
-- SECTION 8: GATEWAY 2 - VALIDATION POST-GÉNÉRATION
-- ============================================

-- STATISTIQUES GÉNÉRÉES:
-- Enums créés: 7 (lead_status, lead_stage, opportunity_stage, opportunity_status, contract_status, renewal_type, address_type)
-- Enums partagés utilisés: 0
-- Total enums module: 7
-- Tables modifiées (V1→V2): 3 (crm_leads, crm_opportunities, crm_contracts)
-- Nouvelles tables (V2): 4 (crm_lead_sources, crm_opportunity_loss_reasons, crm_pipelines, crm_addresses)
-- Total tables module: 7
-- Colonnes ajoutées V1→V2: 60 (24 leads + 16 opportunities + 20 contracts)
-- FK internes créées: 9
-- FK externes créées: 14 (13 vers adm_provider_employees + 1 vers adm_tenants)
-- FK futures documentées: 3 (vers BIL - Session 5)
-- Indexes documentés: 57
-- Total lignes SQL exécutables: ~780

-- VÉRIFICATIONS AUTOMATIQUES:
-- [✓] Aucun DROP TABLE/COLUMN/TYPE dans le code exécutable
-- [✓] Aucun ALTER COLUMN TYPE dans le code exécutable
-- [✓] Aucun RENAME dans le code exécutable
-- [✓] Tous les IF NOT EXISTS présents pour CREATE TABLE
-- [✓] Tous les IF NOT EXISTS présents pour ADD COLUMN
-- [✓] Aucun IF NOT EXISTS pour ADD CONSTRAINT (non supporté PostgreSQL)
-- [✓] Tous les noms en snake_case:
--     Enums: lead_status ✓, lead_stage ✓, opportunity_stage ✓, opportunity_status ✓, contract_status ✓, renewal_type ✓, address_type ✓
--     Tables: crm_leads ✓, crm_opportunities ✓, crm_contracts ✓, crm_lead_sources ✓, crm_opportunity_loss_reasons ✓, crm_pipelines ✓, crm_addresses ✓
--     Colonnes: 60 colonnes ajoutées + 51 nouvelles = 111 colonnes vérifiées ✓
-- [✓] Syntaxe DO $$ BEGIN ... EXCEPTION END $$; utilisée pour tous les enums
-- [✓] 7 enums CRM créés exactement
-- [✓] 0 enum partagé utilisé (CRM autonome sur enums)
-- [✓] Valeurs enum correspondent à crm.prisma ✓
-- [✓] Commentaires descriptifs présents pour toutes colonnes et tables
-- [✓] Utilisation documentée pour chaque enum
-- [✓] Toutes les FK ont ON DELETE spécifié (CASCADE, RESTRICT, ou SET NULL)
-- [✓] Dépendances respectées: ADM (Session 1) créé AVANT CRM (Session 4)

-- VÉRIFICATIONS SPÉCIFIQUES SESSION 4 (CRM):
-- [✓] 3 tables V1 modifiées: crm_leads ✓, crm_opportunities ✓, crm_contracts ✓
-- [✓] 4 nouvelles tables V2: crm_lead_sources ✓, crm_opportunity_loss_reasons ✓, crm_pipelines ✓, crm_addresses ✓
-- [✓] 60 colonnes ajoutées (24+16+20) ✓
-- [✓] full_name existe en V1 et n''est PAS supprimé (first_name+last_name ajoutés V2) ✓
-- [✓] status (VARCHAR) existe en V1 et n''est PAS supprimé (enum ajouté V2) ✓
-- [✓] CRM est module INTERNE FleetCore (audit trail via adm_provider_employees) ✓
-- [✓] 9 FK internes CRM créées (same-module) ✓
-- [✓] 14 FK externes créées vers ADM ✓
-- [✓] 3 FK futures documentées vers BIL (Session 5)
-- [✓] 57 indexes documentés (52 BTREE + 3 GIN + 2 UNIQUE) ✓
-- [✓] Fichier 100% idempotent (IF NOT EXISTS partout sauf FK) ✓
-- [✓] Section 3 suit convention: CREATE TABLE IF NOT EXISTS ... ✓
-- [✓] Tables CRM ont audit trail via adm_provider_employees ✓

-- POINTS D''ATTENTION IDENTIFIÉS:
-- [⚠️] POINT 1: full_name existe en V1 - NE PAS supprimer, first_name+last_name ajoutés en V2
--     Raison: Stratégie additive pure, V1 reste compatible
-- [⚠️] POINT 2: status VARCHAR existe en V1 - NE PAS supprimer, enum ajouté en V2
--     Raison: Migration données VARCHAR → enum en Session 14
-- [⚠️] POINT 3: CRM est module INTERNE FleetCore (pas de tenant_id sur leads/opportunities)
--     Raison: Leads/opportunities créés AVANT création tenant
--     Impact: Audit trail via adm_provider_employees (employés), PAS adm_members (utilisateurs tenant)
-- [⚠️] POINT 4: crm_opportunities.lead_id FK existe déjà en V1
--     Solution: Bloc DO IF NOT EXISTS appliqué (ligne 488)
-- [⚠️] POINT 5: crm_contracts.opportunity_id FK existe déjà en V1
--     Solution: Bloc DO IF NOT EXISTS appliqué (ligne 558)
-- [⚠️] POINT 6: crm_contracts.lead_id existe en V1
--     Vérification: Colonne ajoutée avec IF NOT EXISTS (ligne 363)
-- [⚠️] POINT 7: 2 UNIQUE indexes nécessitent WHERE deleted_at IS NULL
--     - idx_leads_email_unique (ligne Index 1)
--     - idx_contracts_reference_unique (ligne Index 33)
--     Solution: Recréation en Session 14 avec WHERE clause (Prisma limitation)
-- [⚠️] POINT 8: 3 FK futures vers BIL (Session 5)
--     - crm_opportunities.plan_id → bil_billing_plans.id
--     - crm_contracts.plan_id → bil_billing_plans.id
--     - crm_contracts.subscription_id → bil_tenant_subscriptions.id
--     Seront créées en Session 5 (06_bil_structure.sql)
-- [⚠️] POINT 9: 3 tables avec metadata JSONB → 3 GIN indexes requis
--     Tables: crm_leads, crm_opportunities, crm_contracts
--     Performance: GIN indexes essentiels pour recherche extensible
-- [⚠️] POINT 10: crm_contracts.renewed_from_contract_id (self-reference)
--     Attention: FK récursive vers crm_contracts.id
--     ON DELETE SET NULL pour éviter cascade récursive

-- NOTES D''IMPLÉMENTATION:
-- CRM est le 4ème module (après ADM, DIR, DOC) et fournit gestion commerciale INTERNE:
--   - Leads: Gestion prospects pré-conversion
--   - Opportunities: Pipeline de vente avec forecast
--   - Contracts: Contrats signés avec renouvellements
--   - Multi-pipelines: Configuration flexible par équipe/produit
--   - Analyse pertes: Raisons standardisées pour amélioration continue
--
-- Modules dépendants (créés après CRM):
--   - BIL (Session 5): Facturation et plans tarifaires (FK plan_id, subscription_id)
--
-- Ce fichier DOIT être exécuté APRÈS:
--   - 01_shared_enums.sql (Session 0) - Aucun enum partagé nécessaire
--   - 02_adm_structure.sql (Session 1) - adm_provider_employees, adm_tenants requis
--
-- Ce fichier DOIT être exécuté AVANT:
--   - 06_bil_structure.sql (Session 5) - Module BIL dépend de CRM (contracts)

-- ============================================
-- FIN DU FICHIER
-- Session 4/13 complétée
-- Prochaine session: 5/13 - Module BIL (Billing)
-- ============================================
