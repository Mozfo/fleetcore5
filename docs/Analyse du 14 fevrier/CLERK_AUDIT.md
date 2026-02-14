# AUDIT FACTUEL — EMPREINTE CLERK DANS FLEETCORE

**Date :** 14 Février 2026
**Branche :** `main`
**Paquet :** `@clerk/nextjs@6.37.3`, `@clerk/backend@2.30.1`
**Méthode :** Comptage exhaustif via grep/glob sur le code source (hors node_modules, .next, dist)

---

## 1. INVENTAIRE DES IMPORTS CLERK

### 1.1 — Liste exhaustive par catégorie

#### Server-side : `auth()` (38 fichiers)

| #   | Fichier                                              | Import exact                                                      |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | `middleware.ts:1`                                    | `clerkMiddleware, createRouteMatcher` from `@clerk/nextjs/server` |
| 2   | `lib/utils/provider-context.ts:19`                   | `auth` from `@clerk/nextjs/server`                                |
| 3   | `lib/auth/clerk-helpers.ts:2`                        | `auth` from `@clerk/nextjs/server`                                |
| 4   | `lib/middleware/auth.middleware.ts:16`               | `auth` from `@clerk/nextjs/server`                                |
| 5   | `lib/actions/crm/lead.actions.ts:18`                 | `auth` from `@clerk/nextjs/server`                                |
| 6   | `lib/actions/crm/opportunity.actions.ts:22`          | `auth` from `@clerk/nextjs/server`                                |
| 7   | `lib/actions/crm/quote.actions.ts:25`                | `auth` from `@clerk/nextjs/server`                                |
| 8   | `lib/actions/crm/orders.actions.ts:26`               | `auth` from `@clerk/nextjs/server`                                |
| 9   | `lib/actions/crm/agreements.actions.ts:27`           | `auth` from `@clerk/nextjs/server`                                |
| 10  | `lib/actions/crm/activities.actions.ts:19`           | `auth, currentUser` from `@clerk/nextjs/server`                   |
| 11  | `lib/actions/crm/qualify.actions.ts:14`              | `auth` from `@clerk/nextjs/server`                                |
| 12  | `lib/actions/crm/bulk.actions.ts:17`                 | `auth` from `@clerk/nextjs/server`                                |
| 13  | `lib/actions/crm/convert.actions.ts:12`              | `auth` from `@clerk/nextjs/server`                                |
| 14  | `lib/actions/crm/delete.actions.ts:15`               | `auth` from `@clerk/nextjs/server`                                |
| 15  | `lib/validators/crm/quote.validators.ts`             | `auth` (via getCurrentProviderId)                                 |
| 16  | `lib/validators/crm/agreement.validators.ts`         | `auth` (via getCurrentProviderId)                                 |
| 17  | `lib/utils/clerk-uuid-mapper.ts`                     | `auth` from `@clerk/nextjs/server`                                |
| 18  | `app/api/crm/demo-leads/[id]/route.ts:2`             | `auth` from `@clerk/nextjs/server`                                |
| 19  | `app/api/crm/demo-leads/[id]/activity/route.ts:2`    | `auth` from `@clerk/nextjs/server`                                |
| 20  | `app/api/crm/demo-leads/[id]/accept/route.ts:2`      | `auth, clerkClient` from `@clerk/nextjs/server`                   |
| 21  | `app/api/crm/leads/[id]/disqualify/route.ts:17`      | `auth` from `@clerk/nextjs/server`                                |
| 22  | `app/api/v1/crm/quotes/route.ts`                     | `auth` from `@clerk/nextjs/server`                                |
| 23  | `app/api/v1/dashboard/layout/route.ts:2`             | `auth` from `@clerk/nextjs/server`                                |
| 24  | `app/api/v1/notifications/stats/route.ts:8`          | `auth` from `@clerk/nextjs/server`                                |
| 25  | `app/api/v1/notifications/send/route.ts:8`           | `auth` from `@clerk/nextjs/server`                                |
| 26  | `app/api/v1/notifications/history/route.ts:8`        | `auth` from `@clerk/nextjs/server`                                |
| 27  | `app/[locale]/(app)/crm/leads/page.tsx:8`            | `auth` from `@clerk/nextjs/server`                                |
| 28  | `app/[locale]/(app)/crm/leads/[id]/page.tsx:12`      | `auth` from `@clerk/nextjs/server`                                |
| 29  | `app/[locale]/(app)/crm/leads/browser/page.tsx:7`    | `auth` from `@clerk/nextjs/server`                                |
| 30  | `app/[locale]/(app)/crm/leads/reports/page.tsx:15`   | `auth` from `@clerk/nextjs/server`                                |
| 31  | `app/[locale]/(app)/crm/opportunities/page.tsx:8`    | `auth` from `@clerk/nextjs/server`                                |
| 32  | `app/[locale]/(app)/crm/quotes/page.tsx:8`           | `auth` from `@clerk/nextjs/server`                                |
| 33  | `app/[locale]/(app)/crm/quotes/[id]/page.tsx:8`      | `auth` from `@clerk/nextjs/server`                                |
| 34  | `app/[locale]/(app)/crm/quotes/new/page.tsx:7`       | `auth` from `@clerk/nextjs/server`                                |
| 35  | `app/[locale]/(app)/crm/quotes/[id]/edit/page.tsx:8` | `auth` from `@clerk/nextjs/server`                                |
| 36  | `app/[locale]/(app)/settings/crm/page.tsx:13`        | `auth` from `@clerk/nextjs/server`                                |

Plus 2 fichiers de test :

- `lib/utils/__tests__/provider-context.test.ts:35`
- `lib/prisma/__tests__/with-provider-context.test.ts:37`

#### Server-side : `currentUser()` (4 fichiers)

| #   | Fichier                                    | Import exact                                    |
| --- | ------------------------------------------ | ----------------------------------------------- |
| 1   | `app/[locale]/(app)/layout.tsx:1`          | `currentUser` from `@clerk/nextjs/server`       |
| 2   | `app/adm/leads/page.tsx:1`                 | `currentUser` from `@clerk/nextjs/server`       |
| 3   | `app/adm/leads/[id]/page.tsx:1`            | `currentUser` from `@clerk/nextjs/server`       |
| 4   | `lib/actions/crm/activities.actions.ts:19` | `auth, currentUser` from `@clerk/nextjs/server` |

#### Server-side : `clerkClient` (3 fichiers)

| #   | Fichier                                         | Import exact                                            |
| --- | ----------------------------------------------- | ------------------------------------------------------- |
| 1   | `app/api/webhooks/clerk/route.ts:3`             | `WebhookEvent, clerkClient` from `@clerk/nextjs/server` |
| 2   | `lib/services/clerk/clerk.service.ts:16`        | `clerkClient` from `@clerk/nextjs/server`               |
| 3   | `app/api/crm/demo-leads/[id]/accept/route.ts:2` | `auth, clerkClient` from `@clerk/nextjs/server`         |

#### Server-side : `createClerkClient` (2 fichiers — scripts/testing)

| #   | Fichier                             | Import exact                              |
| --- | ----------------------------------- | ----------------------------------------- |
| 1   | `scripts/create-admin-user.ts:16`   | `createClerkClient` from `@clerk/backend` |
| 2   | `lib/testing/clerk-test-auth.ts:26` | `createClerkClient` from `@clerk/backend` |

#### Client-side : Hooks (12 fichiers)

| #   | Fichier                                            | Hook(s)                           |
| --- | -------------------------------------------------- | --------------------------------- |
| 1   | `components/app/AppHeader.tsx:4`                   | `UserButton, useUser`             |
| 2   | `components/layout/site-header.tsx:3`              | `useUser, UserButton`             |
| 3   | `lib/hooks/useDashboardLayout.ts:5`                | `useUser`                         |
| 4   | `app/[locale]/(app)/dashboard/page.tsx:3`          | `useUser`                         |
| 5   | `lib/hooks/useHasPermission.ts:3`                  | `useOrganization`                 |
| 6   | `app/[locale]/(auth)/login/page.tsx:6`             | `useSignIn, useSession`           |
| 7   | `app/[locale]/(auth)/register/page.tsx:6`          | `useSignUp`                       |
| 8   | `app/[locale]/(auth)/forgot-password/page.tsx:6`   | `useSignIn`                       |
| 9   | `app/[locale]/(auth)/reset-password/page.tsx:6`    | `useSignIn`                       |
| 10  | `app/[locale]/(auth)/select-org/page.tsx:4`        | `useOrganizationList, useAuth`    |
| 11  | `app/[locale]/(auth)/login/tasks/page.tsx:6`       | `useOrganizationList, useClerk`   |
| 12  | `app/[locale]/(auth)/accept-invitation/page.tsx:5` | (composant `SignUp`, pas un hook) |

#### Composants UI Clerk (5 fichiers, 2 composants distincts)

| #   | Fichier                                             | Composant      | Customisé ?                                                                                                                   |
| --- | --------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | `components/app/AppHeader.tsx:88`                   | `<UserButton>` | Oui — `appearance.elements.avatarBox: "h-9 w-9"`                                                                              |
| 2   | `components/layout/site-header.tsx:46`              | `<UserButton>` | Oui — `appearance.elements.avatarBox: "h-9 w-9"`                                                                              |
| 3   | `components/crm/layout/CrmTopBar.tsx:34`            | `<UserButton>` | Non — stock avec `afterSignOutUrl`                                                                                            |
| 4   | `app/adm/layout.tsx:78`                             | `<UserButton>` | Non — stock avec `afterSignOutUrl`                                                                                            |
| 5   | `app/[locale]/(auth)/accept-invitation/page.tsx:30` | `<SignUp>`     | Oui — 7 éléments appearance (rootBox, card, headerTitle, headerSubtitle, formButtonPrimary, formFieldInput, footerActionLink) |

#### Provider racine (1 fichier)

| #   | Fichier            | Composant                                                      |
| --- | ------------------ | -------------------------------------------------------------- |
| 1   | `app/layout.tsx:2` | `<ClerkProvider>` — aucune prop appearance, wraps `{children}` |

#### Webhook (1 fichier)

| #   | Fichier                             | Import                                                  |
| --- | ----------------------------------- | ------------------------------------------------------- |
| 1   | `app/api/webhooks/clerk/route.ts:3` | `WebhookEvent, clerkClient` from `@clerk/nextjs/server` |

### 1.2 — Comptage

| Métrique                               | Valeur                            |
| -------------------------------------- | --------------------------------- |
| Fichiers importent `@clerk/*`          | **57** (dont 4 tests + 2 scripts) |
| Lignes d'import `@clerk/*`             | **57** (1 import par fichier)     |
| Fichiers avec `auth()` server-side     | **38** (dont 2 tests)             |
| Fichiers avec `currentUser()`          | **4**                             |
| Fichiers avec hooks client Clerk       | **12**                            |
| Composants UI Clerk distincts          | **2** (`UserButton`, `SignUp`)    |
| Fichiers rendant un composant UI Clerk | **5**                             |

---

## 2. ANALYSE DU MIDDLEWARE

**Fichier :** `middleware.ts` — **351 lignes**

### Ce que Clerk fait

| Ligne(s) | Fonction Clerk                                  | Rôle                                                                         |
| -------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| 1        | `clerkMiddleware`                               | Wrapper principal — intercepte toutes les requêtes, injecte le contexte auth |
| 1        | `createRouteMatcher`                            | Définit les patterns de routes protégées                                     |
| 54       | `clerkMiddleware(async (auth, req) => { ... })` | Callback principal — Clerk fournit la fonction `auth`                        |
| 67       | `await auth()`                                  | Extraction userId, orgId, sessionClaims, orgRole depuis JWT Clerk            |
| 230      | `await auth()`                                  | Idem pour routes `/adm/*`                                                    |
| 255      | `await auth()`                                  | Idem pour routes `/crm/*`                                                    |
| 295      | `await auth()`                                  | Idem pour routes `/dashboard/*`                                              |
| 322      | `await auth.protect()`                          | Protection automatique des routes matchées                                   |

### Logique Clerk vs FleetCore custom

| Bloc                    | Lignes  | Nature                                                                                                        |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| Import + constantes     | 1-51    | 2 lignes Clerk, 49 lignes config FleetCore (rôles, rate limiting)                                             |
| Routes API CRM internes | 111-163 | `auth()` = 1 appel Clerk ; reste = logique FleetCore (org check, role check, rate limiting, header injection) |
| Routes API Client       | 164-221 | `sessionClaims.tenantId` = 1 lecture Clerk ; reste = logique FleetCore (rate limiting, header injection)      |
| Routes /adm             | 228-251 | `auth()` = 1 appel Clerk ; reste = logique FleetCore (org check, role check, redirect)                        |
| Routes /crm             | 253-288 | `auth()` = 1 appel Clerk ; reste = logique FleetCore                                                          |
| Routes /dashboard       | 294-315 | `auth()` = 1 appel Clerk ; reste = logique FleetCore                                                          |
| Locale + protect        | 317-338 | `auth.protect()` = 1 appel Clerk ; reste = logique locale                                                     |

**Ratio estimé :** ~10 lignes d'appels Clerk directs / ~340 lignes de logique FleetCore custom.
Le middleware utilise Clerk **exclusivement** pour extraire `{ userId, orgId, orgRole, sessionClaims }`. Toute la logique de routage, autorisation, rate limiting et header injection est FleetCore.

---

## 3. ANALYSE DU SYSTÈME D'ORGANIZATIONS

### 3.1 — Utilisation des Organizations Clerk

**Hooks Organisation côté client :**

| Hook                    | Fichier                                       | Usage                                                 |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------- |
| `useOrganization()`     | `lib/hooks/useHasPermission.ts:33`            | Extrait `membership.role` pour le RBAC                |
| `useOrganizationList()` | `app/[locale]/(auth)/select-org/page.tsx:27`  | Liste les orgs de l'utilisateur pour sélection        |
| `useOrganizationList()` | `app/[locale]/(auth)/login/tasks/page.tsx:12` | Auto-sélection d'org après login                      |
| `useAuth()`             | `app/[locale]/(auth)/select-org/page.tsx:34`  | `getToken({ skipCache: true })` après sélection d'org |
| `useClerk()`            | `app/[locale]/(auth)/login/tasks/page.tsx:17` | `setActive({ organization })`                         |

**`orgId` côté serveur (`auth().orgId`) :**

Utilisé dans **38 fichiers** (même liste que section 1.1). Pattern type :

```typescript
const { userId, orgId } = await auth();
if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
  return { success: false, error: "Forbidden" };
}
```

### 3.2 — Couplage avec le multi-tenant FleetCore

**Fichier central :** `lib/utils/provider-context.ts` — **193 lignes**

**Mécanisme :**

1. `getCurrentProviderId()` (ligne 50) appelle `auth()` → obtient `userId`
2. Lookup `adm_provider_employees` par `clerk_user_id = userId`
3. Retourne `provider_id` (division UUID) ou `null` (accès global)

**Fichiers appelant `getCurrentProviderId()` :** **18 fichiers**

| #     | Fichier                                           |
| ----- | ------------------------------------------------- |
| 1     | `lib/utils/provider-context.ts` (définition)      |
| 2     | `lib/prisma/with-provider-context.ts`             |
| 3     | `lib/actions/crm/lead.actions.ts`                 |
| 4     | `lib/actions/crm/opportunity.actions.ts`          |
| 5     | `lib/actions/crm/quote.actions.ts`                |
| 6     | `lib/actions/crm/orders.actions.ts`               |
| 7     | `lib/actions/crm/agreements.actions.ts`           |
| 8     | `lib/actions/crm/activities.actions.ts`           |
| 9     | `lib/actions/crm/qualify.actions.ts`              |
| 10    | `lib/actions/crm/bulk.actions.ts`                 |
| 11    | `lib/actions/crm/convert.actions.ts`              |
| 12    | `lib/actions/crm/delete.actions.ts`               |
| 13    | `lib/validators/crm/quote.validators.ts`          |
| 14    | `lib/validators/crm/agreement.validators.ts`      |
| 15    | `lib/services/crm/opportunity-rotting.service.ts` |
| 16-18 | 3 fichiers de test                                |

**Fichiers appelant `buildProviderFilter()` :** **10 fichiers** (+ 1 test)

- `lib/actions/crm/lead.actions.ts` (2 occurrences)
- `lib/actions/crm/opportunity.actions.ts` (5 occurrences)
- `lib/actions/crm/activities.actions.ts` (7 occurrences)
- `lib/actions/crm/qualify.actions.ts` (1 occurrence)
- `lib/actions/crm/bulk.actions.ts` (3 occurrences)
- `lib/actions/crm/convert.actions.ts` (1 occurrence)
- `lib/actions/crm/delete.actions.ts` (2 occurrences)
- `lib/services/crm/opportunity-rotting.service.ts` (3 occurrences)
- `lib/utils/provider-context.ts` (définition)
- `lib/utils/__tests__/provider-context.test.ts` (4 occurrences test)

**Total occurrences `buildProviderFilter()` dans le code :** 24 appels + 4 en tests

---

## 4. ANALYSE DU RBAC

**Fichier :** `lib/config/permissions.ts` — **239 lignes**

### Structure

```typescript
type OrgRole = "org:admin" | "org:adm_admin" | "org:adm_commercial" | "org:adm_support"
             | "org:provider_admin" | "org:provider_manager" | "org:provider_user";

type Permission = `${ModuleKey}:${PermissionAction}`;
// Ex: "crm:view", "fleet:edit", "admin:delete"

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = { ... };
// 7 rôles → 4 à 30 permissions chacun
```

### Fonctions exportées

| Fonction                          | Lignes  | Dépendance Clerk                     |
| --------------------------------- | ------- | ------------------------------------ |
| `hasPermission(role, permission)` | 189-197 | **Aucune** — prend un `role: string` |
| `hasModuleAccess(role, module)`   | 202-210 | **Aucune** — prend un `role: string` |
| `getPermissionsForRole(role)`     | 215-220 | **Aucune** — prend un `role: string` |
| `getAccessibleModules(role)`      | 225-238 | **Aucune** — prend un `role: string` |

### Consommateurs de `hasPermission()` (depuis `lib/config/permissions.ts`)

| #   | Fichier                                 | Usage                                       |
| --- | --------------------------------------- | ------------------------------------------- |
| 1   | `lib/hooks/useHasPermission.ts:56`      | `hasPermission(orgRole, permission)`        |
| 2   | `lib/hooks/useHasPermission.ts:70`      | `canAll` via `hasPermission`                |
| 3   | `lib/hooks/useHasPermission.ts:77`      | `canAny` via `hasPermission`                |
| 4   | `components/app/ModulesSidebar.tsx:264` | `hasPermission(orgRole, subNav.permission)` |

### Consommateurs de `hasPermission()` (depuis `lib/auth/permissions.ts` — version DB)

| #   | Fichier                                             | Usage                                                 |
| --- | --------------------------------------------------- | ----------------------------------------------------- |
| 1   | `app/api/v1/directory/vehicle-classes/route.ts:117` | `hasPermission(userId, tenantId, "manage_directory")` |
| 2   | `app/api/v1/directory/platforms/route.ts:111`       | `hasPermission(userId, tenantId, "manage_directory")` |
| 3   | `app/api/v1/directory/makes/route.ts:105`           | `hasPermission(userId, tenantId, "manage_directory")` |
| 4   | `app/api/v1/directory/models/route.ts:42`           | `hasPermission(userId, tenantId, "manage_directory")` |

### Consommateurs de `useHasPermission()` hook

| #   | Fichier                                    |
| --- | ------------------------------------------ |
| 1   | `components/layout/app-sidebar.tsx`        |
| 2   | `components/layout/header/search.tsx`      |
| 3   | `components/app/ModulesSidebar.tsx`        |
| 4   | `components/app/widgets/DashboardGrid.tsx` |
| 5   | `lib/hooks/useHasPermission.ts` (self)     |

### Le RBAC pourrait-il fonctionner sans Clerk ?

**OUI.** Les fonctions `hasPermission()`, `hasModuleAccess()`, `getPermissionsForRole()`, `getAccessibleModules()` dans `lib/config/permissions.ts` prennent un `role: string` en entrée. Elles n'importent rien de Clerk.

Le seul point de couplage est `useHasPermission()` (ligne 33) :

```typescript
const { membership } = useOrganization(); // ← Clerk
const orgRole = membership?.role as OrgRole;
```

**Pour découpler :** Remplacer cette ligne par n'importe quel moyen d'obtenir le rôle de l'utilisateur (Supabase JWT claim, session, contexte custom, etc.). Le reste du système RBAC est **agnostique de la source d'auth**.

---

## 5. ANALYSE DES WEBHOOKS

**Fichier unique :** `app/api/webhooks/clerk/route.ts` — **362 lignes**

### Événements traités

| Événement Clerk                  | Action FleetCore                                             | Table(s) affectée(s) |
| -------------------------------- | ------------------------------------------------------------ | -------------------- |
| `organization.created`           | Crée `adm_tenants` + sync tenantId vers Clerk publicMetadata | `adm_tenants`        |
| `organization.updated`           | Met à jour `adm_tenants.name` + re-sync publicMetadata       | `adm_tenants`        |
| `organization.deleted`           | Soft delete `adm_tenants` (deleted_at)                       | `adm_tenants`        |
| `organizationMembership.created` | Crée `clt_members` + envoie email de bienvenue               | `clt_members`        |
| `organizationMembership.updated` | Met à jour `clt_members.role`                                | `clt_members`        |
| `organizationMembership.deleted` | Soft delete `clt_members` (deleted_at, deleted_by)           | `clt_members`        |

### Tables alimentées par webhooks

| Table         | Champs Clerk                     | Webhook source                                 |
| ------------- | -------------------------------- | ---------------------------------------------- |
| `adm_tenants` | `clerk_organization_id`, `name`  | organization.created/updated/deleted           |
| `clt_members` | `clerk_user_id`, `email`, `role` | organizationMembership.created/updated/deleted |

### Conséquence de la suppression des webhooks

- **`adm_tenants`** ne serait plus synchronisé automatiquement avec les orgs Clerk → il faudrait une autre source pour créer les tenants
- **`clt_members`** ne serait plus synchronisé → les membres ne seraient plus créés/mis à jour automatiquement → les emails de bienvenue ne partiraient plus
- **La donnée `tenantId` dans Clerk publicMetadata** ne serait plus injectée → le middleware ne pourrait plus extraire `sessionClaims.tenantId` → toutes les routes Client API casseraient

**Note :** Le `ClerkService` (`lib/services/clerk/clerk.service.ts`) peut créer des orgs proactivement (sans webhook), mais la synchro des membres dépend exclusivement du webhook.

---

## 6. ANALYSE DES COMPOSANTS UI CLERK

### Inventaire

| Composant         | Fichiers                      | Props utilisées                                    | Effort de remplacement                                                |
| ----------------- | ----------------------------- | -------------------------------------------------- | --------------------------------------------------------------------- |
| `<UserButton>`    | 4 fichiers                    | `afterSignOutUrl`, `appearance.elements.avatarBox` | ~30-50 lignes par instance (avatar dropdown + sign-out button + menu) |
| `<SignUp>`        | 1 fichier (accept-invitation) | `appearance` (7 éléments)                          | ~200-300 lignes (formulaire complet d'inscription avec validation)    |
| `<ClerkProvider>` | 1 fichier (app/layout.tsx)    | Aucune                                             | Remplacer par un provider d'auth custom                               |

### Détail `<UserButton>` (4 instances)

- `components/app/AppHeader.tsx:88-95` — Avatar 9x9, afterSignOutUrl="/"
- `components/layout/site-header.tsx:46-53` — Avatar 9x9, afterSignOutUrl="/"
- `components/crm/layout/CrmTopBar.tsx:34` — Stock, afterSignOutUrl dynamique
- `app/adm/layout.tsx:78` — Stock, afterSignOutUrl="/en"

**Fonctionnalités fournies par `<UserButton>` :**

- Avatar de l'utilisateur
- Dropdown avec : nom, email, manage account, sign out
- Gestion de session (sign-out)

### Détail `<SignUp>` (1 instance)

- `app/[locale]/(auth)/accept-invitation/page.tsx:30-43` — Formulaire complet d'acceptation d'invitation avec thème custom

### Pages d'auth custom (headless Clerk)

FleetCore n'utilise **PAS** les composants `<SignIn>`, `<SignUp>` pré-fabriqués pour les flows principaux. Au lieu de ça :

| Page                                         | Lignes | Hook Clerk                        | UI Custom                                                          |
| -------------------------------------------- | ------ | --------------------------------- | ------------------------------------------------------------------ |
| Login (`login/page.tsx`)                     | 357    | `useSignIn`, `useSession`         | Formulaire custom complet (email/password + validation + redirect) |
| Register (`register/page.tsx`)               | 460    | `useSignUp`                       | Formulaire custom complet (multi-step avec verification email)     |
| Forgot Password (`forgot-password/page.tsx`) | 127    | `useSignIn`                       | Formulaire custom                                                  |
| Reset Password (`reset-password/page.tsx`)   | 301    | `useSignIn`                       | Formulaire custom (code + nouveau password)                        |
| Select Org (`select-org/page.tsx`)           | 207    | `useOrganizationList`, `useAuth`  | Liste custom d'organisations                                       |
| Post-login Tasks (`login/tasks/page.tsx`)    | 95     | `useOrganizationList`, `useClerk` | Auto-select org                                                    |

**Total lignes des pages d'auth custom :** ~1547 lignes

---

## 7. ANALYSE DU PACKAGE.JSON

### Paquets installés

| Paquet           | Version   | Type                        |
| ---------------- | --------- | --------------------------- |
| `@clerk/nextjs`  | `^6.37.3` | dependencies (ligne 47)     |
| `@clerk/backend` | `^2.30.1` | devDependencies (ligne 121) |

### Taille dans node_modules (via pnpm, incluant dépendances transitives)

| Paquet                                  | Taille réelle (suivant les symlinks) |
| --------------------------------------- | ------------------------------------ |
| `@clerk/nextjs@6.37.3` (+ transitives)  | **175 MB**                           |
| `@clerk/backend@2.30.1` (+ transitives) | **9.5 MB**                           |
| **Total Clerk**                         | **~185 MB**                          |

**Note :** @clerk/nextjs inclut des dépendances lourdes : @clerk/shared, @clerk/types, @clerk/clerk-react, crypto, etc. Sur un node_modules total de 2.1 GB, Clerk représente **~8.8%**.

### Dépendance transitive notable

- `svix` — utilisé pour la vérification des webhooks (`app/api/webhooks/clerk/route.ts:1`)

---

## 8. ANALYSE DE LA CONFIGURATION

### Variables d'environnement Clerk

| Variable                                          | Fichier source                          | Usage                                      |
| ------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`               | `.env.local:1`                          | Clé publique pour le frontend              |
| `CLERK_SECRET_KEY`                                | `.env.local:2`                          | Clé secrète pour le backend                |
| `CLERK_WEBHOOK_SECRET`                            | `.env.local:3`                          | Secret de vérification des webhooks (svix) |
| `FLEETCORE_ADMIN_ORG_ID`                          | `.env.local` (ref dans middleware.ts:8) | ID de l'org FleetCore Admin                |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`                   | `.env.local:41`                         | `/en/login`                                |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`                   | `.env.local:42`                         | `/en/register`                             |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `.env.local:43`                         | `/en/dashboard`                            |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `.env.local:44`                         | `/en/dashboard`                            |
| `CLERK_JWT_TEMPLATE_NAME`                         | `.env.test:14`                          | `test-api` (tests uniquement)              |
| `CLERK_TEST_TOKEN_LIFETIME`                       | `.env.test:15`                          | `86400` (tests uniquement)                 |

**Total : 10 variables d'environnement** (dont 2 uniquement pour les tests)

### Configuration next.config.ts

**Aucune configuration Clerk** dans `next.config.ts`. Pas de `clerk` key, pas de transpilePackages, pas de rewrites Clerk.

### Fichiers de configuration Clerk dédiés

| Fichier                               | Rôle                                                                                       | Lignes |
| ------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| `lib/services/clerk/clerk.service.ts` | Service singleton — create org, invite admin, update metadata                              | 263    |
| `lib/auth/clerk-helpers.ts`           | Helpers middleware — getCurrentUser, getTenantId, validateTenantAccess, getMemberByClerkId | 185    |
| `lib/testing/clerk-test-auth.ts`      | Test helper — create/cleanup test users/orgs/sessions                                      | 857    |
| `scripts/create-admin-user.ts`        | Script CLI — créer le user admin Playwright                                                | 130    |

---

## 9. CARTOGRAPHIE DES DÉPENDANCES

```
Clerk (@clerk/nextjs + @clerk/backend)
│
├── app/layout.tsx
│   └── <ClerkProvider> (wraps entire app)
│
├── middleware.ts (351 lignes)
│   ├── clerkMiddleware() — wrapper
│   ├── auth() — extrait userId, orgId, orgRole, sessionClaims
│   ├── auth.protect() — protection auto des routes matchées
│   └── Logique FleetCore : org check, role check, rate limiting, headers
│
├── Server Actions (10 fichiers)
│   ├── lead.actions.ts — auth() ligne 18
│   ├── opportunity.actions.ts — auth() ligne 22
│   ├── quote.actions.ts — auth() ligne 25
│   ├── orders.actions.ts — auth() ligne 26
│   ├── agreements.actions.ts — auth() ligne 27
│   ├── activities.actions.ts — auth() + currentUser() ligne 19
│   ├── qualify.actions.ts — auth() ligne 14
│   ├── bulk.actions.ts — auth() ligne 17
│   ├── convert.actions.ts — auth() ligne 12
│   └── delete.actions.ts — auth() ligne 15
│
├── API Routes (12 fichiers avec auth())
│   ├── CRM: demo-leads/[id], demo-leads/[id]/activity, demo-leads/[id]/accept
│   ├── CRM: leads/[id]/disqualify, v1/crm/quotes
│   ├── Client: v1/dashboard/layout
│   └── Notifications: v1/notifications/{stats,send,history}
│
├── Pages Server Components (11 fichiers avec auth())
│   ├── CRM: leads, leads/[id], leads/browser, leads/reports
│   ├── CRM: opportunities, quotes, quotes/[id], quotes/new, quotes/[id]/edit
│   ├── Settings: settings/crm
│   └── ADM: adm/leads (via currentUser)
│
├── Client Components — Hooks (12 fichiers)
│   ├── useUser() — 4 fichiers (AppHeader, site-header, dashboard, useDashboardLayout)
│   ├── useOrganization() — 1 fichier (useHasPermission)
│   ├── useSignIn() — 3 fichiers (login, forgot-password, reset-password)
│   ├── useSignUp() — 1 fichier (register)
│   ├── useOrganizationList() — 2 fichiers (select-org, login/tasks)
│   ├── useAuth() — 1 fichier (select-org)
│   ├── useClerk() — 1 fichier (login/tasks)
│   └── useSession() — 1 fichier (login)
│
├── UI Components (5 fichiers)
│   ├── <UserButton> — 4 fichiers (AppHeader, site-header, CrmTopBar, adm/layout)
│   └── <SignUp> — 1 fichier (accept-invitation)
│
├── Webhook (1 endpoint)
│   └── app/api/webhooks/clerk/route.ts (362 lignes)
│       ├── organization.created → adm_tenants
│       ├── organization.updated → adm_tenants
│       ├── organization.deleted → adm_tenants (soft delete)
│       ├── organizationMembership.created → clt_members + email
│       ├── organizationMembership.updated → clt_members
│       └── organizationMembership.deleted → clt_members (soft delete)
│
├── RBAC (lib/config/permissions.ts → 5 consommateurs)
│   ├── useHasPermission() hook — 5 fichiers UI
│   └── hasPermission() direct — 1 fichier UI + 4 API routes (version DB)
│
├── Multi-tenant (lib/utils/provider-context.ts → 18 consommateurs)
│   ├── getCurrentProviderId() — 18 fichiers
│   └── buildProviderFilter() — 10 fichiers (24 appels)
│
└── Infrastructure
    ├── lib/services/clerk/clerk.service.ts (263 lignes) — org management
    ├── lib/auth/clerk-helpers.ts (185 lignes) — tenant cache/lookup
    ├── lib/testing/clerk-test-auth.ts (857 lignes) — test auth
    └── scripts/create-admin-user.ts (130 lignes) — admin setup
```

---

## 10. SYNTHÈSE QUANTITATIVE

| Métrique                                            | Valeur                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| Fichiers totaux du projet (.ts/.tsx/.js/.jsx)       | **624**                                                          |
| Fichiers qui importent `@clerk/*`                   | **57** (soit **9.1%** du projet)                                 |
| — dont fichiers de production                       | **51**                                                           |
| — dont fichiers de test                             | **4**                                                            |
| — dont scripts                                      | **2**                                                            |
| Server Actions avec `auth()`                        | **10** fichiers                                                  |
| API Routes avec `auth()`                            | **8** fichiers                                                   |
| Pages Server Components avec `auth()`               | **11** fichiers                                                  |
| Fichiers middleware/helpers avec `auth()`           | **3** fichiers                                                   |
| Validators avec `auth()` (via getCurrentProviderId) | **2** fichiers                                                   |
| Total fichiers appelant `auth()`                    | **36** (hors tests)                                              |
| Client components avec hooks Clerk                  | **12** fichiers                                                  |
| Composants UI Clerk distincts                       | **2** (`UserButton`, `SignUp`)                                   |
| Instances UI Clerk rendues                          | **5** (4 UserButton + 1 SignUp)                                  |
| Webhooks Clerk                                      | **1** endpoint, **6** événements traités                         |
| Variables d'environnement Clerk                     | **10** (dont 2 tests)                                            |
| Tables DB avec colonnes `clerk_*`                   | **3** (`adm_tenants`, `clt_members`, `adm_provider_employees`)   |
| Tables alimentées par webhooks                      | **2** (`adm_tenants`, `clt_members`)                             |
| Taille node_modules Clerk                           | **~185 MB** (8.8% du total)                                      |
| Fichiers d'infrastructure Clerk dédiés              | **4** (clerk.service + clerk-helpers + test-auth + create-admin) |
| Lignes totales infrastructure Clerk                 | **1435** lignes                                                  |
| `getCurrentProviderId()` consommateurs              | **18** fichiers                                                  |
| `buildProviderFilter()` appels                      | **24** (dans 10 fichiers)                                        |
| `useHasPermission()` consommateurs                  | **5** fichiers                                                   |
| `hasPermission()` consommateurs (config)            | **4** fichiers                                                   |
| `hasPermission()` consommateurs (DB)                | **4** fichiers API routes                                        |
| Pages auth custom (headless Clerk)                  | **6** pages, **~1547** lignes                                    |

### Colonnes `clerk_*` dans le schéma Prisma

| Table                    | Colonne                 | Type      | Contrainte                              |
| ------------------------ | ----------------------- | --------- | --------------------------------------- |
| `adm_tenants`            | `clerk_organization_id` | `String?` | `@unique`                               |
| `clt_members`            | `clerk_user_id`         | `String`  | Index + unique composite avec tenant_id |
| `adm_provider_employees` | `clerk_user_id`         | `String`  | `@unique`                               |

---

_Document généré par comptage exhaustif du code source._
_Chaque fichier et numéro de ligne est vérifiable dans le repository._
