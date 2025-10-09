-- ============================================================================
-- Migration: Create rid_driver_blacklists table
-- Description: Tracks drivers placed on blacklist by tenant with reason and period
-- Domain: RID (Drivers)
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.rid_driver_blacklists (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  reason TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT
);

-- Add columns if table already exists
DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS driver_id UUID NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS reason TEXT NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS created_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS updated_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS deleted_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add check constraints
DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists
    ADD CONSTRAINT rid_driver_blacklists_status_check
    CHECK (status IN ('active', 'inactive'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists
    ADD CONSTRAINT rid_driver_blacklists_date_check
    CHECK (end_date IS NULL OR end_date >= start_date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists
    ADD CONSTRAINT rid_driver_blacklists_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists
    ADD CONSTRAINT rid_driver_blacklists_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists
    ADD CONSTRAINT rid_driver_blacklists_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists
    ADD CONSTRAINT rid_driver_blacklists_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_blacklists
    ADD CONSTRAINT rid_driver_blacklists_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS rid_driver_blacklists_tenant_id_idx
  ON rid_driver_blacklists(tenant_id);

CREATE INDEX IF NOT EXISTS rid_driver_blacklists_driver_id_idx
  ON rid_driver_blacklists(driver_id);

CREATE INDEX IF NOT EXISTS rid_driver_blacklists_start_date_idx
  ON rid_driver_blacklists(start_date);

CREATE INDEX IF NOT EXISTS rid_driver_blacklists_end_date_idx
  ON rid_driver_blacklists(end_date);

CREATE INDEX IF NOT EXISTS rid_driver_blacklists_status_active_idx
  ON rid_driver_blacklists(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rid_driver_blacklists_deleted_at_idx
  ON rid_driver_blacklists(deleted_at);

CREATE INDEX IF NOT EXISTS rid_driver_blacklists_created_by_idx
  ON rid_driver_blacklists(created_by);

CREATE INDEX IF NOT EXISTS rid_driver_blacklists_updated_by_idx
  ON rid_driver_blacklists(updated_by);

CREATE INDEX IF NOT EXISTS rid_driver_blacklists_metadata_gin
  ON rid_driver_blacklists USING GIN(metadata);

-- Create partial unique index
DROP INDEX IF EXISTS rid_driver_blacklists_tenant_driver_active_key;
CREATE UNIQUE INDEX rid_driver_blacklists_tenant_driver_active_key
  ON rid_driver_blacklists(tenant_id, driver_id)
  WHERE deleted_at IS NULL AND status = 'active';

-- Create or replace trigger function for updated_at
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
    WHERE tgname = 'update_rid_driver_blacklists_updated_at'
      AND tgrelid = 'rid_driver_blacklists'::regclass
  ) THEN
    CREATE TRIGGER update_rid_driver_blacklists_updated_at
      BEFORE UPDATE ON rid_driver_blacklists
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE rid_driver_blacklists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_rid_driver_blacklists ON rid_driver_blacklists;
CREATE POLICY tenant_isolation_rid_driver_blacklists ON rid_driver_blacklists
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_rid_driver_blacklists ON rid_driver_blacklists;
CREATE POLICY temp_allow_all_rid_driver_blacklists ON rid_driver_blacklists
  FOR ALL TO authenticated
  USING (true);

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✓ rid_driver_blacklists table created successfully';
  RAISE NOTICE '   - Primary key: id (UUID)';
  RAISE NOTICE '   - Foreign keys: 5 (tenant, driver, audit fields)';
  RAISE NOTICE '   - Partial unique index: (tenant_id, driver_id) WHERE deleted_at IS NULL AND status = active';
  RAISE NOTICE '   - Indexes: 9 btree (1 partial status) + 1 GIN (metadata)';
  RAISE NOTICE '   - Check constraints: 2 (status values, end_date >= start_date)';
  RAISE NOTICE '   - RLS policies: 2 (tenant_isolation + temp_allow_all)';
  RAISE NOTICE '   - Trigger: update_rid_driver_blacklists_updated_at';
END $$;
