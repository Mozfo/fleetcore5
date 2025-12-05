-- Migration: Add score_decay setting to crm_settings
-- Date: 2025-12-05
-- Sprint: 1.2 - Lead Score Recalculation
-- Purpose: Configure automatic score degradation for inactive leads

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

-- Verification query (optional)
-- SELECT setting_key, category, jsonb_pretty(setting_value) FROM crm_settings WHERE setting_key = 'score_decay';
