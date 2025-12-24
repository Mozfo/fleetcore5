-- =============================================================================
-- MIGRATION: Quote-to-Cash Part 1 - Corrections de Conformite
-- Date: 2025-12-11
-- Description: Ajout des colonnes manquantes identifiees dans l'audit
-- =============================================================================

BEGIN;

-- =============================================================================
-- ETAPE 1: ENUM order_fulfillment_status (deja present - verification)
-- =============================================================================
-- 'expired' est deja present dans l'enum - SKIP

-- =============================================================================
-- ETAPE 2: TABLE crm_quotes - Colonnes manquantes
-- =============================================================================

-- Colonnes tracking temporel
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMPTZ;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

-- Colonnes document
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS document_generated_at TIMESTAMPTZ;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;

-- Colonne public access (pour lien partageable)
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS public_token VARCHAR(64);

-- Colonnes calculated (pas GENERATED, calculees par le code)
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS total_value DECIMAL(18,2) DEFAULT 0;

-- Index manquants crm_quotes
CREATE INDEX IF NOT EXISTS idx_crm_quotes_valid_until
  ON crm_quotes(valid_until) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_quotes_parent_quote_id
  ON crm_quotes(parent_quote_id) WHERE parent_quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_quotes_created_by
  ON crm_quotes(created_by);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_quotes_public_token
  ON crm_quotes(public_token) WHERE public_token IS NOT NULL;

-- FK manquantes crm_quotes (ignorer si existe deja)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_crm_quotes_parent_quote'
  ) THEN
    ALTER TABLE crm_quotes
      ADD CONSTRAINT fk_crm_quotes_parent_quote
      FOREIGN KEY (parent_quote_id) REFERENCES crm_quotes(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_crm_quotes_converted_order'
  ) THEN
    ALTER TABLE crm_quotes
      ADD CONSTRAINT fk_crm_quotes_converted_order
      FOREIGN KEY (converted_to_order_id) REFERENCES crm_orders(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================================
-- ETAPE 3: TABLE crm_quote_items - Colonnes manquantes
-- =============================================================================

-- Colonnes FK optionnelles
ALTER TABLE crm_quote_items ADD COLUMN IF NOT EXISTS addon_id UUID;
ALTER TABLE crm_quote_items ADD COLUMN IF NOT EXISTS service_id UUID;

-- Colonnes calculated
ALTER TABLE crm_quote_items ADD COLUMN IF NOT EXISTS line_discount_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE crm_quote_items ADD COLUMN IF NOT EXISTS line_total DECIMAL(15,2) DEFAULT 0;

-- Index manquant
CREATE INDEX IF NOT EXISTS idx_crm_quote_items_plan_id
  ON crm_quote_items(plan_id) WHERE plan_id IS NOT NULL;

-- FK vers bil_billing_plans (ignorer si existe deja)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_crm_quote_items_plan'
  ) THEN
    ALTER TABLE crm_quote_items
      ADD CONSTRAINT fk_crm_quote_items_plan
      FOREIGN KEY (plan_id) REFERENCES bil_billing_plans(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================================
-- ETAPE 4: TABLE crm_agreements - Colonnes manquantes
-- =============================================================================

-- Signature details
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS provider_envelope_url TEXT;
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS client_signatory_title VARCHAR(100);
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS client_signature_ip INET;
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS provider_signatory_name VARCHAR(200);
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS provider_signatory_title VARCHAR(100);

-- Legal terms
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20);
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS governing_law VARCHAR(100);
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(200);
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS custom_clauses JSONB DEFAULT '[]';

-- Tracking
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE crm_agreements ADD COLUMN IF NOT EXISTS sent_for_signature_at TIMESTAMPTZ;

-- Index manquants crm_agreements
CREATE INDEX IF NOT EXISTS idx_crm_agreements_effective_date
  ON crm_agreements(effective_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_agreements_expiry_date
  ON crm_agreements(expiry_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_agreements_provider_envelope_id
  ON crm_agreements(provider_envelope_id) WHERE provider_envelope_id IS NOT NULL;

-- FK manquantes crm_agreements (ignorer si existe deja)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_crm_agreements_parent'
  ) THEN
    ALTER TABLE crm_agreements
      ADD CONSTRAINT fk_crm_agreements_parent
      FOREIGN KEY (parent_agreement_id) REFERENCES crm_agreements(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_crm_agreements_signatory'
  ) THEN
    ALTER TABLE crm_agreements
      ADD CONSTRAINT fk_crm_agreements_signatory
      FOREIGN KEY (provider_signatory_id) REFERENCES adm_provider_employees(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================================
-- ETAPE 5: TABLE crm_orders - Index manquants
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_crm_orders_subscription_id
  ON crm_orders(subscription_id) WHERE subscription_id IS NOT NULL;

-- Unique index sur order_reference (ignorer si existe deja)
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_orders_reference_unique
  ON crm_orders(order_reference) WHERE order_reference IS NOT NULL AND deleted_at IS NULL;

COMMIT;

-- =============================================================================
-- VERIFICATION: Compter les nouvelles colonnes
-- =============================================================================
-- SELECT


-- SELECT
--   'crm_quote_items' as table_name,
--   COUNT(*) as column_count
-- FROM information_schema.columns
-- WHERE table_name = 'crm_quote_items'
-- UNION ALL
-- SELECT
--   'crm_agreements' as table_name,
--   COUNT(*) as column_count
-- FROM information_schema.columns
-- WHERE table_name = 'crm_agreements';
