# FLEETCORE - STATUT ACTUEL DU PROJET

Date: 8 Octobre 2025
Branche: feat/v2-migration
Database: Supabase Zurich (eu-central-2)

## OBJECTIF GLOBAL

Migration Mumbai vers Zurich avec refonte V2 du modèle de données.
Plan de référence: docs/Version 2/fleetcore_restart_plan_en.md
Modèle final: 55 tables, 14 domaines

## ✅ PROGRESSION MIGRATION V2

### Phase 1 (Step 0) - 3 tables ✅ TERMINÉ

- adm_tenants, adm_members, crm_leads
- UUID natifs PostgreSQL établis
- RLS policies actives
- Webhook Clerk fonctionnel

### Phase 2 (Step 1) - 12 tables ✅ TERMINÉ

- **ADM Domain (6)**: adm_roles, adm_member_roles, adm_audit_logs, adm_provider_employees, adm_tenant_lifecycle_events, adm_invitations
- **DIR Domain (5)**: dir_car_makes, dir_car_models, dir_platforms, dir_country_regulations, dir_vehicle_classes
- **DOC Domain (1)**: doc_documents
- Audit: docs/AUDIT_STEP1_TABLES.md - 12/12 tables ✅ 100% conforme

### Phase 3 (Step 2) - 13 tables ✅ TERMINÉ

- **FLT Domain (6)**: flt_vehicles, flt_vehicle_assignments, flt_vehicle_events, flt_vehicle_maintenance, flt_vehicle_expenses, flt_vehicle_insurances
- **RID Domain (7)**: rid_drivers, rid_driver_documents, rid_driver_cooperation_terms, rid_driver_requests, rid_driver_performances, rid_driver_blacklists, rid_driver_training
- Audit: docs/AUDIT_STEP2_TABLES.md - 13/13 tables ✅ 100% conforme

### TOTAL ACTUEL: 28 tables déployées (3 + 12 + 13)

**Remaining steps:**

- Step 3: SCH, TRP, REV domains (11 tables)
- Step 4: FIN, BIL domains (12 tables)
- Step 5: CRM, SUP, HR, INV, SYS domains (11 tables)

---

## 🎯 STEP 2 COMPLETED - FLT + RID DOMAINS

### Tables créées (13)

**FLT Domain - Fleet Management (6 tables):**

1. **flt_vehicles** - Gestion cycle de vie véhicules
   - UUID natif, tenant_id CASCADE
   - Relations: make, model, current_driver
   - JSONB metadata: acquisition, insurance, equipment
   - UNIQUE(tenant_id, plate_number)
   - Indexes: plate_number, traccar_device_id, status

2. **flt_vehicle_assignments** - Affectations véhicule→chauffeur
   - Historique exclusivité véhicule/driver
   - start_time, end_time (nullable pour ongoing)
   - JSONB metadata: assignment_type, notes
   - Indexes composites: (tenant_id, vehicle_id, status)

3. **flt_vehicle_events** - Journal événements
   - event_type: acquisition, disposal, maintenance, accident, handover, inspection
   - JSONB details: event-specific data (cost, severity, location)
   - Relations: vehicle, driver, performed_by (member)
   - Indexes: (event_type, event_date DESC)

4. **flt_vehicle_maintenance** - Maintenance planning
   - scheduled_date, completion_date
   - next_service_date, next_service_km
   - status: scheduled, in_progress, completed, cancelled
   - cost, provider, invoice_number

5. **flt_vehicle_expenses** - Dépenses opérationnelles
   - category: fuel, toll, parking, washing, repair, miscellaneous
   - charged_to_driver, reimbursed flags
   - Indexes: (expense_date DESC), (vehicle_id, category)

6. **flt_vehicle_insurances** - Polices d'assurance
   - coverage_type, coverage_amount, premium
   - start_date, end_date
   - UNIQUE(tenant_id, vehicle_id, policy_number)
   - Index: (end_date) pour expiry tracking

**RID Domain - Drivers/Riders (7 tables):**

7. **rid_drivers** - Profil chauffeur complet
   - UUID natif, tenant_id CASCADE
   - licence_number, professional_card_number (VTC France)
   - JSONB metadata: emirates_id, visa, labour_card, bank_account, emergency_contact
   - UNIQUE(tenant_id, licence_number), UNIQUE(tenant_id, email)
   - Indexes: licence_expiry_date, professional_card_expiry

8. **rid_driver_documents** - Documents chauffeur
   - document_type: licence, emirates_id, passport, professional_card, visa, labour_card
   - verified, verified_by, verified_at
   - status: pending, approved, rejected, expired
   - Indexes: (expiry_date) global tracking

9. **rid_driver_cooperation_terms** - Modèles financiers
   - cooperation_type: fixed_rent, crew_rental, percentage, salary, rental_model, buy_out, investor_partner
   - JSONB terms: model-specific parameters (rent_amount, platform_rates, wps_eligible)
   - start_date, end_date (nullable ongoing)
   - status: active, expired, cancelled, draft

10. **rid_driver_requests** - Demandes chauffeur
    - request_type: leave, vehicle_change, financial_aid, document_update, complaint
    - priority: low, medium, high, urgent
    - assigned_to (member), assigned_team (hr, finance, mechanic, dispatcher, support)
    - sla_deadline, escalated flag
    - status: new, assigned, in_progress, resolved, closed, cancelled

11. **rid_driver_performances** - KPIs par période
    - period_start, period_end
    - trips_count, total_revenue, total_distance_km, total_hours
    - average_rating, cancellation_rate, punctuality_rate, acceptance_rate
    - revenue_per_trip, revenue_per_km, revenue_per_hour
    - UNIQUE(tenant_id, driver_id, period_start, period_end)

12. **rid_driver_blacklists** - Liste noire
    - reason, severity (minor, moderate, severe)
    - blacklisted_at, blacklisted_by (member)
    - resolved_at, resolved_by
    - status: active, resolved, appealed, expired

13. **rid_driver_training** - Formations/certifications
    - course_name, course_type, provider
    - training_date, completion_date, expiry_date
    - status: scheduled, in_progress, completed, failed, expired, cancelled
    - certificate_url, score (0-100)

### Vérifications Step 2

✅ **UUID natif**: 13/13 tables avec `uuid_generate_v4()`
✅ **Multi-tenant**: 13/13 tables avec tenant_id CASCADE
✅ **Tracking**: created_at, updated_at, deleted_at, deleted_by, deletion_reason sur toutes
✅ **JSONB**: 5 tables avec JSONB (vehicles.metadata, events.details, drivers.metadata, cooperation_terms.terms, assignments.metadata)
✅ **Indexes**: Systematic (tenant_id), (status), (deleted_at), FK columns, date DESC
✅ **Relations**: CASCADE pour owned data, SET NULL pour references, RESTRICT pour critical links
✅ **UNIQUE constraints**: plate_number, licence_number, policy_number per tenant
✅ **Database sync**: `prisma db push` executed successfully (22.51s)
✅ **TypeScript**: Prisma Client generated with all types
✅ **Build**: Next.js production build successful

### Audit conformité

- Document: docs/AUDIT_STEP2_TABLES.md
- Résultat: 13/13 tables ✅ 100% CONFORME
- Total champs: 249 champs validés
- Écarts: 0

---

## 🍎 PRINCIPES GÉNÉRAUX (OBLIGATOIRES)

**Chaque table DOIT respecter :**

1. **UUID natif PostgreSQL** : `id uuid PRIMARY KEY DEFAULT uuid_generate_v4()`
2. **Multi-tenant** : `tenant_id uuid NOT NULL` → FK `adm_tenants(id)` avec CASCADE
3. **Tracking complet** :
   - `created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP`
   - `updated_at timestamptz NOT NULL`
   - `deleted_at timestamptz`
   - `deleted_by uuid`
   - `deletion_reason text`
4. **Status** : `status varchar(50) NOT NULL DEFAULT 'active'` (si applicable)
5. **JSONB** : pour metadata/permissions/config/terms
6. **Indexes systématiques** :
   - `(tenant_id)` pour isolation multi-tenant
   - `(status)` si colonne status existe
   - `(deleted_at)` pour soft delete queries
   - Colonnes FK pour joins performants
7. **CASCADE/SET NULL** : selon logique métier (owned data vs references)

---

## RÉFÉRENCES

- Plan: docs/Version 2/fleetcore_restart_plan_en.md
- Spec: docs/Version 2/fleetcore_restart_functional_specification.md
- Audit Step 1: docs/AUDIT_STEP1_TABLES.md
- Audit Step 2: docs/AUDIT_STEP2_TABLES.md
- Schema: prisma/schema.prisma (28 tables)
- Supabase: https://supabase.com/dashboard/project/joueofbaqjkrpjcailkx
- Clerk: https://dashboard.clerk.com
- Vercel: https://vercel.com/dashboard

## DÉCISIONS PRISES

1. Option B: pas de vues de compatibilité
2. Vues Prisma abandonnées (instables)
3. RLS: stratégie app.current_tenant_id
4. Naming: préfixes domaine + snake_case
5. Audit systématique avant implémentation

## LEÇONS APPRISES

1. @map() Prisma: nom schema = nom TypeScript
2. Turbopack cache: tuer processus + prisma generate
3. Webhooks Clerk: pas localhost (Vercel/ngrok)
4. Audit rigoureux = 0 erreur migration
5. prisma db push pour éviter drift issues

Dernière mise à jour: 8 Octobre 2025 - STEP 2 COMPLETED

**🎉 STEP 0 + STEP 1 + STEP 2 VALIDÉS - 28 tables déployées en Production**
