-- ============================================================================
-- VÉRIFICATION: Optimisation auth_rls_initplan complétée
-- ============================================================================
-- Purpose: Vérifier que auth.uid() utilise maintenant (select ...)
-- Expected: 0 policies avec auth.uid() direct, 1+ avec (select auth.uid())
-- ============================================================================

-- Test 1: Vérifier qu'il ne reste AUCUNE policy avec auth. direct (hors SELECT)
-- ----------------------------------------------------------------------------
-- Note: PostgreSQL formate avec majuscules/espaces, on cherche donc SELECT (case-insensitive)
SELECT
  '❌ Test 1: Policies NON optimisées trouvées!' AS status,
  tablename,
  policyname,
  qual AS expression
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual ILIKE '%auth.uid()%' AND qual NOT ILIKE '%SELECT auth.uid()%')
    OR (qual ILIKE '%auth.jwt()%' AND qual NOT ILIKE '%SELECT auth.jwt()%')
  );

-- Résultat attendu: 0 lignes
-- Si des lignes apparaissent → certaines policies ne sont pas optimisées

-- Test 2: Compter les policies OPTIMISÉES avec (select auth.*)
-- ----------------------------------------------------------------------------
SELECT
  COUNT(*) AS total_optimized_policies,
  CASE
    WHEN COUNT(*) >= 1 THEN '✅ Test 2: Au moins 1 policy optimisée'
    ELSE '❌ Test 2: Aucune policy optimisée trouvée!'
  END AS validation
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual ILIKE '%SELECT auth.uid()%' OR qual ILIKE '%SELECT auth.jwt()%');

-- Résultat attendu: >= 1

-- Test 3: Vérifier spécifiquement la policy crm_settings_write_provider
-- ----------------------------------------------------------------------------
SELECT
  policyname,
  CASE
    WHEN qual ILIKE '%SELECT auth.uid()%' THEN '✅ OPTIMISÉ'
    WHEN qual ILIKE '%auth.uid()%' THEN '❌ NON OPTIMISÉ'
    ELSE '⚠️ AUTRE'
  END AS status,
  qual AS expression
FROM pg_policies
WHERE policyname = 'crm_settings_write_provider';

-- Résultat attendu: status = '✅ OPTIMISÉ'

-- ============================================================================
-- RÉSUMÉ ATTENDU:
-- Test 1: 0 lignes (aucune policy non optimisée)
-- Test 2: >= 1 policies optimisées
-- Test 3: crm_settings_write_provider = ✅ OPTIMISÉ
--
-- Si tous les tests passent → Optimisation complète! ✅
-- ============================================================================
