-- ============================================================================
-- Migration: Create rid_driver_training table
-- Description: Tracks driver training and certifications
-- Domain: RID (Drivers)
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.rid_driver_training (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  training_name TEXT NOT NULL,
  provider TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'expired', 'cancelled')),
  assigned_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  certificate_url TEXT,
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
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS driver_id UUID NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS training_name TEXT NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS provider TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'planned';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS score NUMERIC(5,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS certificate_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS created_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS updated_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS deleted_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add check constraints
DO $$
BEGIN
  ALTER TABLE public.rid_driver_training
    ADD CONSTRAINT rid_driver_training_status_check
    CHECK (status IN ('planned', 'in_progress', 'completed', 'expired', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training
    ADD CONSTRAINT rid_driver_training_score_check
    CHECK (score >= 0 AND score <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  ALTER TABLE public.rid_driver_training
    ADD CONSTRAINT rid_driver_training_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training
    ADD CONSTRAINT rid_driver_training_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training
    ADD CONSTRAINT rid_driver_training_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training
    ADD CONSTRAINT rid_driver_training_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_training
    ADD CONSTRAINT rid_driver_training_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS rid_driver_training_tenant_id_idx
  ON rid_driver_training(tenant_id);

CREATE INDEX IF NOT EXISTS rid_driver_training_driver_id_idx
  ON rid_driver_training(driver_id);

CREATE INDEX IF NOT EXISTS rid_driver_training_training_name_idx
  ON rid_driver_training(training_name);

CREATE INDEX IF NOT EXISTS rid_driver_training_status_active_idx
  ON rid_driver_training(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rid_driver_training_due_at_idx
  ON rid_driver_training(due_at);

CREATE INDEX IF NOT EXISTS rid_driver_training_deleted_at_idx
  ON rid_driver_training(deleted_at);

CREATE INDEX IF NOT EXISTS rid_driver_training_created_by_idx
  ON rid_driver_training(created_by);

CREATE INDEX IF NOT EXISTS rid_driver_training_updated_by_idx
  ON rid_driver_training(updated_by);

CREATE INDEX IF NOT EXISTS rid_driver_training_metadata_gin
  ON rid_driver_training USING GIN(metadata);

-- Create partial unique index
DROP INDEX IF EXISTS rid_driver_training_tenant_driver_name_key;
CREATE UNIQUE INDEX rid_driver_training_tenant_driver_name_key
  ON rid_driver_training(tenant_id, driver_id, training_name)
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
    WHERE tgname = 'update_rid_driver_training_updated_at'
      AND tgrelid = 'rid_driver_training'::regclass
  ) THEN
    CREATE TRIGGER update_rid_driver_training_updated_at
      BEFORE UPDATE ON rid_driver_training
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE rid_driver_training ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_rid_driver_training ON rid_driver_training;
CREATE POLICY tenant_isolation_rid_driver_training ON rid_driver_training
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_rid_driver_training ON rid_driver_training;
CREATE POLICY temp_allow_all_rid_driver_training ON rid_driver_training
  FOR ALL TO authenticated
  USING (true);

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✓ rid_driver_training table created successfully';
  RAISE NOTICE '   - Primary key: id (UUID)';
  RAISE NOTICE '   - Foreign keys: 5 (tenant, driver, audit fields)';
  RAISE NOTICE '   - Partial unique index: (tenant_id, driver_id, training_name) WHERE deleted_at IS NULL';
  RAISE NOTICE '   - Indexes: 9 btree (1 partial status) + 1 GIN (metadata)';
  RAISE NOTICE '   - Check constraints: 2 (status values, score 0-100)';
  RAISE NOTICE '   - RLS policies: 2 (tenant_isolation + temp_allow_all)';
  RAISE NOTICE '   - Trigger: update_rid_driver_training_updated_at';
END $$;
