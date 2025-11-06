-- Migration: Align doc_documents with Fleetcore specification
-- Idempotent SQL migration for polymorphic documents table

-- ============================================================================
-- STEP 1: Drop triggers (will be recreated at the end)
-- ============================================================================
DROP TRIGGER IF EXISTS update_doc_documents_updated_at ON doc_documents;
DROP TRIGGER IF EXISTS set_updated_at_doc_documents ON doc_documents;

-- ============================================================================
-- STEP 2: Drop foreign key constraints for audit fields and verified_by
-- ============================================================================
ALTER TABLE doc_documents DROP CONSTRAINT IF EXISTS doc_documents_created_by_fkey;
ALTER TABLE doc_documents DROP CONSTRAINT IF EXISTS doc_documents_updated_by_fkey;
ALTER TABLE doc_documents DROP CONSTRAINT IF EXISTS doc_documents_deleted_by_fkey;
ALTER TABLE doc_documents DROP CONSTRAINT IF EXISTS doc_documents_verified_by_fkey;

-- ============================================================================
-- STEP 3: Drop indexes related to columns being removed
-- ============================================================================
DROP INDEX IF EXISTS doc_documents_deleted_at_idx;
DROP INDEX IF EXISTS doc_documents_created_by_idx;
DROP INDEX IF EXISTS doc_documents_updated_by_idx;
DROP INDEX IF EXISTS doc_documents_metadata_idx;
DROP INDEX IF EXISTS doc_documents_tenant_id_entity_type_entity_id_idx;
DROP INDEX IF EXISTS doc_documents_tenant_id_document_type_idx;

-- ============================================================================
-- STEP 4: Drop old CHECK constraints if they exist
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'doc_documents_entity_type_check'
      AND conrelid = 'doc_documents'::regclass
  ) THEN
    ALTER TABLE doc_documents DROP CONSTRAINT doc_documents_entity_type_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'doc_documents_document_type_check'
      AND conrelid = 'doc_documents'::regclass
  ) THEN
    ALTER TABLE doc_documents DROP CONSTRAINT doc_documents_document_type_check;
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
      AND table_name = 'doc_documents'
      AND column_name = 'entity_type'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE doc_documents ALTER COLUMN entity_type TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'document_type'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE doc_documents ALTER COLUMN document_type TYPE TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'file_url'
      AND data_type != 'text'
  ) THEN
    ALTER TABLE doc_documents ALTER COLUMN file_url TYPE TEXT;
  END IF;
END
$$;

-- ============================================================================
-- STEP 6: Add verified column if it doesn't exist
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'verified'
  ) THEN
    ALTER TABLE doc_documents ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END
$$;

-- ============================================================================
-- STEP 7: Drop columns not in specification
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'file_name'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN file_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'file_size'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN file_size;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN mime_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN verified_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN verified_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'notes'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN notes;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'metadata'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN metadata;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN created_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN updated_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN deleted_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN deleted_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'doc_documents'
      AND column_name = 'deletion_reason'
  ) THEN
    ALTER TABLE doc_documents DROP COLUMN deletion_reason;
  END IF;
END
$$;

-- ============================================================================
-- STEP 8: Add CHECK constraints for entity_type and document_type
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'doc_documents_entity_type_check'
      AND conrelid = 'doc_documents'::regclass
  ) THEN
    ALTER TABLE doc_documents
      ADD CONSTRAINT doc_documents_entity_type_check
      CHECK (entity_type IN ('flt_vehicle', 'rid_driver', 'adm_member', 'contract'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'doc_documents_document_type_check'
      AND conrelid = 'doc_documents'::regclass
  ) THEN
    ALTER TABLE doc_documents
      ADD CONSTRAINT doc_documents_document_type_check
      CHECK (document_type IN ('registration', 'insurance', 'visa', 'residence_visa', 'emirates_id', 'platform_approval', 'other'));
  END IF;
END
$$;

-- ============================================================================
-- STEP 9: Create required indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS doc_documents_tenant_entity_idx
  ON doc_documents(tenant_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS doc_documents_tenant_id_idx
  ON doc_documents(tenant_id);

CREATE INDEX IF NOT EXISTS doc_documents_tenant_document_type_idx
  ON doc_documents(tenant_id, document_type);

CREATE INDEX IF NOT EXISTS doc_documents_expiry_date_idx
  ON doc_documents(expiry_date);

CREATE INDEX IF NOT EXISTS doc_documents_entity_type_idx
  ON doc_documents(entity_type);

CREATE INDEX IF NOT EXISTS doc_documents_entity_id_idx
  ON doc_documents(entity_id);

CREATE INDEX IF NOT EXISTS doc_documents_document_type_idx
  ON doc_documents(document_type);

CREATE INDEX IF NOT EXISTS doc_documents_created_at_idx
  ON doc_documents(created_at);

CREATE INDEX IF NOT EXISTS doc_documents_updated_at_idx
  ON doc_documents(updated_at);

-- ============================================================================
-- STEP 10: Enable Row Level Security
-- ============================================================================
ALTER TABLE doc_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 11: Create RLS policies
-- ============================================================================
DROP POLICY IF EXISTS tenant_isolation_doc_documents ON doc_documents;
DROP POLICY IF EXISTS temp_allow_all_doc_documents ON doc_documents;

CREATE POLICY tenant_isolation_doc_documents
  ON doc_documents
  FOR ALL
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY temp_allow_all_doc_documents
  ON doc_documents
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- STEP 12: Recreate updated_at trigger
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
    WHERE tgname = 'set_updated_at_doc_documents'
      AND tgrelid = 'doc_documents'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_doc_documents
      BEFORE UPDATE ON doc_documents
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
    AND table_name = 'doc_documents';

  RAISE NOTICE '✓ doc_documents migration completed successfully';
  RAISE NOTICE '  Total columns: %', v_count;
  RAISE NOTICE '  Expected: 11 (id, tenant_id, entity_type, entity_id, document_type, file_url, issue_date, expiry_date, verified, created_at, updated_at)';
END
$$;
