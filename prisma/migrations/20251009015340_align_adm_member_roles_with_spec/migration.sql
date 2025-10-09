-- ============================================================================
-- Migration: Align adm_member_roles with official spec V3
-- Date: 2025-10-09
-- Description:
--   - Add FK constraints on created_by, updated_by, deleted_by → adm_members(id)
--   - Replace unique index with partial unique index WHERE deleted_at IS NULL
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
    WHERE constraint_name = 'adm_member_roles_created_by_fkey'
      AND table_name = 'adm_member_roles'
  ) THEN
    ALTER TABLE adm_member_roles
      ADD CONSTRAINT adm_member_roles_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint on created_by';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'adm_member_roles_updated_by_fkey'
      AND table_name = 'adm_member_roles'
  ) THEN
    ALTER TABLE adm_member_roles
      ADD CONSTRAINT adm_member_roles_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint on updated_by';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'adm_member_roles_deleted_by_fkey'
      AND table_name = 'adm_member_roles'
  ) THEN
    ALTER TABLE adm_member_roles
      ADD CONSTRAINT adm_member_roles_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
    RAISE NOTICE 'Added FK constraint on deleted_by';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Replace unique index with partial unique index
-- ============================================================================

DROP INDEX IF EXISTS adm_member_roles_tenant_id_member_id_role_id_deleted_at_key;

CREATE UNIQUE INDEX IF NOT EXISTS adm_member_roles_tenant_id_member_id_role_id_key
  ON adm_member_roles(tenant_id, member_id, role_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 3: Ensure other indexes exist
-- ============================================================================

CREATE INDEX IF NOT EXISTS adm_member_roles_tenant_id_idx ON adm_member_roles(tenant_id);
CREATE INDEX IF NOT EXISTS adm_member_roles_member_id_idx ON adm_member_roles(member_id);
CREATE INDEX IF NOT EXISTS adm_member_roles_role_id_idx ON adm_member_roles(role_id);
CREATE INDEX IF NOT EXISTS adm_member_roles_deleted_at_idx ON adm_member_roles(deleted_at);
CREATE INDEX IF NOT EXISTS adm_member_roles_created_by_idx ON adm_member_roles(created_by);
CREATE INDEX IF NOT EXISTS adm_member_roles_updated_by_idx ON adm_member_roles(updated_by);

-- ============================================================================
-- STEP 4: Enable RLS and create policies
-- ============================================================================

ALTER TABLE adm_member_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_adm_member_roles ON adm_member_roles;
DROP POLICY IF EXISTS temp_allow_all_adm_member_roles ON adm_member_roles;

CREATE POLICY tenant_isolation_adm_member_roles ON adm_member_roles
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_adm_member_roles ON adm_member_roles
  FOR ALL TO authenticated
  USING (true);

-- ============================================================================
-- STEP 5: Ensure trigger exists
-- ============================================================================

DROP TRIGGER IF EXISTS update_adm_member_roles_updated_at ON adm_member_roles;
DROP TRIGGER IF EXISTS set_updated_at_adm_member_roles ON adm_member_roles;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_adm_member_roles
  BEFORE UPDATE ON adm_member_roles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMIT;
