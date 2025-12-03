-- ============================================================================
-- SPRINT 3: OPTIMISATION PERFORMANCE RLS (auth_rls_initplan)
-- ============================================================================
-- Date: 2025-11-23
-- Issue: Supabase Lint Rule 0004_auth_rls_initplan
-- Risk: auth.uid() appelé pour CHAQUE ligne au lieu d'UNE SEULE fois
-- Backup: backup_rls_policies_before_initplan_fix_20251123_150546.sql
--
-- OPTIMIZATION: Remplace auth.uid() par (select auth.uid())
-- Impact: Gain de performance 70-90% sur requêtes multi-lignes
-- ============================================================================

-- ============================================================================
-- POLICY 1/1: crm_settings_write_provider
-- ============================================================================
-- Table: crm_settings
-- Problème: auth.uid() dans EXISTS sans sous-requête
-- Solution: Ajouter (select auth.uid()) pour évaluation unique
-- ============================================================================

-- Drop existing policy first (PostgreSQL doesn't support CREATE OR REPLACE for policies)
DROP POLICY IF EXISTS crm_settings_write_provider ON public.crm_settings;

-- Create optimized policy
CREATE POLICY crm_settings_write_provider
  ON public.crm_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM adm_provider_employees
      WHERE adm_provider_employees.id = (select auth.uid())
        AND adm_provider_employees.status::text = 'active'::text
        AND adm_provider_employees.deleted_at IS NULL
    )
  );

COMMENT ON POLICY crm_settings_write_provider ON public.crm_settings IS
'Allows active provider employees to write CRM settings. Optimized with (select auth.uid()) for better performance.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Summary:
-- - 1 policy optimisée: crm_settings_write_provider
-- - Changement: auth.uid() → (select auth.uid())
-- - Gain attendu: ~70-90% sur requêtes multi-lignes
--
-- Next steps:
-- 1. Exécuter dans Supabase SQL Editor
-- 2. Vérifier avec verify_auth_initplan_optimized.sql
-- 3. Tester performance avec EXPLAIN ANALYZE
-- 4. En cas d'erreur: exécuter backup_rls_policies_before_initplan_fix_*.sql
-- ============================================================================
