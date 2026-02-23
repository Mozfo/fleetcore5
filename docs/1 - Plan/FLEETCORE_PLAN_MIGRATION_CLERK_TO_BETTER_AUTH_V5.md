# FLEETCORE — PLAN DE MIGRATION CLERK → BETTER AUTH

## VERSION 5.3 — 23 Février 2026

> **Objectif :** Compléter la migration Clerk → Better Auth, implémenter l'architecture multi-tenant unifiée (1 division = 1 tenant, suppression provider_id), module Settings admin, et retour au Step 2.3 Kanban.
> **État :** Phases 0-5 ✅ TERMINÉES. Phase 6A-6D ✅ TERMINÉES. Phase 6E-6I ❌ NON COMMENCÉES. Phase 7-8 ❌ NON COMMENCÉES.
> **Prérequis :** Commit `8bf7d7f` + tag `phase6-clerk-purge-complete`
> **Remplace :** V5.3, V4.0 et V3.0 intégralement — ce document est le seul document de référence.
> **Intègre :** FLEETCORE_PHASE6_ENRICHED_PREREQUISITES.md (287 lignes, Sections A-F)

---

## CHANGELOG COMPLET — V1 → V5.3

### Changelog V2 → V3 (historique préservé)

| #   | Correction                                                                                                                    | Source                              | Impact            |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------- |
| C12 | `clt_members` EXISTS en DB (59 rows, ex-`adm_members` V1) — incluse dans migration                                            | Réponse A + Q9                      | Phase 1 + Phase 6 |
| C13 | 7 pages auth (pas 6) — `login/tasks/page.tsx` ajoutée                                                                         | Q7                                  | Phase 5           |
| C14 | 9 env vars Clerk (pas 6) + fichiers `.env.test` et `.env.test.example`                                                        | Q8                                  | Phase 6           |
| C15 | Accept-invitation redesigné : inscription + auto-accept via hook (pas `<SignUp>` Clerk)                                       | Recherche D + Better Auth docs      | Phase 5           |
| C16 | `ADD COLUMN auth_user_id` déplacé de Phase 6 → Phase 1 (fondation)                                                            | Réponse B — séquençage critique     | Phase 1           |
| C17 | `FLEETCORE_ADMIN_ORG_ID` supprimé → wrapper lit `is_headquarters` en DB                                                       | Réponse C                           | Phase 2           |
| C18 | `adm_members.clerk_user_id` + `adm_audit_logs.performed_by_clerk_id` = colonnes orphelines DB (hors Prisma) → vérifier + DROP | Discrepance E + Supabase Schema Ref | Phase 6           |
| C19 | `adm_tenants.clerk_organization_id` a `@unique` + index → DROP explicites                                                     | Q9                                  | Phase 6           |
| C20 | Audit Claude Code intégré (Q1-Q10) → zéro hypothèse restante                                                                  | Toutes Q                            | Toutes phases     |

### Changelog V3 → V4 (historique préservé)

| #   | Correction                                                                                                      | Source                         | Impact        |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------- |
| C21 | `active_organization_id` null après login — nécessite `databaseHook session.create.before`                      | Découverte post-purge (bug H1) | Phase 6C      |
| C22 | Plugin `admin()` non activé — aucune API de gestion utilisateurs                                                | Découverte post-purge (H3)     | Phase 6D      |
| C23 | Aucune UI d'administration users/tenants/invitations — Clerk fournissait ces outils                             | Exigence CEO (H2)              | Phase 6E + 6F |
| C24 | `svix` suppression non vérifiée                                                                                 | Audit V4                       | Phase 6A      |
| C25 | C18 colonnes orphelines (`adm_members.clerk_user_id`, `adm_audit_logs.performed_by_clerk_id`) non vérifiées     | Audit V4                       | Phase 6A      |
| C26 | Env vars `.env.test` + `.env.test.example` non nettoyées                                                        | Audit V4                       | Phase 6B      |
| C27 | Env vars Vercel Dashboard non nettoyées                                                                         | Audit V4                       | Phase 6B      |
| C28 | `organizations/page.tsx` utilise encore env var `FLEETCORE_ADMIN_ORG_ID` au lieu du DB lookup `is_headquarters` | Enrichi 6.17/B.4               | Phase 6A.5    |
| C29 | Dual-ID queries `OR: [{auth_user_id}, {clerk_user_id}]` potentiellement résiduelles dans le code                | Enrichi 6.18                   | Phase 6A.6    |
| C30 | Commentaires JSDoc mentionnant "clerk" / "transition" / "dual-ID" non purgés                                    | Enrichi 6.19                   | Phase 6A.7    |
| C31 | Scripts Clerk (`create-admin-user.ts`, `clerk-test-auth.ts`) suppression non confirmée                          | Enrichi 6.21                   | Phase 6A.8    |
| C32 | `getProviderContext()` résolution via `auth_user_id` non testée avec données réelles                            | Enrichi 6.0.7/B.3              | Phase 6A.9    |

### Changelog V4 → V5.3 (NOUVEAU)

| #   | Correction                                                                                                           | Source                                                      | Impact                         |
| --- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------ |
| C33 | 🆕 Architecture multi-tenant unifiée : 1 division = 1 tenant = 1 auth_organization. provider_id SUPPRIMÉ entièrement | Décision CEO 23 fév 2026                                    | Phase 6E (DB), Phase 6F (code) |
| C34 | 🆕 Tables adm_providers + adm_provider_employees → DROP complet                                                      | Décision CEO 23 fév 2026                                    | Phase 6E                       |
| C35 | 🆕 tenant_id ajouté sur TOUTES les tables CRM qui ne l'ont pas                                                       | Décision CEO 23 fév 2026                                    | Phase 6E                       |
| C36 | 🆕 HQ = vrai tenant avec activités propres. France et UAE créés PLUS TARD quand activité se développe                | Réponse CEO Q3                                              | Phase 6E                       |
| C37 | 🆕 Module Settings UI = AVANT retour Kanban (pas après) — Better Auth a des composants standards                     | Réponse CEO Q1                                              | Phase 6H + 6I                  |
| C38 | 🆕 Commit les 10 fichiers Kanban non commités AVANT la migration architecture                                        | Réponse CEO Q4                                              | Phase 0-WIP                    |
| C39 | 🆕 getProviderContext() → SUPPRIMÉ. Remplacé par session.activeOrganizationId = tenant_id                            | Décision architecture 23 fév                                | Phase 6F                       |
| C40 | 🆕 buildProviderFilter() → SUPPRIMÉ. WHERE tenant_id = activeOrganizationId                                          | Décision architecture 23 fév                                | Phase 6F                       |
| C41 | 🆕 resolveProviderByCountry() → SUPPRIMÉ. Le tenant est explicite dans la session                                    | Décision architecture 23 fév                                | Phase 6F                       |
| C42 | 🆕 teams() Better Auth : activé en Phase 6D mais PAS utilisé pour l'isolation. Réservé futur                         | Analyse architecture 23 fév                                 | Info                           |
| C43 | 🆕 CRM pour les clients CONFIRMÉ (pas idée future — décision prise)                                                  | Décision CEO 23 fév                                         | Architecture                   |
| C44 | 🆕 **Snapshot Supabase OBLIGATOIRE** avant Phase 6E SQL — les opérations DROP sont IRRÉVERSIBLES sans backup         | FLEETCORE_PHASE6_ENRICHED_PREREQUISITES.md Section F        | Phase 6E                       |
| C45 | 🆕 Gate 3 (checklist post-cleanup) formalisée dans Phase 7 — validations DB + code + runtime après tous les DROP     | FLEETCORE_PHASE6_ENRICHED_PREREQUISITES.md Section E        | Phase 7                        |
| C46 | 🆕 Mise à jour fichiers seed après migration schema (sans provider_id, avec tenant_id)                               | FLEETCORE_PHASE6_ENRICHED_PREREQUISITES.md Section C (6.11) | Phase 6E                       |

---

## SECTION 1 — AUDIT FACTUEL INTÉGRÉ

### 1.1 Empreinte Clerk — résumé validé (de V3)

| Élément                 | Résultat                                                                                                      | Impact                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **ClerkProvider**       | 1 seul, `app/layout.tsx:65`, AUCUN prop custom                                                                | Suppression triviale       |
| **Sentry + Clerk**      | ZÉRO couplage                                                                                                 | Rien à faire               |
| **next.config.ts**      | ZÉRO référence Clerk                                                                                          | Rien à faire               |
| **provider-context.ts** | 1 import + 2 appels `auth()` (lignes 80 + 112). Cherche `adm_provider_employees WHERE clerk_user_id = userId` | Changer import + colonne   |
| **Error types Clerk**   | ZÉRO catch spécifique                                                                                         | Rien à faire               |
| **Refine provider**     | 3 hooks : `useUser`, `useAuth`, `useOrganization` → construit authProvider + accessControlProvider            | 3 hooks à remplacer        |
| **Pages auth**          | **7 pages** (pas 6). 1 composant UI Clerk (`<SignUp>` dans accept-invitation)                                 | 7 pages à migrer           |
| **Env vars**            | **9 variables** dans `.env.local` + `.env.test` + `.env.test.example`                                         | 9 à supprimer, 2 à ajouter |
| **Imports @clerk/**     | **67 lignes** dans **~30 fichiers**. Pattern dominant : `auth()` server (22 fichiers)                         | Migration mécanique        |

### 1.2 Colonnes DB Clerk — état complet (de V3)

#### Dans le Prisma schema actif (CONFIRMÉ)

| Table                    | Colonne                 | Type                  | Contraintes                |
| ------------------------ | ----------------------- | --------------------- | -------------------------- |
| `adm_provider_employees` | `clerk_user_id`         | VARCHAR(255) NOT NULL | —                          |
| `clt_members`            | `clerk_user_id`         | VARCHAR(255) NOT NULL | `@@index([clerk_user_id])` |
| `adm_tenants`            | `clerk_organization_id` | String? nullable      | `@unique` + `@@index`      |

#### Orphelines DB (pas dans Prisma)

| Table            | Colonne                 | Source                    |
| ---------------- | ----------------------- | ------------------------- |
| `adm_members`    | `clerk_user_id`         | SUPABASE_SCHEMA_REFERENCE |
| `adm_audit_logs` | `performed_by_clerk_id` | SUPABASE_SCHEMA_REFERENCE |

### 1.3 Fichiers code — inventaire final (de V3)

| Catégorie                                                  | Nombre           | Complexité                              |
| ---------------------------------------------------------- | ---------------- | --------------------------------------- |
| Server actions + API routes + server components (`auth()`) | ~36              | Mécanique                               |
| Auth pages                                                 | **7**            | Moyen à élevé                           |
| UI components (UserButton ×4, ClerkProvider ×1)            | 5                | Moyen                                   |
| Refine provider                                            | 1                | Moyen                                   |
| Middleware                                                 | 1                | Élevé (351 lignes → 30-40 lignes proxy) |
| Clerk services + helpers + utils                           | 4                | **SUPPRIMÉS**                           |
| Webhook                                                    | 1                | **SUPPRIMÉ** (362 lignes)               |
| Tests                                                      | 6                | Moyen                                   |
| **TOTAL**                                                  | **~62 fichiers** |                                         |

### 1.4 Métriques vérifiées post-Phase 6D (état courant)

- `pnpm tsc --noEmit` → 0 erreurs ✅
- `pnpm build` → SUCCESS ✅
- `pnpm vitest run` → 1409/1409 tests ✅
- `grep -ri "clerk" *.{ts,tsx}` → 0 résultats ✅
- Commit : `8bf7d7f` + Tag : `phase6-clerk-purge-complete`

---

## SECTION 2 — ARCHITECTURE CIBLE

### 2.1 Principe : IDs partagés, zéro synchronisation (de V3, inchangé)

```
AVANT (Clerk)                          APRÈS (Better Auth)
─────────────────                      ─────────────────────
Clerk Cloud (externe)                  PostgreSQL FleetCore (local)
  ↕ Webhook 362 lignes                   ↓ Même base, même transaction
  ↕ API calls (latence réseau)           ↓ Zéro webhook
  ↕ clerk_organization_id mapping        ↓ ID partagé directement
  ↕ 9 env vars                           ↓ 2 env vars
```

### 2.2 🆕 Architecture multi-tenant unifiée (ENRICHI V5.3 — remplace V3 §2.2)

**Décision CEO 23 février 2026 :** Chaque division FleetCore = un tenant séparé = une auth_organization séparée. Le concept de "provider_id" est SUPPRIMÉ entièrement. Isolation unique via tenant_id + RLS.

```
AU DÉMARRAGE (maintenant) :
auth_organization: "FleetCore HQ"        → adm_tenants: FleetCore HQ        (tenant unique)
Mohamed = auth_member (owner) dans HQ

QUAND L'ACTIVITÉ SE DÉVELOPPE (futur) :
auth_organization: "FleetCore France"    → adm_tenants: FleetCore France
auth_organization: "FleetCore UAE"       → adm_tenants: FleetCore UAE
Mohamed = auth_member (owner) dans chaque org

QUAND LES CLIENTS ARRIVENT (futur) :
auth_organization: "Alpha Transport"     → adm_tenants: Alpha Transport
auth_organization: "Beta Fleet"          → adm_tenants: Beta Fleet
```

#### Mapping Shared-ID

`auth_organization.id` = `adm_tenants.id` — pas de table de mapping intermédiaire.

#### Context simplifié (C39, C40, C41)

```
AVANT : auth_user → adm_provider_employees.clerk_user_id → provider_id → WHERE provider_id = X
APRÈS : auth_session.active_organization_id = tenant_id → WHERE tenant_id = X
```

**Fonctions SUPPRIMÉES :**

- `getProviderContext()` → remplacé par `session.activeOrganizationId` (C39)
- `buildProviderFilter(providerId)` → remplacé par `WHERE tenant_id = activeOrganizationId` (C40)
- `resolveProviderByCountry()` → SUPPRIMÉ, le tenant est explicite dans la session (C41)

#### Tables SUPPRIMÉES

| Table                    | Raison                                       |
| ------------------------ | -------------------------------------------- |
| `adm_providers`          | Remplacé par auth_organization + adm_tenants |
| `adm_provider_employees` | Remplacé par auth_member                     |

#### Accès multi-tenant (futur, quand France/UAE existeront)

- Mohamed = `auth_member` (role: owner) dans CHAQUE org FleetCore
- `listOrganizations()` retourne la liste des orgs (natif Better Auth)
- `setActive()` pour switcher entre orgs (natif Better Auth)
- Reporting consolidé = page admin dédiée qui query les données de plusieurs tenants

### 2.3 Mapping tables ACTUALISÉ

```
Better Auth (auth)              FleetCore (business)
──────────────────              ──────────────────────
auth_user                       (remplace adm_provider_employees pour l'auth)
  id (TEXT/UUID) ◄──────────── auth_user_id (FK directe dans adm_members, clt_members)
  name, email, image
  emailVerified, role, banned
  createdAt, updatedAt

auth_session                    (géré par Better Auth)
  id, token, expiresAt
  userId → auth_user.id
  activeOrganizationId ◄─────── = le tenant_id actif de la session
  impersonatedBy
  ipAddress, userAgent

auth_account                    (géré par Better Auth — login methods)
  id, providerId, accountId
  userId → auth_user.id
  password (hashed scrypt)

auth_verification               (géré par Better Auth — tokens temporaires)
  id, identifier, value
  expiresAt

auth_organization               adm_tenants
  id (TEXT/UUID) ═══════════════ id (MÊME UUID — shared-ID)
  name, slug, logo, metadata    + 30 colonnes business

auth_member                     (remplace adm_provider_employees pour l'org membership)
  id, organizationId, userId
  role, createdAt

auth_invitation                 (géré par Better Auth — invitations)
  id, organizationId, email
  role, status, expiresAt

auth_rate_limit                 (géré par Better Auth — anti brute force)
  id, key, count, lastRequest

auth_team                       (activé Phase 6D, NON utilisé — futur optionnel)
auth_team_member                (activé Phase 6D, NON utilisé — futur optionnel)
```

### 2.4 Identification "siège" FleetCore (C17 — ex-FLEETCORE_ADMIN_ORG_ID)

```
AVANT :
  env var FLEETCORE_ADMIN_ORG_ID = "org_33cBkAws..." (ID Clerk)
  → code compare session.orgId avec cette variable
  → si match → utilisateur du siège

APRÈS (V3-V4) :
  adm_providers WHERE is_headquarters = true → provider_id du siège

APRÈS (V5.3) :
  auth_organization WHERE metadata->>'is_headquarters' = 'true' → tenant FleetCore HQ
  → Ou bien : adm_tenants WHERE is_headquarters = true → tenant_id
  → Plus d'env var, plus de provider_id
```

### 2.5 Flow invitation multi-tenant (C15 — redesigné, de V3)

```
AVANT (Clerk) :
  1. Admin envoie invitation via Clerk API
  2. Invité reçoit email avec lien
  3. Lien → page accept-invitation avec <SignUp> Clerk (composant boîte noire)
  4. Clerk gère tout (signup + membership)
  5. Webhook synchro → FleetCore DB

APRÈS (Better Auth) :
  1. Admin envoie invitation via auth.api.createInvitation()
     → sendInvitationEmail callback → Resend envoie l'email
  2. Invité reçoit email avec lien : /accept-invitation?id=xxx
  3. Page accept-invitation :
     a. SI connecté → affiche "Accepter / Refuser" → authClient.organization.acceptInvitation()
     b. SI PAS connecté → redirect vers /register?email=xxx&invitation=xxx
  4. Page register → inscription avec email pré-rempli
  5. Hook automatique post-signup : détecte invitation pending → accepte automatiquement
     → nouveau membre = actif dans son tenant, ZÉRO étape manuelle
  6. Pas de webhook, pas de synchro → tout dans la même DB
  7. 🆕 organizationHooks.afterAcceptInvitation : crée adm_members { tenant_id, email, auth_user_id, role, status: 'active' }
```

### 2.6 Ce qui DISPARAÎT (de V3 + enrichi V5.3)

| Élément                                                | Lignes  | Pourquoi                          |
| ------------------------------------------------------ | ------- | --------------------------------- |
| Webhook Clerk (`app/api/webhooks/clerk/`)              | 362     | Better Auth = même DB             |
| `clerk.service.ts`                                     | ~150    | → `auth.api.*()`                  |
| `clerk-uuid-mapper.ts`                                 | ~50     | UUIDs PostgreSQL natifs           |
| `clerk-helpers.ts`                                     | ~80     | → wrapper `lib/auth/server.ts`    |
| `clerk-test-auth.ts`                                   | ~60     | → mock Better Auth                |
| `ClerkProvider` (layout.tsx)                           | ~5      | Better Auth = pas de Provider     |
| `<SignUp>` (accept-invitation)                         | ~20     | → formulaire register custom      |
| `UserButton` ×4                                        | ~40     | → composant `<UserMenu>` custom   |
| 9 env vars Clerk                                       | —       | → 2 env vars Better Auth          |
| `FLEETCORE_ADMIN_ORG_ID` env var                       | —       | → lookup DB `is_headquarters`     |
| Packages `@clerk/nextjs`, `@clerk/backend`, `svix`     | —       | → `better-auth`                   |
| Colonnes `clerk_*` (3 tables Prisma + 2 DB orphelines) | —       | → `auth_user_id`                  |
| 🆕 `adm_providers` table                               | ~3 rows | → auth_organization + adm_tenants |
| 🆕 `adm_provider_employees` table                      | ~5 rows | → auth_member                     |
| 🆕 `provider_id` colonnes (toutes tables CRM)          | —       | → tenant_id                       |
| 🆕 `getProviderContext()`                              | —       | → session.activeOrganizationId    |
| 🆕 `buildProviderFilter()`                             | —       | → WHERE tenant_id = X             |
| 🆕 `resolveProviderByCountry()`                        | —       | → SUPPRIMÉ                        |

### 2.7 Ce qui APPARAÎT (de V3 + enrichi V5.3)

| Élément                                  | Rôle                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `lib/auth.ts`                            | Config Better Auth serveur complète                                                            |
| `lib/auth-client.ts`                     | Client Better Auth (hooks React)                                                               |
| `app/api/auth/[...all]/route.ts`         | Catch-all route handler                                                                        |
| `lib/auth/server.ts`                     | **Wrapper serveur** — getSession, requireAuth, requireCrmAuth (**🆕 sans getProviderContext**) |
| `lib/auth/client.ts`                     | **Wrapper client** — useUser, useAuth, useActiveOrganization                                   |
| `proxy.ts`                               | Proxy Next.js 16 (~124 lignes, cookie check)                                                   |
| 8 tables Better Auth                     | user, session, account, verification, organization, member, invitation, rateLimit              |
| 🆕 2 tables Better Auth supplémentaires  | team, team_member (activées, non utilisées)                                                    |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`  | 2 env vars                                                                                     |
| 🆕 `tenant_id` sur toutes les tables CRM | Isolation multi-tenant unifiée                                                                 |
| 🆕 Module Settings `/adm/settings/`      | Admin UI users, orgs, invitations, roles                                                       |

---

## SECTION 3 — CONFIG BETTER AUTH (de V3)

### 3.1 `lib/auth.ts` — Spec de configuration

Sources vérifiées : [Installation](https://www.better-auth.com/docs/installation), [Prisma adapter](https://www.better-auth.com/docs/adapters/prisma), [Organization](https://www.better-auth.com/docs/plugins/organization), [Rate limit](https://www.better-auth.com/docs/concepts/rate-limit), [Security](https://www.better-auth.com/docs/reference/security), [Options](https://www.better-auth.com/docs/reference/options)

**Éléments obligatoires de la config :**

| Config                                                 | Valeur                                                                       | Source                   | Pourquoi                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------ | ------------------------------------------ |
| `database`                                             | `prismaAdapter(prisma, { provider: "postgresql" })`                          | Prisma adapter docs      | FleetCore utilise Prisma 6.18 + PostgreSQL |
| `emailAndPassword.enabled`                             | `true`                                                                       | Installation docs        | Login email/password                       |
| `emailAndPassword.sendResetPassword`                   | Callback Resend                                                              | Options docs             | Reset password (C7)                        |
| `trustedOrigins`                                       | `["http://localhost:3000", "https://fleetcore.app"]`                         | Security docs            | CSRF protection (C1)                       |
| `rateLimit.enabled`                                    | `true`                                                                       | Rate limit docs          | Anti brute force (C3)                      |
| `rateLimit.storage`                                    | `"database"`                                                                 | Rate limit docs          | Persistant multi-instance Vercel           |
| `rateLimit.customRules`                                | `/sign-in/email`: 5/min, `/sign-up/email`: 3/min, `/forget-password`: 3/5min | Rate limit docs          | Protection ciblée                          |
| `advanced.database.generateId`                         | `"uuid"`                                                                     | Database docs            | UUIDs PostgreSQL natifs                    |
| `advanced.ipAddress.ipAddressHeaders`                  | `["x-forwarded-for"]`                                                        | Options docs             | Standard Vercel                            |
| `session.expiresIn`                                    | 7 jours                                                                      | Options docs             | Standard SaaS                              |
| `session.updateAge`                                    | 1 jour                                                                       | Options docs             | Refresh régulier                           |
| `databaseHooks.session.create.after`                   | Callback → `adm_audit_logs`                                                  | Plugins docs             | Audit trail login (C4)                     |
| `databaseHooks.session.create.before`                  | Auto-activate org (C21)                                                      | V4 Phase 6C              | Fix login active_organization_id           |
| `organization.sendInvitationEmail`                     | Callback Resend                                                              | Organization docs        | Invitations (C7)                           |
| `organization.organizationHooks.afterAcceptInvitation` | Callback → setup adm_members                                                 | Organization docs        | Post-invitation (C15)                      |
| `hooks.after` (middleware)                             | Auto-accept invitation après signup                                          | Community pattern        | Signup + invitation en un flow (C15)       |
| `plugins`                                              | `[organization(), admin(), teams(), emailAndPassword()]`                     | V4 Phase 6D              | Tous les plugins activés                   |
| `nextCookies()`                                        | **TOUJOURS DERNIER plugin**                                                  | Next.js docs Better Auth | Obligation technique                       |

### 3.2 Tables SQL — 8 tables Better Auth de base + 2 supplémentaires

| #   | Table          | Colonnes clés                                                                                                      | @@map                        |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| 1   | `user`         | id, name, email, emailVerified, image, **role**, **banned**, **ban_reason**, **ban_expires**, createdAt, updatedAt | `@@map("auth_user")`         |
| 2   | `session`      | id, expiresAt, token, ipAddress, userAgent, userId, **activeOrganizationId**, **impersonatedBy**                   | `@@map("auth_session")`      |
| 3   | `account`      | id, accountId, providerId, userId, password, accessToken, refreshToken, createdAt, updatedAt                       | `@@map("auth_account")`      |
| 4   | `verification` | id, identifier, value, expiresAt, createdAt, updatedAt                                                             | `@@map("auth_verification")` |
| 5   | `organization` | id, name, slug, logo, createdAt, metadata                                                                          | `@@map("auth_organization")` |
| 6   | `member`       | id, organizationId, userId, role, createdAt                                                                        | `@@map("auth_member")`       |
| 7   | `invitation`   | id, organizationId, email, role, status, expiresAt, inviterId                                                      | `@@map("auth_invitation")`   |
| 8   | `rateLimit`    | id, key, count, lastRequest                                                                                        | `@@map("auth_rate_limit")`   |
| 9   | `team`         | id, name, organizationId, createdAt, updatedAt                                                                     | `@@map("auth_team")`         |
| 10  | `teamMember`   | id, teamId, userId, role, createdAt                                                                                | `@@map("auth_team_member")`  |

---

## SECTION 4 — ÉTAT DES PHASES TERMINÉES

### Phases 0-5 : ✅ TERMINÉES (référence V3)

| Phase | Description                                      | Statut     | Preuve                                           |
| ----- | ------------------------------------------------ | ---------- | ------------------------------------------------ |
| 0     | Sécuriser l'état                                 | ✅ TERMINÉ | Tag `pre-auth-migration`                         |
| 1     | Foundation BA + 8 tables + colonnes transitoires | ✅ TERMINÉ | 8 tables auth\_\*, auth_user_id sur 2 tables     |
| 2     | Wrappers auth + is_headquarters                  | ✅ TERMINÉ | Couche 1+2, 36 consommateurs migrés              |
| 3     | Proxy Next.js 16                                 | ✅ TERMINÉ | middleware 351→124 lignes, 42 API routes         |
| 4     | Migration serveur mécanique                      | ✅ TERMINÉ | requireCrmApiAuth/requireTenantApiAuth           |
| 5     | Pages auth + UI + invitation                     | ✅ TERMINÉ | 7 pages, ClerkProvider supprimé, UserMenu custom |

### Phase 6A : ✅ TERMINÉE — Nettoyage résiduel + vérifications enrichies (de V4)

| #     | Tâche                                                | Résultat                           |
| ----- | ---------------------------------------------------- | ---------------------------------- |
| 6A.1  | Vérifier colonnes orphelines C18                     | ✅ Vérifié — colonnes traitées     |
| 6A.2  | Vérifier package `svix`                              | ✅ Absent de package.json          |
| 6A.3  | Grep étendu résidus Clerk                            | ✅ 0 résultats                     |
| 6A.4  | Vérifier .env.test Clerk vars                        | ✅ Nettoyé                         |
| 6A.5  | 🆕 Vérifier `organizations/page.tsx` env var (C28)   | ✅ Migré vers DB lookup            |
| 6A.6  | 🆕 Vérifier 0 dual-ID queries résiduelles (C29)      | ✅ 0 résultats                     |
| 6A.7  | 🆕 Supprimer commentaires JSDoc "clerk" (C30)        | ✅ Purgé                           |
| 6A.8  | 🆕 Confirmer suppression scripts Clerk (C31)         | ✅ Fichiers absents                |
| 6A.9  | 🆕 Test getProviderContext() avec auth_user_id (C32) | ✅ Code utilise auth_user_id       |
| 6A.10 | Commit                                               | ✅ `chore(auth): Phase 6A cleanup` |

### Phase 6B : ✅ TERMINÉE — Env vars (de V4)

| #    | Tâche                             | Résultat                                                                                                                                                                                                                                                                                                                                                 |
| ---- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6B.1 | Supprimer vars Clerk `.env.local` | ✅ 9 vars supprimées : `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` (×2), `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` (×2), `FLEETCORE_ADMIN_ORG_ID`, `NEXT_PUBLIC_FLEETCORE_ADMIN_ORG_ID` |
| 6B.2 | Supprimer vars Clerk Vercel       | ✅ Supprimées pour tous les environnements                                                                                                                                                                                                                                                                                                               |
| 6B.3 | Confirmer vars Better Auth Vercel | ✅ `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` présentes                                                                                                                                                                                                                                                                                                    |

### Phase 6C : ✅ TERMINÉE — Fix login + databaseHook (de V4)

**Problème résolu (C21) :** Après login, `active_organization_id` était `null` dans `auth_session`. Solution : `databaseHook session.create.before` qui lookup `auth_member` et set `activeOrganizationId`.

| #    | Tâche                             | Résultat                                                                         |
| ---- | --------------------------------- | -------------------------------------------------------------------------------- |
| 6C.1 | Analyser `lib/auth.ts` actuel     | ✅ Analysé                                                                       |
| 6C.2 | Analyser `requireCrmAuth()`       | ✅ Chemin du crash identifié                                                     |
| 6C.3 | Implémenter le databaseHook       | ✅ `session.create.before` → lookup `auth_member` → set `activeOrganizationId`   |
| 6C.4 | Vérifier login manuellement       | ✅ Dashboard charge                                                              |
| 6C.5 | Vérifier le flow setActive client | ✅ Switch d'org fonctionne                                                       |
| 6C.6 | Tester logout + re-login          | ✅ `active_organization_id` auto-set                                             |
| 6C.7 | Vérifier navigation post-login    | ✅ Dashboard → CRM → Settings accessible                                         |
| 6C.8 | Tests automatisés                 | ✅ tsc 0 erreurs, build SUCCESS, 1409 tests                                      |
| 6C.9 | Commit                            | ✅ `feat(auth): auto-activate organization on session creation via databaseHook` |

### Phase 6D : ✅ TERMINÉE — Plugin admin() + Access Control (de V4)

**API admin Better Auth activées :**

| API Endpoint                  | Méthode | Fonction                                      |
| ----------------------------- | ------- | --------------------------------------------- |
| `/admin/create-user`          | POST    | Créer un utilisateur avec email/password/role |
| `/admin/list-users`           | GET     | Lister avec search, filter, pagination        |
| `/admin/get-user`             | GET     | Détails d'un utilisateur                      |
| `/admin/update-user`          | POST    | Modifier name, email, fields custom           |
| `/admin/set-role`             | POST    | Changer le rôle d'un user                     |
| `/admin/set-user-password`    | POST    | Reset password admin                          |
| `/admin/ban-user`             | POST    | Suspendre un user (+ raison + durée)          |
| `/admin/unban-user`           | POST    | Réactiver un user                             |
| `/admin/list-user-sessions`   | POST    | Voir les sessions actives                     |
| `/admin/revoke-user-session`  | POST    | Révoquer une session spécifique               |
| `/admin/revoke-user-sessions` | POST    | Révoquer TOUTES les sessions                  |
| `/admin/impersonate-user`     | POST    | Se connecter en tant que user (support)       |
| `/admin/stop-impersonating`   | POST    | Arrêter l'impersonation                       |
| `/admin/remove-user`          | POST    | Supprimer un user (hard delete)               |
| `/admin/has-permission`       | POST    | Vérifier les permissions d'un user            |

**Schema ajouté par admin() :**

| Table          | Champ             | Type    | Description                               |
| -------------- | ----------------- | ------- | ----------------------------------------- |
| `auth_user`    | `role`            | string  | Rôle global (admin/user). Défaut : `user` |
| `auth_user`    | `banned`          | boolean | User suspendu ?                           |
| `auth_user`    | `ban_reason`      | string? | Raison de la suspension                   |
| `auth_user`    | `ban_expires`     | date?   | Date d'expiration du ban                  |
| `auth_session` | `impersonated_by` | string? | ID de l'admin qui impersonate             |

**Access Control FleetCore :**

- **Rôles admin plugin** = `admin` / `user` (rôle GLOBAL, pour accéder au dashboard admin)
- **Rôles organization plugin** = `owner` / `admin` / `member` (rôle PAR ORG, pour les permissions CRUD métier)
- Le CEO (auth_user.role = `admin`) peut accéder au module Settings admin
- Les employees (auth_user.role = `user`) ne peuvent PAS accéder au Settings admin
- Les permissions CRUD par module (CRM, Fleet, etc.) restent gérées par `permissions.ts` via le rôle org

| #     | Tâche                         | Résultat                                                                    |
| ----- | ----------------------------- | --------------------------------------------------------------------------- |
| 6D.1  | Analyser `lib/auth.ts`        | ✅ Plugins identifiés                                                       |
| 6D.2  | Ajouter plugin `admin()`      | ✅ admin({ defaultRole: "user", adminRoles: ["admin"] })                    |
| 6D.3  | SQL migration admin plugin    | ✅ 5 colonnes ajoutées                                                      |
| 6D.4  | Prisma schema update          | ✅ `pnpm prisma generate` OK                                                |
| 6D.5  | Set CEO role admin            | ✅ `UPDATE auth_user SET role = 'admin' WHERE email = 'mfodil@outlook.com'` |
| 6D.6  | Analyser `lib/auth-client.ts` | ✅ Analysé                                                                  |
| 6D.7  | Ajouter `adminClient()`       | ✅ Plugin client ajouté                                                     |
| 6D.8  | Test API list-users           | ✅ Admin reçoit la liste                                                    |
| 6D.9  | Test API create-user          | ✅ User test créé et supprimé                                               |
| 6D.10 | Test RBAC                     | ✅ Non-admin → 403                                                          |
| 6D.11 | Commit                        | ✅ `feat(auth): activate admin plugin with user management APIs`            |

---

## SECTION 5 — PLAN D'EXÉCUTION RESTANT — 9 SOUS-PHASES

```
Phase 0-WIP (15 min) — Commit Kanban WIP 🆕 C38
    ↓
Phase 6E (2-3h) — 🆕 Audit DB + Migration Schema (provider→tenant) C33-C36
    ↓ Analyser résultats ensemble
    ↓ Rédiger SQL migration
    ↓ ⚠️ CEO fait SNAPSHOT Supabase (backup) — OBLIGATOIRE (C44)
    ↓ CEO exécute SQL dans Supabase
Phase 6F (3-4h) — 🆕 Migration Code (provider→tenant) C39-C41
    ↓ COMMIT + BUILD + TESTS
Phase 6G (1-2h) — 🆕 Invitation Flow + Config org hooks
    ↓ COMMIT + TEST LOGIN
Phase 6H (1-2h) — Architecture Settings module (= V4 Phase 6E) C23
    ↓ VALIDATION CEO OBLIGATOIRE
Phase 6I (6-8h) — Implémentation Settings module (= V4 Phase 6F) C23, C37
    ↓ COMMIT + TEST COMPLET MODULE
Phase 7 (2-3h) — Validation E2E complète (V4 Phase 7 + enrichi V5.3)
    ↓ TAG post-auth-migration-v5
Phase 8 (1-2h) — 🆕 Réconciliation Kanban + Retour Step 2.3
    ↓ RETOUR AU TRAVAIL STEP 2.3
```

**Estimation totale restante : 17.5-26.5h (2.5-3.5 jours)**

---

### PHASE 0-WIP — Commit Kanban WIP

**Durée estimée : 15 min — 🆕 C38**
**Prérequis : Aucun. C'est la toute première action.**

#### Prompt Claude Code — Phase 0-WIP

```
CONTEXTE :
FleetCore — avant de démarrer la migration architecture, il faut commiter
les fichiers Kanban en cours pour avoir un historique propre.

MISSION :
1. git status — rapporte TOUS les fichiers modifiés/ajoutés/supprimés
2. git diff --stat — rapporte les statistiques
3. git add -A
4. git commit -m "wip(crm/leads): Step 2.3 kanban work-in-progress before arch migration"
5. git push

NE PAS vérifier si le build passe. C'est un commit WIP intentionnel.
L'objectif est de sauvegarder l'état avant la migration architecture.
```

**Vérification Phase 0-WIP :**

- [ ] Commit WIP effectué
- [ ] Push réussi
- [ ] 0 fichiers non suivis restants

---

### PHASE 6E — 🆕 Audit DB + Migration Schema (provider→tenant)

**Durée estimée : 2-3h — C33, C34, C35, C36**
**Prérequis : Phase 0-WIP terminée**

#### Prompt Claude Code — Phase 6E, Partie 1 : Audit

```
CONTEXTE :
FleetCore — migration Clerk → Better Auth. Phases 0-6D terminées.
Build SUCCESS, 1409 tests passent. Commit 8bf7d7f, tag phase6-clerk-purge-complete.

DÉCISION ARCHITECTURE CEO (23 février 2026) :
- Chaque division FleetCore = un tenant séparé = une auth_organization séparée
- Chaque client (futur) = un tenant séparé = une auth_organization séparée
- Pas de hiérarchie entre tenants (modèle plat)
- Le concept de "provider_id" est SUPPRIMÉ entièrement
- Les tables adm_providers et adm_provider_employees sont à SUPPRIMER
- tenant_id doit être ajouté sur TOUTES les tables CRM qui ne l'ont pas déjà
- AU DÉMARRAGE : seul le tenant FleetCore HQ existe (France et UAE créés plus tard)
- Toutes les données en DB sont des données de test jetables sauf le user mfudil@outlook.com

MISSION :

Phase 6E.1 — Audit complet de la base de données
Exécute les requêtes suivantes et rapporte les résultats EXACTS :

1. TOUTES les tables avec une colonne "provider_id" :
   SELECT table_name, column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE column_name = 'provider_id' AND table_schema = 'public'
   ORDER BY table_name;

2. TOUTES les tables avec une colonne contenant "clerk" :
   SELECT table_name, column_name, data_type
   FROM information_schema.columns
   WHERE column_name LIKE '%clerk%' AND table_schema = 'public'
   ORDER BY table_name;

3. TOUTES les tables CRM — ont-elles tenant_id et/ou provider_id :
   SELECT t.table_name,
     EXISTS(SELECT 1 FROM information_schema.columns c
       WHERE c.table_name = t.table_name AND c.column_name = 'tenant_id') as has_tenant_id,
     EXISTS(SELECT 1 FROM information_schema.columns c
       WHERE c.table_name = t.table_name AND c.column_name = 'provider_id') as has_provider_id
   FROM information_schema.tables t
   WHERE t.table_name LIKE 'crm_%' AND t.table_schema = 'public'
   ORDER BY t.table_name;

4. Contenu de adm_providers :
   SELECT id, code, name, status FROM adm_providers;

5. Contenu de auth_organization :
   SELECT id, name, slug, metadata FROM auth_organization;

6. Contenu de adm_tenants (colonnes clés) :
   SELECT id, name, slug, status FROM adm_tenants;

7. Contenu de auth_member :
   SELECT id, "organizationId", "userId", role FROM auth_member;

8. Foreign keys pointant vers adm_providers :
   SELECT tc.table_name, kcu.column_name, tc.constraint_name
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE ccu.table_name = 'adm_providers'
     AND tc.constraint_type = 'FOREIGN KEY';

9. Vérifier si auth_team et auth_team_member existent :
   SELECT table_name FROM information_schema.tables
   WHERE table_name IN ('auth_team', 'auth_team_member') AND table_schema = 'public';

10. RLS policies contenant "provider" :
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname LIKE '%provider%' OR qual::text LIKE '%provider%';

RAPPORTE les résultats BRUTS. Ne propose AUCUNE action avant que j'aie analysé les résultats.
N'INTERPRÈTE PAS les résultats. Donne les données factuelles.
```

#### Ce que nous faisons avec les résultats d'audit

1. Analyser les résultats ensemble
2. Construire le SQL de migration EXACT basé sur les faits
3. **⚠️ CEO fait un SNAPSHOT Supabase AVANT d'exécuter le SQL (C44)**
   - Dashboard Supabase → Settings → Database → Backups → Create backup
   - **Ce snapshot est la SEULE protection contre les opérations IRRÉVERSIBLES (DROP TABLE, DROP COLUMN)**
   - Après un DROP, le rollback git ne suffit plus — les données DB sont perdues sans backup
4. CEO exécute le SQL dans Supabase SQL Editor
5. Mettre à jour le Prisma schema manuellement
6. `pnpm prisma generate`
7. **Mettre à jour les fichiers seed (C46)** — supprimer les références à provider_id, adm_providers, adm_provider_employees et remplacer par tenant_id

#### SQL de migration — Structure ATTENDUE (ajustée après audit)

```sql
-- BLOC 1 : Vérifier que auth_organization "FleetCore HQ" existe
-- et que adm_tenants a le shared-ID correspondant.
-- Si shared-ID pas en place → UPDATE adm_tenants SET id = auth_organization.id

-- BLOC 2 : Ajouter tenant_id aux tables CRM qui ne l'ont pas
-- ALTER TABLE crm_leads ADD COLUMN tenant_id UUID;
-- ALTER TABLE crm_lead_activities ADD COLUMN tenant_id UUID;
-- (liste exacte déterminée par l'audit — Query 3)

-- BLOC 3 : Backfill tenant_id = ID du tenant FleetCore HQ
-- UPDATE crm_leads SET tenant_id = '<hq_tenant_id>' WHERE tenant_id IS NULL;
-- (toutes les données existantes sont FleetCore HQ)

-- BLOC 4 : Rendre tenant_id NOT NULL + FK vers adm_tenants + index
-- ALTER TABLE crm_leads ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE crm_leads ADD CONSTRAINT fk_crm_leads_tenant
--   FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id);
-- CREATE INDEX idx_crm_leads_tenant_id ON crm_leads(tenant_id);

-- BLOC 5 : DROP COLUMN provider_id de TOUTES les tables
-- ALTER TABLE crm_leads DROP COLUMN provider_id;
-- (pour chaque table trouvée par Query 1)

-- BLOC 6 : DROP foreign keys vers adm_providers
-- ALTER TABLE xxx DROP CONSTRAINT yyy;
-- (pour chaque FK trouvée par Query 8)

-- BLOC 7 : DROP TABLE adm_provider_employees
-- DROP TABLE adm_provider_employees;

-- BLOC 8 : DROP TABLE adm_providers
-- DROP TABLE adm_providers;

-- BLOC 9 : RENAME clerk_user_id → auth_user_id dans adm_members (si existe encore)
-- ALTER TABLE adm_members RENAME COLUMN clerk_user_id TO auth_user_id;
-- (vérifier via Query 2)

-- BLOC 10 : Cleanup colonnes clerk résiduelles
-- ALTER TABLE adm_audit_logs DROP COLUMN IF EXISTS performed_by_clerk_id;
-- (vérifier via Query 2)

-- BLOC 11 : Créer auth_member pour mfudil@outlook.com dans HQ
-- INSERT INTO auth_member (id, "organizationId", "userId", role, "createdAt")
-- VALUES (gen_random_uuid(), '<hq_org_id>', '<user_id>', 'owner', NOW());
-- (si pas déjà existant — vérifier via Query 7)
```

**Vérification Phase 6E :**

- [ ] ⚠️ SNAPSHOT Supabase effectué AVANT le SQL (C44 — backup obligatoire)
- [ ] Audit DB exécuté — résultats factuels obtenus (10 queries)
- [ ] SQL de migration rédigé sur base des résultats réels (pas d'hypothèse)
- [ ] SQL exécuté par CEO dans Supabase
- [ ] **Gate 3 post-cleanup validée (voir Section 11)** — toutes les vérifications DB post-DROP passent
- [ ] Prisma schema mis à jour manuellement (suppression models adm_providers, adm_provider_employees, ajout tenant_id, suppression provider_id)
- [ ] `pnpm prisma generate` → succès
- [ ] Fichiers seed mis à jour — 0 référence à provider_id, adm_providers, adm_provider_employees (C46)
- [ ] `pnpm tsc --noEmit` → ÉCHEC ATTENDU (code référence encore provider_id)

---

### PHASE 6F — 🆕 Migration Code (provider→tenant)

**Durée estimée : 3-4h — C39, C40, C41**
**Prérequis : Phase 6E terminée (DB migrée)**

#### Prompt Claude Code — Phase 6F, Partie 1 : Inventaire

```
CONTEXTE :
FleetCore — migration architecture. La DB a été migrée :
- provider_id supprimé de toutes les tables CRM
- adm_providers et adm_provider_employees supprimés
- tenant_id ajouté sur toutes les tables CRM
- clerk_user_id renommé/supprimé dans adm_members
- Le Prisma schema a été mis à jour et pnpm prisma generate exécuté

Le code ne compile PAS car il référence encore provider_id, adm_providers,
adm_provider_employees, et getProviderContext().

Le nouveau pattern est :
- Le tenant_id vient directement de auth_session.activeOrganizationId
- Plus besoin de résoudre le provider via une table intermédiaire
- Le filtre WHERE est simplement tenant_id = session.activeOrganizationId

OBJECTIF :
Rendre le code compatible avec la nouvelle architecture.

MISSION :

Phase 6F.1 — Inventaire COMPLET des fichiers impactés
Recherche TOUS les fichiers qui référencent les concepts supprimés :

1. grep -rn "provider_id\|providerId" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v .backup | grep -v .md
2. grep -rn "adm_providers\|adm_provider_employees" --include="*.ts" --include="*.tsx" | grep -v node_modules
3. grep -rn "getProviderContext\|buildProviderFilter\|resolveProviderByCountry\|providerContext\|ProviderContext" --include="*.ts" --include="*.tsx" | grep -v node_modules
4. grep -rn "clerk_user_id\|clerkUserId" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v .md

Rapporte la liste COMPLÈTE groupée par catégorie :
- lib/utils/
- lib/actions/
- lib/auth/
- components/
- app/ (routes)
- tests/

Phase 6F.2 — Plan de migration fichier par fichier
Pour chaque fichier, propose le changement. Le pattern de remplacement :
- getProviderContext() → récupérer session.activeOrganizationId (= tenant_id)
- buildProviderFilter(providerId) → WHERE tenant_id = activeOrganizationId
- resolveProviderByCountry() → SUPPRIMER (le tenant est dans la session)
- adm_provider_employees lookup → SUPPRIMER (auth_member suffit)
- Prisma queries : where: { provider_id: X } → where: { tenant_id: X }

NE PAS exécuter avant validation. PROPOSE le plan complet.

CONTRAINTES :
- Le user mfudil@outlook.com doit rester fonctionnel
- Si un fichier touche un comportement métier (scoring, qualification,
  conversion), signale-le SANS le modifier — QUESTION CEO
- Respecter le workflow : schema Prisma déjà mis à jour, ne PAS toucher au schema
```

**Vérification Phase 6F :**

- [ ] 0 référence à provider_id/providerId dans le code (`grep` vérifié)
- [ ] 0 référence à adm_providers, adm_provider_employees dans le code
- [ ] 0 référence à getProviderContext, buildProviderFilter, resolveProviderByCountry
- [ ] 0 référence à clerk_user_id dans le code
- [ ] fichier `lib/utils/provider-context.ts` SUPPRIMÉ ou entièrement réécrit
- [ ] `pnpm tsc --noEmit` → 0 erreurs
- [ ] `pnpm build` → SUCCESS
- [ ] `pnpm vitest run` → résultats rapportés (certains tests peuvent casser si mockant provider — acceptable, à corriger)
- [ ] Commit : `feat(arch): replace provider_id with tenant_id unified multi-tenant`

---

### PHASE 6G — 🆕 Invitation Flow + Configuration Organization Hooks

**Durée estimée : 1-2h**
**Prérequis : Phase 6F terminée (code compilable)**

#### Prompt Claude Code — Phase 6G

```
CONTEXTE :
FleetCore — architecture multi-tenant unifiée opérationnelle.
Le code utilise session.activeOrganizationId comme tenant_id partout.
Au démarrage, seul le tenant FleetCore HQ existe.

OBJECTIF :
Configurer le flow d'invitation Better Auth pour que :
1. Quand un admin invite quelqu'un dans une org, l'invité rejoint cette org
2. Après acceptation, une entrée est créée dans adm_members (table FleetCore métier)
3. L'active_organization_id est auto-set au login

MISSION :

Phase 6G.1 — Analyse configuration actuelle
- Examine lib/auth.ts : plugins activés, hooks existants
- Examine le databaseHook session.create.before (Phase 6C — DÉJÀ implémenté)
- Examine auth_organization et adm_tenants : correspondance shared-ID ?
- Examine la table adm_members : quelles colonnes sont requises pour créer un membre ?
- Examine le modèle Prisma adm_members : types, contraintes, champs obligatoires

Phase 6G.2 — Plan d'implémentation
Propose un plan pour :
1. organizationHooks.afterAcceptInvitation dans lib/auth.ts :
   - L'invitation contient organizationId = tenant_id
   - Créer adm_members { tenant_id (= organizationId), email, auth_user_id, role, status: 'active' }
   - Importer prisma depuis @/lib/prisma

2. Vérifier databaseHook session.create.before (déjà en place depuis Phase 6C) :
   - S'assurer que active_organization_id est set au login
   - Si user a 1 org → set celle-là
   - Si user a plusieurs orgs → set la première (HQ en priorité via metadata is_headquarters)

3. Vérifier sendInvitationEmail :
   - Resend config en place ?
   - Template email invitation existe ?
   - Callback dans organization plugin configuré ?

NE PAS exécuter. PROPOSE le plan.

CONTRAINTES :
- Mécanismes natifs Better Auth uniquement (organizationHooks, databaseHooks)
- Importer prisma depuis @/lib/prisma
- Ne pas hardcoder d'UUID — lookup par metadata/slug si nécessaire
- Ne pas inventer de tables — adm_members existe déjà
```

**Vérification Phase 6G :**

- [ ] organizationHooks.afterAcceptInvitation implémenté dans lib/auth.ts
- [ ] databaseHook session.create.before vérifié (déjà en place Phase 6C)
- [ ] Config email invitation vérifiée (sendInvitationEmail callback)
- [ ] Login → active_organization_id correctement set
- [ ] `pnpm tsc --noEmit` → 0 erreurs
- [ ] `pnpm build` → SUCCESS
- [ ] Commit : `feat(auth): invitation flow with auto-provisioning adm_members`

---

### PHASE 6H — Architecture module Settings

**Durée estimée : 1-2h — DESIGN UNIQUEMENT, PAS DE CODE**
**Source : V4 Phase 6E intégrale — C23**
**Prérequis : Phase 6G terminée**

#### Objectif

Concevoir l'architecture du module Settings admin qui remplace les fonctionnalités Clerk Dashboard. Ce module vit dans `/adm/settings/` et est accessible UNIQUEMENT aux users avec `auth_user.role = 'admin'`.

#### Périmètre fonctionnel

Le module Settings comporte **4 sections** :

##### Section 1 — User Management (`/adm/settings/users`)

| Fonctionnalité                                         | API Better Auth utilisée                | Priorité |
| ------------------------------------------------------ | --------------------------------------- | -------- |
| Liste des users avec search/filter/pagination          | `admin.listUsers()`                     | 🔴 P0    |
| Voir détail user (email, name, role, banned, sessions) | `admin.getUser()`                       | 🔴 P0    |
| Créer un user                                          | `admin.createUser()`                    | 🔴 P0    |
| Modifier un user (name, email)                         | `admin.updateUser()`                    | 🟡 P1    |
| Changer le rôle global (admin/user)                    | `admin.setRole()`                       | 🟡 P1    |
| Reset password admin                                   | `admin.setUserPassword()`               | 🔴 P0    |
| Suspendre/réactiver un user                            | `admin.banUser()` / `admin.unbanUser()` | 🟡 P1    |
| Voir sessions actives d'un user                        | `admin.listUserSessions()`              | 🟡 P1    |
| Révoquer une session                                   | `admin.revokeUserSession()`             | 🟡 P1    |
| Impersonate un user (support)                          | `admin.impersonateUser()`               | 🟢 P2    |
| Supprimer un user                                      | `admin.removeUser()`                    | 🟢 P2    |

##### Section 2 — Organization / Tenant Management (`/adm/settings/organizations`)

| Fonctionnalité                                  | API utilisée                                    | Priorité |
| ----------------------------------------------- | ----------------------------------------------- | -------- |
| Liste des organizations (= tenants)             | `organization.listOrganizations()` côté server  | 🔴 P0    |
| Voir détail org (name, slug, metadata, members) | `organization.getFullOrganization()`            | 🔴 P0    |
| Créer une organization                          | `organization.createOrganization()` server-side | 🟡 P1    |
| Modifier une organization                       | `organization.updateOrganization()`             | 🟡 P1    |
| Lister les membres d'une org                    | `organization.listMembers()`                    | 🔴 P0    |
| Changer le rôle d'un membre dans l'org          | `organization.updateMemberRole()`               | 🟡 P1    |
| Retirer un membre                               | `organization.removeMember()`                   | 🟡 P1    |

##### Section 3 — Invitation Management (`/adm/settings/invitations`)

| Fonctionnalité                | API utilisée                      | Priorité |
| ----------------------------- | --------------------------------- | -------- |
| Inviter un user dans une org  | `organization.inviteMember()`     | 🔴 P0    |
| Liste des invitations pending | `organization.listInvitations()`  | 🔴 P0    |
| Annuler une invitation        | `organization.cancelInvitation()` | 🟡 P1    |
| Renvoyer une invitation       | Cancel + re-invite                | 🟡 P1    |

##### Section 4 — Rôles & Permissions (`/adm/settings/roles`)

| Fonctionnalité                                        | Source                                      | Priorité         |
| ----------------------------------------------------- | ------------------------------------------- | ---------------- |
| Afficher les rôles org existants (owner/admin/member) | `permissions.ts`                            | 🟡 P1            |
| Afficher les permissions CRUD par module par rôle     | `permissions.ts` ROLE_PERMISSIONS           | 🟡 P1            |
| **Éditer les permissions** (future : DB-driven)       | Tables `adm_roles` + `adm_role_permissions` | 🟢 P2 — POST-MVP |

#### Architecture technique

```
app/[locale]/(app)/adm/settings/
├── layout.tsx                    ← Guard: auth_user.role === 'admin'
├── page.tsx                      ← Redirect vers /users
├── users/
│   ├── page.tsx                  ← DataTable users (admin.listUsers)
│   └── [id]/
│       └── page.tsx              ← Détail user + actions
├── organizations/
│   ├── page.tsx                  ← Liste orgs
│   └── [id]/
│       └── page.tsx              ← Détail org + membres
├── invitations/
│   └── page.tsx                  ← Liste invitations + formulaire
└── roles/
    └── page.tsx                  ← Affichage rôles + permissions (read-only MVP)
```

#### Règle visuelle

**shadcnuikit** fournit le rendu. Les pages Settings suivent le pattern table/detail de shadcnuikit. Aucune invention UI.

#### Tâches Phase 6H

| #    | Tâche                                                      | Détail                                                                                                                             | Temps  |
| ---- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 6H.1 | Identifier le pattern Settings dans shadcnuikit            | Explorer `/settings/` dans le repo shadcnuikit. Documenter les composants, layouts, patterns disponibles                           | 30 min |
| 6H.2 | Mapper les sections FleetCore sur les patterns shadcnuikit | Pour chaque section (users, orgs, invitations, roles) : quel composant shadcnuikit utiliser ? DataTable, Detail page, Form ?       | 20 min |
| 6H.3 | Documenter les API routes nécessaires                      | Lesquelles passent direct par le catch-all Better Auth (`/api/auth/*`) et lesquelles nécessitent des API routes custom FleetCore ? | 20 min |
| 6H.4 | Définir les guards de sécurité                             | Layout guard (server-side `auth_user.role === 'admin'`), API guard (Better Auth admin middleware natif)                            | 15 min |
| 6H.5 | Rechercher Better Auth UI (@daveyplate/better-auth-ui)     | Évaluer si des composants prêts à l'emploi (OrganizationSwitcher, SettingsCards) sont utilisables                                  | 15 min |
| 6H.6 | Validation CEO                                             | Présenter le plan des 4 sections + wireframes. ATTENDRE validation avant Phase 6I                                                  | 15 min |

**Livrable Phase 6H :** Document d'architecture validé par CEO, avec mapping composants shadcnuikit → sections Settings.

---

### PHASE 6I — Implémentation module Settings

**Durée estimée : 6-8h**
**Source : V4 Phase 6F intégrale — C23, C37**
**⚠️ UNIQUEMENT après validation Phase 6H par CEO.**

#### Stratégie d'implémentation

Ordre : P0 d'abord (minimal fonctionnel), P1 ensuite (complet), P2 dernier (nice-to-have).

| #                         | Tâche                                                                                                                                                                                                                                    | Section     | Priorité | Temps  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------- | ------ |
| **Layout + Guard**        |                                                                                                                                                                                                                                          |             |          |        |
| 6I.1                      | Créer `adm/settings/layout.tsx`                                                                                                                                                                                                          | Global      | 🔴 P0    | 30 min |
|                           | Guard server-side : `const session = await auth.api.getSession({headers: await headers()})`. Si `!session` ou `session.user.role !== 'admin'` → redirect 403. Sidebar navigation 4 sections (Users, Organizations, Invitations, Roles)   |             |          |        |
| **Section Users**         |                                                                                                                                                                                                                                          |             |          |        |
| 6I.2                      | Page liste users                                                                                                                                                                                                                         | Users       | 🔴 P0    | 60 min |
|                           | DataTable shadcnuikit avec colonnes : Name, Email, Role, Status (active/banned), Created. Actions : View, Ban/Unban, Reset Password. Search par email/name. Pagination. Appel `admin.listUsers()` côté serveur                           |             |          |        |
| 6I.3                      | Page détail user                                                                                                                                                                                                                         | Users       | 🔴 P0    | 45 min |
|                           | Info user (name, email, role, banned, ban_reason, ban_expires, createdAt). Liste sessions actives (`admin.listUserSessions()`). Actions : Reset Password (`admin.setUserPassword()`), Ban/Unban, Change Role                             |             |          |        |
| 6I.4                      | Modal créer user                                                                                                                                                                                                                         | Users       | 🔴 P0    | 30 min |
|                           | Formulaire : email, name, password, role (select admin/user). Appel `admin.createUser()`. Validation Zod. Toast succès/erreur                                                                                                            |             |          |        |
| **Section Organizations** |                                                                                                                                                                                                                                          |             |          |        |
| 6I.5                      | Page liste organizations                                                                                                                                                                                                                 | Orgs        | 🔴 P0    | 45 min |
|                           | DataTable : Name, Slug, Members count, Created. Lister les `auth_organization` avec jointure `auth_member` pour count. Actions : View                                                                                                    |             |          |        |
| 6I.6                      | Page détail organization                                                                                                                                                                                                                 | Orgs        | 🔴 P0    | 60 min |
|                           | Info org (name, slug, metadata). Liste des membres avec rôle org. Actions : Change member role (`organization.updateMemberRole()`), Remove member (`organization.removeMember()`). Bouton "Invite member" → redirect section Invitations |             |          |        |
| **Section Invitations**   |                                                                                                                                                                                                                                          |             |          |        |
| 6I.7                      | Page invitations                                                                                                                                                                                                                         | Invitations | 🔴 P0    | 60 min |
|                           | Formulaire : email, organization (select), role org (select owner/admin/member). Appel `organization.inviteMember()` server-side. Liste invitations pending avec statut. Action : Cancel invitation                                      |             |          |        |
| **Section Roles**         |                                                                                                                                                                                                                                          |             |          |        |
| 6I.8                      | Page roles (read-only)                                                                                                                                                                                                                   | Roles       | 🟡 P1    | 30 min |
|                           | Affichage du ROLE_PERMISSIONS actuel (owner/admin/member × modules × CRUD). Rendu en table lisible. Commentaire : "Editing will be available in a future version"                                                                        |             |          |        |
| **P1 — Améliorations**    |                                                                                                                                                                                                                                          |             |          |        |
| 6I.9                      | Actions P1 users                                                                                                                                                                                                                         | Users       | 🟡 P1    | 45 min |
|                           | Edit user (name, email) via `admin.updateUser()`. Revoke session via `admin.revokeUserSession()`. Revoke all sessions via `admin.revokeUserSessions()`                                                                                   |             |          |        |
| 6I.10                     | Actions P1 orgs                                                                                                                                                                                                                          | Orgs        | 🟡 P1    | 30 min |
|                           | Create org via `organization.createOrganization()` server-side. Update org name/slug                                                                                                                                                     |             |          |        |
| 6I.11                     | Actions P1 invitations                                                                                                                                                                                                                   | Invitations | 🟡 P1    | 20 min |
|                           | Resend invitation (cancel + re-invite). Bulk cancel                                                                                                                                                                                      |             |          |        |
| **Validation**            |                                                                                                                                                                                                                                          |             |          |        |
| 6I.12                     | Tests build + type                                                                                                                                                                                                                       | Global      | 🔴 P0    | 15 min |
|                           | `pnpm tsc --noEmit` → 0 erreurs. `pnpm build` → succès. `pnpm vitest run` → 0 échecs                                                                                                                                                     |             |          |        |
| 6I.13                     | Commit                                                                                                                                                                                                                                   | Global      | 🔴 P0    | 5 min  |
|                           | `feat(adm): Settings module - user, organization, invitation management`                                                                                                                                                                 |             |          |        |

**Vérification Phase 6I :**

- [ ] `/adm/settings/users` affiche la liste des users
- [ ] Créer un user → user apparaît dans la liste + DB
- [ ] Reset password → nouveau password fonctionnel
- [ ] Ban user → user ne peut plus se connecter
- [ ] Unban → user peut se reconnecter
- [ ] `/adm/settings/organizations` affiche les orgs avec nombre de membres
- [ ] Détail org affiche les membres avec rôles
- [ ] `/adm/settings/invitations` permet d'inviter un email dans une org
- [ ] Invitation envoyée → email Resend reçu (si configuré) OU invitation en DB
- [ ] Cancel invitation → status `canceled` en DB
- [ ] `/adm/settings/roles` affiche les permissions CRUD par rôle
- [ ] Guard : un user non-admin ne peut PAS accéder à `/adm/settings/*` → redirect 403
- [ ] `pnpm tsc --noEmit` → 0 erreurs
- [ ] `pnpm build` → succès
- [ ] `pnpm vitest run` → 0 échecs

---

### PHASE 7 — Validation E2E complète

**Durée estimée : 2-3h**
**Source : V4 Phase 7 intégrale + enrichissements V5.3 + Gate 3 (C45)**
**Reprend INTÉGRALEMENT la checklist V4 Phase 7, avec ajouts architecture multi-tenant.**
**Inclut la Gate 3 post-cleanup formalisée (de FLEETCORE_PHASE6_ENRICHED_PREREQUISITES.md Section E).**

| #                                | Test                                                     | Résultat attendu                                                                                                                                                                                                                                                                                               | Temps  |
| -------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **Auth flows**                   |                                                          |                                                                                                                                                                                                                                                                                                                |        |
| 7.1                              | Login email/password                                     | Session en table `auth_session`, `active_organization_id` = UUID HQ, redirect dashboard                                                                                                                                                                                                                        | 5 min  |
| 7.2                              | Register nouveau compte                                  | `auth_user` + `auth_account` créés                                                                                                                                                                                                                                                                             | 5 min  |
| 7.3                              | Forgot password                                          | Email Resend reçu, token en `auth_verification`                                                                                                                                                                                                                                                                | 10 min |
| 7.4                              | Reset password                                           | Password changé, token invalidé                                                                                                                                                                                                                                                                                | 5 min  |
| **Routes protégées**             |                                                          |                                                                                                                                                                                                                                                                                                                |        |
| 7.5                              | Route protégée sans session                              | Redirect `/sign-in`                                                                                                                                                                                                                                                                                            | 2 min  |
| 7.6                              | API protégée sans session                                | 401                                                                                                                                                                                                                                                                                                            | 2 min  |
| 7.7                              | Brute force                                              | 6ème login → 429                                                                                                                                                                                                                                                                                               | 5 min  |
| **CRM fonctionnel**              |                                                          |                                                                                                                                                                                                                                                                                                                |        |
| 7.8                              | CRM leads visibles                                       | DataTable + **🆕 tenant isolation via tenant_id** (plus provider_id)                                                                                                                                                                                                                                           | 5 min  |
| 7.9                              | Kanban drag & drop                                       | Lead change de colonne                                                                                                                                                                                                                                                                                         | 5 min  |
| 7.10                             | Création lead                                            | **🆕 `tenant_id` correct** (plus provider_id)                                                                                                                                                                                                                                                                  | 5 min  |
| 7.11                             | Tenant isolation                                         | **🆕 Filtre WHERE tenant_id = session.activeOrganizationId**                                                                                                                                                                                                                                                   | 10 min |
| **Sessions**                     |                                                          |                                                                                                                                                                                                                                                                                                                |        |
| 7.12                             | Déconnexion                                              | Session supprimée de la table                                                                                                                                                                                                                                                                                  | 2 min  |
| 7.13                             | Switch organisation                                      | `active_organization_id` change en DB (via `setActive`)                                                                                                                                                                                                                                                        | 5 min  |
| **Audit**                        |                                                          |                                                                                                                                                                                                                                                                                                                |        |
| 7.14                             | Audit log login                                          | `adm_audit_logs` contient entry LOGIN (C4)                                                                                                                                                                                                                                                                     | 5 min  |
| **Invitation flow**              |                                                          |                                                                                                                                                                                                                                                                                                                |        |
| 7.15                             | Flow invitation complet                                  | Créer invitation (via Settings) → email → register → auto-accept → membre actif + **🆕 adm_members créé**                                                                                                                                                                                                      | 15 min |
| **Settings module**              |                                                          |                                                                                                                                                                                                                                                                                                                |        |
| 7.16                             | Admin accède Settings                                    | `/adm/settings/users` charge avec la liste                                                                                                                                                                                                                                                                     | 5 min  |
| 7.17                             | Non-admin rejeté Settings                                | User `role=user` ne peut pas accéder → 403                                                                                                                                                                                                                                                                     | 5 min  |
| 7.18                             | Créer user via Settings                                  | `admin.createUser()` → user en DB + peut se connecter                                                                                                                                                                                                                                                          | 10 min |
| 7.19                             | Reset password via Settings                              | `admin.setUserPassword()` → user peut se connecter avec nouveau password                                                                                                                                                                                                                                       | 5 min  |
| 7.20                             | Ban/Unban via Settings                                   | `admin.banUser()` → user ne peut plus se connecter. `admin.unbanUser()` → user peut                                                                                                                                                                                                                            | 10 min |
| 7.21                             | Invite user via Settings                                 | Créer invitation → visible dans liste                                                                                                                                                                                                                                                                          | 5 min  |
| **🆕 Architecture multi-tenant** |                                                          |                                                                                                                                                                                                                                                                                                                |        |
| 7.22                             | 🆕 DB : 0 colonnes provider_id                           | `SELECT table_name, column_name FROM information_schema.columns WHERE column_name = 'provider_id' AND table_schema = 'public';` → 0 résultats                                                                                                                                                                  | 2 min  |
| 7.23                             | 🆕 DB : 0 colonnes clerk                                 | `SELECT table_name, column_name FROM information_schema.columns WHERE column_name LIKE '%clerk%' AND table_schema = 'public';` → 0 résultats                                                                                                                                                                   | 2 min  |
| 7.24                             | 🆕 DB : adm_providers + adm_provider_employees SUPPRIMÉS | `SELECT table_name FROM information_schema.tables WHERE table_name IN ('adm_providers', 'adm_provider_employees') AND table_schema = 'public';` → 0 résultats                                                                                                                                                  | 2 min  |
| 7.25                             | 🆕 DB : TOUTES tables CRM ont tenant_id                  | `SELECT t.table_name FROM information_schema.tables t WHERE t.table_name LIKE 'crm_%' AND t.table_schema = 'public' AND NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'tenant_id');` → 0 résultats                                              | 2 min  |
| 7.26                             | 🆕 DB : auth_organization ↔ adm_tenants 1:1             | `SELECT ao.id, ao.name, at.name as tenant_name FROM auth_organization ao LEFT JOIN adm_tenants at ON ao.id = at.id;` → toutes les lignes ont un match                                                                                                                                                          | 2 min  |
| 7.27                             | 🆕 Code : 0 référence provider_id/clerk                  | `grep -rn "provider_id\|clerk_user_id\|adm_providers\|adm_provider_employees\|getProviderContext\|buildProviderFilter\|resolveProviderByCountry\|FLEETCORE_ADMIN_ORG_ID\|CLERK" --include="*.ts" --include="*.tsx" --include="*.env*" \| grep -v node_modules \| grep -v .md \| grep -v .backup` → 0 résultats | 5 min  |
| **Finalisation**                 |                                                          |                                                                                                                                                                                                                                                                                                                |        |
| 7.28                             | `pnpm build` final                                       | Succès                                                                                                                                                                                                                                                                                                         | 10 min |
| 7.29                             | `pnpm vitest run` final                                  | 0 échecs                                                                                                                                                                                                                                                                                                       | 10 min |
| 7.30                             | Git commit + tag                                         | `feat: complete Clerk to Better Auth migration with admin dashboard and unified multi-tenant` + tag `post-auth-migration-v5`                                                                                                                                                                                   | 5 min  |
| 7.31                             | 🆕 Mettre à jour SUPABASE_SCHEMA_REFERENCE.md            | Refléter la nouvelle architecture (tables supprimées, colonnes ajoutées/supprimées)                                                                                                                                                                                                                            | 15 min |

---

### PHASE 8 — 🆕 Réconciliation Kanban + Retour Step 2.3

**Durée estimée : 1-2h**
**Prérequis : Phase 7 terminée et taguée**

#### Prompt Claude Code — Phase 8

```
CONTEXTE :
FleetCore — migration Better Auth TERMINÉE et VALIDÉE. Tag post-auth-migration-v5 posé.
Module Settings FONCTIONNEL.
Avant la migration, le Step 2.3 Kanban Leads avait un commit WIP
("wip(crm/leads): Step 2.3 kanban work-in-progress before arch migration").

Les fichiers WIP référencent probablement provider_id, resolveProviderByCountry,
buildProviderFilter — tous ces concepts ont été remplacés par tenant_id.

OBJECTIF :
Vérifier et adapter le code Kanban à la nouvelle architecture.

MISSION :

Phase 8.1 — Diagnostic
1. git log --oneline -10 — voir les derniers commits
2. Identifier les fichiers du commit WIP qui référencent provider_id
3. Pour chaque fichier, évaluer :
   - Est-ce un composant UI pur (kanban-board, kanban-card) ? → Probablement OK
   - Référence-t-il provider_id ? → Adapter vers tenant_id
   - Appelle-t-il getProviderContext ou buildProviderFilter ? → Remplacer

Phase 8.2 — Adaptation
Pour chaque fichier nécessitant des changements :
- Remplacer provider_id par tenant_id
- Remplacer les appels aux fonctions supprimées par le nouveau pattern
  (session.activeOrganizationId = tenant_id)

Phase 8.3 — Vérification
1. pnpm tsc --noEmit → 0 erreurs
2. pnpm build → SUCCESS
3. Page /crm/leads en mode Kanban → charge
4. Drag & drop → fonctionne
5. Toggle Table/Kanban → fonctionne
6. git commit -m "fix(crm/leads): adapt kanban to unified multi-tenant architecture"

CONTRAINTES :
- Ne PAS modifier la logique métier du Kanban (scoring, qualification, conversion)
- Adapter UNIQUEMENT les filtres provider→tenant
- Si un fichier a trop de conflits → le recréer plutôt que le merger
```

**Vérification Phase 8 :**

- [ ] Page Kanban Leads fonctionne
- [ ] Drag & drop change le statut
- [ ] Toggle Table/Kanban fonctionne
- [ ] `pnpm tsc --noEmit` → 0 erreurs
- [ ] `pnpm build` → SUCCESS
- [ ] Commit propre
- [ ] **RETOUR AU TRAVAIL STEP 2.3** ✅

---

## SECTION 6 — ESTIMATION CONSOLIDÉE

| Phase | Description                                      | Estimation       | Complexité |
| ----- | ------------------------------------------------ | ---------------- | ---------- |
| 0-WIP | 🆕 Commit Kanban WIP                             | **15 min**       | Triviale   |
| 6E    | 🆕 Audit DB + Migration Schema (provider→tenant) | **2-3h**         | Élevée     |
| 6F    | 🆕 Migration Code (provider→tenant)              | **3-4h**         | Élevée     |
| 6G    | 🆕 Invitation Flow + Config org hooks            | **1-2h**         | Moyenne    |
| 6H    | Architecture Settings (ex-V4 6E)                 | **1-2h**         | Moyenne    |
| 6I    | Implémentation Settings (ex-V4 6F)               | **6-8h**         | Haute      |
| 7     | Validation E2E complète (V4 Phase 7 + enrichi)   | **2-3h**         | Basse      |
| 8     | 🆕 Réconciliation Kanban + Retour 2.3            | **1-2h**         | Moyenne    |
|       | **SOUS-TOTAL DEV**                               | **17.5-26.5h**   |            |
|       | **Buffer debug/imprévus (25%)**                  | **4.5-6.5h**     |            |
|       | **TOTAL**                                        | **22-33h**       |            |
|       | **EN JOURS (8h/jour)**                           | **2.75-4 jours** |            |

---

## SECTION 7 — ORDRE D'EXÉCUTION STRICT

```
Phase 0-WIP (15 min) — Commit Kanban WIP
    ↓ COMMIT WIP
Phase 6E (2-3h) — Audit DB + Migration Schema
    ↓ Analyser résultats ensemble
    ↓ Rédiger SQL migration
    ↓ ⚠️ CEO fait SNAPSHOT Supabase — OBLIGATOIRE (C44)
    ↓ CEO exécute SQL dans Supabase
    ↓ Mise à jour Prisma + generate + seed files (C46)
Phase 6F (3-4h) — Migration Code (provider→tenant)
    ↓ Analyser plan fichier par fichier
    ↓ Valider + exécuter
    ↓ COMMIT
Phase 6G (1-2h) — Invitation Flow
    ↓ Analyser + valider + exécuter
    ↓ COMMIT
Phase 6H (1-2h) — Design Settings
    ↓ VALIDATION CEO OBLIGATOIRE
Phase 6I (6-8h) — Implémentation Settings
    ↓ COMMIT + TEST COMPLET MODULE
Phase 7 (2-3h) — Validation E2E
    ↓ TAG post-auth-migration-v5
Phase 8 (1-2h) — Réconciliation Kanban
    ↓ Kanban fonctionne
    ↓ RETOUR AU TRAVAIL STEP 2.3 ✅
```

**RÈGLE :** Chaque phase est validée AVANT de passer à la suivante. Aucun skip.

---

## SECTION 8 — PROBLÈMES ANTICIPÉS

### De V4 (préservés)

| #   | Problème                                                                 | Probabilité                                                           | Impact       | Mitigation                                                                                                                       |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| P1  | databaseHook ne se déclenche pas au login                                | ~~MOYENNE~~ ✅ RÉSOLU Phase 6C                                        | ~~Bloquant~~ | Vérifié fonctionnel                                                                                                              |
| P2  | User avec plusieurs orgs — quelle activer ?                              | BASSE (1 seul user réel)                                              | Faible       | Prendre la première org. Plus tard : org préférée en user metadata                                                               |
| P3  | admin plugin schema incompatible Prisma manual                           | ~~MOYENNE~~ ✅ RÉSOLU Phase 6D                                        | ~~Moyen~~    | Colonnes ajoutées avec succès                                                                                                    |
| P4  | API admin endpoints non accessibles via catch-all                        | BASSE                                                                 | Moyen        | Le catch-all `/api/auth/[...all]` gère TOUS les endpoints Better Auth y compris admin. Vérifier la route                         |
| P5  | shadcnuikit n'a pas de pattern Settings adapté                           | MOYENNE                                                               | Moyen        | Utiliser le pattern DataTable existant (déjà utilisé pour leads). Detail page = pattern existant                                 |
| P6  | Conflit rôle admin (global) vs rôle org (owner/admin/member)             | MOYENNE                                                               | Élevé        | SÉPARER clairement : `auth_user.role` = accès Settings. `auth_member.role` = permissions CRUD métier. Deux systèmes indépendants |
| P7  | Kanban WIP stash conflicts au merge final                                | HAUTE                                                                 | Moyen        | Résoudre fichier par fichier. La migration auth touche des fichiers différents du Kanban                                         |
| P8  | `organizations/page.tsx` crash si env var supprimée avant migration code | ~~HAUTE~~ ✅ RÉSOLU Phase 6A.5                                        | ~~Moyenne~~  | Migré vers DB lookup                                                                                                             |
| P9  | `getProviderContext()` ne résout pas le provider via `auth_user_id`      | ~~MOYENNE~~ ✅ RÉSOLU Phase 6A.9 / **🆕 FONCTION SUPPRIMÉE Phase 6F** | ~~Basse~~    | Plus applicable                                                                                                                  |

### De V3 (préservés, actualisés)

| #   | Problème                               | Probabilité                                       | Impact       | Mitigation                                                             |
| --- | -------------------------------------- | ------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| P10 | Duplication organization / adm_tenants | HAUTE                                             | Moyen        | Accepté : shared-ID. `auth_organization.id` = `adm_tenants.id`         |
| P11 | activeOrganizationId vs provider_id    | ~~HAUTE~~ **🆕 RÉSOLU par nouvelle architecture** | ~~Élevé~~    | provider_id supprimé. `activeOrganizationId` = `tenant_id` directement |
| P12 | Prisma naming camelCase vs snake_case  | ~~MOYENNE~~ ✅ RÉSOLU                             | ~~Moyen~~    | `@@map()` sur chaque model                                             |
| P13 | Cookie name proxy                      | ~~MOYENNE~~ ✅ RÉSOLU Phase 3                     | ~~Élevé~~    | `getSessionCookie()` utilisé                                           |
| P14 | Vercel Edge                            | ~~HAUTE~~ ✅ RÉSOLU Phase 3                       | ~~Critique~~ | Proxy = ZÉRO query DB                                                  |
| P15 | Auto-accept invitation après signup    | HAUTE                                             | Élevé        | Hook `after` dans auth config. Nécessite tests E2E en Phase 7          |
| P16 | clt_members 59 rows dummy              | BASSE                                             | Faible       | Données test jetables                                                  |
| P17 | Resend email templates                 | MOYENNE                                           | Moyen        | 2 templates à vérifier : reset password + invitation                   |

### 🆕 Nouveaux (V5.3)

| #   | Problème                                                     | Probabilité  | Impact               | Mitigation                                                                    |
| --- | ------------------------------------------------------------ | ------------ | -------------------- | ----------------------------------------------------------------------------- |
| P18 | 🆕 Tables CRM n'ont pas encore tenant_id                     | HAUTE        | Élevé                | Audit Phase 6E.1 → SQL migration exacte                                       |
| P19 | 🆕 Backfill tenant_id sur données existantes                 | MOYENNE      | Moyen                | Toutes les données sont FleetCore HQ → un seul UPDATE                         |
| P20 | 🆕 Foreign keys vers adm_providers bloquent le DROP          | HAUTE        | Moyen                | Audit Phase 6E.1 Query 8 → DROP FK avant DROP TABLE                           |
| P21 | 🆕 Code réfère provider_id dans beaucoup de fichiers         | HAUTE        | Élevé                | Inventaire exhaustif Phase 6F.1 avant toute modification                      |
| P22 | 🆕 Tests unitaires mockent getProviderContext()              | MOYENNE      | Moyen                | Mettre à jour les mocks pour utiliser session.activeOrganizationId            |
| P23 | 🆕 Better Auth UI (@daveyplate) peut ne pas être compatible  | MOYENNE      | Faible               | Fallback : construire avec shadcn/ui en suivant patterns shadcnuikit          |
| P24 | 🆕 DROP SQL irréversible sans snapshot Supabase (C44)        | **CRITIQUE** | Certaine sans backup | **Snapshot Supabase OBLIGATOIRE avant Phase 6E SQL** — seul filet de sécurité |
| P25 | 🆕 Fichiers seed non mis à jour après DROP provider_id (C46) | MOYENNE      | Moyen                | Mettre à jour les seeds en Phase 6E après Prisma generate                     |

---

## SECTION 9 — SÉCURITÉ

### Protection auth (de V4 + V3)

| Protection         | Clerk     | Better Auth                           | Vérifié | Phase    |
| ------------------ | --------- | ------------------------------------- | ------- | -------- |
| httpOnly cookies   | ✅        | ✅ natif                              | ✅      | Phase 1  |
| CSRF               | ✅        | ✅ Origin + Fetch Metadata + SameSite | ✅      | Phase 1  |
| Password hashing   | ✅ bcrypt | ✅ scrypt (plus résistant)            | ✅      | Phase 1  |
| Brute force        | ✅        | ✅ 5 login/min, 3 register/min (C3)   | ✅      | Phase 1  |
| Session revocation | ✅        | ✅ `revokeSession()`                  | ✅      | Phase 6D |
| IP tracking        | ✅        | ✅ ipAddress + userAgent en DB        | ✅      | Phase 1  |
| Audit login        | ✅        | ✅ Hook → adm_audit_logs (C4)         | ✅      | Phase 1  |

### Protection admin (de V4)

| Protection                      | Comment                                                    | Vérifié           |
| ------------------------------- | ---------------------------------------------------------- | ----------------- |
| Settings accessible admin only  | `auth_user.role === 'admin'` check server-side dans layout | Phase 6I.1        |
| API admin accessible admin only | Better Auth admin middleware natif (vérifie role)          | ✅ Phase 6D       |
| Password reset admin            | `admin.setUserPassword()` nécessite session admin          | ✅ Phase 6D       |
| Impersonation traçable          | `auth_session.impersonated_by` = ID admin                  | ✅ Phase 6D       |
| Ban empêche login               | Better Auth session.create hook vérifie `banned`           | ✅ Phase 6D natif |

### 🆕 Protection multi-tenant (V5.3)

| Protection                      | Comment                                                                   | Phase    |
| ------------------------------- | ------------------------------------------------------------------------- | -------- |
| Isolation données via tenant_id | WHERE tenant_id = session.activeOrganizationId sur TOUTES les queries CRM | Phase 6F |
| RLS PostgreSQL (futur)          | Policies `tenant_isolation_*` quand les premiers clients arrivent         | POST-MVP |
| Pas de cross-tenant data leak   | Chaque query filtrée par tenant — pas d'accès global sauf admin reporting | Phase 6F |

---

## SECTION 10 — INFRASTRUCTURE (de V3, inchangé)

| Infrastructure    | Impact       | Détail                                                                                |
| ----------------- | ------------ | ------------------------------------------------------------------------------------- |
| **Supabase**      | ✅ ZÉRO      | RLS policies = PostgreSQL standard, zéro `auth.uid()`                                 |
| **Vercel**        | ⚠️ 3 actions | Env vars Dashboard (✅ Phase 6B), proxy.ts (✅ Phase 3), catch-all route (✅ Phase 1) |
| **Upstash Redis** | ✅ ZÉRO      | Rate limit API préservé. Rate limit auth = Better Auth natif (DB)                     |
| **Sentry**        | ✅ ZÉRO      | Aucun couplage Clerk                                                                  |
| **Stripe**        | ✅ ZÉRO      | Lié à `adm_tenants` via `stripe_customer_id`                                          |
| **Resend**        | ✅ BÉNÉFIQUE | Connexion pour reset password + invitations                                           |

---

## SECTION 11 — ROLLBACK

### ⚠️ RÈGLE CRITIQUE (C44 — de FLEETCORE_PHASE6_ENRICHED_PREREQUISITES.md Section F)

**Faire un SNAPSHOT Supabase AVANT la Phase 6E SQL (premier DROP).**
Après ce point, le rollback git NE SUFFIT PLUS — les données DB sont modifiées de manière IRRÉVERSIBLE.

### Scénarios de rollback

| Situation                       | Action                                                                                                                                                                       | Temps  | Données DB                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------- |
| Phase 6E SQL casse la DB        | **Restaurer snapshot Supabase** (seule option si DROP exécuté)                                                                                                               | 10 min | ⚠️ IRRÉVERSIBLE sans snapshot      |
| Phase 6F code casse le build    | `git checkout` commit post-Phase 6E                                                                                                                                          | 5 min  | DB inchangée                       |
| Phase 6G hooks cassent le login | Supprimer hooks dans lib/auth.ts → login redevient fonctionnel                                                                                                               | 2 min  | DB inchangée                       |
| Phase 6I Settings inutilisable  | Pages isolées dans `/adm/settings/` — supprimer le dossier                                                                                                                   | 5 min  | DB inchangée                       |
| Rollback post-6E (avant DROP)   | `git checkout` + SQL rollback préparé (RE-ADD colonnes)                                                                                                                      | 15 min | Colonnes restaurables              |
| Rollback post-6E (après DROP)   | **⚠️ IRRÉVERSIBLE** — colonnes `clerk_*` et `provider_id` perdues, tables `adm_providers` + `adm_provider_employees` supprimées → **Restaurer snapshot Supabase UNIQUEMENT** | 10 min | Backup restauré                    |
| Rollback total migration        | `git checkout phase6-clerk-purge-complete` — tout post-6D annulé                                                                                                             | 2 min  | Tables auth\_\* restent (harmless) |
| Rollback total (nucléaire)      | `git checkout pre-auth-migration` + DROP 10 tables auth + colonnes auth_user_id                                                                                              | 5 min  | Retour complet état initial        |

### Gate 3 — Checklist post-cleanup (C45 — de FLEETCORE_PHASE6_ENRICHED_PREREQUISITES.md Section E)

**À valider APRÈS tous les DROP (Phase 6E SQL terminée) et AVANT de continuer Phase 6F :**

- [ ] `pnpm tsc --noEmit` → ÉCHEC ATTENDU (code réfère encore provider_id — normal à ce stade)
- [ ] `SELECT column_name FROM information_schema.columns WHERE column_name = 'provider_id' AND table_schema = 'public';` → 0 résultats
- [ ] `SELECT column_name FROM information_schema.columns WHERE column_name LIKE '%clerk%' AND table_schema = 'public';` → 0 résultats
- [ ] `SELECT table_name FROM information_schema.tables WHERE table_name IN ('adm_providers', 'adm_provider_employees') AND table_schema = 'public';` → 0 résultats
- [ ] TOUTES les tables CRM ont tenant*id : `SELECT table_name FROM information_schema.tables t WHERE table_name LIKE 'crm*%' AND table_schema = 'public' AND NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'tenant_id');` → 0 résultats
- [ ] `pnpm prisma generate` → succès
- [ ] Snapshot Supabase EXISTE et est accessible en cas de rollback

---

## SECTION 12 — ÉLÉMENTS REPORTÉS (non bloquants pour le Step 2.3)

| Item                             | Description                                                             | Quand                               |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| Création tenant FleetCore France | auth_organization + adm_tenants "FleetCore France" / "fleetcore-france" | Quand l'activité se développe       |
| Création tenant FleetCore UAE    | auth_organization + adm_tenants "FleetCore UAE" / "fleetcore-uae"       | Quand l'activité se développe       |
| RLS sur tables CRM               | Policies RLS `tenant_isolation_*`                                       | Quand les premiers clients arrivent |
| Reporting consolidé cross-tenant | Page admin dashboard multi-tenant                                       | Quand France/UAE existent           |
| adm_organizations table          | Spec Organisation Layer (hiérarchie, consents)                          | NON NÉCESSAIRE avec modèle plat     |
| teams() Better Auth utilisation  | Activées en Phase 6D mais non utilisées — groupes intra-org optionnels  | Futur optionnel                     |
| adm_invitations table FleetCore  | Table custom invitations — remplacée par auth_invitation native         | Évaluer si à DROP                   |
| P2 Impersonate via Settings      | `admin.impersonateUser()`                                               | POST-MVP (P2)                       |
| P2 Remove user via Settings      | `admin.removeUser()`                                                    | POST-MVP (P2)                       |
| P2 Édition permissions DB-driven | Tables `adm_roles` + `adm_role_permissions`                             | POST-MVP (P2)                       |

---

## SECTION 13 — SUIVI TEMPS RÉEL

### Phases terminées

| Phase | Estimé   | Réel | Écart | Notes                      |
| ----- | -------- | ---- | ----- | -------------------------- |
| 0     | 30 min   | ✅   | —     | Tag pre-auth-migration     |
| 1     | 4-5h     | ✅   | —     | 8 tables + auth_user_id    |
| 2     | 3-4h     | ✅   | —     | Wrappers + is_headquarters |
| 3     | 2-3h     | ✅   | —     | Proxy 351→124 lignes       |
| 4     | 3-4h     | ✅   | —     | 36 consommateurs           |
| 5     | 4.5-5.5h | ✅   | —     | 7 pages + UI               |
| 6A    | 75 min   | ✅   | —     | Cleanup + enrichi          |
| 6B    | 15 min   | ✅   | —     | Env vars CEO               |
| 6C    | 2-3h     | ✅   | —     | databaseHook login         |
| 6D    | 2-3h     | ✅   | —     | admin() + teams()          |

### Phases restantes

| Phase             | Estimé         | Réel | Écart | Notes                          |
| ----------------- | -------------- | ---- | ----- | ------------------------------ |
| 0-WIP             | 15 min         |      |       | Commit WIP Kanban              |
| 6E                | 2-3h           |      |       | Audit DB + Migration Schema    |
| 6F                | 3-4h           |      |       | Migration Code provider→tenant |
| 6G                | 1-2h           |      |       | Invitation Flow                |
| 6H                | 1-2h           |      |       | Architecture Settings (design) |
| 6I                | 6-8h           |      |       | Implémentation Settings        |
| 7                 | 2-3h           |      |       | Validation E2E (31 tests)      |
| 8                 | 1-2h           |      |       | Kanban reconciliation          |
| **TOTAL RESTANT** | **17.5-26.5h** |      |       |                                |

---

**FIN DU DOCUMENT V5.3**

_Document généré le 23 février 2026_
_Remplace V5.2, V4.0 et V3.0 intégralement — ce document est le seul document de référence_
_Intègre 100% du contenu V4 + 100% des sections architecture/config/sécurité/infrastructure de V3_
_Enrichi avec : architecture multi-tenant unifiée (C33-C43), phases 6E-6G + 8 (nouvelles), Phase 7 enrichie (7.22-7.31)_
_Enrichi V5.3 : FLEETCORE_PHASE6_ENRICHED_PREREQUISITES.md intégré (C44-C46 — snapshot Supabase obligatoire, Gate 3 post-cleanup, seed files)_
