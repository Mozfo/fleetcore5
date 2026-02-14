# FLEETCORE — SPÉCIFICATION GÉNÉRALE DE REFONTE FRONTEND POST-LOGIN

> **Version :** 2.0  
> **Date :** 14 Février 2026  
> **Auteur :** Mohamed FODIL (CEO/CTO) × Architecture Claude  
> **Statut :** DOCUMENT DE RÉFÉRENCE — Sert de base aux spécifications détaillées par chapitre  
> **Portée :** Reconstruction intégrale de l'interface utilisateur zone applicative `(app)/`  
> **Destinataire :** Tout développeur, architecte, ou agent IA devant travailler sur le frontend FleetCore  
> **Changelog V2 :** Intégration de Refine.dev comme décision VALIDÉE (sections 6.1, 6.3, 6.7, 7.1, 7.2, 8, Annexe C)

---

## AVERTISSEMENT — PROTOCOLE DE LECTURE

Ce document est la **source de vérité unique** pour la refonte frontend FleetCore. Tout intervenant (humain ou IA) DOIT :

1. **Lire ce document intégralement** avant toute action
2. **Ne jamais supposer** — si une information n'est pas dans ce document, elle n'existe pas
3. **Ne jamais inventer** — chaque affirmation est justifiée par une analyse factuelle réalisée par Claude Code
4. **Respecter la hiérarchie des sources** — aucune déviance acceptée (Section 4.3)
5. **Traiter chaque session comme indépendante** — ce document compense la perte de mémoire entre sessions

**INTERDICTION FORMELLE :** Spéculer, extrapoler, déduire implicitement, ou contourner les règles établies.

---

## TABLE DES MATIÈRES

| #              | Section                                        | Page | Objectif                                               |
| -------------- | ---------------------------------------------- | ---- | ------------------------------------------------------ |
| **PARTIE I**   | **CONTEXTE & VISION**                          |      | **Pourquoi cette refonte**                             |
| 1              | Présentation de FleetCore                      | —    | Qu'est-ce que FleetCore, pour qui, pourquoi            |
| 2              | Diagnostic factuel du frontend                 | —    | État actuel chiffré, dette technique mesurée           |
| 3              | Objectif de la refonte                         | —    | Vision cible, métriques de succès                      |
| **PARTIE II**  | **ARCHITECTURE & DÉCISIONS**                   |      | **Comment on va le faire**                             |
| 4              | Stratégie des 5 référentiels                   | —    | Les 5 repos, la règle d'or, la hiérarchie              |
| 5              | Bibliothèque FleetCore (FC Library)            | —    | Composants standardisés, patterns réutilisables        |
| 6              | Décisions techniques structurantes             | —    | Refine.dev (VALIDÉ), couche data, auth, état global    |
| 7              | Architecture cible détaillée                   | —    | Structure dossiers, providers Refine, patterns de page |
| **PARTIE III** | **PLAN D'EXÉCUTION**                           |      | **Pas à pas, session par session**                     |
| 8              | Plan d'exécution en 15 phases                  | —    | Chaque phase, chaque étape, chaque livrable            |
| 9              | État d'avancement actuel                       | —    | Ce qui est fait, ce qui reste                          |
| 10             | Protocole d'exécution et interdits             | —    | Règles absolues, workflow, validation                  |
| **PARTIE IV**  | **ANNEXES SPÉCIALISÉES**                       |      | **Référence détaillée par domaine**                    |
| A              | Annexe A — Inventaire dette frontend           | —    | 33 510 lignes analysées fichier par fichier            |
| B              | Annexe B — Mapping des 12 patterns shadcnuikit | —    | 1 pattern = N pages FleetCore                          |
| C              | Annexe C — Architecture Refine.dev intégrée    | —    | Synthèse providers, hooks, pattern par resource        |
| D              | Annexe D — Audit empreinte Clerk               | —    | 57 fichiers, stratégie d'abstraction                   |
| E              | Annexe E — Étude auth zéro lock-in             | —    | Options post-Clerk, portabilité                        |
| F              | Annexe F — Leçons apprises et erreurs          | —    | 6 erreurs documentées, contre-mesures                  |
| G              | Annexe G — Glossaire et conventions            | —    | Terminologie, nommage, acronymes                       |

---

# PARTIE I — CONTEXTE & VISION

---

## 1. PRÉSENTATION DE FLEETCORE

### 1.1 Qu'est-ce que FleetCore ?

FleetCore est une plateforme SaaS B2B multi-tenant de gestion de flottes VTC/taxi. Elle fournit aux opérateurs de flottes un outil centralisé pour gérer l'intégralité du cycle de vie de leur activité : acquisition de clients (CRM), gestion de véhicules (Fleet), gestion de chauffeurs (Drivers), maintenance, facturation (Billing), et pilotage analytique (Analytics).

### 1.2 Marché et positionnement

| Dimension                    | Détail                               |
| ---------------------------- | ------------------------------------ |
| **Marchés cibles**           | UAE, France, MENA                    |
| **Clients cibles**           | Opérateurs de flottes VTC/taxi (B2B) |
| **Modèle tarifaire**         | €25-50 par véhicule par mois         |
| **Objectif à 2 ans**         | 2 000 à 5 000 véhicules gérés        |
| **ROI projeté**              | €5,6M annuels sur 6 modules          |
| **Intégrations plateformes** | Uber, Careem, Yango, Bolt            |
| **Conformité**               | WPS (UAE), GDPR (EU), multi-pays     |

### 1.3 Architecture technique existante

| Couche              | Stack                                | Maturité                           |
| ------------------- | ------------------------------------ | ---------------------------------- |
| **Framework**       | Next.js 16.1.6 (migré depuis 15.5.3) | ✅ Dernière version                |
| **Langage**         | TypeScript 5.3+                      | ✅ Strict mode                     |
| **Base de données** | PostgreSQL via Supabase              | ✅ 101 tables, 147 enums, 550 FK   |
| **ORM**             | Prisma 6.18.0                        | ✅ Schema 6 812 lignes, 630+ index |
| **Auth**            | Clerk 6.37.3 (multi-tenant)          | ✅ Organizations, RBAC, webhooks   |
| **CSS**             | Tailwind CSS 4.1                     | ✅ Dernière version                |
| **i18n**            | react-i18next (EN/FR)                | ✅ Opérationnel                    |
| **Déploiement**     | Vercel + GitHub Actions CI/CD        | ✅ Production                      |
| **Monitoring**      | Sentry 10.38.0                       | ✅ Opérationnel                    |
| **Cache**           | Upstash Redis                        | ✅ Rate limiting                   |
| **Email**           | Resend + React Email                 | ✅ Templates                       |
| **Paiement**        | Stripe                               | ✅ Intégré                         |

### 1.4 Le problème fondamental

Le backend de FleetCore est **enterprise-grade (9/10)** : Server Actions avec Zod + Auth + Audit, Prisma avec 630 index et transactions, sécurité complète (rate limiting, 0 injection, 0 XSS), error handling centralisé. C'est un backend mature, testé, et prêt pour la production.

Le frontend est **amateur (4/10)** : God Components de plus de 1000 lignes, duplication massive, zéro state management centralisé, design system ignoré à 87%, code en silo où chaque page suit ses propres règles. Le résultat visuel ressemble à un assemblage de pages web plutôt qu'à une application enterprise configurée.

**Citation directe du CEO :**

> _"Frontend basique = pas de clients même si l'outil fonctionne."_

> _"L'objectif est simple je VEUX REMPLACER le design horrible de fleetcore, j'ai acheté un modèle POUR LE REMPLACER pas pour l'adapter!!!!! les seuls changements que j'accepte est si fleetcore le fait mieux ou des particularités type i18n et fonctionnalités propres à fleetcore. VOUS ÊTES ENCORE DANS L'invention je ne veux pas d'inventions."_

**Impact business :** Les décideurs B2B qui évaluent FleetCore le comparent à Salesforce, HubSpot, et d'autres solutions enterprise. Un frontend amateur disqualifie immédiatement l'outil, quel que soit la qualité du backend. La refonte frontend est un **prérequis absolu au lancement commercial**.

---

## 2. DIAGNOSTIC FACTUEL DU FRONTEND

> **Source :** Audit complet réalisé par Claude Code le 13 Février 2026. Chaque chiffre est issu d'une analyse automatisée du code source FleetCore.

### 2.1 Scores par zone

| Zone                          | Note       | Constat factuel                                                                              |
| ----------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| **Backend — Server Actions**  | **9/10**   | Enterprise-grade. Zod safeParse, auth check, tenant isolation, audit logs sur chaque action. |
| **Backend — Prisma/DB**       | **9/10**   | 630+ index, transactions, isolation tenant. Schema mature 6 812 lignes.                      |
| **Backend — Sécurité**        | **8.5/10** | Rate limiting complet, 0 injection SQL, 0 XSS, middleware 225 lignes.                        |
| **Backend — Error Handling**  | **9/10**   | Classes custom, handler centralisé, format standardisé.                                      |
| **Frontend — Composants CRM** | **4/10**   | God Components, duplication massive, 0 custom hooks.                                         |
| **Frontend — Tables**         | **5/10**   | Custom ~700L/table, dupliqué 3×, pas de virtualisation.                                      |
| **Frontend — Design System**  | **3/10**   | Défini mais ignoré. Ratio tokens utilisés vs brut = 1:66.                                    |
| **Frontend — Accessibilité**  | **2/10**   | 0 prefers-reduced-motion, 4% keyboard nav, 10% ARIA.                                         |
| **Frontend — Responsive**     | **6.5/10** | Partiellement implémenté.                                                                    |

**Score global : Backend 9/10 — Frontend 4/10**

### 2.2 Dette frontend quantifiée

| Métrique                                    | Valeur                   | Impact                                                               |
| ------------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| **Volume total code CRM frontend**          | 33 510 lignes            | Masse de code à refactorer                                           |
| **Plus gros fichier (LeadsPageClient.tsx)** | 1 098 lignes             | God Component #1 : 24 useState, 73 fonctions inline, 0 custom hooks  |
| **PipelineSettingsTab.tsx**                 | 1 293 lignes             | God Component #2 : 95% de code dupliqué entre Leads et Opportunities |
| **OpportunityDrawer.tsx**                   | 1 021 lignes             | God Component #3                                                     |
| **Tables custom dupliquées**                | ~700L × 3 = 2 100 lignes | 3 implémentations custom au lieu de 1 composant réutilisable         |
| **Couleurs Tailwind brutes**                | 2 238 occurrences        | Le design system FC est ignoré à 87%                                 |
| **Fichiers avec hex hardcodé**              | 51 fichiers              | Couleurs en dur au lieu de tokens                                    |
| **Stores Zustand**                          | 0                        | Zéro state management centralisé — tout en useState local            |
| **Composants TanStack Table**               | 0                        | Tables réimplémentées à la main                                      |
| **Zones sidebar sans pages**                | 5 sur 8                  | Fleet, Drivers, Maintenance, Analytics, Admin = vides                |
| **Ratio tokens design system**              | 1:66                     | Pour 1 utilisation du token, 66 utilisations brutes                  |

### 2.3 Anatomie d'un God Component (LeadsPageClient.tsx)

Ce fichier illustre parfaitement le problème. En 1 098 lignes :

- **24 déclarations useState** — tout l'état est local, rien n'est partagé
- **73 fonctions inline** — logique mélangée avec le rendu
- **7 modals intégrés** — chaque modal est défini dans le même fichier
- **0 custom hooks** — aucune extraction de logique
- **0 composant externe** — tout est monolithique
- **Fetch brut** — pas de cache, pas d'invalidation, pas de retry, pas de loading state centralisé

L'architecture cible éclatera ce fichier en **~6 fichiers** totalisant ~235 lignes (aucun ne dépassant 80 lignes), avec des hooks Refine, un cache TanStack Query automatique, et le RBAC déclaratif via `<CanAccess>`.

### 2.4 Ce qui est BON et DOIT être préservé intégralement

| Élément             | Détail quantifié                                                                       | Statut            |
| ------------------- | -------------------------------------------------------------------------------------- | ----------------- |
| **Server Actions**  | 10 fichiers, 6 948 lignes — Zod safeParse + auth check + tenant isolation + audit logs | ❌ NE PAS TOUCHER |
| **Services métier** | 68+ fichiers lib/services/ — Architecture service-repository propre                    | ❌ NE PAS TOUCHER |
| **Schémas Zod**     | 81 schémas + 22 fichiers validators — Validation complète                              | ❌ NE PAS TOUCHER |
| **Schema Prisma**   | 6 812 lignes, 630+ index — Modèle de données mature                                    | ❌ NE PAS TOUCHER |
| **Middleware**      | 225 lignes — Rate limiting, RBAC, tenant isolation                                     | ❌ NE PAS TOUCHER |
| **Tests**           | 435 fichiers — Couverture forte                                                        | ❌ NE PAS TOUCHER |
| **Error handling**  | Classes custom, handler unique, format standardisé                                     | ❌ NE PAS TOUCHER |
| **i18n config**     | react-i18next EN/FR                                                                    | ❌ NE PAS TOUCHER |
| **Pages publiques** | Homepage, booking, auth, terms, payment                                                | ❌ NE PAS TOUCHER |
| **Routes API**      | 112+ routes existantes                                                                 | ❌ NE PAS TOUCHER |

---

## 3. OBJECTIF DE LA REFONTE

### 3.1 Vision

Reconstruire **intégralement** le frontend de la zone applicative `(app)/` — tout ce qui est derrière la page de login — pour passer d'un **"site web amateur assemblé"** à une **"application enterprise standardisée et configurable"**, sans aucune modification du backend.

### 3.2 Périmètre exact

| Inclus (REFONTE)                                                                     | Exclu (INCHANGÉ)                     |
| ------------------------------------------------------------------------------------ | ------------------------------------ |
| Toutes les pages `src/app/[locale]/(app)/**`                                         | Pages publiques `(public)/**`        |
| Composants UI `src/components/`                                                      | Server Actions `src/lib/actions/`    |
| Layout, sidebar, header, navigation                                                  | Services métier `src/lib/services/`  |
| Design system, tokens couleur                                                        | Validators Zod `src/lib/validators/` |
| State management (Zustand + TanStack Query via Refine)                               | Schema Prisma                        |
| Data tables (TanStack)                                                               | Middleware auth                      |
| Formulaires, modals, drawers                                                         | Routes API                           |
| Dashboards, charts, analytics                                                        | Tests existants                      |
| Nouveaux modules (Fleet, Drivers, Maintenance, Analytics, Admin, Billing, Documents) | Configuration i18n                   |

### 3.3 Métriques de succès quantifiées

| Métrique                             | AVANT          | APRÈS                      | Cible                         |
| ------------------------------------ | -------------- | -------------------------- | ----------------------------- |
| Plus gros fichier composant          | 1 293L         | < 300L                     | ✅ Aucun fichier > 300L       |
| God Components (>500L, >10 useState) | 3              | 0                          | ✅ Zéro God Component         |
| Custom hooks extraits                | 0              | 20+                        | ✅ Logique séparée            |
| Zustand stores                       | 0              | 6+                         | ✅ État UI centralisé         |
| Tables custom dupliquées             | 3 (2 100L)     | 0                          | ✅ 1 DataTable standard       |
| Ratio tokens vs raw Tailwind         | 1:66           | 1:1                        | ✅ 100% tokens sémantiques    |
| Composants shadcn installés          | 23             | 58                         | ✅ Kit complet                |
| Accessibilité score                  | 2/10           | 7/10+                      | ✅ WCAG 2.1 AA partiel        |
| Pages applicatives fonctionnelles    | ~10            | 50+                        | ✅ Toutes zones couvertes     |
| Modules avec pages                   | 1 (CRM)        | 8                          | ✅ Tous modules opérationnels |
| Theme presets                        | 1              | 8                          | ✅ Personnalisation complète  |
| Cache client                         | 0 (fetch brut) | TanStack Query v5          | ✅ Cache automatique 5min     |
| Invalidation cache                   | Manuelle       | Automatique après mutation | ✅ Via Refine                 |
| Mutations optimistes                 | 0              | Toutes les mutations       | ✅ UX instantanée             |
| Filtres URL                          | 0              | Toutes les listes          | ✅ syncWithLocation           |
| Score frontend global                | 4/10           | 8/10+                      | ✅ Enterprise-grade           |

### 3.4 Critères de validation par phase

Chaque phase est validée par la checklist suivante :

1. ✅ `pnpm build` réussi (0 erreur)
2. ✅ `pnpm typecheck` réussi (0 erreur)
3. ✅ `pnpm lint` réussi (0 erreur)
4. ✅ Tests existants passent (0 régression)
5. ✅ Navigation complète fonctionnelle
6. ✅ Auth Clerk opérationnelle
7. ✅ Données réelles affichées correctement (ou empty states cohérents si backend absent)
8. ✅ Dark mode fonctionne sur toute la zone touchée
9. ✅ Git tag de sauvegarde créé avant ET après

---

# PARTIE II — ARCHITECTURE & DÉCISIONS

---

## 4. STRATÉGIE DES 5 RÉFÉRENTIELS

### 4.1 Les 5 repos achetés/clonés

Mohamed a acquis 5 dépôts de référence pour construire la bibliothèque FleetCore. Chacun a un rôle précis et complémentaire :

| #     | Repo                                   | Licence    | Rôle                                                                                                                                               | Stack                                      |
| ----- | -------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **1** | **shadcnuikit** ($79)                  | Commercial | **CIBLE VISUELLE** — 68 routes, 8 thèmes, 99 composants. Le frontend FleetCore doit être visuellement identique.                                   | Next.js + shadcn/ui + Tailwind             |
| **2** | **Kiranism** (5.5K ★)                  | MIT        | **BOÎTE À OUTILS TECHNIQUE** — Patterns identiques au stack FleetCore : Next.js 16 + Clerk + shadcn/ui + TanStack Table + nuqs + Zustand + dnd-kit | Next.js 16 + Clerk + TanStack + Zustand    |
| **3** | **shadcn-admin-kit** (707 ★, Marmelab) | MIT        | **PATTERNS CRM TECHNIQUE** — Framework composants sur shadcn/ui + ra-core. DataProvider, Kanban, Dashboard patterns.                               | shadcn/ui + ra-core (react-admin headless) |
| **4** | **atomic-crm** (Marmelab)              | MIT        | **MODÈLE CRM COMPLET** — Full CRM sur shadcn-admin-kit + Supabase. Pipeline Kanban, Revenue Dashboard, modèle Contact/Deal/Company/Activity.       | shadcn-admin-kit + Supabase                |
| **5** | **Velzon** (ThemeForest 4.4.2)         | Commercial | **BACKUP** — Template admin multi-framework. Référence secondaire si besoin.                                                                       | Multi-framework                            |

### 4.2 Chemins locaux

| Repo             | Chemin                                                       |
| ---------------- | ------------------------------------------------------------ |
| FleetCore        | `/Users/mohamedfodil/Documents/fleetcore5/`                  |
| shadcnuikit      | `/Users/mohamedfodil/Documents/references/shadcnuikit/`      |
| Kiranism         | `/Users/mohamedfodil/Documents/references/kiranism/`         |
| shadcn-admin-kit | `/Users/mohamedfodil/Documents/references/shadcn-admin-kit/` |
| atomic-crm       | `/Users/mohamedfodil/Documents/references/atomic-crm/`       |
| Velzon           | `/Users/mohamedfodil/Documents/references/Velzon/`           |

### 4.3 LA RÈGLE D'OR — NON NÉGOCIABLE

> **shadcnuikit = rendu visuel pixel-perfect (le QUOI).**  
> **Kiranism + shadcn-admin-kit + atomic-crm = technique DRY (le COMMENT).**  
> **ZÉRO code from scratch. ZÉRO invention UI. AUCUNE DÉVIANCE ACCEPTÉE.**

#### Couche 1 — UX/Visuel = shadcnuikit (NON NÉGOCIABLE)

Le résultat dans le navigateur **DOIT** être pixel-perfect identique au template acheté. Le HTML rendu, les classes CSS, l'espacement, les couleurs, les composants — TOUT vient de shadcnuikit.

Ce qui signifie concrètement :

- Le layout (sidebar, header, zone de contenu) est **copié** de shadcnuikit, pas "inspiré de"
- Les composants visuels sont **extraits** de shadcnuikit, pas "adaptés"
- Les pages sont **mappées** sur les templates shadcnuikit, pas "réinventées"
- Si shadcnuikit ne l'a pas, FleetCore ne l'a pas (sauf exception validée, voir Section 4.5)

#### Couche 2 — Technique/Code = Références techniques DRY

Comment on **produit** le résultat visuel. Là on prend les meilleures décisions d'ingénierie parmi les 3 références techniques :

| Source technique     | Ce qu'on en extrait                                                                                                | Ce qu'on n'en extrait PAS                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **Kiranism**         | useDataTable hook (297L), structure features/, Zustand stores, nuqs URL state, Clerk auth bridge, dnd-kit patterns | Visuels (Kiranism est un template mockée sans vraie data)                        |
| **shadcn-admin-kit** | DataProvider pattern, composants CRM headless, architecture modulaire ra-core                                      | ra-core directement (incompatible avec Server Actions — remplacé par Refine.dev) |
| **atomic-crm**       | Pipeline Kanban complet, Revenue Dashboard, modèle Contact/Deal/Company/Activity/Tags                              | Supabase direct (FleetCore utilise Prisma)                                       |

#### Incompatibilité identifiée : shadcn-admin-kit / ra-core → Résolution par Refine.dev

shadcn-admin-kit utilise **ra-core** (react-admin headless) avec un pattern **DataProvider**. FleetCore utilise **Server Actions + Prisma**. Les composants Admin/Resource/List de ra-core dépendent du DataProvider et ne peuvent pas être importés en l'état.

**Résolution :** Refine.dev remplace ra-core comme couche d'abstraction CRUD. Refine offre le même pattern DataProvider mais avec une architecture plus légère (~40-60 KB gzipped vs 200+ KB ra-core), compatible nativement avec Next.js App Router, et avec TanStack Query v5 intégré. On extrait les **patterns UI** (structure de page, composants visuels, layouts CRM) de shadcn-admin-kit et atomic-crm, mais on implémente la couche data avec Refine DataProvider qui appelle les Server Actions existants sans modification.

### 4.4 Hiérarchie des sources en cas de conflit

| Priorité | Source                            | Rôle                                                                                                         |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **1**    | **shadcnuikit**                   | LA CIBLE. Layout, sidebar, header, visuels, composants — TOUT vient de shadcnuikit                           |
| **2**    | **Kiranism**                      | Boîte à outils TECHNIQUE pour ce que shadcnuikit ne gère pas (Clerk auth, DataTable TanStack, Zustand, nuqs) |
| **3**    | **shadcn-admin-kit + atomic-crm** | Patterns CRM (Kanban, Dashboard, modèle données CRM) — adaptés au stack FleetCore                            |
| **4**    | **FleetCore**                     | Données métier : navigation, RBAC, feature flags, i18n, multi-tenant                                         |

### 4.5 Exceptions FleetCore validées — LISTE FERMÉE

Seules ces 7 déviations par rapport à shadcnuikit sont autorisées. La liste est **DÉFINITIVE et FERMÉE** — aucune nouvelle exception sans validation explicite du CEO.

| #   | Élément                                                 | Justification                                                      |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| S1  | Active state `startsWith` au lieu de `===` dans sidebar | Routes profondes CRM (`/crm/leads/123` doit activer le module CRM) |
| S2  | `defaultOpen={active}` sur Collapsible sidebar          | Auto-ouverture du module actif — meilleure UX                      |
| S3  | Skeleton Framer Motion shimmer                          | Animation supérieure au CSS fade de shadcnuikit                    |
| S4  | `<Toaster>` dans le layout                              | Feedback notifications — shadcnuikit n'en a pas                    |
| S5  | Logo = lien dashboard                                   | Pas de project switcher dans FleetCore                             |
| S6  | Nom/email visible dans header                           | Paramètre utilisateur futur                                        |
| S7  | Footer "© FleetCore 2026"                              | Remplace NavUser/promo card                                        |

**Tout le reste = shadcnuikit exact. Zéro variante. Zéro invention.**

### 4.6 Les "greffes légitimes" FleetCore

Les seuls ajouts acceptés par rapport à shadcnuikit sont des greffes **INVISIBLES visuellement** :

| Greffe                               | Ce qu'elle fait                     | Impact visuel                                      |
| ------------------------------------ | ----------------------------------- | -------------------------------------------------- |
| Clerk authentication                 | Remplace le UserMenu shadcnuikit    | AUCUN — même emplacement, même look                |
| i18n (useTranslation)                | Traduit les labels                  | AUCUN — même texte, juste traduit                  |
| RBAC (useCan / `<CanAccess>`)        | Filtre la navigation et les actions | AUCUN — masque des items, ne change pas le look    |
| Feature flags (useCrmFeatureFlags)   | Active/désactive des features       | AUCUN — masque des features, ne change pas le look |
| Multi-tenant (buildProviderFilter)   | Isole les données par tenant        | AUCUN — filtrage data invisible                    |
| Routes localisées (useLocalizedPath) | Ajoute `/en/` ou `/fr/` aux URLs    | AUCUN — changement URL invisible                   |
| Logo FleetCore                       | Remplace le logo shadcnuikit        | MINIMAL — même emplacement, logo différent         |
| Refine `<Refine>` Context Provider   | Wrap le layout dashboard            | AUCUN — ne rend ZÉRO HTML                          |

---

## 5. BIBLIOTHÈQUE FLEETCORE (FC LIBRARY)

### 5.1 Objectif

Créer une **bibliothèque de composants standardisés** qui sera utilisée par **TOUS les modules** de FleetCore. Chaque composant est construit **UNE FOIS** et réutilisé dans toutes les sections (CRM, Fleet, Drivers, Maintenance, Analytics, Admin, Billing, Documents).

**Zéro duplication. Zéro code custom par page. Zéro code from scratch.**

Chaque composant de la bibliothèque provient d'un des 4 repos de référence (shadcnuikit, Kiranism, shadcn-admin-kit, atomic-crm). Les cas où FleetCore est techniquement supérieur sont traités au cas par cas avec validation.

### 5.2 Les 12 patterns réutilisables

La bibliothèque est structurée autour de **12 patterns** extraits de shadcnuikit, chacun servant à **N pages FleetCore** :

#### PATTERN 1 — "Users List" → TOUTE LISTE D'ENTITÉS

- **Source :** shadcnuikit `/pages/users`
- **Technique :** Kiranism useDataTable hook (297L) + TanStack Table + nuqs URL state + **Refine useTable hook** pour la couche data
- **Sert à :** Leads Browser, Opportunities List, Quotes List, Vehicles List, Drivers List, Admin Members, Provider Employees, Invoices List, Contracts List, Documents List
- **Résultat :** 1 template → **10+ pages FleetCore**

#### PATTERN 2 — "Profile / Profile V2" → TOUTE FICHE DÉTAIL

- **Source :** shadcnuikit `/pages/profile`, `/pages/profile-v2`
- **Technique :** **Refine useOne hook** pour le chargement des données
- **Sert à :** Lead Detail, Opportunity Detail, Vehicle Detail, Driver Detail, Tenant Detail, Member Detail, Invoice Detail, Contract Detail
- **Résultat :** 1 template → **8+ pages FleetCore**

#### PATTERN 3 — "CRM Dashboard" → TOUS LES DASHBOARDS

- **Source :** shadcnuikit `/dashboards/crm`
- **Technique :** Recharts v3 (FleetCore déjà sur version moderne) + streaming SSR
- **Sert à :** Dashboard CRM, Dashboard Fleet, Dashboard Drivers, Dashboard Finance, Dashboard principal FleetCore
- **Résultat :** 1 template → **5 dashboards**

#### PATTERN 4 — "Kanban" → TOUS LES PIPELINES

- **Source :** shadcnuikit `/apps/kanban`
- **Technique :** atomic-crm Pipeline Kanban + @hello-pangea/dnd (ou dnd-kit Kiranism) + **Refine useUpdate** pour le drag & drop
- **Sert à :** Leads Pipeline, Opportunities Pipeline, Maintenance Work Orders
- **Résultat :** 1 template → **3 pipelines**

#### PATTERN 5 — "Settings" → TOUS LES SETTINGS

- **Source :** shadcnuikit `/pages/settings/*` (6 sous-pages)
- **Sert à :** CRM Settings, Admin Tenant Settings, User Profile Settings, Billing Settings
- **Résultat :** 6 templates settings → **4 sections FleetCore**

#### PATTERN 6 — "Calendar" → TOUT CE QUI EST PLANNING

- **Source :** shadcnuikit `/apps/calendar`
- **Sert à :** Planning maintenance véhicules, Planning shifts chauffeurs, Calendrier démos CRM, Rappels expirations (docs, assurances, permis)
- **Résultat :** 1 template → **4 usages**

#### PATTERN 7 — "Tasks" → TOUTE GESTION DE TÂCHES

- **Source :** shadcnuikit `/apps/tasks`
- **Sert à :** Work orders maintenance, Tâches onboarding tenant/driver, Tâches support, Tâches internes admin
- **Résultat :** 1 template → **4 usages**

#### PATTERN 8 — "File Manager" → TOUTE GESTION DOCUMENTAIRE

- **Source :** shadcnuikit `/apps/file-manager`
- **Sert à :** Documents véhicules, Documents chauffeurs, Contrats signés, Factures archivées
- **Résultat :** 1 template → **4 usages**

#### PATTERN 9 — "Onboarding Flow" → TOUS LES WIZARDS

- **Source :** shadcnuikit `/pages/onboarding`
- **Sert à :** Onboarding nouveau tenant, Onboarding nouveau chauffeur, Ajout véhicule, Wizard book-demo
- **Résultat :** 1 template → **4 wizards**

#### PATTERN 10 — "Chat" → COMMUNICATION

- **Source :** shadcnuikit `/apps/chat`
- **Sert à :** Communication admin ↔ tenants, Communication chauffeurs, Notes/activités sur leads
- **Résultat :** 1 template → **2-3 usages**

#### PATTERN 11 — "Analytics Dashboard" → MODULE ANALYTICS

- **Source :** shadcnuikit `/dashboards/analytics`
- **Technique :** atomic-crm Revenue Dashboard patterns
- **Sert à :** Reports CRM, Analytics Fleet, Analytics Drivers, P&L par véhicule/chauffeur
- **Résultat :** 1 template → **4 rapports**

#### PATTERN 12 — "Finance Dashboard" → MODULE BILLING

- **Source :** shadcnuikit `/dashboards/finance`
- **Sert à :** Dashboard Finance, Vue paiements Stripe, Réconciliation revenus plateformes
- **Résultat :** 1 template → **3 usages**

### 5.3 Pages 1:1 (mapping direct)

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

### 5.4 Éléments transversaux OBLIGATOIRES

| Élément shadcnuikit   | Statut                                   |
| --------------------- | ---------------------------------------- |
| Theme customizer      | **OBLIGATOIRE** — 7 options complètes    |
| 8 presets de thème    | **OBLIGATOIRE** — tous installés         |
| 11 fonts              | **OBLIGATOIRE** — toutes disponibles     |
| Dark mode automatique | **OBLIGATOIRE** — OKLCH + .dark selector |

### 5.5 Couverture totale

| Métrique                          | Valeur                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Patterns réutilisables            | 12                                                                                |
| Pages 1:1                         | 9                                                                                 |
| Total pages shadcnuikit utilisées | 21                                                                                |
| Pages shadcnuikit ignorées        | 47                                                                                |
| Pages FleetCore couvertes         | **50+**                                                                           |
| Couverture modules FleetCore      | **100%** (CRM, Fleet, Drivers, Maintenance, Analytics, Admin, Billing, Documents) |

### 5.6 Matrice composant standardisé → modules

Chaque composant UI est construit **UNE FOIS** et utilisé partout :

| Composant standard | CRM                    | Fleet              | Drivers              | Maintenance    | Analytics    | Admin                | Billing                |
| ------------------ | ---------------------- | ------------------ | -------------------- | -------------- | ------------ | -------------------- | ---------------------- |
| DataTable (P1)     | ✅ Leads, Opps, Quotes | ✅ Vehicles        | ✅ Drivers           | ✅ History     | —            | ✅ Members, Tenants  | ✅ Invoices, Contracts |
| Detail Page (P2)   | ✅ Lead, Opp           | ✅ Vehicle         | ✅ Driver            | —              | —            | ✅ Tenant, Member    | ✅ Invoice, Contract   |
| Dashboard (P3)     | ✅ CRM Dash            | ✅ Fleet Dash      | ✅ Drivers Dash      | —              | ✅ Analytics | —                    | ✅ Finance Dash        |
| Kanban (P4)        | ✅ Leads, Opps         | —                  | —                    | ✅ Work Orders | —            | —                    | —                      |
| Settings (P5)      | ✅ CRM Settings        | —                  | —                    | —              | —            | ✅ Tenant Settings   | ✅ Billing Settings    |
| Calendar (P6)      | ✅ Démos               | —                  | ✅ Shifts            | ✅ Planning    | —            | —                    | —                      |
| Tasks (P7)         | —                      | —                  | ✅ Onboarding        | ✅ Work Orders | —            | ✅ Support           | —                      |
| File Manager (P8)  | —                      | ✅ Docs véhicules  | ✅ Docs chauffeurs   | —              | —            | —                    | ✅ Factures            |
| Onboarding (P9)    | —                      | ✅ Ajout véhicule  | ✅ Onboarding driver | —              | —            | ✅ Onboarding tenant | —                      |
| Chat (P10)         | ✅ Notes leads         | —                  | ✅ Comm. chauffeurs  | —              | —            | ✅ Support           | —                      |
| Analytics (P11)    | ✅ Reports             | ✅ Fleet Analytics | ✅ Drivers Analytics | —              | ✅ Rapports  | —                    | —                      |
| Finance (P12)      | —                      | —                  | —                    | —              | —            | —                    | ✅ Dash, Paiements     |
| PageContainer      | ✅                     | ✅                 | ✅                   | ✅             | ✅           | ✅                   | ✅                     |
| FilterBar          | ✅                     | ✅                 | ✅                   | ✅             | ✅           | ✅                   | ✅                     |
| Stat Cards         | ✅                     | ✅                 | ✅                   | ✅             | ✅           | ✅                   | ✅                     |
| Empty State        | ✅                     | ✅                 | ✅                   | ✅             | ✅           | ✅                   | ✅                     |
| Form Modal         | ✅                     | ✅                 | ✅                   | ✅             | —            | ✅                   | —                      |

---

## 6. DÉCISIONS TECHNIQUES STRUCTURANTES

### 6.1 Couche Data — Refine.dev (DÉCISION VALIDÉE)

> **Sources :** FLEETCORE_REFINE_SPECIFICATION_CCode.md (1 967 lignes), FLEETCORE_REFINE_SPECIFICATION.md (1 737 lignes), REFINE_VS_CUSTOM_ANALYSIS.md (762 lignes)  
> **Statut :** ✅ **DÉCISION PRISE** le 14 février 2026 par le CEO/CTO — Refine.dev retenu comme couche d'abstraction CRUD frontend

#### Le problème résolu

FleetCore a 14 composants CRM qui utilisent `fetch()` brut : pas de cache, pas d'invalidation, pas de retry, pas de loading state centralisé. Chaque page gère sa propre data fetching de façon indépendante et incohérente. L'absence de couche d'abstraction CRUD produit un "assemblage de pages web" au lieu d'un CRM professionnel.

#### Ce que Refine.dev apporte

| Capacité               | Avant (fetch brut)         | Après (Refine)                                      |
| ---------------------- | -------------------------- | --------------------------------------------------- |
| Cache données          | ❌ Aucun                   | ✅ TanStack Query v5 automatique (staleTime: 5min)  |
| Invalidation           | ❌ Manuelle par page       | ✅ Automatique après mutation                       |
| Optimistic updates     | ❌ Inexistant              | ✅ `mutationMode: "optimistic"`                     |
| Retry erreurs          | ❌ Inexistant              | ✅ Automatique (configurable, défaut: 2)            |
| Deduplication requêtes | ❌ Requêtes dupliquées     | ✅ TanStack Query dedup                             |
| Hooks CRUD standard    | ❌ Custom par page         | ✅ useList, useOne, useCreate, useUpdate, useDelete |
| RBAC UI                | ❌ Manual useHasPermission | ✅ useCan + `<CanAccess>` déclaratif                |
| Pagination URL         | ❌ Custom par page         | ✅ syncWithLocation automatique                     |
| Devtools               | ❌ Aucun                   | ✅ TanStack Query Devtools + Refine Devtools        |

#### Architecture Refine → Server Actions

```
┌─ Page Component (léger, ~60L) ───────────────────────┐
│  useTable({ resource: "leads", syncWithLocation: true })
│  → TanStack Query v5 = cache + invalidation auto      │
│  → URL sync = filtres persistés et bookmarkables       │
│  → Pagination serveur = scalable                       │
└──────────────┬────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────┐
│  DataProvider (lib/providers/refine-data-provider.ts)  │
│  RESOURCE_CONFIG registry → mappe resource → endpoint  │
│  getList → API route GET (avec filtres/pagination)     │
│  create/update → Server Action (import dynamique)      │
└──────────────┬────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────┐
│  Server Actions (INCHANGÉS — 9/10)                     │
│  auth() + orgId + getCurrentProviderId()               │
│  buildProviderFilter() + Zod safeParse + audit logs    │
└───────────────────────────────────────────────────────┘
```

**Règle fondamentale :** Le DataProvider s'adapte aux Server Actions. **JAMAIS** l'inverse. La sécurité (auth, tenant isolation, audit) reste intégralement dans les Server Actions.

#### Empreinte technique

| Package                  | Version | Taille gzipped         |
| ------------------------ | ------- | ---------------------- |
| @refinedev/core          | ^5.0.9  | ~40-60 KB              |
| @refinedev/nextjs-router | ^7.0.4  | ~3-5 KB                |
| @tanstack/react-query    | ^5.81   | ~25-35 KB              |
| **Total ajouté**         |         | **~70-100 KB gzipped** |
| **node_modules**         |         | **~8.6 MB**            |

Dépendances transitives : lodash-es, papaparse, pluralize, qs, tslib, warn-once.

#### Providers FleetCore Refine (8 fichiers, ~545 lignes)

| Provider                  | Fichier                                           | Lignes   | Rôle                                                                             |
| ------------------------- | ------------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| **DataProvider**          | `lib/providers/refine-data-provider.ts`           | ~200-250 | Registre RESOURCE_CONFIG, 6 méthodes CRUD, appelle Server Actions/API routes     |
| **Mappers**               | `lib/providers/refine-mappers.ts`                 | ~80      | Transforme filtres/tri/pagination Refine → format FleetCore API                  |
| **AuthProvider**          | `lib/providers/refine-auth-provider.ts`           | ~60-80   | Adapter Clerk → interface Refine (login/logout/check/getIdentity/getPermissions) |
| **AccessControlProvider** | `lib/providers/refine-access-control-provider.ts` | ~30-40   | Mappe RBAC FleetCore (lib/config/permissions.ts) → interface Refine              |
| **i18nProvider**          | `lib/providers/refine-i18n-provider.ts`           | ~15      | Pont react-i18next → interface Refine                                            |
| **NotificationProvider**  | `lib/providers/refine-notification-provider.ts`   | ~25      | Pont Sonner toast → interface Refine                                             |
| **AuditLogProvider**      | `lib/providers/refine-audit-log-provider.ts`      | ~30      | Pont adm_audit_logs → interface Refine                                           |
| **Resources**             | `lib/providers/refine-resources.ts`               | ~50      | Déclarations des resources avec routes et permissions                            |

#### Routes API à créer (3 fichiers, ~45 lignes)

| Route         | Fichier                          | Lignes | Rôle                                                |
| ------------- | -------------------------------- | ------ | --------------------------------------------------- |
| Auth check    | `app/api/auth/check/route.ts`    | ~10    | Vérification statut auth (pour Refine AuthProvider) |
| Auth identity | `app/api/auth/identity/route.ts` | ~15    | Info utilisateur courant                            |
| Auth can      | `app/api/auth/can/route.ts`      | ~20    | Vérification permission                             |

#### Multi-tenant : transparent

Le DataProvider **N'A PAS BESOIN** d'injecter orgId ou providerId. Les Server Actions gèrent déjà l'isolation via `getCurrentProviderId()` + `buildProviderFilter()`. Quand Refine appelle un Server Action, l'isolation multi-tenant est automatique car elle est dans le backend, pas dans le frontend.

#### Lock-in : maîtrisé

Refine est open-source (MIT). L'interface DataProvider est standard TypeScript. Si migration nécessaire, il faut réécrire ~300 lignes d'adapters (providers) et remplacer les hooks useList/useOne par des hooks custom équivalents. La logique métier et les Server Actions ne sont pas touchés.

#### Règles absolues Refine

| #   | Règle                                                               | Raison                                                                            |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| R1  | **JAMAIS modifier un Server Action pour l'adapter au DataProvider** | La sécurité est dans les Server Actions. Le DataProvider s'adapte, pas l'inverse. |
| R2  | **TOUJOURS utiliser `syncWithLocation: true`** pour les pages liste | UX : filtres bookmarkables, back button fonctionne                                |
| R3  | **TOUJOURS déclarer la resource dans FLEETCORE_RESOURCES**          | Sinon Refine ne peut pas résoudre les routes                                      |
| R4  | **JAMAIS stocker de l'état de cache manuellement**                  | TanStack Query gère le cache. Pas de `useState` pour les données serveur          |
| R5  | **TOUJOURS utiliser `<CanAccess>` ou `useCan()`** pour le RBAC UI   | Pas de `if (hasPermission)` dans le JSX — utiliser le système Refine              |
| R6  | **UN dossier `features/{module}/{resource}/` par resource**         | Structure feature-based, pas de fourre-tout                                       |
| R7  | **JAMAIS de `fetch()` direct dans un composant**                    | Passer par les hooks Refine (useList, useOne, etc.)                               |
| R8  | **JAMAIS import Server Action dans un composant client**            | Passer par le DataProvider                                                        |

### 6.2 Stratégie Auth — Clerk aujourd'hui, portabilité demain

> **Source :** Analyses CLERK_AUDIT.md (565 lignes), AUTH_ARCHITECTURE_STUDY.md (1031 lignes), AUTH_ZERO_LOCKIN_STUDY.md (792 lignes)

#### Empreinte Clerk actuelle

| Métrique                             | Valeur                                               |
| ------------------------------------ | ---------------------------------------------------- |
| Fichiers importants @clerk/\*        | 57 (9.1% du projet)                                  |
| Fichiers avec auth()                 | 38                                                   |
| Fichiers avec currentUser()          | 4                                                    |
| Fichiers avec hooks client           | 12                                                   |
| Fichiers avec composants UI          | 5                                                    |
| getCurrentProviderId() consommateurs | 18 fichiers                                          |
| buildProviderFilter() appels         | 24 appels dans 10 fichiers                           |
| Pages auth custom headless           | 6 pages, ~1 547 lignes                               |
| Variables env                        | 10                                                   |
| Tables DB avec colonnes clerk\_\*    | 3 (adm_tenants, clt_members, adm_provider_employees) |
| node_modules Clerk                   | ~185 MB (8.8% du total)                              |

#### Constat de portabilité RLS

Les 47 policies RLS de FleetCore utilisent `current_setting('app.current_tenant_id')` — du **PostgreSQL standard**. Aucune utilisation de `auth.uid()` ou `auth.jwt()` Supabase-specific. Le pattern `with-provider-context.ts` utilise Prisma Extensions + `$transaction` + `set_config()` — **déjà portable** vers AWS RDS, Aurora, Cloud SQL, Azure, self-hosted.

#### Constat de couplage Supabase

FleetCore n'a **ZÉRO import** `@supabase` dans son code. La connexion Supabase se fait uniquement via `DATABASE_URL` + `DIRECT_URL` — c'est du PostgreSQL standard. La migration vers un autre hébergeur PostgreSQL = 3-4 jours (pg_dump/restore + connection pooling + env vars).

#### RBAC FleetCore

Le système RBAC (`lib/config/permissions.ts`, 239 lignes) est **DÉCOUPLÉ de Clerk**. La fonction `hasPermission` prend un `role: string` — seul point de couplage : `useHasPermission()` ligne 33 qui appelle `useOrganization()`. Avec Refine, le RBAC UI passe par `<CanAccess>` et `useCan()` via l'AccessControlProvider, qui appelle le même `hasPermission()` en interne.

#### Stratégie retenue

**Phase de refonte frontend (maintenant) :** Garder Clerk tel quel. La refonte touche uniquement la couche de présentation — changer l'auth en même temps serait risqué et hors scope.

**Post-refonte (futur) :** Si décision de migration auth :

- Interface d'abstraction : `AuthSession`, `UserIdentity`, `ServerAuthProvider`, `AdminAuthProvider`, `ClientAuthHooks`
- Backends possibles : Better Auth (remplaçant Auth.js v5, MIT, plugin Organizations natif, 0€), Supabase Auth (GoTrue, 50K MAU free tier), Custom JWT (10-20 jours)
- Tables DB FleetCore existantes déjà prêtes : `clt_members`, `adm_member_sessions`, `adm_tenants`, `adm_roles`, `adm_role_permissions`, `adm_member_roles`, `adm_invitations`
- Colonnes manquantes à ajouter : `clt_members.auth_user_id (UUID)`, `adm_provider_employees.auth_user_id`, `clt_members.password_hash` (si custom JWT)
- Objectif : 57 fichiers couplés Clerk → 2-3 fichiers couplés au provider

### 6.3 État global — Architecture tri-couche

L'état dans FleetCore post-refonte est séparé en **3 couches distinctes**, chacune avec son outil dédié :

| Couche           | Outil                              | Ce qu'elle stocke                                                                                                                                         | Source              |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **Server state** | **TanStack Query v5** (via Refine) | Données provenant de l'API/Server Actions : leads, opportunities, vehicles, etc. Cache automatique, invalidation après mutation, retry, deduplication.    | Refine DataProvider |
| **UI state**     | **Zustand**                        | État purement interface : sidebar collapsed/expanded, mode de vue (table/kanban), items sélectionnés, modal ouvert/fermé, préférences utilisateur locale. | Kiranism            |
| **URL state**    | **nuqs**                           | Filtres, pagination, tri — tout ce qui doit être partageable et bookmarkable dans l'URL.                                                                  | Kiranism            |

**Règle fondamentale :** Les données serveur **NE SONT JAMAIS** dans un useState ou un store Zustand. Elles passent exclusivement par les hooks Refine (useList, useOne, useTable) qui utilisent TanStack Query v5 sous le capot.

**Stores Zustand prévus (UI state uniquement) :**

- `sidebar-store.ts` — État sidebar collapsed/expanded
- `leads-store.ts` — Mode de vue (table/kanban), colonnes visibles, sélection multi-items
- `opportunities-store.ts` — Même pattern
- `fleet-store.ts` — Mode de vue véhicules
- `drivers-store.ts` — Mode de vue chauffeurs
- `preferences-store.ts` — Locale, thème actif, tailles de page préférées

### 6.4 Tokens couleur — OKLCH unifié

**Décision :** Adopter le système OKLCH de shadcnuikit, supprimer le système FC hex.

**Justification factuelle :** Le système FC hex est un **échec** : 13% d'adoption, ratio tokens 1:66. L'OKLCH résout 3 problèmes : incohérence des couleurs (2 238 occurrences brutes → tokens sémantiques), dark mode manuel (→ automatique via `.dark` selector), incompatibilité avec composants importés (→ tout sur le même système).

**Statut :** ✅ DÉJÀ FAIT — Phase 1A complétée (commit e056978).

### 6.5 Next.js 16 — Déjà migré

**Statut :** ✅ COMPLÉTÉ — Phase 0 (Migration Next.js 15.5.3 → 16.1.6, Clerk 6.32.2 → 6.37.3, Sentry 10.13.0 → 10.38.0).

### 6.6 Charts — Recharts v3 (garder)

FleetCore est **déjà** sur Recharts v3 (version moderne). shadcnuikit utilise v2. Les adaptations des charts shadcnuikit sont mécaniques (renommage de props). Régresser vers v2 serait une dette technique.

### 6.7 Nouvelles dépendances à installer

```bash
# Existantes (à garder)
pnpm add @tanstack/react-table@^8.21 nuqs@^2.4 zustand@^5.0 kbar cmdk@^1.1

# NOUVELLES (Refine — Phase 1C)
pnpm add @refinedev/core@^5.0.9 @refinedev/nextjs-router@^7.0.4 @tanstack/react-query@^5.81
```

| Package                      | Version    | Usage                                                                | Source               |
| ---------------------------- | ---------- | -------------------------------------------------------------------- | -------------------- |
| @tanstack/react-table        | ^8.21      | Remplacement des 3 tables custom (~2 100L de duplication)            | Kiranism             |
| nuqs                         | ^2.4       | URL state management (filtres, pagination dans l'URL)                | Kiranism             |
| zustand                      | ^5.0       | State management UI (remplace useState locaux pour l'état interface) | Kiranism             |
| kbar                         | latest     | Command palette (Cmd+K)                                              | Kiranism             |
| cmdk                         | ^1.1       | Composant command shadcn                                             | shadcnuikit          |
| **@refinedev/core**          | **^5.0.9** | **Couche d'abstraction CRUD — DataProvider, AuthProvider, hooks**    | **Décision validée** |
| **@refinedev/nextjs-router** | **^7.0.4** | **Router provider Next.js natif (ZÉRO react-router-dom)**            | **Décision validée** |
| **@tanstack/react-query**    | **^5.81**  | **Cache, invalidation, retry, deduplication (via Refine)**           | **Décision validée** |

**Peer dependencies vérifiées :**

- React 18/19 ✅ (FleetCore = React 19.2.4)
- Next.js \* ✅ (FleetCore = Next.js 16.1.6)

---

## 7. ARCHITECTURE CIBLE DÉTAILLÉE

### 7.1 Structure des dossiers

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/                    # Pages auth Clerk (INCHANGÉ)
│   │   ├── (public)/                  # Pages publiques (INCHANGÉ)
│   │   └── (app)/                     # ← ZONE REFONTE
│   │       ├── layout.tsx             # AppShell shadcnuikit + <Refine> + KBar + SidebarProvider
│   │       ├── dashboard/page.tsx     # Dashboard principal (PATTERN 3)
│   │       ├── crm/
│   │       │   ├── leads/
│   │       │   │   ├── page.tsx       # Pipeline Kanban (PATTERN 4)
│   │       │   │   ├── browser/       # Vue table (PATTERN 1)
│   │       │   │   ├── [id]/          # Fiche détail (PATTERN 2)
│   │       │   │   └── reports/       # Analytics (PATTERN 11)
│   │       │   ├── opportunities/     # Pipeline + Detail + Table
│   │       │   ├── quotes/            # Liste + Detail
│   │       │   ├── dashboard/         # CRM Dashboard (PATTERN 3)
│   │       │   └── settings/          # CRM Settings (PATTERN 5)
│   │       ├── fleet/                 # Dashboard + Vehicles List/Detail + Documents
│   │       ├── drivers/               # Dashboard + List/Detail + Onboarding + Planning
│   │       ├── maintenance/           # Calendar + Tasks + History
│   │       ├── analytics/             # Dashboard + Reports
│   │       ├── billing/               # Finance Dashboard + Invoices + Contracts + Payments
│   │       ├── documents/             # File Manager global (PATTERN 8)
│   │       ├── admin/                 # Members + Roles + Tenants + Settings
│   │       ├── settings/              # User Settings (PATTERN 5)
│   │       ├── notifications/         # Notifications (1:1)
│   │       └── chat/                  # Communication (PATTERN 10)
│   ├── api/
│   │   ├── auth/                      # NOUVEAU — Routes auth pour Refine
│   │   │   ├── check/route.ts         # ~10L — Vérification statut auth
│   │   │   ├── identity/route.ts      # ~15L — Info utilisateur courant
│   │   │   └── can/route.ts           # ~20L — Vérification permission
│   │   └── v1/                        # Routes API existantes (INCHANGÉ)
│   └── layout.tsx                     # Root: ThemeProvider + NuqsAdapter + Clerk
│
├── components/
│   ├── ui/                            # 58 composants shadcn/ui (depuis shadcnuikit)
│   │   ├── table/                     # DataTable system (Kiranism — 9 fichiers)
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
├── features/                          # Modules métier (pattern Kiranism + Refine)
│   ├── crm/
│   │   ├── leads/
│   │   │   ├── components/            # leads-list-page, lead-columns, etc.
│   │   │   ├── hooks/                 # use-leads-table (config Refine useTable)
│   │   │   ├── types/                 # lead.types.ts — interfaces TypeScript
│   │   │   ├── schemas/               # lead.schema.ts — Zod create + update
│   │   │   └── utils/
│   │   ├── opportunities/             # Même pattern
│   │   ├── quotes/
│   │   └── settings/
│   ├── fleet/
│   │   ├── vehicles/
│   │   └── documents/
│   ├── drivers/
│   │   ├── list/
│   │   ├── onboarding/
│   │   └── planning/
│   ├── maintenance/
│   ├── analytics/
│   ├── billing/
│   ├── documents/
│   ├── admin/
│   ├── notifications/
│   └── chat/
│
├── hooks/                             # Hooks globaux réutilisables
│   ├── use-data-table.ts              # Kiranism (296L) — config TanStack Table
│   ├── use-nav.ts                     # RBAC nav filtering (158L)
│   ├── use-breadcrumbs.tsx            # Auto breadcrumbs (46L)
│   ├── use-mobile.tsx                 # Mobile detection (21L)
│   ├── use-debounce.tsx               # Debounce (19L)
│   └── use-localized-path.ts          # FleetCore existant (conservé)
│
├── stores/                            # Zustand stores — UI STATE UNIQUEMENT
│   ├── sidebar-store.ts
│   ├── leads-store.ts                 # Mode vue, colonnes visibles, sélection
│   ├── opportunities-store.ts
│   ├── fleet-store.ts
│   ├── drivers-store.ts
│   └── preferences-store.ts
│
├── lib/
│   ├── actions/                       # Server Actions (INCHANGÉ)
│   ├── services/                      # Services métier (INCHANGÉ)
│   ├── validators/                    # Zod validators (INCHANGÉ)
│   ├── providers/                     # NOUVEAU — Providers Refine (~545L total)
│   │   ├── refine-data-provider.ts    # ~200-250L — RESOURCE_CONFIG + 6 méthodes CRUD
│   │   ├── refine-mappers.ts          # ~80L — Filtres/tri/pagination transformations
│   │   ├── refine-auth-provider.ts    # ~60-80L — Adapter Clerk → Refine
│   │   ├── refine-access-control-provider.ts  # ~30-40L — RBAC FleetCore → Refine
│   │   ├── refine-i18n-provider.ts    # ~15L — Pont react-i18next
│   │   ├── refine-notification-provider.ts  # ~25L — Pont Sonner
│   │   ├── refine-audit-log-provider.ts  # ~30L — Pont adm_audit_logs
│   │   └── refine-resources.ts        # ~50L — Déclarations resources + routes
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

### 7.2 Pattern de page cible — Exemple LeadsListPage (avec Refine)

**AVANT (état actuel) :**

```
LeadsPageClient.tsx — 1 098 lignes, 24 useState, 73 fonctions inline, 7 modals
Pas de cache. Pas d'invalidation. Pas de retry. Pas de sync URL.
```

**APRÈS (architecture cible avec Refine) :**

```
features/crm/leads/
  ├── types/lead.types.ts              →  40L  (TypeScript interfaces)
  ├── schemas/lead.schema.ts           →  30L  (Zod create + update)
  ├── hooks/use-leads-table.ts         →  25L  (Config: useTable({ resource: "leads", syncWithLocation: true }))
  ├── components/
  │   ├── leads-list-page.tsx          →  60L  (Client, useTable + DataTable visuel shadcnuikit)
  │   ├── lead-columns.tsx             →  80L  (Config, ColumnDef[] + actions via useCan)
  │   ├── leads-create-dialog.tsx      →  80L  (Client, useCreate + form shadcnuikit)
  │   └── leads-edit-drawer.tsx        → 100L  (Client, useOne + useUpdate + drawer shadcnuikit)
                                        ————————
                                 Total → ~415L réparties en 7 fichiers
                                 Max   → 100L par fichier
                                 Cache → TanStack Query automatique (5min stale, invalidation après mutation)
                                 RBAC  → <CanAccess> + useCan() déclaratif
                                 URL   → syncWithLocation automatique
```

**Gains concrets vs ancien pattern :**

| Métrique                      | Avant                     | Après                       | Gain          |
| ----------------------------- | ------------------------- | --------------------------- | ------------- |
| Lignes de code                | 1 098L (1 fichier)        | ~415L (7 fichiers)          | -62%          |
| Max lignes par fichier        | 1 098L                    | 100L                        | -91%          |
| useState pour données serveur | 24                        | 0                           | -100%         |
| Temps chargement              | Full DB fetch (100 leads) | Paginated (25/page) + cache | -60% TTI      |
| Cache client                  | Aucun                     | TanStack Query (5min stale) | -70% requêtes |
| Filtres dans URL              | Non                       | Oui (syncWithLocation)      | Bookmarkable  |
| RBAC boutons                  | if/else manuels           | `<CanAccess>` déclaratif    | Centralisé    |

Ce pattern sera **répliqué** pour chaque resource (Opportunities, Vehicles, Drivers, etc.) en suivant la checklist de l'Annexe C.

---

# PARTIE III — PLAN D'EXÉCUTION

---

## 8. PLAN D'EXÉCUTION EN 15 PHASES

### Estimation globale

| Phase     | Description                                                       | Durée estimée       | Statut                   |
| --------- | ----------------------------------------------------------------- | ------------------- | ------------------------ |
| 0         | Migration Next.js 16                                              | 1-2 jours           | **✅ COMPLÉTÉE**         |
| 1A        | Theming OKLCH + Composants shadcn/ui                              | 1-2 jours           | **✅ COMPLÉTÉE**         |
| 1B        | Layout shadcnuikit (sidebar, header, PageContainer)               | 1-2 jours           | **⏳ ~80%** — 1B.4 reste |
| **1C**    | **Infrastructure Refine.dev (providers, routes, `<Refine>`)**     | **1-2 jours**       | **🔲 À faire**           |
| 2         | DataTable standardisé (TanStack) + Leads Refine pilote            | 3-5 jours           | 🔲 À faire               |
| 3         | Refactoring God Components + Zustand UI state                     | 3-4 jours           | 🔲 À faire               |
| 4         | Navigation et UX avancée (KBar, search)                           | 2 jours             | 🔲 À faire               |
| 5         | Dashboards enrichis (5 dashboards) — PATTERNS 3+12                | 3-4 jours           | 🔲 À faire               |
| 6         | CRM complet (Opportunities, Quotes, Settings, Reports) via Refine | 3-4 jours           | 🔲 À faire               |
| 7         | Module Fleet (Vehicles, Documents)                                | 3-4 jours           | 🔲 À faire               |
| 8         | Module Drivers (List, Detail, Onboarding, Planning)               | 3-4 jours           | 🔲 À faire               |
| 9         | Modules Maintenance + Documents + Billing                         | 4-5 jours           | 🔲 À faire               |
| 10        | Module Admin (Members, Tenants, RBAC, Settings)                   | 2-3 jours           | 🔲 À faire               |
| 11        | Analytics + Transversaux (Reports, Notifications, Chat, API Keys) | 2-3 jours           | 🔲 À faire               |
| 12        | Pages erreur + Auth visuel + Empty States                         | 1-2 jours           | 🔲 À faire               |
| 13        | Accessibilité et polish                                           | 2-3 jours           | 🔲 À faire               |
| 14        | Nettoyage et validation finale                                    | 2-3 jours           | 🔲 À faire               |
| **TOTAL** |                                                                   | **36-52 jours dev** | **~15% complété**        |

> **Note :** Jours de développement pur (prompts + exécution + validation). Le calendrier réel inclut le cycle ULTRATHINK (prompt → plan → validation → exécution → vérification).

### Phase 1B.4 — PROCHAINE ACTION IMMÉDIATE

**Sous-tâches :**

| #   | Action                  | Détail                                                                                                                                                                                                                      |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Revert inventions I1-I7 | Supprimer breadcrumb system inventé (fichiers breadcrumbs.tsx, useBreadcrumbs.ts, BreadcrumbContext.tsx + retirer imports de site-header.tsx, layout.tsx, LeadDetailHeader.tsx, settings/crm/layout.tsx + clés common.json) |
| 2   | Revert invention I8     | Retirer `<SidebarRail />` de app-sidebar.tsx                                                                                                                                                                                |
| 3   | Inner wrapper fix       | Identifier le markup EXACT du content wrapper dans shadcnuikit (classes, padding, max-width) — ALLER REGARDER dans les fichiers                                                                                             |
| 4   | PageContainer           | Créer composant DRY : Couche 1 (visuel) = shadcnuikit exact, Couche 2 (technique) = Kiranism pattern                                                                                                                        |
| 5   | Build + test + commit   | pnpm typecheck + pnpm build + pnpm lint + vérification visuelle + git commit                                                                                                                                                |

### Phase 1C — Infrastructure Refine.dev (NOUVELLE)

**Objectif :** Installer Refine, créer les 8 providers + 3 routes API, monter `<Refine>` dans le layout dashboard. Les pages existantes continuent de fonctionner car elles n'utilisent pas encore les hooks Refine.

**Sous-tâches :**

| #   | Action                                      | Fichier                                           | Effort |
| --- | ------------------------------------------- | ------------------------------------------------- | ------ |
| 1   | Installer les 3 packages Refine             | `package.json`                                    | 5 min  |
| 2   | Créer DataProvider + RESOURCE_CONFIG        | `lib/providers/refine-data-provider.ts`           | 4h     |
| 3   | Créer Mappers (filtres/tri/pagination)      | `lib/providers/refine-mappers.ts`                 | 1h     |
| 4   | Créer AuthProvider (Clerk adapter)          | `lib/providers/refine-auth-provider.ts`           | 1h     |
| 5   | Créer AccessControlProvider (RBAC)          | `lib/providers/refine-access-control-provider.ts` | 30 min |
| 6   | Créer i18nProvider (react-i18next bridge)   | `lib/providers/refine-i18n-provider.ts`           | 15 min |
| 7   | Créer NotificationProvider (Sonner bridge)  | `lib/providers/refine-notification-provider.ts`   | 15 min |
| 8   | Créer AuditLogProvider                      | `lib/providers/refine-audit-log-provider.ts`      | 30 min |
| 9   | Créer Resources declarations                | `lib/providers/refine-resources.ts`               | 1h     |
| 10  | Créer 3 routes API auth                     | `app/api/auth/{check,identity,can}/route.ts`      | 30 min |
| 11  | Wrapper `<Refine>` dans le layout (app)     | `app/[locale]/(app)/layout.tsx`                   | 1h     |
| 12  | Test : vérifier toutes les pages existantes | Test manuel                                       | 30 min |

**Livrable :** `<Refine>` monté avec tous les providers. Toutes les pages existantes continuent de fonctionner identiquement.

**Critères de validation Phase 1C :**

- ✅ `pnpm build` réussi (0 erreur)
- ✅ Toutes les pages existantes s'affichent normalement
- ✅ `useTable({ resource: "leads" })` dans une page test retourne des données
- ✅ Aucune régression sur les fonctionnalités existantes
- ✅ Les hooks Refine sont disponibles dans tous les composants sous `(app)/`

**Rollback strategy :** Tag git `pre-refine-migration` + feature flag `NEXT_PUBLIC_USE_REFINE=true|false`.

### Phase 2 — DataTable standardisé + Leads Refine pilote (3-5 jours)

Infrastructure DataTable Kiranism (9 fichiers, 1 806L) + useDataTable hook (296L) → Migration LeadsTable vers Refine useTable + DataTable shadcnuikit. Première resource complète via Refine comme preuve de concept.

**Sous-étapes :** Ajouter "leads" dans RESOURCE_CONFIG → Créer features/crm/leads/ (types, schemas, hooks, components) → Migrer LeadsPageClient vers hooks Refine → Valider cache, invalidation, optimistic updates, URL sync, RBAC → Parcours E2E complet.

**Critères de validation Phase 2 :**

- ✅ Leads page 100% fonctionnelle via Refine
- ✅ E2E : créer lead → filtrer → drag Kanban → éditer drawer → bulk action → supprimer
- ✅ Performance : Lighthouse score ≥ 90
- ✅ Pas de régression sur les Server Actions tests

### Phases 3-14 — Résumé (détail dans les spécifications chapitres)

**Phase 3 — Refactoring God Components + Zustand UI state (3-4 jours) :**
Zustand stores × 5 (UI state uniquement) → Éclatement OpportunityDrawer (1 021L → features/) → PipelineSettingsTab (1 293L → ~400L). Les données serveur passent par Refine hooks.

**Phase 4 — Navigation et UX avancée (2 jours) :**
KBar command palette + raccourcis + search global + transitions Framer Motion + theme customizer **OBLIGATOIRE**.

**Phase 5 — Dashboards enrichis (3-4 jours) :**
5 dashboards (PATTERN 3) avec données réelles, Recharts v3, streaming SSR.

**Phase 6 — CRM complet via Refine (3-4 jours) :**
Opportunities, Quotes comme nouvelles resources Refine. CRM Settings + CRM Reports. Chaque resource suit la checklist Annexe C.

**Phases 7-12 — Modules métier :**
Fleet (3-4j), Drivers (3-4j), Maintenance+Documents+Billing (4-5j), Admin (2-3j), Analytics+Transversaux (2-3j), Pages erreur+Auth visuel+Empty States (1-2j). Chaque module ajoute ses resources dans RESOURCE_CONFIG.

**Phase 13 — Accessibilité (2-3 jours) :**
Score 2/10 → 7/10+ : reduced-motion, aria-labels, keyboard nav, contrastes, semantic HTML.

**Phase 14 — Nettoyage final (2-3 jours) :**
Suppression components/crm/ legacy + components/app/ legacy + tokens hex + imports orphelins. Vérification 50+ pages.

---

## 9. ÉTAT D'AVANCEMENT ACTUEL (14 Février 2026)

### 9.1 Vue synthétique

| Élément                                    | Statut                                  |
| ------------------------------------------ | --------------------------------------- |
| Phase 0 — Migration Next.js 16             | ✅ COMPLÉTÉE                            |
| Phase 1A — Theming OKLCH + Composants      | ✅ COMPLÉTÉE (commit e056978)           |
| Phase 1B.1 — sidebar.tsx                   | ✅ COMPLÉTÉE (commit 3b2dad1)           |
| Phase 1B.1-fix — Skeleton régression       | ✅ COMPLÉTÉE (commit 9cabf72)           |
| Phase 1B.2 — Layout remplacement           | ✅ COMPLÉTÉE (commit 035f328)           |
| Phase 1B.2r — Rattrapage 13 écarts         | ✅ COMPLÉTÉE                            |
| Phase 1B.3 — Breadcrumbs                   | ❌ ANNULÉE — invention détectée         |
| Phase 1B.4 — Inner wrapper + PageContainer | ⏳ PROCHAINE ACTION                     |
| 8 inventions (I1-I8)                       | 🔲 À REVERTER (1ère sous-étape de 1B.4) |
| Phase 1C — Infrastructure Refine.dev       | 🔲 À FAIRE (après 1B.4)                 |
| Phases 2-14                                | 🔲 À FAIRE                              |

### 9.2 Git tags de référence

| Tag                      | Contenu                                         |
| ------------------------ | ----------------------------------------------- |
| `pre-frontend-reshaping` | État AVANT toute modification (backup intégral) |
| `post-next16-migration`  | Après Phase 0                                   |

### 9.3 Commits clés Phase 1

| Hash    | Description                                                       |
| ------- | ----------------------------------------------------------------- |
| e056978 | Phase 1A complète — Theming OKLCH + 30 composants + 13 upgradés   |
| 3b2dad1 | Phase 1B.1 — sidebar.tsx + use-mobile.ts                          |
| 9cabf72 | Phase 1B.1-fix — Skeleton Framer Motion régression corrigée       |
| 035f328 | Phase 1B.2 — Layout remplacé (app-sidebar + site-header + layout) |
| 23a2d8b | Phase 1B.3 — Breadcrumbs (À REVERTER — invention)                 |

---

## 10. PROTOCOLE D'EXÉCUTION ET INTERDITS

### 10.1 Workflow par phase

```
1. Backup git (tag) avant chaque phase
2. Prompt ULTRATHINK → Claude Code analyse
3. Claude Code propose plan d'exécution
4. Validation du plan (Claude Senior + Mohamed)
5. Exécution step by step (max 1h par bloc)
6. Vérification terminal après chaque step
7. Build + typecheck + lint après chaque phase
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
- ❌ **Inventer un élément visuel absent de shadcnuikit**
- ❌ Marquer quoi que ce soit comme "optionnel" si c'est dans shadcnuikit
- ❌ Utiliser Kiranism pour le visuel (Kiranism = technique uniquement)
- ❌ "S'inspirer de" au lieu de "copier de" shadcnuikit
- ❌ Écrire du code from scratch quand un repo de référence le fournit
- ❌ Inventer une logique absente des spécifications
- ❌ Grouper plusieurs fixes sans validation individuelle
- ❌ Utiliser `fetch()` direct dans un composant (passer par les hooks Refine)
- ❌ Stocker des données serveur dans useState ou Zustand (utiliser TanStack Query via Refine)
- ❌ Modifier un Server Action pour l'adapter au DataProvider Refine

### 10.3 Ordre de priorité en cas de conflit

1. **Backend fonctionne** (jamais de régression backend)
2. **Auth fonctionne** (jamais de page accessible sans auth)
3. **Données réelles** (pas de mock en production)
4. **Cohérence visuelle** (tout le frontend sur le même système)
5. **Features complètes** (pas de demi-implémentation)

### 10.4 Workflow Prisma (rappel)

SQL manuel dans Supabase → modifier schema.prisma manuellement → `pnpm prisma generate`. **JAMAIS** db push/pull/migrate (cause des drifts).

### 10.5 Admin UUID

`7ad8173c-68c5-41d3-9918-686e4e941cc0` — Provider par défaut, stocké dans adm_settings, **JAMAIS hardcodé**.

### 10.6 Protocole de validation multi-niveaux

Avant toute validation :

1. ✅ Tests locaux passent
2. ✅ Code pushé vers repository
3. ✅ CI run terminé avec succès
4. ✅ Résultats CI = Résultats local
5. ✅ Pas de régression détectée

Si UN SEUL critère manque → NE PAS VALIDER.

### 10.7 Protocole de handoff entre sessions Claude

Chaque session Claude Code dispose de **~30 minutes** de contexte. Pour assurer la continuité :

1. **Début de session :** Lire intégralement ce document de spécification + le statut handoff
2. **Pendant la session :** Documenter chaque action, chaque décision, chaque déviation
3. **Fin de session :** Mettre à jour le document de statut avec l'état exact
4. **Format de reprise :** "Phase X, étape Y, sous-tâche Z. Dernière action : [description]. Prochaine action : [description]."

---

# PARTIE IV — ANNEXES SPÉCIALISÉES

---

## ANNEXE A — INVENTAIRE DETTE FRONTEND (DONNÉES D'AUDIT)

### A.1 God Components identifiés

| Fichier                 | Lignes | useState | Fonctions inline | Custom hooks | Modals inline |
| ----------------------- | ------ | -------- | ---------------- | ------------ | ------------- |
| LeadsPageClient.tsx     | 1 098  | 24       | 73               | 0            | 7             |
| PipelineSettingsTab.tsx | 1 293  | N/A      | N/A              | 0            | N/A           |
| OpportunityDrawer.tsx   | 1 021  | N/A      | N/A              | 0            | N/A           |

### A.2 Tables custom dupliquées

3 implémentations indépendantes de ~700 lignes chacune, totalisant ~2 100 lignes de code dupliqué. Aucune n'utilise TanStack Table.

### A.3 Design system ignoré

- 2 238 occurrences de couleurs Tailwind brutes
- 51 fichiers avec hex hardcodé
- Ratio tokens utilisés vs brut : 1:66
- Le design system FC existe mais est ignoré à 87%

### A.4 Modules sans pages

5 zones déclarées dans la sidebar mais avec 0 page implémentée : Fleet, Drivers, Maintenance, Analytics, Admin.

---

## ANNEXE B — MAPPING DÉTAILLÉ DES 12 PATTERNS

(Voir Section 5.2 pour le mapping complet. Cette annexe sera développée dans les spécifications chapitres avec les screenshots de référence shadcnuikit et le markup exact à reproduire.)

---

## ANNEXE C — ARCHITECTURE REFINE.DEV INTÉGRÉE (SYNTHÈSE)

> **Documents sources complets :** FLEETCORE_REFINE_SPECIFICATION_CCode.md (1 967 lignes) + FLEETCORE_REFINE_SPECIFICATION.md (1 737 lignes) + REFINE_VS_CUSTOM_ANALYSIS.md (762 lignes)

### C.1 Vue d'ensemble de l'intégration

Refine.dev est intégré dans FleetCore comme **couche d'abstraction CRUD invisible**. Le composant `<Refine>` est un Context Provider qui ne rend AUCUN HTML — il fournit les providers (data, auth, RBAC, i18n, notifications, audit) accessibles via des hooks dans tous les composants enfants. Le layout visuel (sidebar, header, etc.) reste celui de shadcnuikit, inchangé.

**Scope :** Le `<Refine>` wrapper est monté UNIQUEMENT dans `app/[locale]/(app)/layout.tsx` — il ne touche PAS les routes auth, publiques, ou marketing.

### C.2 Fichiers d'infrastructure (~545 lignes total)

```
INFRASTRUCTURE (Phase 1C) :
├── lib/providers/refine-data-provider.ts      → ~200-250 lignes
├── lib/providers/refine-mappers.ts            → ~80 lignes
├── lib/providers/refine-auth-provider.ts      → ~60-80 lignes
├── lib/providers/refine-access-control-provider.ts → ~30-40 lignes
├── lib/providers/refine-i18n-provider.ts      → ~15 lignes
├── lib/providers/refine-audit-log-provider.ts → ~30 lignes
├── lib/providers/refine-notification-provider.ts → ~25 lignes
├── lib/providers/refine-resources.ts          → ~50 lignes
├── app/api/auth/check/route.ts                → ~10 lignes
├── app/api/auth/identity/route.ts             → ~15 lignes
└── app/api/auth/can/route.ts                  → ~20 lignes
                                          TOTAL : ~545 lignes
```

### C.3 RESOURCE_CONFIG — Registre central

Le DataProvider utilise un registre `RESOURCE_CONFIG` qui mappe chaque resource Refine vers ses endpoints et Server Actions :

```typescript
const RESOURCE_CONFIG: Record<string, ResourceConfig> = {
  leads: {
    apiBase: "/api/v1/crm/leads",
    actions: {
      create: () => import("@/lib/actions/crm/lead.actions").then(m => m.createLeadAction),
      update: () => import("@/lib/actions/crm/lead.actions").then(m => m.updateLeadAction),
    },
  },
  opportunities: { ... },
  quotes: { ... },
  vehicles: { ... },
  // ... ajouté au fur et à mesure de la migration
};
```

Pour ajouter une nouvelle resource : ajouter une entrée dans RESOURCE_CONFIG + déclarer dans refine-resources.ts. Aucune modification du DataProvider lui-même.

### C.4 70+ Server Actions inventoriés (INCHANGÉS)

Les Server Actions existants (lead.actions.ts, qualify.actions.ts, convert.actions.ts, bulk.actions.ts, opportunity.actions.ts, quote.actions.ts, settings.actions.ts, etc.) sont déjà complets et testés. Le DataProvider les appelle directement via import dynamique pour les mutations, et via les API routes GET pour les lectures.

### C.5 112+ Routes API inventoriées (INCHANGÉES)

Routes API existantes pour les intégrations, webhooks, et opérations spécifiques.

### C.6 Routing

@refinedev/nextjs-router utilise `useRouter`/`usePathname`/`useSearchParams` Next.js natif — **ZÉRO react-router-dom**. Le composant `<Refine>` est scopé au layout dashboard.

### C.7 Hooks Refine — Aide-mémoire

| Hook          | Remplace                           | Usage                                               |
| ------------- | ---------------------------------- | --------------------------------------------------- |
| `useList`     | `fetch GET` + useState + useEffect | Lire une liste avec filtres, pagination, tri        |
| `useOne`      | `fetch GET /[id]` + useState       | Lire un élément unique                              |
| `useCreate`   | `createAction()` + gestion état    | Créer un élément + invalidation cache auto          |
| `useUpdate`   | `updateAction()` + gestion état    | Modifier un élément + optimistic update             |
| `useDelete`   | `deleteAction()` + gestion état    | Supprimer un élément + invalidation cache auto      |
| `useTable`    | useDataTable (Kiranism) + fetch    | Table complète : pagination, tri, filtres, URL sync |
| `useCan`      | `useHasPermission()`               | Vérifier une permission RBAC                        |
| `<CanAccess>` | `{hasPermission && <Component>}`   | Affichage conditionnel par permission               |

### C.8 Checklist pour ajouter une nouvelle resource

```
□ 1.  Créer le dossier features/{module}/{resource}/
□ 2.  Créer types/{resource}.types.ts avec interface TypeScript
□ 3.  Créer schemas/{resource}.schema.ts avec Zod create + update
□ 4.  Ajouter l'entrée dans RESOURCE_CONFIG (refine-data-provider.ts)
□ 5.  Ajouter la resource dans refine-resources.ts
□ 6.  Créer hooks/use-{resource}-table.ts
□ 7.  Créer components/{resource}-columns.tsx
□ 8.  Créer components/{resource}-list-page.tsx
□ 9.  Créer components/{resource}-create-dialog.tsx
□ 10. Créer components/{resource}-edit-drawer.tsx
□ 11. Vérifier : useList retourne les données
□ 12. Vérifier : useCreate fonctionne + cache invalidé
□ 13. Vérifier : useCan masque correctement les boutons
□ 14. Vérifier : syncWithLocation fonctionne (URL ↔ pagination)
□ 15. Supprimer l'ancienne page custom
```

### C.9 Gestion des erreurs

Le DataProvider transforme les erreurs Server Action en `HttpError` Refine :

```typescript
if (!result.success) {
  throw {
    statusCode: 400,
    message: result.error,
    errors: result.validationErrors ?? [],
  };
  // Refine intercepte et affiche via NotificationProvider (→ Sonner toast)
}
```

### C.10 Meta — Communication avancée

Le champ `meta` est le canal pour les cas non-standard (Kanban drag, actions custom) :

```typescript
meta: {
  statusOnly: boolean; // Update status uniquement (Kanban leads)
  stageOnly: boolean; // Update stage uniquement (Kanban opportunities)
  action: string; // Action custom (qualify, convert, bulkAssign, etc.)
  withRelations: boolean; // Include relations dans getOne
}
```

---

## ANNEXE D — AUDIT EMPREINTE CLERK (RÉSUMÉ)

> **Document source complet :** CLERK_AUDIT.md (565 lignes)

### D.1 Distribution des imports

| Type                                          | Fichiers                         |
| --------------------------------------------- | -------------------------------- |
| auth() (Server)                               | 38                               |
| currentUser() (Server)                        | 4                                |
| Hooks client (useOrganization, useAuth, etc.) | 12                               |
| Composants UI (UserButton, SignUp)            | 5                                |
| **Total**                                     | **57 fichiers (9.1% du projet)** |

### D.2 Webhooks

1 endpoint (362 lignes), 6 événements : organization.created/updated/deleted + organizationMembership.created/updated/deleted → sync adm_tenants + clt_members.

### D.3 Pages auth custom headless

6 pages totalisant ~1 547 lignes : login (357L), register (460L), forgot-password (127L), reset-password (301L), select-org (207L), login/tasks (95L).

---

## ANNEXE E — ÉTUDE AUTH ZÉRO LOCK-IN (RÉSUMÉ)

> **Document source complet :** AUTH_ZERO_LOCKIN_STUDY.md (792 lignes)

### E.1 Solutions évaluées

| Solution               | Statut                                | Coût              | Lock-in     | Organizations natif |
| ---------------------- | ------------------------------------- | ----------------- | ----------- | ------------------- |
| Auth.js v5             | ⚠️ DÉPRÉCIÉ (absorbé par Better Auth) | 0€                | —           | Non                 |
| Better Auth            | ✅ Actif, remplaçant Auth.js          | 0€ (MIT)          | Bas         | ✅ Plugin natif     |
| Lucia Auth             | ❌ DÉPRÉCIÉ mars 2025                 | —                 | —           | —                   |
| Supabase Auth (GoTrue) | ✅ Actif                              | 0€ (50K MAU free) | Moyen-élevé | ❌                  |
| Custom JWT             | ✅ Viable                             | 10-20 jours dev   | Zéro        | Manual              |

### E.2 Portabilité FleetCore actuelle

- RLS : 47 policies utilisant `current_setting()` PostgreSQL standard → portable partout
- Code : ZÉRO import @supabase → connexion via DATABASE_URL/DIRECT_URL standard
- Tables auth : déjà existantes dans FleetCore (clt_members, adm_member_sessions, adm_tenants, adm_roles, etc.)

---

## ANNEXE F — LEÇONS APPRISES (ERREURS À NE PAS RÉPÉTER)

### F.1 Path Component Salesforce sur vue Kanban (12/02)

**Erreur :** Claude Code a ajouté un Path Component (barre chevrons progression) AU-DESSUS du Kanban. C'est un doublon — les colonnes Kanban SONT déjà le path.  
**Leçon :** Comprendre le CONTEXTE d'utilisation. Path Component = pages DÉTAIL uniquement.

### F.2 Breadcrumbs dans le header global (13/02)

**Erreur :** Implémenté des breadcrumbs automatiques dans le header. shadcnuikit n'a PAS de breadcrumbs dans le header.  
**Leçon :** TOUJOURS vérifier dans shadcnuikit AVANT d'implémenter. Si ce n'est pas dans le template, on ne l'ajoute pas.

### F.3 SidebarRail non utilisé par shadcnuikit (13/02)

**Erreur :** Ajout de `<SidebarRail />` — le composant existe dans sidebar.tsx mais shadcnuikit ne l'UTILISE PAS.  
**Leçon :** Distinguer "le composant existe" de "le composant est UTILISÉ dans le layout".

### F.4 "Bridge components" au lieu de copie pure (13/02)

**Erreur :** Proposition de créer des couches intermédiaires entre shadcnuikit et FleetCore.  
**Leçon :** On COPIE shadcnuikit et on greffe FleetCore dessus. Pas de couche intermédiaire.

### F.5 Proposer sans vérifier (récurrent)

**Erreur :** Hypothèses sur ce que shadcnuikit fait ou ne fait pas, sans vérification.  
**Leçon :** Chaque affirmation sur shadcnuikit doit être VÉRIFIÉE en ouvrant les fichiers.

### F.6 Interprétation des prérequis au lieu de citation (récurrent)

**Erreur :** Prérequis résumés/paraphrasés au lieu d'être cités mot pour mot.  
**Leçon :** Les prérequis non négociables doivent être reproduits tels quels.

---

## ANNEXE G — GLOSSAIRE ET CONVENTIONS

### G.1 Terminologie

| Terme               | Définition                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **God Component**   | Composant de plus de 500 lignes avec plus de 10 useState et zéro custom hook               |
| **Pattern**         | Template shadcnuikit réutilisable pour N pages FleetCore (ex: PATTERN 1 = DataTable)       |
| **Greffe légitime** | Ajout FleetCore invisible visuellement (auth, i18n, RBAC, feature flags, Refine providers) |
| **Invention**       | Élément visuel absent de shadcnuikit — INTERDIT                                            |
| **Exception FC**    | Déviation validée par le CEO — liste fermée de 7 éléments (S1-S7)                          |
| **Couche 1**        | Rendu visuel = shadcnuikit pixel-perfect                                                   |
| **Couche 2**        | Code technique = Kiranism + shadcn-admin-kit + atomic-crm + Refine patterns DRY            |
| **ULTRATHINK**      | Protocole d'analyse approfondie avant toute action                                         |
| **Resource**        | Entité CRUD Refine — "leads", "opportunities", "vehicles" etc.                             |
| **DataProvider**    | Adapter entre hooks Refine et Server Actions/API FleetCore                                 |
| **RESOURCE_CONFIG** | Registre central mappant chaque resource vers ses endpoints                                |
| **Server state**    | Données API/DB gérées par TanStack Query via Refine — JAMAIS dans useState/Zustand         |
| **UI state**        | État interface (sidebar, mode vue, sélection) — Zustand                                    |
| **URL state**       | Filtres, pagination, tri — nuqs + syncWithLocation                                         |

### G.2 Conventions de nommage

| Élément         | Convention                            | Exemple                                      |
| --------------- | ------------------------------------- | -------------------------------------------- |
| Composants      | kebab-case fichier, PascalCase export | `lead-drawer.tsx` → `LeadDrawer`             |
| Hooks           | use-kebab-case                        | `use-leads-table.ts`                         |
| Stores Zustand  | kebab-case-store                      | `leads-store.ts`                             |
| Features        | `features/{module}/{resource}/`       | `features/crm/leads/components/`             |
| Types           | PascalCase                            | `LeadFormData`                               |
| Server Actions  | kebab-case.actions                    | `lead.actions.ts`                            |
| Resource Refine | camelCase pluriel                     | `"leads"`, `"opportunities"`                 |
| Provider Refine | camelCase + Provider                  | `fleetcoreDataProvider`, `clerkAuthProvider` |
| Colonnes        | {resource}Columns                     | `leadsColumns`, `quotesColumns`              |

### G.3 Stack technique résumé

| Package                      | Version    | Notes                                       |
| ---------------------------- | ---------- | ------------------------------------------- |
| Next.js                      | 16.1.6     | Migré Phase 0                               |
| React                        | 19         | —                                           |
| TypeScript                   | 5.3+       | Strict mode                                 |
| Tailwind CSS                 | 4.1        | OKLCH tokens                                |
| Prisma ORM                   | 6.18.0     | 6 812L schema                               |
| @clerk/nextjs                | 6.37.3     | Multi-tenant                                |
| @sentry/nextjs               | 10.38.0    | Monitoring                                  |
| react-i18next                | 16.0.0     | EN/FR                                       |
| framer-motion                | 12.23.19   | Animations                                  |
| next-themes                  | 0.4.6      | Dark mode                                   |
| **À installer**              |            |                                             |
| @tanstack/react-table        | ^8.21      | DataTable                                   |
| nuqs                         | ^2.4       | URL state                                   |
| zustand                      | ^5.0       | UI state management                         |
| kbar                         | latest     | Command palette                             |
| cmdk                         | ^1.1       | Command component                           |
| **@refinedev/core**          | **^5.0.9** | **Couche CRUD — DataProvider, hooks, RBAC** |
| **@refinedev/nextjs-router** | **^7.0.4** | **Router provider Next.js natif**           |
| **@tanstack/react-query**    | **^5.81**  | **Cache, invalidation, retry (via Refine)** |

---

## DOCUMENTS DE RÉFÉRENCE

| Document                                    | Contenu                                                                             | Lignes    |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | --------- |
| FLEETCORE_FRONTEND_RESHAPING_PLAN_V2.md     | Plan de refonte complet 14 phases                                                   | 1 139     |
| FLEETCORE_RESHAPING_STATUS_HANDOFF.md       | Document de continuité pour reprise de session                                      | 623       |
| **FLEETCORE_REFINE_SPECIFICATION_CCode.md** | **Spécification Refine par Claude Code (DataProvider, providers, migration)**       | **1 967** |
| **FLEETCORE_REFINE_SPECIFICATION.md**       | **Spécification Refine par Claude Senior (contrat technique, patterns, checklist)** | **1 737** |
| AUTH_ARCHITECTURE_STUDY.md                  | Étude architecture auth centralisée                                                 | 1 031     |
| AUTH_ZERO_LOCKIN_STUDY.md                   | Étude solutions auth alternatives                                                   | 792       |
| CLERK_AUDIT.md                              | Audit empreinte Clerk                                                               | 565       |
| REFINE_VS_CUSTOM_ANALYSIS.md                | Analyse comparative Refine vs custom (décision prise : Refine)                      | 762       |
| FLEETCORE_UX_REFONTE_STATUS_COMPLET.md      | Historique tentative Velzon                                                         | Projet    |
| FLEETCORE_CRM_SPECIFICATION_V6.6.1          | Spécifications CRM complètes                                                        | Projet    |
| FLEETCORE_REGLES_DE_GESTION.md              | Règles métier FleetCore                                                             | Projet    |
| SUPABASE_SCHEMA_REFERENCE.md                | Référence tables/colonnes                                                           | Projet    |

---

> **Ce document est la source de vérité unique pour la refonte frontend FleetCore.**  
> **Tout intervenant doit le lire intégralement avant toute action.**  
> **Aucune déviance par rapport à ce document n'est acceptée sans validation explicite du CEO.**

---

**Document créé le :** 14 Février 2026  
**Version :** 2.0 (intégration Refine.dev validée)  
**Prêt pour :** Génération des spécifications détaillées par chapitre  
**Prochaine action :** Finaliser Phase 1B.4 → Phase 1C (Infrastructure Refine) → Phase 2 (Leads pilote Refine)
