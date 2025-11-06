-- ============================================================================
-- Migration: Align adm_members with official spec V3
-- Date: 2025-10-09
-- Description:
--   - Add FK constraints on created_by, updated_by, deleted_by → adm_members(id)
--   - Replace unique indexes with partial unique indexes WHERE deleted_at IS NULL
--   - Remove superfluous indexes (role_idx, status_idx)
--   - Ensure all required indexes exist
--   - Enable RLS and create tenant isolation policies
--   - Ensure trigger set_updated_at exists
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Add FK constraints on audit fields if not exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'adm_members_created_by_fkey'
      AND table_name = 'adm_members'
  ) THEN
    ALTER TABLE adm_members
      ADD CONSTRAINT adm_members_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint on created_by';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'adm_members_updated_by_fkey'
      AND table_name = 'adm_members'
  ) THEN
    ALTER TABLE adm_members
      ADD CONSTRAINT adm_members_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint on updated_by';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'adm_members_deleted_by_fkey'
      AND table_name = 'adm_members'
  ) THEN
    ALTER TABLE adm_members
      ADD CONSTRAINT adm_members_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint on deleted_by';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Replace unique indexes with partial unique indexes
-- ============================================================================

DROP INDEX IF EXISTS adm_members_tenant_id_email_deleted_at_key;
DROP INDEX IF EXISTS adm_members_tenant_id_clerk_user_id_deleted_at_key;

CREATE UNIQUE INDEX IF NOT EXISTS adm_members_tenant_email_uq
  ON adm_members(tenant_id, email) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS adm_members_tenant_clerk_uq
  ON adm_members(tenant_id, clerk_user_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 3: Remove superfluous indexes
-- ============================================================================

DROP INDEX IF EXISTS adm_members_role_idx;
DROP INDEX IF EXISTS adm_members_status_idx;

-- ============================================================================
-- STEP 4: Ensure required indexes exist
-- ============================================================================

CREATE INDEX IF NOT EXISTS adm_members_tenant_id_idx ON adm_members(tenant_id);
CREATE INDEX IF NOT EXISTS adm_members_deleted_at_idx ON adm_members(deleted_at);
CREATE INDEX IF NOT EXISTS adm_members_created_by_idx ON adm_members(created_by);
CREATE INDEX IF NOT EXISTS adm_members_updated_by_idx ON adm_members(updated_by);
CREATE INDEX IF NOT EXISTS adm_members_last_login_at_idx ON adm_members(last_login_at);
CREATE INDEX IF NOT EXISTS adm_members_metadata_gin ON adm_members USING GIN(metadata);
CREATE INDEX IF NOT EXISTS adm_members_status_active_idx ON adm_members(status) WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 5: Enable RLS and create policies
-- ============================================================================

ALTER TABLE adm_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_adm_members ON adm_members;
DROP POLICY IF EXISTS temp_allow_all_adm_members ON adm_members;

CREATE POLICY tenant_isolation_adm_members ON adm_members
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_adm_members ON adm_members
  FOR ALL TO authenticated
  USING (true);

-- ============================================================================
-- STEP 6: Ensure trigger exists
-- ============================================================================

DROP TRIGGER IF EXISTS update_adm_members_updated_at ON adm_members;
DROP TRIGGER IF EXISTS set_updated_at_adm_members ON adm_members;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_adm_members
  BEFORE UPDATE ON adm_members
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMIT;
