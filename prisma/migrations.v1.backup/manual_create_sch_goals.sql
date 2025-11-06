-- ============================================================================
-- Migration: Create/Update sch_goals table
-- Purpose: Performance goals/KPIs tracking for drivers with multi-tenancy
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.sch_goals (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
);

-- Add columns if not exists
DO $$
BEGIN
  -- Core columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.sch_goals ADD COLUMN tenant_id UUID NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'goal_type') THEN
    ALTER TABLE public.sch_goals ADD COLUMN goal_type TEXT NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'target_value') THEN
    ALTER TABLE public.sch_goals ADD COLUMN target_value NUMERIC NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'period_start') THEN
    ALTER TABLE public.sch_goals ADD COLUMN period_start DATE NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'period_end') THEN
    ALTER TABLE public.sch_goals ADD COLUMN period_end DATE NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'assigned_to') THEN
    ALTER TABLE public.sch_goals ADD COLUMN assigned_to UUID NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'status') THEN
    ALTER TABLE public.sch_goals ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'metadata') THEN
    ALTER TABLE public.sch_goals ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- Audit columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'created_at') THEN
    ALTER TABLE public.sch_goals ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'created_by') THEN
    ALTER TABLE public.sch_goals ADD COLUMN created_by UUID NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'updated_at') THEN
    ALTER TABLE public.sch_goals ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'updated_by') THEN
    ALTER TABLE public.sch_goals ADD COLUMN updated_by UUID NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.sch_goals ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'deleted_by') THEN
    ALTER TABLE public.sch_goals ADD COLUMN deleted_by UUID NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_goals' AND column_name = 'deletion_reason') THEN
    ALTER TABLE public.sch_goals ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Drop and recreate indexes
DROP INDEX IF EXISTS sch_goals_tenant_id_idx;
DROP INDEX IF EXISTS sch_goals_goal_type_idx;
DROP INDEX IF EXISTS sch_goals_assigned_to_idx;
DROP INDEX IF EXISTS sch_goals_period_start_idx;
DROP INDEX IF EXISTS sch_goals_period_end_idx;
DROP INDEX IF EXISTS sch_goals_status_active_idx;
DROP INDEX IF EXISTS sch_goals_deleted_at_idx;
DROP INDEX IF EXISTS sch_goals_created_by_idx;
DROP INDEX IF EXISTS sch_goals_updated_by_idx;
DROP INDEX IF EXISTS sch_goals_metadata_gin;
DROP INDEX IF EXISTS sch_goals_tenant_type_period_assigned_unique;

CREATE INDEX sch_goals_tenant_id_idx ON public.sch_goals(tenant_id);
CREATE INDEX sch_goals_goal_type_idx ON public.sch_goals(goal_type);
CREATE INDEX sch_goals_assigned_to_idx ON public.sch_goals(assigned_to);
CREATE INDEX sch_goals_period_start_idx ON public.sch_goals(period_start);
CREATE INDEX sch_goals_period_end_idx ON public.sch_goals(period_end);
CREATE INDEX sch_goals_status_active_idx ON public.sch_goals(status) WHERE deleted_at IS NULL;
CREATE INDEX sch_goals_deleted_at_idx ON public.sch_goals(deleted_at);
CREATE INDEX sch_goals_created_by_idx ON public.sch_goals(created_by);
CREATE INDEX sch_goals_updated_by_idx ON public.sch_goals(updated_by);
CREATE INDEX sch_goals_metadata_gin ON public.sch_goals USING gin(metadata);
CREATE UNIQUE INDEX sch_goals_tenant_type_period_assigned_unique ON public.sch_goals(tenant_id, goal_type, period_start, assigned_to) WHERE deleted_at IS NULL;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_goals_tenant_id_fkey') THEN
    ALTER TABLE public.sch_goals ADD CONSTRAINT sch_goals_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES public.adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_goals_created_by_fkey') THEN
    ALTER TABLE public.sch_goals ADD CONSTRAINT sch_goals_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_goals_updated_by_fkey') THEN
    ALTER TABLE public.sch_goals ADD CONSTRAINT sch_goals_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES public.adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_goals_deleted_by_fkey') THEN
    ALTER TABLE public.sch_goals ADD CONSTRAINT sch_goals_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES public.adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_goals_period_check') THEN
    ALTER TABLE public.sch_goals ADD CONSTRAINT sch_goals_period_check
      CHECK (period_end >= period_start);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_goals_status_check') THEN
    ALTER TABLE public.sch_goals ADD CONSTRAINT sch_goals_status_check
      CHECK (status IN ('active','in_progress','completed','cancelled','expired'));
  END IF;
END $$;

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
    WHERE tgname = 'update_sch_goals_updated_at'
      AND tgrelid = 'sch_goals'::regclass
  ) THEN
    CREATE TRIGGER update_sch_goals_updated_at
      BEFORE UPDATE ON public.sch_goals
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.sch_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_sch_goals ON public.sch_goals;
CREATE POLICY tenant_isolation_sch_goals ON public.sch_goals
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_sch_goals ON public.sch_goals;
CREATE POLICY temp_allow_all_sch_goals ON public.sch_goals
  FOR ALL TO authenticated
  USING (true);

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✓ sch_goals table migration completed successfully';
  RAISE NOTICE '    - Columns: 15 (core + audit + soft delete)';
  RAISE NOTICE '    - Foreign keys: 4 (tenant, audit)';
  RAISE NOTICE '    - Indexes: 11 (10 btree + 1 GIN)';
  RAISE NOTICE '    - Constraints: 2 (period, status)';
  RAISE NOTICE '    - Unique: (tenant_id, goal_type, period_start, assigned_to) WHERE deleted_at IS NULL';
  RAISE NOTICE '    - RLS: enabled with 2 policies';
  RAISE NOTICE '    - Trigger: update_sch_goals_updated_at';
END $$;
