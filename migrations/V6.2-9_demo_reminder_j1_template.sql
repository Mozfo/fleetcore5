-- ============================================================================
-- V6.2-9: Insert demo_reminder_j1 notification template
-- ============================================================================
-- Purpose: Email template for J-1 demo reminder (anti-no-show)
-- Table: dir_notification_templates
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
) VALUES (
  'demo_reminder_j1',
  'Demo Reminder J-1 (Anti-No-Show)',
  'email',
  ARRAY['AE', 'FR', 'SA', 'MA', 'TN', 'DZ', 'EG', 'JO', 'LB', 'KW', 'QA', 'BH', 'OM'],
  ARRAY['en', 'fr', 'ar'],
  '{
    "en": "Tomorrow at {{bookingTime}} - Please confirm your FleetCore demo",
    "fr": "Demain à {{bookingTime}} - Merci de confirmer votre démo FleetCore",
    "ar": "غداً في {{bookingTime}} - يرجى تأكيد عرض FleetCore التوضيحي"
  }'::jsonb,
  '{
    "en": "REACT_EMAIL_TEMPLATE:DemoReminderJ1",
    "fr": "REACT_EMAIL_TEMPLATE:DemoReminderJ1",
    "ar": "REACT_EMAIL_TEMPLATE:DemoReminderJ1"
  }'::jsonb,
  '{
    "required": [
      "firstName",
      "companyName",
      "bookingDate",
      "bookingTime",
      "timezone",
      "phone",
      "fleetSize",
      "confirmUrl",
      "rescheduleUrl"
    ],
    "optional": [],
    "description": {
      "firstName": "Lead first name",
      "companyName": "Lead company name",
      "bookingDate": "Formatted date (e.g., Monday, January 13, 2026)",
      "bookingTime": "Formatted time (e.g., 2:30 PM)",
      "timezone": "Timezone abbreviation (e.g., GMT+4)",
      "phone": "Phone number to call (e.g., +971 50 123 4567)",
      "fleetSize": "Fleet size label (e.g., 6-10 vehicles)",
      "confirmUrl": "Confirmation URL with token (/api/crm/leads/confirm-attendance?token=xxx)",
      "rescheduleUrl": "Internal reschedule URL (/book-demo/reschedule?uid=xxx)"
    }
  }'::jsonb,
  'active'
)
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
-- SELECT template_code, template_name, channel, supported_locales, status
-- FROM dir_notification_templates
-- WHERE template_code = 'demo_reminder_j1';
