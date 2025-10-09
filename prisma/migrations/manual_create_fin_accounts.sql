-- ============================================================================
-- Migration: Create/Update fin_accounts table
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS fin_accounts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  balance NUMERIC(18,2) NOT NULL DEFAULT 0,
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
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4();
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS account_name TEXT NOT NULL;
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL;
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL;
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS balance NUMERIC(18,2) NOT NULL DEFAULT 0;
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS created_by UUID NULL;
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS updated_by UUID NULL;
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS deleted_by UUID NULL;
  ALTER TABLE fin_accounts ADD COLUMN IF NOT EXISTS deletion_reason TEXT NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing foreign keys
DO $$
BEGIN
  ALTER TABLE fin_accounts DROP CONSTRAINT IF EXISTS fin_accounts_tenant_id_fkey;
  ALTER TABLE fin_accounts DROP CONSTRAINT IF EXISTS fin_accounts_created_by_fkey;
  ALTER TABLE fin_accounts DROP CONSTRAINT IF EXISTS fin_accounts_updated_by_fkey;
  ALTER TABLE fin_accounts DROP CONSTRAINT IF EXISTS fin_accounts_deleted_by_fkey;
END $$;

-- Add foreign keys
ALTER TABLE fin_accounts
  ADD CONSTRAINT fin_accounts_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE fin_accounts
  ADD CONSTRAINT fin_accounts_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE fin_accounts
  ADD CONSTRAINT fin_accounts_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE fin_accounts
  ADD CONSTRAINT fin_accounts_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop and recreate check constraints
DO $$
BEGIN
  ALTER TABLE fin_accounts DROP CONSTRAINT IF EXISTS fin_accounts_account_type_check;
  ALTER TABLE fin_accounts ADD CONSTRAINT fin_accounts_account_type_check
    CHECK (account_type IN ('bank', 'cash', 'digital'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE fin_accounts DROP CONSTRAINT IF EXISTS fin_accounts_balance_check;
  ALTER TABLE fin_accounts ADD CONSTRAINT fin_accounts_balance_check
    CHECK (balance >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_fin_accounts_tenant_id;
DROP INDEX IF EXISTS idx_fin_accounts_account_name;
DROP INDEX IF EXISTS idx_fin_accounts_account_type;
DROP INDEX IF EXISTS idx_fin_accounts_currency;
DROP INDEX IF EXISTS idx_fin_accounts_deleted_at;
DROP INDEX IF EXISTS idx_fin_accounts_created_by;
DROP INDEX IF EXISTS idx_fin_accounts_updated_by;
DROP INDEX IF EXISTS idx_fin_accounts_metadata;
DROP INDEX IF EXISTS idx_fin_accounts_tenant_account_unique;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fin_accounts_tenant_id ON fin_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_account_name ON fin_accounts(account_name);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_account_type ON fin_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_currency ON fin_accounts(currency);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_deleted_at ON fin_accounts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_created_by ON fin_accounts(created_by);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_updated_by ON fin_accounts(updated_by);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_metadata ON fin_accounts USING GIN(metadata);

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_fin_accounts_tenant_account_unique
  ON fin_accounts(tenant_id, account_name)
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
    WHERE tgname = 'update_fin_accounts_updated_at'
      AND tgrelid = 'fin_accounts'::regclass
  ) THEN
    CREATE TRIGGER update_fin_accounts_updated_at
      BEFORE UPDATE ON fin_accounts
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE fin_accounts ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_fin_accounts ON fin_accounts;
CREATE POLICY tenant_isolation_fin_accounts ON fin_accounts
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_fin_accounts ON fin_accounts;
CREATE POLICY temp_allow_all_fin_accounts ON fin_accounts
  FOR ALL TO authenticated
  USING (true);
