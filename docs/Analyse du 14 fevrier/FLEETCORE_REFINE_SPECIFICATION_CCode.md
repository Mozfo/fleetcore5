# SPÉCIFICATION D'INTÉGRATION REFINE.DEV DANS FLEETCORE

**Date :** 10 Février 2026
**Version :** 1.0
**Stack :** Next.js 16.1.6 · React 19.2.4 · @refinedev/core 5.0.9 · @refinedev/nextjs-router 7.0.4
**Prérequis :** Lecture de `docs/REFINE_VS_CUSTOM_ANALYSIS.md` (décision validée : Refine retenu)

---

## Table des matières

1. [Architecture globale — Avant / Après Refine](#1-architecture-globale)
2. [DataProvider FleetCore](#2-dataprovider-fleetcore)
3. [AuthProvider FleetCore](#3-authprovider-fleetcore)
4. [AccessControlProvider FleetCore](#4-accesscontrolprovider-fleetcore)
5. [RouterProvider FleetCore](#5-routerprovider-fleetcore)
6. [Providers secondaires](#6-providers-secondaires)
7. [Pattern standard par ressource — Exemple complet Leads](#7-pattern-standard-par-ressource)
8. [Plan de migration incrémental](#8-plan-de-migration-incrémental)
9. [Conventions et règles](#9-conventions-et-règles)
10. [Glossaire](#10-glossaire)

---

## 1. Architecture globale

### 1.1 Situation actuelle (AVANT Refine)

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router                                      │
│                                                             │
│  ┌───────────────────┐    ┌──────────────────────────────┐  │
│  │ Server Component   │    │ Client Component              │  │
│  │ (page.tsx)         │    │ (LeadsPageClient.tsx)         │  │
│  │                    │    │                               │  │
│  │ • auth()           │    │ • Kanban state (useState)     │  │
│  │ • db.findMany()    │    │ • Table state (useState)      │  │
│  │ • Serialize data   │    │ • Filters (useMemo)           │  │
│  │ • Pass props ──────┼───►│ • Modals (useState)           │  │
│  │                    │    │ • Calls Server Actions ───────┼──┐
│  └───────────────────┘    └──────────────────────────────┘  │
│                                                             │  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Server Actions (lib/actions/crm/*.actions.ts)          │◄─┘
│  │                                                        │
│  │ • auth() + orgId check                                 │
│  │ • getCurrentProviderId() → buildProviderFilter()       │
│  │ • Zod validation                                       │
│  │ • Prisma query                                         │
│  │ • Audit log                                            │
│  └────────────────────────────────────────────────────────┘
│                           │
│                    ┌──────▼──────┐
│                    │  PostgreSQL  │
│                    │  (Supabase)  │
│                    └─────────────┘
└─────────────────────────────────────────────────────────────┘
```

**Problèmes identifiés :**

| Problème                    | Impact                              | Source                                                                           |
| --------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| Pas de cache/invalidation   | Chaque navigation = requête DB      | `app/[locale]/(app)/crm/leads/page.tsx:75` — `fetchAllLeads()` sans cache client |
| État client monolithique    | `LeadsPageClient.tsx` = 1099 lignes | `components/crm/leads/LeadsPageClient.tsx`                                       |
| Pas de pagination serveur   | `take: 100` hardcodé                | `app/[locale]/(app)/crm/leads/page.tsx:113`                                      |
| Pas de sync URL ↔ filtres  | Filtres perdus au refresh           | État local `useState` uniquement                                                 |
| Pas de mutations optimistes | UX lente sur actions                | Appels Server Action → refresh complet                                           |
| Serialisation manuelle      | Code boilerplate dans chaque page   | `lead.actions.ts:354-409` — 55 lignes de mapping                                 |

> **Source architecture actuelle :** `app/[locale]/(app)/crm/leads/page.tsx` (294 lignes), `components/crm/leads/LeadsPageClient.tsx` (1099 lignes), `lib/actions/crm/lead.actions.ts` (430 lignes)

### 1.2 Architecture cible (APRÈS Refine)

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ <Refine>  (app/[locale]/(app)/layout.tsx)               │    │
│  │                                                         │    │
│  │  dataProvider     = fleetcoreDataProvider               │    │
│  │  authProvider     = clerkAuthProvider                   │    │
│  │  accessControl    = fleetcoreAccessControl              │    │
│  │  routerProvider   = nextjsRouterProvider                │    │
│  │  i18nProvider     = i18nextProvider                     │    │
│  │  notificationProvider = sonnerNotificationProvider      │    │
│  │  auditLogProvider = fleetcoreAuditLogProvider           │    │
│  │  resources        = FLEETCORE_RESOURCES                 │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │  Page Component (léger)                          │   │    │
│  │  │                                                  │   │    │
│  │  │  const { tableQuery, sorters, filters,           │   │    │
│  │  │    setSorters, setFilters, current, pageSize,    │   │    │
│  │  │    setCurrent, setPageSize                       │   │    │
│  │  │  } = useTable({ resource: "leads",               │   │    │
│  │  │    syncWithLocation: true });                     │   │    │
│  │  │                                                  │   │    │
│  │  │  // TanStack Query = cache + invalidation auto   │   │    │
│  │  │  // URL sync = filtres persistés                 │   │    │
│  │  │  // Pagination serveur = scalable                │   │    │
│  │  └──────────────────┬───────────────────────────────┘   │    │
│  │                     │                                   │    │
│  │  ┌──────────────────▼───────────────────────────────┐   │    │
│  │  │  DataProvider (lib/providers/data-provider.ts)    │   │    │
│  │  │                                                  │   │    │
│  │  │  getList → Server Action (avec filtres Refine)   │   │    │
│  │  │  getOne  → Server Action                         │   │    │
│  │  │  create  → Server Action                         │   │    │
│  │  │  update  → Server Action                         │   │    │
│  │  │  delete  → Server Action                         │   │    │
│  │  └──────────────────┬───────────────────────────────┘   │    │
│  └─────────────────────┼───────────────────────────────────┘    │
│                        │                                        │
│  ┌─────────────────────▼───────────────────────────────────┐    │
│  │ Server Actions (INCHANGÉS)                              │    │
│  │ lib/actions/crm/*.actions.ts                            │    │
│  │                                                         │    │
│  │ • auth() + orgId + getCurrentProviderId() = INCHANGÉ    │    │
│  │ • Zod + Prisma + Audit = INCHANGÉ                       │    │
│  │ • Multi-tenant isolation = INCHANGÉ                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                        │                                        │
│                 ┌──────▼──────┐                                  │
│                 │  PostgreSQL  │                                  │
│                 │  (Supabase)  │                                  │
│                 └─────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Gains mesurables :**

| Gain                     | Mécanisme                                      | Impact                                |
| ------------------------ | ---------------------------------------------- | ------------------------------------- |
| Cache intelligent        | TanStack Query v5 (staleTime, gcTime)          | -70% requêtes DB                      |
| Invalidation automatique | `useCreate`/`useUpdate` invalident `useList`   | Zéro refresh manuel                   |
| Pagination serveur       | `useTable({ pagination: { mode: "server" } })` | De 100 → milliers de leads            |
| Sync URL ↔ filtres      | `syncWithLocation: true`                       | Filtres bookmarkables                 |
| Mutations optimistes     | TanStack Query `optimisticUpdate`              | UX instantanée                        |
| RBAC déclaratif          | `<CanAccess>` + `useCan()`                     | Zéro `if (hasPermission)` dans le JSX |

### 1.3 Principe fondamental : Server Actions INCHANGÉS

**RÈGLE CRITIQUE :** Les Server Actions (`lib/actions/crm/*.actions.ts`) ne sont PAS modifiés. Le DataProvider Refine est un **adaptateur pur** qui :

1. Traduit les paramètres Refine (CrudFilter, CrudSort, Pagination) en appels Server Action
2. Traduit les réponses Server Action en format Refine (`{ data, total }`)

La sécurité (auth, multi-tenant, audit) reste **entièrement dans les Server Actions**.

> **Source validation :** `docs/REFINE_VS_CUSTOM_ANALYSIS.md:143-161` — "Pas besoin de passer par fetch() — l'appel direct aux Server Actions est le pattern recommandé par Next.js"

### 1.4 Fichiers à créer

| Fichier                                    | Rôle                                   | ~Lignes      |
| ------------------------------------------ | -------------------------------------- | ------------ |
| `lib/providers/data-provider.ts`           | DataProvider Refine → Server Actions   | 200-250      |
| `lib/providers/auth-provider.ts`           | AuthProvider Refine → Clerk            | 60-80        |
| `lib/providers/access-control-provider.ts` | AccessControlProvider → RBAC FleetCore | 30-40        |
| `lib/providers/i18n-provider.ts`           | I18nProvider → react-i18next           | 20-30        |
| `lib/providers/notification-provider.ts`   | NotificationProvider → Sonner          | 20-30        |
| `lib/providers/audit-log-provider.ts`      | AuditLogProvider → adm_audit_logs      | 40-50        |
| `lib/providers/resources.ts`               | Déclaration des ressources Refine      | 80-100       |
| `lib/providers/index.ts`                   | Barrel export                          | 10           |
| **Total**                                  |                                        | **~460-590** |

> **Source estimation :** `docs/REFINE_VS_CUSTOM_ANALYSIS.md:163-169` — "~150-200 lignes pour DataProvider, ~60-80 pour AuthProvider"

---

## 2. DataProvider FleetCore

### 2.1 Interface Refine DataProvider

```typescript
// Source: node_modules/@refinedev/core/dist/contexts/data/types.d.ts (lignes 330-342)
type DataProvider = {
  // REQUIS (6 méthodes)
  getList: (params: GetListParams) => Promise<GetListResponse<TData>>;
  getOne: (params: GetOneParams) => Promise<GetOneResponse<TData>>;
  create: (params: CreateParams) => Promise<CreateResponse<TData>>;
  update: (params: UpdateParams) => Promise<UpdateResponse<TData>>;
  deleteOne: (params: DeleteOneParams) => Promise<DeleteOneResponse<TData>>;
  getApiUrl: () => string;

  // OPTIONNELS
  getMany?: (params: GetManyParams) => Promise<GetManyResponse<TData>>;
  createMany?: (params: CreateManyParams) => Promise<CreateManyResponse<TData>>;
  updateMany?: (params: UpdateManyParams) => Promise<UpdateManyResponse<TData>>;
  deleteMany?: (params: DeleteManyParams) => Promise<DeleteManyResponse<TData>>;
  custom?: (params: CustomParams) => Promise<CustomResponse<TData>>;
};
```

### 2.2 Types de paramètres Refine

```typescript
// GetListParams (types.d.ts:267-274)
{
  resource: string;                    // "leads", "opportunities", "quotes", ...
  pagination?: {
    currentPage?: number;              // défaut: 1
    pageSize?: number;                 // défaut: 10
    mode?: "client" | "server" | "off"; // défaut: "server"
  };
  sorters?: Array<{
    field: string;                     // "created_at", "company_name", ...
    order: "asc" | "desc";
  }>;
  filters?: CrudFilter[];             // Voir §2.3
  meta?: MetaQuery;                   // Canal ouvert — on y passe le providerId, etc.
}

// GetListResponse (types.d.ts:238-242)
{ data: TData[]; total: number; }

// GetOneParams (types.d.ts:281-285)
{ resource: string; id: BaseKey; meta?: MetaQuery; }

// CreateParams (types.d.ts:286-290)
{ resource: string; variables: TVariables; meta?: MetaQuery; }

// UpdateParams (types.d.ts:296-301)
{ resource: string; id: BaseKey; variables: TVariables; meta?: MetaQuery; }

// DeleteOneParams (types.d.ts:308-314)
{ resource: string; id: BaseKey; variables?: TVariables; meta?: MetaQuery; }
```

### 2.3 CrudFilter — Système de filtres Refine

```typescript
// 28 opérateurs disponibles (types.d.ts:216)
type CrudOperators =
  | "eq"
  | "ne" // égalité
  | "lt"
  | "gt"
  | "lte"
  | "gte" // comparaison
  | "in"
  | "nin" // inclusion
  | "contains"
  | "ncontains" // texte
  | "containss"
  | "ncontainss" // texte case-sensitive
  | "startswith"
  | "nstartswith"
  | "startswiths"
  | "nstartswiths"
  | "endswith"
  | "nendswith"
  | "endswiths"
  | "nendswiths"
  | "between"
  | "nbetween" // intervalle
  | "null"
  | "nnull" // nullité
  | "or"
  | "and"; // logique

// Filtre logique (champ unique)
type LogicalFilter = {
  field: string; // "status", "country_code", "fit_score"
  operator: Exclude<CrudOperators, "or" | "and">;
  value: any;
};

// Filtre conditionnel (combinaison)
type ConditionalFilter = {
  operator: "or" | "and";
  value: (LogicalFilter | ConditionalFilter)[];
};

type CrudFilter = LogicalFilter | ConditionalFilter;
```

### 2.4 Mapping ressource → Server Action

#### Catalogue des ressources et leurs Server Actions

| Ressource Refine | `getList`                  | `getOne`                             | `create`                    | `update`                    | `deleteOne`                 |
| ---------------- | -------------------------- | ------------------------------------ | --------------------------- | --------------------------- | --------------------------- |
| `leads`          | `GET /api/v1/crm/leads`    | `GET /api/v1/crm/leads/[id]`         | `POST /api/v1/crm/leads`    | `updateLeadAction()`        | `deleteLeadAction()`        |
| `opportunities`  | `getOpportunitiesAction()` | `GET /api/v1/crm/opportunities/[id]` | `createOpportunityAction()` | `updateOpportunityAction()` | `deleteOpportunityAction()` |
| `quotes`         | `listQuotesAction()`       | `getQuoteWithRelationsAction()`      | `createQuoteAction()`       | `updateQuoteAction()`       | `deleteQuoteAction()`       |
| `orders`         | `listOrdersAction()`       | `getOrderAction()`                   | `createOrderAction()`       | `updateOrderStatusAction()` | `cancelOrderAction()`       |
| `agreements`     | `listAgreementsAction()`   | `getAgreementWithRelationsAction()`  | `createAgreementAction()`   | `updateAgreementAction()`   | `deleteAgreementAction()`   |
| `activities`     | `getActivitiesAction()`    | —                                    | `createActivityAction()`    | `updateActivityAction()`    | `deleteActivityAction()`    |

> **Source :** `lib/actions/crm/lead.actions.ts`, `opportunity.actions.ts`, `quote.actions.ts`, `orders.actions.ts`, `agreements.actions.ts`, `activities.actions.ts`

#### Actions spéciales (hors CRUD standard)

Ces actions utilisent `meta` ou le pattern `custom` du DataProvider :

| Action                      | Server Action                      | Invocation Refine                                                               |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| Qualify lead                | `qualifyLeadAction()`              | `dataProvider.custom({ url: "", method: "post", meta: { action: "qualify" } })` |
| Update lead status (Kanban) | `updateLeadStatusAction()`         | `dataProvider.update({ resource: "leads", meta: { statusOnly: true } })`        |
| Bulk assign                 | `bulkAssignLeadsAction()`          | `dataProvider.custom({ meta: { action: "bulkAssign" } })`                       |
| Bulk update status          | `bulkUpdateStatusAction()`         | `dataProvider.custom({ meta: { action: "bulkUpdateStatus" } })`                 |
| Bulk delete                 | `bulkDeleteLeadsAction()`          | `dataProvider.custom({ meta: { action: "bulkDelete" } })`                       |
| Convert lead → opportunity  | `convertLeadToOpportunityAction()` | `dataProvider.custom({ meta: { action: "convert" } })`                          |
| Send quote                  | `sendQuoteAction()`                | `dataProvider.custom({ meta: { action: "sendQuote" } })`                        |
| Mark opportunity won        | `markOpportunityWonAction()`       | `dataProvider.custom({ meta: { action: "markWon" } })`                          |
| Mark opportunity lost       | `markOpportunityLostAction()`      | `dataProvider.custom({ meta: { action: "markLost" } })`                         |

### 2.5 Implémentation DataProvider

```typescript
// lib/providers/data-provider.ts
"use client";

import type { DataProvider } from "@refinedev/core";

// Server Action imports (cross-boundary: "use client" → "use server")
import {
  updateLeadAction,
  updateLeadStatusAction,
} from "@/lib/actions/crm/lead.actions";
import {
  deleteLeadAction,
  restoreLeadAction,
} from "@/lib/actions/crm/delete.actions";
import { qualifyLeadAction } from "@/lib/actions/crm/qualify.actions";
import { convertLeadToOpportunityAction } from "@/lib/actions/crm/convert.actions";
import {
  bulkAssignLeadsAction,
  bulkUpdateStatusAction,
  bulkDeleteLeadsAction,
} from "@/lib/actions/crm/bulk.actions";
import {
  createOpportunityAction,
  updateOpportunityAction,
  updateOpportunityStageAction,
  deleteOpportunityAction,
  getOpportunitiesAction,
  markOpportunityWonAction,
  markOpportunityLostAction,
} from "@/lib/actions/crm/opportunity.actions";
// ... autres imports quote, orders, agreements, activities

const API_URL = "/api/v1";

/**
 * Appel API interne avec gestion d'erreurs standardisée
 */
async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw { statusCode: res.status, message: body.error || res.statusText };
  }
  return res.json();
}

/**
 * Convertit les CrudFilter[] Refine en query string params
 */
function filtersToQuery(filters?: CrudFilter[]): Record<string, string> {
  if (!filters?.length) return {};
  const params: Record<string, string> = {};
  for (const filter of filters) {
    if ("field" in filter) {
      // LogicalFilter
      if (filter.operator === "eq") params[filter.field] = String(filter.value);
      if (filter.operator === "contains")
        params[`search`] = String(filter.value);
      if (filter.operator === "gte")
        params[`min_${filter.field}`] = String(filter.value);
      if (filter.operator === "lte")
        params[`max_${filter.field}`] = String(filter.value);
      if (filter.operator === "in")
        params[filter.field] = (filter.value as string[]).join(",");
    }
  }
  return params;
}

/**
 * Convertit les CrudSort[] Refine en query string
 */
function sortersToQuery(sorters?: CrudSort[]): Record<string, string> {
  if (!sorters?.length) return {};
  return {
    sort_by: sorters[0].field,
    sort_order: sorters[0].order,
  };
}

export const fleetcoreDataProvider: DataProvider = {
  getApiUrl: () => API_URL,

  // ─── GET LIST ────────────────────────────────────────────
  getList: async ({ resource, pagination, sorters, filters, meta }) => {
    const { currentPage = 1, pageSize = 10 } = pagination ?? {};
    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(pageSize),
      ...filtersToQuery(filters),
      ...sortersToQuery(sorters),
    });

    switch (resource) {
      case "leads": {
        const res = await fetchApi<{
          data: any[];
          pagination: { total: number };
        }>(`/crm/leads?${queryParams}`);
        return { data: res.data, total: res.pagination.total };
      }
      case "opportunities": {
        const result = await getOpportunitiesAction({
          page: currentPage,
          limit: pageSize,
          // Mapper les filtres Refine vers les params de l'action
        });
        if (!result.success) throw { message: result.error };
        return { data: result.data, total: result.pagination.total };
      }
      // ... autres ressources suivent le même pattern
      default:
        throw new Error(`Resource "${resource}" non supportée dans getList`);
    }
  },

  // ─── GET ONE ─────────────────────────────────────────────
  getOne: async ({ resource, id }) => {
    switch (resource) {
      case "leads": {
        const res = await fetchApi<{ data: any }>(`/crm/leads/${id}`);
        return { data: res.data };
      }
      // ... autres ressources
      default:
        throw new Error(`Resource "${resource}" non supportée dans getOne`);
    }
  },

  // ─── CREATE ──────────────────────────────────────────────
  create: async ({ resource, variables }) => {
    switch (resource) {
      case "leads": {
        const res = await fetchApi<{ data: any }>(`/crm/leads`, {
          method: "POST",
          body: JSON.stringify(variables),
        });
        return { data: res.data };
      }
      case "opportunities": {
        const result = await createOpportunityAction(variables);
        if (!result.success) throw { message: result.error };
        return { data: result.data };
      }
      // ... autres ressources
      default:
        throw new Error(`Resource "${resource}" non supportée dans create`);
    }
  },

  // ─── UPDATE ──────────────────────────────────────────────
  update: async ({ resource, id, variables, meta }) => {
    switch (resource) {
      case "leads": {
        if (meta?.statusOnly) {
          // Kanban drag & drop
          const result = await updateLeadStatusAction(
            id as string,
            variables.status,
            variables
          );
          if (!result.success) throw { message: result.error };
          return { data: result.data };
        }
        // Drawer edit mode
        const result = await updateLeadAction(id as string, variables);
        if (!result.success) throw { message: result.error };
        return { data: result.lead };
      }
      case "opportunities": {
        if (meta?.stageOnly) {
          const result = await updateOpportunityStageAction(
            id as string,
            variables.stage
          );
          if (!result.success) throw { message: result.error };
          return { data: result.data };
        }
        const result = await updateOpportunityAction(id as string, variables);
        if (!result.success) throw { message: result.error };
        return { data: result.data };
      }
      // ... autres ressources
      default:
        throw new Error(`Resource "${resource}" non supportée dans update`);
    }
  },

  // ─── DELETE ──────────────────────────────────────────────
  deleteOne: async ({ resource, id, variables }) => {
    switch (resource) {
      case "leads": {
        const result = await deleteLeadAction(
          id as string,
          variables?.reason || "other"
        );
        if (!result.success) throw { message: result.error };
        return { data: { id } as any };
      }
      case "opportunities": {
        const result = await deleteOpportunityAction(id as string);
        if (!result.success) throw { message: result.error };
        return { data: { id } as any };
      }
      // ... autres ressources
      default:
        throw new Error(`Resource "${resource}" non supportée dans deleteOne`);
    }
  },

  // ─── CUSTOM (actions spéciales) ──────────────────────────
  custom: async ({ meta }) => {
    const action = meta?.action as string;

    switch (action) {
      case "qualify":
        return {
          data: await qualifyLeadAction(meta.leadId, meta.stage, meta.notes),
        };
      case "convert":
        return {
          data: await convertLeadToOpportunityAction(meta.leadId, meta.data),
        };
      case "bulkAssign":
        return {
          data: await bulkAssignLeadsAction(meta.leadIds, meta.assigneeId),
        };
      case "bulkUpdateStatus":
        return {
          data: await bulkUpdateStatusAction(meta.leadIds, meta.status),
        };
      case "bulkDelete":
        return { data: await bulkDeleteLeadsAction(meta.leadIds, meta.reason) };
      case "markWon":
        return { data: await markOpportunityWonAction(meta.params) };
      case "markLost":
        return {
          data: await markOpportunityLostAction(
            meta.opportunityId,
            meta.reason
          ),
        };
      // ... autres actions spéciales
      default:
        throw new Error(`Custom action "${action}" non supportée`);
    }
  },
};
```

### 2.6 Multi-tenant : transparent pour le DataProvider

**POINT CRITIQUE :** Le DataProvider ne gère PAS l'isolation multi-tenant. C'est le rôle exclusif des Server Actions.

```
DataProvider.update("leads", id, { status: "demo" })
     │
     ▼
updateLeadStatusAction(id, "demo")           ← "use server"
     │
     ├─ auth()                               ← Clerk
     ├─ getCurrentProviderId()               ← Lookup adm_provider_employees
     ├─ buildProviderFilter(providerId)      ← { provider_id: "uuid-fr" } ou {}
     ├─ db.crm_leads.findFirst({ where: { id, ...providerFilter } })
     │                                         ↑ Isolation ici
     └─ return { success, data }
```

> **Source :** `lib/utils/provider-context.ts:50-65` — `getCurrentProviderId()` et `lib/utils/provider-context.ts:143-150` — `buildProviderFilter()`

---

## 3. AuthProvider FleetCore

### 3.1 Interface Refine AuthProvider

```typescript
// Source: node_modules/@refinedev/core/dist/contexts/auth/types.d.ts (lignes 58-68)
type AuthProvider = {
  login: (params: any) => Promise<AuthActionResponse>; // REQUIS
  logout: (params: any) => Promise<AuthActionResponse>; // REQUIS
  check: (params?: any) => Promise<CheckResponse>; // REQUIS
  onError: (error: any) => Promise<OnErrorResponse>; // REQUIS
  register?: (params: any) => Promise<AuthActionResponse>;
  forgotPassword?: (params: any) => Promise<AuthActionResponse>;
  updatePassword?: (params: any) => Promise<AuthActionResponse>;
  getPermissions?: (params?: any) => Promise<PermissionResponse>;
  getIdentity?: (params?: any) => Promise<IdentityResponse>;
};

// CheckResponse (lignes 34-39)
type CheckResponse = {
  authenticated: boolean;
  redirectTo?: string;
  logout?: boolean;
  error?: RefineError | Error;
};

// AuthActionResponse (lignes 49-54)
type AuthActionResponse = {
  success: boolean;
  redirectTo?: string;
  error?: RefineError | Error;
  successNotification?: { message: string; description?: string };
  [key: string]: unknown;
};
```

### 3.2 Implémentation AuthProvider → Clerk

**Contexte :** Clerk gère TOUT le cycle d'authentification via `<SignIn>`, `<SignUp>`, les composants middleware. L'AuthProvider Refine est un **observateur** de l'état Clerk, pas un contrôleur.

```typescript
// lib/providers/auth-provider.ts
"use client";

import type { AuthProvider } from "@refinedev/core";

/**
 * AuthProvider FleetCore — Adaptateur Clerk
 *
 * IMPORTANT: Clerk gère le login/logout via ses propres composants
 * (<SignIn>, <UserButton>). Ce provider informe Refine de l'état
 * d'authentification, il ne le contrôle pas.
 *
 * Dépendances client: useAuth(), useUser(), useOrganization() de @clerk/nextjs
 * Ces hooks ne sont PAS appelables dans un objet statique, donc on passe
 * les valeurs au runtime via un factory pattern.
 */
export function createClerkAuthProvider(clerkClient: {
  userId: string | null;
  orgId: string | null;
  orgRole: string | null;
  signOut: () => Promise<void>;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string;
    emailAddresses: Array<{ emailAddress: string }>;
  } | null;
}): AuthProvider {
  return {
    // ─── LOGIN ───────────────────────────────────────────
    // Clerk gère le login via <SignIn> — on retourne juste un redirect
    login: async () => ({
      success: true,
      redirectTo: "/",
    }),

    // ─── LOGOUT ──────────────────────────────────────────
    logout: async () => {
      await clerkClient.signOut();
      return {
        success: true,
        redirectTo: "/en/login",
      };
    },

    // ─── CHECK ───────────────────────────────────────────
    // Appelé par Refine pour vérifier si l'utilisateur est authentifié
    check: async () => {
      if (clerkClient.userId) {
        return { authenticated: true };
      }
      return {
        authenticated: false,
        redirectTo: "/en/login",
        logout: true,
      };
    },

    // ─── ON ERROR ────────────────────────────────────────
    // Gestion des erreurs HTTP 401/403
    onError: async (error) => {
      const status = error?.statusCode || error?.status;
      if (status === 401) {
        return { logout: true, redirectTo: "/en/login" };
      }
      if (status === 403) {
        return { redirectTo: "/unauthorized" };
      }
      return {};
    },

    // ─── GET IDENTITY ────────────────────────────────────
    // Fournit les infos utilisateur à Refine (pour <UserButton>, avatars, etc.)
    getIdentity: async () => {
      const user = clerkClient.user;
      if (!user) return null;
      return {
        id: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(" "),
        avatar: user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress,
      };
    },

    // ─── GET PERMISSIONS ─────────────────────────────────
    // Retourne le rôle Clerk Organizations (utilisé par AccessControlProvider)
    getPermissions: async () => {
      return {
        role: clerkClient.orgRole, // "org:adm_admin", "org:provider_user", etc.
        orgId: clerkClient.orgId,
      };
    },
  };
}
```

### 3.3 Intégration dans le layout

```typescript
// Dans app/[locale]/(app)/layout.tsx — côté client
"use client";

import { useAuth, useUser, useOrganization } from "@clerk/nextjs";
import { createClerkAuthProvider } from "@/lib/providers/auth-provider";

function RefineWrapper({ children }: { children: React.ReactNode }) {
  const { userId, orgId, signOut } = useAuth();
  const { user } = useUser();
  const { membership } = useOrganization();

  const authProvider = useMemo(
    () => createClerkAuthProvider({
      userId, orgId,
      orgRole: membership?.role ?? null,
      signOut, user,
    }),
    [userId, orgId, membership?.role, signOut, user]
  );

  return (
    <Refine authProvider={authProvider} /* ... autres providers */ >
      {children}
    </Refine>
  );
}
```

> **Source Clerk hooks :** `middleware.ts:7-8` — rôles admin, `lib/config/permissions.ts:28-35` — 7 OrgRoles

---

## 4. AccessControlProvider FleetCore

### 4.1 Interface Refine AccessControlProvider

```typescript
// Source: node_modules/@refinedev/core/dist/contexts/accessControl/types.d.ts (lignes 50-67)
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
  resource?: string; // "leads", "fleet", "admin"
  action: string; // "list", "create", "edit", "delete", "show"
  params?: {
    resource?: IResourceItem;
    id?: BaseKey;
    [key: string]: any;
  };
};

type CanReturnType = {
  can: boolean;
  reason?: string;
};
```

### 4.2 RBAC FleetCore existant — Mapping 1:1

```typescript
// Source: lib/config/permissions.ts (lignes 11-25)
type PermissionAction = "view" | "create" | "edit" | "delete" | "export";
type ModuleKey =
  | "dashboard"
  | "crm"
  | "fleet"
  | "drivers"
  | "maintenance"
  | "analytics"
  | "settings"
  | "admin";
type Permission = `${ModuleKey}:${PermissionAction}`;

// 7 rôles Clerk (lignes 28-35)
type OrgRole =
  | "org:admin"
  | "org:adm_admin"
  | "org:adm_commercial"
  | "org:adm_support"
  | "org:provider_admin"
  | "org:provider_manager"
  | "org:provider_user";
```

**Mapping Refine action → FleetCore PermissionAction :**

| Refine `action` | FleetCore `PermissionAction` |
| --------------- | ---------------------------- |
| `"list"`        | `"view"`                     |
| `"show"`        | `"view"`                     |
| `"create"`      | `"create"`                   |
| `"edit"`        | `"edit"`                     |
| `"delete"`      | `"delete"`                   |
| `"export"`      | `"export"`                   |
| `"clone"`       | `"create"`                   |

**Mapping Refine `resource` → FleetCore `ModuleKey` :**

| Refine resource                                                                      | FleetCore module |
| ------------------------------------------------------------------------------------ | ---------------- |
| `"leads"`, `"opportunities"`, `"quotes"`, `"orders"`, `"agreements"`, `"activities"` | `"crm"`          |
| `"vehicles"`, `"assignments"`                                                        | `"fleet"`        |
| `"drivers"`                                                                          | `"drivers"`      |
| `"maintenance"`                                                                      | `"maintenance"`  |
| `"analytics"`                                                                        | `"analytics"`    |
| `"settings"`                                                                         | `"settings"`     |
| `"users"`, `"roles"`, `"audit"`                                                      | `"admin"`        |

### 4.3 Implémentation AccessControlProvider

```typescript
// lib/providers/access-control-provider.ts
"use client";

import type { AccessControlProvider } from "@refinedev/core";
import {
  hasPermission,
  type OrgRole,
  type Permission,
} from "@/lib/config/permissions";

/** Mapping resource Refine → module FleetCore */
const RESOURCE_TO_MODULE: Record<string, string> = {
  leads: "crm",
  opportunities: "crm",
  quotes: "crm",
  orders: "crm",
  agreements: "crm",
  activities: "crm",
  vehicles: "fleet",
  assignments: "fleet",
  drivers: "drivers",
  maintenance: "maintenance",
  analytics: "analytics",
  settings: "settings",
  users: "admin",
  roles: "admin",
  audit: "admin",
};

/** Mapping action Refine → action FleetCore */
const ACTION_MAP: Record<string, string> = {
  list: "view",
  show: "view",
  create: "create",
  edit: "edit",
  delete: "delete",
  export: "export",
  clone: "create",
};

export function createAccessControlProvider(
  getRole: () => OrgRole | null
): AccessControlProvider {
  return {
    can: async ({ resource, action }) => {
      const role = getRole();
      if (!role) return { can: false, reason: "No role assigned" };

      const module = RESOURCE_TO_MODULE[resource ?? ""] ?? resource;
      const mappedAction = ACTION_MAP[action] ?? action;
      const permission = `${module}:${mappedAction}` as Permission;

      const allowed = hasPermission(role, permission);
      return {
        can: allowed,
        reason: allowed
          ? undefined
          : `Role "${role}" lacks permission "${permission}"`,
      };
    },
    options: {
      buttons: {
        enableAccessControl: true,
        hideIfUnauthorized: true, // Masquer boutons inaccessibles
      },
    },
  };
}
```

### 4.4 Utilisation dans les composants

```typescript
// Déclaratif — remplace les if/else manuels
import { useCan, CanAccess } from "@refinedev/core";

// Hook
const { data: canDelete } = useCan({ resource: "leads", action: "delete" });

// Composant
<CanAccess resource="leads" action="delete">
  <Button onClick={handleDelete}>Supprimer</Button>
</CanAccess>
```

> **Source RBAC :** `lib/config/permissions.ts` (239 lignes) — `hasPermission()`, `ROLE_PERMISSIONS`, 7 rôles × 30+ permissions

---

## 5. RouterProvider FleetCore

### 5.1 @refinedev/nextjs-router

```typescript
// Source: node_modules/@refinedev/nextjs-router/dist/index.d.mts
export const routerProvider: RouterProvider;
export function NavigateToResource(props: {
  resource?: string;
  fallbackTo?: string;
  meta?: Record<string, unknown>;
}): JSX.Element;
export function parseTableParams(url: string): {
  pagination?: Pagination;
  filters?: CrudFilter[];
  sorters?: CrudSort[];
  current?: number;
  pageSize?: number;
};
export function paramsFromCurrentPath(
  pathname: string,
  matchingRoute: string
): Record<string, string>;
```

### 5.2 Configuration RouterProvider

```typescript
// Dans le <Refine> du layout
import routerProvider from "@refinedev/nextjs-router";

<Refine
  routerProvider={routerProvider}
  // ...
/>
```

**Zéro configuration supplémentaire** — le routerProvider de `@refinedev/nextjs-router` gère :

- Extraction des paramètres depuis l'URL (locale, resource, id)
- Navigation via `useGo()`, `useBack()`, `useParsed()`
- Sync filtres/tri/pagination ↔ URL via `syncWithLocation`

### 5.3 Structure des routes avec locale

```
app/[locale]/(app)/
├── layout.tsx                    ← <Refine> wrapper ici
├── crm/
│   ├── leads/
│   │   ├── page.tsx              ← resource "leads", action "list"
│   │   ├── [id]/
│   │   │   └── page.tsx          ← resource "leads", action "show"
│   │   └── create/
│   │       └── page.tsx          ← resource "leads", action "create"
│   ├── opportunities/
│   │   ├── page.tsx              ← resource "opportunities", action "list"
│   │   └── [id]/
│   │       └── page.tsx          ← resource "opportunities", action "show"
│   └── quotes/
│       ├── page.tsx              ← resource "quotes", action "list"
│       └── [id]/
│           └── page.tsx          ← resource "quotes", action "show"
├── fleet/
│   └── vehicles/
│       └── page.tsx              ← resource "vehicles", action "list"
└── dashboard/
    └── page.tsx                  ← resource "dashboard"
```

### 5.4 Déclaration des ressources

```typescript
// lib/providers/resources.ts
import type { ResourceProps } from "@refinedev/core";

export const FLEETCORE_RESOURCES: ResourceProps[] = [
  // ─── CRM ─────────────────────────────────────────────────
  {
    name: "leads",
    list: "/:locale/crm/leads",
    show: "/:locale/crm/leads/:id",
    create: "/:locale/crm/leads/create",
    edit: "/:locale/crm/leads/:id/edit",
    meta: {
      label: "Leads Pipeline",
      parent: "crm",
      icon: /* lucide icon */,
      canDelete: true,
    },
  },
  {
    name: "opportunities",
    list: "/:locale/crm/opportunities",
    show: "/:locale/crm/opportunities/:id",
    create: "/:locale/crm/opportunities/create",
    meta: {
      label: "Opportunities",
      parent: "crm",
      canDelete: true,
    },
  },
  {
    name: "quotes",
    list: "/:locale/crm/quotes",
    show: "/:locale/crm/quotes/:id",
    create: "/:locale/crm/quotes/create",
    meta: { label: "Quotes", parent: "crm", canDelete: true },
  },
  {
    name: "orders",
    list: "/:locale/crm/orders",
    show: "/:locale/crm/orders/:id",
    meta: { label: "Orders", parent: "crm", canDelete: false },
  },
  {
    name: "agreements",
    list: "/:locale/crm/agreements",
    show: "/:locale/crm/agreements/:id",
    create: "/:locale/crm/agreements/create",
    meta: { label: "Agreements", parent: "crm", canDelete: true },
  },
  {
    name: "activities",
    // Pas de route propre — toujours embedded dans un lead/opportunity
    meta: { label: "Activities", parent: "crm", hide: true },
  },

  // ─── FLEET ───────────────────────────────────────────────
  {
    name: "vehicles",
    list: "/:locale/fleet/vehicles",
    show: "/:locale/fleet/vehicles/:id",
    create: "/:locale/fleet/vehicles/create",
    meta: { label: "Vehicles", parent: "fleet" },
  },

  // ─── DRIVERS ─────────────────────────────────────────────
  {
    name: "drivers",
    list: "/:locale/drivers",
    show: "/:locale/drivers/:id",
    meta: { label: "Drivers" },
  },
];
```

> **Source navigation :** `lib/config/modules.ts` — 8 modules, 288 lignes, avec sous-navigation

---

## 6. Providers secondaires

### 6.1 I18nProvider → react-i18next

```typescript
// Source interface: node_modules/@refinedev/core/dist/contexts/i18n/types.d.ts (lignes 1-8)
type I18nProvider = {
  translate: (key: string, options?: any, defaultMessage?: string) => string;
  changeLocale: (locale: string, options?: any) => Promise<any> | any;
  getLocale: () => string;
};
```

FleetCore utilise déjà `react-i18next` avec 4 namespaces (`common`, `auth`, `public`, `admin`).

```typescript
// lib/providers/i18n-provider.ts
"use client";

import type { I18nProvider } from "@refinedev/core";
import i18n from "@/lib/i18n/config";

export const i18nextProvider: I18nProvider = {
  translate: (key, options, defaultMessage) => {
    const result = i18n.t(key, options);
    return result === key ? (defaultMessage ?? key) : result;
  },
  changeLocale: (locale) => i18n.changeLanguage(locale),
  getLocale: () => i18n.language,
};
```

**Impact :** Refine utilisera automatiquement `translate()` pour :

- Les labels de ressources dans le breadcrumb
- Les messages d'erreur des mutations
- Les notifications de succès/échec

> **Source :** `lib/i18n/config.ts` — i18next avec `locales` (en, fr), 4 namespaces

### 6.2 NotificationProvider → Sonner

```typescript
// Source interface: node_modules/@refinedev/core/dist/contexts/notification/types.d.ts (lignes 14-21)
type OpenNotificationParams = {
  key?: string;
  message: string;
  type: "success" | "error" | "progress";
  description?: string;
  cancelMutation?: () => void;
  undoableTimeout?: number;
};

type NotificationProvider = {
  open: (params: OpenNotificationParams) => void;
  close: (key: string) => void;
};
```

FleetCore utilise déjà Sonner (`sonner@2.0.7`) pour les toasts.

```typescript
// lib/providers/notification-provider.ts
"use client";

import type { NotificationProvider } from "@refinedev/core";
import { toast } from "sonner";

export const sonnerNotificationProvider: NotificationProvider = {
  open: ({
    key,
    message,
    type,
    description,
    undoableTimeout,
    cancelMutation,
  }) => {
    const toastFn =
      type === "error"
        ? toast.error
        : type === "progress"
          ? toast.loading
          : toast.success;

    toastFn(message, {
      id: key,
      description,
      duration: undoableTimeout ? undoableTimeout * 1000 : undefined,
      action: cancelMutation
        ? { label: "Undo", onClick: cancelMutation }
        : undefined,
    });
  },
  close: (key) => toast.dismiss(key),
};
```

**Bonus :** Support natif de l'**undoable mutation** de Refine (le toast affiche un bouton "Undo" pendant `undoableTimeout` secondes avant d'exécuter la mutation).

> **Source Sonner :** `package.json:112` — `"sonner": "^2.0.7"`, `app/[locale]/(app)/layout.tsx` — `<Sonner position="top-right" />`

### 6.3 AuditLogProvider → adm_audit_logs

```typescript
// Source interface: node_modules/@refinedev/core/dist/contexts/auditLog/types.d.ts (lignes 14-39)
type LogParams = {
  resource: string;
  action: string;
  data?: any;
  author?: { name?: string; [key: string]: any };
  previousData?: any;
  meta: Record<string, any>;
};

type AuditLogProvider = {
  create: (params: LogParams) => Promise<any>;
  get: (params: {
    resource: string;
    action?: string;
    meta?: any;
  }) => Promise<any>;
  update: (params: { id: BaseKey; name: string }) => Promise<any>;
};
```

**Situation actuelle :** L'audit est déjà intégré DANS les Server Actions (`lead.actions.ts:322-344`). Le AuditLogProvider Refine est un **complément**, pas un remplacement.

```typescript
// lib/providers/audit-log-provider.ts
"use client";

import type { AuditLogProvider } from "@refinedev/core";

/**
 * AuditLogProvider FleetCore
 *
 * IMPORTANT: L'audit principal est dans les Server Actions (adm_audit_logs).
 * Ce provider est un COMPLÉMENT pour les actions Refine automatiques.
 *
 * Refine appelle automatiquement create() après chaque mutation CRUD
 * si le resource a `meta.audit` configuré.
 */
export const fleetcoreAuditLogProvider: AuditLogProvider = {
  create: async (params) => {
    // Les Server Actions gèrent déjà l'audit dans adm_audit_logs.
    // On log côté client uniquement pour le tracking analytique.
    if (process.env.NODE_ENV === "development") {
      console.log("[AuditLog]", params.action, params.resource, params.meta);
    }
    return { success: true };
  },
  get: async ({ resource, meta }) => {
    // Lecture via API route existante
    const res = await fetch(
      `/api/v1/admin/audit?entity=${resource}&entity_id=${meta?.id}`
    );
    if (!res.ok) return { data: [] };
    return res.json();
  },
  update: async () => {
    // Non utilisé — les audit logs sont immutables
    return { success: true };
  },
};
```

> **Source audit existant :** `lib/actions/crm/lead.actions.ts:322-344` — `db.adm_audit_logs.create()` dans `updateLeadAction`

### 6.4 LiveProvider — Phase 2 (différé)

```typescript
// Source interface: node_modules/@refinedev/core/dist/contexts/live/types.d.ts (lignes 67-70)
type LiveProvider = {
  subscribe: (options: {
    channel: string;
    types: string[];
    callback: Function;
  }) => any;
  unsubscribe: (subscription: any) => void;
  publish?: (event: LiveEvent) => void;
};
```

**Statut :** Non implémenté en Phase 1. FleetCore n'a actuellement aucune fonctionnalité temps réel.

**Plan Phase 2 :** Brancher sur Supabase Realtime (PostgreSQL LISTEN/NOTIFY) pour :

- Mise à jour en direct du Kanban quand un collègue déplace un lead
- Notification de nouveau lead créé via le wizard
- HYPOTHÈSE NON VÉRIFIÉE : Supabase Realtime est disponible sur le plan FleetCore

```typescript
// lib/providers/live-provider.ts (PHASE 2 — SKELETON)
// import { createClient } from "@supabase/supabase-js";

export const liveProvider: LiveProvider = {
  subscribe: ({ channel, types, callback }) => {
    // PHASE 2: Supabase Realtime subscription
    // const subscription = supabase.channel(channel).on("*", callback).subscribe();
    // return subscription;
    return null;
  },
  unsubscribe: (subscription) => {
    // subscription?.unsubscribe();
  },
};
```

---

## 7. Pattern standard par ressource — Exemple complet Leads

> **SECTION LA PLUS IMPORTANTE** — Ce pattern est la référence pour chaque nouveau module.
> Un développeur avec ZÉRO contexte FleetCore doit pouvoir implémenter n'importe quel module
> en suivant cette section.

### 7.1 Structure de fichiers par feature

```
features/
└── leads/                           ← 1 dossier par ressource
    ├── components/
    │   ├── LeadsListPage.tsx         ← Page liste (Kanban + Table)
    │   ├── LeadsTable.tsx            ← Vue table avec colonnes
    │   ├── LeadsKanbanBoard.tsx      ← Vue Kanban
    │   ├── LeadCard.tsx              ← Carte Kanban individuelle
    │   ├── LeadDrawer.tsx            ← Drawer détail/édition
    │   ├── LeadCreateForm.tsx        ← Formulaire création
    │   ├── LeadFilters.tsx           ← Barre de filtres
    │   └── LeadBulkActions.tsx       ← Actions groupées
    ├── hooks/
    │   ├── useLeadsTable.ts          ← Hook table avec filtres/tri
    │   └── useLeadMutations.ts       ← Hook mutations (update, delete, etc.)
    ├── columns.tsx                   ← Définition des colonnes table
    ├── types.ts                      ← Types spécifiques au module
    └── index.ts                      ← Barrel export
```

> **Source pattern :** Inspiré de kiranism (`features/{resource}/components/`, `hooks/`, `types/`) — `/Users/mohamedfodil/Documents/references/kiranism/`

### 7.2 Exemple complet : Leads List Page

#### 7.2.1 Page Server Component (point d'entrée)

```typescript
// app/[locale]/(app)/crm/leads/page.tsx
// APRÈS migration Refine — réduit de 294 lignes à ~15 lignes

import { LeadsListPage } from "@/features/leads/components/LeadsListPage";

export default function LeadsPage() {
  // Plus de auth(), plus de db.findMany(), plus de serialisation
  // Tout est géré par Refine hooks côté client
  return <LeadsListPage />;
}
```

**Comparaison :**

- AVANT : 294 lignes (auth + Prisma query + serialisation + Suspense) — `app/[locale]/(app)/crm/leads/page.tsx`
- APRÈS : ~15 lignes (simple wrapper)

#### 7.2.2 Leads List Page (Client Component)

```typescript
// features/leads/components/LeadsListPage.tsx
"use client";

import { useState } from "react";
import { useTable, useCan } from "@refinedev/core";
import type { Lead } from "@/types/crm";
import { LeadsTable } from "./LeadsTable";
import { LeadsKanbanBoard } from "./LeadsKanbanBoard";
import { LeadFilters } from "./LeadFilters";
import { LeadBulkActions } from "./LeadBulkActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CanAccess } from "@refinedev/core";

type ViewMode = "kanban" | "table";

export function LeadsListPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ─── useTable : pagination + filtres + tri + cache ─────
  const {
    tableQuery,           // TanStack Query result (data, isLoading, isError, refetch)
    filters,              // Current CrudFilter[]
    setFilters,           // Update filters
    sorters,              // Current CrudSort[]
    setSorters,           // Update sorters
    current: currentPage, // Current page number
    setCurrent,           // Set page
    pageSize,             // Items per page
    setPageSize,          // Set page size
    pageCount,            // Total pages
  } = useTable<Lead>({
    resource: "leads",
    syncWithLocation: true,    // ← Filtres persistés dans l'URL
    pagination: {
      mode: "server",          // ← Pagination côté serveur (scalable)
      pageSize: 25,
    },
    sorters: {
      initial: [{ field: "created_at", order: "desc" }],
    },
    filters: {
      initial: [
        { field: "status", operator: "ne", value: "disqualified" },
      ],
    },
  });

  const { data: leads, total } = tableQuery.data ?? { data: [], total: 0 };
  const isLoading = tableQuery.isLoading;

  // ─── RBAC : peut-on créer/supprimer ? ──────────────────
  const { data: canCreate } = useCan({ resource: "leads", action: "create" });
  const { data: canDelete } = useCan({ resource: "leads", action: "delete" });

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* ─── Header avec filtres ───────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads Pipeline</h1>
        <div className="flex items-center gap-2">
          <CanAccess resource="leads" action="create">
            <CreateLeadButton />
          </CanAccess>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <LeadFilters
        filters={filters}
        setFilters={setFilters}
      />

      {/* ─── Bulk Actions (si sélection) ───────────── */}
      {selectedIds.length > 0 && canDelete?.can && (
        <LeadBulkActions
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
        />
      )}

      {/* ─── Vue Kanban ou Table ───────────────────── */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsContent value="kanban">
          <LeadsKanbanBoard
            leads={leads}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="table">
          <LeadsTable
            leads={leads}
            total={total}
            isLoading={isLoading}
            currentPage={currentPage}
            pageSize={pageSize}
            pageCount={pageCount}
            setCurrent={setCurrent}
            setPageSize={setPageSize}
            sorters={sorters}
            setSorters={setSorters}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Comparaison :**

- AVANT : `LeadsPageClient.tsx` = 1099 lignes (état local, pas de cache, pas de sync URL)
- APRÈS : ~90 lignes (useTable gère tout)

#### 7.2.3 Définition des colonnes

```typescript
// features/leads/columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Lead } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const leadsColumns: ColumnDef<Lead>[] = [
  {
    accessorKey: "lead_code",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.lead_code}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "company_name",
    header: "Company",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.company_name}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.first_name} {row.original.last_name}
        </div>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={getStatusVariant(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
    enableSorting: true,
    // Meta pour les filtres (pattern kiranism)
    meta: {
      variant: "select",
      options: [
        { label: "New", value: "new" },
        { label: "Demo", value: "demo" },
        { label: "Proposal Sent", value: "proposal_sent" },
        { label: "Payment Pending", value: "payment_pending" },
        { label: "Converted", value: "converted" },
        { label: "Lost", value: "lost" },
        { label: "Nurturing", value: "nurturing" },
      ],
    },
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: ({ row }) => (
      <span>
        {row.original.country?.flag_emoji} {row.original.country?.country_name_en}
      </span>
    ),
  },
  {
    accessorKey: "fit_score",
    header: "Score",
    cell: ({ row }) => (
      <span className={getScoreColor(row.original.fit_score)}>
        {row.original.fit_score ?? "—"}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "assigned_to",
    header: "Owner",
    cell: ({ row }) => row.original.assigned_to
      ? `${row.original.assigned_to.first_name} ${row.original.assigned_to.last_name}`
      : "Unassigned",
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => format(new Date(row.original.created_at), "dd MMM yyyy"),
    enableSorting: true,
  },
];
```

> **Source type Lead :** `types/crm.ts:61-152` — 40+ champs

#### 7.2.4 Hook mutations

```typescript
// features/leads/hooks/useLeadMutations.ts
"use client";

import {
  useUpdate,
  useDelete,
  useCustom,
  useInvalidate,
} from "@refinedev/core";

export function useLeadMutations() {
  const invalidate = useInvalidate();

  // ─── Update status (Kanban drag & drop) ────────────────
  const { mutate: updateStatus, isLoading: isUpdatingStatus } = useUpdate();

  const handleStatusChange = (
    leadId: string,
    newStatus: string,
    options?: {
      lossReasonCode?: string;
      nurturingReasonCode?: string;
      reasonDetail?: string;
    }
  ) => {
    updateStatus({
      resource: "leads",
      id: leadId,
      values: { status: newStatus, ...options },
      meta: { statusOnly: true }, // ← Signal au DataProvider
      // TanStack Query invalide automatiquement le cache "leads" list
    });
  };

  // ─── Update fields (Drawer edit) ───────────────────────
  const { mutate: updateLead, isLoading: isUpdating } = useUpdate();

  const handleUpdate = (leadId: string, data: Record<string, unknown>) => {
    updateLead({
      resource: "leads",
      id: leadId,
      values: data,
    });
  };

  // ─── Delete (soft) ────────────────────────────────────
  const { mutate: deleteLead, isLoading: isDeleting } = useDelete();

  const handleDelete = (leadId: string, reason: string) => {
    deleteLead({
      resource: "leads",
      id: leadId,
      values: { reason },
    });
  };

  // ─── Qualify ──────────────────────────────────────────
  const { mutate: qualify } = useCustom();

  const handleQualify = (leadId: string, stage: string, notes?: string) => {
    qualify(
      {
        url: "",
        method: "post",
        meta: { action: "qualify", leadId, stage, notes },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "leads", invalidates: ["list", "detail"] });
        },
      }
    );
  };

  // ─── Convert to Opportunity ───────────────────────────
  const handleConvert = (leadId: string, data: Record<string, unknown>) => {
    qualify(
      {
        url: "",
        method: "post",
        meta: { action: "convert", leadId, data },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "leads", invalidates: ["list"] });
          invalidate({ resource: "opportunities", invalidates: ["list"] });
        },
      }
    );
  };

  // ─── Bulk actions ─────────────────────────────────────
  const handleBulkAssign = (leadIds: string[], assigneeId: string) => {
    qualify(
      {
        url: "",
        method: "post",
        meta: { action: "bulkAssign", leadIds, assigneeId },
      },
      {
        onSuccess: () =>
          invalidate({ resource: "leads", invalidates: ["list"] }),
      }
    );
  };

  return {
    handleStatusChange,
    isUpdatingStatus,
    handleUpdate,
    isUpdating,
    handleDelete,
    isDeleting,
    handleQualify,
    handleConvert,
    handleBulkAssign,
  };
}
```

> **Source Server Actions :** `lib/actions/crm/lead.actions.ts` (2 fonctions), `qualify.actions.ts` (1), `convert.actions.ts` (1), `bulk.actions.ts` (3), `delete.actions.ts` (2)

#### 7.2.5 Kanban Board avec Refine

```typescript
// features/leads/components/LeadsKanbanBoard.tsx
"use client";

import { useUpdate } from "@refinedev/core";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import type { Lead, LeadStatus } from "@/types/crm";
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";

interface Props {
  leads: Lead[];
  isLoading: boolean;
}

export function LeadsKanbanBoard({ leads, isLoading }: Props) {
  const { statuses } = useLeadStatuses();  // Config dynamique depuis crm_settings
  const { mutate: updateStatus } = useUpdate();

  // Grouper les leads par status
  const columns = useMemo(() =>
    statuses.map((status) => ({
      ...status,
      leads: leads.filter((l) => l.status === status.value),
    })),
    [leads, statuses]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    // Mutation optimiste via Refine + TanStack Query
    updateStatus({
      resource: "leads",
      id: leadId,
      values: { status: newStatus },
      meta: { statusOnly: true },
      // optimisticUpdateMap sera géré par TanStack Query
      // Le cache "leads" list sera invalidé automatiquement
    });
  };

  if (isLoading) return <KanbanSkeleton columns={columns.length} />;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn key={column.value} column={column} />
        ))}
      </div>
    </DndContext>
  );
}
```

### 7.3 Pattern standard — Checklist par module

Pour chaque nouvelle ressource, suivre cette checklist :

| #   | Étape                 | Fichier                                       | Description                                     |
| --- | --------------------- | --------------------------------------------- | ----------------------------------------------- |
| 1   | Type TypeScript       | `types/{resource}.ts`                         | Interface avec tous les champs DB               |
| 2   | Déclaration ressource | `lib/providers/resources.ts`                  | Ajouter dans `FLEETCORE_RESOURCES[]`            |
| 3   | DataProvider case     | `lib/providers/data-provider.ts`              | Ajouter `case "{resource}"` dans chaque méthode |
| 4   | Page route            | `app/[locale]/(app)/{path}/page.tsx`          | Server Component minimal (~15 lignes)           |
| 5   | List component        | `features/{resource}/components/ListPage.tsx` | `useTable` + vue Kanban/Table                   |
| 6   | Colonnes              | `features/{resource}/columns.tsx`             | `ColumnDef<T>[]` pour la table                  |
| 7   | Hook mutations        | `features/{resource}/hooks/useMutations.ts`   | `useUpdate`, `useDelete`, `useCustom`           |
| 8   | Drawer/Form           | `features/{resource}/components/Drawer.tsx`   | React Hook Form + Zod                           |
| 9   | Traductions           | `lib/i18n/locales/{en,fr}/admin.json`         | Labels du module                                |
| 10  | Test E2E              | `e2e/{resource}.spec.ts`                      | Parcours CRUD complet                           |

### 7.4 Flux de données — Cycle complet

```
Utilisateur clique "Filtrer par status = demo"
    │
    ▼
LeadFilters → setFilters([{ field: "status", operator: "eq", value: "demo" }])
    │
    ▼
useTable détecte le changement de filtres
    │
    ├─ syncWithLocation: true → URL mise à jour: ?status=demo
    │
    ▼
TanStack Query lance une nouvelle requête (queryKey change)
    │
    ▼
DataProvider.getList({ resource: "leads", filters: [...], pagination: {...} })
    │
    ▼
fleetcoreDataProvider: switch("leads") → fetch("/api/v1/crm/leads?status=demo&page=1&limit=25")
    │
    ▼
API Route: /api/v1/crm/leads (route.ts)
    │
    ├─ auth() via Clerk middleware (déjà vérifié)
    ├─ getCurrentProviderId() → buildProviderFilter()
    ├─ db.crm_leads.findMany({ where: { status: "demo", ...providerFilter }, take: 25 })
    │
    ▼
Response: { data: Lead[], pagination: { total: 42 } }
    │
    ▼
TanStack Query cache la réponse (staleTime configurable)
    │
    ▼
useTable.tableQuery.data = { data: [...], total: 42 }
    │
    ▼
LeadsListPage re-render avec les nouvelles données
    │
    ▼
LeadsTable / LeadsKanbanBoard affichent les leads filtrés
```

---

## 8. Plan de migration incrémental

### 8.1 Principes de migration

1. **Coexistence** : Les anciennes pages et les nouvelles pages Refine coexistent pendant la migration
2. **Feature flag** : Chaque module migré peut être désactivé via une variable d'environnement
3. **Zéro modification backend** : Les Server Actions et API Routes ne sont PAS touchés
4. **Migration par module** : Un module entier est migré avant de passer au suivant

### 8.2 Phase 1 — Infrastructure (1-2 jours)

**Objectif :** Installer Refine, créer les providers, brancher dans le layout.

| #    | Tâche                                                 | Fichier                         | Effort |
| ---- | ----------------------------------------------------- | ------------------------------- | ------ |
| 1.1  | Installer `@tanstack/react-query` v5                  | `package.json`                  | 5 min  |
| 1.2  | Créer `lib/providers/data-provider.ts`                | nouveau                         | 4h     |
| 1.3  | Créer `lib/providers/auth-provider.ts`                | nouveau                         | 1h     |
| 1.4  | Créer `lib/providers/access-control-provider.ts`      | nouveau                         | 30 min |
| 1.5  | Créer `lib/providers/i18n-provider.ts`                | nouveau                         | 15 min |
| 1.6  | Créer `lib/providers/notification-provider.ts`        | nouveau                         | 15 min |
| 1.7  | Créer `lib/providers/audit-log-provider.ts`           | nouveau                         | 30 min |
| 1.8  | Créer `lib/providers/resources.ts`                    | nouveau                         | 1h     |
| 1.9  | Wrapper `<Refine>` dans le layout                     | `app/[locale]/(app)/layout.tsx` | 1h     |
| 1.10 | Vérifier que toutes les pages existantes fonctionnent | test manuel                     | 30 min |

**Livrable :** `<Refine>` monté avec tous les providers. Les pages existantes continuent de fonctionner car elles n'utilisent pas encore les hooks Refine.

**Validation :**

- `pnpm build` passe sans erreur
- Toutes les pages existantes s'affichent normalement
- `useTable({ resource: "leads" })` dans une page test retourne des données

### 8.3 Phase 2 — Module pilote : Leads (3-5 jours)

**Objectif :** Migrer le module Leads complet comme preuve de concept.

| #    | Tâche                                                | Fichier(s)          | Effort |
| ---- | ---------------------------------------------------- | ------------------- | ------ |
| 2.1  | Créer `features/leads/` structure                    | nouveau dossier     | 30 min |
| 2.2  | Créer `features/leads/components/LeadsListPage.tsx`  | nouveau             | 4h     |
| 2.3  | Créer `features/leads/columns.tsx`                   | nouveau             | 1h     |
| 2.4  | Créer `features/leads/hooks/useLeadMutations.ts`     | nouveau             | 2h     |
| 2.5  | Migrer `LeadsKanbanBoard` vers Refine hooks          | refactor            | 3h     |
| 2.6  | Migrer `LeadDrawer` vers Refine `useOne`/`useUpdate` | refactor            | 2h     |
| 2.7  | Migrer `LeadBulkActions` vers `useCustom`            | refactor            | 1h     |
| 2.8  | Réduire `app/[locale]/(app)/crm/leads/page.tsx`      | simplification      | 30 min |
| 2.9  | Ajouter `syncWithLocation` pour filtres URL          | config              | 30 min |
| 2.10 | Tests E2E : Kanban drag & drop, filtres, CRUD        | `e2e/leads.spec.ts` | 2h     |

**Fichiers supprimés après migration :**

- `components/crm/leads/LeadsPageClient.tsx` (1099 lignes) → remplacé par `features/leads/`
- La logique `fetchAllLeads()` dans `page.tsx` (75 lignes) → remplacée par `useTable`

**Métriques attendues :**

| Métrique                  | Avant                     | Après                       | Gain          |
| ------------------------- | ------------------------- | --------------------------- | ------------- |
| Lignes de code page leads | 1393 (page + client)      | ~300 (features/)            | -78%          |
| Temps de chargement       | Full DB fetch (100 leads) | Paginated (25/page)         | -60% TTI      |
| Cache client              | Aucun                     | TanStack Query (5min stale) | -70% requêtes |
| Filtres dans URL          | Non                       | Oui (syncWithLocation)      | Bookmarkable  |

**Validation :**

- Parcours E2E complet : créer lead → filtrer → drag Kanban → éditer drawer → bulk action → supprimer
- Performance : Lighthouse score ≥ 90 sur la page leads
- Pas de régression sur les Server Actions (tests `pnpm test:run`)

### 8.4 Phase 3 — Modules CRM restants (5-8 jours)

**Objectif :** Migrer opportunities, quotes, orders, agreements en suivant le pattern Leads.

| Module        | Effort estimé | Particularités                                                     |
| ------------- | ------------- | ------------------------------------------------------------------ |
| Opportunities | 3 jours       | Kanban par stage, deal rotting, Quote-to-Cash flow                 |
| Quotes        | 2 jours       | Versioning, send/accept/reject workflow, public token pages        |
| Orders        | 2 jours       | Fulfillment lifecycle, CRON jobs (auto-renew)                      |
| Agreements    | 2 jours       | Signature workflow (send → client sign → provider sign → activate) |
| Activities    | 1 jour        | Polymorphique (lead + opportunity), pas de page propre             |

**Pour chaque module, appliquer la checklist §7.3.**

### 8.5 Phase 4 — Modules non-CRM (variable)

**Objectif :** Migrer Fleet, Drivers, Maintenance, Analytics quand ces modules seront développés.

| Module           | Statut actuel         | Priorité migration                    |
| ---------------- | --------------------- | ------------------------------------- |
| Dashboard        | Existant (partiel)    | Basse — principalement des widgets    |
| Fleet / Vehicles | API Routes existantes | Haute — CRUD standard                 |
| Drivers          | API Routes existantes | Haute — CRUD standard                 |
| Maintenance      | API Routes existantes | Moyenne                               |
| Analytics        | Stub                  | Basse — principalement des graphiques |
| Settings         | Existant              | Basse — formulaire simple             |
| Admin            | Existant (audit logs) | Basse                                 |

### 8.6 Rollback strategy

**Tag git :** Créer `pre-refine-migration` avant de commencer.

**Feature flag :** Variable d'environnement `NEXT_PUBLIC_USE_REFINE=true|false`

```typescript
// app/[locale]/(app)/crm/leads/page.tsx
const useRefine = process.env.NEXT_PUBLIC_USE_REFINE === "true";

export default function LeadsPage() {
  if (useRefine) {
    return <LeadsListPageRefine />;  // Nouveau
  }
  return <LeadsPageLegacy />;        // Ancien (préservé)
}
```

---

## 9. Conventions et règles

### 9.1 Règles absolues

| #   | Règle                                                               | Raison                                                                            |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| R1  | **JAMAIS modifier un Server Action pour l'adapter au DataProvider** | La sécurité est dans les Server Actions. Le DataProvider s'adapte, pas l'inverse. |
| R2  | **JAMAIS supprimer une règle métier**                               | Cf. CLAUDE.md — Incident 27/11/2025                                               |
| R3  | **TOUJOURS utiliser `syncWithLocation: true`** pour les pages liste | UX : filtres bookmarkables, back button fonctionne                                |
| R4  | **TOUJOURS déclarer la ressource dans `FLEETCORE_RESOURCES`**       | Sinon Refine ne peut pas résoudre les routes                                      |
| R5  | **JAMAIS stocker de l'état de cache manuellement**                  | TanStack Query gère le cache. Pas de `useState` pour les données serveur          |
| R6  | **TOUJOURS utiliser `<CanAccess>` ou `useCan()`** pour le RBAC UI   | Pas de `if (hasPermission)` dans le JSX — utiliser le système Refine              |
| R7  | **UN dossier `features/{resource}/` par module**                    | Structure feature-based, pas de fourre-tout                                       |

### 9.2 Conventions de nommage

| Élément          | Convention                               | Exemple                                      |
| ---------------- | ---------------------------------------- | -------------------------------------------- |
| Ressource Refine | `camelCase` pluriel                      | `"leads"`, `"opportunities"`, `"quotes"`     |
| Dossier feature  | `kebab-case` ou identique à la ressource | `features/leads/`, `features/opportunities/` |
| Page component   | `PascalCase` + `ListPage`/`ShowPage`     | `LeadsListPage`, `QuoteShowPage`             |
| Hook mutations   | `use{Resource}Mutations`                 | `useLeadMutations`, `useQuoteMutations`      |
| Hook table       | `use{Resource}Table`                     | `useLeadsTable`                              |
| Colonnes         | `{resource}Columns`                      | `leadsColumns`, `quotesColumns`              |
| Provider         | `{name}Provider` en camelCase            | `fleetcoreDataProvider`, `clerkAuthProvider` |

### 9.3 Pattern d'erreur standard

```typescript
// Dans le DataProvider, TOUJOURS transformer les erreurs Server Action en HttpError Refine
if (!result.success) {
  throw {
    statusCode: 400,
    message: result.error,
    errors: result.validationErrors ?? [], // Si Zod retourne des détails
  };
  // Refine intercepte et affiche via NotificationProvider
}
```

### 9.4 Gestion du meta

Le champ `meta` est le canal de communication entre les composants et le DataProvider pour les cas non-standard :

```typescript
// meta réservés FleetCore
meta: {
  statusOnly: boolean; // Update status uniquement (Kanban)
  stageOnly: boolean; // Update stage uniquement (Kanban opportunities)
  action: string; // Action custom (qualify, convert, bulkAssign, etc.)
  withRelations: boolean; // Include relations dans getOne
  // ... params spécifiques à l'action
}
```

### 9.5 Tests

| Type        | Outil                    | Scope                                     |
| ----------- | ------------------------ | ----------------------------------------- |
| Unit        | Vitest                   | Providers (data-provider, access-control) |
| Integration | Vitest + Testing Library | Hooks (useLeadMutations)                  |
| E2E         | Playwright               | Parcours utilisateur complet              |

**Test minimal pour chaque provider :**

```typescript
// __tests__/providers/data-provider.test.ts
import { fleetcoreDataProvider } from "@/lib/providers/data-provider";

describe("DataProvider", () => {
  it("throws on unsupported resource", async () => {
    await expect(
      fleetcoreDataProvider.getList({ resource: "unknown" })
    ).rejects.toThrow("non supportée");
  });

  it("maps filters correctly", () => {
    // Tester filtersToQuery avec différents opérateurs
  });
});
```

---

## 10. Glossaire

| Terme                                         | Définition                                                                                                             |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **DataProvider**                              | Adaptateur Refine qui traduit les opérations CRUD en appels Server Action/API. `lib/providers/data-provider.ts`        |
| **AuthProvider**                              | Adaptateur Refine qui informe du statut d'authentification (Clerk). `lib/providers/auth-provider.ts`                   |
| **AccessControlProvider**                     | Adaptateur Refine pour le RBAC (vérifie permissions via `hasPermission()`). `lib/providers/access-control-provider.ts` |
| **RouterProvider**                            | Fourni par `@refinedev/nextjs-router` — gère la navigation App Router                                                  |
| **Resource**                                  | Entité CRUD déclarée dans `FLEETCORE_RESOURCES` (leads, opportunities, etc.)                                           |
| **useTable**                                  | Hook Refine qui combine pagination + filtres + tri + cache TanStack Query                                              |
| **useList**                                   | Hook Refine bas niveau pour récupérer une liste (sans pagination UI)                                                   |
| **useOne**                                    | Hook Refine pour récupérer un seul enregistrement                                                                      |
| **useCreate** / **useUpdate** / **useDelete** | Hooks mutation Refine avec invalidation automatique du cache                                                           |
| **useCustom**                                 | Hook Refine pour les actions hors CRUD standard (qualify, convert, bulk)                                               |
| **useCan**                                    | Hook Refine qui vérifie une permission via AccessControlProvider                                                       |
| **`<CanAccess>`**                             | Composant Refine qui masque/affiche ses enfants selon les permissions                                                  |
| **syncWithLocation**                          | Option useTable qui synchronise filtres/tri/pagination avec l'URL                                                      |
| **meta**                                      | Objet ouvert passé à chaque méthode DataProvider pour transporter des données custom                                   |
| **TanStack Query**                            | Bibliothèque de cache/invalidation (dépendance de @refinedev/core v5)                                                  |
| **Server Action**                             | Fonction `"use server"` Next.js appelée depuis le client. Point d'entrée sécurisé vers Prisma                          |
| **Provider Context**                          | `getCurrentProviderId()` + `buildProviderFilter()` — isolation multi-tenant                                            |
| **CrudFilter**                                | Type Refine pour les filtres (field + operator + value)                                                                |
| **CrudSort**                                  | Type Refine pour le tri (field + order)                                                                                |
| **BaseKey**                                   | `string \| number` — type d'identifiant dans Refine                                                                    |
| **GetListResponse**                           | `{ data: T[], total: number }` — format de retour de getList                                                           |
| **Feature-based structure**                   | Organisation du code par fonctionnalité (`features/leads/`) plutôt que par type (`components/`, `hooks/`)              |

---

## Annexe A — Inventaire des 70+ Server Actions

| Fichier                  | Fonctions                                                                  | Auth          | Provider Filter | Public    |
| ------------------------ | -------------------------------------------------------------------------- | ------------- | --------------- | --------- |
| `lead.actions.ts`        | `updateLeadStatusAction`, `updateLeadAction`                               | Clerk + Admin | Oui             | Non       |
| `qualify.actions.ts`     | `qualifyLeadAction`                                                        | Clerk + Admin | Oui             | Non       |
| `convert.actions.ts`     | `convertLeadToOpportunityAction`                                           | Clerk + Admin | Oui             | Non       |
| `bulk.actions.ts`        | `bulkAssignLeadsAction`, `bulkUpdateStatusAction`, `bulkDeleteLeadsAction` | Clerk + Admin | Oui             | Non       |
| `delete.actions.ts`      | `deleteLeadAction`, `restoreLeadAction`                                    | Clerk + Admin | Oui             | Non       |
| `opportunity.actions.ts` | 7 fonctions (CRUD + markWon/Lost + stage)                                  | Clerk + Admin | Oui             | Non       |
| `quote.actions.ts`       | 19 fonctions (15 admin + 3 public + 1 CRON)                                | Clerk + Admin | Oui             | 3 (token) |
| `orders.actions.ts`      | 12 fonctions (CRUD + lifecycle + CRON)                                     | Clerk + Admin | Oui             | Non       |
| `agreements.actions.ts`  | 16 fonctions (CRUD + signature + lifecycle)                                | Clerk + Admin | Oui             | Non       |
| `activities.actions.ts`  | 7 fonctions (CRUD + polymorphique lead/opp)                                | Clerk + Admin | Oui             | Non       |

> **Source :** `lib/actions/crm/*.actions.ts` — 10 fichiers, ~5000 lignes total

## Annexe B — Inventaire des 112+ API Routes

| Groupe                    | Routes                                                     | Auth           |
| ------------------------- | ---------------------------------------------------------- | -------------- |
| `/api/v1/crm/*`           | Leads, Opportunities, Quotes, Orders, Agreements, Settings | Clerk + Admin  |
| `/api/v1/drivers/*`       | 12 routes (CRUD + documents + performance)                 | Clerk + Tenant |
| `/api/v1/vehicles/*`      | 13 routes (CRUD + maintenance + insurance)                 | Clerk + Tenant |
| `/api/v1/directory/*`     | 6 routes (makes, models, countries, etc.)                  | Clerk          |
| `/api/v1/notifications/*` | 3 routes (send, history, stats)                            | Clerk          |
| `/api/public/*`           | 7 routes (quote view/accept/reject, countries, segments)   | Token / None   |
| `/api/crm/*`              | 8 routes (demo leads, booking, webhooks)                   | Mixte          |
| `/api/cron/*`             | 3 routes (notifications, fleet, opportunities)             | CRON secret    |
| `/api/webhooks/*`         | 3 routes (Clerk, Stripe, Resend)                           | Webhook secret |

> **Source :** `app/api/` — 112 fichiers `route.ts`

## Annexe C — Liens vers documents connexes

| Document                            | Contenu                                                  | Lignes |
| ----------------------------------- | -------------------------------------------------------- | ------ |
| `docs/REFINE_VS_CUSTOM_ANALYSIS.md` | Analyse comparative Refine vs Custom — décision validée  | 761    |
| `docs/AUTH_ARCHITECTURE_STUDY.md`   | Étude architecture auth — 52 fichiers Clerk, abstraction | 1030   |
| `docs/AUTH_ZERO_LOCKIN_STUDY.md`    | Étude zero lock-in auth — Supabase, Lucia, migration     | 791    |
| `docs/CLERK_AUDIT.md`               | Audit complet Clerk dans FleetCore                       | —      |

---

**Fin du document — 10 sections + 3 annexes**
**Auteur :** Claude Opus 4.6
**Prochaine étape :** Phase 1 — Infrastructure (§8.2)
