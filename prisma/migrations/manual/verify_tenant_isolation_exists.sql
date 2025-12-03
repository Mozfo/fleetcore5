-- ============================================================================
-- VÉRIFICATION: Policies tenant_isolation présentes (42+ lignes attendues)
-- ============================================================================
-- Purpose: Vérifier que les policies tenant_isolation existent toujours
-- Expected: 42+ lignes (une par table minimum, parfois plusieurs policies par table)
-- ============================================================================

-- Compter les policies tenant_isolation sur les 42 tables
WITH tenant_policies AS (
  SELECT
    tablename,
    policyname,
    cmd,
    '✅' AS status
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
    AND policyname LIKE 'tenant_isolation_%'
)
SELECT
  COUNT(*) AS total_tenant_policies,
  CASE
    WHEN COUNT(*) >= 42 THEN '✅ OK - Toutes les policies tenant_isolation présentes'
    ELSE '❌ ERREUR - Policies manquantes! Attendu: >= 42, Trouvé: ' || COUNT(*)
  END AS validation
FROM tenant_policies;

-- Détail par table
SELECT
  tablename,
  COUNT(*) AS policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'adm_member_roles', 'adm_members', 'adm_roles', 'adm_tenant_lifecycle_events',
    'bil_payment_methods', 'bil_tenant_invoices', 'bil_tenant_subscriptions', 'bil_tenant_usage_metrics',
    'doc_documents',
    'fin_accounts', 'fin_driver_payment_batches', 'fin_driver_payments',
    'fin_toll_transactions', 'fin_traffic_fines', 'fin_transactions',
    'flt_vehicle_assignments', 'flt_vehicle_events', 'flt_vehicle_expenses',
    'flt_vehicle_insurances', 'flt_vehicle_maintenance', 'flt_vehicles',
    'rev_driver_revenues', 'rev_reconciliations', 'rev_revenue_imports',
    'rid_driver_blacklists', 'rid_driver_cooperation_terms', 'rid_driver_documents',
    'rid_driver_performances', 'rid_driver_requests', 'rid_driver_training', 'rid_drivers',
    'sch_goals', 'sch_maintenance_schedules', 'sch_shifts', 'sch_tasks',
    'sup_customer_feedback', 'sup_ticket_messages', 'sup_tickets',
    'trp_client_invoices', 'trp_platform_accounts', 'trp_settlements', 'trp_trips'
  )
  AND policyname LIKE 'tenant_isolation_%'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- Résultat attendu:
-- - total_tenant_policies >= 42
-- - Chaque table doit avoir au moins 1 policy tenant_isolation
-- ============================================================================
