# AUDIT COMPARATIF DATATABLE — FleetCore

**Date :** 2026-02-28
**Scope :** Lead Pipeline vs 3 Admin DataTables (Tenants, Members, Invitations)
**Mode :** Lecture seule — ZÉRO modification de code

---

## A) TABLEAU COMPARATIF

| Fonctionnalité                | Lead Pipeline                                                       | Tenants                                                        | Members                                                                      | Invitations                                      |
| ----------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| **Wrapper**                   | `DataTable` (`components/ui/table/data-table.tsx`)                  | Identique                                                      | Identique                                                                    | Identique                                        |
| **Hook table**                | `useDataTable` (Kiranism) + `useList` (Refine) + `nuqs` (URL state) | `useReactTable` direct + `useList` (Refine) + state local      | Identique Tenants                                                            | Identique Tenants                                |
| **URL state (nuqs)**          | OUI — pagination, sorting, filters, sidebar                         | NON — state local React                                        | NON                                                                          | NON                                              |
| **Global search**             | OUI — debounced, server-side                                        | NON                                                            | NON                                                                          | NON                                              |
| **Sidebar filtres**           | OUI — 17 catégories, collapsible, mobile sheet                      | NON                                                            | NON                                                                          | NON                                              |
| **Toolbar filters (faceted)** | OUI — status, priority, company_name (metadata-driven)              | OUI — tenantType, status                                       | OUI — role, status                                                           | OUI — status                                     |
| **Density toggle**            | OUI                                                                 | OUI                                                            | OUI                                                                          | OUI                                              |
| **Expand toggle**             | OUI                                                                 | OUI                                                            | OUI                                                                          | OUI                                              |
| **Export CSV**                | OUI                                                                 | OUI                                                            | OUI                                                                          | OUI                                              |
| **Export Excel**              | OUI                                                                 | OUI                                                            | OUI                                                                          | OUI                                              |
| **Pagination**                | Server-side (Refine `useList` + nuqs)                               | Client-side (`getPaginationRowModel`)                          | Client-side                                                                  | Client-side                                      |
| **Tri (sorting)**             | Server-side (URL state)                                             | Client-side (`getSortedRowModel`)                              | Client-side                                                                  | Client-side                                      |
| **Sélection checkbox**        | OUI                                                                 | OUI                                                            | OUI                                                                          | OUI                                              |
| **Bulk actions**              | OUI — 5 actions (Assign, Status, Export, Delete, Clear)             | OUI — 3 (Suspend, Activate, Delete)                            | OUI — 4 (Reset Pwd, Deactivate, Activate, Delete)                            | OUI — 3 (Resend, Revoke, Delete)                 |
| **Bulk actions UI**           | `BulkActionsBar` floating (Framer Motion, fixed bottom)             | `DataTableBulkActions` (inline actionBar prop)                 | Identique Tenants                                                            | Identique Tenants                                |
| **Row pinning**               | OUI (pin top/bottom via actions dropdown)                           | NON                                                            | NON                                                                          | NON                                              |
| **Expanded row content**      | OUI — scores, insights, message, notes                              | NON (expand toggle présent mais pas de contenu custom)         | NON                                                                          | NON                                              |
| **Row indicator**             | OUI — border-left rouge si callback overdue / meeting missed        | NON                                                            | NON                                                                          | NON                                              |
| **Bouton création**           | "New Lead" dans toolbar                                             | "Create Tenant" dans toolbar                                   | "Add Member" dans toolbar                                                    | "Send Invitation" dans toolbar                   |
| **Nombre de colonnes**        | 86 (84 data + select + expand)                                      | 11 (9 data + select + expand)                                  | 11 (9 data + select + expand)                                                | 10 (8 data + select + expand)                    |
| **Colonne actions**           | DERNIÈRE — DropdownMenu (View, Edit, Pin, Delete)                   | DERNIÈRE — DropdownMenu (View, Edit, Suspend/Activate, Delete) | DERNIÈRE — DropdownMenu (View, Edit, Reset Pwd, Deactivate/Activate, Delete) | DERNIÈRE — DropdownMenu (Resend, Revoke, Delete) |
| **Actions column size**       | 40px                                                                | 40px                                                           | 40px                                                                         | 40px                                             |
| **Empty state**               | NON TROUVÉ dans leads-list-page                                     | OUI — EmptyState (Building2 icon)                              | OUI — EmptyState (Users icon)                                                | OUI — EmptyState (Mail icon)                     |
| **Loading state**             | NON TROUVÉ dans leads-list-page                                     | DataTableSkeleton (9 col, 2 filters, 6 rows)                   | DataTableSkeleton (10 col, 2 filters, 8 rows)                                | DataTableSkeleton (9 col, 1 filter, 5 rows)      |
| **Delete confirmation**       | AlertDialog                                                         | AlertDialog                                                    | AlertDialog                                                                  | AlertDialog                                      |
| **Edit mode**                 | Drawer (Sheet, side right, max-w-xl)                                | Dialog                                                         | Dialog                                                                       | N/A                                              |
| **View mode toggle**          | OUI — Table/Kanban (ViewToggle composant)                           | NON                                                            | NON                                                                          | NON                                              |
| **Sidebar toggle**            | OUI — desktop toggle + mobile sheet                                 | NON                                                            | NON                                                                          | NON                                              |
| **Responsive mobile**         | Sidebar → Sheet, colonnes hidden md/lg                              | Buttons h-8                                                    | Buttons h-8                                                                  | Buttons h-8                                      |
| **refetchInterval**           | NON (on-demand via Refine)                                          | 30_000ms (30s)                                                 | 30_000ms (30s)                                                               | 30_000ms (30s)                                   |
| **Table preferences**         | OUI — column visibility saved (localStorage)                        | OUI — density, expand (localStorage)                           | OUI — density, expand                                                        | OUI — density, expand                            |

---

## B) ÉCARTS IDENTIFIÉS

### Écarts architecturaux (Lead Pipeline vs Admin)

| #   | Écart               | Lead Pipeline                                                                                       | Admin (Tenants/Members/Invitations)                                            | Impact                                                              |
| --- | ------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | **Hook table**      | `useDataTable` (Kiranism) — gestion intégrée pagination/sorting/filtering/visibility/selection      | `useReactTable` direct — chaque state géré manuellement (15+ useState)         | Admin : code dupliqué ~120 lignes par hook                          |
| 2   | **URL state**       | `nuqs` — pagination, sorting, filters persistés dans l'URL. Partage possible entre Table et Kanban. | State local React — perdu à chaque navigation/refresh                          | Admin : l'utilisateur perd ses filtres en naviguant                 |
| 3   | **Pagination**      | Server-side (Refine envoie page + pageSize à l'API)                                                 | Client-side (`getPaginationRowModel` — toutes les données chargées en mémoire) | Admin : acceptable si <1000 rows. Non scalable.                     |
| 4   | **Sorting**         | Server-side (URL state → API)                                                                       | Client-side (`getSortedRowModel`)                                              | Admin : acceptable si <1000 rows                                    |
| 5   | **Global search**   | OUI — input debounced dans toolbar, server-side                                                     | ABSENT — aucune barre de recherche                                             | Admin : l'utilisateur ne peut pas chercher un tenant/member par nom |
| 6   | **Sidebar filtres** | 17 catégories de filtres avancés, collapsible, persistés URL                                        | ABSENT                                                                         | Admin : peu critique (peu de données)                               |
| 7   | **Bulk actions UI** | `BulkActionsBar` floating animée (Framer Motion, fixed bottom center)                               | `DataTableBulkActions` intégrée (actionBar prop du DataTable)                  | Incohérence visuelle entre les deux                                 |
| 8   | **Expanded row**    | Contenu riche (scores, insights, message) via `renderExpandedRow`                                   | Toggle expand présent mais aucun `renderExpandedRow` passé                     | Admin : le toggle expand est activable mais ne fait rien de visible |
| 9   | **Empty state**     | NON TROUVÉ dans leads-list-page                                                                     | Présent avec EmptyState, icon, action button                                   | Lead Pipeline : pas d'état vide documenté                           |
| 10  | **Loading state**   | NON TROUVÉ dans leads-list-page                                                                     | Présent avec DataTableSkeleton                                                 | Lead Pipeline : géré par Refine/Suspense ? À vérifier.              |

### Écarts visuels/UX

| #   | Écart                                   | Description                                                                                                                                  |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | **Pas de recherche globale dans Admin** | Les 3 tables Admin n'ont aucun input de recherche. Pour trouver un member, il faut scroller.                                                 |
| 12  | **Faceted filters limités dans Admin**  | Tenants : 2 filtres (type, status). Members : 2 (role, status). Invitations : 1 (status). Lead Pipeline : 3+ toolbar + 17 sidebar.           |
| 13  | **Date formatting incohérent**          | Tenants/Invitations : `toLocaleDateString()`. Members : format custom `DD/MM/YYYY HH:MM`. Lead Pipeline : via DataTableColumnHeader.         |
| 14  | **Colonne actions identique**           | Les 4 tables utilisent le même pattern : DropdownMenu, MoreHorizontal, dernière position, size 40px. C'est COHÉRENT.                         |
| 15  | **Country flag function**               | Tenants et Members ont chacun leur propre `countryFlag()` locale. Lead Pipeline utilise `flag_emoji` depuis l'API. Pas de fonction partagée. |

---

## C) PROBLÈME BOUTON ACTION — Analyse spécifique

### Position actuelle

Les 4 DataTables (Lead Pipeline + 3 Admin) utilisent le **même pattern** pour la colonne actions :

```
Colonne ID : "actions"
Position : DERNIÈRE colonne (après toutes les colonnes data)
Icon : MoreHorizontal (⋯) de lucide-react
Button : variant="ghost", size="icon", className="size-8"
Menu : DropdownMenuContent align="end" (dropdown s'ouvre vers la gauche)
Size : 40px fixe
enableSorting : false
enableHiding : false
enableResizing : false (Lead Pipeline uniquement)
enablePinning : false (Lead Pipeline uniquement)
```

**Fichiers sources :**

- Lead Pipeline : `features/crm/leads/components/lead-columns.tsx:1459-1521`
- Tenants : `features/settings/components/tenants-columns.tsx:273-312`
- Members : `features/settings/components/members-columns.tsx:282-331`
- Invitations : `features/settings/components/invitations-columns.tsx:217-257`

### Comportement sur écran large

Quand l'écran est large (>1440px) :

- La colonne actions reste collée à **l'extrême droite du contenu de la table**
- Elle n'est PAS sticky/pinned — elle scrolle horizontalement avec la table
- Sur Lead Pipeline (86 colonnes), le bouton ⋯ est INVISIBLE sans scroll horizontal
- Sur Admin (9-11 colonnes), le bouton ⋯ est visible car tout tient dans le viewport

**Problème Lead Pipeline :** Avec 86 colonnes, l'utilisateur doit scroller horizontalement pour atteindre les actions. Le bouton ⋯ est effectivement inaccessible sans effort.

**Pas de problème Admin :** Avec 9-11 colonnes, tout tient dans le viewport. Le bouton ⋯ est toujours visible.

### Comparaison avec les standards industrie

| Produit              | Placement actions                             | Sticky ? | Mécanisme                                    |
| -------------------- | --------------------------------------------- | -------- | -------------------------------------------- |
| **Stripe Dashboard** | Dernière colonne, pinned right                | OUI      | Colonne sticky avec shadow left              |
| **Linear**           | Row hover → actions inline right              | OUI      | Apparition au hover, position absolute right |
| **Notion**           | Row hover → ⋯ left of row                     | NON      | Hover-triggered, position relative           |
| **Airtable**         | Row expand button (left) + cell actions       | N/A      | Pas de colonne actions classique             |
| **HubSpot CRM**      | Première colonne (nom) + actions right sticky | OUI      | Sticky right avec background                 |

**Consensus industrie :** Les actions row sont soit :

1. **Sticky à droite** (Stripe, HubSpot) — toujours visibles même avec scroll horizontal
2. **Hover-triggered** (Linear, Notion) — apparaissent au survol sans prendre d'espace

### Recommandation pour FleetCore

**Option recommandée : Sticky right (pattern Stripe/HubSpot)**

Raisons :

- FleetCore a des tables avec beaucoup de colonnes (Lead Pipeline = 86)
- Le sticky right garantit que les actions sont TOUJOURS accessibles
- Le hover-triggered est moins discoverable sur mobile/tactile
- Le pattern Kiranism supporte déjà le column pinning (`enableColumnPinning: true`) et la fonction `getCommonPinningStyles` existe dans le DataTable

**Implémentation (concept, sans code) :**

- Ajouter `columnPinning: { right: ["actions"] }` dans l'état initial du hook
- Le DataTable de Kiranism applique déjà les styles sticky via `getCommonPinningStyles`
- Résultat : colonne actions fixe à droite avec ombre, visible même avec scroll horizontal

---

## D) PROPOSITION DE STANDARD CORRIGÉ

### D.1 — Composant wrapper unique

**Standard :** Toutes les DataTables FleetCore DOIVENT utiliser `DataTable` de `@/components/ui/table/data-table.tsx`.

**C'est déjà le cas.** Les 4 tables importent le même composant. Pas de divergence ici.

### D.2 — Hook table unique

**Standard proposé :** Migrer les 3 hooks Admin vers `useDataTable` (Kiranism).

| Avant (Admin actuel)                    | Après (standard)                       |
| --------------------------------------- | -------------------------------------- |
| `useReactTable` + 15 `useState` manuels | `useDataTable` avec config déclarative |
| State local (perdu au refresh)          | URL state via `nuqs` (persisté)        |
| ~120 lignes de boilerplate par hook     | ~30 lignes de config                   |

**Fichier de référence :** `/Users/mohamedfodil/Documents/references/kiranism/src/hooks/use-data-table.ts`

**Déjà utilisé par :** Lead Pipeline (`features/crm/leads/hooks/use-leads-table.ts:304`)

### D.3 — Toolbar standard

**Ordre des éléments dans DataTableToolbar :**

```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Search...] [Faceted Filters] [Reset]     [Actions] [⚙] │
└─────────────────────────────────────────────────────────────┘
```

| Position | Élément                    | Obligatoire                | Notes                                      |
| -------- | -------------------------- | -------------------------- | ------------------------------------------ |
| Gauche 1 | **Global search**          | OUI                        | Input debounced, placeholder contextualisé |
| Gauche 2 | **Faceted filters**        | OUI si >1 valeur filtrable | Générés depuis column metadata             |
| Gauche 3 | **Reset filters**          | Auto                       | Visible si filtres actifs                  |
| Droite 1 | **Bouton action primaire** | OUI                        | "New Lead", "Create Tenant", etc.          |
| Droite 2 | **Density toggle**         | OUI                        | compact / normal / comfortable             |
| Droite 3 | **Expand toggle**          | OPTIONNEL                  | Seulement si renderExpandedRow fourni      |
| Droite 4 | **Export CSV**             | OUI                        | Via `exportTableToCSV`                     |
| Droite 5 | **Export Excel**           | OUI                        | Via `exportTableToExcel`                   |
| Droite 6 | **Column visibility**      | OPTIONNEL                  | DataTableViewOptions                       |

**Élément ABSENT actuellement dans Admin :** Global search (écart #11).

### D.4 — Position colonne actions

**Standard :** Colonne `"actions"` = DERNIÈRE colonne, **pinned right** (sticky).

```
Configuration requise dans le hook :
- columnPinning initial : { right: ["actions"] }
- Colonne actions : enableSorting: false, enableHiding: false, enablePinning: false, size: 40
```

**C'est déjà presque le cas.** Il manque uniquement le pinning right dans les hooks Admin.

### D.5 — Fonctionnalités minimales obligatoires

Toute DataTable FleetCore DOIT avoir :

| #   | Fonctionnalité      | Composant                              | Statut Lead     | Statut Admin    |
| --- | ------------------- | -------------------------------------- | --------------- | --------------- |
| 1   | Global search       | Input dans toolbar                     | ✅              | ❌ MANQUANT     |
| 2   | Faceted filters     | DataTableToolbarFilter                 | ✅              | ✅ (limité)     |
| 3   | Sorting             | Server ou client                       | ✅ Server       | ✅ Client       |
| 4   | Pagination          | DataTablePagination                    | ✅              | ✅              |
| 5   | Row selection       | Checkbox column                        | ✅              | ✅              |
| 6   | Bulk actions        | DataTableBulkActions ou BulkActionsBar | ✅              | ✅              |
| 7   | Export CSV          | exportTableToCSV                       | ✅              | ✅              |
| 8   | Export Excel        | exportTableToExcel                     | ✅              | ✅              |
| 9   | Density toggle      | DataTableDensityToggle                 | ✅              | ✅              |
| 10  | Actions column      | DropdownMenu, last, pinned right       | ✅ (pas pinned) | ✅ (pas pinned) |
| 11  | Empty state         | EmptyState avec icon + action          | ❌ MANQUANT     | ✅              |
| 12  | Loading skeleton    | DataTableSkeleton                      | ❌ MANQUANT     | ✅              |
| 13  | Delete confirmation | AlertDialog                            | ✅              | ✅              |
| 14  | Table preferences   | useTablePreferences (localStorage)     | ✅              | ✅              |

### D.6 — Priorité des corrections

| Priorité | Correction                                                           | Impact                                                 | Effort |
| -------- | -------------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| P1       | Ajouter global search aux 3 tables Admin                             | UX critique — impossible de chercher un member par nom | Faible |
| P2       | Migrer hooks Admin vers `useDataTable`                               | Supprime ~360 lignes de boilerplate, ajoute URL state  | Moyen  |
| P3       | Ajouter pinning right sur colonne actions (toutes tables)            | UX Lead Pipeline — actions inaccessibles sans scroll   | Faible |
| P4       | Uniformiser bulk actions UI (BulkActionsBar vs DataTableBulkActions) | Cohérence visuelle                                     | Moyen  |
| P5       | Ajouter empty state au Lead Pipeline                                 | Complétude                                             | Faible |
| P6       | Ajouter loading skeleton au Lead Pipeline                            | Complétude                                             | Faible |
| P7       | Ajouter expanded row content aux Admin tables ou retirer le toggle   | UX — le toggle expand est activable mais ne fait rien  | Faible |

---

## ANNEXE — Fichiers sources analysés

### Lead Pipeline

| Fichier  | Chemin                                                   |
| -------- | -------------------------------------------------------- |
| Page     | `features/crm/leads/components/leads-list-page.tsx`      |
| Colonnes | `features/crm/leads/components/lead-columns.tsx`         |
| Hook     | `features/crm/leads/hooks/use-leads-table.ts`            |
| Types    | `features/crm/leads/types/lead.types.ts`                 |
| Sidebar  | `features/crm/leads/components/leads-filter-sidebar.tsx` |
| Create   | `features/crm/leads/components/leads-create-dialog.tsx`  |
| Edit     | `features/crm/leads/components/leads-edit-drawer.tsx`    |
| Expanded | `features/crm/leads/components/lead-expanded-row.tsx`    |
| Bulk     | `components/crm/leads/BulkActionsBar.tsx`                |

### Admin — Tenants

| Fichier  | Chemin                                               |
| -------- | ---------------------------------------------------- |
| Page     | `features/settings/components/tenants-list-page.tsx` |
| Colonnes | `features/settings/components/tenants-columns.tsx`   |
| Hook     | `features/settings/hooks/use-tenants-table.ts`       |
| Types    | `features/settings/types/tenant.types.ts`            |

### Admin — Members

| Fichier  | Chemin                                               |
| -------- | ---------------------------------------------------- |
| Page     | `features/settings/components/members-list-page.tsx` |
| Colonnes | `features/settings/components/members-columns.tsx`   |
| Hook     | `features/settings/hooks/use-members-table.ts`       |
| Types    | `features/settings/types/member.types.ts`            |

### Admin — Invitations

| Fichier  | Chemin                                                   |
| -------- | -------------------------------------------------------- |
| Page     | `features/settings/components/invitations-list-page.tsx` |
| Colonnes | `features/settings/components/invitations-columns.tsx`   |
| Hook     | `features/settings/hooks/use-invitations-table.ts`       |
| Types    | `features/settings/types/invitation.types.ts`            |

### Shared UI Components

| Fichier       | Chemin                                              |
| ------------- | --------------------------------------------------- |
| DataTable     | `components/ui/table/data-table.tsx`                |
| Toolbar       | `components/ui/table/data-table-toolbar.tsx`        |
| Pagination    | `components/ui/table/data-table-pagination.tsx`     |
| Skeleton      | `components/ui/table/data-table-skeleton.tsx`       |
| Density       | `components/ui/table/data-table-density-toggle.tsx` |
| Expand        | `components/ui/table/data-table-expand-toggle.tsx`  |
| Bulk Actions  | `components/ui/table/data-table-bulk-actions.tsx`   |
| Column Header | `components/ui/table/data-table-column-header.tsx`  |
| View Options  | `components/ui/table/data-table-view-options.tsx`   |
| Export utils  | `lib/utils/table-export`                            |

### Reference Repos

| Repo         | Chemin                                                  |
| ------------ | ------------------------------------------------------- |
| Kiranism     | `/Users/mohamedfodil/Documents/references/kiranism/`    |
| shadcn UIKIT | `/Users/mohamedfodil/Documents/references/shadcnuikit/` |

---

_Audit terminé. ZÉRO fichier modifié. Lecture seule._
