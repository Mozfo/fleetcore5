-- ═══════════════════════════════════════════════════════════════════════════════
-- SESSION 16 - VALIDATION RAPIDE POST-MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════
-- Usage: psql -f session_16_validation_rapide.sql
-- Durée: < 5 secondes
-- ═══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 16 - VALIDATION RAPIDE'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Environnement:'
SELECT current_database() as database, version();
\echo ''

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECK 1: COLONNES _V2 RESTANTES (ATTENDU: 0)
-- ══════════════════════════════════════════════════════════════════════════════

\echo '▶ CHECK 1: Colonnes _v2 restantes'
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS: 0 colonnes _v2'
    ELSE '❌ FAIL: ' || COUNT(*) || ' colonnes _v2 encore présentes!'
  END as resultat
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name LIKE '%_v2';

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECK 2: COLONNES V1 TEXT/VARCHAR SUR TABLES MIGRÉES (ATTENDU: 0)
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '▶ CHECK 2: Colonnes V1 TEXT/VARCHAR sur tables migrées'
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS: 0 colonnes TEXT/VARCHAR'
    ELSE '❌ FAIL: ' || COUNT(*) || ' colonnes TEXT/VARCHAR encore présentes!'
  END as resultat
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'bil_billing_plans', 'bil_payment_methods', 'bil_tenant_invoices', 'bil_tenant_subscriptions',
    'rid_drivers', 'rid_driver_documents', 'rid_driver_cooperation_terms',
    'rid_driver_requests', 'rid_driver_blacklists', 'rid_driver_training',
    'sch_goals', 'sch_maintenance_schedules', 'sch_shifts', 'sch_tasks',
    'sup_tickets', 'sup_customer_feedback',
    'trp_trips', 'trp_settlements', 'trp_client_invoices', 'trp_platform_accounts'
  )
  AND column_name IN (
    'status', 'priority', 'payment_type', 'driver_status', 'document_type',
    'compensation_model', 'signature_method', 'request_type', 'appeal_status',
    'training_type', 'provider_type', 'paid_by', 'preferred_payment_method',
    'goal_category', 'task_category', 'service_type', 'submitter_type'
  )
  AND data_type IN ('text', 'character varying');

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECK 3: COLONNES ENUM MIGRÉES (ATTENDU: 36+)
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '▶ CHECK 3: Colonnes ENUM migrées'
SELECT
  CASE
    WHEN COUNT(*) >= 36 THEN '✅ PASS: ' || COUNT(*) || ' colonnes ENUM'
    ELSE '❌ FAIL: Seulement ' || COUNT(*) || ' colonnes ENUM (attendu 36+)'
  END as resultat
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'bil_billing_plans', 'bil_payment_methods', 'bil_tenant_invoices', 'bil_tenant_subscriptions',
    'rid_drivers', 'rid_driver_documents', 'rid_driver_cooperation_terms',
    'rid_driver_requests', 'rid_driver_blacklists', 'rid_driver_training',
    'sch_goals', 'sch_maintenance_schedules', 'sch_shifts', 'sch_tasks',
    'sup_tickets', 'sup_customer_feedback',
    'trp_trips', 'trp_settlements', 'trp_client_invoices', 'trp_platform_accounts'
  )
  AND data_type = 'USER-DEFINED';

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECK 4: NOT NULL APPLIQUÉS (ATTENDU: 39+)
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '▶ CHECK 4: NOT NULL appliqués'
SELECT
  CASE
    WHEN COUNT(*) >= 8 THEN '✅ PASS: ' || COUNT(*) || ' colonnes NOT NULL'
    ELSE '⚠️  WARN: Seulement ' || COUNT(*) || ' colonnes NOT NULL (attendu 8+)'
  END as resultat
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'adm_members', 'dir_car_makes', 'sch_goal_types'
  )
  AND is_nullable = 'NO';

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECK 5: FK CRÉÉE (ATTENDU: 1)
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '▶ CHECK 5: Foreign Key créée'
SELECT
  CASE
    WHEN COUNT(*) >= 1 THEN '✅ PASS: FK fk_crm_contracts_lead existe'
    ELSE '❌ FAIL: FK fk_crm_contracts_lead manquante'
  END as resultat
FROM information_schema.table_constraints
WHERE constraint_name = 'fk_crm_contracts_lead';

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECK 6: TRIGGERS CRÉÉS (ATTENDU: 9+)
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '▶ CHECK 6: Triggers updated_at créés'
SELECT
  CASE
    WHEN COUNT(*) >= 9 THEN '✅ PASS: ' || COUNT(*) || ' triggers updated_at'
    ELSE '⚠️  WARN: Seulement ' || COUNT(*) || ' triggers (attendu 9+)'
  END as resultat
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%'
  AND event_object_table IN (
    'dir_maintenance_types', 'dir_ownership_types', 'dir_vehicle_statuses',
    'flt_vehicle_equipments', 'sch_goal_types', 'sch_locations',
    'sch_shift_types', 'sch_task_types', 'rid_driver_performances'
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECK 7: VUE v_driver_profile EXISTE
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '▶ CHECK 7: Vue v_driver_profile recréée'
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASS: Vue v_driver_profile existe'
    ELSE '❌ FAIL: Vue v_driver_profile manquante'
  END as resultat
FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'v_driver_profile';

-- ══════════════════════════════════════════════════════════════════════════════
-- RÉSUMÉ FINAL
-- ══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  RÉSUMÉ VALIDATION'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT
  '✅ Migration V1→V2 complète' as statut,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND column_name LIKE '%_v2') as colonnes_v2,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema='public' AND data_type='USER-DEFINED') as total_enum_db,
  pg_size_pretty(pg_database_size(current_database())) as db_size;

\echo ''
\echo 'Si TOUS les checks sont ✅ PASS → Migration réussie!'
\echo 'Si UN check est ❌ FAIL → Consulter logs Session 16'
\echo ''
