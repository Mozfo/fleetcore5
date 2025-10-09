-- ============================================================================
-- Migration: Create rid_driver_cooperation_terms table
-- Description: Tracks driver acceptance of cooperation terms with versioning
-- Domain: RID (Drivers)
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.rid_driver_cooperation_terms (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  terms_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ,
  effective_date DATE,
  expiry_date DATE,
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

-- Add columns if table already exists
DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS driver_id UUID NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS terms_version TEXT NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS effective_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS expiry_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS created_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS updated_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS deleted_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add check constraint for status
DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms
    ADD CONSTRAINT rid_driver_cooperation_terms_status_check
    CHECK (status IN ('pending', 'active', 'expired', 'terminated'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms
    ADD CONSTRAINT rid_driver_cooperation_terms_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms
    ADD CONSTRAINT rid_driver_cooperation_terms_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms
    ADD CONSTRAINT rid_driver_cooperation_terms_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms
    ADD CONSTRAINT rid_driver_cooperation_terms_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_cooperation_terms
    ADD CONSTRAINT rid_driver_cooperation_terms_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS rid_driver_cooperation_terms_tenant_id_idx
  ON rid_driver_cooperation_terms(tenant_id);

CREATE INDEX IF NOT EXISTS rid_driver_cooperation_terms_driver_id_idx
  ON rid_driver_cooperation_terms(driver_id);

CREATE INDEX IF NOT EXISTS rid_driver_cooperation_terms_terms_version_idx
  ON rid_driver_cooperation_terms(terms_version);

CREATE INDEX IF NOT EXISTS rid_driver_cooperation_terms_accepted_at_idx
  ON rid_driver_cooperation_terms(accepted_at);

CREATE INDEX IF NOT EXISTS rid_driver_cooperation_terms_effective_date_idx
  ON rid_driver_cooperation_terms(effective_date);

CREATE INDEX IF NOT EXISTS rid_driver_cooperation_terms_expiry_date_idx
  ON rid_driver_cooperation_terms(expiry_date);

CREATE INDEX IF NOT EXISTS rid_driver_cooperation_terms_deleted_at_idx
  ON rid_driver_cooperation_terms(deleted_at);

CREATE INDEX IF NOT EXISTS rid_driver_cooperation_terms_created_by_idx
  ON rid_driver_cooperation_terms(created_by);

CREATE INDEX IF NOT EXISTS rid_driver_cooperation_terms_updated_by_idx
  ON rid_driver_cooperation_terms(updated_by);

CREATE INDEX IF NOT EXISTS rid_driver_cooperation_terms_metadata_gin
  ON rid_driver_cooperation_terms USING GIN(metadata);

-- Create partial unique index
DROP INDEX IF EXISTS rid_driver_cooperation_terms_tenant_driver_version_key;
CREATE UNIQUE INDEX rid_driver_cooperation_terms_tenant_driver_version_key
  ON rid_driver_cooperation_terms(tenant_id, driver_id, terms_version)
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
    WHERE tgname = 'update_rid_driver_cooperation_terms_updated_at'
      AND tgrelid = 'rid_driver_cooperation_terms'::regclass
  ) THEN
    CREATE TRIGGER update_rid_driver_cooperation_terms_updated_at
      BEFORE UPDATE ON rid_driver_cooperation_terms
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE rid_driver_cooperation_terms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_rid_driver_cooperation_terms ON rid_driver_cooperation_terms;
CREATE POLICY tenant_isolation_rid_driver_cooperation_terms ON rid_driver_cooperation_terms
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_rid_driver_cooperation_terms ON rid_driver_cooperation_terms;
CREATE POLICY temp_allow_all_rid_driver_cooperation_terms ON rid_driver_cooperation_terms
  FOR ALL TO authenticated
  USING (true);

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✓ rid_driver_cooperation_terms table created successfully';
  RAISE NOTICE '   - Primary key: id (UUID)';
  RAISE NOTICE '   - Foreign keys: 5 (tenant, driver, audit fields)';
  RAISE NOTICE '   - Partial unique index: (tenant_id, driver_id, terms_version) WHERE deleted_at IS NULL';
  RAISE NOTICE '   - Indexes: 10 btree + 1 GIN (metadata)';
  RAISE NOTICE '   - RLS policies: 2 (tenant_isolation + temp_allow_all)';
  RAISE NOTICE '   - Trigger: update_rid_driver_cooperation_terms_updated_at';
END $$;
