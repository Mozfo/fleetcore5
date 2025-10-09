-- ============================================================================
-- Migration: Create/Update fin_driver_payment_batches table
-- Description: Driver payment batches aggregation with multi-tenant isolation
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table if not exists
CREATE TABLE IF NOT EXISTS fin_driver_payment_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  batch_reference TEXT NOT NULL,
  payment_date DATE NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
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
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS batch_reference TEXT NOT NULL;
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS payment_date DATE NOT NULL;
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18,2) NOT NULL;
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL;
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS updated_by UUID;
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS deleted_by UUID;
  ALTER TABLE fin_driver_payment_batches ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing foreign keys to recreate with correct CASCADE rules
DO $$
BEGIN
  ALTER TABLE fin_driver_payment_batches DROP CONSTRAINT IF EXISTS fin_driver_payment_batches_tenant_id_fkey;
  ALTER TABLE fin_driver_payment_batches DROP CONSTRAINT IF EXISTS fin_driver_payment_batches_created_by_fkey;
  ALTER TABLE fin_driver_payment_batches DROP CONSTRAINT IF EXISTS fin_driver_payment_batches_updated_by_fkey;
  ALTER TABLE fin_driver_payment_batches DROP CONSTRAINT IF EXISTS fin_driver_payment_batches_deleted_by_fkey;
END $$;

-- Add foreign keys
DO $$
BEGIN
  ALTER TABLE fin_driver_payment_batches ADD CONSTRAINT fin_driver_payment_batches_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE fin_driver_payment_batches ADD CONSTRAINT fin_driver_payment_batches_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  ALTER TABLE fin_driver_payment_batches ADD CONSTRAINT fin_driver_payment_batches_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  ALTER TABLE fin_driver_payment_batches ADD CONSTRAINT fin_driver_payment_batches_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing check constraints to recreate
ALTER TABLE fin_driver_payment_batches DROP CONSTRAINT IF EXISTS fin_driver_payment_batches_status_check;
ALTER TABLE fin_driver_payment_batches DROP CONSTRAINT IF EXISTS fin_driver_payment_batches_total_amount_check;

-- Add check constraints
DO $$
BEGIN
  ALTER TABLE fin_driver_payment_batches ADD CONSTRAINT fin_driver_payment_batches_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));
  ALTER TABLE fin_driver_payment_batches ADD CONSTRAINT fin_driver_payment_batches_total_amount_check
    CHECK (total_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing unique constraint to recreate as partial index
ALTER TABLE fin_driver_payment_batches DROP CONSTRAINT IF EXISTS fin_driver_payment_batches_tenant_batch_unique;

-- Drop existing indexes before recreation
DROP INDEX IF EXISTS fin_driver_payment_batches_tenant_id_idx;
DROP INDEX IF EXISTS fin_driver_payment_batches_batch_reference_idx;
DROP INDEX IF EXISTS fin_driver_payment_batches_payment_date_idx;
DROP INDEX IF EXISTS fin_driver_payment_batches_status_active_idx;
DROP INDEX IF EXISTS fin_driver_payment_batches_deleted_at_idx;
DROP INDEX IF EXISTS fin_driver_payment_batches_created_by_idx;
DROP INDEX IF EXISTS fin_driver_payment_batches_updated_by_idx;
DROP INDEX IF EXISTS fin_driver_payment_batches_metadata_idx;
DROP INDEX IF EXISTS fin_driver_payment_batches_tenant_batch_ref_unique;

-- Create indexes
CREATE INDEX IF NOT EXISTS fin_driver_payment_batches_tenant_id_idx ON fin_driver_payment_batches(tenant_id);
CREATE INDEX IF NOT EXISTS fin_driver_payment_batches_batch_reference_idx ON fin_driver_payment_batches(batch_reference);
CREATE INDEX IF NOT EXISTS fin_driver_payment_batches_payment_date_idx ON fin_driver_payment_batches(payment_date DESC);
CREATE INDEX IF NOT EXISTS fin_driver_payment_batches_status_active_idx ON fin_driver_payment_batches(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS fin_driver_payment_batches_deleted_at_idx ON fin_driver_payment_batches(deleted_at);
CREATE INDEX IF NOT EXISTS fin_driver_payment_batches_created_by_idx ON fin_driver_payment_batches(created_by);
CREATE INDEX IF NOT EXISTS fin_driver_payment_batches_updated_by_idx ON fin_driver_payment_batches(updated_by);
CREATE INDEX IF NOT EXISTS fin_driver_payment_batches_metadata_idx ON fin_driver_payment_batches USING GIN(metadata);

-- Create partial unique index for soft-delete awareness
CREATE UNIQUE INDEX IF NOT EXISTS fin_driver_payment_batches_tenant_batch_ref_unique
  ON fin_driver_payment_batches(tenant_id, batch_reference)
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
    WHERE tgname = 'update_fin_driver_payment_batches_updated_at'
      AND tgrelid = 'fin_driver_payment_batches'::regclass
  ) THEN
    CREATE TRIGGER update_fin_driver_payment_batches_updated_at
      BEFORE UPDATE ON fin_driver_payment_batches
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE fin_driver_payment_batches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS tenant_isolation_fin_driver_payment_batches ON fin_driver_payment_batches;
DROP POLICY IF EXISTS temp_allow_all_fin_driver_payment_batches ON fin_driver_payment_batches;

-- Create RLS policies
CREATE POLICY tenant_isolation_fin_driver_payment_batches ON fin_driver_payment_batches
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_fin_driver_payment_batches ON fin_driver_payment_batches
  FOR ALL TO authenticated
  USING (true);
