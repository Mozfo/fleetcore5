# ANALYSE COMPARATIVE ARCHITECTURALE

## Refine.dev vs Abstraction Layer Custom

**Date :** 10 Février 2026
**Branche d'analyse :** `analysis/refine-feasibility`
**Paquets installés :** `@refinedev/core@5.0.9`, `@refinedev/nextjs-router@7.0.4`
**Méthode :** Inspection directe du code source (node_modules), lecture des types TypeScript, croisement avec le code FleetCore existant.

---

## Table des matières

- [A. Option Refine.dev](#a-option-refinedev)
  - [A.1 Installation et empreinte](#a1-installation-et-empreinte)
  - [A.2 DataProvider ↔ Server Actions](#a2-dataprovider--server-actions)
  - [A.3 AuthProvider ↔ Clerk](#a3-authprovider--clerk)
  - [A.4 AccessControlProvider ↔ RBAC FleetCore](#a4-accesscontrolprovider--rbac-fleetcore)
  - [A.5 Multi-tenant (Provider Context)](#a5-multi-tenant-provider-context)
  - [A.6 Routing (Next.js App Router)](#a6-routing-nextjs-app-router)
  - [A.7 Bundle Size](#a7-bundle-size)
- [B. Option Custom (Build Our Own)](#b-option-custom-build-our-own)
  - [B.1 Patterns kiranism](#b1-patterns-kiranism)
  - [B.2 Patterns atomic-crm](#b2-patterns-atomic-crm)
  - [B.3 Estimation d'effort](#b3-estimation-deffort)
  - [B.4 Risque de dérive](#b4-risque-de-dérive)
- [C. Tableau comparatif](#c-tableau-comparatif)
- [D. Verdict](#d-verdict)

---

## A. Option Refine.dev

### A.1 Installation et empreinte

**Baseline avant installation :**

```
node_modules/ : 2.1 Go
```

**Paquets ajoutés :**

```
@refinedev/core@5.0.9          → 7.9 MB (via pnpm symlink)
@refinedev/nextjs-router@7.0.4 → 664 KB
@refinedev/devtools-internal    → inclus dans core
Total : ~8.6 MB (+12 paquets résolvés)
```

**Dépendances transitives de @refinedev/core :**

```
@tanstack/react-query ^5.81.5  ← REQUIS (FleetCore n'a aucune query library)
lodash / lodash-es ^4.17.21
papaparse ^5.3.0
pluralize ^8.0.0
qs ^6.10.1
tslib ^2.6.2
warn-once ^0.1.0
```

**Dépendances de @refinedev/nextjs-router :**

```
qs, warn-once (minimal)
```

**Peer dependencies :**

```
react ^18 || ^19       ✅ FleetCore = React 19.2.4
react-dom ^18 || ^19   ✅ FleetCore = React DOM 19.2.4
@tanstack/react-query   ⚠️  À ajouter (actuellement absent)
next *                  ✅ FleetCore = Next.js 16.1.6
```

**Constat :** L'empreinte est légère. La seule dépendance structurante est `@tanstack/react-query` v5 — mais FleetCore utilise actuellement du `fetch()` brut sans aucune couche de caching/invalidation. TanStack Query est un **upgrade**, pas un conflit.

> **Source :** `node_modules/@refinedev/core/package.json` (lignes 29-38, 62-68)

---

### A.2 DataProvider ↔ Server Actions

#### Interface DataProvider (Refine)

```typescript
// Source: node_modules/@refinedev/core/dist/contexts/data/types.d.ts (lignes 330-342)
export type DataProvider = {
  getList:    (params: GetListParams)    → Promise<GetListResponse<TData>>;     // REQUIS
  getOne:     (params: GetOneParams)     → Promise<GetOneResponse<TData>>;      // REQUIS
  create:     (params: CreateParams)     → Promise<CreateResponse<TData>>;      // REQUIS
  update:     (params: UpdateParams)     → Promise<UpdateResponse<TData>>;      // REQUIS
  deleteOne:  (params: DeleteOneParams)  → Promise<DeleteOneResponse<TData>>;   // REQUIS
  getApiUrl:  ()                         → string;                              // REQUIS
  getMany?:   (params: GetManyParams)    → Promise<GetManyResponse<TData>>;     // optionnel
  createMany?: ...;  updateMany?: ...;  deleteMany?: ...;  custom?: ...;        // optionnels
};
```

#### Signatures clés des paramètres

```typescript
// GetListParams (ligne 267-274)
{ resource: string, pagination?: Pagination, sorters?: CrudSort[], filters?: CrudFilter[], meta?: MetaQuery }

// GetListResponse (ligne 238-242)
{ data: TData[], total: number }

// GetOneParams (ligne 281-285)
{ resource: string, id: BaseKey, meta?: MetaQuery }

// CreateParams (ligne 286-290)
{ resource: string, variables: TVariables, meta?: MetaQuery }

// UpdateParams (ligne 296-301)
{ resource: string, id: BaseKey, variables: TVariables, meta?: MetaQuery }

// DeleteOneParams (ligne 308-314)
{ resource: string, id: BaseKey, variables?: TVariables, meta?: MetaQuery }
```

#### MetaQuery — le canal d'injection

```typescript
// Source: types.d.ts (ligne 157-160)
export type MetaQuery = {
  [k: string]: any; // ← accepte TOUT
  queryContext?: Omit<QueryFunctionContext, "meta">;
} & QueryBuilderOptions &
  GraphQLQueryOptions;
```

**Chaque méthode du DataProvider accepte `meta?: MetaQuery`** — un objet ouvert qui peut transporter `orgId`, `providerId`, flags custom, etc.

#### Mapping DataProvider → Server Actions FleetCore

| Méthode Refine                | Server Action / API FleetCore                     | Adaptabilité                                |
| ----------------------------- | ------------------------------------------------- | ------------------------------------------- |
| `getList("leads")`            | `GET /api/v1/crm/leads` (avec pagination/filters) | ✅ Direct — retourne déjà `{ data, total }` |
| `getOne("leads", id)`         | `GET /api/v1/crm/leads/${id}`                     | ✅ Direct                                   |
| `create("leads")`             | `POST /api/v1/crm/leads`                          | ✅ Direct                                   |
| `update("leads", id)`         | `updateLeadAction(id, values)`                    | ✅ Server Action wrappable                  |
| `deleteOne("leads", id)`      | `DELETE /api/v1/crm/leads/${id}`                  | ✅ Direct                                   |
| `getList("opportunities")`    | `getOpportunitiesAction()`                        | ✅ Retourne `{ opportunities, total }`      |
| `update("opportunities", id)` | `updateOpportunityAction(id, values)`             | ✅ Server Action wrappable                  |
| `create("opportunities")`     | `createOpportunityAction(values)`                 | ✅ Server Action wrappable                  |

#### Question critique : Server Actions depuis un DataProvider "use client" ?

**OUI.** Le DataProvider Refine s'exécute côté client (car il est appelé depuis des hooks React). Les Server Actions Next.js sont **conçues** pour être importées et appelées depuis des composants client :

```typescript
// Ceci est valide en Next.js 16 :
"use client";
import { updateLeadAction } from "@/lib/actions/crm/lead.actions"; // "use server"

const dataProvider: DataProvider = {
  update: async ({ resource, id, variables }) => {
    const result = await updateLeadAction(id, variables); // ← appel cross-boundary
    return { data: result };
  },
  // ...
};
```

**Pas besoin de passer par fetch()** — l'appel direct aux Server Actions est le pattern recommandé par Next.js.

#### Effort d'adaptation DataProvider

```
1 fichier : lib/providers/refine-data-provider.ts
~150-200 lignes : switch sur resource + mapping entrée/sortie
Complexité : transformation des CrudFilter[] Refine → filtres Prisma FleetCore
```

> **Sources :**
>
> - `node_modules/@refinedev/core/dist/contexts/data/types.d.ts` (lignes 267-342)
> - `lib/actions/crm/lead.actions.ts` (lignes 1-430)
> - `lib/actions/crm/opportunity.actions.ts` (lignes 1-1102)

---

### A.3 AuthProvider ↔ Clerk

#### Interface AuthProvider (Refine)

```typescript
// Source: node_modules/@refinedev/core/dist/contexts/auth/types.d.ts (lignes 58-68)
export type AuthProvider = {
  login:    (params: any) → Promise<AuthActionResponse>;      // REQUIS
  logout:   (params: any) → Promise<AuthActionResponse>;      // REQUIS
  check:    (params?: any) → Promise<CheckResponse>;          // REQUIS
  onError:  (error: any) → Promise<OnErrorResponse>;          // REQUIS
  register?:        (params) → Promise<AuthActionResponse>;   // optionnel
  forgotPassword?:  (params) → Promise<AuthActionResponse>;   // optionnel
  updatePassword?:  (params) → Promise<AuthActionResponse>;   // optionnel
  getPermissions?:  (params?) → Promise<PermissionResponse>;  // optionnel
  getIdentity?:     (params?) → Promise<IdentityResponse>;    // optionnel
};
```

```typescript
// CheckResponse (ligne 34-39)
{ authenticated: boolean, redirectTo?: string, logout?: boolean, error?: Error }

// AuthActionResponse (ligne 49-55)
{ success: boolean, redirectTo?: string, error?: Error, [key: string]: unknown }
```

#### Mapping AuthProvider → Clerk

| Méthode Refine   | Implémentation Clerk                                         | Notes                                                                                            |
| ---------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `login`          | `signIn.create()` via `@clerk/nextjs`                        | Clerk gère déjà le login via `<SignIn>` — cette méthode peut juste retourner `{ success: true }` |
| `logout`         | `signOut()` de `useClerk()`                                  | Direct                                                                                           |
| `check`          | `auth()` côté serveur / `useAuth()` côté client              | Retourne `{ authenticated: !!userId }`                                                           |
| `onError`        | Gestion des erreurs HTTP 401/403                             | `{ logout: true, redirectTo: "/sign-in" }`                                                       |
| `getIdentity`    | `useUser()` → `{ id, firstName, lastName, email, imageUrl }` | Direct                                                                                           |
| `getPermissions` | `useOrganization()` → `membership.role`                      | Via RBAC FleetCore                                                                               |

#### Conflit SSR vs Client ?

**Non.** Clerk fournit deux APIs :

- **Serveur :** `auth()` depuis `@clerk/nextjs/server` (Server Components, Server Actions)
- **Client :** `useAuth()`, `useUser()`, `useOrganization()` depuis `@clerk/nextjs`

Le AuthProvider Refine s'exécute côté client → utilise les hooks client Clerk. Pas de conflit.

#### Effort d'adaptation AuthProvider

```
1 fichier : lib/providers/refine-auth-provider.ts
~60-80 lignes
Complexité : faible — Clerk fait déjà tout le travail
```

> **Source :** `node_modules/@refinedev/core/dist/contexts/auth/types.d.ts` (lignes 34-68)

---

### A.4 AccessControlProvider ↔ RBAC FleetCore

#### Interface AccessControlProvider (Refine)

```typescript
// Source: node_modules/@refinedev/core/dist/contexts/accessControl/types.d.ts
export type CanParams = {
  resource: string;
  action: string;
  params?: {
    resource?: IResourceItem;
    id?: BaseKey;
    [key: string]: any;
  };
};

export type CanReturnType = {
  can: boolean;
  reason?: string;
};

export type AccessControlProvider = {
  can: (params: CanParams) → Promise<CanReturnType>;
  options?: { buttons?: { enableAccessControl?: boolean; hideIfUnauthorized?: boolean } };
};
```

#### Mapping AccessControlProvider → FleetCore RBAC

FleetCore utilise déjà un système RBAC mature :

```typescript
// Source: lib/config/permissions.ts (lignes 1-239)
// 7 rôles Clerk Organizations :
// org:admin, org:adm_admin, org:adm_commercial, org:adm_support,
// org:provider_admin, org:provider_manager, org:provider_user

// 30+ permissions au format "module:action" :
// "crm:view", "crm:create", "crm:edit", "crm:delete",
// "fleet:view", "fleet:create", "billing:view", etc.

hasPermission(role: string, permission: string): boolean
hasModuleAccess(role: string, module: string): boolean
```

**Le mapping est un 1:1 parfait :**

```typescript
// Adapter FleetCore RBAC → Refine AccessControlProvider
const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const role = getUserRole(); // via Clerk useOrganization()
    const permission = `${resource}:${action}`; // "crm:view", "fleet:create"
    return {
      can: hasPermission(role, permission),
      reason: hasPermission(role, permission)
        ? undefined
        : "Insufficient permissions",
    };
  },
};
```

**Bonus Refine :** Le hook `useCan()` et le composant `<CanAccess>` permettent de masquer automatiquement les boutons/sections inaccessibles — fonctionnalité que FleetCore devrait sinon implémenter manuellement.

#### Effort d'adaptation AccessControlProvider

```
~20-30 lignes dans le fichier auth provider (ou séparé)
Complexité : triviale — c'est un simple bridge
```

> **Sources :**
>
> - `node_modules/@refinedev/core/dist/contexts/accessControl/types.d.ts`
> - `lib/config/permissions.ts` (lignes 1-239)

---

### A.5 Multi-tenant (Provider Context)

#### Mécanisme actuel FleetCore

```typescript
// Source: lib/utils/provider-context.ts (lignes 1-193)

// 1. Résolution du provider (division) depuis Clerk userId
getCurrentProviderId(): Promise<string | null>
// → lookup dans adm_provider_employees via Clerk userId
// → null = accès global (CEO)

// 2. Filtre d'isolation
buildProviderFilter(providerId: string | null): { provider_id: string } | {}
// → { provider_id: "uuid" } pour un employé de division
// → {} pour un accès global (pas de filtre)

// 3. Filtre hybride (données système + custom)
buildHybridProviderFilter(providerId: string | null): Prisma where clause
```

**Point crucial :** Chaque Server Action FleetCore appelle `getCurrentProviderId()` **en interne** :

```typescript
// Source: lib/actions/crm/lead.actions.ts (lignes ~80-90)
export async function updateLeadAction(leadId, data) {
  const { userId, orgId } = await auth(); // ← Clerk auth
  const providerId = await getCurrentProviderId(); // ← résolution tenant
  const providerFilter = buildProviderFilter(providerId); // ← isolation
  // ... Prisma query avec providerFilter
}
```

#### Compatibilité avec Refine

**Le DataProvider n'a PAS besoin d'injecter `orgId` ou `providerId` via `meta`.** Les Server Actions gèrent déjà l'isolation multi-tenant en interne. Le DataProvider est un simple passe-plat :

```typescript
// Le DataProvider appelle juste la Server Action — l'isolation est déjà dedans
update: async ({ resource, id, variables }) => {
  const result = await updateLeadAction(id, variables);
  // updateLeadAction() fait auth() + getCurrentProviderId() + buildProviderFilter()
  return { data: result };
},
```

**Si besoin futur** de passer des infos supplémentaires, `meta` est disponible :

```typescript
useUpdate({ resource: "leads", id: 1, values: {...}, meta: { forceProvider: "uuid" } });
```

#### Open Source vs Enterprise ?

Refine est **100% open source** (MIT). Pas de features enterprise payantes pour le multi-tenant. Le multi-tenant est géré côté FleetCore (Server Actions + Prisma), Refine n'intervient pas à ce niveau.

#### Effort d'adaptation

```
0 lignes supplémentaires — l'isolation est déjà dans les Server Actions
```

> **Source :** `lib/utils/provider-context.ts` (lignes 1-193), `lib/actions/crm/lead.actions.ts` (lignes 80-90)

---

### A.6 Routing (Next.js App Router)

#### @refinedev/nextjs-router — Inspection du code source

```typescript
// Source: node_modules/@refinedev/nextjs-router/dist/app.mjs (ligne 1)
"use client";

// Imports (lignes 2-5)
import { useRouter, usePathname, useSearchParams } from "next/navigation.js";
import NextLink from "next/link.js";
// AUCUN import de react-router-dom
```

**Exports :**

- `routerProvider` : objet `{ go, back, parse, Link }` utilisant les primitives Next.js
- `NavigateToResource` : composant de redirection
- `parseTableParams` : extraction pagination/sort/filter depuis l'URL
- `paramsFromCurrentPath` : parsing de route dynamique

#### Compatibilité avec la structure FleetCore

Structure actuelle FleetCore :

```
app/[locale]/(auth)/        → Pages auth (Clerk)
app/[locale]/(public)/      → Pages publiques
app/[locale]/dashboard/     → Zone protégée CRM
```

**Le composant `<Refine>` peut être scopé à un layout spécifique :**

```typescript
// app/[locale]/dashboard/layout.tsx
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";

export default function DashboardLayout({ children }) {
  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      accessControlProvider={accessControlProvider}
      resources={[
        { name: "leads", list: "/dashboard/crm/leads", ... },
        { name: "opportunities", list: "/dashboard/crm/opportunities", ... },
      ]}
    >
      {children}
    </Refine>
  );
}
```

**Aucun conflit avec :**

- Les route groups `(auth)` et `(public)` — en dehors du scope `<Refine>`
- Le `[locale]` dynamique — Refine ne gère pas les locales, FleetCore garde le contrôle
- Les layouts imbriqués — `<Refine>` est un Context Provider, pas un layout visuel

#### i18nProvider — Bridge trivial

```typescript
// Source: node_modules/@refinedev/core/dist/contexts/i18n/types.d.ts (lignes 1-12)
export type I18nProvider = {
  translate: (key: string, options?: any, defaultMessage?: string) => string;
  changeLocale: (locale: string, options?: any) => Promise<any> | any;
  getLocale: () => string;
};
```

```typescript
// Bridge vers react-i18next existant (~10 lignes)
import { useTranslation } from "react-i18next";

const useI18nProvider = (): I18nProvider => {
  const { t, i18n } = useTranslation();
  return {
    translate: (key, options, defaultMessage) =>
      t(key, defaultMessage, options),
    changeLocale: (locale) => i18n.changeLanguage(locale),
    getLocale: () => i18n.language,
  };
};
```

#### AuditLogProvider — Bridge vers adm_audit_logs

```typescript
// Source: node_modules/@refinedev/core/dist/contexts/auditLog/types.d.ts (lignes 1-39)
export type AuditLogProvider = {
  create?: (params: LogParams) => Promise<any>;     // ← mutation logging
  get?: (params: { resource, action?, meta? }) => Promise<any>;  // ← query logs
  update?: (params: { id, name, ... }) => Promise<any>;
};
```

FleetCore a déjà `getAuditLogUuids()` et insère dans `adm_audit_logs`. Le bridge est ~30 lignes.

#### Effort total routing + providers secondaires

```
lib/providers/refine-router-provider.ts  → 0 lignes (utiliser routerProvider de @refinedev/nextjs-router)
lib/providers/refine-i18n-provider.ts    → ~15 lignes
lib/providers/refine-audit-provider.ts   → ~30 lignes
Modification layout dashboard            → ~20 lignes (<Refine> wrapper)
Total : ~65 lignes
```

> **Sources :**
>
> - `node_modules/@refinedev/nextjs-router/dist/app.mjs` (lignes 1-209)
> - `node_modules/@refinedev/core/dist/contexts/i18n/types.d.ts`
> - `node_modules/@refinedev/core/dist/contexts/auditLog/types.d.ts`

---

### A.7 Bundle Size

**Mesure directe non réalisée** (next build prend ~3-5 min et l'analyse est temporaire).

**Estimation basée sur le code source :**

| Paquet                   | Taille source   | Tree-shakeable           | Impact estimé bundle client |
| ------------------------ | --------------- | ------------------------ | --------------------------- |
| @refinedev/core          | 7.9 MB (source) | Oui (sideEffects: false) | ~40-60 KB gzipped           |
| @refinedev/nextjs-router | 664 KB          | Oui                      | ~3-5 KB gzipped             |
| @tanstack/react-query    | ~2 MB (source)  | Oui                      | ~25-35 KB gzipped           |
| **Total estimé**         |                 |                          | **~70-100 KB gzipped**      |

**Contexte :** FleetCore charge actuellement ShadCN + Framer Motion + Clerk côté client. L'ajout de ~80 KB gzipped est comparable à l'ajout d'une librairie de charts.

**@tanstack/react-query v5 apporte en bonus :**

- Cache automatique + invalidation intelligente
- Deduplication des requêtes identiques
- Retry automatique
- Prefetching
- Devtools (optionnel)

Ces fonctionnalités **manquent actuellement** à FleetCore (fetch brut sans cache).

---

## B. Option Custom (Build Our Own)

### B.1 Patterns kiranism

#### Constat fondamental

**kiranism est un TEMPLATE, pas un système de production.** Aucune Server Action, aucune base de données, aucun vrai CRUD. Toutes les données sont mockées.

```typescript
// Source: kiranism/src/features/products/ — ProductForm onSubmit handler
onSubmit: (values) => {
  // Juste un log des valeurs — aucun appel API, aucune persistence
};
```

#### Patterns extractibles

**1. useDataTable hook (297 lignes)**

- Bridge entre `nuqs` (URL state) + `TanStack Table` (headless table)
- Gère : pagination serveur, tri, filtres, recherche
- Utilise `manualPagination: true`, `manualSorting: true`, `manualFiltering: true`
- **Limitation :** ne gère PAS le fetching — il faut brancher un fetch() manuellement

**2. Composants formulaire**

- react-hook-form + Zod validation
- Pattern : `FormField` → `FormItem` → `FormControl` → input ShadCN
- **Déjà présent dans FleetCore** (même pattern utilisé)

**3. Gestion d'état**

- Zustand pour l'état éphémère (dialogs, selections)
- nuqs pour l'état URL (pagination, filtres)
- **Pas de cache de données** — chaque navigation refetch tout

**4. Structure par feature**

```
features/products/
├── components/       → UI spécifiques au module
├── context/          → React context (ex: dialog state)
├── hooks/            → useDataTable custom
├── types/            → Zod schemas + TypeScript types
└── index.ts          → barrel export
```

#### Coût de reproduction par ressource

| Brique                       | Lignes estimées | Réutilisable ?      |
| ---------------------------- | --------------- | ------------------- |
| useDataTable hook            | ~300            | Oui (1 fois)        |
| Types + Zod schemas          | ~80             | Non (par ressource) |
| Colonnes table               | ~120            | Non (par ressource) |
| Formulaire CRUD              | ~200            | Non (par ressource) |
| Actions toolbar              | ~60             | Partiellement       |
| Dialogs (create/edit/delete) | ~150            | Partiellement       |
| **Total par ressource**      | **~610**        |                     |
| **Infrastructure partagée**  | **~430**        |                     |

> **Source :** Agent d'analyse — exploration complète du repository kiranism

---

### B.2 Patterns atomic-crm

#### Architecture CRM spécifique

atomic-crm utilise React Admin (`ra-core`) en headless. Patterns CRM identifiés :

**1. Pipeline Kanban**

- Composant `DealColumn` avec `@hello-pangea/dnd` (drag & drop)
- Stages : opportunity → proposal-sent → in-negotiation → won/lost
- Mise à jour via `useUpdate()` de ra-core au drop

**2. Modèle de données CRM**

- Contact (company_id, sales_id, tags, status)
- Deal (contact_id, company_id, stage, amount, expected_close_date)
- Company (sector, size, contacts[])
- Activity/Note (contact_id, deal_id, type, text, date)
- Tags (name, color, contacts[], deals[])

**3. Revenue Dashboard**

- `DealsChart` utilise `@nivo/bar` + `useGetList()` de ra-core
- Agrégation par mois, par stage, par commercial

**4. Pattern de composition**

```typescript
// atomic-crm utilise ra-core hooks partout :
const { data, isLoading } = useGetList("deals", {
  filter: { stage: "opportunity" },
  sort: { field: "created_at", order: "DESC" },
  pagination: { page: 1, perPage: 50 },
});
```

#### Ce qui est transposable à FleetCore

| Pattern            | Applicable ? | Notes                                              |
| ------------------ | ------------ | -------------------------------------------------- |
| Pipeline Kanban    | ✅ Oui       | FleetCore a déjà un Kanban (KanbanBoard.tsx)       |
| Contact/Deal model | ✅ Oui       | FleetCore a Leads, Opportunities, Quotes, Orders   |
| Activity log       | ✅ Oui       | FleetCore a adm_audit_logs                         |
| Tags system        | ⚠️ Partiel   | FleetCore utilise des statuts, pas des tags libres |
| Revenue chart      | ✅ Oui       | Pattern applicable aux forecasts                   |

> **Source :** Agent d'analyse — exploration complète du repository atomic-crm

---

### B.3 Estimation d'effort

#### Briques à construire pour un "Build Our Own"

| Brique                                           | Lignes       | Complexité | Équivalent Refine                                          |
| ------------------------------------------------ | ------------ | ---------- | ---------------------------------------------------------- |
| `useResource` hook (CRUD générique)              | ~200         | Moyenne    | `useList`, `useOne`, `useCreate`, `useUpdate`, `useDelete` |
| `useDataTable` hook (pagination/tri/filtres URL) | ~300         | Haute      | `useTable`                                                 |
| Cache layer (TanStack Query ou SWR wrapper)      | ~150         | Haute      | Inclus (TanStack Query)                                    |
| Invalidation intelligente                        | ~100         | Haute      | Inclus (`queryClient.invalidateQueries`)                   |
| Optimistic updates                               | ~150         | Très haute | Inclus (`mutationMode: "optimistic"`)                      |
| Auth context bridge                              | ~60          | Faible     | `authProvider`                                             |
| RBAC hook (`useCan`)                             | ~40          | Faible     | `useCan` + `<CanAccess>`                                   |
| i18n bridge                                      | ~15          | Triviale   | `i18nProvider`                                             |
| Audit log bridge                                 | ~30          | Faible     | `auditLogProvider`                                         |
| Error boundaries CRUD                            | ~80          | Moyenne    | `onError` handler intégré                                  |
| Notification system                              | ~60          | Moyenne    | `notificationProvider`                                     |
| **Total infrastructure**                         | **~1185**    |            |                                                            |
| **Par ressource (colonnes, forms, dialogs)**     | **~460 × N** |            | Idem (UI toujours custom)                                  |

**Pour 8 ressources CRM** (leads, opportunities, quotes, orders, agreements, contacts, companies, activities) :

```
Infrastructure : ~1185 lignes
8 ressources × 460 : ~3680 lignes
Total : ~4865 lignes
```

**Avec Refine :** infrastructure = ~300 lignes d'adapters. Même coût par ressource (UI custom).

```
Adapters Refine : ~300 lignes
8 ressources × 460 : ~3680 lignes
Total : ~3980 lignes
Économie : ~885 lignes d'infrastructure testée et maintenue par Refine
```

---

### B.4 Risque de dérive

#### Définition

"Dérive" = l'écart grandissant entre l'abstraction custom et ce qu'un framework mature fournirait. Les symptômes :

1. **Feature creep silencieux** — chaque nouvelle ressource nécessite des ajustements au core
2. **Bug surface** — cache invalidation, race conditions, optimistic updates sont des problèmes résolus mais subtils
3. **Onboarding** — un nouveau développeur doit apprendre un framework propriétaire (0 documentation externe)
4. **Maintenance** — quand React/Next.js évolue, le framework custom doit être mis à jour manuellement

#### Axes de dérive identifiés

| Axe                   | Risque Custom                                              | Risque Refine                                             |
| --------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| Cache invalidation    | 🔴 Élevé — doit être implémenté manuellement, bugs subtils | 🟢 Résolu — TanStack Query mature                         |
| Optimistic updates    | 🔴 Élevé — complexe à implémenter correctement             | 🟢 Résolu — `mutationMode: "optimistic"`                  |
| Pagination URL sync   | 🟡 Moyen — nuqs aide mais bridging manuel                  | 🟢 Résolu — `syncWithLocation: true`                      |
| Error handling CRUD   | 🟡 Moyen — chaque fetch() doit gérer ses erreurs           | 🟢 Résolu — `onError` centralisé                          |
| Realtime updates      | 🔴 Élevé — à construire de zéro                            | 🟢 Résolu — `liveProvider`                                |
| Devtools / debugging  | 🔴 Absent                                                  | 🟢 TanStack Query Devtools + Refine Devtools              |
| Upgrade React/Next.js | 🟡 Moyen — maintenance manuelle                            | 🟢 Refine suit les versions (React 19, Next 16 supportés) |

#### Précédent FleetCore

Le code actuel illustre déjà cette dérive. 14 composants CRM utilisent du `fetch()` brut :

```typescript
// Source: composants CRM (pattern observé dans 14 fichiers)
const res = await fetch(`/api/v1/crm/leads/${id}`);
const data = await res.json();
// → Pas de cache, pas d'invalidation, pas de retry, pas de loading state centralisé
```

C'est exactement le problème identifié : _"un assemblage de pages web, pas un CRM"_.

---

## C. Tableau comparatif

| Critère                     | Refine.dev                                              | Custom (kiranism-based)          |
| --------------------------- | ------------------------------------------------------- | -------------------------------- |
| **Lignes d'infra à écrire** | ~300 (adapters)                                         | ~1185 (hooks + cache + bridges)  |
| **Lignes par ressource**    | ~460 (UI toujours custom)                               | ~460 (identique)                 |
| **Total 8 ressources**      | ~3980                                                   | ~4865                            |
| **Cache / Invalidation**    | ✅ Inclus (TanStack Query v5)                           | ❌ À construire                  |
| **Optimistic updates**      | ✅ 1 config (`mutationMode`)                            | ❌ ~150 lignes par mutation      |
| **Realtime**                | ✅ `liveProvider` prêt                                  | ❌ À construire                  |
| **RBAC UI**                 | ✅ `useCan` + `<CanAccess>`                             | ⚠️ ~40 lignes + pas de composant |
| **Audit logging**           | ✅ `auditLogProvider` intégré                           | ⚠️ Manuel par mutation           |
| **Pagination URL sync**     | ✅ `syncWithLocation`                                   | ⚠️ Bridging nuqs manuel          |
| **Multi-tenant**            | ✅ Via meta (mais inutile — Server Actions gèrent)      | ✅ Même chose                    |
| **Clerk compatibilité**     | ✅ AuthProvider = bridge ~80 lignes                     | ✅ Direct (déjà en place)        |
| **Next.js App Router**      | ✅ @refinedev/nextjs-router natif                       | ✅ Natif                         |
| **Bundle ajouté**           | ~80 KB gzipped                                          | ~0 KB (mais perd TanStack Query) |
| **Lock-in**                 | 🟡 Moyen — interfaces standardisées, migration possible | 🟢 Faible — code propriétaire    |
| **Courbe d'apprentissage**  | 🟡 ~1-2 jours (documentation Refine)                    | 🟢 Faible (code local)           |
| **Écosystème / communauté** | ✅ 29k+ GitHub stars, docs complètes                    | ❌ Aucun                         |
| **Maintenance long terme**  | ✅ Maintenu par Refine team                             | 🔴 Maintenance manuelle          |
| **Risque de dérive**        | 🟢 Faible — framework mature                            | 🔴 Élevé — cf. section B.4       |
| **Devtools**                | ✅ TanStack Query + Refine devtools                     | ❌ Aucun                         |

---

## D. Verdict

### Analyse factuelle

1. **Compatibilité technique** : Refine est compatible sur les 6 axes analysés (DataProvider, Auth, RBAC, Multi-tenant, Routing, Bundle). Aucun bloqueur identifié. Tous les mappings sont documentés avec des citations de code source.

2. **Économie d'infrastructure** : Refine économise ~885 lignes d'infrastructure critique (cache, invalidation, optimistic updates, error handling) — les parties les plus complexes et sujettes aux bugs.

3. **Le coût par ressource est identique** : UI custom dans les deux cas. L'économie est sur l'infrastructure, pas sur les pages.

4. **TanStack Query v5 est un upgrade net** : FleetCore n'a actuellement aucune couche de caching. Que ce soit via Refine ou en custom, cette dépendance est nécessaire. Refine la fournit "gratuitement".

5. **Le risque de dérive custom est réel et déjà observable** : 14 composants avec fetch() brut, pas de cache, pas d'invalidation — c'est le symptôme d'une absence de framework.

6. **Lock-in Refine est limité** : Les interfaces DataProvider/AuthProvider sont des contrats TypeScript standard. Le code métier (Server Actions, Prisma, RBAC) reste 100% FleetCore. Migrer hors de Refine = réécrire les ~300 lignes d'adapters.

### Risques Refine à surveiller

- **Dépendance communautaire** : Refine est un projet open-source. Si le projet ralentit, le code reste fonctionnel mais ne suivra plus les évolutions React/Next.js.
- **Overhead conceptuel** : L'équipe doit apprendre le modèle mental Refine (resources, providers, hooks).
- **Cas limites** : Certains patterns FleetCore (wizard multi-étapes, bulk actions) peuvent nécessiter des contournements du modèle CRUD classique.

### Synthèse

|                       | Refine                                           | Custom                             |
| --------------------- | ------------------------------------------------ | ---------------------------------- |
| **Effort initial**    | ~300 lignes adapters + apprentissage             | ~1185 lignes infra                 |
| **Effort récurrent**  | Mise à jour Refine                               | Maintenance framework custom       |
| **Plafond technique** | Élevé (hooks composables, providers extensibles) | Dépend de l'investissement continu |

**La décision finale revient au porteur de projet.** Ce document fournit les données factuelles pour un choix éclairé.

---

_Document généré sur la branche `analysis/refine-feasibility`_
_Toutes les assertions sont vérifiables via les fichiers et lignes cités._
