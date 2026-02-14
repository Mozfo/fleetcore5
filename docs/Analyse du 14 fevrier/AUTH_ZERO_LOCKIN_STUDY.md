# ETUDE D'ARCHITECTURE AUTH ZERO LOCK-IN POUR FLEETCORE

**Date**: Fevrier 2026
**Statut**: Etude factuelle - Aucune recommandation
**Auteur**: Claude (Etude documentaire)
**Documents de reference**:

- `docs/CLERK_AUDIT.md` -- Audit du couplage Clerk
- `docs/REFINE_VS_CUSTOM_ANALYSIS.md` -- Analyse Refine vs Custom

> **PRINCIPE**: Ce document DOCUMENTE, il ne DECIDE pas. Chaque assertion technique est verifiable via les sources citees. Quand une information est incertaine: "JE NE SAIS PAS -- recherche necessaire".

---

## TABLE DES MATIERES

- [PARTIE 1 -- Comparatif des Solutions Auth Existantes](#partie-1--comparatif-des-solutions-auth-existantes)
- [PARTIE 2 -- Multi-Tenant Sans Clerk](#partie-2--multi-tenant-sans-clerk)
- [PARTIE 3 -- Etat Actuel FleetCore](#partie-3--etat-actuel-fleetcore)
- [PARTIE 4 -- Compatibilite Refine](#partie-4--compatibilite-refine)
- [PARTIE 5 -- Portabilite Backend](#partie-5--portabilite-backend)

---

# PARTIE 1 -- Comparatif des Solutions Auth Existantes

## 1.1 Vue d'Ensemble

| Critere                | Auth.js / Better Auth                        | Lucia Auth             | Supabase Auth (GoTrue)      | Custom JWT              | Hybrid AuthAdapter         |
| ---------------------- | -------------------------------------------- | ---------------------- | --------------------------- | ----------------------- | -------------------------- |
| **Statut (fev. 2026)** | Auth.js DEPRECIE, absorbe par Better Auth    | DEPRECIE (mars 2025)   | Actif, maintenu             | N/A                     | Pattern, pas un produit    |
| **Architecture**       | JWT ou DB sessions                           | Sessions DB uniquement | JWT + Refresh tokens        | JWT custom              | Depend de l'implementation |
| **Multi-tenant natif** | Non (Auth.js) / Oui via plugin (Better Auth) | Non                    | Non                         | A construire            | A construire               |
| **RBAC natif**         | Non (callbacks manuels)                      | Non                    | Non (app_metadata manuel)   | A construire            | A construire               |
| **Next.js App Router** | Oui (complet)                                | Oui (complet)          | Oui (supabase/ssr)          | Oui (middleware custom) | Oui                        |
| **Portabilite**        | Totale (open source)                         | N/A (deprecie)         | Faible (pgjwt, auth schema) | Totale                  | Totale                     |
| **Lock-in**            | Zero                                         | Zero                   | Moyen-Eleve                 | Zero                    | Zero                       |
| **Licence**            | ISC (Auth.js) / MIT (Better Auth)            | MIT                    | Apache 2.0                  | N/A                     | N/A                        |
| **Cout 100-500 users** | 0 EUR                                        | 0 EUR                  | 0 EUR (free tier 50K MAU)   | 0 EUR (infra seule)     | 0 EUR (infra seule)        |
| **Prisma adapter**     | Oui (24+ adapters)                           | Oui (deprecie)         | Non (auth schema propre)    | N/A                     | Depend                     |

## 1.2 Auth.js v5 / Better Auth

### 1.2.1 Historique et Statut Actuel

- **Auth.js v5** (ex-NextAuth v5) est reste en **beta depuis octobre 2023** -- jamais sorti en version stable
- **Janvier 2025**: Balazs Orban, le mainteneur principal, a quitte le projet
- **2026**: Auth.js a ete officiellement absorbe par **Better Auth**
- Auth.js recevra uniquement des **patches de securite** -- plus de nouvelles fonctionnalites
- Guide de migration officiel: https://authjs.dev/getting-started/migrate-to-better-auth
- Source: https://www.better-auth.com/blog/authjs-joins-better-auth
- Source: https://github.com/nextauthjs/next-auth/discussions/13252

### 1.2.2 Architecture Auth.js

**Strategie JWT (defaut sans adapter)**:

- JWT chiffre (JWE) stocke dans un cookie HttpOnly
- Validation: environ 8-10ms, pas de hit DB
- Limitation: JWT non-revocable avant expiration, limite 4KB cookie

**Strategie Database (defaut avec adapter)**:

- Session record en base, session ID dans cookie
- Overhead: 30-100ms par requete
- Avantage: revocation immediate, audit complet
- Limitation: incompatible avec Edge middleware

### 1.2.3 Multi-Tenant / Organizations

**Auth.js n'a AUCUN concept natif d'Organizations, teams, ou workspaces.**

Pour implementer le multi-tenant avec Auth.js:

1. Ajouter des champs custom (orgId, orgRole, tenantId) aux modeles User/Account
2. Creer ses propres tables Organization, OrganizationMember, Invitation
3. Utiliser les callbacks JWT pour injecter orgId/orgRole dans le token
4. Implementer soi-meme: invitations, RBAC, gestion membres, org-switching

**Better Auth** dispose d'un **plugin Organizations** natif avec roles, invitations, et gestion des membres.

### 1.2.4 Adaptateurs Base de Donnees

Auth.js fournit **24+ adaptateurs officiels**: Prisma, Drizzle, MongoDB, Supabase, Firebase, TypeORM, Kysely, DynamoDB, etc.

L'adaptateur Prisma requiert 4 modeles: User, Account, Session, VerificationToken.

Source: https://authjs.dev/reference/core/adapters

### 1.2.5 MFA / 2FA

**Auth.js n'a PAS de support MFA natif.** Le Credentials provider mentionne "two factor authentication" comme cas d'usage, mais toute la logique (TOTP, recovery codes, SMS/email OTP) doit etre implementee manuellement.

**Better Auth** dispose d'un plugin Two-Factor Authentication.

### 1.2.6 OAuth

Auth.js fournit **80+ providers OAuth preconfigures** (Google, GitHub, Apple, Microsoft, etc.). OAuth 1.0 est deprecie en v5.

### 1.2.7 Portabilite DB

Avec l'adaptateur Prisma: changer `DATABASE_URL` est la seule modification applicative necessaire pour migrer Supabase vers AWS RDS.

### 1.2.8 Licence et Cout

- **Auth.js**: ISC (permissive, equivalente MIT). **0 EUR** quel que soit le nombre d'utilisateurs.
- **Better Auth**: MIT. **0 EUR** quel que soit le nombre d'utilisateurs.

## 1.3 Lucia Auth

### 1.3.1 Statut: DEPRECIE

Lucia Auth v3 a ete **officiellement deprecie en mars 2025**. Tous les adaptateurs DB ont ete deprecies fin 2024. Le projet est maintenant une **ressource educative** -- plus un package a installer.

- Source: https://github.com/lucia-auth/lucia/discussions/1714

**Alternatives recommandees par le mainteneur**:

1. Construire soi-meme avec les ressources educatives Lucia
2. **Better Auth** -- le remplacant le plus cite
3. Auth.js (lui-meme maintenant deprecie)

### 1.3.2 Architecture

Architecture **purement session-based** (pas de JWT):

- Session ID: 40 caracteres aleatoires (a-z, 0-9)
- Stockage: sessions en base de donnees
- Validation: chaque requete valide contre la base
- Expiration: fenetre glissante (30 jours defaut, etendue si < 15 jours restants)

### 1.3.3 Multi-Tenant

**Aucun support natif**. Lucia etait une librairie de gestion de sessions de bas niveau uniquement.

### 1.3.4 Licence et Cout

MIT. **0 EUR**. Les librairies soeurs **Oslo** (crypto) et **Arctic** (OAuth) restent maintenues.

## 1.4 Supabase Auth (GoTrue)

### 1.4.1 Architecture

GoTrue est un **serveur Go**, fork de Netlify GoTrue, qui a significativement diverge de l'original.

- **Access Token**: JWT (duree courte, defaut 1h, configurable jusqu'a 5min)
- **Refresh Token**: String opaque unique, single-use (rotation a chaque refresh)
- **Signing**: RS256 par defaut
- **Session tracking**: chaque JWT contient `session_id` (UUID) correle a `auth.sessions`
- **Stockage**: schema `auth` dans Postgres (`auth.users`, `auth.sessions`, `auth.refresh_tokens`)

Source: https://supabase.com/docs/guides/auth/architecture

### 1.4.2 Multi-Tenant

**Supabase Auth n'a PAS de support natif Organizations/teams.**

### 1.4.3 RLS Integration

Le differenciateur principal de Supabase Auth:

- `auth.uid()`: retourne l'UUID de l'utilisateur authentifie
- `auth.jwt()`: retourne le payload JWT complet
- **MAIS**: ce sont des fonctions PostgreSQL custom creees par Supabase -- PAS du SQL standard

### 1.4.4 Quitter Supabase pour AWS

**Si vous quittez la plateforme Supabase hosted, vous perdez Supabase Auth.**

- GoTrue necessite extensions PostgreSQL (`pgjwt`) et permissions `superuser`
- **AWS RDS ne supporte PAS ces pre-requis**

### 1.4.5 Lock-in

| Niveau     | Element                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| **Faible** | Donnees PostgreSQL, export via pg_dump                                    |
| **Moyen**  | Schema `auth` specifique, fonctions `auth.uid()` / `auth.jwt()` a recreer |
| **Eleve**  | Extensions pgjwt non-disponibles sur RDS, schemas manages non-modifiables |

### 1.4.6 Licence et Cout

- **Licence**: Apache 2.0
- **Cout (hosted)**: Free tier = 50,000 MAUs. Pour 100-500 users: **0 EUR**.

## 1.5 Custom JWT (Implementation Maison)

### 1.5.1 Architecture

Implementation entierement custom:

- Generation JWT avec `jose` (deja en dependance FleetCore)
- Stockage sessions dans `adm_member_sessions` (table deja existante)
- Middleware Next.js pour validation
- bcrypt pour hashing (deja en dependance: `bcryptjs`)

### 1.5.2 Ce qui doit etre construit

| Fonctionnalite                     | Effort estime          | Complexite                |
| ---------------------------------- | ---------------------- | ------------------------- |
| Login (email/mot de passe)         | 1-2 jours              | Faible                    |
| Inscription + verification email   | 2-3 jours              | Moyenne                   |
| Forgot/Reset mot de passe          | 1-2 jours              | Moyenne                   |
| Session management (JWT + refresh) | 2-3 jours              | Moyenne                   |
| MFA / TOTP                         | 3-5 jours              | Elevee                    |
| OAuth (Google, etc.)               | 2-3 jours par provider | Moyenne                   |
| Rate limiting                      | 1-2 jours              | Moyenne                   |
| Account lockout                    | 0.5 jour               | Faible (champs existants) |

**Note**: FleetCore dispose deja des champs DB pour `failed_login_attempts`, `locked_until`, `two_factor_enabled`, `two_factor_secret` dans `clt_members`. La table `adm_member_sessions` avec `token_hash`, `expires_at`, `revoked_at` est egalement en place.

### 1.5.3 Avantages et Risques

**Avantages**: Zero dependance externe, controle total, source unique de verite, migration DB = changer DATABASE_URL

**Risques**: Responsabilite totale securite, maintenance patches, pas de communaute pour signaler vulnerabilites

## 1.6 Hybrid AuthAdapter (Pattern avec Backends Swappables)

### 1.6.1 Le Pattern

Une couche d'abstraction avec une interface fixe, derriere laquelle on peut brancher n'importe quel backend d'auth.

### 1.6.2 Projets Implementant ce Pattern

| Projet          | Nom du Pattern           | Swappable?                   |
| --------------- | ------------------------ | ---------------------------- |
| **Refine.dev**  | `AuthProvider` interface | Oui (backends auth)          |
| **react-admin** | `authProvider` objet     | Oui (backends auth)          |
| **Auth.js**     | `Adapter` interface      | Oui (adaptateurs DB)         |
| **Unkey**       | `AuthProvider` abstrait  | Oui (BYOAP)                  |
| **Better Auth** | Architecture plugin      | Oui (DB + provider adapters) |

Source: https://www.unkey.com/blog/auth-abstraction

### 1.6.3 Unkey -- Reference BYOAP

Unkey est la reference la plus forte de ce pattern en production:

- Interface abstraite: le code applicatif ne parle jamais directement au provider
- Implementations: Clerk (production), fake auth (developpement)
- Les self-hosters choisissent leur propre provider

### 1.6.4 Implementation FleetCore

FleetCore pourrait implementer ce pattern avec:

1. Interface `AuthAdapter` (login, logout, getSession, getUser, getPermissions)
2. Implementation `ClerkAuthAdapter` (actuel)
3. Implementation `CustomJWTAuthAdapter` (cible)
4. Configuration via variable d'environnement

**Effort estime**: environ 2-3 jours pour l'interface + 1 adapter.

---

# PARTIE 2 -- Multi-Tenant Sans Clerk

## 2.1 Ce que Clerk Organizations Fournit Aujourd'hui

_Reference: `docs/CLERK_AUDIT.md` pour l'inventaire complet_

### 2.1.1 Fonctionnalites Clerk Organizations Utilisees par FleetCore

| Fonctionnalite              | Implementation FleetCore                                   | Source                    |
| --------------------------- | ---------------------------------------------------------- | ------------------------- |
| **Creation d'organisation** | `clerkClient.organizations.createOrganization()`           | `clerk.service.ts`        |
| **Invitation d'admin**      | `clerkClient.organizations.createOrganizationInvitation()` | `clerk.service.ts`        |
| **Selection d'org (UI)**    | `useOrganizationList()` + `setActive()`                    | `select-org/page.tsx`     |
| **JWT custom claims**       | `org.publicMetadata.tenantId` injecte dans JWT             | `middleware.ts`           |
| **Sync members**            | Webhooks `organizationMembership.created/updated/deleted`  | `webhooks/clerk/route.ts` |
| **Sync orgs**               | Webhooks `organization.created/updated/deleted`            | `webhooks/clerk/route.ts` |
| **Role dans org**           | `org:admin`, `org:member`                                  | webhook handler           |

### 2.1.2 Couplage Chiffre (de CLERK_AUDIT.md)

- **57 fichiers** importent `@clerk/*` (9.1% du codebase)
- **36 fichiers** appellent `auth()` ou `currentUser()`
- **3 tables** avec colonnes `clerk_*`: `clt_members`, `adm_provider_employees`, `adm_tenants`
- **5 colonnes** total: `clerk_user_id` (x2), `clerk_organization_id` (x1)
- **10 variables d'environnement** Clerk

## 2.2 Architecture Multi-Tenant Sans Clerk

### 2.2.1 Tables Necessaires (Deja Existantes)

FleetCore possede **deja** toutes les tables necessaires pour le multi-tenant sans Clerk:

| Table                  | Role                                    | Statut                                                |
| ---------------------- | --------------------------------------- | ----------------------------------------------------- |
| `adm_tenants`          | Organisation/workspace                  | Existe, colonne `clerk_organization_id` nullable      |
| `clt_members`          | Utilisateurs dans un tenant             | Existe, colonne `clerk_user_id` a remplacer           |
| `adm_member_roles`     | Assignation role-membre-tenant          | Existe                                                |
| `adm_roles`            | Definition des roles par tenant         | Existe                                                |
| `adm_role_permissions` | Permissions granulaires resource:action | Existe                                                |
| `adm_member_sessions`  | Sessions utilisateur                    | Existe, avec `token_hash`, `expires_at`, `revoked_at` |
| `adm_invitations`      | Invitations par token                   | Existe, avec `token`, `expires_at`, `status`          |
| `adm_audit_logs`       | Audit complet                           | Existe                                                |

### 2.2.2 Champs Auth Deja Presents dans `clt_members`

```
password_changed_at     TIMESTAMPTZ   -- Suivi changement mot de passe
two_factor_enabled      BOOLEAN       -- Flag MFA
two_factor_secret       VARCHAR       -- Secret TOTP chiffre
failed_login_attempts   INT           -- Compteur tentatives echouees
locked_until            TIMESTAMPTZ   -- Verrouillage compte
email_verified_at       TIMESTAMPTZ   -- Verification email
default_role_id         UUID          -- Role par defaut
```

**Champ MANQUANT**: `password_hash` -- actuellement Clerk gere les mots de passe en externe. Ce champ doit etre ajoute pour une auth custom.

### 2.2.3 Flux Login Sans Clerk

```
1. POST /api/auth/login { email, password }
2. SELECT FROM clt_members WHERE email = $1 AND tenant_id = $2
3. Verifier password_hash avec bcrypt
4. Verifier failed_login_attempts < MAX et locked_until < now()
5. Generer JWT: { sub: member.id, tenantId, roles: [...] }
6. Creer session dans adm_member_sessions: { member_id, token_hash, expires_at }
7. Retourner { accessToken (JWT), refreshToken (session token) }
```

### 2.2.4 Flux Creation Tenant Sans Clerk

```
1. Checkout Stripe complete
2. CustomerConversionService cree adm_tenants (sans clerk_organization_id)
3. Generer verification_token (deja implemente)
4. Envoyer email verification (deja implemente via NotificationQueueService)
5. Admin verifie, remplit formulaire
6. Creer clt_members directement (sans webhook Clerk)
7. Assigner role admin via adm_member_roles
8. Generer JWT avec tenantId inclus
```

### 2.2.5 Flux Invitation Membre Sans Clerk

```
1. Admin cree invitation via API
2. INSERT INTO adm_invitations { tenant_id, email, token, role, expires_at }
3. Envoyer email avec lien: /accept-invitation?token=xxx
4. Destinataire clique, cree son compte
5. INSERT INTO clt_members { tenant_id, email, password_hash, ... }
6. INSERT INTO adm_member_roles { tenant_id, member_id, role_id }
7. Generer JWT, rediriger vers dashboard
```

### 2.2.6 Injection JWT dans Middleware

Actuellement (Clerk):

```typescript
const { userId, orgId, sessionClaims } = await auth();
const tenantId = sessionClaims?.tenantId;
```

Sans Clerk:

```typescript
import { jwtVerify } from "jose";
const token = req.headers.get("authorization")?.replace("Bearer ", "");
const { payload } = await jwtVerify(token, secret);
const { sub: userId, tenantId, roles } = payload;
```

## 2.3 RLS -- Compatibilite avec Prisma

### 2.3.1 Etat Actuel FleetCore

FleetCore utilise **deja** RLS avec Prisma via une approche 100% standard PostgreSQL.

**Fichier**: `lib/prisma/with-provider-context.ts` (242 lignes)

- **47 policies RLS** definies dans la migration FINAL
- Pattern: `current_setting('app.current_tenant_id', true)` (PostgreSQL standard)
- **ZERO utilisation de `auth.uid()`** dans les policies finales
- Seul element Supabase-specifique: le role `TO authenticated`

### 2.3.2 Prisma et RLS: Limitations Connues

**Prisma n'a PAS de support RLS natif** (Feature request #12735 ouverte depuis 2022).

**Solution FleetCore**: Prisma Client Extensions + `$transaction` + `set_config()`.

**Probleme connu**: Transactions interactives avec extensions peuvent causer des requetes bloquantes. Issue: https://github.com/prisma/prisma/issues/23583

### 2.3.3 Alternatives a Postgres RLS avec Prisma

| Solution                                    | Approche                        | Avantage                       | Inconvenient                    |
| ------------------------------------------- | ------------------------------- | ------------------------------ | ------------------------------- |
| **Prisma Extensions + set_config** (actuel) | SQL standard dans transaction   | Portable, enforce au niveau DB | Overhead transaction            |
| **ZenStack**                                | Injection dans arguments Prisma | Database-agnostique            | Pas d'enforcement DB-level      |
| **Yates**                                   | Generation auto de policies     | Automatise la creation RLS     | Dependance tierce               |
| **Middleware Prisma + where**               | Injection applicative           | Simple                         | Relations cassees, contournable |

## 2.4 RLS -- Portabilite

### 2.4.1 current_setting / set_config = PostgreSQL Standard

Fonctionnent identiquement sur: Supabase, AWS RDS, Aurora, Cloud SQL, Self-hosted, Azure DB.

### 2.4.2 auth.uid() et auth.jwt() = Supabase-Specifique

Fonctions PostgreSQL custom creees par Supabase. **FleetCore n'utilise PAS ces fonctions dans ses 47 policies finales.**

### 2.4.3 Seul Element Supabase dans les Policies

Le role `TO authenticated`. Effort pour remplacer: 1 script SQL d'environ 50 lignes.

---

# PARTIE 3 -- Etat Actuel FleetCore

## 3.1 Inventaire des Tables Auth/Tenant

### 3.1.1 `clt_members` -- Utilisateurs Membres

| Colonne               | Type         | Notes                                  |
| --------------------- | ------------ | -------------------------------------- |
| id                    | UUID         | PK, uuid_generate_v4()                 |
| tenant_id             | UUID         | FK adm_tenants, isolation multi-tenant |
| email                 | CITEXT       | Case-insensitive, indexee              |
| clerk_user_id         | VARCHAR(255) | **COUPLAGE CLERK**, indexe             |
| password_changed_at   | TIMESTAMPTZ  | Suivi password                         |
| two_factor_enabled    | BOOLEAN      | Flag MFA                               |
| two_factor_secret     | VARCHAR      | Secret TOTP chiffre                    |
| failed_login_attempts | INT          | Defaut 0, securite                     |
| locked_until          | TIMESTAMPTZ  | Verrouillage compte                    |
| email_verified_at     | TIMESTAMPTZ  | Verification email                     |
| default_role_id       | UUID         | FK adm_roles                           |
| status                | VARCHAR(50)  | active/suspended/inactive              |

**Champ MANQUANT pour auth sans Clerk**: `password_hash`

### 3.1.2 `adm_member_sessions` -- Sessions

| Colonne    | Type         | Notes                    |
| ---------- | ------------ | ------------------------ |
| id         | UUID         | PK                       |
| member_id  | UUID         | FK clt_members (Cascade) |
| token_hash | VARCHAR(256) | **UNIQUE**, hash session |
| ip_address | INET         | IP client                |
| user_agent | TEXT         | Navigateur               |
| expires_at | TIMESTAMPTZ  | Expiration               |
| revoked_at | TIMESTAMPTZ  | Revocation (logout)      |

**Statut**: Table operationnelle, prete pour auth custom.

### 3.1.3 `adm_tenants` -- Organisations/Tenants

| Colonne                       | Type          | Notes                                |
| ----------------------------- | ------------- | ------------------------------------ |
| id                            | UUID          | PK                                   |
| name                          | TEXT          | Nom organisation                     |
| clerk_organization_id         | VARCHAR       | **COUPLAGE CLERK**, unique, nullable |
| verification_token            | VARCHAR(100)  | Token 24h                            |
| verification_token_expires_at | TIMESTAMPTZ   | Expiration token                     |
| verification_completed_at     | TIMESTAMPTZ   | Completion                           |
| admin_name, admin_email       | VARCHAR       | Admin initial                        |
| stripe_customer_id            | VARCHAR(255)  | Couplage Stripe                      |
| status                        | tenant_status | trialing/active/suspended/cancelled  |

### 3.1.4 `adm_roles` -- Roles par Tenant

| Colonne        | Type         | Notes                         |
| -------------- | ------------ | ----------------------------- |
| id             | UUID         | PK                            |
| tenant_id      | UUID         | FK adm_tenants (Cascade)      |
| name           | VARCHAR(100) | Nom du role                   |
| slug           | VARCHAR(100) | **UNIQUE**                    |
| permissions    | JSON         | Permissions (GIN index)       |
| is_system      | BOOLEAN      | Roles systeme non-modifiables |
| is_default     | BOOLEAN      | Role par defaut               |
| parent_role_id | UUID         | Hierarchie (self-ref)         |

### 3.1.5 `adm_role_permissions` -- Permissions Granulaires

| Colonne    | Type         | Notes                        |
| ---------- | ------------ | ---------------------------- |
| role_id    | UUID         | FK adm_roles (Cascade)       |
| resource   | VARCHAR(100) | Quoi (ex: crm_leads)         |
| action     | VARCHAR(50)  | Quoi faire (ex: read, write) |
| conditions | JSON         | Conditions additionnelles    |

Pattern: `resource:action` (ex: `crm_leads:read`, `members:write`)

### 3.1.6 `adm_member_roles` -- Assignation Roles

| Colonne                | Type        | Notes                        |
| ---------------------- | ----------- | ---------------------------- |
| tenant_id              | UUID        | FK adm_tenants               |
| member_id              | UUID        | FK clt_members               |
| role_id                | UUID        | FK adm_roles                 |
| is_primary             | BOOLEAN     | Role principal               |
| scope_type             | ENUM        | department/location/division |
| valid_from/valid_until | TIMESTAMPTZ | Roles temporaires            |

### 3.1.7 `adm_invitations` -- Invitations

| Colonne    | Type         | Notes                             |
| ---------- | ------------ | --------------------------------- |
| tenant_id  | UUID         | FK adm_tenants                    |
| email      | CITEXT       | Email invite                      |
| token      | VARCHAR(255) | **UNIQUE**, token invitation      |
| role       | VARCHAR(100) | Role propose                      |
| status     | ENUM         | pending/accepted/rejected/expired |
| expires_at | TIMESTAMPTZ  | Expiration                        |

### 3.1.8 `adm_provider_employees` -- Staff Plateforme

| Colonne       | Type         | Notes                   |
| ------------- | ------------ | ----------------------- |
| clerk_user_id | VARCHAR(255) | **COUPLAGE CLERK**      |
| provider_id   | UUID         | FK adm_providers        |
| supervisor_id | UUID         | Hierarchie (self-ref)   |
| permissions   | JSON         | Permissions specifiques |

### 3.1.9 Autres tables auth-related

- **`adm_audit_logs`**: Audit complet (entity, action, changes, severity, category, session_id)
- **`adm_role_versions`**: Historique des permissions (version_number, permissions_snapshot, changed_by)

## 3.2 Flux Auth Complets

### 3.2.1 Login

`app/[locale]/(auth)/login/page.tsx` -- Utilise `signIn.create()` puis `setActive()` (Clerk). Force JWT refresh apres activation.

### 3.2.2 Registration

`app/[locale]/(auth)/register/page.tsx` -- Utilise `signUp.create()` + email verification (Clerk). Desactivee par defaut.

### 3.2.3 Forgot/Reset Password

`forgot-password/page.tsx` et `reset-password/page.tsx` -- Utilise `signIn.create()` avec strategie `reset_password_email_code` (Clerk).

### 3.2.4 Selection Organisation

`select-org/page.tsx` -- Utilise `useOrganizationList()` + `setActive()` (Clerk). Auto-select si 1 seule org.

### 3.2.5 Invitation Membre

`accept-invitation/page.tsx` + `webhooks/clerk/route.ts` -- Composant Clerk SignUp + webhook pour sync DB.

### 3.2.6 Creation Tenant

`customer-conversion.service.ts` -- Transaction atomique (adm_tenants + clt_masterdata + crm_leads) puis creation Clerk Organization.

### 3.2.7 Verification Email Tenant

`verification.service.ts` -- Validation token, mise a jour donnees legales, invitation admin via Clerk.

### 3.2.8 Middleware

`middleware.ts` -- 4 couches: API CRM (ADMIN_ORG + role CRM), API Client (tenantId JWT), Admin (/adm/\*), App (orgId).

## 3.3 Donnees: Clerk-Only vs Dupliquees vs FleetCore-Only

### 3.3.1 Donnees UNIQUEMENT dans Clerk

| Donnee                 | Impact migration                                   |
| ---------------------- | -------------------------------------------------- |
| **Password hash**      | **CRITIQUE** -- doit etre ajoute a clt_members     |
| **OAuth tokens**       | A reimplementer si necessaire                      |
| **Email verification** | email_verified_at existe mais pas source de verite |
| **Profile images**     | Non critique                                       |

### 3.3.2 Donnees DUPLIQUEES (Clerk + FleetCore DB)

Email, nom, role dans org, status membre, nom organisation -- synchronises via webhooks.

### 3.3.3 Donnees UNIQUEMENT dans FleetCore DB

tenant_code, roles granulaires (RBAC resource:action), verification tokens, audit logs, role versions, permissions, two-factor config, login attempts, billing/Stripe, masterdata.

### 3.3.4 Analyse de Criticite Migration

| Criticite    | Element                   | Action                              |
| ------------ | ------------------------- | ----------------------------------- |
| **BLOQUANT** | Password hash absent      | Ajouter password_hash, forcer reset |
| **ELEVE**    | 57 fichiers imports Clerk | Refactoring systematique            |
| **ELEVE**    | Middleware auth           | Rewrite middleware                  |
| **MOYEN**    | 6 webhooks Clerk          | Supprimer                           |
| **MOYEN**    | UI auth pages             | Rewrite pages auth                  |
| **FAIBLE**   | 3 colonnes clerk\_\*      | ALTER TABLE                         |
| **FAIBLE**   | 10 env vars Clerk         | Supprimer                           |

---

# PARTIE 4 -- Compatibilite Refine

## 4.1 Refine AuthProvider est-il Auth-Agnostique?

**OUI.** L'interface AuthProvider de Refine est un **pattern adapter pur** -- aucun couplage avec un backend specifique.

### 4.1.1 Interface AuthProvider Refine

```typescript
interface AuthProvider {
  // Requis
  login: (params: any) => Promise<AuthActionResponse>;
  check: (params?: any) => Promise<CheckResponse>;
  logout: (params?: any) => Promise<AuthActionResponse>;
  onError: (error: any) => Promise<OnErrorResponse>;
  // Optionnel
  register?: (params: any) => Promise<AuthActionResponse>;
  forgotPassword?: (params: any) => Promise<AuthActionResponse>;
  updatePassword?: (params: any) => Promise<AuthActionResponse>;
  getPermissions?: (params?: any) => Promise<any>;
  getIdentity?: (params?: any) => Promise<any>;
}
```

Source: https://refine.dev/docs/guides-concepts/authentication/auth-provider-interface/

### 4.1.2 Hooks Refine qui Consomment AuthProvider

| Hook                   | Appelle                         | Usage              |
| ---------------------- | ------------------------------- | ------------------ |
| `useLogin()`           | `authProvider.login()`          | Page de login      |
| `useLogout()`          | `authProvider.logout()`         | Bouton deconnexion |
| `useGetIdentity()`     | `authProvider.getIdentity()`    | Avatar/nom user    |
| `usePermissions()`     | `authProvider.getPermissions()` | RBAC               |
| `useIsAuthenticated()` | `authProvider.check()`          | Guard routes       |
| `useRegister()`        | `authProvider.register()`       | Page inscription   |

### 4.1.3 Impact pour FleetCore

Chaque implementation est environ **80-100 lignes de code**. Changer de Clerk a custom JWT = recrire uniquement l'objet `authProvider`, zero changement dans les composants/hooks.

FleetCore utilise `@refinedev/core 5.0.9` mais l'AuthProvider Refine n'est **PAS encore connecte a Clerk**. L'integration peut donc etre faite directement avec le nouveau systeme d'auth.

## 4.2 Sequencement: Refine vs Auth Migration

### 4.2.1 Option A: Refine d'Abord, Auth Ensuite

Integrer Refine avec Clerk AuthProvider, valider, puis migrer auth et modifier authProvider (~80 lignes).
**+** Migration progressive, testable. **-** Double travail AuthProvider.

### 4.2.2 Option B: Auth d'Abord, Refine Ensuite

Migrer auth, puis integrer Refine directement avec le nouveau backend.
**+** Un seul AuthProvider. **-** Risque plus eleve sans filet Refine.

### 4.2.3 Option C: En Parallele (AuthAdapter abstrait)

Creer interface AuthAdapter, implementer ClerkAdapter, integrer Refine, puis switcher vers CustomAdapter.
**+** Zero-downtime, rollback instantane. **-** Effort initial pour l'abstraction.

### 4.2.4 Donnees Factuelles

| Facteur                                 | Mesure                      |
| --------------------------------------- | --------------------------- |
| Effort Refine AuthProvider              | environ 80 lignes, 0.5 jour |
| Effort migration auth Clerk vers custom | 10-20 jours                 |
| Effort interface AuthAdapter            | environ 2-3 jours           |
| Refine utilise pour auth actuellement?  | Non                         |

---

# PARTIE 5 -- Portabilite Backend

## 5.1 Couplage Supabase -- Inventaire Complet

### 5.1.1 Imports @supabase dans le Code

**ZERO.** Aucun fichier n'importe de package @supabase. `package.json` ne contient aucune dependance @supabase.

### 5.1.2 Variables d'Environnement Supabase

| Variable                             | Utilisee dans le code?      |
| ------------------------------------ | --------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | **NON** (vestige)           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | **NON** (vestige)           |
| `SUPABASE_SERVICE_ROLE_KEY`          | **NON** (vestige)           |
| `DATABASE_URL` (pooler.supabase.com) | **OUI** (Prisma)            |
| `DIRECT_URL` (db.xxx.supabase.co)    | **OUI** (Prisma migrations) |

Les 2 URLs de connexion sont des connection strings PostgreSQL standard -- seul le hostname pointe vers Supabase.

### 5.1.3 Utilisation Effective

| Composant              | Usage Supabase                               | Remplacable par                    |
| ---------------------- | -------------------------------------------- | ---------------------------------- |
| **Base de donnees**    | PostgreSQL heberge                           | AWS RDS, Cloud SQL, self-hosted PG |
| **Connection pooling** | PgBouncer via pooler.supabase.com            | RDS Proxy, PgBouncer self-hosted   |
| **Schema auth**        | Role `authenticated` dans policies           | Role custom                        |
| **Storage**            | Enum avec defaut `supabase` (non implemente) | S3, GCS, Azure Blob                |
| **SDK**                | Aucun                                        | N/A                                |
| **Auth**               | Aucun (Clerk)                                | N/A                                |
| **Realtime**           | Aucun                                        | N/A                                |

## 5.2 Migration Supabase vers AWS

### 5.2.1 Ce qui Change

| Element            | Supabase Actuel     | AWS Equivalent        | Effort       |
| ------------------ | ------------------- | --------------------- | ------------ |
| PostgreSQL         | Supabase hosted     | RDS / Aurora          | Config       |
| Connection pooling | PgBouncer Supabase  | RDS Proxy             | Config       |
| DATABASE_URL       | pooler.supabase.com | xxx.rds.amazonaws.com | 1 variable   |
| RLS role           | `TO authenticated`  | `TO app_user`         | 1 script SQL |

### 5.2.2 Etapes de Migration

1. Provisionner RDS PostgreSQL (ou Aurora)
2. pg_dump depuis Supabase
3. pg_restore vers RDS
4. Creer role `app_user` sur RDS (remplace `authenticated`)
5. Script: UPDATE 47 policies
6. Configurer RDS Proxy ou PgBouncer
7. Mettre a jour DATABASE_URL et DIRECT_URL
8. prisma migrate deploy (verification)
9. Test end-to-end

### 5.2.3 Extensions PostgreSQL Utilisees

uuid-ossp (uuid_generate_v4), citext, GIN indexes, INET type -- **toutes disponibles sur RDS**.

## 5.3 Migration Supabase vers GCP

Processus quasi-identique a AWS: Cloud SQL for PostgreSQL, Cloud SQL Proxy, memes etapes. Extensions uuid-ossp et citext disponibles.

## 5.4 Resume Portabilite

### 5.4.1 Score par Composant

| Composant         | Score | Commentaire                               |
| ----------------- | ----- | ----------------------------------------- |
| Code applicatif   | 10/10 | Zero import @supabase                     |
| Prisma ORM        | 10/10 | Changer DATABASE_URL suffit               |
| RLS Policies (47) | 9/10  | Remplacer role `authenticated`            |
| Migrations SQL    | 10/10 | SQL standard                              |
| Storage           | 10/10 | Non implemente, enum multi-provider prete |
| Tests             | 9/10  | 1 detection pooler a adapter              |
| Env vars          | 8/10  | 3 vars inutiles, 2 URLs a changer         |

### 5.4.2 Effort Total: Migration Supabase vers AWS/GCP

| Tache                         | Effort        |
| ----------------------------- | ------------- |
| Provisionner RDS/Cloud SQL    | 0.5 jour      |
| pg_dump / pg_restore          | 0.5 jour      |
| Script migration role RLS     | 0.5 jour      |
| Configurer connection pooling | 0.5 jour      |
| Mettre a jour env vars        | 0.5 heure     |
| Tests end-to-end              | 1-2 jours     |
| **TOTAL**                     | **3-4 jours** |

**Conclusion factuelle**: FleetCore est **extremement bien decouple de Supabase**. La migration vers AWS ou GCP est une operation d'infrastructure, pas de code.

---

# ANNEXES

## Annexe A -- Comptages Cles

| Metrique                         | Valeur                 | Source               |
| -------------------------------- | ---------------------- | -------------------- |
| Tables dans schema Prisma        | 130+                   | prisma/schema.prisma |
| Tables avec RLS                  | 60+ (annotations)      | Schema Prisma        |
| Policies RLS finales             | 47                     | Migration FINAL      |
| Fichiers importent @clerk        | 57 (9.1%)              | docs/CLERK_AUDIT.md  |
| Fichiers importent @supabase     | 0 (0%)                 | Grep codebase        |
| Colonnes clerk\_\*               | 5 (dans 3 tables)      | Schema Prisma        |
| Occurrences current_setting()    | 268 (dans 61 fichiers) | Grep migrations      |
| Occurrences auth.uid() (finales) | 0                      | Migration FINAL      |
| Env vars Supabase (utilisees)    | 2 (connection strings) | Code analysis        |
| Env vars Supabase (inutilisees)  | 3                      | .env.local           |
| Env vars Clerk                   | 10                     | docs/CLERK_AUDIT.md  |

## Annexe B -- Sources et References

### Documentation Officielle

- Auth.js: https://authjs.dev/
- Better Auth: https://www.better-auth.com/
- Lucia Auth: https://lucia-auth.com/
- Supabase Auth: https://supabase.com/docs/guides/auth/architecture
- Refine AuthProvider: https://refine.dev/docs/guides-concepts/authentication/auth-provider-interface/
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Prisma RLS Example: https://github.com/prisma/prisma-client-extensions/tree/main/row-level-security

### Issues et Discussions

- Auth.js vers Better Auth: https://github.com/nextauthjs/next-auth/discussions/13252
- Lucia Deprecation: https://github.com/lucia-auth/lucia/discussions/1714
- Prisma RLS Feature Request: https://github.com/prisma/prisma/issues/12735
- Prisma Transaction Blocking: https://github.com/prisma/prisma/issues/23583
- Supabase + RDS: https://github.com/orgs/supabase/discussions/21081

### Guides Multi-Tenant RLS

- AWS: https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/
- Google Cloud: https://cloud.google.com/sql/docs/postgres/data-privacy-strategies
- Crunchy Data: https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres

### Adapter Patterns

- Unkey BYOAP: https://www.unkey.com/blog/auth-abstraction
- react-admin authProvider: https://marmelab.com/react-admin/AuthProviderWriting.html
- ZenStack: https://zenstack.dev/blog/multi-tenant

### FleetCore Documents Internes

- `docs/CLERK_AUDIT.md` -- Audit complet du couplage Clerk
- `docs/REFINE_VS_CUSTOM_ANALYSIS.md` -- Analyse Refine vs Custom
- `lib/prisma/with-provider-context.ts` -- Implementation RLS actuelle

---

**FIN DU DOCUMENT**

_Ce document est factuel. Aucune recommandation n'est formulee. Les donnees sont fournies pour que le project owner puisse prendre des decisions eclairees._
