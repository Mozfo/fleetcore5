-- ============================================================================
-- V6.6-05: Insert nurturing notification templates
-- ============================================================================
-- Purpose: 3 email templates for nurturing pipeline
--   1. nurturing_recovery (T+1h) - Empathetic "technical problem?" recovery
--   2. nurturing_j1 (J+1) - Value-focused with savings data
--   3. nurturing_j7 (J+7) - Final reminder, no artificial urgency
-- Table: dir_notification_templates
--
-- IMPORTANT: supported_countries is dynamically pulled from crm_countries
-- (is_operational = true). When new countries are added, templates
-- automatically apply. Zero hardcode.
-- ============================================================================

-- ============================================================================
-- TEMPLATE 1: nurturing_recovery (T+1h)
-- ============================================================================

INSERT INTO dir_notification_templates (
  template_code,
  template_name,
  channel,
  supported_countries,
  supported_locales,
  subject_translations,
  body_translations,
  variables,
  status
)
SELECT
  'nurturing_recovery',
  'Nurturing Recovery (T+1h)',
  'email',
  (SELECT ARRAY_AGG(country_code ORDER BY country_code) FROM crm_countries WHERE is_operational = true),
  ARRAY['en', 'fr', 'ar'],
  '{
    "en": "Your FleetCore demo awaits",
    "fr": "Votre démo FleetCore vous attend",
    "ar": "عرض FleetCore التوضيحي في انتظارك"
  }'::jsonb,
  '{
    "en": "REACT_EMAIL_TEMPLATE:NurturingRecovery",
    "fr": "REACT_EMAIL_TEMPLATE:NurturingRecovery",
    "ar": "REACT_EMAIL_TEMPLATE:NurturingRecovery"
  }'::jsonb,
  '{
    "required": [
      "resumeUrl",
      "unsubscribeUrl"
    ],
    "optional": [
      "firstName"
    ],
    "description": {
      "firstName": "Lead first name (may not be available for incomplete wizard)",
      "resumeUrl": "Resume URL with nurturing token (/api/crm/nurturing/resume?token=xxx)",
      "unsubscribeUrl": "Unsubscribe URL (/unsubscribe?token=xxx)"
    }
  }'::jsonb,
  'active'
ON CONFLICT (template_code, channel)
DO UPDATE SET
  template_name = EXCLUDED.template_name,
  supported_countries = EXCLUDED.supported_countries,
  supported_locales = EXCLUDED.supported_locales,
  subject_translations = EXCLUDED.subject_translations,
  body_translations = EXCLUDED.body_translations,
  variables = EXCLUDED.variables,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================================================
-- TEMPLATE 2: nurturing_j1 (J+1)
-- ============================================================================

INSERT INTO dir_notification_templates (
  template_code,
  template_name,
  channel,
  supported_countries,
  supported_locales,
  subject_translations,
  body_translations,
  variables,
  status
)
SELECT
  'nurturing_j1',
  'Nurturing J+1 (Value Proposition)',
  'email',
  (SELECT ARRAY_AGG(country_code ORDER BY country_code) FROM crm_countries WHERE is_operational = true),
  ARRAY['en', 'fr', 'ar'],
  '{
    "en": "FleetCore: Save €142/vehicle/month",
    "fr": "FleetCore : Économisez 142€/véhicule/mois",
    "ar": "FleetCore: وفر 142€ لكل مركبة شهرياً"
  }'::jsonb,
  '{
    "en": "REACT_EMAIL_TEMPLATE:NurturingJ1",
    "fr": "REACT_EMAIL_TEMPLATE:NurturingJ1",
    "ar": "REACT_EMAIL_TEMPLATE:NurturingJ1"
  }'::jsonb,
  '{
    "required": [
      "resumeUrl",
      "unsubscribeUrl"
    ],
    "optional": [
      "firstName"
    ],
    "description": {
      "firstName": "Lead first name (may not be available for incomplete wizard)",
      "resumeUrl": "Resume URL with nurturing token (/api/crm/nurturing/resume?token=xxx)",
      "unsubscribeUrl": "Unsubscribe URL (/unsubscribe?token=xxx)"
    }
  }'::jsonb,
  'active'
ON CONFLICT (template_code, channel)
DO UPDATE SET
  template_name = EXCLUDED.template_name,
  supported_countries = EXCLUDED.supported_countries,
  supported_locales = EXCLUDED.supported_locales,
  subject_translations = EXCLUDED.subject_translations,
  body_translations = EXCLUDED.body_translations,
  variables = EXCLUDED.variables,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================================================
-- TEMPLATE 3: nurturing_j7 (J+7)
-- ============================================================================

INSERT INTO dir_notification_templates (
  template_code,
  template_name,
  channel,
  supported_countries,
  supported_locales,
  subject_translations,
  body_translations,
  variables,
  status
)
SELECT
  'nurturing_j7',
  'Nurturing J+7 (Final Reminder)',
  'email',
  (SELECT ARRAY_AGG(country_code ORDER BY country_code) FROM crm_countries WHERE is_operational = true),
  ARRAY['en', 'fr', 'ar'],
  '{
    "en": "Last chance: Your FleetCore demo",
    "fr": "Dernière chance : Votre démo FleetCore",
    "ar": "الفرصة الأخيرة: عرض FleetCore التوضيحي"
  }'::jsonb,
  '{
    "en": "REACT_EMAIL_TEMPLATE:NurturingJ7",
    "fr": "REACT_EMAIL_TEMPLATE:NurturingJ7",
    "ar": "REACT_EMAIL_TEMPLATE:NurturingJ7"
  }'::jsonb,
  '{
    "required": [
      "resumeUrl",
      "unsubscribeUrl"
    ],
    "optional": [
      "firstName"
    ],
    "description": {
      "firstName": "Lead first name (may not be available for incomplete wizard)",
      "resumeUrl": "Resume URL with nurturing token (/api/crm/nurturing/resume?token=xxx)",
      "unsubscribeUrl": "Unsubscribe URL (/unsubscribe?token=xxx)"
    }
  }'::jsonb,
  'active'
ON CONFLICT (template_code, channel)
DO UPDATE SET
  template_name = EXCLUDED.template_name,
  supported_countries = EXCLUDED.supported_countries,
  supported_locales = EXCLUDED.supported_locales,
  subject_translations = EXCLUDED.subject_translations,
  body_translations = EXCLUDED.body_translations,
  variables = EXCLUDED.variables,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================================================
-- Verification query (run after migration)
-- ============================================================================
-- SELECT template_code, template_name, channel, supported_countries, supported_locales, status
-- FROM dir_notification_templates
-- WHERE template_code IN ('nurturing_recovery', 'nurturing_j1', 'nurturing_j7');
