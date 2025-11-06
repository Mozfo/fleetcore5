-- ============================================================================
-- Migration: Align adm_audit_logs with official spec V3
-- Date: 2025-10-09
-- Description:
--   - Rename entity_type → entity, logged_at → timestamp
--   - Drop audit and soft-delete fields (created_at, updated_at, deleted_at, etc.)
--   - Remove trigger update_adm_audit_logs_updated_at
--   - Drop old indexes and create new ones per spec
--   - Disable RLS (audit logs are immutable and globally readable)
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Rename columns to match spec
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'adm_audit_logs' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE adm_audit_logs RENAME COLUMN entity_type TO entity;
    RAISE NOTICE 'Renamed entity_type to entity';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'adm_audit_logs' AND column_name = 'logged_at'
  ) THEN
    ALTER TABLE adm_audit_logs RENAME COLUMN logged_at TO "timestamp";
    RAISE NOTICE 'Renamed logged_at to timestamp';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop audit and soft-delete fields
-- ============================================================================

ALTER TABLE adm_audit_logs DROP COLUMN IF EXISTS created_at;
ALTER TABLE adm_audit_logs DROP COLUMN IF EXISTS created_by;
ALTER TABLE adm_audit_logs DROP COLUMN IF EXISTS updated_at;
ALTER TABLE adm_audit_logs DROP COLUMN IF EXISTS updated_by;
ALTER TABLE adm_audit_logs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE adm_audit_logs DROP COLUMN IF EXISTS deleted_by;
ALTER TABLE adm_audit_logs DROP COLUMN IF EXISTS deletion_reason;

-- ============================================================================
-- STEP 3: Remove trigger
-- ============================================================================

DROP TRIGGER IF EXISTS update_adm_audit_logs_updated_at ON adm_audit_logs;
DROP TRIGGER IF EXISTS set_updated_at_adm_audit_logs ON adm_audit_logs;

-- ============================================================================
-- STEP 4: Drop old indexes
-- ============================================================================

DROP INDEX IF EXISTS adm_audit_logs_tenant_id_entity_type_entity_id_idx;
DROP INDEX IF EXISTS adm_audit_logs_logged_at_idx;
DROP INDEX IF EXISTS adm_audit_logs_deleted_at_idx;
DROP INDEX IF EXISTS adm_audit_logs_created_by_idx;
DROP INDEX IF EXISTS adm_audit_logs_updated_by_idx;

-- ============================================================================
-- STEP 5: Create new indexes per spec
-- ============================================================================

CREATE INDEX IF NOT EXISTS adm_audit_logs_tenant_entity_entity_id_idx
  ON adm_audit_logs(tenant_id, entity, entity_id);

CREATE INDEX IF NOT EXISTS adm_audit_logs_tenant_id_idx
  ON adm_audit_logs(tenant_id);

CREATE INDEX IF NOT EXISTS adm_audit_logs_timestamp_idx
  ON adm_audit_logs("timestamp" DESC);

CREATE INDEX IF NOT EXISTS adm_audit_logs_changes_gin
  ON adm_audit_logs USING GIN(changes);

-- ============================================================================
-- STEP 6: Ensure RLS is disabled
-- ============================================================================

ALTER TABLE adm_audit_logs DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_adm_audit_logs ON adm_audit_logs;
DROP POLICY IF EXISTS temp_allow_all_adm_audit_logs ON adm_audit_logs;

COMMIT;
