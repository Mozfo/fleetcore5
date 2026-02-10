-- ============================================
-- SCRIPT T2 : ALTER TABLE crm_leads
-- À exécuter dans Supabase SQL Editor
-- Version : V6.6
-- Date : 2026-02-09
-- ============================================

-- Callback fields (Step 4 - option "Je préfère être rappelé")
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS callback_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS callback_requested_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS callback_completed_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS callback_notes TEXT;

-- Disqualification fields (avec traçabilité)
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS disqualification_reason VARCHAR(50);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS disqualification_comment TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS disqualified_by UUID REFERENCES adm_provider_employees(id);

-- Recovery notification fields (1h après email_verified sans complétion)
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS recovery_notification_sent_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS recovery_notification_clicked_at TIMESTAMPTZ;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_callback
ON crm_leads(callback_requested, callback_requested_at)
WHERE callback_requested = true;

CREATE INDEX IF NOT EXISTS idx_crm_leads_disqualified
ON crm_leads(status)
WHERE status = 'disqualified';

CREATE INDEX IF NOT EXISTS idx_crm_leads_disqualified_by
ON crm_leads(disqualified_by)
WHERE disqualified_by IS NOT NULL;
