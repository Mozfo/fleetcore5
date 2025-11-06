-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 16 - ROLLBACK PROCEDURES (PAR PHASE)
-- ═══════════════════════════════════════════════════════════════════════════
-- Permet de revenir en arrière si une phase échoue
-- Usage: psql -f session_16_ROLLBACK.sql --var phase=X
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

\echo ''
\echo '⚠️⚠️⚠️ AVERTISSEMENT: ROLLBACK SESSION 16 ⚠️⚠️⚠️'
\echo ''
\echo 'Ce script annule les modifications dune phase spécifique.'
\echo 'IMPORTANT: Vérifier backup avant dexécuter!'
\echo ''

-- Déterminer quelle phase annuler
\if :{?phase}
  \echo 'Rollback Phase': :phase
\else
  \echo 'ERREUR: Variable phase non définie!'
  \echo 'Usage: psql -f session_16_ROLLBACK.sql --var phase=X'
  \q
\endif

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK PHASE 1: CLEANUP _v2
-- ═══════════════════════════════════════════════════════════════════════════

\if :phase = 1
  \echo ''
  \echo '═══════════════════════════════════════════════════════════════'
  \echo '  ROLLBACK PHASE 1: Restaurer colonnes V1 + _v2'
  \echo '═══════════════════════════════════════════════════════════════'
  \echo ''
  \echo '⚠️  STRATÉGIE: Restore depuis backup recommandé!'
  \echo '    Alternative: Recréer colonnes manuellement (risqué)'
  \echo ''

  \prompt 'Voulez-vous continuer le rollback manuel? (yes/no): ' continue_choice

  \if :'continue_choice' = 'yes'
    \echo ''
    \echo '▶ ÉTAPE 1: RENAME colonnes finales → _v2 (inverse de Phase 1C)'
    \echo ''

    BEGIN;

    -- BIL (10 colonnes)
    ALTER TABLE bil_billing_plans RENAME COLUMN status TO status_v2;
    ALTER TABLE bil_billing_plans RENAME COLUMN billing_cycle TO billing_cycle_v2;
    ALTER TABLE bil_billing_plans RENAME COLUMN plan_type TO plan_type_v2;
    ALTER TABLE bil_payment_methods RENAME COLUMN payment_type TO payment_type_v2;
    ALTER TABLE bil_payment_methods RENAME COLUMN status TO status_v2;
    ALTER TABLE bil_payment_transactions RENAME COLUMN status TO status_v2;

    -- SUP (6 colonnes)
    ALTER TABLE sup_tickets RENAME COLUMN status TO status_v2;
    ALTER TABLE sup_tickets RENAME COLUMN priority TO priority_v2;
    ALTER TABLE sup_tickets RENAME COLUMN category TO category_v2;
    ALTER TABLE sup_customer_feedback RENAME COLUMN status TO status_v2;
    ALTER TABLE sup_customer_feedback RENAME COLUMN feedback_type TO feedback_type_v2;
    ALTER TABLE sup_customer_feedback RENAME COLUMN submitter_type TO submitter_type_v2;

    -- RID (8 colonnes)
    ALTER TABLE rid_drivers RENAME COLUMN driver_status TO driver_status_v2;
    ALTER TABLE rid_driver_documents RENAME COLUMN document_type TO document_type_v2;
    ALTER TABLE rid_driver_documents RENAME COLUMN status TO status_v2;
    ALTER TABLE rid_driver_cooperation_terms RENAME COLUMN status TO status_v2;
    ALTER TABLE rid_driver_requests RENAME COLUMN status TO status_v2;
    ALTER TABLE rid_driver_performances RENAME COLUMN metric_type TO metric_type_v2;
    ALTER TABLE rid_driver_blacklists RENAME COLUMN status TO status_v2;
    ALTER TABLE rid_driver_training RENAME COLUMN status TO status_v2;

    -- SCH (6 colonnes)
    ALTER TABLE sch_shifts RENAME COLUMN status TO status_v2;
    ALTER TABLE sch_tasks RENAME COLUMN status TO status_v2;
    ALTER TABLE sch_tasks RENAME COLUMN category TO category_v2;
    ALTER TABLE sch_tasks RENAME COLUMN priority TO priority_v2;
    ALTER TABLE sch_shifts RENAME COLUMN shift_type TO shift_type_v2;
    ALTER TABLE sch_tasks RENAME COLUMN task_type TO task_type_v2;

    -- TRP (4 colonnes)
    ALTER TABLE trp_trips RENAME COLUMN status TO status_v2;
    ALTER TABLE trp_settlements RENAME COLUMN status TO status_v2;
    ALTER TABLE trp_settlements RENAME COLUMN settlement_type TO settlement_type_v2;
    ALTER TABLE trp_trips RENAME COLUMN trip_type TO trip_type_v2;

    COMMIT;

    \echo '  ✓ 34 colonnes renommées → _v2'
    \echo ''

    \echo '▶ ÉTAPE 2: Recréer 22 colonnes V1 (vides)'
    \echo '   ⚠️  ATTENTION: Données perdues! Restaurer depuis backup requis!'
    \echo ''

    BEGIN;

    -- BIL (5 colonnes)
    ALTER TABLE bil_billing_plans ADD COLUMN status TEXT;
    ALTER TABLE bil_billing_plans ADD COLUMN billing_cycle TEXT;
    ALTER TABLE bil_billing_plans ADD COLUMN plan_type TEXT;
    ALTER TABLE bil_payment_methods ADD COLUMN payment_type TEXT;
    ALTER TABLE bil_payment_methods ADD COLUMN status TEXT;

    -- SUP (3 colonnes)
    ALTER TABLE sup_tickets ADD COLUMN status TEXT;
    ALTER TABLE sup_tickets ADD COLUMN priority TEXT;
    ALTER TABLE sup_customer_feedback ADD COLUMN submitter_type TEXT;

    -- RID (7 colonnes)
    ALTER TABLE rid_drivers ADD COLUMN driver_status TEXT;
    ALTER TABLE rid_driver_documents ADD COLUMN document_type TEXT;
    ALTER TABLE rid_driver_documents ADD COLUMN status TEXT;
    ALTER TABLE rid_driver_cooperation_terms ADD COLUMN status TEXT;
    ALTER TABLE rid_driver_requests ADD COLUMN status TEXT;
    ALTER TABLE rid_driver_blacklists ADD COLUMN status TEXT;
    ALTER TABLE rid_driver_training ADD COLUMN status TEXT;

    -- SCH (4 colonnes)
    ALTER TABLE sch_shifts ADD COLUMN status TEXT;
    ALTER TABLE sch_tasks ADD COLUMN status TEXT;
    ALTER TABLE sch_tasks ADD COLUMN category TEXT;
    ALTER TABLE sch_tasks ADD COLUMN priority TEXT;

    -- TRP (3 colonnes)
    ALTER TABLE trp_trips ADD COLUMN status TEXT;
    ALTER TABLE trp_settlements ADD COLUMN status TEXT;
    ALTER TABLE trp_settlements ADD COLUMN settlement_type TEXT;

    COMMIT;

    \echo '  ✓ 22 colonnes V1 recréées (VIDES)'
    \echo ''

    \echo '▶ ÉTAPE 3: Recréer 21 index obsolètes (optionnel)'
    \echo '   Exécuter si nécessaire pour compatibilité V1'
    \echo ''

    \echo ''
    \echo '❌ ROLLBACK PHASE 1 COMPLÉTÉ (PARTIEL)'
    \echo ''
    \echo '⚠️  ACTION REQUISE: Restaurer données depuis backup!'
    \echo '   pg_restore backup_session_16_pre_*.dump'
    \echo ''
  \else
    \echo ''
    \echo '❌ Rollback annulé. Restaurer depuis backup:'
    \echo '   pg_restore backup_session_16_pre_*.dump'
    \echo ''
  \endif
\endif

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK PHASE 2: ATTRIBUTS
-- ═══════════════════════════════════════════════════════════════════════════

\if :phase = 2
  \echo ''
  \echo '═══════════════════════════════════════════════════════════════'
  \echo '  ROLLBACK PHASE 2: Annuler NOT NULL + DEFAULT + UNIQUE'
  \echo '═══════════════════════════════════════════════════════════════'
  \echo ''

  \echo '▶ ÉTAPE 1: DROP 8 UNIQUE indexes'
  \echo ''

  DROP INDEX CONCURRENTLY IF EXISTS idx_adm_members_tenant_email_unique;
  DROP INDEX CONCURRENTLY IF EXISTS idx_rid_drivers_tenant_phone_unique;
  DROP INDEX CONCURRENTLY IF EXISTS idx_rid_drivers_tenant_email_unique;
  DROP INDEX CONCURRENTLY IF EXISTS idx_flt_vehicles_tenant_vin_unique;
  DROP INDEX CONCURRENTLY IF EXISTS idx_dir_car_makes_tenant_code_unique;
  DROP INDEX CONCURRENTLY IF EXISTS idx_dir_car_models_tenant_code_unique;
  DROP INDEX CONCURRENTLY IF EXISTS idx_trp_trips_platform_trip_unique;
  DROP INDEX CONCURRENTLY IF EXISTS idx_doc_documents_tenant_code_unique;

  \echo '  ✓ 8 UNIQUE indexes supprimés'
  \echo ''

  \echo '▶ ÉTAPE 2: DROP DEFAULT sur 16 colonnes'
  \echo ''

  BEGIN;

  ALTER TABLE dir_maintenance_types ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE dir_maintenance_types ALTER COLUMN updated_at DROP DEFAULT;
  ALTER TABLE dir_ownership_types ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE dir_ownership_types ALTER COLUMN updated_at DROP DEFAULT;
  ALTER TABLE dir_vehicle_statuses ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE dir_vehicle_statuses ALTER COLUMN updated_at DROP DEFAULT;
  ALTER TABLE flt_vehicle_equipments ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE flt_vehicle_equipments ALTER COLUMN updated_at DROP DEFAULT;
  ALTER TABLE sch_goal_types ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE sch_goal_types ALTER COLUMN updated_at DROP DEFAULT;
  ALTER TABLE sch_locations ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE sch_locations ALTER COLUMN updated_at DROP DEFAULT;
  ALTER TABLE sch_shift_types ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE sch_shift_types ALTER COLUMN updated_at DROP DEFAULT;
  ALTER TABLE sch_task_types ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE sch_task_types ALTER COLUMN updated_at DROP DEFAULT;

  COMMIT;

  \echo '  ✓ 16 DEFAULT supprimés'
  \echo ''

  \echo '▶ ÉTAPE 3: DROP NOT NULL sur 39 colonnes'
  \echo ''

  BEGIN;

  -- Multi-tenant (7 colonnes)
  ALTER TABLE crm_contracts ALTER COLUMN tenant_id DROP NOT NULL;
  ALTER TABLE dir_car_makes ALTER COLUMN tenant_id DROP NOT NULL;
  ALTER TABLE dir_car_models ALTER COLUMN tenant_id DROP NOT NULL;
  ALTER TABLE dir_maintenance_types ALTER COLUMN tenant_id DROP NOT NULL;
  ALTER TABLE sch_goal_types ALTER COLUMN tenant_id DROP NOT NULL;
  ALTER TABLE sch_shift_types ALTER COLUMN tenant_id DROP NOT NULL;
  ALTER TABLE sch_task_types ALTER COLUMN tenant_id DROP NOT NULL;

  -- Identifiants business (4 colonnes)
  ALTER TABLE dir_car_makes ALTER COLUMN code DROP NOT NULL;
  ALTER TABLE dir_car_models ALTER COLUMN code DROP NOT NULL;
  ALTER TABLE dir_platforms ALTER COLUMN code DROP NOT NULL;
  ALTER TABLE dir_vehicle_classes ALTER COLUMN code DROP NOT NULL;

  -- Status enum (10 colonnes)
  ALTER TABLE crm_opportunities ALTER COLUMN status DROP NOT NULL;
  ALTER TABLE dir_car_makes ALTER COLUMN status DROP NOT NULL;
  ALTER TABLE dir_car_models ALTER COLUMN status DROP NOT NULL;
  ALTER TABLE dir_country_regulations ALTER COLUMN status DROP NOT NULL;
  ALTER TABLE dir_platforms ALTER COLUMN status DROP NOT NULL;
  ALTER TABLE dir_vehicle_classes ALTER COLUMN status DROP NOT NULL;
  ALTER TABLE doc_documents ALTER COLUMN status DROP NOT NULL;
  ALTER TABLE fin_accounts ALTER COLUMN status DROP NOT NULL;
  ALTER TABLE fin_toll_transactions ALTER COLUMN status DROP NOT NULL;
  ALTER TABLE rev_driver_revenues ALTER COLUMN status DROP NOT NULL;

  -- Timestamps (16 colonnes)
  ALTER TABLE dir_maintenance_types ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE dir_maintenance_types ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE dir_ownership_types ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE dir_ownership_types ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE dir_vehicle_statuses ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE dir_vehicle_statuses ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE flt_vehicle_equipments ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE flt_vehicle_equipments ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE sch_goal_types ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE sch_goal_types ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE sch_locations ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE sch_locations ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE sch_shift_types ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE sch_shift_types ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE sch_task_types ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE sch_task_types ALTER COLUMN updated_at DROP NOT NULL;

  -- Contacts (2 colonnes)
  ALTER TABLE adm_members ALTER COLUMN phone DROP NOT NULL;
  ALTER TABLE crm_leads ALTER COLUMN phone DROP NOT NULL;

  COMMIT;

  \echo '  ✓ 39 NOT NULL supprimés'
  \echo ''

  \echo ''
  \echo '✅ ROLLBACK PHASE 2 COMPLÉTÉ'
  \echo ''
\endif

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK PHASE 3: INDEX PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════

\if :phase = 3
  \echo ''
  \echo '═══════════════════════════════════════════════════════════════'
  \echo '  ROLLBACK PHASE 3: Supprimer 25 index performance'
  \echo '═══════════════════════════════════════════════════════════════'
  \echo ''

  \echo '▶ GROUPE A: Supprimer 15 index FK'
  \echo ''

  DROP INDEX CONCURRENTLY IF EXISTS idx_crm_contracts_opportunity_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_crm_contracts_billing_address_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_crm_opportunities_lead_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_crm_opportunities_pipeline_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_doc_documents_entity_type;
  DROP INDEX CONCURRENTLY IF EXISTS idx_flt_vehicle_events_vehicle_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_flt_vehicle_maintenance_vehicle_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_flt_vehicle_expenses_vehicle_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_flt_vehicle_insurances_vehicle_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_rid_driver_documents_driver_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_rid_driver_training_driver_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_rid_driver_blacklists_driver_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_trp_trips_driver_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_trp_trips_vehicle_id;
  DROP INDEX CONCURRENTLY IF EXISTS idx_trp_settlements_driver_id;

  \echo '  ✓ 15 index FK supprimés'
  \echo ''

  \echo '▶ GROUPE B: Supprimer 10 index colonnes filtrées'
  \echo ''

  DROP INDEX CONCURRENTLY IF EXISTS idx_adm_members_tenant_status;
  DROP INDEX CONCURRENTLY IF EXISTS idx_rid_drivers_tenant_status;
  DROP INDEX CONCURRENTLY IF EXISTS idx_flt_vehicles_tenant_status;
  DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_tenant_status;
  DROP INDEX CONCURRENTLY IF EXISTS idx_trp_trips_created_at_desc;
  DROP INDEX CONCURRENTLY IF EXISTS idx_fin_toll_transactions_date_desc;
  DROP INDEX CONCURRENTLY IF EXISTS idx_fin_traffic_fines_issued_desc;
  DROP INDEX CONCURRENTLY IF EXISTS idx_doc_documents_entity;
  DROP INDEX CONCURRENTLY IF EXISTS idx_sch_tasks_assigned;
  DROP INDEX CONCURRENTLY IF EXISTS idx_sup_tickets_assigned;

  \echo '  ✓ 10 index colonnes filtrées supprimés'
  \echo ''

  \echo ''
  \echo '✅ ROLLBACK PHASE 3 COMPLÉTÉ'
  \echo '   25 index performance supprimés'
  \echo ''
\endif

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK PHASE 4: RELATIONS
-- ═══════════════════════════════════════════════════════════════════════════

\if :phase = 4
  \echo ''
  \echo '═══════════════════════════════════════════════════════════════'
  \echo '  ROLLBACK PHASE 4: Supprimer FK + Triggers'
  \echo '═══════════════════════════════════════════════════════════════'
  \echo ''

  \echo '▶ ÉTAPE 1: DROP Foreign Key'
  \echo ''

  ALTER TABLE crm_contracts DROP CONSTRAINT IF EXISTS fk_crm_contracts_lead;

  \echo '  ✓ FK supprimée'
  \echo ''

  \echo '▶ ÉTAPE 2: DROP 9 Triggers updated_at'
  \echo ''

  DROP TRIGGER IF EXISTS set_updated_at_dir_maintenance_types ON dir_maintenance_types;
  DROP TRIGGER IF EXISTS set_updated_at_dir_ownership_types ON dir_ownership_types;
  DROP TRIGGER IF EXISTS set_updated_at_dir_vehicle_statuses ON dir_vehicle_statuses;
  DROP TRIGGER IF EXISTS set_updated_at_flt_vehicle_equipments ON flt_vehicle_equipments;
  DROP TRIGGER IF EXISTS set_updated_at_sch_goal_types ON sch_goal_types;
  DROP TRIGGER IF EXISTS set_updated_at_sch_locations ON sch_locations;
  DROP TRIGGER IF EXISTS set_updated_at_sch_shift_types ON sch_shift_types;
  DROP TRIGGER IF EXISTS set_updated_at_sch_task_types ON sch_task_types;
  DROP TRIGGER IF EXISTS set_updated_at_rid_driver_performances ON rid_driver_performances;

  \echo '  ✓ 9 triggers supprimés'
  \echo ''

  \echo ''
  \echo '✅ ROLLBACK PHASE 4 COMPLÉTÉ'
  \echo ''
\endif

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK COMPLET (RESTORE BACKUP)
-- ═══════════════════════════════════════════════════════════════════════════

\if :phase = 0
  \echo ''
  \echo '═══════════════════════════════════════════════════════════════'
  \echo '  ROLLBACK COMPLET: Restauration depuis backup'
  \echo '═══════════════════════════════════════════════════════════════'
  \echo ''
  \echo '⚠️  ATTENTION: Cette opération va ÉCRASER toute la base!'
  \echo ''
  \echo 'Fichier backup: backup_session_16_pre_YYYYMMDD_HHMMSS.dump'
  \echo ''
  \echo 'Commande manuelle requise:'
  \echo '  pg_restore --clean --if-exists \\'
  \echo '    -d DATABASE_URL \\'
  \echo '    backup_session_16_pre_*.dump'
  \echo ''
  \echo '❌ Ce script ne peut pas exécuter pg_restore automatiquement'
  \echo '   (connexion psql différente de pg_restore)'
  \echo ''
\endif

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  FIN ROLLBACK SESSION 16'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
