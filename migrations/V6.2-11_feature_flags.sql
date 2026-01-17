-- V6.2-11: CRM Feature Flags
-- Allows hiding Opportunities and Quotes from sidebar (FREEZE/INLINE)
-- Per plan V6.2-11: Phase 1

BEGIN;

-- =============================================================================
-- feature_flags - UI Feature toggles (from DB, not hardcoded)
-- =============================================================================

INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  is_system,
  provider_id,
  description,
  display_label,
  schema_version
) VALUES (
  'feature_flags',
  '{
    "version": "6.2.11",
    "opportunities_enabled": false,
    "quotes_enabled": false,
    "description": "V6.2-11: Opportunities FREEZE (futur upsell), Quotes INLINE dans Lead (Segment 4)"
  }'::jsonb,
  'ui',
  'object',
  true,
  NULL,
  'Feature flags for UI components visibility. opportunities_enabled and quotes_enabled control sidebar visibility.',
  'Feature Flags',
  '6.2.11'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  schema_version = EXCLUDED.schema_version,
  updated_at = NOW();

COMMIT;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- SELECT setting_key, setting_value, schema_version
-- FROM crm_settings
-- WHERE setting_key = 'feature_flags';
