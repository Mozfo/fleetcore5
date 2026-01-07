-- ═══════════════════════════════════════════════════════════════════════════
-- V6.2-7b: Create bil_settings Table
-- ═══════════════════════════════════════════════════════════════════════════
--
-- This migration creates the bil_settings table with the same structure as
-- crm_settings, including provider_id for multi-tenant configuration.
--
-- Key differences from crm_settings:
-- - Focuses on billing/payment configuration
-- - Includes payment_settings for V6.2.1 Stripe flow
--
-- IMPORTANT: Run after V6.2-7a
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Create bil_settings table
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bil_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL,
  data_type VARCHAR(20) NOT NULL DEFAULT 'object',

  -- Display & versioning
  display_label VARCHAR(100),
  schema_version VARCHAR(10) DEFAULT '1.0',

  -- System flags
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Documentation
  description TEXT,

  -- Multi-tenant support (NULL = global FleetCore setting)
  provider_id UUID REFERENCES adm_providers(id) ON DELETE CASCADE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: same key can exist per provider
  UNIQUE(setting_key, provider_id)
);

-- Handle NULL provider_id in unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_bil_settings_key_global
ON bil_settings(setting_key)
WHERE provider_id IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Create indexes
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_bil_settings_key
ON bil_settings(setting_key);

CREATE INDEX IF NOT EXISTS idx_bil_settings_provider
ON bil_settings(provider_id)
WHERE provider_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bil_settings_category
ON bil_settings(category);

CREATE INDEX IF NOT EXISTS idx_bil_settings_active
ON bil_settings(is_active)
WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Add table comment
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE bil_settings IS
'V6.2.1: Billing settings configuration - same structure as crm_settings.
provider_id NULL = global FleetCore setting, otherwise provider-specific.';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: Insert payment_settings (V6.2.1 Payment Link Configuration)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO bil_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  display_label,
  schema_version,
  is_system,
  description
)
VALUES (
  'payment_settings',
  '{
    "version": "6.2.1",
    "payment_link": {
      "allowed_statuses": ["qualified", "demo_completed", "proposal_sent"],
      "expiry_hours": 24,
      "reminder_hours": 12,
      "max_retry_count": 3
    },
    "first_month_free": {
      "enabled": true,
      "coupon_id": "FIRST_MONTH_FREE",
      "description": "100% off first month - CB collected Day 1"
    },
    "checkout": {
      "success_path": "/payment-success",
      "cancel_path": "/payment-cancelled",
      "collect_billing_address": true,
      "collect_phone": false
    },
    "webhook": {
      "events_to_process": [
        "checkout.session.completed",
        "checkout.session.expired",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.paid",
        "invoice.payment_failed"
      ]
    }
  }'::jsonb,
  'payment',
  'object',
  'Payment Settings',
  '6.2.1',
  true,
  'V6.2.1 Payment link and Stripe checkout configuration. Controls payment flow, first month free coupon, and webhook events.'
)
ON CONFLICT (setting_key) WHERE provider_id IS NULL
DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  schema_version = EXCLUDED.schema_version,
  updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: Insert tenant_settings (Tenant creation configuration)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO bil_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  display_label,
  schema_version,
  is_system,
  description
)
VALUES (
  'tenant_settings',
  '{
    "version": "6.2.1",
    "code_generation": {
      "prefix": "C",
      "separator": "-",
      "digits": 6,
      "format": "C-XXXXXX"
    },
    "verification": {
      "token_expiry_hours": 24,
      "reminder_before_expiry_hours": 6
    },
    "cgi_cgu": {
      "current_version": "2026-01",
      "require_acceptance": true,
      "track_ip": true
    },
    "clerk_organization": {
      "auto_create": true,
      "default_role": "admin",
      "slug_format": "fleetcore-{tenant_code}"
    }
  }'::jsonb,
  'tenant',
  'object',
  'Tenant Settings',
  '6.2.1',
  true,
  'V6.2.1 Tenant creation and verification configuration. C-XXXXXX code format, 24h verification, CGI tracking.'
)
ON CONFLICT (setting_key) WHERE provider_id IS NULL
DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  schema_version = EXCLUDED.schema_version,
  updated_at = NOW();

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY (run manually after migration)
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT setting_key, category, schema_version, is_system
-- FROM bil_settings
-- ORDER BY setting_key;
