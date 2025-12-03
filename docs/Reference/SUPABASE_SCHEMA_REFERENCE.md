# FleetCore5 - Supabase Database Schema Reference

**Last Updated:** 2025-12-02

**Database:** PostgreSQL on Supabase
**Total Tables:** 107

## Table Count by Module

- **adm\_**: 15 tables
- **bil\_**: 9 tables
- **crm\_**: 9 tables
- **dir\_**: 15 tables
- **doc\_**: 4 tables
- **fin\_**: 11 tables
- **flt\_**: 8 tables
- **rev\_**: 4 tables
- **rid\_**: 8 tables
- **sch\_**: 11 tables
- **sup\_**: 6 tables
- **trp\_**: 6 tables
- **v\_**: 1 tables

## Table of Contents

1. [Administration Module (adm\_)](#administration-module-adm_)
2. [Billing Module (bil\_)](#billing-module-bil_)
3. [CRM Module (crm\_)](#crm-module-crm_)
4. [Directory Module (dir\_)](#directory-module-dir_)
5. [Document Module (doc\_)](#document-module-doc_)
6. [Finance Module (fin\_)](#finance-module-fin_)
7. [Fleet Module (flt\_)](#fleet-module-flt_)
8. [Revenue Module (rev\_)](#revenue-module-rev_)
9. [Rider/Driver Module (rid\_)](#riderdriver-module-rid_)
10. [Schedule Module (sch\_)](#schedule-module-sch_)
11. [Support Module (sup\_)](#support-module-sup_)
12. [Transport Module (trp\_)](#transport-module-trp_)
13. [Enum Types](#enum-types)
14. [Foreign Key Relationships](#foreign-key-relationships)

## Administration Module (adm\_)

### adm_audit_logs

**Row Count:** ~61

| Column          | Type             | Nullable | Default                         |
| --------------- | ---------------- | -------- | ------------------------------- |
| id              | `uuid`           | NO       | `uuid_generate_v4()`            |
| tenant_id       | `uuid`           | NO       | `-`                             |
| member_id       | `uuid`           | YES      | `-`                             |
| entity          | `varchar`        | NO       | `-`                             |
| entity_id       | `uuid`           | NO       | `-`                             |
| action          | `varchar`        | NO       | `-`                             |
| changes         | `jsonb`          | YES      | `-`                             |
| ip_address      | `varchar`        | YES      | `-`                             |
| user_agent      | `text`           | YES      | `-`                             |
| timestamp       | `timestamptz`    | NO       | `CURRENT_TIMESTAMP`             |
| severity        | `audit_severity` | NO       | `'info'::audit_severity`        |
| category        | `audit_category` | NO       | `'operational'::audit_category` |
| session_id      | `uuid`           | YES      | `-`                             |
| request_id      | `uuid`           | YES      | `-`                             |
| old_values      | `jsonb`          | YES      | `-`                             |
| new_values      | `jsonb`          | YES      | `-`                             |
| retention_until | `timestamptz`    | YES      | `-`                             |
| tags            | `_text`          | YES      | `ARRAY[]::text[]`               |

### adm_invitations

**Row Count:** ~0

| Column                | Type                | Nullable | Default                        |
| --------------------- | ------------------- | -------- | ------------------------------ |
| id                    | `uuid`              | NO       | `gen_random_uuid()`            |
| tenant_id             | `uuid`              | NO       | `-`                            |
| email                 | `citext`            | NO       | `-`                            |
| token                 | `varchar`           | NO       | `-`                            |
| role                  | `varchar`           | NO       | `-`                            |
| expires_at            | `timestamptz`       | NO       | `-`                            |
| status                | `invitation_status` | NO       | `'pending'::invitation_status` |
| sent_at               | `timestamptz`       | NO       | `-`                            |
| sent_count            | `integer`           | NO       | `1`                            |
| last_sent_at          | `timestamptz`       | NO       | `-`                            |
| accepted_at           | `timestamptz`       | YES      | `-`                            |
| accepted_from_ip      | `inet`              | YES      | `-`                            |
| accepted_by_member_id | `uuid`              | YES      | `-`                            |
| invitation_type       | `invitation_type`   | NO       | `-`                            |
| custom_message        | `text`              | YES      | `-`                            |
| metadata              | `jsonb`             | YES      | `-`                            |
| sent_by               | `uuid`              | NO       | `-`                            |
| created_at            | `timestamptz`       | NO       | `now()`                        |
| updated_at            | `timestamptz`       | NO       | `now()`                        |

### adm_member_roles

**Row Count:** ~2

| Column            | Type          | Nullable | Default              |
| ----------------- | ------------- | -------- | -------------------- |
| id                | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id         | `uuid`        | NO       | `-`                  |
| member_id         | `uuid`        | NO       | `-`                  |
| role_id           | `uuid`        | NO       | `-`                  |
| assigned_at       | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| created_at        | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| created_by        | `uuid`        | YES      | `-`                  |
| updated_at        | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| updated_by        | `uuid`        | YES      | `-`                  |
| deleted_at        | `timestamptz` | YES      | `-`                  |
| deleted_by        | `uuid`        | YES      | `-`                  |
| deletion_reason   | `text`        | YES      | `-`                  |
| assigned_by       | `uuid`        | YES      | `-`                  |
| assignment_reason | `text`        | YES      | `-`                  |
| valid_from        | `timestamptz` | YES      | `-`                  |
| valid_until       | `timestamptz` | YES      | `-`                  |
| is_primary        | `boolean`     | NO       | `false`              |
| scope_type        | `scope_type`  | YES      | `-`                  |
| scope_id          | `uuid`        | YES      | `-`                  |
| priority          | `integer`     | YES      | `0`                  |

### adm_member_sessions

**Row Count:** ~0

| Column     | Type          | Nullable | Default             |
| ---------- | ------------- | -------- | ------------------- |
| id         | `uuid`        | NO       | `gen_random_uuid()` |
| member_id  | `uuid`        | NO       | `-`                 |
| token_hash | `varchar`     | NO       | `-`                 |
| ip_address | `inet`        | YES      | `-`                 |
| user_agent | `text`        | YES      | `-`                 |
| expires_at | `timestamptz` | NO       | `-`                 |
| revoked_at | `timestamptz` | YES      | `-`                 |
| created_at | `timestamptz` | NO       | `now()`             |

### adm_members

**Row Count:** ~46

| Column                   | Type          | Nullable | Default                       |
| ------------------------ | ------------- | -------- | ----------------------------- |
| id                       | `uuid`        | NO       | `uuid_generate_v4()`          |
| tenant_id                | `uuid`        | NO       | `-`                           |
| email                    | `citext`      | NO       | `-`                           |
| clerk_user_id            | `varchar`     | NO       | `-`                           |
| first_name               | `varchar`     | YES      | `-`                           |
| last_name                | `varchar`     | YES      | `-`                           |
| phone                    | `varchar`     | NO       | `-`                           |
| role                     | `varchar`     | NO       | `'member'::character varying` |
| last_login_at            | `timestamptz` | YES      | `-`                           |
| metadata                 | `jsonb`       | NO       | `'{}'::jsonb`                 |
| status                   | `varchar`     | NO       | `'active'::character varying` |
| created_at               | `timestamptz` | NO       | `CURRENT_TIMESTAMP`           |
| created_by               | `uuid`        | YES      | `-`                           |
| updated_at               | `timestamptz` | NO       | `CURRENT_TIMESTAMP`           |
| updated_by               | `uuid`        | YES      | `-`                           |
| deleted_at               | `timestamptz` | YES      | `-`                           |
| deleted_by               | `uuid`        | YES      | `-`                           |
| deletion_reason          | `text`        | YES      | `-`                           |
| email_verified_at        | `timestamptz` | YES      | `-`                           |
| two_factor_enabled       | `boolean`     | NO       | `false`                       |
| two_factor_secret        | `text`        | YES      | `-`                           |
| password_changed_at      | `timestamptz` | YES      | `-`                           |
| failed_login_attempts    | `integer`     | NO       | `0`                           |
| locked_until             | `timestamptz` | YES      | `-`                           |
| default_role_id          | `uuid`        | YES      | `-`                           |
| preferred_language       | `varchar`     | YES      | `-`                           |
| notification_preferences | `jsonb`       | YES      | `-`                           |

### adm_notification_logs

**Row Count:** ~369

| Column          | Type                   | Nullable | Default                          |
| --------------- | ---------------------- | -------- | -------------------------------- |
| id              | `uuid`                 | NO       | `gen_random_uuid()`              |
| tenant_id       | `uuid`                 | YES      | `-`                              |
| recipient_id    | `uuid`                 | YES      | `-`                              |
| recipient_email | `varchar`              | NO       | `-`                              |
| recipient_phone | `varchar`              | YES      | `-`                              |
| template_code   | `varchar`              | NO       | `-`                              |
| channel         | `notification_channel` | NO       | `-`                              |
| locale_used     | `varchar`              | NO       | `-`                              |
| subject         | `text`                 | YES      | `-`                              |
| body            | `text`                 | YES      | `-`                              |
| variables_data  | `jsonb`                | YES      | `-`                              |
| status          | `notification_status`  | NO       | `'pending'::notification_status` |
| sent_at         | `timestamptz`          | YES      | `-`                              |
| delivered_at    | `timestamptz`          | YES      | `-`                              |
| opened_at       | `timestamptz`          | YES      | `-`                              |
| clicked_at      | `timestamptz`          | YES      | `-`                              |
| failed_at       | `timestamptz`          | YES      | `-`                              |
| error_message   | `text`                 | YES      | `-`                              |
| external_id     | `varchar`              | YES      | `-`                              |
| ip_address      | `varchar`              | YES      | `-`                              |
| user_agent      | `text`                 | YES      | `-`                              |
| session_id      | `uuid`                 | YES      | `-`                              |
| request_id      | `uuid`                 | YES      | `-`                              |
| created_at      | `timestamptz`          | NO       | `now()`                          |
| created_by      | `uuid`                 | YES      | `-`                              |
| updated_at      | `timestamptz`          | NO       | `now()`                          |
| updated_by      | `uuid`                 | YES      | `-`                              |
| deleted_at      | `timestamptz`          | YES      | `-`                              |
| deleted_by      | `uuid`                 | YES      | `-`                              |
| deletion_reason | `text`                 | YES      | `-`                              |

### adm_notification_queue

**Row Count:** ~3

| Column            | Type                   | Nullable | Default                         |
| ----------------- | ---------------------- | -------- | ------------------------------- |
| id                | `uuid`                 | NO       | `gen_random_uuid()`             |
| channel           | `notification_channel` | NO       | `'email'::notification_channel` |
| template_code     | `varchar`              | NO       | `-`                             |
| locale            | `varchar`              | NO       | `'en'::character varying`       |
| recipient_email   | `varchar`              | YES      | `-`                             |
| recipient_phone   | `varchar`              | YES      | `-`                             |
| recipient_user_id | `uuid`                 | YES      | `-`                             |
| variables         | `jsonb`                | NO       | `'{}'::jsonb`                   |
| lead_id           | `uuid`                 | YES      | `-`                             |
| member_id         | `uuid`                 | YES      | `-`                             |
| tenant_id         | `uuid`                 | YES      | `-`                             |
| country_code      | `character`            | YES      | `-`                             |
| status            | `queue_status`         | NO       | `'pending'::queue_status`       |
| attempts          | `integer`              | NO       | `0`                             |
| max_attempts      | `integer`              | NO       | `3`                             |
| next_retry_at     | `timestamptz`          | YES      | `-`                             |
| last_error        | `text`                 | YES      | `-`                             |
| created_at        | `timestamptz`          | NO       | `now()`                         |
| processed_at      | `timestamptz`          | YES      | `-`                             |
| idempotency_key   | `varchar`              | YES      | `-`                             |
| deleted_at        | `timestamptz`          | YES      | `-`                             |
| deleted_by        | `uuid`                 | YES      | `-`                             |
| deletion_reason   | `text`                 | YES      | `-`                             |

### adm_provider_employees

**Row Count:** ~4

| Column           | Type          | Nullable | Default                       |
| ---------------- | ------------- | -------- | ----------------------------- |
| id               | `uuid`        | NO       | `uuid_generate_v4()`          |
| clerk_user_id    | `varchar`     | NO       | `-`                           |
| email            | `varchar`     | NO       | `-`                           |
| department       | `varchar`     | YES      | `-`                           |
| title            | `varchar`     | YES      | `-`                           |
| permissions      | `jsonb`       | YES      | `-`                           |
| status           | `varchar`     | NO       | `'active'::character varying` |
| created_at       | `timestamptz` | NO       | `CURRENT_TIMESTAMP`           |
| created_by       | `uuid`        | YES      | `-`                           |
| updated_at       | `timestamptz` | NO       | `CURRENT_TIMESTAMP`           |
| updated_by       | `uuid`        | YES      | `-`                           |
| deleted_at       | `timestamptz` | YES      | `-`                           |
| deleted_by       | `uuid`        | YES      | `-`                           |
| deletion_reason  | `text`        | YES      | `-`                           |
| supervisor_id    | `uuid`        | YES      | `-`                           |
| preferred_locale | `varchar`     | YES      | `-`                           |
| first_name       | `varchar`     | NO       | `-`                           |
| last_name        | `varchar`     | YES      | `-`                           |

### adm_role_permissions

**Row Count:** ~0

| Column     | Type          | Nullable | Default             |
| ---------- | ------------- | -------- | ------------------- |
| id         | `uuid`        | NO       | `gen_random_uuid()` |
| role_id    | `uuid`        | NO       | `-`                 |
| resource   | `varchar`     | NO       | `-`                 |
| action     | `varchar`     | NO       | `-`                 |
| conditions | `jsonb`       | YES      | `-`                 |
| created_at | `timestamptz` | NO       | `now()`             |

### adm_role_versions

**Row Count:** ~0

| Column               | Type          | Nullable | Default             |
| -------------------- | ------------- | -------- | ------------------- |
| id                   | `uuid`        | NO       | `gen_random_uuid()` |
| role_id              | `uuid`        | NO       | `-`                 |
| version_number       | `integer`     | NO       | `-`                 |
| permissions_snapshot | `jsonb`       | NO       | `-`                 |
| changed_by           | `uuid`        | YES      | `-`                 |
| change_reason        | `text`        | YES      | `-`                 |
| created_at           | `timestamptz` | NO       | `now()`             |

### adm_roles

**Row Count:** ~5

| Column            | Type          | Nullable | Default                       |
| ----------------- | ------------- | -------- | ----------------------------- |
| id                | `uuid`        | NO       | `uuid_generate_v4()`          |
| tenant_id         | `uuid`        | NO       | `-`                           |
| name              | `varchar`     | NO       | `-`                           |
| description       | `text`        | YES      | `-`                           |
| permissions       | `jsonb`       | NO       | `'{}'::jsonb`                 |
| status            | `varchar`     | NO       | `'active'::character varying` |
| created_at        | `timestamptz` | NO       | `CURRENT_TIMESTAMP`           |
| created_by        | `uuid`        | YES      | `-`                           |
| updated_at        | `timestamptz` | NO       | `CURRENT_TIMESTAMP`           |
| updated_by        | `uuid`        | YES      | `-`                           |
| deleted_at        | `timestamptz` | YES      | `-`                           |
| deleted_by        | `uuid`        | YES      | `-`                           |
| deletion_reason   | `text`        | YES      | `-`                           |
| slug              | `varchar`     | NO       | `-`                           |
| parent_role_id    | `uuid`        | YES      | `-`                           |
| is_system         | `boolean`     | NO       | `false`                       |
| is_default        | `boolean`     | NO       | `false`                       |
| max_members       | `integer`     | YES      | `-`                           |
| valid_from        | `timestamptz` | YES      | `-`                           |
| valid_until       | `timestamptz` | YES      | `-`                           |
| approval_required | `boolean`     | NO       | `false`                       |

### adm_tenant_lifecycle_events

**Row Count:** ~0

| Column         | Type          | Nullable | Default              |
| -------------- | ------------- | -------- | -------------------- |
| id             | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id      | `uuid`        | NO       | `-`                  |
| event_type     | `varchar`     | NO       | `-`                  |
| performed_by   | `uuid`        | YES      | `-`                  |
| effective_date | `date`        | YES      | `-`                  |
| description    | `text`        | YES      | `-`                  |
| created_at     | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |

### adm_tenant_settings

**Row Count:** ~0

| Column        | Type          | Nullable | Default             |
| ------------- | ------------- | -------- | ------------------- |
| id            | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id     | `uuid`        | NO       | `-`                 |
| setting_key   | `varchar`     | NO       | `-`                 |
| setting_value | `jsonb`       | NO       | `-`                 |
| category      | `varchar`     | YES      | `-`                 |
| is_encrypted  | `boolean`     | NO       | `false`             |
| updated_at    | `timestamptz` | NO       | `now()`             |

### adm_tenant_vehicle_classes

**Row Count:** ~0

| Column            | Type               | Nullable | Default                      |
| ----------------- | ------------------ | -------- | ---------------------------- |
| id                | `uuid`             | NO       | `uuid_generate_v4()`         |
| tenant_id         | `uuid`             | NO       | `-`                          |
| code              | `varchar`          | NO       | `-`                          |
| name              | `varchar`          | NO       | `-`                          |
| description       | `text`             | YES      | `-`                          |
| criteria          | `jsonb`            | YES      | `-`                          |
| based_on_class_id | `uuid`             | YES      | `-`                          |
| status            | `lifecycle_status` | NO       | `'active'::lifecycle_status` |
| metadata          | `jsonb`            | YES      | `-`                          |
| created_at        | `timestamptz`      | NO       | `now()`                      |
| updated_at        | `timestamptz`      | NO       | `now()`                      |
| created_by        | `uuid`             | NO       | `-`                          |
| updated_by        | `uuid`             | YES      | `-`                          |
| deleted_at        | `timestamptz`      | YES      | `-`                          |
| deleted_by        | `uuid`             | YES      | `-`                          |
| deletion_reason   | `text`             | YES      | `-`                          |

### adm_tenants

**Row Count:** ~11

| Column                  | Type            | Nullable | Default                             |
| ----------------------- | --------------- | -------- | ----------------------------------- |
| id                      | `uuid`          | NO       | `uuid_generate_v4()`                |
| name                    | `text`          | NO       | `-`                                 |
| country_code            | `varchar`       | NO       | `-`                                 |
| clerk_organization_id   | `text`          | YES      | `-`                                 |
| vat_rate                | `numeric`       | YES      | `-`                                 |
| default_currency        | `character`     | NO       | `'EUR'::character varying`          |
| timezone                | `text`          | NO       | `'Europe/Paris'::character varying` |
| created_at              | `timestamptz`   | NO       | `CURRENT_TIMESTAMP`                 |
| updated_at              | `timestamptz`   | NO       | `CURRENT_TIMESTAMP`                 |
| deleted_at              | `timestamptz`   | YES      | `-`                                 |
| subdomain               | `varchar`       | YES      | `-`                                 |
| status                  | `tenant_status` | NO       | `'trialing'::tenant_status`         |
| onboarding_completed_at | `timestamptz`   | YES      | `-`                                 |
| trial_ends_at           | `timestamptz`   | YES      | `-`                                 |
| next_invoice_date       | `date`          | YES      | `-`                                 |
| primary_contact_email   | `varchar`       | YES      | `-`                                 |
| primary_contact_phone   | `varchar`       | YES      | `-`                                 |
| billing_email           | `varchar`       | YES      | `-`                                 |

## Billing Module (bil\_)

### bil_billing_plans

**Row Count:** ~0

| Column                  | Type                  | Nullable | Default                     |
| ----------------------- | --------------------- | -------- | --------------------------- |
| id                      | `uuid`                | NO       | `uuid_generate_v4()`        |
| plan_name               | `text`                | NO       | `-`                         |
| description             | `text`                | YES      | `-`                         |
| monthly_fee             | `numeric`             | NO       | `0`                         |
| annual_fee              | `numeric`             | NO       | `0`                         |
| currency                | `varchar`             | NO       | `-`                         |
| features                | `jsonb`               | NO       | `'{}'::jsonb`               |
| metadata                | `jsonb`               | NO       | `'{}'::jsonb`               |
| created_at              | `timestamptz`         | NO       | `now()`                     |
| created_by              | `uuid`                | YES      | `-`                         |
| updated_at              | `timestamptz`         | NO       | `now()`                     |
| updated_by              | `uuid`                | YES      | `-`                         |
| deleted_at              | `timestamptz`         | YES      | `-`                         |
| deleted_by              | `uuid`                | YES      | `-`                         |
| deletion_reason         | `text`                | YES      | `-`                         |
| plan_code               | `varchar`             | YES      | `-`                         |
| price_monthly           | `numeric`             | YES      | `-`                         |
| price_yearly            | `numeric`             | YES      | `-`                         |
| vat_rate                | `numeric`             | YES      | `-`                         |
| max_vehicles            | `integer`             | YES      | `-`                         |
| max_drivers             | `integer`             | YES      | `-`                         |
| max_users               | `integer`             | YES      | `-`                         |
| version                 | `integer`             | YES      | `1`                         |
| stripe_price_id_monthly | `text`                | YES      | `-`                         |
| stripe_price_id_yearly  | `text`                | YES      | `-`                         |
| billing_interval        | `billing_interval`    | YES      | `'month'::billing_interval` |
| status                  | `billing_plan_status` | YES      | `-`                         |

### bil_payment_methods

**Row Count:** ~0

| Column                     | Type                    | Nullable | Default                           |
| -------------------------- | ----------------------- | -------- | --------------------------------- |
| id                         | `uuid`                  | NO       | `uuid_generate_v4()`              |
| tenant_id                  | `uuid`                  | NO       | `-`                               |
| provider_token             | `text`                  | NO       | `-`                               |
| expires_at                 | `date`                  | YES      | `-`                               |
| metadata                   | `jsonb`                 | NO       | `'{}'::jsonb`                     |
| created_at                 | `timestamptz`           | NO       | `now()`                           |
| created_by                 | `uuid`                  | YES      | `-`                               |
| updated_at                 | `timestamptz`           | NO       | `now()`                           |
| updated_by                 | `uuid`                  | YES      | `-`                               |
| deleted_at                 | `timestamptz`           | YES      | `-`                               |
| deleted_by                 | `uuid`                  | YES      | `-`                               |
| deletion_reason            | `text`                  | YES      | `-`                               |
| provider                   | `varchar`               | YES      | `-`                               |
| provider_payment_method_id | `text`                  | YES      | `-`                               |
| payment_type               | `payment_type`          | YES      | `-`                               |
| card_brand                 | `varchar`               | YES      | `-`                               |
| card_last4                 | `character`             | YES      | `-`                               |
| card_exp_month             | `integer`               | YES      | `-`                               |
| card_exp_year              | `integer`               | YES      | `-`                               |
| bank_name                  | `varchar`               | YES      | `-`                               |
| bank_account_last4         | `character`             | YES      | `-`                               |
| bank_country               | `character`             | YES      | `-`                               |
| status                     | `payment_method_status` | YES      | `'active'::payment_method_status` |
| is_default                 | `boolean`               | YES      | `false`                           |
| last_used_at               | `timestamptz`           | YES      | `-`                               |

### bil_promotion_usage

**Row Count:** ~0

| Column          | Type          | Nullable | Default              |
| --------------- | ------------- | -------- | -------------------- |
| id              | `uuid`        | NO       | `uuid_generate_v4()` |
| promotion_id    | `uuid`        | NO       | `-`                  |
| tenant_id       | `uuid`        | NO       | `-`                  |
| invoice_id      | `uuid`        | YES      | `-`                  |
| applied_at      | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| discount_amount | `numeric`     | NO       | `-`                  |

### bil_promotions

**Row Count:** ~0

| Column            | Type                      | Nullable | Default                      |
| ----------------- | ------------------------- | -------- | ---------------------------- |
| id                | `uuid`                    | NO       | `uuid_generate_v4()`         |
| code              | `varchar`                 | NO       | `-`                          |
| description       | `text`                    | YES      | `-`                          |
| discount_type     | `promotion_discount_type` | NO       | `-`                          |
| discount_value    | `numeric`                 | NO       | `-`                          |
| currency          | `character`               | YES      | `-`                          |
| max_redemptions   | `integer`                 | YES      | `-`                          |
| redemptions_count | `integer`                 | NO       | `0`                          |
| valid_from        | `timestamptz`             | NO       | `-`                          |
| valid_until       | `timestamptz`             | NO       | `-`                          |
| applies_to        | `promotion_applies_to`    | NO       | `-`                          |
| plan_id           | `uuid`                    | YES      | `-`                          |
| status            | `promotion_status`        | NO       | `'active'::promotion_status` |
| metadata          | `jsonb`                   | YES      | `'{}'::jsonb`                |
| created_at        | `timestamptz`             | NO       | `CURRENT_TIMESTAMP`          |
| created_by        | `uuid`                    | YES      | `-`                          |

### bil_tenant_invoice_lines

**Row Count:** ~0

| Column          | Type                       | Nullable | Default              |
| --------------- | -------------------------- | -------- | -------------------- |
| id              | `uuid`                     | NO       | `uuid_generate_v4()` |
| invoice_id      | `uuid`                     | NO       | `-`                  |
| description     | `text`                     | NO       | `-`                  |
| amount          | `numeric`                  | NO       | `0`                  |
| quantity        | `numeric`                  | NO       | `1`                  |
| metadata        | `jsonb`                    | NO       | `'{}'::jsonb`        |
| created_at      | `timestamptz`              | NO       | `now()`              |
| created_by      | `uuid`                     | YES      | `-`                  |
| updated_at      | `timestamptz`              | NO       | `now()`              |
| updated_by      | `uuid`                     | YES      | `-`                  |
| deleted_at      | `timestamptz`              | YES      | `-`                  |
| deleted_by      | `uuid`                     | YES      | `-`                  |
| deletion_reason | `text`                     | YES      | `-`                  |
| line_type       | `invoice_line_type`        | YES      | `-`                  |
| unit_price      | `numeric`                  | YES      | `-`                  |
| tax_rate        | `numeric`                  | YES      | `-`                  |
| tax_amount      | `numeric`                  | YES      | `-`                  |
| discount_amount | `numeric`                  | YES      | `-`                  |
| source_type     | `invoice_line_source_type` | YES      | `-`                  |
| source_id       | `uuid`                     | YES      | `-`                  |

### bil_tenant_invoices

**Row Count:** ~0

| Column            | Type             | Nullable | Default              |
| ----------------- | ---------------- | -------- | -------------------- |
| id                | `uuid`           | NO       | `uuid_generate_v4()` |
| tenant_id         | `uuid`           | NO       | `-`                  |
| invoice_number    | `text`           | NO       | `-`                  |
| invoice_date      | `date`           | NO       | `-`                  |
| due_date          | `date`           | NO       | `-`                  |
| total_amount      | `numeric`        | NO       | `0`                  |
| currency          | `varchar`        | NO       | `-`                  |
| metadata          | `jsonb`          | NO       | `'{}'::jsonb`        |
| created_at        | `timestamptz`    | NO       | `now()`              |
| created_by        | `uuid`           | YES      | `-`                  |
| updated_at        | `timestamptz`    | NO       | `now()`              |
| updated_by        | `uuid`           | YES      | `-`                  |
| deleted_at        | `timestamptz`    | YES      | `-`                  |
| deleted_by        | `uuid`           | YES      | `-`                  |
| deletion_reason   | `text`           | YES      | `-`                  |
| subscription_id   | `uuid`           | YES      | `-`                  |
| period_start      | `timestamptz`    | YES      | `-`                  |
| period_end        | `timestamptz`    | YES      | `-`                  |
| paid_at           | `timestamptz`    | YES      | `-`                  |
| subtotal          | `numeric`        | YES      | `-`                  |
| tax_rate          | `numeric`        | YES      | `-`                  |
| tax_amount        | `numeric`        | YES      | `-`                  |
| amount_paid       | `numeric`        | YES      | `0`                  |
| amount_due        | `numeric`        | YES      | `0`                  |
| status            | `invoice_status` | YES      | `-`                  |
| stripe_invoice_id | `varchar`        | YES      | `-`                  |
| document_url      | `text`           | YES      | `-`                  |

### bil_tenant_subscriptions

**Row Count:** ~0

| Column                   | Type                  | Nullable | Default                     |
| ------------------------ | --------------------- | -------- | --------------------------- |
| id                       | `uuid`                | NO       | `uuid_generate_v4()`        |
| tenant_id                | `uuid`                | NO       | `-`                         |
| plan_id                  | `uuid`                | NO       | `-`                         |
| subscription_start       | `date`                | NO       | `-`                         |
| subscription_end         | `date`                | YES      | `-`                         |
| metadata                 | `jsonb`               | NO       | `'{}'::jsonb`               |
| created_at               | `timestamptz`         | NO       | `now()`                     |
| created_by               | `uuid`                | YES      | `-`                         |
| updated_at               | `timestamptz`         | NO       | `now()`                     |
| updated_by               | `uuid`                | YES      | `-`                         |
| deleted_at               | `timestamptz`         | YES      | `-`                         |
| deleted_by               | `uuid`                | YES      | `-`                         |
| deletion_reason          | `text`                | YES      | `-`                         |
| previous_plan_id         | `uuid`                | YES      | `-`                         |
| plan_version             | `integer`             | YES      | `-`                         |
| payment_method_id        | `uuid`                | YES      | `-`                         |
| billing_cycle            | `billing_interval`    | YES      | `'month'::billing_interval` |
| current_period_start     | `timestamptz`         | YES      | `-`                         |
| current_period_end       | `timestamptz`         | YES      | `-`                         |
| trial_end                | `timestamptz`         | YES      | `-`                         |
| status                   | `subscription_status` | YES      | `-`                         |
| cancel_at_period_end     | `boolean`             | YES      | `true`                      |
| auto_renew               | `boolean`             | YES      | `true`                      |
| provider                 | `varchar`             | YES      | `-`                         |
| provider_subscription_id | `text`                | YES      | `-`                         |
| provider_customer_id     | `text`                | YES      | `-`                         |

### bil_tenant_usage_metrics

**Row Count:** ~0

| Column          | Type            | Nullable | Default              |
| --------------- | --------------- | -------- | -------------------- |
| id              | `uuid`          | NO       | `uuid_generate_v4()` |
| tenant_id       | `uuid`          | NO       | `-`                  |
| metric_name     | `varchar`       | NO       | `-`                  |
| metric_value    | `numeric`       | NO       | `0`                  |
| period_start    | `date`          | NO       | `-`                  |
| period_end      | `date`          | NO       | `-`                  |
| metadata        | `jsonb`         | NO       | `'{}'::jsonb`        |
| created_at      | `timestamptz`   | NO       | `now()`              |
| created_by      | `uuid`          | YES      | `-`                  |
| updated_at      | `timestamptz`   | NO       | `now()`              |
| updated_by      | `uuid`          | YES      | `-`                  |
| deleted_at      | `timestamptz`   | YES      | `-`                  |
| deleted_by      | `uuid`          | YES      | `-`                  |
| deletion_reason | `text`          | YES      | `-`                  |
| metric_type_id  | `uuid`          | YES      | `-`                  |
| subscription_id | `uuid`          | YES      | `-`                  |
| plan_version    | `integer`       | YES      | `-`                  |
| period_type     | `period_type`   | YES      | `-`                  |
| period_start_ts | `timestamptz`   | YES      | `-`                  |
| period_end_ts   | `timestamptz`   | YES      | `-`                  |
| metric_source   | `metric_source` | YES      | `-`                  |

### bil_usage_metric_types

**Row Count:** ~0

| Column             | Type                 | Nullable | Default              |
| ------------------ | -------------------- | -------- | -------------------- |
| id                 | `uuid`               | NO       | `uuid_generate_v4()` |
| name               | `varchar`            | NO       | `-`                  |
| unit               | `varchar`            | NO       | `-`                  |
| description        | `text`               | YES      | `-`                  |
| aggregation_method | `aggregation_method` | NO       | `-`                  |
| created_at         | `timestamptz`        | NO       | `CURRENT_TIMESTAMP`  |

## CRM Module (crm\_)

### crm_addresses

**Row Count:** ~0

| Column       | Type           | Nullable | Default              |
| ------------ | -------------- | -------- | -------------------- |
| id           | `uuid`         | NO       | `uuid_generate_v4()` |
| street_line1 | `text`         | NO       | `-`                  |
| street_line2 | `text`         | YES      | `-`                  |
| city         | `varchar`      | NO       | `-`                  |
| state        | `varchar`      | YES      | `-`                  |
| postal_code  | `varchar`      | YES      | `-`                  |
| country_code | `character`    | NO       | `-`                  |
| address_type | `address_type` | YES      | `-`                  |
| is_default   | `boolean`      | NO       | `false`              |
| created_at   | `timestamptz`  | NO       | `now()`              |

### crm_contracts

**Row Count:** ~0

| Column                   | Type           | Nullable | Default              |
| ------------------------ | -------------- | -------- | -------------------- |
| id                       | `uuid`         | NO       | `uuid_generate_v4()` |
| lead_id                  | `uuid`         | NO       | `-`                  |
| contract_reference       | `text`         | NO       | `-`                  |
| contract_date            | `date`         | NO       | `-`                  |
| effective_date           | `date`         | NO       | `-`                  |
| expiry_date              | `date`         | YES      | `-`                  |
| total_value              | `numeric`      | NO       | `-`                  |
| currency                 | `varchar`      | NO       | `-`                  |
| status                   | `text`         | NO       | `'active'::text`     |
| metadata                 | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at               | `timestamptz`  | NO       | `now()`              |
| created_by               | `uuid`         | YES      | `-`                  |
| updated_at               | `timestamptz`  | NO       | `now()`              |
| updated_by               | `uuid`         | YES      | `-`                  |
| deleted_at               | `timestamptz`  | YES      | `-`                  |
| deleted_by               | `uuid`         | YES      | `-`                  |
| deletion_reason          | `text`         | YES      | `-`                  |
| opportunity_id           | `uuid`         | YES      | `-`                  |
| contract_code            | `text`         | YES      | `-`                  |
| signature_date           | `date`         | YES      | `-`                  |
| expiration_date          | `date`         | YES      | `-`                  |
| vat_rate                 | `numeric`      | YES      | `-`                  |
| renewal_type             | `renewal_type` | YES      | `-`                  |
| auto_renew               | `boolean`      | YES      | `false`              |
| renewal_date             | `date`         | YES      | `-`                  |
| notice_period_days       | `integer`      | YES      | `-`                  |
| renewed_from_contract_id | `uuid`         | YES      | `-`                  |
| tenant_id                | `uuid`         | NO       | `-`                  |
| plan_id                  | `uuid`         | YES      | `-`                  |
| subscription_id          | `uuid`         | YES      | `-`                  |
| company_name             | `text`         | YES      | `-`                  |
| contact_name             | `text`         | YES      | `-`                  |
| contact_email            | `citext`       | YES      | `-`                  |
| contact_phone            | `varchar`      | YES      | `-`                  |
| billing_address_id       | `uuid`         | YES      | `-`                  |
| version_number           | `integer`      | YES      | `1`                  |
| document_url             | `text`         | YES      | `-`                  |
| notes                    | `text`         | YES      | `-`                  |
| approved_by              | `uuid`         | YES      | `-`                  |

### crm_countries

**Row Count:** ~30

| Column                 | Type          | Nullable | Default                   |
| ---------------------- | ------------- | -------- | ------------------------- |
| id                     | `uuid`        | NO       | `gen_random_uuid()`       |
| country_code           | `character`   | NO       | `-`                       |
| country_name_en        | `varchar`     | NO       | `-`                       |
| country_name_fr        | `varchar`     | NO       | `-`                       |
| country_name_ar        | `varchar`     | NO       | `-`                       |
| flag_emoji             | `varchar`     | NO       | `-`                       |
| is_operational         | `boolean`     | NO       | `false`                   |
| is_visible             | `boolean`     | NO       | `true`                    |
| display_order          | `integer`     | NO       | `-`                       |
| notification_locale    | `varchar`     | NO       | `'en'::character varying` |
| created_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`       |
| updated_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`       |
| country_preposition_fr | `varchar`     | YES      | `'en'::character varying` |
| country_preposition_en | `varchar`     | YES      | `'in'::character varying` |
| country_gdpr           | `boolean`     | NO       | `false`                   |

### crm_lead_activities

**Row Count:** ~3

| Column            | Type          | Nullable | Default             |
| ----------------- | ------------- | -------- | ------------------- |
| id                | `uuid`        | NO       | `gen_random_uuid()` |
| lead_id           | `uuid`        | NO       | `-`                 |
| activity_type     | `varchar`     | NO       | `-`                 |
| title             | `varchar`     | YES      | `-`                 |
| description       | `text`        | YES      | `-`                 |
| metadata          | `jsonb`       | YES      | `'{}'::jsonb`       |
| scheduled_at      | `timestamptz` | YES      | `-`                 |
| completed_at      | `timestamptz` | YES      | `-`                 |
| is_completed      | `boolean`     | YES      | `false`             |
| performed_by      | `uuid`        | YES      | `-`                 |
| performed_by_name | `varchar`     | YES      | `-`                 |
| created_at        | `timestamptz` | YES      | `now()`             |
| updated_at        | `timestamptz` | YES      | `now()`             |

### crm_lead_sources

**Row Count:** ~5

| Column      | Type          | Nullable | Default              |
| ----------- | ------------- | -------- | -------------------- |
| id          | `uuid`        | NO       | `uuid_generate_v4()` |
| name        | `varchar`     | NO       | `-`                  |
| description | `text`        | YES      | `-`                  |
| is_active   | `boolean`     | NO       | `true`               |
| created_at  | `timestamptz` | NO       | `now()`              |

### crm_leads

**Row Count:** ~18

| Column              | Type          | Nullable | Default                       |
| ------------------- | ------------- | -------- | ----------------------------- |
| id                  | `uuid`        | NO       | `uuid_generate_v4()`          |
| email               | `text`        | NO       | `-`                           |
| phone               | `text`        | YES      | `-`                           |
| source              | `text`        | YES      | `-`                           |
| status              | `text`        | NO       | `'new'::text`                 |
| message             | `text`        | YES      | `-`                           |
| created_at          | `timestamptz` | NO       | `CURRENT_TIMESTAMP`           |
| updated_at          | `timestamptz` | NO       | `CURRENT_TIMESTAMP`           |
| country_code        | `character`   | YES      | `-`                           |
| fleet_size          | `varchar`     | YES      | `-`                           |
| current_software    | `varchar`     | YES      | `-`                           |
| assigned_to         | `uuid`        | YES      | `-`                           |
| qualification_score | `integer`     | YES      | `-`                           |
| qualification_notes | `text`        | YES      | `-`                           |
| qualified_date      | `timestamptz` | YES      | `-`                           |
| converted_date      | `timestamptz` | YES      | `-`                           |
| utm_source          | `varchar`     | YES      | `-`                           |
| utm_medium          | `varchar`     | YES      | `-`                           |
| utm_campaign        | `varchar`     | YES      | `-`                           |
| metadata            | `jsonb`       | YES      | `'{}'::jsonb`                 |
| created_by          | `uuid`        | YES      | `-`                           |
| updated_by          | `uuid`        | YES      | `-`                           |
| deleted_at          | `timestamptz` | YES      | `-`                           |
| deleted_by          | `uuid`        | YES      | `-`                           |
| deletion_reason     | `text`        | YES      | `-`                           |
| lead_code           | `varchar`     | YES      | `-`                           |
| first_name          | `text`        | NO       | `-`                           |
| last_name           | `text`        | NO       | `-`                           |
| company_name        | `text`        | YES      | `-`                           |
| industry            | `text`        | YES      | `-`                           |
| company_size        | `integer`     | YES      | `-`                           |
| website_url         | `text`        | YES      | `-`                           |
| linkedin_url        | `text`        | YES      | `-`                           |
| city                | `text`        | YES      | `-`                           |
| lead_stage          | `lead_stage`  | YES      | `-`                           |
| fit_score           | `numeric`     | YES      | `-`                           |
| engagement_score    | `numeric`     | YES      | `-`                           |
| scoring             | `jsonb`       | YES      | `-`                           |
| gdpr_consent        | `boolean`     | YES      | `-`                           |
| consent_at          | `timestamptz` | YES      | `-`                           |
| source_id           | `uuid`        | YES      | `-`                           |
| opportunity_id      | `uuid`        | YES      | `-`                           |
| next_action_date    | `timestamptz` | YES      | `-`                           |
| priority            | `varchar`     | YES      | `'medium'::character varying` |
| consent_ip          | `varchar`     | YES      | `-`                           |

### crm_opportunities

**Row Count:** ~9

| Column              | Type                 | Nullable | Default                      |
| ------------------- | -------------------- | -------- | ---------------------------- |
| id                  | `uuid`               | NO       | `uuid_generate_v4()`         |
| lead_id             | `uuid`               | NO       | `-`                          |
| stage               | `text`               | NO       | `'prospect'::text`           |
| expected_value      | `numeric`            | YES      | `-`                          |
| close_date          | `date`               | YES      | `-`                          |
| assigned_to         | `uuid`               | YES      | `-`                          |
| metadata            | `jsonb`              | NO       | `'{}'::jsonb`                |
| created_at          | `timestamptz`        | NO       | `now()`                      |
| created_by          | `uuid`               | YES      | `-`                          |
| updated_at          | `timestamptz`        | NO       | `now()`                      |
| updated_by          | `uuid`               | YES      | `-`                          |
| deleted_at          | `timestamptz`        | YES      | `-`                          |
| deleted_by          | `uuid`               | YES      | `-`                          |
| deletion_reason     | `text`               | YES      | `-`                          |
| probability         | `integer`            | YES      | `-`                          |
| status              | `opportunity_status` | NO       | `'open'::opportunity_status` |
| currency            | `character`          | YES      | `'EUR'::bpchar`              |
| discount_amount     | `numeric`            | YES      | `-`                          |
| probability_percent | `numeric`            | YES      | `0`                          |
| forecast_value      | `numeric`            | YES      | `-`                          |
| won_value           | `numeric`            | YES      | `-`                          |
| expected_close_date | `date`               | YES      | `-`                          |
| won_date            | `date`               | YES      | `-`                          |
| lost_date           | `date`               | YES      | `-`                          |
| owner_id            | `uuid`               | YES      | `-`                          |
| plan_id             | `uuid`               | YES      | `-`                          |
| contract_id         | `uuid`               | YES      | `-`                          |
| pipeline_id         | `uuid`               | YES      | `-`                          |
| notes               | `text`               | YES      | `-`                          |
| stage_entered_at    | `timestamptz`        | NO       | `now()`                      |
| max_days_in_stage   | `integer`            | YES      | `14`                         |
| loss_reason         | `varchar`            | YES      | `-`                          |

### crm_pipelines

**Row Count:** ~0

| Column              | Type          | Nullable | Default              |
| ------------------- | ------------- | -------- | -------------------- |
| id                  | `uuid`        | NO       | `uuid_generate_v4()` |
| name                | `varchar`     | NO       | `-`                  |
| description         | `text`        | YES      | `-`                  |
| stages              | `jsonb`       | NO       | `-`                  |
| default_probability | `jsonb`       | YES      | `-`                  |
| is_default          | `boolean`     | NO       | `false`              |
| is_active           | `boolean`     | NO       | `true`               |
| created_at          | `timestamptz` | NO       | `now()`              |

### crm_settings

**Row Count:** ~9

| Column            | Type          | Nullable | Default             |
| ----------------- | ------------- | -------- | ------------------- |
| id                | `uuid`        | NO       | `gen_random_uuid()` |
| setting_key       | `varchar`     | NO       | `-`                 |
| setting_value     | `jsonb`       | NO       | `-`                 |
| description       | `text`        | YES      | `-`                 |
| category          | `varchar`     | NO       | `-`                 |
| data_type         | `varchar`     | NO       | `-`                 |
| is_active         | `boolean`     | NO       | `true`              |
| is_system         | `boolean`     | NO       | `false`             |
| version           | `integer`     | NO       | `1`                 |
| schema_version    | `varchar`     | YES      | `-`                 |
| created_at        | `timestamptz` | NO       | `now()`             |
| updated_at        | `timestamptz` | NO       | `now()`             |
| created_by        | `uuid`        | YES      | `-`                 |
| updated_by        | `uuid`        | YES      | `-`                 |
| deleted_at        | `timestamptz` | YES      | `-`                 |
| deleted_by        | `uuid`        | YES      | `-`                 |
| deletion_reason   | `text`        | YES      | `-`                 |
| display_label     | `varchar`     | YES      | `-`                 |
| display_order     | `integer`     | YES      | `0`                 |
| ui_component      | `varchar`     | YES      | `-`                 |
| help_text         | `text`        | YES      | `-`                 |
| documentation_url | `varchar`     | YES      | `-`                 |
| default_value     | `jsonb`       | YES      | `-`                 |

## Directory Module (dir\_)

### dir_car_makes

**Row Count:** ~17

| Column            | Type               | Nullable | Default                      |
| ----------------- | ------------------ | -------- | ---------------------------- |
| id                | `uuid`             | NO       | `uuid_generate_v4()`         |
| tenant_id         | `uuid`             | NO       | `-`                          |
| name              | `text`             | NO       | `-`                          |
| created_at        | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`          |
| updated_at        | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`          |
| code              | `varchar`          | NO       | `-`                          |
| country_of_origin | `character`        | YES      | `-`                          |
| parent_company    | `varchar`          | YES      | `-`                          |
| founded_year      | `integer`          | YES      | `-`                          |
| logo_url          | `text`             | YES      | `-`                          |
| status            | `lifecycle_status` | NO       | `'active'::lifecycle_status` |
| metadata          | `jsonb`            | YES      | `-`                          |
| created_by        | `uuid`             | YES      | `-`                          |
| updated_by        | `uuid`             | YES      | `-`                          |
| deleted_at        | `timestamptz`      | YES      | `-`                          |
| deleted_by        | `uuid`             | YES      | `-`                          |
| deletion_reason   | `text`             | YES      | `-`                          |

### dir_car_models

**Row Count:** ~37

| Column           | Type               | Nullable | Default                      |
| ---------------- | ------------------ | -------- | ---------------------------- |
| id               | `uuid`             | NO       | `uuid_generate_v4()`         |
| tenant_id        | `uuid`             | NO       | `-`                          |
| make_id          | `uuid`             | NO       | `-`                          |
| name             | `text`             | NO       | `-`                          |
| created_at       | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`          |
| updated_at       | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`          |
| vehicle_class_id | `uuid`             | YES      | `-`                          |
| code             | `varchar`          | NO       | `-`                          |
| year_start       | `integer`          | YES      | `-`                          |
| year_end         | `integer`          | YES      | `-`                          |
| body_type        | `varchar`          | YES      | `-`                          |
| fuel_type        | `varchar`          | YES      | `-`                          |
| transmission     | `varchar`          | YES      | `-`                          |
| seats_min        | `integer`          | YES      | `-`                          |
| seats_max        | `integer`          | YES      | `-`                          |
| length_mm        | `integer`          | YES      | `-`                          |
| width_mm         | `integer`          | YES      | `-`                          |
| height_mm        | `integer`          | YES      | `-`                          |
| metadata         | `jsonb`            | YES      | `-`                          |
| status           | `car_model_status` | NO       | `'active'::car_model_status` |
| created_by       | `uuid`             | YES      | `-`                          |
| updated_by       | `uuid`             | YES      | `-`                          |
| deleted_at       | `timestamptz`      | YES      | `-`                          |
| deleted_by       | `uuid`             | YES      | `-`                          |
| deletion_reason  | `text`             | YES      | `-`                          |

### dir_country_locales

**Row Count:** ~20

| Column            | Type               | Nullable | Default                         |
| ----------------- | ------------------ | -------- | ------------------------------- |
| id                | `uuid`             | NO       | `gen_random_uuid()`             |
| country_code      | `character`        | NO       | `-`                             |
| country_name      | `varchar`          | NO       | `-`                             |
| primary_locale    | `varchar`          | NO       | `-`                             |
| fallback_locale   | `varchar`          | YES      | `-`                             |
| supported_locales | `_text`            | NO       | `'{}'::text[]`                  |
| timezone          | `varchar`          | NO       | `-`                             |
| currency          | `character`        | NO       | `-`                             |
| currency_symbol   | `varchar`          | YES      | `-`                             |
| currency_position | `varchar`          | YES      | `-`                             |
| number_format     | `varchar`          | NO       | `'1,234.56'::character varying` |
| date_format       | `varchar`          | NO       | `-`                             |
| time_format       | `varchar`          | NO       | `-`                             |
| first_day_of_week | `smallint`         | NO       | `1`                             |
| rtl_enabled       | `boolean`          | NO       | `false`                         |
| status            | `lifecycle_status` | NO       | `'active'::lifecycle_status`    |
| created_at        | `timestamptz`      | NO       | `now()`                         |
| created_by        | `uuid`             | YES      | `-`                             |
| updated_at        | `timestamptz`      | NO       | `now()`                         |
| updated_by        | `uuid`             | YES      | `-`                             |
| deleted_at        | `timestamptz`      | YES      | `-`                             |
| deleted_by        | `uuid`             | YES      | `-`                             |
| deletion_reason   | `text`             | YES      | `-`                             |

### dir_country_regulations

**Row Count:** ~3

| Column                        | Type                | Nullable | Default                       |
| ----------------------------- | ------------------- | -------- | ----------------------------- |
| country_code                  | `character`         | NO       | `-`                           |
| vehicle_max_age               | `integer`           | YES      | `-`                           |
| min_vehicle_class             | `text`              | YES      | `-`                           |
| min_fare_per_trip             | `numeric`           | YES      | `-`                           |
| min_fare_per_km               | `numeric`           | YES      | `-`                           |
| min_fare_per_hour             | `numeric`           | YES      | `-`                           |
| vat_rate                      | `numeric`           | YES      | `-`                           |
| currency                      | `character`         | NO       | `-`                           |
| timezone                      | `text`              | NO       | `-`                           |
| created_at                    | `timestamptz`       | NO       | `CURRENT_TIMESTAMP`           |
| updated_at                    | `timestamptz`       | NO       | `CURRENT_TIMESTAMP`           |
| requires_vtc_card             | `boolean`           | NO       | `false`                       |
| min_vehicle_class_id          | `uuid`              | YES      | `-`                           |
| min_vehicle_length_cm         | `integer`           | YES      | `-`                           |
| min_vehicle_width_cm          | `integer`           | YES      | `-`                           |
| min_vehicle_height_cm         | `integer`           | YES      | `-`                           |
| max_vehicle_weight_kg         | `integer`           | YES      | `-`                           |
| max_vehicle_mileage_km        | `integer`           | YES      | `-`                           |
| requires_professional_license | `boolean`           | YES      | `-`                           |
| required_documents            | `jsonb`             | YES      | `-`                           |
| effective_date                | `date`              | YES      | `-`                           |
| expiry_date                   | `date`              | YES      | `-`                           |
| status                        | `regulation_status` | NO       | `'active'::regulation_status` |
| created_by                    | `uuid`              | YES      | `-`                           |
| updated_by                    | `uuid`              | YES      | `-`                           |
| deleted_at                    | `timestamptz`       | YES      | `-`                           |
| deleted_by                    | `uuid`              | YES      | `-`                           |
| deletion_reason               | `text`              | YES      | `-`                           |

### dir_fine_types

**Row Count:** ~0

| Column       | Type          | Nullable | Default             |
| ------------ | ------------- | -------- | ------------------- |
| id           | `uuid`        | NO       | `gen_random_uuid()` |
| jurisdiction | `character`   | NO       | `-`                 |
| code         | `varchar`     | NO       | `-`                 |
| description  | `text`        | NO       | `-`                 |
| min_amount   | `numeric`     | NO       | `-`                 |
| max_amount   | `numeric`     | NO       | `-`                 |
| points       | `integer`     | YES      | `-`                 |
| is_criminal  | `boolean`     | NO       | `false`             |
| active       | `boolean`     | NO       | `true`              |
| metadata     | `jsonb`       | NO       | `'{}'::jsonb`       |
| created_at   | `timestamptz` | NO       | `now()`             |
| updated_at   | `timestamptz` | NO       | `now()`             |

### dir_maintenance_types

**Row Count:** ~0

| Column                    | Type                   | Nullable | Default             |
| ------------------------- | ---------------------- | -------- | ------------------- |
| id                        | `uuid`                 | NO       | `gen_random_uuid()` |
| tenant_id                 | `uuid`                 | NO       | `-`                 |
| code                      | `varchar`              | NO       | `-`                 |
| label                     | `varchar`              | NO       | `-`                 |
| category                  | `maintenance_category` | NO       | `-`                 |
| default_frequency_km      | `integer`              | YES      | `-`                 |
| default_frequency_months  | `integer`              | YES      | `-`                 |
| estimated_duration_hours  | `numeric`              | YES      | `-`                 |
| estimated_cost_range      | `jsonb`                | YES      | `-`                 |
| is_mandatory              | `boolean`              | YES      | `false`             |
| requires_vehicle_stoppage | `boolean`              | YES      | `true`              |
| description               | `text`                 | YES      | `-`                 |
| metadata                  | `jsonb`                | YES      | `-`                 |
| created_at                | `timestamptz`          | NO       | `now()`             |
| updated_at                | `timestamptz`          | NO       | `now()`             |
| created_by                | `uuid`                 | NO       | `-`                 |
| updated_by                | `uuid`                 | YES      | `-`                 |
| deleted_at                | `timestamptz`          | YES      | `-`                 |
| deleted_by                | `uuid`                 | YES      | `-`                 |
| deletion_reason           | `text`                 | YES      | `-`                 |

### dir_notification_templates

**Row Count:** ~13

| Column               | Type                   | Nullable | Default                      |
| -------------------- | ---------------------- | -------- | ---------------------------- |
| id                   | `uuid`                 | NO       | `gen_random_uuid()`          |
| template_code        | `varchar`              | NO       | `-`                          |
| template_name        | `varchar`              | NO       | `-`                          |
| channel              | `notification_channel` | NO       | `-`                          |
| supported_countries  | `_text`                | NO       | `'{}'::text[]`               |
| supported_locales    | `_text`                | NO       | `'{}'::text[]`               |
| subject_translations | `jsonb`                | NO       | `-`                          |
| body_translations    | `jsonb`                | NO       | `-`                          |
| variables            | `jsonb`                | YES      | `-`                          |
| status               | `lifecycle_status`     | NO       | `'active'::lifecycle_status` |
| created_at           | `timestamptz`          | NO       | `now()`                      |
| created_by           | `uuid`                 | YES      | `-`                          |
| updated_at           | `timestamptz`          | NO       | `now()`                      |
| updated_by           | `uuid`                 | YES      | `-`                          |
| deleted_at           | `timestamptz`          | YES      | `-`                          |
| deleted_by           | `uuid`                 | YES      | `-`                          |
| deletion_reason      | `text`                 | YES      | `-`                          |

### dir_ownership_types

**Row Count:** ~0

| Column                     | Type          | Nullable | Default             |
| -------------------------- | ------------- | -------- | ------------------- |
| id                         | `uuid`        | NO       | `gen_random_uuid()` |
| code                       | `varchar`     | NO       | `-`                 |
| name                       | `varchar`     | NO       | `-`                 |
| description                | `text`        | YES      | `-`                 |
| requires_owner             | `boolean`     | YES      | `false`             |
| allows_leasing             | `boolean`     | YES      | `false`             |
| depreciation               | `boolean`     | YES      | `true`              |
| maintenance_responsibility | `varchar`     | YES      | `-`                 |
| insurance_responsibility   | `varchar`     | YES      | `-`                 |
| display_order              | `integer`     | YES      | `-`                 |
| is_active                  | `boolean`     | YES      | `true`              |
| metadata                   | `jsonb`       | YES      | `-`                 |
| created_at                 | `timestamptz` | NO       | `now()`             |
| updated_at                 | `timestamptz` | NO       | `now()`             |
| created_by                 | `uuid`        | NO       | `-`                 |
| updated_by                 | `uuid`        | YES      | `-`                 |
| deleted_at                 | `timestamptz` | YES      | `-`                 |
| deleted_by                 | `uuid`        | YES      | `-`                 |
| deletion_reason            | `text`        | YES      | `-`                 |

### dir_platform_configs

**Row Count:** ~0

| Column                    | Type          | Nullable | Default              |
| ------------------------- | ------------- | -------- | -------------------- |
| id                        | `uuid`        | NO       | `uuid_generate_v4()` |
| platform_id               | `uuid`        | NO       | `-`                  |
| tenant_id                 | `uuid`        | NO       | `-`                  |
| api_base_url              | `text`        | NO       | `-`                  |
| auth_method               | `varchar`     | YES      | `-`                  |
| api_version               | `varchar`     | YES      | `-`                  |
| refresh_frequency_minutes | `integer`     | YES      | `60`                 |
| webhook_endpoints         | `jsonb`       | YES      | `-`                  |
| supported_services        | `jsonb`       | YES      | `-`                  |
| sandbox_config            | `jsonb`       | YES      | `-`                  |
| production_config         | `jsonb`       | YES      | `-`                  |
| secrets_vault_ref         | `varchar`     | YES      | `-`                  |
| is_active                 | `boolean`     | YES      | `true`               |
| created_at                | `timestamptz` | NO       | `now()`              |
| updated_at                | `timestamptz` | NO       | `now()`              |
| created_by                | `uuid`        | NO       | `-`                  |
| updated_by                | `uuid`        | YES      | `-`                  |
| deleted_at                | `timestamptz` | YES      | `-`                  |
| deleted_by                | `uuid`        | YES      | `-`                  |
| deletion_reason           | `text`        | YES      | `-`                  |

### dir_platforms

**Row Count:** ~3

| Column              | Type               | Nullable | Default                      |
| ------------------- | ------------------ | -------- | ---------------------------- |
| id                  | `uuid`             | NO       | `uuid_generate_v4()`         |
| name                | `text`             | NO       | `-`                          |
| api_config          | `jsonb`            | YES      | `-`                          |
| created_at          | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`          |
| updated_at          | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`          |
| code                | `varchar`          | NO       | `-`                          |
| description         | `text`             | YES      | `-`                          |
| logo_url            | `text`             | YES      | `-`                          |
| provider_category   | `varchar`          | YES      | `-`                          |
| supported_countries | `jsonb`            | YES      | `-`                          |
| status              | `lifecycle_status` | NO       | `'active'::lifecycle_status` |
| metadata            | `jsonb`            | YES      | `-`                          |
| created_by          | `uuid`             | YES      | `-`                          |
| updated_by          | `uuid`             | YES      | `-`                          |
| deleted_at          | `timestamptz`      | YES      | `-`                          |
| deleted_by          | `uuid`             | YES      | `-`                          |
| deletion_reason     | `text`             | YES      | `-`                          |

### dir_toll_gates

**Row Count:** ~0

| Column        | Type               | Nullable | Default                      |
| ------------- | ------------------ | -------- | ---------------------------- |
| id            | `uuid`             | NO       | `gen_random_uuid()`          |
| country_code  | `character`        | NO       | `-`                          |
| gate_code     | `varchar`          | NO       | `-`                          |
| gate_name     | `text`             | NO       | `-`                          |
| location      | `point`            | YES      | `-`                          |
| base_fee      | `numeric`          | NO       | `0`                          |
| currency      | `character`        | NO       | `-`                          |
| rate_schedule | `jsonb`            | YES      | `'{}'::jsonb`                |
| status        | `toll_gate_status` | NO       | `'active'::toll_gate_status` |
| active_from   | `date`             | YES      | `-`                          |
| active_to     | `date`             | YES      | `-`                          |
| operator      | `varchar`          | YES      | `-`                          |
| metadata      | `jsonb`            | NO       | `'{}'::jsonb`                |
| created_at    | `timestamptz`      | NO       | `now()`                      |
| updated_at    | `timestamptz`      | NO       | `now()`                      |

### dir_transaction_statuses

**Row Count:** ~0

| Column      | Type          | Nullable | Default |
| ----------- | ------------- | -------- | ------- |
| code        | `varchar`     | NO       | `-`     |
| description | `text`        | NO       | `-`     |
| created_at  | `timestamptz` | NO       | `now()` |

### dir_transaction_types

**Row Count:** ~0

| Column      | Type          | Nullable | Default |
| ----------- | ------------- | -------- | ------- |
| code        | `varchar`     | NO       | `-`     |
| description | `text`        | NO       | `-`     |
| created_at  | `timestamptz` | NO       | `now()` |

### dir_vehicle_classes

**Row Count:** ~7

| Column          | Type               | Nullable | Default                      |
| --------------- | ------------------ | -------- | ---------------------------- |
| id              | `uuid`             | NO       | `uuid_generate_v4()`         |
| country_code    | `character`        | NO       | `-`                          |
| name            | `text`             | NO       | `-`                          |
| description     | `text`             | YES      | `-`                          |
| max_age         | `integer`          | YES      | `-`                          |
| created_at      | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`          |
| updated_at      | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`          |
| code            | `varchar`          | NO       | `-`                          |
| min_length_cm   | `integer`          | YES      | `-`                          |
| max_length_cm   | `integer`          | YES      | `-`                          |
| min_width_cm    | `integer`          | YES      | `-`                          |
| max_width_cm    | `integer`          | YES      | `-`                          |
| min_height_cm   | `integer`          | YES      | `-`                          |
| max_height_cm   | `integer`          | YES      | `-`                          |
| min_seats       | `integer`          | YES      | `-`                          |
| max_seats       | `integer`          | YES      | `-`                          |
| min_age         | `integer`          | YES      | `-`                          |
| min_weight_kg   | `integer`          | YES      | `-`                          |
| max_weight_kg   | `integer`          | YES      | `-`                          |
| criteria        | `jsonb`            | YES      | `-`                          |
| status          | `lifecycle_status` | NO       | `'active'::lifecycle_status` |
| metadata        | `jsonb`            | YES      | `-`                          |
| created_by      | `uuid`             | YES      | `-`                          |
| updated_by      | `uuid`             | YES      | `-`                          |
| deleted_at      | `timestamptz`      | YES      | `-`                          |
| deleted_by      | `uuid`             | YES      | `-`                          |
| deletion_reason | `text`             | YES      | `-`                          |

### dir_vehicle_statuses

**Row Count:** ~0

| Column              | Type          | Nullable | Default             |
| ------------------- | ------------- | -------- | ------------------- |
| id                  | `uuid`        | NO       | `gen_random_uuid()` |
| code                | `varchar`     | NO       | `-`                 |
| name                | `varchar`     | NO       | `-`                 |
| description         | `text`        | YES      | `-`                 |
| color               | `varchar`     | YES      | `-`                 |
| allowed_transitions | `jsonb`       | YES      | `-`                 |
| requires_approval   | `boolean`     | YES      | `false`             |
| blocking_status     | `boolean`     | YES      | `false`             |
| automatic_actions   | `jsonb`       | YES      | `-`                 |
| notification_rules  | `jsonb`       | YES      | `-`                 |
| required_documents  | `jsonb`       | YES      | `-`                 |
| validation_rules    | `jsonb`       | YES      | `-`                 |
| display_order       | `integer`     | YES      | `-`                 |
| is_active           | `boolean`     | YES      | `true`              |
| metadata            | `jsonb`       | YES      | `-`                 |
| created_at          | `timestamptz` | NO       | `now()`             |
| updated_at          | `timestamptz` | NO       | `now()`             |
| created_by          | `uuid`        | NO       | `-`                 |
| updated_by          | `uuid`        | YES      | `-`                 |
| deleted_at          | `timestamptz` | YES      | `-`                 |
| deleted_by          | `uuid`        | YES      | `-`                 |
| deletion_reason     | `text`        | YES      | `-`                 |

## Document Module (doc\_)

### doc_document_types

**Row Count:** ~0

| Column                | Type          | Nullable | Default |
| --------------------- | ------------- | -------- | ------- |
| code                  | `varchar`     | NO       | `-`     |
| name                  | `text`        | NO       | `-`     |
| description           | `text`        | YES      | `-`     |
| requires_expiry       | `boolean`     | NO       | `false` |
| default_validity_days | `integer`     | YES      | `-`     |
| requires_verification | `boolean`     | NO       | `true`  |
| allowed_mime_types    | `_text`       | YES      | `-`     |
| max_file_size_mb      | `integer`     | YES      | `10`    |
| category              | `varchar`     | YES      | `-`     |
| is_mandatory          | `boolean`     | NO       | `false` |
| display_order         | `integer`     | NO       | `0`     |
| icon                  | `varchar`     | YES      | `-`     |
| created_at            | `timestamptz` | NO       | `now()` |
| created_by            | `uuid`        | YES      | `-`     |
| updated_at            | `timestamptz` | NO       | `now()` |
| updated_by            | `uuid`        | YES      | `-`     |
| deleted_at            | `timestamptz` | YES      | `-`     |
| deleted_by            | `uuid`        | YES      | `-`     |
| deletion_reason       | `text`        | YES      | `-`     |

### doc_document_versions

**Row Count:** ~0

| Column              | Type          | Nullable | Default              |
| ------------------- | ------------- | -------- | -------------------- |
| id                  | `uuid`        | NO       | `uuid_generate_v4()` |
| document_id         | `uuid`        | NO       | `-`                  |
| version_number      | `integer`     | NO       | `-`                  |
| storage_provider    | `varchar`     | NO       | `-`                  |
| storage_key         | `text`        | NO       | `-`                  |
| file_name           | `varchar`     | NO       | `-`                  |
| file_size           | `integer`     | NO       | `-`                  |
| mime_type           | `varchar`     | NO       | `-`                  |
| issue_date          | `date`        | YES      | `-`                  |
| expiry_date         | `date`        | YES      | `-`                  |
| verification_status | `varchar`     | NO       | `-`                  |
| verified_by         | `uuid`        | YES      | `-`                  |
| verified_at         | `timestamptz` | YES      | `-`                  |
| rejection_reason    | `text`        | YES      | `-`                  |
| metadata            | `jsonb`       | NO       | `'{}'::jsonb`        |
| created_at          | `timestamptz` | NO       | `now()`              |
| created_by          | `uuid`        | NO       | `-`                  |
| change_reason       | `text`        | YES      | `-`                  |

### doc_documents

**Row Count:** ~0

| Column                   | Type                  | Nullable | Default                          |
| ------------------------ | --------------------- | -------- | -------------------------------- |
| id                       | `uuid`                | NO       | `uuid_generate_v4()`             |
| tenant_id                | `uuid`                | NO       | `-`                              |
| entity_type              | `text`                | NO       | `-`                              |
| entity_id                | `uuid`                | NO       | `-`                              |
| document_type            | `text`                | NO       | `-`                              |
| file_url                 | `text`                | NO       | `-`                              |
| issue_date               | `date`                | YES      | `-`                              |
| expiry_date              | `date`                | YES      | `-`                              |
| verified                 | `boolean`             | NO       | `false`                          |
| created_at               | `timestamptz`         | NO       | `CURRENT_TIMESTAMP`              |
| updated_at               | `timestamptz`         | NO       | `CURRENT_TIMESTAMP`              |
| file_name                | `varchar`             | YES      | `-`                              |
| file_size                | `integer`             | YES      | `-`                              |
| mime_type                | `varchar`             | YES      | `-`                              |
| metadata                 | `jsonb`               | YES      | `'{}'::jsonb`                    |
| storage_provider         | `storage_provider`    | YES      | `'supabase'::storage_provider`   |
| storage_key              | `text`                | YES      | `-`                              |
| access_level             | `access_level`        | YES      | `'private'::access_level`        |
| verification_status      | `verification_status` | YES      | `'pending'::verification_status` |
| verified_by              | `uuid`                | YES      | `-`                              |
| verified_at              | `timestamptz`         | YES      | `-`                              |
| rejection_reason         | `text`                | YES      | `-`                              |
| status                   | `document_status`     | NO       | `'active'::document_status`      |
| expiry_notification_sent | `boolean`             | YES      | `false`                          |
| created_by               | `uuid`                | YES      | `-`                              |
| updated_by               | `uuid`                | YES      | `-`                              |
| deleted_at               | `timestamptz`         | YES      | `-`                              |
| deleted_by               | `uuid`                | YES      | `-`                              |
| deletion_reason          | `text`                | YES      | `-`                              |

### doc_entity_types

**Row Count:** ~0

| Column        | Type          | Nullable | Default       |
| ------------- | ------------- | -------- | ------------- |
| code          | `varchar`     | NO       | `-`           |
| description   | `text`        | NO       | `-`           |
| table_name    | `varchar`     | NO       | `-`           |
| is_active     | `boolean`     | NO       | `true`        |
| display_order | `integer`     | NO       | `0`           |
| metadata      | `jsonb`       | NO       | `'{}'::jsonb` |
| created_at    | `timestamptz` | NO       | `now()`       |
| created_by    | `uuid`        | YES      | `-`           |
| updated_at    | `timestamptz` | NO       | `now()`       |
| updated_by    | `uuid`        | YES      | `-`           |
| deleted_at    | `timestamptz` | YES      | `-`           |
| deleted_by    | `uuid`        | YES      | `-`           |

## Finance Module (fin\_)

### fin_account_types

**Row Count:** ~0

| Column      | Type          | Nullable | Default |
| ----------- | ------------- | -------- | ------- |
| code        | `text`        | NO       | `-`     |
| label       | `text`        | NO       | `-`     |
| description | `text`        | YES      | `-`     |
| created_at  | `timestamptz` | NO       | `now()` |
| updated_at  | `timestamptz` | NO       | `now()` |

### fin_accounts

**Row Count:** ~0

| Column               | Type             | Nullable | Default                    |
| -------------------- | ---------------- | -------- | -------------------------- |
| id                   | `uuid`           | NO       | `uuid_generate_v4()`       |
| tenant_id            | `uuid`           | NO       | `-`                        |
| account_name         | `text`           | NO       | `-`                        |
| account_type         | `text`           | NO       | `-`                        |
| currency             | `varchar`        | NO       | `-`                        |
| balance              | `numeric`        | NO       | `0`                        |
| metadata             | `jsonb`          | NO       | `'{}'::jsonb`              |
| created_at           | `timestamptz`    | NO       | `now()`                    |
| created_by           | `uuid`           | YES      | `-`                        |
| updated_at           | `timestamptz`    | NO       | `now()`                    |
| updated_by           | `uuid`           | YES      | `-`                        |
| deleted_at           | `timestamptz`    | YES      | `-`                        |
| deleted_by           | `uuid`           | YES      | `-`                        |
| deletion_reason      | `text`           | YES      | `-`                        |
| provider             | `text`           | YES      | `-`                        |
| provider_account_id  | `text`           | YES      | `-`                        |
| status               | `account_status` | NO       | `'active'::account_status` |
| opened_at            | `timestamptz`    | YES      | `-`                        |
| closed_at            | `timestamptz`    | YES      | `-`                        |
| max_balance          | `numeric`        | YES      | `-`                        |
| min_balance          | `numeric`        | YES      | `-`                        |
| account_number_last4 | `character`      | YES      | `-`                        |
| bank_name            | `text`           | YES      | `-`                        |
| iban                 | `text`           | YES      | `-`                        |
| swift_bic            | `text`           | YES      | `-`                        |
| description          | `text`           | YES      | `-`                        |

### fin_driver_payment_batches

**Row Count:** ~0

| Column            | Type                     | Nullable | Default              |
| ----------------- | ------------------------ | -------- | -------------------- |
| id                | `uuid`                   | NO       | `uuid_generate_v4()` |
| tenant_id         | `uuid`                   | NO       | `-`                  |
| batch_reference   | `text`                   | NO       | `-`                  |
| payment_date      | `date`                   | NO       | `-`                  |
| total_amount      | `numeric`                | NO       | `-`                  |
| currency          | `varchar`                | NO       | `-`                  |
| status            | `text`                   | NO       | `'pending'::text`    |
| metadata          | `jsonb`                  | NO       | `'{}'::jsonb`        |
| created_at        | `timestamptz`            | NO       | `now()`              |
| created_by        | `uuid`                   | YES      | `-`                  |
| updated_at        | `timestamptz`            | NO       | `now()`              |
| updated_by        | `uuid`                   | YES      | `-`                  |
| deleted_at        | `timestamptz`            | YES      | `-`                  |
| deleted_by        | `uuid`                   | YES      | `-`                  |
| deletion_reason   | `text`                   | YES      | `-`                  |
| period_start      | `date`                   | YES      | `-`                  |
| period_end        | `date`                   | YES      | `-`                  |
| payroll_cycle     | `payroll_cycle`          | YES      | `-`                  |
| payment_method    | `finance_payment_method` | YES      | `-`                  |
| batch_type        | `batch_type`             | YES      | `-`                  |
| payout_account_id | `uuid`                   | YES      | `-`                  |
| status_reason     | `text`                   | YES      | `-`                  |
| file_url          | `text`                   | YES      | `-`                  |
| exported_at       | `timestamptz`            | YES      | `-`                  |
| sent_at           | `timestamptz`            | YES      | `-`                  |
| processed_at      | `timestamptz`            | YES      | `-`                  |
| error_details     | `jsonb`                  | YES      | `-`                  |

### fin_driver_payments

**Row Count:** ~0

| Column                    | Type                     | Nullable | Default              |
| ------------------------- | ------------------------ | -------- | -------------------- |
| id                        | `uuid`                   | NO       | `uuid_generate_v4()` |
| tenant_id                 | `uuid`                   | NO       | `-`                  |
| driver_id                 | `uuid`                   | NO       | `-`                  |
| payment_batch_id          | `uuid`                   | NO       | `-`                  |
| amount                    | `numeric`                | NO       | `-`                  |
| currency                  | `varchar`                | NO       | `-`                  |
| payment_date              | `date`                   | NO       | `-`                  |
| status                    | `text`                   | NO       | `'pending'::text`    |
| metadata                  | `jsonb`                  | NO       | `'{}'::jsonb`        |
| created_at                | `timestamptz`            | NO       | `now()`              |
| created_by                | `uuid`                   | YES      | `-`                  |
| updated_at                | `timestamptz`            | NO       | `now()`              |
| updated_by                | `uuid`                   | YES      | `-`                  |
| deleted_at                | `timestamptz`            | YES      | `-`                  |
| deleted_by                | `uuid`                   | YES      | `-`                  |
| deletion_reason           | `text`                   | YES      | `-`                  |
| period_start              | `date`                   | YES      | `-`                  |
| period_end                | `date`                   | YES      | `-`                  |
| amount_in_tenant_currency | `numeric`                | YES      | `-`                  |
| exchange_rate             | `numeric`                | YES      | `-`                  |
| payment_method            | `finance_payment_method` | YES      | `-`                  |
| payout_account_id         | `uuid`                   | YES      | `-`                  |
| transaction_reference     | `text`                   | YES      | `-`                  |
| status_reason             | `text`                   | YES      | `-`                  |
| error_details             | `jsonb`                  | YES      | `-`                  |
| processed_at              | `timestamptz`            | YES      | `-`                  |
| failed_at                 | `timestamptz`            | YES      | `-`                  |
| cancelled_at              | `timestamptz`            | YES      | `-`                  |
| notes                     | `text`                   | YES      | `-`                  |

### fin_payment_batch_statuses

**Row Count:** ~0

| Column      | Type          | Nullable | Default |
| ----------- | ------------- | -------- | ------- |
| code        | `text`        | NO       | `-`     |
| label       | `text`        | NO       | `-`     |
| description | `text`        | YES      | `-`     |
| created_at  | `timestamptz` | NO       | `now()` |

### fin_payment_statuses

**Row Count:** ~0

| Column      | Type          | Nullable | Default |
| ----------- | ------------- | -------- | ------- |
| code        | `text`        | NO       | `-`     |
| label       | `text`        | NO       | `-`     |
| description | `text`        | YES      | `-`     |
| created_at  | `timestamptz` | NO       | `now()` |

### fin_toll_transactions

**Row Count:** ~0

| Column            | Type                      | Nullable | Default              |
| ----------------- | ------------------------- | -------- | -------------------- |
| id                | `uuid`                    | NO       | `uuid_generate_v4()` |
| tenant_id         | `uuid`                    | NO       | `-`                  |
| driver_id         | `uuid`                    | NO       | `-`                  |
| vehicle_id        | `uuid`                    | NO       | `-`                  |
| toll_gate         | `text`                    | NO       | `-`                  |
| toll_date         | `date`                    | NO       | `-`                  |
| amount            | `numeric`                 | NO       | `-`                  |
| currency          | `varchar`                 | NO       | `-`                  |
| metadata          | `jsonb`                   | NO       | `'{}'::jsonb`        |
| created_at        | `timestamptz`             | NO       | `now()`              |
| created_by        | `uuid`                    | YES      | `-`                  |
| updated_at        | `timestamptz`             | NO       | `now()`              |
| updated_by        | `uuid`                    | YES      | `-`                  |
| deleted_at        | `timestamptz`             | YES      | `-`                  |
| deleted_by        | `uuid`                    | YES      | `-`                  |
| deletion_reason   | `text`                    | YES      | `-`                  |
| toll_gate_id      | `uuid`                    | YES      | `-`                  |
| toll_timestamp    | `timestamptz`             | YES      | `-`                  |
| source            | `toll_transaction_source` | YES      | `-`                  |
| status            | `toll_transaction_status` | NO       | `-`                  |
| payment_batch_id  | `uuid`                    | YES      | `-`                  |
| driver_payment_id | `uuid`                    | YES      | `-`                  |
| trip_id           | `uuid`                    | YES      | `-`                  |

### fin_traffic_fine_disputes

**Row Count:** ~0

| Column               | Type             | Nullable | Default                     |
| -------------------- | ---------------- | -------- | --------------------------- |
| id                   | `uuid`           | NO       | `gen_random_uuid()`         |
| fine_id              | `uuid`           | NO       | `-`                         |
| submitted_by         | `uuid`           | NO       | `-`                         |
| submitted_at         | `timestamptz`    | NO       | `now()`                     |
| reason               | `text`           | NO       | `-`                         |
| supporting_documents | `jsonb`          | YES      | `-`                         |
| status               | `dispute_status` | NO       | `'pending'::dispute_status` |
| reviewed_by          | `uuid`           | YES      | `-`                         |
| resolved_at          | `timestamptz`    | YES      | `-`                         |
| resolution_notes     | `text`           | YES      | `-`                         |
| metadata             | `jsonb`          | NO       | `'{}'::jsonb`               |
| created_at           | `timestamptz`    | NO       | `now()`                     |
| updated_at           | `timestamptz`    | NO       | `now()`                     |

### fin_traffic_fines

**Row Count:** ~0

| Column            | Type          | Nullable | Default              |
| ----------------- | ------------- | -------- | -------------------- |
| id                | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id         | `uuid`        | NO       | `-`                  |
| driver_id         | `uuid`        | NO       | `-`                  |
| vehicle_id        | `uuid`        | NO       | `-`                  |
| fine_reference    | `text`        | NO       | `-`                  |
| fine_date         | `date`        | NO       | `-`                  |
| fine_type         | `text`        | NO       | `-`                  |
| amount            | `numeric`     | NO       | `-`                  |
| currency          | `varchar`     | NO       | `-`                  |
| status            | `text`        | NO       | `'pending'::text`    |
| metadata          | `jsonb`       | NO       | `'{}'::jsonb`        |
| created_at        | `timestamptz` | NO       | `now()`              |
| created_by        | `uuid`        | YES      | `-`                  |
| updated_at        | `timestamptz` | NO       | `now()`              |
| updated_by        | `uuid`        | YES      | `-`                  |
| deleted_at        | `timestamptz` | YES      | `-`                  |
| deleted_by        | `uuid`        | YES      | `-`                  |
| deletion_reason   | `text`        | YES      | `-`                  |
| fine_timestamp    | `timestamptz` | YES      | `-`                  |
| fine_type_id      | `uuid`        | YES      | `-`                  |
| location          | `point`       | YES      | `-`                  |
| address           | `text`        | YES      | `-`                  |
| points_penalty    | `integer`     | YES      | `-`                  |
| issuing_authority | `text`        | YES      | `-`                  |
| deadline_date     | `date`        | YES      | `-`                  |
| paid_at           | `timestamptz` | YES      | `-`                  |
| payment_method_id | `uuid`        | YES      | `-`                  |
| driver_payment_id | `uuid`        | YES      | `-`                  |
| dispute_id        | `uuid`        | YES      | `-`                  |

### fin_transaction_categories

**Row Count:** ~0

| Column             | Type                        | Nullable | Default             |
| ------------------ | --------------------------- | -------- | ------------------- |
| id                 | `uuid`                      | NO       | `gen_random_uuid()` |
| code               | `varchar`                   | NO       | `-`                 |
| name               | `text`                      | NO       | `-`                 |
| description        | `text`                      | YES      | `-`                 |
| category_type      | `transaction_category_type` | NO       | `-`                 |
| parent_category_id | `uuid`                      | YES      | `-`                 |
| is_active          | `boolean`                   | NO       | `true`              |
| created_at         | `timestamptz`               | NO       | `now()`             |
| updated_at         | `timestamptz`               | NO       | `now()`             |

### fin_transactions

**Row Count:** ~0

| Column                  | Type          | Nullable | Default              |
| ----------------------- | ------------- | -------- | -------------------- |
| id                      | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id               | `uuid`        | NO       | `-`                  |
| account_id              | `uuid`        | NO       | `-`                  |
| transaction_type        | `text`        | NO       | `-`                  |
| amount                  | `numeric`     | NO       | `-`                  |
| currency                | `varchar`     | NO       | `-`                  |
| reference               | `text`        | NO       | `-`                  |
| description             | `text`        | YES      | `-`                  |
| transaction_date        | `timestamptz` | NO       | `-`                  |
| status                  | `text`        | NO       | `'pending'::text`    |
| metadata                | `jsonb`       | NO       | `'{}'::jsonb`        |
| created_at              | `timestamptz` | NO       | `now()`              |
| created_by              | `uuid`        | YES      | `-`                  |
| updated_at              | `timestamptz` | NO       | `now()`              |
| updated_by              | `uuid`        | YES      | `-`                  |
| deleted_at              | `timestamptz` | YES      | `-`                  |
| deleted_by              | `uuid`        | YES      | `-`                  |
| deletion_reason         | `text`        | YES      | `-`                  |
| counterparty_account_id | `uuid`        | YES      | `-`                  |
| net_amount              | `numeric`     | YES      | `-`                  |
| tax_rate                | `numeric`     | YES      | `-`                  |
| tax_amount              | `numeric`     | YES      | `-`                  |
| exchange_rate           | `numeric`     | YES      | `-`                  |
| category_id             | `uuid`        | YES      | `-`                  |
| entity_type             | `varchar`     | YES      | `-`                  |
| entity_id               | `uuid`        | YES      | `-`                  |
| payment_method_id       | `uuid`        | YES      | `-`                  |
| source_system           | `varchar`     | YES      | `-`                  |
| validated_by            | `uuid`        | YES      | `-`                  |
| validated_at            | `timestamptz` | YES      | `-`                  |

## Fleet Module (flt\_)

### flt_vehicle_assignments

**Row Count:** ~0

| Column             | Type          | Nullable | Default                          |
| ------------------ | ------------- | -------- | -------------------------------- |
| id                 | `uuid`        | NO       | `uuid_generate_v4()`             |
| tenant_id          | `uuid`        | NO       | `-`                              |
| driver_id          | `uuid`        | NO       | `-`                              |
| vehicle_id         | `uuid`        | NO       | `-`                              |
| start_date         | `date`        | NO       | `-`                              |
| end_date           | `date`        | YES      | `-`                              |
| assignment_type    | `varchar`     | NO       | `'permanent'::character varying` |
| metadata           | `jsonb`       | NO       | `'{}'::jsonb`                    |
| status             | `varchar`     | NO       | `'active'::character varying`    |
| created_at         | `timestamptz` | NO       | `now()`                          |
| created_by         | `uuid`        | YES      | `-`                              |
| updated_at         | `timestamptz` | NO       | `now()`                          |
| updated_by         | `uuid`        | YES      | `-`                              |
| deleted_at         | `timestamptz` | YES      | `-`                              |
| deleted_by         | `uuid`        | YES      | `-`                              |
| deletion_reason    | `text`        | YES      | `-`                              |
| handover_date      | `timestamptz` | YES      | `-`                              |
| handover_location  | `text`        | YES      | `-`                              |
| handover_type      | `varchar`     | YES      | `-`                              |
| initial_odometer   | `integer`     | YES      | `-`                              |
| initial_fuel_level | `integer`     | YES      | `-`                              |
| initial_condition  | `jsonb`       | YES      | `-`                              |
| handover_photos    | `jsonb`       | YES      | `-`                              |
| photos_metadata    | `jsonb`       | YES      | `-`                              |
| driver_signature   | `text`        | YES      | `-`                              |
| fleet_signature    | `text`        | YES      | `-`                              |
| handover_checklist | `jsonb`       | YES      | `-`                              |
| return_date        | `timestamptz` | YES      | `-`                              |
| return_odometer    | `integer`     | YES      | `-`                              |
| return_fuel_level  | `integer`     | YES      | `-`                              |
| return_condition   | `jsonb`       | YES      | `-`                              |
| damages_reported   | `jsonb`       | YES      | `-`                              |
| penalty_amount     | `numeric`     | YES      | `-`                              |
| notes              | `text`        | YES      | `-`                              |

### flt_vehicle_equipments

**Row Count:** ~0

| Column                 | Type          | Nullable | Default             |
| ---------------------- | ------------- | -------- | ------------------- |
| id                     | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id              | `uuid`        | NO       | `-`                 |
| vehicle_id             | `uuid`        | NO       | `-`                 |
| equipment_type         | `varchar`     | NO       | `-`                 |
| name                   | `varchar`     | NO       | `-`                 |
| description            | `text`        | YES      | `-`                 |
| serial_number          | `varchar`     | YES      | `-`                 |
| provided_date          | `date`        | NO       | `-`                 |
| return_date            | `date`        | YES      | `-`                 |
| expiry_date            | `date`        | YES      | `-`                 |
| purchase_price         | `numeric`     | YES      | `-`                 |
| current_value          | `numeric`     | YES      | `-`                 |
| currency               | `character`   | YES      | `-`                 |
| depreciation_rate      | `numeric`     | YES      | `-`                 |
| condition_at_provision | `varchar`     | YES      | `-`                 |
| condition_at_return    | `varchar`     | YES      | `-`                 |
| damage_notes           | `text`        | YES      | `-`                 |
| status                 | `varchar`     | NO       | `-`                 |
| current_assignment_id  | `uuid`        | YES      | `-`                 |
| warranty_expiry        | `date`        | YES      | `-`                 |
| warranty_provider      | `varchar`     | YES      | `-`                 |
| last_maintenance_date  | `date`        | YES      | `-`                 |
| next_maintenance_date  | `date`        | YES      | `-`                 |
| notes                  | `text`        | YES      | `-`                 |
| metadata               | `jsonb`       | YES      | `-`                 |
| created_at             | `timestamptz` | NO       | `now()`             |
| updated_at             | `timestamptz` | NO       | `now()`             |
| created_by             | `uuid`        | NO       | `-`                 |
| updated_by             | `uuid`        | YES      | `-`                 |
| deleted_at             | `timestamptz` | YES      | `-`                 |
| deleted_by             | `uuid`        | YES      | `-`                 |

### flt_vehicle_events

**Row Count:** ~0

| Column                | Type          | Nullable | Default              |
| --------------------- | ------------- | -------- | -------------------- |
| id                    | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id             | `uuid`        | NO       | `-`                  |
| vehicle_id            | `uuid`        | NO       | `-`                  |
| event_type            | `text`        | NO       | `-`                  |
| event_date            | `timestamptz` | NO       | `-`                  |
| severity              | `text`        | YES      | `-`                  |
| downtime_hours        | `integer`     | YES      | `-`                  |
| cost_amount           | `numeric`     | YES      | `-`                  |
| currency              | `character`   | NO       | `'EUR'::bpchar`      |
| details               | `jsonb`       | NO       | `'{}'::jsonb`        |
| notes                 | `text`        | YES      | `-`                  |
| created_at            | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| created_by            | `uuid`        | YES      | `-`                  |
| updated_at            | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| updated_by            | `uuid`        | YES      | `-`                  |
| deleted_at            | `timestamptz` | YES      | `-`                  |
| deleted_by            | `uuid`        | YES      | `-`                  |
| deletion_reason       | `text`        | YES      | `-`                  |
| driver_id             | `uuid`        | YES      | `-`                  |
| ride_id               | `uuid`        | YES      | `-`                  |
| assignment_id         | `uuid`        | YES      | `-`                  |
| responsible_party     | `varchar`     | YES      | `-`                  |
| fault_percentage      | `integer`     | YES      | `-`                  |
| liability_assessment  | `jsonb`       | YES      | `-`                  |
| police_report_number  | `text`        | YES      | `-`                  |
| police_station        | `text`        | YES      | `-`                  |
| insurance_claim_id    | `uuid`        | YES      | `-`                  |
| claim_status          | `varchar`     | YES      | `-`                  |
| repair_status         | `varchar`     | YES      | `-`                  |
| repair_shop_id        | `uuid`        | YES      | `-`                  |
| estimated_repair_days | `integer`     | YES      | `-`                  |
| actual_repair_days    | `integer`     | YES      | `-`                  |
| repair_invoice_id     | `uuid`        | YES      | `-`                  |
| photos                | `jsonb`       | YES      | `-`                  |

### flt_vehicle_expenses

**Row Count:** ~0

| Column                 | Type          | Nullable | Default              |
| ---------------------- | ------------- | -------- | -------------------- |
| id                     | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id              | `uuid`        | NO       | `-`                  |
| vehicle_id             | `uuid`        | NO       | `-`                  |
| driver_id              | `uuid`        | YES      | `-`                  |
| ride_id                | `uuid`        | YES      | `-`                  |
| expense_date           | `date`        | NO       | `-`                  |
| expense_category       | `text`        | NO       | `-`                  |
| amount                 | `numeric`     | NO       | `-`                  |
| currency               | `character`   | NO       | `'EUR'::bpchar`      |
| payment_method         | `text`        | YES      | `-`                  |
| receipt_url            | `text`        | YES      | `-`                  |
| odometer_reading       | `integer`     | YES      | `-`                  |
| quantity               | `numeric`     | YES      | `-`                  |
| unit_price             | `numeric`     | YES      | `-`                  |
| location               | `text`        | YES      | `-`                  |
| vendor                 | `text`        | YES      | `-`                  |
| description            | `text`        | YES      | `-`                  |
| reimbursed             | `boolean`     | NO       | `false`              |
| reimbursed_at          | `timestamptz` | YES      | `-`                  |
| reimbursed_in_batch_id | `uuid`        | YES      | `-`                  |
| notes                  | `text`        | YES      | `-`                  |
| metadata               | `jsonb`       | NO       | `'{}'::jsonb`        |
| created_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| created_by             | `uuid`        | YES      | `-`                  |
| updated_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| updated_by             | `uuid`        | YES      | `-`                  |
| deleted_at             | `timestamptz` | YES      | `-`                  |
| deleted_by             | `uuid`        | YES      | `-`                  |
| deletion_reason        | `text`        | YES      | `-`                  |
| expense_subcategory    | `varchar`     | YES      | `-`                  |
| period_start           | `date`        | YES      | `-`                  |
| period_end             | `date`        | YES      | `-`                  |
| mileage_start          | `integer`     | YES      | `-`                  |
| mileage_end            | `integer`     | YES      | `-`                  |
| trip_ids               | `_uuid`       | YES      | `-`                  |
| requires_approval      | `boolean`     | YES      | `true`               |
| approval_threshold     | `numeric`     | YES      | `-`                  |
| approval_status        | `varchar`     | YES      | `-`                  |
| approved_by            | `uuid`        | YES      | `-`                  |
| approved_at            | `timestamptz` | YES      | `-`                  |
| rejection_reason       | `text`        | YES      | `-`                  |
| receipt_status         | `varchar`     | YES      | `-`                  |
| receipt_verified_by    | `uuid`        | YES      | `-`                  |
| receipt_verified_at    | `timestamptz` | YES      | `-`                  |
| receipt_issues         | `jsonb`       | YES      | `-`                  |
| ocr_extracted_data     | `jsonb`       | YES      | `-`                  |
| allocation_rule        | `varchar`     | YES      | `-`                  |
| driver_share_percent   | `integer`     | YES      | `-`                  |
| fleet_share_percent    | `integer`     | YES      | `-`                  |
| client_share_percent   | `integer`     | YES      | `-`                  |
| cost_center_id         | `uuid`        | YES      | `-`                  |
| payment_batch_id       | `uuid`        | YES      | `-`                  |
| payment_status         | `varchar`     | YES      | `-`                  |
| payment_date           | `date`        | YES      | `-`                  |
| payment_reference      | `text`        | YES      | `-`                  |

### flt_vehicle_inspections

**Row Count:** ~1

| Column               | Type          | Nullable | Default             |
| -------------------- | ------------- | -------- | ------------------- |
| id                   | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id            | `uuid`        | NO       | `-`                 |
| vehicle_id           | `uuid`        | NO       | `-`                 |
| inspection_type      | `varchar`     | NO       | `-`                 |
| scheduled_date       | `date`        | NO       | `-`                 |
| actual_date          | `date`        | YES      | `-`                 |
| status               | `varchar`     | NO       | `-`                 |
| passed               | `boolean`     | YES      | `false`             |
| score                | `integer`     | YES      | `-`                 |
| inspector_name       | `varchar`     | YES      | `-`                 |
| inspection_center    | `varchar`     | YES      | `-`                 |
| certificate_number   | `varchar`     | YES      | `-`                 |
| expiry_date          | `date`        | YES      | `-`                 |
| issues_found         | `jsonb`       | YES      | `-`                 |
| corrective_actions   | `jsonb`       | YES      | `-`                 |
| report_url           | `text`        | YES      | `-`                 |
| certificate_url      | `text`        | YES      | `-`                 |
| photos_urls          | `jsonb`       | YES      | `-`                 |
| cost_amount          | `numeric`     | YES      | `-`                 |
| currency             | `character`   | YES      | `-`                 |
| next_inspection_date | `date`        | YES      | `-`                 |
| reminder_sent        | `boolean`     | YES      | `false`             |
| notes                | `text`        | YES      | `-`                 |
| metadata             | `jsonb`       | YES      | `-`                 |
| created_at           | `timestamptz` | YES      | `now()`             |
| updated_at           | `timestamptz` | YES      | `now()`             |
| created_by           | `uuid`        | NO       | `-`                 |
| updated_by           | `uuid`        | YES      | `-`                 |

### flt_vehicle_insurances

**Row Count:** ~1

| Column               | Type          | Nullable | Default                       |
| -------------------- | ------------- | -------- | ----------------------------- |
| id                   | `uuid`        | NO       | `uuid_generate_v4()`          |
| tenant_id            | `uuid`        | NO       | `-`                           |
| vehicle_id           | `uuid`        | NO       | `-`                           |
| provider_name        | `text`        | NO       | `-`                           |
| policy_number        | `text`        | NO       | `-`                           |
| policy_type          | `text`        | NO       | `-`                           |
| coverage_amount      | `numeric`     | YES      | `-`                           |
| currency             | `character`   | NO       | `'EUR'::bpchar`               |
| deductible_amount    | `numeric`     | YES      | `-`                           |
| premium_amount       | `numeric`     | NO       | `-`                           |
| premium_frequency    | `text`        | NO       | `'annual'::character varying` |
| start_date           | `date`        | NO       | `-`                           |
| end_date             | `date`        | NO       | `-`                           |
| is_active            | `boolean`     | NO       | `true`                        |
| auto_renew           | `boolean`     | NO       | `false`                       |
| contact_name         | `text`        | YES      | `-`                           |
| contact_phone        | `text`        | YES      | `-`                           |
| contact_email        | `text`        | YES      | `-`                           |
| document_url         | `text`        | YES      | `-`                           |
| claim_count          | `integer`     | NO       | `0`                           |
| last_claim_date      | `date`        | YES      | `-`                           |
| notes                | `text`        | YES      | `-`                           |
| metadata             | `jsonb`       | NO       | `'{}'::jsonb`                 |
| created_at           | `timestamptz` | NO       | `CURRENT_TIMESTAMP`           |
| created_by           | `uuid`        | YES      | `-`                           |
| updated_at           | `timestamptz` | NO       | `CURRENT_TIMESTAMP`           |
| updated_by           | `uuid`        | YES      | `-`                           |
| deleted_at           | `timestamptz` | YES      | `-`                           |
| deleted_by           | `uuid`        | YES      | `-`                           |
| deletion_reason      | `text`        | YES      | `-`                           |
| policy_category      | `varchar`     | YES      | `-`                           |
| policy_priority      | `integer`     | YES      | `-`                           |
| parent_policy_id     | `uuid`        | YES      | `-`                           |
| coverage_territories | `_text`       | YES      | `-`                           |
| coverage_drivers     | `varchar`     | YES      | `-`                           |
| driver_restrictions  | `jsonb`       | YES      | `-`                           |
| vehicle_usage        | `varchar`     | YES      | `-`                           |
| base_premium         | `numeric`     | YES      | `-`                           |
| excess_details       | `jsonb`       | YES      | `-`                           |
| no_claims_years      | `integer`     | YES      | `0`                           |
| no_claims_bonus      | `integer`     | YES      | `0`                           |
| claims_loading       | `integer`     | YES      | `0`                           |
| claims_count         | `integer`     | YES      | `0`                           |
| claims_detail        | `jsonb`       | YES      | `-`                           |
| total_claims_amount  | `numeric`     | YES      | `-`                           |
| claims_ratio         | `numeric`     | YES      | `-`                           |
| risk_rating          | `varchar`     | YES      | `-`                           |
| risk_factors         | `jsonb`       | YES      | `-`                           |
| special_conditions   | `jsonb`       | YES      | `-`                           |
| exclusions           | `jsonb`       | YES      | `-`                           |
| broker_id            | `uuid`        | YES      | `-`                           |
| broker_commission    | `numeric`     | YES      | `-`                           |
| broker_reference     | `text`        | YES      | `-`                           |
| renewal_date         | `date`        | YES      | `-`                           |
| renewal_notice_sent  | `boolean`     | YES      | `false`                       |
| renewal_quote        | `numeric`     | YES      | `-`                           |
| competitor_quotes    | `jsonb`       | YES      | `-`                           |
| payment_frequency    | `varchar`     | YES      | `-`                           |
| payment_method       | `varchar`     | YES      | `-`                           |
| payment_schedule     | `jsonb`       | YES      | `-`                           |
| next_payment_date    | `date`        | YES      | `-`                           |
| outstanding_amount   | `numeric`     | YES      | `-`                           |
| co_insurance         | `boolean`     | YES      | `false`                       |
| co_insurers          | `jsonb`       | YES      | `-`                           |
| lead_insurer         | `varchar`     | YES      | `-`                           |

### flt_vehicle_maintenance

**Row Count:** ~1

| Column                 | Type          | Nullable | Default                          |
| ---------------------- | ------------- | -------- | -------------------------------- |
| id                     | `uuid`        | NO       | `uuid_generate_v4()`             |
| tenant_id              | `uuid`        | NO       | `-`                              |
| vehicle_id             | `uuid`        | NO       | `-`                              |
| maintenance_type       | `text`        | NO       | `-`                              |
| scheduled_date         | `date`        | NO       | `-`                              |
| completed_date         | `date`        | YES      | `-`                              |
| odometer_reading       | `integer`     | YES      | `-`                              |
| next_service_km        | `integer`     | YES      | `-`                              |
| next_service_date      | `date`        | YES      | `-`                              |
| provider_name          | `text`        | YES      | `-`                              |
| provider_contact       | `text`        | YES      | `-`                              |
| cost_amount            | `numeric`     | YES      | `-`                              |
| currency               | `character`   | NO       | `'EUR'::bpchar`                  |
| invoice_reference      | `text`        | YES      | `-`                              |
| parts_replaced         | `text`        | YES      | `-`                              |
| notes                  | `text`        | YES      | `-`                              |
| status                 | `text`        | NO       | `'scheduled'::character varying` |
| metadata               | `jsonb`       | NO       | `'{}'::jsonb`                    |
| created_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`              |
| created_by             | `uuid`        | YES      | `-`                              |
| updated_at             | `timestamptz` | NO       | `CURRENT_TIMESTAMP`              |
| updated_by             | `uuid`        | YES      | `-`                              |
| actual_start           | `timestamptz` | YES      | `-`                              |
| actual_end             | `timestamptz` | YES      | `-`                              |
| maintenance_category   | `varchar`     | YES      | `-`                              |
| priority               | `varchar`     | YES      | `-`                              |
| regulatory_requirement | `boolean`     | YES      | `false`                          |
| blocking_vehicle       | `boolean`     | YES      | `false`                          |
| warranty_covered       | `boolean`     | YES      | `false`                          |
| warranty_claim_number  | `text`        | YES      | `-`                              |
| warranty_amount        | `numeric`     | YES      | `-`                              |
| insurance_covered      | `boolean`     | YES      | `false`                          |
| insurance_claim_ref    | `text`        | YES      | `-`                              |
| requested_by           | `uuid`        | YES      | `-`                              |
| requested_at           | `timestamptz` | YES      | `-`                              |
| approved_by            | `uuid`        | YES      | `-`                              |
| approved_at            | `timestamptz` | YES      | `-`                              |
| approval_notes         | `text`        | YES      | `-`                              |
| labor_hours            | `numeric`     | YES      | `-`                              |
| labor_rate             | `numeric`     | YES      | `-`                              |
| labor_cost             | `numeric`     | YES      | `-`                              |
| parts_cost             | `numeric`     | YES      | `-`                              |
| other_costs            | `numeric`     | YES      | `-`                              |
| tax_amount             | `numeric`     | YES      | `-`                              |
| total_cost_excl_tax    | `numeric`     | YES      | `-`                              |
| total_cost_incl_tax    | `numeric`     | YES      | `-`                              |
| parts_detail           | `jsonb`       | YES      | `-`                              |
| garage_id              | `uuid`        | YES      | `-`                              |
| work_order_number      | `text`        | YES      | `-`                              |
| mechanic_name          | `text`        | YES      | `-`                              |
| mechanic_certification | `text`        | YES      | `-`                              |
| quality_check_by       | `uuid`        | YES      | `-`                              |
| quality_check_at       | `timestamptz` | YES      | `-`                              |
| blocked_periods        | `jsonb`       | YES      | `-`                              |
| deleted_at             | `timestamptz` | YES      | `-`                              |
| deleted_by             | `uuid`        | YES      | `-`                              |
| deletion_reason        | `text`        | YES      | `-`                              |

### flt_vehicles

**Row Count:** ~1

| Column                        | Type          | Nullable | Default                        |
| ----------------------------- | ------------- | -------- | ------------------------------ |
| id                            | `uuid`        | NO       | `uuid_generate_v4()`           |
| tenant_id                     | `uuid`        | NO       | `-`                            |
| make_id                       | `uuid`        | NO       | `-`                            |
| model_id                      | `uuid`        | NO       | `-`                            |
| license_plate                 | `text`        | NO       | `-`                            |
| vin                           | `text`        | YES      | `-`                            |
| year                          | `integer`     | NO       | `-`                            |
| color                         | `text`        | YES      | `-`                            |
| seats                         | `integer`     | NO       | `4`                            |
| vehicle_class                 | `text`        | YES      | `-`                            |
| fuel_type                     | `text`        | YES      | `-`                            |
| transmission                  | `text`        | YES      | `-`                            |
| registration_date             | `date`        | YES      | `-`                            |
| insurance_number              | `text`        | YES      | `-`                            |
| insurance_expiry              | `date`        | YES      | `-`                            |
| last_inspection               | `date`        | YES      | `-`                            |
| next_inspection               | `date`        | YES      | `-`                            |
| odometer                      | `integer`     | YES      | `-`                            |
| ownership_type                | `text`        | NO       | `'owned'::character varying`   |
| metadata                      | `jsonb`       | NO       | `'{}'::jsonb`                  |
| status                        | `text`        | NO       | `'pending'::character varying` |
| created_at                    | `timestamptz` | NO       | `CURRENT_TIMESTAMP`            |
| created_by                    | `uuid`        | YES      | `-`                            |
| updated_at                    | `timestamptz` | NO       | `CURRENT_TIMESTAMP`            |
| updated_by                    | `uuid`        | YES      | `-`                            |
| deleted_at                    | `timestamptz` | YES      | `-`                            |
| deleted_by                    | `uuid`        | YES      | `-`                            |
| deletion_reason               | `text`        | YES      | `-`                            |
| country_code                  | `character`   | YES      | `-`                            |
| requires_professional_license | `boolean`     | YES      | `false`                        |
| documents_status              | `jsonb`       | YES      | `-`                            |
| body_type                     | `varchar`     | YES      | `-`                            |
| passenger_capacity            | `integer`     | YES      | `-`                            |
| car_length_cm                 | `integer`     | YES      | `-`                            |
| car_width_cm                  | `integer`     | YES      | `-`                            |
| car_height_cm                 | `integer`     | YES      | `-`                            |
| vehicle_class_id              | `uuid`        | YES      | `-`                            |
| first_registration_date       | `date`        | YES      | `-`                            |
| warranty_expiry               | `date`        | YES      | `-`                            |
| service_interval_km           | `integer`     | YES      | `-`                            |
| next_service_at_km            | `integer`     | YES      | `-`                            |
| insurance_policy_number       | `text`        | YES      | `-`                            |
| insurance_coverage_type       | `text`        | YES      | `-`                            |
| insurance_amount              | `numeric`     | YES      | `-`                            |
| insurance_issue_date          | `date`        | YES      | `-`                            |
| ownership_type_id             | `uuid`        | YES      | `-`                            |
| owner_id                      | `uuid`        | YES      | `-`                            |
| acquisition_date              | `date`        | YES      | `-`                            |
| lease_end_date                | `date`        | YES      | `-`                            |
| residual_value                | `numeric`     | YES      | `-`                            |
| status_id                     | `uuid`        | YES      | `-`                            |
| status_changed_at             | `timestamptz` | YES      | `-`                            |

## Revenue Module (rev\_)

### rev_driver_revenues

**Row Count:** ~0

| Column            | Type                         | Nullable | Default                            |
| ----------------- | ---------------------------- | -------- | ---------------------------------- |
| id                | `uuid`                       | NO       | `uuid_generate_v4()`               |
| tenant_id         | `uuid`                       | NO       | `-`                                |
| driver_id         | `uuid`                       | NO       | `-`                                |
| period_start      | `date`                       | NO       | `-`                                |
| period_end        | `date`                       | NO       | `-`                                |
| total_revenue     | `numeric`                    | NO       | `0`                                |
| commission_amount | `numeric`                    | NO       | `0`                                |
| net_revenue       | `numeric`                    | NO       | `0`                                |
| metadata          | `jsonb`                      | NO       | `'{}'::jsonb`                      |
| created_at        | `timestamptz`                | NO       | `now()`                            |
| created_by        | `uuid`                       | YES      | `-`                                |
| updated_at        | `timestamptz`                | NO       | `now()`                            |
| updated_by        | `uuid`                       | YES      | `-`                                |
| deleted_at        | `timestamptz`                | YES      | `-`                                |
| deleted_by        | `uuid`                       | YES      | `-`                                |
| deletion_reason   | `text`                       | YES      | `-`                                |
| platform_id       | `uuid`                       | YES      | `-`                                |
| period_type       | `driver_revenue_period_type` | YES      | `-`                                |
| currency          | `character`                  | YES      | `-`                                |
| import_id         | `uuid`                       | YES      | `-`                                |
| status            | `driver_revenue_status`      | NO       | `'pending'::driver_revenue_status` |
| validated_by      | `uuid`                       | YES      | `-`                                |
| validated_at      | `timestamptz`                | YES      | `-`                                |
| adjustment_reason | `text`                       | YES      | `-`                                |

### rev_reconciliation_lines

**Row Count:** ~0

| Column            | Type      | Nullable | Default             |
| ----------------- | --------- | -------- | ------------------- |
| id                | `uuid`    | NO       | `gen_random_uuid()` |
| reconciliation_id | `uuid`    | NO       | `-`                 |
| driver_id         | `uuid`    | YES      | `-`                 |
| platform_id       | `uuid`    | YES      | `-`                 |
| expected_amount   | `numeric` | NO       | `-`                 |
| received_amount   | `numeric` | NO       | `-`                 |
| notes             | `text`    | YES      | `-`                 |
| metadata          | `jsonb`   | YES      | `'{}'::jsonb`       |

### rev_reconciliations

**Row Count:** ~0

| Column              | Type                  | Nullable | Default              |
| ------------------- | --------------------- | -------- | -------------------- |
| id                  | `uuid`                | NO       | `uuid_generate_v4()` |
| tenant_id           | `uuid`                | NO       | `-`                  |
| import_id           | `uuid`                | NO       | `-`                  |
| reconciliation_date | `date`                | NO       | `-`                  |
| status              | `text`                | NO       | `'pending'::text`    |
| notes               | `text`                | YES      | `-`                  |
| metadata            | `jsonb`               | NO       | `'{}'::jsonb`        |
| created_at          | `timestamptz`         | NO       | `now()`              |
| created_by          | `uuid`                | YES      | `-`                  |
| updated_at          | `timestamptz`         | NO       | `now()`              |
| updated_by          | `uuid`                | YES      | `-`                  |
| deleted_at          | `timestamptz`         | YES      | `-`                  |
| deleted_by          | `uuid`                | YES      | `-`                  |
| deletion_reason     | `text`                | YES      | `-`                  |
| reconciliation_type | `reconciliation_type` | YES      | `-`                  |
| expected_amount     | `numeric`             | YES      | `-`                  |
| received_amount     | `numeric`             | YES      | `-`                  |
| tolerance_amount    | `numeric`             | YES      | `-`                  |
| currency            | `character`           | YES      | `-`                  |
| auto_matched        | `boolean`             | YES      | `false`              |
| assigned_to         | `uuid`                | YES      | `-`                  |
| resolved_at         | `timestamptz`         | YES      | `-`                  |
| resolved_by         | `uuid`                | YES      | `-`                  |
| resolution_notes    | `text`                | YES      | `-`                  |
| requires_action     | `boolean`             | YES      | `false`              |
| driver_id           | `uuid`                | YES      | `-`                  |

### rev_revenue_imports

**Row Count:** ~0

| Column                  | Type                         | Nullable | Default              |
| ----------------------- | ---------------------------- | -------- | -------------------- |
| id                      | `uuid`                       | NO       | `uuid_generate_v4()` |
| tenant_id               | `uuid`                       | NO       | `-`                  |
| import_reference        | `text`                       | NO       | `-`                  |
| import_date             | `date`                       | NO       | `-`                  |
| status                  | `text`                       | NO       | `'pending'::text`    |
| total_revenue           | `numeric`                    | NO       | `0`                  |
| currency                | `varchar`                    | NO       | `-`                  |
| metadata                | `jsonb`                      | NO       | `'{}'::jsonb`        |
| created_at              | `timestamptz`                | NO       | `now()`              |
| created_by              | `uuid`                       | YES      | `-`                  |
| updated_at              | `timestamptz`                | NO       | `now()`              |
| updated_by              | `uuid`                       | YES      | `-`                  |
| deleted_at              | `timestamptz`                | YES      | `-`                  |
| deleted_by              | `uuid`                       | YES      | `-`                  |
| deletion_reason         | `text`                       | YES      | `-`                  |
| platform_id             | `uuid`                       | YES      | `-`                  |
| source_type             | `revenue_import_source_type` | YES      | `-`                  |
| file_url                | `text`                       | YES      | `-`                  |
| source_currency         | `character`                  | YES      | `-`                  |
| exchange_rate           | `numeric`                    | YES      | `-`                  |
| converted_amount        | `numeric`                    | YES      | `-`                  |
| rows_count              | `integer`                    | YES      | `0`                  |
| errors_count            | `integer`                    | YES      | `0`                  |
| warnings_count          | `integer`                    | YES      | `0`                  |
| processing_started_at   | `timestamptz`                | YES      | `-`                  |
| processing_completed_at | `timestamptz`                | YES      | `-`                  |
| status_reason           | `text`                       | YES      | `-`                  |
| retry_count             | `integer`                    | YES      | `0`                  |
| last_error              | `text`                       | YES      | `-`                  |

## Rider/Driver Module (rid\_)

### rid_driver_blacklists

**Row Count:** ~0

| Column                      | Type                 | Nullable | Default                           |
| --------------------------- | -------------------- | -------- | --------------------------------- |
| id                          | `uuid`               | NO       | `uuid_generate_v4()`              |
| tenant_id                   | `uuid`               | NO       | `-`                               |
| driver_id                   | `uuid`               | NO       | `-`                               |
| reason                      | `text`               | NO       | `-`                               |
| start_date                  | `timestamptz`        | NO       | `-`                               |
| end_date                    | `timestamptz`        | YES      | `-`                               |
| metadata                    | `jsonb`              | NO       | `'{}'::jsonb`                     |
| created_at                  | `timestamptz`        | NO       | `now()`                           |
| created_by                  | `uuid`               | YES      | `-`                               |
| updated_at                  | `timestamptz`        | NO       | `now()`                           |
| updated_by                  | `uuid`               | YES      | `-`                               |
| deleted_at                  | `timestamptz`        | YES      | `-`                               |
| deleted_by                  | `uuid`               | YES      | `-`                               |
| deletion_reason             | `text`               | YES      | `-`                               |
| category                    | `blacklist_category` | YES      | `-`                               |
| severity                    | `blacklist_severity` | YES      | `-`                               |
| status                      | `blacklist_status`   | YES      | `'active'::blacklist_status`      |
| incident_date               | `timestamptz`        | YES      | `-`                               |
| incident_location           | `text`               | YES      | `-`                               |
| incident_description        | `text`               | YES      | `-`                               |
| evidence_documents          | `jsonb`              | YES      | `'[]'::jsonb`                     |
| decided_by                  | `uuid`               | YES      | `-`                               |
| decided_at                  | `timestamptz`        | YES      | `-`                               |
| decision_notes              | `text`               | YES      | `-`                               |
| decision_reviewed           | `boolean`            | YES      | `false`                           |
| reviewed_by                 | `uuid`               | YES      | `-`                               |
| reviewed_at                 | `timestamptz`        | YES      | `-`                               |
| appeal_status               | `appeal_status`      | YES      | `'not_applicable'::appeal_status` |
| appeal_submitted_at         | `timestamptz`        | YES      | `-`                               |
| appeal_reason               | `text`               | YES      | `-`                               |
| appeal_reviewed_at          | `timestamptz`        | YES      | `-`                               |
| appeal_reviewed_by          | `uuid`               | YES      | `-`                               |
| appeal_decision             | `text`               | YES      | `-`                               |
| appeal_outcome              | `varchar`            | YES      | `-`                               |
| legal_review_required       | `boolean`            | YES      | `false`                           |
| legal_reviewed_at           | `timestamptz`        | YES      | `-`                               |
| legal_reviewed_by           | `uuid`               | YES      | `-`                               |
| legal_case_number           | `varchar`            | YES      | `-`                               |
| legal_notes                 | `text`               | YES      | `-`                               |
| reinstatement_conditions    | `text`               | YES      | `-`                               |
| reinstatement_eligible_date | `date`               | YES      | `-`                               |
| reinstated_at               | `timestamptz`        | YES      | `-`                               |
| reinstated_by               | `uuid`               | YES      | `-`                               |
| driver_notified_at          | `timestamptz`        | YES      | `-`                               |
| notification_method         | `varchar`            | YES      | `-`                               |
| acknowledgment_received     | `boolean`            | YES      | `false`                           |
| acknowledgment_date         | `timestamptz`        | YES      | `-`                               |

### rid_driver_cooperation_terms

**Row Count:** ~0

| Column                     | Type                 | Nullable | Default                         |
| -------------------------- | -------------------- | -------- | ------------------------------- |
| id                         | `uuid`               | NO       | `uuid_generate_v4()`            |
| tenant_id                  | `uuid`               | NO       | `-`                             |
| driver_id                  | `uuid`               | NO       | `-`                             |
| terms_version              | `text`               | NO       | `-`                             |
| accepted_at                | `timestamptz`        | YES      | `-`                             |
| effective_date             | `date`               | YES      | `-`                             |
| expiry_date                | `date`               | YES      | `-`                             |
| metadata                   | `jsonb`              | NO       | `'{}'::jsonb`                   |
| created_at                 | `timestamptz`        | NO       | `now()`                         |
| created_by                 | `uuid`               | YES      | `-`                             |
| updated_at                 | `timestamptz`        | NO       | `now()`                         |
| updated_by                 | `uuid`               | YES      | `-`                             |
| deleted_at                 | `timestamptz`        | YES      | `-`                             |
| deleted_by                 | `uuid`               | YES      | `-`                             |
| deletion_reason            | `text`               | YES      | `-`                             |
| status                     | `cooperation_status` | YES      | `'pending'::cooperation_status` |
| compensation_model         | `compensation_model` | YES      | `-`                             |
| fixed_rental_amount        | `numeric`            | YES      | `-`                             |
| percentage_split_company   | `numeric`            | YES      | `-`                             |
| percentage_split_driver    | `numeric`            | YES      | `-`                             |
| salary_amount              | `numeric`            | YES      | `-`                             |
| crew_rental_terms          | `text`               | YES      | `-`                             |
| buyout_amount              | `numeric`            | YES      | `-`                             |
| custom_terms               | `text`               | YES      | `-`                             |
| signature_method           | `signature_method`   | YES      | `-`                             |
| signature_data             | `jsonb`              | YES      | `-`                             |
| signature_ip               | `varchar`            | YES      | `-`                             |
| signature_timestamp        | `timestamptz`        | YES      | `-`                             |
| digital_signature_verified | `boolean`            | YES      | `false`                         |
| previous_version_id        | `uuid`               | YES      | `-`                             |
| version_change_reason      | `text`               | YES      | `-`                             |
| legal_review_required      | `boolean`            | YES      | `false`                         |
| legal_reviewed_at          | `timestamptz`        | YES      | `-`                             |
| legal_reviewed_by          | `uuid`               | YES      | `-`                             |
| legal_review_notes         | `text`               | YES      | `-`                             |
| auto_renewal               | `boolean`            | YES      | `false`                         |
| auto_renewal_notice_days   | `integer`            | YES      | `30`                            |
| renewal_reminder_sent_at   | `timestamptz`        | YES      | `-`                             |
| termination_date           | `timestamptz`        | YES      | `-`                             |
| termination_reason         | `text`               | YES      | `-`                             |
| termination_initiated_by   | `uuid`               | YES      | `-`                             |
| early_termination_penalty  | `numeric`            | YES      | `-`                             |

### rid_driver_documents

**Row Count:** ~0

| Column                 | Type                           | Nullable | Default                                   |
| ---------------------- | ------------------------------ | -------- | ----------------------------------------- |
| id                     | `uuid`                         | NO       | `uuid_generate_v4()`                      |
| tenant_id              | `uuid`                         | NO       | `-`                                       |
| driver_id              | `uuid`                         | NO       | `-`                                       |
| document_id            | `uuid`                         | NO       | `-`                                       |
| expiry_date            | `date`                         | YES      | `-`                                       |
| verified               | `boolean`                      | NO       | `false`                                   |
| verified_by            | `uuid`                         | YES      | `-`                                       |
| verified_at            | `timestamptz`                  | YES      | `-`                                       |
| created_at             | `timestamptz`                  | NO       | `now()`                                   |
| created_by             | `uuid`                         | YES      | `-`                                       |
| updated_at             | `timestamptz`                  | NO       | `now()`                                   |
| updated_by             | `uuid`                         | YES      | `-`                                       |
| deleted_at             | `timestamptz`                  | YES      | `-`                                       |
| deleted_by             | `uuid`                         | YES      | `-`                                       |
| deletion_reason        | `text`                         | YES      | `-`                                       |
| document_type          | `driver_document_type`         | YES      | `-`                                       |
| requires_renewal       | `boolean`                      | YES      | `true`                                    |
| renewal_frequency_days | `integer`                      | YES      | `-`                                       |
| reminder_sent_at       | `timestamptz`                  | YES      | `-`                                       |
| reminder_days_before   | `integer`                      | YES      | `30`                                      |
| verification_status    | `document_verification_status` | YES      | `'pending'::document_verification_status` |
| rejection_reason       | `text`                         | YES      | `-`                                       |
| verification_method    | `varchar`                      | YES      | `-`                                       |
| document_number        | `varchar`                      | YES      | `-`                                       |
| issuing_authority      | `varchar`                      | YES      | `-`                                       |
| issuing_country        | `character`                    | YES      | `-`                                       |
| issue_date             | `date`                         | YES      | `-`                                       |
| replaced_document_id   | `uuid`                         | YES      | `-`                                       |
| replacement_reason     | `text`                         | YES      | `-`                                       |
| ocr_data               | `jsonb`                        | YES      | `-`                                       |
| confidence_score       | `numeric`                      | YES      | `-`                                       |

### rid_driver_languages

**Row Count:** ~1

| Column          | Type          | Nullable | Default              |
| --------------- | ------------- | -------- | -------------------- |
| id              | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id       | `uuid`        | NO       | `-`                  |
| driver_id       | `uuid`        | NO       | `-`                  |
| language_code   | `character`   | NO       | `-`                  |
| proficiency     | `text`        | YES      | `-`                  |
| created_at      | `timestamptz` | NO       | `now()`              |
| created_by      | `uuid`        | YES      | `-`                  |
| updated_at      | `timestamptz` | NO       | `now()`              |
| updated_by      | `uuid`        | YES      | `-`                  |
| deleted_at      | `timestamptz` | YES      | `-`                  |
| deleted_by      | `uuid`        | YES      | `-`                  |
| deletion_reason | `text`        | YES      | `-`                  |

### rid_driver_performances

**Row Count:** ~0

| Column                    | Type          | Nullable | Default              |
| ------------------------- | ------------- | -------- | -------------------- |
| id                        | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id                 | `uuid`        | NO       | `-`                  |
| driver_id                 | `uuid`        | NO       | `-`                  |
| period_start              | `date`        | NO       | `-`                  |
| period_end                | `date`        | NO       | `-`                  |
| trips_completed           | `integer`     | NO       | `0`                  |
| trips_cancelled           | `integer`     | NO       | `0`                  |
| on_time_rate              | `numeric`     | YES      | `-`                  |
| avg_rating                | `numeric`     | YES      | `-`                  |
| incidents_count           | `integer`     | NO       | `0`                  |
| earnings_total            | `numeric`     | NO       | `0`                  |
| hours_online              | `numeric`     | YES      | `-`                  |
| metadata                  | `jsonb`       | NO       | `'{}'::jsonb`        |
| created_at                | `timestamptz` | NO       | `now()`              |
| created_by                | `uuid`        | YES      | `-`                  |
| updated_at                | `timestamptz` | NO       | `now()`              |
| updated_by                | `uuid`        | YES      | `-`                  |
| deleted_at                | `timestamptz` | YES      | `-`                  |
| deleted_by                | `uuid`        | YES      | `-`                  |
| deletion_reason           | `text`        | YES      | `-`                  |
| platform_id               | `uuid`        | YES      | `-`                  |
| platform_trips_completed  | `integer`     | YES      | `0`                  |
| platform_earnings         | `numeric`     | YES      | `0`                  |
| cash_trips                | `integer`     | YES      | `0`                  |
| cash_earnings             | `numeric`     | YES      | `0`                  |
| card_trips                | `integer`     | YES      | `0`                  |
| card_earnings             | `numeric`     | YES      | `0`                  |
| wallet_trips              | `integer`     | YES      | `0`                  |
| wallet_earnings           | `numeric`     | YES      | `0`                  |
| mixed_payment_trips       | `integer`     | YES      | `0`                  |
| rank_in_period            | `integer`     | YES      | `-`                  |
| tier                      | `varchar`     | YES      | `-`                  |
| tier_change               | `varchar`     | YES      | `-`                  |
| acceptance_rate           | `numeric`     | YES      | `-`                  |
| cancellation_rate         | `numeric`     | YES      | `-`                  |
| completion_rate           | `numeric`     | YES      | `-`                  |
| avg_trip_duration_minutes | `numeric`     | YES      | `-`                  |
| avg_earnings_per_trip     | `numeric`     | YES      | `-`                  |
| avg_earnings_per_hour     | `numeric`     | YES      | `-`                  |
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
| hours_logged              | `numeric`     | YES      | `-`                  |

### rid_driver_requests

**Row Count:** ~0

| Column                    | Type                  | Nullable | Default                      |
| ------------------------- | --------------------- | -------- | ---------------------------- |
| id                        | `uuid`                | NO       | `uuid_generate_v4()`         |
| tenant_id                 | `uuid`                | NO       | `-`                          |
| driver_id                 | `uuid`                | NO       | `-`                          |
| request_date              | `date`                | NO       | `-`                          |
| details                   | `jsonb`               | NO       | `'{}'::jsonb`                |
| resolution_notes          | `text`                | YES      | `-`                          |
| created_at                | `timestamptz`         | NO       | `now()`                      |
| created_by                | `uuid`                | YES      | `-`                          |
| updated_at                | `timestamptz`         | NO       | `now()`                      |
| updated_by                | `uuid`                | YES      | `-`                          |
| deleted_at                | `timestamptz`         | YES      | `-`                          |
| deleted_by                | `uuid`                | YES      | `-`                          |
| deletion_reason           | `text`                | YES      | `-`                          |
| request_type              | `driver_request_type` | YES      | `-`                          |
| status                    | `request_status`      | YES      | `'pending'::request_status`  |
| priority                  | `request_priority`    | YES      | `'normal'::request_priority` |
| sla_deadline              | `timestamptz`         | YES      | `-`                          |
| sla_breached              | `boolean`             | YES      | `false`                      |
| response_required_by      | `timestamptz`         | YES      | `-`                          |
| assigned_to               | `uuid`                | YES      | `-`                          |
| assigned_at               | `timestamptz`         | YES      | `-`                          |
| review_started_at         | `timestamptz`         | YES      | `-`                          |
| reviewed_by               | `uuid`                | YES      | `-`                          |
| approved_at               | `timestamptz`         | YES      | `-`                          |
| approved_by               | `uuid`                | YES      | `-`                          |
| rejected_at               | `timestamptz`         | YES      | `-`                          |
| rejected_by               | `uuid`                | YES      | `-`                          |
| rejection_reason          | `text`                | YES      | `-`                          |
| completed_at              | `timestamptz`         | YES      | `-`                          |
| escalated                 | `boolean`             | YES      | `false`                      |
| escalated_at              | `timestamptz`         | YES      | `-`                          |
| escalated_to              | `uuid`                | YES      | `-`                          |
| escalation_reason         | `text`                | YES      | `-`                          |
| requires_manager_approval | `boolean`             | YES      | `false`                      |
| manager_approved_at       | `timestamptz`         | YES      | `-`                          |
| manager_approved_by       | `uuid`                | YES      | `-`                          |
| requires_hr_approval      | `boolean`             | YES      | `false`                      |
| hr_approved_at            | `timestamptz`         | YES      | `-`                          |
| hr_approved_by            | `uuid`                | YES      | `-`                          |
| driver_notified_at        | `timestamptz`         | YES      | `-`                          |
| manager_notified_at       | `timestamptz`         | YES      | `-`                          |
| notification_method       | `varchar`             | YES      | `-`                          |
| attachments               | `jsonb`               | YES      | `'[]'::jsonb`                |

### rid_driver_training

**Row Count:** ~0

| Column                           | Type              | Nullable | Default                      |
| -------------------------------- | ----------------- | -------- | ---------------------------- |
| id                               | `uuid`            | NO       | `uuid_generate_v4()`         |
| tenant_id                        | `uuid`            | NO       | `-`                          |
| driver_id                        | `uuid`            | NO       | `-`                          |
| training_name                    | `text`            | NO       | `-`                          |
| provider                         | `text`            | YES      | `-`                          |
| assigned_at                      | `timestamptz`     | YES      | `-`                          |
| due_at                           | `timestamptz`     | YES      | `-`                          |
| completed_at                     | `timestamptz`     | YES      | `-`                          |
| score                            | `numeric`         | YES      | `-`                          |
| certificate_url                  | `text`            | YES      | `-`                          |
| metadata                         | `jsonb`           | NO       | `'{}'::jsonb`                |
| created_at                       | `timestamptz`     | NO       | `now()`                      |
| created_by                       | `uuid`            | YES      | `-`                          |
| updated_at                       | `timestamptz`     | NO       | `now()`                      |
| updated_by                       | `uuid`            | YES      | `-`                          |
| deleted_at                       | `timestamptz`     | YES      | `-`                          |
| deleted_by                       | `uuid`            | YES      | `-`                          |
| deletion_reason                  | `text`            | YES      | `-`                          |
| training_type                    | `training_type`   | YES      | `-`                          |
| status                           | `training_status` | YES      | `'planned'::training_status` |
| provider_type                    | `provider_type`   | YES      | `-`                          |
| provider_id                      | `uuid`            | YES      | `-`                          |
| provider_contact                 | `varchar`         | YES      | `-`                          |
| provider_location                | `text`            | YES      | `-`                          |
| description                      | `text`            | YES      | `-`                          |
| duration_hours                   | `numeric`         | YES      | `-`                          |
| total_sessions                   | `integer`         | YES      | `1`                          |
| sessions_completed               | `integer`         | YES      | `0`                          |
| materials_url                    | `text`            | YES      | `-`                          |
| prerequisites_met                | `boolean`         | YES      | `true`                       |
| prerequisite_training_ids        | `jsonb`           | YES      | `'[]'::jsonb`                |
| prerequisite_documents           | `jsonb`           | YES      | `'[]'::jsonb`                |
| scheduled_start                  | `timestamptz`     | YES      | `-`                          |
| scheduled_end                    | `timestamptz`     | YES      | `-`                          |
| actual_start                     | `timestamptz`     | YES      | `-`                          |
| actual_end                       | `timestamptz`     | YES      | `-`                          |
| location                         | `text`            | YES      | `-`                          |
| online_meeting_url               | `text`            | YES      | `-`                          |
| attendance_percentage            | `numeric`         | YES      | `-`                          |
| absences_count                   | `integer`         | YES      | `0`                          |
| late_arrivals_count              | `integer`         | YES      | `0`                          |
| evaluation_method                | `varchar`         | YES      | `-`                          |
| passing_score                    | `numeric`         | YES      | `-`                          |
| max_score                        | `numeric`         | YES      | `-`                          |
| pass_fail_status                 | `varchar`         | YES      | `-`                          |
| evaluation_date                  | `timestamptz`     | YES      | `-`                          |
| evaluated_by                     | `uuid`            | YES      | `-`                          |
| evaluation_notes                 | `text`            | YES      | `-`                          |
| certificate_issued               | `boolean`         | YES      | `false`                      |
| certificate_number               | `varchar`         | YES      | `-`                          |
| certificate_issued_date          | `date`            | YES      | `-`                          |
| certificate_expiry_date          | `date`            | YES      | `-`                          |
| recertification_required         | `boolean`         | YES      | `false`                      |
| recertification_frequency_months | `integer`         | YES      | `-`                          |
| training_cost                    | `numeric`         | YES      | `-`                          |
| paid_by                          | `paid_by`         | YES      | `-`                          |
| budget_code                      | `varchar`         | YES      | `-`                          |
| invoice_number                   | `varchar`         | YES      | `-`                          |
| driver_feedback                  | `text`            | YES      | `-`                          |
| driver_rating                    | `numeric`         | YES      | `-`                          |
| feedback_submitted_at            | `timestamptz`     | YES      | `-`                          |

### rid_drivers

**Row Count:** ~4

| Column                     | Type                       | Nullable | Default                   |
| -------------------------- | -------------------------- | -------- | ------------------------- |
| id                         | `uuid`                     | NO       | `uuid_generate_v4()`      |
| tenant_id                  | `uuid`                     | NO       | `-`                       |
| first_name                 | `text`                     | NO       | `-`                       |
| last_name                  | `text`                     | NO       | `-`                       |
| email                      | `text`                     | NO       | `-`                       |
| phone                      | `text`                     | NO       | `-`                       |
| license_number             | `text`                     | NO       | `-`                       |
| license_issue_date         | `date`                     | YES      | `-`                       |
| license_expiry_date        | `date`                     | YES      | `-`                       |
| professional_card_no       | `text`                     | YES      | `-`                       |
| professional_expiry        | `date`                     | YES      | `-`                       |
| created_at                 | `timestamptz`              | NO       | `CURRENT_TIMESTAMP`       |
| updated_at                 | `timestamptz`              | NO       | `CURRENT_TIMESTAMP`       |
| deleted_at                 | `timestamptz`              | YES      | `-`                       |
| rating                     | `numeric`                  | YES      | `-`                       |
| notes                      | `text`                     | YES      | `-`                       |
| date_of_birth              | `date`                     | YES      | `-`                       |
| gender                     | `text`                     | YES      | `-`                       |
| nationality                | `character`                | YES      | `-`                       |
| hire_date                  | `date`                     | YES      | `-`                       |
| employment_status          | `text`                     | NO       | `'active'::text`          |
| cooperation_type           | `cooperation_type`         | YES      | `-`                       |
| emergency_contact_name     | `text`                     | YES      | `-`                       |
| emergency_contact_phone    | `text`                     | YES      | `-`                       |
| place_of_birth             | `varchar`                  | YES      | `-`                       |
| emirates_id                | `varchar`                  | YES      | `-`                       |
| emirates_id_expiry         | `date`                     | YES      | `-`                       |
| preferred_name             | `varchar`                  | YES      | `-`                       |
| secondary_phone            | `varchar`                  | YES      | `-`                       |
| emergency_contact_relation | `varchar`                  | YES      | `-`                       |
| address_line1              | `text`                     | YES      | `-`                       |
| address_line2              | `text`                     | YES      | `-`                       |
| city                       | `varchar`                  | YES      | `-`                       |
| state                      | `varchar`                  | YES      | `-`                       |
| postal_code                | `varchar`                  | YES      | `-`                       |
| country_code               | `character`                | YES      | `-`                       |
| bank_name                  | `varchar`                  | YES      | `-`                       |
| bank_account_number        | `varchar`                  | YES      | `-`                       |
| bank_iban                  | `varchar`                  | YES      | `-`                       |
| bank_swift_code            | `varchar`                  | YES      | `-`                       |
| preferred_payment_method   | `preferred_payment_method` | YES      | `-`                       |
| wps_eligible               | `boolean`                  | YES      | `false`                   |
| driver_status              | `driver_status`            | YES      | `'active'::driver_status` |
| onboarded_at               | `timestamptz`              | YES      | `-`                       |
| last_active_at             | `timestamptz`              | YES      | `-`                       |
| total_trips_completed      | `integer`                  | YES      | `0`                       |
| lifetime_earnings          | `numeric`                  | YES      | `0`                       |
| suspension_reason          | `text`                     | YES      | `-`                       |
| suspension_start_date      | `date`                     | YES      | `-`                       |
| suspension_end_date        | `date`                     | YES      | `-`                       |
| termination_reason         | `text`                     | YES      | `-`                       |
| termination_date           | `date`                     | YES      | `-`                       |
| rehire_eligible            | `boolean`                  | YES      | `true`                    |
| photo_url                  | `text`                     | YES      | `-`                       |
| photo_verified_at          | `timestamptz`              | YES      | `-`                       |
| photo_verified_by          | `uuid`                     | YES      | `-`                       |
| average_rating             | `numeric`                  | YES      | `-`                       |
| metadata                   | `jsonb`                    | YES      | `'{}'::jsonb`             |
| preferences                | `jsonb`                    | YES      | `'{}'::jsonb`             |
| created_by                 | `uuid`                     | YES      | `-`                       |
| updated_by                 | `uuid`                     | YES      | `-`                       |
| verified_by                | `uuid`                     | YES      | `-`                       |
| verified_at                | `timestamptz`              | YES      | `-`                       |
| deleted_by                 | `uuid`                     | YES      | `-`                       |
| deletion_reason            | `text`                     | YES      | `-`                       |

## Schedule Module (sch\_)

### sch_goal_achievements

**Row Count:** ~0

| Column            | Type             | Nullable | Default             |
| ----------------- | ---------------- | -------- | ------------------- |
| id                | `uuid`           | NO       | `gen_random_uuid()` |
| goal_id           | `uuid`           | NO       | `-`                 |
| achievement_date  | `timestamptz`    | NO       | `-`                 |
| final_value       | `numeric`        | NO       | `-`                 |
| threshold_reached | `goal_threshold` | YES      | `-`                 |
| reward_granted    | `boolean`        | YES      | `false`             |
| reward_amount     | `numeric`        | YES      | `-`                 |
| certificate_url   | `varchar`        | YES      | `-`                 |
| notes             | `text`           | YES      | `-`                 |
| metadata          | `jsonb`          | YES      | `-`                 |
| created_at        | `timestamptz`    | YES      | `now()`             |
| created_by        | `uuid`           | NO       | `-`                 |

### sch_goal_types

**Row Count:** ~0

| Column             | Type               | Nullable | Default             |
| ------------------ | ------------------ | -------- | ------------------- |
| id                 | `uuid`             | NO       | `gen_random_uuid()` |
| tenant_id          | `uuid`             | NO       | `-`                 |
| code               | `varchar`          | NO       | `-`                 |
| label              | `varchar`          | NO       | `-`                 |
| category           | `goal_category`    | NO       | `-`                 |
| unit               | `varchar`          | NO       | `-`                 |
| calculation_method | `text`             | YES      | `-`                 |
| data_source_table  | `varchar`          | YES      | `-`                 |
| data_source_field  | `varchar`          | YES      | `-`                 |
| aggregation_type   | `aggregation_type` | YES      | `-`                 |
| is_higher_better   | `boolean`          | YES      | `true`              |
| icon               | `varchar`          | YES      | `-`                 |
| color              | `varchar`          | YES      | `-`                 |
| metadata           | `jsonb`            | YES      | `-`                 |
| created_at         | `timestamptz`      | NO       | `now()`             |
| updated_at         | `timestamptz`      | NO       | `now()`             |
| created_by         | `uuid`             | NO       | `-`                 |
| updated_by         | `uuid`             | YES      | `-`                 |
| deleted_at         | `timestamptz`      | YES      | `-`                 |
| deleted_by         | `uuid`             | YES      | `-`                 |
| deletion_reason    | `text`             | YES      | `-`                 |

### sch_goals

**Row Count:** ~0

| Column                      | Type               | Nullable | Default                 |
| --------------------------- | ------------------ | -------- | ----------------------- |
| id                          | `uuid`             | NO       | `uuid_generate_v4()`    |
| tenant_id                   | `uuid`             | NO       | `-`                     |
| goal_type                   | `text`             | NO       | `-`                     |
| target_value                | `numeric`          | NO       | `-`                     |
| period_start                | `date`             | NO       | `-`                     |
| period_end                  | `date`             | NO       | `-`                     |
| assigned_to                 | `uuid`             | NO       | `-`                     |
| metadata                    | `jsonb`            | NO       | `'{}'::jsonb`           |
| created_at                  | `timestamptz`      | NO       | `now()`                 |
| created_by                  | `uuid`             | YES      | `-`                     |
| updated_at                  | `timestamptz`      | NO       | `now()`                 |
| updated_by                  | `uuid`             | YES      | `-`                     |
| deleted_at                  | `timestamptz`      | YES      | `-`                     |
| deleted_by                  | `uuid`             | YES      | `-`                     |
| deletion_reason             | `text`             | YES      | `-`                     |
| goal_type_id                | `uuid`             | YES      | `-`                     |
| goal_category               | `goal_category`    | YES      | `-`                     |
| target_type                 | `goal_target_type` | YES      | `-`                     |
| target_entity_type          | `varchar`          | YES      | `-`                     |
| target_entity_id            | `uuid`             | YES      | `-`                     |
| period_type                 | `goal_period_type` | YES      | `-`                     |
| recurrence_pattern          | `varchar`          | YES      | `-`                     |
| current_value               | `numeric`          | YES      | `0`                     |
| progress_percent            | `numeric`          | YES      | `-`                     |
| unit                        | `varchar`          | YES      | `-`                     |
| weight                      | `numeric`          | YES      | `1.0`                   |
| reward_type                 | `goal_reward_type` | YES      | `-`                     |
| reward_amount               | `numeric`          | YES      | `-`                     |
| threshold_bronze            | `numeric`          | YES      | `-`                     |
| threshold_silver            | `numeric`          | YES      | `-`                     |
| threshold_gold              | `numeric`          | YES      | `-`                     |
| achievement_date            | `timestamptz`      | YES      | `-`                     |
| last_calculated_at          | `timestamptz`      | YES      | `-`                     |
| last_notified_at            | `timestamptz`      | YES      | `-`                     |
| notification_frequency_days | `integer`          | YES      | `-`                     |
| status                      | `goal_status`      | YES      | `'active'::goal_status` |
| notes                       | `text`             | YES      | `-`                     |

### sch_locations

**Row Count:** ~0

| Column          | Type          | Nullable | Default             |
| --------------- | ------------- | -------- | ------------------- |
| id              | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id       | `uuid`        | NO       | `-`                 |
| name            | `varchar`     | NO       | `-`                 |
| code            | `varchar`     | NO       | `-`                 |
| polygon         | `jsonb`       | YES      | `-`                 |
| city            | `varchar`     | YES      | `-`                 |
| country         | `varchar`     | YES      | `-`                 |
| description     | `text`        | YES      | `-`                 |
| is_active       | `boolean`     | YES      | `true`              |
| metadata        | `jsonb`       | YES      | `-`                 |
| created_at      | `timestamptz` | NO       | `now()`             |
| updated_at      | `timestamptz` | NO       | `now()`             |
| created_by      | `uuid`        | NO       | `-`                 |
| updated_by      | `uuid`        | YES      | `-`                 |
| deleted_at      | `timestamptz` | YES      | `-`                 |
| deleted_by      | `uuid`        | YES      | `-`                 |
| deletion_reason | `text`        | YES      | `-`                 |

### sch_maintenance_schedules

**Row Count:** ~0

| Column                   | Type                       | Nullable | Default                           |
| ------------------------ | -------------------------- | -------- | --------------------------------- |
| id                       | `uuid`                     | NO       | `uuid_generate_v4()`              |
| tenant_id                | `uuid`                     | NO       | `-`                               |
| vehicle_id               | `uuid`                     | NO       | `-`                               |
| scheduled_date           | `date`                     | NO       | `-`                               |
| maintenance_type         | `text`                     | NO       | `-`                               |
| metadata                 | `jsonb`                    | NO       | `'{}'::jsonb`                     |
| created_at               | `timestamptz`              | NO       | `now()`                           |
| created_by               | `uuid`                     | YES      | `-`                               |
| updated_at               | `timestamptz`              | NO       | `now()`                           |
| updated_by               | `uuid`                     | YES      | `-`                               |
| deleted_at               | `timestamptz`              | YES      | `-`                               |
| deleted_by               | `uuid`                     | YES      | `-`                               |
| deletion_reason          | `text`                     | YES      | `-`                               |
| maintenance_type_id      | `uuid`                     | YES      | `-`                               |
| scheduled_by             | `uuid`                     | YES      | `-`                               |
| estimated_duration_hours | `numeric`                  | YES      | `-`                               |
| estimated_cost           | `numeric`                  | YES      | `-`                               |
| odometer_reading         | `integer`                  | YES      | `-`                               |
| trigger_type             | `maintenance_trigger_type` | YES      | `-`                               |
| reminder_sent_at         | `timestamptz`              | YES      | `-`                               |
| reminder_count           | `integer`                  | YES      | `0`                               |
| completed_maintenance_id | `uuid`                     | YES      | `-`                               |
| rescheduled_from         | `uuid`                     | YES      | `-`                               |
| rescheduled_reason       | `text`                     | YES      | `-`                               |
| blocking_operations      | `boolean`                  | YES      | `false`                           |
| required_parts           | `jsonb`                    | YES      | `-`                               |
| assigned_garage          | `varchar`                  | YES      | `-`                               |
| garage_contact           | `varchar`                  | YES      | `-`                               |
| notes                    | `text`                     | YES      | `-`                               |
| status                   | `maintenance_status`       | YES      | `'scheduled'::maintenance_status` |

### sch_shift_types

**Row Count:** ~0

| Column          | Type          | Nullable | Default             |
| --------------- | ------------- | -------- | ------------------- |
| id              | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id       | `uuid`        | NO       | `-`                 |
| code            | `varchar`     | NO       | `-`                 |
| label           | `varchar`     | NO       | `-`                 |
| pay_multiplier  | `numeric`     | NO       | `-`                 |
| color_code      | `varchar`     | YES      | `-`                 |
| is_active       | `boolean`     | YES      | `true`              |
| metadata        | `jsonb`       | YES      | `-`                 |
| created_at      | `timestamptz` | NO       | `now()`             |
| updated_at      | `timestamptz` | NO       | `now()`             |
| created_by      | `uuid`        | NO       | `-`                 |
| updated_by      | `uuid`        | YES      | `-`                 |
| deleted_at      | `timestamptz` | YES      | `-`                 |
| deleted_by      | `uuid`        | YES      | `-`                 |
| deletion_reason | `text`        | YES      | `-`                 |

### sch_shifts

**Row Count:** ~0

| Column                 | Type           | Nullable | Default              |
| ---------------------- | -------------- | -------- | -------------------- |
| id                     | `uuid`         | NO       | `uuid_generate_v4()` |
| tenant_id              | `uuid`         | NO       | `-`                  |
| driver_id              | `uuid`         | NO       | `-`                  |
| start_time             | `timestamptz`  | NO       | `-`                  |
| end_time               | `timestamptz`  | NO       | `-`                  |
| metadata               | `jsonb`        | NO       | `'{}'::jsonb`        |
| created_at             | `timestamptz`  | NO       | `now()`              |
| created_by             | `uuid`         | YES      | `-`                  |
| updated_at             | `timestamptz`  | NO       | `now()`              |
| updated_by             | `uuid`         | YES      | `-`                  |
| deleted_at             | `timestamptz`  | YES      | `-`                  |
| deleted_by             | `uuid`         | YES      | `-`                  |
| deletion_reason        | `text`         | YES      | `-`                  |
| shift_type_id          | `uuid`         | YES      | `-`                  |
| shift_category         | `varchar`      | YES      | `-`                  |
| location_id            | `uuid`         | YES      | `-`                  |
| zone_name              | `varchar`      | YES      | `-`                  |
| check_in_at            | `timestamptz`  | YES      | `-`                  |
| check_out_at           | `timestamptz`  | YES      | `-`                  |
| break_duration_minutes | `integer`      | YES      | `-`                  |
| actual_work_minutes    | `integer`      | YES      | `-`                  |
| pay_multiplier         | `numeric`      | YES      | `-`                  |
| status                 | `shift_status` | YES      | `-`                  |
| approved_by            | `uuid`         | YES      | `-`                  |
| approved_at            | `timestamptz`  | YES      | `-`                  |
| cancellation_reason    | `varchar`      | YES      | `-`                  |
| replacement_driver_id  | `uuid`         | YES      | `-`                  |

### sch_task_comments

**Row Count:** ~0

| Column       | Type                | Nullable | Default             |
| ------------ | ------------------- | -------- | ------------------- |
| id           | `uuid`              | NO       | `gen_random_uuid()` |
| task_id      | `uuid`              | NO       | `-`                 |
| comment_type | `task_comment_type` | NO       | `-`                 |
| author_id    | `uuid`              | NO       | `-`                 |
| comment_text | `text`              | NO       | `-`                 |
| attachments  | `jsonb`             | YES      | `-`                 |
| is_internal  | `boolean`           | YES      | `false`             |
| metadata     | `jsonb`             | YES      | `-`                 |
| created_at   | `timestamptz`       | YES      | `now()`             |

### sch_task_history

**Row Count:** ~0

| Column        | Type               | Nullable | Default             |
| ------------- | ------------------ | -------- | ------------------- |
| id            | `uuid`             | NO       | `gen_random_uuid()` |
| task_id       | `uuid`             | NO       | `-`                 |
| changed_by    | `uuid`             | NO       | `-`                 |
| change_type   | `task_change_type` | NO       | `-`                 |
| old_values    | `jsonb`            | YES      | `-`                 |
| new_values    | `jsonb`            | YES      | `-`                 |
| change_reason | `text`             | YES      | `-`                 |
| metadata      | `jsonb`            | YES      | `-`                 |
| created_at    | `timestamptz`      | YES      | `now()`             |

### sch_task_types

**Row Count:** ~0

| Column                   | Type            | Nullable | Default             |
| ------------------------ | --------------- | -------- | ------------------- |
| id                       | `uuid`          | NO       | `gen_random_uuid()` |
| tenant_id                | `uuid`          | NO       | `-`                 |
| code                     | `varchar`       | NO       | `-`                 |
| label                    | `varchar`       | NO       | `-`                 |
| category                 | `task_category` | NO       | `-`                 |
| default_priority         | `task_priority` | YES      | `-`                 |
| default_duration_minutes | `integer`       | YES      | `-`                 |
| requires_verification    | `boolean`       | YES      | `false`             |
| default_checklist        | `jsonb`         | YES      | `-`                 |
| auto_assignment_rule     | `jsonb`         | YES      | `-`                 |
| sla_hours                | `integer`       | YES      | `-`                 |
| escalation_hours         | `integer`       | YES      | `-`                 |
| description_template     | `text`          | YES      | `-`                 |
| metadata                 | `jsonb`         | YES      | `-`                 |
| created_at               | `timestamptz`   | NO       | `now()`             |
| updated_at               | `timestamptz`   | NO       | `now()`             |
| created_by               | `uuid`          | NO       | `-`                 |
| updated_by               | `uuid`          | YES      | `-`                 |
| deleted_at               | `timestamptz`   | YES      | `-`                 |
| deleted_by               | `uuid`          | YES      | `-`                 |
| deletion_reason          | `text`          | YES      | `-`                 |

### sch_tasks

**Row Count:** ~0

| Column                     | Type            | Nullable | Default                   |
| -------------------------- | --------------- | -------- | ------------------------- |
| id                         | `uuid`          | NO       | `uuid_generate_v4()`      |
| tenant_id                  | `uuid`          | NO       | `-`                       |
| task_type                  | `text`          | NO       | `-`                       |
| description                | `text`          | NO       | `-`                       |
| target_id                  | `uuid`          | NO       | `-`                       |
| due_at                     | `timestamptz`   | YES      | `-`                       |
| metadata                   | `jsonb`         | NO       | `'{}'::jsonb`             |
| created_at                 | `timestamptz`   | NO       | `now()`                   |
| created_by                 | `uuid`          | YES      | `-`                       |
| updated_at                 | `timestamptz`   | NO       | `now()`                   |
| updated_by                 | `uuid`          | YES      | `-`                       |
| deleted_at                 | `timestamptz`   | YES      | `-`                       |
| deleted_by                 | `uuid`          | YES      | `-`                       |
| deletion_reason            | `text`          | YES      | `-`                       |
| task_type_id               | `uuid`          | YES      | `-`                       |
| task_category              | `task_category` | YES      | `-`                       |
| title                      | `varchar`       | YES      | `-`                       |
| priority                   | `task_priority` | YES      | `'normal'::task_priority` |
| assigned_to                | `uuid`          | YES      | `-`                       |
| assigned_at                | `timestamptz`   | YES      | `-`                       |
| assigned_by                | `uuid`          | YES      | `-`                       |
| target_type                | `varchar`       | YES      | `-`                       |
| related_entity_type        | `varchar`       | YES      | `-`                       |
| related_entity_id          | `uuid`          | YES      | `-`                       |
| estimated_duration_minutes | `integer`       | YES      | `-`                       |
| actual_duration_minutes    | `integer`       | YES      | `-`                       |
| start_date                 | `date`          | YES      | `-`                       |
| due_date                   | `date`          | YES      | `-`                       |
| completed_at               | `timestamptz`   | YES      | `-`                       |
| completed_by               | `uuid`          | YES      | `-`                       |
| verification_required      | `boolean`       | YES      | `false`                   |
| verified_by                | `uuid`          | YES      | `-`                       |
| verified_at                | `timestamptz`   | YES      | `-`                       |
| is_auto_generated          | `boolean`       | YES      | `false`                   |
| generation_trigger         | `varchar`       | YES      | `-`                       |
| recurrence_pattern         | `varchar`       | YES      | `-`                       |
| parent_task_id             | `uuid`          | YES      | `-`                       |
| blocking_tasks             | `_uuid`         | YES      | `-`                       |
| checklist                  | `jsonb`         | YES      | `-`                       |
| attachments                | `jsonb`         | YES      | `-`                       |
| reminder_sent_at           | `timestamptz`   | YES      | `-`                       |
| reminder_frequency_days    | `integer`       | YES      | `-`                       |
| escalation_level           | `integer`       | YES      | `0`                       |
| escalated_to               | `uuid`          | YES      | `-`                       |
| tags                       | `_text`         | YES      | `-`                       |
| status                     | `task_status`   | YES      | `'pending'::task_status`  |

## Support Module (sup\_)

### sup_canned_responses

**Row Count:** ~0

| Column       | Type          | Nullable | Default             |
| ------------ | ------------- | -------- | ------------------- |
| id           | `uuid`        | NO       | `gen_random_uuid()` |
| tenant_id    | `uuid`        | NO       | `-`                 |
| title        | `varchar`     | NO       | `-`                 |
| content      | `text`        | NO       | `-`                 |
| category     | `varchar`     | YES      | `-`                 |
| language     | `varchar`     | NO       | `-`                 |
| usage_count  | `integer`     | NO       | `0`                 |
| last_used_at | `timestamptz` | YES      | `-`                 |
| is_active    | `boolean`     | NO       | `true`              |
| created_at   | `timestamptz` | NO       | `CURRENT_TIMESTAMP` |
| updated_at   | `timestamptz` | NO       | `CURRENT_TIMESTAMP` |
| created_by   | `uuid`        | NO       | `-`                 |

### sup_customer_feedback

**Row Count:** ~0

| Column                       | Type               | Nullable | Default                 |
| ---------------------------- | ------------------ | -------- | ----------------------- |
| id                           | `uuid`             | NO       | `uuid_generate_v4()`    |
| tenant_id                    | `uuid`             | NO       | `-`                     |
| submitted_by                 | `uuid`             | NO       | `-`                     |
| feedback_text                | `text`             | NO       | `-`                     |
| rating                       | `integer`          | NO       | `-`                     |
| metadata                     | `jsonb`            | YES      | `'{}'::jsonb`           |
| created_by                   | `uuid`             | YES      | `-`                     |
| created_at                   | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`     |
| updated_by                   | `uuid`             | YES      | `-`                     |
| updated_at                   | `timestamptz`      | NO       | `CURRENT_TIMESTAMP`     |
| deleted_by                   | `uuid`             | YES      | `-`                     |
| deleted_at                   | `timestamptz`      | YES      | `-`                     |
| ticket_id                    | `uuid`             | YES      | `-`                     |
| driver_id                    | `uuid`             | YES      | `-`                     |
| service_type                 | `service_type`     | YES      | `'other'::service_type` |
| language                     | `varchar`          | YES      | `-`                     |
| sentiment_score              | `double precision` | YES      | `-`                     |
| is_anonymous                 | `boolean`          | YES      | `false`                 |
| category                     | `varchar`          | YES      | `-`                     |
| tags                         | `_text`            | YES      | `'{}'::text[]`          |
| overall_rating               | `integer`          | YES      | `-`                     |
| response_time_rating         | `integer`          | YES      | `-`                     |
| resolution_quality_rating    | `integer`          | YES      | `-`                     |
| agent_professionalism_rating | `integer`          | YES      | `-`                     |
| submitter_type               | `submitter_type`   | YES      | `-`                     |

### sup_ticket_categories

**Row Count:** ~0

| Column                | Type              | Nullable | Default             |
| --------------------- | ----------------- | -------- | ------------------- |
| id                    | `uuid`            | NO       | `gen_random_uuid()` |
| tenant_id             | `uuid`            | NO       | `-`                 |
| name                  | `varchar`         | NO       | `-`                 |
| slug                  | `varchar`         | NO       | `-`                 |
| description           | `text`            | YES      | `-`                 |
| parent_category_id    | `uuid`            | YES      | `-`                 |
| default_priority      | `ticket_priority` | YES      | `-`                 |
| default_assigned_team | `varchar`         | YES      | `-`                 |
| sla_hours             | `integer`         | YES      | `-`                 |
| is_active             | `boolean`         | NO       | `true`              |
| display_order         | `integer`         | NO       | `0`                 |
| created_at            | `timestamptz`     | NO       | `CURRENT_TIMESTAMP` |
| updated_at            | `timestamptz`     | NO       | `CURRENT_TIMESTAMP` |
| created_by            | `uuid`            | NO       | `-`                 |
| updated_by            | `uuid`            | YES      | `-`                 |

### sup_ticket_messages

**Row Count:** ~0

| Column            | Type               | Nullable | Default                  |
| ----------------- | ------------------ | -------- | ------------------------ |
| id                | `uuid`             | NO       | `uuid_generate_v4()`     |
| ticket_id         | `uuid`             | NO       | `-`                      |
| sender_id         | `uuid`             | NO       | `-`                      |
| message_body      | `text`             | NO       | `-`                      |
| sent_at           | `timestamptz`      | NO       | `now()`                  |
| metadata          | `jsonb`            | NO       | `'{}'::jsonb`            |
| created_at        | `timestamptz`      | NO       | `now()`                  |
| created_by        | `uuid`             | YES      | `-`                      |
| updated_at        | `timestamptz`      | NO       | `now()`                  |
| updated_by        | `uuid`             | YES      | `-`                      |
| deleted_at        | `timestamptz`      | YES      | `-`                      |
| deleted_by        | `uuid`             | YES      | `-`                      |
| deletion_reason   | `text`             | YES      | `-`                      |
| message_type      | `message_type`     | YES      | `'public'::message_type` |
| parent_message_id | `uuid`             | YES      | `-`                      |
| attachment_url    | `text`             | YES      | `-`                      |
| attachment_type   | `varchar`          | YES      | `-`                      |
| language          | `varchar`          | YES      | `-`                      |
| sentiment_score   | `double precision` | YES      | `-`                      |
| is_automated      | `boolean`          | YES      | `false`                  |
| ai_suggestions    | `jsonb`            | YES      | `-`                      |
| translation       | `jsonb`            | YES      | `-`                      |

### sup_ticket_sla_rules

**Row Count:** ~0

| Column                | Type              | Nullable | Default             |
| --------------------- | ----------------- | -------- | ------------------- |
| id                    | `uuid`            | NO       | `gen_random_uuid()` |
| tenant_id             | `uuid`            | NO       | `-`                 |
| category_id           | `uuid`            | YES      | `-`                 |
| priority              | `ticket_priority` | NO       | `-`                 |
| response_time_hours   | `integer`         | NO       | `-`                 |
| resolution_time_hours | `integer`         | NO       | `-`                 |
| escalation_rules      | `jsonb`           | YES      | `-`                 |
| business_hours_only   | `boolean`         | NO       | `false`             |
| is_active             | `boolean`         | NO       | `true`              |
| created_at            | `timestamptz`     | NO       | `CURRENT_TIMESTAMP` |
| updated_at            | `timestamptz`     | NO       | `CURRENT_TIMESTAMP` |
| created_by            | `uuid`            | NO       | `-`                 |
| updated_by            | `uuid`            | YES      | `-`                 |

### sup_tickets

**Row Count:** ~0

| Column           | Type                     | Nullable | Default                          |
| ---------------- | ------------------------ | -------- | -------------------------------- |
| id               | `uuid`                   | NO       | `uuid_generate_v4()`             |
| tenant_id        | `uuid`                   | NO       | `-`                              |
| raised_by        | `uuid`                   | NO       | `-`                              |
| subject          | `text`                   | NO       | `-`                              |
| description      | `text`                   | NO       | `-`                              |
| assigned_to      | `uuid`                   | YES      | `-`                              |
| metadata         | `jsonb`                  | NO       | `'{}'::jsonb`                    |
| created_at       | `timestamptz`            | NO       | `now()`                          |
| created_by       | `uuid`                   | YES      | `-`                              |
| updated_at       | `timestamptz`            | NO       | `now()`                          |
| updated_by       | `uuid`                   | YES      | `-`                              |
| deleted_at       | `timestamptz`            | YES      | `-`                              |
| deleted_by       | `uuid`                   | YES      | `-`                              |
| deletion_reason  | `text`                   | YES      | `-`                              |
| category         | `varchar`                | YES      | `-`                              |
| sub_category     | `varchar`                | YES      | `-`                              |
| language         | `varchar`                | YES      | `-`                              |
| source_platform  | `ticket_source_platform` | YES      | `'web'::ticket_source_platform`  |
| raised_by_type   | `ticket_raised_by_type`  | YES      | `'admin'::ticket_raised_by_type` |
| attachments_url  | `_text`                  | YES      | `'{}'::text[]`                   |
| resolution_notes | `text`                   | YES      | `-`                              |
| sla_due_at       | `timestamptz`            | YES      | `-`                              |
| closed_at        | `timestamptz`            | YES      | `-`                              |
| status           | `ticket_status`          | YES      | `'new'::ticket_status`           |
| priority         | `ticket_priority`        | YES      | `'medium'::ticket_priority`      |

## Transport Module (trp\_)

### trp_client_invoice_lines

**Row Count:** ~0

| Column      | Type          | Nullable | Default             |
| ----------- | ------------- | -------- | ------------------- |
| id          | `uuid`        | NO       | `gen_random_uuid()` |
| invoice_id  | `uuid`        | NO       | `-`                 |
| line_number | `integer`     | NO       | `-`                 |
| description | `text`        | NO       | `-`                 |
| trip_id     | `uuid`        | YES      | `-`                 |
| quantity    | `numeric`     | NO       | `-`                 |
| unit_price  | `numeric`     | NO       | `-`                 |
| tax_rate    | `numeric`     | YES      | `-`                 |
| line_amount | `numeric`     | NO       | `-`                 |
| metadata    | `jsonb`       | YES      | `-`                 |
| created_at  | `timestamptz` | YES      | `now()`             |

### trp_client_invoices

**Row Count:** ~0

| Column            | Type                 | Nullable | Default                       |
| ----------------- | -------------------- | -------- | ----------------------------- |
| id                | `uuid`               | NO       | `uuid_generate_v4()`          |
| tenant_id         | `uuid`               | NO       | `-`                           |
| client_id         | `uuid`               | NO       | `-`                           |
| invoice_number    | `text`               | NO       | `-`                           |
| invoice_date      | `date`               | NO       | `-`                           |
| due_date          | `date`               | NO       | `-`                           |
| total_amount      | `numeric`            | NO       | `-`                           |
| currency          | `varchar`            | NO       | `-`                           |
| metadata          | `jsonb`              | NO       | `'{}'::jsonb`                 |
| created_at        | `timestamptz`        | NO       | `now()`                       |
| created_by        | `uuid`               | YES      | `-`                           |
| updated_at        | `timestamptz`        | NO       | `now()`                       |
| updated_by        | `uuid`               | YES      | `-`                           |
| deleted_at        | `timestamptz`        | YES      | `-`                           |
| deleted_by        | `uuid`               | YES      | `-`                           |
| deletion_reason   | `text`               | YES      | `-`                           |
| pricing_plan_id   | `uuid`               | YES      | `-`                           |
| client_po_number  | `varchar`            | YES      | `-`                           |
| discount_amount   | `numeric`            | YES      | `-`                           |
| discount_reason   | `text`               | YES      | `-`                           |
| status            | `trp_invoice_status` | YES      | `'draft'::trp_invoice_status` |
| paid_at           | `timestamptz`        | YES      | `-`                           |
| payment_reference | `varchar`            | YES      | `-`                           |
| payment_method    | `trp_payment_method` | YES      | `-`                           |

### trp_platform_account_keys

**Row Count:** ~0

| Column        | Type                        | Nullable | Default             |
| ------------- | --------------------------- | -------- | ------------------- |
| id            | `uuid`                      | NO       | `gen_random_uuid()` |
| account_id    | `uuid`                      | NO       | `-`                 |
| key_value     | `text`                      | NO       | `-`                 |
| key_type      | `platform_account_key_type` | NO       | `-`                 |
| expires_at    | `timestamptz`               | YES      | `-`                 |
| is_active     | `boolean`                   | YES      | `true`              |
| last_used_at  | `timestamptz`               | YES      | `-`                 |
| created_at    | `timestamptz`               | YES      | `now()`             |
| revoked_at    | `timestamptz`               | YES      | `-`                 |
| revoked_by    | `uuid`                      | YES      | `-`                 |
| revoke_reason | `text`                      | YES      | `-`                 |

### trp_platform_accounts

**Row Count:** ~0

| Column             | Type                      | Nullable | Default                             |
| ------------------ | ------------------------- | -------- | ----------------------------------- |
| id                 | `uuid`                    | NO       | `uuid_generate_v4()`                |
| tenant_id          | `uuid`                    | NO       | `-`                                 |
| platform_id        | `uuid`                    | NO       | `-`                                 |
| account_identifier | `text`                    | NO       | `-`                                 |
| api_key            | `text`                    | YES      | `-`                                 |
| metadata           | `jsonb`                   | NO       | `'{}'::jsonb`                       |
| created_at         | `timestamptz`             | NO       | `now()`                             |
| created_by         | `uuid`                    | YES      | `-`                                 |
| updated_at         | `timestamptz`             | NO       | `now()`                             |
| updated_by         | `uuid`                    | YES      | `-`                                 |
| deleted_at         | `timestamptz`             | YES      | `-`                                 |
| deleted_by         | `uuid`                    | YES      | `-`                                 |
| deletion_reason    | `text`                    | YES      | `-`                                 |
| account_name       | `varchar`                 | YES      | `-`                                 |
| status             | `platform_account_status` | YES      | `'active'::platform_account_status` |
| connected_at       | `timestamptz`             | YES      | `-`                                 |
| last_sync_at       | `timestamptz`             | YES      | `-`                                 |
| last_error         | `text`                    | YES      | `-`                                 |
| error_count        | `integer`                 | YES      | `0`                                 |
| sync_frequency     | `varchar`                 | YES      | `-`                                 |

### trp_settlements

**Row Count:** ~0

| Column                 | Type                | Nullable | Default                              |
| ---------------------- | ------------------- | -------- | ------------------------------------ |
| id                     | `uuid`              | NO       | `uuid_generate_v4()`                 |
| tenant_id              | `uuid`              | NO       | `-`                                  |
| trip_id                | `uuid`              | NO       | `-`                                  |
| settlement_reference   | `text`              | NO       | `-`                                  |
| amount                 | `numeric`           | NO       | `-`                                  |
| currency               | `varchar`           | NO       | `-`                                  |
| platform_commission    | `numeric`           | NO       | `-`                                  |
| net_amount             | `numeric`           | NO       | `-`                                  |
| settlement_date        | `date`              | NO       | `-`                                  |
| metadata               | `jsonb`             | NO       | `'{}'::jsonb`                        |
| created_at             | `timestamptz`       | NO       | `now()`                              |
| created_by             | `uuid`              | YES      | `-`                                  |
| updated_at             | `timestamptz`       | NO       | `now()`                              |
| updated_by             | `uuid`              | YES      | `-`                                  |
| deleted_at             | `timestamptz`       | YES      | `-`                                  |
| deleted_by             | `uuid`              | YES      | `-`                                  |
| deletion_reason        | `text`              | YES      | `-`                                  |
| platform_account_id    | `uuid`              | YES      | `-`                                  |
| settlement_type        | `settlement_type`   | YES      | `'platform_payout'::settlement_type` |
| platform_settlement_id | `varchar`           | YES      | `-`                                  |
| commission             | `numeric`           | YES      | `-`                                  |
| tax_amount             | `numeric`           | YES      | `-`                                  |
| tax_rate               | `numeric`           | YES      | `-`                                  |
| exchange_rate          | `numeric`           | YES      | `-`                                  |
| original_currency      | `character`         | YES      | `-`                                  |
| original_amount        | `numeric`           | YES      | `-`                                  |
| status                 | `settlement_status` | YES      | `'pending'::settlement_status`       |
| paid_at                | `timestamptz`       | YES      | `-`                                  |
| cancelled_at           | `timestamptz`       | YES      | `-`                                  |
| reconciled             | `boolean`           | YES      | `false`                              |
| reconciliation_id      | `uuid`              | YES      | `-`                                  |

### trp_trips

**Row Count:** ~0

| Column              | Type          | Nullable | Default              |
| ------------------- | ------------- | -------- | -------------------- |
| id                  | `uuid`        | NO       | `uuid_generate_v4()` |
| tenant_id           | `uuid`        | NO       | `-`                  |
| driver_id           | `uuid`        | NO       | `-`                  |
| vehicle_id          | `uuid`        | YES      | `-`                  |
| platform_id         | `uuid`        | YES      | `-`                  |
| pickup_latitude     | `numeric`     | YES      | `-`                  |
| pickup_longitude    | `numeric`     | YES      | `-`                  |
| start_time          | `timestamptz` | YES      | `-`                  |
| dropoff_latitude    | `numeric`     | YES      | `-`                  |
| dropoff_longitude   | `numeric`     | YES      | `-`                  |
| end_time            | `timestamptz` | YES      | `-`                  |
| distance_km         | `numeric`     | YES      | `-`                  |
| duration_minutes    | `numeric`     | YES      | `-`                  |
| payment_method      | `varchar`     | YES      | `-`                  |
| platform_commission | `numeric`     | YES      | `-`                  |
| net_earnings        | `numeric`     | YES      | `-`                  |
| created_at          | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| updated_at          | `timestamptz` | NO       | `CURRENT_TIMESTAMP`  |
| deleted_at          | `timestamptz` | YES      | `-`                  |
| client_id           | `uuid`        | YES      | `-`                  |
| trip_date           | `date`        | YES      | `-`                  |
| fare_base           | `numeric`     | YES      | `-`                  |
| fare_distance       | `numeric`     | YES      | `-`                  |
| fare_time           | `numeric`     | YES      | `-`                  |
| surge_multiplier    | `numeric`     | YES      | `-`                  |
| tip_amount          | `numeric`     | YES      | `-`                  |
| platform_account_id | `uuid`        | YES      | `-`                  |
| platform_trip_id    | `varchar`     | YES      | `-`                  |
| requested_at        | `timestamptz` | YES      | `-`                  |
| matched_at          | `timestamptz` | YES      | `-`                  |
| accepted_at         | `timestamptz` | YES      | `-`                  |
| arrived_at          | `timestamptz` | YES      | `-`                  |
| started_at          | `timestamptz` | YES      | `-`                  |
| finished_at         | `timestamptz` | YES      | `-`                  |
| pickup_lat          | `numeric`     | YES      | `-`                  |
| pickup_lng          | `numeric`     | YES      | `-`                  |
| dropoff_lat         | `numeric`     | YES      | `-`                  |
| dropoff_lng         | `numeric`     | YES      | `-`                  |
| distance            | `numeric`     | YES      | `-`                  |
| duration            | `integer`     | YES      | `-`                  |
| base_fare           | `numeric`     | YES      | `-`                  |
| distance_fare       | `numeric`     | YES      | `-`                  |
| time_fare           | `numeric`     | YES      | `-`                  |
| surge_amount        | `numeric`     | YES      | `-`                  |
| total_fare          | `numeric`     | YES      | `-`                  |
| currency            | `character`   | YES      | `-`                  |
| status              | `trip_status` | YES      | `-`                  |
| metadata            | `jsonb`       | YES      | `-`                  |
| created_by          | `uuid`        | YES      | `-`                  |
| updated_by          | `uuid`        | YES      | `-`                  |
| deleted_by          | `uuid`        | YES      | `-`                  |
| deletion_reason     | `text`        | YES      | `-`                  |

## Views and Other Tables

### v_fk

**Row Count:** ~1

| Column | Type     | Nullable | Default |
| ------ | -------- | -------- | ------- |
| count  | `bigint` | YES      | `-`     |

## Enum Types

This section lists all custom enum types defined in the database.

### `access_level`

```
private, public, signed
```

### `account_status`

```
active, suspended, closed
```

### `address_type`

```
billing, shipping
```

### `aggregation_method`

```
sum, max, avg, last
```

### `aggregation_type`

```
sum, avg, count, min, max
```

### `allocation_rule`

```
driver, fleet, shared, client
```

### `appeal_status`

```
not_applicable, pending, under_review, accepted, rejected
```

### `approval_status`

```
pending, approved, rejected, cancelled, auto_approved
```

### `assignment_status`

```
active, completed, cancelled
```

### `assignment_type`

```
permanent, temporary, trial
```

### `audit_category`

```
security, financial, compliance, operational
```

### `audit_severity`

```
info, warning, error, critical
```

### `batch_type`

```
WPS, SEPA, local
```

### `billing_interval`

```
month, year
```

### `billing_plan_status`

```
draft, active, deprecated, archived
```

### `blacklist_category`

```
disciplinary, administrative, legal, safety, financial, performance, contract_breach, criminal, voluntary
```

### `blacklist_severity`

```
low, medium, high, critical
```

### `blacklist_status`

```
active, expired, revoked, appealed_lifted
```

### `body_type`

```
sedan, hatchback, suv, van, minivan, pickup, coupe, wagon, limousine, other
```

### `car_model_status`

```
active, inactive, discontinued
```

### `claim_status`

```
filed, processing, approved, rejected, closed
```

### `compensation_model`

```
fixed_rental, percentage_split, salary, crew_rental, buyout, custom
```

### `contract_status`

```
draft, negotiation, signed, active, future, expired, terminated, renewal_in_progress, cancelled
```

### `cooperation_status`

```
pending, active, expired, terminated
```

### `cooperation_type`

```
employee, contractor, owner_operator, partner_driver
```

### `coverage_drivers`

```
named, any, professional
```

### `department`

```
support, tech, finance, sales
```

### `dispute_status`

```
pending, accepted, rejected
```

### `document_status`

```
active, expired, archived
```

### `document_verification_status`

```
pending, verified, rejected, expired
```

### `driver_document_type`

```
driving_license, professional_card, national_id, passport, visa, work_permit, residence_permit, proof_of_address, criminal_record, medical_certificate, vehicle_registration, insurance_policy, contract_signed, bank_statement, other
```

### `driver_request_type`

```
leave, vehicle_change, schedule_change, expense_reimbursement, advance_payment, document_update, complaint, support, contract_modification, termination, other
```

### `driver_revenue_period_type`

```
week, biweekly, month
```

### `driver_revenue_status`

```
pending, validated, adjusted, disputed
```

### `driver_status`

```
active, inactive, suspended, terminated
```

### `employee_role`

```
support_agent, admin, super_admin
```

### `equipment_condition`

```
new_item, excellent, good, fair, poor, damaged
```

### `equipment_status`

```
provided, returned, lost, damaged, stolen
```

### `equipment_type`

```
dashcam, gps_tracker, tablet, phone_charger, phone_mount, spare_tire, jack, warning_triangle, first_aid_kit, fire_extinguisher, reflective_vest, other
```

### `event_severity`

```
minor, moderate, major, total_loss
```

### `expense_category`

```
fuel, toll, parking, wash, repair, fine, insurance_deductible, registration, inspection, permit, other
```

### `finance_payment_method`

```
bank_transfer, mobile_money, cash
```

### `fuel_type`

```
gasoline, diesel, hybrid, electric, plugin_hybrid, cng, lpg, hydrogen
```

### `goal_category`

```
revenue, trips, quality, efficiency, safety
```

### `goal_period_type`

```
daily, weekly, monthly, quarterly, yearly
```

### `goal_reward_type`

```
bonus, certificate, badge, promotion
```

### `goal_status`

```
active, in_progress, completed, cancelled, expired, on_track, at_risk, achieved, exceeded
```

### `goal_target_type`

```
individual, team, branch, company
```

### `goal_threshold`

```
bronze, silver, gold, exceeded
```

### `handover_type`

```
pickup, return, transfer
```

### `inspection_status`

```
scheduled, passed, failed, pending, cancelled
```

### `inspection_type`

```
annual, pre_trip, post_accident, regulatory, pre_sale, custom
```

### `insurance_status`

```
active, expired, cancelled, suspended
```

### `invitation_status`

```
pending, accepted, expired, revoked
```

### `invitation_type`

```
initial_admin, additional_user, role_change, reactivation
```

### `invoice_line_source_type`

```
billing_plan, usage_metric, manual, promotion
```

### `invoice_line_type`

```
plan_fee, overage_fee, tax, discount, other
```

### `invoice_status`

```
draft, sent, paid, overdue, void, uncollectible
```

### `lead_priority`

```
low, medium, high, urgent
```

### `lead_stage`

```
top_of_funnel, marketing_qualified, sales_qualified, opportunity
```

### `lead_status`

```
new, qualified, converted, lost, working
```

### `lifecycle_event_type`

```
created, trial_started, trial_extended, activated, plan_upgraded, plan_downgraded, suspended, reactivated, cancelled, archived, deleted
```

### `lifecycle_status`

```
active, inactive, deprecated
```

### `maintenance_category`

```
preventive, corrective, regulatory, emergency
```

### `maintenance_priority`

```
low, medium, high, urgent, emergency
```

### `maintenance_status`

```
scheduled, in_progress, completed, cancelled, deferred
```

### `maintenance_trigger_type`

```
mileage_based, time_based, condition_based, manual
```

### `maintenance_type`

```
oil_change, tire_rotation, brake_service, engine_service, transmission_service, battery_replacement, air_filter, coolant_flush, alignment, inspection, other
```

### `member_status`

```
invited, active, suspended, terminated
```

### `message_type`

```
public, internal, note
```

### `metric_source`

```
internal, api, import, calculated
```

### `notification_channel`

```
email, sms, slack, webhook, push
```

### `notification_status`

```
pending, sent, delivered, bounced, opened, clicked, failed
```

### `opportunity_stage`

```
prospect, proposal, negotiation, closed
```

### `opportunity_status`

```
open, won, lost, on_hold, cancelled
```

### `paid_by`

```
company, driver, platform, government
```

### `payment_frequency`

```
annual, semi_annual, quarterly, monthly
```

### `payment_method`

```
direct_debit, bank_transfer, credit_card, cash, cheque
```

### `payment_method_status`

```
active, inactive, expired, failed, pending_verification
```

### `payment_method_type`

```
cash, card, wallet, mixed
```

### `payment_status`

```
pending, processed, failed, refunded
```

### `payment_type`

```
card, bank_account, paypal, apple_pay, google_pay, other
```

### `payroll_cycle`

```
monthly, semi_monthly, weekly, custom
```

### `performed_by_type`

```
system, employee, api
```

### `period_type`

```
day, week, month
```

### `platform_account_key_type`

```
read_only, read_write, admin
```

### `platform_account_status`

```
active, inactive, suspended
```

### `policy_category`

```
main, supplementary, temporary, rider
```

### `preferred_payment_method`

```
bank_transfer, cash, mobile_wallet
```

### `promotion_applies_to`

```
first_invoice, all_invoices, specific_plan
```

### `promotion_discount_type`

```
percentage, fixed_amount
```

### `promotion_status`

```
active, expired, exhausted, disabled
```

### `provider_type`

```
internal, external, online_platform, government
```

### `queue_status`

```
pending, processing, sent, failed, cancelled
```

### `receipt_status`

```
pending, verified, invalid, missing
```

### `reconciliation_status`

```
pending, matched, mismatched, adjusted, cancelled
```

### `reconciliation_type`

```
platform_payment, cash_collection, bank_statement, adjustment
```

### `regulation_status`

```
active, inactive
```

### `renewal_type`

```
automatic, optional, perpetual, non_renewing
```

### `repair_status`

```
pending, approved, in_progress, completed, cancelled
```

### `request_priority`

```
low, normal, high, urgent
```

### `request_status`

```
pending, under_review, approved, rejected, cancelled, completed
```

### `responsible_party`

```
fleet, driver, third_party
```

### `revenue_import_source_type`

```
api, file_csv, file_excel, manual
```

### `revenue_import_status`

```
pending, processing, completed, partially_completed, failed, cancelled
```

### `risk_rating`

```
A, B, C, D, E
```

### `scope_type`

```
global, branch, team
```

### `service_type`

```
ride, support, maintenance, other
```

### `settlement_status`

```
pending, settled, cancelled
```

### `settlement_type`

```
platform_payout, adjustment, refund, bonus
```

### `shift_status`

```
scheduled, completed, cancelled, no_show, partial
```

### `shift_type`

```
day, night, weekend, peak_hour, special_event
```

### `signature_method`

```
digital, wet_signature, app, email
```

### `storage_provider`

```
supabase, s3, azure_blob, gcs
```

### `submitter_type`

```
driver, client, member, guest
```

### `subscription_status`

```
trialing, active, past_due, suspended, cancelling, cancelled, inactive
```

### `task_category`

```
admin, maintenance, document, training, support
```

### `task_change_type`

```
created, assigned, status_changed, escalated

## Foreign Key Relationships

This section provides a summary of foreign key relationships between tables.

| Table | Column | References Table | References Column |
|-------|--------|------------------|-------------------|
| adm_audit_logs | `member_id` | adm_members | `id` |
| adm_audit_logs | `tenant_id` | adm_tenants | `id` |
| adm_invitations | `accepted_by_member_id` | adm_members | `id` |
| adm_invitations | `sent_by` | adm_provider_employees | `id` |
| adm_invitations | `tenant_id` | adm_tenants | `id` |
| adm_member_roles | `assigned_by` | adm_members | `id` |
| adm_member_roles | `created_by` | adm_members | `id` |
| adm_member_roles | `deleted_by` | adm_members | `id` |
| adm_member_roles | `member_id` | adm_members | `id` |
| adm_member_roles | `role_id` | adm_roles | `id` |
| adm_member_roles | `tenant_id` | adm_tenants | `id` |
| adm_member_roles | `updated_by` | adm_members | `id` |
| adm_member_sessions | `member_id` | adm_members | `id` |
| adm_members | `created_by` | adm_members | `id` |
| adm_members | `default_role_id` | adm_roles | `id` |
| adm_members | `deleted_by` | adm_members | `id` |
| adm_members | `tenant_id` | adm_tenants | `id` |
| adm_members | `updated_by` | adm_members | `id` |
| adm_notification_logs | `created_by` | adm_members | `id` |
| adm_notification_logs | `deleted_by` | adm_members | `id` |
| adm_notification_logs | `recipient_id` | adm_members | `id` |
| adm_notification_logs | `tenant_id` | adm_tenants | `id` |
| adm_notification_logs | `updated_by` | adm_members | `id` |
| adm_provider_employees | `created_by` | adm_provider_employees | `id` |
| adm_provider_employees | `deleted_by` | adm_provider_employees | `id` |
| adm_provider_employees | `supervisor_id` | adm_provider_employees | `id` |
| adm_provider_employees | `updated_by` | adm_provider_employees | `id` |
| adm_role_permissions | `role_id` | adm_roles | `id` |
| adm_role_versions | `changed_by` | adm_members | `id` |
| adm_role_versions | `role_id` | adm_roles | `id` |
| adm_roles | `created_by` | adm_members | `id` |
| adm_roles | `deleted_by` | adm_members | `id` |
| adm_roles | `parent_role_id` | adm_roles | `id` |
| adm_roles | `tenant_id` | adm_tenants | `id` |
| adm_roles | `updated_by` | adm_members | `id` |
| adm_tenant_lifecycle_events | `performed_by` | adm_provider_employees | `id` |
| adm_tenant_lifecycle_events | `tenant_id` | adm_tenants | `id` |
| adm_tenant_settings | `tenant_id` | adm_tenants | `id` |
| adm_tenant_vehicle_classes | `based_on_class_id` | dir_vehicle_classes | `id` |
| adm_tenant_vehicle_classes | `created_by` | adm_members | `id` |
| adm_tenant_vehicle_classes | `deleted_by` | adm_members | `id` |
| adm_tenant_vehicle_classes | `tenant_id` | adm_tenants | `id` |
| adm_tenant_vehicle_classes | `updated_by` | adm_members | `id` |
| bil_billing_plans | `created_by` | adm_provider_employees | `id` |
| bil_billing_plans | `deleted_by` | adm_provider_employees | `id` |
| bil_billing_plans | `updated_by` | adm_provider_employees | `id` |
| bil_payment_methods | `created_by` | adm_provider_employees | `id` |
| bil_payment_methods | `deleted_by` | adm_provider_employees | `id` |
| bil_payment_methods | `tenant_id` | adm_tenants | `id` |
| bil_payment_methods | `updated_by` | adm_provider_employees | `id` |
| bil_promotion_usage | `invoice_id` | bil_tenant_invoices | `id` |
| bil_promotion_usage | `promotion_id` | bil_promotions | `id` |
| bil_promotion_usage | `tenant_id` | adm_tenants | `id` |
| bil_promotions | `created_by` | adm_provider_employees | `id` |
| bil_promotions | `plan_id` | bil_billing_plans | `id` |
| bil_tenant_invoice_lines | `created_by` | adm_provider_employees | `id` |
| bil_tenant_invoice_lines | `deleted_by` | adm_provider_employees | `id` |
| bil_tenant_invoice_lines | `invoice_id` | bil_tenant_invoices | `id` |
| bil_tenant_invoice_lines | `updated_by` | adm_provider_employees | `id` |
| bil_tenant_invoices | `created_by` | adm_provider_employees | `id` |
| bil_tenant_invoices | `deleted_by` | adm_provider_employees | `id` |
| bil_tenant_invoices | `subscription_id` | bil_tenant_subscriptions | `id` |
| bil_tenant_invoices | `tenant_id` | adm_tenants | `id` |
| bil_tenant_invoices | `updated_by` | adm_provider_employees | `id` |
| bil_tenant_subscriptions | `created_by` | adm_provider_employees | `id` |
| bil_tenant_subscriptions | `deleted_by` | adm_provider_employees | `id` |
| bil_tenant_subscriptions | `payment_method_id` | bil_payment_methods | `id` |
| bil_tenant_subscriptions | `plan_id` | bil_billing_plans | `id` |
| bil_tenant_subscriptions | `previous_plan_id` | bil_billing_plans | `id` |
| bil_tenant_subscriptions | `tenant_id` | adm_tenants | `id` |
| bil_tenant_subscriptions | `updated_by` | adm_provider_employees | `id` |
| bil_tenant_usage_metrics | `created_by` | adm_provider_employees | `id` |
| bil_tenant_usage_metrics | `deleted_by` | adm_provider_employees | `id` |
| bil_tenant_usage_metrics | `metric_type_id` | bil_usage_metric_types | `id` |
| bil_tenant_usage_metrics | `subscription_id` | bil_tenant_subscriptions | `id` |
| bil_tenant_usage_metrics | `tenant_id` | adm_tenants | `id` |
| bil_tenant_usage_metrics | `updated_by` | adm_provider_employees | `id` |
| crm_contracts | `approved_by` | adm_provider_employees | `id` |
| crm_contracts | `billing_address_id` | crm_addresses | `id` |
| crm_contracts | `created_by` | adm_members | `id` |
| crm_contracts | `created_by` | adm_provider_employees | `id` |
| crm_contracts | `deleted_by` | adm_members | `id` |
| crm_contracts | `deleted_by` | adm_provider_employees | `id` |
| crm_contracts | `lead_id` | crm_leads | `id` |
| crm_contracts | `opportunity_id` | crm_opportunities | `id` |
| crm_contracts | `plan_id` | bil_billing_plans | `id` |
| crm_contracts | `renewed_from_contract_id` | crm_contracts | `id` |
| crm_contracts | `subscription_id` | bil_tenant_subscriptions | `id` |
| crm_contracts | `tenant_id` | adm_tenants | `id` |
| crm_contracts | `updated_by` | adm_members | `id` |
| crm_contracts | `updated_by` | adm_provider_employees | `id` |
| crm_lead_activities | `lead_id` | crm_leads | `id` |
| crm_leads | `assigned_to` | adm_provider_employees | `id` |
| crm_leads | `country_code` | crm_countries | `country_code` |
| crm_leads | `created_by` | adm_provider_employees | `id` |
| crm_leads | `deleted_by` | adm_provider_employees | `id` |
| crm_leads | `opportunity_id` | crm_opportunities | `id` |
| crm_leads | `source_id` | crm_lead_sources | `id` |
| crm_leads | `updated_by` | adm_provider_employees | `id` |
| crm_opportunities | `assigned_to` | adm_members | `id` |
| crm_opportunities | `assigned_to` | adm_provider_employees | `id` |
| crm_opportunities | `contract_id` | crm_contracts | `id` |
| crm_opportunities | `created_by` | adm_members | `id` |
| crm_opportunities | `created_by` | adm_provider_employees | `id` |
| crm_opportunities | `deleted_by` | adm_members | `id` |
| crm_opportunities | `deleted_by` | adm_provider_employees | `id` |
| crm_opportunities | `lead_id` | crm_leads | `id` |
| crm_opportunities | `owner_id` | adm_provider_employees | `id` |
| crm_opportunities | `pipeline_id` | crm_pipelines | `id` |
| crm_opportunities | `plan_id` | bil_billing_plans | `id` |
| crm_opportunities | `updated_by` | adm_members | `id` |
| crm_opportunities | `updated_by` | adm_provider_employees | `id` |
| crm_settings | `created_by` | adm_provider_employees | `id` |
| crm_settings | `deleted_by` | adm_provider_employees | `id` |
| crm_settings | `updated_by` | adm_provider_employees | `id` |
| dir_car_makes | `created_by` | adm_provider_employees | `id` |
| dir_car_makes | `deleted_by` | adm_provider_employees | `id` |
| dir_car_makes | `tenant_id` | adm_tenants | `id` |
| dir_car_makes | `updated_by` | adm_provider_employees | `id` |
| dir_car_models | `created_by` | adm_provider_employees | `id` |
| dir_car_models | `deleted_by` | adm_provider_employees | `id` |
| dir_car_models | `make_id` | dir_car_makes | `id` |
| dir_car_models | `tenant_id` | adm_tenants | `id` |
| dir_car_models | `updated_by` | adm_provider_employees | `id` |
| dir_car_models | `vehicle_class_id` | dir_vehicle_classes | `id` |
| dir_country_locales | `created_by` | adm_provider_employees | `id` |
| dir_country_locales | `deleted_by` | adm_provider_employees | `id` |
| dir_country_locales | `updated_by` | adm_provider_employees | `id` |
| dir_country_regulations | `created_by` | adm_provider_employees | `id` |
| dir_country_regulations | `deleted_by` | adm_provider_employees | `id` |
| dir_country_regulations | `min_vehicle_class_id` | dir_vehicle_classes | `id` |
| dir_country_regulations | `updated_by` | adm_provider_employees | `id` |
| dir_maintenance_types | `tenant_id` | adm_tenants | `id` |
| dir_notification_templates | `created_by` | adm_provider_employees | `id` |
| dir_notification_templates | `deleted_by` | adm_provider_employees | `id` |
| dir_notification_templates | `updated_by` | adm_provider_employees | `id` |
| dir_ownership_types | `created_by` | adm_provider_employees | `id` |
| dir_ownership_types | `deleted_by` | adm_provider_employees | `id` |
| dir_ownership_types | `updated_by` | adm_provider_employees | `id` |
| dir_platform_configs | `created_by` | adm_provider_employees | `id` |
| dir_platform_configs | `deleted_by` | adm_provider_employees | `id` |
| dir_platform_configs | `platform_id` | dir_platforms | `id` |
| dir_platform_configs | `tenant_id` | adm_tenants | `id` |
| dir_platform_configs | `updated_by` | adm_provider_employees | `id` |
| dir_platforms | `created_by` | adm_provider_employees | `id` |
| dir_platforms | `deleted_by` | adm_provider_employees | `id` |
| dir_platforms | `updated_by` | adm_provider_employees | `id` |
| dir_toll_gates | `country_code` | dir_country_regulations | `country_code` |
| dir_vehicle_classes | `country_code` | dir_country_regulations | `country_code` |
| dir_vehicle_classes | `created_by` | adm_provider_employees | `id` |
| dir_vehicle_classes | `deleted_by` | adm_provider_employees | `id` |
| dir_vehicle_classes | `updated_by` | adm_provider_employees | `id` |
| dir_vehicle_statuses | `created_by` | adm_provider_employees | `id` |
| dir_vehicle_statuses | `deleted_by` | adm_provider_employees | `id` |
| dir_vehicle_statuses | `updated_by` | adm_provider_employees | `id` |
| doc_document_types | `created_by` | adm_provider_employees | `id` |
| doc_document_types | `deleted_by` | adm_provider_employees | `id` |
| doc_document_types | `updated_by` | adm_provider_employees | `id` |
| doc_document_versions | `created_by` | adm_members | `id` |
| doc_document_versions | `document_id` | doc_documents | `id` |
| doc_documents | `created_by` | adm_members | `id` |
| doc_documents | `deleted_by` | adm_members | `id` |
| doc_documents | `document_type` | doc_document_types | `code` |
| doc_documents | `entity_type` | doc_entity_types | `code` |
| doc_documents | `tenant_id` | adm_tenants | `id` |
| doc_documents | `updated_by` | adm_members | `id` |
| doc_documents | `verified_by` | adm_members | `id` |
| doc_entity_types | `created_by` | adm_provider_employees | `id` |
| doc_entity_types | `deleted_by` | adm_provider_employees | `id` |
| doc_entity_types | `updated_by` | adm_provider_employees | `id` |
| fin_accounts | `account_type` | fin_account_types | `code` |
| fin_accounts | `created_by` | adm_members | `id` |
| fin_accounts | `deleted_by` | adm_members | `id` |
| fin_accounts | `tenant_id` | adm_tenants | `id` |
| fin_accounts | `updated_by` | adm_members | `id` |
| fin_driver_payment_batches | `created_by` | adm_members | `id` |
| fin_driver_payment_batches | `created_by` | adm_provider_employees | `id` |
| fin_driver_payment_batches | `deleted_by` | adm_members | `id` |
| fin_driver_payment_batches | `deleted_by` | adm_provider_employees | `id` |
| fin_driver_payment_batches | `payout_account_id` | fin_accounts | `id` |
| fin_driver_payment_batches | `status` | fin_payment_batch_statuses | `code` |
| fin_driver_payment_batches | `tenant_id` | adm_tenants | `id` |
| fin_driver_payment_batches | `updated_by` | adm_members | `id` |
| fin_driver_payment_batches | `updated_by` | adm_provider_employees | `id` |
| fin_driver_payments | `created_by` | adm_members | `id` |
| fin_driver_payments | `created_by` | adm_provider_employees | `id` |
| fin_driver_payments | `deleted_by` | adm_members | `id` |
| fin_driver_payments | `deleted_by` | adm_provider_employees | `id` |
| fin_driver_payments | `driver_id` | rid_drivers | `id` |
| fin_driver_payments | `payment_batch_id` | fin_driver_payment_batches | `id` |
| fin_driver_payments | `payout_account_id` | fin_accounts | `id` |
| fin_driver_payments | `status` | fin_payment_statuses | `code` |
| fin_driver_payments | `tenant_id` | adm_tenants | `id` |
| fin_driver_payments | `updated_by` | adm_members | `id` |
| fin_driver_payments | `updated_by` | adm_provider_employees | `id` |
| fin_toll_transactions | `created_by` | adm_members | `id` |
| fin_toll_transactions | `deleted_by` | adm_members | `id` |
| fin_toll_transactions | `driver_id` | rid_drivers | `id` |
| fin_toll_transactions | `driver_payment_id` | fin_driver_payments | `id` |
| fin_toll_transactions | `payment_batch_id` | fin_driver_payment_batches | `id` |
| fin_toll_transactions | `tenant_id` | adm_tenants | `id` |
| fin_toll_transactions | `toll_gate_id` | dir_toll_gates | `id` |
| fin_toll_transactions | `trip_id` | trp_trips | `id` |
| fin_toll_transactions | `updated_by` | adm_members | `id` |
| fin_toll_transactions | `vehicle_id` | flt_vehicles | `id` |
| fin_traffic_fine_disputes | `fine_id` | fin_traffic_fines | `id` |
| fin_traffic_fine_disputes | `reviewed_by` | adm_members | `id` |
| fin_traffic_fine_disputes | `submitted_by` | adm_members | `id` |
| fin_traffic_fines | `created_by` | adm_members | `id` |
| fin_traffic_fines | `deleted_by` | adm_members | `id` |
| fin_traffic_fines | `dispute_id` | fin_traffic_fine_disputes | `id` |
| fin_traffic_fines | `driver_id` | rid_drivers | `id` |
| fin_traffic_fines | `driver_payment_id` | fin_driver_payments | `id` |
| fin_traffic_fines | `fine_type_id` | dir_fine_types | `id` |
| fin_traffic_fines | `payment_method_id` | bil_payment_methods | `id` |
| fin_traffic_fines | `tenant_id` | adm_tenants | `id` |
| fin_traffic_fines | `updated_by` | adm_members | `id` |
| fin_traffic_fines | `vehicle_id` | flt_vehicles | `id` |
| fin_transaction_categories | `parent_category_id` | fin_transaction_categories | `id` |
| fin_transactions | `account_id` | fin_accounts | `id` |
| fin_transactions | `category_id` | fin_transaction_categories | `id` |
| fin_transactions | `counterparty_account_id` | fin_accounts | `id` |
| fin_transactions | `created_by` | adm_members | `id` |
| fin_transactions | `deleted_by` | adm_members | `id` |
| fin_transactions | `payment_method_id` | bil_payment_methods | `id` |
| fin_transactions | `status` | dir_transaction_statuses | `code` |
| fin_transactions | `tenant_id` | adm_tenants | `id` |
| fin_transactions | `transaction_type` | dir_transaction_types | `code` |
| fin_transactions | `updated_by` | adm_members | `id` |
| fin_transactions | `validated_by` | adm_members | `id` |
| flt_vehicle_assignments | `created_by` | adm_members | `id` |
| flt_vehicle_assignments | `created_by` | adm_provider_employees | `id` |
| flt_vehicle_assignments | `deleted_by` | adm_members | `id` |
| flt_vehicle_assignments | `deleted_by` | adm_provider_employees | `id` |
| flt_vehicle_assignments | `driver_id` | rid_drivers | `id` |
| flt_vehicle_assignments | `tenant_id` | adm_tenants | `id` |
| flt_vehicle_assignments | `updated_by` | adm_members | `id` |
| flt_vehicle_assignments | `updated_by` | adm_provider_employees | `id` |
| flt_vehicle_assignments | `vehicle_id` | flt_vehicles | `id` |
| flt_vehicle_equipments | `created_by` | adm_provider_employees | `id` |
| flt_vehicle_equipments | `current_assignment_id` | flt_vehicle_assignments | `id` |
| flt_vehicle_equipments | `deleted_by` | adm_provider_employees | `id` |
| flt_vehicle_equipments | `tenant_id` | adm_tenants | `id` |
| flt_vehicle_equipments | `updated_by` | adm_provider_employees | `id` |
| flt_vehicle_equipments | `vehicle_id` | flt_vehicles | `id` |
| flt_vehicle_events | `assignment_id` | flt_vehicle_assignments | `id` |
| flt_vehicle_events | `created_by` | adm_members | `id` |
| flt_vehicle_events | `created_by` | adm_provider_employees | `id` |
| flt_vehicle_events | `deleted_by` | adm_members | `id` |
| flt_vehicle_events | `deleted_by` | adm_provider_employees | `id` |
| flt_vehicle_events | `driver_id` | rid_drivers | `id` |
| flt_vehicle_events | `tenant_id` | adm_tenants | `id` |
| flt_vehicle_events | `updated_by` | adm_members | `id` |
| flt_vehicle_events | `updated_by` | adm_provider_employees | `id` |
| flt_vehicle_events | `vehicle_id` | flt_vehicles | `id` |
| flt_vehicle_expenses | `approved_by` | adm_provider_employees | `id` |
| flt_vehicle_expenses | `created_by` | adm_members | `id` |
| flt_vehicle_expenses | `created_by` | adm_provider_employees | `id` |
| flt_vehicle_expenses | `deleted_by` | adm_members | `id` |
| flt_vehicle_expenses | `deleted_by` | adm_provider_employees | `id` |
| flt_vehicle_expenses | `driver_id` | rid_drivers | `id` |
| flt_vehicle_expenses | `receipt_verified_by` | adm_provider_employees | `id` |
| flt_vehicle_expenses | `ride_id` | trp_trips | `id` |
| flt_vehicle_expenses | `tenant_id` | adm_tenants | `id` |
| flt_vehicle_expenses | `updated_by` | adm_members | `id` |
| flt_vehicle_expenses | `updated_by` | adm_provider_employees | `id` |
| flt_vehicle_expenses | `vehicle_id` | flt_vehicles | `id` |
| flt_vehicle_inspections | `created_by` | adm_provider_employees | `id` |
| flt_vehicle_inspections | `tenant_id` | adm_tenants | `id` |
| flt_vehicle_inspections | `updated_by` | adm_provider_employees | `id` |
| flt_vehicle_inspections | `vehicle_id` | flt_vehicles | `id` |
| flt_vehicle_insurances | `created_by` | adm_members | `id` |
| flt_vehicle_insurances | `created_by` | adm_provider_employees | `id` |
| flt_vehicle_insurances | `deleted_by` | adm_members | `id` |
| flt_vehicle_insurances | `deleted_by` | adm_provider_employees | `id` |
| flt_vehicle_insurances | `parent_policy_id` | flt_vehicle_insurances | `id` |
| flt_vehicle_insurances | `tenant_id` | adm_tenants | `id` |
| flt_vehicle_insurances | `updated_by` | adm_members | `id` |
| flt_vehicle_insurances | `updated_by` | adm_provider_employees | `id` |
| flt_vehicle_insurances | `vehicle_id` | flt_vehicles | `id` |
| flt_vehicle_maintenance | `approved_by` | adm_provider_employees | `id` |
| flt_vehicle_maintenance | `created_by` | adm_members | `id` |
| flt_vehicle_maintenance | `created_by` | adm_provider_employees | `id` |
| flt_vehicle_maintenance | `deleted_by` | adm_provider_employees | `id` |
| flt_vehicle_maintenance | `quality_check_by` | adm_provider_employees | `id` |
| flt_vehicle_maintenance | `requested_by` | adm_provider_employees | `id` |
| flt_vehicle_maintenance | `tenant_id` | adm_tenants | `id` |
| flt_vehicle_maintenance | `updated_by` | adm_members | `id` |
| flt_vehicle_maintenance | `updated_by` | adm_provider_employees | `id` |
| flt_vehicle_maintenance | `vehicle_id` | flt_vehicles | `id` |
| flt_vehicles | `country_code` | dir_country_regulations | `country_code` |
| flt_vehicles | `created_by` | adm_members | `id` |
| flt_vehicles | `created_by` | adm_provider_employees | `id` |
| flt_vehicles | `deleted_by` | adm_members | `id` |
| flt_vehicles | `deleted_by` | adm_provider_employees | `id` |
| flt_vehicles | `make_id` | dir_car_makes | `id` |
| flt_vehicles | `model_id` | dir_car_models | `id` |
| flt_vehicles | `ownership_type_id` | dir_ownership_types | `id` |
| flt_vehicles | `status_id` | dir_vehicle_statuses | `id` |
| flt_vehicles | `tenant_id` | adm_tenants | `id` |
| flt_vehicles | `updated_by` | adm_members | `id` |
| flt_vehicles | `updated_by` | adm_provider_employees | `id` |
| flt_vehicles | `vehicle_class_id` | dir_vehicle_classes | `id` |
| rev_driver_revenues | `created_by` | adm_members | `id` |
| rev_driver_revenues | `deleted_by` | adm_members | `id` |
| rev_driver_revenues | `driver_id` | rid_drivers | `id` |
| rev_driver_revenues | `import_id` | rev_revenue_imports | `id` |
| rev_driver_revenues | `platform_id` | dir_platforms | `id` |
| rev_driver_revenues | `tenant_id` | adm_tenants | `id` |
| rev_driver_revenues | `updated_by` | adm_members | `id` |
| rev_driver_revenues | `validated_by` | adm_members | `id` |
| rev_reconciliation_lines | `driver_id` | rid_drivers | `id` |
| rev_reconciliation_lines | `platform_id` | dir_platforms | `id` |
| rev_reconciliation_lines | `reconciliation_id` | rev_reconciliations | `id` |
| rev_reconciliations | `assigned_to` | adm_members | `id` |
| rev_reconciliations | `created_by` | adm_members | `id` |
| rev_reconciliations | `deleted_by` | adm_members | `id` |
| rev_reconciliations | `driver_id` | rid_drivers | `id` |
| rev_reconciliations | `import_id` | rev_revenue_imports | `id` |
| rev_reconciliations | `resolved_by` | adm_members | `id` |
| rev_reconciliations | `tenant_id` | adm_tenants | `id` |
| rev_reconciliations | `updated_by` | adm_members | `id` |
| rev_revenue_imports | `created_by` | adm_members | `id` |
| rev_revenue_imports | `deleted_by` | adm_members | `id` |
| rev_revenue_imports | `platform_id` | dir_platforms | `id` |
| rev_revenue_imports | `tenant_id` | adm_tenants | `id` |
| rev_revenue_imports | `updated_by` | adm_members | `id` |
| rid_driver_blacklists | `appeal_reviewed_by` | adm_members | `id` |
| rid_driver_blacklists | `created_by` | adm_members | `id` |
| rid_driver_blacklists | `decided_by` | adm_members | `id` |
| rid_driver_blacklists | `deleted_by` | adm_members | `id` |
| rid_driver_blacklists | `driver_id` | rid_drivers | `id` |
| rid_driver_blacklists | `legal_reviewed_by` | adm_members | `id` |
| rid_driver_blacklists | `reinstated_by` | adm_members | `id` |
| rid_driver_blacklists | `reviewed_by` | adm_members | `id` |
| rid_driver_blacklists | `tenant_id` | adm_tenants | `id` |
| rid_driver_blacklists | `updated_by` | adm_members | `id` |
| rid_driver_cooperation_terms | `created_by` | adm_members | `id` |
| rid_driver_cooperation_terms | `deleted_by` | adm_members | `id` |
| rid_driver_cooperation_terms | `driver_id` | rid_drivers | `id` |
| rid_driver_cooperation_terms | `legal_reviewed_by` | adm_members | `id` |
| rid_driver_cooperation_terms | `previous_version_id` | rid_driver_cooperation_terms | `id` |
| rid_driver_cooperation_terms | `tenant_id` | adm_tenants | `id` |
| rid_driver_cooperation_terms | `termination_initiated_by` | adm_members | `id` |
| rid_driver_cooperation_terms | `updated_by` | adm_members | `id` |
| rid_driver_documents | `created_by` | adm_members | `id` |
| rid_driver_documents | `deleted_by` | adm_members | `id` |
| rid_driver_documents | `document_id` | doc_documents | `id` |
| rid_driver_documents | `driver_id` | rid_drivers | `id` |
| rid_driver_documents | `replaced_document_id` | rid_driver_documents | `id` |
| rid_driver_documents | `tenant_id` | adm_tenants | `id` |
| rid_driver_documents | `updated_by` | adm_members | `id` |
| rid_driver_documents | `verified_by` | adm_members | `id` |
| rid_driver_languages | `created_by` | adm_members | `id` |
| rid_driver_languages | `deleted_by` | adm_members | `id` |
| rid_driver_languages | `driver_id` | rid_drivers | `id` |
| rid_driver_languages | `tenant_id` | adm_tenants | `id` |
| rid_driver_languages | `updated_by` | adm_members | `id` |
| rid_driver_performances | `created_by` | adm_members | `id` |
| rid_driver_performances | `deleted_by` | adm_members | `id` |
| rid_driver_performances | `driver_id` | rid_drivers | `id` |
| rid_driver_performances | `platform_id` | dir_platforms | `id` |
| rid_driver_performances | `tenant_id` | adm_tenants | `id` |
| rid_driver_performances | `updated_by` | adm_members | `id` |
| rid_driver_requests | `approved_by` | adm_members | `id` |
| rid_driver_requests | `assigned_to` | adm_members | `id` |
| rid_driver_requests | `created_by` | adm_members | `id` |
| rid_driver_requests | `deleted_by` | adm_members | `id` |
| rid_driver_requests | `driver_id` | rid_drivers | `id` |
| rid_driver_requests | `escalated_to` | adm_members | `id` |
| rid_driver_requests | `hr_approved_by` | adm_members | `id` |
| rid_driver_requests | `manager_approved_by` | adm_members | `id` |
| rid_driver_requests | `rejected_by` | adm_members | `id` |
| rid_driver_requests | `reviewed_by` | adm_members | `id` |
| rid_driver_requests | `tenant_id` | adm_tenants | `id` |
| rid_driver_requests | `updated_by` | adm_members | `id` |
| rid_driver_training | `created_by` | adm_members | `id` |
| rid_driver_training | `deleted_by` | adm_members | `id` |
| rid_driver_training | `driver_id` | rid_drivers | `id` |
| rid_driver_training | `evaluated_by` | adm_members | `id` |
| rid_driver_training | `provider_id` | adm_provider_employees | `id` |
| rid_driver_training | `tenant_id` | adm_tenants | `id` |
| rid_driver_training | `updated_by` | adm_members | `id` |
| rid_drivers | `created_by` | adm_provider_employees | `id` |
| rid_drivers | `deleted_by` | adm_provider_employees | `id` |
| rid_drivers | `photo_verified_by` | adm_provider_employees | `id` |
| rid_drivers | `tenant_id` | adm_tenants | `id` |
| rid_drivers | `updated_by` | adm_provider_employees | `id` |
| rid_drivers | `verified_by` | adm_provider_employees | `id` |
| sch_goal_achievements | `goal_id` | sch_goals | `id` |
| sch_goal_types | `tenant_id` | adm_tenants | `id` |
| sch_goals | `created_by` | adm_members | `id` |
| sch_goals | `deleted_by` | adm_members | `id` |
| sch_goals | `goal_type_id` | sch_goal_types | `id` |
| sch_goals | `tenant_id` | adm_tenants | `id` |
| sch_goals | `updated_by` | adm_members | `id` |
| sch_locations | `tenant_id` | adm_tenants | `id` |
| sch_maintenance_schedules | `completed_maintenance_id` | flt_vehicle_maintenance | `id` |
| sch_maintenance_schedules | `created_by` | adm_members | `id` |
| sch_maintenance_schedules | `deleted_by` | adm_members | `id` |
| sch_maintenance_schedules | `maintenance_type_id` | dir_maintenance_types | `id` |
| sch_maintenance_schedules | `rescheduled_from` | sch_maintenance_schedules | `id` |
| sch_maintenance_schedules | `scheduled_by` | adm_members | `id` |
| sch_maintenance_schedules | `tenant_id` | adm_tenants | `id` |
| sch_maintenance_schedules | `updated_by` | adm_members | `id` |
| sch_maintenance_schedules | `vehicle_id` | flt_vehicles | `id` |
| sch_shift_types | `tenant_id` | adm_tenants | `id` |
| sch_shifts | `approved_by` | adm_members | `id` |
| sch_shifts | `created_by` | adm_members | `id` |
| sch_shifts | `deleted_by` | adm_members | `id` |
| sch_shifts | `driver_id` | rid_drivers | `id` |
| sch_shifts | `location_id` | sch_locations | `id` |
| sch_shifts | `replacement_driver_id` | rid_drivers | `id` |
| sch_shifts | `shift_type_id` | sch_shift_types | `id` |
| sch_shifts | `tenant_id` | adm_tenants | `id` |
| sch_shifts | `updated_by` | adm_members | `id` |
| sch_task_comments | `author_id` | adm_members | `id` |
| sch_task_comments | `task_id` | sch_tasks | `id` |
| sch_task_history | `changed_by` | adm_members | `id` |
| sch_task_history | `task_id` | sch_tasks | `id` |
| sch_task_types | `tenant_id` | adm_tenants | `id` |
| sch_tasks | `assigned_by` | adm_members | `id` |
| sch_tasks | `assigned_to` | adm_members | `id` |
| sch_tasks | `completed_by` | adm_members | `id` |
| sch_tasks | `created_by` | adm_members | `id` |
| sch_tasks | `deleted_by` | adm_members | `id` |
| sch_tasks | `escalated_to` | adm_members | `id` |
| sch_tasks | `parent_task_id` | sch_tasks | `id` |
| sch_tasks | `task_type_id` | sch_task_types | `id` |
| sch_tasks | `tenant_id` | adm_tenants | `id` |
| sch_tasks | `updated_by` | adm_members | `id` |
| sch_tasks | `verified_by` | adm_members | `id` |
| sup_canned_responses | `created_by` | adm_provider_employees | `id` |
| sup_canned_responses | `tenant_id` | adm_tenants | `id` |
| sup_customer_feedback | `driver_id` | rid_drivers | `id` |
| sup_customer_feedback | `tenant_id` | adm_tenants | `id` |
| sup_customer_feedback | `ticket_id` | sup_tickets | `id` |
| sup_ticket_categories | `created_by` | adm_provider_employees | `id` |
| sup_ticket_categories | `parent_category_id` | sup_ticket_categories | `id` |
| sup_ticket_categories | `tenant_id` | adm_tenants | `id` |
| sup_ticket_categories | `updated_by` | adm_provider_employees | `id` |
| sup_ticket_messages | `created_by` | adm_members | `id` |
| sup_ticket_messages | `deleted_by` | adm_members | `id` |
| sup_ticket_messages | `parent_message_id` | sup_ticket_messages | `id` |
| sup_ticket_messages | `ticket_id` | sup_tickets | `id` |
| sup_ticket_messages | `updated_by` | adm_members | `id` |
| sup_ticket_sla_rules | `category_id` | sup_ticket_categories | `id` |
| sup_ticket_sla_rules | `created_by` | adm_provider_employees | `id` |
| sup_ticket_sla_rules | `tenant_id` | adm_tenants | `id` |
| sup_ticket_sla_rules | `updated_by` | adm_provider_employees | `id` |
| sup_tickets | `assigned_to` | adm_provider_employees | `id` |
| sup_tickets | `created_by` | adm_members | `id` |
| sup_tickets | `deleted_by` | adm_members | `id` |
| sup_tickets | `raised_by` | adm_members | `id` |
| sup_tickets | `tenant_id` | adm_tenants | `id` |
| sup_tickets | `updated_by` | adm_members | `id` |
| trp_client_invoice_lines | `invoice_id` | trp_client_invoices | `id` |
| trp_client_invoice_lines | `trip_id` | trp_trips | `id` |
| trp_client_invoices | `created_by` | adm_members | `id` |
| trp_client_invoices | `deleted_by` | adm_members | `id` |
| trp_client_invoices | `tenant_id` | adm_tenants | `id` |
| trp_client_invoices | `updated_by` | adm_members | `id` |
| trp_platform_account_keys | `account_id` | trp_platform_accounts | `id` |
| trp_platform_account_keys | `revoked_by` | adm_provider_employees | `id` |
| trp_platform_accounts | `created_by` | adm_members | `id` |
| trp_platform_accounts | `deleted_by` | adm_members | `id` |
| trp_platform_accounts | `platform_id` | dir_platforms | `id` |
| trp_platform_accounts | `tenant_id` | adm_tenants | `id` |
| trp_platform_accounts | `updated_by` | adm_members | `id` |
| trp_settlements | `created_by` | adm_members | `id` |
| trp_settlements | `deleted_by` | adm_members | `id` |
| trp_settlements | `platform_account_id` | trp_platform_accounts | `id` |
| trp_settlements | `reconciliation_id` | rev_reconciliations | `id` |
| trp_settlements | `tenant_id` | adm_tenants | `id` |
| trp_settlements | `trip_id` | trp_trips | `id` |
| trp_settlements | `updated_by` | adm_members | `id` |
| trp_trips | `driver_id` | rid_drivers | `id` |
| trp_trips | `platform_account_id` | trp_platform_accounts | `id` |
| trp_trips | `platform_id` | dir_platforms | `id` |
| trp_trips | `tenant_id` | adm_tenants | `id` |
| trp_trips | `vehicle_id` | flt_vehicles | `id` |

---

**Generated:** 2025-12-02
**Source:** Supabase PostgreSQL Database
**Total Tables:** 107
**Total Enum Types:** 140

```
