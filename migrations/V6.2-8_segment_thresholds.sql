-- ═══════════════════════════════════════════════════════════════════════════
-- V6.2-8: Segment Thresholds Configuration
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Customer segmentation based on fleet size (4 segments):
--   segment_1: Solo Driver (1 vehicle) → Mobile app, NOT SaaS
--   segment_2: Small Fleet (2-10) → Starter plan
--   segment_3: Medium Fleet (11-19) → Pro plan
--   segment_4: Large Fleet (20+) → Premium plan + negotiation possible
--
-- RULE: This is the Single Source of Truth for segmentation
-- ZERO HARDCODING in application code
--
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  display_label,
  schema_version,
  is_system,
  is_active,
  description
)
VALUES (
  'segment_thresholds',
  '{
    "version": "6.2.1",
    "segments": [
      {
        "code": "segment_1",
        "min_fleet": 1,
        "max_fleet": 1,
        "plan_code": null,
        "label_en": "Solo Driver",
        "label_fr": "Chauffeur Indépendant",
        "is_saas": false,
        "description": "Individual driver with single vehicle - mobile app only"
      },
      {
        "code": "segment_2",
        "min_fleet": 2,
        "max_fleet": 10,
        "plan_code": "starter",
        "label_en": "Small Fleet",
        "label_fr": "Petite Flotte",
        "is_saas": true,
        "description": "Small fleet operations - Starter plan"
      },
      {
        "code": "segment_3",
        "min_fleet": 11,
        "max_fleet": 19,
        "plan_code": "pro",
        "label_en": "Medium Fleet",
        "label_fr": "Flotte Moyenne",
        "is_saas": true,
        "description": "Medium fleet operations - Pro plan"
      },
      {
        "code": "segment_4",
        "min_fleet": 20,
        "max_fleet": null,
        "plan_code": "premium",
        "label_en": "Large Fleet",
        "label_fr": "Grande Flotte",
        "is_saas": true,
        "negotiation_allowed": true,
        "description": "Large fleet operations - Premium plan with negotiation"
      }
    ],
    "escalation_threshold": 20,
    "default_segment": "segment_2"
  }'::jsonb,
  'scoring',
  'object',
  'Segment Thresholds',
  '6.2.1',
  true,
  true,
  'Fleet size thresholds for customer segmentation V6.2.1. Defines 4 segments: Solo (1), Small (2-10), Medium (11-19), Large (20+)'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  schema_version = EXCLUDED.schema_version,
  updated_at = NOW();

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT setting_key, setting_value->>'version' as version,
--        jsonb_array_length(setting_value->'segments') as segment_count
-- FROM crm_settings WHERE setting_key = 'segment_thresholds';
