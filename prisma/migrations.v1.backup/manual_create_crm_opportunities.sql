-- ============================================================================
-- MIGRATION: Create/Update crm_opportunities table
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS crm_opportunities (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  opportunity_stage TEXT NOT NULL DEFAULT 'prospect',
  expected_value NUMERIC(18,2) NULL,
  close_date DATE NULL,
  assigned_to UUID NULL,
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'tenant_id') THEN
    ALTER TABLE crm_opportunities ADD COLUMN tenant_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'lead_id') THEN
    ALTER TABLE crm_opportunities ADD COLUMN lead_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'opportunity_stage') THEN
    ALTER TABLE crm_opportunities ADD COLUMN opportunity_stage TEXT NOT NULL DEFAULT 'prospect';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'expected_value') THEN
    ALTER TABLE crm_opportunities ADD COLUMN expected_value NUMERIC(18,2) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'close_date') THEN
    ALTER TABLE crm_opportunities ADD COLUMN close_date DATE NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'assigned_to') THEN
    ALTER TABLE crm_opportunities ADD COLUMN assigned_to UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'metadata') THEN
    ALTER TABLE crm_opportunities ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'created_at') THEN
    ALTER TABLE crm_opportunities ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'created_by') THEN
    ALTER TABLE crm_opportunities ADD COLUMN created_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'updated_at') THEN
    ALTER TABLE crm_opportunities ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'updated_by') THEN
    ALTER TABLE crm_opportunities ADD COLUMN updated_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'deleted_at') THEN
    ALTER TABLE crm_opportunities ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'deleted_by') THEN
    ALTER TABLE crm_opportunities ADD COLUMN deleted_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'deletion_reason') THEN
    ALTER TABLE crm_opportunities ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Drop existing check constraints
ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_opportunity_stage_check;
ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_expected_value_check;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_opportunities_opportunity_stage_check'
    AND conrelid = 'crm_opportunities'::regclass
  ) THEN
    ALTER TABLE crm_opportunities ADD CONSTRAINT crm_opportunities_opportunity_stage_check CHECK (opportunity_stage IN ('prospect', 'proposal', 'negotiation', 'closed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_opportunities_expected_value_check'
    AND conrelid = 'crm_opportunities'::regclass
  ) THEN
    ALTER TABLE crm_opportunities ADD CONSTRAINT crm_opportunities_expected_value_check CHECK (expected_value IS NULL OR expected_value >= 0);
  END IF;
END $$;

-- Drop existing foreign keys
ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_tenant_id_fkey;
ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_lead_id_fkey;
ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_assigned_to_fkey;
ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_created_by_fkey;
ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_updated_by_fkey;
ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_deleted_by_fkey;

-- Add foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_opportunities_tenant_id_fkey'
    AND conrelid = 'crm_opportunities'::regclass
  ) THEN
    ALTER TABLE crm_opportunities
    ADD CONSTRAINT crm_opportunities_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_opportunities_lead_id_fkey'
    AND conrelid = 'crm_opportunities'::regclass
  ) THEN
    ALTER TABLE crm_opportunities
    ADD CONSTRAINT crm_opportunities_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_opportunities_assigned_to_fkey'
    AND conrelid = 'crm_opportunities'::regclass
  ) THEN
    ALTER TABLE crm_opportunities
    ADD CONSTRAINT crm_opportunities_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES adm_members(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_opportunities_created_by_fkey'
    AND conrelid = 'crm_opportunities'::regclass
  ) THEN
    ALTER TABLE crm_opportunities
    ADD CONSTRAINT crm_opportunities_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_members(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_opportunities_updated_by_fkey'
    AND conrelid = 'crm_opportunities'::regclass
  ) THEN
    ALTER TABLE crm_opportunities
    ADD CONSTRAINT crm_opportunities_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_members(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crm_opportunities_deleted_by_fkey'
    AND conrelid = 'crm_opportunities'::regclass
  ) THEN
    ALTER TABLE crm_opportunities
    ADD CONSTRAINT crm_opportunities_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Drop existing indexes
DROP INDEX IF EXISTS crm_opportunities_tenant_id_idx;
DROP INDEX IF EXISTS crm_opportunities_lead_id_idx;
DROP INDEX IF EXISTS crm_opportunities_opportunity_stage_idx;
DROP INDEX IF EXISTS crm_opportunities_close_date_idx;
DROP INDEX IF EXISTS crm_opportunities_assigned_to_idx;
DROP INDEX IF EXISTS crm_opportunities_deleted_at_idx;
DROP INDEX IF EXISTS crm_opportunities_created_by_idx;
DROP INDEX IF EXISTS crm_opportunities_updated_by_idx;
DROP INDEX IF EXISTS crm_opportunities_metadata_idx;
DROP INDEX IF EXISTS crm_opportunities_tenant_id_lead_id_unique;

-- Create indexes
CREATE INDEX IF NOT EXISTS crm_opportunities_tenant_id_idx
  ON crm_opportunities(tenant_id);

CREATE INDEX IF NOT EXISTS crm_opportunities_lead_id_idx
  ON crm_opportunities(lead_id);

CREATE INDEX IF NOT EXISTS crm_opportunities_opportunity_stage_idx
  ON crm_opportunities(opportunity_stage) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS crm_opportunities_close_date_idx
  ON crm_opportunities(close_date);

CREATE INDEX IF NOT EXISTS crm_opportunities_assigned_to_idx
  ON crm_opportunities(assigned_to);

CREATE INDEX IF NOT EXISTS crm_opportunities_deleted_at_idx
  ON crm_opportunities(deleted_at);

CREATE INDEX IF NOT EXISTS crm_opportunities_created_by_idx
  ON crm_opportunities(created_by);

CREATE INDEX IF NOT EXISTS crm_opportunities_updated_by_idx
  ON crm_opportunities(updated_by);

CREATE INDEX IF NOT EXISTS crm_opportunities_metadata_idx
  ON crm_opportunities USING GIN(metadata);

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS crm_opportunities_tenant_id_lead_id_unique
  ON crm_opportunities(tenant_id, lead_id)
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
    WHERE tgname = 'update_crm_opportunities_updated_at'
      AND tgrelid = 'crm_opportunities'::regclass
  ) THEN
    CREATE TRIGGER update_crm_opportunities_updated_at
      BEFORE UPDATE ON crm_opportunities
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS tenant_isolation_crm_opportunities ON crm_opportunities;
DROP POLICY IF EXISTS temp_allow_all_crm_opportunities ON crm_opportunities;

-- Create RLS policies
CREATE POLICY tenant_isolation_crm_opportunities ON crm_opportunities
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_crm_opportunities ON crm_opportunities
  FOR ALL TO authenticated
  USING (true);
