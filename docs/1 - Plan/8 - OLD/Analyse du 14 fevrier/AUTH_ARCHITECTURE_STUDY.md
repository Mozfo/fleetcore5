# AUTH_ARCHITECTURE_STUDY.md

## Etude d'Architecture Auth — Couche Centralisee + Supabase Auth + RLS Portable

**Date**: Fevrier 2026
**Auteur**: Claude Opus 4.6 (recherche assistee)
**Statut**: Document factuel — aucune recommandation
**Prerequis**: AUTH_ZERO_LOCKIN_STUDY.md, CLERK_AUDIT.md

---

## Table des matieres

1. [Interface d'abstraction auth](#partie-1--interface-dabstraction-auth)
2. [Supabase Auth : capacites et limites](#partie-2--supabase-auth--capacites-et-limites)
3. [Multi-tenant sans Clerk](#partie-3--multi-tenant-sans-clerk)
4. [RLS portable (Prisma + Postgres standard)](#partie-4--rls-portable)
5. [Inventaire couplage Supabase](#partie-5--inventaire-couplage-supabase)
6. [Sequencement Refine + Auth](#partie-6--sequencement-refine--auth)
7. [Metrique cible](#partie-7--metrique-cible)
8. [Annexes](#annexes)

---

<a id="partie-1--interface-dabstraction-auth"></a>

## PARTIE 1 — Interface d'abstraction auth

### 1.1 — Inventaire des 52 fichiers couples a Clerk

L'audit exhaustif du codebase identifie **52 fichiers source** important directement `@clerk/nextjs` ou `@clerk/backend`.

> Note: le chiffre 57 mentionne dans la demande incluait vraisemblablement les fichiers .env et configs.
> Le decompte ci-dessous ne compte que les fichiers TypeScript/JSX avec des imports effectifs.

| Categorie           | Nombre | Fichiers                                                                                     |
| ------------------- | ------ | -------------------------------------------------------------------------------------------- |
| MIDDLEWARE          | 1      | `middleware.ts`                                                                              |
| WEBHOOK             | 1      | `app/api/webhooks/clerk/route.ts`                                                            |
| SERVICE             | 3      | `clerk.service.ts`, `clerk-sync.service.ts`, `clerk-uuid-mapper.ts`                          |
| PROVIDER (React)    | 1      | `app/layout.tsx` (ClerkProvider)                                                             |
| AUTH_FLOW (pages)   | 7      | login, register, forgot-password, reset-password, select-org, accept-invitation, login/tasks |
| UI_COMPONENT        | 4      | AppHeader, SiteHeader, CrmTopBar, useHasPermission                                           |
| AUTH_HELPER         | 3      | clerk-helpers.ts, auth.middleware.ts, permissions.ts                                         |
| JWT_INTERNAL        | 1      | lib/auth/jwt.ts                                                                              |
| TESTING             | 2      | clerk-test-auth.ts, create-admin-user.ts                                                     |
| SERVER_ACTION (CRM) | 10     | lead, qualify, convert, bulk, delete, quote, orders, agreements, opportunity, activities     |
| API_ROUTE           | 16     | CRM demo-leads (3), leads (1), v1 dashboard/notifications (4), + 8 autres                    |
| ADMIN_PAGE          | 3      | adm/layout, adm/leads/page, adm/leads/[id]/page                                              |
| APP_PAGE            | 6      | (app)/layout, dashboard, crm/leads (3 pages), crm/opportunities                              |
| **TOTAL**           | **52** |                                                                                              |

### 1.2 — Classification par type d'import Clerk

| Import Clerk            | Occurrences | Usage                                               |
| ----------------------- | ----------- | --------------------------------------------------- |
| `auth()`                | 28          | Server-side : extraire userId, orgId, sessionClaims |
| `currentUser()`         | 3           | Server-side : obtenir le profil complet             |
| `useUser()`             | 4           | Client-side : afficher nom/email dans UI            |
| `useSignIn()`           | 4           | Client-side : login + forgot password               |
| `useSignUp()`           | 2           | Client-side : registration                          |
| `useOrganizationList()` | 3           | Client-side : selection d'org                       |
| `useOrganization()`     | 1           | Client-side : permissions via orgRole               |
| `useAuth()`             | 1           | Client-side : getToken() pour refresh JWT           |
| `useClerk()`            | 1           | Client-side : signOut()                             |
| `UserButton`            | 4           | Composant UI Clerk : menu utilisateur               |
| `SignUp`                | 1           | Composant UI Clerk : inscription via invitation     |
| `ClerkProvider`         | 1           | Provider React racine                               |
| `clerkMiddleware`       | 1           | Middleware Next.js                                  |
| `clerkClient()`         | 3           | Backend : creation org, invitation, metadata        |
| `createClerkClient()`   | 2           | Backend : testing (JWT generation)                  |
| `WebhookEvent`          | 1           | Type pour webhook handler                           |

### 1.3 — Interface d'abstraction proposee (TypeScript)

Basee sur l'analyse des 52 fichiers, voici les operations auth utilisees par FleetCore :

```typescript
// lib/auth/types.ts — Interface d'abstraction auth

/** Resultat d'authentification server-side */
interface AuthSession {
  userId: string; // Identifiant unique user (Clerk: "user_xxx", Supabase: UUID)
  orgId: string | null; // Organisation active (null = pas encore selectionnee)
  orgRole: string | null; // Role dans l'org ("org:admin", "org:member", etc.)
  sessionClaims: Record<string, unknown>; // Claims JWT custom (tenantId, etc.)
}

/** Identite utilisateur (pour affichage UI) */
interface UserIdentity {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

/** Operations server-side (API routes, Server Actions, middleware) */
interface ServerAuthProvider {
  /** Equivalent de auth() — extraire la session courante */
  getSession(): Promise<AuthSession | null>;

  /** Equivalent de currentUser() — profil complet */
  getUser(): Promise<UserIdentity | null>;

  /** Verifier une signature webhook */
  verifyWebhook(
    payload: string,
    headers: Record<string, string>
  ): Promise<WebhookEvent>;
}

/** Operations backend (admin, service-to-service) */
interface AdminAuthProvider {
  /** Creer une organisation (= tenant) */
  createOrganization(input: CreateOrgInput): Promise<CreateOrgResult>;

  /** Inviter un utilisateur dans une organisation */
  inviteUser(input: InviteInput): Promise<InviteResult>;

  /** Mettre a jour les metadata d'une organisation */
  updateOrgMetadata(
    orgId: string,
    metadata: Record<string, unknown>
  ): Promise<void>;
}

/** Operations client-side (hooks React) */
interface ClientAuthHooks {
  /** Equivalent de useUser() */
  useUser(): { user: UserIdentity | null; isLoaded: boolean };

  /** Equivalent de useSignIn() */
  useSignIn(): SignInControls;

  /** Equivalent de useSignUp() */
  useSignUp(): SignUpControls;

  /** Equivalent de useOrganizationList() */
  useOrganizationList(): OrgListControls;

  /** Equivalent de useOrganization() */
  useOrganization(): OrgControls;
}

/** Operations de login */
interface SignInControls {
  signIn: {
    create(params: {
      identifier: string;
      password: string;
    }): Promise<SignInResult>;
    attemptFirstFactor(params: {
      strategy: string;
      code: string;
      password?: string;
    }): Promise<SignInResult>;
  };
  isLoaded: boolean;
}

/** Operations d'inscription */
interface SignUpControls {
  signUp: {
    create(params: {
      emailAddress: string;
      password: string;
      unsafeMetadata?: Record<string, unknown>;
    }): Promise<SignUpResult>;
    prepareEmailAddressVerification(params: {
      strategy: string;
    }): Promise<void>;
    attemptEmailAddressVerification(params: {
      code: string;
    }): Promise<SignUpResult>;
  };
  isLoaded: boolean;
}
```

### 1.4 — Architecture de la couche centralisee

```
app/layout.tsx
  └── <AuthProvider>              ← lib/auth/provider.tsx (remplace ClerkProvider)
       └── children

lib/auth/
  ├── types.ts                   ← Interfaces ci-dessus
  ├── provider.tsx               ← React context provider
  ├── hooks.ts                   ← useUser(), useSignIn(), useOrganization(), etc.
  ├── server.ts                  ← getSession(), getUser(), verifyWebhook()
  ├── admin.ts                   ← createOrganization(), inviteUser()
  └── providers/
       ├── clerk.ts              ← Implementation Clerk (actuelle)
       ├── supabase.ts           ← Implementation Supabase Auth (future)
       └── custom-jwt.ts         ← Implementation JWT custom (option)

middleware.ts
  └── import { getSession } from "@/lib/auth/server"
       └── (appelle le provider actif)

lib/actions/crm/*.ts
  └── import { getSession } from "@/lib/auth/server"
       └── (remplace auth() de @clerk/nextjs/server)

components/*.tsx
  └── import { useUser } from "@/lib/auth/hooks"
       └── (remplace useUser() de @clerk/nextjs)
```

**Principe** : Tous les 52 fichiers importent depuis `lib/auth/`, JAMAIS depuis `@clerk/*` directement.
Le seul fichier qui importe `@clerk/*` est `lib/auth/providers/clerk.ts`.

### 1.5 — Fichiers qui ne rentrent pas dans le modele

| Fichier                          | Probleme                                                                  | Solution                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `accept-invitation/page.tsx`     | Utilise `<SignUp>` composant Clerk (pas un hook, un composant UI complet) | Necessiterait un formulaire custom ou un composant wrapper dans la couche d'abstraction                     |
| `UserButton` (4 fichiers)        | Composant UI Clerk pre-construit avec menu, avatar, sign-out              | Remplacer par un composant custom `<UserMenu>` qui appelle `useUser()` + `signOut()` de la couche abstraite |
| `lib/testing/clerk-test-auth.ts` | Utilise `createClerkClient` pour generer des JWT de test valides          | Chaque provider doit fournir un `createTestAuth()` equivalent                                               |
| `scripts/create-admin-user.ts`   | Script CLI utilisant `createClerkClient` directement                      | Script specifique au provider, acceptable hors de la couche d'abstraction                                   |

---

<a id="partie-2--supabase-auth--capacites-et-limites"></a>

## PARTIE 2 — Supabase Auth : capacites et limites

### 2.1 — Ce que Supabase Auth fournit nativement

| Fonctionnalite           | Statut  | Details                                                                        |
| ------------------------ | ------- | ------------------------------------------------------------------------------ |
| Email/password           | OUI     | Signup, signin, confirmation email configurable. Hash bcrypt interne           |
| OAuth social             | OUI     | 19+ providers : Google, Microsoft, GitHub, Apple, Discord, LinkedIn OIDC, etc. |
| Magic Link               | OUI     | Email-based passwordless. Rate limit: 1/60s. Expiration: 1h                    |
| OTP (email/phone)        | OUI     | Active par defaut sur tous les projets                                         |
| MFA/TOTP                 | OUI     | Jusqu'a 10 facteurs par user. Pas de recovery codes                            |
| JWT avec claims custom   | OUI     | Deux mecanismes (voir 2.1.1)                                                   |
| getUser() server-side    | OUI     | Contacte le serveur auth pour valider — SECURISE                               |
| getSession() server-side | OUI     | Lit le JWT des cookies — NE VALIDE PAS le JWT — INSECURE cote serveur          |
| getClaims() server-side  | OUI     | Valide la signature JWT via JWKS — SECURISE et rapide                          |
| Auth Hooks (triggers)    | OUI     | Before User Created, Custom Access Token, Send SMS/Email (Free/Pro)            |
| Auth Hooks avances       | PARTIEL | MFA Verification, Password Verification — Team/Enterprise uniquement           |
| Middleware Next.js       | OUI     | Via @supabase/ssr — refresh token dans middleware                              |

**Source** : https://supabase.com/docs/guides/auth

#### 2.1.1 — Injection de claims custom (orgId, tenantId, role)

**Mecanisme 1 : `app_metadata`** (simple)

- Stocker dans `auth.users.raw_app_meta_data` (champ JSONB)
- SECURISE : non modifiable cote client (contrairement a `user_metadata`)
- Accessible en RLS via `auth.jwt()->'app_metadata'->>'tenant_id'`
- Requiert acces admin/service_role pour ecrire

**Mecanisme 2 : Custom Access Token Hook** (avance)

- Fonction PostgreSQL executee AVANT chaque emission de token
- Permet d'injecter des claims arbitraires depuis vos propres tables
- Exemple : lire `org_members` pour injecter `orgId` et `role` dans le JWT

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql as $$
declare
  claims jsonb := event->'claims';
  user_org_id uuid;
  user_role text;
begin
  select org_id, role into user_org_id, user_role
  from public.org_members
  where user_id = (event->>'user_id')::uuid;

  claims := jsonb_set(claims, '{orgId}', to_jsonb(user_org_id));
  claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  return jsonb_build_object('claims', claims);
end;
$$;
```

**Claims obligatoires a preserver** : `iss`, `aud`, `exp`, `iat`, `sub`, `role`, `aal`, `session_id`, `email`, `phone`, `is_anonymous`.

**Source** : https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook

### 2.2 — Ce que Supabase Auth NE fournit PAS

| Fonctionnalite                               | Statut            | Impact FleetCore                                                                                                                              |
| -------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Organizations / multi-tenant                 | ABSENT (confirme) | FleetCore doit construire ses propres tables org + membership                                                                                 |
| Invitation de membres par email dans une org | ABSENT nativement | `inviteUserByEmail()` existe mais invite dans l'APP, pas dans une ORG. Supabase a explicitement indique ne pas planifier cette fonctionnalite |
| Roles au niveau organization                 | ABSENT            | Un seul champ `role` sur le JWT (defaut: `authenticated`). Pas de concept org:admin / org:member                                              |
| Composants UI pre-construits                 | ABSENT            | Pas d'equivalent a `<UserButton>`, `<SignUp>`, `<SignIn>` de Clerk. Tout est custom                                                           |
| Organization selection (setActive)           | ABSENT            | Pas de concept d'activation d'org. A construire via cookie/session custom                                                                     |

**Source** : https://github.com/orgs/supabase/discussions/1615 (multi-tenant), https://github.com/orgs/supabase/discussions/6055 (invitations)

**Consequence** : Pour FleetCore, les fonctionnalites suivantes actuellement fournies par Clerk devront etre re-implementees :

1. Modele de donnees organizations/memberships (tables existantes : `adm_tenants`, `clt_members`)
2. Flux d'invitation par email (FleetCore utilise DEJA Resend — confirme dans `lib/services/`)
3. Selection d'organisation post-login (page `select-org`)
4. Injection de `tenantId` dans le JWT (via Custom Access Token Hook)
5. Composants UI (UserButton, SignUp) — a remplacer par composants custom

### 2.3 — Supabase Auth + Next.js App Router

#### Package : @supabase/ssr v0.8.0

Remplace `@supabase/auth-helpers-nextjs` (DEPRECIE).

| Contexte          | Fonction                             | Securite                            |
| ----------------- | ------------------------------------ | ----------------------------------- |
| Client Components | `createBrowserClient()`              | Session via cookies HTTP-only       |
| Server Components | `createServerClient()` + `getUser()` | SECURISE (appel au serveur auth)    |
| Server Actions    | `createServerClient()` + `getUser()` | SECURISE (peut ecrire des cookies)  |
| Route Handlers    | `createServerClient()` + `getUser()` | SECURISE (peut ecrire des cookies)  |
| Middleware        | `createServerClient()` + `getUser()` | Refresh le token, ecrit les cookies |

**Attention** : `getSession()` ne valide PAS le JWT cote serveur. Toujours utiliser `getUser()` ou `getClaims()`.

#### Compatibilite Next.js 15/16

- **Next.js 15** : `cookies()` de `next/headers` est devenu **asynchrone**. L'ancien `@supabase/auth-helpers` est casse. Solution : `@supabase/ssr` + `await cookies()`.
- **Next.js 16** : Supabase a publie un guide officiel specifique (AI Prompt) confirmant la compatibilite active.
- **Conflit connu** : `supabase.auth.resend()` utilise le flux implicite (hash fragment) au lieu de PKCE, ce qui pose probleme avec les Route Handlers server-side.

**Source** : https://supabase.com/docs/guides/auth/server-side/nextjs, https://github.com/supabase/supabase/issues/30030

### 2.4 — Supabase Auth + Prisma

#### Architecture des schemas

```
PostgreSQL Database (Supabase-hosted)
├── auth schema        ← Gere par Supabase Auth (auth.users, auth.sessions, auth.refresh_tokens)
├── public schema      ← Gere par Prisma (adm_tenants, clt_members, crm_*, etc.)
└── extensions schema  ← Extensions PostgreSQL
```

#### Probleme : Prisma ne peut pas faire de FK cross-schema

Prisma ne supporte PAS les foreign keys entre `public` et `auth` schemas :

> "Illegal cross schema reference from `public.Users` to `auth.users`"

**Solutions** :

1. **FK en SQL brut** : Creer la contrainte directement en SQL (pas via Prisma), utiliser `@ignore` dans le schema Prisma
2. **Soft reference** : Stocker `auth_user_id UUID` sans FK formelle, valider par trigger
3. **Table de sync** : Trigger PostgreSQL sur `auth.users` → insere dans `public.profiles` (pattern recommande)

```sql
-- Pattern recommande : trigger de sync
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.clt_members (id, email, tenant_id)
  values (new.id, new.email, (new.raw_app_meta_data->>'tenant_id')::uuid);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Source** : https://github.com/prisma/prisma/discussions/13435, https://github.com/prisma/prisma/issues/16585

#### RLS avec Prisma (pas le client Supabase)

**Par defaut, Prisma contourne toutes les policies RLS** car il se connecte via le role `postgres` (superuser) ou `service_role`.

**Solutions** :

1. **Role non-superuser** : Creer un role PostgreSQL sans `BYPASSRLS` pour les connexions Prisma
2. **Extension prisma-extension-supabase-rls** : Injecte `request.jwt.claims` avant chaque query
3. **Pattern FleetCore existant** : `set_config('app.current_provider_id', ...)` dans `$transaction()` (deja implemente dans `with-provider-context.ts`)

**Fait cle** : Le pattern FleetCore existant (`set_config` + `$transaction`) fonctionne INDEPENDAMMENT de Supabase Auth. Il utilise des variables PostgreSQL standard, pas `auth.uid()`.

### 2.5 — Pricing Supabase Auth

| Plan       | Cout              | MAU inclus | Notes                                |
| ---------- | ----------------- | ---------- | ------------------------------------ |
| Free       | 0 $/mois          | 50 000     | 2 projets, pause apres 7j inactivite |
| Pro        | 25 $/mois + usage | 100 000    | 0,00325 $/MAU additionnel            |
| Team       | 599 $/mois        | 100 000    | SOC 2, hooks avances                 |
| Enterprise | Custom            | Custom     | HIPAA, SLA dedie                     |

**Pour FleetCore a 100-500 utilisateurs** : le tier Free (50K MAU) est largement suffisant.

**Self-hosted** : Possible via Docker Compose (open source). Estimationo TCO : 1 150 - 6 300 $/mois (incluant temps ingenieur).

**Source** : https://supabase.com/pricing

---

<a id="partie-3--multi-tenant-sans-clerk"></a>

## PARTIE 3 — Multi-tenant sans Clerk

### 3.1 — Tables existantes

#### `adm_tenants` — Structure complete

| Colonne                                    | Type               | Defaut               | Notes                                                   |
| ------------------------------------------ | ------------------ | -------------------- | ------------------------------------------------------- |
| `id`                                       | UUID               | `uuid_generate_v4()` | PK                                                      |
| `name`                                     | String             | —                    | Nom du tenant/entreprise                                |
| `country_code`                             | VarChar(2)         | —                    | Code pays ISO                                           |
| `clerk_organization_id`                    | String?            | —                    | **UNIQUE** — Lien vers Clerk Organizations. A REMPLACER |
| `tenant_code`                              | VarChar(50)?       | —                    | Code interne (C-XXXXXX)                                 |
| `status`                                   | Enum tenant_status | `trialing`           | trialing, active, suspended, cancelled                  |
| `subdomain`                                | VarChar(100)?      | —                    | UNIQUE — sous-domaine client                            |
| `stripe_customer_id`                       | VarChar(255)?      | —                    | Lien Stripe                                             |
| `stripe_subscription_id`                   | VarChar(255)?      | —                    | Lien Stripe                                             |
| `verification_token`                       | VarChar(100)?      | —                    | Token d'activation client                               |
| `verification_token_expires_at`            | Timestamptz?       | —                    | Expiration du token                                     |
| `verification_completed_at`                | Timestamptz?       | —                    | Date de completion                                      |
| `admin_name`                               | VarChar(255)?      | —                    | Nom de l'admin du tenant                                |
| `admin_email`                              | VarChar(255)?      | —                    | Email de l'admin du tenant                              |
| `admin_invited_at`                         | Timestamptz?       | —                    | Date d'invitation de l'admin                            |
| `cgi_accepted_at`                          | Timestamptz?       | —                    | Acceptation CGI                                         |
| `vat_rate`, `default_currency`, `timezone` | —                  | EUR, Europe/Paris    | Config fiscale/locale                                   |
| `created_at`, `updated_at`, `deleted_at`   | Timestamptz        | now()                | Audit + soft delete                                     |

**Relations** : 70+ tables referencent `adm_tenants.id` via `tenant_id`.

#### `clt_members` — Structure complete

| Colonne                                  | Type          | Defaut               | Notes                                                      |
| ---------------------------------------- | ------------- | -------------------- | ---------------------------------------------------------- |
| `id`                                     | UUID          | `uuid_generate_v4()` | PK                                                         |
| `tenant_id`                              | UUID          | —                    | FK → adm_tenants. **ISOLATION MULTI-TENANT**               |
| `email`                                  | Citext        | —                    | Email (case-insensitive)                                   |
| `clerk_user_id`                          | VarChar(255)  | —                    | **REQUIS** — Lien vers Clerk. A REMPLACER par auth_user_id |
| `first_name`, `last_name`                | VarChar(100)? | —                    | Identite                                                   |
| `phone`                                  | VarChar(50)   | —                    | Requis (defaut: "")                                        |
| `role`                                   | VarChar(50)   | `member`             | Role simplifie (admin/member)                              |
| `status`                                 | VarChar(50)   | `active`             | active, inactive, suspended                                |
| `email_verified_at`                      | Timestamptz?  | —                    | Verification email                                         |
| `two_factor_enabled`                     | Boolean       | false                | 2FA actif                                                  |
| `two_factor_secret`                      | String?       | —                    | Secret TOTP                                                |
| `password_changed_at`                    | Timestamptz?  | —                    | Suivi changement MDP                                       |
| `failed_login_attempts`                  | Int           | 0                    | Compteur de tentatives echouees                            |
| `locked_until`                           | Timestamptz?  | —                    | Verrouillage compte                                        |
| `default_role_id`                        | UUID?         | —                    | FK → adm_roles                                             |
| `preferred_language`                     | VarChar(10)?  | —                    | Langue preferee                                            |
| `notification_preferences`               | Json?         | —                    | Preferences notifications                                  |
| `created_by`, `updated_by`, `deleted_by` | UUID?         | —                    | Audit trail (self-ref)                                     |

**CONSTAT CRITIQUE** : `clt_members` n'a PAS de colonne `password_hash`. Les mots de passe sont entierement delegues a Clerk. Pour migrer vers Supabase Auth ou custom JWT, deux options :

1. Supabase Auth gere ses propres hash dans `auth.users` (pas besoin d'ajouter la colonne)
2. Custom JWT : ajouter `password_hash VarChar(255)` a `clt_members`

#### `adm_provider_employees` — Structure complete

| Colonne                   | Type         | Notes                                         |
| ------------------------- | ------------ | --------------------------------------------- |
| `id`                      | UUID         | PK                                            |
| `clerk_user_id`           | VarChar(255) | **Lien Clerk** — A REMPLACER                  |
| `email`                   | VarChar(255) |                                               |
| `first_name`, `last_name` | VarChar(50)  |                                               |
| `provider_id`             | UUID?        | FK → adm_providers. NULL = acces global (CEO) |
| `department`, `title`     | VarChar(50)? |                                               |
| `permissions`             | Json?        | RBAC JSON                                     |
| `supervisor_id`           | UUID?        | Self-ref (hierarchie)                         |

#### `adm_providers` — Structure complete

| Colonne                | Type         | Notes                          |
| ---------------------- | ------------ | ------------------------------ |
| `id`                   | UUID         | PK                             |
| `code`                 | VarChar(50)  | UNIQUE — ex: "FC-FR", "FC-UAE" |
| `name`                 | VarChar(200) |                                |
| `country_code`         | Char(2)?     |                                |
| `is_internal`          | Boolean      | Defaut: true                   |
| `settings`, `metadata` | Json         |                                |

**Pas de colonnes Clerk.** Les providers sont des divisions internes FleetCore.

#### `adm_member_roles` / `adm_roles`

Le RBAC FleetCore est DEJA decouple de Clerk :

- `adm_roles` : permissions stockees en JSON, scoped par tenant
- `adm_member_roles` : junction table member ↔ role, avec `valid_from`/`valid_until`, `scope_type`, `priority`
- `permissions.ts` : verifie `hasPermission(userId, tenantId, permission)` en queries DB, PAS via Clerk

#### Colonnes `clerk_*` — Inventaire complet

| Table                    | Colonne                 | Utilisation                       |
| ------------------------ | ----------------------- | --------------------------------- |
| `adm_tenants`            | `clerk_organization_id` | Lier tenant ↔ Clerk Organization |
| `clt_members`            | `clerk_user_id`         | Lier member ↔ Clerk User         |
| `adm_provider_employees` | `clerk_user_id`         | Lier employee ↔ Clerk User       |

**3 tables, 3 colonnes.** Aucune autre table du schema n'a de colonne clerk.

#### Ces tables sont-elles SUFFISANTES pour le multi-tenant sans Clerk ?

| Besoin                            | Table existante                  | Suffisant ?                                                                                             |
| --------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tenant (organisation)             | `adm_tenants`                    | OUI — structure complete                                                                                |
| Members (utilisateurs par tenant) | `clt_members`                    | PARTIEL — manque `auth_user_id` (format Supabase UUID vs Clerk string) et `password_hash` si custom JWT |
| Roles par tenant                  | `adm_roles` + `adm_member_roles` | OUI — RBAC complet et decouple de Clerk                                                                 |
| Invitations                       | `adm_invitations`                | OUI — table existante avec status, expiration, role                                                     |
| Sessions                          | `adm_member_sessions`            | OUI — table existante                                                                                   |
| Employees internes                | `adm_provider_employees`         | PARTIEL — meme probleme `clerk_user_id` → `auth_user_id`                                                |
| Audit logs                        | `adm_audit_logs`                 | OUI — FK vers member_id (UUID), pas clerk_user_id                                                       |

**Colonnes MANQUANTES** :

1. `clt_members.auth_user_id` (UUID) — pour remplacer `clerk_user_id` (string Clerk)
2. `adm_provider_employees.auth_user_id` (UUID) — idem
3. `clt_members.password_hash` — uniquement si custom JWT (pas necessaire si Supabase Auth)

### 3.2 — Flux de remplacement

#### Flux A — Creation d'un tenant

**Actuellement (Clerk)** :

1. Stripe checkout reussit
2. `CustomerConversionService` cree `adm_tenants` en DB
3. `ClerkService.createOrganization()` cree l'org dans Clerk avec `publicMetadata.tenantId`
4. Met a jour `adm_tenants.clerk_organization_id`
5. Webhook Clerk `organization.created` (idempotence — deja cree)

**Alternative (Supabase Auth)** :

1. Stripe checkout reussit
2. `CustomerConversionService` cree `adm_tenants` en DB (IDENTIQUE)
3. PAS de creation d'organisation dans Supabase Auth (le concept n'existe pas)
4. Le `tenantId` sera injecte dans le JWT via Custom Access Token Hook
5. L'association user ↔ tenant se fait via `clt_members.tenant_id`

**A ajouter** : Custom Access Token Hook qui lit `clt_members` pour injecter `tenantId` et `role` dans chaque JWT.

#### Flux B — Invitation d'un membre

**Actuellement (Clerk)** :

1. Admin invite via Clerk → email Clerk → accept-invitation page
2. Clerk envoie le webhook `organizationMembership.created`
3. `clerk-sync.service.ts` cree le `clt_members`

**Alternative (Supabase Auth)** :

1. FleetCore cree une entree dans `adm_invitations` (table EXISTANTE)
2. FleetCore envoie l'email via Resend (DEJA utilise — confirme dans `lib/services/notification/`)
3. L'invite clique le lien → page d'inscription custom
4. `supabase.auth.signUp()` cree le user dans `auth.users`
5. Trigger PostgreSQL sur `auth.users` → cree `clt_members` avec `tenant_id` de l'invitation
6. OU : apres signup, appel API pour associer le user au tenant

**FleetCore utilise DEJA Resend** :

- `lib/services/notification/notification-queue.service.ts` — File d'attente email
- `lib/services/notification/email.service.ts` — Service d'envoi
- Templates email existants (welcome, verification, etc.)

#### Flux C — Login + selection d'org

**Actuellement (Clerk)** :

1. `useSignIn()` → `signIn.create({ identifier, password })`
2. `setActive({ session: result.createdSessionId })`
3. Redirect vers `select-org`
4. `useOrganizationList()` → affiche les orgs
5. `setActive({ organization: orgId })` → JWT refresh avec `orgId`

**Alternative (Supabase Auth)** :

1. `supabase.auth.signInWithPassword({ email, password })`
2. Query `clt_members WHERE auth_user_id = user.id` pour lister les tenants du user
3. Si 1 seul tenant → auto-select
4. Si multiple → page de selection custom
5. Stocker le `tenantId` selectionne :
   - **Option A** : Cookie HTTP-only `x-tenant-id` (lu par middleware)
   - **Option B** : `app_metadata.current_tenant_id` dans Supabase Auth (necessite appel admin)
   - **Option C** : Custom Access Token Hook qui lit la derniere selection depuis une table

**Meilleur stockage** : Option A (cookie) est la plus simple et portable. Le middleware lit le cookie et injecte le header `x-tenant-id`.

#### Flux D — Middleware protection

**Actuellement (Clerk)** :

```typescript
// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
const { userId, orgId, orgRole, sessionClaims } = await auth();
// Injecte x-user-id, x-tenant-id dans les headers
```

**Alternative (Supabase Auth)** :

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
const supabase = createServerClient(url, key, { cookies: { getAll, setAll } });
const {
  data: { user },
} = await supabase.auth.getUser();
// user.id = userId
// user.app_metadata.tenant_id = tenantId (si injecte via hook)
// OU : lire le cookie x-tenant-id
```

**Extraction userId, orgId du JWT Supabase** :

- `user.id` → userId (UUID)
- `user.app_metadata.tenant_id` → tenantId (si custom claim)
- `user.app_metadata.role` → orgRole (si custom claim)

### 3.3 — Roles et permissions

**Le RBAC FleetCore est DEJA decouple de Clerk.**

Le hook `useHasPermission()` dans `lib/hooks/useHasPermission.ts` utilise `useOrganization()` de Clerk pour obtenir `membership.role` (type string comme `org:admin`).

Cependant, le systeme RBAC complet (`adm_roles` + `adm_member_roles` + `permissions.ts`) fonctionne independamment :

- `hasPermission(userId, tenantId, permission)` query la DB directement
- Ne depend PAS de Clerk sauf pour obtenir `userId` initial

**Ou stocker le role** :

- `clt_members.role` existe DEJA (VarChar(50), defaut: "member")
- `adm_member_roles` fournit le RBAC granulaire (roles multiples, time-bounded, scope)
- Pour le JWT : le Custom Access Token Hook peut injecter le role principal depuis `clt_members.role`

**Comment injecter le role dans le JWT** :

```sql
-- Custom Access Token Hook
select cm.role, cm.tenant_id
into user_role, user_tenant
from clt_members cm
where cm.auth_user_id = (event->>'user_id')::uuid
  and cm.status = 'active'
  and cm.deleted_at is null;
-- Injecter dans claims
claims := jsonb_set(claims, '{tenantId}', to_jsonb(user_tenant));
claims := jsonb_set(claims, '{orgRole}', to_jsonb(user_role));
```

---

<a id="partie-4--rls-portable"></a>

## PARTIE 4 — RLS portable (Prisma + Postgres standard)

### 4.1 — RLS avec Prisma : implementation concrete

#### Pattern officiel Prisma (prisma-client-extensions/row-level-security)

```typescript
function forTenant(tenantId: string) {
  return Prisma.defineExtension((prisma) =>
    prisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            const [, result] = await prisma.$transaction([
              prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`,
              query(args),
            ]);
            return result;
          },
        },
      },
    })
  );
}

// Usage
const tenantPrisma = prisma.$extends(forTenant("uuid-du-tenant"));
const leads = await tenantPrisma.crm_leads.findMany(); // RLS filtre automatiquement
```

**Source** : https://github.com/prisma/prisma-client-extensions/tree/main/row-level-security

#### Ce que FleetCore fait DEJA

`lib/prisma/with-provider-context.ts` implemente EXACTEMENT ce pattern :

```typescript
// Extrait de with-provider-context.ts (code existant FleetCore)
await prisma.$transaction(
  async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_provider_id', $1, TRUE)`,
      providerValue
    );
    // Execute la query dans la meme transaction
    return modelDelegate[operation](args);
  },
  { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
);
```

**Fait** : FleetCore a deja le pattern RLS fonctionnel pour `provider_id`. L'etendre a `tenant_id` est une duplication du meme mecanisme.

#### Limitations connues

| Limitation                              | Impact                                                                                                              | Workaround                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Transaction blocking (Issue #23583)** | Chaque query RLS cree une batch transaction. Dans une interactive transaction, les queries se bloquent mutuellement | Utiliser batch transactions `$transaction([])`, pas interactive `$transaction(async tx => {})`               |
| **Transactions imbriquees**             | `companyPrisma.$transaction()` explicite peut ne pas fonctionner                                                    | Detecter si deja dans une transaction (flag `__inTransaction`) — FleetCore le fait deja                      |
| **Performance**                         | Overhead de 2-5ms par query (BEGIN + set_config + COMMIT). Jusqu'a 50ms+ sous forte concurrence                     | Indexer les colonnes `tenant_id`/`provider_id`. Le goulot est le Prisma engine, pas PostgreSQL (<1ms)        |
| **$queryRaw bypass**                    | Les queries raw ne passent PAS par `$allModels.$allOperations`                                                      | Gerer manuellement le set_config pour les queries raw                                                        |
| **Connection pooling (PgBouncer)**      | Les variables session peuvent etre perdues entre transactions                                                       | `set_config(..., TRUE)` = transaction-local resout le probleme. FleetCore utilise deja PgBouncer (port 6543) |

**Source** : https://github.com/prisma/prisma/issues/23583, https://github.com/prisma/prisma/issues/25811

### 4.2 — Policies RLS FleetCore actuelles

#### Inventaire des 47 policies

FleetCore a 47 policies RLS dans `prisma/migrations/manual/20251123_optimize_rls_FINAL_47_policies.sql`.

**Pattern utilise** :

```sql
CREATE POLICY clt_members_tenant_isolation ON clt_members
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
```

**AUCUNE policy n'utilise `auth.uid()` ou `auth.jwt()`** (fonctions Supabase-specifiques).

Toutes utilisent `current_setting('app.current_tenant_id', true)` ou `current_setting('app.current_provider_id', true)`.

#### Deux contextes RLS

| Variable PostgreSQL       | Tables concernees                                 | Qui le set                                                                                            |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `app.current_tenant_id`   | ~47 tables client (clt*\*, flt*\_, fin\_\_, etc.) | Middleware API Client via `with-tenant-context.ts` (a creer — equivalent de with-provider-context.ts) |
| `app.current_provider_id` | 12 tables CRM                                     | `with-provider-context.ts` (EXISTANT)                                                                 |

**Tables CRM avec provider RLS** (deja configurees) :
`crm_leads`, `crm_opportunities`, `crm_quotes`, `crm_quote_items`, `crm_orders`, `crm_agreements`, `crm_addresses`, `crm_lead_activities`, `crm_pipelines`, `crm_settings`, `crm_lead_sources`, `crm_countries`

#### Quel champ utiliser pour RLS ?

| Contexte                              | Champ RLS                   | Justification                                        |
| ------------------------------------- | --------------------------- | ---------------------------------------------------- |
| API Client (tenants/providers)        | `tenant_id`                 | Isolation stricte par entreprise cliente             |
| CRM interne (FleetCore backoffice)    | `provider_id`               | Isolation par division FleetCore (France, UAE, etc.) |
| Tables hybrides (settings, countries) | `provider_id` + `is_system` | Donnees systeme + custom par division                |

### 4.3 — Pattern RLS portable

#### Pourquoi `current_setting()` est portable

`current_setting()` et `set_config()` sont des **fonctions built-in PostgreSQL** disponibles depuis PostgreSQL 8.0. Elles fonctionnent IDENTIQUEMENT sur :

| Provider                      | Support RLS | Confirme par                                                                                                               |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| Supabase PostgreSQL           | Complet     | Utilise actuellement par FleetCore                                                                                         |
| AWS RDS for PostgreSQL        | Complet     | [AWS Blog officiel](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/) |
| AWS Aurora PostgreSQL         | Complet     | Meme moteur que RDS                                                                                                        |
| Google Cloud SQL PostgreSQL   | Complet     | [Google Cloud docs](https://cloud.google.com/sql/docs/postgres/data-privacy-strategies)                                    |
| Azure Database for PostgreSQL | Complet     | PostgreSQL standard                                                                                                        |
| Self-hosted PostgreSQL        | Complet     | Origine de la fonctionnalite (PG 9.5+)                                                                                     |

#### Comparaison `current_setting()` vs `auth.uid()`

| Aspect        | `current_setting('app.xxx')`   | Supabase `auth.uid()`            |
| ------------- | ------------------------------ | -------------------------------- |
| Portabilite   | Tout PostgreSQL                | Supabase uniquement              |
| Couplage auth | Aucun (l'app set la valeur)    | Couple au JWT Supabase           |
| Nommage       | Vous controlez le prefixe      | Fixe: `request.jwt.claim.*`      |
| Setup         | Zero dependance                | Necessite schema `auth` Supabase |
| Flexibilite   | N'importe quelle donnee custom | Limite aux claims JWT            |

**Fait** : `auth.uid()` de Supabase est litteralement un wrapper autour de `current_setting('request.jwt.claim.sub', true)`. Le pattern FleetCore est donc plus general.

#### Fonctions helper portables (optionnel)

Si besoin de fonctions helper pour lisibilite des policies :

```sql
CREATE SCHEMA IF NOT EXISTS app_auth;

CREATE OR REPLACE FUNCTION app_auth.tenant_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.current_tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_auth.user_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.current_user_id', true), '')
$$;

-- Utilisation dans les policies :
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = app_auth.tenant_id());
```

#### ZenStack comme alternative

| Aspect                 | PostgreSQL RLS (FleetCore actuel) | ZenStack (application-level)  |
| ---------------------- | --------------------------------- | ----------------------------- |
| Couche d'enforcement   | Moteur de base de donnees         | ORM applicatif                |
| Bypass par raw SQL     | Impossible                        | Possible                      |
| Multi-DB support       | PostgreSQL uniquement             | Tout DB supporte par Prisma   |
| Outils BI/reporting    | Policies appliquees               | Non appliquees (acces direct) |
| Migration des policies | SQL migration necessaire          | Schema .zmodel modifiable     |

FleetCore a deja 47 policies RLS PostgreSQL fonctionnelles. Migrer vers ZenStack impliquerait de reecrire ces 47 policies.

---

<a id="partie-5--inventaire-couplage-supabase"></a>

## PARTIE 5 — Inventaire couplage Supabase

### 5.1 — Couplage actuel

#### Imports @supabase/\* dans le code source

**ZERO.** Confirme par recherche exhaustive :

```
Grep "@supabase" dans tous les .ts/.tsx/.js/.jsx (hors node_modules) → 0 resultats
Grep "createClient.*supabase" → 0 resultats
Grep "createBrowserClient\|createServerClient" → 0 resultats
```

**package.json** : Aucun package `@supabase/*` dans dependencies ou devDependencies.

#### Ce qui EXISTE pour Supabase

| Element                        | Localisation                               | Usage                                                                                                                                |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Connection strings PostgreSQL  | `.env.local` lignes 6-15                   | `DATABASE_URL` et `DIRECT_URL` pointent vers `aws-1-eu-central-2.pooler.supabase.com`                                                |
| Credentials Supabase Auth      | `.env.local` lignes 34-37                  | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — PRESENTES mais NON UTILISEES dans le code |
| Dossier `supabase/migrations/` | `supabase/migrations/`                     | 3 fichiers SQL manuels (score_decay, last_activity_at). Executes via Supabase Dashboard, pas via CLI                                 |
| Sentry integration             | `node_modules/@sentry/core/...supabase.js` | Module optionnel Sentry pour tracer les appels Supabase. Pas d'import direct                                                         |

**Conclusion** : Supabase est utilise EXCLUSIVEMENT comme hebergeur PostgreSQL. Toutes les queries transitent par Prisma via des connection strings standard.

### 5.2 — Nouveaux points de couplage si Supabase Auth est ajoute

Si Supabase Auth est adopte, les NOUVEAUX imports `@supabase/*` doivent etre confines :

| Fichier                                | Import                  | Usage                                                      |
| -------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| `lib/auth/providers/supabase.ts`       | `@supabase/ssr`         | `createBrowserClient()`, `createServerClient()`            |
| `lib/auth/providers/supabase-admin.ts` | `@supabase/supabase-js` | `createClient()` avec `service_role` pour operations admin |

**Soit 2 fichiers maximum** contenant des imports `@supabase/*`, contre 52 fichiers `@clerk/*` actuellement.

Les 52 fichiers business continuent d'importer depuis `lib/auth/` (la couche d'abstraction), jamais directement depuis `@supabase/*`.

---

<a id="partie-6--sequencement-refine--auth"></a>

## PARTIE 6 — Sequencement Refine + Auth

### 6.1 — Deux scenarios possibles

#### Scenario A : Auth migration PUIS Refine

```
Phase 1: Creer lib/auth/ (couche d'abstraction)
Phase 2: Migrer les 52 fichiers pour importer depuis lib/auth/ (toujours Clerk derriere)
Phase 3: Creer lib/auth/providers/supabase.ts
Phase 4: Basculer le provider actif de Clerk vers Supabase Auth
Phase 5: Integrer Refine avec AuthProvider qui appelle lib/auth/
```

| Avantage                                                          | Risque                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| Refine ne touche JAMAIS Clerk                                     | Phase 2 (migration 52 fichiers) est un gros changement avant Refine |
| Le AuthProvider Refine est ecrit une seule fois, contre lib/auth/ | Retarde l'integration Refine                                        |
| Separation claire des preoccupations                              | Si Refine impose des contraintes sur l'auth, on le decouvre tard    |

#### Scenario B : Refine PUIS Auth migration

```
Phase 1: Integrer Refine avec un AuthProvider qui appelle DIRECTEMENT Clerk
Phase 2: Creer lib/auth/ (couche d'abstraction)
Phase 3: Migrer les 52 fichiers + le AuthProvider Refine vers lib/auth/
Phase 4: Creer lib/auth/providers/supabase.ts
Phase 5: Basculer le provider actif
```

| Avantage                                            | Risque                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Refine fonctionne IMMEDIATEMENT avec Clerk existant | Double migration du AuthProvider Refine (etape 1 → Clerk direct, etape 3 → lib/auth/) |
| On decouvre les contraintes Refine tot              | AuthProvider initial sera jetable                                                     |
| Valeur livree plus vite                             | 52 fichiers + AuthProvider Refine = plus de fichiers a migrer en phase 3              |

#### Scenario C (hybride) : Abstraction PUIS Refine PUIS Migration

```
Phase 1: Creer lib/auth/ avec provider Clerk (couche d'abstraction)
Phase 2: Migrer les 52 fichiers vers lib/auth/ (toujours Clerk derriere)
Phase 3: Integrer Refine avec AuthProvider qui appelle lib/auth/
Phase 4: Creer lib/auth/providers/supabase.ts quand necessaire
Phase 5: Basculer le provider actif (1 ligne de config)
```

| Avantage                                    | Risque                                            |
| ------------------------------------------- | ------------------------------------------------- |
| AuthProvider Refine ecrit une seule fois    | Phase 2 necessaire avant Refine (idem Scenario A) |
| Migration auth = changer 1 fichier provider |                                                   |
| Refine et auth sont decouple des le debut   |                                                   |

### 6.2 — Le AuthProvider Refine dans le modele centralise

#### Chaine d'appel

```
Refine <Refine authProvider={authProvider} />
  └── authProvider (lib/refine/auth-provider.ts)
       ├── login()         → lib/auth/ → providers/clerk.ts (ou supabase.ts)
       ├── logout()        → lib/auth/ → providers/clerk.ts (ou supabase.ts)
       ├── check()         → lib/auth/ → providers/clerk.ts (ou supabase.ts)
       ├── getIdentity()   → lib/auth/ → providers/clerk.ts (ou supabase.ts)
       ├── getPermissions() → lib/auth/ → providers/clerk.ts (ou supabase.ts)
       └── onError()       → lib/auth/ → providers/clerk.ts (ou supabase.ts)
```

#### Estimation du code

```typescript
// lib/refine/auth-provider.ts — ~80 lignes
import { getSession, getUser, signOut } from "@/lib/auth";
import type { AuthProvider } from "@refinedev/core";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const result = await signIn(email, password);
    return result.success
      ? { success: true, redirectTo: "/dashboard" }
      : { success: false, error: { message: result.error } };
  },

  logout: async () => {
    await signOut();
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const session = await getSession();
    return session
      ? { authenticated: true }
      : { authenticated: false, redirectTo: "/login" };
  },

  getIdentity: async () => {
    const user = await getUser();
    return user
      ? {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.imageUrl,
        }
      : null;
  },

  getPermissions: async () => {
    const session = await getSession();
    return session?.orgRole ? [session.orgRole] : [];
  },

  onError: async (error) => {
    if (error.status === 401) return { logout: true, redirectTo: "/login" };
    return { error };
  },
};
```

**~80 lignes.** Ce fichier n'importe RIEN de Clerk ou Supabase directement.
Changer de provider auth = changer `lib/auth/providers/active.ts`, pas ce fichier.

---

<a id="partie-7--metrique-cible"></a>

## PARTIE 7 — Metrique cible

### Etat actuel : 52 fichiers couples a @clerk/\*

```
52 fichiers → @clerk/nextjs ou @clerk/backend directement
0 fichiers → couche d'abstraction lib/auth/
```

### Etat cible : 1 a 3 fichiers couples au provider

```
52 fichiers → lib/auth/ (couche d'abstraction)
1 fichier  → lib/auth/providers/clerk.ts (ou supabase.ts)
1 fichier  → lib/auth/providers/supabase-admin.ts (operations admin)
1 fichier  → lib/auth/provider-config.ts (quel provider est actif)
```

| Metrique                                        | Actuel                          | Cible                                               |
| ----------------------------------------------- | ------------------------------- | --------------------------------------------------- |
| Fichiers important directement un provider auth | 52                              | 2-3                                                 |
| Fichiers a modifier pour changer de provider    | 52                              | 1 (provider-config.ts)                              |
| Packages npm du provider                        | @clerk/nextjs, @clerk/backend   | @supabase/ssr, @supabase/supabase-js (ou @clerk/\*) |
| Composants UI du provider                       | UserButton, SignUp (4 fichiers) | 0 (composants custom dans lib/auth/components/)     |
| Tests a modifier pour changer de provider       | Tous les tests d'integration    | Tests du provider uniquement                        |

### Effort de migration estime

| Phase                                           | Fichiers touches      | Complexite                            |
| ----------------------------------------------- | --------------------- | ------------------------------------- |
| Creer lib/auth/ + types                         | 5-8 nouveaux fichiers | Moyenne                               |
| Creer lib/auth/providers/clerk.ts               | 1 fichier             | Faible (wrapper existant)             |
| Migrer les 28 `auth()` → `getSession()`         | 28 fichiers           | Faible (search-replace + ajustements) |
| Migrer les 4 `useUser()` → `useUser()` abstrait | 4 fichiers            | Faible                                |
| Migrer les 4 `UserButton` → `<UserMenu>` custom | 4 fichiers            | Moyenne (UI a recreer)                |
| Migrer les 7 pages auth flow                    | 7 fichiers            | Elevee (logique form specifique)      |
| Migrer middleware.ts                            | 1 fichier             | Elevee (logique complexe)             |
| Migrer webhook handler                          | 1 fichier             | Moyenne (pattern event different)     |
| Migrer services (clerk.service, clerk-sync)     | 3 fichiers            | Elevee                                |
| Creer lib/auth/providers/supabase.ts            | 1-2 fichiers          | Elevee                                |

**Total estime** : 52 fichiers modifies + 8-12 nouveaux fichiers.

---

<a id="annexes"></a>

## ANNEXES

### Annexe A — Variables d'environnement Clerk actuelles

| Variable                                 | Usage                     |
| ---------------------------------------- | ------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`      | Frontend auth             |
| `CLERK_SECRET_KEY`                       | Backend API               |
| `CLERK_WEBHOOK_SECRET`                   | Verification webhook      |
| `FLEETCORE_ADMIN_ORG_ID`                 | ID org admin (middleware) |
| `NEXT_PUBLIC_ENABLE_PUBLIC_REGISTRATION` | Feature flag inscription  |
| `CLERK_JWT_TEMPLATE_NAME`                | Template JWT custom       |

### Annexe B — Variables d'environnement Supabase deja presentes

| Variable                        | Valeur                                         | Utilisee ?              |
| ------------------------------- | ---------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://joueofbaqjkrpjcailkx.supabase.co`     | NON                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...`                                    | NON                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | `eyJhbG...`                                    | NON                     |
| `DATABASE_URL`                  | `postgresql://...pooler.supabase.com:6543/...` | OUI (Prisma)            |
| `DIRECT_URL`                    | `postgresql://...pooler.supabase.com:5432/...` | OUI (Prisma migrations) |

### Annexe C — Fichiers cles de l'architecture auth actuelle

| Fichier                                    | Lignes | Role                                              |
| ------------------------------------------ | ------ | ------------------------------------------------- |
| `middleware.ts`                            | ~340   | Route protection, rate limiting, header injection |
| `lib/auth/clerk-helpers.ts`                | ~130   | Helpers avec cache tenant                         |
| `lib/auth/permissions.ts`                  | ~130   | RBAC decouple de Clerk                            |
| `lib/auth/jwt.ts`                          | ~200   | JWT interne (jose)                                |
| `lib/middleware/auth.middleware.ts`        | ~120   | Auth middleware pour API routes                   |
| `lib/hooks/useHasPermission.ts`            | ~80    | Hook React permissions                            |
| `lib/services/clerk/clerk.service.ts`      | ~220   | CRUD organisations Clerk                          |
| `lib/services/admin/clerk-sync.service.ts` | ~350   | Sync webhook Clerk → DB                           |
| `lib/utils/clerk-uuid-mapper.ts`           | ~120   | Mapping Clerk IDs → UUIDs                         |
| `lib/prisma/with-provider-context.ts`      | ~200   | Extension Prisma RLS                              |
| `lib/utils/provider-context.ts`            | ~140   | Context provider FleetCore                        |
| `app/api/webhooks/clerk/route.ts`          | ~350   | Handler webhook Clerk                             |

### Annexe D — Sources

- Prisma RLS Extension officielle : https://github.com/prisma/prisma-client-extensions/tree/main/row-level-security
- Prisma Issue #23583 (transaction blocking) : https://github.com/prisma/prisma/issues/23583
- Prisma Issue #12735 (RLS native) : https://github.com/prisma/prisma/issues/12735
- AWS Multi-tenant RLS : https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/
- Google Cloud SQL RLS : https://cloud.google.com/sql/docs/postgres/data-privacy-strategies
- Supabase Auth Docs : https://supabase.com/docs/guides/auth
- Supabase SSR Next.js : https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase Custom Access Token Hook : https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- Supabase Pricing : https://supabase.com/pricing
- Supabase Multi-tenant Discussion : https://github.com/orgs/supabase/discussions/1615
- @supabase/ssr npm : https://www.npmjs.com/package/@supabase/ssr
- Refine AuthProvider : https://refine.dev/docs/guides-concepts/authentication/auth-provider-interface/
- Unkey Auth Abstraction : https://www.unkey.com/blog/auth-abstraction
- ZenStack : https://zenstack.dev/blog/multi-tenant
- PostgreSQL RLS Docs : https://www.postgresql.org/docs/current/ddl-rowsecurity.html
