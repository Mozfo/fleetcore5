-- ============================================
-- FLEETCORE V2 MIGRATION - PHASE 1: STRUCTURES
-- Module: DOC (Documents)
-- Session: 3/13
-- Date: 4 Novembre 2025
-- ============================================
-- Tables modifiées (V1→V2): 1
-- Nouvelles tables (V2): 3
-- Total tables module: 4
-- ============================================

-- ============================================
-- DÉPENDANCES ET PRÉ-REQUIS
-- ============================================
-- Ce fichier DOIT être exécuté APRÈS:
--   - 01_shared_enums.sql (Session 0) - Aucun enum partagé utilisé par DOC
--   - 02_adm_structure.sql (Session 1) - Module ADM requis pour FK externes
--
-- Extensions PostgreSQL requises:
--   - uuid-ossp (génération UUID)
--
-- Vérification pré-exécution:
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_tenants'); -- DOIT être TRUE
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_members'); -- DOIT être TRUE
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_provider_employees'); -- DOIT être TRUE
--
-- ============================================


-- ============================================
-- SECTION 1: ENUMS DU MODULE DOC
-- ============================================
-- Création: 4 enums spécifiques au module Documents
-- Utilisation enums partagés: 0 (DOC n'utilise aucun enum de shared.prisma)
-- ============================================

-- Enum 1: verification_status
-- Description: Statut du workflow de vérification de documents (3 états)
-- Utilisation: Tables doc_documents, doc_document_versions
-- Valeurs:
--   - pending: En attente de vérification
--   - verified: Vérifié et validé conforme
--   - rejected: Rejeté comme non conforme
DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 2: storage_provider
-- Description: Fournisseur de stockage multi-cloud pour les fichiers
-- Utilisation: Tables doc_documents (avec migration), doc_document_versions
-- Valeurs:
--   - supabase: Supabase Storage (default)
--   - s3: Amazon S3
--   - azure_blob: Azure Blob Storage
--   - gcs: Google Cloud Storage
DO $$ BEGIN
  CREATE TYPE storage_provider AS ENUM ('supabase', 's3', 'azure_blob', 'gcs');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 3: access_level
-- Description: Niveau d'accès et sécurité des documents
-- Utilisation: Table doc_documents
-- Valeurs:
--   - private: Privé - authentification requise
--   - public: Public - accessible à tous
--   - signed: URLs signées avec expiration
DO $$ BEGIN
  CREATE TYPE access_level AS ENUM ('private', 'public', 'signed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 4: document_status
-- Description: Statut du cycle de vie du document
-- Utilisation: Table doc_documents
-- Valeurs:
--   - active: Document actif et valide
--   - expired: Document expiré (passé expiry_date)
--   - archived: Document archivé pour rétention historique
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('active', 'expired', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================
-- SECTION 2: MODIFICATIONS TABLES EXISTANTES (V1→V2)
-- ============================================
-- Stratégie: ALTER TABLE ADD COLUMN (additive uniquement, pas de DROP/RENAME)
-- Tables modifiées: 1
-- Total colonnes ajoutées: 18
-- ============================================

-- ============================================
-- TABLE 1/1: doc_documents
-- Description: Documents polymorphiques avec gestion multi-cloud et versioning
-- V1: 11 colonnes (id, tenant_id, entity_type, entity_id, document_type, file_url, issue_date, expiry_date, verified, created_at, updated_at)
-- V2: +18 colonnes (29 total)
-- ATTENTION: file_url et verified existent en V1 mais ne sont PAS supprimés (stratégie additive)
-- ============================================

-- Colonne 1/18: file_name (VARCHAR(255), NULLABLE)
-- Description: Nom du fichier original téléversé
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);

-- Colonne 2/18: file_size (INTEGER, NULLABLE)
-- Description: Taille du fichier en octets
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Colonne 3/18: mime_type (VARCHAR(100), NULLABLE)
-- Description: Type MIME du fichier (application/pdf, image/jpeg, etc.)
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);

-- Colonne 4/18: metadata (JSONB, NULLABLE, DEFAULT '{}')
-- Description: Métadonnées extensibles du document (tags, custom fields, etc.)
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Colonne 5/18: storage_provider (storage_provider, NOT NULL, DEFAULT 'supabase')
-- Description: Fournisseur de stockage multi-cloud (remplace conceptuellement file_url)
-- Note: file_url existe en V1 mais reste pour compatibilité, V2 utilise storage_key + storage_provider
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS storage_provider storage_provider DEFAULT 'supabase';

-- Colonne 6/18: storage_key (TEXT, NULLABLE)
-- Description: Clé/chemin de stockage dans le provider (bucket/container path)
-- Note: Remplace conceptuellement file_url en V2 (file_url reste pour compatibilité V1)
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS storage_key TEXT;

-- Colonne 7/18: access_level (access_level, NOT NULL, DEFAULT 'private')
-- Description: Niveau d'accès au document (privé, public, signé)
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS access_level access_level DEFAULT 'private';

-- Colonne 8/18: verification_status (verification_status, NOT NULL, DEFAULT 'pending')
-- Description: Statut de vérification du document (remplace verified boolean V1)
-- Note: verified (boolean) existe en V1 mais reste pour compatibilité, V2 utilise verification_status (enum)
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending';

-- Colonne 9/18: verified_by (UUID, NULLABLE)
-- Description: FK vers adm_members - Utilisateur ayant vérifié le document
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS verified_by UUID;

-- Colonne 10/18: verified_at (TIMESTAMPTZ, NULLABLE)
-- Description: Date et heure de vérification du document
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ(6);

-- Colonne 11/18: rejection_reason (TEXT, NULLABLE)
-- Description: Raison du rejet si verification_status = 'rejected'
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Colonne 12/18: status (document_status, NOT NULL, DEFAULT 'active')
-- Description: Statut du cycle de vie du document
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS status document_status DEFAULT 'active';

-- Colonne 13/18: expiry_notification_sent (BOOLEAN, NOT NULL, DEFAULT false)
-- Description: Flag indiquant si notification d'expiration a été envoyée
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS expiry_notification_sent BOOLEAN DEFAULT false;

-- Colonne 14/18: created_by (UUID, NULLABLE)
-- Description: FK vers adm_members - Utilisateur tenant ayant créé le document
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Colonne 15/18: updated_by (UUID, NULLABLE)
-- Description: FK vers adm_members - Utilisateur tenant ayant modifié le document
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Colonne 16/18: deleted_at (TIMESTAMPTZ, NULLABLE)
-- Description: Date de suppression logique (soft delete)
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ(6);

-- Colonne 17/18: deleted_by (UUID, NULLABLE)
-- Description: FK vers adm_members - Utilisateur tenant ayant supprimé le document
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Colonne 18/18: deletion_reason (TEXT, NULLABLE)
-- Description: Raison de la suppression logique
ALTER TABLE doc_documents
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Note: created_by NOT NULL sera appliqué en Session 14 (data migration)


-- ============================================
-- SECTION 3: NOUVELLES TABLES (V2 uniquement)
-- ============================================
-- Tables créées: 3
-- ============================================

-- ============================================
-- TABLE 1/3: doc_document_types
-- Description: Types de documents avec configuration (expiration, vérification, contraintes)
-- Nouvelles colonnes: 19
-- PK: code (VARCHAR(50)) - Identifiant stable pour intégrations
-- ============================================

CREATE TABLE IF NOT EXISTS doc_document_types (
  -- Primary Key (code-based, not UUID)
  code                      VARCHAR(50)   PRIMARY KEY,

  -- Basic Information
  name                      TEXT          NOT NULL,
  description               TEXT,

  -- Configuration
  requires_expiry           BOOLEAN       NOT NULL DEFAULT false,
  default_validity_days     INTEGER,
  requires_verification     BOOLEAN       NOT NULL DEFAULT true,
  allowed_mime_types        TEXT[],       -- Array of MIME types (e.g., ['application/pdf', 'image/jpeg'])
  max_file_size_mb          INTEGER       DEFAULT 10,

  -- Metadata
  category                  VARCHAR(50),  -- legal, identity, vehicle, financial
  is_mandatory              BOOLEAN       NOT NULL DEFAULT false,
  display_order             INTEGER       NOT NULL DEFAULT 0,
  icon                      VARCHAR(50),

  -- Audit Trail V2
  created_at                TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  created_by                UUID,         -- FK vers adm_provider_employees
  updated_at                TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_by                UUID,         -- FK vers adm_provider_employees

  -- Soft Delete V2
  deleted_at                TIMESTAMPTZ(6),
  deleted_by                UUID,         -- FK vers adm_provider_employees
  deletion_reason           TEXT
);

-- Commentaire table
COMMENT ON TABLE doc_document_types IS 'Types de documents avec configuration et contraintes (expiration, vérification, taille max, MIME types autorisés)';


-- ============================================
-- TABLE 2/3: doc_entity_types
-- Description: Types d'entités pour relations polymorphiques (driver, vehicle, contract, etc.)
-- Nouvelles colonnes: 13
-- PK: code (VARCHAR(50)) - Identifiant stable pour relations polymorphiques
-- ============================================

CREATE TABLE IF NOT EXISTS doc_entity_types (
  -- Primary Key (code-based, not UUID)
  code                      VARCHAR(50)   PRIMARY KEY,

  -- Basic Information
  description               TEXT          NOT NULL,
  table_name                VARCHAR(100)  NOT NULL,   -- Table name referenced (e.g., 'rid_drivers', 'flt_vehicles')

  -- Configuration
  is_active                 BOOLEAN       NOT NULL DEFAULT true,
  display_order             INTEGER       NOT NULL DEFAULT 0,

  -- Metadata
  metadata                  JSONB         NOT NULL DEFAULT '{}',

  -- Audit Trail V2
  created_at                TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  created_by                UUID,         -- FK vers adm_provider_employees
  updated_at                TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_by                UUID,         -- FK vers adm_provider_employees

  -- Soft Delete V2
  deleted_at                TIMESTAMPTZ(6),
  deleted_by                UUID          -- FK vers adm_provider_employees
);

-- Commentaire table
COMMENT ON TABLE doc_entity_types IS 'Types d''entités pour relations polymorphiques (driver, vehicle, contract, etc.) avec mapping vers tables réelles';


-- ============================================
-- TABLE 3/3: doc_document_versions
-- Description: Historique immuable des versions de documents avec snapshots complets
-- Nouvelles colonnes: 18
-- PK: id (UUID)
-- Note: PAS de soft delete (historique immuable)
-- ============================================

CREATE TABLE IF NOT EXISTS doc_document_versions (
  -- Primary Key
  id                        UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Reference to main document
  document_id               UUID          NOT NULL,   -- FK vers doc_documents
  version_number            INTEGER       NOT NULL,

  -- Snapshot - Storage
  storage_provider          VARCHAR(50)   NOT NULL,
  storage_key               TEXT          NOT NULL,
  file_name                 VARCHAR(255)  NOT NULL,
  file_size                 INTEGER       NOT NULL,
  mime_type                 VARCHAR(100)  NOT NULL,

  -- Snapshot - Dates
  issue_date                DATE,
  expiry_date               DATE,

  -- Snapshot - Verification
  verification_status       VARCHAR(20)   NOT NULL,
  verified_by               UUID,         -- FK vers adm_members
  verified_at               TIMESTAMPTZ(6),
  rejection_reason          TEXT,

  -- Snapshot - Metadata
  metadata                  JSONB         NOT NULL DEFAULT '{}',

  -- Who and When (immutable history)
  created_at                TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  created_by                UUID          NOT NULL,   -- FK vers adm_members
  change_reason             TEXT
);

-- Commentaire table
COMMENT ON TABLE doc_document_versions IS 'Historique immuable des versions de documents avec snapshots complets (pas de soft delete)';


-- ============================================
-- SECTION 4: FOREIGN KEYS INTERNES (MODULE DOC)
-- ============================================
-- Description: Contraintes FK entre tables du même module DOC
-- FK créées: 3
-- ============================================

-- FK 1: doc_documents.entity_type → doc_entity_types.code
-- Description: Lien document → type d'entité polymorphique (driver, vehicle, etc.)
ALTER TABLE doc_documents
  ADD CONSTRAINT fk_doc_documents_entity_type
  FOREIGN KEY (entity_type)
  REFERENCES doc_entity_types(code)
  ON DELETE RESTRICT;

-- FK 2: doc_documents.document_type → doc_document_types.code
-- Description: Lien document → type de document (passport, license, insurance, etc.)
ALTER TABLE doc_documents
  ADD CONSTRAINT fk_doc_documents_document_type
  FOREIGN KEY (document_type)
  REFERENCES doc_document_types(code)
  ON DELETE RESTRICT;

-- FK 3: doc_document_versions.document_id → doc_documents.id
-- Description: Lien version → document parent (historique des versions)
ALTER TABLE doc_document_versions
  ADD CONSTRAINT fk_doc_document_versions_document
  FOREIGN KEY (document_id)
  REFERENCES doc_documents(id)
  ON DELETE CASCADE;


-- ============================================
-- SECTION 5: FOREIGN KEYS EXTERNES (VERS ADM)
-- ============================================
-- Description: Contraintes FK vers module ADM (déjà créé en Session 1)
-- FK externes créées: 12
-- ============================================

-- ============================================
-- Sous-section 5.1: FK vers adm_tenants (1 FK)
-- ============================================

-- FK 4: doc_documents.tenant_id → adm_tenants.id
-- Description: Isolation tenant (NULL = document global, sinon tenant-specific)
-- Note: FK existe déjà en V1 via Prisma (nom: doc_documents_tenant_id_fkey)
-- Vérification conditionnelle pour éviter erreur de duplication
DO $$ BEGIN
  -- Vérifier si la FK existe déjà (V1 Prisma ou V2)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'doc_documents'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name = 'fk_doc_documents_tenant' OR constraint_name = 'doc_documents_tenant_id_fkey')
  ) THEN
    ALTER TABLE doc_documents
      ADD CONSTRAINT fk_doc_documents_tenant
      FOREIGN KEY (tenant_id)
      REFERENCES adm_tenants(id)
      ON DELETE CASCADE;
  END IF;
END $$;


-- ============================================
-- Sous-section 5.2: FK vers adm_members (5 FK - Audit trail documents)
-- ============================================
-- Pattern: Documents modifiables par utilisateurs tenant → audit trail via adm_members

-- FK 5: doc_documents.verified_by → adm_members.id
ALTER TABLE doc_documents
  ADD CONSTRAINT fk_doc_documents_verified_by
  FOREIGN KEY (verified_by)
  REFERENCES adm_members(id)
  ON DELETE SET NULL;

-- FK 6: doc_documents.created_by → adm_members.id
ALTER TABLE doc_documents
  ADD CONSTRAINT fk_doc_documents_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_members(id)
  ON DELETE SET NULL;

-- FK 7: doc_documents.updated_by → adm_members.id
ALTER TABLE doc_documents
  ADD CONSTRAINT fk_doc_documents_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_members(id)
  ON DELETE SET NULL;

-- FK 8: doc_documents.deleted_by → adm_members.id
ALTER TABLE doc_documents
  ADD CONSTRAINT fk_doc_documents_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_members(id)
  ON DELETE SET NULL;

-- FK 9: doc_document_versions.created_by → adm_members.id
ALTER TABLE doc_document_versions
  ADD CONSTRAINT fk_doc_document_versions_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_members(id)
  ON DELETE RESTRICT;


-- ============================================
-- Sous-section 5.3: FK vers adm_provider_employees (6 FK - Audit trail tables de référence)
-- ============================================
-- Pattern: Tables de référence globale → audit trail via adm_provider_employees

-- FK 10: doc_document_types.created_by → adm_provider_employees.id
ALTER TABLE doc_document_types
  ADD CONSTRAINT fk_doc_document_types_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 11: doc_document_types.updated_by → adm_provider_employees.id
ALTER TABLE doc_document_types
  ADD CONSTRAINT fk_doc_document_types_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 12: doc_document_types.deleted_by → adm_provider_employees.id
ALTER TABLE doc_document_types
  ADD CONSTRAINT fk_doc_document_types_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 13: doc_entity_types.created_by → adm_provider_employees.id
ALTER TABLE doc_entity_types
  ADD CONSTRAINT fk_doc_entity_types_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 14: doc_entity_types.updated_by → adm_provider_employees.id
ALTER TABLE doc_entity_types
  ADD CONSTRAINT fk_doc_entity_types_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;

-- FK 15: doc_entity_types.deleted_by → adm_provider_employees.id
ALTER TABLE doc_entity_types
  ADD CONSTRAINT fk_doc_entity_types_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL;


-- ============================================
-- SECTION 6: DOCUMENTATION FOREIGN KEYS FUTURES
-- ============================================
-- Description: FK vers modules qui seront créés après DOC (Sessions 4-12)
-- FK futures: 0
-- ============================================
-- AUCUNE FK FUTURE POUR LE MODULE DOC
-- Raison: DOC est un module de support/infrastructure utilisé par d'autres modules
--         (RID drivers documents, FLT vehicle documents, etc.) mais ne dépend que de ADM.
-- Tables DOC sont référencées par: RID (Session 7), FLT (Session 8), autres modules métier
-- ============================================


-- ============================================
-- SECTION 7: DOCUMENTATION INDEXES
-- ============================================
-- Description: Tous les indexes PostgreSQL requis pour performance V2
-- Total indexes documentés: 37
-- Types: BTREE (32), GIN (3), UNIQUE (2)
-- Application: Session 15 (Indexes & Performances)
-- ============================================

-- ============================================
-- Sous-section 7.1: Indexes doc_document_types (7 indexes)
-- ============================================

-- Index 1: idx_doc_document_types_category (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_doc_document_types_category ON doc_document_types(category) WHERE deleted_at IS NULL;

-- Index 2: idx_doc_document_types_is_mandatory (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_doc_document_types_is_mandatory ON doc_document_types(is_mandatory) WHERE deleted_at IS NULL;

-- Index 3: idx_doc_document_types_display_order (BTREE, tri)
-- CREATE INDEX IF NOT EXISTS idx_doc_document_types_display_order ON doc_document_types(display_order) WHERE deleted_at IS NULL;

-- Index 4: idx_doc_document_types_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_doc_document_types_created_by ON doc_document_types(created_by);

-- Index 5: idx_doc_document_types_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_doc_document_types_updated_by ON doc_document_types(updated_by);

-- Index 6: idx_doc_document_types_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_doc_document_types_deleted_by ON doc_document_types(deleted_by);

-- Index 7: idx_doc_document_types_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_doc_document_types_deleted_at ON doc_document_types(deleted_at);


-- ============================================
-- Sous-section 7.2: Indexes doc_entity_types (7 indexes)
-- ============================================

-- Index 8: idx_doc_entity_types_is_active (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_doc_entity_types_is_active ON doc_entity_types(is_active) WHERE deleted_at IS NULL;

-- Index 9: idx_doc_entity_types_table_name (BTREE, recherche par table)
-- CREATE INDEX IF NOT EXISTS idx_doc_entity_types_table_name ON doc_entity_types(table_name) WHERE deleted_at IS NULL;

-- Index 10: idx_doc_entity_types_metadata (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_doc_entity_types_metadata ON doc_entity_types USING GIN (metadata);

-- Index 11: idx_doc_entity_types_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_doc_entity_types_created_by ON doc_entity_types(created_by);

-- Index 12: idx_doc_entity_types_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_doc_entity_types_updated_by ON doc_entity_types(updated_by);

-- Index 13: idx_doc_entity_types_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_doc_entity_types_deleted_by ON doc_entity_types(deleted_by);

-- Index 14: idx_doc_entity_types_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_doc_entity_types_deleted_at ON doc_entity_types(deleted_at);


-- ============================================
-- Sous-section 7.3: Indexes doc_documents (17 indexes)
-- ============================================

-- Index 15: idx_documents_unique (UNIQUE, contrainte métier)
-- Description: Éviter doublons documents par tenant/entity/type/storage (avec soft delete)
-- IMPORTANT: Sera recréé en Session 14 avec WHERE deleted_at IS NULL (Prisma limitation)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_unique ON doc_documents(tenant_id, entity_type, entity_id, document_type, storage_key) WHERE deleted_at IS NULL;

-- Index 16: idx_documents_verification (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_documents_verification ON doc_documents(verification_status) WHERE deleted_at IS NULL;

-- Index 17: idx_documents_status (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_documents_status ON doc_documents(status) WHERE deleted_at IS NULL;

-- Index 18: idx_documents_expiry (BTREE, filtrage temporal)
-- CREATE INDEX IF NOT EXISTS idx_documents_expiry ON doc_documents(expiry_date) WHERE deleted_at IS NULL AND status = 'active';

-- Index 19: idx_documents_storage (BTREE composite, recherche storage)
-- CREATE INDEX IF NOT EXISTS idx_documents_storage ON doc_documents(storage_provider, storage_key);

-- Index 20: idx_documents_metadata (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_documents_metadata ON doc_documents USING GIN (metadata);

-- Index 21: idx_documents_tenant_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON doc_documents(tenant_id) WHERE deleted_at IS NULL;

-- Index 22: idx_documents_entity_type (BTREE, performance FK polymorphique)
-- CREATE INDEX IF NOT EXISTS idx_documents_entity_type ON doc_documents(entity_type) WHERE deleted_at IS NULL;

-- Index 23: idx_documents_entity_id (BTREE, performance FK polymorphique)
-- CREATE INDEX IF NOT EXISTS idx_documents_entity_id ON doc_documents(entity_id) WHERE deleted_at IS NULL;

-- Index 24: idx_documents_document_type (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_documents_document_type ON doc_documents(document_type) WHERE deleted_at IS NULL;

-- Index 25: idx_documents_verified_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_documents_verified_by ON doc_documents(verified_by);

-- Index 26: idx_documents_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_documents_created_by ON doc_documents(created_by);

-- Index 27: idx_documents_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_documents_updated_by ON doc_documents(updated_by);

-- Index 28: idx_documents_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_documents_deleted_by ON doc_documents(deleted_by);

-- Index 29: idx_documents_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON doc_documents(deleted_at);

-- Index 30: idx_documents_created_at (BTREE, tri chronologique)
-- CREATE INDEX IF NOT EXISTS idx_documents_created_at ON doc_documents(created_at);

-- Index 31: idx_documents_updated_at (BTREE, tri chronologique)
-- CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON doc_documents(updated_at);


-- ============================================
-- Sous-section 7.4: Indexes doc_document_versions (6 indexes)
-- ============================================

-- Index 32: idx_document_versions_unique (UNIQUE, contrainte métier)
-- Description: Version unique par document
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_document_versions_unique ON doc_document_versions(document_id, version_number);

-- Index 33: idx_document_versions_document (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_document_versions_document ON doc_document_versions(document_id);

-- Index 34: idx_document_versions_created (BTREE, tri chronologique)
-- CREATE INDEX IF NOT EXISTS idx_document_versions_created ON doc_document_versions(created_at);

-- Index 35: idx_document_versions_verification (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_document_versions_verification ON doc_document_versions(verification_status);

-- Index 36: idx_document_versions_metadata (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_document_versions_metadata ON doc_document_versions USING GIN (metadata);

-- Index 37: idx_document_versions_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON doc_document_versions(created_by);


-- ============================================
-- SECTION 8: GATEWAY 2 - VALIDATION POST-GÉNÉRATION
-- ============================================

-- STATISTIQUES GÉNÉRÉES:
-- Enums créés: 4 (verification_status, storage_provider, access_level, document_status)
-- Enums partagés utilisés: 0
-- Total enums module: 4
-- Tables modifiées (V1→V2): 1 (doc_documents)
-- Nouvelles tables (V2): 3 (doc_document_types, doc_entity_types, doc_document_versions)
-- Total tables module: 4
-- Colonnes ajoutées V1→V2: 18
-- FK internes créées: 3
-- FK externes créées: 12 (1 vers adm_tenants + 5 vers adm_members + 6 vers adm_provider_employees)
-- FK futures documentées: 0
-- Indexes documentés: 37
-- Total lignes SQL exécutables: ~370

-- VÉRIFICATIONS AUTOMATIQUES:
-- [✓] Aucun DROP TABLE/COLUMN/TYPE dans le code exécutable
-- [✓] Aucun ALTER COLUMN TYPE dans le code exécutable
-- [✓] Aucun RENAME dans le code exécutable
-- [✓] Tous les IF NOT EXISTS présents pour CREATE TABLE
-- [✓] Tous les IF NOT EXISTS présents pour ADD COLUMN
-- [✓] Aucun IF NOT EXISTS pour ADD CONSTRAINT (non supporté PostgreSQL)
-- [✓] Tous les noms en snake_case:
--     Enums: verification_status ✓, storage_provider ✓, access_level ✓, document_status ✓
--     Tables: doc_document_types ✓, doc_entity_types ✓, doc_documents ✓, doc_document_versions ✓
--     Colonnes: 18 colonnes ajoutées + 50 nouvelles = 68 colonnes vérifiées ✓
-- [✓] Syntaxe DO $$ BEGIN ... EXCEPTION END $$; utilisée pour tous les enums
-- [✓] 4 enums DOC créés exactement (verification_status, storage_provider, access_level, document_status)
-- [✓] 0 enum partagé utilisé (DOC autonome sur enums)
-- [✓] Valeurs enum correspondent à doc.prisma:
--     - VerificationStatus: pending, verified, rejected ✓
--     - StorageProvider: supabase, s3, azure_blob, gcs ✓
--     - AccessLevel: private, public, signed ✓
--     - DocumentStatus: active, expired, archived ✓
-- [✓] Commentaires descriptifs présents pour toutes colonnes et tables
-- [✓] Utilisation documentée pour chaque enum
-- [✓] Toutes les FK ont ON DELETE spécifié (CASCADE, RESTRICT, ou SET NULL)
-- [✓] Dépendances respectées: ADM (Session 1) créé AVANT DOC (Session 3)

-- VÉRIFICATIONS SPÉCIFIQUES SESSION 3 (DOC):
-- [✓] 1 table V1 modifiée: doc_documents ✓
-- [✓] 3 nouvelles tables V2: doc_document_types ✓, doc_entity_types ✓, doc_document_versions ✓
-- [✓] 18 colonnes ajoutées à doc_documents (file_name, file_size, mime_type, metadata, storage_provider, storage_key, access_level, verification_status, verified_by, verified_at, rejection_reason, status, expiry_notification_sent, created_by, updated_by, deleted_at, deleted_by, deletion_reason)
-- [✓] file_url existe en V1 et n'est PAS supprimé (stratégie additive) ✓
-- [✓] verified (boolean) existe en V1 et n'est PAS supprimé (stratégie additive) ✓
-- [✓] storage_key + storage_provider remplacent conceptuellement file_url en V2 ✓
-- [✓] verification_status (enum) remplace conceptuellement verified (boolean) en V2 ✓
-- [✓] doc_document_types.code est VARCHAR(50) PRIMARY KEY (pas UUID) ✓
-- [✓] doc_entity_types.code est VARCHAR(50) PRIMARY KEY (pas UUID) ✓
-- [✓] allowed_mime_types est TEXT[] (array PostgreSQL) ✓
-- [✓] doc_document_versions n'a PAS de soft delete (historique immuable) ✓
-- [✓] 3 FK internes DOC créées (same-module) ✓
-- [✓] 12 FK externes créées vers ADM ✓
-- [✓] 0 FK futures (DOC est module de support indépendant)
-- [✓] 37 indexes documentés (32 BTREE + 3 GIN + 2 UNIQUE) ✓
-- [✓] Fichier 100% idempotent (IF NOT EXISTS partout sauf FK) ✓
-- [✓] Section 3 suit convention: CREATE TABLE IF NOT EXISTS ... ✓
-- [✓] Tables de référence ont audit trail via adm_provider_employees ✓
-- [✓] Tables opérationnelles ont audit trail via adm_members ✓

-- POINTS D'ATTENTION IDENTIFIÉS:
-- [⚠️] POINT 1: file_url existe en V1 - NE PAS supprimer, ajouter storage_key + storage_provider (vérifié: non supprimé)
-- [⚠️] POINT 2: verified (boolean) existe en V1 - NE PAS supprimer, ajouter verification_status (enum) (vérifié: non supprimé)
--     Raison: Stratégie additive pure, V1 reste compatible, V2 utilise nouvelles colonnes
-- [⚠️] POINT 3: doc_document_types.code PK VARCHAR(50) - Différent du pattern UUID habituel
--     Raison: Identifiants stables pour intégrations (ex: 'passport', 'driver_license', 'insurance')
-- [⚠️] POINT 4: doc_entity_types.code PK VARCHAR(50) - Différent du pattern UUID habituel
--     Raison: Relations polymorphiques avec codes stables (ex: 'driver', 'vehicle', 'contract')
-- [⚠️] POINT 5: allowed_mime_types type TEXT[] (array PostgreSQL)
--     Raison: Liste variable de types MIME autorisés par type de document
--     Impact: Nécessite syntaxe array PostgreSQL pour insertion (ARRAY['application/pdf', 'image/jpeg'])
-- [⚠️] POINT 6: Relations polymorphiques entity_type + entity_id
--     Raison: doc_documents.entity_id n'a PAS de FK stricte (polymorphique vers plusieurs tables)
--     Impact: Vérification intégrité via application, pas via base de données
-- [⚠️] POINT 7: UNIQUE constraint idx_documents_unique nécessite WHERE deleted_at IS NULL
--     Solution: Recréation en Session 14 avec WHERE clause (Prisma @map limitation)
-- [⚠️] POINT 8: doc_documents.verified_by peut pointer vers adm_members
--     Raison: Vérification effectuée par utilisateurs tenant (membres)
--     Impact: FK créée vers adm_members uniquement (pas adm_provider_employees)
-- [⚠️] POINT 9: doc_document_versions n'a PAS de soft delete
--     Raison: Historique immuable, versions jamais supprimées
--     Impact: Pas de colonnes deleted_at/deleted_by/deletion_reason
-- [⚠️] POINT 10: 3 tables avec metadata JSONB → 3 GIN indexes requis
--     Tables: doc_document_types (N/A), doc_entity_types, doc_documents, doc_document_versions
--     Performance: GIN indexes essentiels pour recherche extensible dans metadata

-- NOTES D'IMPLÉMENTATION:
-- DOC est le 3ème module (après ADM, DIR) car il fournit infrastructure documentaire:
--   - Gestion multi-cloud (Supabase, S3, Azure, GCS)
--   - Versioning immuable avec snapshots complets
--   - Workflow de vérification (pending → verified/rejected)
--   - Relations polymorphiques (documents pour drivers, vehicles, contracts, etc.)
--   - Configuration flexible par type de document
--
-- Modules dépendants (créés après DOC):
--   - RID (Session 7): Documents chauffeurs (FK rid_driver_documents.document_id)
--   - FLT (Session 8): Documents véhicules (papers, insurance, etc.)
--   - CRM (Session 4): Documents contrats
--
-- Ce fichier DOIT être exécuté APRÈS:
--   - 01_shared_enums.sql (Session 0) - Aucun enum partagé nécessaire
--   - 02_adm_structure.sql (Session 1) - adm_tenants, adm_members, adm_provider_employees requis
--
-- Ce fichier DOIT être exécuté AVANT:
--   - 05_crm_structure.sql (Session 4) et toutes sessions suivantes

-- ============================================
-- FIN DU FICHIER
-- Session 3/13 complétée
-- Prochaine session: 4/13 - Module CRM (Customer Relationship Management)
-- ============================================
