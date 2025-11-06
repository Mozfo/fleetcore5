-- ============================================================================
-- FLEETCORE - SCHEMA CLEANUP POUR ARCHITECTURE RATIONALISÉE
-- ============================================================================
-- Date: 9 Octobre 2025
-- Objectif: Passer de 55 à 42 tables (suppression de 13 tables non-MVP)
-- Base: ARCHITECTURE_RATIONALISEE.md
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SUPPRESSION BILLING (5 tables) → Externalisé vers Stripe
-- ============================================================================

DROP TABLE IF EXISTS bil_tenant_invoice_lines CASCADE;
DROP TABLE IF EXISTS bil_tenant_invoices CASCADE;
DROP TABLE IF EXISTS bil_payment_methods CASCADE;
DROP TABLE IF EXISTS bil_tenant_subscriptions CASCADE;
DROP TABLE IF EXISTS bil_billing_plans CASCADE;

-- Commentaire: bil_tenant_usage_metrics est CONSERVÉE pour calculer l'usage

-- ============================================================================
-- 2. SUPPRESSION SUPPORT (3 tables) → Externalisé vers Chatwoot
-- ============================================================================

DROP TABLE IF EXISTS sup_customer_feedback CASCADE;
DROP TABLE IF EXISTS sup_ticket_messages CASCADE;
DROP TABLE IF EXISTS sup_tickets CASCADE;

-- Note: Créer sup_ticket_mapping pour lien avec Chatwoot (à faire plus tard)

-- ============================================================================
-- 3. SUPPRESSION SCHEDULE (4 tables) → Reporté Phase 2
-- ============================================================================

DROP TABLE IF EXISTS sch_tasks CASCADE;
DROP TABLE IF EXISTS sch_goals CASCADE;
DROP TABLE IF EXISTS sch_maintenance_schedules CASCADE;
DROP TABLE IF EXISTS sch_shifts CASCADE;

-- ============================================================================
-- 4. SUPPRESSION FLT redondantes (3 tables) → Event sourcing via flt_vehicle_events
-- ============================================================================

DROP TABLE IF EXISTS flt_vehicle_insurances CASCADE;
DROP TABLE IF EXISTS flt_vehicle_expenses CASCADE;
DROP TABLE IF EXISTS flt_vehicle_maintenance CASCADE;

-- Note: Les données seront migrées vers flt_vehicle_events avec event_type approprié

-- ============================================================================
-- 5. SUPPRESSION RID redondantes (2 tables)
-- ============================================================================

DROP TABLE IF EXISTS rid_driver_training CASCADE;
-- Note: Peut être géré via metadata JSONB ou flt_vehicle_events

DROP TABLE IF EXISTS rid_driver_documents CASCADE;
-- Note: Migrer vers doc_documents avec entity_type='driver'

-- ============================================================================
-- 6. VÉRIFICATION FINALE
-- ============================================================================

-- Compter les tables restantes (devrait être 42)
SELECT
    COUNT(*) as total_tables,
    'Expected: 42 tables in MVP schema' as note
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE '_prisma%';

-- Afficher la liste des tables par domaine
SELECT
  CASE
    WHEN tablename LIKE 'adm_%' THEN 'ADM'
    WHEN tablename LIKE 'crm_%' THEN 'CRM'
    WHEN tablename LIKE 'dir_%' THEN 'DIR'
    WHEN tablename LIKE 'doc_%' THEN 'DOC'
    WHEN tablename LIKE 'flt_%' THEN 'FLT'
    WHEN tablename LIKE 'rid_%' THEN 'RID'
    WHEN tablename LIKE 'trp_%' THEN 'TRP'
    WHEN tablename LIKE 'fin_%' THEN 'FIN'
    WHEN tablename LIKE 'rev_%' THEN 'REV'
    WHEN tablename LIKE 'bil_%' THEN 'BIL'
  END as domain,
  COUNT(*) as table_count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE '_prisma%'
GROUP BY domain
ORDER BY domain;

COMMIT;

-- ============================================================================
-- RÉSULTAT ATTENDU:
-- ============================================================================
-- ADM: 7 tables
-- CRM: 3 tables
-- DIR: 5 tables
-- DOC: 1 table
-- FLT: 3 tables (vehicles, assignments, events)
-- RID: 5 tables (drivers, cooperation_terms, requests, performances, blacklists)
-- TRP: 4 tables (platform_accounts, trips, settlements, client_invoices)
-- FIN: 6 tables (accounts, transactions, payment_batches, payments, toll_transactions, traffic_fines)
-- REV: 3 tables (revenue_imports, driver_revenues, reconciliations)
-- BIL: 1 table (tenant_usage_metrics)
-- ============================================================================
-- TOTAL: 42 tables MVP
-- ============================================================================
