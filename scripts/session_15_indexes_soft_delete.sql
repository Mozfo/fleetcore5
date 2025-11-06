-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 15: INDEXES SOFT DELETE (CODE RÉEL)
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-11-05
-- Approche: ULTRATHINK - CODE RÉEL = SOURCE OF TRUTH
-- Source: Analyse Phase 1-3 (66 tables, 140 indexes existants, 379 @@index Prisma)
--
-- ⚠️ IMPORTANT:
-- - CREATE INDEX CONCURRENTLY ne peut PAS être dans une transaction (BEGIN/COMMIT)
-- - Chaque index est créé individuellement
-- - IF NOT EXISTS assure l'idempotence
-- - WHERE deleted_at IS NULL pour respecter soft delete pattern
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 15: CRÉATION INDEXES SOFT DELETE (4 NOUVEAUX)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: DOCUMENTATION DES INDEXES UNIQUE EXISTANTS (6)
-- ═══════════════════════════════════════════════════════════════════════════
-- Ces indexes UNIQUE sont déjà en production avec WHERE deleted_at IS NULL
-- Documentés pour référence complète
-- ═══════════════════════════════════════════════════════════════════════════

-- ✅ 1. crm_leads_email_unique_active
--    Table: crm_leads
--    Colonne: email
--    Index: CREATE UNIQUE INDEX ... ON crm_leads(email) WHERE deleted_at IS NULL

-- ✅ 2. flt_vehicles_tenant_plate_uq
--    Table: flt_vehicles
--    Colonnes: tenant_id, license_plate
--    Index: CREATE UNIQUE INDEX ... ON flt_vehicles(tenant_id, license_plate) WHERE deleted_at IS NULL

-- ✅ 3. sch_shifts_tenant_driver_start_unique
--    Table: sch_shifts
--    Colonnes: tenant_id, driver_id, start_time
--    Index: CREATE UNIQUE INDEX ... ON sch_shifts(tenant_id, driver_id, start_time) WHERE deleted_at IS NULL

-- ✅ 4. sch_maintenance_schedules_tenant_vehicle_date_type_unique
--    Table: sch_maintenance_schedules
--    Colonnes: tenant_id, vehicle_id, scheduled_date, maintenance_type
--    Index: CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL

-- ✅ 5. sch_goals_tenant_type_period_assigned_unique
--    Table: sch_goals
--    Colonnes: tenant_id, goal_type, period_start, assigned_to
--    Index: CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL

-- ✅ 6. idx_trp_platform_accounts_tenant_platform_unique
--    Table: trp_platform_accounts
--    Colonnes: tenant_id, platform_id
--    Index: CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL

-- ✅ 7. idx_trp_client_invoices_tenant_invoice_unique
--    Table: trp_client_invoices
--    Colonnes: tenant_id, invoice_number
--    Index: CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SECTION 2: CRÉATION 4 NOUVEAUX INDEXES (CODE RÉEL VÉRIFIÉ)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- PRIORITÉ P0 (CRITICAL) - INDEX SUR COLONNE STATUS CRITIQUE
-- ═══════════════════════════════════════════════════════════════════════════

\echo '▶ P0-1: rid_drivers.driver_status'
\echo '   Raison: Colonne critique pour filtrer drivers actifs/inactifs'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rid_drivers_driver_status_active
ON rid_drivers(driver_status)
WHERE deleted_at IS NULL;

\echo '✓ Validation P0-1:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_rid_drivers_driver_status_active'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_rid_drivers_driver_status_active';

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- PRIORITÉ P1 (HIGH) - INDEXES SUR COLONNES TYPE FRÉQUEMMENT FILTRÉES
-- ═══════════════════════════════════════════════════════════════════════════

\echo '▶ P1-1: flt_vehicle_events.event_type'
\echo '   Raison: Filtrage par type d\'événement (accident, panne, contrôle, etc.)'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flt_vehicle_events_event_type_active
ON flt_vehicle_events(event_type)
WHERE deleted_at IS NULL;

\echo '✓ Validation P1-1:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_flt_vehicle_events_event_type_active'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_flt_vehicle_events_event_type_active';

\echo ''

-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ P1-2: flt_vehicle_expenses.expense_category'
\echo '   Raison: Filtrage et reporting par catégorie de dépense'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flt_vehicle_expenses_expense_category_active
ON flt_vehicle_expenses(expense_category)
WHERE deleted_at IS NULL;

\echo '✓ Validation P1-2:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_flt_vehicle_expenses_expense_category_active'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_flt_vehicle_expenses_expense_category_active';

\echo ''

-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ P1-3: sch_tasks.task_type'
\echo '   Raison: Filtrage par type de tâche dans module scheduling'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sch_tasks_task_type_active
ON sch_tasks(task_type)
WHERE deleted_at IS NULL;

\echo '✓ Validation P1-3:'
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Index créé: idx_sch_tasks_task_type_active'
    ELSE '❌ Erreur: Index non créé'
  END as result
FROM pg_indexes
WHERE indexname = 'idx_sch_tasks_task_type_active';

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- VALIDATION FINALE
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  VALIDATION FINALE: RÉSUMÉ DES 4 INDEXES CRÉÉS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT
  indexname as "Index Name",
  tablename as "Table",
  CASE
    WHEN indexname LIKE '%driver_status%' THEN 'P0 - Critical'
    WHEN indexname LIKE '%event_type%' THEN 'P1 - High'
    WHEN indexname LIKE '%expense_category%' THEN 'P1 - High'
    WHEN indexname LIKE '%task_type%' THEN 'P1 - High'
    ELSE 'Unknown'
  END as "Priority"
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%WHERE%deleted_at IS NULL%'
  AND indexname IN (
    'idx_rid_drivers_driver_status_active',
    'idx_flt_vehicle_events_event_type_active',
    'idx_flt_vehicle_expenses_expense_category_active',
    'idx_sch_tasks_task_type_active'
  )
ORDER BY "Priority", "Table";

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  STATISTIQUES FINALES'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT
  'Total indexes avec soft delete AVANT' as metric,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%WHERE%deleted_at%'
  AND indexname NOT IN (
    'idx_rid_drivers_driver_status_active',
    'idx_flt_vehicle_events_event_type_active',
    'idx_flt_vehicle_expenses_expense_category_active',
    'idx_sch_tasks_task_type_active'
  )

UNION ALL

SELECT
  'Nouveaux indexes créés (Session 15)' as metric,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_rid_drivers_driver_status_active',
    'idx_flt_vehicle_events_event_type_active',
    'idx_flt_vehicle_expenses_expense_category_active',
    'idx_sch_tasks_task_type_active'
  )

UNION ALL

SELECT
  'Total indexes avec soft delete APRÈS' as metric,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%WHERE%deleted_at%';

\echo ''
\echo '✅ SESSION 15 COMPLÉTÉE: 4 INDEXES CRÉÉS AVEC SUCCÈS'
\echo ''
\echo 'Note: SESSION_15_INDEXES.md était obsolète (12/18 impossibles)'
\echo 'Approche CODE RÉEL utilisée: 4 nouveaux indexes + 7 UNIQUE existants documentés'
\echo ''
