# 🚀 FLEETCORE V2 - GUIDE DE MIGRATION COMPLET

**Date:** 7 Octobre 2025
**Version cible:** V2 (55 tables, 14 domaines)
**Durée estimée:** 10-12 jours ouvrés

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Phase 0: Préparation](#phase-0-préparation)
4. [Phase 1: Schema Foundation](#phase-1-schema-foundation)
5. [Phase 2: Reference Data](#phase-2-reference-data)
6. [Phase 3: RLS Policies](#phase-3-rls-policies)
7. [Phase 4: Code Migration](#phase-4-code-migration)
8. [Phase 5: Testing](#phase-5-testing)
9. [Phase 6: Deployment](#phase-6-deployment)
10. [Rollback Strategy](#rollback-strategy)
11. [Troubleshooting](#troubleshooting)

---

## VUE D'ENSEMBLE

### Objectifs

- ✅ Migrer de Mumbai (ap-south-1) vers Zurich (eu-central-1)
- ✅ Passer de 36 tables à 55 tables (spec V2)
- ✅ Uniformiser nomenclature (adm*, dir*, doc\_, etc.)
- ✅ Implémenter domaines manquants (TRP, FIN, SCH, BIL, CRM, SUP, HR, INV)
- ✅ Créer vues de compatibilité pour transition code

### Approche

**Migration incrémentale par domaine** pour minimiser risques

### Ordre des domaines

```
ADM → DIR → DOC → FLT → RID → TRP → FIN → REV → BIL → SCH → CRM → SUP → HR → INV
```

---

## PRÉREQUIS

### Outils

- [x] PostgreSQL client (psql)
- [x] Node.js 20+
- [x] pnpm
- [x] Prisma CLI
- [x] Git
- [x] Compte Supabase (accès dashboard)

### Accès

- [x] Credentials Supabase Mumbai (lecture)
- [x] Permissions Supabase (création projet)
- [x] Accès Vercel dashboard
- [x] Accès Clerk dashboard

### Backups

- [x] Export schema actuel
- [x] Export données critiques
- [x] Backup Supabase Storage
- [x] Commit Git propre

---

## PHASE 0: PRÉPARATION

**Durée:** 1 jour
**Objectif:** Sécuriser données existantes et préparer environnement

### Étape 0.1: Créer branche Git

```bash
git checkout main
git pull origin main
git checkout -b feat/v2-migration
git push -u origin feat/v2-migration
```

### Étape 0.2: Export données Mumbai

Voir script: `scripts/export-mumbai-data.sh`

```bash
# Exécuter l'export
npm run export:mumbai

# Vérifier les fichiers créés
ls -lh backups/mumbai_export_*.sql
```

**Fichiers générés:**

- `schema_only.sql` (structure tables)
- `organization_data.sql`
- `member_data.sql`
- `sys_demo_lead_data.sql`
- `sys_demo_lead_activity_data.sql`

### Étape 0.3: Créer projet Supabase Zurich

Voir guide: `docs/migration/SUPABASE_ZURICH_SETUP.md`

**Actions manuelles:**

1. Aller sur supabase.com
2. New Project → Nom: "fleetcore-zurich"
3. Région: **Europe Central (eu-central-1) - Zurich**
4. Database Password: Générer fort + sauvegarder
5. Attendre provisioning (~2 min)

### Étape 0.4: Activer extensions PostgreSQL

```sql
-- Via Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Vérifier
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');
```

### Étape 0.5: Configurer variables d'environnement

Créer `.env.local.zurich` (template):

```bash
# Database Zurich
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Supabase Zurich
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"

# Clerk (pas de changement)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="[EXISTING]"
CLERK_SECRET_KEY="[EXISTING]"
CLERK_WEBHOOK_SECRET="[EXISTING]"

# Admin org
FLEETCORE_ADMIN_ORG_ID="[PROVIDER_ORG_ID]"
NEXT_PUBLIC_FLEETCORE_ADMIN_ORG_ID="[PROVIDER_ORG_ID]"

# Autres services (à vérifier région)
UPSTASH_REDIS_REST_URL="[URL]"
UPSTASH_REDIS_REST_TOKEN="[TOKEN]"
SENTRY_DSN="[DSN]"
RESEND_API_KEY="[KEY]"
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

**⚠️ NE PAS COMMIT CE FICHIER**

---

## PHASE 1: SCHEMA FOUNDATION

**Durée:** 2 jours
**Objectif:** Créer nouveau schema Prisma 55 tables + vues compatibilité

### Étape 1.1: Sauvegarder ancien schema

```bash
cp prisma/schema.prisma prisma/schema.prisma.v1.backup
```

### Étape 1.2: Créer nouveau schema V2

Le nouveau schema sera créé en plusieurs domaines.

**Voir:** `prisma/schema_v2/` (fichiers par domaine)

### Étape 1.3: Générer migration

```bash
# Pointer vers Zurich temporairement
cp .env.local.zurich .env.local

# Générer migration (CREATE ONLY, pas d'apply)
npx prisma migrate dev --name v2_full_migration --create-only

# Réviser le SQL généré
cat prisma/migrations/*_v2_full_migration/migration.sql
```

### Étape 1.4: Appliquer migration

```bash
# Appliquer sur Zurich
npx prisma migrate dev

# Vérifier
npx prisma db pull
```

### Étape 1.5: Créer vues de compatibilité

```sql
-- Via Supabase SQL Editor ou fichier migration
-- Voir: prisma/migrations/compatibility_views.sql

CREATE VIEW organization AS
  SELECT
    id,
    name,
    subdomain,
    country_code,
    clerk_organization_id AS clerk_org_id,
    created_at,
    updated_at,
    deleted_at,
    deleted_by,
    deletion_reason,
    status
  FROM adm_tenants;

CREATE VIEW member AS
  SELECT
    id,
    tenant_id,
    email,
    clerk_user_id AS clerk_id,
    role,
    created_at,
    updated_at,
    deleted_at,
    deleted_by,
    deletion_reason,
    status
  FROM adm_members;

CREATE VIEW sys_demo_lead AS
  SELECT
    id,
    full_name AS full_name,
    email,
    company AS demo_company_name,
    fleet_size,
    phone,
    message,
    status,
    country_code,
    created_at,
    updated_at,
    deleted_at
  FROM crm_leads;
```

**⚠️ Note:** Vues read-only, code doit être migré rapidement vers tables canoniques

---

## PHASE 2: REFERENCE DATA

**Durée:** 1 jour
**Objectif:** Peupler tables de référence (dir\_\*)

### Étape 2.1: Adapter seed.ts

Nouveau fichier: `prisma/seed_v2.ts`

Structure:

```typescript
async function main() {
  // 1. DIR - Reference data
  await seedCountryRegulations(); // UAE + France
  await seedCarMakes();
  await seedCarModels();
  await seedPlatforms(); // Uber, Careem, Bolt
  await seedVehicleClasses();

  // 2. ADM - Roles
  await seedRoles();

  // 3. ADM - Provider employees
  await seedProviderEmployees();

  // 4. BIL - Billing plans
  await seedBillingPlans();

  // ... autres seeds par domaine
}
```

### Étape 2.2: Seed country regulations

```typescript
async function seedCountryRegulations() {
  await prisma.dir_country_regulations.createMany({
    data: [
      {
        country_code: "AE",
        vehicle_max_age: 7,
        min_vehicle_class: "sedan",
        requires_vtc_card: false,
        min_fare_per_trip: null, // Market-driven
        min_fare_per_km: null,
        min_fare_per_hour: null,
        vat_rate: 5.0,
        currency: "AED",
        timezone: "Asia/Dubai",
        metadata: {
          regulations: ["RTA approval required", "Driver visa mandatory"],
        },
      },
      {
        country_code: "FR",
        vehicle_max_age: 6,
        min_vehicle_class: "sedan",
        requires_vtc_card: true,
        min_fare_per_trip: 9.0,
        min_fare_per_km: 1.0,
        min_fare_per_hour: 30.0,
        vat_rate: 20.0,
        currency: "EUR",
        timezone: "Europe/Paris",
        metadata: {
          regulations: ["Carte VTC obligatoire", "Formation 250h requise"],
        },
      },
    ],
  });
}
```

### Étape 2.3: Exécuter seed

```bash
npm run prisma:seed
```

---

## PHASE 3: RLS POLICIES

**Durée:** 1 jour
**Objectif:** Sécuriser accès données par tenant_id

### Étape 3.1: Créer helper de génération

Fichier: `scripts/generate-rls-policies.ts`

### Étape 3.2: Appliquer policies

```bash
# Générer SQL policies
npm run generate:rls

# Appliquer via Supabase
cat generated/rls_policies.sql | psql [CONNECTION_STRING]
```

### Étape 3.3: Tester isolation

```typescript
// Test: user1 ne voit pas données user2
const user1Vehicles = await supabase
  .from("flt_vehicles")
  .select("*")
  .eq("tenant_id", tenant1Id);

const user2Vehicles = await supabase
  .from("flt_vehicles")
  .select("*")
  .eq("tenant_id", tenant2Id);

// user1 doit avoir 0 résultats pour tenant2
```

---

## PHASE 4: CODE MIGRATION

**Durée:** 3 jours
**Objectif:** Adapter API/UI pour nouvelles tables

### Étape 4.1: Webhook Clerk

```typescript
// app/api/webhooks/clerk/route.ts

// AVANT
await prisma.organization.create({ ... });
await prisma.member.create({ ... });

// APRÈS
await prisma.adm_tenants.create({ ... });
await prisma.adm_members.create({ ... });
```

### Étape 4.2: API Routes Demo Leads

```typescript
// app/api/demo-leads/route.ts

// AVANT
await prisma.sys_demo_lead.create({ ... });

// APRÈS
await prisma.crm_leads.create({ ... });
```

### Étape 4.3: Lib helpers

```typescript
// lib/organization.ts

// AVANT
const org = await prisma.organization.findUnique(...);

// APRÈS
const org = await prisma.adm_tenants.findUnique(...);
```

### Étape 4.4: Audit logging

```typescript
// lib/audit.ts - Déjà conforme (adm_audit_logs)
// Pas de changement requis
```

---

## PHASE 5: TESTING

**Durée:** 2 jours
**Objectif:** Valider migration sans régression

### Tests unitaires

```bash
npm run test:unit
```

### Tests E2E

```bash
npm run test:e2e
```

### Tests manuels

- [ ] Login/Register via Clerk
- [ ] Création organization via webhook
- [ ] Submit demo lead form
- [ ] Admin backoffice leads
- [ ] CRUD via vues compatibilité
- [ ] Isolation RLS

---

## PHASE 6: DEPLOYMENT

**Durée:** 1 jour
**Objectif:** Déployer sur staging puis production

### Étape 6.1: Staging

```bash
# Vercel dashboard → Environment Variables
# Ajouter variables Zurich pour staging

# Déployer
git push origin feat/v2-migration

# Tester
curl https://fleetcore-staging.vercel.app/api/health
```

### Étape 6.2: Production

```bash
# Merger PR
git checkout main
git merge feat/v2-migration
git push origin main

# Surveiller déploiement Vercel
# Tester production
```

---

## ROLLBACK STRATEGY

En cas de problème critique:

### Rollback code

```bash
git revert [MERGE_COMMIT]
git push origin main
```

### Rollback database

```bash
# Restaurer backup Mumbai
psql [ZURICH_URL] < backups/full_backup.sql

# OU pointer vers ancien Mumbai
# Modifier DATABASE_URL dans Vercel
```

---

## TROUBLESHOOTING

### Erreur: Cannot connect to Zurich

**Solution:** Vérifier IP whitelist dans Supabase settings

### Erreur: RLS blocking queries

**Solution:** Vérifier `app.current_tenant_id` est set dans middleware

### Erreur: Clerk webhook fails

**Solution:** Vérifier tables adm_tenants/adm_members existent et vues sont créées

---

## CHECKLIST FINAL

Avant de merger feat/v2-migration:

- [ ] Toutes les 55 tables créées
- [ ] Vues de compatibilité fonctionnelles
- [ ] RLS policies appliquées (55 tables)
- [ ] Seed V2 exécuté avec succès
- [ ] Code migré vers tables canoniques
- [ ] Tests unitaires passent
- [ ] Tests E2E passent
- [ ] Variables Vercel mises à jour
- [ ] Documentation à jour
- [ ] Backup Mumbai conservé

---

**Guide créé le:** 7 Octobre 2025
**Auteur:** Claude Code
**Version:** 1.0
