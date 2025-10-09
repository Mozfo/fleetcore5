-- =====================================================
-- Migration CRM Simplifiée: Suppression tenant_id uniquement
-- Date: 2025-10-09
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CRM_LEADS
-- =====================================================

-- Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS temp_allow_all_crm_leads ON crm_leads;
DROP POLICY IF EXISTS tenant_isolation_crm_leads ON crm_leads;

-- Supprimer les index liés à tenant_id
DROP INDEX IF EXISTS crm_leads_tenant_id_idx;

-- Supprimer la contrainte FK tenant_id
ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_tenant_id_fkey;

-- Supprimer la colonne tenant_id
ALTER TABLE crm_leads DROP COLUMN IF EXISTS tenant_id;

-- Renommer colonnes pour correspondre au schéma Prisma
ALTER TABLE crm_leads RENAME COLUMN contact_name TO full_name;
ALTER TABLE crm_leads RENAME COLUMN contact_email TO email;
ALTER TABLE crm_leads RENAME COLUMN contact_phone TO phone;
ALTER TABLE crm_leads RENAME COLUMN company_name TO demo_company_name;
ALTER TABLE crm_leads RENAME COLUMN notes TO message;

-- Ajouter nouvelles colonnes
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS fleet_size VARCHAR(50);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS current_software VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS qualification_score INTEGER;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS qualification_notes TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS qualified_date TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS converted_date TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Index unique sur email (soft-delete aware)
DROP INDEX IF EXISTS crm_leads_contact_email_idx;
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_email_unique_active
  ON crm_leads(email) WHERE deleted_at IS NULL;

-- Nouveaux index
CREATE INDEX IF NOT EXISTS crm_leads_assigned_to_idx ON crm_leads(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_leads_country_code_idx ON crm_leads(country_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_leads_deleted_at_idx ON crm_leads(deleted_at);

-- RLS temporaire pour développement
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY temp_allow_all_crm_leads_dev
  ON crm_leads FOR ALL
  USING (true) WITH CHECK (true);

-- =====================================================
-- 2. CRM_OPPORTUNITIES
-- =====================================================

DROP POLICY IF EXISTS temp_allow_all_crm_opportunities ON crm_opportunities;
DROP POLICY IF EXISTS tenant_isolation_crm_opportunities ON crm_opportunities;

DROP INDEX IF EXISTS crm_opportunities_tenant_id_idx;
ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_tenant_id_fkey;
ALTER TABLE crm_opportunities DROP COLUMN IF EXISTS tenant_id;

-- Renommer colonne
ALTER TABLE crm_opportunities RENAME COLUMN opportunity_stage TO stage;

-- Ajouter nouvelles colonnes
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS probability INTEGER;

ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY temp_allow_all_crm_opportunities_dev
  ON crm_opportunities FOR ALL
  USING (true) WITH CHECK (true);

-- =====================================================
-- 3. CRM_CONTRACTS
-- =====================================================

DROP POLICY IF EXISTS temp_allow_all_crm_contracts ON crm_contracts;
DROP POLICY IF EXISTS tenant_isolation_crm_contracts ON crm_contracts;

DROP INDEX IF EXISTS crm_contracts_tenant_id_idx;
ALTER TABLE crm_contracts DROP CONSTRAINT IF EXISTS crm_contracts_tenant_id_fkey;
ALTER TABLE crm_contracts DROP COLUMN IF EXISTS tenant_id;

-- Renommer colonne client_id en lead_id
ALTER TABLE crm_contracts RENAME COLUMN client_id TO lead_id;

-- Ajouter opportunity_id
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS opportunity_id UUID;

-- FK vers opportunity
ALTER TABLE crm_contracts
  ADD CONSTRAINT crm_contracts_opportunity_id_fkey
  FOREIGN KEY (opportunity_id)
  REFERENCES crm_opportunities(id)
  ON DELETE SET NULL;

ALTER TABLE crm_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY temp_allow_all_crm_contracts_dev
  ON crm_contracts FOR ALL
  USING (true) WITH CHECK (true);

-- =====================================================
-- 4. Triggers updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_crm_leads_updated_at ON crm_leads;
CREATE TRIGGER set_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_crm_opportunities_updated_at ON crm_opportunities;
CREATE TRIGGER set_crm_opportunities_updated_at
  BEFORE UPDATE ON crm_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_crm_contracts_updated_at ON crm_contracts;
CREATE TRIGGER set_crm_contracts_updated_at
  BEFORE UPDATE ON crm_contracts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMIT;
