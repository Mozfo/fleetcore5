# FleetCore5 - Supabase Database Schema Reference

**Last Updated:** 2026-02-22

**Database:** PostgreSQL on Supabase
**Total Tables:** 141

## Table Count by Module

- **adm\_**: 17 tables
- **auth\_**: 10 tables
- **bil\_**: 15 tables
- **clt\_**: 5 tables
- **crm\_**: 17 tables
- **dir\_**: 15 tables
- **doc\_**: 4 tables
- **fin\_**: 11 tables
- **flt\_**: 8 tables
- **hq\_**: 2 tables
- **rev\_**: 4 tables
- **rid\_**: 8 tables
- **sch\_**: 11 tables
- **stripe\_**: 1 tables
- **sup\_**: 6 tables
- **trp\_**: 6 tables
- **v\_**: 1 tables

## Table of Contents

1. [Administration Module (adm\_)](#administration-module-adm_)
2. [Auth Module (auth\_)](#auth-module-auth_)
3. [Billing Module (bil\_)](#billing-module-bil_)
4. [Client Module (clt\_)](#client-module-clt_)
5. [CRM Module (crm\_)](#crm-module-crm_)
6. [Directory Module (dir\_)](#directory-module-dir_)
7. [Document Module (doc\_)](#document-module-doc_)
8. [Finance Module (fin\_)](#finance-module-fin_)
9. [Fleet Module (flt\_)](#fleet-module-flt_)
10. [HQ Module (hq\_)](#hq-module-hq_)
11. [Revenue Module (rev\_)](#revenue-module-rev_)
12. [Rider/Driver Module (rid\_)](#riderdriver-module-rid_)
13. [Schedule Module (sch\_)](#schedule-module-sch_)
14. [Stripe Module (stripe\_)](#stripe-module-stripe_)
15. [Support Module (sup\_)](#support-module-sup_)
16. [Transport Module (trp\_)](#transport-module-trp_)
17. [Views (v\_)](#views-v_)
18. [Enum Types](#enum-types)
19. [Foreign Key Relationships](#foreign-key-relationships)

## Administration Module (adm\_)

### adm_audit_logs

**Row Count:** ~62

| Column          | Type           | Nullable | Default                         |
| --------------- | -------------- | -------- | ------------------------------- |
| id              | `uuid`         | NO       | `uuid_generate_v4()`            |
| tenant_id       | `uuid`         | NO       | -                               |
| member_id       | `uuid`         | YES      | -                               |
| entity          | `varchar`      | NO       | -                               |
| entity_id       | `uuid`         | NO       | -                               |
| action          | `varchar`      | NO       | -                               |
| changes         | `jsonb`        | YES      | -                               |
| ip_address      | `varchar`      | YES      | -                               |
| user_agent      | `text`         | YES      | -                               |
| timestamp       | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`             |
| severity        | `USER-DEFINED` | NO       | `'info'::audit_severity`        |
| category        | `USER-DEFINED` | NO       | `'operational'::audit_category` |
| session_id      | `uuid`         | YES      | -                               |
| request_id      | `uuid`         | YES      | -                               |
| old_values      | `jsonb`        | YES      | -                               |
| new_values      | `jsonb`        | YES      | -                               |
| retention_until | `timestamptz`  | YES      | -                               |
| tags            | `_text`        | YES      | `ARRAY[]::text[]`               |

**Indexes:**

- `adm_audit_logs_changes_gin`: (changes)
- `adm_audit_logs_tenant_entity_entity_id_idx`: (tenant_id, entity, entity_id)
- `adm_audit_logs_tenant_id_idx`: (tenant_id)
- `adm_audit_logs_timestamp_idx`: ("timestamp" DESC)

### adm_error_messages

**Row Count:** ~23

| Column     | Type          | Nullable | Default                             |
| ---------- | ------------- | -------- | ----------------------------------- |
| id         | `uuid`        | NO       | `gen_random_uuid()`                 |
| error_code | `varchar`     | NO       | -                                   |
| message_en | `text`        | NO       | -                                   |
| message_fr | `text`        | NO       | -                                   |
| category   | `varchar`     | NO       | `'validation'::character varyin...` |
| severity   | `varchar`     | NO       | `'error'::character varying...`     |
| module     | `varchar`     | YES      | -                                   |
| is_active  | `boolean`     | NO       | `true`                              |
| created_at | `timestamptz` | NO       | `now()`                             |
| updated_at | `timestamptz` | NO       | `now()`                             |

**Indexes:**

- `adm_error_messages_error_code_key`: (error_code)
- `idx_adm_error_messages_code`: (error_code)
- `idx_adm_error_messages_module`: (module)

### adm_invitations

**Row Count:** ~0

| Column                | Type           | Nullable | Default                        |
| --------------------- | -------------- | -------- | ------------------------------ |
| id                    | `uuid`         | NO       | `gen_random_uuid()`            |
| tenant_id             | `uuid`         | NO       | -                              |
| email                 | `USER-DEFINED` | NO       | -                              |
| token                 | `varchar`      | NO       | -                              |
| role                  | `varchar`      | NO       | -                              |
| expires_at            | `timestamptz`  | NO       | -                              |
| status                | `USER-DEFINED` | NO       | `'pending'::invitation_status` |
| sent_at               | `timestamptz`  | NO       | -                              |
| sent_count            | `integer`      | NO       | `1`                            |
| last_sent_at          | `timestamptz`  | NO       | -                              |
| accepted_at           | `timestamptz`  | YES      | -                              |
| accepted_from_ip      | `inet`         | YES      | -                              |
| accepted_by_member_id | `uuid`         | YES      | -                              |
| invitation_type       | `USER-DEFINED` | NO       | -                              |
| custom_message        | `text`         | YES      | -                              |
| metadata              | `jsonb`        | YES      | -                              |
| sent_by               | `uuid`         | NO       | -                              |
| created_at            | `timestamptz`  | NO       | `now()`                        |
| updated_at            | `timestamptz`  | NO       | `now()`                        |

**Indexes:**

- `adm_invitations_token_key`: (token)

### adm_member_roles

**Row Count:** ~0

| Column            | Type           | Nullable | Default              |
| ----------------- | -------------- | -------- | -------------------- |
| id                | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id         | `uuid`         | NO       | -                    |
| member_id         | `uuid`         | NO       | -                    |
| role_id           | `uuid`         | NO       | -                    |
| assigned_at       | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`  |
| created_at        | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`  |
| created_by        | `uuid`         | YES      | -                    |
| updated_at        | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`  |
| updated_by        | `uuid`         | YES      | -                    |
| deleted_at        | `timestamptz`  | YES      | -                    |
| deleted_by        | `uuid`         | YES      | -                    |
| deletion_reason   | `text`         | YES      | -                    |
| assigned_by       | `uuid`         | YES      | -                    |
| assignment_reason | `text`         | YES      | -                    |
| valid_from        | `timestamptz`  | YES      | -                    |
| valid_until       | `timestamptz`  | YES      | -                    |
| is_primary        | `boolean`      | NO       | `false`              |
| scope_type        | `USER-DEFINED` | YES      | -                    |
| scope_id          | `uuid`         | YES      | -                    |
| priority          | `integer`      | YES      | `0`                  |

**Indexes:**

- `adm_member_roles_created_by_idx`: (created_by)
- `adm_member_roles_deleted_at_idx`: (deleted_at)
- `adm_member_roles_member_id_idx`: (member_id)
- `adm_member_roles_role_id_idx`: (role_id)
- `adm_member_roles_tenant_id_idx`: (tenant_id)
- `adm_member_roles_tenant_id_member_id_role_id_key`: (tenant_id, member_id, role_id)
- `adm_member_roles_updated_by_idx`: (updated_by)

### adm_member_sessions

**Row Count:** ~0

| Column     | Type          | Nullable | Default             |
| ---------- | ------------- | -------- | ------------------- |
| id         | `uuid`        | NO       | `gen_random_uuid()` |
| member_id  | `uuid`        | NO       | -                   |
| token_hash | `varchar`     | NO       | -                   |
| ip_address | `inet`        | YES      | -                   |
| user_agent | `text`        | YES      | -                   |
| expires_at | `timestamptz` | NO       | -                   |
| revoked_at | `timestamptz` | YES      | -                   |
| created_at | `timestamptz` | NO       | `now()`             |

**Indexes:**

- `adm_member_sessions_token_hash_key`: (token_hash)

### adm_notification_logs

**Row Count:** ~502

| Column          | Type           | Nullable | Default                          |
| --------------- | -------------- | -------- | -------------------------------- |
| id              | `uuid`         | NO       | `gen_random_uuid()`              |
| tenant_id       | `uuid`         | YES      | -                                |
| recipient_id    | `uuid`         | YES      | -                                |
| recipient_email | `varchar`      | NO       | -                                |
| recipient_phone | `varchar`      | YES      | -                                |
| template_code   | `varchar`      | NO       | -                                |
| channel         | `USER-DEFINED` | NO       | -                                |
| locale_used     | `varchar`      | NO       | -                                |
| subject         | `text`         | YES      | -                                |
| body            | `text`         | YES      | -                                |
| variables_data  | `jsonb`        | YES      | -                                |
| status          | `USER-DEFINED` | NO       | `'pending'::notification_status` |
| sent_at         | `timestamptz`  | YES      | -                                |
| delivered_at    | `timestamptz`  | YES      | -                                |
| opened_at       | `timestamptz`  | YES      | -                                |
| clicked_at      | `timestamptz`  | YES      | -                                |
| failed_at       | `timestamptz`  | YES      | -                                |
| error_message   | `text`         | YES      | -                                |
| external_id     | `varchar`      | YES      | -                                |
| ip_address      | `varchar`      | YES      | -                                |
| user_agent      | `text`         | YES      | -                                |
| session_id      | `uuid`         | YES      | -                                |
| request_id      | `uuid`         | YES      | -                                |
| created_at      | `timestamptz`  | NO       | `now()`                          |
| created_by      | `uuid`         | YES      | -                                |
| updated_at      | `timestamptz`  | NO       | `now()`                          |
| updated_by      | `uuid`         | YES      | -                                |
| deleted_at      | `timestamptz`  | YES      | -                                |
| deleted_by      | `uuid`         | YES      | -                                |
| deletion_reason | `text`         | YES      | -                                |

**CHECK Constraints:**

- `check_recipient_exists`: ((recipient_email IS NOT NULL) OR (recipient_phone IS NOT NULL))

**Indexes:**

- `idx_adm_notification_logs_channel`: (channel)
- `idx_adm_notification_logs_created_at`: (created_at)
- `idx_adm_notification_logs_deleted_at`: (deleted_at)
- `idx_adm_notification_logs_recipient_email`: (recipient_email)
- `idx_adm_notification_logs_recipient_id`: (recipient_id)
- `idx_adm_notification_logs_sent_at`: (sent_at)
- `idx_adm_notification_logs_status`: (status)
- `idx_adm_notification_logs_template_code`: (template_code)
- `idx_adm_notification_logs_tenant`: (tenant_id)
- `idx_adm_notification_logs_tenant_created`: (tenant_id, created_at DESC)

### adm_notification_queue

**Row Count:** ~118

| Column            | Type           | Nullable | Default                         |
| ----------------- | -------------- | -------- | ------------------------------- |
| id                | `uuid`         | NO       | `gen_random_uuid()`             |
| channel           | `USER-DEFINED` | NO       | `'email'::notification_channel` |
| template_code     | `varchar`      | NO       | -                               |
| locale            | `varchar`      | NO       | `'en'::character varying...`    |
| recipient_email   | `varchar`      | YES      | -                               |
| recipient_phone   | `varchar`      | YES      | -                               |
| recipient_user_id | `uuid`         | YES      | -                               |
| variables         | `jsonb`        | NO       | `'{}'::jsonb`                   |
| lead_id           | `uuid`         | YES      | -                               |
| member_id         | `uuid`         | YES      | -                               |
| tenant_id         | `uuid`         | YES      | -                               |
| country_code      | `character`    | YES      | -                               |
| status            | `USER-DEFINED` | NO       | `'pending'::queue_status`       |
| attempts          | `integer`      | NO       | `0`                             |
| max_attempts      | `integer`      | NO       | `3`                             |
| next_retry_at     | `timestamptz`  | YES      | -                               |
| last_error        | `text`         | YES      | -                               |
| created_at        | `timestamptz`  | NO       | `now()`                         |
| processed_at      | `timestamptz`  | YES      | -                               |
| idempotency_key   | `varchar`      | YES      | -                               |
| deleted_at        | `timestamptz`  | YES      | -                               |
| deleted_by        | `uuid`         | YES      | -                               |
| deletion_reason   | `text`         | YES      | -                               |

**Indexes:**

- `adm_notification_queue_idempotency_key_key`: (idempotency_key)
- `idx_adm_notification_queue_created_at`: (created_at DESC)
- `idx_adm_notification_queue_lead_id`: (lead_id)
- `idx_adm_notification_queue_pending`: (status, next_retry_at)
- `idx_adm_notification_queue_status`: (status)
- `idx_adm_notification_queue_template`: (template_code)

### adm_provider_countries

**Row Count:** ~2

| Column       | Type          | Nullable | Default              |
| ------------ | ------------- | -------- | -------------------- |
| id           | `uuid`        | NO       | `uuid_generate_v4()` |
| provider_id  | `uuid`        | NO       | -                    |
| country_code | `character`   | NO       | -                    |
| is_primary   | `boolean`     | NO       | `false`              |
| created_at   | `timestamptz` | NO       | `now()`              |

**Indexes:**

- `idx_apc_country`: (country_code)
- `idx_apc_one_primary_per_provider`: (provider_id)
- `idx_apc_provider`: (provider_id)
- `uq_apc_country`: (country_code)

### adm_provider_employees

**Row Count:** ~5

| Column           | Type          | Nullable | Default                          |
| ---------------- | ------------- | -------- | -------------------------------- |
| id               | `uuid`        | NO       | `uuid_generate_v4()`             |
| email            | `varchar`     | NO       | -                                |
| department       | `varchar`     | YES      | -                                |
| title            | `varchar`     | YES      | -                                |
| permissions      | `jsonb`       | YES      | -                                |
| status           | `varchar`     | NO       | `'active'::character varying...` |
| created_at       | `timestamptz` | NO       | `CURRENT_TIMESTAMP`              |
| created_by       | `uuid`        | YES      | -                                |
| updated_at       | `timestamptz` | NO       | `CURRENT_TIMESTAMP`              |
| updated_by       | `uuid`        | YES      | -                                |
| deleted_at       | `timestamptz` | YES      | -                                |
| deleted_by       | `uuid`        | YES      | -                                |
| deletion_reason  | `text`        | YES      | -                                |
| supervisor_id    | `uuid`        | YES      | -                                |
| preferred_locale | `varchar`     | YES      | -                                |
| first_name       | `varchar`     | NO       | -                                |
| last_name        | `varchar`     | YES      | -                                |
| provider_id      | `uuid`        | YES      | -                                |
| auth_user_id     | `text`        | YES      | -                                |

**Indexes:**

- `adm_provider_employees_created_by_idx`: (created_by)
- `adm_provider_employees_deleted_at_idx`: (deleted_at)
- `adm_provider_employees_email_uq`: (email)
- `adm_provider_employees_first_name_idx`: (first_name)
- `adm_provider_employees_last_name_idx`: (last_name)
- `adm_provider_employees_permissions_gin`: (permissions)
- `adm_provider_employees_status_active_idx`: (status)
- `adm_provider_employees_updated_by_idx`: (updated_by)
- `idx_adm_provider_employees_provider`: (provider_id)

### adm_providers

**Row Count:** ~4

| Column          | Type          | Nullable | Default                          |
| --------------- | ------------- | -------- | -------------------------------- |
| id              | `uuid`        | NO       | `uuid_generate_v4()`             |
| code            | `varchar`     | NO       | -                                |
| name            | `varchar`     | NO       | -                                |
| country_code    | `character`   | YES      | -                                |
| is_internal     | `boolean`     | NO       | `true`                           |
| settings        | `jsonb`       | NO       | `'{}'::jsonb`                    |
| metadata        | `jsonb`       | NO       | `'{}'::jsonb`                    |
| status          | `varchar`     | NO       | `'active'::character varying...` |
| created_at      | `timestamptz` | NO       | `now()`                          |
| created_by      | `uuid`        | YES      | -                                |
| updated_at      | `timestamptz` | NO       | `now()`                          |
| updated_by      | `uuid`        | YES      | -                                |
| deleted_at      | `timestamptz` | YES      | -                                |
| deleted_by      | `uuid`        | YES      | -                                |
| deletion_reason | `text`        | YES      | -                                |
| is_headquarters | `boolean`     | NO       | `false`                          |

**CHECK Constraints:**

- `adm_providers_status_check`: ((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'inactive...

**Indexes:**

- `adm_providers_code_unique`: (code)
- `idx_adm_providers_code`: (code)
- `idx_adm_providers_country`: (country_code)
- `idx_adm_providers_headquarters`: (is_headquarters)
- `idx_adm_providers_internal`: (is_internal)
- `idx_adm_providers_status`: (status)

### adm_role_permissions

**Row Count:** ~0

| Column     | Type          | Nullable | Default             |
| ---------- | ------------- | -------- | ------------------- |
| id         | `uuid`        | NO       | `gen_random_uuid()` |
| role_id    | `uuid`        | NO       | -                   |
| resource   | `varchar`     | NO       | -                   |
| action     | `varchar`     | NO       | -                   |
| conditions | `jsonb`       | YES      | -                   |
| created_at | `timestamptz` | NO       | `now()`             |

### adm_role_versions

**Row Count:** ~0

| Column               | Type          | Nullable | Default             |
| -------------------- | ------------- | -------- | ------------------- |
| id                   | `uuid`        | NO       | `gen_random_uuid()` |
| role_id              | `uuid`        | NO       | -                   |
| version_number       | `integer`     | NO       | -                   |
| permissions_snapshot | `jsonb`       | NO       | -                   |
| changed_by           | `uuid`        | YES      | -                   |
| change_reason        | `text`        | YES      | -                   |
| created_at           | `timestamptz` | NO       | `now()`             |

### adm_roles

**Row Count:** ~5

| Column                   | Type          | Nullable | Default                          |
| ------------------------ | ------------- | -------- | -------------------------------- |
| id                       | `uuid`        | NO       | `uuid_generate_v4()`             |
| tenant_id                | `uuid`        | NO       | -                                |
| permissions              | `jsonb`       | NO       | `'{}'::jsonb`                    |
| status                   | `varchar`     | NO       | `'active'::character varying...` |
| created_at               | `timestamptz` | NO       | `CURRENT_TIMESTAMP`              |
| created_by               | `uuid`        | YES      | -                                |
| updated_at               | `timestamptz` | NO       | `CURRENT_TIMESTAMP`              |
| updated_by               | `uuid`        | YES      | -                                |
| deleted_at               | `timestamptz` | YES      | -                                |
| deleted_by               | `uuid`        | YES      | -                                |
| deletion_reason          | `text`        | YES      | -                                |
| slug                     | `varchar`     | NO       | -                                |
| parent_role_id           | `uuid`        | YES      | -                                |
| is_system                | `boolean`     | NO       | `false`                          |
| is_default               | `boolean`     | NO       | `false`                          |
| max_members              | `integer`     | YES      | -                                |
| valid_from               | `timestamptz` | YES      | -                                |
| valid_until              | `timestamptz` | YES      | -                                |
| approval_required        | `boolean`     | NO       | `false`                          |
| name_translations        | `jsonb`       | NO       | -                                |
| description_translations | `jsonb`       | YES      | -                                |

**CHECK Constraints:**

- `chk_adm_roles_description_translations_jsonb`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_adm_roles_name_translations_jsonb`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `adm_roles_created_by_idx`: (created_by)
- `adm_roles_deleted_at_idx`: (deleted_at)
- `adm_roles_permissions_gin`: (permissions)
- `adm_roles_slug_key`: (slug)
- `adm_roles_status_active_idx`: (status)
- `adm_roles_tenant_id_idx`: (tenant_id)
- `adm_roles_updated_by_idx`: (updated_by)
- `idx_adm_roles_tenant`: (tenant_id)

### adm_tenant_lifecycle_events

**Row Count:** ~0

| Column         | Type          | Nullable | Default              |
| -------------- | ------------- | -------- | -------------------- |
| id             | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id      | `uuid`        | NO       | -                    |
| event_type     | `varchar`     | NO       | -                    |
| performed_by   | `uuid`        | YES      | -                    |
| effective_date | `date`        | YES      | -                    |
| description    | `text`        | YES      | -                    |
| created_at     | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |

**CHECK Constraints:**

- `adm_tenant_lifecycle_events_event_type_check`: ((event_type)::text = ANY ((ARRAY['created'::character varying, 'plan_changed'::character varying, '...

**Indexes:**

- `adm_tenant_lifecycle_events_effective_date_idx`: (effective_date DESC)
- `adm_tenant_lifecycle_events_event_type_idx`: (event_type)
- `adm_tenant_lifecycle_events_tenant_event_idx`: (tenant_id, event_type)
- `adm_tenant_lifecycle_events_tenant_id_idx`: (tenant_id)

### adm_tenant_settings

**Row Count:** ~0

| Column        | Type          | Nullable | Default             |
| ------------- | ------------- | -------- | ------------------- |
| id            | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id     | `uuid`        | NO       | -                   |
| setting_key   | `varchar`     | NO       | -                   |
| setting_value | `jsonb`       | NO       | -                   |
| category      | `varchar`     | YES      | -                   |
| is_encrypted  | `boolean`     | NO       | `false`             |
| updated_at    | `timestamptz` | NO       | `now()`             |

### adm_tenant_vehicle_classes

**Row Count:** ~0

| Column                   | Type           | Nullable | Default                      |
| ------------------------ | -------------- | -------- | ---------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`         |
| tenant_id                | `uuid`         | NO       | -                            |
| code                     | `varchar`      | NO       | -                            |
| criteria                 | `jsonb`        | YES      | -                            |
| based_on_class_id        | `uuid`         | YES      | -                            |
| status                   | `USER-DEFINED` | NO       | `'active'::lifecycle_status` |
| metadata                 | `jsonb`        | YES      | -                            |
| created_at               | `timestamptz`  | NO       | `now()`                      |
| updated_at               | `timestamptz`  | NO       | `now()`                      |
| created_by               | `uuid`         | NO       | -                            |
| updated_by               | `uuid`         | YES      | -                            |
| deleted_at               | `timestamptz`  | YES      | -                            |
| deleted_by               | `uuid`         | YES      | -                            |
| deletion_reason          | `text`         | YES      | -                            |
| name_translations        | `jsonb`        | NO       | -                            |
| description_translations | `jsonb`        | YES      | -                            |

**CHECK Constraints:**

- `chk_adm_tenant_vehicle_classes_description_translations_jsonb`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_adm_tenant_vehicle_classes_name_translations_jsonb`: (jsonb_typeof(name_translations) = 'object'::text)

### adm_tenants

**Row Count:** ~19

| Column                        | Type           | Nullable | Default                             |
| ----------------------------- | -------------- | -------- | ----------------------------------- |
| id                            | `uuid`         | NO       | `uuid_generate_v4()`                |
| name                          | `text`         | NO       | -                                   |
| country_code                  | `varchar`      | NO       | -                                   |
| auth_organization_id          | `text`         | YES      | -                                   |
| vat_rate                      | `numeric`      | YES      | -                                   |
| default_currency              | `character`    | NO       | `'EUR'::character varying...`       |
| timezone                      | `text`         | NO       | `'Europe/Paris'::character vary...` |
| created_at                    | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`                 |
| updated_at                    | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`                 |
| deleted_at                    | `timestamptz`  | YES      | -                                   |
| subdomain                     | `varchar`      | YES      | -                                   |
| status                        | `USER-DEFINED` | NO       | `'trialing'::tenant_status`         |
| onboarding_completed_at       | `timestamptz`  | YES      | -                                   |
| trial_ends_at                 | `timestamptz`  | YES      | -                                   |
| next_invoice_date             | `date`         | YES      | -                                   |
| primary_contact_email         | `varchar`      | YES      | -                                   |
| primary_contact_phone         | `varchar`      | YES      | -                                   |
| billing_email                 | `varchar`      | YES      | -                                   |
| tenant_code                   | `varchar`      | YES      | -                                   |
| stripe_customer_id            | `varchar`      | YES      | -                                   |
| stripe_subscription_id        | `varchar`      | YES      | -                                   |
| verification_token            | `varchar`      | YES      | -                                   |
| verification_token_expires_at | `timestamptz`  | YES      | -                                   |
| verification_completed_at     | `timestamptz`  | YES      | -                                   |
| admin_name                    | `varchar`      | YES      | -                                   |
| admin_email                   | `varchar`      | YES      | -                                   |
| admin_invited_at              | `timestamptz`  | YES      | -                                   |
| cgi_accepted_at               | `timestamptz`  | YES      | -                                   |
| cgi_accepted_ip               | `varchar`      | YES      | -                                   |
| cgi_version                   | `varchar`      | YES      | -                                   |

**Indexes:**

- `adm_tenants_auth_org_unique`: (auth_organization_id)
- `adm_tenants_auth_organization_id_idx`: (auth_organization_id)
- `adm_tenants_country_code_idx`: (country_code)
- `adm_tenants_default_currency_idx`: (default_currency)
- `adm_tenants_deleted_at_idx`: (deleted_at)
- `adm_tenants_subdomain_key`: (subdomain)
- `idx_adm_tenants_pending_verification`: (verification_token_expires_at)
- `idx_adm_tenants_stripe_customer`: (stripe_customer_id)
- `idx_adm_tenants_stripe_subscription`: (stripe_subscription_id)
- `idx_adm_tenants_tenant_code`: (tenant_code)
- `idx_adm_tenants_verification_token`: (verification_token)

## Auth Module (auth\_)

### auth_account

**Row Count:** ~2

| Column                   | Type          | Nullable | Default             |
| ------------------------ | ------------- | -------- | ------------------- |
| id                       | `text`        | NO       | `gen_random_uuid()` |
| account_id               | `text`        | NO       | -                   |
| provider_id              | `text`        | NO       | -                   |
| user_id                  | `text`        | NO       | -                   |
| access_token             | `text`        | YES      | -                   |
| refresh_token            | `text`        | YES      | -                   |
| id_token                 | `text`        | YES      | -                   |
| access_token_expires_at  | `timestamptz` | YES      | -                   |
| refresh_token_expires_at | `timestamptz` | YES      | -                   |
| scope                    | `text`        | YES      | -                   |
| password                 | `text`        | YES      | -                   |
| created_at               | `timestamptz` | NO       | `now()`             |
| updated_at               | `timestamptz` | NO       | `now()`             |

**Indexes:**

- `idx_auth_account_user_id`: (user_id)

### auth_invitation

**Row Count:** ~2

| Column          | Type          | Nullable | Default             |
| --------------- | ------------- | -------- | ------------------- |
| id              | `text`        | NO       | `gen_random_uuid()` |
| organization_id | `text`        | NO       | -                   |
| email           | `text`        | NO       | -                   |
| role            | `text`        | YES      | -                   |
| status          | `text`        | NO       | `'pending'::text`   |
| expires_at      | `timestamptz` | NO       | -                   |
| created_at      | `timestamptz` | NO       | `now()`             |
| inviter_id      | `text`        | NO       | -                   |
| team_id         | `text`        | YES      | -                   |

**Indexes:**

- `idx_auth_invitation_email`: (email)
- `idx_auth_invitation_organization_id`: (organization_id)

### auth_member

**Row Count:** ~3

| Column          | Type          | Nullable | Default             |
| --------------- | ------------- | -------- | ------------------- |
| id              | `text`        | NO       | `gen_random_uuid()` |
| organization_id | `text`        | NO       | -                   |
| user_id         | `text`        | NO       | -                   |
| role            | `text`        | NO       | `'member'::text`    |
| created_at      | `timestamptz` | NO       | `now()`             |

**Indexes:**

- `idx_auth_member_organization_id`: (organization_id)
- `idx_auth_member_user_id`: (user_id)

### auth_organization

**Row Count:** ~1

| Column     | Type          | Nullable | Default             |
| ---------- | ------------- | -------- | ------------------- |
| id         | `text`        | NO       | `gen_random_uuid()` |
| name       | `text`        | NO       | -                   |
| slug       | `text`        | NO       | -                   |
| logo       | `text`        | YES      | -                   |
| created_at | `timestamptz` | NO       | `now()`             |
| metadata   | `text`        | YES      | -                   |

**Indexes:**

- `auth_organization_slug_unique`: (slug)

### auth_rate_limit

**Row Count:** ~10

| Column       | Type      | Nullable | Default             |
| ------------ | --------- | -------- | ------------------- |
| id           | `text`    | NO       | `gen_random_uuid()` |
| key          | `text`    | NO       | -                   |
| count        | `integer` | NO       | -                   |
| last_request | `bigint`  | NO       | `now()`             |

**Indexes:**

- `auth_rate_limit_key_unique`: (key)

### auth_session

**Row Count:** ~3

| Column                 | Type          | Nullable | Default             |
| ---------------------- | ------------- | -------- | ------------------- |
| id                     | `text`        | NO       | `gen_random_uuid()` |
| expires_at             | `timestamptz` | NO       | -                   |
| token                  | `text`        | NO       | -                   |
| created_at             | `timestamptz` | NO       | `now()`             |
| updated_at             | `timestamptz` | NO       | `now()`             |
| ip_address             | `text`        | YES      | -                   |
| user_agent             | `text`        | YES      | -                   |
| user_id                | `text`        | NO       | -                   |
| active_organization_id | `text`        | YES      | -                   |
| impersonated_by        | `text`        | YES      | -                   |
| active_team_id         | `text`        | YES      | -                   |

**Indexes:**

- `auth_session_token_unique`: (token)
- `idx_auth_session_user_id`: (user_id)

### auth_team

**Row Count:** ~0

| Column          | Type          | Nullable | Default |
| --------------- | ------------- | -------- | ------- |
| id              | `text`        | NO       | -       |
| name            | `text`        | NO       | -       |
| organization_id | `text`        | NO       | -       |
| created_at      | `timestamptz` | NO       | `now()` |
| updated_at      | `timestamptz` | YES      | -       |

**Indexes:**

- `idx_auth_team_organization_id`: (organization_id)

### auth_team_member

**Row Count:** ~0

| Column     | Type          | Nullable | Default |
| ---------- | ------------- | -------- | ------- |
| id         | `text`        | NO       | -       |
| team_id    | `text`        | NO       | -       |
| user_id    | `text`        | NO       | -       |
| created_at | `timestamptz` | YES      | `now()` |

**Indexes:**

- `idx_auth_team_member_team_id`: (team_id)
- `idx_auth_team_member_user_id`: (user_id)

### auth_user

**Row Count:** ~3

| Column         | Type          | Nullable | Default             |
| -------------- | ------------- | -------- | ------------------- |
| id             | `text`        | NO       | `gen_random_uuid()` |
| name           | `text`        | NO       | -                   |
| email          | `text`        | NO       | -                   |
| email_verified | `boolean`     | NO       | `false`             |
| image          | `text`        | YES      | -                   |
| created_at     | `timestamptz` | NO       | `now()`             |
| updated_at     | `timestamptz` | NO       | `now()`             |
| role           | `text`        | YES      | `'user'::text`      |
| banned         | `boolean`     | YES      | `false`             |
| ban_reason     | `text`        | YES      | -                   |
| ban_expires    | `timestamptz` | YES      | -                   |

**Indexes:**

- `auth_user_email_unique`: (email)

### auth_verification

**Row Count:** ~1

| Column     | Type          | Nullable | Default             |
| ---------- | ------------- | -------- | ------------------- |
| id         | `text`        | NO       | `gen_random_uuid()` |
| identifier | `text`        | NO       | -                   |
| value      | `text`        | NO       | -                   |
| expires_at | `timestamptz` | NO       | -                   |
| created_at | `timestamptz` | NO       | `now()`             |
| updated_at | `timestamptz` | NO       | `now()`             |

**Indexes:**

- `idx_auth_verification_identifier`: (identifier)

## Billing Module (bil\_)

### bil_addons

**Row Count:** ~3

| Column                   | Type           | Nullable | Default             |
| ------------------------ | -------------- | -------- | ------------------- |
| id                       | `uuid`         | NO       | `gen_random_uuid()` |
| provider_id              | `uuid`         | YES      | -                   |
| code                     | `varchar`      | NO       | -                   |
| is_recurring             | `boolean`      | NO       | -                   |
| billing_interval         | `USER-DEFINED` | YES      | -                   |
| compatible_plan_ids      | `_text`        | YES      | -                   |
| category                 | `varchar`      | YES      | -                   |
| is_active                | `boolean`      | NO       | -                   |
| metadata                 | `jsonb`        | YES      | -                   |
| created_at               | `timestamptz`  | NO       | `now()`             |
| updated_at               | `timestamptz`  | NO       | `now()`             |
| deleted_at               | `timestamptz`  | YES      | -                   |
| created_by               | `uuid`         | YES      | -                   |
| updated_by               | `uuid`         | YES      | -                   |
| deleted_by               | `uuid`         | YES      | -                   |
| deletion_reason          | `text`         | YES      | -                   |
| name_translations        | `jsonb`        | NO       | -                   |
| description_translations | `jsonb`        | NO       | -                   |

**CHECK Constraints:**

- `chk_bil_addons_description_translations_type`: (jsonb_typeof(description_translations) = 'object'::text)
- `chk_bil_addons_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `idx_bil_addons_category`: (category)
- `idx_bil_addons_provider`: (provider_id)
- `uq_bil_addons_code_provider`: (code, provider_id)

### bil_amendments

**Row Count:** ~0

| Column               | Type           | Nullable | Default                                   |
| -------------------- | -------------- | -------- | ----------------------------------------- |
| id                   | `uuid`         | NO       | `gen_random_uuid()`                       |
| amendment_reference  | `varchar`      | NO       | -                                         |
| tenant_id            | `uuid`         | NO       | -                                         |
| subscription_id      | `uuid`         | NO       | -                                         |
| schedule_id          | `uuid`         | YES      | -                                         |
| provider_id          | `uuid`         | NO       | -                                         |
| amendment_type       | `USER-DEFINED` | NO       | -                                         |
| status               | `USER-DEFINED` | NO       | `'draft'::amendment_status`               |
| old_plan_id          | `uuid`         | YES      | -                                         |
| new_plan_id          | `uuid`         | YES      | -                                         |
| old_quantity         | `integer`      | YES      | -                                         |
| new_quantity         | `integer`      | YES      | -                                         |
| old_price            | `numeric`      | YES      | -                                         |
| new_price            | `numeric`      | YES      | -                                         |
| old_billing_cycle    | `USER-DEFINED` | YES      | -                                         |
| new_billing_cycle    | `USER-DEFINED` | YES      | -                                         |
| requested_at         | `timestamptz`  | NO       | `now()`                                   |
| effective_date       | `date`         | NO       | -                                         |
| applied_at           | `timestamptz`  | YES      | -                                         |
| proration_behavior   | `USER-DEFINED` | NO       | `'create_prorations'::proration_behavior` |
| proration_amount     | `numeric`      | YES      | -                                         |
| proration_invoice_id | `varchar`      | YES      | -                                         |
| requires_approval    | `boolean`      | YES      | `false`                                   |
| approved_by          | `uuid`         | YES      | -                                         |
| approved_at          | `timestamptz`  | YES      | -                                         |
| rejected_by          | `uuid`         | YES      | -                                         |
| rejected_at          | `timestamptz`  | YES      | -                                         |
| rejection_reason     | `text`         | YES      | -                                         |
| stripe_amendment_id  | `varchar`      | YES      | -                                         |
| stripe_invoice_id    | `varchar`      | YES      | -                                         |
| reason               | `text`         | YES      | -                                         |
| internal_notes       | `text`         | YES      | -                                         |
| metadata             | `jsonb`        | YES      | `'{}'::jsonb`                             |
| created_by           | `uuid`         | YES      | -                                         |
| updated_by           | `uuid`         | YES      | -                                         |
| created_at           | `timestamptz`  | NO       | `now()`                                   |
| updated_at           | `timestamptz`  | NO       | `now()`                                   |
| deleted_at           | `timestamptz`  | YES      | -                                         |
| deleted_by           | `uuid`         | YES      | -                                         |

**Indexes:**

- `idx_bil_amendments_effective_date`: (effective_date)
- `idx_bil_amendments_provider_id`: (provider_id)
- `idx_bil_amendments_reference`: (amendment_reference)
- `idx_bil_amendments_schedule_id`: (schedule_id)
- `idx_bil_amendments_status`: (status)
- `idx_bil_amendments_subscription_id`: (subscription_id)
- `idx_bil_amendments_tenant_id`: (tenant_id)
- `idx_bil_amendments_type`: (amendment_type)

### bil_billing_plans

**Row Count:** ~3

| Column                   | Type           | Nullable | Default                     |
| ------------------------ | -------------- | -------- | --------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`        |
| plan_name                | `text`         | NO       | -                           |
| monthly_fee              | `numeric`      | NO       | `0`                         |
| annual_fee               | `numeric`      | NO       | `0`                         |
| currency                 | `varchar`      | NO       | -                           |
| features                 | `jsonb`        | NO       | `'{}'::jsonb`               |
| metadata                 | `jsonb`        | NO       | `'{}'::jsonb`               |
| created_at               | `timestamptz`  | NO       | `now()`                     |
| created_by               | `uuid`         | YES      | -                           |
| updated_at               | `timestamptz`  | NO       | `now()`                     |
| updated_by               | `uuid`         | YES      | -                           |
| deleted_at               | `timestamptz`  | YES      | -                           |
| deleted_by               | `uuid`         | YES      | -                           |
| deletion_reason          | `text`         | YES      | -                           |
| plan_code                | `varchar`      | YES      | -                           |
| vat_rate                 | `numeric`      | YES      | -                           |
| max_vehicles             | `integer`      | YES      | -                           |
| max_drivers              | `integer`      | YES      | -                           |
| max_users                | `integer`      | YES      | -                           |
| version                  | `integer`      | YES      | `1`                         |
| stripe_price_id_monthly  | `text`         | YES      | -                           |
| stripe_price_id_yearly   | `text`         | YES      | -                           |
| billing_interval         | `USER-DEFINED` | YES      | `'month'::billing_interval` |
| status                   | `USER-DEFINED` | YES      | -                           |
| description_translations | `jsonb`        | YES      | -                           |

**CHECK Constraints:**

- `bil_billing_plans_annual_fee_check`: (annual_fee >= (0)::numeric)
- `bil_billing_plans_monthly_fee_check`: (monthly_fee >= (0)::numeric)
- `chk_bil_billing_plans_description_translations_type`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))

**Indexes:**

- `bil_billing_plans_created_by_idx`: (created_by)
- `bil_billing_plans_deleted_at_idx`: (deleted_at)
- `bil_billing_plans_features_idx`: (features)
- `bil_billing_plans_metadata_idx`: (metadata)
- `bil_billing_plans_plan_name_key`: (plan_name)
- `bil_billing_plans_updated_by_idx`: (updated_by)

### bil_catalog_prices

**Row Count:** ~27

| Column       | Type          | Nullable | Default             |
| ------------ | ------------- | -------- | ------------------- |
| id           | `uuid`        | NO       | `gen_random_uuid()` |
| catalog_type | `varchar`     | NO       | -                   |
| catalog_id   | `uuid`        | NO       | -                   |
| country_code | `varchar`     | NO       | -                   |
| currency     | `varchar`     | NO       | -                   |
| base_price   | `numeric`     | NO       | -                   |
| min_price    | `numeric`     | YES      | -                   |
| is_active    | `boolean`     | NO       | `true`              |
| created_at   | `timestamptz` | NO       | `now()`             |
| updated_at   | `timestamptz` | NO       | `now()`             |

**CHECK Constraints:**

- `chk_catalog_type_valid`: ((catalog_type)::text = ANY ((ARRAY['plan'::character varying, 'addon'::character varying, 'service'...
- `chk_min_price_valid`: ((min_price IS NULL) OR (min_price <= base_price))

**Indexes:**

- `idx_bil_catalog_prices_lookup`: (catalog_type, catalog_id, country_code)
- `uq_catalog_price_per_country`: (catalog_type, catalog_id, country_code)

### bil_offer_rules

**Row Count:** ~13

| Column                     | Type          | Nullable | Default             |
| -------------------------- | ------------- | -------- | ------------------- |
| id                         | `uuid`        | NO       | `gen_random_uuid()` |
| provider_id                | `uuid`        | NO       | -                   |
| code                       | `varchar`     | NO       | -                   |
| name_translations          | `jsonb`       | NO       | -                   |
| description_translations   | `jsonb`       | YES      | -                   |
| offer_type                 | `varchar`     | NO       | -                   |
| free_months                | `integer`     | YES      | -                   |
| free_addon_id              | `uuid`        | YES      | -                   |
| max_adjustment_percent     | `numeric`     | YES      | -                   |
| volume_min_vehicles        | `integer`     | YES      | -                   |
| volume_price_per_vehicle   | `numeric`     | YES      | -                   |
| min_vehicles               | `integer`     | YES      | -                   |
| max_vehicles               | `integer`     | YES      | -                   |
| min_contract_months        | `integer`     | YES      | -                   |
| country_codes              | `_text`       | YES      | -                   |
| requires_approval          | `boolean`     | NO       | `false`             |
| approval_threshold_percent | `numeric`     | YES      | -                   |
| approval_role              | `varchar`     | YES      | -                   |
| visible_to_sales_rep       | `boolean`     | NO       | `true`              |
| effective_from             | `date`        | YES      | -                   |
| effective_to               | `date`        | YES      | -                   |
| is_active                  | `boolean`     | NO       | `true`              |
| display_order              | `integer`     | YES      | `0`                 |
| metadata                   | `jsonb`       | YES      | -                   |
| created_at                 | `timestamptz` | NO       | `now()`             |
| created_by                 | `uuid`        | YES      | -                   |
| updated_at                 | `timestamptz` | NO       | `now()`             |
| updated_by                 | `uuid`        | YES      | -                   |
| deleted_at                 | `timestamptz` | YES      | -                   |
| deleted_by                 | `uuid`        | YES      | -                   |

**CHECK Constraints:**

- `chk_approval_role_valid`: ((approval_role IS NULL) OR ((approval_role)::text = ANY ((ARRAY['sales_manager'::character varying,...
- `chk_approval_role_valid`: ((approval_role)::text = ANY ((ARRAY['sales_manager'::character varying, 'director'::character varyi...
- `chk_bil_offer_rules_description_translations_jsonb`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_bil_offer_rules_name_translations_jsonb`: (jsonb_typeof(name_translations) = 'object'::text)
- `chk_effective_dates`: ((effective_from IS NULL) OR (effective_to IS NULL) OR (effective_from <= effective_to))
- `chk_free_months_range`: ((free_months IS NULL) OR ((free_months >= 1) AND (free_months <= 12)))
- `chk_max_adjustment_range`: ((max_adjustment_percent IS NULL) OR ((max_adjustment_percent >= (0)::numeric) AND (max_adjustment_p...
- `chk_offer_type_valid`: ((offer_type)::text = ANY ((ARRAY['free_months'::character varying, 'free_addon'::character varying,...
- `chk_vehicles_range`: ((min_vehicles IS NULL) OR (max_vehicles IS NULL) OR (min_vehicles <= max_vehicles))

**Indexes:**

- `idx_bil_offer_rules_active`: (is_active)
- `idx_bil_offer_rules_provider`: (provider_id)
- `idx_bil_offer_rules_type`: (offer_type)
- `uq_bil_offer_rules_code_provider`: (code, provider_id)

### bil_payment_methods

**Row Count:** ~0

| Column                     | Type           | Nullable | Default                           |
| -------------------------- | -------------- | -------- | --------------------------------- |
| id                         | `uuid`         | NO       | `uuid_generate_v4()`              |
| tenant_id                  | `uuid`         | NO       | -                                 |
| provider_token             | `text`         | NO       | -                                 |
| expires_at                 | `date`         | YES      | -                                 |
| metadata                   | `jsonb`        | NO       | `'{}'::jsonb`                     |
| created_at                 | `timestamptz`  | NO       | `now()`                           |
| created_by                 | `uuid`         | YES      | -                                 |
| updated_at                 | `timestamptz`  | NO       | `now()`                           |
| updated_by                 | `uuid`         | YES      | -                                 |
| deleted_at                 | `timestamptz`  | YES      | -                                 |
| deleted_by                 | `uuid`         | YES      | -                                 |
| deletion_reason            | `text`         | YES      | -                                 |
| provider                   | `varchar`      | YES      | -                                 |
| provider_payment_method_id | `text`         | YES      | -                                 |
| payment_type               | `USER-DEFINED` | YES      | -                                 |
| card_brand                 | `varchar`      | YES      | -                                 |
| card_last4                 | `character`    | YES      | -                                 |
| card_exp_month             | `integer`      | YES      | -                                 |
| card_exp_year              | `integer`      | YES      | -                                 |
| bank_name                  | `varchar`      | YES      | -                                 |
| bank_account_last4         | `character`    | YES      | -                                 |
| bank_country               | `character`    | YES      | -                                 |
| status                     | `USER-DEFINED` | YES      | `'active'::payment_method_status` |
| is_default                 | `boolean`      | YES      | `false`                           |
| last_used_at               | `timestamptz`  | YES      | -                                 |

**Indexes:**

- `bil_payment_methods_created_by_idx`: (created_by)
- `bil_payment_methods_deleted_at_idx`: (deleted_at)
- `bil_payment_methods_expires_at_idx`: (expires_at)
- `bil_payment_methods_metadata_idx`: (metadata)
- `bil_payment_methods_tenant_id_idx`: (tenant_id)
- `bil_payment_methods_updated_by_idx`: (updated_by)

### bil_plans

**Row Count:** ~3

| Column                   | Type           | Nullable | Default             |
| ------------------------ | -------------- | -------- | ------------------- |
| id                       | `uuid`         | NO       | `gen_random_uuid()` |
| provider_id              | `uuid`         | YES      | -                   |
| code                     | `varchar`      | NO       | -                   |
| billing_interval         | `USER-DEFINED` | NO       | -                   |
| max_vehicles             | `integer`      | YES      | -                   |
| max_drivers              | `integer`      | YES      | -                   |
| max_users                | `integer`      | YES      | -                   |
| features                 | `jsonb`        | YES      | `'[]'::jsonb...`    |
| display_order            | `integer`      | YES      | `0`                 |
| is_popular               | `boolean`      | YES      | `false`             |
| is_active                | `boolean`      | NO       | `true`              |
| metadata                 | `jsonb`        | YES      | `'{}'::jsonb`       |
| created_at               | `timestamptz`  | NO       | `now()`             |
| updated_at               | `timestamptz`  | NO       | `now()`             |
| deleted_at               | `timestamptz`  | YES      | -                   |
| created_by               | `uuid`         | YES      | -                   |
| updated_by               | `uuid`         | YES      | -                   |
| deleted_by               | `uuid`         | YES      | -                   |
| deletion_reason          | `text`         | YES      | -                   |
| name_translations        | `jsonb`        | NO       | -                   |
| description_translations | `jsonb`        | NO       | -                   |

**CHECK Constraints:**

- `chk_bil_plans_description_translations_type`: (jsonb_typeof(description_translations) = 'object'::text)
- `chk_bil_plans_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `idx_bil_plans_active`: (is_active)
- `idx_bil_plans_provider`: (provider_id)
- `uq_bil_plans_code_provider`: (code, provider_id)

### bil_promotion_usage

**Row Count:** ~0

| Column          | Type          | Nullable | Default              |
| --------------- | ------------- | -------- | -------------------- |
| id              | `uuid`        | NO       | `uuid_generate_v4()` |
| promotion_id    | `uuid`        | NO       | -                    |
| tenant_id       | `uuid`        | NO       | -                    |
| invoice_id      | `uuid`        | YES      | -                    |
| applied_at      | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| discount_amount | `numeric`     | NO       | -                    |

### bil_promotions

**Row Count:** ~0

| Column                   | Type           | Nullable | Default                      |
| ------------------------ | -------------- | -------- | ---------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`         |
| code                     | `varchar`      | NO       | -                            |
| discount_type            | `USER-DEFINED` | NO       | -                            |
| discount_value           | `numeric`      | NO       | -                            |
| currency                 | `character`    | YES      | -                            |
| max_redemptions          | `integer`      | YES      | -                            |
| redemptions_count        | `integer`      | NO       | `0`                          |
| valid_from               | `timestamptz`  | NO       | -                            |
| valid_until              | `timestamptz`  | NO       | -                            |
| applies_to               | `USER-DEFINED` | NO       | -                            |
| plan_id                  | `uuid`         | YES      | -                            |
| status                   | `USER-DEFINED` | NO       | `'active'::promotion_status` |
| metadata                 | `jsonb`        | YES      | `'{}'::jsonb`                |
| created_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`          |
| created_by               | `uuid`         | YES      | -                            |
| description_translations | `jsonb`        | YES      | -                            |

**CHECK Constraints:**

- `chk_bil_promotions_description_translations_type`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))

**Indexes:**

- `bil_promotions_code_key`: (code)

### bil_services

**Row Count:** ~3

| Column                   | Type           | Nullable | Default             |
| ------------------------ | -------------- | -------- | ------------------- |
| id                       | `uuid`         | NO       | `gen_random_uuid()` |
| provider_id              | `uuid`         | YES      | -                   |
| code                     | `varchar`      | NO       | -                   |
| service_type             | `varchar`      | NO       | -                   |
| billing_interval         | `USER-DEFINED` | YES      | -                   |
| hourly_rate              | `numeric`      | YES      | -                   |
| min_hours                | `numeric`      | YES      | -                   |
| category                 | `varchar`      | YES      | -                   |
| is_active                | `boolean`      | NO       | -                   |
| metadata                 | `jsonb`        | YES      | -                   |
| created_at               | `timestamptz`  | NO       | `now()`             |
| updated_at               | `timestamptz`  | NO       | `now()`             |
| deleted_at               | `timestamptz`  | YES      | -                   |
| created_by               | `uuid`         | YES      | -                   |
| updated_by               | `uuid`         | YES      | -                   |
| deleted_by               | `uuid`         | YES      | -                   |
| deletion_reason          | `text`         | YES      | -                   |
| name_translations        | `jsonb`        | NO       | -                   |
| description_translations | `jsonb`        | NO       | -                   |

**CHECK Constraints:**

- `chk_bil_services_description_translations_type`: (jsonb_typeof(description_translations) = 'object'::text)
- `chk_bil_services_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `idx_bil_services_provider`: (provider_id)
- `idx_bil_services_type`: (service_type)
- `uq_bil_services_code_provider`: (code, provider_id)

### bil_settings

**Row Count:** ~2

| Column         | Type          | Nullable | Default                          |
| -------------- | ------------- | -------- | -------------------------------- |
| id             | `uuid`        | NO       | `gen_random_uuid()`              |
| setting_key    | `varchar`     | NO       | -                                |
| setting_value  | `jsonb`       | NO       | -                                |
| category       | `varchar`     | NO       | -                                |
| data_type      | `varchar`     | NO       | `'object'::character varying...` |
| display_label  | `varchar`     | YES      | -                                |
| schema_version | `varchar`     | YES      | `'1.0'::character varying...`    |
| is_system      | `boolean`     | NO       | `false`                          |
| is_active      | `boolean`     | NO       | `true`                           |
| description    | `text`        | YES      | -                                |
| provider_id    | `uuid`        | YES      | -                                |
| created_at     | `timestamptz` | YES      | `now()`                          |
| updated_at     | `timestamptz` | YES      | `now()`                          |

**Indexes:**

- `bil_settings_setting_key_provider_id_key`: (setting_key, provider_id)
- `idx_bil_settings_active`: (is_active)
- `idx_bil_settings_category`: (category)
- `idx_bil_settings_key`: (setting_key)
- `idx_bil_settings_key_global`: (setting_key)
- `idx_bil_settings_provider`: (provider_id)

### bil_subscription_schedule_phases

**Row Count:** ~0

| Column             | Type           | Nullable | Default                                   |
| ------------------ | -------------- | -------- | ----------------------------------------- |
| id                 | `uuid`         | NO       | `gen_random_uuid()`                       |
| schedule_id        | `uuid`         | NO       | -                                         |
| plan_id            | `uuid`         | YES      | -                                         |
| provider_id        | `uuid`         | NO       | -                                         |
| phase_number       | `integer`      | NO       | -                                         |
| phase_name         | `varchar`      | YES      | -                                         |
| start_date         | `date`         | NO       | -                                         |
| end_date           | `date`         | NO       | -                                         |
| duration_months    | `integer`      | YES      | -                                         |
| unit_price         | `numeric`      | NO       | -                                         |
| quantity           | `integer`      | NO       | `1`                                       |
| discount_percent   | `numeric`      | YES      | `0`                                       |
| discount_amount    | `numeric`      | YES      | `0`                                       |
| phase_total        | `numeric`      | NO       | -                                         |
| billing_cycle      | `USER-DEFINED` | NO       | `'month'::billing_interval`               |
| proration_behavior | `USER-DEFINED` | YES      | `'create_prorations'::proration_behavior` |
| trial_days         | `integer`      | YES      | `0`                                       |
| stripe_price_id    | `varchar`      | YES      | -                                         |
| stripe_coupon_id   | `varchar`      | YES      | -                                         |
| metadata           | `jsonb`        | YES      | `'{}'::jsonb`                             |
| created_at         | `timestamptz`  | NO       | `now()`                                   |
| updated_at         | `timestamptz`  | NO       | `now()`                                   |

**CHECK Constraints:**

- `chk_discount_percent`: ((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric))
- `chk_phase_dates`: (end_date > start_date)
- `chk_phase_number`: (phase_number > 0)

**Indexes:**

- `idx_bil_schedule_phases_plan_id`: (plan_id)
- `idx_bil_schedule_phases_provider_id`: (provider_id)
- `idx_bil_schedule_phases_schedule_id`: (schedule_id)
- `idx_bil_schedule_phases_unique`: (schedule_id, phase_number)

### bil_subscription_schedules

**Row Count:** ~0

| Column                 | Type           | Nullable | Default                           |
| ---------------------- | -------------- | -------- | --------------------------------- |
| id                     | `uuid`         | NO       | `gen_random_uuid()`               |
| schedule_reference     | `varchar`      | NO       | -                                 |
| tenant_id              | `uuid`         | NO       | -                                 |
| order_id               | `uuid`         | YES      | -                                 |
| provider_id            | `uuid`         | NO       | -                                 |
| stripe_schedule_id     | `varchar`      | YES      | -                                 |
| stripe_customer_id     | `varchar`      | YES      | -                                 |
| stripe_subscription_id | `varchar`      | YES      | -                                 |
| status                 | `USER-DEFINED` | NO       | `'not_started'::schedule_status`  |
| end_behavior           | `USER-DEFINED` | NO       | `'cancel'::schedule_end_behavior` |
| total_phases           | `integer`      | NO       | `1`                               |
| current_phase_number   | `integer`      | YES      | `1`                               |
| start_date             | `date`         | NO       | -                                 |
| end_date               | `date`         | YES      | -                                 |
| current_phase_start    | `date`         | YES      | -                                 |
| current_phase_end      | `date`         | YES      | -                                 |
| currency               | `character`    | NO       | `'EUR'::bpchar`                   |
| total_contract_value   | `numeric`      | YES      | -                                 |
| metadata               | `jsonb`        | YES      | `'{}'::jsonb`                     |
| last_synced_at         | `timestamptz`  | YES      | -                                 |
| sync_error             | `text`         | YES      | -                                 |
| created_by             | `uuid`         | YES      | -                                 |
| updated_by             | `uuid`         | YES      | -                                 |
| created_at             | `timestamptz`  | NO       | `now()`                           |
| updated_at             | `timestamptz`  | NO       | `now()`                           |
| deleted_at             | `timestamptz`  | YES      | -                                 |
| deleted_by             | `uuid`         | YES      | -                                 |
| deletion_reason        | `text`         | YES      | -                                 |

**Indexes:**

- `idx_bil_schedules_order_id`: (order_id)
- `idx_bil_schedules_provider_id`: (provider_id)
- `idx_bil_schedules_reference`: (schedule_reference)
- `idx_bil_schedules_status`: (status)
- `idx_bil_schedules_stripe_schedule_id`: (stripe_schedule_id)
- `idx_bil_schedules_stripe_subscription_id`: (stripe_subscription_id)
- `idx_bil_schedules_tenant_id`: (tenant_id)

### bil_tenant_usage_metrics

**Row Count:** ~0

| Column          | Type           | Nullable | Default              |
| --------------- | -------------- | -------- | -------------------- |
| id              | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id       | `uuid`         | NO       | -                    |
| metric_name     | `varchar`      | NO       | -                    |
| metric_value    | `numeric`      | NO       | `0`                  |
| period_start    | `date`         | NO       | -                    |
| period_end      | `date`         | NO       | -                    |
| metadata        | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at      | `timestamptz`  | NO       | `now()`              |
| created_by      | `uuid`         | YES      | -                    |
| updated_at      | `timestamptz`  | NO       | `now()`              |
| updated_by      | `uuid`         | YES      | -                    |
| deleted_at      | `timestamptz`  | YES      | -                    |
| deleted_by      | `uuid`         | YES      | -                    |
| deletion_reason | `text`         | YES      | -                    |
| metric_type_id  | `uuid`         | YES      | -                    |
| subscription_id | `uuid`         | YES      | -                    |
| plan_version    | `integer`      | YES      | -                    |
| period_type     | `USER-DEFINED` | YES      | -                    |
| period_start_ts | `timestamptz`  | YES      | -                    |
| period_end_ts   | `timestamptz`  | YES      | -                    |
| metric_source   | `USER-DEFINED` | YES      | -                    |

**CHECK Constraints:**

- `bil_tenant_usage_metrics_metric_value_check`: (metric_value >= (0)::numeric)
- `bil_tenant_usage_metrics_period_end_check`: (period_end >= period_start)

**Indexes:**

- `bil_tenant_usage_metrics_created_by_idx`: (created_by)
- `bil_tenant_usage_metrics_deleted_at_idx`: (deleted_at)
- `bil_tenant_usage_metrics_metadata_idx`: (metadata)
- `bil_tenant_usage_metrics_metric_name_idx`: (metric_name)
- `bil_tenant_usage_metrics_period_end_idx`: (period_end)
- `bil_tenant_usage_metrics_period_start_idx`: (period_start)
- `bil_tenant_usage_metrics_tenant_id_idx`: (tenant_id)
- `bil_tenant_usage_metrics_tenant_id_metric_name_period_start_key`: (tenant_id, metric_name, period_start)
- `bil_tenant_usage_metrics_updated_by_idx`: (updated_by)

### bil_usage_metric_types

**Row Count:** ~0

| Column                   | Type           | Nullable | Default              |
| ------------------------ | -------------- | -------- | -------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()` |
| unit                     | `varchar`      | NO       | -                    |
| aggregation_method       | `USER-DEFINED` | NO       | -                    |
| created_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`  |
| name_translations        | `jsonb`        | NO       | -                    |
| description_translations | `jsonb`        | YES      | -                    |

**CHECK Constraints:**

- `chk_bil_usage_metric_types_description_translations_type`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_bil_usage_metric_types_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

## Client Module (clt\_)

### clt_invoice_lines

**Row Count:** ~0

| Column          | Type           | Nullable | Default              |
| --------------- | -------------- | -------- | -------------------- |
| id              | `uuid`         | NO       | `uuid_generate_v4()` |
| invoice_id      | `uuid`         | NO       | -                    |
| description     | `text`         | NO       | -                    |
| amount          | `numeric`      | NO       | `0`                  |
| quantity        | `numeric`      | NO       | `1`                  |
| metadata        | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at      | `timestamptz`  | NO       | `now()`              |
| created_by      | `uuid`         | YES      | -                    |
| updated_at      | `timestamptz`  | NO       | `now()`              |
| updated_by      | `uuid`         | YES      | -                    |
| deleted_at      | `timestamptz`  | YES      | -                    |
| deleted_by      | `uuid`         | YES      | -                    |
| deletion_reason | `text`         | YES      | -                    |
| line_type       | `USER-DEFINED` | YES      | -                    |
| unit_price      | `numeric`      | YES      | -                    |
| tax_rate        | `numeric`      | YES      | -                    |
| tax_amount      | `numeric`      | YES      | -                    |
| discount_amount | `numeric`      | YES      | -                    |
| source_type     | `USER-DEFINED` | YES      | -                    |
| source_id       | `uuid`         | YES      | -                    |

**CHECK Constraints:**

- `bil_tenant_invoice_lines_amount_check`: (amount >= (0)::numeric)
- `bil_tenant_invoice_lines_quantity_check`: (quantity > (0)::numeric)

**Indexes:**

- `bil_tenant_invoice_lines_created_by_idx`: (created_by)
- `bil_tenant_invoice_lines_deleted_at_idx`: (deleted_at)
- `bil_tenant_invoice_lines_description_idx`: (description)
- `bil_tenant_invoice_lines_invoice_id_description_unique`: (invoice_id, description)
- `bil_tenant_invoice_lines_invoice_id_idx`: (invoice_id)
- `bil_tenant_invoice_lines_metadata_idx`: (metadata)
- `bil_tenant_invoice_lines_updated_by_idx`: (updated_by)

### clt_invoices

**Row Count:** ~0

| Column            | Type           | Nullable | Default              |
| ----------------- | -------------- | -------- | -------------------- |
| id                | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id         | `uuid`         | NO       | -                    |
| invoice_number    | `text`         | NO       | -                    |
| invoice_date      | `date`         | NO       | -                    |
| due_date          | `date`         | NO       | -                    |
| total_amount      | `numeric`      | NO       | `0`                  |
| currency          | `varchar`      | NO       | -                    |
| metadata          | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at        | `timestamptz`  | NO       | `now()`              |
| created_by        | `uuid`         | YES      | -                    |
| updated_at        | `timestamptz`  | NO       | `now()`              |
| updated_by        | `uuid`         | YES      | -                    |
| deleted_at        | `timestamptz`  | YES      | -                    |
| deleted_by        | `uuid`         | YES      | -                    |
| deletion_reason   | `text`         | YES      | -                    |
| subscription_id   | `uuid`         | YES      | -                    |
| period_start      | `timestamptz`  | YES      | -                    |
| period_end        | `timestamptz`  | YES      | -                    |
| paid_at           | `timestamptz`  | YES      | -                    |
| subtotal          | `numeric`      | YES      | -                    |
| tax_rate          | `numeric`      | YES      | -                    |
| tax_amount        | `numeric`      | YES      | -                    |
| amount_paid       | `numeric`      | YES      | `0`                  |
| amount_due        | `numeric`      | YES      | `0`                  |
| status            | `USER-DEFINED` | YES      | -                    |
| stripe_invoice_id | `varchar`      | YES      | -                    |
| document_url      | `text`         | YES      | -                    |

**CHECK Constraints:**

- `bil_tenant_invoices_due_date_check`: (due_date >= invoice_date)
- `bil_tenant_invoices_total_amount_check`: (total_amount >= (0)::numeric)

**Indexes:**

- `bil_tenant_invoices_created_by_idx`: (created_by)
- `bil_tenant_invoices_deleted_at_idx`: (deleted_at)
- `bil_tenant_invoices_due_date_idx`: (due_date)
- `bil_tenant_invoices_invoice_date_idx`: (invoice_date)
- `bil_tenant_invoices_invoice_number_idx`: (invoice_number)
- `bil_tenant_invoices_metadata_idx`: (metadata)
- `bil_tenant_invoices_tenant_id_idx`: (tenant_id)
- `bil_tenant_invoices_tenant_id_invoice_number_key`: (tenant_id, invoice_number)
- `bil_tenant_invoices_updated_by_idx`: (updated_by)

### clt_masterdata

**Row Count:** ~0

| Column                | Type          | Nullable | Default             |
| --------------------- | ------------- | -------- | ------------------- |
| id                    | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id             | `uuid`        | NO       | -                   |
| origin_lead_code      | `varchar`     | YES      | -                   |
| origin_lead_id        | `uuid`        | YES      | -                   |
| company_name          | `varchar`     | NO       | -                   |
| legal_name            | `varchar`     | YES      | -                   |
| tax_id                | `varchar`     | YES      | -                   |
| billing_email         | `varchar`     | YES      | -                   |
| billing_address       | `jsonb`       | YES      | -                   |
| primary_contact_name  | `varchar`     | YES      | -                   |
| primary_contact_email | `varchar`     | YES      | -                   |
| primary_contact_phone | `varchar`     | YES      | -                   |
| segment               | `varchar`     | YES      | -                   |
| onboarded_at          | `timestamptz` | YES      | -                   |
| churned_at            | `timestamptz` | YES      | -                   |
| churn_reason          | `varchar`     | YES      | -                   |
| metadata              | `jsonb`       | YES      | `'{}'::jsonb`       |
| created_at            | `timestamptz` | YES      | `now()`             |
| updated_at            | `timestamptz` | YES      | `now()`             |
| deleted_at            | `timestamptz` | YES      | -                   |
| created_by            | `uuid`        | YES      | -                   |
| updated_by            | `uuid`        | YES      | -                   |
| deleted_by            | `uuid`        | YES      | -                   |
| client_code           | `varchar`     | YES      | -                   |

**CHECK Constraints:**

- `clt_masterdata_segment_check`: ((segment)::text = ANY ((ARRAY['segment_1'::character varying, 'segment_2'::character varying, 'segm...

**Indexes:**

- `clt_masterdata_tenant_id_key`: (tenant_id)
- `idx_clt_masterdata_client_code`: (client_code)
- `idx_clt_masterdata_deleted_at`: (deleted_at)
- `idx_clt_masterdata_origin_lead`: (origin_lead_id)
- `idx_clt_masterdata_segment`: (segment)

### clt_members

**Row Count:** ~1

| Column                   | Type           | Nullable | Default                          |
| ------------------------ | -------------- | -------- | -------------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`             |
| tenant_id                | `uuid`         | NO       | -                                |
| email                    | `USER-DEFINED` | NO       | -                                |
| first_name               | `varchar`      | YES      | -                                |
| last_name                | `varchar`      | YES      | -                                |
| phone                    | `varchar`      | NO       | -                                |
| role                     | `varchar`      | NO       | `'member'::character varying...` |
| last_login_at            | `timestamptz`  | YES      | -                                |
| metadata                 | `jsonb`        | NO       | `'{}'::jsonb`                    |
| status                   | `varchar`      | NO       | `'active'::character varying...` |
| created_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`              |
| created_by               | `uuid`         | YES      | -                                |
| updated_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`              |
| updated_by               | `uuid`         | YES      | -                                |
| deleted_at               | `timestamptz`  | YES      | -                                |
| deleted_by               | `uuid`         | YES      | -                                |
| deletion_reason          | `text`         | YES      | -                                |
| email_verified_at        | `timestamptz`  | YES      | -                                |
| two_factor_enabled       | `boolean`      | NO       | `false`                          |
| two_factor_secret        | `text`         | YES      | -                                |
| password_changed_at      | `timestamptz`  | YES      | -                                |
| failed_login_attempts    | `integer`      | NO       | `0`                              |
| locked_until             | `timestamptz`  | YES      | -                                |
| default_role_id          | `uuid`         | YES      | -                                |
| preferred_language       | `varchar`      | YES      | -                                |
| notification_preferences | `jsonb`        | YES      | -                                |
| auth_user_id             | `text`         | YES      | -                                |

**Indexes:**

- `adm_members_created_by_idx`: (created_by)
- `adm_members_deleted_at_idx`: (deleted_at)
- `adm_members_email_idx`: (email)
- `adm_members_last_login_at_idx`: (last_login_at)
- `adm_members_metadata_gin`: (metadata)
- `adm_members_status_active_idx`: (status)
- `adm_members_tenant_email_uq`: (tenant_id, email)
- `adm_members_tenant_id_idx`: (tenant_id)
- `adm_members_updated_by_idx`: (updated_by)
- `idx_adm_members_tenant`: (tenant_id)
- `idx_adm_members_tenant_status`: (tenant_id, status)
- `idx_clt_members_email`: (email)
- `idx_clt_members_role`: (default_role_id)

### clt_subscriptions

**Row Count:** ~0

| Column                   | Type           | Nullable | Default                     |
| ------------------------ | -------------- | -------- | --------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`        |
| tenant_id                | `uuid`         | NO       | -                           |
| plan_id                  | `uuid`         | NO       | -                           |
| subscription_start       | `date`         | NO       | -                           |
| subscription_end         | `date`         | YES      | -                           |
| metadata                 | `jsonb`        | NO       | `'{}'::jsonb`               |
| created_at               | `timestamptz`  | NO       | `now()`                     |
| created_by               | `uuid`         | YES      | -                           |
| updated_at               | `timestamptz`  | NO       | `now()`                     |
| updated_by               | `uuid`         | YES      | -                           |
| deleted_at               | `timestamptz`  | YES      | -                           |
| deleted_by               | `uuid`         | YES      | -                           |
| deletion_reason          | `text`         | YES      | -                           |
| previous_plan_id         | `uuid`         | YES      | -                           |
| plan_version             | `integer`      | YES      | -                           |
| payment_method_id        | `uuid`         | YES      | -                           |
| billing_cycle            | `USER-DEFINED` | YES      | `'month'::billing_interval` |
| current_period_start     | `timestamptz`  | YES      | -                           |
| current_period_end       | `timestamptz`  | YES      | -                           |
| trial_end                | `timestamptz`  | YES      | -                           |
| status                   | `USER-DEFINED` | YES      | -                           |
| cancel_at_period_end     | `boolean`      | YES      | `true`                      |
| auto_renew               | `boolean`      | YES      | `true`                      |
| provider                 | `varchar`      | YES      | -                           |
| provider_subscription_id | `text`         | YES      | -                           |
| provider_customer_id     | `text`         | YES      | -                           |

**CHECK Constraints:**

- `bil_tenant_subscriptions_subscription_end_check`: ((subscription_end IS NULL) OR (subscription_end >= subscription_start))

**Indexes:**

- `bil_tenant_subscriptions_created_by_idx`: (created_by)
- `bil_tenant_subscriptions_deleted_at_idx`: (deleted_at)
- `bil_tenant_subscriptions_metadata_idx`: (metadata)
- `bil_tenant_subscriptions_plan_id_idx`: (plan_id)
- `bil_tenant_subscriptions_subscription_end_idx`: (subscription_end)
- `bil_tenant_subscriptions_subscription_start_idx`: (subscription_start)
- `bil_tenant_subscriptions_tenant_id_idx`: (tenant_id)
- `bil_tenant_subscriptions_tenant_id_plan_id_key`: (tenant_id, plan_id)
- `bil_tenant_subscriptions_updated_by_idx`: (updated_by)
- `idx_bil_tenant_subscriptions_tenant`: (tenant_id)

## CRM Module (crm\_)

### crm_activities

**Row Count:** ~9

| Column           | Type          | Nullable | Default             |
| ---------------- | ------------- | -------- | ------------------- |
| id               | `uuid`        | NO       | `gen_random_uuid()` |
| lead_id          | `uuid`        | YES      | -                   |
| opportunity_id   | `uuid`        | YES      | -                   |
| provider_id      | `uuid`        | NO       | -                   |
| activity_type    | `varchar`     | NO       | -                   |
| subject          | `varchar`     | NO       | -                   |
| description      | `text`        | YES      | -                   |
| activity_date    | `timestamptz` | NO       | `now()`             |
| duration_minutes | `integer`     | YES      | -                   |
| outcome          | `varchar`     | YES      | -                   |
| is_completed     | `boolean`     | YES      | `false`             |
| completed_at     | `timestamptz` | YES      | -                   |
| created_by       | `uuid`        | YES      | -                   |
| created_at       | `timestamptz` | YES      | `now()`             |
| updated_at       | `timestamptz` | YES      | `now()`             |

**CHECK Constraints:**

- `chk_entity_link`: ((lead_id IS NOT NULL) OR (opportunity_id IS NOT NULL))
- `crm_activities_activity_type_check`: ((activity_type)::text = ANY ((ARRAY['call'::character varying, 'email'::character varying, 'note'::...

**Indexes:**

- `idx_activities_date`: (activity_date DESC)
- `idx_activities_lead`: (lead_id)
- `idx_activities_opportunity`: (opportunity_id)
- `idx_activities_provider`: (provider_id)
- `idx_activities_type`: (activity_type)

### crm_addresses

**Row Count:** ~0

| Column       | Type           | Nullable | Default              |
| ------------ | -------------- | -------- | -------------------- |
| id           | `uuid`         | NO       | `uuid_generate_v4()` |
| street_line1 | `text`         | NO       | -                    |
| street_line2 | `text`         | YES      | -                    |
| city         | `varchar`      | NO       | -                    |
| state        | `varchar`      | YES      | -                    |
| postal_code  | `varchar`      | YES      | -                    |
| country_code | `character`    | NO       | -                    |
| address_type | `USER-DEFINED` | YES      | -                    |
| is_default   | `boolean`      | NO       | `false`              |
| created_at   | `timestamptz`  | NO       | `now()`              |
| provider_id  | `uuid`         | YES      | -                    |

**Indexes:**

- `idx_crm_addresses_provider_id`: (provider_id)

### crm_agreements

**Row Count:** ~0

| Column                   | Type           | Nullable | Default                          |
| ------------------------ | -------------- | -------- | -------------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`             |
| agreement_reference      | `varchar`      | NO       | -                                |
| order_id                 | `uuid`         | NO       | -                                |
| agreement_type           | `USER-DEFINED` | NO       | -                                |
| version_number           | `integer`      | NO       | `1`                              |
| parent_agreement_id      | `uuid`         | YES      | -                                |
| status                   | `USER-DEFINED` | NO       | `'draft'::agreement_status`      |
| effective_date           | `date`         | YES      | -                                |
| expiry_date              | `date`         | YES      | -                                |
| signature_method         | `USER-DEFINED` | NO       | `'electronic'::signature_method` |
| signature_provider       | `varchar`      | YES      | -                                |
| provider_envelope_id     | `text`         | YES      | -                                |
| client_signatory_name    | `varchar`      | YES      | -                                |
| client_signatory_email   | `varchar`      | YES      | -                                |
| client_signed_at         | `timestamptz`  | YES      | -                                |
| provider_signatory_id    | `uuid`         | YES      | -                                |
| provider_signed_at       | `timestamptz`  | YES      | -                                |
| document_url             | `text`         | YES      | -                                |
| signed_document_url      | `text`         | YES      | -                                |
| metadata                 | `jsonb`        | NO       | `'{}'::jsonb`                    |
| created_by               | `uuid`         | NO       | -                                |
| updated_by               | `uuid`         | YES      | -                                |
| deleted_by               | `uuid`         | YES      | -                                |
| created_at               | `timestamptz`  | NO       | `now()`                          |
| updated_at               | `timestamptz`  | NO       | `now()`                          |
| deleted_at               | `timestamptz`  | YES      | -                                |
| provider_id              | `uuid`         | YES      | -                                |
| provider_envelope_url    | `text`         | YES      | -                                |
| client_signatory_title   | `varchar`      | YES      | -                                |
| client_signature_ip      | `inet`         | YES      | -                                |
| provider_signatory_name  | `varchar`      | YES      | -                                |
| provider_signatory_title | `varchar`      | YES      | -                                |
| terms_version            | `varchar`      | YES      | -                                |
| governing_law            | `varchar`      | YES      | -                                |
| jurisdiction             | `varchar`      | YES      | -                                |
| custom_clauses           | `jsonb`        | YES      | `'[]'::jsonb...`                 |
| internal_notes           | `text`         | YES      | -                                |
| deletion_reason          | `text`         | YES      | -                                |
| sent_for_signature_at    | `timestamptz`  | YES      | -                                |

**Indexes:**

- `crm_agreements_agreement_reference_key`: (agreement_reference)
- `idx_crm_agreements_agreement_type`: (agreement_type)
- `idx_crm_agreements_effective_date`: (effective_date)
- `idx_crm_agreements_expiry_date`: (expiry_date)
- `idx_crm_agreements_order_id`: (order_id)
- `idx_crm_agreements_provider_envelope_id`: (provider_envelope_id)
- `idx_crm_agreements_provider_id`: (provider_id)
- `idx_crm_agreements_status`: (status)

### crm_blacklist

**Row Count:** ~0

| Column           | Type          | Nullable | Default             |
| ---------------- | ------------- | -------- | ------------------- |
| id               | `uuid`        | NO       | `gen_random_uuid()` |
| provider_id      | `uuid`        | NO       | -                   |
| email            | `varchar`     | NO       | -                   |
| reason           | `varchar`     | NO       | -                   |
| reason_comment   | `text`        | YES      | -                   |
| original_lead_id | `uuid`        | YES      | -                   |
| blacklisted_by   | `uuid`        | YES      | -                   |
| blacklisted_at   | `timestamptz` | YES      | `now()`             |
| removed_at       | `timestamptz` | YES      | -                   |
| removed_by       | `uuid`        | YES      | -                   |

**Indexes:**

- `idx_crm_blacklist_email`: (email)
- `idx_crm_blacklist_provider`: (provider_id)
- `uq_blacklist_email_provider`: (email, provider_id)

### crm_countries

**Row Count:** ~30

| Column                 | Type          | Nullable | Default                      |
| ---------------------- | ------------- | -------- | ---------------------------- |
| id                     | `uuid`        | NO       | `gen_random_uuid()`          |
| country_code           | `character`   | NO       | -                            |
| country_name_en        | `varchar`     | NO       | -                            |
| country_name_fr        | `varchar`     | NO       | -                            |
| country_name_ar        | `varchar`     | NO       | -                            |
| flag_emoji             | `varchar`     | NO       | -                            |
| is_operational         | `boolean`     | NO       | `false`                      |
| is_visible             | `boolean`     | NO       | `true`                       |
| display_order          | `integer`     | NO       | -                            |
| notification_locale    | `varchar`     | NO       | `'en'::character varying...` |
| created_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`          |
| updated_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`          |
| country_preposition_fr | `varchar`     | YES      | `'en'::character varying...` |
| country_preposition_en | `varchar`     | YES      | `'in'::character varying...` |
| country_gdpr           | `boolean`     | NO       | `false`                      |
| is_system              | `boolean`     | NO       | `true`                       |
| provider_id            | `uuid`        | YES      | -                            |
| phone_prefix           | `varchar`     | YES      | -                            |
| phone_example          | `varchar`     | YES      | -                            |
| phone_min_digits       | `integer`     | YES      | `8`                          |
| phone_max_digits       | `integer`     | YES      | `12`                         |

**CHECK Constraints:**

- `chk_crm_countries_hybrid`: (((is_system = true) AND (provider_id IS NULL)) OR ((is_system = false) AND (provider_id IS NOT NULL...
- `chk_notification_locale`: ((notification_locale)::text = ANY ((ARRAY['en'::character varying, 'fr'::character varying, 'ar'::c...

**Indexes:**

- `crm_countries_country_code_key`: (country_code)
- `idx_crm_countries_code`: (country_code)
- `idx_crm_countries_expansion`: (is_operational, display_order)
- `idx_crm_countries_gdpr`: (country_gdpr)
- `idx_crm_countries_operational`: (is_operational)
- `idx_crm_countries_provider_id`: (provider_id)
- `idx_crm_countries_visible`: (is_visible)
- `idx_crm_countries_visible_order`: (is_visible, display_order)

### crm_lead_activities

**Row Count:** ~13

| Column            | Type          | Nullable | Default             |
| ----------------- | ------------- | -------- | ------------------- |
| id                | `uuid`        | NO       | `gen_random_uuid()` |
| lead_id           | `uuid`        | NO       | -                   |
| activity_type     | `varchar`     | NO       | -                   |
| title             | `varchar`     | YES      | -                   |
| description       | `text`        | YES      | -                   |
| metadata          | `jsonb`       | YES      | `'{}'::jsonb`       |
| scheduled_at      | `timestamptz` | YES      | -                   |
| completed_at      | `timestamptz` | YES      | -                   |
| is_completed      | `boolean`     | YES      | `false`             |
| performed_by      | `uuid`        | YES      | -                   |
| performed_by_name | `varchar`     | YES      | -                   |
| created_at        | `timestamptz` | YES      | `now()`             |
| updated_at        | `timestamptz` | YES      | `now()`             |
| provider_id       | `uuid`        | YES      | -                   |

**Indexes:**

- `idx_crm_lead_activities_created_at`: (created_at DESC)
- `idx_crm_lead_activities_lead_id`: (lead_id)
- `idx_crm_lead_activities_provider_id`: (provider_id)
- `idx_crm_lead_activities_type`: (activity_type)

### crm_lead_sources

**Row Count:** ~6

| Column                   | Type          | Nullable | Default              |
| ------------------------ | ------------- | -------- | -------------------- |
| id                       | `uuid`        | NO       | `uuid_generate_v4()` |
| is_active                | `boolean`     | NO       | `true`               |
| created_at               | `timestamptz` | NO       | `now()`              |
| is_system                | `boolean`     | NO       | `true`               |
| provider_id              | `uuid`        | YES      | -                    |
| name_translations        | `jsonb`       | NO       | -                    |
| description_translations | `jsonb`       | NO       | -                    |

**CHECK Constraints:**

- `chk_crm_lead_sources_description_translations_type`: (jsonb_typeof(description_translations) = 'object'::text)
- `chk_crm_lead_sources_hybrid`: (((is_system = true) AND (provider_id IS NULL)) OR ((is_system = false) AND (provider_id IS NOT NULL...
- `chk_crm_lead_sources_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `idx_crm_lead_sources_provider_id`: (provider_id)

### crm_leads

**Row Count:** ~30

| Column                           | Type           | Nullable | Default                          |
| -------------------------------- | -------------- | -------- | -------------------------------- |
| id                               | `uuid`         | NO       | `uuid_generate_v4()`             |
| email                            | `text`         | NO       | -                                |
| phone                            | `text`         | YES      | -                                |
| source                           | `text`         | YES      | -                                |
| status                           | `text`         | NO       | `'new'::text`                    |
| message                          | `text`         | YES      | -                                |
| created_at                       | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`              |
| updated_at                       | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`              |
| country_code                     | `character`    | YES      | -                                |
| fleet_size                       | `varchar`      | YES      | -                                |
| current_software                 | `varchar`      | YES      | -                                |
| assigned_to                      | `uuid`         | YES      | -                                |
| qualification_score              | `integer`      | YES      | -                                |
| qualification_notes              | `text`         | YES      | -                                |
| qualified_date                   | `timestamptz`  | YES      | -                                |
| converted_date                   | `timestamptz`  | YES      | -                                |
| utm_source                       | `varchar`      | YES      | -                                |
| utm_medium                       | `varchar`      | YES      | -                                |
| utm_campaign                     | `varchar`      | YES      | -                                |
| metadata                         | `jsonb`        | YES      | `'{}'::jsonb`                    |
| created_by                       | `uuid`         | YES      | -                                |
| updated_by                       | `uuid`         | YES      | -                                |
| deleted_at                       | `timestamptz`  | YES      | -                                |
| deleted_by                       | `uuid`         | YES      | -                                |
| deletion_reason                  | `text`         | YES      | -                                |
| lead_code                        | `varchar`      | YES      | -                                |
| first_name                       | `text`         | YES      | -                                |
| last_name                        | `text`         | YES      | -                                |
| company_name                     | `text`         | YES      | -                                |
| industry                         | `text`         | YES      | -                                |
| company_size                     | `integer`      | YES      | -                                |
| website_url                      | `text`         | YES      | -                                |
| linkedin_url                     | `text`         | YES      | -                                |
| city                             | `text`         | YES      | -                                |
| lead_stage                       | `USER-DEFINED` | YES      | -                                |
| fit_score                        | `numeric`      | YES      | -                                |
| engagement_score                 | `numeric`      | YES      | -                                |
| scoring                          | `jsonb`        | YES      | -                                |
| gdpr_consent                     | `boolean`      | YES      | -                                |
| consent_at                       | `timestamptz`  | YES      | -                                |
| source_id                        | `uuid`         | YES      | -                                |
| opportunity_id                   | `uuid`         | YES      | -                                |
| next_action_date                 | `timestamptz`  | YES      | -                                |
| priority                         | `varchar`      | YES      | `'medium'::character varying...` |
| consent_ip                       | `varchar`      | YES      | -                                |
| last_activity_at                 | `timestamptz`  | YES      | -                                |
| provider_id                      | `uuid`         | YES      | -                                |
| stage_entered_at                 | `timestamptz`  | YES      | `now()`                          |
| loss_reason_code                 | `varchar`      | YES      | -                                |
| loss_reason_detail               | `text`         | YES      | -                                |
| competitor_name                  | `varchar`      | YES      | -                                |
| booking_slot_at                  | `timestamptz`  | YES      | -                                |
| booking_confirmed_at             | `timestamptz`  | YES      | -                                |
| booking_calcom_uid               | `varchar`      | YES      | -                                |
| platforms_used                   | `_text`        | YES      | -                                |
| wizard_completed                 | `boolean`      | YES      | `false`                          |
| tenant_id                        | `uuid`         | YES      | -                                |
| converted_at                     | `timestamptz`  | YES      | -                                |
| stripe_checkout_session_id       | `varchar`      | YES      | -                                |
| stripe_payment_link_url          | `text`         | YES      | -                                |
| payment_link_created_at          | `timestamptz`  | YES      | -                                |
| payment_link_expires_at          | `timestamptz`  | YES      | -                                |
| email_verified                   | `boolean`      | NO       | `false`                          |
| email_verification_code          | `varchar`      | YES      | -                                |
| email_verification_expires_at    | `timestamptz`  | YES      | -                                |
| email_verification_attempts      | `integer`      | NO       | `0`                              |
| confirmation_token               | `varchar`      | YES      | -                                |
| attendance_confirmed             | `boolean`      | YES      | `false`                          |
| attendance_confirmed_at          | `timestamptz`  | YES      | -                                |
| j1_reminder_sent_at              | `timestamptz`  | YES      | -                                |
| reschedule_token                 | `varchar`      | YES      | -                                |
| detected_country_code            | `varchar`      | YES      | -                                |
| ip_address                       | `varchar`      | YES      | -                                |
| language                         | `varchar`      | YES      | `'en'::character varying...`     |
| callback_requested               | `boolean`      | YES      | `false`                          |
| callback_requested_at            | `timestamptz`  | YES      | -                                |
| callback_completed_at            | `timestamptz`  | YES      | -                                |
| callback_notes                   | `text`         | YES      | -                                |
| disqualified_at                  | `timestamptz`  | YES      | -                                |
| disqualification_reason          | `varchar`      | YES      | -                                |
| disqualification_comment         | `text`         | YES      | -                                |
| disqualified_by                  | `uuid`         | YES      | -                                |
| recovery_notification_sent_at    | `timestamptz`  | YES      | -                                |
| recovery_notification_clicked_at | `timestamptz`  | YES      | -                                |
| whatsapp_number                  | `varchar`      | YES      | -                                |

**CHECK Constraints:**

- `crm_leads_source_check`: ((source IS NULL) OR (source = ANY (ARRAY['web'::text, 'referral'::text, 'event'::text])))
- `crm_leads_status_check`: (status = ANY (ARRAY['new'::text, 'email_verified'::text, 'callback_requested'::text, 'demo'::text, ...

**Indexes:**

- `crm_leads_assigned_to_idx`: (assigned_to)
- `crm_leads_country_code_idx`: (country_code)
- `crm_leads_created_at_idx`: (created_at DESC)
- `crm_leads_deleted_at_idx`: (deleted_at)
- `crm_leads_email_unique_active`: (email)
- `crm_leads_lead_code_key`: (lead_code)
- `crm_leads_notes_gin`: (to_tsvector('english'::regconfig, COALESCE(message, ''::text)
- `crm_leads_reschedule_token_unique`: (reschedule_token)
- `crm_leads_status_idx`: (status)
- `idx_crm_leads_assigned_to`: (assigned_to)
- `idx_crm_leads_booking_calcom_uid`: (booking_calcom_uid)
- `idx_crm_leads_booking_slot`: (booking_slot_at)
- `idx_crm_leads_callback`: (callback_requested, callback_requested_at)
- `idx_crm_leads_confirmation_token`: (confirmation_token)
- `idx_crm_leads_country_code`: (country_code)
- `idx_crm_leads_detected_country`: (detected_country_code)
- `idx_crm_leads_disqualified`: (status)
- `idx_crm_leads_disqualified_by`: (disqualified_by)
- `idx_crm_leads_email_verification`: (email, email_verified)
- `idx_crm_leads_ip_address`: (ip_address)
- `idx_crm_leads_j1_reminder`: (booking_slot_at, j1_reminder_sent_at)
- `idx_crm_leads_language`: (language)
- `idx_crm_leads_last_activity_at`: (last_activity_at)
- `idx_crm_leads_lead_stage`: (lead_stage)
- `idx_crm_leads_loss_reason`: (loss_reason_code)
- `idx_crm_leads_metadata`: (metadata)
- `idx_crm_leads_payment_link_expires`: (payment_link_expires_at)
- `idx_crm_leads_payment_pending`: (status, payment_link_expires_at)
- `idx_crm_leads_priority`: (priority)
- `idx_crm_leads_provider_id`: (provider_id)
- `idx_crm_leads_qualification_score`: (qualification_score)
- `idx_crm_leads_reschedule_token`: (reschedule_token)
- `idx_crm_leads_stage_entered`: (stage_entered_at DESC)
- `idx_crm_leads_status_stage_deleted`: (deleted_at, status, lead_stage)
- `idx_crm_leads_status_v5`: (status)
- `idx_crm_leads_stripe_checkout`: (stripe_checkout_session_id)
- `idx_crm_leads_tenant`: (tenant_id)
- `idx_crm_leads_updated_at`: (updated_at)
- `idx_crm_leads_wizard_completed`: (wizard_completed)

### crm_nurturing

**Row Count:** ~1

| Column                  | Type          | Nullable | Default                      |
| ----------------------- | ------------- | -------- | ---------------------------- |
| id                      | `uuid`        | NO       | `gen_random_uuid()`          |
| provider_id             | `uuid`        | NO       | -                            |
| email                   | `varchar`     | NO       | -                            |
| country_code            | `varchar`     | NO       | -                            |
| email_verified_at       | `timestamptz` | NO       | -                            |
| language                | `varchar`     | YES      | `'en'::character varying...` |
| resume_token            | `varchar`     | YES      | -                            |
| resume_token_expires_at | `timestamptz` | YES      | -                            |
| nurturing_step          | `integer`     | YES      | `0`                          |
| last_nurturing_at       | `timestamptz` | YES      | -                            |
| nurturing_clicked_at    | `timestamptz` | YES      | -                            |
| original_lead_id        | `uuid`        | YES      | -                            |
| archived_at             | `timestamptz` | YES      | -                            |
| source                  | `varchar`     | YES      | -                            |
| utm_source              | `varchar`     | YES      | -                            |
| utm_medium              | `varchar`     | YES      | -                            |
| utm_campaign            | `varchar`     | YES      | -                            |
| ip_address              | `varchar`     | YES      | -                            |
| detected_country_code   | `varchar`     | YES      | -                            |
| created_at              | `timestamptz` | YES      | `now()`                      |
| updated_at              | `timestamptz` | YES      | `now()`                      |

**Indexes:**

- `crm_nurturing_resume_token_key`: (resume_token)
- `idx_crm_nurturing_email`: (email)
- `idx_crm_nurturing_nurturing`: (nurturing_step, last_nurturing_at)
- `idx_crm_nurturing_provider`: (provider_id)
- `idx_crm_nurturing_resume_token`: (resume_token)
- `uq_nurturing_email_provider`: (email, provider_id)

### crm_opportunities

**Row Count:** ~11

| Column              | Type           | Nullable | Default                      |
| ------------------- | -------------- | -------- | ---------------------------- |
| id                  | `uuid`         | NO       | `uuid_generate_v4()`         |
| lead_id             | `uuid`         | NO       | -                            |
| stage               | `text`         | NO       | `'prospect'::text`           |
| expected_value      | `numeric`      | YES      | -                            |
| close_date          | `date`         | YES      | -                            |
| assigned_to         | `uuid`         | YES      | -                            |
| metadata            | `jsonb`        | NO       | `'{}'::jsonb`                |
| created_at          | `timestamptz`  | NO       | `now()`                      |
| created_by          | `uuid`         | YES      | -                            |
| updated_at          | `timestamptz`  | NO       | `now()`                      |
| updated_by          | `uuid`         | YES      | -                            |
| deleted_at          | `timestamptz`  | YES      | -                            |
| deleted_by          | `uuid`         | YES      | -                            |
| deletion_reason     | `text`         | YES      | -                            |
| probability         | `integer`      | YES      | -                            |
| status              | `USER-DEFINED` | NO       | `'open'::opportunity_status` |
| currency            | `character`    | YES      | `'EUR'::bpchar`              |
| discount_amount     | `numeric`      | YES      | -                            |
| probability_percent | `numeric`      | YES      | `0`                          |
| forecast_value      | `numeric`      | YES      | -                            |
| won_value           | `numeric`      | YES      | -                            |
| expected_close_date | `date`         | YES      | -                            |
| won_date            | `date`         | YES      | -                            |
| lost_date           | `date`         | YES      | -                            |
| owner_id            | `uuid`         | YES      | -                            |
| plan_id             | `uuid`         | YES      | -                            |
| contract_id         | `uuid`         | YES      | -                            |
| pipeline_id         | `uuid`         | YES      | -                            |
| notes               | `text`         | YES      | -                            |
| stage_entered_at    | `timestamptz`  | NO       | `now()`                      |
| max_days_in_stage   | `integer`      | YES      | `14`                         |
| loss_reason         | `varchar`      | YES      | -                            |
| provider_id         | `uuid`         | YES      | -                            |

**CHECK Constraints:**

- `crm_opportunities_expected_value_check`: ((expected_value IS NULL) OR (expected_value >= (0)::numeric))
- `crm_opportunities_opportunity_stage_check`: (stage = ANY (ARRAY['qualification'::text, 'demo'::text, 'proposal'::text, 'negotiation'::text, 'con...

**Indexes:**

- `crm_opportunities_assigned_to_idx`: (assigned_to)
- `crm_opportunities_close_date_idx`: (close_date)
- `crm_opportunities_created_by_idx`: (created_by)
- `crm_opportunities_deleted_at_idx`: (deleted_at)
- `crm_opportunities_lead_id_idx`: (lead_id)
- `crm_opportunities_metadata_idx`: (metadata)
- `crm_opportunities_opportunity_stage_idx`: (stage)
- `crm_opportunities_updated_by_idx`: (updated_by)
- `idx_crm_opportunities_lead_id`: (lead_id)
- `idx_crm_opportunities_pipeline_id`: (pipeline_id)
- `idx_crm_opportunities_provider_id`: (provider_id)

### crm_orders

**Row Count:** ~0

| Column                   | Type           | Nullable | Default                               |
| ------------------------ | -------------- | -------- | ------------------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`                  |
| lead_id                  | `uuid`         | NO       | -                                     |
| contract_date            | `date`         | NO       | -                                     |
| effective_date           | `date`         | NO       | -                                     |
| expiry_date              | `date`         | YES      | -                                     |
| total_value              | `numeric`      | NO       | -                                     |
| currency                 | `varchar`      | NO       | -                                     |
| status                   | `text`         | NO       | `'active'::text`                      |
| metadata                 | `jsonb`        | NO       | `'{}'::jsonb`                         |
| created_at               | `timestamptz`  | NO       | `now()`                               |
| created_by               | `uuid`         | YES      | -                                     |
| updated_at               | `timestamptz`  | NO       | `now()`                               |
| updated_by               | `uuid`         | YES      | -                                     |
| deleted_at               | `timestamptz`  | YES      | -                                     |
| deleted_by               | `uuid`         | YES      | -                                     |
| deletion_reason          | `text`         | YES      | -                                     |
| opportunity_id           | `uuid`         | YES      | -                                     |
| signature_date           | `date`         | YES      | -                                     |
| vat_rate                 | `numeric`      | YES      | -                                     |
| renewal_type             | `USER-DEFINED` | YES      | -                                     |
| auto_renew               | `boolean`      | YES      | `false`                               |
| renewal_date             | `date`         | YES      | -                                     |
| notice_period_days       | `integer`      | YES      | -                                     |
| renewed_from_contract_id | `uuid`         | YES      | -                                     |
| provider_id              | `uuid`         | NO       | -                                     |
| plan_id                  | `uuid`         | YES      | -                                     |
| subscription_id          | `uuid`         | YES      | -                                     |
| company_name             | `text`         | YES      | -                                     |
| contact_name             | `text`         | YES      | -                                     |
| contact_email            | `USER-DEFINED` | YES      | -                                     |
| contact_phone            | `varchar`      | YES      | -                                     |
| billing_address_id       | `uuid`         | YES      | -                                     |
| version_number           | `integer`      | YES      | `1`                                   |
| document_url             | `text`         | YES      | -                                     |
| notes                    | `text`         | YES      | -                                     |
| approved_by              | `uuid`         | YES      | -                                     |
| quote_id                 | `uuid`         | YES      | -                                     |
| order_type               | `USER-DEFINED` | YES      | `'new'::order_type`                   |
| fulfillment_status       | `USER-DEFINED` | YES      | `'pending'::order_fulfillment_status` |
| order_reference          | `varchar`      | YES      | -                                     |
| order_code               | `varchar`      | YES      | -                                     |
| billing_cycle            | `USER-DEFINED` | YES      | `'month'::billing_interval`           |
| monthly_value            | `numeric`      | YES      | -                                     |
| annual_value             | `numeric`      | YES      | -                                     |
| fulfilled_at             | `timestamptz`  | YES      | -                                     |
| activated_at             | `timestamptz`  | YES      | -                                     |
| cancelled_at             | `timestamptz`  | YES      | -                                     |
| cancellation_reason      | `text`         | YES      | -                                     |
| client_tenant_id         | `uuid`         | YES      | -                                     |

**CHECK Constraints:**

- `crm_orders_date_check`: (effective_date >= contract_date)
- `crm_orders_effective_date_check`: (effective_date >= contract_date)
- `crm_orders_expiry_check`: ((expiry_date IS NULL) OR (expiry_date >= effective_date))
- `crm_orders_expiry_date_check`: ((expiry_date IS NULL) OR (expiry_date >= effective_date))
- `crm_orders_status_check`: (status = ANY (ARRAY['active'::text, 'expired'::text, 'terminated'::text]))
- `crm_orders_total_value_check`: (total_value >= (0)::numeric)

**Indexes:**

- `crm_orders_contract_date_idx`: (contract_date)
- `crm_orders_created_by_idx`: (created_by)
- `crm_orders_deleted_at_idx`: (deleted_at)
- `crm_orders_effective_date_idx`: (effective_date)
- `crm_orders_expiry_date_idx`: (expiry_date)
- `crm_orders_lead_id_idx`: (lead_id)
- `crm_orders_metadata_idx`: (metadata)
- `crm_orders_status_active_idx`: (status)
- `crm_orders_updated_by_idx`: (updated_by)
- `idx_crm_orders_billing_address_id`: (billing_address_id)
- `idx_crm_orders_client_tenant_id`: (client_tenant_id)
- `idx_crm_orders_fulfillment_status`: (fulfillment_status)
- `idx_crm_orders_opportunity_id`: (opportunity_id)
- `idx_crm_orders_order_type`: (order_type)
- `idx_crm_orders_provider_id`: (provider_id)
- `idx_crm_orders_quote_id`: (quote_id)
- `idx_crm_orders_reference_unique`: (order_reference)
- `idx_crm_orders_subscription_id`: (subscription_id)
- `idx_crm_orders_tenant`: (provider_id)

### crm_pipelines

**Row Count:** ~0

| Column                   | Type          | Nullable | Default              |
| ------------------------ | ------------- | -------- | -------------------- |
| id                       | `uuid`        | NO       | `uuid_generate_v4()` |
| stages                   | `jsonb`       | NO       | -                    |
| default_probability      | `jsonb`       | YES      | -                    |
| is_default               | `boolean`     | NO       | `false`              |
| is_active                | `boolean`     | NO       | `true`               |
| created_at               | `timestamptz` | NO       | `now()`              |
| provider_id              | `uuid`        | YES      | -                    |
| name_translations        | `jsonb`       | NO       | -                    |
| description_translations | `jsonb`       | NO       | -                    |

**CHECK Constraints:**

- `chk_crm_pipelines_description_translations_type`: (jsonb_typeof(description_translations) = 'object'::text)
- `chk_crm_pipelines_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `idx_crm_pipelines_provider_id`: (provider_id)

### crm_quote_approvals

**Row Count:** ~0

| Column                       | Type          | Nullable | Default                           |
| ---------------------------- | ------------- | -------- | --------------------------------- |
| id                           | `uuid`        | NO       | `gen_random_uuid()`               |
| quote_id                     | `uuid`        | NO       | -                                 |
| offer_rule_id                | `uuid`        | YES      | -                                 |
| requested_by                 | `uuid`        | NO       | -                                 |
| requested_at                 | `timestamptz` | NO       | `now()`                           |
| request_reason               | `text`        | YES      | -                                 |
| requested_adjustment_percent | `numeric`     | YES      | -                                 |
| requested_free_months        | `integer`     | YES      | -                                 |
| requested_free_addon_id      | `uuid`        | YES      | -                                 |
| requested_volume_price       | `numeric`     | YES      | -                                 |
| approval_role                | `varchar`     | NO       | -                                 |
| approved_by                  | `uuid`        | YES      | -                                 |
| approved_at                  | `timestamptz` | YES      | -                                 |
| status                       | `varchar`     | NO       | `'pending'::character varying...` |
| response_comment             | `text`        | YES      | -                                 |
| rejection_reason             | `text`        | YES      | -                                 |
| expires_at                   | `timestamptz` | YES      | -                                 |
| created_at                   | `timestamptz` | NO       | `now()`                           |
| updated_at                   | `timestamptz` | NO       | `now()`                           |

**CHECK Constraints:**

- `chk_approval_role_valid`: ((approval_role)::text = ANY ((ARRAY['sales_manager'::character varying, 'director'::character varyi...
- `chk_approval_role_valid`: ((approval_role IS NULL) OR ((approval_role)::text = ANY ((ARRAY['sales_manager'::character varying,...
- `chk_approval_status_valid`: ((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected...
- `chk_approved_fields`: ((((status)::text = 'pending'::text) AND (approved_by IS NULL) AND (approved_at IS NULL)) OR (((stat...
- `chk_rejection_reason`: ((((status)::text = 'rejected'::text) AND (rejection_reason IS NOT NULL)) OR ((status)::text <> 'rej...

**Indexes:**

- `idx_crm_quote_approvals_expires`: (expires_at)
- `idx_crm_quote_approvals_quote`: (quote_id)
- `idx_crm_quote_approvals_requested_by`: (requested_by)
- `idx_crm_quote_approvals_role`: (approval_role, status)
- `idx_crm_quote_approvals_status`: (status)

### crm_quote_items

**Row Count:** ~0

| Column               | Type           | Nullable | Default                        |
| -------------------- | -------------- | -------- | ------------------------------ |
| id                   | `uuid`         | NO       | `uuid_generate_v4()`           |
| quote_id             | `uuid`         | NO       | -                              |
| sort_order           | `integer`      | NO       | `0`                            |
| item_type            | `USER-DEFINED` | NO       | -                              |
| recurrence           | `USER-DEFINED` | NO       | `'recurring'::item_recurrence` |
| plan_id              | `uuid`         | YES      | -                              |
| name                 | `varchar`      | NO       | -                              |
| description          | `text`         | YES      | -                              |
| sku                  | `varchar`      | YES      | -                              |
| quantity             | `integer`      | NO       | `1`                            |
| unit_price           | `numeric`      | NO       | -                              |
| line_discount_type   | `USER-DEFINED` | YES      | -                              |
| line_discount_value  | `numeric`      | YES      | `0`                            |
| metadata             | `jsonb`        | NO       | `'{}'::jsonb`                  |
| created_at           | `timestamptz`  | NO       | `now()`                        |
| updated_at           | `timestamptz`  | NO       | `now()`                        |
| provider_id          | `uuid`         | YES      | -                              |
| addon_id             | `uuid`         | YES      | -                              |
| service_id           | `uuid`         | YES      | -                              |
| line_discount_amount | `numeric`      | YES      | `0`                            |
| line_total           | `numeric`      | YES      | `0`                            |

**CHECK Constraints:**

- `crm_quote_items_positive_quantity`: (quantity > 0)
- `crm_quote_items_positive_unit_price`: (unit_price >= (0)::numeric)

**Indexes:**

- `idx_crm_quote_items_item_type`: (item_type)
- `idx_crm_quote_items_plan_id`: (plan_id)
- `idx_crm_quote_items_provider_id`: (provider_id)
- `idx_crm_quote_items_quote_id`: (quote_id)

### crm_quotes

**Row Count:** ~0

| Column                   | Type           | Nullable | Default                     |
| ------------------------ | -------------- | -------- | --------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`        |
| quote_reference          | `varchar`      | NO       | -                           |
| quote_code               | `varchar`      | NO       | -                           |
| quote_version            | `integer`      | NO       | `1`                         |
| parent_quote_id          | `uuid`         | YES      | -                           |
| opportunity_id           | `uuid`         | YES      | -                           |
| status                   | `USER-DEFINED` | NO       | `'draft'::quote_status`     |
| valid_from               | `date`         | NO       | `CURRENT_DATE...`           |
| valid_until              | `date`         | NO       | -                           |
| contract_start_date      | `date`         | YES      | -                           |
| contract_duration_months | `integer`      | NO       | `12`                        |
| billing_cycle            | `USER-DEFINED` | NO       | `'month'::billing_interval` |
| currency                 | `character`    | NO       | `'EUR'::bpchar`             |
| subtotal                 | `numeric`      | NO       | `0`                         |
| discount_type            | `USER-DEFINED` | YES      | -                           |
| discount_value           | `numeric`      | YES      | `0`                         |
| tax_rate                 | `numeric`      | NO       | `0`                         |
| monthly_recurring_value  | `numeric`      | YES      | -                           |
| annual_recurring_value   | `numeric`      | YES      | -                           |
| converted_to_order_id    | `uuid`         | YES      | -                           |
| converted_at             | `timestamptz`  | YES      | -                           |
| document_url             | `text`         | YES      | -                           |
| notes                    | `text`         | YES      | -                           |
| metadata                 | `jsonb`        | NO       | `'{}'::jsonb`               |
| created_by               | `uuid`         | NO       | -                           |
| updated_by               | `uuid`         | YES      | -                           |
| deleted_by               | `uuid`         | YES      | -                           |
| deletion_reason          | `text`         | YES      | -                           |
| created_at               | `timestamptz`  | NO       | `now()`                     |
| updated_at               | `timestamptz`  | NO       | `now()`                     |
| deleted_at               | `timestamptz`  | YES      | -                           |
| provider_id              | `uuid`         | YES      | -                           |
| sent_at                  | `timestamptz`  | YES      | -                           |
| first_viewed_at          | `timestamptz`  | YES      | -                           |
| last_viewed_at           | `timestamptz`  | YES      | -                           |
| view_count               | `integer`      | YES      | `0`                         |
| accepted_at              | `timestamptz`  | YES      | -                           |
| rejected_at              | `timestamptz`  | YES      | -                           |
| rejection_reason         | `text`         | YES      | -                           |
| expired_at               | `timestamptz`  | YES      | -                           |
| document_generated_at    | `timestamptz`  | YES      | -                           |
| terms_and_conditions     | `text`         | YES      | -                           |
| public_token             | `varchar`      | YES      | -                           |
| discount_amount          | `numeric`      | YES      | `0`                         |
| tax_amount               | `numeric`      | YES      | `0`                         |
| total_value              | `numeric`      | YES      | `0`                         |
| lead_id                  | `uuid`         | YES      | -                           |
| free_months              | `integer`      | YES      | `0`                         |
| free_vehicles_count      | `integer`      | YES      | `0`                         |
| free_vehicles_ratio      | `varchar`      | YES      | -                           |
| unit_price_override      | `numeric`      | YES      | -                           |
| unit_price_approved_by   | `uuid`         | YES      | -                           |
| unit_price_approved_at   | `timestamptz`  | YES      | -                           |
| escalation_required      | `boolean`      | YES      | `false`                     |
| escalation_status        | `varchar`      | YES      | -                           |
| escalated_at             | `timestamptz`  | YES      | -                           |
| escalation_decided_at    | `timestamptz`  | YES      | -                           |
| escalation_decided_by    | `uuid`         | YES      | -                           |

**CHECK Constraints:**

- `chk_quote_parent`: ((lead_id IS NOT NULL) OR (opportunity_id IS NOT NULL))
- `crm_quotes_lead_or_opportunity_xor`: (((lead_id IS NOT NULL) AND (opportunity_id IS NULL)) OR ((lead_id IS NULL) AND (opportunity_id IS N...
- `crm_quotes_positive_subtotal`: (subtotal >= (0)::numeric)
- `crm_quotes_valid_date_range`: (valid_until > valid_from)

**Indexes:**

- `crm_quotes_quote_reference_key`: (quote_reference)
- `idx_crm_quotes_created_at`: (created_at DESC)
- `idx_crm_quotes_created_by`: (created_by)
- `idx_crm_quotes_lead_id`: (lead_id)
- `idx_crm_quotes_opportunity_id`: (opportunity_id)
- `idx_crm_quotes_parent_quote_id`: (parent_quote_id)
- `idx_crm_quotes_provider_id`: (provider_id)
- `idx_crm_quotes_public_token`: (public_token)
- `idx_crm_quotes_status`: (status)
- `idx_crm_quotes_valid_until`: (valid_until)

### crm_settings

**Row Count:** ~20

| Column            | Type          | Nullable | Default             |
| ----------------- | ------------- | -------- | ------------------- |
| id                | `uuid`        | NO       | `gen_random_uuid()` |
| setting_key       | `varchar`     | NO       | -                   |
| setting_value     | `jsonb`       | NO       | -                   |
| description       | `text`        | YES      | -                   |
| category          | `varchar`     | NO       | -                   |
| data_type         | `varchar`     | NO       | -                   |
| is_active         | `boolean`     | NO       | `true`              |
| is_system         | `boolean`     | NO       | `false`             |
| version           | `integer`     | NO       | `1`                 |
| schema_version    | `varchar`     | YES      | -                   |
| created_at        | `timestamptz` | NO       | `now()`             |
| updated_at        | `timestamptz` | NO       | `now()`             |
| created_by        | `uuid`        | YES      | -                   |
| updated_by        | `uuid`        | YES      | -                   |
| deleted_at        | `timestamptz` | YES      | -                   |
| deleted_by        | `uuid`        | YES      | -                   |
| deletion_reason   | `text`        | YES      | -                   |
| display_label     | `varchar`     | YES      | -                   |
| display_order     | `integer`     | YES      | `0`                 |
| ui_component      | `varchar`     | YES      | -                   |
| help_text         | `text`        | YES      | -                   |
| documentation_url | `varchar`     | YES      | -                   |
| default_value     | `jsonb`       | YES      | -                   |
| provider_id       | `uuid`        | YES      | -                   |

**CHECK Constraints:**

- `chk_crm_settings_hybrid`: (((is_system = true) AND (provider_id IS NULL)) OR ((is_system = false) AND (provider_id IS NOT NULL...
- `crm_settings_category_check`: ((category)::text = ANY ((ARRAY['scoring'::character varying, 'assignment'::character varying, 'qual...
- `crm_settings_data_type_check`: ((data_type)::text = ANY ((ARRAY['object'::character varying, 'array'::character varying, 'string'::...

**Indexes:**

- `crm_settings_setting_key_key`: (setting_key)
- `idx_crm_settings_category`: (category)
- `idx_crm_settings_created_by`: (created_by)
- `idx_crm_settings_deleted`: (deleted_at)
- `idx_crm_settings_display_order`: (display_order)
- `idx_crm_settings_key`: (setting_key)
- `idx_crm_settings_provider_id`: (provider_id)
- `idx_crm_settings_updated_by`: (updated_by)
- `idx_crm_settings_value`: (setting_value)

### crm_waitlist

**Row Count:** ~10

| Column                | Type          | Nullable | Default                          |
| --------------------- | ------------- | -------- | -------------------------------- |
| id                    | `uuid`        | NO       | `gen_random_uuid()`              |
| email                 | `varchar`     | NO       | -                                |
| country_code          | `varchar`     | NO       | -                                |
| fleet_size            | `varchar`     | YES      | -                                |
| detected_country_code | `varchar`     | YES      | -                                |
| ip_address            | `varchar`     | YES      | -                                |
| marketing_consent     | `boolean`     | NO       | `true`                           |
| gdpr_consent          | `boolean`     | YES      | -                                |
| gdpr_consent_at       | `timestamptz` | YES      | -                                |
| gdpr_consent_ip       | `varchar`     | YES      | -                                |
| honeypot_triggered    | `boolean`     | YES      | `false`                          |
| source                | `varchar`     | YES      | `'wizard'::character varying...` |
| locale                | `varchar`     | YES      | `'en'::character varying...`     |
| utm_source            | `varchar`     | YES      | -                                |
| utm_medium            | `varchar`     | YES      | -                                |
| utm_campaign          | `varchar`     | YES      | -                                |
| created_at            | `timestamptz` | NO       | `now()`                          |
| notified_at           | `timestamptz` | YES      | -                                |
| short_token           | `varchar`     | YES      | -                                |

**Indexes:**

- `crm_waitlist_email_country_unique`: (email, country_code)
- `crm_waitlist_short_token_unique`: (short_token)
- `idx_crm_waitlist_country`: (country_code)
- `idx_crm_waitlist_created`: (created_at)
- `idx_crm_waitlist_email`: (email)
- `idx_crm_waitlist_fleet`: (fleet_size)
- `idx_crm_waitlist_short_token`: (short_token)

## Directory Module (dir\_)

### dir_car_makes

**Row Count:** ~17

| Column            | Type           | Nullable | Default                      |
| ----------------- | -------------- | -------- | ---------------------------- |
| id                | `uuid`         | NO       | `uuid_generate_v4()`         |
| tenant_id         | `uuid`         | NO       | -                            |
| name              | `text`         | NO       | -                            |
| created_at        | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`          |
| updated_at        | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`          |
| code              | `varchar`      | NO       | -                            |
| country_of_origin | `character`    | YES      | -                            |
| parent_company    | `varchar`      | YES      | -                            |
| founded_year      | `integer`      | YES      | -                            |
| logo_url          | `text`         | YES      | -                            |
| status            | `USER-DEFINED` | NO       | `'active'::lifecycle_status` |
| metadata          | `jsonb`        | YES      | -                            |
| created_by        | `uuid`         | YES      | -                            |
| updated_by        | `uuid`         | YES      | -                            |
| deleted_at        | `timestamptz`  | YES      | -                            |
| deleted_by        | `uuid`         | YES      | -                            |
| deletion_reason   | `text`         | YES      | -                            |

**Indexes:**

- `dir_car_makes_created_at_idx`: (created_at)
- `dir_car_makes_tenant_id_idx`: (tenant_id)
- `dir_car_makes_tenant_name_uq`: (tenant_id, name)
- `dir_car_makes_updated_at_idx`: (updated_at)
- `idx_dir_car_makes_code`: (code)
- `idx_dir_car_makes_tenant_code_unique`: (tenant_id, code)

### dir_car_models

**Row Count:** ~37

| Column           | Type           | Nullable | Default                      |
| ---------------- | -------------- | -------- | ---------------------------- |
| id               | `uuid`         | NO       | `uuid_generate_v4()`         |
| tenant_id        | `uuid`         | NO       | -                            |
| make_id          | `uuid`         | NO       | -                            |
| name             | `text`         | NO       | -                            |
| created_at       | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`          |
| updated_at       | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`          |
| vehicle_class_id | `uuid`         | YES      | -                            |
| code             | `varchar`      | NO       | -                            |
| year_start       | `integer`      | YES      | -                            |
| year_end         | `integer`      | YES      | -                            |
| body_type        | `varchar`      | YES      | -                            |
| fuel_type        | `varchar`      | YES      | -                            |
| transmission     | `varchar`      | YES      | -                            |
| seats_min        | `integer`      | YES      | -                            |
| seats_max        | `integer`      | YES      | -                            |
| length_mm        | `integer`      | YES      | -                            |
| width_mm         | `integer`      | YES      | -                            |
| height_mm        | `integer`      | YES      | -                            |
| metadata         | `jsonb`        | YES      | -                            |
| status           | `USER-DEFINED` | NO       | `'active'::car_model_status` |
| created_by       | `uuid`         | YES      | -                            |
| updated_by       | `uuid`         | YES      | -                            |
| deleted_at       | `timestamptz`  | YES      | -                            |
| deleted_by       | `uuid`         | YES      | -                            |
| deletion_reason  | `text`         | YES      | -                            |

**Indexes:**

- `dir_car_models_created_at_idx`: (created_at)
- `dir_car_models_make_id_idx`: (make_id)
- `dir_car_models_tenant_id_idx`: (tenant_id)
- `dir_car_models_tenant_make_name_uq`: (tenant_id, make_id, name)
- `dir_car_models_updated_at_idx`: (updated_at)
- `dir_car_models_vehicle_class_id_idx`: (vehicle_class_id)
- `idx_dir_car_models_make_code`: (make_id, code)
- `idx_dir_car_models_tenant_code_unique`: (tenant_id, code)

### dir_country_locales

**Row Count:** ~20

| Column            | Type           | Nullable | Default                            |
| ----------------- | -------------- | -------- | ---------------------------------- |
| id                | `uuid`         | NO       | `gen_random_uuid()`                |
| country_code      | `character`    | NO       | -                                  |
| country_name      | `varchar`      | NO       | -                                  |
| primary_locale    | `varchar`      | NO       | -                                  |
| fallback_locale   | `varchar`      | YES      | -                                  |
| supported_locales | `_text`        | NO       | `'{}'::jsonb`                      |
| timezone          | `varchar`      | NO       | -                                  |
| currency          | `character`    | NO       | -                                  |
| currency_symbol   | `varchar`      | YES      | -                                  |
| currency_position | `varchar`      | YES      | -                                  |
| number_format     | `varchar`      | NO       | `'1,234.56'::character varying...` |
| date_format       | `varchar`      | NO       | -                                  |
| time_format       | `varchar`      | NO       | -                                  |
| first_day_of_week | `smallint`     | NO       | `1`                                |
| rtl_enabled       | `boolean`      | NO       | `false`                            |
| status            | `USER-DEFINED` | NO       | `'active'::lifecycle_status`       |
| created_at        | `timestamptz`  | NO       | `now()`                            |
| created_by        | `uuid`         | YES      | -                                  |
| updated_at        | `timestamptz`  | NO       | `now()`                            |
| updated_by        | `uuid`         | YES      | -                                  |
| deleted_at        | `timestamptz`  | YES      | -                                  |
| deleted_by        | `uuid`         | YES      | -                                  |
| deletion_reason   | `text`         | YES      | -                                  |

**CHECK Constraints:**

- `check_country_code_iso`: (country_code ~ '^[A-Z]{2}$'::text)
- `check_currency_iso`: (currency ~ '^[A-Z]{3}$'::text)
- `check_first_day_week`: ((first_day_of_week >= 0) AND (first_day_of_week <= 6))

**Indexes:**

- `dir_country_locales_country_code_key`: (country_code)
- `idx_dir_country_locales_country`: (country_code)
- `idx_dir_country_locales_deleted_at`: (deleted_at)
- `idx_dir_country_locales_status`: (status)

### dir_country_regulations

**Row Count:** ~3

| Column                        | Type           | Nullable | Default                       |
| ----------------------------- | -------------- | -------- | ----------------------------- |
| country_code                  | `character`    | NO       | -                             |
| vehicle_max_age               | `integer`      | YES      | -                             |
| min_vehicle_class             | `text`         | YES      | -                             |
| min_fare_per_trip             | `numeric`      | YES      | -                             |
| min_fare_per_km               | `numeric`      | YES      | -                             |
| min_fare_per_hour             | `numeric`      | YES      | -                             |
| vat_rate                      | `numeric`      | YES      | -                             |
| currency                      | `character`    | NO       | -                             |
| timezone                      | `text`         | NO       | -                             |
| created_at                    | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`           |
| updated_at                    | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`           |
| requires_vtc_card             | `boolean`      | NO       | `false`                       |
| min_vehicle_class_id          | `uuid`         | YES      | -                             |
| min_vehicle_length_cm         | `integer`      | YES      | -                             |
| min_vehicle_width_cm          | `integer`      | YES      | -                             |
| min_vehicle_height_cm         | `integer`      | YES      | -                             |
| max_vehicle_weight_kg         | `integer`      | YES      | -                             |
| max_vehicle_mileage_km        | `integer`      | YES      | -                             |
| requires_professional_license | `boolean`      | YES      | -                             |
| required_documents            | `jsonb`        | YES      | -                             |
| effective_date                | `date`         | YES      | -                             |
| expiry_date                   | `date`         | YES      | -                             |
| status                        | `USER-DEFINED` | NO       | `'active'::regulation_status` |
| created_by                    | `uuid`         | YES      | -                             |
| updated_by                    | `uuid`         | YES      | -                             |
| deleted_at                    | `timestamptz`  | YES      | -                             |
| deleted_by                    | `uuid`         | YES      | -                             |
| deletion_reason               | `text`         | YES      | -                             |

**Indexes:**

- `dir_country_regulations_currency_idx`: (currency)
- `dir_country_regulations_timezone_idx`: (timezone)

### dir_fine_types

**Row Count:** ~0

| Column                   | Type          | Nullable | Default             |
| ------------------------ | ------------- | -------- | ------------------- |
| id                       | `uuid`        | NO       | `gen_random_uuid()` |
| jurisdiction             | `character`   | NO       | -                   |
| code                     | `varchar`     | NO       | -                   |
| min_amount               | `numeric`     | NO       | -                   |
| max_amount               | `numeric`     | NO       | -                   |
| points                   | `integer`     | YES      | -                   |
| is_criminal              | `boolean`     | NO       | `false`             |
| active                   | `boolean`     | NO       | `true`              |
| metadata                 | `jsonb`       | NO       | `'{}'::jsonb`       |
| created_at               | `timestamptz` | NO       | `now()`             |
| updated_at               | `timestamptz` | NO       | `now()`             |
| description_translations | `jsonb`       | NO       | -                   |

**CHECK Constraints:**

- `chk_dir_fine_types_description_translations_type`: (jsonb_typeof(description_translations) = 'object'::text)
- `dir_fine_types_amounts_check`: (max_amount >= min_amount)

**Indexes:**

- `dir_fine_types_jurisdiction_code_uq`: (jurisdiction, code)

### dir_maintenance_types

**Row Count:** ~0

| Column                    | Type           | Nullable | Default             |
| ------------------------- | -------------- | -------- | ------------------- |
| id                        | `uuid`         | NO       | `gen_random_uuid()` |
| tenant_id                 | `uuid`         | NO       | -                   |
| code                      | `varchar`      | NO       | -                   |
| category                  | `USER-DEFINED` | NO       | -                   |
| default_frequency_km      | `integer`      | YES      | -                   |
| default_frequency_months  | `integer`      | YES      | -                   |
| estimated_duration_hours  | `numeric`      | YES      | -                   |
| estimated_cost_range      | `jsonb`        | YES      | -                   |
| is_mandatory              | `boolean`      | YES      | `false`             |
| requires_vehicle_stoppage | `boolean`      | YES      | `true`              |
| metadata                  | `jsonb`        | YES      | -                   |
| created_at                | `timestamptz`  | NO       | `now()`             |
| updated_at                | `timestamptz`  | NO       | `now()`             |
| created_by                | `uuid`         | NO       | -                   |
| updated_by                | `uuid`         | YES      | -                   |
| deleted_at                | `timestamptz`  | YES      | -                   |
| deleted_by                | `uuid`         | YES      | -                   |
| deletion_reason           | `text`         | YES      | -                   |
| label_translations        | `jsonb`        | NO       | -                   |
| description_translations  | `jsonb`        | YES      | -                   |

**CHECK Constraints:**

- `chk_dir_maintenance_types_description_translations_type`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_dir_maintenance_types_label_translations_type`: (jsonb_typeof(label_translations) = 'object'::text)

**Indexes:**

- `idx_dir_maintenance_types_tenant_code_unique`: (tenant_id, code)
- `idx_maintenance_types_category_mandatory`: (category, is_mandatory)
- `idx_maintenance_types_deleted`: (deleted_at)

### dir_notification_templates

**Row Count:** ~20

| Column               | Type           | Nullable | Default                      |
| -------------------- | -------------- | -------- | ---------------------------- |
| id                   | `uuid`         | NO       | `gen_random_uuid()`          |
| template_code        | `varchar`      | NO       | -                            |
| template_name        | `varchar`      | NO       | -                            |
| channel              | `USER-DEFINED` | NO       | -                            |
| supported_countries  | `_text`        | NO       | `'{}'::jsonb`                |
| supported_locales    | `_text`        | NO       | `'{}'::jsonb`                |
| subject_translations | `jsonb`        | NO       | -                            |
| body_translations    | `jsonb`        | NO       | -                            |
| variables            | `jsonb`        | YES      | -                            |
| status               | `USER-DEFINED` | NO       | `'active'::lifecycle_status` |
| created_at           | `timestamptz`  | NO       | `now()`                      |
| created_by           | `uuid`         | YES      | -                            |
| updated_at           | `timestamptz`  | NO       | `now()`                      |
| updated_by           | `uuid`         | YES      | -                            |
| deleted_at           | `timestamptz`  | YES      | -                            |
| deleted_by           | `uuid`         | YES      | -                            |
| deletion_reason      | `text`         | YES      | -                            |

**CHECK Constraints:**

- `check_translations_not_empty`: ((jsonb_typeof(subject_translations) = 'object'::text) AND (jsonb_typeof(body_translations) = 'objec...

**Indexes:**

- `idx_dir_notification_templates_channel`: (channel)
- `idx_dir_notification_templates_code`: (template_code)
- `idx_dir_notification_templates_code_channel_status`: (template_code, channel, status)
- `idx_dir_notification_templates_countries_gin`: (supported_countries)
- `idx_dir_notification_templates_deleted_at`: (deleted_at)
- `idx_dir_notification_templates_locales_gin`: (supported_locales)
- `idx_dir_notification_templates_status`: (status)
- `uq_dir_notification_templates_code_channel`: (template_code, channel)

### dir_ownership_types

**Row Count:** ~0

| Column                     | Type          | Nullable | Default             |
| -------------------------- | ------------- | -------- | ------------------- |
| id                         | `uuid`        | NO       | `gen_random_uuid()` |
| code                       | `varchar`     | NO       | -                   |
| requires_owner             | `boolean`     | YES      | `false`             |
| allows_leasing             | `boolean`     | YES      | `false`             |
| depreciation               | `boolean`     | YES      | `true`              |
| maintenance_responsibility | `varchar`     | YES      | -                   |
| insurance_responsibility   | `varchar`     | YES      | -                   |
| display_order              | `integer`     | YES      | -                   |
| is_active                  | `boolean`     | YES      | `true`              |
| metadata                   | `jsonb`       | YES      | -                   |
| created_at                 | `timestamptz` | NO       | `now()`             |
| updated_at                 | `timestamptz` | NO       | `now()`             |
| created_by                 | `uuid`        | NO       | -                   |
| updated_by                 | `uuid`        | YES      | -                   |
| deleted_at                 | `timestamptz` | YES      | -                   |
| deleted_by                 | `uuid`        | YES      | -                   |
| deletion_reason            | `text`        | YES      | -                   |
| name_translations          | `jsonb`       | NO       | -                   |
| description_translations   | `jsonb`       | YES      | -                   |

**CHECK Constraints:**

- `chk_dir_ownership_types_description_translations_type`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_dir_ownership_types_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `dir_ownership_types_code_key`: (code)
- `idx_dir_ownership_types_code`: (code)
- `idx_dir_ownership_types_is_active`: (is_active)

### dir_platform_configs

**Row Count:** ~0

| Column                    | Type          | Nullable | Default              |
| ------------------------- | ------------- | -------- | -------------------- |
| id                        | `uuid`        | NO       | `uuid_generate_v4()` |
| platform_id               | `uuid`        | NO       | -                    |
| tenant_id                 | `uuid`        | NO       | -                    |
| api_base_url              | `text`        | NO       | -                    |
| auth_method               | `varchar`     | YES      | -                    |
| api_version               | `varchar`     | YES      | -                    |
| refresh_frequency_minutes | `integer`     | YES      | `60`                 |
| webhook_endpoints         | `jsonb`       | YES      | -                    |
| supported_services        | `jsonb`       | YES      | -                    |
| sandbox_config            | `jsonb`       | YES      | -                    |
| production_config         | `jsonb`       | YES      | -                    |
| secrets_vault_ref         | `varchar`     | YES      | -                    |
| is_active                 | `boolean`     | YES      | `true`               |
| created_at                | `timestamptz` | NO       | `now()`              |
| updated_at                | `timestamptz` | NO       | `now()`              |
| created_by                | `uuid`        | NO       | -                    |
| updated_by                | `uuid`        | YES      | -                    |
| deleted_at                | `timestamptz` | YES      | -                    |
| deleted_by                | `uuid`        | YES      | -                    |
| deletion_reason           | `text`        | YES      | -                    |

### dir_platforms

**Row Count:** ~3

| Column                   | Type           | Nullable | Default                      |
| ------------------------ | -------------- | -------- | ---------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`         |
| api_config               | `jsonb`        | YES      | -                            |
| created_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`          |
| updated_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`          |
| code                     | `varchar`      | NO       | -                            |
| logo_url                 | `text`         | YES      | -                            |
| provider_category        | `varchar`      | YES      | -                            |
| supported_countries      | `jsonb`        | YES      | -                            |
| status                   | `USER-DEFINED` | NO       | `'active'::lifecycle_status` |
| metadata                 | `jsonb`        | YES      | -                            |
| created_by               | `uuid`         | YES      | -                            |
| updated_by               | `uuid`         | YES      | -                            |
| deleted_at               | `timestamptz`  | YES      | -                            |
| deleted_by               | `uuid`         | YES      | -                            |
| deletion_reason          | `text`         | YES      | -                            |
| name_translations        | `jsonb`        | NO       | -                            |
| description_translations | `jsonb`        | YES      | -                            |

**CHECK Constraints:**

- `chk_dir_platforms_description_translations_type`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_dir_platforms_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `dir_platforms_api_config_gin`: (api_config)

### dir_toll_gates

**Row Count:** ~0

| Column        | Type           | Nullable | Default                      |
| ------------- | -------------- | -------- | ---------------------------- |
| id            | `uuid`         | NO       | `gen_random_uuid()`          |
| country_code  | `character`    | NO       | -                            |
| gate_code     | `varchar`      | NO       | -                            |
| gate_name     | `text`         | NO       | -                            |
| location      | `point`        | YES      | -                            |
| base_fee      | `numeric`      | NO       | `0`                          |
| currency      | `character`    | NO       | -                            |
| rate_schedule | `jsonb`        | YES      | `'{}'::jsonb`                |
| status        | `USER-DEFINED` | NO       | `'active'::toll_gate_status` |
| active_from   | `date`         | YES      | -                            |
| active_to     | `date`         | YES      | -                            |
| operator      | `varchar`      | YES      | -                            |
| metadata      | `jsonb`        | NO       | `'{}'::jsonb`                |
| created_at    | `timestamptz`  | NO       | `now()`                      |
| updated_at    | `timestamptz`  | NO       | `now()`                      |

**Indexes:**

- `dir_toll_gates_country_gate_code_uq`: (country_code, gate_code)

### dir_transaction_statuses

**Row Count:** ~0

| Column                   | Type          | Nullable | Default |
| ------------------------ | ------------- | -------- | ------- |
| code                     | `varchar`     | NO       | -       |
| created_at               | `timestamptz` | NO       | `now()` |
| description_translations | `jsonb`       | NO       | -       |

**CHECK Constraints:**

- `chk_dir_transaction_statuses_description_translations_type`: (jsonb_typeof(description_translations) = 'object'::text)

### dir_transaction_types

**Row Count:** ~0

| Column                   | Type          | Nullable | Default |
| ------------------------ | ------------- | -------- | ------- |
| code                     | `varchar`     | NO       | -       |
| created_at               | `timestamptz` | NO       | `now()` |
| description_translations | `jsonb`       | NO       | -       |

**CHECK Constraints:**

- `chk_dir_transaction_types_description_translations_type`: (jsonb_typeof(description_translations) = 'object'::text)

### dir_vehicle_classes

**Row Count:** ~7

| Column                   | Type           | Nullable | Default                      |
| ------------------------ | -------------- | -------- | ---------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`         |
| country_code             | `character`    | NO       | -                            |
| max_age                  | `integer`      | YES      | -                            |
| created_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`          |
| updated_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`          |
| code                     | `varchar`      | NO       | -                            |
| min_length_cm            | `integer`      | YES      | -                            |
| max_length_cm            | `integer`      | YES      | -                            |
| min_width_cm             | `integer`      | YES      | -                            |
| max_width_cm             | `integer`      | YES      | -                            |
| min_height_cm            | `integer`      | YES      | -                            |
| max_height_cm            | `integer`      | YES      | -                            |
| min_seats                | `integer`      | YES      | -                            |
| max_seats                | `integer`      | YES      | -                            |
| min_age                  | `integer`      | YES      | -                            |
| min_weight_kg            | `integer`      | YES      | -                            |
| max_weight_kg            | `integer`      | YES      | -                            |
| criteria                 | `jsonb`        | YES      | -                            |
| status                   | `USER-DEFINED` | NO       | `'active'::lifecycle_status` |
| metadata                 | `jsonb`        | YES      | -                            |
| created_by               | `uuid`         | YES      | -                            |
| updated_by               | `uuid`         | YES      | -                            |
| deleted_at               | `timestamptz`  | YES      | -                            |
| deleted_by               | `uuid`         | YES      | -                            |
| deletion_reason          | `text`         | YES      | -                            |
| name_translations        | `jsonb`        | NO       | -                            |
| description_translations | `jsonb`        | NO       | -                            |

**CHECK Constraints:**

- `chk_dir_vehicle_classes_description_translations_type`: (jsonb_typeof(description_translations) = 'object'::text)
- `chk_dir_vehicle_classes_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `dir_vehicle_classes_country_code_idx`: (country_code)
- `dir_vehicle_classes_created_at_idx`: (created_at)
- `dir_vehicle_classes_updated_at_idx`: (updated_at)

### dir_vehicle_statuses

**Row Count:** ~0

| Column                   | Type          | Nullable | Default             |
| ------------------------ | ------------- | -------- | ------------------- |
| id                       | `uuid`        | NO       | `gen_random_uuid()` |
| code                     | `varchar`     | NO       | -                   |
| color                    | `varchar`     | YES      | -                   |
| allowed_transitions      | `jsonb`       | YES      | -                   |
| requires_approval        | `boolean`     | YES      | `false`             |
| blocking_status          | `boolean`     | YES      | `false`             |
| automatic_actions        | `jsonb`       | YES      | -                   |
| notification_rules       | `jsonb`       | YES      | -                   |
| required_documents       | `jsonb`       | YES      | -                   |
| validation_rules         | `jsonb`       | YES      | -                   |
| display_order            | `integer`     | YES      | -                   |
| is_active                | `boolean`     | YES      | `true`              |
| metadata                 | `jsonb`       | YES      | -                   |
| created_at               | `timestamptz` | NO       | `now()`             |
| updated_at               | `timestamptz` | NO       | `now()`             |
| created_by               | `uuid`        | NO       | -                   |
| updated_by               | `uuid`        | YES      | -                   |
| deleted_at               | `timestamptz` | YES      | -                   |
| deleted_by               | `uuid`        | YES      | -                   |
| deletion_reason          | `text`        | YES      | -                   |
| name_translations        | `jsonb`       | NO       | -                   |
| description_translations | `jsonb`       | YES      | -                   |

**CHECK Constraints:**

- `chk_dir_vehicle_statuses_description_translations_type`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_dir_vehicle_statuses_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `dir_vehicle_statuses_code_key`: (code)
- `idx_dir_vehicle_statuses_code`: (code)
- `idx_dir_vehicle_statuses_is_active`: (is_active)

## Document Module (doc\_)

### doc_document_types

**Row Count:** ~0

| Column                   | Type          | Nullable | Default |
| ------------------------ | ------------- | -------- | ------- |
| code                     | `varchar`     | NO       | -       |
| requires_expiry          | `boolean`     | NO       | `false` |
| default_validity_days    | `integer`     | YES      | -       |
| requires_verification    | `boolean`     | NO       | `true`  |
| allowed_mime_types       | `_text`       | YES      | -       |
| max_file_size_mb         | `integer`     | YES      | `10`    |
| category                 | `varchar`     | YES      | -       |
| is_mandatory             | `boolean`     | NO       | `false` |
| display_order            | `integer`     | NO       | `0`     |
| icon                     | `varchar`     | YES      | -       |
| created_at               | `timestamptz` | NO       | `now()` |
| created_by               | `uuid`        | YES      | -       |
| updated_at               | `timestamptz` | NO       | `now()` |
| updated_by               | `uuid`        | YES      | -       |
| deleted_at               | `timestamptz` | YES      | -       |
| deleted_by               | `uuid`        | YES      | -       |
| deletion_reason          | `text`        | YES      | -       |
| name_translations        | `jsonb`       | NO       | -       |
| description_translations | `jsonb`       | YES      | -       |

**CHECK Constraints:**

- `chk_doc_document_types_description_translations_jsonb`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_doc_document_types_name_translations_jsonb`: (jsonb_typeof(name_translations) = 'object'::text)

### doc_document_versions

**Row Count:** ~0

| Column              | Type          | Nullable | Default              |
| ------------------- | ------------- | -------- | -------------------- |
| id                  | `uuid`        | NO       | `uuid_generate_v4()` |
| document_id         | `uuid`        | NO       | -                    |
| version_number      | `integer`     | NO       | -                    |
| storage_provider    | `varchar`     | NO       | -                    |
| storage_key         | `text`        | NO       | -                    |
| file_name           | `varchar`     | NO       | -                    |
| file_size           | `integer`     | NO       | -                    |
| mime_type           | `varchar`     | NO       | -                    |
| issue_date          | `date`        | YES      | -                    |
| expiry_date         | `date`        | YES      | -                    |
| verification_status | `varchar`     | NO       | -                    |
| verified_by         | `uuid`        | YES      | -                    |
| verified_at         | `timestamptz` | YES      | -                    |
| rejection_reason    | `text`        | YES      | -                    |
| metadata            | `jsonb`       | NO       | `'{}'::jsonb`        |
| created_at          | `timestamptz` | NO       | `now()`              |
| created_by          | `uuid`        | NO       | -                    |
| change_reason       | `text`        | YES      | -                    |

### doc_documents

**Row Count:** ~0

| Column                   | Type           | Nullable | Default                          |
| ------------------------ | -------------- | -------- | -------------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`             |
| tenant_id                | `uuid`         | NO       | -                                |
| entity_type              | `text`         | NO       | -                                |
| entity_id                | `uuid`         | NO       | -                                |
| document_type            | `text`         | NO       | -                                |
| file_url                 | `text`         | NO       | -                                |
| issue_date               | `date`         | YES      | -                                |
| expiry_date              | `date`         | YES      | -                                |
| verified                 | `boolean`      | NO       | `false`                          |
| created_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`              |
| updated_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`              |
| file_name                | `varchar`      | YES      | -                                |
| file_size                | `integer`      | YES      | -                                |
| mime_type                | `varchar`      | YES      | -                                |
| metadata                 | `jsonb`        | YES      | `'{}'::jsonb`                    |
| storage_provider         | `USER-DEFINED` | YES      | `'supabase'::storage_provider`   |
| storage_key              | `text`         | YES      | -                                |
| access_level             | `USER-DEFINED` | YES      | `'private'::access_level`        |
| verification_status      | `USER-DEFINED` | YES      | `'pending'::verification_status` |
| verified_by              | `uuid`         | YES      | -                                |
| verified_at              | `timestamptz`  | YES      | -                                |
| rejection_reason         | `text`         | YES      | -                                |
| status                   | `USER-DEFINED` | NO       | `'active'::document_status`      |
| expiry_notification_sent | `boolean`      | YES      | `false`                          |
| created_by               | `uuid`         | YES      | -                                |
| updated_by               | `uuid`         | YES      | -                                |
| deleted_at               | `timestamptz`  | YES      | -                                |
| deleted_by               | `uuid`         | YES      | -                                |
| deletion_reason          | `text`         | YES      | -                                |

**CHECK Constraints:**

- `doc_documents_document_type_check`: (document_type = ANY (ARRAY['registration'::text, 'insurance'::text, 'visa'::text, 'residence_visa':...
- `doc_documents_entity_type_check`: (entity_type = ANY (ARRAY['flt_vehicle'::text, 'rid_driver'::text, 'adm_member'::text, 'contract'::t...

**Indexes:**

- `doc_documents_created_at_idx`: (created_at)
- `doc_documents_document_type_idx`: (document_type)
- `doc_documents_entity_id_idx`: (entity_id)
- `doc_documents_entity_type_idx`: (entity_type)
- `doc_documents_expiry_date_idx`: (expiry_date)
- `doc_documents_tenant_document_type_idx`: (tenant_id, document_type)
- `doc_documents_tenant_entity_idx`: (tenant_id, entity_type, entity_id)
- `doc_documents_tenant_id_idx`: (tenant_id)
- `doc_documents_updated_at_idx`: (updated_at)
- `idx_doc_documents_entity`: (tenant_id, entity_type, entity_id)
- `idx_doc_documents_entity_type`: (entity_type)

### doc_entity_types

**Row Count:** ~0

| Column                   | Type          | Nullable | Default       |
| ------------------------ | ------------- | -------- | ------------- |
| code                     | `varchar`     | NO       | -             |
| table_name               | `varchar`     | NO       | -             |
| is_active                | `boolean`     | NO       | `true`        |
| display_order            | `integer`     | NO       | `0`           |
| metadata                 | `jsonb`       | NO       | `'{}'::jsonb` |
| created_at               | `timestamptz` | NO       | `now()`       |
| created_by               | `uuid`        | YES      | -             |
| updated_at               | `timestamptz` | NO       | `now()`       |
| updated_by               | `uuid`        | YES      | -             |
| deleted_at               | `timestamptz` | YES      | -             |
| deleted_by               | `uuid`        | YES      | -             |
| description_translations | `jsonb`       | NO       | -             |

**CHECK Constraints:**

- `chk_doc_entity_types_description_translations_jsonb`: (jsonb_typeof(description_translations) = 'object'::text)

## Finance Module (fin\_)

### fin_account_types

**Row Count:** ~0

| Column                   | Type          | Nullable | Default |
| ------------------------ | ------------- | -------- | ------- |
| code                     | `text`        | NO       | -       |
| created_at               | `timestamptz` | NO       | `now()` |
| updated_at               | `timestamptz` | NO       | `now()` |
| label_translations       | `jsonb`       | NO       | -       |
| description_translations | `jsonb`       | YES      | -       |

**CHECK Constraints:**

- `chk_fin_account_types_description_translations_jsonb`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_fin_account_types_label_translations_jsonb`: (jsonb_typeof(label_translations) = 'object'::text)

### fin_accounts

**Row Count:** ~0

| Column               | Type           | Nullable | Default                    |
| -------------------- | -------------- | -------- | -------------------------- |
| id                   | `uuid`         | NO       | `uuid_generate_v4()`       |
| tenant_id            | `uuid`         | NO       | -                          |
| account_name         | `text`         | NO       | -                          |
| account_type         | `text`         | NO       | -                          |
| currency             | `varchar`      | NO       | -                          |
| balance              | `numeric`      | NO       | `0`                        |
| metadata             | `jsonb`        | NO       | `'{}'::jsonb`              |
| created_at           | `timestamptz`  | NO       | `now()`                    |
| created_by           | `uuid`         | YES      | -                          |
| updated_at           | `timestamptz`  | NO       | `now()`                    |
| updated_by           | `uuid`         | YES      | -                          |
| deleted_at           | `timestamptz`  | YES      | -                          |
| deleted_by           | `uuid`         | YES      | -                          |
| deletion_reason      | `text`         | YES      | -                          |
| provider             | `text`         | YES      | -                          |
| provider_account_id  | `text`         | YES      | -                          |
| status               | `USER-DEFINED` | NO       | `'active'::account_status` |
| opened_at            | `timestamptz`  | YES      | -                          |
| closed_at            | `timestamptz`  | YES      | -                          |
| max_balance          | `numeric`      | YES      | -                          |
| min_balance          | `numeric`      | YES      | -                          |
| account_number_last4 | `character`    | YES      | -                          |
| bank_name            | `text`         | YES      | -                          |
| iban                 | `text`         | YES      | -                          |
| swift_bic            | `text`         | YES      | -                          |
| description          | `text`         | YES      | -                          |

**CHECK Constraints:**

- `fin_accounts_account_type_check`: (account_type = ANY (ARRAY['bank'::text, 'cash'::text, 'digital'::text]))
- `fin_accounts_balance_check`: (balance >= (0)::numeric)

**Indexes:**

- `idx_fin_accounts_account_name`: (account_name)
- `idx_fin_accounts_account_type`: (account_type)
- `idx_fin_accounts_created_by`: (created_by)
- `idx_fin_accounts_currency`: (currency)
- `idx_fin_accounts_deleted_at`: (deleted_at)
- `idx_fin_accounts_metadata`: (metadata)
- `idx_fin_accounts_tenant`: (tenant_id)
- `idx_fin_accounts_tenant_account_unique`: (tenant_id, account_name)
- `idx_fin_accounts_tenant_id`: (tenant_id)
- `idx_fin_accounts_updated_by`: (updated_by)

### fin_driver_payment_batches

**Row Count:** ~0

| Column            | Type           | Nullable | Default              |
| ----------------- | -------------- | -------- | -------------------- |
| id                | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id         | `uuid`         | NO       | -                    |
| batch_reference   | `text`         | NO       | -                    |
| payment_date      | `date`         | NO       | -                    |
| total_amount      | `numeric`      | NO       | -                    |
| currency          | `varchar`      | NO       | -                    |
| status            | `text`         | NO       | `'pending'::text`    |
| metadata          | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at        | `timestamptz`  | NO       | `now()`              |
| created_by        | `uuid`         | YES      | -                    |
| updated_at        | `timestamptz`  | NO       | `now()`              |
| updated_by        | `uuid`         | YES      | -                    |
| deleted_at        | `timestamptz`  | YES      | -                    |
| deleted_by        | `uuid`         | YES      | -                    |
| deletion_reason   | `text`         | YES      | -                    |
| period_start      | `date`         | YES      | -                    |
| period_end        | `date`         | YES      | -                    |
| payroll_cycle     | `USER-DEFINED` | YES      | -                    |
| payment_method    | `USER-DEFINED` | YES      | -                    |
| batch_type        | `USER-DEFINED` | YES      | -                    |
| payout_account_id | `uuid`         | YES      | -                    |
| status_reason     | `text`         | YES      | -                    |
| file_url          | `text`         | YES      | -                    |
| exported_at       | `timestamptz`  | YES      | -                    |
| sent_at           | `timestamptz`  | YES      | -                    |
| processed_at      | `timestamptz`  | YES      | -                    |
| error_details     | `jsonb`        | YES      | -                    |

**CHECK Constraints:**

- `fin_driver_payment_batches_status_check`: (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancel...
- `fin_driver_payment_batches_total_amount_check`: (total_amount >= (0)::numeric)

**Indexes:**

- `fin_driver_payment_batches_batch_reference_idx`: (batch_reference)
- `fin_driver_payment_batches_created_by_idx`: (created_by)
- `fin_driver_payment_batches_deleted_at_idx`: (deleted_at)
- `fin_driver_payment_batches_metadata_idx`: (metadata)
- `fin_driver_payment_batches_payment_date_idx`: (payment_date DESC)
- `fin_driver_payment_batches_status_active_idx`: (status)
- `fin_driver_payment_batches_tenant_batch_ref_unique`: (tenant_id, batch_reference)
- `fin_driver_payment_batches_tenant_id_idx`: (tenant_id)
- `fin_driver_payment_batches_updated_by_idx`: (updated_by)

### fin_driver_payments

**Row Count:** ~0

| Column                    | Type           | Nullable | Default              |
| ------------------------- | -------------- | -------- | -------------------- |
| id                        | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id                 | `uuid`         | NO       | -                    |
| driver_id                 | `uuid`         | NO       | -                    |
| payment_batch_id          | `uuid`         | NO       | -                    |
| amount                    | `numeric`      | NO       | -                    |
| currency                  | `varchar`      | NO       | -                    |
| payment_date              | `date`         | NO       | -                    |
| status                    | `text`         | NO       | `'pending'::text`    |
| metadata                  | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at                | `timestamptz`  | NO       | `now()`              |
| created_by                | `uuid`         | YES      | -                    |
| updated_at                | `timestamptz`  | NO       | `now()`              |
| updated_by                | `uuid`         | YES      | -                    |
| deleted_at                | `timestamptz`  | YES      | -                    |
| deleted_by                | `uuid`         | YES      | -                    |
| deletion_reason           | `text`         | YES      | -                    |
| period_start              | `date`         | YES      | -                    |
| period_end                | `date`         | YES      | -                    |
| amount_in_tenant_currency | `numeric`      | YES      | -                    |
| exchange_rate             | `numeric`      | YES      | -                    |
| payment_method            | `USER-DEFINED` | YES      | -                    |
| payout_account_id         | `uuid`         | YES      | -                    |
| transaction_reference     | `text`         | YES      | -                    |
| status_reason             | `text`         | YES      | -                    |
| error_details             | `jsonb`        | YES      | -                    |
| processed_at              | `timestamptz`  | YES      | -                    |
| failed_at                 | `timestamptz`  | YES      | -                    |
| cancelled_at              | `timestamptz`  | YES      | -                    |
| notes                     | `text`         | YES      | -                    |

**CHECK Constraints:**

- `fin_driver_payments_amount_check`: (amount >= (0)::numeric)
- `fin_driver_payments_status_check`: (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancel...

**Indexes:**

- `fin_driver_payments_created_by_idx`: (created_by)
- `fin_driver_payments_deleted_at_idx`: (deleted_at)
- `fin_driver_payments_driver_id_idx`: (driver_id)
- `fin_driver_payments_metadata_idx`: (metadata)
- `fin_driver_payments_payment_batch_id_idx`: (payment_batch_id)
- `fin_driver_payments_payment_date_idx`: (payment_date DESC)
- `fin_driver_payments_status_active_idx`: (status)
- `fin_driver_payments_tenant_id_idx`: (tenant_id)
- `fin_driver_payments_updated_by_idx`: (updated_by)
- `idx_fin_driver_payments_driver`: (driver_id)
- `idx_fin_driver_payments_tenant`: (tenant_id)

### fin_payment_batch_statuses

**Row Count:** ~0

| Column                   | Type          | Nullable | Default |
| ------------------------ | ------------- | -------- | ------- |
| code                     | `text`        | NO       | -       |
| created_at               | `timestamptz` | NO       | `now()` |
| label_translations       | `jsonb`       | NO       | -       |
| description_translations | `jsonb`       | YES      | -       |

**CHECK Constraints:**

- `chk_fin_payment_batch_statuses_description_translations_jsonb`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_fin_payment_batch_statuses_label_translations_jsonb`: (jsonb_typeof(label_translations) = 'object'::text)

### fin_payment_statuses

**Row Count:** ~0

| Column                   | Type          | Nullable | Default |
| ------------------------ | ------------- | -------- | ------- |
| code                     | `text`        | NO       | -       |
| created_at               | `timestamptz` | NO       | `now()` |
| label_translations       | `jsonb`       | NO       | -       |
| description_translations | `jsonb`       | YES      | -       |

**CHECK Constraints:**

- `chk_fin_payment_statuses_description_translations_jsonb`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_fin_payment_statuses_label_translations_jsonb`: (jsonb_typeof(label_translations) = 'object'::text)

### fin_toll_transactions

**Row Count:** ~0

| Column            | Type           | Nullable | Default              |
| ----------------- | -------------- | -------- | -------------------- |
| id                | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id         | `uuid`         | NO       | -                    |
| driver_id         | `uuid`         | NO       | -                    |
| vehicle_id        | `uuid`         | NO       | -                    |
| toll_gate         | `text`         | NO       | -                    |
| toll_date         | `date`         | NO       | -                    |
| amount            | `numeric`      | NO       | -                    |
| currency          | `varchar`      | NO       | -                    |
| metadata          | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at        | `timestamptz`  | NO       | `now()`              |
| created_by        | `uuid`         | YES      | -                    |
| updated_at        | `timestamptz`  | NO       | `now()`              |
| updated_by        | `uuid`         | YES      | -                    |
| deleted_at        | `timestamptz`  | YES      | -                    |
| deleted_by        | `uuid`         | YES      | -                    |
| deletion_reason   | `text`         | YES      | -                    |
| toll_gate_id      | `uuid`         | YES      | -                    |
| toll_timestamp    | `timestamptz`  | YES      | -                    |
| source            | `USER-DEFINED` | YES      | -                    |
| status            | `USER-DEFINED` | NO       | -                    |
| payment_batch_id  | `uuid`         | YES      | -                    |
| driver_payment_id | `uuid`         | YES      | -                    |
| trip_id           | `uuid`         | YES      | -                    |

**CHECK Constraints:**

- `fin_toll_transactions_amount_check`: (amount >= (0)::numeric)

**Indexes:**

- `fin_toll_transactions_created_by_idx`: (created_by)
- `fin_toll_transactions_deleted_at_idx`: (deleted_at)
- `fin_toll_transactions_driver_id_idx`: (driver_id)
- `fin_toll_transactions_metadata_idx`: (metadata)
- `fin_toll_transactions_tenant_driver_vehicle_date_unique`: (tenant_id, driver_id, vehicle_id, toll_date)
- `fin_toll_transactions_tenant_id_idx`: (tenant_id)
- `fin_toll_transactions_toll_date_idx`: (toll_date DESC)
- `fin_toll_transactions_updated_by_idx`: (updated_by)
- `fin_toll_transactions_vehicle_id_idx`: (vehicle_id)

### fin_traffic_fine_disputes

**Row Count:** ~0

| Column               | Type           | Nullable | Default                     |
| -------------------- | -------------- | -------- | --------------------------- |
| id                   | `uuid`         | NO       | `gen_random_uuid()`         |
| fine_id              | `uuid`         | NO       | -                           |
| submitted_by         | `uuid`         | NO       | -                           |
| submitted_at         | `timestamptz`  | NO       | `now()`                     |
| reason               | `text`         | NO       | -                           |
| supporting_documents | `jsonb`        | YES      | -                           |
| status               | `USER-DEFINED` | NO       | `'pending'::dispute_status` |
| reviewed_by          | `uuid`         | YES      | -                           |
| resolved_at          | `timestamptz`  | YES      | -                           |
| resolution_notes     | `text`         | YES      | -                           |
| metadata             | `jsonb`        | NO       | `'{}'::jsonb`               |
| created_at           | `timestamptz`  | NO       | `now()`                     |
| updated_at           | `timestamptz`  | NO       | `now()`                     |

### fin_traffic_fines

**Row Count:** ~0

| Column            | Type          | Nullable | Default              |
| ----------------- | ------------- | -------- | -------------------- |
| id                | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id         | `uuid`        | NO       | -                    |
| driver_id         | `uuid`        | NO       | -                    |
| vehicle_id        | `uuid`        | NO       | -                    |
| fine_reference    | `text`        | NO       | -                    |
| fine_date         | `date`        | NO       | -                    |
| fine_type         | `text`        | NO       | -                    |
| amount            | `numeric`     | NO       | -                    |
| currency          | `varchar`     | NO       | -                    |
| status            | `text`        | NO       | `'pending'::text`    |
| metadata          | `jsonb`       | NO       | `'{}'::jsonb`        |
| created_at        | `timestamptz` | NO       | `now()`              |
| created_by        | `uuid`        | YES      | -                    |
| updated_at        | `timestamptz` | NO       | `now()`              |
| updated_by        | `uuid`        | YES      | -                    |
| deleted_at        | `timestamptz` | YES      | -                    |
| deleted_by        | `uuid`        | YES      | -                    |
| deletion_reason   | `text`        | YES      | -                    |
| fine_timestamp    | `timestamptz` | YES      | -                    |
| fine_type_id      | `uuid`        | YES      | -                    |
| location          | `point`       | YES      | -                    |
| address           | `text`        | YES      | -                    |
| points_penalty    | `integer`     | YES      | -                    |
| issuing_authority | `text`        | YES      | -                    |
| deadline_date     | `date`        | YES      | -                    |
| paid_at           | `timestamptz` | YES      | -                    |
| payment_method_id | `uuid`        | YES      | -                    |
| driver_payment_id | `uuid`        | YES      | -                    |
| dispute_id        | `uuid`        | YES      | -                    |

**CHECK Constraints:**

- `fin_traffic_fines_amount_check`: (amount >= (0)::numeric)
- `fin_traffic_fines_status_check`: (status = ANY (ARRAY['pending'::text, 'paid'::text, 'disputed'::text, 'cancelled'::text]))

**Indexes:**

- `fin_traffic_fines_created_by_idx`: (created_by)
- `fin_traffic_fines_deleted_at_idx`: (deleted_at)
- `fin_traffic_fines_driver_id_idx`: (driver_id)
- `fin_traffic_fines_fine_date_idx`: (fine_date DESC)
- `fin_traffic_fines_metadata_idx`: (metadata)
- `fin_traffic_fines_status_active_idx`: (status)
- `fin_traffic_fines_tenant_id_fine_reference_key`: (tenant_id, fine_reference)
- `fin_traffic_fines_tenant_id_idx`: (tenant_id)
- `fin_traffic_fines_updated_by_idx`: (updated_by)
- `fin_traffic_fines_vehicle_id_idx`: (vehicle_id)

### fin_transaction_categories

**Row Count:** ~0

| Column                   | Type           | Nullable | Default             |
| ------------------------ | -------------- | -------- | ------------------- |
| id                       | `uuid`         | NO       | `gen_random_uuid()` |
| code                     | `varchar`      | NO       | -                   |
| category_type            | `USER-DEFINED` | NO       | -                   |
| parent_category_id       | `uuid`         | YES      | -                   |
| is_active                | `boolean`      | NO       | `true`              |
| created_at               | `timestamptz`  | NO       | `now()`             |
| updated_at               | `timestamptz`  | NO       | `now()`             |
| name_translations        | `jsonb`        | NO       | -                   |
| description_translations | `jsonb`        | YES      | -                   |

**CHECK Constraints:**

- `chk_fin_transaction_categories_description_translations_jsonb`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_fin_transaction_categories_name_translations_jsonb`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `fin_transaction_categories_code_key`: (code)

### fin_transactions

**Row Count:** ~0

| Column                  | Type          | Nullable | Default              |
| ----------------------- | ------------- | -------- | -------------------- |
| id                      | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id               | `uuid`        | NO       | -                    |
| account_id              | `uuid`        | NO       | -                    |
| transaction_type        | `text`        | NO       | -                    |
| amount                  | `numeric`     | NO       | -                    |
| currency                | `varchar`     | NO       | -                    |
| reference               | `text`        | NO       | -                    |
| description             | `text`        | YES      | -                    |
| transaction_date        | `timestamptz` | NO       | -                    |
| status                  | `text`        | NO       | `'pending'::text`    |
| metadata                | `jsonb`       | NO       | `'{}'::jsonb`        |
| created_at              | `timestamptz` | NO       | `now()`              |
| created_by              | `uuid`        | YES      | -                    |
| updated_at              | `timestamptz` | NO       | `now()`              |
| updated_by              | `uuid`        | YES      | -                    |
| deleted_at              | `timestamptz` | YES      | -                    |
| deleted_by              | `uuid`        | YES      | -                    |
| deletion_reason         | `text`        | YES      | -                    |
| counterparty_account_id | `uuid`        | YES      | -                    |
| net_amount              | `numeric`     | YES      | -                    |
| tax_rate                | `numeric`     | YES      | -                    |
| tax_amount              | `numeric`     | YES      | -                    |
| exchange_rate           | `numeric`     | YES      | -                    |
| category_id             | `uuid`        | YES      | -                    |
| entity_type             | `varchar`     | YES      | -                    |
| entity_id               | `uuid`        | YES      | -                    |
| payment_method_id       | `uuid`        | YES      | -                    |
| source_system           | `varchar`     | YES      | -                    |
| validated_by            | `uuid`        | YES      | -                    |
| validated_at            | `timestamptz` | YES      | -                    |

**CHECK Constraints:**

- `fin_transactions_amount_check`: (amount >= (0)::numeric)
- `fin_transactions_status_check`: (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))
- `fin_transactions_transaction_type_check`: (transaction_type = ANY (ARRAY['credit'::text, 'debit'::text]))

**Indexes:**

- `fin_transactions_account_id_idx`: (account_id)
- `fin_transactions_created_by_idx`: (created_by)
- `fin_transactions_deleted_at_idx`: (deleted_at)
- `fin_transactions_metadata_idx`: (metadata)
- `fin_transactions_status_active_idx`: (status)
- `fin_transactions_tenant_id_idx`: (tenant_id)
- `fin_transactions_transaction_date_idx`: (transaction_date DESC)
- `fin_transactions_updated_by_idx`: (updated_by)
- `idx_fin_transactions_account`: (account_id)
- `idx_fin_transactions_tenant`: (tenant_id)

## Fleet Module (flt\_)

### flt_vehicle_assignments

**Row Count:** ~0

| Column             | Type          | Nullable | Default                             |
| ------------------ | ------------- | -------- | ----------------------------------- |
| id                 | `uuid`        | NO       | `uuid_generate_v4()`                |
| tenant_id          | `uuid`        | NO       | -                                   |
| driver_id          | `uuid`        | NO       | -                                   |
| vehicle_id         | `uuid`        | NO       | -                                   |
| start_date         | `date`        | NO       | -                                   |
| end_date           | `date`        | YES      | -                                   |
| assignment_type    | `varchar`     | NO       | `'permanent'::character varying...` |
| metadata           | `jsonb`       | NO       | `'{}'::jsonb`                       |
| status             | `varchar`     | NO       | `'active'::character varying...`    |
| created_at         | `timestamptz` | NO       | `now()`                             |
| created_by         | `uuid`        | YES      | -                                   |
| updated_at         | `timestamptz` | NO       | `now()`                             |
| updated_by         | `uuid`        | YES      | -                                   |
| deleted_at         | `timestamptz` | YES      | -                                   |
| deleted_by         | `uuid`        | YES      | -                                   |
| deletion_reason    | `text`        | YES      | -                                   |
| handover_date      | `timestamptz` | YES      | -                                   |
| handover_location  | `text`        | YES      | -                                   |
| handover_type      | `varchar`     | YES      | -                                   |
| initial_odometer   | `integer`     | YES      | -                                   |
| initial_fuel_level | `integer`     | YES      | -                                   |
| initial_condition  | `jsonb`       | YES      | -                                   |
| handover_photos    | `jsonb`       | YES      | -                                   |
| photos_metadata    | `jsonb`       | YES      | -                                   |
| driver_signature   | `text`        | YES      | -                                   |
| fleet_signature    | `text`        | YES      | -                                   |
| handover_checklist | `jsonb`       | YES      | -                                   |
| return_date        | `timestamptz` | YES      | -                                   |
| return_odometer    | `integer`     | YES      | -                                   |
| return_fuel_level  | `integer`     | YES      | -                                   |
| return_condition   | `jsonb`       | YES      | -                                   |
| damages_reported   | `jsonb`       | YES      | -                                   |
| penalty_amount     | `numeric`     | YES      | -                                   |
| notes              | `text`        | YES      | -                                   |

**Indexes:**

- `flt_vehicle_assignments_created_by_idx`: (created_by)
- `flt_vehicle_assignments_deleted_at_idx`: (deleted_at)
- `flt_vehicle_assignments_driver_id_idx`: (driver_id)
- `flt_vehicle_assignments_end_date_idx`: (end_date)
- `flt_vehicle_assignments_metadata_idx`: (metadata)
- `flt_vehicle_assignments_start_date_idx`: (start_date)
- `flt_vehicle_assignments_status_active_idx`: (status)
- `flt_vehicle_assignments_tenant_driver_vehicle_start_uq`: (tenant_id, driver_id, vehicle_id, start_date)
- `flt_vehicle_assignments_tenant_id_idx`: (tenant_id)
- `flt_vehicle_assignments_updated_by_idx`: (updated_by)
- `flt_vehicle_assignments_vehicle_id_idx`: (vehicle_id)
- `idx_flt_vehicle_assignments_driver`: (driver_id)
- `idx_flt_vehicle_assignments_tenant`: (tenant_id)
- `idx_flt_vehicle_assignments_vehicle`: (vehicle_id)

### flt_vehicle_equipments

**Row Count:** ~0

| Column                   | Type          | Nullable | Default             |
| ------------------------ | ------------- | -------- | ------------------- |
| id                       | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id                | `uuid`        | NO       | -                   |
| vehicle_id               | `uuid`        | NO       | -                   |
| equipment_type           | `varchar`     | NO       | -                   |
| serial_number            | `varchar`     | YES      | -                   |
| provided_date            | `date`        | NO       | -                   |
| return_date              | `date`        | YES      | -                   |
| expiry_date              | `date`        | YES      | -                   |
| purchase_price           | `numeric`     | YES      | -                   |
| current_value            | `numeric`     | YES      | -                   |
| currency                 | `character`   | YES      | -                   |
| depreciation_rate        | `numeric`     | YES      | -                   |
| condition_at_provision   | `varchar`     | YES      | -                   |
| condition_at_return      | `varchar`     | YES      | -                   |
| damage_notes             | `text`        | YES      | -                   |
| status                   | `varchar`     | NO       | -                   |
| current_assignment_id    | `uuid`        | YES      | -                   |
| warranty_expiry          | `date`        | YES      | -                   |
| warranty_provider        | `varchar`     | YES      | -                   |
| last_maintenance_date    | `date`        | YES      | -                   |
| next_maintenance_date    | `date`        | YES      | -                   |
| notes                    | `text`        | YES      | -                   |
| metadata                 | `jsonb`       | YES      | -                   |
| created_at               | `timestamptz` | NO       | `now()`             |
| updated_at               | `timestamptz` | NO       | `now()`             |
| created_by               | `uuid`        | NO       | -                   |
| updated_by               | `uuid`        | YES      | -                   |
| deleted_at               | `timestamptz` | YES      | -                   |
| deleted_by               | `uuid`        | YES      | -                   |
| name_translations        | `jsonb`       | NO       | -                   |
| description_translations | `jsonb`       | YES      | -                   |

**CHECK Constraints:**

- `chk_flt_vehicle_equipments_description_translations_jsonb`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_flt_vehicle_equipments_name_translations_jsonb`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `idx_flt_vehicle_equipments_current_assignment_id`: (current_assignment_id)
- `idx_flt_vehicle_equipments_status`: (status)
- `idx_flt_vehicle_equipments_tenant_id`: (tenant_id)
- `idx_flt_vehicle_equipments_vehicle_id`: (vehicle_id)

### flt_vehicle_events

**Row Count:** ~0

| Column                | Type          | Nullable | Default              |
| --------------------- | ------------- | -------- | -------------------- |
| id                    | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id             | `uuid`        | NO       | -                    |
| vehicle_id            | `uuid`        | NO       | -                    |
| event_type            | `text`        | NO       | -                    |
| event_date            | `timestamptz` | NO       | -                    |
| severity              | `text`        | YES      | -                    |
| downtime_hours        | `integer`     | YES      | -                    |
| cost_amount           | `numeric`     | YES      | -                    |
| currency              | `character`   | NO       | `'EUR'::bpchar`      |
| details               | `jsonb`       | NO       | `'{}'::jsonb`        |
| notes                 | `text`        | YES      | -                    |
| created_at            | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| created_by            | `uuid`        | YES      | -                    |
| updated_at            | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| updated_by            | `uuid`        | YES      | -                    |
| deleted_at            | `timestamptz` | YES      | -                    |
| deleted_by            | `uuid`        | YES      | -                    |
| deletion_reason       | `text`        | YES      | -                    |
| driver_id             | `uuid`        | YES      | -                    |
| ride_id               | `uuid`        | YES      | -                    |
| assignment_id         | `uuid`        | YES      | -                    |
| responsible_party     | `varchar`     | YES      | -                    |
| fault_percentage      | `integer`     | YES      | -                    |
| liability_assessment  | `jsonb`       | YES      | -                    |
| police_report_number  | `text`        | YES      | -                    |
| police_station        | `text`        | YES      | -                    |
| insurance_claim_id    | `uuid`        | YES      | -                    |
| claim_status          | `varchar`     | YES      | -                    |
| repair_status         | `varchar`     | YES      | -                    |
| repair_shop_id        | `uuid`        | YES      | -                    |
| estimated_repair_days | `integer`     | YES      | -                    |
| actual_repair_days    | `integer`     | YES      | -                    |
| repair_invoice_id     | `uuid`        | YES      | -                    |
| photos                | `jsonb`       | YES      | -                    |

**CHECK Constraints:**

- `flt_vehicle_events_event_type_check`: (event_type = ANY (ARRAY['acquisition'::text, 'disposal'::text, 'maintenance'::text, 'accident'::tex...
- `flt_vehicle_events_severity_check`: ((severity IS NULL) OR (severity = ANY (ARRAY['minor'::text, 'moderate'::text, 'severe'::text, 'tota...

**Indexes:**

- `flt_vehicle_events_created_at_idx`: (created_at DESC)
- `flt_vehicle_events_created_by_idx`: (created_by)
- `flt_vehicle_events_deleted_at_idx`: (deleted_at)
- `flt_vehicle_events_details_idx`: (details)
- `flt_vehicle_events_event_date_idx`: (event_date)
- `flt_vehicle_events_event_type_idx`: (event_type)
- `flt_vehicle_events_severity_active_idx`: (severity)
- `flt_vehicle_events_tenant_id_idx`: (tenant_id)
- `flt_vehicle_events_updated_by_idx`: (updated_by)
- `flt_vehicle_events_vehicle_id_idx`: (vehicle_id)
- `idx_flt_vehicle_events_event_type_active`: (event_type)
- `idx_flt_vehicle_events_vehicle_id`: (vehicle_id)

### flt_vehicle_expenses

**Row Count:** ~0

| Column                 | Type          | Nullable | Default              |
| ---------------------- | ------------- | -------- | -------------------- |
| id                     | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id              | `uuid`        | NO       | -                    |
| vehicle_id             | `uuid`        | NO       | -                    |
| driver_id              | `uuid`        | YES      | -                    |
| ride_id                | `uuid`        | YES      | -                    |
| expense_date           | `date`        | NO       | -                    |
| expense_category       | `text`        | NO       | -                    |
| amount                 | `numeric`     | NO       | -                    |
| currency               | `character`   | NO       | `'EUR'::bpchar`      |
| payment_method         | `text`        | YES      | -                    |
| receipt_url            | `text`        | YES      | -                    |
| odometer_reading       | `integer`     | YES      | -                    |
| quantity               | `numeric`     | YES      | -                    |
| unit_price             | `numeric`     | YES      | -                    |
| location               | `text`        | YES      | -                    |
| vendor                 | `text`        | YES      | -                    |
| description            | `text`        | YES      | -                    |
| reimbursed             | `boolean`     | NO       | `false`              |
| reimbursed_at          | `timestamptz` | YES      | -                    |
| reimbursed_in_batch_id | `uuid`        | YES      | -                    |
| notes                  | `text`        | YES      | -                    |
| metadata               | `jsonb`       | NO       | `'{}'::jsonb`        |
| created_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| created_by             | `uuid`        | YES      | -                    |
| updated_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| updated_by             | `uuid`        | YES      | -                    |
| deleted_at             | `timestamptz` | YES      | -                    |
| deleted_by             | `uuid`        | YES      | -                    |
| deletion_reason        | `text`        | YES      | -                    |
| expense_subcategory    | `varchar`     | YES      | -                    |
| period_start           | `date`        | YES      | -                    |
| period_end             | `date`        | YES      | -                    |
| mileage_start          | `integer`     | YES      | -                    |
| mileage_end            | `integer`     | YES      | -                    |
| trip_ids               | `_text`       | YES      | -                    |
| requires_approval      | `boolean`     | YES      | `true`               |
| approval_threshold     | `numeric`     | YES      | -                    |
| approval_status        | `varchar`     | YES      | -                    |
| approved_by            | `uuid`        | YES      | -                    |
| approved_at            | `timestamptz` | YES      | -                    |
| rejection_reason       | `text`        | YES      | -                    |
| receipt_status         | `varchar`     | YES      | -                    |
| receipt_verified_by    | `uuid`        | YES      | -                    |
| receipt_verified_at    | `timestamptz` | YES      | -                    |
| receipt_issues         | `jsonb`       | YES      | -                    |
| ocr_extracted_data     | `jsonb`       | YES      | -                    |
| allocation_rule        | `varchar`     | YES      | -                    |
| driver_share_percent   | `integer`     | YES      | -                    |
| fleet_share_percent    | `integer`     | YES      | -                    |
| client_share_percent   | `integer`     | YES      | -                    |
| cost_center_id         | `uuid`        | YES      | -                    |
| payment_batch_id       | `uuid`        | YES      | -                    |
| payment_status         | `varchar`     | YES      | -                    |
| payment_date           | `date`        | YES      | -                    |
| payment_reference      | `text`        | YES      | -                    |

**CHECK Constraints:**

- `flt_vehicle_expenses_amount_check`: (amount > (0)::numeric)
- `flt_vehicle_expenses_expense_category_check`: (expense_category = ANY (ARRAY['fuel'::text, 'toll'::text, 'parking'::text, 'wash'::text, 'repair'::...
- `flt_vehicle_expenses_payment_method_check`: ((payment_method IS NULL) OR (payment_method = ANY (ARRAY['cash'::text, 'card'::text, 'fuel_card'::t...

**Indexes:**

- `flt_vehicle_expenses_created_at_idx`: (created_at DESC)
- `flt_vehicle_expenses_created_by_idx`: (created_by)
- `flt_vehicle_expenses_deleted_at_idx`: (deleted_at)
- `flt_vehicle_expenses_driver_id_idx`: (driver_id)
- `flt_vehicle_expenses_expense_category_idx`: (expense_category)
- `flt_vehicle_expenses_expense_date_idx`: (expense_date)
- `flt_vehicle_expenses_metadata_idx`: (metadata)
- `flt_vehicle_expenses_reimbursed_active_idx`: (reimbursed)
- `flt_vehicle_expenses_reimbursed_pending_idx`: (reimbursed)
- `flt_vehicle_expenses_ride_id_idx`: (ride_id)
- `flt_vehicle_expenses_tenant_id_idx`: (tenant_id)
- `flt_vehicle_expenses_updated_by_idx`: (updated_by)
- `flt_vehicle_expenses_vehicle_id_idx`: (vehicle_id)
- `idx_flt_vehicle_expenses_expense_category_active`: (expense_category)
- `idx_flt_vehicle_expenses_vehicle_id`: (vehicle_id)

### flt_vehicle_inspections

**Row Count:** ~1

| Column               | Type          | Nullable | Default             |
| -------------------- | ------------- | -------- | ------------------- |
| id                   | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id            | `uuid`        | NO       | -                   |
| vehicle_id           | `uuid`        | NO       | -                   |
| inspection_type      | `varchar`     | NO       | -                   |
| scheduled_date       | `date`        | NO       | -                   |
| actual_date          | `date`        | YES      | -                   |
| status               | `varchar`     | NO       | -                   |
| passed               | `boolean`     | YES      | `false`             |
| score                | `integer`     | YES      | -                   |
| inspector_name       | `varchar`     | YES      | -                   |
| inspection_center    | `varchar`     | YES      | -                   |
| certificate_number   | `varchar`     | YES      | -                   |
| expiry_date          | `date`        | YES      | -                   |
| issues_found         | `jsonb`       | YES      | -                   |
| corrective_actions   | `jsonb`       | YES      | -                   |
| report_url           | `text`        | YES      | -                   |
| certificate_url      | `text`        | YES      | -                   |
| photos_urls          | `jsonb`       | YES      | -                   |
| cost_amount          | `numeric`     | YES      | -                   |
| currency             | `character`   | YES      | -                   |
| next_inspection_date | `date`        | YES      | -                   |
| reminder_sent        | `boolean`     | YES      | `false`             |
| notes                | `text`        | YES      | -                   |
| metadata             | `jsonb`       | YES      | -                   |
| created_at           | `timestamptz` | YES      | `now()`             |
| updated_at           | `timestamptz` | YES      | `now()`             |
| created_by           | `uuid`        | NO       | -                   |
| updated_by           | `uuid`        | YES      | -                   |

**Indexes:**

- `idx_flt_vehicle_inspections_scheduled_date`: (scheduled_date)
- `idx_flt_vehicle_inspections_status`: (status)
- `idx_flt_vehicle_inspections_tenant_id`: (tenant_id)
- `idx_flt_vehicle_inspections_vehicle_id`: (vehicle_id)

### flt_vehicle_insurances

**Row Count:** ~1

| Column               | Type          | Nullable | Default                          |
| -------------------- | ------------- | -------- | -------------------------------- |
| id                   | `uuid`        | NO       | `uuid_generate_v4()`             |
| tenant_id            | `uuid`        | NO       | -                                |
| vehicle_id           | `uuid`        | NO       | -                                |
| provider_name        | `text`        | NO       | -                                |
| policy_number        | `text`        | NO       | -                                |
| policy_type          | `text`        | NO       | -                                |
| coverage_amount      | `numeric`     | YES      | -                                |
| currency             | `character`   | NO       | `'EUR'::bpchar`                  |
| deductible_amount    | `numeric`     | YES      | -                                |
| premium_amount       | `numeric`     | NO       | -                                |
| premium_frequency    | `text`        | NO       | `'annual'::character varying...` |
| start_date           | `date`        | NO       | -                                |
| end_date             | `date`        | NO       | -                                |
| is_active            | `boolean`     | NO       | `true`                           |
| auto_renew           | `boolean`     | NO       | `false`                          |
| contact_name         | `text`        | YES      | -                                |
| contact_phone        | `text`        | YES      | -                                |
| contact_email        | `text`        | YES      | -                                |
| document_url         | `text`        | YES      | -                                |
| claim_count          | `integer`     | NO       | `0`                              |
| last_claim_date      | `date`        | YES      | -                                |
| notes                | `text`        | YES      | -                                |
| metadata             | `jsonb`       | NO       | `'{}'::jsonb`                    |
| created_at           | `timestamptz` | NO       | `CURRENT_TIMESTAMP`              |
| created_by           | `uuid`        | YES      | -                                |
| updated_at           | `timestamptz` | NO       | `CURRENT_TIMESTAMP`              |
| updated_by           | `uuid`        | YES      | -                                |
| deleted_at           | `timestamptz` | YES      | -                                |
| deleted_by           | `uuid`        | YES      | -                                |
| deletion_reason      | `text`        | YES      | -                                |
| policy_category      | `varchar`     | YES      | -                                |
| policy_priority      | `integer`     | YES      | -                                |
| parent_policy_id     | `uuid`        | YES      | -                                |
| coverage_territories | `_text`       | YES      | -                                |
| coverage_drivers     | `varchar`     | YES      | -                                |
| driver_restrictions  | `jsonb`       | YES      | -                                |
| vehicle_usage        | `varchar`     | YES      | -                                |
| base_premium         | `numeric`     | YES      | -                                |
| excess_details       | `jsonb`       | YES      | -                                |
| no_claims_years      | `integer`     | YES      | `0`                              |
| no_claims_bonus      | `integer`     | YES      | `0`                              |
| claims_loading       | `integer`     | YES      | `0`                              |
| claims_count         | `integer`     | YES      | `0`                              |
| claims_detail        | `jsonb`       | YES      | -                                |
| total_claims_amount  | `numeric`     | YES      | -                                |
| claims_ratio         | `numeric`     | YES      | -                                |
| risk_rating          | `varchar`     | YES      | -                                |
| risk_factors         | `jsonb`       | YES      | -                                |
| special_conditions   | `jsonb`       | YES      | -                                |
| exclusions           | `jsonb`       | YES      | -                                |
| broker_id            | `uuid`        | YES      | -                                |
| broker_commission    | `numeric`     | YES      | -                                |
| broker_reference     | `text`        | YES      | -                                |
| renewal_date         | `date`        | YES      | -                                |
| renewal_notice_sent  | `boolean`     | YES      | `false`                          |
| renewal_quote        | `numeric`     | YES      | -                                |
| competitor_quotes    | `jsonb`       | YES      | -                                |
| payment_frequency    | `varchar`     | YES      | -                                |
| payment_method       | `varchar`     | YES      | -                                |
| payment_schedule     | `jsonb`       | YES      | -                                |
| next_payment_date    | `date`        | YES      | -                                |
| outstanding_amount   | `numeric`     | YES      | -                                |
| co_insurance         | `boolean`     | YES      | `false`                          |
| co_insurers          | `jsonb`       | YES      | -                                |
| lead_insurer         | `varchar`     | YES      | -                                |

**CHECK Constraints:**

- `flt_vehicle_insurances_claim_count_check`: (claim_count >= 0)
- `flt_vehicle_insurances_dates_check`: (end_date > start_date)
- `flt_vehicle_insurances_policy_type_check`: (policy_type = ANY (ARRAY['comprehensive'::text, 'third_party'::text, 'collision'::text, 'other'::te...
- `flt_vehicle_insurances_premium_amount_check`: (premium_amount > (0)::numeric)
- `flt_vehicle_insurances_premium_frequency_check`: (premium_frequency = ANY (ARRAY['annual'::text, 'semi_annual'::text, 'quarterly'::text, 'monthly'::t...

**Indexes:**

- `flt_vehicle_insurances_created_at_idx`: (created_at DESC)
- `flt_vehicle_insurances_end_date_active_idx`: (end_date)
- `flt_vehicle_insurances_is_active_idx`: (is_active)
- `flt_vehicle_insurances_metadata_idx`: (metadata)
- `flt_vehicle_insurances_policy_number_idx`: (policy_number)
- `flt_vehicle_insurances_policy_type_idx`: (policy_type)
- `flt_vehicle_insurances_tenant_id_idx`: (tenant_id)
- `flt_vehicle_insurances_tenant_policy_uq`: (tenant_id, policy_number)
- `flt_vehicle_insurances_vehicle_id_idx`: (vehicle_id)
- `idx_flt_vehicle_insurances_vehicle_id`: (vehicle_id)

### flt_vehicle_maintenance

**Row Count:** ~1

| Column                 | Type          | Nullable | Default                             |
| ---------------------- | ------------- | -------- | ----------------------------------- |
| id                     | `uuid`        | NO       | `uuid_generate_v4()`                |
| tenant_id              | `uuid`        | NO       | -                                   |
| vehicle_id             | `uuid`        | NO       | -                                   |
| maintenance_type       | `text`        | NO       | -                                   |
| scheduled_date         | `date`        | NO       | -                                   |
| completed_date         | `date`        | YES      | -                                   |
| odometer_reading       | `integer`     | YES      | -                                   |
| next_service_km        | `integer`     | YES      | -                                   |
| next_service_date      | `date`        | YES      | -                                   |
| provider_name          | `text`        | YES      | -                                   |
| provider_contact       | `text`        | YES      | -                                   |
| cost_amount            | `numeric`     | YES      | -                                   |
| currency               | `character`   | NO       | `'EUR'::bpchar`                     |
| invoice_reference      | `text`        | YES      | -                                   |
| parts_replaced         | `text`        | YES      | -                                   |
| notes                  | `text`        | YES      | -                                   |
| status                 | `text`        | NO       | `'scheduled'::character varying...` |
| metadata               | `jsonb`       | NO       | `'{}'::jsonb`                       |
| created_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`                 |
| created_by             | `uuid`        | YES      | -                                   |
| updated_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`                 |
| updated_by             | `uuid`        | YES      | -                                   |
| actual_start           | `timestamptz` | YES      | -                                   |
| actual_end             | `timestamptz` | YES      | -                                   |
| maintenance_category   | `varchar`     | YES      | -                                   |
| priority               | `varchar`     | YES      | -                                   |
| regulatory_requirement | `boolean`     | YES      | `false`                             |
| blocking_vehicle       | `boolean`     | YES      | `false`                             |
| warranty_covered       | `boolean`     | YES      | `false`                             |
| warranty_claim_number  | `text`        | YES      | -                                   |
| warranty_amount        | `numeric`     | YES      | -                                   |
| insurance_covered      | `boolean`     | YES      | `false`                             |
| insurance_claim_ref    | `text`        | YES      | -                                   |
| requested_by           | `uuid`        | YES      | -                                   |
| requested_at           | `timestamptz` | YES      | -                                   |
| approved_by            | `uuid`        | YES      | -                                   |
| approved_at            | `timestamptz` | YES      | -                                   |
| approval_notes         | `text`        | YES      | -                                   |
| labor_hours            | `numeric`     | YES      | -                                   |
| labor_rate             | `numeric`     | YES      | -                                   |
| labor_cost             | `numeric`     | YES      | -                                   |
| parts_cost             | `numeric`     | YES      | -                                   |
| other_costs            | `numeric`     | YES      | -                                   |
| tax_amount             | `numeric`     | YES      | -                                   |
| total_cost_excl_tax    | `numeric`     | YES      | -                                   |
| total_cost_incl_tax    | `numeric`     | YES      | -                                   |
| parts_detail           | `jsonb`       | YES      | -                                   |
| garage_id              | `uuid`        | YES      | -                                   |
| work_order_number      | `text`        | YES      | -                                   |
| mechanic_name          | `text`        | YES      | -                                   |
| mechanic_certification | `text`        | YES      | -                                   |
| quality_check_by       | `uuid`        | YES      | -                                   |
| quality_check_at       | `timestamptz` | YES      | -                                   |
| blocked_periods        | `jsonb`       | YES      | -                                   |
| deleted_at             | `timestamptz` | YES      | -                                   |
| deleted_by             | `uuid`        | YES      | -                                   |
| deletion_reason        | `text`        | YES      | -                                   |

**CHECK Constraints:**

- `flt_vehicle_maintenance_dates_check`: ((completed_date IS NULL) OR (completed_date >= scheduled_date))
- `flt_vehicle_maintenance_maintenance_type_check`: (maintenance_type = ANY (ARRAY['oil_change'::text, 'service'::text, 'inspection'::text, 'tire_rotati...
- `flt_vehicle_maintenance_status_check`: (status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))

**Indexes:**

- `flt_vehicle_maintenance_created_at_idx`: (created_at DESC)
- `flt_vehicle_maintenance_created_by_idx`: (created_by)
- `flt_vehicle_maintenance_maintenance_type_idx`: (maintenance_type)
- `flt_vehicle_maintenance_metadata_idx`: (metadata)
- `flt_vehicle_maintenance_next_service_idx`: (next_service_date)
- `flt_vehicle_maintenance_scheduled_date_active_idx`: (scheduled_date)
- `flt_vehicle_maintenance_status_active_idx`: (status)
- `flt_vehicle_maintenance_tenant_id_idx`: (tenant_id)
- `flt_vehicle_maintenance_updated_by_idx`: (updated_by)
- `flt_vehicle_maintenance_vehicle_id_idx`: (vehicle_id)
- `idx_flt_vehicle_maintenance_vehicle_id`: (vehicle_id)

### flt_vehicles

**Row Count:** ~1

| Column                        | Type          | Nullable | Default                           |
| ----------------------------- | ------------- | -------- | --------------------------------- |
| id                            | `uuid`        | NO       | `uuid_generate_v4()`              |
| tenant_id                     | `uuid`        | NO       | -                                 |
| make_id                       | `uuid`        | NO       | -                                 |
| model_id                      | `uuid`        | NO       | -                                 |
| license_plate                 | `text`        | NO       | -                                 |
| vin                           | `text`        | YES      | -                                 |
| year                          | `integer`     | NO       | -                                 |
| color                         | `text`        | YES      | -                                 |
| seats                         | `integer`     | NO       | `4`                               |
| vehicle_class                 | `text`        | YES      | -                                 |
| fuel_type                     | `text`        | YES      | -                                 |
| transmission                  | `text`        | YES      | -                                 |
| registration_date             | `date`        | YES      | -                                 |
| insurance_number              | `text`        | YES      | -                                 |
| insurance_expiry              | `date`        | YES      | -                                 |
| last_inspection               | `date`        | YES      | -                                 |
| next_inspection               | `date`        | YES      | -                                 |
| odometer                      | `integer`     | YES      | -                                 |
| ownership_type                | `text`        | NO       | `'owned'::character varying...`   |
| metadata                      | `jsonb`       | NO       | `'{}'::jsonb`                     |
| status                        | `text`        | NO       | `'pending'::character varying...` |
| created_at                    | `timestamptz` | NO       | `CURRENT_TIMESTAMP`               |
| created_by                    | `uuid`        | YES      | -                                 |
| updated_at                    | `timestamptz` | NO       | `CURRENT_TIMESTAMP`               |
| updated_by                    | `uuid`        | YES      | -                                 |
| deleted_at                    | `timestamptz` | YES      | -                                 |
| deleted_by                    | `uuid`        | YES      | -                                 |
| deletion_reason               | `text`        | YES      | -                                 |
| country_code                  | `character`   | YES      | -                                 |
| requires_professional_license | `boolean`     | YES      | `false`                           |
| documents_status              | `jsonb`       | YES      | -                                 |
| body_type                     | `varchar`     | YES      | -                                 |
| passenger_capacity            | `integer`     | YES      | -                                 |
| car_length_cm                 | `integer`     | YES      | -                                 |
| car_width_cm                  | `integer`     | YES      | -                                 |
| car_height_cm                 | `integer`     | YES      | -                                 |
| vehicle_class_id              | `uuid`        | YES      | -                                 |
| first_registration_date       | `date`        | YES      | -                                 |
| warranty_expiry               | `date`        | YES      | -                                 |
| service_interval_km           | `integer`     | YES      | -                                 |
| next_service_at_km            | `integer`     | YES      | -                                 |
| insurance_policy_number       | `text`        | YES      | -                                 |
| insurance_coverage_type       | `text`        | YES      | -                                 |
| insurance_amount              | `numeric`     | YES      | -                                 |
| insurance_issue_date          | `date`        | YES      | -                                 |
| ownership_type_id             | `uuid`        | YES      | -                                 |
| owner_id                      | `uuid`        | YES      | -                                 |
| acquisition_date              | `date`        | YES      | -                                 |
| lease_end_date                | `date`        | YES      | -                                 |
| residual_value                | `numeric`     | YES      | -                                 |
| status_id                     | `uuid`        | YES      | -                                 |
| status_changed_at             | `timestamptz` | YES      | -                                 |

**Indexes:**

- `flt_vehicles_created_by_idx`: (created_by)
- `flt_vehicles_deleted_at_idx`: (deleted_at)
- `flt_vehicles_license_plate_idx`: (license_plate)
- `flt_vehicles_make_id_idx`: (make_id)
- `flt_vehicles_metadata_idx`: (metadata)
- `flt_vehicles_model_id_idx`: (model_id)
- `flt_vehicles_next_inspection_idx`: (next_inspection)
- `flt_vehicles_status_active_idx`: (status)
- `flt_vehicles_tenant_id_idx`: (tenant_id)
- `flt_vehicles_tenant_plate_uq`: (tenant_id, license_plate)
- `flt_vehicles_tenant_vin_uq`: (tenant_id, vin)
- `flt_vehicles_updated_by_idx`: (updated_by)
- `flt_vehicles_vin_idx`: (vin)
- `idx_flt_vehicles_owner`: (owner_id)
- `idx_flt_vehicles_tenant`: (tenant_id)
- `idx_flt_vehicles_tenant_status`: (tenant_id, status)
- `idx_flt_vehicles_vin`: (vin)

## HQ Module (hq\_)

### hq_offer_rules

**Row Count:** ~11

| Column                   | Type          | Nullable | Default             |
| ------------------------ | ------------- | -------- | ------------------- |
| id                       | `uuid`        | NO       | `gen_random_uuid()` |
| country_code             | `varchar`     | YES      | -                   |
| offer_type               | `varchar`     | NO       | -                   |
| code                     | `varchar`     | NO       | -                   |
| name_translations        | `jsonb`       | NO       | -                   |
| description_translations | `jsonb`       | YES      | -                   |
| free_months              | `integer`     | YES      | -                   |
| referrer_free_months     | `integer`     | YES      | -                   |
| referee_free_months      | `integer`     | YES      | -                   |
| discount_percent         | `numeric`     | YES      | -                   |
| requires_payment_method  | `boolean`     | NO       | `false`             |
| requires_qualification   | `boolean`     | NO       | `false`             |
| max_uses_total           | `integer`     | YES      | -                   |
| max_uses_per_user        | `integer`     | YES      | -                   |
| fleet_size_min           | `integer`     | YES      | -                   |
| fleet_size_max           | `integer`     | YES      | -                   |
| is_active                | `boolean`     | NO       | `true`              |
| valid_from               | `date`        | YES      | -                   |
| valid_until              | `date`        | YES      | -                   |
| display_order            | `integer`     | NO       | `0`                 |
| created_at               | `timestamptz` | NO       | `now()`             |
| updated_at               | `timestamptz` | NO       | `now()`             |

**CHECK Constraints:**

- `chk_hq_offer_desc`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_hq_offer_discount`: ((discount_percent IS NULL) OR ((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::n...
- `chk_hq_offer_fleet`: ((fleet_size_min IS NULL) OR (fleet_size_max IS NULL) OR (fleet_size_max >= fleet_size_min))
- `chk_hq_offer_name`: (jsonb_typeof(name_translations) = 'object'::text)
- `chk_hq_offer_type`: ((offer_type)::text = ANY ((ARRAY['trial'::character varying, 'referral'::character varying, 'promo'...

**Indexes:**

- `hq_offer_rules_code_key`: (code)
- `idx_hq_offer_active`: (is_active)
- `idx_hq_offer_country`: (country_code)
- `idx_hq_offer_type`: (offer_type)

### hq_pricing_rules

**Row Count:** ~10

| Column                   | Type          | Nullable | Default             |
| ------------------------ | ------------- | -------- | ------------------- |
| id                       | `uuid`        | NO       | `gen_random_uuid()` |
| country_code             | `varchar`     | YES      | -                   |
| code                     | `varchar`     | NO       | -                   |
| name_translations        | `jsonb`       | NO       | -                   |
| description_translations | `jsonb`       | YES      | -                   |
| fleet_size_min           | `integer`     | NO       | -                   |
| fleet_size_max           | `integer`     | YES      | -                   |
| max_discount_percent     | `numeric`     | NO       | `0`                 |
| requires_approval        | `boolean`     | NO       | `false`             |
| approval_role            | `varchar`     | YES      | -                   |
| is_active                | `boolean`     | NO       | `true`              |
| valid_from               | `date`        | YES      | -                   |
| valid_until              | `date`        | YES      | -                   |
| display_order            | `integer`     | NO       | `0`                 |
| created_at               | `timestamptz` | NO       | `now()`             |
| updated_at               | `timestamptz` | NO       | `now()`             |

**CHECK Constraints:**

- `chk_hq_pricing_approval`: ((requires_approval = false) OR (approval_role IS NOT NULL))
- `chk_hq_pricing_desc`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_hq_pricing_discount`: ((max_discount_percent >= (0)::numeric) AND (max_discount_percent <= (100)::numeric))
- `chk_hq_pricing_fleet`: ((fleet_size_min >= 0) AND ((fleet_size_max IS NULL) OR (fleet_size_max >= fleet_size_min)))
- `chk_hq_pricing_name`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `hq_pricing_rules_code_key`: (code)
- `idx_hq_pricing_active`: (is_active)
- `idx_hq_pricing_country`: (country_code)
- `idx_hq_pricing_fleet`: (fleet_size_min, fleet_size_max)

## Revenue Module (rev\_)

### rev_driver_revenues

**Row Count:** ~0

| Column            | Type           | Nullable | Default                            |
| ----------------- | -------------- | -------- | ---------------------------------- |
| id                | `uuid`         | NO       | `uuid_generate_v4()`               |
| tenant_id         | `uuid`         | NO       | -                                  |
| driver_id         | `uuid`         | NO       | -                                  |
| period_start      | `date`         | NO       | -                                  |
| period_end        | `date`         | NO       | -                                  |
| total_revenue     | `numeric`      | NO       | `0`                                |
| commission_amount | `numeric`      | NO       | `0`                                |
| net_revenue       | `numeric`      | NO       | `0`                                |
| metadata          | `jsonb`        | NO       | `'{}'::jsonb`                      |
| created_at        | `timestamptz`  | NO       | `now()`                            |
| created_by        | `uuid`         | YES      | -                                  |
| updated_at        | `timestamptz`  | NO       | `now()`                            |
| updated_by        | `uuid`         | YES      | -                                  |
| deleted_at        | `timestamptz`  | YES      | -                                  |
| deleted_by        | `uuid`         | YES      | -                                  |
| deletion_reason   | `text`         | YES      | -                                  |
| platform_id       | `uuid`         | YES      | -                                  |
| period_type       | `USER-DEFINED` | YES      | -                                  |
| currency          | `character`    | YES      | -                                  |
| import_id         | `uuid`         | YES      | -                                  |
| status            | `USER-DEFINED` | NO       | `'pending'::driver_revenue_status` |
| validated_by      | `uuid`         | YES      | -                                  |
| validated_at      | `timestamptz`  | YES      | -                                  |
| adjustment_reason | `text`         | YES      | -                                  |

**CHECK Constraints:**

- `rev_driver_revenues_commission_amount_check`: (commission_amount >= (0)::numeric)
- `rev_driver_revenues_net_revenue_check`: (net_revenue >= (0)::numeric)
- `rev_driver_revenues_period_check`: (period_end >= period_start)
- `rev_driver_revenues_total_revenue_check`: (total_revenue >= (0)::numeric)

**Indexes:**

- `rev_driver_revenues_created_by_idx`: (created_by)
- `rev_driver_revenues_deleted_at_idx`: (deleted_at)
- `rev_driver_revenues_driver_id_idx`: (driver_id)
- `rev_driver_revenues_metadata_idx`: (metadata)
- `rev_driver_revenues_period_end_idx`: (period_end DESC)
- `rev_driver_revenues_period_start_idx`: (period_start DESC)
- `rev_driver_revenues_tenant_id_driver_id_period_start_key`: (tenant_id, driver_id, period_start)
- `rev_driver_revenues_tenant_id_idx`: (tenant_id)
- `rev_driver_revenues_updated_by_idx`: (updated_by)

### rev_reconciliation_lines

**Row Count:** ~0

| Column            | Type      | Nullable | Default             |
| ----------------- | --------- | -------- | ------------------- |
| id                | `uuid`    | NO       | `gen_random_uuid()` |
| reconciliation_id | `uuid`    | NO       | -                   |
| driver_id         | `uuid`    | YES      | -                   |
| platform_id       | `uuid`    | YES      | -                   |
| expected_amount   | `numeric` | NO       | -                   |
| received_amount   | `numeric` | NO       | -                   |
| notes             | `text`    | YES      | -                   |
| metadata          | `jsonb`   | YES      | `'{}'::jsonb`       |

### rev_reconciliations

**Row Count:** ~0

| Column              | Type           | Nullable | Default              |
| ------------------- | -------------- | -------- | -------------------- |
| id                  | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id           | `uuid`         | NO       | -                    |
| import_id           | `uuid`         | NO       | -                    |
| reconciliation_date | `date`         | NO       | -                    |
| status              | `text`         | NO       | `'pending'::text`    |
| notes               | `text`         | YES      | -                    |
| metadata            | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at          | `timestamptz`  | NO       | `now()`              |
| created_by          | `uuid`         | YES      | -                    |
| updated_at          | `timestamptz`  | NO       | `now()`              |
| updated_by          | `uuid`         | YES      | -                    |
| deleted_at          | `timestamptz`  | YES      | -                    |
| deleted_by          | `uuid`         | YES      | -                    |
| deletion_reason     | `text`         | YES      | -                    |
| reconciliation_type | `USER-DEFINED` | YES      | -                    |
| expected_amount     | `numeric`      | YES      | -                    |
| received_amount     | `numeric`      | YES      | -                    |
| tolerance_amount    | `numeric`      | YES      | -                    |
| currency            | `character`    | YES      | -                    |
| auto_matched        | `boolean`      | YES      | `false`              |
| assigned_to         | `uuid`         | YES      | -                    |
| resolved_at         | `timestamptz`  | YES      | -                    |
| resolved_by         | `uuid`         | YES      | -                    |
| resolution_notes    | `text`         | YES      | -                    |
| requires_action     | `boolean`      | YES      | `false`              |
| driver_id           | `uuid`         | YES      | -                    |

**CHECK Constraints:**

- `rev_reconciliations_status_check`: (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))

**Indexes:**

- `rev_reconciliations_created_by_idx`: (created_by)
- `rev_reconciliations_deleted_at_idx`: (deleted_at)
- `rev_reconciliations_import_id_idx`: (import_id)
- `rev_reconciliations_metadata_idx`: (metadata)
- `rev_reconciliations_reconciliation_date_idx`: (reconciliation_date DESC)
- `rev_reconciliations_status_active_idx`: (status)
- `rev_reconciliations_tenant_id_idx`: (tenant_id)
- `rev_reconciliations_tenant_id_import_id_reconciliation_date_key`: (tenant_id, import_id, reconciliation_date)
- `rev_reconciliations_updated_by_idx`: (updated_by)

### rev_revenue_imports

**Row Count:** ~0

| Column                  | Type           | Nullable | Default              |
| ----------------------- | -------------- | -------- | -------------------- |
| id                      | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id               | `uuid`         | NO       | -                    |
| import_reference        | `text`         | NO       | -                    |
| import_date             | `date`         | NO       | -                    |
| status                  | `text`         | NO       | `'pending'::text`    |
| total_revenue           | `numeric`      | NO       | `0`                  |
| currency                | `varchar`      | NO       | -                    |
| metadata                | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at              | `timestamptz`  | NO       | `now()`              |
| created_by              | `uuid`         | YES      | -                    |
| updated_at              | `timestamptz`  | NO       | `now()`              |
| updated_by              | `uuid`         | YES      | -                    |
| deleted_at              | `timestamptz`  | YES      | -                    |
| deleted_by              | `uuid`         | YES      | -                    |
| deletion_reason         | `text`         | YES      | -                    |
| platform_id             | `uuid`         | YES      | -                    |
| source_type             | `USER-DEFINED` | YES      | -                    |
| file_url                | `text`         | YES      | -                    |
| source_currency         | `character`    | YES      | -                    |
| exchange_rate           | `numeric`      | YES      | -                    |
| converted_amount        | `numeric`      | YES      | -                    |
| rows_count              | `integer`      | YES      | `0`                  |
| errors_count            | `integer`      | YES      | `0`                  |
| warnings_count          | `integer`      | YES      | `0`                  |
| processing_started_at   | `timestamptz`  | YES      | -                    |
| processing_completed_at | `timestamptz`  | YES      | -                    |
| status_reason           | `text`         | YES      | -                    |
| retry_count             | `integer`      | YES      | `0`                  |
| last_error              | `text`         | YES      | -                    |

**CHECK Constraints:**

- `rev_revenue_imports_status_check`: (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancel...
- `rev_revenue_imports_total_revenue_check`: (total_revenue >= (0)::numeric)

**Indexes:**

- `rev_revenue_imports_created_by_idx`: (created_by)
- `rev_revenue_imports_deleted_at_idx`: (deleted_at)
- `rev_revenue_imports_import_date_idx`: (import_date DESC)
- `rev_revenue_imports_metadata_idx`: (metadata)
- `rev_revenue_imports_status_active_idx`: (status)
- `rev_revenue_imports_tenant_id_idx`: (tenant_id)
- `rev_revenue_imports_tenant_id_import_reference_key`: (tenant_id, import_reference)
- `rev_revenue_imports_updated_by_idx`: (updated_by)

## Rider/Driver Module (rid\_)

### rid_driver_blacklists

**Row Count:** ~0

| Column                      | Type           | Nullable | Default                           |
| --------------------------- | -------------- | -------- | --------------------------------- |
| id                          | `uuid`         | NO       | `uuid_generate_v4()`              |
| tenant_id                   | `uuid`         | NO       | -                                 |
| driver_id                   | `uuid`         | NO       | -                                 |
| reason                      | `text`         | NO       | -                                 |
| start_date                  | `timestamptz`  | NO       | -                                 |
| end_date                    | `timestamptz`  | YES      | -                                 |
| metadata                    | `jsonb`        | NO       | `'{}'::jsonb`                     |
| created_at                  | `timestamptz`  | NO       | `now()`                           |
| created_by                  | `uuid`         | YES      | -                                 |
| updated_at                  | `timestamptz`  | NO       | `now()`                           |
| updated_by                  | `uuid`         | YES      | -                                 |
| deleted_at                  | `timestamptz`  | YES      | -                                 |
| deleted_by                  | `uuid`         | YES      | -                                 |
| deletion_reason             | `text`         | YES      | -                                 |
| category                    | `USER-DEFINED` | YES      | -                                 |
| severity                    | `USER-DEFINED` | YES      | -                                 |
| status                      | `USER-DEFINED` | YES      | `'active'::blacklist_status`      |
| incident_date               | `timestamptz`  | YES      | -                                 |
| incident_location           | `text`         | YES      | -                                 |
| incident_description        | `text`         | YES      | -                                 |
| evidence_documents          | `jsonb`        | YES      | `'[]'::jsonb...`                  |
| decided_by                  | `uuid`         | YES      | -                                 |
| decided_at                  | `timestamptz`  | YES      | -                                 |
| decision_notes              | `text`         | YES      | -                                 |
| decision_reviewed           | `boolean`      | YES      | `false`                           |
| reviewed_by                 | `uuid`         | YES      | -                                 |
| reviewed_at                 | `timestamptz`  | YES      | -                                 |
| appeal_status               | `USER-DEFINED` | YES      | `'not_applicable'::appeal_status` |
| appeal_submitted_at         | `timestamptz`  | YES      | -                                 |
| appeal_reason               | `text`         | YES      | -                                 |
| appeal_reviewed_at          | `timestamptz`  | YES      | -                                 |
| appeal_reviewed_by          | `uuid`         | YES      | -                                 |
| appeal_decision             | `text`         | YES      | -                                 |
| appeal_outcome              | `varchar`      | YES      | -                                 |
| legal_review_required       | `boolean`      | YES      | `false`                           |
| legal_reviewed_at           | `timestamptz`  | YES      | -                                 |
| legal_reviewed_by           | `uuid`         | YES      | -                                 |
| legal_case_number           | `varchar`      | YES      | -                                 |
| legal_notes                 | `text`         | YES      | -                                 |
| reinstatement_conditions    | `text`         | YES      | -                                 |
| reinstatement_eligible_date | `date`         | YES      | -                                 |
| reinstated_at               | `timestamptz`  | YES      | -                                 |
| reinstated_by               | `uuid`         | YES      | -                                 |
| driver_notified_at          | `timestamptz`  | YES      | -                                 |
| notification_method         | `varchar`      | YES      | -                                 |
| acknowledgment_received     | `boolean`      | YES      | `false`                           |
| acknowledgment_date         | `timestamptz`  | YES      | -                                 |

**CHECK Constraints:**

- `rid_driver_blacklists_date_check`: ((end_date IS NULL) OR (end_date >= start_date))

**Indexes:**

- `idx_rid_driver_blacklists_driver_id`: (driver_id)
- `rid_driver_blacklists_created_by_idx`: (created_by)
- `rid_driver_blacklists_deleted_at_idx`: (deleted_at)
- `rid_driver_blacklists_driver_id_idx`: (driver_id)
- `rid_driver_blacklists_end_date_idx`: (end_date)
- `rid_driver_blacklists_metadata_gin`: (metadata)
- `rid_driver_blacklists_start_date_idx`: (start_date)
- `rid_driver_blacklists_tenant_id_idx`: (tenant_id)
- `rid_driver_blacklists_updated_by_idx`: (updated_by)

### rid_driver_cooperation_terms

**Row Count:** ~0

| Column                     | Type           | Nullable | Default                         |
| -------------------------- | -------------- | -------- | ------------------------------- |
| id                         | `uuid`         | NO       | `uuid_generate_v4()`            |
| tenant_id                  | `uuid`         | NO       | -                               |
| driver_id                  | `uuid`         | NO       | -                               |
| terms_version              | `text`         | NO       | -                               |
| accepted_at                | `timestamptz`  | YES      | -                               |
| effective_date             | `date`         | YES      | -                               |
| expiry_date                | `date`         | YES      | -                               |
| metadata                   | `jsonb`        | NO       | `'{}'::jsonb`                   |
| created_at                 | `timestamptz`  | NO       | `now()`                         |
| created_by                 | `uuid`         | YES      | -                               |
| updated_at                 | `timestamptz`  | NO       | `now()`                         |
| updated_by                 | `uuid`         | YES      | -                               |
| deleted_at                 | `timestamptz`  | YES      | -                               |
| deleted_by                 | `uuid`         | YES      | -                               |
| deletion_reason            | `text`         | YES      | -                               |
| status                     | `USER-DEFINED` | YES      | `'pending'::cooperation_status` |
| compensation_model         | `USER-DEFINED` | YES      | -                               |
| fixed_rental_amount        | `numeric`      | YES      | -                               |
| percentage_split_company   | `numeric`      | YES      | -                               |
| percentage_split_driver    | `numeric`      | YES      | -                               |
| salary_amount              | `numeric`      | YES      | -                               |
| crew_rental_terms          | `text`         | YES      | -                               |
| buyout_amount              | `numeric`      | YES      | -                               |
| custom_terms               | `text`         | YES      | -                               |
| signature_method           | `USER-DEFINED` | YES      | -                               |
| signature_data             | `jsonb`        | YES      | -                               |
| signature_ip               | `varchar`      | YES      | -                               |
| signature_timestamp        | `timestamptz`  | YES      | -                               |
| digital_signature_verified | `boolean`      | YES      | `false`                         |
| previous_version_id        | `uuid`         | YES      | -                               |
| version_change_reason      | `text`         | YES      | -                               |
| legal_review_required      | `boolean`      | YES      | `false`                         |
| legal_reviewed_at          | `timestamptz`  | YES      | -                               |
| legal_reviewed_by          | `uuid`         | YES      | -                               |
| legal_review_notes         | `text`         | YES      | -                               |
| auto_renewal               | `boolean`      | YES      | `false`                         |
| auto_renewal_notice_days   | `integer`      | YES      | `30`                            |
| renewal_reminder_sent_at   | `timestamptz`  | YES      | -                               |
| termination_date           | `timestamptz`  | YES      | -                               |
| termination_reason         | `text`         | YES      | -                               |
| termination_initiated_by   | `uuid`         | YES      | -                               |
| early_termination_penalty  | `numeric`      | YES      | -                               |

**Indexes:**

- `rid_driver_cooperation_terms_accepted_at_idx`: (accepted_at)
- `rid_driver_cooperation_terms_created_by_idx`: (created_by)
- `rid_driver_cooperation_terms_deleted_at_idx`: (deleted_at)
- `rid_driver_cooperation_terms_driver_id_idx`: (driver_id)
- `rid_driver_cooperation_terms_effective_date_idx`: (effective_date)
- `rid_driver_cooperation_terms_expiry_date_idx`: (expiry_date)
- `rid_driver_cooperation_terms_metadata_gin`: (metadata)
- `rid_driver_cooperation_terms_tenant_driver_version_key`: (tenant_id, driver_id, terms_version)
- `rid_driver_cooperation_terms_tenant_id_idx`: (tenant_id)
- `rid_driver_cooperation_terms_terms_version_idx`: (terms_version)
- `rid_driver_cooperation_terms_updated_by_idx`: (updated_by)

### rid_driver_documents

**Row Count:** ~0

| Column                 | Type           | Nullable | Default                                   |
| ---------------------- | -------------- | -------- | ----------------------------------------- |
| id                     | `uuid`         | NO       | `uuid_generate_v4()`                      |
| tenant_id              | `uuid`         | NO       | -                                         |
| driver_id              | `uuid`         | NO       | -                                         |
| document_id            | `uuid`         | NO       | -                                         |
| expiry_date            | `date`         | YES      | -                                         |
| verified               | `boolean`      | NO       | `false`                                   |
| verified_by            | `uuid`         | YES      | -                                         |
| verified_at            | `timestamptz`  | YES      | -                                         |
| created_at             | `timestamptz`  | NO       | `now()`                                   |
| created_by             | `uuid`         | YES      | -                                         |
| updated_at             | `timestamptz`  | NO       | `now()`                                   |
| updated_by             | `uuid`         | YES      | -                                         |
| deleted_at             | `timestamptz`  | YES      | -                                         |
| deleted_by             | `uuid`         | YES      | -                                         |
| deletion_reason        | `text`         | YES      | -                                         |
| document_type          | `USER-DEFINED` | YES      | -                                         |
| requires_renewal       | `boolean`      | YES      | `true`                                    |
| renewal_frequency_days | `integer`      | YES      | -                                         |
| reminder_sent_at       | `timestamptz`  | YES      | -                                         |
| reminder_days_before   | `integer`      | YES      | `30`                                      |
| verification_status    | `USER-DEFINED` | YES      | `'pending'::document_verification_status` |
| rejection_reason       | `text`         | YES      | -                                         |
| verification_method    | `varchar`      | YES      | -                                         |
| document_number        | `varchar`      | YES      | -                                         |
| issuing_authority      | `varchar`      | YES      | -                                         |
| issuing_country        | `character`    | YES      | -                                         |
| issue_date             | `date`         | YES      | -                                         |
| replaced_document_id   | `uuid`         | YES      | -                                         |
| replacement_reason     | `text`         | YES      | -                                         |
| ocr_data               | `jsonb`        | YES      | -                                         |
| confidence_score       | `numeric`      | YES      | -                                         |

**Indexes:**

- `idx_rid_driver_documents_driver_id`: (driver_id)
- `idx_rid_driver_documents_tenant`: (tenant_id)
- `rid_driver_documents_created_by_idx`: (created_by)
- `rid_driver_documents_deleted_at_idx`: (deleted_at)
- `rid_driver_documents_document_id_idx`: (document_id)
- `rid_driver_documents_driver_id_idx`: (driver_id)
- `rid_driver_documents_expiry_date_idx`: (expiry_date)
- `rid_driver_documents_tenant_id_idx`: (tenant_id)
- `rid_driver_documents_updated_by_idx`: (updated_by)

### rid_driver_languages

**Row Count:** ~1

| Column          | Type          | Nullable | Default              |
| --------------- | ------------- | -------- | -------------------- |
| id              | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id       | `uuid`        | NO       | -                    |
| driver_id       | `uuid`        | NO       | -                    |
| language_code   | `character`   | NO       | -                    |
| proficiency     | `text`        | YES      | -                    |
| created_at      | `timestamptz` | NO       | `now()`              |
| created_by      | `uuid`        | YES      | -                    |
| updated_at      | `timestamptz` | NO       | `now()`              |
| updated_by      | `uuid`        | YES      | -                    |
| deleted_at      | `timestamptz` | YES      | -                    |
| deleted_by      | `uuid`        | YES      | -                    |
| deletion_reason | `text`        | YES      | -                    |

**CHECK Constraints:**

- `rid_driver_languages_language_code_check`: (language_code ~ '^[A-Za-z]{2}$'::text)
- `rid_driver_languages_proficiency_check`: (proficiency = ANY (ARRAY['basic'::text, 'conversational'::text, 'fluent'::text, 'native'::text]))

**Indexes:**

- `rid_driver_languages_lang_idx`: (language_code)
- `rid_driver_languages_unique`: (tenant_id, driver_id, language_code)

### rid_driver_performances

**Row Count:** ~0

| Column                    | Type          | Nullable | Default              |
| ------------------------- | ------------- | -------- | -------------------- |
| id                        | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id                 | `uuid`        | NO       | -                    |
| driver_id                 | `uuid`        | NO       | -                    |
| period_start              | `date`        | NO       | -                    |
| period_end                | `date`        | NO       | -                    |
| trips_completed           | `integer`     | NO       | `0`                  |
| trips_cancelled           | `integer`     | NO       | `0`                  |
| on_time_rate              | `numeric`     | YES      | -                    |
| avg_rating                | `numeric`     | YES      | -                    |
| incidents_count           | `integer`     | NO       | `0`                  |
| earnings_total            | `numeric`     | NO       | `0`                  |
| hours_online              | `numeric`     | YES      | -                    |
| metadata                  | `jsonb`       | NO       | `'{}'::jsonb`        |
| created_at                | `timestamptz` | NO       | `now()`              |
| created_by                | `uuid`        | YES      | -                    |
| updated_at                | `timestamptz` | NO       | `now()`              |
| updated_by                | `uuid`        | YES      | -                    |
| deleted_at                | `timestamptz` | YES      | -                    |
| deleted_by                | `uuid`        | YES      | -                    |
| deletion_reason           | `text`        | YES      | -                    |
| platform_id               | `uuid`        | YES      | -                    |
| platform_trips_completed  | `integer`     | YES      | `0`                  |
| platform_earnings         | `numeric`     | YES      | `0`                  |
| cash_trips                | `integer`     | YES      | `0`                  |
| cash_earnings             | `numeric`     | YES      | `0`                  |
| card_trips                | `integer`     | YES      | `0`                  |
| card_earnings             | `numeric`     | YES      | `0`                  |
| wallet_trips              | `integer`     | YES      | `0`                  |
| wallet_earnings           | `numeric`     | YES      | `0`                  |
| mixed_payment_trips       | `integer`     | YES      | `0`                  |
| rank_in_period            | `integer`     | YES      | -                    |
| tier                      | `varchar`     | YES      | -                    |
| tier_change               | `varchar`     | YES      | -                    |
| acceptance_rate           | `numeric`     | YES      | -                    |
| cancellation_rate         | `numeric`     | YES      | -                    |
| completion_rate           | `numeric`     | YES      | -                    |
| avg_trip_duration_minutes | `numeric`     | YES      | -                    |
| avg_earnings_per_trip     | `numeric`     | YES      | -                    |
| avg_earnings_per_hour     | `numeric`     | YES      | -                    |
| total_ratings_received    | `integer`     | YES      | `0`                  |
| five_star_ratings         | `integer`     | YES      | `0`                  |
| one_star_ratings          | `integer`     | YES      | `0`                  |
| compliments_received      | `integer`     | YES      | `0`                  |
| complaints_received       | `integer`     | YES      | `0`                  |
| total_fuel_cost           | `numeric`     | YES      | `0`                  |
| total_expenses            | `numeric`     | YES      | `0`                  |
| net_earnings              | `numeric`     | YES      | `0`                  |
| bonus_earned              | `numeric`     | YES      | `0`                  |
| incentives_earned         | `numeric`     | YES      | `0`                  |
| penalties_deducted        | `numeric`     | YES      | `0`                  |
| total_distance_km         | `numeric`     | YES      | `0`                  |
| hours_logged              | `numeric`     | YES      | -                    |

**CHECK Constraints:**

- `rid_driver_performances_avg_rating_check`: ((avg_rating >= (0)::numeric) AND (avg_rating <= (5)::numeric))
- `rid_driver_performances_earnings_total_check`: (earnings_total >= (0)::numeric)
- `rid_driver_performances_hours_online_check`: (hours_online >= (0)::numeric)
- `rid_driver_performances_incidents_count_check`: (incidents_count >= 0)
- `rid_driver_performances_on_time_rate_check`: ((on_time_rate >= (0)::numeric) AND (on_time_rate <= (100)::numeric))
- `rid_driver_performances_period_check`: (period_end >= period_start)
- `rid_driver_performances_trips_cancelled_check`: (trips_cancelled >= 0)
- `rid_driver_performances_trips_completed_check`: (trips_completed >= 0)

**Indexes:**

- `rid_driver_performances_created_by_idx`: (created_by)
- `rid_driver_performances_deleted_at_idx`: (deleted_at)
- `rid_driver_performances_driver_id_idx`: (driver_id)
- `rid_driver_performances_metadata_gin`: (metadata)
- `rid_driver_performances_period_end_idx`: (period_end)
- `rid_driver_performances_period_start_idx`: (period_start)
- `rid_driver_performances_tenant_driver_period_key`: (tenant_id, driver_id, period_start)
- `rid_driver_performances_tenant_id_idx`: (tenant_id)
- `rid_driver_performances_updated_by_idx`: (updated_by)

### rid_driver_requests

**Row Count:** ~0

| Column                    | Type           | Nullable | Default                      |
| ------------------------- | -------------- | -------- | ---------------------------- |
| id                        | `uuid`         | NO       | `uuid_generate_v4()`         |
| tenant_id                 | `uuid`         | NO       | -                            |
| driver_id                 | `uuid`         | NO       | -                            |
| request_date              | `date`         | NO       | -                            |
| details                   | `jsonb`        | NO       | `'{}'::jsonb`                |
| resolution_notes          | `text`         | YES      | -                            |
| created_at                | `timestamptz`  | NO       | `now()`                      |
| created_by                | `uuid`         | YES      | -                            |
| updated_at                | `timestamptz`  | NO       | `now()`                      |
| updated_by                | `uuid`         | YES      | -                            |
| deleted_at                | `timestamptz`  | YES      | -                            |
| deleted_by                | `uuid`         | YES      | -                            |
| deletion_reason           | `text`         | YES      | -                            |
| request_type              | `USER-DEFINED` | YES      | -                            |
| status                    | `USER-DEFINED` | YES      | `'pending'::request_status`  |
| priority                  | `USER-DEFINED` | YES      | `'normal'::request_priority` |
| sla_deadline              | `timestamptz`  | YES      | -                            |
| sla_breached              | `boolean`      | YES      | `false`                      |
| response_required_by      | `timestamptz`  | YES      | -                            |
| assigned_to               | `uuid`         | YES      | -                            |
| assigned_at               | `timestamptz`  | YES      | -                            |
| review_started_at         | `timestamptz`  | YES      | -                            |
| reviewed_by               | `uuid`         | YES      | -                            |
| approved_at               | `timestamptz`  | YES      | -                            |
| approved_by               | `uuid`         | YES      | -                            |
| rejected_at               | `timestamptz`  | YES      | -                            |
| rejected_by               | `uuid`         | YES      | -                            |
| rejection_reason          | `text`         | YES      | -                            |
| completed_at              | `timestamptz`  | YES      | -                            |
| escalated                 | `boolean`      | YES      | `false`                      |
| escalated_at              | `timestamptz`  | YES      | -                            |
| escalated_to              | `uuid`         | YES      | -                            |
| escalation_reason         | `text`         | YES      | -                            |
| requires_manager_approval | `boolean`      | YES      | `false`                      |
| manager_approved_at       | `timestamptz`  | YES      | -                            |
| manager_approved_by       | `uuid`         | YES      | -                            |
| requires_hr_approval      | `boolean`      | YES      | `false`                      |
| hr_approved_at            | `timestamptz`  | YES      | -                            |
| hr_approved_by            | `uuid`         | YES      | -                            |
| driver_notified_at        | `timestamptz`  | YES      | -                            |
| manager_notified_at       | `timestamptz`  | YES      | -                            |
| notification_method       | `varchar`      | YES      | -                            |
| attachments               | `jsonb`        | YES      | `'[]'::jsonb...`             |

**Indexes:**

- `rid_driver_requests_created_by_idx`: (created_by)
- `rid_driver_requests_deleted_at_idx`: (deleted_at)
- `rid_driver_requests_details_gin`: (details)
- `rid_driver_requests_driver_id_idx`: (driver_id)
- `rid_driver_requests_request_date_idx`: (request_date)
- `rid_driver_requests_tenant_id_idx`: (tenant_id)
- `rid_driver_requests_updated_by_idx`: (updated_by)

### rid_driver_training

**Row Count:** ~0

| Column                           | Type           | Nullable | Default                      |
| -------------------------------- | -------------- | -------- | ---------------------------- |
| id                               | `uuid`         | NO       | `uuid_generate_v4()`         |
| tenant_id                        | `uuid`         | NO       | -                            |
| driver_id                        | `uuid`         | NO       | -                            |
| training_name                    | `text`         | NO       | -                            |
| provider                         | `text`         | YES      | -                            |
| assigned_at                      | `timestamptz`  | YES      | -                            |
| due_at                           | `timestamptz`  | YES      | -                            |
| completed_at                     | `timestamptz`  | YES      | -                            |
| score                            | `numeric`      | YES      | -                            |
| certificate_url                  | `text`         | YES      | -                            |
| metadata                         | `jsonb`        | NO       | `'{}'::jsonb`                |
| created_at                       | `timestamptz`  | NO       | `now()`                      |
| created_by                       | `uuid`         | YES      | -                            |
| updated_at                       | `timestamptz`  | NO       | `now()`                      |
| updated_by                       | `uuid`         | YES      | -                            |
| deleted_at                       | `timestamptz`  | YES      | -                            |
| deleted_by                       | `uuid`         | YES      | -                            |
| deletion_reason                  | `text`         | YES      | -                            |
| training_type                    | `USER-DEFINED` | YES      | -                            |
| status                           | `USER-DEFINED` | YES      | `'planned'::training_status` |
| provider_type                    | `USER-DEFINED` | YES      | -                            |
| provider_id                      | `uuid`         | YES      | -                            |
| provider_contact                 | `varchar`      | YES      | -                            |
| provider_location                | `text`         | YES      | -                            |
| duration_hours                   | `numeric`      | YES      | -                            |
| total_sessions                   | `integer`      | YES      | `1`                          |
| sessions_completed               | `integer`      | YES      | `0`                          |
| materials_url                    | `text`         | YES      | -                            |
| prerequisites_met                | `boolean`      | YES      | `true`                       |
| prerequisite_training_ids        | `jsonb`        | YES      | `'[]'::jsonb...`             |
| prerequisite_documents           | `jsonb`        | YES      | `'[]'::jsonb...`             |
| scheduled_start                  | `timestamptz`  | YES      | -                            |
| scheduled_end                    | `timestamptz`  | YES      | -                            |
| actual_start                     | `timestamptz`  | YES      | -                            |
| actual_end                       | `timestamptz`  | YES      | -                            |
| location                         | `text`         | YES      | -                            |
| online_meeting_url               | `text`         | YES      | -                            |
| attendance_percentage            | `numeric`      | YES      | -                            |
| absences_count                   | `integer`      | YES      | `0`                          |
| late_arrivals_count              | `integer`      | YES      | `0`                          |
| evaluation_method                | `varchar`      | YES      | -                            |
| passing_score                    | `numeric`      | YES      | -                            |
| max_score                        | `numeric`      | YES      | -                            |
| pass_fail_status                 | `varchar`      | YES      | -                            |
| evaluation_date                  | `timestamptz`  | YES      | -                            |
| evaluated_by                     | `uuid`         | YES      | -                            |
| evaluation_notes                 | `text`         | YES      | -                            |
| certificate_issued               | `boolean`      | YES      | `false`                      |
| certificate_number               | `varchar`      | YES      | -                            |
| certificate_issued_date          | `date`         | YES      | -                            |
| certificate_expiry_date          | `date`         | YES      | -                            |
| recertification_required         | `boolean`      | YES      | `false`                      |
| recertification_frequency_months | `integer`      | YES      | -                            |
| training_cost                    | `numeric`      | YES      | -                            |
| paid_by                          | `USER-DEFINED` | YES      | -                            |
| budget_code                      | `varchar`      | YES      | -                            |
| invoice_number                   | `varchar`      | YES      | -                            |
| driver_feedback                  | `text`         | YES      | -                            |
| driver_rating                    | `numeric`      | YES      | -                            |
| feedback_submitted_at            | `timestamptz`  | YES      | -                            |
| description_translations         | `jsonb`        | YES      | -                            |

**CHECK Constraints:**

- `chk_rid_driver_training_description_translations_jsonb`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `rid_driver_training_score_check`: ((score >= (0)::numeric) AND (score <= (100)::numeric))

**Indexes:**

- `idx_rid_driver_training_driver_id`: (driver_id)
- `rid_driver_training_created_by_idx`: (created_by)
- `rid_driver_training_deleted_at_idx`: (deleted_at)
- `rid_driver_training_driver_id_idx`: (driver_id)
- `rid_driver_training_due_at_idx`: (due_at)
- `rid_driver_training_metadata_gin`: (metadata)
- `rid_driver_training_tenant_driver_name_key`: (tenant_id, driver_id, training_name)
- `rid_driver_training_tenant_id_idx`: (tenant_id)
- `rid_driver_training_training_name_idx`: (training_name)
- `rid_driver_training_updated_by_idx`: (updated_by)

### rid_drivers

**Row Count:** ~4

| Column                     | Type           | Nullable | Default                   |
| -------------------------- | -------------- | -------- | ------------------------- |
| id                         | `uuid`         | NO       | `uuid_generate_v4()`      |
| tenant_id                  | `uuid`         | NO       | -                         |
| first_name                 | `text`         | NO       | -                         |
| last_name                  | `text`         | NO       | -                         |
| email                      | `text`         | NO       | -                         |
| phone                      | `text`         | NO       | -                         |
| license_number             | `text`         | NO       | -                         |
| license_issue_date         | `date`         | YES      | -                         |
| license_expiry_date        | `date`         | YES      | -                         |
| professional_card_no       | `text`         | YES      | -                         |
| professional_expiry        | `date`         | YES      | -                         |
| created_at                 | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`       |
| updated_at                 | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`       |
| deleted_at                 | `timestamptz`  | YES      | -                         |
| rating                     | `numeric`      | YES      | -                         |
| notes                      | `text`         | YES      | -                         |
| date_of_birth              | `date`         | YES      | -                         |
| gender                     | `text`         | YES      | -                         |
| nationality                | `character`    | YES      | -                         |
| hire_date                  | `date`         | YES      | -                         |
| employment_status          | `text`         | NO       | `'active'::text`          |
| cooperation_type           | `USER-DEFINED` | YES      | -                         |
| emergency_contact_name     | `text`         | YES      | -                         |
| emergency_contact_phone    | `text`         | YES      | -                         |
| place_of_birth             | `varchar`      | YES      | -                         |
| emirates_id                | `varchar`      | YES      | -                         |
| emirates_id_expiry         | `date`         | YES      | -                         |
| preferred_name             | `varchar`      | YES      | -                         |
| secondary_phone            | `varchar`      | YES      | -                         |
| emergency_contact_relation | `varchar`      | YES      | -                         |
| address_line1              | `text`         | YES      | -                         |
| address_line2              | `text`         | YES      | -                         |
| city                       | `varchar`      | YES      | -                         |
| state                      | `varchar`      | YES      | -                         |
| postal_code                | `varchar`      | YES      | -                         |
| country_code               | `character`    | YES      | -                         |
| bank_name                  | `varchar`      | YES      | -                         |
| bank_account_number        | `varchar`      | YES      | -                         |
| bank_iban                  | `varchar`      | YES      | -                         |
| bank_swift_code            | `varchar`      | YES      | -                         |
| preferred_payment_method   | `USER-DEFINED` | YES      | -                         |
| wps_eligible               | `boolean`      | YES      | `false`                   |
| driver_status              | `USER-DEFINED` | YES      | `'active'::driver_status` |
| onboarded_at               | `timestamptz`  | YES      | -                         |
| last_active_at             | `timestamptz`  | YES      | -                         |
| total_trips_completed      | `integer`      | YES      | `0`                       |
| lifetime_earnings          | `numeric`      | YES      | `0`                       |
| suspension_reason          | `text`         | YES      | -                         |
| suspension_start_date      | `date`         | YES      | -                         |
| suspension_end_date        | `date`         | YES      | -                         |
| termination_reason         | `text`         | YES      | -                         |
| termination_date           | `date`         | YES      | -                         |
| rehire_eligible            | `boolean`      | YES      | `true`                    |
| photo_url                  | `text`         | YES      | -                         |
| photo_verified_at          | `timestamptz`  | YES      | -                         |
| photo_verified_by          | `uuid`         | YES      | -                         |
| average_rating             | `numeric`      | YES      | -                         |
| metadata                   | `jsonb`        | YES      | `'{}'::jsonb`             |
| preferences                | `jsonb`        | YES      | `'{}'::jsonb`             |
| created_by                 | `uuid`         | YES      | -                         |
| updated_by                 | `uuid`         | YES      | -                         |
| verified_by                | `uuid`         | YES      | -                         |
| verified_at                | `timestamptz`  | YES      | -                         |
| deleted_by                 | `uuid`         | YES      | -                         |
| deletion_reason            | `text`         | YES      | -                         |

**CHECK Constraints:**

- `rid_drivers_dob_check`: ((date_of_birth IS NULL) OR (date_of_birth <= CURRENT_DATE))
- `rid_drivers_employment_status_check`: (employment_status = ANY (ARRAY['active'::text, 'on_leave'::text, 'suspended'::text, 'terminated'::t...
- `rid_drivers_gender_check`: ((gender IS NULL) OR (gender = ANY (ARRAY['male'::text, 'female'::text, 'unspecified'::text])))
- `rid_drivers_nationality_check`: ((nationality IS NULL) OR (nationality ~ '^[A-Za-z]{2}$'::text))

**Indexes:**

- `idx_rid_drivers_license`: (license_number)
- `idx_rid_drivers_metadata`: (metadata)
- `idx_rid_drivers_tenant`: (tenant_id)
- `idx_rid_drivers_tenant_email_unique`: (tenant_id, email)
- `idx_rid_drivers_tenant_phone_unique`: (tenant_id, phone)
- `idx_rid_drivers_tenant_status`: (tenant_id, driver_status)
- `rid_drivers_cooperation_type_idx`: (cooperation_type)
- `rid_drivers_created_at_idx`: (created_at DESC)
- `rid_drivers_deleted_at_idx`: (deleted_at)
- `rid_drivers_dob_idx`: (date_of_birth)
- `rid_drivers_email_idx`: (email)
- `rid_drivers_employment_status_idx`: (employment_status)
- `rid_drivers_first_name_idx`: (first_name)
- `rid_drivers_hire_date_idx`: (hire_date)
- `rid_drivers_last_name_idx`: (last_name)
- `rid_drivers_license_number_idx`: (license_number)
- `rid_drivers_nationality_idx`: (nationality)
- `rid_drivers_notes_gin_idx`: (to_tsvector('english'::regconfig, COALESCE(notes, ''::text)
- `rid_drivers_phone_idx`: (phone)
- `rid_drivers_tenant_email_uq`: (tenant_id, email)
- `rid_drivers_tenant_id_idx`: (tenant_id)
- `rid_drivers_tenant_license_uq`: (tenant_id, license_number)

## Schedule Module (sch\_)

### sch_goal_achievements

**Row Count:** ~0

| Column            | Type           | Nullable | Default             |
| ----------------- | -------------- | -------- | ------------------- |
| id                | `uuid`         | NO       | `gen_random_uuid()` |
| goal_id           | `uuid`         | NO       | -                   |
| achievement_date  | `timestamptz`  | NO       | -                   |
| final_value       | `numeric`      | NO       | -                   |
| threshold_reached | `USER-DEFINED` | YES      | -                   |
| reward_granted    | `boolean`      | YES      | `false`             |
| reward_amount     | `numeric`      | YES      | -                   |
| certificate_url   | `varchar`      | YES      | -                   |
| notes             | `text`         | YES      | -                   |
| metadata          | `jsonb`        | YES      | -                   |
| created_at        | `timestamptz`  | YES      | `now()`             |
| created_by        | `uuid`         | NO       | -                   |

**Indexes:**

- `idx_goal_achievements_date`: (achievement_date)
- `idx_goal_achievements_goal_date`: (goal_id, achievement_date)
- `idx_goal_achievements_reward`: (reward_granted)

### sch_goal_types

**Row Count:** ~0

| Column             | Type           | Nullable | Default             |
| ------------------ | -------------- | -------- | ------------------- |
| id                 | `uuid`         | NO       | `gen_random_uuid()` |
| tenant_id          | `uuid`         | NO       | -                   |
| code               | `varchar`      | NO       | -                   |
| category           | `USER-DEFINED` | NO       | -                   |
| unit               | `varchar`      | NO       | -                   |
| calculation_method | `text`         | YES      | -                   |
| data_source_table  | `varchar`      | YES      | -                   |
| data_source_field  | `varchar`      | YES      | -                   |
| aggregation_type   | `USER-DEFINED` | YES      | -                   |
| is_higher_better   | `boolean`      | YES      | `true`              |
| icon               | `varchar`      | YES      | -                   |
| color              | `varchar`      | YES      | -                   |
| metadata           | `jsonb`        | YES      | -                   |
| created_at         | `timestamptz`  | NO       | `now()`             |
| updated_at         | `timestamptz`  | NO       | `now()`             |
| created_by         | `uuid`         | NO       | -                   |
| updated_by         | `uuid`         | YES      | -                   |
| deleted_at         | `timestamptz`  | YES      | -                   |
| deleted_by         | `uuid`         | YES      | -                   |
| deletion_reason    | `text`         | YES      | -                   |
| label_translations | `jsonb`        | NO       | -                   |

**CHECK Constraints:**

- `chk_sch_goal_types_label_translations_type`: (jsonb_typeof(label_translations) = 'object'::text)

**Indexes:**

- `idx_goal_types_category`: (category)
- `idx_goal_types_deleted`: (deleted_at)
- `idx_sch_goal_types_tenant_code_unique`: (tenant_id, code)

### sch_goals

**Row Count:** ~0

| Column                      | Type           | Nullable | Default                 |
| --------------------------- | -------------- | -------- | ----------------------- |
| id                          | `uuid`         | NO       | `uuid_generate_v4()`    |
| tenant_id                   | `uuid`         | NO       | -                       |
| goal_type                   | `text`         | NO       | -                       |
| target_value                | `numeric`      | NO       | -                       |
| period_start                | `date`         | NO       | -                       |
| period_end                  | `date`         | NO       | -                       |
| assigned_to                 | `uuid`         | NO       | -                       |
| metadata                    | `jsonb`        | NO       | `'{}'::jsonb`           |
| created_at                  | `timestamptz`  | NO       | `now()`                 |
| created_by                  | `uuid`         | YES      | -                       |
| updated_at                  | `timestamptz`  | NO       | `now()`                 |
| updated_by                  | `uuid`         | YES      | -                       |
| deleted_at                  | `timestamptz`  | YES      | -                       |
| deleted_by                  | `uuid`         | YES      | -                       |
| deletion_reason             | `text`         | YES      | -                       |
| goal_type_id                | `uuid`         | YES      | -                       |
| goal_category               | `USER-DEFINED` | YES      | -                       |
| target_type                 | `USER-DEFINED` | YES      | -                       |
| target_entity_type          | `varchar`      | YES      | -                       |
| target_entity_id            | `uuid`         | YES      | -                       |
| period_type                 | `USER-DEFINED` | YES      | -                       |
| recurrence_pattern          | `varchar`      | YES      | -                       |
| current_value               | `numeric`      | YES      | `0`                     |
| progress_percent            | `numeric`      | YES      | -                       |
| unit                        | `varchar`      | YES      | -                       |
| weight                      | `numeric`      | YES      | `1.0`                   |
| reward_type                 | `USER-DEFINED` | YES      | -                       |
| reward_amount               | `numeric`      | YES      | -                       |
| threshold_bronze            | `numeric`      | YES      | -                       |
| threshold_silver            | `numeric`      | YES      | -                       |
| threshold_gold              | `numeric`      | YES      | -                       |
| achievement_date            | `timestamptz`  | YES      | -                       |
| last_calculated_at          | `timestamptz`  | YES      | -                       |
| last_notified_at            | `timestamptz`  | YES      | -                       |
| notification_frequency_days | `integer`      | YES      | -                       |
| status                      | `USER-DEFINED` | YES      | `'active'::goal_status` |
| notes                       | `text`         | YES      | -                       |

**CHECK Constraints:**

- `sch_goals_period_check`: (period_end >= period_start)

**Indexes:**

- `idx_goals_achievement_date`: (achievement_date)
- `idx_goals_progress_status`: (progress_percent, status)
- `idx_goals_status_deleted`: (status, deleted_at)
- `idx_goals_target_entity_status`: (target_entity_type, target_entity_id, status)
- `idx_sch_goals_tenant`: (tenant_id)
- `sch_goals_assigned_to_idx`: (assigned_to)
- `sch_goals_created_by_idx`: (created_by)
- `sch_goals_deleted_at_idx`: (deleted_at)
- `sch_goals_goal_type_idx`: (goal_type)
- `sch_goals_metadata_gin`: (metadata)
- `sch_goals_period_end_idx`: (period_end)
- `sch_goals_period_start_idx`: (period_start)
- `sch_goals_tenant_id_idx`: (tenant_id)
- `sch_goals_tenant_type_period_assigned_unique`: (tenant_id, goal_type, period_start, assigned_to)
- `sch_goals_updated_by_idx`: (updated_by)

### sch_locations

**Row Count:** ~0

| Column          | Type          | Nullable | Default             |
| --------------- | ------------- | -------- | ------------------- |
| id              | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id       | `uuid`        | NO       | -                   |
| name            | `varchar`     | NO       | -                   |
| code            | `varchar`     | NO       | -                   |
| polygon         | `jsonb`       | YES      | -                   |
| city            | `varchar`     | YES      | -                   |
| country         | `varchar`     | YES      | -                   |
| description     | `text`        | YES      | -                   |
| is_active       | `boolean`     | YES      | `true`              |
| metadata        | `jsonb`       | YES      | -                   |
| created_at      | `timestamptz` | NO       | `now()`             |
| updated_at      | `timestamptz` | NO       | `now()`             |
| created_by      | `uuid`        | NO       | -                   |
| updated_by      | `uuid`        | YES      | -                   |
| deleted_at      | `timestamptz` | YES      | -                   |
| deleted_by      | `uuid`        | YES      | -                   |
| deletion_reason | `text`        | YES      | -                   |

**Indexes:**

- `idx_locations_active_deleted`: (is_active, deleted_at)
- `idx_locations_city_country`: (city, country)
- `idx_sch_locations_tenant_code_unique`: (tenant_id, code)

### sch_maintenance_schedules

**Row Count:** ~0

| Column                   | Type           | Nullable | Default                           |
| ------------------------ | -------------- | -------- | --------------------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()`              |
| tenant_id                | `uuid`         | NO       | -                                 |
| vehicle_id               | `uuid`         | NO       | -                                 |
| scheduled_date           | `date`         | NO       | -                                 |
| maintenance_type         | `text`         | NO       | -                                 |
| metadata                 | `jsonb`        | NO       | `'{}'::jsonb`                     |
| created_at               | `timestamptz`  | NO       | `now()`                           |
| created_by               | `uuid`         | YES      | -                                 |
| updated_at               | `timestamptz`  | NO       | `now()`                           |
| updated_by               | `uuid`         | YES      | -                                 |
| deleted_at               | `timestamptz`  | YES      | -                                 |
| deleted_by               | `uuid`         | YES      | -                                 |
| deletion_reason          | `text`         | YES      | -                                 |
| maintenance_type_id      | `uuid`         | YES      | -                                 |
| scheduled_by             | `uuid`         | YES      | -                                 |
| estimated_duration_hours | `numeric`      | YES      | -                                 |
| estimated_cost           | `numeric`      | YES      | -                                 |
| odometer_reading         | `integer`      | YES      | -                                 |
| trigger_type             | `USER-DEFINED` | YES      | -                                 |
| reminder_sent_at         | `timestamptz`  | YES      | -                                 |
| reminder_count           | `integer`      | YES      | `0`                               |
| completed_maintenance_id | `uuid`         | YES      | -                                 |
| rescheduled_from         | `uuid`         | YES      | -                                 |
| rescheduled_reason       | `text`         | YES      | -                                 |
| blocking_operations      | `boolean`      | YES      | `false`                           |
| required_parts           | `jsonb`        | YES      | -                                 |
| assigned_garage          | `varchar`      | YES      | -                                 |
| garage_contact           | `varchar`      | YES      | -                                 |
| notes                    | `text`         | YES      | -                                 |
| status                   | `USER-DEFINED` | YES      | `'scheduled'::maintenance_status` |

**Indexes:**

- `idx_maintenance_schedules_odometer`: (odometer_reading)
- `idx_maintenance_schedules_reminder_sent`: (reminder_sent_at)
- `idx_maintenance_schedules_status_deleted`: (status, deleted_at)
- `idx_maintenance_schedules_vehicle_date_status`: (vehicle_id, scheduled_date, status)
- `sch_maintenance_schedules_created_by_idx`: (created_by)
- `sch_maintenance_schedules_deleted_at_idx`: (deleted_at)
- `sch_maintenance_schedules_maintenance_type_idx`: (maintenance_type)
- `sch_maintenance_schedules_metadata_gin`: (metadata)
- `sch_maintenance_schedules_scheduled_date_idx`: (scheduled_date)
- `sch_maintenance_schedules_tenant_id_idx`: (tenant_id)
- `sch_maintenance_schedules_tenant_vehicle_date_type_unique`: (tenant_id, vehicle_id, scheduled_date, maintenance_type)
- `sch_maintenance_schedules_updated_by_idx`: (updated_by)
- `sch_maintenance_schedules_vehicle_id_idx`: (vehicle_id)

### sch_shift_types

**Row Count:** ~0

| Column             | Type          | Nullable | Default             |
| ------------------ | ------------- | -------- | ------------------- |
| id                 | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id          | `uuid`        | NO       | -                   |
| code               | `varchar`     | NO       | -                   |
| pay_multiplier     | `numeric`     | NO       | -                   |
| color_code         | `varchar`     | YES      | -                   |
| is_active          | `boolean`     | YES      | `true`              |
| metadata           | `jsonb`       | YES      | -                   |
| created_at         | `timestamptz` | NO       | `now()`             |
| updated_at         | `timestamptz` | NO       | `now()`             |
| created_by         | `uuid`        | NO       | -                   |
| updated_by         | `uuid`        | YES      | -                   |
| deleted_at         | `timestamptz` | YES      | -                   |
| deleted_by         | `uuid`        | YES      | -                   |
| deletion_reason    | `text`        | YES      | -                   |
| label_translations | `jsonb`       | NO       | -                   |

**CHECK Constraints:**

- `chk_sch_shift_types_label_translations_type`: (jsonb_typeof(label_translations) = 'object'::text)

**Indexes:**

- `idx_sch_shift_types_tenant_code_unique`: (tenant_id, code)
- `idx_shift_types_active_deleted`: (is_active, deleted_at)

### sch_shifts

**Row Count:** ~0

| Column                 | Type           | Nullable | Default              |
| ---------------------- | -------------- | -------- | -------------------- |
| id                     | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id              | `uuid`         | NO       | -                    |
| driver_id              | `uuid`         | NO       | -                    |
| start_time             | `timestamptz`  | NO       | -                    |
| end_time               | `timestamptz`  | NO       | -                    |
| metadata               | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at             | `timestamptz`  | NO       | `now()`              |
| created_by             | `uuid`         | YES      | -                    |
| updated_at             | `timestamptz`  | NO       | `now()`              |
| updated_by             | `uuid`         | YES      | -                    |
| deleted_at             | `timestamptz`  | YES      | -                    |
| deleted_by             | `uuid`         | YES      | -                    |
| deletion_reason        | `text`         | YES      | -                    |
| shift_type_id          | `uuid`         | YES      | -                    |
| shift_category         | `varchar`      | YES      | -                    |
| location_id            | `uuid`         | YES      | -                    |
| zone_name              | `varchar`      | YES      | -                    |
| check_in_at            | `timestamptz`  | YES      | -                    |
| check_out_at           | `timestamptz`  | YES      | -                    |
| break_duration_minutes | `integer`      | YES      | -                    |
| actual_work_minutes    | `integer`      | YES      | -                    |
| pay_multiplier         | `numeric`      | YES      | -                    |
| status                 | `USER-DEFINED` | YES      | -                    |
| approved_by            | `uuid`         | YES      | -                    |
| approved_at            | `timestamptz`  | YES      | -                    |
| cancellation_reason    | `varchar`      | YES      | -                    |
| replacement_driver_id  | `uuid`         | YES      | -                    |

**CHECK Constraints:**

- `sch_shifts_time_check`: (end_time >= start_time)

**Indexes:**

- `idx_sch_shifts_driver`: (driver_id)
- `idx_sch_shifts_start_time`: (start_time DESC)
- `idx_sch_shifts_tenant`: (tenant_id)
- `idx_shifts_checkin`: (check_in_at)
- `idx_shifts_checkout`: (check_out_at)
- `idx_shifts_driver_checkin`: (driver_id, check_in_at)
- `idx_shifts_shift_type_location`: (shift_type_id, location_id)
- `idx_shifts_status_deleted`: (status, deleted_at)
- `sch_shifts_created_by_idx`: (created_by)
- `sch_shifts_deleted_at_idx`: (deleted_at)
- `sch_shifts_driver_id_idx`: (driver_id)
- `sch_shifts_end_time_idx`: (end_time)
- `sch_shifts_metadata_gin`: (metadata)
- `sch_shifts_start_time_idx`: (start_time)
- `sch_shifts_tenant_driver_start_unique`: (tenant_id, driver_id, start_time)
- `sch_shifts_tenant_id_idx`: (tenant_id)
- `sch_shifts_updated_by_idx`: (updated_by)

### sch_task_comments

**Row Count:** ~0

| Column       | Type           | Nullable | Default             |
| ------------ | -------------- | -------- | ------------------- |
| id           | `uuid`         | NO       | `gen_random_uuid()` |
| task_id      | `uuid`         | NO       | -                   |
| comment_type | `USER-DEFINED` | NO       | -                   |
| author_id    | `uuid`         | NO       | -                   |
| comment_text | `text`         | NO       | -                   |
| attachments  | `jsonb`        | YES      | -                   |
| is_internal  | `boolean`      | YES      | `false`             |
| metadata     | `jsonb`        | YES      | -                   |
| created_at   | `timestamptz`  | YES      | `now()`             |

**Indexes:**

- `idx_task_comments_author`: (author_id)
- `idx_task_comments_task_created`: (task_id, created_at)
- `idx_task_comments_type`: (comment_type)

### sch_task_history

**Row Count:** ~0

| Column        | Type           | Nullable | Default             |
| ------------- | -------------- | -------- | ------------------- |
| id            | `uuid`         | NO       | `gen_random_uuid()` |
| task_id       | `uuid`         | NO       | -                   |
| changed_by    | `uuid`         | NO       | -                   |
| change_type   | `USER-DEFINED` | NO       | -                   |
| old_values    | `jsonb`        | YES      | -                   |
| new_values    | `jsonb`        | YES      | -                   |
| change_reason | `text`         | YES      | -                   |
| metadata      | `jsonb`        | YES      | -                   |
| created_at    | `timestamptz`  | YES      | `now()`             |

**Indexes:**

- `idx_task_history_change_type`: (change_type)
- `idx_task_history_changed_by`: (changed_by)
- `idx_task_history_task_created`: (task_id, created_at)

### sch_task_types

**Row Count:** ~0

| Column                   | Type           | Nullable | Default             |
| ------------------------ | -------------- | -------- | ------------------- |
| id                       | `uuid`         | NO       | `gen_random_uuid()` |
| tenant_id                | `uuid`         | NO       | -                   |
| code                     | `varchar`      | NO       | -                   |
| category                 | `USER-DEFINED` | NO       | -                   |
| default_priority         | `USER-DEFINED` | YES      | -                   |
| default_duration_minutes | `integer`      | YES      | -                   |
| requires_verification    | `boolean`      | YES      | `false`             |
| default_checklist        | `jsonb`        | YES      | -                   |
| auto_assignment_rule     | `jsonb`        | YES      | -                   |
| sla_hours                | `integer`      | YES      | -                   |
| escalation_hours         | `integer`      | YES      | -                   |
| description_template     | `text`         | YES      | -                   |
| metadata                 | `jsonb`        | YES      | -                   |
| created_at               | `timestamptz`  | NO       | `now()`             |
| updated_at               | `timestamptz`  | NO       | `now()`             |
| created_by               | `uuid`         | NO       | -                   |
| updated_by               | `uuid`         | YES      | -                   |
| deleted_at               | `timestamptz`  | YES      | -                   |
| deleted_by               | `uuid`         | YES      | -                   |
| deletion_reason          | `text`         | YES      | -                   |
| label_translations       | `jsonb`        | NO       | -                   |

**CHECK Constraints:**

- `chk_sch_task_types_label_translations_type`: (jsonb_typeof(label_translations) = 'object'::text)

**Indexes:**

- `idx_sch_task_types_tenant_code_unique`: (tenant_id, code)
- `idx_task_types_category_priority`: (category, default_priority)
- `idx_task_types_deleted`: (deleted_at)

### sch_tasks

**Row Count:** ~0

| Column                     | Type           | Nullable | Default                   |
| -------------------------- | -------------- | -------- | ------------------------- |
| id                         | `uuid`         | NO       | `uuid_generate_v4()`      |
| tenant_id                  | `uuid`         | NO       | -                         |
| task_type                  | `text`         | NO       | -                         |
| description                | `text`         | NO       | -                         |
| target_id                  | `uuid`         | NO       | -                         |
| due_at                     | `timestamptz`  | YES      | -                         |
| metadata                   | `jsonb`        | NO       | `'{}'::jsonb`             |
| created_at                 | `timestamptz`  | NO       | `now()`                   |
| created_by                 | `uuid`         | YES      | -                         |
| updated_at                 | `timestamptz`  | NO       | `now()`                   |
| updated_by                 | `uuid`         | YES      | -                         |
| deleted_at                 | `timestamptz`  | YES      | -                         |
| deleted_by                 | `uuid`         | YES      | -                         |
| deletion_reason            | `text`         | YES      | -                         |
| task_type_id               | `uuid`         | YES      | -                         |
| task_category              | `USER-DEFINED` | YES      | -                         |
| title                      | `varchar`      | YES      | -                         |
| priority                   | `USER-DEFINED` | YES      | `'normal'::task_priority` |
| assigned_to                | `uuid`         | YES      | -                         |
| assigned_at                | `timestamptz`  | YES      | -                         |
| assigned_by                | `uuid`         | YES      | -                         |
| target_type                | `varchar`      | YES      | -                         |
| related_entity_type        | `varchar`      | YES      | -                         |
| related_entity_id          | `uuid`         | YES      | -                         |
| estimated_duration_minutes | `integer`      | YES      | -                         |
| actual_duration_minutes    | `integer`      | YES      | -                         |
| start_date                 | `date`         | YES      | -                         |
| due_date                   | `date`         | YES      | -                         |
| completed_at               | `timestamptz`  | YES      | -                         |
| completed_by               | `uuid`         | YES      | -                         |
| verification_required      | `boolean`      | YES      | `false`                   |
| verified_by                | `uuid`         | YES      | -                         |
| verified_at                | `timestamptz`  | YES      | -                         |
| is_auto_generated          | `boolean`      | YES      | `false`                   |
| generation_trigger         | `varchar`      | YES      | -                         |
| recurrence_pattern         | `varchar`      | YES      | -                         |
| parent_task_id             | `uuid`         | YES      | -                         |
| blocking_tasks             | `_text`        | YES      | -                         |
| checklist                  | `jsonb`        | YES      | -                         |
| attachments                | `jsonb`        | YES      | -                         |
| reminder_sent_at           | `timestamptz`  | YES      | -                         |
| reminder_frequency_days    | `integer`      | YES      | -                         |
| escalation_level           | `integer`      | YES      | `0`                       |
| escalated_to               | `uuid`         | YES      | -                         |
| tags                       | `_text`        | YES      | -                         |
| status                     | `USER-DEFINED` | YES      | `'pending'::task_status`  |

**Indexes:**

- `idx_sch_tasks_assigned`: (tenant_id, assigned_to, status)
- `idx_sch_tasks_created_by`: (created_by)
- `idx_sch_tasks_deleted_at`: (deleted_at)
- `idx_sch_tasks_due_at`: (due_at)
- `idx_sch_tasks_metadata`: (metadata)
- `idx_sch_tasks_target_id`: (target_id)
- `idx_sch_tasks_task_type_active`: (task_type)
- `idx_sch_tasks_tenant`: (tenant_id)
- `idx_sch_tasks_tenant_id`: (tenant_id)
- `idx_sch_tasks_updated_by`: (updated_by)
- `idx_tasks_assigned_status_due`: (assigned_to, status, due_date)
- `idx_tasks_auto_generated`: (is_auto_generated, generation_trigger)
- `idx_tasks_category_priority`: (task_category, priority)
- `idx_tasks_status_deleted`: (status, deleted_at)
- `idx_tasks_tags`: (tags)
- `idx_tasks_target`: (target_type, target_id, status)

## Stripe Module (stripe\_)

### stripe_webhook_logs

**Row Count:** ~0

| Column                 | Type          | Nullable | Default                             |
| ---------------------- | ------------- | -------- | ----------------------------------- |
| id                     | `uuid`        | NO       | `gen_random_uuid()`                 |
| event_id               | `varchar`     | NO       | -                                   |
| event_type             | `varchar`     | NO       | -                                   |
| payload                | `jsonb`       | NO       | -                                   |
| processed_at           | `timestamptz` | NO       | `now()`                             |
| processing_duration_ms | `integer`     | YES      | -                                   |
| status                 | `varchar`     | YES      | `'processed'::character varying...` |
| error_message          | `text`        | YES      | -                                   |
| retry_count            | `integer`     | YES      | `0`                                 |
| created_at             | `timestamptz` | NO       | `now()`                             |

**Indexes:**

- `idx_stripe_webhook_logs_created_at`: (created_at DESC)
- `idx_stripe_webhook_logs_event_type`: (event_type)
- `idx_stripe_webhook_logs_status`: (status)
- `stripe_webhook_logs_event_id_key`: (event_id)

## Support Module (sup\_)

### sup_canned_responses

**Row Count:** ~0

| Column             | Type          | Nullable | Default             |
| ------------------ | ------------- | -------- | ------------------- |
| id                 | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id          | `uuid`        | NO       | -                   |
| content            | `text`        | NO       | -                   |
| category           | `varchar`     | YES      | -                   |
| language           | `varchar`     | NO       | -                   |
| usage_count        | `integer`     | NO       | `0`                 |
| last_used_at       | `timestamptz` | YES      | -                   |
| is_active          | `boolean`     | NO       | `true`              |
| created_at         | `timestamptz` | NO       | `CURRENT_TIMESTAMP` |
| updated_at         | `timestamptz` | NO       | `CURRENT_TIMESTAMP` |
| created_by         | `uuid`        | NO       | -                   |
| title_translations | `jsonb`       | NO       | -                   |

**CHECK Constraints:**

- `chk_sup_canned_responses_title_translations_type`: (jsonb_typeof(title_translations) = 'object'::text)

**Indexes:**

- `idx_sup_responses_language`: (language)
- `idx_sup_responses_popularity`: (usage_count)
- `idx_sup_responses_tenant`: (tenant_id, category, is_active)

### sup_customer_feedback

**Row Count:** ~0

| Column                       | Type               | Nullable | Default                 |
| ---------------------------- | ------------------ | -------- | ----------------------- |
| id                           | `uuid`             | NO       | `uuid_generate_v4()`    |
| tenant_id                    | `uuid`             | NO       | -                       |
| submitted_by                 | `uuid`             | NO       | -                       |
| feedback_text                | `text`             | NO       | -                       |
| rating                       | `integer`          | NO       | -                       |
| metadata                     | `jsonb`            | YES      | `'{}'::jsonb`           |
| created_by                   | `uuid`             | YES      | -                       |
| created_at                   | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`     |
| updated_by                   | `uuid`             | YES      | -                       |
| updated_at                   | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`     |
| deleted_by                   | `uuid`             | YES      | -                       |
| deleted_at                   | `timestamptz`      | YES      | -                       |
| ticket_id                    | `uuid`             | YES      | -                       |
| driver_id                    | `uuid`             | YES      | -                       |
| service_type                 | `USER-DEFINED`     | YES      | `'other'::service_type` |
| language                     | `varchar`          | YES      | -                       |
| sentiment_score              | `double precision` | YES      | -                       |
| is_anonymous                 | `boolean`          | YES      | `false`                 |
| category                     | `varchar`          | YES      | -                       |
| tags                         | `_text`            | YES      | `'{}'::jsonb`           |
| overall_rating               | `integer`          | YES      | -                       |
| response_time_rating         | `integer`          | YES      | -                       |
| resolution_quality_rating    | `integer`          | YES      | -                       |
| agent_professionalism_rating | `integer`          | YES      | -                       |
| submitter_type               | `USER-DEFINED`     | YES      | -                       |

**CHECK Constraints:**

- `sup_customer_feedback_rating_check`: ((rating >= 1) AND (rating <= 5))

**Indexes:**

- `idx_sup_feedback_category`: (category, created_at)
- `idx_sup_feedback_driver`: (driver_id, created_at)
- `idx_sup_feedback_sentiment`: (sentiment_score)
- `idx_sup_feedback_tags`: (tags)
- `idx_sup_feedback_ticket`: (ticket_id, service_type)
- `sup_customer_feedback_created_at_idx`: (created_at DESC)
- `sup_customer_feedback_metadata_idx`: (metadata)
- `sup_customer_feedback_rating_idx`: (rating)
- `sup_customer_feedback_tenant_id_idx`: (tenant_id)
- `sup_customer_feedback_tenant_id_submitted_by_idx`: (tenant_id, submitted_by)

### sup_ticket_categories

**Row Count:** ~0

| Column                   | Type           | Nullable | Default             |
| ------------------------ | -------------- | -------- | ------------------- |
| id                       | `uuid`         | NO       | `gen_random_uuid()` |
| tenant_id                | `uuid`         | NO       | -                   |
| slug                     | `varchar`      | NO       | -                   |
| parent_category_id       | `uuid`         | YES      | -                   |
| default_priority         | `USER-DEFINED` | YES      | -                   |
| default_assigned_team    | `varchar`      | YES      | -                   |
| sla_hours                | `integer`      | YES      | -                   |
| is_active                | `boolean`      | NO       | `true`              |
| display_order            | `integer`      | NO       | `0`                 |
| created_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP` |
| updated_at               | `timestamptz`  | NO       | `CURRENT_TIMESTAMP` |
| created_by               | `uuid`         | NO       | -                   |
| updated_by               | `uuid`         | YES      | -                   |
| name_translations        | `jsonb`        | NO       | -                   |
| description_translations | `jsonb`        | YES      | -                   |

**CHECK Constraints:**

- `chk_sup_ticket_categories_description_translations_type`: ((description_translations IS NULL) OR (jsonb_typeof(description_translations) = 'object'::text))
- `chk_sup_ticket_categories_name_translations_type`: (jsonb_typeof(name_translations) = 'object'::text)

**Indexes:**

- `idx_sup_categories_order`: (display_order)
- `idx_sup_categories_parent`: (parent_category_id)
- `idx_sup_categories_tenant`: (tenant_id, is_active)
- `uq_sup_categories_tenant_slug`: (tenant_id, slug)

### sup_ticket_messages

**Row Count:** ~0

| Column            | Type               | Nullable | Default                  |
| ----------------- | ------------------ | -------- | ------------------------ |
| id                | `uuid`             | NO       | `uuid_generate_v4()`     |
| ticket_id         | `uuid`             | NO       | -                        |
| sender_id         | `uuid`             | NO       | -                        |
| message_body      | `text`             | NO       | -                        |
| sent_at           | `timestamptz`      | NO       | `now()`                  |
| metadata          | `jsonb`            | NO       | `'{}'::jsonb`            |
| created_at        | `timestamptz`      | NO       | `now()`                  |
| created_by        | `uuid`             | YES      | -                        |
| updated_at        | `timestamptz`      | NO       | `now()`                  |
| updated_by        | `uuid`             | YES      | -                        |
| deleted_at        | `timestamptz`      | YES      | -                        |
| deleted_by        | `uuid`             | YES      | -                        |
| deletion_reason   | `text`             | YES      | -                        |
| message_type      | `USER-DEFINED`     | YES      | `'public'::message_type` |
| parent_message_id | `uuid`             | YES      | -                        |
| attachment_url    | `text`             | YES      | -                        |
| attachment_type   | `varchar`          | YES      | -                        |
| language          | `varchar`          | YES      | -                        |
| sentiment_score   | `double precision` | YES      | -                        |
| is_automated      | `boolean`          | YES      | `false`                  |
| ai_suggestions    | `jsonb`            | YES      | -                        |
| translation       | `jsonb`            | YES      | -                        |

**Indexes:**

- `idx_sup_messages_sender`: (sender_id)
- `idx_sup_messages_threading`: (ticket_id, parent_message_id)
- `idx_sup_messages_type`: (message_type, sent_at)
- `sup_ticket_messages_created_by_idx`: (created_by)
- `sup_ticket_messages_deleted_at_idx`: (deleted_at)
- `sup_ticket_messages_metadata_idx`: (metadata)
- `sup_ticket_messages_sent_at_idx`: (sent_at)
- `sup_ticket_messages_ticket_id_idx`: (ticket_id)
- `sup_ticket_messages_updated_by_idx`: (updated_by)

### sup_ticket_sla_rules

**Row Count:** ~0

| Column                | Type           | Nullable | Default             |
| --------------------- | -------------- | -------- | ------------------- |
| id                    | `uuid`         | NO       | `gen_random_uuid()` |
| tenant_id             | `uuid`         | NO       | -                   |
| category_id           | `uuid`         | YES      | -                   |
| priority              | `USER-DEFINED` | NO       | -                   |
| response_time_hours   | `integer`      | NO       | -                   |
| resolution_time_hours | `integer`      | NO       | -                   |
| escalation_rules      | `jsonb`        | YES      | -                   |
| business_hours_only   | `boolean`      | NO       | `false`             |
| is_active             | `boolean`      | NO       | `true`              |
| created_at            | `timestamptz`  | NO       | `CURRENT_TIMESTAMP` |
| updated_at            | `timestamptz`  | NO       | `CURRENT_TIMESTAMP` |
| created_by            | `uuid`         | NO       | -                   |
| updated_by            | `uuid`         | YES      | -                   |

**Indexes:**

- `idx_sup_sla_category`: (category_id)
- `idx_sup_sla_priority`: (priority)
- `idx_sup_sla_tenant`: (tenant_id, is_active)
- `uq_sup_sla_tenant_category_priority`: (tenant_id, category_id, priority)

### sup_tickets

**Row Count:** ~0

| Column           | Type           | Nullable | Default                          |
| ---------------- | -------------- | -------- | -------------------------------- |
| id               | `uuid`         | NO       | `uuid_generate_v4()`             |
| tenant_id        | `uuid`         | NO       | -                                |
| raised_by        | `uuid`         | NO       | -                                |
| subject          | `text`         | NO       | -                                |
| description      | `text`         | NO       | -                                |
| assigned_to      | `uuid`         | YES      | -                                |
| metadata         | `jsonb`        | NO       | `'{}'::jsonb`                    |
| created_at       | `timestamptz`  | NO       | `now()`                          |
| created_by       | `uuid`         | YES      | -                                |
| updated_at       | `timestamptz`  | NO       | `now()`                          |
| updated_by       | `uuid`         | YES      | -                                |
| deleted_at       | `timestamptz`  | YES      | -                                |
| deleted_by       | `uuid`         | YES      | -                                |
| deletion_reason  | `text`         | YES      | -                                |
| category         | `varchar`      | YES      | -                                |
| sub_category     | `varchar`      | YES      | -                                |
| language         | `varchar`      | YES      | -                                |
| source_platform  | `USER-DEFINED` | YES      | `'web'::ticket_source_platform`  |
| raised_by_type   | `USER-DEFINED` | YES      | `'admin'::ticket_raised_by_type` |
| attachments_url  | `_text`        | YES      | `'{}'::jsonb`                    |
| resolution_notes | `text`         | YES      | -                                |
| sla_due_at       | `timestamptz`  | YES      | -                                |
| closed_at        | `timestamptz`  | YES      | -                                |
| status           | `USER-DEFINED` | YES      | `'new'::ticket_status`           |
| priority         | `USER-DEFINED` | YES      | `'medium'::ticket_priority`      |

**Indexes:**

- `idx_sup_tickets_analytics`: (source_platform, raised_by_type)
- `idx_sup_tickets_assigned`: (tenant_id, assigned_to, status)
- `idx_sup_tickets_filtering`: (status, priority)
- `idx_sup_tickets_sla`: (category, status, sla_due_at)
- `idx_sup_tickets_tenant`: (tenant_id)
- `idx_sup_tickets_workload`: (assigned_to, status)
- `sup_tickets_assigned_to_idx`: (assigned_to)
- `sup_tickets_created_at_idx`: (created_at)
- `sup_tickets_created_by_idx`: (created_by)
- `sup_tickets_deleted_at_idx`: (deleted_at)
- `sup_tickets_metadata_idx`: (metadata)
- `sup_tickets_raised_by_idx`: (raised_by)
- `sup_tickets_tenant_id_idx`: (tenant_id)
- `sup_tickets_tenant_id_raised_by_created_at_deleted_at_key`: (tenant_id, raised_by, created_at)
- `sup_tickets_updated_by_idx`: (updated_by)

## Transport Module (trp\_)

### trp_client_invoice_lines

**Row Count:** ~0

| Column      | Type          | Nullable | Default             |
| ----------- | ------------- | -------- | ------------------- |
| id          | `uuid`        | NO       | `gen_random_uuid()` |
| invoice_id  | `uuid`        | NO       | -                   |
| line_number | `integer`     | NO       | -                   |
| description | `text`        | NO       | -                   |
| trip_id     | `uuid`        | YES      | -                   |
| quantity    | `numeric`     | NO       | -                   |
| unit_price  | `numeric`     | NO       | -                   |
| tax_rate    | `numeric`     | YES      | -                   |
| line_amount | `numeric`     | NO       | -                   |
| metadata    | `jsonb`       | YES      | -                   |
| created_at  | `timestamptz` | YES      | `now()`             |

**Indexes:**

- `idx_client_invoice_lines_invoice_line`: (invoice_id, line_number)
- `idx_client_invoice_lines_trip`: (trip_id)

### trp_client_invoices

**Row Count:** ~0

| Column            | Type           | Nullable | Default                       |
| ----------------- | -------------- | -------- | ----------------------------- |
| id                | `uuid`         | NO       | `uuid_generate_v4()`          |
| tenant_id         | `uuid`         | NO       | -                             |
| client_id         | `uuid`         | NO       | -                             |
| invoice_number    | `text`         | NO       | -                             |
| invoice_date      | `date`         | NO       | -                             |
| due_date          | `date`         | NO       | -                             |
| total_amount      | `numeric`      | NO       | -                             |
| currency          | `varchar`      | NO       | -                             |
| metadata          | `jsonb`        | NO       | `'{}'::jsonb`                 |
| created_at        | `timestamptz`  | NO       | `now()`                       |
| created_by        | `uuid`         | YES      | -                             |
| updated_at        | `timestamptz`  | NO       | `now()`                       |
| updated_by        | `uuid`         | YES      | -                             |
| deleted_at        | `timestamptz`  | YES      | -                             |
| deleted_by        | `uuid`         | YES      | -                             |
| deletion_reason   | `text`         | YES      | -                             |
| pricing_plan_id   | `uuid`         | YES      | -                             |
| client_po_number  | `varchar`      | YES      | -                             |
| discount_amount   | `numeric`      | YES      | -                             |
| discount_reason   | `text`         | YES      | -                             |
| status            | `USER-DEFINED` | YES      | `'draft'::trp_invoice_status` |
| paid_at           | `timestamptz`  | YES      | -                             |
| payment_reference | `varchar`      | YES      | -                             |
| payment_method    | `USER-DEFINED` | YES      | -                             |

**CHECK Constraints:**

- `trp_client_invoices_due_date_check`: (due_date >= invoice_date)
- `trp_client_invoices_total_amount_check`: (total_amount >= (0)::numeric)

**Indexes:**

- `idx_client_invoices_client_status_date`: (client_id, status, invoice_date)
- `idx_client_invoices_paid_at`: (paid_at)
- `idx_client_invoices_status_due`: (status, due_date)
- `idx_trp_client_invoices_client_id`: (client_id)
- `idx_trp_client_invoices_created_by`: (created_by)
- `idx_trp_client_invoices_deleted_at`: (deleted_at)
- `idx_trp_client_invoices_due_date`: (due_date)
- `idx_trp_client_invoices_invoice_date`: (invoice_date)
- `idx_trp_client_invoices_metadata`: (metadata)
- `idx_trp_client_invoices_tenant_id`: (tenant_id)
- `idx_trp_client_invoices_tenant_invoice_unique`: (tenant_id, invoice_number)
- `idx_trp_client_invoices_updated_by`: (updated_by)

### trp_platform_account_keys

**Row Count:** ~0

| Column        | Type           | Nullable | Default             |
| ------------- | -------------- | -------- | ------------------- |
| id            | `uuid`         | NO       | `gen_random_uuid()` |
| account_id    | `uuid`         | NO       | -                   |
| key_value     | `text`         | NO       | -                   |
| key_type      | `USER-DEFINED` | NO       | -                   |
| expires_at    | `timestamptz`  | YES      | -                   |
| is_active     | `boolean`      | YES      | `true`              |
| last_used_at  | `timestamptz`  | YES      | -                   |
| created_at    | `timestamptz`  | YES      | `now()`             |
| revoked_at    | `timestamptz`  | YES      | -                   |
| revoked_by    | `uuid`         | YES      | -                   |
| revoke_reason | `text`         | YES      | -                   |

**Indexes:**

- `idx_platform_account_keys_account_active`: (account_id, is_active)
- `idx_platform_account_keys_expires`: (expires_at)
- `idx_platform_account_keys_type`: (key_type)

### trp_platform_accounts

**Row Count:** ~0

| Column             | Type           | Nullable | Default                             |
| ------------------ | -------------- | -------- | ----------------------------------- |
| id                 | `uuid`         | NO       | `uuid_generate_v4()`                |
| tenant_id          | `uuid`         | NO       | -                                   |
| platform_id        | `uuid`         | NO       | -                                   |
| account_identifier | `text`         | NO       | -                                   |
| api_key            | `text`         | YES      | -                                   |
| metadata           | `jsonb`        | NO       | `'{}'::jsonb`                       |
| created_at         | `timestamptz`  | NO       | `now()`                             |
| created_by         | `uuid`         | YES      | -                                   |
| updated_at         | `timestamptz`  | NO       | `now()`                             |
| updated_by         | `uuid`         | YES      | -                                   |
| deleted_at         | `timestamptz`  | YES      | -                                   |
| deleted_by         | `uuid`         | YES      | -                                   |
| deletion_reason    | `text`         | YES      | -                                   |
| account_name       | `varchar`      | YES      | -                                   |
| status             | `USER-DEFINED` | YES      | `'active'::platform_account_status` |
| connected_at       | `timestamptz`  | YES      | -                                   |
| last_sync_at       | `timestamptz`  | YES      | -                                   |
| last_error         | `text`         | YES      | -                                   |
| error_count        | `integer`      | YES      | `0`                                 |
| sync_frequency     | `varchar`      | YES      | -                                   |

**Indexes:**

- `idx_platform_accounts_error_count`: (error_count)
- `idx_platform_accounts_status_sync`: (status, last_sync_at)
- `idx_trp_platform_accounts_account_identifier`: (account_identifier)
- `idx_trp_platform_accounts_created_by`: (created_by)
- `idx_trp_platform_accounts_deleted_at`: (deleted_at)
- `idx_trp_platform_accounts_metadata`: (metadata)
- `idx_trp_platform_accounts_platform_id`: (platform_id)
- `idx_trp_platform_accounts_tenant`: (tenant_id)
- `idx_trp_platform_accounts_tenant_id`: (tenant_id)
- `idx_trp_platform_accounts_tenant_platform_unique`: (tenant_id, platform_id)
- `idx_trp_platform_accounts_updated_by`: (updated_by)

### trp_settlements

**Row Count:** ~0

| Column                 | Type           | Nullable | Default                              |
| ---------------------- | -------------- | -------- | ------------------------------------ |
| id                     | `uuid`         | NO       | `uuid_generate_v4()`                 |
| tenant_id              | `uuid`         | NO       | -                                    |
| trip_id                | `uuid`         | NO       | -                                    |
| settlement_reference   | `text`         | NO       | -                                    |
| amount                 | `numeric`      | NO       | -                                    |
| currency               | `varchar`      | NO       | -                                    |
| platform_commission    | `numeric`      | NO       | -                                    |
| net_amount             | `numeric`      | NO       | -                                    |
| settlement_date        | `date`         | NO       | -                                    |
| metadata               | `jsonb`        | NO       | `'{}'::jsonb`                        |
| created_at             | `timestamptz`  | NO       | `now()`                              |
| created_by             | `uuid`         | YES      | -                                    |
| updated_at             | `timestamptz`  | NO       | `now()`                              |
| updated_by             | `uuid`         | YES      | -                                    |
| deleted_at             | `timestamptz`  | YES      | -                                    |
| deleted_by             | `uuid`         | YES      | -                                    |
| deletion_reason        | `text`         | YES      | -                                    |
| platform_account_id    | `uuid`         | YES      | -                                    |
| settlement_type        | `USER-DEFINED` | YES      | `'platform_payout'::settlement_type` |
| platform_settlement_id | `varchar`      | YES      | -                                    |
| commission             | `numeric`      | YES      | -                                    |
| tax_amount             | `numeric`      | YES      | -                                    |
| tax_rate               | `numeric`      | YES      | -                                    |
| exchange_rate          | `numeric`      | YES      | -                                    |
| original_currency      | `character`    | YES      | -                                    |
| original_amount        | `numeric`      | YES      | -                                    |
| status                 | `USER-DEFINED` | YES      | `'pending'::settlement_status`       |
| paid_at                | `timestamptz`  | YES      | -                                    |
| cancelled_at           | `timestamptz`  | YES      | -                                    |
| reconciled             | `boolean`      | YES      | `false`                              |
| reconciliation_id      | `uuid`         | YES      | -                                    |

**CHECK Constraints:**

- `trp_settlements_amount_check`: (amount >= (0)::numeric)
- `trp_settlements_net_amount_check`: (net_amount >= (0)::numeric)
- `trp_settlements_platform_commission_check`: (platform_commission >= (0)::numeric)

**Indexes:**

- `idx_settlements_not_reconciled`: (reconciled)
- `idx_settlements_platform_account_date`: (platform_account_id, settlement_date)
- `idx_settlements_platform_settlement_id`: (platform_settlement_id)
- `idx_settlements_status_paid`: (status, paid_at)
- `idx_trp_settlements_created_by`: (created_by)
- `idx_trp_settlements_deleted_at`: (deleted_at)
- `idx_trp_settlements_metadata`: (metadata)
- `idx_trp_settlements_settlement_date`: (settlement_date)
- `idx_trp_settlements_tenant`: (tenant_id)
- `idx_trp_settlements_tenant_id`: (tenant_id)
- `idx_trp_settlements_tenant_trip_ref_unique`: (tenant_id, trip_id, settlement_reference)
- `idx_trp_settlements_trip_id`: (trip_id)
- `idx_trp_settlements_updated_by`: (updated_by)

### trp_trips

**Row Count:** ~0

| Column              | Type           | Nullable | Default              |
| ------------------- | -------------- | -------- | -------------------- |
| id                  | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id           | `uuid`         | NO       | -                    |
| driver_id           | `uuid`         | NO       | -                    |
| vehicle_id          | `uuid`         | YES      | -                    |
| platform_id         | `uuid`         | YES      | -                    |
| pickup_latitude     | `numeric`      | YES      | -                    |
| pickup_longitude    | `numeric`      | YES      | -                    |
| start_time          | `timestamptz`  | YES      | -                    |
| dropoff_latitude    | `numeric`      | YES      | -                    |
| dropoff_longitude   | `numeric`      | YES      | -                    |
| end_time            | `timestamptz`  | YES      | -                    |
| distance_km         | `numeric`      | YES      | -                    |
| duration_minutes    | `numeric`      | YES      | -                    |
| payment_method      | `varchar`      | YES      | -                    |
| platform_commission | `numeric`      | YES      | -                    |
| net_earnings        | `numeric`      | YES      | -                    |
| created_at          | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`  |
| updated_at          | `timestamptz`  | NO       | `CURRENT_TIMESTAMP`  |
| deleted_at          | `timestamptz`  | YES      | -                    |
| client_id           | `uuid`         | YES      | -                    |
| trip_date           | `date`         | YES      | -                    |
| fare_base           | `numeric`      | YES      | -                    |
| fare_distance       | `numeric`      | YES      | -                    |
| fare_time           | `numeric`      | YES      | -                    |
| surge_multiplier    | `numeric`      | YES      | -                    |
| tip_amount          | `numeric`      | YES      | -                    |
| platform_account_id | `uuid`         | YES      | -                    |
| platform_trip_id    | `varchar`      | YES      | -                    |
| requested_at        | `timestamptz`  | YES      | -                    |
| matched_at          | `timestamptz`  | YES      | -                    |
| accepted_at         | `timestamptz`  | YES      | -                    |
| arrived_at          | `timestamptz`  | YES      | -                    |
| started_at          | `timestamptz`  | YES      | -                    |
| finished_at         | `timestamptz`  | YES      | -                    |
| pickup_lat          | `numeric`      | YES      | -                    |
| pickup_lng          | `numeric`      | YES      | -                    |
| dropoff_lat         | `numeric`      | YES      | -                    |
| dropoff_lng         | `numeric`      | YES      | -                    |
| distance            | `numeric`      | YES      | -                    |
| duration            | `integer`      | YES      | -                    |
| base_fare           | `numeric`      | YES      | -                    |
| distance_fare       | `numeric`      | YES      | -                    |
| time_fare           | `numeric`      | YES      | -                    |
| surge_amount        | `numeric`      | YES      | -                    |
| total_fare          | `numeric`      | YES      | -                    |
| currency            | `character`    | YES      | -                    |
| status              | `USER-DEFINED` | YES      | -                    |
| metadata            | `jsonb`        | YES      | -                    |
| created_by          | `uuid`         | YES      | -                    |
| updated_by          | `uuid`         | YES      | -                    |
| deleted_by          | `uuid`         | YES      | -                    |
| deletion_reason     | `text`         | YES      | -                    |

**CHECK Constraints:**

- `trp_trips_payment_method_check`: ((payment_method)::text = ANY ((ARRAY['cash'::character varying, 'card'::character varying, 'wallet'...

**Indexes:**

- `idx_trips_driver_status`: (driver_id, status)
- `idx_trips_requested_finished`: (requested_at, finished_at)
- `idx_trips_status_deleted`: (status, deleted_at)
- `idx_trips_tenant_status_started`: (tenant_id, status, started_at)
- `idx_trips_vehicle_started`: (vehicle_id, started_at)
- `idx_trp_trips_created_at_desc`: (created_at DESC)
- `idx_trp_trips_driver_id`: (driver_id)
- `idx_trp_trips_metadata`: (metadata)
- `idx_trp_trips_platform_account_trip_unique`: (platform_account_id, platform_trip_id)
- `idx_trp_trips_platform_trip_unique`: (platform_account_id, platform_trip_id)
- `idx_trp_trips_tenant`: (tenant_id)
- `idx_trp_trips_vehicle_id`: (vehicle_id)
- `trp_trips_client_id_idx`: (client_id)
- `trp_trips_created_at_idx`: (created_at DESC)
- `trp_trips_deleted_at_idx`: (deleted_at)
- `trp_trips_driver_id_idx`: (driver_id)
- `trp_trips_end_time_idx`: (end_time)
- `trp_trips_platform_id_idx`: (platform_id)
- `trp_trips_start_time_idx`: (start_time)
- `trp_trips_tenant_id_idx`: (tenant_id)
- `trp_trips_trip_date_idx`: (trip_date)
- `trp_trips_vehicle_id_idx`: (vehicle_id)

## Views (v\_)

### v_fk

**Row Count:** ~1

| Column | Type     | Nullable | Default |
| ------ | -------- | -------- | ------- |
| count  | `bigint` | YES      | -       |

## Enum Types

_See prisma/schema.prisma for enum definitions_

## Foreign Key Relationships

_Generated from database foreign key constraints_
