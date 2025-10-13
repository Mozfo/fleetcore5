# 5) Plan d'exécution séquentiel

## Phase 1 — Corrections critiques (P0)

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

### Scripts SQL (exemples)

```sql
-- P0-01 RLS GUCs: aucun DDL, mais vérifier presence des policies
-- Exemple policy tenanted
create policy if not exists rls_trp_trips_read on trp_trips
as permissive for select to authenticated
using (tenant_id::text = current_setting('app.current_tenant_id', true));
```

### Tests de validation (échantillon)

- **RLS:** tenter `select` cross-tenant → 0 ligne.
- **rid_drivers:** insert avec `employment_status='active'` OK; `'paused'` → erreur.
- **bil_payment_methods:** créer 2 méthodes `card` pour le même tenant avec providers différents → OK; même provider → unique violation.

### Rollback

- DDL add columns: `alter table ... drop column ...;`
- Nouvel index/contrainte: `drop index/constraint ...;`
- Table provider: `drop table bil_payment_providers cascade;`

## Phase 2 — Optimisations (P1)

| ID  | Tâche | Prérequis | Dépendances | Priorité | Estim. |
| --- | ----- | --------- | ----------- | -------- | ------ |

| P1-01 | Créer vues de compatibilité si renommage ou schéma cible diffère | P0 terminé | front-end, API | P1 | 0.5d |
| P1-02 | Mat views KPI journaliers (trips, revenues, fines, maintenance) | P0 indices | dashboards | P1 | 1.5d |
| P1-03 | Index coverage review + partials (hot paths) | Stats requêtes | OLTP | P1 | 1d |
| P1-04 | Triggers d'audit unifiés + horodatage monotone | Fonction util | adm*audit_logs | P1 | 0.5d |
| P1-05 | Processus d’onboarding CRM→Tenant→Clerk→Bil | Flux coordonné | adm_tenants, crm*\_, bil\_\_ | P1 | 1d |

## Phase 3 — Améliorations (P2)

| ID  | Tâche | Prérequis | Dépendances | Priorité | Estim. |
| --- | ----- | --------- | ----------- | -------- | ------ |

| P2-01 | Partitionnement temporel sur trp_trips (mensuel) | Charges >50M lignes | rev/reports | P2 | 2d |
| P2-02 | SCD type-2 optionnel sur dir_country_regulations | Besoin compliance | pricing | P2 | 1d |
| P2-03 | Historiser rôles (adm_member_roles history) | Audit avancé | GRC | P2 | 0.5d |
