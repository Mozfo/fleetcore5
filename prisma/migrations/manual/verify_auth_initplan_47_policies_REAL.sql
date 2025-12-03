-- ============================================================================
-- VÉRIFICATION: Optimisation auth_rls_initplan complétée (47 POLICIES)
-- ============================================================================
-- Purpose: Vérifier que current_setting() utilise maintenant (SELECT ...)
-- Expected: 0 policies non optimisées, 47 policies optimisées
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
  AND qual LIKE '%current_setting%'
  AND qual NOT LIKE '%SELECT current_setting%';

-- Résultat attendu: 0 lignes
-- Si des lignes apparaissent → certaines policies ne sont pas optimisées

-- Test 2: Compter les policies OPTIMISÉES avec (SELECT current_setting)
-- ----------------------------------------------------------------------------
SELECT
  COUNT(*) AS total_optimized_policies,
  CASE
    WHEN COUNT(*) >= 47 THEN '✅ Test 2: 47 policies optimisées'
    ELSE '❌ Test 2: Seulement ' || COUNT(*) || '/47 policies optimisées!'
  END AS validation
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'tenant_isolation_%'
  AND qual LIKE '%SELECT current_setting%';

-- Résultat attendu: 47

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
  AND qual LIKE '%SELECT current_setting%'
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
-- Ride-hailing: 10
-- Schedule: 4
-- Support: 3
-- Transport: 4
-- TOTAL: 47

-- Test 4: Vérifier spécifiquement les patterns spéciaux
-- ----------------------------------------------------------------------------
-- 4a) dir_car_makes/models (shared catalog)
SELECT
  tablename,
  policyname,
  CASE
    WHEN qual LIKE '%tenant_id IS NULL%'
         AND qual LIKE '%SELECT current_setting%' THEN '✅ OPTIMISÉ (shared catalog)'
    ELSE '❌ NON OPTIMISÉ ou PATTERN INCORRECT'
  END AS status
FROM pg_policies
WHERE tablename IN ('dir_car_makes', 'dir_car_models')
  AND policyname LIKE 'tenant_isolation_%';

-- Résultat attendu: 2 policies avec '✅ OPTIMISÉ (shared catalog)'

-- 4b) rid_driver_languages (COALESCE pattern)
SELECT
  tablename,
  policyname,
  CASE
    WHEN qual LIKE '%COALESCE%'
         AND qual LIKE '%SELECT current_setting%'
         AND qual LIKE '%deleted_at IS NULL%' THEN '✅ OPTIMISÉ (COALESCE + deleted_at)'
    ELSE '❌ NON OPTIMISÉ ou PATTERN INCORRECT'
  END AS status
FROM pg_policies
WHERE tablename = 'rid_driver_languages'
  AND policyname LIKE 'tenant_isolation_%';

-- Résultat attendu: 3 policies avec '✅ OPTIMISÉ (COALESCE + deleted_at)'

-- 4c) sup_ticket_messages (EXISTS pattern)
SELECT
  tablename,
  policyname,
  CASE
    WHEN qual LIKE '%EXISTS%'
         AND qual LIKE '%SELECT current_setting%'
         AND qual LIKE '%sup_tickets%' THEN '✅ OPTIMISÉ (EXISTS subquery)'
    ELSE '❌ NON OPTIMISÉ ou PATTERN INCORRECT'
  END AS status
FROM pg_policies
WHERE tablename = 'sup_ticket_messages'
  AND policyname = 'tenant_isolation_sup_ticket_messages';

-- Résultat attendu: 1 policy avec '✅ OPTIMISÉ (EXISTS subquery)'

-- ============================================================================
-- RÉSUMÉ ATTENDU:
-- Test 1: 0 lignes (aucune policy non optimisée)
-- Test 2: 47 policies optimisées
-- Test 3: Breakdown par module (total = 47)
-- Test 4a: 2 policies dir_car_makes/models OK
-- Test 4b: 3 policies rid_driver_languages OK
-- Test 4c: 1 policy sup_ticket_messages OK
--
-- Si tous les tests passent → Optimisation complète! ✅
-- ============================================================================
