# 📋 INFORMATIONS PROJET - REMPLI

**Date:** 2 Novembre 2025
**Objectif:** Informations complètes pour migration V1→V2
**Status:** ✅ REMPLI AUTOMATIQUEMENT

---

## 1. ENVIRONNEMENT DÉVELOPPEMENT

### 1.1 Versions Exactes

- Node: v22.16.0
- pnpm: 10.18.0
- Git: 2.39.3 (Apple Git-146)
- Prisma: 6.16.2
- TypeScript: 5.9.2

### 1.2 Système d'Exploitation

- macOS 14.7.6 Sonoma (Build 23H626)
- Architecture: darwin-arm64 (Apple Silicon)

---

## 2. STRUCTURE PROJET

### 2.1 Chemin Racine

`/Users/mohamedfodil/Documents/fleetcore5`

### 2.2 Structure Principale

- app/ - Next.js App Router
- prisma/ - Schema et migrations
- lib/ - Utilitaires et hooks
- components/ - Composants React
- docs/ - Documentation
- scripts/ - Scripts automation
- tmp_integration/ - Fichiers Prisma V2

### 2.3 Fichiers Prisma V2

Emplacement: `/Users/mohamedfodil/Documents/fleetcore5/tmp_integration/`

Fichiers:
- dir_models_v2.prisma
- schema_updated.prisma
- schema_updated_v2.prisma

---

## 3. REPOSITORY GIT

### 3.1 Informations

- Repository: Mozfo/fleetcore5
- Branche: main
- Visibilité: Private
- Mode: Solo (pas de collaborateurs)

### 3.2 Git Config

- User: Mozfo
- Email: Voir .env.local

### 3.3 Commits Récents

```
f71f1a2 chore(docs): cleanup obsolete documentation files
b4529e6 feat(prisma): add baseline migration 0_init
4757b47 Revert: remove V2 columns from dir_car_makes
2adf85a feat(schema): migrate dir_car_makes V1→V2
9fa354e fix(ci): add RESEND_API_KEY to workflow
```

---

## 4. BASE DE DONNÉES SUPABASE

### 4.1 Configuration

- Région: EU Central 1 (Zurich)
- Projet: joueofbaqjkrpjcailkx
- Port Transaction Pooler: 6543 (pgbouncer)
- Port Direct/Migration: 5432

### 4.2 Dashboard

- URL: https://supabase.com/dashboard/project/joueofbaqjkrpjcailkx
- Type: Production database
- Organisation: Bluewise.io

### 4.3 Backups

- Automatiques: Quotidiens
- Point-in-time recovery: Disponible
- Accès admin: Complet

---

## 5. CONFIGURATION PROJET

### 5.1 Fichiers .env

Présents:
- .env.local (actif)
- .env.local.example
- .env.test
- .env.test.example
- Divers backups

### 5.2 Variables d'Environnement

**Catégories:**
- Authentication (Clerk)
- Database (Supabase - 2 URLs)
- Email (Resend)
- Cache (Upstash Redis)
- Application URLs
- Feature Flags
- Admin IDs
- Internal tokens

Voir .env.local.example pour liste complète

### 5.3 TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

### 5.4 Prisma Schema Actuel

- Taille: 169 KB
- Provider: postgresql
- Pooling: pgbouncer
- Extensions: uuid_generate_v4()

---

## 6. SCRIPTS PACKAGE.JSON

### 6.1 Scripts Principaux

```bash
pnpm dev              # Next.js + Turbopack
pnpm build            # Production build
pnpm test             # Vitest
pnpm lint             # ESLint strict
pnpm typecheck        # TypeScript check
pnpm validate         # Complet (type + lint + format)
pnpm prisma:generate  # Generate client
pnpm prisma:migrate   # Run migrations
pnpm prisma:studio    # DB GUI
```

### 6.2 Tests

- Framework: Vitest 3.2.4
- Coverage: @vitest/coverage-v8
- UI: @vitest/ui
- Tests API: batch3 scripts
- Lint: ESLint --max-warnings=0

Tous fonctionnels ✅

---

## 7. CI/CD

### 7.1 GitHub Actions

Workflow: api-tests.yml

Triggers:
- Pull requests vers main
- Push sur main
- Manual dispatch

### 7.2 Pipeline Steps

1. Checkout
2. Setup pnpm + Node 20 ⚠️ (Local = 22)
3. Install deps
4. Prisma generate
5. TypeScript check
6. ESLint
7. Build Next.js
8. Start server
9. Run API tests
10. Upload artifacts (30 days)

Timeout: 15 minutes

---

## 8. DÉPLOIEMENT

### 8.1 Environnements

- Development: localhost:3000 (actif)
- Staging: Non configuré
- Production: Vercel ready (pas déployé)

### 8.2 Process Actuel

Mode: Développement local uniquement
Tests: Manuels + CI/CD
Déploiement: À la demande

Status: Pré-production

---

## 9. DÉPENDANCES

### 9.1 Versions Critiques

```
Framework:
- Next.js 15.5.3 (Turbopack)
- React 19.1.0

Database:
- Prisma 6.16.2
- @prisma/client 6.16.2

TypeScript: 5.9.2
TailwindCSS: 4.1.13

Auth: @clerk/nextjs 6.32.2
i18n: react-i18next 16.0.0
Forms: react-hook-form 7.63.0
Validation: zod 4.1.11
Monitoring: @sentry/nextjs 10.13.0
```

### 9.2 Packages Custom

Aucun package privé
Configuration i18n custom (next-intl → react-i18next)

---

## 10. CONTRAINTES

### 10.1 Timing

- Période: NOW (idéal)
- Fenêtre: Flexible
- Deadline: Avant production (fin nov 2025)

### 10.2 Techniques

- Database: Production Supabase mais app pas déployée
- Équipe: Solo
- CI/CD: Pas de deploy auto
- Clients: Aucun (développement)

**Condition idéale pour migration**

### 10.3 Backups

Supabase:
- Auto quotidiens
- Point-in-time recovery

Locaux:
- schema.prisma.backup
- .env.local backups
- Git history complet

---

## 11. TESTS & VALIDATION

### 11.1 Stratégie

Types:
- ✅ Tests unitaires (Vitest)
- ✅ Tests intégration (API batch)
- ⏸️ Tests E2E (prévu)
- ✅ Tests manuels

Coverage: En développement

### 11.2 Environnement Test

Séparé: ✅ Oui
- .env.test configuré
- Scripts isolés (dotenv-cli)

---

## 12. ÉQUIPE

### 12.1 Personnes

1. Mohamed AOUF
   - CEO FleetCore
   - Développeur principal
   - Product owner

Projet: Solo

### 12.2 Communication

Mode: Solo
Canal: Email si besoin
Documentation: Git commits

---

## 13. ROLLBACK

### 13.1 Plan

En cas de problème:

1. Git reset au commit précédent
2. Restore schema.prisma.backup
3. Point-in-time recovery Supabase
4. Regenerate Prisma client
5. Restart dev server

Downtime acceptable: 1-2h (dev)

### 13.2 Contacts

Technique: Mohamed AOUF
Supabase: Support + Dashboard

Ressources:
- Docs Prisma
- Docs Supabase
- Claude Code
- GitHub

---

## 14. POST-MIGRATION

### 14.1 Checklist Validation

- [ ] prisma:generate OK
- [ ] typecheck OK
- [ ] lint OK
- [ ] build OK
- [ ] dev server starts
- [ ] tests pass
- [ ] Prisma Studio access
- [ ] API endpoints work
- [ ] Clerk auth works
- [ ] No TS warnings

### 14.2 Documentation

À mettre à jour:
- [ ] README.md
- [ ] CHANGELOG.md
- [ ] CLAUDE.md
- [ ] Migration rapport
- [ ] Git commit détaillé
- [ ] Git tag v2.0.0

---

## 15. PARTICULARITÉS

### 15.1 Spécificités Projet

**1. Package Manager**
- pnpm 10.18.0 (strict)
- Défini dans package.json

**2. i18n Custom**
- Migration next-intl → react-i18next
- Raison: Turbopack compat
- Locales: en + fr
- Route: app/[locale]/

**3. Next.js 15 + Turbopack**
- App Router
- React 19
- Server/Client components

**4. Clerk Multi-tenancy**
- Organizations
- Webhooks
- tenant_id everywhere

**5. Prisma Special**
- 2 URLs (pooler + direct)
- Schema 169 KB
- Baseline migration 0_init
- Extensions PostgreSQL

**6. Automation**
- Husky hooks
- lint-staged
- predev kill port 3000
- dotenv-cli isolation

**7. Documentation**
- docs/Audit/
- docs/Deepdive/
- docs/Migration v1 -> v2/
- CLAUDE.md
- TODO-TECH-DEBT.md

### 15.2 Préoccupations

**1. Intégrité données**
- Relations complexes
- Foreign keys
- tenant_id partout

**2. TypeScript compat**
- Strict mode
- Types Prisma
- Breaking changes risk

**3. Performance**
- Schema large
- Indexes nombreux
- Pooling pgbouncer

**4. CI/CD compat**
- Node 20 vs 22
- GitHub Actions
- Tests batch3

**5. Rollback capacity**
- Backup fiabilité
- Git history
- Point-in-time recovery

**Mitigation:**
- Tests exhaustifs
- Backups multiples
- Migration progressive
- Validation par étapes

---

## ✅ VALIDATION FINALE

- ✅ Document créé: INFORMATIONS_PROJET_REMPLI.md
- ✅ 39/39 informations remplies
- ✅ 100% complétude
- ✅ Prêt pour migration

---

## 📊 RÉSUMÉ EXÉCUTIF

**Projet:** FleetCore v5 - Fleet Management
**Migration:** V1 → V2 Prisma schema
**Status:** Développement actif (pré-production)
**Stack:** Next.js 15.5.3 + React 19 + Prisma 6.16.2
**DB:** Supabase PostgreSQL (Zurich)
**Env:** macOS 14.7.6, Node 22, pnpm 10.18.0
**Team:** Solo (Mohamed AOUF)
**Risque:** Moyen (dev data, rollback facile)
**Timeline:** Flexible (avant prod fin nov)

**Recommandation:** ✅ MIGRATION NOW
Conditions idéales: pré-prod, solo, backups OK

---

**Créé:** 2 Novembre 2025
**Par:** Claude Code (Sonnet 4.5)
**Pour:** Migration Prisma sans questions ✅
