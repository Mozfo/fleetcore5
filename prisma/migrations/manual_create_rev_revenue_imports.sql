-- =====================================================
-- Migration: Create/Update rev_revenue_imports table
-- Description: Revenue imports from external sources with multi-tenant support
-- =====================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS rev_revenue_imports (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  import_reference TEXT NOT NULL,
  import_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT
);

-- Add columns if they don't exist
DO $$
BEGIN
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS id UUID DEFAULT extensions.uuid_generate_v4();
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS tenant_id UUID;
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS import_reference TEXT;
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS import_date DATE;
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(18,2) DEFAULT 0;
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS currency VARCHAR(3);
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS updated_by UUID;
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS deleted_by UUID;
  ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
END $$;

-- Drop existing check constraints
ALTER TABLE rev_revenue_imports DROP CONSTRAINT IF EXISTS rev_revenue_imports_status_check;
ALTER TABLE rev_revenue_imports DROP CONSTRAINT IF EXISTS rev_revenue_imports_total_revenue_check;

-- Add check constraints
ALTER TABLE rev_revenue_imports ADD CONSTRAINT rev_revenue_imports_status_check CHECK (status IN ('pending','processing','completed','failed','cancelled'));
ALTER TABLE rev_revenue_imports ADD CONSTRAINT rev_revenue_imports_total_revenue_check CHECK (total_revenue >= 0);

-- Drop existing foreign keys
ALTER TABLE rev_revenue_imports DROP CONSTRAINT IF EXISTS rev_revenue_imports_tenant_id_fkey;
ALTER TABLE rev_revenue_imports DROP CONSTRAINT IF EXISTS rev_revenue_imports_created_by_fkey;
ALTER TABLE rev_revenue_imports DROP CONSTRAINT IF EXISTS rev_revenue_imports_updated_by_fkey;
ALTER TABLE rev_revenue_imports DROP CONSTRAINT IF EXISTS rev_revenue_imports_deleted_by_fkey;

-- Add foreign keys
ALTER TABLE rev_revenue_imports ADD CONSTRAINT rev_revenue_imports_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE rev_revenue_imports ADD CONSTRAINT rev_revenue_imports_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE rev_revenue_imports ADD CONSTRAINT rev_revenue_imports_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE rev_revenue_imports ADD CONSTRAINT rev_revenue_imports_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop existing indexes
DROP INDEX IF EXISTS rev_revenue_imports_tenant_id_idx;
DROP INDEX IF EXISTS rev_revenue_imports_import_date_idx;
DROP INDEX IF EXISTS rev_revenue_imports_status_active_idx;
DROP INDEX IF EXISTS rev_revenue_imports_deleted_at_idx;
DROP INDEX IF EXISTS rev_revenue_imports_created_by_idx;
DROP INDEX IF EXISTS rev_revenue_imports_updated_by_idx;
DROP INDEX IF EXISTS rev_revenue_imports_metadata_idx;
DROP INDEX IF EXISTS rev_revenue_imports_tenant_id_import_reference_key;

-- Create indexes
CREATE INDEX IF NOT EXISTS rev_revenue_imports_tenant_id_idx ON rev_revenue_imports(tenant_id);
CREATE INDEX IF NOT EXISTS rev_revenue_imports_import_date_idx ON rev_revenue_imports(import_date DESC);
CREATE INDEX IF NOT EXISTS rev_revenue_imports_status_active_idx ON rev_revenue_imports(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rev_revenue_imports_deleted_at_idx ON rev_revenue_imports(deleted_at);
CREATE INDEX IF NOT EXISTS rev_revenue_imports_created_by_idx ON rev_revenue_imports(created_by);
CREATE INDEX IF NOT EXISTS rev_revenue_imports_updated_by_idx ON rev_revenue_imports(updated_by);
CREATE INDEX IF NOT EXISTS rev_revenue_imports_metadata_idx ON rev_revenue_imports USING GIN(metadata);

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS rev_revenue_imports_tenant_id_import_reference_key
  ON rev_revenue_imports(tenant_id, import_reference) WHERE deleted_at IS NULL;

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
    WHERE tgname = 'update_rev_revenue_imports_updated_at'
      AND tgrelid = 'rev_revenue_imports'::regclass
  ) THEN
    CREATE TRIGGER update_rev_revenue_imports_updated_at
      BEFORE UPDATE ON rev_revenue_imports
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE rev_revenue_imports ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_rev_revenue_imports ON rev_revenue_imports;
CREATE POLICY tenant_isolation_rev_revenue_imports ON rev_revenue_imports
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_rev_revenue_imports ON rev_revenue_imports;
CREATE POLICY temp_allow_all_rev_revenue_imports ON rev_revenue_imports
  FOR ALL TO authenticated
  USING (true);
