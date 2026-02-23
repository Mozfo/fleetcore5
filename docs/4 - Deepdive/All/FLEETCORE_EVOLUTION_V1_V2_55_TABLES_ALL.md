# FLEETCORE - ÉVOLUTION MODÈLE V1 → V2 : ANALYSE COMPLÈTE DES 55 TABLES (VERSION MISE À JOUR FLEET)

**Date:** 19 Octobre 2025  
**Version:** 2.3 - Module Fleet détaillé (6 tables)  
**Source:** Document 0_All_tables_v1.md (6386 lignes) + analyses détaillées Fleet  
**Mise à jour:** Module Fleet avec évolutions complètes V2

---

Le document est une analyse EXHAUSTIVE du modèle de données complet, pas seulement d'un sous-ensemble.

---

## LES 55 TABLES EXISTANTES ANALYSÉES (MODÈLE V1) + MODELE V2

### ⚠️ Domaine Administration (8 tables) - CORRIGÉ

#### Table 1: `adm_tenants` - Multi-tenant renforcé

**Existant V1:**

- Isolation basique
- Pas de statut
- Contacts minimaux

**Évolutions V2:**

```sql
AJOUTER:
- status (enum) - active, trial, suspended, cancelled
- primary_contact_email (citext)
- primary_contact_phone (varchar)
- billing_email (citext)
- billing_config (jsonb)
- feature_flags (jsonb)
- subscription_plan_id (uuid)
- trial_ends_at (timestamp)
- suspended_at (timestamp)
- cancelled_at (timestamp)
```

#### Table 2: `adm_members` - Sécurité maximale

**Existant V1:**

- Auth Clerk simple
- Pas de 2FA
- Statuts limités

**Évolutions V2:**

```sql
AJOUTER:
- two_factor_enabled (boolean)
- two_factor_secret (text)
- two_factor_verified_at (timestamp)
- email_verified_at (timestamp)
- phone_verified_at (timestamp)
- status (enum) - invited, active, suspended, terminated
- last_login_at (timestamp)
- last_login_ip (inet)
- failed_login_attempts (integer)
- locked_until (timestamp)
```

#### Table 3: `adm_roles` - RBAC granulaire

**Existant V1:**

- Rôles simples
- Pas de hiérarchie
- Permissions texte

**Évolutions V2:**

```sql
AJOUTER:
- slug (varchar) - Identifiant stable
- parent_role_id (uuid) - Hiérarchie
- level (integer) - Niveau hiérarchique
- is_system (boolean) - Rôle système
- max_users (integer) - Limite utilisateurs

CRÉER TABLE adm_role_permissions:
- role_id (uuid)
- resource (varchar)
- action (varchar)
- conditions (jsonb)
- granted_by (uuid)
- granted_at (timestamp)
```

#### Table 4: `adm_member_roles` - Attribution contextuelle

**Existant V1:**

- Simple many-to-many
- Pas de contexte
- Pas de temporalité

**Évolutions V2:**

```sql
AJOUTER:
- assigned_by (uuid) - Traçabilité
- assignment_reason (text)
- valid_from (timestamp)
- valid_until (timestamp)
- is_primary (boolean)
- scope_type (enum) - global, branch, team
- scope_id (uuid) - Context
- priority (integer) - Résolution conflits
```

#### Table 5: `adm_audit_logs` - Conformité renforcée

**Existant V1:**

- Logs basiques
- JSON non structuré
- Pas de classification

**Évolutions V2:**

```sql
AJOUTER:
- severity (enum) - info, warning, error, critical
- category (enum) - security, financial, compliance, operational
- session_id (uuid) - Tracking session
- request_id (uuid) - Correlation
- old_values (jsonb) - Avant modification
- new_values (jsonb) - Après modification
- retention_until (timestamp) - RGPD
- tags (text[]) - Recherche

CRÉER INDEX:
- btree (category, severity, timestamp)
- gin (tags)
```

#### Table 6: `adm_provider_employees` - Staff Provider

**Rôle critique:**

- Gestion cross-tenant pour support
- Permissions spéciales système
- Séparation claire provider/client

**Structure complète V2:**

```sql
STRUCTURE:
- id (uuid)
- employee_number (varchar) - ID interne
- clerk_user_id (varchar) - Auth
- first_name, last_name
- email (citext) - Unique
- department (enum) - support, tech, finance, sales
- title (varchar)
- role (enum) - support_agent, admin, super_admin
- permissions (jsonb) - Spécifiques

PERMISSIONS SPÉCIALES:
- can_impersonate (boolean)
- can_override_limits (boolean)
- accessible_tenants (uuid[] ou ALL)
- max_support_tickets (integer)

TRACKING RH:
- hire_date (date)
- termination_date (date)
- contract_type (enum)
- supervisor_id (uuid)
- last_activity_at (timestamp)
```

#### Table 7: `adm_tenant_lifecycle_events` - Historique critique

**Rôle crucial:**

- Trace tous changements tenant
- Déclenche automatisations
- Base pour facturation

**Structure complète V2:**

```sql
STRUCTURE:
- id (uuid)
- tenant_id (uuid)
- event_type (enum) EXHAUSTIF:
  * created, trial_started, trial_extended
  * activated, plan_upgraded, plan_downgraded
  * suspended, reactivated
  * cancelled, archived, deleted
- event_date (timestamp)
- effective_date (timestamp)
- performed_by (uuid) - Employee ou system
- performed_by_type (enum) - system, employee, api

CONTEXTE:
- reason (text) - Obligatoire
- previous_status (varchar)
- new_status (varchar)
- previous_plan_id (uuid)
- new_plan_id (uuid)
- related_invoice_id (uuid)
- support_ticket_id (uuid)

IMPACT:
- features_affected (jsonb)
- users_notified (uuid[])
- notifications_sent (jsonb)
- next_action_required (varchar)
- next_action_date (timestamp)
```

#### Table 8: `adm_invitations` - Onboarding sécurisé

**Rôle essentiel:**

- Contrôle accès nouveaux users
- Traçabilité complète
- Sécurité renforcée

**Structure complète V2:**

```sql
STRUCTURE:
- id (uuid)
- tenant_id (uuid)
- email (citext)
- token (varchar) - Unique, sécurisé
- role (varchar) - Rôle proposé
- expires_at (timestamp) - 72h défaut
- status (enum) - pending, accepted, expired, revoked

TRACKING:
- sent_at (timestamp)
- sent_count (integer) - Renvois
- last_sent_at (timestamp)
- accepted_at (timestamp)
- accepted_from_ip (inet)
- accepted_by_member_id (uuid)

CONTEXTE:
- invitation_type (enum):
  * initial_admin
  * additional_user
  * role_change
  * reactivation
- custom_message (text)
- metadata (jsonb)
- sent_by (uuid) - Provider employee
```

### ⚠️ Domaine Directory (5 tables) - DÉTAIL COMPLET

#### Table 9: `dir_car_makes` - Marques véhicules

**Existant V1:**

- id (uuid) - Identifiant unique
- tenant_id (uuid nullable) - NULL = marque globale
- name (text) - Nom de la marque
- created_at, updated_at - Timestamps basiques
- Index unique sur (tenant_id, name) WHERE deleted_at IS NULL

**Évolutions V2 nécessaires:**

```
AJOUTER:
- code (varchar(50)) - Identifiant stable pour intégrations
- country_of_origin (char(2)) - Pays d'origine constructeur
- parent_company (varchar(100)) - Groupe industriel parent
- founded_year (integer) - Année de fondation
- logo_url (text) - URL logo pour affichage
- status (enum) - active, inactive, deprecated
- metadata (jsonb) - Données extensibles
- created_by (uuid) - Traçabilité création
- updated_by (uuid) - Traçabilité modification
- deleted_at, deleted_by, deletion_reason - Suppression logique

CRÉER INDEX:
- btree (status) WHERE deleted_at IS NULL
- btree (country_of_origin)
- gin (metadata)
```

#### Table 10: `dir_car_models` - Modèles par marque

**Existant V1:**

- id (uuid) - Identifiant unique
- tenant_id (uuid nullable) - Scope tenant ou global
- make_id (uuid) - FK vers dir_car_makes
- name (varchar(100)) - Nom du modèle
- vehicle_class (varchar(50)) - Classe optionnelle
- created_at, updated_at - Timestamps

**Évolutions V2 nécessaires:**

```
AJOUTER:
- code (varchar(50)) - Code modèle constructeur
- year_start (integer) - Année début production
- year_end (integer) - Année fin production
- body_type (varchar(50)) - berline, SUV, van, limousine
- fuel_type (varchar(50)) - essence, diesel, hybride, électrique
- transmission (varchar(50)) - manuelle, automatique
- seats_min (integer) - Nombre places minimum
- seats_max (integer) - Nombre places maximum
- length_mm (integer) - Longueur en millimètres
- width_mm (integer) - Largeur en millimètres
- height_mm (integer) - Hauteur en millimètres
- metadata (jsonb) - Spécifications additionnelles
- status (enum) - active, inactive, discontinued
- Champs audit et suppression logique

MODIFIER:
- vehicle_class → vehicle_class_id (uuid) - FK vers dir_vehicle_classes

CRÉER INDEX:
- btree (body_type, fuel_type)
- btree (year_start, year_end)
- gin (metadata)
```

#### Table 11: `dir_platforms` - Uber, Bolt, etc.

**Existant V1:**

- id (uuid) - Identifiant unique
- name (varchar(100)) - Nom plateforme
- api_config (jsonb) - Configuration API en JSON libre
- created_at, updated_at - Timestamps
- Pas de tenant_id (table globale)

**Évolutions V2 nécessaires:**

```
AJOUTER:
- code (varchar(50)) - Identifiant stable (uber, bolt, careem)
- description (text) - Description détaillée
- logo_url (text) - URL logo plateforme
- provider_category (varchar(50)) - ride_hailing, delivery, scooter
- supported_countries (jsonb) - Liste pays où disponible
- status (enum) - active, inactive, deprecated
- metadata (jsonb) - Configuration extensible
- created_by, updated_by - Références vers adm_provider_employees
- deleted_at, deleted_by, deletion_reason - Suppression logique
```

```

#### Table 12: `dir_platform_configs`

CRÉER TABLE 'dir_platform_configs' :
- id (uuid)
- platform_id (uuid) - FK vers dir_platforms
- tenant_id (uuid) - Configuration par tenant
- api_base_url (text)
- auth_method (varchar(50)) - oauth2, api_key, jwt
- api_version (varchar(20))
- refresh_frequency_minutes (integer)
- webhook_endpoints (jsonb)
- supported_services (jsonb) - transport, delivery, etc
- sandbox_config (jsonb) - Config environnement test
- production_config (jsonb) - Config production
- secrets_vault_ref (varchar(100)) - Référence coffre-fort

DÉPLACER:
- api_config → dir_platform_configs (structuré et sécurisé)
```

#### Table 13: `dir_country_regulations` - Règles par pays

**Existant V1:**

- country_code (char(2)) - Code pays ISO (PK)
- vehicle_max_age (integer) - Âge max véhicule
- min_vehicle_class (varchar(50)) - Classe min en texte
- requires_vtc_card (boolean) - Carte VTC requise
- min_fare_per_trip/km/hour (decimal) - Tarifs minimums
- vat_rate (decimal) - Taux TVA
- currency (char(3)) - Devise
- timezone (varchar(50)) - Fuseau horaire
- metadata (jsonb) - Données additionnelles

**Évolutions V2 nécessaires:**

```
AJOUTER:
- min_vehicle_class_id (uuid) - FK vers dir_vehicle_classes (remplace texte)
- min_vehicle_length_cm (integer) - Longueur minimale
- min_vehicle_width_cm (integer) - Largeur minimale
- min_vehicle_height_cm (integer) - Hauteur minimale
- max_vehicle_weight_kg (integer) - Poids maximal
- max_vehicle_mileage_km (integer) - Kilométrage maximal
- requires_professional_license (boolean) - Remplace requires_vtc_card
- required_documents (jsonb) - Liste documents obligatoires structurée
- effective_date (date) - Date début application
- expiry_date (date) - Date fin application
- status (enum) - active, inactive
- created_by, updated_by - Audit
- deleted_at, deleted_by - Suppression logique

MODIFIER:
- requires_vtc_card → requires_professional_license (plus générique)
- min_vehicle_class → min_vehicle_class_id (FK au lieu de texte)

CRÉER INDEX:
- btree (status, effective_date)
- btree (country_code, status) WHERE deleted_at IS NULL
```

#### Table 14: `dir_vehicle_classes` - Classes véhicules

**Existant V1:**

- id (uuid) - Identifiant unique
- country_code (char(2)) - FK vers dir_country_regulations
- name (varchar(50)) - Nom de la classe
- description (text) - Description optionnelle
- max_age (integer) - Âge maximal autorisé
- created_at, updated_at - Timestamps

**Évolutions V2 nécessaires:**

```
AJOUTER:
- code (varchar(50)) - Identifiant stable (sedan, suv, luxury)
- min_length_cm (integer) - Longueur minimale
- max_length_cm (integer) - Longueur maximale
- min_width_cm (integer) - Largeur minimale
- max_width_cm (integer) - Largeur maximale
- min_height_cm (integer) - Hauteur minimale
- max_height_cm (integer) - Hauteur maximale
- min_seats (integer) - Places minimum
- max_seats (integer) - Places maximum
- min_age (integer) - Âge minimum véhicule (nouveau)
- min_weight_kg (integer) - Poids minimum
- max_weight_kg (integer) - Poids maximum
- criteria (jsonb) - Critères additionnels extensibles
- status (enum) - active, inactive, deprecated
- metadata (jsonb) - Métadonnées libres
- created_by, updated_by - Références adm_provider_employees
- deleted_at, deleted_by, deletion_reason - Suppression logique


#### Table 15: `adm_tenant_vehicle_classes`

CRÉER TABLE adm_tenant_vehicle_classes:
- id (uuid)
- tenant_id (uuid) - FK vers adm_tenants
- code (varchar(50))
- name (varchar(100))
- description (text)
- criteria (jsonb) - Critères personnalisés
- based_on_class_id (uuid) - Hérite d'une classe standard
- status (enum)
- metadata (jsonb)
- Champs audit complets

CRÉER INDEX:
- btree (country_code, status)
- btree (min_seats, max_seats)
- gin (criteria)
```

### 📄 Domaine Documents (1→4 tables) - ENRICHI

**Table Existante (1 table)**

#### Table 16: `doc_documents` - Évolutions majeures (table existante)

**Existant V1:**

- Stockage polymorphe basique (10 champs)
- entity_type et document_type en CHECK constraints
- Vérification binaire (verified boolean)
- Pas de métadonnées fichier
- Pas d'audit trail complet
- Pas de soft-delete
- file_url simple (pas de gestion provider)

**Évolutions V2:**

```sql
AJOUTER - Métadonnées Fichier:
- file_name (varchar 255) - Nom original
- file_size (integer) - Taille en bytes
- mime_type (varchar 100) - Type MIME (image/jpeg, application/pdf)
- metadata (jsonb) - Métadonnées extensibles

MODIFIER - Vérification Enrichie:
- REMPLACER verified (boolean)
  PAR verification_status (enum):
    * pending - En attente vérification
    * verified - Vérifié et validé
    * rejected - Rejeté non conforme
- verified_by (uuid) - FK → adm_members OU adm_provider_employees
- verified_at (timestamptz) - Quand vérifié
- rejection_reason (text) - Motif rejet si rejected

AJOUTER - Soft-delete et Audit:
- deleted_at (timestamptz) - Suppression logique
- deleted_by (uuid) - Qui a supprimé
- deletion_reason (text) - Pourquoi supprimé
- created_by (uuid) - FK → adm_members
- updated_by (uuid) - FK → adm_members

MODIFIER - Gestion Stockage:
- REMPLACER file_url (text)
  PAR storage_key (text) - Clé dans le provider
- storage_provider (varchar 50) - supabase, s3, azure_blob, gcs
  DEFAULT 'supabase'
- access_level (enum) - private, public, signed
  DEFAULT 'private'

AJOUTER - Status et Notifications:
- status (enum) - active, expired, archived
  DEFAULT 'active'
- expiry_notification_sent (boolean) - Rappel envoyé
  DEFAULT false

REMPLACER - Contraintes Type:
- entity_type: SUPPRIMER CHECK constraint
  AJOUTER FK → doc_entity_types(code)
- document_type: SUPPRIMER CHECK constraint
  AJOUTER FK → doc_document_types(code)

CRÉER INDEX:
- btree (verification_status) WHERE deleted_at IS NULL
- btree (status) WHERE deleted_at IS NULL
- btree (expiry_date) WHERE deleted_at IS NULL AND status = 'active'
- btree (storage_provider, storage_key)
- gin (metadata)
```

**Contraintes uniques étendues:**

```sql
UNIQUE (tenant_id, entity_type, entity_id, document_type, storage_key)
WHERE deleted_at IS NULL
```

---

#### Table 17: `doc_document_types` - Référentiel types documents (NOUVELLE)

**Rôle:**

- Normaliser les types de documents
- Permettre ajout dynamique de nouveaux types
- Éviter CHECK constraints en dur
- Configurer validation et expiration

**Structure complète V2:**

```sql
CREATE TABLE doc_document_types (
  code varchar(50) PRIMARY KEY,
  name text NOT NULL,
  description text NULL,

  -- Configuration
  requires_expiry (boolean) NOT NULL DEFAULT false,
  default_validity_days (integer) NULL,
  requires_verification (boolean) NOT NULL DEFAULT true,
  allowed_mime_types (text[]) NULL,
  max_file_size_mb (integer) NULL DEFAULT 10,

  -- Métadonnées
  category (varchar 50) NULL, -- legal, identity, vehicle, financial
  is_mandatory (boolean) NOT NULL DEFAULT false,
  display_order (integer) NOT NULL DEFAULT 0,
  icon (varchar 50) NULL,

  -- Audit trail complet
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_provider_employees(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_provider_employees(id),
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_provider_employees(id),
  deletion_reason text NULL
);

-- Index
CREATE INDEX doc_document_types_category_idx
  ON doc_document_types(category) WHERE deleted_at IS NULL;
CREATE INDEX doc_document_types_deleted_at_idx
  ON doc_document_types(deleted_at);

-- Valeurs initiales
INSERT INTO doc_document_types (code, name, category, requires_expiry, default_validity_days) VALUES
  ('registration', 'Carte grise', 'vehicle', true, 365),
  ('insurance', 'Assurance', 'vehicle', true, 365),
  ('visa', 'Visa', 'identity', true, 180),
  ('residence_visa', 'Visa de résidence', 'identity', true, 365),
  ('emirates_id', 'Emirates ID', 'identity', true, 730),
  ('driver_license', 'Permis de conduire', 'identity', true, 1825),
  ('platform_approval', 'Homologation plateforme', 'vehicle', true, 365),
  ('contract', 'Contrat', 'legal', false, NULL),
  ('invoice', 'Facture', 'financial', false, NULL),
  ('other', 'Autre', NULL, false, NULL);
```

---

#### Table 18: `doc_entity_types` - Référentiel entités supportées (NOUVELLE)

**Rôle:**

- Définir quelles entités peuvent avoir des documents
- Permettre extension dynamique
- Documenter les relations polymorphes

**Structure complète V2:**

```sql
CREATE TABLE doc_entity_types (
  code varchar(50) PRIMARY KEY,
  description text NOT NULL,
  table_name varchar(100) NOT NULL,

  -- Configuration
  is_active (boolean) NOT NULL DEFAULT true,
  display_order (integer) NOT NULL DEFAULT 0,

  -- Métadonnées
  metadata jsonb NOT NULL DEFAULT '{}',

  -- Audit trail complet
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_provider_employees(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_provider_employees(id),
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_provider_employees(id)
);

-- Index
CREATE INDEX doc_entity_types_deleted_at_idx
  ON doc_entity_types(deleted_at);

-- Valeurs initiales
INSERT INTO doc_entity_types (code, description, table_name) VALUES
  ('flt_vehicle', 'Véhicule', 'flt_vehicles'),
  ('rid_driver', 'Chauffeur', 'rid_drivers'),
  ('adm_member', 'Membre', 'adm_members'),
  ('contract', 'Contrat', 'crm_contracts'),
  ('flt_maintenance', 'Maintenance', 'flt_vehicle_maintenance'),
  ('bil_invoice', 'Facture SaaS', 'bil_tenant_invoices'),
  ('sup_ticket', 'Ticket support', 'sup_tickets'),
  ('fin_transaction', 'Transaction', 'fin_transactions');
```

---

#### Table 19: `doc_document_versions` - Historique versionnement (NOUVELLE)

**Rôle:**

- Garder historique complet de chaque document
- Tracer qui a modifié quoi et quand
- Permettre rollback si nécessaire
- Conformité audit trail

**Structure complète V2:**

```sql
CREATE TABLE doc_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES doc_documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,

  -- Snapshot complet
  storage_provider varchar(50) NOT NULL,
  storage_key text NOT NULL,
  file_name varchar(255) NOT NULL,
  file_size integer NOT NULL,
  mime_type varchar(100) NOT NULL,

  -- Dates
  issue_date date NULL,
  expiry_date date NULL,

  -- Vérification snapshot
  verification_status varchar(20) NOT NULL,
  verified_by uuid NULL,
  verified_at timestamptz NULL,
  rejection_reason text NULL,

  -- Métadonnées snapshot
  metadata jsonb NOT NULL DEFAULT '{}',

  -- Qui et quand
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES adm_members(id),
  change_reason text NULL,

  -- Contrainte unique
  UNIQUE (document_id, version_number)
);

-- Index
CREATE INDEX doc_document_versions_document_id_idx
  ON doc_document_versions(document_id);
CREATE INDEX doc_document_versions_created_at_idx
  ON doc_document_versions(created_at);
CREATE INDEX doc_document_versions_verification_status_idx
  ON doc_document_versions(verification_status);
```

### ⚠️ Domaine Fleet (6 tables) - DÉTAIL COMPLET V2

#### Table 20: `flt_vehicles` - Véhicules de la flotte

**Existant V1 (32 colonnes):**

- id, tenant_id - Identifiants et multi-tenant
- make_id, model_id - FK vers marques et modèles
- license_plate, vin - Identification véhicule
- year, color, seats - Caractéristiques basiques
- vehicle_class, fuel_type, transmission - Types (texte libre)
- registration_date, insurance_expiry - Dates clés
- last_inspection, next_inspection - Inspections
- odometer, ownership_type, status - État et propriété
- metadata - Données extensibles
- created_at, updated_at, deleted_at - Audit basique

**Évolutions V2 nécessaires (48 colonnes totales):**

```
AJOUTER CONFORMITÉ MULTI-PAYS:
- country_code (char(2)) - Pays d'opération du véhicule
- requires_professional_license (boolean) - Permis spécial requis
- documents_status (jsonb) - Statut documents par type

AJOUTER DIMENSIONS PHYSIQUES:
- body_type (varchar(20)) - Type carrosserie précis
- passenger_capacity (integer) - Capacité passagers réglementaire
- car_length_cm (integer) - Longueur pour éligibilité
- car_width_cm (integer) - Largeur pour parkings
- car_height_cm (integer) - Hauteur pour restrictions

AJOUTER MAINTENANCE PRÉDICTIVE:
- first_registration_date (date) - Première immatriculation
- warranty_expiry (date) - Fin garantie constructeur
- service_interval_km (integer) - Intervalle maintenance
- next_service_at_km (integer) - Prochain service kilométrique

AJOUTER ASSURANCE DÉTAILLÉE:
- insurance_policy_number (text) - Numéro police
- insurance_coverage_type (text) - Type couverture
- insurance_amount (numeric(18,2)) - Montant assuré
- insurance_issue_date (date) - Date émission police

AJOUTER PROPRIÉTÉ ET FINANCE:
- owner_id (uuid) - FK vers propriétaire/investisseur
- acquisition_date (date) - Date acquisition
- lease_end_date (date) - Fin leasing si applicable
- residual_value (numeric(18,2)) - Valeur résiduelle

AJOUTER TRAÇABILITÉ:
- status_changed_at (timestamptz) - Date changement statut
- created_by, updated_by, deleted_by - Traçabilité complète
- deletion_reason (text) - Motif suppression

MODIFIER:
- status → FK vers dir_vehicle_statuses
- ownership_type → FK vers dir_ownership_types
- vehicle_class → vehicle_class_id (FK)

CRÉER TABLES SATELLITES:
1. flt_vehicle_inspections - Historique inspections
2. flt_vehicle_equipments - Équipements fournis
3. dir_vehicle_statuses - Référentiel statuts
4. dir_ownership_types - Types propriété
```

#### Table 21: `flt_vehicle_assignments` - Affectations véhicule-driver

**Existant V1 (12 colonnes):**

- id, tenant_id - Base multi-tenant
- driver_id, vehicle_id - Liens principaux
- start_date, end_date - Période affectation
- assignment_type - permanent/temporary
- status - active/inactive
- metadata - Données additionnelles
- Champs audit basiques

**Évolutions V2 nécessaires (24 colonnes):**

```
AJOUTER WORKFLOW HANDOVER COMPLET:
- handover_date (timestamptz) - Date/heure remise exacte
- handover_location (text) - Lieu de remise GPS
- handover_type (varchar) - pickup/return/transfer

ÉTAT INITIAL VÉHICULE:
- initial_odometer (integer) - Km début
- initial_fuel_level (integer) - Carburant début (%)
- initial_condition (jsonb) - État détaillé structuré:
  * exterior: {scratches[], dents[], damage[]}
  * interior: {cleanliness, seats, equipment}
  * mechanical: {engine, transmission, brakes}

PROTOCOLE PHOTOS:
- handover_photos (jsonb[]) - 6 photos obligatoires:
  * front, rear, left, right (extérieur)
  * dashboard (compteur kilométrique)
  * interior (état général)
- photos_metadata (jsonb) - timestamp, GPS, device

VALIDATION DIGITALE:
- driver_signature (text) - Signature digitale driver base64
- fleet_signature (text) - Signature agent flotte base64
- handover_checklist (jsonb) - Points vérifiés:
  * documents: {license, insurance, registration}
  * equipment: {spare_tire, jack, warning_triangle}
  * condition: {clean, fueled, functional}

RETOUR VÉHICULE:
- return_date (timestamptz) - Date retour effectif
- return_odometer (integer) - Km fin
- return_fuel_level (integer) - Carburant fin
- return_condition (jsonb) - État retour structuré
- damages_reported (jsonb) - Dommages constatés détaillés
- penalty_amount (numeric) - Pénalités calculées auto

WORKFLOW 5 ÉTAPES:
1. Pre-checks (documents, maintenance OK)
2. Photo capture (6 angles horodatés)
3. Condition record (état complet)
4. Double signature digitale
5. System actions (activation, baseline)
```

#### Table 22: `flt_vehicle_events` - Événements lifecycle

**Existant V1 (16 colonnes):**

- id, tenant_id, vehicle_id - Identification
- event_type - CHECK IN (7 types)
- event_date - Date événement
- severity - Pour accidents (minor→total_loss)
- downtime_hours - Immobilisation
- cost_amount, currency - Coûts
- details, notes - Informations libres
- Champs audit

**Évolutions V2 nécessaires (22 colonnes):**

```
AJOUTER RESPONSABILITÉS ET LIENS:
- driver_id (uuid) - Driver impliqué dans l'événement
- ride_id (uuid) - Course concernée (pour accidents)
- assignment_id (uuid) - Affectation active

GESTION RESPONSABILITÉ:
- responsible_party (varchar(20)) - fleet/driver/third_party
- fault_percentage (integer) - % responsabilité (0-100)
- liability_assessment (jsonb) - Détail évaluation

GESTION SINISTRES:
- police_report_number (text) - Référence rapport police
- police_station (text) - Commissariat
- insurance_claim_id (uuid) - Dossier assurance
- claim_status (varchar) - filed/processing/approved/rejected

GESTION RÉPARATIONS:
- repair_status (varchar(20)) - pending/approved/in_progress/completed
- repair_shop_id (uuid) - Atelier réparation
- estimated_repair_days (integer) - Durée prévue
- actual_repair_days (integer) - Durée réelle
- repair_invoice_id (uuid) - Facture réparation

ENRICHIR TYPES:
- event_type → Ajouter:
  * 'violation' (infraction code route)
  * 'recovery' (récupération vol)
  * 'impound' (mise fourrière)
  * 'theft' (vol déclaré)

STRUCTURER DÉTAILS:
- details → Structure par type événement
- photos (jsonb[]) - Photos accident/état
```

#### Table 23: `flt_vehicle_maintenance` - Maintenances planifiées

**Existant V1 (19 colonnes):**

- Planification basique (scheduled_date, status)
- Types maintenance (7 types CHECK)
- Provider info texte libre
- Coût global non ventilé
- Notes et metadata

**Évolutions V2 nécessaires (32 colonnes):**

```
CATÉGORISATION AVANCÉE:
- maintenance_category (varchar) - preventive/corrective/regulatory
- priority (varchar) - low/medium/high/urgent/emergency
- regulatory_requirement (boolean) - Obligatoire légalement
- blocking_vehicle (boolean) - Véhicule immobilisé

GESTION GARANTIES:
- warranty_covered (boolean) - Sous garantie constructeur
- warranty_claim_number (text) - Référence dossier garantie
- warranty_amount (numeric) - Montant couvert garantie
- insurance_covered (boolean) - Couvert par assurance
- insurance_claim_ref (text) - Référence assurance

WORKFLOW VALIDATION:
- requested_by (uuid) - Demandeur (driver/fleet)
- requested_at (timestamptz) - Date demande
- approved_by (uuid) - Manager validateur
- approved_at (timestamptz) - Date validation
- approval_notes (text) - Commentaires validation

VENTILATION COÛTS:
- labor_hours (numeric) - Heures main d'œuvre
- labor_rate (numeric) - Taux horaire MO
- labor_cost (numeric) - Coût MO total
- parts_cost (numeric) - Coût pièces total
- other_costs (numeric) - Autres frais
- tax_amount (numeric) - TVA
- total_cost_excl_tax (numeric) - HT
- total_cost_incl_tax (numeric) - TTC

DÉTAIL PIÈCES:
- parts_detail (jsonb[]) - Liste structurée:
  * part_number, description
  * quantity, unit_price
  * supplier, warranty_months

GESTION ATELIER:
- garage_id (uuid) - FK garage homologué
- work_order_number (text) - Numéro ordre travail
- mechanic_name (text) - Technicien responsable
- mechanic_certification (text) - Qualification
- quality_check_by (uuid) - Contrôleur qualité
- quality_check_at (timestamptz) - Date contrôle

PÉRIODES BLOCAGE:
- blocked_periods (tsrange[]) - Indisponibilités
- actual_start (timestamptz) - Début réel
- actual_end (timestamptz) - Fin réelle

WORKFLOW 5 PHASES:
1. Création (planifiée/urgente/obligatoire)
2. Validation (devis, délais, garage)
3. Exécution (suivi temps réel)
4. Contrôle qualité (vérification travaux)
5. Clôture (paiement, màj véhicule)
```

#### Table 24: `flt_vehicle_expenses` - Dépenses opérationnelles

**Existant V1 (24 colonnes):**

- Catégories (fuel, toll, parking, wash, repair, fine, other)
- Liens driver/ride optionnels
- Receipt URL et remboursement basique
- Metadata extensible

**Évolutions V2 nécessaires (35 colonnes):**

```
CATÉGORISATION DÉTAILLÉE:
- expense_category → Enrichir avec:
  * 'insurance_deductible' - Franchise
  * 'registration' - Immatriculation
  * 'inspection' - Contrôle technique
  * 'permit' - Permis/autorisations
- expense_subcategory (varchar) - Sous-catégorie détaillée

LIENS MULTIPLES:
- trip_ids (uuid[]) - Courses multiples concernées
- period_start (date) - Début période (abonnements)
- period_end (date) - Fin période
- mileage_start (integer) - Km début (trajets)
- mileage_end (integer) - Km fin

CIRCUIT VALIDATION:
- requires_approval (boolean) - Validation requise
- approval_threshold (numeric) - Seuil automatique
- approval_status (varchar) - pending/approved/rejected/cancelled
- approved_by (uuid) - Manager validateur
- approved_at (timestamptz) - Date validation
- rejection_reason (text) - Motif rejet

VÉRIFICATION JUSTIFICATIFS:
- receipt_status (varchar) - pending/verified/invalid
- receipt_verified_by (uuid) - Contrôleur
- receipt_verified_at (timestamptz) - Date vérification
- receipt_issues (jsonb) - Problèmes détectés
- ocr_extracted_data (jsonb) - Données OCR

ALLOCATION COÛTS:
- allocation_rule (varchar) - driver/fleet/shared/client
- driver_share_percent (integer) - % charge driver
- fleet_share_percent (integer) - % charge flotte
- client_share_percent (integer) - % charge client
- cost_center_id (uuid) - Centre de coût

REMBOURSEMENT AUTOMATISÉ:
- payment_batch_id (uuid) - Lot paiement
- payment_status (varchar) - pending/processed/failed
- payment_date (date) - Date paiement effectif
- payment_reference (text) - Référence virement

WORKFLOW 5 ÉTAPES:
1. Soumission (upload receipt + infos)
2. Vérification (OCR scan montants)
3. Validation (seuils auto/manuel)
4. Allocation (règles répartition)
5. Remboursement (batch hebdo)
```

#### Table 25: `flt_vehicle_insurances` - Polices d'assurance

**Existant V1 (26 colonnes):**

- Une police par véhicule
- Informations basiques (dates, prime, franchise)
- Contact assureur texte libre
- Claim count simple

**Évolutions V2 nécessaires (38 colonnes):**

```
MULTI-POLICES:
- policy_category (varchar) - main/supplementary/temporary/rider
- policy_priority (integer) - Ordre application
- parent_policy_id (uuid) - Police principale si avenant

COUVERTURE DÉTAILLÉE:
- coverage_territories (text[]) - Pays couverts
- coverage_drivers (varchar) - named/any/professional
- driver_restrictions (jsonb) - Restrictions détaillées:
  * min_age, min_experience
  * max_claims, license_types
- vehicle_usage (varchar) - commercial/private/mixed

FRANCHISES STRUCTURÉES:
- excess_details (jsonb) - Par type sinistre:
  * collision: {amount, waived_if}
  * theft: {amount, conditions}
  * glass: {amount, coverage}
  * natural: {amount, events[]}

BONUS/MALUS:
- no_claims_years (integer) - Années sans sinistre
- no_claims_bonus (integer) - Bonus en %
- claims_loading (integer) - Malus en %
- base_premium (numeric) - Prime de base
- final_premium (numeric) - Prime après bonus/malus

HISTORIQUE SINISTRES:
- claims_detail (jsonb[]) - Liste structurée:
  * date, type, amount
  * fault_percentage, status
  * impact_on_premium
- total_claims_amount (numeric) - Cumul sinistres
- claims_ratio (numeric) - Ratio S/P

GESTION RISQUE:
- risk_rating (varchar) - A/B/C/D score assureur
- risk_factors (jsonb) - Facteurs évaluation
- special_conditions (jsonb) - Conditions particulières
- exclusions (jsonb[]) - Exclusions spécifiques

GESTION COURTIER:
- broker_id (uuid) - FK courtier gestionnaire
- broker_commission (numeric) - Commission %
- broker_reference (text) - Référence dossier

RENOUVELLEMENT:
- renewal_date (date) - Date renouvellement
- renewal_notice_sent (boolean) - Préavis envoyé
- renewal_quote (numeric) - Devis renouvellement
- competitor_quotes (jsonb[]) - Devis concurrents

PAIEMENTS:
- payment_frequency (varchar) - annual/semi/quarterly/monthly
- payment_method (varchar) - direct_debit/transfer/card
- payment_schedule (jsonb[]) - Échéancier détaillé
- next_payment_date (date) - Prochaine échéance
- outstanding_amount (numeric) - Impayé

CO-ASSURANCE:
- co_insurance (boolean) - Multiple assureurs
- co_insurers (jsonb[]) - Liste co-assureurs
- lead_insurer (varchar) - Apériteur

WORKFLOW SINISTRES:
1. Déclaration (driver/fleet → assureur)
2. Instruction (expertise, responsabilité)
3. Négociation (montants, franchises)
4. Règlement (réparation/indemnisation)
5. Impact (maj prime, bonus/malus)
```

### Domaine Drivers (7 tables)

#### Table 26: `rid_drivers` - Conducteurs (table principale)

**Existant V1:**

- Informations basiques (nom, prénom, email, téléphone)
- Permis et carte professionnelle
- Statut simple (active, suspended, terminated)
- Rating moyenne optionnel
- Notes texte libre

**Évolutions V2:**

```sql
AJOUTER:
-- Conformité UAE (OBLIGATOIRE)
- date_of_birth (date) NOT NULL - Âge minimum légal
- place_of_birth (varchar(100)) - Traçabilité origine
- nationality (char(2)) - Code pays ISO
- emirates_id (varchar(50)) - ID national UAE
- emirates_id_expiry (date) - Validation documents

-- Séparation noms et génération
- full_name (text) GENERATED - Recherche facilitée
- preferred_name (varchar(100)) - Nom d'usage

-- Contact détaillé
- secondary_phone (varchar(20)) - Contact urgence
- emergency_contact_name (varchar(100))
- emergency_contact_phone (varchar(20))
- emergency_contact_relation (varchar(50))

-- Adresse complète
- address_line1 (text)
- address_line2 (text)
- city (varchar(100))
- state (varchar(100))
- postal_code (varchar(20))
- country_code (char(2))

-- Banque et paiements WPS
- bank_name (varchar(100))
- bank_account_number (varchar(50))
- bank_iban (varchar(34))
- bank_swift_code (varchar(11))
- preferred_payment_method (enum) - bank_transfer, cash, mobile_wallet
- wps_eligible (boolean) DEFAULT false - UAE Wage Protection System

-- Suivi activité
- onboarded_at (timestamp) - Date entrée effective
- last_active_at (timestamp) - Dernière activité plateforme
- total_trips_completed (integer) DEFAULT 0 - Compteur global
- lifetime_earnings (decimal(18,2)) DEFAULT 0 - Revenus totaux

-- Statut enrichi
- suspension_reason (text) - Motif suspension détaillé
- suspension_start_date (date)
- suspension_end_date (date)
- termination_reason (text) - Motif départ
- termination_date (date)
- rehire_eligible (boolean) DEFAULT true - Possibilité retour

-- Photos identité
- photo_url (text) - Photo profil conducteur
- photo_verified_at (timestamp)
- photo_verified_by (uuid) - FK vers adm_members

-- Métadonnées
- metadata (jsonb) DEFAULT '{}' - Données extensibles
- preferences (jsonb) DEFAULT '{}' - Préférences conducteur

-- Audit renforcé
- verified_by (uuid) - FK vers adm_members
- verified_at (timestamp)

CRÉER INDEX:
- btree (nationality)
- btree (date_of_birth)
- btree (wps_eligible) WHERE driver_status = 'active'
- btree (onboarded_at)
- btree (last_active_at)
- btree (suspension_end_date) WHERE driver_status = 'suspended'
- gin (metadata)
- gin (preferences)
- gin (full_name gin_trgm_ops) - Recherche floue

CRÉER CONTRAINTES:
- CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years') - Âge minimum
- CHECK (suspension_end_date IS NULL OR suspension_end_date >= suspension_start_date)
- CHECK (wps_eligible = false OR (bank_iban IS NOT NULL AND bank_name IS NOT NULL))

CRÉER TRIGGER:
- generate_full_name() BEFORE INSERT OR UPDATE
- update_last_active_at() via application logic
```

---

#### Table 27: `rid_driver_documents` - Documents conducteurs

**Existant V1:**

- Lien vers doc_documents (FK)
- Type de document (texte libre)
- Date expiration
- Vérification booléenne simple
- Qui a vérifié et quand
- Status texte

**Évolutions V2:**

```sql
AJOUTER:
-- Type normalisé
- document_type (enum) NOT NULL CHECK IN:
  * 'driving_license'
  * 'professional_card'
  * 'national_id'
  * 'passport'
  * 'visa'
  * 'work_permit'
  * 'residence_permit'
  * 'proof_of_address'
  * 'criminal_record'
  * 'medical_certificate'
  * 'vehicle_registration' (si propriétaire)
  * 'insurance_policy'
  * 'contract_signed'
  * 'bank_statement'
  * 'other'

-- Renouvellement et rappels
- requires_renewal (boolean) DEFAULT true - Certains docs n'expirent pas
- renewal_frequency_days (integer) - Fréquence renouvellement
- reminder_sent_at (timestamp) - Quand rappel envoyé
- reminder_days_before (integer) DEFAULT 30 - Délai rappel

-- Vérification structurée
- verification_status (enum) NOT NULL DEFAULT 'pending' CHECK IN:
  * 'pending'
  * 'verified'
  * 'rejected'
  * 'expired'
- rejection_reason (text) - Motif refus détaillé
- verification_method (varchar(50)) - manual, ocr, api

-- Détails document
- document_number (varchar(100)) - Numéro unique document
- issuing_authority (varchar(255)) - Autorité émettrice
- issuing_country (char(2)) - Pays émission
- issue_date (date) - Date émission

-- Traçabilité
- replaced_document_id (uuid) - FK vers rid_driver_documents (self)
- replacement_reason (text)

-- Métadonnées OCR
- ocr_data (jsonb) - Données extraites automatiquement
- confidence_score (decimal(5,2)) - Score confiance OCR

MODIFIER:
- verified → verification_status (migration)
- status → verification_status (consolidation)

CRÉER INDEX:
- btree (document_type)
- btree (verification_status) WHERE deleted_at IS NULL
- btree (expiry_date) WHERE requires_renewal = true AND verification_status = 'verified'
- btree (reminder_sent_at)
- btree (document_number)
- btree (replaced_document_id)
- gin (ocr_data)

CRÉER CONTRAINTES:
- UNIQUE (driver_id, document_type) WHERE deleted_at IS NULL AND verification_status != 'rejected'
- CHECK (expiry_date IS NULL OR expiry_date > issue_date)
- CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100))
```

---

#### Table 28: `rid_driver_cooperation_terms` - Termes coopération

**Existant V1:**

- Version des termes (texte)
- Date acceptation
- Date effective et expiration
- Statut (pending, active, expired, terminated)
- Métadonnées JSON

**Évolutions V2:**

```sql
AJOUTER:
-- Lien document contractuel
- terms_document_id (uuid) - FK vers doc_documents
- terms_document_url (text) - URL PDF du contrat

-- Signature digitale
- signed_by_driver (boolean) DEFAULT false
- driver_signature_data (text) - Données signature base64
- driver_signature_ip (inet) - IP lors signature
- driver_signature_timestamp (timestamp)
- signature_method (enum) - digital, wet_signature, app, email

-- Signature entreprise
- signed_by_company (boolean) DEFAULT false
- company_signatory_id (uuid) - FK vers adm_members
- company_signature_timestamp (timestamp)

-- Modèle de compensation
- compensation_model (enum) NOT NULL CHECK IN:
  * 'fixed_rental' - Loyer fixe, driver garde revenus
  * 'percentage_split' - Partage pourcentage par plateforme
  * 'salary' - Salaire fixe mensuel (WPS)
  * 'crew_rental' - Loyer par shift (multiples drivers)
  * 'buyout' - Rachat progressif véhicule
  * 'custom' - Modèle personnalisé

-- Paramètres compensation (JSONB structuré)
- compensation_params (jsonb) NOT NULL - Structure selon modèle:
  /* fixed_rental: { daily: 50, weekly: 300, monthly: 1000, currency: 'AED' } */
  /* percentage_split: { platforms: { uber: 70, bolt: 75 }, default: 70 } */
  /* salary: { monthly_amount: 5000, currency: 'AED', wps_enabled: true } */
  /* crew_rental: { shift_duration_hours: 12, rate_per_shift: 100 } */
  /* buyout: { vehicle_price: 50000, monthly_payment: 1500, duration_months: 36 } */

-- Historisation
- previous_terms_id (uuid) - FK vers rid_driver_cooperation_terms (self)
- superseded_by_terms_id (uuid) - FK vers rid_driver_cooperation_terms (self)
- version_number (integer) DEFAULT 1

-- Validation légale
- legal_review_required (boolean) DEFAULT false
- legal_reviewed_by (uuid) - FK vers adm_members
- legal_reviewed_at (timestamp)
- legal_notes (text)

-- Renouvellement
- auto_renew (boolean) DEFAULT false
- renewal_notice_days (integer) DEFAULT 30
- renewal_notice_sent_at (timestamp)

CRÉER INDEX:
- btree (compensation_model)
- btree (effective_date, expiry_date)
- btree (previous_terms_id)
- btree (version_number)
- btree (auto_renew) WHERE status = 'active'
- btree (legal_review_required) WHERE legal_reviewed_at IS NULL
- gin (compensation_params)

CRÉER CONTRAINTES:
- CHECK (signed_by_driver = false OR driver_signature_timestamp IS NOT NULL)
- CHECK (signed_by_company = false OR company_signature_timestamp IS NOT NULL)
- CHECK (version_number > 0)
- CHECK (effective_date <= expiry_date OR expiry_date IS NULL)

CRÉER TRIGGER:
- validate_compensation_params() BEFORE INSERT OR UPDATE
- auto_increment_version() BEFORE INSERT
```

---

#### Table 29: `rid_driver_requests` - Demandes conducteurs (NOUVELLE TABLE)

**Existant V1:**

- ❌ TABLE N'EXISTE PAS - Duplication erreur dans DDL

**Création V2:**

```sql
CRÉER TABLE rid_driver_requests:
-- Identifiants
- id (uuid) PRIMARY KEY
- tenant_id (uuid) NOT NULL - FK vers adm_tenants
- driver_id (uuid) NOT NULL - FK vers rid_drivers
- reference (varchar(50)) UNIQUE - REQ-2025-00001

-- Type et catégorie
- request_type (enum) NOT NULL CHECK IN:
  * 'leave' - Demande congé
  * 'vehicle_change' - Changement véhicule
  * 'schedule_change' - Modification planning
  * 'expense_reimbursement' - Remboursement frais
  * 'advance_payment' - Avance sur salaire
  * 'document_update' - Mise à jour documents
  * 'complaint' - Réclamation
  * 'support' - Demande assistance
  * 'contract_modification' - Modification contrat
  * 'termination' - Demande départ
  * 'other'

- category (varchar(50)) - Sous-catégorie libre
- priority (enum) DEFAULT 'normal' CHECK IN ('low', 'normal', 'high', 'urgent')

-- Contenu demande
- subject (varchar(255)) NOT NULL
- description (text) NOT NULL
- requested_date (date) - Date souhaitée si applicable
- requested_amount (decimal(18,2)) - Montant si applicable
- currency (char(3)) - Devise si montant

-- Pièces jointes
- attachment_ids (uuid[]) - FKs vers doc_documents
- supporting_documents_count (integer) DEFAULT 0

-- Workflow approbation
- status (enum) NOT NULL DEFAULT 'pending' CHECK IN:
  * 'pending' - En attente
  * 'under_review' - En cours examen
  * 'approved' - Approuvée
  * 'rejected' - Refusée
  * 'cancelled' - Annulée
  * 'completed' - Finalisée

- submitted_at (timestamp) NOT NULL DEFAULT now()
- reviewed_by (uuid) - FK vers adm_members
- reviewed_at (timestamp)
- approval_level_required (integer) DEFAULT 1 - Niveau hiérarchique requis
- current_approval_level (integer) DEFAULT 0

-- Résolution
- status_reason (text) - Explication statut
- resolution_notes (text) - Notes résolution
- resolved_at (timestamp)
- resolution_time_hours (integer) - Calculé automatiquement

-- Notifications
- driver_notified_at (timestamp)
- notification_method (varchar(50)) - email, sms, app

-- Liens externes
- platform_id (uuid) - FK vers dir_platforms si applicable
- related_trip_id (uuid) - FK vers trp_trips si applicable
- related_expense_id (uuid) - FK vers flt_vehicle_expenses si applicable

-- Métadonnées
- metadata (jsonb) DEFAULT '{}'

-- Audit
- created_at (timestamp) DEFAULT now()
- created_by (uuid) - FK vers adm_members
- updated_at (timestamp) DEFAULT now()
- updated_by (uuid)
- deleted_at (timestamp)
- deleted_by (uuid)
- deletion_reason (text)

CRÉER INDEX:
- btree (tenant_id, driver_id, created_at DESC)
- btree (request_type)
- btree (status) WHERE deleted_at IS NULL
- btree (priority) WHERE status IN ('pending', 'under_review')
- btree (submitted_at)
- btree (reviewed_by)
- btree (platform_id) WHERE platform_id IS NOT NULL
- gin (metadata)

CRÉER CONTRAINTES:
- UNIQUE (tenant_id, driver_id, reference) WHERE deleted_at IS NULL
- CHECK (requested_amount IS NULL OR requested_amount >= 0)
- CHECK (resolution_time_hours IS NULL OR resolution_time_hours >= 0)
- CHECK (current_approval_level <= approval_level_required)

CRÉER TRIGGER:
- generate_reference() BEFORE INSERT
- calculate_resolution_time() AFTER UPDATE
- notify_driver_on_status_change() AFTER UPDATE
```

---

#### Table 30: `rid_driver_performances` - Métriques performance

**Existant V1:**

- Période (start, end)
- Compteurs courses (completed, cancelled)
- Taux (on_time_rate)
- Rating moyenne
- Incidents count
- Revenus totaux
- Heures en ligne
- Métadonnées JSON

**Évolutions V2:**

```sql
AJOUTER:
-- Type et granularité période
- period_type (enum) NOT NULL DEFAULT 'daily' CHECK IN:
  * 'daily'
  * 'weekly'
  * 'monthly'
  * 'quarterly'
  * 'yearly'

-- Plateforme spécifique
- platform_id (uuid) - FK vers dir_platforms (NULL = agrégé toutes)
- platform_name (varchar(100)) - Dénormalisé pour reporting

-- Méthodes paiement
- payment_method (enum) - cash, card, wallet, mixed
- cash_trips_count (integer) DEFAULT 0
- card_trips_count (integer) DEFAULT 0
- cash_amount (decimal(18,2)) DEFAULT 0
- card_amount (decimal(18,2)) DEFAULT 0

-- Métriques étendues
- acceptance_rate (decimal(5,2)) - % acceptation courses
- cancellation_by_driver_rate (decimal(5,2)) - % annulations driver
- cancellation_by_rider_rate (decimal(5,2)) - % annulations client
- avg_trip_distance_km (decimal(10,2))
- avg_trip_duration_minutes (integer)
- avg_earnings_per_trip (decimal(10,2))
- peak_hours_percentage (decimal(5,2)) - % heures de pointe

-- Dimension sociale/qualité
- complaints_count (integer) DEFAULT 0 - Réclamations clients
- positive_feedback_count (integer) DEFAULT 0 - Retours positifs
- tips_received (decimal(18,2)) DEFAULT 0 - Pourboires
- tips_count (integer) DEFAULT 0
- five_star_ratings_count (integer) DEFAULT 0

-- Efficacité
- online_hours (decimal(10,2)) - Heures connecté
- occupied_hours (decimal(10,2)) - Heures en course
- utilization_rate (decimal(5,2)) - % occupation vs online
- earnings_per_hour (decimal(10,2)) - Revenus horaires

-- Comparaison
- rank_in_fleet (integer) - Classement flotte
- total_drivers_in_period (integer) - Nombre drivers période
- percentile (integer) - Percentile performance (1-100)

-- Déductions et net
- platform_fees_total (decimal(18,2)) DEFAULT 0
- vehicle_rental_deducted (decimal(18,2)) DEFAULT 0
- other_deductions (decimal(18,2)) DEFAULT 0
- net_earnings (decimal(18,2)) - Calculé automatiquement

-- Calcul et validation
- calculated_at (timestamp) - Quand calculé
- calculation_source (varchar(50)) - manual, automated, import
- verified_by (uuid) - FK vers adm_members si vérifié
- verified_at (timestamp)
- is_final (boolean) DEFAULT false - Période clôturée

MODIFIER:
- period_end → nullable si period_type = 'daily' (optionnel)
- on_time_rate → on_time_percentage (renommage cohérent)
- avg_rating → average_rating (renommage cohérent)

CRÉER INDEX:
- btree (period_type, period_start)
- btree (platform_id) WHERE platform_id IS NOT NULL
- btree (payment_method)
- btree (rank_in_fleet) WHERE rank_in_fleet IS NOT NULL
- btree (percentile)
- btree (is_final)
- btree (calculated_at)
- partial (tenant_id, driver_id, period_start) WHERE is_final = true

CRÉER CONTRAINTES:
- CHECK (acceptance_rate IS NULL OR (acceptance_rate >= 0 AND acceptance_rate <= 100))
- CHECK (utilization_rate IS NULL OR (utilization_rate >= 0 AND utilization_rate <= 100))
- CHECK (percentile IS NULL OR (percentile >= 1 AND percentile <= 100))
- CHECK (net_earnings = earnings_total - platform_fees_total - vehicle_rental_deducted - other_deductions)
- CHECK (occupied_hours IS NULL OR occupied_hours <= online_hours)

CRÉER TRIGGER:
- calculate_net_earnings() BEFORE INSERT OR UPDATE
- calculate_utilization_rate() BEFORE INSERT OR UPDATE
- update_rank_in_fleet() AFTER INSERT OR UPDATE (via batch job)
```

---

#### Table 31: `rid_driver_blacklists` - Liste noire

**Existant V1:**

- Driver référence
- Raison (texte libre)
- Date début et fin
- Statut (active, inactive)
- Métadonnées

**Évolutions V2:**

```sql
AJOUTER:
-- Catégorisation
- category (enum) NOT NULL CHECK IN:
  * 'disciplinary' - Faute disciplinaire
  * 'administrative' - Problème administratif
  * 'legal' - Litige juridique
  * 'safety' - Sécurité
  * 'financial' - Problème financier
  * 'performance' - Performance insuffisante
  * 'contract_breach' - Rupture contrat
  * 'criminal' - Casier judiciaire
  * 'voluntary' - Départ volontaire

- severity (enum) DEFAULT 'medium' CHECK IN:
  * 'low' - Avertissement
  * 'medium' - Suspension temporaire
  * 'high' - Suspension longue durée
  * 'critical' - Exclusion définitive

-- Origine et contexte
- origin_event_id (uuid) - FK vers événement source (accident, incident)
- origin_event_type (varchar(50)) - Type événement source
- reported_by (uuid) NOT NULL - FK vers adm_members
- reported_at (timestamp) NOT NULL DEFAULT now()

-- Processus appel
- appeal_status (enum) DEFAULT 'not_applicable' CHECK IN:
  * 'not_applicable'
  * 'pending'
  * 'under_review'
  * 'accepted'
  * 'rejected'
- appeal_submitted_at (timestamp)
- appeal_reason (text)
- appeal_reviewed_by (uuid) - FK vers adm_members
- appeal_reviewed_at (timestamp)
- appeal_decision_notes (text)

-- Décision et validation
- decision_made_by (uuid) NOT NULL - FK vers adm_members (HR/Manager)
- decision_made_at (timestamp) NOT NULL DEFAULT now()
- requires_legal_review (boolean) DEFAULT false
- legal_reviewed_by (uuid) - FK vers adm_members
- legal_reviewed_at (timestamp)
- legal_opinion (text)

-- Levée/révocation
- status (enum) NOT NULL DEFAULT 'active' CHECK IN:
  * 'active' - En vigueur
  * 'expired' - Expirée naturellement
  * 'revoked' - Révoquée avant terme
  * 'appealed_lifted' - Levée suite appel

- revoked_at (timestamp)
- revoked_by (uuid) - FK vers adm_members
- revocation_reason (text)

-- Notifications
- driver_notified_at (timestamp)
- notification_method (varchar(50)) - email, sms, registered_mail
- notification_proof_document_id (uuid) - FK vers doc_documents

-- Réactivation éventuelle
- reactivation_conditions (text) - Conditions pour lever
- reactivation_date_eligible (date) - Date possible réexamen
- rehabilitation_program_required (boolean) DEFAULT false

-- Documentation
- supporting_documents (uuid[]) - FKs vers doc_documents
- incident_report_id (uuid) - FK vers rapport incident si existe

CRÉER INDEX:
- btree (category)
- btree (severity)
- btree (status) WHERE deleted_at IS NULL
- btree (appeal_status) WHERE appeal_status IN ('pending', 'under_review')
- btree (end_date) WHERE status = 'active'
- btree (reactivation_date_eligible) WHERE status = 'active'
- btree (origin_event_id) WHERE origin_event_id IS NOT NULL
- btree (reported_by)
- btree (decision_made_by)

CRÉER CONTRAINTES:
- UNIQUE (tenant_id, driver_id) WHERE deleted_at IS NULL AND status = 'active'
- CHECK (end_date IS NULL OR end_date >= start_date)
- CHECK (revoked_at IS NULL OR status = 'revoked')
- CHECK (appeal_submitted_at IS NULL OR appeal_status != 'not_applicable')

CRÉER TRIGGER:
- sync_driver_status() AFTER INSERT OR UPDATE - Met driver en 'suspended'
- notify_driver() AFTER INSERT
```

---

#### Table 32: `rid_driver_training` - Formations

**Existant V1:**

- Nom formation
- Provider (organisme)
- Statut (planned, in_progress, completed, expired, cancelled)
- Dates (assigned, due, completed)
- Score optionnel
- URL certificat
- Métadonnées

**Évolutions V2:**

```sql
AJOUTER:
-- Catégorisation détaillée
- training_type (enum) NOT NULL CHECK IN:
  * 'mandatory' - Obligatoire légal
  * 'safety' - Sécurité
  * 'customer_service' - Service client
  * 'technical' - Technique (véhicule, app)
  * 'compliance' - Conformité réglementaire
  * 'platform_specific' - Spécifique plateforme
  * 'professional_development' - Développement pro
  * 'onboarding' - Formation initiale
  * 'refresher' - Recyclage
  * 'specialized' - Spécialisée (luxe, handicap)

- category (varchar(100)) - Sous-catégorie libre
- is_mandatory (boolean) DEFAULT false
- is_recurring (boolean) DEFAULT false
- recurrence_frequency_months (integer) - Si récurrent

-- Organisme et référence externe
- provider_type (enum) - internal, external, online_platform, government
- external_provider_id (uuid) - Si organisme externe référencé
- external_reference (varchar(100)) - Numéro formation externe
- provider_contact_email (varchar(255))
- provider_contact_phone (varchar(20))

-- Planification
- scheduled_start_date (date)
- scheduled_end_date (date)
- actual_start_date (date)
- duration_hours (decimal(5,2))
- location (varchar(255)) - Lieu si présentiel
- is_online (boolean) DEFAULT false
- platform_url (text) - URL plateforme si en ligne

-- Évaluation
- passing_score (decimal(5,2)) - Score minimum requis
- max_attempts (integer) DEFAULT 1
- attempt_number (integer) DEFAULT 1
- score_percentage (decimal(5,2)) - Score obtenu en %
- passed (boolean) - Calculé automatiquement
- evaluation_date (date)
- evaluated_by (uuid) - FK vers adm_members ou externe
- evaluator_notes (text)

-- Certificat
- certificate_number (varchar(100))
- certificate_issued_date (date)
- certificate_expiry_date (date)
- certificate_issuing_authority (varchar(255))
- digital_badge_url (text) - Badge numérique si applicable

-- Feedback
- trainer_feedback (text)
- driver_feedback (text)
- driver_satisfaction_rating (integer) CHECK IN (1,2,3,4,5)

-- Suivi et rappels
- reminder_sent_at (timestamp)
- last_contact_at (timestamp)
- completion_reminder_count (integer) DEFAULT 0

-- Coûts
- training_cost (decimal(10,2))
- currency (char(3))
- paid_by (enum) - company, driver, platform, government
- reimbursement_requested (boolean) DEFAULT false
- reimbursement_approved (boolean)
- reimbursement_amount (decimal(10,2))

-- Prérequis et dépendances
- prerequisite_training_ids (uuid[]) - Formations prérequises
- unlocks_training_ids (uuid[]) - Formations débloquées ensuite

-- Liens
- related_platform_id (uuid) - FK vers dir_platforms si spécifique
- related_document_ids (uuid[]) - FKs vers doc_documents (supports cours)

CRÉER INDEX:
- btree (training_type)
- btree (is_mandatory) WHERE is_mandatory = true
- btree (is_recurring) WHERE is_recurring = true
- btree (status) WHERE deleted_at IS NULL
- btree (scheduled_start_date)
- btree (due_at) WHERE status IN ('planned', 'in_progress')
- btree (certificate_expiry_date) WHERE passed = true
- btree (provider_type)
- btree (related_platform_id) WHERE related_platform_id IS NOT NULL
- partial (tenant_id, driver_id, training_name) WHERE deleted_at IS NULL

CRÉER CONTRAINTES:
- CHECK (score_percentage IS NULL OR (score_percentage >= 0 AND score_percentage <= 100))
- CHECK (passed IS NULL OR passed = (score_percentage >= passing_score))
- CHECK (attempt_number > 0 AND attempt_number <= max_attempts)
- CHECK (actual_start_date IS NULL OR actual_start_date >= scheduled_start_date)
- CHECK (certificate_expiry_date IS NULL OR certificate_expiry_date > certificate_issued_date)
- CHECK (driver_satisfaction_rating IS NULL OR driver_satisfaction_rating BETWEEN 1 AND 5)

CRÉER TRIGGER:
- calculate_passed_status() BEFORE INSERT OR UPDATE
- send_reminder_if_due() via scheduled job
- auto_renew_if_expiring() AFTER UPDATE
```

---

### Domaine Scheduling (4 tables)

#### Table 33: `sch_shifts` - Planning conducteurs avancé

**Existant V1:**

- Structure basique : driver_id, start_time, end_time, status
- Contrainte temporelle : end_time >= start_time
- Index unique : (tenant_id, driver_id, start_time)
- Statuts : scheduled, completed, cancelled
- Metadata JSONB libre

**Évolutions V2:**

```sql
AJOUTER:
- shift_type (enum) - day, night, weekend, peak_hour, special_event
- shift_category (varchar) - regular, overtime, on_call, backup
- location_id (uuid) - FK vers table locations/zones
- zone_name (varchar) - Nom zone géographique
- approved_by (uuid) - FK vers adm_members - Qui valide le shift
- approved_at (timestamp) - Date validation
- check_in_at (timestamp) - Heure réelle début
- check_out_at (timestamp) - Heure réelle fin
- break_duration_minutes (integer) - Pauses
- actual_work_minutes (integer) - Calculé auto
- pay_multiplier (decimal) - Coefficient (1.0, 1.5 nuit, 2.0 férié)
- notes (text) - Observations
- cancellation_reason (varchar) - Si cancelled
- replacement_driver_id (uuid) - Remplacement

MODIFIER status ENUM pour ajouter:
- no_show - Driver absent sans prévenir
- partial - Shift partiellement effectué

CRÉER TABLE RÉFÉRENTIELLE sch_shift_types:
- id (uuid)
- tenant_id (uuid)
- code (varchar) - day, night, weekend
- label (varchar) - "Shift de Jour"
- pay_multiplier (decimal)
- color_code (varchar) - Pour UI
- is_active (boolean)

AMÉLIORER INDEX:
- Ajouter index sur check_in_at, check_out_at
- Ajouter index sur shift_type, location_id
- Ajouter index composite (driver_id, check_in_at) pour reporting
```

**Impact métier:**

- Primes différenciées selon type de shift
- Gestion zones géographiques (centre-ville, aéroport)
- Calcul précis heures réelles vs planifiées
- Validation hiérarchique des plannings
- Détection absences non justifiées

---

#### Table 34: `sch_maintenance_schedules` - Maintenance préventive

**Existant V1:**

- Structure basique : vehicle_id, scheduled_date, maintenance_type, status
- Index unique : (tenant_id, vehicle_id, scheduled_date, maintenance_type)
- Statuts : scheduled, completed, cancelled
- Type maintenance : string libre
- Pas de lien avec maintenance réalisée

**Évolutions V2:**

```sql
AJOUTER:
- maintenance_type_id (uuid) - FK vers dir_maintenance_types
- scheduled_by (uuid) - FK vers adm_members - Qui planifie
- priority (enum) - low, normal, high, urgent, critical
- estimated_duration_hours (decimal)
- estimated_cost (decimal)
- odometer_reading (integer) - Kilométrage au moment planification
- trigger_type (enum) - mileage_based, time_based, condition_based, manual
- reminder_sent_at (timestamp) - Dernier rappel envoyé
- reminder_count (integer) - Nombre rappels envoyés
- completed_maintenance_id (uuid) - FK vers flt_vehicle_maintenance
- rescheduled_from (uuid) - FK self pour historique report
- rescheduled_reason (text)
- blocking_operations (boolean) - Véhicule bloqué pendant maintenance
- required_parts (jsonb) - Liste pièces nécessaires
- assigned_garage (varchar)
- garage_contact (varchar)
- notes (text)

MODIFIER status ENUM pour ajouter:
- overdue - Dépassé sans être fait
- in_progress - En cours chez garagiste
- rescheduled - Reporté

CRÉER TABLE dir_maintenance_types:
- id (uuid)
- tenant_id (uuid) nullable - NULL = global FleetCore
- code (varchar) - oil_change, tire_rotation, inspection
- label (varchar) - "Vidange moteur"
- category (enum) - preventive, corrective, regulatory
- default_frequency_km (integer) - Ex: 10000 km
- default_frequency_months (integer) - Ex: 6 mois
- estimated_duration_hours (decimal)
- estimated_cost_range (jsonb) - {min: 50, max: 150}
- is_mandatory (boolean) - Obligatoire réglementairement
- requires_vehicle_stoppage (boolean)
- description (text)

AMÉLIORER INDEX:
- Ajouter index sur trigger_type, priority
- Ajouter index sur reminder_sent_at pour job automatique
- Ajouter index sur odometer_reading
- Ajouter index composite (vehicle_id, scheduled_date, status)
```

**Impact métier:**

- Planification automatique selon kilométrage ou temps
- Rappels automatiques propriétaires/gestionnaires
- Priorisation maintenance selon urgence
- Lien direct planification → exécution
- Gestion stock pièces nécessaires
- Conformité réglementaire (contrôles obligatoires)

---

#### Table 35: `sch_goals` - Objectifs KPI mesurables

**Existant V1:**

- Structure basique : goal_type, target_value, period_start/end, assigned_to, status
- Index unique : (tenant_id, goal_type, period_start, assigned_to)
- Statuts : active, in_progress, completed, cancelled, expired
- Type objectif : string libre
- Pas de suivi progression

**Évolutions V2:**

```sql
AJOUTER:
- goal_type_id (uuid) - FK vers sch_goal_types
- goal_category (enum) - revenue, trips, quality, efficiency, safety
- target_type (enum) - individual, team, branch, company
- target_entity_type (varchar) - driver, member, branch
- target_entity_id (uuid)
- period_type (enum) - daily, weekly, monthly, quarterly, yearly
- recurrence_pattern (varchar) - Pour objectifs récurrents
- current_value (decimal) - Valeur actuelle
- progress_percent (decimal) - Calculé auto (current/target * 100)
- unit (varchar) - trips, AED, hours, km, points
- weight (decimal) - Importance relative si objectifs multiples
- reward_type (enum) - bonus, certificate, badge, promotion
- reward_amount (decimal) - Si bonus financier
- threshold_bronze (decimal) - Paliers intermédiaires
- threshold_silver (decimal)
- threshold_gold (decimal)
- achievement_date (timestamp) - Date atteinte objectif
- last_calculated_at (timestamp) - Dernière MAJ progression
- last_notified_at (timestamp) - Dernier rappel envoyé
- notification_frequency_days (integer)
- created_by (uuid) - Qui définit l'objectif
- notes (text)

MODIFIER status ENUM pour ajouter:
- on_track - En bonne voie
- at_risk - Risque non atteinte
- achieved - Objectif atteint
- exceeded - Dépassé

CRÉER TABLE sch_goal_types:
- id (uuid)
- tenant_id (uuid) nullable - NULL = types FleetCore standards
- code (varchar) - trips_completed, net_revenue, avg_rating
- label (varchar) - "Nombre de courses complétées"
- category (enum) - revenue, trips, quality, efficiency
- unit (varchar) - trips, AED, points
- calculation_method (text) - Description calcul
- data_source_table (varchar) - Table source données
- data_source_field (varchar) - Champ à agréger
- aggregation_type (enum) - sum, avg, count, min, max
- is_higher_better (boolean) - true = plus c'est mieux
- icon (varchar) - Pour UI
- color (varchar) - Pour UI

CRÉER TABLE sch_goal_achievements:
- id (uuid)
- goal_id (uuid) - FK vers sch_goals
- achievement_date (timestamp)
- final_value (decimal)
- threshold_reached (enum) - bronze, silver, gold, exceeded
- reward_granted (boolean)
- reward_amount (decimal)
- certificate_url (varchar)
- notes (text)

AMÉLIORER INDEX:
- Ajouter index sur progress_percent, status
- Ajouter index sur achievement_date
- Ajouter index composite (assigned_to, period_start, status)
- Ajouter index sur target_entity_type, target_entity_id
```

**Impact métier:**

- Objectifs mesurables en temps réel
- Paliers de réussite (bronze/silver/gold)
- Système de récompenses intégré
- Objectifs récurrents automatiques
- Notifications proactives risque non-atteinte
- Gamification motivation drivers
- Reporting performance par équipe/branche
- Alignement objectifs individuels/collectifs

---

#### Table 36: `sch_tasks` - Tâches assignées workflow

**Existant V1:**

- Structure basique : task_type, description, target_id, due_at, status
- Statuts : pending, in_progress, completed, cancelled, overdue
- Type tâche : string libre
- target_id générique sans typage
- Pas d'assignation explicite

**Évolutions V2:**

```sql
AJOUTER:
- task_type_id (uuid) - FK vers sch_task_types
- task_category (enum) - admin, maintenance, document, training, support
- title (varchar) - Titre court
- priority (enum) - low, normal, high, urgent, critical
- assigned_to (uuid) - FK vers adm_members - Responsable exécution
- assigned_at (timestamp)
- assigned_by (uuid) - FK vers adm_members - Qui assigne
- target_type (varchar) - driver, vehicle, document, member, contract
- target_id (uuid) - ID entité concernée
- related_entity_type (varchar) - Entité secondaire
- related_entity_id (uuid)
- estimated_duration_minutes (integer)
- actual_duration_minutes (integer)
- start_date (date) - Date début souhaitée
- due_date (date) - Date limite
- completed_at (timestamp) - Date réelle fin
- completed_by (uuid) - Qui a terminé
- verification_required (boolean) - Nécessite validation
- verified_by (uuid) - Qui valide
- verified_at (timestamp)
- is_auto_generated (boolean) - Générée automatiquement
- generation_trigger (varchar) - trigger_name si auto
- recurrence_pattern (varchar) - Si tâche récurrente
- parent_task_id (uuid) - FK self pour sous-tâches
- blocking_tasks (uuid[]) - Tâches bloquantes
- checklist (jsonb) - Étapes à valider
- attachments (jsonb) - Documents liés
- comments (jsonb) - Historique commentaires
- reminder_sent_at (timestamp)
- reminder_frequency_days (integer)
- escalation_level (integer) - Nombre escalades
- escalated_to (uuid) - Manager si escalade
- tags (text[]) - Classification libre

MODIFIER status ENUM pour ajouter:
- blocked - Bloquée par autre tâche
- waiting_verification - En attente validation
- reopened - Rouverte après completed

CRÉER TABLE sch_task_types:
- id (uuid)
- tenant_id (uuid) nullable
- code (varchar) - verify_document, schedule_maintenance, approve_payment
- label (varchar) - "Vérifier document conducteur"
- category (enum) - admin, maintenance, document, training
- default_priority (enum)
- default_duration_minutes (integer)
- requires_verification (boolean)
- default_checklist (jsonb) - Template étapes
- auto_assignment_rule (jsonb) - Règles assignation auto
- sla_hours (integer) - Délai réponse standard
- escalation_hours (integer) - Délai avant escalade
- description_template (text)

CRÉER TABLE sch_task_comments:
- id (uuid)
- task_id (uuid) - FK vers sch_tasks
- comment_type (enum) - note, status_change, escalation
- author_id (uuid) - FK vers adm_members
- comment_text (text)
- attachments (jsonb)
- is_internal (boolean) - Visible seulement équipe
- created_at (timestamp)

CRÉER TABLE sch_task_history:
- id (uuid)
- task_id (uuid)
- changed_by (uuid)
- change_type (enum) - created, assigned, status_changed, escalated
- old_values (jsonb)
- new_values (jsonb)
- change_reason (text)
- created_at (timestamp)

AMÉLIORER INDEX:
- Ajouter index sur assigned_to, status, due_date
- Ajouter index sur task_category, priority
- Ajouter index sur is_auto_generated, generation_trigger
- Ajouter index gin sur tags
- Ajouter index composite (target_type, target_id, status)
```

**Impact métier:**

- Assignation claire responsabilités
- Workflow validation multi-niveaux
- Génération automatique tâches récurrentes
- Escalade automatique tâches en retard
- Checklist garantit exhaustivité
- Historique complet traçabilité
- Intégration avec système tickets
- Tâches bloquantes gestion dépendances
- SLA mesurables par type tâche
- Collaboration via commentaires

---

## NOUVELLES TABLES À CRÉER - DOMAINE SCHEDULING

### Tables complémentaires pour V2 complète

#### Table 37: `sch_shift_types` - Types de shifts référentiel

```sql
Fonction : Définir types shifts standards avec coefficients prime
Utilisation : Référencé par sch_shifts.shift_type_id
Avantage : Évite duplication, calcul primes cohérent
Exemples : day (1.0), night (1.5), weekend (1.25), holiday (2.0)
```

#### Table 38: `dir_maintenance_types` - Types maintenances référentiel

```sql
Fonction : Catalogue maintenances avec fréquence et coût estimé
Utilisation : Référencé par sch_maintenance_schedules.maintenance_type_id
Avantage : Planification préventive automatisée
Exemples : oil_change (10000km/6mois), tire_rotation (15000km)
Multi-tenant : Types globaux + spécifiques tenant
```

#### Table 39: `sch_goal_types` - Types objectifs KPI référentiel

```sql
Fonction : Définir KPI mesurables avec source données et calcul
Utilisation : Référencé par sch_goals.goal_type_id
Avantage : Cohérence métriques, automatisation calculs
Exemples : trips_completed (COUNT trp_trips), net_revenue (SUM)
Champs clés : data_source_table, aggregation_type
```

#### Table 40: `sch_goal_achievements` - Historique succès objectifs

```sql
Fonction : Tracer atteinte objectifs avec paliers et récompenses
Utilisation : Lié à sch_goals.id
Avantage : Historique motivation, certificats, primes
Conservation : Permanent pour RH et paie
```

#### Table 41: `sch_task_types` - Types tâches référentiel

```sql
Fonction : Catalogue tâches avec SLA et template checklist
Utilisation : Référencé par sch_tasks.task_type_id
Avantage : Génération auto cohérente, SLA mesurables
Exemples : verify_driver_document (SLA 24h), approve_payment (SLA 2h)
```

#### Table 42: `sch_task_comments` - Commentaires tâches

```sql
Fonction : Fil discussion sur tâches
Utilisation : Lié à sch_tasks.id
Avantage : Collaboration asynchrone, historique décisions
Remplace : Commentaires dans metadata JSONB
```

#### Table 43: `sch_task_history` - Audit changements tâches

```sql
Fonction : Tracer tous changements statut/assignation
Utilisation : Lié à sch_tasks.id
Avantage : Conformité, analyse workflows, temps résolution
Complément : adm_audit_logs (plus général)
```

#### Table 44: `sch_locations` - Zones géographiques

```sql
Fonction : Définir zones dispatch (centre-ville, aéroport, banlieue)
Utilisation : Référencé par sch_shifts.location_id
Avantage : Optimisation dispatch, statistiques par zone
Champs : name, polygon (geography), city, country
Alternative : Utiliser metadata si pas besoin géospatial avancé
```

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE TRIPS

### Domaine Trips (4 tables)

#### Table 45: `trp_platform_accounts` - Connexion sécurisée aux plateformes

**Existant V1:**

- Liaison basique tenant-plateforme
- Stockage api_key en clair
- Pas de gestion de statut
- Pas de suivi synchronisation

**Évolutions V2:**

```sql
AJOUTER:
- status (enum) - active, inactive, suspended
- connected_at (timestamp) - Date première connexion
- last_sync_at (timestamp) - Dernière synchronisation
- last_error (text) - Dernier message d'erreur
- error_count (integer) - Compteur erreurs
- sync_frequency (interval) - Fréquence sync

SÉCURITÉ:
- Chiffrer api_key ou remplacer par provider_credentials_id
- Pointer vers Vault pour stockage sécurisé
- Ne jamais exposer clés en clair dans logs

CRÉER TABLE trp_platform_account_keys:
- account_id (uuid) - FK vers trp_platform_accounts
- key_value (text) - Chiffré
- key_type (enum) - read_only, read_write, admin
- expires_at (timestamp)
- is_active (boolean)
- created_at, revoked_at
```

#### Table 46: `trp_trips` - Courses avec cycle complet

**Existant V1:**

- Données complètes de course
- Coordonnées GPS pickup/dropoff
- Calculs fare détaillés (base, distance, time)
- Surge multiplier et tips
- Platform commission et net_earnings
- Status (completed, cancelled, rejected, no_show)

**Évolutions V2:**

```sql
RENOMMER (cohérence naming):
- start_time → started_at
- end_time → finished_at

AJOUTER (cycle complet de course):
- requested_at (timestamp) - Demande initiale
- matched_at (timestamp) - Assignation driver
- accepted_at (timestamp) - Acceptation driver
- arrived_at (timestamp) - Arrivée point pickup
- started_at (timestamp) - Début course (existant renommé)
- finished_at (timestamp) - Fin course (existant renommé)

ENRICHIR métadata pour inclure:
- incentives (bonus plateforme)
- promotions (codes promo client)
- cancellation_reason (si cancelled)
- rejection_reason (si rejected)
- quality_metrics (rating, feedback)
```

#### Table 47: `trp_settlements` - Règlements multi-types

**Existant V1:**

- Settlement basique par trip
- Amount, commission, net_amount
- Status (pending, settled, cancelled)
- Settlement_date et reference

**Évolutions V2:**

```sql
AJOUTER:
- settlement_type (enum) - platform_payout, adjustment, refund, bonus
- platform_settlement_id (varchar) - Référence externe plateforme
- paid_at (timestamp) - Date paiement effectif
- cancelled_at (timestamp) - Date annulation si applicable
- reconciled (boolean) - État réconciliation
- reconciliation_id (uuid) - FK vers rev_reconciliations

MULTI-DEVISES ET TAXES:
- tax_amount (decimal) - Montant taxe/TVA
- tax_rate (decimal) - Taux appliqué
- exchange_rate (decimal) - Taux change si multi-devises
- original_currency (varchar) - Devise d'origine si conversion
- original_amount (decimal) - Montant d'origine

CRÉER INDEX:
- (platform_settlement_id) - Recherche par ref externe
- (paid_at) - Recherches temporelles
- (reconciled) WHERE reconciled = false - Optimisation
```

#### Table 48: `trp_client_invoices` - Facturation B2B avancée

**Existant V1:**

- Factures clients basiques
- Status (draft, sent, paid, cancelled, overdue)
- Total_amount, currency, dates
- Lien client_id

**Évolutions V2:**

```sql
ENRICHIR STATUS:
- Ajouter 'viewed' - Client a ouvert la facture
- Ajouter 'partially_paid' - Paiement partiel
- Ajouter 'disputed' - Litige en cours

AJOUTER CONTEXTE COMMERCIAL:
- pricing_plan_id (uuid) - Plan tarifaire appliqué
- client_po_number (varchar) - Numéro commande client
- paid_at (timestamp) - Date paiement complet
- payment_reference (varchar) - Référence transaction
- payment_method (enum) - bank_transfer, card, check, cash
- discount_amount (decimal) - Remise appliquée
- discount_reason (text) - Justification remise

CRÉER TABLE trp_client_invoice_lines:
- invoice_id (uuid) - FK vers trp_client_invoices
- line_number (integer) - Ordre ligne
- description (text) - Libellé
- trip_id (uuid) - FK vers trp_trips (nullable)
- quantity (decimal) - Nombre courses/forfait
- unit_price (decimal) - Prix unitaire
- tax_rate (decimal) - Taux TVA
- line_amount (decimal) - Montant ligne
- metadata (jsonb) - Détails additionnels

AUTOMATISATION:
- Génération automatique selon périodicité
- Agrégation trips par client et période
- Calcul automatique taxes selon pays
- Envoi email automatique
```

---

### Tables complémentaires pour V2 complète

#### Table 49 `trp_platform_account_keys` - Gestion multi-clés

```sql
CREATE TABLE trp_platform_account_keys (
  id uuid PRIMARY KEY,
  account_id uuid REFERENCES trp_platform_accounts(id),
  key_value text, -- Chiffré
  key_type varchar(50), -- read_only, read_write, admin
  expires_at timestamp,
  is_active boolean DEFAULT true,
  last_used_at timestamp,
  created_at timestamp DEFAULT now(),
  revoked_at timestamp,
  revoked_by uuid,
  revoke_reason text
);
```

#### Table 50 `trp_client_invoice_lines` - Détail facturation

```sql
CREATE TABLE trp_client_invoice_lines (
  id uuid PRIMARY KEY,
  invoice_id uuid REFERENCES trp_client_invoices(id),
  line_number integer NOT NULL,
  description text NOT NULL,
  trip_id uuid REFERENCES trp_trips(id),
  quantity decimal(10,2) NOT NULL,
  unit_price decimal(14,2) NOT NULL,
  tax_rate decimal(5,2),
  line_amount decimal(14,2) NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now()
);
```

## Domaine Finance (6 tables)

### 💰 Évolutions sur les 6 tables Finance

#### Table 51: `fin_accounts` - Comptes financiers multi-types

**Rôle critique:**

- Gestion de 7+ types de comptes (bank, cash, digital, fuel_card, toll, maintenance, investor)
- Support multi-PSP (Stripe, Adyen, banques locales) sans verrouillage
- Conformité PCI (tokenisation données bancaires)
- Alertes trésorerie automatiques via limites

**Existant V1:**

- Structure basique : nom, type texte libre, devise, balance
- Metadata JSON non structuré
- Pas de statut de compte
- Pas de détails bancaires
- Pas de provider
- Pas de limites min/max

**Structure complète V2:**

```sql
IDENTITÉ:
- id (uuid) - PK
- tenant_id (uuid) - FK adm_tenants, multilocataire
- account_name (text) - Nom unique par tenant
- account_type (text) - FK vers fin_account_types
- currency (char(3)) - ISO 4217 (AED, EUR, USD)
- balance (numeric(18,2)) - Solde actuel >= 0

PROVIDER ET STATUT:
- provider (text) - stripe, adyen, local_bank, mpesa, etc.
- provider_account_id (text) - ID compte chez le provider
- status (text) - active, suspended, closed
- opened_at (timestamptz) - Date ouverture compte
- closed_at (timestamptz) - Date fermeture si applicable

LIMITES ET ALERTES:
- max_balance (numeric(18,2)) - Plafond compte (null = illimité)
- min_balance (numeric(18,2)) - Seuil alerte trésorerie

DÉTAILS BANCAIRES (PCI COMPLIANT):
- account_number_last4 (char(4)) - 4 derniers chiffres uniquement
- bank_name (text) - Nom de la banque
- iban (text) - IBAN tokenisé ou partiel
- swift_bic (text) - Code SWIFT/BIC

DOCUMENTATION:
- description (text) - Note utilisation du compte
- metadata (jsonb) - Champs spécifiques (fuel_card_number, toll_tag_id, etc.)

AUDIT:
- created_at (timestamptz)
- created_by (uuid) - FK adm_members
- updated_at (timestamptz)
- updated_by (uuid) - FK adm_members
- deleted_at (timestamptz) - Soft delete
- deleted_by (uuid) - FK adm_members
- deletion_reason (text)
```

**Contraintes et Index V2:**

```sql
CONTRAINTES:
- UNIQUE (tenant_id, account_name) WHERE deleted_at IS NULL
- CHECK (balance >= 0)
- CHECK (status IN ('active', 'suspended', 'closed'))
- CHECK (max_balance IS NULL OR max_balance > 0)
- CHECK (min_balance IS NULL OR min_balance >= 0)

INDEX:
- btree (tenant_id)
- btree (account_type)
- btree (status) WHERE deleted_at IS NULL
- btree (currency)
- btree (provider)
- btree (opened_at)
- btree (closed_at)
- gin (metadata)
```

---

#### Table 52: `fin_transactions` - Grand livre enrichi

**Rôle critique:**

- Source unique de vérité pour tous les flux financiers
- Catégorisation pour P&L automatique
- Lien avec entités métier (trips, drivers, invoices)
- Connecteur plug-and-play vers ERP externes
- Support multi-devises avec taux de change

**Existant V1:**

- Type simple (credit/debit) avec CHECK
- Montant et devise basiques
- Référence texte libre
- Statut limité (pending, completed, failed, cancelled)
- Pas de catégorisation
- Pas de lien avec entités métier
- Pas de gestion taxes/conversion
- Pas de validation

**Structure complète V2:**

```sql
IDENTITÉ ET COMPTES:
- id (uuid) - PK
- tenant_id (uuid) - FK adm_tenants
- account_id (uuid) - FK fin_accounts, compte débité/crédité
- counterparty_account_id (uuid) - FK fin_accounts, compte contrepartie (null si externe)
- transaction_type (varchar(30)) - FK dir_transaction_types
- status (varchar(30)) - FK dir_transaction_statuses

MONTANTS ET DEVISES:
- amount (numeric(18,2)) - Montant brut >= 0
- currency (char(3)) - Devise transaction
- net_amount (numeric(18,2)) - Montant net (après taxes)
- tax_rate (numeric(5,2)) - Taux TVA/taxe en %
- tax_amount (numeric(18,2)) - Montant taxes
- exchange_rate (numeric(18,6)) - Taux de change si conversion

CATÉGORISATION:
- category_id (uuid) - FK fin_transaction_categories
- entity_type (varchar(50)) - vehicle, driver, trip, invoice, contract
- entity_id (uuid) - ID de l'entité liée

RÉFÉRENCES:
- reference (text) - Référence externe ou interne (non null)
- description (text) - Description textuelle
- transaction_date (timestamptz) - Date effective transaction

PAIEMENT:
- payment_method_id (uuid) - FK bil_payment_methods
- source_system (varchar(50)) - stripe, cashbox, wps, manual, api

VALIDATION:
- validated_by (uuid) - FK adm_members
- validated_at (timestamptz) - Date validation

AUDIT:
- metadata (jsonb) - Données supplémentaires
- created_at (timestamptz)
- created_by (uuid) - FK adm_members
- updated_at (timestamptz)
- updated_by (uuid) - FK adm_members
- deleted_at (timestamptz)
- deleted_by (uuid) - FK adm_members
- deletion_reason (text)
```

**Contraintes et Index V2:**

```sql
CONTRAINTES:
- CHECK (amount >= 0)
- CHECK (net_amount IS NULL OR net_amount >= 0)
- CHECK (tax_amount IS NULL OR tax_amount >= 0)
- CHECK (exchange_rate IS NULL OR exchange_rate > 0)

INDEX:
- btree (tenant_id, account_id)
- btree (entity_type, entity_id)
- btree (transaction_date DESC)
- btree (status) WHERE deleted_at IS NULL
- btree (reference)
- btree (category_id)
- btree (payment_method_id)
- gin (metadata)
```

---

#### Table 53: `fin_driver_payment_batches` - Lots de paie multi-pays

**Rôle critique:**

- Workflow WPS UAE complet (draft → exported → sent → processed)
- Support SEPA Europe
- Support mobile money (Afrique, Asie)
- Génération fichiers SIF/SEPA automatique
- Traçabilité complète chaque étape

**Existant V1:**

- Référence batch simple
- Date de paiement uniquement
- Montant total et devise
- Statut limité (pending, processing, completed, failed, cancelled)
- Pas de périodicité
- Pas de méthode de paiement
- Pas de lien avec compte source
- Pas de workflow détaillé

**Structure complète V2:**

```sql
IDENTITÉ ET PÉRIODE:
- id (uuid) - PK
- tenant_id (uuid) - FK adm_tenants
- batch_reference (text) - Référence unique par tenant
- period_start (date) - Début période paie
- period_end (date) - Fin période paie (CHECK >= period_start)
- payroll_cycle (text) - monthly, semi_monthly, weekly, custom

PAIEMENT:
- payment_date (date) - Date prévue paiement
- payment_method (text) - bank_transfer, mobile_money, cash
- batch_type (text) - WPS (UAE), SEPA (EU), local
- payout_account_id (uuid) - FK fin_accounts, compte source OBLIGATOIRE

MONTANTS:
- total_amount (numeric(18,2)) - Montant total >= 0
- currency (char(3)) - Devise du lot

WORKFLOW ET STATUT:
- status (text) - FK fin_payment_batch_statuses
- status_reason (text) - Raison échec/rejet

FICHIERS ET DATES:
- file_url (text) - Lien vers fichier SIF/SEPA généré
- exported_at (timestamptz) - Date export fichier
- sent_at (timestamptz) - Date envoi banque
- processed_at (timestamptz) - Date traitement banque

ERREURS:
- error_details (jsonb) - Détails techniques erreurs

AUDIT:
- metadata (jsonb)
- created_at (timestamptz)
- created_by (uuid) - FK adm_provider_employees (staff FleetCore)
- updated_at (timestamptz)
- updated_by (uuid) - FK adm_provider_employees
- deleted_at (timestamptz)
- deleted_by (uuid) - FK adm_provider_employees
- deletion_reason (text)
```

**Contraintes et Index V2:**

```sql
CONTRAINTES:
- UNIQUE (tenant_id, batch_reference) WHERE deleted_at IS NULL
- CHECK (total_amount >= 0)
- CHECK (period_end >= period_start)
- CHECK (payroll_cycle IN ('monthly', 'semi_monthly', 'weekly', 'custom'))
- CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash'))
- CHECK (batch_type IN ('WPS', 'SEPA', 'local'))

INDEX:
- btree (tenant_id)
- btree (payout_account_id)
- btree (payment_date)
- btree (status) WHERE deleted_at IS NULL
- btree (period_start)
- btree (period_end)
- btree (payment_method)
- gin (metadata)
```

---

#### Table 54: `fin_driver_payments` - Paiements individuels enrichis

**Rôle critique:**

- Paiement individuel par driver avec traçabilité complète
- Gestion erreurs détaillée (IBAN invalide, compte bloqué)
- Support multi-devises avec conversion
- Possibilité de reversal
- Lien avec déductions (péages, amendes, dettes)

**Existant V1:**

- Lien driver et batch simple
- Montant et devise uniquement
- Date paiement
- Statut limité (pending, processing, completed, failed, cancelled)
- Pas de méthode de paiement
- Pas de traçabilité erreurs
- Pas de conversions devise
- Pas de période couverte

**Structure complète V2:**

```sql
IDENTITÉ ET LIENS:
- id (uuid) - PK
- tenant_id (uuid) - FK adm_tenants
- driver_id (uuid) - FK rid_drivers
- payment_batch_id (uuid) - FK fin_driver_payment_batches

PÉRIODE:
- period_start (date) - Début période couverte (nullable)
- period_end (date) - Fin période (CHECK >= period_start si non null)

MONTANTS ET DEVISES:
- amount (numeric(18,2)) - Montant payé >= 0
- currency (char(3)) - Devise paiement
- amount_in_tenant_currency (numeric(18,2)) - Montant converti devise tenant
- exchange_rate (numeric(12,6)) - Taux conversion si applicable

PAIEMENT:
- payment_date (date) - Date prévue
- payment_method (text) - bank_transfer, mobile_money, cash
- payout_account_id (uuid) - FK fin_accounts
- transaction_reference (text) - Référence banque/PSP retournée

STATUT ET ERREURS:
- status (text) - FK fin_payment_statuses
- status_reason (text) - Raison échec/annulation
- error_details (jsonb) - Détails techniques erreur

DATES ÉVÉNEMENTS:
- processed_at (timestamptz) - Date traitement effectif
- failed_at (timestamptz) - Date échec
- cancelled_at (timestamptz) - Date annulation

DOCUMENTATION:
- notes (text) - Commentaires admin
- metadata (jsonb)

AUDIT:
- created_at (timestamptz)
- created_by (uuid) - FK adm_provider_employees
- updated_at (timestamptz)
- updated_by (uuid) - FK adm_provider_employees
- deleted_at (timestamptz)
- deleted_by (uuid) - FK adm_provider_employees
- deletion_reason (text)
```

**Contraintes et Index V2:**

```sql
CONTRAINTES:
- UNIQUE (payment_batch_id, driver_id) WHERE deleted_at IS NULL
- CHECK (amount >= 0)
- CHECK (period_end IS NULL OR period_end >= period_start)
- CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash'))
- CHECK (amount_in_tenant_currency IS NULL OR amount_in_tenant_currency >= 0)
- CHECK (exchange_rate IS NULL OR exchange_rate > 0)

INDEX:
- btree (tenant_id)
- btree (driver_id)
- btree (payment_batch_id)
- btree (payment_method)
- btree (status) WHERE deleted_at IS NULL
- btree (payment_date DESC)
- btree (period_start)
- btree (period_end)
- btree (payout_account_id)
- btree (transaction_reference)
- gin (metadata)
```

---

#### Table 55: `fin_toll_transactions` - Péages automatisés multi-pays

**Rôle critique:**

- Enregistrement automatique passages péages (Salik, autoroutes)
- Référentiel central portiques avec tarifs
- Support tarification variable (heures, classes véhicules)
- Déduction automatique salaire driver
- Lien avec courses pour facturation client

**Existant V1:**

- Driver et vehicle simples
- toll_gate (texte libre) - PROBLÈME: pas de référentiel
- toll_date (date) - PROBLÈME: pas d'heure, plusieurs passages/jour impossibles
- Montant et devise
- Pas de statut
- Pas de source (manuel vs automatique)
- Pas de lien avec paiements
- Contrainte unique trop restrictive

**Structure complète V2:**

```sql
IDENTITÉ ET ACTEURS:
- id (uuid) - PK
- tenant_id (uuid) - FK adm_tenants
- driver_id (uuid) - FK rid_drivers
- vehicle_id (uuid) - FK flt_vehicles
- toll_gate_id (uuid) - FK dir_toll_gates (référentiel)

HORODATAGE:
- toll_timestamp (timestamptz) - Date ET heure précise du passage

MONTANT:
- amount (numeric(14,2)) - Montant facturé >= 0
- currency (char(3)) - Devise

SOURCE ET STATUT:
- source (text) - automatic (GPS/AVL), manual, imported
- status (text) - pending, charged, refunded, disputed

LIENS FINANCIERS:
- payment_batch_id (uuid) - FK fin_driver_payment_batches (si déduit lot)
- driver_payment_id (uuid) - FK fin_driver_payments (si déduit paiement)

LIEN MÉTIER:
- trip_id (uuid) - FK trp_trips (si lié à une course)

AUDIT:
- metadata (jsonb)
- created_at (timestamptz)
- created_by (uuid) - FK adm_members
- updated_at (timestamptz)
- updated_by (uuid) - FK adm_members
- deleted_at (timestamptz)
- deleted_by (uuid) - FK adm_members
- deletion_reason (text)
```

**Contraintes et Index V2:**

```sql
CONTRAINTES:
- UNIQUE (tenant_id, driver_id, vehicle_id, toll_gate_id, toll_timestamp) WHERE deleted_at IS NULL
- CHECK (amount >= 0)
- CHECK (source IN ('automatic', 'manual', 'imported'))
- CHECK (status IN ('pending', 'charged', 'refunded', 'disputed'))

INDEX:
- btree (tenant_id, toll_timestamp DESC)
- btree (driver_id)
- btree (vehicle_id)
- btree (toll_gate_id)
- btree (status) WHERE deleted_at IS NULL
- btree (source)
- btree (payment_batch_id)
- btree (trip_id)
```

---

#### Table 56: `fin_traffic_fines` - Amendes avec workflow complet

**Rôle critique:**

- Gestion amendes routières avec référentiel types
- Workflow contestation complet
- Déduction automatique salaire
- Suivi points permis
- Alertes deadline pour éviter majorations

**Existant V1:**

- Driver et vehicle simples
- fine_reference unique par tenant
- fine_date (date) - PROBLÈME: pas d'heure
- fine_type (texte libre) - PROBLÈME: pas de référentiel
- Montant et devise
- Statut limité (pending, paid, disputed, cancelled)
- Pas de workflow contestation
- Pas de lien avec paiements
- Pas de points permis
- Pas de géolocalisation

**Structure complète V2:**

```sql
IDENTITÉ ET ACTEURS:
- id (uuid) - PK
- tenant_id (uuid) - FK adm_tenants
- driver_id (uuid) - FK rid_drivers
- vehicle_id (uuid) - FK flt_vehicles

INFRACTION:
- fine_reference (text) - Référence PV officielle
- fine_timestamp (timestamptz) - Date ET heure infraction
- fine_type_id (uuid) - FK dir_fine_types (référentiel)

LOCALISATION:
- location (point) - Coordonnées GPS infraction
- address (text) - Adresse lisible

MONTANT ET POINTS:
- amount (numeric(14,2)) - Montant amende >= 0
- currency (char(3)) - Devise
- points_penalty (integer) - Points permis retirés (nullable)

AUTORITÉ:
- issuing_authority (text) - Police, RTA, municipalité

DATES CRITIQUES:
- deadline_date (date) - Date limite paiement sans majoration
- paid_at (timestamptz) - Date paiement effectif

STATUT:
- status (text) - pending, processing, disputed, cancelled, paid, refunded

LIENS FINANCIERS:
- payment_method_id (uuid) - FK bil_payment_methods
- driver_payment_id (uuid) - FK fin_driver_payments (si déduit salaire)

CONTESTATION:
- dispute_id (uuid) - FK fin_traffic_fine_disputes

AUDIT:
- metadata (jsonb)
- created_at (timestamptz)
- created_by (uuid) - FK adm_members
- updated_at (timestamptz)
- updated_by (uuid) - FK adm_members
- deleted_at (timestamptz)
- deleted_by (uuid) - FK adm_members
- deletion_reason (text)
```

**Contraintes et Index V2:**

```sql
CONTRAINTES:
- UNIQUE (tenant_id, fine_reference) WHERE deleted_at IS NULL
- CHECK (amount >= 0)
- CHECK (points_penalty IS NULL OR points_penalty >= 0)
- CHECK (status IN ('pending', 'processing', 'disputed', 'cancelled', 'paid', 'refunded'))

INDEX:
- btree (tenant_id, fine_timestamp DESC)
- btree (driver_id)
- btree (vehicle_id)
- btree (fine_type_id)
- btree (status) WHERE deleted_at IS NULL
- btree (payment_method_id)
- btree (driver_payment_id)
- btree (issuing_authority)
- btree (deadline_date)
```

---

## NOUVELLES TABLES À CRÉER - DOMAINE FINANCE

### Tables référentielles (8 nouvelles tables)

#### Table 57: `fin_account_types` - Types de comptes extensibles

```sql
CREATE TABLE fin_account_types (
  code text PRIMARY KEY,
  label text NOT NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Données initiales
INSERT INTO fin_account_types (code, label, description) VALUES
  ('bank', 'Compte bancaire', 'Compte bancaire classique'),
  ('cash', 'Caisse', 'Caisse espèces'),
  ('digital', 'Compte digital', 'Wallet digital (Stripe, Adyen, PayPal)'),
  ('fuel_card', 'Carte carburant', 'Carte carburant prépayée'),
  ('maintenance_card', 'Carte maintenance', 'Carte maintenance garage'),
  ('toll_account', 'Compte péage', 'Compte péage (Salik, Télépéage)'),
  ('investor', 'Compte investisseur', 'Compte dividendes investisseurs');
```

#### Table 58: `dir_transaction_types` - Types de transactions normalisés

```sql
CREATE TABLE dir_transaction_types (
  code varchar(30) PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO dir_transaction_types (code, description) VALUES
  ('credit', 'Crédit sur un compte'),
  ('debit', 'Débit sur un compte'),
  ('transfer_in', 'Transfert entrant'),
  ('transfer_out', 'Transfert sortant'),
  ('refund', 'Remboursement'),
  ('chargeback', 'Contestation/Chargeback');
```

#### Table 59: `dir_transaction_statuses` - Statuts transactions harmonisés

```sql
CREATE TABLE dir_transaction_statuses (
  code varchar(30) PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO dir_transaction_statuses (code, description) VALUES
  ('pending', 'Créée mais non finalisée'),
  ('initiated', 'Envoyée au prestataire'),
  ('processing', 'En cours de traitement'),
  ('completed', 'Confirmée et comptabilisée'),
  ('failed', 'Échec'),
  ('cancelled', 'Annulée'),
  ('refunded', 'Remboursée'),
  ('chargeback', 'Disputée/annulée par le PSP');
```

#### Table 60: `fin_transaction_categories` - Catégories pour P&L

```sql
CREATE TABLE fin_transaction_categories (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  code varchar(50) UNIQUE NOT NULL, -- pour référence stable
  name text NOT NULL,
  description text NULL,
  category_type varchar(30) NOT NULL CHECK (category_type IN ('revenue', 'expense', 'transfer', 'other')),
  parent_category_id uuid NULL REFERENCES fin_transaction_categories(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Exemples de catégories
INSERT INTO fin_transaction_categories (code, name, category_type) VALUES
  ('trip_revenue', 'Revenus courses', 'revenue'),
  ('driver_salary', 'Salaires chauffeurs', 'expense'),
  ('toll_expense', 'Frais péages', 'expense'),
  ('fine_expense', 'Amendes', 'expense'),
  ('fuel_expense', 'Carburant', 'expense'),
  ('maintenance_expense', 'Maintenance', 'expense'),
  ('penalty_revenue', 'Pénalités chauffeurs', 'revenue'),
  ('refund_expense', 'Remboursements', 'expense');
```

#### Table 61: `fin_payment_batch_statuses` - Statuts lots de paie

```sql
CREATE TABLE fin_payment_batch_statuses (
  code text PRIMARY KEY,
  label text NOT NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO fin_payment_batch_statuses (code, label, description) VALUES
  ('draft', 'Brouillon', 'Lot créé mais non finalisé'),
  ('exported', 'Exporté', 'Fichier SIF/SEPA généré'),
  ('sent', 'Envoyé', 'Transmis à la banque'),
  ('processed', 'Traité', 'Traitement banque confirmé'),
  ('completed', 'Complété', 'Tous paiements effectués'),
  ('failed', 'Échoué', 'Échec traitement'),
  ('cancelled', 'Annulé', 'Annulation avant envoi'),
  ('rejected', 'Rejeté', 'Rejeté par la banque');
```

#### Table 62: `fin_payment_statuses` - Statuts paiements individuels

```sql
CREATE TABLE fin_payment_statuses (
  code text PRIMARY KEY,
  label text NOT NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO fin_payment_statuses (code, label, description) VALUES
  ('draft', 'Brouillon', 'Paiement créé mais non finalisé'),
  ('pending', 'En attente', 'En attente traitement'),
  ('processing', 'En cours', 'En cours de traitement'),
  ('completed', 'Complété', 'Paiement effectué'),
  ('failed', 'Échoué', 'Échec paiement'),
  ('cancelled', 'Annulé', 'Annulé avant traitement'),
  ('reversed', 'Reversé', 'Paiement inversé');
```

#### Table 63: `dir_toll_gates` - Portiques de péage multi-pays

```sql
CREATE TABLE dir_toll_gates (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  country_code char(2) NOT NULL REFERENCES dir_country_regulations(country_code) ON UPDATE CASCADE ON DELETE CASCADE,
  gate_code varchar(50) NOT NULL, -- Code unique portique
  gate_name text NOT NULL, -- Nom lisible
  location point NULL, -- Coordonnées GPS
  base_fee numeric(12,2) NOT NULL DEFAULT 0, -- Tarif de base
  currency char(3) NOT NULL, -- Devise
  rate_schedule jsonb NULL DEFAULT '{}', -- Tarifs variables (heures, classes véhicules)
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  active_from date NULL, -- Date mise en service
  active_to date NULL, -- Date désactivation
  operator varchar(100) NULL, -- Opérateur (Salik, Autoroutes du Sud, etc.)
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dir_toll_gates_country_gate_code_uq UNIQUE (country_code, gate_code)
);

CREATE INDEX ON dir_toll_gates (country_code);
CREATE INDEX ON dir_toll_gates (status);
CREATE INDEX ON dir_toll_gates (operator);

-- Exemples Salik Dubai
INSERT INTO dir_toll_gates (country_code, gate_code, gate_name, base_fee, currency, operator) VALUES
  ('AE', 'SALIK_AL_MAKTOUM', 'Al Maktoum Bridge', 4.00, 'AED', 'Salik'),
  ('AE', 'SALIK_AL_GARHOUD', 'Al Garhoud Bridge', 4.00, 'AED', 'Salik'),
  ('AE', 'SALIK_BUSINESS_BAY', 'Business Bay Crossing', 4.00, 'AED', 'Salik');
```

#### Table 64: `dir_fine_types` - Types d'amendes par juridiction

```sql
CREATE TABLE dir_fine_types (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  jurisdiction char(2) NOT NULL, -- Code pays ou région
  code varchar(50) NOT NULL, -- SPEED, PARK, LICENCE, RED_LIGHT, etc.
  description text NOT NULL, -- Excès de vitesse, stationnement illégal, etc.
  min_amount numeric(14,2) NOT NULL, -- Montant minimum
  max_amount numeric(14,2) NOT NULL, -- Montant maximum
  points integer NULL, -- Points permis retirés (si applicable)
  is_criminal boolean NOT NULL DEFAULT false, -- Infraction criminelle
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}', -- Règles spécifiques, majorations
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dir_fine_types_jurisdiction_code_uq UNIQUE (jurisdiction, code),
  CONSTRAINT dir_fine_types_amounts_check CHECK (max_amount >= min_amount)
);

CREATE INDEX ON dir_fine_types (jurisdiction);
CREATE INDEX ON dir_fine_types (code);
CREATE INDEX ON dir_fine_types (active);

-- Exemples UAE
INSERT INTO dir_fine_types (jurisdiction, code, description, min_amount, max_amount, points) VALUES
  ('AE', 'SPEED_MINOR', 'Excès de vitesse < 20 km/h', 300, 600, 0),
  ('AE', 'SPEED_MAJOR', 'Excès de vitesse >= 20 km/h', 600, 3000, 2),
  ('AE', 'RED_LIGHT', 'Griller feu rouge', 1000, 1000, 12),
  ('AE', 'PARKING', 'Stationnement interdit', 200, 500, 0),
  ('AE', 'NO_LICENCE', 'Conduite sans permis', 5000, 5000, 23);

-- Exemples France
INSERT INTO dir_fine_types (jurisdiction, code, description, min_amount, max_amount, points) VALUES
  ('FR', 'SPEED_MINOR', 'Excès de vitesse < 20 km/h', 68, 135, 1),
  ('FR', 'SPEED_MAJOR', 'Excès de vitesse >= 20 km/h', 135, 1500, 4),
  ('FR', 'RED_LIGHT', 'Feu rouge', 135, 135, 4),
  ('FR', 'PARKING', 'Stationnement gênant', 35, 135, 0);
```

#### Table 65: Tables workflow (1 nouvelle table)

#### Table 65 `fin_traffic_fine_disputes` - Contestations amendes

```sql
CREATE TABLE fin_traffic_fine_disputes (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  fine_id uuid NOT NULL REFERENCES fin_traffic_fines(id) ON UPDATE CASCADE ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE CASCADE,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL, -- Motif contestation
  supporting_documents jsonb NULL, -- URLs documents justificatifs
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  resolved_at timestamptz NULL,
  resolution_notes text NULL, -- Décision et justification
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON fin_traffic_fine_disputes (fine_id);
CREATE INDEX ON fin_traffic_fine_disputes (submitted_by);
CREATE INDEX ON fin_traffic_fine_disputes (status);
CREATE INDEX ON fin_traffic_fine_disputes (submitted_at);
```

### Domaine Revenue (3 tables)

### TABLE 66: `rev_revenue_imports` - Point d'entrée

#### Existant V1:

**Structure basique:**

- `id`, `tenant_id`
- `import_reference` (identifiant fichier)
- `import_date`, `status`, `total_revenue`
- `currency`, `metadata`
- Contrainte unique: `(tenant_id, import_reference)`

**Statuts supportés:**

- `pending`, `processing`, `completed`, `failed`, `cancelled`

**Limitations V1:**

- ❌ Pas de lien vers la plateforme source
- ❌ Pas de type d'import (CSV vs API)
- ❌ Pas de statistiques (nb lignes, erreurs)
- ❌ Pas de gestion multi-devises
- ❌ Pas de stockage du fichier source

#### Évolutions V2:

**1. Traçabilité de la source**

```
AJOUTER:
- platform_id (uuid FK dir_platforms)
  → Identifier Uber, Bolt, Careem
- source_type (varchar)
  → 'api', 'file_csv', 'file_excel', 'manual'
- file_url (text)
  → Chemin vers fichier original stocké
```

**Pourquoi:** Tracer l'origine exacte facilite debug et audit. En cas de litige, on retrouve le fichier source.

**2. Gestion multi-devises**

```
AJOUTER:
- source_currency (char(3))
  → Devise d'origine de la plateforme
- exchange_rate (numeric(12,6))
  → Taux appliqué pour conversion
- converted_amount (numeric(18,2))
  → Montant après conversion en devise tenant
```

**Pourquoi:** Opérateurs multi-pays reçoivent des revenus en AED (UAE), EUR (France), etc. Conversion transparente obligatoire.

**3. Statistiques et qualité**

```
AJOUTER:
- rows_count (integer)
  → Nombre de lignes importées
- errors_count (integer)
  → Nombre d'erreurs détectées
- warnings_count (integer)
  → Alertes non bloquantes
- processing_started_at (timestamp)
- processing_completed_at (timestamp)
- processing_duration (interval) GENERATED
```

**Pourquoi:** Monitoring temps réel, détection imports problématiques, KPIs de qualité.

**4. Statut enrichi**

```
MODIFIER status vers ENUM:
- pending
- processing
- completed
- partially_completed (nouveau)
- failed
- cancelled

AJOUTER:
- status_reason (text)
  → Explication du statut
- retry_count (integer)
  → Nombre de tentatives
- last_error (text)
  → Dernier message d'erreur
```

**Pourquoi:** Gestion des cas limites (import partiel), automatisation des retry, debugging facilité.

#### Structure V2 proposée:

```
rev_revenue_imports V2:
├── Identification
│   ├── id (uuid)
│   ├── tenant_id (uuid FK)
│   └── import_reference (varchar) UNIQUE par tenant
│
├── Source et traçabilité
│   ├── platform_id (uuid FK dir_platforms)
│   ├── source_type (varchar)
│   ├── file_url (text)
│   └── import_date (date)
│
├── Montants et devises
│   ├── source_currency (char(3))
│   ├── exchange_rate (numeric(12,6))
│   ├── total_revenue (numeric(18,2))
│   └── converted_amount (numeric(18,2))
│
├── Statistiques
│   ├── rows_count (integer)
│   ├── errors_count (integer)
│   ├── warnings_count (integer)
│   ├── processing_started_at (timestamp)
│   ├── processing_completed_at (timestamp)
│   └── processing_duration (interval) GENERATED
│
├── Statut et erreurs
│   ├── status (ENUM)
│   ├── status_reason (text)
│   ├── retry_count (integer)
│   └── last_error (text)
│
└── Audit standard
    ├── metadata (jsonb)
    ├── created_at, created_by
    ├── updated_at, updated_by
    └── deleted_at, deleted_by, deletion_reason
```

---

### TABLE 67: `rev_driver_revenues` - Agrégation intelligente

#### Existant V1:

**Structure basique:**

- `id`, `tenant_id`, `driver_id`
- `period_start`, `period_end`
- `total_revenue`, `commission_amount`, `net_revenue`
- `metadata`
- Contrainte unique: `(tenant_id, driver_id, period_start)`

**Limitations V1:**

- ❌ Toutes plateformes mélangées (impossible distinguer Uber vs Bolt)
- ❌ Pas de type de période (week/month?)
- ❌ Pas de statut validation
- ❌ Pas de lien vers import source
- ❌ Pas de devise explicite

#### Évolutions V2:

**1. Granularité par plateforme**

```
AJOUTER:
- platform_id (uuid FK dir_platforms) NULLABLE
  → NULL = consolidé toutes plateformes
  → NON NULL = revenus par plateforme

MODIFIER contrainte unique:
- (tenant_id, driver_id, platform_id, period_start)
  → Permet plusieurs lignes par période (une par plateforme + une consolidée)
```

**Pourquoi:**

- Driver peut travailler Uber + Bolt en parallèle
- Commissions différentes par plateforme
- Reporting précis par source de revenu

**Exemple:**

```
Driver Mohamed, semaine du 14/10:
1. platform_id=NULL    → total_revenue=5000 AED (consolidé)
2. platform_id=Uber    → total_revenue=3000 AED
3. platform_id=Bolt    → total_revenue=2000 AED
```

**2. Type de période explicite**

```
AJOUTER:
- period_type (varchar)
  → 'week', 'biweekly', 'month'
  → Default basé sur cooperation_terms
```

**Pourquoi:** Drivers ont différents cycles de paiement. Facilite génération rapports et calculs automatiques.

**3. Traçabilité import**

```
AJOUTER:
- import_id (uuid FK rev_revenue_imports)
  → Lien vers le fichier source
```

**Pourquoi:** En cas d'erreur import, on peut identifier et recalculer toutes les lignes affectées.

**4. Workflow de validation**

```
AJOUTER:
- status (ENUM)
  → 'pending', 'validated', 'adjusted', 'disputed'
- validated_by (uuid FK adm_members)
- validated_at (timestamp)
- adjustment_reason (text)
  → Pourquoi montant modifié manuellement
```

**Pourquoi:**

- Évite paiements incorrects
- Traçabilité des ajustements manuels
- Workflow approbation avant paiement

**5. Support multi-devises**

```
AJOUTER:
- currency (char(3))
  → Devise des montants stockés
```

**Pourquoi:** Évite ambiguïté, prépare multi-pays.

**6. Détails breakdown**

```
ENRICHIR metadata avec structure:
{
  "trips_count": 145,
  "platform_commission_rate": 0.25,
  "platform_commission_amount": 1250.00,
  "fleetcore_commission_rate": 0.10,
  "fleetcore_commission_amount": 375.00,
  "fuel_deductions": 200.00,
  "fine_deductions": 50.00,
  "advance_deductions": 100.00,
  "breakdown_by_vehicle": {...}
}
```

**Pourquoi:** Transparence totale sur composition du revenu net.

#### Structure V2 proposée:

```
rev_driver_revenues V2:
├── Identification
│   ├── id (uuid)
│   ├── tenant_id (uuid FK)
│   ├── driver_id (uuid FK)
│   └── platform_id (uuid FK) NULLABLE
│
├── Période
│   ├── period_start (date)
│   ├── period_end (date)
│   └── period_type (varchar)
│
├── Montants
│   ├── total_revenue (numeric(18,2))
│   ├── commission_amount (numeric(18,2))
│   ├── net_revenue (numeric(18,2))
│   └── currency (char(3))
│
├── Traçabilité
│   ├── import_id (uuid FK rev_revenue_imports)
│   ├── status (ENUM)
│   ├── validated_by (uuid FK)
│   ├── validated_at (timestamp)
│   └── adjustment_reason (text)
│
└── Audit
    ├── metadata (jsonb) - Structure enrichie
    ├── created_at, created_by
    ├── updated_at, updated_by
    └── deleted_at, deleted_by, deletion_reason

CONTRAINTE UNIQUE:
- (tenant_id, driver_id, platform_id, period_start)
  WHERE deleted_at IS NULL

CHECKS:
- period_end >= period_start
- total_revenue >= 0
- commission_amount >= 0
- net_revenue >= 0
```

---

### TABLE 68: `rev_reconciliations` - Contrôle financier

#### Existant V1:

**Structure basique:**

- `id`, `tenant_id`, `import_id`
- `reconciliation_date`
- `status` (text libre), `notes`
- `metadata`
- Contrainte unique: `(tenant_id, import_id, reconciliation_date)`

**Limitations V1:**

- ❌ Pas de montants (attendu vs reçu)
- ❌ Pas de type de réconciliation
- ❌ Pas de devise
- ❌ Pas de détails par driver/plateforme
- ❌ Statuts non normalisés

#### Évolutions V2:

**1. Types de réconciliation**

```
AJOUTER:
- reconciliation_type (varchar)
  → 'platform_payment' (virement Uber/Bolt)
  → 'cash_collection' (espèces collectées)
  → 'bank_statement' (relevé bancaire)
  → 'adjustment' (correction manuelle)
```

**Pourquoi:** Différentes sources nécessitent différents workflows de validation.

**2. Montants et écarts**

```
AJOUTER:
- expected_amount (numeric(18,2))
  → Montant calculé depuis rev_driver_revenues
- received_amount (numeric(18,2))
  → Montant reçu (virement, espèces, etc.)
- difference_amount (numeric(18,2)) GENERATED
  → received_amount - expected_amount
- currency (char(3))
```

**Pourquoi:**

- Quantifier écarts sans croiser plusieurs tables
- Alertes automatiques si différence > seuil
- KPIs de qualité (% réconciliations parfaites)

**3. Statuts normalisés**

```
MODIFIER status vers ENUM:
- pending (en attente)
- matched (concordance parfaite)
- mismatched (écart détecté)
- adjusted (écart corrigé manuellement)
- cancelled (annulé)

AJOUTER:
- tolerance_amount (numeric(18,2))
  → Écart acceptable (ex: 5 AED)
- auto_matched (boolean)
  → TRUE si rapprochement automatique
```

**Pourquoi:** Automatisation basée sur règles métier (écart < 5 AED → auto-match).

**4. Table détails des écarts**

### TABLE 69: `rev_reconciliation_lines` - Contrôle financier

Structure:
├── id (uuid)
├── reconciliation_id (uuid FK)
├── driver_id (uuid FK) NULLABLE
├── platform_id (uuid FK) NULLABLE
├── expected_amount (numeric(18,2))
├── received_amount (numeric(18,2))
├── difference_amount (numeric(18,2)) GENERATED
├── notes (text)
└── metadata (jsonb)

```

**Pourquoi:**
- Détail des écarts par driver
- Investigation rapide des problèmes
- Reporting précis pour plateformes

**Exemple:**
```

Réconciliation import #123:

- Expected: 50,000 AED
- Received: 49,800 AED
- Différence: -200 AED

Détails (rev_reconciliation_lines):

1. Driver Mohamed → -100 AED (Uber a retenu une amende)
2. Driver Ahmed → -50 AED (Course annulée non déduite)
3. Driver Fatima → -50 AED (Erreur calcul commission)

```

**5. Workflow et notifications**
```

AJOUTER:

- assigned_to (uuid FK adm_members)
  → Responsable de la réconciliation
- resolved_at (timestamp)
- resolved_by (uuid FK adm_members)
- resolution_notes (text)
- requires_action (boolean)

```

**Pourquoi:**
- Assignation automatique selon type
- SLA de résolution
- Notifications automatiques

#### Structure V2 proposée:

```

rev_reconciliations V2:
├── Identification
│ ├── id (uuid)
│ ├── tenant_id (uuid FK)
│ ├── import_id (uuid FK rev_revenue_imports)
│ └── reconciliation_date (date)
│
├── Type et montants
│ ├── reconciliation_type (varchar)
│ ├── expected_amount (numeric(18,2))
│ ├── received_amount (numeric(18,2))
│ ├── difference_amount (numeric(18,2)) GENERATED
│ ├── tolerance_amount (numeric(18,2))
│ └── currency (char(3))
│
├── Statut et workflow
│ ├── status (ENUM)
│ ├── auto_matched (boolean)
│ ├── assigned_to (uuid FK)
│ ├── resolved_at (timestamp)
│ ├── resolved_by (uuid FK)
│ ├── resolution_notes (text)
│ └── requires_action (boolean)
│
├── Documentation
│ ├── notes (text)
│ └── metadata (jsonb)
│
└── Audit
├── created_at, created_by
├── updated_at, updated_by
└── deleted_at, deleted_by, deletion_reason

CONTRAINTE UNIQUE:

- (tenant_id, import_id, reconciliation_date)
  WHERE deleted_at IS NULL

---

### Domaine Billing SaaS (6 tables)

#### Table 70: `bil_billing_plans` - Plans et tarification

**Existant V1:**

- Plan name et description basiques
- Monthly/annual fees simples
- Features en JSON non structuré
- Pas d'identifiant technique stable
- Pas de quotas inclus

**Évolutions V2:**

```sql
AJOUTER:
- plan_code (varchar 100) UNIQUE - Identifiant technique stable
  * Permet renommage marketing sans casser les références
  * Utilisé dans le code et intégrations (Stripe)

- max_vehicles (integer) - Quota véhicules inclus
- max_drivers (integer) - Quota conducteurs inclus
- max_users (integer) - Quota utilisateurs inclus
  * Base pour calcul des dépassements
  * NULL = illimité

- vat_rate (numeric 5,2) - Taux TVA par défaut
  * 5% pour UAE, 20% pour FR
  * Appliqué automatiquement à la facturation

- billing_interval (varchar 10) - 'month' ou 'year'
  * Intervalle de facturation par défaut

- version (integer) DEFAULT 1 - Versioning des plans
  * Permet évolutions tarifaires sans perdre historique
  * Chaque version = nouveau tarif avec date effet

MODIFIER status ENUM:
- draft, active, deprecated, archived
  * draft: préparation, non visible clients
  * active: disponible souscription
  * deprecated: plus proposé, mais existant honoré
  * archived: historique uniquement

AJOUTER intégration Stripe:
- stripe_price_id_monthly (text)
- stripe_price_id_yearly (text)
  * Références vers objets Price Stripe
  * Automatise synchronisation facturation

RENOMMER pour cohérence:
- monthly_fee → price_monthly
- annual_fee → price_yearly

AJOUTER contrainte unique:
- UNIQUE (plan_code, version) WHERE deleted_at IS NULL
```

#### Table 71: `bil_tenant_subscriptions` - Abonnements clients

**Existant V1:**

- Liaison simple tenant → plan
- Dates start/end basiques
- Status limité (active, inactive, cancelled)
- Pas de gestion période facturation
- Pas de référence prestataire paiement

**Évolutions V2:**

```sql
AJOUTER gestion cycle facturation:
- billing_cycle (varchar 10) NOT NULL DEFAULT 'monthly'
  * 'monthly' ou 'yearly'
  * Détermine fréquence facturation

- current_period_start (timestamptz)
- current_period_end (timestamptz)
  * Période facturation en cours
  * Utilisé pour calcul metrics et proration

- trial_end (timestamptz)
  * Fin période essai gratuit (14 jours défaut)
  * Conversion auto en payant après cette date

- cancel_at_period_end (boolean) NOT NULL DEFAULT true
  * Si true: annulation à fin période (pas immédiate)
  * Si false: annulation et suspension immédiates

AJOUTER gestion multi-PSP:
- provider (varchar 50) - 'stripe', 'adyen', 'paypal'
  * Nom prestataire de paiement utilisé
  * Permet migration entre PSP sans perte données

- provider_subscription_id (text)
- provider_customer_id (text)
  * Identifiants chez le PSP
  * Utilisés pour webhooks et synchronisation
  * Indexés pour performance

ENRICHIR statuts:
- trialing, active, past_due, suspended, cancelling, cancelled, inactive
  * trialing: période essai
  * active: abonnement actif et payé
  * past_due: paiement échoué, en attente
  * suspended: suspendu (impayé, violation TOS)
  * cancelling: annulation programmée fin période
  * cancelled: annulé effectif
  * inactive: ancien abonnement archivé

AJOUTER historique et contexte:
- previous_plan_id (uuid) REFERENCES bil_billing_plans(id)
  * Plan précédent lors upgrade/downgrade
  * Permet calcul proration

- plan_version (integer)
  * Version du plan souscrit
  * Fige tarif même si plan évolue

- payment_method_id (uuid) REFERENCES bil_payment_methods(id)
  * Moyen paiement utilisé pour cet abonnement
  * Si NULL, utilise moyen par défaut tenant

- auto_renew (boolean) NOT NULL DEFAULT true
  * Renouvellement automatique à fin période
  * Si false, passage en cancelled à l'échéance

MODIFIER contrainte unique:
- UNIQUE (tenant_id) WHERE deleted_at IS NULL
  * Un seul abonnement actif par tenant
  * Plusieurs peuvent exister avec deleted_at
```

**Cas d'usage des évolutions:**

- **Cycle + périodes**: Facturation mensuelle du 1er au 30, metrics agrégées sur cette période
- **Trial**: 14 jours gratuit → trial_end = date_start + 14 jours → passage auto à active
- **Multi-PSP**: Client UAE sur Stripe, client FR sur Adyen → provider différent
- **past_due**: Paiement échoué → webhook → status past_due → email relance → retry auto 3 jours
- **cancel_at_period_end**: Client annule le 15 → active jusqu'au 30 → cancelled le 31
- **Versioning**: Client sur plan Basic v1 à 49€ → plan passe v2 à 59€ → client garde v1

#### Table 72: `bil_tenant_usage_metrics` - Métriques consommation

**Existant V1:**

- Metric_name en texte libre (risque erreurs)
- Metric_value simple sans unité
- Périodes en dates (pas de granularité horaire)
- Pas de distinction type période (jour/semaine/mois)
- Pas de lien avec plan/souscription

**Évolutions V2:**

```sql
CRÉER table référence types métriques:
CREATE TABLE bil_usage_metric_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(50) UNIQUE NOT NULL,
    * active_vehicles, active_drivers, total_trips
    * total_revenue, storage_used_mb, api_calls
    * support_tickets
  unit varchar(20) NOT NULL,
    * count, AED, USD, MB, calls
  description text
  * Documentation claire de chaque métrique
);

MODIFIER bil_tenant_usage_metrics:
REMPLACER:
- metric_name (varchar) → metric_type_id (uuid FK)
  * Référence vers table types (normalisé)
  * Évite fautes frappe et incohérences
  * Permet ajout colonnes (unité, description)

AMÉLIORER précision périodes:
- period_start (date) → period_start_ts (timestamptz)
- period_end (date) → period_end_ts (timestamptz)
  * Granularité horaire au lieu de journalière
  * Support zones horaires (critical multi-pays)
  * Permet périodes partielles précises

AJOUTER type de période:
- period_type (varchar 10) NOT NULL
  * 'day', 'week', 'month'
  * CHECK IN ('day','week','month')
  * Simplifie agrégations et requêtes
  * Permet mix plusieurs types dans table

AJOUTER contexte facturation:
- subscription_id (uuid) REFERENCES bil_tenant_subscriptions(id)
  * Lie metrics à abonnement actif
  * Facilite calcul dépassements par période

- plan_version (integer)
  * Version du plan durant cette période
  * Permet appliquer bons quotas pour calcul overage

- metric_source (varchar 20)
  * 'internal', 'api', 'import', 'calculated'
  * Traçabilité origine données

AMÉLIORER précision valeur:
- metric_value (numeric 18,2) → (numeric 20,4)
  * Plus de précision décimale
  * Support grandes valeurs (ex: revenus)

MODIFIER contrainte unique:
- (tenant_id, metric_name, period_start)
  → (tenant_id, metric_type_id, period_type, period_start_ts)
  * Plus précis avec nouveaux champs
```

**Cas d'usage des évolutions:**

- **metric_type_id**: Plus de typo "active_vehicules" vs "active_vehicles", liste contrôlée
- **Timestamps**: Période du 2025-01-15 14:30 au 2025-01-15 23:59 (changement plan en cours journée)
- **period_type**: Agrégation jour pour suivi temps réel, mois pour facturation
- **subscription_id**: Quota plan Pro = 50 véhicules, metrics période = 75 → overage 25
- **metric_source**: Valeur vient API externe → auditabilité en cas de litige
- **Précision**: Revenue 12,456.7834 AED au lieu de 12,456.78 AED

#### Table 73: `bil_tenant_invoices` - Factures SaaS

**Existant V1:**

- Invoice_number basique
- Total_amount unique sans détail
- Status limité (draft, sent, paid, overdue)
- Pas de périodes facturation
- Pas de gestion taxes/remises
- Pas de référence abonnement/PSP

**Évolutions V2:**

```sql
AJOUTER lien abonnement:
- subscription_id (uuid) NOT NULL REFERENCES bil_tenant_subscriptions(id)
  * Facture rattachée à quel abonnement
  * CASCADE si abonnement supprimé
  * Permet tracer historique facturation

AJOUTER périodes facturation:
- period_start (timestamptz) NOT NULL
- period_end (timestamptz) NOT NULL
  * Période couverte par la facture
  * Aligné sur current_period de subscription
  * Utilisé pour sélectionner metrics à facturer

DÉTAILLER montants:
- subtotal (numeric 18,2) NOT NULL
  * Montant HT (plan + overages)
  * Avant application taxes/remises

- tax_rate (numeric 5,2)
  * Taux TVA appliqué (5% UAE, 20% FR)
  * Peut varier selon pays tenant

- tax_amount (numeric 18,2)
  * Montant TVA calculé
  * subtotal × tax_rate

- total_amount reste inchangé
  * Montant TTC final
  * subtotal + tax_amount - discounts

AJOUTER gestion paiements:
- amount_paid (numeric 18,2) DEFAULT 0
  * Montant déjà réglé
  * Support paiements partiels

- amount_due (numeric 18,2) DEFAULT 0
  * Montant restant à payer
  * total_amount - amount_paid

- paid_at (timestamptz)
  * Date paiement effectif
  * NULL si impayé, renseigné par webhook PSP

ENRICHIR statuts:
- draft, sent, paid, overdue, void, uncollectible
  * void: facture annulée (erreur, remboursement)
  * uncollectible: créance irrécouvrable après relances

AJOUTER intégration PSP:
- stripe_invoice_id (varchar 255)
  * ID facture chez Stripe
  * Utilisé par webhooks pour maj statut
  * Indexé pour performance lookups

- document_url (text)
  * URL PDF facture générée
  * Stocké S3/CDN
  * Envoyé au client dans emails

MODIFIER types dates:
- invoice_date (date) → (timestamptz)
- due_date (date) → (timestamptz)
  * Précision horaire + timezone
  * Important pour dates limite paiement

MODIFIER contrainte unique:
- (tenant_id, invoice_number) WHERE deleted_at IS NULL
  → (tenant_id, invoice_number, deleted_at)
  * Permet réutilisation numéro après soft delete
```

**Cas d'usage des évolutions:**

- **Périodes**: Facture période 2025-01-01 00:00 → 2025-01-31 23:59, metrics agrégées sur cette période
- **Détail montants**: Plan 99€ + Overage 25€ = 124€ HT, TVA 5% = 6.20€ → Total 130.20€
- **Paiements partiels**: Total 500€, paiement 1 = 200€ → amount_due = 300€, status reste 'sent'
- **void**: Facture émise par erreur (mauvais montant) → void → nouvelle facture correcte
- **Stripe sync**: Webhook invoice.payment_succeeded → trouve facture via stripe_invoice_id → status = paid
- **document_url**: PDF généré et uploadé S3 → URL stockée → envoyé email avec lien téléchargement

#### Table 74: `bil_tenant_invoice_lines` - Détail lignes factures

**Existant V1:**

- Description texte libre
- Amount simple sans décomposition
- Quantity sans unit_price explicite
- Pas de typage des lignes
- Pas de référence source (plan, metric, etc.)

**Évolutions V2:**

```sql
AJOUTER typage ligne:
- line_type (varchar 30) NOT NULL
  * CHECK IN ('plan_fee', 'overage_fee', 'tax', 'discount', 'other')
  * plan_fee: abonnement fixe mensuel/annuel
  * overage_fee: dépassement quotas (véhicules, drivers, etc.)
  * tax: ligne TVA
  * discount: réduction (promo, fidélité)
  * other: frais divers

DÉCOMPOSER montant:
- unit_price (numeric 18,2) NOT NULL
  * Prix unitaire de l'élément
  * Ex: 5€ par véhicule supplémentaire

- quantity reste inchangé mais:
  * Utilisé pour calcul: amount = unit_price × quantity
  * Ex: 15 véhicules en overage × 5€ = 75€

- amount (numeric 18,2) GENERATED ALWAYS AS (unit_price * quantity) STORED
  * Calculé automatiquement
  * Évite incohérences
  * Peut aussi rester manuel pour flexibilité

AJOUTER détail taxes/remises par ligne:
- tax_rate (numeric 5,2)
  * Taux TVA ligne spécifique
  * NULL si pas taxable

- tax_amount (numeric 18,2)
  * Montant TVA ligne
  * NULL si pas taxable

- discount_amount (numeric 18,2)
  * Montant remise ligne
  * Négatif ou colonne séparée selon politique

AJOUTER traçabilité source:
- source_type (varchar 30)
  * 'billing_plan', 'usage_metric', 'manual', 'promotion'
  * Indique origine de la ligne

- source_id (uuid)
  * ID entité source
  * plan_id si plan_fee
  * metric_id si overage_fee
  * promotion_id si discount
  * NULL si manual

CRÉER indexes:
- CREATE INDEX ON bil_tenant_invoice_lines (line_type)
- CREATE INDEX ON bil_tenant_invoice_lines (source_type, source_id)
  * Accélère requêtes reporting
  * Analyse revenus par type

MODIFIER contrainte unique:
- (invoice_id, description) WHERE deleted_at IS NULL
  → (invoice_id, description, deleted_at)
  * Permet même description après delete
```

**Cas d'usage des évolutions:**

- **Typage**: Facture avec 1 ligne plan_fee (99€), 2 lignes overage_fee (véhicules 25€, drivers 15€), 1 ligne tax (6.95€)
- **unit_price × quantity**: 15 véhicules excédentaires × 5€/véhicule = 75€
- **source**: Ligne "Overage véhicules" → source_type='usage_metric', source_id=UUID metric active_vehicles
- **discount**: Ligne "Promo BLACK FRIDAY -20%" → discount_amount = -19.80€ → réduit subtotal
- **tax par ligne**: Service A taxable 20%, Service B exonéré → tax_rate différent par ligne
- **Reporting**: SELECT SUM(amount) WHERE line_type='overage_fee' → revenus totaux overages

#### Table 75: `bil_payment_methods` - Moyens de paiement

**Existant V1:**

- Payment_type limité (card, bank, paypal)
- Provider_token générique sans distinction PSP
- Contrainte mono-méthode par type (1 seule carte active)
- Pas de notion "par défaut"
- Données carte non structurées (tout dans metadata)
- Pas de champ last_used

**Évolutions V2:**

```sql
AJOUTER identification PSP:
- provider (varchar 50) NOT NULL
  * 'stripe', 'adyen', 'paypal', 'checkout', etc.
  * Permet multi-PSP simultanés
  * Routage paiements selon provider

RENOMMER pour clarté:
- provider_token → provider_payment_method_id (text NOT NULL)
  * Plus explicite: c'est l'ID method côté PSP
  * Ex: pm_1234567890 (Stripe), pmt_abc123 (Adyen)

AJOUTER gestion défaut:
- is_default (boolean) NOT NULL DEFAULT false
  * Un seul moyen défaut par tenant
  * Utilisé auto pour nouvelles factures
  * Contrainte: UNIQUE (tenant_id) WHERE is_default=true AND deleted_at IS NULL

ÉTENDRE types paiement:
- payment_type enrichi:
  * CHECK IN ('card', 'bank_account', 'paypal', 'apple_pay', 'google_pay', 'other')
  * Support wallets digitaux

STRUCTURER données carte:
- card_brand (varchar 50) - 'Visa', 'Mastercard', 'Amex'
- card_last4 (char 4) - Derniers 4 chiffres
- card_exp_month (integer) - Mois expiration
- card_exp_year (integer) - Année expiration
  * Séparé de metadata pour requêtes faciles
  * Affichage client: "Visa •••• 4242 exp 12/2025"
  * Alertes expiration automatiques

STRUCTURER données compte bancaire:
- bank_name (varchar 100) - Nom banque
- bank_account_last4 (char 4) - 4 derniers chiffres IBAN
- bank_country (char 2) - Code pays ISO
  * Support SEPA, virement, prélèvement

ÉTENDRE statuts:
- active, inactive, expired, failed, pending_verification
  * pending_verification: vérification micro-dépôts en cours
  * failed: tentative utilisation échouée
  * expired: carte expirée (contrôle auto)

AJOUTER tracking usage:
- last_used_at (timestamptz)
  * Date dernière utilisation réussie
  * Identifier méthodes obsolètes
  * Proposer suppression si > 6 mois

MODIFIER contraintes:
SUPPRIMER:
- UNIQUE (tenant_id, payment_type) WHERE deleted_at IS NULL
  * Autorise multiples cartes, comptes

AJOUTER:
- UNIQUE (tenant_id) WHERE is_default=true AND deleted_at IS NULL
  * Un seul défaut par tenant

- UNIQUE (tenant_id, provider_payment_method_id) WHERE deleted_at IS NULL
  * Évite doublons même méthode

CRÉER indexes:
- CREATE INDEX ON bil_payment_methods (tenant_id, status) WHERE deleted_at IS NULL
- CREATE INDEX ON bil_payment_methods (expires_at) WHERE deleted_at IS NULL
  * Requêtes cartes expirant bientôt
```

**Cas d'usage des évolutions:**

- **Multi-cartes**: Tenant a Visa corporate + Mastercard backup → les deux actives, Visa en default
- **Multi-PSP**: Carte UAE via Stripe, carte FR via Adyen → provider différent
- **Affichage**: Client voit "Visa •••• 4242 (défaut)" et "Mastercard •••• 8888"
- **Expiration**: Cron daily vérifie card_exp_year/month → alerte 30j avant → email "renouveler carte"
- **failed**: Paiement échoué → status=failed → essai autre méthode active
- **last_used_at**: Carte non utilisée depuis 12 mois → suggestion suppression → sécurité
- **bank_account**: Client FR SEPA → bank_name="BNP Paribas", bank_country="FR", last4="5678"

---

## NOUVELLES TABLES À CRÉER - DOMAINE BILLING

### Tables complémentaires pour V2 complète

#### Table 76: `bil_usage_metric_types` - Types métriques normalisés

**Rôle:** Référentiel centralisé des métriques autorisées

```sql
CREATE TABLE bil_usage_metric_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(50) UNIQUE NOT NULL,
    -- active_vehicles, active_drivers, total_trips, etc.
  unit varchar(20) NOT NULL,
    -- count, AED, USD, EUR, MB, calls
  description text,
    -- Documentation métrique
  aggregation_method varchar(20) NOT NULL,
    -- sum, max, avg, last
    -- Détermine comment agréger sur période
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Pré-remplir avec métriques standard
INSERT INTO bil_usage_metric_types (name, unit, aggregation_method) VALUES
  ('active_vehicles', 'count', 'max'),
  ('active_drivers', 'count', 'max'),
  ('total_trips', 'count', 'sum'),
  ('total_revenue', 'AED', 'sum'),
  ('storage_used_mb', 'MB', 'max'),
  ('api_calls', 'calls', 'sum'),
  ('support_tickets', 'count', 'sum');
```

**Bénéfices:**

- Liste contrôlée, pas de typos
- Unité explicite (count, currency, data)
- Méthode agrégation documentée
- Extensible facilement (nouvelles métriques)

#### Table 77: `bil_plan_features` - Features normalisées (optionnel)

**Alternative au JSON features dans bil_billing_plans**

```sql
CREATE TABLE bil_plan_features (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id uuid NOT NULL REFERENCES bil_billing_plans(id) ON DELETE CASCADE,
  feature_key varchar(100) NOT NULL,
    -- wps_integration, advanced_analytics, priority_support, etc.
  enabled boolean NOT NULL DEFAULT true,
  limits jsonb,
    -- {"max_reports": 50, "retention_days": 90}
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, feature_key)
);

CREATE INDEX ON bil_plan_features (plan_id);
CREATE INDEX ON bil_plan_features (feature_key);
```

**Bénéfices:**

- Features normalisées (table séparée)
- Requêtes faciles: "plans avec WPS"
- Limites par feature documentées
- Alternative si JSON features trop libre

#### Table 78: `bil_promotions` - Codes promo et remises (futur)

```sql
CREATE TABLE bil_promotions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(50) UNIQUE NOT NULL,
    -- BLACK_FRIDAY_2025
  description text,
  discount_type varchar(20) NOT NULL,
    -- percentage, fixed_amount
    -- CHECK IN ('percentage', 'fixed_amount')
  discount_value numeric(10,2) NOT NULL,
    -- 20 (pour 20%) ou 50 (pour 50€)
  currency char(3),
    -- NULL si percentage, requis si fixed_amount
  max_redemptions integer,
    -- Nombre max utilisations
  redemptions_count integer DEFAULT 0,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  applies_to varchar(20) NOT NULL,
    -- first_invoice, all_invoices, specific_plan
    -- CHECK IN ('first_invoice', 'all_invoices', 'specific_plan')
  plan_id uuid REFERENCES bil_billing_plans(id),
    -- Si applies_to = specific_plan
  status varchar(20) NOT NULL DEFAULT 'active',
    -- CHECK IN ('active', 'expired', 'exhausted', 'disabled')
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES adm_provider_employees(id)
);

CREATE INDEX ON bil_promotions (code);
CREATE INDEX ON bil_promotions (valid_from, valid_until);
CREATE INDEX ON bil_promotions (status);
```

#### Table 79: `bil_promotion_usage` - Utilisation codes promo

```sql
CREATE TABLE bil_promotion_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id uuid NOT NULL REFERENCES bil_promotions(id),
  tenant_id uuid NOT NULL REFERENCES adm_tenants(id),
  invoice_id uuid REFERENCES bil_tenant_invoices(id),
    -- NULL si code appliqué à subscription mais pas encore facturé
  applied_at timestamptz NOT NULL DEFAULT now(),
  discount_amount numeric(18,2) NOT NULL,
    -- Montant remise effectivement appliquée
  UNIQUE (promotion_id, tenant_id, invoice_id)
);

CREATE INDEX ON bil_promotion_usage (promotion_id);
CREATE INDEX ON bil_promotion_usage (tenant_id);
```

---

## NOUVELLES TABLES À CRÉER - DOMAINE ADMINISTRATION

### Tables complémentaires pour V2 complète

#### Table 80: `adm_role_permissions` - Permissions granulaires

```sql
CREATE TABLE adm_role_permissions (
  id uuid PRIMARY KEY,
  role_id uuid REFERENCES adm_roles(id),
  resource varchar(100), -- vehicles, drivers, revenues
  action varchar(50), -- create, read, update, delete, export
  conditions jsonb, -- {"own_only": true, "max_amount": 1000}
  created_at timestamp DEFAULT now()
);
```

#### Table 81: `adm_role_versions` - Historique rôles

```sql
CREATE TABLE adm_role_versions (
  id uuid PRIMARY KEY,
  role_id uuid REFERENCES adm_roles(id),
  version_number integer,
  permissions_snapshot jsonb,
  changed_by uuid,
  change_reason text,
  created_at timestamp DEFAULT now()
);
```

#### Table 82: `adm_member_sessions` - Sessions actives

```sql
CREATE TABLE adm_member_sessions (
  id uuid PRIMARY KEY,
  member_id uuid REFERENCES adm_members(id),
  token_hash varchar(256),
  ip_address inet,
  user_agent text,
  expires_at timestamp,
  revoked_at timestamp,
  created_at timestamp DEFAULT now()
);
```

#### Table 83: `adm_tenant_settings` - Configuration avancée

```sql
CREATE TABLE adm_tenant_settings (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES adm_tenants(id),
  setting_key varchar(100),
  setting_value jsonb,
  category varchar(50),
  is_encrypted boolean DEFAULT false,
  updated_at timestamp DEFAULT now()
);
```

### Domaine CRM (3 tables)

#### Table 84: `crm_leads` - Gestion des Prospects

**Existant V1:**

- Nom complet non scindé
- Email, téléphone, société
- Source (web, referral, event)
- Statut (new, qualified, converted, lost)
- Message libre du prospect
- Pas de tracking RGPD
- Pas de scoring avancé

**Évolutions V2:**

```sql
MODIFIER:
- full_name → SCINDER en first_name, last_name
- demo_company_name → company_name (normaliser)

AJOUTER:
- lead_code (varchar) - Identifiant stable unique
- country_code (char(2)) - Pays du prospect
- industry (text) - Secteur d'activité
- company_size (integer) - Nombre d'employés
- website_url (text)
- linkedin_url (text)
- city (text)

SCORING AVANCÉ:
- lead_stage (enum) - top_of_funnel, marketing_qualified, sales_qualified, opportunity
- fit_score (numeric) - Correspond au profil cible ?
- engagement_score (numeric) - Interagit avec nos contenus ?
- scoring (jsonb) - Critères de scoring détaillés
- qualification_notes (text)

RGPD & CONSENTEMENT:
- gdpr_consent (boolean) - Consentement marketing
- consent_at (timestamp) - Date du consentement

SUIVI COMMERCIAL:
- source_id (uuid) - FK vers crm_lead_sources (normalisation)
- assigned_to (uuid) - Commercial assigné
- opportunity_id (uuid) - FK vers opportunité créée
- next_action_date (timestamp) - Planification relances
- utm_source, utm_medium, utm_campaign (text) - Tracking marketing

NOUVELLE TABLE RÉFÉRENCE:
CREATE TABLE crm_lead_sources (
  id uuid PRIMARY KEY,
  name varchar(50) UNIQUE NOT NULL,
  description text
);
```

**Justification métier:**

- **Nom scindé:** Personnalisation communications (+40% taux ouverture)
- **Lead stage:** Mesurer efficacité marketing vs commercial
- **Scoring:** Prioriser leads chauds automatiquement (-60% temps perdu)
- **RGPD:** Conformité légale EU obligatoire (0€ amende vs 20M€)
- **Source normalisée:** Analyse ROI par canal marketing précise
- **Next action:** +30% taux conversion grâce au suivi systématique

---

#### Table 85: `crm_opportunities` - Pipeline de Vente

**Existant V1:**

- Lien vers lead
- Stage (prospect, proposal, negotiation, closed)
- Valeur espérée
- Date de clôture visée
- Assigné à (commercial)
- Probabilité de réussite
- Pas de distinction gagné/perdu

**Évolutions V2:**

```sql
AJOUTER STATUS (distinct de STAGE):
- status (enum) - open, won, lost, on_hold, cancelled
  * Stage = progression (prospect → proposal → negotiation)
  * Status = résultat (open, won, lost)

VALEURS FINANCIÈRES COMPLÈTES:
- currency (char(3)) - ISO-4217 (EUR, AED, etc.)
- discount_amount (numeric) - Remise appliquée
- probability_percent (numeric) - Plus précis qu'integer
- forecast_value (numeric GENERATED) - expected_value × probability / 100
- won_value (numeric) - Montant RÉEL si gagné

RAISONS DE PERTE:
- loss_reason_id (uuid) - FK vers crm_opportunity_loss_reasons
- won_date (date) - Quand gagné ?
- lost_date (date) - Quand perdu ?

LIENS CRITIQUES:
- plan_id (uuid) - FK vers bil_billing_plans (quel plan souscrit ?)
- contract_id (uuid) - FK vers crm_contracts (quel contrat généré ?)
- owner_id (uuid) - Responsable final (vs assigned_to = qui travaille)
- pipeline_id (uuid) - FK vers crm_pipelines (multi-marchés)

NOUVELLE TABLE:
CREATE TABLE crm_opportunity_loss_reasons (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  description text
);

CREATE TABLE crm_pipelines (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  stages jsonb, -- Configuration des étapes
  is_default boolean
);
```

**Justification métier:**

- **Status vs Stage:** Dashboard précis ("5 won, 3 lost" vs juste "closed")
- **Loss reasons:** Amélioration produit et stratégie (-20% pertes évitables)
- **Forecast value:** Budget 2025 fiable à ±5% (vs ±30% sans)
- **Liens plan/contrat:** Client actif <5min après signature
- **Owner vs Assigned:** Clarté dans grandes opportunités multi-personnes
- **Won_value:** Mesurer précision des prévisions (expected vs réel)

---

#### Table 86: `crm_contracts` - Contrats Signés

**Existant V1:**

- Lien vers lead
- Référence contrat (pas unique !)
- Dates (signature, effet, expiration)
- Valeur totale et devise
- Statut simple (active, expired, terminated)
- Pas de lien opportunité
- Pas de gestion renouvellement

**Évolutions V2:**

```sql
CYCLE DE VIE COMPLET:
- status (enum étendu):
  * draft, negotiation, signed
  * active, future (signé mais pas encore effectif)
  * expired, terminated, renewal_in_progress, cancelled

CONTRAINTES & IDENTIFIANTS:
- contract_code (text UNIQUE) - Identifiant technique stable
- contract_reference (text) - Index unique partiel WHERE deleted_at IS NULL

GESTION RENOUVELLEMENT:
- renewal_type (enum) - automatic, optional, perpetual, non_renewing
- auto_renew (boolean)
- renewal_date (date) - Quand renouveler ?
- notice_period_days (integer) - Préavis résiliation
- renewed_from_contract_id (uuid) - FK self-reference (historique)

LIENS SYSTÈME:
- opportunity_id (uuid) - FK vers crm_opportunities (d'où vient ce contrat ?)
- tenant_id (uuid) - FK vers adm_tenants (quel client créé ?)
- plan_id (uuid) - FK vers bil_billing_plans
- subscription_id (uuid) - FK vers bil_tenant_subscriptions

INFORMATIONS CONTACT:
- company_name (text)
- contact_name (text)
- contact_email (citext)
- contact_phone (varchar)
- billing_address_id (uuid) - FK vers crm_addresses

VERSIONNEMENT:
- version_number (integer) - Gestion des avenants
- document_url (text) - Lien vers PDF signé
- vat_rate (numeric) - TVA applicable
- notes (text) - Observations internes
- approved_by (uuid) - Validation finale
```

**Justification métier:**

- **Statuts étendus:** Visibilité totale pipeline contractuel
- **Renouvellement auto:** 0 oubli, -80% churn technique
- **Lien opportunité:** Traçabilité lead → opp → contrat → tenant
- **Lien tenant/plan/subscription:** Facturation auto dès signature
- **Contacts:** -60% tickets "contact perdu"
- **Versionnement:** Historique complet avec avenants
- **Reference unique:** 0 doublon de contrat

---

## NOUVELLES TABLES À CRÉER - DOMAINE CRM

### Tables complémentaires pour V2 complète

#### Table 87: `crm_lead_sources` - Normalisation sources

```sql
CREATE TABLE crm_lead_sources (
  id uuid PRIMARY KEY,
  name varchar(50) UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Données initiales
INSERT INTO crm_lead_sources (name, description) VALUES
  ('web', 'Formulaire site web'),
  ('referral', 'Recommandation client'),
  ('event', 'Salon/Conférence'),
  ('linkedin', 'LinkedIn Ads'),
  ('google_ads', 'Google Ads'),
  ('partner', 'Partenaire commercial');
```

#### `crm_opportunity_loss_reasons` - Analyse pertes

```sql
CREATE TABLE crm_opportunity_loss_reasons (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  category varchar(50), -- price, features, timing, competition
  description text,
  is_active boolean DEFAULT true
);

-- Données initiales
INSERT INTO crm_opportunity_loss_reasons (name, category) VALUES
  ('Prix trop élevé', 'price'),
  ('Fonctionnalités manquantes', 'features'),
  ('Timing inadapté', 'timing'),
  ('Concurrent choisi', 'competition'),
  ('Budget insuffisant', 'price'),
  ('Projet abandonné', 'timing');
```

#### Table 88: `crm_pipelines` - Multi-pipelines

```sql
CREATE TABLE crm_pipelines (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  stages jsonb NOT NULL, -- ['prospect','proposal','negotiation']
  default_probability jsonb, -- Probabilité par étape
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);
```

#### Table 89: `crm_addresses` - Adresses facturation

```sql
CREATE TABLE crm_addresses (
  id uuid PRIMARY KEY,
  street_line1 text NOT NULL,
  street_line2 text,
  city varchar(100) NOT NULL,
  state varchar(100),
  postal_code varchar(20),
  country_code char(2) NOT NULL,
  address_type varchar(50), -- billing, shipping
  is_default boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
```

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE SUPPORT

### 📊 Évolutions sur les 3 tables Support

#### Table 90: `sup_tickets` - Gestion avancée des tickets

**Existant V1:**

- Gestion basique des tickets support
- Champs: raised_by (membre du tenant), subject, description
- Status simples: open, pending, resolved, closed
- Priority: low, medium, high
- assigned_to (employé FleetCore)
- Index unique sur (tenant_id, raised_by, created_at)

**Évolutions V2:**

```sql
AJOUTER:
- category (varchar) - Type de demande (technique, facturation, formation)
- sub_category (varchar) - Sous-catégorie pour orientation fine
- language (varchar) - Langue pour support multilingue
- source_platform (enum) - web, mobile, api - Canal d'origine
- raised_by_type (enum) - admin, driver, client - Type demandeur
- attachments_url (text[]) - Captures écran et documents
- sla_due_at (timestamp) - Suivi délais de traitement
- closed_at (timestamp) - Date de clôture
- resolution_notes (text) - Notes de résolution

MODIFIER status ENUM pour enrichir:
- new, open, waiting_client, waiting_internal, resolved, closed

CRÉER INDEX:
- btree (category, status, sla_due_at) - Pour reporting SLA
- btree (assigned_to, status) - Pour workload agents
```

**Justification fonctionnelle:**

- **Catégorisation** : Permet routage automatique vers équipes spécialisées
- **SLA tracking** : Respect des engagements de service contractuels
- **Multilingue** : Support international (UAE, France, etc.)
- **Source tracking** : Identifier canaux problématiques
- **Statuts enrichis** : Suivi précis des attentes (client vs interne)

#### Table 91: `sup_ticket_messages` - Communication enrichie

**Existant V1:**

- Messages simples liés aux tickets
- Champs: ticket_id (FK), sender_id (membre/employé), message_body
- sent_at (timestamp)
- Pas de distinction public/privé
- Pas de support fichiers

**Évolutions V2:**

```sql
AJOUTER:
- message_type (enum) - public, internal, note
  * public: Visible par le client
  * internal: Visible uniquement équipe support
  * note: Note privée sur le ticket

- parent_message_id (uuid) - Pour threads de discussion
- attachment_url (text) - Lien vers fichier attaché
- attachment_type (varchar) - image, pdf, video
- language (varchar) - Langue du message
- sentiment_score (float) - Score IA (-1 à +1)
- is_automated (boolean) - Message généré automatiquement

MÉTADATA enrichie:
- ai_suggestions (jsonb) - Réponses suggérées par IA
- translation (jsonb) - Traductions automatiques

CRÉER INDEX:
- btree (ticket_id, parent_message_id) - Pour threads
- btree (message_type, sent_at) - Pour filtrage
```

**Justification fonctionnelle:**

- **Types de messages** : Collaboration interne sans polluer conversation client
- **Threads** : Organisation conversations complexes
- **Attachments** : Support visuel (screenshots, factures, etc.)
- **Multilingue** : Traduction automatique pour équipes internationales
- **Sentiment** : Détection clients mécontents pour escalade

#### Table 92: `sup_customer_feedback` - Retours structurés

**Existant V1:**

- Collecte feedback post-résolution
- Champs: submitted_by, submitter_type (driver/client/member/guest)
- feedback_text, rating (1-5)
- Pas de lien explicite avec tickets ou drivers
- Pas de support anonymat

**Évolutions V2:**

```sql
AJOUTER:
- ticket_id (uuid) - FK vers sup_tickets (nullable)
- driver_id (uuid) - FK vers rid_drivers (nullable)
- service_type (enum) - ride, support, maintenance, other
- language (varchar) - Langue du retour
- sentiment_score (float) - Analyse IA du sentiment
- is_anonymous (boolean) - Feedback anonyme
- category (varchar) - Catégorie du retour
- tags (text[]) - Tags pour classification

AMÉLIORER rating:
- overall_rating (integer 1-5) - Note globale
- response_time_rating (integer 1-5) - Note réactivité
- resolution_quality_rating (integer 1-5) - Note qualité résolution
- agent_professionalism_rating (integer 1-5) - Note professionnalisme

CRÉER INDEX:
- btree (ticket_id, service_type) - Lien avec tickets
- btree (driver_id, created_at) - Suivi drivers
- gin (tags) - Recherche par tags
```

**Justification fonctionnelle:**

- **Liens explicites** : Rattacher feedback à tickets et drivers
- **Service type** : Distinguer feedback sur rides vs support
- **Ratings détaillés** : Identifier points faibles précis
- **Anonymat** : Conformité RGPD + retours honnêtes
- **Tags et catégories** : Analytics et tendances
- **Sentiment IA** : Détection automatique problèmes récurrents

---

## NOUVELLES TABLES À CRÉER - DOMAINE SUPPORT

### Tables complémentaires pour V2 complète

#### Table 93: `sup_ticket_categories` - Catégories référentielles

```sql
STRUCTURE PROPOSÉE:
- id (uuid)
- tenant_id (uuid) - Catégories par tenant
- name (varchar) - Nom de la catégorie
- slug (varchar) - Identifiant stable
- description (text)
- parent_category_id (uuid) - Hiérarchie
- default_priority (enum) - Priorité par défaut
- default_assigned_team (varchar) - Équipe par défaut
- sla_hours (integer) - SLA pour cette catégorie
- is_active (boolean)
- display_order (integer)
```

**Justification:**

- Catégories personnalisables par tenant
- Hiérarchie (ex: Technique > API > Webhooks)
- Routage automatique basé sur catégorie
- SLA différenciés par type de demande

#### Table 94: `sup_ticket_sla_rules` - Règles SLA

```sql
STRUCTURE PROPOSÉE:
- id (uuid)
- tenant_id (uuid)
- category_id (uuid)
- priority (enum)
- response_time_hours (integer) - Délai première réponse
- resolution_time_hours (integer) - Délai résolution
- escalation_rules (jsonb) - Règles d'escalade
- business_hours_only (boolean)
- is_active (boolean)
```

**Justification:**

- SLA configurables par client
- Escalade automatique si dépassement
- Prise en compte horaires ouvrés

#### Table 95: `sup_canned_responses` - Réponses prédéfinies

```sql
STRUCTURE PROPOSÉE:
- id (uuid)
- tenant_id (uuid)
- title (varchar)
- content (text)
- category (varchar)
- language (varchar)
- usage_count (integer)
- last_used_at (timestamp)
- created_by (uuid)
- is_active (boolean)
```

**Justification:**

- Réponses rapides questions fréquentes
- Cohérence des réponses support
- Multilingue
- Statistiques d'utilisation

---
