# POST-MIGRATION V2 - SESSION 16

**Document de référence** : Cleanup colonnes V1 et RENAME colonnes `_v2`

---

## 📋 TABLE DES MATIÈRES

1. [Colonnes V1 à Déprécier](#colonnes-v1-à-déprécier)
2. [Timeline Cleanup](#timeline-cleanup-session-16)
3. [Liste Exhaustive RENAME _v2](#-liste-exhaustive---rename-tous-les-suffix-_v2-session-16---phase-2)
4. [Retour au sommaire principal](./README.md)

---

## COLONNES V1 À DÉPRÉCIER

### Stratégie : Cleanup progressif table par table (Environnement DEV)

**CONTEXTE** : FleetCore est en développement, pas en production.
**APPROCHE** : Suppression sélective table par table après validation données V2.

**Session 14** : Migration données V1 → V2 (remplir colonnes `*_v2`)
**Session 15** : Création indexes
**Session 16** : Cleanup table par table (DROP COLUMN V1 obsolètes + RENAME enlever suffix `_v2`)

---

### Timeline Cleanup (Session 16)

⚠️ **IMPORTANT** : Le suffix `_v2` est une technique de migration SQL TEMPORAIRE seulement!
Le Prisma schema V2 n'a JAMAIS eu de suffix `_v2` - les colonnes finales doivent correspondre au schema.

**Phase 1** : DROP colonnes V1 obsolètes
- Suppression colonnes VARCHAR/TEXT remplacées par ENUM
- Suppression colonnes redondantes ou renommées

**Phase 2** : RENAME colonnes V2 (ENLEVER SUFFIX `_v2`) - **OBLIGATOIRE**
- `status_v2` → `status` (RENAME pour matcher Prisma schema)
- `driver_status_v2` → `driver_status`
- `document_type_v2` → `document_type`
- etc. pour TOUTES les colonnes avec suffix `_v2`

**Phase 3** : Validation données
- Validation manuelle données migrées
- Vérification cohérence avec Prisma schema

---

### 🔧 LISTE EXHAUSTIVE - RENAME TOUS LES SUFFIX `_v2` (Session 16 - Phase 2)

⚠️ **OBJECTIF** : **ZÉRO colonne avec suffix `_v2`** après Session 16 Phase 2!

**TOTAL COLONNES `_v2` À RENAME** : **36 colonnes** réparties sur **5 modules** (BIL, SUP, RID, SCH, TRP)

**Modules sans suffix `_v2`** : **5 modules** (ADM, DIR, DOC, CRM, FLT) - migration 100% additive

---

#### ✅ CHECKLIST EXHAUSTIVE PAR MODULE

**Module ADM (Session 1)** : ✅ 0 colonne `_v2`
```sql
-- ✅ Aucun suffix _v2 dans ADM
-- Raison: Enums ont des noms différents de V1 (tenant_status, member_status, role_type)
-- Donc pas de conflit de noms avec colonnes V1
```

---

**Module DIR (Session 2)** : ✅ 0 colonne `_v2`
```sql
-- ✅ Aucun suffix _v2 dans DIR
-- Raison: Enums ont des noms différents de V1 ou colonnes nouvelles (pas de coexistence)
```

---

**Module DOC (Session 3)** : ✅ 0 colonne `_v2`
```sql
-- ✅ Aucun suffix _v2 dans DOC
-- Raison: verification_status (nouveau nom) != verified (BOOLEAN V1)
-- storage_provider, cloud_storage_region = nouveaux champs (pas de V1)
```

---

**Module CRM (Session 4)** : ✅ 0 colonne `_v2`
```sql
-- ✅ Aucun suffix _v2 dans CRM
-- Raison: Enums ont des noms différents de V1
-- lead_status, opportunity_stage, contract_status != status VARCHAR V1
```

---

**Module BIL (Session 5)** : ⚠️ **5 colonnes `_v2`** à RENAME

| # | Table | Colonne V2 actuelle | Colonne finale (après RENAME) | Fichier source |
|---|-------|---------------------|-------------------------------|----------------|
| 1 | bil_billing_plans | status_v2 | status | 06_bil_structure.sql:328 |
| 2 | bil_tenant_subscriptions | status_v2 | status | 06_bil_structure.sql:384 |
| 3 | bil_tenant_invoices | status_v2 | status | 06_bil_structure.sql:534 |
| 4 | bil_payment_methods | payment_type_v2 | payment_type | 06_bil_structure.sql:622 |
| 5 | bil_payment_methods | status_v2 | status | 06_bil_structure.sql:670 |

**SQL RENAME Module BIL** :
```sql
-- Table 1/4: bil_billing_plans (1 colonne)
ALTER TABLE bil_billing_plans
  RENAME COLUMN status_v2 TO status;

-- Table 2/4: bil_tenant_subscriptions (1 colonne)
ALTER TABLE bil_tenant_subscriptions
  RENAME COLUMN status_v2 TO status;

-- Table 3/4: bil_tenant_invoices (1 colonne)
ALTER TABLE bil_tenant_invoices
  RENAME COLUMN status_v2 TO status;

-- Table 4/4: bil_payment_methods (2 colonnes)
ALTER TABLE bil_payment_methods
  RENAME COLUMN payment_type_v2 TO payment_type;
ALTER TABLE bil_payment_methods
  RENAME COLUMN status_v2 TO status;
```

---

**Module SUP (Session 6)** : ⚠️ **4 colonnes `_v2`** à RENAME

| # | Table | Colonne V2 actuelle | Colonne finale (après RENAME) | Fichier source |
|---|-------|---------------------|-------------------------------|----------------|
| 6 | sup_tickets | status_v2 | status | 07_sup_structure.sql:188 |
| 7 | sup_tickets | priority_v2 | priority | 07_sup_structure.sql:189 |
| 8 | sup_customer_feedback | service_type_v2 | service_type | 07_sup_structure.sql:243 |
| 9 | sup_customer_feedback | submitter_type_v2 | submitter_type | 07_sup_structure.sql:265 |

**SQL RENAME Module SUP** :
```sql
-- Table 1/2: sup_tickets (2 colonnes)
ALTER TABLE sup_tickets
  RENAME COLUMN status_v2 TO status;
ALTER TABLE sup_tickets
  RENAME COLUMN priority_v2 TO priority;

-- Table 2/2: sup_customer_feedback (2 colonnes)
ALTER TABLE sup_customer_feedback
  RENAME COLUMN service_type_v2 TO service_type;
ALTER TABLE sup_customer_feedback
  RENAME COLUMN submitter_type_v2 TO submitter_type;
```

---

**Module RID (Session 7)** : ⚠️ **15 colonnes `_v2`** à RENAME

| # | Table | Colonne V2 actuelle | Colonne finale (après RENAME) | Fichier source |
|---|-------|---------------------|-------------------------------|----------------|
| 10 | rid_drivers | preferred_payment_method_v2 | preferred_payment_method | 08_rid_structure.sql:373 |
| 11 | rid_drivers | driver_status_v2 | driver_status | 08_rid_structure.sql:378 |
| 12 | rid_driver_documents | document_type_v2 | document_type | 08_rid_structure.sql:432 |
| 13 | rid_driver_cooperation_terms | status_v2 | status | 08_rid_structure.sql:476 |
| 14 | rid_driver_cooperation_terms | compensation_model_v2 | compensation_model | 08_rid_structure.sql:480 |
| 15 | rid_driver_cooperation_terms | signature_method_v2 | signature_method | 08_rid_structure.sql:491 |
| 16 | rid_driver_requests | request_type_v2 | request_type | 08_rid_structure.sql:532 |
| 17 | rid_driver_requests | status_v2 | status | 08_rid_structure.sql:533 |
| 18 | rid_driver_performances | period_type_v2 | period_type | 08_rid_structure.sql:592 |
| 19 | rid_driver_blacklists | status_v2 | status | 08_rid_structure.sql:667 |
| 20 | rid_driver_blacklists | appeal_status_v2 | appeal_status | 08_rid_structure.sql:687 |
| 21 | rid_driver_training | training_type_v2 | training_type | 08_rid_structure.sql:729 |
| 22 | rid_driver_training | status_v2 | status | 08_rid_structure.sql:730 |
| 23 | rid_driver_training | provider_type_v2 | provider_type | 08_rid_structure.sql:734 |
| 24 | rid_driver_training | paid_by_v2 | paid_by | 08_rid_structure.sql:790 |

**SQL RENAME Module RID** :
```sql
-- Table 1/7: rid_drivers (2 colonnes)
ALTER TABLE rid_drivers
  RENAME COLUMN preferred_payment_method_v2 TO preferred_payment_method;
ALTER TABLE rid_drivers
  RENAME COLUMN driver_status_v2 TO driver_status;

-- Table 2/7: rid_driver_documents (1 colonne)
ALTER TABLE rid_driver_documents
  RENAME COLUMN document_type_v2 TO document_type;

-- Table 3/7: rid_driver_cooperation_terms (3 colonnes)
ALTER TABLE rid_driver_cooperation_terms
  RENAME COLUMN status_v2 TO status;
ALTER TABLE rid_driver_cooperation_terms
  RENAME COLUMN compensation_model_v2 TO compensation_model;
ALTER TABLE rid_driver_cooperation_terms
  RENAME COLUMN signature_method_v2 TO signature_method;

-- Table 4/7: rid_driver_requests (2 colonnes)
ALTER TABLE rid_driver_requests
  RENAME COLUMN request_type_v2 TO request_type;
ALTER TABLE rid_driver_requests
  RENAME COLUMN status_v2 TO status;

-- Table 5/7: rid_driver_performances (1 colonne)
ALTER TABLE rid_driver_performances
  RENAME COLUMN period_type_v2 TO period_type;

-- Table 6/7: rid_driver_blacklists (2 colonnes)
ALTER TABLE rid_driver_blacklists
  RENAME COLUMN status_v2 TO status;
ALTER TABLE rid_driver_blacklists
  RENAME COLUMN appeal_status_v2 TO appeal_status;

-- Table 7/7: rid_driver_training (4 colonnes)
ALTER TABLE rid_driver_training
  RENAME COLUMN training_type_v2 TO training_type;
ALTER TABLE rid_driver_training
  RENAME COLUMN status_v2 TO status;
ALTER TABLE rid_driver_training
  RENAME COLUMN provider_type_v2 TO provider_type;
ALTER TABLE rid_driver_training
  RENAME COLUMN paid_by_v2 TO paid_by;
```

---

**Module FLT (Session 8)** : ✅ 0 colonne `_v2`

```sql
-- ✅ Aucun suffix _v2 dans FLT
-- Raison: Tous les enums FLT ont des noms distincts des colonnes V1
-- Exemples:
--   - assignment_type, assignment_status, handover_type (pas de conflit)
--   - vehicle_event_type, responsible_party, event_severity (pas de conflit)
--   - maintenance_type, maintenance_category, maintenance_priority (pas de conflit)
--   - expense_category, approval_status, receipt_status (pas de conflit)
--   - policy_category, coverage_drivers, vehicle_usage (pas de conflit)
-- Aucune opération RENAME nécessaire en Phase 2
```

---

#### 📊 VALIDATION POST-RENAME (Session 16 Phase 2)

**Vérification OBLIGATOIRE** : S'assurer qu'il reste **ZÉRO** colonne avec suffix `_v2`

```sql
-- Query 1: Compter toutes les colonnes *_v2 restantes (doit retourner 0)
SELECT
  table_schema,
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%\_v2'
ORDER BY table_name, column_name;
-- ✅ ATTENDU: 0 lignes

-- Query 2: Validation par module (compteur exact)
SELECT
  CASE
    WHEN table_name LIKE 'bil_%' THEN 'BIL'
    WHEN table_name LIKE 'sup_%' THEN 'SUP'
    WHEN table_name LIKE 'rid_%' THEN 'RID'
    ELSE 'OTHER'
  END AS module,
  COUNT(*) AS colonnes_v2_restantes
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%\_v2'
GROUP BY module;
-- ✅ ATTENDU: 0 lignes (aucun module ne doit apparaître)

-- Query 3: Liste exhaustive des 32 colonnes qui DOIVENT exister SANS suffix _v2
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    -- BIL (5 colonnes)
    (table_name = 'bil_billing_plans' AND column_name = 'status') OR
    (table_name = 'bil_tenant_subscriptions' AND column_name = 'status') OR
    (table_name = 'bil_tenant_invoices' AND column_name = 'status') OR
    (table_name = 'bil_payment_methods' AND column_name = 'payment_type') OR
    (table_name = 'bil_payment_methods' AND column_name = 'status') OR
    -- SUP (4 colonnes)
    (table_name = 'sup_tickets' AND column_name = 'status') OR
    (table_name = 'sup_tickets' AND column_name = 'priority') OR
    (table_name = 'sup_customer_feedback' AND column_name = 'service_type') OR
    (table_name = 'sup_customer_feedback' AND column_name = 'submitter_type') OR
    -- RID (15 colonnes)
    (table_name = 'rid_drivers' AND column_name = 'preferred_payment_method') OR
    (table_name = 'rid_drivers' AND column_name = 'driver_status') OR
    (table_name = 'rid_driver_documents' AND column_name = 'document_type') OR
    (table_name = 'rid_driver_cooperation_terms' AND column_name = 'status') OR
    (table_name = 'rid_driver_cooperation_terms' AND column_name = 'compensation_model') OR
    (table_name = 'rid_driver_cooperation_terms' AND column_name = 'signature_method') OR
    (table_name = 'rid_driver_requests' AND column_name = 'request_type') OR
    (table_name = 'rid_driver_requests' AND column_name = 'status') OR
    (table_name = 'rid_driver_performances' AND column_name = 'period_type') OR
    (table_name = 'rid_driver_blacklists' AND column_name = 'status') OR
    (table_name = 'rid_driver_blacklists' AND column_name = 'appeal_status') OR
    (table_name = 'rid_driver_training' AND column_name = 'training_type') OR
    (table_name = 'rid_driver_training' AND column_name = 'status') OR
    (table_name = 'rid_driver_training' AND column_name = 'provider_type') OR
    (table_name = 'rid_driver_training' AND column_name = 'paid_by') OR
    -- SCH (8 colonnes)
    (table_name = 'sch_shifts' AND column_name = 'status') OR
    (table_name = 'sch_maintenance_schedules' AND column_name = 'priority') OR
    (table_name = 'sch_maintenance_schedules' AND column_name = 'status') OR
    (table_name = 'sch_goals' AND column_name = 'goal_category') OR
    (table_name = 'sch_goals' AND column_name = 'status') OR
    (table_name = 'sch_tasks' AND column_name = 'task_category') OR
    (table_name = 'sch_tasks' AND column_name = 'priority') OR
    (table_name = 'sch_tasks' AND column_name = 'status')
  )
ORDER BY table_name, column_name;
-- ✅ ATTENDU: 32 lignes (toutes les colonnes RENAME doivent exister)
```

---

#### ✅ RÉSULTAT FINAL SESSION 16

```
┌─────────────────────────────────────────────────┐
│  ÉTAT FINAL BASE DE DONNÉES APRÈS SESSION 16   │
├─────────────────────────────────────────────────┤
│  Colonnes avec suffix _v2 :  0 / 32  ✅ ZÉRO   │
│  Colonnes RENAME réussies  : 32 / 32  ✅ OK    │
│  Modules concernés         :  4 (BIL,SUP,RID,SCH)│
│  Modules sans _v2          :  5 (ADM,DIR,DOC,CRM,FLT)│
└─────────────────────────────────────────────────┘
```

**GARANTIE** : Après exécution de Phase 2, **AUCUNE** colonne `_v2` ne subsistera dans la base de données. Schéma 100% conforme au Prisma schema V2 ✓

---

### Module CRM

#### Table `crm_leads`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `full_name` | `first_name` + `last_name` | Séparation nom/prénom | Session 16 |
| `source` (VARCHAR) | `source_id` (UUID → `crm_lead_sources`) | Normalisation sources | Session 16 |
| `status` (VARCHAR) | `lead_status` (enum) | Type-safety enum | Session 16 |

**Actions Session 16** :
```sql
-- ⚠️ TABLE CONTIENT DONNÉES (crm_leads) - Validation obligatoire avant DROP
-- Vérifier migration Session 14 : first_name/last_name peuplés depuis full_name
-- Vérifier migration Session 14 : source_id peuplé depuis source VARCHAR
SELECT COUNT(*) FROM crm_leads WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);  -- Doit être 0
SELECT COUNT(*) FROM crm_leads WHERE source IS NOT NULL AND source_id IS NULL;  -- Doit être 0

ALTER TABLE crm_leads DROP COLUMN full_name;  -- ⚠️ BREAKING CHANGE
ALTER TABLE crm_leads DROP COLUMN source;     -- ⚠️ BREAKING CHANGE
-- NOTE: status VARCHAR peut coexister avec lead_status enum (noms différents)
```

---

#### Table `crm_opportunities`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `stage` (VARCHAR) | `opportunity_stage` (enum) | Type-safety enum | Session 16 |
| `expected_value` | `forecast_value` | Calcul probabiliste | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE crm_opportunities DROP COLUMN stage;  -- ⚠️ BREAKING CHANGE
-- NOTE: expected_value maintenu (valeur brute sans probabilité)
```

---

#### Table `crm_contracts`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `reference` | `contract_code` | Cohérence nommage | Session 16 |
| `status` (VARCHAR) | `contract_status` (enum) | Type-safety enum | Session 16 |
| `signed` (BOOLEAN) | `signature_date` (DATE) | Date précise > boolean | Session 16 |
| `signed_date` | `signature_date` | Cohérence nommage | Session 16 |
| `start_date` | `signature_date` | Clarification sémantique | Session 16 |
| `end_date` | `expiration_date` | Clarification sémantique | Session 16 |
| `renewed` (BOOLEAN) | `renewed_from_contract_id` (UUID) | Traçabilité chaîne | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE crm_contracts DROP COLUMN reference;      -- ⚠️ BREAKING CHANGE
ALTER TABLE crm_contracts DROP COLUMN signed;         -- ⚠️ BREAKING CHANGE
ALTER TABLE crm_contracts DROP COLUMN signed_date;    -- ⚠️ BREAKING CHANGE
ALTER TABLE crm_contracts DROP COLUMN start_date;     -- ⚠️ BREAKING CHANGE
ALTER TABLE crm_contracts DROP COLUMN end_date;       -- ⚠️ BREAKING CHANGE
ALTER TABLE crm_contracts DROP COLUMN renewed;        -- ⚠️ BREAKING CHANGE
```

---

### Module DOC

#### Table `doc_documents`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `verified` (BOOLEAN) | `verification_status` (enum) | Workflow multi-états | Session 16 |
| `cloud_url` (TEXT) | `s3_key` + `gcs_path` + `azure_blob_name` | Multi-cloud support | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE doc_documents DROP COLUMN verified;    -- ⚠️ BREAKING CHANGE
ALTER TABLE doc_documents DROP COLUMN cloud_url;   -- ⚠️ BREAKING CHANGE
```

---

### Module BIL

#### Table `bil_billing_plans`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `status` (TEXT) | `status_v2` (billing_plan_status enum) | Type-safety enum (draft/active/deprecated/archived) | Session 16 |
| `monthly_fee` | `price_monthly` | Cohérence nommage pricing | Session 16 |
| `annual_fee` | `price_yearly` | Cohérence nommage pricing | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE bil_billing_plans DROP COLUMN status;       -- ⚠️ BREAKING CHANGE
ALTER TABLE bil_billing_plans DROP COLUMN monthly_fee;  -- ⚠️ BREAKING CHANGE
ALTER TABLE bil_billing_plans DROP COLUMN annual_fee;   -- ⚠️ BREAKING CHANGE
```

---

#### Table `bil_tenant_subscriptions`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `status` (TEXT) | `status_v2` (subscription_status enum) | Type-safety enum (trial/active/past_due/canceled/paused) | Session 16 |
| `subscription_start` | `current_period_start` | Clarification période actuelle | Session 16 |
| `subscription_end` | `current_period_end` | Clarification période actuelle | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE bil_tenant_subscriptions DROP COLUMN status;              -- ⚠️ BREAKING CHANGE
ALTER TABLE bil_tenant_subscriptions DROP COLUMN subscription_start;  -- ⚠️ BREAKING CHANGE
ALTER TABLE bil_tenant_subscriptions DROP COLUMN subscription_end;    -- ⚠️ BREAKING CHANGE
```

---

#### Table `bil_tenant_invoices`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `status` (TEXT) | `status_v2` (invoice_status enum) | Type-safety enum (draft/sent/paid/overdue/void/uncollectible) | Session 16 |
| `total_amount` | `subtotal` + `tax_amount` + `amount_due` | Décomposition montants détaillée | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE bil_tenant_invoices DROP COLUMN status;  -- ⚠️ BREAKING CHANGE
-- NOTE: total_amount peut être maintenu comme colonne calculée (backward compatibility)
```

---

#### Table `bil_payment_methods`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `payment_type` (TEXT) | `payment_type_v2` (payment_type enum) | Type-safety enum (card/bank_account/paypal/mobile_money) | Session 16 |
| `status` (TEXT) | `status_v2` (payment_method_status enum) | Type-safety enum (active/expired/pending_verification) | Session 16 |
| `provider_token` | `provider_payment_method_id` | Clarification sémantique ID externe | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE bil_payment_methods DROP COLUMN payment_type;    -- ⚠️ BREAKING CHANGE
ALTER TABLE bil_payment_methods DROP COLUMN status;          -- ⚠️ BREAKING CHANGE
ALTER TABLE bil_payment_methods DROP COLUMN provider_token;  -- ⚠️ BREAKING CHANGE
```

---

### Module SUP

#### Table `sup_tickets`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `status` (TEXT) | `status_v2` (ticket_status enum) | Type-safety enum (new/open/waiting_client/waiting_internal/resolved/closed) | Session 16 |
| `priority` (TEXT) | `priority_v2` (ticket_priority enum) | Type-safety enum (low/medium/high/critical) | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE sup_tickets DROP COLUMN status;    -- ⚠️ BREAKING CHANGE
ALTER TABLE sup_tickets DROP COLUMN priority;  -- ⚠️ BREAKING CHANGE
```

---

#### Table `sup_customer_feedback`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `submitter_type` (VARCHAR) | `submitter_type_v2` (submitter_type enum) | Type-safety enum (driver/client/member/guest) | Session 16 |
| `rating` (INT) | `overall_rating` + `response_time_rating` + `resolution_quality_rating` + `agent_professionalism_rating` | Ratings détaillés multi-dimensions | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE sup_customer_feedback DROP COLUMN submitter_type;  -- ⚠️ BREAKING CHANGE
-- NOTE: rating peut être maintenu comme moyenne calculée (backward compatibility)
```

---

### Module RID

#### Table `rid_drivers`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `driver_status` (VARCHAR) | `driver_status_v2` (driver_status enum) | Type-safety enum (active/inactive/suspended/terminated) | Session 16 |
| `rating` (DECIMAL) | `average_rating` (DECIMAL V2) | Renommage pour clarté sémantique | Session 16 |
| `hire_date` (DATE) | `onboarded_at` (TIMESTAMPTZ) | Terminologie plus précise | Session 16 |
| `employment_status` (TEXT) | `driver_status_v2` (enum) | Redondant avec driver_status | Session 16 |
| `cooperation_type` (TEXT) | rid_driver_cooperation_terms.compensation_model_v2 | Normalisation dans table séparée | Session 16 |

**Actions Session 16** :
```sql
-- ⚠️ TABLE CONTIENT DONNÉES (rid_drivers) - Validation obligatoire avant DROP
-- Vérifier migration Session 14 : driver_status_v2 peuplé depuis driver_status VARCHAR
SELECT COUNT(*) FROM rid_drivers WHERE driver_status IS NOT NULL AND driver_status_v2 IS NULL;  -- Doit être 0

ALTER TABLE rid_drivers DROP COLUMN driver_status;        -- ⚠️ BREAKING CHANGE
ALTER TABLE rid_drivers DROP COLUMN rating;               -- ⚠️ BREAKING CHANGE (remplacé par average_rating)
ALTER TABLE rid_drivers DROP COLUMN hire_date;            -- ⚠️ BREAKING CHANGE (remplacé par onboarded_at)
ALTER TABLE rid_drivers DROP COLUMN employment_status;    -- ⚠️ BREAKING CHANGE (redondant)
ALTER TABLE rid_drivers DROP COLUMN cooperation_type;     -- ⚠️ BREAKING CHANGE (normalisé)
```

---

#### Table `rid_driver_documents`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `document_type` (TEXT) | `document_type_v2` (driver_document_type enum) | Type-safety enum (15 types normalisés) | Session 16 |
| `verified` (BOOLEAN) | `verification_status` (document_verification_status enum) | Workflow multi-états (pending/verified/rejected/expired) | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE rid_driver_documents DROP COLUMN document_type;  -- ⚠️ BREAKING CHANGE
ALTER TABLE rid_driver_documents DROP COLUMN verified;        -- ⚠️ BREAKING CHANGE
```

---

#### Table `rid_driver_cooperation_terms`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `status` (TEXT) | `status_v2` (cooperation_status enum) | Type-safety enum (pending/active/expired/terminated) | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE rid_driver_cooperation_terms DROP COLUMN status;  -- ⚠️ BREAKING CHANGE
```

---

#### Table `rid_driver_requests`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `request_type` (TEXT) | `request_type_v2` (driver_request_type enum) | Type-safety enum (11 types normalisés) | Session 16 |
| `status` (TEXT) | `status_v2` (request_status enum) | Type-safety enum (pending/under_review/approved/rejected/cancelled/completed) | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE rid_driver_requests DROP COLUMN request_type;  -- ⚠️ BREAKING CHANGE
ALTER TABLE rid_driver_requests DROP COLUMN status;        -- ⚠️ BREAKING CHANGE
```

---

#### Table `rid_driver_performances`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `hours_online` (DECIMAL) | `hours_logged` (DECIMAL V2) | Renommage pour cohérence terminologie | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE rid_driver_performances DROP COLUMN hours_online;  -- ⚠️ BREAKING CHANGE
```

---

#### Table `rid_driver_blacklists`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `status` (TEXT) | `status_v2` (blacklist_status enum) | Type-safety enum (active/expired/revoked/appealed_lifted) | Session 16 |
| `reason` (TEXT) | `incident_description` + `category` + `severity` | Structuration détaillée avec catégorisation | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE rid_driver_blacklists DROP COLUMN status;  -- ⚠️ BREAKING CHANGE
-- NOTE: reason maintenu temporairement (backward compatibility, à DROP après vérification incident_description)
```

---

#### Table `rid_driver_training`

| Colonne V1 | Colonne(s) V2 | Raison dépréciation | Timeline |
|------------|---------------|---------------------|----------|
| `status` (TEXT) | `status_v2` (training_status enum) | Type-safety enum (planned/in_progress/completed/expired/cancelled) | Session 16 |
| `provider` (TEXT) | `provider_type_v2` (provider_type enum) + `provider_id` (UUID) | Normalisation provider avec typage | Session 16 |

**Actions Session 16** :
```sql
-- ATTENTION: Exécuter en Session 16 après validation migration données Session 14
ALTER TABLE rid_driver_training DROP COLUMN status;    -- ⚠️ BREAKING CHANGE
ALTER TABLE rid_driver_training DROP COLUMN provider;  -- ⚠️ BREAKING CHANGE
```

---

#### Table `rid_driver_languages` ⚠️ SUPPRESSION COMPLÈTE

**Note critique** : Cette table existe en V1 mais n'est PAS présente dans le schéma V2. La table entière sera supprimée.

**Actions Session 16** :
```sql
-- ⚠️⚠️⚠️ SUPPRESSION COMPLÈTE TABLE (absente du schéma V2)
-- Vérifier si données nécessaires avant DROP
SELECT COUNT(*) AS total_entries FROM rid_driver_languages;
SELECT driver_id, language_code, proficiency FROM rid_driver_languages LIMIT 10;

-- Si données importantes : les migrer vers rid_drivers.metadata->>'languages' avant DROP
-- UPDATE rid_drivers d SET metadata = metadata || jsonb_build_object('languages', (
--   SELECT jsonb_agg(jsonb_build_object('code', language_code, 'proficiency', proficiency))
--   FROM rid_driver_languages WHERE driver_id = d.id
-- )) WHERE EXISTS (SELECT 1 FROM rid_driver_languages WHERE driver_id = d.id);

-- Puis DROP table complète
DROP TABLE rid_driver_languages CASCADE;  -- ⚠️⚠️⚠️ BREAKING CHANGE - TABLE COMPLÈTE
```

**Notes critiques Module RID** :
- ⚠️ 7 tables avec coexistence V1/V2
- ⚠️ 1 table complète à DROP (rid_driver_languages)
- ⚠️ 20 enums créés pour normalisation
- ⚠️ ~335 colonnes V2 ajoutées au total
- ⚠️ driver_status VARCHAR → driver_status_v2 enum dans 7+ tables
- ⚠️ Vérifier migration données avant tout DROP

---

### Module FLT

#### **Module FLT (Session 8)** : Stratégie Additive Pure

**Caractéristique unique** : FLT n'a **AUCUN conflit** de noms entre colonnes V1 et V2.

**Raison** :
- Tous les 32 enums FLT ont des noms explicites distincts
- Aucune colonne V1 TEXT/VARCHAR remplacée par enum de même nom
- Migration 100% additive (ajout de colonnes, pas de remplacement)

**Résultat** :
- ✅ **0 colonne avec suffix `_v2`** à RENAME
- ✅ **0 colonne V1 obsolète** à DROP (toutes en coexistence productive)
- ✅ **0 action requise** en Session 16 Phase 2

---

#### Tables FLT : État Coexistence V1/V2

| Table | Colonnes V1 | Colonnes V2 ajoutées | Colonnes `_v2` | Actions Phase 2 |
|-------|-------------|----------------------|----------------|-----------------|
| flt_vehicles | 28 | 21 nouvelles | 0 | ✅ Aucune |
| flt_vehicle_assignments | 18 | 19 nouvelles | 0 | ✅ Aucune |
| flt_vehicle_events | 18 | 19 nouvelles | 0 | ✅ Aucune |
| flt_vehicle_maintenance | 22 | 26 nouvelles | 0 | ✅ Aucune |
| flt_vehicle_expenses | 29 | 26 nouvelles | 0 | ✅ Aucune |
| flt_vehicle_insurances | 30 | 35 nouvelles | 0 | ✅ Aucune |

**Total** : 6 tables V1 étendues + 4 tables V2 nouvelles = **10 tables FLT**

---

#### Exemples Enums FLT Sans Conflit

```sql
-- ✅ Enums avec noms explicites (pas de conflit avec colonnes V1)
-- Assignments: assignment_type, assignment_status, handover_type
-- Events: vehicle_event_type, responsible_party, event_severity
-- Maintenance: maintenance_type, maintenance_category, maintenance_priority
-- Expenses: expense_category, approval_status, receipt_status
-- Insurances: policy_category, coverage_drivers, vehicle_usage

-- Résultat: Aucune colonne V1 "status", "type", "category" TEXT remplacée
-- Toutes les colonnes V2 sont additives avec noms explicites
```

**Actions Session 16 Phase 2** :
```sql
-- ✅ FLT: Aucune opération RENAME nécessaire
-- Raison: 0 colonne avec suffix _v2
-- Vérification: Confirmer aucune colonne FLT ne contient suffix _v2
SELECT COUNT(*) AS flt_v2_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'flt_%'
  AND column_name LIKE '%_v2';
-- ✅ ATTENDU: 0
```

**Actions Session 16 Phase 1** (DROP colonnes V1 obsolètes) :
```sql
-- 🟢 FLT: Aucune colonne V1 obsolète à DROP
-- Raison: Migration additive pure, toutes colonnes en coexistence productive
-- Les colonnes V1 restent utiles pour backward compatibility
-- DROP potentiel uniquement après migration applicative complète (Phase 4, 12-18 mois)
```

**Notes critiques Module FLT** :
- ✅ Migration la plus propre : 100% additive
- ✅ 0 conflit de nommage
- ✅ 32 enums créés avec noms explicites
- ✅ 143 nouvelles colonnes ajoutées (21+21+19+26+26+35)
- ✅ 6 tables V1 étendues + 4 tables V2 nouvelles
- ✅ Handover protocol avec 6 photos obligatoires
- ✅ Predictive maintenance, expense validation, multi-policy insurance
- ✅ Multi-country compliance (UAE focus)

---

**Module SCH (Session 10)** : ⚠️ **8 colonnes `_v2`** à RENAME

| # | Table | Colonne V2 actuelle | Colonne finale (après RENAME) | Fichier source |
|---|-------|---------------------|-------------------------------|----------------|
| 25 | sch_shifts | status_v2 | status | 10_sch_structure.sql:286 |
| 26 | sch_maintenance_schedules | priority_v2 | priority | 10_sch_structure.sql:337 |
| 27 | sch_maintenance_schedules | status_v2 | status | 10_sch_structure.sql:352 |
| 28 | sch_goals | goal_category_v2 | goal_category | 10_sch_structure.sql:429 |
| 29 | sch_goals | status_v2 | status | 10_sch_structure.sql:451 |
| 30 | sch_tasks | task_category_v2 | task_category | 10_sch_structure.sql:554 |
| 31 | sch_tasks | priority_v2 | priority | 10_sch_structure.sql:557 |
| 32 | sch_tasks | status_v2 | status | 10_sch_structure.sql:586 |

**SQL RENAME Module SCH** :
```sql
-- Table 1/4: sch_shifts (1 colonne)
ALTER TABLE sch_shifts
  RENAME COLUMN status_v2 TO status;

-- Table 2/4: sch_maintenance_schedules (2 colonnes)
ALTER TABLE sch_maintenance_schedules
  RENAME COLUMN priority_v2 TO priority;
ALTER TABLE sch_maintenance_schedules
  RENAME COLUMN status_v2 TO status;

-- Table 3/4: sch_goals (2 colonnes)
ALTER TABLE sch_goals
  RENAME COLUMN goal_category_v2 TO goal_category;
ALTER TABLE sch_goals
  RENAME COLUMN status_v2 TO status;

-- Table 4/4: sch_tasks (3 colonnes)
ALTER TABLE sch_tasks
  RENAME COLUMN task_category_v2 TO task_category;
ALTER TABLE sch_tasks
  RENAME COLUMN priority_v2 TO priority;
ALTER TABLE sch_tasks
  RENAME COLUMN status_v2 TO status;
```

---

### Module SCH

#### **Module SCH (Session 10)** : Conflits de nommage multiples

**Caractéristique** : SCH a **8 colonnes avec suffix `_v2`** dues aux conflits génériques VARCHAR V1 (`status`, `priority`, `category`).

**Raison** :
- Tables V1 utilisaient déjà `status`, `priority`, `category` comme colonnes VARCHAR
- Migration V2 introduit enums avec noms identiques → suffixe `_v2` obligatoire
- 4 tables modifiées avec conflits : shifts, maintenance_schedules, goals, tasks

**Résultat** :
- ⚠️ **8 colonnes avec suffix `_v2`** à RENAME
- ⚠️ **8 colonnes V1 obsolètes** à DROP après validation Session 14
- ⚠️ **Opérations RENAME obligatoires** en Session 16 Phase 2

---

#### Tables SCH : Colonnes `_v2` à RENAME

| Table | Colonnes V1 VARCHAR | Colonnes V2 enum (_v2) | Actions Phase 2 |
|-------|---------------------|------------------------|-----------------|
| sch_shifts | status | status_v2 → status | RENAME (1 colonne) |
| sch_maintenance_schedules | priority, status | priority_v2 → priority<br>status_v2 → status | RENAME (2 colonnes) |
| sch_goals | category, status | goal_category_v2 → goal_category<br>status_v2 → status | RENAME (2 colonnes) |
| sch_tasks | category, priority, status | task_category_v2 → task_category<br>priority_v2 → priority<br>status_v2 → status | RENAME (3 colonnes) |

**Total** : 4 tables avec 8 colonnes à RENAME

---

#### Détail conflits par table

**1. sch_shifts** :
- ❌ CONFLIT : `status` VARCHAR V1 → `status_v2` shift_status enum V2
- Mapping : scheduled/completed/cancelled/no_show/partial
- Action : RENAME `status_v2` → `status`, puis DROP `status` VARCHAR V1

**2. sch_maintenance_schedules** :
- ❌ DOUBLE CONFLIT :
  - `priority` VARCHAR V1 → `priority_v2` maintenance_priority enum V2
  - `status` VARCHAR V1 → `status_v2` maintenance_status enum V2
- Mapping : low/normal/high/urgent/critical + scheduled/completed/cancelled/overdue/in_progress/rescheduled
- Actions : RENAME 2 colonnes, puis DROP 2 colonnes VARCHAR V1

**3. sch_goals** :
- ❌ DOUBLE CONFLIT :
  - `category` VARCHAR V1 → `goal_category_v2` goal_category enum V2
  - `status` VARCHAR V1 → `status_v2` goal_status enum V2
- Mapping : revenue/trips/quality/efficiency/safety + active/in_progress/completed/cancelled/expired
- Actions : RENAME 2 colonnes, puis DROP 2 colonnes VARCHAR V1

**4. sch_tasks** :
- ❌ TRIPLE CONFLIT :
  - `category` VARCHAR V1 → `task_category_v2` task_category enum V2
  - `priority` VARCHAR V1 → `priority_v2` task_priority enum V2
  - `status` VARCHAR V1 → `status_v2` task_status enum V2
- Mapping : admin/maintenance/document/training/support + low/normal/high/urgent/critical + pending/in_progress/completed/cancelled
- Actions : RENAME 3 colonnes, puis DROP 3 colonnes VARCHAR V1

---

#### Exemples mapping enums SCH

```sql
-- ✅ CONFLITS avec colonnes VARCHAR V1 génériques
-- Shifts: status VARCHAR → status_v2 shift_status enum
--   Valeurs: scheduled, completed, cancelled, no_show, partial

-- Maintenance: priority VARCHAR + status VARCHAR → enums V2
--   priority_v2: low, normal, high, urgent, critical
--   status_v2: scheduled, completed, cancelled, overdue, in_progress, rescheduled

-- Goals: category VARCHAR + status VARCHAR → enums V2
--   goal_category_v2: revenue, trips, quality, efficiency, safety
--   status_v2: active, in_progress, completed, cancelled, expired, on_track, at_risk, achieved, exceeded

-- Tasks: category VARCHAR + priority VARCHAR + status VARCHAR → enums V2
--   task_category_v2: admin, maintenance, document, training, support
--   priority_v2: low, normal, high, urgent, critical
--   status_v2: pending, in_progress, completed, cancelled, overdue, blocked, waiting_verification, reopened
```

**Actions Session 16 Phase 2** :
```sql
-- ⚠️ SCH: 8 opérations RENAME nécessaires (voir SQL ci-dessus)
-- Raison: Conflits nommage génériques status/priority/category
-- Vérification: Confirmer 8 colonnes SCH contiennent suffix _v2
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'sch_%'
  AND column_name LIKE '%_v2'
ORDER BY table_name, column_name;
-- ⚠️ ATTENDU: 8 lignes
-- sch_goals | goal_category_v2
-- sch_goals | status_v2
-- sch_maintenance_schedules | priority_v2
-- sch_maintenance_schedules | status_v2
-- sch_shifts | status_v2
-- sch_tasks | priority_v2
-- sch_tasks | status_v2
-- sch_tasks | task_category_v2
```

**Actions Session 16 Phase 1** (DROP colonnes V1 obsolètes) :
```sql
-- ⚠️ SCH: DROP 8 colonnes VARCHAR V1 APRÈS RENAME _v2
-- ATTENTION: Exécuter RENAME Phase 2 AVANT DROP Phase 1!

-- Table 1: sch_shifts
ALTER TABLE sch_shifts DROP COLUMN status;  -- ⚠️ BREAKING (après RENAME status_v2)

-- Table 2: sch_maintenance_schedules
ALTER TABLE sch_maintenance_schedules DROP COLUMN priority;  -- ⚠️ BREAKING (après RENAME priority_v2)
ALTER TABLE sch_maintenance_schedules DROP COLUMN status;    -- ⚠️ BREAKING (après RENAME status_v2)

-- Table 3: sch_goals
ALTER TABLE sch_goals DROP COLUMN category;  -- ⚠️ BREAKING (après RENAME goal_category_v2)
ALTER TABLE sch_goals DROP COLUMN status;    -- ⚠️ BREAKING (après RENAME status_v2)

-- Table 4: sch_tasks
ALTER TABLE sch_tasks DROP COLUMN category;  -- ⚠️ BREAKING (après RENAME task_category_v2)
ALTER TABLE sch_tasks DROP COLUMN priority;  -- ⚠️ BREAKING (après RENAME priority_v2)
ALTER TABLE sch_tasks DROP COLUMN status;    -- ⚠️ BREAKING (après RENAME status_v2)

-- ⚠️⚠️⚠️ ORDRE CRITIQUE:
-- 1. Session 14: Migration données V1 → V2 (status VARCHAR → status_v2 enum)
-- 2. Session 16 Phase 2: RENAME status_v2 → status (nom final Prisma)
-- 3. Session 16 Phase 1: DROP status VARCHAR V1 obsolète
```

**Notes critiques Module SCH** :
- ⚠️ Module avec le PLUS de conflits de nommage : 8 colonnes `_v2`
- ⚠️ 4 tables modifiées (shifts, maintenance_schedules, goals, tasks)
- ⚠️ Colonnes génériques VARCHAR V1 (`status`, `priority`, `category`) causent tous les conflits
- ⚠️ 18 enums créés avec noms spécifiques (shift_status, task_priority, goal_category, etc.)
- ⚠️ 115 nouvelles colonnes ajoutées (20+24+31+40)
- ⚠️ 4 tables V1 étendues + 8 tables V2 nouvelles (dont dir_maintenance_types partagée DIR/SCH)
- ⚠️ Planning shifts temps réel, maintenance préventive, KPI gamification, workflow tâches
- ⚠️ **ORDRE CRITIQUE RENAME** : TOUJOURS Phase 2 (RENAME) AVANT Phase 1 (DROP) pour éviter perte de données!

---

**Module TRP (Session 12)** : ⚠️ **4 colonnes `_v2`** à RENAME
```sql
-- ⚠️ TRP a 4 colonnes avec suffix _v2
-- Raison: Conflit de nommage avec colonnes status VARCHAR V1 existantes
-- - trp_platform_accounts.status_v2 (platform_account_status)
-- - trp_trips.status_v2 (trip_status)
-- - trp_settlements.status_v2 (settlement_status)
-- - trp_client_invoices.status_v2 (invoice_status)
-- Note: Colonne status VARCHAR existait en V1 pour toutes ces tables
```

**SQL RENAME Module TRP** :
```sql
-- Module TRP: 4 colonnes `_v2` à RENAME sur 4 tables

-- Table 1/4: trp_platform_accounts (1 colonne)
ALTER TABLE trp_platform_accounts RENAME COLUMN status_v2 TO status;

-- Table 2/4: trp_trips (1 colonne)
ALTER TABLE trp_trips RENAME COLUMN status_v2 TO status;

-- Table 3/4: trp_settlements (1 colonne)
ALTER TABLE trp_settlements RENAME COLUMN status_v2 TO status;

-- Table 4/4: trp_client_invoices (1 colonne)
ALTER TABLE trp_client_invoices RENAME COLUMN status_v2 TO status;
```

**Vérification TRP** :
```sql
-- Vérifier 4 colonnes TRP avec suffix _v2
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'trp_%'
  AND column_name LIKE '%_v2'
ORDER BY table_name, column_name;
-- ⚠️ ATTENDU: 4 lignes
```

**Notes critiques Module TRP** :
- ⚠️ **4 colonnes _v2** : Toutes liées au conflit status VARCHAR V1
- ⚠️ 4 tables modifiées (platform_accounts, trips, settlements, client_invoices)
- ✅ 2 tables nouvelles (platform_account_keys, client_invoice_lines)
- ✅ 7 enums créés (platform_account_status, trip_status, settlement_status, invoice_status, trp_payment_method, etc.)
- ✅ 82 nouvelles colonnes ajoutées (15+27+22+18)
- ✅ Import courses plateformes (Uber, Careem, Bolt), settlements multi-devises, facturation B2B
- ✅ **FK FUTURE** : trp_settlements.reconciliation_id → rev_reconciliations.id (module REV pas encore créé)
- ⚠️ **api_key DEPRECATED** : À migrer vers trp_platform_account_keys avec chiffrement Vault (colonne à DROP en Phase 1)
- ⚠️ **payment_method** : Renommé en `trp_payment_method` pour éviter conflit avec BIL module
- ⚠️ **FK CRM commentées** : Tables crm_clients et crm_pricing_plans n'existent pas encore

---

## VÉRIFICATIONS COHÉRENCE

### Post-Session 14 (Migration données)

#### Vérification 1: Colonnes NULL obligatoires remplies

```sql
-- CRM: Codes générés
SELECT COUNT(*) AS missing_lead_code FROM crm_leads WHERE lead_code IS NULL;  -- Attendu: 0
SELECT COUNT(*) AS missing_contract_code FROM crm_contracts WHERE contract_code IS NULL;  -- Attendu: 0

-- DOC: Codes générés
SELECT COUNT(*) AS missing_doc_code FROM doc_documents WHERE document_code IS NULL;  -- Attendu: 0

-- DIR: Codes générés
SELECT COUNT(*) AS missing_make_code FROM dir_car_makes WHERE make_code IS NULL;  -- Attendu: 0
```

---

#### Vérification 2: Migration full_name → first_name+last_name

```sql
-- CRM: Vérifier migration noms
SELECT
  COUNT(*) AS total_leads,
  COUNT(full_name) AS has_full_name,
  COUNT(first_name) AS has_first_name,
  COUNT(last_name) AS has_last_name,
  COUNT(CASE WHEN full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL) THEN 1 END) AS migration_pending
FROM crm_leads;
-- Attendu: migration_pending = 0
```

---

#### Vérification 3: Migration enums (status VARCHAR → enum)

```sql
-- CRM Leads: Vérifier mapping status
SELECT
  status AS old_status_varchar,
  lead_status AS new_status_enum,
  COUNT(*) AS count
FROM crm_leads
WHERE lead_status IS NULL AND status IS NOT NULL
GROUP BY status, lead_status;
-- Attendu: 0 lignes (tous les status migrés)
```

---

#### Vérification 4: Foreign Keys source_id

```sql
-- CRM: Vérifier sources orphelines
SELECT COUNT(*) AS orphan_sources
FROM crm_leads
WHERE source IS NOT NULL
  AND source_id IS NULL;
-- Attendu: 0 (toutes sources mappées vers crm_lead_sources)
```

---

#### Vérification 5: Indexes UNIQUE avec soft delete

```sql
-- Vérifier doublons emails (ignorant deleted_at)
SELECT email, COUNT(*) AS duplicates
FROM crm_leads
WHERE deleted_at IS NULL
GROUP BY email
HAVING COUNT(*) > 1;
-- Attendu: 0 lignes

-- Vérifier doublons contract_code (ignorant deleted_at)
SELECT contract_code, COUNT(*) AS duplicates
FROM crm_contracts
WHERE deleted_at IS NULL
GROUP BY contract_code
HAVING COUNT(*) > 1;
-- Attendu: 0 lignes
```

---

#### Vérification 6: Calculs dérivés (forecast_value)

```sql
-- CRM Opportunities: Vérifier calcul forecast_value
SELECT
  COUNT(*) AS total_opportunities,
  COUNT(expected_value) AS has_expected_value,
  COUNT(probability_percent) AS has_probability,
  COUNT(forecast_value) AS has_forecast_value,
  COUNT(CASE WHEN expected_value IS NOT NULL AND probability_percent IS NOT NULL AND forecast_value IS NULL THEN 1 END) AS calculation_pending
FROM crm_opportunities;
-- Attendu: calculation_pending = 0
```

---

#### Vérification 7: Multi-cloud migrations (DOC)

```sql
-- DOC: Vérifier migration cloud_url → provider-specific
SELECT
  COUNT(*) AS total_docs,
  COUNT(cloud_url) AS has_cloud_url,
  COUNT(s3_key) AS has_s3,
  COUNT(gcs_path) AS has_gcs,
  COUNT(azure_blob_name) AS has_azure,
  COUNT(CASE WHEN cloud_url IS NOT NULL AND (s3_key IS NULL AND gcs_path IS NULL AND azure_blob_name IS NULL) THEN 1 END) AS migration_pending
FROM doc_documents;
-- Attendu: migration_pending = 0
```

---

### Post-Session 15 (Indexes)

#### Vérification 8: Indexes créés

```sql
-- Lister tous les indexes UNIQUE avec WHERE deleted_at IS NULL
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexdef LIKE '%WHERE%deleted_at IS NULL%'
ORDER BY tablename, indexname;

-- Attendu: Au moins 6 indexes (leads_email, contracts_reference, contracts_code, documents_code, car_makes_code, car_makes_seo_slug)
```

---

## NOTES D'IMPLÉMENTATION

### Timeline Recommandée

| Phase | Période | Actions |
|-------|---------|---------|
| **Phase 1** | Session 14 (Migration) | Migrations données V1→V2, indexes UNIQUE soft delete |
| **Phase 2** | Sessions 15-17 | Indexes performances, tests charge, optimisations |
| **Phase 3** | 6-12 mois post-prod | Migration applicative complète vers colonnes V2 |
| **Phase 4** | 12-18 mois post-prod | Suppression colonnes V1 dépréciées (BREAKING CHANGES) |

---

### Stratégie Migration Applicative (Phase 3)

1. **Backend** : Utiliser colonnes V2 en priorité, fallback V1 si NULL
2. **Frontend** : Afficher colonnes V2, cacher colonnes V1
3. **APIs** : Accepter V1+V2 en input, retourner V2 uniquement
4. **Monitoring** : Alertes si colonnes V1 encore utilisées après 6 mois

---

### Rollback Strategy

En cas de problème post-migration V2 :

```sql
-- ROLLBACK: Copie V2 → V1 (colonnes critiques)
UPDATE crm_leads SET full_name = CONCAT(first_name, ' ', last_name) WHERE full_name IS NULL;
UPDATE crm_contracts SET reference = contract_code WHERE reference IS NULL;
UPDATE doc_documents SET verified = (verification_status = 'verified') WHERE verified IS NULL;
```

---

**Document créé** : 4 Novembre 2025
**Dernière mise à jour** : 4 Novembre 2025
**Version** : 1.0.0
**Modules couverts** : CRM (Session 4), DOC (Session 3), DIR (Session 2)
