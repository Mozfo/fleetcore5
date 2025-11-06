-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 16 - VALIDATIONS GO/NO-GO INTER-PHASES
-- ═══════════════════════════════════════════════════════════════════════════
-- Utilisé par MASTER.sh pour valider chaque phase avant de continuer
-- Usage: psql -f session_16_validations_inter_phases.sql --var phase=1
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

-- Déterminer quelle phase valider (passé en paramètre --var phase=X)
\if :{?phase}
  \echo 'Validation Phase': :phase
\else
  \echo 'ERREUR: Variable phase non définie!'
  \echo 'Usage: psql -f validations_inter_phases.sql --var phase=1'
  \q
\endif

-- ═══════════════════════════════════════════════════════════════════════════
-- VALIDATION PHASE 0 → PHASE 1
-- ═══════════════════════════════════════════════════════════════════════════

\if :{?phase}
\if :phase '0'
  \echo ''
  \echo '═══════════════════════════════════════════════════════════════'
  \echo '  VALIDATION GO/NO-GO: PHASE 0 → PHASE 1'
  \echo '═══════════════════════════════════════════════════════════════'
  \echo ''

  -- CHECK 1: Backup existe
  \echo 'CHECK 1: Backup créé?'
  \! ls -lh backup_session_16_pre_*.dump 2>/dev/null || echo '❌ FAIL: Backup absent'

  -- CHECK 2: 34 colonnes _v2
  SELECT
    CASE
      WHEN COUNT(*) = 34 THEN '✅ GO: 34 colonnes _v2 confirmées'
      ELSE '❌ NO-GO: Attendu 34, trouvé ' || COUNT(*)
    END as validation
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name LIKE '%_v2';

  -- CHECK 3: ZÉRO NULL critiques
  DO $$
  DECLARE
    v_null_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_null_count
    FROM rid_drivers
    WHERE driver_status_v2 IS NULL;

    IF v_null_count > 0 THEN
      RAISE EXCEPTION '❌ NO-GO: % NULL trouvés sur rid_drivers.driver_status_v2', v_null_count;
    ELSE
      RAISE NOTICE '✅ GO: ZÉRO NULL sur colonnes critiques';
    END IF;
  END $$;

  \echo ''
  \echo 'Si TOUS les checks = ✅ GO → Continuer vers Phase 1'
  \echo 'Si UN check = ❌ NO-GO → STOP!'
  \echo ''
\endif

-- ═══════════════════════════════════════════════════════════════════════════
-- VALIDATION PHASE 1 → PHASE 2
-- ═══════════════════════════════════════════════════════════════════════════

\if :phase = 1
  \echo ''
  \echo '═══════════════════════════════════════════════════════════════'
  \echo '  VALIDATION GO/NO-GO: PHASE 1 → PHASE 2'
  \echo '═══════════════════════════════════════════════════════════════'
  \echo ''

  -- CHECK 1: ZÉRO colonne _v2
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN '✅ GO: 0 colonnes _v2 restantes'
      ELSE '❌ NO-GO: ' || COUNT(*) || ' colonnes _v2 encore présentes!'
    END as validation
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name LIKE '%_v2';

  -- CHECK 2: Colonnes RENAME existent
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bil_billing_plans' AND column_name = 'status' AND data_type = 'USER-DEFINED'
    ) THEN
      RAISE NOTICE '✅ GO: bil_billing_plans.status (enum) existe';
    ELSE
      RAISE EXCEPTION '❌ NO-GO: bil_billing_plans.status manquante ou mal typée';
    END IF;
  END $$;

  \echo ''
  \echo 'Si TOUS les checks = ✅ GO → Continuer vers Phase 2'
  \echo 'Si UN check = ❌ NO-GO → ROLLBACK Phase 1!'
  \echo ''
\endif

-- ═══════════════════════════════════════════════════════════════════════════
-- VALIDATION PHASE 2 → PHASE 3
-- ═══════════════════════════════════════════════════════════════════════════

\if :phase = 2
  \echo ''
  \echo '═══════════════════════════════════════════════════════════════'
  \echo '  VALIDATION GO/NO-GO: PHASE 2 → PHASE 3'
  \echo '═══════════════════════════════════════════════════════════════'
  \echo ''

  -- CHECK 1: NOT NULL appliqués
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'dir_car_makes' AND column_name = 'tenant_id' AND is_nullable = 'NO'
    ) THEN
      RAISE NOTICE '✅ GO: NOT NULL appliqués (échantillon)';
    ELSE
      RAISE EXCEPTION '❌ NO-GO: NOT NULL non appliqués';
    END IF;
  END $$;

  -- CHECK 2: UNIQUE indexes créés
  SELECT
    CASE
      WHEN COUNT(*) >= 8 THEN '✅ GO: ' || COUNT(*) || ' UNIQUE indexes créés'
      ELSE '❌ NO-GO: Attendu 8, trouvé ' || COUNT(*)'
    END as validation
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexdef LIKE '%UNIQUE%'
    AND indexdef LIKE '%deleted_at IS NULL%'
    AND indexname LIKE 'idx_%';

  \echo ''
  \echo 'Si TOUS les checks = ✅ GO → Continuer vers Phase 3'
  \echo 'Si UN check = ❌ NO-GO → ROLLBACK Phase 2!'
  \echo ''
\endif

-- ═══════════════════════════════════════════════════════════════════════════
-- VALIDATION PHASE 3 → PHASE 4
-- ═══════════════════════════════════════════════════════════════════════════

\if :phase = 3
  \echo ''
  \echo '═══════════════════════════════════════════════════════════════'
  \echo '  VALIDATION GO/NO-GO: PHASE 3 → PHASE 4'
  \echo '═══════════════════════════════════════════════════════════════'
  \echo ''

  -- CHECK 1: Index performance créés
  SELECT
    CASE
      WHEN COUNT(*) >= 25 THEN '✅ GO: ' || COUNT(*) || ' index performance créés'
      ELSE '❌ NO-GO: Attendu ~25, trouvé ' || COUNT(*)'
    END as validation
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND indexdef NOT LIKE '%UNIQUE%';

  \echo ''
  \echo 'Si CHECK = ✅ GO → Continuer vers Phase 4'
  \echo 'Si CHECK = ❌ NO-GO → Vérifier logs création index'
  \echo ''
\endif

-- ═══════════════════════════════════════════════════════════════════════════
-- VALIDATION PHASE 4 → PHASE 5
-- ═══════════════════════════════════════════════════════════════════════════

\if :phase = 4
  \echo ''
  \echo '═══════════════════════════════════════════════════════════════'
  \echo '  VALIDATION GO/NO-GO: PHASE 4 → PHASE 5'
  \echo '═══════════════════════════════════════════════════════════════'
  \echo ''

  -- CHECK 1: FK créée
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_crm_contracts_lead'
    ) THEN
      RAISE NOTICE '✅ GO: FK fk_crm_contracts_lead créée';
    ELSE
      RAISE EXCEPTION '❌ NO-GO: FK manquante';
    END IF;
  END $$;

  -- CHECK 2: Triggers créés
  SELECT
    CASE
      WHEN COUNT(*) >= 9 THEN '✅ GO: ' || COUNT(*) || ' triggers updated_at créés'
      ELSE '❌ NO-GO: Attendu 9, trouvé ' || COUNT(*)'
    END as validation
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%updated_at%'
    AND event_object_table IN (
      'dir_maintenance_types', 'sch_goal_types', 'rid_driver_performances'
    );

  \echo ''
  \echo 'Si TOUS les checks = ✅ GO → Continuer vers Phase 5 (validation finale)'
  \echo ''
\endif
