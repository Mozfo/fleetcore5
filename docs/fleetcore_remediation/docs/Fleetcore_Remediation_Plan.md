# Fleetcore — Plan de remédiation (Complet)

_Mise à jour: 2025-10-12 — Environnement: PostgreSQL 15 / Supabase / Next.js 15_

## 0) Hypothèses & Décisions

- **RLS**: Standardiser sur `current_setting('app.current_tenant_id')` + GUCs (`app.current_member_id`, `app.role`).
- **AuthN/AuthZ**: Clerk reste IdP; mapping des rôles côté DB via `adm_roles` / `adm_member_roles` (source-of-truth: Clerk).
- **Ride-hailing focus**: pas d'ambition de FMS d'entreprise; couverture minimale viable: véhicules, conducteurs, courses, revenus, facturation SaaS, support.
- **Neutralité PSP**: pas de verrou Stripe. Introduire `bil_payment_providers` + `bil_payment_methods.provider_id`.
- **Pays pilotes**: Émirats Arabes Unis & France dès PROD; modèle extensible pays.
- **Compatibilité**: migrations **additives** + vues de compatibilité pour éviter les breaking-changes.

---

## 1) Analyse complète du modèle (55+ tables)

### 1.1 Synthèse par domaine

#### Administration domain

- Tables: adm_tenants, adm_members, adm_roles, adm_member_roles, adm_audit_logs, adm_provider_employees, adm_tenant_lifecycle_events, adm_invitations

#### Directory domain

- Tables: dir_car_makes, dir_car_models, dir_platforms, dir_country_regulations, dir_vehicle_classes

#### Document domain

- Tables: doc_documents

#### Fleet domain

- Tables: flt_vehicles, flt_vehicle_assignments, flt_vehicle_events, flt_vehicle_maintenance, flt_vehicle_expenses, flt_vehicle_insurances

#### Drivers domain

- Tables: rid_drivers, rid_driver_documents, rid_driver_cooperation_terms, rid_driver_requests, rid_driver_performances, rid_driver_blacklists, rid_driver_training

#### Scheduling domain

- Tables: sch_shifts, sch_maintenance_schedules, sch_goals, sch_tasks

#### Trips domain

- Tables: trp_platform_accounts, trp_trips, trp_settlements, trp_client_invoices

#### Finance domain

- Tables: fin_accounts, fin_transactions, fin_driver_payment_batches, fin_driver_payments, fin_toll_transactions, fin_traffic_fines

#### Revenue domain

- Tables: rev_revenue_imports, rev_driver_revenues, rev_reconciliations

#### SaaS billing domain

- Tables: bil_billing_plans, bil_tenant_subscriptions, bil_tenant_usage_metrics, bil_tenant_invoices, bil_tenant_invoice_lines, bil_payment_methods

#### CRM domain

- Tables: crm_leads, crm_opportunities, crm_contracts

#### Support domain

- Tables: sup_tickets, sup_ticket_messages, sup_customer_feedback

### 1.2 Incohérences & manques repérés

- **RLS**: double paradigme (`auth.jwt()` vs `current_setting`) → standardiser GUC.
- **`rid_drivers`**: champs RH requis UAE absents (date*of_birth, gender, nationality, languages, emergency_contact*\*, hire_date, employment_status, cooperation_type).
- **`bil_payment_methods`**: verrou implicite sur un PSP unique (token générique) → ajouter `provider_id`.
- **`doc_documents`**: énumération à étendre (résidence, ID nationale, permis travail, assurance).
- **`dir_country_regulations`**: couvrir EAU & FR avec champs fiscaux/tarifaires/ID fuseau.
- **`adm_roles` / Clerk**: clarifier la source d’autorité; prévoir mapping bidirectionnel.
- **Indexation**: hétérogène; ajouter partials sur `status`, datations, et GIN sur `metadata` là où manquant.
- **Nommage**: aucune occurrence de termes locaux (ex. 'VTC') dans le schéma; vérifier descriptions.
- **Compatibilité SaaS**: unique partial `(tenant_id, …) where deleted_at is null` conforme; à généraliser où absent.

### 1.3 Performance des index (échantillon)

- Patterns critiques: `trp_trips(tenant_id, driver_id, start_time)`, `rev_*` par période, `fin_*` par `tenant_id` et date.
- Ajouter indexes partiels sur `status in ('active','scheduled','pending') AND deleted_at IS NULL` pour flt/rid/sch.
- GIN sur `metadata` et `details` là où JSONB filtré (déjà présent sur plusieurs tables).

## 2) Améliorations critiques à implémenter

| ID  | Tâche | Prérequis | Dépendances | Priorité | Estim. |
| --- | ----- | --------- | ----------- | -------- | ------ |

| P0-01 | Unifier RLS via current*setting GUCs | Middleware Next.js | Toutes tables multi-tenant | P0 | 1d |
| P0-02 | Rid_drivers: ajouter champs UAE (dob, gender, nationality, languages, emergency contacts, hire_date, employment_status, cooperation_type) | DDL | rid_driver_documents, trp_trips | P0 | 1d |
| P0-03 | Bil_payment_methods: ajouter provider_id + table neutral `bil_payment_providers` | DDL | bil_tenant_invoices, bil_tenant_subscriptions | P0 | 0.5d |
| P0-04 | Dir_country_regulations: enrichir pour UAE/FR + plug-in policy | DDL | dir_vehicle_classes, trp_trips pricing | P0 | 1d |
| P0-05 | Doc_documents: étendre `document_type` (residence_visa, emirates_id, work_permit, insurance_policy, vehicle_registration), index expiry | DDL | rid_driver_documents, flt_vehicles | P0 | 0.5d |
| P0-06 | Trp_trips: durcir contraintes (pick/drop coords nullable OK, status enum), indexes temps/driver/tenant | None | rev_revenue_imports, trp_settlements | P0 | 0.5d |
| P0-07 | Support RLS/permissions: aligner `adm_roles` avec Clerk (mapping) + seed rôles | Seed | adm_members, adm_member_roles | P0 | 0.5d |
| P0-08 | Conventions: normaliser currency/timezone/country | Migration données | fin*\_, bil\_\_, trp\_\* | P0 | 0.5d |

### Optimisations importantes (P1)

| ID  | Tâche | Prérequis | Dépendances | Priorité | Estim. |
| --- | ----- | --------- | ----------- | -------- | ------ |

| P1-01 | Créer vues de compatibilité si renommage ou schéma cible diffère | P0 terminé | front-end, API | P1 | 0.5d |
| P1-02 | Mat views KPI journaliers (trips, revenues, fines, maintenance) | P0 indices | dashboards | P1 | 1.5d |
| P1-03 | Index coverage review + partials (hot paths) | Stats requêtes | OLTP | P1 | 1d |
| P1-04 | Triggers d'audit unifiés + horodatage monotone | Fonction util | adm*audit_logs | P1 | 0.5d |
| P1-05 | Processus d’onboarding CRM→Tenant→Clerk→Bil | Flux coordonné | adm_tenants, crm*\_, bil\_\_ | P1 | 1d |

### Améliorations souhaitables (P2)

| ID  | Tâche | Prérequis | Dépendances | Priorité | Estim. |
| --- | ----- | --------- | ----------- | -------- | ------ |

| P2-01 | Partitionnement temporel sur trp_trips (mensuel) | Charges >50M lignes | rev/reports | P2 | 2d |
| P2-02 | SCD type-2 optionnel sur dir_country_regulations | Besoin compliance | pricing | P2 | 1d |
| P2-03 | Historiser rôles (adm_member_roles history) | Audit avancé | GRC | P2 | 0.5d |

### Détails techniques (extraits)

**2.A `rid_drivers` — champs RH UAE/FR**

```sql
alter table rid_drivers
  add column if not exists date_of_birth date,
  add column if not exists gender text check (gender in ('male','female','other')),
  add column if not exists nationality text,
  add column if not exists languages text[],
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists hire_date date,
  add column if not exists employment_status text not null default 'active'
    check (employment_status in ('active','suspended','terminated','on_leave')),
  add column if not exists cooperation_type text
    check (cooperation_type in ('employee','contractor','partner'));
-- Backfill + constraints se font en 2 étapes (voir Plan d'exécution)
```

**2.B `bil_payment_methods` — neutralité PSP**

```sql
create table if not exists bil_payment_providers (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null, -- 'stripe','adyen','checkout'
  display_name text not null,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

alter table bil_payment_methods
  add column if not exists provider_id uuid,
  add constraint bil_payment_methods_provider_fk
    foreign key (provider_id) references bil_payment_providers(id) on update cascade on delete set null;

-- Contrainte d'unicité élargie
drop index if exists bil_payment_methods_tenant_id_payment_type_unique;
create unique index if not exists bil_pm_tenant_type_provider_uq
  on bil_payment_methods(tenant_id, payment_type, coalesce(provider_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where deleted_at is null;
```

**2.C `doc_documents` — conformité EAU/FR**

```sql
-- Ajout de types si non présents
-- residence_visa, emirates_id, work_permit, insurance_policy, vehicle_registration
```

**2.D `dir_country_regulations` — multi-pays**

- Champs communs: `currency`, `timezone`, TVA/vat, contraintes d'âge véhicule, classes véhicule autorisées.
- Ajouter tables complémentaires si besoin futur: `dir_country_pricing_overrides` (optionnel P2).

# RLS Baseline — Session Variables (PostgreSQL)

**Decision:** Keep `current_setting('app.current_tenant_id')` as the multi-tenant isolation mechanism. Clerk remains the IdP; middleware sets Postgres session GUCs on every request.

## Session GUCs to set

- `app.current_tenant_id` — UUID of tenant
- `app.current_member_id` — UUID of adm_members (or NULL for system jobs)
- `app.role` — `provider_employee` | `tenant_admin` | `tenant_member` | `system_job`

## Example (Supabase / PostgREST)

```sql
-- At connection/request start
select set_config('app.current_tenant_id', :tenant_id, true);
select set_config('app.current_member_id', :member_id, true);
select set_config('app.role', :role, true);
```

## Policy template (row-level)

```sql
-- Read
create policy rls_{table_name}_read on {schema}.{table_name}
as permissive for select
to authenticated
using (
  coalesce({schema}.{table_name}.tenant_id::text, current_setting('app.current_tenant_id', true)) = current_setting('app.current_tenant_id', true)
);

-- Write (example)
create policy rls_{table_name}_write on {schema}.{table_name}
as permissive for insert
to authenticated
with check (
  {schema}.{table_name}.tenant_id::text = current_setting('app.current_tenant_id', true)
);
```

> **Note:** Tables without `tenant_id` (global directories like `dir_country_regulations`) should **not** compare tenant_id and must gate access by role (`app.role in (...)`) or be fully public read if approved.
