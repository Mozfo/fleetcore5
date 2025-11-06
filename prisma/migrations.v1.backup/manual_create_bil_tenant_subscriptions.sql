-- =====================================================
-- Migration: Create/Update bil_tenant_subscriptions
-- Description: Tenant subscriptions to SaaS billing plans
-- =====================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.bil_tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  subscription_start DATE NOT NULL,
  subscription_end DATE NULL,
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'tenant_id') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN tenant_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'plan_id') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN plan_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'subscription_start') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN subscription_start DATE NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'subscription_end') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN subscription_end DATE NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'status') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'metadata') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'created_at') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'created_by') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN created_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'updated_at') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'updated_by') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN updated_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'deleted_at') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'deleted_by') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN deleted_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_subscriptions' AND column_name = 'deletion_reason') THEN
    ALTER TABLE bil_tenant_subscriptions ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Drop existing constraints if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_subscriptions_status_check' AND conrelid = 'bil_tenant_subscriptions'::regclass) THEN
    ALTER TABLE bil_tenant_subscriptions DROP CONSTRAINT bil_tenant_subscriptions_status_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_subscriptions_subscription_end_check' AND conrelid = 'bil_tenant_subscriptions'::regclass) THEN
    ALTER TABLE bil_tenant_subscriptions DROP CONSTRAINT bil_tenant_subscriptions_subscription_end_check;
  END IF;
END $$;

-- Add check constraints
ALTER TABLE bil_tenant_subscriptions ADD CONSTRAINT bil_tenant_subscriptions_status_check
  CHECK (status IN ('active', 'inactive', 'cancelled'));

ALTER TABLE bil_tenant_subscriptions ADD CONSTRAINT bil_tenant_subscriptions_subscription_end_check
  CHECK (subscription_end IS NULL OR subscription_end >= subscription_start);

-- Drop existing foreign keys
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_subscriptions_tenant_id_fkey' AND conrelid = 'bil_tenant_subscriptions'::regclass) THEN
    ALTER TABLE bil_tenant_subscriptions DROP CONSTRAINT bil_tenant_subscriptions_tenant_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_subscriptions_plan_id_fkey' AND conrelid = 'bil_tenant_subscriptions'::regclass) THEN
    ALTER TABLE bil_tenant_subscriptions DROP CONSTRAINT bil_tenant_subscriptions_plan_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_subscriptions_created_by_fkey' AND conrelid = 'bil_tenant_subscriptions'::regclass) THEN
    ALTER TABLE bil_tenant_subscriptions DROP CONSTRAINT bil_tenant_subscriptions_created_by_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_subscriptions_updated_by_fkey' AND conrelid = 'bil_tenant_subscriptions'::regclass) THEN
    ALTER TABLE bil_tenant_subscriptions DROP CONSTRAINT bil_tenant_subscriptions_updated_by_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_subscriptions_deleted_by_fkey' AND conrelid = 'bil_tenant_subscriptions'::regclass) THEN
    ALTER TABLE bil_tenant_subscriptions DROP CONSTRAINT bil_tenant_subscriptions_deleted_by_fkey;
  END IF;
END $$;

-- Add foreign keys
ALTER TABLE bil_tenant_subscriptions
  ADD CONSTRAINT bil_tenant_subscriptions_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE bil_tenant_subscriptions
  ADD CONSTRAINT bil_tenant_subscriptions_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES bil_billing_plans(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE bil_tenant_subscriptions
  ADD CONSTRAINT bil_tenant_subscriptions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE bil_tenant_subscriptions
  ADD CONSTRAINT bil_tenant_subscriptions_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE bil_tenant_subscriptions
  ADD CONSTRAINT bil_tenant_subscriptions_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop and recreate indexes
DROP INDEX IF EXISTS bil_tenant_subscriptions_tenant_id_plan_id_key;
DROP INDEX IF EXISTS bil_tenant_subscriptions_tenant_id_idx;
DROP INDEX IF EXISTS bil_tenant_subscriptions_plan_id_idx;
DROP INDEX IF EXISTS bil_tenant_subscriptions_subscription_start_idx;
DROP INDEX IF EXISTS bil_tenant_subscriptions_subscription_end_idx;
DROP INDEX IF EXISTS bil_tenant_subscriptions_status_idx;
DROP INDEX IF EXISTS bil_tenant_subscriptions_deleted_at_idx;
DROP INDEX IF EXISTS bil_tenant_subscriptions_created_by_idx;
DROP INDEX IF EXISTS bil_tenant_subscriptions_updated_by_idx;
DROP INDEX IF EXISTS bil_tenant_subscriptions_metadata_idx;

CREATE UNIQUE INDEX IF NOT EXISTS bil_tenant_subscriptions_tenant_id_plan_id_key
  ON bil_tenant_subscriptions(tenant_id, plan_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bil_tenant_subscriptions_tenant_id_idx
  ON bil_tenant_subscriptions(tenant_id);

CREATE INDEX IF NOT EXISTS bil_tenant_subscriptions_plan_id_idx
  ON bil_tenant_subscriptions(plan_id);

CREATE INDEX IF NOT EXISTS bil_tenant_subscriptions_subscription_start_idx
  ON bil_tenant_subscriptions(subscription_start);

CREATE INDEX IF NOT EXISTS bil_tenant_subscriptions_subscription_end_idx
  ON bil_tenant_subscriptions(subscription_end);

CREATE INDEX IF NOT EXISTS bil_tenant_subscriptions_status_idx
  ON bil_tenant_subscriptions(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bil_tenant_subscriptions_deleted_at_idx
  ON bil_tenant_subscriptions(deleted_at);

CREATE INDEX IF NOT EXISTS bil_tenant_subscriptions_created_by_idx
  ON bil_tenant_subscriptions(created_by);

CREATE INDEX IF NOT EXISTS bil_tenant_subscriptions_updated_by_idx
  ON bil_tenant_subscriptions(updated_by);

CREATE INDEX IF NOT EXISTS bil_tenant_subscriptions_metadata_idx
  ON bil_tenant_subscriptions USING GIN(metadata);

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
    WHERE tgname = 'update_bil_tenant_subscriptions_updated_at'
      AND tgrelid = 'bil_tenant_subscriptions'::regclass
  ) THEN
    CREATE TRIGGER update_bil_tenant_subscriptions_updated_at
      BEFORE UPDATE ON bil_tenant_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE bil_tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_bil_tenant_subscriptions ON bil_tenant_subscriptions;

CREATE POLICY tenant_isolation_bil_tenant_subscriptions ON bil_tenant_subscriptions
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_bil_tenant_subscriptions ON bil_tenant_subscriptions;

CREATE POLICY temp_allow_all_bil_tenant_subscriptions ON bil_tenant_subscriptions
  FOR ALL TO authenticated
  USING (true);
