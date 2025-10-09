CREATE TABLE IF NOT EXISTS rid_driver_documents (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  document_id uuid NOT NULL,
  document_type text NOT NULL,
  expiry_date date,
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason text
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rid_driver_documents_tenant_id_fkey'
  ) THEN
    ALTER TABLE rid_driver_documents
      ADD CONSTRAINT rid_driver_documents_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rid_driver_documents_driver_id_fkey'
  ) THEN
    ALTER TABLE rid_driver_documents
      ADD CONSTRAINT rid_driver_documents_driver_id_fkey
      FOREIGN KEY (driver_id) REFERENCES rid_drivers(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rid_driver_documents_document_id_fkey'
  ) THEN
    ALTER TABLE rid_driver_documents
      ADD CONSTRAINT rid_driver_documents_document_id_fkey
      FOREIGN KEY (document_id) REFERENCES doc_documents(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rid_driver_documents_verified_by_fkey'
  ) THEN
    ALTER TABLE rid_driver_documents
      ADD CONSTRAINT rid_driver_documents_verified_by_fkey
      FOREIGN KEY (verified_by) REFERENCES adm_members(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rid_driver_documents_created_by_fkey'
  ) THEN
    ALTER TABLE rid_driver_documents
      ADD CONSTRAINT rid_driver_documents_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES adm_members(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rid_driver_documents_updated_by_fkey'
  ) THEN
    ALTER TABLE rid_driver_documents
      ADD CONSTRAINT rid_driver_documents_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES adm_members(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rid_driver_documents_deleted_by_fkey'
  ) THEN
    ALTER TABLE rid_driver_documents
      ADD CONSTRAINT rid_driver_documents_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES adm_members(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS rid_driver_documents_driver_type_uq
  ON rid_driver_documents(driver_id, document_type)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rid_driver_documents_tenant_id_idx ON rid_driver_documents(tenant_id);
CREATE INDEX IF NOT EXISTS rid_driver_documents_driver_id_idx ON rid_driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS rid_driver_documents_document_id_idx ON rid_driver_documents(document_id);
CREATE INDEX IF NOT EXISTS rid_driver_documents_document_type_idx ON rid_driver_documents(document_type);
CREATE INDEX IF NOT EXISTS rid_driver_documents_expiry_date_idx ON rid_driver_documents(expiry_date);
CREATE INDEX IF NOT EXISTS rid_driver_documents_deleted_at_idx ON rid_driver_documents(deleted_at);
CREATE INDEX IF NOT EXISTS rid_driver_documents_created_by_idx ON rid_driver_documents(created_by);
CREATE INDEX IF NOT EXISTS rid_driver_documents_updated_by_idx ON rid_driver_documents(updated_by);

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_rid_driver_documents_updated_at'
      AND tgrelid = 'rid_driver_documents'::regclass
  ) THEN
    CREATE TRIGGER update_rid_driver_documents_updated_at
      BEFORE UPDATE ON rid_driver_documents
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

ALTER TABLE rid_driver_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_rid_driver_documents ON rid_driver_documents;
CREATE POLICY tenant_isolation_rid_driver_documents ON rid_driver_documents
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_rid_driver_documents ON rid_driver_documents;
CREATE POLICY temp_allow_all_rid_driver_documents ON rid_driver_documents
  FOR ALL TO authenticated
  USING (true);

DO $$
BEGIN
  RAISE NOTICE '✓ rid_driver_documents table created successfully';
  RAISE NOTICE '  - Primary key: id (UUID)';
  RAISE NOTICE '  - Foreign keys: 7 (tenant, driver, document, verified_by, audit fields)';
  RAISE NOTICE '  - Partial unique index: (driver_id, document_type) WHERE deleted_at IS NULL';
  RAISE NOTICE '  - Indexes: 8 btree';
  RAISE NOTICE '  - RLS policies: 2 (tenant_isolation + temp_allow_all)';
  RAISE NOTICE '  - Trigger: update_rid_driver_documents_updated_at';
END $$;
