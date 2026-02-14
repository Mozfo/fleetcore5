# FLEETCORE — PLAN DE REFONTE FRONTEND COMPLÈTE V2

> **Version :** 2.0  
> **Date :** 13 Février 2026  
> **Statut :** EN EXÉCUTION — Phase 1B.4 prochaine action  
> **Auteur :** Architecture Claude × Mohamed (CEO/CTO)  
> **Portée :** Refonte UI complète zone applicative (app/)  
> **Remplace :** FLEETCORE_FRONTEND_RESHAPING_PLAN V1.0

---

## CHANGELOG V1 → V2

| Élément                    | V1                                        | V2                                                               | Raison                           |
| -------------------------- | ----------------------------------------- | ---------------------------------------------------------------- | -------------------------------- |
| **Mapping shadcnuikit**    | 1:1 basique (1 page template = 1 page FC) | **12 patterns intelligents** (1 page template = N pages FC)      | Couverture complète tous modules |
| **Phase 8 "Zones vides"**  | 5-8 jours, vague, "À VÉRIFIER"            | **Phases 8-12 détaillées** par module avec mapping pattern exact | Plus de flou                     |
| **Couverture shadcnuikit** | ~15% du template                          | **100% des éléments utiles** (21 pages utilisées, 47 ignorées)   | Tout l'investissement exploité   |
| **Pages FleetCore**        | ~30 pages                                 | **50+ pages** couvertes par les 12 patterns                      | Tous modules opérationnels       |
| **Theme customizer**       | Marqué "optionnel"                        | **OBLIGATOIRE**                                                  | Acheté, installé, point final    |
| **Estimation**             | 26-38 jours                               | **35-50 jours**                                                  | Scope réaliste, 0 dette          |

---

## PROCHAINE ACTION IMMÉDIATE

**Phase 1B.4 — Inner wrapper fix + PageContainer**

| Sous-étape              | Description                                                                                  | Statut |
| ----------------------- | -------------------------------------------------------------------------------------------- | ------ |
| Revert inventions I1-I7 | Supprimer breadcrumb system inventé (7 fichiers)                                             | 🔲     |
| Revert invention I8     | Retirer `<SidebarRail />` de app-sidebar.tsx                                                 | 🔲     |
| Inner wrapper           | Identifier le markup exact du content wrapper dans shadcnuikit (classes, padding, max-width) | 🔲     |
| PageContainer           | Créer composant DRY produisant le même HTML que shadcnuikit                                  | 🔲     |
| Build + test            | Vérification build, lint, typecheck après modifications                                      | 🔲     |

**Règle des 2 couches pour PageContainer :**

- Couche 1 (UX/Visuel) = shadcnuikit exact. Le HTML rendu pixel-perfect identique.
- Couche 2 (Technique/Code) = Kiranism. Un composant propre au lieu de copier-coller dans 50+ fichiers.

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

### 2.2 Prérequis non négociables

| #   | Prérequis                      | Formulation exacte                                                                                                                                                                                                                              |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Layout = shadcnuikit exact** | Sidebar, header, zone de contenu, navigation identiques au template shadcnuikit. Pas "inspiré de", pas "adapté" — le même layout branché sur le backend FleetCore.                                                                              |
| P2  | **Composants standardisés**    | Chaque composant UI (DataTable, Kanban, StatCard, Form fields, Drawers, Modals) est construit UNE fois et réutilisé dans TOUTES les sections — CRM, Fleet, Drivers, Maintenance, Analytics, Admin. Zéro duplication, zéro code custom par page. |
| P3  | **Périmètre = app uniquement** | Ne PAS toucher les pages publiques (homepage, homepage-v2, solopreneur, booking, auth, terms, payment). Le portail web reste tel quel. La refonte concerne uniquement la zone `(app)/` — tout ce qui est derrière l'authentification.           |
| P4  | **Backend inchangé**           | Server Actions, Prisma, Zod, Clerk middleware, i18n, multi-tenant — zéro modification. On reconstruit la couche de présentation, pas la logique métier.                                                                                         |

### 2.3 Règle d'or — Hiérarchie des sources

> **shadcnuikit = rendu visuel pixel-perfect (le QUOI), Kiranism + best practices = code technique (le COMMENT). Navigateur = identique. Code = supérieur. ZÉRO invention UI.**

| Priorité | Source          | Rôle                                                                                                                                          | Chemin local                                            |
| -------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **1**    | **shadcnuikit** | LA CIBLE. Layout, sidebar, header, visuels, composants — TOUT vient de shadcnuikit                                                            | `/Users/mohamedfodil/Documents/references/shadcnuikit/` |
| **2**    | **Kiranism**    | Boîte à outils UNIQUEMENT pour ce que shadcnuikit ne gère pas (Clerk auth, cookie bridge, user session, DataTable TanStack, Zustand patterns) | `/Users/mohamedfodil/Documents/references/kiranism/`    |
| **3**    | **FleetCore**   | Données métier. Navigation, RBAC, feature flags, i18n, multi-tenant                                                                           | `/Users/mohamedfodil/Documents/fleetcore5/`             |

### 2.4 Contraintes techniques

| #   | Contrainte               | Détail                                                                 |
| --- | ------------------------ | ---------------------------------------------------------------------- |
| C1  | **i18n conservé**        | react-i18next (en/fr) — tous composants importés doivent être traduits |
| C2  | **Multi-tenant**         | buildProviderFilter() préservé — isolation tenant dans chaque requête  |
| C3  | **Zéro dette technique** | Pas de raccourci, pas de "on fera plus tard"                           |

---

## 3. DÉCISIONS TECHNIQUES

### 3.1 Next.js — Migration 15.5 → 16

**Décision : Migrer vers Next 16 AVANT la refonte**

| Dépendance     | Version actuelle | Compatible Next 16      | Action                          |
| -------------- | ---------------- | ----------------------- | ------------------------------- |
| @clerk/nextjs  | 6.32.2           | ❌ (peerDep exclut ^16) | Upgrade → ≥ 6.37.3              |
| @sentry/nextjs | 10.13.0          | ❌ (peerDep exclut ^16) | Upgrade → ≥ 11.x (vérifier API) |
| @prisma/client | 6.18.0           | ✅                      | Aucune                          |
| react-i18next  | 16.0.0           | ✅                      | Aucune                          |
| next-themes    | 0.4.6            | ✅                      | Aucune                          |
| framer-motion  | 12.23.19         | ✅                      | Aucune                          |

**Breaking changes Next 16 impactant FleetCore :**

- Middleware renommé en Proxy (rétrocompatible, renommage optionnel)
- unstable_cache possiblement renommé (1 fichier, trivial)
- Aucun breaking change dans les 114 routes API, 38 composants client, next.config.ts

**Stratégie en 2 temps :**

1. Upgrade Clerk (6.37.3) + Next 16 + eslint-config-next 16 → build → test
2. Upgrade Sentry (11.x) séparément — c'est du monitoring, pas bloquant pour la refonte

### 3.2 Recharts — Garder v3

FleetCore est déjà sur la version moderne. Les adaptations des charts shadcnuikit (v2) sont mécaniques (renommage de props). Régresser vers v2 serait une dette technique.

### 3.3 Tokens couleur — OKLCH unifié

Adopter le système OKLCH de shadcnuikit, supprimer le système FC hex. Le système FC hex est un échec factuel (13% d'adoption, ratio 1:66). L'OKLCH résout 3 problèmes :

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

## 4. MAPPING INTELLIGENT — SHADCNUIKIT → FLEETCORE

### 4.1 Principe

**1 page shadcnuikit = 1 pattern réutilisable sur N pages FleetCore.** On ne duplique pas, on paramétrise.

### 4.2 Les 12 patterns

#### PATTERN 1 — "Users List" → TOUTE LISTE D'ENTITÉS

**Source shadcnuikit :** `/pages/users`  
**Sert à :**

| Page FleetCore     | Module    | Données                |
| ------------------ | --------- | ---------------------- |
| Leads Browser      | CRM       | crm_leads              |
| Opportunities List | CRM       | crm_opportunities      |
| Quotes List        | CRM       | crm_quotes             |
| Vehicles List      | Fleet     | fleet_vehicles         |
| Drivers List       | Drivers   | drv_drivers            |
| Admin Members      | Admin     | adm_members            |
| Provider Employees | Admin     | adm_provider_employees |
| Invoices List      | Billing   | bil_invoices           |
| Contracts List     | Billing   | bil_contracts          |
| Documents List     | Documents | doc_documents          |

**→ 1 template, 10+ pages FleetCore.** DataTable standardisé avec filtres, search, pagination, actions bulk.

---

#### PATTERN 2 — "Profile / Profile V2" → TOUTE FICHE DÉTAIL

**Source shadcnuikit :** `/pages/profile`, `/pages/profile-v2`  
**Sert à :**

| Page FleetCore                  | Module  | Layout                                             |
| ------------------------------- | ------- | -------------------------------------------------- |
| Lead Detail (`/crm/leads/[id]`) | CRM     | Tabs + sections info + timeline activité           |
| Opportunity Detail              | CRM     | Tabs + pipeline stage + forecast                   |
| Vehicle Detail                  | Fleet   | Tabs: infos, docs, historique maintenance, revenus |
| Driver Detail                   | Drivers | Tabs: infos, permis, performance, shifts           |
| Tenant Detail                   | Admin   | Tabs: infos, members, settings, lifecycle          |
| Member Detail                   | Admin   | Tabs: infos, rôles, sessions, audit                |
| Invoice Detail                  | Billing | Tabs: lignes, paiements, historique                |
| Contract Detail                 | Billing | Tabs: termes, véhicules, historique                |

**→ 1 template, 8+ pages FleetCore.**

---

#### PATTERN 3 — "CRM Dashboard" → TOUS LES DASHBOARDS

**Source shadcnuikit :** `/dashboards/crm`  
**Sert à :**

| Dashboard FleetCore           | KPIs spécifiques                                         |
| ----------------------------- | -------------------------------------------------------- |
| Dashboard CRM                 | Pipeline value, conversion rate, leads/mois, forecast    |
| Dashboard Fleet               | Véhicules actifs, utilisation %, maintenance due, coûts  |
| Dashboard Drivers             | Chauffeurs actifs, heures en ligne, performance, revenus |
| Dashboard Finance/Billing     | Revenus MRR, paiements, impayés, P&L                     |
| Dashboard principal FleetCore | Overview global cross-modules                            |

**→ 1 template, 5 dashboards.** Pattern : KPI cards row + charts grid + recent activity table.

---

#### PATTERN 4 — "Kanban" → TOUS LES PIPELINES

**Source shadcnuikit :** `/apps/kanban`  
**Sert à :**

| Pipeline FleetCore      | Colonnes                                                       |
| ----------------------- | -------------------------------------------------------------- |
| Leads Pipeline          | NEW → WORKING → QUALIFIED → LOST                               |
| Opportunities Pipeline  | PROSPECTING → QUALIFICATION → PROPOSAL → NEGOTIATION → CLOSING |
| Maintenance Work Orders | BACKLOG → IN PROGRESS → DONE                                   |

**→ 1 template, 3 pipelines.**

---

#### PATTERN 5 — "Settings (6 sous-pages)" → TOUS LES SETTINGS

**Source shadcnuikit :** `/pages/settings/*` (account, appearance, notifications, display, sessions, connections)  
**Sert à :**

| Section Settings FleetCore | Onglets                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------- |
| CRM Settings               | Pipeline, Scoring, Assignment, Loss reasons, Notifications, Data quality, Regional |
| Admin Tenant Settings      | Localization, Business, Billing, Limits, Branding                                  |
| User Profile Settings      | Account, Appearance, Notifications                                                 |
| Billing Settings           | Plans, Payment methods, Invoicing                                                  |

**→ 6 templates settings, 4 sections FleetCore.** Pattern : sidebar tabs + formulaires + toggles.

---

#### PATTERN 6 — "Calendar" → TOUT CE QUI EST PLANNING

**Source shadcnuikit :** `/apps/calendar`  
**Sert à :**

| Usage FleetCore                                | Module      |
| ---------------------------------------------- | ----------- |
| Planning maintenance véhicules                 | Maintenance |
| Planning shifts chauffeurs                     | Drivers     |
| Calendrier démos CRM                           | CRM         |
| Rappels expirations (docs, assurances, permis) | Documents   |

**→ 1 template, 4 usages.**

---

#### PATTERN 7 — "Tasks" → TOUTE GESTION DE TÂCHES

**Source shadcnuikit :** `/apps/tasks`  
**Sert à :**

| Usage FleetCore                 | Module        |
| ------------------------------- | ------------- |
| Work orders maintenance         | Maintenance   |
| Tâches onboarding tenant/driver | Admin/Drivers |
| Tâches support                  | Support       |
| Tâches internes admin           | Admin         |

**→ 1 template, 4 usages.**

---

#### PATTERN 8 — "File Manager" → TOUTE GESTION DOCUMENTAIRE

**Source shadcnuikit :** `/apps/file-manager`  
**Sert à :**

| Usage FleetCore      | Types de documents                         |
| -------------------- | ------------------------------------------ |
| Documents véhicules  | Carte grise, assurance, contrôle technique |
| Documents chauffeurs | Permis, KBIS, attestation, carte pro VTC   |
| Contrats signés      | Agreements, contrats location              |
| Factures archivées   | Invoices PDF                               |

**→ 1 template, 4 usages.**

---

#### PATTERN 9 — "Onboarding Flow" → TOUS LES WIZARDS

**Source shadcnuikit :** `/pages/onboarding`  
**Sert à :**

| Wizard FleetCore                    | Étapes                                                     |
| ----------------------------------- | ---------------------------------------------------------- |
| Onboarding nouveau tenant           | Activation compte → Config → Import données → Démarrage    |
| Onboarding nouveau chauffeur        | Infos perso → Documents → Affectation véhicule → Formation |
| Ajout véhicule                      | Infos véhicule → Documents → Classe → Affectation          |
| Wizard book-demo (refonte visuelle) | Email → Verify → Cal.com → Business info → Confirmation    |

**→ 1 template, 4 wizards.**

---

#### PATTERN 10 — "Chat" → COMMUNICATION

**Source shadcnuikit :** `/apps/chat`  
**Sert à :**

| Usage FleetCore                | Contexte                    |
| ------------------------------ | --------------------------- |
| Communication admin ↔ tenants | Support interne             |
| Communication chauffeurs       | Notifications, instructions |
| Notes/activités sur leads      | Vue timeline simplifiée     |

**→ 1 template, 2-3 usages.**

---

#### PATTERN 11 — "Analytics Dashboard" → MODULE ANALYTICS

**Source shadcnuikit :** `/dashboards/analytics`  
**Sert à :**

| Rapport FleetCore          | Métriques                                         |
| -------------------------- | ------------------------------------------------- |
| Reports CRM                | Funnel conversion, sources, cycle time, win rate  |
| Analytics Fleet            | Utilisation, coûts km, revenus/véhicule, downtime |
| Analytics Drivers          | Performance, heures, revenus, notes plateformes   |
| P&L par véhicule/chauffeur | Revenus - coûts = marge par entité                |

**→ 1 template, 4 rapports.**

---

#### PATTERN 12 — "Finance Dashboard" → MODULE BILLING

**Source shadcnuikit :** `/dashboards/finance`  
**Sert à :**

| Page FleetCore                     | Contenu                                   |
| ---------------------------------- | ----------------------------------------- |
| Dashboard Finance                  | MRR, ARR, churn, revenue growth           |
| Vue paiements Stripe               | Transactions, statuts, réconciliation     |
| Réconciliation revenus plateformes | Uber/Bolt/Careem → revenus vs commissions |

**→ 1 template, 3 usages.**

---

### 4.3 Pages 1:1 (mapping direct, pas de réutilisation)

| Page shadcnuikit                     | → Page FleetCore                                 |
| ------------------------------------ | ------------------------------------------------ |
| Notifications                        | Notifications FleetCore (in-app)                 |
| Pricing (3 variantes)                | Page pricing/plans FleetCore                     |
| Auth pages (login, register, forgot) | Pages auth (visuel shadcnuikit, Clerk derrière)  |
| Error pages (404/500/403)            | Pages erreur FleetCore                           |
| Empty States (3 variantes)           | États vides dans TOUS les modules                |
| Mail app                             | Templates emails admin / notifications           |
| Notes app                            | Notes sur entités (leads, véhicules, chauffeurs) |
| API Keys                             | Gestion API keys tenants                         |

### 4.4 Éléments obligatoires transversaux

| Élément shadcnuikit   | Statut                                   |
| --------------------- | ---------------------------------------- |
| Theme customizer      | **OBLIGATOIRE** — 7 options complètes    |
| 8 presets de thème    | **OBLIGATOIRE** — tous installés         |
| 11 fonts              | **OBLIGATOIRE** — toutes disponibles     |
| Dark mode automatique | **OBLIGATOIRE** — OKLCH + .dark selector |

### 4.5 Pages shadcnuikit NON installées (aucune correspondance métier)

Hotel/Bookings, Hospital, Academy, Crypto, E-commerce, POS, Social Media, AI Chat, AI Image, Text to Speech, Courses, Fitness widgets, Logistics dashboard (on construit Fleet custom).

**Leurs patterns visuels** (cards, charts, layouts) restent disponibles comme building blocks si besoin.

### 4.6 Résumé de couverture

| Métrique                          | Valeur                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Patterns réutilisables            | 12                                                                                |
| Pages 1:1                         | 9                                                                                 |
| Total pages shadcnuikit utilisées | 21                                                                                |
| Pages shadcnuikit ignorées        | 47                                                                                |
| Pages FleetCore couvertes         | **50+**                                                                           |
| Couverture modules FleetCore      | **100%** (CRM, Fleet, Drivers, Maintenance, Analytics, Admin, Billing, Documents) |

---

## 5. ARCHITECTURE CIBLE

### 5.1 Structure des dossiers

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
│   │       │   └── page.tsx           # Dashboard principal (PATTERN 3)
│   │       ├── crm/
│   │       │   ├── leads/
│   │       │   │   ├── page.tsx       # Pipeline Kanban (PATTERN 4)
│   │       │   │   ├── browser/page.tsx  # Vue table (PATTERN 1)
│   │       │   │   ├── [id]/page.tsx  # Fiche détail (PATTERN 2)
│   │       │   │   └── reports/page.tsx  # Analytics (PATTERN 11)
│   │       │   ├── opportunities/
│   │       │   │   ├── page.tsx       # Pipeline Kanban (PATTERN 4)
│   │       │   │   └── [id]/page.tsx  # Fiche détail (PATTERN 2)
│   │       │   ├── quotes/
│   │       │   │   ├── page.tsx       # Liste (PATTERN 1)
│   │       │   │   └── [id]/page.tsx  # Détail (PATTERN 2)
│   │       │   ├── dashboard/page.tsx # CRM Dashboard (PATTERN 3)
│   │       │   └── settings/page.tsx  # CRM Settings (PATTERN 5)
│   │       ├── fleet/
│   │       │   ├── page.tsx           # Fleet Dashboard (PATTERN 3)
│   │       │   ├── vehicles/
│   │       │   │   ├── page.tsx       # Vehicles List (PATTERN 1)
│   │       │   │   └── [id]/page.tsx  # Vehicle Detail (PATTERN 2)
│   │       │   └── documents/page.tsx # Fleet Documents (PATTERN 8)
│   │       ├── drivers/
│   │       │   ├── page.tsx           # Drivers Dashboard (PATTERN 3)
│   │       │   ├── list/page.tsx      # Drivers List (PATTERN 1)
│   │       │   ├── [id]/page.tsx      # Driver Detail (PATTERN 2)
│   │       │   ├── onboarding/page.tsx # Driver Onboarding (PATTERN 9)
│   │       │   └── planning/page.tsx  # Shifts Planning (PATTERN 6)
│   │       ├── maintenance/
│   │       │   ├── page.tsx           # Calendar maintenance (PATTERN 6)
│   │       │   ├── tasks/page.tsx     # Work Orders (PATTERN 7)
│   │       │   └── history/page.tsx   # Historique (PATTERN 1)
│   │       ├── analytics/
│   │       │   ├── page.tsx           # Analytics Dashboard (PATTERN 11)
│   │       │   └── reports/page.tsx   # Rapports détaillés (PATTERN 11)
│   │       ├── billing/
│   │       │   ├── page.tsx           # Finance Dashboard (PATTERN 12)
│   │       │   ├── invoices/page.tsx  # Invoices List (PATTERN 1)
│   │       │   ├── contracts/page.tsx # Contracts List (PATTERN 1)
│   │       │   └── payments/page.tsx  # Paiements (PATTERN 12)
│   │       ├── documents/
│   │       │   └── page.tsx           # File Manager global (PATTERN 8)
│   │       ├── admin/
│   │       │   ├── page.tsx           # Admin Dashboard
│   │       │   ├── members/page.tsx   # Members List (PATTERN 1)
│   │       │   ├── roles/page.tsx     # RBAC Roles
│   │       │   ├── tenants/page.tsx   # Tenants List (PATTERN 1)
│   │       │   ├── tenants/[id]/page.tsx # Tenant Detail (PATTERN 2)
│   │       │   └── settings/page.tsx  # Tenant Settings (PATTERN 5)
│   │       ├── settings/              # Settings globaux user (PATTERN 5)
│   │       │   ├── page.tsx           # Profile
│   │       │   ├── appearance/page.tsx
│   │       │   └── notifications/page.tsx
│   │       ├── notifications/page.tsx # Notifications (1:1)
│   │       └── chat/page.tsx          # Communication (PATTERN 10)
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
│   └── theme-customizer/              # Theme UI (shadcnuikit — 288L) — OBLIGATOIRE
│
├── features/                          # Modules métier (pattern Kiranism)
│   ├── crm/
│   │   ├── leads/
│   │   │   ├── components/            # leads-view-page, leads-listing-page, leads-table, etc.
│   │   │   ├── hooks/                 # use-leads-store, use-lead-actions
│   │   │   └── utils/
│   │   ├── opportunities/             # Même pattern
│   │   ├── quotes/                    # Même pattern
│   │   └── settings/
│   ├── fleet/
│   │   ├── vehicles/                  # components/ + hooks/
│   │   └── documents/
│   ├── drivers/
│   │   ├── list/                      # components/ + hooks/
│   │   ├── onboarding/
│   │   └── planning/
│   ├── maintenance/
│   │   ├── calendar/
│   │   ├── tasks/
│   │   └── history/
│   ├── analytics/
│   │   ├── dashboard/
│   │   └── reports/
│   ├── billing/
│   │   ├── invoices/
│   │   ├── contracts/
│   │   └── payments/
│   ├── documents/
│   ├── admin/
│   │   ├── members/
│   │   ├── roles/
│   │   ├── tenants/
│   │   └── settings/
│   ├── notifications/
│   └── chat/
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
│   ├── fleet-store.ts                 # Fleet: filtres véhicules
│   ├── drivers-store.ts               # Drivers: filtres chauffeurs
│   └── preferences-store.ts           # Préfs user: locale, thème, page sizes
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
│   └── themes.css                     # 8 presets thème (shadcnuikit)
│
└── types/
    ├── crm.ts                         # Types CRM (INCHANGÉ)
    └── data-table.ts                  # Types TanStack (Kiranism — 40L)
```

### 5.2 Pattern de page cible

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
                                                ————————
                                         Total → 975L réparties en 9 fichiers
                                         Max   → 300L par fichier
                                         Hooks → Logique extraite
                                         Store → État centralisé
```

### 5.3 Matrice composant standardisé → modules

Chaque composant UI est construit UNE FOIS et utilisé partout :

| Composant standard       | CRM                 | Fleet           | Drivers           | Maintenance | Analytics      | Admin             | Billing                  |
| ------------------------ | ------------------- | --------------- | ----------------- | ----------- | -------------- | ----------------- | ------------------------ |
| DataTable (PATTERN 1)    | Leads, Opps, Quotes | Vehicles        | Drivers           | History     | —              | Members, Tenants  | Invoices, Contracts      |
| Detail Page (PATTERN 2)  | Lead, Opp           | Vehicle         | Driver            | —           | —              | Tenant, Member    | Invoice, Contract        |
| Dashboard (PATTERN 3)    | CRM Dash            | Fleet Dash      | Drivers Dash      | —           | Analytics Dash | —                 | Finance Dash             |
| Kanban (PATTERN 4)       | Leads, Opps         | —               | —                 | Work Orders | —              | —                 | —                        |
| Settings (PATTERN 5)     | CRM Settings        | —               | —                 | —           | —              | Tenant Settings   | Billing Settings         |
| Calendar (PATTERN 6)     | Démos               | —               | Shifts            | Planning    | —              | —                 | —                        |
| Tasks (PATTERN 7)        | —                   | —               | Onboarding tasks  | Work Orders | —              | Support tasks     | —                        |
| File Manager (PATTERN 8) | —                   | Docs véhicules  | Docs chauffeurs   | —           | —              | —                 | Factures                 |
| Onboarding (PATTERN 9)   | —                   | Ajout véhicule  | Onboarding driver | —           | —              | Onboarding tenant | —                        |
| Chat (PATTERN 10)        | Notes leads         | —               | Comm. chauffeurs  | —           | —              | Support           | —                        |
| Analytics (PATTERN 11)   | Reports CRM         | Analytics Fleet | Analytics Drivers | —           | Rapports       | —                 | —                        |
| Finance (PATTERN 12)     | —                   | —               | —                 | —           | —              | —                 | Dash, Paiements, Réconc. |
| PageContainer            | ✅ toutes           | ✅ toutes       | ✅ toutes         | ✅ toutes   | ✅ toutes      | ✅ toutes         | ✅ toutes                |
| FilterBar                | ✅ toutes           | ✅ toutes       | ✅ toutes         | ✅ toutes   | ✅ toutes      | ✅ toutes         | ✅ toutes                |
| Stat Cards               | ✅                  | ✅              | ✅                | ✅          | ✅             | ✅                | ✅                       |
| Empty State              | ✅                  | ✅              | ✅                | ✅          | ✅             | ✅                | ✅                       |
| Form Modal               | ✅                  | ✅              | ✅                | ✅          | —              | ✅                | —                        |

---

## 6. PLAN D'EXÉCUTION

### Phase 0 — Migration Next.js 16 (1-2 jours) — ✅ COMPLÉTÉE

| Étape | Action                                                  | Statut |
| ----- | ------------------------------------------------------- | ------ |
| 0.1   | Backup git : `git tag pre-frontend-reshaping`           | ✅     |
| 0.2   | Upgrade Clerk → 6.37.3                                  | ✅     |
| 0.3   | Next.js 15.5.3 → 16.1.6                                 | ✅     |
| 0.4   | ESLint flat config natif (suppression @eslint/eslintrc) | ✅     |
| 0.5   | Upgrade Sentry → 10.38.0                                | ✅     |
| 0.6   | Fix conflit circular structure JSON                     | ✅     |
| 0.7   | Build ✅ Typecheck ✅ Lint ✅                           | ✅     |
| 0.8   | Commit post-next16-migration + push                     | ✅     |

---

### Phase 1 — Fondations visuelles (3-4 jours) — ⏳ EN COURS (~90%)

#### 1A — Theming OKLCH + Composants — ✅ COMPLÉTÉE (commit e056978)

| Étape | Action                                                                                | Statut |
| ----- | ------------------------------------------------------------------------------------- | ------ |
| 1.1.1 | Réécriture globals.css hex → OKLCH                                                    | ✅     |
| 1.1.2 | Création app/themes.css (preset FleetCore, 7 presets, dark mode auto)                 | ✅     |
| 1.1.3 | Couleurs marque FleetCore converties en OKLCH                                         | ✅     |
| 1.1.4 | Suppression tokens FC hex (--fc-\*)                                                   | ✅     |
| 1.2.1 | 17 packages NPM installés                                                             | ✅     |
| 1.2.2 | 30 composants copiés depuis shadcnuikit                                               | ✅     |
| 1.2.3 | 13 composants upgradés (Badge, Button, Select, etc.)                                  | ✅     |
| 1.2.4 | 4 composants FC supérieurs préservés (empty-state, progress-bar, skeleton, stat-card) | ✅     |
| 1.2.5 | Dead code supprimé                                                                    | ✅     |
| 1.2.6 | Build ✅ (128 pages) Typecheck ✅ Lint ✅                                             | ✅     |

**Bilan Phase 1A :** 7 commits, 95 fichiers impactés. Audit holistique complet effectué.

#### Audit holistique Phase 1A-1B (résultats)

| Classification                                                     | Fichiers     | Risque           |
| ------------------------------------------------------------------ | ------------ | ---------------- |
| 🟢 CONFORME — copié fidèlement shadcnuikit                         | ~53 fichiers | 0                |
| 🔵 GREFFE LÉGITIME — FleetCore fonctionnel, invisible visuellement | ~35 fichiers | 0                |
| 🟡 FC SUPÉRIEUR — validé cas par cas                               | 7 éléments   | 0 (tous validés) |
| 🔴 INVENTION — n'existe PAS dans shadcnuikit                       | 8 éléments   | **À corriger**   |

**7 exceptions FleetCore validées (liste DÉFINITIVE, FERMÉE) :**

| #   | Élément                              | Justification               |
| --- | ------------------------------------ | --------------------------- |
| S1  | Active state startsWith              | Routes profondes CRM        |
| S2  | Collapsible defaultOpen module-level | Auto-ouverture module actif |
| S3  | Skeleton Framer Motion shimmer       | Animation supérieure        |
| S4  | Toaster dans layout                  | Feedback notifications      |
| S5  | Logo = lien dashboard                | Pas de project switcher     |
| S6  | Nom/email visible dans header        | Paramètre utilisateur futur |
| S7  | Footer "© FleetCore 2026"           | Remplace NavUser/promo card |

**Tout le reste = shadcnuikit exact. Zéro variante. Zéro invention.**

**8 inventions à corriger :**

| #   | Fichier                            | Invention                          | Action                                 |
| --- | ---------------------------------- | ---------------------------------- | -------------------------------------- |
| I1  | header/breadcrumbs.tsx             | Composant breadcrumb global header | SUPPRIMER                              |
| I2  | lib/hooks/useBreadcrumbs.ts        | Hook auto-mapping pathname         | SUPPRIMER                              |
| I3  | lib/contexts/BreadcrumbContext.tsx | Context + Provider                 | SUPPRIMER                              |
| I4  | site-header.tsx L28                | `<Breadcrumbs />` intégré          | RETIRER                                |
| I5  | layout.tsx L43                     | `<BreadcrumbProvider>` wrapper     | RETIRER                                |
| I6  | LeadDetailHeader.tsx L177-180      | `<BreadcrumbOverride>`             | RETIRER, restaurer breadcrumb per-page |
| I7  | settings/crm/layout.tsx            | Breadcrumb brut supprimé           | RESTAURER per-page                     |
| I8  | app-sidebar.tsx L301               | `<SidebarRail />`                  | RETIRER                                |

**Effet net I1-I7 :** revert complet du breadcrumb system inventé.

#### 1B — Layout shadcnuikit — ⏳ EN COURS

| Étape    | Action                                                               | Statut                                          |
| -------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| 1B.1     | Installation sidebar.tsx (686L, 24 exports) + use-mobile.ts          | ✅ commit 3b2dad1                               |
| 1B.1-fix | Micro-audit skeleton.tsx — régression Framer Motion corrigée         | ✅ commit 9cabf72                               |
| 1B.2     | Remplacement layout (app-sidebar.tsx + site-header.tsx + layout.tsx) | ✅ commit 035f328                               |
| 1B.2r    | Rattrapage 13 écarts identifiés par audit                            | ✅                                              |
| 1B.3     | Breadcrumbs automatiques                                             | **❌ ANNULÉ** — invention, pas dans shadcnuikit |
| 1B.4     | Inner wrapper fix + PageContainer                                    | **⏳ PROCHAINE ACTION**                         |

**1B.4 — Précision sur PageContainer :**

PageContainer n'est PAS un composant shadcnuikit. C'est un pattern d'ingénierie (Kiranism) qui respecte la règle des 2 couches :

- **Couche 1 (UX/Visuel) = shadcnuikit.** Le HTML rendu est pixel-perfect identique au inner wrapper de shadcnuikit.
- **Couche 2 (Technique/Code) = best-in-class.** Un composant DRY qui évite de copier-coller les mêmes 5 lignes dans 50+ fichiers.

**Avant de coder 1B.4, Claude Code doit vérifier** dans shadcnuikit comment chaque page wraps son contenu (classes CSS, padding, max-width) pour reproduire exactement ce markup.

---

### Phase 2 — Système DataTable standardisé (3-5 jours)

**Objectif :** Construire le PATTERN 1 — le composant DataTable unique basé sur TanStack Table qui servira à 10+ pages.

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

**Vérification :** Les 3 tables CRM fonctionnent avec le même DataTable. ~80 lignes de config par table au lieu de ~700L custom.

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

| Étape | Action                                                                            | Source                               |
| ----- | --------------------------------------------------------------------------------- | ------------------------------------ |
| 4.1   | Intégrer KBar (Cmd+K command palette) avec navigation vers TOUTES les pages (50+) | Kiranism kbar/                       |
| 4.2   | Configurer les raccourcis : navigation, création rapide, recherche globale        | Config FleetCore                     |
| 4.3   | Implémenter le search global (leads, opportunities, quotes, vehicles, drivers)    | cmdk + actions FleetCore             |
| 4.4   | Ajouter les transitions de page (Framer Motion)                                   | shadcnuikit patterns                 |
| 4.5   | Theme customizer complet (8 presets, 11 fonts, 7 options)                         | shadcnuikit (288L) — **OBLIGATOIRE** |

---

### Phase 5 — Dashboards enrichis (3-4 jours)

**Objectif :** Construire les 5 dashboards (PATTERN 3) avec données réelles.

| Étape | Action                                                             | Pattern                   |
| ----- | ------------------------------------------------------------------ | ------------------------- |
| 5.1   | Dashboard principal FleetCore (overview global cross-modules)      | PATTERN 3 + streaming SSR |
| 5.2   | CRM Dashboard (pipeline value, conversion, leads/mois, forecast)   | PATTERN 3                 |
| 5.3   | Fleet Dashboard (véhicules actifs, utilisation %, maintenance due) | PATTERN 3                 |
| 5.4   | Drivers Dashboard (chauffeurs actifs, heures, performance)         | PATTERN 3                 |
| 5.5   | Finance Dashboard (MRR, paiements, impayés)                        | PATTERN 12                |
| 5.6   | Adapter les charts Recharts v2 → v3 pour tous les dashboards       | Adaptation mécanique      |
| 5.7   | Connecter aux données réelles via Server Components + Prisma       | FleetCore backend         |

**Vérification :** 5 dashboards fonctionnels avec données réelles. Streaming SSR (widgets chargent progressivement).

---

### Phase 6 — Refactoring CRM complet (3-4 jours)

**Objectif :** Appliquer les patterns aux modules CRM restants (Opportunities, Quotes, Settings).

| Étape | Action                                                                                               |
| ----- | ---------------------------------------------------------------------------------------------------- |
| 6.1   | Refactorer OpportunityDrawer.tsx (1021L) en composants features/                                     |
| 6.2   | Créer opportunities-kanban.tsx (PATTERN 4), opportunity-drawer.tsx (PATTERN 2), opportunity-form.tsx |
| 6.3   | Créer use-opportunities-store.ts (Zustand)                                                           |
| 6.4   | Refactorer les pages Quotes (PATTERN 1 + PATTERN 2)                                                  |
| 6.5   | Reconstruire CRM Settings (PATTERN 5) avec tabs + PipelineStageEditor                                |
| 6.6   | Créer CRM Reports page (PATTERN 11) — funnel, conversion, sources                                    |
| 6.7   | Appliquer le nouveau layout et theming sur toutes les pages CRM                                      |

---

### Phase 7 — Module Fleet (3-4 jours)

**Objectif :** Construire les pages Fleet avec les patterns standardisés. Backend connecté si existant, empty states sinon.

| Étape | Action                                                                                   | Pattern   |
| ----- | ---------------------------------------------------------------------------------------- | --------- |
| 7.1   | Vehicles List — DataTable avec colonnes (immat, modèle, classe, statut, km, assignation) | PATTERN 1 |
| 7.2   | Vehicle Detail — Tabs (infos, documents, maintenance history, revenus, affectation)      | PATTERN 2 |
| 7.3   | Fleet Documents — Gestion docs véhicules (carte grise, assurance, CT)                    | PATTERN 8 |
| 7.4   | Créer fleet-store.ts (Zustand) — filtres, sélection, modals                              | —         |
| 7.5   | Créer vehicle-columns.tsx, vehicles-table.tsx                                            | —         |
| 7.6   | Connecter aux Server Actions Fleet ou empty states                                       | —         |

---

### Phase 8 — Module Drivers (3-4 jours)

**Objectif :** Construire les pages Drivers avec les patterns standardisés.

| Étape | Action                                                                              | Pattern   |
| ----- | ----------------------------------------------------------------------------------- | --------- |
| 8.1   | Drivers List — DataTable avec colonnes (nom, statut, véhicule, heures, performance) | PATTERN 1 |
| 8.2   | Driver Detail — Tabs (infos, permis/docs, performance, shifts, revenus)             | PATTERN 2 |
| 8.3   | Driver Onboarding — Wizard multi-step (infos → docs → affectation → formation)      | PATTERN 9 |
| 8.4   | Shifts Planning — Calendar avec planning shifts                                     | PATTERN 6 |
| 8.5   | Créer drivers-store.ts (Zustand)                                                    | —         |
| 8.6   | Connecter aux Server Actions Drivers ou empty states                                | —         |

---

### Phase 9 — Modules Maintenance + Documents + Billing (4-5 jours)

**Objectif :** Construire les 3 modules restants.

#### 9.1 Maintenance (2 jours)

| Étape | Action                                              | Pattern   |
| ----- | --------------------------------------------------- | --------- |
| 9.1.1 | Calendar maintenance — Planning interventions       | PATTERN 6 |
| 9.1.2 | Work Orders — Kanban (backlog → in progress → done) | PATTERN 4 |
| 9.1.3 | Tasks list — DataTable work orders                  | PATTERN 7 |
| 9.1.4 | Historique interventions                            | PATTERN 1 |

#### 9.2 Documents (1 jour)

| Étape | Action                                                   | Pattern   |
| ----- | -------------------------------------------------------- | --------- |
| 9.2.1 | File Manager global — Vue centralisée tous documents     | PATTERN 8 |
| 9.2.2 | Filtres par type (véhicule, chauffeur, contrat, facture) | —         |
| 9.2.3 | Alertes expiration                                       | —         |

#### 9.3 Billing (1-2 jours)

| Étape | Action                              | Pattern    |
| ----- | ----------------------------------- | ---------- |
| 9.3.1 | Invoices List — DataTable factures  | PATTERN 1  |
| 9.3.2 | Contracts List — DataTable contrats | PATTERN 1  |
| 9.3.3 | Payments — Vue paiements Stripe     | PATTERN 12 |
| 9.3.4 | Billing Settings                    | PATTERN 5  |

---

### Phase 10 — Module Admin (2-3 jours)

**Objectif :** Construire les pages d'administration système.

| Étape | Action                                                          | Pattern   |
| ----- | --------------------------------------------------------------- | --------- |
| 10.1  | Members List — DataTable avec rôles, statut, dernière connexion | PATTERN 1 |
| 10.2  | Member Detail — Tabs (infos, rôles, sessions, audit)            | PATTERN 2 |
| 10.3  | Tenants List — DataTable avec statut, plan, véhicules           | PATTERN 1 |
| 10.4  | Tenant Detail — Tabs (infos, members, settings, lifecycle)      | PATTERN 2 |
| 10.5  | RBAC Roles — Configuration rôles et permissions                 | —         |
| 10.6  | Tenant Settings — Configuration par tenant                      | PATTERN 5 |
| 10.7  | Provider Employees — Staff FleetCore                            | PATTERN 1 |

---

### Phase 11 — Module Analytics + Transversaux (2-3 jours)

**Objectif :** Rapports, notifications, communication, API keys.

| Étape | Action                                                 | Pattern         |
| ----- | ------------------------------------------------------ | --------------- |
| 11.1  | Analytics Dashboard — Rapports globaux                 | PATTERN 11      |
| 11.2  | CRM Reports détaillés — Funnel, conversion, cycle time | PATTERN 11      |
| 11.3  | Fleet Analytics — Utilisation, coûts, revenus/véhicule | PATTERN 11      |
| 11.4  | Drivers Analytics — Performance, heures, revenus       | PATTERN 11      |
| 11.5  | Notifications page                                     | 1:1 shadcnuikit |
| 11.6  | Chat/Communication                                     | PATTERN 10      |
| 11.7  | API Keys management                                    | 1:1 shadcnuikit |
| 11.8  | User Settings (profile, appearance, notifications)     | PATTERN 5       |

---

### Phase 12 — Pages erreur + Auth visuel + Empty States (1-2 jours)

**Objectif :** Toutes les pages statiques.

| Étape | Action                                                  | Source                            |
| ----- | ------------------------------------------------------- | --------------------------------- |
| 12.1  | Page 404 personnalisée FleetCore                        | shadcnuikit 404                   |
| 12.2  | Page 500 personnalisée                                  | shadcnuikit 500                   |
| 12.3  | Page 403 (accès refusé)                                 | shadcnuikit 403                   |
| 12.4  | Pages auth — refonte visuelle (login, register, forgot) | shadcnuikit auth + Clerk derrière |
| 12.5  | 3 variantes Empty States disponibles dans tous modules  | shadcnuikit empty states          |

---

### Phase 13 — Accessibilité et polish (2-3 jours)

**Objectif :** Passer de 2/10 à un score acceptable (7/10+).

| Étape | Action                                                                     |
| ----- | -------------------------------------------------------------------------- |
| 13.1  | Ajouter prefers-reduced-motion sur toutes les animations Framer Motion     |
| 13.2  | Audit et ajout des aria-labels sur tous les éléments interactifs           |
| 13.3  | Implémenter la navigation clavier complète (focus traps modals, tab order) |
| 13.4  | Corriger les contrastes (454+ instances text-gray-300/400 sur blanc)       |
| 13.5  | Ajouter les semantic HTML (main, section, nav)                             |
| 13.6  | Tester avec un lecteur d'écran (VoiceOver macOS)                           |

---

### Phase 14 — Nettoyage et validation finale (2-3 jours)

**Objectif :** Supprimer tout le code legacy, valider la cohérence globale.

| Étape | Action                                                                             |
| ----- | ---------------------------------------------------------------------------------- |
| 14.1  | Supprimer l'ancien dossier components/crm/ (106 fichiers legacy)                   |
| 14.2  | Supprimer l'ancien dossier components/app/ (AppShell, ModulesSidebar, AppHeader)   |
| 14.3  | Supprimer les tokens FC hex de globals.css                                         |
| 14.4  | Nettoyer les imports orphelins                                                     |
| 14.5  | Remplacer toutes les couleurs Tailwind brutes restantes par des tokens sémantiques |
| 14.6  | Vérifier que CHAQUE page (50+) compile et fonctionne                               |
| 14.7  | Run full test suite — 0 régression                                                 |
| 14.8  | Build production — 0 erreur, 0 warning                                             |
| 14.9  | Audit navigation complète — chaque lien sidebar mène à une page fonctionnelle      |

---

## 7. ESTIMATION GLOBALE

| Phase     | Description                                                       | Durée estimée       | Statut                                 |
| --------- | ----------------------------------------------------------------- | ------------------- | -------------------------------------- |
| 0         | Migration Next.js 16                                              | 1-2 jours           | **✅ COMPLÉTÉE**                       |
| 1A        | Theming OKLCH + Composants shadcn/ui                              | 1-2 jours           | **✅ COMPLÉTÉE**                       |
| 1B        | Layout shadcnuikit (sidebar, header, PageContainer)               | 1-2 jours           | **⏳ ~80%** — 1B.4 PageContainer reste |
| 2         | DataTable standardisé (TanStack) — PATTERN 1                      | 3-5 jours           | 🔲 À faire                             |
| 3         | Refactoring God Components + Zustand                              | 3-4 jours           | 🔲 À faire                             |
| 4         | Navigation et UX avancée (KBar, search)                           | 2 jours             | 🔲 À faire                             |
| 5         | Dashboards enrichis (5 dashboards) — PATTERNS 3+12                | 3-4 jours           | 🔲 À faire                             |
| 6         | CRM complet (Opportunities, Quotes, Settings, Reports)            | 3-4 jours           | 🔲 À faire                             |
| 7         | Module Fleet (Vehicles, Documents)                                | 3-4 jours           | 🔲 À faire                             |
| 8         | Module Drivers (List, Detail, Onboarding, Planning)               | 3-4 jours           | 🔲 À faire                             |
| 9         | Modules Maintenance + Documents + Billing                         | 4-5 jours           | 🔲 À faire                             |
| 10        | Module Admin (Members, Tenants, RBAC, Settings)                   | 2-3 jours           | 🔲 À faire                             |
| 11        | Analytics + Transversaux (Reports, Notifications, Chat, API Keys) | 2-3 jours           | 🔲 À faire                             |
| 12        | Pages erreur + Auth visuel + Empty States                         | 1-2 jours           | 🔲 À faire                             |
| 13        | Accessibilité et polish                                           | 2-3 jours           | 🔲 À faire                             |
| 14        | Nettoyage et validation finale                                    | 2-3 jours           | 🔲 À faire                             |
| **TOTAL** |                                                                   | **35-50 jours dev** | **~15% complété**                      |

> **Note :** Ces estimations sont en jours de développement pur (prompts + exécution + validation). Le calendrier réel sera plus long avec le cycle ULTRATHINK (prompt → plan → validation → exécution → vérification).

---

## 8. MÉTRIQUES DE SUCCÈS

### 8.1 Objectifs quantitatifs

| Métrique                             | Avant                    | Après                                                                     | Cible                         |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------------- | ----------------------------- |
| Plus gros fichier composant          | 1293L (PipelineSettings) | < 300L                                                                    | ✅ Aucun fichier > 300L       |
| God Components (>500L, >10 useState) | 3                        | 0                                                                         | ✅ Zéro God Component         |
| Custom hooks extraits                | 0                        | 20+                                                                       | ✅ Logique séparée            |
| Zustand stores                       | 0                        | 6+                                                                        | ✅ État centralisé            |
| Tables custom dupliquées             | 3 (2100L)                | 0                                                                         | ✅ 1 DataTable standard       |
| Tokens FC vs raw Tailwind            | 1:66                     | 1:1                                                                       | ✅ 100% tokens sémantiques    |
| Composants shadcn installés          | 23                       | 58                                                                        | ✅ Kit complet                |
| Accessibilité score                  | 2/10                     | 7/10+                                                                     | ✅ WCAG 2.1 AA partiel        |
| Pages applicatives                   | ~10                      | **50+**                                                                   | ✅ Toutes zones couvertes     |
| Modules avec pages                   | 1 (CRM)                  | **8** (CRM, Fleet, Drivers, Maint., Analytics, Billing, Documents, Admin) | ✅ Tous modules opérationnels |
| Theme presets disponibles            | 1                        | **8**                                                                     | ✅ Personnalisation complète  |
| Frontend score global                | 4/10                     | **8/10+**                                                                 | ✅ Enterprise-grade           |

### 8.2 Critères de validation par phase

Chaque phase est validée par :

1. ✅ `pnpm build` réussi (0 erreur)
2. ✅ Tests existants passent (0 régression)
3. ✅ Navigation complète fonctionnelle
4. ✅ Auth Clerk opérationnelle
5. ✅ Données réelles affichées correctement (ou empty states cohérents si backend absent)
6. ✅ Dark mode fonctionne sur toute la zone touchée
7. ✅ Git tag de sauvegarde créé avant et après

---

## 9. RISQUES ET MITIGATIONS

| Risque                                                                | Impact                  | Probabilité | Mitigation                                                                                  |
| --------------------------------------------------------------------- | ----------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| Sentry v10→v11 breaking changes                                       | Monitoring cassé        | Moyenne     | Upgrade séparé, monitoring peut attendre                                                    |
| Composants shadcnuikit incompatibles Next 15 (si migration 16 échoue) | Adaptations nécessaires | Faible      | Composants sont du React pur, peu de dépendance Next                                        |
| Server Actions ne matchent pas le nouveau frontend                    | Connexion cassée        | Faible      | Backend inchangé, seule l'UI layer change                                                   |
| Recharts v2→v3 adaptations plus lourdes que prévu                     | Charts cassées          | Faible      | Isoler dans chart.tsx wrapper, adapter au cas par cas                                       |
| Backend absent pour modules Fleet/Drivers/Maintenance                 | Pages sans données      | **Élevée**  | Créer avec empty states informatifs, connecter le backend quand prêt                        |
| Performance régression (nouveau layout + composants)                  | UX dégradée             | Faible      | Streaming SSR, Suspense, monitoring Vercel                                                  |
| Scope 50+ pages = dérapage calendaire                                 | Retard                  | Moyenne     | Les 12 patterns réduisent le travail — chaque nouvelle page = config, pas code from scratch |

---

## 10. RÈGLES D'EXÉCUTION

### 10.1 Protocole par phase

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

### 10.2 Interdits absolus

- ❌ Modifier un Server Action, un service, ou un schéma Zod
- ❌ Modifier le schema.prisma
- ❌ Modifier le middleware (sauf renommage optionnel)
- ❌ Modifier les pages publiques (homepage, booking, auth)
- ❌ Casser l'isolation multi-tenant
- ❌ Supprimer du code avant d'avoir son remplacement validé
- ❌ Procéder à la phase N+1 sans validation complète de la phase N
- ❌ Inventer un élément visuel absent de shadcnuikit
- ❌ Marquer quoi que ce soit comme "optionnel" si c'est dans shadcnuikit

### 10.3 Ordre de priorité en cas de conflit

1. **Backend fonctionne** (jamais de régression backend)
2. **Auth fonctionne** (jamais de page accessible sans auth)
3. **Données réelles** (pas de mock en production)
4. **Cohérence visuelle** (tout le frontend sur le même système)
5. **Features complètes** (pas de demi-implémentation)

### 10.4 Règle d'or rappel

> **shadcnuikit = rendu visuel pixel-perfect (le QUOI), Kiranism + best practices = code technique (le COMMENT). Navigateur = identique. Code = supérieur. ZÉRO invention UI.**

---

## 11. FICHIERS DE RÉFÉRENCE

| Document                                                | Contenu                                              |
| ------------------------------------------------------- | ---------------------------------------------------- |
| Audit inventaire frontend (13/02/2026)                  | Structure, composants, dépendances                   |
| Audit qualité complet (13/02/2026)                      | Notes UI/Backend, God Components, design system      |
| Analyse comparative Kiranism × shadcnuikit (13/02/2026) | Solutions par problème, composants à extraire        |
| Vérification compatibilité Next 16 (13/02/2026)         | Bloqueurs, breaking changes, commandes migration     |
| Inventaire exhaustif shadcnuikit (13/02/2026)           | 68 routes, 8 thèmes, 99 composants, sidebar complète |
| FLEETCORE_UX_REFONTE_STATUS_COMPLET.md                  | Historique tentative Velzon, leçons apprises         |
| FLEETCORE_ROADMAP_MVP.md                                | Roadmap globale 15 semaines                          |

---

> **Ce plan est vivant.** Il sera mis à jour à chaque phase complétée avec les résultats réels, les déviations constatées, et les ajustements nécessaires. Chaque modification sera documentée avec la date et la raison du changement.

---

**Document créé le :** 13 Février 2026  
**Version :** 2.0  
**Prêt pour exécution :** Phase 1B.4 en cours  
**Prochaine action :** Phase 1B.4 — Revert inventions I1-I8 + Inner wrapper + PageContainer
