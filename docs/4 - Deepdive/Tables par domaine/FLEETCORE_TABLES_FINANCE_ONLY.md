# FLEETCORE - ÉVOLUTION MODÈLE V1 → V2 : MODULE FINANCE (6 TABLES)

**Date:** 20 Octobre 2025  
**Version:** 3.1 - Module Finance complet avec détails tables  
**Source:** Analyses détaillées des 6 tables Finance  
**Complément:** Document Administration (8 tables) déjà documenté

---

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE FINANCE

### 💰 Évolutions sur les 6 tables Finance

---

#### Table 1: `fin_accounts` - Comptes financiers multi-types

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

#### Table 2: `fin_transactions` - Grand livre enrichi

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

#### Table 3: `fin_driver_payment_batches` - Lots de paie multi-pays

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

#### Table 4: `fin_driver_payments` - Paiements individuels enrichis

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

#### Table 5: `fin_toll_transactions` - Péages automatisés multi-pays

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

#### Table 6: `fin_traffic_fines` - Amendes avec workflow complet

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

#### `fin_account_types` - Types de comptes extensibles

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

#### `dir_transaction_types` - Types de transactions normalisés

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

#### `dir_transaction_statuses` - Statuts transactions harmonisés

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

#### `fin_transaction_categories` - Catégories pour P&L

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

#### `fin_payment_batch_statuses` - Statuts lots de paie

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

#### `fin_payment_statuses` - Statuts paiements individuels

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

#### `dir_toll_gates` - Portiques de péage multi-pays

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

#### `dir_fine_types` - Types d'amendes par juridiction

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

### Tables workflow (1 nouvelle table)

#### `fin_traffic_fine_disputes` - Contestations amendes

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

---

## DÉPENDANCES CRITIQUES - MODULE FINANCE

### Ordre d'implémentation obligatoire

#### Phase 0 - Tables référentielles (SEMAINE 1)

1. **fin_account_types** → Débloque types comptes normalisés
2. **dir_transaction_types** → Débloque types transactions normalisés
3. **dir_transaction_statuses** → Débloque statuts normalisés
4. **fin_transaction_categories** → Débloque catégorisation P&L
5. **fin_payment_batch_statuses** → Débloque workflow WPS
6. **fin_payment_statuses** → Débloque statuts paiements
7. **dir_toll_gates** → Débloque péages automatiques
8. **dir_fine_types** → Débloque amendes structurées

#### Phase 1 - Comptes et transactions (SEMAINE 2)

9. **fin_accounts** → Enrichir avec provider, status, limites, détails bancaires
10. **fin_transactions** → Ajouter catégorisation, liens entités, taxes/conversions

#### Phase 2 - Paie multi-pays (SEMAINE 3)

11. **fin_driver_payment_batches** → Ajouter workflow complet, périodicité, fichiers
12. **fin_driver_payments** → Ajouter méthodes, conversions, erreurs, notes

#### Phase 3 - Péages et amendes (SEMAINE 4)

13. **fin_toll_transactions** → Remplacer toll_gate par toll_gate_id, ajouter timestamp
14. **fin_traffic_fines** → Remplacer fine_type par fine_type_id, ajouter timestamp, localisation
15. **fin_traffic_fine_disputes** → Créer workflow contestations

---

## MÉTRIQUES DE VALIDATION - FINANCE

### Techniques

- [ ] 6 tables Finance opérationnelles avec enrichissements complets
- [ ] 9 nouvelles tables référentielles créées et alimentées
- [ ] RLS unifiée sur toutes tables Finance par tenant_id
- [ ] Index optimisés (temporal, FK, statuts, partial)
- [ ] Contraintes CHECK sur enum et montants
- [ ] Triggers updated_at actifs sur toutes tables

### Fonctionnelles

- [ ] Support 7 types de comptes (bank, cash, digital, fuel_card, toll, maintenance, investor)
- [ ] Workflow WPS UAE complet (draft → exported → sent → processed → completed)
- [ ] Workflow SEPA EU fonctionnel
- [ ] Péages automatiques Salik Dubai (4 portiques minimum)
- [ ] Péages autoroutes France (50+ portiques)
- [ ] Amendes avec contestations (workflow complet)
- [ ] Déductions salaire automatiques (ordre: dettes > pénalités > amendes > péages)
- [ ] Multi-PSP (Stripe + Adyen configurés)

### Sécurité et Conformité

- [ ] 100% transactions tracées dans fin_transactions
- [ ] 0 fuite cross-tenant via RLS
- [ ] Tokenisation données bancaires (4 derniers chiffres uniquement)
- [ ] Audit trail complet dans adm_audit_logs
- [ ] Conformité PCI pour données cartes
- [ ] Soft delete sur toutes tables Finance

### Intégrations

- [ ] Export SIF (Salary Information File) UAE fonctionnel
- [ ] Export SEPA XML fonctionnel
- [ ] Import Salik automatique (API ou fichier)
- [ ] Import amendes RTA (UAE) et ANTAI (France)
- [ ] Webhooks PSP (Stripe, Adyen) traités
- [ ] GPS/AVL → Détection passages péages automatique

---

## IMPACT SUR LES AUTRES MODULES

### Dépendances entrantes

- **rev_driver_revenues** : Lit fin_accounts pour virer revenus drivers
- **WPS UAE Module** : Utilise fin_driver_payment_batches pour paie UAE
- **flt_vehicles** : Écrit dans fin_toll_transactions (péages) et fin_traffic_fines (amendes)
- **rid_drivers** : Lit fin_driver_payments pour solde et déductions
- **trp_trips** : Écrit dans fin_toll_transactions si péage sur course

### Dépendances sortantes

- **adm_tenants** : Lit status tenant pour autoriser paiements (suspended = blocage)
- **adm_provider_employees** : created_by/updated_by pour batches et payments
- **rid_drivers** : Vérifie documents valides avant paiement (visa, permis, ID)
- **flt_vehicles** : Associe péages et amendes aux véhicules
- **bil_payment_methods** : Moyens de paiement pour transactions et amendes
- **doc_documents** : Stocke fichiers SIF/SEPA et avis amendes
- **dir_country_regulations** : Règles par pays pour workflow WPS/SEPA

---

## ÉVOLUTIONS FUTURES - FINANCE (PHASE 2)

### Tables à prévoir pour V3 (après MVP)

1. **`fin_exchange_rates`** - Historique taux de change
   - Pour conversions multi-devises précises avec historique
   - Calculs P&L consolidés multi-pays

2. **`fin_account_alerts`** - Alertes soldes comptes
   - Seuils min/max paramétrables par compte
   - Notifications automatiques trésorerie

3. **`fin_reconciliations`** - Rapprochements bancaires
   - Match transactions avec relevés banque
   - Détection écarts et anomalies

4. **`dir_toll_rates`** - Tarifs péage détaillés
   - Si rate_schedule JSON devient insuffisant
   - Tarifs par heure/jour/classe véhicule/période

5. **`fin_payment_reversals`** - Annulations paiements
   - Historique reversals WPS/SEPA
   - Traçabilité complète avec raisons

6. **`fin_budget_lines`** - Lignes budgétaires
   - Budget prévisionnel par catégorie
   - Suivi réalisé vs prévu

7. **`fin_cost_allocations`** - Répartition coûts
   - Allocation coûts par département/branche/véhicule
   - Calcul rentabilité par segment

---

**Document Finance Évolution créé le:** 20 Octobre 2025  
**Complète:** Document Administration (8 tables)  
**Total tables documentées:** 14 tables (8 Admin + 6 Finance)  
**Total nouvelles tables:** 9 tables (8 référentiels + 1 workflow)  
**Prochaine étape:** Documenter modules Fleet, Revenue, Trips
