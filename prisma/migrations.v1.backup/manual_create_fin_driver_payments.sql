-- ============================================================================
-- Migration: Create/Update fin_driver_payments table
-- Description: Individual driver payments linked to payment batches
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table if not exists
CREATE TABLE IF NOT EXISTS fin_driver_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  payment_batch_id UUID NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_date DATE NOT NULL,
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
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS driver_id UUID NOT NULL;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS payment_batch_id UUID NOT NULL;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS amount NUMERIC(18,2) NOT NULL;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS payment_date DATE NOT NULL;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS updated_by UUID;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS deleted_by UUID;
  ALTER TABLE fin_driver_payments ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing foreign keys to recreate with correct CASCADE rules
DO $$
BEGIN
  ALTER TABLE fin_driver_payments DROP CONSTRAINT IF EXISTS fin_driver_payments_tenant_id_fkey;
  ALTER TABLE fin_driver_payments DROP CONSTRAINT IF EXISTS fin_driver_payments_driver_id_fkey;
  ALTER TABLE fin_driver_payments DROP CONSTRAINT IF EXISTS fin_driver_payments_payment_batch_id_fkey;
  ALTER TABLE fin_driver_payments DROP CONSTRAINT IF EXISTS fin_driver_payments_created_by_fkey;
  ALTER TABLE fin_driver_payments DROP CONSTRAINT IF EXISTS fin_driver_payments_updated_by_fkey;
  ALTER TABLE fin_driver_payments DROP CONSTRAINT IF EXISTS fin_driver_payments_deleted_by_fkey;
END $$;

-- Add foreign keys
DO $$
BEGIN
  ALTER TABLE fin_driver_payments ADD CONSTRAINT fin_driver_payments_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE fin_driver_payments ADD CONSTRAINT fin_driver_payments_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE fin_driver_payments ADD CONSTRAINT fin_driver_payments_payment_batch_id_fkey
    FOREIGN KEY (payment_batch_id) REFERENCES fin_driver_payment_batches(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE fin_driver_payments ADD CONSTRAINT fin_driver_payments_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  ALTER TABLE fin_driver_payments ADD CONSTRAINT fin_driver_payments_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  ALTER TABLE fin_driver_payments ADD CONSTRAINT fin_driver_payments_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing check constraints to recreate
ALTER TABLE fin_driver_payments DROP CONSTRAINT IF EXISTS fin_driver_payments_amount_check;
ALTER TABLE fin_driver_payments DROP CONSTRAINT IF EXISTS fin_driver_payments_status_check;

-- Add check constraints
DO $$
BEGIN
  ALTER TABLE fin_driver_payments ADD CONSTRAINT fin_driver_payments_amount_check
    CHECK (amount >= 0);
  ALTER TABLE fin_driver_payments ADD CONSTRAINT fin_driver_payments_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing indexes before recreation
DROP INDEX IF EXISTS fin_driver_payments_tenant_id_idx;
DROP INDEX IF EXISTS fin_driver_payments_driver_id_idx;
DROP INDEX IF EXISTS fin_driver_payments_payment_batch_id_idx;
DROP INDEX IF EXISTS fin_driver_payments_status_active_idx;
DROP INDEX IF EXISTS fin_driver_payments_payment_date_idx;
DROP INDEX IF EXISTS fin_driver_payments_deleted_at_idx;
DROP INDEX IF EXISTS fin_driver_payments_created_by_idx;
DROP INDEX IF EXISTS fin_driver_payments_updated_by_idx;
DROP INDEX IF EXISTS fin_driver_payments_metadata_idx;

-- Create indexes
CREATE INDEX IF NOT EXISTS fin_driver_payments_tenant_id_idx ON fin_driver_payments(tenant_id);
CREATE INDEX IF NOT EXISTS fin_driver_payments_driver_id_idx ON fin_driver_payments(driver_id);
CREATE INDEX IF NOT EXISTS fin_driver_payments_payment_batch_id_idx ON fin_driver_payments(payment_batch_id);
CREATE INDEX IF NOT EXISTS fin_driver_payments_status_active_idx ON fin_driver_payments(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS fin_driver_payments_payment_date_idx ON fin_driver_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS fin_driver_payments_deleted_at_idx ON fin_driver_payments(deleted_at);
CREATE INDEX IF NOT EXISTS fin_driver_payments_created_by_idx ON fin_driver_payments(created_by);
CREATE INDEX IF NOT EXISTS fin_driver_payments_updated_by_idx ON fin_driver_payments(updated_by);
CREATE INDEX IF NOT EXISTS fin_driver_payments_metadata_idx ON fin_driver_payments USING GIN(metadata);

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
    WHERE tgname = 'update_fin_driver_payments_updated_at'
      AND tgrelid = 'fin_driver_payments'::regclass
  ) THEN
    CREATE TRIGGER update_fin_driver_payments_updated_at
      BEFORE UPDATE ON fin_driver_payments
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE fin_driver_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS tenant_isolation_fin_driver_payments ON fin_driver_payments;
DROP POLICY IF EXISTS temp_allow_all_fin_driver_payments ON fin_driver_payments;

-- Create RLS policies
CREATE POLICY tenant_isolation_fin_driver_payments ON fin_driver_payments
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_fin_driver_payments ON fin_driver_payments
  FOR ALL TO authenticated
  USING (true);
