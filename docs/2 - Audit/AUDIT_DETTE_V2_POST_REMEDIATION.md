# AUDIT DETTE V2 — Mesure de progres post V1+V2+V3

**Date** : 2026-03-04
**Commit de reference** : `fad3a5e` (main)
**Contexte** : Audit initial avait identifie 74 problemes. Trois vagues de remediation executees (V1 purge, V2 unification, V3 scoring ICP). Ce rapport mesure le progres.

---

## TABLEAU COMPARATIF AVANT/APRES

| Categorie                    |  AVANT (initial)  |  APRES (V1+V2+V3)   |   Delta   |    Score     |
| ---------------------------- | :---------------: | :-----------------: | :-------: | :----------: |
| 1. Colonnes fantomes         |         8         |          7          |    -1     |     SALE     |
| 2. Vestiges Cal.com          |        14         |          0          |  **-14**  |    PROPRE    |
| 3. Scoring ICP vs BANT       |         6         |          3          |    -3     |  ACCEPTABLE  |
| 4. Code duplique             |        10         |          3          |  **-7**   |  ACCEPTABLE  |
| 5. Fichiers morts            |         7         |          1          |  **-6**   |    PROPRE    |
| 6. Routes API mortes         |        19         |          0          |  **-19**  |    PROPRE    |
| 7. Services/repos morts      |        10         |          0          |  **-10**  |    PROPRE    |
| 8. Incoherences archi        |         5         |          3          |    -2     |     SALE     |
| ---------------------------- | ----------------- | ------------------- | --------- | ------------ |
| **TOTAL**                    |      **79**       |       **17**        |  **-62**  |              |

**Score global : 79 → 17 (reduction de 78%)**

---

## DETAIL PAR CATEGORIE

---

### CATEGORIE 1 : Colonnes fantomes (UI sans WRITE) — 8 → 7

**Methode** : Pour chaque colonne affichee dans la DataTable/Drawer/Detail, verifier si un PATCH/action/form permet de l'ecrire.

#### RESOLUS (2 problemes fixes)

| Colonne          | Resolution                                          |
| ---------------- | --------------------------------------------------- |
| city             | Ajoute a UpdateLeadSchema — editable dans le drawer |
| next_action_date | Ajoute dans LeadDrawer (edit mode, lignes 210-214)  |

#### TOUJOURS PRESENTS (7 colonnes ghost)

| Colonne            | Affiche dans             | Write path ?                      |
| ------------------ | ------------------------ | --------------------------------- |
| industry           | lead-columns.tsx (table) | Aucun (pas dans UpdateLeadSchema) |
| company_size       | API response PATCH       | Aucun                             |
| linkedin_url       | API response PATCH       | Aucun                             |
| source_id          | lead-columns.tsx (table) | Aucun (immutable apres creation)  |
| loss_reason_code   | lead-columns.tsx L806    | Aucun endpoint ne le set          |
| loss_reason_detail | lead-columns.tsx L818    | Aucun endpoint ne le set          |
| competitor_name    | lead-columns.tsx L831    | Aucun endpoint ne le set          |

**Note** : Les colonnes callback*\*, disqualified*_, email*verification*_, recovery\_\* sont geres par des endpoints dedies (request-callback, disqualify, verify-email, cron) — ce ne sont PAS des fantomes. Les colonnes detected_country_code, ip_address, language, last_activity_at sont auto-detectees/calculees — affichage read-only par design.

**Verdict** : SALE — 7 colonnes affichees sans mecanisme d'ecriture. Les champs closing (loss_reason_code, loss_reason_detail, competitor_name) sont les plus critiques car ils suggerent un workflow qui n'existe pas cote API.

---

### CATEGORIE 2 : Vestiges Cal.com — 14 → 0

**Methode** : Grep exhaustif de cal.com, calcom, booking_slot, booking_confirmed, reschedule_token, attendance_confirmed, j1_reminder, etc.

**Resultat : ZERO reference Cal.com dans le code source.**

- `cal.com`, `calcom`, `cal_com` → 0 match
- `booking_slot`, `booking_confirmed`, `booking_calcom` → 0 match
- `reschedule_token`, `reschedule-token` → 0 match
- `attendance_confirmed`, `j1_reminder`, `confirmation_token` → 0 match
- `CalBookingStep`, `CalendarStep`, `CalEmbed` → 0 match

Les pages `/book-demo/*` sont des pages ACTIVES du funnel public (wizard email → verify → profile). Ce n'est PAS du vestige Cal.com.

**Verdict** : PROPRE — V1 a entierement nettoye les 14 vestiges Cal.com.

---

### CATEGORIE 3 : Scoring ICP vs BANT — 6 → 3

**Methode** : Grep de fit_score, engagement_score, qualification_score, qualification_notes, lead_stage, TOF/MQL/SQL.

**Resultat : Les colonnes DB et le code applicatif ICP sont supprimes. 3 residus restent.**

#### RESOLUS

| Probleme                               | Resolution                                 |
| -------------------------------------- | ------------------------------------------ |
| Colonnes DB (fit_score, etc.)          | Retirees du schema Prisma, script SQL pret |
| Code applicatif (scoring services)     | Supprime (4500+ lignes)                    |
| Types (LeadStage, qualification_score) | Retires de types/crm.ts et validators      |

#### RESIDUS (3)

| Residu                    | Fichier                                    | Impact                                             |
| ------------------------- | ------------------------------------------ | -------------------------------------------------- |
| `avg-score-card.tsx`      | features/crm/dashboard/components/widgets/ | Widget deprecated, pas exporte mais fichier existe |
| `enrich-crm-settings.ts`  | scripts/                                   | Script seed reference lead_scoring_config          |
| `seed-priority-config.ts` | scripts/\_archived/                        | Script archive, priority basee sur scores          |

**Note** : `fit_score_weight` dans `useFleetSizeOptions.ts` n'est PAS du scoring ICP — c'est un poids simple pour qualifier la taille de flotte dans le wizard book-demo. Les references dans les fichiers de test sont des fixtures mock.

**Verdict** : ACCEPTABLE — Le coeur ICP est mort. Restent 1 widget deprecated + 2 scripts seeds.

---

### CATEGORIE 4 : Code duplique — 10 → 3

| #   | Probleme                  | Statut              | Details                                                            |
| --- | ------------------------- | ------------------- | ------------------------------------------------------------------ |
| 1   | formatDate()              | RESOLU              | Source unique `lib/format.ts`, 31 consommateurs                    |
| 2   | Lead status lists         | RESOLU              | Source unique `lead-status.constants.ts`, 34 refs                  |
| 3   | Lead type (interface)     | PARTIEL (by design) | `types/crm.ts` (base) + `lib/types/crm/lead.types.ts` (specialise) |
| 4   | createLeadFormSchema      | TOUJOURS PRESENT    | Doublon dans `LeadFormModal.tsx` L53-141                           |
| 5   | BANT constants            | RESOLU              | Source unique `bant.constants.ts`                                  |
| 6   | Opportunity status colors | N/A                 | Feature non implementee                                            |
| 7   | InfoRow                   | RESOLU              | `components/crm/shared/InfoRow.tsx`, 5 consommateurs               |
| 8   | Opportunity status list   | RESOLU              | Source unique `opportunity-status.constants.ts`                    |
| 9   | formatDateTime            | RESOLU              | Unifie dans `lib/format.ts` (wrapper formatDate)                   |
| 10  | Quote status              | PARTIEL             | Dans validators, pas de fichier constants dedie                    |

**Residus actionables** :

1. `LeadFormModal.tsx` L53-141 : schema duplique (composant OLD, a migrer/supprimer)
2. Quote status : creer `lib/constants/crm/quote-status.constants.ts` pour aligner avec lead/opportunity
3. Lead type : 2 fichiers par design (base + specialise), acceptable

**Verdict** : ACCEPTABLE — 6/10 resolus, 1 N/A, 3 residus mineurs.

---

### CATEGORIE 5 : Fichiers morts — 7 → 1

**Methode** : Pour chaque .tsx dans components/crm/ et features/crm/, verifier s'il est importe ailleurs.

**Resultat : 1 seul fichier mort sur 102 analyses.**

| Fichier                 | Taille | Raison                                  |
| ----------------------- | ------ | --------------------------------------- |
| LeadWorkspaceDialog.tsx | 476 L  | Remplace par LeadDrawer, jamais importe |

Tous les autres composants (101/102) sont activement importes.

**Verdict** : PROPRE — V1 a nettoye 6 fichiers morts. 1 residu marginal.

---

### CATEGORIE 6 : Routes API mortes — 19 → 0

**Methode** : Inventaire des 100 route.ts sous app/api/, verification des consommateurs.

**Resultat : ZERO route morte.**

| Type de route                  | Nombre | Statut   |
| ------------------------------ | ------ | -------- |
| V1 CRM (leads/opps)            | 20+    | ACTIF    |
| V1 Directory/Fleet             | 28+    | ACTIF    |
| Admin/Settings                 | 15+    | ACTIF    |
| Public/Book-demo               | 12+    | ACTIF    |
| Webhooks (Clerk/Stripe/Resend) | 3      | EXTERNE  |
| Cron jobs                      | 5      | PLANIFIE |
| Test endpoints                 | 2      | ACTIF    |

**Verdict** : PROPRE — V1 a supprime toutes les routes mortes.

---

### CATEGORIE 7 : Services et repositories morts — 10 → 0

**Methode** : Inventaire de lib/services/ et lib/repositories/, verification des imports.

**Resultat : ZERO service/repository mort.**

- Tous les services CRM sont importes par des API routes
- LeadAssignmentService est importe par LeadCreationService (qui est utilise par POST /api/v1/crm/leads)
- Tous les repositories sont instancies dans des services actifs
- Les singletons (orderRepository, quoteRepository) sont correctement utilises

**Verdict** : PROPRE — V1 a nettoye les 10 services morts.

---

### CATEGORIE 8 : Incoherences d'architecture — 5 → 3

| #   | Probleme                       | Statut           | Details                                                                |
| --- | ------------------------------ | ---------------- | ---------------------------------------------------------------------- |
| 1   | 2 systemes UI paralleles       | TOUJOURS PRESENT | Leads dans features/crm, tout le reste dans components/crm             |
| 2   | Hooks dupliques old/new        | RESOLU           | Hooks lib/ (domaine) vs features/ (vue) = concerns differents          |
| 3   | Composants partages couplant   | TOUJOURS PRESENT | LeadDrawer, LeadDrawerSections, ViewToggle importes par les 2 systemes |
| 4   | 3 patterns data fetching       | TOUJOURS PRESENT | Refine useList + fetchApi direct + Server Actions coexistent           |
| 5   | Migration features/ incomplete | PARTIEL          | Leads 90%, Opps 0%, Quotes 0%, Settings 0%                             |

**Detail du couplage** :

- `LeadDrawer` (components/crm/) importe par `leads-kanban-page.tsx` (features/crm/)
- `ViewToggle` (components/crm/) importe par `leads-view-router.tsx` (features/crm/)
- Activity components partages entre les 2 systemes

**Verdict** : SALE — L'architecture a 2 tetes persiste. La migration vers features/ est incomplete. Le risque de regression lors de refactoring est eleve.

---

## SYNTHESE

### Victoires majeures (V1+V2+V3)

| Categorie         | Impact                                    |
| ----------------- | ----------------------------------------- |
| Cal.com vestiges  | **14 → 0** : eradication totale           |
| Routes API mortes | **19 → 0** : zero dechet API              |
| Services morts    | **10 → 0** : backend propre               |
| Fichiers morts    | **7 → 1** : quasi-propre                  |
| Code duplique     | **10 → 3** : 70% de reduction             |
| Scoring ICP       | **6 → 3** : framework mort, residus seeds |

### Dettes restantes (priorite)

| Priorite | Probleme                                                | Effort  |
| -------- | ------------------------------------------------------- | ------- |
| P1       | 3 patterns data fetching (Refine vs fetch vs actions)   | Gros    |
| P1       | Migration features/ incomplete (Opps, Quotes, Settings) | Gros    |
| P2       | 7 colonnes ghost (industry, loss_reason, etc.)          | Moyen   |
| P2       | Couplage components/crm ↔ features/crm                 | Moyen   |
| P3       | LeadFormModal schema duplique                           | Petit   |
| P3       | Quote status pas en fichier constants                   | Petit   |
| P3       | avg-score-card.tsx widget deprecated                    | Petit   |
| P3       | 2 scripts seeds avec refs scoring                       | Petit   |
| P3       | LeadWorkspaceDialog.tsx fichier mort                    | Trivial |

### Score global

```
AVANT  : 79 problemes — Score: 3/10 (SPAGHETTI)
APRES  : 17 problemes — Score: 7/10 (ACCEPTABLE)

Reduction : -62 problemes (-78%)
```

### Par categorie

```
Backend    : 9/10 (PROPRE)     — Zero dette API, services, repos
Frontend   : 5/10 (EN CHANTIER) — 2 systemes UI, 3 patterns fetch, migration 25%
Data model : 7/10 (ACCEPTABLE) — Ghost columns persistent, schema drift fixe
Constants  : 8/10 (PROPRE)     — Sources de verite unifiees (statuts, BANT, format)
```

---

_Audit genere automatiquement. Aucun fichier modifie._
