-- ============================================================================
-- MIGRATION: FIX SECURITY - Add search_path to 7 PostgreSQL functions
-- ============================================================================
-- Date: 2025-11-23
-- Issue: Supabase lint rule 0011_function_search_path_mutable
-- Risk: Schema injection attacks on functions without search_path
-- Backup: prisma/migrations/_backups/backup_supabase_complete_20251123_022902.dump
--
-- CRITICAL: This migration modifies 7 functions to add secure search_path
-- - 3 SECURITY DEFINER functions (RPC) → search_path = pg_catalog, public
-- - 4 SECURITY INVOKER functions (triggers) → search_path = public
--
-- ROLLBACK: Restore from backup if any error occurs
-- ============================================================================

-- ============================================================================
-- FONCTION 1/7: set_tenant (SECURITY DEFINER - CRITIQUE)
-- ============================================================================
-- Context: Multi-tenant RLS context setter
-- Used by: rid_driver_profile_get, rid_driver_language_add
-- Risk: HIGH - SECURITY DEFINER without search_path = privilege escalation
-- Fix: Add search_path = pg_catalog, public
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_tenant(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Use fully qualified function name to prevent hijacking
  PERFORM pg_catalog.set_config('app.current_tenant_id', p_tenant_id::pg_catalog.text, false);
END;
$$;

-- Grant permissions (double grant strategy: PUBLIC + authenticated)
GRANT EXECUTE ON FUNCTION public.set_tenant(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_tenant(uuid) TO authenticated;

COMMENT ON FUNCTION public.set_tenant(uuid) IS
'Sets the tenant context for the current session. SECURITY DEFINER with hardened search_path to prevent schema injection attacks.';

-- ============================================================================
-- FONCTION 2/7: rid_driver_profile_get (SECURITY DEFINER - CRITIQUE)
-- ============================================================================
-- Context: RPC function to retrieve driver profile with languages
-- Used by: Application API (driver profile endpoint)
-- Risk: HIGH - SECURITY DEFINER + data access
-- Fix: Add search_path = pg_catalog, public
-- ============================================================================

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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Set tenant context (using fully qualified call)
  PERFORM pg_catalog.set_config('app.current_tenant_id', p_tenant_id::pg_catalog.text, true);

  -- Return driver profile (explicit schema qualification)
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
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.rid_driver_profile_get(uuid, uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.rid_driver_profile_get(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.rid_driver_profile_get(uuid, uuid) IS
'Retrieves a driver profile with language details. SECURITY DEFINER with hardened search_path.';

-- ============================================================================
-- FONCTION 3/7: rid_driver_language_add (SECURITY DEFINER - CRITIQUE)
-- ============================================================================
-- Context: RPC function to add a language to driver profile
-- Used by: Application API (driver language management)
-- Risk: HIGH - SECURITY DEFINER + INSERT operation
-- Fix: Add search_path = pg_catalog, public
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rid_driver_language_add(
  p_tenant_id uuid,
  p_driver_id uuid,
  p_language_code char(2),
  p_proficiency text,
  p_created_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_language_id uuid;
BEGIN
  -- Set tenant context
  PERFORM pg_catalog.set_config('app.current_tenant_id', p_tenant_id::pg_catalog.text, true);

  -- Insert language (explicit schema)
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
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.rid_driver_language_add(uuid, uuid, char, text, uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.rid_driver_language_add(uuid, uuid, char, text, uuid) TO authenticated;

COMMENT ON FUNCTION public.rid_driver_language_add(uuid, uuid, char, text, uuid) IS
'Adds a language to a driver profile. SECURITY DEFINER with hardened search_path.';

-- ============================================================================
-- FONCTION 4/7: update_updated_at_column (SECURITY INVOKER - trigger)
-- ============================================================================
-- Context: Trigger function to update updated_at timestamp
-- Used by: Triggers on rid_drivers, trp_trips, flt_vehicles, sup_customer_feedback
-- Risk: MEDIUM - SECURITY INVOKER (runs with caller privileges)
-- Fix: Add search_path = public
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS
'Trigger function to automatically update the updated_at column. Used by multiple tables for timestamp tracking.';

-- ============================================================================
-- FONCTION 5/7: trigger_set_updated_at (SECURITY INVOKER - trigger)
-- ============================================================================
-- Context: Trigger function to update updated_at timestamp
-- Used by: 18+ triggers across all modules (fin, trp, adm, crm, etc.)
-- Risk: MEDIUM - Widely used, no search_path
-- Fix: Add search_path = public
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_set_updated_at() IS
'Trigger function to update updated_at timestamp. Used by 18+ tables across all modules.';

-- ============================================================================
-- FONCTION 6/7: set_updated_at (SECURITY INVOKER - trigger)
-- ============================================================================
-- Context: Trigger function to update updated_at timestamp (duplicate)
-- Used by: Triggers on crm_leads, trp_trips
-- Risk: MEDIUM - Functional duplicate of trigger_set_updated_at
-- Fix: Add search_path = public
-- Note: Kept separate to avoid regression on existing triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
'Trigger function to update updated_at timestamp. Functional duplicate of trigger_set_updated_at.';

-- ============================================================================
-- FONCTION 7/7: sync_driver_status_from_employment (SECURITY INVOKER - trigger)
-- ============================================================================
-- Context: Business logic trigger to sync driver_status from employment_status
-- Used by: Trigger on rid_drivers (UAE labor law compliance)
-- Risk: MEDIUM - Critical business logic without search_path
-- Fix: Add search_path = public
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_driver_status_from_employment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

COMMENT ON FUNCTION public.sync_driver_status_from_employment() IS
'Syncs driver operational status from employment status. Critical for UAE labor law compliance.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Summary:
-- - 7 functions updated with SET search_path
-- - 3 SECURITY DEFINER functions: pg_catalog, public
-- - 4 SECURITY INVOKER functions: public
-- - All functions granted to PUBLIC + authenticated
-- - All functions have documentation comments
--
-- Next steps:
-- 1. Verify proconfig for all 7 functions
-- 2. Test each function functionally
-- 3. Verify GRANTS
-- 4. Monitor logs for any errors
-- ============================================================================
