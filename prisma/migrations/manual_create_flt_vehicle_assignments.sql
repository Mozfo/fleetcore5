-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table flt_vehicle_assignments
CREATE TABLE IF NOT EXISTS flt_vehicle_assignments (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date,
  assignment_type varchar(50) NOT NULL DEFAULT 'permanent',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(50) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason text
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flt_vehicle_assignments_tenant_id_fkey'
  ) THEN
    ALTER TABLE flt_vehicle_assignments
      ADD CONSTRAINT flt_vehicle_assignments_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flt_vehicle_assignments_driver_id_fkey'
  ) THEN
    ALTER TABLE flt_vehicle_assignments
      ADD CONSTRAINT flt_vehicle_assignments_driver_id_fkey
      FOREIGN KEY (driver_id) REFERENCES rid_drivers(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flt_vehicle_assignments_vehicle_id_fkey'
  ) THEN
    ALTER TABLE flt_vehicle_assignments
      ADD CONSTRAINT flt_vehicle_assignments_vehicle_id_fkey
      FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flt_vehicle_assignments_created_by_fkey'
  ) THEN
    ALTER TABLE flt_vehicle_assignments
      ADD CONSTRAINT flt_vehicle_assignments_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES adm_members(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flt_vehicle_assignments_updated_by_fkey'
  ) THEN
    ALTER TABLE flt_vehicle_assignments
      ADD CONSTRAINT flt_vehicle_assignments_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES adm_members(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'flt_vehicle_assignments_deleted_by_fkey'
  ) THEN
    ALTER TABLE flt_vehicle_assignments
      ADD CONSTRAINT flt_vehicle_assignments_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS flt_vehicle_assignments_tenant_driver_vehicle_start_uq
  ON flt_vehicle_assignments(tenant_id, driver_id, vehicle_id, start_date)
  WHERE deleted_at IS NULL;

-- Create btree indexes
CREATE INDEX IF NOT EXISTS flt_vehicle_assignments_tenant_id_idx ON flt_vehicle_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS flt_vehicle_assignments_driver_id_idx ON flt_vehicle_assignments(driver_id);
CREATE INDEX IF NOT EXISTS flt_vehicle_assignments_vehicle_id_idx ON flt_vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS flt_vehicle_assignments_start_date_idx ON flt_vehicle_assignments(start_date);
CREATE INDEX IF NOT EXISTS flt_vehicle_assignments_end_date_idx ON flt_vehicle_assignments(end_date);
CREATE INDEX IF NOT EXISTS flt_vehicle_assignments_deleted_at_idx ON flt_vehicle_assignments(deleted_at);
CREATE INDEX IF NOT EXISTS flt_vehicle_assignments_created_by_idx ON flt_vehicle_assignments(created_by);
CREATE INDEX IF NOT EXISTS flt_vehicle_assignments_updated_by_idx ON flt_vehicle_assignments(updated_by);
CREATE INDEX IF NOT EXISTS flt_vehicle_assignments_status_active_idx ON flt_vehicle_assignments(status) WHERE deleted_at IS NULL;

-- Create GIN index on metadata
CREATE INDEX IF NOT EXISTS flt_vehicle_assignments_metadata_idx ON flt_vehicle_assignments USING gin(metadata);

-- Create trigger
DROP TRIGGER IF EXISTS set_updated_at_flt_vehicle_assignments ON flt_vehicle_assignments;

CREATE TRIGGER set_updated_at_flt_vehicle_assignments
  BEFORE UPDATE ON flt_vehicle_assignments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Enable RLS
ALTER TABLE flt_vehicle_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_flt_vehicle_assignments ON flt_vehicle_assignments;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicle_assignments ON flt_vehicle_assignments;

CREATE POLICY tenant_isolation_flt_vehicle_assignments ON flt_vehicle_assignments
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_flt_vehicle_assignments ON flt_vehicle_assignments
  FOR ALL TO authenticated
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ flt_vehicle_assignments table created successfully';
  RAISE NOTICE '  - Primary key: id (UUID)';
  RAISE NOTICE '  - Foreign keys: 6 (tenant, driver, vehicle, audit fields)';
  RAISE NOTICE '  - Partial unique index: (tenant_id, driver_id, vehicle_id, start_date) WHERE deleted_at IS NULL';
  RAISE NOTICE '  - Indexes: 10 (btree + GIN on metadata + partial on status)';
  RAISE NOTICE '  - RLS policies: 2 (tenant_isolation + temp_allow_all)';
  RAISE NOTICE '  - Trigger: set_updated_at_flt_vehicle_assignments';
END $$;
