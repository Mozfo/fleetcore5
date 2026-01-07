-- ═══════════════════════════════════════════════════════════════════════════
-- V6.2-8b: Fix clt_masterdata segment CHECK constraint
-- ═══════════════════════════════════════════════════════════════════════════
--
-- The segment column now stores segment codes (segment_1, segment_2, etc.)
-- instead of plan codes (solo, starter, pro, premium).
--
-- This aligns with crm_settings.segment_thresholds structure.
--
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Drop old constraint
ALTER TABLE clt_masterdata DROP CONSTRAINT IF EXISTS clt_masterdata_segment_check;

-- Add new constraint with segment codes
ALTER TABLE clt_masterdata ADD CONSTRAINT clt_masterdata_segment_check
CHECK (segment IN ('segment_1', 'segment_2', 'segment_3', 'segment_4'));

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conname = 'clt_masterdata_segment_check';
