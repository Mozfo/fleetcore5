# Fleetcore Data Model and Guidelines – Revised

## Introduction

Ce document synthétise et met à jour le modèle de données Fleetcore, en intégrant les recommandations formulées au cours de notre revue. L’objectif est d’offrir une référence cohérente et exhaustive pour la structuration des tables, les conventions de nommage, les champs essentiels (audit, multi‑tenant, JSON), les contraintes d’unicité et les politiques de sécurité (RLS). Chaque domaine (Administration, Référentiel, Documents, Flotte, Conducteurs, Planification, Trajets, Finance, Revenus, SaaS Billing, CRM, Support) est décrit avec ses tables et leurs champs principaux.

Les préfixes de domaine sont définis ainsi : `adm_` pour l’administration, `dir_` pour les référentiels, `doc_` pour les documents, `flt_` pour la flotte, `rid_` pour les conducteurs (riders), `trp_` pour les trajets, `fin_` pour la finance, `rev_` pour les revenus, `bil_` pour la facturation SaaS, `crm_` pour le CRM et `sup_` pour le support【170732502533975†L46-L57】. Les domaines RH, investisseurs et système sont exclus du cœur de 55 tables.

## 1. Principes généraux

### 1.1 Clés primaires et multi‑tenant

Chaque table opérationnelle dispose d’une clé primaire `id` de type UUID, générée via `uuid_generate_v4()` par défaut. Les tables multi‑tenant possèdent un champ `tenant_id` (UUID) référençant `adm_tenants(id)` avec `ON DELETE CASCADE`.

### 1.2 Audit et soft‑delete

Toutes les tables doivent inclure des colonnes d’audit pour assurer la traçabilité :

- `created_at` (timestamptz NOT NULL DEFAULT now())
- `updated_at` (timestamptz NOT NULL DEFAULT now())
- `deleted_at` (timestamptz NULL)
- `created_by`, `updated_by`, `deleted_by` (UUID NULL) référencés sur `adm_members(id)` avec `ON DELETE SET NULL`
- `deletion_reason` (text NULL)

Un trigger `set_updated_at` doit mettre `updated_at` à jour avant chaque `UPDATE`. L’activation de RLS (Row Level Security) impose l’utilisation de politiques `tenant_isolation` (filtrant par `tenant_id`) et `temp_allow_all` (permissive).

### 1.3 Contraintes d’unicité

Pour éviter les duplicats tout en autorisant la réutilisation de valeurs après une suppression logique, utilisez des indexes uniques **partiels** avec `WHERE deleted_at IS NULL`. Par exemple :

```sql
CREATE UNIQUE INDEX IF NOT EXISTS tab_tenant_email_key
  ON tab(tenant_id, email)
  WHERE deleted_at IS NULL;
```

Cette approche garantit qu’aucune ligne active n’utilise la même valeur, mais qu’une valeur peut être réutilisée après soft‑delete.【358557911812333†L100-L111】.

### 1.4 Types et JSONB

Les champs d’adresse e‑mail utilisent `citext` (insensible à la casse). Les champs `jsonb` doivent être déclarés `NOT NULL` avec un défaut `'{}'::jsonb`. Utilisez des indexes `GIN` sur les colonnes JSONB lorsque vous prévoyez des requêtes dynamiques.

## 2. Domaines et tables

### 2.1 Administration (`adm_`)

#### 2.1.1 `adm_tenants`

Gestion des clients SaaS. Principaux champs : `id`, `name`, `subdomain`, `country_code`, `currency`, `timezone`, `status`, `metadata`. Inclut les colonnes d’audit. Index sur `subdomain` (unique partiel) et `status`. RLS activée.

#### 2.1.2 `adm_members`

Utilisateurs d’un tenant (administrateurs, directeurs, membres simples). Champs essentiels : `id`, `tenant_id`, `email` (citext), `first_name`, `last_name`, `role` (enum), `phone`, `last_login_at`, `metadata`, `status`. Colonnes d’audit complètes et indexes partiels `UNIQUE (tenant_id, email)` et `UNIQUE (tenant_id, clerk_user_id)`.

#### 2.1.3 `adm_roles` et `adm_member_roles`

`adm_roles` définit les rôles disponibles par tenant; `adm_member_roles` associe membres et rôles avec une contrainte unique partielle `(tenant_id, member_id, role_id)`. Colonnes d’audit et RLS requises.

#### 2.1.4 `adm_audit_logs`

Journal immuable des actions critiques. Champs : `id`, `tenant_id`, `member_id`, `entity` (texte), `entity_id`, `action`, `changes` (JSON), `ip_address`, `user_agent`, `timestamp`. Pas de soft‑delete ni de `created_by`/`deleted_by` (c’est un log). Index sur `(tenant_id, entity, entity_id)`【358557911812333†L100-L111】.

#### 2.1.5 `adm_provider_employees` et `adm_tenant_lifecycle_events`

Tables de support pour le fournisseur SaaS. `adm_provider_employees` recense les employés du fournisseur (id, name, email, department, title, etc.) avec colonnes d’audit. `adm_tenant_lifecycle_events` enregistre les changements de statut du tenant (event_type, performed_by, effective_date, description). Ces tables n’ont pas de `tenant_id` puisqu’elles sont globales ou référencent un `tenant_id` en FK pour les lifecycle events【358557911812333†L131-L147】.

### 2.2 Référentiels (`dir_`)

#### 2.2.1 `dir_car_makes` et `dir_car_models`

Ce sont des listes de marques et modèles de véhicules, à usage multi‑tenant ou global. `dir_car_makes` comporte `id`, `tenant_id` (nullable), `name` et des colonnes d’audit. `dir_car_models` référence la marque via `make_id` et propose `name`, `vehicle_class_id`, `created_at`, etc. Utiliser des indexes partiels `(tenant_id, name)`【358557911812333†L186-L209】.

#### 2.2.2 `dir_platforms`

Liste des plateformes de covoiturage intégrées (Uber, Bolt, Careem). Champs : `id`, `name`, `api_key`, colonnes d’audit. Pas de `tenant_id` (table globale). Politique RLS permissive.

#### 2.2.3 `dir_country_regulations` et `dir_vehicle_classes`

Spécifient les contraintes réglementaires par pays : `dir_country_regulations` contient le code pays (PK), les taux de TVA, classes minimales, tarifs minimums, etc. `dir_vehicle_classes` définit les classes de véhicules autorisées par pays avec `id`, `country_code`, `name`, `description`, `max_age`, colonnes d’audit et contrainte unique partielle `(country_code, name)`. RLS permissive.

### 2.3 Documents (`doc_`)

`doc_documents` est une table polymorphe pour stocker des documents (licences, permis, assurances). Champs : `id`, `tenant_id`, `entity_type` (texte), `entity_id` (UUID), `document_type`, `file_url`, `file_name`, `file_size`, `mime_type`, `issue_date`, `expiry_date`, `verified`, `verified_by`, `verified_at`, `metadata` (JSONB), colonnes d’audit. Index composites `(tenant_id, entity_type, entity_id)` et `(tenant_id, document_type)`【358557911812333†L292-L312】.

### 2.4 Flotte/Véhicules (`flt_`)

Ce domaine gère les véhicules et leurs cycle de vie :

- **`flt_vehicles`** : `id`, `tenant_id`, `make_id`, `model_id`, `license_plate`, `vin` (unique), `year`, `color`, `seats`, `vehicle_class`, `fuel_type`, `transmission`, `registration_date`, `insurance_number`, dates d’inspection, `odometer`, `ownership_type`, `metadata`, `status` (par défaut `pending`). Colonnes d’audit et indexes partiels `(tenant_id, license_plate)`, `(tenant_id, vin)`【358557911812333†L267-L289】.
- **`flt_vehicle_assignments`** : assignations véhicule‑conducteur. `id`, `tenant_id`, `vehicle_id`, `driver_id`, `start_date`, `end_date`, `assignment_type`, `metadata`, `status`. Index unique partiel `(tenant_id, vehicle_id, driver_id, start_date)`.
- **`flt_vehicle_events`**, **`flt_vehicle_maintenance`**, **`flt_vehicle_expenses`**, **`flt_vehicle_insurances`** : tables pour suivre respectivement les événements (acquisitions, accidents, maintenance), les maintenances planifiées/réalisées, les dépenses (carburant, péages, parking), et les assurances des véhicules. Toutes ont les colonnes d’audit, `tenant_id`, `vehicle_id`, et des champs spécifiques (par ex. `event_type`, `maintenance_type`, `expense_category`, `policy_number`). Uniques partiels et RLS activée.

### 2.5 Conducteurs (`rid_`)

- **`rid_drivers`** : définit les conducteurs. Champs : `id`, `tenant_id`, `first_name`, `last_name`, `phone`, `email`, `license_number`, `license_issue_date`, `license_expiry_date`, `professional_card_no`, `professional_expiry`, `driver_status` (enum: `active`, `suspended`, `terminated`), `rating` (decimal), `notes`, colonnes d’audit【358557911812333†L513-L536】. Index partiels `(tenant_id, email)` et `(tenant_id, license_number)`.
- **`rid_driver_documents`, `rid_driver_cooperation_terms`, `rid_driver_requests`, `rid_driver_performances`, `rid_driver_blacklists`, `rid_driver_training`** : tables pour les documents personnels, les contrats de coopération, les requêtes de chauffeurs, leurs performances (notes, retours), les listes noires et les formations suivies. Toutes doivent inclure un `driver_id` (FK vers `rid_drivers`), `tenant_id`, des colonnes d’audit et RLS.

### 2.6 Planification (`sch_`)

- **`sch_shifts`** : plannings de travail. Champs : `id`, `tenant_id`, `driver_id`, `start_time`, `end_time`, `status`. Uniques partiels `(tenant_id, driver_id, start_time)`.
- **`sch_maintenance_schedules`** : planification des maintenances. Champs : `id`, `tenant_id`, `vehicle_id`, `scheduled_date`, `completed_date`, etc.
- **`sch_goals`** et **`sch_tasks`** : définissent des objectifs et tâches planifiés pour les conducteurs ou les membres. Incluent `tenant_id`, `assigned_to`, `due_date`, `status`, colonnes d’audit. RLS activée.

### 2.7 Trajets (`trp_`)

- **`trp_platform_accounts`** : identifie les comptes de plateforme (Uber, Bolt) par tenant et véhicule. Champs : `id`, `tenant_id`, `platform_id`, `vehicle_id`, `account_id`, `status`.
- **`trp_trips`** : table centrale des trajets. Contient `id`, `tenant_id`, `platform_id`, `driver_id`, `vehicle_id`, `client_id`, `trip_date`, `start_time`, `end_time`, `pickup_latitude`, `pickup_longitude`, `dropoff_latitude`, `dropoff_longitude`, `distance_km`, `duration_minutes`, `fare_base`, `fare_distance`, `fare_time`, `surge_multiplier`, `tip_amount`, `platform_commission`, `net_earnings`, `payment_method` (enum), `status` (enum), colonnes d’audit【358557911812333†L745-L773】. Index partiels sur `status`, `payment_method`, etc., et RLS.
- **`trp_settlements`** et **`trp_client_invoices`** : tables gérant la facturation des trajets (factures client, règlements aux conducteurs).

### 2.8 Finance (`fin_`)

Cette couche gère les aspects financiers et comptables.

- **`fin_accounts`** : comptes financiers d’un tenant (solde, type).
- **`fin_transactions`** : journal comptable des entrées et sorties (montant, type, date, référence, contrepartie).
- **`fin_driver_payment_batches`** et **`fin_driver_payments`** : traitement des paies des conducteurs (lots de paiements, détails par conducteur).
- **`fin_toll_transactions`** et **`fin_traffic_fines`** : enregistrement des péages et amendes. Toutes les tables de finance incluent un `id`, un `tenant_id`, des montants, des statuts, et les colonnes d’audit.

### 2.9 Revenus (`rev_`)

- **`rev_revenue_imports`** : historise les imports de données de revenu.
- **`rev_driver_revenues`** : suivi des revenus par chauffeur (trips effectués, commissions, primes).
- **`rev_reconciliations`** : rapprochements entre revenus collectés et factures/trajets.

### 2.10 SaaS Billing (`bil_`)

- **`bil_billing_plans`** : définit les plans de facturation (prix, quotas, periodicité).
- **`bil_tenant_subscriptions`** : associe un tenant à un plan (date de début, date de fin, statut).
- **`bil_tenant_usage_metrics`** : mesure l’utilisation (nombre de trajets, demandes API).
- **`bil_tenant_invoices`** et **`bil_tenant_invoice_lines`** : factures émises au tenant et lignes correspondantes.
- **`bil_payment_methods`** : modes de paiement du tenant. Toutes ces tables comportent des colonnes d’audit.

### 2.11 CRM (`crm_`)

- **`crm_leads`** : prospects entrants (nom, email, téléphone, origine, statut). Colonnes d’audit et RLS.
- **`crm_opportunities`** et **`crm_contracts`** : gèrent la progression des leads vers des opportunités et des contrats. Incluent des champs pour la valeur potentielle, la probabilité de conclusion, le statut, etc., ainsi que les colonnes d’audit.

### 2.12 Support (`sup_`)

- **`sup_tickets`** : tickets d’assistance. Champs : `id`, `tenant_id`, `title`, `description`, `status` (enum), `priority`, `created_by`, `assigned_to`, colonnes d’audit.
- **`sup_ticket_messages`** : messages liés aux tickets.
- **`sup_customer_feedback`** : retours client, associés à un ticket ou à un service. Toutes les tables de support doivent être isolées par tenant et inclure les colonnes d’audit.

## 3. Sécurité et meilleures pratiques

1. **RLS par défaut** : toute table contenant un `tenant_id` doit avoir RLS activé et une politique `tenant_isolation` basée sur `current_setting('app.current_tenant_id')` ou `auth.jwt()`. Une politique `temp_allow_all` peut être définie en phase de développement et supprimée en production.
2. **Vérification des droits** : les colonnes `created_by`, `updated_by` et `deleted_by` doivent toujours être référencées à `adm_members(id)`.
3. **Indexation judicieuse** : n’indexez que les colonnes fréquemment filtrées. Utilisez des indexes `GIN` pour les champs JSONB ou de texte plein.
4. **Enum et check** : pour les colonnes de statut, utilisez des listes de valeurs prédéfinies et ajoutez des contraintes `CHECK`.

## Conclusion

Cette version révisée fournit une vue d’ensemble structurée du modèle de données Fleetcore et intègre des recommandations de cohérence (noms, audit, indexes partiels, RLS). Elle peut servir de référence pour aligner ou créer les tables dans Supabase et pour élaborer les migrations. Veillez à adapter vos migrations SQL et Prisma en fonction de ces directives.
