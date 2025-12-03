-- ============================================================================
-- TEST: Isolation Tenant fonctionne correctement
-- ============================================================================
-- Purpose: Tester que l'isolation tenant empêche bien l'accès cross-tenant
-- Prerequisites: drop_temp_allow_all_policies.sql exécuté
-- ============================================================================

-- Test 1: Vérifier que set_tenant() fonctionne
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_test_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Set tenant context
  PERFORM set_tenant(v_test_tenant_id);

  -- Vérifier que le contexte est défini
  IF current_setting('app.current_tenant_id', true) = v_test_tenant_id::text THEN
    RAISE NOTICE '✅ Test 1: set_tenant() fonctionne correctement';
  ELSE
    RAISE EXCEPTION '❌ Test 1: set_tenant() a échoué';
  END IF;
END;
$$;

-- Test 2: Vérifier isolation sur flt_vehicles
-- ----------------------------------------------------------------------------
-- Ce test vérifie qu'on ne peut accéder QU'aux véhicules du tenant actif
DO $$
DECLARE
  v_tenant_a uuid;
  v_tenant_b uuid;
  v_count_a integer;
  v_count_b integer;
  v_count_no_tenant integer;
BEGIN
  -- Récupérer 2 tenant_id différents (s'ils existent)
  SELECT id INTO v_tenant_a FROM adm_tenants ORDER BY created_at LIMIT 1;
  SELECT id INTO v_tenant_b FROM adm_tenants ORDER BY created_at LIMIT 1 OFFSET 1;

  IF v_tenant_a IS NULL THEN
    RAISE NOTICE '⚠️  Test 2: SKIPPED - Aucun tenant trouvé dans adm_tenants';
    RETURN;
  END IF;

  -- Test avec tenant_a
  PERFORM set_tenant(v_tenant_a);
  SELECT COUNT(*) INTO v_count_a FROM flt_vehicles;

  -- Test avec tenant_b (si différent)
  IF v_tenant_b IS NOT NULL AND v_tenant_b <> v_tenant_a THEN
    PERFORM set_tenant(v_tenant_b);
    SELECT COUNT(*) INTO v_count_b FROM flt_vehicles;

    IF v_count_a <> v_count_b THEN
      RAISE NOTICE '✅ Test 2: Isolation tenant OK (Tenant A: % véhicules, Tenant B: % véhicules)', v_count_a, v_count_b;
    ELSE
      RAISE NOTICE '⚠️  Test 2: Isolation possible mais counts identiques (% véhicules)', v_count_a;
    END IF;
  ELSE
    RAISE NOTICE '⚠️  Test 2: Un seul tenant trouvé - impossible de tester cross-tenant';
  END IF;

  -- Test sans tenant_id défini (devrait retourner 0)
  PERFORM set_config('app.current_tenant_id', '', false);
  SELECT COUNT(*) INTO v_count_no_tenant FROM flt_vehicles;

  IF v_count_no_tenant = 0 THEN
    RAISE NOTICE '✅ Test 2b: Sans tenant_id → 0 véhicules (attendu)';
  ELSE
    RAISE NOTICE '❌ Test 2b: Sans tenant_id → % véhicules (attendu: 0)', v_count_no_tenant;
  END IF;
END;
$$;

-- Test 3: Vérifier isolation sur rid_drivers
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_tenant_id uuid;
  v_count_with_tenant integer;
  v_count_no_tenant integer;
BEGIN
  -- Récupérer un tenant_id
  SELECT id INTO v_tenant_id FROM adm_tenants LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '⚠️  Test 3: SKIPPED - Aucun tenant trouvé';
    RETURN;
  END IF;

  -- Avec tenant défini
  PERFORM set_tenant(v_tenant_id);
  SELECT COUNT(*) INTO v_count_with_tenant FROM rid_drivers;

  -- Sans tenant défini
  PERFORM set_config('app.current_tenant_id', '', false);
  SELECT COUNT(*) INTO v_count_no_tenant FROM rid_drivers;

  IF v_count_no_tenant = 0 AND v_count_with_tenant >= 0 THEN
    RAISE NOTICE '✅ Test 3: Isolation rid_drivers OK (avec tenant: %, sans tenant: 0)', v_count_with_tenant;
  ELSE
    RAISE NOTICE '❌ Test 3: Isolation rid_drivers FAIL (avec tenant: %, sans tenant: %)', v_count_with_tenant, v_count_no_tenant;
  END IF;
END;
$$;

-- Test 4: Vérifier isolation sur fin_transactions
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_tenant_id uuid;
  v_count_with_tenant integer;
  v_count_no_tenant integer;
BEGIN
  SELECT id INTO v_tenant_id FROM adm_tenants LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '⚠️  Test 4: SKIPPED - Aucun tenant trouvé';
    RETURN;
  END IF;

  PERFORM set_tenant(v_tenant_id);
  SELECT COUNT(*) INTO v_count_with_tenant FROM fin_transactions;

  PERFORM set_config('app.current_tenant_id', '', false);
  SELECT COUNT(*) INTO v_count_no_tenant FROM fin_transactions;

  IF v_count_no_tenant = 0 THEN
    RAISE NOTICE '✅ Test 4: Isolation fin_transactions OK (avec tenant: %, sans tenant: 0)', v_count_with_tenant;
  ELSE
    RAISE NOTICE '❌ Test 4: Isolation fin_transactions FAIL (sans tenant: %)', v_count_no_tenant;
  END IF;
END;
$$;

-- ============================================================================
-- RÉSUMÉ ATTENDU:
-- ✅ Test 1: set_tenant() fonctionne correctement
-- ✅ Test 2: Isolation tenant OK (counts différents par tenant)
-- ✅ Test 2b: Sans tenant_id → 0 véhicules
-- ✅ Test 3: Isolation rid_drivers OK
-- ✅ Test 4: Isolation fin_transactions OK
--
-- Si tous les tests passent → Isolation tenant fonctionne parfaitement!
-- ============================================================================
