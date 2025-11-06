-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 16 - PHASE 1: CLEANUP _V2 (DROP V1 + RENAME V2)
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-11-05
-- Durée estimée: 10 minutes
-- Risque: ÉLEVÉ ⚠️ (ALTER TABLE DROP COLUMN + RENAME)
--
-- ⚠️⚠️⚠️ PHASE LA PLUS CRITIQUE DE SESSION 16 ⚠️⚠️⚠️
--
-- BACKUP OBLIGATOIRE AVANT EXÉCUTION!
-- TESTER SUR DB LOCALE/DEV EN PREMIER!
--
-- ORDRE D'EXÉCUTION CORRECT (CORRIGÉ):
--   1A. DROP 21 index obsolètes (CONCURRENTLY)
--   1B. DROP 22 colonnes V1 (status TEXT, priority TEXT, etc.)
--   1C. RENAME 35 colonnes _v2 → nom final (status_v2 → status)
--
-- RAISON ORDRE:
--   PostgreSQL refuse RENAME status_v2 TO status si status existe déjà!
--   Il faut DROP status (V1) AVANT de RENAME status_v2 (V2)
--
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 16 - PHASE 1: CLEANUP _V2'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '⚠️⚠️⚠️  PHASE CRITIQUE - LECTURE OBLIGATOIRE  ⚠️⚠️⚠️'
\echo ''
\echo 'Cette phase va:'
\echo '  ❌ SUPPRIMER 21 index obsolètes'
\echo '  ❌ SUPPRIMER 22 colonnes V1 (status, priority, etc. TEXT/VARCHAR)'
\echo '  ✏️  RENOMMER 35 colonnes _v2 → nom final (status_v2 → status)'
\echo ''
\echo 'BACKUP VÉRIFIÉ?'
\echo '  Fichier: backup_session_16_pre_YYYYMMDD_HHMMSS.dump'
\echo '  Commande test restore:'
\echo '    pg_restore --list backup_session_16_pre_*.dump | head -20'
\echo ''

\echo ''
\echo 'ENVIRONNEMENT CONFIRMÉ?'
\echo '  ✅ DB locale/dev: GO'
\echo '  ⚠️  DB Supabase Production: Tester dev d''abord!'
\echo ''
SELECT
  current_database() as database,
  inet_server_addr() as server;
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 1A: DROP 21 INDEX OBSOLÈTES (3 minutes)
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  ÉTAPE 1A: DROP 21 INDEX OBSOLÈTES'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '⏱️  Durée estimée: 3 minutes'
\echo '📝 Index sur colonnes V1 qui vont être DROP à l''étape suivante'
\echo ''

-- ⚠️ IMPORTANT: DROP CONCURRENTLY ne peut PAS être dans une transaction
-- Donc ces DROP sont exécutés immédiatement sans BEGIN/COMMIT

-- MODULE BIL (4 index)
\echo '▶ Module BIL (4 index)'

DROP INDEX CONCURRENTLY IF EXISTS bil_billing_plans_status_idx;
\echo '  ✓ bil_billing_plans_status_idx'

DROP INDEX CONCURRENTLY IF EXISTS bil_payment_methods_status_active_idx;
\echo '  ✓ bil_payment_methods_status_active_idx'

DROP INDEX CONCURRENTLY IF EXISTS bil_tenant_invoices_status_idx;
\echo '  ✓ bil_tenant_invoices_status_idx'

DROP INDEX CONCURRENTLY IF EXISTS bil_tenant_subscriptions_status_idx;
\echo '  ✓ bil_tenant_subscriptions_status_idx'

-- MODULE RID (3 index)
\echo '▶ Module RID (3 index)'

DROP INDEX CONCURRENTLY IF EXISTS rid_driver_blacklists_status_active_idx;
\echo '  ✓ rid_driver_blacklists_status_active_idx'

DROP INDEX CONCURRENTLY IF EXISTS rid_driver_requests_status_active_idx;
\echo '  ✓ rid_driver_requests_status_active_idx'

DROP INDEX CONCURRENTLY IF EXISTS rid_driver_training_status_active_idx;
\echo '  ✓ rid_driver_training_status_active_idx'

-- MODULE SCH (5 index + 2 doublons)
\echo '▶ Module SCH (5 index)'

DROP INDEX CONCURRENTLY IF EXISTS sch_goals_status_active_idx;
\echo '  ✓ sch_goals_status_active_idx'

DROP INDEX CONCURRENTLY IF EXISTS sch_maintenance_schedules_status_active_idx;
\echo '  ✓ sch_maintenance_schedules_status_active_idx'

DROP INDEX CONCURRENTLY IF EXISTS idx_sch_shifts_status;
\echo '  ✓ idx_sch_shifts_status'

DROP INDEX CONCURRENTLY IF EXISTS sch_shifts_status_active_idx;
\echo '  ✓ sch_shifts_status_active_idx (doublon)'

DROP INDEX CONCURRENTLY IF EXISTS idx_sch_tasks_status_active;
\echo '  ✓ idx_sch_tasks_status_active'

-- MODULE SUP (4 index + 2 doublons)
\echo '▶ Module SUP (4 index)'

DROP INDEX CONCURRENTLY IF EXISTS idx_sup_tickets_priority;
\echo '  ✓ idx_sup_tickets_priority'

DROP INDEX CONCURRENTLY IF EXISTS idx_sup_tickets_status;
\echo '  ✓ idx_sup_tickets_status'

DROP INDEX CONCURRENTLY IF EXISTS sup_tickets_priority_active_idx;
\echo '  ✓ sup_tickets_priority_active_idx (doublon)'

DROP INDEX CONCURRENTLY IF EXISTS sup_tickets_status_active_idx;
\echo '  ✓ sup_tickets_status_active_idx (doublon)'

-- MODULE TRP (3 index)
\echo '▶ Module TRP (3 index)'

DROP INDEX CONCURRENTLY IF EXISTS idx_trp_client_invoices_status_active;
\echo '  ✓ idx_trp_client_invoices_status_active'

DROP INDEX CONCURRENTLY IF EXISTS idx_trp_settlements_status_active;
\echo '  ✓ idx_trp_settlements_status_active'

DROP INDEX CONCURRENTLY IF EXISTS trp_trips_status_active_idx;
\echo '  ✓ trp_trips_status_active_idx'

-- DOUBLONS (2 index)
\echo '▶ Doublons à nettoyer (2 index)'

DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_status;
\echo '  ✓ idx_crm_leads_status'

DROP INDEX CONCURRENTLY IF EXISTS idx_flt_vehicles_status;
\echo '  ✓ idx_flt_vehicles_status'

\echo ''
\echo '✅ ÉTAPE 1A COMPLÉTÉE: 21 index obsolètes supprimés'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 1B: DROP 22 COLONNES V1 (2 minutes)
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  ÉTAPE 1B: DROP 22 COLONNES V1 TEXT/VARCHAR'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '⏱️  Durée estimée: 2 minutes'
\echo '⚠️  BREAKING CHANGES - Colonnes V1 définitivement supprimées'
\echo '✅ Pas de perte données - Valeurs déjà migrées vers V2'
\echo ''
\echo '⏸️  DERNIÈRE CHANCE AVANT SUPPRESSION COLONNES'

BEGIN;

\echo ''
\echo '▶ Module BIL (7 colonnes V1)'

-- Table 1: bil_billing_plans
ALTER TABLE bil_billing_plans DROP COLUMN IF EXISTS status;
\echo '  ✓ bil_billing_plans.status (TEXT V1)'

-- Table 2: bil_payment_methods (2 colonnes)
ALTER TABLE bil_payment_methods DROP COLUMN IF EXISTS payment_type;
\echo '  ✓ bil_payment_methods.payment_type (TEXT V1)'

ALTER TABLE bil_payment_methods DROP COLUMN IF EXISTS status;
\echo '  ✓ bil_payment_methods.status (TEXT V1)'

-- Table 3: bil_tenant_invoices
ALTER TABLE bil_tenant_invoices DROP COLUMN IF EXISTS status;
\echo '  ✓ bil_tenant_invoices.status (TEXT V1)'

-- Table 4: bil_tenant_subscriptions
ALTER TABLE bil_tenant_subscriptions DROP COLUMN IF EXISTS status;
\echo '  ✓ bil_tenant_subscriptions.status (TEXT V1)'

\echo ''
\echo '▶ Module SUP (3 colonnes V1)'

-- Table 1: sup_tickets (2 colonnes)
ALTER TABLE sup_tickets DROP COLUMN IF EXISTS status;
\echo '  ✓ sup_tickets.status (TEXT V1)'

ALTER TABLE sup_tickets DROP COLUMN IF EXISTS priority;
\echo '  ✓ sup_tickets.priority (TEXT V1)'

-- Table 2: sup_customer_feedback
ALTER TABLE sup_customer_feedback DROP COLUMN IF EXISTS submitter_type;
\echo '  ✓ sup_customer_feedback.submitter_type (VARCHAR V1)'

\echo ''
\echo '▶ Module RID (7 colonnes V1)'

-- Table 1: rid_drivers
ALTER TABLE rid_drivers DROP COLUMN IF EXISTS driver_status;
\echo '  ✓ rid_drivers.driver_status (VARCHAR V1)'

-- Table 2: rid_driver_documents
ALTER TABLE rid_driver_documents DROP COLUMN IF EXISTS document_type;
\echo '  ✓ rid_driver_documents.document_type (TEXT V1)'

-- Table 3: rid_driver_cooperation_terms
ALTER TABLE rid_driver_cooperation_terms DROP COLUMN IF EXISTS status;
\echo '  ✓ rid_driver_cooperation_terms.status (TEXT V1)'

-- Table 4: rid_driver_requests (2 colonnes)
ALTER TABLE rid_driver_requests DROP COLUMN IF EXISTS request_type;
\echo '  ✓ rid_driver_requests.request_type (TEXT V1)'

ALTER TABLE rid_driver_requests DROP COLUMN IF EXISTS status;
\echo '  ✓ rid_driver_requests.status (TEXT V1)'

-- Table 5: rid_driver_blacklists
ALTER TABLE rid_driver_blacklists DROP COLUMN IF EXISTS status;
\echo '  ✓ rid_driver_blacklists.status (TEXT V1)'

-- Table 6: rid_driver_training
ALTER TABLE rid_driver_training DROP COLUMN IF EXISTS status;
\echo '  ✓ rid_driver_training.status (TEXT V1)'

\echo ''
\echo '▶ Module SCH (4 colonnes V1)'

-- Table 1: sch_goals
ALTER TABLE sch_goals DROP COLUMN IF EXISTS status;
\echo '  ✓ sch_goals.status (TEXT V1)'

-- Table 2: sch_maintenance_schedules
ALTER TABLE sch_maintenance_schedules DROP COLUMN IF EXISTS status;
\echo '  ✓ sch_maintenance_schedules.status (TEXT V1)'

-- Table 3: sch_shifts
ALTER TABLE sch_shifts DROP COLUMN IF EXISTS status;
\echo '  ✓ sch_shifts.status (TEXT V1)'

-- Table 4: sch_tasks
ALTER TABLE sch_tasks DROP COLUMN IF EXISTS status;
\echo '  ✓ sch_tasks.status (TEXT V1)'

\echo ''
\echo '▶ Module TRP (3 colonnes V1)'

-- Table 1: trp_trips
ALTER TABLE trp_trips DROP COLUMN IF EXISTS status;
\echo '  ✓ trp_trips.status (VARCHAR V1)'

-- Table 2: trp_settlements
ALTER TABLE trp_settlements DROP COLUMN IF EXISTS status;
\echo '  ✓ trp_settlements.status (TEXT V1)'

-- Table 3: trp_client_invoices
ALTER TABLE trp_client_invoices DROP COLUMN IF EXISTS status;
\echo '  ✓ trp_client_invoices.status (TEXT V1)'

COMMIT;

\echo ''
\echo '✅ ÉTAPE 1B COMPLÉTÉE: 22 colonnes V1 supprimées'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 1C: RENAME 34 COLONNES _V2 → FINAL (5 minutes)
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  ÉTAPE 1C: RENAME 34 COLONNES _V2 → NOM FINAL'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '⏱️  Durée estimée: 5 minutes'
\echo '📝 Enlever suffix _v2 pour conformité Prisma schema V2'
\echo ''

BEGIN;

\echo ''
\echo '▶ Module BIL (5 colonnes)'

-- Table 1: bil_billing_plans
ALTER TABLE bil_billing_plans RENAME COLUMN status_v2 TO status;
\echo '  ✓ bil_billing_plans: status_v2 → status'

-- Table 2: bil_payment_methods (2 colonnes)
ALTER TABLE bil_payment_methods RENAME COLUMN payment_type_v2 TO payment_type;
\echo '  ✓ bil_payment_methods: payment_type_v2 → payment_type'

ALTER TABLE bil_payment_methods RENAME COLUMN status_v2 TO status;
\echo '  ✓ bil_payment_methods: status_v2 → status'

-- Table 3: bil_tenant_invoices
ALTER TABLE bil_tenant_invoices RENAME COLUMN status_v2 TO status;
\echo '  ✓ bil_tenant_invoices: status_v2 → status'

-- Table 4: bil_tenant_subscriptions
ALTER TABLE bil_tenant_subscriptions RENAME COLUMN status_v2 TO status;
\echo '  ✓ bil_tenant_subscriptions: status_v2 → status'

\echo ''
\echo '▶ Module SUP (4 colonnes)'

-- Table 1: sup_tickets (2 colonnes)
ALTER TABLE sup_tickets RENAME COLUMN status_v2 TO status;
\echo '  ✓ sup_tickets: status_v2 → status'

ALTER TABLE sup_tickets RENAME COLUMN priority_v2 TO priority;
\echo '  ✓ sup_tickets: priority_v2 → priority'

-- Table 2: sup_customer_feedback (2 colonnes)
ALTER TABLE sup_customer_feedback RENAME COLUMN service_type_v2 TO service_type;
\echo '  ✓ sup_customer_feedback: service_type_v2 → service_type'

ALTER TABLE sup_customer_feedback RENAME COLUMN submitter_type_v2 TO submitter_type;
\echo '  ✓ sup_customer_feedback: submitter_type_v2 → submitter_type'

\echo ''
\echo '▶ Module RID (15 colonnes)'

-- Table 1: rid_drivers (2 colonnes)
ALTER TABLE rid_drivers RENAME COLUMN preferred_payment_method_v2 TO preferred_payment_method;
\echo '  ✓ rid_drivers: preferred_payment_method_v2 → preferred_payment_method'

ALTER TABLE rid_drivers RENAME COLUMN driver_status_v2 TO driver_status;
\echo '  ✓ rid_drivers: driver_status_v2 → driver_status'

-- Table 2: rid_driver_documents
ALTER TABLE rid_driver_documents RENAME COLUMN document_type_v2 TO document_type;
\echo '  ✓ rid_driver_documents: document_type_v2 → document_type'

-- Table 3: rid_driver_cooperation_terms (3 colonnes)
ALTER TABLE rid_driver_cooperation_terms RENAME COLUMN status_v2 TO status;
\echo '  ✓ rid_driver_cooperation_terms: status_v2 → status'

ALTER TABLE rid_driver_cooperation_terms RENAME COLUMN compensation_model_v2 TO compensation_model;
\echo '  ✓ rid_driver_cooperation_terms: compensation_model_v2 → compensation_model'

ALTER TABLE rid_driver_cooperation_terms RENAME COLUMN signature_method_v2 TO signature_method;
\echo '  ✓ rid_driver_cooperation_terms: signature_method_v2 → signature_method'

-- Table 4: rid_driver_requests (2 colonnes)
ALTER TABLE rid_driver_requests RENAME COLUMN request_type_v2 TO request_type;
\echo '  ✓ rid_driver_requests: request_type_v2 → request_type'

ALTER TABLE rid_driver_requests RENAME COLUMN status_v2 TO status;
\echo '  ✓ rid_driver_requests: status_v2 → status'

-- Table 5: rid_driver_blacklists (2 colonnes)
ALTER TABLE rid_driver_blacklists RENAME COLUMN status_v2 TO status;
\echo '  ✓ rid_driver_blacklists: status_v2 → status'

ALTER TABLE rid_driver_blacklists RENAME COLUMN appeal_status_v2 TO appeal_status;
\echo '  ✓ rid_driver_blacklists: appeal_status_v2 → appeal_status'

-- Table 6: rid_driver_training (4 colonnes)
ALTER TABLE rid_driver_training RENAME COLUMN training_type_v2 TO training_type;
\echo '  ✓ rid_driver_training: training_type_v2 → training_type'

ALTER TABLE rid_driver_training RENAME COLUMN status_v2 TO status;
\echo '  ✓ rid_driver_training: status_v2 → status'

ALTER TABLE rid_driver_training RENAME COLUMN provider_type_v2 TO provider_type;
\echo '  ✓ rid_driver_training: provider_type_v2 → provider_type'

ALTER TABLE rid_driver_training RENAME COLUMN paid_by_v2 TO paid_by;
\echo '  ✓ rid_driver_training: paid_by_v2 → paid_by'

-- Table 7: rid_driver_performances
ALTER TABLE rid_driver_performances RENAME COLUMN period_type_v2 TO period_type;
\echo '  ✓ rid_driver_performances: period_type_v2 → period_type'

\echo ''
\echo '▶ Module SCH (7 colonnes)'

-- Table 1: sch_shifts
ALTER TABLE sch_shifts RENAME COLUMN status_v2 TO status;
\echo '  ✓ sch_shifts: status_v2 → status'

-- Table 2: sch_maintenance_schedules
ALTER TABLE sch_maintenance_schedules RENAME COLUMN status_v2 TO status;
\echo '  ✓ sch_maintenance_schedules: status_v2 → status'

-- Table 3: sch_goals (2 colonnes)
ALTER TABLE sch_goals RENAME COLUMN goal_category_v2 TO goal_category;
\echo '  ✓ sch_goals: goal_category_v2 → goal_category'

ALTER TABLE sch_goals RENAME COLUMN status_v2 TO status;
\echo '  ✓ sch_goals: status_v2 → status'

-- Table 4: sch_tasks (3 colonnes)
ALTER TABLE sch_tasks RENAME COLUMN task_category_v2 TO task_category;
\echo '  ✓ sch_tasks: task_category_v2 → task_category'

ALTER TABLE sch_tasks RENAME COLUMN priority_v2 TO priority;
\echo '  ✓ sch_tasks: priority_v2 → priority'

ALTER TABLE sch_tasks RENAME COLUMN status_v2 TO status;
\echo '  ✓ sch_tasks: status_v2 → status'

\echo ''
\echo '▶ Module TRP (4 colonnes)'

-- Table 1: trp_platform_accounts
ALTER TABLE trp_platform_accounts RENAME COLUMN status_v2 TO status;
\echo '  ✓ trp_platform_accounts: status_v2 → status'

-- Table 2: trp_trips
ALTER TABLE trp_trips RENAME COLUMN status_v2 TO status;
\echo '  ✓ trp_trips: status_v2 → status'

-- Table 3: trp_settlements
ALTER TABLE trp_settlements RENAME COLUMN status_v2 TO status;
\echo '  ✓ trp_settlements: status_v2 → status'

-- Table 4: trp_client_invoices
ALTER TABLE trp_client_invoices RENAME COLUMN status_v2 TO status;
\echo '  ✓ trp_client_invoices: status_v2 → status'

COMMIT;

\echo ''
\echo '✅ ÉTAPE 1C COMPLÉTÉE: 35 colonnes renommées'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- VALIDATION IMMÉDIATE POST-PHASE 1
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  VALIDATION IMMÉDIATE: VÉRIFIER ZÉRO COLONNE _V2 RESTANTE'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT
  table_name,
  column_name,
  '❌ ERREUR: Colonne _v2 encore présente!' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%_v2';

\echo ''
\echo '✓ ATTENDU: 0 lignes (aucune colonne _v2 ne doit apparaître)'
\echo ''

-- Validation automatique avec exception si échec
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name LIKE '%_v2';

  IF v_count > 0 THEN
    RAISE EXCEPTION '❌ PHASE 1 FAILED: % colonnes _v2 encore présentes!', v_count;
  ELSE
    RAISE NOTICE '✅ PHASE 1 VALIDATION: 0 colonnes _v2 restantes';
  END IF;
END $$;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  PHASE 1 COMPLÉTÉE AVEC SUCCÈS ✅'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Résumé:'
\echo '  ✅ 21 index obsolètes supprimés (Étape 1A)'
\echo '  ✅ 22 colonnes V1 supprimées (Étape 1B)'
\echo '  ✅ 35 colonnes _v2 renommées (Étape 1C)'
\echo '  ✅ 0 colonne _v2 restante (Validation)'
\echo ''
\echo '⏭️  Prochaine étape: Phase 2 (Attributs colonnes)'
\echo ''
\echo '⚠️  Si vous êtes sur DB dev/locale:'
\echo '   → Continuez vers Phase 2'
\echo ''
\echo '⚠️  Si vous êtes sur DB Supabase Production:'
\echo '   → Sauvegardez backup post-Phase 1!'
\echo '   → Testez application pour confirmer stabilité'
\echo '   → Continuez seulement si tout fonctionne'
\echo ''
