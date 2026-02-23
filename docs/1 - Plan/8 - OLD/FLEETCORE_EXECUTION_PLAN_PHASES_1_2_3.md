# FLEETCORE — PLAN D'EXÉCUTION ULTRA-DÉTAILLÉ

# PHASES 1 (RESTANTES), 2 ET 3

> **Version :** 1.0
> **Date :** 14 Février 2026
> **Document de référence :** FLEETCORE_FRONTEND_RESHAPING_SPECIFICATION_V2.md (BOUSSOLE)
> **Statut :** EN ATTENTE D'EXÉCUTION
> **Auteur :** Architecture Claude × Mohamed (CEO/CTO)
> **Règle cardinale :** ZÉRO déviation sans mise à jour de la Specification V2 → Vx

---

## TABLE DES MATIÈRES

1. [AUDIT DE DÉMARRAGE OBLIGATOIRE](#1-audit-de-démarrage-obligatoire)
2. [PHASE 1B.4 — Finalisation Layout](#2-phase-1b4--finalisation-layout)
3. [PHASE 1C — Infrastructure Refine.dev](#3-phase-1c--infrastructure-refinedev)
4. [PHASE 2 — DataTable + Leads Refine Pilote](#4-phase-2--datatable--leads-refine-pilote)
5. [PHASE 3 — Refactoring God Components + Zustand UI State](#5-phase-3--refactoring-god-components--zustand-ui-state)
6. [MATRICE DE DÉPENDANCES INTER-PHASES](#6-matrice-de-dépendances-inter-phases)
7. [PROTOCOLE DE DÉVIATION](#7-protocole-de-déviation)
8. [RÉCAPITULATIF CALENDRIER](#8-récapitulatif-calendrier)

---

# 1. AUDIT DE DÉMARRAGE OBLIGATOIRE

> **Objectif :** Valider l'état réel du codebase AVANT toute nouvelle action. Aucune supposition. Vérification factuelle uniquement.

## 1.0 Prompt Claude Code — Audit de démarrage

```
MISSION : AUDIT DE DÉMARRAGE — Vérification de l'état du frontend FleetCore

CONTEXTE :
Tu travailles sur le projet FleetCore, un SaaS B2B multi-tenant de gestion de flottes.
Le frontend est en cours de refonte (reshaping). Les phases 0, 1A, 1B.1, 1B.2, 1B.2r sont
documentées comme complétées. Phase 1B.3 (breadcrumbs) a été annulée car c'était une
invention non-conforme au template shadcnuikit.

OBJECTIF :
Avant de reprendre le travail, tu dois auditer l'état réel du codebase pour confirmer
ou infirmer chaque point documenté. Aucune supposition autorisée — chaque point doit
être vérifié dans le code, le terminal, ou git.

VÉRIFICATIONS À EFFECTUER (dans cet ordre) :

BLOC A — Santé générale
A1. Exécute `pnpm build` et rapporte le résultat exact (succès ou erreurs).
A2. Exécute `pnpm typecheck` (ou `npx tsc --noEmit`) et rapporte le résultat exact.
A3. Exécute `pnpm lint` et rapporte le résultat exact.
A4. Vérifie la version de Next.js dans package.json (attendu : 16.x).
A5. Vérifie que les packages @tanstack/react-query, @refinedev/core NE SONT PAS
    encore installés (ils viendront en Phase 1C).

BLOC B — Phase 0 (Next.js 16 migration)
B1. Confirme le tag git `pre-frontend-reshaping` : `git tag -l "pre-frontend-reshaping"`.
B2. Confirme le tag git `post-next16-migration` : `git tag -l "post-next16-migration"`.
B3. Vérifie `next.config.*` — est-ce un .ts (ESM) ou .mjs ? Next.js 16 utilise next.config.ts.
B4. Vérifie que eslint.config.* est en flat config (pas .eslintrc).

BLOC C — Phase 1A (Theming OKLCH)
C1. Vérifie que `app/themes.css` ou `styles/themes.css` existe et contient des tokens OKLCH
    (cherche `oklch` dans le fichier).
C2. Vérifie que `globals.css` contient des tokens OKLCH (pas hex pour les tokens principaux).
C3. Vérifie que les anciens tokens FC hex `--fc-*` n'existent PLUS dans globals.css.
C4. Compte le nombre de composants dans `components/ui/` et liste-les.

BLOC D — Phase 1B (Layout)
D1. Vérifie que `components/ui/sidebar.tsx` existe et compte ses lignes (~686L attendu).
D2. Vérifie que `components/layout/app-sidebar.tsx` existe — c'est le remplaçant shadcnuikit.
D3. Vérifie que `components/layout/site-header.tsx` (ou équivalent header) existe.
D4. Vérifie le layout `app/[locale]/(app)/layout.tsx` — contient-il SidebarProvider ?

BLOC E — Inventions à reverter (I1-I8)
E1. Vérifie si `components/layout/header/breadcrumbs.tsx` EXISTE encore (invention I1).
E2. Vérifie si `lib/hooks/useBreadcrumbs.ts` EXISTE encore (invention I2).
E3. Vérifie si `lib/contexts/BreadcrumbContext.tsx` EXISTE encore (invention I3).
E4. Vérifie si `site-header.tsx` contient un import ou usage de `<Breadcrumbs` (invention I4).
E5. Vérifie si le layout contient `BreadcrumbProvider` (invention I5).
E6. Vérifie si `LeadDetailHeader.tsx` contient `BreadcrumbOverride` (invention I6).
E7. Vérifie si `settings/crm/layout.tsx` a un breadcrumb per-page OU si c'est supprimé (invention I7).
E8. Vérifie si `app-sidebar.tsx` contient `<SidebarRail` (invention I8).

BLOC F — Git status
F1. `git status` — y a-t-il des fichiers non commités ?
F2. `git log --oneline -10` — liste les 10 derniers commits.
F3. `git branch` — quelle branche est active ?

FORMAT DE RÉPONSE ATTENDU :
Pour chaque point (A1-F3), réponds avec :
- ✅ CONFIRMÉ : [détail factuel]
- ❌ INFIRMÉ : [détail factuel + ce qui est trouvé à la place]
- ⚠️ PARTIEL : [détail de ce qui manque]

Puis conclus par un VERDICT GLOBAL :
- Liste de tout ce qui est conforme
- Liste de tout ce qui dévie
- Recommandation : peut-on passer à Phase 1B.4 ou y a-t-il un prérequis manquant ?

INTERDITS :
- Ne modifie RIEN. C'est un audit READ-ONLY.
- Ne suppose rien. Si un fichier n'existe pas, dis-le.
- Ne minimise rien. Chaque écart est important.
```

## 1.1 Critères de passage

| Critère                      | Requis pour passer à 1B.4                     |
| ---------------------------- | --------------------------------------------- |
| Build réussi                 | ✅ OBLIGATOIRE                                |
| Typecheck réussi             | ✅ OBLIGATOIRE                                |
| Lint réussi                  | ✅ OBLIGATOIRE (warnings acceptés, 0 erreur)  |
| Next.js 16.x confirmé        | ✅ OBLIGATOIRE                                |
| Tags git présents            | ✅ OBLIGATOIRE                                |
| Tokens OKLCH en place        | ✅ OBLIGATOIRE                                |
| sidebar.tsx installé         | ✅ OBLIGATOIRE                                |
| Layout shadcnuikit en place  | ✅ OBLIGATOIRE                                |
| Inventions I1-I8 identifiées | ✅ OBLIGATOIRE (pas nécessairement revertées) |
| Refine NON installé          | ✅ OBLIGATOIRE (viendra en Phase 1C)          |

**Si un critère OBLIGATOIRE échoue → STOP. Corriger AVANT de passer à 1B.4.**

## 1.2 Actions correctives possibles

| Écart détecté              | Action corrective                      | Durée max |
| -------------------------- | -------------------------------------- | --------- |
| Build échoue               | Analyser et fixer les erreurs de build | 30 min    |
| Typecheck erreurs          | Fixer les erreurs TypeScript           | 30 min    |
| Tag git manquant           | Recréer le tag au commit approprié     | 5 min     |
| Tokens hex encore présents | Nécessite retour Phase 1A — ESCALADE   | À évaluer |
| sidebar.tsx absent         | Nécessite retour Phase 1B.1 — ESCALADE | À évaluer |

---

# 2. PHASE 1B.4 — Finalisation Layout

> **Objectif :** Terminer Phase 1B en revertant les 8 inventions et en créant PageContainer.
> **Durée estimée :** 0.5-1 jour
> **Prérequis :** Audit de démarrage validé (Section 1)
> **Livrable :** Layout 100% conforme shadcnuikit + PageContainer DRY

---

## 2.1 STEP 1 — Revert inventions I1-I7 (Breadcrumb system)

### 2.1.0 Prompt Claude Code — Step 1

```
MISSION : REVERT DES INVENTIONS I1-I7 — Suppression du breadcrumb system inventé

CONTEXTE :
Le projet FleetCore a un header qui DOIT être identique à shadcnuikit :
  [☰] | [Search... ⌘K] [🔔] [🌙] [User]

Lors d'une phase précédente, un système de breadcrumbs a été inventé et ajouté
dans le header global. Ce système N'EXISTE PAS dans shadcnuikit. Il doit être
supprimé intégralement.

shadcnuikit gère les breadcrumbs PER-PAGE (comme dans file-manager), JAMAIS dans
le header global. Les breadcrumbs per-page viendront quand on construira les pages.

INVENTIONS À REVERTER :

I1. components/layout/header/breadcrumbs.tsx → SUPPRIMER le fichier entier
I2. lib/hooks/useBreadcrumbs.ts → SUPPRIMER le fichier entier
I3. lib/contexts/BreadcrumbContext.tsx → SUPPRIMER le fichier entier
I4. site-header.tsx → RETIRER l'import Breadcrumbs + retirer <Breadcrumbs /> du JSX
I5. layout.tsx (app/[locale]/(app)/) → RETIRER l'import BreadcrumbProvider
    + retirer le wrapper <BreadcrumbProvider>
I6. LeadDetailHeader.tsx → RETIRER <BreadcrumbOverride>, si un breadcrumb per-page
    existait AVANT l'invention (vérifier dans git l'état pré-invention), le RESTAURER
I7. settings/crm/layout.tsx → Si un breadcrumb per-page a été supprimé au profit
    du système inventé, le RESTAURER (vérifier git)

Pour I6 et I7, tu dois :
1. D'abord vérifier dans git (commit 23a2d8b ou avant) quel était l'état ORIGINAL
2. Si un breadcrumb per-page existait → le restaurer
3. Si rien n'existait → ne rien ajouter

IMPORTANT pour les clés i18n :
- Vérifie dans common.json (en + fr) si des clés `breadcrumbs.*` ont été ajoutées
- Si oui, les retirer

APPROCHE DEMANDÉE :
1. Analyse d'abord chaque fichier cité pour confirmer que l'invention existe
2. Vérifie dans git l'état pré-invention pour I6 et I7
3. Propose un plan de suppression fichier par fichier
4. NE PAS exécuter avant validation du plan

VALIDATION APRÈS EXÉCUTION :
- pnpm typecheck → 0 erreurs
- pnpm build → succès
- grep -r "Breadcrumbs\|useBreadcrumbs\|BreadcrumbContext\|BreadcrumbProvider\|BreadcrumbOverride" src/ app/ components/ lib/ → AUCUN résultat
- Le header ne contient plus de breadcrumbs (uniquement Search, notifications, theme, user)
```

### 2.1.1 Fichiers impactés

| #   | Fichier                                      | Action                                                                | Risque                             |
| --- | -------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| I1  | `components/layout/header/breadcrumbs.tsx`   | DELETE fichier                                                        | 0 — fichier inventé                |
| I2  | `lib/hooks/useBreadcrumbs.ts`                | DELETE fichier                                                        | 0 — fichier inventé                |
| I3  | `lib/contexts/BreadcrumbContext.tsx`         | DELETE fichier                                                        | 0 — fichier inventé                |
| I4  | `components/layout/site-header.tsx`          | EDIT — retirer import + `<Breadcrumbs />`                             | Faible — retrait de 2-3 lignes     |
| I5  | `app/[locale]/(app)/layout.tsx`              | EDIT — retirer import + wrapper `<BreadcrumbProvider>`                | Moyen — touche au layout principal |
| I6  | `components/crm/leads/LeadDetailHeader.tsx`  | EDIT — retirer `<BreadcrumbOverride>`, restaurer per-page si existait | Moyen — vérification git requise   |
| I7  | `app/[locale]/(app)/crm/settings/layout.tsx` | EDIT — restaurer breadcrumb per-page si existait                      | Moyen — vérification git requise   |
| —   | `lib/i18n/locales/{en,fr}/common.json`       | EDIT — retirer clés `breadcrumbs.*`                                   | Faible                             |

### 2.1.2 Critères de validation Step 1

| #   | Vérification                | Commande                                                                                                                       |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| V1  | Fichiers inventés supprimés | `ls components/layout/header/breadcrumbs.tsx` → not found                                                                      |
| V2  | Aucune référence restante   | `grep -rn "Breadcrumb" src/ app/ components/ lib/` → 0 résultats (sauf composant ui/breadcrumb.tsx de shadcn qui est légitime) |
| V3  | Build passe                 | `pnpm build` → succès                                                                                                          |
| V4  | Typecheck passe             | `pnpm typecheck` → 0 erreurs                                                                                                   |
| V5  | Lint passe                  | `pnpm lint` → 0 erreurs                                                                                                        |

---

## 2.2 STEP 2 — Revert invention I8 (SidebarRail)

### 2.2.0 Prompt Claude Code — Step 2

```
MISSION : REVERT INVENTION I8 — Retrait de SidebarRail

CONTEXTE :
Dans app-sidebar.tsx, un composant <SidebarRail /> a été ajouté.
SidebarRail existe comme primitif dans components/ui/sidebar.tsx (il fait partie
de la librairie shadcn/ui), MAIS shadcnuikit ne l'utilise PAS dans son layout.

Il ajoute une zone invisible de hover expand sur le bord de la sidebar.
C'est une invention d'usage, pas de composant — le composant existe mais
shadcnuikit ne l'utilise pas.

ACTION :
1. Ouvre components/layout/app-sidebar.tsx
2. Identifie la ligne contenant <SidebarRail /> ou <SidebarRail>
3. Retire cette ligne ET son import si SidebarRail n'est utilisé nulle part ailleurs
4. NE touche à RIEN d'autre dans le fichier

VALIDATION :
- pnpm typecheck → 0 erreurs
- pnpm build → succès
- grep "SidebarRail" components/layout/app-sidebar.tsx → 0 résultats
```

### 2.2.1 Critères de validation Step 2

| #   | Vérification       | Commande                                                   |
| --- | ------------------ | ---------------------------------------------------------- |
| V1  | SidebarRail retiré | `grep "SidebarRail" components/layout/app-sidebar.tsx` → 0 |
| V2  | Build passe        | `pnpm build` → succès                                      |
| V3  | Typecheck passe    | `pnpm typecheck` → 0 erreurs                               |

---

## 2.3 STEP 3 — Inner wrapper analysis

### 2.3.0 Prompt Claude Code — Step 3

```
MISSION : ANALYSE DU INNER WRAPPER SHADCNUIKIT — Audit READ-ONLY

CONTEXTE :
Avant de créer le composant PageContainer, tu dois comprendre comment shadcnuikit
wrappe le contenu de chaque page.

Le template shadcnuikit est disponible localement. Cherche-le dans le projet
ou dans les références (/Users/mohamedfodil/Documents/references/ ou similaire).

ANALYSE DEMANDÉE :
1. Ouvre PLUSIEURS pages différentes de shadcnuikit (minimum 5 pages variées) :
   - Une page de dashboard
   - Une page de table/liste
   - Une page de détail/formulaire
   - Une page de settings
   - Une page de file-manager

2. Pour CHAQUE page, identifie :
   - Les classes CSS exactes du div qui wrappe le contenu de la page
   - Le padding intérieur (Tailwind classes)
   - Le max-width (s'il y en a)
   - La structure HTML complète : combien de divs wrapper, quelles classes

3. Compare les 5 pages :
   - Y a-t-il un pattern commun ?
   - Quelles sont les variations ?
   - Y a-t-il un header de page (titre + actions) dans le wrapper ?

FORMAT DE RÉPONSE :
Pour chaque page, donne le JSX exact du wrapper :
```

<div className="[CLASSES EXACTES]">
  {/* contenu de la page */}
</div>
```

Puis synthétise le pattern commun et les variations.

INTERDITS :

- Ne crée aucun fichier
- Ne modifie rien
- C'est de l'analyse pure

```

### 2.3.1 Livrable attendu

Un rapport décrivant le pattern exact de wrapping shadcnuikit :
- Classes CSS (Tailwind) du wrapper principal
- Padding (ex: `p-4 md:p-6`)
- Max-width (ex: `max-w-7xl` ou aucun)
- Gap avec les enfants
- Variations entre types de pages

---

## 2.4 STEP 4 — Création PageContainer

### 2.4.0 Prompt Claude Code — Step 4

```

MISSION : CRÉATION DU COMPOSANT PageContainer

CONTEXTE :
Sur la base de l'analyse du inner wrapper shadcnuikit (step précédent),
tu vas créer un composant PageContainer réutilisable.

RÈGLE DES 2 COUCHES :

- Couche 1 (Visuel) = Le HTML rendu par PageContainer DOIT être PIXEL-PERFECT
  identique au inner wrapper de shadcnuikit. Mêmes classes, même padding, même
  structure HTML.
- Couche 2 (Technique) = Un composant DRY propre (Kiranism pattern) au lieu de
  copier-coller les mêmes classes dans 50+ pages.

PageContainer N'EST PAS un composant shadcnuikit. C'est un pattern d'ingénierie
pour éviter la duplication. Mais son OUTPUT doit être indiscernable de shadcnuikit.

SPÉCIFICATIONS :

- Emplacement : components/layout/page-container.tsx
- Props TypeScript :
  - children: React.ReactNode (obligatoire)
  - className?: string (pour extensions ponctuelles)
  - [autres props si l'analyse les justifie, ex: maxWidth, noPadding]
- Le composant utilise EXACTEMENT les classes identifiées dans l'analyse

APPROCHE :

1. Rappelle les classes identifiées dans l'analyse
2. Propose le code du composant
3. Montre un exemple d'utilisation dans une page
4. NE PAS exécuter avant validation

VALIDATION APRÈS CRÉATION :

- pnpm typecheck → 0 erreurs
- pnpm build → succès
- Le composant est importable : import { PageContainer } from "@/components/layout/page-container"

```

### 2.4.1 Critères de validation Step 4

| # | Vérification | Commande |
|---|-------------|----------|
| V1 | Fichier créé | `ls components/layout/page-container.tsx` → existe |
| V2 | Typecheck passe | `pnpm typecheck` → 0 erreurs |
| V3 | Build passe | `pnpm build` → succès |
| V4 | Export correct | `grep "export" components/layout/page-container.tsx` → named export |

---

## 2.5 STEP 5 — Build final + Commit Phase 1B.4

### 2.5.0 Prompt Claude Code — Step 5

```

MISSION : VALIDATION FINALE PHASE 1B.4

EXÉCUTE dans l'ordre :

1. pnpm typecheck — rapporte le résultat EXACT
2. pnpm build — rapporte le résultat EXACT (nombre de pages, warnings)
3. pnpm lint — rapporte le résultat EXACT

Si les 3 passent : 4. git add -A 5. git status — rapporte les fichiers modifiés 6. git commit -m "Phase 1B.4: revert inventions I1-I8 + PageContainer" 7. git push

Si UN SEUL échoue :

- STOP — rapporte l'erreur exacte
- NE PAS commiter

Après commit réussi : 8. git tag post-phase-1b 9. git push --tags

```

### 2.5.1 Validation Phase 1B.4 complète

**VALIDATION DEMANDÉE**
- Environnement testé : local
- Preuve objective : output terminal de build + typecheck + lint
- Tests avant fix : N/A (pas de fix, construction)
- Tests après : build ✅ + typecheck ✅ + lint ✅
- Régression détectée : AUCUNE attendue
- Critères manquants : push CI à vérifier après

**VALIDATION ACCORDÉE : OUI** — uniquement si les 3 checks passent ET git push réussit.

---

# 3. PHASE 1C — Infrastructure Refine.dev

> **Objectif :** Installer Refine, créer les 8 providers + 3 routes API, monter `<Refine>` dans le layout. Les pages existantes continuent de fonctionner identiquement.
> **Durée estimée :** 1-2 jours
> **Prérequis :** Phase 1B.4 validée (tag `post-phase-1b`)
> **Documents de référence :**
>   - FLEETCORE_REFINE_SPECIFICATION_CCode.md (1967L) — spécification Claude Code
>   - FLEETCORE_REFINE_SPECIFICATION.md (1737L) — spécification Claude Assistant
>   - FLEETCORE_FRONTEND_RESHAPING_SPECIFICATION_V2.md Section 6.1 — architecture Refine
> **Livrable :** `<Refine>` monté, tous providers fonctionnels, ZERO régression

---

## 3.0 Backup pré-Refine

```

AVANT TOUTE MODIFICATION :
git tag pre-refine-migration
git push --tags

```

---

## 3.1 STEP 1 — Installation packages

### 3.1.0 Prompt Claude Code — Step 1

```

MISSION : INSTALLATION DES PACKAGES REFINE

CONTEXTE :
Phase 1C du reshaping FleetCore. On installe l'infrastructure Refine.dev
SANS migrer aucune page existante. Les pages actuelles continueront de
fonctionner exactement comme avant.

PACKAGES À INSTALLER :

- @refinedev/core@^5.0.9
- @refinedev/nextjs-router@^7.0.4
- @tanstack/react-query@^5.81

ACTIONS :

1. Vérifie d'abord qu'AUCUN de ces packages n'est déjà installé :
   grep -E "@refinedev|@tanstack/react-query" package.json
2. Si aucun n'est présent, installe-les :
   pnpm add @refinedev/core@^5.0.9 @refinedev/nextjs-router@^7.0.4 @tanstack/react-query@^5.81
3. Vérifie les versions installées :
   pnpm list @refinedev/core @refinedev/nextjs-router @tanstack/react-query
4. Vérifie qu'il n'y a PAS de conflit de peer dependencies
5. pnpm build → confirme que rien n'est cassé

ATTENTION :

- @tanstack/react-query PEUT déjà être installé en tant que dépendance transitive.
  Vérifie si c'est le cas. Si oui, assure-toi que la version est compatible.
- Si react-query est déjà installé avec une version < 5, c'est un BLOQUEUR.
  Rapporte le problème.

INTERDITS :

- NE PAS installer d'autres packages que les 3 listés
- NE PAS modifier de code existant

```

### 3.1.1 Critères de validation Step 1

| # | Vérification |
|---|-------------|
| V1 | `pnpm list @refinedev/core` → version ^5.0.9 |
| V2 | `pnpm list @refinedev/nextjs-router` → version ^7.0.4 |
| V3 | `pnpm list @tanstack/react-query` → version ^5.x |
| V4 | `pnpm build` → succès, 0 erreur |
| V5 | 0 conflit peer dependency |

---

## 3.2 STEP 2 — DataProvider + RESOURCE_CONFIG

### 3.2.0 Prompt Claude Code — Step 2

```

MISSION : CRÉATION DU DATAPROVIDER FLEETCORE

DOCUMENTS DE RÉFÉRENCE (LIS-LES INTÉGRALEMENT AVANT DE CODER) :

- FLEETCORE_REFINE_SPECIFICATION_CCode.md → Section 2 (DataProvider) complète
- FLEETCORE_REFINE_SPECIFICATION.md → Section 4 (DataProvider) complète

FICHIER À CRÉER : lib/providers/refine-data-provider.ts (~200-250 lignes)

ARCHITECTURE :
Le DataProvider est un ADAPTER entre Refine hooks et les Server Actions / API routes
FleetCore existants. Il NE MODIFIE PAS les Server Actions.

CONTENU REQUIS :

1. RESOURCE_CONFIG — Registre de configuration par resource :
   Chaque resource déclare :
   - getList : référence vers Server Action ou API route pour la liste
   - getOne : référence vers Server Action ou API route pour un élément
   - create : référence vers Server Action pour la création
   - update : référence vers Server Action pour la mise à jour
   - deleteOne : référence vers Server Action pour la suppression
   - mapFilters? : fonction de mapping filtres Refine → format Server Action
   - mapResponse? : fonction de mapping réponse Server Action → format Refine

   Pour le moment, déclare UNIQUEMENT la resource "leads" (les autres viendront
   en Phase 2+ quand on migrera chaque module).

2. Les 6 méthodes DataProvider :
   - getList : appelle l'API route GET /api/v1/crm/leads avec pagination, filtres, tri
   - getOne : appelle l'API route GET /api/v1/crm/leads/[id]
   - create : appelle le Server Action createLeadAction via une route API (ou direct)
   - update : appelle updateLeadAction
   - deleteOne : appelle deleteLeadAction
   - getApiUrl : retourne "/api/v1"

3. Un fichier helper séparé pour les mappers :
   lib/providers/refine-mappers.ts (~80 lignes)
   - filtersToQuery : CrudFilter[] → Record<string, string>
   - sortersToQuery : CrudSort[] → Record<string, string>
   - paginationToQuery : Pagination → { skip, take }

APPROCHE :

1. Lis d'abord les deux spécifications Refine pour comprendre le contrat
2. Analyse les API routes existantes dans app/api/v1/crm/leads/
3. Analyse les Server Actions dans lib/actions/crm/lead.actions.ts
4. Propose le DataProvider + mappers
5. NE PAS exécuter avant validation du plan

RÈGLES ABSOLUES :
R1. JAMAIS modifier un Server Action pour adapter au DataProvider
R2. Le DataProvider s'adapte aux Server Actions, pas l'inverse
R3. Toute transformation de données se fait dans le DataProvider ou les mappers
R4. Le multi-tenant est TRANSPARENT — les Server Actions gèrent déjà l'isolation
R5. Les erreurs des Server Actions doivent être propagées proprement vers Refine

```

### 3.2.1 Fichiers créés

| Fichier | Lignes estimées | Contenu |
|---------|----------------|---------|
| `lib/providers/refine-data-provider.ts` | ~200-250L | RESOURCE_CONFIG + 6 méthodes DataProvider |
| `lib/providers/refine-mappers.ts` | ~80L | filtersToQuery + sortersToQuery + paginationToQuery |

### 3.2.2 Critères de validation Step 2

| # | Vérification |
|---|-------------|
| V1 | Fichiers créés et compilent (`pnpm typecheck` → 0 erreurs) |
| V2 | Types Refine correctement importés (DataProvider, CrudFilter, etc.) |
| V3 | `pnpm build` → succès |
| V4 | AUCUN Server Action modifié (vérifier `git diff lib/actions/`) |

---

## 3.3 STEP 3 — AuthProvider + AccessControlProvider

### 3.3.0 Prompt Claude Code — Step 3

```

MISSION : CRÉATION AUTHPROVIDER + ACCESSCONTROLPROVIDER

DOCUMENTS DE RÉFÉRENCE :

- FLEETCORE_REFINE_SPECIFICATION_CCode.md → Sections 3 et 4
- FLEETCORE_REFINE_SPECIFICATION.md → Sections 5 et 6

FICHIERS À CRÉER :

1. lib/providers/refine-auth-provider.ts (~60-80 lignes)
   - Adapter Clerk vers le contrat AuthProvider de Refine
   - check() : vérifie si l'utilisateur est authentifié via Clerk
   - getIdentity() : retourne les infos utilisateur depuis Clerk
   - logout() : appelle Clerk signOut
   - onError() : gère les erreurs 401/403

2. lib/providers/refine-access-control-provider.ts (~30-40 lignes)
   - Mappe le RBAC FleetCore existant (lib/config/permissions.ts) vers Refine
   - can({ resource, action }) :
     - Convertit resource Refine → module FleetCore
     - Convertit action Refine → PermissionAction FleetCore
     - Appelle hasPermission(role, permission)
   - Options : hideIfUnauthorized = true

APPROCHE :

1. Analyse lib/config/permissions.ts pour comprendre le RBAC existant
2. Analyse comment Clerk est utilisé actuellement (useAuth, useUser, etc.)
3. Propose les deux providers
4. NE PAS exécuter avant validation

CONTRAINTES :

- L'AuthProvider doit fonctionner CÔTÉ CLIENT (directive "use client")
- Les routes API auth (check, identity, can) seront créées au step suivant
- Pour l'instant, le provider peut appeler directement les hooks Clerk

```

### 3.3.1 Fichiers créés

| Fichier | Lignes | Contenu |
|---------|--------|---------|
| `lib/providers/refine-auth-provider.ts` | ~60-80L | Clerk → Refine AuthProvider adapter |
| `lib/providers/refine-access-control-provider.ts` | ~30-40L | RBAC FleetCore → Refine AccessControlProvider |

### 3.3.2 Critères de validation Step 3

| # | Vérification |
|---|-------------|
| V1 | Typecheck passe |
| V2 | Build passe |
| V3 | AUCUN fichier permissions.ts modifié |
| V4 | Mapping resource→module couvre : leads, opportunities, quotes, vehicles, drivers, maintenance, analytics, settings, users, roles, audit |

---

## 3.4 STEP 4 — Providers secondaires

### 3.4.0 Prompt Claude Code — Step 4

```

MISSION : CRÉATION DES 4 PROVIDERS SECONDAIRES

DOCUMENTS DE RÉFÉRENCE :

- FLEETCORE_REFINE_SPECIFICATION_CCode.md → Section 6
- FLEETCORE_REFINE_SPECIFICATION.md → Section 7

FICHIERS À CRÉER :

1. lib/providers/refine-i18n-provider.ts (~15 lignes)
   - Pont entre react-i18next (déjà utilisé par FleetCore) et Refine
   - getLocale() : retourne la locale courante
   - translate(key, params) : appelle i18next.t(key, params)
   - changeLocale(locale) : appelle i18next.changeLanguage(locale)

2. lib/providers/refine-notification-provider.ts (~25 lignes)
   - Pont vers Sonner (déjà installé dans FleetCore)
   - open({ type, message, description }) : appelle toast.success/error/info
   - close(key) : appelle toast.dismiss

3. lib/providers/refine-audit-log-provider.ts (~30 lignes)
   - Pont vers le système adm_audit_logs existant
   - create({ resource, action, data, previousData, meta }) :
     appelle le Server Action de logging existant

4. lib/providers/refine-resources.ts (~50 lignes)
   - Déclarations des resources avec leurs routes
   - Pour le moment, UNIQUEMENT "leads" (les autres s'ajouteront incrémentalement)
   - Format : { name, list, show, create, edit, meta: { label, parent, canDelete } }
   - Les routes utilisent le format /:locale/crm/leads etc.

APPROCHE :

1. Analyse comment react-i18next est configuré actuellement
2. Analyse comment Sonner (toast) est utilisé actuellement
3. Analyse le système d'audit logs existant
4. Propose les 4 fichiers
5. NE PAS exécuter avant validation

```

### 3.4.1 Fichiers créés

| Fichier | Lignes | Contenu |
|---------|--------|---------|
| `lib/providers/refine-i18n-provider.ts` | ~15L | react-i18next bridge |
| `lib/providers/refine-notification-provider.ts` | ~25L | Sonner bridge |
| `lib/providers/refine-audit-log-provider.ts` | ~30L | adm_audit_logs bridge |
| `lib/providers/refine-resources.ts` | ~50L | Resource declarations (leads only pour l'instant) |

### 3.4.2 Critères de validation Step 4

| # | Vérification |
|---|-------------|
| V1 | 4 fichiers créés |
| V2 | Typecheck passe |
| V3 | Build passe |
| V4 | Aucune dépendance manquante |

---

## 3.5 STEP 5 — Routes API auth

### 3.5.0 Prompt Claude Code — Step 5

```

MISSION : CRÉATION DES 3 ROUTES API AUTH POUR REFINE

FICHIERS À CRÉER :

1. app/api/auth/check/route.ts (~10 lignes)
   - GET endpoint
   - Vérifie si l'utilisateur est authentifié via Clerk
   - Retourne { authenticated: true/false }

2. app/api/auth/identity/route.ts (~15 lignes)
   - GET endpoint
   - Retourne les infos de l'utilisateur courant (id, name, email, avatar, role)
   - Utilise Clerk currentUser() ou auth()

3. app/api/auth/can/route.ts (~20 lignes)
   - POST endpoint
   - Body : { resource, action }
   - Vérifie la permission via hasPermission()
   - Retourne { can: true/false, reason?: string }

ATTENTION :

- Ces routes sont DANS app/api/auth/, PAS dans app/api/v1/
  (elles sont spécifiques à Refine, pas à l'API métier)
- Elles utilisent Clerk côté serveur (auth() de @clerk/nextjs/server)
- Elles NE modifient PAS les routes API existantes dans app/api/v1/

APPROCHE :

1. Analyse comment les routes API existantes utilisent Clerk
2. Propose les 3 fichiers
3. NE PAS exécuter avant validation

```

### 3.5.1 Fichiers créés

| Fichier | Lignes | Contenu |
|---------|--------|---------|
| `app/api/auth/check/route.ts` | ~10L | Auth status check |
| `app/api/auth/identity/route.ts` | ~15L | User identity |
| `app/api/auth/can/route.ts` | ~20L | Permission check |

### 3.5.2 Critères de validation Step 5

| # | Vérification |
|---|-------------|
| V1 | 3 fichiers créés dans app/api/auth/ |
| V2 | Build passe |
| V3 | Les routes existantes dans app/api/v1/ ne sont PAS modifiées |

---

## 3.6 STEP 6 — Montage `<Refine>` dans le layout

### 3.6.0 Prompt Claude Code — Step 6

```

MISSION : MONTAGE DU COMPOSANT <Refine> DANS LE LAYOUT DASHBOARD

DOCUMENT DE RÉFÉRENCE :

- FLEETCORE_REFINE_SPECIFICATION_CCode.md → Section 8.1 (Phase 0)
- FLEETCORE_FRONTEND_RESHAPING_SPECIFICATION_V2.md → Section 6.1

FICHIER À MODIFIER : app/[locale]/(app)/layout.tsx

MODIFICATION :
Ajouter le composant <Refine> comme wrapper autour du contenu existant.

Structure cible :

```tsx
<ClerkProvider>
  <SidebarProvider>
    <Refine
      dataProvider={fleetcoreDataProvider}
      authProvider={fleetcoreAuthProvider}
      accessControlProvider={fleetcoreAccessControlProvider}
      routerProvider={routerProvider}
      i18nProvider={fleetcoreI18nProvider}
      notificationProvider={fleetcoreNotificationProvider}
      auditLogProvider={fleetcoreAuditLogProvider}
      resources={FLEETCORE_RESOURCES}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        useNewQueryKeys: true,
        projectId: "fleetcore",
      }}
    >
      {/* contenu existant INCHANGÉ */}
    </Refine>
  </SidebarProvider>
</ClerkProvider>
```

CONTRAINTES CRITIQUES :

1. Le layout est un Server Component. <Refine> est un Client Component.
   → Il faudra probablement créer un wrapper client :
   components/providers/refine-provider.tsx ("use client")
   qui encapsule <Refine> avec tous ses providers.
   Le layout importe ce wrapper.

2. L'ordre des providers existants (Clerk, Sidebar, etc.) NE DOIT PAS changer.
   Refine s'insère DANS la hiérarchie, il ne la remplace pas.

3. Après montage, TOUTES les pages existantes doivent fonctionner identiquement.
   Les hooks Refine (useList, useTable, etc.) deviennent disponibles mais
   personne ne les appelle encore.

APPROCHE :

1. Analyse le layout actuel (quels providers, quel ordre)
2. Propose la modification minimale
3. Crée le wrapper client si nécessaire
4. NE PAS exécuter avant validation

VALIDATION :

- pnpm build → succès
- pnpm typecheck → 0 erreurs
- Naviguer vers /fr/dashboard → la page s'affiche normalement
- Naviguer vers /fr/crm/leads → la page s'affiche normalement
- Aucune erreur console (pas de "missing provider" etc.)

```

### 3.6.1 Fichiers impactés

| Fichier | Action |
|---------|--------|
| `app/[locale]/(app)/layout.tsx` | MODIFIÉ — ajout import RefineProvider |
| `components/providers/refine-provider.tsx` | CRÉÉ — wrapper "use client" pour `<Refine>` |

### 3.6.2 Critères de validation Step 6

| # | Vérification |
|---|-------------|
| V1 | Build passe |
| V2 | Typecheck passe |
| V3 | Dashboard accessible et fonctionnel |
| V4 | Leads page accessible et fonctionnelle |
| V5 | Aucune erreur console liée à Refine |
| V6 | Les pages non-migrées fonctionnent identiquement |

---

## 3.7 STEP 7 — Test d'intégration Refine

### 3.7.0 Prompt Claude Code — Step 7

```

MISSION : TEST D'INTÉGRATION REFINE — Validation que les hooks fonctionnent

OBJECTIF :
Créer une page de TEST temporaire qui vérifie que l'infrastructure Refine
fonctionne correctement avant de commencer la migration des pages.

ACTIONS :

1. Crée une page temporaire : app/[locale]/(app)/dev/refine-test/page.tsx
   Cette page est TEMPORAIRE et sera supprimée après validation.

2. La page doit tester :
   a. useList({ resource: "leads" }) — retourne-t-il des données ?
   b. Affiche le nombre de leads retournés et le total
   c. useCan({ resource: "leads", action: "create" }) — retourne-t-il un résultat ?
   d. Affiche "Can create: true/false"
   e. useGetIdentity() — retourne-t-il l'utilisateur courant ?
   f. Affiche le nom et email de l'utilisateur

3. La page affiche les résultats de manière simple (pas besoin de design)

4. Navigue vers cette page et vérifie que :
   - Les données leads apparaissent (nombre > 0 si la base contient des leads)
   - Le RBAC retourne un résultat
   - L'identité retourne les infos utilisateur

VALIDATION :

- Si les 3 tests passent → Refine infrastructure OK
- Si un test échoue → identifier pourquoi et corriger le provider concerné

APRÈS VALIDATION :

- Supprimer la page de test
- OU la garder sous un feature flag pour debug futur

```

### 3.7.1 Critères de validation Step 7

| # | Vérification |
|---|-------------|
| V1 | useList({ resource: "leads" }) retourne des données |
| V2 | useCan fonctionne et retourne un résultat cohérent |
| V3 | useGetIdentity retourne l'utilisateur Clerk |
| V4 | AUCUNE erreur console |
| V5 | Les pages existantes non-migrées fonctionnent toujours |

---

## 3.8 STEP 8 — Commit + Tag Phase 1C

### 3.8.0 Prompt Claude Code — Step 8

```

MISSION : VALIDATION FINALE PHASE 1C

CHECKLIST :

1. Supprime la page de test (si pas gardée)
2. pnpm typecheck → rapporte résultat
3. pnpm build → rapporte résultat
4. pnpm lint → rapporte résultat
5. git diff --stat → liste tous les fichiers modifiés/créés
6. Vérifie qu'AUCUN fichier dans lib/actions/ n'a été modifié
7. Vérifie qu'AUCUN fichier dans app/api/v1/ n'a été modifié

Si tout passe : 8. git add -A 9. git commit -m "Phase 1C: Refine.dev infrastructure - 8 providers + 3 API routes + <Refine> wrapper" 10. git push 11. git tag post-phase-1c 12. git push --tags

```

### 3.8.1 Validation Phase 1C complète

**VALIDATION DEMANDÉE**
- Environnement testé : local + (CI si disponible)
- Preuve objective : output terminal build + typecheck + lint + test page Refine
- Fichiers backend modifiés : AUCUN (vérifié par git diff)
- Providers créés : 8 fichiers dans lib/providers/
- Routes API créées : 3 fichiers dans app/api/auth/
- Wrapper créé : 1 fichier components/providers/refine-provider.tsx
- Régression détectée : AUCUNE
- Critères manquants : aucun

**VALIDATION ACCORDÉE : OUI** — uniquement si TOUS les critères ci-dessus sont remplis.

---

### 3.9 Inventaire Phase 1C — Fichiers créés

| # | Fichier | Lignes | Rôle |
|---|---------|--------|------|
| 1 | `lib/providers/refine-data-provider.ts` | ~200-250 | DataProvider + RESOURCE_CONFIG |
| 2 | `lib/providers/refine-mappers.ts` | ~80 | Filtres/tri/pagination transformations |
| 3 | `lib/providers/refine-auth-provider.ts` | ~60-80 | Clerk → Refine auth adapter |
| 4 | `lib/providers/refine-access-control-provider.ts` | ~30-40 | RBAC FleetCore → Refine |
| 5 | `lib/providers/refine-i18n-provider.ts` | ~15 | react-i18next bridge |
| 6 | `lib/providers/refine-notification-provider.ts` | ~25 | Sonner bridge |
| 7 | `lib/providers/refine-audit-log-provider.ts` | ~30 | adm_audit_logs bridge |
| 8 | `lib/providers/refine-resources.ts` | ~50 | Resource declarations |
| 9 | `app/api/auth/check/route.ts` | ~10 | Auth status endpoint |
| 10 | `app/api/auth/identity/route.ts` | ~15 | User identity endpoint |
| 11 | `app/api/auth/can/route.ts` | ~20 | Permission check endpoint |
| 12 | `components/providers/refine-provider.tsx` | ~40 | Client wrapper pour `<Refine>` |
| **TOTAL** | | **~575-655L** | |

---

# 4. PHASE 2 — DataTable + Leads Refine Pilote

> **Objectif :** Construire le DataTable standardisé (PATTERN 1 de shadcnuikit) ET migrer Leads comme première resource complète via Refine. C'est le proof-of-concept qui valide l'architecture entière.
> **Durée estimée :** 3-5 jours
> **Prérequis :** Phase 1C validée (tag `post-phase-1c`)
> **Documents de référence :**
>   - Specification V2 Section 7.2 (pattern Leads cible)
>   - Specification V2 Section 8 (Phase 2)
>   - Refine Specifications (les deux)
>   - Plan V2 Section 2.1-2.2
> **Livrable :** Leads 100% fonctionnel via Refine + DataTable réutilisable

---

## 4.0 Backup pré-Phase 2

```

git tag pre-phase-2
git push --tags

```

---

## 4.1 STEP 1 — Infrastructure DataTable (Kiranism)

### 4.1.0 Prompt Claude Code — Step 1

```

MISSION : INSTALLATION DE L'INFRASTRUCTURE DATATABLE DEPUIS KIRANISM

CONTEXTE :
Phase 2 du reshaping. On construit le PATTERN 1 — le DataTable standardisé
qui servira à 10+ pages dans FleetCore.

La source est le template Kiranism qui contient un système DataTable complet
basé sur TanStack Table v8.

SOURCES À CHERCHER :
Le template Kiranism est disponible localement (cherche dans
/Users/mohamedfodil/Documents/references/kiranism/ ou similaire).

FICHIERS À COPIER DEPUIS KIRANISM :

1. Système DataTable (9 fichiers dans components/ui/table/) :
   - data-table.tsx — Composant principal
   - data-table-toolbar.tsx — Barre d'outils (search + filters + view options)
   - data-table-column-header.tsx — Headers triables
   - data-table-pagination.tsx — Pagination
   - data-table-faceted-filter.tsx — Filtres à facettes
   - data-table-view-options.tsx — Toggle colonnes visibles
   - data-table-floating-bar.tsx — Barre d'actions bulk
   - data-table-skeleton.tsx — Skeleton loading
   - data-table-advanced-toolbar.tsx — Toolbar avancée (si existe)

2. Hook principal :
   - hooks/use-data-table.ts (296L) — Configuration TanStack Table

3. Helpers et parsers :
   - lib/data-table.ts (78L) — Utilitaires DataTable
   - lib/parsers.ts (100L) — URL state parsers (nuqs)

4. Types et config :
   - types/data-table.ts (40L) — Types TypeScript
   - config/data-table.ts (82L) — Filter operators config

5. Dépendance URL state :
   - nuqs (si pas déjà installé : pnpm add nuqs)

APPROCHE :

1. Localise d'abord les fichiers dans Kiranism
2. Analyse la structure exacte et les imports
3. Propose un plan de copie fichier par fichier
4. Identifie les adaptations nécessaires (imports, styling shadcnuikit)
5. NE PAS exécuter avant validation

ADAPTATION STYLING :
Les composants DataTable de Kiranism utilisent les composants shadcn/ui de base
(Table, Button, Select, etc.). Puisqu'on a déjà installé shadcnuikit en Phase 1A,
les composants de base sont déjà en place. Il faut juste vérifier que les
imports pointent vers les bons chemins.

IMPORTANT :

- ZÉRO code from scratch — on copie depuis Kiranism
- Les adaptations se limitent aux imports et au styling
- Le comportement (tri, filtre, pagination, search) reste identique

```

### 4.1.1 Packages à installer

| Package | Raison |
|---------|--------|
| `nuqs` | URL state management pour sync filtres ↔ URL |
| `@tanstack/react-table` | TanStack Table v8 (si pas déjà installé via Kiranism) |

### 4.1.2 Fichiers créés (copiés depuis Kiranism)

| # | Fichier | Source | Lignes |
|---|---------|--------|--------|
| 1 | `components/ui/table/data-table.tsx` | Kiranism | ~200L |
| 2 | `components/ui/table/data-table-toolbar.tsx` | Kiranism | ~150L |
| 3 | `components/ui/table/data-table-column-header.tsx` | Kiranism | ~100L |
| 4 | `components/ui/table/data-table-pagination.tsx` | Kiranism | ~150L |
| 5 | `components/ui/table/data-table-faceted-filter.tsx` | Kiranism | ~200L |
| 6 | `components/ui/table/data-table-view-options.tsx` | Kiranism | ~80L |
| 7 | `components/ui/table/data-table-floating-bar.tsx` | Kiranism | ~200L |
| 8 | `components/ui/table/data-table-skeleton.tsx` | Kiranism | ~50L |
| 9 | `components/ui/table/index.ts` | Nouveau | ~20L (barrel exports) |
| 10 | `hooks/use-data-table.ts` | Kiranism | ~296L |
| 11 | `lib/data-table.ts` | Kiranism | ~78L |
| 12 | `lib/parsers.ts` | Kiranism | ~100L |
| 13 | `types/data-table.ts` | Kiranism | ~40L |
| 14 | `config/data-table.ts` | Kiranism | ~82L |
| **TOTAL** | | | **~1750L** |

### 4.1.3 Critères de validation Step 1

| # | Vérification |
|---|-------------|
| V1 | Tous les fichiers copiés et présents |
| V2 | `pnpm typecheck` → 0 erreurs |
| V3 | `pnpm build` → succès |
| V4 | Aucun import cassé |

---

## 4.2 STEP 2 — DataTable démo avec données statiques

### 4.2.0 Prompt Claude Code — Step 2

```

MISSION : VALIDATION DATATABLE AVEC DONNÉES STATIQUES

OBJECTIF :
Créer une page de test temporaire qui valide que le DataTable fonctionne
correctement avec des données statiques AVANT de le connecter aux données réelles.

ACTION :

1. Crée une page temporaire : app/[locale]/(app)/dev/datatable-test/page.tsx

2. Cette page doit :
   a. Définir 20 lignes de données statiques (objets simples)
   b. Définir 5 colonnes (ColumnDef[])
   c. Utiliser useDataTable + DataTable
   d. Vérifier que TRI fonctionne (clic sur header)
   e. Vérifier que FILTRES fonctionnent
   f. Vérifier que PAGINATION fonctionne (5 par page = 4 pages)
   g. Vérifier que SEARCH fonctionne
   h. Vérifier que COLUMN VISIBILITY fonctionne

3. Navigue vers la page et teste chaque fonctionnalité

VALIDATION :

- Les 6 fonctionnalités (tri, filtres, pagination, search, column visibility, selection)
  fonctionnent toutes
- Aucune erreur console
- L'URL reflète les filtres/pagination (nuqs sync)

APRÈS VALIDATION :
Supprime ou garde la page de test (au choix, mais documente)

```

### 4.2.1 Critères de validation Step 2

| # | Fonctionnalité | Vérification |
|---|---------------|-------------|
| V1 | Tri | Clic header → données réordonnées |
| V2 | Filtres | Filtre facetté → données filtrées |
| V3 | Pagination | 5/page → 4 pages navigables |
| V4 | Search | Texte → résultats filtrés |
| V5 | Column visibility | Toggle colonnes → colonnes masquées/affichées |
| V6 | Sélection | Checkbox → lignes sélectionnées |
| V7 | URL sync | L'URL reflète l'état des filtres |

---

## 4.3 STEP 3 — Structure features/crm/leads/

### 4.3.0 Prompt Claude Code — Step 3

```

MISSION : CRÉATION DE LA STRUCTURE features/crm/leads/

CONTEXTE :
Maintenant que le DataTable et Refine sont en place, on crée la structure
de la première resource migrée : les Leads.

Architecture cible (Specification V2 Section 7.2) :

features/crm/leads/
├── types/lead.types.ts → 40L (TypeScript interfaces)
├── schemas/lead.schema.ts → 30L (Zod create + update)
├── hooks/use-leads-table.ts → 25L (Config useTable Refine)
├── components/
│ ├── leads-list-page.tsx → 60L (Client, useTable + DataTable)
│ ├── lead-columns.tsx → 80L (ColumnDef[] + actions via useCan)
│ ├── leads-create-dialog.tsx → 80L (Client, useCreate + form)
│ └── leads-edit-drawer.tsx → 100L (Client, useOne + useUpdate + drawer)

APPROCHE PAR SOUS-ÉTAPES :

SOUS-ÉTAPE 3A — Types et Schemas

1. Analyse le fichier LeadsPageClient.tsx actuel pour identifier :
   - Tous les champs d'un Lead (type TypeScript)
   - Les champs de création (CreateLead)
   - Les champs de mise à jour (UpdateLead)
2. Analyse lib/validators/ pour les schemas Zod existants
3. Crée features/crm/leads/types/lead.types.ts avec les interfaces
4. Crée features/crm/leads/schemas/lead.schema.ts avec les schemas Zod

SOUS-ÉTAPE 3B — Hook use-leads-table

1. Crée features/crm/leads/hooks/use-leads-table.ts
2. Ce hook utilise useTable de Refine avec :
   - resource: "leads"
   - syncWithLocation: true
   - pagination: { pageSize: 25 }
   - sorters: { initial: [{ field: "created_at", order: "desc" }] }
3. Il retourne tableProps prêtes à être passées au DataTable

SOUS-ÉTAPE 3C — ColumnDef (lead-columns.tsx)

1. Analyse les colonnes actuelles dans LeadsPageClient.tsx
2. Crée features/crm/leads/components/lead-columns.tsx
3. Chaque colonne utilise ColumnDef<Lead>
4. Les actions utilisent <CanAccess> ou useCan pour le RBAC

NE PAS traiter les sous-étapes 3D et 3E (create dialog et edit drawer)
pour l'instant. On fait d'abord fonctionner la liste.

INTERDITS :

- NE PAS modifier LeadsPageClient.tsx existant (il reste en place pour l'instant)
- NE PAS supprimer du code existant
- Les deux versions coexistent temporairement

```

### 4.3.1 Fichiers créés (Step 3)

| # | Fichier | Lignes | Contenu |
|---|---------|--------|---------|
| 1 | `features/crm/leads/types/lead.types.ts` | ~40L | Lead, CreateLead, UpdateLead interfaces |
| 2 | `features/crm/leads/schemas/lead.schema.ts` | ~30L | createLeadSchema, updateLeadSchema |
| 3 | `features/crm/leads/hooks/use-leads-table.ts` | ~25L | useTable config Refine |
| 4 | `features/crm/leads/components/lead-columns.tsx` | ~80L | ColumnDef[] |

### 4.3.2 Critères de validation Step 3

| # | Vérification |
|---|-------------|
| V1 | Types compilent |
| V2 | Schemas Zod compilent |
| V3 | Hook importe correctement useTable de Refine |
| V4 | Columns importe correctement ColumnDef de TanStack |
| V5 | Build passe |

---

## 4.4 STEP 4 — leads-list-page.tsx (page principale)

### 4.4.0 Prompt Claude Code — Step 4

```

MISSION : CRÉATION DE leads-list-page.tsx — PAGE LEADS VIA REFINE

CONTEXTE :
C'est LE moment clé : la première page FleetCore qui utilise Refine + DataTable.
Cette page remplace la logique de données de LeadsPageClient.tsx (1098L).

FICHIER À CRÉER : features/crm/leads/components/leads-list-page.tsx (~60L)

COMPORTEMENT :

1. "use client" directive
2. Importe useLeadsTable (le hook du step précédent)
3. Importe le DataTable de Kiranism
4. Importe les lead-columns

5. Le composant :
   - Appelle useLeadsTable() → obtient tableQueryResult, filters, setFilters, etc.
   - Passe ces données au DataTable standard
   - Affiche la toolbar avec filtres
   - Affiche la pagination
   - Gère le loading state
   - Gère l'empty state

6. NE GÈRE PAS (pour l'instant) :
   - Le Kanban (sera Phase 3 ou plus tard)
   - Les modals create/edit (steps suivants)
   - Les bulk actions (step suivant)

INTÉGRATION DANS LA PAGE EXISTANTE :

- NE PAS modifier la page app/[locale]/(app)/crm/leads/page.tsx pour l'instant
- Créer plutôt une page de test temporaire :
  app/[locale]/(app)/dev/leads-refine/page.tsx
  qui importe leads-list-page et l'affiche avec PageContainer

Cela permet de tester SANS casser la page existante.

VALIDATION :

- Naviguer vers /fr/dev/leads-refine
- La liste des leads apparaît avec les données RÉELLES
- Le tri fonctionne
- Les filtres fonctionnent
- La pagination fonctionne
- L'URL reflète les filtres

```

### 4.4.1 Critères de validation Step 4

| # | Vérification |
|---|-------------|
| V1 | La page /dev/leads-refine affiche des données réelles |
| V2 | Pagination fonctionne (changer de page) |
| V3 | Tri fonctionne (clic header) |
| V4 | Filtres fonctionnent |
| V5 | URL sync fonctionne (refresh → même état) |
| V6 | Loading state affiché pendant le chargement |
| V7 | La page /crm/leads existante fonctionne TOUJOURS |

---

## 4.5 STEP 5 — Create dialog + Edit drawer

### 4.5.0 Prompt Claude Code — Step 5

```

MISSION : CRÉATION DU CREATE DIALOG ET DE L'EDIT DRAWER POUR LEADS

FICHIERS À CRÉER :

1. features/crm/leads/components/leads-create-dialog.tsx (~80L)
   - useCreate({ resource: "leads" }) de Refine
   - Formulaire basé sur les composants shadcnuikit
   - Validation via le schema Zod createLeadSchema
   - Après création : invalidation automatique du cache (TanStack Query)
   - Dialog shadcnuikit (composant Dialog existant)

2. features/crm/leads/components/leads-edit-drawer.tsx (~100L)
   - useOne({ resource: "leads", id }) pour charger les données
   - useUpdate({ resource: "leads" }) pour sauvegarder
   - Formulaire basé sur les composants shadcnuikit
   - Validation via updateLeadSchema
   - Drawer shadcnuikit (composant Sheet/Drawer existant)
   - Après update : invalidation automatique du cache

APPROCHE :

1. Analyse les formulaires de création/édition existants dans LeadsPageClient.tsx
2. Identifie TOUS les champs et leur type (input, select, date, etc.)
3. Reproduis les MÊMES champs avec les composants shadcnuikit
4. Connecte aux hooks Refine au lieu de Server Actions directes

INTÉGRATION :

- Intègre le create dialog et l'edit drawer dans leads-list-page.tsx
- Le bouton "Create Lead" ouvre le dialog
- Le clic sur une row ouvre l'edit drawer

VALIDATION :

- Créer un lead → il apparaît dans la liste (cache invalidé)
- Éditer un lead → les changements apparaissent (cache invalidé)
- Les validations Zod fonctionnent (champs requis, formats)
- Pas de régression sur les autres pages

```

### 4.5.1 Critères de validation Step 5

| # | Vérification |
|---|-------------|
| V1 | Create dialog s'ouvre et affiche le formulaire |
| V2 | Create → nouveau lead visible dans la liste |
| V3 | Edit drawer s'ouvre avec les données pré-remplies |
| V4 | Edit → changements visibles dans la liste |
| V5 | Validation Zod affiche les erreurs sur champs invalides |
| V6 | Cache invalidé automatiquement (pas de refresh manuel) |

---

## 4.6 STEP 6 — Remplacement page Leads officielle

### 4.6.0 Prompt Claude Code — Step 6

```

MISSION : REMPLACEMENT DE LA PAGE LEADS OFFICIELLE

CONTEXTE :
La page de test /dev/leads-refine fonctionne. Il est temps de remplacer
la page officielle /crm/leads pour utiliser la nouvelle version Refine.

APPROCHE (prudente) :

1. Dans app/[locale]/(app)/crm/leads/page.tsx :
   - RENOMME l'ancien contenu en commentaire OU crée un backup
   - Importe leads-list-page depuis features/crm/leads/components/
   - Wrappe dans PageContainer

2. L'ancienne page server-side (qui faisait fetchAllLeads()) devient :
   - Un simple wrapper qui rend leads-list-page
   - Les données sont maintenant chargées côté client via Refine
   - Plus besoin du fetch initial server-side pour les leads

3. CONSERVE LeadsPageClient.tsx (ne le supprime PAS encore)
   - Il sera supprimé en Phase 3 quand tous les composants seront migrés
   - Pour l'instant c'est un backup et une référence

VALIDATION COMPLÈTE (E2E) :

1. Naviguer vers /fr/crm/leads → la nouvelle page s'affiche
2. La liste charge les leads avec pagination
3. Créer un lead → apparaît dans la liste
4. Filtrer par statut → résultats filtrés
5. Trier par nom → données triées
6. Éditer un lead → changements visibles
7. Sélectionner plusieurs leads → actions bulk disponibles (si implémentées)
8. Performance : Lighthouse score ≥ 90
9. L'URL reflète les filtres et la pagination
10. Refresh de la page → même état (URL sync)

```

### 4.6.1 Critères de validation Step 6

| # | Vérification | Criticité |
|---|-------------|-----------|
| V1 | Page /crm/leads charge les données | BLOQUANT |
| V2 | Create lead fonctionnel | BLOQUANT |
| V3 | Edit lead fonctionnel | BLOQUANT |
| V4 | Tri fonctionnel | BLOQUANT |
| V5 | Filtres fonctionnels | BLOQUANT |
| V6 | Pagination fonctionnelle | BLOQUANT |
| V7 | URL sync fonctionnel | IMPORTANT |
| V8 | Lighthouse ≥ 90 | IMPORTANT |
| V9 | Aucune régression sur les autres pages CRM | BLOQUANT |
| V10 | Aucune erreur console | BLOQUANT |

---

## 4.7 STEP 7 — Nettoyage + Commit Phase 2

### 4.7.0 Prompt Claude Code — Step 7

```

MISSION : NETTOYAGE ET COMMIT PHASE 2

ACTIONS :

1. Supprime les pages de test temporaires (/dev/datatable-test, /dev/leads-refine)
2. pnpm typecheck → rapporte résultat
3. pnpm build → rapporte résultat
4. pnpm lint → rapporte résultat
5. Vérifie que AUCUN Server Action n'a été modifié : git diff lib/actions/
6. git add -A
7. git status → rapporte fichiers
8. git commit -m "Phase 2: DataTable (Kiranism) + Leads Refine pilote"
9. git push
10. git tag post-phase-2
11. git push --tags

NOTE : LeadsPageClient.tsx n'est PAS supprimé. Il sera supprimé en Phase 3.

```

### 4.7.1 Validation Phase 2 complète

**VALIDATION DEMANDÉE**
- Environnement testé : local
- Preuve objective : Lighthouse score + output terminal
- Parcours E2E Leads : ✅ list + create + edit + filter + sort + paginate + URL sync
- Server Actions modifiées : AUCUNE
- Nouveaux fichiers : ~14 DataTable + ~7 Leads features
- Régression détectée : AUCUNE
- Critères manquants : aucun

**VALIDATION ACCORDÉE : OUI** — uniquement si le parcours E2E complet est validé.

---

# 5. PHASE 3 — Refactoring God Components + Zustand UI State

> **Objectif :** Éclater les God Components CRM (LeadsPageClient 1098L, OpportunityDrawer 1021L, PipelineSettingsTab 1293L), extraire le UI state dans Zustand, les données serveur passant par Refine.
> **Durée estimée :** 3-4 jours
> **Prérequis :** Phase 2 validée (tag `post-phase-2`)
> **Livrable :** God Components éclatés, Zustand stores, 0 useState pour données serveur

---

## 5.0 Backup pré-Phase 3

```

git tag pre-phase-3
git push --tags

```

---

## 5.1 STEP 1 — Installation Zustand + Création stores

### 5.1.0 Prompt Claude Code — Step 1

```

MISSION : INSTALLATION ZUSTAND + CRÉATION DES STORES UI

CONTEXTE :
Architecture tri-couche de state management (Specification V2 Section 6.3) :

- TanStack Query v5 (via Refine) → SERVER STATE (données, cache, invalidation)
- Zustand → UI STATE (mode vue, colonnes visibles, sélection, modals ouverts)
- nuqs → URL STATE (filtres, pagination, tri — synchronisés dans l'URL)

Zustand ne stocke JAMAIS de données serveur. Il gère uniquement l'état UI
qui ne vient pas du serveur et qui n'a pas besoin d'être dans l'URL.

ACTIONS :

1. Installer Zustand :
   pnpm add zustand

2. Créer les stores suivants dans stores/ :

a. stores/sidebar-store.ts (~20L)

- État : collapsed (boolean)
- Actions : toggle, setCollapsed
- Note : vérifier si le SidebarProvider existant gère déjà cet état.
  Si oui, ce store n'est peut-être pas nécessaire.

b. stores/leads-store.ts (~60L)

- viewMode: "table" | "kanban" | "split" (remplace useState viewMode)
- selectedLeadIds: string[] (remplace useState selected)
- isCreateDialogOpen: boolean (remplace useState showCreateModal)
- editDrawerLeadId: string | null (remplace useState editingLead)
- Actions : setViewMode, toggleSelection, selectAll, clearSelection,
  openCreateDialog, closeCreateDialog, openEditDrawer, closeEditDrawer

c. stores/opportunities-store.ts (~50L)

- viewMode: "pipeline" | "table"
- selectedOpportunityIds: string[]
- drawerOpportunityId: string | null
- Actions similaires au leads-store

d. stores/preferences-store.ts (~30L)

- pageSize: number (défaut 25)
- Actions : setPageSize
- Note : persister dans localStorage via zustand/middleware persist

APPROCHE :

1. Analyse les useState actuels dans LeadsPageClient.tsx — lesquels sont UI state ?
2. Analyse les useState dans les composants Opportunities — lesquels sont UI state ?
3. Propose les stores
4. NE PAS exécuter avant validation

IMPORTANT :

- Chaque store DOIT avoir des types TypeScript stricts
- Pattern : export const useLeadsStore = create<LeadsStoreState>()(...)
- Sélecteurs : exporter des sélecteurs individuels pour éviter les re-renders
  ex: export const useLeadsViewMode = () => useLeadsStore((s) => s.viewMode)

```

### 5.1.1 Fichiers créés

| # | Fichier | Lignes | Contenu |
|---|---------|--------|---------|
| 1 | `stores/leads-store.ts` | ~60L | UI state leads (viewMode, selection, modals) |
| 2 | `stores/opportunities-store.ts` | ~50L | UI state opportunities |
| 3 | `stores/preferences-store.ts` | ~30L | Préférences utilisateur (pageSize, persist) |
| 4 | `stores/sidebar-store.ts` | ~20L (si nécessaire) | Sidebar collapsed state |

### 5.1.2 Critères de validation Step 1

| # | Vérification |
|---|-------------|
| V1 | Zustand installé (`pnpm list zustand`) |
| V2 | Stores compilent |
| V3 | Build passe |
| V4 | Aucun store ne contient de données serveur (leads[], opportunities[]) |

---

## 5.2 STEP 2 — Intégration Zustand dans Leads

### 5.2.0 Prompt Claude Code — Step 2

```

MISSION : INTÉGRATION ZUSTAND DANS LA PAGE LEADS REFINE

CONTEXTE :
En Phase 2, on a créé leads-list-page.tsx avec Refine hooks pour les données.
Maintenant on intègre Zustand pour le UI state.

MODIFICATIONS :

1. features/crm/leads/components/leads-list-page.tsx :
   - Remplacer tout useState de UI state par les sélecteurs Zustand
   - viewMode vient de useLeadsViewMode()
   - selectedIds vient de useLeadsSelectedIds()
   - isCreateOpen vient de useLeadsCreateDialogOpen()
   - etc.

2. features/crm/leads/components/leads-create-dialog.tsx :
   - L'ouverture/fermeture vient de useLeadsStore

3. features/crm/leads/components/leads-edit-drawer.tsx :
   - Le leadId édité vient de useLeadsStore

GAINS ATTENDUS :

- 0 useState pour UI state dans les composants (tout dans Zustand)
- 0 prop drilling (les composants accèdent directement au store)
- Re-renders minimaux (sélecteurs granulaires)

VALIDATION :

- Même comportement que avant
- Mais le state est centralisé dans Zustand
- Aucun useState restant sauf pour des états très locaux (ex: input value)

```

### 5.2.1 Critères de validation Step 2

| # | Vérification |
|---|-------------|
| V1 | Page Leads fonctionne identiquement |
| V2 | grep "useState" dans features/crm/leads/ → minimum absolu |
| V3 | viewMode switch fonctionne |
| V4 | Selection fonctionne |
| V5 | Create dialog s'ouvre/se ferme via store |
| V6 | Edit drawer s'ouvre/se ferme via store |

---

## 5.3 STEP 3 — Kanban Leads (si existant dans la page actuelle)

### 5.3.0 Prompt Claude Code — Step 3

```

MISSION : MIGRATION DU KANBAN LEADS VERS LE NOUVEAU PATTERN

CONTEXTE :
La page Leads actuelle (LeadsPageClient.tsx) contient un mode Kanban
(drag & drop par statut). Ce composant doit être extrait et migré.

ANALYSE PRÉALABLE :

1. Identifie dans LeadsPageClient.tsx le code lié au Kanban
2. Quelles bibliothèques sont utilisées ? (@dnd-kit ? react-beautiful-dnd ? custom ?)
3. Quelle est la structure de données du Kanban (colonnes = statuts ?)
4. Quelle action est appelée sur drag & drop (updateLeadStatusAction ?)

FICHIER À CRÉER : features/crm/leads/components/leads-kanban.tsx (~150L)

COMPORTEMENT :

- Utilise useList({ resource: "leads" }) pour les données
- Groupe les leads par statut (colonnes)
- Drag & drop entre colonnes → appelle useUpdate ou dataProvider.custom
- La mise à jour est optimiste (le lead bouge immédiatement, rollback si erreur)
- Le viewMode Zustand contrôle l'affichage (table vs kanban)

INTÉGRATION :

- leads-list-page.tsx lit viewMode du store
- Si "table" → affiche DataTable
- Si "kanban" → affiche leads-kanban
- Si "split" → affiche les deux côte à côte (si existant)

VALIDATION :

- Switch table ↔ kanban fonctionne
- Drag & drop change le statut
- Le cache est invalidé après le changement

```

### 5.3.1 Critères de validation Step 3

| # | Vérification |
|---|-------------|
| V1 | Kanban affiche les leads groupés par statut |
| V2 | Drag & drop fonctionne |
| V3 | Le statut est mis à jour côté serveur |
| V4 | Le cache est invalidé |
| V5 | Switch table ↔ kanban fonctionne |

---

## 5.4 STEP 4 — Suppression LeadsPageClient.tsx

### 5.4.0 Prompt Claude Code — Step 4

```

MISSION : SUPPRESSION DU GOD COMPONENT LeadsPageClient.tsx

PRÉREQUIS (vérifie TOUT avant de supprimer) :

1. La page /crm/leads fonctionne entièrement via Refine
2. Create lead ✅
3. Edit lead ✅
4. Delete lead ✅
5. Filtres ✅
6. Tri ✅
7. Pagination ✅
8. Kanban ✅ (si existait)
9. Bulk actions ✅ (si existaient)

SI et SEULEMENT SI tous les prérequis sont vérifiés :

1. Supprime components/crm/leads/LeadsPageClient.tsx
2. Supprime tous les imports vers ce fichier
3. Vérifie qu'aucun autre fichier ne l'importe :
   grep -rn "LeadsPageClient" src/ app/ components/ features/
4. pnpm typecheck → 0 erreurs
5. pnpm build → succès

SI UN PRÉREQUIS MANQUE :

- NE PAS supprimer
- Rapporte exactement ce qui manque

```

### 5.4.1 Critères de validation Step 4

| # | Vérification |
|---|-------------|
| V1 | LeadsPageClient.tsx supprimé |
| V2 | Aucune référence restante |
| V3 | Build passe |
| V4 | Page /crm/leads fonctionne toujours |
| V5 | **GAIN : -1098 lignes de God Component** |

---

## 5.5 STEP 5 — Éclatement OpportunityDrawer (1021L)

### 5.5.0 Prompt Claude Code — Step 5

```

MISSION : ANALYSE ET ÉCLATEMENT DE OpportunityDrawer

CONTEXTE :
OpportunityDrawer est le deuxième God Component (1021 lignes).
Il doit être éclaté en composants features/ comme on l'a fait pour Leads.

ÉTAPE 1 — ANALYSE (AVANT toute modification) :

1. Ouvre le fichier OpportunityDrawer (localise-le d'abord)
2. Identifie :
   - Combien de useState ?
   - Quelles Server Actions sont appelées ?
   - Quels sous-composants logiques (header, tabs, forms, timeline) ?
   - Quelles données viennent du serveur vs UI state ?
3. Propose un plan d'éclatement en fichiers features/

ÉTAPE 2 — Ajout dans RESOURCE_CONFIG :

1. Ajouter "opportunities" dans le RESOURCE_CONFIG du DataProvider
2. Mapper vers les Server Actions existantes (getOpportunitiesAction, etc.)

ÉTAPE 3 — Création features/crm/opportunities/ :
Structure similaire à leads :
features/crm/opportunities/
├── types/opportunity.types.ts
├── schemas/opportunity.schema.ts
├── hooks/use-opportunities-table.ts
├── components/
│ ├── opportunity-drawer.tsx (~150L max)
│ ├── opportunity-header.tsx
│ ├── opportunity-tabs.tsx
│ ├── opportunity-timeline.tsx
│ └── opportunity-form.tsx

ÉTAPE 4 — Intégration dans les pages Opportunities

VALIDATION :

- Le drawer s'ouvre avec les bonnes données
- Les modifications sont sauvegardées
- Le cache est invalidé
- Build passe

```

### 5.5.1 Critères de validation Step 5

| # | Vérification |
|---|-------------|
| V1 | "opportunities" dans RESOURCE_CONFIG |
| V2 | Drawer fonctionne (ouvrir, afficher, éditer) |
| V3 | Build passe |
| V4 | **GAIN : ~1021L → ~500L réparties en fichiers de max 150L** |

---

## 5.6 STEP 6 — PipelineStageEditor générique (PipelineSettingsTab 1293L)

### 5.6.0 Prompt Claude Code — Step 6

```

MISSION : REFACTORING PipelineSettingsTab → PipelineStageEditor GÉNÉRIQUE

CONTEXTE :
PipelineSettingsTab contient 1293 lignes dont ~95% est identique entre
LeadStages et OpportunityStages. C'est de la duplication massive.

ANALYSE PRÉALABLE :

1. Ouvre PipelineSettingsTab (localise-le)
2. Compare le code LeadStages vs OpportunityStages
3. Identifie les différences (probablement : noms de stages, Server Actions)
4. Propose un composant générique paramétrable

COMPOSANT GÉNÉRIQUE :
features/crm/settings/components/pipeline-stage-editor.tsx

Props :

- entityType: "lead" | "opportunity"
- stages: Stage[] (données)
- onAdd: (stage) => void
- onUpdate: (id, stage) => void
- onDelete: (id) => void
- onReorder: (ids) => void

INSTANCIATION :

- features/crm/settings/components/lead-stages-tab.tsx (~40L)
  → Utilise PipelineStageEditor avec les Server Actions leads
- features/crm/settings/components/opportunity-stages-tab.tsx (~40L)
  → Utilise PipelineStageEditor avec les Server Actions opportunities

RÉSULTAT : 1293L → ~400L total (~480L PipelineStageEditor + 2×40L instances)

VALIDATION :

- Les deux onglets (Lead stages et Opportunity stages) fonctionnent
- Add/edit/delete/reorder stages fonctionne
- Build passe

```

### 5.6.1 Critères de validation Step 6

| # | Vérification |
|---|-------------|
| V1 | PipelineStageEditor créé et fonctionnel |
| V2 | Lead stages tab fonctionne |
| V3 | Opportunity stages tab fonctionne |
| V4 | Build passe |
| V5 | **GAIN : -893 lignes (1293 → ~400)** |

---

## 5.7 STEP 7 — Commit + Tag Phase 3

### 5.7.0 Prompt Claude Code — Step 7

```

MISSION : VALIDATION FINALE PHASE 3

CHECKLIST :

1. pnpm typecheck → 0 erreurs
2. pnpm build → succès
3. pnpm lint → 0 erreurs
4. Vérifie AUCUN Server Action modifié
5. Liste les God Components supprimés et leurs remplacements

MÉTRIQUES À RAPPORTER :

- LeadsPageClient.tsx : 1098L supprimées → remplacées par ~415L en 7 fichiers
- OpportunityDrawer : 1021L → ~500L en ~5 fichiers
- PipelineSettingsTab : 1293L → ~400L en 3 fichiers
- TOTAL SUPPRIMÉ : ~3412L → ~1315L = GAIN de ~2097 lignes (-61%)

Si tout passe : 6. git add -A 7. git commit -m "Phase 3: God Components éclatés + Zustand UI stores + Opportunities Refine" 8. git push 9. git tag post-phase-3 10. git push --tags

```

### 5.7.1 Validation Phase 3 complète

**VALIDATION DEMANDÉE**
- Environnement testé : local
- God Components supprimés : 3 (LeadsPageClient, OpportunityDrawer, PipelineSettingsTab)
- Lignes supprimées : ~3412
- Lignes remplaçantes : ~1315
- Gain net : ~2097 lignes (-61%)
- Zustand stores créés : 3-4
- Resources Refine ajoutées : opportunities
- Server Actions modifiées : AUCUNE
- Régression détectée : AUCUNE

**VALIDATION ACCORDÉE : OUI** — uniquement si toutes les pages CRM fonctionnent.

---

# 6. MATRICE DE DÉPENDANCES INTER-PHASES

```

Phase 1B.4 ──→ Phase 1C ──→ Phase 2 ──→ Phase 3
(Layout) (Refine) (DataTable (God Components + Leads) + Zustand)

Chaque phase DOIT être validée avant de passer à la suivante.
Aucun saut autorisé.

```

| Dépendance | De | Vers | Nature |
|------------|-----|------|--------|
| PageContainer | 1B.4 | 2, 3+ | Toutes les pages l'utilisent |
| `<Refine>` wrapper | 1C | 2, 3+ | Les hooks Refine nécessitent le provider |
| DataProvider | 1C | 2, 3+ | RESOURCE_CONFIG nécessaire pour useTable |
| DataTable (Kiranism) | 2 | 3+ | Pattern 1 réutilisé dans toutes les pages |
| features/crm/leads/ | 2 | 3 | Phase 3 refactorise ce qui a été créé en Phase 2 |
| Zustand stores | 3 | 4+ | UI state disponible pour toutes les phases suivantes |
| RESOURCE_CONFIG.opportunities | 3 | 6 | Phase 6 étend les opportunities |

---

# 7. PROTOCOLE DE DÉVIATION

> **Règle absolue :** La Specification V2 est la BOUSSOLE. Pas de déviation sans mise à jour.

## 7.1 Si une déviation est identifiée pendant l'exécution

| Étape | Action |
|-------|--------|
| 1 | STOP — arrêter l'exécution en cours |
| 2 | DOCUMENTER — décrire la déviation précisément |
| 3 | ANALYSER — pourquoi la spec ne fonctionne pas ? |
| 4 | PROPOSER — alternative avec justification |
| 5 | VALIDER — Mohamed valide la déviation |
| 6 | METTRE À JOUR — La Specification V2 devient V2.1 (ou V3) |
| 7 | REPRENDRE — continuer avec la spec mise à jour |

## 7.2 Ce qui constitue une déviation

- Modifier un fichier non listé dans le plan → DÉVIATION
- Créer un fichier non prévu → DÉVIATION
- Changer l'architecture d'un provider → DÉVIATION
- Modifier un Server Action → DÉVIATION CRITIQUE (interdit)
- Ajouter un package non prévu → DÉVIATION
- Changer l'ordre des steps → DÉVIATION

## 7.3 Ce qui N'EST PAS une déviation

- Ajuster le nombre de lignes d'un fichier (estimation vs réalité)
- Renommer un variable/fonction pour plus de clarté
- Ajouter un commentaire
- Corriger un import path

---

# 8. RÉCAPITULATIF CALENDRIER

| Phase | Steps | Durée estimée | Prérequis | Tag git |
|-------|-------|---------------|-----------|---------|
| Audit | 1 step | 0.5 jour | — | — |
| **1B.4** | 5 steps | 0.5-1 jour | Audit OK | `post-phase-1b` |
| **1C** | 8 steps | 1-2 jours | 1B.4 validé | `post-phase-1c` |
| **2** | 7 steps | 3-5 jours | 1C validé | `post-phase-2` |
| **3** | 7 steps | 3-4 jours | Phase 2 validé | `post-phase-3` |
| **TOTAL** | **28 steps** | **8-12.5 jours** | — | — |

### Jalons clés

| Jalon | Description | Quand |
|-------|------------|-------|
| 🏁 Layout complet | Header + Sidebar + PageContainer shadcnuikit | Fin Phase 1B.4 |
| ⚡ Refine opérationnel | Infrastructure prête, hooks disponibles | Fin Phase 1C |
| 📊 Premier pattern complet | DataTable + Leads = preuve de concept | Fin Phase 2 |
| 🧹 God Components éliminés | -61% de code, architecture propre | Fin Phase 3 |

---

> **Ce plan est le contrat d'exécution.** Chaque step a son prompt, ses critères, ses interdits. Toute déviation remonte au protocole Section 7. La Specification V2 reste la source de vérité absolue.

---

**Document créé le :** 14 Février 2026
**Version :** 1.0
**Basé sur :** FLEETCORE_FRONTEND_RESHAPING_SPECIFICATION_V2.md
**28 steps d'exécution, 8-12.5 jours estimés**
```
