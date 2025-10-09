-- =====================================================
-- Migration: Create/Update rev_driver_revenues table
-- Description: Driver revenue aggregates by period with multi-tenant support
-- =====================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS rev_driver_revenues (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  net_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT
);

-- Add columns if they don't exist
DO $$
BEGIN
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS id UUID DEFAULT extensions.uuid_generate_v4();
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS tenant_id UUID;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS driver_id UUID;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS period_start DATE;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS period_end DATE;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(18,2) DEFAULT 0;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(18,2) DEFAULT 0;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS net_revenue NUMERIC(18,2) DEFAULT 0;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS updated_by UUID;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS deleted_by UUID;
  ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
END $$;

-- Drop existing check constraints
ALTER TABLE rev_driver_revenues DROP CONSTRAINT IF EXISTS rev_driver_revenues_period_check;
ALTER TABLE rev_driver_revenues DROP CONSTRAINT IF EXISTS rev_driver_revenues_total_revenue_check;
ALTER TABLE rev_driver_revenues DROP CONSTRAINT IF EXISTS rev_driver_revenues_commission_amount_check;
ALTER TABLE rev_driver_revenues DROP CONSTRAINT IF EXISTS rev_driver_revenues_net_revenue_check;

-- Add check constraints
ALTER TABLE rev_driver_revenues ADD CONSTRAINT rev_driver_revenues_period_check CHECK (period_end >= period_start);
ALTER TABLE rev_driver_revenues ADD CONSTRAINT rev_driver_revenues_total_revenue_check CHECK (total_revenue >= 0);
ALTER TABLE rev_driver_revenues ADD CONSTRAINT rev_driver_revenues_commission_amount_check CHECK (commission_amount >= 0);
ALTER TABLE rev_driver_revenues ADD CONSTRAINT rev_driver_revenues_net_revenue_check CHECK (net_revenue >= 0);

-- Drop existing foreign keys
ALTER TABLE rev_driver_revenues DROP CONSTRAINT IF EXISTS rev_driver_revenues_tenant_id_fkey;
ALTER TABLE rev_driver_revenues DROP CONSTRAINT IF EXISTS rev_driver_revenues_driver_id_fkey;
ALTER TABLE rev_driver_revenues DROP CONSTRAINT IF EXISTS rev_driver_revenues_created_by_fkey;
ALTER TABLE rev_driver_revenues DROP CONSTRAINT IF EXISTS rev_driver_revenues_updated_by_fkey;
ALTER TABLE rev_driver_revenues DROP CONSTRAINT IF EXISTS rev_driver_revenues_deleted_by_fkey;

-- Add foreign keys
ALTER TABLE rev_driver_revenues ADD CONSTRAINT rev_driver_revenues_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE rev_driver_revenues ADD CONSTRAINT rev_driver_revenues_driver_id_fkey
  FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE rev_driver_revenues ADD CONSTRAINT rev_driver_revenues_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE rev_driver_revenues ADD CONSTRAINT rev_driver_revenues_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE rev_driver_revenues ADD CONSTRAINT rev_driver_revenues_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop existing indexes
DROP INDEX IF EXISTS rev_driver_revenues_tenant_id_idx;
DROP INDEX IF EXISTS rev_driver_revenues_driver_id_idx;
DROP INDEX IF EXISTS rev_driver_revenues_period_start_idx;
DROP INDEX IF EXISTS rev_driver_revenues_period_end_idx;
DROP INDEX IF EXISTS rev_driver_revenues_deleted_at_idx;
DROP INDEX IF EXISTS rev_driver_revenues_created_by_idx;
DROP INDEX IF EXISTS rev_driver_revenues_updated_by_idx;
DROP INDEX IF EXISTS rev_driver_revenues_metadata_idx;
DROP INDEX IF EXISTS rev_driver_revenues_tenant_id_driver_id_period_start_key;

-- Create indexes
CREATE INDEX IF NOT EXISTS rev_driver_revenues_tenant_id_idx ON rev_driver_revenues(tenant_id);
CREATE INDEX IF NOT EXISTS rev_driver_revenues_driver_id_idx ON rev_driver_revenues(driver_id);
CREATE INDEX IF NOT EXISTS rev_driver_revenues_period_start_idx ON rev_driver_revenues(period_start DESC);
CREATE INDEX IF NOT EXISTS rev_driver_revenues_period_end_idx ON rev_driver_revenues(period_end DESC);
CREATE INDEX IF NOT EXISTS rev_driver_revenues_deleted_at_idx ON rev_driver_revenues(deleted_at);
CREATE INDEX IF NOT EXISTS rev_driver_revenues_created_by_idx ON rev_driver_revenues(created_by);
CREATE INDEX IF NOT EXISTS rev_driver_revenues_updated_by_idx ON rev_driver_revenues(updated_by);
CREATE INDEX IF NOT EXISTS rev_driver_revenues_metadata_idx ON rev_driver_revenues USING GIN(metadata);

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS rev_driver_revenues_tenant_id_driver_id_period_start_key
  ON rev_driver_revenues(tenant_id, driver_id, period_start) WHERE deleted_at IS NULL;

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
    WHERE tgname = 'update_rev_driver_revenues_updated_at'
      AND tgrelid = 'rev_driver_revenues'::regclass
  ) THEN
    CREATE TRIGGER update_rev_driver_revenues_updated_at
      BEFORE UPDATE ON rev_driver_revenues
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE rev_driver_revenues ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_rev_driver_revenues ON rev_driver_revenues;
CREATE POLICY tenant_isolation_rev_driver_revenues ON rev_driver_revenues
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_rev_driver_revenues ON rev_driver_revenues;
CREATE POLICY temp_allow_all_rev_driver_revenues ON rev_driver_revenues
  FOR ALL TO authenticated
  USING (true);
