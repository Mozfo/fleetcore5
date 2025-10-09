-- ============================================================
-- Migration: Create or update crm_contracts table
-- ============================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table
CREATE TABLE IF NOT EXISTS crm_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  contract_reference TEXT NOT NULL,
  contract_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE NULL,
  total_value NUMERIC(18,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL,
  deleted_at TIMESTAMPTZ NULL,
  deleted_by UUID NULL,
  deletion_reason TEXT NULL
);

-- Add columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'tenant_id') THEN
    ALTER TABLE crm_contracts ADD COLUMN tenant_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'client_id') THEN
    ALTER TABLE crm_contracts ADD COLUMN client_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'contract_reference') THEN
    ALTER TABLE crm_contracts ADD COLUMN contract_reference TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'contract_date') THEN
    ALTER TABLE crm_contracts ADD COLUMN contract_date DATE NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'effective_date') THEN
    ALTER TABLE crm_contracts ADD COLUMN effective_date DATE NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'expiry_date') THEN
    ALTER TABLE crm_contracts ADD COLUMN expiry_date DATE NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'total_value') THEN
    ALTER TABLE crm_contracts ADD COLUMN total_value NUMERIC(18,2) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'currency') THEN
    ALTER TABLE crm_contracts ADD COLUMN currency VARCHAR(3) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'status') THEN
    ALTER TABLE crm_contracts ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'metadata') THEN
    ALTER TABLE crm_contracts ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'created_at') THEN
    ALTER TABLE crm_contracts ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'created_by') THEN
    ALTER TABLE crm_contracts ADD COLUMN created_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'updated_at') THEN
    ALTER TABLE crm_contracts ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'updated_by') THEN
    ALTER TABLE crm_contracts ADD COLUMN updated_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'deleted_at') THEN
    ALTER TABLE crm_contracts ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'deleted_by') THEN
    ALTER TABLE crm_contracts ADD COLUMN deleted_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_contracts' AND column_name = 'deletion_reason') THEN
    ALTER TABLE crm_contracts ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_contracts_tenant_id_fkey') THEN
    ALTER TABLE crm_contracts ADD CONSTRAINT crm_contracts_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_contracts_created_by_fkey') THEN
    ALTER TABLE crm_contracts ADD CONSTRAINT crm_contracts_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_contracts_updated_by_fkey') THEN
    ALTER TABLE crm_contracts ADD CONSTRAINT crm_contracts_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_contracts_deleted_by_fkey') THEN
    ALTER TABLE crm_contracts ADD CONSTRAINT crm_contracts_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Add check constraints
ALTER TABLE crm_contracts DROP CONSTRAINT IF EXISTS crm_contracts_total_value_check;
ALTER TABLE crm_contracts ADD CONSTRAINT crm_contracts_total_value_check CHECK (total_value >= 0);

ALTER TABLE crm_contracts DROP CONSTRAINT IF EXISTS crm_contracts_status_check;
ALTER TABLE crm_contracts ADD CONSTRAINT crm_contracts_status_check CHECK (status IN ('active','expired','terminated'));

ALTER TABLE crm_contracts DROP CONSTRAINT IF EXISTS crm_contracts_date_check;
ALTER TABLE crm_contracts ADD CONSTRAINT crm_contracts_date_check CHECK (effective_date >= contract_date);

ALTER TABLE crm_contracts DROP CONSTRAINT IF EXISTS crm_contracts_expiry_check;
ALTER TABLE crm_contracts ADD CONSTRAINT crm_contracts_expiry_check CHECK (expiry_date IS NULL OR expiry_date >= effective_date);

-- Drop old indexes
DROP INDEX IF EXISTS crm_contracts_tenant_id_idx;
DROP INDEX IF EXISTS crm_contracts_client_id_idx;
DROP INDEX IF EXISTS crm_contracts_contract_date_idx;
DROP INDEX IF EXISTS crm_contracts_effective_date_idx;
DROP INDEX IF EXISTS crm_contracts_expiry_date_idx;
DROP INDEX IF EXISTS crm_contracts_status_active_idx;
DROP INDEX IF EXISTS crm_contracts_deleted_at_idx;
DROP INDEX IF EXISTS crm_contracts_created_by_idx;
DROP INDEX IF EXISTS crm_contracts_updated_by_idx;
DROP INDEX IF EXISTS crm_contracts_metadata_idx;
DROP INDEX IF EXISTS crm_contracts_tenant_id_contract_reference_deleted_at_key;

-- Create new indexes
CREATE INDEX IF NOT EXISTS crm_contracts_tenant_id_idx ON crm_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS crm_contracts_client_id_idx ON crm_contracts(client_id);
CREATE INDEX IF NOT EXISTS crm_contracts_contract_date_idx ON crm_contracts(contract_date);
CREATE INDEX IF NOT EXISTS crm_contracts_effective_date_idx ON crm_contracts(effective_date);
CREATE INDEX IF NOT EXISTS crm_contracts_expiry_date_idx ON crm_contracts(expiry_date);
CREATE INDEX IF NOT EXISTS crm_contracts_status_active_idx ON crm_contracts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_contracts_deleted_at_idx ON crm_contracts(deleted_at);
CREATE INDEX IF NOT EXISTS crm_contracts_created_by_idx ON crm_contracts(created_by);
CREATE INDEX IF NOT EXISTS crm_contracts_updated_by_idx ON crm_contracts(updated_by);
CREATE INDEX IF NOT EXISTS crm_contracts_metadata_idx ON crm_contracts USING GIN(metadata);

-- Create unique partial index for active contracts
CREATE UNIQUE INDEX IF NOT EXISTS crm_contracts_tenant_id_contract_reference_deleted_at_key
  ON crm_contracts(tenant_id, contract_reference) WHERE deleted_at IS NULL;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_crm_contracts_updated_at'
      AND tgrelid = 'crm_contracts'::regclass
  ) THEN
    CREATE TRIGGER update_crm_contracts_updated_at
      BEFORE UPDATE ON crm_contracts
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE crm_contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_crm_contracts ON crm_contracts;
CREATE POLICY tenant_isolation_crm_contracts ON crm_contracts
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_crm_contracts ON crm_contracts;
CREATE POLICY temp_allow_all_crm_contracts ON crm_contracts
  FOR ALL TO authenticated
  USING (true);
