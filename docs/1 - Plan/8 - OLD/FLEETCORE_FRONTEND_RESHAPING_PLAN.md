# FLEETCORE — PLAN DE REFONTE FRONTEND COMPLÈTE

> **Version :** 1.0  
> **Date :** 13 Février 2026  
> **Statut :** EN VALIDATION  
> **Auteur :** Architecture Claude × Mohamed (CEO/CTO)  
> **Portée :** Refonte UI complète zone applicative (app/)

---

## 1. DIAGNOSTIC — POURQUOI CETTE REFONTE

### 1.1 Verdict de l'audit qualité (13 Février 2026)

| Zone                          | Note       | Constat                                                 |
| ----------------------------- | ---------- | ------------------------------------------------------- |
| **Backend — Server Actions**  | **9/10**   | Enterprise-grade. Zod + Auth + Audit partout.           |
| **Backend — Prisma/DB**       | **9/10**   | 630 index, transactions, isolation tenant.              |
| **Backend — Sécurité**        | **8.5/10** | Complet. Rate limiting, 0 injection, 0 XSS.             |
| **Backend — Error Handling**  | **9/10**   | Classes custom, handler centralisé.                     |
| **Frontend — Composants CRM** | **4/10**   | God Components, duplication massive, 0 custom hooks.    |
| **Frontend — Tables**         | **5/10**   | Custom ~700L/table, dupliqué 3×, pas de virtualisation. |
| **Frontend — Design System**  | **3/10**   | Défini mais ignoré. Ratio tokens 1:66.                  |
| **Frontend — Accessibilité**  | **2/10**   | 0 reduced-motion, 4% keyboard, 10% ARIA.                |
| **Frontend — Responsive**     | **6.5/10** | Partiellement implémenté.                               |

**Score global : Backend 9/10 — Frontend 4/10**

### 1.2 Chiffres clés de la dette frontend

- **33 510 lignes** de code CRM frontend
- **LeadsPageClient.tsx** : 1098 lignes, 24 useState, 73 fonctions inline, 0 custom hooks
- **PipelineSettingsTab.tsx** : 1293 lignes, 95% de code dupliqué
- **Tables custom** : ~700 lignes × 3 tables = 2100 lignes de duplication
- **2238 occurrences** de couleurs Tailwind brutes (le design system FC est ignoré à 87%)
- **51 fichiers** avec du hex hardcodé
- **0 store Zustand** — tout en useState local
- **0 composant TanStack Table** — tout réimplémenté à la main
- **5 zones applicatives** définies dans la sidebar mais avec 0 page (Fleet, Drivers, Maintenance, Analytics, Admin)

### 1.3 Ce qui est bon (à préserver intégralement)

- **10 fichiers Server Actions** (6 948 lignes) — Zod safeParse, auth check, tenant isolation, audit logs
- **68+ fichiers lib/services/** — Architecture service-repository propre
- **81 schémas Zod + 22 fichiers validators** — Validation complète
- **Schema Prisma** (6 812 lignes, 630+ index) — Modèle de données mature
- **Middleware** (225 lignes) — Rate limiting, RBAC, tenant isolation
- **435 fichiers de tests** — Couverture forte
- **Error handling centralisé** — Classes custom, handler unique, format standardisé

---

## 2. VISION ET CONTRAINTES

### 2.1 Objectif

Reconstruire **intégralement** le frontend de la zone applicative `(app)/` pour atteindre un niveau de qualité visuelle et architecturale **enterprise-grade**, en utilisant shadcnuikit comme standard visuel et Kiranism comme référence de patterns techniques.

### 2.2 Contraintes non négociables

| #   | Contrainte                     | Détail                                                                          |
| --- | ------------------------------ | ------------------------------------------------------------------------------- |
| C1  | **Layout = shadcnuikit exact** | Sidebar, header, zone de contenu, navigation identiques au template shadcnuikit |
| C2  | **Composants standardisés**    | Chaque composant UI construit UNE fois, réutilisable dans TOUTES les sections   |
| C3  | **Backend inchangé**           | Server Actions, Prisma, Zod, Clerk middleware — zéro modification               |
| C4  | **Portail web inchangé**       | Pages publiques (homepage, booking, auth, terms) non touchées                   |
| C5  | **i18n conservé**              | react-i18next (en/fr) — tous composants importés doivent être traduits          |
| C6  | **Multi-tenant**               | buildProviderFilter() préservé — isolation tenant dans chaque requête           |
| C7  | **Zéro dette technique**       | Pas de raccourci, pas de "on fera plus tard"                                    |

### 2.3 Sources de référence

| Source          | Rôle                                                       | Chemin local                                            |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| **shadcnuikit** | Standard visuel (layout, composants, dashboards, theming)  | `/Users/mohamedfodil/Documents/references/shadcnuikit/` |
| **Kiranism**    | Patterns techniques (DataTable, hooks, Zustand, features/) | `/Users/mohamedfodil/Documents/references/kiranism/`    |
| **FleetCore**   | Backend (à garder tel quel) + frontend (à reconstruire)    | `/Users/mohamedfodil/Documents/fleetcore5/`             |

---

## 3. DÉCISIONS TECHNIQUES

### 3.1 Next.js — Migration 15.5 → 16

**Décision : Migrer vers Next 16 AVANT la refonte**

**Justification factuelle (audit compatibilité du 13/02/2026) :**

| Dépendance        | Version actuelle | Compatible Next 16      | Action                          |
| ----------------- | ---------------- | ----------------------- | ------------------------------- |
| @clerk/nextjs     | 6.32.2           | ❌ (peerDep exclut ^16) | Upgrade → ≥ 6.37.3              |
| @sentry/nextjs    | 10.13.0          | ❌ (peerDep exclut ^16) | Upgrade → ≥ 11.x (vérifier API) |
| @prisma/client    | 6.18.0           | ✅                      | Aucune                          |
| react-i18next     | 16.0.0           | ✅                      | Aucune                          |
| next-themes       | 0.4.6            | ✅                      | Aucune                          |
| framer-motion     | 12.23.19         | ✅                      | Aucune                          |
| Toutes les autres | —                | ✅                      | Aucune                          |

**Breaking changes Next 16 impactant FleetCore :**

- Middleware renommé en Proxy (rétrocompatible, renommage optionnel)
- unstable_cache possiblement renommé (1 fichier, trivial)
- Aucun breaking change dans les 114 routes API, 38 composants client, next.config.ts

**Stratégie en 2 temps :**

1. Upgrade Clerk (6.37.3) + Next 16 + eslint-config-next 16 → build → test
2. Upgrade Sentry (11.x) séparément — c'est du monitoring, pas bloquant pour la refonte

### 3.2 Recharts — Garder v3

**Décision : Garder Recharts v3 (FleetCore), adapter les charts importées de shadcnuikit (v2)**

FleetCore est déjà sur la version moderne. Les adaptations des charts shadcnuikit sont mécaniques (renommage de props). Régresser vers v2 serait une dette technique.

### 3.3 Tokens couleur — OKLCH unifié

**Décision : Adopter le système OKLCH de shadcnuikit, supprimer le système FC hex**

Le système FC hex est un échec factuel (13% d'adoption, ratio 1:66). Le supprimer ne perd rien de valeur. L'OKLCH unifié résout 3 problèmes d'un coup :

- Incohérence des couleurs (2238 occurrences brutes → tokens sémantiques)
- Dark mode manuel (→ automatique via .dark selector)
- Incompatibilité avec composants importés (→ tout sur le même système)

Les couleurs de marque FleetCore seront recréées en OKLCH dans le preset de thème.

### 3.4 Nouvelles dépendances

```bash
pnpm add @tanstack/react-table@^8.21 nuqs@^2.4 zustand@^5.0 kbar cmdk@^1.1
```

| Package               | Usage                                                    | Source      |
| --------------------- | -------------------------------------------------------- | ----------- |
| @tanstack/react-table | Remplacement des 3 tables custom (~2100L de duplication) | Kiranism    |
| nuqs                  | URL state management (filtres, pagination dans l'URL)    | Kiranism    |
| zustand               | State management global (remplace 24 useState)           | Kiranism    |
| kbar                  | Command palette (Cmd+K)                                  | Kiranism    |
| cmdk                  | Composant command shadcn                                 | shadcnuikit |

---

## 4. ARCHITECTURE CIBLE

### 4.1 Structure des dossiers

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/                    # Pages auth Clerk (INCHANGÉ)
│   │   ├── (public)/                  # Pages publiques (INCHANGÉ)
│   │   └── (app)/                     # ← ZONE REFONTE
│   │       ├── layout.tsx             # AppShell shadcnuikit + KBar + SidebarProvider
│   │       ├── dashboard/
│   │       │   ├── layout.tsx         # Parallel routes (streaming SSR)
│   │       │   ├── @stats/            # Slot streaming stats
│   │       │   ├── @charts/           # Slot streaming charts
│   │       │   └── page.tsx           # CRM Dashboard (template shadcnuikit)
│   │       ├── crm/
│   │       │   ├── leads/
│   │       │   │   └── page.tsx       # Server → Suspense → LeadsListingPage
│   │       │   ├── opportunities/
│   │       │   │   └── page.tsx
│   │       │   ├── quotes/
│   │       │   │   └── page.tsx
│   │       │   └── settings/
│   │       │       └── page.tsx
│   │       ├── fleet/                 # NOUVEAU — templates shadcnuikit
│   │       ├── drivers/               # NOUVEAU
│   │       ├── maintenance/           # NOUVEAU
│   │       ├── analytics/             # NOUVEAU
│   │       ├── admin/                 # NOUVEAU
│   │       └── settings/              # Settings globaux (template shadcnuikit)
│   ├── api/                           # Routes API (INCHANGÉ)
│   └── layout.tsx                     # Root: ThemeProvider + NuqsAdapter + Clerk
│
├── components/
│   ├── ui/                            # 58 composants shadcn/ui (depuis shadcnuikit)
│   │   ├── table/                     # DataTable system (depuis Kiranism — 9 fichiers)
│   │   ├── sidebar.tsx                # Sidebar avancée (shadcnuikit — 686L)
│   │   ├── calendar.tsx               # Calendar (shadcnuikit — 448L)
│   │   ├── chart.tsx                  # Charts thématisés (shadcnuikit — 316L)
│   │   ├── timeline.tsx               # Timeline (shadcnuikit — 174L)
│   │   ├── empty.tsx                  # Empty states (shadcnuikit — 104L)
│   │   └── ...                        # Tous composants de base
│   ├── layout/                        # Composants layout
│   │   ├── app-sidebar.tsx            # Sidebar FleetCore (structure shadcnuikit)
│   │   ├── header/                    # Header modulaire (shadcnuikit)
│   │   ├── page-container.tsx         # PageContainer (Kiranism — 84L)
│   │   └── kbar/                      # Command Palette (Kiranism)
│   ├── forms/                         # Wrappers formulaires standardisés
│   └── theme-customizer/              # Theme UI (shadcnuikit — 288L)
│
├── features/                          # Modules métier (pattern Kiranism)
│   ├── crm/
│   │   ├── leads/
│   │   │   ├── components/
│   │   │   │   ├── leads-view-page.tsx      # Server wrapper (~20L)
│   │   │   │   ├── leads-listing-page.tsx   # Client orchestrator (~60L)
│   │   │   │   ├── leads-table.tsx          # useDataTable + columns (~40L)
│   │   │   │   ├── lead-columns.tsx         # ColumnDef[] config (~80L)
│   │   │   │   ├── leads-kanban.tsx         # @dnd-kit + store (~150L)
│   │   │   │   ├── lead-drawer.tsx          # Detail panel (~300L)
│   │   │   │   └── lead-form-modal.tsx      # Create/Edit (~200L)
│   │   │   ├── hooks/
│   │   │   │   ├── use-leads-store.ts       # Zustand (~80L)
│   │   │   │   └── use-lead-actions.ts      # Server action wrappers
│   │   │   └── utils/
│   │   ├── opportunities/                   # Même pattern
│   │   ├── quotes/                          # Même pattern
│   │   └── settings/
│   ├── fleet/                               # NOUVEAU
│   ├── drivers/                             # NOUVEAU
│   ├── maintenance/                         # NOUVEAU
│   ├── analytics/                           # NOUVEAU
│   └── admin/                               # NOUVEAU
│
├── hooks/                             # Hooks globaux réutilisables
│   ├── use-data-table.ts              # Kiranism (296L)
│   ├── use-nav.ts                     # RBAC nav filtering (158L)
│   ├── use-breadcrumbs.tsx            # Auto breadcrumbs (46L)
│   ├── use-mobile.tsx                 # Mobile detection (21L)
│   ├── use-debounce.tsx               # Debounce (19L)
│   └── use-localized-path.ts          # FleetCore existant (conservé)
│
├── stores/                            # Zustand stores (NOUVEAU)
│   ├── sidebar-store.ts               # État sidebar
│   ├── leads-store.ts                 # Leads: filtres, sélection, vue, modals
│   ├── opportunities-store.ts         # Opportunities: idem
│   └── preferences-store.ts           # Préfs user: locale, theme, page sizes
│
├── lib/
│   ├── actions/                       # Server Actions (INCHANGÉ)
│   ├── services/                      # Services métier (INCHANGÉ)
│   ├── validators/                    # Zod validators (INCHANGÉ)
│   ├── data-table.ts                  # TanStack helpers (Kiranism — 78L)
│   ├── parsers.ts                     # URL state parsers (Kiranism — 100L)
│   └── i18n/                          # i18n config (INCHANGÉ)
│
├── config/
│   ├── data-table.ts                  # Filter operators (Kiranism — 82L)
│   └── nav-config.ts                  # Navigation avec RBAC
│
├── styles/
│   ├── globals.css                    # Tokens OKLCH unifiés (shadcnuikit)
│   └── themes.css                     # 7 presets thème (shadcnuikit — 879L)
│
└── types/
    ├── crm.ts                         # Types CRM (INCHANGÉ)
    └── data-table.ts                  # Types TanStack (Kiranism — 40L)
```

### 4.2 Pattern de page cible

**AVANT (état actuel) :**

```
LeadsPageClient.tsx — 1098 lignes, 24 useState, 73 fonctions inline, 7 modals
```

**APRÈS (architecture cible) :**

```
app/[locale]/(app)/crm/leads/page.tsx           →  15L  (Server, params + Suspense)
features/crm/leads/components/
  ├── leads-view-page.tsx                       →  20L  (Server, PageContainer)
  ├── leads-listing-page.tsx                    →  60L  (Client, orchestrator)
  ├── leads-table.tsx                           →  40L  (Client, useDataTable)
  ├── lead-columns.tsx                          →  80L  (Config, ColumnDef[])
  ├── leads-kanban.tsx                          → 150L  (Client, @dnd-kit)
  ├── lead-drawer.tsx                           → 300L  (Client, detail panel)
  └── lead-form-modal.tsx                       → 200L  (Client, create/edit)
features/crm/leads/hooks/
  ├── use-leads-store.ts                        →  80L  (Zustand store)
  └── use-lead-actions.ts                       →  30L  (Action wrappers)
                                                ────────
                                         Total → 975L réparties en 9 fichiers
                                         Max   → 300L par fichier
                                         Hooks → Logique extraite
                                         Store → État centralisé
```

### 4.3 Pattern de composant standardisé

Chaque composant UI est construit UNE FOIS et utilisé partout :

| Composant standard   | Utilisation CRM                    | Utilisation Fleet | Utilisation Drivers |
| -------------------- | ---------------------------------- | ----------------- | ------------------- |
| DataTable (TanStack) | LeadsTable, OppsTable, QuotesTable | VehiclesTable     | DriversTable        |
| Kanban Board         | Leads Pipeline, Opps Pipeline      | —                 | —                   |
| Detail Drawer        | Lead Detail, Opp Detail            | Vehicle Detail    | Driver Detail       |
| Form Modal           | New Lead, Edit Lead                | New Vehicle       | New Driver          |
| Stat Cards           | Lead Metrics, Pipeline Value       | Fleet KPIs        | Driver KPIs         |
| Empty State          | No leads found                     | No vehicles       | No drivers          |
| PageContainer        | Toutes les pages                   | Toutes les pages  | Toutes les pages    |
| FilterBar            | Leads filters                      | Fleet filters     | Driver filters      |

---

## 5. PLAN D'EXÉCUTION

### 5.0 Prérequis — Migration Next.js 16 (1-2 jours)

**Objectif :** Aligner FleetCore sur Next 16 pour compatibilité avec les composants de référence.

| Étape | Action                                                          | Vérification                  |
| ----- | --------------------------------------------------------------- | ----------------------------- |
| 0.1   | Backup git : `git tag pre-next16-migration`                     | Tag créé et pushé             |
| 0.2   | `pnpm update @clerk/nextjs@^6.37.3`                             | Build OK                      |
| 0.3   | Modifier package.json : `"next": "16.0.10"`                     | —                             |
| 0.4   | `pnpm update eslint-config-next@16`                             | —                             |
| 0.5   | `pnpm install`                                                  | 0 erreur                      |
| 0.6   | `pnpm build`                                                    | Build OK                      |
| 0.7   | Tester : auth Clerk, pages CRM, middleware                      | Tout fonctionne               |
| 0.8   | Upgrade Sentry séparément : `pnpm update @sentry/nextjs@latest` | Vérifier API withSentryConfig |
| 0.9   | `pnpm build` + run full test suite                              | 0 régression                  |

**Critère de validation :** Build réussi + toutes les pages accessibles + auth fonctionnelle + 0 erreur console.

---

### Phase 1 — Fondations visuelles (3-4 jours)

**Objectif :** Installer le socle visuel shadcnuikit — layout, theming, composants de base.

#### 1.1 Système de theming OKLCH (1 jour)

| Étape | Action                                                     | Source                        |
| ----- | ---------------------------------------------------------- | ----------------------------- |
| 1.1.1 | Remplacer globals.css par le système OKLCH shadcnuikit     | shadcnuikit globals.css       |
| 1.1.2 | Intégrer themes.css (7 presets avec dark mode automatique) | shadcnuikit themes.css (879L) |
| 1.1.3 | Recréer les couleurs de marque FleetCore en OKLCH          | Conversion #0176d3 → oklch()  |
| 1.1.4 | Supprimer TOUS les tokens FC hex (--fc-\*)                 | globals.css cleanup           |
| 1.1.5 | Configurer ThemeProvider centralisé (next-themes)          | shadcnuikit pattern           |

**Vérification :** Dark mode fonctionne automatiquement. Les composants shadcn existants utilisent les nouveaux tokens.

#### 1.2 Composants shadcn/ui complets (1 jour)

| Étape | Action                                                                                               | Source                     |
| ----- | ---------------------------------------------------------------------------------------------------- | -------------------------- |
| 1.2.1 | Copier les 58 composants shadcn/ui de shadcnuikit                                                    | shadcnuikit components/ui/ |
| 1.2.2 | Préserver les 4 composants custom FleetCore (empty-state, progress-bar, skeleton, stat-card)         | FleetCore existant         |
| 1.2.3 | Préserver les variants CRM du badge (pending, contacted, qualified, accepted, refused)               | FleetCore badge.tsx        |
| 1.2.4 | Remplacer select.tsx natif HTML par le Radix Select de shadcnuikit                                   | shadcnuikit select.tsx     |
| 1.2.5 | Installer les composants manquants : accordion, avatar, breadcrumb, calendar, command, tooltip, etc. | shadcnuikit                |

**Vérification :** `pnpm build` réussit. Les pages existantes compilent (même si visuellement pas encore alignées).

#### 1.3 Layout shadcnuikit (1-2 jours)

| Étape | Action                                                                         | Source                                               |
| ----- | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 1.3.1 | Remplacer AppShell par le layout shadcnuikit (SidebarProvider + content area)  | shadcnuikit layout (991L)                            |
| 1.3.2 | Remplacer ModulesSidebar par la sidebar avancée shadcnuikit                    | shadcnuikit sidebar.tsx (686L) + nav-main.tsx (451L) |
| 1.3.3 | Adapter la sidebar aux modules FleetCore (CRM, Fleet, Drivers, etc.) avec RBAC | Kiranism useNav (158L)                               |
| 1.3.4 | Remplacer AppHeader par le header shadcnuikit (breadcrumbs, search, user menu) | shadcnuikit header/                                  |
| 1.3.5 | Intégrer auto-breadcrumbs                                                      | Kiranism useBreadcrumbs (46L)                        |
| 1.3.6 | Intégrer PageContainer pour toutes les pages de contenu                        | Kiranism (84L)                                       |

**Vérification :** Navigation complète fonctionne. Sidebar collapse/expand. Mobile drawer. Breadcrumbs automatiques. Dark mode sur tout le layout.

---

### Phase 2 — Système DataTable standardisé (3-5 jours)

**Objectif :** Remplacer les 3 tables custom (~2100 lignes de duplication) par un composant DataTable unique basé sur TanStack Table.

#### 2.1 Infrastructure DataTable (1-2 jours)

| Étape | Action                                          | Source                                                          |
| ----- | ----------------------------------------------- | --------------------------------------------------------------- |
| 2.1.1 | Installer @tanstack/react-table + nuqs          | npm                                                             |
| 2.1.2 | Copier le système DataTable complet de Kiranism | Kiranism (9 fichiers, 1806L total)                              |
| 2.1.3 | Copier use-data-table hook                      | Kiranism (296L)                                                 |
| 2.1.4 | Copier les helpers et parsers                   | Kiranism data-table.ts (78L) + parsers.ts (100L)                |
| 2.1.5 | Copier les types et config                      | Kiranism types/data-table.ts (40L) + config/data-table.ts (82L) |
| 2.1.6 | Adapter le styling au thème shadcnuikit         | Adaptation CSS                                                  |

**Vérification :** Un DataTable de démo fonctionne avec données statiques. Tri, filtre, pagination, search, column visibility fonctionnent.

#### 2.2 Migration LeadsTable (1-2 jours)

| Étape | Action                                                                   |
| ----- | ------------------------------------------------------------------------ |
| 2.2.1 | Créer lead-columns.tsx (ColumnDef[] basé sur les 37 colonnes existantes) |
| 2.2.2 | Créer leads-table.tsx utilisant useDataTable + lead-columns              |
| 2.2.3 | Connecter aux Server Actions existants (données réelles)                 |
| 2.2.4 | Implémenter server-side filtering/sorting/pagination via nuqs URL state  |
| 2.2.5 | Tester : tri, filtres, pagination, bulk select, export CSV               |

**Vérification :** LeadsTable fonctionnelle avec données réelles. Même fonctionnalités que l'ancienne. URL reflète les filtres.

#### 2.3 Migration Opportunities + Quotes Tables (1 jour)

| Étape | Action                                                  |
| ----- | ------------------------------------------------------- |
| 2.3.1 | Créer opportunity-columns.tsx + opportunities-table.tsx |
| 2.3.2 | Créer quote-columns.tsx + quotes-table.tsx              |
| 2.3.3 | Connecter aux Server Actions existants                  |

**Vérification :** Les 3 tables fonctionnent avec le même composant DataTable. ~80 lignes de config par table au lieu de ~700 lignes custom.

---

### Phase 3 — Refactoring God Components + Zustand (3-4 jours)

**Objectif :** Éclater les God Components, extraire la logique dans des hooks et stores Zustand.

#### 3.1 Zustand stores (1 jour)

| Étape | Action                                                                             |
| ----- | ---------------------------------------------------------------------------------- |
| 3.1.1 | Installer Zustand                                                                  |
| 3.1.2 | Créer sidebar-store.ts (état sidebar collapsed/expanded)                           |
| 3.1.3 | Créer leads-store.ts (filtres, sélection, mode vue, modals — remplace 24 useState) |
| 3.1.4 | Créer opportunities-store.ts (même pattern)                                        |
| 3.1.5 | Créer preferences-store.ts (locale, thème, tailles de page)                        |

#### 3.2 Refactoring LeadsPageClient (2-3 jours)

| Étape | Action                                                      | Résultat    |
| ----- | ----------------------------------------------------------- | ----------- |
| 3.2.1 | Créer leads-view-page.tsx (Server wrapper + PageContainer)  | ~20L        |
| 3.2.2 | Créer leads-listing-page.tsx (orchestrator + useLeadsStore) | ~60L        |
| 3.2.3 | Extraire leads-table.tsx (déjà fait en Phase 2)             | ~40L        |
| 3.2.4 | Extraire leads-kanban.tsx (@dnd-kit + store)                | ~150L       |
| 3.2.5 | Extraire lead-drawer.tsx (panel détail)                     | ~300L       |
| 3.2.6 | Extraire lead-form-modal.tsx (création/édition)             | ~200L       |
| 3.2.7 | Créer use-leads-store.ts (Zustand)                          | ~80L        |
| 3.2.8 | Créer use-lead-actions.ts (wrappers server actions)         | ~30L        |
| 3.2.9 | Supprimer LeadsPageClient.tsx (1098L → 0L)                  | Suppression |

#### 3.3 Refactoring PipelineSettingsTab (1 jour)

| Étape | Action                                                                            |
| ----- | --------------------------------------------------------------------------------- |
| 3.3.1 | Identifier le code dupliqué entre LeadStages et OpportunityStages (95% identique) |
| 3.3.2 | Créer un composant générique PipelineStageEditor paramétrable                     |
| 3.3.3 | Instancier pour Leads et Opportunities avec config différente                     |
| 3.3.4 | Résultat : 1293L → ~400L (suppression de ~900L de duplication)                    |

---

### Phase 4 — Navigation et UX avancée (2 jours)

**Objectif :** Command palette, navigation enrichie, patterns UX modernes.

| Étape | Action                                                                      | Source                   |
| ----- | --------------------------------------------------------------------------- | ------------------------ |
| 4.1   | Intégrer KBar (Cmd+K command palette) avec navigation vers toutes les pages | Kiranism kbar/           |
| 4.2   | Configurer les raccourcis : navigation, création rapide, recherche globale  | Config FleetCore         |
| 4.3   | Implémenter le search global (leads, opportunities, quotes)                 | cmdk + actions FleetCore |
| 4.4   | Ajouter les transitions de page (Framer Motion)                             | shadcnuikit patterns     |
| 4.5   | Implémenter le theme customizer (optionnel — dev/démo)                      | shadcnuikit (288L)       |

---

### Phase 5 — Dashboards enrichis (2-3 jours)

**Objectif :** Remplacer le dashboard squelettique (4 KPIs + 1 chart) par des dashboards riches.

| Étape | Action                                                                          | Source                           |
| ----- | ------------------------------------------------------------------------------- | -------------------------------- |
| 5.1   | Créer le CRM Dashboard principal (8+ widgets)                                   | shadcnuikit CRM Dashboard (782L) |
| 5.2   | Implémenter les parallel routes pour streaming SSR                              | Kiranism pattern                 |
| 5.3   | Adapter les charts Recharts v2 → v3                                             | Adaptation mécanique             |
| 5.4   | Connecter aux données réelles via Server Components + Prisma                    | FleetCore backend                |
| 5.5   | Ajouter les charts manquants : pipeline funnel, conversion rates, revenue trend | shadcnuikit templates            |

**Vérification :** Dashboard fonctionnel avec données réelles. Streaming SSR (les widgets chargent progressivement).

---

### Phase 6 — Refactoring Opportunities + Quotes (2-3 jours)

**Objectif :** Appliquer les mêmes patterns que les Leads aux autres modules CRM.

| Étape | Action                                                                       |
| ----- | ---------------------------------------------------------------------------- |
| 6.1   | Refactorer OpportunityDrawer.tsx (1021L) en composants features/             |
| 6.2   | Créer opportunities-kanban.tsx, opportunity-drawer.tsx, opportunity-form.tsx |
| 6.3   | Créer use-opportunities-store.ts (Zustand)                                   |
| 6.4   | Refactorer les pages Quotes (même pattern)                                   |
| 6.5   | Appliquer le nouveau layout et theming sur toutes les pages CRM              |

---

### Phase 7 — CRM Settings refondu (1 jour)

**Objectif :** Reconstruire la page Settings CRM avec le template shadcnuikit.

| Étape | Action                                                           | Source                       |
| ----- | ---------------------------------------------------------------- | ---------------------------- |
| 7.1   | Utiliser le template Settings de shadcnuikit (tabs, formulaires) | shadcnuikit settings (230L)  |
| 7.2   | Intégrer le PipelineStageEditor refactoré (Phase 3.3)            | FleetCore refactoré          |
| 7.3   | Appliquer les form fields standardisés                           | shadcnuikit field.tsx (248L) |

---

### Phase 8 — Zones vides (5-8 jours)

**Objectif :** Créer les pages manquantes pour les 5 modules vides.

> **Note :** Cette phase dépend de la maturité du backend pour chaque module. Si le backend n'existe pas encore, on crée uniquement les pages UI avec des empty states informatifs.

| Module          | Pages à créer                                      | Template source                   | Backend existant ? |
| --------------- | -------------------------------------------------- | --------------------------------- | ------------------ |
| **Fleet**       | Dashboard, Vehicles List, Vehicle Detail           | shadcnuikit Logistics             | À VÉRIFIER         |
| **Drivers**     | Dashboard, Drivers List, Driver Detail, Onboarding | shadcnuikit Users + Profile       | À VÉRIFIER         |
| **Maintenance** | Calendar, Tasks List, Work Orders                  | shadcnuikit Calendar + Tasks apps | À VÉRIFIER         |
| **Analytics**   | Dashboard global, Rapports                         | shadcnuikit Analytics Dashboard   | À VÉRIFIER         |
| **Admin**       | Users, Roles, Tenant Settings                      | shadcnuikit Users + Settings      | À VÉRIFIER         |

---

### Phase 9 — Accessibilité et polish (2-3 jours)

**Objectif :** Passer de 2/10 à un score acceptable (7/10+).

| Étape | Action                                                                     |
| ----- | -------------------------------------------------------------------------- |
| 9.1   | Ajouter prefers-reduced-motion sur toutes les animations Framer Motion     |
| 9.2   | Audit et ajout des aria-labels sur tous les éléments interactifs           |
| 9.3   | Implémenter la navigation clavier complète (focus traps modals, tab order) |
| 9.4   | Corriger les contrastes (454+ instances text-gray-300/400 sur blanc)       |
| 9.5   | Ajouter les semantic HTML (main, section, nav)                             |
| 9.6   | Tester avec un lecteur d'écran (VoiceOver macOS)                           |

---

### Phase 10 — Nettoyage et validation finale (2-3 jours)

**Objectif :** Supprimer tout le code legacy, valider la cohérence globale.

| Étape | Action                                                                             |
| ----- | ---------------------------------------------------------------------------------- |
| 10.1  | Supprimer l'ancien dossier components/crm/ (106 fichiers legacy)                   |
| 10.2  | Supprimer l'ancien dossier components/app/ (AppShell, ModulesSidebar, AppHeader)   |
| 10.3  | Supprimer les tokens FC hex de globals.css                                         |
| 10.4  | Nettoyer les imports orphelins                                                     |
| 10.5  | Remplacer toutes les couleurs Tailwind brutes restantes par des tokens sémantiques |
| 10.6  | Vérifier que CHAQUE page compile et fonctionne                                     |
| 10.7  | Run full test suite — 0 régression                                                 |
| 10.8  | Build production — 0 erreur, 0 warning                                             |

---

## 6. ESTIMATION GLOBALE

| Phase     | Description                                                 | Durée estimée       |
| --------- | ----------------------------------------------------------- | ------------------- |
| 0         | Migration Next.js 16                                        | 1-2 jours           |
| 1         | Fondations visuelles (theming, composants, layout)          | 3-4 jours           |
| 2         | DataTable standardisé (TanStack)                            | 3-5 jours           |
| 3         | Refactoring God Components + Zustand                        | 3-4 jours           |
| 4         | Navigation et UX avancée (KBar, search)                     | 2 jours             |
| 5         | Dashboards enrichis                                         | 2-3 jours           |
| 6         | Refactoring Opportunities + Quotes                          | 2-3 jours           |
| 7         | CRM Settings refondu                                        | 1 jour              |
| 8         | Zones vides (Fleet, Drivers, Maintenance, Analytics, Admin) | 5-8 jours           |
| 9         | Accessibilité et polish                                     | 2-3 jours           |
| 10        | Nettoyage et validation finale                              | 2-3 jours           |
| **TOTAL** |                                                             | **26-38 jours dev** |

> **Note :** Ces estimations sont en jours de développement pur (prompts + exécution + validation). Le calendrier réel sera plus long avec le cycle ULTRATHINK (prompt → plan → validation → exécution → vérification).

---

## 7. MÉTRIQUES DE SUCCÈS

### 7.1 Objectifs quantitatifs

| Métrique                             | Avant                    | Après  | Cible                      |
| ------------------------------------ | ------------------------ | ------ | -------------------------- |
| Plus gros fichier composant          | 1293L (PipelineSettings) | < 300L | ✅ Aucun fichier > 300L    |
| God Components (>500L, >10 useState) | 3                        | 0      | ✅ Zéro God Component      |
| Custom hooks extraits                | 0                        | 15+    | ✅ Logique séparée         |
| Zustand stores                       | 0                        | 5+     | ✅ État centralisé         |
| Tables custom dupliquées             | 3 (2100L)                | 0      | ✅ 1 DataTable standard    |
| Tokens FC vs raw Tailwind            | 1:66                     | 1:1    | ✅ 100% tokens sémantiques |
| Composants shadcn installés          | 23                       | 58     | ✅ Kit complet             |
| Accessibilité score                  | 2/10                     | 7/10+  | ✅ WCAG 2.1 AA partiel     |
| Pages applicatives                   | ~10                      | 30+    | ✅ Toutes zones couvertes  |
| Frontend score global                | 4/10                     | 8/10+  | ✅ Enterprise-grade        |

### 7.2 Critères de validation par phase

Chaque phase est validée par :

1. ✅ `pnpm build` réussi (0 erreur)
2. ✅ Tests existants passent (0 régression)
3. ✅ Navigation complète fonctionnelle
4. ✅ Auth Clerk opérationnelle
5. ✅ Données réelles affichées correctement
6. ✅ Dark mode fonctionne sur toute la zone touchée
7. ✅ Git tag de sauvegarde créé avant et après

---

## 8. RISQUES ET MITIGATIONS

| Risque                                                                | Impact                  | Probabilité | Mitigation                                              |
| --------------------------------------------------------------------- | ----------------------- | ----------- | ------------------------------------------------------- |
| Sentry v10→v11 breaking changes                                       | Monitoring cassé        | Moyenne     | Upgrade séparé, monitoring peut attendre                |
| Composants shadcnuikit incompatibles Next 15 (si migration 16 échoue) | Adaptations nécessaires | Faible      | Composants sont du React pur, peu de dépendance Next    |
| Server Actions ne matchent pas le nouveau frontend                    | Connexion cassée        | Faible      | Backend inchangé, seule l'UI layer change               |
| Recharts v2→v3 adaptations plus lourdes que prévu                     | Charts cassées          | Faible      | Isoler dans chart.tsx wrapper, adapter au cas par cas   |
| Phase 8 (zones vides) bloquée par backend manquant                    | Pages sans données      | Moyenne     | Créer avec empty states, connecter le backend plus tard |
| Performance régression (nouveau layout + composants)                  | UX dégradée             | Faible      | Streaming SSR, Suspense, monitoring Vercel              |

---

## 9. RÈGLES D'EXÉCUTION

### 9.1 Protocole par phase

```
1. Backup git (tag) avant chaque phase
2. Prompt ULTRATHINK → Claude Code analyse
3. Claude Code propose plan d'exécution
4. Validation du plan (Claude + Mohamed)
5. Exécution step by step
6. Vérification terminal après chaque step
7. Build + test après chaque phase
8. Backup git (tag) après validation
```

### 9.2 Interdits absolus

- ❌ Modifier un Server Action, un service, ou un schéma Zod
- ❌ Modifier le schema.prisma
- ❌ Modifier le middleware (sauf renommage optionnel)
- ❌ Modifier les pages publiques (homepage, booking, auth)
- ❌ Casser l'isolation multi-tenant
- ❌ Supprimer du code avant d'avoir son remplacement validé
- ❌ Procéder à la phase N+1 sans validation complète de la phase N

### 9.3 Ordre de priorité en cas de conflit

1. **Backend fonctionne** (jamais de régression backend)
2. **Auth fonctionne** (jamais de page accessible sans auth)
3. **Données réelles** (pas de mock en production)
4. **Cohérence visuelle** (tout le frontend sur le même système)
5. **Features complètes** (pas de demi-implémentation)

---

## 10. FICHIERS DE RÉFÉRENCE

| Document                                                | Contenu                                          |
| ------------------------------------------------------- | ------------------------------------------------ |
| Audit inventaire frontend (13/02/2026)                  | Structure, composants, dépendances               |
| Audit qualité complet (13/02/2026)                      | Notes UI/Backend, God Components, design system  |
| Analyse comparative Kiranism × shadcnuikit (13/02/2026) | Solutions par problème, composants à extraire    |
| Vérification compatibilité Next 16 (13/02/2026)         | Bloqueurs, breaking changes, commandes migration |
| FLEETCORE_UX_REFONTE_STATUS_COMPLET.md                  | Historique tentative Velzon, leçons apprises     |
| FLEETCORE_ROADMAP_MVP.md                                | Roadmap globale 15 semaines                      |

---

> **Ce plan est vivant.** Il sera mis à jour à chaque phase complétée avec les résultats réels, les déviations constatées, et les ajustements nécessaires. Chaque modification sera documentée avec la date et la raison du changement.

---

**Document créé le :** 13 Février 2026  
**Prêt pour exécution :** En attente validation Mohamed  
**Première action :** Phase 0 — Migration Next.js 16
