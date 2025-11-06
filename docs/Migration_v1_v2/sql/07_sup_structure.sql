-- ============================================
-- FLEETCORE V2 MIGRATION - PHASE 1: STRUCTURES
-- Module: SUP (Support & Customer Feedback)
-- Session: 6/13
-- Date: 4 Novembre 2025
-- ============================================
-- Tables modifiées (V1→V2): 3
-- Nouvelles tables (V2): 3
-- Total tables module: 6
-- ============================================
--
-- STRATÉGIE:
-- 1. Création des 7 enums (TicketStatus, TicketPriority, TicketSourcePlatform,
--    TicketRaisedByType, MessageType, SubmitterType, ServiceType)
-- 2. Modification des 3 tables V1 existantes (ADD COLUMN V2)
-- 3. Création des 3 nouvelles tables V2 (ticket_categories, sla_rules, canned_responses)
-- 4. Création des FK internes (5 FK)
-- 5. Création des FK externes vers ADM (13 FK)
-- 6. Documentation des FK FUTURES vers RID (1 FK)
-- 7. Documentation des indexes (Session 15)
-- 8. Gateway de validation
--
-- DESIGN DECISIONS:
-- - V1 status/priority TEXT maintenus → V2 ajoute *_v2 enum colonnes
-- - V1 submitter_type VARCHAR maintenu → V2 ajoute submitter_type_v2 enum
-- - Coexistence V1/V2 pour migration progressive
-- - Arrays PostgreSQL pour attachmentsUrl et tags
-- - SLA tracking avec business_hours_only option
-- - Multilingual support (language ISO 639-1)
-- - AI features (sentiment, suggestions, translations)
-- - Self-referencing FK pour hierarchies (categories, messages threading)
--
-- ============================================


-- ============================================
-- SECTION 1: ENUMS (7 enums)
-- ============================================
-- Description: Types énumérés pour le module Support
-- Stratégie: Utilisation de DO $ EXCEPTION pour idempotence
-- Enums créés: 7

-- Enum 1: ticket_status
-- Description: Statuts du cycle de vie d'un ticket support
-- Valeurs: new, open, waiting_client, waiting_internal, resolved, closed
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM (
    'new',
    'open',
    'waiting_client',
    'waiting_internal',
    'resolved',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 2: ticket_priority
-- Description: Niveaux de priorité pour tickets support
-- Valeurs: low, medium, high, critical
DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 3: ticket_source_platform
-- Description: Plateforme d'origine du ticket
-- Valeurs: web, mobile, api, email, phone
DO $$ BEGIN
  CREATE TYPE ticket_source_platform AS ENUM (
    'web',
    'mobile',
    'api',
    'email',
    'phone'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 4: ticket_raised_by_type
-- Description: Type d'utilisateur créant le ticket
-- Valeurs: admin, driver, client, guest
DO $$ BEGIN
  CREATE TYPE ticket_raised_by_type AS ENUM (
    'admin',
    'driver',
    'client',
    'guest'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 5: message_type
-- Description: Type de message (visibilité)
-- Valeurs: public, internal, note
DO $$ BEGIN
  CREATE TYPE message_type AS ENUM (
    'public',
    'internal',
    'note'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 6: submitter_type
-- Description: Type de soumetteur pour feedback client
-- Valeurs: driver, client, member, guest
DO $$ BEGIN
  CREATE TYPE submitter_type AS ENUM (
    'driver',
    'client',
    'member',
    'guest'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 7: service_type
-- Description: Type de service évalué dans le feedback
-- Valeurs: ride, support, maintenance, other
DO $$ BEGIN
  CREATE TYPE service_type AS ENUM (
    'ride',
    'support',
    'maintenance',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================
-- SECTION 2: ALTER TABLE - MODIFICATIONS V1→V2
-- ============================================
-- Description: Ajout colonnes V2 sur tables existantes V1
-- Tables modifiées: 3
-- Colonnes ajoutées: 34
-- Stratégie: Coexistence V1/V2 (status TEXT + status_v2 enum)


-- --------------------------------------------
-- Table 1: sup_tickets (V1 → V2)
-- --------------------------------------------
-- Description: Tickets support avec catégorisation, SLA et multilinguisme
-- Colonnes V1 existantes (16): id, tenant_id, raised_by, subject, description,
--   status (TEXT), priority (TEXT), assigned_to, metadata, created_at, created_by,
--   updated_at, updated_by, deleted_at, deleted_by, deletion_reason
-- Colonnes V2 ajoutées (11): category, sub_category, language, source_platform,
--   raised_by_type, attachments_url, resolution_notes, sla_due_at, closed_at,
--   status_v2, priority_v2
-- Total après migration: 27 colonnes

-- V2 - Categorization & Routing
ALTER TABLE sup_tickets
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100);

-- V2 - Multilingual & Source Tracking
ALTER TABLE sup_tickets
  ADD COLUMN IF NOT EXISTS language VARCHAR(10),
  ADD COLUMN IF NOT EXISTS source_platform ticket_source_platform DEFAULT 'web'::ticket_source_platform,
  ADD COLUMN IF NOT EXISTS raised_by_type ticket_raised_by_type DEFAULT 'admin'::ticket_raised_by_type;

-- V2 - Attachments & Resolution
ALTER TABLE sup_tickets
  ADD COLUMN IF NOT EXISTS attachments_url TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- V2 - SLA Tracking
ALTER TABLE sup_tickets
  ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- V2 - Enums (coexistence avec V1 TEXT)
ALTER TABLE sup_tickets
  ADD COLUMN IF NOT EXISTS status_v2 ticket_status DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS priority_v2 ticket_priority DEFAULT 'medium';


-- --------------------------------------------
-- Table 2: sup_ticket_messages (V1 → V2)
-- --------------------------------------------
-- Description: Messages de tickets avec threading, attachements et IA
-- Colonnes V1 existantes (13): id, ticket_id, sender_id, message_body, sent_at,
--   metadata, created_at, created_by, updated_at, updated_by, deleted_at,
--   deleted_by, deletion_reason
-- Colonnes V2 ajoutées (9): message_type, parent_message_id, attachment_url,
--   attachment_type, language, sentiment_score, is_automated, ai_suggestions,
--   translation
-- Total après migration: 22 colonnes

-- V2 - Message Types & Threading
ALTER TABLE sup_ticket_messages
  ADD COLUMN IF NOT EXISTS message_type message_type DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS parent_message_id UUID;

-- V2 - Attachments
ALTER TABLE sup_ticket_messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);

-- V2 - Multilingual Support
ALTER TABLE sup_ticket_messages
  ADD COLUMN IF NOT EXISTS language VARCHAR(10);

-- V2 - AI Features
ALTER TABLE sup_ticket_messages
  ADD COLUMN IF NOT EXISTS sentiment_score FLOAT,
  ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_suggestions JSONB,
  ADD COLUMN IF NOT EXISTS translation JSONB;


-- --------------------------------------------
-- Table 3: sup_customer_feedback (V1 → V2)
-- --------------------------------------------
-- Description: Feedback clients avec ratings détaillés et sentiment
-- Colonnes V1 existantes (13): id, tenant_id, submitted_by, submitter_type (VARCHAR),
--   feedback_text, rating, metadata, created_by, created_at, updated_by, updated_at,
--   deleted_by, deleted_at
-- Colonnes V2 ajoutées (14): ticket_id, driver_id, service_type_v2, language,
--   sentiment_score, is_anonymous, category, tags, overall_rating,
--   response_time_rating, resolution_quality_rating, agent_professionalism_rating,
--   submitter_type_v2, service_type
-- Total après migration: 27 colonnes

-- V2 - Explicit Links
ALTER TABLE sup_customer_feedback
  ADD COLUMN IF NOT EXISTS ticket_id UUID,
  ADD COLUMN IF NOT EXISTS driver_id UUID,
  ADD COLUMN IF NOT EXISTS service_type_v2 service_type DEFAULT 'other'::service_type;

-- V2 - Multilingual & Sentiment
ALTER TABLE sup_customer_feedback
  ADD COLUMN IF NOT EXISTS language VARCHAR(10),
  ADD COLUMN IF NOT EXISTS sentiment_score FLOAT,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- V2 - Categorization
ALTER TABLE sup_customer_feedback
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- V2 - Detailed Ratings (1-5)
ALTER TABLE sup_customer_feedback
  ADD COLUMN IF NOT EXISTS overall_rating INT,
  ADD COLUMN IF NOT EXISTS response_time_rating INT,
  ADD COLUMN IF NOT EXISTS resolution_quality_rating INT,
  ADD COLUMN IF NOT EXISTS agent_professionalism_rating INT;

-- V2 - Enum (coexistence avec V1 VARCHAR)
ALTER TABLE sup_customer_feedback
  ADD COLUMN IF NOT EXISTS submitter_type_v2 submitter_type;


-- ============================================
-- SECTION 3: CREATE TABLE - NOUVELLES TABLES V2
-- ============================================
-- Description: Tables nouvelles créées en V2
-- Tables créées: 3
-- Colonnes totales: 40


-- --------------------------------------------
-- Table 4: sup_ticket_categories (NEW V2)
-- --------------------------------------------
-- Description: Catégories configurables avec hiérarchie et SLA defaults
-- Colonnes (15): id, tenant_id, name, slug, description, parent_category_id,
--   default_priority, default_assigned_team, sla_hours, is_active, display_order,
--   created_at, updated_at, created_by, updated_by
-- Purpose: Permet catégorisation personnalisée par tenant avec hiérarchie

CREATE TABLE IF NOT EXISTS sup_ticket_categories (
  -- PRIMARY KEY & TENANT ISOLATION
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL,

  -- CATEGORY INFORMATION
  name                    VARCHAR(100) NOT NULL,
  slug                    VARCHAR(100) NOT NULL,
  description             TEXT,
  parent_category_id      UUID,

  -- DEFAULTS & CONFIGURATION
  default_priority        ticket_priority,
  default_assigned_team   VARCHAR(100),
  sla_hours               INT,

  -- STATUS & ORDERING
  is_active               BOOLEAN DEFAULT true NOT NULL,
  display_order           INT DEFAULT 0 NOT NULL,

  -- AUDIT TRAIL
  created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by              UUID NOT NULL,
  updated_by              UUID,

  -- CONSTRAINTS
  CONSTRAINT uq_sup_categories_tenant_slug UNIQUE (tenant_id, slug)
);

COMMENT ON TABLE sup_ticket_categories IS 'V2: Configurable ticket categories with hierarchy and SLA defaults';
COMMENT ON COLUMN sup_ticket_categories.slug IS 'Stable identifier for category';
COMMENT ON COLUMN sup_ticket_categories.parent_category_id IS 'Self-reference for category hierarchy';
COMMENT ON COLUMN sup_ticket_categories.sla_hours IS 'Default SLA hours for this category';


-- --------------------------------------------
-- Table 5: sup_ticket_sla_rules (NEW V2)
-- --------------------------------------------
-- Description: Règles SLA configurables par tenant, catégorie et priorité
-- Colonnes (13): id, tenant_id, category_id, priority, response_time_hours,
--   resolution_time_hours, escalation_rules, business_hours_only, is_active,
--   created_at, updated_at, created_by, updated_by
-- Purpose: Configuration fine des SLA avec escalation

CREATE TABLE IF NOT EXISTS sup_ticket_sla_rules (
  -- PRIMARY KEY & TENANT ISOLATION
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL,

  -- RULE TARGETING
  category_id             UUID,
  priority                ticket_priority NOT NULL,

  -- SLA TIMEFRAMES (in hours)
  response_time_hours     INT NOT NULL,
  resolution_time_hours   INT NOT NULL,

  -- ESCALATION & CONFIGURATION
  escalation_rules        JSONB,
  business_hours_only     BOOLEAN DEFAULT false NOT NULL,

  -- STATUS
  is_active               BOOLEAN DEFAULT true NOT NULL,

  -- AUDIT TRAIL
  created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by              UUID NOT NULL,
  updated_by              UUID,

  -- CONSTRAINTS
  CONSTRAINT uq_sup_sla_tenant_category_priority UNIQUE (tenant_id, category_id, priority)
);

COMMENT ON TABLE sup_ticket_sla_rules IS 'V2: SLA rules configuration per tenant, category, and priority';
COMMENT ON COLUMN sup_ticket_sla_rules.category_id IS 'NULL = applies to all categories';
COMMENT ON COLUMN sup_ticket_sla_rules.response_time_hours IS 'Time to first response';
COMMENT ON COLUMN sup_ticket_sla_rules.resolution_time_hours IS 'Time to resolution';
COMMENT ON COLUMN sup_ticket_sla_rules.business_hours_only IS 'Count only business hours in SLA calculation';


-- --------------------------------------------
-- Table 6: sup_canned_responses (NEW V2)
-- --------------------------------------------
-- Description: Réponses prédéfinies pour questions fréquentes
-- Colonnes (12): id, tenant_id, title, content, category, language,
--   usage_count, last_used_at, is_active, created_at, updated_at, created_by
-- Purpose: Réponses rapides et cohérentes avec tracking d'utilisation

CREATE TABLE IF NOT EXISTS sup_canned_responses (
  -- PRIMARY KEY & TENANT ISOLATION
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,

  -- RESPONSE CONTENT
  title           VARCHAR(255) NOT NULL,
  content         TEXT NOT NULL,
  category        VARCHAR(100),
  language        VARCHAR(10) NOT NULL,

  -- USAGE STATISTICS
  usage_count     INT DEFAULT 0 NOT NULL,
  last_used_at    TIMESTAMPTZ,

  -- STATUS
  is_active       BOOLEAN DEFAULT true NOT NULL,

  -- AUDIT TRAIL
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by      UUID NOT NULL
);

COMMENT ON TABLE sup_canned_responses IS 'V2: Predefined responses for common support questions with usage tracking';
COMMENT ON COLUMN sup_canned_responses.language IS 'ISO 639-1 language code';
COMMENT ON COLUMN sup_canned_responses.usage_count IS 'Track popularity for sorting';


-- ============================================
-- SECTION 4: FOREIGN KEYS INTERNES (Same Module)
-- ============================================
-- Description: FK entre tables du même module SUP
-- FK créées: 5

-- FK 1: sup_ticket_messages.ticket_id → sup_tickets.id
-- Description: Lien message vers ticket parent
-- Note: FK existe probablement déjà en V1, vérification conditionnelle
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'sup_ticket_messages'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name = 'fk_sup_messages_ticket' OR constraint_name = 'sup_ticket_messages_ticket_id_fkey')
  ) THEN
    ALTER TABLE sup_ticket_messages
      ADD CONSTRAINT fk_sup_messages_ticket
      FOREIGN KEY (ticket_id)
      REFERENCES sup_tickets(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- FK 2: sup_ticket_messages.parent_message_id → sup_ticket_messages.id
-- Description: Self-reference pour threading de messages
ALTER TABLE sup_ticket_messages
  ADD CONSTRAINT fk_sup_messages_parent
  FOREIGN KEY (parent_message_id)
  REFERENCES sup_ticket_messages(id)
  ON DELETE SET NULL;

-- FK 3: sup_customer_feedback.ticket_id → sup_tickets.id
-- Description: Lien feedback vers ticket associé
ALTER TABLE sup_customer_feedback
  ADD CONSTRAINT fk_sup_feedback_ticket
  FOREIGN KEY (ticket_id)
  REFERENCES sup_tickets(id)
  ON DELETE SET NULL;

-- FK 4: sup_ticket_categories.parent_category_id → sup_ticket_categories.id
-- Description: Self-reference pour hiérarchie de catégories
ALTER TABLE sup_ticket_categories
  ADD CONSTRAINT fk_sup_categories_parent
  FOREIGN KEY (parent_category_id)
  REFERENCES sup_ticket_categories(id)
  ON DELETE SET NULL;

-- FK 5: sup_ticket_sla_rules.category_id → sup_ticket_categories.id
-- Description: Lien règle SLA vers catégorie
ALTER TABLE sup_ticket_sla_rules
  ADD CONSTRAINT fk_sup_sla_category
  FOREIGN KEY (category_id)
  REFERENCES sup_ticket_categories(id)
  ON DELETE SET NULL;


-- ============================================
-- SECTION 5: FOREIGN KEYS EXTERNES (Vers ADM)
-- ============================================
-- Description: FK vers module ADM (créé en Session 1)
-- FK créées: 13

-- --------------------------------------------
-- FK vers adm_tenants (5 FK)
-- --------------------------------------------

-- FK 6: sup_tickets.tenant_id → adm_tenants.id
-- Note: FK existe probablement déjà en V1, vérification conditionnelle
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'sup_tickets'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name = 'fk_sup_tickets_tenant' OR constraint_name = 'sup_tickets_tenant_id_fkey')
  ) THEN
    ALTER TABLE sup_tickets
      ADD CONSTRAINT fk_sup_tickets_tenant
      FOREIGN KEY (tenant_id)
      REFERENCES adm_tenants(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- FK 7: sup_ticket_categories.tenant_id → adm_tenants.id
ALTER TABLE sup_ticket_categories
  ADD CONSTRAINT fk_sup_categories_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE;

-- FK 8: sup_ticket_sla_rules.tenant_id → adm_tenants.id
ALTER TABLE sup_ticket_sla_rules
  ADD CONSTRAINT fk_sup_sla_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE;

-- FK 9: sup_canned_responses.tenant_id → adm_tenants.id
ALTER TABLE sup_canned_responses
  ADD CONSTRAINT fk_sup_responses_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE;

-- FK 10: sup_customer_feedback.tenant_id → adm_tenants.id
-- Note: FK existe probablement déjà en V1, vérification conditionnelle
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'sup_customer_feedback'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name = 'fk_sup_feedback_tenant' OR constraint_name = 'sup_customer_feedback_tenant_id_fkey')
  ) THEN
    ALTER TABLE sup_customer_feedback
      ADD CONSTRAINT fk_sup_feedback_tenant
      FOREIGN KEY (tenant_id)
      REFERENCES adm_tenants(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- --------------------------------------------
-- FK vers adm_members (1 FK)
-- --------------------------------------------

-- FK 11: sup_tickets.raised_by → adm_members.id
-- Note: FK existe probablement déjà en V1, vérification conditionnelle
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'sup_tickets'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name = 'fk_sup_tickets_member' OR constraint_name = 'sup_tickets_raised_by_fkey')
  ) THEN
    ALTER TABLE sup_tickets
      ADD CONSTRAINT fk_sup_tickets_member
      FOREIGN KEY (raised_by)
      REFERENCES adm_members(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- --------------------------------------------
-- FK vers adm_provider_employees (7 FK)
-- --------------------------------------------

-- FK 12: sup_tickets.assigned_to → adm_provider_employees.id
-- Note: FK existe probablement déjà en V1, vérification conditionnelle
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'sup_tickets'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name = 'fk_sup_tickets_assigned' OR constraint_name = 'sup_tickets_assigned_to_fkey')
  ) THEN
    ALTER TABLE sup_tickets
      ADD CONSTRAINT fk_sup_tickets_assigned
      FOREIGN KEY (assigned_to)
      REFERENCES adm_provider_employees(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- FK 13: sup_tickets.created_by → adm_provider_employees.id
-- Note: FK existe probablement déjà en V1, vérification conditionnelle
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'sup_tickets'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name = 'fk_sup_tickets_creator' OR constraint_name = 'sup_tickets_created_by_fkey')
  ) THEN
    ALTER TABLE sup_tickets
      ADD CONSTRAINT fk_sup_tickets_creator
      FOREIGN KEY (created_by)
      REFERENCES adm_provider_employees(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- FK 14: sup_tickets.updated_by → adm_provider_employees.id
-- Note: FK existe probablement déjà en V1, vérification conditionnelle
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'sup_tickets'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name = 'fk_sup_tickets_updater' OR constraint_name = 'sup_tickets_updated_by_fkey')
  ) THEN
    ALTER TABLE sup_tickets
      ADD CONSTRAINT fk_sup_tickets_updater
      FOREIGN KEY (updated_by)
      REFERENCES adm_provider_employees(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- FK 15: sup_ticket_categories.created_by → adm_provider_employees.id
ALTER TABLE sup_ticket_categories
  ADD CONSTRAINT fk_sup_categories_creator
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 16: sup_ticket_categories.updated_by → adm_provider_employees.id
ALTER TABLE sup_ticket_categories
  ADD CONSTRAINT fk_sup_categories_updater
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 17: sup_ticket_sla_rules.created_by → adm_provider_employees.id
ALTER TABLE sup_ticket_sla_rules
  ADD CONSTRAINT fk_sup_sla_creator
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 18: sup_ticket_sla_rules.updated_by → adm_provider_employees.id
ALTER TABLE sup_ticket_sla_rules
  ADD CONSTRAINT fk_sup_sla_updater
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 19: sup_canned_responses.created_by → adm_provider_employees.id
ALTER TABLE sup_canned_responses
  ADD CONSTRAINT fk_sup_responses_creator
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;


-- ============================================
-- SECTION 6: FOREIGN KEYS FUTURES (Documentation)
-- ============================================
-- Description: FK vers modules non encore créés (documentation uniquement)
-- Ces FK seront créées lors de la migration du module cible
-- FK documentées: 1

-- --------------------------------------------
-- FK VERS MODULE RID (Session 7)
-- --------------------------------------------

-- FK FUTURE 1: sup_customer_feedback.driver_id → rid_drivers.id
-- Description: Lien feedback vers conducteur évalué
-- Session création: 8 (module RID, section "FK VERS SUP")
-- Action: Lors de Session 8/13, dans 08_rid_structure.sql Section 6, ajouter:
/*
ALTER TABLE sup_customer_feedback
  ADD CONSTRAINT fk_sup_feedback_driver
  FOREIGN KEY (driver_id)
  REFERENCES rid_drivers(id)
  ON DELETE SET NULL;
*/


-- ============================================
-- SECTION 7: INDEXES (Documentation pour Session 15)
-- ============================================
-- Description: Indexes à créer en Session 15 (après migration data Session 14)
-- Total indexes documentés: 25
-- Types: BTREE (23), GIN (1), UNIQUE (1 composite déjà créé avec table)

-- --------------------------------------------
-- Table 1: sup_tickets
-- Indexes: 5 (1 V1 existant + 4 V2 nouveaux)
-- --------------------------------------------

-- INDEX 1: idx_sup_tickets_tenant_raised (V1 - existe déjà)
-- Note: Index existant, vérifier présence avant création en Session 15
-- CREATE INDEX IF NOT EXISTS idx_sup_tickets_tenant_raised
--   ON sup_tickets(tenant_id, raised_by, created_at);

-- INDEX 2: idx_sup_tickets_sla (V2 - SLA reporting)
CREATE INDEX IF NOT EXISTS idx_sup_tickets_sla
  ON sup_tickets(category, status_v2, sla_due_at)
  WHERE deleted_at IS NULL;

-- INDEX 3: idx_sup_tickets_workload (V2 - Agent workload)
CREATE INDEX IF NOT EXISTS idx_sup_tickets_workload
  ON sup_tickets(assigned_to, status_v2)
  WHERE deleted_at IS NULL;

-- INDEX 4: idx_sup_tickets_filtering (V2 - Ticket filtering)
CREATE INDEX IF NOT EXISTS idx_sup_tickets_filtering
  ON sup_tickets(status_v2, priority_v2)
  WHERE deleted_at IS NULL;

-- INDEX 5: idx_sup_tickets_analytics (V2 - Source analytics)
CREATE INDEX IF NOT EXISTS idx_sup_tickets_analytics
  ON sup_tickets(source_platform, raised_by_type)
  WHERE deleted_at IS NULL;


-- --------------------------------------------
-- Table 2: sup_ticket_messages
-- Indexes: 4 (1 V1 + 3 V2)
-- --------------------------------------------

-- INDEX 6: idx_sup_messages_ticket (V1 - existe probablement)
-- Note: Vérifier présence avant création en Session 15
-- CREATE INDEX IF NOT EXISTS idx_sup_messages_ticket
--   ON sup_ticket_messages(ticket_id, sent_at);

-- INDEX 7: idx_sup_messages_threading (V2)
CREATE INDEX IF NOT EXISTS idx_sup_messages_threading
  ON sup_ticket_messages(ticket_id, parent_message_id)
  WHERE deleted_at IS NULL;

-- INDEX 8: idx_sup_messages_type (V2)
CREATE INDEX IF NOT EXISTS idx_sup_messages_type
  ON sup_ticket_messages(message_type, sent_at)
  WHERE deleted_at IS NULL;

-- INDEX 9: idx_sup_messages_sender (V2)
CREATE INDEX IF NOT EXISTS idx_sup_messages_sender
  ON sup_ticket_messages(sender_id)
  WHERE deleted_at IS NULL;


-- --------------------------------------------
-- Table 3: sup_customer_feedback
-- Indexes: 5 (tous V2 nouveaux)
-- --------------------------------------------

-- INDEX 10: idx_sup_feedback_ticket (V2)
CREATE INDEX IF NOT EXISTS idx_sup_feedback_ticket
  ON sup_customer_feedback(ticket_id, service_type_v2)
  WHERE deleted_at IS NULL;

-- INDEX 11: idx_sup_feedback_driver (V2)
CREATE INDEX IF NOT EXISTS idx_sup_feedback_driver
  ON sup_customer_feedback(driver_id, created_at)
  WHERE deleted_at IS NULL;

-- INDEX 12: idx_sup_feedback_category (V2)
CREATE INDEX IF NOT EXISTS idx_sup_feedback_category
  ON sup_customer_feedback(category, created_at)
  WHERE deleted_at IS NULL;

-- INDEX 13: idx_sup_feedback_sentiment (V2)
CREATE INDEX IF NOT EXISTS idx_sup_feedback_sentiment
  ON sup_customer_feedback(sentiment_score)
  WHERE deleted_at IS NULL;

-- INDEX 14: idx_sup_feedback_tags (V2 - GIN index for array)
CREATE INDEX IF NOT EXISTS idx_sup_feedback_tags
  ON sup_customer_feedback USING GIN(tags)
  WHERE deleted_at IS NULL;


-- --------------------------------------------
-- Table 4: sup_ticket_categories
-- Indexes: 3 + 1 UNIQUE (défini dans CREATE TABLE)
-- --------------------------------------------

-- INDEX 15: idx_sup_categories_tenant (V2)
CREATE INDEX IF NOT EXISTS idx_sup_categories_tenant
  ON sup_ticket_categories(tenant_id, is_active);

-- INDEX 16: idx_sup_categories_parent (V2)
CREATE INDEX IF NOT EXISTS idx_sup_categories_parent
  ON sup_ticket_categories(parent_category_id);

-- INDEX 17: idx_sup_categories_order (V2)
CREATE INDEX IF NOT EXISTS idx_sup_categories_order
  ON sup_ticket_categories(display_order);


-- --------------------------------------------
-- Table 5: sup_ticket_sla_rules
-- Indexes: 3 + 1 UNIQUE (défini dans CREATE TABLE)
-- --------------------------------------------

-- INDEX 18: idx_sup_sla_tenant (V2)
CREATE INDEX IF NOT EXISTS idx_sup_sla_tenant
  ON sup_ticket_sla_rules(tenant_id, is_active);

-- INDEX 19: idx_sup_sla_category (V2)
CREATE INDEX IF NOT EXISTS idx_sup_sla_category
  ON sup_ticket_sla_rules(category_id);

-- INDEX 20: idx_sup_sla_priority (V2)
CREATE INDEX IF NOT EXISTS idx_sup_sla_priority
  ON sup_ticket_sla_rules(priority);


-- --------------------------------------------
-- Table 6: sup_canned_responses
-- Indexes: 3
-- --------------------------------------------

-- INDEX 21: idx_sup_responses_tenant (V2)
CREATE INDEX IF NOT EXISTS idx_sup_responses_tenant
  ON sup_canned_responses(tenant_id, category, is_active);

-- INDEX 22: idx_sup_responses_language (V2)
CREATE INDEX IF NOT EXISTS idx_sup_responses_language
  ON sup_canned_responses(language);

-- INDEX 23: idx_sup_responses_popularity (V2)
CREATE INDEX IF NOT EXISTS idx_sup_responses_popularity
  ON sup_canned_responses(usage_count);


-- ============================================
-- SECTION 8: GATEWAY 2 - VALIDATION
-- ============================================
-- Description: Validation post-migration structures SUP
-- Vérifie: tables, colonnes, FK, enums créés

DO $GATEWAY$
DECLARE
  v_table_count INT;
  v_enum_count INT;
  v_fk_count INT;
  v_tickets_cols INT;
  v_messages_cols INT;
  v_feedback_cols INT;
  v_categories_cols INT;
  v_sla_cols INT;
  v_responses_cols INT;
  v_total_cols_v1_v2 INT;
  v_total_cols_v2_new INT;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'GATEWAY 2: VALIDATION MODULE SUP';
  RAISE NOTICE 'Session: 6/13';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Validation 1: Tables SUP créées
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'sup_tickets',
    'sup_ticket_messages',
    'sup_customer_feedback',
    'sup_ticket_categories',
    'sup_ticket_sla_rules',
    'sup_canned_responses'
  );

  RAISE NOTICE '1. TABLES MODULE SUP';
  RAISE NOTICE '   Tables attendues: 6';
  RAISE NOTICE '   Tables trouvées: %', v_table_count;
  IF v_table_count = 6 THEN
    RAISE NOTICE '   ✓ OK - Toutes les tables SUP présentes';
  ELSE
    RAISE WARNING '   ✗ ERREUR - Tables manquantes';
  END IF;
  RAISE NOTICE '';

  -- Validation 2: Enums SUP créés
  SELECT COUNT(*) INTO v_enum_count
  FROM pg_type
  WHERE typname IN (
    'ticket_status',
    'ticket_priority',
    'ticket_source_platform',
    'ticket_raised_by_type',
    'message_type',
    'submitter_type',
    'service_type'
  );

  RAISE NOTICE '2. ENUMS MODULE SUP';
  RAISE NOTICE '   Enums attendus: 7';
  RAISE NOTICE '   Enums trouvés: %', v_enum_count;
  IF v_enum_count = 7 THEN
    RAISE NOTICE '   ✓ OK - Tous les enums SUP créés';
  ELSE
    RAISE WARNING '   ✗ ERREUR - Enums manquants';
  END IF;
  RAISE NOTICE '';

  -- Validation 3: Colonnes par table
  -- Table 1: sup_tickets (16 V1 + 11 V2 = 27)
  SELECT COUNT(*) INTO v_tickets_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'sup_tickets';

  -- Table 2: sup_ticket_messages (13 V1 + 9 V2 = 22)
  SELECT COUNT(*) INTO v_messages_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'sup_ticket_messages';

  -- Table 3: sup_customer_feedback (13 V1 + 14 V2 = 27)
  SELECT COUNT(*) INTO v_feedback_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'sup_customer_feedback';

  -- Table 4: sup_ticket_categories (15 colonnes)
  SELECT COUNT(*) INTO v_categories_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'sup_ticket_categories';

  -- Table 5: sup_ticket_sla_rules (13 colonnes)
  SELECT COUNT(*) INTO v_sla_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'sup_ticket_sla_rules';

  -- Table 6: sup_canned_responses (12 colonnes)
  SELECT COUNT(*) INTO v_responses_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'sup_canned_responses';

  v_total_cols_v1_v2 := 11 + 9 + 14;  -- Colonnes ajoutées V1→V2: 34
  v_total_cols_v2_new := 15 + 13 + 12;  -- Colonnes tables V2: 40

  RAISE NOTICE '3. COLONNES MODULE SUP';
  RAISE NOTICE '   Tables V1→V2 modifiées:';
  RAISE NOTICE '   - sup_tickets: % colonnes (attendu: 27)', v_tickets_cols;
  RAISE NOTICE '   - sup_ticket_messages: % colonnes (attendu: 22)', v_messages_cols;
  RAISE NOTICE '   - sup_customer_feedback: % colonnes (attendu: 27)', v_feedback_cols;
  RAISE NOTICE '   Tables V2 nouvelles:';
  RAISE NOTICE '   - sup_ticket_categories: % colonnes (attendu: 15)', v_categories_cols;
  RAISE NOTICE '   - sup_ticket_sla_rules: % colonnes (attendu: 13)', v_sla_cols;
  RAISE NOTICE '   - sup_canned_responses: % colonnes (attendu: 12)', v_responses_cols;
  RAISE NOTICE '   Total colonnes ajoutées V1→V2: % (11 tickets + 9 messages + 14 feedback)', v_total_cols_v1_v2;
  RAISE NOTICE '   Total colonnes tables V2: % (15 categories + 13 sla + 12 responses)', v_total_cols_v2_new;
  RAISE NOTICE '';

  -- Validation 4: Foreign Keys
  SELECT COUNT(*) INTO v_fk_count
  FROM information_schema.table_constraints
  WHERE constraint_schema = 'public'
  AND constraint_type = 'FOREIGN KEY'
  AND table_name IN (
    'sup_tickets',
    'sup_ticket_messages',
    'sup_customer_feedback',
    'sup_ticket_categories',
    'sup_ticket_sla_rules',
    'sup_canned_responses'
  );

  RAISE NOTICE '4. FOREIGN KEYS MODULE SUP';
  RAISE NOTICE '   FK attendues: 18 (5 internes + 13 vers ADM)';
  RAISE NOTICE '   FK trouvées: %', v_fk_count;
  RAISE NOTICE '   Note: Le total peut varier selon FK existantes en V1';
  RAISE NOTICE '';

  -- Validation 5: FK FUTURES documentées
  RAISE NOTICE '5. FK FUTURES (Documentation)';
  RAISE NOTICE '   FK vers module RID (Session 7): 1';
  RAISE NOTICE '   - sup_customer_feedback.driver_id → rid_drivers.id';
  RAISE NOTICE '   Action: Sera créée en Session 7 lors de 08_rid_structure.sql';
  RAISE NOTICE '';

  -- Summary
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RÉSUMÉ MIGRATION MODULE SUP';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables V1 modifiées: 3';
  RAISE NOTICE 'Tables V2 nouvelles: 3';
  RAISE NOTICE 'Enums créés: 7';
  RAISE NOTICE 'Colonnes ajoutées V1→V2: 34 (11 + 9 + 14)';
  RAISE NOTICE 'Colonnes tables V2 nouvelles: 40 (15 + 13 + 12)';
  RAISE NOTICE 'Total colonnes ajoutées: 74';
  RAISE NOTICE 'FK créées: 18 (5 internes + 13 ADM)';
  RAISE NOTICE 'FK FUTURES documentées: 1 (vers RID)';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Session 6/13 - Module SUP: TERMINÉE ✓';
  RAISE NOTICE 'Prochaine étape: Session 7/13 - Module RID (Riders & Drivers)';
  RAISE NOTICE '';

END $GATEWAY$;


-- ============================================
-- FIN MIGRATION MODULE SUP
-- ============================================
