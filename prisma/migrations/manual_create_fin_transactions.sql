-- ============================================================================
-- Migration: Create/Update fin_transactions table
-- Description: Financial transactions ledger (credits/debits) with multi-tenant isolation
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table if not exists
CREATE TABLE IF NOT EXISTS fin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  reference TEXT NOT NULL,
  description TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT
);

-- Add missing columns (idempotent)
DO $$
BEGIN
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT NOT NULL;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(18,2) NOT NULL;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS reference TEXT NOT NULL;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ NOT NULL;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS updated_by UUID;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS deleted_by UUID;
  ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing foreign keys to recreate with correct CASCADE rules
DO $$
BEGIN
  ALTER TABLE fin_transactions DROP CONSTRAINT IF EXISTS fin_transactions_tenant_id_fkey;
  ALTER TABLE fin_transactions DROP CONSTRAINT IF EXISTS fin_transactions_account_id_fkey;
  ALTER TABLE fin_transactions DROP CONSTRAINT IF EXISTS fin_transactions_created_by_fkey;
  ALTER TABLE fin_transactions DROP CONSTRAINT IF EXISTS fin_transactions_updated_by_fkey;
  ALTER TABLE fin_transactions DROP CONSTRAINT IF EXISTS fin_transactions_deleted_by_fkey;
END $$;

-- Add foreign keys
DO $$
BEGIN
  ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_account_id_fkey
    FOREIGN KEY (account_id) REFERENCES fin_accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing check constraints to recreate
ALTER TABLE fin_transactions DROP CONSTRAINT IF EXISTS fin_transactions_transaction_type_check;
ALTER TABLE fin_transactions DROP CONSTRAINT IF EXISTS fin_transactions_status_check;
ALTER TABLE fin_transactions DROP CONSTRAINT IF EXISTS fin_transactions_amount_check;

-- Add check constraints
DO $$
BEGIN
  ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_transaction_type_check
    CHECK (transaction_type IN ('credit', 'debit'));
  ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_status_check
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));
  ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_amount_check
    CHECK (amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing indexes before recreation
DROP INDEX IF EXISTS fin_transactions_tenant_id_idx;
DROP INDEX IF EXISTS fin_transactions_account_id_idx;
DROP INDEX IF EXISTS fin_transactions_transaction_date_idx;
DROP INDEX IF EXISTS fin_transactions_status_active_idx;
DROP INDEX IF EXISTS fin_transactions_deleted_at_idx;
DROP INDEX IF EXISTS fin_transactions_created_by_idx;
DROP INDEX IF EXISTS fin_transactions_updated_by_idx;
DROP INDEX IF EXISTS fin_transactions_metadata_idx;

-- Create indexes
CREATE INDEX IF NOT EXISTS fin_transactions_tenant_id_idx ON fin_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS fin_transactions_account_id_idx ON fin_transactions(account_id);
CREATE INDEX IF NOT EXISTS fin_transactions_transaction_date_idx ON fin_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS fin_transactions_status_active_idx ON fin_transactions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS fin_transactions_deleted_at_idx ON fin_transactions(deleted_at);
CREATE INDEX IF NOT EXISTS fin_transactions_created_by_idx ON fin_transactions(created_by);
CREATE INDEX IF NOT EXISTS fin_transactions_updated_by_idx ON fin_transactions(updated_by);
CREATE INDEX IF NOT EXISTS fin_transactions_metadata_idx ON fin_transactions USING GIN(metadata);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_fin_transactions_updated_at'
      AND tgrelid = 'fin_transactions'::regclass
  ) THEN
    CREATE TRIGGER update_fin_transactions_updated_at
      BEFORE UPDATE ON fin_transactions
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE fin_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS tenant_isolation_fin_transactions ON fin_transactions;
DROP POLICY IF EXISTS temp_allow_all_fin_transactions ON fin_transactions;

-- Create RLS policies
CREATE POLICY tenant_isolation_fin_transactions ON fin_transactions
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_fin_transactions ON fin_transactions
  FOR ALL TO authenticated
  USING (true);
