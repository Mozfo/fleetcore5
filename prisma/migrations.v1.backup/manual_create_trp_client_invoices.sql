-- ============================================================================
-- Migration: Create/Update trp_client_invoices table
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS trp_client_invoices (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL,
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

-- Add missing columns if table already exists
DO $$
BEGIN
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4();
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS client_id UUID NOT NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT NOT NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS invoice_date DATE NOT NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS due_date DATE NOT NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC(14,2) NOT NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS created_by UUID NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS updated_by UUID NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS deleted_by UUID NULL;
  ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS deletion_reason TEXT NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing foreign keys
DO $$
BEGIN
  ALTER TABLE trp_client_invoices DROP CONSTRAINT IF EXISTS trp_client_invoices_tenant_id_fkey;
  ALTER TABLE trp_client_invoices DROP CONSTRAINT IF EXISTS trp_client_invoices_created_by_fkey;
  ALTER TABLE trp_client_invoices DROP CONSTRAINT IF EXISTS trp_client_invoices_updated_by_fkey;
  ALTER TABLE trp_client_invoices DROP CONSTRAINT IF EXISTS trp_client_invoices_deleted_by_fkey;
END $$;

-- Add foreign keys
ALTER TABLE trp_client_invoices
  ADD CONSTRAINT trp_client_invoices_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE trp_client_invoices
  ADD CONSTRAINT trp_client_invoices_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE trp_client_invoices
  ADD CONSTRAINT trp_client_invoices_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE trp_client_invoices
  ADD CONSTRAINT trp_client_invoices_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop and recreate check constraints
DO $$
BEGIN
  ALTER TABLE trp_client_invoices DROP CONSTRAINT IF EXISTS trp_client_invoices_status_check;
  ALTER TABLE trp_client_invoices ADD CONSTRAINT trp_client_invoices_status_check
    CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'overdue'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE trp_client_invoices DROP CONSTRAINT IF EXISTS trp_client_invoices_total_amount_check;
  ALTER TABLE trp_client_invoices ADD CONSTRAINT trp_client_invoices_total_amount_check
    CHECK (total_amount >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE trp_client_invoices DROP CONSTRAINT IF EXISTS trp_client_invoices_due_date_check;
  ALTER TABLE trp_client_invoices ADD CONSTRAINT trp_client_invoices_due_date_check
    CHECK (due_date >= invoice_date);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_trp_client_invoices_tenant_id;
DROP INDEX IF EXISTS idx_trp_client_invoices_client_id;
DROP INDEX IF EXISTS idx_trp_client_invoices_invoice_date;
DROP INDEX IF EXISTS idx_trp_client_invoices_due_date;
DROP INDEX IF EXISTS idx_trp_client_invoices_status_active;
DROP INDEX IF EXISTS idx_trp_client_invoices_deleted_at;
DROP INDEX IF EXISTS idx_trp_client_invoices_created_by;
DROP INDEX IF EXISTS idx_trp_client_invoices_updated_by;
DROP INDEX IF EXISTS idx_trp_client_invoices_metadata;
DROP INDEX IF EXISTS idx_trp_client_invoices_tenant_invoice_unique;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trp_client_invoices_tenant_id ON trp_client_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trp_client_invoices_client_id ON trp_client_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_trp_client_invoices_invoice_date ON trp_client_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_trp_client_invoices_due_date ON trp_client_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_trp_client_invoices_status_active ON trp_client_invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trp_client_invoices_deleted_at ON trp_client_invoices(deleted_at);
CREATE INDEX IF NOT EXISTS idx_trp_client_invoices_created_by ON trp_client_invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_trp_client_invoices_updated_by ON trp_client_invoices(updated_by);
CREATE INDEX IF NOT EXISTS idx_trp_client_invoices_metadata ON trp_client_invoices USING GIN(metadata);

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_trp_client_invoices_tenant_invoice_unique
  ON trp_client_invoices(tenant_id, invoice_number)
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
    WHERE tgname = 'update_trp_client_invoices_updated_at'
      AND tgrelid = 'trp_client_invoices'::regclass
  ) THEN
    CREATE TRIGGER update_trp_client_invoices_updated_at
      BEFORE UPDATE ON trp_client_invoices
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE trp_client_invoices ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_trp_client_invoices ON trp_client_invoices;
CREATE POLICY tenant_isolation_trp_client_invoices ON trp_client_invoices
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_trp_client_invoices ON trp_client_invoices;
CREATE POLICY temp_allow_all_trp_client_invoices ON trp_client_invoices
  FOR ALL TO authenticated
  USING (true);
