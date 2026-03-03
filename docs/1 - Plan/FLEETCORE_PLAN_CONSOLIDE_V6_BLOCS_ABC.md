# FLEETCORE — PLAN CONSOLIDÉ V6

## Blocs A + B + C — Document Unique de Référence

**Version :** 6.2
**Date :** 03 mars 2026
**Statut :** 🔄 EN COURS — Bloc B Phase B2 (finalisation) → Bloc P ensuite
**Responsable :** Mohamed (CEO/CTO)
**Rédacteur :** Architecture Claude
**Remplace :** TOUS les plans précédents non terminés (V5.3 phases restantes, Step 2.3 Completion, Dashboard V4, Round 4, 6I-BIS, CLT Backlog, Backlog Phase 6E)
**Référence spec :** FLEETCORE_CRM_SPECIFICATION_V7_FINALE.md

---

## POURQUOI CE DOCUMENT

7 plans non terminés se sont accumulés en parallèle. Ce document les **fusionne en un seul plan séquentiel** avec 3 blocs ordonnés. Chaque tâche incomplète de chaque plan est rattrapée ici. Aucun plan antérieur ne doit être consulté pour l'exécution — ce document est autosuffisant.

---

## ⚡ CHANGEMENT V6.2 — PERFORMANCE EN PRIORITÉ ABSOLUE

**Constat (03/03/2026) :** L'application est lente partout (localhost ET production). 27 leads mettent 6 secondes à charger. Chaque API est appelée 2 fois. Les données statiques sont refetchées à chaque navigation. La Table fetche 90 colonnes au lieu de 20. 71% des pages n'ont pas de Suspense. 23 composants ont plus de 5 useState.

**Décision CEO :** La performance n'est pas cosmétique — c'est la condition d'existence du produit. Un outil lent à 34 leads est mort à 500. Un investisseur qui voit l'outil ramer ne signe pas. Un commercial retourne sur Excel.

**Impact sur le plan :** Un **Bloc P (Performance)** est inséré entre B2 et B3. RIEN ne continue tant que la performance n'est pas résolue. Critère Go/No-Go : chaque page < 2s, chaque interaction < 500ms, validé localhost ET production.

**Séquence :** B2 (finaliser) → **P (performance)** → B3 → B4 → ...

**Source :** PERF-AUDIT-001 (diagnostic Playwright) + PERF-FIX-001 (audit holistique 10 scans)

---

## LÉGENDE

| Symbole | Signification                            |
| ------- | ---------------------------------------- |
| ⬜      | Non commencé                             |
| 🔄      | En cours                                 |
| ✅      | Complété et validé                       |
| ❌      | Bloqué — nécessite décision CEO          |
| 🔧      | Corrigé après bug                        |
| 📌      | Origine — de quel plan vient cette tâche |

---

## PLANS ABSORBÉS — TRAÇABILITÉ

| Plan absorbé                           | Tâches restantes                                                 | Intégrées dans                                                          |
| -------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| V5.3 Phase 7 (Validation E2E 31 tests) | 31 tests non exécutés                                            | Bloc A — Phase A3                                                       |
| V5.3 Phase 8 (Réconciliation Kanban)   | Kanban incompatible                                              | **ABSORBÉ** — le CRM refonte (Bloc B) reconstruit entièrement le Kanban |
| Phase 6I Round 4 (Corrections)         | 12 items non implémentés                                         | Bloc A — Phase A1                                                       |
| Phase 6I-BIS (Audit fake features)     | DataTable standardisation                                        | Bloc A — Phase A1                                                       |
| CLT Backlog (A2-A5, B, C, D)           | Tables mal nommées + module Client                               | Bloc A — Phase A2 (tables) + Bloc C — Phase C5 (module)                 |
| Backlog Phase 6E (TD-05)               | SUPABASE_SCHEMA_REFERENCE                                        | Bloc A — Phase A4                                                       |
| Step 2.3 Completion (26 items)         | **OBSOLÈTE** — Cal.com décommissionné, CPT→BANT, pipeline refait | **ABSORBÉ** dans Bloc B intégralement                                   |
| Dashboard V4 Steps 2.5-2.12            | Fiche détail, notes, tags, import/export                         | Bloc C — Phase C3                                                       |
| CRM Execution Plan V1                  | Plan CRM initial 9 phases                                        | **BASE** du Bloc B — enrichi et intégré                                 |
| PERF-AUDIT-001 + PERF-FIX-001          | Diagnostic performance global + audit holistique                 | **Bloc P** — Performance (NOUVEAU V6.2)                                 |

---

# ═══════════════════════════════════════════════

# BLOC A — FERMER V5.3 PROPREMENT ✅

# ═══════════════════════════════════════════════

**Objectif :** Résoudre TOUS les bugs, dettes techniques et tâches incomplètes avant de toucher au CRM.
**Durée estimée :** 3-5 jours
**Statut : ✅ COMPLÉTÉ** — Tag `v-bloc-a-complete`, commit `a032e77`
**Pourquoi d'abord :** On ne construit pas un CRM enterprise sur des fondations qui ont des bugs connus.

---

## PHASE A1 — CORRECTIONS ADMIN/SETTINGS (6I Round 4 + 6I-BIS) ✅

**Statut : ✅ COMPLÉTÉ** — Inclus dans tag `v-bloc-a-complete`

_(Détail des sous-tâches A1.0 à A1.8 : toutes validées)_

---

## PHASE A2 — NETTOYAGE CLT TABLES ✅

**Statut : ✅ COMPLÉTÉ** — Inclus dans tag `v-bloc-a-complete`

---

## PHASE A3 — VALIDATION E2E (V5.3 Phase 7 allégée) ✅

**Statut : ✅ COMPLÉTÉ** — Inclus dans tag `v-bloc-a-complete`

---

## PHASE A4 — DOCUMENTATION ✅

**Statut : ✅ COMPLÉTÉ** — Inclus dans tag `v-bloc-a-complete`

---

## RÉSUMÉ BLOC A ✅

| Phase            | Description                                   | Durée         | Statut                 |
| ---------------- | --------------------------------------------- | ------------- | ---------------------- |
| **A1**           | Corrections Admin/Settings (Round 4 + 6I-BIS) | 2-3 jours     | ✅                     |
| **A2**           | Nettoyage tables CLT → BIL                    | 2-3h          | ✅                     |
| **A3**           | Validation E2E allégée (V5.3 Phase 7)         | 2-3h          | ✅                     |
| **A4**           | Documentation (SUPABASE_SCHEMA_REF + seeds)   | 1-2h          | ✅                     |
| **TOTAL BLOC A** |                                               | **3-5 jours** | ✅ `v-bloc-a-complete` |

---

# ═══════════════════════════════════════════════

# BLOC B — CRM FRAMEWORK STANDARD (LE GROS MORCEAU)

# ═══════════════════════════════════════════════

**Objectif :** Implémenter le CRM standard Salesforce BANT tel que spécifié dans V7 FINALE.
**Durée estimée :** 20-25 jours ouvrés
**Référence :** FLEETCORE_CRM_SPECIFICATION_V7_FINALE.md
**Prérequis :** Bloc A complété et validé. ✅
**Base :** FLEETCORE_CRM_EXECUTION_PLAN_V1.md enrichi avec les tâches des plans absorbés.

---

## PHASE B0 — AUDIT DU CODE EXISTANT ✅

**Objectif :** Cartographier l'état réel du code avant toute modification.
**Statut : ✅ COMPLÉTÉ** — Commit `f94877f`
**Durée estimée :** 1 jour.

_(Détail des sous-tâches B0.1 à B0.5 : toutes validées)_

---

## PHASE B1 — FONDATIONS LEAD + KANBAN V7 STABLE ✅

**Objectif :** DB et backend prêts pour le nouveau pipeline Lead BANT + Kanban 3 colonnes opérationnel.
**Statut : ✅ COMPLÉTÉ** — Tags `v-crm-phase1` + `v-crm-kanban-v7-stable`
**Durée estimée :** 2 jours.

### B1.1 Migration Base de Données ✅

| #      | Tâche                                                                                                                  | Statut | Commit  | Date  | Notes                       |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | ------ | ------- | ----- | --------------------------- |
| B1.1.1 | Ajouter 4 champs BANT sur crm_leads (SQL Supabase) : bant_budget, bant_authority, bant_need, bant_timeline VARCHAR(20) | ✅     | 17d2913 | 01/03 |                             |
| B1.1.2 | Ajouter bant_qualified_at (TIMESTAMPTZ), bant_qualified_by (UUID FK adm_members)                                       | ✅     | 17d2913 | 01/03 |                             |
| B1.1.3 | Ajouter opportunity_id (UUID FK crm_opportunities) si non existant                                                     | ✅     | 17d2913 | 01/03 | Lien lead → opportunity     |
| B1.1.4 | Prisma schema mise à jour manuelle                                                                                     | ✅     | 17d2913 | 01/03 | JAMAIS db push/pull/migrate |
| B1.1.5 | pnpm prisma generate                                                                                                   | ✅     | 17d2913 | 01/03 |                             |
| B1.1.6 | pnpm tsc --noEmit → 0 erreurs                                                                                          | ✅     | 17d2913 | 01/03 |                             |

### B1.2 Configuration Statuts Lead ✅

| #      | Tâche                                                                      | Statut | Commit  | Date  | Notes                                 |
| ------ | -------------------------------------------------------------------------- | ------ | ------- | ----- | ------------------------------------- |
| B1.2.1 | Ajouter status "qualified" dans crm_settings                               | ✅     | 17d2913 | 01/03 |                                       |
| B1.2.2 | Mettre à jour Zod schema pour inclure "qualified"                          | ✅     | 17d2913 | 01/03 |                                       |
| B1.2.3 | Mettre à jour useLeadStatuses hook                                         | ✅     | 17d2913 | 01/03 |                                       |
| B1.2.4 | Configurer transitions_to : callback_requested → qualified                 | ✅     | 17d2913 | 01/03 | LT4                                   |
| B1.2.5 | Configurer transitions_to : qualified → converted, nurturing, disqualified | ✅     | 17d2913 | 01/03 | LT7, LT9, LT10                        |
| B1.2.6 | SUPPRIMER status "lost" du module Lead                                     | ✅     | 17d2913 | 01/03 | Standard Salesforce                   |
| B1.2.7 | SUPPRIMER statuts "demo", "proposal_sent"                                  | ✅     | 17d2913 | 01/03 | Remplacés par stages Opportunity      |
| B1.2.8 | Migrer leads existants en status demo/proposal_sent                        | ✅     | 17d2913 | 01/03 | 27 leads migrés vers statuts V7       |
| B1.2.9 | 📌 SUPPRIMER CPT scoring (service, hooks, composants)                      | ✅     | 17d2913 | 01/03 | _Step 2.3 item 7_ — remplacé par BANT |

### B1.3 Validation transitions_to backend ✅

| #      | Tâche                                                              | Statut | Commit  | Date  | Notes                                      |
| ------ | ------------------------------------------------------------------ | ------ | ------- | ----- | ------------------------------------------ |
| B1.3.1 | Identifier lead.actions.ts (updateLeadStatusAction)                | ✅     | 17d2913 | 01/03 | Écart audit V7 corrigé                     |
| B1.3.2 | Ajouter validation transitions_to AVANT changement statut          | ✅     | 17d2913 | 01/03 | 🔧 Fix: allowed_transitions→transitions_to |
| B1.3.3 | Tester transitions invalides bloquées (new → qualified = interdit) | ✅     | 17d2913 | 01/03 |                                            |

### B1.4 Livrable Phase B1 ✅

| #      | Tâche                                                | Statut | Notes                  |
| ------ | ---------------------------------------------------- | ------ | ---------------------- |
| B1.4.1 | Git tag v-crm-phase1                                 | ✅     | commit 17d2913         |
| B1.4.2 | Push + CI verte                                      | ✅     |                        |
| B1.4.3 | SELECT DISTINCT status FROM crm_leads → bons statuts | ✅     | 7 statuts V7 confirmés |
| B1.4.4 | Validation CEO                                       | ✅     |                        |

### B1.5 Kanban V7 Stabilisation + Performance ✅

**Ajouté post-B1** — Kanban 3 colonnes + outcomes bar + 4 optimisations performance.
**Tag :** `v-crm-kanban-v7-stable`, commit `a4ca69c`

| #       | Tâche                                                                         | Statut | Commit  | Date  | Notes                            |
| ------- | ----------------------------------------------------------------------------- | ------ | ------- | ----- | -------------------------------- |
| B1.5.1  | Kanban 3 colonnes : Email Verified, Callback Requested, Qualified             | ✅     | a4ca69c | 02/03 | Décision CEO : 3 colonnes, pas 2 |
| B1.5.2  | Barre outcomes : Nurturing (count) / Disqualified (count) avec clic-to-filter | ✅     | a4ca69c | 02/03 |                                  |
| B1.5.3  | Compteurs badges colorés par colonne                                          | ✅     | a4ca69c | 02/03 |                                  |
| B1.5.4  | Lead codes inline (badge pill)                                                | ✅     | a4ca69c | 02/03 |                                  |
| B1.5.5  | Fix1 perf : SWR fallbackData + dedup 5min (0 requête bloquante)               | ✅     | a4ca69c | 02/03 |                                  |
| B1.5.6  | Fix2 perf : SELECT partiel Kanban (90→15 champs via meta.select)              | ✅     | a4ca69c | 02/03 |                                  |
| B1.5.7  | Fix3/3B perf : Outcome click filtre via React props (zéro URL pollution)      | ✅     | a4ca69c | 02/03 | 🔧 2 itérations                  |
| B1.5.8  | Fix4 perf : Static imports remplacent next/dynamic ssr:false                  | ✅     | a4ca69c | 02/03 |                                  |
| B1.5.9  | Cal.com cleanup : 20 fichiers supprimés                                       | ✅     | 17d2913 | 01/03 | Décommissionnement partiel       |
| B1.5.10 | tsc + build PASS                                                              | ✅     | a4ca69c | 02/03 |                                  |

---

## PHASE B2 — UI LEAD BANT 🔄

**Objectif :** Formulaire qualification BANT dans le Drawer + finalisation actions Lead V7.
**Prérequis :** Phase B1. ✅
**Durée estimée :** 2 jours.
**Statut :** 🔄 EN COURS

**⚠️ CHANGEMENT vs plan initial :** Le Kanban était prévu à 2 colonnes (B2.2). Le CEO a décidé **3 colonnes** (email_verified, callback_requested, qualified). Le Kanban 3 colonnes + outcomes + perf sont **déjà livrés** dans B1.5. La phase B2 se concentre donc sur :

- B2.1 : Formulaire BANT ✅ (5514573)
- B2.2 : Kanban — items restants uniquement (drag & drop, tooltips)
- B2.3 : Actions Lead V7 ✅ (5514573 + 13c8c74)
- B2.4 : Nettoyage affichage (CPT scoring encore visible sur cartes)
- B2.5 : Drawer refonte useOne ✅ (13c8c74)
- B2.6 : Data provider custom CRM ✅ (13c8c74)
- B2.7 : Audit Clerk ID→UUID ✅ (13c8c74)

### B2.1 Formulaire BANT

| #      | Tâche                                                                    | Statut | Commit  | Date  | Notes                     |
| ------ | ------------------------------------------------------------------------ | ------ | ------- | ----- | ------------------------- |
| B2.1.1 | Identifier pattern LeadDrawer.tsx (onglets, sections) — LIRE avant coder | ✅     | 5514573 | 02/03 |                           |
| B2.1.2 | Créer onglet/section "Qualification" dans le Lead Drawer                 | ✅     | 5514573 | 02/03 |                           |
| B2.1.3 | 4 dropdowns BANT avec valeurs spec V7                                    | ✅     | 5514573 | 02/03 |                           |
| B2.1.4 | Indicateur visuel "3/4 OK" ou "4/4 — Prêt pour conversion"               | ✅     | 5514573 | 02/03 |                           |
| B2.1.5 | Bouton "Qualify" → validation BANT côté serveur                          | ✅     | 5514573 | 02/03 |                           |
| B2.1.6 | Status change uniquement si 4/4                                          | ✅     | 5514573 | 02/03 |                           |
| B2.1.7 | Gestion 3/4 (nurturing) et ≤2/4 (disqualify, sauf fleet_size >50)        | ✅     | 5514573 | 02/03 |                           |
| B2.1.8 | Labels UI EXPLICITES pour utilisateur métier                             | ✅     | 5514573 | 02/03 | POSTURE ARCHITECTE SENIOR |

### B2.2 Kanban Lead — 3 colonnes

| #      | Tâche                                                                    | Statut | Commit  | Date  | Notes                                   |
| ------ | ------------------------------------------------------------------------ | ------ | ------- | ----- | --------------------------------------- |
| B2.2.1 | Identifier hook useLeadsKanban et composant Kanban                       | ✅     | a4ca69c | 02/03 | Fait en B1.5                            |
| B2.2.2 | 3 colonnes : Email Verified, Callback Requested, Qualified               | ✅     | a4ca69c | 02/03 | Décision CEO : 3 colonnes               |
| B2.2.3 | Barre outcomes : Nurturing (count) / Disqualified (count)                | ✅     | a4ca69c | 02/03 | Fait en B1.5                            |
| B2.2.4 | ~~Leads new/email_verified HORS Kanban~~ → email_verified DANS le Kanban | ✅     | a4ca69c | 02/03 | Décision CEO changée                    |
| B2.2.5 | Drag & drop 7 transitions avec mini-popups                               | 🔄     | af3119b | 03/03 | DnD OK, régression OutcomesBar corrigée |
| B2.2.6 | Compteurs par colonne                                                    | ✅     | a4ca69c | 02/03 | Fait en B1.5                            |
| B2.2.7 | 📌 Popup au DROP pas au DRAG                                             | ✅     | af3119b | 03/03 | 4 mini-popups implémentés               |
| B2.2.8 | 📌 Infobulles (tooltips) sur icônes Rapport d'Activité                   | ⬜     |         |       | _Step 2.3 item 4_                       |

### B2.3 Actions Lead — Adaptation

| #      | Tâche                                                                   | Statut | Commit  | Date  | Notes                            |
| ------ | ----------------------------------------------------------------------- | ------ | ------- | ----- | -------------------------------- |
| B2.3.1 | "Convert to Opportunity" UNIQUEMENT si qualified                        | ✅     | 5514573 | 02/03 | V7 status→actions mapping        |
| B2.3.2 | "Reactivate" → callback_requested uniquement                            | ✅     | 5514573 | 02/03 | nurturing→reactivate             |
| B2.3.3 | Context menu filtré selon transitions_to                                | ✅     | 5514573 | 02/03 | getValidTransitions()            |
| B2.3.4 | SUPPRIMER Book Demo de l'UI Lead                                        | ✅     | 17d2913 | 02/03 | Cal.com décommissionné en B1     |
| B2.3.5 | SUPPRIMER "Not Interested" → Disqualify + Nurturing séparés             | ✅     | 5514573 | 02/03 | V7 actions: nurturing/disqualify |
| B2.3.6 | 📌 Croix (X) correctement placée dans le popup                          | ⬜     |         |       | _Step 2.3 item 1_                |
| B2.3.7 | 📌 Section PROCHAINES ÉTAPES — couleur distincte, zone d'action visible | ✅     | 5514573 | 02/03 | getStatusSectionBg()             |

### B2.4 Nettoyage affichage

| #      | Tâche                                                             | Statut | Commit | Date | Notes            |
| ------ | ----------------------------------------------------------------- | ------ | ------ | ---- | ---------------- |
| B2.4.1 | Supprimer score CPT des cartes Kanban (score "90" encore visible) | ⬜     |        |      | Audit B2.0-VERIF |
| B2.4.2 | Uniformiser l'affichage des cartes entre les 3 colonnes           | ⬜     |        |      |                  |
| B2.4.3 | Supprimer sections CPT du Lead Drawer (ScoreGauge, etc.)          | ⬜     |        |      |                  |
| B2.4.4 | Recalibrer indicateurs overdue pour SLA V7                        | ⬜     |        |      |                  |

### B2.5 Drawer refonte useOne (NOUVEAU)

| #      | Tâche                                                       | Statut | Commit  | Date  | Notes                              |
| ------ | ----------------------------------------------------------- | ------ | ------- | ----- | ---------------------------------- |
| B2.5.1 | LeadDrawer: useOne single source (zero dual-source pattern) | ✅     | 13c8c74 | 03/03 | Remplace lead prop + currentLead   |
| B2.5.2 | dirtyRef: conditional Kanban invalidation on close          | ✅     | 13c8c74 | 03/03 | Zero refetch inutile               |
| B2.5.3 | BantEditMode: key prop pour React state sync                | ✅     | 13c8c74 | 03/03 | Pas de useEffect sync              |
| B2.5.4 | kanbanFields: 14→20 champs (+6 BANT, zero delay)            | ✅     | 13c8c74 | 03/03 | BANT visible dès ouverture drawer  |
| B2.5.5 | Fix handleCancelConfirmation missing onMutationSuccess      | ✅     | 13c8c74 | 03/03 | BANT sauvé mais useOne pas refetch |

### B2.6 Data provider custom CRM (NOUVEAU)

| #      | Tâche                                                        | Statut | Commit  | Date  | Notes                                 |
| ------ | ------------------------------------------------------------ | ------ | ------- | ----- | ------------------------------------- |
| B2.6.1 | qualifyLead() via fetchApi (POST /crm/leads/:id/qualify)     | ✅     | 13c8c74 | 03/03 | Remplace raw fetch() dans BantSection |
| B2.6.2 | patchLeadStatus() via fetchApi (PATCH /crm/leads/:id/status) | ✅     | 13c8c74 | 03/03 | Remplace raw fetch() dans BantSection |
| B2.6.3 | Mutations unifiées: zero raw fetch() dans composants drawer  | ✅     | 13c8c74 | 03/03 | onMutationSuccess callback pattern    |

### B2.7 Audit Clerk ID→UUID (NOUVEAU)

| #      | Tâche                                                        | Statut | Commit  | Date  | Notes                         |
| ------ | ------------------------------------------------------------ | ------ | ------- | ----- | ----------------------------- |
| B2.7.1 | 20+ fixes Clerk ID→UUID across services (billing, crm, auth) | ✅     | 13c8c74 | 03/03 | resolveMemberId() pattern     |
| B2.7.2 | api-guard.ts: memberId resolution                            | ✅     | 13c8c74 | 03/03 | Clerk userId → adm_members.id |
| B2.7.3 | base.repository.ts: userId fallback                          | ✅     | 13c8c74 | 03/03 | Compatibilité FK UUID         |

### B2.8 DnD 7 transitions + régression fix (NOUVEAU)

| #      | Tâche                                                                  | Statut | Commit  | Date  | Notes                                        |
| ------ | ---------------------------------------------------------------------- | ------ | ------- | ----- | -------------------------------------------- |
| B2.8.1 | DRAG_ROUTES : 7 transitions validées par CEO                           | ✅     | af3119b | 03/03 | Spec complète 7 drags                        |
| B2.8.2 | 4 mini-popups : CompleteProfile, Qualify, Nurturing, Disqualify        | ✅     | af3119b | 03/03 | shadcn, i18n, loading, error handling        |
| B2.8.3 | OutcomesBar restauré (double-clic navigation, hasAny, style tokens)    | ✅     | af3119b | 03/03 | 🔧 Régression corrigée — suppression annulée |
| B2.8.4 | Outcomes droppables via useDroppable (INSIDE DndContext, style intact) | ✅     | af3119b | 03/03 | useDroppable sur boutons existants           |
| B2.8.5 | DragDisqualifyDialog : native checkbox→shadcn Checkbox                 | ✅     | af3119b | 03/03 | + DisqualifyLeadModal aligné                 |
| B2.8.6 | Navigation viewMode+outcomeFilter dans URL (query params)              | ✅     | af3119b | 03/03 | PERF-FIX-001 A5 — back button fonctionne     |

### B2.9 Livrable Phase B2

| #      | Tâche                                                 | Statut | Notes                                   |
| ------ | ----------------------------------------------------- | ------ | --------------------------------------- |
| B2.9.1 | Git tag v-crm-b2-complete                             | ⬜     | Après finalisation B2.2.8, B2.3.6, B2.4 |
| B2.9.2 | Push + CI verte                                       | ⬜     |                                         |
| B2.9.3 | Test : Kanban Lead 3 colonnes + 7 drags fonctionnels  | 🔄     |                                         |
| B2.9.4 | Test : BANT form → qualification OK                   | ✅     | 4/4 qualify + 3/4 nurturing             |
| B2.9.5 | Test : Back button depuis vue filtrée → retour Kanban | ✅     | PERF-FIX-001 A5                         |
| B2.9.6 | Test : OutcomesBar navigation double-clic fonctionne  | ✅     | Régression corrigée af3119b             |
| B2.9.7 | Validation CEO                                        | ⬜     |                                         |

---

---

# ═══════════════════════════════════════════════

# ⚡ BLOC P — PERFORMANCE (PRIORITÉ ABSOLUE)

# ═══════════════════════════════════════════════

**Objectif :** Rendre FleetCore rapide partout. Chaque page < 2s. Chaque interaction < 500ms. Prêt pour 5000 utilisateurs.
**Durée estimée :** 3-5 jours
**Prérequis :** B2 finalisé.
**Pourquoi AVANT B3 :** Un outil lent est un outil mort. Chaque feature ajoutée sur des fondations lentes aggrave le problème. On corrige la base MAINTENANT.
**Source :** PERF-AUDIT-001 (diagnostic) + PERF-FIX-001 Phase B (audit holistique)
**Critère de sortie :** Chaque page < 2s, chaque interaction < 500ms, mesuré localhost ET production Vercel. Test de charge validé à 500 leads. Si le critère n'est pas atteint, on ne passe PAS à B3.

---

## PHASE P1 — CORRECTIONS GLOBALES REACT QUERY / REFINE ✅ (partiel)

**Objectif :** Éliminer les doublons API et configurer le caching différencié.

| #    | Tâche                                                                  | Statut | Commit  | Date  | Notes                                                    |
| ---- | ---------------------------------------------------------------------- | ------ | ------- | ----- | -------------------------------------------------------- |
| P1.1 | staleTime 30s global dans refine-provider.tsx                          | ✅     | af3119b | 03/03 | PERF-FIX-001 A1 — élimine doublons API                   |
| P1.2 | refetchOnWindowFocus: false global                                     | ✅     | af3119b | 03/03 | PERF-FIX-001 A1                                          |
| P1.3 | refetchInterval 60s sur Kanban leads                                   | ✅     | af3119b | 03/03 | PERF-FIX-001 A2 — inscriptions portail visibles en <1min |
| P1.4 | meta.select dynamique sur Table leads                                  | ✅     | af3119b | 03/03 | PERF-FIX-001 A3 — payload 50KB→13KB (-75%)               |
| P1.5 | dedupingInterval 5min sur hooks statiques (stages, fleet_size_options) | ✅     | af3119b | 03/03 | PERF-FIX-001 A4                                          |
| P1.6 | Stabiliser filter references nuqs (doublons résiduels Table/Outcome)   | ⬜     |         |       | Query key change entre 1er/2e render                     |

---

## PHASE P2 — META.SELECT SUR TOUS LES HOOKS

**Objectif :** Aucun useList/useOne/useMany ne fetche toutes les colonnes.
**Source :** Audit holistique Problème 1 — 6 hooks sans select identifiés.

| #    | Tâche                                                         | Statut | Notes                         |
| ---- | ------------------------------------------------------------- | ------ | ----------------------------- |
| P2.1 | use-invitations-table.ts : ajouter meta.select                | ⬜     | Settings — ALL fields fetched |
| P2.2 | use-members-table.ts : ajouter meta.select                    | ⬜     | Settings — ALL fields fetched |
| P2.3 | use-tenants-table.ts : ajouter meta.select                    | ⬜     | Settings — ALL fields fetched |
| P2.4 | use-tenant-countries-table.ts : ajouter meta.select           | ⬜     | Settings — ALL fields fetched |
| P2.5 | LeadDrawer.tsx useOne : ajouter meta.select (drawerFields)    | ⬜     | Commercial ouvre 50x/jour     |
| P2.6 | leads-edit-drawer.tsx useOne : ajouter meta.select            | ⬜     | Full payload pour 1 lead      |
| P2.7 | Scanner nouveaux hooks ajoutés depuis audit → vérifier select | ⬜     |                               |

---

## PHASE P3 — ÉLIMINER LES ANTI-PATTERNS

**Objectif :** Remplacer les useEffect+fetch par des hooks Refine, réduire les re-renders.

| #    | Tâche                                                              | Statut | Notes               |
| ---- | ------------------------------------------------------------------ | ------ | ------------------- |
| P3.1 | company-profile-page.tsx : useEffect+fetch → useOne Refine         | ⬜     | Anti-pattern Refine |
| P3.2 | tenant-detail-page.tsx : useEffect+fetch → useOne Refine           | ⬜     | Anti-pattern Refine |
| P3.3 | useOpportunityStatuses : staleTime 30min (données quasi-statiques) | ⬜     | Actuellement 60s    |
| P3.4 | useLeadLossReasons : staleTime 30min (données quasi-statiques)     | ⬜     | Actuellement 60s    |

---

## PHASE P4 — LOADING SKELETONS CRM

**Objectif :** Zéro écran blanc. Chaque page affiche un skeleton immédiat pendant le chargement.
**Source :** Audit holistique Problème 4 — 71% des pages sans Suspense.

| #    | Tâche                                                                                   | Statut | Notes                             |
| ---- | --------------------------------------------------------------------------------------- | ------ | --------------------------------- |
| P4.1 | Créer composants skeleton réutilisables (KanbanSkeleton, TableSkeleton, DrawerSkeleton) | ⬜     |                                   |
| P4.2 | Kanban leads : skeleton au chargement initial                                           | ⬜     | Page la plus utilisée             |
| P4.3 | Table leads : skeleton au chargement initial                                            | ⬜     |                                   |
| P4.4 | Dashboard CRM : skeleton                                                                | ⬜     |                                   |
| P4.5 | Pages admin (members, tenants, invitations, countries) : skeletons                      | ⬜     | 7 pages, 0% Suspense actuellement |
| P4.6 | Suspense boundaries sur pages CRM principales                                           | ⬜     | 9% → 80%+ couverture              |

---

## PHASE P5 — DÉCOMPOSITION COMPOSANTS CRITIQUES

**Objectif :** Réduire les re-renders en cassant les méga-composants.
**Source :** Audit holistique Problème 3 — 23 composants >5 useState.

| #    | Tâche                                                                 | Statut | Notes                             |
| ---- | --------------------------------------------------------------------- | ------ | --------------------------------- |
| P5.1 | PipelineSettingsTab.tsx (25 useState) → décomposer en sous-composants | ⬜     | CRITIQUE — admin pipeline         |
| P5.2 | LeadsPageClient.tsx (24 useState) → décomposer en sous-composants     | ⬜     | CRITIQUE — page quotidienne       |
| P5.3 | QuotesPageClient.tsx (14 useState) → évaluer décomposition            | ⬜     | HAUTE                             |
| P5.4 | LeadsBrowserClient.tsx (12 useState) → évaluer décomposition          | ⬜     | HAUTE                             |
| P5.5 | OpportunitiesPageClient.tsx (12 useState) → évaluer décomposition     | ⬜     | HAUTE                             |
| P5.6 | Ajouter useMemo/useCallback sur les composants à risque               | ⬜     | Audit montrait faible utilisation |

---

## PHASE P6 — OPTIMISATIONS INFRASTRUCTURE

**Objectif :** Réduire les temps de réponse côté serveur.

| #    | Tâche                                                                      | Statut | Notes                             |
| ---- | -------------------------------------------------------------------------- | ------ | --------------------------------- |
| P6.1 | Vérifier connexion DB pooler (port 6543) vs directe (5432)                 | ⬜     | Pooler = moins de cold starts     |
| P6.2 | Prisma singleton vérifié et optimisé                                       | ⬜     |                                   |
| P6.3 | next.config : vérifier optimisations (serverActions, experimental)         | ⬜     |                                   |
| P6.4 | API routes CRM (696 lignes leads/route.ts) : évaluer split                 | ⬜     | Cold start Vercel                 |
| P6.5 | Activer Redis (Upstash) pour données référentielles (countries, platforms) | ⬜     | Prévu dans roadmap, jamais activé |

---

## PHASE P7 — MESURES + VALIDATION

**Objectif :** Prouver que les corrections ont un impact mesurable.

| #    | Tâche                                                              | Statut | Notes                                        |
| ---- | ------------------------------------------------------------------ | ------ | -------------------------------------------- |
| P7.1 | Mesures Playwright AVANT (baseline = PERF-AUDIT-001)               | ✅     | Kanban 5.6s, Table 6s, Outcome 4.7s          |
| P7.2 | Mesures après P1 (déjà fait)                                       | ✅     | Kanban 3.3s (-41%), payload -75%             |
| P7.3 | Mesures après P2+P3                                                | ⬜     |                                              |
| P7.4 | Mesures après P4+P5                                                | ⬜     |                                              |
| P7.5 | Mesures après P6                                                   | ⬜     |                                              |
| P7.6 | Test de charge : 50 leads, 200 leads, 500 leads — temps de réponse | ⬜     | Simuler croissance réelle                    |
| P7.7 | Mesure production Vercel (pas seulement localhost)                 | ⬜     | Les deux environnements doivent être rapides |
| P7.8 | Cible finale : chaque page < 2s, chaque interaction < 500ms        | ⬜     | **Critère Go/No-Go pour B3**                 |

---

## RÉSUMÉ BLOC P

| Phase            | Description                              | Durée         | Prérequis | Statut                    |
| ---------------- | ---------------------------------------- | ------------- | --------- | ------------------------- |
| **P1**           | React Query staleTime + caching          | 2h            | B2        | ✅ (partiel P1.6 restant) |
| **P2**           | meta.select sur tous les hooks           | 2-3h          | P1        | ⬜                        |
| **P3**           | Éliminer anti-patterns (useEffect+fetch) | 1-2h          | P1        | ⬜                        |
| **P4**           | Loading skeletons CRM                    | 3-4h          | P2        | ⬜                        |
| **P5**           | Décomposition méga-composants            | 1-2 jours     | P4        | ⬜                        |
| **P6**           | Optimisations infrastructure             | 2-3h          | P1        | ⬜                        |
| **P7**           | Mesures + validation                     | Continue      | Toutes    | 🔄 (P7.1-P7.2 done)       |
| **TOTAL BLOC P** |                                          | **3-5 jours** |           |                           |

---

## PHASE B3 — CONVERSION ENRICHIE (3 entités)

**Objectif :** Lead → Account + Contact + Opportunity.
**Prérequis :** Phase B2 + **Bloc P complété (Go/No-Go validé)**.
**Durée estimée :** 2 jours.

### B3.1 Backend Conversion

| #      | Tâche                                                         | Statut | Commit | Date | Notes                             |
| ------ | ------------------------------------------------------------- | ------ | ------ | ---- | --------------------------------- |
| B3.1.1 | Identifier code conversion T10 existant                       | ⬜     |        |      |                                   |
| B3.1.2 | Enrichir : créer Account (crm_companies)                      | ⬜     |        |      | company_name, country, fleet_size |
| B3.1.3 | Enrichir : créer Contact (crm_contacts)                       | ⬜     |        |      | full_name, email, phone           |
| B3.1.4 | Enrichir : Opportunity à stage = "discovery"                  | ⬜     |        |      |                                   |
| B3.1.5 | Calcul expected_value = fleet_size × prix (adm_settings) × 12 | ⬜     |        |      | Prix JAMAIS hardcodé              |
| B3.1.6 | Lead.status = converted, converted_at, opportunity_id         | ⬜     |        |      |                                   |
| B3.1.7 | Transaction atomique (3 entités dans 1 transaction)           | ⬜     |        |      |                                   |
| B3.1.8 | Gestion doublon : crm_companies existe déjà → rattacher       | ⬜     |        |      |                                   |

### B3.2 UI Conversion

| #      | Tâche                                             | Statut | Commit | Date | Notes |
| ------ | ------------------------------------------------- | ------ | ------ | ---- | ----- |
| B3.2.1 | Modal conversion avec expected_value auto-calculé | ⬜     |        |      |       |
| B3.2.2 | Champs : expected_close_date, plan_type, notes    | ⬜     |        |      |       |
| B3.2.3 | Badge "Converted" + lien vers opportunity         | ⬜     |        |      |       |
| B3.2.4 | Lead disparaît du Kanban Lead après conversion    | ⬜     |        |      |       |

### B3.3 Livrable Phase B3

| #      | Tâche                                                    | Statut | Notes |
| ------ | -------------------------------------------------------- | ------ | ----- |
| B3.3.1 | Git tag v-crm-phase3                                     | ⬜     |       |
| B3.3.2 | Test : Lead qualified → Convert → 3 entités créées en DB | ⬜     |       |
| B3.3.3 | Validation CEO                                           | ⬜     |       |

---

## PHASE B4 — PIPELINE OPPORTUNITY ADAPTÉ

**Objectif :** 4 stages + 2 outcomes + Kanban Opportunity.
**Prérequis :** Phase B3.
**Durée estimée :** 2 jours.

### B4.1 Migration Stages Opportunity

| #      | Tâche                                                                    | Statut | Commit | Date | Notes |
| ------ | ------------------------------------------------------------------------ | ------ | ------ | ---- | ----- |
| B4.1.1 | Créer stage "discovery" dans crm_settings                                | ⬜     |        |      |       |
| B4.1.2 | Probabilités : discovery=20%, proposal=50%, negotiation=75%, closing=90% | ⬜     |        |      |       |
| B4.1.3 | Retirer stages "prospecting" et "qualification" du Kanban                | ⬜     |        |      |       |
| B4.1.4 | Migrer opportunities existantes → "discovery"                            | ⬜     |        |      |       |
| B4.1.5 | Mettre à jour Zod schema opportunity stages                              | ⬜     |        |      |       |

### B4.2 Kanban Opportunity — 4 colonnes

| #      | Tâche                                                                                   | Statut | Commit | Date | Notes |
| ------ | --------------------------------------------------------------------------------------- | ------ | ------ | ---- | ----- |
| B4.2.1 | Kanban 4 colonnes : Discovery, Proposal, Negotiation, Closing                           | ⬜     |        |      |       |
| B4.2.2 | Barre outcomes : Won (€X, Y deals) / Lost (Z deals)                                     | ⬜     |        |      |       |
| B4.2.3 | Stat cards : Total Open, Pipeline Value, Weighted Value, Rotting Deals                  | ⬜     |        |      |       |
| B4.2.4 | Drag & drop avec validation transitions                                                 | ⬜     |        |      |       |
| B4.2.5 | Compteurs : count, somme expected_value, probability                                    | ⬜     |        |      |       |
| B4.2.6 | Cards : company name, expected_value, probability bar, assigned_to, expected_close_date | ⬜     |        |      |       |

### B4.3 Livrable Phase B4

| #      | Tâche                                          | Statut | Notes |
| ------ | ---------------------------------------------- | ------ | ----- |
| B4.3.1 | Git tag v-crm-phase4                           | ⬜     |       |
| B4.3.2 | Test : Kanban Opportunity 4 colonnes           | ⬜     |       |
| B4.3.3 | Test : conversion lead → apparaît en Discovery | ⬜     |       |
| B4.3.4 | Validation CEO                                 | ⬜     |       |

---

## PHASE B5 — DÉCOMMISSIONNEMENT CAL.COM + CALENDRIER GMAIL

**Objectif :** Cal.com supprimé intégralement. Solution custom calendrier.
**Prérequis :** Phase B4.
**Durée estimée :** 2-3 jours.

**Note :** Décommissionnement partiel déjà fait en B1.5.9 (20 fichiers Cal.com supprimés). Reste à vérifier zéro référence + wizard simplifié + solution calendrier Gmail.

### B5.1 Suppression Cal.com

📌 _Source : Décision CEO 27/02/2026 + Step 2.3 items 13, 16, 17, 18_

| #      | Tâche                                                | Statut | Commit  | Date  | Notes                       |
| ------ | ---------------------------------------------------- | ------ | ------- | ----- | --------------------------- |
| B5.1.1 | grep récursif Cal.com → identifier TOUS les fichiers | ✅     | 17d2913 | 01/03 | Fait en B1.5.9              |
| B5.1.2 | Retirer Cal.com du wizard prospect                   | ⬜     |         |       | À vérifier post-suppression |
| B5.1.3 | Retirer webhooks Cal.com (route.ts handlers)         | ✅     | 17d2913 | 01/03 | 20 fichiers supprimés       |
| B5.1.4 | Retirer dépendances npm Cal.com                      | ⬜     |         |       | Vérifier package.json       |
| B5.1.5 | Retirer variables d'environnement Cal.com            | ⬜     |         |       | .env files                  |
| B5.1.6 | T5 : wizard complete → TOUJOURS callback_requested   | ⬜     |         |       | Plus de branchement booking |
| B5.1.7 | pnpm build → SUCCESS après suppression               | ⬜     |         |       |                             |

### B5.2 Solution Custom Calendrier Gmail

| #      | Tâche                                                       | Statut | Commit | Date | Notes             |
| ------ | ----------------------------------------------------------- | ------ | ------ | ---- | ----------------- |
| B5.2.1 | Analyse options techniques (Google Calendar API, Gmail API) | ⬜     |        |      |                   |
| B5.2.2 | Design UX solution custom                                   | ⬜     |        |      | ❌ VALIDATION CEO |
| B5.2.3 | Implémentation backend                                      | ⬜     |        |      |                   |
| B5.2.4 | Implémentation frontend                                     | ⬜     |        |      |                   |
| B5.2.5 | Tests end-to-end                                            | ⬜     |        |      |                   |

### B5.3 Livrable Phase B5

| #      | Tâche                                        | Statut | Notes |
| ------ | -------------------------------------------- | ------ | ----- |
| B5.3.1 | Git tag v-crm-phase5                         | ⬜     |       |
| B5.3.2 | ZÉRO référence Cal.com dans codebase         | ⬜     |       |
| B5.3.3 | Wizard → callback_requested (pas de booking) | ⬜     |       |
| B5.3.4 | Validation CEO                               | ⬜     |       |

---

## PHASE B6 — QUOTE-TO-CASH CONNECTION

**Objectif :** Accept/Reject email + Stripe payment → Won automatique.
**Prérequis :** Phase B4 (indépendant de B5).
**Durée estimée :** 3-4 jours.

### B6.1 Email Quote avec Accept/Reject

| #      | Tâche                                                             | Statut | Commit | Date | Notes |
| ------ | ----------------------------------------------------------------- | ------ | ------ | ---- | ----- |
| B6.1.1 | SQL : accept_token, reject_token sur crm_quotes                   | ⬜     |        |      |       |
| B6.1.2 | SQL : resend_count, last_resent_at sur crm_quotes                 | ⬜     |        |      |       |
| B6.1.3 | Générer tokens uniques à l'envoi                                  | ⬜     |        |      |       |
| B6.1.4 | Page publique /quotes/accept/[token]                              | ⬜     |        |      |       |
| B6.1.5 | Page publique /quotes/reject/[token]                              | ⬜     |        |      |       |
| B6.1.6 | Template email avec ✅ Accepter / ❌ Refuser                      | ⬜     |        |      |       |
| B6.1.7 | Accepter : Quote→accepted + Opportunity→closing + redirect Stripe | ⬜     |        |      | OT3   |
| B6.1.8 | Refuser : Quote→rejected + Opportunity→negotiation + notification | ⬜     |        |      | OT4   |

### B6.2 Resend Quote

| #      | Tâche                                                                  | Statut | Commit | Date | Notes |
| ------ | ---------------------------------------------------------------------- | ------ | ------ | ---- | ----- |
| B6.2.1 | Bouton "Resend Quote" dans Drawer Opportunity (proposal + negotiation) | ⬜     |        |      |       |
| B6.2.2 | Renvoie même email, mêmes tokens, même quote                           | ⬜     |        |      |       |
| B6.2.3 | Incrémente resend_count, met à jour last_resent_at                     | ⬜     |        |      |       |
| B6.2.4 | Log activité : "Quote [ref] resent to [email]"                         | ⬜     |        |      |       |

### B6.3 Quote Expiration → Auto Negotiation

| #      | Tâche                                                                | Statut | Commit | Date | Notes |
| ------ | -------------------------------------------------------------------- | ------ | ------ | ---- | ----- |
| B6.3.1 | CRON RM-QOT-005 : quote expiré → auto-move opportunity → negotiation | ⬜     |        |      | OT5   |
| B6.3.2 | Notification urgente commercial quand quote expire                   | ⬜     |        |      |       |

### B6.4 Stripe Integration → Won automatique

| #      | Tâche                                                                        | Statut | Commit | Date | Notes                   |
| ------ | ---------------------------------------------------------------------------- | ------ | ------ | ---- | ----------------------- |
| B6.4.1 | Webhook Stripe payment_intent.succeeded ou checkout.session.completed        | ⬜     |        |      |                         |
| B6.4.2 | Auto-move Opportunity → won (OT8)                                            | ⬜     |        |      |                         |
| B6.4.3 | Actions système OT9 : Quote→converted, Order créé, Tenant créé, Admin wizard | ⬜     |        |      |                         |
| B6.4.4 | JAMAIS de bouton "Mark as Won" manuel                                        | ⬜     |        |      | Won = Stripe UNIQUEMENT |

### B6.5 Bouton "Create Quote" dans Opportunity

| #      | Tâche                                              | Statut | Commit | Date | Notes      |
| ------ | -------------------------------------------------- | ------ | ------ | ---- | ---------- |
| B6.5.1 | Bouton si stage ∈ {proposal, negotiation, closing} | ⬜     |        |      | RM-QOT-001 |
| B6.5.2 | "New Version" si quote existe déjà                 | ⬜     |        |      |            |
| B6.5.3 | Quote draft → envoi → flow email standard          | ⬜     |        |      |            |

### B6.6 Livrable Phase B6

| #      | Tâche                                                           | Statut | Notes |
| ------ | --------------------------------------------------------------- | ------ | ----- |
| B6.6.1 | Git tag v-crm-phase6                                            | ⬜     |       |
| B6.6.2 | Test E2E : Create Quote → Send → Accept → Stripe → Won          | ⬜     |       |
| B6.6.3 | Test : Send → Reject → Negotiation → New Version → Accept → Won | ⬜     |       |
| B6.6.4 | Test : Send → Expire → Negotiation → Resend → Accept → Won      | ⬜     |       |
| B6.6.5 | Validation CEO                                                  | ⬜     |       |

---

## PHASE B7 — KANBAN TEMPS RÉEL

**Objectif :** Cards bougent automatiquement sans refresh page.
**Prérequis :** Phase B6.
**Durée estimée :** 1-2 jours.
**Décision CEO :** NON-NÉGOCIABLE.

| #      | Tâche                                                              | Statut | Commit | Date | Notes          |
| ------ | ------------------------------------------------------------------ | ------ | ------ | ---- | -------------- |
| B7.1.1 | Analyser options : Supabase Realtime vs polling court (5-10s)      | ⬜     |        |      |                |
| B7.1.2 | Implémenter sur Kanban Lead                                        | ⬜     |        |      |                |
| B7.1.3 | Implémenter sur Kanban Opportunity                                 | ⬜     |        |      |                |
| B7.1.4 | Test : quote accepté → card bouge Proposal → Closing en temps réel | ⬜     |        |      |                |
| B7.1.5 | Test : Stripe payment → card bouge Closing → Won en temps réel     | ⬜     |        |      |                |
| B7.1.6 | Test : commercial A drag → commercial B voit mouvement temps réel  | ⬜     |        |      |                |
| B7.1.7 | Git tag v-crm-phase7                                               | ⬜     |        |      |                |
| B7.1.8 | Validation CEO (test en direct)                                    | ⬜     |        |      | NON-NÉGOCIABLE |

---

## PHASE B8 — NOTIFICATIONS OPPORTUNITY

**Objectif :** 11 notifications + historique activités.
**Prérequis :** Phase B6.
**Durée estimée :** 2-3 jours.

### B8.1 Templates Email (ON1-ON11)

| #       | Template                                        | Statut | Notes |
| ------- | ----------------------------------------------- | ------ | ----- |
| B8.1.1  | ON1 : quote_sent (email prospect Accept/Reject) | ⬜     |       |
| B8.1.2  | ON2 : quote_viewed (notification commercial)    | ⬜     |       |
| B8.1.3  | ON3 : quote_accepted (commercial + manager)     | ⬜     |       |
| B8.1.4  | ON4 : quote_rejected (urgente)                  | ⬜     |       |
| B8.1.5  | ON5 : quote_expired (urgente)                   | ⬜     |       |
| B8.1.6  | ON6 : quote_resent (même email renvoyé)         | ⬜     |       |
| B8.1.7  | ON7 : deal_stalled (manager, par stage)         | ⬜     |       |
| B8.1.8  | ON8 : payment_received (bienvenue + commercial) | ⬜     |       |
| B8.1.9  | ON9 : payment_failed (urgence commercial)       | ⬜     |       |
| B8.1.10 | ON10 : deal_won (stakeholders internes)         | ⬜     |       |
| B8.1.11 | ON11 : deal_lost (manager)                      | ⬜     |       |

### B8.2 Notifications Lead existantes — vérification

📌 _Source : Step 2.3 item 8, Spec V7 §11_

| #      | Tâche                                                   | Statut | Notes                |
| ------ | ------------------------------------------------------- | ------ | -------------------- |
| B8.2.1 | Vérifier N1-N10 Lead fonctionnent réellement (pas fake) | ⬜     | _Résultat de B0.1.8_ |
| B8.2.2 | Corriger les notifications Lead qui ne fonctionnent pas | ⬜     |                      |

### B8.3 Historique Activités

| #      | Tâche                                                           | Statut | Commit | Date | Notes |
| ------ | --------------------------------------------------------------- | ------ | ------ | ---- | ----- |
| B8.3.1 | Chaque envoi email loggué dans crm_lead_activities type "Email" | ⬜     |        |      |       |
| B8.3.2 | Visible sur page détail Lead ET Opportunity                     | ⬜     |        |      |       |
| B8.3.3 | Resend count visible dans activité                              | ⬜     |        |      |       |

### B8.4 Livrable Phase B8

| #      | Tâche                                    | Statut | Notes |
| ------ | ---------------------------------------- | ------ | ----- |
| B8.4.1 | Git tag v-crm-phase8                     | ⬜     |       |
| B8.4.2 | Chaque notification testée au bon moment | ⬜     |       |
| B8.4.3 | Validation CEO                           | ⬜     |       |

---

## PHASE B9 — PAGE DÉTAIL LEAD/OPPORTUNITY (Atomic CRM)

**Objectif :** Refonte pages détail selon Atomic CRM framework.
**Prérequis :** Phases B1-B8 complétées.
**Durée estimée :** 3-4 jours.

### B9.1 Page Détail Lead

📌 _Source : CRM V1 Phase 9 + Dashboard V4 Step 2.5_

| #      | Tâche                                                                   | Statut | Commit | Date | Notes                    |
| ------ | ----------------------------------------------------------------------- | ------ | ------ | ---- | ------------------------ |
| B9.1.1 | Analyser pattern Atomic CRM page détail                                 | ⬜     |        |      |                          |
| B9.1.2 | Refonte layout page détail Lead                                         | ⬜     |        |      | _Dashboard V4 Step 2.5_  |
| B9.1.3 | Section BANT Qualification visible                                      | ⬜     |        |      |                          |
| B9.1.4 | Timeline activités complète (emails, appels, notes, changements status) | ⬜     |        |      | _Dashboard V4 Step 2.10_ |
| B9.1.5 | Lien vers Opportunity si converti                                       | ⬜     |        |      |                          |
| B9.1.6 | 📌 Notes sur Lead (markdown + pièces jointes)                           | ⬜     |        |      | _Dashboard V4 Step 2.7_  |
| B9.1.7 | 📌 Tasks sur Lead (call/email/meeting)                                  | ⬜     |        |      | _Dashboard V4 Step 2.8_  |
| B9.1.8 | 📌 Tags colorés                                                         | ⬜     |        |      | _Dashboard V4 Step 2.9_  |

### B9.2 Page Détail Opportunity

| #      | Tâche                                            | Statut | Commit | Date | Notes |
| ------ | ------------------------------------------------ | ------ | ------ | ---- | ----- |
| B9.2.1 | Refonte layout selon Atomic CRM                  | ⬜     |        |      |       |
| B9.2.2 | Section Quotes (liste versions, status, actions) | ⬜     |        |      |       |
| B9.2.3 | Section paiement (status Stripe, historique)     | ⬜     |        |      |       |
| B9.2.4 | Timeline activités complète                      | ⬜     |        |      |       |
| B9.2.5 | Lien vers Lead d'origine                         | ⬜     |        |      |       |

### B9.3 Create Sheet + Edit Sheet

📌 _Source : Dashboard V4 Step 2.6_

| #      | Tâche                               | Statut | Notes |
| ------ | ----------------------------------- | ------ | ----- |
| B9.3.1 | Create Lead Sheet (overlay latéral) | ⬜     |       |
| B9.3.2 | Edit Lead Sheet                     | ⬜     |       |

### B9.4 Import/Export + Bulk Actions

📌 _Source : Dashboard V4 Step 2.11_

| #      | Tâche                                                             | Statut | Notes                                     |
| ------ | ----------------------------------------------------------------- | ------ | ----------------------------------------- |
| B9.4.1 | Import CSV leads                                                  | ⬜     |                                           |
| B9.4.2 | Export CSV + Excel leads                                          | ⬜     | Framework DataTable standardisé en Bloc A |
| B9.4.3 | Bulk Actions leads (qualify, nurture, disqualify, delete, assign) | ⬜     |                                           |

### B9.5 Livrable Phase B9

| #      | Tâche                                          | Statut | Notes |
| ------ | ---------------------------------------------- | ------ | ----- |
| B9.5.1 | Git tag v-crm-phase9                           | ⬜     |       |
| B9.5.2 | Validation CEO pages détail Lead + Opportunity | ⬜     |       |

---

## RÉSUMÉ BLOC B

| Phase            | Description                                              | Durée           | Prérequis       | Statut                                       |
| ---------------- | -------------------------------------------------------- | --------------- | --------------- | -------------------------------------------- |
| **B0**           | Audit code existant                                      | 1 jour          | Bloc A complet  | ✅ `f94877f`                                 |
| **B1**           | Fondations Lead (DB + backend BANT + Kanban V7 + perf)   | 2 jours         | B0              | ✅ `v-crm-phase1` + `v-crm-kanban-v7-stable` |
| **B2**           | UI Lead BANT (formulaire + actions V7 + DnD + nettoyage) | 2 jours         | B1              | 🔄 EN COURS                                  |
| **⚡ BLOC P**    | **PERFORMANCE (priorité absolue)**                       | **3-5 jours**   | **B2**          | **🔄 P1 partiel**                            |
| **B3**           | Conversion enrichie (3 entités)                          | 2 jours         | B2 + **Bloc P** | ⬜                                           |
| **B4**           | Pipeline Opportunity (4 colonnes)                        | 2 jours         | B3              | ⬜                                           |
| **B5**           | Cal.com décommissionnement + calendrier Gmail            | 2-3 jours       | B4              | ⬜ (partiel B1.5.9)                          |
| **B6**           | Quote-to-Cash (Accept/Reject/Stripe)                     | 3-4 jours       | B4              | ⬜                                           |
| **B7**           | Kanban temps réel                                        | 1-2 jours       | B6              | ⬜                                           |
| **B8**           | Notifications Opportunity (11 templates)                 | 2-3 jours       | B6              | ⬜                                           |
| **B9**           | Page détail + Notes + Tags + Import/Export               | 3-4 jours       | B1-B8           | ⬜                                           |
| **TOTAL BLOC B** |                                                          | **23-30 jours** |                 |                                              |

**Notes :** B5 et B6 sont indépendants (peuvent être parallélisés). B7 et B8 dépendent de B6 mais sont indépendants entre eux.

---

# ═══════════════════════════════════════════════

# BLOC C — ENRICHISSEMENTS CRM

# ═══════════════════════════════════════════════

**Objectif :** Couche de finition : dashboard, CRM client, module Client, etc.
**Durée estimée :** 10-15 jours
**Prérequis :** Bloc B complété.

---

## PHASE C1 — DASHBOARD CRM

**Objectif :** Reskinner le dashboard CRM existant avec shadcnuikit.
**Durée estimée :** 2-3 jours.
**Source :** Dashboard V4 Étape 1

| #    | Tâche                                                                  | Statut | Notes |
| ---- | ---------------------------------------------------------------------- | ------ | ----- |
| C1.1 | Audit dashboard existant (route actuelle, composants)                  | ⬜     |       |
| C1.2 | Restructuration route : /crm affiche le dashboard                      | ⬜     |       |
| C1.3 | KPI Cards alignées shadcnuikit                                         | ⬜     |       |
| C1.4 | Graphiques alignés shadcnuikit (recharts)                              | ⬜     |       |
| C1.5 | Widgets Lead + Opportunity (pipeline value, win rate, conversion rate) | ⬜     |       |
| C1.6 | Nettoyage ancienne route /crm/leads/reports                            | ⬜     |       |
| C1.7 | Git tag v-crm-dashboard                                                | ⬜     |       |
| C1.8 | Validation CEO                                                         | ⬜     |       |

---

## PHASE C2 — SLA / ROTTING INDICATORS

**Objectif :** Indicateurs visuels de stagnation sur les leads et opportunities.
**Durée estimée :** 1-2 jours.
**Source :** Step 2.3 Completion Phase 9

| #    | Tâche                                                       | Statut | Notes                |
| ---- | ----------------------------------------------------------- | ------ | -------------------- |
| C2.1 | Définir durées SLA par statut lead et par stage opportunity | ⬜     | ❌ DÉCISION CEO      |
| C2.2 | Badge overdue visible sur Kanban cards (lead + opportunity) | ⬜     |                      |
| C2.3 | Badge overdue dans popup/drawer                             | ⬜     |                      |
| C2.4 | Stat card "Rotting Deals" dans Kanban Opportunity           | ⬜     | Déjà prévu en B4.2.3 |
| C2.5 | Validation CEO                                              | ⬜     |                      |

---

## PHASE C3 — CRM SETTINGS PAGE REFONTE

**Objectif :** Page CRM Settings alignée spec V7.
**Durée estimée :** 1-2 jours.
**Source :** CRM_SETTINGS_SPECIFICATION.md

| #    | Tâche                                                         | Statut | Notes |
| ---- | ------------------------------------------------------------- | ------ | ----- |
| C3.1 | Vérifier état actuel CRM Settings (PipelineSettingsTab, etc.) | ⬜     |       |
| C3.2 | Aligner Lead Pipeline settings avec les 4+2 statuts V7        | ⬜     |       |
| C3.3 | Aligner Opportunity Pipeline settings avec les 4+2 stages V7  | ⬜     |       |
| C3.4 | BANT configuration (valeurs qualifiantes, seuils)             | ⬜     |       |
| C3.5 | Notification toggles (activer/désactiver par notification)    | ⬜     |       |
| C3.6 | SLA durations configurables                                   | ⬜     |       |
| C3.7 | Validation CEO                                                | ⬜     |       |

---

## PHASE C4 — CRM CLIENT ISOLÉ (Fleet Operators)

**Objectif :** Le même framework CRM proposé aux clients fleet operators.
**Durée estimée :** 3-5 jours.
**Source :** Décision CEO 27/02/2026

**Règle absolue :** Même framework Lead + Opportunity standard SANS automatisation. ISOLÉ du CRM FleetCore HQ. Deux environnements code séparés, zéro mutualisation, zéro régression croisée.

| #    | Tâche                                                    | Statut | Notes |
| ---- | -------------------------------------------------------- | ------ | ----- |
| C4.1 | Architecture isolation : code séparé, zéro import croisé | ⬜     |       |
| C4.2 | Module Lead client (pipeline standard, pas d'auto BANT)  | ⬜     |       |
| C4.3 | Module Opportunity client (pipeline standard)            | ⬜     |       |
| C4.4 | Kanban client (même UX, pas de temps réel obligatoire)   | ⬜     |       |
| C4.5 | Tests non-régression CRM HQ après intégration CRM client | ⬜     |       |
| C4.6 | Validation CEO                                           | ⬜     |       |

---

## PHASE C5 — MODULE CLIENT (clt_masterdata → fiche commerciale)

**Objectif :** Fiche client commerciale pour le Quote-to-Cash.
**Durée estimée :** 3-5 jours.
**Source :** CLT Backlog Phases B + C

| #    | Tâche                                                                           | Statut | Notes                                        |
| ---- | ------------------------------------------------------------------------------- | ------ | -------------------------------------------- |
| C5.1 | Clarifier rôle clt_masterdata avec CEO                                          | ⬜     | ❌ DÉCISION CEO (enrichir vs nouvelle table) |
| C5.2 | Champs légaux dynamiques (France SIRET/SIREN/TVA, UAE TRN/Trade License)        | ⬜     | ❌ DÉCISION CEO (colonnes vs JSONB)          |
| C5.3 | Renommer clt_masterdata → clt_clients (si décidé)                               | ⬜     |                                              |
| C5.4 | Page CRM → Clients (DataTable standard)                                         | ⬜     |                                              |
| C5.5 | Fiche client détaillée (identité, adresse, légal, contacts, billing, lifecycle) | ⬜     |                                              |
| C5.6 | Conversion auto Opportunity Won → Client créé                                   | ⬜     | Lié à B6.4.3                                 |
| C5.7 | Lien Client → Tenant + Stripe Customer                                          | ⬜     |                                              |
| C5.8 | Onboarding flow client (Welcome, Company Profile, inviter users)                | ⬜     |                                              |
| C5.9 | Validation CEO                                                                  | ⬜     |                                              |

---

## RÉSUMÉ BLOC C

| Phase            | Description                            | Durée           | Prérequis      |
| ---------------- | -------------------------------------- | --------------- | -------------- |
| **C1**           | Dashboard CRM (reskinnage shadcnuikit) | 2-3 jours       | Bloc B complet |
| **C2**           | SLA / Rotting indicators               | 1-2 jours       | C1             |
| **C3**           | CRM Settings page refonte              | 1-2 jours       | B1             |
| **C4**           | CRM Client isolé (fleet operators)     | 3-5 jours       | Bloc B complet |
| **C5**           | Module Client (fiche commerciale)      | 3-5 jours       | B6             |
| **TOTAL BLOC C** |                                        | **10-15 jours** |                |

**Notes :** C3 peut être intercalé plus tôt (après B1). C4 et C5 sont indépendants.

---

# ═══════════════════════════════════════════════

# RÉSUMÉ GLOBAL

# ═══════════════════════════════════════════════

| Bloc          | Description                                                 | Durée           | Statut                 |
| ------------- | ----------------------------------------------------------- | --------------- | ---------------------- |
| **A**         | Fermer V5.3 (admin fixes, CLT cleanup, E2E, docs)           | 3-5 jours       | ✅ `v-bloc-a-complete` |
| **B (B0-B2)** | CRM Framework — Fondations + Lead BANT + Kanban DnD         | 5-6 jours       | 🔄 B2 finalisation     |
| **⚡ P**      | **PERFORMANCE — PRIORITÉ ABSOLUE**                          | **3-5 jours**   | 🔄 P1 partiel          |
| **B (B3-B9)** | CRM Framework — Conversion, Opportunity, Quote, Temps réel  | 15-20 jours     | ⬜ (après Bloc P)      |
| **C**         | Enrichissements (Dashboard, SLA, CRM Client, Module Client) | 10-15 jours     | ⬜                     |
| **TOTAL**     |                                                             | **36-51 jours** |                        |

---

## DÉCISIONS CEO REQUISES (BLOQUANTES)

| #   | Question                                                                 | Quand    | Impact             | Statut                      |
| --- | ------------------------------------------------------------------------ | -------- | ------------------ | --------------------------- |
| D1  | Leads existants en status demo/proposal_sent → migrer vers quel statut ? | Phase B1 | Migration DB       | ✅ RÉSOLU — 27 leads migrés |
| D2  | Design UX solution custom calendrier Gmail                               | Phase B5 | Remplace Cal.com   | ⬜                          |
| D3  | Durées SLA par statut lead et par stage opportunity                      | Phase C2 | Rotting indicators | ⬜                          |
| D4  | clt_masterdata : enrichir ou nouvelle table clt_clients ?                | Phase C5 | Architecture DB    | ⬜                          |
| D5  | Champs légaux dynamiques : colonnes SQL ou JSONB ?                       | Phase C5 | Flexibilité        | ⬜                          |
| D6  | Kanban Lead : 3 colonnes (email_verified incluse)                        | Phase B1 | Kanban layout      | ✅ RÉSOLU — 3 colonnes      |

---

## SÉQUENCE VISUELLE

```
BLOC A (3-5j) ✅ COMPLÉTÉ
├── A1 : Admin fixes + DataTable standardisation  ─────┐
├── A2 : CLT tables cleanup                            │
├── A3 : Validation E2E                                │ FONDATIONS ✅
├── A4 : Documentation                           ─────┘
    ↓
BLOC B — PHASE 1 (5-6j) 🔄 EN COURS
├── B0 : Audit code CRM existant                 ───── ✅
├── B1 : Fondations Lead BANT + Kanban V7 + Perf ───── ✅
├── B2 : UI Lead (BANT + DnD + actions V7)        ───── 🔄 FINALISATION
    ↓
⚡ BLOC P — PERFORMANCE (3-5j) ← PRIORITÉ ABSOLUE
├── P1 : React Query staleTime + caching          ───── ✅ (partiel)
├── P2 : meta.select sur TOUS les hooks            ─────┐
├── P3 : Éliminer anti-patterns                         │
├── P4 : Loading skeletons CRM                          │ PERFORMANCE
├── P5 : Décomposition méga-composants                  │
├── P6 : Optimisations infrastructure                   │
├── P7 : Mesures + validation (Go/No-Go)          ─────┘
    ↓ (SEULEMENT si P7 validé : pages <2s, interactions <500ms)
BLOC B — PHASE 2 (15-20j)
├── B3 : Conversion 3 entités                          │
├── B4 : Pipeline Opportunity (4 col.)                 │
├── B5 : Cal.com → Gmail calendrier    ──┐             │
├── B6 : Quote-to-Cash (Stripe)        ──┤ parallèle   │ CRM CORE
├── B7 : Kanban temps réel               │             │
├── B8 : Notifications (ON1-ON11)        │             │
├── B9 : Pages détail + Notes + Import   ────────────┘
    ↓
BLOC C (10-15j)
├── C1 : Dashboard CRM                           ─────┐
├── C2 : SLA / Rotting                                 │
├── C3 : CRM Settings refonte                          │ FINITIONS
├── C4 : CRM Client isolé                             │
├── C5 : Module Client (fiche commerciale)       ─────┘
```

---

## HISTORIQUE DES MISES À JOUR

| Date       | Bloc  | Phase | Tâche            | Modification                                                                                                                               | Par                 |
| ---------- | ----- | ----- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| 28/02/2026 | —     | —     | Création         | Document consolidé V6 — fusionne 7 plans                                                                                                   | Architecture Claude |
| 01/03/2026 | A     | A1-A4 | Bloc A complet   | Tag `v-bloc-a-complete`, commit `a032e77`                                                                                                  | Mohamed             |
| 01/03/2026 | B     | B0    | Audit CRM        | Commit `f94877f` — audit complet code CRM                                                                                                  | Mohamed             |
| 01/03/2026 | B     | B1    | Fondations BANT  | Tag `v-crm-phase1`, commit `17d2913` — DB, statuts V7, transitions, migration 27 leads, Cal.com cleanup 20 fichiers, CPT→BANT              | Mohamed             |
| 02/03/2026 | B     | B1.5  | Kanban V7 stable | Tag `v-crm-kanban-v7-stable`, commit `a4ca69c` — 3 colonnes, outcomes bar, 4 perf fixes (SWR, SELECT partial, flash/back, dynamic imports) | Mohamed             |
| 02/03/2026 | B     | B2    | Mise à jour plan | Décision CEO : 3 colonnes (email_verified incluse) au lieu de 2. Plan B2 mis à jour. Section B2.4 (nettoyage) ajoutée. D1+D6 résolues.     | Architecture Claude |
| 03/03/2026 | B     | B2    | Commit 13c8c74   | B2.5 Drawer refonte useOne, B2.6 Data provider custom, B2.7 Clerk ID→UUID audit. Tag v-crm-b2-drawer. 4 tests navigateur PASS.             | Architecture Claude |
| 03/03/2026 | B     | B2.8  | DnD + perf       | af3119b — 7 drags, 4 mini-popups, OutcomesBar restauré (régression corrigée), PERF-FIX-001 Phase A (staleTime, meta.select, URL nav)       | Architecture Claude |
| 03/03/2026 | **P** | —     | **BLOC P créé**  | **V6.2 — Bloc Performance inséré entre B2 et B3. Décision CEO : performance = condition d'existence, pas cosmétique. Go/No-Go avant B3.**  | Architecture Claude |

---

**FIN DU PLAN CONSOLIDÉ V6 — DOCUMENT VIVANT**

_Ce document REMPLACE tous les plans précédents non terminés._
_Il est le seul document de référence pour l'exécution._
_Toute tâche non listée ici n'existe pas._
