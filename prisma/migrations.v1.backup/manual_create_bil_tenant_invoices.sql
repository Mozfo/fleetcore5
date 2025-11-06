-- =====================================================
-- Migration: Create/Update bil_tenant_invoices
-- Description: SaaS invoices issued to tenants (multi-tenant)
-- =====================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.bil_tenant_invoices (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'tenant_id') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN tenant_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'invoice_number') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN invoice_number TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'invoice_date') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN invoice_date DATE NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'due_date') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN due_date DATE NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'total_amount') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN total_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'currency') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN currency VARCHAR(3) NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'status') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'metadata') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'created_at') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'created_by') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN created_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'updated_at') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'updated_by') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN updated_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'deleted_at') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'deleted_by') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN deleted_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoices' AND column_name = 'deletion_reason') THEN
    ALTER TABLE bil_tenant_invoices ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Drop existing constraints if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_invoices_due_date_check' AND conrelid = 'bil_tenant_invoices'::regclass) THEN
    ALTER TABLE bil_tenant_invoices DROP CONSTRAINT bil_tenant_invoices_due_date_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_invoices_total_amount_check' AND conrelid = 'bil_tenant_invoices'::regclass) THEN
    ALTER TABLE bil_tenant_invoices DROP CONSTRAINT bil_tenant_invoices_total_amount_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_invoices_status_check' AND conrelid = 'bil_tenant_invoices'::regclass) THEN
    ALTER TABLE bil_tenant_invoices DROP CONSTRAINT bil_tenant_invoices_status_check;
  END IF;
END $$;

-- Add check constraints
ALTER TABLE bil_tenant_invoices ADD CONSTRAINT bil_tenant_invoices_due_date_check
  CHECK (due_date >= invoice_date);

ALTER TABLE bil_tenant_invoices ADD CONSTRAINT bil_tenant_invoices_total_amount_check
  CHECK (total_amount >= 0);

ALTER TABLE bil_tenant_invoices ADD CONSTRAINT bil_tenant_invoices_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue'));

-- Drop existing foreign keys
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_invoices_tenant_id_fkey' AND conrelid = 'bil_tenant_invoices'::regclass) THEN
    ALTER TABLE bil_tenant_invoices DROP CONSTRAINT bil_tenant_invoices_tenant_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_invoices_created_by_fkey' AND conrelid = 'bil_tenant_invoices'::regclass) THEN
    ALTER TABLE bil_tenant_invoices DROP CONSTRAINT bil_tenant_invoices_created_by_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_invoices_updated_by_fkey' AND conrelid = 'bil_tenant_invoices'::regclass) THEN
    ALTER TABLE bil_tenant_invoices DROP CONSTRAINT bil_tenant_invoices_updated_by_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bil_tenant_invoices_deleted_by_fkey' AND conrelid = 'bil_tenant_invoices'::regclass) THEN
    ALTER TABLE bil_tenant_invoices DROP CONSTRAINT bil_tenant_invoices_deleted_by_fkey;
  END IF;
END $$;

-- Add foreign keys
ALTER TABLE bil_tenant_invoices
  ADD CONSTRAINT bil_tenant_invoices_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE bil_tenant_invoices
  ADD CONSTRAINT bil_tenant_invoices_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE bil_tenant_invoices
  ADD CONSTRAINT bil_tenant_invoices_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE bil_tenant_invoices
  ADD CONSTRAINT bil_tenant_invoices_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop and recreate indexes
DROP INDEX IF EXISTS bil_tenant_invoices_tenant_id_invoice_number_key;
DROP INDEX IF EXISTS bil_tenant_invoices_tenant_id_idx;
DROP INDEX IF EXISTS bil_tenant_invoices_invoice_number_idx;
DROP INDEX IF EXISTS bil_tenant_invoices_invoice_date_idx;
DROP INDEX IF EXISTS bil_tenant_invoices_due_date_idx;
DROP INDEX IF EXISTS bil_tenant_invoices_status_idx;
DROP INDEX IF EXISTS bil_tenant_invoices_deleted_at_idx;
DROP INDEX IF EXISTS bil_tenant_invoices_created_by_idx;
DROP INDEX IF EXISTS bil_tenant_invoices_updated_by_idx;
DROP INDEX IF EXISTS bil_tenant_invoices_metadata_idx;

CREATE UNIQUE INDEX IF NOT EXISTS bil_tenant_invoices_tenant_id_invoice_number_key
  ON bil_tenant_invoices(tenant_id, invoice_number)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bil_tenant_invoices_tenant_id_idx
  ON bil_tenant_invoices(tenant_id);

CREATE INDEX IF NOT EXISTS bil_tenant_invoices_invoice_number_idx
  ON bil_tenant_invoices(invoice_number);

CREATE INDEX IF NOT EXISTS bil_tenant_invoices_invoice_date_idx
  ON bil_tenant_invoices(invoice_date);

CREATE INDEX IF NOT EXISTS bil_tenant_invoices_due_date_idx
  ON bil_tenant_invoices(due_date);

CREATE INDEX IF NOT EXISTS bil_tenant_invoices_status_idx
  ON bil_tenant_invoices(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bil_tenant_invoices_deleted_at_idx
  ON bil_tenant_invoices(deleted_at);

CREATE INDEX IF NOT EXISTS bil_tenant_invoices_created_by_idx
  ON bil_tenant_invoices(created_by);

CREATE INDEX IF NOT EXISTS bil_tenant_invoices_updated_by_idx
  ON bil_tenant_invoices(updated_by);

CREATE INDEX IF NOT EXISTS bil_tenant_invoices_metadata_idx
  ON bil_tenant_invoices USING GIN(metadata);

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
    WHERE tgname = 'update_bil_tenant_invoices_updated_at'
      AND tgrelid = 'bil_tenant_invoices'::regclass
  ) THEN
    CREATE TRIGGER update_bil_tenant_invoices_updated_at
      BEFORE UPDATE ON bil_tenant_invoices
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE bil_tenant_invoices ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_bil_tenant_invoices ON bil_tenant_invoices;

CREATE POLICY tenant_isolation_bil_tenant_invoices ON bil_tenant_invoices
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_bil_tenant_invoices ON bil_tenant_invoices;

CREATE POLICY temp_allow_all_bil_tenant_invoices ON bil_tenant_invoices
  FOR ALL TO authenticated
  USING (true);
