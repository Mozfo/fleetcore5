-- ============================================================================
-- SESSION 99: INDEXES OPTIMISATION
-- ============================================================================
-- Date: 2025-11-04
-- Prérequis: Sessions 01-13 complétées (102 tables, 550 FK)
-- Objectif: Créer indexes performances (BTREE, UNIQUE, GIN)
-- ============================================================================

-- VÉRIFICATION PRÉREQUIS
DO $
DECLARE
  v_tables INT;
  v_fk INT;
BEGIN
  SELECT COUNT(*) INTO v_tables FROM information_schema.tables WHERE table_schema='public';
  SELECT COUNT(*) INTO v_fk FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='public';

  IF v_tables < 101 THEN RAISE EXCEPTION 'Tables insuffisantes: %', v_tables; END IF;
  IF v_fk < 550 THEN RAISE EXCEPTION 'FK insuffisantes: %', v_fk; END IF;

  RAISE NOTICE '✅ Prérequis: % tables, % FK', v_tables, v_fk;
END $;

-- ============================================================================
-- SECTION 1: INDEXES TENANT_ID (CRITIQUE - TOUTES TABLES)
-- ============================================================================

\echo '=== INDEXES tenant_id ==='

-- ADM
CREATE INDEX IF NOT EXISTS idx_adm_members_tenant ON adm_members(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_adm_roles_tenant ON adm_roles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_tenant ON adm_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_adm_provider_employees_tenant ON adm_provider_employees(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_adm_invitations_tenant ON adm_invitations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_adm_member_sessions_tenant ON adm_member_sessions(tenant_id);

-- CRM
CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant ON crm_leads(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_customers_tenant ON crm_customers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contracts_tenant ON crm_contracts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_tenant ON crm_opportunities(tenant_id) WHERE deleted_at IS NULL;

-- BIL
CREATE INDEX IF NOT EXISTS idx_bil_invoices_tenant ON bil_invoices(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_payments_tenant ON bil_payments(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_tenant_subscriptions_tenant ON bil_tenant_subscriptions(tenant_id) WHERE deleted_at IS NULL;

-- SUP
CREATE INDEX IF NOT EXISTS idx_sup_tickets_tenant ON sup_tickets(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sup_ticket_messages_tenant ON sup_ticket_messages(tenant_id);

-- RID
CREATE INDEX IF NOT EXISTS idx_rid_drivers_tenant ON rid_drivers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rid_driver_documents_tenant ON rid_driver_documents(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rid_driver_performances_tenant ON rid_driver_performances(tenant_id);

-- FLT
CREATE INDEX IF NOT EXISTS idx_flt_vehicles_tenant ON flt_vehicles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_assignments_tenant ON flt_vehicle_assignments(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_maintenances_tenant ON flt_vehicle_maintenances(tenant_id) WHERE deleted_at IS NULL;

-- SCH
CREATE INDEX IF NOT EXISTS idx_sch_shifts_tenant ON sch_shifts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sch_goals_tenant ON sch_goals(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sch_tasks_tenant ON sch_tasks(tenant_id) WHERE deleted_at IS NULL;

-- TRP
CREATE INDEX IF NOT EXISTS idx_trp_trips_tenant ON trp_trips(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trp_settlements_tenant ON trp_settlements(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trp_platform_accounts_tenant ON trp_platform_accounts(tenant_id) WHERE deleted_at IS NULL;

-- FIN
CREATE INDEX IF NOT EXISTS idx_fin_accounts_tenant ON fin_accounts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fin_transactions_tenant ON fin_transactions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fin_driver_payments_tenant ON fin_driver_payments(tenant_id) WHERE deleted_at IS NULL;

\echo '✅ Indexes tenant_id créés'

-- ============================================================================
-- SECTION 2: INDEXES FK (PERFORMANCES JOINTURES)
-- ============================================================================

\echo '=== INDEXES FK ==='

-- ADM
CREATE INDEX IF NOT EXISTS idx_adm_members_role ON adm_members(default_role_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_adm_member_roles_member ON adm_member_roles(member_id);
CREATE INDEX IF NOT EXISTS idx_adm_member_roles_role ON adm_member_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_performed_by ON adm_audit_logs(performed_by);

-- CRM
CREATE INDEX IF NOT EXISTS idx_crm_contracts_customer ON crm_contracts(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_lead ON crm_opportunities(lead_id) WHERE deleted_at IS NULL;

-- BIL
CREATE INDEX IF NOT EXISTS idx_bil_invoices_customer ON bil_invoices(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_payments_invoice ON bil_payments(invoice_id) WHERE deleted_at IS NULL;

-- SUP
CREATE INDEX IF NOT EXISTS idx_sup_tickets_customer ON sup_tickets(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sup_ticket_messages_ticket ON sup_ticket_messages(ticket_id);

-- RID
CREATE INDEX IF NOT EXISTS idx_rid_driver_documents_driver ON rid_driver_documents(driver_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rid_driver_performances_driver ON rid_driver_performances(driver_id);

-- FLT
CREATE INDEX IF NOT EXISTS idx_flt_vehicles_owner ON flt_vehicles(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_assignments_vehicle ON flt_vehicle_assignments(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_assignments_driver ON flt_vehicle_assignments(driver_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_maintenances_vehicle ON flt_vehicle_maintenances(vehicle_id) WHERE deleted_at IS NULL;

-- SCH
CREATE INDEX IF NOT EXISTS idx_sch_shifts_driver ON sch_shifts(driver_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sch_shifts_vehicle ON sch_shifts(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sch_goals_driver ON sch_goals(driver_id) WHERE deleted_at IS NULL;

-- TRP
CREATE INDEX IF NOT EXISTS idx_trp_trips_driver ON trp_trips(driver_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trp_trips_vehicle ON trp_trips(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trp_settlements_driver ON trp_settlements(driver_id) WHERE deleted_at IS NULL;

-- FIN
CREATE INDEX IF NOT EXISTS idx_fin_transactions_account ON fin_transactions(account_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fin_driver_payments_driver ON fin_driver_payments(driver_id) WHERE deleted_at IS NULL;

\echo '✅ Indexes FK créés'

-- ============================================================================
-- SECTION 3: INDEXES UNIQUE (SOFT DELETE)
-- ============================================================================

\echo '=== INDEXES UNIQUE ==='

-- ADM
CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_members_tenant_email ON adm_members(tenant_id, email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_roles_tenant_name ON adm_roles(tenant_id, name) WHERE deleted_at IS NULL;

-- CRM
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_leads_tenant_email ON crm_leads(tenant_id, email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_customers_tenant_email ON crm_customers(tenant_id, email) WHERE deleted_at IS NULL;

-- BIL
CREATE UNIQUE INDEX IF NOT EXISTS idx_bil_invoices_tenant_number ON bil_invoices(tenant_id, invoice_number) WHERE deleted_at IS NULL;

-- RID
CREATE UNIQUE INDEX IF NOT EXISTS idx_rid_drivers_tenant_license ON rid_drivers(tenant_id, license_number) WHERE deleted_at IS NULL;

-- FLT
CREATE UNIQUE INDEX IF NOT EXISTS idx_flt_vehicles_tenant_plate ON flt_vehicles(tenant_id, plate_number) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_flt_vehicles_vin ON flt_vehicles(vin) WHERE deleted_at IS NULL;

-- DIR (globaux sans tenant_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dir_car_makes_code ON dir_car_makes(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dir_car_models_make_code ON dir_car_models(make_id, code);

\echo '✅ Indexes UNIQUE créés'

-- ============================================================================
-- SECTION 4: INDEXES GIN (JSONB)
-- ============================================================================

\echo '=== INDEXES GIN (JSONB) ==='

-- ADM
CREATE INDEX IF NOT EXISTS idx_adm_tenants_metadata ON adm_tenants USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_adm_members_metadata ON adm_members USING GIN(metadata);

-- CRM
CREATE INDEX IF NOT EXISTS idx_crm_leads_metadata ON crm_leads USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_crm_customers_metadata ON crm_customers USING GIN(metadata);

-- BIL
CREATE INDEX IF NOT EXISTS idx_bil_invoices_metadata ON bil_invoices USING GIN(metadata);

-- RID
CREATE INDEX IF NOT EXISTS idx_rid_drivers_metadata ON rid_drivers USING GIN(metadata);

-- FLT
CREATE INDEX IF NOT EXISTS idx_flt_vehicles_metadata ON flt_vehicles USING GIN(metadata);

-- SCH
CREATE INDEX IF NOT EXISTS idx_sch_shifts_metadata ON sch_shifts USING GIN(metadata);

-- TRP
CREATE INDEX IF NOT EXISTS idx_trp_trips_metadata ON trp_trips USING GIN(metadata);

-- FIN
CREATE INDEX IF NOT EXISTS idx_fin_accounts_metadata ON fin_accounts USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_fin_transactions_metadata ON fin_transactions USING GIN(metadata);

\echo '✅ Indexes GIN créés'

-- ============================================================================
-- SECTION 5: INDEXES MÉTIER (RECHERCHE/TRI)
-- ============================================================================

\echo '=== INDEXES MÉTIER ==='

-- ADM
CREATE INDEX IF NOT EXISTS idx_adm_members_email ON adm_members(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_timestamp ON adm_audit_logs(timestamp DESC);

-- CRM
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contracts_start_date ON crm_contracts(start_date DESC);

-- BIL
CREATE INDEX IF NOT EXISTS idx_bil_invoices_status ON bil_invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_invoices_issue_date ON bil_invoices(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_bil_invoices_due_date ON bil_invoices(due_date);

-- SUP
CREATE INDEX IF NOT EXISTS idx_sup_tickets_status ON sup_tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sup_tickets_priority ON sup_tickets(priority) WHERE deleted_at IS NULL;

-- RID
CREATE INDEX IF NOT EXISTS idx_rid_drivers_license ON rid_drivers(license_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rid_drivers_status ON rid_drivers(onboarding_status) WHERE deleted_at IS NULL;

-- FLT
CREATE INDEX IF NOT EXISTS idx_flt_vehicles_plate ON flt_vehicles(plate_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_flt_vehicles_status ON flt_vehicles(status) WHERE deleted_at IS NULL;

-- SCH
CREATE INDEX IF NOT EXISTS idx_sch_shifts_start_time ON sch_shifts(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sch_shifts_status ON sch_shifts(status) WHERE deleted_at IS NULL;

-- TRP
CREATE INDEX IF NOT EXISTS idx_trp_trips_reference ON trp_trips(trip_reference) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trp_trips_start_time ON trp_trips(trip_start_time DESC);

-- FIN
CREATE INDEX IF NOT EXISTS idx_fin_transactions_date ON fin_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_driver_payments_date ON fin_driver_payments(payment_date DESC);

\echo '✅ Indexes MÉTIER créés'

-- ============================================================================
-- VALIDATION FINALE
-- ============================================================================
DO $
DECLARE
  v_indexes_final INT;
  v_indexes_added INT;
  v_indexes_initial INT := (SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public');
BEGIN
  SELECT COUNT(*) INTO v_indexes_final FROM pg_indexes WHERE schemaname='public';
  v_indexes_added := v_indexes_final - v_indexes_initial;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SESSION 99: INDEXES COMPLÉTÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Indexes avant: %', v_indexes_initial;
  RAISE NOTICE 'Indexes ajoutés: %', v_indexes_added;
  RAISE NOTICE 'Indexes après: %', v_indexes_final;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ GATEWAY 2 COMPLETED';
  RAISE NOTICE '========================================';
END $;

-- ============================================================================
