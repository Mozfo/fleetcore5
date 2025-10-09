-- ============================================================================
-- Migration: Create/Update sch_tasks table
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS sch_tasks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  description TEXT NOT NULL,
  target_id UUID NOT NULL,
  due_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL DEFAULT 'pending',
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
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4();
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL;
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS description TEXT NOT NULL;
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS target_id UUID NOT NULL;
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ NULL;
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS created_by UUID NULL;
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS updated_by UUID NULL;
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS deleted_by UUID NULL;
  ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS deletion_reason TEXT NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing foreign keys
DO $$
BEGIN
  ALTER TABLE sch_tasks DROP CONSTRAINT IF EXISTS sch_tasks_tenant_id_fkey;
  ALTER TABLE sch_tasks DROP CONSTRAINT IF EXISTS sch_tasks_created_by_fkey;
  ALTER TABLE sch_tasks DROP CONSTRAINT IF EXISTS sch_tasks_updated_by_fkey;
  ALTER TABLE sch_tasks DROP CONSTRAINT IF EXISTS sch_tasks_deleted_by_fkey;
END $$;

-- Add foreign keys
ALTER TABLE sch_tasks
  ADD CONSTRAINT sch_tasks_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE sch_tasks
  ADD CONSTRAINT sch_tasks_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE sch_tasks
  ADD CONSTRAINT sch_tasks_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE sch_tasks
  ADD CONSTRAINT sch_tasks_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Drop and recreate status check constraint
DO $$
BEGIN
  ALTER TABLE sch_tasks DROP CONSTRAINT IF EXISTS sch_tasks_status_check;
  ALTER TABLE sch_tasks ADD CONSTRAINT sch_tasks_status_check
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_sch_tasks_tenant_id;
DROP INDEX IF EXISTS idx_sch_tasks_target_id;
DROP INDEX IF EXISTS idx_sch_tasks_due_at;
DROP INDEX IF EXISTS idx_sch_tasks_status_active;
DROP INDEX IF EXISTS idx_sch_tasks_deleted_at;
DROP INDEX IF EXISTS idx_sch_tasks_created_by;
DROP INDEX IF EXISTS idx_sch_tasks_updated_by;
DROP INDEX IF EXISTS idx_sch_tasks_metadata;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sch_tasks_tenant_id ON sch_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sch_tasks_target_id ON sch_tasks(target_id);
CREATE INDEX IF NOT EXISTS idx_sch_tasks_due_at ON sch_tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_sch_tasks_status_active ON sch_tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sch_tasks_deleted_at ON sch_tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sch_tasks_created_by ON sch_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_sch_tasks_updated_by ON sch_tasks(updated_by);
CREATE INDEX IF NOT EXISTS idx_sch_tasks_metadata ON sch_tasks USING GIN(metadata);

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
    WHERE tgname = 'update_sch_tasks_updated_at'
      AND tgrelid = 'sch_tasks'::regclass
  ) THEN
    CREATE TRIGGER update_sch_tasks_updated_at
      BEFORE UPDATE ON sch_tasks
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE sch_tasks ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_sch_tasks ON sch_tasks;
CREATE POLICY tenant_isolation_sch_tasks ON sch_tasks
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_sch_tasks ON sch_tasks;
CREATE POLICY temp_allow_all_sch_tasks ON sch_tasks
  FOR ALL TO authenticated
  USING (true);
