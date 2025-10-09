-- =====================================================
-- Migration: Correction des tables CRM internes FleetCore
-- Date: 2025-10-09
-- Description: Suppression tenant_id, ajout colonnes métier,
--              RLS pour accès provider_staff uniquement
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CRM_LEADS - Table interne FleetCore
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

-- Renommer/Ajouter colonnes selon nouvelle spec
ALTER TABLE crm_leads RENAME COLUMN contact_name TO full_name;
ALTER TABLE crm_leads RENAME COLUMN contact_email TO email;
ALTER TABLE crm_leads RENAME COLUMN contact_phone TO phone;
ALTER TABLE crm_leads RENAME COLUMN company_name TO demo_company_name;

-- Ajouter nouvelles colonnes
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS fleet_size VARCHAR(50);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS current_software VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS qualification_score INTEGER CHECK (qualification_score >= 0 AND qualification_score <= 100);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS qualification_notes TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS qualified_date TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS converted_date TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Ajouter champs d'audit manquants
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Créer type ENUM pour status si n'existe pas
DO $$ BEGIN
    CREATE TYPE crm_lead_status AS ENUM ('new', 'contacted', 'qualified', 'disqualified', 'converted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Modifier colonne status pour utiliser l'ENUM
-- Note: status est déjà VARCHAR, on cast explicitement
ALTER TABLE crm_leads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE crm_leads ALTER COLUMN status TYPE crm_lead_status USING (
  CASE status
    WHEN 'new' THEN 'new'::crm_lead_status
    WHEN 'contacted' THEN 'contacted'::crm_lead_status
    WHEN 'qualified' THEN 'qualified'::crm_lead_status
    WHEN 'disqualified' THEN 'disqualified'::crm_lead_status
    WHEN 'converted' THEN 'converted'::crm_lead_status
    ELSE 'new'::crm_lead_status
  END
);
ALTER TABLE crm_leads ALTER COLUMN status SET DEFAULT 'new'::crm_lead_status;

-- Créer index unique sur email (soft-delete aware)
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_email_unique_active
  ON crm_leads(email)
  WHERE deleted_at IS NULL;

-- Index sur assigned_to et status
CREATE INDEX IF NOT EXISTS crm_leads_assigned_to_idx ON crm_leads(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_leads_status_idx ON crm_leads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_leads_country_code_idx ON crm_leads(country_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_leads_created_at_idx ON crm_leads(created_at DESC);

-- FK vers assigned_to (adm_provider_employees ou adm_members)
-- Note: On laisse la FK nullable car le lead peut ne pas être assigné initialement
ALTER TABLE crm_leads
  ADD CONSTRAINT crm_leads_assigned_to_fkey
  FOREIGN KEY (assigned_to)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- Activer RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- Politique RLS: Accès uniquement pour provider_staff
CREATE POLICY provider_staff_access_crm_leads
  ON crm_leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM adm_provider_employees
      WHERE id = (current_setting('app.current_user_id', true))::uuid
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM adm_provider_employees
      WHERE id = (current_setting('app.current_user_id', true))::uuid
        AND status = 'active'
        AND deleted_at IS NULL
    )
  );

-- Politique temporaire pour développement (à supprimer en production)
CREATE POLICY temp_allow_all_crm_leads_dev
  ON crm_leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY temp_allow_all_crm_leads_dev ON crm_leads IS
  'DEVELOPMENT ONLY - Remove in production';

-- =====================================================
-- 2. CRM_OPPORTUNITIES - Table interne FleetCore
-- =====================================================

-- Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS temp_allow_all_crm_opportunities ON crm_opportunities;
DROP POLICY IF EXISTS tenant_isolation_crm_opportunities ON crm_opportunities;

-- Supprimer les index liés à tenant_id
DROP INDEX IF EXISTS crm_opportunities_tenant_id_idx;

-- Supprimer la contrainte FK tenant_id
ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_tenant_id_fkey;

-- Supprimer la colonne tenant_id
ALTER TABLE crm_opportunities DROP COLUMN IF EXISTS tenant_id;

-- Ajouter nouvelles colonnes
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS stage VARCHAR(50) DEFAULT 'prospect';
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS expected_value DECIMAL(15,2);
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS close_date DATE;
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS probability INTEGER CHECK (probability >= 0 AND probability <= 100);
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Ajouter champs d'audit manquants
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Créer type ENUM pour stage
DO $$ BEGIN
    CREATE TYPE crm_opportunity_stage AS ENUM ('prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Modifier colonne stage pour utiliser l'ENUM
ALTER TABLE crm_opportunities ALTER COLUMN stage TYPE crm_opportunity_stage USING (
  CASE stage
    WHEN 'prospect' THEN 'prospect'::crm_opportunity_stage
    WHEN 'proposal' THEN 'proposal'::crm_opportunity_stage
    WHEN 'negotiation' THEN 'negotiation'::crm_opportunity_stage
    WHEN 'closed_won' THEN 'closed_won'::crm_opportunity_stage
    WHEN 'closed_lost' THEN 'closed_lost'::crm_opportunity_stage
    ELSE 'prospect'::crm_opportunity_stage
  END
);

-- FK vers lead_id
ALTER TABLE crm_opportunities
  ADD CONSTRAINT crm_opportunities_lead_id_fkey
  FOREIGN KEY (lead_id)
  REFERENCES crm_leads(id)
  ON DELETE CASCADE;

-- FK vers assigned_to
ALTER TABLE crm_opportunities
  ADD CONSTRAINT crm_opportunities_assigned_to_fkey
  FOREIGN KEY (assigned_to)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS crm_opportunities_lead_id_idx ON crm_opportunities(lead_id);
CREATE INDEX IF NOT EXISTS crm_opportunities_stage_idx ON crm_opportunities(stage) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_opportunities_assigned_to_idx ON crm_opportunities(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_opportunities_close_date_idx ON crm_opportunities(close_date);

-- Activer RLS
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;

-- Politique RLS: Accès uniquement pour provider_staff
CREATE POLICY provider_staff_access_crm_opportunities
  ON crm_opportunities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM adm_provider_employees
      WHERE id = (current_setting('app.current_user_id', true))::uuid
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM adm_provider_employees
      WHERE id = (current_setting('app.current_user_id', true))::uuid
        AND status = 'active'
        AND deleted_at IS NULL
    )
  );

-- Politique temporaire pour développement
CREATE POLICY temp_allow_all_crm_opportunities_dev
  ON crm_opportunities
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. CRM_CONTRACTS - Table interne FleetCore
-- =====================================================

-- Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS temp_allow_all_crm_contracts ON crm_contracts;
DROP POLICY IF EXISTS tenant_isolation_crm_contracts ON crm_contracts;

-- Supprimer les index liés à tenant_id
DROP INDEX IF EXISTS crm_contracts_tenant_id_idx;

-- Supprimer la contrainte FK tenant_id
ALTER TABLE crm_contracts DROP CONSTRAINT IF EXISTS crm_contracts_tenant_id_fkey;

-- Supprimer la colonne tenant_id
ALTER TABLE crm_contracts DROP COLUMN IF EXISTS tenant_id;

-- Ajouter nouvelles colonnes
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS opportunity_id UUID;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS contract_reference VARCHAR(100);
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS contract_date DATE;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS total_value DECIMAL(15,2);
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS currency CHAR(3) DEFAULT 'EUR';
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Ajouter champs d'audit manquants
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE crm_contracts ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Créer type ENUM pour status
DO $$ BEGIN
    CREATE TYPE crm_contract_status AS ENUM ('draft', 'pending_signature', 'active', 'suspended', 'expired', 'terminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Modifier colonne status pour utiliser l'ENUM
ALTER TABLE crm_contracts ALTER COLUMN status TYPE crm_contract_status USING status::crm_contract_status;

-- FK vers lead_id et opportunity_id
ALTER TABLE crm_contracts
  ADD CONSTRAINT crm_contracts_lead_id_fkey
  FOREIGN KEY (lead_id)
  REFERENCES crm_leads(id)
  ON DELETE SET NULL;

ALTER TABLE crm_contracts
  ADD CONSTRAINT crm_contracts_opportunity_id_fkey
  FOREIGN KEY (opportunity_id)
  REFERENCES crm_opportunities(id)
  ON DELETE SET NULL;

-- Index unique sur contract_reference (soft-delete aware)
CREATE UNIQUE INDEX IF NOT EXISTS crm_contracts_reference_unique_active
  ON crm_contracts(contract_reference)
  WHERE deleted_at IS NULL;

-- Index
CREATE INDEX IF NOT EXISTS crm_contracts_lead_id_idx ON crm_contracts(lead_id);
CREATE INDEX IF NOT EXISTS crm_contracts_opportunity_id_idx ON crm_contracts(opportunity_id);
CREATE INDEX IF NOT EXISTS crm_contracts_status_idx ON crm_contracts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_contracts_effective_date_idx ON crm_contracts(effective_date);
CREATE INDEX IF NOT EXISTS crm_contracts_expiry_date_idx ON crm_contracts(expiry_date);

-- Activer RLS
ALTER TABLE crm_contracts ENABLE ROW LEVEL SECURITY;

-- Politique RLS: Accès uniquement pour provider_staff
CREATE POLICY provider_staff_access_crm_contracts
  ON crm_contracts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM adm_provider_employees
      WHERE id = (current_setting('app.current_user_id', true))::uuid
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM adm_provider_employees
      WHERE id = (current_setting('app.current_user_id', true))::uuid
        AND status = 'active'
        AND deleted_at IS NULL
    )
  );

-- Politique temporaire pour développement
CREATE POLICY temp_allow_all_crm_contracts_dev
  ON crm_contracts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. Triggers updated_at
-- =====================================================

-- Fonction trigger set_updated_at si n'existe pas
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
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

-- =====================================================
-- 5. Comments
-- =====================================================

COMMENT ON TABLE crm_leads IS
  'Table interne FleetCore pour gestion des prospects. Pas de tenant_id car les leads ne sont pas encore clients.';

COMMENT ON TABLE crm_opportunities IS
  'Table interne FleetCore pour pipeline de ventes. Liee aux leads.';

COMMENT ON TABLE crm_contracts IS
  'Table interne FleetCore pour contrats signes. Creation du tenant dans adm_tenants lors du passage a active.';

COMMIT;
