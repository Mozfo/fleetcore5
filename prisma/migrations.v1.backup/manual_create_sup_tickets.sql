-- ============================================================
-- Migration: Create or update sup_tickets table
-- ============================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table
CREATE TABLE IF NOT EXISTS sup_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  raised_by UUID NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
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

-- Add columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'tenant_id') THEN
    ALTER TABLE sup_tickets ADD COLUMN tenant_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'raised_by') THEN
    ALTER TABLE sup_tickets ADD COLUMN raised_by UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'subject') THEN
    ALTER TABLE sup_tickets ADD COLUMN subject TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'description') THEN
    ALTER TABLE sup_tickets ADD COLUMN description TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'status') THEN
    ALTER TABLE sup_tickets ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'priority') THEN
    ALTER TABLE sup_tickets ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'assigned_to') THEN
    ALTER TABLE sup_tickets ADD COLUMN assigned_to UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'metadata') THEN
    ALTER TABLE sup_tickets ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'created_at') THEN
    ALTER TABLE sup_tickets ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'created_by') THEN
    ALTER TABLE sup_tickets ADD COLUMN created_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'updated_at') THEN
    ALTER TABLE sup_tickets ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'updated_by') THEN
    ALTER TABLE sup_tickets ADD COLUMN updated_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'deleted_at') THEN
    ALTER TABLE sup_tickets ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'deleted_by') THEN
    ALTER TABLE sup_tickets ADD COLUMN deleted_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_tickets' AND column_name = 'deletion_reason') THEN
    ALTER TABLE sup_tickets ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sup_tickets_tenant_id_fkey') THEN
    ALTER TABLE sup_tickets ADD CONSTRAINT sup_tickets_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sup_tickets_assigned_to_fkey') THEN
    ALTER TABLE sup_tickets ADD CONSTRAINT sup_tickets_assigned_to_fkey
      FOREIGN KEY (assigned_to) REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sup_tickets_created_by_fkey') THEN
    ALTER TABLE sup_tickets ADD CONSTRAINT sup_tickets_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sup_tickets_updated_by_fkey') THEN
    ALTER TABLE sup_tickets ADD CONSTRAINT sup_tickets_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sup_tickets_deleted_by_fkey') THEN
    ALTER TABLE sup_tickets ADD CONSTRAINT sup_tickets_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Add check constraints
ALTER TABLE sup_tickets DROP CONSTRAINT IF EXISTS sup_tickets_status_check;
ALTER TABLE sup_tickets ADD CONSTRAINT sup_tickets_status_check CHECK (status IN ('open','pending','resolved','closed'));

ALTER TABLE sup_tickets DROP CONSTRAINT IF EXISTS sup_tickets_priority_check;
ALTER TABLE sup_tickets ADD CONSTRAINT sup_tickets_priority_check CHECK (priority IN ('low','medium','high'));

-- Drop old indexes
DROP INDEX IF EXISTS sup_tickets_tenant_id_idx;
DROP INDEX IF EXISTS sup_tickets_raised_by_idx;
DROP INDEX IF EXISTS sup_tickets_assigned_to_idx;
DROP INDEX IF EXISTS sup_tickets_status_active_idx;
DROP INDEX IF EXISTS sup_tickets_priority_active_idx;
DROP INDEX IF EXISTS sup_tickets_created_at_idx;
DROP INDEX IF EXISTS sup_tickets_deleted_at_idx;
DROP INDEX IF EXISTS sup_tickets_created_by_idx;
DROP INDEX IF EXISTS sup_tickets_updated_by_idx;
DROP INDEX IF EXISTS sup_tickets_metadata_idx;
DROP INDEX IF EXISTS sup_tickets_tenant_id_raised_by_created_at_deleted_at_key;

-- Create new indexes
CREATE INDEX IF NOT EXISTS sup_tickets_tenant_id_idx ON sup_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS sup_tickets_raised_by_idx ON sup_tickets(raised_by);
CREATE INDEX IF NOT EXISTS sup_tickets_assigned_to_idx ON sup_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS sup_tickets_status_active_idx ON sup_tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS sup_tickets_priority_active_idx ON sup_tickets(priority) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS sup_tickets_created_at_idx ON sup_tickets(created_at);
CREATE INDEX IF NOT EXISTS sup_tickets_deleted_at_idx ON sup_tickets(deleted_at);
CREATE INDEX IF NOT EXISTS sup_tickets_created_by_idx ON sup_tickets(created_by);
CREATE INDEX IF NOT EXISTS sup_tickets_updated_by_idx ON sup_tickets(updated_by);
CREATE INDEX IF NOT EXISTS sup_tickets_metadata_idx ON sup_tickets USING GIN(metadata);

-- Create unique partial index
CREATE UNIQUE INDEX IF NOT EXISTS sup_tickets_tenant_id_raised_by_created_at_deleted_at_key
  ON sup_tickets(tenant_id, raised_by, created_at) WHERE deleted_at IS NULL;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_sup_tickets_updated_at'
      AND tgrelid = 'sup_tickets'::regclass
  ) THEN
    CREATE TRIGGER update_sup_tickets_updated_at
      BEFORE UPDATE ON sup_tickets
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE sup_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_sup_tickets ON sup_tickets;
CREATE POLICY tenant_isolation_sup_tickets ON sup_tickets
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_sup_tickets ON sup_tickets;
CREATE POLICY temp_allow_all_sup_tickets ON sup_tickets
  FOR ALL TO authenticated
  USING (true);
