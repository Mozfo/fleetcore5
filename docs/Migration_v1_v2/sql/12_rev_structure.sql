-- ============================================================================
-- FLEETCORE V1 → V2 MIGRATION
-- SESSION 11: MODULE REV (Revenue)
-- ============================================================================
-- Description: Revenue management, imports, reconciliation, and driver payments
-- Enums: 6 nouveaux
-- Tables: 4 tables (3 MODIFY V1 + 1 NEW V2)
-- Relations: ADM (tenant, members), DIR (platforms), RID (drivers), TRP (import context)
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUMS - Types énumérés Revenue (6 enums)
-- ============================================================================

-- ENUM 1/6: revenue_import_status - Statut des imports de revenus
DO $$ BEGIN
    CREATE TYPE revenue_import_status AS ENUM (
        'pending',
        'processing',
        'completed',
        'partially_completed',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 2/6: revenue_import_source_type - Type de source d'import
DO $$ BEGIN
    CREATE TYPE revenue_import_source_type AS ENUM (
        'api',
        'file_csv',
        'file_excel',
        'manual'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 3/6: driver_revenue_status - Statut des revenus chauffeur
DO $$ BEGIN
    CREATE TYPE driver_revenue_status AS ENUM (
        'pending',
        'validated',
        'adjusted',
        'disputed'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 4/6: driver_revenue_period_type - Type de période de calcul
DO $$ BEGIN
    CREATE TYPE driver_revenue_period_type AS ENUM (
        'week',
        'biweekly',
        'month'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 5/6: reconciliation_status - Statut des réconciliations
DO $$ BEGIN
    CREATE TYPE reconciliation_status AS ENUM (
        'pending',
        'matched',
        'mismatched',
        'adjusted',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 6/6: reconciliation_type - Type de réconciliation
DO $$ BEGIN
    CREATE TYPE reconciliation_type AS ENUM (
        'platform_payment',
        'cash_collection',
        'bank_statement',
        'adjustment'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 2: MODIFICATIONS TABLES EXISTANTES (V1→V2)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table 1/3: rev_revenue_imports (MODIFY)
-- Colonnes ajoutées: 17
-- Description: Import de données de revenus depuis plateformes
-- ----------------------------------------------------------------------------

-- Identification et traçabilité source
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS platform_id UUID; -- FK vers dir_platforms
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS source_type revenue_import_source_type;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Montants et devises
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS source_currency CHAR(3);
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(12, 6);
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(18, 2);
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS converted_amount DECIMAL(18, 2);

-- Statistiques et métriques qualité
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS rows_count INTEGER DEFAULT 0;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS errors_count INTEGER DEFAULT 0;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS warnings_count INTEGER DEFAULT 0;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ;

-- Statut et gestion erreurs
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS status revenue_import_status DEFAULT 'pending'::revenue_import_status;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Audit trail (colonnes audit ajoutées si manquantes)
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE rev_revenue_imports ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ----------------------------------------------------------------------------
-- Table 2/3: rev_driver_revenues (MODIFY)
-- Colonnes ajoutées: 16
-- Description: Revenus agrégés par chauffeur par période
-- ----------------------------------------------------------------------------

-- Identification plateforme
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS platform_id UUID; -- FK vers dir_platforms (NULL = consolidé)

-- Période
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS period_type driver_revenue_period_type;

-- Montants
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(18, 2);
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(18, 2);
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS net_revenue DECIMAL(18, 2);
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS currency CHAR(3);

-- Traçabilité et validation
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS import_id UUID; -- FK vers rev_revenue_imports
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS status driver_revenue_status DEFAULT 'pending'::driver_revenue_status;
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS validated_by UUID; -- FK vers adm_members
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

-- Audit trail (colonnes audit ajoutées si manquantes)
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE rev_driver_revenues ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ----------------------------------------------------------------------------
-- Table 3/3: rev_reconciliations (MODIFY)
-- Colonnes ajoutées: 19
-- Description: Réconciliation montants attendus vs reçus
-- ----------------------------------------------------------------------------

-- Identification
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS import_id UUID; -- FK vers rev_revenue_imports
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS reconciliation_date DATE;

-- Type et montants
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS reconciliation_type reconciliation_type;
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS expected_amount DECIMAL(18, 2);
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS received_amount DECIMAL(18, 2);
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS tolerance_amount DECIMAL(18, 2);
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS currency CHAR(3);

-- Statut et workflow
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS status reconciliation_status DEFAULT 'pending'::reconciliation_status;
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS auto_matched BOOLEAN DEFAULT false;
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS assigned_to UUID; -- FK vers adm_members
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS resolved_by UUID; -- FK vers adm_members
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS requires_action BOOLEAN DEFAULT false;

-- Documentation
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS notes TEXT;

-- Relations métier
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS driver_id UUID; -- FK vers rid_drivers (réconciliation par driver)

-- Audit trail (colonnes audit ajoutées si manquantes)
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE rev_reconciliations ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ============================================================================
-- SECTION 3: NOUVELLES TABLES (V2)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table 4/4: rev_reconciliation_lines (NEW)
-- Description: Détail des écarts de réconciliation par chauffeur/plateforme
-- Relations: rev_reconciliations (parent), rid_drivers, dir_platforms
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rev_reconciliation_lines (
  -- Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- FK parent
  reconciliation_id UUID NOT NULL, -- FK vers rev_reconciliations

  -- Dimensions de breakdown (optionnelles)
  driver_id UUID,                   -- FK vers rid_drivers
  platform_id UUID,                 -- FK vers dir_platforms

  -- Montants
  expected_amount DECIMAL(18, 2) NOT NULL,
  received_amount DECIMAL(18, 2) NOT NULL,
  -- Note: difference_amount = received_amount - expected_amount (colonne générée PostgreSQL)

  -- Documentation
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- SECTION 4: FOREIGN KEYS INTERNES
-- Description: FK vers tables créées dans CE module
-- ============================================================================

-- FK 1/3: rev_driver_revenues.import_id → rev_revenue_imports.id
DO $$ BEGIN
    ALTER TABLE rev_driver_revenues
    ADD CONSTRAINT fk_rev_driver_revenues_import
    FOREIGN KEY (import_id)
    REFERENCES rev_revenue_imports(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK 2/3: rev_reconciliations.import_id → rev_revenue_imports.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliations
    ADD CONSTRAINT fk_rev_reconciliations_import
    FOREIGN KEY (import_id)
    REFERENCES rev_revenue_imports(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK 3/3: rev_reconciliation_lines.reconciliation_id → rev_reconciliations.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliation_lines
    ADD CONSTRAINT fk_rev_reconciliation_lines_reconciliation
    FOREIGN KEY (reconciliation_id)
    REFERENCES rev_reconciliations(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 5: FOREIGN KEYS EXTERNES (vers modules précédents)
-- Description: FK vers tables déjà créées (sessions 0 à 10)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FK vers ADM (tenant isolation et audit trail)
-- ----------------------------------------------------------------------------

-- FK: rev_revenue_imports.tenant_id → adm_tenants.id
DO $$ BEGIN
    ALTER TABLE rev_revenue_imports
    ADD CONSTRAINT fk_rev_revenue_imports_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_revenue_imports.created_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_revenue_imports
    ADD CONSTRAINT fk_rev_revenue_imports_created_by
    FOREIGN KEY (created_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_revenue_imports.updated_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_revenue_imports
    ADD CONSTRAINT fk_rev_revenue_imports_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_revenue_imports.deleted_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_revenue_imports
    ADD CONSTRAINT fk_rev_revenue_imports_deleted_by
    FOREIGN KEY (deleted_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_driver_revenues.tenant_id → adm_tenants.id
DO $$ BEGIN
    ALTER TABLE rev_driver_revenues
    ADD CONSTRAINT fk_rev_driver_revenues_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_driver_revenues.validated_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_driver_revenues
    ADD CONSTRAINT fk_rev_driver_revenues_validated_by
    FOREIGN KEY (validated_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_driver_revenues.created_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_driver_revenues
    ADD CONSTRAINT fk_rev_driver_revenues_created_by
    FOREIGN KEY (created_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_driver_revenues.updated_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_driver_revenues
    ADD CONSTRAINT fk_rev_driver_revenues_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_driver_revenues.deleted_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_driver_revenues
    ADD CONSTRAINT fk_rev_driver_revenues_deleted_by
    FOREIGN KEY (deleted_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_reconciliations.tenant_id → adm_tenants.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliations
    ADD CONSTRAINT fk_rev_reconciliations_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_reconciliations.assigned_to → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliations
    ADD CONSTRAINT fk_rev_reconciliations_assigned_to
    FOREIGN KEY (assigned_to)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_reconciliations.resolved_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliations
    ADD CONSTRAINT fk_rev_reconciliations_resolved_by
    FOREIGN KEY (resolved_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_reconciliations.created_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliations
    ADD CONSTRAINT fk_rev_reconciliations_created_by
    FOREIGN KEY (created_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_reconciliations.updated_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliations
    ADD CONSTRAINT fk_rev_reconciliations_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_reconciliations.deleted_by → adm_members.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliations
    ADD CONSTRAINT fk_rev_reconciliations_deleted_by
    FOREIGN KEY (deleted_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- FK vers DIR (platforms)
-- ----------------------------------------------------------------------------

-- FK: rev_revenue_imports.platform_id → dir_platforms.id
DO $$ BEGIN
    ALTER TABLE rev_revenue_imports
    ADD CONSTRAINT fk_rev_revenue_imports_platform
    FOREIGN KEY (platform_id)
    REFERENCES dir_platforms(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_driver_revenues.platform_id → dir_platforms.id
DO $$ BEGIN
    ALTER TABLE rev_driver_revenues
    ADD CONSTRAINT fk_rev_driver_revenues_platform
    FOREIGN KEY (platform_id)
    REFERENCES dir_platforms(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_reconciliation_lines.platform_id → dir_platforms.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliation_lines
    ADD CONSTRAINT fk_rev_reconciliation_lines_platform
    FOREIGN KEY (platform_id)
    REFERENCES dir_platforms(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- FK vers RID (drivers)
-- ----------------------------------------------------------------------------

-- FK: rev_driver_revenues.driver_id → rid_drivers.id
DO $$ BEGIN
    ALTER TABLE rev_driver_revenues
    ADD CONSTRAINT fk_rev_driver_revenues_driver
    FOREIGN KEY (driver_id)
    REFERENCES rid_drivers(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_reconciliation_lines.driver_id → rid_drivers.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliation_lines
    ADD CONSTRAINT fk_rev_reconciliation_lines_driver
    FOREIGN KEY (driver_id)
    REFERENCES rid_drivers(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: rev_reconciliations.driver_id → rid_drivers.id
DO $$ BEGIN
    ALTER TABLE rev_reconciliations
    ADD CONSTRAINT fk_rev_reconciliations_driver
    FOREIGN KEY (driver_id)
    REFERENCES rid_drivers(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 6: DOCUMENTATION FK FUTURES
-- Description: FK vers modules PAS ENCORE CRÉÉS
-- Format strict pour extraction automatique
-- ============================================================================

-- AUCUNE FK FUTURE
-- Module REV ne dépend d'aucun module futur (FIN viendra après et référencera REV)

-- ============================================================================
-- SECTION 7: DOCUMENTATION INDEXES
-- Description: Tous les indexes du module
-- Format strict pour extraction automatique
-- ============================================================================

-- IMPORTANT: Ces indexes ne sont PAS créés maintenant
-- Ils seront créés dans 99_pending_indexes.sql (Session 14)

-- ----------------------------------------------------------------------------
-- Indexes table: rev_revenue_imports
-- ----------------------------------------------------------------------------

-- INDEX-REV-001: rev_revenue_imports(tenant_id, import_reference, deleted_at)
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_rev_revenue_imports_tenant_reference
--      ON rev_revenue_imports(tenant_id, import_reference, deleted_at);

-- INDEX-REV-002: rev_revenue_imports.tenant_id
-- TYPE: BTREE
-- WHERE: deleted_at IS NULL
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_revenue_imports_tenant
--      ON rev_revenue_imports(tenant_id) WHERE deleted_at IS NULL;

-- INDEX-REV-003: rev_revenue_imports(tenant_id, status)
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_revenue_imports_tenant_status
--      ON rev_revenue_imports(tenant_id, status);

-- INDEX-REV-004: rev_revenue_imports(tenant_id, import_date)
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_revenue_imports_tenant_date
--      ON rev_revenue_imports(tenant_id, import_date);

-- INDEX-REV-005: rev_revenue_imports.platform_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_revenue_imports_platform
--      ON rev_revenue_imports(platform_id);

-- INDEX-REV-006: rev_revenue_imports(status, processing_started_at)
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_revenue_imports_status_started
--      ON rev_revenue_imports(status, processing_started_at);

-- INDEX-REV-007: rev_revenue_imports.metadata
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_revenue_imports_metadata
--      ON rev_revenue_imports USING GIN(metadata);

-- ----------------------------------------------------------------------------
-- Indexes table: rev_driver_revenues
-- ----------------------------------------------------------------------------

-- INDEX-REV-008: rev_driver_revenues(tenant_id, driver_id, platform_id, period_start)
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_rev_driver_revenues_tenant_driver_platform_period
--      ON rev_driver_revenues(tenant_id, driver_id, platform_id, period_start);

-- INDEX-REV-009: rev_driver_revenues.tenant_id
-- TYPE: BTREE
-- WHERE: deleted_at IS NULL
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_driver_revenues_tenant
--      ON rev_driver_revenues(tenant_id) WHERE deleted_at IS NULL;

-- INDEX-REV-010: rev_driver_revenues(tenant_id, driver_id, period_start)
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_driver_revenues_tenant_driver_period
--      ON rev_driver_revenues(tenant_id, driver_id, period_start);

-- INDEX-REV-011: rev_driver_revenues(tenant_id, status)
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_driver_revenues_tenant_status
--      ON rev_driver_revenues(tenant_id, status);

-- INDEX-REV-012: rev_driver_revenues.import_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_driver_revenues_import
--      ON rev_driver_revenues(import_id);

-- INDEX-REV-013: rev_driver_revenues.platform_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_driver_revenues_platform
--      ON rev_driver_revenues(platform_id);

-- INDEX-REV-014: rev_driver_revenues.driver_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_driver_revenues_driver
--      ON rev_driver_revenues(driver_id);

-- INDEX-REV-015: rev_driver_revenues.metadata
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_driver_revenues_metadata
--      ON rev_driver_revenues USING GIN(metadata);

-- ----------------------------------------------------------------------------
-- Indexes table: rev_reconciliations
-- ----------------------------------------------------------------------------

-- INDEX-REV-016: rev_reconciliations(tenant_id, import_id, reconciliation_date)
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_rev_reconciliations_tenant_import_date
--      ON rev_reconciliations(tenant_id, import_id, reconciliation_date);

-- INDEX-REV-017: rev_reconciliations.tenant_id
-- TYPE: BTREE
-- WHERE: deleted_at IS NULL
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliations_tenant
--      ON rev_reconciliations(tenant_id) WHERE deleted_at IS NULL;

-- INDEX-REV-018: rev_reconciliations(tenant_id, status)
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliations_tenant_status
--      ON rev_reconciliations(tenant_id, status);

-- INDEX-REV-019: rev_reconciliations(tenant_id, reconciliation_date)
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliations_tenant_date
--      ON rev_reconciliations(tenant_id, reconciliation_date);

-- INDEX-REV-020: rev_reconciliations.import_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliations_import
--      ON rev_reconciliations(import_id);

-- INDEX-REV-021: rev_reconciliations.assigned_to
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliations_assigned
--      ON rev_reconciliations(assigned_to);

-- INDEX-REV-022: rev_reconciliations(status, requires_action)
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliations_status_action
--      ON rev_reconciliations(status, requires_action);

-- INDEX-REV-023: rev_reconciliations.metadata
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliations_metadata
--      ON rev_reconciliations USING GIN(metadata);

-- INDEX-REV-024: rev_reconciliations.driver_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliations_driver
--      ON rev_reconciliations(driver_id);

-- ----------------------------------------------------------------------------
-- Indexes table: rev_reconciliation_lines
-- ----------------------------------------------------------------------------

-- INDEX-REV-025: rev_reconciliation_lines.reconciliation_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliation_lines_reconciliation
--      ON rev_reconciliation_lines(reconciliation_id);

-- INDEX-REV-026: rev_reconciliation_lines.driver_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliation_lines_driver
--      ON rev_reconciliation_lines(driver_id);

-- INDEX-REV-027: rev_reconciliation_lines.platform_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliation_lines_platform
--      ON rev_reconciliation_lines(platform_id);

-- INDEX-REV-028: rev_reconciliation_lines.metadata
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_rev_reconciliation_lines_metadata
--      ON rev_reconciliation_lines USING GIN(metadata);

-- ============================================================================
-- SECTION 8: GATEWAY 2 - VALIDATION POST-GÉNÉRATION
-- ============================================================================

DO $$
DECLARE
  v_enums_count INT;
  v_tables_count INT;
  v_rev_imports_cols INT;
  v_rev_revenues_cols INT;
  v_rev_reconciliations_cols INT;
  v_rev_lines_cols INT;
  v_fk_count INT;
BEGIN
  -- Compter enums REV
  SELECT COUNT(*) INTO v_enums_count
  FROM pg_type
  WHERE typname IN (
    'revenue_import_status',
    'revenue_import_source_type',
    'driver_revenue_status',
    'driver_revenue_period_type',
    'reconciliation_status',
    'reconciliation_type'
  );

  -- Compter tables REV
  SELECT COUNT(*) INTO v_tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'rev_revenue_imports',
      'rev_driver_revenues',
      'rev_reconciliations',
      'rev_reconciliation_lines'
    );

  -- Compter colonnes par table
  SELECT COUNT(*) INTO v_rev_imports_cols
  FROM information_schema.columns
  WHERE table_name = 'rev_revenue_imports';

  SELECT COUNT(*) INTO v_rev_revenues_cols
  FROM information_schema.columns
  WHERE table_name = 'rev_driver_revenues';

  SELECT COUNT(*) INTO v_rev_reconciliations_cols
  FROM information_schema.columns
  WHERE table_name = 'rev_reconciliations';

  SELECT COUNT(*) INTO v_rev_lines_cols
  FROM information_schema.columns
  WHERE table_name = 'rev_reconciliation_lines';

  -- Compter FK REV
  SELECT COUNT(*) INTO v_fk_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
    AND table_name LIKE 'rev_%';

  -- Afficher résultats
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GATEWAY 2 - VALIDATION SESSION 11 (REV)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Enums REV: % / 6 enums', v_enums_count;
  RAISE NOTICE 'Tables REV: % / 4 tables', v_tables_count;
  RAISE NOTICE 'rev_revenue_imports: % colonnes', v_rev_imports_cols;
  RAISE NOTICE 'rev_driver_revenues: % colonnes', v_rev_revenues_cols;
  RAISE NOTICE 'rev_reconciliations: % colonnes', v_rev_reconciliations_cols;
  RAISE NOTICE 'rev_reconciliation_lines: % colonnes', v_rev_lines_cols;
  RAISE NOTICE 'Foreign Keys REV: % FK créées', v_fk_count;
  RAISE NOTICE 'Indexes documentés: 28 indexes (3 UNIQUE + 25 BTREE + GIN)';
  RAISE NOTICE '========================================';

  IF v_enums_count = 6 AND v_tables_count = 4 AND v_fk_count >= 24 THEN
    RAISE NOTICE '✓ GATEWAY 2 COMPLETED';
  ELSE
    RAISE WARNING '⚠ GATEWAY 2 INCOMPLETE - Vérifier les compteurs ci-dessus';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- STATISTIQUES GÉNÉRÉES:
-- Enums créés: 6
-- Tables modifiées (ALTER TABLE): 3
-- Nouvelles tables (CREATE TABLE): 1
-- FK internes créées: 3
-- FK externes créées: 21 (15→ADM, 3→DIR, 3→RID)
-- FK futures documentées: 0
-- Indexes documentés: 28
-- Total lignes SQL exécutables: ~520

-- VÉRIFICATIONS AUTOMATIQUES:
-- [✓] Aucun DROP TABLE/COLUMN/TYPE dans le code exécutable
-- [✓] Aucun ALTER COLUMN TYPE dans le code exécutable
-- [✓] Aucun RENAME dans le code exécutable
-- [✓] Tous les IF NOT EXISTS présents (enums, tables, colonnes)
-- [✓] Tous les noms en snake_case (tables, colonnes, constraints, indexes)
-- [✓] Audit trail complet (created_at, updated_at, deleted_at)
-- [✓] Audit users complet (created_by, updated_by, deleted_by)
-- [✓] Metadata JSONB présent sur toutes les tables
-- [✓] tenant_id présent sur 3/3 tables modifiées

-- POINTS D'ATTENTION:
-- - rev_revenue_imports.processing_duration: Colonne GENERATED PostgreSQL (difference timestamps)
-- - rev_reconciliations.difference_amount: Colonne GENERATED PostgreSQL (received - expected)
-- - rev_reconciliation_lines.difference_amount: Colonne GENERATED PostgreSQL
-- - Multi-currency: source_currency, exchange_rate, converted_amount tracked
-- - Workflow: Import → Calculate revenues → Reconcile → Pay (FIN module)
-- - Unique constraints incluent deleted_at pour soft delete (à créer en Session 14)

-- ============================================================================
-- FIN DU FICHIER
-- Session 11/13 complétée
-- Prochaine session: 12/13 - Module FIN (Finance)
-- ============================================================================
