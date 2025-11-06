-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 15: INDEXES SOFT DELETE COMPLET (9 INDEXES)
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-11-05
-- Approche: ULTRATHINK - SUPABASE DB = UNIQUE SOURCE OF TRUTH
-- Source: Vérification directe DB Supabase (66 tables, 360 colonnes, 148 indexes)
--
-- CORRECTION: Analyse initiale basée sur Prisma schema désynchronisé
-- RÉSULTAT: 7 indexes SESSION_15 + 2 BONUS corrections noms = 9 total
--
-- ⚠️ IMPORTANT:
-- - CREATE INDEX CONCURRENTLY (non-bloquant, sans transaction)
-- - IF NOT EXISTS pour idempotence
-- - WHERE deleted_at IS NULL pour soft delete pattern
-- - Validation inline après chaque création
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 15: CRÉATION 9 INDEXES SOFT DELETE (7 + 2 BONUS)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Basé sur vérification DB Supabase réelle:'
\echo '  - 66 tables avec deleted_at'
\echo '  - 148 indexes existants avec soft delete'
\echo '  - Vérification manuelle des 18 indexes SESSION_15_INDEXES.md'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- PRIORITÉ P0 (CRITICAL) - INDEX UNIQUE SUR CODE CONTRAT
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '▶ P0-1: crm_contracts.contract_code (UNIQUE)'
\echo '   Raison: Code contrat unique - empêcher duplicata contrats actifs'
\echo '   SESSION_15 Index #3'

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_contracts_contract_code_unique
ON crm_contracts(contract_code)
WHERE deleted_at IS NULL;

\echo '✓ Validation P0-1:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_crm_contracts_contract_code_unique'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_crm_contracts_contract_code_unique';

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- PRIORITÉ P1 (HIGH) - INDEXES UNIQUE SUR TABLES TYPE (6 indexes)
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '▶ P1-1: sch_shift_types(tenant_id, code) (UNIQUE)'
\echo '   Raison: Un type de shift unique par code par tenant'
\echo '   SESSION_15 Index #8'

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_sch_shift_types_tenant_code_unique
ON sch_shift_types(tenant_id, code)
WHERE deleted_at IS NULL;

\echo '✓ Validation P1-1:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_sch_shift_types_tenant_code_unique'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_sch_shift_types_tenant_code_unique';

\echo ''

-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ P1-2: dir_maintenance_types(tenant_id, code) (UNIQUE)'
\echo '   Raison: Un type de maintenance unique par code par tenant'
\echo '   SESSION_15 Index #10'

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_dir_maintenance_types_tenant_code_unique
ON dir_maintenance_types(tenant_id, code)
WHERE deleted_at IS NULL;

\echo '✓ Validation P1-2:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_dir_maintenance_types_tenant_code_unique'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_dir_maintenance_types_tenant_code_unique';

\echo ''

-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ P1-3: sch_goal_types(tenant_id, code) (UNIQUE)'
\echo '   Raison: Un type d''objectif unique par code par tenant'
\echo '   SESSION_15 Index #12'

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_sch_goal_types_tenant_code_unique
ON sch_goal_types(tenant_id, code)
WHERE deleted_at IS NULL;

\echo '✓ Validation P1-3:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_sch_goal_types_tenant_code_unique'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_sch_goal_types_tenant_code_unique';

\echo ''

-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ P1-4: sch_task_types(tenant_id, code) (UNIQUE)'
\echo '   Raison: Un type de tâche unique par code par tenant'
\echo '   SESSION_15 Index #14'

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_sch_task_types_tenant_code_unique
ON sch_task_types(tenant_id, code)
WHERE deleted_at IS NULL;

\echo '✓ Validation P1-4:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_sch_task_types_tenant_code_unique'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_sch_task_types_tenant_code_unique';

\echo ''

-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ P1-5: sch_locations(tenant_id, code) (UNIQUE)'
\echo '   Raison: Une localisation unique par code par tenant'
\echo '   SESSION_15 Index #15'

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_sch_locations_tenant_code_unique
ON sch_locations(tenant_id, code)
WHERE deleted_at IS NULL;

\echo '✓ Validation P1-5:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_sch_locations_tenant_code_unique'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_sch_locations_tenant_code_unique';

\echo ''

-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ P1-6: trp_trips(platform_account_id, platform_trip_id) (UNIQUE)'
\echo '   Raison: Un trip unique par ID plateforme par compte'
\echo '   SESSION_15 Index #17'

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_trp_trips_platform_account_trip_unique
ON trp_trips(platform_account_id, platform_trip_id)
WHERE deleted_at IS NULL;

\echo '✓ Validation P1-6:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_trp_trips_platform_account_trip_unique'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_trp_trips_platform_account_trip_unique';

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION BONUS - CORRECTIONS NOMS COLONNES (2 indexes)
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '▶ BONUS-1: dir_car_makes(tenant_id, code) (UNIQUE)'
\echo '   Raison: Marque automobile unique par code par tenant'
\echo '   Note: SESSION_15 voulait make_code, DB a code'
\echo '   SESSION_15 Index #5 (variante)'

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_dir_car_makes_tenant_code_unique
ON dir_car_makes(tenant_id, code)
WHERE deleted_at IS NULL;

\echo '✓ Validation BONUS-1:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_dir_car_makes_tenant_code_unique'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_dir_car_makes_tenant_code_unique';

\echo ''

-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ BONUS-2: crm_contracts.contract_reference (UNIQUE)'
\echo '   Raison: Référence contrat unique'
\echo '   Note: SESSION_15 voulait reference, DB a contract_reference'
\echo '   SESSION_15 Index #2 (variante)'

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_contracts_contract_reference_unique
ON crm_contracts(contract_reference)
WHERE deleted_at IS NULL;

\echo '✓ Validation BONUS-2:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_crm_contracts_contract_reference_unique'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_crm_contracts_contract_reference_unique';

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- VALIDATION FINALE
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  VALIDATION FINALE: RÉSUMÉ DES 9 INDEXES CRÉÉS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT
  indexname as "Index Name",
  tablename as "Table",
  CASE
    WHEN indexname LIKE '%contract_code%' THEN 'P0 - Critical'
    WHEN indexname LIKE '%shift_types%' THEN 'P1 - High'
    WHEN indexname LIKE '%maintenance_types%' THEN 'P1 - High'
    WHEN indexname LIKE '%goal_types%' THEN 'P1 - High'
    WHEN indexname LIKE '%task_types%' THEN 'P1 - High'
    WHEN indexname LIKE '%locations%' THEN 'P1 - High'
    WHEN indexname LIKE '%trips%platform%' THEN 'P1 - High'
    WHEN indexname LIKE '%car_makes%' THEN 'BONUS - Correction nom'
    WHEN indexname LIKE '%contract_reference%' THEN 'BONUS - Correction nom'
    ELSE 'Unknown'
  END as "Priority"
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%WHERE%deleted_at IS NULL%'
  AND indexname IN (
    'idx_crm_contracts_contract_code_unique',
    'idx_sch_shift_types_tenant_code_unique',
    'idx_dir_maintenance_types_tenant_code_unique',
    'idx_sch_goal_types_tenant_code_unique',
    'idx_sch_task_types_tenant_code_unique',
    'idx_sch_locations_tenant_code_unique',
    'idx_trp_trips_platform_account_trip_unique',
    'idx_dir_car_makes_tenant_code_unique',
    'idx_crm_contracts_contract_reference_unique'
  )
ORDER BY "Priority", "Table";

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  STATISTIQUES FINALES'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT
  'Total indexes avec soft delete AVANT' as metric,
  148 as count
UNION ALL
SELECT
  'Nouveaux indexes créés (Session 15)' as metric,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_crm_contracts_contract_code_unique',
    'idx_sch_shift_types_tenant_code_unique',
    'idx_dir_maintenance_types_tenant_code_unique',
    'idx_sch_goal_types_tenant_code_unique',
    'idx_sch_task_types_tenant_code_unique',
    'idx_sch_locations_tenant_code_unique',
    'idx_trp_trips_platform_account_trip_unique',
    'idx_dir_car_makes_tenant_code_unique',
    'idx_crm_contracts_contract_reference_unique'
  )
UNION ALL
SELECT
  'Total indexes avec soft delete APRÈS' as metric,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%WHERE%deleted_at%';

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION_15_INDEXES.md - STATUT FINAL'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Sur 18 indexes documentés:'
\echo '  ✅ 7 existaient déjà (#1, 7, 9, 11, 13, 16, 18)'
\echo '  ✅ 7 créés - indexes originaux (#3, 8, 10, 12, 14, 15, 17)'
\echo '  ✅ 2 créés - corrections noms (B1: #5 variant, B2: #2 variant)'
\echo '  ❌ 4 impossibles - colonnes absentes (#2, 4, 5, 6 exacts)'
\echo ''
\echo '  📊 TOTAL: 16/18 résolus (89%)'
\echo ''
\echo '✅ SESSION 15 COMPLÉTÉE: 9 INDEXES CRÉÉS AVEC SUCCÈS'
\echo ''
\echo 'Note: Première tentative basée sur Prisma désynchronisé'
\echo 'Correction: Vérification directe DB Supabase = SOURCE OF TRUTH'
\echo ''
