-- ============================================================================
-- ROLLBACK SPRINT 2: RESTAURATION POLICIES temp_allow_all (42 tables)
-- ============================================================================
-- Date: 2025-11-23
-- Purpose: Restaurer les policies temp_allow_all supprimées en cas de problème
-- Usage: Exécuter ce script si drop_temp_allow_all_policies.sql cause des erreurs
--
-- ATTENTION: Ce script RÉINTRODUIT la faille de sécurité multi-tenant
-- À n'utiliser QUE comme rollback d'urgence
-- ============================================================================

-- ============================================================================
-- MODULE ADM (4 tables) - Administration & Tenants
-- ============================================================================
CREATE POLICY temp_allow_all_adm_member_roles ON public.adm_member_roles
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_adm_members ON public.adm_members
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_adm_roles ON public.adm_roles
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_adm_tenant_lifecycle_events ON public.adm_tenant_lifecycle_events
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- MODULE BIL (4 tables) - Billing & Subscriptions
-- ============================================================================
CREATE POLICY temp_allow_all_bil_payment_methods ON public.bil_payment_methods
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_bil_tenant_invoices ON public.bil_tenant_invoices
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_bil_tenant_subscriptions ON public.bil_tenant_subscriptions
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_bil_tenant_usage_metrics ON public.bil_tenant_usage_metrics
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- MODULE DOC (1 table) - Documents
-- ============================================================================
CREATE POLICY temp_allow_all_doc_documents ON public.doc_documents
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- MODULE FIN (6 tables) - Finance & Transactions
-- ============================================================================
CREATE POLICY temp_allow_all_fin_accounts ON public.fin_accounts
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_fin_driver_payment_batches ON public.fin_driver_payment_batches
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_fin_driver_payments ON public.fin_driver_payments
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_fin_toll_transactions ON public.fin_toll_transactions
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_fin_traffic_fines ON public.fin_traffic_fines
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_fin_transactions ON public.fin_transactions
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- MODULE FLT (6 tables) - Fleet Management
-- ============================================================================
CREATE POLICY temp_allow_all_flt_vehicle_assignments ON public.flt_vehicle_assignments
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_flt_vehicle_events ON public.flt_vehicle_events
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_flt_vehicle_expenses ON public.flt_vehicle_expenses
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_flt_vehicle_insurances ON public.flt_vehicle_insurances
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_flt_vehicle_maintenance ON public.flt_vehicle_maintenance
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_flt_vehicles ON public.flt_vehicles
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- MODULE REV (3 tables) - Revenue & Reconciliation
-- ============================================================================
CREATE POLICY temp_allow_all_rev_driver_revenues ON public.rev_driver_revenues
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_rev_reconciliations ON public.rev_reconciliations
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_rev_revenue_imports ON public.rev_revenue_imports
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- MODULE RID (7 tables) - Ride-hailing Drivers
-- ============================================================================
CREATE POLICY temp_allow_all_rid_driver_blacklists ON public.rid_driver_blacklists
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_rid_driver_cooperation_terms ON public.rid_driver_cooperation_terms
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_rid_driver_documents ON public.rid_driver_documents
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_rid_driver_performances ON public.rid_driver_performances
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_rid_driver_requests ON public.rid_driver_requests
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_rid_driver_training ON public.rid_driver_training
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_rid_drivers ON public.rid_drivers
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- MODULE SCH (4 tables) - Scheduling
-- ============================================================================
CREATE POLICY temp_allow_all_sch_goals ON public.sch_goals
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_sch_maintenance_schedules ON public.sch_maintenance_schedules
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_sch_shifts ON public.sch_shifts
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_sch_tasks ON public.sch_tasks
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- MODULE SUP (3 tables) - Support & Tickets
-- ============================================================================
CREATE POLICY temp_allow_all_sup_customer_feedback ON public.sup_customer_feedback
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_sup_ticket_messages ON public.sup_ticket_messages
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_sup_tickets ON public.sup_tickets
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- MODULE TRP (4 tables) - Trips & Transportation
-- ============================================================================
CREATE POLICY temp_allow_all_trp_client_invoices ON public.trp_client_invoices
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_trp_platform_accounts ON public.trp_platform_accounts
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_trp_settlements ON public.trp_settlements
FOR ALL TO authenticated USING (true);

CREATE POLICY temp_allow_all_trp_trips ON public.trp_trips
FOR ALL TO authenticated USING (true);

-- ============================================================================
-- END OF ROLLBACK SCRIPT
-- ============================================================================
-- Summary:
-- - 42 policies temp_allow_all restaurées
-- - ⚠️  FAILLE DE SÉCURITÉ RÉINTRODUITE (isolation tenant désactivée)
-- - À utiliser UNIQUEMENT en cas de problème critique
-- - Après rollback: investiguer la cause et corriger avant de redéployer
-- ============================================================================
