-- Add audit foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicles_created_by_fkey'
  ) THEN
    ALTER TABLE flt_vehicles
      ADD CONSTRAINT flt_vehicles_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES adm_members(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicles_updated_by_fkey'
  ) THEN
    ALTER TABLE flt_vehicles
      ADD CONSTRAINT flt_vehicles_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES adm_members(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_vehicles_deleted_by_fkey'
  ) THEN
    ALTER TABLE flt_vehicles
      ADD CONSTRAINT flt_vehicles_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Drop old unique indexes
DROP INDEX IF EXISTS flt_vehicles_tenant_id_license_plate_deleted_at_key;
DROP INDEX IF EXISTS flt_vehicles_tenant_id_vin_deleted_at_key;
DROP INDEX IF EXISTS flt_vehicles_status_idx;

-- Create partial unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS flt_vehicles_tenant_plate_uq
  ON flt_vehicles(tenant_id, license_plate)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS flt_vehicles_tenant_vin_uq
  ON flt_vehicles(tenant_id, vin)
  WHERE deleted_at IS NULL AND vin IS NOT NULL;

-- Ensure all required indexes exist
CREATE INDEX IF NOT EXISTS flt_vehicles_tenant_id_idx ON flt_vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS flt_vehicles_make_id_idx ON flt_vehicles(make_id);
CREATE INDEX IF NOT EXISTS flt_vehicles_model_id_idx ON flt_vehicles(model_id);
CREATE INDEX IF NOT EXISTS flt_vehicles_license_plate_idx ON flt_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS flt_vehicles_vin_idx ON flt_vehicles(vin);
CREATE INDEX IF NOT EXISTS flt_vehicles_next_inspection_idx ON flt_vehicles(next_inspection);
CREATE INDEX IF NOT EXISTS flt_vehicles_deleted_at_idx ON flt_vehicles(deleted_at);
CREATE INDEX IF NOT EXISTS flt_vehicles_created_by_idx ON flt_vehicles(created_by);
CREATE INDEX IF NOT EXISTS flt_vehicles_updated_by_idx ON flt_vehicles(updated_by);
CREATE INDEX IF NOT EXISTS flt_vehicles_metadata_idx ON flt_vehicles USING gin(metadata);
CREATE INDEX IF NOT EXISTS flt_vehicles_status_active_idx ON flt_vehicles(status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE flt_vehicles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_flt_vehicles ON flt_vehicles;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicles ON flt_vehicles;

CREATE POLICY tenant_isolation_flt_vehicles ON flt_vehicles
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_flt_vehicles ON flt_vehicles
  FOR ALL TO authenticated
  USING (true);

-- Ensure trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_flt_vehicles_updated_at'
  ) THEN
    CREATE TRIGGER update_flt_vehicles_updated_at
      BEFORE UPDATE ON flt_vehicles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ flt_vehicles migration completed successfully';
  RAISE NOTICE '  - Audit foreign keys: 3';
  RAISE NOTICE '  - Partial unique indexes: 2';
  RAISE NOTICE '  - Standard indexes: 11';
  RAISE NOTICE '  - RLS policies: 2';
  RAISE NOTICE '  - Triggers: 1';
END $$;
