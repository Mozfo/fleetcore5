-- =====================================================
-- SEED: locale_template_mapping configuration
-- Maps user form locales to available template locales
-- =====================================================

INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  description,
  is_active,
  is_system,
  display_label,
  display_order,
  help_text,
  created_at,
  updated_at
) VALUES (
  'locale_template_mapping',
  '{
    "en": "en",
    "en-US": "en",
    "en-GB": "en",
    "fr": "fr",
    "fr-FR": "fr",
    "fr-BE": "fr",
    "ar": "ar",
    "ar-AE": "ar",
    "ar-SA": "ar",
    "es": "en",
    "es-ES": "en",
    "zh": "en",
    "zh-CN": "en",
    "de": "en",
    "de-DE": "en",
    "default": "en"
  }'::jsonb,
  'validation',
  'object',
  'Maps form locale codes (i18n.language) to available template locales for email notifications. Supports locale variants (e.g., en-US → en). Languages without templates fall back to English.',
  true,
  false,
  'Locale to Template Mapping',
  100,
  'Configure which template language to use for each form locale. Add new locales here as templates become available.',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT
  setting_key,
  setting_value,
  category,
  is_active,
  created_at
FROM crm_settings
WHERE setting_key = 'locale_template_mapping';
