-- Migration: Align flt_vehicle_events with Fleetcore specification
-- Idempotent SQL migration for vehicle lifecycle events table

-- ============================================================================
-- STEP 1: Drop triggers (will be recreated at the end)
-- ============================================================================
DROP TRIGGER IF EXISTS update_flt_vehicle_events_updated_at ON flt_vehicle_events;
DROP TRIGGER IF EXISTS set_updated_at_flt_vehicle_events ON flt_vehicle_events;

-- ============================================================================
-- STEP 2: Drop old CHECK constraints
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_events_event_type_check'
      AND conrelid = 'flt_vehicle_events'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_events DROP CONSTRAINT flt_vehicle_events_event_type_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_events_severity_check'
      AND conrelid = 'flt_vehicle_events'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_events DROP CONSTRAINT flt_vehicle_events_severity_check;
  END IF;
END
$$;

-- ============================================================================
-- STEP 3: Drop indexes related to columns being removed or modified
-- ============================================================================
DROP INDEX IF EXISTS flt_vehicle_events_metadata_idx;
DROP INDEX IF EXISTS flt_vehicle_events_severity_idx;

-- ============================================================================
-- STEP 4: Alter column types to match specification
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_events'
      AND column_name = 'event_type'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_events ALTER COLUMN event_type TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_events'
      AND column_name = 'severity'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_events ALTER COLUMN severity TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_events'
      AND column_name = 'notes'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE flt_vehicle_events ALTER COLUMN notes SET DEFAULT NULL;
  END IF;
END
$$;

-- ============================================================================
-- STEP 5: Drop columns not in specification
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_events'
      AND column_name = 'metadata'
  ) THEN
    ALTER TABLE flt_vehicle_events DROP COLUMN metadata;
  END IF;
END
$$;

-- ============================================================================
-- STEP 6: Add CHECK constraints for event_type and severity
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_events_event_type_check'
      AND conrelid = 'flt_vehicle_events'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_events
      ADD CONSTRAINT flt_vehicle_events_event_type_check
      CHECK (event_type IN ('acquisition', 'disposal', 'maintenance', 'accident', 'handover', 'inspection', 'insurance'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_events_severity_check'
      AND conrelid = 'flt_vehicle_events'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_events
      ADD CONSTRAINT flt_vehicle_events_severity_check
      CHECK (severity IS NULL OR severity IN ('minor', 'moderate', 'severe', 'total_loss'));
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
    WHERE conname = 'flt_vehicle_events_created_by_fkey'
      AND conrelid = 'flt_vehicle_events'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_events'
        AND column_name = 'created_by'
    ) THEN
      ALTER TABLE flt_vehicle_events
        ADD CONSTRAINT flt_vehicle_events_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_events_updated_by_fkey'
      AND conrelid = 'flt_vehicle_events'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_events'
        AND column_name = 'updated_by'
    ) THEN
      ALTER TABLE flt_vehicle_events
        ADD CONSTRAINT flt_vehicle_events_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_events_deleted_by_fkey'
      AND conrelid = 'flt_vehicle_events'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_events'
        AND column_name = 'deleted_by'
    ) THEN
      ALTER TABLE flt_vehicle_events
        ADD CONSTRAINT flt_vehicle_events_deleted_by_fkey
        FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

-- ============================================================================
-- STEP 8: Create required indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS flt_vehicle_events_tenant_id_idx
  ON flt_vehicle_events(tenant_id);

CREATE INDEX IF NOT EXISTS flt_vehicle_events_vehicle_id_idx
  ON flt_vehicle_events(vehicle_id);

CREATE INDEX IF NOT EXISTS flt_vehicle_events_event_type_idx
  ON flt_vehicle_events(event_type);

CREATE INDEX IF NOT EXISTS flt_vehicle_events_event_date_idx
  ON flt_vehicle_events(event_date);

CREATE INDEX IF NOT EXISTS flt_vehicle_events_deleted_at_idx
  ON flt_vehicle_events(deleted_at);

CREATE INDEX IF NOT EXISTS flt_vehicle_events_created_by_idx
  ON flt_vehicle_events(created_by);

CREATE INDEX IF NOT EXISTS flt_vehicle_events_updated_by_idx
  ON flt_vehicle_events(updated_by);

CREATE INDEX IF NOT EXISTS flt_vehicle_events_created_at_idx
  ON flt_vehicle_events(created_at DESC);

CREATE INDEX IF NOT EXISTS flt_vehicle_events_severity_active_idx
  ON flt_vehicle_events(severity)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS flt_vehicle_events_details_idx
  ON flt_vehicle_events USING GIN (details);

-- ============================================================================
-- STEP 9: Enable Row Level Security
-- ============================================================================
ALTER TABLE flt_vehicle_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 10: Create RLS policies
-- ============================================================================
DROP POLICY IF EXISTS tenant_isolation_flt_vehicle_events ON flt_vehicle_events;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicle_events ON flt_vehicle_events;

CREATE POLICY tenant_isolation_flt_vehicle_events
  ON flt_vehicle_events
  FOR ALL
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_flt_vehicle_events
  ON flt_vehicle_events
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- STEP 11: Recreate updated_at trigger
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
    WHERE tgname = 'set_updated_at_flt_vehicle_events'
      AND tgrelid = 'flt_vehicle_events'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_flt_vehicle_events
      BEFORE UPDATE ON flt_vehicle_events
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
    AND table_name = 'flt_vehicle_events';

  RAISE NOTICE '✓ flt_vehicle_events migration completed successfully';
  RAISE NOTICE '  Total columns: %', v_count;
END
$$;
