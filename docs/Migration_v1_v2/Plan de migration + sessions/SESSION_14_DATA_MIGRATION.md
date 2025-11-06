# POST-MIGRATION V2 - SESSION 14

**Document de référence** : Migration des données V1→V2

---

## 📋 TABLE DES MATIÈRES

1. [Session 14 : Migrations Données V1→V2](#session-14--migrations-données-v1v2)
   - [Module ADM](#module-adm-session-1)
   - [Module CRM](#module-crm-session-4)
   - [Module DOC](#module-doc-session-3)
   - [Module DIR](#module-dir-session-2)
   - [Module BIL](#module-bil-session-5)
   - [Module SUP](#module-sup-session-6)
   - [Module RID](#module-rid-session-7)
   - [Module FLT](#module-flt-session-8)
2. [Retour au sommaire principal](./README.md)

---

## SESSION 14 : MIGRATIONS DONNÉES V1→V2

### Module ADM (Session 1)

#### Table 1: `adm_tenants`

**Colonnes V2 ajoutées** (7 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | status | status | tenant_status DEFAULT 'trialing' | Migration depuis metadata ou 'active' |
| 2 | onboardingCompletedAt | onboarding_completed_at | TIMESTAMPTZ(6) | Inférer depuis created_at si ancien |
| 3 | trialEndsAt | trial_ends_at | TIMESTAMPTZ(6) | Calculer created_at + 14 jours |
| 4 | nextInvoiceDate | next_invoice_date | DATE | Calculer depuis billing cycle |
| 5 | primaryContactEmail | primary_contact_email | VARCHAR(255) | Migration depuis metadata |
| 6 | primaryContactPhone | primary_contact_phone | VARCHAR(50) | Migration depuis metadata |
| 7 | billingEmail | billing_email | VARCHAR(255) | Copier depuis primary_contact_email |

**Colonnes V1 conservées** :
- `id`, `name`, `slug`, `metadata`
- `created_at`, `updated_at`, `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration status depuis metadata ou défaut 'active'
UPDATE adm_tenants
SET status = CASE
  WHEN metadata->>'status' = 'trial' THEN 'trialing'::tenant_status
  WHEN metadata->>'status' = 'active' THEN 'active'::tenant_status
  WHEN metadata->>'status' = 'suspended' THEN 'suspended'::tenant_status
  WHEN created_at > NOW() - INTERVAL '14 days' THEN 'trialing'::tenant_status
  ELSE 'active'::tenant_status
END
WHERE status = 'trialing';

-- ACTION 2: Calcul trial_ends_at (created_at + 14 jours)
UPDATE adm_tenants
SET trial_ends_at = created_at + INTERVAL '14 days'
WHERE trial_ends_at IS NULL
AND status = 'trialing';

-- ACTION 3: Migration onboarding_completed_at (tenants > 30 jours = onboardés)
UPDATE adm_tenants
SET onboarding_completed_at = created_at + INTERVAL '7 days'
WHERE onboarding_completed_at IS NULL
AND created_at < NOW() - INTERVAL '30 days';

-- ACTION 4: Calcul next_invoice_date (début mois prochain)
UPDATE adm_tenants
SET next_invoice_date = DATE_TRUNC('month', NOW() + INTERVAL '1 month')::DATE
WHERE next_invoice_date IS NULL
AND status = 'active';

-- ACTION 5: Extraction contacts depuis metadata
UPDATE adm_tenants
SET
  primary_contact_email = metadata->>'contact_email',
  primary_contact_phone = metadata->>'contact_phone',
  billing_email = COALESCE(metadata->>'billing_email', metadata->>'contact_email')
WHERE primary_contact_email IS NULL
AND metadata IS NOT NULL;
```

**Notes critiques** :
- ⚠️ **TABLE CONTIENT DONNÉES** (adm_tenants) - Validation obligatoire
- ⚠️ `status` enum ajouté avec défaut 'trialing' → Vérifier migration correcte
- ⚠️ `trial_ends_at` calculé automatiquement pour tenants en trial
- ⚠️ `billing_email` copie `primary_contact_email` si non spécifié

---

#### Table 2: `adm_members`

**Colonnes V2 ajoutées** (10 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | status | status | member_status DEFAULT 'invited' | Migration depuis metadata ou 'active' |
| 2 | emailVerifiedAt | email_verified_at | TIMESTAMPTZ(6) | Inférer depuis created_at si ancien |
| 3 | twoFactorEnabled | two_factor_enabled | BOOLEAN DEFAULT false | Migration depuis metadata |
| 4 | twoFactorSecret | two_factor_secret | TEXT | NULL (à configurer par user) |
| 5 | passwordChangedAt | password_changed_at | TIMESTAMPTZ(6) | Défaut created_at |
| 6 | failedLoginAttempts | failed_login_attempts | INTEGER DEFAULT 0 | Migration depuis metadata |
| 7 | lockedUntil | locked_until | TIMESTAMPTZ(6) | Migration depuis metadata |
| 8 | defaultRoleId | default_role_id | UUID | Inférer depuis adm_member_roles |
| 9 | preferredLanguage | preferred_language | VARCHAR(10) | Migration depuis metadata ou 'en' |
| 10 | notificationPreferences | notification_preferences | JSONB | Défaut '{"email":true}' |

**Colonnes V1 conservées** :
- `id`, `tenant_id`, `email`, `first_name`, `last_name`, `avatar_url`, `role` (TEXT V1)
- `metadata`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration status depuis metadata ou défaut 'active'
UPDATE adm_members
SET status = CASE
  WHEN metadata->>'status' = 'invited' THEN 'invited'::member_status
  WHEN metadata->>'status' = 'active' THEN 'active'::member_status
  WHEN metadata->>'status' = 'suspended' THEN 'suspended'::member_status
  WHEN email_verified_at IS NOT NULL THEN 'active'::member_status
  ELSE 'invited'::member_status
END
WHERE status = 'invited';

-- ACTION 2: Migration email_verified_at (membres > 7 jours = vérifiés)
UPDATE adm_members
SET email_verified_at = created_at + INTERVAL '1 hour'
WHERE email_verified_at IS NULL
AND created_at < NOW() - INTERVAL '7 days';

-- ACTION 3: Migration password_changed_at (défaut created_at)
UPDATE adm_members
SET password_changed_at = created_at
WHERE password_changed_at IS NULL;

-- ACTION 4: Inférence default_role_id depuis adm_member_roles
UPDATE adm_members m
SET default_role_id = (
  SELECT mr.role_id
  FROM adm_member_roles mr
  WHERE mr.member_id = m.id
  AND mr.is_primary = true
  LIMIT 1
)
WHERE default_role_id IS NULL;

-- ACTION 5: Migration preferred_language depuis metadata ou défaut 'en'
UPDATE adm_members
SET preferred_language = COALESCE(metadata->>'language', 'en')
WHERE preferred_language IS NULL;

-- ACTION 6: Initialisation notification_preferences (défaut email ON)
UPDATE adm_members
SET notification_preferences = '{"email":true,"push":false,"sms":false}'::JSONB
WHERE notification_preferences IS NULL;

-- ACTION 7: Migration two_factor_enabled depuis metadata
UPDATE adm_members
SET two_factor_enabled = (metadata->>'two_factor_enabled')::BOOLEAN
WHERE two_factor_enabled = false
AND metadata ? 'two_factor_enabled';
```

**Notes critiques** :
- ⚠️ **TABLE CONTIENT DONNÉES** (adm_members) - Validation obligatoire
- ⚠️ `status` enum ajouté avec défaut 'invited' → Vérifier migration correcte
- ⚠️ `email_verified_at` inféré pour anciens membres (> 7 jours)
- ⚠️ `default_role_id` inféré depuis `adm_member_roles.is_primary`
- ⚠️ `two_factor_secret` reste NULL jusqu'à configuration utilisateur

---

#### Table 3: `adm_roles`

**Colonnes V2 ajoutées** (8 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | slug | slug | VARCHAR(100) NOT NULL | Générer depuis name |
| 2 | parentRoleId | parent_role_id | UUID | NULL (hiérarchie à définir) |
| 3 | isSystem | is_system | BOOLEAN DEFAULT false | Marquer rôles super_admin/admin |
| 4 | isDefault | is_default | BOOLEAN DEFAULT false | Marquer rôle par défaut |
| 5 | maxMembers | max_members | INTEGER | NULL (pas de limite) |
| 6 | validFrom | valid_from | TIMESTAMPTZ(6) | NULL (toujours valide) |
| 7 | validUntil | valid_until | TIMESTAMPTZ(6) | NULL (pas d'expiration) |
| 8 | approvalRequired | approval_required | BOOLEAN DEFAULT false | Migration depuis metadata |

**Colonnes V1 conservées** :
- `id`, `tenant_id`, `name`, `description`, `permissions` (JSONB)
- `created_at`, `updated_at`, `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Génération slug depuis name (URL-friendly)
UPDATE adm_roles
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'), '-+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Gestion conflits slug (ajout suffix numérique si doublon)
WITH ranked_slugs AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM adm_roles
)
UPDATE adm_roles r
SET slug = rs.slug || '-' || rs.rn
FROM ranked_slugs rs
WHERE r.id = rs.id
AND rs.rn > 1;

-- ACTION 2: Marquage rôles système (super_admin, admin, member)
UPDATE adm_roles
SET is_system = true
WHERE LOWER(name) IN ('super admin', 'admin', 'member', 'owner', 'viewer')
OR LOWER(slug) IN ('super-admin', 'admin', 'member', 'owner', 'viewer');

-- ACTION 3: Marquage rôle par défaut (membre standard)
UPDATE adm_roles
SET is_default = true
WHERE LOWER(name) = 'member'
OR LOWER(slug) = 'member';

-- ACTION 4: Migration approval_required depuis metadata
UPDATE adm_roles
SET approval_required = (metadata->>'requires_approval')::BOOLEAN
WHERE approval_required = false
AND metadata ? 'requires_approval';
```

**Notes critiques** :
- ⚠️ **TABLE CONTIENT DONNÉES** (adm_roles) - Validation obligatoire
- ⚠️ `slug` généré automatiquement depuis `name` → Vérifier unicité
- ⚠️ Gestion conflits slug avec suffix numérique (-2, -3, etc.)
- ⚠️ `is_system` marque rôles intégrés (ne pas supprimer)
- ⚠️ `is_default` identifie rôle assigné par défaut aux nouveaux membres

---

#### Table 4: `adm_member_roles`

**Colonnes V2 ajoutées** (8 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | assignedBy | assigned_by | UUID | Inférer depuis created_by |
| 2 | assignmentReason | assignment_reason | TEXT | Migration depuis metadata |
| 3 | validFrom | valid_from | TIMESTAMPTZ(6) | Défaut created_at |
| 4 | validUntil | valid_until | TIMESTAMPTZ(6) | NULL (pas d'expiration) |
| 5 | isPrimary | is_primary | BOOLEAN DEFAULT false | Marquer premier rôle membre |
| 6 | scopeType | scope_type | scope_type | NULL (global par défaut) |
| 7 | scopeId | scope_id | UUID | NULL (global par défaut) |
| 8 | priority | priority | INTEGER DEFAULT 0 | 0 (pas de priorité) |

**Colonnes V1 conservées** :
- `id`, `member_id`, `role_id`, `tenant_id`
- `created_at`, `updated_at`, `created_by`, `updated_by`

**Actions Session 14** :

```sql
-- ACTION 1: Migration assigned_by depuis created_by
UPDATE adm_member_roles
SET assigned_by = created_by
WHERE assigned_by IS NULL
AND created_by IS NOT NULL;

-- ACTION 2: Migration valid_from depuis created_at
UPDATE adm_member_roles
SET valid_from = created_at
WHERE valid_from IS NULL;

-- ACTION 3: Marquage is_primary (premier rôle du membre)
WITH first_roles AS (
  SELECT DISTINCT ON (member_id) id
  FROM adm_member_roles
  ORDER BY member_id, created_at
)
UPDATE adm_member_roles mr
SET is_primary = true
FROM first_roles fr
WHERE mr.id = fr.id;

-- ACTION 4: Extraction assignment_reason depuis metadata
UPDATE adm_member_roles
SET assignment_reason = metadata->>'reason'
WHERE assignment_reason IS NULL
AND metadata ? 'reason';
```

**Notes critiques** :
- ⚠️ `is_primary` identifie le rôle principal du membre (ordre par created_at)
- ⚠️ `valid_from` initialisé depuis `created_at` (début validité)
- ⚠️ `scope_type`/`scope_id` NULL = portée globale (tout le tenant)

---

#### Table 5: `adm_audit_logs`

**Colonnes V2 ajoutées** (8 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | severity | severity | audit_severity DEFAULT 'info' | Inférer depuis action |
| 2 | category | category | audit_category DEFAULT 'operational' | Inférer depuis entity_type |
| 3 | sessionId | session_id | UUID | Migration depuis metadata |
| 4 | requestId | request_id | UUID | Migration depuis metadata |
| 5 | oldValues | old_values | JSONB | Migration depuis metadata |
| 6 | newValues | new_values | JSONB | Migration depuis metadata |
| 7 | retentionUntil | retention_until | TIMESTAMPTZ(6) | Calculer created_at + 7 ans |
| 8 | tags | tags | TEXT[] DEFAULT '{}' | Migration depuis metadata |

**Colonnes V1 conservées** :
- `id`, `tenant_id`, `actor_id`, `entity_type`, `entity_id`, `action`, `description`
- `ip_address`, `user_agent`, `metadata`
- `created_at`

**Actions Session 14** :

```sql
-- ACTION 1: Inférence severity depuis action
UPDATE adm_audit_logs
SET severity = CASE
  WHEN action IN ('delete', 'force_delete', 'revoke', 'suspend', 'block') THEN 'critical'::audit_severity
  WHEN action IN ('update', 'create', 'assign', 'grant') THEN 'info'::audit_severity
  WHEN action IN ('login', 'logout', 'view', 'read') THEN 'debug'::audit_severity
  WHEN action LIKE '%fail%' OR action LIKE '%error%' THEN 'error'::audit_severity
  ELSE 'info'::audit_severity
END
WHERE severity = 'info';

-- ACTION 2: Inférence category depuis entity_type
UPDATE adm_audit_logs
SET category = CASE
  WHEN entity_type IN ('tenant', 'member', 'role', 'permission') THEN 'access_control'::audit_category
  WHEN entity_type IN ('document', 'contract', 'invoice') THEN 'compliance'::audit_category
  WHEN entity_type IN ('vehicle', 'driver', 'ride') THEN 'operational'::audit_category
  WHEN entity_type IN ('payment', 'subscription', 'billing') THEN 'financial'::audit_category
  WHEN action IN ('login', 'logout', 'password_reset') THEN 'authentication'::audit_category
  ELSE 'operational'::audit_category
END
WHERE category = 'operational';

-- ACTION 3: Calcul retention_until (7 ans depuis created_at)
UPDATE adm_audit_logs
SET retention_until = created_at + INTERVAL '7 years'
WHERE retention_until IS NULL;

-- ACTION 4: Extraction old_values/new_values depuis metadata
UPDATE adm_audit_logs
SET
  old_values = metadata->'old_values',
  new_values = metadata->'new_values'
WHERE old_values IS NULL
AND metadata ? 'old_values';

-- ACTION 5: Extraction session_id/request_id depuis metadata
UPDATE adm_audit_logs
SET
  session_id = (metadata->>'session_id')::UUID,
  request_id = (metadata->>'request_id')::UUID
WHERE session_id IS NULL
AND metadata ? 'session_id';

-- ACTION 6: Extraction tags depuis metadata
UPDATE adm_audit_logs
SET tags = ARRAY(SELECT jsonb_array_elements_text(metadata->'tags'))
WHERE tags = '{}'
AND metadata ? 'tags';
```

**Notes critiques** :
- ⚠️ **TABLE CONTIENT DONNÉES** (adm_audit_logs) - Validation obligatoire
- ⚠️ `severity` inféré depuis type d'action (delete → critical, view → debug)
- ⚠️ `category` inféré depuis entity_type (tenant/member → access_control)
- ⚠️ `retention_until` fixé à 7 ans (conformité RGPD/audits)
- ⚠️ `old_values`/`new_values` permettent audit trail détaillé

---

### Module CRM (Session 4)

#### Table 1: `crm_leads`

**Colonnes V2 ajoutées** (18 colonnes totales)

| # | Colonne Prisma | Colonne SQL | Ligne SQL | Type SQL | Statut |
|---|----------------|-------------|-----------|----------|--------|
| 1 | leadCode | lead_code | 160-161 | VARCHAR(50) UNIQUE | ✅ |
| 2 | firstName | first_name | 163-166 | TEXT | ✅ |
| 3 | lastName | last_name | 168-171 | TEXT | ✅ |
| 4 | companyName | company_name | 173-176 | TEXT | ✅ |
| 5 | industry | industry | 178-181 | TEXT | ✅ |
| 6 | companySize | company_size | 183-186 | INTEGER | ✅ |
| 7 | websiteUrl | website_url | 188-191 | TEXT | ✅ |
| 8 | linkedinUrl | linkedin_url | 193-196 | TEXT | ✅ |
| 9 | city | city | 198-201 | TEXT | ✅ |
| 10 | leadStage | lead_stage | 203-206 | lead_stage | ✅ |
| 11 | fitScore | fit_score | 208-211 | DECIMAL(5,2) | ✅ |
| 12 | engagementScore | engagement_score | 213-216 | DECIMAL(5,2) | ✅ |
| 13 | scoring | scoring | 218-221 | JSONB | ✅ |
| 14 | gdprConsent | gdpr_consent | 223-226 | BOOLEAN | ✅ |
| 15 | consentAt | consent_at | 228-231 | TIMESTAMPTZ(6) | ✅ |
| 16 | sourceId | source_id | 233-236 | UUID | ✅ |
| 17 | opportunityId | opportunity_id | 238-241 | UUID | ✅ |
| 18 | nextActionDate | next_action_date | 243-246 | TIMESTAMPTZ(6) | ✅ |

**Colonnes V1 conservées** (Prisma lignes 100-153):
- `email`, `phone`, `message`, `source` (VARCHAR), `status` (VARCHAR V1, enum ajouté V2)
- `assigned_to`, `qualification_score`, `qualification_notes`, `qualified_date`, `converted_date`
- `utm_source`, `utm_medium`, `utm_campaign`, `country_code`
- `metadata`, `created_at`, `updated_at`, `created_by`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration full_name → first_name + last_name
UPDATE crm_leads
SET
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
WHERE full_name IS NOT NULL
  AND (first_name IS NULL OR last_name IS NULL);

-- ACTION 2: Migration status VARCHAR → lead_status enum
-- TODO: Mapping à définir selon valeurs V1 existantes
-- UPDATE crm_leads SET status = CAST(old_status_column AS lead_status) WHERE ...;

-- ACTION 3: Génération lead_code si NULL
UPDATE crm_leads
SET lead_code = 'LEAD-' || LPAD(id::TEXT, 8, '0')
WHERE lead_code IS NULL;
```

**Notes critiques** :
- ⚠️ `first_name`+`last_name` ajoutés SANS supprimer `full_name` V1 (stratégie additive)
- ⚠️ `status` enum ajouté SANS modifier `status` VARCHAR V1
- ⚠️ `source` VARCHAR V1 → `source_id` UUID V2 nécessite mapping via `crm_lead_sources`

---

#### Table 2: `crm_opportunities`

**Colonnes V2 ajoutées** (15 colonnes totales)

| # | Colonne Prisma | Colonne SQL | Ligne SQL | Type SQL | Statut |
|---|----------------|-------------|-----------|----------|--------|
| 1 | status | status | 263-267 | opportunity_status DEFAULT 'open' | ✅ |
| 2 | currency | currency | 269-272 | CHAR(3) DEFAULT 'EUR' | ✅ |
| 3 | discountAmount | discount_amount | 274-277 | DECIMAL(15,2) | ✅ |
| 4 | probabilityPercent | probability_percent | 279-282 | DECIMAL(5,2) DEFAULT 0 | ✅ |
| 5 | forecastValue | forecast_value | 285-287 | DECIMAL(15,2) | ✅ |
| 6 | wonValue | won_value | 289-292 | DECIMAL(15,2) | ✅ |
| 7 | expectedCloseDate | expected_close_date | 294-297 | DATE | ✅ |
| 8 | wonDate | won_date | 299-302 | DATE | ✅ |
| 9 | lostDate | lost_date | 304-307 | DATE | ✅ |
| 10 | ownerId | owner_id | 309-312 | UUID | ✅ |
| 11 | lossReasonId | loss_reason_id | 314-317 | UUID | ✅ |
| 12 | planId | plan_id | 319-322 | UUID | ✅ |
| 13 | contractId | contract_id | 324-327 | UUID | ✅ |
| 14 | pipelineId | pipeline_id | 329-332 | UUID | ✅ |
| 15 | notes | notes | 334-337 | TEXT | ✅ |

**Colonnes V1 conservées** (Prisma lignes 183-233):
- `lead_id`, `stage` (VARCHAR V1, enum ajouté V2), `expected_value`, `assigned_to`
- `metadata`, `created_at`, `updated_at`, `created_by`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration stage VARCHAR → opportunity_stage enum
-- TODO: Mapping à définir selon valeurs V1 existantes

-- ACTION 2: Calcul forecast_value (expected_value × probability_percent)
UPDATE crm_opportunities
SET
  forecast_value = expected_value * (probability_percent / 100.0),
  probability_percent = CASE
    WHEN stage = 'prospect' THEN 10
    WHEN stage = 'proposal' THEN 30
    WHEN stage = 'negotiation' THEN 60
    WHEN stage = 'closed' THEN 100
    ELSE 0
  END
WHERE forecast_value IS NULL OR probability_percent IS NULL;

-- ACTION 3: Migration owner_id depuis assigned_to si applicable
UPDATE crm_opportunities
SET owner_id = assigned_to
WHERE owner_id IS NULL AND assigned_to IS NOT NULL;
```

**Notes critiques** :
- ⚠️ `status` enum ajouté SANS supprimer `stage` VARCHAR V1
- ⚠️ `expected_value` V1 maintenu, `forecast_value` V2 calculé
- ⚠️ `assigned_to` et `owner_id` coexistent (owner = responsable final, assigned = assigné temporaire)

---

#### Table 3: `crm_contracts`

**Colonnes V2 ajoutées** (20 colonnes totales)

| # | Colonne Prisma | Colonne SQL | Ligne SQL | Type SQL | Statut |
|---|----------------|-------------|-----------|----------|--------|
| 1 | contractCode | contract_code | 347-348 | VARCHAR(50) UNIQUE | ✅ |
| 2 | leadId | lead_id | 350-353 | UUID | ✅ |
| 3 | signatureDate | signature_date | 355-358 | DATE | ✅ |
| 4 | expirationDate | expiration_date | 360-363 | DATE | ✅ |
| 5 | vatRate | vat_rate | 365-368 | DECIMAL(5,2) DEFAULT 20.00 | ✅ |
| 6 | renewalType | renewal_type | 370-373 | renewal_type | ✅ |
| 7 | autoRenew | auto_renew | 375-378 | BOOLEAN DEFAULT false | ✅ |
| 8 | renewalDate | renewal_date | 380-383 | DATE | ✅ |
| 9 | noticePeriodDays | notice_period_days | 385-388 | INTEGER DEFAULT 30 | ✅ |
| 10 | renewedFromContractId | renewed_from_contract_id | 390-393 | UUID | ✅ |
| 11 | tenantId | tenant_id | 395-398 | UUID | ✅ |
| 12 | planId | plan_id | 400-403 | UUID | ✅ |
| 13 | subscriptionId | subscription_id | 405-408 | UUID | ✅ |
| 14 | companyName | company_name | 410-413 | TEXT | ✅ |
| 15 | contactName | contact_name | 415-418 | TEXT | ✅ |
| 16 | contactEmail | contact_email | 420-423 | TEXT | ✅ |
| 17 | contactPhone | contact_phone | 425-428 | TEXT | ✅ |
| 18 | billingAddressId | billing_address_id | 430-433 | UUID | ✅ |
| 19 | versionNumber | version_number | 435-438 | INTEGER DEFAULT 1 | ✅ |
| 20 | documentUrl | document_url | 440-443 | TEXT | ✅ |
| 21 | notes | notes | 445-448 | TEXT | ✅ |
| 22 | approvedBy | approved_by | 450-453 | UUID | ✅ |

**Colonnes V1 conservées** :
- `opportunity_id`, `start_date`, `end_date`, `total_amount`, `status` (VARCHAR V1, enum ajouté V2)
- `reference`, `signed`, `signed_date`, `renewed`
- `metadata`, `created_at`, `updated_at`, `created_by`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Génération contract_code si NULL
UPDATE crm_contracts
SET contract_code = 'CTR-' || LPAD(id::TEXT, 8, '0')
WHERE contract_code IS NULL;

-- ACTION 2: Migration dates V1 → V2
UPDATE crm_contracts
SET
  signature_date = signed_date,
  expiration_date = end_date
WHERE signature_date IS NULL OR expiration_date IS NULL;

-- ACTION 3: Migration status VARCHAR → contract_status enum
-- TODO: Mapping à définir selon valeurs V1 existantes

-- ACTION 4: Migration signed boolean → signature_date
UPDATE crm_contracts
SET signature_date = signed_date
WHERE signed = true AND signature_date IS NULL;

-- ACTION 5: Calcul vat_rate par défaut selon pays (si tenant_id existe)
UPDATE crm_contracts c
SET vat_rate = CASE
  WHEN t.country_code = 'FR' THEN 20.00
  WHEN t.country_code IN ('BE', 'NL', 'LU') THEN 21.00
  WHEN t.country_code = 'DE' THEN 19.00
  ELSE 20.00
END
FROM adm_tenants t
WHERE c.tenant_id = t.id AND c.vat_rate IS NULL;
```

**Notes critiques** :
- ⚠️ `start_date`/`end_date` V1 maintenus, `signature_date`/`expiration_date` V2 ajoutés
- ⚠️ `signed` boolean V1 maintenu, `signature_date` DATE V2 ajouté
- ⚠️ `status` VARCHAR V1 maintenu, `contract_status` enum V2 ajouté
- ⚠️ `reference` VARCHAR V1 maintenu, `contract_code` VARCHAR V2 ajouté (UNIQUE)

---

### Module DOC (Session 3)

#### Table 1: `doc_documents`

**Colonnes V2 ajoutées** (18 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | documentCode | document_code | VARCHAR(50) UNIQUE | Générer code si NULL |
| 2 | category | category | TEXT | Migration depuis metadata |
| 3 | tags | tags | TEXT[] | Migration depuis metadata |
| 4 | entityTypeId | entity_type_id | UUID | Mapping via doc_entity_types |
| 5 | entityId | entity_id | UUID | Selon entity_type |
| 6 | s3Key | s3_key | TEXT | Migration cloud_url → s3_key |
| 7 | gcsBucket | gcs_bucket | TEXT | Si GCS utilisé |
| 8 | gcsPath | gcs_path | TEXT | Si GCS utilisé |
| 9 | azureContainer | azure_container | TEXT | Si Azure utilisé |
| 10 | azureBlobName | azure_blob_name | TEXT | Si Azure utilisé |
| 11 | checksumMd5 | checksum_md5 | VARCHAR(32) | Calcul MD5 fichiers |
| 12 | checksumSha256 | checksum_sha256 | VARCHAR(64) | Calcul SHA256 fichiers |
| 13 | virusScanStatus | virus_scan_status | scan_status | À implémenter |
| 14 | virusScanDate | virus_scan_date | TIMESTAMPTZ(6) | À implémenter |
| 15 | verificationStatus | verification_status | verification_status | Workflow validation |
| 16 | verifiedBy | verified_by | UUID | Workflow validation |
| 17 | verifiedAt | verified_at | TIMESTAMPTZ(6) | Workflow validation |
| 18 | indexedContent | indexed_content | TEXT | Extraction texte OCR/PDF |

**Actions Session 14** :

```sql
-- ACTION 1: Génération document_code si NULL
UPDATE doc_documents
SET document_code = 'DOC-' || LPAD(id::TEXT, 8, '0')
WHERE document_code IS NULL;

-- ACTION 2: Migration cloud_url → s3_key (si AWS S3)
UPDATE doc_documents
SET s3_key = SUBSTRING(cloud_url FROM 's3://[^/]+/(.+)')
WHERE cloud_url LIKE 's3://%' AND s3_key IS NULL;

-- ACTION 3: Extraction tags depuis metadata JSONB
UPDATE doc_documents
SET tags = ARRAY(SELECT jsonb_array_elements_text(metadata->'tags'))
WHERE metadata ? 'tags' AND tags IS NULL;

-- ACTION 4: Migration verified boolean → verification_status enum
UPDATE doc_documents
SET verification_status = CASE
  WHEN verified = true THEN 'verified'::verification_status
  ELSE 'pending'::verification_status
END
WHERE verification_status IS NULL;
```

---

### Module DIR (Session 2)

#### Table 1: `dir_car_makes`

**Colonnes V2 ajoutées** (13 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | makeCode | make_code | VARCHAR(20) UNIQUE | Générer code ISO |
| 2 | logoUrl | logo_url | TEXT | Upload logos constructeurs |
| 3 | countryOrigin | country_origin | CHAR(2) | Mapping ISO 3166-1 |
| 4 | foundedYear | founded_year | INTEGER | Données historiques |
| 5 | headquartersCity | headquarters_city | TEXT | Données géographiques |
| 6 | isActive | is_active | BOOLEAN DEFAULT true | Statut constructeur |
| 7 | websiteUrl | website_url | TEXT | URL officielle |
| 8 | displayOrder | display_order | INTEGER | Ordre affichage UI |
| 9 | popularityScore | popularity_score | DECIMAL(5,2) | Calcul depuis stats |
| 10 | seoSlug | seo_slug | VARCHAR(100) UNIQUE | Génération URL-friendly |
| 11 | metadata | metadata | JSONB | Données additionnelles |
| 12 | createdBy | created_by | UUID | Audit trail |
| 13 | updatedBy | updated_by | UUID | Audit trail |

**Actions Session 14** :

```sql
-- ACTION 1: Génération make_code depuis name
UPDATE dir_car_makes
SET make_code = UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 1, 3))
WHERE make_code IS NULL;

-- ACTION 2: Génération seo_slug depuis name
UPDATE dir_car_makes
SET seo_slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'), '-+', '-', 'g'))
WHERE seo_slug IS NULL;

-- ACTION 3: Mapping pays d'origine (données statiques)
-- TODO: Insérer mappings depuis CSV/JSON de référence

-- ACTION 4: Calcul popularity_score depuis statistiques véhicules
UPDATE dir_car_makes m
SET popularity_score = (
  SELECT COUNT(*)::DECIMAL(5,2) / NULLIF((SELECT COUNT(*) FROM vhc_vehicles), 0) * 100
  FROM vhc_vehicles v
  WHERE v.make_id = m.id
)
WHERE popularity_score IS NULL;
```

---

### Module BIL (Session 5)

#### Table 1: `bil_billing_plans`

**Colonnes V2 ajoutées** (13 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | planCode | plan_code | VARCHAR(100) UNIQUE | Générer code si NULL |
| 2 | priceMonthly | price_monthly | DECIMAL(18,2) | Migration depuis monthly_fee |
| 3 | priceYearly | price_yearly | DECIMAL(18,2) | Migration depuis annual_fee |
| 4 | vatRate | vat_rate | DECIMAL(5,2) | Taux TVA défaut |
| 5 | maxVehicles | max_vehicles | INTEGER | NULL = illimité |
| 6 | maxDrivers | max_drivers | INTEGER | NULL = illimité |
| 7 | maxUsers | max_users | INTEGER | NULL = illimité |
| 8 | version | version | INTEGER DEFAULT 1 | Versioning plans |
| 9 | stripePriceIdMonthly | stripe_price_id_monthly | TEXT | ID Stripe mensuel |
| 10 | stripePriceIdYearly | stripe_price_id_yearly | TEXT | ID Stripe annuel |
| 11 | billingInterval | billing_interval | billing_interval | Cycle défaut |
| 12 | status (V2) | status_v2 | billing_plan_status | Migration depuis status TEXT |

**Colonnes V1 conservées** :
- `plan_name`, `description`, `monthly_fee`, `annual_fee`, `currency`, `features` (JSONB)
- `status` (TEXT V1 maintenu), `metadata`, `created_at`, `created_by`, `updated_at`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Génération plan_code si NULL
UPDATE bil_billing_plans
SET plan_code = LOWER(REGEXP_REPLACE(plan_name, '[^a-zA-Z0-9]', '-', 'g')) || '-v' || version
WHERE plan_code IS NULL;

-- ACTION 2: Migration monthly_fee → price_monthly
UPDATE bil_billing_plans
SET price_monthly = monthly_fee
WHERE price_monthly IS NULL AND monthly_fee IS NOT NULL;

-- ACTION 3: Migration annual_fee → price_yearly
UPDATE bil_billing_plans
SET price_yearly = annual_fee
WHERE price_yearly IS NULL AND annual_fee IS NOT NULL;

-- ACTION 4: Migration status TEXT → status_v2 enum
UPDATE bil_billing_plans
SET status_v2 = CASE
  WHEN LOWER(status) = 'draft' THEN 'draft'::billing_plan_status
  WHEN LOWER(status) IN ('active', 'published') THEN 'active'::billing_plan_status
  WHEN LOWER(status) = 'deprecated' THEN 'deprecated'::billing_plan_status
  WHEN LOWER(status) IN ('archived', 'inactive') THEN 'archived'::billing_plan_status
  ELSE 'active'::billing_plan_status
END
WHERE status_v2 IS NULL;
```

**Notes critiques** :
- ⚠️ `monthly_fee`/`annual_fee` V1 maintenus, `price_monthly`/`price_yearly` V2 ajoutés
- ⚠️ `status` TEXT V1 maintenu, `status_v2` enum ajouté
- ✅ Audit trail via `adm_provider_employees` (plans globaux FleetCore)

---

#### Table 2: `bil_tenant_subscriptions`

**Colonnes V2 ajoutées** (13 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | previousPlanId | previous_plan_id | UUID | Tracking upgrades/downgrades |
| 2 | planVersion | plan_version | INTEGER | Fige tarif souscription |
| 3 | paymentMethodId | payment_method_id | UUID | Moyen paiement défaut |
| 4 | billingCycle | billing_cycle | billing_interval | Cycle effectif |
| 5 | currentPeriodStart | current_period_start | TIMESTAMPTZ(6) | Début période courante |
| 6 | currentPeriodEnd | current_period_end | TIMESTAMPTZ(6) | Fin période courante |
| 7 | trialEnd | trial_end | TIMESTAMPTZ(6) | Fin trial |
| 8 | status (V2) | status_v2 | subscription_status | Migration depuis status TEXT |
| 9 | cancelAtPeriodEnd | cancel_at_period_end | BOOLEAN DEFAULT true | Annulation différée |
| 10 | autoRenew | auto_renew | BOOLEAN DEFAULT true | Renouvellement auto |
| 11 | provider | provider | VARCHAR(50) | PSP utilisé |
| 12 | providerSubscriptionId | provider_subscription_id | TEXT | ID PSP |
| 13 | providerCustomerId | provider_customer_id | TEXT | ID client PSP |

**Colonnes V1 conservées** :
- `tenant_id`, `plan_id`, `subscription_start`, `subscription_end`
- `status` (TEXT V1 maintenu), `metadata`, `created_at`, `created_by`, `updated_at`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration subscription_start → current_period_start
UPDATE bil_tenant_subscriptions
SET current_period_start = subscription_start
WHERE current_period_start IS NULL AND subscription_start IS NOT NULL;

-- ACTION 2: Migration subscription_end → current_period_end
UPDATE bil_tenant_subscriptions
SET current_period_end = subscription_end
WHERE current_period_end IS NULL AND subscription_end IS NOT NULL;

-- ACTION 3: Migration status TEXT → status_v2 enum
UPDATE bil_tenant_subscriptions
SET status_v2 = CASE
  WHEN LOWER(status) = 'trialing' THEN 'trialing'::subscription_status
  WHEN LOWER(status) IN ('active', 'current') THEN 'active'::subscription_status
  WHEN LOWER(status) = 'past_due' THEN 'past_due'::subscription_status
  WHEN LOWER(status) IN ('suspended', 'paused') THEN 'suspended'::subscription_status
  WHEN LOWER(status) = 'cancelling' THEN 'cancelling'::subscription_status
  WHEN LOWER(status) IN ('cancelled', 'canceled') THEN 'cancelled'::subscription_status
  WHEN LOWER(status) IN ('inactive', 'expired') THEN 'inactive'::subscription_status
  ELSE 'active'::subscription_status
END
WHERE status_v2 IS NULL;

-- ACTION 4: Récupérer plan_version depuis plan actuel
UPDATE bil_tenant_subscriptions s
SET plan_version = p.version
FROM bil_billing_plans p
WHERE s.plan_id = p.id AND s.plan_version IS NULL;
```

**Notes critiques** :
- ⚠️ `subscription_start`/`subscription_end` V1 maintenus, `current_period_start`/`current_period_end` V2 ajoutés
- ⚠️ `status` TEXT V1 maintenu, `status_v2` enum ajouté
- ⚠️ `created_by`/`updated_by`/`deleted_by` V1 maintenus (mais pas dans Prisma V2)

---

#### Table 3: `bil_tenant_usage_metrics`

**Colonnes V2 ajoutées** (7 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | metricTypeId | metric_type_id | UUID | FK vers bil_usage_metric_types |
| 2 | subscriptionId | subscription_id | UUID | Lien abonnement |
| 3 | planVersion | plan_version | INTEGER | Version plan période |
| 4 | periodType | period_type | period_type | Granularité (day/week/month) |
| 5 | periodStartTs | period_start_ts | TIMESTAMPTZ(6) | Début précis |
| 6 | periodEndTs | period_end_ts | TIMESTAMPTZ(6) | Fin précise |
| 7 | metricSource | metric_source | metric_source | Traçabilité |

**Colonnes V1 conservées** :
- `tenant_id`, `metric_name` (TEXT), `metric_value`, `period_start`, `period_end`
- `metadata`, `created_at`, `created_by`, `updated_at`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Créer types métriques standards dans bil_usage_metric_types
INSERT INTO bil_usage_metric_types (name, unit, description, aggregation_method)
VALUES
  ('active_vehicles', 'count', 'Nombre de véhicules actifs', 'last'),
  ('active_drivers', 'count', 'Nombre de conducteurs actifs', 'last'),
  ('total_trips', 'count', 'Nombre total de trajets', 'sum'),
  ('total_revenue', 'AED', 'Revenu total', 'sum'),
  ('api_calls', 'calls', 'Appels API', 'sum')
ON CONFLICT (name) DO NOTHING;

-- ACTION 2: Migration metric_name TEXT → metric_type_id UUID
UPDATE bil_tenant_usage_metrics m
SET metric_type_id = t.id
FROM bil_usage_metric_types t
WHERE LOWER(m.metric_name) = LOWER(t.name)
AND m.metric_type_id IS NULL;

-- ACTION 3: Migration period_start → period_start_ts
UPDATE bil_tenant_usage_metrics
SET period_start_ts = period_start
WHERE period_start_ts IS NULL AND period_start IS NOT NULL;

-- ACTION 4: Migration period_end → period_end_ts
UPDATE bil_tenant_usage_metrics
SET period_end_ts = period_end
WHERE period_end_ts IS NULL AND period_end IS NOT NULL;

-- ACTION 5: Déduction period_type depuis période
UPDATE bil_tenant_usage_metrics
SET period_type = CASE
  WHEN EXTRACT(EPOCH FROM (period_end_ts - period_start_ts)) <= 86400 THEN 'day'::period_type
  WHEN EXTRACT(EPOCH FROM (period_end_ts - period_start_ts)) <= 604800 THEN 'week'::period_type
  ELSE 'month'::period_type
END
WHERE period_type IS NULL AND period_start_ts IS NOT NULL AND period_end_ts IS NOT NULL;
```

**Notes critiques** :
- ⚠️ `metric_name` TEXT V1 maintenu, `metric_type_id` UUID V2 ajouté (normalisation progressive)
- ⚠️ `period_start`/`period_end` V1 maintenus, `period_start_ts`/`period_end_ts` V2 ajoutés
- ⚠️ Nécessite création manuelle types métriques standards dans `bil_usage_metric_types`

---

#### Table 4: `bil_tenant_invoices`

**Colonnes V2 ajoutées** (11 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | subscriptionId | subscription_id | UUID | Lien abonnement |
| 2 | periodStart | period_start | TIMESTAMPTZ(6) | Début période facturée |
| 3 | periodEnd | period_end | TIMESTAMPTZ(6) | Fin période facturée |
| 4 | paidAt | paid_at | TIMESTAMPTZ(6) | Date paiement |
| 5 | subtotal | subtotal | DECIMAL(18,2) | Montant HT |
| 6 | taxRate | tax_rate | DECIMAL(5,2) | Taux TVA |
| 7 | taxAmount | tax_amount | DECIMAL(18,2) | Montant TVA |
| 8 | amountPaid | amount_paid | DECIMAL(18,2) DEFAULT 0 | Montant payé |
| 9 | amountDue | amount_due | DECIMAL(18,2) DEFAULT 0 | Montant dû |
| 10 | status (V2) | status_v2 | invoice_status | Migration depuis status TEXT |
| 11 | stripeInvoiceId | stripe_invoice_id | VARCHAR(255) | ID Stripe |
| 12 | documentUrl | document_url | TEXT | URL PDF |

**Colonnes V1 conservées** :
- `tenant_id`, `invoice_number`, `invoice_date`, `due_date`, `total_amount`, `currency`
- `status` (TEXT V1 maintenu), `metadata`, `created_at`, `created_by`, `updated_at`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration status TEXT → status_v2 enum
UPDATE bil_tenant_invoices
SET status_v2 = CASE
  WHEN LOWER(status) = 'draft' THEN 'draft'::invoice_status
  WHEN LOWER(status) IN ('sent', 'open') THEN 'sent'::invoice_status
  WHEN LOWER(status) = 'paid' THEN 'paid'::invoice_status
  WHEN LOWER(status) IN ('overdue', 'late') THEN 'overdue'::invoice_status
  WHEN LOWER(status) IN ('void', 'voided', 'cancelled') THEN 'void'::invoice_status
  WHEN LOWER(status) = 'uncollectible' THEN 'uncollectible'::invoice_status
  ELSE 'sent'::invoice_status
END
WHERE status_v2 IS NULL;

-- ACTION 2: Calcul subtotal depuis total_amount (estimation HT)
-- Note: subtotal et tax_rate doivent venir de configuration tenant (pas de hardcode)
-- Les taux de TVA varient: France 20%, UAE 5%, Canada 13%, USA varie par état, etc.

-- ACTION 2: Calcul amount_due (si pas payé)
UPDATE bil_tenant_invoices
SET amount_due = total_amount - COALESCE(amount_paid, 0)
WHERE amount_due = 0 AND status_v2 != 'paid';
```

**Notes critiques** :
- ⚠️ `total_amount` V1 maintenu, `subtotal`/`tax_amount`/`amount_paid`/`amount_due` V2 ajoutés
- ⚠️ `status` TEXT V1 maintenu, `status_v2` enum ajouté
- ⚠️ Calcul subtotal est estimation (TVA à ajuster selon pays tenant)

---

#### Table 5: `bil_tenant_invoice_lines`

**Colonnes V2 ajoutées** (7 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | lineType | line_type | invoice_line_type | Classification ligne |
| 2 | unitPrice | unit_price | DECIMAL(18,2) | Prix unitaire |
| 3 | taxRate | tax_rate | DECIMAL(5,2) | TVA ligne |
| 4 | taxAmount | tax_amount | DECIMAL(18,2) | Montant TVA |
| 5 | discountAmount | discount_amount | DECIMAL(18,2) | Remise ligne |
| 6 | sourceType | source_type | invoice_line_source_type | Type source |
| 7 | sourceId | source_id | UUID | ID source |

**Colonnes V1 conservées** :
- `invoice_id`, `description`, `amount`, `quantity`, `metadata`
- `created_at`, `created_by`, `updated_at`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Calcul unit_price depuis amount/quantity
UPDATE bil_tenant_invoice_lines
SET unit_price = amount / NULLIF(quantity, 0)
WHERE unit_price IS NULL AND quantity > 0;

-- ACTION 2: Déduction line_type depuis description
UPDATE bil_tenant_invoice_lines
SET line_type = CASE
  WHEN LOWER(description) LIKE '%plan%' OR LOWER(description) LIKE '%subscription%' THEN 'plan_fee'::invoice_line_type
  WHEN LOWER(description) LIKE '%overage%' OR LOWER(description) LIKE '%dépassement%' THEN 'overage_fee'::invoice_line_type
  WHEN LOWER(description) LIKE '%tax%' OR LOWER(description) LIKE '%tva%' THEN 'tax'::invoice_line_type
  WHEN LOWER(description) LIKE '%discount%' OR LOWER(description) LIKE '%remise%' THEN 'discount'::invoice_line_type
  ELSE 'other'::invoice_line_type
END
WHERE line_type IS NULL;
```

**Notes critiques** :
- ⚠️ `amount` V1 maintenu, `unit_price` V2 ajouté
- ⚠️ `line_type` déduit depuis description (peut nécessiter ajustements manuels)

---

#### Table 6: `bil_payment_methods`

**Colonnes V2 ajoutées** (13 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | provider | provider | VARCHAR(50) | PSP (stripe, adyen, etc.) |
| 2 | providerPaymentMethodId | provider_payment_method_id | TEXT | ID méthode PSP |
| 3 | paymentType (V2) | payment_type_v2 | payment_type | Migration depuis payment_type TEXT |
| 4 | cardBrand | card_brand | VARCHAR(50) | Marque carte |
| 5 | cardLast4 | card_last4 | CHAR(4) | 4 derniers chiffres |
| 6 | cardExpMonth | card_exp_month | INTEGER | Mois expiration |
| 7 | cardExpYear | card_exp_year | INTEGER | Année expiration |
| 8 | bankName | bank_name | VARCHAR(100) | Nom banque |
| 9 | bankAccountLast4 | bank_account_last4 | CHAR(4) | 4 derniers chiffres compte |
| 10 | bankCountry | bank_country | CHAR(2) | Pays compte |
| 11 | status (V2) | status_v2 | payment_method_status | Migration depuis status TEXT |
| 12 | isDefault | is_default | BOOLEAN DEFAULT false | Méthode défaut |
| 13 | lastUsedAt | last_used_at | TIMESTAMPTZ(6) | Dernière utilisation |

**Colonnes V1 conservées** :
- `tenant_id`, `payment_type` (TEXT V1), `provider_token`, `expires_at`, `status` (TEXT V1)
- `metadata`, `created_at`, `created_by`, `updated_at`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration provider_token → provider_payment_method_id
UPDATE bil_payment_methods
SET provider_payment_method_id = provider_token
WHERE provider_payment_method_id IS NULL AND provider_token IS NOT NULL;

-- ACTION 2: Migration payment_type TEXT → payment_type_v2 enum
UPDATE bil_payment_methods
SET payment_type_v2 = CASE
  WHEN LOWER(payment_type) IN ('card', 'credit_card', 'debit_card') THEN 'card'::payment_type
  WHEN LOWER(payment_type) IN ('bank', 'bank_account', 'sepa') THEN 'bank_account'::payment_type
  WHEN LOWER(payment_type) = 'paypal' THEN 'paypal'::payment_type
  WHEN LOWER(payment_type) = 'apple_pay' THEN 'apple_pay'::payment_type
  WHEN LOWER(payment_type) = 'google_pay' THEN 'google_pay'::payment_type
  ELSE 'other'::payment_type
END
WHERE payment_type_v2 IS NULL;

-- ACTION 3: Migration status TEXT → status_v2 enum
UPDATE bil_payment_methods
SET status_v2 = CASE
  WHEN LOWER(status) IN ('active', 'valid') THEN 'active'::payment_method_status
  WHEN LOWER(status) IN ('inactive', 'disabled') THEN 'inactive'::payment_method_status
  WHEN LOWER(status) = 'expired' THEN 'expired'::payment_method_status
  WHEN LOWER(status) IN ('failed', 'invalid') THEN 'failed'::payment_method_status
  WHEN LOWER(status) = 'pending_verification' THEN 'pending_verification'::payment_method_status
  ELSE 'active'::payment_method_status
END
WHERE status_v2 IS NULL;

-- ACTION 4: Extraction card_last4 depuis metadata (si Stripe)
UPDATE bil_payment_methods
SET card_last4 = (metadata->>'last4')::CHAR(4)
WHERE card_last4 IS NULL
AND payment_type_v2 = 'card'
AND metadata ? 'last4';
```

**Notes critiques** :
- ⚠️ `payment_type` TEXT V1 maintenu, `payment_type_v2` enum ajouté
- ⚠️ `provider_token` V1 maintenu, `provider_payment_method_id` V2 ajouté
- ⚠️ `status` TEXT V1 maintenu, `status_v2` enum ajouté
- ⚠️ Extraction détails carte depuis metadata si disponible

---

### Module SUP (Session 6)

#### Table 1: `sup_tickets`

**Colonnes V2 ajoutées** (11 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | category | category | VARCHAR(100) | Migration depuis metadata si disponible |
| 2 | subCategory | sub_category | VARCHAR(100) | Migration depuis metadata si disponible |
| 3 | language | language | VARCHAR(10) | Détection auto ou défaut 'en' |
| 4 | sourcePlatform | source_platform | ticket_source_platform DEFAULT 'web' | Migration depuis metadata ou 'web' |
| 5 | raisedByType | raised_by_type | ticket_raised_by_type DEFAULT 'member' | Inférer depuis raised_by FK |
| 6 | attachmentsUrl | attachments_url | TEXT[] DEFAULT '{}' | Extraction depuis metadata |
| 7 | resolutionNotes | resolution_notes | TEXT | Migration depuis metadata si disponible |
| 8 | slaDueAt | sla_due_at | TIMESTAMPTZ | Calculer depuis created_at + SLA |
| 9 | closedAt | closed_at | TIMESTAMPTZ | Migration si status='closed' |
| 10 | statusV2 | status_v2 | ticket_status DEFAULT 'new' | Migration depuis status TEXT V1 |
| 11 | priorityV2 | priority_v2 | ticket_priority DEFAULT 'medium' | Migration depuis priority TEXT V1 |

**Colonnes V1 conservées** :
- `id`, `tenant_id`, `raised_by`, `subject`, `description`
- `status` (TEXT V1, maintenu), `priority` (TEXT V1, maintenu)
- `assigned_to`, `metadata`
- `created_at`, `created_by`, `updated_at`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration status TEXT → status_v2 enum
UPDATE sup_tickets
SET status_v2 = CASE
  WHEN LOWER(status) IN ('new', 'nouveau') THEN 'new'::ticket_status
  WHEN LOWER(status) IN ('open', 'ouvert', 'en cours') THEN 'open'::ticket_status
  WHEN LOWER(status) IN ('waiting_client', 'attente client') THEN 'waiting_client'::ticket_status
  WHEN LOWER(status) IN ('waiting_internal', 'attente interne') THEN 'waiting_internal'::ticket_status
  WHEN LOWER(status) IN ('resolved', 'résolu') THEN 'resolved'::ticket_status
  WHEN LOWER(status) IN ('closed', 'fermé') THEN 'closed'::ticket_status
  ELSE 'open'::ticket_status
END
WHERE status_v2 IS NULL OR status_v2 = 'new';

-- ACTION 2: Migration priority TEXT → priority_v2 enum
UPDATE sup_tickets
SET priority_v2 = CASE
  WHEN LOWER(priority) IN ('low', 'basse', 'faible') THEN 'low'::ticket_priority
  WHEN LOWER(priority) IN ('medium', 'moyenne', 'normal') THEN 'medium'::ticket_priority
  WHEN LOWER(priority) IN ('high', 'haute', 'élevée') THEN 'high'::ticket_priority
  WHEN LOWER(priority) IN ('critical', 'critique', 'urgent') THEN 'critical'::ticket_priority
  ELSE 'medium'::ticket_priority
END
WHERE priority_v2 IS NULL OR priority_v2 = 'medium';

-- ACTION 3: Inférence raised_by_type depuis FK raised_by
UPDATE sup_tickets t
SET raised_by_type = CASE
  WHEN m.role = 'admin' THEN 'admin'::ticket_raised_by_type
  WHEN m.role = 'driver' THEN 'driver'::ticket_raised_by_type
  WHEN m.role = 'client' THEN 'client'::ticket_raised_by_type
  ELSE 'member'::ticket_raised_by_type
END
FROM adm_members m
WHERE t.raised_by = m.id
AND t.raised_by_type = 'member';

-- ACTION 4: Calcul SLA due date (exemple: 24h pour high, 48h pour medium)
UPDATE sup_tickets
SET sla_due_at = CASE
  WHEN priority_v2 = 'critical' THEN created_at + INTERVAL '4 hours'
  WHEN priority_v2 = 'high' THEN created_at + INTERVAL '24 hours'
  WHEN priority_v2 = 'medium' THEN created_at + INTERVAL '48 hours'
  ELSE created_at + INTERVAL '72 hours'
END
WHERE sla_due_at IS NULL;

-- ACTION 5: Migration closed_at pour tickets fermés
UPDATE sup_tickets
SET closed_at = updated_at
WHERE status_v2 = 'closed'
AND closed_at IS NULL;

-- ACTION 6: Extraction category depuis metadata
UPDATE sup_tickets
SET category = metadata->>'category'
WHERE category IS NULL
AND metadata ? 'category';

-- ACTION 7: Extraction attachments_url depuis metadata
UPDATE sup_tickets
SET attachments_url = ARRAY(SELECT jsonb_array_elements_text(metadata->'attachments'))
WHERE attachments_url = '{}'
AND metadata ? 'attachments';
```

**Notes critiques** :
- ⚠️ `status` TEXT V1 maintenu, `status_v2` enum ajouté (coexistence V1/V2)
- ⚠️ `priority` TEXT V1 maintenu, `priority_v2` enum ajouté (coexistence V1/V2)
- ⚠️ `raised_by_type` inféré depuis `adm_members.role`
- ⚠️ SLA calculé avec règles simples, affiner avec `sup_ticket_sla_rules` si disponible

---

#### Table 2: `sup_ticket_messages`

**Colonnes V2 ajoutées** (9 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | messageType | message_type | message_type DEFAULT 'public' | Migration depuis metadata ou 'public' |
| 2 | parentMessageId | parent_message_id | UUID | NULL (threading futur) |
| 3 | attachmentUrl | attachment_url | TEXT | Extraction depuis metadata |
| 4 | attachmentType | attachment_type | VARCHAR(50) | Inférer depuis URL extension |
| 5 | language | language | VARCHAR(10) | Détection auto ou défaut 'en' |
| 6 | sentimentScore | sentiment_score | FLOAT | NULL (analyse IA future) |
| 7 | isAutomated | is_automated | BOOLEAN DEFAULT false | Migration depuis metadata |
| 8 | aiSuggestions | ai_suggestions | JSONB | NULL (feature IA future) |
| 9 | translation | translation | JSONB | NULL (feature multilingue future) |

**Colonnes V1 conservées** :
- `id`, `ticket_id`, `sender_id`, `message_body`, `sent_at`
- `metadata`
- `created_at`, `created_by`, `updated_at`, `updated_by`
- `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration message_type depuis metadata
UPDATE sup_ticket_messages
SET message_type = CASE
  WHEN metadata->>'visibility' = 'internal' THEN 'internal'::message_type
  WHEN metadata->>'visibility' = 'note' THEN 'note'::message_type
  WHEN metadata->>'is_internal' = 'true' THEN 'internal'::message_type
  ELSE 'public'::message_type
END
WHERE message_type = 'public'
AND metadata IS NOT NULL;

-- ACTION 2: Extraction attachment_url depuis metadata
UPDATE sup_ticket_messages
SET attachment_url = metadata->>'attachment_url'
WHERE attachment_url IS NULL
AND metadata ? 'attachment_url';

-- ACTION 3: Inférence attachment_type depuis extension
UPDATE sup_ticket_messages
SET attachment_type = CASE
  WHEN attachment_url ~* '\.(jpg|jpeg|png|gif|bmp|webp)$' THEN 'image'
  WHEN attachment_url ~* '\.(pdf)$' THEN 'pdf'
  WHEN attachment_url ~* '\.(doc|docx)$' THEN 'document'
  WHEN attachment_url ~* '\.(mp4|mov|avi|webm)$' THEN 'video'
  WHEN attachment_url ~* '\.(mp3|wav|ogg)$' THEN 'audio'
  ELSE 'other'
END
WHERE attachment_url IS NOT NULL
AND attachment_type IS NULL;

-- ACTION 4: Migration is_automated depuis metadata
UPDATE sup_ticket_messages
SET is_automated = (metadata->>'is_automated')::BOOLEAN
WHERE is_automated = false
AND metadata ? 'is_automated';
```

**Notes critiques** :
- ⚠️ `message_type` initialisé à 'public' par défaut, affiner selon metadata V1
- ⚠️ `parent_message_id` NULL initialement (threading à implémenter)
- ⚠️ `sentiment_score`, `ai_suggestions`, `translation` NULL (features IA futures)

---

#### Table 3: `sup_customer_feedback`

**Colonnes V2 ajoutées** (14 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | ticketId | ticket_id | UUID | Migration depuis metadata si lien ticket |
| 2 | driverId | driver_id | UUID | Migration depuis metadata si feedback driver |
| 3 | serviceTypeV2 | service_type_v2 | service_type DEFAULT 'other' | Migration depuis metadata |
| 4 | language | language | VARCHAR(10) | Détection auto ou défaut 'en' |
| 5 | sentimentScore | sentiment_score | FLOAT | NULL (analyse IA future) |
| 6 | isAnonymous | is_anonymous | BOOLEAN DEFAULT false | Vrai si submitted_by IS NULL |
| 7 | category | category | VARCHAR(100) | Migration depuis metadata |
| 8 | tags | tags | TEXT[] DEFAULT '{}' | Extraction depuis metadata |
| 9 | overallRating | overall_rating | INT | Migration depuis rating V1 |
| 10 | responseTimeRating | response_time_rating | INT | NULL (détail ratings futur) |
| 11 | resolutionQualityRating | resolution_quality_rating | INT | NULL (détail ratings futur) |
| 12 | agentProfessionalismRating | agent_professionalism_rating | INT | NULL (détail ratings futur) |
| 13 | submitterTypeV2 | submitter_type_v2 | submitter_type | Migration depuis submitter_type VARCHAR V1 |
| 14 | serviceType | service_type | service_type DEFAULT 'other' | Alias pour serviceTypeV2 (conformité Prisma) |

**Colonnes V1 conservées** :
- `id`, `tenant_id`, `submitted_by`
- `submitter_type` (VARCHAR V1, maintenu)
- `feedback_text`, `rating` (INT V1, maintenu)
- `metadata`
- `created_by`, `created_at`, `updated_by`, `updated_at`
- `deleted_by`, `deleted_at`

**Actions Session 14** :

```sql
-- ACTION 1: Migration submitter_type VARCHAR → submitter_type_v2 enum
UPDATE sup_customer_feedback
SET submitter_type_v2 = CASE
  WHEN LOWER(submitter_type) IN ('driver', 'conducteur') THEN 'driver'::submitter_type
  WHEN LOWER(submitter_type) IN ('client', 'customer') THEN 'client'::submitter_type
  WHEN LOWER(submitter_type) IN ('member', 'membre') THEN 'member'::submitter_type
  WHEN LOWER(submitter_type) IN ('guest', 'invité', 'anonymous') THEN 'guest'::submitter_type
  ELSE 'guest'::submitter_type
END
WHERE submitter_type_v2 IS NULL;

-- ACTION 2: Migration rating V1 → overall_rating V2
UPDATE sup_customer_feedback
SET overall_rating = rating
WHERE overall_rating IS NULL
AND rating IS NOT NULL;

-- ACTION 3: Détection is_anonymous
UPDATE sup_customer_feedback
SET is_anonymous = (submitted_by IS NULL)
WHERE is_anonymous = false;

-- ACTION 4: Migration service_type depuis metadata
UPDATE sup_customer_feedback
SET service_type_v2 = CASE
  WHEN metadata->>'service' = 'ride' THEN 'ride'::service_type
  WHEN metadata->>'service' = 'support' THEN 'support'::service_type
  WHEN metadata->>'service' = 'maintenance' THEN 'maintenance'::service_type
  ELSE 'other'::service_type
END
WHERE service_type_v2 = 'other'
AND metadata ? 'service';

-- ACTION 5: Extraction ticket_id depuis metadata
UPDATE sup_customer_feedback
SET ticket_id = (metadata->>'ticket_id')::UUID
WHERE ticket_id IS NULL
AND metadata ? 'ticket_id'
AND (metadata->>'ticket_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ACTION 6: Extraction driver_id depuis metadata
UPDATE sup_customer_feedback
SET driver_id = (metadata->>'driver_id')::UUID
WHERE driver_id IS NULL
AND metadata ? 'driver_id'
AND (metadata->>'driver_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ACTION 7: Extraction tags depuis metadata
UPDATE sup_customer_feedback
SET tags = ARRAY(SELECT jsonb_array_elements_text(metadata->'tags'))
WHERE tags = '{}'
AND metadata ? 'tags';

-- ACTION 8: Extraction category depuis metadata
UPDATE sup_customer_feedback
SET category = metadata->>'category'
WHERE category IS NULL
AND metadata ? 'category';
```

**Notes critiques** :
- ⚠️ `submitter_type` VARCHAR V1 maintenu, `submitter_type_v2` enum ajouté
- ⚠️ `rating` V1 migré vers `overall_rating` V2 (valeur globale)
- ⚠️ Ratings détaillés (response_time, resolution_quality, professionalism) NULL initialement
- ⚠️ `is_anonymous` calculé automatiquement si `submitted_by` IS NULL
- ⚠️ `sentiment_score` NULL initialement (analyse IA à implémenter)
- ⚠️ `service_type_v2` alias vers `service_type` pour compatibilité Prisma

---

### Module RID (Session 7)

#### Table 1: `rid_drivers`

**Colonnes V2 ajoutées** (70 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | placeOfBirth | place_of_birth | VARCHAR(100) | Migration depuis metadata ou NULL |
| 2 | emiratesId | emirates_id | VARCHAR(50) | Migration depuis metadata ou documents |
| 3 | emiratesIdExpiry | emirates_id_expiry | DATE | Migration depuis documents |
| 4 | fullName | full_name | TEXT GENERATED | GENERATED (first_name \|\| ' ' \|\| last_name) |
| 5 | preferredName | preferred_name | VARCHAR(100) | Migration depuis metadata ou NULL |
| 6 | secondaryPhone | secondary_phone | VARCHAR(20) | Migration depuis metadata |
| 7 | emergencyContactRelation | emergency_contact_relation | VARCHAR(50) | Migration depuis metadata ou 'family' |
| 8 | addressLine1 | address_line1 | TEXT | Migration depuis metadata |
| 9 | addressLine2 | address_line2 | TEXT | Migration depuis metadata |
| 10 | city | city | VARCHAR(100) | Migration depuis metadata |
| 11 | state | state | VARCHAR(100) | Migration depuis metadata |
| 12 | postalCode | postal_code | VARCHAR(20) | Migration depuis metadata |
| 13 | countryCode | country_code | CHAR(2) | Migration depuis nationality ou 'AE' |
| 14 | bankName | bank_name | VARCHAR(100) | Migration depuis metadata |
| 15 | bankAccountNumber | bank_account_number | VARCHAR(50) | Migration depuis metadata |
| 16 | bankIban | bank_iban | VARCHAR(34) | Migration depuis metadata |
| 17 | bankSwiftCode | bank_swift_code | VARCHAR(11) | Migration depuis metadata |
| 18 | preferredPaymentMethod | preferred_payment_method_v2 | preferred_payment_method | Défaut 'cash' ou migration metadata |
| 19 | wpsEligible | wps_eligible | BOOLEAN DEFAULT false | Migration selon bank_iban IS NOT NULL |
| 20 | driverStatus | driver_status_v2 | driver_status | Migration depuis driver_status VARCHAR |
| 21 | onboardedAt | onboarded_at | TIMESTAMPTZ | Migration depuis hire_date ou created_at |
| 22 | lastActiveAt | last_active_at | TIMESTAMPTZ | Migration depuis updated_at |
| 23 | totalTripsCompleted | total_trips_completed | INTEGER DEFAULT 0 | Calculer depuis trp_trips |
| 24 | lifetimeEarnings | lifetime_earnings | DECIMAL(18,2) DEFAULT 0 | Calculer depuis rev_driver_revenues |
| 25 | suspensionReason | suspension_reason | TEXT | Migration depuis metadata si suspended |
| 26 | suspensionStartDate | suspension_start_date | DATE | Migration depuis metadata si suspended |
| 27 | suspensionEndDate | suspension_end_date | DATE | Migration depuis metadata si suspended |
| 28 | terminationReason | termination_reason | TEXT | Migration depuis metadata si terminated |
| 29 | terminationDate | termination_date | DATE | Migration depuis metadata si terminated |
| 30 | rehireEligible | rehire_eligible | BOOLEAN DEFAULT true | Défaut true sauf blacklisted |
| 31 | photoUrl | photo_url | TEXT | Migration depuis metadata |
| 32 | photoVerifiedAt | photo_verified_at | TIMESTAMPTZ | NULL (vérification manuelle post-migration) |
| 33 | photoVerifiedBy | photo_verified_by | UUID | NULL (vérification manuelle post-migration) |
| 34 | averageRating | average_rating | DECIMAL(3,2) | Migration depuis rating |
| 35 | metadata | metadata | JSONB DEFAULT '{}' | Conserver metadata existant |
| 36 | preferences | preferences | JSONB DEFAULT '{}' | Nouveau champ vide |
| 37 | createdBy | created_by | UUID | NULL (à peupler par employees) |
| 38 | updatedBy | updated_by | UUID | NULL (à peupler par employees) |
| 39 | verifiedBy | verified_by | UUID | NULL (vérification manuelle) |
| 40 | verifiedAt | verified_at | TIMESTAMPTZ | NULL (vérification manuelle) |
| 41 | deletedBy | deleted_by | UUID | NULL sauf si deleted_at IS NOT NULL |
| 42 | deletionReason | deletion_reason | TEXT | Migration depuis metadata si deleted |

**Colonnes V1 conservées** :
- Identité: `id`, `tenant_id`, `first_name`, `last_name`, `email`, `phone` (renamed from `phoneNumber`)
- Documents: `license_number`, `license_expiry`, `professional_card_number`, `professional_card_expiry`
- Basiques: `date_of_birth`, `gender`, `nationality`, `notes`
- Audit: `created_at`, `updated_at`, `deleted_at`
- Emergency: `emergency_contact_name`, `emergency_contact_phone`
- Anciens: `driver_status` (VARCHAR V1), `rating` (DECIMAL V1)

**Actions Session 14** :

```sql
-- ACTION 1: Migration driver_status VARCHAR → driver_status_v2 ENUM
UPDATE rid_drivers
SET driver_status_v2 = CASE
  WHEN driver_status ILIKE 'active' THEN 'active'::driver_status
  WHEN driver_status ILIKE 'inactive' THEN 'inactive'::driver_status
  WHEN driver_status ILIKE 'suspended' THEN 'suspended'::driver_status
  WHEN driver_status ILIKE 'terminated' THEN 'terminated'::driver_status
  ELSE 'inactive'::driver_status
END
WHERE driver_status_v2 = 'active';

-- ACTION 2: Migration rating → average_rating
UPDATE rid_drivers
SET average_rating = CASE
  WHEN rating > 5.0 THEN 5.0  -- Cap à 5.0
  WHEN rating < 0.0 THEN NULL
  ELSE rating
END
WHERE rating IS NOT NULL
AND average_rating IS NULL;

-- ACTION 3: Migration onboarded_at depuis hire_date ou created_at
UPDATE rid_drivers
SET onboarded_at = COALESCE(hire_date::TIMESTAMPTZ, created_at)
WHERE onboarded_at IS NULL;

-- ACTION 4: Migration last_active_at depuis updated_at
UPDATE rid_drivers
SET last_active_at = updated_at
WHERE last_active_at IS NULL;

-- ACTION 5: Calcul total_trips_completed depuis trp_trips (si module TRP existe)
-- UPDATE rid_drivers d
-- SET total_trips_completed = (
--   SELECT COUNT(*) FROM trp_trips t
--   WHERE t.driver_id = d.id AND t.status = 'completed'
-- )
-- WHERE total_trips_completed = 0;

-- ACTION 6: Calcul lifetime_earnings depuis rev_driver_revenues (si module REV existe)
-- UPDATE rid_drivers d
-- SET lifetime_earnings = (
--   SELECT COALESCE(SUM(total_amount), 0) FROM rev_driver_revenues r
--   WHERE r.driver_id = d.id
-- )
-- WHERE lifetime_earnings = 0;

-- ACTION 7: Migration preferredPaymentMethod depuis metadata
UPDATE rid_drivers
SET preferred_payment_method_v2 = CASE
  WHEN metadata->>'payment_method' = 'bank' THEN 'bank_transfer'::preferred_payment_method
  WHEN metadata->>'payment_method' = 'wallet' THEN 'mobile_wallet'::preferred_payment_method
  ELSE 'cash'::preferred_payment_method
END
WHERE preferred_payment_method_v2 IS NULL;

-- ACTION 8: Calcul wps_eligible selon IBAN UAE
UPDATE rid_drivers
SET wps_eligible = (bank_iban LIKE 'AE%')
WHERE wps_eligible = false
AND bank_iban IS NOT NULL;

-- ACTION 9: Migration informations bancaires depuis metadata
UPDATE rid_drivers
SET
  bank_name = metadata->>'bank_name',
  bank_account_number = metadata->>'bank_account',
  bank_iban = metadata->>'bank_iban',
  bank_swift_code = metadata->>'bank_swift'
WHERE bank_name IS NULL
AND metadata ? 'bank_name';

-- ACTION 10: Migration adresse depuis metadata
UPDATE rid_drivers
SET
  address_line1 = metadata->>'address',
  city = metadata->>'city',
  state = metadata->>'state',
  postal_code = metadata->>'postal_code',
  country_code = COALESCE(metadata->>'country', nationality, 'AE')
WHERE address_line1 IS NULL
AND metadata ? 'address';

-- ACTION 11: Migration suspension details depuis metadata (driver_status = 'suspended')
UPDATE rid_drivers
SET
  suspension_reason = metadata->>'suspension_reason',
  suspension_start_date = (metadata->>'suspension_start')::DATE,
  suspension_end_date = (metadata->>'suspension_end')::DATE
WHERE driver_status_v2 = 'suspended'
AND suspension_reason IS NULL
AND metadata ? 'suspension_reason';

-- ACTION 12: Migration termination details depuis metadata (driver_status = 'terminated')
UPDATE rid_drivers
SET
  termination_reason = metadata->>'termination_reason',
  termination_date = (metadata->>'termination_date')::DATE,
  rehire_eligible = COALESCE((metadata->>'rehire_eligible')::BOOLEAN, true)
WHERE driver_status_v2 = 'terminated'
AND termination_reason IS NULL
AND metadata ? 'termination_reason';

-- ACTION 13: Migration Emirates ID depuis metadata ou documents
UPDATE rid_drivers d
SET emirates_id = COALESCE(
  metadata->>'emirates_id',
  (SELECT document_number FROM rid_driver_documents dd
   WHERE dd.driver_id = d.id AND dd.document_type = 'national_id'
   ORDER BY created_at DESC LIMIT 1)
)
WHERE emirates_id IS NULL;
```

**Notes critiques** :
- ⚠️ **TABLE CONTIENT DONNÉES** (rid_drivers) - Validation obligatoire
- ⚠️ `driver_status` VARCHAR V1 + `driver_status_v2` enum V2 coexistent
- ⚠️ `rating` DECIMAL V1 + `average_rating` DECIMAL V2 coexistent
- ⚠️ `total_trips_completed` et `lifetime_earnings` nécessitent modules TRP/REV
- ⚠️ `wps_eligible` calculé automatiquement selon IBAN UAE (AE prefix)
- ⚠️ Emirates ID peut être NULL si driver non-UAE
- ⚠️ `full_name` sera GENERATED column en Session 16 (first_name || ' ' || last_name)

---

#### Table 2: `rid_driver_documents`

**Colonnes V2 ajoutées** (30 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | documentType | document_type_v2 | driver_document_type | Migration depuis document_type TEXT |
| 2 | requiresRenewal | requires_renewal | BOOLEAN DEFAULT true | Défaut true sauf 'other' |
| 3 | renewalFrequencyDays | renewal_frequency_days | INTEGER | Défaut 365 pour licenses, 730 pour autres |
| 4 | reminderSentAt | reminder_sent_at | TIMESTAMPTZ | NULL initialement |
| 5 | reminderDaysBefore | reminder_days_before | INTEGER DEFAULT 30 | Défaut 30 jours |
| 6 | verificationStatus | verification_status | document_verification_status | Migration depuis verified BOOLEAN |
| 7 | rejectionReason | rejection_reason | TEXT | NULL initialement |
| 8 | verificationMethod | verification_method | VARCHAR(50) | Défaut 'manual' |
| 9 | documentNumber | document_number | VARCHAR(100) | Migration depuis metadata |
| 10 | issuingAuthority | issuing_authority | VARCHAR(255) | Migration depuis metadata |
| 11 | issuingCountry | issuing_country | CHAR(2) | Migration depuis metadata ou 'AE' |
| 12 | issueDate | issue_date | DATE | Migration depuis metadata |
| 13 | replacedDocumentId | replaced_document_id | UUID | NULL (traçabilité future) |
| 14 | replacementReason | replacement_reason | TEXT | NULL (traçabilité future) |
| 15 | ocrData | ocr_data | JSONB | NULL (OCR à implémenter) |
| 16 | confidenceScore | confidence_score | DECIMAL(5,2) | NULL (OCR à implémenter) |

**Actions Session 14** :

```sql
-- ACTION 1: Migration document_type TEXT → document_type_v2 ENUM
UPDATE rid_driver_documents
SET document_type_v2 = CASE
  WHEN document_type ILIKE '%license%' OR document_type ILIKE '%permis%' THEN 'driving_license'::driver_document_type
  WHEN document_type ILIKE '%professional%' OR document_type ILIKE '%carte%pro%' THEN 'professional_card'::driver_document_type
  WHEN document_type ILIKE '%national%' OR document_type ILIKE '%id%' OR document_type ILIKE '%cni%' THEN 'national_id'::driver_document_type
  WHEN document_type ILIKE '%passport%' THEN 'passport'::driver_document_type
  WHEN document_type ILIKE '%visa%' THEN 'visa'::driver_document_type
  WHEN document_type ILIKE '%work%permit%' THEN 'work_permit'::driver_document_type
  WHEN document_type ILIKE '%residence%' THEN 'residence_permit'::driver_document_type
  WHEN document_type ILIKE '%address%' OR document_type ILIKE '%proof%' THEN 'proof_of_address'::driver_document_type
  WHEN document_type ILIKE '%criminal%' OR document_type ILIKE '%casier%' THEN 'criminal_record'::driver_document_type
  WHEN document_type ILIKE '%medical%' OR document_type ILIKE '%health%' THEN 'medical_certificate'::driver_document_type
  WHEN document_type ILIKE '%vehicle%' OR document_type ILIKE '%registration%' THEN 'vehicle_registration'::driver_document_type
  WHEN document_type ILIKE '%insurance%' OR document_type ILIKE '%assurance%' THEN 'insurance_policy'::driver_document_type
  WHEN document_type ILIKE '%contract%' OR document_type ILIKE '%signed%' THEN 'contract_signed'::driver_document_type
  WHEN document_type ILIKE '%bank%' OR document_type ILIKE '%statement%' THEN 'bank_statement'::driver_document_type
  ELSE 'other'::driver_document_type
END
WHERE document_type_v2 IS NULL;

-- ACTION 2: Migration verified BOOLEAN → verification_status ENUM
UPDATE rid_driver_documents
SET verification_status = CASE
  WHEN verified = true THEN 'verified'::document_verification_status
  WHEN expiry_date < NOW() THEN 'expired'::document_verification_status
  ELSE 'pending'::document_verification_status
END
WHERE verification_status = 'pending';

-- ACTION 3: Calcul renewal_frequency_days selon type document
UPDATE rid_driver_documents
SET renewal_frequency_days = CASE
  WHEN document_type_v2 IN ('driving_license', 'professional_card') THEN 365
  WHEN document_type_v2 IN ('medical_certificate') THEN 365
  WHEN document_type_v2 IN ('visa', 'work_permit', 'residence_permit') THEN 365
  WHEN document_type_v2 IN ('insurance_policy', 'vehicle_registration') THEN 365
  WHEN document_type_v2 IN ('passport', 'national_id') THEN 1825  -- 5 ans
  ELSE NULL
END
WHERE renewal_frequency_days IS NULL
AND document_type_v2 != 'other';

-- ACTION 4: Extraction document_number depuis metadata
UPDATE rid_driver_documents
SET document_number = metadata->>'document_number'
WHERE document_number IS NULL
AND metadata ? 'document_number';

-- ACTION 5: Extraction issuing_authority depuis metadata
UPDATE rid_driver_documents
SET
  issuing_authority = metadata->>'issuing_authority',
  issuing_country = COALESCE(metadata->>'issuing_country', 'AE'),
  issue_date = (metadata->>'issue_date')::DATE
WHERE issuing_authority IS NULL
AND metadata ? 'issuing_authority';
```

**Notes critiques** :
- ⚠️ `document_type` TEXT V1 + `document_type_v2` enum V2 coexistent
- ⚠️ `verified` BOOLEAN V1 + `verification_status` enum V2 coexistent
- ⚠️ OCR fields (ocr_data, confidence_score) NULL initialement
- ⚠️ Renewal frequency calculé selon type document (365j licenses, 1825j passports)

---

#### Table 3: `rid_driver_cooperation_terms`

**Colonnes V2 ajoutées** (35 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | status | status_v2 | cooperation_status | Migration depuis status TEXT |
| 2 | compensationModel | compensation_model_v2 | compensation_model | Migration depuis metadata |
| 3 | fixedRentalAmount | fixed_rental_amount | DECIMAL(12,2) | Migration depuis metadata |
| 4 | percentageSplitCompany | percentage_split_company | DECIMAL(5,2) | Migration depuis metadata |
| 5 | percentageSplitDriver | percentage_split_driver | DECIMAL(5,2) | Migration depuis metadata |
| 6 | salaryAmount | salary_amount | DECIMAL(12,2) | Migration depuis metadata |
| 7 | crewRentalTerms | crew_rental_terms | TEXT | Migration depuis metadata |
| 8 | buyoutAmount | buyout_amount | DECIMAL(12,2) | Migration depuis metadata |
| 9 | customTerms | custom_terms | TEXT | Migration depuis metadata |
| 10 | signatureMethod | signature_method_v2 | signature_method | Défaut 'wet_signature' |
| 11 | signatureData | signature_data | JSONB | NULL (signature digitale future) |
| 12 | signatureIp | signature_ip | VARCHAR(45) | NULL |
| 13 | signatureTimestamp | signature_timestamp | TIMESTAMPTZ | Migration depuis accepted_at |
| 14 | digitalSignatureVerified | digital_signature_verified | BOOLEAN DEFAULT false | Défaut false |
| 15 | previousVersionId | previous_version_id | UUID | NULL (version history future) |
| 16 | versionChangeReason | version_change_reason | TEXT | NULL |
| 17 | legalReviewRequired | legal_review_required | BOOLEAN DEFAULT false | Défaut false |
| 18 | legalReviewedAt | legal_reviewed_at | TIMESTAMPTZ | NULL |
| 19 | legalReviewedBy | legal_reviewed_by | UUID | NULL |
| 20 | legalReviewNotes | legal_review_notes | TEXT | NULL |
| 21 | autoRenewal | auto_renewal | BOOLEAN DEFAULT false | Migration depuis metadata |
| 22 | autoRenewalNoticeDays | auto_renewal_notice_days | INTEGER DEFAULT 30 | Défaut 30 jours |
| 23 | renewalReminderSentAt | renewal_reminder_sent_at | TIMESTAMPTZ | NULL |
| 24 | terminationDate | termination_date | TIMESTAMPTZ | Migration si status='terminated' |
| 25 | terminationReason | termination_reason | TEXT | Migration depuis metadata |
| 26 | terminationInitiatedBy | termination_initiated_by | UUID | NULL |
| 27 | earlyTerminationPenalty | early_termination_penalty | DECIMAL(12,2) | Migration depuis metadata |

**Actions Session 14** :

```sql
-- ACTION 1: Migration status TEXT → status_v2 ENUM
UPDATE rid_driver_cooperation_terms
SET status_v2 = CASE
  WHEN status ILIKE 'pending' THEN 'pending'::cooperation_status
  WHEN status ILIKE 'active' THEN 'active'::cooperation_status
  WHEN status ILIKE 'expired' THEN 'expired'::cooperation_status
  WHEN status ILIKE 'terminated' THEN 'terminated'::cooperation_status
  ELSE 'pending'::cooperation_status
END
WHERE status_v2 = 'pending';

-- ACTION 2: Migration compensation_model depuis metadata
UPDATE rid_driver_cooperation_terms
SET compensation_model_v2 = CASE
  WHEN metadata->>'compensation' = 'fixed' THEN 'fixed_rental'::compensation_model
  WHEN metadata->>'compensation' = 'percentage' THEN 'percentage_split'::compensation_model
  WHEN metadata->>'compensation' = 'salary' THEN 'salary'::compensation_model
  WHEN metadata->>'compensation' = 'crew' THEN 'crew_rental'::compensation_model
  WHEN metadata->>'compensation' = 'buyout' THEN 'buyout'::compensation_model
  ELSE 'custom'::compensation_model
END
WHERE compensation_model_v2 IS NULL
AND metadata ? 'compensation';

-- ACTION 3: Migration montants compensation depuis metadata
UPDATE rid_driver_cooperation_terms
SET
  fixed_rental_amount = (metadata->>'rental_amount')::DECIMAL,
  percentage_split_company = (metadata->>'company_percentage')::DECIMAL,
  percentage_split_driver = (metadata->>'driver_percentage')::DECIMAL,
  salary_amount = (metadata->>'salary')::DECIMAL,
  buyout_amount = (metadata->>'buyout_amount')::DECIMAL,
  custom_terms = metadata->>'custom_terms'
WHERE metadata IS NOT NULL;

-- ACTION 4: Migration signature timestamp depuis accepted_at
UPDATE rid_driver_cooperation_terms
SET signature_timestamp = accepted_at
WHERE signature_timestamp IS NULL
AND accepted_at IS NOT NULL;

-- ACTION 5: Migration termination_date si status='terminated'
UPDATE rid_driver_cooperation_terms
SET
  termination_date = (metadata->>'termination_date')::TIMESTAMPTZ,
  termination_reason = metadata->>'termination_reason'
WHERE status_v2 = 'terminated'
AND termination_date IS NULL
AND metadata ? 'termination_date';
```

**Notes critiques** :
- ⚠️ `status` TEXT V1 + `status_v2` enum V2 coexistent
- ⚠️ 6 modèles de compensation supportés (fixed_rental, percentage_split, salary, crew_rental, buyout, custom)
- ⚠️ Signature digitale fields NULL initialement (workflow futur)
- ⚠️ Legal review fields NULL initialement

---

#### Table 4: `rid_driver_requests`

**Colonnes V2 ajoutées** (40 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | requestType | request_type_v2 | driver_request_type | Migration depuis request_type TEXT |
| 2 | status | status_v2 | request_status | Migration depuis status TEXT |
| 3 | priority | priority | request_priority DEFAULT 'normal' | Défaut 'normal' |
| 4 | slaDeadline | sla_deadline | TIMESTAMPTZ | Calculer request_date + 3 jours |
| 5 | slaBreached | sla_breached | BOOLEAN DEFAULT false | Calculer si NOW() > sla_deadline |
| 6 | responseRequiredBy | response_required_by | TIMESTAMPTZ | Calculer selon priority |
| 7 | assignedTo | assigned_to | UUID | NULL (assignment futur) |
| 8 | assignedAt | assigned_at | TIMESTAMPTZ | NULL |
| 9 | reviewStartedAt | review_started_at | TIMESTAMPTZ | NULL |
| 10 | reviewedBy | reviewed_by | UUID | NULL |
| 11 | approvedAt | approved_at | TIMESTAMPTZ | NULL |
| 12 | approvedBy | approved_by | UUID | NULL |
| 13 | rejectedAt | rejected_at | TIMESTAMPTZ | NULL |
| 14 | rejectedBy | rejected_by | UUID | NULL |
| 15 | rejectionReason | rejection_reason | TEXT | Migration depuis resolution_notes si rejected |
| 16 | completedAt | completed_at | TIMESTAMPTZ | Migration si status='completed' |
| 17 | escalated | escalated | BOOLEAN DEFAULT false | Défaut false |
| 18 | escalatedAt | escalated_at | TIMESTAMPTZ | NULL |
| 19 | escalatedTo | escalated_to | UUID | NULL |
| 20 | escalationReason | escalation_reason | TEXT | NULL |
| 21 | requiresManagerApproval | requires_manager_approval | BOOLEAN DEFAULT false | Selon request_type |
| 22 | managerApprovedAt | manager_approved_at | TIMESTAMPTZ | NULL |
| 23 | managerApprovedBy | manager_approved_by | UUID | NULL |
| 24 | requiresHrApproval | requires_hr_approval | BOOLEAN DEFAULT false | Selon request_type |
| 25 | hrApprovedAt | hr_approved_at | TIMESTAMPTZ | NULL |
| 26 | hrApprovedBy | hr_approved_by | UUID | NULL |
| 27 | driverNotifiedAt | driver_notified_at | TIMESTAMPTZ | NULL |
| 28 | managerNotifiedAt | manager_notified_at | TIMESTAMPTZ | NULL |
| 29 | notificationMethod | notification_method | VARCHAR(50) | NULL |
| 30 | attachments | attachments | JSONB DEFAULT '[]' | Migration depuis details |

**Actions Session 14** :

```sql
-- ACTION 1: Migration request_type TEXT → request_type_v2 ENUM
UPDATE rid_driver_requests
SET request_type_v2 = CASE
  WHEN request_type ILIKE '%leave%' OR request_type ILIKE '%cong%' THEN 'leave'::driver_request_type
  WHEN request_type ILIKE '%vehicle%' OR request_type ILIKE '%car%' THEN 'vehicle_change'::driver_request_type
  WHEN request_type ILIKE '%schedule%' OR request_type ILIKE '%shift%' THEN 'schedule_change'::driver_request_type
  WHEN request_type ILIKE '%expense%' OR request_type ILIKE '%reimburs%' THEN 'expense_reimbursement'::driver_request_type
  WHEN request_type ILIKE '%advance%' OR request_type ILIKE '%payment%' THEN 'advance_payment'::driver_request_type
  WHEN request_type ILIKE '%document%' THEN 'document_update'::driver_request_type
  WHEN request_type ILIKE '%complaint%' OR request_type ILIKE '%claim%' THEN 'complaint'::driver_request_type
  WHEN request_type ILIKE '%support%' OR request_type ILIKE '%help%' THEN 'support'::driver_request_type
  WHEN request_type ILIKE '%contract%' OR request_type ILIKE '%modif%' THEN 'contract_modification'::driver_request_type
  WHEN request_type ILIKE '%terminat%' OR request_type ILIKE '%quit%' THEN 'termination'::driver_request_type
  ELSE 'other'::driver_request_type
END
WHERE request_type_v2 IS NULL;

-- ACTION 2: Migration status TEXT → status_v2 ENUM
UPDATE rid_driver_requests
SET status_v2 = CASE
  WHEN status ILIKE 'pending' THEN 'pending'::request_status
  WHEN status ILIKE 'review%' OR status ILIKE 'in%progress' THEN 'under_review'::request_status
  WHEN status ILIKE 'approved' THEN 'approved'::request_status
  WHEN status ILIKE 'rejected' OR status ILIKE 'denied' THEN 'rejected'::request_status
  WHEN status ILIKE 'cancel%' THEN 'cancelled'::request_status
  WHEN status ILIKE 'completed' OR status ILIKE 'done' THEN 'completed'::request_status
  ELSE 'pending'::request_status
END
WHERE status_v2 = 'pending';

-- Note: sla_deadline doit venir de configuration request_type (pas de hardcode)
-- Les SLA varient selon type: urgent 1h, normal 24h, standard 3 jours, etc.

-- ACTION 3: Calcul SLA breached
UPDATE rid_driver_requests
SET sla_breached = (NOW() > sla_deadline)
WHERE sla_breached = false
AND status_v2 NOT IN ('completed', 'cancelled');

-- ACTION 5: Détection requires_manager_approval selon type
UPDATE rid_driver_requests
SET requires_manager_approval = true
WHERE request_type_v2 IN ('leave', 'vehicle_change', 'contract_modification', 'termination')
AND requires_manager_approval = false;

-- ACTION 6: Détection requires_hr_approval selon type
UPDATE rid_driver_requests
SET requires_hr_approval = true
WHERE request_type_v2 IN ('contract_modification', 'termination')
AND requires_hr_approval = false;

-- ACTION 7: Migration completed_at si status='completed'
UPDATE rid_driver_requests
SET completed_at = updated_at
WHERE status_v2 = 'completed'
AND completed_at IS NULL;

-- ACTION 8: Migration rejection_reason depuis resolution_notes si rejected
UPDATE rid_driver_requests
SET rejection_reason = resolution_notes
WHERE status_v2 = 'rejected'
AND rejection_reason IS NULL
AND resolution_notes IS NOT NULL;
```

**Notes critiques** :
- ⚠️ `request_type` TEXT V1 + `request_type_v2` enum V2 coexistent
- ⚠️ `status` TEXT V1 + `status_v2` enum V2 coexistent
- ⚠️ SLA calculé automatiquement (3 jours par défaut)
- ⚠️ Workflow multi-niveaux (manager + HR approval) selon type request
- ⚠️ 11 types de requests supportés

---

#### Table 5: `rid_driver_performances`

**Colonnes V2 ajoutées** (50 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | periodType | period_type_v2 | period_type DEFAULT 'weekly' | Défaut 'weekly' |
| 2 | platformId | platform_id | UUID | NULL (multi-platform tracking futur) |
| 3 | platformTripsCompleted | platform_trips_completed | INTEGER DEFAULT 0 | NULL |
| 4 | platformEarnings | platform_earnings | DECIMAL(12,2) DEFAULT 0 | NULL |
| 5-15 | Payment methods détaillés | cash_trips, cash_earnings, card_trips, card_earnings, wallet_trips, wallet_earnings, mixed_payment_trips | Various | Migration depuis metadata |
| 16-18 | Ranking | rank_in_period, tier, tier_change | Various | NULL (calcul futur) |
| 19-24 | Efficiency metrics | acceptance_rate, cancellation_rate, completion_rate, avg_trip_duration_minutes, avg_earnings_per_trip, avg_earnings_per_hour | DECIMAL | Calculer depuis metadata |
| 25-29 | Customer satisfaction | total_ratings_received, five_star_ratings, one_star_ratings, compliments_received, complaints_received | INTEGER | NULL (agrégation future) |
| 30-32 | Fuel & expenses | total_fuel_cost, total_expenses, net_earnings | DECIMAL | Migration depuis metadata |
| 33-35 | Bonus & incentives | bonus_earned, incentives_earned, penalties_deducted | DECIMAL | Migration depuis metadata |
| 36-37 | Distance & time | total_distance_km, hours_logged | DECIMAL | Copier depuis hours_online |

**Actions Session 14** :

```sql
-- ACTION 1: Migration hours_online → hours_logged
UPDATE rid_driver_performances
SET hours_logged = hours_online
WHERE hours_logged IS NULL
AND hours_online IS NOT NULL;

-- ACTION 2: Calcul efficiency metrics basiques
UPDATE rid_driver_performances
SET
  completion_rate = CASE
    WHEN (trips_completed + trips_cancelled) > 0
    THEN (trips_completed::DECIMAL / (trips_completed + trips_cancelled)) * 100
    ELSE 100.0
  END,
  avg_earnings_per_trip = CASE
    WHEN trips_completed > 0
    THEN earnings_total / trips_completed
    ELSE 0
  END,
  avg_earnings_per_hour = CASE
    WHEN hours_logged > 0
    THEN earnings_total / hours_logged
    ELSE 0
  END
WHERE completion_rate IS NULL;

-- ACTION 3: Migration payment methods depuis metadata
UPDATE rid_driver_performances
SET
  cash_trips = (metadata->>'cash_trips')::INTEGER,
  cash_earnings = (metadata->>'cash_earnings')::DECIMAL,
  card_trips = (metadata->>'card_trips')::INTEGER,
  card_earnings = (metadata->>'card_earnings')::DECIMAL,
  wallet_trips = (metadata->>'wallet_trips')::INTEGER,
  wallet_earnings = (metadata->>'wallet_earnings')::DECIMAL
WHERE metadata IS NOT NULL
AND cash_trips IS NULL;

-- ACTION 4: Migration fuel/expenses depuis metadata
UPDATE rid_driver_performances
SET
  total_fuel_cost = (metadata->>'fuel_cost')::DECIMAL,
  total_expenses = (metadata->>'expenses')::DECIMAL,
  net_earnings = earnings_total - COALESCE((metadata->>'expenses')::DECIMAL, 0)
WHERE metadata IS NOT NULL
AND total_fuel_cost IS NULL;

-- ACTION 5: Migration bonus/incentives depuis metadata
UPDATE rid_driver_performances
SET
  bonus_earned = (metadata->>'bonus')::DECIMAL,
  incentives_earned = (metadata->>'incentives')::DECIMAL,
  penalties_deducted = (metadata->>'penalties')::DECIMAL
WHERE metadata IS NOT NULL
AND bonus_earned IS NULL;
```

**Notes critiques** :
- ⚠️ Multi-platform tracking via `platform_id` (NULL si single platform)
- ⚠️ Payment methods breakdown (cash/card/wallet) pour analytics détaillés
- ⚠️ Efficiency metrics calculés automatiquement depuis trips data
- ⚠️ Ranking/tier fields NULL initialement (calcul manuel post-migration)

---

#### Table 6: `rid_driver_blacklists`

**Colonnes V2 ajoutées** (40 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1-2 | Category & Severity | category, severity | blacklist_category, blacklist_severity | Migration depuis metadata |
| 3 | status | status_v2 | blacklist_status | Migration depuis status TEXT |
| 4-7 | Incident details | incident_date, incident_location, incident_description, evidence_documents | Various | Migration depuis metadata |
| 8-13 | Decision making | decided_by, decided_at, decision_notes, decision_reviewed, reviewed_by, reviewed_at | Various | NULL (workflow futur) |
| 14-20 | Appeal process | appeal_status_v2, appeal_submitted_at, appeal_reason, appeal_reviewed_at, appeal_reviewed_by, appeal_decision, appeal_outcome | Various | NULL (workflow futur) |
| 21-25 | Legal review | legal_review_required, legal_reviewed_at, legal_reviewed_by, legal_case_number, legal_notes | Various | NULL (legal workflow futur) |
| 26-29 | Reinstatement | reinstatement_conditions, reinstatement_eligible_date, reinstated_at, reinstated_by | Various | NULL |
| 30-33 | Notifications | driver_notified_at, notification_method, acknowledgment_received, acknowledgment_date | Various | NULL |

**Actions Session 14** :

```sql
-- ACTION 1: Migration status TEXT → status_v2 ENUM
UPDATE rid_driver_blacklists
SET status_v2 = CASE
  WHEN status ILIKE 'active' THEN 'active'::blacklist_status
  WHEN status ILIKE 'expired' THEN 'expired'::blacklist_status
  WHEN status ILIKE 'revoked' THEN 'revoked'::blacklist_status
  WHEN status ILIKE 'appeal%' THEN 'appealed_lifted'::blacklist_status
  ELSE 'active'::blacklist_status
END
WHERE status_v2 = 'active';

-- ACTION 2: Migration category depuis reason (détection mots-clés)
UPDATE rid_driver_blacklists
SET category = CASE
  WHEN reason ILIKE '%disciplin%' OR reason ILIKE '%misconduct%' THEN 'disciplinary'::blacklist_category
  WHEN reason ILIKE '%admin%' OR reason ILIKE '%document%' THEN 'administrative'::blacklist_category
  WHEN reason ILIKE '%legal%' OR reason ILIKE '%law%' THEN 'legal'::blacklist_category
  WHEN reason ILIKE '%safety%' OR reason ILIKE '%accident%' THEN 'safety'::blacklist_category
  WHEN reason ILIKE '%financial%' OR reason ILIKE '%debt%' OR reason ILIKE '%payment%' THEN 'financial'::blacklist_category
  WHEN reason ILIKE '%performance%' OR reason ILIKE '%rating%' THEN 'performance'::blacklist_category
  WHEN reason ILIKE '%contract%' OR reason ILIKE '%breach%' THEN 'contract_breach'::blacklist_category
  WHEN reason ILIKE '%criminal%' OR reason ILIKE '%police%' THEN 'criminal'::blacklist_category
  WHEN reason ILIKE '%voluntary%' OR reason ILIKE '%resigned%' THEN 'voluntary'::blacklist_category
  ELSE 'administrative'::blacklist_category
END
WHERE category IS NULL;

-- ACTION 3: Migration severity (défaut 'medium')
UPDATE rid_driver_blacklists
SET severity = CASE
  WHEN category IN ('criminal', 'safety') THEN 'critical'::blacklist_severity
  WHEN category IN ('legal', 'financial') THEN 'high'::blacklist_severity
  WHEN category IN ('disciplinary', 'performance', 'contract_breach') THEN 'medium'::blacklist_severity
  ELSE 'low'::blacklist_severity
END
WHERE severity IS NULL;

-- ACTION 4: Migration incident_date depuis start_date
UPDATE rid_driver_blacklists
SET incident_date = start_date
WHERE incident_date IS NULL;

-- ACTION 5: Migration incident_description depuis reason
UPDATE rid_driver_blacklists
SET incident_description = reason
WHERE incident_description IS NULL;

-- ACTION 6: Migration evidence_documents depuis metadata
UPDATE rid_driver_blacklists
SET evidence_documents = COALESCE(metadata->'evidence', '[]'::JSONB)
WHERE metadata IS NOT NULL
AND evidence_documents = '[]';

-- ACTION 7: Calcul reinstatement_eligible_date (end_date ou 1 an après start)
UPDATE rid_driver_blacklists
SET reinstatement_eligible_date = COALESCE(
  end_date::DATE,
  (start_date + INTERVAL '1 year')::DATE
)
WHERE reinstatement_eligible_date IS NULL
AND severity != 'critical';
```

**Notes critiques** :
- ⚠️ `status` TEXT V1 + `status_v2` enum V2 coexistent
- ⚠️ 9 catégories de blacklist (disciplinary, legal, safety, criminal, etc.)
- ⚠️ 4 niveaux de sévérité (low, medium, high, critical)
- ⚠️ Appeal process complet avec workflow review
- ⚠️ Legal review fields pour cas juridiques
- ⚠️ Reinstatement tracking avec conditions

---

#### Table 7: `rid_driver_training`

**Colonnes V2 ajoutées** (50 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1-2 | Type & Status | training_type_v2, status_v2 | training_type, training_status | Migration depuis training_name et status TEXT |
| 3-6 | Provider détaillé | provider_type_v2, provider_id, provider_contact, provider_location | Various | Migration depuis provider TEXT |
| 7-11 | Contenu | description, duration_hours, total_sessions, sessions_completed, materials_url | Various | Migration depuis metadata |
| 12-14 | Prérequis | prerequisites_met, prerequisite_training_ids, prerequisite_documents | Various | NULL (validation future) |
| 15-21 | Scheduling | scheduled_start, scheduled_end, actual_start, actual_end, location, online_meeting_url | Various | Migration depuis assigned_at/completed_at |
| 22-24 | Attendance | attendance_percentage, absences_count, late_arrivals_count | Various | NULL (tracking futur) |
| 25-32 | Evaluation | evaluation_method, passing_score, max_score, pass_fail_status, evaluation_date, evaluated_by, evaluation_notes | Various | Migration depuis score |
| 33-39 | Certification | certificate_issued, certificate_number, certificate_issued_date, certificate_expiry_date, recertification_required, recertification_frequency_months | Various | Migration depuis certificate_url |
| 40-43 | Coût | training_cost, paid_by_v2, budget_code, invoice_number | Various | Migration depuis metadata |
| 44-46 | Feedback | driver_feedback, driver_rating, feedback_submitted_at | Various | NULL (feedback futur) |

**Actions Session 14** :

```sql
-- ACTION 1: Migration training_type depuis training_name (détection)
UPDATE rid_driver_training
SET training_type_v2 = CASE
  WHEN training_name ILIKE '%mandatory%' OR training_name ILIKE '%required%' THEN 'mandatory'::training_type
  WHEN training_name ILIKE '%safety%' OR training_name ILIKE '%s%curit%' THEN 'safety'::training_type
  WHEN training_name ILIKE '%customer%' OR training_name ILIKE '%service%' THEN 'customer_service'::training_type
  WHEN training_name ILIKE '%technical%' OR training_name ILIKE '%maintenance%' THEN 'technical'::training_type
  WHEN training_name ILIKE '%compliance%' OR training_name ILIKE '%regulatory%' THEN 'compliance'::training_type
  WHEN training_name ILIKE '%platform%' OR training_name ILIKE '%uber%' OR training_name ILIKE '%careem%' THEN 'platform_specific'::training_type
  WHEN training_name ILIKE '%professional%' OR training_name ILIKE '%development%' THEN 'professional_development'::training_type
  WHEN training_name ILIKE '%onboard%' OR training_name ILIKE '%induction%' THEN 'onboarding'::training_type
  WHEN training_name ILIKE '%refresher%' OR training_name ILIKE '%update%' THEN 'refresher'::training_type
  ELSE 'specialized'::training_type
END
WHERE training_type_v2 IS NULL;

-- ACTION 2: Migration status TEXT → status_v2 ENUM
UPDATE rid_driver_training
SET status_v2 = CASE
  WHEN status ILIKE 'planned' OR status ILIKE 'scheduled' THEN 'planned'::training_status
  WHEN status ILIKE 'in%progress' OR status ILIKE 'ongoing' THEN 'in_progress'::training_status
  WHEN status ILIKE 'completed' OR status ILIKE 'done' THEN 'completed'::training_status
  WHEN status ILIKE 'expired' THEN 'expired'::training_status
  WHEN status ILIKE 'cancel%' THEN 'cancelled'::training_status
  ELSE 'planned'::training_status
END
WHERE status_v2 = 'planned';

-- ACTION 3: Migration provider_type depuis provider TEXT
UPDATE rid_driver_training
SET provider_type_v2 = CASE
  WHEN provider ILIKE '%internal%' OR provider ILIKE '%fleetcore%' THEN 'internal'::provider_type
  WHEN provider ILIKE '%online%' OR provider ILIKE '%platform%' OR provider ILIKE '%udemy%' THEN 'online_platform'::provider_type
  WHEN provider ILIKE '%government%' OR provider ILIKE '%rta%' OR provider ILIKE '%ministry%' THEN 'government'::provider_type
  ELSE 'external'::provider_type
END
WHERE provider_type_v2 IS NULL;

-- ACTION 4: Migration scheduling dates
UPDATE rid_driver_training
SET
  scheduled_start = assigned_at,
  actual_start = assigned_at,
  actual_end = completed_at,
  evaluation_date = completed_at
WHERE scheduled_start IS NULL
AND assigned_at IS NOT NULL;

-- ACTION 5: Migration evaluation depuis score
UPDATE rid_driver_training
SET
  pass_fail_status = CASE
    WHEN score >= 70.0 THEN 'passed'
    WHEN score IS NULL THEN 'pending'
    ELSE 'failed'
  END,
  passing_score = 70.0,
  max_score = 100.0
WHERE pass_fail_status IS NULL
AND score IS NOT NULL;

-- ACTION 6: Migration certificate depuis certificate_url
UPDATE rid_driver_training
SET
  certificate_issued = (certificate_url IS NOT NULL),
  certificate_issued_date = completed_at::DATE
WHERE certificate_issued = false
AND certificate_url IS NOT NULL;

-- ACTION 7: Migration training_cost et paid_by depuis metadata
UPDATE rid_driver_training
SET
  training_cost = (metadata->>'cost')::DECIMAL,
  paid_by_v2 = CASE
    WHEN metadata->>'paid_by' = 'company' THEN 'company'::paid_by
    WHEN metadata->>'paid_by' = 'driver' THEN 'driver'::paid_by
    WHEN metadata->>'paid_by' = 'platform' THEN 'platform'::paid_by
    ELSE 'company'::paid_by
  END
WHERE metadata IS NOT NULL
AND training_cost IS NULL;
```

**Notes critiques** :
- ⚠️ `status` TEXT V1 + `status_v2` enum V2 coexistent
- ⚠️ 10 types de training supportés (mandatory, safety, customer_service, etc.)
- ⚠️ 4 types de providers (internal, external, online_platform, government)
- ⚠️ Evaluation complète avec passing score (70/100 par défaut)
- ⚠️ Certification tracking avec expiry dates
- ⚠️ Coût training avec paid_by (company/driver/platform/government)

---

### Module FLT (Session 8)

#### Table 1: `flt_vehicles`

**Colonnes V2 ajoutées** (20 colonnes)

| # | Colonne SQL | Type SQL | Action Session 14 |
|---|-------------|----------|-------------------|
| 1 | country_code | CHAR(2) | Migration depuis metadata ou 'AE' par défaut |
| 2 | requires_professional_license | BOOLEAN | Inférer depuis vehicle_class ou false |
| 3 | documents_status | JSONB | Migration depuis metadata |
| 4 | body_type | VARCHAR(20) | Migration depuis metadata ou inférer depuis model |
| 5 | passenger_capacity | INTEGER | Inférer depuis vehicle_class |
| 6 | car_length_cm | INTEGER | NULL (à remplir manuellement) |
| 7 | car_width_cm | INTEGER | NULL (à remplir manuellement) |
| 8 | car_height_cm | INTEGER | NULL (à remplir manuellement) |
| 9 | seats | INTEGER | Copier depuis passenger_capacity |
| 10 | vehicle_class_id | UUID | Migration depuis metadata |
| 11 | first_registration_date | DATE | Copier depuis registration_date |
| 12 | warranty_expiry | DATE | Calculer depuis registration_date + 3 ans |
| 13 | service_interval_km | INTEGER | Défaut 5000 km |
| 14 | next_service_at_km | INTEGER | Calculer odometer + service_interval_km |
| 15 | insurance_policy_number | TEXT | Migration depuis insurance fields V1 |
| 16 | insurance_coverage_type | TEXT | Migration depuis metadata |
| 17 | insurance_amount | DECIMAL(18,2) | Migration depuis metadata |
| 18 | insurance_issue_date | DATE | Migration depuis metadata |
| 19 | insurance_expiry | DATE | Migration depuis insurance expiry V1 |
| 20 | ownership_type_id | UUID | NULL (à configurer) |
| 21 | owner_id | UUID | NULL (à configurer) |
| 22 | acquisition_date | DATE | Copier depuis registration_date |
| 23 | lease_end_date | DATE | NULL (à configurer si leasing) |
| 24 | residual_value | DECIMAL(18,2) | NULL (à configurer) |
| 25 | status_changed_at | TIMESTAMPTZ | Défaut NOW() |

**Colonnes V1 conservées** :
- `id`, `tenant_id`, `make_id`, `model_id`, `license_plate`, `vin`, `year`, `color`
- `fuel_type`, `transmission`, `registration_date`, `last_inspection`, `next_inspection`
- `odometer`, `status_id`, `metadata`
- `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration country_code depuis metadata ou défaut AE
UPDATE flt_vehicles
SET country_code = COALESCE(metadata->>'country_code', 'AE')
WHERE country_code IS NULL;

-- ACTION 2: Migration requires_professional_license (véhicules commerciaux)
UPDATE flt_vehicles v
SET requires_professional_license = true
WHERE EXISTS (
  SELECT 1 FROM dir_vehicle_classes vc
  WHERE vc.id = v.vehicle_class_id
  AND vc.code IN ('commercial', 'limousine', 'van')
);

-- ACTION 3: Migration body_type depuis metadata
UPDATE flt_vehicles
SET body_type = COALESCE(metadata->>'body_type', 'sedan')
WHERE body_type IS NULL;

-- ACTION 4: Migration seats depuis passenger_capacity
UPDATE flt_vehicles
SET seats = passenger_capacity
WHERE seats IS NULL
AND passenger_capacity IS NOT NULL;

-- ACTION 5: Migration first_registration_date
UPDATE flt_vehicles
SET first_registration_date = registration_date
WHERE first_registration_date IS NULL
AND registration_date IS NOT NULL;

-- ACTION 6: Calcul warranty_expiry (registration_date + 3 ans)
UPDATE flt_vehicles
SET warranty_expiry = registration_date + INTERVAL '3 years'
WHERE warranty_expiry IS NULL
AND registration_date IS NOT NULL;

-- ACTION 7: Définir service_interval_km par défaut (5000 km)
UPDATE flt_vehicles
SET service_interval_km = 5000
WHERE service_interval_km IS NULL;

-- ACTION 8: Calculer next_service_at_km
UPDATE flt_vehicles
SET next_service_at_km = odometer + service_interval_km
WHERE next_service_at_km IS NULL
AND odometer IS NOT NULL
AND service_interval_km IS NOT NULL;

-- ACTION 9: Migration insurance depuis metadata
UPDATE flt_vehicles
SET
  insurance_policy_number = metadata->>'insurance_policy_number',
  insurance_coverage_type = metadata->>'insurance_coverage_type',
  insurance_amount = (metadata->>'insurance_amount')::DECIMAL(18,2),
  insurance_issue_date = (metadata->>'insurance_issue_date')::DATE,
  insurance_expiry = (metadata->>'insurance_expiry')::DATE
WHERE metadata IS NOT NULL
AND insurance_policy_number IS NULL;

-- ACTION 10: Migration acquisition_date
UPDATE flt_vehicles
SET acquisition_date = registration_date
WHERE acquisition_date IS NULL
AND registration_date IS NOT NULL;

-- ACTION 11: Définir status_changed_at
UPDATE flt_vehicles
SET status_changed_at = updated_at
WHERE status_changed_at IS NULL;
```

**Notes critiques** :
- ⚠️ **TABLE CONTIENT DONNÉES** (flt_vehicles) - Validation obligatoire
- ⚠️ `country_code` requis pour compliance multi-pays (défaut AE)
- ⚠️ `warranty_expiry` calculé automatiquement (3 ans depuis registration)
- ⚠️ `service_interval_km` défaut 5000 km
- ⚠️ `ownership_type_id` et `owner_id` à configurer manuellement après migration

---

#### Table 2: `flt_vehicle_assignments`

**Colonnes V2 ajoutées** (21 colonnes)

| # | Colonne SQL | Type SQL | Action Session 14 |
|---|-------------|----------|-------------------|
| 1 | handover_date | TIMESTAMPTZ | Copier depuis start_date |
| 2 | handover_location | TEXT | NULL (à remplir rétroactivement) |
| 3 | handover_type | VARCHAR(20) | 'pickup' par défaut |
| 4 | initial_odometer | INTEGER | Migration depuis metadata |
| 5 | initial_fuel_level | INTEGER | Défaut 100% |
| 6 | initial_condition | JSONB | NULL (assignments passés) |
| 7 | handover_photos | JSONB | NULL (assignments passés) |
| 8 | photos_metadata | JSONB | NULL (assignments passés) |
| 9 | driver_signature | TEXT | NULL (assignments passés) |
| 10 | fleet_signature | TEXT | NULL (assignments passés) |
| 11 | handover_checklist | JSONB | NULL (assignments passés) |
| 12 | return_date | TIMESTAMPTZ | Copier depuis end_date |
| 13 | return_odometer | INTEGER | Migration depuis metadata |
| 14 | return_fuel_level | INTEGER | NULL (assignments en cours) |
| 15 | return_condition | JSONB | NULL (assignments passés) |
| 16 | damages_reported | JSONB | Migration depuis metadata |
| 17 | penalty_amount | DECIMAL(18,2) | Migration depuis metadata |
| 18 | notes | TEXT | Migration depuis metadata |

**Colonnes V1 conservées** :
- `id`, `tenant_id`, `driver_id`, `vehicle_id`, `start_date`, `end_date`
- `assignment_type`, `status`, `metadata`
- `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`, `deleted_by`, `deletion_reason`

**Actions Session 14** :

```sql
-- ACTION 1: Migration handover_date depuis start_date
UPDATE flt_vehicle_assignments
SET handover_date = start_date
WHERE handover_date IS NULL
AND start_date IS NOT NULL;

-- ACTION 2: Migration handover_type (défaut pickup)
UPDATE flt_vehicle_assignments
SET handover_type = 'pickup'
WHERE handover_type IS NULL;

-- ACTION 3: Migration initial_odometer depuis metadata
UPDATE flt_vehicle_assignments
SET initial_odometer = (metadata->>'initial_odometer')::INTEGER
WHERE initial_odometer IS NULL
AND metadata IS NOT NULL;

-- ACTION 4: Défaut initial_fuel_level 100%
UPDATE flt_vehicle_assignments
SET initial_fuel_level = 100
WHERE initial_fuel_level IS NULL
AND status IN ('active', 'completed');

-- ACTION 5: Migration return_date depuis end_date
UPDATE flt_vehicle_assignments
SET return_date = end_date
WHERE return_date IS NULL
AND end_date IS NOT NULL
AND status = 'completed';

-- ACTION 6: Migration return_odometer depuis metadata
UPDATE flt_vehicle_assignments
SET return_odometer = (metadata->>'return_odometer')::INTEGER
WHERE return_odometer IS NULL
AND metadata IS NOT NULL
AND status = 'completed';

-- ACTION 7: Migration damages_reported depuis metadata
UPDATE flt_vehicle_assignments
SET damages_reported = metadata->'damages_reported'
WHERE damages_reported IS NULL
AND metadata IS NOT NULL;

-- ACTION 8: Migration penalty_amount depuis metadata
UPDATE flt_vehicle_assignments
SET penalty_amount = (metadata->>'penalty_amount')::DECIMAL(18,2)
WHERE penalty_amount IS NULL
AND metadata IS NOT NULL;

-- ACTION 9: Migration notes depuis metadata
UPDATE flt_vehicle_assignments
SET notes = metadata->>'notes'
WHERE notes IS NULL
AND metadata IS NOT NULL;
```

**Notes critiques** :
- ⚠️ Handover protocol V2 complet (photos, signatures) non disponible pour assignments passés
- ⚠️ `initial_fuel_level` défaut 100% pour assignments existants
- ⚠️ Photos et signatures obligatoires pour nouveaux assignments uniquement

---

#### Table 3: `flt_vehicle_events`

**Colonnes V2 ajoutées** (18 colonnes)

| # | Colonne SQL | Type SQL | Action Session 14 |
|---|-------------|----------|-------------------|
| 1 | ride_id | UUID | NULL (lien vers TRP future) |
| 2 | assignment_id | UUID | Migration depuis driver_id et vehicle_id |
| 3 | responsible_party | VARCHAR(20) | Migration depuis metadata ou 'fleet' |
| 4 | fault_percentage | INTEGER | Migration depuis metadata ou 0 |
| 5 | liability_assessment | JSONB | Migration depuis metadata |
| 6 | severity | VARCHAR(20) | Migration depuis event_type |
| 7 | police_report_number | TEXT | Migration depuis metadata |
| 8 | police_station | TEXT | Migration depuis metadata |
| 9 | insurance_claim_id | UUID | NULL (à lier manuellement) |
| 10 | claim_status | VARCHAR(20) | Migration depuis metadata |
| 11 | repair_status | VARCHAR(20) | Migration depuis metadata |
| 12 | repair_shop_id | UUID | NULL (à configurer) |
| 13 | estimated_repair_days | INTEGER | Migration depuis metadata |
| 14 | actual_repair_days | INTEGER | Migration depuis metadata |
| 15 | repair_invoice_id | UUID | NULL (à lier manuellement) |
| 16 | downtime_hours | INTEGER | Migration depuis metadata |
| 17 | photos | JSONB | Migration depuis metadata |

**Actions Session 14** :

```sql
-- ACTION 1: Migration assignment_id depuis driver_id et vehicle_id
UPDATE flt_vehicle_events e
SET assignment_id = (
  SELECT a.id
  FROM flt_vehicle_assignments a
  WHERE a.driver_id = e.driver_id
  AND a.vehicle_id = e.vehicle_id
  AND e.event_date BETWEEN a.start_date AND COALESCE(a.end_date, NOW())
  ORDER BY a.start_date DESC
  LIMIT 1
)
WHERE assignment_id IS NULL
AND driver_id IS NOT NULL;

-- ACTION 2: Migration responsible_party depuis metadata
UPDATE flt_vehicle_events
SET responsible_party = COALESCE(metadata->>'responsible_party', 'fleet')
WHERE responsible_party IS NULL;

-- ACTION 3: Migration fault_percentage depuis metadata
UPDATE flt_vehicle_events
SET fault_percentage = COALESCE((metadata->>'fault_percentage')::INTEGER, 0)
WHERE fault_percentage IS NULL;

-- ACTION 4: Migration severity depuis event_type
UPDATE flt_vehicle_events
SET severity = CASE event_type
  WHEN 'accident' THEN COALESCE(metadata->>'severity', 'moderate')
  WHEN 'breakdown' THEN 'minor'
  WHEN 'theft' THEN 'total_loss'
  ELSE 'minor'
END
WHERE severity IS NULL
AND event_type IN ('accident', 'breakdown', 'theft');

-- ACTION 5: Migration police report depuis metadata
UPDATE flt_vehicle_events
SET
  police_report_number = metadata->>'police_report_number',
  police_station = metadata->>'police_station'
WHERE metadata IS NOT NULL
AND police_report_number IS NULL;

-- ACTION 6: Migration claim_status et repair_status depuis metadata
UPDATE flt_vehicle_events
SET
  claim_status = metadata->>'claim_status',
  repair_status = metadata->>'repair_status'
WHERE metadata IS NOT NULL;

-- ACTION 7: Migration repair details depuis metadata
UPDATE flt_vehicle_events
SET
  estimated_repair_days = (metadata->>'estimated_repair_days')::INTEGER,
  actual_repair_days = (metadata->>'actual_repair_days')::INTEGER,
  downtime_hours = (metadata->>'downtime_hours')::INTEGER
WHERE metadata IS NOT NULL;

-- ACTION 8: Migration photos depuis metadata
UPDATE flt_vehicle_events
SET photos = metadata->'photos'
WHERE photos IS NULL
AND metadata IS NOT NULL;
```

**Notes critiques** :
- ⚠️ `assignment_id` calculé automatiquement depuis driver_id et vehicle_id
- ⚠️ `severity` inféré depuis event_type pour events passés
- ⚠️ `responsible_party` défaut 'fleet' si non spécifié
- ⚠️ Liens vers insurance claims et repair invoices à configurer manuellement

---

#### Table 4: `flt_vehicle_maintenance`

**Colonnes V2 ajoutées** (23 colonnes)

| # | Colonne SQL | Type SQL | Action Session 14 |
|---|-------------|----------|-------------------|
| 1 | actual_start | TIMESTAMPTZ | Migration depuis metadata |
| 2 | actual_end | TIMESTAMPTZ | Migration depuis metadata |
| 3 | maintenance_category | VARCHAR(20) | Inférer depuis maintenance_type |
| 4 | priority | VARCHAR(20) | Défaut 'medium' |
| 5 | regulatory_requirement | BOOLEAN | Inférer depuis maintenance_type |
| 6 | blocking_vehicle | BOOLEAN | true si status 'in_progress' |
| 7 | warranty_covered | BOOLEAN | Migration depuis metadata |
| 8 | warranty_claim_number | TEXT | Migration depuis metadata |
| 9 | warranty_amount | DECIMAL(18,2) | Migration depuis metadata |
| 10 | insurance_covered | BOOLEAN | Migration depuis metadata |
| 11 | insurance_claim_ref | TEXT | Migration depuis metadata |
| 12 | requested_by | UUID | Migration depuis created_by |
| 13 | requested_at | TIMESTAMPTZ | Migration depuis created_at |
| 14 | approved_by | UUID | NULL (workflow V2) |
| 15 | approved_at | TIMESTAMPTZ | NULL (workflow V2) |
| 16 | approval_notes | TEXT | NULL |
| 17 | labor_hours | DECIMAL(8,2) | Calculer depuis cost / labor_rate |
| 18 | labor_rate | DECIMAL(18,2) | Défaut 50 AED/heure |
| 19 | labor_cost | DECIMAL(18,2) | Migration depuis metadata |
| 20 | parts_cost | DECIMAL(18,2) | Migration depuis metadata |
| 21 | other_costs | DECIMAL(18,2) | Migration depuis metadata |
| 22 | tax_amount | DECIMAL(18,2) | Calculer 5% VAT |
| 23 | total_cost_excl_tax | DECIMAL(18,2) | Somme labor + parts + other |
| 24 | total_cost_incl_tax | DECIMAL(18,2) | total_excl_tax + tax_amount |
| 25 | currency | CHAR(3) | 'AED' par défaut |
| 26 | parts_detail | JSONB | Migration depuis metadata |
| 27 | garage_id | UUID | NULL (à configurer) |
| 28 | work_order_number | TEXT | Migration depuis metadata |
| 29 | mechanic_name | TEXT | Migration depuis metadata |
| 30 | mechanic_certification | TEXT | NULL |
| 31 | quality_check_by | UUID | NULL (workflow V2) |
| 32 | quality_check_at | TIMESTAMPTZ | NULL (workflow V2) |
| 33 | blocked_periods | JSONB | Calculer depuis actual_start/end |

**Actions Session 14** :

```sql
-- ACTION 1: Migration maintenance_category depuis maintenance_type
UPDATE flt_vehicle_maintenance
SET maintenance_category = CASE maintenance_type
  WHEN 'inspection' THEN 'regulatory'
  WHEN 'oil_change' THEN 'preventive'
  WHEN 'tire_rotation' THEN 'preventive'
  WHEN 'brake_service' THEN 'corrective'
  WHEN 'engine_service' THEN 'corrective'
  WHEN 'transmission_service' THEN 'corrective'
  WHEN 'battery_replacement' THEN 'corrective'
  ELSE 'preventive'
END
WHERE maintenance_category IS NULL;

-- ACTION 2: Migration priority (défaut medium)
UPDATE flt_vehicle_maintenance
SET priority = 'medium'
WHERE priority IS NULL;

-- ACTION 3: Migration regulatory_requirement
UPDATE flt_vehicle_maintenance
SET regulatory_requirement = (maintenance_type IN ('inspection', 'alignment'))
WHERE regulatory_requirement = false;

-- ACTION 4: Migration blocking_vehicle depuis status
UPDATE flt_vehicle_maintenance
SET blocking_vehicle = (status = 'in_progress')
WHERE blocking_vehicle = false;

-- ACTION 5: Migration warranty et insurance depuis metadata
UPDATE flt_vehicle_maintenance
SET
  warranty_covered = COALESCE((metadata->>'warranty_covered')::BOOLEAN, false),
  warranty_claim_number = metadata->>'warranty_claim_number',
  warranty_amount = (metadata->>'warranty_amount')::DECIMAL(18,2),
  insurance_covered = COALESCE((metadata->>'insurance_covered')::BOOLEAN, false),
  insurance_claim_ref = metadata->>'insurance_claim_ref'
WHERE metadata IS NOT NULL;

-- ACTION 6: Migration workflow fields
UPDATE flt_vehicle_maintenance
SET
  requested_by = created_by,
  requested_at = created_at
WHERE requested_by IS NULL;

-- ACTION 7: Migration cost breakdown depuis metadata
UPDATE flt_vehicle_maintenance
SET
  labor_cost = (metadata->>'labor_cost')::DECIMAL(18,2),
  parts_cost = (metadata->>'parts_cost')::DECIMAL(18,2),
  other_costs = (metadata->>'other_costs')::DECIMAL(18,2)
WHERE metadata IS NOT NULL;

-- ACTION 8: Calcul labor_rate défaut 50 AED/heure
UPDATE flt_vehicle_maintenance
SET labor_rate = 50.0
WHERE labor_rate IS NULL;

-- ACTION 9: Calcul labor_hours depuis labor_cost
UPDATE flt_vehicle_maintenance
SET labor_hours = labor_cost / NULLIF(labor_rate, 0)
WHERE labor_hours IS NULL
AND labor_cost IS NOT NULL
AND labor_rate IS NOT NULL;

-- ACTION 10: Calcul total_cost_excl_tax
UPDATE flt_vehicle_maintenance
SET total_cost_excl_tax = COALESCE(labor_cost, 0) + COALESCE(parts_cost, 0) + COALESCE(other_costs, 0)
WHERE total_cost_excl_tax IS NULL;

-- Note: tax_amount doit venir de configuration tenant (pas de hardcode)
-- Les taux de TVA varient selon pays/juridiction

-- ACTION 11: Calcul total_cost_incl_tax
UPDATE flt_vehicle_maintenance
SET total_cost_incl_tax = total_cost_excl_tax + COALESCE(tax_amount, 0)
WHERE total_cost_incl_tax IS NULL
AND total_cost_excl_tax IS NOT NULL;

-- Note: currency doit venir de configuration tenant (pas de hardcode)

-- ACTION 13: Migration parts_detail depuis metadata
UPDATE flt_vehicle_maintenance
SET parts_detail = metadata->'parts_detail'
WHERE parts_detail IS NULL
AND metadata IS NOT NULL;

-- ACTION 15: Migration garage et mechanic depuis metadata
UPDATE flt_vehicle_maintenance
SET
  work_order_number = metadata->>'work_order_number',
  mechanic_name = metadata->>'mechanic_name'
WHERE metadata IS NOT NULL;
```

**Notes critiques** :
- ⚠️ `maintenance_category` inféré depuis maintenance_type
- ⚠️ Coûts calculés automatiquement (labor + parts + other + 5% VAT)
- ⚠️ `labor_rate` défaut 50 AED/heure UAE
- ⚠️ Workflow V2 (approved_by, quality_check_by) NULL pour maintenances passées

---

#### Table 5: `flt_vehicle_expenses`

**Colonnes V2 ajoutées** (26 colonnes)

| # | Colonne SQL | Type SQL | Action Session 14 |
|---|-------------|----------|-------------------|
| 1 | expense_subcategory | VARCHAR(50) | Migration depuis metadata |
| 2 | period_start | DATE | NULL (subscriptions uniquement) |
| 3 | period_end | DATE | NULL (subscriptions uniquement) |
| 4 | mileage_start | INTEGER | NULL (trip-based expenses) |
| 5 | mileage_end | INTEGER | NULL (trip-based expenses) |
| 6 | trip_ids | UUID[] | NULL (lien vers TRP future) |
| 7 | requires_approval | BOOLEAN | true si amount > 100 AED |
| 8 | approval_threshold | DECIMAL(18,2) | 100 AED par défaut |
| 9 | approval_status | VARCHAR(20) | Migration depuis metadata |
| 10 | approved_by | UUID | Migration depuis metadata |
| 11 | approved_at | TIMESTAMPTZ | Migration depuis metadata |
| 12 | rejection_reason | TEXT | Migration depuis metadata |
| 13 | receipt_status | VARCHAR(20) | Inférer depuis receipt_url |
| 14 | receipt_verified_by | UUID | NULL (workflow V2) |
| 15 | receipt_verified_at | TIMESTAMPTZ | NULL (workflow V2) |
| 16 | receipt_issues | JSONB | NULL |
| 17 | ocr_extracted_data | JSONB | NULL (feature V2) |
| 18 | allocation_rule | VARCHAR(20) | Migration depuis metadata |
| 19 | driver_share_percent | INTEGER | Migration depuis metadata |
| 20 | fleet_share_percent | INTEGER | Migration depuis metadata |
| 21 | client_share_percent | INTEGER | NULL |
| 22 | cost_center_id | UUID | NULL (à configurer) |
| 23 | payment_batch_id | UUID | NULL (batch payments V2) |
| 24 | payment_status | VARCHAR(20) | Migration depuis metadata |
| 25 | payment_date | DATE | Migration depuis metadata |
| 26 | payment_reference | TEXT | Migration depuis metadata |

**Actions Session 14** :

```sql
-- ACTION 1: Migration expense_subcategory depuis metadata
UPDATE flt_vehicle_expenses
SET expense_subcategory = metadata->>'expense_subcategory'
WHERE expense_subcategory IS NULL
AND metadata IS NOT NULL;

-- ACTION 2: Migration requires_approval (threshold 100 AED)
UPDATE flt_vehicle_expenses
SET
  requires_approval = (amount > 100),
  approval_threshold = 100.0
WHERE requires_approval = true;

-- ACTION 3: Migration approval_status depuis metadata
UPDATE flt_vehicle_expenses
SET approval_status = COALESCE(metadata->>'approval_status', 'pending')
WHERE approval_status IS NULL;

-- ACTION 4: Migration approval fields depuis metadata
UPDATE flt_vehicle_expenses
SET
  approved_by = (metadata->>'approved_by')::UUID,
  approved_at = (metadata->>'approved_at')::TIMESTAMPTZ,
  rejection_reason = metadata->>'rejection_reason'
WHERE metadata IS NOT NULL;

-- ACTION 5: Migration receipt_status depuis receipt_url
UPDATE flt_vehicle_expenses
SET receipt_status = CASE
  WHEN receipt_url IS NOT NULL THEN 'verified'
  ELSE 'missing'
END
WHERE receipt_status IS NULL;

-- ACTION 6: Migration allocation_rule depuis metadata
UPDATE flt_vehicle_expenses
SET
  allocation_rule = COALESCE(metadata->>'allocation_rule', 'fleet'),
  driver_share_percent = COALESCE((metadata->>'driver_share_percent')::INTEGER, 0),
  fleet_share_percent = COALESCE((metadata->>'fleet_share_percent')::INTEGER, 100)
WHERE metadata IS NOT NULL;

-- ACTION 7: Migration payment fields depuis metadata
UPDATE flt_vehicle_expenses
SET
  payment_status = COALESCE(metadata->>'payment_status', 'pending'),
  payment_date = (metadata->>'payment_date')::DATE,
  payment_reference = metadata->>'payment_reference'
WHERE metadata IS NOT NULL;
```

**Notes critiques** :
- ⚠️ `requires_approval` calculé automatiquement (amount > 100 AED)
- ⚠️ `receipt_status` inféré depuis receipt_url (verified si présent, missing sinon)
- ⚠️ `allocation_rule` défaut 'fleet' (100% fleet, 0% driver)
- ⚠️ Workflow V2 (receipt_verified_by, OCR) NULL pour expenses passés

---

#### Table 6: `flt_vehicle_insurances`

**Colonnes V2 ajoutées** (35 colonnes)

| # | Colonne SQL | Type SQL | Action Session 14 |
|---|-------------|----------|-------------------|
| 1 | policy_category | VARCHAR(20) | 'main' par défaut |
| 2 | policy_priority | INTEGER | 1 par défaut |
| 3 | parent_policy_id | UUID | NULL (main policy) |
| 4 | coverage_territories | TEXT[] | ['AE'] par défaut |
| 5 | coverage_drivers | VARCHAR(20) | 'any' par défaut |
| 6 | driver_restrictions | JSONB | Migration depuis metadata |
| 7 | vehicle_usage | VARCHAR(20) | 'commercial' par défaut |
| 8 | base_premium | DECIMAL(18,2) | Migration depuis premium |
| 9 | excess_details | JSONB | Migration depuis metadata |
| 10 | no_claims_years | INTEGER | Migration depuis metadata ou 0 |
| 11 | no_claims_bonus | INTEGER | Migration depuis metadata ou 0 |
| 12 | claims_loading | INTEGER | Migration depuis metadata ou 0 |
| 13 | claims_count | INTEGER | Migration depuis metadata ou 0 |
| 14 | claims_detail | JSONB | Migration depuis metadata |
| 15 | total_claims_amount | DECIMAL(18,2) | Migration depuis metadata |
| 16 | claims_ratio | DECIMAL(8,4) | Calculer total_claims / premium |
| 17 | risk_rating | VARCHAR(10) | Inférer depuis claims_count |
| 18 | risk_factors | JSONB | Migration depuis metadata |
| 19 | special_conditions | JSONB | Migration depuis metadata |
| 20 | exclusions | JSONB | Migration depuis metadata |
| 21 | broker_id | UUID | NULL (à configurer) |
| 22 | broker_commission | DECIMAL(5,2) | Migration depuis metadata |
| 23 | broker_reference | TEXT | Migration depuis metadata |
| 24 | renewal_date | DATE | Calculer end_date - 30 jours |
| 25 | renewal_notice_sent | BOOLEAN | false par défaut |
| 26 | renewal_quote | DECIMAL(18,2) | NULL |
| 27 | competitor_quotes | JSONB | NULL |
| 28 | payment_frequency | VARCHAR(20) | 'annual' par défaut |
| 29 | payment_method | VARCHAR(20) | Migration depuis metadata |
| 30 | payment_schedule | JSONB | Migration depuis metadata |
| 31 | next_payment_date | DATE | Calculer depuis start_date |
| 32 | outstanding_amount | DECIMAL(18,2) | 0 par défaut |
| 33 | co_insurance | BOOLEAN | false par défaut |
| 34 | co_insurers | JSONB | NULL |
| 35 | lead_insurer | VARCHAR(200) | Copier depuis insurer_name |

**Actions Session 14** :

```sql
-- ACTION 1: Migration policy_category défaut 'main'
UPDATE flt_vehicle_insurances
SET policy_category = 'main'
WHERE policy_category IS NULL;

-- ACTION 2: Migration policy_priority défaut 1
UPDATE flt_vehicle_insurances
SET policy_priority = 1
WHERE policy_priority IS NULL;

-- ACTION 3: Migration coverage_territories défaut AE
UPDATE flt_vehicle_insurances
SET coverage_territories = ARRAY['AE']
WHERE coverage_territories IS NULL;

-- ACTION 4: Migration coverage_drivers défaut 'any'
UPDATE flt_vehicle_insurances
SET coverage_drivers = 'any'
WHERE coverage_drivers IS NULL;

-- ACTION 5: Migration vehicle_usage défaut 'commercial'
UPDATE flt_vehicle_insurances
SET vehicle_usage = 'commercial'
WHERE vehicle_usage IS NULL;

-- ACTION 6: Migration base_premium depuis premium
UPDATE flt_vehicle_insurances
SET base_premium = premium
WHERE base_premium IS NULL
AND premium IS NOT NULL;

-- ACTION 7: Migration bonus/malus depuis metadata
UPDATE flt_vehicle_insurances
SET
  no_claims_years = COALESCE((metadata->>'no_claims_years')::INTEGER, 0),
  no_claims_bonus = COALESCE((metadata->>'no_claims_bonus')::INTEGER, 0),
  claims_loading = COALESCE((metadata->>'claims_loading')::INTEGER, 0)
WHERE metadata IS NOT NULL;

-- ACTION 8: Migration claims tracking depuis metadata
UPDATE flt_vehicle_insurances
SET
  claims_count = COALESCE((metadata->>'claims_count')::INTEGER, 0),
  claims_detail = metadata->'claims_detail',
  total_claims_amount = (metadata->>'total_claims_amount')::DECIMAL(18,2)
WHERE metadata IS NOT NULL;

-- ACTION 9: Calcul claims_ratio
UPDATE flt_vehicle_insurances
SET claims_ratio = total_claims_amount / NULLIF(premium, 0)
WHERE claims_ratio IS NULL
AND total_claims_amount IS NOT NULL
AND premium IS NOT NULL;

-- ACTION 10: Calcul risk_rating depuis claims_count
UPDATE flt_vehicle_insurances
SET risk_rating = CASE
  WHEN claims_count = 0 THEN 'A'
  WHEN claims_count = 1 THEN 'B'
  WHEN claims_count = 2 THEN 'C'
  WHEN claims_count >= 3 THEN 'D'
  ELSE 'C'
END
WHERE risk_rating IS NULL;

-- ACTION 11: Migration risk et conditions depuis metadata
UPDATE flt_vehicle_insurances
SET
  risk_factors = metadata->'risk_factors',
  special_conditions = metadata->'special_conditions',
  exclusions = metadata->'exclusions'
WHERE metadata IS NOT NULL;

-- ACTION 12: Migration broker depuis metadata
UPDATE flt_vehicle_insurances
SET
  broker_commission = (metadata->>'broker_commission')::DECIMAL(5,2),
  broker_reference = metadata->>'broker_reference'
WHERE metadata IS NOT NULL;

-- ACTION 13: Calcul renewal_date (end_date - 30 jours)
UPDATE flt_vehicle_insurances
SET renewal_date = end_date - INTERVAL '30 days'
WHERE renewal_date IS NULL
AND end_date IS NOT NULL;

-- ACTION 14: Migration payment frequency défaut 'annual'
UPDATE flt_vehicle_insurances
SET payment_frequency = 'annual'
WHERE payment_frequency IS NULL;

-- ACTION 15: Migration payment method depuis metadata
UPDATE flt_vehicle_insurances
SET
  payment_method = metadata->>'payment_method',
  payment_schedule = metadata->'payment_schedule'
WHERE metadata IS NOT NULL;

-- ACTION 16: Calcul next_payment_date
UPDATE flt_vehicle_insurances
SET next_payment_date = CASE payment_frequency
  WHEN 'monthly' THEN start_date + INTERVAL '1 month'
  WHEN 'quarterly' THEN start_date + INTERVAL '3 months'
  WHEN 'semi_annual' THEN start_date + INTERVAL '6 months'
  ELSE start_date + INTERVAL '1 year'
END
WHERE next_payment_date IS NULL
AND start_date IS NOT NULL;

-- ACTION 17: Migration outstanding_amount défaut 0
UPDATE flt_vehicle_insurances
SET outstanding_amount = 0.0
WHERE outstanding_amount IS NULL;

-- ACTION 18: Migration co_insurance défaut false
UPDATE flt_vehicle_insurances
SET co_insurance = false
WHERE co_insurance = false;

-- ACTION 19: Migration lead_insurer depuis insurer_name
UPDATE flt_vehicle_insurances
SET lead_insurer = insurer_name
WHERE lead_insurer IS NULL
AND insurer_name IS NOT NULL;
```

**Notes critiques** :
- ⚠️ `policy_category` défaut 'main' (principal policy)
- ⚠️ `coverage_territories` défaut ['AE'] (UAE)
- ⚠️ `risk_rating` calculé depuis claims_count (A=0, B=1, C=2, D=3+)
- ⚠️ `claims_ratio` calculé automatiquement (total_claims / premium)
- ⚠️ `renewal_date` calculé automatiquement (end_date - 30 jours)
- ⚠️ `next_payment_date` calculé depuis payment_frequency

---

#### Tables satellites nouvelles V2 (pas de migration données)

**4 nouvelles tables V2** :
1. `dir_vehicle_statuses` - Table référentiel (à peupler manuellement)
2. `dir_ownership_types` - Table référentiel (à peupler manuellement)
3. `flt_vehicle_inspections` - Nouvelle fonctionnalité (vide en V2)
4. `flt_vehicle_equipments` - Nouvelle fonctionnalité (vide en V2)

**Actions Session 14** : Peuplement initial des référentiels

```sql
-- Peuplement dir_vehicle_statuses (statuts standards)
INSERT INTO dir_vehicle_statuses (id, code, name, created_by, blocking_status)
VALUES
  (gen_random_uuid(), 'available', 'Available', 'system_user_id', false),
  (gen_random_uuid(), 'assigned', 'Assigned to Driver', 'system_user_id', false),
  (gen_random_uuid(), 'maintenance', 'In Maintenance', 'system_user_id', true),
  (gen_random_uuid(), 'accident', 'Accident Repair', 'system_user_id', true),
  (gen_random_uuid(), 'inspection', 'Inspection Required', 'system_user_id', true),
  (gen_random_uuid(), 'retired', 'Retired from Fleet', 'system_user_id', true)
ON CONFLICT (code) DO NOTHING;

-- Peuplement dir_ownership_types (types standards)
INSERT INTO dir_ownership_types (id, code, name, created_by, requires_owner, depreciation)
VALUES
  (gen_random_uuid(), 'owned', 'Owned by Fleet', 'system_user_id', false, true),
  (gen_random_uuid(), 'leased', 'Leased Vehicle', 'system_user_id', true, false),
  (gen_random_uuid(), 'rental', 'Rental (Short-term)', 'system_user_id', true, false),
  (gen_random_uuid(), 'driver_owned', 'Driver-Owned (Partnership)', 'system_user_id', true, false)
ON CONFLICT (code) DO NOTHING;
```

**Notes critiques** :
- ⚠️ Référentiels à peupler avec system_user_id (remplacer par UUID réel)
- ⚠️ Statuts standards : available, assigned, maintenance, accident, inspection, retired
- ⚠️ Types ownership : owned, leased, rental, driver_owned

---

### Module SCH (Session 10)

#### Table 1: `sch_shifts`

**Colonnes V2 ajoutées** (20 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | shiftTypeId | shift_type_id | UUID | NULL jusqu'au peuplement sch_shift_types |
| 2 | shiftCategory | shift_category | VARCHAR(50) | Inférer depuis metadata ou NULL |
| 3 | locationId | location_id | UUID | NULL jusqu'au peuplement sch_locations |
| 4 | zoneName | zone_name | VARCHAR(255) | Extraction depuis metadata |
| 5 | checkInAt | check_in_at | TIMESTAMPTZ(6) | Historique à NULL, nouveaux records via app |
| 6 | checkOutAt | check_out_at | TIMESTAMPTZ(6) | Historique à NULL, nouveaux records via app |
| 7 | breakDurationMinutes | break_duration_minutes | INTEGER | Défaut 60 (1 heure) |
| 8 | actualWorkMinutes | actual_work_minutes | INTEGER | Calcul (checkOut - checkIn) / 60000 |
| 9 | payMultiplier | pay_multiplier | DECIMAL(4,2) | Défaut 1.0 (shift normal) |
| 10 | status | status_v2 | shift_status | Migration depuis status VARCHAR V1 |
| 11 | approvedBy | approved_by | UUID | NULL (approvals futurs) |
| 12 | approvedAt | approved_at | TIMESTAMPTZ(6) | NULL (approvals futurs) |
| 13 | cancellationReason | cancellation_reason | VARCHAR(255) | Migration depuis notes si status=cancelled |
| 14 | replacementDriverId | replacement_driver_id | UUID | NULL (fonctionnalité future) |
| 15 | metadata | metadata | JSONB | Conservation metadata V1 existant |
| 16 | createdBy | created_by | UUID | Défaut system_user_id |
| 17 | updatedBy | updated_by | UUID | NULL |
| 18 | deletedAt | deleted_at | TIMESTAMPTZ(6) | NULL (soft delete) |
| 19 | deletedBy | deleted_by | UUID | NULL |
| 20 | deletionReason | deletion_reason | TEXT | NULL |

**Colonnes V1 conservées** :
- `id`, `tenant_id`, `driver_id`, `start_time`, `end_time`, `notes`
- `created_at`, `updated_at`
- ⚠️ `status` VARCHAR conservé en V1 (coexistence avec `status_v2` enum)

**Actions Session 14** :

```sql
-- ACTION 1: Migration status VARCHAR → status_v2 enum
UPDATE sch_shifts
SET status_v2 = CASE
  WHEN LOWER(status) IN ('scheduled', 'active') THEN 'scheduled'::shift_status
  WHEN LOWER(status) IN ('completed', 'done', 'finished') THEN 'completed'::shift_status
  WHEN LOWER(status) IN ('cancelled', 'canceled') THEN 'cancelled'::shift_status
  WHEN LOWER(status) = 'no_show' THEN 'no_show'::shift_status
  WHEN LOWER(status) = 'partial' THEN 'partial'::shift_status
  ELSE 'scheduled'::shift_status
END
WHERE status_v2 IS NULL
AND status IS NOT NULL;

-- ACTION 2: Calcul actual_work_minutes depuis start_time/end_time
UPDATE sch_shifts
SET actual_work_minutes = EXTRACT(EPOCH FROM (end_time - start_time)) / 60
WHERE actual_work_minutes IS NULL
AND start_time IS NOT NULL
AND end_time IS NOT NULL
AND end_time > start_time;

-- ACTION 3: Migration pay_multiplier défaut 1.0 (shift normal)
UPDATE sch_shifts
SET pay_multiplier = 1.0
WHERE pay_multiplier IS NULL;

-- ACTION 4: Migration break_duration_minutes défaut 60 minutes
UPDATE sch_shifts
SET break_duration_minutes = 60
WHERE break_duration_minutes IS NULL;

-- ACTION 5: Extraction zone_name depuis metadata
UPDATE sch_shifts
SET zone_name = metadata->>'zone'
WHERE zone_name IS NULL
AND metadata ? 'zone';

-- ACTION 6: Migration cancellation_reason depuis notes si cancelled
UPDATE sch_shifts
SET cancellation_reason = LEFT(notes, 255)
WHERE cancellation_reason IS NULL
AND status_v2 = 'cancelled'
AND notes IS NOT NULL;

-- ACTION 7: Migration created_by défaut system_user_id
UPDATE sch_shifts
SET created_by = 'system_user_id' -- ⚠️ Remplacer par UUID réel
WHERE created_by IS NULL;
```

**Notes critiques** :
- ⚠️ **CONFLIT NOMMAGE** : `status` VARCHAR V1 coexiste avec `status_v2` enum
- ⚠️ `actual_work_minutes` calculé automatiquement depuis timestamps
- ⚠️ `pay_multiplier` défaut 1.0 (shift jour normal, pas de prime)
- ⚠️ `check_in_at` / `check_out_at` NULL pour historique (fonctionnalité nouvelle)

---

#### Table 2: `sch_maintenance_schedules`

**Colonnes V2 ajoutées** (24 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | maintenanceTypeId | maintenance_type_id | UUID | NULL jusqu'au peuplement dir_maintenance_types |
| 2 | scheduledBy | scheduled_by | UUID | Défaut created_by ou system_user_id |
| 3 | priority | priority_v2 | maintenance_priority | Migration depuis priority VARCHAR V1 |
| 4 | estimatedDurationHours | estimated_duration_hours | DECIMAL(5,2) | Défaut 2.0 heures |
| 5 | estimatedCost | estimated_cost | DECIMAL(10,2) | NULL (à estimer manuellement) |
| 6 | odometerReading | odometer_reading | INTEGER | NULL (non disponible historique) |
| 7 | triggerType | trigger_type | maintenance_trigger_type | Inférer 'time_based' par défaut |
| 8 | reminderSentAt | reminder_sent_at | TIMESTAMPTZ(6) | NULL (fonctionnalité nouvelle) |
| 9 | reminderCount | reminder_count | INTEGER DEFAULT 0 | Défaut 0 |
| 10 | completedMaintenanceId | completed_maintenance_id | UUID | NULL (lien vers flt_vehicle_maintenance) |
| 11 | rescheduledFrom | rescheduled_from | UUID | NULL (self-reference) |
| 12 | rescheduledReason | rescheduled_reason | TEXT | NULL |
| 13 | blockingOperations | blocking_operations | BOOLEAN DEFAULT false | Défaut false |
| 14 | requiredParts | required_parts | JSONB | NULL |
| 15 | assignedGarage | assigned_garage | VARCHAR(255) | NULL |
| 16 | garageContact | garage_contact | VARCHAR(255) | NULL |
| 17 | notes | notes | TEXT | NULL |
| 18 | status | status_v2 | maintenance_status | Migration depuis status VARCHAR V1 |
| 19 | metadata | metadata | JSONB | NULL |
| 20 | createdBy | created_by | UUID | Défaut system_user_id |
| 21 | updatedBy | updated_by | UUID | NULL |
| 22 | deletedAt | deleted_at | TIMESTAMPTZ(6) | NULL (soft delete) |
| 23 | deletedBy | deleted_by | UUID | NULL |
| 24 | deletionReason | deletion_reason | TEXT | NULL |

**Colonnes V1 conservées** :
- `id`, `tenant_id`, `vehicle_id`, `scheduled_date`
- `created_at`, `updated_at`
- ⚠️ `priority` VARCHAR conservé en V1 (coexistence avec `priority_v2` enum)
- ⚠️ `status` VARCHAR conservé en V1 (coexistence avec `status_v2` enum)

**Actions Session 14** :

```sql
-- ACTION 1: Migration priority VARCHAR → priority_v2 enum
UPDATE sch_maintenance_schedules
SET priority_v2 = CASE
  WHEN LOWER(priority) IN ('low', 'minor') THEN 'low'::maintenance_priority
  WHEN LOWER(priority) IN ('normal', 'medium', 'standard') THEN 'normal'::maintenance_priority
  WHEN LOWER(priority) IN ('high', 'important') THEN 'high'::maintenance_priority
  WHEN LOWER(priority) = 'urgent' THEN 'urgent'::maintenance_priority
  WHEN LOWER(priority) = 'critical' THEN 'critical'::maintenance_priority
  ELSE 'normal'::maintenance_priority
END
WHERE priority_v2 IS NULL
AND priority IS NOT NULL;

-- ACTION 2: Migration status VARCHAR → status_v2 enum
UPDATE sch_maintenance_schedules
SET status_v2 = CASE
  WHEN LOWER(status) IN ('scheduled', 'pending', 'planned') THEN 'scheduled'::maintenance_status
  WHEN LOWER(status) IN ('completed', 'done', 'finished') THEN 'completed'::maintenance_status
  WHEN LOWER(status) IN ('cancelled', 'canceled') THEN 'cancelled'::maintenance_status
  WHEN LOWER(status) = 'overdue' THEN 'overdue'::maintenance_status
  WHEN LOWER(status) IN ('in_progress', 'ongoing') THEN 'in_progress'::maintenance_status
  WHEN LOWER(status) = 'rescheduled' THEN 'rescheduled'::maintenance_status
  ELSE 'scheduled'::maintenance_status
END
WHERE status_v2 IS NULL
AND status IS NOT NULL;

-- ACTION 3: Migration trigger_type défaut 'time_based'
UPDATE sch_maintenance_schedules
SET trigger_type = 'time_based'::maintenance_trigger_type
WHERE trigger_type IS NULL;

-- ACTION 4: Migration estimated_duration_hours défaut 2.0 heures
UPDATE sch_maintenance_schedules
SET estimated_duration_hours = 2.0
WHERE estimated_duration_hours IS NULL;

-- ACTION 5: Migration reminder_count défaut 0
UPDATE sch_maintenance_schedules
SET reminder_count = 0
WHERE reminder_count IS NULL;

-- ACTION 6: Migration blocking_operations défaut false
UPDATE sch_maintenance_schedules
SET blocking_operations = false
WHERE blocking_operations = false;

-- ACTION 7: Migration scheduled_by depuis created_by
UPDATE sch_maintenance_schedules
SET scheduled_by = created_by
WHERE scheduled_by IS NULL
AND created_by IS NOT NULL;

-- ACTION 8: Migration created_by défaut system_user_id
UPDATE sch_maintenance_schedules
SET created_by = 'system_user_id' -- ⚠️ Remplacer par UUID réel
WHERE created_by IS NULL;
```

**Notes critiques** :
- ⚠️ **DOUBLE CONFLIT** : `priority` ET `status` VARCHAR V1 coexistent avec enums V2
- ⚠️ `trigger_type` défaut 'time_based' (maintenance préventive calendaire)
- ⚠️ `blocking_operations` défaut false (véhicule peut continuer opérations)
- ⚠️ `reminder_sent_at` NULL pour historique (fonctionnalité alertes nouvelle)

---

#### Table 3: `sch_goals`

**Colonnes V2 ajoutées** (31 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | goalTypeId | goal_type_id | UUID | NULL jusqu'au peuplement sch_goal_types |
| 2 | goalCategory | goal_category_v2 | goal_category | Migration depuis category VARCHAR V1 |
| 3 | targetType | target_type | goal_target_type | Défaut 'individual' |
| 4 | targetEntityType | target_entity_type | VARCHAR(50) | NULL |
| 5 | targetEntityId | target_entity_id | UUID | NULL |
| 6 | periodType | period_type | goal_period_type | Inférer depuis dates (monthly par défaut) |
| 7 | periodStart | period_start | DATE | Migration depuis start_date V1 |
| 8 | periodEnd | period_end | DATE | Migration depuis end_date V1 |
| 9 | recurrencePattern | recurrence_pattern | VARCHAR(100) | NULL |
| 10 | targetValue | target_value | DECIMAL(12,2) | Migration depuis target V1 |
| 11 | currentValue | current_value | DECIMAL(12,2) DEFAULT 0 | Migration depuis current V1 |
| 12 | progressPercent | progress_percent | DECIMAL(5,2) | Calcul (currentValue / targetValue) * 100 |
| 13 | unit | unit | VARCHAR(50) | Défaut 'trips' |
| 14 | weight | weight | DECIMAL(5,2) DEFAULT 1.0 | Défaut 1.0 |
| 15 | rewardType | reward_type | goal_reward_type | NULL |
| 16 | rewardAmount | reward_amount | DECIMAL(10,2) | NULL |
| 17 | thresholdBronze | threshold_bronze | DECIMAL(12,2) | Calculer 70% de target_value |
| 18 | thresholdSilver | threshold_silver | DECIMAL(12,2) | Calculer 85% de target_value |
| 19 | thresholdGold | threshold_gold | DECIMAL(12,2) | Calculer 100% de target_value |
| 20 | achievementDate | achievement_date | TIMESTAMPTZ(6) | NULL si non atteint |
| 21 | lastCalculatedAt | last_calculated_at | TIMESTAMPTZ(6) | NULL |
| 22 | lastNotifiedAt | last_notified_at | TIMESTAMPTZ(6) | NULL |
| 23 | notificationFrequencyDays | notification_frequency_days | INTEGER | Défaut 7 (hebdo) |
| 24 | status | status_v2 | goal_status | Migration depuis status VARCHAR V1 |
| 25 | notes | notes | TEXT | NULL |
| 26 | metadata | metadata | JSONB | NULL |
| 27 | createdBy | created_by | UUID | Défaut system_user_id |
| 28 | updatedBy | updated_by | UUID | NULL |
| 29 | deletedAt | deleted_at | TIMESTAMPTZ(6) | NULL (soft delete) |
| 30 | deletedBy | deleted_by | UUID | NULL |
| 31 | deletionReason | deletion_reason | TEXT | NULL |

**Colonnes V1 conservées** :
- `id`, `tenant_id`
- `created_at`, `updated_at`
- ⚠️ `category` VARCHAR conservé en V1 (coexistence avec `goal_category_v2` enum)
- ⚠️ `status` VARCHAR conservé en V1 (coexistence avec `status_v2` enum)

**Actions Session 14** :

```sql
-- ACTION 1: Migration goal_category VARCHAR → goal_category_v2 enum
UPDATE sch_goals
SET goal_category_v2 = CASE
  WHEN LOWER(category) IN ('revenue', 'earnings', 'income') THEN 'revenue'::goal_category
  WHEN LOWER(category) IN ('trips', 'rides', 'bookings') THEN 'trips'::goal_category
  WHEN LOWER(category) IN ('quality', 'rating', 'satisfaction') THEN 'quality'::goal_category
  WHEN LOWER(category) IN ('efficiency', 'utilization', 'optimization') THEN 'efficiency'::goal_category
  WHEN LOWER(category) = 'safety' THEN 'safety'::goal_category
  ELSE 'trips'::goal_category
END
WHERE goal_category_v2 IS NULL
AND category IS NOT NULL;

-- ACTION 2: Migration status VARCHAR → status_v2 enum
UPDATE sch_goals
SET status_v2 = CASE
  WHEN LOWER(status) IN ('active', 'ongoing') THEN 'active'::goal_status
  WHEN LOWER(status) = 'in_progress' THEN 'in_progress'::goal_status
  WHEN LOWER(status) IN ('completed', 'done', 'achieved') THEN 'completed'::goal_status
  WHEN LOWER(status) IN ('cancelled', 'canceled') THEN 'cancelled'::goal_status
  WHEN LOWER(status) = 'expired' THEN 'expired'::goal_status
  WHEN LOWER(status) = 'on_track' THEN 'on_track'::goal_status
  WHEN LOWER(status) = 'at_risk' THEN 'at_risk'::goal_status
  WHEN LOWER(status) = 'achieved' THEN 'achieved'::goal_status
  WHEN LOWER(status) = 'exceeded' THEN 'exceeded'::goal_status
  ELSE 'active'::goal_status
END
WHERE status_v2 IS NULL
AND status IS NOT NULL;

-- ACTION 3: Calcul progress_percent automatique
UPDATE sch_goals
SET progress_percent = CASE
  WHEN target_value > 0 THEN ROUND((current_value / target_value * 100)::numeric, 2)
  ELSE 0
END
WHERE progress_percent IS NULL
AND target_value IS NOT NULL
AND current_value IS NOT NULL;

-- ACTION 4: Migration target_type défaut 'individual'
UPDATE sch_goals
SET target_type = 'individual'::goal_target_type
WHERE target_type IS NULL;

-- ACTION 5: Inférer period_type depuis period_start/period_end
UPDATE sch_goals
SET period_type = CASE
  WHEN period_end - period_start <= 1 THEN 'daily'::goal_period_type
  WHEN period_end - period_start <= 7 THEN 'weekly'::goal_period_type
  WHEN period_end - period_start <= 31 THEN 'monthly'::goal_period_type
  WHEN period_end - period_start <= 93 THEN 'quarterly'::goal_period_type
  ELSE 'yearly'::goal_period_type
END
WHERE period_type IS NULL
AND period_start IS NOT NULL
AND period_end IS NOT NULL;

-- ACTION 6: Calcul thresholds bronze/silver/gold
UPDATE sch_goals
SET
  threshold_bronze = ROUND((target_value * 0.70)::numeric, 2),
  threshold_silver = ROUND((target_value * 0.85)::numeric, 2),
  threshold_gold = target_value
WHERE threshold_bronze IS NULL
AND target_value IS NOT NULL;

-- ACTION 7: Migration weight défaut 1.0
UPDATE sch_goals
SET weight = 1.0
WHERE weight IS NULL;

-- ACTION 8: Migration notification_frequency_days défaut 7 (hebdo)
UPDATE sch_goals
SET notification_frequency_days = 7
WHERE notification_frequency_days IS NULL;

-- ACTION 9: Migration unit défaut 'trips'
UPDATE sch_goals
SET unit = 'trips'
WHERE unit IS NULL;

-- ACTION 10: Migration created_by défaut system_user_id
UPDATE sch_goals
SET created_by = 'system_user_id' -- ⚠️ Remplacer par UUID réel
WHERE created_by IS NULL;
```

**Notes critiques** :
- ⚠️ **DOUBLE CONFLIT** : `category` ET `status` VARCHAR V1 coexistent avec enums V2
- ⚠️ `progress_percent` calculé automatiquement (current / target * 100)
- ⚠️ `period_type` inféré depuis durée period_start → period_end
- ⚠️ Thresholds gamification : bronze=70%, silver=85%, gold=100% target
- ⚠️ `target_type` défaut 'individual' (objectifs conducteur)

---

#### Table 4: `sch_tasks`

**Colonnes V2 ajoutées** (40 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | taskTypeId | task_type_id | UUID | NULL jusqu'au peuplement sch_task_types |
| 2 | taskCategory | task_category_v2 | task_category | Migration depuis category VARCHAR V1 |
| 3 | title | title | VARCHAR(255) | Migration depuis name V1 ou subject |
| 4 | description | description | TEXT | Migration depuis description V1 existant |
| 5 | priority | priority_v2 | task_priority | Migration depuis priority VARCHAR V1 |
| 6 | assignedTo | assigned_to | UUID | Migration depuis assigned_to V1 |
| 7 | assignedAt | assigned_at | TIMESTAMPTZ(6) | NULL |
| 8 | assignedBy | assigned_by | UUID | NULL |
| 9 | targetType | target_type | VARCHAR(50) | NULL |
| 10 | targetId | target_id | UUID | NULL |
| 11 | relatedEntityType | related_entity_type | VARCHAR(50) | NULL |
| 12 | relatedEntityId | related_entity_id | UUID | NULL |
| 13 | estimatedDurationMinutes | estimated_duration_minutes | INTEGER | NULL |
| 14 | actualDurationMinutes | actual_duration_minutes | INTEGER | NULL |
| 15 | startDate | start_date | DATE | NULL |
| 16 | dueDate | due_date | DATE | Migration depuis due_date V1 |
| 17 | completedAt | completed_at | TIMESTAMPTZ(6) | Migration depuis completed_at V1 |
| 18 | completedBy | completed_by | UUID | NULL |
| 19 | verificationRequired | verification_required | BOOLEAN DEFAULT false | Défaut false |
| 20 | verifiedBy | verified_by | UUID | NULL |
| 21 | verifiedAt | verified_at | TIMESTAMPTZ(6) | NULL |
| 22 | isAutoGenerated | is_auto_generated | BOOLEAN DEFAULT false | Défaut false |
| 23 | generationTrigger | generation_trigger | VARCHAR(100) | NULL |
| 24 | recurrencePattern | recurrence_pattern | VARCHAR(100) | NULL |
| 25 | parentTaskId | parent_task_id | UUID | NULL (hiérarchie tâches) |
| 26 | blockingTasks | blocking_tasks | UUID[] | Défaut [] |
| 27 | checklist | checklist | JSONB | NULL |
| 28 | attachments | attachments | JSONB | NULL |
| 29 | reminderSentAt | reminder_sent_at | TIMESTAMPTZ(6) | NULL |
| 30 | reminderFrequencyDays | reminder_frequency_days | INTEGER | NULL |
| 31 | escalationLevel | escalation_level | INTEGER DEFAULT 0 | Défaut 0 |
| 32 | escalatedTo | escalated_to | UUID | NULL |
| 33 | tags | tags | TEXT[] | Défaut [] |
| 34 | status | status_v2 | task_status | Migration depuis status VARCHAR V1 |
| 35 | metadata | metadata | JSONB | NULL |
| 36 | createdBy | created_by | UUID | Défaut system_user_id |
| 37 | updatedBy | updated_by | UUID | NULL |
| 38 | deletedAt | deleted_at | TIMESTAMPTZ(6) | NULL (soft delete) |
| 39 | deletedBy | deleted_by | UUID | NULL |
| 40 | deletionReason | deletion_reason | TEXT | NULL |

**Colonnes V1 conservées** :
- `id`, `tenant_id`
- `created_at`, `updated_at`
- ⚠️ `category` VARCHAR conservé en V1 (coexistence avec `task_category_v2` enum)
- ⚠️ `priority` VARCHAR conservé en V1 (coexistence avec `priority_v2` enum)
- ⚠️ `status` VARCHAR conservé en V1 (coexistence avec `status_v2` enum)

**Actions Session 14** :

```sql
-- ACTION 1: Migration task_category VARCHAR → task_category_v2 enum
UPDATE sch_tasks
SET task_category_v2 = CASE
  WHEN LOWER(category) IN ('admin', 'administrative', 'administration') THEN 'admin'::task_category
  WHEN LOWER(category) = 'maintenance' THEN 'maintenance'::task_category
  WHEN LOWER(category) IN ('document', 'documents', 'documentation') THEN 'document'::task_category
  WHEN LOWER(category) = 'training' THEN 'training'::task_category
  WHEN LOWER(category) = 'support' THEN 'support'::task_category
  ELSE 'admin'::task_category
END
WHERE task_category_v2 IS NULL
AND category IS NOT NULL;

-- ACTION 2: Migration priority VARCHAR → priority_v2 enum
UPDATE sch_tasks
SET priority_v2 = CASE
  WHEN LOWER(priority) = 'low' THEN 'low'::task_priority
  WHEN LOWER(priority) IN ('normal', 'medium', 'standard') THEN 'normal'::task_priority
  WHEN LOWER(priority) IN ('high', 'important') THEN 'high'::task_priority
  WHEN LOWER(priority) = 'urgent' THEN 'urgent'::task_priority
  WHEN LOWER(priority) = 'critical' THEN 'critical'::task_priority
  ELSE 'normal'::task_priority
END
WHERE priority_v2 IS NULL
AND priority IS NOT NULL;

-- ACTION 3: Migration status VARCHAR → status_v2 enum
UPDATE sch_tasks
SET status_v2 = CASE
  WHEN LOWER(status) IN ('pending', 'new', 'todo') THEN 'pending'::task_status
  WHEN LOWER(status) IN ('in_progress', 'ongoing', 'started') THEN 'in_progress'::task_status
  WHEN LOWER(status) IN ('completed', 'done', 'finished') THEN 'completed'::task_status
  WHEN LOWER(status) IN ('cancelled', 'canceled') THEN 'cancelled'::task_status
  WHEN LOWER(status) = 'overdue' THEN 'overdue'::task_status
  WHEN LOWER(status) = 'blocked' THEN 'blocked'::task_status
  WHEN LOWER(status) = 'waiting_verification' THEN 'waiting_verification'::task_status
  WHEN LOWER(status) = 'reopened' THEN 'reopened'::task_status
  ELSE 'pending'::task_status
END
WHERE status_v2 IS NULL
AND status IS NOT NULL;

-- ACTION 4: Migration title depuis name V1
UPDATE sch_tasks
SET title = LEFT(name, 255)
WHERE title IS NULL
AND name IS NOT NULL;

-- ACTION 5: Migration escalation_level défaut 0
UPDATE sch_tasks
SET escalation_level = 0
WHERE escalation_level IS NULL;

-- ACTION 6: Migration is_auto_generated défaut false
UPDATE sch_tasks
SET is_auto_generated = false
WHERE is_auto_generated = false;

-- ACTION 7: Migration verification_required défaut false
UPDATE sch_tasks
SET verification_required = false
WHERE verification_required = false;

-- ACTION 8: Migration blocking_tasks défaut []
UPDATE sch_tasks
SET blocking_tasks = '{}'::UUID[]
WHERE blocking_tasks IS NULL;

-- ACTION 9: Migration tags défaut []
UPDATE sch_tasks
SET tags = '{}'::TEXT[]
WHERE tags IS NULL;

-- ACTION 10: Migration created_by défaut system_user_id
UPDATE sch_tasks
SET created_by = 'system_user_id' -- ⚠️ Remplacer par UUID réel
WHERE created_by IS NULL;
```

**Notes critiques** :
- ⚠️ **TRIPLE CONFLIT** : `category`, `priority` ET `status` VARCHAR V1 coexistent avec enums V2
- ⚠️ `escalation_level` défaut 0 (pas d'escalade)
- ⚠️ `verification_required` défaut false (validation non obligatoire)
- ⚠️ `is_auto_generated` défaut false (tâches manuelles)
- ⚠️ `blocking_tasks` array vide par défaut (pas de dépendances)
- ⚠️ `tags` array vide par défaut (pas de tags)

---

#### Tables référentiels nouvelles V2 (peuplement initial)

**8 nouvelles tables V2** :
1. `sch_shift_types` - Types shifts référentiel
2. `dir_maintenance_types` - Types maintenances référentiel (table partagée DIR/SCH)
3. `sch_goal_types` - Types objectifs KPI référentiel
4. `sch_task_types` - Types tâches référentiel
5. `sch_locations` - Zones géographiques référentiel
6. `sch_goal_achievements` - Historique succès (vide initialement)
7. `sch_task_comments` - Commentaires tâches (vide initialement)
8. `sch_task_history` - Audit trail tâches (vide initialement)

**Actions Session 14** : Peuplement initial des référentiels

```sql
-- ============================================================================
-- Peuplement sch_shift_types (types shifts standards)
-- ============================================================================
INSERT INTO sch_shift_types (id, tenant_id, code, label, pay_multiplier, color_code, created_by)
VALUES
  (gen_random_uuid(), NULL, 'DAY_SHIFT', 'Day Shift (08:00-17:00)', 1.0, '#FFA500', 'system_user_id'),
  (gen_random_uuid(), NULL, 'NIGHT_SHIFT', 'Night Shift (20:00-05:00)', 1.5, '#4169E1', 'system_user_id'),
  (gen_random_uuid(), NULL, 'WEEKEND', 'Weekend Shift', 1.25, '#32CD32', 'system_user_id'),
  (gen_random_uuid(), NULL, 'PEAK_HOUR', 'Peak Hour Shift', 1.3, '#FF6347', 'system_user_id'),
  (gen_random_uuid(), NULL, 'SPECIAL_EVENT', 'Special Event', 1.5, '#9370DB', 'system_user_id')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Peuplement dir_maintenance_types (types maintenances standards)
-- ============================================================================
INSERT INTO dir_maintenance_types (id, tenant_id, code, label, category, default_frequency_km, default_frequency_months, estimated_duration_hours, is_mandatory, requires_vehicle_stoppage, created_by)
VALUES
  -- Préventive
  (gen_random_uuid(), NULL, 'OIL_CHANGE', 'Oil Change', 'preventive', 5000, 3, 1.0, true, false, 'system_user_id'),
  (gen_random_uuid(), NULL, 'TIRE_ROTATION', 'Tire Rotation', 'preventive', 10000, 6, 0.5, false, false, 'system_user_id'),
  (gen_random_uuid(), NULL, 'BRAKE_INSPECTION', 'Brake Inspection', 'preventive', 15000, 6, 1.5, true, true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'AIR_FILTER', 'Air Filter Replacement', 'preventive', 20000, 12, 0.5, false, false, 'system_user_id'),

  -- Corrective
  (gen_random_uuid(), NULL, 'ENGINE_REPAIR', 'Engine Repair', 'corrective', NULL, NULL, 8.0, false, true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'TRANSMISSION', 'Transmission Repair', 'corrective', NULL, NULL, 10.0, false, true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'ELECTRICAL', 'Electrical System Repair', 'corrective', NULL, NULL, 4.0, false, true, 'system_user_id'),

  -- Regulatory
  (gen_random_uuid(), NULL, 'ANNUAL_INSPECTION', 'Annual Vehicle Inspection', 'regulatory', NULL, 12, 2.0, true, true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'EMISSIONS_TEST', 'Emissions Test', 'regulatory', NULL, 12, 1.0, true, true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'RTA_INSPECTION', 'RTA Vehicle Inspection (UAE)', 'regulatory', NULL, 12, 2.0, true, true, 'system_user_id')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Peuplement sch_goal_types (types objectifs KPI standards)
-- ============================================================================
INSERT INTO sch_goal_types (id, tenant_id, code, label, category, unit, aggregation_type, is_higher_better, icon, color, created_by)
VALUES
  -- Revenue
  (gen_random_uuid(), NULL, 'MONTHLY_REVENUE', 'Monthly Revenue Target', 'revenue', 'AED', 'sum', true, 'dollar-sign', '#28A745', 'system_user_id'),
  (gen_random_uuid(), NULL, 'AVG_TRIP_REVENUE', 'Average Revenue per Trip', 'revenue', 'AED', 'avg', true, 'trending-up', '#FFC107', 'system_user_id'),

  -- Trips
  (gen_random_uuid(), NULL, 'MONTHLY_TRIPS', 'Monthly Trip Count', 'trips', 'trips', 'count', true, 'map-pin', '#007BFF', 'system_user_id'),
  (gen_random_uuid(), NULL, 'DAILY_TRIPS', 'Daily Trip Target', 'trips', 'trips', 'count', true, 'calendar', '#17A2B8', 'system_user_id'),

  -- Quality
  (gen_random_uuid(), NULL, 'AVG_RATING', 'Average Customer Rating', 'quality', 'stars', 'avg', true, 'star', '#FFD700', 'system_user_id'),
  (gen_random_uuid(), NULL, 'ACCEPTANCE_RATE', 'Booking Acceptance Rate', 'quality', 'percent', 'avg', true, 'check-circle', '#20C997', 'system_user_id'),

  -- Efficiency
  (gen_random_uuid(), NULL, 'UTILIZATION_RATE', 'Vehicle Utilization Rate', 'efficiency', 'percent', 'avg', true, 'activity', '#6F42C1', 'system_user_id'),
  (gen_random_uuid(), NULL, 'AVG_TRIP_TIME', 'Average Trip Duration', 'efficiency', 'minutes', 'avg', false, 'clock', '#FD7E14', 'system_user_id'),

  -- Safety
  (gen_random_uuid(), NULL, 'ZERO_ACCIDENTS', 'Zero Accidents Period', 'safety', 'days', 'max', true, 'shield', '#DC3545', 'system_user_id'),
  (gen_random_uuid(), NULL, 'SAFE_DRIVING_SCORE', 'Safe Driving Score', 'safety', 'score', 'avg', true, 'award', '#E83E8C', 'system_user_id')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Peuplement sch_task_types (types tâches standards)
-- ============================================================================
INSERT INTO sch_task_types (id, tenant_id, code, label, category, default_priority, default_duration_minutes, requires_verification, sla_hours, escalation_hours, created_by)
VALUES
  -- Admin
  (gen_random_uuid(), NULL, 'ONBOARD_DRIVER', 'Onboard New Driver', 'admin', 'high', 120, true, 48, 24, 'system_user_id'),
  (gen_random_uuid(), NULL, 'VERIFY_DOCUMENT', 'Verify Driver Document', 'admin', 'normal', 30, true, 24, 12, 'system_user_id'),

  -- Maintenance
  (gen_random_uuid(), NULL, 'SCHEDULE_MAINTENANCE', 'Schedule Vehicle Maintenance', 'maintenance', 'normal', 15, false, 72, 48, 'system_user_id'),
  (gen_random_uuid(), NULL, 'INSPECT_VEHICLE', 'Vehicle Inspection', 'maintenance', 'high', 60, true, 24, 12, 'system_user_id'),

  -- Document
  (gen_random_uuid(), NULL, 'UPLOAD_INSURANCE', 'Upload Insurance Certificate', 'document', 'high', 20, true, 48, 24, 'system_user_id'),
  (gen_random_uuid(), NULL, 'RENEW_LICENSE', 'Renew Driver License', 'document', 'urgent', 30, true, 24, 6, 'system_user_id'),

  -- Training
  (gen_random_uuid(), NULL, 'COMPLETE_TRAINING', 'Complete Required Training', 'training', 'normal', 240, true, 168, 72, 'system_user_id'),
  (gen_random_uuid(), NULL, 'SAFETY_BRIEFING', 'Safety Briefing Session', 'training', 'high', 60, false, 48, 24, 'system_user_id'),

  -- Support
  (gen_random_uuid(), NULL, 'RESOLVE_COMPLAINT', 'Resolve Customer Complaint', 'support', 'high', 120, true, 24, 6, 'system_user_id'),
  (gen_random_uuid(), NULL, 'FOLLOW_UP', 'Follow Up with Driver', 'support', 'normal', 30, false, 72, NULL, 'system_user_id')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Peuplement sch_locations (zones géographiques Dubai)
-- ============================================================================
INSERT INTO sch_locations (id, tenant_id, name, code, city, country, is_active, created_by)
VALUES
  -- Dubai zones
  (gen_random_uuid(), NULL, 'Downtown Dubai', 'DUBAI_DT', 'Dubai', 'AE', true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'Dubai Marina', 'DUBAI_MAR', 'Dubai', 'AE', true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'Dubai International Airport', 'DUBAI_DXB', 'Dubai', 'AE', true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'Jumeirah', 'DUBAI_JUM', 'Dubai', 'AE', true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'Business Bay', 'DUBAI_BB', 'Dubai', 'AE', true, 'system_user_id'),

  -- Abu Dhabi zones
  (gen_random_uuid(), NULL, 'Abu Dhabi City Center', 'AUH_CTR', 'Abu Dhabi', 'AE', true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'Yas Island', 'AUH_YAS', 'Abu Dhabi', 'AE', true, 'system_user_id'),
  (gen_random_uuid(), NULL, 'Saadiyat Island', 'AUH_SAD', 'Abu Dhabi', 'AE', true, 'system_user_id')
ON CONFLICT (code) DO NOTHING;
```

**Notes critiques** :
- ⚠️ Référentiels à peupler avec `system_user_id` (remplacer par UUID réel avant exécution)
- ⚠️ **Shifts** : 5 types avec pay_multiplier (nuit=1.5x, weekend=1.25x, peak=1.3x)
- ⚠️ **Maintenances** : 10 types (3 préventives, 3 correctives, 4 regulatory incluant RTA UAE)
- ⚠️ **Goals** : 10 KPI types (revenue, trips, quality, efficiency, safety)
- ⚠️ **Tasks** : 10 types avec SLA et escalation (24h → 6h pour urgent)
- ⚠️ **Locations** : 8 zones Dubai + Abu Dhabi (UAE focus)
- ⚠️ `dir_maintenance_types` est une table partagée DIR/SCH mais créée dans session SCH

---

### Module TRP (Session 12)

#### Table 1: `trp_platform_accounts`

**Colonnes V2 ajoutées** (15 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | platformId | platform_id | UUID | Migration depuis dir_platforms (Uber, Careem, Bolt) |
| 2 | accountName | account_name | VARCHAR(255) | Migration depuis metadata ou génération |
| 3 | apiKey | api_key | TEXT | DEPRECATED - À migrer vers trp_platform_account_keys |
| 4 | status | status | platform_account_status DEFAULT 'active' | Migration depuis status V1 ou 'active' |
| 5 | connectedAt | connected_at | TIMESTAMPTZ | Migration depuis created_at si V1 existe |
| 6 | lastSyncAt | last_sync_at | TIMESTAMPTZ | NULL initialement, rempli par sync |
| 7 | lastError | last_error | TEXT | NULL initialement |
| 8 | errorCount | error_count | INTEGER DEFAULT 0 | 0 initialement |
| 9 | syncFrequency | sync_frequency | VARCHAR(50) | 'hourly' par défaut |
| 10 | metadata | metadata | JSONB | Conservation données V1 |
| 11 | createdBy | created_by | UUID | User qui a connecté le compte |
| 12 | updatedBy | updated_by | UUID | Dernière modification |
| 13 | deletedAt | deleted_at | TIMESTAMPTZ | Soft delete |
| 14 | deletedBy | deleted_by | UUID | User qui a supprimé |
| 15 | deletionReason | deletion_reason | TEXT | Raison suppression |

**Colonnes V1 conservées** :
- `id`, `tenant_id`
- `created_at`, `updated_at`

**Actions Session 14** :

```sql
-- ACTION 1: Migration platform_id depuis dir_platforms
-- ⚠️ NOTE IMPORTANTE: dir_platforms est une table EXTENSIBLE
-- Les plateformes initiales (Uber, Careem, Bolt, Yango) sont des exemples
-- Le tenant peut ajouter TOUTES plateformes via UI/API (InDrive, Lyft, DiDi, etc.)
-- Structure flexible: api_config JSONB permet config unique par plateforme
-- Aucun hardcode: pas d'enum plateforme → ajout dynamique sans migration
UPDATE trp_platform_accounts tpa
SET platform_id = (
  SELECT id FROM dir_platforms
  WHERE code = UPPER(tpa.metadata->>'platform_name')
  LIMIT 1
)
WHERE platform_id IS NULL
  AND metadata->>'platform_name' IS NOT NULL;

-- ACTION 2: Génération account_name depuis metadata
UPDATE trp_platform_accounts
SET account_name = COALESCE(
  metadata->>'account_name',
  metadata->>'username',
  'Account #' || LEFT(id::TEXT, 8)
)
WHERE account_name IS NULL;

-- ACTION 3: Migration status VARCHAR V1 → status_v2 enum
UPDATE trp_platform_accounts
SET status_v2 = CASE
  WHEN LOWER(status) = 'inactive' OR metadata->>'is_active' = 'false' THEN 'inactive'::platform_account_status
  WHEN LOWER(status) = 'suspended' OR metadata->>'is_suspended' = 'true' THEN 'suspended'::platform_account_status
  ELSE 'active'::platform_account_status
END
WHERE status_v2 IS NULL;

-- ACTION 4: Migration connected_at depuis created_at
UPDATE trp_platform_accounts
SET connected_at = created_at
WHERE connected_at IS NULL AND created_at IS NOT NULL;

-- Note: sync_frequency doit être défini par configuration tenant (pas de hardcode)

-- ⚠️ ACTION 5: Migration api_key vers trp_platform_account_keys
-- TODO: Script séparé pour chiffrer et migrer api_key vers Vault
-- Cette colonne sera dépréciée et supprimée en Session 16
```

**Notes critiques** :
- ⚠️ **api_key** : Colonne DEPRECATED, à migrer vers `trp_platform_account_keys` avec chiffrement
- ⚠️ **platform_id** : Doit pointer vers `dir_platforms` (Uber, Careem, Bolt, etc.)
- ⚠️ **Cleanup Session 16** : Supprimer colonne `api_key` après migration vers Vault

---

#### Table 2: `trp_trips`

**Colonnes V2 ajoutées** (27 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | platformAccountId | platform_account_id | UUID | Migration depuis account |
| 2 | driverId | driver_id | UUID | Migration depuis rid_drivers |
| 3 | vehicleId | vehicle_id | UUID | Migration depuis flt_vehicles |
| 4 | platformTripId | platform_trip_id | VARCHAR(255) | ID course plateforme (Uber trip ID) |
| 5 | requestedAt | requested_at | TIMESTAMPTZ | V2: Nouveau timestamp début lifecycle |
| 6 | matchedAt | matched_at | TIMESTAMPTZ | V2: Timestamp match driver |
| 7 | acceptedAt | accepted_at | TIMESTAMPTZ | V2: Timestamp acceptation driver |
| 8 | arrivedAt | arrived_at | TIMESTAMPTZ | V2: Timestamp arrivée pickup |
| 9 | startedAt | started_at | TIMESTAMPTZ | Migration depuis V1 start_time |
| 10 | finishedAt | finished_at | TIMESTAMPTZ | Migration depuis V1 end_time |
| 11 | pickupLat | pickup_lat | DECIMAL(10, 7) | Migration depuis V1 pickup_location |
| 12 | pickupLng | pickup_lng | DECIMAL(10, 7) | Migration depuis V1 pickup_location |
| 13 | dropoffLat | dropoff_lat | DECIMAL(10, 7) | Migration depuis V1 dropoff_location |
| 14 | dropoffLng | dropoff_lng | DECIMAL(10, 7) | Migration depuis V1 dropoff_location |
| 15 | distance | distance | DECIMAL(10, 2) | Migration depuis V1 distance |
| 16 | duration | duration | INTEGER | Calculer depuis start_time/end_time |
| 17 | baseFare | base_fare | DECIMAL(10, 2) | V2: Décomposition tarif détaillée |
| 18 | distanceFare | distance_fare | DECIMAL(10, 2) | V2: Tarif distance |
| 19 | timeFare | time_fare | DECIMAL(10, 2) | V2: Tarif temps |
| 20 | surgeMultiplier | surge_multiplier | DECIMAL(4, 2) | V2: Multiplicateur surge pricing |
| 21 | surgeAmount | surge_amount | DECIMAL(10, 2) | V2: Montant surge |
| 22 | tipAmount | tip_amount | DECIMAL(10, 2) | Migration depuis V1 tip |
| 23 | totalFare | total_fare | DECIMAL(10, 2) | Migration depuis V1 total_amount |
| 24 | platformCommission | platform_commission | DECIMAL(10, 2) | Migration depuis V1 commission |
| 25 | netEarnings | net_earnings | DECIMAL(10, 2) | Calculer total_fare - commission |
| 26 | currency | currency | CHAR(3) | 'AED' par défaut (UAE) |
| 27 | status | status | trip_status | Migration depuis V1 status |

**Colonnes Soft Delete** (3 colonnes) : `deleted_at`, `deleted_by`, `deletion_reason`

**Colonnes V1 conservées** :
- `id`, `tenant_id`
- `created_at`, `updated_at`
- `metadata`

**Actions Session 14** :

```sql
-- ACTION 1: Migration timestamps start_time → started_at, end_time → finished_at
UPDATE trp_trips
SET
  started_at = start_time,
  finished_at = end_time
WHERE started_at IS NULL AND start_time IS NOT NULL;

-- ACTION 2: Calcul duration (minutes) depuis timestamps
UPDATE trp_trips
SET duration = EXTRACT(EPOCH FROM (finished_at - started_at)) / 60
WHERE duration IS NULL
  AND started_at IS NOT NULL
  AND finished_at IS NOT NULL;

-- ACTION 3: Migration coordonnées pickup/dropoff depuis POINT ou JSON
-- Hypothèse 1: Si V1 stocke POINT geometry
UPDATE trp_trips
SET
  pickup_lat = ST_Y(pickup_location::geometry),
  pickup_lng = ST_X(pickup_location::geometry),
  dropoff_lat = ST_Y(dropoff_location::geometry),
  dropoff_lng = ST_X(dropoff_location::geometry)
WHERE pickup_lat IS NULL
  AND pickup_location IS NOT NULL;

-- Hypothèse 2: Si V1 stocke JSON {lat, lng}
UPDATE trp_trips
SET
  pickup_lat = (metadata->'pickup'->>'lat')::DECIMAL(10,7),
  pickup_lng = (metadata->'pickup'->>'lng')::DECIMAL(10,7),
  dropoff_lat = (metadata->'dropoff'->>'lat')::DECIMAL(10,7),
  dropoff_lng = (metadata->'dropoff'->>'lng')::DECIMAL(10,7)
WHERE pickup_lat IS NULL
  AND metadata->'pickup'->>'lat' IS NOT NULL;

-- ACTION 4: Migration status VARCHAR V1 → status_v2 enum
UPDATE trp_trips
SET status_v2 = CASE
  WHEN LOWER(status) IN ('completed', 'finished', 'done') THEN 'completed'::trip_status
  WHEN LOWER(status) IN ('cancelled', 'canceled') THEN 'cancelled'::trip_status
  WHEN LOWER(status) = 'rejected' THEN 'rejected'::trip_status
  WHEN LOWER(status) = 'no_show' THEN 'no_show'::trip_status
  ELSE 'completed'::trip_status
END
WHERE status_v2 IS NULL AND status IS NOT NULL;

-- ACTION 5: Calcul net_earnings = total_fare - platform_commission
UPDATE trp_trips
SET net_earnings = COALESCE(total_fare, 0) - COALESCE(platform_commission, 0)
WHERE net_earnings IS NULL
  AND total_fare IS NOT NULL;

-- ACTION 6: Migration tarification détaillée depuis metadata si disponible
-- Note: currency doit être défini par configuration tenant (pas de hardcode)
UPDATE trp_trips
SET
  base_fare = (metadata->'pricing'->>'base_fare')::DECIMAL(10,2),
  distance_fare = (metadata->'pricing'->>'distance_fare')::DECIMAL(10,2),
  time_fare = (metadata->'pricing'->>'time_fare')::DECIMAL(10,2),
  surge_multiplier = (metadata->'pricing'->>'surge_multiplier')::DECIMAL(4,2),
  surge_amount = (metadata->'pricing'->>'surge_amount')::DECIMAL(10,2)
WHERE base_fare IS NULL
  AND metadata->'pricing'->>'base_fare' IS NOT NULL;
```

**Notes critiques** :
- ⚠️ **Timestamps V2** : 6 timestamps lifecycle (requested → matched → accepted → arrived → started → finished)
- ⚠️ **Coordonnées** : Adapter migration selon format V1 (POINT geometry vs JSON)
- ⚠️ **Tarification détaillée** : V2 décompose tarif en base_fare + distance_fare + time_fare + surge
- ⚠️ **Currency** : DOIT venir de configuration tenant (ISO 4217: USD, EUR, AED, etc.)
- ⚠️ **Cleanup Session 16** : Supprimer colonnes V1 `start_time`, `end_time`, `pickup_location`, `dropoff_location` après validation

---

#### Table 3: `trp_settlements`

**Colonnes V2 ajoutées** (22 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | platformAccountId | platform_account_id | UUID | Migration depuis account |
| 2 | tripId | trip_id | UUID | Lien vers trip si settlement unitaire |
| 3 | settlementType | settlement_type | settlement_type DEFAULT 'platform_payout' | 'platform_payout' par défaut |
| 4 | platformSettlementId | platform_settlement_id | VARCHAR(255) | ID settlement plateforme |
| 5 | amount | amount | DECIMAL(14, 2) | Migration depuis V1 amount |
| 6 | commission | commission | DECIMAL(14, 2) | Migration depuis V1 commission |
| 7 | netAmount | net_amount | DECIMAL(14, 2) | Calculer amount - commission |
| 8 | taxAmount | tax_amount | DECIMAL(14, 2) | V2: Montant TVA/taxes |
| 9 | taxRate | tax_rate | DECIMAL(5, 2) | V2: Taux taxe (5% UAE VAT) |
| 10 | exchangeRate | exchange_rate | DECIMAL(10, 6) | V2: Taux change multi-devises |
| 11 | originalCurrency | original_currency | CHAR(3) | V2: Devise origine |
| 12 | originalAmount | original_amount | DECIMAL(14, 2) | V2: Montant devise origine |
| 13 | status | status | settlement_status DEFAULT 'pending' | Migration depuis V1 status |
| 14 | settlementDate | settlement_date | DATE | Date règlement prévue |
| 15 | paidAt | paid_at | TIMESTAMPTZ | Date paiement effectif |
| 16 | cancelledAt | cancelled_at | TIMESTAMPTZ | Date annulation |
| 17 | settlementReference | settlement_reference | VARCHAR(255) | Référence bancaire |
| 18 | reconciled | reconciled | BOOLEAN DEFAULT false | false initialement |
| 19 | reconciliationId | reconciliation_id | UUID | NULL (FK FUTURE vers REV module) |
| 20 | metadata | metadata | JSONB | Conservation données V1 |
| 21 | createdBy / updatedBy | created_by / updated_by | UUID | Audit trail |
| 22 | Soft Delete | deleted_at / deleted_by / deletion_reason | TIMESTAMPTZ / UUID / TEXT | Soft delete |

**Colonnes V1 conservées** :
- `id`, `tenant_id`
- `created_at`, `updated_at`

**Actions Session 14** :

```sql
-- ACTION 1: Migration status VARCHAR V1 → status_v2 enum
UPDATE trp_settlements
SET status_v2 = CASE
  WHEN LOWER(status) IN ('pending', 'scheduled') THEN 'pending'::settlement_status
  WHEN LOWER(status) IN ('settled', 'paid', 'completed') THEN 'settled'::settlement_status
  WHEN LOWER(status) IN ('cancelled', 'canceled', 'failed') THEN 'cancelled'::settlement_status
  ELSE 'pending'::settlement_status
END
WHERE status_v2 IS NULL AND status IS NOT NULL;

-- ACTION 2: Calcul net_amount = amount - commission
UPDATE trp_settlements
SET net_amount = COALESCE(amount, 0) - COALESCE(commission, 0)
WHERE net_amount IS NULL AND amount IS NOT NULL;

-- ACTION 3: Définir settlement_type par défaut
UPDATE trp_settlements
SET settlement_type = 'platform_payout'::settlement_type
WHERE settlement_type IS NULL;

-- ACTION 4: Migration settlement_date depuis metadata ou created_at
UPDATE trp_settlements
SET settlement_date = COALESCE(
  (metadata->>'settlement_date')::DATE,
  created_at::DATE
)
WHERE settlement_date IS NULL;

-- Note: tax_rate et tax_amount doivent venir de configuration tenant (pas de hardcode)
-- Les taux de TVA varient selon pays: UAE 5%, France 20%, Canada 13%, etc.

-- ACTION 5: Initialiser reconciled à false
UPDATE trp_settlements
SET reconciled = false
WHERE reconciled IS NULL;

-- ACTION 7: Migration paid_at depuis metadata si status = 'settled'
UPDATE trp_settlements
SET paid_at = COALESCE(
  (metadata->>'paid_at')::TIMESTAMPTZ,
  updated_at
)
WHERE paid_at IS NULL
  AND status_v2 = 'settled'::settlement_status;
```

**Notes critiques** :
- ⚠️ **Multi-devises** : V2 supporte exchange_rate et original_currency pour settlements multi-devises
- ⚠️ **Taxes** : tax_rate DOIT venir de configuration tenant (varie selon pays/juridiction)
- ⚠️ **Réconciliation** : `reconciliation_id` pointe vers module REV (FK FUTURE, pas encore créé)
- ⚠️ **reconciled** : Flag booléen pour tracking réconciliation, false par défaut
- ⚠️ **Cleanup Session 16** : Supprimer colonnes V1 après validation

---

#### Table 4: `trp_client_invoices`

**Colonnes V2 ajoutées** (18 colonnes)

| # | Colonne Prisma | Colonne SQL | Type SQL | Action Session 14 |
|---|----------------|-------------|----------|-------------------|
| 1 | clientId | client_id | UUID | Migration depuis crm_clients |
| 2 | invoiceNumber | invoice_number | VARCHAR(50) | Génération format INV-YYYY-NNNN |
| 3 | invoiceDate | invoice_date | DATE | Migration depuis created_at |
| 4 | dueDate | due_date | DATE | Calculer invoice_date + 30 jours |
| 5 | pricingPlanId | pricing_plan_id | UUID | Lien vers crm_pricing_plans |
| 6 | clientPoNumber | client_po_number | VARCHAR(100) | PO client B2B |
| 7 | totalAmount | total_amount | DECIMAL(14, 2) | Migration depuis V1 total |
| 8 | discountAmount | discount_amount | DECIMAL(14, 2) | V2: Remises commerciales |
| 9 | discountReason | discount_reason | TEXT | V2: Justification remise |
| 10 | currency | currency | CHAR(3) | 'AED' par défaut |
| 11 | status | status | invoice_status DEFAULT 'draft' | Migration depuis V1 status |
| 12 | paidAt | paid_at | TIMESTAMPTZ | Date paiement |
| 13 | paymentReference | payment_reference | VARCHAR(255) | Référence paiement |
| 14 | paymentMethod | payment_method | payment_method | Mode paiement (bank_transfer, card) |
| 15 | metadata | metadata | JSONB | Conservation données V1 |
| 16 | createdBy / updatedBy | created_by / updated_by | UUID | Audit trail |
| 17 | Soft Delete | deleted_at / deleted_by / deletion_reason | TIMESTAMPTZ / UUID / TEXT | Soft delete |

**Colonnes V1 conservées** :
- `id`, `tenant_id`
- `created_at`, `updated_at`

**Actions Session 14** :

```sql
-- ACTION 1: Génération invoice_number format INV-YYYY-NNNN
UPDATE trp_client_invoices
SET invoice_number = 'INV-' ||
  TO_CHAR(created_at, 'YYYY') || '-' ||
  LPAD(ROW_NUMBER() OVER (PARTITION BY tenant_id, EXTRACT(YEAR FROM created_at) ORDER BY created_at)::TEXT, 4, '0')
WHERE invoice_number IS NULL;

-- ACTION 2: Migration invoice_date depuis created_at
UPDATE trp_client_invoices
SET invoice_date = created_at::DATE
WHERE invoice_date IS NULL AND created_at IS NOT NULL;

-- Note: due_date doit venir de configuration tenant ou contrat client (pas de hardcode)
-- Les termes paiement varient: Net 30, Net 45, Net 60, COD, etc.

-- ACTION 3: Migration status VARCHAR V1 → status_v2 enum
UPDATE trp_client_invoices
SET status_v2 = CASE
  WHEN LOWER(status) IN ('draft', 'pending') THEN 'draft'::trp_invoice_status
  WHEN LOWER(status) = 'sent' THEN 'sent'::trp_invoice_status
  WHEN LOWER(status) = 'viewed' THEN 'viewed'::trp_invoice_status
  WHEN LOWER(status) = 'partially_paid' THEN 'partially_paid'::trp_invoice_status
  WHEN LOWER(status) IN ('paid', 'completed') THEN 'paid'::trp_invoice_status
  WHEN LOWER(status) = 'disputed' THEN 'disputed'::trp_invoice_status
  WHEN LOWER(status) IN ('cancelled', 'canceled') THEN 'cancelled'::trp_invoice_status
  WHEN due_date < CURRENT_DATE AND LOWER(status) IN ('sent', 'viewed') THEN 'overdue'::trp_invoice_status
  ELSE 'draft'::trp_invoice_status
END
WHERE status_v2 IS NULL AND status IS NOT NULL;

-- Note: currency doit venir de configuration tenant (pas de hardcode)

-- ACTION 4: Migration paid_at depuis metadata si status_v2 = 'paid'
UPDATE trp_client_invoices
SET paid_at = COALESCE(
  (metadata->>'paid_at')::TIMESTAMPTZ,
  updated_at
)
WHERE paid_at IS NULL
  AND status_v2 = 'paid'::trp_invoice_status;

-- ACTION 5: Inférer payment_method depuis metadata
UPDATE trp_client_invoices
SET payment_method = CASE
  WHEN metadata->>'payment_method' = 'bank_transfer' THEN 'bank_transfer'::trp_payment_method
  WHEN metadata->>'payment_method' = 'card' THEN 'card'::trp_payment_method
  WHEN metadata->>'payment_method' = 'check' THEN 'check'::trp_payment_method
  WHEN metadata->>'payment_method' = 'cash' THEN 'cash'::trp_payment_method
  ELSE 'bank_transfer'::trp_payment_method
END
WHERE payment_method IS NULL
  AND status_v2 = 'paid'::trp_invoice_status;
```

**Notes critiques** :
- ⚠️ **invoice_number** : Format INV-YYYY-NNNN avec compteur annuel par tenant
- ⚠️ **due_date** : DOIT venir de configuration tenant/contrat client (Net 30, Net 45, Net 60, COD, etc.)
- ⚠️ **currency** : DOIT venir de configuration tenant (ISO 4217)
- ⚠️ **status overdue** : Calculer automatiquement si due_date dépassée et non payée
- ⚠️ **Workflow B2B** : draft → sent → viewed → (partially_paid) → paid
- ⚠️ **Cleanup Session 16** : Supprimer colonnes V1 après validation

---

#### Tables nouvelles V2 (pas de migration données)

**2 nouvelles tables V2** :
1. `trp_platform_account_keys` - Gestion multi-clés API avec rotation (VIDE initialement)
2. `trp_client_invoice_lines` - Lignes détail factures (VIDE initialement, à peupler lors génération factures)

**Actions Session 14** : Aucune action requise, tables créées vides

---

#### Résumé module TRP

**Tables modifiées (4)** :
- `trp_platform_accounts` : 15 colonnes ajoutées (status, sync, error tracking)
- `trp_trips` : 27 colonnes ajoutées (lifecycle complet, tarification détaillée, géolocalisation)
- `trp_settlements` : 22 colonnes ajoutées (multi-devises, taxes, réconciliation)
- `trp_client_invoices` : 18 colonnes ajoutées (workflow B2B, paiements)

**Tables nouvelles (2)** :
- `trp_platform_account_keys` : Gestion sécurisée clés API
- `trp_client_invoice_lines` : Détail lignes factures

**Enums créés (7)** :
- `platform_account_status` : active, inactive, suspended
- `platform_account_key_type` : read_only, read_write, admin
- `trip_status` : completed, cancelled, rejected, no_show
- `settlement_type` : platform_payout, adjustment, refund, bonus
- `settlement_status` : pending, settled, cancelled
- `payment_method` : bank_transfer, card, check, cash
- `invoice_status` : draft, sent, viewed, partially_paid, paid, disputed, cancelled, overdue

**Points critiques TRP** :
- ⚠️ **FK FUTURE** : `trp_settlements.reconciliation_id` → `rev_reconciliations.id` (module REV pas encore créé)
- ⚠️ **api_key DEPRECATED** : À migrer vers `trp_platform_account_keys` avec chiffrement Vault
- ⚠️ **Multi-devises** : Support exchange_rate et original_currency pour settlements internationaux
- ⚠️ **Lifecycle complet trips** : 6 timestamps (requested → matched → accepted → arrived → started → finished)
- ⚠️ **Workflow B2B invoices** : 8 états avec suivi paiement détaillé
- ⚠️ **Configuration tenant** : currency, tax_rate, due_date, sync_frequency DOIVENT venir de config (PAS de hardcode)

---

