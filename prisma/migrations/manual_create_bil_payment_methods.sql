-- ============================================================================
-- MIGRATION: Create/Update bil_payment_methods table
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS bil_payment_methods (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  payment_type TEXT NOT NULL,
  provider_token TEXT NOT NULL,
  expires_at DATE NULL,
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

-- Add columns if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'tenant_id') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN tenant_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'payment_type') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN payment_type TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'provider_token') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN provider_token TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'expires_at') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN expires_at DATE NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'status') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'metadata') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'created_at') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'created_by') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN created_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'updated_at') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'updated_by') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN updated_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'deleted_at') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'deleted_by') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN deleted_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_payment_methods' AND column_name = 'deletion_reason') THEN
    ALTER TABLE bil_payment_methods ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Drop existing check constraints
ALTER TABLE bil_payment_methods DROP CONSTRAINT IF EXISTS bil_payment_methods_payment_type_check;
ALTER TABLE bil_payment_methods DROP CONSTRAINT IF EXISTS bil_payment_methods_status_check;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_payment_methods_payment_type_check'
    AND conrelid = 'bil_payment_methods'::regclass
  ) THEN
    ALTER TABLE bil_payment_methods ADD CONSTRAINT bil_payment_methods_payment_type_check CHECK (payment_type IN ('card', 'bank', 'paypal'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_payment_methods_status_check'
    AND conrelid = 'bil_payment_methods'::regclass
  ) THEN
    ALTER TABLE bil_payment_methods ADD CONSTRAINT bil_payment_methods_status_check CHECK (status IN ('active', 'inactive', 'expired'));
  END IF;
END $$;

-- Drop existing foreign keys
ALTER TABLE bil_payment_methods DROP CONSTRAINT IF EXISTS bil_payment_methods_tenant_id_fkey;
ALTER TABLE bil_payment_methods DROP CONSTRAINT IF EXISTS bil_payment_methods_created_by_fkey;
ALTER TABLE bil_payment_methods DROP CONSTRAINT IF EXISTS bil_payment_methods_updated_by_fkey;
ALTER TABLE bil_payment_methods DROP CONSTRAINT IF EXISTS bil_payment_methods_deleted_by_fkey;

-- Add foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_payment_methods_tenant_id_fkey'
    AND conrelid = 'bil_payment_methods'::regclass
  ) THEN
    ALTER TABLE bil_payment_methods
    ADD CONSTRAINT bil_payment_methods_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_payment_methods_created_by_fkey'
    AND conrelid = 'bil_payment_methods'::regclass
  ) THEN
    ALTER TABLE bil_payment_methods
    ADD CONSTRAINT bil_payment_methods_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_payment_methods_updated_by_fkey'
    AND conrelid = 'bil_payment_methods'::regclass
  ) THEN
    ALTER TABLE bil_payment_methods
    ADD CONSTRAINT bil_payment_methods_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_payment_methods_deleted_by_fkey'
    AND conrelid = 'bil_payment_methods'::regclass
  ) THEN
    ALTER TABLE bil_payment_methods
    ADD CONSTRAINT bil_payment_methods_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Drop existing indexes
DROP INDEX IF EXISTS bil_payment_methods_tenant_id_idx;
DROP INDEX IF EXISTS bil_payment_methods_payment_type_idx;
DROP INDEX IF EXISTS bil_payment_methods_expires_at_idx;
DROP INDEX IF EXISTS bil_payment_methods_status_active_idx;
DROP INDEX IF EXISTS bil_payment_methods_deleted_at_idx;
DROP INDEX IF EXISTS bil_payment_methods_created_by_idx;
DROP INDEX IF EXISTS bil_payment_methods_updated_by_idx;
DROP INDEX IF EXISTS bil_payment_methods_metadata_idx;
DROP INDEX IF EXISTS bil_payment_methods_tenant_id_payment_type_unique;

-- Create indexes
CREATE INDEX IF NOT EXISTS bil_payment_methods_tenant_id_idx
  ON bil_payment_methods(tenant_id);

CREATE INDEX IF NOT EXISTS bil_payment_methods_payment_type_idx
  ON bil_payment_methods(payment_type);

CREATE INDEX IF NOT EXISTS bil_payment_methods_expires_at_idx
  ON bil_payment_methods(expires_at);

CREATE INDEX IF NOT EXISTS bil_payment_methods_status_active_idx
  ON bil_payment_methods(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bil_payment_methods_deleted_at_idx
  ON bil_payment_methods(deleted_at);

CREATE INDEX IF NOT EXISTS bil_payment_methods_created_by_idx
  ON bil_payment_methods(created_by);

CREATE INDEX IF NOT EXISTS bil_payment_methods_updated_by_idx
  ON bil_payment_methods(updated_by);

CREATE INDEX IF NOT EXISTS bil_payment_methods_metadata_idx
  ON bil_payment_methods USING GIN(metadata);

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS bil_payment_methods_tenant_id_payment_type_unique
  ON bil_payment_methods(tenant_id, payment_type)
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
    WHERE tgname = 'update_bil_payment_methods_updated_at'
      AND tgrelid = 'bil_payment_methods'::regclass
  ) THEN
    CREATE TRIGGER update_bil_payment_methods_updated_at
      BEFORE UPDATE ON bil_payment_methods
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE bil_payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS tenant_isolation_bil_payment_methods ON bil_payment_methods;
DROP POLICY IF EXISTS temp_allow_all_bil_payment_methods ON bil_payment_methods;

-- Create RLS policies
CREATE POLICY tenant_isolation_bil_payment_methods ON bil_payment_methods
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_bil_payment_methods ON bil_payment_methods
  FOR ALL TO authenticated
  USING (true);
