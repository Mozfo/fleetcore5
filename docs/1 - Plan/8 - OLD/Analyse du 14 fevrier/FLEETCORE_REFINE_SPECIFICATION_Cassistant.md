# FLEETCORE — SPÉCIFICATION D'INTÉGRATION REFINE.DEV

# DOCUMENT FONDATEUR — RÉFÉRENTIEL POUR TOUS LES MODULES

> **Version :** 1.0.0
> **Date :** 14 Février 2026
> **Auteur :** Architecture FleetCore (Mohamed CEO/CTO + Claude Senior)
> **Statut :** SPÉCIFICATION VALIDÉE
> **Objectif :** Ce document est le CONTRAT TECHNIQUE que tout développeur (humain ou IA) DOIT lire et respecter avant de toucher au frontend FleetCore. Aucune improvisation autorisée.

---

## TABLE DES MATIÈRES

1. [CONTEXTE ET DÉCISION](#1-contexte-et-décision)
2. [ARCHITECTURE GLOBALE](#2-architecture-globale)
3. [DATA PROVIDER FLEETCORE](#3-data-provider-fleetcore)
4. [AUTH PROVIDER FLEETCORE](#4-auth-provider-fleetcore)
5. [ACCESS CONTROL PROVIDER](#5-access-control-provider)
6. [ROUTER PROVIDER](#6-router-provider)
7. [PROVIDERS SECONDAIRES](#7-providers-secondaires)
8. [PATTERN STANDARD PAR RESOURCE](#8-pattern-standard-par-resource)
9. [EXEMPLE COMPLET : CRM LEADS](#9-exemple-complet--crm-leads)
10. [PLAN DE MIGRATION INCRÉMENTAL](#10-plan-de-migration-incrémental)
11. [CONVENTIONS ET RÈGLES](#11-conventions-et-règles)
12. [GLOSSAIRE](#12-glossaire)

---

## 1. CONTEXTE ET DÉCISION

### 1.1 Pourquoi Refine

FleetCore est un SaaS B2B multi-tenant (Next.js 16.1.6, Clerk, Prisma, Server Actions, Supabase PostgreSQL). Le backend est à 9/10 — enterprise-grade. Le frontend est à 4/10 — chaque page réinvente ses propres fetch, state, filtres, pagination. 14 composants CRM utilisent du `fetch()` brut sans cache, sans invalidation, sans retry.

**Problème fondamental :** L'absence de couche d'abstraction CRUD produit un "assemblage de pages web" au lieu d'un CRM professionnel.

**Décision prise le 14 février 2026 :** Intégrer Refine.dev comme couche d'abstraction CRUD frontend, sur la base d'une analyse comparative factuelle (REFINE_VS_CUSTOM_ANALYSIS.md) qui a évalué 7 options et démontré la compatibilité sur 6 axes techniques.

### 1.2 Ce que Refine apporte

| Capacité               | Avant (fetch brut)         | Après (Refine)                                      |
| ---------------------- | -------------------------- | --------------------------------------------------- |
| Cache données          | ❌ Aucun                   | ✅ TanStack Query v5 automatique                    |
| Invalidation           | ❌ Manuelle par page       | ✅ Automatique après mutation                       |
| Optimistic updates     | ❌ Inexistant              | ✅ `mutationMode: "optimistic"`                     |
| Retry erreurs          | ❌ Inexistant              | ✅ Automatique (configurable)                       |
| Deduplication requêtes | ❌ Requêtes dupliquées     | ✅ TanStack Query dedup                             |
| Hooks CRUD standard    | ❌ Custom par page         | ✅ useList, useOne, useCreate, useUpdate, useDelete |
| RBAC UI                | ❌ Manual useHasPermission | ✅ useCan + `<CanAccess>`                           |
| Pagination URL         | ❌ Custom par page         | ✅ syncWithLocation automatique                     |
| Devtools               | ❌ Aucun                   | ✅ TanStack Query Devtools                          |

### 1.3 Ce qui NE CHANGE PAS — Interdictions absolues

| Composant                    | Statut                                 | Justification                                                     |
| ---------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| **Clerk** (auth)             | ❌ NE PAS REMPLACER                    | Profondément intégré (webhooks, Organizations, RBAC, 800+ lignes) |
| **Server Actions** (backend) | ❌ NE PAS MODIFIER                     | 9/10, enterprise-grade, Zod + Auth + Audit                        |
| **Prisma** (ORM)             | ❌ NE PAS MODIFIER                     | 101 tables, 630+ index, schema de 6800+ lignes                    |
| **buildProviderFilter**      | ❌ NE PAS CONTOURNER                   | Isolation multi-tenant dans CHAQUE Server Action                  |
| **Schema DB**                | ❌ NE PAS MODIFIER                     | Workflow : SQL → schema.prisma → prisma generate                  |
| **Middleware Clerk**         | ❌ NE PAS MODIFIER                     | Gère auth + tenant routing                                        |
| **RLS Supabase**             | ℹ️ NON UTILISÉ comme sécurité primaire | Isolation = applicative via buildProviderFilter                   |
| **i18n** (react-i18next)     | ❌ CONSERVER                           | EN/FR, 700+ clés CRM                                              |

### 1.4 Packages à installer

```bash
pnpm add @refinedev/core@^5.0.9 @refinedev/nextjs-router@^7.0.4 @tanstack/react-query@^5.81
```

**Empreinte :** ~8.6 MB node_modules, ~70-100 KB gzipped bundle client.

**Dépendances transitives :** lodash-es, papaparse, pluralize, qs, tslib, warn-once.

**Peer dependencies vérifiées :**

- React 18/19 ✅ (FleetCore = React 19.2.4)
- Next.js \* ✅ (FleetCore = Next.js 16.1.6)
- @tanstack/react-query v5 ⚠️ (À installer — FleetCore n'a actuellement aucune query library)

---

## 2. ARCHITECTURE GLOBALE

### 2.1 Schéma AVANT Refine (état actuel)

```
┌──────────────────────────────────────────────────────────────┐
│                    COMPOSANT CLIENT                           │
│  LeadsPageClient.tsx (1098 lignes)                           │
│  ├── 24 useState                                             │
│  ├── fetch('/api/v1/crm/leads')  ← PAS DE CACHE             │
│  ├── fetch('/api/v1/crm/leads/' + id)  ← DUPLIQUÉ           │
│  └── Gestion erreurs inline ← INCONSISTANTE                 │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP fetch()
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    API ROUTE                                  │
│  app/api/v1/crm/leads/route.ts                               │
│  ├── requireAuth()                                           │
│  ├── requirePermission("leads.read")                         │
│  ├── validateQuery(schema)                                   │
│  └── Appel Prisma direct ou Service                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    SERVER ACTION / SERVICE                     │
│  lib/actions/crm/lead.actions.ts                             │
│  ├── auth() → userId, orgId                                  │
│  ├── getCurrentProviderId() → isolation tenant                │
│  ├── buildProviderFilter(providerId)                         │
│  ├── Prisma query avec filtre tenant                         │
│  └── Audit log automatique                                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              POSTGRESQL (SUPABASE)                             │
│  101 tables, 630+ index, 147 enums                           │
└──────────────────────────────────────────────────────────────┘
```

**Problèmes identifiés :**

- Chaque page réinvente ses propres fetch, state, erreurs, pagination
- Zéro cache — chaque navigation refetch tout depuis l'API
- Zéro invalidation — après un create/update, l'utilisateur doit refresh manuellement
- 14 composants CRM avec des patterns fetch différents
- God Components (LeadsPageClient = 1098 lignes, OpportunityDrawer = 1021 lignes)

### 2.2 Schéma APRÈS Refine (état cible)

```
┌──────────────────────────────────────────────────────────────┐
│                    COMPOSANT CLIENT                           │
│  leads-list-page.tsx (~60 lignes)                            │
│  ├── useList("leads", { filters, sorters, pagination })      │
│  ├── useCreate("leads")                                      │
│  ├── useCan({ resource: "leads", action: "create" })         │
│  └── Résultat → DataTable shadcnuikit                        │
└──────────────────────┬───────────────────────────────────────┘
                       │ Hook Refine → DataProvider
                       ▼
┌──────────────────────────────────────────────────────────────┐
│           TANSTACK QUERY (CACHE LAYER)                        │
│  ├── Cache automatique (queryKey par resource)               │
│  ├── Deduplication (même requête = 1 seul appel)             │
│  ├── Invalidation automatique après mutation                 │
│  ├── Retry configurable                                      │
│  └── Optimistic updates (UI avant réponse serveur)           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              DATA PROVIDER FLEETCORE                           │
│  lib/providers/refine-data-provider.ts (~200 lignes)         │
│  ├── getList → appel API route /api/v1/crm/leads             │
│  ├── getOne → appel API route /api/v1/crm/leads/[id]         │
│  ├── create → appel Server Action createLeadAction()         │
│  ├── update → appel Server Action updateLeadAction()         │
│  ├── deleteOne → appel API route DELETE                      │
│  └── Transformation filtres Refine → format FleetCore        │
└──────────────────────┬───────────────────────────────────────┘
                       │ Server Action OU fetch API route
                       ▼
┌──────────────────────────────────────────────────────────────┐
│           SERVER ACTIONS / API ROUTES (INCHANGÉ)              │
│  ├── auth() + getCurrentProviderId()                         │
│  ├── buildProviderFilter(providerId)                         │
│  ├── Prisma + Zod + Audit                                    │
│  └── AUCUNE MODIFICATION                                     │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              POSTGRESQL (SUPABASE) — INCHANGÉ                 │
└──────────────────────────────────────────────────────────────┘
```

**Ce qui change :** uniquement la couche ENTRE les composants et les Server Actions/API routes. Le backend reste intact.

### 2.3 Périmètre du composant `<Refine>`

Le composant `<Refine>` est un Context Provider React. Il se place dans UN SEUL layout — le layout dashboard.

```
app/
├── [locale]/
│   ├── (auth)/           ← HORS SCOPE REFINE (Clerk sign-in/sign-up)
│   ├── (public)/         ← HORS SCOPE REFINE (homepage, landing, booking)
│   └── dashboard/
│       └── layout.tsx    ← ICI : <Refine> wrapper
│           ├── crm/      ← DANS SCOPE REFINE
│           ├── fleet/    ← DANS SCOPE REFINE
│           ├── drivers/  ← DANS SCOPE REFINE
│           ├── billing/  ← DANS SCOPE REFINE
│           └── admin/    ← DANS SCOPE REFINE
```

**Règle :** `<Refine>` ne touche PAS les routes auth, public, marketing. Il ne wrappe que la zone protégée post-login.

### 2.4 Placement dans le layout dashboard

```typescript
// app/[locale]/dashboard/layout.tsx
"use client";

import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { dataProvider } from "@/lib/providers/refine-data-provider";
import { authProvider } from "@/lib/providers/refine-auth-provider";
import { accessControlProvider } from "@/lib/providers/refine-access-control-provider";
import { i18nProvider } from "@/lib/providers/refine-i18n-provider";
import { auditLogProvider } from "@/lib/providers/refine-audit-log-provider";
import { notificationProvider } from "@/lib/providers/refine-notification-provider";
import { resources } from "@/lib/providers/refine-resources";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      accessControlProvider={accessControlProvider}
      i18nProvider={i18nProvider}
      auditLogProvider={auditLogProvider}
      notificationProvider={notificationProvider}
      resources={resources}
      options={{
        syncWithLocation: true,
        mutationMode: "optimistic",
        reactQuery: {
          clientConfig: {
            defaultOptions: {
              queries: {
                staleTime: 5 * 60 * 1000,  // 5 minutes
                retry: 2,
              },
            },
          },
        },
      }}
    >
      {/* Layout visuel shadcnuikit (sidebar, header, etc.) reste ici */}
      {children}
    </Refine>
  );
}
```

**Important :** `<Refine>` est un Context Provider invisible. Il ne rend AUCUN HTML. Le layout visuel (sidebar, header, etc.) reste celui de shadcnuikit, inchangé.

---

## 3. DATA PROVIDER FLEETCORE

### 3.1 Interface complète du DataProvider Refine

```typescript
// Source vérifiée : node_modules/@refinedev/core/dist/contexts/data/types.d.ts

type DataProvider = {
  // REQUIS
  getList: (params: GetListParams) => Promise<GetListResponse>;
  getOne: (params: GetOneParams) => Promise<GetOneResponse>;
  create: (params: CreateParams) => Promise<CreateResponse>;
  update: (params: UpdateParams) => Promise<UpdateResponse>;
  deleteOne: (params: DeleteOneParams) => Promise<DeleteOneResponse>;
  getApiUrl: () => string;

  // OPTIONNELS
  getMany?: (params: GetManyParams) => Promise<GetManyResponse>;
  createMany?: (params: CreateManyParams) => Promise<CreateManyResponse>;
  updateMany?: (params: UpdateManyParams) => Promise<UpdateManyResponse>;
  deleteMany?: (params: DeleteManyParams) => Promise<DeleteManyResponse>;
  custom?: (params: CustomParams) => Promise<CustomResponse>;
};
```

### 3.2 Paramètres et réponses de chaque méthode

```typescript
// getList
interface GetListParams {
  resource: string; // "leads", "opportunities", etc.
  pagination?: {
    current: number; // page actuelle (1-based)
    pageSize: number; // items par page
    mode?: "server" | "client" | "off";
  };
  sorters?: Array<{
    field: string; // nom du champ
    order: "asc" | "desc";
  }>;
  filters?: Array<CrudFilter>; // voir section 3.4
  meta?: Record<string, any>; // données additionnelles (voir 3.9)
}

interface GetListResponse<T = any> {
  data: T[];
  total: number;
}

// getOne
interface GetOneParams {
  resource: string;
  id: string | number;
  meta?: Record<string, any>;
}

interface GetOneResponse<T = any> {
  data: T;
}

// create
interface CreateParams<T = any> {
  resource: string;
  variables: T;
  meta?: Record<string, any>;
}

interface CreateResponse<T = any> {
  data: T;
}

// update
interface UpdateParams<T = any> {
  resource: string;
  id: string | number;
  variables: T;
  meta?: Record<string, any>;
}

interface UpdateResponse<T = any> {
  data: T;
}

// deleteOne
interface DeleteOneParams<T = any> {
  resource: string;
  id: string | number;
  variables?: T; // peut contenir la raison de suppression
  meta?: Record<string, any>;
}

interface DeleteOneResponse<T = any> {
  data: T;
}
```

### 3.3 Implémentation du DataProvider FleetCore

```typescript
// lib/providers/refine-data-provider.ts
"use client";

import type { DataProvider } from "@refinedev/core";
import {
  mapRefineSorters,
  mapRefineFilters,
  mapRefinePagination,
} from "./refine-mappers";

// REGISTRE DES RESOURCES
// Chaque resource est mappée vers ses endpoints/Server Actions
const RESOURCE_CONFIG: Record<string, ResourceConfig> = {
  leads: {
    apiBase: "/api/v1/crm/leads",
    // Server Actions pour mutations (import dynamique pour éviter bundling serveur)
    actions: {
      create: () =>
        import("@/lib/actions/crm/lead.actions").then(
          (m) => m.createLeadAction
        ),
      update: () =>
        import("@/lib/actions/crm/lead.actions").then(
          (m) => m.updateLeadAction
        ),
    },
  },
  opportunities: {
    apiBase: "/api/v1/crm/opportunities",
    actions: {
      create: () =>
        import("@/lib/actions/crm/opportunity.actions").then(
          (m) => m.createOpportunityAction
        ),
      update: () =>
        import("@/lib/actions/crm/opportunity.actions").then(
          (m) => m.updateOpportunityAction
        ),
    },
  },
  // ... autres resources ajoutées au fur et à mesure
};

interface ResourceConfig {
  apiBase: string;
  actions?: {
    create?: () => Promise<(...args: any[]) => Promise<any>>;
    update?: () => Promise<(...args: any[]) => Promise<any>>;
    delete?: () => Promise<(...args: any[]) => Promise<any>>;
  };
}

export const dataProvider: DataProvider = {
  getApiUrl: () => "", // Pas d'API REST traditionnelle — tout passe par Next.js

  getList: async ({ resource, pagination, sorters, filters, meta }) => {
    const config = RESOURCE_CONFIG[resource];
    if (!config)
      throw new Error(`Resource "${resource}" not registered in DataProvider`);

    const params = new URLSearchParams();

    // Pagination
    if (pagination && pagination.mode !== "off") {
      const { skip, take } = mapRefinePagination(pagination);
      params.set("limit", String(take));
      params.set("offset", String(skip));
    }

    // Tri
    if (sorters?.length) {
      const sortParam = mapRefineSorters(sorters);
      params.set("sort", sortParam);
    }

    // Filtres
    if (filters?.length) {
      const filterParams = mapRefineFilters(filters);
      filterParams.forEach((value, key) => params.set(key, value));
    }

    // Meta (paramètres custom)
    if (meta) {
      Object.entries(meta).forEach(([key, value]) => {
        if (key !== "queryContext") params.set(key, String(value));
      });
    }

    const url = `${config.apiBase}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`getList ${resource} failed: ${response.status}`);
    }

    const result = await response.json();

    // Normaliser la réponse — les API FleetCore retournent des formats variés
    return {
      data: result.data ?? result.leads ?? result.opportunities ?? result,
      total:
        result.total ??
        result.count ??
        (Array.isArray(result.data) ? result.data.length : 0),
    };
  },

  getOne: async ({ resource, id, meta }) => {
    const config = RESOURCE_CONFIG[resource];
    if (!config)
      throw new Error(`Resource "${resource}" not registered in DataProvider`);

    const response = await fetch(`${config.apiBase}/${id}`);

    if (!response.ok) {
      throw new Error(`getOne ${resource}/${id} failed: ${response.status}`);
    }

    const result = await response.json();
    return { data: result.data ?? result };
  },

  create: async ({ resource, variables, meta }) => {
    const config = RESOURCE_CONFIG[resource];
    if (!config)
      throw new Error(`Resource "${resource}" not registered in DataProvider`);

    // Préférer Server Action si disponible
    if (config.actions?.create) {
      const action = await config.actions.create();
      const result = await action(variables);
      return { data: result.data ?? result };
    }

    // Fallback : POST API route
    const response = await fetch(config.apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(variables),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error ?? `create ${resource} failed: ${response.status}`
      );
    }

    const result = await response.json();
    return { data: result.data ?? result };
  },

  update: async ({ resource, id, variables, meta }) => {
    const config = RESOURCE_CONFIG[resource];
    if (!config)
      throw new Error(`Resource "${resource}" not registered in DataProvider`);

    // Préférer Server Action si disponible
    if (config.actions?.update) {
      const action = await config.actions.update();
      const result = await action(id, variables);
      return { data: result.data ?? result };
    }

    // Fallback : PUT API route
    const response = await fetch(`${config.apiBase}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(variables),
    });

    if (!response.ok) {
      throw new Error(`update ${resource}/${id} failed: ${response.status}`);
    }

    const result = await response.json();
    return { data: result.data ?? result };
  },

  deleteOne: async ({ resource, id, variables, meta }) => {
    const config = RESOURCE_CONFIG[resource];
    if (!config)
      throw new Error(`Resource "${resource}" not registered in DataProvider`);

    const params = new URLSearchParams();
    // FleetCore exige une raison pour soft delete
    if (variables && typeof variables === "object" && "reason" in variables) {
      params.set("reason", String((variables as any).reason));
    }

    const url = `${config.apiBase}/${id}${params.toString() ? "?" + params.toString() : ""}`;
    const response = await fetch(url, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`deleteOne ${resource}/${id} failed: ${response.status}`);
    }

    return { data: { id } as any };
  },
};
```

### 3.4 Gestion des filtres — Transformation Refine → FleetCore

```typescript
// lib/providers/refine-mappers.ts

import type { CrudFilter, CrudSort, Pagination } from "@refinedev/core";

/**
 * Types de filtres Refine :
 * - LogicalFilter : { field, operator, value }
 * - ConditionalFilter : { operator: "and"|"or", value: CrudFilter[] }
 */

// Mapping opérateurs Refine → paramètres URL FleetCore
const OPERATOR_MAP: Record<string, string> = {
  eq: "eq",
  ne: "ne",
  lt: "lt",
  gt: "gt",
  lte: "lte",
  gte: "gte",
  contains: "contains",
  ncontains: "ncontains",
  containss: "containss", // case-sensitive contains
  startswith: "startswith",
  endswith: "endswith",
  in: "in",
  nin: "nin",
  null: "null",
  nnull: "nnull",
  between: "between",
};

/**
 * Transforme les filtres Refine en paramètres URL
 * Format sortie : filter[field][operator]=value
 *
 * Exemples :
 * - { field: "status", operator: "eq", value: "new" }
 *   → filter[status][eq]=new
 *
 * - { field: "company_name", operator: "contains", value: "Trans" }
 *   → filter[company_name][contains]=Trans
 *
 * - { field: "scoring", operator: "gte", value: 70 }
 *   → filter[scoring][gte]=70
 */
export function mapRefineFilters(filters: CrudFilter[]): URLSearchParams {
  const params = new URLSearchParams();

  for (const filter of filters) {
    if ("field" in filter) {
      // LogicalFilter
      const op = OPERATOR_MAP[filter.operator] ?? filter.operator;
      const value = Array.isArray(filter.value)
        ? filter.value.join(",")
        : String(filter.value);
      params.set(`filter[${filter.field}][${op}]`, value);
    }
    // ConditionalFilter (and/or) : à implémenter si les API routes FleetCore le supportent
  }

  return params;
}

/**
 * Transforme les sorters Refine en paramètre URL
 * Format : sort=field:order (ou -field pour DESC)
 *
 * Exemple : [{ field: "created_at", order: "desc" }]
 *   → sort=-created_at
 */
export function mapRefineSorters(sorters: CrudSort[]): string {
  return sorters
    .map((s) => (s.order === "desc" ? `-${s.field}` : s.field))
    .join(",");
}

/**
 * Transforme la pagination Refine en skip/take Prisma-style
 *
 * Refine utilise current (1-based) + pageSize
 * FleetCore/Prisma utilise skip + take (ou offset + limit)
 */
export function mapRefinePagination(pagination: Pagination): {
  skip: number;
  take: number;
} {
  const current = pagination.current ?? 1;
  const pageSize = pagination.pageSize ?? 10;
  return {
    skip: (current - 1) * pageSize,
    take: pageSize,
  };
}
```

### 3.5 Pourquoi le DataProvider N'A PAS besoin de gérer le multi-tenant

C'est la découverte la plus importante de l'analyse. Les Server Actions FleetCore gèrent DÉJÀ l'isolation multi-tenant en interne :

```typescript
// Extrait de lib/actions/crm/lead.actions.ts (pattern IDENTIQUE dans TOUTES les actions)
export async function updateLeadAction(leadId: string, data: any) {
  const { userId, orgId } = await auth(); // ← Clerk auth
  const providerId = await getCurrentProviderId(); // ← résolution tenant
  const providerFilter = buildProviderFilter(providerId); // ← filtre isolation

  // ... Prisma query avec providerFilter appliqué automatiquement
}
```

Le DataProvider est un simple passe-plat. Il appelle la Server Action ou l'API route, et le backend s'occupe de tout. Le frontend n'a JAMAIS besoin de connaître le `providerId` ou l'`orgId`.

### 3.6 Gestion des erreurs

```typescript
// Pattern d'erreur standardisé dans le DataProvider
// Les API routes FleetCore retournent déjà des erreurs structurées :
// { error: "message", details?: { field: "message" }[] }

// Le DataProvider propage les erreurs — Refine les intercepte via :
// 1. Le notificationProvider (affiche un toast)
// 2. L'option onError globale (logging, redirect)
// 3. Le composant qui a déclenché la requête (isError, error dans le hook)
```

### 3.7 Ajout d'une nouvelle resource au DataProvider

Checklist pour ajouter une resource (ex: "quotes") :

1. Ajouter l'entrée dans `RESOURCE_CONFIG` :

```typescript
quotes: {
  apiBase: "/api/v1/crm/quotes",
  actions: {
    create: () => import("@/lib/actions/crm/quote.actions").then(m => m.createQuoteAction),
    update: () => import("@/lib/actions/crm/quote.actions").then(m => m.updateQuoteAction),
  },
},
```

2. Vérifier que l'API route retourne le format attendu : `{ data: [...], total: number }`
3. Déclarer la resource dans `refine-resources.ts` (voir Section 6)

### 3.8 Le paramètre `meta`

`meta` est un objet ouvert (Record<string, any>) disponible dans CHAQUE méthode du DataProvider. Il permet de passer des informations supplémentaires sans modifier l'interface.

**Cas d'usage FleetCore :**

```typescript
// Inclure des relations dans la réponse
useList({ resource: "leads", meta: { include: "activities,opportunities" } });

// Forcer un provider spécifique (admin uniquement)
useList({ resource: "leads", meta: { forceProvider: "uuid-provider" } });

// Filtres custom non couverts par CrudFilter
useList({ resource: "leads", meta: { stage: "sales_qualified" } });
```

**Convention :** `meta` est transformé en query params par le DataProvider (sauf `queryContext` qui est interne à TanStack Query).

---

## 4. AUTH PROVIDER FLEETCORE

### 4.1 Interface AuthProvider Refine

```typescript
// Source : node_modules/@refinedev/core/dist/contexts/auth/types.d.ts
type AuthProvider = {
  login: (params: any) => Promise<AuthActionResponse>; // REQUIS
  logout: (params: any) => Promise<AuthActionResponse>; // REQUIS
  check: (params?: any) => Promise<CheckResponse>; // REQUIS
  onError: (error: any) => Promise<OnErrorResponse>; // REQUIS
  register?: (params: any) => Promise<AuthActionResponse>;
  forgotPassword?: (params: any) => Promise<AuthActionResponse>;
  updatePassword?: (params: any) => Promise<AuthActionResponse>;
  getPermissions?: (params?: any) => Promise<any>;
  getIdentity?: (params?: any) => Promise<any>;
};

// Réponses
type AuthActionResponse = {
  success: boolean;
  redirectTo?: string;
  error?: Error;
};
type CheckResponse = {
  authenticated: boolean;
  redirectTo?: string;
  logout?: boolean;
  error?: Error;
};
type OnErrorResponse = { logout?: boolean; redirectTo?: string; error?: Error };
```

### 4.2 Implémentation AuthProvider FleetCore

```typescript
// lib/providers/refine-auth-provider.ts
"use client";

import type { AuthProvider } from "@refinedev/core";
import { useAuth, useUser, useOrganization } from "@clerk/nextjs";

// NOTE : Ce provider est utilisé dans un contexte client.
// Clerk fournit deux APIs :
//   - Serveur : auth() depuis @clerk/nextjs/server (Server Components, Server Actions)
//   - Client : useAuth(), useUser(), useOrganization() depuis @clerk/nextjs
// Le AuthProvider Refine est TOUJOURS côté client → on utilise les hooks client Clerk.

// IMPORTANT : L'AuthProvider est créé comme un objet statique.
// Les hooks Clerk sont utilisés dans les composants qui consomment Refine,
// pas directement dans l'objet provider.
// On utilise donc des appels fetch pour vérifier l'auth côté provider.

export const authProvider: AuthProvider = {
  login: async () => {
    // Clerk gère le login via <SignIn> — Refine ne le contrôle pas
    return { success: true, redirectTo: "/dashboard" };
  },

  logout: async () => {
    // Le logout est déclenché par Clerk <UserButton>
    // On signale juste la redirection
    return { success: true, redirectTo: "/sign-in" };
  },

  check: async () => {
    // Vérifier si l'utilisateur est authentifié
    // En contexte client, on fait un appel léger
    try {
      const response = await fetch("/api/auth/check");
      if (response.ok) {
        return { authenticated: true };
      }
      return { authenticated: false, redirectTo: "/sign-in", logout: true };
    } catch {
      return { authenticated: false, redirectTo: "/sign-in", logout: true };
    }
  },

  onError: async (error) => {
    const status = (error as any)?.statusCode ?? (error as any)?.status;
    if (status === 401) {
      return { logout: true, redirectTo: "/sign-in" };
    }
    if (status === 403) {
      return { redirectTo: "/dashboard?error=forbidden" };
    }
    return {};
  },

  getIdentity: async () => {
    try {
      const response = await fetch("/api/auth/identity");
      if (response.ok) {
        const user = await response.json();
        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          avatar: user.imageUrl,
        };
      }
    } catch {}
    return null;
  },

  getPermissions: async () => {
    try {
      const response = await fetch("/api/auth/permissions");
      if (response.ok) {
        return await response.json();
      }
    } catch {}
    return null;
  },
};
```

**Note API routes auth :** Les endpoints `/api/auth/check`, `/api/auth/identity`, `/api/auth/permissions` sont de simples wrappers autour de Clerk `auth()` côté serveur. Si ils n'existent pas encore, ils doivent être créés comme routes légères (~10 lignes chacune).

### 4.3 Gestion SSR vs Client

| Contexte            | API Clerk                              | Usage                                    |
| ------------------- | -------------------------------------- | ---------------------------------------- |
| Server Components   | `auth()` depuis `@clerk/nextjs/server` | Protection routes, data fetching initial |
| Server Actions      | `auth()` depuis `@clerk/nextjs/server` | Toutes les mutations backend             |
| Middleware          | `clerkMiddleware()`                    | Routing, protection globale              |
| AuthProvider Refine | `fetch()` vers API routes              | Vérification auth côté client            |
| Composants client   | `useAuth()`, `useUser()`               | Affichage UI (nom, avatar, etc.)         |

**Le middleware Clerk reste la première ligne de défense.** L'AuthProvider Refine est une couche supplémentaire pour que les hooks Refine (useIsAuthenticated, etc.) fonctionnent correctement.

---

## 5. ACCESS CONTROL PROVIDER

### 5.1 Interface Refine

```typescript
// Source : node_modules/@refinedev/core/dist/contexts/accessControl/types.d.ts
type AccessControlProvider = {
  can: (params: CanParams) => Promise<CanReturnType>;
  options?: {
    buttons?: {
      enableAccessControl?: boolean;
      hideIfUnauthorized?: boolean;
    };
  };
};

type CanParams = {
  resource: string;
  action: string;
  params?: { resource?: any; id?: string | number; [key: string]: any };
};

type CanReturnType = {
  can: boolean;
  reason?: string;
};
```

### 5.2 Implémentation — Mapping vers RBAC FleetCore

```typescript
// lib/providers/refine-access-control-provider.ts
"use client";

import type { AccessControlProvider } from "@refinedev/core";

/**
 * FleetCore RBAC utilise le format "module:action" :
 * - "crm:view", "crm:create", "crm:edit", "crm:delete"
 * - "fleet:view", "fleet:create", "fleet:edit", "fleet:delete"
 * - "billing:view", etc.
 *
 * Source : lib/config/permissions.ts
 * 7 rôles Clerk Organizations :
 *   org:admin, org:adm_admin, org:adm_commercial, org:adm_support,
 *   org:provider_admin, org:provider_manager, org:provider_user
 *
 * 30+ permissions au format "module:action"
 */

// Mapping resource Refine → module FleetCore
const RESOURCE_TO_MODULE: Record<string, string> = {
  leads: "crm",
  opportunities: "crm",
  quotes: "crm",
  contracts: "crm",
  vehicles: "fleet",
  drivers: "drivers",
  invoices: "billing",
  tenants: "admin",
  members: "admin",
  roles: "admin",
};

// Mapping action Refine → action FleetCore
const ACTION_MAP: Record<string, string> = {
  list: "view",
  show: "view",
  create: "create",
  edit: "edit",
  delete: "delete",
  clone: "create",
  export: "view",
};

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action, params }) => {
    try {
      const module = RESOURCE_TO_MODULE[resource] ?? resource;
      const fleetcoreAction = ACTION_MAP[action] ?? action;
      const permission = `${module}:${fleetcoreAction}`;

      // Appel API pour vérifier la permission
      // (côté serveur, utilise hasPermission(role, permission))
      const response = await fetch(`/api/auth/can?permission=${permission}`);

      if (response.ok) {
        const result = await response.json();
        return {
          can: result.can,
          reason: result.can ? undefined : `Permission "${permission}" denied`,
        };
      }

      return { can: false, reason: "Permission check failed" };
    } catch {
      return { can: false, reason: "Permission check error" };
    }
  },

  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true, // Masquer les boutons si pas de permission
    },
  },
};
```

### 5.3 Usage dans les composants

```typescript
// AVANT (pattern actuel FleetCore)
import { useHasPermission } from "@/hooks/useHasPermission";

function LeadsPage() {
  const canCreate = useHasPermission("crm:create");
  return (
    <div>
      {canCreate && <Button>New Lead</Button>}
    </div>
  );
}

// APRÈS (pattern Refine)
import { useCan, CanAccess } from "@refinedev/core";

function LeadsPage() {
  // Option 1 : Hook
  const { data: canCreate } = useCan({ resource: "leads", action: "create" });

  // Option 2 : Composant déclaratif (recommandé)
  return (
    <div>
      <CanAccess resource="leads" action="create">
        <Button>New Lead</Button>
      </CanAccess>
    </div>
  );
}
```

---

## 6. ROUTER PROVIDER

### 6.1 Utilisation native — Zéro code custom

```typescript
// Le routerProvider de @refinedev/nextjs-router utilise :
// - useRouter() de next/navigation
// - usePathname() de next/navigation
// - useSearchParams() de next/navigation
// AUCUN import de react-router-dom.

import routerProvider from "@refinedev/nextjs-router";
// → Passer directement dans <Refine routerProvider={routerProvider}>
```

### 6.2 Déclaration des resources

```typescript
// lib/providers/refine-resources.ts

import type { ResourceProps } from "@refinedev/core";

export const resources: ResourceProps[] = [
  // CRM
  {
    name: "leads",
    list: "/dashboard/crm/leads",
    create: "/dashboard/crm/leads/create",
    edit: "/dashboard/crm/leads/:id/edit",
    show: "/dashboard/crm/leads/:id",
    meta: { label: "Leads", icon: "users", module: "crm" },
  },
  {
    name: "opportunities",
    list: "/dashboard/crm/opportunities",
    create: "/dashboard/crm/opportunities/create",
    edit: "/dashboard/crm/opportunities/:id/edit",
    show: "/dashboard/crm/opportunities/:id",
    meta: { label: "Opportunities", icon: "target", module: "crm" },
  },
  {
    name: "quotes",
    list: "/dashboard/crm/quotes",
    show: "/dashboard/crm/quotes/:id",
    meta: { label: "Quotes", icon: "file-text", module: "crm" },
  },
  {
    name: "contracts",
    list: "/dashboard/crm/contracts",
    show: "/dashboard/crm/contracts/:id",
    meta: { label: "Contracts", icon: "file-signature", module: "crm" },
  },
  // Fleet (à ajouter quand le module est migré)
  // Drivers (à ajouter quand le module est migré)
  // Billing (à ajouter quand le module est migré)
];
```

**Note sur [locale] :** Les routes ci-dessus n'incluent pas `[locale]` car le routerProvider Refine utilise les paths tels que déclarés. Le middleware Next.js gère la résolution de locale en amont. Si FleetCore utilise un prefix locale dans l'URL, les paths doivent être ajustés en conséquence.

---

## 7. PROVIDERS SECONDAIRES

### 7.1 i18nProvider — Bridge react-i18next

```typescript
// lib/providers/refine-i18n-provider.ts
"use client";

import type { I18nProvider } from "@refinedev/core";
import { useTranslation } from "react-i18next";

// Ce hook doit être appelé dans un composant React.
// On crée un hook factory plutôt qu'un objet statique.
export function useRefineI18nProvider(): I18nProvider {
  const { t, i18n } = useTranslation();

  return {
    translate: (key: string, options?: any, defaultMessage?: string) => {
      return t(key, defaultMessage ?? key, options);
    },
    changeLocale: (locale: string) => {
      return i18n.changeLanguage(locale);
    },
    getLocale: () => {
      return i18n.language;
    },
  };
}
```

### 7.2 auditLogProvider — Bridge adm_audit_logs

```typescript
// lib/providers/refine-audit-log-provider.ts
"use client";

import type { AuditLogProvider } from "@refinedev/core";

export const auditLogProvider: AuditLogProvider = {
  create: async (params) => {
    // Les Server Actions FleetCore créent DÉJÀ des audit logs automatiquement
    // Ce provider est un hook optionnel pour les actions UI-only
    // (ex: l'utilisateur a ouvert un drawer, changé de vue, etc.)

    // Pour l'instant : no-op — les audit logs critiques sont côté serveur
    console.debug("[AuditLog]", params.resource, params.action, params.meta);
    return {};
  },

  get: async (params) => {
    // Récupérer les audit logs pour une resource
    const response = await fetch(
      `/api/v1/admin/audit-logs?entity_type=${params.resource}&entity_id=${params.meta?.id}`
    );
    if (response.ok) {
      return await response.json();
    }
    return [];
  },
};
```

### 7.3 notificationProvider — Bridge système notification FleetCore

```typescript
// lib/providers/refine-notification-provider.ts
"use client";

import type { NotificationProvider } from "@refinedev/core";
import { toast } from "sonner"; // ou le système de toast shadcnuikit

export const notificationProvider: NotificationProvider = {
  open: ({ message, description, type, key }) => {
    switch (type) {
      case "success":
        toast.success(message, { description });
        break;
      case "error":
        toast.error(message, { description });
        break;
      case "progress":
        toast.loading(message, { description, id: key });
        break;
      default:
        toast(message, { description });
    }
  },
  close: (key) => {
    toast.dismiss(key);
  },
};
```

### 7.4 liveProvider — Non implémenté V1

```typescript
// Stub pour futur : Supabase Realtime ou WebSocket
// Ne pas implémenter maintenant — pas de besoin business immédiat
// Quand nécessaire : @refinedev/supabase fournit un liveProvider prêt à l'emploi
```

---

## 8. PATTERN STANDARD PAR RESOURCE

**C'est LA SECTION LA PLUS IMPORTANTE.** Elle définit le pattern que TOUTES les resources DOIVENT suivre. Aucune déviation autorisée.

### 8.1 Structure de fichiers

```
src/features/{module}/{resource}/
├── components/
│   ├── {resource}-list-page.tsx        → Page liste (orchestrator)
│   ├── {resource}-table.tsx            → DataTable shadcnuikit
│   ├── {resource}-columns.tsx          → ColumnDef[] TanStack Table
│   ├── {resource}-create-dialog.tsx    → Dialog création
│   ├── {resource}-edit-drawer.tsx      → Drawer édition
│   ├── {resource}-detail-panel.tsx     → Panel détail (show)
│   ├── {resource}-filters.tsx          → Composants filtres
│   └── {resource}-kanban.tsx           → Vue Kanban (si applicable)
├── hooks/
│   └── use-{resource}-table.ts         → Configuration useTable Refine
├── schemas/
│   └── {resource}.schema.ts            → Zod schemas (create, update, filter)
└── types/
    └── {resource}.types.ts             → TypeScript interfaces
```

### 8.2 Cycle de vie d'une requête LIST

```
1. Composant monte → useTable("leads") appelé
2. Refine génère queryKey ["leads", "list", { filters, sorters, pagination }]
3. TanStack Query vérifie le cache :
   - Si frais (< staleTime) → retourne le cache, PAS de requête réseau
   - Si périmé → refetch en background, affiche le cache en attendant
4. Si requête nécessaire → DataProvider.getList() appelé
5. DataProvider transforme les params Refine → params URL FleetCore
6. fetch() vers /api/v1/crm/leads?limit=10&offset=0&sort=-created_at
7. API route exécute : auth → RBAC → Prisma query (avec buildProviderFilter)
8. Réponse { data: [...], total: 42 }
9. TanStack Query met en cache et notifie le composant
10. Composant re-render avec les données
```

### 8.3 Cycle de vie d'une MUTATION (create/update/delete)

```
1. Utilisateur soumet le formulaire
2. useCreate("leads").mutate(variables) appelé
3. Mode optimistic :
   a. TanStack Query met à jour le cache IMMÉDIATEMENT (avant réponse serveur)
   b. UI reflète le changement instantanément
4. DataProvider.create() appelé en background
5. Server Action createLeadAction(variables) exécuté
6. Si succès :
   a. Cache confirmé (déjà à jour grâce à l'optimistic)
   b. TanStack Query invalide automatiquement les queries ["leads", "list", *]
   c. Notification success via notificationProvider
7. Si erreur :
   a. TanStack Query ROLLBACK le cache à l'état précédent
   b. Notification error via notificationProvider
   c. Le composant reçoit isError = true
```

### 8.4 Pattern du hook useTable pour chaque resource

```typescript
// features/crm/leads/hooks/use-leads-table.ts
"use client";

import { useTable } from "@refinedev/core";
import type { Lead } from "../types/lead.types";

export function useLeadsTable() {
  return useTable<Lead>({
    resource: "leads",
    pagination: {
      pageSize: 20,
      mode: "server",
    },
    sorters: {
      initial: [{ field: "created_at", order: "desc" }],
      mode: "server",
    },
    filters: {
      mode: "server",
      // Filtres par défaut (tous les leads actifs)
      initial: [{ field: "status", operator: "ne", value: "deleted" }],
    },
    syncWithLocation: true, // URL reflète pagination/filtres/tri
  });
}
```

---

## 9. EXEMPLE COMPLET : CRM LEADS

Cette section montre le MODÈLE que tous les autres modules doivent copier.

### 9.1 Types

```typescript
// features/crm/leads/types/lead.types.ts

export interface Lead {
  id: string;
  lead_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  industry?: string;
  company_size?: string;
  fleet_size?: string;
  country_code?: string;
  status: LeadStatus;
  lead_stage: LeadStage;
  fit_score?: number;
  engagement_score?: number;
  qualification_score?: number;
  assigned_to?: string;
  source_id?: string;
  next_action_date?: string;
  gdpr_consent: boolean;
  created_at: string;
  updated_at: string;
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "working"
  | "qualified"
  | "lost"
  | "converted"
  | "deleted";
export type LeadStage =
  | "top_of_funnel"
  | "marketing_qualified"
  | "sales_qualified"
  | "opportunity_ready";
```

### 9.2 Schemas Zod

```typescript
// features/crm/leads/schemas/lead.schema.ts

import { z } from "zod";

export const createLeadSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  industry: z.string().optional(),
  fleet_size: z.string().optional(),
  country_code: z.string().max(2).optional(),
  message: z.string().optional(),
  gdpr_consent: z.boolean().default(false),
});

export const updateLeadSchema = createLeadSchema.partial();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
```

### 9.3 Colonnes table

```typescript
// features/crm/leads/components/lead-columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Lead } from "../types/lead.types";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export function useLeadColumns(): ColumnDef<Lead>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "lead_code",
      header: t("leads.table.code"),
      size: 120,
    },
    {
      accessorKey: "first_name",
      header: t("leads.table.name"),
      cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`,
    },
    {
      accessorKey: "email",
      header: t("leads.table.email"),
    },
    {
      accessorKey: "company_name",
      header: t("leads.table.company"),
    },
    {
      accessorKey: "status",
      header: t("leads.table.status"),
      cell: ({ getValue }) => <Badge variant="outline">{getValue<string>()}</Badge>,
    },
    {
      accessorKey: "qualification_score",
      header: t("leads.table.score"),
      cell: ({ getValue }) => {
        const score = getValue<number>();
        return score != null ? `${score}/100` : "—";
      },
    },
    {
      accessorKey: "created_at",
      header: t("leads.table.created"),
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
    },
  ];
}
```

### 9.4 Page liste

```typescript
// features/crm/leads/components/leads-list-page.tsx
"use client";

import { useLeadsTable } from "../hooks/use-leads-table";
import { useLeadColumns } from "./lead-columns";
import { LeadsCreateDialog } from "./leads-create-dialog";
import { DataTable } from "@/components/ui/data-table";  // shadcnuikit
import { CanAccess } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export function LeadsListPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const columns = useLeadColumns();

  const {
    tableQuery: { data, isLoading, isError },
    current,
    setCurrent,
    pageSize,
    setPageSize,
    sorters,
    setSorters,
    filters,
    setFilters,
    pageCount,
  } = useLeadsTable();

  return (
    <div className="space-y-4">
      {/* Header avec bouton Create protégé par RBAC */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("leads.title")}</h1>
        <CanAccess resource="leads" action="create">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("leads.actions.create")}
          </Button>
        </CanAccess>
      </div>

      {/* DataTable shadcnuikit avec données Refine */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={{ pageIndex: current - 1, pageSize }}
        onPaginationChange={({ pageIndex, pageSize: newSize }) => {
          setCurrent(pageIndex + 1);
          setPageSize(newSize);
        }}
        sorting={sorters.map(s => ({ id: s.field, desc: s.order === "desc" }))}
        onSortingChange={(sorting) => {
          setSorters(sorting.map((s: any) => ({ field: s.id, order: s.desc ? "desc" : "asc" })));
        }}
      />

      {/* Dialog création */}
      <LeadsCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
```

### 9.5 Dialog création

```typescript
// features/crm/leads/components/leads-create-dialog.tsx
"use client";

import { useCreate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLeadSchema, type CreateLeadInput } from "../schemas/lead.schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadsCreateDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { mutate: createLead, isLoading } = useCreate();

  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      gdpr_consent: false,
    },
  });

  const onSubmit = (values: CreateLeadInput) => {
    createLead(
      {
        resource: "leads",
        values,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
          // Cache "leads" list automatiquement invalidé par Refine
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("leads.create.title")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("leads.fields.first_name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("leads.fields.last_name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("leads.fields.email")}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* Autres champs selon besoin */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 10. PLAN DE MIGRATION INCRÉMENTAL

### 10.1 Phase 0 — Infrastructure Refine (1-2 jours)

| Étape | Action                                                                                      | Validation                                     |
| ----- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 0.1   | Installer packages (`@refinedev/core`, `@refinedev/nextjs-router`, `@tanstack/react-query`) | `pnpm build` passe sans erreur                 |
| 0.2   | Créer `lib/providers/refine-data-provider.ts` avec RESOURCE_CONFIG vide                     | TypeScript compile                             |
| 0.3   | Créer `lib/providers/refine-auth-provider.ts`                                               | TypeScript compile                             |
| 0.4   | Créer `lib/providers/refine-access-control-provider.ts`                                     | TypeScript compile                             |
| 0.5   | Créer `lib/providers/refine-i18n-provider.ts`                                               | TypeScript compile                             |
| 0.6   | Créer `lib/providers/refine-audit-log-provider.ts`                                          | TypeScript compile                             |
| 0.7   | Créer `lib/providers/refine-notification-provider.ts`                                       | TypeScript compile                             |
| 0.8   | Créer `lib/providers/refine-resources.ts` avec resources CRM                                | TypeScript compile                             |
| 0.9   | Créer `lib/providers/refine-mappers.ts`                                                     | TypeScript compile                             |
| 0.10  | Ajouter `<Refine>` dans `dashboard/layout.tsx`                                              | App fonctionne IDENTIQUEMENT (zéro régression) |
| 0.11  | Créer API routes auth (`/api/auth/check`, `/api/auth/identity`, `/api/auth/can`)            | Endpoints répondent correctement               |

**Critère de validation Phase 0 :** L'application fonctionne EXACTEMENT comme avant. Aucune page ne change. Refine est installé mais n'est pas encore consommé par les composants.

### 10.2 Phase 1 — Module pilote CRM Leads (3-5 jours)

| Étape | Action                                                                            | Validation                                 |
| ----- | --------------------------------------------------------------------------------- | ------------------------------------------ |
| 1.1   | Ajouter "leads" dans RESOURCE_CONFIG du DataProvider                              | getList/getOne fonctionnent via Refine     |
| 1.2   | Créer `features/crm/leads/types/lead.types.ts`                                    | Types compilent                            |
| 1.3   | Créer `features/crm/leads/schemas/lead.schema.ts`                                 | Zod schemas valides                        |
| 1.4   | Créer `features/crm/leads/hooks/use-leads-table.ts`                               | Hook retourne des données                  |
| 1.5   | Créer `features/crm/leads/components/lead-columns.tsx`                            | Colonnes définies                          |
| 1.6   | Créer `features/crm/leads/components/leads-list-page.tsx`                         | Page affiche la table avec données réelles |
| 1.7   | Créer `features/crm/leads/components/leads-create-dialog.tsx`                     | Création fonctionne + cache invalidé       |
| 1.8   | Créer `features/crm/leads/components/leads-edit-drawer.tsx`                       | Édition fonctionne + cache invalidé        |
| 1.9   | Vérifier RBAC : useCan masque les boutons correctement                            | Permissions respectées                     |
| 1.10  | Vérifier pagination URL : changement page → URL change → refresh → même page      | syncWithLocation OK                        |
| 1.11  | Vérifier optimistic update : créer un lead → apparaît IMMÉDIATEMENT dans la liste | Mode optimistic OK                         |
| 1.12  | Remplacer l'ancienne page leads par la nouvelle                                   | L'ancienne page est supprimée              |

**Critère de validation Phase 1 :** La page Leads est 100% fonctionnelle via Refine. Même fonctionnalités que l'ancienne. EN PLUS : cache, invalidation, optimistic updates, URL sync, RBAC déclaratif.

### 10.3 Phase 2 — CRM Opportunities (3-5 jours)

Appliquer le MÊME pattern que Phase 1 pour les opportunities. Valider la reproductibilité du pattern. Documenter tout ajustement.

### 10.4 Phase 3 — CRM Quotes + Contracts (3-5 jours)

Idem. À ce stade, le pattern est validé sur 4 resources CRM.

### 10.5 Phase 4+ — Généralisation

Un module à la fois (Fleet, Drivers, Billing, Admin). Chaque module suit le pattern de la Section 8.

---

## 11. CONVENTIONS ET RÈGLES

### 11.1 Naming conventions

| Élément               | Convention                      | Exemple                   |
| --------------------- | ------------------------------- | ------------------------- |
| Fichier type          | `{resource}.types.ts`           | `lead.types.ts`           |
| Fichier schema        | `{resource}.schema.ts`          | `lead.schema.ts`          |
| Fichier colonnes      | `{resource}-columns.tsx`        | `lead-columns.tsx`        |
| Fichier page liste    | `{resource}-list-page.tsx`      | `leads-list-page.tsx`     |
| Fichier dialog create | `{resource}-create-dialog.tsx`  | `leads-create-dialog.tsx` |
| Fichier drawer edit   | `{resource}-edit-drawer.tsx`    | `leads-edit-drawer.tsx`   |
| Hook table            | `use-{resource}-table.ts`       | `use-leads-table.ts`      |
| Dossier feature       | `features/{module}/{resource}/` | `features/crm/leads/`     |

### 11.2 Règles d'import

```typescript
// ✅ CORRECT : imports depuis @refinedev
import {
  useList,
  useCreate,
  useUpdate,
  useDelete,
  useCan,
  CanAccess,
} from "@refinedev/core";

// ✅ CORRECT : imports shadcnuikit
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

// ✅ CORRECT : imports feature locale
import { useLeadsTable } from "../hooks/use-leads-table";
import type { Lead } from "../types/lead.types";

// ❌ INTERDIT : fetch() direct dans un composant
const data = await fetch("/api/v1/crm/leads"); // NON — utiliser useList

// ❌ INTERDIT : import Server Action dans un composant client
import { createLeadAction } from "@/lib/actions/crm/lead.actions"; // NON — passer par le DataProvider

// ❌ INTERDIT : useHasPermission pour RBAC (ancien pattern)
import { useHasPermission } from "@/hooks/useHasPermission"; // NON — utiliser useCan
```

### 11.3 Ce qui est INTERDIT

| #   | Interdit                                                           | Raison                                                    |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| 1   | `fetch()` direct dans un composant                                 | Doit passer par les hooks Refine (useList, useOne, etc.)  |
| 2   | Import de Server Action dans un composant client                   | Doit passer par le DataProvider                           |
| 3   | useState pour stocker des données serveur                          | TanStack Query gère le state serveur                      |
| 4   | Invalidation manuelle du cache                                     | Refine invalide automatiquement après mutation            |
| 5   | Créer un hook CRUD custom (useLeads, useFetchOpportunities)        | Utiliser useList, useOne, useCreate, useUpdate, useDelete |
| 6   | Modifier le DataProvider pour une seule resource                   | Ajouter dans RESOURCE_CONFIG, pas de cas spécial          |
| 7   | Contourner le RBAC Refine (useCan) pour revenir à useHasPermission | Transition complète vers le pattern Refine                |
| 8   | Modifier les Server Actions pour s'adapter à Refine                | Refine s'adapte à FleetCore, pas l'inverse                |

### 11.4 Checklist pour ajouter une nouvelle resource

```
□ 1. Créer le dossier features/{module}/{resource}/
□ 2. Créer types/{resource}.types.ts avec interface TypeScript
□ 3. Créer schemas/{resource}.schema.ts avec Zod create + update
□ 4. Ajouter l'entrée dans RESOURCE_CONFIG (refine-data-provider.ts)
□ 5. Ajouter la resource dans refine-resources.ts
□ 6. Créer hooks/use-{resource}-table.ts
□ 7. Créer components/{resource}-columns.tsx
□ 8. Créer components/{resource}-list-page.tsx
□ 9. Créer components/{resource}-create-dialog.tsx
□ 10. Créer components/{resource}-edit-drawer.tsx
□ 11. Vérifier : useList retourne les données
□ 12. Vérifier : useCreate fonctionne + cache invalidé
□ 13. Vérifier : useCan masque correctement les boutons
□ 14. Vérifier : syncWithLocation fonctionne (URL ↔ pagination)
□ 15. Supprimer l'ancienne page custom
```

---

## 12. GLOSSAIRE

| Terme Refine             | Terme FleetCore                  | Explication                                                      |
| ------------------------ | -------------------------------- | ---------------------------------------------------------------- |
| Resource                 | Module / Entité                  | "leads", "opportunities", "vehicles" — un type de données CRUD   |
| DataProvider             | Server Actions + API Routes      | Couche d'accès aux données — wrapper autour du backend FleetCore |
| AuthProvider             | Clerk                            | Gestion authentification — login, logout, check, identity        |
| AccessControlProvider    | RBAC (lib/config/permissions.ts) | Permissions — qui peut faire quoi                                |
| RouterProvider           | Next.js App Router               | Navigation et routing                                            |
| useList                  | fetch GET /api/v1/crm/leads      | Lire une liste avec filtres, pagination, tri                     |
| useOne                   | fetch GET /api/v1/crm/leads/[id] | Lire un élément unique                                           |
| useCreate                | createLeadAction()               | Créer un élément                                                 |
| useUpdate                | updateLeadAction()               | Modifier un élément                                              |
| useDelete                | DELETE /api/v1/crm/leads/[id]    | Supprimer un élément (soft delete)                               |
| useCan                   | hasPermission(role, permission)  | Vérifier une permission                                          |
| `<CanAccess>`            | `{canCreate && <Button>}`        | Afficher conditionnellement selon permission                     |
| meta                     | Query params additionnels        | Données extra passées au DataProvider                            |
| syncWithLocation         | nuqs URL state                   | Synchronisation état ↔ URL                                      |
| staleTime                | — (inexistant avant)             | Durée pendant laquelle le cache est considéré frais              |
| mutationMode: optimistic | — (inexistant avant)             | UI mise à jour avant confirmation serveur                        |
| queryKey                 | — (inexistant avant)             | Identifiant unique d'une requête dans le cache TanStack Query    |

---

## ANNEXE A — FICHIERS À CRÉER (RÉSUMÉ)

```
INFRASTRUCTURE (Phase 0) :
├── lib/providers/refine-data-provider.ts      → ~200 lignes
├── lib/providers/refine-mappers.ts            → ~80 lignes
├── lib/providers/refine-auth-provider.ts      → ~60 lignes
├── lib/providers/refine-access-control-provider.ts → ~40 lignes
├── lib/providers/refine-i18n-provider.ts      → ~15 lignes
├── lib/providers/refine-audit-log-provider.ts → ~30 lignes
├── lib/providers/refine-notification-provider.ts → ~25 lignes
├── lib/providers/refine-resources.ts          → ~50 lignes
├── app/api/auth/check/route.ts                → ~10 lignes
├── app/api/auth/identity/route.ts             → ~15 lignes
└── app/api/auth/can/route.ts                  → ~20 lignes
                                          TOTAL : ~545 lignes

PAR RESOURCE (Phase 1+, exemple leads) :
├── features/crm/leads/types/lead.types.ts     → ~40 lignes
├── features/crm/leads/schemas/lead.schema.ts  → ~30 lignes
├── features/crm/leads/hooks/use-leads-table.ts → ~25 lignes
├── features/crm/leads/components/lead-columns.tsx → ~80 lignes
├── features/crm/leads/components/leads-list-page.tsx → ~60 lignes
├── features/crm/leads/components/leads-create-dialog.tsx → ~80 lignes
└── features/crm/leads/components/leads-edit-drawer.tsx → ~100 lignes
                                          TOTAL : ~415 lignes par resource
```

---

## ANNEXE B — UUIDS ET CONSTANTES DE RÉFÉRENCE

| Élément                  | Valeur                                 | Usage                                         |
| ------------------------ | -------------------------------------- | --------------------------------------------- |
| FleetCore Admin Provider | `7ad8173c-68c5-41d3-9918-686e4e941cc0` | Provider par défaut, stocké dans adm_settings |
| staleTime par défaut     | `5 * 60 * 1000` (5 minutes)            | Durée cache TanStack Query                    |
| pageSize par défaut      | `20`                                   | Pagination par défaut                         |
| mutationMode par défaut  | `"optimistic"`                         | Optimistic updates activés                    |

---

## ANNEXE C — WORKFLOW PRISMA (RAPPEL)

```
⚠️ WORKFLOW OBLIGATOIRE — AUCUNE EXCEPTION

1. Modifications SQL manuelles dans Supabase SQL Editor
2. Modifier schema.prisma manuellement (correspondance avec DB)
3. pnpm prisma generate

JAMAIS : prisma db push / db pull / migrate (provoque des drifts)
```

---

_Document rédigé le 14 février 2026_
_Ce document est le CONTRAT TECHNIQUE de l'intégration Refine dans FleetCore._
_Toute déviation doit être validée par le CEO/CTO avant implémentation._
