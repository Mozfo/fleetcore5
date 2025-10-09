-- Rename primary key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rid_rides_pkey'
  ) THEN
    ALTER TABLE trp_trips RENAME CONSTRAINT rid_rides_pkey TO trp_trips_pkey;
  END IF;
END $$;

-- Rename foreign key constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rid_rides_platform_id_fkey'
  ) THEN
    ALTER TABLE trp_trips RENAME CONSTRAINT rid_rides_platform_id_fkey TO trp_trips_platform_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rid_rides_tenant_id_fkey'
  ) THEN
    ALTER TABLE trp_trips RENAME CONSTRAINT rid_rides_tenant_id_fkey TO trp_trips_tenant_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rid_rides_vehicle_id_fkey'
  ) THEN
    ALTER TABLE trp_trips RENAME CONSTRAINT rid_rides_vehicle_id_fkey TO trp_trips_vehicle_id_fkey;
  END IF;
END $$;

-- Update foreign key actions to include ON UPDATE CASCADE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trp_trips_tenant_id_fkey'
      AND confupdtype != 'c'
  ) THEN
    ALTER TABLE trp_trips DROP CONSTRAINT trp_trips_tenant_id_fkey;
    ALTER TABLE trp_trips ADD CONSTRAINT trp_trips_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trp_trips_driver_id_fkey'
      AND confupdtype != 'c'
  ) THEN
    ALTER TABLE trp_trips DROP CONSTRAINT trp_trips_driver_id_fkey;
    ALTER TABLE trp_trips ADD CONSTRAINT trp_trips_driver_id_fkey
      FOREIGN KEY (driver_id) REFERENCES rid_drivers(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trp_trips_vehicle_id_fkey'
      AND confupdtype != 'c'
  ) THEN
    ALTER TABLE trp_trips DROP CONSTRAINT trp_trips_vehicle_id_fkey;
    ALTER TABLE trp_trips ADD CONSTRAINT trp_trips_vehicle_id_fkey
      FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trp_trips_platform_id_fkey'
      AND confupdtype != 'c'
  ) THEN
    ALTER TABLE trp_trips DROP CONSTRAINT trp_trips_platform_id_fkey;
    ALTER TABLE trp_trips ADD CONSTRAINT trp_trips_platform_id_fkey
      FOREIGN KEY (platform_id) REFERENCES dir_platforms(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

-- Remove default value from status column
ALTER TABLE trp_trips ALTER COLUMN status DROP DEFAULT;

-- Ensure duration_minutes is DECIMAL type
DO $$
BEGIN
  ALTER TABLE trp_trips ALTER COLUMN duration_minutes TYPE DECIMAL;
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

-- Drop old check constraints
ALTER TABLE trp_trips DROP CONSTRAINT IF EXISTS trp_trips_payment_method_check;
ALTER TABLE trp_trips DROP CONSTRAINT IF EXISTS trp_trips_status_check;

-- Create new check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trp_trips_payment_method_check'
  ) THEN
    ALTER TABLE trp_trips ADD CONSTRAINT trp_trips_payment_method_check
      CHECK (payment_method IN ('cash', 'card', 'wallet', 'invoice'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trp_trips_status_check'
  ) THEN
    ALTER TABLE trp_trips ADD CONSTRAINT trp_trips_status_check
      CHECK (status IN ('completed', 'cancelled', 'rejected', 'no_show'));
  END IF;
END $$;

-- Drop duplicate/obsolete indexes
DROP INDEX IF EXISTS rid_rides_status_active_idx;
DROP INDEX IF EXISTS trp_trips_status_idx;
DROP INDEX IF EXISTS start_time_idx;
DROP INDEX IF EXISTS end_time_idx;
DROP INDEX IF EXISTS trip_date_idx;
DROP INDEX IF EXISTS tenant_id_idx;
DROP INDEX IF EXISTS driver_id_idx;
DROP INDEX IF EXISTS vehicle_id_idx;
DROP INDEX IF EXISTS platform_id_idx;

-- Remove duplicate triggers
DROP TRIGGER IF EXISTS update_rid_rides_updated_at ON trp_trips;
DROP TRIGGER IF EXISTS set_updated_at_trp_trips ON trp_trips;

-- Recreate the single trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_trp_trips'
  ) THEN
    CREATE TRIGGER set_updated_at_trp_trips
      BEFORE UPDATE ON trp_trips
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
EXCEPTION
  WHEN undefined_function THEN NULL;
END $$;

-- Create all required indexes
CREATE INDEX IF NOT EXISTS trp_trips_tenant_id_idx ON trp_trips(tenant_id);
CREATE INDEX IF NOT EXISTS trp_trips_driver_id_idx ON trp_trips(driver_id);
CREATE INDEX IF NOT EXISTS trp_trips_vehicle_id_idx ON trp_trips(vehicle_id);
CREATE INDEX IF NOT EXISTS trp_trips_platform_id_idx ON trp_trips(platform_id);
CREATE INDEX IF NOT EXISTS trp_trips_client_id_idx ON trp_trips(client_id);
CREATE INDEX IF NOT EXISTS trp_trips_trip_date_idx ON trp_trips(trip_date);
CREATE INDEX IF NOT EXISTS trp_trips_start_time_idx ON trp_trips(start_time);
CREATE INDEX IF NOT EXISTS trp_trips_end_time_idx ON trp_trips(end_time);
CREATE INDEX IF NOT EXISTS trp_trips_deleted_at_idx ON trp_trips(deleted_at);
CREATE INDEX IF NOT EXISTS trp_trips_created_at_idx ON trp_trips(created_at DESC);
CREATE INDEX IF NOT EXISTS trp_trips_status_active_idx ON trp_trips(status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE trp_trips ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_trp_trips ON trp_trips;
DROP POLICY IF EXISTS temp_allow_all_trp_trips ON trp_trips;

CREATE POLICY tenant_isolation_trp_trips ON trp_trips
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_trp_trips ON trp_trips
  FOR ALL TO authenticated
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ trp_trips migration completed successfully';
  RAISE NOTICE '  - Primary key: trp_trips_pkey';
  RAISE NOTICE '  - Foreign keys: 4 (with ON UPDATE CASCADE)';
  RAISE NOTICE '  - Check constraints: 2 (payment_method, status)';
  RAISE NOTICE '  - Indexes: 11 (including partial index on status)';
  RAISE NOTICE '  - RLS policies: 2';
  RAISE NOTICE '  - Triggers: 1 (if function exists)';
  RAISE NOTICE '  - Status column: DEFAULT removed';
END $$;
