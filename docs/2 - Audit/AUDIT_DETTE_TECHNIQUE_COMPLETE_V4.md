# AUDIT DETTE TECHNIQUE — CARTOGRAPHIE COMPLETE DU CODE SALE

**Date** : 2026-03-05
**Scope** : Codebase FleetCore5 complet (features/, components/, lib/, app/, types/)
**Methode** : Audit systematique sur 8 categories, aucune modification de code
**Resultat** : 182 problemes identifies, ~21,847 lignes de code mort

---

## TABLE DES MATIERES

1. [Colonnes fantomes (UI sans WRITE)](#categorie-1--colonnes-fantomes-ui-sans-write)
2. [Vestiges Cal.com](#categorie-2--vestiges-calcom)
3. [Scoring ICP vs BANT](#categorie-3--scoring-icp-vs-bant)
4. [Code duplique](#categorie-4--code-duplique)
5. [Fichiers morts](#categorie-5--fichiers-morts-jamais-importes)
6. [Routes API mortes](#categorie-6--routes-api-mortes)
7. [Services morts](#categorie-7--services-et-repositories-morts)
8. [Incoherences d'architecture](#categorie-8--incoherences-darchitecture)
9. [Tableau resume final](#tableau-resume-final)

---

## CATEGORIE 1 : Colonnes fantomes (UI sans WRITE)

**Problemes trouves : 7**
**Score categorie : SALE**

Colonnes de `crm_leads` affichees dans l'UI (DataTable, drawer, detail) mais sans AUCUN mecanisme d'ecriture dans le code applicatif.

| #   | Champ                              | Affiche dans                                | Write existe ?                                                                | Severite     |
| --- | ---------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- | ------------ |
| 1   | `updated_by`                       | `lead-columns.tsx:759` (visible par defaut) | STALE — positionne a la creation, jamais mis a jour lors des edits            | **CRITIQUE** |
| 2   | `qualified_date`                   | `lead-columns.tsx:588`                      | ZERO — `bant_qualified_at` est ecrit a la place (conflit de nommage)          | **HAUTE**    |
| 3   | `callback_completed_at`            | `lead-columns.tsx:1046`                     | ZERO — pas de fonctionnalite "completer callback"                             | **HAUTE**    |
| 4   | `callback_notes`                   | `lead-columns.tsx:1059`                     | ZERO — jamais ecrit par aucun service                                         | **HAUTE**    |
| 5   | `recovery_notification_clicked_at` | `lead-columns.tsx:1139`                     | ZERO — `sent_at` est ecrit par le cron, mais `clicked_at` n'a pas de tracking | **HAUTE**    |
| 6   | `stage_entered_at`                 | `lead-columns.tsx:791`                      | ZERO sur crm_leads (uniquement ecrit sur crm_opportunities)                   | MOYENNE      |
| 7   | `competitor_name`                  | `lead-columns.tsx:829`                      | ZERO — aucun formulaire ne l'alimente                                         | MOYENNE      |

### Detail des problemes critiques

**`updated_by` (CRITIQUE)** : Colonne visible par defaut dans le DataTable. Le `BaseRepository.create()` dans `lib/core/base.repository.ts:135-136` positionne `updated_by` a la creation. Mais AUCUN chemin de mise a jour (`updateLeadAction`, `updateLeadStatusAction`, PATCH route, services de status/qualification/wizard/payment) ne met a jour `updated_by`. Chaque update positionne `updated_at` mais oublie `updated_by`. Le champ est donc fige a la valeur initiale de `created_by`.

**`qualified_date` (HAUTE)** : Le service `lead-qualification.service.ts` ecrit `bant_qualified_at`, PAS `qualified_date`. Deux champs pour le meme concept = confusion.

### Champs confirmes avec mecanisme d'ecriture

Pour reference, voici les champs confirmes comme ayant un WRITE actif :

- `status`, `priority`, `assigned_to`, `first_name`, `last_name`, `email`, `phone`, `company_name`, `fleet_size`, `current_software`, `website_url`, `message`, `next_action_date` — via `updateLeadAction` / PATCH API
- `deleted_at`, `deleted_by`, `deletion_reason` — via `deleteLeadAction`
- `converted_date`, `opportunity_id` — via `convertLeadToOpportunityAction`
- `bant_budget`, `bant_authority`, `bant_need`, `bant_timeline`, `bant_qualified_at`, `bant_qualified_by` — via `leadQualificationService`
- `email_verified`, `email_verification_*` — via wizard/verification services
- `callback_requested`, `callback_requested_at` — via `wizardLeadService.requestCallback()`
- `stripe_*`, `payment_link_*` — via `paymentLinkService`
- `recovery_notification_sent_at` — via cron nurturing
- `last_activity_at` — via `activities.actions.ts`
- `country_code`, `language`, `ip_address`, `detected_country_code`, `wizard_completed`, `gdpr_consent`, `consent_at`, `consent_ip` — via wizard/creation services
- `source`, `utm_*`, `created_by`, `created_at`, `updated_at`, `lead_code`, `tenant_id` — via creation

---

## CATEGORIE 2 : Vestiges Cal.com

**Problemes trouves : 25**
**Score categorie : SPAGHETTI**

Cal.com est decommissionne. Code residuel reparti sur 24 fichiers.

### CRITIQUE (4)

| #   | Fichier:ligne                                                | Description                                                                                     |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| C1  | `package.json:46`                                            | `@calcom/embed-react` dependance installee, zero imports dans le code source                    |
| C2  | `book-demo/page.tsx:382`                                     | Appelle `/api/crm/leads/send-reschedule-link` — route INEXISTANTE (404 garanti)                 |
| C3  | `book-demo/profile/page.tsx:194`                             | Appelle `/api/crm/leads/[id]/booking-status` — route INEXISTANTE (404 garanti)                  |
| C4  | `book-demo/page.tsx:307` + `check-email/route.ts:74,100,120` | `hasBooking` toujours `false` (documente "deprecated"), toute l'UI reschedule est inatteignable |

**Impact critique** : le wizard public "Book a Demo" est CASSE a la transition etape 3 -> etape 4. Apres le profil, l'utilisateur est redirige vers `/book-demo/schedule` qui N'EXISTE PAS = 404 en production.

### HAUTE (9)

| #   | Fichier                                       | Description                                               |
| --- | --------------------------------------------- | --------------------------------------------------------- |
| H1  | `book-demo/profile/page.tsx:285`              | Redirige vers `/book-demo/schedule` inexistant            |
| H2  | `emails/templates/ModifyBookingRequest.tsx`   | Template email orphelin, jamais importe                   |
| H3  | `components/booking/WizardProgressBar.tsx`    | Sert un wizard casse (etape 4 = morte)                    |
| H4  | `components/booking/BookDemoLayoutClient.tsx` | Layout pour flow book-demo casse                          |
| H5  | `lib/i18n/email-translations.ts:875-942`      | `bookingConfirmationTranslations` exporte, jamais importe |
| H6  | `lib/i18n/email-translations.ts:809-872`      | `demoReminderJ1Translations` exporte, jamais importe      |
| H7  | `locales/{en,fr,ar}/public.json:55-71`        | `bookDemo.reschedule` — cles mortes                       |
| H8  | `locales/{en,fr,ar}/public.json:199-212`      | `bookDemo.confirmed` — cles mortes                        |
| H9  | `locales/{en,fr,ar}/public.json:114-129`      | `bookDemo.step2` — cles calendrier mortes                 |

### MOYENNE (6)

| #   | Fichier                                  | Description                                  |
| --- | ---------------------------------------- | -------------------------------------------- |
| M1  | `book-demo/page.tsx:147-148,375-510`     | ~70L de state + handler + UI reschedule mort |
| M2  | `book-demo/page.tsx:141-145`             | Interface `ExistingBookingState` morte       |
| M3  | `book-demo/profile/page.tsx:70`          | `hasBooking` dans interface morte            |
| M4  | `lib/utils/token.ts:4`                   | Docstring trompeuse "reschedule URLs"        |
| M5  | `locales/{en,fr,ar}/public.json:47-52`   | Cles reschedule pour code inatteignable      |
| M6  | `locales/{en,fr,ar}/public.json:168-184` | Cles confirmation pour page inexistante      |

### BASSE (6)

| #   | Fichier                                      | Description                                                                                       |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| B1  | `lib/i18n/email-translations.ts:875`         | Commentaire "Replaces Cal.com default email"                                                      |
| B2  | `locales/{en,fr}/crm.json:358/349`           | `"book_demo_hint": "Opens Cal.com in a new tab"`                                                  |
| B3  | `locales/{en,fr,ar}/public.json:65`          | `"poweredBy": "Scheduling powered by Cal.com"`                                                    |
| B4  | `lib/i18n/email-translations.ts:827,847,867` | `rescheduleButton` dans traduction morte                                                          |
| B5  | `docs/` (4 fichiers)                         | Documentation referencant Cal.com/CALCOM_WEBHOOK_SECRET                                           |
| B6  | `prisma/schema.prisma:4314-4315`             | Faux positif — `rescheduled_from/reason` sur `sch_maintenance_schedules` (fleet ops, pas Cal.com) |

---

## CATEGORIE 3 : Scoring ICP vs BANT

**Problemes trouves : 9**
**Score categorie : SALE**

BANT est le systeme actif. Le scoring ICP (fit_score, engagement_score, qualification_score) a ete retire du code actif dans DETTE-V3. Debris vestigiels restants.

### Etat BANT : PROPRE

| Composant             | Fichier                                          | Status              |
| --------------------- | ------------------------------------------------ | ------------------- |
| BANT Constants        | `lib/constants/crm/bant.constants.ts`            | ACTIF               |
| Qualification Service | `lib/services/crm/lead-qualification.service.ts` | ACTIF, V7 BANT-only |
| Lead Type             | `types/crm.ts:170-176`                           | ACTIF               |
| Lead Creation Service | `lib/services/crm/lead-creation.service.ts`      | ACTIF, clean        |

### Etat ICP : RETIRE du code actif

- Prisma schema : PROPRE (zero colonnes ICP)
- Types : PROPRE (zero champs ICP dans interface Lead)
- Services : PROPRE (`lead-scoring.service.ts` supprime)
- Migration SQL prete : `prisma/migrations/manual/20260303_dette_v3_drop_scoring_stage.sql`

### Debris vestigiels

| #   | Finding                                                                                                                                | Severite  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Template email `crm.sales.assignment` dans `prisma/seed.ts` affiche `fit_score`, `qualification_score`, `lead_stage` (vides a l'envoi) | **HAUTE** |
| 2   | `FilterState.min_score` + dropdown "Score" dans `LeadsFilterBar.tsx` filtre un champ inexistant                                        | **HAUTE** |
| 3   | `fit_score_weight` dans `useFleetSizeOptions.ts:27,61,69,77` — jamais consomme                                                         | MOYENNE   |
| 4   | Records DB `lead_scoring_config` + `score_decay` dans `crm_settings` — dechets en base                                                 | MOYENNE   |
| 5   | Tab "Scoring" desactivee dans `CrmSettingsPageClient.tsx:56-60`                                                                        | BASSE     |
| 6   | Cles i18n "scoring" orphelines dans `crm.json`                                                                                         | BASSE     |
| 7   | JSDoc dans `lead-creation.service.ts:29,92-93,104` mentionne scoring                                                                   | BASSE     |
| 8   | Fixtures de test referencent `lead_scoring_config`                                                                                     | BASSE     |
| 9   | Commentaire `@deprecated` dans `crm.validators.ts:186`                                                                                 | BASSE     |

### Reponses aux questions cles

- **ICP scores encore CALCULES ?** Non. Zero moteur actif. Zero CPU gaspille.
- **Valeurs figees ?** Les colonnes DB sont pretes a etre supprimees (migration SQL existe).
- **UI montre ICP et BANT ?** Partiellement — le dropdown "Score" dans `LeadsFilterBar` filtre un champ inexistant.
- **Filtres/sorts ICP a remplacer par BANT ?** Oui — `min_score` devrait etre supprime ou remplace par filtre BANT.

---

## CATEGORIE 4 : Code duplique

**Problemes trouves : 8**
**Score categorie : SALE**

| #   | Pattern                              | Doublons actifs         | Description                                                                                                                                                                                                                                                                                  | Severite  |
| --- | ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | `formatDate`                         | 10 fichiers actifs      | Source canonique : `lib/format.ts`. 10+ fichiers actifs redefinissent localement (`leads-columns.ts`, `opportunity-columns.ts`, `ReportsTable`, `QuoteDrawer`, `OpportunityDrawer`, `LeadDrawerSections`, `LeadBantSection`, `QuoteDetailClient`, `QuotesTableRow`, `OpportunitiesTableRow`) | **HAUTE** |
| 2   | `InfoRow`                            | 2 divergents            | `components/crm/shared/InfoRow.tsx` (label/value vertical + actions) vs `features/crm/leads/components/profile/LeadProfileCards.tsx:69` (icon + value horizontal). Meme nom, APIs differentes                                                                                                | **HAUTE** |
| 3   | `interface Lead`                     | 4 actifs                | `lib/types/crm/lead.types.ts` (Prisma), `types/crm.ts` (frontend 120L), `ReportsTable.tsx:22` (subset local), `lead.repository.interface.ts` (re-export)                                                                                                                                     | **HAUTE** |
| 4   | `getStatusColor`                     | 3 locales + 1 canonique | Source canonique : `lib/utils/status-colors.ts`. Locales : `ReportsTable.tsx:113`, `QuickSearch.tsx:156`, `OpportunitiesTableRow.tsx:164`                                                                                                                                                    | **HAUTE** |
| 5   | `getStageColor`                      | 2 divergents            | `lib/config/opportunity-stages.ts:131` retourne string simple (`"blue"`), `OpportunitiesTableRow.tsx:146` retourne classes Tailwind completes. Meme nom, types de retour differents                                                                                                          | **HAUTE** |
| 6   | `handleCopy` clipboard               | 6 actifs                | Pattern `navigator.clipboard.writeText + toast` reimplemente dans `LeadDrawerHeader`, `LeadDrawerSections`, `LeadProfileCards`, `QuoteDetailClient`, `QuoteDrawer`, `OpportunityDrawer`                                                                                                      | MOYENNE   |
| 7   | `LeadTimeline` vs `ActivityTimeline` | 2                       | `components/crm/leads/LeadTimeline.tsx` (254L) et `components/crm/shared/ActivityTimeline.tsx` (289L) partagent 80% de structure + `formatDateGroup` identique                                                                                                                               | MOYENNE   |
| 8   | `BulkActionsBar`                     | 2 variants              | CRM-specifique vs generic `DataTableBulkActions`. Acceptable si coexistent                                                                                                                                                                                                                   | BASSE     |

---

## CATEGORIE 5 : Fichiers morts (jamais importes)

**Problemes trouves : 35 fichiers — ~8,579 lignes**
**Score categorie : SPAGHETTI**

### CRITIQUE — 22 fichiers, ~7,581 lignes

**`app/adm/` — admin prototype mort (11 fichiers, 1,320L)**

| Fichier                                              | Lignes |
| ---------------------------------------------------- | ------ |
| `app/adm/page.tsx`                                   | 138    |
| `app/adm/layout.tsx`                                 | 17     |
| `app/adm/AdminClientLayout.tsx`                      | 86     |
| `app/adm/organizations/page.tsx`                     | 118    |
| `app/adm/leads/page.tsx`                             | 87     |
| `app/adm/leads/components/LeadsList.tsx`             | 211    |
| `app/adm/leads/components/LeadStats.tsx`             | 65     |
| `app/adm/leads/[id]/page.tsx`                        | 183    |
| `app/adm/leads/[id]/components/UpdateLeadForm.tsx`   | 77     |
| `app/adm/leads/[id]/components/ActivityTimeline.tsx` | 155    |
| `app/adm/leads/[id]/components/AddActivityForm.tsx`  | 183    |

**`components/crm/leads/` — cluster legacy (10 fichiers, 3,573L)**

| Fichier                         | Lignes | Raison                                           |
| ------------------------------- | ------ | ------------------------------------------------ |
| `LeadsBrowserClient.tsx`        | 645    | Zero imports. Ancien split-view browser          |
| `LeadDetailPage.tsx`            | 269    | Zero imports. Ancienne page detail               |
| `LeadDetailHeader.tsx`          | 392    | Uniquement importe par `LeadDetailPage` mort     |
| `LeadDetailCards.tsx`           | 570    | Uniquement importe par fichiers morts            |
| `LeadSearchCommand.tsx`         | 261    | Uniquement importe par `LeadDetailHeader` mort   |
| `ConvertToOpportunityModal.tsx` | 351    | Uniquement importe par fichiers morts            |
| `GeneratePaymentLinkModal.tsx`  | 305    | Uniquement importe par `PaymentLinkSection` mort |
| `PaymentLinkSection.tsx`        | 273    | Uniquement importe par fichiers morts            |
| `LeadQuoteSection.tsx`          | 280    | Uniquement importe par fichiers morts            |
| `LeadsFilterBar.tsx`            | 227    | Uniquement importe par `lib/types/views.ts` mort |

Note : `LeadTimeline.tsx`, `ActivityItem.tsx`, `AddActivityModal.tsx` sont VIVANTS (importes par `LeadProfileCards` et `LeadDrawerSections`).

**`features/crm/leads/leads-edit-drawer.tsx` (1 fichier, 599L)**

Drawer d'edition jamais cable. Zero imports.

**Hooks morts dans `lib/hooks/` (6 fichiers, 2,089L)**

| Fichier                   | Lignes |
| ------------------------- | ------ |
| `useLeadLossReasons.ts`   | 326    |
| `useLeadPhases.ts`        | 438    |
| `useDashboardLayout.ts`   | 257    |
| `useSavedViews.ts`        | 298    |
| `useColumnPreferences.ts` | 222    |
| `useAdvancedFilters.ts`   | 548    |

### HAUTE — 3 fichiers, 873 lignes

| Fichier                                  | Lignes | Raison                                                            |
| ---------------------------------------- | ------ | ----------------------------------------------------------------- |
| `lib/config/leads-columns.ts`            | 621    | Uniquement importe par hooks morts                                |
| `lib/types/views.ts`                     | 47     | Uniquement importe par fichiers morts                             |
| `components/crm/shared/ActivityItem.tsx` | 205    | Zero imports (doublon de `components/crm/leads/ActivityItem.tsx`) |

### MOYENNE — 2 fichiers, 86 lignes

| Fichier                | Lignes |
| ---------------------- | ------ |
| `lib/utils/request.ts` | 48     |
| `lib/utils/token.ts`   | 38     |

### BASSE — 2 fichiers, 39 lignes

| Fichier                                                        | Lignes |
| -------------------------------------------------------------- | ------ |
| `components/crm/layout/CrmTopBar.tsx`                          | 38     |
| `features/crm/dashboard/components/widgets/avg-score-card.tsx` | 1      |

---

## CATEGORIE 6 : Routes API mortes

**Problemes trouves : 57 routes — ~5,552 lignes**
**Score categorie : SPAGHETTI**

### CRITIQUE — 38 routes, ~4,448 lignes

**`/api/v1/drivers/` — module entier (12 routes, 1,060L)**

Aucune page frontend, pas de registration Refine, zero consommateurs.

| Route                                       | Lignes |
| ------------------------------------------- | ------ |
| `/api/v1/drivers/` (GET, POST)              | 116    |
| `/api/v1/drivers/[id]` (GET, PATCH, DELETE) | 112    |
| `/api/v1/drivers/[id]/statistics`           | 170    |
| `/api/v1/drivers/[id]/documents`            | 128    |
| `/api/v1/drivers/[id]/documents/verify`     | 92     |
| `/api/v1/drivers/[id]/documents/expiring`   | 39     |
| `/api/v1/drivers/[id]/performance`          | 79     |
| `/api/v1/drivers/[id]/ratings`              | 103    |
| `/api/v1/drivers/[id]/requests`             | 89     |
| `/api/v1/drivers/[id]/history`              | 39     |
| `/api/v1/drivers/[id]/reactivate`           | 42     |
| `/api/v1/drivers/[id]/suspend`              | 51     |

**`/api/v1/vehicles/` — module entier (9 routes, 713L)**

Aucune page frontend, pas de registration Refine, zero consommateurs.

| Route                                               | Lignes |
| --------------------------------------------------- | ------ |
| `/api/v1/vehicles/` (GET, POST)                     | 107    |
| `/api/v1/vehicles/[id]` (GET, PATCH, DELETE)        | 112    |
| `/api/v1/vehicles/[id]/assign`                      | 72     |
| `/api/v1/vehicles/[id]/expenses`                    | 123    |
| `/api/v1/vehicles/[id]/maintenance`                 | 118    |
| `/api/v1/vehicles/[id]/maintenance/[maintenanceId]` | 58     |
| `/api/v1/vehicles/available`                        | 27     |
| `/api/v1/vehicles/insurance-expiring`               | 56     |
| `/api/v1/vehicles/maintenance`                      | 40     |

**`/api/v1/notifications/` — module entier (3 routes, 372L)**

Le systeme de notification fonctionne via `NotificationQueueService` + crons, pas ces routes.

**`/api/v1/directory/` — 6 routes sur 7 (551L)**

Seule `/api/v1/directory/countries/` est vivante (utilisee par `use-sidebar-filter-data.ts`). Les 6 autres (models, makes, platforms, regulations, vehicle-classes) n'ont aucun consommateur.

**`/api/v1/crm/opportunities/` (2 routes, 1,239L)**

La page opportunities utilise des requetes Prisma directes en server component + server actions. Ces routes API sont un chemin duplique jamais appele.

### HAUTE — 13 routes, ~674 lignes

| #   | Route                                     | Lignes | Raison                         |
| --- | ----------------------------------------- | ------ | ------------------------------ |
| 1-6 | `/api/v1/crm/quotes/*` (6 routes)         | 400    | Remplacees par server actions  |
| 7-9 | `/api/auth/check,identity,can` (3 routes) | 40     | Fallback Refine jamais appele  |
| 10  | `/api/v1/admin/audit`                     | 120    | Pas de page admin audit        |
| 11  | `/api/public/crm/feature-flags`           | 79     | Hook utilise valeurs statiques |

### MOYENNE — 5 routes, ~415 lignes

| Route                                  | Raison                                  |
| -------------------------------------- | --------------------------------------- |
| `/api/crm/demo-leads/[id]` (GET/PATCH) | Uniquement consomme par `app/adm/` mort |
| `/api/crm/demo-leads/[id]/activity`    | Idem                                    |
| `/api/crm/demo-leads/[id]/accept`      | Idem                                    |
| `/api/crm/leads/[id]/complete-wizard`  | Zero consommateurs frontend             |
| `/api/crm/leads/[id]/request-callback` | Zero consommateurs frontend             |

### BASSE — 1 route + 2 dirs vides

| Item                                        | Description             |
| ------------------------------------------- | ----------------------- |
| `/api/v1/test-error`                        | Route stub de dev (15L) |
| `/api/crm/leads/[id]/booking-status/`       | Repertoire vide         |
| `/api/crm/leads/[id]/confirmation-details/` | Repertoire vide         |

### Routes VIVANTES confirmees

- `/api/v1/crm/leads/*` (6 routes) — via Refine data provider
- `/api/v1/crm/settings/*` (3 routes) — via hooks SWR
- `/api/v1/crm/owners/` — via `useSalesOwners`
- `/api/v1/dashboard/layout/` — via hook dashboard
- `/api/v1/bil/payment-links/` — via modal
- `/api/admin/*` (tenants, members, invitations, countries, settings) — via features/settings/
- `/api/crm/demo-leads/` (POST) — via book-demo et request-demo
- `/api/crm/leads/check-email/` — via book-demo
- `/api/crm/leads/verify-email/` — via book-demo verify
- `/api/crm/leads/resend-code/` — via book-demo verify
- `/api/crm/leads/[id]/complete-profile/` — via book-demo profile
- `/api/crm/leads/[id]/disqualify/` — via refine-data-provider
- `/api/crm/nurturing/resume/` — via book-demo resume
- `/api/public/*` (countries, fleet-size-options, segments, verify, quotes) — via pages publiques
- `/api/geo/detect/` — via book-demo
- `/api/waitlist/*` — via book-demo
- `/api/webhooks/stripe/`, `/api/webhooks/resend/` — webhooks externes
- `/api/cron/*` (5 routes) — Vercel cron jobs
- `/api/internal/audit/` — via middleware
- `/api/auth/[...all]/` — Better Auth catch-all

---

## CATEGORIE 7 : Services et repositories morts

**Problemes trouves : ~27 fichiers — ~7,716 lignes**
**Score categorie : SPAGHETTI**

### CRITIQUE — 6 findings, ~5,354 lignes

**Module Fleet : drivers + vehicles + documents + directory**

Le plus gros bloc de code mort du codebase. Aucune page frontend, aucune resource Refine.

| #   | Chaine morte                                                                              | Fichiers | Lignes |
| --- | ----------------------------------------------------------------------------------------- | -------- | ------ |
| 1   | `driver.service.ts` + `driver.repository.ts` + `drivers.validators.ts` + index            | 4        | 1,599  |
| 2   | `vehicle.service.ts` + `vehicle.repository.ts` + `vehicles.validators.ts` + types + index | 5        | 1,582  |
| 3   | `document.service.ts` + `document.repository.ts` + `document.types.ts` + index            | 4        | 938    |
| 4   | `directory.service.ts` + `directory.repository.ts` + `directory.validators.ts`            | 3        | 979    |

**Autres services critiques morts**

| #   | Fichier                               | Lignes | Raison                                                   |
| --- | ------------------------------------- | ------ | -------------------------------------------------------- |
| 5   | `lib/services/admin/audit.service.ts` | 524    | Uniquement importe par route `/api/v1/admin/audit` morte |
| 6   | `lib/actions/crm/bulk.actions.ts`     | 232    | ZERO imports dans tout le codebase                       |

### HAUTE — 5 findings, ~1,962 lignes

| #   | Fichier(s)                                         | Lignes | Raison                                 |
| --- | -------------------------------------------------- | ------ | -------------------------------------- |
| 7   | `lib/services/notification/order-notifications.ts` | 304    | Importe par barrel file, jamais appele |
| 8   | `lib/validators/admin.validators.ts`               | 369    | Zero imports                           |
| 9   | `lib/validators/base.validators.ts`                | 33     | Zero imports                           |
| 10  | `lib/validators/crm/shared.validators.ts`          | 187    | Zero imports                           |
| 11  | `lib/validators/crm.validators.ts`                 | 495    | Quasi-mort (1 seul import)             |

### BASSE — ~4 fichiers tests, ~400 lignes

Tests pour services morts (`audit.service.test.ts`, `audit.integration.test.ts`, `base-service-helpers.test.ts`, `admin.validators.test.ts`).

---

## CATEGORIE 8 : Incoherences d'architecture

**Problemes trouves : 14**
**Score categorie : SPAGHETTI**

### 8.1 — Migration incomplete components/crm/ -> features/crm/

**CRITIQUE** : 5 composants dans `components/crm/leads/` sont activement importes par `features/crm/leads/` :

| Composant                 | Importe par                              | Equivalent dans features/ ? |
| ------------------------- | ---------------------------------------- | --------------------------- |
| `LeadTimeline.tsx`        | `LeadProfileCards`, `LeadDrawerSections` | NON — pas migre             |
| `DisqualifyLeadModal.tsx` | `LeadDrawer`, `leads-detail-page`        | NON — pas migre             |
| `DeleteLeadModal.tsx`     | `LeadDrawer`                             | NON — pas migre             |
| `InlineActivityForm.tsx`  | `LeadDrawer`                             | NON — pas migre             |
| `LeadStatusActions.tsx`   | `LeadDrawer`                             | NON — pas migre             |

Ces dependances cross-directory forcent la maintenance des deux repertoires simultanement.

**10+ fichiers morts** dans `components/crm/leads/` (remplaces par `features/crm/leads/` mais jamais supprimes) — voir Cat. 5.

**`reports/` (7 fichiers)** pas migre — route active utilise toujours l'ancien code.

### 8.2 — Architecture des hooks

| Hook                   | Pattern      | Status         |
| ---------------------- | ------------ | -------------- |
| `useLeadStatuses`      | SWR          | ACTIF, partage |
| `useSalesOwners`       | SWR          | ACTIF, partage |
| `useFleetSizeOptions`  | SWR          | ACTIF, partage |
| `useColumnPreferences` | localStorage | **MORT**       |
| `useAdvancedFilters`   | localStorage | **MORT**       |
| `useSavedViews`        | localStorage | **MORT**       |
| `useDashboardLayout`   | SWR          | **MORT**       |
| `useLeadPhases`        | SWR          | **MORT**       |

**Dual permission hooks** : `usePermission` (15L, deny-set hardcode avec 1 entree) vs `useHasPermission` (RBAC complet). A consolider.

### 8.3 — Patterns de data fetching

| Pattern                                     | Utilisation                                                    |
| ------------------------------------------- | -------------------------------------------------------------- |
| Refine `useList/useOne/useCreate/useUpdate` | Primary pour leads list/kanban/detail/create/edit              |
| SWR                                         | Donnees de reference (statuts, owners, fleet sizes, countries) |
| Direct `fetch()` dans features/             | Mutations : delete, bulk assign, bulk status (pas via Refine)  |
| Direct `fetch()` dans components/           | TOUT l'ancien code (pre-Refine)                                |

**Probleme** : les mutations lead utilisent 3 patterns differents (Refine `useCreate`/`useUpdate` pour create/edit, mais `fetch()` direct pour delete/status/disqualify). Risque d'incoherence de cache.

### 8.4 — Naming conventions

**50/50 split** dans `features/crm/leads/components/` :

- kebab-case (Kiranism) : `leads-list-page.tsx`, `leads-kanban-page.tsx`, `lead-columns.tsx` — 13 fichiers
- PascalCase (ancien) : `BulkActionsBar.tsx`, `LeadContextMenu.tsx`, sous-dossiers `drawer/`, `profile/` — 13 fichiers

Prefixes inconsistants : `leads-` (pluriel) vs `lead-` (singulier) vs `Lead` (PascalCase) vs aucun prefixe.

### Resume Cat. 8

| #     | Finding                                                                 | Severite     |
| ----- | ----------------------------------------------------------------------- | ------------ |
| 1     | 5 composants `components/crm/leads/` importes par `features/crm/leads/` | **CRITIQUE** |
| 2     | 10+ fichiers morts dans `components/crm/leads/`                         | HAUTE        |
| 3     | `reports/` pas migre dans features/                                     | HAUTE        |
| 4     | 5 hooks morts dans `lib/hooks/`                                         | HAUTE        |
| 5     | Dual permission hooks                                                   | HAUTE        |
| 6     | Mutations via `fetch()` au lieu de Refine                               | HAUTE        |
| 7     | `InfoRow` partage entre old/new                                         | HAUTE        |
| 8     | Dashboard stats fetched par 2 implementations                           | MOYENNE      |
| 9     | `lib/types/views.ts` type-import depuis code mort                       | MOYENNE      |
| 10-12 | Naming 50/50 kebab/PascalCase + prefixes inconsistants                  | MOYENNE      |
| 13    | Opportunities/Quotes/Settings pas migres                                | BASSE        |
| 14    | Dead localStorage keys                                                  | BASSE        |

---

## TABLEAU RESUME FINAL

| Categorie              | Problemes | Critique | Haute  | Moyenne | Basse  | Score         |
| ---------------------- | --------- | -------- | ------ | ------- | ------ | ------------- |
| 1. Colonnes fantomes   | 7         | 1        | 4      | 2       | 0      | **SALE**      |
| 2. Vestiges Cal.com    | 25        | 4        | 9      | 6       | 6      | **SPAGHETTI** |
| 3. Scoring ICP vs BANT | 9         | 0        | 2      | 2       | 5      | **SALE**      |
| 4. Code duplique       | 8         | 0        | 5      | 2       | 1      | **SALE**      |
| 5. Fichiers morts      | 35        | 4        | 2      | 1       | 1      | **SPAGHETTI** |
| 6. Routes API mortes   | 57        | 5        | 4      | 2       | 1      | **SPAGHETTI** |
| 7. Services morts      | 27        | 6        | 3      | 0       | 1      | **SPAGHETTI** |
| 8. Incoherences archi  | 14        | 1        | 6      | 4       | 2      | **SPAGHETTI** |
| **TOTAL**              | **182**   | **21**   | **35** | **19**  | **17** | **SPAGHETTI** |

### Volume de code mort

| Source                       | Lignes mortes      |
| ---------------------------- | ------------------ |
| Fichiers morts (Cat 5)       | ~8,579             |
| Routes API mortes (Cat 6)    | ~5,552             |
| Services/repos morts (Cat 7) | ~7,716             |
| **Total code mort**          | **~21,847 lignes** |

---

## TOP 3 ACTIONS A PLUS FORT IMPACT

### 1. Supprimer le module Fleet entier (~6,500 lignes)

Drivers + vehicles + documents + directory : services, repositories, validators, API routes. Zero frontend, zero Refine, zero usage. Plus gros bloc de code mort du codebase.

### 2. Nettoyer les vestiges Cal.com (~500L code mort + fix wizard casse)

Le wizard public "Book a Demo" est CASSE en production (404 a l'etape 4). Supprimer `@calcom/embed-react`, nettoyer le code mort, fixer ou supprimer le flow book-demo.

### 3. Terminer la migration components/crm/leads/ -> features/crm/leads/ (~3,500L)

Deplacer les 5 composants actifs restants (`LeadTimeline`, `DisqualifyLeadModal`, `DeleteLeadModal`, `InlineActivityForm`, `LeadStatusActions`), supprimer les 10+ fichiers morts.

---

_Audit genere le 2026-03-05. Aucune modification de code effectuee._
