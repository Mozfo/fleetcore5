-- Migration: Align flt_vehicle_expenses with Fleetcore specification
-- Idempotent SQL migration for vehicle expenses table

-- ============================================================================
-- STEP 1: Drop triggers (will be recreated at the end)
-- ============================================================================
DROP TRIGGER IF EXISTS update_flt_vehicle_expenses_updated_at ON flt_vehicle_expenses;
DROP TRIGGER IF EXISTS set_updated_at_flt_vehicle_expenses ON flt_vehicle_expenses;

-- ============================================================================
-- STEP 2: Drop old CHECK constraints
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_expenses_expense_category_check'
      AND conrelid = 'flt_vehicle_expenses'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_expenses DROP CONSTRAINT flt_vehicle_expenses_expense_category_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_expenses_payment_method_check'
      AND conrelid = 'flt_vehicle_expenses'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_expenses DROP CONSTRAINT flt_vehicle_expenses_payment_method_check;
  END IF;
END
$$;

-- ============================================================================
-- STEP 3: Alter column types to match specification
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_expenses'
      AND column_name = 'expense_category'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_expenses ALTER COLUMN expense_category TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_expenses'
      AND column_name = 'payment_method'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_expenses ALTER COLUMN payment_method TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_expenses'
      AND column_name = 'receipt_url'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_expenses ALTER COLUMN receipt_url TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_expenses'
      AND column_name = 'location'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_expenses ALTER COLUMN location TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_expenses'
      AND column_name = 'vendor'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_expenses ALTER COLUMN vendor TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_expenses'
      AND column_name = 'description'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_expenses ALTER COLUMN description TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_expenses'
      AND column_name = 'notes'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_expenses ALTER COLUMN notes TYPE TEXT;
  END IF;
END
$$;

-- ============================================================================
-- STEP 4: Add CHECK constraints for expense_category and payment_method
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_expenses_expense_category_check'
      AND conrelid = 'flt_vehicle_expenses'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_expenses
      ADD CONSTRAINT flt_vehicle_expenses_expense_category_check
      CHECK (expense_category IN ('fuel', 'toll', 'parking', 'wash', 'repair', 'fine', 'other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_expenses_payment_method_check'
      AND conrelid = 'flt_vehicle_expenses'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_expenses
      ADD CONSTRAINT flt_vehicle_expenses_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN ('cash', 'card', 'fuel_card', 'toll_card', 'company_account'));
  END IF;
END
$$;

-- ============================================================================
-- STEP 5: Ensure foreign key constraints exist with proper cascade rules
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_expenses_created_by_fkey'
      AND conrelid = 'flt_vehicle_expenses'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_expenses'
        AND column_name = 'created_by'
    ) THEN
      ALTER TABLE flt_vehicle_expenses
        ADD CONSTRAINT flt_vehicle_expenses_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_expenses_updated_by_fkey'
      AND conrelid = 'flt_vehicle_expenses'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_expenses'
        AND column_name = 'updated_by'
    ) THEN
      ALTER TABLE flt_vehicle_expenses
        ADD CONSTRAINT flt_vehicle_expenses_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_expenses_deleted_by_fkey'
      AND conrelid = 'flt_vehicle_expenses'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_expenses'
        AND column_name = 'deleted_by'
    ) THEN
      ALTER TABLE flt_vehicle_expenses
        ADD CONSTRAINT flt_vehicle_expenses_deleted_by_fkey
        FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

-- ============================================================================
-- STEP 6: Create required indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_tenant_id_idx
  ON flt_vehicle_expenses(tenant_id);

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_vehicle_id_idx
  ON flt_vehicle_expenses(vehicle_id);

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_driver_id_idx
  ON flt_vehicle_expenses(driver_id);

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_ride_id_idx
  ON flt_vehicle_expenses(ride_id);

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_expense_category_idx
  ON flt_vehicle_expenses(expense_category);

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_expense_date_idx
  ON flt_vehicle_expenses(expense_date);

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_reimbursed_active_idx
  ON flt_vehicle_expenses(reimbursed)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_created_at_idx
  ON flt_vehicle_expenses(created_at DESC);

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_deleted_at_idx
  ON flt_vehicle_expenses(deleted_at);

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_created_by_idx
  ON flt_vehicle_expenses(created_by);

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_updated_by_idx
  ON flt_vehicle_expenses(updated_by);

CREATE INDEX IF NOT EXISTS flt_vehicle_expenses_metadata_idx
  ON flt_vehicle_expenses USING GIN (metadata);

-- ============================================================================
-- STEP 7: Enable Row Level Security
-- ============================================================================
ALTER TABLE flt_vehicle_expenses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: Create RLS policies
-- ============================================================================
DROP POLICY IF EXISTS tenant_isolation_flt_vehicle_expenses ON flt_vehicle_expenses;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicle_expenses ON flt_vehicle_expenses;

CREATE POLICY tenant_isolation_flt_vehicle_expenses
  ON flt_vehicle_expenses
  FOR ALL
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_flt_vehicle_expenses
  ON flt_vehicle_expenses
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- STEP 9: Recreate updated_at trigger
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
    WHERE tgname = 'set_updated_at_flt_vehicle_expenses'
      AND tgrelid = 'flt_vehicle_expenses'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_flt_vehicle_expenses
      BEFORE UPDATE ON flt_vehicle_expenses
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
    AND table_name = 'flt_vehicle_expenses';

  RAISE NOTICE '✓ flt_vehicle_expenses migration completed successfully';
  RAISE NOTICE '  Total columns: %', v_count;
END
$$;
