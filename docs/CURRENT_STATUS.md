# FLEETCORE - STATUT ACTUEL DU PROJET

Date: 8 Octobre 2025
Branche: feat/v2-migration
Database: Supabase Zurich (eu-central-2)

## OBJECTIF GLOBAL

Migration Mumbai vers Zurich avec refonte V2 du modèle de données.
Plan de référence: docs/Version 2/fleetcore_restart_plan_en.md
Modèle final: 55 tables, 14 domaines

## STEP 0 - ÉTAT ACTUEL

### CE QUI EST TERMINÉ

1. Migration Zurich
   - Projet: joueofbaqjkrpjcailkx (eu-central-2)
   - Extensions: uuid-ossp, pgcrypto

2. Tables créées (3)
   - adm_tenants (remplace organization)
   - adm_members (remplace member)
   - crm_leads (remplace sys_demo_lead)
   - Migration: 20251007192021_v2_phase1_core_tables

3. Vues supprimées
   - organization, member, sys_demo_lead SUPPRIMÉES
   - Option B: migration directe sans vues

4. Code refactoré (10 fichiers)
   - app/api/webhooks/clerk/route.ts
   - app/adm/\*.tsx (4 fichiers)
   - app/api/demo-leads/\*.ts (4 fichiers)
   - lib/organization.ts
   - prisma/seed.ts

5. Pages fonctionnelles
   - /adm - Dashboard
   - /adm/leads - Liste leads
   - /adm/organizations - Liste tenants
   - /request-demo - Formulaire public

### ✅ STEP 0 - VALIDÉ COMPLET

#### 1. Webhook Clerk → Zurich ✅

- Webhook écrit dans Zurich (pas Mumbai)
- UUID natifs générés par PostgreSQL
- Clerk organizations sync OK

#### 2. Migration Mumbai → Zurich ✅

- Base Zurich active (eu-central-2)
- Variables Vercel pointent sur Zurich
- Latence réduite (Mumbai → Zurich)

#### 3. Schema Phase 1 - 100% conforme spec ✅

**3 tables créées (adm_tenants, adm_members, crm_leads):**

- ✅ UUID natifs: `@default(dbgenerated("uuid_generate_v4()"))`
- ✅ Types PostgreSQL: Tous les id/foreign keys en `uuid` (pas TEXT)
- ✅ JSONB: `metadata @db.JsonB` sur toutes les tables
- ✅ Timestamptz: Tous les DateTime avec `@db.Timestamptz(6)`
- ✅ Relations CASCADE: `adm_members.tenant` → `onDelete: Cascade`
- ✅ Relations SetNull: `crm_leads.tenant` → `onDelete: SetNull`

**Conformité spec (restart_plan_en.md ligne 11):**

> "primary keys are UUID (uuid_generate_v4()); time fields are TIMESTAMPTZ"

#### 4. RLS Policies - ACTIVÉES ✅

**Policies créées:**

- `app_current_tenant_id()` function → retourne uuid
- adm_tenants: 4 policies (select/update/delete/insert)
- adm_members: 4 policies (isolation par tenant_id)
- crm_leads: 4 policies (leads publics + isolation tenant)

**État:**

- ✅ RLS enabled sur 3 tables
- ✅ Isolation tenant par UUID
- ✅ Webhook bypass RLS (role postgres)
- ⏳ Middleware Prisma à créer (SET LOCAL app.current_tenant_id)

#### 5. Processus fantômes - RÉSOLU ✅

**Solution permanente:**

- Hook `predev` dans package.json
- Tue automatiquement port 3000 avant `pnpm dev`
- Plus besoin de kill manuel

#### 6. Vercel env variables ✅

Variables mises à jour sur Vercel (confirmé par user):

- DATABASE_URL → Zurich ✅
- DIRECT_URL → Zurich ✅
- NEXT_PUBLIC_SUPABASE_URL → Zurich ✅
- SUPABASE_SERVICE_ROLE_KEY → Zurich ✅

## 🚀 STEP 1 : Création 11 tables (ADM, DIR, DOC)

**Step 0 terminé ✅** - Template UUID natif établi

### 🍎 Principes généraux (OBLIGATOIRES)

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
5. **Indexes systématiques** : `tenant_id`, `status`, `deleted_at`, colonnes FK
6. **JSONB** : Pour permissions, config, metadata

---

### 1️⃣ Domain ADM : Administration (6 tables)

#### adm_roles

- `tenant_id uuid NOT NULL` CASCADE
- `name varchar(100) NOT NULL`
- `description text`
- `permissions jsonb NOT NULL` (liste actions autorisées)
- **UNIQUE** : `(tenant_id, name)`
- **INDEX** : `(tenant_id)`, `(status)`

#### adm_member_roles (many-to-many)

- `tenant_id uuid NOT NULL`
- `member_id uuid NOT NULL` → FK `adm_members`
- `role_id uuid NOT NULL` → FK `adm_roles`
- `assigned_at timestamptz DEFAULT CURRENT_TIMESTAMP`
- **UNIQUE** : `(tenant_id, member_id, role_id)`

#### adm_audit_logs

- `tenant_id uuid NOT NULL`
- `member_id uuid` (auteur)
- `entity_type varchar(50) NOT NULL` (vehicle, driver...)
- `entity_id uuid NOT NULL`
- `action varchar(50) NOT NULL` (create/update/delete/login)
- `changes jsonb` (snapshot valeurs modifiées)
- `ip_address varchar(45)` (IPv4/IPv6)
- `user_agent text`
- `logged_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **INDEX** : `(tenant_id, entity_type, entity_id)`, `(logged_at DESC)`

#### adm_provider_employees

- `id uuid PRIMARY KEY`
- `clerk_user_id varchar(255) UNIQUE NOT NULL`
- `name varchar(100) NOT NULL`
- `email varchar(255) UNIQUE NOT NULL`
- `department varchar(50)` (sales, support, ops, product)
- `title varchar(50)`
- `permissions jsonb` (droits internes)
- `status varchar(50) NOT NULL DEFAULT 'active'`
- **Pas de tenant_id** (employés provider)

#### adm_tenant_lifecycle_events

- `tenant_id uuid NOT NULL`
- `event_type varchar(50) NOT NULL` (created, plan_changed, suspended, reactivated, cancelled)
- `performed_by uuid` → FK `adm_provider_employees`
- `effective_date date`
- `description text`
- **INDEX** : `(tenant_id, event_type)`, `(effective_date DESC)`

#### adm_invitations (CRITIQUE)

- `tenant_id uuid NOT NULL`
- `email varchar(255) NOT NULL`
- `role varchar(50) NOT NULL` (admin, member, kyc)
- `token varchar(255) NOT NULL UNIQUE` (jeton signé)
- `expires_at timestamptz NOT NULL`
- `status varchar(50) NOT NULL DEFAULT 'pending'` (pending/accepted/expired/revoked)
- `sent_by uuid` → FK `adm_provider_employees`
- **UNIQUE** : `(tenant_id, email, role, status)`
- **INDEX** : `(token)`, `(expires_at)`, `(tenant_id)`

---

### 2️⃣ Domain DIR : Référence (5 tables)

#### dir_car_makes

- `tenant_id uuid` **NULLABLE** (NULL = global)
- `name varchar(100) NOT NULL`
- **UNIQUE** : `(tenant_id, name)`
- **INDEX** : `(tenant_id)`

#### dir_car_models

- `tenant_id uuid` **NULLABLE**
- `make_id uuid NOT NULL` → FK `dir_car_makes`
- `name varchar(100) NOT NULL`
- `vehicle_class varchar(50)` (sedan, suv, van)
- **UNIQUE** : `(tenant_id, make_id, name)`
- **INDEX** : `(make_id)`

#### dir_platforms

- `name varchar(100) NOT NULL UNIQUE` (Uber, Bolt, Careem)
- `api_config jsonb` (URL, clés API)
- **Pas de tenant_id** (globales)

#### dir_country_regulations

- `country_code char(2) PRIMARY KEY`
- `vehicle_max_age integer` (7 UAE, 6 France)
- `min_vehicle_class varchar(50)`
- `requires_vtc_card boolean DEFAULT false` (true France)
- `min_fare_per_trip decimal`
- `min_fare_per_km decimal`
- `min_fare_per_hour decimal`
- `vat_rate decimal(5,2)` (5% UAE, 20% France)
- `currency char(3)`
- `timezone varchar(50)`
- `metadata jsonb` (ex: WPS UAE)

#### dir_vehicle_classes

- `id uuid PRIMARY KEY`
- `country_code char(2) NOT NULL` → FK `dir_country_regulations`
- `name varchar(50) NOT NULL` (Sedan, SUV, Van)
- `description text`
- `max_age integer`
- **UNIQUE** : `(country_code, name)`
- **INDEX** : `(country_code)`

---

### 3️⃣ Domain DOC : Documents (1 table)

#### doc_documents (polymorphe)

- `id uuid PRIMARY KEY`
- `tenant_id uuid NOT NULL`
- `entity_type varchar(50) NOT NULL` (vehicle, driver, member, contract, vehicle_event)
- `entity_id uuid NOT NULL`
- `document_type varchar(50) NOT NULL` (registration, insurance, visa, professional_card, inspection, photo)
- `file_url text NOT NULL` (Supabase Storage)
- `file_name varchar(255)`
- `file_size integer` (bytes)
- `mime_type varchar(100)`
- `issue_date date`
- `expiry_date date`
- `verified boolean DEFAULT false`
- `verified_by uuid` → FK `adm_members` ou `adm_provider_employees`
- `verified_at timestamptz`
- `metadata jsonb` (GPS photo, notes auth)
- **INDEX** : `(tenant_id, entity_type, entity_id)`, `(tenant_id, document_type)`, `(expiry_date)`

---

### 🔧 Checklist indexes

**Pour CHAQUE table :**

- ✅ Index `(tenant_id)` pour isolation multi-tenant
- ✅ Index `(status)` si status présent
- ✅ Index `(deleted_at)` pour soft delete
- ✅ Index colonnes FK (make_id, country_code, etc.)
- ✅ Index colonnes WHERE fréquentes (entity_type, document_type, expiry_date)
- ✅ UNIQUE constraints pour éviter doublons

## ✅ CRITÈRES VALIDATION STEP 0 - COMPLET

- [x] Webhook Clerk fonctionne → UUID natifs en Zurich
- [x] RLS activé et testé → 12 policies créées
- [x] Formulaire démo fonctionne → Page /request-demo OK
- [x] Backoffice fonctionne → /adm/leads + /adm/organizations OK
- [x] Processus fantômes résolus → Hook predev automatique
- [x] Vercel DATABASE_URL = Zurich → Migration complète
- [x] Clerk webhook configuré → https://fleetcore5.vercel.app/api/webhooks/clerk
- [x] Commit Git propre → 0b373d9 déployé Production
- [x] Schema 100% conforme spec → UUID natifs + CASCADE + JSONB + Timestamptz

## RÉFÉRENCES

- Plan: docs/Version 2/fleetcore_restart_plan_en.md
- Spec: docs/Version 2/fleetcore_restart_functional_specification.md
- Schema: prisma/schema.prisma
- Supabase: https://supabase.com/dashboard/project/joueofbaqjkrpjcailkx
- Clerk: https://dashboard.clerk.com
- Vercel: https://vercel.com/dashboard

## DÉCISIONS PRISES

1. Option B: pas de vues de compatibilité
2. Vues Prisma abandonnées (instables)
3. RLS: stratégie app.current_tenant_id
4. Naming: préfixes domaine + snake_case

## LEÇONS APPRISES

1. @map() Prisma: nom schema = nom TypeScript
2. Turbopack cache: tuer processus + prisma generate
3. Webhooks Clerk: pas localhost (Vercel/ngrok)

Dernière mise à jour: 8 Octobre 2025 23:45 CET

**🎉 STEP 0 VALIDÉ - Phase 1 déployée en Production**
