-- Migration: Add last_activity_at to crm_leads
-- Date: 2025-12-05
-- Sprint: 1.2 - Lead Score Recalculation
-- Purpose: Track last activity for score decay calculations

-- Step 1: Add last_activity_at column
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Step 2: Add index for decay queries (inactive leads lookup)
CREATE INDEX IF NOT EXISTS idx_crm_leads_last_activity_at
ON crm_leads(last_activity_at);

-- Step 3: Backfill existing leads with created_at as initial value
-- This ensures existing leads are not immediately flagged as inactive
UPDATE crm_leads
SET last_activity_at = created_at
WHERE last_activity_at IS NULL;

-- Verification query (optional - run to confirm)
-- SELECT COUNT(*) as total, COUNT(last_activity_at) as with_activity FROM crm_leads;
