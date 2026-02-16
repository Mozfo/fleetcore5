# AUDIT COMPARATIF — Dashboard CRM

**Date**: 2026-02-16
**Scope**: FleetCore `/crm/leads/reports` (existant) vs shadcnuikit CRM Dashboard (cible)
**Sources additionnelles**: atomic-crm, kiranism
**Mode**: READ-ONLY — Aucune modification de code

---

## PHASE A — Analyse du Dashboard Existant (FleetCore)

### A.1 — Architecture des fichiers

| Fichier                                               | LOC       | Role                                                        |
| ----------------------------------------------------- | --------- | ----------------------------------------------------------- |
| `app/[locale]/(app)/crm/leads/reports/page.tsx`       | ~15       | Server Component — auth check + render `LeadsReportsClient` |
| `components/crm/leads/reports/LeadsReportsClient.tsx` | 174       | Orchestrateur client — fetch stats, layout global           |
| `components/crm/leads/reports/StatsCards.tsx`         | 188       | 5 cartes KPI avec trends                                    |
| `components/crm/leads/reports/ChartSection.tsx`       | 250       | 3 graphiques Recharts                                       |
| `components/crm/leads/reports/QuickSearch.tsx`        | 348       | Recherche HubSpot-style avec `Cmd+K`                        |
| `components/crm/leads/reports/ColdLeadsFilter.tsx`    | 128       | Filtre leads froids (toggle + seuil)                        |
| `components/crm/leads/reports/ReportsTable.tsx`       | 370       | Table HTML avec pagination serveur                          |
| `components/crm/leads/reports/ExportButton.tsx`       | 154       | Export CSV/JSON via API                                     |
| **TOTAL**                                             | **~1627** |                                                             |

### A.2 — Layout global

```
Header (titre + ExportButton + QuickSearch)
  |
  +-- StatsCards (grid 5 colonnes)
  +-- ChartSection (grid 2 colonnes, 3 charts)
  +-- ColdLeadsFilter (toggle bar)
  +-- ReportsTable (table HTML + pagination serveur)
```

### A.3 — Inventaire des widgets (8 widgets)

#### Widget A1: StatsCards (5 KPI cards)

- **Composant**: `StatsCards.tsx` (188 LOC)
- **Donnees**: API `/api/v1/crm/leads/stats` — donnees dynamiques
- **Cards**:
  1. **Total Leads** — `stats.summary.total` + trend % + "vs previous period"
  2. **Conversion Rate** — `stats.conversion.rate`% + trend + "X qualified"
  3. **Cold Leads** — `stats.summary.cold_leads` + seuil mois
  4. **Avg Score** — `stats.quality.avg_qualification_score`/100 + fit/engagement breakdown
  5. **Time to Convert** — `stats.conversion.avg_days_to_qualification` jours
- **Design**: Divs manuels `rounded-lg border border-gray-200 bg-white` — **PAS** de shadcn `Card`
- **Trend**: Icones `TrendingUp`/`TrendingDown` avec couleurs emerald/red
- **Icones**: Cercle colore avec lucide icon (Users, Target, Snowflake, TrendingUp, Clock)
- **Responsive**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`

#### Widget A2: ChartSection — Status Distribution (Donut PieChart)

- **Composant**: `ChartSection.tsx` (partie 1/3)
- **Donnees**: `stats.charts.status_distribution` — dynamique
- **Chart**: Recharts `PieChart` avec `Pie` innerRadius=60 outerRadius=90
- **Label**: inline `name + percent%` sur les segments
- **Legend**: `flex-wrap` en bas avec dots colores
- **Container**: Div manuel (PAS shadcn Card, PAS `ChartContainer`)
- **Hauteur**: `h-64` fixe

#### Widget A3: ChartSection — Leads Over Time (LineChart)

- **Composant**: `ChartSection.tsx` (partie 2/3)
- **Donnees**: `stats.charts.time_series` (12 semaines) — dynamique
- **Chart**: Recharts `LineChart` avec `CartesianGrid`, `XAxis`, `YAxis`
- **Style**: Ligne bleue `#3B82F6`, dots actifs
- **Tooltip**: Style custom `contentStyle` inline
- **Container**: Div manuel

#### Widget A4: ChartSection — Top Sources (BarChart horizontal)

- **Composant**: `ChartSection.tsx` (partie 3/3)
- **Donnees**: `stats.charts.sources` (top 5) — dynamique
- **Chart**: Recharts `BarChart` layout="vertical", barre violette `#8B5CF6`
- **Layout**: `lg:col-span-2` (pleine largeur)
- **Container**: Div manuel

#### Widget A5: QuickSearch

- **Composant**: `QuickSearch.tsx` (348 LOC)
- **Position**: Dans le header, sous le titre
- **Features**:
  - Raccourci `Cmd+K` / `Ctrl+K`
  - Debounce 300ms
  - Navigation clavier (ArrowUp/Down, Enter, Escape)
  - Dropdown resultats avec:
    - Avatar gradient (initiales)
    - Nom + drapeau pays + badge statut
    - Company name
    - Email avec bouton copier
    - Telephone avec lien `tel:`
    - Score
    - Bouton ouvrir fiche
  - Hint clavier en bas du dropdown
- **API**: `/api/v1/crm/leads?search=...&limit=10`
- **Donnees**: Dynamiques (API live)

#### Widget A6: ColdLeadsFilter

- **Composant**: `ColdLeadsFilter.tsx` (128 LOC)
- **Features**:
  - Toggle on/off avec badge count colore (cyan)
  - Dropdown seuil inactivite (3/6/12/24 mois)
  - Boutons segment: "All Cold" / "Inactive Only"
  - Description contextualisee a droite
- **Donnees**: `stats.summary.cold_leads` + filtre impactant `ReportsTable`

#### Widget A7: ReportsTable

- **Composant**: `ReportsTable.tsx` (370 LOC)
- **Type**: Table HTML native `<table>` — **PAS** TanStack Table
- **Colonnes**: Company (flag+fleet), Contact, Email (copy), Phone (tel:), Status (badge), Score, Created, Actions
- **Pagination**: Serveur-side — page/limit/sort/order via API
- **Page sizes**: 25/50/100
- **API**: `/api/v1/crm/leads?page=X&limit=Y&sort=created_at&order=desc`
- **Interactions**: Hover row highlight, copy email, navigate to lead, link tel:
- **8 statuts**: new, demo, proposal_sent, payment_pending, converted, lost, nurturing, disqualified

#### Widget A8: ExportButton

- **Composant**: `ExportButton.tsx` (154 LOC)
- **Position**: Header, a droite du titre
- **Formats**: CSV et JSON
- **API**: POST `/api/v1/crm/leads/export` avec body `{format, filters, ids}`
- **Download**: Blob download avec fichier date
- **Indicateur**: Badge count si selectedIds
- **Dropdown**: Custom div (PAS shadcn DropdownMenu)

### A.4 — Patterns techniques FleetCore

| Pattern          | Implementation                                             |
| ---------------- | ---------------------------------------------------------- |
| Data fetching    | `fetch()` dans `useCallback` + `useEffect`                 |
| State management | `useState` local (pas Zustand, pas React Query)            |
| Loading          | `Loader2` spinner centre                                   |
| Error handling   | Silent catch + null display                                |
| i18n             | `react-i18next` via `useTranslation("crm")`                |
| UI composants    | Divs manuels avec classes Tailwind (PAS shadcn Card/Chart) |
| Charts           | Recharts direct (`PieChart`, `LineChart`, `BarChart`)      |
| Pagination       | Custom HTML (PAS shadcn pagination)                        |
| Responsive       | Grid Tailwind responsive breakpoints                       |

---

## PHASE B — Analyse du Dashboard Cible (shadcnuikit)

### B.1 — Architecture des fichiers

| Fichier                              | LOC      | Role                                |
| ------------------------------------ | -------- | ----------------------------------- |
| `app/dashboard/(auth)/crm/page.tsx`  | 50       | Page layout — header + grid widgets |
| `crm/components/target-card.tsx`     | 75       | RadialBarChart target completion    |
| `crm/components/total-customers.tsx` | 25       | KPI card — Total Customers          |
| `crm/components/total-deals.tsx`     | 25       | KPI card — Total Deals              |
| `crm/components/total-revenue.tsx`   | 25       | KPI card — Total Revenue            |
| `crm/components/leads-by-source.tsx` | 112      | Donut PieChart leads par source     |
| `crm/components/recent-tasks.tsx`    | 117      | Liste de taches avec checkboxes     |
| `crm/components/sales-pipeline.tsx`  | 112      | Pipeline visuel avec Progress bars  |
| `crm/components/leads.tsx`           | 295      | TanStack DataTable avec filtres     |
| `crm/components/index.ts`            | ~10      | Barrel exports                      |
| **TOTAL**                            | **~846** |                                     |

### B.2 — Layout global

```
Header (h1 "CRM Dashboard" + DateRangePicker + Download Button)
  |
  +-- Row 1: grid 4 colonnes — TargetCard + TotalCustomers + TotalDeals + TotalRevenue
  +-- Row 2: grid 3 colonnes — LeadBySource + RecentTasks + SalesPipeline
  +-- Row 3: pleine largeur — LeadsCard (DataTable)
```

### B.3 — Inventaire des widgets (8 widgets)

#### Widget B1: TargetCard (RadialBarChart)

- **Composant**: `target-card.tsx` (75 LOC)
- **Donnees**: Statique (hardcode `48%`)
- **Chart**: Recharts `RadialBarChart` avec `PolarGrid`, `RadialBar`, `PolarRadiusAxis`
- **Design**: shadcn `Card` + `CardHeader` + `CardTitle` + `CardContent`
- **Chart wrapper**: shadcn `ChartContainer` avec `ChartConfig`
- **Contenu**: Pourcentage au centre + texte descriptif

#### Widget B2: TotalCustomersCard (KPI)

- **Composant**: `total-customers.tsx` (25 LOC)
- **Donnees**: Statique (hardcode `1890`, `+10.4%`)
- **Design**: shadcn `Card` + `CardHeader` + `CardDescription` + `CardAction`
- **Icone**: `Users2Icon` dans cercle `bg-muted rounded-full border` (size-12)
- **Trend**: Texte `+10.4%` vert inline

#### Widget B3: TotalDeals (KPI)

- **Composant**: `total-deals.tsx` (25 LOC)
- **Donnees**: Statique (hardcode `1,02,890`, `-0.8%`)
- **Design**: Identique B2 — `Card` + `CardAction`
- **Icone**: `BriefcaseBusiness` dans cercle muted
- **Trend**: Texte `-0.8%` rouge inline

#### Widget B4: TotalRevenueCard (KPI)

- **Composant**: `total-revenue.tsx` (25 LOC)
- **Donnees**: Statique (hardcode `$435,578`, `+20.1%`)
- **Design**: Identique B2/B3
- **Icone**: `WalletMinimal` dans cercle muted

#### Widget B5: LeadBySourceCard (Donut PieChart)

- **Composant**: `leads-by-source.tsx` (112 LOC)
- **Donnees**: Statique (Social 275, Email 200, Call 287, Others 173 = total 935)
- **Chart**: Recharts `PieChart` + `Pie` innerRadius=60
- **Label center**: Total `935` + texte "Leads" au centre du donut
- **Tooltip**: shadcn `ChartTooltip` + `ChartTooltipContent`
- **Legend**: `flex justify-around` sous le chart avec dots + labels + counts
- **Design**: shadcn `Card` + `ChartContainer` + `ChartConfig`
- **Action**: `ExportButton` dans `CardAction`

#### Widget B6: RecentTasks

- **Composant**: `recent-tasks.tsx` (117 LOC)
- **Donnees**: Statique (3 taches hardcodees)
- **Features**:
  - Checkbox toggle complete/incomplete
  - Titre + description
  - Badge priorite (high/medium/low) colore
  - Date d'echeance
  - Bouton "Add Task" dans `CardAction`
  - Strikethrough quand complete
- **Design**: shadcn `Card`, `Checkbox`, badge custom

#### Widget B7: SalesPipeline

- **Composant**: `sales-pipeline.tsx` (112 LOC)
- **Donnees**: Statique (5 stages hardcodes: Lead 235, Qualified 146, Proposal 84, Negotiation 52, Closed Won 36)
- **Visualisation**:
  - Barre horizontale empilee (stacked bar) en haut avec tooltips
  - Liste detaillee: dot couleur + nom + count + valeur $ + `Progress` bar + pourcentage
- **Design**: shadcn `Card`, `Progress`, `Tooltip`, `TooltipProvider`
- **Couleurs**: CSS variables `--chart-1` a `--chart-5`

#### Widget B8: LeadsCard (TanStack DataTable)

- **Composant**: `leads.tsx` (295 LOC)
- **Donnees**: Statique (5 rows hardcodes — Payment type)
- **TanStack Features**:
  - `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`
  - Row selection (checkboxes)
  - Column sorting (email)
  - Column filtering (email input)
  - Column visibility (dropdown toggle)
  - Actions dropdown (copy ID, view customer, view details)
- **Pagination**: Client-side Previous/Next
- **Design**: shadcn `Card`, `Table`, `Input`, `Button`, `DropdownMenu`, `Checkbox`

### B.4 — Patterns techniques shadcnuikit

| Pattern          | Implementation                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Data fetching    | Aucun — toutes donnees statiques/hardcodees                                              |
| State management | `useState` local pour tasks toggle et table state                                        |
| Loading          | Aucun (pas de data fetching)                                                             |
| Error handling   | Aucun                                                                                    |
| i18n             | Aucun (English only)                                                                     |
| UI composants    | shadcn `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardAction`, `CardDescription` |
| Charts           | Recharts via shadcn `ChartContainer` + `ChartConfig` + `ChartTooltip`                    |
| Table            | TanStack Table v8 avec shadcn `Table` components                                         |
| Responsive       | Grid Tailwind (`md:grid-cols-2 xl:grid-cols-4`)                                          |
| Date range       | `CustomDateRangePicker` dans le header                                                   |

---

## PHASE C — Tableau Comparatif Widget par Widget

### C.1 — KPI Cards

| Critere              | FleetCore (A1)                         | shadcnuikit (B2/B3/B4)                      | Ecart                                 |
| -------------------- | -------------------------------------- | ------------------------------------------- | ------------------------------------- |
| **Nombre de cartes** | 5 (Total, Conv%, Cold, AvgScore, Time) | 3 KPI + 1 Target (4 total)                  | FleetCore: +1 KPI metier              |
| **Donnees**          | API dynamique (`/stats`)               | Statique hardcode                           | FleetCore SUPERIEUR                   |
| **Trend indicator**  | Icone TrendingUp/Down + % colore       | Texte `+X%` colore inline                   | shadcnuikit plus compact              |
| **Subtitle**         | Oui (texte contextuel)                 | Oui ("from last month")                     | Parite                                |
| **Icone**            | Cercle colore 40x40 avec lucide        | Cercle muted 48x48 avec lucide              | shadcnuikit plus grand                |
| **Container**        | Div manuel avec gray borders           | shadcn `Card` + `CardHeader` + `CardAction` | shadcnuikit SUPERIEUR (design system) |
| **Grid**             | `grid-cols-2 md:3 lg:5`                | `grid-cols-2 xl:4`                          | Different mais equivalent             |
| **Dark mode**        | Classes manuelles `dark:bg-gray-900`   | Automatique via CSS variables               | shadcnuikit SUPERIEUR                 |
| **KPIs metier**      | Cold Leads, Avg Score, Time to Convert | Total Deals, Total Revenue                  | FleetCore plus specifique CRM         |

**Widget unique shadcnuikit**: `TargetCard` (B1) — RadialBarChart avec pourcentage de completion cible. **FleetCore n'a pas d'equivalent**. Pattern interessant pour objectifs commerciaux.

### C.2 — Charts de distribution

| Critere             | FleetCore (A2)                 | shadcnuikit (B5)                                 | Ecart                                 |
| ------------------- | ------------------------------ | ------------------------------------------------ | ------------------------------------- |
| **Type**            | Donut PieChart (Status)        | Donut PieChart (Source)                          | Meme type, donnees differentes        |
| **Donnees**         | Dynamique (API)                | Statique (4 sources)                             | FleetCore SUPERIEUR                   |
| **Label center**    | Non                            | Oui (total au centre)                            | shadcnuikit SUPERIEUR (UX)            |
| **Labels segments** | Oui (`name + percent%` inline) | Non (tooltip seulement)                          | FleetCore plus informatif             |
| **Legend**          | flex-wrap center sous chart    | flex justify-around avec counts                  | shadcnuikit plus detaille             |
| **Tooltip**         | Recharts `Tooltip` brut        | shadcn `ChartTooltip` + `ChartTooltipContent`    | shadcnuikit SUPERIEUR (design system) |
| **Container**       | Div manuel                     | shadcn `Card` + `ChartContainer` + `ChartConfig` | shadcnuikit SUPERIEUR                 |
| **Export**          | Non                            | `ExportButton` dans `CardAction`                 | shadcnuikit SUPERIEUR                 |

### C.3 — Charts temporels

| Critere       | FleetCore (A3)                  | shadcnuikit      | Ecart            |
| ------------- | ------------------------------- | ---------------- | ---------------- |
| **LineChart** | Leads Over Time (12 weeks)      | Aucun equivalent | FleetCore UNIQUE |
| **Donnees**   | Dynamique (API time_series)     | N/A              |                  |
| **Design**    | Recharts direct, tooltip custom | N/A              |                  |

**FleetCore a un LineChart temporel que shadcnuikit n'a PAS.** Aucun chart temporel dans shadcnuikit CRM.

### C.4 — Charts sources/barres

| Critere       | FleetCore (A4)                      | shadcnuikit (B7)                       | Ecart                 |
| ------------- | ----------------------------------- | -------------------------------------- | --------------------- |
| **Type**      | BarChart horizontal (Top Sources)   | Stacked bar + Progress list (Pipeline) | Concepts differents   |
| **Donnees**   | Dynamique (API sources top 5)       | Statique (5 stages pipeline)           |                       |
| **Sujet**     | Sources d'acquisition               | Stages pipeline vente                  | Complementaires       |
| **Design**    | Recharts `BarChart` vertical layout | HTML `Progress` bars + Tooltips        |                       |
| **Container** | Div manuel full width               | shadcn `Card` + `Progress` + `Tooltip` | shadcnuikit SUPERIEUR |

**Conclusion C.4**: Ces widgets ne sont pas comparables — ils couvrent des metriques differentes. Les deux sont necessaires dans un dashboard CRM complet.

### C.5 — Table de donnees

| Critere               | FleetCore (A7)                                                      | shadcnuikit (B8)                           | Ecart                          |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------ | ------------------------------ |
| **Type**              | HTML `<table>` natif                                                | TanStack Table + shadcn `Table`            | shadcnuikit SUPERIEUR          |
| **Colonnes**          | 8 (Company, Contact, Email, Phone, Status, Score, Created, Actions) | 5 (Select, Status, Email, Amount, Actions) | FleetCore plus complet metier  |
| **Donnees**           | Dynamique (API server-side)                                         | Statique (5 rows)                          | FleetCore SUPERIEUR            |
| **Pagination**        | Server-side (page/limit)                                            | Client-side (Previous/Next)                | FleetCore SUPERIEUR (scalable) |
| **Page sizes**        | 25/50/100                                                           | Defaut TanStack (10)                       | FleetCore plus configurable    |
| **Row selection**     | Non                                                                 | Oui (checkboxes)                           | shadcnuikit SUPERIEUR          |
| **Column sorting**    | Non                                                                 | Oui (email sortable)                       | shadcnuikit SUPERIEUR          |
| **Column filtering**  | Non                                                                 | Oui (input email)                          | shadcnuikit SUPERIEUR          |
| **Column visibility** | Non                                                                 | Oui (dropdown toggle)                      | shadcnuikit SUPERIEUR          |
| **Actions**           | Navigate to lead (ExternalLink)                                     | Dropdown (Copy ID, View)                   | shadcnuikit plus riche         |
| **Email copy**        | Oui (hover copy icon)                                               | Non                                        | FleetCore SUPERIEUR            |
| **Phone link**        | Oui (`tel:`)                                                        | Non                                        | FleetCore SUPERIEUR            |
| **Status badges**     | Oui (8 statuts colores)                                             | Oui (capitalize text simple)               | FleetCore SUPERIEUR            |
| **Container**         | Div border manual                                                   | shadcn `Card` + `CardHeader`               | shadcnuikit SUPERIEUR          |

### C.6 — Widgets UNIQUES a FleetCore (sans equivalent shadcnuikit)

| Widget                      | Description                                                          | Valeur metier                    |
| --------------------------- | -------------------------------------------------------------------- | -------------------------------- |
| **QuickSearch** (A5)        | Recherche HubSpot-style, Cmd+K, dropdown resultats, copy email, tel: | TRES HAUTE — feature killer      |
| **ColdLeadsFilter** (A6)    | Toggle cold leads + seuil + segments                                 | HAUTE — intelligence commerciale |
| **ExportButton** (A8)       | Export CSV/JSON via API avec filtres                                 | HAUTE — BI externe               |
| **LineChart temporel** (A3) | Evolution leads 12 semaines                                          | MOYENNE — trend analysis         |

### C.7 — Widgets UNIQUES a shadcnuikit (sans equivalent FleetCore)

| Widget                       | Description                           | Valeur metier                    |
| ---------------------------- | ------------------------------------- | -------------------------------- |
| **TargetCard** (B1)          | RadialBarChart target completion %    | MOYENNE — gamification objectifs |
| **RecentTasks** (B6)         | Todo list avec checkboxes + priorites | HAUTE — productivite commerciaux |
| **SalesPipeline** (B7)       | Funnel visuel avec $ par stage        | TRES HAUTE — visibilite pipeline |
| **DateRangePicker** (header) | Selecteur plage dates dans header     | HAUTE — filtrage temporel        |

### C.8 — Tableau de synthese comparative

| Dimension                                    | FleetCore               | shadcnuikit                    | Gagnant         |
| -------------------------------------------- | ----------------------- | ------------------------------ | --------------- |
| **Nombre total widgets**                     | 8                       | 8                              | Egalite         |
| **Widgets avec donnees dynamiques**          | 8/8 (100%)              | 0/8 (0%)                       | **FleetCore**   |
| **Utilisation shadcn Card**                  | 0/8                     | 8/8                            | **shadcnuikit** |
| **Utilisation ChartContainer/Config**        | 0/3 charts              | 2/2 charts                     | **shadcnuikit** |
| **TanStack Table**                           | Non (HTML table)        | Oui                            | **shadcnuikit** |
| **Row selection**                            | Non                     | Oui                            | **shadcnuikit** |
| **Column features (sort/filter/visibility)** | Non                     | Oui                            | **shadcnuikit** |
| **Server-side pagination**                   | Oui (25/50/100)         | Non                            | **FleetCore**   |
| **Recherche globale**                        | Oui (QuickSearch Cmd+K) | Non                            | **FleetCore**   |
| **Export**                                   | CSV + JSON via API      | Download button (non connecte) | **FleetCore**   |
| **Filtres metier**                           | Cold leads filter       | Non                            | **FleetCore**   |
| **i18n**                                     | Complet (en/fr)         | Non                            | **FleetCore**   |
| **Dark mode**                                | Classes manuelles       | CSS variables automatique      | **shadcnuikit** |
| **Pipeline vente**                           | Non                     | Oui (SalesPipeline)            | **shadcnuikit** |
| **Todo/Tasks**                               | Non                     | Oui (RecentTasks)              | **shadcnuikit** |
| **Target/Objectifs**                         | Non                     | Oui (TargetCard)               | **shadcnuikit** |
| **Date range picker**                        | Non                     | Oui                            | **shadcnuikit** |

---

## PHASE D — Patterns Supplementaires (atomic-crm + kiranism)

### D.1 — atomic-crm Dashboard

**Fichier**: `src/components/atomic-crm/dashboard/Dashboard.tsx` (66 LOC)

**Architecture**: Grid 12 colonnes (3-6-3) avec chargement conditionnel.

| Widget                 | Fichier                    | Description                                          | Pattern notable                                    |
| ---------------------- | -------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| `DashboardStepper`     | DashboardStepper.tsx       | Onboarding step-by-step (1/2/3)                      | Affiche uniquement si donnees vides — excellent UX |
| `Welcome`              | Welcome.tsx                | Message bienvenue (demo only)                        | `import.meta.env.VITE_IS_DEMO`                     |
| `HotContacts`          | HotContacts.tsx            | Contacts chauds (col-span-3)                         | `useGetList` react-admin                           |
| `DealsChart`           | DealsChart.tsx (202 LOC)   | **Nivo** `ResponsiveBar` — Won/Pending/Lost par mois | `@nivo/bar` (PAS Recharts)                         |
| `DealsPipeline`        | DealsPipeline.tsx (90 LOC) | Pipeline deals avec `SimpleList`                     | Non utilise dans layout actuel                     |
| `DashboardActivityLog` | DashboardActivityLog.tsx   | Journal activites recentes                           | Col-span-6                                         |
| `TasksList`            | TasksList.tsx              | Todo list avec filtres                               | Col-span-3, filtre par type                        |
| `LatestNotes`          | LatestNotes.tsx            | Notes recentes                                       | Non utilise dans layout actuel                     |
| `MobileDashboard`      | MobileDashboard.tsx        | Layout mobile alternatif                             | Responsive adaptatif                               |

**Patterns a retenir**:

1. **Onboarding progressif** (`DashboardStepper`): Si `totalContact === 0`, montre step 1 (importer contacts). Si `totalContactNotes === 0`, montre step 2. Sinon dashboard complet. **FleetCore n'a PAS cette logique**.

2. **DealsChart avec Nivo** (202 LOC): Utilise `@nivo/bar` au lieu de Recharts. Stacked bar chart Won/Pending/Lost avec multiplicateurs par stage. Axes custom, markers, tooltip devise. **Plus sophistique** que le BarChart FleetCore.

3. **Chargement conditionnel**: `if (isPending) return null` — pas de spinner, juste masquage. Moins bon UX que FleetCore (Loader2 spinner).

4. **Data Provider unifie**: Toutes les donnees via `useGetList` de `ra-core` — pattern centralisee vs fetch manual FleetCore.

### D.2 — kiranism Dashboard

**Fichier**: `src/app/dashboard/overview/layout.tsx` (137 LOC)

**Architecture**: Next.js Parallel Routes (`@area_stats`, `@bar_stats`, `@pie_stats`, `@sales`).

| Widget      | Slot              | Description                          | Pattern notable                                       |
| ----------- | ----------------- | ------------------------------------ | ----------------------------------------------------- |
| 4 KPI Cards | layout.tsx inline | Revenue, Customers, Accounts, Growth | shadcn `Card` + `Badge` + `CardAction` + `CardFooter` |
| BarGraph    | `@bar_stats`      | Graphique barres                     | Parallel Route + async `delay()`                      |
| AreaGraph   | `@area_stats`     | Graphique aires                      | Parallel Route + async `delay()`                      |
| PieGraph    | `@pie_stats`      | Graphique camembert                  | Parallel Route + async `delay()`                      |
| Sales       | `@sales`          | Liste ventes                         | Parallel Route + async `delay()`                      |

**Patterns a retenir**:

1. **Parallel Routes pour widgets**: Chaque widget est un `@slot` Next.js avec son propre `page.tsx`, `loading.tsx`, `error.tsx`, `default.tsx`. **Loading et error granulaires par widget** — bien meilleur UX que FleetCore (un seul Loader2 global).

2. **KPI Cards enrichies**: Utilise `CardFooter` avec texte explicatif + icone trend. Plus informatif que shadcnuikit (pas de footer) et FleetCore (subtitle simple).

3. **Container queries**: `@container/card` + `@[250px]/card:text-3xl` — **responsive adaptatif au conteneur**, pas au viewport. Pattern avance.

4. **Design system coherent**: CSS variables avec gradient `from-primary/5 to-card` sur toutes les cartes. Dark mode automatique.

5. **Delais simules**: `await delay(2000)` pour simuler latence serveur. Montre que l'architecture supporte le chargement asynchrone par widget.

### D.3 — Patterns absents des 4 sources

| Pattern                                 | Present dans... | Absent de... |
| --------------------------------------- | --------------- | ------------ |
| WebSocket / real-time updates           | Aucune source   | Toutes       |
| Drag & drop widgets (dashboard custom)  | Aucune source   | Toutes       |
| Drill-down chart → table                | Aucune source   | Toutes       |
| Comparaison periodes (YoY, MoM overlay) | Aucune source   | Toutes       |
| Favoris / Epingler widgets              | Aucune source   | Toutes       |

---

## PHASE E — Synthese et Recommandations

### E.1 — Comptage final

| Metrique      | FleetCore          | shadcnuikit               | atomic-crm               | kiranism             |
| ------------- | ------------------ | ------------------------- | ------------------------ | -------------------- |
| Total widgets | 8                  | 8                         | 7 (5 actifs)             | 8 (4 KPI + 4 charts) |
| KPI cards     | 5                  | 4 (3 KPI + 1 Target)      | 0                        | 4                    |
| Charts        | 3 (Pie, Line, Bar) | 2 (RadialBar, Pie)        | 1 (Nivo Bar)             | 3 (Bar, Area, Pie)   |
| Tables        | 1 (HTML)           | 1 (TanStack)              | 0                        | 0                    |
| Listes        | 0                  | 1 (Tasks)                 | 3 (Hot, Activity, Tasks) | 1 (Sales)            |
| Filtres       | 1 (ColdLeads)      | 0                         | 0                        | 0                    |
| Recherche     | 1 (QuickSearch)    | 0                         | 0                        | 0                    |
| Export        | 1 (CSV/JSON)       | 1 (Download non connecte) | 0                        | 0                    |
| Date picker   | 0                  | 1                         | 0                        | 0                    |
| Onboarding    | 0                  | 0                         | 1 (Stepper)              | 0                    |
| LOC total     | ~1627              | ~846                      | ~700+                    | ~137 (layout)        |

### E.2 — Forces de chaque source

| Source          | Force principale                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------- |
| **FleetCore**   | Donnees dynamiques, recherche Cmd+K, filtres metier, export BI, i18n, pagination serveur          |
| **shadcnuikit** | Design system coherent (shadcn Card/Chart), TanStack Table, pipeline visuel, tasks, date picker   |
| **atomic-crm**  | Onboarding progressif, activity log, Nivo charts avances, data provider unifie                    |
| **kiranism**    | Parallel Routes (loading/error granulaires), container queries, KPI cards riches (footer + badge) |

### E.3 — Faiblesses de chaque source

| Source          | Faiblesse principale                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **FleetCore**   | UI manuelle (pas shadcn Card), pas de pipeline, pas de tasks, pas de date range, loading monolithique |
| **shadcnuikit** | 100% statique, pas d'API, pas de search, pas de filtres, pas d'i18n                                   |
| **atomic-crm**  | Pas de KPI cards, pas de pagination, depend react-admin (vendor lock-in), loading = null (mauvais UX) |
| **kiranism**    | Pas CRM-specifique, donnees simulees, pas de table, pas de filtres                                    |

### E.4 — Gap Analysis pour FleetCore

**Widgets a AJOUTER** (inspires shadcnuikit + atomic-crm + kiranism):

| #   | Widget                            | Source inspiration              | Priorite          | Complexite |
| --- | --------------------------------- | ------------------------------- | ----------------- | ---------- |
| 1   | **SalesPipeline** (funnel visuel) | shadcnuikit B7                  | P1 - Critique     | Moyenne    |
| 2   | **DateRangePicker** dans header   | shadcnuikit page.tsx            | P1 - Critique     | Faible     |
| 3   | **RecentTasks** (todo list)       | shadcnuikit B6                  | P2 - Important    | Moyenne    |
| 4   | **TargetCard** (objectifs)        | shadcnuikit B1                  | P3 - Nice-to-have | Faible     |
| 5   | **Onboarding Stepper**            | atomic-crm Dashboard            | P3 - Nice-to-have | Faible     |
| 6   | **Activity Log**                  | atomic-crm DashboardActivityLog | P2 - Important    | Moyenne    |

**Patterns a MIGRER** (design system):

| #   | Migration                                                                 | Source         | Priorite |
| --- | ------------------------------------------------------------------------- | -------------- | -------- |
| 1   | Remplacer divs manuels par shadcn `Card` + `CardHeader` + `CardContent`   | shadcnuikit    | P1       |
| 2   | Remplacer Recharts direct par shadcn `ChartContainer` + `ChartConfig`     | shadcnuikit    | P1       |
| 3   | Remplacer HTML `<table>` par TanStack Table (deja fait dans `/crm/leads`) | shadcnuikit B8 | P1       |
| 4   | Ajouter `CardAction` pour boutons contextuels dans cards                  | shadcnuikit    | P2       |
| 5   | Adopter Parallel Routes pour loading granulaire                           | kiranism       | P3       |
| 6   | Adopter Container Queries pour responsive adaptatif                       | kiranism       | P3       |

**Features a CONSERVER** (avance FleetCore):

| Feature                | Justification                                       |
| ---------------------- | --------------------------------------------------- |
| QuickSearch (Cmd+K)    | Feature killer — aucun concurrent ne l'a            |
| ColdLeadsFilter        | Intelligence commerciale unique                     |
| Export CSV/JSON        | Essentiel pour BI externe                           |
| Server-side pagination | Scalabilite 10k+ leads                              |
| i18n complet (en/fr)   | Requirement FleetCore                               |
| 5 KPI cards metier     | Plus pertinent que les 3 KPI generiques shadcnuikit |
| LineChart temporel     | Analyse tendance unique                             |

### E.5 — Dashboard cible FleetCore v2

**Layout propose** (fusion des 4 sources):

```
Header (titre + DateRangePicker + ExportButton + QuickSearch)
  |
  +-- Row 1: grid 4 colonnes — TargetCard + 3 KPI cards (Total, Conv%, Pipeline value)
  +-- Row 2: grid 5 colonnes — 2 KPI supplementaires (Cold, Avg Score)
  +-- Row 3: grid 3 colonnes — LeadBySource (Pie) + SalesPipeline (Progress) + RecentTasks
  +-- Row 4: grid 2 colonnes — LeadsOverTime (Line) + TopSources (Bar)
  +-- ColdLeadsFilter (toggle bar)
  +-- ReportsTable (TanStack DataTable server-side)
```

**Nombre widgets cible**: 12 (vs 8 actuels)

- 5 KPI cards existantes (migrees vers shadcn Card)
- 1 TargetCard (nouveau)
- 3 charts existants (migres vers ChartContainer)
- 1 SalesPipeline (nouveau)
- 1 RecentTasks (nouveau)
- 1 ReportsTable (migre vers TanStack)
- Plus: QuickSearch, ColdLeadsFilter, ExportButton, DateRangePicker (toolbar/header)

---

## Annexe — Fichiers source lus

### FleetCore (8 fichiers)

1. `app/[locale]/(app)/crm/leads/reports/page.tsx`
2. `components/crm/leads/reports/LeadsReportsClient.tsx`
3. `components/crm/leads/reports/StatsCards.tsx`
4. `components/crm/leads/reports/ChartSection.tsx`
5. `components/crm/leads/reports/QuickSearch.tsx`
6. `components/crm/leads/reports/ColdLeadsFilter.tsx`
7. `components/crm/leads/reports/ReportsTable.tsx`
8. `components/crm/leads/reports/ExportButton.tsx`

### shadcnuikit (9 fichiers)

1. `app/dashboard/(auth)/crm/page.tsx`
2. `crm/components/index.ts`
3. `crm/components/target-card.tsx`
4. `crm/components/total-customers.tsx`
5. `crm/components/total-deals.tsx`
6. `crm/components/total-revenue.tsx`
7. `crm/components/leads-by-source.tsx`
8. `crm/components/recent-tasks.tsx`
9. `crm/components/sales-pipeline.tsx`
10. `crm/components/leads.tsx`

### atomic-crm (3 fichiers)

1. `src/components/atomic-crm/dashboard/Dashboard.tsx`
2. `src/components/atomic-crm/dashboard/DealsChart.tsx`
3. `src/components/atomic-crm/dashboard/DealsPipeline.tsx`

### kiranism (3 fichiers)

1. `src/app/dashboard/overview/layout.tsx`
2. `src/app/dashboard/overview/@area_stats/page.tsx`
3. `src/app/dashboard/overview/@pie_stats/page.tsx`
