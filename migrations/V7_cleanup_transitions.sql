-- ============================================
-- SCRIPT: Clean up transitions_to — remove V6 statuses (demo, proposal_sent, lost)
-- Version: V7
-- Date: 2026-03-02
-- ============================================
--
-- V7 valid statuses: new, email_verified, callback_requested, qualified,
--   converted, nurturing, disqualified
--
-- Removed V6 statuses: demo, proposal_sent, payment_pending, lost
--
-- Fixes:
--   email_verified:     ["callback_requested","nurturing","disqualified"] → ["callback_requested","nurturing"]
--   callback_requested: ["demo","qualified","nurturing","disqualified","lost"] → ["qualified","nurturing","disqualified"]
-- ============================================

UPDATE crm_settings
SET setting_value = jsonb_set(
  setting_value,
  '{statuses}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN s->>'value' = 'email_verified'
        THEN jsonb_set(s, '{transitions_to}', '["callback_requested", "nurturing"]'::jsonb)
        WHEN s->>'value' = 'callback_requested'
        THEN jsonb_set(s, '{transitions_to}', '["qualified", "nurturing", "disqualified"]'::jsonb)
        ELSE s
      END
    )
    FROM jsonb_array_elements(setting_value->'statuses') AS s
  )
),
version = version + 1,
updated_at = NOW()
WHERE setting_key = 'lead_status_workflow';
