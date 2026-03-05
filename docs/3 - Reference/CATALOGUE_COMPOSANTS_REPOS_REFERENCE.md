# CATALOGUE COMPOSANTS — REPOS DE REFERENCE FLEETCORE

> Inventaire complet des 3 repos de reference UI. Toute page FleetCore doit etre construite a partir de composants issus de ces repos.
> Date : 2026-03-05

---

## 1. SHADCNUIKIT

**Chemin** : `/Users/mohamedfodil/Documents/references/shadcnuikit`
**Stack** : Next.js App Router, shadcn/ui, TailwindCSS, Recharts, TipTap, TanStack Table
**Stats** : 69 pages, 239 composants reutilisables, 98 composants UI

### 1.1 Pages

| #   | Route                               | Fichier (court)                    | Description                                                                      | Layout                                                                        | Composants enfants                                                                                                                                                        |
| --- | ----------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | /dashboard/academy                  | `academy/page.tsx`                 | Dashboard apprentissage avec leaderboard                                         | `space-y-4`, `lg:grid-cols-12` puis `xl:grid-cols-3`                          | WelcomeCard, LeaderboardCard, LearningPathCard, StudentSuccessCard, ProgressStatisticsCard, ChartMostActivity, CourseProgressByMonth, CoursesListTable                    |
| 2   | /dashboard/apps/ai-chat-v2          | `apps/ai-chat-v2/page.tsx`         | Chat IA v2 — sidebar + panneau chat                                              | `flex h-[calc(100vh-...)] rounded-md lg:border`                               | AIChatSidebar, AIChatInterface                                                                                                                                            |
| 3   | /dashboard/apps/ai-image-generator  | `apps/ai-image-generator/page.tsx` | Generateur d'images IA                                                           | Delegue a ImageGenerator                                                      | ImageGenerator                                                                                                                                                            |
| 4   | /dashboard/apps/api-keys            | `apps/api-keys/page.tsx`           | Gestion cles API + stats + table                                                 | `space-y-4`, `grid gap-4 md:grid-cols-2 lg:grid-cols-4`                       | UpgradePlanCard, SuccessfulConversionsCard, FailedConversionsCard, ApiCallsCard, ApiKeysDataTable                                                                         |
| 5   | /dashboard/apps/calendar            | `apps/calendar/page.tsx`           | Calendrier complet (month/week/day/agenda)                                       | Delegue a EventCalendarApp                                                    | EventCalendarApp                                                                                                                                                          |
| 6   | /dashboard/apps/chat                | `apps/chat/page.tsx`               | Messagerie temps reel sidebar + content                                          | `flex h-[calc(100vh-...)]`                                                    | ChatSidebar, ChatContent                                                                                                                                                  |
| 7   | /dashboard/apps/courses             | `apps/courses/page.tsx`            | Detail cours avec video + modules                                                | `max-w-7xl`, `grid gap-4 lg:grid-cols-3`                                      | InstructorSection, CourseContent, StudyProgress, CourseModules                                                                                                            |
| 8   | /dashboard/apps/file-manager        | `apps/file-manager/page.tsx`       | Gestionnaire fichiers (grid/list)                                                | Delegue a FileManager                                                         | FileManager                                                                                                                                                               |
| 9   | /dashboard/apps/kanban              | `apps/kanban/page.tsx`             | Kanban board drag-and-drop                                                       | Delegue a KanbanBoard                                                         | KanbanBoard                                                                                                                                                               |
| 10  | /dashboard/apps/mail                | `apps/mail/page.tsx`               | Client email panneaux redimensionnables                                          | `h-[calc(100vh-...)]` ResizablePanels                                         | Mail (accounts, mails)                                                                                                                                                    |
| 11  | /dashboard/apps/notes               | `apps/notes/page.tsx`              | Application de notes                                                             | Delegue a NotesApp                                                            | NotesApp                                                                                                                                                                  |
| 12  | /dashboard/apps/pos-system          | `apps/pos-system/page.tsx`         | Systeme POS — produits + panier                                                  | `flex h-full` 3 colonnes                                                      | PosSystemMenu                                                                                                                                                             |
| 13  | /dashboard/apps/social-media        | `apps/social-media/page.tsx`       | Fil social 3 colonnes                                                            | `grid md:grid-cols-[280px_auto] lg:grid-cols-[280px_auto_280px]`              | SocialMediaSidebar, SocialMediaStories, PostItem, AsideRight                                                                                                              |
| 14  | /dashboard/apps/tasks               | `apps/tasks/page.tsx`              | Gestionnaire taches TanStack Table                                               | DataTable full width                                                          | DataTable (tasks, columns)                                                                                                                                                |
| 15  | /dashboard/apps/todo-list-app       | `apps/todo-list-app/page.tsx`      | Todo list avec filtres                                                           | Delegue a Tasks                                                               | Tasks                                                                                                                                                                     |
| 16  | /dashboard/crm                      | `crm/page.tsx`                     | **Dashboard CRM** — pipeline, leads, tasks                                       | `space-y-4`, `grid gap-4 md:grid-cols-2 xl:grid-cols-4` puis `xl:grid-cols-3` | TargetCard, TotalCustomersCard, TotalDeals, TotalRevenueCard, LeadBySourceCard, RecentTasks, SalesPipeline, LeadsCard                                                     |
| 17  | /dashboard/crypto                   | `crypto/page.tsx`                  | Dashboard crypto trading                                                         | `space-y-4`, `lg:grid-cols-6`                                                 | OverviewCard, DigitalWallets, TradingCard, RecentActivities, BalanceSummeryChart                                                                                          |
| 18  | /dashboard/default                  | `default/page.tsx`                 | Dashboard admin general                                                          | `space-y-4`, `lg:grid-cols-3`                                                 | TeamMembersCard, SubscriptionsCard, TotalRevenueCard, ChatWidget, ExerciseMinutes, LatestPayments, PaymentMethodCard                                                      |
| 19  | /dashboard/ecommerce                | `ecommerce/page.tsx`               | Dashboard e-commerce                                                             | `space-y-4`, `lg:grid-cols-12`                                                | EcommerceWelcomeCard, StatCards, TotalRevenueCard, ReturnRateCard, SalesByLocationCard, VisitBySourceCard, CustomerReviewsCard, RecentOrdersCard, BestSellingProductsCard |
| 20  | /dashboard/file-manager             | `file-manager/page.tsx`            | Dashboard fichiers avec stats stockage                                           | `space-y-4`, `lg:grid-cols-3`                                                 | FileUploadDialog, SummaryCards, FolderListCards, StorageStatusCard, ChartFileTransfer, TableRecentFiles                                                                   |
| 21  | /dashboard/finance                  | `finance/page.tsx`                 | Dashboard finance                                                                | `space-y-4`, `xl:grid-cols-3`                                                 | KPICards, Revenue, MonthlyExpenses, Summary, Transactions, SavingGoal, CreditCards                                                                                        |
| 22  | /dashboard/hospital-management      | `hospital-management/page.tsx`     | Dashboard hopital avec Tabs                                                      | `space-y-4`, Tabs, `lg:grid-cols-7`                                           | SummaryCards, PatientVisitsChart, PatientsByDepartmentChart, UpcomingAppointments, PatientsWithLastProcedure                                                              |
| 23  | /dashboard/hotel                    | `hotel/page.tsx`                   | Dashboard hotel                                                                  | `space-y-4`, `xl:grid-cols-3`                                                 | StatCards, ReservationsCard, CampaignOverview, RecentActivities, RevenueStat, BookingsCard, BookingList                                                                   |
| 24  | /dashboard/pages/empty-states/01-03 | `pages/empty-states/*/page.tsx`    | 3 variantes d'etats vides                                                        | Centres verticalement                                                         | Icons + CTA buttons                                                                                                                                                       |
| 25  | /dashboard/pages/error/403-404-500  | `pages/error/*/page.tsx`           | Pages d'erreur avec illustrations                                                | Centres + SVG                                                                 | Button, Image                                                                                                                                                             |
| 26  | /dashboard/pages/notifications      | `pages/notifications/page.tsx`     | Liste notifications DataTable                                                    | `mx-auto max-w-4xl space-y-4 xl:mt-8`                                         | NotificationsDataTable                                                                                                                                                    |
| 27  | /dashboard/pages/onboarding-flow    | `pages/onboarding-flow/page.tsx`   | Wizard onboarding 3 etapes                                                       | `mx-auto max-w-3xl lg:pt-10`                                                  | Onboarding (Zustand store)                                                                                                                                                |
| 28  | /dashboard/pages/orders/[id]        | `pages/orders/[id]/page.tsx`       | **Detail commande** avec stepper livraison                                       | `max-w-screen-lg`, `grid gap-4 md:grid-cols-2` + Progress stepper             | Card (customer, summary, delivery status, items Table)                                                                                                                    |
| 29  | /dashboard/pages/orders             | `pages/orders/page.tsx`            | Liste commandes avec Tabs + DataTable                                            | `space-y-4`, Tabs (All/Completed/...)                                         | OrdersDataTable                                                                                                                                                           |
| 30  | /dashboard/pages/pricing/\*         | `pages/pricing/*/page.tsx`         | 3 variantes pricing (column, single, table)                                      | `max-w-lg` ou `max-w-4xl`                                                     | Card, Accordion, Switch                                                                                                                                                   |
| 31  | /dashboard/pages/products/[id]      | `pages/products/[id]/page.tsx`     | Detail produit + galerie + avis                                                  | `space-y-4`, `xl:grid-cols-3`                                                 | ProductImageGallery, ProductReviewList, SubmitReviewForm                                                                                                                  |
| 32  | /dashboard/pages/products/create    | `pages/products/create/page.tsx`   | Formulaire creation produit                                                      | `mx-auto max-w-lg space-y-4`                                                  | AddProductForm                                                                                                                                                            |
| 33  | /dashboard/pages/products           | `pages/products/page.tsx`          | Liste produits + 4 KPI cards                                                     | `space-y-4`, `grid gap-4 md:grid-cols-2 lg:grid-cols-4`                       | ProductList, 4 KPI Cards                                                                                                                                                  |
| 34  | **/dashboard/pages/profile**        | **`pages/profile/page.tsx`**       | **Page profil v1 — sidebar + activity**                                          | **`space-y-4`, Tabs, `xl:grid-cols-3` sidebar(1)+main(2)**                    | **ProfileCard, CompleteYourProfileCard, CardSkills, LatestActivity, AboutMe, Connections**                                                                                |
| 35  | /dashboard/pages/settings/\*        | `pages/settings/*/page.tsx`        | 6 pages settings (profile, account, appearance, billing, display, notifications) | `Card > Form space-y-8`                                                       | Form, Select, Calendar, RadioGroup, Checkbox, Switch                                                                                                                      |
| 36  | **/dashboard/pages/user-profile**   | **`pages/user-profile/page.tsx`**  | **Page profil v2 — header banner + tabs + sidebar**                              | **`min-h-screen lg:max-w-7xl`, `grid lg:grid-cols-[320px_1fr]`**              | **ProfileHeader, ProfileSidebar, ActivityStream, ConnectionsTeams, ProjectsTable**                                                                                        |
| 37  | /dashboard/pages/users              | `pages/users/page.tsx`             | Liste utilisateurs DataTable                                                     | Header + UsersDataTable                                                       | UsersDataTable                                                                                                                                                            |
| 38  | /dashboard/payment                  | `payment/page.tsx`                 | Dashboard paiement                                                               | `grid xl:grid-cols-3` col-span-2 + right                                      | BalanceOverview, TransactionHistory, ExchangeRates                                                                                                                        |
| 39  | /dashboard/project-list             | `project-list/page.tsx`            | Grille cartes projets                                                            | `grid lg:grid-cols-2 xl:grid-cols-4`                                          | Card + Progress + Avatar stack                                                                                                                                            |
| 40  | /dashboard/project-management       | `project-management/page.tsx`      | Gestion projets avec Tabs                                                        | Tabs, `lg:grid-cols-3`, `2xl:grid-cols-4`                                     | SummaryCards, ChartProjectOverview, SuccessMetrics, Reminders, TableRecentProjects                                                                                        |
| 41  | /dashboard/sales                    | `sales/page.tsx`                   | Dashboard ventes                                                                 | `space-y-4`, `md:grid-cols-2 xl:grid-cols-8`                                  | RevenueChart, BalanceCard, IncomeCard, ExpenseCard, BestSellingProducts, TableOrderStatus                                                                                 |
| 42  | /dashboard/website-analytics        | `website-analytics/page.tsx`       | Analytics site web — grille 12 colonnes                                          | `space-y-4`, `grid gap-4 lg:grid-cols-12`                                     | StatCards, EarningReportsCard, TicketsCard, 6+ chart cards                                                                                                                |
| 43  | /dashboard/widgets/fitness          | `widgets/fitness/page.tsx`         | Widgets fitness — 3 colonnes 11 cartes                                           | `grid lg:grid-cols-2 xl:grid-cols-3`                                          | HeroCard, HeartRateCard, SleepCard, ActiveCard, etc.                                                                                                                      |
| 44  | /dashboard/login/v1-v2              | `(guest)/login/*/page.tsx`         | 2 variantes login                                                                | v1: half image/half form, v2: centered Card                                   | Input, Button                                                                                                                                                             |
| 45  | /dashboard/register/v1-v2           | `(guest)/register/*/page.tsx`      | 2 variantes inscription                                                          | Meme patterns que login                                                       | Input, Button                                                                                                                                                             |
| 46  | /dashboard/forgot-password          | `(guest)/forgot-password/page.tsx` | Mot de passe oublie                                                              | `flex items-center justify-center`, `Card w-96`                               | Form, Input                                                                                                                                                               |

### 1.2 Composants reutilisables CLES (pertinents pour FleetCore)

| #   | Nom                         | Fichier (court)                           | Description                                                | CSS cle                                                                                                                                                              | Donnees           |
| --- | --------------------------- | ----------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | **ProfileCard**             | `pages/profile/profile-card.tsx`          | Carte profil : avatar centre + stats 3 cols + contact rows | `Card > space-y-12`, avatar `size-20`, stats `grid grid-cols-3 divide-x`, contacts `flex flex-col gap-y-4`                                                           | Hardcode          |
| 2   | **CompleteYourProfileCard** | `pages/profile/complete-your-profile.tsx` | Barre progression profil complet                           | `Card > CardHeader + CardContent flex items-center gap-4` + Progress                                                                                                 | progressValue     |
| 3   | **CardSkills**              | `pages/profile/card-skills.tsx`           | Tags badges enveloppes                                     | `Card > CardContent > flex flex-wrap gap-2` + Badge variant="outline"                                                                                                | Hardcode          |
| 4   | **LatestActivity**          | `pages/profile/latest-activity.tsx`       | Timeline verticale d'activites                             | `Card > CardContent ps-8 > ol relative border-s` + `li ms-6 mb-10 space-y-2` + `span absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full border` | Hardcode          |
| 5   | **AboutMe**                 | `pages/profile/about-me.tsx`              | Table transactions (mal nomme)                             | `Card > Table` (Product/Status/Date/Amount)                                                                                                                          | Hardcode          |
| 6   | **Connections**             | `pages/profile/connections.tsx`           | Liste connexions connect/disconnect                        | `Card > CardContent space-y-4 > grid gap-4`                                                                                                                          | Hardcode          |
| 7   | **ProfileHeader**           | `user-profile/ProfileHeader.tsx`          | Banner image + avatar overlap + meta                       | `relative aspect-video` cover + `-mt-10 lg:-mt-14` avatar                                                                                                            | useProfileStore   |
| 8   | **ProfileSidebar**          | `user-profile/ProfileSidebar.tsx`         | Sidebar progress + sections About/Contacts/Teams           | `space-y-4`, Card+Progress, sections `text-xs font-medium uppercase text-muted-foreground`                                                                           | useProfileStore   |
| 9   | **ActivityStream**          | `user-profile/ActivityStream.tsx`         | Timeline d'activites avec fichiers/images                  | Card + Timeline component                                                                                                                                            | Hardcode          |
| 10  | **ProjectsTable**           | `user-profile/ProjectsTable.tsx`          | Table projets avec Progress par ligne                      | Card + Table + Progress                                                                                                                                              | Hardcode          |
| 11  | **SalesPipeline**           | `crm/sales-pipeline.tsx`                  | Pipeline etapes avec barres progression                    | Card + Progress par etape + Tooltip                                                                                                                                  | Hardcode          |
| 12  | **LeadsCard**               | `crm/leads.tsx`                           | Table leads dans un Card                                   | Card + TanStack Table                                                                                                                                                | Hardcode          |
| 13  | **TargetCard**              | `crm/target-card.tsx`                     | KPI objectif ventes vs realise                             | Card + radial chart                                                                                                                                                  | Hardcode          |
| 14  | **StatCards** (pattern)     | `*/stat-cards.tsx`                        | Grille 4 KPI cards                                         | `grid grid-cols-2 lg:grid-cols-4 gap-4`                                                                                                                              | Hardcode          |
| 15  | **SummaryCards** (pattern)  | `*/summary-cards.tsx`                     | Variante de StatCards                                      | `grid grid-cols-2 lg:grid-cols-4 gap-4`                                                                                                                              | Hardcode          |
| 16  | **KPICards**                | `finance/kpi-cards.tsx`                   | 4 cartes KPI finance                                       | Meme pattern StatCards                                                                                                                                               | Hardcode          |
| 17  | **OrdersDataTable**         | `pages/orders/data-table.tsx`             | Table commandes avec select + filtres + tri                | TanStack Table, `rounded-md border`                                                                                                                                  | Props: data[]     |
| 18  | **UsersDataTable**          | `pages/users/data-table.tsx`              | Table utilisateurs avec avatar + status                    | TanStack Table, `rounded-md border`                                                                                                                                  | Props: data[]     |
| 19  | **NotificationsDataTable**  | `pages/notifications/data-table.tsx`      | Table notifications avec recherche                         | TanStack Table, `space-y-6`                                                                                                                                          | Props: data[]     |
| 20  | **SidebarNav**              | `pages/settings/sidebar-nav.tsx`          | Navigation laterale settings                               | `Card py-0 > nav flex flex-col`                                                                                                                                      | Hardcode navItems |
| 21  | **Onboarding**              | `pages/onboarding-flow/onboarding.tsx`    | Wizard multi-etapes                                        | `mx-auto max-w-3xl lg:pt-10`                                                                                                                                         | Zustand store     |

### 1.3 Composants UI

| #   | Nom                         | Fichier                                            |
| --- | --------------------------- | -------------------------------------------------- |
| 1   | Accordion                   | `components/ui/accordion.tsx`                      |
| 2   | AlertDialog                 | `components/ui/alert-dialog.tsx`                   |
| 3   | Alert                       | `components/ui/alert.tsx`                          |
| 4   | Avatar                      | `components/ui/avatar.tsx`                         |
| 5   | Badge                       | `components/ui/badge.tsx`                          |
| 6   | Breadcrumb                  | `components/ui/breadcrumb.tsx`                     |
| 7   | ButtonGroup                 | `components/ui/button-group.tsx`                   |
| 8   | Button                      | `components/ui/button.tsx`                         |
| 9   | Calendar                    | `components/ui/calendar.tsx`                       |
| 10  | Card (+CardAction)          | `components/ui/card.tsx`                           |
| 11  | Carousel                    | `components/ui/carousel.tsx`                       |
| 12  | Chart                       | `components/ui/chart.tsx`                          |
| 13  | Checkbox                    | `components/ui/checkbox.tsx`                       |
| 14  | Command                     | `components/ui/command.tsx`                        |
| 15  | Dialog                      | `components/ui/dialog.tsx`                         |
| 16  | Drawer                      | `components/ui/drawer.tsx`                         |
| 17  | DropdownMenu                | `components/ui/dropdown-menu.tsx`                  |
| 18  | Form                        | `components/ui/form.tsx`                           |
| 19  | Input                       | `components/ui/input.tsx`                          |
| 20  | **Kanban**                  | `components/ui/kanban.tsx`                         |
| 21  | Label                       | `components/ui/label.tsx`                          |
| 22  | Pagination                  | `components/ui/pagination.tsx`                     |
| 23  | Popover                     | `components/ui/popover.tsx`                        |
| 24  | Progress                    | `components/ui/progress.tsx`                       |
| 25  | RadioGroup                  | `components/ui/radio-group.tsx`                    |
| 26  | Resizable                   | `components/ui/resizable.tsx`                      |
| 27  | ScrollArea                  | `components/ui/scroll-area.tsx`                    |
| 28  | Select                      | `components/ui/select.tsx`                         |
| 29  | Separator                   | `components/ui/separator.tsx`                      |
| 30  | Sheet                       | `components/ui/sheet.tsx`                          |
| 31  | Sidebar                     | `components/ui/sidebar.tsx`                        |
| 32  | Skeleton                    | `components/ui/skeleton.tsx`                       |
| 33  | Slider                      | `components/ui/slider.tsx`                         |
| 34  | Switch                      | `components/ui/switch.tsx`                         |
| 35  | Table                       | `components/ui/table.tsx`                          |
| 36  | Tabs                        | `components/ui/tabs.tsx`                           |
| 37  | Textarea                    | `components/ui/textarea.tsx`                       |
| 38  | **Timeline**                | `components/ui/timeline.tsx`                       |
| 39  | Toast / Sonner              | `components/ui/sonner.tsx`                         |
| 40  | Tooltip                     | `components/ui/tooltip.tsx`                        |
| 41  | **RichTextEditor** (TipTap) | `components/ui/custom/tiptap/rich-text-editor.tsx` |
| 42  | **CountAnimation**          | `components/ui/custom/count-animation.tsx`         |
| 43  | **PromptInput** (AI chat)   | `components/ui/custom/prompt/input.tsx`            |

---

## 2. KIRANISM

**Chemin** : `/Users/mohamedfodil/Documents/references/kiranism`
**Stack** : Next.js 15 App Router, Clerk auth, shadcn/ui, TailwindCSS, TanStack Table, dnd-kit, Recharts, nuqs, KBar, Zustand
**Stats** : 21 pages, 66 composants reutilisables, 59 composants UI

### 2.1 Pages

| #   | Route                      | Fichier (court)                        | Description                                                   | Layout                                                                      | Composants enfants                         |
| --- | -------------------------- | -------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | /                          | `src/app/page.tsx`                     | Redirect : auth → /dashboard/overview, unauth → /auth/sign-in | —                                                                           | —                                          |
| 2   | /auth/sign-in              | `auth/sign-in/[[...sign-in]]/page.tsx` | Login Clerk split 2 colonnes                                  | `lg:grid-cols-2`                                                            | SignInViewPage                             |
| 3   | /auth/sign-up              | `auth/sign-up/[[...sign-up]]/page.tsx` | Inscription Clerk split 2 colonnes                            | `lg:grid-cols-2`                                                            | SignUpViewPage                             |
| 4   | /dashboard/overview        | `overview/layout.tsx` + 4 slots        | **Dashboard overview KPI + 4 charts via parallel routes**     | `PageContainer`, `grid-cols-1 lg:grid-cols-4` KPI + `lg:grid-cols-7` charts | AreaGraph, BarGraph, PieGraph, RecentSales |
| 5   | /dashboard/kanban          | `kanban/page.tsx`                      | Kanban task manager dnd-kit                                   | —                                                                           | KanbanViewPage                             |
| 6   | /dashboard/product         | `product/page.tsx`                     | Liste produits TanStack Table server-side                     | `PageContainer scrollable={false}`                                          | ProductListingPage, DataTableSkeleton      |
| 7   | /dashboard/product/[id]    | `product/[productId]/page.tsx`         | Formulaire creation/edition produit                           | `PageContainer scrollable`                                                  | ProductViewPage, FormCardSkeleton          |
| 8   | /dashboard/profile         | `profile/[[...profile]]/page.tsx`      | Profil Clerk UserProfile                                      | —                                                                           | ProfileViewPage                            |
| 9   | /dashboard/billing         | `billing/page.tsx`                     | Facturation Clerk PricingTable                                | `PageContainer` + `space-y-6`                                               | PricingTable, Alert                        |
| 10  | /dashboard/exclusive       | `exclusive/page.tsx`                   | Page gatee plan Pro (Clerk Protect)                           | `PageContainer`                                                             | Protect, Card                              |
| 11  | /dashboard/workspaces      | `workspaces/page.tsx`                  | Liste organisations Clerk                                     | `PageContainer`                                                             | OrganizationList                           |
| 12  | /dashboard/workspaces/team | `workspaces/team/[[...rest]]/page.tsx` | Gestion equipe Clerk                                          | `PageContainer`                                                             | OrganizationProfile                        |

### 2.2 Composants reutilisables CLES

| #   | Nom                     | Fichier (court)                      | Description                                                                                         | CSS cle                                                                       | Props                                                                                   |
| --- | ----------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | **PageContainer**       | `layout/page-container.tsx`          | **Wrapper universel page dashboard** : scrollable, skeleton, access guard, titre+description+action | `h-[calc(100dvh-52px)]` ScrollArea ou div; `flex flex-1 flex-col p-4 md:px-6` | `scrollable`, `isloading`, `access`, `pageTitle`, `pageDescription`, `pageHeaderAction` |
| 2   | **AppSidebar**          | `layout/app-sidebar.tsx`             | Sidebar collapsible navigation                                                                      | `Sidebar collapsible='icon'`                                                  | Reads navItems config                                                                   |
| 3   | **Header**              | `layout/header.tsx`                  | Header: SidebarTrigger + Breadcrumbs + UserNav + ThemeToggle                                        | `flex h-16 shrink-0 items-center justify-between gap-2`                       | —                                                                                       |
| 4   | **Heading**             | `ui/heading.tsx`                     | Titre page: h2 + description + InfoButton                                                           | `text-3xl font-bold tracking-tight`                                           | `title`, `description`                                                                  |
| 5   | **KBar**                | `kbar/index.tsx`                     | Command palette globale (⌘K)                                                                        | `bg-background/80 backdrop-blur-sm`, `max-w-[600px]`                          | `children`                                                                              |
| 6   | **SearchInput**         | `search-input.tsx`                   | Trigger KBar style input avec ⌘K badge                                                              | `h-9 w-full md:w-40 lg:w-64`                                                  | useKBar                                                                                 |
| 7   | **AlertModal**          | `modal/alert-modal.tsx`              | Dialog confirmation destructive                                                                     | `flex w-full items-center justify-end space-x-2 pt-6`                         | `isOpen`, `onClose`, `onConfirm`, `loading`                                             |
| 8   | **FileUploader**        | `file-uploader.tsx`                  | Upload drag-and-drop react-dropzone                                                                 | `h-52 border-2 border-dashed rounded-lg`                                      | `value`, `onValueChange`, `onUpload`, `maxFiles`                                        |
| 9   | **OverViewPage**        | `overview/overview.tsx`              | Dashboard overview inline (alternative aux parallel routes)                                         | `grid-cols-1 gap-4 lg:grid-cols-4`, `lg:grid-cols-7`                          | —                                                                                       |
| 10  | **AreaGraph**           | `overview/area-graph.tsx`            | Recharts AreaChart empile                                                                           | `@container/card`, `aspect-auto h-[250px]`                                    | —                                                                                       |
| 11  | **BarGraph**            | `overview/bar-graph.tsx`             | Recharts BarChart interactif                                                                        | `@container/card`, `aspect-auto h-[250px]`                                    | —                                                                                       |
| 12  | **PieGraph**            | `overview/pie-graph.tsx`             | Recharts donut PieChart                                                                             | `mx-auto aspect-square h-[250px]`                                             | —                                                                                       |
| 13  | **RecentSales**         | `overview/recent-sales.tsx`          | 5 ventes recentes Avatar+montant                                                                    | `space-y-8`, `flex items-center`                                              | —                                                                                       |
| 14  | **KanbanBoard**         | `kanban/kanban-board.tsx`            | Board dnd-kit colonnes + cartes Zustand                                                             | `SortableContext`                                                             | useTaskStore                                                                            |
| 15  | **BoardColumn**         | `kanban/board-column.tsx`            | Colonne kanban `h-[75vh] w-[350px]`                                                                 | `h-[75vh] max-h-[75vh] w-[350px] bg-secondary`                                | `column`, `tasks[]`                                                                     |
| 16  | **TaskCard**            | `kanban/task-card.tsx`               | Carte tache sortable                                                                                | `mb-2 Card`                                                                   | `task`                                                                                  |
| 17  | **ProductForm**         | `products/product-form.tsx`          | Formulaire produit Create/Edit avec FileUpload                                                      | `Card mx-auto w-full`, `grid grid-cols-1 gap-6 md:grid-cols-2`                | `initialData`, `pageTitle`                                                              |
| 18  | **ProductTable**        | `products/product-tables/index.tsx`  | Table produits TanStack + toolbar + pagination                                                      | —                                                                             | `data[]`, `totalItems`, `columns[]`                                                     |
| 19  | **DataTable**           | `ui/table/data-table.tsx`            | Table TanStack generique                                                                            | —                                                                             | Via useDataTable hook                                                                   |
| 20  | **DataTableToolbar**    | `ui/table/data-table-toolbar.tsx`    | Toolbar recherche + filtres auto depuis column meta                                                 | —                                                                             | —                                                                                       |
| 21  | **DataTablePagination** | `ui/table/data-table-pagination.tsx` | Pagination complète                                                                                 | —                                                                             | —                                                                                       |
| 22  | **DataTableSkeleton**   | `ui/table/data-table-skeleton.tsx`   | Skeleton loading table                                                                              | —                                                                             | —                                                                                       |

#### Composants formulaire kiranism

| #   | Nom               | Description                        | Props cles                                       |
| --- | ----------------- | ---------------------------------- | ------------------------------------------------ |
| 23  | FormInput         | Input texte RHF                    | `control`, `name`, `label`, `type`               |
| 24  | FormSelect        | Select RHF                         | `control`, `name`, `label`, `options[]`          |
| 25  | FormTextarea      | Textarea RHF avec compteur         | `control`, `name`, `config: {maxLength, rows}`   |
| 26  | FormFileUpload    | Upload fichier RHF                 | `control`, `name`, `config: {maxSize, maxFiles}` |
| 27  | FormCheckbox      | Checkbox seule RHF                 | `control`, `name`, `checkboxLabel`               |
| 28  | FormCheckboxGroup | Groupe checkboxes RHF              | `control`, `name`, `options[]`, `columns`        |
| 29  | FormRadioGroup    | Groupe radio RHF                   | `control`, `name`, `options[]`, `orientation`    |
| 30  | FormSwitch        | Switch RHF dans bordered container | `control`, `name`, `label`, `description`        |
| 31  | FormSlider        | Slider RHF avec min/max/step       | `control`, `name`, `config: {min, max, step}`    |
| 32  | FormDatePicker    | Calendar popover RHF               | `control`, `name`, `config: {minDate, maxDate}`  |

### 2.3 Composants UI

| #     | Nom                     | Fichier                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1-45  | Standard shadcn/ui      | Accordion, AlertDialog, Alert, Avatar, Badge, Breadcrumb, Button, Calendar, Card(+CardAction), Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Form, Frame, HoverCard, InputOTP, Input, Label, Menubar, NavigationMenu, Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, ToggleGroup, Toggle, Tooltip |
| 46    | **Heading** (custom)    | `ui/heading.tsx` — h2 + description + InfoButton                                                                                                                                                                                                                                                                                                                                                                                                     |
| 47    | **Modal** (custom)      | `ui/modal.tsx` — Dialog wrapper simple                                                                                                                                                                                                                                                                                                                                                                                                               |
| 48    | **InfoButton** (custom) | `ui/info-button.tsx` — icone (i) qui ouvre panneau droite                                                                                                                                                                                                                                                                                                                                                                                            |
| 49    | **Infobar** (custom)    | `ui/infobar.tsx` — systeme sidebar droit contextuel                                                                                                                                                                                                                                                                                                                                                                                                  |
| 50-59 | DataTable system        | data-table.tsx, data-table-toolbar.tsx, data-table-pagination.tsx, data-table-column-header.tsx, data-table-faceted-filter.tsx, data-table-view-options.tsx, data-table-skeleton.tsx, data-table-date-filter.tsx, data-table-slider-filter.tsx                                                                                                                                                                                                       |

---

## 3. SHADCN-ADMIN-KIT

**Chemin** : `/Users/mohamedfodil/Documents/references/shadcn-admin-kit`
**Stack** : **React Admin (ra-core) + shadcn/ui + Vite** (PAS Next.js)
**Nature** : Bibliotheque de composants pour React Admin, PAS une app Next.js
**Stats** : 15 vues demo, 99 composants admin, 29 composants UI

### 3.1 Vues demo (pas des pages.tsx — c'est du React Admin)

| #   | Vue                       | Fichier (court)                | Description                           | Layout                                       |
| --- | ------------------------- | ------------------------------ | ------------------------------------- | -------------------------------------------- |
| 1   | Dashboard                 | `demo/dashboard/Dashboard.tsx` | Dashboard stats + chart + orders      | Cards grid                                   |
| 2   | Category List/Create/Edit | `demo/categories/*.tsx`        | CRUD categories                       | List + DataTable / Create + SimpleForm       |
| 3   | Customer List/Create/Edit | `demo/customers/*.tsx`         | CRUD clients complet avec filtres     | List + DataTable / Edit + SimpleForm + Tabs  |
| 4   | Order List/Edit           | `demo/orders/*.tsx`            | Liste commandes + edition avec panier | List + DataTable / Edit avec Basket + Totals |
| 5   | Product List/Create/Edit  | `demo/products/*.tsx`          | CRUD produits avec images             | List + DataTable / Create + SimpleForm       |
| 6   | Review List/Edit          | `demo/reviews/*.tsx`           | Liste avis avec bulk approve/reject   | List + DataTable + BulkActions               |
| 7   | Login                     | `admin/login-page.tsx`         | Login 2 colonnes                      | `grid lg:grid-cols-2`                        |

### 3.2 Composants admin CLES (pertinents pour FleetCore)

| #   | Nom                           | Description                                                     | Usage FleetCore potentiel           |
| --- | ----------------------------- | --------------------------------------------------------------- | ----------------------------------- |
| 1   | **Admin**                     | Wrapper racine AdminContext + AdminUI                           | Architecture globale                |
| 2   | **Layout**                    | Shell: sidebar collapsible + header + content                   | Deja FleetCore a son layout         |
| 3   | **AppSidebar**                | Nav auto-generee depuis resources                               | Reference pour sidebar              |
| 4   | **DataTable**                 | Table puissante : tri, bulk select, reorder colonnes            | **Tables CRM leads/opportunities**  |
| 5   | **DataTable.Col**             | Definition colonne (header+cell)                                | Colonnes leads                      |
| 6   | **List**                      | Page liste complete : breadcrumb + titre + filtres + pagination | **Pattern liste standard**          |
| 7   | **Create / Edit / Show**      | Pages CRUD completes                                            | **Formulaires CRM**                 |
| 8   | **SimpleForm**                | Layout formulaire vertical + Cancel+Save                        | **Formulaires leads/opportunities** |
| 9   | **RecordField**               | Champ label+valeur (vertical ou inline)                         | **Pages detail read-only**          |
| 10  | **ListPagination**            | Pagination complete avec rows-per-page                          | **Tables CRM**                      |
| 11  | **FilterForm + FilterButton** | Filtres inline + dropdown add/remove                            | **Filtres leads**                   |
| 12  | **BulkActionsToolbar**        | Toolbar fixe bottom quand rows selectionnees                    | **Bulk actions leads**              |
| 13  | **ColumnsButton**             | Show/hide/reorder colonnes via popover                          | **Colonnes dynamiques**             |
| 14  | **SortButton**                | Dropdown changement tri                                         | **Tri leads**                       |
| 15  | **Confirm**                   | Dialog confirmation generique                                   | **Actions destructives**            |
| 16  | **SaveButton**                | Bouton submit avec spinner                                      | **Formulaires**                     |
| 17  | **DeleteButton**              | Bouton suppression avec undo                                    | **Suppression leads**               |

#### Inputs React Admin

| #   | Nom                             | Description                             |
| --- | ------------------------------- | --------------------------------------- |
| 18  | TextInput                       | Champ texte single/multiline            |
| 19  | NumberInput                     | Champ numerique                         |
| 20  | DateInput                       | Date picker natif                       |
| 21  | BooleanInput                    | Switch toggle                           |
| 22  | SelectInput                     | Dropdown select avec clearable + create |
| 23  | AutocompleteInput               | Combobox searchable                     |
| 24  | AutocompleteArrayInput          | Multi-select combobox avec badges       |
| 25  | RadioButtonGroupInput           | Groupe radio                            |
| 26  | ArrayInput + SimpleFormIterator | Input tableau avec add/remove/reorder   |
| 27  | FileInput                       | Upload drag-and-drop                    |
| 28  | ReferenceInput                  | FK select avec fetch                    |
| 29  | ReferenceArrayInput             | Many-to-many select                     |

#### Fields React Admin (display)

| #   | Nom             | Description                 |
| --- | --------------- | --------------------------- |
| 30  | TextField       | Affiche valeur string       |
| 31  | NumberField     | Nombre formate locale       |
| 32  | DateField       | Date formatee               |
| 33  | BadgeField      | Valeur dans un Badge        |
| 34  | SelectField     | Map valeur → label          |
| 35  | EmailField      | Lien mailto:                |
| 36  | UrlField        | Lien hypertexte             |
| 37  | ImageField      | Affiche image(s)            |
| 38  | ReferenceField  | Fetch + affiche relation    |
| 39  | SingleFieldList | Liste horizontale de badges |

---

## 4. MAPPING POUR LA PAGE LEAD PROFILE

Pour chaque zone de la page lead profile actuelle (`/crm/leads/[id]`), le composant SOURCE exact a copier :

### 4.1 Structure page

| Zone FleetCore     | Composant source        | Repo        | Fichier exact                   | CSS a copier                                                                                     |
| ------------------ | ----------------------- | ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Wrapper page**   | page.tsx export default | shadcnuikit | `pages/profile/page.tsx` L24    | `<div className="space-y-4">`                                                                    |
| **Titre h1**       | page.tsx L26-27         | shadcnuikit | `pages/profile/page.tsx` L26-35 | `flex flex-row items-center justify-between` + `h1 text-xl font-bold tracking-tight lg:text-2xl` |
| **Grid principal** | page.tsx L47-60         | shadcnuikit | `pages/profile/page.tsx` L47-60 | `grid gap-4 xl:grid-cols-3` avec `xl:col-span-1` et `xl:col-span-2`                              |

### 4.2 Cartes sidebar (col-span-1)

| Zone FleetCore                                     | Composant source            | Repo        | Fichier exact                             | Notes                                                                                                                                                |
| -------------------------------------------------- | --------------------------- | ----------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Carte identite lead** (avatar + stats + contact) | **ProfileCard**             | shadcnuikit | `pages/profile/profile-card.tsx`          | COPIE EXACTE structure : `Card > CardContent > space-y-12` → avatar `size-20` + stats `grid grid-cols-3 divide-x` + contacts `flex flex-col gap-y-4` |
| **Carte lead journey** (barre progression)         | **CompleteYourProfileCard** | shadcnuikit | `pages/profile/complete-your-profile.tsx` | Meme structure : `Card > CardHeader (titre) + CardContent (flex items-center gap-4 > Progress + texte)`                                              |
| **Carte BANT score** (badges)                      | **CardSkills**              | shadcnuikit | `pages/profile/card-skills.tsx`           | Meme structure : `Card > CardHeader (titre) + CardContent > flex flex-wrap gap-2 > Badge[]`                                                          |

### 4.3 Cartes main (col-span-2)

| Zone FleetCore                 | Composant source   | Repo        | Fichier exact                       | Notes                                                                                                                                                                             |
| ------------------------------ | ------------------ | ----------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Carte activites** (timeline) | **LatestActivity** | shadcnuikit | `pages/profile/latest-activity.tsx` | Structure : `Card > CardHeader (titre + "View All" link) + CardContent ps-8 > ol relative border-s > li ms-6 mb-10 space-y-2`. Remplacer le contenu hardcode par `<LeadTimeline>` |
| **Grille petites cartes**      | page.tsx L55-58    | shadcnuikit | `pages/profile/page.tsx` L55        | `grid grid-cols-1 gap-4 xl:grid-cols-2` (original) → adapte en `md:grid-cols-2 xl:grid-cols-3` pour 5 cartes                                                                      |

### 4.4 Petites cartes (dans la grille fluide)

| Zone FleetCore          | Meilleur composant source | Repo | Notes                                                                                                                      |
| ----------------------- | ------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------- |
| **Carte Company**       | Aucun equivalent direct   | —    | Pattern InfoRow `flex items-center gap-3 text-sm` + icon `text-muted-foreground size-4` copie de `profile-card.tsx` L38-67 |
| **Carte Assignment**    | Aucun equivalent direct   | —    | Meme pattern InfoRow. Structure `Card > CardHeader pb-2 > CardTitle text-sm + CardContent space-y-2`                       |
| **Carte Source**        | Aucun equivalent direct   | —    | Meme pattern. Utiliser Badge pour wizard status (copie `CardSkills` pattern badge)                                         |
| **Carte Qualification** | Aucun equivalent direct   | —    | Meme pattern InfoRow                                                                                                       |
| **Carte Audit**         | Aucun equivalent direct   | —    | Meme pattern InfoRow + Badge pour GDPR/email status                                                                        |

### 4.5 Alternatives possibles

| Zone               | Alternative 1                                               | Alternative 2                                                                     | Recommandation                                          |
| ------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Timeline activites | shadcnuikit `LatestActivity` (`ol border-s` pattern)        | shadcnuikit `ActivityStream` (utilise `Timeline` component UI)                    | **LatestActivity** — plus simple, meme rendu            |
| Page layout        | shadcnuikit `pages/profile/page.tsx` (v1, `xl:grid-cols-3`) | shadcnuikit `pages/user-profile/ProfilePage.tsx` (v2, `lg:grid-cols-[320px_1fr]`) | **v1** — pas de banner image, plus adapte a un CRM      |
| Stats grid         | shadcnuikit `ProfileCard` stats (`grid grid-cols-3`)        | shadcnuikit `StatCards` pattern (`grid grid-cols-2 lg:grid-cols-4`)               | **ProfileCard** — 3 colonnes dans la sidebar = parfait  |
| Stepper/Journey    | shadcnuikit orders/detail stepper (cercles + Progress)      | shadcnuikit `CompleteYourProfileCard` (Progress bar simple)                       | **CompleteYourProfileCard** — plus compact pour sidebar |

### 4.6 Composants sans equivalent dans les 3 repos

| Composant FleetCore                                                              | Description                       | Action                                                        |
| -------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------- |
| **LeadTimeline** (`components/crm/leads/LeadTimeline.tsx`)                       | Timeline activites CRM specifique | CONSERVER — composant metier, pas UI generique                |
| **LeadBantSection** (`features/crm/leads/components/drawer/LeadBantSection.tsx`) | Dropdowns BANT editables          | CONSERVER dans drawer — le profil utilise affichage read-only |
| **LeadStatusActions**                                                            | Actions de changement statut      | CONSERVER dans drawer uniquement                              |
| **Carte Country Mismatch**                                                       | Alerte IP ≠ pays declare          | SUPPRIME de la page profil (comme demande)                    |

---

## 5. RESUME QUANTITATIF

| Repo                 | Pages          | Composants reutilisables | Composants UI | Framework                  |
| -------------------- | -------------- | ------------------------ | ------------- | -------------------------- |
| **shadcnuikit**      | 69             | 239                      | 98            | Next.js App Router         |
| **kiranism**         | 21             | 66                       | 59            | Next.js App Router + Clerk |
| **shadcn-admin-kit** | 15 (vues demo) | 99                       | 29            | React Admin + Vite         |
| **TOTAL**            | **105**        | **404**                  | **186**       | —                          |

### Priorite d'utilisation pour FleetCore

1. **shadcnuikit** (PRIORITE 1) : Plus grand catalogue, pages completes prets a copier, meme stack Next.js
2. **kiranism** (PRIORITE 2) : PageContainer, DataTable system, formulaires RHF, Clerk auth — patterns architecturaux
3. **shadcn-admin-kit** (PRIORITE 3) : React Admin patterns (List, Create, Edit, Show, RecordField) — reference pour CRUD mais PAS copiable directement (stack differente)

### Repos supplementaires (non inventories en detail)

| Repo           | Chemin                                                | Nature                                                          |
| -------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| **Velzon**     | `/Users/mohamedfodil/Documents/references/Velzon`     | Template admin (a inventorier si necessaire)                    |
| **atomic-crm** | `/Users/mohamedfodil/Documents/references/atomic-crm` | CRM React Admin (reference metier, a inventorier si necessaire) |
