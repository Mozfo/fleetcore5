-- Migration: Align flt_vehicle_insurances with Fleetcore specification
-- Idempotent SQL migration for vehicle insurances table

-- ============================================================================
-- STEP 1: Drop triggers (will be recreated at the end)
-- ============================================================================
DROP TRIGGER IF EXISTS update_flt_vehicle_insurances_updated_at ON flt_vehicle_insurances;
DROP TRIGGER IF EXISTS set_updated_at_flt_vehicle_insurances ON flt_vehicle_insurances;

-- ============================================================================
-- STEP 2: Drop old unique index including deleted_at
-- ============================================================================
DROP INDEX IF EXISTS flt_vehicle_insurances_tenant_id_policy_number_deleted_at_key;

-- ============================================================================
-- STEP 3: Drop unnecessary indexes
-- ============================================================================
DROP INDEX IF EXISTS flt_vehicle_insurances_deleted_at_idx;
DROP INDEX IF EXISTS flt_vehicle_insurances_created_by_idx;
DROP INDEX IF EXISTS flt_vehicle_insurances_updated_by_idx;

-- ============================================================================
-- STEP 4: Drop old CHECK constraints to recreate them
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_policy_type_check'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_insurances DROP CONSTRAINT flt_vehicle_insurances_policy_type_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_premium_frequency_check'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_insurances DROP CONSTRAINT flt_vehicle_insurances_premium_frequency_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_premium_amount_check'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_insurances DROP CONSTRAINT flt_vehicle_insurances_premium_amount_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_claim_count_check'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_insurances DROP CONSTRAINT flt_vehicle_insurances_claim_count_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_dates_check'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_insurances DROP CONSTRAINT flt_vehicle_insurances_dates_check;
  END IF;
END
$$;

-- ============================================================================
-- STEP 5: Alter column types to match specification
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_insurances'
      AND column_name = 'provider_name'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_insurances ALTER COLUMN provider_name TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_insurances'
      AND column_name = 'policy_number'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_insurances ALTER COLUMN policy_number TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_insurances'
      AND column_name = 'policy_type'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_insurances ALTER COLUMN policy_type TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_insurances'
      AND column_name = 'premium_frequency'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_insurances ALTER COLUMN premium_frequency TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_insurances'
      AND column_name = 'contact_name'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_insurances ALTER COLUMN contact_name TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_insurances'
      AND column_name = 'contact_phone'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_insurances ALTER COLUMN contact_phone TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_insurances'
      AND column_name = 'contact_email'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_insurances ALTER COLUMN contact_email TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_insurances'
      AND column_name = 'document_url'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_insurances ALTER COLUMN document_url TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'flt_vehicle_insurances'
      AND column_name = 'notes'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicle_insurances ALTER COLUMN notes TYPE TEXT;
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
    WHERE conname = 'flt_vehicle_insurances_policy_type_check'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_insurances
      ADD CONSTRAINT flt_vehicle_insurances_policy_type_check
      CHECK (policy_type IN ('comprehensive', 'third_party', 'collision', 'other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_premium_frequency_check'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_insurances
      ADD CONSTRAINT flt_vehicle_insurances_premium_frequency_check
      CHECK (premium_frequency IN ('annual', 'semi_annual', 'quarterly', 'monthly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_premium_amount_check'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_insurances
      ADD CONSTRAINT flt_vehicle_insurances_premium_amount_check
      CHECK (premium_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_claim_count_check'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_insurances
      ADD CONSTRAINT flt_vehicle_insurances_claim_count_check
      CHECK (claim_count >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_dates_check'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    ALTER TABLE flt_vehicle_insurances
      ADD CONSTRAINT flt_vehicle_insurances_dates_check
      CHECK (end_date > start_date);
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
    WHERE conname = 'flt_vehicle_insurances_created_by_fkey'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_insurances'
        AND column_name = 'created_by'
    ) THEN
      ALTER TABLE flt_vehicle_insurances
        ADD CONSTRAINT flt_vehicle_insurances_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_updated_by_fkey'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_insurances'
        AND column_name = 'updated_by'
    ) THEN
      ALTER TABLE flt_vehicle_insurances
        ADD CONSTRAINT flt_vehicle_insurances_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicle_insurances_deleted_by_fkey'
      AND conrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flt_vehicle_insurances'
        AND column_name = 'deleted_by'
    ) THEN
      ALTER TABLE flt_vehicle_insurances
        ADD CONSTRAINT flt_vehicle_insurances_deleted_by_fkey
        FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

-- ============================================================================
-- STEP 8: Create required indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS flt_vehicle_insurances_tenant_id_idx
  ON flt_vehicle_insurances(tenant_id);

CREATE INDEX IF NOT EXISTS flt_vehicle_insurances_vehicle_id_idx
  ON flt_vehicle_insurances(vehicle_id);

CREATE INDEX IF NOT EXISTS flt_vehicle_insurances_policy_number_idx
  ON flt_vehicle_insurances(policy_number);

CREATE INDEX IF NOT EXISTS flt_vehicle_insurances_policy_type_idx
  ON flt_vehicle_insurances(policy_type);

CREATE INDEX IF NOT EXISTS flt_vehicle_insurances_created_at_idx
  ON flt_vehicle_insurances(created_at DESC);

CREATE INDEX IF NOT EXISTS flt_vehicle_insurances_end_date_active_idx
  ON flt_vehicle_insurances(end_date)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS flt_vehicle_insurances_is_active_idx
  ON flt_vehicle_insurances(is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS flt_vehicle_insurances_metadata_idx
  ON flt_vehicle_insurances USING GIN (metadata);

CREATE UNIQUE INDEX IF NOT EXISTS flt_vehicle_insurances_tenant_policy_uq
  ON flt_vehicle_insurances(tenant_id, policy_number)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 9: Enable Row Level Security
-- ============================================================================
ALTER TABLE flt_vehicle_insurances ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 10: Create RLS policies
-- ============================================================================
DROP POLICY IF EXISTS tenant_isolation_flt_vehicle_insurances ON flt_vehicle_insurances;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicle_insurances ON flt_vehicle_insurances;

CREATE POLICY tenant_isolation_flt_vehicle_insurances
  ON flt_vehicle_insurances
  FOR ALL
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_flt_vehicle_insurances
  ON flt_vehicle_insurances
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
    WHERE tgname = 'set_updated_at_flt_vehicle_insurances'
      AND tgrelid = 'flt_vehicle_insurances'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_flt_vehicle_insurances
      BEFORE UPDATE ON flt_vehicle_insurances
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
    AND table_name = 'flt_vehicle_insurances';

  RAISE NOTICE '✓ flt_vehicle_insurances migration completed successfully';
  RAISE NOTICE '  Total columns: %', v_count;
END
$$;
