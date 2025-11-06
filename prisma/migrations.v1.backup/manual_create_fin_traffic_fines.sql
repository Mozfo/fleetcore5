-- =====================================================
-- Migration: Create/Update fin_traffic_fines table
-- Description: Traffic fines for drivers with full audit trail
-- =====================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS fin_traffic_fines (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  fine_reference TEXT NOT NULL,
  fine_date DATE NOT NULL,
  fine_type TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
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

-- Add columns if they don't exist
DO $$
BEGIN
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS id UUID DEFAULT extensions.uuid_generate_v4();
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS tenant_id UUID;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS driver_id UUID;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS vehicle_id UUID;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS fine_reference TEXT;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS fine_date DATE;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS fine_type TEXT;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS amount NUMERIC(14,2);
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS currency VARCHAR(3);
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS updated_by UUID;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS deleted_by UUID;
  ALTER TABLE fin_traffic_fines ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
END $$;

-- Drop existing check constraints
ALTER TABLE fin_traffic_fines DROP CONSTRAINT IF EXISTS fin_traffic_fines_amount_check;
ALTER TABLE fin_traffic_fines DROP CONSTRAINT IF EXISTS fin_traffic_fines_status_check;

-- Add check constraints
ALTER TABLE fin_traffic_fines ADD CONSTRAINT fin_traffic_fines_amount_check CHECK (amount >= 0);
ALTER TABLE fin_traffic_fines ADD CONSTRAINT fin_traffic_fines_status_check CHECK (status IN ('pending','paid','disputed','cancelled'));

-- Drop existing foreign keys
ALTER TABLE fin_traffic_fines DROP CONSTRAINT IF EXISTS fin_traffic_fines_tenant_id_fkey;
ALTER TABLE fin_traffic_fines DROP CONSTRAINT IF EXISTS fin_traffic_fines_driver_id_fkey;
ALTER TABLE fin_traffic_fines DROP CONSTRAINT IF EXISTS fin_traffic_fines_vehicle_id_fkey;
ALTER TABLE fin_traffic_fines DROP CONSTRAINT IF EXISTS fin_traffic_fines_created_by_fkey;
ALTER TABLE fin_traffic_fines DROP CONSTRAINT IF EXISTS fin_traffic_fines_updated_by_fkey;
ALTER TABLE fin_traffic_fines DROP CONSTRAINT IF EXISTS fin_traffic_fines_deleted_by_fkey;

-- Add foreign keys
ALTER TABLE fin_traffic_fines ADD CONSTRAINT fin_traffic_fines_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE fin_traffic_fines ADD CONSTRAINT fin_traffic_fines_driver_id_fkey
  FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE fin_traffic_fines ADD CONSTRAINT fin_traffic_fines_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE fin_traffic_fines ADD CONSTRAINT fin_traffic_fines_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE fin_traffic_fines ADD CONSTRAINT fin_traffic_fines_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE fin_traffic_fines ADD CONSTRAINT fin_traffic_fines_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop existing indexes
DROP INDEX IF EXISTS fin_traffic_fines_tenant_id_idx;
DROP INDEX IF EXISTS fin_traffic_fines_driver_id_idx;
DROP INDEX IF EXISTS fin_traffic_fines_vehicle_id_idx;
DROP INDEX IF EXISTS fin_traffic_fines_fine_date_idx;
DROP INDEX IF EXISTS fin_traffic_fines_status_active_idx;
DROP INDEX IF EXISTS fin_traffic_fines_deleted_at_idx;
DROP INDEX IF EXISTS fin_traffic_fines_created_by_idx;
DROP INDEX IF EXISTS fin_traffic_fines_updated_by_idx;
DROP INDEX IF EXISTS fin_traffic_fines_metadata_idx;
DROP INDEX IF EXISTS fin_traffic_fines_tenant_id_fine_reference_key;

-- Create indexes
CREATE INDEX IF NOT EXISTS fin_traffic_fines_tenant_id_idx ON fin_traffic_fines(tenant_id);
CREATE INDEX IF NOT EXISTS fin_traffic_fines_driver_id_idx ON fin_traffic_fines(driver_id);
CREATE INDEX IF NOT EXISTS fin_traffic_fines_vehicle_id_idx ON fin_traffic_fines(vehicle_id);
CREATE INDEX IF NOT EXISTS fin_traffic_fines_fine_date_idx ON fin_traffic_fines(fine_date DESC);
CREATE INDEX IF NOT EXISTS fin_traffic_fines_status_active_idx ON fin_traffic_fines(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS fin_traffic_fines_deleted_at_idx ON fin_traffic_fines(deleted_at);
CREATE INDEX IF NOT EXISTS fin_traffic_fines_created_by_idx ON fin_traffic_fines(created_by);
CREATE INDEX IF NOT EXISTS fin_traffic_fines_updated_by_idx ON fin_traffic_fines(updated_by);
CREATE INDEX IF NOT EXISTS fin_traffic_fines_metadata_idx ON fin_traffic_fines USING GIN(metadata);

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS fin_traffic_fines_tenant_id_fine_reference_key
  ON fin_traffic_fines(tenant_id, fine_reference) WHERE deleted_at IS NULL;

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
    WHERE tgname = 'update_fin_traffic_fines_updated_at'
      AND tgrelid = 'fin_traffic_fines'::regclass
  ) THEN
    CREATE TRIGGER update_fin_traffic_fines_updated_at
      BEFORE UPDATE ON fin_traffic_fines
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE fin_traffic_fines ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_fin_traffic_fines ON fin_traffic_fines;
CREATE POLICY tenant_isolation_fin_traffic_fines ON fin_traffic_fines
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_fin_traffic_fines ON fin_traffic_fines;
CREATE POLICY temp_allow_all_fin_traffic_fines ON fin_traffic_fines
  FOR ALL TO authenticated
  USING (true);
