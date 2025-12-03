-- ============================================================================
-- VÉRIFICATION: Policies temp_allow_all supprimées (42 tables)
-- ============================================================================
-- Purpose: Vérifier que toutes les policies temp_allow_all ont été supprimées
-- Expected: 0 lignes retournées
-- ============================================================================

-- Vérifier qu'il ne reste AUCUNE policy temp_allow_all sur les 42 tables critiques
SELECT
  tablename,
  policyname,
  '❌ POLICY ENCORE PRÉSENTE!' AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    -- Module ADM (4)
    'adm_member_roles', 'adm_members', 'adm_roles', 'adm_tenant_lifecycle_events',

    -- Module BIL (4)
    'bil_payment_methods', 'bil_tenant_invoices', 'bil_tenant_subscriptions', 'bil_tenant_usage_metrics',

    -- Module DOC (1)
    'doc_documents',

    -- Module FIN (6)
    'fin_accounts', 'fin_driver_payment_batches', 'fin_driver_payments',
    'fin_toll_transactions', 'fin_traffic_fines', 'fin_transactions',

    -- Module FLT (6)
    'flt_vehicle_assignments', 'flt_vehicle_events', 'flt_vehicle_expenses',
    'flt_vehicle_insurances', 'flt_vehicle_maintenance', 'flt_vehicles',

    -- Module REV (3)
    'rev_driver_revenues', 'rev_reconciliations', 'rev_revenue_imports',

    -- Module RID (7)
    'rid_driver_blacklists', 'rid_driver_cooperation_terms', 'rid_driver_documents',
    'rid_driver_performances', 'rid_driver_requests', 'rid_driver_training', 'rid_drivers',

    -- Module SCH (4)
    'sch_goals', 'sch_maintenance_schedules', 'sch_shifts', 'sch_tasks',

    -- Module SUP (3)
    'sup_customer_feedback', 'sup_ticket_messages', 'sup_tickets',

    -- Module TRP (4)
    'trp_client_invoices', 'trp_platform_accounts', 'trp_settlements', 'trp_trips'
  )
  AND policyname LIKE 'temp_allow_all_%'
ORDER BY tablename;

-- ============================================================================
-- Résultat attendu: 0 lignes
-- Si des lignes apparaissent → relancer drop_temp_allow_all_policies.sql
-- ============================================================================
