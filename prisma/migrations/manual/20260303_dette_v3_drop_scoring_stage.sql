-- ============================================================================
-- DETTE-V3: Drop ICP Scoring + lead_stage zombie columns
-- Date: 2026-03-03
-- Author: DETTE-V3 cleanup mission
--
-- PREREQUISITE: All application code must be deployed FIRST (no code reads
-- these columns anymore). This script is run AFTER deployment.
--
-- SAFETY: All operations are idempotent (IF EXISTS). Can be re-run safely.
-- BACKUP: Take a pg_dump snapshot before executing.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Drop indexes that reference removed columns
-- ============================================================================

DROP INDEX IF EXISTS idx_crm_leads_lead_stage;
DROP INDEX IF EXISTS idx_crm_leads_qualification_score;
DROP INDEX IF EXISTS idx_crm_leads_status_stage_deleted;
DROP INDEX IF EXISTS idx_crm_leads_stage_entered;

-- ============================================================================
-- STEP 2: Drop columns from crm_leads
-- ============================================================================

-- ICP Scoring columns
ALTER TABLE crm_leads DROP COLUMN IF EXISTS fit_score;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS engagement_score;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS qualification_score;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS qualification_notes;
ALTER TABLE crm_leads DROP COLUMN IF EXISTS scoring;

-- lead_stage column
ALTER TABLE crm_leads DROP COLUMN IF EXISTS lead_stage;

-- stage_entered_at (Lead side ONLY — Opportunity keeps its own)
ALTER TABLE crm_leads DROP COLUMN IF EXISTS stage_entered_at;

-- ============================================================================
-- STEP 3: Drop the lead_stage enum type
-- ============================================================================

DROP TYPE IF EXISTS lead_stage;

-- ============================================================================
-- STEP 4: Replace composite index (deleted_at, status) without lead_stage
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_crm_leads_status_deleted
  ON crm_leads(deleted_at, status);

COMMIT;

-- ============================================================================
-- VERIFICATION (run after commit):
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'crm_leads'
--   AND column_name IN ('fit_score','engagement_score','qualification_score',
--                        'qualification_notes','scoring','lead_stage','stage_entered_at');
-- Expected: 0 rows
-- ============================================================================
