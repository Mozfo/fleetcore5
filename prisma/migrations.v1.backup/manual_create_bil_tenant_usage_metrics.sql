-- =====================================================
-- Migration: Create/Update bil_tenant_usage_metrics
-- Description: Tenant usage metrics tracking (multi-tenant)
-- =====================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.bil_tenant_usage_metrics (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  metric_name VARCHAR(50) NOT NULL,
  metric_value NUMERIC(18,2) NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL,
  deleted_at TIMESTAMPTZ NULL,
  deleted_by UUID NULL,
  deletion_reason TEXT NULL
);

-- Add columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'tenant_id') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN tenant_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'metric_name') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN metric_name VARCHAR(50) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'metric_value') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN metric_value NUMERIC(18,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'period_start') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN period_start DATE NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'period_end') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN period_end DATE NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'metadata') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'created_at') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'created_by') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN created_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'updated_at') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'updated_by') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN updated_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'deleted_at') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'deleted_by') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN deleted_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_usage_metrics' AND column_name = 'deletion_reason') THEN
    ALTER TABLE bil_tenant_usage_metrics ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Drop existing constraints if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_usage_metrics_period_end_check' AND conrelid = 'bil_tenant_usage_metrics'::regclass) THEN
    ALTER TABLE bil_tenant_usage_metrics DROP CONSTRAINT bil_tenant_usage_metrics_period_end_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_usage_metrics_metric_value_check' AND conrelid = 'bil_tenant_usage_metrics'::regclass) THEN
    ALTER TABLE bil_tenant_usage_metrics DROP CONSTRAINT bil_tenant_usage_metrics_metric_value_check;
  END IF;
END $$;

-- Add check constraints
ALTER TABLE bil_tenant_usage_metrics ADD CONSTRAINT bil_tenant_usage_metrics_period_end_check
  CHECK (period_end >= period_start);

ALTER TABLE bil_tenant_usage_metrics ADD CONSTRAINT bil_tenant_usage_metrics_metric_value_check
  CHECK (metric_value >= 0);

-- Drop existing foreign keys
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_usage_metrics_tenant_id_fkey' AND conrelid = 'bil_tenant_usage_metrics'::regclass) THEN
    ALTER TABLE bil_tenant_usage_metrics DROP CONSTRAINT bil_tenant_usage_metrics_tenant_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_usage_metrics_created_by_fkey' AND conrelid = 'bil_tenant_usage_metrics'::regclass) THEN
    ALTER TABLE bil_tenant_usage_metrics DROP CONSTRAINT bil_tenant_usage_metrics_created_by_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_usage_metrics_updated_by_fkey' AND conrelid = 'bil_tenant_usage_metrics'::regclass) THEN
    ALTER TABLE bil_tenant_usage_metrics DROP CONSTRAINT bil_tenant_usage_metrics_updated_by_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_usage_metrics_deleted_by_fkey' AND conrelid = 'bil_tenant_usage_metrics'::regclass) THEN
    ALTER TABLE bil_tenant_usage_metrics DROP CONSTRAINT bil_tenant_usage_metrics_deleted_by_fkey;
  END IF;
END $$;

-- Add foreign keys
ALTER TABLE bil_tenant_usage_metrics
  ADD CONSTRAINT bil_tenant_usage_metrics_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE bil_tenant_usage_metrics
  ADD CONSTRAINT bil_tenant_usage_metrics_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE bil_tenant_usage_metrics
  ADD CONSTRAINT bil_tenant_usage_metrics_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE bil_tenant_usage_metrics
  ADD CONSTRAINT bil_tenant_usage_metrics_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop and recreate indexes
DROP INDEX IF EXISTS bil_tenant_usage_metrics_tenant_id_metric_name_period_start_key;
DROP INDEX IF EXISTS bil_tenant_usage_metrics_tenant_id_idx;
DROP INDEX IF EXISTS bil_tenant_usage_metrics_metric_name_idx;
DROP INDEX IF EXISTS bil_tenant_usage_metrics_period_start_idx;
DROP INDEX IF EXISTS bil_tenant_usage_metrics_period_end_idx;
DROP INDEX IF EXISTS bil_tenant_usage_metrics_deleted_at_idx;
DROP INDEX IF EXISTS bil_tenant_usage_metrics_created_by_idx;
DROP INDEX IF EXISTS bil_tenant_usage_metrics_updated_by_idx;
DROP INDEX IF EXISTS bil_tenant_usage_metrics_metadata_idx;

CREATE UNIQUE INDEX IF NOT EXISTS bil_tenant_usage_metrics_tenant_id_metric_name_period_start_key
  ON bil_tenant_usage_metrics(tenant_id, metric_name, period_start)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bil_tenant_usage_metrics_tenant_id_idx
  ON bil_tenant_usage_metrics(tenant_id);

CREATE INDEX IF NOT EXISTS bil_tenant_usage_metrics_metric_name_idx
  ON bil_tenant_usage_metrics(metric_name);

CREATE INDEX IF NOT EXISTS bil_tenant_usage_metrics_period_start_idx
  ON bil_tenant_usage_metrics(period_start);

CREATE INDEX IF NOT EXISTS bil_tenant_usage_metrics_period_end_idx
  ON bil_tenant_usage_metrics(period_end);

CREATE INDEX IF NOT EXISTS bil_tenant_usage_metrics_deleted_at_idx
  ON bil_tenant_usage_metrics(deleted_at);

CREATE INDEX IF NOT EXISTS bil_tenant_usage_metrics_created_by_idx
  ON bil_tenant_usage_metrics(created_by);

CREATE INDEX IF NOT EXISTS bil_tenant_usage_metrics_updated_by_idx
  ON bil_tenant_usage_metrics(updated_by);

CREATE INDEX IF NOT EXISTS bil_tenant_usage_metrics_metadata_idx
  ON bil_tenant_usage_metrics USING GIN(metadata);

-- Create trigger function if not exists
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
    WHERE tgname = 'update_bil_tenant_usage_metrics_updated_at'
      AND tgrelid = 'bil_tenant_usage_metrics'::regclass
  ) THEN
    CREATE TRIGGER update_bil_tenant_usage_metrics_updated_at
      BEFORE UPDATE ON bil_tenant_usage_metrics
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE bil_tenant_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_bil_tenant_usage_metrics ON bil_tenant_usage_metrics;

CREATE POLICY tenant_isolation_bil_tenant_usage_metrics ON bil_tenant_usage_metrics
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_bil_tenant_usage_metrics ON bil_tenant_usage_metrics;

CREATE POLICY temp_allow_all_bil_tenant_usage_metrics ON bil_tenant_usage_metrics
  FOR ALL TO authenticated
  USING (true);
