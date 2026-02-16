# FLEETCORE CRM — AUDIT EXHAUSTIF DE REFERENCE

> Document de reference permanent — Fevrier 2026
> Sources: atomic-crm, shadcnuikit, kiranism, shadcn-admin-kit, FleetCore CRM actuel

---

## PARTIE 1 — ATOMIC-CRM : AUDIT FONCTIONNEL

### 1.1 Vue d'ensemble

**Framework**: React-Admin (ra-core) + shadcn-admin-kit (UI layer)
**Backend**: Supabase (auth + dataProvider) ou FakeRest (demo)
**Build**: Vite
**Entities**: Contacts, Companies, Deals, Notes, Tags, Tasks, Sales (team)
**Mobile**: Layout responsive dedié (MobileLayout, MobileDashboard)

### 1.2 Dashboard

**Fichier**: `src/components/atomic-crm/dashboard/Dashboard.tsx`

| Widget               | Description                                  | Donnees                                             |
| -------------------- | -------------------------------------------- | --------------------------------------------------- |
| DashboardStepper     | Onboarding 2 etapes (1er contact, 1ere note) | contacts count, notes count                         |
| HotContacts          | Contacts recemment actifs                    | contacts sorted by last_seen                        |
| DealsChart           | Graphique pipeline deals                     | deals aggregation par stage                         |
| DashboardActivityLog | Timeline activite recente                    | activities (created contacts/companies/deals/notes) |
| TasksList            | Liste de taches a faire                      | tasks non completees                                |
| Welcome              | Message de bienvenue (demo only)             | —                                                   |

**Layout**: Grid 12 colonnes (3 + 6 + 3)

### 1.3 Contacts

**Fichiers**: `src/components/atomic-crm/contacts/`

**List View** (`ContactList.tsx`):

- InfiniteListBase (pagination infinie)
- Tri: first_name, last_name, last_seen
- Actions: Sort, Import (CSV), Export (CSV/vCard), Create
- Sidebar filter panel (permanent, pas de dropdown)
- BulkActionsToolbar pour actions groupees
- ContactListContent: cards (pas de table)

**Detail View** (`ContactShow.tsx`):

- ContactAside: avatar, infos resume, tags
- Sections: Personal Info, Background Info, Notes, Tasks
- Actions: Edit (sheet), Delete

**Create/Edit** (`ContactCreate.tsx`, `ContactEdit.tsx`):

- Sheet overlay (pas de page separee)
- Fields: first_name, last_name, gender, title, company_id (autocomplete), email_jsonb (array), phone_jsonb (array), linkedin_url, has_newsletter, tags, avatar, sales_id, background
- Validation: Zod schemas via ra-core

**Import** (`ContactImportButton.tsx`, `useContactImport.tsx`):

- Upload CSV avec mapping de colonnes
- Preview avant import
- usePapaParse pour parsing CSV

**Export** (`ExportVCardButton.tsx`, exporter in ContactList):

- CSV (jsonexport library)
- vCard format
- Export avec relations resolues (company name, sales name, tags)

**Merge** (`ContactMergeButton.tsx`):

- Deduplication: selection de 2+ contacts → merge

### 1.4 Companies

**Fichiers**: `src/components/atomic-crm/companies/`

**List View** (`CompanyList.tsx`):

- GridList layout (cards en grille, pas table)
- CompanyCard: logo, nom, secteur, nb_contacts, nb_deals
- Filter: search, sector, size
- Actions: Create, Export

**Detail View** (`CompanyShow.tsx`):

- CompanyAside: logo, infos resume
- Sections: description, contacts lies, deals lies, notes

**Create/Edit** (`CompanyCreate.tsx`, `CompanyEdit.tsx`):

- Sheet overlay
- Fields: name, logo (image upload), sector, size (dropdown), linkedin_url, website, phone_number, address, zipcode, city, state_abbr, country, description, revenue, tax_identifier, context_links (array), sales_id

### 1.5 Deals (Pipeline Kanban)

**Fichiers**: `src/components/atomic-crm/deals/`

**Kanban View** (`DealList.tsx` → `DealListContent.tsx`):

- DragDropContext (@hello-pangea/dnd)
- Colonnes par stage (configurable via ConfigurationContext)
- DealColumn: header avec label + total amount
- DealCard: name, company, amount, expected_closing_date, contacts
- Drag & drop avec:
  - Optimistic update local (synchrone)
  - Persistence API (asynchrone, reindex tous les deals)
- Filters: search (q), company_id, category, OnlyMine
- Actions: FilterButton, ExportButton, CreateButton

**Detail View** (`DealShow.tsx`):

- Sheet overlay
- Sections: info, contacts, notes, timeline

**Create/Edit** (`DealCreate.tsx`, `DealEdit.tsx`):

- Sheet overlay
- Fields: name, company_id, contact_ids (multi), category, stage, description, amount, expected_closing_date, sales_id

**Archived Deals** (`DealArchivedList.tsx`):

- Liste separee des deals archives
- Accessible depuis la page deals

### 1.6 Notes

**Fichiers**: `src/components/atomic-crm/notes/`

- Attachees a: Contacts (contact_notes) OU Deals (deal_notes)
- NotesIterator: liste de notes avec scroll
- NoteCreate: markdown editor + attachments + status selector
- NoteShowPage: page dediee pour notes mobile
- Statuses: configurable (cold, warm, hot, etc.)
- Attachments: file upload (images, documents)

### 1.7 Tasks

**Fichiers**: `src/components/atomic-crm/tasks/`

- Attachees a: Contacts (contact_id)
- Types: configurable (call, email, meeting, etc.)
- Fields: contact_id, type, text, due_date, done_date, sales_id
- TasksIterator: liste avec filtres (all, today, this week)
- AddTask: formulaire inline
- TaskEdit: sheet overlay
- MobileTasksList: vue dediee mobile

### 1.8 Tags

**Fichiers**: `src/components/atomic-crm/tags/`

- Systeme de tags colores
- Attachable a: Contacts
- CRUD: TagCreateModal, TagEditModal, TagDialog
- Colors: palette predefinee
- TagChip: composant badge reutilisable

### 1.9 Activity Log

**Fichiers**: `src/components/atomic-crm/activity/`

- Types: COMPANY_CREATED, CONTACT_CREATED, CONTACT_NOTE_CREATED, DEAL_CREATED, DEAL_NOTE_CREATED
- ActivityLogIterator: timeline avec icones par type
- Context: ActivityLogContext (filtrage par entite)

### 1.10 Settings

**Fichier**: `src/components/atomic-crm/settings/SettingsPage.tsx`

- Page custom (hors CRUD standard)
- Configuration: import data from JSON

### 1.11 Navigation

- Layout: sidebar avec liens (Dashboard, Contacts, Companies, Deals, Sales)
- Header: search global, theme toggle, user menu
- MobileLayout: bottom navigation
- Breadcrumbs: via react-router

---

## PARTIE 2 — ATOMIC-CRM : AUDIT TECHNIQUE

### 2.1 Data Model

```
Contact {
  first_name, last_name, title, gender, status, background
  email_jsonb: EmailAndType[]    // [{email, type: "Work"|"Home"|"Other"}]
  phone_jsonb: PhoneNumberAndType[]
  avatar: RAFile
  company_id -> Company
  sales_id -> Sale
  tags: Identifier[]  -> Tag[]
  linkedin_url, has_newsletter
  first_seen, last_seen
  nb_tasks (computed)
}

Company {
  name, logo: RAFile, sector, size (1|10|50|250|500)
  linkedin_url, website, phone_number
  address, zipcode, city, state_abbr, country
  description, revenue, tax_identifier
  context_links: string[]
  sales_id -> Sale
  nb_contacts, nb_deals (computed)
}

Deal {
  name, description, category, stage, amount, index
  company_id -> Company
  contact_ids: Identifier[] -> Contact[]
  sales_id -> Sale
  expected_closing_date, created_at, updated_at, archived_at
}

ContactNote { contact_id, text, date, sales_id, status, attachments: RAFile[] }
DealNote { deal_id, text, date, sales_id, attachments: RAFile[] }
Task { contact_id, type, text, due_date, done_date, sales_id }
Tag { name, color }
Sale { first_name, last_name, email, avatar, administrator, disabled, user_id }
```

### 2.2 Patterns techniques

| Pattern              | Implementation                                | Fichiers                                     |
| -------------------- | --------------------------------------------- | -------------------------------------------- |
| DataProvider         | Supabase adapter (CRUD + filters)             | `providers/supabase/dataProvider.ts`         |
| AuthProvider         | Supabase auth (email/password + OAuth)        | `providers/supabase/authProvider.ts`         |
| ConfigurationContext | React Context pour config dynamique           | `root/ConfigurationContext.tsx`              |
| i18n                 | ra-core i18nProvider (polyglot)               | `root/i18nProvider.tsx`                      |
| Sheet overlays       | Create/Edit via Sheet (pas de pages separees) | `misc/CreateSheet.tsx`, `misc/EditSheet.tsx` |
| Kanban DnD           | @hello-pangea/dnd + optimistic updates        | `deals/DealListContent.tsx`                  |
| CSV Import           | Papa Parse + preview                          | `contacts/useContactImport.tsx`              |
| CSV Export           | jsonexport + downloadCSV (ra-core)            | `contacts/ContactList.tsx` (exporter)        |
| Infinite scroll      | InfiniteListBase + InfinitePagination         | `contacts/ContactList.tsx`                   |
| Markdown             | Markdown rendering in notes                   | `misc/Markdown.tsx`                          |
| Image editor         | Avatar upload + crop                          | `misc/ImageEditorField.tsx`                  |
| Mobile offline       | PersistQueryClient + localStorage             | `root/CRM.tsx` (MobileAdmin)                 |

### 2.3 Dependencies cles

```
ra-core                    # React-Admin core (headless)
@hello-pangea/dnd          # Drag & drop (fork react-beautiful-dnd)
@supabase/supabase-js      # Backend
@tanstack/react-query       # Data fetching (via ra-core)
jsonexport                 # CSV export
papaparse                  # CSV import
```

---

## PARTIE 3 — SHADCNUIKIT : PAGES CRM

### 3.1 Vue d'ensemble

**Framework**: Next.js (App Router)
**UI**: shadcn/ui + Tailwind CSS
**Type**: Template/kit de dashboards (pas de backend reel, donnees statiques)
**Path**: `app/dashboard/(auth)/crm/`

### 3.2 CRM Dashboard Page

**Fichier**: `app/dashboard/(auth)/crm/page.tsx`

**Layout**: Header (titre + DateRangePicker + Download button) → Cards grid → Charts grid → Table

**Composants**:

| Composant          | Description                        | Pattern                       |
| ------------------ | ---------------------------------- | ----------------------------- |
| TargetCard         | KPI avec progress bar vers target  | Card + Progress               |
| TotalCustomersCard | Nombre total clients               | Card + trend arrow            |
| TotalDeals         | Nombre total deals                 | Card + trend arrow            |
| TotalRevenueCard   | Revenue total                      | Card + trend arrow            |
| LeadBySourceCard   | Donut chart sources leads          | Card + Recharts PieChart      |
| RecentTasks        | Liste taches recentes              | Card + list items             |
| SalesPipeline      | Pipeline visuel avec progress bars | Card + stacked bar + Progress |
| LeadsCard          | Table TanStack avec leads          | Card + DataTable              |

### 3.3 Leads Table (`leads.tsx`)

- TanStack Table standard (sorting, filtering, column visibility, row selection)
- Columns: select, status, email, amount, actions
- Filter: email input
- Column visibility dropdown
- Pagination: Previous/Next buttons
- Actions dropdown: Copy ID, View customer, View details
- **Donnees statiques** (hardcoded array de 5 items)

### 3.4 Sales Pipeline (`sales-pipeline.tsx`)

- Stacked horizontal bar (Lead → Qualified → Proposal → Negotiation → Closed Won)
- Progress bars par stage
- Count + value par stage
- Tooltips avec details
- **Donnees statiques** (hardcoded)

### 3.5 Autres apps CRM-pertinentes

| App          | Path                  | Pertinence CRM            |
| ------------ | --------------------- | ------------------------- |
| Kanban       | `apps/kanban/`        | Board type Trello         |
| Calendar     | `apps/calendar/`      | Planification rendez-vous |
| Tasks        | `apps/tasks/`         | Gestion taches            |
| Todo List    | `apps/todo-list-app/` | Liste de taches           |
| Mail         | `apps/mail/`          | Interface email           |
| Chat         | `apps/chat/`          | Communication             |
| Notes        | `apps/notes/`         | Prise de notes            |
| File Manager | `apps/file-manager/`  | Gestion documents         |

### 3.6 Patterns reutilisables

- **CustomDateRangePicker**: composant de filtre date avec presets
- **Card + KPI pattern**: titre, valeur, trend, sparkline
- **Stacked progress bar**: pipeline visualization
- **DataTable inline**: table TanStack integree dans une Card

---

## PARTIE 4 — KIRANISM : PATTERNS TECHNIQUES

### 4.1 Vue d'ensemble

**Framework**: Next.js (App Router)
**UI**: shadcn/ui + Tailwind CSS
**State**: Zustand (persist middleware)
**DnD**: @dnd-kit/core + @dnd-kit/sortable
**Charts**: Recharts
**Type**: Admin dashboard template (products, kanban, overview)

### 4.2 use-data-table Hook

**Fichier**: `src/hooks/use-data-table.ts`

Hook complet pour TanStack Table avec **URL state** via `nuqs`:

- Pagination → `?page=1&perPage=10` (URL params)
- Sorting → `?sort=name.asc` (URL params)
- Column filters → URL params dynamiques par colonne
- Column visibility → React state
- Row selection → React state
- Debounce (300ms) + Throttle (50ms) sur filters
- `manualPagination: true`, `manualSorting: true`, `manualFiltering: true`
- Faceted values: getFacetedRowModel, getFacetedUniqueValues, getFacetedMinMaxValues

**Pattern cle**: Toutes les operations de filtering/sorting/pagination sont synchronisees avec l'URL pour le server-side processing. C'est le pattern ideal pour Refine/Next.js.

### 4.3 Kanban Board

**Fichiers**: `src/features/kanban/`

**Store** (`utils/store.ts`):

- Zustand avec persist middleware (localStorage, skipHydration)
- State: tasks[], columns[], draggedTask
- Actions: addTask, addCol, removeTask, removeCol, setTasks, setCols, updateCol, dragTask

**Board** (`components/kanban-board.tsx`):

- DndContext (@dnd-kit/core)
- SortableContext (@dnd-kit/sortable)
- DragOverlay avec createPortal
- Sensors: MouseSensor + TouchSensor
- Announcements pour accessibilite (screen readers)
- BoardColumn: sortable columns
- TaskCard: sortable cards dans columns
- NewSectionDialog: ajouter nouvelle colonne

**Pattern cle**: @dnd-kit offre plus de controle que @hello-pangea/dnd — sortable columns ET tasks, custom announcements, keyboard support.

### 4.4 Overview Dashboard

**Fichiers**: `src/features/overview/components/`

| Composant   | Type                             | Library             |
| ----------- | -------------------------------- | ------------------- |
| AreaGraph   | Area chart                       | Recharts            |
| BarGraph    | Bar chart                        | Recharts            |
| PieGraph    | Pie/Donut chart                  | Recharts            |
| RecentSales | Liste ventes recentes            | Custom list         |
| \*Skeleton  | Loading states pour chaque chart | Skeleton components |

### 4.5 Products (Table CRUD)

**Fichiers**: `src/features/products/components/`

- ProductListing: page liste avec DataTable
- product-tables/columns.tsx: column definitions
- product-tables/cell-action.tsx: actions dropdown
- ProductForm: formulaire create/edit
- ProductViewPage: page detail

### 4.6 Autres hooks utiles

| Hook                   | Fichier | Description                       |
| ---------------------- | ------- | --------------------------------- |
| use-breadcrumbs        | hooks/  | Breadcrumbs dynamiques            |
| use-debounce           | hooks/  | Debounce generique                |
| use-debounced-callback | hooks/  | Callback debounce                 |
| use-media-query        | hooks/  | Media query responsive            |
| use-mobile             | hooks/  | Detection mobile                  |
| use-multistep-form     | hooks/  | Formulaires multi-etapes          |
| use-nav                | hooks/  | Navigation sidebar                |
| use-controllable-state | hooks/  | State controlable/non-controlable |

---

## PARTIE 5 — SHADCN-ADMIN-KIT : COMPOSANTS CRM

### 5.1 Vue d'ensemble

**Framework**: React-Admin (ra-core)
**UI**: shadcn/ui (remplacement MUI pour React-Admin)
**Build**: Vite
**Type**: Kit de composants admin headless avec demo
**Relation**: atomic-crm utilise shadcn-admin-kit comme UI layer

### 5.2 Composants Admin (72+ fichiers)

**Fichiers**: `src/components/admin/`

Chaque composant shadcn/ui est adapte pour React-Admin:

**Data Display**:

- `data-table.tsx` — DataTable avec `DataTable.Col`, `DataTable.NumberCol`, responsive hiding
- `text-field.tsx`, `number-field.tsx`, `date-field.tsx`, `email-field.tsx`
- `reference-field.tsx`, `reference-array-field.tsx`, `reference-many-field.tsx`
- `badge-field.tsx`, `file-field.tsx`, `select-field.tsx`
- `array-field.tsx`, `single-field-list.tsx`
- `record-field.tsx`, `reference-many-count.tsx`, `count.tsx`

**Form Inputs**:

- `text-input.tsx`, `number-input.tsx`, `date-input.tsx`, `date-time-input.tsx`
- `boolean-input.tsx`, `select-input.tsx`, `radio-button-group-input.tsx`
- `autocomplete-input.tsx`, `autocomplete-array-input.tsx`
- `reference-input.tsx`, `reference-array-input.tsx`
- `file-input.tsx`, `array-input.tsx`, `simple-form-iterator.tsx`
- `search-input.tsx`

**Layout**:

- `layout.tsx` — Sidebar + TopBar
- `app-sidebar.tsx` — Navigation laterale
- `breadcrumb.tsx` — Fil d'Ariane
- `simple-form.tsx` — Formulaire avec validation
- `simple-show-layout.tsx` — Layout detail

**CRUD Pages**:

- `list.tsx` — Liste avec filters + actions
- `create.tsx`, `edit.tsx`, `show.tsx` — Pages CRUD
- `list-pagination.tsx` — Pagination
- `filter-form.tsx` — Formulaire de filtres

**Actions**:

- `create-button.tsx`, `edit-button.tsx`, `show-button.tsx`, `delete-button.tsx`
- `export-button.tsx`, `bulk-export-button.tsx`
- `bulk-actions-toolbar.tsx`, `bulk-delete-button.tsx`
- `columns-button.tsx` — Toggle colonnes visibles
- `sort-button.tsx` — Tri multi-champ
- `saved-queries.tsx` — Vues sauvegardees
- `refresh-button.tsx`, `cancel-button.tsx`

**Misc**:

- `notification.tsx` — Toast notifications
- `confirm.tsx` — Dialog de confirmation
- `loading.tsx`, `spinner.tsx` — Loading states
- `error.tsx` — Error display
- `login-page.tsx` — Page login
- `locales-menu-button.tsx` — i18n switcher

### 5.3 Demo: Dashboard

**Fichier**: `src/demo/dashboard/Dashboard.tsx`

| Widget         | Description                    |
| -------------- | ------------------------------ |
| Welcome        | Message de bienvenue           |
| MonthlyRevenue | KPI card                       |
| NbNewOrders    | KPI card                       |
| OrderChart     | Graphique commandes (30 jours) |
| PendingOrders  | Liste commandes en attente     |
| PendingReviews | Reviews a moderer              |
| NewCustomers   | Nouveaux clients               |

### 5.4 Demo: Customers (= Contacts CRM)

**Fichier**: `src/demo/customers/CustomerList.tsx`

- DataTable avec colonnes: FullName, nb_orders, total_spent, last_seen, groups (badges)
- SidebarFilters permanent (pas de dropdown): Last Visited (presets temporels), Has Ordered, Has Newsletter, Group (segments)
- ToggleFilterButton: boutons toggle pour chaque filtre
- FilterCategory: section avec icone + label
- Responsive: colonnes hidden sur mobile
- ListPagination
- Actions: CreateButton, ColumnsButton, ExportButton

**Pattern cle**: Le pattern SidebarFilters + ToggleFilterButton est excellent pour un CRM — filtres visuels toujours visibles.

### 5.5 Demo: Orders

- OrderList: table avec colonnes, filtres
- OrderEdit: formulaire edition
- Basket: panier de commande
- Totals: calculs prix

### 5.6 Demo: Products

- ProductList, ProductCreate, ProductEdit
- CRUD standard avec images

---

## PARTIE 6 — FLEETCORE CRM : ETAT ACTUEL

### 6.1 Architecture Backend (9/10)

**Services** (`lib/services/crm/` — 15+ services):

| Service                     | Responsabilite                                     | Statut   |
| --------------------------- | -------------------------------------------------- | -------- |
| lead-creation.service       | Orchestration creation lead + scoring + assignment | Complete |
| lead-scoring.service        | Calcul scores fit/engagement/qualification         | Complete |
| lead-assignment.service     | Auto-assignation selon regles                      | Complete |
| lead-qualification.service  | Framework CPT (Challenges, Priority, Timing)       | Complete |
| lead-status.service         | Transitions statut avec validation workflow        | Complete |
| lead.service                | Operations generales                               | Complete |
| email-verification.service  | Verification email                                 | Complete |
| country.service             | Pays + detection GDPR                              | Complete |
| blacklist.service           | Gestion blacklist                                  | Complete |
| wizard-lead.service         | Workflow wizard                                    | Complete |
| quote.service               | Operations devis + calculs                         | Complete |
| agreement.service           | Gestion contrats/accords                           | Complete |
| order.service               | Fulfillment + lifecycle commandes                  | Complete |
| nurturing.service           | Campagnes nurturing                                | Complete |
| opportunity-rotting.service | Detection deals stagnants + alertes                | Complete |

**Repositories** (`lib/repositories/crm/` — 8 repositories):

- lead, quote, agreement, order, country, settings, nurturing, blacklist

**API Routes** (`app/api/v1/crm/`):

- Leads: GET/POST/PATCH/DELETE + qualify + recalculate + export + stats
- Opportunities: GET/POST/PATCH/DELETE + stats
- Quotes: full CRUD + send + convert + version + stats
- Agreements: full CRUD + signature workflow + stats
- Orders: full CRUD + fulfill + cancel + stats
- Settings: GET/POST/PATCH + bulk

**Validators** (`lib/validators/`): Zod schemas pour tous les inputs

**Tests**: Unit + integration pour tous les services

### 6.2 Architecture Frontend (4/10)

**Pages CRM**:

| Page               | Path                 | Statut      | Problemes                                  |
| ------------------ | -------------------- | ----------- | ------------------------------------------ |
| Leads Kanban/Table | `/crm/leads`         | Fonctionnel | LeadsPageClient = 1104 LOC (god component) |
| Lead Detail        | `/crm/leads/[id]`    | Fonctionnel | LeadDetailCards = 737 LOC                  |
| Lead Browser       | `/crm/leads/browser` | Fonctionnel | LeadsBrowserClient = 690 LOC               |
| Lead Reports       | `/crm/leads/reports` | Fonctionnel | OK                                         |
| Opportunities      | `/crm/opportunities` | Fonctionnel | OpportunitiesPageClient = 710 LOC          |
| Quotes             | `/crm/quotes`        | Fonctionnel | OK                                         |
| Quote Create       | `/crm/quotes/new`    | Fonctionnel | QuoteForm = 692 LOC                        |
| Quote Detail       | `/crm/quotes/[id]`   | Fonctionnel | QuoteDetailClient = 618 LOC                |
| CRM Settings       | `/settings/crm`      | Fonctionnel | PipelineSettingsTab = 1293 LOC             |

**God Components (>650 LOC)**:

| Composant             | LOC  | Devrait etre                                           |
| --------------------- | ---- | ------------------------------------------------------ |
| PipelineSettingsTab   | 1293 | StageConfigurator + StagePreview + StageDragDrop       |
| LeadsPageClient       | 1104 | FilterProvider + ViewModeProvider + BulkActionsHandler |
| OpportunityDrawer     | 1021 | DetailView + FormSection + ActionsPanel                |
| LeadDrawerSections    | 903  | ContactSection + CompanySection + ScoringSection       |
| LeadsTableRow         | 895  | RowRenderer + RowActions + ContextMenu                 |
| OpportunitiesTableRow | 780  | RowRenderer + RowActions + ValueCell                   |
| LeadFormModal         | 768  | ContactFieldGroup + CompanyFieldGroup + FormActions    |
| LeadDetailCards       | 737  | ContactCard + CompanyCard + ScoringCard                |
| QuoteForm             | 692  | HeaderSection + LineItemsSection + SummarySection      |
| LeadsBrowserClient    | 690  | MasterList + DetailPanel + SearchHandler               |

### 6.3 Leads DataTable (nouveau systeme Refine)

**Fichiers recemment crees** (Mission 2):

| Fichier                                               | Description                                                |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| `hooks/use-data-table.ts`                             | Hook TanStack Table avec 12 features activees              |
| `components/ui/table/data-table.tsx`                  | DataTable generique avec virtualisation, pinning, grouping |
| `components/ui/table/data-table-toolbar.tsx`          | Toolbar avec global search                                 |
| `components/ui/table/data-table-column-header.tsx`    | Header avec sort, pin, group                               |
| `components/ui/table/data-table-density-toggle.tsx`   | Toggle densite                                             |
| `features/crm/leads/components/leads-list-page.tsx`   | Page table leads Refine                                    |
| `features/crm/leads/components/lead-columns.tsx`      | 84 colonnes TanStack                                       |
| `features/crm/leads/components/lead-expanded-row.tsx` | Contenu ligne expandee                                     |
| `features/crm/leads/hooks/use-leads-table.ts`         | Hook donnees leads                                         |
| `hooks/use-table-preferences.ts`                      | Persistence localStorage                                   |
| `lib/table-filters.ts`                                | Fuzzy filter + sort                                        |
| `lib/utils/table-export.ts`                           | Export CSV + Excel                                         |

**12 Features TanStack activees**:

1. Column Ordering (HTML5 drag)
2. Column Pinning (left/right)
3. Row Pinning (top/bottom)
4. Expanding (row detail)
5. Grouping (group by value)
6. Column Faceting
7. Global Faceting
8. Fuzzy Filtering (@tanstack/match-sorter-utils)
9. Virtualization (@tanstack/react-virtual, >100 rows)
10. Export CSV/Excel (xlsx library)
11. Density Toggle (compact/normal/comfortable)
12. Save/Load Views (localStorage)

### 6.4 Features manquantes

**Backend pret, pas d'UI**:

- Agreements/Contracts (API complete, 0 pages)
- Orders/Fulfillment (API complete, 0 pages)
- Activity Timeline (services OK, composants existent mais non integres)

**Pas de backend ni d'UI**:

- CRM Dashboard (aucune page de metriques)
- Contact Deduplication
- Bulk Import (CSV)
- Email Templates
- Workflow Automation
- Forecasting/Pipeline Analytics
- Calendar integration
- Custom Fields

**Frontend partiels (TODOs dans le code)**:

- Opportunities Export
- Opportunities locale support (labels en anglais)
- Lead GDPR section
- Leads export (API existe, bouton TODO)

---

## PARTIE 7 — MATRICE DE CORRESPONDANCE

### 7.1 Entities

| Feature              | atomic-crm                | shadcnuikit       | kiranism     | shadcn-admin-kit | FleetCore                 |
| -------------------- | ------------------------- | ----------------- | ------------ | ---------------- | ------------------------- |
| Contacts/Leads       | contacts                  | leads (table)     | —            | customers        | crm_leads (84 colonnes)   |
| Companies            | companies                 | —                 | —            | —                | via crm_leads fields      |
| Deals/Opportunities  | deals (kanban)            | pipeline (static) | —            | orders           | crm_opportunities         |
| Quotes/Devis         | —                         | —                 | —            | —                | crm_quotes + items        |
| Agreements/Contracts | —                         | —                 | —            | —                | crm_agreements (API only) |
| Orders               | —                         | —                 | —            | orders           | crm_orders (API only)     |
| Notes                | contact_notes, deal_notes | —                 | —            | reviews          | —                         |
| Tasks                | tasks                     | recent tasks      | kanban tasks | —                | —                         |
| Tags                 | tags (colored)            | —                 | —            | segments         | —                         |
| Activities           | activity log              | —                 | —            | —                | crm_activities (API only) |
| Sales Team           | sales                     | —                 | —            | —                | adm_provider_employees    |

### 7.2 Views

| View        | atomic-crm                             | shadcnuikit                           | kiranism                           | shadcn-admin-kit       | FleetCore                                    |
| ----------- | -------------------------------------- | ------------------------------------- | ---------------------------------- | ---------------------- | -------------------------------------------- |
| Dashboard   | widgets grid                           | KPI cards + charts + pipeline + table | area/bar/pie charts + recent sales | KPI + charts + pending | MANQUANT                                     |
| List/Table  | card list (contacts), grid (companies) | TanStack DataTable                    | TanStack DataTable (nuqs)          | DataTable (ra-admin)   | DataTable (12 features)                      |
| Kanban      | @hello-pangea/dnd (deals)              | —                                     | @dnd-kit (tasks)                   | —                      | Phase-based (leads), Stage-based (opps)      |
| Detail      | Sheet overlay                          | —                                     | Page dediee                        | —                      | Page + Drawer + Dialog                       |
| Create/Edit | Sheet overlay                          | —                                     | Page/Form                          | Sheet/Page             | Dialog (create) + Drawer (edit)              |
| Browser     | —                                      | —                                     | —                                  | —                      | Split view (master/detail)                   |
| Reports     | —                                      | —                                     | —                                  | —                      | Stats + charts + cold leads                  |
| Settings    | Import JSON                            | —                                     | —                                  | —                      | Pipeline + Loss Reasons + Rotting + Recovery |

### 7.3 Patterns techniques

| Pattern          | atomic-crm                 | shadcnuikit     | kiranism          | shadcn-admin-kit      | FleetCore                    |
| ---------------- | -------------------------- | --------------- | ----------------- | --------------------- | ---------------------------- |
| State management | ra-core + React Query      | React state     | Zustand (persist) | ra-core + React Query | React state + localStorage   |
| Data fetching    | DataProvider (Supabase)    | Static data     | nuqs URL state    | DataProvider          | Refine useTable + API routes |
| DnD library      | @hello-pangea/dnd          | —               | @dnd-kit/core     | —                     | Native HTML5 (columns)       |
| Table library    | ra-core DataTable          | TanStack Table  | TanStack Table    | ra-core DataTable     | TanStack Table               |
| Form library     | ra-core (react-hook-form)  | —               | react-hook-form   | ra-core               | react-hook-form + Zod        |
| URL state        | react-router               | —               | nuqs              | react-router          | Next.js searchParams         |
| i18n             | ra-core polyglot           | —               | —                 | ra-core polyglot      | react-i18next                |
| Charts           | —                          | Recharts        | Recharts          | —                     | —                            |
| Export           | jsonexport (CSV) + vCard   | —               | —                 | jsonexport            | xlsx + CSV custom            |
| Import           | Papa Parse (CSV)           | —               | —                 | —                     | MANQUANT                     |
| Mobile           | Dedicated layout + offline | Responsive only | Responsive        | Responsive            | Responsive                   |

---

## PARTIE 8 — PLAN D'IMPLEMENTATION

### 8.1 Priorite 1 — Restructuration frontend (en cours)

**Objectif**: Remplacer les god components par le nouveau systeme Refine DataTable.

| Etape | Description                                | Fichiers                                           | Statut   |
| ----- | ------------------------------------------ | -------------------------------------------------- | -------- |
| 1     | DataTable generique + 12 features TanStack | `components/ui/table/data-table.tsx` etc.          | FAIT     |
| 2     | Leads DataTable avec 84 colonnes           | `features/crm/leads/`                              | FAIT     |
| 3     | Create Dialog + Edit Drawer (Refine CRUD)  | `leads-create-dialog.tsx`, `leads-edit-drawer.tsx` | FAIT     |
| 4     | Remplacement page officielle `/crm/leads`  | `leads-view-router.tsx`, `page.tsx`                | EN COURS |
| 5     | Opportunities DataTable + Kanban           | `features/crm/opportunities/`                      | A FAIRE  |
| 6     | Quotes DataTable                           | `features/crm/quotes/`                             | A FAIRE  |

### 8.2 Priorite 2 — Features manquantes (backend pret)

| Feature           | Backend                  | Frontend                          | Inspiration                    |
| ----------------- | ------------------------ | --------------------------------- | ------------------------------ |
| Activity Timeline | crm_activities + actions | Integrer dans Lead/Opp detail     | atomic-crm ActivityLogIterator |
| Agreements UI     | API complete             | Pages list + detail + signature   | —                              |
| Orders UI         | API complete             | Pages list + detail + fulfillment | shadcn-admin-kit OrderList     |

### 8.3 Priorite 3 — CRM Dashboard

| Widget            | Donnees                               | Inspiration                     |
| ----------------- | ------------------------------------- | ------------------------------- |
| Total Leads       | crm_leads count                       | shadcnuikit TargetCard          |
| Conversion Rate   | leads → opportunities ratio           | shadcnuikit TotalDeals          |
| Pipeline Value    | crm_opportunities sum(expected_value) | shadcnuikit SalesPipeline       |
| Revenue           | crm_orders sum(total)                 | shadcn-admin-kit MonthlyRevenue |
| Leads by Source   | crm_leads group by source             | shadcnuikit LeadBySourceCard    |
| Leads by Status   | crm_leads group by status             | Recharts BarChart               |
| Activity Timeline | crm_activities recent                 | atomic-crm DashboardActivityLog |
| Tasks             | crm_activities type=task              | atomic-crm TasksList            |
| Deals in Stage    | crm_opportunities by stage            | shadcnuikit SalesPipeline       |
| Hot Leads         | crm_leads high score                  | atomic-crm HotContacts          |

### 8.4 Priorite 4 — Features nouvelles

| Feature             | Complexite | Inspiration                              |
| ------------------- | ---------- | ---------------------------------------- |
| CSV Import          | Medium     | atomic-crm useContactImport + Papa Parse |
| Contact Dedup       | Medium     | atomic-crm ContactMergeButton            |
| Email Templates     | High       | —                                        |
| Workflow Automation | High       | —                                        |
| Forecasting         | Medium     | —                                        |
| Custom Fields       | High       | —                                        |

### 8.5 Patterns a adopter de chaque source

**De atomic-crm**:

- Sheet overlay pour Create/Edit rapide (deja fait: Dialog/Drawer)
- Activity log timeline pattern
- Contact import CSV avec preview
- Contact merge/dedup
- Tags colores

**De shadcnuikit**:

- KPI cards avec trend arrows pour dashboard
- Sales Pipeline stacked bar visualization
- DateRangePicker pour filtres temporels
- Leads table inline dans dashboard card

**De kiranism**:

- URL state sync (nuqs) pour pagination/sorting/filtering server-side
- Zustand store pour Kanban state
- @dnd-kit pour drag & drop avance (accessibility, sortable columns)
- Skeleton loading states pour chaque widget
- useMultistepForm pour formulaires complexes

**De shadcn-admin-kit**:

- SidebarFilters permanent pattern (pas de dropdown)
- ToggleFilterButton pour filtres visuels
- ColumnsButton pour toggle colonnes
- BulkActionsToolbar pattern
- DataTable.Col declaratif

---

## ANNEXE A — CHEMINS ABSOLUS

### Reference Repos

```
/Users/mohamedfodil/Documents/references/atomic-crm/
/Users/mohamedfodil/Documents/references/shadcnuikit/
/Users/mohamedfodil/Documents/references/kiranism/
/Users/mohamedfodil/Documents/references/shadcn-admin-kit/
```

### FleetCore CRM

```
# Pages
app/[locale]/(app)/crm/leads/page.tsx
app/[locale]/(app)/crm/leads/[id]/page.tsx
app/[locale]/(app)/crm/leads/browser/page.tsx
app/[locale]/(app)/crm/leads/reports/page.tsx
app/[locale]/(app)/crm/opportunities/page.tsx
app/[locale]/(app)/crm/quotes/page.tsx
app/[locale]/(app)/crm/quotes/new/page.tsx
app/[locale]/(app)/crm/quotes/[id]/page.tsx
app/[locale]/(app)/settings/crm/page.tsx

# API Routes
app/api/v1/crm/leads/
app/api/v1/crm/opportunities/
app/api/v1/crm/quotes/
app/api/v1/crm/agreements/
app/api/v1/crm/orders/
app/api/v1/crm/settings/

# Services
lib/services/crm/

# Repositories
lib/repositories/crm/

# Validators
lib/validators/

# Actions
lib/actions/crm/

# Components (ancien systeme)
components/crm/leads/
components/crm/opportunities/
components/crm/quotes/
components/crm/settings/

# Components (nouveau systeme Refine)
features/crm/leads/
components/ui/table/

# Hooks
hooks/use-data-table.ts
hooks/use-table-preferences.ts

# Types
types/crm.ts
```

---

_Document genere le 16 fevrier 2026 — A mettre a jour apres chaque phase d'implementation._
