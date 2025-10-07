# 🇨🇭 CRÉATION PROJET SUPABASE ZURICH

**Date:** 7 Octobre 2025
**Région cible:** Europe Central (eu-central-1) - Zurich, Switzerland
**Objectif:** Réduire latence Mumbai → Vercel US de ~200ms à ~50ms

---

## POURQUOI ZURICH?

### Comparaison latence (depuis Vercel US East)

| Région Supabase            | Latence moyenne | Statut actuel  |
| -------------------------- | --------------- | -------------- |
| Mumbai (ap-south-1)        | ~200-250ms      | ❌ Actuel      |
| Singapore (ap-southeast-1) | ~180-220ms      | ❌ Trop loin   |
| Tokyo (ap-northeast-1)     | ~150-180ms      | ❌ Trop loin   |
| **Zurich (eu-central-1)**  | **~40-60ms**    | ✅ **OPTIMAL** |
| Frankfurt (eu-central-2)   | ~45-65ms        | ✅ Alternative |
| London (eu-west-2)         | ~50-70ms        | ✅ Alternative |

**Choix:** Zurich (meilleur compromis latence + disponibilité)

---

## ÉTAPE 1: CRÉER LE PROJET

### 1.1 Accéder au dashboard Supabase

1. Aller sur https://supabase.com
2. Login avec compte existant
3. Cliquer **"New Project"**

### 1.2 Configuration projet

**Paramètres:**

```
Project Name: fleetcore-zurich
Organization: [Votre organization]
Database Password: [Générer strong password]
Region: Europe Central (Zurich) - eu-central-1
Pricing Plan: Pro ($25/month) ou Free (pour test)
```

**⚠️ IMPORTANT:**

- Sauvegarder le password dans password manager
- Ne pas partager publiquement
- Région ne peut pas être changée après création

### 1.3 Attendre provisioning

Durée: ~2-3 minutes

Indicateurs:

- ✅ Database: Initializing → Active
- ✅ API: Generating → Ready
- ✅ Studio: Loading → Ready

---

## ÉTAPE 2: RÉCUPÉRER LES CREDENTIALS

### 2.1 Connection String

**Emplacement:** Settings → Database → Connection string

**Copier les 2 URLs:**

```bash
# Connection pooling (pour Prisma en production)
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection (pour migrations)
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

### 2.2 API Keys

**Emplacement:** Settings → API

**Copier:**

- `anon` (public) key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` (secret) key → `SUPABASE_SERVICE_ROLE_KEY`

### 2.3 Project URL

**Format:** `https://[PROJECT_REF].supabase.co`

**Copier** → `NEXT_PUBLIC_SUPABASE_URL`

---

## ÉTAPE 3: ACTIVER LES EXTENSIONS

### 3.1 Via SQL Editor

**Emplacement:** SQL Editor → New query

```sql
-- UUID generation (required for Prisma)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify extensions
SELECT
    extname AS extension_name,
    extversion AS version
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');
```

**Résultat attendu:**

```
extension_name | version
---------------+---------
uuid-ossp      | 1.1
pgcrypto       | 1.3
```

---

## ÉTAPE 4: CONFIGURER .ENV

### 4.1 Créer .env.local.zurich

```bash
# Copier template
cp .env.local .env.local.zurich
```

### 4.2 Remplacer variables Supabase

Remplacer dans .env.local.zurich:

```bash
# Database (POOLING pour production)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Database (DIRECT pour migrations)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Supabase API
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
```

**⚠️ Garder toutes les autres variables inchangées** (Clerk, Resend, etc.)

### 4.3 Tester connexion

```bash
# Utiliser Zurich temporairement
cp .env.local.zurich .env.local

# Tester Prisma
npx prisma db execute --stdin <<< "SELECT version();"

# Résultat attendu: PostgreSQL version 15.x
```

---

## ÉTAPE 5: APPLIQUER SCHEMA V2

### 5.1 Vérifier Prisma schema

```bash
# Schema doit être V2 (55 tables)
cat prisma/schema.prisma | grep "model " | wc -l
# Résultat attendu: 55
```

### 5.2 Créer migration

```bash
# Générer migration V2
npx prisma migrate dev --name v2_full_migration --create-only

# Réviser SQL
cat prisma/migrations/*_v2_full_migration/migration.sql | less
```

### 5.3 Appliquer migration

```bash
# Appliquer sur Zurich
npx prisma migrate deploy

# Vérifier tables créées
npx prisma db pull
```

**Résultat attendu:**

```
✔ Generated Prisma Client
✔ 55 models in your schema
```

---

## ÉTAPE 6: CRÉER VUES DE COMPATIBILITÉ

### 6.1 Via SQL Editor

```sql
-- Vue organization (compatible avec ancien code)
CREATE OR REPLACE VIEW organization AS
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

-- Vue member
CREATE OR REPLACE VIEW member AS
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

-- Vue sys_demo_lead
CREATE OR REPLACE VIEW sys_demo_lead AS
  SELECT
    id,
    full_name,
    email,
    company AS demo_company_name,
    fleet_size,
    phone,
    message,
    status,
    country_code,
    created_at,
    updated_at,
    deleted_at,
    deleted_by,
    deletion_reason
  FROM crm_leads;
```

**⚠️ Note:** Vues sont **read-only**. Code doit être migré vers tables canoniques rapidement.

---

## ÉTAPE 7: SEED REFERENCE DATA

### 7.1 Exécuter seed V2

```bash
# Seed tables de référence (dir_*)
npm run prisma:seed
```

**Tables seedées:**

- dir_country_regulations (UAE + France)
- dir_car_makes (Toyota, Mercedes, etc.)
- dir_car_models (Corolla, E-Class, etc.)
- dir_platforms (Uber, Careem, Bolt)
- dir_vehicle_classes (Sedan, SUV, Van)
- adm_roles (Admin, User, etc.)
- bil_billing_plans (Basic, Pro, Enterprise)

---

## ÉTAPE 8: IMPORTER DONNÉES MUMBAI

### 8.1 Exporter depuis Mumbai

```bash
# Sur ancien .env.local (Mumbai)
cp .env.local .env.local.mumbai
cp .env.local.mumbai .env.local

# Exporter
./scripts/export-mumbai-data.sh
```

### 8.2 Importer vers Zurich

```bash
# Basculer vers Zurich
cp .env.local.zurich .env.local

# Importer
cd backups/mumbai_[DATE]
./import_to_zurich.sh
```

### 8.3 Vérifier import

```sql
SELECT COUNT(*) FROM adm_tenants;    -- 2 expected (UAE + France)
SELECT COUNT(*) FROM adm_members;    -- X expected
SELECT COUNT(*) FROM crm_leads;      -- X expected
```

---

## ÉTAPE 9: CONFIGURER RLS

### 9.1 Générer policies

```bash
# Script de génération
npm run generate:rls
```

### 9.2 Appliquer policies

```bash
# Via psql
psql "$DATABASE_URL" < generated/rls_policies.sql
```

### 9.3 Vérifier policies

```sql
SELECT
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Résultat attendu:** ~110 policies (2 par table × 55 tables)

---

## ✅ CHECKLIST FINALE

Avant de déployer sur Vercel:

- [ ] Projet Zurich créé et actif
- [ ] Extensions uuid-ossp + pgcrypto activées
- [ ] Schema V2 (55 tables) appliqué
- [ ] Vues compatibilité créées
- [ ] Reference data seedée
- [ ] Données Mumbai importées
- [ ] RLS policies appliquées
- [ ] Tests locaux passent
- [ ] Variables .env.local.zurich validées
- [ ] Backup Mumbai conservé

---

**Document créé:** 7 Octobre 2025
**Validé pour:** Supabase Pro/Free tiers
**Région:** eu-central-1 (Zurich)
