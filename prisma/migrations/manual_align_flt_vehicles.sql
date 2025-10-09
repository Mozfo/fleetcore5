-- Migration: Align flt_vehicles with Fleetcore specification
-- Idempotent SQL migration for fleet vehicles table

DROP TRIGGER IF EXISTS update_flt_vehicles_updated_at ON flt_vehicles;
DROP TRIGGER IF EXISTS set_updated_at_flt_vehicles ON flt_vehicles;

DROP INDEX IF EXISTS flt_vehicles_tenant_id_license_plate_deleted_at_key;
DROP INDEX IF EXISTS flt_vehicles_tenant_id_vin_deleted_at_key;
DROP INDEX IF EXISTS flt_vehicles_status_idx;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
      AND column_name = 'license_plate' AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicles ALTER COLUMN license_plate TYPE TEXT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
      AND column_name = 'vin' AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicles ALTER COLUMN vin TYPE TEXT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
      AND column_name = 'color' AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicles ALTER COLUMN color TYPE TEXT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
      AND column_name = 'vehicle_class' AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicles ALTER COLUMN vehicle_class TYPE TEXT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
      AND column_name = 'fuel_type' AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicles ALTER COLUMN fuel_type TYPE TEXT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
      AND column_name = 'transmission' AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicles ALTER COLUMN transmission TYPE TEXT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
      AND column_name = 'insurance_number' AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicles ALTER COLUMN insurance_number TYPE TEXT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
      AND column_name = 'ownership_type' AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicles ALTER COLUMN ownership_type TYPE TEXT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
      AND column_name = 'status' AND data_type != 'text'
  ) THEN
    ALTER TABLE flt_vehicles ALTER COLUMN status TYPE TEXT;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flt_vehicles_created_by_fkey'
      AND conrelid = 'flt_vehicles'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
        AND column_name = 'created_by'
    ) THEN
      ALTER TABLE flt_vehicles ADD CONSTRAINT flt_vehicles_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flt_vehicles_updated_by_fkey'
      AND conrelid = 'flt_vehicles'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
        AND column_name = 'updated_by'
    ) THEN
      ALTER TABLE flt_vehicles ADD CONSTRAINT flt_vehicles_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flt_vehicles_deleted_by_fkey'
      AND conrelid = 'flt_vehicles'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'flt_vehicles'
        AND column_name = 'deleted_by'
    ) THEN
      ALTER TABLE flt_vehicles ADD CONSTRAINT flt_vehicles_deleted_by_fkey
        FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS flt_vehicles_tenant_id_idx ON flt_vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS flt_vehicles_make_id_idx ON flt_vehicles(make_id);
CREATE INDEX IF NOT EXISTS flt_vehicles_model_id_idx ON flt_vehicles(model_id);
CREATE INDEX IF NOT EXISTS flt_vehicles_license_plate_idx ON flt_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS flt_vehicles_vin_idx ON flt_vehicles(vin);
CREATE INDEX IF NOT EXISTS flt_vehicles_next_inspection_idx ON flt_vehicles(next_inspection);
CREATE INDEX IF NOT EXISTS flt_vehicles_deleted_at_idx ON flt_vehicles(deleted_at);
CREATE INDEX IF NOT EXISTS flt_vehicles_created_by_idx ON flt_vehicles(created_by);
CREATE INDEX IF NOT EXISTS flt_vehicles_updated_by_idx ON flt_vehicles(updated_by);
CREATE INDEX IF NOT EXISTS flt_vehicles_metadata_idx ON flt_vehicles USING GIN (metadata);
CREATE INDEX IF NOT EXISTS flt_vehicles_status_active_idx ON flt_vehicles(status) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS flt_vehicles_tenant_plate_uq
  ON flt_vehicles(tenant_id, license_plate) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS flt_vehicles_tenant_vin_uq
  ON flt_vehicles(tenant_id, vin) WHERE deleted_at IS NULL AND vin IS NOT NULL;

ALTER TABLE flt_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_flt_vehicles ON flt_vehicles;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicles ON flt_vehicles;

CREATE POLICY tenant_isolation_flt_vehicles ON flt_vehicles
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_flt_vehicles ON flt_vehicles
  FOR ALL TO authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_updated_at') THEN
    CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_flt_vehicles'
      AND tgrelid = 'flt_vehicles'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_flt_vehicles BEFORE UPDATE ON flt_vehicles
      FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
  END IF;
END
$$;

DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'flt_vehicles';
  RAISE NOTICE '✓ flt_vehicles migration completed successfully';
  RAISE NOTICE '  Total columns: %', v_count;
END
$$;
