# AUDIT COMPARATIF — CRM Dashboard FleetCore vs shadcnuikit

**Date** : 20 février 2026
**Auteur** : Claude (audit automatisé)
**Scope** : Dashboard CRM principal (`/crm` → `features/crm/dashboard/`) vs shadcnuikit CRM Dashboard
**Références additionnelles** : atomic-crm, Kiranism

> **ERRATUM** : L'audit V1 (`AUDIT_DASHBOARD_COMPARATIF.md`) portait par erreur sur `/crm/leads/reports/` (la page Reports, un outil BI secondaire). Ce document V2 audite le **vrai** dashboard CRM accessible à `/crm`.

---

## Table des matières

1. [Phase A — FleetCore Dashboard CRM (État actuel)](#phase-a--fleetcore-dashboard-crm-état-actuel)
2. [Phase B — shadcnuikit CRM Dashboard (Cible)](#phase-b--shadcnuikit-crm-dashboard-cible)
3. [Phase C — Comparatif widget par widget](#phase-c--comparatif-widget-par-widget)
4. [Phase D — Les 5 placeholders à implémenter](#phase-d--les-5-placeholders-à-implémenter)
5. [Phase E — Écarts résiduels sur les widgets fonctionnels](#phase-e--écarts-résiduels-sur-les-widgets-fonctionnels)
6. [Phase F — Éléments absents (ni fait, ni placeholder)](#phase-f--éléments-absents-ni-fait-ni-placeholder)
7. [Synthèse et actions](#synthèse-et-actions)

---

## Phase A — FleetCore Dashboard CRM (État actuel)

### Structure fichiers

```
features/crm/dashboard/
├── components/
│   ├── crm-dashboard-page.tsx          # Page client — layout, state, React Query
│   ├── date-range-picker.tsx           # DateRangePicker (Popover + Calendar + presets)
│   └── widgets/
│       ├── index.ts                    # Barrel export (11 widgets)
│       ├── target-card.tsx             # ✅ FONCTIONNEL — RadialBarChart
│       ├── total-leads-card.tsx        # ✅ FONCTIONNEL — KPI + trend
│       ├── conversion-rate-card.tsx    # ✅ FONCTIONNEL — KPI + trend
│       ├── pipeline-value-card.tsx     # ✅ FONCTIONNEL — KPI active leads
│       ├── avg-score-card.tsx          # ✅ FONCTIONNEL — KPI + scores
│       ├── time-to-convert-card.tsx    # ✅ FONCTIONNEL — KPI jours
│       ├── lead-by-source-card.tsx     # ⬜ PLACEHOLDER
│       ├── sales-pipeline-card.tsx     # ⬜ PLACEHOLDER
│       ├── recent-tasks-card.tsx       # ⬜ PLACEHOLDER
│       ├── leads-over-time-card.tsx    # ⬜ PLACEHOLDER
│       └── top-sources-card.tsx        # ⬜ PLACEHOLDER
├── hooks/
│   └── use-dashboard-data.ts           # React Query hook (TanStack Query)
└── types/
    └── dashboard.types.ts              # Interfaces typées pour tous les widgets
```

### Layout (crm-dashboard-page.tsx)

```
┌──────────────────────────────────────────────────────┐
│  Header: h1 title + p description + DateRangePicker  │
├──────────────────────────────────────────────────────┤
│  ROW 1: 4 KPI cards                                  │
│  grid gap-4 md:grid-cols-2 xl:grid-cols-4            │
│  [TargetCard] [TotalLeads] [ConversionRate] [Pipeline]│
├──────────────────────────────────────────────────────┤
│  ROW 2: 2 KPI cards                                  │
│  grid gap-4 md:grid-cols-2 xl:grid-cols-4            │
│  [AvgScore] [TimeToConvert]                          │
├──────────────────────────────────────────────────────┤
│  ROW 3: 3 chart/widget cards                         │
│  grid gap-4 xl:grid-cols-3                           │
│  [LeadBySource⬜] [SalesPipeline⬜] [RecentTasks⬜]  │
├──────────────────────────────────────────────────────┤
│  ROW 4: 2 chart cards                                │
│  grid gap-4 xl:grid-cols-2                           │
│  [LeadsOverTime⬜] [TopSources⬜]                    │
└──────────────────────────────────────────────────────┘
```

### Inventaire — 11 widgets + DateRangePicker

| #   | Widget             | Statut         | Composants shadcn/ui utilisés                                                     | Data prop                                                    |
| --- | ------------------ | -------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | TargetCard         | ✅ Fonctionnel | `Card`, `CardHeader`, `CardTitle`, `CardContent`, `ChartContainer`, `ChartConfig` | `conversionRate`, `targetRate`, `qualifiedThisPeriod`        |
| 2   | TotalLeadsCard     | ✅ Fonctionnel | `Card`, `CardHeader`, `CardDescription`, `CardAction`                             | `total`, `trend`                                             |
| 3   | ConversionRateCard | ✅ Fonctionnel | `Card`, `CardHeader`, `CardDescription`, `CardAction`                             | `rate`, `trend`, `qualified`                                 |
| 4   | PipelineValueCard  | ✅ Fonctionnel | `Card`, `CardHeader`, `CardDescription`, `CardAction`                             | `activeLeads`, `byStatus`                                    |
| 5   | AvgScoreCard       | ✅ Fonctionnel | `Card`, `CardHeader`, `CardDescription`, `CardAction`                             | `avgQualificationScore`, `avgFitScore`, `avgEngagementScore` |
| 6   | TimeToConvertCard  | ✅ Fonctionnel | `Card`, `CardHeader`, `CardDescription`, `CardAction`                             | `avgDays`                                                    |
| 7   | LeadBySourceCard   | ⬜ Placeholder | `Card`, `CardHeader`, `CardTitle`, `CardContent`                                  | `sources` (reçu mais ignoré)                                 |
| 8   | SalesPipelineCard  | ⬜ Placeholder | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`               | `byStatus` (reçu mais ignoré)                                |
| 9   | RecentTasksCard    | ⬜ Placeholder | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`               | Aucun                                                        |
| 10  | LeadsOverTimeCard  | ⬜ Placeholder | `Card`, `CardHeader`, `CardTitle`, `CardContent`                                  | `timeSeries` (reçu mais ignoré)                              |
| 11  | TopSourcesCard     | ⬜ Placeholder | `Card`, `CardHeader`, `CardTitle`, `CardContent`                                  | `sources` (reçu mais ignoré)                                 |
| —   | DateRangePicker    | ✅ Fonctionnel | `Button`, `Popover`, `Calendar`, `ToggleGroup`, `Tooltip`, `Select`               | `value`, `onChange`                                          |

### Architecture technique

| Aspect        | Implémentation                                                                            |
| ------------- | ----------------------------------------------------------------------------------------- |
| Data fetching | React Query (`@tanstack/react-query`) via `useDashboardData` hook                         |
| API           | `GET /api/v1/crm/leads/stats?start_date=...&end_date=...`                                 |
| Types         | `DashboardData` interface dans `dashboard.types.ts` — fortement typé                      |
| Loading       | `DashboardSkeleton` (4+2+3 Skeleton rectangles)                                           |
| i18n          | `useTranslation("crm")` — namespace `dashboard.*`                                         |
| Date range    | Default: 30 derniers jours (`subDays(today, 29)` → `endOfDay(today)`)                     |
| Presets       | today, yesterday, this_week, last_7_days, last_28_days, this_month, last_month, this_year |

### Ce qui est DÉJÀ BIEN FAIT (conforme shadcnuikit)

1. **Pattern KPI Card** — Identique à shadcnuikit : `Card > CardHeader > CardDescription + h4.font-display.text-2xl.lg:text-3xl + trend + CardAction > icon circle (size-12 rounded-full bg-muted border)`
2. **TargetCard** — RadialBarChart via `ChartContainer` + `ChartConfig` avec `var(--primary)`
3. **DateRangePicker** — Popover + Calendar + ToggleGroup presets (copie fidèle shadcnuikit)
4. **Architecture modulaire** — 1 fichier = 1 widget, barrel export, types dédiés
5. **React Query** — Mieux que shadcnuikit (qui n'a aucun data fetching)
6. **Trend colors** — `text-green-600` / `text-red-600` (identique shadcnuikit)

---

## Phase B — shadcnuikit CRM Dashboard (Cible)

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Header: h1 + DateRangePicker + Download button      │
├──────────────────────────────────────────────────────┤
│  ROW 1: 4 KPI cards                                  │
│  grid gap-4 md:grid-cols-2 xl:grid-cols-4            │
│  [TargetCard] [TotalCustomers] [TotalDeals] [Revenue]│
├──────────────────────────────────────────────────────┤
│  ROW 2: 3 chart/widget cards                         │
│  grid gap-4 xl:grid-cols-3                           │
│  [LeadBySource] [RecentTasks] [SalesPipeline]        │
├──────────────────────────────────────────────────────┤
│  ROW 3: Data table (full width)                      │
│  [LeadsCard]                                         │
└──────────────────────────────────────────────────────┘
```

### Inventaire — 8 widgets

| #   | Widget             | Type                                    | Composants clés                                                                                   |
| --- | ------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | TargetCard         | KPI + radial progress 60px              | `ChartContainer`, `RadialBarChart`                                                                |
| 2   | TotalCustomersCard | KPI stat + trend                        | `CardDescription` + `CardAction` (icon circle)                                                    |
| 3   | TotalDeals         | KPI stat + trend                        | Identique pattern #2                                                                              |
| 4   | TotalRevenueCard   | KPI stat + trend                        | Identique pattern #2                                                                              |
| 5   | LeadBySourceCard   | **Donut PieChart** + legend horizontale | `ChartContainer`, `PieChart`, `Pie` (innerRadius=60), center label total, `ChartTooltip`          |
| 6   | RecentTasks        | **Checklist interactive**               | `Checkbox`, priority badges (red/amber/green), strikethrough on complete, `CardAction` "Add Task" |
| 7   | SalesPipeline      | **Stacked bar + breakdown list**        | Barre `h-4 rounded-full` empilée + `Progress` bars + `Tooltip` sur segments                       |
| 8   | LeadsCard          | **TanStack DataTable**                  | `@tanstack/react-table`, row selection, column sort/filter/visibility, `DropdownMenu` actions     |

### Détail des 3 widgets chart/list (cibles pour les placeholders)

#### B5 — LeadBySourceCard (Donut)

```tsx
<Card className="flex flex-col">
  <CardHeader>
    <CardTitle>Leads by Source</CardTitle>
    <CardAction>
      <ExportButton />
    </CardAction>
  </CardHeader>
  <CardContent className="flex-1">
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="leads"
          nameKey="source"
          innerRadius={60}
          strokeWidth={5}
        >
          <Label content={/* center: total number + "Leads" subtitle */} />
        </Pie>
      </PieChart>
    </ChartContainer>
    {/* Legend row */}
    <div className="flex justify-around">
      {data.map((item) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className="block size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <div className="text-xs tracking-wide uppercase">{label}</div>
          </div>
          <div className="ms-3.5 text-lg font-semibold">{count}</div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

**Couleurs** : `var(--chart-1)` à `var(--chart-4)` via `ChartConfig`

#### B6 — RecentTasks (Checklist)

```tsx
<Card className="h-full">
  <CardHeader>
    <CardTitle>Tasks</CardTitle>
    <CardDescription>Track and manage your upcoming tasks.</CardDescription>
    <CardAction>
      <Button variant="outline" size="sm">
        <PlusCircleIcon /> Add Task
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent className="space-y-3">
    {tasks.map((task) => (
      <div
        className={cn(
          "flex items-start space-x-3 rounded-md border p-3 transition-colors",
          task.completed && "bg-muted/50"
        )}
      >
        <Checkbox checked={task.completed} className="mt-1" />
        <div className="space-y-1">
          <p
            className={cn(
              "text-sm font-medium",
              task.completed && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </p>
          <p
            className={cn(
              "text-muted-foreground text-xs",
              task.completed && "line-through"
            )}
          >
            {task.description}
          </p>
          <div className="flex items-center pt-1">
            <div
              className={cn(
                "mr-2 rounded-full px-2 py-0.5 text-xs font-medium",
                priority === "high" && "bg-red-100 text-red-700",
                priority === "medium" && "bg-amber-100 text-amber-700",
                priority === "low" && "bg-green-100 text-green-700"
              )}
            >
              {priority}
            </div>
            <span className="text-muted-foreground text-xs">Due {dueDate}</span>
          </div>
        </div>
      </div>
    ))}
  </CardContent>
</Card>
```

#### B7 — SalesPipeline (Stacked bar + Progress)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Sales Pipeline</CardTitle>
    <CardDescription>Current deals in your sales pipeline.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Stacked horizontal bar */}
    <TooltipProvider>
      <div className="mb-6 flex h-4 w-full overflow-hidden rounded-full">
        {stages.map((stage) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`${stage.color} h-full`}
                style={{ width: `${(stage.value / total) * 100}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{stage.name}</p>
              <p className="text-xs">{stage.count} leads</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
    {/* Breakdown list */}
    <div className="space-y-4">
      {stages.map((stage) => (
        <div className="flex items-center gap-4">
          <div className={`h-3 w-3 rounded-full ${stage.color}`} />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <p className="text-sm font-medium">{stage.name}</p>
              <p className="text-muted-foreground text-xs">
                {stage.count} leads
              </p>
            </div>
            <div className="flex w-24 items-center gap-2">
              <Progress
                value={pct}
                className="h-2"
                indicatorColor={stage.color}
              />
              <span className="text-muted-foreground w-10 text-right text-xs">
                {pct}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

**Couleurs** : `var(--chart-1)` à `var(--chart-5)` via classes `bg-[var(--chart-N)]`

---

## Phase C — Comparatif widget par widget

### Widgets FONCTIONNELS — FleetCore vs shadcnuikit

| #   | Widget                             | FleetCore                                                                                                                                                                  | shadcnuikit                                                         | Verdict                                               |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | **TargetCard**                     | ✅ RadialBarChart + ChartContainer + `var(--primary)` + center label %                                                                                                     | RadialBarChart + ChartContainer + `var(--primary)` + center label % | ✅ **CONFORME** — copie fidèle                        |
| 2   | **TotalLeads** (≈ TotalCustomers)  | ✅ Card/CardHeader/CardDescription/CardAction + icon circle `size-12 bg-muted rounded-full border` + `font-display text-2xl lg:text-3xl` + `text-green-600`/`text-red-600` | Identique                                                           | ✅ **CONFORME** — pattern identique                   |
| 3   | **ConversionRate** (≈ TotalDeals)  | ✅ Même pattern + `qualified` count dans subtitle                                                                                                                          | Même pattern + "from last month"                                    | ✅ **CONFORME** — enrichi FleetCore (qualified count) |
| 4   | **PipelineValue** (≈ TotalRevenue) | ✅ Même pattern + "active in pipeline" subtitle                                                                                                                            | Même pattern + $ revenue                                            | ✅ **CONFORME** — métrique adaptée au B2B             |
| 5   | **AvgScore**                       | ✅ Même pattern KPI + fit/engagement breakdown                                                                                                                             | ❌ Absent shadcnuikit                                               | ✅ **BONUS FleetCore**                                |
| 6   | **TimeToConvert**                  | ✅ Même pattern KPI + jours                                                                                                                                                | ❌ Absent shadcnuikit                                               | ✅ **BONUS FleetCore**                                |
| —   | **DateRangePicker**                | ✅ Popover + Calendar + ToggleGroup + Select (mobile) + 8 presets                                                                                                          | Popover + Calendar + ToggleGroup + Select + 8 presets               | ✅ **CONFORME** — copie fidèle                        |

### Widgets PLACEHOLDER — FleetCore vs shadcnuikit

| #   | Widget                | FleetCore                                             | shadcnuikit                                                      | Écart                                   |
| --- | --------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- |
| 7   | **LeadBySourceCard**  | ⬜ Placeholder (data `sources` reçue mais ignorée)    | Donut PieChart + center label + ChartTooltip + legend horizontal | 🔴 **À IMPLÉMENTER**                    |
| 8   | **SalesPipelineCard** | ⬜ Placeholder (data `byStatus` reçue mais ignorée)   | Stacked bar + Progress bars + Tooltip                            | 🔴 **À IMPLÉMENTER**                    |
| 9   | **RecentTasksCard**   | ⬜ Placeholder (aucune data)                          | Checklist interactive + Checkbox + priority badges               | 🔴 **À IMPLÉMENTER**                    |
| 10  | **LeadsOverTimeCard** | ⬜ Placeholder (data `timeSeries` reçue mais ignorée) | ❌ Absent shadcnuikit                                            | 🟡 **À IMPLÉMENTER** (FleetCore unique) |
| 11  | **TopSourcesCard**    | ⬜ Placeholder (data `sources` reçue mais ignorée)    | ❌ Absent shadcnuikit                                            | 🟡 **À IMPLÉMENTER** (FleetCore unique) |

### Widget ABSENT (ni fonctionnel, ni placeholder)

| Widget shadcnuikit                 | FleetCore                             | Écart           |
| ---------------------------------- | ------------------------------------- | --------------- |
| **LeadsCard** (TanStack DataTable) | ❌ Aucun équivalent dans ce dashboard | 🟡 Décision CEO |

---

## Phase D — Les 5 placeholders à implémenter

### D1 — LeadBySourceCard (Donut chart)

**Fichier** : `features/crm/dashboard/components/widgets/lead-by-source-card.tsx`
**Data disponible** : `sources: Array<{ source: string; count: number }>` — déjà passée par la page
**Modèle shadcnuikit** : `leads-by-source.tsx` (B5)

**Implémentation requise** :

1. `ChartContainer` + `ChartConfig` avec `var(--chart-1)` à `var(--chart-N)`
2. Recharts `PieChart` + `Pie` avec `innerRadius={60}`, `strokeWidth={5}`
3. `Label` center : total count + "Leads" subtitle
4. `ChartTooltip` + `ChartTooltipContent hideLabel`
5. Legend horizontale : `flex justify-around` avec dot coloré + label uppercase + count bold
6. Traduire source keys via `t("dashboard.sources.{key}")`

**Données** : Dynamiques (API) — supérieur à shadcnuikit (statique)

### D2 — SalesPipelineCard (Stacked bar + breakdown)

**Fichier** : `features/crm/dashboard/components/widgets/sales-pipeline-card.tsx`
**Data disponible** : `byStatus: Record<string, number>` — déjà passée par la page
**Modèle shadcnuikit** : `sales-pipeline.tsx` (B7)

**Implémentation requise** :

1. Stacked horizontal bar : `flex h-4 w-full overflow-hidden rounded-full`
2. Chaque segment : width proportionnel, couleur `bg-[var(--chart-N)]`
3. `Tooltip` sur chaque segment (hover) : nom status + count leads
4. Breakdown list : `space-y-4`, chaque row = dot + label + count + `Progress h-2` + pourcentage
5. `Progress` component avec `indicatorColor` custom (vérifier si notre Progress supporte ce prop)
6. Couleurs : `var(--chart-1)` à `var(--chart-5)` pour les 5 principaux statuts
7. Traduire status keys via `t("leads.status.{key}")`

**Adaptation FleetCore** : 8 statuts (new, demo, proposal_sent, payment_pending, converted, lost, nurturing, disqualified) vs 5 stages shadcnuikit. Regrouper ou afficher les 8.

### D3 — RecentTasksCard (Checklist)

**Fichier** : `features/crm/dashboard/components/widgets/recent-tasks-card.tsx`
**Data disponible** : Aucune prop actuellement
**Modèle shadcnuikit** : `recent-tasks.tsx` (B6)

**Implémentation requise** :

1. Fetch des prochaines activités/tâches (source : `crm_activities` ou `crm_lead_activities`)
2. Composants : `Checkbox`, `Button` (Add Task), priority badges
3. Chaque task item : `rounded-md border p-3`, checkbox + title + description + priority pill + due date
4. Toggle complete : strikethrough + `bg-muted/50`
5. `CardAction` avec bouton "+ Add Task" (ou "Nouvelle activité")
6. `h-full` sur Card pour hauteur uniforme dans le grid

**Question CEO** : Quel concept mapper ?

- Option A : `crm_activities` prochaines (follow-ups, appels planifiés)
- Option B : Nouveau concept "task" dédié dashboard
- Option C : Afficher les prochains rendez-vous Cal.com

### D4 — LeadsOverTimeCard (Line chart) — EXCLUSIF FleetCore

**Fichier** : `features/crm/dashboard/components/widgets/leads-over-time-card.tsx`
**Data disponible** : `timeSeries: Array<{ week: string; count: number }>` — déjà passée
**Modèle** : Pas d'équivalent shadcnuikit — s'inspirer du pattern ChartContainer

**Implémentation requise** :

1. `ChartContainer` + `ChartConfig`
2. Recharts `LineChart` + `CartesianGrid` + `XAxis` + `YAxis` + `Line`
3. `ChartTooltip` + `ChartTooltipContent`
4. Line style : `type="monotone"`, stroke via `var(--chart-1)`, `strokeWidth={2}`
5. Dots : fill via var, activeDot plus grand
6. Grid : `strokeDasharray="3 3"`
7. Hauteur : `aspect-video` ou `h-[250px]`

### D5 — TopSourcesCard (Horizontal bar) — EXCLUSIF FleetCore

**Fichier** : `features/crm/dashboard/components/widgets/top-sources-card.tsx`
**Data disponible** : `sources: Array<{ source: string; count: number }>` (top 5, sliced par la page)
**Modèle** : Pas d'équivalent shadcnuikit — s'inspirer du pattern ChartContainer

**Implémentation requise** :

1. `ChartContainer` + `ChartConfig`
2. Recharts `BarChart layout="vertical"` + `Bar` + `XAxis type="number"` + `YAxis type="category"`
3. `ChartTooltip` + `ChartTooltipContent`
4. Bar : fill via `var(--chart-2)`, `radius={[0, 4, 4, 0]}`
5. YAxis width : ~100px pour les labels sources
6. Traduire source keys via `t("dashboard.sources.{key}")`

---

## Phase E — Écarts résiduels sur les widgets fonctionnels

Malgré une conformité globale, quelques différences mineures :

| Widget            | Écart                                                                                       | Sévérité  | Action                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------- |
| TotalLeadsCard    | `"use client"` — shadcnuikit est Server Component (pas de directive)                        | 🟢 Mineur | Acceptable — FleetCore utilise `useTranslation` qui nécessite "use client" |
| PipelineValueCard | `_byStatus` reçu mais inutilisé (préfixé `_`)                                               | 🟢 Mineur | Sera utile quand SalesPipeline sera implémenté — ou retirer le prop        |
| TargetCard        | `_qualifiedThisPeriod` inutilisé                                                            | 🟢 Mineur | Décider si l'afficher dans le texte descriptif                             |
| Tous KPI cards    | Pas de `"use client"` dans shadcnuikit (server components) — FleetCore les rend tous client | 🟢 Mineur | Acceptable car i18n client-side                                            |
| Row 2 grid        | `grid md:grid-cols-2 xl:grid-cols-4` mais seulement 2 cards → espace vide                   | 🟡 Moyen  | Ajuster grid ou fusionner Row 1+2                                          |

---

## Phase F — Éléments absents (ni fait, ni placeholder)

| Élément shadcnuikit       | Description                                                  | FleetCore                                                                 | Priorité     |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------ |
| **LeadsCard** (DataTable) | TanStack table full-width avec sort, filter, select, actions | ❌ Absent du dashboard CRM (existe dans `/crm/leads/reports/` séparément) | Décision CEO |
| **Download button**       | Bouton "Download" dans le header                             | ❌ Absent (existe dans Reports)                                           | 🟢 Faible    |
| **ExportButton per card** | `CardAction` avec dropdown Export sur LeadBySource           | ❌ Absent                                                                 | 🟢 Faible    |

### Page Reports vs Dashboard — Clarification

FleetCore a **deux pages distinctes** :

| Page              | URL                  | Contenu                                                         | Statut                             |
| ----------------- | -------------------- | --------------------------------------------------------------- | ---------------------------------- |
| **CRM Dashboard** | `/crm`               | KPI cards + charts + pipeline (ce document)                     | 6/11 widgets fonctionnels          |
| **Leads Reports** | `/crm/leads/reports` | QuickSearch + StatsCards + Charts + ColdFilter + Table + Export | Ancien dashboard, 100% custom HTML |

shadcnuikit n'a qu'**une seule page**. Le DataTable (LeadsCard) est intégré au dashboard. La question est : faut-il ajouter un DataTable au dashboard CRM FleetCore, ou la séparation Dashboard/Reports est-elle voulue ?

---

## Synthèse et actions

### Bilan global

| Catégorie                         | Count | Détail                                                                            |
| --------------------------------- | ----- | --------------------------------------------------------------------------------- |
| ✅ Widgets conformes shadcnuikit  | **6** | TargetCard, TotalLeads, ConversionRate, PipelineValue, AvgScore, TimeToConvert    |
| ✅ DateRangePicker conforme       | **1** | Popover + Calendar + presets                                                      |
| ⬜ Placeholders à implémenter     | **5** | LeadBySource, SalesPipeline, RecentTasks, LeadsOverTime, TopSources               |
| 🟡 Widget absent sans placeholder | **1** | LeadsCard (DataTable) — décision CEO                                              |
| 🔴 Couleurs hardcodées            | **0** | Les widgets fonctionnels utilisent déjà les tokens (`bg-muted`, `text-green-600`) |

### Comparaison avec l'audit V1 (erroné sur /reports)

| Aspect               | Audit V1 (Reports page) | Audit V2 (Dashboard CRM)              |
| -------------------- | ----------------------- | ------------------------------------- |
| Composants shadcn/ui | **0/8 widgets** (zéro)  | **6/11 widgets** conformes            |
| ChartContainer       | 0/3 charts              | 1/1 charts (TargetCard)               |
| Couleurs hardcodées  | 6 fichiers touchés      | **0 fichier** (tokens partout)        |
| React Query          | Non (fetch manual)      | ✅ Oui (`useDashboardData`)           |
| Types                | Non typé                | ✅ `DashboardData` + types par widget |
| Pattern KPI          | Custom divs             | ✅ Pattern shadcnuikit identique      |
| DateRangePicker      | Absent                  | ✅ Fonctionnel avec 8 presets         |

**Conclusion** : Le dashboard CRM est en **bien meilleur état** que ce que l'audit V1 laissait croire. L'architecture est solide, les patterns shadcnuikit sont respectés sur les 6 KPI cards. **Le travail restant se concentre sur les 5 placeholders** — dont 3 ont un modèle direct dans shadcnuikit et 2 sont des exclusivités FleetCore.

### Actions immédiates (ZÉRO décision CEO requise)

| #   | Action                        | Fichier                    | Données                   | Modèle                                  |
| --- | ----------------------------- | -------------------------- | ------------------------- | --------------------------------------- |
| 1   | Implémenter LeadBySourceCard  | `lead-by-source-card.tsx`  | `sources` (déjà passé)    | shadcnuikit B5 (donut)                  |
| 2   | Implémenter SalesPipelineCard | `sales-pipeline-card.tsx`  | `byStatus` (déjà passé)   | shadcnuikit B7 (stacked bar + progress) |
| 3   | Implémenter LeadsOverTimeCard | `leads-over-time-card.tsx` | `timeSeries` (déjà passé) | ChartContainer + LineChart              |
| 4   | Implémenter TopSourcesCard    | `top-sources-card.tsx`     | `sources` (déjà passé)    | ChartContainer + BarChart vertical      |

### Action nécessitant décision CEO

| #   | Question                                                      | Options                                                                                                              |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 5   | **RecentTasksCard** — quel contenu afficher ?                 | A) Prochaines activités CRM (`crm_activities` scheduled) / B) Prochains rendez-vous Cal.com / C) Laisser placeholder |
| 6   | **LeadsCard DataTable** — ajouter au dashboard CRM ?          | A) Oui (comme shadcnuikit) / B) Non (la page Reports suffit)                                                         |
| 7   | **Row 2 grid** — 2 KPI cards dans un grid xl:4 laisse du vide | A) Fusionner Row 1 + Row 2 en 6 cards (grid xl:3 × 2 rows) / B) Garder séparé                                        |

---

## Annexe — Fichiers lus

### FleetCore Dashboard CRM (16 fichiers)

1. `app/[locale]/(app)/crm/page.tsx`
2. `features/crm/dashboard/components/crm-dashboard-page.tsx`
3. `features/crm/dashboard/components/date-range-picker.tsx`
4. `features/crm/dashboard/components/widgets/index.ts`
5. `features/crm/dashboard/components/widgets/target-card.tsx`
6. `features/crm/dashboard/components/widgets/total-leads-card.tsx`
7. `features/crm/dashboard/components/widgets/conversion-rate-card.tsx`
8. `features/crm/dashboard/components/widgets/pipeline-value-card.tsx`
9. `features/crm/dashboard/components/widgets/avg-score-card.tsx`
10. `features/crm/dashboard/components/widgets/time-to-convert-card.tsx`
11. `features/crm/dashboard/components/widgets/lead-by-source-card.tsx`
12. `features/crm/dashboard/components/widgets/sales-pipeline-card.tsx`
13. `features/crm/dashboard/components/widgets/recent-tasks-card.tsx`
14. `features/crm/dashboard/components/widgets/leads-over-time-card.tsx`
15. `features/crm/dashboard/components/widgets/top-sources-card.tsx`
16. `features/crm/dashboard/hooks/use-dashboard-data.ts`
17. `features/crm/dashboard/types/dashboard.types.ts`

### shadcnuikit CRM (10 fichiers)

1. `app/dashboard/(auth)/crm/page.tsx`
2. `crm/components/target-card.tsx`
3. `crm/components/total-customers.tsx`
4. `crm/components/total-deals.tsx`
5. `crm/components/total-revenue.tsx`
6. `crm/components/leads-by-source.tsx`
7. `crm/components/recent-tasks.tsx`
8. `crm/components/sales-pipeline.tsx`
9. `crm/components/leads.tsx`
10. `components/custom-date-range-picker.tsx`
