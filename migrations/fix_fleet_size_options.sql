-- =====================================================
-- FleetCore CRM - Fix Fleet Size Options
-- =====================================================
-- Created: 2026-02-27
-- Purpose: Align crm_settings.fleet_size_options with
--          the 3 standard values used across the codebase
--
-- BEFORE: 5 options (1-10, 11-50, 51-100, 101-500, 500+)
-- AFTER:  3 options (2-10, 11-50, 50+) — source of truth
--
-- WORKFLOW:
-- 1. Execute this SQL in Supabase Dashboard SQL Editor
-- 2. Verify: SELECT setting_value FROM crm_settings
--            WHERE setting_key = 'fleet_size_options';
-- =====================================================

UPDATE crm_settings
SET
  setting_value = '{
    "options": [
      {
        "value": "2-10",
        "label_en": "2-10 vehicles",
        "label_fr": "2-10 v\u00e9hicules",
        "label_ar": "2-10 \u0645\u0631\u0643\u0628\u0627\u062a",
        "fit_score_weight": 20,
        "order": 1,
        "is_active": true
      },
      {
        "value": "11-50",
        "label_en": "11-50 vehicles",
        "label_fr": "11-50 v\u00e9hicules",
        "label_ar": "11-50 \u0645\u0631\u0643\u0628\u0629",
        "fit_score_weight": 50,
        "order": 2,
        "is_active": true
      },
      {
        "value": "50+",
        "label_en": "50+ vehicles",
        "label_fr": "50+ v\u00e9hicules",
        "label_ar": "50+ \u0645\u0631\u0643\u0628\u0629",
        "fit_score_weight": 100,
        "order": 3,
        "is_active": true
      }
    ],
    "default": "2-10"
  }'::jsonb,
  updated_at = NOW()
WHERE setting_key = 'fleet_size_options';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- SELECT setting_value->'options' as options,
--        setting_value->>'default' as default_value
-- FROM crm_settings
-- WHERE setting_key = 'fleet_size_options';
-- Expected: 3 options (2-10, 11-50, 50+), default "2-10"
-- =====================================================
