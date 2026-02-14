# FLEETCORE — DOCUMENT DE CONTINUITÉ RESHAPING FRONTEND

# STATUS REPORT ULTRA-DÉTAILLÉ POUR REPRISE DE SESSION

> **Date :** 13 Février 2026  
> **Auteur :** Mohamed (CEO/CTO) + Architecture Claude  
> **Objectif :** Ce document contient TOUT le contexte nécessaire pour qu'un nouveau chat Claude Code puisse reprendre le travail EXACTEMENT là où on s'est arrêté. Aucune improvisation, aucune déduction, aucune interprétation.

---

## TABLE DES MATIÈRES

1. [CONTEXTE PROJET](#1-contexte-projet)
2. [HISTORIQUE DES TENTATIVES DE REFONTE](#2-historique-des-tentatives-de-refonte)
3. [LA RÈGLE D'OR — NON NÉGOCIABLE](#3-la-règle-dor--non-négociable)
4. [ÉTAT D'AVANCEMENT EXACT](#4-état-davancement-exact)
5. [AUDIT HOLISTIQUE — RÉSULTATS COMPLETS](#5-audit-holistique--résultats-complets)
6. [LES 7 EXCEPTIONS FLEETCORE — LISTE FERMÉE](#6-les-7-exceptions-fleetcore--liste-fermée)
7. [LES 8 INVENTIONS À CORRIGER](#7-les-8-inventions-à-corriger)
8. [PROCHAINE ACTION : PHASE 1B.4](#8-prochaine-action--phase-1b4)
9. [PLAN COMPLET PHASES 2-14](#9-plan-complet-phases-2-14)
10. [STACK TECHNIQUE EXACT](#10-stack-technique-exact)
11. [CHEMINS FICHIERS ET RÉFÉRENCES](#11-chemins-fichiers-et-références)
12. [RÈGLES D'EXÉCUTION ET INTERDITS](#12-règles-dexécution-et-interdits)
13. [LEÇONS APPRISES — ERREURS À NE PAS RÉPÉTER](#13-leçons-apprises--erreurs-à-ne-pas-répéter)

---

## 1. CONTEXTE PROJET

### Qu'est-ce que FleetCore ?

FleetCore est un SaaS B2B multi-tenant de gestion de flottes VTC/taxi. Il cible les marchés UAE, France, MENA. Le pricing est de €25-50/véhicule/mois, avec un objectif de 2000-5000 véhicules gérés sous 2 ans.

### Le problème

Le backend de FleetCore est excellent (9/10) — Server Actions, Prisma, Zod, Clerk, audit trails, RBAC, multi-tenant isolation. Mais le frontend est à 4/10 — il ressemble à un "site web amateur" et non à une "application enterprise configurable". Aucun client B2B ne paiera pour un outil qui a l'air amateur, même si le backend est impeccable.

Citation directe de Mohamed : **"Frontend basique = pas de clients même si l'outil fonctionne"**

### L'objectif de la refonte

Passer le frontend de 4/10 à 8/10 enterprise-grade, SANS toucher au backend. On reconstruit uniquement la couche de présentation.

### Score détaillé AVANT refonte

| Zone                      | Note   | Constat                                                 |
| ------------------------- | ------ | ------------------------------------------------------- |
| Backend — Server Actions  | 9/10   | Enterprise-grade. Zod + Auth + Audit partout.           |
| Backend — Prisma/DB       | 9/10   | 630 index, transactions, isolation tenant.              |
| Backend — Sécurité        | 8.5/10 | Rate limiting, 0 injection, 0 XSS.                      |
| Backend — Error Handling  | 9/10   | Classes custom, handler centralisé.                     |
| Frontend — Composants CRM | 4/10   | God Components, duplication massive, 0 custom hooks.    |
| Frontend — Tables         | 5/10   | Custom ~700L/table, dupliqué 3×, pas de virtualisation. |
| Frontend — Design System  | 3/10   | Défini mais ignoré. Ratio tokens 1:66.                  |
| Frontend — Accessibilité  | 2/10   | 0 reduced-motion, 4% keyboard, 10% ARIA.                |
| Frontend — Responsive     | 6.5/10 | Partiellement implémenté.                               |

### Chiffres de la dette frontend

- 33 510 lignes de code CRM frontend
- LeadsPageClient.tsx : 1098 lignes, 24 useState, 73 fonctions inline, 0 custom hooks
- PipelineSettingsTab.tsx : 1293 lignes, 95% de code dupliqué
- Tables custom : ~700 lignes × 3 tables = 2100 lignes de duplication
- 2238 occurrences de couleurs Tailwind brutes (design system ignoré à 87%)
- 51 fichiers avec du hex hardcodé
- 0 store Zustand — tout en useState local
- 0 composant TanStack Table
- 5 zones applicatives dans la sidebar avec 0 page (Fleet, Drivers, Maintenance, Analytics, Admin)

---

## 2. HISTORIQUE DES TENTATIVES DE REFONTE

### Chronologie complète

**12 Février 2026 — Journée d'exploration et d'échecs**

| Heure      | Action                                                     | Résultat                                                                                         |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Matin      | Audit UX comparatif vs Salesforce — 15 composants analysés | Plan 25.5 jours → REJETÉ (trop ambitieux)                                                        |
| Après-midi | POC Salesforce-inspired sur Leads Pipeline (6 chantiers)   | **ÉCHEC PARTIEL** — Path Component = doublon des colonnes Kanban                                 |
| 16h        | Analyse 9 screenshots Salesforce réels                     | Réalisation : Path Component = pages DÉTAIL uniquement, JAMAIS sur listes                        |
| 17h        | Correction : suppression Path, ajout bande métriques       | "Mieux mais pas abouti" — 2 search bars, "ultra figé"                                            |
| 18h        | Pivot vers template Velzon (ThemeForest 4.4.2)             | Décision de garder en backup                                                                     |
| 18h-20h    | Exploration frameworks : Bootstrap, AntD, MUI, SLDS        | **Conclusion :** les vrais CRM (Salesforce, HubSpot) construisent TOUS leur design system custom |
| 20h        | Découverte shadcn/ui comme base — 106K stars GitHub        | Intérêt confirmé                                                                                 |

**Leçons du 12 février :**

1. Claude Code copie des composants sans comprendre le CONTEXTE d'utilisation
2. Screenshots réels > descriptions textuelles
3. Template acheté > improvisation
4. Backup git avant chaque changement majeur

**13 Février 2026 — Journée de décision et d'exécution**

| Heure | Action                                                                | Résultat                                                 |
| ----- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| 09h   | Décision achat shadcnuikit.com ($79) + clonage Kiranism (gratuit)     | Templates en local                                       |
| 10h   | Audit frontend complet FleetCore (structure, composants, dépendances) | Backend 9/10, Frontend 4/10 confirmé                     |
| 11h   | Analyse comparative Kiranism × shadcnuikit                            | Rôles clarifiés : shadcnuikit=visuel, Kiranism=technique |
| 12h   | Vérification compatibilité Next 16                                    | Bloqueurs identifiés : Clerk, Sentry                     |
| 13h   | Plan V1 créé (FLEETCORE_FRONTEND_RESHAPING_PLAN.md)                   | 665 lignes                                               |
| 14h   | **Phase 0 exécutée** — Migration Next.js 16                           | ✅ 100% — Next 16.1.6, Clerk 6.37.3, Sentry 10.38.0      |
| 14h30 | **Phase 1A exécutée** — Theming OKLCH + 30 composants                 | ✅ 100% — commit e056978                                 |
| 15h   | **Phase 1B.1** — sidebar.tsx installé                                 | ✅ commit 3b2dad1                                        |
| 15h15 | Micro-audit skeleton.tsx — régression Framer Motion corrigée          | ✅ commit 9cabf72                                        |
| 15h30 | **Phase 1B.2** — layout remplacé (app-sidebar + site-header + layout) | ✅ commit 035f328                                        |
| 16h   | **Phase 1B.2r** — Rattrapage 13 écarts identifiés par audit           | ✅                                                       |
| 16h30 | **Phase 1B.3** — Breadcrumbs exécuté PUIS **ANNULÉ**                  | ❌ INVENTION détectée                                    |
| 17h   | Audit holistique complet — 95 fichiers classifiés                     | 7 exceptions validées, 8 inventions identifiées          |
| 17h30 | Inventaire exhaustif shadcnuikit (68 routes, 8 thèmes, 99 composants) | Scope clarifié                                           |
| 18h   | Plan V2 créé (réécriture complète avec 12 patterns intelligents)      | 1090 lignes                                              |
| 18h30 | Statut corrigé dans Plan V2                                           | Phase 0 ✅, 1A ✅, 1B ~80%                               |

---

## 3. LA RÈGLE D'OR — NON NÉGOCIABLE

> **shadcnuikit = rendu visuel pixel-perfect (le QUOI), Kiranism + best practices = code technique (le COMMENT). Navigateur = identique. Code = supérieur. ZÉRO invention UI.**

### Les 2 couches

**Couche 1 — UX/Visuel = shadcnuikit. Non négociable.**  
Le résultat dans le navigateur DOIT être pixel-perfect identique au template acheté. Le HTML rendu, les classes CSS, l'espacement, les couleurs, tout.

**Couche 2 — Technique/Code = best-in-class.**  
Comment on produit ce résultat. Là on prend les meilleures décisions d'ingénierie (Kiranism, patterns propres, DRY).

### Hiérarchie des sources (en cas de conflit)

| Priorité | Source          | Rôle                                                                                                                                          | Chemin local                                            |
| -------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **1**    | **shadcnuikit** | LA CIBLE. Layout, sidebar, header, visuels, composants — TOUT vient de shadcnuikit                                                            | `/Users/mohamedfodil/Documents/references/shadcnuikit/` |
| **2**    | **Kiranism**    | Boîte à outils UNIQUEMENT pour ce que shadcnuikit ne gère pas (Clerk auth, cookie bridge, user session, DataTable TanStack, Zustand patterns) | `/Users/mohamedfodil/Documents/references/kiranism/`    |
| **3**    | **FleetCore**   | Données métier. Navigation, RBAC, feature flags, i18n, multi-tenant                                                                           | `/Users/mohamedfodil/Documents/fleetcore5/`             |

### Les 4 prérequis non négociables (mot pour mot)

**P1 — Layout = shadcnuikit exact.**  
Sidebar, header, zone de contenu, navigation identiques au template shadcnuikit. Pas "inspiré de", pas "adapté" — le même layout branché sur le backend FleetCore.

**P2 — Composants standardisés.**  
Chaque composant UI (DataTable, Kanban, StatCard, Form fields, Drawers, Modals) est construit UNE fois et réutilisé dans TOUTES les sections — CRM, Fleet, Drivers, Maintenance, Analytics, Admin. Zéro duplication, zéro code custom par page.

**P3 — Périmètre = app uniquement.**  
Ne PAS toucher les pages publiques (homepage, homepage-v2, solopreneur, booking, auth, terms, payment). Le portail web reste tel quel. La refonte concerne uniquement la zone `(app)/` — tout ce qui est derrière l'authentification.

**P4 — Backend inchangé.**  
Server Actions, Prisma, Zod, Clerk middleware, i18n, multi-tenant — zéro modification. On reconstruit la couche de présentation, pas la logique métier.

### Ce que "greffe FleetCore" veut dire

Les seuls ajouts acceptés par rapport à shadcnuikit sont des greffes **INVISIBLES visuellement** :

- Clerk authentication (remplace le UserMenu shadcnuikit)
- i18n (useTranslation pour les labels)
- RBAC (useHasPermission pour filtrer la navigation)
- Feature flags (useCrmFeatureFlags)
- Multi-tenant (buildProviderFilter)
- Routes localisées (useLocalizedPath)
- Logo FleetCore (remplace le logo shadcnuikit)

**Ces greffes ne changent PAS le look. Le navigateur affiche shadcnuikit.**

### Citation directe de Mohamed sur les inventions

> "l'objectif est simple je VEUX REMPLACER le design horrible de fleetcore, j'ai acheté un modèle POUR LE REMPLACER pas pour l'adapter!!!!! les seuls changements que j'accepte est si fleetcore le fait mieux ou des particularités type i18n et fonctionnalités propres à fleetcore. VOUS ÊTES ENCORE DANS L'invention je ne veux pas d'inventions"

---

## 4. ÉTAT D'AVANCEMENT EXACT

### Vue d'ensemble

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

### Détail Phase 0 — ✅ COMPLÉTÉE

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

### Détail Phase 1A — ✅ COMPLÉTÉE (commit e056978)

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

**Bilan quantitatif Phase 1A :** 7 commits, 95 fichiers impactés.

### Détail Phase 1B — ⏳ EN COURS (~80%)

| Étape    | Action                                                                       | Statut                                                                       |
| -------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1B.1     | Installation sidebar.tsx (686L, 24 exports) + use-mobile.ts                  | ✅ commit 3b2dad1                                                            |
| 1B.1-fix | Micro-audit skeleton.tsx — régression Framer Motion détectée et corrigée     | ✅ commit 9cabf72                                                            |
| 1B.2     | Remplacement layout (app-sidebar.tsx + site-header.tsx + layout.tsx modifié) | ✅ commit 035f328                                                            |
| 1B.2r    | Rattrapage 13 écarts identifiés par audit holistique                         | ✅                                                                           |
| 1B.3     | Breadcrumbs automatiques                                                     | **❌ ANNULÉ** — invention, shadcnuikit n'a PAS de breadcrumbs dans le header |
| 1B.4     | Inner wrapper fix + PageContainer                                            | **⏳ PROCHAINE ACTION**                                                      |

**Pourquoi 1B.3 a été annulé :**  
Le plan original incluait des breadcrumbs automatiques dans le header global. Après implémentation, on a découvert que shadcnuikit n'a AUCUN breadcrumb dans le header. Le header shadcnuikit est : `[☰] | [Search... ⌘K] [🔔] [🌙] [User]`. Ajouter des breadcrumbs = INVENTION = violation de la règle d'or. L'implémentation a été revertée.

shadcnuikit gère les breadcrumbs PER-PAGE (ex: dans file-manager), jamais dans le header global. Les breadcrumbs per-page viendront plus tard quand on construira les pages individuelles.

---

## 5. AUDIT HOLISTIQUE — RÉSULTATS COMPLETS

### Périmètre audité

7 commits — 95 fichiers impactés :

- 32 UI components CRÉÉS
- 17 UI components MODIFIÉS
- 1 UI component SUPPRIMÉ (stat-card.tsx)
- 6 layout files CRÉÉS
- 3 layout files MODIFIÉS
- 3 hooks/contexts CRÉÉS
- ~20 business components MODIFIÉS (import swaps)
- 5 infrastructure files (eslint, next.config, package.json, tsconfig, pnpm-lock)
- 2 theming files (globals.css, themes.css)
- 2 translation files

### Classification des 95 fichiers

| Classification                                                     | Nombre       | Risque         | Détail                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------ | ------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢 CONFORME — copié fidèlement shadcnuikit                         | ~53 fichiers | 0              | 30 UI components créés, 17 modifiés, header/data.ts, theme-switch.tsx, notifications.tsx, search.tsx, use-mobile.ts, globals.css, themes.css                                                                                                  |
| 🔵 GREFFE LÉGITIME — FleetCore fonctionnel, invisible visuellement | ~35 fichiers | 0              | layout.tsx (Clerk/locale/cookie), app-sidebar.tsx (RBAC/i18n/feature flags), site-header.tsx (Clerk UserButton), modules.ts, common.json, select-native.tsx, 20 components/crm/_, 3 FC wrappers supprimés, app/index.ts, 3 app/adm/_, 5 infra |
| 🟡 FC SUPÉRIEUR — validé cas par cas                               | 7 éléments   | 0              | S1-S7 (voir section 6)                                                                                                                                                                                                                        |
| 🔴 INVENTION — n'existe PAS dans shadcnuikit                       | 8 éléments   | **À corriger** | I1-I8 (voir section 7)                                                                                                                                                                                                                        |

### Détail 🟢 CONFORME (~53 fichiers)

Tous les composants UI suivants existent dans shadcnuikit/components/ui/ et ont été copiés fidèlement :
accordion, alert-dialog, alert, aspect-ratio, avatar, breadcrumb, button-group, chart, command, drawer, field, hover-card, input-group, input-otp, item, kbd, menubar, native-select, navigation-menu, pagination, progress, radio-group, scroll-area, sidebar, slider, sonner, spinner, timeline, toggle-group, toggle, tooltip

Les 17 composants modifiés ont été alignés sur le theming OKLCH de shadcnuikit :
badge, button, card, checkbox, collapsible, context-menu, dialog, dropdown-menu, popover, select, separator, sheet, switch, table, tabs, textarea, skeleton

### Détail 🔵 GREFFE LÉGITIME (~35 fichiers)

| Fichier                              | Greffe                                                                                                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| app/[locale]/(app)/layout.tsx        | Clerk auth, locale routing, cookie bridge                                                                                                            |
| components/layout/app-sidebar.tsx    | RBAC (useHasPermission), i18n (useTranslation), feature flags (useCrmFeatureFlags), useLocalizedPath, dynamic modules from modules.ts                |
| components/layout/site-header.tsx    | Clerk `<UserButton>` remplace shadcnuikit `<UserMenu>`                                                                                               |
| lib/config/modules.ts                | Ajout subNav "directory"                                                                                                                             |
| lib/i18n/locales/{en,fr}/common.json | Traductions modules/navigation                                                                                                                       |
| components/ui/select-native.tsx      | Primitive formulaire, utilisée par 19 composants CRM. N'est PAS dans shadcnuikit, mais c'est un `<select>` natif HTML — pas un élément visuel layout |
| components/crm/\* (20 fichiers)      | Import swaps FC → shadcn (cosmétique)                                                                                                                |
| components/fc/\*                     | 3 wrappers supprimés (FCCard, FCFilterBar, FCKanbanCard)                                                                                             |
| components/app/index.ts              | Nettoyage exports                                                                                                                                    |
| app/adm/\* (3 fichiers)              | Import swaps cosmétiques                                                                                                                             |
| Infrastructure (5 fichiers)          | eslint, next.config, package.json, tsconfig, pnpm-lock                                                                                               |

---

## 6. LES 7 EXCEPTIONS FLEETCORE — LISTE FERMÉE

**Cette liste est DÉFINITIVE et FERMÉE. Aucune nouvelle exception ne sera ajoutée sans validation explicite de Mohamed.**

| #   | Fichier                | Élément                                    | Justification                                                                                  |
| --- | ---------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| S1  | app-sidebar.tsx L59,62 | Active state `startsWith` au lieu de `===` | Plus précis pour les routes profondes CRM (ex: `/crm/leads/123` doit activer le module CRM)    |
| S2  | app-sidebar.tsx L224   | `defaultOpen={active}` sur Collapsible     | Auto-ouverture du module actif dans la sidebar — meilleure UX que shadcnuikit qui n'ouvre rien |
| S3  | skeleton.tsx           | Framer Motion shimmer au lieu de CSS fade  | Animation supérieure, visuellement plus pro                                                    |
| S4  | layout.tsx L51         | `<Toaster>` dans le layout                 | Feedback notifications — shadcnuikit n'en a pas                                                |
| S5  | app-sidebar.tsx L153   | Logo = `<Link>` vers dashboard             | Navigation directe — shadcnuikit a un project switcher inutile pour FleetCore                  |
| S6  | site-header.tsx L38-45 | User name/email visible dans le header     | Validé — sera paramètre utilisateur dans le futur                                              |
| S7  | app-sidebar.tsx L297   | Footer "© FleetCore 2026"                 | Remplace NavUser/promo card de shadcnuikit — inappropriés pour FleetCore                       |

**Tout le reste = shadcnuikit exact. Zéro variante. Zéro invention.**

---

## 7. LES 8 INVENTIONS À CORRIGER

**Ces éléments N'EXISTENT PAS dans shadcnuikit. Ils ont été créés par erreur et DOIVENT être revertés.**

| #   | Fichier                                  | Ce qui a été inventé                          | Impact visuel                                                                                                     | Action                                                      |
| --- | ---------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| I1  | components/layout/header/breadcrumbs.tsx | Composant breadcrumb dans le header           | VISIBLE — barre de navigation ajoutée entre Separator et Search                                                   | **SUPPRIMER** le fichier                                    |
| I2  | lib/hooks/useBreadcrumbs.ts              | Hook auto-mapping pathname → segments         | Infrastructure de I1                                                                                              | **SUPPRIMER** le fichier                                    |
| I3  | lib/contexts/BreadcrumbContext.tsx       | Context + Provider + BreadcrumbOverride       | Infrastructure de I1                                                                                              | **SUPPRIMER** le fichier                                    |
| I4  | site-header.tsx L28                      | `<Breadcrumbs />` intégré dans le header      | Point d'intégration de I1                                                                                         | **RETIRER** l'import + le composant                         |
| I5  | layout.tsx L43                           | `<BreadcrumbProvider>` wrapper                | Infrastructure de I1                                                                                              | **RETIRER** l'import + le wrapper                           |
| I6  | LeadDetailHeader.tsx L177-180            | `<BreadcrumbOverride>`                        | Override dynamique pour I1                                                                                        | **RETIRER**, RESTAURER le breadcrumb brut per-page original |
| I7  | settings/crm/layout.tsx                  | Breadcrumb brut supprimé (dépendance vers I1) | Suppression d'un breadcrumb per-page au profit du système inventé                                                 | **RESTAURER** le breadcrumb brut per-page original          |
| I8  | app-sidebar.tsx L301                     | `<SidebarRail />`                             | Existe dans sidebar.tsx mais shadcnuikit ne l'utilise PAS dans son layout. Ajoute une zone hover expand invisible | **RETIRER**                                                 |

**I1-I7 forment un bloc cohérent :** le "breadcrumb system" entier est une invention. shadcnuikit gère les breadcrumbs per-page (ex: file-manager), jamais dans le header global. Le revert = suppression complète du commit 23a2d8b + restauration des breadcrumbs per-page originaux.

**I8 est indépendant :** SidebarRail existe dans sidebar.tsx (le composant primitif) mais shadcnuikit ne l'utilise pas dans son layout. Il ajoute une zone invisible de hover expand. À retirer.

**Statut du revert :** 🔲 PAS ENCORE FAIT — c'est la première sous-étape de Phase 1B.4.

---

## 8. PROCHAINE ACTION : PHASE 1B.4

### Contexte

Phase 1B.4 est la dernière étape de Phase 1B. Elle comprend 3 sous-tâches :

### Sous-tâche 1 : Revert des 8 inventions (I1-I8)

| Fichier                                  | Action exacte                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| components/layout/header/breadcrumbs.tsx | SUPPRIMER le fichier entier                                                                       |
| lib/hooks/useBreadcrumbs.ts              | SUPPRIMER le fichier entier                                                                       |
| lib/contexts/BreadcrumbContext.tsx       | SUPPRIMER le fichier entier                                                                       |
| site-header.tsx                          | RETIRER l'import Breadcrumbs + retirer `<Breadcrumbs />` du JSX                                   |
| layout.tsx                               | RETIRER l'import BreadcrumbProvider + retirer le wrapper `<BreadcrumbProvider>`                   |
| LeadDetailHeader.tsx                     | RETIRER `<BreadcrumbOverride>`, RESTAURER le breadcrumb brut per-page original qui existait avant |
| settings/crm/layout.tsx                  | RESTAURER le breadcrumb brut per-page original qui existait avant                                 |
| common.json (en/fr)                      | RETIRER les clés breadcrumbs.\*                                                                   |
| app-sidebar.tsx L301                     | RETIRER `<SidebarRail />`                                                                         |

### Sous-tâche 2 : Inner wrapper fix

Identifier dans shadcnuikit comment chaque page wraps son contenu. Vérifier :

- Les classes CSS exactes du content wrapper
- Le padding intérieur
- Le max-width (s'il y en a)
- La structure HTML : `<div className="...">` qui entoure le contenu de chaque page

**IMPORTANT :** Aller REGARDER dans shadcnuikit, ne PAS supposer. Ouvrir les fichiers de pages shadcnuikit et lire le markup exact.

### Sous-tâche 3 : PageContainer

Créer un composant `PageContainer` qui :

- **Couche 1 (Visuel)** = produit EXACTEMENT le même HTML que le inner wrapper de shadcnuikit (mêmes classes, même padding, même max-width)
- **Couche 2 (Technique)** = un composant DRY réutilisable au lieu de copier-coller les mêmes lignes dans 50+ fichiers

PageContainer N'EST PAS un composant shadcnuikit. C'est un pattern Kiranism pour éviter la duplication. Mais son OUTPUT HTML doit être IDENTIQUE à ce que shadcnuikit fait.

### Validation Phase 1B.4

1. `pnpm typecheck` → 0 erreurs
2. `pnpm build` → PASS
3. `pnpm lint` → 0 erreurs
4. Vérification visuelle : le header = `[☰] | [Search... ⌘K] [🔔] [🌙] [User]` (pas de breadcrumbs)
5. git commit + push

---

## 9. PLAN COMPLET PHASES 2-14

### Phase 2 — DataTable standardisé (3-5 jours)

**Objectif :** Construire le PATTERN 1 — DataTable TanStack unique pour 10+ pages.

Infrastructure (1-2j) : installer @tanstack/react-table + nuqs, copier système DataTable Kiranism (9 fichiers, 1806L), copier use-data-table hook (296L), helpers, parsers, types, config.  
Migration LeadsTable (1-2j) : ColumnDef[] 37 colonnes, server-side filtering via nuqs URL state.  
Migration Opportunities + Quotes Tables (1j) : même DataTable, ~80L config/table au lieu de ~700L custom.

**Résultat :** 3 tables × ~700L custom → 1 DataTable unique + ~80L config/table.

### Phase 3 — Refactoring God Components + Zustand (3-4 jours)

Zustand stores (1j) : sidebar-store, leads-store, opportunities-store, preferences-store.  
Éclatement LeadsPageClient (2-3j) : 1098L → 9 fichiers, max 300L/fichier. Suppression de LeadsPageClient.tsx.  
Refactoring PipelineSettingsTab (1j) : 1293L → ~400L via composant générique PipelineStageEditor.

### Phase 4 — Navigation et UX avancée (2 jours)

KBar (Cmd+K command palette), raccourcis clavier, search global, transitions de page (Framer Motion), theme customizer (8 presets, 11 fonts, 7 options — **OBLIGATOIRE**).

### Phase 5 — Dashboards enrichis (3-4 jours)

5 dashboards (PATTERN 3) : FleetCore principal, CRM, Fleet, Drivers, Finance.  
Charts Recharts v3 adaptés. Données réelles via Server Components + Prisma. Streaming SSR.

### Phase 6 — CRM complet (3-4 jours)

OpportunityDrawer refactoré (1021L → features/). Kanban Opportunities (PATTERN 4). Quotes (PATTERN 1+2). CRM Settings (PATTERN 5). CRM Reports (PATTERN 11).

### Phases 7-12 — Modules métier

Phase 7 Fleet (3-4j), Phase 8 Drivers (3-4j), Phase 9 Maintenance+Documents+Billing (4-5j), Phase 10 Admin (2-3j), Phase 11 Analytics+Transversaux (2-3j), Phase 12 Pages erreur+Auth+Empty States (1-2j).

### Phase 13 — Accessibilité et polish (2-3 jours)

Passer de 2/10 à 7/10+ : reduced-motion, aria-labels, keyboard nav, contrastes, semantic HTML.

### Phase 14 — Nettoyage et validation finale (2-3 jours)

Supprimer components/crm/ legacy, components/app/ legacy, tokens hex, imports orphelins. Vérifier chaque page (50+). Run full test suite. Build production.

---

## 10. STACK TECHNIQUE EXACT

### Versions actuelles (après Phase 0)

| Package        | Version  | Notes                    |
| -------------- | -------- | ------------------------ |
| Next.js        | 16.1.6   | Migré depuis 15.5.3      |
| React          | 19       | —                        |
| TypeScript     | 5.3+     | —                        |
| Tailwind CSS   | 4.1      | —                        |
| Prisma ORM     | 6.18.0   | Schema 6812L, 630+ index |
| @clerk/nextjs  | 6.37.3   | Migré depuis 6.32.2      |
| @sentry/nextjs | 10.38.0  | Migré depuis 10.13.0     |
| next-themes    | 0.4.6    | —                        |
| framer-motion  | 12.23.19 | —                        |
| react-i18next  | 16.0.0   | EN/FR                    |
| pnpm           | —        | Package manager          |

### Packages à installer (futures phases)

```bash
pnpm add @tanstack/react-table@^8.21 nuqs@^2.4 zustand@^5.0 kbar cmdk@^1.1
```

### Infrastructure

- **Deployment :** Vercel
- **Database :** PostgreSQL via Supabase
- **Cache :** Upstash Redis
- **Monitoring :** Sentry
- **Email :** Resend
- **Auth :** Clerk (multi-tenant)

---

## 11. CHEMINS FICHIERS ET RÉFÉRENCES

### Dossiers locaux

| Dossier                                                 | Contenu                                                |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `/Users/mohamedfodil/Documents/fleetcore5/`             | Projet FleetCore principal                             |
| `/Users/mohamedfodil/Documents/references/shadcnuikit/` | Template shadcnuikit ($79) — SOURCE DE VÉRITÉ visuelle |
| `/Users/mohamedfodil/Documents/references/kiranism/`    | Référence Kiranism (gratuit) — patterns techniques     |

### Structure FleetCore (zone refonte)

```
src/app/[locale]/(app)/          ← ZONE REFONTE (tout ce qui est derrière auth)
src/app/[locale]/(auth)/         ← Pages auth (NE PAS TOUCHER Phase 1-10)
src/app/[locale]/(public)/       ← Pages publiques (NE JAMAIS TOUCHER)
src/components/ui/               ← Composants shadcn/ui (30 créés, 13 upgradés)
src/components/layout/           ← Layout (sidebar, header) — aligné shadcnuikit
src/components/crm/              ← Composants CRM business (legacy, à refactorer Phase 2-6)
src/lib/actions/                 ← Server Actions (NE PAS TOUCHER)
src/lib/services/                ← Services métier (NE PAS TOUCHER)
src/lib/validators/              ← Zod validators (NE PAS TOUCHER)
```

### Git tags de référence

| Tag                      | Contenu                                                   |
| ------------------------ | --------------------------------------------------------- |
| `pre-frontend-reshaping` | État AVANT toute modification (backup intégral)           |
| `post-next16-migration`  | Après Phase 0 — Next 16.1.6, Clerk 6.37.3, Sentry 10.38.0 |

### Commits clés Phase 1

| Hash    | Description                                                       |
| ------- | ----------------------------------------------------------------- |
| e056978 | Phase 1A complète — Theming OKLCH + 30 composants + 13 upgradés   |
| 3b2dad1 | Phase 1B.1 — sidebar.tsx + use-mobile.ts                          |
| 9cabf72 | Phase 1B.1-fix — Skeleton Framer Motion régression corrigée       |
| 035f328 | Phase 1B.2 — Layout remplacé (app-sidebar + site-header + layout) |
| 23a2d8b | Phase 1B.3 — Breadcrumbs (À REVERTER — invention)                 |

### Documents de référence

| Document                  | Localisation                            | Contenu                                       |
| ------------------------- | --------------------------------------- | --------------------------------------------- |
| Plan de refonte V2        | Projet Claude + /mnt/user-data/outputs/ | Plan complet 14 phases, 1138 lignes           |
| UX Refonte Status         | Projet Claude                           | Historique Salesforce/Velzon, leçons apprises |
| CRM Specification V6.6.1  | Projet Claude                           | Spécifications CRM complètes                  |
| Règles de Gestion         | Projet Claude                           | Règles métier FleetCore                       |
| Schema Supabase Reference | Projet Claude                           | Référence tables/colonnes                     |

---

## 12. RÈGLES D'EXÉCUTION ET INTERDITS

### Protocole par phase

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

### Interdits absolus

- ❌ Modifier un Server Action, un service, ou un schéma Zod
- ❌ Modifier le schema.prisma
- ❌ Modifier le middleware (sauf renommage optionnel)
- ❌ Modifier les pages publiques (homepage, booking, auth)
- ❌ Casser l'isolation multi-tenant
- ❌ Supprimer du code avant d'avoir son remplacement validé
- ❌ Procéder à la phase N+1 sans validation complète de la phase N
- ❌ **Inventer un élément visuel absent de shadcnuikit**
- ❌ Marquer quoi que ce soit comme "optionnel" si c'est dans shadcnuikit
- ❌ Utiliser Kiranism pour le visuel (Kiranism = technique uniquement)
- ❌ "S'inspirer de" au lieu de "copier de" shadcnuikit

### Ordre de priorité en cas de conflit

1. **Backend fonctionne** (jamais de régression backend)
2. **Auth fonctionne** (jamais de page accessible sans auth)
3. **Données réelles** (pas de mock en production)
4. **Cohérence visuelle** (tout le frontend sur le même système)
5. **Features complètes** (pas de demi-implémentation)

### Workflow Prisma (rappel — NE PAS CHANGER)

SQL manuel dans Supabase → modifier schema.prisma manuellement → `pnpm prisma generate`. **JAMAIS** db push/pull/migrate (cause des drifts).

### Admin UUID

`7ad8173c-68c5-41d3-9918-686e4e941cc0` — Provider par défaut, stocké dans adm_settings, **JAMAIS hardcodé**.

---

## 13. LEÇONS APPRISES — ERREURS À NE PAS RÉPÉTER

### Erreur #1 : Path Component Salesforce sur vue Kanban (12/02)

**Ce qui s'est passé :** Claude Code a ajouté un Path Component (barre chevrons progression) AU-DESSUS du Kanban. C'est un doublon — les colonnes Kanban SONT déjà le path.

**Leçon :** Comprendre le CONTEXTE d'utilisation. Path Component = pages DÉTAIL uniquement. Jamais sur les vues liste/Kanban.

### Erreur #2 : Breadcrumbs dans le header global (13/02)

**Ce qui s'est passé :** Le plan original prévoyait des breadcrumbs auto dans le header. Implémenté, puis découvert que shadcnuikit n'a PAS de breadcrumbs dans le header. C'était une INVENTION.

**Leçon :** TOUJOURS vérifier dans shadcnuikit AVANT d'implémenter. Si ce n'est pas dans le template, on ne l'ajoute pas.

### Erreur #3 : SidebarRail non utilisé par shadcnuikit (13/02)

**Ce qui s'est passé :** Le composant `<SidebarRail />` existe dans sidebar.tsx (composant primitif) mais shadcnuikit ne l'utilise PAS dans son layout. Claude Code l'a ajouté en pensant que c'était nécessaire.

**Leçon :** Distinguer entre "le composant existe" et "le composant est UTILISÉ dans le layout". Seul ce qui est UTILISÉ dans le layout de shadcnuikit doit être reproduit.

### Erreur #4 : "Bridge components" au lieu de copie pure (13/02)

**Ce qui s'est passé :** Claude Code a proposé de créer des "bridge components" comme couche intermédiaire entre shadcnuikit et FleetCore. Approche rejetée.

**Leçon :** On COPIE shadcnuikit et on greffe FleetCore dessus. Pas de couche intermédiaire. Le frontend doit être shadcnuikit branché sur le backend FleetCore, point final.

### Erreur #5 : Proposer sans vérifier (récurrent)

**Ce qui s'est passé :** À plusieurs reprises, des prompts ont été envoyés qui contenaient des hypothèses sur ce que shadcnuikit fait ou ne fait pas, sans vérification.

**Leçon :** Chaque affirmation sur shadcnuikit doit être VÉRIFIÉE en ouvrant les fichiers. Pas de "ça doit être comme ça", pas de "probablement", pas de "dans la plupart des templates".

### Erreur #6 : Interprétation des prérequis au lieu de citation (récurrent)

**Ce qui s'est passé :** Les prérequis ont été résumés/paraphrasés au lieu d'être cités mot pour mot, ce qui a conduit à des dérives d'interprétation.

**Leçon :** Les prérequis non négociables doivent être reproduits tels quels. Pas de reformulation.

---

## RÉSUMÉ POUR REPRISE IMMÉDIATE

**Où on en est :** Phase 1B, étape 1B.4.

**Ce qui est fait :** Phase 0 ✅, Phase 1A ✅, Phase 1B.1 ✅, Phase 1B.1-fix ✅, Phase 1B.2 ✅, Phase 1B.2r ✅, Phase 1B.3 ❌ annulé.

**Ce qu'il faut faire maintenant :**

1. Reverter les 8 inventions (I1-I8)
2. Identifier le inner wrapper exact de shadcnuikit
3. Créer PageContainer (visuel=shadcnuikit, code=Kiranism)
4. Build + test + commit

**Après 1B.4 :** Phase 1B est terminée → Phase 2 (DataTable TanStack).

**La règle :** shadcnuikit = le rendu. Kiranism = le code. Zéro invention. Point final.

---

**Document créé le :** 13 Février 2026  
**Version :** 1.0  
**Usage :** Handoff entre sessions Claude / Claude Code
