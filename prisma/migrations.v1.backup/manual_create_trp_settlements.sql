-- ============================================================================
-- Migration: Create/Update trp_settlements table
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS trp_settlements (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  settlement_reference TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  platform_commission NUMERIC(14,2) NOT NULL,
  net_amount NUMERIC(14,2) NOT NULL,
  settlement_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
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
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4();
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS trip_id UUID NOT NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS settlement_reference TEXT NOT NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS amount NUMERIC(14,2) NOT NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS platform_commission NUMERIC(14,2) NOT NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS net_amount NUMERIC(14,2) NOT NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS settlement_date DATE NOT NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS created_by UUID NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS updated_by UUID NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS deleted_by UUID NULL;
  ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS deletion_reason TEXT NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing foreign keys
DO $$
BEGIN
  ALTER TABLE trp_settlements DROP CONSTRAINT IF EXISTS trp_settlements_tenant_id_fkey;
  ALTER TABLE trp_settlements DROP CONSTRAINT IF EXISTS trp_settlements_trip_id_fkey;
  ALTER TABLE trp_settlements DROP CONSTRAINT IF EXISTS trp_settlements_created_by_fkey;
  ALTER TABLE trp_settlements DROP CONSTRAINT IF EXISTS trp_settlements_updated_by_fkey;
  ALTER TABLE trp_settlements DROP CONSTRAINT IF EXISTS trp_settlements_deleted_by_fkey;
END $$;

-- Add foreign keys
ALTER TABLE trp_settlements
  ADD CONSTRAINT trp_settlements_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE trp_settlements
  ADD CONSTRAINT trp_settlements_trip_id_fkey
  FOREIGN KEY (trip_id) REFERENCES trp_trips(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE trp_settlements
  ADD CONSTRAINT trp_settlements_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE trp_settlements
  ADD CONSTRAINT trp_settlements_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE trp_settlements
  ADD CONSTRAINT trp_settlements_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop and recreate check constraints
DO $$
BEGIN
  ALTER TABLE trp_settlements DROP CONSTRAINT IF EXISTS trp_settlements_status_check;
  ALTER TABLE trp_settlements ADD CONSTRAINT trp_settlements_status_check
    CHECK (status IN ('pending', 'settled', 'cancelled'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE trp_settlements DROP CONSTRAINT IF EXISTS trp_settlements_amount_check;
  ALTER TABLE trp_settlements ADD CONSTRAINT trp_settlements_amount_check
    CHECK (amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE trp_settlements DROP CONSTRAINT IF EXISTS trp_settlements_platform_commission_check;
  ALTER TABLE trp_settlements ADD CONSTRAINT trp_settlements_platform_commission_check
    CHECK (platform_commission >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE trp_settlements DROP CONSTRAINT IF EXISTS trp_settlements_net_amount_check;
  ALTER TABLE trp_settlements ADD CONSTRAINT trp_settlements_net_amount_check
    CHECK (net_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_trp_settlements_tenant_id;
DROP INDEX IF EXISTS idx_trp_settlements_trip_id;
DROP INDEX IF EXISTS idx_trp_settlements_settlement_date;
DROP INDEX IF EXISTS idx_trp_settlements_status_active;
DROP INDEX IF EXISTS idx_trp_settlements_deleted_at;
DROP INDEX IF EXISTS idx_trp_settlements_created_by;
DROP INDEX IF EXISTS idx_trp_settlements_updated_by;
DROP INDEX IF EXISTS idx_trp_settlements_metadata;
DROP INDEX IF EXISTS idx_trp_settlements_tenant_trip_ref_unique;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trp_settlements_tenant_id ON trp_settlements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trp_settlements_trip_id ON trp_settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_trp_settlements_settlement_date ON trp_settlements(settlement_date);
CREATE INDEX IF NOT EXISTS idx_trp_settlements_status_active ON trp_settlements(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trp_settlements_deleted_at ON trp_settlements(deleted_at);
CREATE INDEX IF NOT EXISTS idx_trp_settlements_created_by ON trp_settlements(created_by);
CREATE INDEX IF NOT EXISTS idx_trp_settlements_updated_by ON trp_settlements(updated_by);
CREATE INDEX IF NOT EXISTS idx_trp_settlements_metadata ON trp_settlements USING GIN(metadata);

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_trp_settlements_tenant_trip_ref_unique
  ON trp_settlements(tenant_id, trip_id, settlement_reference)
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
    WHERE tgname = 'update_trp_settlements_updated_at'
      AND tgrelid = 'trp_settlements'::regclass
  ) THEN
    CREATE TRIGGER update_trp_settlements_updated_at
      BEFORE UPDATE ON trp_settlements
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE trp_settlements ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_trp_settlements ON trp_settlements;
CREATE POLICY tenant_isolation_trp_settlements ON trp_settlements
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_trp_settlements ON trp_settlements;
CREATE POLICY temp_allow_all_trp_settlements ON trp_settlements
  FOR ALL TO authenticated
  USING (true);
