-- ============================================
-- SCRIPT T1-01 : CREATE TABLE crm_nurturing
-- À exécuter dans Supabase SQL Editor
-- Version : V6.6
-- Date : 2026-02-09
-- ============================================

CREATE TABLE crm_nurturing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES adm_providers(id),

  -- Données collectées (Step 1 + 2 du wizard)
  email VARCHAR(255) NOT NULL,
  country_code VARCHAR(3) NOT NULL,
  email_verified_at TIMESTAMPTZ NOT NULL,
  language VARCHAR(5) DEFAULT 'en',

  -- Token de reprise wizard
  resume_token VARCHAR(64) UNIQUE,
  resume_token_expires_at TIMESTAMPTZ,

  -- Nurturing automatique (0=aucun, 1=J+1 envoyé, 2=J+7 envoyé)
  nurturing_step INTEGER DEFAULT 0,
  last_nurturing_at TIMESTAMPTZ,
  nurturing_clicked_at TIMESTAMPTZ,

  -- Origine (lead migré après 24h sans complétion)
  original_lead_id UUID REFERENCES crm_leads(id),

  -- Fin de vie
  archived_at TIMESTAMPTZ,

  -- Tracking UTM
  source VARCHAR(50),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- GeoIP (V6.4 pattern)
  ip_address VARCHAR(45),
  detected_country_code VARCHAR(2),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT uq_nurturing_email_provider UNIQUE(email, provider_id)
);

-- Index pour le cron de nurturing
CREATE INDEX idx_crm_nurturing_nurturing
ON crm_nurturing(nurturing_step, last_nurturing_at)
WHERE archived_at IS NULL;

-- Index pour recherche par email
CREATE INDEX idx_crm_nurturing_email ON crm_nurturing(email);

-- Index pour token de reprise
CREATE INDEX idx_crm_nurturing_resume_token ON crm_nurturing(resume_token)
WHERE resume_token IS NOT NULL;

-- Index provider (multi-tenant)
CREATE INDEX idx_crm_nurturing_provider ON crm_nurturing(provider_id);
