-- ============================================================================
-- MIGRATION: Create/Update bil_tenant_invoice_lines table
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS bil_tenant_invoice_lines (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  invoice_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'invoice_id') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN invoice_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'description') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN description TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'amount') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN amount NUMERIC(18,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'quantity') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN quantity NUMERIC(10,2) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'metadata') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'created_at') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'created_by') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN created_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'updated_at') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'updated_by') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN updated_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'deleted_at') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'deleted_by') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN deleted_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bil_tenant_invoice_lines' AND column_name = 'deletion_reason') THEN
    ALTER TABLE bil_tenant_invoice_lines ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Drop existing check constraints
ALTER TABLE bil_tenant_invoice_lines DROP CONSTRAINT IF EXISTS bil_tenant_invoice_lines_amount_check;
ALTER TABLE bil_tenant_invoice_lines DROP CONSTRAINT IF EXISTS bil_tenant_invoice_lines_quantity_check;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_tenant_invoice_lines_amount_check'
    AND conrelid = 'bil_tenant_invoice_lines'::regclass
  ) THEN
    ALTER TABLE bil_tenant_invoice_lines ADD CONSTRAINT bil_tenant_invoice_lines_amount_check CHECK (amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_tenant_invoice_lines_quantity_check'
    AND conrelid = 'bil_tenant_invoice_lines'::regclass
  ) THEN
    ALTER TABLE bil_tenant_invoice_lines ADD CONSTRAINT bil_tenant_invoice_lines_quantity_check CHECK (quantity > 0);
  END IF;
END $$;

-- Drop existing foreign keys
ALTER TABLE bil_tenant_invoice_lines DROP CONSTRAINT IF EXISTS bil_tenant_invoice_lines_invoice_id_fkey;
ALTER TABLE bil_tenant_invoice_lines DROP CONSTRAINT IF EXISTS bil_tenant_invoice_lines_created_by_fkey;
ALTER TABLE bil_tenant_invoice_lines DROP CONSTRAINT IF EXISTS bil_tenant_invoice_lines_updated_by_fkey;
ALTER TABLE bil_tenant_invoice_lines DROP CONSTRAINT IF EXISTS bil_tenant_invoice_lines_deleted_by_fkey;

-- Add foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_tenant_invoice_lines_invoice_id_fkey'
    AND conrelid = 'bil_tenant_invoice_lines'::regclass
  ) THEN
    ALTER TABLE bil_tenant_invoice_lines
    ADD CONSTRAINT bil_tenant_invoice_lines_invoice_id_fkey
    FOREIGN KEY (invoice_id) REFERENCES bil_tenant_invoices(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_tenant_invoice_lines_created_by_fkey'
    AND conrelid = 'bil_tenant_invoice_lines'::regclass
  ) THEN
    ALTER TABLE bil_tenant_invoice_lines
    ADD CONSTRAINT bil_tenant_invoice_lines_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_tenant_invoice_lines_updated_by_fkey'
    AND conrelid = 'bil_tenant_invoice_lines'::regclass
  ) THEN
    ALTER TABLE bil_tenant_invoice_lines
    ADD CONSTRAINT bil_tenant_invoice_lines_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bil_tenant_invoice_lines_deleted_by_fkey'
    AND conrelid = 'bil_tenant_invoice_lines'::regclass
  ) THEN
    ALTER TABLE bil_tenant_invoice_lines
    ADD CONSTRAINT bil_tenant_invoice_lines_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Drop existing indexes
DROP INDEX IF EXISTS bil_tenant_invoice_lines_invoice_id_idx;
DROP INDEX IF EXISTS bil_tenant_invoice_lines_description_idx;
DROP INDEX IF EXISTS bil_tenant_invoice_lines_deleted_at_idx;
DROP INDEX IF EXISTS bil_tenant_invoice_lines_created_by_idx;
DROP INDEX IF EXISTS bil_tenant_invoice_lines_updated_by_idx;
DROP INDEX IF EXISTS bil_tenant_invoice_lines_metadata_idx;
DROP INDEX IF EXISTS bil_tenant_invoice_lines_invoice_id_description_unique;

-- Create indexes
CREATE INDEX IF NOT EXISTS bil_tenant_invoice_lines_invoice_id_idx
  ON bil_tenant_invoice_lines(invoice_id);

CREATE INDEX IF NOT EXISTS bil_tenant_invoice_lines_description_idx
  ON bil_tenant_invoice_lines(description);

CREATE INDEX IF NOT EXISTS bil_tenant_invoice_lines_deleted_at_idx
  ON bil_tenant_invoice_lines(deleted_at);

CREATE INDEX IF NOT EXISTS bil_tenant_invoice_lines_created_by_idx
  ON bil_tenant_invoice_lines(created_by);

CREATE INDEX IF NOT EXISTS bil_tenant_invoice_lines_updated_by_idx
  ON bil_tenant_invoice_lines(updated_by);

CREATE INDEX IF NOT EXISTS bil_tenant_invoice_lines_metadata_idx
  ON bil_tenant_invoice_lines USING GIN(metadata);

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS bil_tenant_invoice_lines_invoice_id_description_unique
  ON bil_tenant_invoice_lines(invoice_id, description)
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
    WHERE tgname = 'update_bil_tenant_invoice_lines_updated_at'
      AND tgrelid = 'bil_tenant_invoice_lines'::regclass
  ) THEN
    CREATE TRIGGER update_bil_tenant_invoice_lines_updated_at
      BEFORE UPDATE ON bil_tenant_invoice_lines
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE bil_tenant_invoice_lines ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS temp_allow_all_bil_tenant_invoice_lines ON bil_tenant_invoice_lines;

-- Create RLS policy
CREATE POLICY temp_allow_all_bil_tenant_invoice_lines ON bil_tenant_invoice_lines
  FOR ALL TO authenticated
  USING (true);
