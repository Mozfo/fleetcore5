# INVENTAIRE ARCHITECTURE UI — DETTE-V4A

**Date** : 2026-03-04
**Commit de reference** : `fad3a5e` (main)
**Objectif** : Cartographier les 2 systemes UI paralleles pour preparer l'unification

---

## VUE D'ENSEMBLE

```
ANCIEN  (components/crm/leads/) : 56 fichiers — 16,441 lignes — 12 actifs, 44 morts
NOUVEAU (features/crm/leads/)   : 16 fichiers —  5,251 lignes — 16 actifs

Dependance : NOUVEAU → ANCIEN (one-way, jamais l'inverse)
Couplage   : 8 imports cross-system (features/ importe depuis components/)
Circularite: ZERO import circulaire
```

---

## SECTION 1 — ANCIEN SYSTEME (`components/crm/leads/`)

### Statistiques

| Metrique                              | Valeur              |
| ------------------------------------- | ------------------- |
| Total fichiers                        | 56 (55 .tsx, 1 .ts) |
| Total lignes                          | 16,441              |
| Fichiers actifs (importes externally) | 12                  |
| Fichiers morts (internes uniquement)  | 44                  |
| Code mort                             | 13,158 lignes (80%) |

### Fichiers ACTIFS (importes par d'autres modules)

| Fichier                       | Lignes | Importe par                        |
| ----------------------------- | ------ | ---------------------------------- |
| LeadDrawer.tsx                | 572    | features/.../leads-kanban-page.tsx |
| LeadDetailPage.tsx            | 269    | app/.../crm/leads/[id]/page.tsx    |
| LeadsBrowserClient.tsx        | 645    | app/.../crm/leads/browser/page.tsx |
| LeadsReportsClient.tsx        | 172    | app/.../crm/leads/reports/page.tsx |
| LeadContextMenu.tsx           | 184    | features/.../leads-kanban-card.tsx |
| BulkActionsBar.tsx            | 122    | features/.../leads-list-page.tsx   |
| ViewToggle.tsx                | 61     | features/.../leads-view-router.tsx |
| LeadsFilterBar.tsx            | 227    | lib/types/views.ts (type import)   |
| DragCompleteProfileDialog.tsx | 198    | features/.../leads-kanban-page.tsx |
| DragQualifyDialog.tsx         | 382    | features/.../leads-kanban-page.tsx |
| DragNurturingDialog.tsx       | 117    | features/.../leads-kanban-page.tsx |
| DragDisqualifyDialog.tsx      | 202    | features/.../leads-kanban-page.tsx |

**Total actif** : 3,283 lignes (20%)

### Fichiers MORTS (44 fichiers — 13,158 lignes)

#### Gros composants (>400 lignes)

| Fichier                       | Lignes | Role                                             |
| ----------------------------- | ------ | ------------------------------------------------ |
| LeadBantSection.tsx           | 815    | Section BANT (importe par LeadDrawer en interne) |
| LeadDrawerSections.tsx        | 786    | Sections contact/company/location du drawer      |
| LeadsTableRow.tsx             | 775    | Ligne de tableau (OLD table)                     |
| LeadFormModal.tsx             | 761    | Modal formulaire lead complet                    |
| LeadsTable.tsx                | 667    | Vue tableau (OLD)                                |
| LeadDetailCards.tsx           | 570    | Grille de cartes detail                          |
| LeadWorkspaceDialog.tsx       | 475    | Dialog workspace (remplace par LeadDrawer)       |
| LeadStatusActions.tsx         | 432    | Boutons d'action statut                          |
| LeadDetailHeader.tsx          | 392    | Header page detail                               |
| AddActivityModal.tsx          | 349    | Modal ajout activite                             |
| ConvertToOpportunityModal.tsx | 351    | Modal conversion en opportunite                  |
| reports/ReportsTable.tsx      | 356    | Table du module reports                          |
| reports/QuickSearch.tsx       | 339    | Recherche module reports                         |

#### Moyens composants (100-400 lignes)

| Fichier                      | Lignes |
| ---------------------------- | ------ |
| AdvancedFilters.tsx          | 300    |
| StatusChangeReasonModal.tsx  | 290    |
| LeadQuoteSection.tsx         | 280    |
| PaymentLinkSection.tsx       | 273    |
| LeadSearchCommand.tsx        | 261    |
| KanbanPhaseColumn.tsx        | 258    |
| LeadTimeline.tsx             | 254    |
| KanbanCard.tsx               | 251    |
| DeleteLeadModal.tsx          | 247    |
| reports/ChartSection.tsx     | 243    |
| SavedViews.tsx               | 244    |
| DisqualifyLeadModal.tsx      | 237    |
| ColumnSelector.tsx           | 205    |
| GeneratePaymentLinkModal.tsx | 305    |
| KanbanPhaseBoard.tsx         | 188    |
| KanbanBoard.tsx              | 186    |
| InlineActivityForm.tsx       | 184    |
| LeadDrawerHeader.tsx         | 177    |
| SaveViewModal.tsx            | 174    |
| reports/StatsCards.tsx       | 172    |
| ActivityItem.tsx             | 160    |
| reports/ExportButton.tsx     | 153    |
| FilterRow.tsx                | 252    |
| BulkAssignModal.tsx          | 134    |
| KanbanColumn.tsx             | 131    |
| reports/ColdLeadsFilter.tsx  | 127    |
| BulkStatusModal.tsx          | 124    |
| BulkDeleteModal.tsx          | 123    |
| TablePagination.tsx          | 123    |
| EmptyColumn.tsx              | 115    |

#### Petits composants (<100 lignes)

| Fichier              | Lignes |
| -------------------- | ------ |
| LeadCardSkeleton.tsx | 51     |

**Note** : "Mort" signifie **pas importe en dehors de `components/crm/leads/`**. Certains sont utilises en interne par les 12 fichiers actifs (ex: LeadBantSection est rendu par LeadDrawer, LeadDrawerSections est rendu par LeadDrawer). Ce sont des dependances internes de la facade — morts du point de vue du systeme global, mais vivants via composition interne.

---

## SECTION 2 — NOUVEAU SYSTEME (`features/crm/leads/`)

### Statistiques

| Metrique            | Valeur      |
| ------------------- | ----------- |
| Total fichiers      | 16          |
| Total lignes        | 5,251       |
| Components          | 10 fichiers |
| Hooks               | 3 fichiers  |
| Types/schemas/utils | 3 fichiers  |

### Inventaire complet

| Fichier                    | Lignes | Role                                    | Imports depuis components/crm/ |
| -------------------------- | ------ | --------------------------------------- | ------------------------------ |
| **Components**             |        |                                         |                                |
| lead-columns.tsx           | 1,220  | Definitions colonnes DataTable          | Aucun (types seulement)        |
| leads-list-page.tsx        | 619    | Page vue liste (DataTable)              | BulkActionsBar                 |
| leads-create-dialog.tsx    | 530    | Dialog creation lead                    | Aucun                          |
| leads-filter-sidebar.tsx   | 525    | Sidebar filtres (partagee kanban/liste) | Aucun                          |
| leads-edit-drawer.tsx      | 600    | Drawer d'edition (Sheet)                | Aucun                          |
| leads-kanban-board.tsx     | 242    | Board kanban (DnD + outcomes)           | Aucun                          |
| leads-kanban-page.tsx      | 220    | Page kanban (orchestration)             | LeadDrawer + 4 DragDialogs     |
| leads-kanban-card.tsx      | 163    | Card kanban                             | LeadContextMenu                |
| leads-view-router.tsx      | 124    | Routeur kanban/liste                    | ViewToggle                     |
| lead-expanded-row.tsx      | 77     | Ligne expandee dans la table            | Aucun                          |
| **Hooks**                  |        |                                         |                                |
| use-leads-kanban.ts        | 286    | Hook kanban (Refine useList)            | Aucun                          |
| use-leads-table.ts         | 332    | Hook table (Refine useList)             | Aucun                          |
| use-sidebar-filter-data.ts | 73     | Hook donnees filtres sidebar            | Aucun                          |
| **Types/Schemas/Utils**    |        |                                         |                                |
| lead.types.ts              | 18     | Re-export types Lead                    | Aucun                          |
| lead.schema.ts             | 30     | Schema Zod formulaire                   | Aucun                          |
| lead-insight.ts            | 205    | Utilitaire calcul insights              | Aucun                          |

### Dependances cross-system (8 imports)

```
features/.../leads-kanban-page.tsx
  └─ components/crm/leads/LeadDrawer.tsx
  └─ components/crm/leads/drag-dialogs/DragCompleteProfileDialog.tsx
  └─ components/crm/leads/drag-dialogs/DragQualifyDialog.tsx
  └─ components/crm/leads/drag-dialogs/DragNurturingDialog.tsx
  └─ components/crm/leads/drag-dialogs/DragDisqualifyDialog.tsx

features/.../leads-kanban-card.tsx
  └─ components/crm/leads/LeadContextMenu.tsx

features/.../leads-list-page.tsx
  └─ components/crm/leads/BulkActionsBar.tsx

features/.../leads-view-router.tsx
  └─ components/crm/leads/ViewToggle.tsx
```

---

## SECTION 3 — ROUTAGE (Pages → Systemes)

| Route                   | Page Component          | Systeme           | Data Fetching               |
| ----------------------- | ----------------------- | ----------------- | --------------------------- |
| `/crm`                  | CrmDashboardPage        | features/ (NEW)   | Server Component            |
| `/crm/leads`            | LeadsViewRouter         | features/ (NEW)   | Refine useList (client)     |
| `/crm/leads/[id]`       | LeadDetailPage          | components/ (OLD) | Server Prisma (raw SQL CTE) |
| `/crm/leads/browser`    | LeadsBrowserClient      | components/ (OLD) | Server Prisma (Promise.all) |
| `/crm/leads/reports`    | LeadsReportsClient      | components/ (OLD) | Client-side fetch           |
| `/crm/leads/directory`  | Redirect                | —                 | Redirect vers /reports      |
| `/crm/opportunities`    | OpportunitiesPageClient | components/ (OLD) | Server Prisma + filtres     |
| `/crm/quotes`           | QuotesPageClient        | components/ (OLD) | Server Actions              |
| `/crm/quotes/[id]`      | QuoteDetailClient       | components/ (OLD) | Server Actions              |
| `/crm/quotes/[id]/edit` | QuoteForm               | components/ (OLD) | Server Actions + Prisma     |
| `/crm/quotes/new`       | QuoteForm               | components/ (OLD) | Server Prisma               |

**Bilan** : 2 routes NEW (dashboard + leads kanban/liste), 8 routes OLD, 1 redirect

---

## SECTION 4 — COMPOSANTS PARTAGES

Les 8 composants importes par features/ depuis components/ forment le **pont entre les 2 systemes** :

| Composant                 | Taille | Complexite                                | Difficulte de migration |
| ------------------------- | ------ | ----------------------------------------- | ----------------------- |
| LeadDrawer                | 572 L  | Haute (useOne, edit mode, BANT, sections) | DIFFICILE               |
| DragCompleteProfileDialog | 198 L  | Moyenne (formulaire + API)                | FACILE                  |
| DragQualifyDialog         | 382 L  | Haute (BANT selects + logique branch)     | MOYEN                   |
| DragNurturingDialog       | 117 L  | Basse (textarea + API)                    | FACILE                  |
| DragDisqualifyDialog      | 202 L  | Moyenne (raisons + blacklist)             | FACILE                  |
| LeadContextMenu           | 184 L  | Basse (menu items)                        | FACILE                  |
| BulkActionsBar            | 122 L  | Basse (boutons bulk)                      | FACILE                  |
| ViewToggle                | 61 L   | Triviale (2 boutons)                      | TRIVIAL                 |

---

## SECTION 5 — PATTERNS DATA FETCHING

### Pattern 1 : Refine Hooks (useList/useOne/useUpdate)

**Utilise par** : features/crm/leads/ (kanban + table + drawer)

| Hook             | Fichier             | Endpoint                             | Pagination  | Cache                        |
| ---------------- | ------------------- | ------------------------------------ | ----------- | ---------------------------- |
| useList (kanban) | use-leads-kanban.ts | GET /api/v1/crm/leads?fields=...     | OFF (all)   | TanStack Query + 60s refetch |
| useList (table)  | use-leads-table.ts  | GET /api/v1/crm/leads?page=X&limit=Y | Server-side | TanStack Query               |
| useOne (drawer)  | LeadDrawer.tsx      | GET /api/v1/crm/leads/{id}           | N/A         | TanStack Query               |

**Mutations** : qualifyLead(), patchLeadStatus(), disqualifyLead() via data provider + Server Actions

### Pattern 2 : Direct fetch/fetchApi

**Utilise par** : leads-list-page.tsx (bulk ops), composants OLD

| Operation     | Fichier             | Methode                   |
| ------------- | ------------------- | ------------------------- |
| Bulk assign   | leads-list-page.tsx | PATCH Promise.allSettled  |
| Bulk delete   | leads-list-page.tsx | DELETE Promise.allSettled |
| Bulk status   | leads-list-page.tsx | PATCH Promise.allSettled  |
| Single delete | leads-list-page.tsx | DELETE fetch              |
| Members list  | leads-list-page.tsx | GET fetch                 |

### Pattern 3 : Server Component + Prisma

**Utilise par** : pages OLD uniquement

| Page               | Strategie                         | Caching             |
| ------------------ | --------------------------------- | ------------------- |
| /crm/leads/[id]    | Raw SQL CTE (lead + nav + joins)  | Aucun (per-request) |
| /crm/leads/browser | Prisma findMany (Promise.all)     | Aucun               |
| /crm/opportunities | Prisma findMany + filtres         | Aucun               |
| /crm/quotes/\*     | Server Actions (listQuotesAction) | Aucun               |

**Owners list** : `unstable_cache()` revalidate 300s (seul element cache)

---

## SECTION 6 — STRATEGIE DE MIGRATION RECOMMANDEE

### Ordre du plus safe au plus risque

| Phase  | Action                                                                                                                            | Fichiers touches      | Risque             | Impact                                                             |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------ | ------------------------------------------------------------------ |
| **M1** | Deplacer ViewToggle, BulkActionsBar, LeadContextMenu dans features/crm/leads/components/                                          | 3 fichiers (< 370 L)  | ZERO               | Supprime 3 imports cross-system                                    |
| **M2** | Deplacer les 4 DragDialogs dans features/crm/leads/components/drag-dialogs/                                                       | 4 fichiers (< 900 L)  | ZERO               | Supprime 4 imports cross-system                                    |
| **M3** | Deplacer LeadDrawer dans features/crm/leads/ (+ ses dependances internes : LeadBantSection, LeadDrawerSections, LeadDrawerHeader) | ~2,400 L              | MOYEN              | Supprime le dernier import cross-system. Couplage interne a gerer. |
| **M4** | Migrer /crm/leads/[id] (LeadDetailPage) vers features/ avec Refine useOne                                                         | ~1,200 L              | MOYEN              | Elimine le Pattern 3 (raw SQL CTE) pour les leads                  |
| **M5** | Migrer /crm/leads/browser (LeadsBrowserClient) vers features/                                                                     | ~645 L                | MOYEN              | Page legacy, potentiellement a deprecier                           |
| **M6** | Migrer /crm/leads/reports vers features/                                                                                          | ~1,500 L (7 fichiers) | MOYEN              | Module auto-contenu                                                |
| **M7** | Supprimer les 44 fichiers morts restants dans components/crm/leads/                                                               | ~13,000 L             | ZERO (apres M1-M3) | Purge definitive                                                   |

### Prerequis avant migration

1. **Tests** : Aucun test unitaire/integration existant — chaque migration doit etre verifiee manuellement (Playwright ou navigateur)
2. **Pattern data fetching** : Decider si on unifie sur Refine useOne/useList partout (recommande) ou si on garde le hybrid
3. **Pages non-Leads** : Opportunities et Quotes sont 100% OLD — migration separee, hors scope leads

### Metriques de succes

```
AVANT migration :
  features/crm/leads/ : 5,251 lignes, 16 fichiers
  components/crm/leads/ : 16,441 lignes, 56 fichiers (dont 44 morts)
  Cross-system imports : 8

OBJECTIF post-migration :
  features/crm/leads/ : ~8,500 lignes, ~25 fichiers (tout le code actif)
  components/crm/leads/ : 0 fichiers (SUPPRIME)
  Cross-system imports : 0
```

---

_Inventaire genere le 2026-03-04. Aucun fichier modifie._
