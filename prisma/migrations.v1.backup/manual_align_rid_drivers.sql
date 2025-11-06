-- Correct the foreign key constraint name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'flt_drivers_tenant_id_fkey'
  ) THEN
    ALTER TABLE rid_drivers DROP CONSTRAINT flt_drivers_tenant_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rid_drivers_tenant_id_fkey'
  ) THEN
    ALTER TABLE rid_drivers
      ADD CONSTRAINT rid_drivers_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

-- Remove duplicate triggers
DROP TRIGGER IF EXISTS update_flt_drivers_updated_at ON rid_drivers;
DROP TRIGGER IF EXISTS set_updated_at_rid_drivers ON rid_drivers;

-- Recreate the single trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_rid_drivers'
  ) THEN
    CREATE TRIGGER set_updated_at_rid_drivers
      BEFORE UPDATE ON rid_drivers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
EXCEPTION
  WHEN undefined_function THEN
    NULL;
END $$;

-- Drop old unique indexes
DROP INDEX IF EXISTS rid_drivers_tenant_id_email_deleted_at_key;
DROP INDEX IF EXISTS rid_drivers_tenant_id_license_number_deleted_at_key;

-- Create partial unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS rid_drivers_tenant_email_uq
  ON rid_drivers(tenant_id, email)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS rid_drivers_tenant_license_uq
  ON rid_drivers(tenant_id, license_number)
  WHERE deleted_at IS NULL;

-- Ensure all required indexes exist
CREATE INDEX IF NOT EXISTS rid_drivers_tenant_id_idx ON rid_drivers(tenant_id);
CREATE INDEX IF NOT EXISTS rid_drivers_first_name_idx ON rid_drivers(first_name);
CREATE INDEX IF NOT EXISTS rid_drivers_last_name_idx ON rid_drivers(last_name);
CREATE INDEX IF NOT EXISTS rid_drivers_phone_idx ON rid_drivers(phone);
CREATE INDEX IF NOT EXISTS rid_drivers_email_idx ON rid_drivers(email);
CREATE INDEX IF NOT EXISTS rid_drivers_license_number_idx ON rid_drivers(license_number);
CREATE INDEX IF NOT EXISTS rid_drivers_driver_status_idx ON rid_drivers(driver_status);
CREATE INDEX IF NOT EXISTS rid_drivers_deleted_at_idx ON rid_drivers(deleted_at);
CREATE INDEX IF NOT EXISTS rid_drivers_created_at_idx ON rid_drivers(created_at DESC);

-- Create GIN index for full-text search on notes
CREATE INDEX IF NOT EXISTS rid_drivers_notes_gin_idx ON rid_drivers USING gin(to_tsvector('english', COALESCE(notes, '')));

-- Enable RLS
ALTER TABLE rid_drivers ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS tenant_isolation_rid_drivers ON rid_drivers;
DROP POLICY IF EXISTS temp_allow_all_rid_drivers ON rid_drivers;

CREATE POLICY tenant_isolation_rid_drivers ON rid_drivers
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_rid_drivers ON rid_drivers
  FOR ALL TO authenticated
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ rid_drivers migration completed successfully';
  RAISE NOTICE '  - Foreign key: rid_drivers_tenant_id_fkey';
  RAISE NOTICE '  - Partial unique indexes: 2';
  RAISE NOTICE '  - Standard indexes: 9';
  RAISE NOTICE '  - GIN index on notes: 1';
  RAISE NOTICE '  - RLS policies: 2';
  RAISE NOTICE '  - Triggers: 1 (if function exists)';
END $$;
