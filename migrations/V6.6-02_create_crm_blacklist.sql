-- ============================================
-- SCRIPT T1-02 : CREATE TABLE crm_blacklist
-- À exécuter dans Supabase SQL Editor
-- Version : V6.6
-- Date : 2026-02-09
-- ============================================

CREATE TABLE crm_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES adm_providers(id),

  -- Données blacklist
  email VARCHAR(255) NOT NULL,
  reason VARCHAR(50) NOT NULL,
  reason_comment TEXT,

  -- Référence au lead disqualifié
  original_lead_id UUID REFERENCES crm_leads(id),

  -- Audit
  blacklisted_by UUID REFERENCES adm_provider_employees(id),
  blacklisted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete (retrait blacklist par admin)
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES adm_provider_employees(id),

  -- Contraintes
  CONSTRAINT uq_blacklist_email_provider UNIQUE(email, provider_id)
);

-- Index pour vérification rapide par email
CREATE INDEX idx_crm_blacklist_email ON crm_blacklist(email);

-- Index provider (multi-tenant)
CREATE INDEX idx_crm_blacklist_provider ON crm_blacklist(provider_id);
