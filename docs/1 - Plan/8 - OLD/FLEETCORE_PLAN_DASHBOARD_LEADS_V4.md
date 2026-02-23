# FLEETCORE — PLAN D'EXÉCUTION DASHBOARD + LEADS CRM

# VERSION 4.0 — PLAN DÉFINITIF MIS À JOUR

> **Date :** 20 Février 2026  
> **Mise à jour :** Insertion migration Cal.com → Google Calendar en Step 2.4 + décalage steps  
> **Scope :** Dashboard CRM + Module Leads complet + Migration Wizard Public  
> **Cible visuelle :** shadcnuikit pixel-perfect  
> **Cible fonctionnelle :** atomic-crm (TOUTES les fonctionnalités, adaptées FleetCore)  
> **Cible technique :** Kiranism (hooks, stores, URL state) + shadcn-admin-kit (composants CRM headless)  
> **Principe :** Chaque step = livrable visible dans le navigateur, vérifiable en 30 secondes  
> **Remplace :** FLEETCORE_PLAN_DASHBOARD_LEADS_V3.md (V3.1 du 16 Février 2026)

---

## CHANGELOG V3 → V4

| Élément                     | V3                               | V4                                                      | Raison                                                                                              |
| --------------------------- | -------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Step 2.4**                | Fiche détail Lead                | **Migration Cal.com → Google Calendar (Wizard Public)** | Décision CEO : retirer la dépendance propriétaire Cal.com AVANT d'avancer sur les features avancées |
| **Steps 2.5-2.12**          | 2.4-2.11 (ancienne numérotation) | Décalés de +1                                           | Insertion du wizard à 2.4                                                                           |
| **Total steps**             | 17                               | **18**                                                  | +1 step wizard migration                                                                            |
| **Durée Étape 2**           | ~7 jours                         | **~10 jours**                                           | +3 jours migration Cal.com → Google Calendar                                                        |
| **Dépendance propriétaire** | Cal.com actif                    | **Cal.com supprimé**                                    | Chaque dépendance propriétaire réduit la valorisation                                               |

---

## DÉCISION ARCHITECTURALE — SUPPRESSION CAL.COM

**Problème :** Cal.com est une dépendance propriétaire (embed React, webhooks, emails, URLs hardcodées) qui :

- Réduit la valorisation de FleetCore
- Crée un point de défaillance externe non contrôlé
- Coûte potentiellement en abonnement pour les features avancées

**Solution :** Migration complète vers Google Calendar API (gratuit, natif, contrôlé).

**Prérequis CEO confirmé :** Compte Google Workspace disponible → 2 booking pages (EN/FR) possibles, zéro limitation.

**Inventaire Cal.com dans FleetCore (8 points de contact) :**

| #   | Composant                  | Localisation                   | Ce qu'il fait                                                  |
| --- | -------------------------- | ------------------------------ | -------------------------------------------------------------- |
| 1   | Wizard Public Step 2       | `@calcom/embed-react`          | Embed inline Cal.com, 2 event types (EN ID 14425, FR ID 84663) |
| 2   | Webhook endpoint           | `/api/crm/webhooks/calcom`     | Gère BOOKING_CREATED / RESCHEDULED / CANCELLED, HMAC-SHA256    |
| 3   | Reschedule page            | `/book-demo/reschedule`        | Iframe Cal.com avec token court ou calcom_uid                  |
| 4   | Email J-1 anti no-show     | Templates email                | Boutons Confirm/Reschedule → URLs Cal.com                      |
| 5   | Email booking confirmation | Envoyé après webhook           | Contient des références Cal.com                                |
| 6   | Database                   | `crm_leads.booking_calcom_uid` | Champ stockant l'UID Cal.com                                   |
| 7   | Config                     | `CALCOM_WEBHOOK_SECRET`        | Variable d'environnement                                       |
| 8   | Package npm                | `@calcom/embed-react`          | Dépendance package.json                                        |

---

## STRUCTURE ROUTES CRM — DÉCISION VALIDÉE

```
/crm                    → Dashboard CRM (KPI temps réel, snapshot quotidien)
/crm/leads              → Module Leads (table/kanban/filters)
/crm/leads/[id]         → Fiche détail lead
/crm/opportunities      → Module Opportunities (futur)
/crm/opportunities/[id] → Fiche détail opportunity (futur)
/crm/quotes             → Module Quotes (futur)
/crm/reports            → Reports centralisé cross-module (analyse leads + opps + quotes)
/crm/settings           → Settings CRM (pipelines, scoring, etc.)
```

**Distinction fondamentale :**

- **Dashboard** (`/crm`) = temps réel, KPI visuels, snapshot instantané, usage quotidien
- **Reports** (`/crm/reports`) = analyse approfondie, historique, tendances, exportable, cross-module

**Fait existant :** Un dashboard existe actuellement à `/crm/leads/reports` (mauvaise route, mauvais nom). Il doit être déplacé vers `/crm`, reskinnté visuellement sur shadcnuikit, et enrichi avec les indicateurs de shadcnuikit.

---

## ÉTAT D'AVANCEMENT FACTUEL (point de départ)

Source : FLEETCORE_EXECUTION_PLAN_REMEDIE_V2.md + sessions précédentes

| Élément                                                                                       | Statut          |
| --------------------------------------------------------------------------------------------- | --------------- |
| Phase 0 — Next.js 16                                                                          | ✅ FAIT         |
| Phase 1A — Theming OKLCH + composants shadcn/ui                                               | ✅ FAIT         |
| Phase 1B — Layout shadcnuikit (sidebar, header, PageContainer)                                | ✅ FAIT         |
| Phase 1B inventions I1-I8                                                                     | ✅ NETTOYÉ      |
| Phase 1C — Infrastructure Refine.dev (8 providers + 3 routes API + wrapper)                   | ✅ FAIT         |
| Phase 2 Steps 2.1-2.4 (ancien plan) — DataTable infra + features/crm/leads/ + données réelles | ✅ FAIT         |
| Phase 2 Step 2.5 (ancien plan) — Audit visuel 4 sources                                       | 🔲 NON FAIT     |
| Dashboard CRM (existe mais mauvaise route + pas aligné shadcnuikit)                           | ⚠️ À RESKINNER  |
| Leads Notes/Tasks/Tags/Activity                                                               | 🔲 N'EXISTE PAS |
| Leads Import/Export/Bulk                                                                      | 🔲 N'EXISTE PAS |
| Reports centralisé                                                                            | 🔲 N'EXISTE PAS |
| Cal.com — embed wizard + webhooks + reschedule + emails                                       | ⚠️ À SUPPRIMER  |

---

## ARCHITECTURE DU PLAN

```
ÉTAPE 1 — DASHBOARD CRM (reskinner + déplacer vers /crm)
    │
    ├── 1.1  Audit dashboard existant + audit shadcnuikit     → comparaison factuelle
    ├── 1.2  Restructuration route + shell shadcnuikit        → /crm affiche le dashboard reskinné
    ├── 1.3  KPI Cards alignées shadcnuikit                   → cards identiques au template
    ├── 1.4  Graphiques alignés shadcnuikit                   → charts identiques au template
    ├── 1.5  Widgets complémentaires shadcnuikit              → tout ce que shadcnuikit a, FleetCore l'a
    └── 1.6  Nettoyage ancienne route + validation            → /crm/leads/reports redirigé ou supprimé

ÉTAPE 2 — LEADS MODULE (vrai CRM complet)
    │
    ├── 2.1  Alignement visuel DataTable sur shadcnuikit      → le tableau ressemble au template
    ├── 2.2  Sidebar Filters permanents                       → filtres latéraux visibles
    ├── 2.3  Kanban Pipeline drag & drop                      → vue pipeline comme atomic-crm
    ├── 2.4  ★ WIZARD PUBLIC : Cal.com → Google Calendar      → suppression dépendance propriétaire
    ├── 2.5  Fiche détail Lead (page complète)                → profile page shadcnuikit
    ├── 2.6  Create Sheet + Edit Sheet                        → overlays création/édition
    ├── 2.7  Notes sur Lead (markdown + pièces jointes)       → onglet notes dans la fiche
    ├── 2.8  Tasks sur Lead (call/email/meeting)              → onglet tâches dans la fiche
    ├── 2.9  Tags colorés                                     → tags visibles partout
    ├── 2.10 Activity Timeline                                → historique complet dans la fiche
    ├── 2.11 Import CSV + Export + Bulk Actions               → outils opérationnels
    └── 2.12 Remplacement page officielle + nettoyage         → God Component supprimé
```

**Total : 18 steps. Chaque step = ouvre navigateur → vois le résultat → valide ou corrige.**

---

# ÉTAPE 1 — DASHBOARD CRM

> **Objectif :** `/crm` affiche un dashboard professionnel calqué sur shadcnuikit, alimenté par les données FleetCore existantes.
> **Point de départ :** Un dashboard existe à `/crm/leads/reports` — il sera analysé, déplacé, et reskinné.
> **Référence visuelle UNIQUE :** shadcnuikit `/dashboards/crm` (les indicateurs de shadcnuikit = la cible)
> **Référence fonctionnelle :** atomic-crm Dashboard (patterns techniques)
> **Durée estimée :** 2-3 jours

---

## Step 1.1 — Audit comparatif : dashboard existant vs shadcnuikit

### Ce que le CEO reçoit

Un rapport factuel côte à côte : ce que FleetCore a actuellement à `/crm/leads/reports` vs ce que shadcnuikit montre dans son dashboard CRM. Chaque widget, chaque card, chaque graphique listé avec les écarts.

### Prompt Claude Code

```
MISSION : AUDIT COMPARATIF — DASHBOARD EXISTANT vs SHADCNUIKIT CRM DASHBOARD

CONTEXTE :
FleetCore a un dashboard CRM existant à la route /crm/leads/reports.
Il doit être reskinné pour correspondre pixel-perfect à shadcnuikit.
AVANT de toucher quoi que ce soit, tu dois comprendre l'écart exact.

PHASE A — ANALYSE DU DASHBOARD EXISTANT

1. Trouve la page serveur :
   ls app/[locale]/(app)/crm/leads/reports/
   → Identifie le fichier page.tsx et le composant client qu'il importe

2. Analyse le composant client :
   → Liste CHAQUE widget/section visible (cards, graphiques, tables, listes)
   → Pour chaque widget, note :
     a. Nom/titre
     b. Type (KPI card, chart, table, list)
     c. Données affichées (quelles colonnes/tables Prisma)
     d. Comment les données sont chargées (Server Action, fetch, hook)
     e. Structure HTML + classes CSS

3. Résumé : combien de widgets, quels indicateurs, quel layout

PHASE B — ANALYSE DU DASHBOARD SHADCNUIKIT (CIBLE)

OUVRE OBLIGATOIREMENT :
/Users/mohamedfodil/Documents/references/shadcnuikit/

1. Cherche le dashboard CRM (probablement /dashboards/crm, /pages/crm, ou /apps/crm)
2. Pour CHAQUE widget/composant dans cette page, note :
   a. Nom du composant (ex: TargetCard, TotalCustomersCard, LeadBySourceCard)
   b. Type (KPI card avec trend arrow, donut chart, bar chart, table, list)
   c. Données affichées (titre, sous-titre, valeur, pourcentage, icône)
   d. Structure HTML + classes CSS exactes
   e. Composants shadcn/ui utilisés (Card, Badge, etc.)

PHASE C — TABLEAU COMPARATIF

| # | Widget shadcnuikit (CIBLE) | Équivalent FleetCore | ÉCART | Action requise |
|---|---------------------------|---------------------|-------|----------------|
| 1 | ... | ... | ... | Reskinner / Créer / Supprimer |

PHASE D — ANALYSE TECHNIQUE COMPLÉMENTAIRE

Ouvre aussi :
- atomic-crm : /Users/mohamedfodil/Documents/references/atomic-crm/
  → Dashboard patterns (DashboardStepper, data loading)
- Kiranism : /Users/mohamedfodil/Documents/references/kiranism/
  → Dashboard patterns si disponibles

FORMAT : Rapport complet en markdown. AUCUNE modification de code.
RÉSULTAT ATTENDU : Je sais exactement quoi garder, quoi reskinner, quoi ajouter, quoi supprimer.
```

### Contrôle CEO

- [ ] Je reçois un tableau comparatif clair
- [ ] Chaque widget shadcnuikit est listé
- [ ] Chaque widget FleetCore existant est listé
- [ ] Les écarts sont identifiés précisément
- [ ] Les actions sont catégorisées (reskinner / créer / supprimer)

---

## Step 1.2 — Restructuration route + Shell page shadcnuikit

### Ce que le CEO voit dans le navigateur

J'ouvre `/crm` et je vois le dashboard. La route a changé. Le layout de la page (grille, spacing, header) est identique à shadcnuikit. Le contenu peut encore être les anciens widgets (le reskin détaillé vient dans les steps suivants), mais la structure de page est shadcnuikit.

### Prompt Claude Code

```
MISSION : RESTRUCTURATION ROUTE + SHELL PAGE DASHBOARD CRM

PRÉREQUIS : Step 1.1 validé (audit comparatif disponible).

CONTEXTE :
Le dashboard CRM est actuellement à /crm/leads/reports (mauvaise route, mauvais nom).
Il doit être à /crm (route racine du module CRM).
La structure de page doit correspondre au layout shadcnuikit dashboard CRM.

SOURCES À CONSULTER (OBLIGATOIRE) :
1. shadcnuikit → page dashboard CRM → structure HTML, grille, spacing, classes CSS
2. FleetCore → page existante /crm/leads/reports → composant actuel

ACTIONS :
1. Créer app/[locale]/(app)/crm/page.tsx → page serveur qui affiche le dashboard
2. Créer features/crm/dashboard/components/crm-dashboard-page.tsx
   → Layout grille COPIÉ de shadcnuikit (pas "inspiré")
   → Importer les widgets existants dans la nouvelle grille
   → PageContainer avec titre "CRM Dashboard"

3. Décider quoi faire de l'ancienne route /crm/leads/reports :
   → Option A : redirect vers /crm
   → Option B : garder pour les reports détaillés (futur /crm/reports)
   → POSER LA QUESTION au CEO

4. Mettre à jour la navigation sidebar si nécessaire :
   → "CRM" dans la sidebar → pointe vers /crm (dashboard)
   → Sous-items : Dashboard, Leads, Opportunities, Reports, Settings

PROPOSE LE PLAN. NE PAS EXÉCUTER avant validation.

INTERDITS :
- NE PAS supprimer les widgets existants (ils seront reskinnés dans les steps suivants)
- NE PAS modifier de Server Action
- NE PAS casser la page actuelle avant que la nouvelle fonctionne
```

### Contrôle visuel CEO (30 secondes)

- [ ] `/crm` affiche le dashboard (plus besoin d'aller à /crm/leads/reports)
- [ ] Layout/grille ressemble à shadcnuikit (spacing, colonnes)
- [ ] Les widgets existants sont présents (même si pas encore reskinnés)
- [ ] La sidebar CRM est organisée (Dashboard, Leads, etc.)
- [ ] Dark mode fonctionne

---

## Step 1.3 — KPI Cards alignées shadcnuikit

### Ce que le CEO voit dans le navigateur

Les KPI cards en haut du dashboard sont visuellement identiques aux cards de shadcnuikit (TargetCard, TotalCustomersCard, etc.). Même structure HTML, mêmes classes CSS, mêmes icônes, mêmes trend arrows. Les données viennent de FleetCore. Les indicateurs sont ceux de shadcnuikit — si shadcnuikit montre "Total Customers", "Total Deals", "Total Revenue", "Conversion Rate", alors FleetCore montre exactement les mêmes, alimentés par crm_leads, crm_opportunities, etc.

### Prompt Claude Code

```
MISSION : RESKIN KPI CARDS — ALIGNEMENT PIXEL-PERFECT SHADCNUIKIT

PRÉREQUIS : Step 1.2 validé (route /crm fonctionne, shell en place).

CIBLE VISUELLE — OBLIGATOIRE :
1. shadcnuikit → dashboard CRM → OUVRE les composants KPI cards
   → Pour CHAQUE card, COPIE :
     a. Structure HTML exacte (div, classes Tailwind)
     b. Icône utilisée (Lucide icon name)
     c. Layout interne (titre en haut, valeur, trend arrow, sous-texte)
     d. Couleurs (background, texte, icône, trend positif/négatif)

LES INDICATEURS DE SHADCNUIKIT = LA CIBLE.
Si shadcnuikit a 4 cards avec "Total Customers", "Total Revenue", "Total Deals", "Conversion Rate" →
FleetCore aura exactement les mêmes 4 cards.

CIBLE TECHNIQUE :
2. Kiranism → patterns KPI card si disponibles
3. atomic-crm → DashboardStepper patterns

PRODUCTION :
1. features/crm/dashboard/components/kpi-cards.tsx
   → Composant KPI card COPIÉ de shadcnuikit (pas réinventé)
   → Chaque card = composant avec props (title, value, trend, icon)

2. Alimenter chaque card avec données FleetCore :
   → Données via Refine ou API route existante
   → Pour chaque indicateur, VÉRIFIE dans Prisma que la table/colonne existe
   → Si un calcul métier est nécessaire (ex: taux conversion), LISTE
     les hypothèses et POSE LA QUESTION au CEO

QUESTIONS MÉTIER PROBABLES :
- Comment mapper les indicateurs shadcnuikit aux données FleetCore ?
  (ex: "Total Customers" = count crm_leads ? count tenants ? autre ?)
- Comment calculer le trend (% vs mois précédent) ?
- Quels filtres date par défaut (30 derniers jours ? mois en cours ?)

PROPOSE LE PLAN avec le mapping indicateur → donnée FleetCore.
NE PAS CODER avant validation du mapping par le CEO.
```

### Contrôle visuel CEO (30 secondes)

- [ ] KPI cards en haut du dashboard
- [ ] Visuellement identiques à shadcnuikit (côte à côte → pareil)
- [ ] Chiffres réels (pas zéro, pas N/A, pas placeholder)
- [ ] Trend arrows fonctionnels (↑ vert ou ↓ rouge)
- [ ] Icônes correctes
- [ ] Dark mode fonctionne

---

## Step 1.4 — Graphiques alignés shadcnuikit

### Ce que le CEO voit dans le navigateur

Les graphiques du dashboard sont visuellement identiques à ceux de shadcnuikit. Si shadcnuikit a un donut chart "Leads by Source", un bar chart "Pipeline", un area chart "Revenue over time" → FleetCore a exactement les mêmes, avec les mêmes couleurs, tooltips, légendes. Recharts v3.

### Prompt Claude Code

```
MISSION : RESKIN GRAPHIQUES — ALIGNEMENT PIXEL-PERFECT SHADCNUIKIT

PRÉREQUIS : Step 1.3 validé (KPI cards conformes).

CIBLE VISUELLE — OBLIGATOIRE :
1. shadcnuikit → dashboard CRM → OUVRE les composants graphiques
   → Pour CHAQUE graphique, note :
     a. Type (donut/pie, bar, area, line, stacked bar, funnel)
     b. Composant Recharts utilisé (PieChart, BarChart, AreaChart, etc.)
     c. Configuration exacte (colors, dataKey, tooltip, legend)
     d. Structure wrapper HTML + classes CSS
     e. Titre, sous-titre, légende

CIBLE TECHNIQUE :
2. Kiranism → AreaGraph, BarGraph, PieGraph patterns
3. atomic-crm → DealsChart, RevenueDashboard

PRODUCTION :
Pour chaque graphique shadcnuikit :
1. COPIER la structure visuelle exacte
2. Remplacer les données statiques par données FleetCore
3. Fichiers dans features/crm/dashboard/components/

MAPPING DONNÉES :
Pour chaque graphique, indiquer :
- Quel tableau FleetCore → quel graphique shadcnuikit
- Quelle requête de données (API route, Refine hook, agrégation)
- Si l'agrégation n'existe pas côté backend → SIGNALER

PROPOSE LE PLAN. NE PAS CODER avant validation.
```

### Contrôle visuel CEO (30 secondes)

- [ ] Graphiques visuellement identiques à shadcnuikit
- [ ] Couleurs, tooltips, légendes correspondent
- [ ] Données réelles (pas placeholder)
- [ ] Responsive (redimensionner → graphiques s'adaptent)
- [ ] Dark mode fonctionne

---

## Step 1.5 — Widgets complémentaires shadcnuikit

### Ce que le CEO voit dans le navigateur

TOUT ce qui est dans le dashboard CRM de shadcnuikit est dans FleetCore. Si shadcnuikit a un widget "Recent Tasks", "Recent Activity", "Sales Pipeline progress", "Top Deals", "Leaderboard" → FleetCore l'a aussi, même style. Rien de plus, rien de moins que shadcnuikit.

### Prompt Claude Code

```
MISSION : WIDGETS COMPLÉMENTAIRES — TOUT CE QUE SHADCNUIKIT A

PRÉREQUIS : Steps 1.3 et 1.4 validés (KPI + graphiques conformes).

CONTEXTE :
Les KPI cards et graphiques sont faits. Maintenant, TOUS les autres widgets
du dashboard CRM shadcnuikit doivent être présents.

CIBLE VISUELLE — OBLIGATOIRE :
1. shadcnuikit → dashboard CRM
   → LISTE tout ce qui reste (widgets que tu n'as pas encore fait)
   → Exemples possibles : Recent Tasks, Activity Feed, Pipeline Stages,
     Top Leads/Deals, Leaderboard, Calendar preview, etc.

RÈGLE : Si shadcnuikit l'a → FleetCore l'a.
RÈGLE : Si shadcnuikit ne l'a pas → FleetCore ne l'a pas.

POUR CHAQUE WIDGET RESTANT :
1. COPIER la structure visuelle shadcnuikit
2. Alimenter avec données FleetCore
3. Si les données n'existent pas → SIGNALER (ne pas inventer)

PRODUCTION : Fichiers dans features/crm/dashboard/components/
PROPOSE LE PLAN. NE PAS CODER avant validation.
```

### Contrôle visuel CEO (30 secondes)

- [ ] Le dashboard complet = shadcnuikit dashboard CRM (comparaison côte à côte)
- [ ] Aucun widget manquant
- [ ] Aucun widget inventé (pas dans shadcnuikit = pas dans FleetCore)
- [ ] Tout avec données réelles

---

## Step 1.6 — Nettoyage ancienne route + Validation finale

### Ce que le CEO voit dans le navigateur

`/crm` = dashboard complet, professionnel, données réelles, shadcnuikit pixel-perfect. L'ancienne route `/crm/leads/reports` est soit redirigée vers `/crm`, soit réservée pour le futur module Reports centralisé. Aucun résidu, aucun doublon.

### Prompt Claude Code

```
MISSION : NETTOYAGE + VALIDATION FINALE DASHBOARD CRM

PRÉREQUIS : Steps 1.1 à 1.5 validés.

ACTIONS :
1. Vérifier que /crm fonctionne parfaitement (toutes les données chargent)
2. Ancienne route /crm/leads/reports :
   → Si le CEO a décidé redirect → implémenter redirect
   → Si le CEO a décidé garder pour reports → renommer/préparer
3. Navigation sidebar : vérifier que "CRM" → /crm (dashboard)
4. Vérification complète :
   - pnpm typecheck → 0 erreurs
   - pnpm build → succès
   - pnpm lint → 0 erreurs
   - git diff lib/actions/ → 0 Server Action modifié
   - Dark mode → OK
   - Responsive → OK

Si tout passe :
5. git commit -m "Dashboard CRM: reskinné shadcnuikit + route /crm"
6. git push
7. git tag post-dashboard-crm
8. git push --tags
```

### Contrôle visuel CEO (30 secondes)

- [ ] `/crm` = dashboard CRM complet shadcnuikit
- [ ] Ancienne route gérée
- [ ] Sidebar CRM organisée
- [ ] Build + typecheck passent
- [ ] **VALIDATION ÉTAPE 1 COMPLÈTE**

### Critères de validation Étape 1 — DASHBOARD

| #   | Vérification               | Comment vérifier              |
| --- | -------------------------- | ----------------------------- |
| V1  | Audit comparatif produit   | Rapport markdown disponible   |
| V2  | Route /crm fonctionne      | Naviguer → dashboard visible  |
| V3  | KPI cards = shadcnuikit    | Comparaison côte à côte       |
| V4  | Graphiques = shadcnuikit   | Comparaison côte à côte       |
| V5  | Tous widgets = shadcnuikit | Rien manquant, rien inventé   |
| V6  | Données réelles partout    | Chiffres, pas placeholders    |
| V7  | Dark mode                  | Toggle → tout lisible         |
| V8  | Responsive                 | Mobile/tablet → layout adapté |
| V9  | Build + typecheck + lint   | 0 erreurs                     |
| V10 | 0 Server Action modifié    | git diff lib/actions/ → vide  |
| V11 | Ancienne route gérée       | Redirect ou réservée reports  |
| V12 | Tag git                    | post-dashboard-crm            |

---

# ÉTAPE 2 — MODULE LEADS COMPLET

> **Objectif :** Le module Leads est un vrai CRM — pas un tableau avec des colonnes.
> **Référence visuelle :** shadcnuikit `/pages/users` (table) + `/pages/profile` (détail)
> **Référence fonctionnelle :** atomic-crm complet (liste, kanban, fiche, notes, tasks, tags, timeline, import, export)
> **Durée estimée :** 8-10 jours (dont ~3 jours migration wizard)

---

## Step 2.1 — Alignement visuel DataTable sur shadcnuikit

### Ce que le CEO voit dans le navigateur

J'ouvre `/crm/leads`. Le tableau existant (84 colonnes, 12 features TanStack) est visuellement aligné sur shadcnuikit `/pages/users`. Page header, toolbar, table headers, rows, pagination — tout correspond pixel-perfect au template.

### Prompt Claude Code

```
MISSION : ALIGNEMENT VISUEL DATATABLE LEADS SUR SHADCNUIKIT + MIGRATION REFINE

CONTEXTE :
La page leads a un DataTable fonctionnel (84 colonnes, 12 features TanStack).
MAIS il n'a jamais été comparé visuellement à shadcnuikit.
ET il utilise des hooks custom au lieu de Refine useTable.
Cette step corrige les deux en même temps.

PHASE A — AUDIT VISUEL (ne modifie rien)

OUVRE ces fichiers OBLIGATOIREMENT :

SOURCE 1 — shadcnuikit (CIBLE)
/Users/mohamedfodil/Documents/references/shadcnuikit/
→ Cherche /pages/users ou toute page avec une table/liste
→ Pour CHAQUE élément, note la structure EXACTE :
  a. Page header : titre, sous-titre, bouton(s) — classes, structure
  b. Toolbar : search input, filter buttons, view toggle — classes, position
  c. Table : header row style, data row style, hover, alternance
  d. Pagination : position, composants, style
  e. Actions column : dropdown, boutons inline
  f. Badges/statuts : couleurs, formes
  g. Empty state si visible

SOURCE 2 — shadcn-admin-kit
/Users/mohamedfodil/Documents/references/shadcn-admin-kit/
→ Cherche CustomerList ou équivalent CRM list
→ Note : SidebarFilters, ToggleFilterButton, ColumnsButton, BulkActionsToolbar

SOURCE 3 — atomic-crm
/Users/mohamedfodil/Documents/references/atomic-crm/
→ Cherche ContactList ou équivalent
→ Note : colonnes affichées, badges, actions

SOURCE 4 — FleetCore actuel
→ features/crm/leads/components/leads-list-page.tsx
→ components/ui/table/data-table.tsx

PRODUIT un tableau comparatif :
| Élément | shadcnuikit (CIBLE) | FleetCore (ACTUEL) | ÉCART | CORRECTION |

PHASE B — CORRECTIONS + MIGRATION REFINE
Corrige chaque écart ET migre vers Refine useTable.
PROPOSE LE PLAN avant d'exécuter.
```

### Contrôle visuel CEO (30 secondes)

- [ ] Le tableau leads ressemble à la page users de shadcnuikit
- [ ] Page header avec titre + bouton "Add Lead"
- [ ] Toolbar cohérente
- [ ] Rows avec hover, badges statut colorés
- [ ] Pagination même style
- [ ] Données réelles, tri et filtres fonctionnent

---

## Step 2.2 — Sidebar Filters permanents

### Ce que le CEO voit dans le navigateur

À gauche du tableau, une sidebar de filtres permanente. Filtres visuels par statut, source, score, assigned_to, date. Pattern shadcn-admin-kit SidebarFilters. Temps réel + URL sync.

### Prompt Claude Code

```
MISSION : SIDEBAR FILTERS PERMANENTS — LEADS

SOURCES À CONSULTER (OBLIGATOIRE) :
1. shadcn-admin-kit → SidebarFilters, ToggleFilterButton, FilterCategory
2. shadcnuikit → filtres page users si disponibles
3. atomic-crm → filtres ContactList
4. FleetCore → colonnes crm_leads filtrables (vérifier Prisma)

PRODUCTION :
- features/crm/leads/components/leads-sidebar-filters.tsx
  → URL state nuqs, synchronisé Refine

PROPOSE LE PLAN. QUESTIONS CEO si doute sur colonnes à exposer.
```

### Contrôle visuel CEO (30 secondes)

- [ ] Sidebar visible à gauche
- [ ] Filtres cliquables, mise à jour instantanée
- [ ] URL change → refresh garde les filtres

---

## Step 2.3 — Kanban Pipeline drag & drop

### Ce que le CEO voit dans le navigateur

Toggle Table/Kanban. Vue Kanban = colonnes par statut, compteurs, cards leads, drag & drop → statut change. Pattern atomic-crm + visuel shadcnuikit.

### Prompt Claude Code

```
MISSION : VUE KANBAN LEADS — PIPELINE DRAG & DROP

SOURCES À CONSULTER (OBLIGATOIRE) :
1. shadcnuikit → /apps/kanban → structure visuelle
2. atomic-crm → Pipeline → DragDropContext, colonnes, cards, optimistic
3. Kiranism → @dnd-kit patterns, Zustand store
4. FleetCore → crm_leads statuts (vérifier Prisma)

PRODUCTION :
1. features/crm/leads/components/leads-kanban.tsx
   → Refine useList + useUpdate optimistic
2. Toggle Table/Kanban → Zustand viewMode

QUESTIONS MÉTIER : statuts = colonnes ? ordre ?
PROPOSE LE PLAN.
```

### Contrôle visuel CEO (30 secondes)

- [ ] Toggle Table/Kanban fonctionnel
- [ ] Colonnes par statut avec compteurs
- [ ] Cards avec nom, company, score
- [ ] Drag & drop → statut change
- [ ] Retour Table → statut mis à jour

---

## Step 2.4 — ★ WIZARD PUBLIC : Migration Cal.com → Google Calendar

### Ce que le CEO voit dans le navigateur

Le wizard public (acquisition de prospects) utilise Google Calendar Appointment Scheduling au lieu de Cal.com. Le booking crée un lead avec statut "demo" et un créneau confirmé. Les webhooks Google remplacent les webhooks Cal.com. Les emails de confirmation et rappel J-1 pointent vers des URLs FleetCore (pas Cal.com). La dépendance `@calcom/embed-react` est supprimée.

### Sous-steps détaillées

#### 2.4.1 — Infrastructure Google Calendar API

**Action manuelle CEO (30 min) :**

1. Créer un projet Google Cloud
2. Activer Calendar API
3. Créer un Service Account
4. Partager le calendrier FleetCore avec le Service Account
5. Stocker les credentials dans `.env`

**Prompt Claude Code :**

```
MISSION : INFRASTRUCTURE GOOGLE CALENDAR API

CONTEXTE :
FleetCore migre de Cal.com vers Google Calendar API.
Le CEO a préparé les credentials Google Cloud (Service Account + Calendar partagé).
Tu dois créer le wrapper API côté FleetCore.

PRÉREQUIS :
- Variables d'environnement disponibles :
  GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
- Package à installer : googleapis (npm)

PRODUCTION :
1. Installe googleapis :
   pnpm add googleapis

2. Crée lib/services/google-calendar.service.ts avec 4 méthodes :
   - getFreeBusy(start, end) → créneaux occupés
   - createEvent(summary, description, start, end, attendees, metadata) → event créé
   - updateEvent(eventId, updates) → event modifié
   - deleteEvent(eventId) → event supprimé

3. Crée app/api/google-calendar/[action]/route.ts
   → Route interne protégée (pas publique)
   → Actions : free-busy, create, update, delete
   → Validation Zod des paramètres

ATTENTION :
- Le Service Account utilise JWT auth, PAS OAuth user consent
- Les méthodes doivent gérer les erreurs Google API proprement
- Chaque méthode doit logger dans adm_audit_logs

ANALYSE d'abord la documentation googleapis npm pour les patterns Calendar API.
PROPOSE LE PLAN.
```

#### 2.4.2 — Webhook Google Calendar (remplace /api/crm/webhooks/calcom)

**Prompt Claude Code :**

```
MISSION : WEBHOOK GOOGLE CALENDAR — REMPLACE WEBHOOKS CAL.COM

CONTEXTE :
Cal.com envoyait des webhooks explicites (BOOKING_CREATED, BOOKING_RESCHEDULED,
BOOKING_CANCELLED). Google Calendar API utilise "watch" channels qui envoient
une notification POST quand QUELQUE CHOSE change sur le calendrier.

L'endpoint actuel à remplacer : /api/crm/webhooks/calcom
Le nouvel endpoint : /api/crm/webhooks/google-calendar

ANALYSE PRÉALABLE :
1. Ouvre /api/crm/webhooks/calcom et analyse :
   - Comment il gère BOOKING_CREATED (lead → status demo, store booking_calcom_uid + booking_slot_at)
   - Comment il gère BOOKING_RESCHEDULED (update booking_slot_at)
   - Comment il gère BOOKING_CANCELLED (lead → status lost)
   - La vérification HMAC-SHA256 via x-cal-signature-256
   - Le format des payloads Cal.com

2. Recherche la documentation Google Calendar API "watch" :
   - Comment setup un watch channel
   - Quel POST est envoyé (headers X-Goog-Channel-ID, X-Goog-Resource-State)
   - Comment fetch l'event qui a changé
   - Comment distinguer : event créé vs modifié vs supprimé

PRODUCTION :
1. app/api/crm/webhooks/google-calendar/route.ts
   → Reçoit la notification Google
   → Fetch l'event détaillé via Calendar API
   → Détermine le type de changement (créé/modifié/supprimé)
   → Met à jour le lead correspondant :
     - Event créé avec attendee = prospect email → lead status "demo" + booking_slot_at + booking_google_event_id
     - Event modifié (nouvelle date) → update booking_slot_at
     - Event supprimé → lead status "lost"

2. lib/services/google-calendar-watch.service.ts
   → Méthode pour setup/renouveler le watch channel
   → Les watch channels expirent → mécanisme de renouvellement

QUESTION MÉTIER : Comment relier un event Google Calendar à un lead ?
- Option A : metadata dans l'event (extended properties)
- Option B : email du prospect dans les attendees → match crm_leads.email
- PROPOSE les deux options avec avantages/inconvénients

PROPOSE LE PLAN. NE PAS EXÉCUTER.
```

#### 2.4.3 — Remplacer Embed Cal.com dans Wizard Public

**Prompt Claude Code :**

```
MISSION : REMPLACER L'EMBED CAL.COM DANS LE WIZARD PUBLIC PAR GOOGLE APPOINTMENT SCHEDULING

CONTEXTE :
Le wizard d'acquisition FleetCore a une Step 2 où le prospect réserve une démo.
Actuellement : embed @calcom/embed-react (Cal.com), 2 event types (EN ID 14425, FR ID 84663).
Instance : https://app.cal.eu, layout month_view.

CIBLE : Google Appointment Scheduling embed.
Le CEO a un compte Google Workspace → 2 booking pages possibles (EN + FR).

ANALYSE PRÉALABLE :
1. Trouve le composant wizard Step 2 :
   - Cherche les imports de @calcom/embed-react
   - Analyse comment le leadId est passé au composant Cal.com
   - Analyse comment la locale (EN/FR) détermine quel event type afficher

2. Analyse les options d'embed Google Appointment Scheduling :
   - iframe inline embed
   - popup embed
   - Quels paramètres sont passables (pré-remplir email, nom, etc.)

PRODUCTION :
1. Remplacer le composant Cal.com par un embed Google Appointment Scheduling
   → 2 URLs de booking : une EN, une FR (configurées par le CEO dans Google Calendar)
   → Sélection automatique basée sur la locale du wizard
   → Passer les infos du lead (email, nom) si possible via query params

2. Gérer le passage du leadId pour que le webhook (Step 2.4.2) puisse relier le booking au lead
   → Investiguer : extended properties, custom fields, query params, attendee email matching

ATTENTION :
- Le wizard est une page PUBLIQUE → pas d'auth
- L'embed doit être responsive
- La transition entre Step 1 (formulaire) et Step 2 (booking) doit rester fluide

PROPOSE LE PLAN. NE PAS EXÉCUTER.
```

#### 2.4.4 — Reschedule + Emails (remplace URLs Cal.com)

**Prompt Claude Code :**

```
MISSION : RECONSTRUIRE LE RESCHEDULE + METTRE À JOUR LES EMAILS

CONTEXTE :
Actuellement :
- /book-demo/reschedule = iframe Cal.com reschedule
- Email J-1 anti no-show = boutons Confirm/Reschedule → URLs Cal.com
- Email booking confirmation = envoyé après webhook BOOKING_CREATED

CIBLE : Tout pointe vers des pages FleetCore internes, plus aucune URL Cal.com.

ANALYSE PRÉALABLE :
1. Ouvre la page /book-demo/reschedule → analyse le composant
2. Ouvre les templates email J-1 et confirmation → identifie toutes les URLs Cal.com
3. Vérifie la logique d'accès : token court ? calcom_uid ? comment sécuriser ?

PRODUCTION :
1. Reconstruire /book-demo/reschedule SANS Cal.com :
   → Affiche les créneaux disponibles via getFreeBusy()
   → Le prospect choisit un nouveau créneau
   → updateEvent() modifie le booking dans Google Calendar
   → Lead mis à jour automatiquement via webhook

2. Mettre à jour les templates email :
   → Email J-1 : boutons Confirm (lien direct) / Reschedule (→ nouvelle page reschedule FleetCore)
   → Email confirmation : texte + lien vers page de reschedule si besoin
   → AUCUNE URL Cal.com restante

3. Sécurisation :
   → Token court (JWT ou UUID éphémère) pour accéder à la page reschedule sans auth
   → Expiration du token

PROPOSE LE PLAN. NE PAS EXÉCUTER.
```

#### 2.4.5 — Nettoyage Cal.com + Migration DB

**Prompt Claude Code :**

```
MISSION : NETTOYAGE COMPLET CAL.COM + MIGRATION BASE DE DONNÉES

PRÉREQUIS : Steps 2.4.1 à 2.4.4 validés et fonctionnels.

ACTIONS DE SUPPRESSION :
1. Supprime @calcom/embed-react du package.json :
   pnpm remove @calcom/embed-react

2. Supprime l'endpoint webhook Cal.com :
   → Supprime app/api/crm/webhooks/calcom/route.ts (ou son équivalent)
   → Vérifie avec grep : grep -rn "calcom" src/ → LISTE tous les fichiers restants

3. Supprime la variable d'environnement :
   → CALCOM_WEBHOOK_SECRET → retirer de .env, .env.example, documentation

4. Migration base de données :
   → ALTER TABLE crm_leads : booking_calcom_uid → booking_google_event_id
   → SI des bookings Cal.com existent : décider du traitement (nullifier ou migrer)
   → QUESTION CEO : y a-t-il des bookings Cal.com actifs à migrer ?

5. Nettoyage grep final :
   grep -rn "cal.com\|calcom\|cal\.eu\|@calcom" src/ → DOIT retourner 0 résultats

VALIDATION :
- pnpm typecheck → 0 erreurs
- pnpm build → succès
- pnpm lint → 0 erreurs
- grep calcom → 0 résultats
- Test E2E : wizard public → booking → webhook → lead status demo
- Test E2E : reschedule → nouvelle date → lead mis à jour
- Test E2E : annulation → lead status lost
- git diff lib/actions/ → vérifier que seules les modifications liées au booking sont touchées

Si tout passe :
- git commit -m "Step 2.4: Migration Cal.com → Google Calendar complète"
- git push
```

### Contrôle visuel CEO (30 secondes) — Step 2.4 complète

- [ ] Wizard public → Step 2 = Google Appointment Scheduling (pas Cal.com)
- [ ] Booking crée un lead en statut "demo" avec booking_slot_at
- [ ] Reschedule fonctionne → nouvelle date confirmée
- [ ] Email J-1 → boutons pointent vers FleetCore (pas Cal.com)
- [ ] `grep -rn "calcom" src/` → 0 résultats
- [ ] `@calcom/embed-react` absent de package.json
- [ ] Build + typecheck passent

### Estimation Step 2.4

| Sous-step                        | Durée                   |
| -------------------------------- | ----------------------- |
| 2.4.1 — Infrastructure API       | 0.5 jour (+ 30 min CEO) |
| 2.4.2 — Webhook Google           | 0.5 jour                |
| 2.4.3 — Embed Wizard             | 0.5 jour                |
| 2.4.4 — Reschedule + Emails      | 0.5 jour                |
| 2.4.5 — Nettoyage + Migration DB | 0.5 jour                |
| **Total 2.4**                    | **~2.5-3 jours**        |

---

## Step 2.5 — Fiche détail Lead (page complète)

### Ce que le CEO voit dans le navigateur

`/crm/leads/[id]` = page profil shadcnuikit. Header, sections info, actions, tabs pour notes/tasks/timeline.

### Prompt Claude Code

```
MISSION : FICHE DÉTAIL LEAD — PAGE PROFIL

SOURCES À CONSULTER (OBLIGATOIRE) :
1. shadcnuikit → /pages/profile, /pages/profile-v2
2. atomic-crm → ContactShow
3. FleetCore → Prisma crm_leads TOUTES colonnes → LISTER → CEO décide

PRODUCTION :
1. app/[locale]/(app)/crm/leads/[id]/page.tsx
2. features/crm/leads/components/lead-detail-page.tsx
   → Refine useOne, sections, actions, tabs préparés

ATTENTION : LISTER tous les champs → CEO décide lesquels afficher.
PROPOSE LE PLAN.
```

### Contrôle visuel CEO (30 secondes)

- [ ] `/crm/leads/[id]` = page profil shadcnuikit
- [ ] Header avec nom, company, statut, score
- [ ] Sections d'informations
- [ ] Boutons d'action
- [ ] Données réelles

---

## Step 2.6 — Create Sheet + Edit Sheet

### Ce que le CEO voit dans le navigateur

"Add Lead" → Sheet overlay. Formulaire + validation Zod. Submit → lead dans la liste. Edit → Sheet pré-rempli.

### Prompt Claude Code

```
MISSION : CREATE SHEET + EDIT SHEET — LEADS

SOURCES À CONSULTER (OBLIGATOIRE) :
1. shadcnuikit → Sheet/Drawer
2. atomic-crm → ContactCreate, ContactEdit
3. shadcn-admin-kit → SimpleForm
4. FleetCore → LeadFormModal actuel

PRODUCTION :
1. features/crm/leads/components/lead-create-sheet.tsx → Refine useCreate
2. features/crm/leads/components/lead-edit-sheet.tsx → Refine useOne + useUpdate

QUESTIONS : champs create (minimum) vs edit (complet) → CEO décide.
PROPOSE LE PLAN.
```

### Contrôle visuel CEO (30 secondes)

- [ ] "Add Lead" → Sheet overlay
- [ ] Formulaire, validation, submit → lead ajouté
- [ ] Edit → Sheet pré-rempli → sauvegarder → changement visible

---

## Step 2.7 — Notes sur Lead

### Ce que le CEO voit dans le navigateur

Fiche lead → onglet "Notes". Liste notes, "Add Note", markdown.

### Prompt Claude Code

```
MISSION : SYSTÈME DE NOTES — LEADS

SOURCES À CONSULTER (OBLIGATOIRE) :
1. atomic-crm → ContactNote, NoteCreate, NoteList
2. shadcnuikit → Notes pattern
3. FleetCore → Prisma : table crm_notes ? SI NON → signaler SQL → CEO

PRODUCTION : features/crm/leads/components/lead-notes-tab.tsx
→ Refine useList + useCreate
PROPOSE LE PLAN.
```

### Contrôle visuel CEO (30 secondes)

- [ ] Onglet "Notes" visible
- [ ] Ajouter note → visible dans la liste

---

## Step 2.8 — Tasks sur Lead

### Ce que le CEO voit dans le navigateur

Fiche lead → onglet "Tasks". Tâches typées (call/email/meeting), datées, assignées.

### Prompt Claude Code

```
MISSION : SYSTÈME DE TÂCHES — LEADS

SOURCES À CONSULTER (OBLIGATOIRE) :
1. atomic-crm → Task model, TaskCreate, TaskList
2. shadcnuikit → Tasks app
3. FleetCore → Prisma : table crm_tasks ? SI NON → signaler SQL → CEO

PRODUCTION : features/crm/leads/components/lead-tasks-tab.tsx
PROPOSE LE PLAN.
```

### Contrôle visuel CEO (30 secondes)

- [ ] Onglet "Tasks" visible
- [ ] Tâches avec type, date, statut
- [ ] Marquer "done" → statut change

---

## Step 2.9 — Tags colorés

### Ce que le CEO voit dans le navigateur

Tags colorés sur chaque lead (table, kanban, fiche). Ajout/retrait.

### Prompt Claude Code

```
MISSION : SYSTÈME DE TAGS COLORÉS — LEADS

SOURCES À CONSULTER (OBLIGATOIRE) :
1. atomic-crm → Tag model, TagChip
2. FleetCore → Prisma : table tags + lead_tags ? SI NON → signaler

PRODUCTION :
- features/crm/shared/components/tag-chip.tsx (réutilisable)
- Tag selector sur create/edit sheet
- Tags affichés table + kanban + detail

PROPOSE LE PLAN.
```

### Contrôle visuel CEO (30 secondes)

- [ ] Tags colorés visibles partout
- [ ] Ajout/retrait fonctionnel

---

## Step 2.10 — Activity Timeline

### Ce que le CEO voit dans le navigateur

Fiche lead → onglet "Activity". Timeline chronologique des actions.

### Prompt Claude Code

```
MISSION : ACTIVITY TIMELINE — LEADS

SOURCES À CONSULTER (OBLIGATOIRE) :
1. atomic-crm → ActivityLogIterator
2. shadcnuikit → Timeline component
3. FleetCore → table crm_activities ? SI NON → signaler

PRODUCTION : features/crm/leads/components/lead-activity-timeline.tsx
→ Refine useList, trié created_at desc
PROPOSE LE PLAN.
```

### Contrôle visuel CEO (30 secondes)

- [ ] Timeline visible avec entrées chronologiques

---

## Step 2.11 — Import CSV + Export + Bulk Actions

### Ce que le CEO voit dans le navigateur

Import CSV (preview + mapping), Export CSV/Excel, Sélection multiple + bulk actions.

### Prompt Claude Code

```
MISSION : IMPORT CSV + EXPORT + BULK ACTIONS — LEADS

SOURCES À CONSULTER (OBLIGATOIRE) :
1. atomic-crm → useContactImport, Papa Parse
2. shadcn-admin-kit → ExportButton, BulkActionsToolbar
3. FleetCore → export API existante ?

PRODUCTION :
1. features/crm/leads/components/lead-import-dialog.tsx
2. features/crm/leads/components/lead-export-button.tsx
3. features/crm/leads/components/leads-bulk-toolbar.tsx

PROPOSE LE PLAN.
```

### Contrôle visuel CEO (30 secondes)

- [ ] Import CSV → preview → import fonctionne
- [ ] Export → fichier téléchargé
- [ ] Sélection multiple → bulk action fonctionne

---

## Step 2.12 — Remplacement page officielle + Nettoyage

### Ce que le CEO voit dans le navigateur

`/crm/leads` = module complet. God Component supprimé. Tout fonctionne.

### Prompt Claude Code

```
MISSION : REMPLACEMENT PAGE OFFICIELLE + NETTOYAGE FINAL

PRÉREQUIS : Steps 2.1-2.11 validées.

ACTIONS :
1. Pages app pointent vers le nouveau module
2. Supprimer LeadsPageClient.tsx (1098L)
   → grep -rn "LeadsPageClient" → 0 résultats
3. Supprimer anciens composants non utilisés
4. Supprimer pages /dev/ temporaires

VALIDATION :
- pnpm typecheck → 0 erreurs
- pnpm build → succès
- pnpm lint → 0 erreurs
- git diff lib/actions/ → 0 Server Action modifié

Si tout passe :
- git commit + git tag post-leads-crm-complete + git push --tags
```

### Contrôle visuel CEO (30 secondes)

- [ ] `/crm` → dashboard shadcnuikit
- [ ] `/crm/leads` → module complet
- [ ] `/crm/leads/[id]` → fiche détail complète
- [ ] Aucune page cassée

### Critères de validation Étape 2 — MODULE LEADS COMPLET

| #   | Vérification                           | Comment vérifier                  |
| --- | -------------------------------------- | --------------------------------- |
| V1  | DataTable = shadcnuikit                | Comparaison visuelle              |
| V2  | Sidebar filters                        | Filtrer → résultats corrects      |
| V3  | Kanban drag & drop                     | Déplacer → statut change          |
| V4  | Wizard Google Calendar                 | Booking → lead status demo        |
| V5  | Cal.com supprimé                       | grep calcom → 0 résultats         |
| V6  | Fiche détail                           | /crm/leads/[id] → toutes sections |
| V7  | Create + Edit Sheet                    | Créer/modifier lead               |
| V8  | Notes                                  | Ajouter → visible                 |
| V9  | Tasks                                  | Ajouter → visible                 |
| V10 | Tags colorés                           | Table + kanban + détail           |
| V11 | Activity Timeline                      | Historique chronologique          |
| V12 | Import CSV                             | Importer → leads créés            |
| V13 | Export                                 | CSV/Excel téléchargé              |
| V14 | Bulk Actions                           | Sélection → action groupée        |
| V15 | God Component supprimé                 | grep LeadsPageClient → 0          |
| V16 | Build + typecheck + lint               | 0 erreurs                         |
| V17 | 0 Server Action modifié (hors booking) | git diff lib/actions/ → vérifié   |
| V18 | Tag git                                | post-leads-crm-complete           |

---

## RÉCAPITULATIF GLOBAL

| Step      | Description                        | Livrable visible                  | Durée            |
| --------- | ---------------------------------- | --------------------------------- | ---------------- |
| **1.1**   | Audit comparatif dashboard         | Rapport d'écarts                  | 0.5j             |
| **1.2**   | Route /crm + shell shadcnuikit     | Dashboard sur /crm                | 0.5j             |
| **1.3**   | KPI Cards reskin                   | Cards = shadcnuikit               | 0.5j             |
| **1.4**   | Graphiques reskin                  | Charts = shadcnuikit              | 0.5j             |
| **1.5**   | Widgets complémentaires            | Dashboard complet                 | 0.5j             |
| **1.6**   | Nettoyage + tag                    | Route propre, tag git             | 0.5j             |
|           |                                    | **→ DASHBOARD CRM = SHADCNUIKIT** | **~2-3j**        |
| **2.1**   | Alignement visuel DataTable        | Tableau = shadcnuikit             | 1j               |
| **2.2**   | Sidebar Filters                    | Filtres latéraux permanents       | 0.5j             |
| **2.3**   | Kanban Pipeline                    | Drag & drop par statut            | 1j               |
| **2.4**   | ★ Wizard Cal.com → Google Calendar | Dépendance propriétaire supprimée | 2.5-3j           |
| **2.5**   | Fiche détail Lead                  | Page profil complète              | 1j               |
| **2.6**   | Create + Edit Sheet                | Formulaires overlay               | 0.5j             |
| **2.7**   | Notes                              | Sur chaque lead                   | 0.5j             |
| **2.8**   | Tasks                              | Call/email/meeting                | 0.5j             |
| **2.9**   | Tags colorés                       | Tags partout                      | 0.5j             |
| **2.10**  | Activity Timeline                  | Historique par lead               | 0.5j             |
| **2.11**  | Import/Export/Bulk                 | Outils opérationnels              | 1j               |
| **2.12**  | Remplacement + Nettoyage           | God Component supprimé            | 0.5j             |
|           |                                    | **→ MODULE LEADS CRM COMPLET**    | **~9-10j**       |
| **TOTAL** |                                    |                                   | **~11-13 jours** |

---

## QUESTIONS MÉTIER EN SUSPENS

| #   | Question                                                                         | Step    | Impact              |
| --- | -------------------------------------------------------------------------------- | ------- | ------------------- |
| Q1  | Mapping indicateurs shadcnuikit → données FleetCore                              | 1.3     | KPI cards           |
| Q2  | Comment calculer trends (% vs mois précédent)                                    | 1.3     | Trend arrows        |
| Q3  | Que faire de l'ancienne route /crm/leads/reports                                 | 1.6     | Redirect ou reports |
| Q4  | Tables crm_notes, crm_tasks, crm_tags existent-elles ?                           | 2.7-2.9 | Backend             |
| Q5  | Quels champs au create vs edit pour les leads ?                                  | 2.6     | Formulaires         |
| Q6  | Quels statuts = colonnes Kanban ? (ordre)                                        | 2.3     | Structure Kanban    |
| Q7  | Quels champs afficher dans la fiche détail ?                                     | 2.5     | Sections profil     |
| Q8  | URLs des 2 booking pages Google (EN + FR)                                        | 2.4.3   | Embed wizard        |
| Q9  | Y a-t-il des bookings Cal.com actifs à migrer ?                                  | 2.4.5   | Migration DB        |
| Q10 | Comment relier un event Google Calendar à un lead ? (metadata vs email matching) | 2.4.2   | Webhook logic       |

---

## PROTOCOLE DE DÉVIATION

1. **STOP** — ne pas improviser
2. **DOCUMENTER** — écrire dans ce document : quel step, quel problème
3. **PROPOSER** — alternative avec justification
4. **VALIDER** — CEO valide
5. **METTRE À JOUR** — ce document est mis à jour
6. **REPRENDRE** — continuer avec le plan corrigé

---

## ORDRE D'EXÉCUTION — PRIORITÉ CEO

```
PRIORITÉ 1 : Finir Step 2.3 (Kanban Pipeline)
    ↓
PRIORITÉ 2 : Step 2.4 (Migration Cal.com → Google Calendar)
    ↓
PRIORITÉ 3 : Steps 2.5-2.12 (features avancées Leads)
    ↓
NOTE : Étape 1 (Dashboard) peut être intercalée selon décision CEO
```

Le CEO a explicitement demandé : **"finir le 2.3 avant, puis on verra le wizard en 2.4"**.

---

> **Ce plan remplace FLEETCORE_PLAN_DASHBOARD_LEADS_V3.md**
> **18 steps, chaque step = livrable visible.**
> **Validation visuelle CEO après chaque step.**
> **Zéro plomberie invisible.**
> **Les indicateurs de shadcnuikit = la cible.**
> **Le dashboard existant est reskinné, pas recréé.**
> **Cal.com est supprimé, Google Calendar le remplace.**
