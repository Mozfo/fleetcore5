# DETTE-V3 — Rapport Final

## Suppression Scoring ICP + lead_stage

**Date**: 2026-03-03
**Scope**: Suppression complète du scoring ICP zombie et du champ lead_stage
**Résultat**: tsc PASS, 0 erreurs

---

## Résumé exécutif

| Métrique                | Valeur             |
| ----------------------- | ------------------ |
| Fichiers supprimés      | 9                  |
| Fichiers modifiés       | ~80                |
| Lignes supprimées       | ~4 500+            |
| Lignes ajoutées         | ~50                |
| Champs Prisma supprimés | 8 (+ 1 enum)       |
| Index supprimés         | 4                  |
| Clés i18n supprimées    | 32 (16 EN + 16 FR) |

---

## Fichiers supprimés (9)

| Fichier                                                               | Raison                              | Lignes |
| --------------------------------------------------------------------- | ----------------------------------- | ------ |
| `lib/services/crm/lead-scoring.service.ts`                            | Moteur ICP scoring — 100% zombie    | 901    |
| `lib/services/crm/__tests__/lead-scoring.service.test.ts`             | Tests scoring                       | ~300   |
| `lib/services/crm/__tests__/lead-scoring.service.integration.test.ts` | Tests intégration scoring           | ~200   |
| `lib/actions/crm/qualify.actions.ts`                                  | Progression stage ICP (TOF→MQL→SQL) | ~150   |
| `lib/hooks/useLeadStages.ts`                                          | Hook UI lead_stage                  | 233    |
| `app/api/v1/crm/leads/[id]/recalculate/route.ts`                      | Endpoint recalcul ICP               | ~80    |
| `scripts/degrade-inactive-leads.ts`                                   | Script dégradation score            | ~100   |
| `scripts/test-stage-change.ts`                                        | Script test stage                   | 135    |
| `scripts/test-phase2-integration.ts`                                  | Script test intégration             | 417    |

---

## Phases exécutées

### Phase A — Inventaire

- 57 fichiers ICP scoring (~420 refs)
- 68 fichiers lead_stage (~300 refs)
- 5 points de vigilance identifiés et validés par le CEO

### Phase B — Neutraliser moteur scoring

- Supprimé `LeadScoringService` (901 lignes)
- Nettoyé `lead-creation.service.ts` — supprimé scoring calculation, `determinePriority`, scoring fields
- Supprimé endpoint `/recalculate`, export service, 3 scripts morts
- Nettoyé notifications (`SalesRepAssignmentPayload`) et email template

### Phase C — Neutraliser lead_stage workflow

- Supprimé `qualify.actions.ts` (progression stage)
- Supprimé `useLeadStages.ts` (hook UI)
- Migré `convert.actions.ts` : `lead_stage !== "sales_qualified"` → `status !== "qualified"`
- Nettoyé 3 services (wizard, email-verification, demo-leads) — supprimé `lead_stage: "top_of_funnel"` writes
- Nettoyé 5 API routes — supprimé filtrage, tri, business logic, response mapping
- Nettoyé `useSavedViews.ts` — supprimé lead_stage default + migré "Qualified Leads" vue

### Phase D — Nettoyer UI

- 12 composants nettoyés (KanbanCard, LeadDetailHeader, LeadDrawerSections, etc.)
- Supprimé colonnes scoring des tables, filtres sidebar, badges stage
- Supprimé `PipelineSettingsTab` lead stages UI (CRM Settings)
- Supprimé `OutcomesBar` scoring widgets, `QualityScores` dashboard widget
- Supprimé `AvgScoreCard` du dashboard

### Phase E — Types, validators, config, Prisma, tests, i18n

- Supprimé du type `Lead` : `lead_stage`, `fit_score`, `engagement_score`, `qualification_score`, `scoring`, `qualification_notes`
- Supprimé `LeadQualifySchema` + `LeadQualifyInput` (validators)
- Nettoyé `UpdateLeadSchema` — supprimé `lead_stage` field
- Nettoyé `filter-config.ts` — supprimé 4 filter fields
- Prisma : supprimé 7 colonnes + `stage_entered_at` + 4 index + enum `lead_stage`
- `pnpm prisma generate` PASS
- Nettoyé 6 fichiers tests (fixtures, assertions, mock data)
- Nettoyé 32 clés i18n (EN + FR)

### Phase F — Script SQL

- Fichier : `prisma/migrations/manual/20260303_dette_v3_drop_scoring_stage.sql`
- 4 DROP INDEX + 7 DROP COLUMN + 1 DROP TYPE + 1 CREATE INDEX replacement
- Idempotent (IF EXISTS), transactionnel (BEGIN/COMMIT)
- A exécuter APRÈS déploiement du code

---

## Points de vigilance — Statut

| #   | Point                                                                     | Statut   |
| --- | ------------------------------------------------------------------------- | -------- |
| 1   | `convert.actions.ts` : migrer gate `lead_stage` → `status`                | FAIT     |
| 2   | `stage_entered_at` : supprimer côté Lead UNIQUEMENT, garder Opportunity   | FAIT     |
| 3   | `opportunity.actions.ts` : NE PAS TOUCHER                                 | RESPECTÉ |
| 4   | `qualify.actions.ts` : supprimé (100% stage, BANT via `qualify/route.ts`) | FAIT     |
| 5   | `qualify/route.ts` : vérifié 100% BANT — GARDÉ intact                     | FAIT     |

---

## Colonnes DB à dropper (Phase F)

```
crm_leads.fit_score            Decimal(5,2)
crm_leads.engagement_score     Decimal(5,2)
crm_leads.qualification_score  Int
crm_leads.qualification_notes  String
crm_leads.scoring              Json
crm_leads.lead_stage           lead_stage (enum)
crm_leads.stage_entered_at     DateTime
```

Enum à dropper : `lead_stage` (top_of_funnel, marketing_qualified, sales_qualified, opportunity)

Index à dropper :

- `idx_crm_leads_lead_stage`
- `idx_crm_leads_qualification_score`
- `idx_crm_leads_status_stage_deleted`
- `idx_crm_leads_stage_entered`

---

## Vérification

```
pnpm tsc --noEmit   → PASS (0 erreurs)
pnpm prisma generate → PASS
```

---

## Résidu accepté (3 occurrences)

1. `scripts/seed-crm-settings.ts:12` — commentaire "lead_stages removed in DETTE-V3"
2. `lib/repositories/crm/settings.repository.ts:515` — commentaire documentant les clés supprimées
3. `prisma/seed.ts:990` — HTML inline dans `body_translations` email template (sera regénéré par `regenerate-templates-from-react-email.ts`)
