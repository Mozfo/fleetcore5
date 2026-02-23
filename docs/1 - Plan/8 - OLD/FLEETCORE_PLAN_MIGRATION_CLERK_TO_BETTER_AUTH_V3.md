# FLEETCORE — PLAN DE MIGRATION CLERK → BETTER AUTH

## VERSION 3.0 — 21 Février 2026

> **Objectif :** Supprimer la dépendance Clerk (SaaS externe) et la remplacer par Better Auth (library TypeScript, données 100% dans PostgreSQL FleetCore)
> **Risque :** MOYEN — Rollback possible en 30 secondes via tag git
> **Clerk a 0 users réels** — Zéro donnée production à migrer, uniquement du code à remplacer

---

## CHANGELOG V2 → V3

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

---

## SECTION 1 — AUDIT FACTUEL INTÉGRÉ (Q1-Q10)

### 1.1 Empreinte Clerk — résumé validé

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

### 1.2 Colonnes DB Clerk — état complet

#### Dans le Prisma schema actif (CONFIRMÉ par grep E)

| Table                    | Colonne                 | Type                  | Contraintes                                                                         | Statut           |
| ------------------------ | ----------------------- | --------------------- | ----------------------------------------------------------------------------------- | ---------------- |
| `adm_provider_employees` | `clerk_user_id`         | VARCHAR(255) NOT NULL | (aucun index/unique visible dans grep — **Claude Code doit vérifier en DB**)        | Active dans code |
| `clt_members`            | `clerk_user_id`         | VARCHAR(255) NOT NULL | `@@index([clerk_user_id])`                                                          | Active dans code |
| `adm_tenants`            | `clerk_organization_id` | String? nullable      | `@unique(map: "adm_tenants_clerk_org_unique")` + `@@index([clerk_organization_id])` | Active dans code |

#### Probablement en DB mais PAS dans le Prisma schema actif (DISCREPANCE)

| Table            | Colonne                 | Source de l'info                                                                                                                                 | Statut                                                 |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `adm_members`    | `clerk_user_id`         | SUPABASE_SCHEMA_REFERENCE (projet knowledge) montre cette colonne + index `adm_members_clerk_user_id_idx` + unique `adm_members_tenant_clerk_uq` | Orpheline — pas dans Prisma = pas utilisée par le code |
| `adm_audit_logs` | `performed_by_clerk_id` | SUPABASE_SCHEMA_REFERENCE (projet knowledge)                                                                                                     | Orpheline — pas dans Prisma = pas utilisée par le code |

**⚠️ ACTION REQUISE PHASE 1 :** Claude Code DOIT vérifier ces colonnes dans la DB réelle :

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('adm_members', 'adm_audit_logs')
AND column_name LIKE '%clerk%';
```

### 1.3 Fichiers code — inventaire final

| Catégorie                                                          | Nombre           | Complexité                                 | Source Q |
| ------------------------------------------------------------------ | ---------------- | ------------------------------------------ | -------- |
| Server actions + API routes + server components (pattern `auth()`) | ~36              | Mécanique (même remplacement d'import)     | Q4, Q10  |
| Auth pages                                                         | **7**            | Moyen à élevé (hooks spécifiques par page) | Q7       |
| UI components (UserButton ×4, ClerkProvider ×1)                    | 5                | Moyen                                      | Q1, Q10  |
| Refine provider                                                    | 1                | Moyen (3 hooks)                            | Q6       |
| Middleware                                                         | 1                | Élevé (351 lignes → 30-40 lignes proxy)    | Q10      |
| Clerk services + helpers + utils                                   | 4                | **SUPPRIMÉS**                              | Q10      |
| Webhook                                                            | 1                | **SUPPRIMÉ** (362 lignes)                  | Q10      |
| Tests                                                              | 6                | Moyen (mocks à changer)                    | —        |
| **TOTAL**                                                          | **~62 fichiers** |                                            |          |

---

## SECTION 2 — ARCHITECTURE CIBLE

### 2.1 Principe : IDs partagés, zéro synchronisation

```
AVANT (Clerk)                          APRÈS (Better Auth)
─────────────────                      ─────────────────────
Clerk Cloud (externe)                  PostgreSQL FleetCore (local)
  ↕ Webhook 362 lignes                   ↓ Même base, même transaction
  ↕ API calls (latence réseau)           ↓ Zéro webhook
  ↕ clerk_organization_id mapping        ↓ ID partagé directement
  ↕ 9 env vars                           ↓ 2 env vars
```

### 2.2 Mapping tables

```
Better Auth (auth)              FleetCore (business)
──────────────────              ──────────────────────
user                            adm_provider_employees + clt_members
  id (TEXT/UUID) ◄──────────── auth_user_id (FK directe)
  name, email, image
  emailVerified
  createdAt, updatedAt

session                         (géré par Better Auth)
  id, token, expiresAt
  userId → user.id
  activeOrganizationId ◄─────── = le tenant actif de la session
  ipAddress, userAgent

account                         (géré par Better Auth — login methods)
  id, providerId, accountId
  userId → user.id
  password (hashed scrypt)

verification                    (géré par Better Auth — tokens temporaires)
  id, identifier, value
  expiresAt

organization                    adm_tenants
  id (TEXT/UUID) ═══════════════ id (MÊME UUID)
  name, slug, logo, metadata    + 30 colonnes business

member                          (géré par Better Auth — membership org)
  id, organizationId, userId
  role, createdAt

invitation                      (géré par Better Auth — invitations)
  id, organizationId, email
  role, status, expiresAt

rateLimit                       (géré par Better Auth — anti brute force)
  id, key, count, lastRequest
```

### 2.3 Identification "siège" FleetCore (C17 — ex-FLEETCORE_ADMIN_ORG_ID)

```
AVANT :
  env var FLEETCORE_ADMIN_ORG_ID = "org_33cBkAws..." (ID Clerk)
  → code compare session.orgId avec cette variable
  → si match → utilisateur du siège

APRÈS :
  adm_providers WHERE is_headquarters = true → provider_id du siège
  → wrapper requireCrmAuth() fait un lookup DB
  → plus d'env var à configurer/oublier
  → fonctionne automatiquement pour tout déploiement
```

### 2.4 Flow invitation multi-tenant (C15 — redesigné)

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
```

### 2.5 Ce qui DISPARAÎT (total ~700+ lignes de code + 9 env vars)

| Élément                                                | Lignes | Pourquoi                        |
| ------------------------------------------------------ | ------ | ------------------------------- |
| Webhook Clerk (`app/api/webhooks/clerk/`)              | 362    | Better Auth = même DB           |
| `clerk.service.ts`                                     | ~150   | → `auth.api.*()`                |
| `clerk-uuid-mapper.ts`                                 | ~50    | UUIDs PostgreSQL natifs         |
| `clerk-helpers.ts`                                     | ~80    | → wrapper `lib/auth/server.ts`  |
| `clerk-test-auth.ts`                                   | ~60    | → mock Better Auth              |
| `ClerkProvider` (layout.tsx)                           | ~5     | Better Auth = pas de Provider   |
| `<SignUp>` (accept-invitation)                         | ~20    | → formulaire register custom    |
| `UserButton` ×4                                        | ~40    | → composant `<UserMenu>` custom |
| 9 env vars Clerk                                       | —      | → 2 env vars Better Auth        |
| `FLEETCORE_ADMIN_ORG_ID` env var                       | —      | → lookup DB `is_headquarters`   |
| Packages `@clerk/nextjs`, `@clerk/backend`, `svix`     | —      | → `better-auth`                 |
| Colonnes `clerk_*` (3 tables Prisma + 2 DB orphelines) | —      | → `auth_user_id`                |

### 2.6 Ce qui APPARAÎT

| Élément                                 | Rôle                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| `lib/auth.ts`                           | Config Better Auth serveur complète                                               |
| `lib/auth-client.ts`                    | Client Better Auth (hooks React)                                                  |
| `app/api/auth/[...all]/route.ts`        | Catch-all route handler                                                           |
| `lib/auth/server.ts`                    | **Wrapper serveur** — getSession, requireAuth, requireCrmAuth, getProviderContext |
| `lib/auth/client.ts`                    | **Wrapper client** — useUser, useAuth, useActiveOrganization                      |
| `proxy.ts`                              | Proxy Next.js 16 (~30 lignes, cookie check)                                       |
| 8 tables Better Auth                    | user, session, account, verification, organization, member, invitation, rateLimit |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | 2 env vars                                                                        |

---

## SECTION 3 — CONFIG BETTER AUTH

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
| `organization.sendInvitationEmail`                     | Callback Resend                                                              | Organization docs        | Invitations (C7)                           |
| `organization.organizationHooks.afterAcceptInvitation` | Callback → setup membre                                                      | Organization docs        | Post-invitation (C15)                      |
| `hooks.after` (middleware)                             | Auto-accept invitation après signup                                          | Community pattern        | Signup + invitation en un flow (C15)       |
| `nextCookies()`                                        | **TOUJOURS DERNIER plugin**                                                  | Next.js docs Better Auth | Obligation technique                       |

### 3.2 Tables SQL — 8 tables Better Auth

| #   | Table          | Colonnes clés                                                                                | @@map                   |
| --- | -------------- | -------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | `user`         | id, name, email, emailVerified, image, createdAt, updatedAt                                  | `@@map("user")`         |
| 2   | `session`      | id, expiresAt, token, ipAddress, userAgent, userId, **activeOrganizationId**                 | `@@map("session")`      |
| 3   | `account`      | id, accountId, providerId, userId, password, accessToken, refreshToken, createdAt, updatedAt | `@@map("account")`      |
| 4   | `verification` | id, identifier, value, expiresAt, createdAt, updatedAt                                       | `@@map("verification")` |
| 5   | `organization` | id, name, slug, logo, createdAt, metadata                                                    | `@@map("organization")` |
| 6   | `member`       | id, organizationId, userId, role, createdAt                                                  | `@@map("member")`       |
| 7   | `invitation`   | id, organizationId, email, role, status, expiresAt, inviterId                                | `@@map("invitation")`   |
| 8   | `rateLimit`    | id, key, count, lastRequest                                                                  | `@@map("rateLimit")`    |

---

## SECTION 4 — PLAN D'EXÉCUTION — 7 PHASES

### PHASE 0 — Sécuriser l'état actuel

**Durée estimée : 30 min**

| #   | Tâche                                                             | Vérification            | Temps  |
| --- | ----------------------------------------------------------------- | ----------------------- | ------ |
| 0.1 | `git status`                                                      | Liste fichiers modifiés | 2 min  |
| 0.2 | `git stash push -m "kanban-wip-pre-auth-migration"` si nécessaire | `git stash list`        | 2 min  |
| 0.3 | `git tag pre-auth-migration`                                      | `git tag -l`            | 1 min  |
| 0.4 | `pnpm tsc --noEmit`                                               | 0 erreurs               | 5 min  |
| 0.5 | `pnpm build`                                                      | Build success           | 10 min |
| 0.6 | Documenter résultats                                              | Fichier texte           | 5 min  |

**Livrable :** Rollback → `git checkout pre-auth-migration`

---

### PHASE 1 — Foundation Better Auth + colonnes transitoires

**Durée estimée : 4-5h**

**⚠️ RÈGLE : Clerk reste installé et fonctionnel. On ne le supprime qu'en Phase 6.**

| #                               | Tâche                                           | Détail                                                                                                                                                                                                                                          | Temps  |
| ------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **Installation**                |                                                 |                                                                                                                                                                                                                                                 |        |
| 1.1                             | `pnpm add better-auth`                          | Vérifier version dans package.json                                                                                                                                                                                                              | 5 min  |
| 1.2                             | Env vars `.env.local`                           | `BETTER_AUTH_SECRET` (openssl rand -base64 32) + `BETTER_AUTH_URL=http://localhost:3000`. **NE PAS toucher les vars Clerk**                                                                                                                     | 5 min  |
| **Config serveur**              |                                                 |                                                                                                                                                                                                                                                 |        |
| 1.3                             | Créer `lib/auth.ts`                             | Config COMPLÈTE selon Section 3.1 : prismaAdapter, emailAndPassword, trustedOrigins, rateLimit, databaseHooks, organization + sendInvitationEmail, hooks.after (auto-accept invitation), nextCookies() DERNIER. Singleton PrismaClient existant | 45 min |
| 1.4                             | Créer `app/api/auth/[...all]/route.ts`          | `toNextJsHandler(auth)`                                                                                                                                                                                                                         | 10 min |
| 1.5                             | Créer `lib/auth-client.ts`                      | `createAuthClient` + `organizationClient()`                                                                                                                                                                                                     | 10 min |
| **Schema DB**                   |                                                 |                                                                                                                                                                                                                                                 |        |
| 1.6                             | Vérifier colonnes orphelines DB                 | `SELECT column_name FROM information_schema.columns WHERE table_name IN ('adm_members', 'adm_audit_logs') AND column_name LIKE '%clerk%';` (C18)                                                                                                | 5 min  |
| 1.7                             | Générer schema Better Auth                      | `npx @better-auth/cli generate` dans un dossier temporaire → extraire les 8 models → intégrer manuellement dans `prisma/schema.prisma` avec `@@map()`                                                                                           | 60 min |
| 1.8                             | Créer les 8 tables en DB                        | SQL manuel dans Supabase. 8 tables : user, session, account, verification, organization, member, invitation, rateLimit. Inclure RLS enable + temp policies                                                                                      | 45 min |
| **Colonnes transitoires** (C16) |                                                 |                                                                                                                                                                                                                                                 |        |
| 1.9                             | ADD `auth_user_id` sur `adm_provider_employees` | `ALTER TABLE adm_provider_employees ADD COLUMN auth_user_id TEXT REFERENCES "user"(id);` — NULLABLE car transitoire                                                                                                                             | 5 min  |
| 1.10                            | ADD `auth_user_id` sur `clt_members`            | `ALTER TABLE clt_members ADD COLUMN auth_user_id TEXT REFERENCES "user"(id);`                                                                                                                                                                   | 5 min  |
| **Prisma sync**                 |                                                 |                                                                                                                                                                                                                                                 |        |
| 1.11                            | Mettre à jour `prisma/schema.prisma`            | Ajouter `auth_user_id` dans les models `adm_provider_employees` et `clt_members`                                                                                                                                                                | 15 min |
| 1.12                            | `pnpm prisma generate`                          | 101 + 8 = 109 tables (ou 101+8+colonnes) compilent                                                                                                                                                                                              | 10 min |
| 1.13                            | Vérifier coexistence                            | `pnpm tsc --noEmit` + app fonctionne toujours avec Clerk                                                                                                                                                                                        | 10 min |

**Vérification Phase 1 :**

- [ ] 8 tables Better Auth existent dans Supabase
- [ ] `auth_user_id` existe sur `adm_provider_employees` et `clt_members`
- [ ] `pnpm prisma generate` OK
- [ ] `pnpm tsc --noEmit` → 0 erreurs
- [ ] App fonctionne toujours (Clerk actif)
- [ ] `curl http://localhost:3000/api/auth/ok` → réponse Better Auth

---

### PHASE 2 — Couche d'abstraction auth (wrappers)

**Durée estimée : 3-4h**

**⚡ PHASE LA PLUS CRITIQUE — Architecture clé.**

| #   | Tâche                      | Détail                                                                                    | Temps  |
| --- | -------------------------- | ----------------------------------------------------------------------------------------- | ------ |
| 2.1 | Créer `lib/auth/server.ts` | Wrapper serveur complet (ci-dessous)                                                      | 90 min |
| 2.2 | Créer `lib/auth/client.ts` | Wrapper client complet (ci-dessous)                                                       | 60 min |
| 2.3 | Tests unitaires            | Mock Better Auth, vérifier types, tester `requireCrmAuth()` avec lookup `is_headquarters` | 30 min |

**`lib/auth/server.ts` — Fonctions wrapper :**

| Fonction               | Remplace (Clerk)                                    | Logique                                                                                            | Occurrences          |
| ---------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------- |
| `getSession()`         | `auth()` de `@clerk/nextjs/server`                  | `auth.api.getSession({ headers: await headers() })`                                                | ~22 fichiers         |
| `requireAuth()`        | `auth()` + throw si null                            | `getSession()` + throw UnauthorizedError                                                           | Server components    |
| `requireCrmAuth()`     | `auth()` + check `orgId === FLEETCORE_ADMIN_ORG_ID` | `requireAuth()` + lookup `adm_providers WHERE is_headquarters = true` (C17) — **plus de env var**  | 10 server actions    |
| `getCurrentUser()`     | `currentUser()` de `@clerk/nextjs/server`           | `getSession().user`                                                                                | 5 fichiers           |
| `getProviderContext()` | `getProviderFilter()` dans `provider-context.ts`    | Lookup `adm_provider_employees WHERE auth_user_id = session.user.id` → provider_id → filtre Prisma | Server actions + API |

**`lib/auth/client.ts` — Hooks wrapper :**

| Hook                      | Remplace (Clerk)                           | Source Q | Fichiers        |
| ------------------------- | ------------------------------------------ | -------- | --------------- |
| `useUser()`               | `useUser()` de `@clerk/nextjs`             | Q6, Q10  | 5               |
| `useAuth()`               | `useAuth()` de `@clerk/nextjs`             | Q6       | 2               |
| `useActiveOrganization()` | `useOrganization()` de `@clerk/nextjs`     | Q6       | 2               |
| `useListOrganizations()`  | `useOrganizationList()` de `@clerk/nextjs` | Q10      | 2               |
| `useSignOut()`            | `signOut()` de `useAuth()`                 | Q6       | Refine provider |

**Vérification Phase 2 :**

- [ ] `pnpm tsc --noEmit` → 0 erreurs
- [ ] Types TypeScript stricts corrects
- [ ] Tests unitaires passent
- [ ] `requireCrmAuth()` résout `is_headquarters` sans env var

---

### PHASE 3 — Proxy Next.js 16

**Durée estimée : 2-3h**

| #   | Tâche                                 | Détail                                                                                                      | Temps                   |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------ | ------ |
| 3.1 | Créer `proxy.ts`                      | Cookie check `better-auth.session_token`. Redirect `/sign-in` si absent. Matchers : `["/adm/:path\*", "/(en | fr)/crm/:path\*", "/(en | fr)/dashboard/:path*", "/api/v1/:path*"]`. **ZÉRO query DB (Edge safe)** | 45 min |
| 3.2 | `requireAuth()` dans layouts          | Ajouter dans chaque layout/page protégé(e) — VRAIE protection DB                                            | 60 min                  |
| 3.3 | Renommer `middleware.ts` → `proxy.ts` | Vérifier qu'aucune logique autre que auth n'est perdue (i18n routing ?)                                     | 15 min                  |
| 3.4 | Rate limiting API                     | Better Auth gère le rate limit auth natif. Le rate limit API Upstash existant doit être préservé            | 30 min                  |

**Vérification Phase 3 :**

- [ ] Routes publiques accessibles
- [ ] Routes protégées → redirect `/sign-in`
- [ ] API sans session → 401
- [ ] 6ème tentative login → 429

---

### PHASE 4 — Migration mécanique serveur

**Durée estimée : 3-4h**

| #   | Tâche                 | Fichiers | Pattern                                                                                                                                                                          | Temps  |
| --- | --------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 4.1 | `provider-context.ts` | 1        | `import { auth } from "@clerk/nextjs/server"` → `import { getSession } from "@/lib/auth/server"`. **Changer `clerk_user_id` → `auth_user_id`** dans le findFirst (ligne 80, 112) | 30 min |
| 4.2 | 10 server actions CRM | 10       | `auth()` → `requireCrmAuth()`                                                                                                                                                    | 60 min |
| 4.3 | 12 API routes         | 12       | `auth()` → `getSession()` ou `requireAuth()`                                                                                                                                     | 45 min |
| 4.4 | 14 server components  | 14       | `auth()` → `getSession()`, `currentUser()` → `getCurrentUser()`                                                                                                                  | 45 min |

**Vérification Phase 4 :**

- [ ] `pnpm tsc --noEmit` → 0 erreurs
- [ ] `grep -r "@clerk/nextjs/server" --include="*.ts" --include="*.tsx" src/ lib/` → 0 résultats
- [ ] Résidus `@clerk/` UNIQUEMENT dans fichiers Phase 5

---

### PHASE 5 — Pages auth + composants UI

**Durée estimée : 4.5-5.5h**

| #    | Tâche                         | Hooks Clerk à remplacer (Q7)                                                                                                                                                                           | Temps  |
| ---- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 5.1  | `login/page.tsx`              | `useSignIn`, `useSession` → `authClient.signIn.email()`                                                                                                                                                | 30 min |
| 5.2  | `register/page.tsx`           | `useSignUp` → `authClient.signUp.email()`. Gérer param `?email=xxx&invitation=xxx` pour le flow invitation (C15)                                                                                       | 40 min |
| 5.3  | `forgot-password/page.tsx`    | `useSignIn` (reset flow) → `authClient.forgetPassword()`                                                                                                                                               | 20 min |
| 5.4  | `reset-password/page.tsx`     | `useSignIn` (attemptFirstFactor) → `authClient.resetPassword()`                                                                                                                                        | 20 min |
| 5.5  | `select-org/page.tsx`         | `useOrganizationList`, `useAuth` → `authClient.organization.listOrganizations()` + `setActive()`                                                                                                       | 30 min |
| 5.6  | `accept-invitation/page.tsx`  | **REDESIGN COMPLET (C15)** : supprimer `<SignUp>` Clerk. Si connecté → boutons Accept/Reject. Si pas connecté → redirect register avec email pré-rempli. Le hook auto-accept (Phase 1.3) gère le reste | 45 min |
| 5.7  | `login/tasks/page.tsx` (C13)  | `useOrganizationList`, `useClerk` → wrappers client                                                                                                                                                    | 30 min |
| 5.8  | Supprimer `ClerkProvider`     | `app/layout.tsx:65` (Q1) — simple suppression, AUCUN prop custom                                                                                                                                       | 10 min |
| 5.9  | Remplacer `UserButton` ×4     | Composant `<UserMenu>` custom : `useUser()` + `signOut()` + avatar. Base : shadcnuikit                                                                                                                 | 45 min |
| 5.10 | Adapter `refine-provider.tsx` | 3 hooks (Q6) : `useUser` → wrapper, `useAuth` → wrapper, `useOrganization` → wrapper. authProvider + accessControlProvider inchangés en structure                                                      | 30 min |
| 5.11 | Créer `auth.service.ts`       | Remplace `clerk.service.ts`. `createOrganization`, `inviteMember`, etc. `syncPublicMetadata` → **SUPPRIMÉ**                                                                                            | 30 min |

**Vérification Phase 5 :**

- [ ] Login → session créée en table `session`
- [ ] Register → user + account créés
- [ ] Forgot password → email Resend reçu, token en table `verification`
- [ ] Accept invitation → membership créée après signup
- [ ] UserMenu affiche nom + avatar
- [ ] `grep -r "@clerk/" --include="*.ts" --include="*.tsx" src/ lib/ app/ | grep -v node_modules` → 0 résultats

---

### PHASE 6 — DB schema final + nettoyage total

**Durée estimée : 4-5h**

**⚠️ UNIQUEMENT après validation Phases 3+4+5.**

| #                                            | Tâche                                                            | Détail                                                                                                                                                                                                                                                                                                                        | Temps                |
| -------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------- | -------------------------------------- | ------ |
| **Nettoyage DB — colonnes Prisma**           |                                                                  |                                                                                                                                                                                                                                                                                                                               |                      |
| 6.1                                          | DROP contraintes `adm_tenants`                                   | `ALTER TABLE adm_tenants DROP CONSTRAINT IF EXISTS adm_tenants_clerk_org_unique;` `DROP INDEX IF EXISTS idx_adm_tenants_clerk_organization_id;` (C19)                                                                                                                                                                         | 5 min                |
| 6.2                                          | DROP colonne `adm_tenants`                                       | `ALTER TABLE adm_tenants DROP COLUMN clerk_organization_id;`                                                                                                                                                                                                                                                                  | 5 min                |
| 6.3                                          | DROP index `clt_members`                                         | `DROP INDEX IF EXISTS idx_clt_members_clerk_user_id;` (nom exact à vérifier)                                                                                                                                                                                                                                                  | 5 min                |
| 6.4                                          | DROP colonne `clt_members`                                       | `ALTER TABLE clt_members DROP COLUMN clerk_user_id;`                                                                                                                                                                                                                                                                          | 5 min                |
| 6.5                                          | DROP colonne `adm_provider_employees`                            | `ALTER TABLE adm_provider_employees DROP COLUMN clerk_user_id;`                                                                                                                                                                                                                                                               | 5 min                |
| **Nettoyage DB — colonnes orphelines (C18)** |                                                                  |                                                                                                                                                                                                                                                                                                                               |                      |
| 6.6                                          | DROP colonnes `adm_members` (si existent en DB)                  | `ALTER TABLE adm_members DROP COLUMN IF EXISTS clerk_user_id;` + `DROP INDEX IF EXISTS adm_members_clerk_user_id_idx;` + `ALTER TABLE adm_members DROP CONSTRAINT IF EXISTS adm_members_tenant_clerk_uq;`                                                                                                                     | 10 min               |
| 6.7                                          | DROP colonne `adm_audit_logs` (si existe en DB)                  | `ALTER TABLE adm_audit_logs DROP COLUMN IF EXISTS performed_by_clerk_id;`                                                                                                                                                                                                                                                     | 5 min                |
| **Nouveaux index**                           |                                                                  |                                                                                                                                                                                                                                                                                                                               |                      |
| 6.8                                          | ADD contraintes `auth_user_id`                                   | `CREATE UNIQUE INDEX adm_provider_employees_auth_user_id_key ON adm_provider_employees(auth_user_id);` + `CREATE INDEX clt_members_auth_user_id_idx ON clt_members(auth_user_id);`                                                                                                                                            | 5 min                |
| **Prisma sync**                              |                                                                  |                                                                                                                                                                                                                                                                                                                               |                      |
| 6.9                                          | Mettre à jour `prisma/schema.prisma`                             | Supprimer colonnes `clerk_*`, confirmer `auth_user_id`                                                                                                                                                                                                                                                                        | 30 min               |
| 6.10                                         | `pnpm prisma generate`                                           | OK                                                                                                                                                                                                                                                                                                                            | 5 min                |
| **Seeds**                                    |                                                                  |                                                                                                                                                                                                                                                                                                                               |                      |
| 6.11                                         | Mettre à jour seeds                                              | Créer user Better Auth dans seeds au lieu de `clerk_user_id` placeholder                                                                                                                                                                                                                                                      | 30 min               |
| **Suppression packages**                     |                                                                  |                                                                                                                                                                                                                                                                                                                               |                      |
| 6.12                                         | `pnpm remove @clerk/nextjs @clerk/backend svix`                  | Vérifier package.json                                                                                                                                                                                                                                                                                                         | 5 min                |
| **Suppression fichiers**                     |                                                                  |                                                                                                                                                                                                                                                                                                                               |                      |
| 6.13                                         | Supprimer fichiers Clerk                                         | `rm -rf app/api/webhooks/clerk/` + `rm -rf lib/services/clerk/` + `rm lib/utils/clerk-uuid-mapper.ts` + `rm lib/auth/clerk-helpers.ts` + `rm lib/testing/clerk-test-auth.ts`                                                                                                                                                  | 10 min               |
| **Env vars**                                 |                                                                  |                                                                                                                                                                                                                                                                                                                               |                      |
| 6.14                                         | Supprimer 9 vars Clerk de `.env.local`                           | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`, `FLEETCORE_ADMIN_ORG_ID`, `NEXT_PUBLIC_FLEETCORE_ADMIN_ORG_ID` (C14) | 5 min                |
| 6.15                                         | Supprimer vars Clerk de `.env.test` et `.env.test.example` (C14) | Mêmes variables                                                                                                                                                                                                                                                                                                               | 5 min                |
| 6.16                                         | Supprimer vars Clerk de **Vercel Dashboard** (C5)                | Project Settings > Environment Variables. Supprimer 9 vars Clerk. Ajouter `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` pour Preview + Production + Development                                                                                                                                                                    | 15 min               |
| **Tests**                                    |                                                                  |                                                                                                                                                                                                                                                                                                                               |                      |
| 6.17                                         | Adapter 6 fichiers de test                                       | Mock `auth()` Clerk → mock `getSession()` wrapper                                                                                                                                                                                                                                                                             | 45 min               |
| **Grep final**                               |                                                                  |                                                                                                                                                                                                                                                                                                                               |                      |
| 6.18                                         | Grep exhaustif                                                   | `grep -rn "clerk\|Clerk\|CLERK" --include="_.ts" --include="_.tsx" --include="_.env_" --include="_.config._"                                                                                                                                                                                                                  | grep -v node_modules | grep -v ".md" | grep -v ".backup"` → fixer TOUT résidu | 30 min |

**Vérification Phase 6 :**

- [ ] `pnpm tsc --noEmit` → 0 erreurs
- [ ] `pnpm build` → succès
- [ ] `pnpm test` → 0 échecs
- [ ] Grep `clerk` → 0 résultats (hors .md/.backup)
- [ ] `@clerk/` absent de `package.json`
- [ ] `svix` absent de `package.json`
- [ ] Vercel Dashboard ne contient plus de vars Clerk
- [ ] DB ne contient plus de colonnes `clerk_*` :
  ```sql
  SELECT table_name, column_name FROM information_schema.columns
  WHERE column_name LIKE '%clerk%' AND table_schema = 'public';
  ```
  → 0 résultats

---

### PHASE 7 — Validation complète

**Durée estimée : 2-3h**

| #    | Test                                          | Résultat attendu                                                           | Temps  |
| ---- | --------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| 7.1  | Login email/password                          | Session en table `session`, redirect dashboard                             | 5 min  |
| 7.2  | Register nouveau compte                       | User + account créés                                                       | 5 min  |
| 7.3  | Forgot password                               | Email Resend reçu, token en `verification`                                 | 10 min |
| 7.4  | Reset password                                | Password changé, token invalidé                                            | 5 min  |
| 7.5  | Route protégée sans session                   | Redirect `/sign-in`                                                        | 2 min  |
| 7.6  | API protégée sans session                     | 401                                                                        | 2 min  |
| 7.7  | Brute force                                   | 6ème login → 429                                                           | 5 min  |
| 7.8  | CRM leads visibles                            | DataTable + provider isolation OK                                          | 5 min  |
| 7.9  | Kanban drag & drop                            | Lead change de colonne                                                     | 5 min  |
| 7.10 | Création lead                                 | `provider_id` correct                                                      | 5 min  |
| 7.11 | Provider isolation                            | Admin voit tout, employé sa division                                       | 10 min |
| 7.12 | Déconnexion                                   | Session supprimée de la table                                              | 2 min  |
| 7.13 | Switch organisation                           | `activeOrganizationId` change en DB                                        | 5 min  |
| 7.14 | Audit log login                               | `adm_audit_logs` contient entry LOGIN (C4)                                 | 5 min  |
| 7.15 | Flow invitation complet                       | Créer invitation → email → register → auto-accept → membre actif (C15)     | 15 min |
| 7.16 | `pnpm build` final                            | Succès                                                                     | 10 min |
| 7.17 | `pnpm test` final                             | 0 échecs                                                                   | 10 min |
| 7.18 | `SELECT ... WHERE column_name LIKE '%clerk%'` | 0 résultats en DB                                                          | 2 min  |
| 7.19 | Git commit + tag                              | `feat: migrate auth from Clerk to Better Auth` + tag `post-auth-migration` | 5 min  |
| 7.20 | Récupérer Kanban WIP                          | `git stash pop`, résoudre conflits, `pnpm tsc --noEmit`                    | 30 min |

---

## SECTION 5 — ESTIMATION CONSOLIDÉE

| Phase | Description                                  | Estimation V3 | Complexité    |
| ----- | -------------------------------------------- | ------------- | ------------- |
| 0     | Sécuriser l'état actuel                      | **30 min**    | Triviale      |
| 1     | Foundation + colonnes transitoires (C16)     | **4-5h**      | Moyenne-haute |
| 2     | Wrappers auth + is_headquarters (C17)        | **3-4h**      | Élevée        |
| 3     | Proxy Next.js 16                             | **2-3h**      | Moyenne       |
| 4     | Migration serveur mécanique                  | **3-4h**      | Basse         |
| 5     | Pages auth (7 pages) + UI + invitation (C15) | **4.5-5.5h**  | Moyenne-haute |
| 6     | DB cleanup + nettoyage total (C18, C19)      | **4-5h**      | Moyenne       |
| 7     | Validation complète (+ invitation E2E)       | **2.5-3.5h**  | Basse         |
|       | **SOUS-TOTAL DEV**                           | **24-30.5h**  |               |
|       | **Buffer debug/imprévus (30%)**              | **7-9h**      |               |
|       | **TOTAL**                                    | **31-39.5h**  |               |
|       | **EN JOURS (8h/jour)**                       | **4-5 jours** |               |

---

## SECTION 6 — ORDRE D'EXÉCUTION

```
Phase 0 (30 min) — Sécuriser
    ↓
Phase 1 (4-5h) — Better Auth + 8 tables + auth_user_id colonnes
    ↓
Phase 2 (3-4h) — Wrappers ⚡ CRITIQUE
    ↓
┌──────────────────────────────────────────────┐
│ Phase 3 (2-3h) │ Phase 4 (3-4h) │ Phase 5 (4.5-5.5h) │
│    Proxy        │    Serveur      │    Pages + UI       │
│ (indépendantes entre elles, toutes dépendent de Phase 2) │
└──────────────────────────────────────────────┘
    ↓ (toutes 3 validées)
Phase 6 (4-5h) — Cleanup DB + code + env
    ↓
Phase 7 (2.5-3.5h) — Validation E2E
```

---

## SECTION 7 — PROBLÈMES ANTICIPÉS

| #   | Problème                                   | Probabilité | Impact   | Mitigation                                                                                                                      |
| --- | ------------------------------------------ | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Duplication organization / adm_tenants** | HAUTE       | Moyen    | Accepté : `organization` = auth only (name, slug). `adm_tenants` = source de vérité business. Sync name/slug à la création      |
| P2  | **activeOrganizationId vs provider_id**    | HAUTE       | Élevé    | `getProviderContext()` résout : session.activeOrgId → lookup provider via `adm_providers`                                       |
| P3  | **Prisma naming camelCase vs snake_case**  | MOYENNE     | Moyen    | `@@map()` sur chaque model Better Auth                                                                                          |
| P4  | **Cookie name proxy**                      | MOYENNE     | Élevé    | Utiliser `getSessionCookie()` helper Better Auth, pas de hardcode                                                               |
| P5  | **Vercel Edge**                            | HAUTE       | Critique | Proxy = ZÉRO query DB (cookie check only). Validation DB dans `requireAuth()` côté Node.js                                      |
| P6  | **Auto-accept invitation après signup**    | HAUTE       | Élevé    | Hook `after` dans auth config. Vérifié dans community : pattern fonctionnel (source : AnswerOverflow) mais nécessite tests E2E  |
| P7  | **clt_members 59 rows dummy**              | BASSE       | Faible   | Les 4 rows réelles à migrer manuellement (UPDATE clt_members SET auth_user_id = ... WHERE email = ...) avant DROP clerk_user_id |
| P8  | **Resend email templates**                 | MOYENNE     | Moyen    | 2 templates à créer : reset password + invitation. Better Auth fournit `user`, `url`, `token`                                   |

---

## SECTION 8 — IMPACTS INFRASTRUCTURE (inchangé depuis V2)

| Infrastructure    | Impact       | Détail                                                                        |
| ----------------- | ------------ | ----------------------------------------------------------------------------- |
| **Supabase**      | ✅ ZÉRO      | 47 RLS policies = PostgreSQL standard, zéro `auth.uid()`                      |
| **Vercel**        | ⚠️ 3 actions | Env vars Dashboard (Phase 6.16), proxy.ts (natif), catch-all route (standard) |
| **Upstash Redis** | ✅ ZÉRO      | Rate limit API préservé. Rate limit auth = Better Auth natif (DB)             |
| **Sentry**        | ✅ ZÉRO      | Aucun couplage Clerk (Q2 confirmé)                                            |
| **Stripe**        | ✅ ZÉRO      | Lié à `adm_tenants` via `stripe_customer_id`                                  |
| **Resend**        | ✅ BÉNÉFIQUE | Connexion pour reset password + invitations (C7)                              |

---

## SECTION 9 — SÉCURITÉ (inchangé depuis V2)

| Protection         | Clerk     | Better Auth                           | Vérifié                                                                 |
| ------------------ | --------- | ------------------------------------- | ----------------------------------------------------------------------- |
| httpOnly cookies   | ✅        | ✅ natif                              | [Security docs](https://www.better-auth.com/docs/reference/security)    |
| CSRF               | ✅        | ✅ Origin + Fetch Metadata + SameSite | [Security docs](https://www.better-auth.com/docs/reference/security)    |
| Password hashing   | ✅ bcrypt | ✅ scrypt (plus résistant)            | [Security docs](https://www.better-auth.com/docs/reference/security)    |
| Brute force        | ✅        | ✅ 5 login/min, 3 register/min (C3)   | [Rate limit docs](https://www.better-auth.com/docs/concepts/rate-limit) |
| Session revocation | ✅        | ✅ `revokeSession()`                  | [Security docs](https://www.better-auth.com/docs/reference/security)    |
| IP tracking        | ✅        | ✅ ipAddress + userAgent en DB        | [Security docs](https://www.better-auth.com/docs/reference/security)    |
| Audit login        | ✅        | ✅ Hook → adm_audit_logs (C4)         | Config custom                                                           |

---

## SECTION 10 — ROLLBACK

| Situation                        | Action                                                                                                                               | Temps  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Migration tourne mal             | `git checkout pre-auth-migration`                                                                                                    | 30 sec |
| Récupérer Kanban WIP             | `git stash pop`                                                                                                                      | 2 min  |
| Tables Better Auth à supprimer   | `DROP TABLE IF EXISTS "rateLimit", invitation, member, organization, verification, account, session, "user" CASCADE;`                | 5 min  |
| Colonnes `auth_user_id` ajoutées | `ALTER TABLE adm_provider_employees DROP COLUMN IF EXISTS auth_user_id; ALTER TABLE clt_members DROP COLUMN IF EXISTS auth_user_id;` | 2 min  |
| Vercel env vars                  | Remettre Clerk, supprimer Better Auth                                                                                                | 5 min  |

---

## SECTION 11 — SUIVI TEMPS RÉEL

| Phase     | Estimé                   | Réel | Écart | Notes |
| --------- | ------------------------ | ---- | ----- | ----- |
| 0         | 30 min                   |      |       |       |
| 1         | 4-5h                     |      |       |       |
| 2         | 3-4h                     |      |       |       |
| 3         | 2-3h                     |      |       |       |
| 4         | 3-4h                     |      |       |       |
| 5         | 4.5-5.5h                 |      |       |       |
| 6         | 4-5h                     |      |       |       |
| 7         | 2.5-3.5h                 |      |       |       |
| **TOTAL** | **31-39.5h (4-5 jours)** |      |       |       |
