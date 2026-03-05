# AUDIT REFERENTIEL — Code CRM vs Patterns Reference

**Date** : 2026-03-05
**Scope** : 128 fichiers .tsx frontend CRM (features/crm/ + components/crm/ + app/.../crm/ pages)
**Methode** : Comparaison fichier par fichier contre 3 repos de reference
**Resultat** : Score de conformite **6%** strict, **36%** avec derivations acceptables

---

## TABLE DES MATIERES

1. [Repos de reference](#1-repos-de-reference)
2. [Legende des classifications](#2-legende-des-classifications)
3. [features/crm/dashboard/ (13 fichiers)](#3-featurescrmdashboard--13-fichiers)
4. [features/crm/leads/ (26 fichiers)](#4-featurescrmleads--26-fichiers)
5. [components/crm/leads/ (25 fichiers)](#5-componentscrmleads--25-fichiers)
6. [components/crm/opportunities/ (15 fichiers)](#6-componentscrmopportunities--15-fichiers)
7. [components/crm/quotes/ (17 fichiers)](#7-componentscrmquotes--17-fichiers)
8. [components/crm/settings/ (8 fichiers)](#8-componentscrmsettings--8-fichiers)
9. [components/crm/shared/ (4 fichiers)](#9-componentscrmshared--4-fichiers)
10. [components/crm/layout/ (2 fichiers)](#10-componentscrmlayout--2-fichiers)
11. [CRM page.tsx + loading.tsx (18 fichiers)](#11-crm-pagetsx--loadingtsx--18-fichiers)
12. [Tableau resume global](#12-tableau-resume-global)
13. [Score de conformite](#13-score-de-conformite)
14. [Top 10 problemes transversaux](#14-top-10-problemes-transversaux)
15. [Plan de remediation CUSTOM](#15-plan-de-remediation-custom)
16. [Plan de remediation DERIVE](#16-plan-de-remediation-derive)

---

## 1. Repos de reference

| Repo                 | Chemin                                                       | Stack                      | Stats                           | Priorite   |
| -------------------- | ------------------------------------------------------------ | -------------------------- | ------------------------------- | ---------- |
| **shadcnuikit**      | `/Users/mohamedfodil/Documents/references/shadcnuikit/`      | Next.js App Router         | 69 pages, 239 composants, 98 UI | PRIORITE 1 |
| **kiranism**         | `/Users/mohamedfodil/Documents/references/kiranism/`         | Next.js App Router + Clerk | 21 pages, 66 composants, 59 UI  | PRIORITE 2 |
| **shadcn-admin-kit** | `/Users/mohamedfodil/Documents/references/shadcn-admin-kit/` | React Admin + Vite         | 15 vues, 99 composants, 29 UI   | PRIORITE 3 |

---

## 2. Legende des classifications

| Symbole  | Signification                                 | Critere                                                     |
| -------- | --------------------------------------------- | ----------------------------------------------------------- |
| CONFORME | Copie fidele du pattern reference             | Meme layout, memes CSS classes, meme structure composant    |
| DERIVE   | Base sur un pattern reference avec deviations | i18n, props dynamiques, ajout metier justifie               |
| CUSTOM   | Code custom sans pattern de reference         | Architecture proprietary, aucun equivalent dans les 3 repos |
| METIER   | Logique metier pure FleetCore                 | Pas de pattern UI applicable, classification non pertinente |
| MORT     | Fichier jamais importe / orphelin             | Zero consommateur actif dans l'app                          |

---

## 3. features/crm/dashboard/ — 13 fichiers

| Fichier                            | Lignes | Role                                  | Pattern reference                 | Class. | Deviations                                                                                          |
| ---------------------------------- | ------ | ------------------------------------- | --------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| `crm-dashboard-page.tsx`           | 123    | Orchestrateur page dashboard          | SK `crm/page.tsx`                 | DERIVE | +description sous h1, rows supplementaires, DashboardSkeleton custom, pas de PageContainer kiranism |
| `date-range-picker.tsx`            | 197    | Selecteur plage de dates avec presets | SK `custom-date-range-picker.tsx` | DERIVE | Controlled (value/onChange) vs uncontrolled ref, presets i18n, type-safe PRESET_KEYS                |
| `widgets/total-leads-card.tsx`     | 42     | KPI card total leads + trend          | SK `total-customers.tsx`          | DERIVE | +useTranslation, trend dynamique vs hardcode                                                        |
| `widgets/conversion-rate-card.tsx` | 47     | KPI card taux conversion + trend      | SK `total-deals.tsx`              | DERIVE | +i18n, icone differente                                                                             |
| `widgets/pipeline-value-card.tsx`  | 41     | KPI card leads actifs pipeline        | SK `total-revenue.tsx`            | DERIVE | +i18n, affiche nb leads (pas valeur monetaire)                                                      |
| `widgets/target-card.tsx`          | 98     | KPI card progression RadialBarChart   | SK `target-card.tsx`              | DERIVE | +i18n, endAngle variable vs fixe, chartData dynamique                                               |
| `widgets/time-to-convert-card.tsx` | 36     | KPI card delai conversion             | AUCUN                             | CUSTOM | Widget specifique FleetCore, pas d'equivalent ref                                                   |
| `widgets/lead-by-source-card.tsx`  | 21     | Chart leads par source                | SK `leads-by-source.tsx`          | CUSTOM | PLACEHOLDER VIDE — ref a un vrai PieChart recharts                                                  |
| `widgets/sales-pipeline-card.tsx`  | 30     | Chart pipeline par statut             | SK `sales-pipeline.tsx`           | CUSTOM | PLACEHOLDER VIDE — ref a un vrai funnel Progress                                                    |
| `widgets/recent-tasks-card.tsx`    | 27     | Card taches recentes                  | SK `recent-tasks.tsx`             | CUSTOM | PLACEHOLDER VIDE — ref a liste interactive                                                          |
| `widgets/leads-over-time-card.tsx` | 23     | Chart leads dans le temps             | AUCUN                             | CUSTOM | PLACEHOLDER VIDE                                                                                    |
| `widgets/top-sources-card.tsx`     | 21     | Card top sources leads                | AUCUN                             | CUSTOM | PLACEHOLDER VIDE                                                                                    |
| `widgets/avg-score-card.tsx`       | 1      | Tombstone deprecated                  | —                                 | MORT   | Fichier zombie 1 ligne, scoring supprime                                                            |

**Resume** : CONFORME=0, DERIVE=6, CUSTOM=6, METIER=0, MORT=1
**Note** : 5 des 6 CUSTOM sont des coquilles vides (placeholder) — le contenu n'a jamais ete implemente.

---

## 4. features/crm/leads/ — 26 fichiers

| Fichier                                      | Lignes | Role                                            | Pattern reference                                                                               | Class.   | Deviations                                                                                            |
| -------------------------------------------- | ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `profile/LeadProfilePage.tsx`                | 111    | Layout page profil (titre + grille 3 col)       | SK `pages/profile/page.tsx`                                                                     | CONFORME | Tabs supprimes intentionnellement, Skeleton miroir exact                                              |
| `profile/LeadProfileCards.tsx`               | 605    | 9 cartes de profil                              | SK `profile-card.tsx` + `complete-your-profile.tsx` + `card-skills.tsx` + `latest-activity.tsx` | CONFORME | Copie quasi-exacte des 4 patterns SK pour les 4 cartes principales. 5 petites cartes = CUSTOM interne |
| `leads-detail-kpi-header.tsx`                | 148    | Bandeau 4 KPI cards                             | SK section-cards                                                                                | DERIVE   | grid gap-4 conforme, icones bg-primary/10 non present ref                                             |
| `lead-columns.tsx`                           | 1215   | Builder colonnes TanStack Table (vue operateur) | KI data-table colonnes                                                                          | DERIVE   | 50+ colonnes vs ~8 ref, Badge colores STATUS_COLOR_MAP, meta.variant multiSelect, enablePinning       |
| `lead-detail-columns.tsx`                    | 487    | Builder colonnes TanStack Table (vue manager)   | KI data-table colonnes                                                                          | DERIVE   | Sous-ensemble + 2 colonnes calculees (bant_score, days_in_status)                                     |
| `leads-list-page.tsx`                        | 632    | Orchestrateur vue table                         | KI employees/page.tsx                                                                           | DERIVE   | BulkActionsBar floating, LeadDrawer overlay, 3 dialogs bulk locaux                                    |
| `leads-kanban-page.tsx`                      | 226    | Orchestrateur vue kanban                        | KI kanban/page.tsx                                                                              | DERIVE   | 4 drag-dialogs contextuels, OutcomesBar, etat drag local                                              |
| `leads-kanban-board.tsx`                     | 241    | Board kanban avec colonnes droppables           | KI kanban-board.tsx                                                                             | DERIVE   | Primitives Kanban FleetCore (wrappers dnd-kit), DroppableOutcomeButton, header colore                 |
| `leads-kanban-card.tsx`                      | 162    | Carte kanban lead draggable                     | KI task-card.tsx                                                                                | DERIVE   | KanbanItem wrapper, LeadContextMenu, overdue ring, lead_code badge                                    |
| `leads-edit-drawer.tsx`                      | 599    | Formulaire edition lead en Sheet                | KI employees/edit-employee.tsx                                                                  | DERIVE   | COUNTRY_OPTIONS/SOURCE_OPTIONS **hardcodes** (violation CEO), formulaire duplique                     |
| `leads-create-dialog.tsx`                    | 529    | Formulaire creation lead en Dialog              | KI employees/new-employee.tsx                                                                   | DERIVE   | COUNTRY_OPTIONS/SOURCE_OPTIONS **hardcodes** (violation CEO), 4 sections                              |
| `leads-filter-sidebar.tsx`                   | 525    | Sidebar filtres URL-sync (nuqs)                 | KI employee filter sidebar                                                                      | DERIVE   | nuqs useQueryStates (ref = state local), 15+ filtres vs ~4 ref                                        |
| `leads-detail-page.tsx`                      | 612    | Page vue manager (KPI + sidebar + DataTable)    | KI employees/page.tsx                                                                           | DERIVE   | KPI header en tete, dialogs assign integres localement                                                |
| `leads-view-router.tsx`                      | 123    | Routeur mode affichage (kanban/table)           | SK layout switcher                                                                              | DERIVE   | Fallback localStorage en plus URL param                                                               |
| `drawer/LeadDrawer.tsx`                      | 572    | Workstation dialog 2-colonnes                   | AUCUN                                                                                           | CUSTOM   | Dialog sm:max-w-5xl (ref = Sheet), layout w-2/5 + w-3/5 proprietary                                   |
| `drawer/LeadDrawerHeader.tsx`                | 177    | Header drawer (avatar company, status bg)       | AUCUN                                                                                           | CUSTOM   | B2B company-first = pattern proprietary FleetCore                                                     |
| `drawer/LeadDrawerSections.tsx`              | 786    | Sections info drawer (8 sections)               | AUCUN                                                                                           | CUSTOM   | DrawerSection wrapper, EditableInfoRow edit/read duality, 786L = trop gros                            |
| `drawer/LeadBantSection.tsx`                 | 799    | Section BANT qualification                      | AUCUN                                                                                           | METIER   | State machine hidden/edit/summary/readonly, 799L = trop gros                                          |
| `drag-dialogs/DragQualifyDialog.tsx`         | 382    | Dialog qualification BANT par DnD               | AUCUN                                                                                           | METIER   | Multi-phase state machine, BANT dropdowns, confirmation                                               |
| `drag-dialogs/DragDisqualifyDialog.tsx`      | 202    | Dialog disqualification par DnD                 | AUCUN                                                                                           | METIER   | 7 raisons, commentaire, blacklist toggle                                                              |
| `drag-dialogs/DragNurturingDialog.tsx`       | 117    | Dialog nurturing par DnD                        | AUCUN                                                                                           | METIER   | Confirmation simple + note optionnelle                                                                |
| `drag-dialogs/DragCompleteProfileDialog.tsx` | 198    | Dialog collecte infos profil par DnD            | AUCUN                                                                                           | METIER   | Collecte phone/name/company/fleet_size                                                                |
| `LeadContextMenu.tsx`                        | 184    | Menu contextuel clic-droit carte kanban         | AUCUN                                                                                           | CUSTOM   | ContextMenu Radix, transitions dynamiques, actions phone/email                                        |
| `BulkActionsBar.tsx`                         | 127    | Barre actions bulk flottante                    | KI actionBar data-table                                                                         | DERIVE   | fixed bottom-6 floating vs inline ref, Framer Motion spring                                           |
| `ViewToggle.tsx`                             | 61     | Toggle kanban/table                             | SK layout switcher                                                                              | DERIVE   | Pattern standard toggle 2-etats                                                                       |
| `lead-expanded-row.tsx`                      | 76     | Ligne expandable (insights)                     | KI row expansion                                                                                | DERIVE   | Contenu computeAllLeadInsights = business logic                                                       |

**Resume** : CONFORME=2, DERIVE=15, CUSTOM=4, METIER=5, MORT=0

---

## 5. components/crm/leads/ — 25 fichiers

**Note** : 9 fichiers forment un arbre mort (~2,900L candidats a la suppression). `LeadDetailPage` et `LeadsBrowserClient` sont orphelins, et 7 fichiers ne sont importes QUE par eux.

| Fichier                          | Lignes | Role                                 | Pattern reference                   | Class. | Mort?                              | Deviations                                                                             |
| -------------------------------- | ------ | ------------------------------------ | ----------------------------------- | ------ | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `ActivityItem.tsx`               | 160    | Rendu activite CRM                   | SK timeline item                    | DERIVE | DOUBLON de shared/ActivityItem.tsx | Manque prop compact, ActivityMetadata specifique                                       |
| `AddActivityModal.tsx`           | 349    | Dialog creation activite (5 types)   | KI demo-form Dialog+RHF+Zod         | DERIVE | Non                                | Pas de Zod type-specific, setValue uncontrolled                                        |
| `ConvertToOpportunityModal.tsx`  | 351    | Dialog conversion lead → opportunity | KI alert-modal                      | DERIVE | OUI (arbre mort)                   | isEligible hardcode true, useState brut (pas RHF)                                      |
| `DeleteLeadModal.tsx`            | 247    | Dialog suppression lead              | KI alert-modal destructive          | DERIVE | Non                                | Raisons en `button` au lieu de RadioGroup, checkbox native                             |
| `DisqualifyLeadModal.tsx`        | 237    | Dialog disqualification (7 raisons)  | KI alert-modal destructive          | DERIVE | Non                                | Direct fetch() au lieu de server action                                                |
| `GeneratePaymentLinkModal.tsx`   | 305    | Dialog generation lien Stripe        | KI demo-form Dialog+RHF+Zod         | DERIVE | OUI (arbre mort)                   | Prix EUR **hardcodes** (violation CEO), select-native                                  |
| `InlineActivityForm.tsx`         | 184    | Formulaire inline compact activite   | AUCUN                               | CUSTOM | Non                                | border-l-4, 5-button toggle, Switch overrides                                          |
| `LeadDetailCards.tsx`            | 570    | Grille cards detail lead             | SK card.tsx + KI show-detail        | DERIVE | OUI (arbre mort)                   | motion.div + cardVariants Framer, EditableRow custom                                   |
| `LeadDetailHeader.tsx`           | 392    | Header page detail lead              | SK/KI page header                   | DERIVE | OUI (arbre mort)                   | Prev/next nav, LeadSearchCommand integre                                               |
| `LeadDetailPage.tsx`             | 269    | Orchestrateur page detail (ancien)   | SK detail page                      | MORT   | OUI                                | Comment: "preserved in components/ but no longer imported"                             |
| `LeadsBrowserClient.tsx`         | 645    | Split-pane master-detail             | SK master-detail                    | MORT   | OUI                                | browser/page.tsx supprime, formatRelativeTime local duplique                           |
| `LeadQuoteSection.tsx`           | 280    | Section quotes Segment 4             | AUCUN                               | METIER | OUI (arbre mort)                   | SEGMENT_4_MIN_FLEET=21 **hardcode**, Stripe logic                                      |
| `LeadSearchCommand.tsx`          | 261    | Recherche inline Cmd+K               | SK command-palette / shadcn Command | DERIVE | OUI (arbre mort)                   | `<input>` brut au lieu de shadcn Command, debounce custom                              |
| `LeadStatusActions.tsx`          | 432    | Panel actions next-steps par statut  | AUCUN                               | METIER | Non                                | State machine statut→actions, BANT-gated visibility                                    |
| `LeadTimeline.tsx`               | 254    | Timeline activites paginee           | SK timeline / KI activity-feed      | DERIVE | Non                                | useMemo date grouping, server action fetch, sticky date headers                        |
| `LeadsFilterBar.tsx`             | 227    | Barre filtre inline 40px             | SK filter-bar                       | DERIVE | Non                                | Tokens fc-\*, FilterSelect native, 14+ props inutilises (bloat)                        |
| `PaymentLinkSection.tsx`         | 273    | Section lien paiement Stripe         | AUCUN                               | METIER | OUI (arbre mort)                   | Status-gated, navigator.clipboard                                                      |
| `TablePagination.tsx`            | 123    | Pagination reutilisable              | SK data-table-pagination            | DERIVE | Non                                | select-native au lieu de shadcn Select, manque first/last page                         |
| `reports/ChartSection.tsx`       | 243    | 3 charts recharts (pie, line, bar)   | KI chart components                 | DERIVE | Non                                | Hex colors STATUS_COLORS **hardcodes** (violation CEO), pas de Card wrapper            |
| `reports/ColdLeadsFilter.tsx`    | 127    | Toggle + mois pour leads froids      | AUCUN                               | METIER | Non                                | Concept "cold leads" FleetCore, bg-cyan-\* **hardcode**                                |
| `reports/ExportButton.tsx`       | 153    | Dropdown export CSV/JSON             | shadcn-admin-kit export-button      | DERIVE | Non                                | Dropdown custom (div + backdrop) vs DropdownMenu, catch vide                           |
| `reports/LeadsReportsClient.tsx` | 172    | Orchestrateur page reports           | SK dashboard / KI overview          | DERIVE | Non                                | dynamic() pour ChartSection, inline stats fetch, catch silencieux                      |
| `reports/QuickSearch.tsx`        | 339    | Barre recherche pleine largeur       | SK search-command                   | DERIVE | Non                                | `<input>` brut, debounce DUPLIQUE de LeadSearchCommand, getStatusColor() DUPLIQUE      |
| `reports/ReportsTable.tsx`       | 356    | Table rapports paginee               | shadcn-admin-kit data-table         | DERIVE | Non                                | `<table>` HTML brut (pas shadcn Table), getStatusColor() DUPLIQUE, pas de tri colonnes |
| `reports/StatsCards.tsx`         | 172    | 4 KPI cards reports                  | KI stat cards                       | DERIVE | Non                                | Pas de shadcn Card wrapper (div border), iconColor/bgColor **hardcodes**               |

**Resume** : CONFORME=0, DERIVE=16, CUSTOM=1, METIER=4, MORT=4
**Arbre mort** : LeadDetailPage + LeadsBrowserClient + 7 fichiers dependants = 9 fichiers, ~2,900 lignes a supprimer

---

## 6. components/crm/opportunities/ — 15 fichiers

| Fichier                         | Lignes | Role                               | Pattern reference         | Class. | Deviations                                                                                   |
| ------------------------------- | ------ | ---------------------------------- | ------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `KanbanCardSkeleton.tsx`        | 37     | Skeleton carte kanban              | AUCUN                     | CUSTOM | gray-200/800 hardcodes                                                                       |
| `KanbanBoard.tsx`               | 161    | Orchestrateur kanban DnD           | SK kanban-board           | DERIVE | +DragOverlay, +AnimatePresence, grid-cols-5 hardcode                                         |
| `KanbanCard.tsx`                | 203    | Carte draggable memo               | SK kanban card            | DERIVE | Tokens fc-\*, FCBadge rotting alert, memo custom                                             |
| `KanbanColumn.tsx`              | 141    | Colonne droppable scrollable       | SK kanban column          | DERIVE | Tokens fc-\*, compteur leads, value badges                                                   |
| `OpportunitiesFilterBar.tsx`    | 213    | Barre filtre inline 40px           | AUCUN (ref interne leads) | CUSTOM | FilterSelect native, tokens fc-\*, namespace i18n **leads.filters** au lieu de opportunities |
| `OpportunitiesTable.tsx`        | 680    | Table resizable + sortable         | AUCUN                     | CUSTOM | ResizableTableHead custom mouse-drag, SortableTableHead, tableLayout fixed inline            |
| `OpportunitiesTableRow.tsx`     | 780    | Row avec cellRenderers dict        | AUCUN                     | CUSTOM | cellRenderers pattern FleetCore, click-delay 250ms, helpers couleur inline                   |
| `OpportunityColumnSelector.tsx` | 207    | Popover reorder colonnes dnd-kit   | AUCUN                     | CUSTOM | @dnd-kit/sortable, namespace i18n **leads.table** au lieu de opportunities                   |
| `OpportunityContextMenu.tsx`    | 192    | Menu contextuel clic-droit         | AUCUN                     | CUSTOM | MARK_WON_ALLOWED_STAGES hardcode                                                             |
| `OpportunityDrawerHeader.tsx`   | 240    | Header drawer B2B                  | AUCUN                     | METIER | Gradient avatar, STAGE_COLOR_CLASSES raw Tailwind                                            |
| `OpportunityDrawer.tsx`         | 947    | Sheet drawer read/edit 2-col       | AUCUN                     | CUSTOM | 947L!, DrawerSkeleton/Section dupliques, VisuallyHidden                                      |
| `MarkAsWonModal.tsx`            | 393    | Modal Quote-to-Cash contrat Won    | AUCUN                     | METIER | Business logic pure (billing, duration, auto-renew)                                          |
| `MarkAsLostModal.tsx`           | 273    | Modal capture perte (raison+notes) | AUCUN                     | METIER | 20-char min notes, loss reasons dynamiques                                                   |
| `OpportunityFormModal.tsx`      | 538    | Modal creation/edition opportunity | shadcn Dialog+form        | DERIVE | Lead search debounce, auto-name, select-native, pas de Zod/RHF                               |
| `OpportunitiesPageClient.tsx`   | 713    | Orchestrateur top-level            | AUCUN                     | CUSTOM | 8+ state slices, FCPageHeader/FCStatCard/ViewToggle                                          |

**Resume** : CONFORME=0, DERIVE=4, CUSTOM=8, METIER=3, MORT=0

---

## 7. components/crm/quotes/ — 17 fichiers

| Fichier                   | Lignes | Role                                    | Pattern reference                | Class. | Deviations                                                     |
| ------------------------- | ------ | --------------------------------------- | -------------------------------- | ------ | -------------------------------------------------------------- |
| `QuoteStatusBadge.tsx`    | 105    | Badge statut + icone + couleur          | AUCUN                            | CUSTOM | STATUS_CONFIG record 7 statuts, 2 variants taille              |
| `QuotesFilterBar.tsx`     | 162    | Barre filtre 40px + range valeur        | OpportunitiesFilterBar (interne) | DERIVE | Copie structurelle + min_value/max_value                       |
| `QuotesKanbanBoard.tsx`   | 53     | Kanban horizontal scroll (pas DnD)      | SK kanban-board (partiel)        | DERIVE | Pas de DndContext/DragOverlay, 7 colonnes statiques            |
| `QuotesKanbanColumn.tsx`  | 108    | Colonne fixe non-droppable              | KanbanColumn (interne)           | DERIVE | w-72 fixe, pas de useDroppable, STATUS_PILL_COLOR fc-\*        |
| `QuotesKanbanCard.tsx`    | 172    | Carte kanban statique + dropdown        | KanbanCard (interne)             | DERIVE | Pas draggable, DropdownMenu vs ContextMenu, date-fns           |
| `QuotesTable.tsx`         | 117    | Table simple                            | OpportunitiesTable (degrade)     | DERIVE | `<table>` HTML brut (pas shadcn Table = regression)            |
| `QuotesTableRow.tsx`      | 432    | Row avec cellRenderers dict             | OpportunitiesTableRow (interne)  | DERIVE | company_name toujours "—" (bug connu)                          |
| `QuoteColumnSelector.tsx` | 196    | Popover reorder colonnes HTML5 DnD      | OpportunityColumnSelector        | CUSTOM | HTML5 native DnD (pas dnd-kit = inconsistance)                 |
| `QuoteCalculations.tsx`   | 263    | Panel calcul financier temps-reel       | AUCUN                            | METIER | Calculs subtotal/discount/tax/recurring purs                   |
| `QuoteItemsEditor.tsx`    | 452    | Editeur lignes CRUD toggle edit/display | AUCUN                            | CUSTOM | Pas de DnD reorder, up/down boutons, edit state par item       |
| `QuoteForm.tsx`           | 692    | Formulaire complet RHF+Zod multi-card   | shadcn form+card (partiel)       | CUSTOM | 6 sections card, sticky right-column, QuoteItemsEditor integre |
| `QuoteDrawer.tsx`         | 581    | Sheet drawer read-only detail           | OpportunityDrawer (interne)      | DERIVE | Read-only seul, DrawerSkeleton/Section **dupliques**           |
| `QuoteDetailClient.tsx`   | 618    | Page detail full (2/3+1/3 grid)         | AUCUN                            | CUSTOM | mx-auto max-w-5xl, pas de drawer = full page                   |
| `SendQuoteModal.tsx`      | 151    | Modal confirmation envoi devis          | shadcn Dialog confirmation       | DERIVE | Summary + warning list + "what happens"                        |
| `ConvertToOrderModal.tsx` | 251    | Modal conversion Quote→Order            | AUCUN                            | METIER | Business rule effective date, summary card                     |
| `DeleteQuoteModal.tsx`    | 141    | Dialog suppression destructive          | shadcn AlertDialog               | DERIVE | Red-themed, AlertTriangle, standard 2 boutons                  |
| `QuotesPageClient.tsx`    | 483    | Orchestrateur top-level                 | AUCUN                            | CUSTOM | EUR **hardcode** dans formatCurrency (violation CEO)           |

**Resume** : CONFORME=0, DERIVE=9, CUSTOM=6, METIER=2, MORT=0

---

## 8. components/crm/settings/ — 8 fichiers

| Fichier                        | Lignes | Role                                       | Pattern reference         | Class. | Deviations                                                                      |
| ------------------------------ | ------ | ------------------------------------------ | ------------------------- | ------ | ------------------------------------------------------------------------------- |
| `CrmSettingsPageClient.tsx`    | 207    | Shell tabs settings URL-sync               | KI settings-with-tabs     | DERIVE | grid-cols-7 TabsList, Lock icon disabled tabs, FCPageHeader                     |
| `PipelineSettingsTab.tsx`      | 777    | Editeur etapes pipeline dnd-kit sortable   | KI kanban board (dnd-kit) | DERIVE | verticalListSortingStrategy, color picker brut, form uncontrolled (pas RHF+Zod) |
| `DealRottingSettings.tsx`      | 367    | Config deal rotting                        | AUCUN                     | METIER | Logique CRM pure (threshold, alert toggles, cron)                               |
| `LossReasonEditor.tsx`         | 393    | Dialog ajout/edition loss reason bilingue  | shadcn Dialog+form        | METIER | Bilingual EN/FR, category, recovery options                                     |
| `LossReasonsList.tsx`          | 267    | Accordion liste loss reasons par categorie | shadcn Collapsible        | METIER | Groupement par categorie, hover-reveal actions                                  |
| `LossReasonsSettingsTab.tsx`   | 394    | Container tab loss reasons + recovery      | AUCUN                     | METIER | Orchestrateur fetch() direct, optimistic local state                            |
| `PipelinePreview.tsx`          | 173    | Preview pipeline horizontal read-only      | AUCUN                     | METIER | Diagramme flux visuel custom, overflow-x-auto                                   |
| `RecoveryWorkflowSettings.tsx` | 292    | Config recovery workflow                   | AUCUN                     | METIER | Card+Switch+Input, auto-followup/reminder/reopen                                |

**Resume** : CONFORME=0, DERIVE=2, CUSTOM=0, METIER=6, MORT=0

---

## 9. components/crm/shared/ — 4 fichiers

| Fichier                   | Lignes | Role                                      | Pattern reference           | Class.   | Deviations                                                                                      |
| ------------------------- | ------ | ----------------------------------------- | --------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `InfoRow.tsx`             | 84     | Ligne label+valeur + ghost icon actions   | SK ProfileSidebar info row  | CONFORME | text-muted-foreground text-xs label, text-sm font-medium value, h-7 w-7 ghost buttons           |
| `ActivityItem.tsx`        | 205    | Rendu activite (8 types, compact mode)    | SK ActivityStream items     | DERIVE   | Pas de Timeline/TimelineItem primitives, flex gap-3 manuel, 8 types vs ~3 ref                   |
| `ActivityTimeline.tsx`    | 289    | Timeline polymorphe (leads/opportunities) | SK ActivityStream in Card   | DERIVE   | Pas de composant Timeline UI, grouped-by-date custom, server action fetch, load-more pagination |
| `CreateActivityModal.tsx` | 306    | Dialog creation activite RHF+Zod          | KI demo-form Dialog+RHF+Zod | DERIVE   | Button tab pills vs Select, select-native vs Radix Select, pas de Form/FormField wrappers       |

**Resume** : CONFORME=1, DERIVE=3, CUSTOM=0, METIER=0, MORT=0

---

## 10. components/crm/layout/ — 2 fichiers

| Fichier          | Lignes | Role                         | Pattern reference | Class. | Mort? | Deviations                                                    |
| ---------------- | ------ | ---------------------------- | ----------------- | ------ | ----- | ------------------------------------------------------------- |
| `CrmSidebar.tsx` | 240    | Sidebar navigation CRM       | KI AppSidebar     | MORT   | OUI   | Zero imports — l'app utilise AppSidebar de components/layout/ |
| `CrmTopBar.tsx`  | 38     | Header minimal Bell+UserMenu | KI Header         | MORT   | OUI   | Zero imports — l'app utilise SiteHeader de components/layout/ |

**Resume** : CONFORME=0, DERIVE=0, CUSTOM=0, METIER=0, MORT=2
**Action** : 278 lignes a supprimer.

---

## 11. CRM page.tsx + loading.tsx — 18 fichiers

| Fichier                           | Lignes | Role                          | Imports depuis  | Class.   | Notes                                                                       |
| --------------------------------- | ------ | ----------------------------- | --------------- | -------- | --------------------------------------------------------------------------- |
| `crm/page.tsx`                    | 18     | Root CRM → dashboard          | features/crm/   | DERIVE   | Auth guard dans page (devrait etre middleware), pas de PageContainer        |
| `crm/leads/page.tsx`              | 29     | Router table/kanban           | features/crm/   | DERIVE   | Auth guard dans page, wrapper div au lieu de PageContainer                  |
| `crm/leads/loading.tsx`           | 67     | Skeleton kanban 4 cols        | —               | CUSTOM   | 67L de Tailwind brut vs DataTableSkeleton 1 import (KI)                     |
| `crm/leads/[id]/page.tsx`         | 33     | Detail profil lead            | features/crm/   | CONFORME | Thin SC, UUID validation, notFound(), delegation propre                     |
| `crm/leads/[id]/loading.tsx`      | 144    | Skeleton detail 6 cards       | ui/skeleton     | DERIVE   | Utilise Skeleton (bien) mais 144L de layout custom                          |
| `crm/leads/detail/page.tsx`       | 19     | Vue manager/superviseur       | features/crm/   | CONFORME | Thin, delegation correcte, notFound()                                       |
| `crm/leads/detail/loading.tsx`    | 9      | Spinner Loader2               | lucide-react    | DERIVE   | Minimal mais inconsistant avec les autres skeletons                         |
| `crm/leads/directory/page.tsx`    | 19     | Redirect deprecated → reports | next/navigation | CONFORME | redirect() correct pour tombstone                                           |
| `crm/leads/directory/loading.tsx` | 56     | Skeleton directory            | —               | CUSTOM   | **CODE MORT** — redirect synchrone, loading jamais affiche                  |
| `crm/leads/reports/page.tsx`      | 36     | Dashboard BI reports          | components/crm/ | DERIVE   | Auth dans page, locale prop anti-pattern, migration incomplete              |
| `crm/leads/reports/loading.tsx`   | 73     | Skeleton reports              | —               | CUSTOM   | 73L Tailwind brut, pas de composant skeleton reutilisable                   |
| `crm/opportunities/page.tsx`      | 304    | Pipeline opportunities        | components/crm/ | CUSTOM   | **304L!** Prisma queries + filter parsing + business logic DANS le page.tsx |
| `crm/opportunities/loading.tsx`   | 72     | Skeleton kanban 5 cols        | —               | CUSTOM   | 72L Tailwind brut                                                           |
| `crm/quotes/page.tsx`             | 130    | Pipeline quotes               | components/crm/ | CUSTOM   | 130L, fetchAllQuotes + parseFiltersFromURL dans page.tsx                    |
| `crm/quotes/loading.tsx`          | 73     | Skeleton quotes 7 cols        | ui/skeleton     | DERIVE   | Utilise Skeleton mais 73L layout custom                                     |
| `crm/quotes/[id]/page.tsx`        | 72     | Detail quote                  | components/crm/ | DERIVE   | Inline Suspense fallback skeleton, imports components/                      |
| `crm/quotes/[id]/edit/page.tsx`   | 100    | Edition quote                 | components/crm/ | CUSTOM   | fetchOpportunities Prisma DANS le page, duplique de new/                    |
| `crm/quotes/new/page.tsx`         | 92     | Creation quote                | components/crm/ | CUSTOM   | fetchOpportunities Prisma DUPLIQUE de edit/                                 |

**Resume** : CONFORME=3, DERIVE=6, CUSTOM=9, METIER=0, MORT=0

### Statut migration features/ vs components/

| Module         | Source imports                         | Migration    |
| -------------- | -------------------------------------- | ------------ |
| crm/ root      | features/crm/dashboard/                | FAIT         |
| leads/         | features/crm/leads/                    | FAIT         |
| leads/[id]/    | features/crm/leads/components/profile/ | FAIT         |
| leads/detail/  | features/crm/leads/                    | FAIT         |
| leads/reports/ | components/crm/leads/reports/          | **PAS FAIT** |
| opportunities/ | components/crm/opportunities/          | **PAS FAIT** |
| quotes/\*      | components/crm/quotes/                 | **PAS FAIT** |

---

## 12. Tableau resume global

| Module                             | Fichiers | CONFORME | DERIVE | CUSTOM | METIER | MORT  |
| ---------------------------------- | -------- | -------- | ------ | ------ | ------ | ----- |
| features/crm/dashboard/            | 13       | 0        | 6      | 6      | 0      | 1     |
| features/crm/leads/                | 26       | 2        | 15     | 4      | 5      | 0     |
| components/crm/leads/              | 25       | 0        | 16     | 1      | 4      | 4     |
| components/crm/opportunities/      | 15       | 0        | 4      | 8      | 3      | 0     |
| components/crm/quotes/             | 17       | 0        | 9      | 6      | 2      | 0     |
| components/crm/settings/           | 8        | 0        | 2      | 0      | 6      | 0     |
| components/crm/shared/             | 4        | 1        | 3      | 0      | 0      | 0     |
| components/crm/layout/             | 2        | 0        | 0      | 0      | 0      | 2     |
| CRM pages (page.tsx + loading.tsx) | 18       | 3        | 6      | 9      | 0      | 0     |
| **TOTAL**                          | **128**  | **6**    | **61** | **34** | **20** | **7** |

---

## 13. Score de conformite

### Methode de calcul

- Base : 128 fichiers - 7 MORT - 20 METIER = **101 fichiers classifiables**
- Score strict = CONFORME / classifiables = 6 / 101 = **5.9%**
- Score elargi (CONFORME×1.0 + DERIVE×0.5) / classifiables = (6 + 30.5) / 101 = **36.1%**

### Interpretation

| Score            | Signification                                                          |
| ---------------- | ---------------------------------------------------------------------- |
| **5.9% strict**  | Quasi aucun composant n'est une copie fidele des patterns de reference |
| **36.1% elargi** | ~1/3 du code est "inspire" des references avec adaptations             |
| **33.7% CUSTOM** | 34 fichiers n'ont AUCUN equivalent dans les 3 repos de reference       |
| **19.8% METIER** | 20 fichiers sont de la logique purement metier (classification NA)     |
| **5.5% MORT**    | 7 fichiers sont du code mort a supprimer                               |

### Score par module

| Module                        | Strict | Elargi | Custom% | Verdict                 |
| ----------------------------- | ------ | ------ | ------- | ----------------------- |
| features/crm/leads/           | 9.5%   | 47.6%  | 19.0%   | Meilleur module         |
| components/crm/shared/        | 25.0%  | 62.5%  | 0.0%    | Bon (petit module)      |
| features/crm/dashboard/       | 0.0%   | 25.0%  | 50.0%   | Moyen (placeholders)    |
| components/crm/leads/         | 0.0%   | 38.1%  | 4.8%    | Code herite (migration) |
| components/crm/quotes/        | 0.0%   | 30.0%  | 40.0%   | Faible                  |
| components/crm/opportunities/ | 0.0%   | 16.7%  | 66.7%   | **Pire module**         |
| CRM pages                     | 16.7%  | 50.0%  | 50.0%   | Moyen (pages lourdes)   |

---

## 14. Top 10 problemes transversaux

| #   | Probleme                                   | Impact                                                         | Fichiers concernes                                                                                                                               |
| --- | ------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **opportunities/page.tsx = data layer**    | 304L de Prisma queries + business logic dans un page.tsx       | `opportunities/page.tsx`                                                                                                                         |
| 2   | **DrawerSkeleton/DrawerSection dupliques** | Code identique dans 2 drawers, devrait etre dans shared/       | `OpportunityDrawer.tsx`, `QuoteDrawer.tsx`                                                                                                       |
| 3   | **getStatusColor() duplique 3 fois**       | Switch identique vs `getStatusBadgeColor()` centralise         | `QuickSearch.tsx`, `ReportsTable.tsx`, `LeadsBrowserClient.tsx`                                                                                  |
| 4   | **Debounce pattern duplique**              | useRef<NodeJS.Timeout> identique, besoin d'un hook useDebounce | `LeadSearchCommand.tsx`, `QuickSearch.tsx`                                                                                                       |
| 5   | **Namespace i18n incorrects**              | Opportunities utilise `leads.table.*` et `leads.filters.*`     | `OpportunityColumnSelector.tsx`, `OpportunitiesFilterBar.tsx`                                                                                    |
| 6   | **DnD inconsistant**                       | dnd-kit pour opportunities, HTML5 DnD pour quotes              | `OpportunityColumnSelector.tsx`, `QuoteColumnSelector.tsx`                                                                                       |
| 7   | **fetchOpportunities Prisma duplique**     | Meme query dans 2 page.tsx                                     | `quotes/[id]/edit/page.tsx`, `quotes/new/page.tsx`                                                                                               |
| 8   | **Valeurs hardcodees (violation CEO)**     | Hex colors, EUR prices, options arrays                         | `ChartSection.tsx`, `GeneratePaymentLinkModal.tsx`, `StatsCards.tsx`, `QuotesPageClient.tsx`, `leads-edit-drawer.tsx`, `leads-create-dialog.tsx` |
| 9   | **Tables HTML brutes vs shadcn Table**     | Inconsistance table primitive                                  | `QuotesTable.tsx`, `ReportsTable.tsx`                                                                                                            |
| 10  | **Arbre mort components/crm/leads/**       | 9 fichiers ~2,900L orphelins                                   | `LeadDetailPage.tsx` + 8 dependants                                                                                                              |

---

## 15. Plan de remediation CUSTOM

34 fichiers CUSTOM classes par priorite de remediation.

### Priorite 1 — Migration architecture (3 fichiers, impact maximal)

| Fichier                     | Lignes | Action                                                 | Pattern cible              |
| --------------------------- | ------ | ------------------------------------------------------ | -------------------------- |
| `opportunities/page.tsx`    | 304    | Extraire data+logic vers `features/crm/opportunities/` | KI page.tsx thin (20L max) |
| `quotes/[id]/edit/page.tsx` | 100    | Extraire fetchOpportunities vers features/             | KI page.tsx thin           |
| `quotes/new/page.tsx`       | 92     | Merger fetchOpportunities avec edit/ (DRY)             | KI page.tsx thin           |

### Priorite 2 — Remplacement par pattern reference (8 fichiers)

| Fichier                       | Lignes | Action                                            | Pattern cible                 |
| ----------------------------- | ------ | ------------------------------------------------- | ----------------------------- |
| `OpportunitiesTable.tsx`      | 680    | Remplacer par kiranism DataTable + TanStack Table | KI data-table.tsx             |
| `OpportunitiesTableRow.tsx`   | 780    | Supprimer (integre dans DataTable columns)        | KI column definitions         |
| `OpportunitiesPageClient.tsx` | 713    | Refactorer state vers hooks + features/           | KI page.tsx + hooks           |
| `QuotesPageClient.tsx`        | 483    | Idem opportunities                                | KI page.tsx + hooks           |
| `OpportunitiesFilterBar.tsx`  | 213    | Aligner sur leads-filter-sidebar (nuqs)           | leads-filter-sidebar.tsx      |
| `QuoteColumnSelector.tsx`     | 196    | Migrer vers dnd-kit (aligner sur opportunities)   | OpportunityColumnSelector.tsx |
| Loading files (5)             | ~340   | Creer composants skeleton reutilisables           | KI DataTableSkeleton          |

### Priorite 3 — Composants metier (acceptables en CUSTOM)

| Fichier                      | Lignes | Action                                               |
| ---------------------------- | ------ | ---------------------------------------------------- |
| `LeadDrawer.tsx`             | 572    | Acceptable — workstation proprietaire justifiee      |
| `LeadDrawerHeader.tsx`       | 177    | Acceptable — B2B header specifique                   |
| `LeadDrawerSections.tsx`     | 786    | **Decomposer** en sous-composants (<200L chacun)     |
| `LeadContextMenu.tsx`        | 184    | Acceptable                                           |
| `InlineActivityForm.tsx`     | 184    | Acceptable — UX proprietaire justifiee               |
| `QuoteForm.tsx`              | 692    | **Decomposer** en sections (<200L chacun)            |
| `QuoteItemsEditor.tsx`       | 452    | **Decomposer** + ajouter DnD reorder                 |
| `QuoteDetailClient.tsx`      | 618    | Evaluer migration vers drawer pattern                |
| `QuoteStatusBadge.tsx`       | 105    | Acceptable                                           |
| `KanbanCardSkeleton.tsx`     | 37     | Acceptable                                           |
| `OpportunityContextMenu.tsx` | 192    | Acceptable                                           |
| `OpportunityDrawer.tsx`      | 947    | **Decomposer** en sections (<200L) + extraire shared |

---

## 16. Plan de remediation DERIVE

61 fichiers DERIVE — gaps principaux a corriger par categorie.

### Gap A : Composants natifs au lieu de shadcn (12 fichiers)

| Pattern                                     | Fichiers                                                                                                            | Fix                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `<select>` natif au lieu de shadcn `Select` | OpportunitiesFilterBar, QuotesFilterBar, ColdLeadsFilter, LeadsFilterBar, GeneratePaymentLinkModal, TablePagination | Remplacer par `<Select>` de `@/components/ui/select` |
| `<input>` natif au lieu de shadcn `Command` | LeadSearchCommand, QuickSearch                                                                                      | Remplacer par `<Command>` + `<CommandInput>`         |
| `<table>` HTML au lieu de shadcn `Table`    | QuotesTable, ReportsTable                                                                                           | Remplacer par `<Table>` de `@/components/ui/table`   |
| `<button>` brut au lieu de `RadioGroup`     | DeleteLeadModal, DisqualifyLeadModal                                                                                | Remplacer par `<RadioGroup>`                         |

### Gap B : Helpers centralises non utilises (8 fichiers)

| Helper centralise                                       | Fichiers qui l'ignorent                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `getStatusBadgeColor()` de `lib/utils/status-colors.ts` | QuickSearch, ReportsTable, LeadsBrowserClient (getStatusColor local duplique) |
| `formatDate()` de `lib/format.ts`                       | LeadsBrowserClient (formatRelativeTime local)                                 |
| Debounce hook (`useDebounce`)                           | LeadSearchCommand, QuickSearch (useRef pattern duplique)                      |

### Gap C : Form pattern (react-hook-form + Zod) (4 fichiers)

| Fichier                         | Probleme                                            |
| ------------------------------- | --------------------------------------------------- |
| `ConvertToOpportunityModal.tsx` | useState brut au lieu de RHF+Zod                    |
| `OpportunityFormModal.tsx`      | useState brut au lieu de RHF+Zod                    |
| `PipelineSettingsTab.tsx`       | Form uncontrolled (e.preventDefault)                |
| `AddActivityModal.tsx`          | Zod base schema seulement, champs extra non valides |

### Gap D : Tokens fc-\* non-standard (5 fichiers)

| Fichier                  | Tokens non-standard                              |
| ------------------------ | ------------------------------------------------ |
| `LeadsFilterBar.tsx`     | rounded-fc-md, border-fc-border-light            |
| `KanbanCard.tsx`         | rounded-fc-lg, shadow-fc-md, ring-fc-primary-500 |
| `KanbanColumn.tsx`       | bg-fc-primary-50/30, ring-fc-primary-500         |
| `QuotesKanbanColumn.tsx` | STATUS_PILL_COLOR fc-\*                          |
| `QuotesKanbanCard.tsx`   | rounded-fc-lg, border-fc-border-light            |

---

## ANNEXE — Fichiers a supprimer (code mort)

| Fichier                                              | Lignes      | Raison                                     |
| ---------------------------------------------------- | ----------- | ------------------------------------------ |
| `components/crm/layout/CrmSidebar.tsx`               | 240         | Zero imports, app utilise AppSidebar       |
| `components/crm/layout/CrmTopBar.tsx`                | 38          | Zero imports, app utilise SiteHeader       |
| `components/crm/leads/LeadDetailPage.tsx`            | 269         | Orphelin, page.tsx migre vers features/    |
| `components/crm/leads/LeadsBrowserClient.tsx`        | 645         | browser/page.tsx supprime                  |
| `components/crm/leads/LeadDetailHeader.tsx`          | 392         | Dependant de LeadDetailPage (mort)         |
| `components/crm/leads/LeadDetailCards.tsx`           | 570         | Dependant de LeadDetailPage (mort)         |
| `components/crm/leads/LeadSearchCommand.tsx`         | 261         | Dependant de LeadDetailHeader (mort)       |
| `components/crm/leads/ConvertToOpportunityModal.tsx` | 351         | Dependant de LeadDetailPage (mort)         |
| `components/crm/leads/GeneratePaymentLinkModal.tsx`  | 305         | Dependant de PaymentLinkSection (mort)     |
| `components/crm/leads/PaymentLinkSection.tsx`        | 273         | Dependant de LeadDetailPage (mort)         |
| `components/crm/leads/LeadQuoteSection.tsx`          | 280         | Dependant de LeadDetailPage (mort)         |
| `features/crm/dashboard/widgets/avg-score-card.tsx`  | 1           | Tombstone 1 ligne, scoring supprime        |
| `app/.../crm/leads/directory/loading.tsx`            | 56          | Redirect synchrone, loading jamais affiche |
| **TOTAL**                                            | **~3,681L** | —                                          |
