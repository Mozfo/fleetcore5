-- ============================================================================
-- Migration: Rename rid_rides to trp_trips and cleanup dependencies
-- Date: 2025-10-09
-- Description:
--   - Rename rid_rides table to trp_trips (Trips domain)
--   - Drop auxiliary rid_ride_* tables if they exist
--   - Update foreign keys in dependent tables
--   - Recreate indexes and RLS policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Drop auxiliary tables (idempotent with IF EXISTS)
-- ============================================================================

DROP TABLE IF EXISTS rid_ride_cancellations CASCADE;
DROP TABLE IF EXISTS rid_ride_expenses CASCADE;
DROP TABLE IF EXISTS rid_ride_incidents CASCADE;
DROP TABLE IF EXISTS rid_ride_ratings CASCADE;
DROP TABLE IF EXISTS rid_ride_waypoints CASCADE;

-- ============================================================================
-- STEP 2: Rename rid_rides to trp_trips (idempotent check)
-- ============================================================================

DO $$
BEGIN
  -- Only rename if rid_rides exists and trp_trips doesn't
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rid_rides')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trp_trips')
  THEN
    ALTER TABLE rid_rides RENAME TO trp_trips;
    RAISE NOTICE 'Table rid_rides renamed to trp_trips';
  ELSE
    RAISE NOTICE 'Table already renamed or trp_trips already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Update foreign key in flt_vehicle_expenses
-- ============================================================================

DO $$
DECLARE
  constraint_name_val TEXT;
BEGIN
  -- Find and drop existing FK constraint on ride_id
  SELECT constraint_name INTO constraint_name_val
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name = 'flt_vehicle_expenses'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%ride_id%';

  IF constraint_name_val IS NOT NULL THEN
    EXECUTE format('ALTER TABLE flt_vehicle_expenses DROP CONSTRAINT IF EXISTS %I', constraint_name_val);
    RAISE NOTICE 'Dropped FK constraint % on flt_vehicle_expenses.ride_id', constraint_name_val;
  END IF;

  -- Create new FK constraint pointing to trp_trips
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_expenses'
      AND constraint_name = 'flt_vehicle_expenses_ride_id_fkey'
  ) THEN
    ALTER TABLE flt_vehicle_expenses
    ADD CONSTRAINT flt_vehicle_expenses_ride_id_fkey
    FOREIGN KEY (ride_id) REFERENCES trp_trips(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created FK constraint flt_vehicle_expenses.ride_id -> trp_trips.id';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Recreate indexes on trp_trips
-- ============================================================================

-- Drop old indexes from rid_rides (if they still reference the old table name)
DROP INDEX IF EXISTS rid_rides_tenant_id_idx;
DROP INDEX IF EXISTS rid_rides_driver_id_idx;
DROP INDEX IF EXISTS rid_rides_vehicle_id_idx;
DROP INDEX IF EXISTS rid_rides_platform_id_idx;
DROP INDEX IF EXISTS rid_rides_platform_id_platform_ride_id_idx;
DROP INDEX IF EXISTS rid_rides_status_idx;
DROP INDEX IF EXISTS rid_rides_pickup_time_idx;
DROP INDEX IF EXISTS rid_rides_dropoff_time_idx;
DROP INDEX IF EXISTS rid_rides_created_at_idx;
DROP INDEX IF EXISTS rid_rides_deleted_at_idx;
DROP INDEX IF EXISTS rid_rides_created_by_idx;
DROP INDEX IF EXISTS rid_rides_updated_by_idx;
DROP INDEX IF EXISTS rid_rides_gps_track_idx;
DROP INDEX IF EXISTS rid_rides_metadata_idx;

-- Create new indexes on trp_trips
CREATE INDEX IF NOT EXISTS trp_trips_tenant_id_idx ON trp_trips(tenant_id);
CREATE INDEX IF NOT EXISTS trp_trips_driver_id_idx ON trp_trips(driver_id);
CREATE INDEX IF NOT EXISTS trp_trips_vehicle_id_idx ON trp_trips(vehicle_id);
CREATE INDEX IF NOT EXISTS trp_trips_platform_id_idx ON trp_trips(platform_id);

-- Unique partial index on (platform_id, platform_ride_id) WHERE deleted_at IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS trp_trips_platform_id_platform_ride_id_key
  ON trp_trips(platform_id, platform_ride_id)
  WHERE deleted_at IS NULL;

-- Partial index on status WHERE deleted_at IS NULL
CREATE INDEX IF NOT EXISTS trp_trips_status_idx
  ON trp_trips(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS trp_trips_pickup_time_idx ON trp_trips(pickup_time);
CREATE INDEX IF NOT EXISTS trp_trips_dropoff_time_idx ON trp_trips(dropoff_time);
CREATE INDEX IF NOT EXISTS trp_trips_created_at_idx ON trp_trips(created_at DESC);
CREATE INDEX IF NOT EXISTS trp_trips_deleted_at_idx ON trp_trips(deleted_at);
CREATE INDEX IF NOT EXISTS trp_trips_created_by_idx ON trp_trips(created_by);
CREATE INDEX IF NOT EXISTS trp_trips_updated_by_idx ON trp_trips(updated_by);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS trp_trips_gps_track_idx ON trp_trips USING GIN(gps_track);
CREATE INDEX IF NOT EXISTS trp_trips_metadata_idx ON trp_trips USING GIN(metadata);

-- ============================================================================
-- STEP 5: Enable RLS and create policies
-- ============================================================================

ALTER TABLE trp_trips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS tenant_isolation_trp_trips ON trp_trips;
DROP POLICY IF EXISTS temp_allow_all_trp_trips ON trp_trips;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation_trp_trips ON trp_trips
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Create temporary allow-all policy (à désactiver en production)
CREATE POLICY temp_allow_all_trp_trips ON trp_trips
  FOR ALL TO authenticated
  USING (true);

COMMIT;
