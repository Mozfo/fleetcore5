-- ============================================================================
-- V6.2.3-1: Table crm_waitlist pour leads pays fermés
-- ============================================================================
-- Date: 2026-01-08
-- Description: Stockage des leads waitlist pour pays non-opérationnels
-- ============================================================================

-- Table principale
CREATE TABLE IF NOT EXISTS crm_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact
  email VARCHAR(255) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  fleet_size VARCHAR(20) NOT NULL,

  -- Détection GeoIP
  detected_country_code VARCHAR(2),
  ip_address VARCHAR(45),

  -- Consent GDPR
  marketing_consent BOOLEAN NOT NULL DEFAULT TRUE,
  gdpr_consent BOOLEAN,
  gdpr_consent_at TIMESTAMPTZ,
  gdpr_consent_ip VARCHAR(45),

  -- Anti-spam
  honeypot_triggered BOOLEAN DEFAULT FALSE,

  -- Tracking
  source VARCHAR(50) DEFAULT 'wizard',
  locale VARCHAR(5) DEFAULT 'en',
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT crm_waitlist_email_country_unique UNIQUE(email, country_code)
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_crm_waitlist_country ON crm_waitlist(country_code);
CREATE INDEX IF NOT EXISTS idx_crm_waitlist_fleet ON crm_waitlist(fleet_size);
CREATE INDEX IF NOT EXISTS idx_crm_waitlist_created ON crm_waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_waitlist_email ON crm_waitlist(email);

-- Commentaires
COMMENT ON TABLE crm_waitlist IS 'Waitlist pour leads de pays non-opérationnels (V6.2.3)';
COMMENT ON COLUMN crm_waitlist.notified_at IS 'Date de notification quand le pays devient opérationnel';
COMMENT ON COLUMN crm_waitlist.honeypot_triggered IS 'True si bot détecté (honeypot rempli)';
COMMENT ON COLUMN crm_waitlist.detected_country_code IS 'Pays détecté par GeoIP (peut différer du country_code choisi)';
