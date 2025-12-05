-- =============================================================================
-- SPRINT 1.2 - Complete Migration
-- Date: 2025-12-05
-- Purpose: Lead Score Recalculation feature
--
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and execute
-- 4. Verify with the queries at the bottom
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: Add last_activity_at column to crm_leads
-- -----------------------------------------------------------------------------

-- Add the column
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Add index for performance on decay queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_last_activity_at
ON crm_leads(last_activity_at);

-- Backfill existing leads with created_at
UPDATE crm_leads
SET last_activity_at = created_at
WHERE last_activity_at IS NULL;

-- -----------------------------------------------------------------------------
-- PART 2: Add score_decay setting
-- -----------------------------------------------------------------------------

INSERT INTO crm_settings (
  setting_key,
  category,
  data_type,
  is_system,
  is_active,
  version,
  description,
  display_label,
  help_text,
  ui_component,
  display_order,
  setting_value
) VALUES (
  'score_decay',
  'scoring',
  'object',
  true,
  true,
  1,
  'Configuration for automatic score degradation of inactive leads',
  'Score Decay Settings',
  'Configure how lead scores decrease when leads become inactive. This helps prioritize active leads.',
  'nested_form',
  100,
  '{
    "enabled": true,
    "inactivity_threshold_days": 30,
    "decay_type": "percentage",
    "decay_value": 20,
    "minimum_score": 5,
    "apply_to": "engagement_score",
    "reactivation_detection": true,
    "decay_rules": [
      {
        "days_inactive": 7,
        "decay_percentage": 5,
        "description": "Light decay after 1 week"
      },
      {
        "days_inactive": 14,
        "decay_percentage": 10,
        "description": "Moderate decay after 2 weeks"
      },
      {
        "days_inactive": 30,
        "decay_percentage": 20,
        "description": "Significant decay after 1 month"
      }
    ]
  }'::jsonb
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  version = crm_settings.version + 1,
  updated_at = NOW();

-- -----------------------------------------------------------------------------
-- VERIFICATION QUERIES (run these to confirm success)
-- -----------------------------------------------------------------------------

-- Check last_activity_at column exists and is populated
SELECT
  'crm_leads' as table_name,
  COUNT(*) as total_leads,
  COUNT(last_activity_at) as leads_with_activity,
  MIN(last_activity_at) as earliest_activity,
  MAX(last_activity_at) as latest_activity
FROM crm_leads;

-- Check score_decay setting exists
SELECT
  setting_key,
  category,
  is_active,
  version,
  jsonb_pretty(setting_value) as config
FROM crm_settings
WHERE setting_key = 'score_decay';

-- Check all scoring settings
SELECT setting_key, category, is_active
FROM crm_settings
WHERE category = 'scoring'
ORDER BY setting_key;
