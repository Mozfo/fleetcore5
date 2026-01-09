-- V6.2-6: Attendance Confirmation Columns for J-1 Email Reminder
-- Phase C.6 - Book Demo Wizard
--
-- Ces colonnes permettent de tracker la confirmation de présence
-- via le bouton "I'll be there" dans l'email de rappel J-1

-- 1. Ajouter les colonnes
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS confirmation_token VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS attendance_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS attendance_confirmed_at TIMESTAMPTZ;

-- 2. Créer l'index pour lookup par token
CREATE INDEX IF NOT EXISTS idx_crm_leads_confirmation_token
ON crm_leads(confirmation_token)
WHERE confirmation_token IS NOT NULL;

-- 3. Commentaires
COMMENT ON COLUMN crm_leads.confirmation_token IS 'Token unique pour confirmation présence (email J-1)';
COMMENT ON COLUMN crm_leads.attendance_confirmed IS 'Lead a confirmé sa présence au demo';
COMMENT ON COLUMN crm_leads.attendance_confirmed_at IS 'Date/heure de confirmation présence';
