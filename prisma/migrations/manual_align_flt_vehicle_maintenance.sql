-- Migration: Align flt_vehicle_maintenance with Fleetcore specification
-- Idempotent SQL migration for vehicle maintenance table

-- ============================================================================
-- STEP 1: Drop triggers (will be recreated at the end)
-- ============================================================================
DROP TRIGGER IF EXISTS update_flt_vehicle_maintenance_updated_at ON flt_vehicle_maintenance;
DROP TRIGGER IF EXISTS set_updated_at_flt_vehicle_maintenance ON flt_vehicle_maintenance;

-- ============================================================================
-- STEP 2: Drop indexes on columns being removed
-- ============================================================================
DROP INDEX IF EXISTS flt_vehicle_maintenance_deleted_at_idx;

-- ============================================================================
-- STEP 3: Drop old CHECK constraints to recreate them
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_maintenance_maintenance_type_check'
      AND conrelid = 'flt_vehicle_maintenance'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_maintenance DROP CONSTRAINT flt_vehicle_maintenance_maintenance_type_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_maintenance_status_check'
      AND conrelid = 'flt_vehicle_maintenance'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_maintenance DROP CONSTRAINT flt_vehicle_maintenance_status_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_maintenance_dates_check'
      AND conrelid = 'flt_vehicle_maintenance'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_maintenance DROP CONSTRAINT flt_vehicle_maintenance_dates_check;
  END IF;
END
$$;

-- ============================================================================
-- STEP 4: Alter column types to match specification
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_maintenance'
      AND column_name = 'maintenance_type'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_maintenance ALTER COLUMN maintenance_type TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_maintenance'
      AND column_name = 'provider_name'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_maintenance ALTER COLUMN provider_name TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_maintenance'
      AND column_name = 'provider_contact'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_maintenance ALTER COLUMN provider_contact TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_maintenance'
      AND column_name = 'invoice_reference'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_maintenance ALTER COLUMN invoice_reference TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_maintenance'
      AND column_name = 'parts_replaced'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_maintenance ALTER COLUMN parts_replaced TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_maintenance'
      AND column_name = 'notes'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_maintenance ALTER COLUMN notes TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_maintenance'
      AND column_name = 'status'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_maintenance ALTER COLUMN status TYPE TEXT;
  END IF;
END
$$;

-- ============================================================================
-- STEP 5: Drop soft-delete columns
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_maintenance'
      AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE flt_vehicle_maintenance DROP COLUMN deleted_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_maintenance'
      AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE flt_vehicle_maintenance DROP COLUMN deleted_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_maintenance'
      AND column_name = 'deletion_reason'
  ) THEN
    ALTER TABLE flt_vehicle_maintenance DROP COLUMN deletion_reason;
  END IF;
END
$$;

-- ============================================================================
-- STEP 6: Add CHECK constraints
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_maintenance_maintenance_type_check'
      AND conrelid = 'flt_vehicle_maintenance'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_maintenance
      ADD CONSTRAINT flt_vehicle_maintenance_maintenance_type_check
      CHECK (maintenance_type IN ('oil_change', 'service', 'inspection', 'tire_rotation', 'brake_service', 'repair', 'other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_maintenance_status_check'
      AND conrelid = 'flt_vehicle_maintenance'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_maintenance
      ADD CONSTRAINT flt_vehicle_maintenance_status_check
      CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_maintenance_dates_check'
      AND conrelid = 'flt_vehicle_maintenance'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_maintenance
      ADD CONSTRAINT flt_vehicle_maintenance_dates_check
      CHECK (completed_date IS NULL OR completed_date >= scheduled_date);
  END IF;
END
$$;

-- ============================================================================
-- STEP 7: Ensure foreign key constraints exist with proper cascade rules
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_maintenance_created_by_fkey'
      AND conrelid = 'flt_vehicle_maintenance'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_maintenance'
        AND column_name = 'created_by'
    ) THEN
      ALTER TABLE flt_vehicle_maintenance
        ADD CONSTRAINT flt_vehicle_maintenance_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_maintenance_updated_by_fkey'
      AND conrelid = 'flt_vehicle_maintenance'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_maintenance'
        AND column_name = 'updated_by'
    ) THEN
      ALTER TABLE flt_vehicle_maintenance
        ADD CONSTRAINT flt_vehicle_maintenance_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

-- ============================================================================
-- STEP 8: Drop old partial indexes that referenced deleted_at
-- ============================================================================
DROP INDEX IF EXISTS flt_vehicle_maintenance_scheduled_date_idx;
DROP INDEX IF EXISTS flt_vehicle_maintenance_status_idx;
DROP INDEX IF EXISTS flt_vehicle_maintenance_next_service_date_idx;

-- ============================================================================
-- STEP 9: Create required indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS flt_vehicle_maintenance_tenant_id_idx
  ON flt_vehicle_maintenance(tenant_id);

CREATE INDEX IF NOT EXISTS flt_vehicle_maintenance_vehicle_id_idx
  ON flt_vehicle_maintenance(vehicle_id);

CREATE INDEX IF NOT EXISTS flt_vehicle_maintenance_maintenance_type_idx
  ON flt_vehicle_maintenance(maintenance_type);

CREATE INDEX IF NOT EXISTS flt_vehicle_maintenance_created_at_idx
  ON flt_vehicle_maintenance(created_at DESC);

CREATE INDEX IF NOT EXISTS flt_vehicle_maintenance_created_by_idx
  ON flt_vehicle_maintenance(created_by);

CREATE INDEX IF NOT EXISTS flt_vehicle_maintenance_updated_by_idx
  ON flt_vehicle_maintenance(updated_by);

CREATE INDEX IF NOT EXISTS flt_vehicle_maintenance_metadata_idx
  ON flt_vehicle_maintenance USING GIN (metadata);

CREATE INDEX IF NOT EXISTS flt_vehicle_maintenance_scheduled_date_active_idx
  ON flt_vehicle_maintenance(scheduled_date);

CREATE INDEX IF NOT EXISTS flt_vehicle_maintenance_status_active_idx
  ON flt_vehicle_maintenance(status);

CREATE INDEX IF NOT EXISTS flt_vehicle_maintenance_next_service_idx
  ON flt_vehicle_maintenance(next_service_date)
  WHERE status = 'completed';

-- ============================================================================
-- STEP 10: Enable Row Level Security
-- ============================================================================
ALTER TABLE flt_vehicle_maintenance ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 11: Create RLS policies
-- ============================================================================
DROP POLICY IF EXISTS tenant_isolation_flt_vehicle_maintenance ON flt_vehicle_maintenance;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicle_maintenance ON flt_vehicle_maintenance;

CREATE POLICY tenant_isolation_flt_vehicle_maintenance
  ON flt_vehicle_maintenance
  FOR ALL
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_flt_vehicle_maintenance
  ON flt_vehicle_maintenance
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- STEP 12: Recreate updated_at trigger
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'trigger_set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_flt_vehicle_maintenance'
      AND tgrelid = 'flt_vehicle_maintenance'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_flt_vehicle_maintenance
      BEFORE UPDATE ON flt_vehicle_maintenance
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_updated_at();
  END IF;
END
$$;

-- ============================================================================
-- VERIFICATION: Display final table structure
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'flt_vehicle_maintenance';

  RAISE NOTICE '✓ flt_vehicle_maintenance migration completed successfully';
  RAISE NOTICE '  Total columns: %', v_count;
END
$$;
