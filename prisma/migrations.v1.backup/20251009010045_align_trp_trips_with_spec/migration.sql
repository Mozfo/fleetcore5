-- ============================================================================
-- Migration: Align trp_trips with official spec
-- Date: 2025-10-09
-- Description:
--   - Rename columns to match spec (pickup_time → start_time, etc.)
--   - Drop columns not in spec
--   - Add missing columns (client_id, trip_date, fare_*, surge_multiplier, tip_amount)
--   - Convert duration_minutes to DECIMAL
--   - Add CHECK constraints on payment_method and status
--   - Recreate indexes, triggers, and RLS policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Rename columns to match spec
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'pickup_time') THEN
    ALTER TABLE trp_trips RENAME COLUMN pickup_time TO start_time;
    RAISE NOTICE 'Renamed pickup_time to start_time';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'dropoff_time') THEN
    ALTER TABLE trp_trips RENAME COLUMN dropoff_time TO end_time;
    RAISE NOTICE 'Renamed dropoff_time to end_time';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'commission_amount') THEN
    ALTER TABLE trp_trips RENAME COLUMN commission_amount TO platform_commission;
    RAISE NOTICE 'Renamed commission_amount to platform_commission';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'driver_earnings') THEN
    ALTER TABLE trp_trips RENAME COLUMN driver_earnings TO net_earnings;
    RAISE NOTICE 'Renamed driver_earnings to net_earnings';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop columns not in official spec
-- ============================================================================

ALTER TABLE trp_trips DROP COLUMN IF EXISTS platform_ride_id;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS passenger_name;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS passenger_phone;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS pickup_address;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS dropoff_address;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS vehicle_class;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS ride_type;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS currency;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS commission_rate;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS fare_amount;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS gps_track;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS metadata;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS created_by;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS updated_by;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS deleted_by;
ALTER TABLE trp_trips DROP COLUMN IF EXISTS deletion_reason;

-- ============================================================================
-- STEP 3: Add missing columns
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'client_id') THEN
    ALTER TABLE trp_trips ADD COLUMN client_id UUID;
    RAISE NOTICE 'Added column client_id';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'trip_date') THEN
    ALTER TABLE trp_trips ADD COLUMN trip_date DATE;
    RAISE NOTICE 'Added column trip_date';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'fare_base') THEN
    ALTER TABLE trp_trips ADD COLUMN fare_base DECIMAL;
    RAISE NOTICE 'Added column fare_base';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'fare_distance') THEN
    ALTER TABLE trp_trips ADD COLUMN fare_distance DECIMAL;
    RAISE NOTICE 'Added column fare_distance';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'fare_time') THEN
    ALTER TABLE trp_trips ADD COLUMN fare_time DECIMAL;
    RAISE NOTICE 'Added column fare_time';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'surge_multiplier') THEN
    ALTER TABLE trp_trips ADD COLUMN surge_multiplier DECIMAL;
    RAISE NOTICE 'Added column surge_multiplier';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trp_trips' AND column_name = 'tip_amount') THEN
    ALTER TABLE trp_trips ADD COLUMN tip_amount DECIMAL;
    RAISE NOTICE 'Added column tip_amount';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Convert duration_minutes to DECIMAL
-- ============================================================================

ALTER TABLE trp_trips ALTER COLUMN duration_minutes TYPE DECIMAL USING duration_minutes::DECIMAL;

-- ============================================================================
-- STEP 5: Add CHECK constraints
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trp_trips_payment_method_check'
      AND conrelid = 'trp_trips'::regclass
  ) THEN
    ALTER TABLE trp_trips
      ADD CONSTRAINT trp_trips_payment_method_check
      CHECK (payment_method IN ('cash', 'card', 'wallet', 'invoice'));
    RAISE NOTICE 'Added CHECK constraint on payment_method';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trp_trips_status_check'
      AND conrelid = 'trp_trips'::regclass
  ) THEN
    ALTER TABLE trp_trips
      ADD CONSTRAINT trp_trips_status_check
      CHECK (status IN ('completed', 'cancelled', 'rejected', 'no_show'));
    RAISE NOTICE 'Added CHECK constraint on status';
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Drop old indexes
-- ============================================================================

DROP INDEX IF EXISTS trp_trips_created_by_idx;
DROP INDEX IF EXISTS trp_trips_updated_by_idx;
DROP INDEX IF EXISTS trp_trips_pickup_time_idx;
DROP INDEX IF EXISTS trp_trips_platform_ride_id_idx;
DROP INDEX IF EXISTS trp_trips_passenger_name_idx;
DROP INDEX IF EXISTS trp_trips_ride_type_idx;
DROP INDEX IF EXISTS trp_trips_payment_method_idx;
DROP INDEX IF EXISTS trp_trips_gps_track_idx;
DROP INDEX IF EXISTS trp_trips_metadata_idx;
DROP INDEX IF EXISTS trp_trips_platform_id_platform_ride_id_key;
DROP INDEX IF EXISTS trp_trips_vehicle_class_idx;
DROP INDEX IF EXISTS trp_trips_commission_rate_idx;

-- ============================================================================
-- STEP 7: Create new indexes per spec
-- ============================================================================

CREATE INDEX IF NOT EXISTS trp_trips_tenant_id_idx ON trp_trips(tenant_id);
CREATE INDEX IF NOT EXISTS trp_trips_platform_id_idx ON trp_trips(platform_id);
CREATE INDEX IF NOT EXISTS trp_trips_driver_id_idx ON trp_trips(driver_id);
CREATE INDEX IF NOT EXISTS trp_trips_vehicle_id_idx ON trp_trips(vehicle_id);
CREATE INDEX IF NOT EXISTS trp_trips_client_id_idx ON trp_trips(client_id);
CREATE INDEX IF NOT EXISTS trp_trips_trip_date_idx ON trp_trips(trip_date);
CREATE INDEX IF NOT EXISTS trp_trips_start_time_idx ON trp_trips(start_time);
CREATE INDEX IF NOT EXISTS trp_trips_end_time_idx ON trp_trips(end_time);
CREATE INDEX IF NOT EXISTS trp_trips_status_idx ON trp_trips(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS trp_trips_created_at_idx ON trp_trips(created_at DESC);
CREATE INDEX IF NOT EXISTS trp_trips_deleted_at_idx ON trp_trips(deleted_at);

-- ============================================================================
-- STEP 8: Recreate trigger for updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS set_updated_at_trp_trips ON trp_trips;
DROP TRIGGER IF EXISTS trigger_set_updated_at_trp_trips ON trp_trips;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_trp_trips
  BEFORE UPDATE ON trp_trips
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- STEP 9: Enable RLS and create policies
-- ============================================================================

ALTER TABLE trp_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_trp_trips ON trp_trips;
DROP POLICY IF EXISTS temp_allow_all_trp_trips ON trp_trips;
DROP POLICY IF EXISTS tenant_isolation_rid_rides ON trp_trips;
DROP POLICY IF EXISTS temp_allow_all_rid_rides ON trp_trips;

CREATE POLICY tenant_isolation_trp_trips ON trp_trips
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_trp_trips ON trp_trips
  FOR ALL TO authenticated
  USING (true);

COMMIT;
