-- ============================================================================
-- V6.3-4: Cleanup crm_leads - Remove dead columns
-- ============================================================================
-- 17 columns removed:
-- - 6 Opportunity columns (duplicated in crm_opportunities, never used in leads)
-- - 11 V5 Legacy columns (replaced by Cal.com booking + Stripe payment links)
-- ============================================================================

-- ============================================================================
-- 1. DROP OPPORTUNITY COLUMNS (duplicated in crm_opportunities)
-- ============================================================================
-- These columns exist in crm_opportunities and were never used in leads workflow

ALTER TABLE crm_leads DROP COLUMN IF EXISTS expected_value;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS expected_close_date;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS probability_percent;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS forecast_value;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS won_date;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS lost_date;

-- ============================================================================
-- 2. DROP V5 LEGACY CALLBACK COLUMNS (replaced by Cal.com booking)
-- ============================================================================

ALTER TABLE crm_leads DROP COLUMN IF EXISTS callback_requested_at;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS callback_scheduled_at;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS callback_mode;

-- ============================================================================
-- 3. DROP V5 LEGACY DEMO COLUMNS (replaced by booking_slot_at + Cal.com)
-- ============================================================================

ALTER TABLE crm_leads DROP COLUMN IF EXISTS demo_requested_at;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS demo_scheduled_at;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS demo_viewed_at;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS demo_view_percent;

-- ============================================================================
-- 4. DROP V5 LEGACY CHECKOUT COLUMNS (replaced by Stripe payment links)
-- ============================================================================

ALTER TABLE crm_leads DROP COLUMN IF EXISTS checkout_started_at;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS checkout_abandoned_at;

-- ============================================================================
-- 5. DROP V5 LEGACY ESCALATION COLUMNS (never implemented)
-- ============================================================================

ALTER TABLE crm_leads DROP COLUMN IF EXISTS escalated_at;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS escalation_expires_at;

-- ============================================================================
-- 6. DROP ORPHAN INDEXES (will be auto-dropped with columns, but explicit cleanup)
-- ============================================================================

DROP INDEX IF EXISTS idx_crm_leads_expected_close;
DROP INDEX IF EXISTS idx_crm_leads_escalation;
DROP INDEX IF EXISTS idx_crm_leads_stage_entered;

-- ============================================================================
-- Verification: Check remaining columns
-- ============================================================================
-- Run after migration:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'crm_leads' ORDER BY ordinal_position;
