-- ============================================================================
-- Migration: UAE Enrichment for rid_drivers
-- Description: Add RH/HR fields for UAE compliance + driver languages
-- Date: 2025-10-12
-- Atomicity: Full transaction with BEGIN/COMMIT
-- Rollback: See end of file for complete rollback script
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 0: Modifier contrainte driver_status pour accepter 'inactive'
-- ============================================================================

-- Supprimer ancienne contrainte
ALTER TABLE public.rid_drivers
  DROP CONSTRAINT IF EXISTS rid_drivers_driver_status_check;

-- Ajouter nouvelle contrainte avec 'inactive'
ALTER TABLE public.rid_drivers
  ADD CONSTRAINT rid_drivers_driver_status_check
  CHECK (driver_status::text = ANY (ARRAY[
    'active'::text,
    'inactive'::text,
    'suspended'::text,
    'terminated'::text
  ]));

-- ============================================================================
-- SECTION 1: ALTER TABLE rid_drivers - Add columns (NULLABLE first)
-- ============================================================================
-- ⚠️ CRITICAL: Columns added as NULL first to avoid incorrect DEFAULT values
-- during backfill. Constraints applied AFTER backfill in Section 3.

ALTER TABLE public.rid_drivers
  ADD COLUMN IF NOT EXISTS date_of_birth date NULL,
  ADD COLUMN IF NOT EXISTS gender text NULL,
  ADD COLUMN IF NOT EXISTS nationality char(2) NULL,
  ADD COLUMN IF NOT EXISTS hire_date date NULL,
  ADD COLUMN IF NOT EXISTS employment_status text NULL, -- ⚠️ NULL first, constraints later
  ADD COLUMN IF NOT EXISTS cooperation_type text NULL,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text NULL,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text NULL;

-- ============================================================================
-- SECTION 2: Backfill - Populate employment_status from driver_status
-- ============================================================================
-- ⚠️ CRITICAL: Must run BEFORE adding constraints to avoid incorrect 'active' defaults

-- Backfill employment_status based on driver_status mapping
UPDATE public.rid_drivers
SET employment_status = CASE driver_status
  WHEN 'active' THEN 'active'
  WHEN 'suspended' THEN 'suspended'
  WHEN 'terminated' THEN 'terminated'
  WHEN 'inactive' THEN 'active'  -- Map inactive to active (initial status before activation)
  ELSE 'active'  -- Fallback for unknown statuses
END,
updated_at = now()
WHERE employment_status IS NULL;

-- Optional: Backfill cooperation_type from rid_driver_cooperation_terms if available
-- This query finds the most recent active cooperation term for each driver
UPDATE public.rid_drivers d
SET cooperation_type = COALESCE(v.cooperation_type, 'contractor'),
    updated_at = now()
FROM (
  SELECT
    t.tenant_id,
    t.driver_id,
    COALESCE(
      (t.metadata->>'cooperation_type')::text,
      'contractor'
    ) AS cooperation_type,
    ROW_NUMBER() OVER (
      PARTITION BY t.tenant_id, t.driver_id
      ORDER BY t.effective_date DESC NULLS LAST
    ) as rn
  FROM public.rid_driver_cooperation_terms t
  WHERE t.deleted_at IS NULL
    AND (t.expiry_date IS NULL OR t.expiry_date >= CURRENT_DATE)
    AND (t.effective_date IS NULL OR t.effective_date <= CURRENT_DATE)
) v
WHERE v.driver_id = d.id
  AND v.tenant_id = d.tenant_id
  AND v.rn = 1
  AND d.deleted_at IS NULL
  AND d.cooperation_type IS NULL;

-- ============================================================================
-- SECTION 3: Add Constraints - Apply DEFAULT, NOT NULL, and CHECK constraints
-- ============================================================================
-- ⚠️ Applied AFTER backfill to ensure data integrity

-- date_of_birth: Must be in the past
ALTER TABLE public.rid_drivers
  ADD CONSTRAINT rid_drivers_dob_check
  CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE);

-- gender: Enum validation
ALTER TABLE public.rid_drivers
  ADD CONSTRAINT rid_drivers_gender_check
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'unspecified'));

-- nationality: ISO-2 code validation (2 letters)
ALTER TABLE public.rid_drivers
  ADD CONSTRAINT rid_drivers_nationality_check
  CHECK (nationality IS NULL OR nationality ~ '^[A-Za-z]{2}$');

-- employment_status: Set DEFAULT, NOT NULL, and CHECK constraint
ALTER TABLE public.rid_drivers
  ALTER COLUMN employment_status SET DEFAULT 'active';

ALTER TABLE public.rid_drivers
  ALTER COLUMN employment_status SET NOT NULL;

ALTER TABLE public.rid_drivers
  ADD CONSTRAINT rid_drivers_employment_status_check
  CHECK (employment_status IN ('active', 'on_leave', 'suspended', 'terminated'));

-- cooperation_type: Enum validation
ALTER TABLE public.rid_drivers
  ADD CONSTRAINT rid_drivers_cooperation_type_check
  CHECK (cooperation_type IS NULL OR cooperation_type IN ('employee', 'contractor', 'owner_operator', 'partner_driver'));

-- ============================================================================
-- SECTION 4: Indexes - Performance optimization for new fields
-- ============================================================================

CREATE INDEX IF NOT EXISTS rid_drivers_dob_idx
  ON public.rid_drivers (date_of_birth)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rid_drivers_nationality_idx
  ON public.rid_drivers (nationality)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rid_drivers_hire_date_idx
  ON public.rid_drivers (hire_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rid_drivers_employment_status_idx
  ON public.rid_drivers (employment_status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rid_drivers_cooperation_type_idx
  ON public.rid_drivers (cooperation_type)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- SECTION 5: CREATE TABLE rid_driver_languages
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rid_driver_languages (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  language_code char(2) NOT NULL CHECK (language_code ~ '^[A-Za-z]{2}$'),
  proficiency text NULL CHECK (proficiency IN ('basic', 'conversational', 'fluent', 'native')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason text NULL
);

-- Unique constraint: One language per driver (soft-delete aware)
CREATE UNIQUE INDEX IF NOT EXISTS rid_driver_languages_unique
  ON public.rid_driver_languages (tenant_id, driver_id, language_code)
  WHERE deleted_at IS NULL;

-- Index for language filtering
CREATE INDEX IF NOT EXISTS rid_driver_languages_lang_idx
  ON public.rid_driver_languages (language_code)
  WHERE deleted_at IS NULL;

-- Trigger for automatic updated_at (reuse existing function)
DROP TRIGGER IF EXISTS set_updated_at_rid_driver_languages ON public.rid_driver_languages;
CREATE TRIGGER set_updated_at_rid_driver_languages
  BEFORE UPDATE ON public.rid_driver_languages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- SECTION 6: Triggers - Sync employment_status to driver_status
-- ============================================================================

-- Function: Auto-sync employment_status changes to driver_status
CREATE OR REPLACE FUNCTION sync_driver_status_from_employment()
RETURNS trigger AS $$
BEGIN
  -- Terminated employment → terminated driver_status
  IF NEW.employment_status = 'terminated' THEN
    NEW.driver_status := 'terminated';

  -- Suspended employment → suspended driver_status (unless already terminated)
  ELSIF NEW.employment_status = 'suspended' AND NEW.driver_status <> 'terminated' THEN
    NEW.driver_status := 'suspended';

  -- On leave → inactive driver_status (ALWAYS blocks trips)
  ELSIF NEW.employment_status = 'on_leave' THEN
    NEW.driver_status := 'inactive';

  -- Active employment → active driver_status (unless manually set otherwise)
  ELSIF NEW.employment_status = 'active'
    AND NEW.driver_status IN ('inactive', 'suspended') THEN
    NEW.driver_status := 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Fire on INSERT or UPDATE of employment_status
DROP TRIGGER IF EXISTS trg_sync_driver_status ON public.rid_drivers;
CREATE TRIGGER trg_sync_driver_status
  BEFORE INSERT OR UPDATE OF employment_status ON public.rid_drivers
  FOR EACH ROW
  EXECUTE FUNCTION sync_driver_status_from_employment();

-- ============================================================================
-- SECTION 7: View - Consolidated driver profile
-- ============================================================================

CREATE OR REPLACE VIEW public.v_driver_profile AS
SELECT
  d.id AS driver_id,
  d.tenant_id,
  d.first_name,
  d.last_name,
  d.email,
  d.phone,
  d.date_of_birth,
  d.gender,
  d.nationality,
  d.hire_date,
  d.employment_status,
  d.driver_status,
  d.cooperation_type,
  d.emergency_contact_name,
  d.emergency_contact_phone,
  d.license_number,
  d.license_issue_date,
  d.license_expiry_date,
  d.professional_card_no,
  d.professional_expiry,
  d.rating,
  d.created_at,
  d.updated_at,
  -- Aggregate languages as array
  array_remove(
    array_agg(DISTINCT l.language_code) FILTER (WHERE l.deleted_at IS NULL),
    NULL
  ) AS languages,
  -- Aggregate language proficiencies as JSON
  json_agg(
    json_build_object(
      'code', l.language_code,
      'proficiency', l.proficiency
    )
  ) FILTER (WHERE l.deleted_at IS NULL) AS languages_detail
FROM public.rid_drivers d
LEFT JOIN public.rid_driver_languages l
  ON l.driver_id = d.id
  AND l.tenant_id = d.tenant_id
  AND l.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY
  d.id, d.tenant_id, d.first_name, d.last_name, d.email, d.phone,
  d.date_of_birth, d.gender, d.nationality, d.hire_date,
  d.employment_status, d.driver_status, d.cooperation_type,
  d.emergency_contact_name, d.emergency_contact_phone,
  d.license_number, d.license_issue_date, d.license_expiry_date,
  d.professional_card_no, d.professional_expiry, d.rating,
  d.created_at, d.updated_at;

-- ============================================================================
-- SECTION 8: RLS Policies - Tenant isolation (current_setting pattern)
-- ============================================================================

-- Enable RLS on rid_driver_languages if not already enabled
ALTER TABLE public.rid_driver_languages ENABLE ROW LEVEL SECURITY;

-- Policy for rid_driver_languages: SELECT (tenant isolation)
DROP POLICY IF EXISTS tenant_isolation_rid_driver_languages_select ON public.rid_driver_languages;
CREATE POLICY tenant_isolation_rid_driver_languages_select
  ON public.rid_driver_languages
  FOR SELECT
  USING (
    tenant_id::text = COALESCE(
      current_setting('app.current_tenant_id', true),
      ''
    )
    AND deleted_at IS NULL
  );

-- Policy for rid_driver_languages: INSERT (tenant isolation)
DROP POLICY IF EXISTS tenant_isolation_rid_driver_languages_insert ON public.rid_driver_languages;
CREATE POLICY tenant_isolation_rid_driver_languages_insert
  ON public.rid_driver_languages
  FOR INSERT
  WITH CHECK (
    tenant_id::text = COALESCE(
      current_setting('app.current_tenant_id', true),
      ''
    )
  );

-- Policy for rid_driver_languages: UPDATE (tenant isolation)
DROP POLICY IF EXISTS tenant_isolation_rid_driver_languages_update ON public.rid_driver_languages;
CREATE POLICY tenant_isolation_rid_driver_languages_update
  ON public.rid_driver_languages
  FOR UPDATE
  USING (
    tenant_id::text = COALESCE(
      current_setting('app.current_tenant_id', true),
      ''
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    tenant_id::text = COALESCE(
      current_setting('app.current_tenant_id', true),
      ''
    )
  );

-- Policy for rid_driver_languages: DELETE (soft-delete only)
DROP POLICY IF EXISTS tenant_isolation_rid_driver_languages_delete ON public.rid_driver_languages;
CREATE POLICY tenant_isolation_rid_driver_languages_delete
  ON public.rid_driver_languages
  FOR UPDATE
  USING (
    tenant_id::text = COALESCE(
      current_setting('app.current_tenant_id', true),
      ''
    )
    AND deleted_at IS NULL
  );

-- Optional: Temporary allow-all policy for development (COMMENTED OUT)
-- Uncomment only if needed for local development without tenant context
-- DROP POLICY IF EXISTS temp_allow_all_rid_driver_languages ON public.rid_driver_languages;
-- CREATE POLICY temp_allow_all_rid_driver_languages
--   ON public.rid_driver_languages
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- ============================================================================
-- SECTION 9: RPC Helpers - Wrapper functions for tenant-safe operations
-- ============================================================================

-- Helper: Set tenant context for current session
CREATE OR REPLACE FUNCTION public.set_tenant(p_tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Get driver profile with tenant context
CREATE OR REPLACE FUNCTION public.rid_driver_profile_get(
  p_driver_id uuid,
  p_tenant_id uuid
)
RETURNS TABLE (
  driver_id uuid,
  tenant_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  date_of_birth date,
  gender text,
  nationality char(2),
  hire_date date,
  employment_status text,
  driver_status text,
  cooperation_type text,
  emergency_contact_name text,
  emergency_contact_phone text,
  languages text[],
  languages_detail json
) AS $$
BEGIN
  -- Set tenant context
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);

  -- Return driver profile
  RETURN QUERY
  SELECT
    v.driver_id,
    v.tenant_id,
    v.first_name,
    v.last_name,
    v.email,
    v.phone,
    v.date_of_birth,
    v.gender,
    v.nationality,
    v.hire_date,
    v.employment_status,
    v.driver_status,
    v.cooperation_type,
    v.emergency_contact_name,
    v.emergency_contact_phone,
    v.languages,
    v.languages_detail
  FROM public.v_driver_profile v
  WHERE v.driver_id = p_driver_id
    AND v.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Add language to driver
CREATE OR REPLACE FUNCTION public.rid_driver_language_add(
  p_tenant_id uuid,
  p_driver_id uuid,
  p_language_code char(2),
  p_proficiency text,
  p_created_by uuid
)
RETURNS uuid AS $$
DECLARE
  v_language_id uuid;
BEGIN
  -- Set tenant context
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);

  -- Insert language
  INSERT INTO public.rid_driver_languages (
    tenant_id,
    driver_id,
    language_code,
    proficiency,
    created_by,
    updated_by
  ) VALUES (
    p_tenant_id,
    p_driver_id,
    p_language_code,
    p_proficiency,
    p_created_by,
    p_created_by
  )
  RETURNING id INTO v_language_id;

  RETURN v_language_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================================
-- VALIDATION QUERIES (Run after migration)
-- ============================================================================

-- Verify columns added
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'rid_drivers'
--   AND column_name IN ('date_of_birth', 'gender', 'nationality', 'hire_date',
--                       'employment_status', 'cooperation_type',
--                       'emergency_contact_name', 'emergency_contact_phone')
-- ORDER BY ordinal_position;

-- Verify indexes created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'rid_drivers'
--   AND indexname LIKE 'rid_drivers_%_idx'
-- ORDER BY indexname;

-- Verify rid_driver_languages table
-- SELECT COUNT(*) FROM public.rid_driver_languages;

-- Verify triggers
-- SELECT tgname, tgtype, tgenabled
-- FROM pg_trigger
-- WHERE tgrelid = 'public.rid_drivers'::regclass
--   AND tgname = 'trg_sync_driver_status';

-- Verify view
-- SELECT COUNT(*) FROM public.v_driver_profile;

-- Test trigger behavior
-- UPDATE public.rid_drivers
-- SET employment_status = 'suspended'
-- WHERE id = 'test-uuid-here';
-- SELECT driver_status FROM public.rid_drivers WHERE id = 'test-uuid-here';

-- ============================================================================
-- ROLLBACK SCRIPT (Execute in case of issues)
-- ============================================================================

-- BEGIN;
--
-- -- Drop RPC helpers
-- DROP FUNCTION IF EXISTS public.rid_driver_language_add(uuid, uuid, char(2), text, uuid);
-- DROP FUNCTION IF EXISTS public.rid_driver_profile_get(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.set_tenant(uuid);
--
-- -- Drop policies
-- DROP POLICY IF EXISTS tenant_isolation_rid_driver_languages_delete ON public.rid_driver_languages;
-- DROP POLICY IF EXISTS tenant_isolation_rid_driver_languages_update ON public.rid_driver_languages;
-- DROP POLICY IF EXISTS tenant_isolation_rid_driver_languages_insert ON public.rid_driver_languages;
-- DROP POLICY IF EXISTS tenant_isolation_rid_driver_languages_select ON public.rid_driver_languages;
--
-- -- Drop view
-- DROP VIEW IF EXISTS public.v_driver_profile;
--
-- -- Drop trigger and function
-- DROP TRIGGER IF EXISTS trg_sync_driver_status ON public.rid_drivers;
-- DROP FUNCTION IF EXISTS sync_driver_status_from_employment();
--
-- -- Drop trigger on rid_driver_languages
-- DROP TRIGGER IF EXISTS set_updated_at_rid_driver_languages ON public.rid_driver_languages;
--
-- -- Drop table
-- DROP TABLE IF EXISTS public.rid_driver_languages;
--
-- -- Drop indexes on rid_drivers
-- DROP INDEX IF EXISTS public.rid_drivers_cooperation_type_idx;
-- DROP INDEX IF EXISTS public.rid_drivers_employment_status_idx;
-- DROP INDEX IF EXISTS public.rid_drivers_hire_date_idx;
-- DROP INDEX IF EXISTS public.rid_drivers_nationality_idx;
-- DROP INDEX IF EXISTS public.rid_drivers_dob_idx;
--
-- -- Drop constraints on rid_drivers
-- ALTER TABLE public.rid_drivers DROP CONSTRAINT IF EXISTS rid_drivers_cooperation_type_check;
-- ALTER TABLE public.rid_drivers DROP CONSTRAINT IF EXISTS rid_drivers_employment_status_check;
-- ALTER TABLE public.rid_drivers DROP CONSTRAINT IF EXISTS rid_drivers_nationality_check;
-- ALTER TABLE public.rid_drivers DROP CONSTRAINT IF EXISTS rid_drivers_gender_check;
-- ALTER TABLE public.rid_drivers DROP CONSTRAINT IF EXISTS rid_drivers_dob_check;
--
-- -- Drop columns from rid_drivers
-- ALTER TABLE public.rid_drivers
--   DROP COLUMN IF EXISTS emergency_contact_phone,
--   DROP COLUMN IF EXISTS emergency_contact_name,
--   DROP COLUMN IF EXISTS cooperation_type,
--   DROP COLUMN IF EXISTS employment_status,
--   DROP COLUMN IF EXISTS hire_date,
--   DROP COLUMN IF EXISTS nationality,
--   DROP COLUMN IF EXISTS gender,
--   DROP COLUMN IF EXISTS date_of_birth;
--
-- COMMIT;
