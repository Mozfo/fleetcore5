-- ============================================================================
-- Migration: Create/Update trp_platform_accounts table
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS trp_platform_accounts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  platform_id UUID NOT NULL,
  account_identifier TEXT NOT NULL,
  api_key TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL,
  deleted_at TIMESTAMPTZ NULL,
  deleted_by UUID NULL,
  deletion_reason TEXT NULL
);

-- Add missing columns if table already exists
DO $$
BEGIN
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4();
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS platform_id UUID NOT NULL;
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS account_identifier TEXT NOT NULL;
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS api_key TEXT NULL;
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS created_by UUID NULL;
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS updated_by UUID NULL;
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS deleted_by UUID NULL;
  ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS deletion_reason TEXT NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing foreign keys
DO $$
BEGIN
  ALTER TABLE trp_platform_accounts DROP CONSTRAINT IF EXISTS trp_platform_accounts_tenant_id_fkey;
  ALTER TABLE trp_platform_accounts DROP CONSTRAINT IF EXISTS trp_platform_accounts_platform_id_fkey;
  ALTER TABLE trp_platform_accounts DROP CONSTRAINT IF EXISTS trp_platform_accounts_created_by_fkey;
  ALTER TABLE trp_platform_accounts DROP CONSTRAINT IF EXISTS trp_platform_accounts_updated_by_fkey;
  ALTER TABLE trp_platform_accounts DROP CONSTRAINT IF EXISTS trp_platform_accounts_deleted_by_fkey;
END $$;

-- Add foreign keys
ALTER TABLE trp_platform_accounts
  ADD CONSTRAINT trp_platform_accounts_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE trp_platform_accounts
  ADD CONSTRAINT trp_platform_accounts_platform_id_fkey
  FOREIGN KEY (platform_id) REFERENCES dir_platforms(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE trp_platform_accounts
  ADD CONSTRAINT trp_platform_accounts_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE trp_platform_accounts
  ADD CONSTRAINT trp_platform_accounts_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE trp_platform_accounts
  ADD CONSTRAINT trp_platform_accounts_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_trp_platform_accounts_tenant_id;
DROP INDEX IF EXISTS idx_trp_platform_accounts_platform_id;
DROP INDEX IF EXISTS idx_trp_platform_accounts_account_identifier;
DROP INDEX IF EXISTS idx_trp_platform_accounts_deleted_at;
DROP INDEX IF EXISTS idx_trp_platform_accounts_created_by;
DROP INDEX IF EXISTS idx_trp_platform_accounts_updated_by;
DROP INDEX IF EXISTS idx_trp_platform_accounts_metadata;
DROP INDEX IF EXISTS idx_trp_platform_accounts_tenant_platform_unique;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trp_platform_accounts_tenant_id ON trp_platform_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trp_platform_accounts_platform_id ON trp_platform_accounts(platform_id);
CREATE INDEX IF NOT EXISTS idx_trp_platform_accounts_account_identifier ON trp_platform_accounts(account_identifier);
CREATE INDEX IF NOT EXISTS idx_trp_platform_accounts_deleted_at ON trp_platform_accounts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_trp_platform_accounts_created_by ON trp_platform_accounts(created_by);
CREATE INDEX IF NOT EXISTS idx_trp_platform_accounts_updated_by ON trp_platform_accounts(updated_by);
CREATE INDEX IF NOT EXISTS idx_trp_platform_accounts_metadata ON trp_platform_accounts USING GIN(metadata);

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_trp_platform_accounts_tenant_platform_unique
  ON trp_platform_accounts(tenant_id, platform_id)
  WHERE deleted_at IS NULL;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_trp_platform_accounts_updated_at'
      AND tgrelid = 'trp_platform_accounts'::regclass
  ) THEN
    CREATE TRIGGER update_trp_platform_accounts_updated_at
      BEFORE UPDATE ON trp_platform_accounts
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE trp_platform_accounts ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_trp_platform_accounts ON trp_platform_accounts;
CREATE POLICY tenant_isolation_trp_platform_accounts ON trp_platform_accounts
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_trp_platform_accounts ON trp_platform_accounts;
CREATE POLICY temp_allow_all_trp_platform_accounts ON trp_platform_accounts
  FOR ALL TO authenticated
  USING (true);
