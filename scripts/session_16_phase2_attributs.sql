-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 16 - PHASE 2: ATTRIBUTS COLONNES (NOT NULL + UNIQUE + DEFAULT)
-- ═══════════════════════════════════════════════════════════════════════════
-- Durée estimée: 20 minutes
-- Risque: MOYEN (vérifications pré-ALTER requises)
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  PHASE 2: ATTRIBUTS COLONNES'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ÉTAPE 2A: ALTER 39 colonnes → SET NOT NULL
\echo '▶ ÉTAPE 2A: SET NOT NULL sur 39 colonnes'

BEGIN;

-- Multi-tenant (7 colonnes)
ALTER TABLE crm_contracts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE dir_car_makes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE dir_car_models ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE dir_maintenance_types ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sch_goal_types ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sch_shift_types ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sch_task_types ALTER COLUMN tenant_id SET NOT NULL;

-- Identifiants business (4 colonnes)
ALTER TABLE dir_car_makes ALTER COLUMN code SET NOT NULL;
ALTER TABLE dir_car_models ALTER COLUMN code SET NOT NULL;
ALTER TABLE dir_platforms ALTER COLUMN code SET NOT NULL;
ALTER TABLE dir_vehicle_classes ALTER COLUMN code SET NOT NULL;

-- Status enum (10 colonnes)
ALTER TABLE crm_opportunities ALTER COLUMN status SET NOT NULL;
ALTER TABLE dir_car_makes ALTER COLUMN status SET NOT NULL;
ALTER TABLE dir_car_models ALTER COLUMN status SET NOT NULL;
ALTER TABLE dir_country_regulations ALTER COLUMN status SET NOT NULL;
ALTER TABLE dir_platforms ALTER COLUMN status SET NOT NULL;
ALTER TABLE dir_vehicle_classes ALTER COLUMN status SET NOT NULL;
ALTER TABLE doc_documents ALTER COLUMN status SET NOT NULL;
ALTER TABLE fin_accounts ALTER COLUMN status SET NOT NULL;
ALTER TABLE fin_toll_transactions ALTER COLUMN status SET NOT NULL;
ALTER TABLE rev_driver_revenues ALTER COLUMN status SET NOT NULL;

-- Timestamps (16 colonnes sur 8 tables)
ALTER TABLE dir_maintenance_types ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE dir_maintenance_types ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE dir_ownership_types ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE dir_ownership_types ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE dir_vehicle_statuses ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE dir_vehicle_statuses ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE flt_vehicle_equipments ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE flt_vehicle_equipments ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE sch_goal_types ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE sch_goal_types ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE sch_locations ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE sch_locations ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE sch_shift_types ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE sch_shift_types ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE sch_task_types ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE sch_task_types ALTER COLUMN updated_at SET NOT NULL;

-- Contacts (2 colonnes)
ALTER TABLE adm_members ALTER COLUMN phone SET NOT NULL;
ALTER TABLE crm_leads ALTER COLUMN phone SET NOT NULL;

COMMIT;

\echo '✅ 39 colonnes NOT NULL appliquées'
\echo ''

-- ÉTAPE 2B: ALTER 16 colonnes → SET DEFAULT
\echo '▶ ÉTAPE 2B: SET DEFAULT sur 16 colonnes'

BEGIN;

ALTER TABLE dir_maintenance_types ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE dir_maintenance_types ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE dir_ownership_types ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE dir_ownership_types ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE dir_vehicle_statuses ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE dir_vehicle_statuses ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE flt_vehicle_equipments ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE flt_vehicle_equipments ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE sch_goal_types ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE sch_goal_types ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE sch_locations ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE sch_locations ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE sch_shift_types ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE sch_shift_types ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE sch_task_types ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE sch_task_types ALTER COLUMN updated_at SET DEFAULT now();

COMMIT;

\echo '✅ 16 DEFAULT appliqués'
\echo ''

-- ÉTAPE 2C: CREATE 8 UNIQUE indexes (CONCURRENTLY hors transaction)
\echo '▶ ÉTAPE 2C: CREATE 8 UNIQUE indexes (CONCURRENTLY)'

CREATE UNIQUE INDEX CONCURRENTLY idx_adm_members_tenant_email_unique
ON adm_members(tenant_id, email) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX CONCURRENTLY idx_rid_drivers_tenant_phone_unique
ON rid_drivers(tenant_id, phone) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX CONCURRENTLY idx_rid_drivers_tenant_email_unique
ON rid_drivers(tenant_id, email) WHERE deleted_at IS NULL AND email IS NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY idx_flt_vehicles_tenant_vin_unique
ON flt_vehicles(tenant_id, vin) WHERE deleted_at IS NULL AND vin IS NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY idx_dir_car_makes_tenant_code_unique
ON dir_car_makes(tenant_id, code) WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY idx_dir_car_models_tenant_code_unique
ON dir_car_models(tenant_id, code) WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY idx_trp_trips_platform_trip_unique
ON trp_trips(platform_account_id, platform_trip_id) WHERE deleted_at IS NULL AND platform_trip_id IS NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY idx_doc_documents_tenant_code_unique
ON doc_documents(tenant_id, document_code) WHERE deleted_at IS NULL AND document_code IS NOT NULL;

\echo '✅ 8 UNIQUE indexes créés'
\echo ''
\echo '✅ PHASE 2 COMPLÉTÉE'
\echo ''
