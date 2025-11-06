-- ============================================================================
-- FLEETCORE V1 → V2 MIGRATION
-- SESSION 12: MODULE TRP (Transport/Rides)
-- ============================================================================
-- Description: Import courses plateformes, settlements, facturation B2B
-- Enums: 7 nouveaux
-- Tables: 6 tables (4 MODIFY V1 + 2 NEW V2)
-- Relations: ADM, DIR, RID, FLT, CRM, REV (FUTURE)
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUMS - Types énumérés Transport (7 enums)
-- ============================================================================

-- ENUM 1/7: platform_account_status - Statut compte plateforme
DO $$ BEGIN
    CREATE TYPE platform_account_status AS ENUM (
        'active',
        'inactive',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 2/7: platform_account_key_type - Type clé API
DO $$ BEGIN
    CREATE TYPE platform_account_key_type AS ENUM (
        'read_only',
        'read_write',
        'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 3/7: trip_status - Statut course
DO $$ BEGIN
    CREATE TYPE trip_status AS ENUM (
        'completed',
        'cancelled',
        'rejected',
        'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 4/7: settlement_type - Type règlement
DO $$ BEGIN
    CREATE TYPE settlement_type AS ENUM (
        'platform_payout',
        'adjustment',
        'refund',
        'bonus'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 5/7: settlement_status - Statut règlement
DO $$ BEGIN
    CREATE TYPE settlement_status AS ENUM (
        'pending',
        'settled',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 6/7: trp_payment_method - Mode paiement (renamed to avoid conflict with BIL module)
DO $$ BEGIN
    CREATE TYPE trp_payment_method AS ENUM (
        'bank_transfer',
        'card',
        'check',
        'cash'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 7/7: trp_invoice_status - Statut facture client B2B (distinct de bil_invoice_status)
DO $$ BEGIN
    CREATE TYPE trp_invoice_status AS ENUM (
        'draft',
        'sent',
        'viewed',
        'partially_paid',
        'paid',
        'disputed',
        'cancelled',
        'overdue'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 2: ALTER TABLE - Extension tables V1 existantes (4 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE 1/4: trp_platform_accounts (MODIFY)
-- V1 → V2 : ? → ? colonnes (estimation selon colonnes V1 existantes)
-- Description: Comptes plateformes avec gestion sécurisée credentials
-- ----------------------------------------------------------------------------
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS platform_id UUID;
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS api_key TEXT; -- DEPRECATED: à migrer vers Vault
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS status_v2 platform_account_status DEFAULT 'active'::platform_account_status; -- V2: status VARCHAR V1 existe → suffix _v2
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ;
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS sync_frequency VARCHAR(50);
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE trp_platform_accounts ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ----------------------------------------------------------------------------
-- TABLE 2/4: trp_trips (MODIFY)
-- V1 → V2 : ? → ? colonnes (estimation)
-- Description: Courses importées avec cycle de vie complet
-- ----------------------------------------------------------------------------
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS platform_account_id UUID;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS driver_id UUID;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS vehicle_id UUID;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS platform_trip_id VARCHAR(255);

-- Timestamps cycle de vie (V2: enrichi requested/matched/accepted/arrived)
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ; -- V1: start_time → started_at
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ; -- V1: end_time → finished_at

-- Géolocalisation
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10, 7);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(10, 7);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS dropoff_lat DECIMAL(10, 7);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS dropoff_lng DECIMAL(10, 7);

-- Métriques course
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS distance DECIMAL(10, 2);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Tarification détaillée
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS base_fare DECIMAL(10, 2);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS distance_fare DECIMAL(10, 2);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS time_fare DECIMAL(10, 2);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS surge_multiplier DECIMAL(4, 2);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS surge_amount DECIMAL(10, 2);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10, 2);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS total_fare DECIMAL(10, 2);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(10, 2);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS net_earnings DECIMAL(10, 2);
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS currency CHAR(3);

ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS status_v2 trip_status; -- V2: status VARCHAR V1 existe → suffix _v2
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE trp_trips ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ----------------------------------------------------------------------------
-- TABLE 3/4: trp_settlements (MODIFY)
-- V1 → V2 : ? → ? colonnes (estimation)
-- Description: Règlements plateformes avec réconciliation et multi-devises
-- ----------------------------------------------------------------------------
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS platform_account_id UUID;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS trip_id UUID;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS settlement_type settlement_type DEFAULT 'platform_payout'::settlement_type;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS platform_settlement_id VARCHAR(255);
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS amount DECIMAL(14, 2);
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS commission DECIMAL(14, 2);
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS net_amount DECIMAL(14, 2);

-- Taxes et multi-devises (V2)
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(14, 2);
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2);
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10, 6);
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS original_currency CHAR(3);
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS original_amount DECIMAL(14, 2);

ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS status_v2 settlement_status DEFAULT 'pending'::settlement_status; -- V2: status VARCHAR V1 existe → suffix _v2
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS settlement_date DATE;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS settlement_reference VARCHAR(255);

-- Réconciliation (V2)
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS reconciled BOOLEAN DEFAULT false;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS reconciliation_id UUID;

ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE trp_settlements ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ----------------------------------------------------------------------------
-- TABLE 4/4: trp_client_invoices (MODIFY)
-- V1 → V2 : ? → ? colonnes (estimation)
-- Description: Factures clients B2B avec suivi paiement détaillé
-- ----------------------------------------------------------------------------
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS invoice_date DATE;
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS due_date DATE;

-- Contexte commercial (V2)
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS pricing_plan_id UUID;
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS client_po_number VARCHAR(100);

-- Montants
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS total_amount DECIMAL(14, 2);
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(14, 2);
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS discount_reason TEXT;
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS currency CHAR(3);

-- Suivi paiement (V2)
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS status_v2 trp_invoice_status DEFAULT 'draft'::trp_invoice_status; -- V2: status VARCHAR V1 existe → suffix _v2
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS payment_method trp_payment_method; -- V2: renamed to avoid conflict with BIL module

ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE trp_client_invoices ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ============================================================================
-- SECTION 3: CREATE TABLE - Nouvelles tables V2 (2 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE 1/2: trp_platform_account_keys (NEW)
-- Description: Gestion multi-clés API avec rotation et expiration
-- Colonnes: 11 colonnes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trp_platform_account_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    key_value TEXT NOT NULL, -- Chiffré
    key_type platform_account_key_type NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    revoke_reason TEXT
);

-- ----------------------------------------------------------------------------
-- TABLE 2/2: trp_client_invoice_lines (NEW)
-- Description: Lignes détail facture pour transparence B2B
-- Colonnes: 11 colonnes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trp_client_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    trip_id UUID,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL,
    tax_rate DECIMAL(5, 2),
    line_amount DECIMAL(14, 2) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECTION 4: FOREIGN KEYS INTERNES - Relations au sein module TRP
-- ============================================================================

-- FK: trp_platform_account_keys → trp_platform_accounts
DO $$ BEGIN
    ALTER TABLE trp_platform_account_keys
    ADD CONSTRAINT fk_platform_account_keys_account
    FOREIGN KEY (account_id)
    REFERENCES trp_platform_accounts(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: trp_trips → trp_platform_accounts
DO $$ BEGIN
    ALTER TABLE trp_trips
    ADD CONSTRAINT fk_trips_platform_account
    FOREIGN KEY (platform_account_id)
    REFERENCES trp_platform_accounts(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: trp_settlements → trp_platform_accounts
DO $$ BEGIN
    ALTER TABLE trp_settlements
    ADD CONSTRAINT fk_settlements_platform_account
    FOREIGN KEY (platform_account_id)
    REFERENCES trp_platform_accounts(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: trp_settlements → trp_trips
DO $$ BEGIN
    ALTER TABLE trp_settlements
    ADD CONSTRAINT fk_settlements_trip
    FOREIGN KEY (trip_id)
    REFERENCES trp_trips(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: trp_client_invoice_lines → trp_client_invoices
DO $$ BEGIN
    ALTER TABLE trp_client_invoice_lines
    ADD CONSTRAINT fk_client_invoice_lines_invoice
    FOREIGN KEY (invoice_id)
    REFERENCES trp_client_invoices(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: trp_client_invoice_lines → trp_trips
DO $$ BEGIN
    ALTER TABLE trp_client_invoice_lines
    ADD CONSTRAINT fk_client_invoice_lines_trip
    FOREIGN KEY (trip_id)
    REFERENCES trp_trips(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 5: FOREIGN KEYS EXTERNES - Relations vers autres modules
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FK vers module ADM (tenant_id pour toutes les tables)
-- ----------------------------------------------------------------------------

-- FK: trp_platform_accounts → adm_tenants
DO $$ BEGIN
    ALTER TABLE trp_platform_accounts
    ADD CONSTRAINT fk_platform_accounts_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: trp_trips → adm_tenants
DO $$ BEGIN
    ALTER TABLE trp_trips
    ADD CONSTRAINT fk_trips_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: trp_settlements → adm_tenants
DO $$ BEGIN
    ALTER TABLE trp_settlements
    ADD CONSTRAINT fk_settlements_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: trp_client_invoices → adm_tenants
DO $$ BEGIN
    ALTER TABLE trp_client_invoices
    ADD CONSTRAINT fk_client_invoices_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- FK vers module DIR (Directory)
-- ----------------------------------------------------------------------------

-- FK: trp_platform_accounts.platform_id → dir_platforms
DO $$ BEGIN
    ALTER TABLE trp_platform_accounts
    ADD CONSTRAINT fk_platform_accounts_platform
    FOREIGN KEY (platform_id)
    REFERENCES dir_platforms(id)
    ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- FK vers module RID (Rideshare Drivers)
-- ----------------------------------------------------------------------------

-- FK: trp_trips.driver_id → rid_drivers
DO $$ BEGIN
    ALTER TABLE trp_trips
    ADD CONSTRAINT fk_trips_driver
    FOREIGN KEY (driver_id)
    REFERENCES rid_drivers(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- FK vers module FLT (Fleet Management)
-- ----------------------------------------------------------------------------

-- FK: trp_trips.vehicle_id → flt_vehicles
DO $$ BEGIN
    ALTER TABLE trp_trips
    ADD CONSTRAINT fk_trips_vehicle
    FOREIGN KEY (vehicle_id)
    REFERENCES flt_vehicles(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- FK vers module CRM (Customer Relationship Management)
-- ⚠️ ATTENTION: Tables crm_clients et crm_pricing_plans n'existent pas dans schema CRM actuel
-- Ces FK sont commentées temporairement jusqu'à création de ces tables
-- ----------------------------------------------------------------------------

-- FK: trp_client_invoices.client_id → crm_clients (COMMENTÉ: table inexistante)
-- DO $$ BEGIN
--     ALTER TABLE trp_client_invoices
--     ADD CONSTRAINT fk_client_invoices_client
--     FOREIGN KEY (client_id)
--     REFERENCES crm_clients(id)
--     ON DELETE RESTRICT;
-- EXCEPTION
--     WHEN duplicate_object THEN NULL;
-- END $$;

-- FK: trp_client_invoices.pricing_plan_id → crm_pricing_plans (COMMENTÉ: table inexistante)
-- DO $$ BEGIN
--     ALTER TABLE trp_client_invoices
--     ADD CONSTRAINT fk_client_invoices_pricing_plan
--     FOREIGN KEY (pricing_plan_id)
--     REFERENCES crm_pricing_plans(id)
--     ON DELETE SET NULL;
-- EXCEPTION
--     WHEN duplicate_object THEN NULL;
-- END $$;

-- ----------------------------------------------------------------------------
-- FK vers module ADM (Users - created_by, updated_by, deleted_by)
-- Note: Relations vers adm_provider_employees
-- ----------------------------------------------------------------------------

-- FK: trp_platform_account_keys → adm_provider_employees (revoked_by)
DO $$ BEGIN
    ALTER TABLE trp_platform_account_keys
    ADD CONSTRAINT fk_platform_account_keys_revoked_by
    FOREIGN KEY (revoked_by)
    REFERENCES adm_provider_employees(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 6: FK FUTURES - Relations vers modules futurs (documentation)
-- ============================================================================

-- ⚠️ FK FUTURES VERS MODULE REV (Revenue Management - pas encore créé)
--
-- FK: trp_settlements.reconciliation_id → rev_reconciliations.id
-- Description: Lien settlement vers réconciliation revenue
-- Type: SET NULL (settlement peut exister sans réconciliation)
--
-- SQL à exécuter après création module REV:
-- DO $$ BEGIN
--     ALTER TABLE trp_settlements
--     ADD CONSTRAINT fk_settlements_reconciliation
--     FOREIGN KEY (reconciliation_id)
--     REFERENCES rev_reconciliations(id)
--     ON DELETE SET NULL;
-- EXCEPTION
--     WHEN duplicate_object THEN NULL;
-- END $$;

-- ============================================================================
-- SECTION 7: INDEXES - Documentation indexes UNIQUE avec soft delete
-- ============================================================================

-- ⚠️ INDEXES CRÉÉS EN SESSION 15 (Après migration données Session 14)
-- Raison: Prisma ne supporte pas WHERE deleted_at IS NULL dans @@unique

-- INDEX 1/3: trp_platform_accounts - unique (tenant_id, platform_id) avec soft delete
-- Référence ligne: 117
-- CREATE UNIQUE INDEX idx_platform_accounts_tenant_platform_unique
-- ON trp_platform_accounts(tenant_id, platform_id)
-- WHERE deleted_at IS NULL;

-- INDEX 2/3: trp_trips - unique (platform_account_id, platform_trip_id) avec soft delete
-- Référence ligne: 214
-- CREATE UNIQUE INDEX idx_trips_platform_trip_unique
-- ON trp_trips(platform_account_id, platform_trip_id)
-- WHERE deleted_at IS NULL;

-- INDEX 3/3: trp_client_invoices - unique (tenant_id, invoice_number) avec soft delete
-- Référence ligne: 328
-- CREATE UNIQUE INDEX idx_client_invoices_number_unique
-- ON trp_client_invoices(tenant_id, invoice_number)
-- WHERE deleted_at IS NULL;

-- Indexes performances (créés automatiquement, pas de WHERE clause)
CREATE INDEX IF NOT EXISTS idx_platform_accounts_status_sync ON trp_platform_accounts(status_v2, last_sync_at);
CREATE INDEX IF NOT EXISTS idx_platform_accounts_error_count ON trp_platform_accounts(error_count);
CREATE INDEX IF NOT EXISTS idx_platform_accounts_deleted ON trp_platform_accounts(deleted_at);

CREATE INDEX IF NOT EXISTS idx_platform_account_keys_account_active ON trp_platform_account_keys(account_id, is_active);
CREATE INDEX IF NOT EXISTS idx_platform_account_keys_expires ON trp_platform_account_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_platform_account_keys_type ON trp_platform_account_keys(key_type);

CREATE INDEX IF NOT EXISTS idx_trips_tenant_status_started ON trp_trips(tenant_id, status_v2, started_at);
CREATE INDEX IF NOT EXISTS idx_trips_driver_status ON trp_trips(driver_id, status_v2);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_started ON trp_trips(vehicle_id, started_at);
CREATE INDEX IF NOT EXISTS idx_trips_requested_finished ON trp_trips(requested_at, finished_at);
CREATE INDEX IF NOT EXISTS idx_trips_status_deleted ON trp_trips(status_v2, deleted_at);

CREATE INDEX IF NOT EXISTS idx_settlements_platform_account_date ON trp_settlements(platform_account_id, settlement_date);
CREATE INDEX IF NOT EXISTS idx_settlements_trip ON trp_settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status_paid ON trp_settlements(status_v2, paid_at);
CREATE INDEX IF NOT EXISTS idx_settlements_platform_settlement_id ON trp_settlements(platform_settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlements_not_reconciled ON trp_settlements(reconciled);
CREATE INDEX IF NOT EXISTS idx_settlements_deleted ON trp_settlements(deleted_at);

CREATE INDEX IF NOT EXISTS idx_client_invoices_client_status_date ON trp_client_invoices(client_id, status_v2, invoice_date);
CREATE INDEX IF NOT EXISTS idx_client_invoices_status_due ON trp_client_invoices(status_v2, due_date);
CREATE INDEX IF NOT EXISTS idx_client_invoices_paid_at ON trp_client_invoices(paid_at);
CREATE INDEX IF NOT EXISTS idx_client_invoices_deleted ON trp_client_invoices(deleted_at);

CREATE INDEX IF NOT EXISTS idx_client_invoice_lines_invoice_line ON trp_client_invoice_lines(invoice_id, line_number);
CREATE INDEX IF NOT EXISTS idx_client_invoice_lines_trip ON trp_client_invoice_lines(trip_id);

-- ============================================================================
-- SECTION 8: GATEWAY 2 - Validation création structures
-- ============================================================================

DO $$
DECLARE
    v_enum_count INTEGER;
    v_table_count INTEGER;
    v_trp_platform_accounts_cols INTEGER;
    v_trp_trips_cols INTEGER;
    v_trp_settlements_cols INTEGER;
    v_trp_client_invoices_cols INTEGER;
    v_fk_count INTEGER;
    v_index_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'GATEWAY 2 - VALIDATION SESSION 12 (TRP)';
    RAISE NOTICE '========================================';

    -- Validation 1: Compter enums TRP
    SELECT COUNT(*) INTO v_enum_count
    FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typtype = 'e'
      AND t.typname IN (
        'platform_account_status', 'platform_account_key_type',
        'trip_status', 'settlement_type', 'settlement_status',
        'trp_payment_method', 'trp_invoice_status'
      );

    RAISE NOTICE 'Enums TRP: % / 7 enums', v_enum_count;
    IF v_enum_count < 7 THEN
        RAISE WARNING 'ATTENTION: Seulement % enums créés sur 7 attendus', v_enum_count;
    END IF;

    -- Validation 2: Compter tables TRP
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'trp_platform_accounts', 'trp_platform_account_keys',
        'trp_trips', 'trp_settlements',
        'trp_client_invoices', 'trp_client_invoice_lines'
      );

    RAISE NOTICE 'Tables TRP: % / 6 tables', v_table_count;
    IF v_table_count < 6 THEN
        RAISE WARNING 'ATTENTION: Seulement % tables créées sur 6 attendues', v_table_count;
    END IF;

    -- Validation 3: Vérifier colonnes tables modifiées
    SELECT COUNT(*) INTO v_trp_platform_accounts_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trp_platform_accounts';
    RAISE NOTICE 'trp_platform_accounts: % colonnes', v_trp_platform_accounts_cols;

    SELECT COUNT(*) INTO v_trp_trips_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trp_trips';
    RAISE NOTICE 'trp_trips: % colonnes', v_trp_trips_cols;

    SELECT COUNT(*) INTO v_trp_settlements_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trp_settlements';
    RAISE NOTICE 'trp_settlements: % colonnes', v_trp_settlements_cols;

    SELECT COUNT(*) INTO v_trp_client_invoices_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trp_client_invoices';
    RAISE NOTICE 'trp_client_invoices: % colonnes', v_trp_client_invoices_cols;

    -- Validation 4: Compter foreign keys TRP
    SELECT COUNT(*) INTO v_fk_count
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND constraint_type = 'FOREIGN KEY'
      AND table_name LIKE 'trp_%';

    RAISE NOTICE 'Foreign Keys TRP: % FK créées', v_fk_count;

    -- Validation 5: Compter indexes TRP
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename LIKE 'trp_%';

    RAISE NOTICE 'Indexes TRP: % indexes créés', v_index_count;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ GATEWAY 2 COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
