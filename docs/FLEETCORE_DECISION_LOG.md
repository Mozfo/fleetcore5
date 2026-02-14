# PHASE 1C — Journal des Ecarts et Decisions

> Document vivant. Mis a jour a chaque step.
> Derniere mise a jour : 2026-02-10 — Steps 1 a 5 termines (non commites)

---

## SECTION 1 — RESUME ETAT COURANT

| Donnee           | Valeur                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Steps completes  | 1, 2, 3, 4, 5 + correction duplication + fix L247                                                                       |
| Steps restants   | 6, 7, 8                                                                                                                 |
| Dernier commit   | `42f0058` chore: remove legacy next.config.mjs                                                                          |
| Tag courant      | `post-phase-1b`                                                                                                         |
| Etat git         | 2 modifies (package.json, pnpm-lock.yaml), 3 non-trackes (app/api/auth/, lib/config/refine-mappings.ts, lib/providers/) |
| Fichiers stages  | 0                                                                                                                       |
| Commits Phase 1C | 0 (tout sera commite ensemble a la fin)                                                                                 |
| Typecheck        | 0 erreurs                                                                                                               |
| Build            | Succes                                                                                                                  |

### Inventaire fichiers Phase 1C (13 fichiers)

| #   | Fichier                                         | Lignes | Step  |
| --- | ----------------------------------------------- | ------ | ----- |
| 1   | lib/providers/refine-mappers.ts                 | 88     | 2     |
| 2   | lib/providers/refine-data-provider.ts           | 271    | 2     |
| 3   | lib/providers/refine-auth-provider.ts           | 78     | 3     |
| 4   | lib/providers/refine-access-control-provider.ts | 36     | 3+fix |
| 5   | lib/providers/refine-i18n-provider.ts           | 17     | 4     |
| 6   | lib/providers/refine-notification-provider.ts   | 30     | 4     |
| 7   | lib/providers/refine-audit-log-provider.ts      | 19     | 4     |
| 8   | lib/providers/refine-resources.ts               | 29     | 4     |
| 9   | lib/config/refine-mappings.ts                   | 38     | fix   |
| 10  | app/api/auth/check/route.ts                     | 8      | 5     |
| 11  | app/api/auth/identity/route.ts                  | 22     | 5     |
| 12  | app/api/auth/can/route.ts                       | 28     | 5     |
| 13  | package.json (modifie, +3 deps)                 | -      | 1     |

---

## SECTION 2 — HISTORIQUE DES ECARTS

### ECART 1 — Duplication RESOURCE_TO_MODULE + ACTION_MAP

| Champ                   | Detail                                                                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                                                                                    |
| Step concerne           | Step 5 (API routes auth) + Step 3 (AccessControlProvider)                                                                                                                     |
| Ce que le plan disait   | Step 5 : can/route.ts ~20L                                                                                                                                                    |
| Ce qui a ete implemente | can/route.ts = 56L avec maps RESOURCE_TO_MODULE (13 entrees) et ACTION_MAP (6 entrees) dupliquees depuis refine-access-control-provider.ts                                    |
| Cause racine            | Le prompt Step 5 n'a pas reference les fichiers crees aux Steps precedents. Claude Code a recree les maps localement au lieu d'importer.                                      |
| Decision                | CEO — extraction immediate dans lib/config/refine-mappings.ts (38L). Zero dette technique.                                                                                    |
| Correction              | Cree lib/config/refine-mappings.ts. Supprime les maps locales dans refine-access-control-provider.ts et can/route.ts. Les deux importent desormais depuis refine-mappings.ts. |
| Resultat apres fix      | can/route.ts = 28L, refine-access-control-provider.ts = 36L                                                                                                                   |
| Impact                  | Fichier supplementaire (13 au lieu de 12). Aucun impact fonctionnel.                                                                                                          |
| Verification            | `grep "const RESOURCE_TO_MODULE" lib/ app/` → 1 seul resultat (refine-mappings.ts). 2 consommateurs via import.                                                               |

---

### ECART 2 — 3 resources manquantes (users, roles, audit)

| Champ                   | Detail                                                                                                                                                                                                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                                                                                                                                                                                                         |
| Step concerne           | Step 3 (AccessControlProvider) — critere V4                                                                                                                                                                                                                                                        |
| Ce que le plan disait   | Ligne 620 du plan : exige 11 resources dont `users`, `roles`, `audit`                                                                                                                                                                                                                              |
| Ce qui a ete implemente | 13 resources SANS users, roles, audit                                                                                                                                                                                                                                                              |
| Cause racine            | Erreur dans le plan d'execution. Le plan a suppose l'existence de modules `users`, `roles`, `audit` dans le systeme RBAC. Verification : `grep "users\|roles\|audit" lib/config/permissions.ts` → aucun match comme ModuleKey. Ces modules n'existent pas dans `type ModuleKey` de permissions.ts. |
| Decision                | CEO — plan errone. Ces cles n'existent pas dans le systeme RBAC FleetCore. Pas d'ajout.                                                                                                                                                                                                            |
| Impact                  | Critere V4 du Step 3 dans le plan d'execution doit etre corrige.                                                                                                                                                                                                                                   |
| Verification            | `ModuleKey` dans permissions.ts = `"crm" \| "fleet" \| "drivers" \| "maintenance" \| "dashboard" \| "analytics" \| "settings" \| "admin"` — 8 modules, aucun n'est `users`, `roles`, ou `audit`.                                                                                                   |

---

### ECART 3 — 5 resources supplementaires (orders, agreements, activities, dashboard, admin)

| Champ                   | Detail                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                                                                                                                                                                                                                                                                                       |
| Step concerne           | Step 3 (AccessControlProvider) — RESOURCE_TO_MODULE                                                                                                                                                                                                                                                                                                                              |
| Ce que le plan disait   | Ligne 620 : liste de 11 resources, ne mentionne pas orders, agreements, activities, dashboard, admin                                                                                                                                                                                                                                                                             |
| Ce qui a ete implemente | 13 cles dans RESOURCE_TO_MODULE incluant ces 5                                                                                                                                                                                                                                                                                                                                   |
| Cause racine            | Claude Code a analyse permissions.ts et ajoute tous les modules existants dans le RBAC. `orders`, `agreements`, `activities` sont mappes a `"crm"` (coherent — ce sont des entites CRM). `dashboard` et `admin` existent comme ModuleKey dans permissions.ts avec des permissions definies (dashboard:view, dashboard:edit, admin:view, admin:create, admin:edit, admin:delete). |
| Decision                | CEO — garder. C'est coherent avec le systeme RBAC reel. Le plan etait incomplet.                                                                                                                                                                                                                                                                                                 |
| Impact                  | Aucun impact negatif. Couverture RBAC plus complete que prevu.                                                                                                                                                                                                                                                                                                                   |
| Verification            | `grep "dashboard\|admin" lib/config/permissions.ts` → confirme l'existence de ces modules avec permissions associees.                                                                                                                                                                                                                                                            |

---

### ECART 4 — audit-log-provider no-op vs pont reel

| Champ                   | Detail                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                                                                                                                                                                                                                                                                                                           |
| Step concerne           | Step 4 (Providers secondaires)                                                                                                                                                                                                                                                                                                                                                                       |
| Ce que le plan disait   | Lignes 648-651 : "Pont vers adm_audit_logs existant, appelle le Server Action de logging existant."                                                                                                                                                                                                                                                                                                  |
| Ce qui a ete implemente | No-op : `create: async () => ({})`, `get: async () => []`, `update: async () => ({})`                                                                                                                                                                                                                                                                                                                |
| Cause racine            | Le plan a suppose l'existence d'une Server Action d'audit appelable depuis le client. Verification approfondie : `grep -rn "adm_audit\|audit_log\|createAuditLog" lib/ app/` → tous les appels `db.adm_audit_logs.create()` sont embedded dans les Server Actions metier (orders.actions.ts, lib/audit.ts, etc.). Aucune Server Action exportee et client-callable n'existe pour creer un audit log. |
| Decision                | CEO — no-op accepte. Architecture correcte : l'audit est deja capture par les Server Actions appelees via le DataProvider. Creer un pont impliquerait d'exposer un endpoint d'audit cote client, ce qui n'est pas souhaitable (risque de securite).                                                                                                                                                  |
| Impact                  | Aucun. Le flux est : Refine → DataProvider → Server Actions → audit embedded. Les audits continuent a fonctionner exactement comme avant.                                                                                                                                                                                                                                                            |
| Verification            | `cat lib/providers/refine-audit-log-provider.ts` → 19L, no-op confirme.                                                                                                                                                                                                                                                                                                                              |

---

### ECART 5 — refine-access-control-provider.ts 70L puis 36L vs 30-40L

| Champ                   | Detail                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                                 |
| Step concerne           | Step 3 (AccessControlProvider)                                                                                             |
| Ce que le plan disait   | ~30-40L                                                                                                                    |
| Ce qui a ete implemente | Initial : 70L (maps RESOURCE_TO_MODULE + ACTION_TO_PERMISSION definies localement = ~28L de maps). Apres extraction : 36L. |
| Cause racine            | Meme cause que ecart 1. Les maps occupaient ~28L dans le fichier.                                                          |
| Decision                | Corrige par l'extraction (ecart 1). 36L est dans la fourchette 30-40L.                                                     |
| Impact                  | Resolu.                                                                                                                    |
| Verification            | `wc -l lib/providers/refine-access-control-provider.ts` → 36                                                               |

---

### ECART 6 — refine-resources.ts 29L vs ~50L

| Champ                   | Detail                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                                                                          |
| Step concerne           | Step 4 (Providers secondaires)                                                                                                                                      |
| Ce que le plan disait   | ~50L                                                                                                                                                                |
| Ce qui a ete implemente | 29L                                                                                                                                                                 |
| Cause racine            | Le plan estimait ~50L pour plusieurs resources. Phase 1C n'enregistre que "leads" (1 seule resource = 1 bloc de ~12L de config + ~17L de boilerplate/commentaires). |
| Decision                | CEO — accepte. Fichier extensible. Chaque nouvelle resource ajoutera ~10-12L.                                                                                       |
| Impact                  | Aucun. Le fichier atteindra ~50L quand 3-4 resources seront ajoutees.                                                                                               |
| Verification            | `cat lib/providers/refine-resources.ts` → 1 resource "leads" avec list/show/create/edit + meta.                                                                     |

---

### ECART 7 — identity/route.ts 22L vs ~15L

| Champ                   | Detail                                                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                                                                            |
| Step concerne           | Step 5 (API routes auth)                                                                                                                                              |
| Ce que le plan disait   | ~15L                                                                                                                                                                  |
| Ce qui a ete implemente | 22L                                                                                                                                                                   |
| Cause racine            | Guard 401 (+3L : if !userId, return 401, ligne vide) et formatage (2L imports, 1L JSDoc, 1L ligne vide apres auth destructure) non prevus dans l'estimation minimale. |
| Decision                | CEO — accepte. Le guard 401 est necessaire (sans lui, currentUser() serait appele inutilement et le response object serait incomplet).                                |
| Impact                  | Aucun.                                                                                                                                                                |
| Verification            | `cat app/api/auth/identity/route.ts` → 22L confirme.                                                                                                                  |

---

### ECART 8 — data-provider.ts 271L vs ~200-250L

| Champ                   | Detail                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                                                                                                                                      |
| Step concerne           | Step 2 (DataProvider)                                                                                                                                                                                                           |
| Ce que le plan disait   | ~200-250L                                                                                                                                                                                                                       |
| Ce qui a ete implemente | 271L                                                                                                                                                                                                                            |
| Decomposition           | ~38L commentaires purs (JSDoc, inline), ~13L lignes vides, ~10L separateurs visuels (-----), ~16L imports/interfaces, ~194L code executable                                                                                     |
| Cause racine            | Le plan estimait le code effectif. 271L inclut des separateurs visuels (10L) et des commentaires JSDoc detailles (38L) qui n'etaient pas comptes dans l'estimation. Le code effectif (~210L) est dans la fourchette 200-250L.   |
| Decision                | CEO — accepte. Les commentaires et separateurs ameliorent la lisibilite. Aucun code mort detecte.                                                                                                                               |
| Code mort               | AUCUN. Toutes les fonctions sont referencees : safeJson (L96), fetchApi (L87,151,167,179,222,254), createHttpError (L58,105,114,127,247), unwrapActionResult (L122,209,217), getList/getOne/create/update/deleteOne (L264-270). |
| Impact                  | Aucun.                                                                                                                                                                                                                          |

---

### ECART 9 — Fichier non prevu : lib/config/refine-mappings.ts

| Champ                   | Detail                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                          |
| Step concerne           | Correction post-Step 5                                                                                              |
| Ce que le plan disait   | Fichier non prevu dans le plan d'execution                                                                          |
| Ce qui a ete implemente | lib/config/refine-mappings.ts (38L) — exporte RESOURCE_TO_MODULE et ACTION_TO_PERMISSION                            |
| Cause racine            | Correction de l'ecart 1 (duplication). L'extraction dans un module partage est la bonne pratique.                   |
| Decision                | CEO — approuve. Single source of truth.                                                                             |
| Impact                  | Inventaire Phase 1C passe de 12 a 13 fichiers. 2 consommateurs : refine-access-control-provider.ts et can/route.ts. |
| Verification            | `grep "const RESOURCE_TO_MODULE" lib/ app/` → 1 seul resultat. `grep -rn "refine-mappings"` → 2 imports.            |

---

### ECART 10 — Bug undefined guard dans deleteOne (L247)

| Champ                   | Detail                                                                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                                                                                                                                                                                            |
| Step concerne           | Step 2 (DataProvider) — deleteOne, case "leads"                                                                                                                                                                                                                                       |
| Ce que le plan disait   | N/A — bug dans le code genere, pas un ecart de spec                                                                                                                                                                                                                                   |
| Ce qui a ete implemente | L247 : `throw createHttpError(400, result.error)` — `result.error` est type `string \| undefined` mais `createHttpError(statusCode, message: string)` exige un `string`. TypeScript ne detecte pas l'erreur car le type `result` est `Record<string, unknown>` avec `error?: string`. |
| Cause racine            | Le case "leads" dans deleteOne (L240-249) a ete ecrit manuellement sans le pattern `unwrapActionResult()` utilise dans update (L209, L217). Le guard `if (!result.success)` a L246 intercepte le cas d'erreur mais passe `result.error` directement sans fallback.                    |
| Correction              | `throw createHttpError(400, result.error)` → `throw createHttpError(400, result.error ?? "Delete failed")`                                                                                                                                                                            |
| Decision                | CEO — corrige immediatement. Bug potentiel en runtime si `deleteLeadAction` retourne `{ success: false }` sans champ `error`.                                                                                                                                                         |
| Impact                  | 1 ligne modifiee. Aucun changement fonctionnel pour les cas ou `result.error` est defini. Protege contre le cas edge ou `error` est `undefined`.                                                                                                                                      |
| Verification            | `pnpm tsc --noEmit` → 0 erreurs. L247 contient desormais `result.error ?? "Delete failed"`.                                                                                                                                                                                           |

---

### ECART 11 — Option useNewQueryKeys inexistante en Refine v5

| Champ                   | Detail                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Date                    | 2026-02-10                                                                                                                            |
| Step concerne           | Step 6 (Montage RefineProvider dans layout)                                                                                           |
| Ce que le plan disait   | Ligne 773 : options incluent `useNewQueryKeys: true`                                                                                  |
| Ce qui a ete implemente | Option retiree — `IRefineOptions` de `@refinedev/core` 5.0.9 ne contient pas `useNewQueryKeys`. TypeScript erreur TS2353 si presente. |
| Cause racine            | Le plan referençait une option Refine v4. En v5, les nouveaux query keys sont le comportement par defaut — l'option a ete supprimee.  |
| Decision                | CEO — option retiree, pas d'impact fonctionnel. Le comportement v5 est identique a `useNewQueryKeys: true` de v4.                     |
| Impact                  | Aucun. 4 options appliquees au lieu de 5 : `disableTelemetry`, `syncWithLocation`, `warnWhenUnsavedChanges`, `projectId`.             |
| Verification            | `pnpm tsc --noEmit` → 0 erreurs. `pnpm build` → succes.                                                                               |

---

## SECTION 3 — MISES A JOUR PLAN REQUISES

Les modifications suivantes doivent etre apportees au plan d'execution
(FLEETCORE_EXECUTION_PLAN_PHASES_1_2_3.md) pour refleter la realite :

| #   | Localisation plan    | Modification                                                                                                                                                                                |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Ligne 620, Step 3 V4 | Remplacer la liste de 11 resources par les 13 reelles : leads, opportunities, quotes, orders, agreements, activities, vehicles, drivers, maintenance, dashboard, analytics, settings, admin |
| 2   | Ligne 620, Step 3 V4 | Supprimer users, roles, audit (n'existent pas comme ModuleKey)                                                                                                                              |
| 3   | Step 5 estimation    | can/route.ts : ~20L → ~28L (maps importees, pas definies localement)                                                                                                                        |
| 4   | Step 4 estimation    | audit-log-provider : ~30L → ~19L (no-op, pas pont reel)                                                                                                                                     |
| 5   | Step 4 estimation    | refine-resources.ts : ~50L → ~29L (1 seule resource Phase 1C)                                                                                                                               |
| 6   | Step 5 estimation    | identity/route.ts : ~15L → ~22L (guard 401 necessaire)                                                                                                                                      |
| 7   | Step 4 description   | audit-log-provider : "Pont vers adm_audit_logs" → "Placeholder no-op (audit embedded dans Server Actions)"                                                                                  |
| 8   | Inventaire Phase 1C  | Ajouter lib/config/refine-mappings.ts (38L) — 13 fichiers au total                                                                                                                          |
| 9   | Step 2 estimation    | data-provider.ts : ~200-250L → ~271L (dont ~61L commentaires/vides/separateurs)                                                                                                             |
| 10  | Step 6, ligne 773    | Supprimer `useNewQueryKeys: true` — option Refine v4 inexistante en v5                                                                                                                      |

---

## SECTION 4 — PROCESSUS AMELIORATIONS

### Regles de gestion des ecarts

1. **Detection** : Tout ecart identifie lors d'un audit est documente IMMEDIATEMENT dans ce fichier.
2. **Format** : Chaque ecart suit la structure tableau avec : date, step, plan vs reel, cause racine, decision, impact, verification.
3. **Decision** : Chaque ecart requiert une decision explicite (CEO, CTO, ou equipe technique) avec date.
4. **Verification** : Chaque ecart inclut une commande de verification reproductible.
5. **Mise a jour** : Ce document est mis a jour a CHAQUE step (6, 7, 8) et a chaque correction.

### Lecons apprises (Steps 1-5)

| #   | Lecon                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Les prompts de step doivent EXPLICITEMENT referencer les fichiers crees aux steps precedents pour eviter la duplication.                                                |
| 2   | Les estimations de lignes dans le plan sont des ordres de grandeur, pas des specs rigides. La variance acceptable est +/- 50%.                                          |
| 3   | Les hypotheses du plan (existence de modules, Server Actions client-callable) doivent etre verifiees AVANT execution, pas apres.                                        |
| 4   | L'architecture audit server-side-only est une decision d'architecture correcte, pas un manque.                                                                          |
| 5   | La correction de duplication doit etre faite IMMEDIATEMENT, pas repoussee.                                                                                              |
| 6   | Quand un helper comme `unwrapActionResult()` existe, l'utiliser systematiquement. Le code duplique manuellement (guard + throw) introduit des bugs que le helper evite. |
