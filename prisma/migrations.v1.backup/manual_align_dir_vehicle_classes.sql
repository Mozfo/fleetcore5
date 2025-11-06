-- Migration: Align dir_vehicle_classes with Fleetcore specification
-- Idempotent SQL migration for vehicle classes reference table
-- This table is a global reference table (no tenant isolation)

-- ============================================================================
-- STEP 1: Drop triggers (will be recreated at the end)
-- ============================================================================
DROP TRIGGER IF EXISTS update_dir_vehicle_classes_updated_at ON dir_vehicle_classes;
DROP TRIGGER IF EXISTS set_updated_at_dir_vehicle_classes ON dir_vehicle_classes;

-- ============================================================================
-- STEP 2: Drop foreign key constraints for audit fields
-- ============================================================================
ALTER TABLE dir_vehicle_classes DROP CONSTRAINT IF EXISTS dir_vehicle_classes_created_by_fkey;
ALTER TABLE dir_vehicle_classes DROP CONSTRAINT IF EXISTS dir_vehicle_classes_updated_by_fkey;
ALTER TABLE dir_vehicle_classes DROP CONSTRAINT IF EXISTS dir_vehicle_classes_deleted_by_fkey;

-- ============================================================================
-- STEP 3: Drop indexes related to columns being removed
-- ============================================================================
DROP INDEX IF EXISTS dir_vehicle_classes_deleted_at_idx;
DROP INDEX IF EXISTS dir_vehicle_classes_created_by_idx;
DROP INDEX IF EXISTS dir_vehicle_classes_updated_by_idx;

-- Drop old unique index that includes deleted_at
DROP INDEX IF EXISTS dir_vehicle_classes_country_code_name_deleted_at_key;

-- ============================================================================
-- STEP 4: Alter column types to match specification
-- ============================================================================
DO $$
BEGIN
  -- Convert name from VARCHAR(50) to TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dir_vehicle_classes'
      AND column_name = 'name'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE dir_vehicle_classes ALTER COLUMN name TYPE TEXT;
  END IF;
END
$$;

-- ============================================================================
-- STEP 5: Drop columns not in specification
-- ============================================================================
DO $$
BEGIN
  -- Drop audit columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dir_vehicle_classes'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE dir_vehicle_classes DROP COLUMN created_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dir_vehicle_classes'
      AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE dir_vehicle_classes DROP COLUMN updated_by;
  END IF;

  -- Drop soft delete columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dir_vehicle_classes'
      AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE dir_vehicle_classes DROP COLUMN deleted_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dir_vehicle_classes'
      AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE dir_vehicle_classes DROP COLUMN deleted_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dir_vehicle_classes'
      AND column_name = 'deletion_reason'
  ) THEN
    ALTER TABLE dir_vehicle_classes DROP COLUMN deletion_reason;
  END IF;
END
$$;

-- ============================================================================
-- STEP 6: Create required indexes
-- ============================================================================

-- Index on country_code (foreign key performance)
CREATE INDEX IF NOT EXISTS dir_vehicle_classes_country_code_idx
  ON dir_vehicle_classes(country_code);

-- Unique constraint on (country_code, name) without deleted_at
CREATE UNIQUE INDEX IF NOT EXISTS dir_vehicle_classes_country_name_uq
  ON dir_vehicle_classes(country_code, name);

-- Indexes on timestamp columns for querying
CREATE INDEX IF NOT EXISTS dir_vehicle_classes_created_at_idx
  ON dir_vehicle_classes(created_at);

CREATE INDEX IF NOT EXISTS dir_vehicle_classes_updated_at_idx
  ON dir_vehicle_classes(updated_at);

-- ============================================================================
-- STEP 7: Enable Row Level Security
-- ============================================================================
ALTER TABLE dir_vehicle_classes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: Create RLS policy (permissive for reference table)
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_dir_vehicle_classes ON dir_vehicle_classes;
DROP POLICY IF EXISTS tenant_isolation_dir_vehicle_classes ON dir_vehicle_classes;

CREATE POLICY temp_allow_all_dir_vehicle_classes
  ON dir_vehicle_classes
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- STEP 9: Recreate updated_at trigger
-- ============================================================================
DO $$
BEGIN
  -- Check if the trigger function exists, create if not
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

  -- Create the trigger if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_dir_vehicle_classes'
      AND tgrelid = 'dir_vehicle_classes'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_dir_vehicle_classes
      BEFORE UPDATE ON dir_vehicle_classes
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
    AND table_name = 'dir_vehicle_classes';

  RAISE NOTICE '✓ dir_vehicle_classes migration completed successfully';
  RAISE NOTICE '  Total columns: %', v_count;
  RAISE NOTICE '  Expected: 7 (id, country_code, name, description, max_age, created_at, updated_at)';
END
$$;
