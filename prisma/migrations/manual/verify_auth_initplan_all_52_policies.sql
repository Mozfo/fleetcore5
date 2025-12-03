-- ============================================================================
-- VÉRIFICATION: Optimisation auth_rls_initplan complétée (52 POLICIES)
-- ============================================================================
-- Purpose: Vérifier que current_setting() utilise maintenant (SELECT ...)
-- Expected: 0 policies non optimisées, 52 policies optimisées
-- ============================================================================

-- Test 1: Vérifier qu'il ne reste AUCUNE policy tenant_isolation non optimisée
-- ----------------------------------------------------------------------------
SELECT
  '❌ Test 1: Policies NON optimisées trouvées!' AS status,
  tablename,
  policyname,
  qual AS expression
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'tenant_isolation_%'
  AND qual ILIKE '%current_setting%'
  AND qual NOT ILIKE '%SELECT current_setting%';

-- Résultat attendu: 0 lignes
-- Si des lignes apparaissent → certaines policies ne sont pas optimisées

-- Test 2: Compter les policies OPTIMISÉES avec (SELECT current_setting)
-- ----------------------------------------------------------------------------
SELECT
  COUNT(*) AS total_optimized_policies,
  CASE
    WHEN COUNT(*) >= 52 THEN '✅ Test 2: 52 policies optimisées'
    ELSE '❌ Test 2: Seulement ' || COUNT(*) || '/52 policies optimisées!'
  END AS validation
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'tenant_isolation_%'
  AND qual ILIKE '%SELECT current_setting%';

-- Résultat attendu: 52

-- Test 3: Lister les policies optimisées par module
-- ----------------------------------------------------------------------------
SELECT
  CASE
    WHEN tablename LIKE 'adm_%' THEN 'Administration'
    WHEN tablename LIKE 'flt_%' THEN 'Fleet'
    WHEN tablename LIKE 'rid_%' THEN 'Ride-hailing'
    WHEN tablename LIKE 'trp_%' THEN 'Transport'
    WHEN tablename LIKE 'fin_%' THEN 'Finance'
    WHEN tablename LIKE 'rev_%' THEN 'Revenue'
    WHEN tablename LIKE 'bil_%' THEN 'Billing'
    WHEN tablename LIKE 'sch_%' THEN 'Schedule'
    WHEN tablename LIKE 'sup_%' THEN 'Support'
    WHEN tablename LIKE 'doc_%' THEN 'Documents'
    WHEN tablename LIKE 'dir_%' THEN 'Directory'
    ELSE 'Other'
  END AS module,
  COUNT(*) AS policies_optimized
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'tenant_isolation_%'
  AND qual ILIKE '%SELECT current_setting%'
GROUP BY module
ORDER BY module;

-- Résultat attendu:
-- Administration: 4
-- Billing: 4
-- Documents: 1
-- Directory: 2
-- Finance: 6
-- Fleet: 6
-- Revenue: 3
-- Ride-hailing: 11
-- Schedule: 4
-- Support: 3
-- Transport: 4

-- Test 4: Vérifier spécifiquement les policies dir_car_makes/models (shared catalog)
-- ----------------------------------------------------------------------------
SELECT
  tablename,
  policyname,
  CASE
    WHEN qual ILIKE '%tenant_id IS NULL%'
         AND qual ILIKE '%SELECT current_setting%' THEN '✅ OPTIMISÉ (shared catalog)'
    WHEN qual ILIKE '%SELECT current_setting%' THEN '✅ OPTIMISÉ (standard)'
    ELSE '❌ NON OPTIMISÉ'
  END AS status,
  qual AS expression
FROM pg_policies
WHERE tablename IN ('dir_car_makes', 'dir_car_models')
  AND policyname LIKE 'tenant_isolation_%';

-- Résultat attendu: 2 policies avec status '✅ OPTIMISÉ (shared catalog)'

-- ============================================================================
-- RÉSUMÉ ATTENDU:
-- Test 1: 0 lignes (aucune policy non optimisée)
-- Test 2: 52 policies optimisées
-- Test 3: Breakdown par module (total = 52)
-- Test 4: 2 policies dir_car_makes/models avec pattern shared catalog
--
-- Si tous les tests passent → Optimisation complète! ✅
-- ============================================================================
