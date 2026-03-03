# PERF-FIX-001 — Résultats Phase A + Audit Holistique Phase B

**Date** : 2026-03-03
**Branche** : main
**Environnement** : dev local (macOS, single user)

---

## PHASE A — FIXES APPLIQUÉS + MESURES AVANT/APRÈS

### Fixes appliqués

| #   | Fix                                         | Fichier                                      | Détail                                  |
| --- | ------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| A1  | staleTime 30s + refetchOnWindowFocus: false | `refine-provider.tsx`                        | Global Refine reactQuery config         |
| A2  | refetchInterval 60s sur Kanban              | `use-leads-kanban.ts`                        | Auto-refresh board toutes les 60s       |
| A3  | meta.select dynamique sur Table             | `use-leads-table.ts`                         | Calcul fields depuis colonnes visibles  |
| A4  | dedupingInterval 5min sur hooks statiques   | `useLeadStages.ts`, `useFleetSizeOptions.ts` | Aligné à 5min (était 1min)              |
| A5  | viewMode + outcomeFilter dans URL           | `leads-view-router.tsx`                      | router.push/replace + Suspense boundary |

### Mesures Playwright avant/après

```
AVANT FIX :
  Kanban initial    : 5,600ms API + 16 appels (leads dupliqué 2x)
  Table switch      : 5,985ms API + 50,950 bytes payload (leads dupliqué 2x)
  Outcome click     : 4,724ms API + 21,019 bytes payload (leads dupliqué 2x)
  Back button       : ❌ Va aux tenants (pas de history entry)
  Auto-refresh      : ❌ N'existait pas

APRÈS FIX :
  Kanban initial    : 3,279ms API + 10 appels (-37% appels, leads 1x seul)
  Table switch      : 5,494ms API + 12,960 bytes payload (-75% payload!)
  Outcome click     : 4,616ms API + 5,508 bytes payload (-74% payload!)
  Back button       : ✅ Revient au Kanban (/en/crm/leads)
  Auto-refresh 60s  : ✅ Configuré
  URL navigation    : ✅ ?view=table&status=disqualified
```

### Note sur les appels dupliqués résiduels

Les appels Table/Outcome montrent encore 2 requêtes. Cause : le query key React Query change entre le 1er et 2e rendu car les `filters` sont reconstruits depuis nuqs (initialisation URL state). Ce n'est PAS un problème de staleTime — c'est un changement de query key. Le fix complet nécessiterait de stabiliser les filter references (refactoring nuqs deeper).

### Vérification build

```
pnpm tsc --noEmit   : ✅ PASS (0 erreurs)
pnpm build           : ✅ PASS
```

---

## PHASE B — AUDIT HOLISTIQUE (AUCUN FIX APPLIQUÉ)

### MODULES SCANNÉS

| Module                                                          | Fichiers analysés |
| --------------------------------------------------------------- | ----------------- |
| CRM (leads, dashboard, browser, reports, opportunities, quotes) | ~40 fichiers      |
| Settings (members, tenants, invitations, company-profile, CRM)  | ~15 fichiers      |
| Fleet / Drivers / Maintenance                                   | ~5 fichiers       |
| Admin (members, tenants, countries)                             | ~10 fichiers      |
| Public (book-demo, waitlist, verify)                            | ~10 fichiers      |
| Auth (login, register, reset-password)                          | ~8 fichiers       |

---

### PROBLÈME 1 — useList/useOne SANS meta.select

**Total hooks sans select : 6**

| Fichier                                                    | Hook    | Resource         | Impact                        |
| ---------------------------------------------------------- | ------- | ---------------- | ----------------------------- |
| `features/settings/hooks/use-invitations-table.ts:14`      | useList | invitations      | Fetche ALL fields             |
| `features/settings/hooks/use-members-table.ts:14`          | useList | members          | Fetche ALL fields             |
| `features/settings/hooks/use-tenants-table.ts:14`          | useList | tenants          | Fetche ALL fields             |
| `features/settings/hooks/use-tenant-countries-table.ts:16` | useList | tenant-countries | Fetche ALL fields             |
| `features/crm/leads/components/leads-edit-drawer.tsx:254`  | useOne  | leads            | Fetche ALL fields pour 1 lead |
| `components/crm/leads/LeadDrawer.tsx:119`                  | useOne  | leads            | Fetche ALL fields pour 1 lead |

**Hooks AVEC meta.select (corrects) : 2**

- `use-leads-kanban.ts:159` — 22 fields
- `use-leads-table.ts:328` — dynamique selon colonnes visibles (nouveau fix A3)

---

### PROBLÈME 2 — Données statiques sans staleTime élevé

**Total : 2 hooks avec dedupingInterval insuffisant (corrigés en A4)**

Tous les hooks SWR statiques sont maintenant à 5min :

- useLeadStatuses : 300,000ms + revalidateOnFocus: false
- useLeadStages : 300,000ms + revalidateOnFocus: false (was 60,000)
- useFleetSizeOptions : 300,000ms + revalidateOnFocus: false (was 60,000)
- useSalesOwners : 300,000ms + revalidateOnFocus: false
- useSidebarFilterData : 300,000ms + revalidateOnFocus: false
- useOpportunityStatuses : 60,000ms + revalidateOnFocus: false
- useLeadLossReasons : 60,000ms + revalidateOnFocus: false

---

### PROBLÈME 3 — Re-render risques (>5 useState)

**Total : 23 composants**

| Gravité  | Fichier                                                    | useState count |
| -------- | ---------------------------------------------------------- | -------------- |
| CRITIQUE | `components/crm/settings/PipelineSettingsTab.tsx`          | 25             |
| CRITIQUE | `components/crm/leads/LeadsPageClient.tsx`                 | 24             |
| HAUTE    | `components/crm/quotes/QuotesPageClient.tsx`               | 14             |
| HAUTE    | `components/crm/leads/LeadsBrowserClient.tsx`              | 12             |
| HAUTE    | `components/crm/opportunities/OpportunitiesPageClient.tsx` | 12             |
| MOYENNE  | `features/crm/leads/components/leads-list-page.tsx`        | 10             |
| MOYENNE  | `components/crm/settings/LossReasonsSettingsTab.tsx`       | 10             |
| MOYENNE  | `components/crm/leads/LeadBantSection.tsx`                 | 9              |
| MOYENNE  | `components/crm/leads/LeadDetailPage.tsx`                  | 9              |
| MOYENNE  | `components/crm/opportunities/MarkAsLostModal.tsx`         | 9              |
| MOYENNE  | `components/crm/opportunities/MarkAsWonModal.tsx`          | 9              |
| MOYENNE  | `components/crm/settings/LossReasonEditor.tsx`             | 9              |

---

### PROBLÈME 4 — Pas de loading skeleton

**Pages avec loading.tsx explicite : 8**
**Pages avec Suspense fallback : 14/49 (29%)**

Pages SANS loading indicator ni Suspense :

- Toutes les pages admin (members, tenants, invitations, countries) — 7 pages
- CRM leads detail, directory, reports — 3 pages
- Dashboard — 1 page
- Settings — 2 pages
- Nombreuses pages public (book-demo steps, waitlist, terms) — 12 pages

---

### PROBLÈME 5 — useEffect + fetch (anti-pattern)

**Total : 2-3 instances**

| Fichier                                                       | Endpoint                                                       | Anti-pattern                 |
| ------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------- |
| `features/settings/components/company-profile-page.tsx:55-79` | `/api/admin/settings/company-profile` + `/api/admin/countries` | useEffect + fetch + setState |
| `features/settings/components/tenant-detail-page.tsx:94-109`  | `/api/admin/tenants/${id}`                                     | useEffect + fetch + setState |

Note : module admin/settings uniquement. Le CRM utilise correctement Refine hooks.

---

### PROBLÈME 6 — Imports lourds non-dynamiques

**Résultat : MINIMAL**

- `@dnd-kit` : import statique dans `leads-kanban-board.tsx` (pas dynamique, mais utilisé seulement en vue Kanban)
- `date-fns` : imports tree-shakeable (import individuels `format`, `subDays`) — OK
- `recharts` : NON TROUVÉ
- `lodash` : NON TROUVÉ
- `dynamic()` : 1 usage trouvé (`dashboard/page.tsx`)

---

### PROBLÈME 7 — Navigation par setState

**Résultat : CORRIGÉ (A5)**

Avant fix : `leads-view-router.tsx` utilisait setState pour viewMode/outcomeFilter.
Après fix : utilise `router.push` / `router.replace` + URL params.

Aucun autre cas de navigation par setState trouvé dans le codebase.

---

### PROBLÈME 8 — Middleware

**Fichier** : `middleware.ts` — 143 lignes

- AUCUN appel réseau (pas de fetch, prisma, supabase)
- Auth = vérification cookie synchrone uniquement
- Rate limiter in-memory
- Edge Runtime compatible
- **Impact perf : NÉGLIGEABLE**

---

### PROBLÈME 9 — Grosses API routes

**Total au-dessus de 200 lignes : 11**

| Lignes | Fichier                                      |
| ------ | -------------------------------------------- |
| 696    | `app/api/v1/crm/leads/route.ts`              |
| 644    | `app/api/v1/crm/opportunities/[id]/route.ts` |
| 604    | `app/api/v1/crm/leads/[id]/route.ts`         |
| 594    | `app/api/v1/crm/opportunities/route.ts`      |
| 589    | `app/api/crm/demo-leads/route.ts`            |
| 445    | `app/api/v1/crm/settings/[key]/route.ts`     |
| 433    | `app/api/v1/crm/leads/stats/route.ts`        |
| 340    | `app/api/waitlist/route.ts`                  |
| 314    | `app/api/v1/crm/leads/export/route.ts`       |
| 306    | `app/api/v1/crm/settings/route.ts`           |
| 290    | `app/api/cron/nurturing/route.ts`            |

---

### PROBLÈME 10 — Pages sans Suspense

**Total : 35/49 pages sans Suspense (71%)**

Couverture par module :

- Quotes/Opportunities : 100% Suspense
- Auth : 67% Suspense
- Admin : 0% Suspense
- CRM leads : 9% Suspense (seulement browser)
- Public : 14% Suspense

---

## SCORE GLOBAL PAR MODULE

| Module                | Problèmes | Gravité | Détail                                                                 |
| --------------------- | --------- | ------- | ---------------------------------------------------------------------- |
| **CRM Leads**         | 4         | HAUTE   | 2 useOne sans select, 23 useState, leads-list 10 useState              |
| **CRM Opportunities** | 2         | MOYENNE | 1 useList sans select (settings), 2 modals 9 useState                  |
| **CRM Quotes**        | 1         | BASSE   | 1 page client 14 useState                                              |
| **Settings**          | 5         | HAUTE   | 4 useList sans select, 2 useEffect+fetch, 25 useState PipelineSettings |
| **Admin**             | 3         | MOYENNE | 0% Suspense, pages délèguent aux features                              |
| **Fleet/Drivers**     | 0         | BASSE   | Peu de données dynamiques                                              |
| **Public**            | 1         | BASSE   | Pas de Suspense (pages statiques)                                      |

---

## TOP 10 FICHIERS LES PLUS PROBLÉMATIQUES

| #   | Fichier                         | Problèmes                       | Détail                   |
| --- | ------------------------------- | ------------------------------- | ------------------------ |
| 1   | `PipelineSettingsTab.tsx`       | 25 useState                     | Decomposition urgente    |
| 2   | `LeadsPageClient.tsx`           | 24 useState                     | Decomposition urgente    |
| 3   | `use-invitations-table.ts`      | Pas de meta.select              | ALL fields fetched       |
| 4   | `use-members-table.ts`          | Pas de meta.select              | ALL fields fetched       |
| 5   | `use-tenants-table.ts`          | Pas de meta.select              | ALL fields fetched       |
| 6   | `use-tenant-countries-table.ts` | Pas de meta.select              | ALL fields fetched       |
| 7   | `company-profile-page.tsx`      | useEffect + fetch               | Anti-pattern Refine      |
| 8   | `tenant-detail-page.tsx`        | useEffect + fetch               | Anti-pattern Refine      |
| 9   | `LeadDrawer.tsx`                | useOne sans select + 8 useState | Full payload pour 1 lead |
| 10  | `leads-edit-drawer.tsx`         | useOne sans select              | Full payload pour 1 lead |

---

_Audit holistique terminé. Aucun fix appliqué en Phase B. En attente de priorisation CEO._
