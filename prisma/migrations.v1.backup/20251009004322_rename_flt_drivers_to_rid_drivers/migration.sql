-- ============================================================================
-- Migration: Rename flt_drivers to rid_drivers and align with official spec
-- Date: 2025-10-09
-- Description:
--   - Rename flt_drivers to rid_drivers (Drivers domain)
--   - Update foreign keys in dependent tables
--   - Rename columns to match official spec
--   - Drop columns not in spec
--   - Add missing columns (rating, notes)
--   - Set DEFAULT 'active' on driver_status
--   - Add CHECK constraint on driver_status
--   - Recreate indexes, triggers, and RLS policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Rename flt_drivers to rid_drivers (idempotent check)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'flt_drivers')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rid_drivers')
  THEN
    ALTER TABLE flt_drivers RENAME TO rid_drivers;
    RAISE NOTICE 'Table flt_drivers renamed to rid_drivers';
  ELSE
    RAISE NOTICE 'Table already renamed or rid_drivers already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Update foreign key in flt_vehicle_expenses
-- ============================================================================

DO $$
DECLARE
  constraint_name_val TEXT;
BEGIN
  SELECT constraint_name INTO constraint_name_val
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name = 'flt_vehicle_expenses'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%driver_id%';

  IF constraint_name_val IS NOT NULL THEN
    EXECUTE format('ALTER TABLE flt_vehicle_expenses DROP CONSTRAINT IF EXISTS %I', constraint_name_val);
    RAISE NOTICE 'Dropped FK constraint % on flt_vehicle_expenses.driver_id', constraint_name_val;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_expenses'
      AND constraint_name = 'flt_vehicle_expenses_driver_id_fkey'
  ) THEN
    ALTER TABLE flt_vehicle_expenses
    ADD CONSTRAINT flt_vehicle_expenses_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created FK constraint flt_vehicle_expenses.driver_id -> rid_drivers.id';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Update foreign key in trp_trips
-- ============================================================================

DO $$
DECLARE
  constraint_name_val TEXT;
BEGIN
  SELECT constraint_name INTO constraint_name_val
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name = 'trp_trips'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%driver_id%';

  IF constraint_name_val IS NOT NULL THEN
    EXECUTE format('ALTER TABLE trp_trips DROP CONSTRAINT IF EXISTS %I', constraint_name_val);
    RAISE NOTICE 'Dropped FK constraint % on trp_trips.driver_id', constraint_name_val;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'trp_trips'
      AND constraint_name = 'trp_trips_driver_id_fkey'
  ) THEN
    ALTER TABLE trp_trips
    ADD CONSTRAINT trp_trips_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created FK constraint trp_trips.driver_id -> rid_drivers.id';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Rename columns to match official spec
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rid_drivers' AND column_name = 'driver_license_number') THEN
    ALTER TABLE rid_drivers RENAME COLUMN driver_license_number TO license_number;
    RAISE NOTICE 'Renamed driver_license_number to license_number';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rid_drivers' AND column_name = 'professional_card_number') THEN
    ALTER TABLE rid_drivers RENAME COLUMN professional_card_number TO professional_card_no;
    RAISE NOTICE 'Renamed professional_card_number to professional_card_no';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rid_drivers' AND column_name = 'professional_card_expiry_date') THEN
    ALTER TABLE rid_drivers RENAME COLUMN professional_card_expiry_date TO professional_expiry;
    RAISE NOTICE 'Renamed professional_card_expiry_date to professional_expiry';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rid_drivers' AND column_name = 'status') THEN
    ALTER TABLE rid_drivers RENAME COLUMN status TO driver_status;
    RAISE NOTICE 'Renamed status to driver_status';
  END IF;
END $$;

-- ============================================================================
-- STEP 4.5: Set default value and CHECK constraint on driver_status
-- ============================================================================

ALTER TABLE rid_drivers ALTER COLUMN driver_status SET DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rid_drivers_driver_status_check'
      AND conrelid = 'rid_drivers'::regclass
  ) THEN
    ALTER TABLE rid_drivers
    ADD CONSTRAINT rid_drivers_driver_status_check
    CHECK (driver_status IN ('active', 'suspended', 'terminated'));
    RAISE NOTICE 'Added CHECK constraint on driver_status';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Drop columns not in official spec
-- ============================================================================

ALTER TABLE rid_drivers DROP COLUMN IF EXISTS member_id;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS national_id;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS address_line1;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS address_line2;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS city;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS postal_code;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS country_code;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS iban;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS bank_name;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS emergency_contact;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS metadata;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS created_by;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS updated_by;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS deleted_by;
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS deletion_reason;

-- ============================================================================
-- STEP 6: Add missing columns
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rid_drivers' AND column_name = 'rating') THEN
    ALTER TABLE rid_drivers ADD COLUMN rating DECIMAL;
    RAISE NOTICE 'Added column rating';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rid_drivers' AND column_name = 'notes') THEN
    ALTER TABLE rid_drivers ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added column notes';
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Update column types to match spec (text instead of varchar/citext)
-- ============================================================================

ALTER TABLE rid_drivers ALTER COLUMN first_name TYPE TEXT;
ALTER TABLE rid_drivers ALTER COLUMN last_name TYPE TEXT;
ALTER TABLE rid_drivers ALTER COLUMN email TYPE TEXT;
ALTER TABLE rid_drivers ALTER COLUMN phone TYPE TEXT;
ALTER TABLE rid_drivers ALTER COLUMN license_number TYPE TEXT;
ALTER TABLE rid_drivers ALTER COLUMN professional_card_no TYPE TEXT;

-- ============================================================================
-- STEP 8: Drop old indexes
-- ============================================================================

DROP INDEX IF EXISTS flt_drivers_tenant_id_idx;
DROP INDEX IF EXISTS flt_drivers_member_id_idx;
DROP INDEX IF EXISTS flt_drivers_email_idx;
DROP INDEX IF EXISTS flt_drivers_driver_license_number_idx;
DROP INDEX IF EXISTS flt_drivers_status_idx;
DROP INDEX IF EXISTS flt_drivers_country_code_idx;
DROP INDEX IF EXISTS flt_drivers_deleted_at_idx;
DROP INDEX IF EXISTS flt_drivers_created_by_idx;
DROP INDEX IF EXISTS flt_drivers_updated_by_idx;
DROP INDEX IF EXISTS flt_drivers_emergency_contact_idx;
DROP INDEX IF EXISTS flt_drivers_metadata_idx;
DROP INDEX IF EXISTS rid_drivers_member_id_idx;
DROP INDEX IF EXISTS rid_drivers_driver_license_number_idx;
DROP INDEX IF EXISTS rid_drivers_country_code_idx;
DROP INDEX IF EXISTS rid_drivers_created_by_idx;
DROP INDEX IF EXISTS rid_drivers_updated_by_idx;
DROP INDEX IF EXISTS rid_drivers_emergency_contact_idx;
DROP INDEX IF EXISTS rid_drivers_metadata_idx;

-- ============================================================================
-- STEP 9: Create new indexes per spec
-- ============================================================================

CREATE INDEX IF NOT EXISTS rid_drivers_tenant_id_idx ON rid_drivers(tenant_id);
CREATE INDEX IF NOT EXISTS rid_drivers_first_name_idx ON rid_drivers(first_name);
CREATE INDEX IF NOT EXISTS rid_drivers_last_name_idx ON rid_drivers(last_name);
CREATE INDEX IF NOT EXISTS rid_drivers_phone_idx ON rid_drivers(phone);
CREATE INDEX IF NOT EXISTS rid_drivers_email_idx ON rid_drivers(email);
CREATE INDEX IF NOT EXISTS rid_drivers_license_number_idx ON rid_drivers(license_number);
CREATE INDEX IF NOT EXISTS rid_drivers_driver_status_idx ON rid_drivers(driver_status);
CREATE INDEX IF NOT EXISTS rid_drivers_deleted_at_idx ON rid_drivers(deleted_at);
CREATE INDEX IF NOT EXISTS rid_drivers_created_at_idx ON rid_drivers(created_at DESC);

CREATE INDEX IF NOT EXISTS rid_drivers_notes_idx ON rid_drivers USING GIN(to_tsvector('english', notes)) WHERE notes IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS rid_drivers_tenant_id_email_key
  ON rid_drivers(tenant_id, email)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS rid_drivers_tenant_id_license_number_key
  ON rid_drivers(tenant_id, license_number)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 10: Recreate trigger for updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS set_updated_at_rid_drivers ON rid_drivers;
DROP TRIGGER IF EXISTS trigger_set_updated_at_rid_drivers ON rid_drivers;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_rid_drivers
  BEFORE UPDATE ON rid_drivers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- STEP 11: Enable RLS and create policies
-- ============================================================================

ALTER TABLE rid_drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_rid_drivers ON rid_drivers;
DROP POLICY IF EXISTS temp_allow_all_rid_drivers ON rid_drivers;
DROP POLICY IF EXISTS tenant_isolation_flt_drivers ON rid_drivers;
DROP POLICY IF EXISTS temp_allow_all_flt_drivers ON rid_drivers;

CREATE POLICY tenant_isolation_rid_drivers ON rid_drivers
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_rid_drivers ON rid_drivers
  FOR ALL TO authenticated
  USING (true);

COMMIT;
