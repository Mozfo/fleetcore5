# CI/CD Setup - GitHub Actions

**Date**: 18 Octobre 2025  
**Workflow**: `.github/workflows/api-tests.yml`  
**Status**: ✅ Production-ready

---

## 📋 OVERVIEW

Ce workflow GitHub Actions automatise l'exécution des tests API (Batch 3) sur chaque pull request et push vers `main`.

**Déclencheurs:**

- Pull Request vers `main`
- Push vers `main`

**Durée moyenne:** ~5-8 minutes

---

## 🔐 CONFIGURATION SECRETS

### Étape 1 : Accéder aux Secrets GitHub

1. Aller sur le repository GitHub
2. `Settings` → `Secrets and variables` → `Actions`
3. Cliquer `New repository secret`

### Étape 2 : Ajouter les 4 Secrets Requis

#### Secret 1: `CLERK_SECRET_KEY`

**Nom:** `CLERK_SECRET_KEY`  
**Valeur:** Votre clé Clerk test (format: `sk_test_...`)

**Comment obtenir:**

1. Aller sur [Clerk Dashboard](https://dashboard.clerk.com)
2. Sélectionner votre projet test
3. `API Keys` → Copier **Secret Key** (test environment)
4. ⚠️ **CRITIQUE**: Doit être une clé TEST (`sk_test_`), PAS production

**Validation:**

```bash
# La clé doit commencer par sk_test_
echo $CLERK_SECRET_KEY | grep -q "^sk_test_" && echo "✅ Valid" || echo "❌ Invalid"
```

#### Secret 2: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

**Nom:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  
**Valeur:** Votre clé publique Clerk test (format: `pk_test_...`)

**Comment obtenir:**

1. Même dashboard Clerk
2. `API Keys` → Copier **Publishable Key** (test environment)
3. ⚠️ Doit correspondre au même projet que `CLERK_SECRET_KEY`

**Validation:**

```bash
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | grep -q "^pk_test_" && echo "✅ Valid" || echo "❌ Invalid"
```

#### Secret 3: `DATABASE_URL`

**Nom:** `DATABASE_URL`  
**Valeur:** Connection string PostgreSQL Supabase

**Format:**

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true&connection_limit=1
```

**Comment obtenir:**

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. `Settings` → `Database` → `Connection string` → **Connection pooling** (pgBouncer)
4. ⚠️ Utiliser DB de **test/staging**, PAS production

**Validation:**

```bash
# Doit contenir pgbouncer et connection_limit
echo $DATABASE_URL | grep -q "pgbouncer=true" && echo "✅ Valid" || echo "❌ Missing pgbouncer"
```

#### Secret 4: `TEST_USER_PASSWORD`

**Nom:** `TEST_USER_PASSWORD`  
**Valeur:** Strong password pour users test Clerk

**Exigences:**

- Minimum 12 caractères
- Majuscules + minuscules + chiffres + symboles
- Unique (ne pas réutiliser passwords production)

**Exemple valide:**

```
TestCiCd@2025!Secure
```

**Génération sécurisée:**

```bash
# Générer password aléatoire (Linux/Mac)
openssl rand -base64 16 | tr -d "=+/" | cut -c1-16
```

### Étape 3 : Vérifier Configuration

Une fois les 4 secrets ajoutés, vérifier dans GitHub:

```
Settings → Secrets and variables → Actions
✅ CLERK_SECRET_KEY
✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
✅ DATABASE_URL
✅ TEST_USER_PASSWORD
```

---

## 🚀 UTILISATION

### Déclencher le Workflow

**Automatique:**

- Créer une Pull Request vers `main` → Workflow démarre automatiquement
- Push vers `main` → Workflow démarre automatiquement

**Manuel:**

1. Aller sur `Actions` tab dans GitHub
2. Sélectionner `API Tests` workflow
3. `Run workflow` → Choisir branch → `Run workflow`

### Consulter les Résultats

1. `Actions` tab → Sélectionner le workflow run
2. Cliquer sur `api-tests` job
3. Voir logs détaillés de chaque step
4. Télécharger artifacts (`batch3-test-results`)

---

## 📊 INTERPRÉTATION RÉSULTATS

### Tests Réussis (✅)

```
✅ TypeScript check: PASS
✅ ESLint check: PASS
✅ Run Batch 3 API Tests: PASS (8/16 minimum)
```

**Actions:**

- Pull Request peut être merged
- Tests artifacts uploadés

### Tests Échoués (❌)

**Scénarios possibles:**

#### 1. TypeScript errors

```
❌ TypeScript check: FAIL
```

**Fix:** Corriger erreurs TypeScript localement avant push

#### 2. ESLint errors

```
❌ ESLint check: FAIL
```

**Fix:** `pnpm lint:fix` localement

#### 3. API Tests échec

```
❌ Run Batch 3 API Tests: FAIL (3/16 PASS)
```

**Causes probables:**

- Secrets mal configurés
- JWT Template absent dans Clerk
- DB indisponible
- Rate limiting Clerk

**Debugging:**

1. Vérifier logs workflow (expand `Run Batch 3 API Tests` step)
2. Télécharger artifacts pour voir détails
3. Vérifier que secrets sont présents (Settings → Secrets)
4. Relancer workflow si erreur transient

---

## 🛠️ TROUBLESHOOTING

### Erreur: "Unauthorized" (401)

**Cause:** `CLERK_SECRET_KEY` invalide ou absent

**Fix:**

1. Vérifier secret existe dans GitHub Settings
2. Vérifier format `sk_test_...`
3. Regenerer clé dans Clerk Dashboard si nécessaire

### Erreur: "No organization found for user" (403)

**Cause:** JWT Template manquant ou mal configuré

**Fix:**

1. Aller sur Clerk Dashboard
2. `JWT Templates` → Créer template nommé `test-api`
3. Ajouter custom claims: `userId`, `email`, `orgId`, `orgRole`, `orgSlug`
4. Lifetime: 86400 seconds (24h)

### Erreur: "DATABASE_URL connection failed"

**Cause:** Connection string invalide ou DB inaccessible

**Fix:**

1. Tester connection string localement:

```bash
export DATABASE_URL="postgresql://..."
pnpm prisma db pull
```

2. Vérifier IP whitelisting Supabase (GitHub Actions IPs)
3. Vérifier pgBouncer activé

### Erreur: "Rate limit exceeded"

**Cause:** Trop de tests simultanés sur même tenant Clerk

**Fix:**

1. Attendre 1 minute
2. Relancer workflow
3. Si récurrent: créer separate Clerk project pour CI

### Erreur: "Ignoring not compatible lockfile" / "pnpm-lock.yaml is absent"

**Cause:** Conflit de version pnpm entre workflow et package.json

**Fix:**

La version pnpm est auto-détectée depuis le champ `packageManager` dans package.json. Ne PAS spécifier de version explicite dans le workflow.

**Configuration correcte:**

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  # Version auto-detected from packageManager field in package.json
```

**Vérifier package.json:**

```json
{
  "packageManager": "pnpm@10.18.0"
}
```

---

## 📈 MÉTRIQUES & MONITORING

### Objectifs de Performance

| Métrique              | Cible   | Actuel     |
| --------------------- | ------- | ---------- |
| Durée totale workflow | <10 min | ~5-8 min   |
| Setup (deps + prisma) | <3 min  | ~2 min     |
| Tests Batch 3         | <5 min  | ~3 min     |
| Success rate          | >90%    | Monitoring |

### Artifacts Retention

- **Durée**: 30 jours
- **Fichiers**: `batch3-test-results.json`
- **Taille**: ~10 KB

---

## 🔄 MAINTENANCE

### Mises à Jour Régulières

**Mensuel:**

- Vérifier versions actions GitHub (checkout@v4, setup-node@v4)
- Regenerer secrets si compromis
- Review test results trends

**Trimestriel:**

- Audit Clerk test keys usage
- Cleanup old test users Clerk
- Review DB test data

---

## 📞 SUPPORT

**En cas de problème:**

1. Consulter logs workflow détaillés
2. Vérifier cette documentation
3. Consulter [CLERK_TESTING_SETUP.md](../test-results/CLERK_TESTING_SETUP.md)
4. Ouvrir issue GitHub avec logs

---

**Document créé:** 18 Octobre 2025  
**Auteur:** Claude Code + Mohamed Fodil  
**Version:** 1.0
