-- =====================================================
-- Migration: Create/Update bil_billing_plans
-- Description: SaaS billing plans table (global, non-tenant)
-- =====================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.bil_billing_plans (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  plan_name TEXT NOT NULL,
  description TEXT NULL,
  monthly_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
  annual_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'plan_name') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN plan_name TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'description') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN description TEXT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'monthly_fee') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN monthly_fee NUMERIC(14,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'annual_fee') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN annual_fee NUMERIC(14,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'currency') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN currency VARCHAR(3) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'features') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN features JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'status') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'metadata') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'created_at') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'created_by') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN created_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'updated_at') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'updated_by') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN updated_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'deleted_at') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'deleted_by') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN deleted_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_billing_plans' AND column_name = 'deletion_reason') THEN
    ALTER TABLE bil_billing_plans ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Drop existing constraints if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_billing_plans_status_check' AND conrelid = 'bil_billing_plans'::regclass) THEN
    ALTER TABLE bil_billing_plans DROP CONSTRAINT bil_billing_plans_status_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_billing_plans_monthly_fee_check' AND conrelid = 'bil_billing_plans'::regclass) THEN
    ALTER TABLE bil_billing_plans DROP CONSTRAINT bil_billing_plans_monthly_fee_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_billing_plans_annual_fee_check' AND conrelid = 'bil_billing_plans'::regclass) THEN
    ALTER TABLE bil_billing_plans DROP CONSTRAINT bil_billing_plans_annual_fee_check;
  END IF;
END $$;

-- Add check constraints
ALTER TABLE bil_billing_plans ADD CONSTRAINT bil_billing_plans_status_check
  CHECK (status IN ('active', 'inactive'));

ALTER TABLE bil_billing_plans ADD CONSTRAINT bil_billing_plans_monthly_fee_check
  CHECK (monthly_fee >= 0);

ALTER TABLE bil_billing_plans ADD CONSTRAINT bil_billing_plans_annual_fee_check
  CHECK (annual_fee >= 0);

-- Drop existing foreign keys
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_billing_plans_created_by_fkey' AND conrelid = 'bil_billing_plans'::regclass) THEN
    ALTER TABLE bil_billing_plans DROP CONSTRAINT bil_billing_plans_created_by_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_billing_plans_updated_by_fkey' AND conrelid = 'bil_billing_plans'::regclass) THEN
    ALTER TABLE bil_billing_plans DROP CONSTRAINT bil_billing_plans_updated_by_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_billing_plans_deleted_by_fkey' AND conrelid = 'bil_billing_plans'::regclass) THEN
    ALTER TABLE bil_billing_plans DROP CONSTRAINT bil_billing_plans_deleted_by_fkey;
  END IF;
END $$;

-- Add foreign keys
ALTER TABLE bil_billing_plans
  ADD CONSTRAINT bil_billing_plans_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE bil_billing_plans
  ADD CONSTRAINT bil_billing_plans_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE bil_billing_plans
  ADD CONSTRAINT bil_billing_plans_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop and recreate indexes
DROP INDEX IF EXISTS bil_billing_plans_plan_name_key;
DROP INDEX IF EXISTS bil_billing_plans_plan_name_idx;
DROP INDEX IF EXISTS bil_billing_plans_status_idx;
DROP INDEX IF EXISTS bil_billing_plans_deleted_at_idx;
DROP INDEX IF EXISTS bil_billing_plans_created_by_idx;
DROP INDEX IF EXISTS bil_billing_plans_updated_by_idx;
DROP INDEX IF EXISTS bil_billing_plans_metadata_idx;
DROP INDEX IF EXISTS bil_billing_plans_features_idx;

CREATE UNIQUE INDEX IF NOT EXISTS bil_billing_plans_plan_name_key
  ON bil_billing_plans(plan_name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bil_billing_plans_status_idx
  ON bil_billing_plans(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bil_billing_plans_deleted_at_idx
  ON bil_billing_plans(deleted_at);

CREATE INDEX IF NOT EXISTS bil_billing_plans_created_by_idx
  ON bil_billing_plans(created_by);

CREATE INDEX IF NOT EXISTS bil_billing_plans_updated_by_idx
  ON bil_billing_plans(updated_by);

CREATE INDEX IF NOT EXISTS bil_billing_plans_metadata_idx
  ON bil_billing_plans USING GIN(metadata);

CREATE INDEX IF NOT EXISTS bil_billing_plans_features_idx
  ON bil_billing_plans USING GIN(features);

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
    WHERE tgname = 'update_bil_billing_plans_updated_at'
      AND tgrelid = 'bil_billing_plans'::regclass
  ) THEN
    CREATE TRIGGER update_bil_billing_plans_updated_at
      BEFORE UPDATE ON bil_billing_plans
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE bil_billing_plans ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policy
DROP POLICY IF EXISTS temp_allow_all_bil_billing_plans ON bil_billing_plans;

CREATE POLICY temp_allow_all_bil_billing_plans ON bil_billing_plans
  FOR ALL TO authenticated
  USING (true);
