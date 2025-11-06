-- ============================================================================
-- Migration: Create rid_driver_requests table
-- Description: Tracks driver requests (leave, availability, license renewals)
-- Domain: RID (Drivers)
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.rid_driver_requests (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  request_date DATE NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  resolution_notes TEXT,
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
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS driver_id UUID NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS request_date DATE NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS created_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS updated_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS deleted_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add check constraint for status
DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests
    ADD CONSTRAINT rid_driver_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests
    ADD CONSTRAINT rid_driver_requests_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests
    ADD CONSTRAINT rid_driver_requests_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests
    ADD CONSTRAINT rid_driver_requests_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests
    ADD CONSTRAINT rid_driver_requests_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_requests
    ADD CONSTRAINT rid_driver_requests_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS rid_driver_requests_tenant_id_idx
  ON rid_driver_requests(tenant_id);

CREATE INDEX IF NOT EXISTS rid_driver_requests_driver_id_idx
  ON rid_driver_requests(driver_id);

CREATE INDEX IF NOT EXISTS rid_driver_requests_request_type_idx
  ON rid_driver_requests(request_type);

CREATE INDEX IF NOT EXISTS rid_driver_requests_request_date_idx
  ON rid_driver_requests(request_date);

CREATE INDEX IF NOT EXISTS rid_driver_requests_status_active_idx
  ON rid_driver_requests(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rid_driver_requests_deleted_at_idx
  ON rid_driver_requests(deleted_at);

CREATE INDEX IF NOT EXISTS rid_driver_requests_created_by_idx
  ON rid_driver_requests(created_by);

CREATE INDEX IF NOT EXISTS rid_driver_requests_updated_by_idx
  ON rid_driver_requests(updated_by);

CREATE INDEX IF NOT EXISTS rid_driver_requests_details_gin
  ON rid_driver_requests USING GIN(details);

-- Create partial unique index
DROP INDEX IF EXISTS rid_driver_requests_tenant_driver_date_type_key;
CREATE UNIQUE INDEX rid_driver_requests_tenant_driver_date_type_key
  ON rid_driver_requests(tenant_id, driver_id, request_date, request_type)
  WHERE deleted_at IS NULL;

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
    WHERE tgname = 'update_rid_driver_requests_updated_at'
      AND tgrelid = 'rid_driver_requests'::regclass
  ) THEN
    CREATE TRIGGER update_rid_driver_requests_updated_at
      BEFORE UPDATE ON rid_driver_requests
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE rid_driver_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_rid_driver_requests ON rid_driver_requests;
CREATE POLICY tenant_isolation_rid_driver_requests ON rid_driver_requests
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_rid_driver_requests ON rid_driver_requests;
CREATE POLICY temp_allow_all_rid_driver_requests ON rid_driver_requests
  FOR ALL TO authenticated
  USING (true);

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✓ rid_driver_requests table created successfully';
  RAISE NOTICE '   - Primary key: id (UUID)';
  RAISE NOTICE '   - Foreign keys: 5 (tenant, driver, audit fields)';
  RAISE NOTICE '   - Partial unique index: (tenant_id, driver_id, request_date, request_type) WHERE deleted_at IS NULL';
  RAISE NOTICE '   - Indexes: 9 btree (1 partial status) + 1 GIN (details)';
  RAISE NOTICE '   - RLS policies: 2 (tenant_isolation + temp_allow_all)';
  RAISE NOTICE '   - Trigger: update_rid_driver_requests_updated_at';
END $$;
