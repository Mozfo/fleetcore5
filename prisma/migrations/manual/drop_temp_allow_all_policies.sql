-- ============================================================================
-- SPRINT 2: SUPPRESSION POLICIES RLS REDONDANTES (42 tables)
-- ============================================================================
-- Date: 2025-11-23
-- Issue: Multiple permissive policies = faille de sécurité multi-tenant
-- Risk: temp_allow_all (qual=true) court-circuite tenant_isolation
-- Backup: prisma/migrations/_backups/backup_supabase_complete_20251123_022902.dump
--
-- CRITICAL: Ce script supprime 42 policies temp_allow_all
-- VALIDATION: tenant_isolation policies DOIVENT exister avant exécution
-- ROLLBACK: rollback_temp_allow_all_policies.sql
-- ============================================================================

-- ============================================================================
-- MODULE ADM (4 tables) - Administration & Tenants
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_adm_member_roles ON public.adm_member_roles;
DROP POLICY IF EXISTS temp_allow_all_adm_members ON public.adm_members;
DROP POLICY IF EXISTS temp_allow_all_adm_roles ON public.adm_roles;
DROP POLICY IF EXISTS temp_allow_all_adm_tenant_lifecycle_events ON public.adm_tenant_lifecycle_events;

-- ============================================================================
-- MODULE BIL (4 tables) - Billing & Subscriptions
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_bil_payment_methods ON public.bil_payment_methods;
DROP POLICY IF EXISTS temp_allow_all_bil_tenant_invoices ON public.bil_tenant_invoices;
DROP POLICY IF EXISTS temp_allow_all_bil_tenant_subscriptions ON public.bil_tenant_subscriptions;
DROP POLICY IF EXISTS temp_allow_all_bil_tenant_usage_metrics ON public.bil_tenant_usage_metrics;

-- ============================================================================
-- MODULE DOC (1 table) - Documents
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_doc_documents ON public.doc_documents;

-- ============================================================================
-- MODULE FIN (6 tables) - Finance & Transactions
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_fin_accounts ON public.fin_accounts;
DROP POLICY IF EXISTS temp_allow_all_fin_driver_payment_batches ON public.fin_driver_payment_batches;
DROP POLICY IF EXISTS temp_allow_all_fin_driver_payments ON public.fin_driver_payments;
DROP POLICY IF EXISTS temp_allow_all_fin_toll_transactions ON public.fin_toll_transactions;
DROP POLICY IF EXISTS temp_allow_all_fin_traffic_fines ON public.fin_traffic_fines;
DROP POLICY IF EXISTS temp_allow_all_fin_transactions ON public.fin_transactions;

-- ============================================================================
-- MODULE FLT (6 tables) - Fleet Management
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_flt_vehicle_assignments ON public.flt_vehicle_assignments;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicle_events ON public.flt_vehicle_events;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicle_expenses ON public.flt_vehicle_expenses;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicle_insurances ON public.flt_vehicle_insurances;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicle_maintenance ON public.flt_vehicle_maintenance;
DROP POLICY IF EXISTS temp_allow_all_flt_vehicles ON public.flt_vehicles;

-- ============================================================================
-- MODULE REV (3 tables) - Revenue & Reconciliation
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_rev_driver_revenues ON public.rev_driver_revenues;
DROP POLICY IF EXISTS temp_allow_all_rev_reconciliations ON public.rev_reconciliations;
DROP POLICY IF EXISTS temp_allow_all_rev_revenue_imports ON public.rev_revenue_imports;

-- ============================================================================
-- MODULE RID (7 tables) - Ride-hailing Drivers
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_rid_driver_blacklists ON public.rid_driver_blacklists;
DROP POLICY IF EXISTS temp_allow_all_rid_driver_cooperation_terms ON public.rid_driver_cooperation_terms;
DROP POLICY IF EXISTS temp_allow_all_rid_driver_documents ON public.rid_driver_documents;
DROP POLICY IF EXISTS temp_allow_all_rid_driver_performances ON public.rid_driver_performances;
DROP POLICY IF EXISTS temp_allow_all_rid_driver_requests ON public.rid_driver_requests;
DROP POLICY IF EXISTS temp_allow_all_rid_driver_training ON public.rid_driver_training;
DROP POLICY IF EXISTS temp_allow_all_rid_drivers ON public.rid_drivers;

-- ============================================================================
-- MODULE SCH (4 tables) - Scheduling
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_sch_goals ON public.sch_goals;
DROP POLICY IF EXISTS temp_allow_all_sch_maintenance_schedules ON public.sch_maintenance_schedules;
DROP POLICY IF EXISTS temp_allow_all_sch_shifts ON public.sch_shifts;
DROP POLICY IF EXISTS temp_allow_all_sch_tasks ON public.sch_tasks;

-- ============================================================================
-- MODULE SUP (3 tables) - Support & Tickets
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_sup_customer_feedback ON public.sup_customer_feedback;
DROP POLICY IF EXISTS temp_allow_all_sup_ticket_messages ON public.sup_ticket_messages;
DROP POLICY IF EXISTS temp_allow_all_sup_tickets ON public.sup_tickets;

-- ============================================================================
-- MODULE TRP (4 tables) - Trips & Transportation
-- ============================================================================
DROP POLICY IF EXISTS temp_allow_all_trp_client_invoices ON public.trp_client_invoices;
DROP POLICY IF EXISTS temp_allow_all_trp_platform_accounts ON public.trp_platform_accounts;
DROP POLICY IF EXISTS temp_allow_all_trp_settlements ON public.trp_settlements;
DROP POLICY IF EXISTS temp_allow_all_trp_trips ON public.trp_trips;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- Summary:
-- - 42 policies temp_allow_all supprimées
-- - Modules: ADM(4), BIL(4), DOC(1), FIN(6), FLT(6), REV(3), RID(7), SCH(4), SUP(3), TRP(4)
-- - Tables EXCLUES: dir_car_makes, dir_car_models (pattern shared catalog)
--
-- Next steps:
-- 1. Exécuter dans Supabase SQL Editor
-- 2. Vérifier avec verify_policies_removed.sql
-- 3. Tester isolation tenant (voir test_tenant_isolation.sql)
-- 4. En cas d'erreur: exécuter rollback_temp_allow_all_policies.sql
-- ============================================================================
