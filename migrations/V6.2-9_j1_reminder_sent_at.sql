-- ============================================================================
-- V6.2-9: Add j1_reminder_sent_at column to crm_leads
-- ============================================================================
-- Purpose: Track when J-1 demo reminder email was sent
-- Prevents duplicate sends and allows reporting
-- ============================================================================

-- Add column
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS j1_reminder_sent_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN crm_leads.j1_reminder_sent_at IS
  'Timestamp when J-1 demo reminder email was sent (anti-duplicate)';

-- Add index for CRON query performance
-- Query: WHERE booking_slot_at BETWEEN NOW() + 20h AND NOW() + 28h
--        AND j1_reminder_sent_at IS NULL
CREATE INDEX IF NOT EXISTS idx_crm_leads_j1_reminder
ON crm_leads (booking_slot_at, j1_reminder_sent_at)
WHERE deleted_at IS NULL AND status = 'demo_scheduled';

-- ============================================================================
-- Verification query (run after migration)
-- ============================================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'crm_leads' AND column_name = 'j1_reminder_sent_at';
