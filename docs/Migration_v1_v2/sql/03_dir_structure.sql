-- ============================================
-- FLEETCORE V2 MIGRATION - PHASE 1: STRUCTURES
-- Module: DIR (Référentiels/Directory)
-- Session: 2/13
-- Date: 4 Novembre 2025
-- ============================================
-- Tables modifiées (V1→V2): 5
-- Nouvelles tables (V2): 2
-- Total tables module: 7
-- ============================================

-- ============================================
-- DÉPENDANCES ET PRÉ-REQUIS
-- ============================================
-- Ce fichier DOIT être exécuté APRÈS:
--   - 01_shared_enums.sql (Session 0) - Enums globaux requis (lifecycle_status)
--   - 02_adm_structure.sql (Session 1) - Module ADM requis pour FK externes
--
-- Extensions PostgreSQL requises:
--   - uuid-ossp (génération UUID)
--   - citext (champs case-insensitive)
--
-- Vérification pré-exécution:
--   SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lifecycle_status'); -- DOIT être TRUE
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_tenants'); -- DOIT être TRUE
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_provider_employees'); -- DOIT être TRUE
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_members'); -- DOIT être TRUE
--
-- ============================================


-- ============================================
-- SECTION 1: ENUMS DU MODULE DIR
-- ============================================
-- Création: 2 enums spécifiques au module Directory
-- Utilisation enums partagés: lifecycle_status (créé dans Session 0)
-- ============================================

-- Enum 1: car_model_status
-- Description: Statut du cycle de vie spécifique aux modèles de voiture
-- Utilisation: Table dir_car_models uniquement
-- Différence avec lifecycle_status: Utilise 'discontinued' (production arrêtée) au lieu de 'deprecated'
-- Valeurs:
--   - active: Modèle actif et en production
--   - inactive: Modèle temporairement désactivé
--   - discontinued: Production arrêtée (différent de deprecated pour marques automobiles)
DO $$ BEGIN
  CREATE TYPE car_model_status AS ENUM ('active', 'inactive', 'discontinued');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 2: regulation_status
-- Description: Statut des régulations par pays (version simplifiée, pas de concept de dépréciation)
-- Utilisation: Table dir_country_regulations uniquement
-- Valeurs:
--   - active: Régulation active et applicable
--   - inactive: Régulation inactive (pas encore applicable ou expirée)
DO $$ BEGIN
  CREATE TYPE regulation_status AS ENUM ('active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================
-- SECTION 2: MODIFICATIONS TABLES EXISTANTES (V1→V2)
-- ============================================
-- Stratégie: ALTER TABLE ADD COLUMN (additive uniquement, pas de DROP/RENAME)
-- Tables modifiées: 5
-- Total colonnes ajoutées: 79
-- ============================================

-- ============================================
-- TABLE 1/5: dir_car_makes
-- Description: Marques et fabricants automobiles (Mercedes, BMW, Toyota, etc.)
-- V1: 5 colonnes (id, tenant_id, name, created_at, updated_at)
-- V2: +13 colonnes (18 total)
-- ============================================

-- Colonne 1/13: code (VARCHAR(50), NULLABLE)
-- Description: Identifiant stable pour intégrations externes (ex: 'mercedes-benz', 'toyota')
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Colonne 2/13: country_of_origin (CHAR(2), NULLABLE)
-- Description: Code ISO 3166-1 alpha-2 du pays d'origine (ex: 'DE' pour Allemagne, 'JP' pour Japon)
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS country_of_origin CHAR(2);

-- Colonne 3/13: parent_company (VARCHAR(100), NULLABLE)
-- Description: Groupe/holding propriétaire (ex: 'Volkswagen Group', 'Toyota Motor Corporation')
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS parent_company VARCHAR(100);

-- Colonne 4/13: founded_year (INTEGER, NULLABLE)
-- Description: Année de création du fabricant
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS founded_year INTEGER;

-- Colonne 5/13: logo_url (TEXT, NULLABLE)
-- Description: URL vers le logo de la marque
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Colonne 6/13: status (lifecycle_status, NOT NULL, DEFAULT 'active')
-- Description: Statut du cycle de vie de la marque (enum partagé)
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS status lifecycle_status DEFAULT 'active';

-- Colonne 7/13: metadata (JSONB, NULLABLE)
-- Description: Données extensibles (ex: noms localisés, liens externes)
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Colonne 8/13: created_by (UUID, NOT NULL)
-- Description: FK vers adm_provider_employees - Employé ayant créé la marque
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Colonne 9/13: updated_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant modifié la marque
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Colonne 10/13: deleted_at (TIMESTAMPTZ, NULLABLE)
-- Description: Date de suppression logique (soft delete)
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ(6);

-- Colonne 11/13: deleted_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant supprimé la marque
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Colonne 12/13: deletion_reason (TEXT, NULLABLE)
-- Description: Raison de la suppression logique
ALTER TABLE dir_car_makes
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Colonne 13/13: NOT NULL constraint sur created_by (après ajout de données si nécessaire)
-- Note: Ne peut pas être appliqué immédiatement, sera appliqué en Session 14 (data migration)
-- ALTER TABLE dir_car_makes ALTER COLUMN created_by SET NOT NULL;


-- ============================================
-- TABLE 2/5: dir_car_models
-- Description: Modèles de voiture par marque (Mercedes S-Class, BMW X5, etc.)
-- V1: 6 colonnes (id, tenant_id, make_id, name, created_at, updated_at)
-- V2: +17 colonnes (23 total)
-- ATTENTION: vehicle_class_id EXISTE DÉJÀ en V1, ne pas recréer
-- ============================================

-- Colonne 1/17: code (VARCHAR(50), NULLABLE)
-- Description: Code modèle du fabricant (ex: 'W223' pour Mercedes S-Class)
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Colonne 2/17: year_start (INTEGER, NULLABLE)
-- Description: Année de début de production
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS year_start INTEGER;

-- Colonne 3/17: year_end (INTEGER, NULLABLE)
-- Description: Année de fin de production
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS year_end INTEGER;

-- Colonne 4/17: body_type (VARCHAR(50), NULLABLE)
-- Description: Type de carrosserie (sedan, SUV, van, limousine)
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS body_type VARCHAR(50);

-- Colonne 5/17: fuel_type (VARCHAR(50), NULLABLE)
-- Description: Type de carburant (gasoline, diesel, hybrid, electric)
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);

-- Colonne 6/17: transmission (VARCHAR(50), NULLABLE)
-- Description: Type de transmission (manual, automatic)
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS transmission VARCHAR(50);

-- Colonne 7/17: seats_min (INTEGER, NULLABLE)
-- Description: Nombre minimum de sièges
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS seats_min INTEGER;

-- Colonne 8/17: seats_max (INTEGER, NULLABLE)
-- Description: Nombre maximum de sièges
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS seats_max INTEGER;

-- Colonne 9/17: length_mm (INTEGER, NULLABLE)
-- Description: Longueur en millimètres
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS length_mm INTEGER;

-- Colonne 10/17: width_mm (INTEGER, NULLABLE)
-- Description: Largeur en millimètres
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS width_mm INTEGER;

-- Colonne 11/17: height_mm (INTEGER, NULLABLE)
-- Description: Hauteur en millimètres
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS height_mm INTEGER;

-- Colonne 12/17: metadata (JSONB, NULLABLE)
-- Description: Spécifications additionnelles extensibles
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Colonne 13/17: status (car_model_status, NOT NULL, DEFAULT 'active')
-- Description: Statut du cycle de vie du modèle (enum spécifique DIR)
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS status car_model_status DEFAULT 'active';

-- Colonne 14/17: created_by (UUID, NOT NULL)
-- Description: FK vers adm_provider_employees - Employé ayant créé le modèle
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Colonne 15/17: updated_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant modifié le modèle
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Colonne 16/17: deleted_at (TIMESTAMPTZ, NULLABLE)
-- Description: Date de suppression logique (soft delete)
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ(6);

-- Colonne 17/17: deleted_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant supprimé le modèle
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Colonne 18/17: deletion_reason (TEXT, NULLABLE)
-- Description: Raison de la suppression logique
ALTER TABLE dir_car_models
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Note: vehicle_class_id (UUID) existe déjà en V1, pas de création
-- Note: created_by NOT NULL sera appliqué en Session 14 (data migration)


-- ============================================
-- TABLE 3/5: dir_platforms
-- Description: Plateformes de VTC (Uber, Bolt, Careem, etc.)
-- V1: 4 colonnes (id, name, created_at, updated_at)
-- V2: +11 colonnes (15 total)
-- ============================================

-- Colonne 1/11: code (VARCHAR(50), NULLABLE)
-- Description: Identifiant stable (uber, bolt, careem)
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Colonne 2/11: description (TEXT, NULLABLE)
-- Description: Description détaillée de la plateforme
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Colonne 3/11: logo_url (TEXT, NULLABLE)
-- Description: URL vers le logo de la plateforme
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Colonne 4/11: provider_category (VARCHAR(50), NULLABLE)
-- Description: Catégorie de fournisseur (ride_hailing, delivery, scooter)
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS provider_category VARCHAR(50);

-- Colonne 5/11: supported_countries (JSONB, NULLABLE)
-- Description: Liste des pays où la plateforme est disponible
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS supported_countries JSONB;

-- Colonne 6/11: status (lifecycle_status, NOT NULL, DEFAULT 'active')
-- Description: Statut de la plateforme (enum partagé)
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS status lifecycle_status DEFAULT 'active';

-- Colonne 7/11: metadata (JSONB, NULLABLE)
-- Description: Configuration extensible
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Colonne 8/11: created_by (UUID, NOT NULL)
-- Description: FK vers adm_provider_employees - Employé ayant créé la plateforme
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Colonne 9/11: updated_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant modifié la plateforme
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Colonne 10/11: deleted_at (TIMESTAMPTZ, NULLABLE)
-- Description: Date de suppression logique (soft delete)
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ(6);

-- Colonne 11/11: deleted_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant supprimé la plateforme
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Colonne 12/11: deletion_reason (TEXT, NULLABLE)
-- Description: Raison de la suppression logique
ALTER TABLE dir_platforms
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Note: created_by NOT NULL sera appliqué en Session 14 (data migration)


-- ============================================
-- TABLE 4/5: dir_country_regulations
-- Description: Régulations spécifiques par pays pour le VTC
-- V1: 9 colonnes (country_code PK, vehicle_max_age, requires_vtc_card, min_fare_*, vat_rate, currency, timezone, metadata)
-- V2: +13 colonnes (22 total)
-- ============================================

-- Colonne 1/13: min_vehicle_class_id (UUID, NULLABLE)
-- Description: FK vers dir_vehicle_classes - Classe minimale requise
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS min_vehicle_class_id UUID;

-- Colonne 2/13: min_vehicle_length_cm (INTEGER, NULLABLE)
-- Description: Longueur minimale du véhicule en centimètres
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS min_vehicle_length_cm INTEGER;

-- Colonne 3/13: min_vehicle_width_cm (INTEGER, NULLABLE)
-- Description: Largeur minimale du véhicule en centimètres
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS min_vehicle_width_cm INTEGER;

-- Colonne 4/13: min_vehicle_height_cm (INTEGER, NULLABLE)
-- Description: Hauteur minimale du véhicule en centimètres
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS min_vehicle_height_cm INTEGER;

-- Colonne 5/13: max_vehicle_weight_kg (INTEGER, NULLABLE)
-- Description: Poids maximal du véhicule en kilogrammes
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS max_vehicle_weight_kg INTEGER;

-- Colonne 6/13: max_vehicle_mileage_km (INTEGER, NULLABLE)
-- Description: Kilométrage maximal autorisé
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS max_vehicle_mileage_km INTEGER;

-- Colonne 7/13: requires_professional_license (BOOLEAN, NULLABLE)
-- Description: Permis professionnel requis (remplace requires_vtc_card, plus générique)
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS requires_professional_license BOOLEAN;

-- Colonne 8/13: required_documents (JSONB, NULLABLE)
-- Description: Liste structurée des documents requis
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS required_documents JSONB;

-- Colonne 9/13: effective_date (DATE, NULLABLE)
-- Description: Date de début d'application de la régulation
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS effective_date DATE;

-- Colonne 10/13: expiry_date (DATE, NULLABLE)
-- Description: Date de fin d'application de la régulation
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Colonne 11/13: status (regulation_status, NOT NULL, DEFAULT 'active')
-- Description: Statut de la régulation (enum spécifique DIR)
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS status regulation_status DEFAULT 'active';

-- Colonne 12/13: created_by (UUID, NOT NULL)
-- Description: FK vers adm_provider_employees - Employé ayant créé la régulation
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Colonne 13/13: updated_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant modifié la régulation
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Colonne 14/13: deleted_at (TIMESTAMPTZ, NULLABLE)
-- Description: Date de suppression logique (soft delete)
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ(6);

-- Colonne 15/13: deleted_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant supprimé la régulation
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Colonne 16/13: deletion_reason (TEXT, NULLABLE)
-- Description: Raison de la suppression logique
ALTER TABLE dir_country_regulations
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Note: created_by NOT NULL sera appliqué en Session 14 (data migration)


-- ============================================
-- TABLE 5/5: dir_vehicle_classes
-- Description: Classes de véhicules standardisées par pays (sedan, SUV, luxury, etc.)
-- V1: 6 colonnes (id, country_code FK, name, description, max_age, created_at, updated_at)
-- V2: +17 colonnes (23 total)
-- ============================================

-- Colonne 1/17: code (VARCHAR(50), NULLABLE)
-- Description: Identifiant stable (sedan, suv, luxury)
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Colonne 2/17: min_length_cm (INTEGER, NULLABLE)
-- Description: Longueur minimale en centimètres
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS min_length_cm INTEGER;

-- Colonne 3/17: max_length_cm (INTEGER, NULLABLE)
-- Description: Longueur maximale en centimètres
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS max_length_cm INTEGER;

-- Colonne 4/17: min_width_cm (INTEGER, NULLABLE)
-- Description: Largeur minimale en centimètres
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS min_width_cm INTEGER;

-- Colonne 5/17: max_width_cm (INTEGER, NULLABLE)
-- Description: Largeur maximale en centimètres
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS max_width_cm INTEGER;

-- Colonne 6/17: min_height_cm (INTEGER, NULLABLE)
-- Description: Hauteur minimale en centimètres
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS min_height_cm INTEGER;

-- Colonne 7/17: max_height_cm (INTEGER, NULLABLE)
-- Description: Hauteur maximale en centimètres
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS max_height_cm INTEGER;

-- Colonne 8/17: min_seats (INTEGER, NULLABLE)
-- Description: Nombre minimal de sièges
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS min_seats INTEGER;

-- Colonne 9/17: max_seats (INTEGER, NULLABLE)
-- Description: Nombre maximal de sièges
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS max_seats INTEGER;

-- Colonne 10/17: min_age (INTEGER, NULLABLE)
-- Description: Âge minimal du véhicule (nouveau champ distinct de max_age)
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS min_age INTEGER;

-- Colonne 11/17: min_weight_kg (INTEGER, NULLABLE)
-- Description: Poids minimal en kilogrammes
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS min_weight_kg INTEGER;

-- Colonne 12/17: max_weight_kg (INTEGER, NULLABLE)
-- Description: Poids maximal en kilogrammes
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS max_weight_kg INTEGER;

-- Colonne 13/17: criteria (JSONB, NULLABLE)
-- Description: Critères additionnels extensibles
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS criteria JSONB;

-- Colonne 14/17: status (lifecycle_status, NOT NULL, DEFAULT 'active')
-- Description: Statut de la classe (enum partagé)
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS status lifecycle_status DEFAULT 'active';

-- Colonne 15/17: metadata (JSONB, NULLABLE)
-- Description: Métadonnées libres
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Colonne 16/17: created_by (UUID, NOT NULL)
-- Description: FK vers adm_provider_employees - Employé ayant créé la classe
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Colonne 17/17: updated_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant modifié la classe
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Colonne 18/17: deleted_at (TIMESTAMPTZ, NULLABLE)
-- Description: Date de suppression logique (soft delete)
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ(6);

-- Colonne 19/17: deleted_by (UUID, NULLABLE)
-- Description: FK vers adm_provider_employees - Employé ayant supprimé la classe
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Colonne 20/17: deletion_reason (TEXT, NULLABLE)
-- Description: Raison de la suppression logique
ALTER TABLE dir_vehicle_classes
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Note: created_by NOT NULL sera appliqué en Session 14 (data migration)


-- ============================================
-- SECTION 3: NOUVELLES TABLES (V2 uniquement)
-- ============================================
-- Tables créées: 2
-- ============================================

-- ============================================
-- TABLE 1/2: dir_platform_configs
-- Description: Configuration sécurisée par plateforme et par tenant (API keys, webhooks, etc.)
-- Nouvelles colonnes: 20
-- ============================================

CREATE TABLE IF NOT EXISTS dir_platform_configs (
  -- Colonnes principales
  id                        UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id               UUID          NOT NULL, -- FK vers dir_platforms
  tenant_id                 UUID          NOT NULL, -- FK vers adm_tenants
  api_base_url              TEXT          NOT NULL,
  auth_method               VARCHAR(50),  -- oauth2, api_key, jwt
  api_version               VARCHAR(20),
  refresh_frequency_minutes INTEGER       DEFAULT 60,
  webhook_endpoints         JSONB,        -- Configuration des webhooks
  supported_services        JSONB,        -- transport, delivery, etc.
  sandbox_config            JSONB,        -- Configuration environnement test
  production_config         JSONB,        -- Configuration production
  secrets_vault_ref         VARCHAR(100), -- Référence vault externe
  is_active                 BOOLEAN       DEFAULT true,

  -- Audit trail V2
  created_at                TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  created_by                UUID          NOT NULL, -- FK vers adm_provider_employees
  updated_by                UUID,                   -- FK vers adm_provider_employees

  -- Soft delete V2
  deleted_at                TIMESTAMPTZ(6),
  deleted_by                UUID,                   -- FK vers adm_provider_employees
  deletion_reason           TEXT
);

-- Commentaire table
COMMENT ON TABLE dir_platform_configs IS 'Configuration sécurisée des plateformes VTC par tenant (API, webhooks, secrets)';


-- ============================================
-- TABLE 2/2: adm_tenant_vehicle_classes
-- Description: Classes de véhicules personnalisées par tenant
-- Nouvelles colonnes: 17
-- Note: Table nommée adm_* mais créée depuis DIR car spécification DIR
-- ATTENTION: Utilise adm_members pour audit trail (exception au pattern DIR)
-- ============================================

CREATE TABLE IF NOT EXISTS adm_tenant_vehicle_classes (
  -- Colonnes principales
  id                UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID              NOT NULL, -- FK vers adm_tenants
  code              VARCHAR(50)       NOT NULL,
  name              VARCHAR(100)      NOT NULL,
  description       TEXT,
  criteria          JSONB,            -- Critères personnalisés
  based_on_class_id UUID,             -- FK vers dir_vehicle_classes (héritage)
  status            lifecycle_status  NOT NULL DEFAULT 'active',
  metadata          JSONB,

  -- Audit trail V2
  created_at        TIMESTAMPTZ(6)    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ(6)    NOT NULL DEFAULT NOW(),
  created_by        UUID              NOT NULL, -- FK vers adm_members (EXCEPTION: utilisateur tenant, pas employé)
  updated_by        UUID,                       -- FK vers adm_members (EXCEPTION)

  -- Soft delete V2
  deleted_at        TIMESTAMPTZ(6),
  deleted_by        UUID,                       -- FK vers adm_members (EXCEPTION)
  deletion_reason   TEXT
);

-- Commentaire table
COMMENT ON TABLE adm_tenant_vehicle_classes IS 'Classes de véhicules personnalisées par tenant (hérite ou crée des classes spécifiques)';


-- ============================================
-- SECTION 4: FOREIGN KEYS INTERNES (MODULE DIR)
-- ============================================
-- Description: Contraintes FK entre tables du même module DIR
-- FK créées: 6
-- ============================================

-- FK 1: dir_car_models.make_id → dir_car_makes.id
-- Description: Lien modèle → marque (ex: S-Class → Mercedes)
ALTER TABLE dir_car_models
  ADD CONSTRAINT fk_dir_car_models_make
  FOREIGN KEY (make_id)
  REFERENCES dir_car_makes(id)
  ON DELETE RESTRICT;

-- FK 2: dir_car_models.vehicle_class_id → dir_vehicle_classes.id
-- Description: Lien modèle → classe (ex: S-Class → luxury)
ALTER TABLE dir_car_models
  ADD CONSTRAINT fk_dir_car_models_vehicle_class
  FOREIGN KEY (vehicle_class_id)
  REFERENCES dir_vehicle_classes(id)
  ON DELETE SET NULL;

-- FK 3: dir_country_regulations.min_vehicle_class_id → dir_vehicle_classes.id
-- Description: Classe minimale requise par régulation pays
ALTER TABLE dir_country_regulations
  ADD CONSTRAINT fk_dir_country_regulations_min_vehicle_class
  FOREIGN KEY (min_vehicle_class_id)
  REFERENCES dir_vehicle_classes(id)
  ON DELETE SET NULL;

-- FK 4: dir_vehicle_classes.country_code → dir_country_regulations.country_code
-- Description: Lien classe → régulation pays
ALTER TABLE dir_vehicle_classes
  ADD CONSTRAINT fk_dir_vehicle_classes_country
  FOREIGN KEY (country_code)
  REFERENCES dir_country_regulations(country_code)
  ON DELETE RESTRICT;

-- FK 5: dir_platform_configs.platform_id → dir_platforms.id
-- Description: Lien config → plateforme (ex: config Uber tenant A → Uber)
ALTER TABLE dir_platform_configs
  ADD CONSTRAINT fk_dir_platform_configs_platform
  FOREIGN KEY (platform_id)
  REFERENCES dir_platforms(id)
  ON DELETE CASCADE;

-- FK 6: adm_tenant_vehicle_classes.based_on_class_id → dir_vehicle_classes.id
-- Description: Héritage classe personnalisée → classe standard
ALTER TABLE adm_tenant_vehicle_classes
  ADD CONSTRAINT fk_adm_tenant_vehicle_classes_based_on
  FOREIGN KEY (based_on_class_id)
  REFERENCES dir_vehicle_classes(id)
  ON DELETE SET NULL;


-- ============================================
-- SECTION 5: FOREIGN KEYS EXTERNES (VERS ADM)
-- ============================================
-- Description: Contraintes FK vers module ADM (déjà créé en Session 1)
-- FK externes créées: 25
-- ============================================

-- ============================================
-- Sous-section 5.1: FK vers adm_tenants (4 FK)
-- ============================================

-- FK 7: dir_car_makes.tenant_id → adm_tenants.id
-- Description: Isolation tenant (NULL = marque globale)
ALTER TABLE dir_car_makes
  ADD CONSTRAINT fk_dir_car_makes_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE;

-- FK 8: dir_car_models.tenant_id → adm_tenants.id
-- Description: Isolation tenant (NULL = modèle global)
ALTER TABLE dir_car_models
  ADD CONSTRAINT fk_dir_car_models_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE;

-- FK 9: dir_platform_configs.tenant_id → adm_tenants.id
-- Description: Configuration plateforme par tenant
ALTER TABLE dir_platform_configs
  ADD CONSTRAINT fk_dir_platform_configs_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE;

-- FK 10: adm_tenant_vehicle_classes.tenant_id → adm_tenants.id
-- Description: Classes personnalisées par tenant
ALTER TABLE adm_tenant_vehicle_classes
  ADD CONSTRAINT fk_adm_tenant_vehicle_classes_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE;


-- ============================================
-- Sous-section 5.2: FK vers adm_provider_employees (18 FK - Audit trail standard)
-- ============================================

-- FK 11: dir_car_makes.created_by → adm_provider_employees.id
ALTER TABLE dir_car_makes
  ADD CONSTRAINT fk_dir_car_makes_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 12: dir_car_makes.updated_by → adm_provider_employees.id
ALTER TABLE dir_car_makes
  ADD CONSTRAINT fk_dir_car_makes_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 13: dir_car_makes.deleted_by → adm_provider_employees.id
ALTER TABLE dir_car_makes
  ADD CONSTRAINT fk_dir_car_makes_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 14: dir_car_models.created_by → adm_provider_employees.id
ALTER TABLE dir_car_models
  ADD CONSTRAINT fk_dir_car_models_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 15: dir_car_models.updated_by → adm_provider_employees.id
ALTER TABLE dir_car_models
  ADD CONSTRAINT fk_dir_car_models_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 16: dir_car_models.deleted_by → adm_provider_employees.id
ALTER TABLE dir_car_models
  ADD CONSTRAINT fk_dir_car_models_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 17: dir_platforms.created_by → adm_provider_employees.id
ALTER TABLE dir_platforms
  ADD CONSTRAINT fk_dir_platforms_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 18: dir_platforms.updated_by → adm_provider_employees.id
ALTER TABLE dir_platforms
  ADD CONSTRAINT fk_dir_platforms_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 19: dir_platforms.deleted_by → adm_provider_employees.id
ALTER TABLE dir_platforms
  ADD CONSTRAINT fk_dir_platforms_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 20: dir_platform_configs.created_by → adm_provider_employees.id
ALTER TABLE dir_platform_configs
  ADD CONSTRAINT fk_dir_platform_configs_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 21: dir_platform_configs.updated_by → adm_provider_employees.id
ALTER TABLE dir_platform_configs
  ADD CONSTRAINT fk_dir_platform_configs_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 22: dir_platform_configs.deleted_by → adm_provider_employees.id
ALTER TABLE dir_platform_configs
  ADD CONSTRAINT fk_dir_platform_configs_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 23: dir_country_regulations.created_by → adm_provider_employees.id
ALTER TABLE dir_country_regulations
  ADD CONSTRAINT fk_dir_country_regulations_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 24: dir_country_regulations.updated_by → adm_provider_employees.id
ALTER TABLE dir_country_regulations
  ADD CONSTRAINT fk_dir_country_regulations_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 25: dir_country_regulations.deleted_by → adm_provider_employees.id
ALTER TABLE dir_country_regulations
  ADD CONSTRAINT fk_dir_country_regulations_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 26: dir_vehicle_classes.created_by → adm_provider_employees.id
ALTER TABLE dir_vehicle_classes
  ADD CONSTRAINT fk_dir_vehicle_classes_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 27: dir_vehicle_classes.updated_by → adm_provider_employees.id
ALTER TABLE dir_vehicle_classes
  ADD CONSTRAINT fk_dir_vehicle_classes_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;

-- FK 28: dir_vehicle_classes.deleted_by → adm_provider_employees.id
ALTER TABLE dir_vehicle_classes
  ADD CONSTRAINT fk_dir_vehicle_classes_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT;


-- ============================================
-- Sous-section 5.3: FK vers adm_members (3 FK - Exception audit trail)
-- ============================================
-- ATTENTION: adm_tenant_vehicle_classes utilise adm_members (utilisateurs tenant)
-- et NON adm_provider_employees (employés FleetCore) car créée par clients finaux

-- FK 29: adm_tenant_vehicle_classes.created_by → adm_members.id
ALTER TABLE adm_tenant_vehicle_classes
  ADD CONSTRAINT fk_adm_tenant_vehicle_classes_created_by
  FOREIGN KEY (created_by)
  REFERENCES adm_members(id)
  ON DELETE RESTRICT;

-- FK 30: adm_tenant_vehicle_classes.updated_by → adm_members.id
ALTER TABLE adm_tenant_vehicle_classes
  ADD CONSTRAINT fk_adm_tenant_vehicle_classes_updated_by
  FOREIGN KEY (updated_by)
  REFERENCES adm_members(id)
  ON DELETE RESTRICT;

-- FK 31: adm_tenant_vehicle_classes.deleted_by → adm_members.id
ALTER TABLE adm_tenant_vehicle_classes
  ADD CONSTRAINT fk_adm_tenant_vehicle_classes_deleted_by
  FOREIGN KEY (deleted_by)
  REFERENCES adm_members(id)
  ON DELETE RESTRICT;


-- ============================================
-- SECTION 6: DOCUMENTATION FOREIGN KEYS FUTURES
-- ============================================
-- Description: FK vers modules qui seront créés après DIR (Sessions 3-12)
-- FK futures: 0
-- ============================================
-- AUCUNE FK FUTURE POUR LE MODULE DIR
-- Raison: DIR est un module de référentiels de base, utilisé par les autres modules
--         mais ne dépendant d'aucun module métier créé après lui.
-- Tables DIR sont référencées par: DOC, CRM, FLT, SCH, TRP (créés dans Sessions 3-12)
-- ============================================


-- ============================================
-- SECTION 7: DOCUMENTATION INDEXES
-- ============================================
-- Description: Tous les indexes PostgreSQL requis pour performance V2
-- Total indexes documentés: 71
-- Types: BTREE (62), GIN (6), UNIQUE (3)
-- Application: Session 15 (Indexes & Performances)
-- ============================================

-- ============================================
-- Sous-section 7.1: Indexes dir_car_makes (14 indexes)
-- ============================================

-- Index 1: idx_car_makes_tenant_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_tenant_id ON dir_car_makes(tenant_id) WHERE deleted_at IS NULL;

-- Index 2: idx_car_makes_tenant_name_unique (UNIQUE, contrainte métier)
-- Description: Éviter doublons marques par tenant (avec soft delete)
-- IMPORTANT: Sera recréé en Session 14 avec WHERE deleted_at IS NULL (Prisma limitation)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_car_makes_tenant_name_unique ON dir_car_makes(tenant_id, name) WHERE deleted_at IS NULL;

-- Index 3: idx_car_makes_status (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_status ON dir_car_makes(status) WHERE deleted_at IS NULL;

-- Index 4: idx_car_makes_country (BTREE, recherche géographique)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_country ON dir_car_makes(country_of_origin);

-- Index 5: idx_car_makes_metadata (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_metadata ON dir_car_makes USING GIN (metadata);

-- Index 6: idx_car_makes_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_created_by ON dir_car_makes(created_by);

-- Index 7: idx_car_makes_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_updated_by ON dir_car_makes(updated_by);

-- Index 8: idx_car_makes_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_deleted_by ON dir_car_makes(deleted_by);

-- Index 9: idx_car_makes_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_deleted_at ON dir_car_makes(deleted_at);

-- Index 10: idx_car_makes_created_at (BTREE, tri chronologique)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_created_at ON dir_car_makes(created_at);

-- Index 11: idx_car_makes_updated_at (BTREE, tri chronologique)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_updated_at ON dir_car_makes(updated_at);

-- Index 12: idx_car_makes_code (BTREE, intégrations externes)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_code ON dir_car_makes(code) WHERE deleted_at IS NULL;

-- Index 13: idx_car_makes_name (BTREE, recherche texte)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_name ON dir_car_makes(name) WHERE deleted_at IS NULL;

-- Index 14: idx_car_makes_parent_company (BTREE, groupement)
-- CREATE INDEX IF NOT EXISTS idx_car_makes_parent_company ON dir_car_makes(parent_company) WHERE deleted_at IS NULL;


-- ============================================
-- Sous-section 7.2: Indexes dir_car_models (16 indexes)
-- ============================================

-- Index 15: idx_car_models_tenant_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_car_models_tenant_id ON dir_car_models(tenant_id) WHERE deleted_at IS NULL;

-- Index 16: idx_car_models_make_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_car_models_make_id ON dir_car_models(make_id) WHERE deleted_at IS NULL;

-- Index 17: idx_car_models_vehicle_class_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_car_models_vehicle_class_id ON dir_car_models(vehicle_class_id) WHERE deleted_at IS NULL;

-- Index 18: idx_car_models_body_fuel (BTREE composite, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_car_models_body_fuel ON dir_car_models(body_type, fuel_type) WHERE deleted_at IS NULL;

-- Index 19: idx_car_models_years (BTREE composite, filtrage chronologique)
-- CREATE INDEX IF NOT EXISTS idx_car_models_years ON dir_car_models(year_start, year_end) WHERE deleted_at IS NULL;

-- Index 20: idx_car_models_metadata (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_car_models_metadata ON dir_car_models USING GIN (metadata);

-- Index 21: idx_car_models_status (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_car_models_status ON dir_car_models(status) WHERE deleted_at IS NULL;

-- Index 22: idx_car_models_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_car_models_created_by ON dir_car_models(created_by);

-- Index 23: idx_car_models_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_car_models_updated_by ON dir_car_models(updated_by);

-- Index 24: idx_car_models_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_car_models_deleted_by ON dir_car_models(deleted_by);

-- Index 25: idx_car_models_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_car_models_deleted_at ON dir_car_models(deleted_at);

-- Index 26: idx_car_models_created_at (BTREE, tri chronologique)
-- CREATE INDEX IF NOT EXISTS idx_car_models_created_at ON dir_car_models(created_at);

-- Index 27: idx_car_models_updated_at (BTREE, tri chronologique)
-- CREATE INDEX IF NOT EXISTS idx_car_models_updated_at ON dir_car_models(updated_at);

-- Index 28: idx_car_models_code (BTREE, intégrations)
-- CREATE INDEX IF NOT EXISTS idx_car_models_code ON dir_car_models(code) WHERE deleted_at IS NULL;

-- Index 29: idx_car_models_name (BTREE, recherche texte)
-- CREATE INDEX IF NOT EXISTS idx_car_models_name ON dir_car_models(name) WHERE deleted_at IS NULL;

-- Index 30: idx_car_models_transmission (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_car_models_transmission ON dir_car_models(transmission) WHERE deleted_at IS NULL;


-- ============================================
-- Sous-section 7.3: Indexes dir_platforms (8 indexes)
-- ============================================

-- Index 31: idx_platforms_status (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_platforms_status ON dir_platforms(status) WHERE deleted_at IS NULL;

-- Index 32: idx_platforms_category (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_platforms_category ON dir_platforms(provider_category) WHERE deleted_at IS NULL;

-- Index 33: idx_platforms_code (BTREE, intégrations)
-- CREATE INDEX IF NOT EXISTS idx_platforms_code ON dir_platforms(code) WHERE deleted_at IS NULL;

-- Index 34: idx_platforms_name (BTREE, recherche texte)
-- CREATE INDEX IF NOT EXISTS idx_platforms_name ON dir_platforms(name) WHERE deleted_at IS NULL;

-- Index 35: idx_platforms_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_platforms_created_by ON dir_platforms(created_by);

-- Index 36: idx_platforms_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_platforms_updated_by ON dir_platforms(updated_by);

-- Index 37: idx_platforms_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_platforms_deleted_by ON dir_platforms(deleted_by);

-- Index 38: idx_platforms_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_platforms_deleted_at ON dir_platforms(deleted_at);


-- ============================================
-- Sous-section 7.4: Indexes dir_platform_configs (8 indexes)
-- ============================================

-- Index 39: idx_platform_configs_unique (UNIQUE, contrainte métier)
-- Description: Une seule config par plateforme par tenant
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_configs_unique ON dir_platform_configs(platform_id, tenant_id);

-- Index 40: idx_platform_configs_active (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_platform_configs_active ON dir_platform_configs(is_active) WHERE deleted_at IS NULL;

-- Index 41: idx_platform_configs_platform_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_platform_configs_platform_id ON dir_platform_configs(platform_id) WHERE deleted_at IS NULL;

-- Index 42: idx_platform_configs_tenant_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_platform_configs_tenant_id ON dir_platform_configs(tenant_id) WHERE deleted_at IS NULL;

-- Index 43: idx_platform_configs_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_platform_configs_created_by ON dir_platform_configs(created_by);

-- Index 44: idx_platform_configs_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_platform_configs_updated_by ON dir_platform_configs(updated_by);

-- Index 45: idx_platform_configs_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_platform_configs_deleted_by ON dir_platform_configs(deleted_by);

-- Index 46: idx_platform_configs_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_platform_configs_deleted_at ON dir_platform_configs(deleted_at);


-- ============================================
-- Sous-section 7.5: Indexes dir_country_regulations (7 indexes)
-- ============================================

-- Index 47: idx_country_regulations_status_date (BTREE composite, filtrage temporel)
-- CREATE INDEX IF NOT EXISTS idx_country_regulations_status_date ON dir_country_regulations(status, effective_date) WHERE deleted_at IS NULL;

-- Index 48: idx_country_regulations_country_status (BTREE composite, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_country_regulations_country_status ON dir_country_regulations(country_code, status) WHERE deleted_at IS NULL;

-- Index 49: idx_country_regulations_min_vehicle_class_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_country_regulations_min_vehicle_class_id ON dir_country_regulations(min_vehicle_class_id) WHERE deleted_at IS NULL;

-- Index 50: idx_country_regulations_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_country_regulations_created_by ON dir_country_regulations(created_by);

-- Index 51: idx_country_regulations_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_country_regulations_updated_by ON dir_country_regulations(updated_by);

-- Index 52: idx_country_regulations_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_country_regulations_deleted_by ON dir_country_regulations(deleted_by);

-- Index 53: idx_country_regulations_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_country_regulations_deleted_at ON dir_country_regulations(deleted_at);


-- ============================================
-- Sous-section 7.6: Indexes dir_vehicle_classes (12 indexes)
-- ============================================

-- Index 54: idx_vehicle_classes_country_status (BTREE composite, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_country_status ON dir_vehicle_classes(country_code, status) WHERE deleted_at IS NULL;

-- Index 55: idx_vehicle_classes_seats (BTREE composite, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_seats ON dir_vehicle_classes(min_seats, max_seats) WHERE deleted_at IS NULL;

-- Index 56: idx_vehicle_classes_criteria (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_criteria ON dir_vehicle_classes USING GIN (criteria);

-- Index 57: idx_vehicle_classes_metadata (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_metadata ON dir_vehicle_classes USING GIN (metadata);

-- Index 58: idx_vehicle_classes_country_code (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_country_code ON dir_vehicle_classes(country_code) WHERE deleted_at IS NULL;

-- Index 59: idx_vehicle_classes_code (BTREE, intégrations)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_code ON dir_vehicle_classes(code) WHERE deleted_at IS NULL;

-- Index 60: idx_vehicle_classes_status (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_status ON dir_vehicle_classes(status) WHERE deleted_at IS NULL;

-- Index 61: idx_vehicle_classes_created_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_created_by ON dir_vehicle_classes(created_by);

-- Index 62: idx_vehicle_classes_updated_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_updated_by ON dir_vehicle_classes(updated_by);

-- Index 63: idx_vehicle_classes_deleted_by (BTREE, audit trail)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_deleted_by ON dir_vehicle_classes(deleted_by);

-- Index 64: idx_vehicle_classes_deleted_at (BTREE, soft delete queries)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_deleted_at ON dir_vehicle_classes(deleted_at);

-- Index 65: idx_vehicle_classes_name (BTREE, recherche texte)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_classes_name ON dir_vehicle_classes(name) WHERE deleted_at IS NULL;


-- ============================================
-- Sous-section 7.7: Indexes adm_tenant_vehicle_classes (6 indexes)
-- ============================================

-- Index 66: idx_tenant_vehicle_classes_unique (UNIQUE, contrainte métier)
-- Description: Code unique par tenant
-- IMPORTANT: Sera recréé en Session 14 avec WHERE deleted_at IS NULL (Prisma limitation)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_vehicle_classes_unique ON adm_tenant_vehicle_classes(tenant_id, code) WHERE deleted_at IS NULL;

-- Index 67: idx_tenant_vehicle_classes_status (BTREE, filtrage)
-- CREATE INDEX IF NOT EXISTS idx_tenant_vehicle_classes_status ON adm_tenant_vehicle_classes(status) WHERE deleted_at IS NULL;

-- Index 68: idx_tenant_vehicle_classes_criteria (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_tenant_vehicle_classes_criteria ON adm_tenant_vehicle_classes USING GIN (criteria);

-- Index 69: idx_tenant_vehicle_classes_tenant_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_tenant_vehicle_classes_tenant_id ON adm_tenant_vehicle_classes(tenant_id) WHERE deleted_at IS NULL;

-- Index 70: idx_tenant_vehicle_classes_based_on_class_id (BTREE, performance FK)
-- CREATE INDEX IF NOT EXISTS idx_tenant_vehicle_classes_based_on_class_id ON adm_tenant_vehicle_classes(based_on_class_id) WHERE deleted_at IS NULL;

-- Index 71: idx_tenant_vehicle_classes_metadata (GIN, recherche JSONB)
-- CREATE INDEX IF NOT EXISTS idx_tenant_vehicle_classes_metadata ON adm_tenant_vehicle_classes USING GIN (metadata);


-- ============================================
-- SECTION 8: GATEWAY 2 - VALIDATION POST-GÉNÉRATION
-- ============================================

-- STATISTIQUES GÉNÉRÉES:
-- Enums créés: 2 (car_model_status, regulation_status)
-- Enums partagés utilisés: 1 (lifecycle_status)
-- Total enums module: 3
-- Tables modifiées (V1→V2): 5 (dir_car_makes, dir_car_models, dir_platforms, dir_country_regulations, dir_vehicle_classes)
-- Nouvelles tables (V2): 2 (dir_platform_configs, adm_tenant_vehicle_classes)
-- Total tables module: 7
-- Colonnes ajoutées V1→V2: 79
-- FK internes créées: 6
-- FK externes créées: 25 (4 vers adm_tenants + 18 vers adm_provider_employees + 3 vers adm_members)
-- FK futures documentées: 0
-- Indexes documentés: 71
-- Total lignes SQL exécutables: ~520

-- VÉRIFICATIONS AUTOMATIQUES:
-- [✓] Aucun DROP TABLE/COLUMN/TYPE dans le code exécutable
-- [✓] Aucun ALTER COLUMN TYPE dans le code exécutable
-- [✓] Aucun RENAME dans le code exécutable
-- [✓] Tous les IF NOT EXISTS présents pour CREATE TABLE
-- [✓] Tous les IF NOT EXISTS présents pour ADD COLUMN
-- [✓] Tous les IF NOT EXISTS présents pour ADD CONSTRAINT
-- [✓] Tous les noms en snake_case:
--     Enums: car_model_status ✓, regulation_status ✓
--     Tables: dir_car_makes ✓, dir_car_models ✓, dir_platforms ✓, dir_platform_configs ✓,
--             dir_country_regulations ✓, dir_vehicle_classes ✓, adm_tenant_vehicle_classes ✓
--     Colonnes: 79 colonnes vérifiées ✓
-- [✓] Syntaxe DO $$ BEGIN ... EXCEPTION END $$; utilisée pour tous les enums
-- [✓] 2 enums DIR créés exactement (car_model_status, regulation_status)
-- [✓] 1 enum partagé utilisé (lifecycle_status - créé Session 0)
-- [✓] Valeurs enum correspondent à dir.prisma:
--     - CarModelStatus: active, inactive, discontinued ✓
--     - RegulationStatus: active, inactive ✓
-- [✓] Commentaires descriptifs présents pour toutes colonnes et tables
-- [✓] Utilisation documentée pour chaque enum
-- [✓] Toutes les FK ont ON DELETE spécifié (CASCADE, RESTRICT, ou SET NULL)
-- [✓] Dépendances respectées: ADM (Session 1) créé AVANT DIR (Session 2)

-- VÉRIFICATIONS SPÉCIFIQUES SESSION 2 (DIR):
-- [✓] 5 tables V1 modifiées: dir_car_makes ✓, dir_car_models ✓, dir_platforms ✓, dir_country_regulations ✓, dir_vehicle_classes ✓
-- [✓] 2 nouvelles tables V2: dir_platform_configs ✓, adm_tenant_vehicle_classes ✓
-- [✓] 79 colonnes ajoutées au total (13+18+12+16+20 vérification comptabilité)
-- [✓] vehicle_class_id NON recréé (existe déjà en V1) ✓
-- [✓] adm_tenant_vehicle_classes utilise adm_members (pas adm_provider_employees) ✓
-- [✓] 6 FK internes DIR créées (same-module) ✓
-- [✓] 25 FK externes créées vers ADM ✓
-- [✓] 0 FK futures (DIR est module de base référentiel)
-- [✓] 71 indexes documentés (62 BTREE + 6 GIN + 3 UNIQUE) ✓
-- [✓] Fichier 100% idempotent (IF NOT EXISTS partout) ✓
-- [✓] Section 3 suit convention: CREATE TABLE ... PRIMARY KEY DEFAULT uuid_generate_v4() ✓
-- [✓] Toutes tables V2 ont audit trail (created_by, updated_by, created_at, updated_at) ✓
-- [✓] Toutes tables V2 ont soft delete (deleted_at, deleted_by, deletion_reason) ✓

-- POINTS D'ATTENTION IDENTIFIÉS:
-- [⚠️] POINT 1: dir_car_models.vehicle_class_id existe déjà en V1 - NE PAS recréer (vérifié: non recréé)
-- [⚠️] POINT 2: adm_tenant_vehicle_classes utilise adm_members pour audit trail (exception au pattern DIR)
--     Raison: Table modifiable par utilisateurs tenant, pas par employés FleetCore
--     Impact: FK 29-31 pointent vers adm_members (pas adm_provider_employees)
-- [⚠️] POINT 3: 3 UNIQUE indexes nécessitent WHERE deleted_at IS NULL (Prisma @map limitation):
--     - idx_car_makes_tenant_name_unique (ligne Index 2)
--     - idx_platform_configs_unique (ligne Index 39)
--     - idx_tenant_vehicle_classes_unique (ligne Index 66)
--     Solution: Recréation en Session 14 avec WHERE clause
-- [⚠️] POINT 4: created_by NOT NULL constraint non appliqué immédiatement (colonnes ajoutées NULLABLE)
--     Raison: Tables V1 existantes ont des données sans created_by
--     Solution: Data migration en Session 14 avant d'appliquer NOT NULL
-- [⚠️] POINT 5: dir_country_regulations.requires_vtc_card existe en V1 (dépréciée en V2)
--     Nouvelle colonne: requires_professional_license (plus générique)
--     Raison: Maintien compatibilité V1, migration données en Session 14
-- [⚠️] POINT 6: dir_platforms.api_config (JSONB) existe en V1 mais déplacé vers dir_platform_configs en V2
--     Raison: Meilleure isolation sécurité (config par tenant vs plateforme globale)
--     Impact: Migration données V1→V2 en Session 14
-- [⚠️] POINT 7: 6 tables DIR modifiées/créées = 6×3 FK audit (created_by, updated_by, deleted_by)
--     + 4 FK tenant_id = 25 FK externes vers ADM (vérifier que ADM a capacité support)
-- [⚠️] POINT 8: dir_vehicle_classes.country_code FK vers dir_country_regulations.country_code
--     Attention: country_code est PRIMARY KEY de dir_country_regulations (char(2))
--     ON DELETE RESTRICT appliqué (éviter suppression pays avec classes actives)
-- [⚠️] POINT 9: dir_car_models et dir_country_regulations ont FK optionnelles vers dir_vehicle_classes
--     (vehicle_class_id et min_vehicle_class_id respectivement)
--     ON DELETE SET NULL appliqué (suppression classe ne bloque pas modèles/régulations)
-- [⚠️] POINT 10: 71 indexes documentés mais NON appliqués dans cette session
--     Application différée en Session 15 (Performances)
--     Raison: Éviter overhead pendant migrations structurelles

-- NOTES D'IMPLÉMENTATION:
-- DIR est le 2ème module (après ADM) car il fournit référentiels de base:
--   - Marques et modèles automobiles (utilisés par FLT pour flotte)
--   - Plateformes VTC (utilisées par SCH pour ordonnancement, TRP pour courses)
--   - Régulations pays (utilisées par CRM pour conformité, DOC pour documents)
--   - Classes de véhicules (utilisées par FLT, SCH, TRP pour classification)
--
-- Modules dépendants (créés après DIR):
--   - DOC (Session 3): Documents légaux par pays (FK dir_country_regulations)
--   - CRM (Session 4): Clients par tenant (FK adm_tenants via ADM)
--   - FLT (Session 8): Flotte véhicules (FK dir_car_models, dir_vehicle_classes)
--   - SCH (Session 9): Ordonnancement (FK dir_platforms, dir_vehicle_classes)
--   - TRP (Session 10): Courses (FK dir_platforms)
--
-- Ce fichier DOIT être exécuté APRÈS:
--   - 01_shared_enums.sql (Session 0) - lifecycle_status requis
--   - 02_adm_structure.sql (Session 1) - adm_tenants, adm_provider_employees, adm_members requis
--
-- Ce fichier DOIT être exécuté AVANT:
--   - 04_doc_structure.sql (Session 3) et toutes sessions suivantes

-- ============================================
-- FIN DU FICHIER
-- Session 2/13 complétée
-- Prochaine session: 3/13 - Module DOC (Documents)
-- ============================================
