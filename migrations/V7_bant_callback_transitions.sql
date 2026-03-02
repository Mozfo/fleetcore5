-- ============================================
-- SCRIPT: Add BANT qualification transitions for callback_requested
-- Version: V7
-- Date: 2026-03-02
-- ============================================
--
-- The BANT qualification flow requires callback_requested leads to
-- transition to: qualified (4/4), nurturing (3/4 or fleet exception),
-- or disqualified (≤2/4). Previously only demo/disqualified/lost were allowed.
--
-- This adds "qualified" and "nurturing" to callback_requested.transitions_to.
-- ============================================

UPDATE crm_settings
SET setting_value = jsonb_set(
  setting_value,
  '{statuses}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN s->>'value' = 'callback_requested'
        THEN jsonb_set(s, '{transitions_to}', '["demo", "qualified", "nurturing", "disqualified", "lost"]'::jsonb)
        ELSE s
      END
    )
    FROM jsonb_array_elements(setting_value->'statuses') AS s
  )
),
version = version + 1,
updated_at = NOW()
WHERE setting_key = 'lead_status_workflow';
