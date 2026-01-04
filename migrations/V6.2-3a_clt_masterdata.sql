-- V6.2-3a: Creation table clt_masterdata
-- Module CLT (Client) - Donnees identite client apres conversion Lead
-- Relation 1:1 avec adm_tenants

BEGIN;

-- =============================================================================
-- TABLE: clt_masterdata
-- =============================================================================

CREATE TABLE clt_masterdata (
  -- Primary Key
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relation 1:1 avec adm_tenants (UNIQUE constraint)
  tenant_id               UUID NOT NULL UNIQUE REFERENCES adm_tenants(id) ON DELETE CASCADE,

  -- Tracabilite origine Lead
  origin_lead_code        VARCHAR(50),           -- LEAD-2025-00001 pour tracabilite
  origin_lead_id          UUID REFERENCES crm_leads(id) ON DELETE SET NULL,

  -- Identite entreprise
  company_name            VARCHAR(255) NOT NULL,
  legal_name              VARCHAR(255),
  tax_id                  VARCHAR(50),           -- TVA/SIRET

  -- Contact facturation
  billing_email           VARCHAR(255),
  billing_address         JSONB,

  -- Contact principal
  primary_contact_name    VARCHAR(255),
  primary_contact_email   VARCHAR(255),
  primary_contact_phone   VARCHAR(50),

  -- Classification segment
  segment                 VARCHAR(20) CHECK (segment IN ('solo', 'starter', 'pro', 'premium')),

  -- Lifecycle
  onboarded_at            TIMESTAMPTZ,
  churned_at              TIMESTAMPTZ,
  churn_reason            VARCHAR(255),

  -- Metadata extensible
  metadata                JSONB DEFAULT '{}',

  -- Audit columns
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  created_by              UUID,
  updated_by              UUID,
  deleted_by              UUID
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index sur origin_lead_id pour lookup (partial - only non-null)
CREATE INDEX idx_clt_masterdata_origin_lead
ON clt_masterdata(origin_lead_id)
WHERE origin_lead_id IS NOT NULL;

-- Index sur segment pour filtrage
CREATE INDEX idx_clt_masterdata_segment
ON clt_masterdata(segment)
WHERE segment IS NOT NULL;

-- Index sur deleted_at pour soft delete filtering
CREATE INDEX idx_clt_masterdata_deleted_at
ON clt_masterdata(deleted_at)
WHERE deleted_at IS NULL;

-- =============================================================================
-- TRIGGER: updated_at auto-update
-- =============================================================================

CREATE OR REPLACE FUNCTION update_clt_masterdata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clt_masterdata_updated_at
BEFORE UPDATE ON clt_masterdata
FOR EACH ROW
EXECUTE FUNCTION update_clt_masterdata_updated_at();

-- =============================================================================
-- RLS (Row Level Security)
-- =============================================================================

ALTER TABLE clt_masterdata ENABLE ROW LEVEL SECURITY;

-- Policy: tenant can only see their own masterdata
CREATE POLICY clt_masterdata_tenant_isolation ON clt_masterdata
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE clt_masterdata IS 'V6.2: Donnees identite client apres conversion Lead. Relation 1:1 avec adm_tenants.';
COMMENT ON COLUMN clt_masterdata.tenant_id IS 'FK vers adm_tenants - UNIQUE pour relation 1:1';
COMMENT ON COLUMN clt_masterdata.origin_lead_code IS 'Code du lead source (LEAD-YYYY-NNNNN) pour tracabilite';
COMMENT ON COLUMN clt_masterdata.origin_lead_id IS 'FK vers crm_leads - NULL si import manuel sans lead';
COMMENT ON COLUMN clt_masterdata.segment IS 'Classification client: solo, starter, pro, premium';
COMMENT ON COLUMN clt_masterdata.billing_address IS 'Adresse facturation en JSONB (street, city, postal_code, country)';

COMMIT;
