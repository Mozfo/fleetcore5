-- ============================================================================
-- Migration: Create/Update sch_maintenance_schedules table
-- Purpose: Vehicle maintenance scheduling with multi-tenancy
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.sch_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
);

-- Add columns if not exists
DO $$
BEGIN
  -- Core columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN tenant_id UUID NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'vehicle_id') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN vehicle_id UUID NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'scheduled_date') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN scheduled_date DATE NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'maintenance_type') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN maintenance_type TEXT NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'status') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN status TEXT NOT NULL DEFAULT 'scheduled';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'metadata') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- Audit columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'created_at') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'created_by') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN created_by UUID NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'updated_at') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'updated_by') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN updated_by UUID NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'deleted_by') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN deleted_by UUID NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules' AND column_name = 'deletion_reason') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Drop and recreate indexes
DROP INDEX IF EXISTS sch_maintenance_schedules_tenant_id_idx;
DROP INDEX IF EXISTS sch_maintenance_schedules_vehicle_id_idx;
DROP INDEX IF EXISTS sch_maintenance_schedules_scheduled_date_idx;
DROP INDEX IF EXISTS sch_maintenance_schedules_maintenance_type_idx;
DROP INDEX IF EXISTS sch_maintenance_schedules_status_active_idx;
DROP INDEX IF EXISTS sch_maintenance_schedules_deleted_at_idx;
DROP INDEX IF EXISTS sch_maintenance_schedules_created_by_idx;
DROP INDEX IF EXISTS sch_maintenance_schedules_updated_by_idx;
DROP INDEX IF EXISTS sch_maintenance_schedules_metadata_gin;
DROP INDEX IF EXISTS sch_maintenance_schedules_tenant_vehicle_date_type_unique;

CREATE INDEX sch_maintenance_schedules_tenant_id_idx ON public.sch_maintenance_schedules(tenant_id);
CREATE INDEX sch_maintenance_schedules_vehicle_id_idx ON public.sch_maintenance_schedules(vehicle_id);
CREATE INDEX sch_maintenance_schedules_scheduled_date_idx ON public.sch_maintenance_schedules(scheduled_date);
CREATE INDEX sch_maintenance_schedules_maintenance_type_idx ON public.sch_maintenance_schedules(maintenance_type);
CREATE INDEX sch_maintenance_schedules_status_active_idx ON public.sch_maintenance_schedules(status) WHERE deleted_at IS NULL;
CREATE INDEX sch_maintenance_schedules_deleted_at_idx ON public.sch_maintenance_schedules(deleted_at);
CREATE INDEX sch_maintenance_schedules_created_by_idx ON public.sch_maintenance_schedules(created_by);
CREATE INDEX sch_maintenance_schedules_updated_by_idx ON public.sch_maintenance_schedules(updated_by);
CREATE INDEX sch_maintenance_schedules_metadata_gin ON public.sch_maintenance_schedules USING gin(metadata);
CREATE UNIQUE INDEX sch_maintenance_schedules_tenant_vehicle_date_type_unique ON public.sch_maintenance_schedules(tenant_id, vehicle_id, scheduled_date, maintenance_type) WHERE deleted_at IS NULL;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_maintenance_schedules_tenant_id_fkey') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD CONSTRAINT sch_maintenance_schedules_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES public.adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_maintenance_schedules_vehicle_id_fkey') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD CONSTRAINT sch_maintenance_schedules_vehicle_id_fkey
      FOREIGN KEY (vehicle_id) REFERENCES public.flt_vehicles(id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_maintenance_schedules_created_by_fkey') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD CONSTRAINT sch_maintenance_schedules_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_maintenance_schedules_updated_by_fkey') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD CONSTRAINT sch_maintenance_schedules_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES public.adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_maintenance_schedules_deleted_by_fkey') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD CONSTRAINT sch_maintenance_schedules_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES public.adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sch_maintenance_schedules_status_check') THEN
    ALTER TABLE public.sch_maintenance_schedules ADD CONSTRAINT sch_maintenance_schedules_status_check
      CHECK (status IN ('scheduled','completed','cancelled'));
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
    WHERE tgname = 'update_sch_maintenance_schedules_updated_at'
      AND tgrelid = 'sch_maintenance_schedules'::regclass
  ) THEN
    CREATE TRIGGER update_sch_maintenance_schedules_updated_at
      BEFORE UPDATE ON public.sch_maintenance_schedules
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.sch_maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_sch_maintenance_schedules ON public.sch_maintenance_schedules;
CREATE POLICY tenant_isolation_sch_maintenance_schedules ON public.sch_maintenance_schedules
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_sch_maintenance_schedules ON public.sch_maintenance_schedules;
CREATE POLICY temp_allow_all_sch_maintenance_schedules ON public.sch_maintenance_schedules
  FOR ALL TO authenticated
  USING (true);

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✓ sch_maintenance_schedules table migration completed successfully';
  RAISE NOTICE '    - Columns: 13 (core + audit + soft delete)';
  RAISE NOTICE '    - Foreign keys: 5 (tenant, vehicle, audit)';
  RAISE NOTICE '    - Indexes: 10 (9 btree + 1 GIN)';
  RAISE NOTICE '    - Constraints: 1 (status)';
  RAISE NOTICE '    - Unique: (tenant_id, vehicle_id, scheduled_date, maintenance_type) WHERE deleted_at IS NULL';
  RAISE NOTICE '    - RLS: enabled with 2 policies';
  RAISE NOTICE '    - Trigger: update_sch_maintenance_schedules_updated_at';
END $$;
