-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 16 - PHASE 3: INDEX PERFORMANCE (25 INDEX)
-- ═══════════════════════════════════════════════════════════════════════════
-- Durée estimée: 60 minutes (CONCURRENTLY, non-bloquant)
-- Risque: FAIBLE
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  PHASE 3: INDEX PERFORMANCE (25 INDEX)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '⏱️  Durée estimée: 60 minutes'
\echo '📝 Tous les index créés CONCURRENTLY (non-bloquant)'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- GROUPE A: INDEX FK (15 index)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '▶ GROUPE A: Index FK (15 index)'
\echo '   Justification: Accélérer JOIN et CASCADE'
\echo ''

-- CRM (4 index)
\echo '  Module CRM (4 index)'
CREATE INDEX CONCURRENTLY idx_crm_contracts_opportunity_id
ON crm_contracts(opportunity_id) WHERE deleted_at IS NULL;
\echo '    ✓ crm_contracts.opportunity_id'

CREATE INDEX CONCURRENTLY idx_crm_contracts_billing_address_id
ON crm_contracts(billing_address_id) WHERE deleted_at IS NULL;
\echo '    ✓ crm_contracts.billing_address_id'

CREATE INDEX CONCURRENTLY idx_crm_opportunities_lead_id
ON crm_opportunities(lead_id) WHERE deleted_at IS NULL;
\echo '    ✓ crm_opportunities.lead_id'

CREATE INDEX CONCURRENTLY idx_crm_opportunities_pipeline_id
ON crm_opportunities(pipeline_id) WHERE deleted_at IS NULL;
\echo '    ✓ crm_opportunities.pipeline_id'

-- DOC (1 index)
\echo '  Module DOC (1 index)'
CREATE INDEX CONCURRENTLY idx_doc_documents_entity_type
ON doc_documents(entity_type) WHERE deleted_at IS NULL;
\echo '    ✓ doc_documents.entity_type'

-- FLT (4 index)
\echo '  Module FLT (4 index)'
CREATE INDEX CONCURRENTLY idx_flt_vehicle_events_vehicle_id
ON flt_vehicle_events(vehicle_id) WHERE deleted_at IS NULL;
\echo '    ✓ flt_vehicle_events.vehicle_id'

CREATE INDEX CONCURRENTLY idx_flt_vehicle_maintenance_vehicle_id
ON flt_vehicle_maintenance(vehicle_id) WHERE deleted_at IS NULL;
\echo '    ✓ flt_vehicle_maintenance.vehicle_id'

CREATE INDEX CONCURRENTLY idx_flt_vehicle_expenses_vehicle_id
ON flt_vehicle_expenses(vehicle_id) WHERE deleted_at IS NULL;
\echo '    ✓ flt_vehicle_expenses.vehicle_id'

CREATE INDEX CONCURRENTLY idx_flt_vehicle_insurances_vehicle_id
ON flt_vehicle_insurances(vehicle_id) WHERE deleted_at IS NULL;
\echo '    ✓ flt_vehicle_insurances.vehicle_id'

-- RID (3 index)
\echo '  Module RID (3 index)'
CREATE INDEX CONCURRENTLY idx_rid_driver_documents_driver_id
ON rid_driver_documents(driver_id) WHERE deleted_at IS NULL;
\echo '    ✓ rid_driver_documents.driver_id'

CREATE INDEX CONCURRENTLY idx_rid_driver_training_driver_id
ON rid_driver_training(driver_id) WHERE deleted_at IS NULL;
\echo '    ✓ rid_driver_training.driver_id'

CREATE INDEX CONCURRENTLY idx_rid_driver_blacklists_driver_id
ON rid_driver_blacklists(driver_id) WHERE deleted_at IS NULL;
\echo '    ✓ rid_driver_blacklists.driver_id'

-- TRP (3 index)
\echo '  Module TRP (3 index)'
CREATE INDEX CONCURRENTLY idx_trp_trips_driver_id
ON trp_trips(driver_id) WHERE deleted_at IS NULL;
\echo '    ✓ trp_trips.driver_id'

CREATE INDEX CONCURRENTLY idx_trp_trips_vehicle_id
ON trp_trips(vehicle_id) WHERE deleted_at IS NULL;
\echo '    ✓ trp_trips.vehicle_id'

CREATE INDEX CONCURRENTLY idx_trp_settlements_driver_id
ON trp_settlements(driver_id) WHERE deleted_at IS NULL;
\echo '    ✓ trp_settlements.driver_id'

\echo ''
\echo '✅ GROUPE A: 15 index FK créés'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- GROUPE B: INDEX COLONNES FILTRÉES (10 index)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '▶ GROUPE B: Index colonnes filtrées (10 index)'
\echo '   Justification: Accélérer requêtes courantes (status, dates, filtres)'
\echo ''

-- Filtrage par tenant + status (4 index)
\echo '  Filtrage tenant + status (4 index)'
CREATE INDEX CONCURRENTLY idx_adm_members_tenant_status
ON adm_members(tenant_id, status) WHERE deleted_at IS NULL;
\echo '    ✓ adm_members(tenant_id, status)'

CREATE INDEX CONCURRENTLY idx_rid_drivers_tenant_status
ON rid_drivers(tenant_id, driver_status) WHERE deleted_at IS NULL;
\echo '    ✓ rid_drivers(tenant_id, driver_status)'

CREATE INDEX CONCURRENTLY idx_flt_vehicles_tenant_status
ON flt_vehicles(tenant_id, status) WHERE deleted_at IS NULL;
\echo '    ✓ flt_vehicles(tenant_id, status)'

CREATE INDEX CONCURRENTLY idx_crm_leads_tenant_status
ON crm_leads(tenant_id, status) WHERE deleted_at IS NULL;
\echo '    ✓ crm_leads(tenant_id, status)'

-- Tri chronologique (3 index)
\echo '  Tri chronologique DESC (3 index)'
CREATE INDEX CONCURRENTLY idx_trp_trips_created_at_desc
ON trp_trips(created_at DESC) WHERE deleted_at IS NULL;
\echo '    ✓ trp_trips(created_at DESC)'

CREATE INDEX CONCURRENTLY idx_fin_toll_transactions_date_desc
ON fin_toll_transactions(transaction_date DESC) WHERE deleted_at IS NULL;
\echo '    ✓ fin_toll_transactions(transaction_date DESC)'

CREATE INDEX CONCURRENTLY idx_fin_traffic_fines_issued_desc
ON fin_traffic_fines(issued_at DESC) WHERE deleted_at IS NULL;
\echo '    ✓ fin_traffic_fines(issued_at DESC)'

-- Index composites métier (3 index)
\echo '  Index composites métier (3 index)'
CREATE INDEX CONCURRENTLY idx_doc_documents_entity
ON doc_documents(tenant_id, entity_type, entity_id) WHERE deleted_at IS NULL;
\echo '    ✓ doc_documents(tenant_id, entity_type, entity_id)'

CREATE INDEX CONCURRENTLY idx_sch_tasks_assigned
ON sch_tasks(tenant_id, assigned_to, status) WHERE deleted_at IS NULL;
\echo '    ✓ sch_tasks(tenant_id, assigned_to, status)'

CREATE INDEX CONCURRENTLY idx_sup_tickets_assigned
ON sup_tickets(tenant_id, assigned_to, status) WHERE deleted_at IS NULL;
\echo '    ✓ sup_tickets(tenant_id, assigned_to, status)'

\echo ''
\echo '✅ GROUPE B: 10 index colonnes filtrées créés'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- RÉSUMÉ PHASE 3
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  PHASE 3 COMPLÉTÉE AVEC SUCCÈS ✅'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Résumé:'
\echo '  ✅ 15 index FK créés (Groupe A)'
\echo '  ✅ 10 index colonnes filtrées créés (Groupe B)'
\echo '  ✅ TOTAL: 25 index performance'
\echo ''
\echo '  ℹ️  Tous créés CONCURRENTLY (non-bloquant)'
\echo '  ℹ️  Tous avec WHERE deleted_at IS NULL (soft delete)'
\echo ''
\echo '⏭️  Prochaine étape: Phase 4 (Relations FK + Triggers)'
\echo ''
