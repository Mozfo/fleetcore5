-- =====================================================
-- FleetCore CRM - Critical Settings Migration
-- =====================================================
-- Created: 2025-11-15
-- Purpose: Migrate 4 critical hardcoded values to crm_settings
--
-- WORKFLOW:
-- 1. Execute this SQL in Supabase Dashboard SQL Editor
-- 2. Verify inserts: SELECT * FROM crm_settings WHERE setting_key IN (...)
-- 3. No Prisma changes needed (crm_settings already exists)
-- 4. Code will be updated to query these settings dynamically
-- =====================================================

-- =====================================================
-- SETTING 1: Fleet Size Options (from validators)
-- Source: lib/validators/crm.validators.ts line 80
-- Usage: Lead creation forms, filtering, scoring
-- =====================================================
INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  description,
  is_active,
  created_at,
  updated_at
) VALUES (
  'fleet_size_options',
  '{
    "options": [
      {
        "value": "1-10",
        "label_en": "1-10 vehicles",
        "label_fr": "1-10 véhicules",
        "label_ar": "1-10 مركبات",
        "fit_score_weight": 10,
        "order": 1
      },
      {
        "value": "11-50",
        "label_en": "11-50 vehicles",
        "label_fr": "11-50 véhicules",
        "label_ar": "11-50 مركبات",
        "fit_score_weight": 30,
        "order": 2
      },
      {
        "value": "51-100",
        "label_en": "51-100 vehicles",
        "label_fr": "51-100 véhicules",
        "label_ar": "51-100 مركبات",
        "fit_score_weight": 50,
        "order": 3
      },
      {
        "value": "101-500",
        "label_en": "101-500 vehicles",
        "label_fr": "101-500 véhicules",
        "label_ar": "101-500 مركبات",
        "fit_score_weight": 80,
        "order": 4
      },
      {
        "value": "500+",
        "label_en": "500+ vehicles",
        "label_fr": "500+ véhicules",
        "label_ar": "500+ مركبات",
        "fit_score_weight": 100,
        "order": 5
      }
    ],
    "default": "1-10"
  }'::jsonb,
  'scoring',
  'object',
  'Fleet size options for lead qualification and scoring. Includes multilingual labels and fit_score weights.',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- =====================================================
-- SETTING 2: Lead Status Workflow (unified enum)
-- Source: lib/validators/crm.validators.ts line 247-252
-- Usage: Lead status transitions, validation, filtering
-- =====================================================
INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  description,
  is_active,
  created_at,
  updated_at
) VALUES (
  'lead_status_workflow',
  '{
    "statuses": [
      {
        "value": "new",
        "label_en": "New Lead",
        "label_fr": "Nouveau Lead",
        "label_ar": "عميل جديد",
        "color": "blue",
        "icon": "sparkles",
        "order": 1,
        "transitions_to": ["contacted", "qualified", "disqualified"],
        "is_initial": true
      },
      {
        "value": "contacted",
        "label_en": "Contacted",
        "label_fr": "Contacté",
        "label_ar": "تم الاتصال",
        "color": "purple",
        "icon": "phone",
        "order": 2,
        "transitions_to": ["working", "qualified", "disqualified"]
      },
      {
        "value": "working",
        "label_en": "Working",
        "label_fr": "En cours",
        "label_ar": "قيد العمل",
        "color": "yellow",
        "icon": "cog",
        "order": 3,
        "transitions_to": ["qualified", "disqualified", "lost"]
      },
      {
        "value": "qualified",
        "label_en": "Qualified",
        "label_fr": "Qualifié",
        "label_ar": "مؤهل",
        "color": "green",
        "icon": "check-circle",
        "order": 4,
        "transitions_to": ["converted", "lost"],
        "can_create_opportunity": true
      },
      {
        "value": "disqualified",
        "label_en": "Disqualified",
        "label_fr": "Disqualifié",
        "label_ar": "غير مؤهل",
        "color": "gray",
        "icon": "x-circle",
        "order": 5,
        "transitions_to": [],
        "is_terminal": true
      },
      {
        "value": "converted",
        "label_en": "Converted to Opportunity",
        "label_fr": "Converti en Opportunité",
        "label_ar": "تحويل إلى فرصة",
        "color": "emerald",
        "icon": "trophy",
        "order": 6,
        "transitions_to": [],
        "is_terminal": true,
        "is_success": true
      },
      {
        "value": "lost",
        "label_en": "Lost",
        "label_fr": "Perdu",
        "label_ar": "مفقود",
        "color": "red",
        "icon": "x",
        "order": 7,
        "transitions_to": [],
        "is_terminal": true
      }
    ],
    "default": "new"
  }'::jsonb,
  'workflows',
  'object',
  'Complete lead status workflow with transitions, labels, colors, and icons. Supports UI rendering and business logic.',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- =====================================================
-- SETTING 3: GDPR Countries (EU + EEA)
-- Source: lib/validators/crm.validators.ts lines 118-146
-- Usage: GDPR consent validation for lead creation
-- =====================================================
INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  description,
  is_active,
  created_at,
  updated_at
) VALUES (
  'gdpr_required_countries',
  '{
    "countries": [
      "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
      "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
      "PL", "PT", "RO", "SK", "SI", "ES", "SE"
    ],
    "description": "EU and EEA countries requiring GDPR consent for lead capture forms",
    "regulation": "GDPR (EU 2016/679)",
    "validation_rule": "gdpr_consent must be true for these countries",
    "updated": "2025-11-15"
  }'::jsonb,
  'validation',
  'object',
  'List of country codes (ISO 3166-1 alpha-2) requiring GDPR consent. Used for lead form validation.',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- =====================================================
-- SETTING 4: Opportunity Status Types
-- Source: lib/validators/crm.validators.ts line 410
-- Usage: Opportunity filtering, pipeline visualization
-- =====================================================
INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  description,
  is_active,
  created_at,
  updated_at
) VALUES (
  'opportunity_status_types',
  '{
    "statuses": [
      {
        "value": "open",
        "label_en": "Open",
        "label_fr": "Ouvert",
        "label_ar": "مفتوح",
        "color": "blue",
        "icon": "folder-open",
        "order": 1,
        "is_active": true
      },
      {
        "value": "won",
        "label_en": "Won",
        "label_fr": "Gagné",
        "label_ar": "فاز",
        "color": "green",
        "icon": "trophy",
        "order": 2,
        "is_success": true,
        "is_terminal": true
      },
      {
        "value": "lost",
        "label_en": "Lost",
        "label_fr": "Perdu",
        "label_ar": "خسر",
        "color": "red",
        "icon": "x-circle",
        "order": 3,
        "is_terminal": true
      },
      {
        "value": "on_hold",
        "label_en": "On Hold",
        "label_fr": "En attente",
        "label_ar": "قيد الانتظار",
        "color": "yellow",
        "icon": "pause-circle",
        "order": 4,
        "is_active": false
      },
      {
        "value": "cancelled",
        "label_en": "Cancelled",
        "label_fr": "Annulé",
        "label_ar": "ألغيت",
        "color": "gray",
        "icon": "ban",
        "order": 5,
        "is_terminal": true
      }
    ],
    "default": "open"
  }'::jsonb,
  'workflows',
  'object',
  'Opportunity status types with multilingual labels, colors, and workflow metadata.',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this after execution to verify all 4 settings were created:
--
-- SELECT
--   setting_key,
--   category,
--   description,
--   is_active,
--   created_at
-- FROM crm_settings
-- WHERE setting_key IN (
--   'fleet_size_options',
--   'lead_status_workflow',
--   'gdpr_required_countries',
--   'opportunity_status_types'
-- )
-- ORDER BY category, setting_key;
-- =====================================================
