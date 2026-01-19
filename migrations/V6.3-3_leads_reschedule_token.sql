-- ============================================================================
-- V6.3-3: Add reschedule_token to crm_leads for iOS Mail compatibility
-- ============================================================================
-- Problem: iOS Mail app doesn't handle long URLs (>60 chars) in buttons
-- Solution: Short tokens for reschedule email links (e.g., /r/Xk9mP2)
-- ============================================================================

-- 1. Add reschedule_token column
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS reschedule_token VARCHAR(8);

-- 2. Add unique constraint
ALTER TABLE crm_leads
ADD CONSTRAINT crm_leads_reschedule_token_unique UNIQUE (reschedule_token);

-- 3. Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_crm_leads_reschedule_token
ON crm_leads(reschedule_token);

-- ============================================================================
-- Note: Tokens are generated on-demand when sending reschedule emails
-- No need to backfill existing entries
-- ============================================================================
