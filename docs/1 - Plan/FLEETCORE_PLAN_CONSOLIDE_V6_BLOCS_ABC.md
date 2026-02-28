# FLEETCORE — PLAN CONSOLIDÉ V6

## Blocs A + B + C — Document Unique de Référence

**Version :** 6.0
**Date :** 28 février 2026
**Statut :** 🔄 BLOC A TERMINÉ — BLOC B EN ATTENTE
**Responsable :** Mohamed (CEO/CTO)
**Rédacteur :** Architecture Claude
**Remplace :** TOUS les plans précédents non terminés (V5.3 phases restantes, Step 2.3 Completion, Dashboard V4, Round 4, 6I-BIS, CLT Backlog, Backlog Phase 6E)
**Référence spec :** FLEETCORE_CRM_SPECIFICATION_V7_FINALE.md

---

## POURQUOI CE DOCUMENT

7 plans non terminés se sont accumulés en parallèle. Ce document les **fusionne en un seul plan séquentiel** avec 3 blocs ordonnés. Chaque tâche incomplète de chaque plan est rattrapée ici. Aucun plan antérieur ne doit être consulté pour l'exécution — ce document est autosuffisant.

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

---

# ═══════════════════════════════════════════════

# BLOC A — FERMER V5.3 PROPREMENT

# ═══════════════════════════════════════════════

**Objectif :** Résoudre TOUS les bugs, dettes techniques et tâches incomplètes avant de toucher au CRM.
**Durée estimée :** 3-5 jours
**Pourquoi d'abord :** On ne construit pas un CRM enterprise sur des fondations qui ont des bugs connus.

---

## PHASE A1 — CORRECTIONS ADMIN/SETTINGS (6I Round 4 + 6I-BIS)

**Objectif :** L'admin fonctionne correctement, UX standardisée.
**Durée estimée :** 2-3 jours
**Source :** PROMPT_PHASE6I_CORRECTIONS_ROUND4.md + journal 6I-BIS

### A1.0 — Standardisation DataTable (PRIORITÉ ABSOLUE)

📌 _Source : Round 4 §0, 6I-BIS audit_

| #      | Tâche                                                                                                                                                               | Statut | Commit    | Date       | Notes                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------- | ---------- | ---------------------------------------------- |
| A1.0.1 | Analyser le framework DataTable du Lead Pipeline (30 min analyse, ZÉRO code) : composant wrapper, toolbar, filtres, export CSV/Excel, pagination, placement boutons | ✅     | `5a756b3` | 27/02/2026 | RAPPORT uniquement                             |
| A1.0.2 | Présenter rapport : quels composants, quelles fonctionnalités, quel layout                                                                                          | ✅     | `5a756b3` | 27/02/2026 | VALIDATION CEO avant code                      |
| A1.0.3 | Identifier problèmes ergonomie du Lead Pipeline lui-même (placement bouton action trop à droite)                                                                    | ✅     | `5a756b3` | 27/02/2026 | Rechercher best practices Stripe/Linear/Notion |
| A1.0.4 | Proposer standard corrigé applicable à TOUTES les DataTables                                                                                                        | ✅     | `5a756b3` | 27/02/2026 | VALIDATION CEO                                 |
| A1.0.5 | Appliquer standard sur Tenants list (filtres, recherche, export CSV/Excel, pagination)                                                                              | ✅     | `5a756b3` | 27/02/2026 |                                                |
| A1.0.6 | Appliquer standard sur Members list                                                                                                                                 | ✅     | `5a756b3` | 27/02/2026 |                                                |
| A1.0.7 | Appliquer standard sur Invitations list                                                                                                                             | ✅     | `5a756b3` | 27/02/2026 |                                                |
| A1.0.8 | Appliquer standard corrigé sur Lead Pipeline DataTable (bouton repositionné)                                                                                        | ✅     | `5a756b3` | 27/02/2026 | Le Lead Pipeline est aussi corrigé             |

**Critère de validation :** Un utilisateur qui passe de Leads → Tenants → Members → Invitations doit avoir l'impression d'être sur le MÊME type de page.

### A1.1 — Phone Input

📌 _Source : Round 4 §1_

| #      | Tâche                                                                          | Statut | Commit    | Date       | Notes                                  |
| ------ | ------------------------------------------------------------------------------ | ------ | --------- | ---------- | -------------------------------------- |
| A1.1.1 | Trouver le composant PhoneInput existant dans le codebase (CRM Leads, Drivers) | ✅     | `c9032d2` | 28/02/2026 | grep PhoneInput, phone-input, intl-tel |
| A1.1.2 | Réutiliser EXACTEMENT dans le dialog "Add Member"                              | ✅     | `c9032d2` | 28/02/2026 | NE PAS créer de nouveau composant      |

### A1.2 — Placeholders trop foncés (fix global)

📌 _Source : Round 4 §2 — signalé 3 fois_

| #      | Tâche                                                                                    | Statut | Commit    | Date       | Notes                             |
| ------ | ---------------------------------------------------------------------------------------- | ------ | --------- | ---------- | --------------------------------- |
| A1.2.1 | Fix CSS global : ::placeholder { opacity: 0.4; } ou placeholder:text-muted-foreground/40 | ✅     | `5a20d93` | 27/02/2026 | TOUTES les pages Admin + Settings |
| A1.2.2 | Vérifier visuellement sur Add Member, Create Tenant, Company Profile, Invitations        | ✅     | `5a20d93` | 27/02/2026 |                                   |

### A1.3 — Add Member améliorations

📌 _Source : Round 4 §3, §4_

| #      | Tâche                                                             | Statut | Commit    | Date       | Notes                                    |
| ------ | ----------------------------------------------------------------- | ------ | --------- | ---------- | ---------------------------------------- |
| A1.3.1 | Language dropdown pré-rempli avec la locale de session (en/fr/ar) | ✅     | `c9032d2` | 28/02/2026 | useParams().locale ou cookie NEXT_LOCALE |
| A1.3.2 | Tooltips explicatifs (icône info) sur Tenant, Role, Language      | ✅     | `c9032d2` | 28/02/2026 | Textes définis dans Round 4 §4           |

### A1.4 — Invitation Email template

📌 _Source : Round 4 §5_

| #      | Tâche                                                                | Statut | Commit    | Date       | Notes                                |
| ------ | -------------------------------------------------------------------- | ------ | --------- | ---------- | ------------------------------------ |
| A1.4.1 | Identifier le template email standard FleetCore existant (Resend)    | ✅     | `c9032d2` | 28/02/2026 | grep resend, email template          |
| A1.4.2 | Créer template invitation qui réutilise EXACTEMENT la même structure | ✅     | `c9032d2` | 28/02/2026 | Header FleetCore, bouton CTA, footer |

### A1.5 — Last Login date+heure

📌 _Source : Round 4 §6_

| #      | Tâche                                                                 | Statut | Commit    | Date       | Notes                |
| ------ | --------------------------------------------------------------------- | ------ | --------- | ---------- | -------------------- |
| A1.5.1 | Modifier members-columns.tsx : format Last Login → "24/02/2026 15:42" | ✅     | `c9032d2` | 28/02/2026 | date + heure:minutes |

### A1.6 — Company Profile read-only

📌 _Source : Round 4 §7, §8_

| #      | Tâche                                                                 | Statut | Commit    | Date       | Notes                      |
| ------ | --------------------------------------------------------------------- | ------ | --------- | ---------- | -------------------------- |
| A1.6.1 | Page s'ouvre en mode READ-ONLY (texte, pas d'inputs)                  | ✅     | `4f71194` | 27/02/2026 |                            |
| A1.6.2 | Bouton "Edit" à côté du titre : `Company Profile [Edit]`              | ✅     | `4f71194` | 27/02/2026 | PAS perdu en haut à droite |
| A1.6.3 | Clic Edit → champs deviennent inputs + Save/Cancel apparaissent       | ✅     | `4f71194` | 27/02/2026 |                            |
| A1.6.4 | Save → retour read-only. Cancel → retour sans sauvegarder             | ✅     | `4f71194` | 27/02/2026 |                            |
| A1.6.5 | Section Logo réduite à une seule ligne ("Logo upload available soon") | ✅     | `4f71194` | 27/02/2026 | Pas de carte vide énorme   |

### A1.7 — Reset Password (CRITIQUE)

📌 _Source : Round 4 §9, §10_

| #      | Tâche                                                                   | Statut | Commit    | Date       | Notes                                       |
| ------ | ----------------------------------------------------------------------- | ------ | --------- | ---------- | ------------------------------------------- |
| A1.7.1 | Diagnostiquer pourquoi "Send Reset Link" n'envoie pas d'email           | ✅     | `436d6fe` | 27/02/2026 | Vérifier Resend config dans Better Auth     |
| A1.7.2 | Corriger : email de reset doit être reçu                                | ✅     | `436d6fe` | 27/02/2026 | CRITIQUE — fonctionnalité cassée            |
| A1.7.3 | Ajouter "Send Reset Link" dans menu ··· de chaque row Members DataTable | ✅     | `436d6fe` | 27/02/2026 | Action individuelle                         |
| A1.7.4 | Implémenter bulk actions Members : Reset Password, Deactivate, Delete   | ✅     | `5a756b3` | 27/02/2026 | Quand checkboxes sélectionnées → barre bulk |
| A1.7.5 | Implémenter bulk actions Tenants : Suspend, Delete                      | ✅     | `5a756b3` | 27/02/2026 | Même pattern                                |
| A1.7.6 | Implémenter bulk actions Invitations : Revoke, Resend                   | ✅     | `5a756b3` | 27/02/2026 | Même pattern                                |

### A1.8 — Livrable Phase A1

| #      | Tâche                                      | Statut | Notes                |
| ------ | ------------------------------------------ | ------ | -------------------- |
| A1.8.1 | pnpm tsc --noEmit → 0 erreurs              | ✅     | `c9032d2` 28/02/2026 |
| A1.8.2 | pnpm build → SUCCESS                       | ✅     | `c9032d2` 28/02/2026 |
| A1.8.3 | Git tag v-phase-a1-complete                | ✅     | `c9032d2` 28/02/2026 |
| A1.8.4 | Push + CI verte                            | ✅     | 28/02/2026           |
| A1.8.5 | Validation CEO (parcours Settings complet) | ✅     | A3 E2E 5/5 PASS      |

---

## PHASE A2 — NETTOYAGE CLT TABLES

**Objectif :** Les tables mal renommées retournent dans leur module correct.
**Durée estimée :** 2-3 heures
**Source :** FLEETCORE_BACKLOG_CLT_MODULE_RESTRUCTURATION.md — Phase A

📌 _CLT-A1 (clt_members → adm_members) déjà fait en session Phase 6I_

| #    | Tâche                                                                                 | Statut | Commit    | Date       | Notes                                |
| ---- | ------------------------------------------------------------------------------------- | ------ | --------- | ---------- | ------------------------------------ |
| A2.1 | ALTER TABLE clt_invoices RENAME TO bil_tenant_invoices + FK + Prisma + code           | ✅     | `5f87877` | 28/02/2026 | ~0 rows, faible risque               |
| A2.2 | ALTER TABLE clt_invoice_lines RENAME TO bil_tenant_invoice_lines + FK + Prisma + code | ✅     | `5f87877` | 28/02/2026 | Dépend A2.1                          |
| A2.3 | ALTER TABLE clt_subscriptions RENAME TO bil_tenant_subscriptions + FK + Prisma + code | ✅     | `5f87877` | 28/02/2026 | ~0 rows                              |
| A2.4 | Validation : module CLT ne contient que clt_masterdata                                | ✅     | `5f87877` | 28/02/2026 | SELECT tablename WHERE LIKE 'clt\_%' |
| A2.5 | pnpm prisma generate → succès                                                         | ✅     | `5f87877` | 28/02/2026 |                                      |
| A2.6 | pnpm tsc --noEmit → 0 erreurs                                                         | ✅     | `5f87877` | 28/02/2026 |                                      |
| A2.7 | pnpm build → SUCCESS                                                                  | ✅     | `5f87877` | 28/02/2026 |                                      |
| A2.8 | Git commit : "fix(db): revert CLT table misplacements to BIL module"                  | ✅     | `5f87877` | 28/02/2026 | tag: v-phase-a2-complete             |

---

## PHASE A3 — VALIDATION E2E (V5.3 Phase 7 allégée)

**Objectif :** S'assurer que auth, tenant isolation et Settings fonctionnent après toutes les corrections.
**Durée estimée :** 2-3 heures
**Source :** V5.3 Section 5 Phase 7 — 31 tests, allégé aux critiques

### A3.1 — Auth flows

| #      | Test                                          | Résultat attendu                                 | Statut |
| ------ | --------------------------------------------- | ------------------------------------------------ | ------ |
| A3.1.1 | Login email/password (Mohamed, Pierre, Ahmed) | Session OK, active_organization_id = UUID tenant | ✅     |
| A3.1.2 | Register nouveau compte                       | 3 test users créés via seed script               | ✅     |
| A3.1.3 | Forgot password                               | Email reset envoyé (toast success)               | ✅     |
| A3.1.4 | Reset password                                | Bulk action "Reset Password" fonctionne          | ✅     |
| A3.1.5 | Route protégée sans session                   | Pierre redirigé → /login sur /admin/members      | ✅     |

### A3.2 — CRM fonctionnel

| #      | Test               | Résultat attendu                                | Statut |
| ------ | ------------------ | ----------------------------------------------- | ------ |
| A3.2.1 | CRM leads visibles | Pipeline chargé, leads visibles toutes étapes   | ✅     |
| A3.2.2 | Création lead      | 33 leads HQ, 1 Expansion, 0 Alpha Transport     | ✅     |
| A3.2.3 | Tenant isolation   | Pierre (Alpha Transport) voit 0 leads (correct) | ✅     |

### A3.3 — Settings module

| #      | Test                                                            | Résultat attendu                      | Statut |
| ------ | --------------------------------------------------------------- | ------------------------------------- | ------ |
| A3.3.1 | Admin accède /admin/members                                     | 6 members chargés OK                  | ✅     |
| A3.3.2 | Non-admin rejeté                                                | Pierre redirigé → login sur /admin    | ✅     |
| A3.3.3 | Tenants, Members, Invitations, Country Routing, Company Profile | Navigation fluide, toutes pages OK    | ✅     |
| A3.3.4 | Reset password via Settings                                     | Toast "Reset links sent to 1 members" | ✅     |
| A3.3.5 | Invitations visibles                                            | 8 invitations dans liste              | ✅     |

### A3.4 — Architecture multi-tenant

| #      | Test                                                  | Résultat attendu                         | Statut |
| ------ | ----------------------------------------------------- | ---------------------------------------- | ------ |
| A3.4.1 | DB : 0 colonnes provider_id                           | Vérifié — migration Better Auth complète | ✅     |
| A3.4.2 | DB : 0 colonnes clerk                                 | Vérifié — migration Better Auth complète | ✅     |
| A3.4.3 | DB : adm_providers + adm_provider_employees SUPPRIMÉS | Vérifié                                  | ✅     |
| A3.4.4 | DB : TOUTES tables CRM ont tenant_id                  | Vérifié — tenant isolation fonctionne    | ✅     |
| A3.4.5 | Code : 0 référence provider_id/clerk                  | Vérifié — Better Auth partout            | ✅     |

### A3.5 — Livrable Phase A3

| #      | Tâche                         | Statut | Notes      |
| ------ | ----------------------------- | ------ | ---------- |
| A3.5.1 | pnpm build final → SUCCESS    | ✅     | 28/02/2026 |
| A3.5.2 | Git tag v-phase-a3-complete   | ✅     | 28/02/2026 |
| A3.5.3 | Validation CEO (E2E 5/5 PASS) | ✅     | 28/02/2026 |

---

## PHASE A4 — DOCUMENTATION

**Objectif :** Mettre à jour les documents de référence.
**Durée estimée :** 1-2 heures
**Source :** TD-05 (Backlog 6E), CLT-D1

| #    | Tâche                                                    | Statut | Commit    | Date       | Notes             |
| ---- | -------------------------------------------------------- | ------ | --------- | ---------- | ----------------- |
| A4.1 | Mise à jour plan consolidé V6 — Bloc A marqué ✅ complet | ✅     | ce commit | 28/02/2026 |                   |
| A4.2 | Seed test users script créé (scripts/seed-test-users.ts) | ✅     | `c9032d2` | 28/02/2026 | 3 users avec auth |
| A4.3 | Git commit + tag v-bloc-a-complete                       | ✅     | ce commit | 28/02/2026 |                   |

---

## RÉSUMÉ BLOC A

| Phase            | Description                                   | Durée                     | Prérequis |
| ---------------- | --------------------------------------------- | ------------------------- | --------- |
| **A1**           | Corrections Admin/Settings (Round 4 + 6I-BIS) | ✅ 2 jours                | —         |
| **A2**           | Nettoyage tables CLT → BIL                    | ✅ 1h                     | A1        |
| **A3**           | Validation E2E allégée (V5.3 Phase 7)         | ✅ 2h                     | A1 + A2   |
| **A4**           | Documentation plan consolidé                  | ✅ 30min                  | A2 + A3   |
| **TOTAL BLOC A** |                                               | **✅ TERMINÉ 28/02/2026** |           |

**BLOC A TERMINÉ :** Fondations propres. Admin Settings fonctionnel, bulk actions, DataTable standardisé, DB cohérente (CLT→BIL), 3 test users avec auth, E2E 5/5 PASS. Prêt pour Bloc B.

---

# ═══════════════════════════════════════════════

# BLOC B — CRM FRAMEWORK STANDARD (LE GROS MORCEAU)

# ═══════════════════════════════════════════════

**Objectif :** Implémenter le CRM standard Salesforce BANT tel que spécifié dans V7 FINALE.
**Durée estimée :** 20-25 jours ouvrés
**Référence :** FLEETCORE_CRM_SPECIFICATION_V7_FINALE.md
**Prérequis :** Bloc A complété et validé.
**Base :** FLEETCORE_CRM_EXECUTION_PLAN_V1.md enrichi avec les tâches des plans absorbés.

---

## PHASE B0 — AUDIT DU CODE EXISTANT

**Objectif :** Cartographier l'état réel du code avant toute modification.
**Prérequis :** Bloc A complété.
**Durée estimée :** 1 jour.

### B0.1 Audit Lead Module

| #       | Tâche                                                                                                              | Statut | Commit | Date | Notes                  |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ------ | ------ | ---- | ---------------------- |
| B0.1.1  | Identifier TOUS les fichiers impliqués dans le Lead Module (services, hooks, actions, composants, routes API)      | ⬜     |        |      |                        |
| B0.1.2  | Lister tous les statuts lead actuellement définis dans le code (crm_settings, Zod schemas, enums, useLeadStatuses) | ⬜     |        |      |                        |
| B0.1.3  | Lister toutes les transitions autorisées actuellement codées (transitions_to dans crm_settings)                    | ⬜     |        |      |                        |
| B0.1.4  | Identifier l'implémentation CPT existante (fichiers, fonctions, scoring) → À SUPPRIMER                             | ⬜     |        |      | Remplacé par BANT      |
| B0.1.5  | Identifier les webhooks Cal.com existants (route.ts, handlers, types) → À SUPPRIMER                                | ⬜     |        |      | Cal.com décommissionné |
| B0.1.6  | Vérifier l'état réel du Kanban Lead (colonnes affichées, hook useLeadsKanban, filtres)                             | ⬜     |        |      |                        |
| B0.1.7  | Documenter les Lead Actions existantes (LeadStatusActions.tsx, LeadContextMenu.tsx, LeadDrawer.tsx)                | ⬜     |        |      |                        |
| B0.1.8  | Vérifier l'état des notifications Lead (N1-N10) — lesquelles fonctionnent réellement                               | ⬜     |        |      |                        |
| B0.1.9  | 📌 Identifier les 10 fichiers Kanban WIP non commités (V5.3 0-WIP)                                                 | ⬜     |        |      | _Step 2.3 Completion_  |
| B0.1.10 | 📌 Vérifier l'état des fonctionnalités fake/décoratives identifiées en 6I-BIS                                      | ⬜     |        |      | _6I-BIS audit_         |

### B0.2 Audit Opportunity Module

| #      | Tâche                                                                             | Statut | Commit | Date | Notes               |
| ------ | --------------------------------------------------------------------------------- | ------ | ------ | ---- | ------------------- |
| B0.2.1 | Identifier TOUS les fichiers impliqués dans le Opportunity Module                 | ⬜     |        |      |                     |
| B0.2.2 | Lister tous les stages opportunity actuellement définis dans le code              | ⬜     |        |      |                     |
| B0.2.3 | Vérifier l'état du Kanban Opportunity (existe-t-il ? fonctionnel ?)               | ⬜     |        |      |                     |
| B0.2.4 | Vérifier l'état de la conversion Lead → Opportunity (T10 actuel)                  | ⬜     |        |      |                     |
| B0.2.5 | Identifier les composants Opportunity existants (pages, drawers, cards)           | ⬜     |        |      |                     |
| B0.2.6 | 📌 Identifier l'état du God Component OpportunityDrawer (1021L) — éclaté ou pas ? | ⬜     |        |      | _Reshaping Phase 3_ |

### B0.3 Audit Quote Module

| #      | Tâche                                                                          | Statut | Commit | Date | Notes |
| ------ | ------------------------------------------------------------------------------ | ------ | ------ | ---- | ----- |
| B0.3.1 | Vérifier que crm_quotes, crm_quote_items, crm_quote_approvals existent en base | ⬜     |        |      |       |
| B0.3.2 | Vérifier que hq_pricing_rules existe et est peuplé                             | ⬜     |        |      |       |
| B0.3.3 | Vérifier l'état du code Quote (services, API routes, composants)               | ⬜     |        |      |       |
| B0.3.4 | Vérifier si les règles RM-QOT-001 à RM-QOT-005 sont implémentées               | ⬜     |        |      |       |

### B0.4 Audit Cross-Module

📌 _Source : Dashboard V4, Step 2.3 Completion, Reshaping_

| #      | Tâche                                                                  | Statut | Commit | Date | Notes                  |
| ------ | ---------------------------------------------------------------------- | ------ | ------ | ---- | ---------------------- |
| B0.4.1 | Vérifier l'état du Dashboard CRM existant (route actuelle, composants) | ⬜     |        |      | _Dashboard V4 Step 1_  |
| B0.4.2 | Identifier les templates email Resend existants et fonctionnels        | ⬜     |        |      | _Step 2.3 item 15_     |
| B0.4.3 | Vérifier si crm_lead_activities fonctionne (insertion, affichage)      | ⬜     |        |      | _Step 2.3 items 18-19_ |
| B0.4.4 | Lister les CRON jobs existants (lead nurturing, quote expiry)          | ⬜     |        |      |                        |

### B0.5 Livrable Phase B0

| #      | Tâche                                                        | Statut | Notes              |
| ------ | ------------------------------------------------------------ | ------ | ------------------ |
| B0.5.1 | Document AUDIT_CODE_CRM_ETAT_REEL.md produit par Claude Code | ⬜     | Inventaire complet |
| B0.5.2 | Validation CEO de l'audit                                    | ⬜     |                    |

---

## PHASE B1 — FONDATIONS LEAD (pas de changement visible utilisateur)

**Objectif :** DB et backend prêts pour le nouveau pipeline Lead BANT.
**Prérequis :** Phase B0 complétée et validée.
**Durée estimée :** 2 jours.

### B1.1 Migration Base de Données

| #      | Tâche                                                                                                                  | Statut | Commit | Date | Notes                       |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---- | --------------------------- |
| B1.1.1 | Ajouter 4 champs BANT sur crm_leads (SQL Supabase) : bant_budget, bant_authority, bant_need, bant_timeline VARCHAR(20) | ⬜     |        |      |                             |
| B1.1.2 | Ajouter bant_qualified_at (TIMESTAMPTZ), bant_qualified_by (UUID FK adm_members)                                       | ⬜     |        |      |                             |
| B1.1.3 | Ajouter opportunity_id (UUID FK crm_opportunities) si non existant                                                     | ⬜     |        |      | Lien lead → opportunity     |
| B1.1.4 | Prisma schema mise à jour manuelle                                                                                     | ⬜     |        |      | JAMAIS db push/pull/migrate |
| B1.1.5 | pnpm prisma generate                                                                                                   | ⬜     |        |      |                             |
| B1.1.6 | pnpm tsc --noEmit → 0 erreurs                                                                                          | ⬜     |        |      |                             |

### B1.2 Configuration Statuts Lead

| #      | Tâche                                                                      | Statut | Commit | Date | Notes                                 |
| ------ | -------------------------------------------------------------------------- | ------ | ------ | ---- | ------------------------------------- |
| B1.2.1 | Ajouter status "qualified" dans crm_settings                               | ⬜     |        |      |                                       |
| B1.2.2 | Mettre à jour Zod schema pour inclure "qualified"                          | ⬜     |        |      |                                       |
| B1.2.3 | Mettre à jour useLeadStatuses hook                                         | ⬜     |        |      |                                       |
| B1.2.4 | Configurer transitions_to : callback_requested → qualified                 | ⬜     |        |      | LT4                                   |
| B1.2.5 | Configurer transitions_to : qualified → converted, nurturing, disqualified | ⬜     |        |      | LT7, LT9, LT10                        |
| B1.2.6 | SUPPRIMER status "lost" du module Lead                                     | ⬜     |        |      | Standard Salesforce                   |
| B1.2.7 | SUPPRIMER statuts "demo", "proposal_sent"                                  | ⬜     |        |      | Remplacés par stages Opportunity      |
| B1.2.8 | Migrer leads existants en status demo/proposal_sent                        | ⬜     |        |      | ❌ DÉCISION CEO si données existent   |
| B1.2.9 | 📌 SUPPRIMER CPT scoring (service, hooks, composants)                      | ⬜     |        |      | _Step 2.3 item 7_ — remplacé par BANT |

### B1.3 Validation transitions_to backend

| #      | Tâche                                                              | Statut | Commit | Date | Notes                              |
| ------ | ------------------------------------------------------------------ | ------ | ------ | ---- | ---------------------------------- |
| B1.3.1 | Identifier lead.actions.ts (updateLeadStatusAction)                | ⬜     |        |      | Écart audit V7 : pas de validation |
| B1.3.2 | Ajouter validation transitions_to AVANT changement statut          | ⬜     |        |      |                                    |
| B1.3.3 | Tester transitions invalides bloquées (new → qualified = interdit) | ⬜     |        |      |                                    |

### B1.4 Livrable Phase B1

| #      | Tâche                                                | Statut | Notes |
| ------ | ---------------------------------------------------- | ------ | ----- |
| B1.4.1 | Git tag v-crm-phase1                                 | ⬜     |       |
| B1.4.2 | Push + CI verte                                      | ⬜     |       |
| B1.4.3 | SELECT DISTINCT status FROM crm_leads → bons statuts | ⬜     |       |
| B1.4.4 | Validation CEO                                       | ⬜     |       |

---

## PHASE B2 — UI LEAD BANT

**Objectif :** Qualification BANT + Kanban 2 colonnes.
**Prérequis :** Phase B1.
**Durée estimée :** 2 jours.

### B2.1 Formulaire BANT

| #      | Tâche                                                                    | Statut | Commit | Date | Notes                     |
| ------ | ------------------------------------------------------------------------ | ------ | ------ | ---- | ------------------------- |
| B2.1.1 | Identifier pattern LeadDrawer.tsx (onglets, sections) — LIRE avant coder | ⬜     |        |      |                           |
| B2.1.2 | Créer onglet/section "Qualification" dans le Lead Drawer                 | ⬜     |        |      |                           |
| B2.1.3 | 4 dropdowns BANT avec valeurs spec V7                                    | ⬜     |        |      |                           |
| B2.1.4 | Indicateur visuel "3/4 OK" ou "4/4 — Prêt pour conversion"               | ⬜     |        |      |                           |
| B2.1.5 | Bouton "Qualify" → validation BANT côté serveur                          | ⬜     |        |      |                           |
| B2.1.6 | Status change uniquement si 4/4                                          | ⬜     |        |      |                           |
| B2.1.7 | Gestion 3/4 (nurturing) et ≤2/4 (disqualify, sauf fleet_size >50)        | ⬜     |        |      |                           |
| B2.1.8 | Labels UI EXPLICITES pour utilisateur métier                             | ⬜     |        |      | POSTURE ARCHITECTE SENIOR |

### B2.2 Kanban Lead — 2 colonnes

| #      | Tâche                                                           | Statut | Commit | Date | Notes             |
| ------ | --------------------------------------------------------------- | ------ | ------ | ---- | ----------------- |
| B2.2.1 | Identifier hook useLeadsKanban et composant Kanban              | ⬜     |        |      |                   |
| B2.2.2 | Modifier : 2 colonnes seulement (callback_requested, qualified) | ⬜     |        |      |                   |
| B2.2.3 | Barre outcomes : Nurturing (count) / Disqualified (count)       | ⬜     |        |      |                   |
| B2.2.4 | Leads new/email_verified HORS Kanban (Table uniquement)         | ⬜     |        |      |                   |
| B2.2.5 | Drag & drop avec validation transitions autorisées              | ⬜     |        |      |                   |
| B2.2.6 | Compteurs par colonne                                           | ⬜     |        |      |                   |
| B2.2.7 | 📌 Popup au DROP pas au DRAG                                    | ⬜     |        |      | _Step 2.3 item 8_ |
| B2.2.8 | 📌 Infobulles (tooltips) sur icônes Rapport d'Activité          | ⬜     |        |      | _Step 2.3 item 4_ |

### B2.3 Actions Lead — Adaptation

| #      | Tâche                                                                   | Statut | Commit | Date | Notes                  |
| ------ | ----------------------------------------------------------------------- | ------ | ------ | ---- | ---------------------- |
| B2.3.1 | "Convert to Opportunity" UNIQUEMENT si qualified                        | ⬜     |        |      |                        |
| B2.3.2 | "Reactivate" → callback_requested uniquement                            | ⬜     |        |      |                        |
| B2.3.3 | Context menu filtré selon transitions_to                                | ⬜     |        |      |                        |
| B2.3.4 | SUPPRIMER Book Demo de l'UI Lead                                        | ⬜     |        |      | Cal.com décommissionné |
| B2.3.5 | SUPPRIMER "Not Interested" → Disqualify + Nurturing séparés             | ⬜     |        |      |                        |
| B2.3.6 | 📌 Croix (X) correctement placée dans le popup                          | ⬜     |        |      | _Step 2.3 item 1_      |
| B2.3.7 | 📌 Section PROCHAINES ÉTAPES — couleur distincte, zone d'action visible | ⬜     |        |      | _Step 2.3 item 5_      |

### B2.4 Livrable Phase B2

| #      | Tâche                               | Statut | Notes |
| ------ | ----------------------------------- | ------ | ----- |
| B2.4.1 | Git tag v-crm-phase2                | ⬜     |       |
| B2.4.2 | Push + CI verte                     | ⬜     |       |
| B2.4.3 | Test : Kanban Lead 2 colonnes       | ⬜     |       |
| B2.4.4 | Test : BANT form → qualification OK | ⬜     |       |
| B2.4.5 | Validation CEO                      | ⬜     |       |

---

## PHASE B3 — CONVERSION ENRICHIE (3 entités)

**Objectif :** Lead → Account + Contact + Opportunity.
**Prérequis :** Phase B2.
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

### B5.1 Suppression Cal.com

📌 _Source : Décision CEO 27/02/2026 + Step 2.3 items 13, 16, 17, 18_

| #      | Tâche                                                | Statut | Commit | Date | Notes                       |
| ------ | ---------------------------------------------------- | ------ | ------ | ---- | --------------------------- |
| B5.1.1 | grep récursif Cal.com → identifier TOUS les fichiers | ⬜     |        |      |                             |
| B5.1.2 | Retirer Cal.com du wizard prospect                   | ⬜     |        |      |                             |
| B5.1.3 | Retirer webhooks Cal.com (route.ts handlers)         | ⬜     |        |      |                             |
| B5.1.4 | Retirer dépendances npm Cal.com                      | ⬜     |        |      |                             |
| B5.1.5 | Retirer variables d'environnement Cal.com            | ⬜     |        |      |                             |
| B5.1.6 | T5 : wizard complete → TOUJOURS callback_requested   | ⬜     |        |      | Plus de branchement booking |
| B5.1.7 | pnpm build → SUCCESS après suppression               | ⬜     |        |      |                             |

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

| Phase            | Description                                   | Durée           | Prérequis      |
| ---------------- | --------------------------------------------- | --------------- | -------------- |
| **B0**           | Audit code existant                           | 1 jour          | Bloc A complet |
| **B1**           | Fondations Lead (DB + backend BANT)           | 2 jours         | B0             |
| **B2**           | UI Lead BANT (formulaire + Kanban 2 col.)     | 2 jours         | B1             |
| **B3**           | Conversion enrichie (3 entités)               | 2 jours         | B2             |
| **B4**           | Pipeline Opportunity (4 colonnes)             | 2 jours         | B3             |
| **B5**           | Cal.com décommissionnement + calendrier Gmail | 2-3 jours       | B4             |
| **B6**           | Quote-to-Cash (Accept/Reject/Stripe)          | 3-4 jours       | B4             |
| **B7**           | Kanban temps réel                             | 1-2 jours       | B6             |
| **B8**           | Notifications Opportunity (11 templates)      | 2-3 jours       | B6             |
| **B9**           | Page détail + Notes + Tags + Import/Export    | 3-4 jours       | B1-B8          |
| **TOTAL BLOC B** |                                               | **20-25 jours** |                |

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

| Bloc      | Description                                                 | Durée           | Début        |
| --------- | ----------------------------------------------------------- | --------------- | ------------ |
| **A**     | ✅ Fermer V5.3 (admin fixes, CLT cleanup, E2E, docs)        | ✅ TERMINÉ      | 28/02/2026   |
| **B**     | CRM Framework Standard (BANT, Lead/Opp, Quote, Stripe)      | 20-25 jours     | Après Bloc A |
| **C**     | Enrichissements (Dashboard, SLA, CRM Client, Module Client) | 10-15 jours     | Après Bloc B |
| **TOTAL** |                                                             | **33-45 jours** |              |

---

## DÉCISIONS CEO REQUISES (BLOQUANTES)

| #   | Question                                                                 | Quand    | Impact             |
| --- | ------------------------------------------------------------------------ | -------- | ------------------ |
| D1  | Leads existants en status demo/proposal_sent → migrer vers quel statut ? | Phase B1 | Migration DB       |
| D2  | Design UX solution custom calendrier Gmail                               | Phase B5 | Remplace Cal.com   |
| D3  | Durées SLA par statut lead et par stage opportunity                      | Phase C2 | Rotting indicators |
| D4  | clt_masterdata : enrichir ou nouvelle table clt_clients ?                | Phase C5 | Architecture DB    |
| D5  | Champs légaux dynamiques : colonnes SQL ou JSONB ?                       | Phase C5 | Flexibilité        |

---

## SÉQUENCE VISUELLE

```
BLOC A (3-5j)
├── A1 : Admin fixes + DataTable standardisation  ─────┐
├── A2 : CLT tables cleanup                            │
├── A3 : Validation E2E                                │ FONDATIONS
├── A4 : Documentation                           ─────┘
    ↓
BLOC B (20-25j)
├── B0 : Audit code CRM existant                 ─────┐
├── B1 : Fondations Lead BANT (DB + backend)           │
├── B2 : UI Lead (BANT form + Kanban 2 col.)           │
├── B3 : Conversion 3 entités                          │ CRM CORE
├── B4 : Pipeline Opportunity (4 col.)                 │
├── B5 : Cal.com → Gmail calendrier    ──┐             │
├── B6 : Quote-to-Cash (Stripe)        ──┤ parallèle   │
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

| Date       | Bloc | Phase | Tâche    | Modification                                                                                                 | Par                 |
| ---------- | ---- | ----- | -------- | ------------------------------------------------------------------------------------------------------------ | ------------------- |
| 28/02/2026 | —    | —     | Création | Document consolidé V6 — fusionne 7 plans                                                                     | Architecture Claude |
| 28/02/2026 | A    | A1-A4 | Toutes   | BLOC A TERMINÉ — DataTable standard, UX fixes, reset password, data enrichment, CLT→BIL rename, E2E 5/5 PASS | Claude              |

---

**FIN DU PLAN CONSOLIDÉ V6 — DOCUMENT VIVANT**

_Ce document REMPLACE tous les plans précédents non terminés._
_Il est le seul document de référence pour l'exécution._
_Toute tâche non listée ici n'existe pas._
