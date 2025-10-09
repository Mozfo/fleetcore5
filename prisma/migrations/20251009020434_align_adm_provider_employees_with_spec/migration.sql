-- ============================================================================
-- Migration: Align adm_provider_employees with official spec V3
-- Date: 2025-10-09
-- Description:
--   - Replace unique indexes with partial unique indexes WHERE deleted_at IS NULL
--   - Remove redundant indexes (clerk_user_id, email, status full)
--   - Ensure required indexes exist (deleted_at, created_by, updated_by, status partial, permissions GIN)
--   - Enable RLS and create permissive policy (global table)
--   - Ensure trigger set_updated_at exists
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Replace unique indexes with partial unique indexes
-- ============================================================================

DROP INDEX IF EXISTS adm_provider_employees_clerk_user_id_deleted_at_key;
DROP INDEX IF EXISTS adm_provider_employees_email_deleted_at_key;

CREATE UNIQUE INDEX IF NOT EXISTS adm_provider_employees_clerk_user_id_uq
  ON adm_provider_employees(clerk_user_id)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS adm_provider_employees_email_uq
  ON adm_provider_employees(email)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 2: Remove redundant indexes
-- ============================================================================

DROP INDEX IF EXISTS adm_provider_employees_clerk_user_id_idx;
DROP INDEX IF EXISTS adm_provider_employees_email_idx;
DROP INDEX IF EXISTS adm_provider_employees_status_idx;

-- ============================================================================
-- STEP 3: Ensure required indexes exist
-- ============================================================================

CREATE INDEX IF NOT EXISTS adm_provider_employees_deleted_at_idx ON adm_provider_employees(deleted_at);
CREATE INDEX IF NOT EXISTS adm_provider_employees_created_by_idx ON adm_provider_employees(created_by);
CREATE INDEX IF NOT EXISTS adm_provider_employees_updated_by_idx ON adm_provider_employees(updated_by);
CREATE INDEX IF NOT EXISTS adm_provider_employees_status_active_idx
  ON adm_provider_employees(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS adm_provider_employees_permissions_gin
  ON adm_provider_employees USING GIN(permissions);

-- ============================================================================
-- STEP 4: Enable RLS and create permissive policy
-- ============================================================================

ALTER TABLE adm_provider_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS temp_allow_all_adm_provider_employees ON adm_provider_employees;

CREATE POLICY temp_allow_all_adm_provider_employees ON adm_provider_employees
  FOR ALL TO authenticated
  USING (true);

-- ============================================================================
-- STEP 5: Ensure trigger exists
-- ============================================================================

DROP TRIGGER IF EXISTS update_adm_provider_employees_updated_at ON adm_provider_employees;
DROP TRIGGER IF EXISTS set_updated_at_adm_provider_employees ON adm_provider_employees;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_adm_provider_employees
  BEFORE UPDATE ON adm_provider_employees
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMIT;
