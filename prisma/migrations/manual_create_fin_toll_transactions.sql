-- ============================================================================
-- Migration: Create/Update fin_toll_transactions table
-- Description: Toll payments by vehicles and drivers with multi-tenant isolation
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table if not exists
CREATE TABLE IF NOT EXISTS fin_toll_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  toll_gate TEXT NOT NULL,
  toll_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
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
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS driver_id UUID NOT NULL;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS vehicle_id UUID NOT NULL;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS toll_gate TEXT NOT NULL;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS toll_date DATE NOT NULL;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(14,2) NOT NULL;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS updated_by UUID;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS deleted_by UUID;
  ALTER TABLE fin_toll_transactions ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing foreign keys to recreate with correct CASCADE rules
DO $$
BEGIN
  ALTER TABLE fin_toll_transactions DROP CONSTRAINT IF EXISTS fin_toll_transactions_tenant_id_fkey;
  ALTER TABLE fin_toll_transactions DROP CONSTRAINT IF EXISTS fin_toll_transactions_driver_id_fkey;
  ALTER TABLE fin_toll_transactions DROP CONSTRAINT IF EXISTS fin_toll_transactions_vehicle_id_fkey;
  ALTER TABLE fin_toll_transactions DROP CONSTRAINT IF EXISTS fin_toll_transactions_created_by_fkey;
  ALTER TABLE fin_toll_transactions DROP CONSTRAINT IF EXISTS fin_toll_transactions_updated_by_fkey;
  ALTER TABLE fin_toll_transactions DROP CONSTRAINT IF EXISTS fin_toll_transactions_deleted_by_fkey;
END $$;

-- Add foreign keys
DO $$
BEGIN
  ALTER TABLE fin_toll_transactions ADD CONSTRAINT fin_toll_transactions_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE fin_toll_transactions ADD CONSTRAINT fin_toll_transactions_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE fin_toll_transactions ADD CONSTRAINT fin_toll_transactions_vehicle_id_fkey
    FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE fin_toll_transactions ADD CONSTRAINT fin_toll_transactions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  ALTER TABLE fin_toll_transactions ADD CONSTRAINT fin_toll_transactions_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  ALTER TABLE fin_toll_transactions ADD CONSTRAINT fin_toll_transactions_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing check constraints to recreate
ALTER TABLE fin_toll_transactions DROP CONSTRAINT IF EXISTS fin_toll_transactions_amount_check;

-- Add check constraints
DO $$
BEGIN
  ALTER TABLE fin_toll_transactions ADD CONSTRAINT fin_toll_transactions_amount_check
    CHECK (amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing unique constraint to recreate as partial index
ALTER TABLE fin_toll_transactions DROP CONSTRAINT IF EXISTS fin_toll_transactions_tenant_driver_vehicle_date_unique;

-- Drop existing indexes before recreation
DROP INDEX IF EXISTS fin_toll_transactions_tenant_id_idx;
DROP INDEX IF EXISTS fin_toll_transactions_driver_id_idx;
DROP INDEX IF EXISTS fin_toll_transactions_vehicle_id_idx;
DROP INDEX IF EXISTS fin_toll_transactions_toll_date_idx;
DROP INDEX IF EXISTS fin_toll_transactions_deleted_at_idx;
DROP INDEX IF EXISTS fin_toll_transactions_created_by_idx;
DROP INDEX IF EXISTS fin_toll_transactions_updated_by_idx;
DROP INDEX IF EXISTS fin_toll_transactions_metadata_idx;
DROP INDEX IF EXISTS fin_toll_transactions_tenant_driver_vehicle_date_unique;

-- Create indexes
CREATE INDEX IF NOT EXISTS fin_toll_transactions_tenant_id_idx ON fin_toll_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS fin_toll_transactions_driver_id_idx ON fin_toll_transactions(driver_id);
CREATE INDEX IF NOT EXISTS fin_toll_transactions_vehicle_id_idx ON fin_toll_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS fin_toll_transactions_toll_date_idx ON fin_toll_transactions(toll_date DESC);
CREATE INDEX IF NOT EXISTS fin_toll_transactions_deleted_at_idx ON fin_toll_transactions(deleted_at);
CREATE INDEX IF NOT EXISTS fin_toll_transactions_created_by_idx ON fin_toll_transactions(created_by);
CREATE INDEX IF NOT EXISTS fin_toll_transactions_updated_by_idx ON fin_toll_transactions(updated_by);
CREATE INDEX IF NOT EXISTS fin_toll_transactions_metadata_idx ON fin_toll_transactions USING GIN(metadata);

-- Create partial unique index for soft-delete awareness
CREATE UNIQUE INDEX IF NOT EXISTS fin_toll_transactions_tenant_driver_vehicle_date_unique
  ON fin_toll_transactions(tenant_id, driver_id, vehicle_id, toll_date)
  WHERE deleted_at IS NULL;

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
    WHERE tgname = 'update_fin_toll_transactions_updated_at'
      AND tgrelid = 'fin_toll_transactions'::regclass
  ) THEN
    CREATE TRIGGER update_fin_toll_transactions_updated_at
      BEFORE UPDATE ON fin_toll_transactions
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE fin_toll_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS tenant_isolation_fin_toll_transactions ON fin_toll_transactions;
DROP POLICY IF EXISTS temp_allow_all_fin_toll_transactions ON fin_toll_transactions;

-- Create RLS policies
CREATE POLICY tenant_isolation_fin_toll_transactions ON fin_toll_transactions
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_fin_toll_transactions ON fin_toll_transactions
  FOR ALL TO authenticated
  USING (true);
