# DIAGNOSTIC PERFORMANCE + NAVIGATION — CRM Leads

**Date** : 2026-03-03
**Branche** : main @ af3119b
**Environnement** : dev local (macOS, single user, zero charge)
**Données** : 34 leads en base, 27 visibles (non-deleted)

---

## PHASE 1 — DIAGNOSTIC PERFORMANCE

### 1.1 Symptôme rapporté

> 27 leads, la liste filtrée met 2-3 MINUTES à s'afficher. Un seul utilisateur, zéro charge.

### 1.2 Mesures Playwright réelles

| Page / Action                | TTFB  | API principale                                                 | Payload     | Appels API total |
| ---------------------------- | ----- | -------------------------------------------------------------- | ----------- | ---------------- |
| Kanban (initial load)        | 255ms | **5,600ms** (`/api/v1/crm/leads?fields=22cols`)                | 12 KB       | 16               |
| Table (switch depuis Kanban) | —     | **5,985ms** (`/api/v1/crm/leads?limit=20`)                     | **50.9 KB** | 2                |
| Disqualified (outcome click) | —     | **4,724ms** (`/api/v1/crm/leads?status=disqualified&limit=20`) | **21 KB**   | 2                |

### 1.3 CAUSES RACINES IDENTIFIÉES

#### CAUSE #1 — API leads dupliquée (CHAQUE requête est faite 2 fois)

**Gravité** : CRITIQUE
**Impact** : x2 temps réseau + x2 charge serveur

**Preuve** :

- Table view : `/api/v1/crm/leads?page=1&limit=20` appelé **2 fois** (5,985ms + 3,084ms)
- Filtered view : `/api/v1/crm/leads?page=1&limit=20&status=disqualified` appelé **2 fois** (4,724ms + 2,428ms)
- Kanban view : `/api/v1/crm/leads?fields=...` appelé **2 fois** (5,600ms + 3,343ms)

**Cause technique** :

- **Aucun `staleTime` configuré** — ni dans Refine options (`refine-provider.tsx:48-53`), ni dans les hooks individuels
- React Query default : `staleTime = 0` → chaque mount/focus déclenche un refetch immédiat
- Les `filters` sont reconstruits depuis 4 sources (`columnFilters`, `sidebarFilters`, `searchFilter`, `outcomeFilter`) dans `use-leads-table.ts:302-310` — chaque changement de référence déclenche un nouveau useList

**Fichier** : `components/providers/refine-provider.tsx:48-53`

```typescript
options={{
  disableTelemetry: true,
  syncWithLocation: true,
  warnWhenUnsavedChanges: true,
  projectId: "fleetcore",
  // ⚠️ MANQUANT : reactQuery: { clientConfig: { defaultOptions: { queries: { staleTime } } } }
}}
```

#### CAUSE #2 — Table fetche TOUTES les colonnes (90+) sans meta.select

**Gravité** : HAUTE
**Impact** : payload x3.7 vs Kanban optimisé

**Preuve** :

- Kanban `useList` : `meta: { select: kanbanFields }` → 22 champs → URL avec `fields=id,lead_code,...` → **12 KB**
- Table `useList` : **aucun meta.select** → toutes les 90+ colonnes + relations → **50.9 KB** pour 20 leads

**Fichier** : `features/crm/leads/hooks/use-leads-table.ts:313-318`

```typescript
const { query, result } = useList<Lead>({
  resource: "leads",
  pagination: { currentPage: page, pageSize: perPage },
  sorters,
  filters,
  // ⚠️ MANQUANT : meta: { select: tableFields }
});
```

**Comparaison** : `features/crm/leads/hooks/use-leads-kanban.ts:159-165`

```typescript
const { query, result } = useList<Lead>({
  resource: "leads",
  // ...
  meta: { select: kanbanFields }, // ✅ 22 champs seulement
});
```

**Mécanisme côté API** : Le paramètre `fields` dans l'URL est traduit en Prisma `select` (`app/api/v1/crm/leads/route.ts:534-601`). Sans `fields`, le backend utilise `include` avec toutes les relations.

#### CAUSE #3 — Appels API auxiliaires lents au chargement initial

**Gravité** : MOYENNE
**Impact** : 3-5 secondes par appel auxiliaire

**Preuve (chargement initial Kanban)** :
| API | Durée | Payload |
|---|---|---|
| `/api/v1/crm/owners` | 4,875ms | 862 B |
| `/api/v1/crm/settings/lead_status_workflow` | 4,874ms | 2.1 KB |
| `/api/auth/organization/get-full-organization` | 3,567ms | 1.8 KB |
| `/api/admin/countries` | 3,553ms | 3 KB |
| `/api/v1/crm/settings/lead_stages` | 2,974ms | 1.4 KB |
| `/api/v1/crm/settings/fleet_size_options` | 2,972ms | 1.3 KB |
| `/api/v1/directory/platforms` | 2,956ms | 2.2 KB |

Ces appels retournent des **données quasi-statiques** (workflow, stages, countries) mais sont refetchés à chaque navigation car aucun `staleTime` n'est configuré.

### 1.4 CE QUI N'EST PAS LA CAUSE

| Hypothèse            | Verdict | Justification                                                    |
| -------------------- | ------- | ---------------------------------------------------------------- |
| N+1 queries Prisma   | **NON** | Backend utilise `findMany` avec `select`/`include` propres       |
| Index manquants      | **NON** | 39 index sur `crm_leads` (plus d'index que de lignes : 39 vs 34) |
| Auth middleware lent | **NON** | Middleware = cookie check Edge Runtime, session cache 5 min      |
| React StrictMode     | **NON** | Non activé dans `next.config.ts`                                 |
| Volume de données    | **NON** | 34 rows, table microscopique                                     |

### 1.5 Détail indexation (pour mémoire)

- **34 lignes** dans `crm_leads`
- **90 colonnes**
- **39 index** (plus d'index que de lignes !)
- Index dupliqués détectés : `status` (3 index), `country_code` (2), `assigned_to` (2), `reschedule_token` (2)
- A cette échelle, PostgreSQL fait un seq-scan en microsecondes. Les index n'ont aucun impact perf.

### 1.6 RÉSUMÉ PERFORMANCE

```
CAUSE RACINE #1 : staleTime = 0 → chaque API appelée 2 FOIS     → x2 temps
CAUSE RACINE #2 : Table sans meta.select → 90 cols au lieu de ~20 → x3.7 payload
CAUSE RACINE #3 : Données statiques refetchées à chaque navigation → +15-20s cumulé
```

**Temps total observé** : Kanban initial ≈ 6s, Table switch ≈ 6s, Outcome click ≈ 5s.
Avec les doublons, l'utilisateur perçoit 10-12s de latence effective. Le "2-3 minutes" rapporté est probablement exagéré ou lié à un réseau lent, mais le problème est réel et significatif.

---

## PHASE 2 — DIAGNOSTIC NAVIGATION

### 2.1 Symptôme rapporté

> Bouton retour depuis la liste filtrée (disqualified) ramène à la page tenants au lieu du Kanban.

### 2.2 Preuve Playwright

| Action                     | URL résultante                  | History entry créé ?      |
| -------------------------- | ------------------------------- | ------------------------- |
| Arriver sur Kanban         | `/en/crm/leads`                 | OUI (navigation initiale) |
| Click "Disqualified" badge | `/en/crm/leads` (inchangée)     | **NON**                   |
| Click "Table" toggle       | `/en/crm/leads` (inchangée)     | **NON**                   |
| Click "Back" browser       | Page précédente (login/tenants) | —                         |

### 2.3 CAUSE RACINE

**Le switch Kanban→Table est géré par `useState`, pas par le router.**

**Fichier** : `features/crm/leads/components/leads-view-router.tsx:44-52`

```typescript
const handleOutcomeClick = useCallback((status: string) => {
  setOutcomeFilter(status); // ← setState, pas router.push
  setViewMode("table"); // ← setState, pas router.push
  localStorage.setItem(VIEW_MODE_STORAGE_KEY, "table");
}, []);
```

**Conséquence** :

1. L'URL reste `/en/crm/leads` — aucun changement d'URL
2. Aucune entrée dans `window.history` — le navigateur ne sait pas qu'une "navigation" a eu lieu
3. Le bouton "Back" du navigateur revient à la page AVANT `/en/crm/leads` (typiquement `/en/admin/tenants`)

### 2.4 Est-ce une régression B2-DND ?

**NON.** Le commit `13c8c74` (pré-B2-DND) avait déjà le même mécanisme `setState` dans `leads-view-router.tsx`. Ce n'est pas une régression — c'est un **défaut de conception d'origine**.

### 2.5 Pourquoi l'URL ne change pas

Le `LeadsViewRouter` utilise un **pattern de conditional rendering** :

```typescript
if (viewMode === "kanban") {
  return <LeadsKanbanPage />;    // Rendu conditionnel
}
return <LeadsListPage />;         // Rendu conditionnel
```

Pas de routing Next.js (pas de `router.push`), pas de query params (pas de `?view=table`), pas de hash fragments. Le switch est 100% côté client via React state.

### 2.6 RÉSUMÉ NAVIGATION

```
CAUSE RACINE : handleOutcomeClick utilise setState au lieu de router.push/URL params
RÉGRESSION B2-DND : NON — défaut d'origine pré-existant
FIX NÉCESSAIRE : Encoder viewMode et outcomeFilter dans l'URL (query params ou hash)
```

---

## SYNTHÈSE GLOBALE — ACTIONS RECOMMANDÉES

### Performance (par ordre de priorité)

| #   | Action                                                                                              | Impact estimé                               | Complexité |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------- |
| P1  | Ajouter `staleTime: 5 * 60 * 1000` dans Refine options globales                                     | Élimine les doublons API (-50% requêtes)    | TRIVIAL    |
| P2  | Ajouter `meta.select` au `useList` de la Table                                                      | Réduit payload de 50KB→15KB (-70%)          | FACILE     |
| P3  | Ajouter `staleTime: Infinity` aux appels données statiques (workflow, stages, countries, platforms) | Élimine ~7 appels redondants par navigation | FACILE     |

### Navigation

| #   | Action                                                                                              | Impact                              | Complexité |
| --- | --------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------- |
| N1  | Encoder `viewMode` et `outcomeFilter` dans les query params URL (`?view=table&status=disqualified`) | Back button fonctionne correctement | MOYEN      |

---

_Diagnostic terminé. Aucun fix appliqué. En attente de validation._
