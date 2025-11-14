# FleetCore Database Schema - Complete Reference

**Generated**: 2025-11-06 15:38:07
**Last Updated**: 2025-11-14 (Added dir_notification_templates documentation)
**Source**: Supabase PostgreSQL Production Database
**Method**: Direct database introspection via SQL queries + Manual documentation for new tables

---

## 📊 Summary

- **Total Tables**: 101
- **Total ENUM Types**: 135
- **Total Lines**: 7829
- **Extraction Method**: PostgreSQL information_schema + pg_catalog queries

---

## 🏷️ ENUM Types

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

### `lead_stage`

```
top_of_funnel, marketing_qualified, sales_qualified, opportunity
```

### `lead_status`

```
new, qualified, converted, lost
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
```

### `task_comment_type`

```
note, status_change, escalation
```

### `task_priority`

```
low, normal, high, urgent, critical
```

### `task_status`

```
pending, in_progress, completed, cancelled, overdue, blocked, waiting_verification, reopened
```

### `tenant_status`

```
trialing, active, suspended, past_due, cancelled
```

### `ticket_priority`

```
low, medium, high, critical
```

### `ticket_raised_by_type`

```
admin, driver, client, guest
```

### `ticket_source_platform`

```
web, mobile, api, email, phone
```

### `ticket_status`

```
new, open, waiting_client, waiting_internal, resolved, closed
```

### `toll_gate_status`

```
active, inactive, maintenance
```

### `toll_transaction_source`

```
automatic, manual, imported
```

### `toll_transaction_status`

```
pending, charged, refunded, disputed
```

### `traffic_fine_status`

```
pending, processing, disputed, cancelled, paid, refunded
```

### `training_status`

```
planned, in_progress, completed, expired, cancelled
```

### `training_type`

```
mandatory, safety, customer_service, technical, compliance, platform_specific, professional_development, onboarding, refresher, specialized
```

### `transaction_category_type`

```
revenue, expense, transfer, other
```

### `transmission_type`

```
manual, automatic, semi_automatic, cvt
```

### `trip_status`

```
completed, cancelled, rejected, no_show
```

### `trp_invoice_status`

```
draft, sent, viewed, partially_paid, paid, disputed, cancelled, overdue
```

### `trp_payment_method`

```
bank_transfer, card, check, cash
```

### `vehicle_event_type`

```
accident, maintenance, violation, recovery, impound, theft, breakdown
```

### `vehicle_usage`

```
commercial, private, mixed
```

### `verification_status`

```
pending, verified, rejected
```

---

## 📋 Tables

### 1. `adm_audit_logs`

**Rows**: 41 live, 0 dead

#### Columns

| #   | Column            | Type                       | Nullable | Default                         | PK  |
| --- | ----------------- | -------------------------- | -------- | ------------------------------- | --- |
| 1   | `id`              | `uuid`                     | ✗        | `uuid_generate_v4()`            | 🔑  |
| 2   | `tenant_id`       | `uuid`                     | ✗        | ``                              |     |
| 3   | `member_id`       | `uuid`                     | ✓        | ``                              |     |
| 4   | `entity`          | `varchar(50)`              | ✗        | ``                              |     |
| 5   | `entity_id`       | `uuid`                     | ✗        | ``                              |     |
| 6   | `action`          | `varchar(50)`              | ✗        | ``                              |     |
| 7   | `changes`         | `jsonb`                    | ✓        | ``                              |     |
| 8   | `ip_address`      | `varchar(45)`              | ✓        | ``                              |     |
| 9   | `user_agent`      | `text`                     | ✓        | ``                              |     |
| 10  | `timestamp`       | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`             |     |
| 18  | `severity`        | `audit_severity`           | ✗        | `'info'::audit_severity`        |     |
| 19  | `category`        | `audit_category`           | ✗        | `'operational'::audit_category` |     |
| 20  | `session_id`      | `uuid`                     | ✓        | ``                              |     |
| 21  | `request_id`      | `uuid`                     | ✓        | ``                              |     |
| 22  | `old_values`      | `jsonb`                    | ✓        | ``                              |     |
| 23  | `new_values`      | `jsonb`                    | ✓        | ``                              |     |
| 24  | `retention_until` | `timestamp with time zone` | ✓        | ``                              |     |
| 25  | `tags`            | `ARRAY`                    | ✓        | `ARRAY[]::text[]`               |     |

#### Foreign Keys

| Column      | References       | On Update | On Delete |
| ----------- | ---------------- | --------- | --------- |
| `member_id` | `adm_members.id` | CASCADE   | SET NULL  |
| `member_id` | `adm_members.id` | CASCADE   | SET NULL  |
| `tenant_id` | `adm_tenants.id` | CASCADE   | CASCADE   |
| `tenant_id` | `adm_tenants.id` | CASCADE   | SET NULL  |

#### Indexes

- **`adm_audit_logs_changes_gin`**
  ```sql
  CREATE INDEX adm_audit_logs_changes_gin ON public.adm_audit_logs USING gin (changes)
  ```
- **`adm_audit_logs_changes_idx`**
  ```sql
  CREATE INDEX adm_audit_logs_changes_idx ON public.adm_audit_logs USING gin (changes)
  ```
- **`adm_audit_logs_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_audit_logs_pkey ON public.adm_audit_logs USING btree (id)
  ```
- **`adm_audit_logs_tenant_entity_entity_id_idx`**
  ```sql
  CREATE INDEX adm_audit_logs_tenant_entity_entity_id_idx ON public.adm_audit_logs USING btree (tenant_id, entity, entity_id)
  ```
- **`adm_audit_logs_tenant_id_idx`**
  ```sql
  CREATE INDEX adm_audit_logs_tenant_id_idx ON public.adm_audit_logs USING btree (tenant_id)
  ```
- **`adm_audit_logs_timestamp_idx`**
  ```sql
  CREATE INDEX adm_audit_logs_timestamp_idx ON public.adm_audit_logs USING btree ("timestamp" DESC)
  ```
- **`idx_adm_audit_logs_tenant`**
  ```sql
  CREATE INDEX idx_adm_audit_logs_tenant ON public.adm_audit_logs USING btree (tenant_id)
  ```
- **`idx_adm_audit_logs_timestamp`**
  ```sql
  CREATE INDEX idx_adm_audit_logs_timestamp ON public.adm_audit_logs USING btree ("timestamp" DESC)
  ```

---

### 2. `adm_invitations`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                  | Type                       | Nullable | Default                        | PK  |
| --- | ----------------------- | -------------------------- | -------- | ------------------------------ | --- |
| 1   | `id`                    | `uuid`                     | ✗        | `gen_random_uuid()`            | 🔑  |
| 2   | `tenant_id`             | `uuid`                     | ✗        | ``                             |     |
| 3   | `email`                 | `citext`                   | ✗        | ``                             |     |
| 4   | `token`                 | `varchar(255)`             | ✗        | ``                             |     |
| 5   | `role`                  | `varchar(100)`             | ✗        | ``                             |     |
| 6   | `expires_at`            | `timestamp with time zone` | ✗        | ``                             |     |
| 7   | `status`                | `invitation_status`        | ✗        | `'pending'::invitation_status` |     |
| 8   | `sent_at`               | `timestamp with time zone` | ✗        | ``                             |     |
| 9   | `sent_count`            | `integer`                  | ✗        | `1`                            |     |
| 10  | `last_sent_at`          | `timestamp with time zone` | ✗        | ``                             |     |
| 11  | `accepted_at`           | `timestamp with time zone` | ✓        | ``                             |     |
| 12  | `accepted_from_ip`      | `inet`                     | ✓        | ``                             |     |
| 13  | `accepted_by_member_id` | `uuid`                     | ✓        | ``                             |     |
| 14  | `invitation_type`       | `invitation_type`          | ✗        | ``                             |     |
| 15  | `custom_message`        | `text`                     | ✓        | ``                             |     |
| 16  | `metadata`              | `jsonb`                    | ✓        | ``                             |     |
| 17  | `sent_by`               | `uuid`                     | ✗        | ``                             |     |
| 18  | `created_at`            | `timestamp with time zone` | ✗        | `now()`                        |     |
| 19  | `updated_at`            | `timestamp with time zone` | ✗        | `now()`                        |     |

#### Foreign Keys

| Column                  | References                  | On Update | On Delete |
| ----------------------- | --------------------------- | --------- | --------- |
| `accepted_by_member_id` | `adm_members.id`            | CASCADE   | SET NULL  |
| `sent_by`               | `adm_provider_employees.id` | CASCADE   | RESTRICT  |
| `tenant_id`             | `adm_tenants.id`            | CASCADE   | CASCADE   |

#### Indexes

- **`adm_invitations_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_invitations_pkey ON public.adm_invitations USING btree (id)
  ```
- **`adm_invitations_token_key`**
  ```sql
  CREATE UNIQUE INDEX adm_invitations_token_key ON public.adm_invitations USING btree (token)
  ```

---

### 3. `adm_member_roles`

**Rows**: 0 live, 23 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default              | PK  |
| --- | ------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`         | `uuid`                     | ✗        | ``                   |     |
| 3   | `member_id`         | `uuid`                     | ✗        | ``                   |     |
| 4   | `role_id`           | `uuid`                     | ✗        | ``                   |     |
| 5   | `assigned_at`       | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 6   | `created_at`        | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 7   | `created_by`        | `uuid`                     | ✓        | ``                   |     |
| 8   | `updated_at`        | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 9   | `updated_by`        | `uuid`                     | ✓        | ``                   |     |
| 10  | `deleted_at`        | `timestamp with time zone` | ✓        | ``                   |     |
| 11  | `deleted_by`        | `uuid`                     | ✓        | ``                   |     |
| 12  | `deletion_reason`   | `text`                     | ✓        | ``                   |     |
| 13  | `assigned_by`       | `uuid`                     | ✓        | ``                   |     |
| 14  | `assignment_reason` | `text`                     | ✓        | ``                   |     |
| 15  | `valid_from`        | `timestamp with time zone` | ✓        | ``                   |     |
| 16  | `valid_until`       | `timestamp with time zone` | ✓        | ``                   |     |
| 17  | `is_primary`        | `boolean`                  | ✗        | `false`              |     |
| 18  | `scope_type`        | `scope_type`               | ✓        | ``                   |     |
| 19  | `scope_id`          | `uuid`                     | ✓        | ``                   |     |
| 20  | `priority`          | `integer`                  | ✓        | `0`                  |     |

#### Foreign Keys

| Column        | References       | On Update | On Delete |
| ------------- | ---------------- | --------- | --------- |
| `assigned_by` | `adm_members.id` | CASCADE   | SET NULL  |
| `created_by`  | `adm_members.id` | CASCADE   | SET NULL  |
| `deleted_by`  | `adm_members.id` | CASCADE   | SET NULL  |
| `member_id`   | `adm_members.id` | CASCADE   | CASCADE   |
| `member_id`   | `adm_members.id` | CASCADE   | CASCADE   |
| `role_id`     | `adm_roles.id`   | CASCADE   | CASCADE   |
| `role_id`     | `adm_roles.id`   | CASCADE   | CASCADE   |
| `tenant_id`   | `adm_tenants.id` | CASCADE   | CASCADE   |
| `updated_by`  | `adm_members.id` | CASCADE   | SET NULL  |

#### Indexes

- **`adm_member_roles_created_by_idx`**
  ```sql
  CREATE INDEX adm_member_roles_created_by_idx ON public.adm_member_roles USING btree (created_by)
  ```
- **`adm_member_roles_deleted_at_idx`**
  ```sql
  CREATE INDEX adm_member_roles_deleted_at_idx ON public.adm_member_roles USING btree (deleted_at)
  ```
- **`adm_member_roles_member_id_idx`**
  ```sql
  CREATE INDEX adm_member_roles_member_id_idx ON public.adm_member_roles USING btree (member_id)
  ```
- **`adm_member_roles_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_member_roles_pkey ON public.adm_member_roles USING btree (id)
  ```
- **`adm_member_roles_role_id_idx`**
  ```sql
  CREATE INDEX adm_member_roles_role_id_idx ON public.adm_member_roles USING btree (role_id)
  ```
- **`adm_member_roles_tenant_id_idx`**
  ```sql
  CREATE INDEX adm_member_roles_tenant_id_idx ON public.adm_member_roles USING btree (tenant_id)
  ```
- **`adm_member_roles_tenant_id_member_id_role_id_key`**
  ```sql
  CREATE UNIQUE INDEX adm_member_roles_tenant_id_member_id_role_id_key ON public.adm_member_roles USING btree (tenant_id, member_id, role_id) WHERE (deleted_at IS NULL)
  ```
- **`adm_member_roles_updated_by_idx`**
  ```sql
  CREATE INDEX adm_member_roles_updated_by_idx ON public.adm_member_roles USING btree (updated_by)
  ```
- **`idx_adm_member_roles_member`**
  ```sql
  CREATE INDEX idx_adm_member_roles_member ON public.adm_member_roles USING btree (member_id)
  ```
- **`idx_adm_member_roles_role`**
  ```sql
  CREATE INDEX idx_adm_member_roles_role ON public.adm_member_roles USING btree (role_id)
  ```

---

### 4. `adm_member_sessions`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column       | Type                       | Nullable | Default             | PK  |
| --- | ------------ | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`         | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `member_id`  | `uuid`                     | ✗        | ``                  |     |
| 3   | `token_hash` | `varchar(256)`             | ✗        | ``                  |     |
| 4   | `ip_address` | `inet`                     | ✓        | ``                  |     |
| 5   | `user_agent` | `text`                     | ✓        | ``                  |     |
| 6   | `expires_at` | `timestamp with time zone` | ✗        | ``                  |     |
| 7   | `revoked_at` | `timestamp with time zone` | ✓        | ``                  |     |
| 8   | `created_at` | `timestamp with time zone` | ✗        | `now()`             |     |

#### Foreign Keys

| Column      | References       | On Update | On Delete |
| ----------- | ---------------- | --------- | --------- |
| `member_id` | `adm_members.id` | CASCADE   | CASCADE   |

#### Indexes

- **`adm_member_sessions_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_member_sessions_pkey ON public.adm_member_sessions USING btree (id)
  ```
- **`adm_member_sessions_token_hash_key`**
  ```sql
  CREATE UNIQUE INDEX adm_member_sessions_token_hash_key ON public.adm_member_sessions USING btree (token_hash)
  ```

---

### 5. `adm_members`

**Rows**: 30 live, 0 dead

#### Columns

| #   | Column                     | Type                       | Nullable | Default                       | PK  |
| --- | -------------------------- | -------------------------- | -------- | ----------------------------- | --- |
| 1   | `id`                       | `uuid`                     | ✗        | `uuid_generate_v4()`          | 🔑  |
| 2   | `tenant_id`                | `uuid`                     | ✗        | ``                            |     |
| 3   | `email`                    | `citext`                   | ✗        | ``                            |     |
| 4   | `clerk_user_id`            | `varchar(255)`             | ✗        | ``                            |     |
| 5   | `first_name`               | `varchar(100)`             | ✓        | ``                            |     |
| 6   | `last_name`                | `varchar(100)`             | ✓        | ``                            |     |
| 7   | `phone`                    | `varchar(50)`              | ✗        | ``                            |     |
| 8   | `role`                     | `varchar(50)`              | ✗        | `'member'::character varying` |     |
| 9   | `last_login_at`            | `timestamp with time zone` | ✓        | ``                            |     |
| 10  | `metadata`                 | `jsonb`                    | ✗        | `'{}'::jsonb`                 |     |
| 11  | `status`                   | `varchar(50)`              | ✗        | `'active'::character varying` |     |
| 12  | `created_at`               | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`           |     |
| 13  | `created_by`               | `uuid`                     | ✓        | ``                            |     |
| 14  | `updated_at`               | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`           |     |
| 15  | `updated_by`               | `uuid`                     | ✓        | ``                            |     |
| 16  | `deleted_at`               | `timestamp with time zone` | ✓        | ``                            |     |
| 17  | `deleted_by`               | `uuid`                     | ✓        | ``                            |     |
| 18  | `deletion_reason`          | `text`                     | ✓        | ``                            |     |
| 19  | `email_verified_at`        | `timestamp with time zone` | ✓        | ``                            |     |
| 20  | `two_factor_enabled`       | `boolean`                  | ✗        | `false`                       |     |
| 21  | `two_factor_secret`        | `text`                     | ✓        | ``                            |     |
| 22  | `password_changed_at`      | `timestamp with time zone` | ✓        | ``                            |     |
| 23  | `failed_login_attempts`    | `integer`                  | ✗        | `0`                           |     |
| 24  | `locked_until`             | `timestamp with time zone` | ✓        | ``                            |     |
| 25  | `default_role_id`          | `uuid`                     | ✓        | ``                            |     |
| 26  | `preferred_language`       | `varchar(10)`              | ✓        | ``                            |     |
| 27  | `notification_preferences` | `jsonb`                    | ✓        | ``                            |     |

#### Foreign Keys

| Column            | References       | On Update | On Delete |
| ----------------- | ---------------- | --------- | --------- |
| `created_by`      | `adm_members.id` | CASCADE   | SET NULL  |
| `default_role_id` | `adm_roles.id`   | CASCADE   | SET NULL  |
| `deleted_by`      | `adm_members.id` | CASCADE   | SET NULL  |
| `tenant_id`       | `adm_tenants.id` | CASCADE   | CASCADE   |
| `tenant_id`       | `adm_tenants.id` | CASCADE   | CASCADE   |
| `updated_by`      | `adm_members.id` | CASCADE   | SET NULL  |

#### Indexes

- **`adm_members_clerk_user_id_idx`**
  ```sql
  CREATE INDEX adm_members_clerk_user_id_idx ON public.adm_members USING btree (clerk_user_id)
  ```
- **`adm_members_created_by_idx`**
  ```sql
  CREATE INDEX adm_members_created_by_idx ON public.adm_members USING btree (created_by)
  ```
- **`adm_members_deleted_at_idx`**
  ```sql
  CREATE INDEX adm_members_deleted_at_idx ON public.adm_members USING btree (deleted_at)
  ```
- **`adm_members_email_idx`**
  ```sql
  CREATE INDEX adm_members_email_idx ON public.adm_members USING btree (email)
  ```
- **`adm_members_last_login_at_idx`**
  ```sql
  CREATE INDEX adm_members_last_login_at_idx ON public.adm_members USING btree (last_login_at)
  ```
- **`adm_members_metadata_gin`**
  ```sql
  CREATE INDEX adm_members_metadata_gin ON public.adm_members USING gin (metadata)
  ```
- **`adm_members_metadata_idx`**
  ```sql
  CREATE INDEX adm_members_metadata_idx ON public.adm_members USING gin (metadata)
  ```
- **`adm_members_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_members_pkey ON public.adm_members USING btree (id)
  ```
- **`adm_members_status_active_idx`**
  ```sql
  CREATE INDEX adm_members_status_active_idx ON public.adm_members USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`adm_members_tenant_clerk_uq`**
  ```sql
  CREATE UNIQUE INDEX adm_members_tenant_clerk_uq ON public.adm_members USING btree (tenant_id, clerk_user_id) WHERE (deleted_at IS NULL)
  ```
- **`adm_members_tenant_email_uq`**
  ```sql
  CREATE UNIQUE INDEX adm_members_tenant_email_uq ON public.adm_members USING btree (tenant_id, email) WHERE (deleted_at IS NULL)
  ```
- **`adm_members_tenant_id_idx`**
  ```sql
  CREATE INDEX adm_members_tenant_id_idx ON public.adm_members USING btree (tenant_id)
  ```
- **`adm_members_updated_by_idx`**
  ```sql
  CREATE INDEX adm_members_updated_by_idx ON public.adm_members USING btree (updated_by)
  ```
- **`idx_adm_members_email`**
  ```sql
  CREATE INDEX idx_adm_members_email ON public.adm_members USING btree (email) WHERE (deleted_at IS NULL)
  ```
- **`idx_adm_members_metadata`**
  ```sql
  CREATE INDEX idx_adm_members_metadata ON public.adm_members USING gin (metadata)
  ```
- **`idx_adm_members_role`**
  ```sql
  CREATE INDEX idx_adm_members_role ON public.adm_members USING btree (default_role_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_adm_members_tenant`**
  ```sql
  CREATE INDEX idx_adm_members_tenant ON public.adm_members USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_adm_members_tenant_email`**
  ```sql
  CREATE UNIQUE INDEX idx_adm_members_tenant_email ON public.adm_members USING btree (tenant_id, email) WHERE (deleted_at IS NULL)
  ```
- **`idx_adm_members_tenant_email_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_adm_members_tenant_email_unique ON public.adm_members USING btree (tenant_id, email) WHERE (deleted_at IS NULL)
  ```
- **`idx_adm_members_tenant_status`**
  ```sql
  CREATE INDEX idx_adm_members_tenant_status ON public.adm_members USING btree (tenant_id, status) WHERE (deleted_at IS NULL)
  ```

---

### 6. `adm_provider_employees`

**Rows**: 1 live, 0 dead

#### Columns

| #   | Column            | Type                       | Nullable | Default                       | PK  |
| --- | ----------------- | -------------------------- | -------- | ----------------------------- | --- |
| 1   | `id`              | `uuid`                     | ✗        | `uuid_generate_v4()`          | 🔑  |
| 2   | `clerk_user_id`   | `varchar(255)`             | ✗        | ``                            |     |
| 3   | `name`            | `varchar(100)`             | ✗        | ``                            |     |
| 4   | `email`           | `varchar(255)`             | ✗        | ``                            |     |
| 5   | `department`      | `varchar(50)`              | ✓        | ``                            |     |
| 6   | `title`           | `varchar(50)`              | ✓        | ``                            |     |
| 7   | `permissions`     | `jsonb`                    | ✓        | ``                            |     |
| 8   | `status`          | `varchar(50)`              | ✗        | `'active'::character varying` |     |
| 9   | `created_at`      | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`           |     |
| 10  | `created_by`      | `uuid`                     | ✓        | ``                            |     |
| 11  | `updated_at`      | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`           |     |
| 12  | `updated_by`      | `uuid`                     | ✓        | ``                            |     |
| 13  | `deleted_at`      | `timestamp with time zone` | ✓        | ``                            |     |
| 14  | `deleted_by`      | `uuid`                     | ✓        | ``                            |     |
| 15  | `deletion_reason` | `text`                     | ✓        | ``                            |     |
| 16  | `supervisor_id`   | `uuid`                     | ✓        | ``                            |     |

#### Foreign Keys

| Column          | References                  | On Update | On Delete |
| --------------- | --------------------------- | --------- | --------- |
| `created_by`    | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `deleted_by`    | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `supervisor_id` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `updated_by`    | `adm_provider_employees.id` | CASCADE   | SET NULL  |

#### Indexes

- **`adm_provider_employees_clerk_user_id_uq`**
  ```sql
  CREATE UNIQUE INDEX adm_provider_employees_clerk_user_id_uq ON public.adm_provider_employees USING btree (clerk_user_id) WHERE (deleted_at IS NULL)
  ```
- **`adm_provider_employees_created_by_idx`**
  ```sql
  CREATE INDEX adm_provider_employees_created_by_idx ON public.adm_provider_employees USING btree (created_by)
  ```
- **`adm_provider_employees_deleted_at_idx`**
  ```sql
  CREATE INDEX adm_provider_employees_deleted_at_idx ON public.adm_provider_employees USING btree (deleted_at)
  ```
- **`adm_provider_employees_email_uq`**
  ```sql
  CREATE UNIQUE INDEX adm_provider_employees_email_uq ON public.adm_provider_employees USING btree (email) WHERE (deleted_at IS NULL)
  ```
- **`adm_provider_employees_permissions_gin`**
  ```sql
  CREATE INDEX adm_provider_employees_permissions_gin ON public.adm_provider_employees USING gin (permissions)
  ```
- **`adm_provider_employees_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_provider_employees_pkey ON public.adm_provider_employees USING btree (id)
  ```
- **`adm_provider_employees_status_active_idx`**
  ```sql
  CREATE INDEX adm_provider_employees_status_active_idx ON public.adm_provider_employees USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`adm_provider_employees_updated_by_idx`**
  ```sql
  CREATE INDEX adm_provider_employees_updated_by_idx ON public.adm_provider_employees USING btree (updated_by)
  ```

---

### 7. `adm_role_permissions`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column       | Type                       | Nullable | Default             | PK  |
| --- | ------------ | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`         | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `role_id`    | `uuid`                     | ✗        | ``                  |     |
| 3   | `resource`   | `varchar(100)`             | ✗        | ``                  |     |
| 4   | `action`     | `varchar(50)`              | ✗        | ``                  |     |
| 5   | `conditions` | `jsonb`                    | ✓        | ``                  |     |
| 6   | `created_at` | `timestamp with time zone` | ✗        | `now()`             |     |

#### Foreign Keys

| Column    | References     | On Update | On Delete |
| --------- | -------------- | --------- | --------- |
| `role_id` | `adm_roles.id` | CASCADE   | CASCADE   |

#### Indexes

- **`adm_role_permissions_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_role_permissions_pkey ON public.adm_role_permissions USING btree (id)
  ```

---

### 8. `adm_role_versions`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                 | Type                       | Nullable | Default             | PK  |
| --- | ---------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                   | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `role_id`              | `uuid`                     | ✗        | ``                  |     |
| 3   | `version_number`       | `integer`                  | ✗        | ``                  |     |
| 4   | `permissions_snapshot` | `jsonb`                    | ✗        | ``                  |     |
| 5   | `changed_by`           | `uuid`                     | ✓        | ``                  |     |
| 6   | `change_reason`        | `text`                     | ✓        | ``                  |     |
| 7   | `created_at`           | `timestamp with time zone` | ✗        | `now()`             |     |

#### Foreign Keys

| Column       | References       | On Update | On Delete |
| ------------ | ---------------- | --------- | --------- |
| `changed_by` | `adm_members.id` | CASCADE   | SET NULL  |
| `role_id`    | `adm_roles.id`   | CASCADE   | CASCADE   |

#### Indexes

- **`adm_role_versions_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_role_versions_pkey ON public.adm_role_versions USING btree (id)
  ```

---

### 9. `adm_roles`

**Rows**: 5 live, 4 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default                       | PK  |
| --- | ------------------- | -------------------------- | -------- | ----------------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()`          | 🔑  |
| 2   | `tenant_id`         | `uuid`                     | ✗        | ``                            |     |
| 3   | `name`              | `varchar(100)`             | ✗        | ``                            |     |
| 4   | `description`       | `text`                     | ✓        | ``                            |     |
| 5   | `permissions`       | `jsonb`                    | ✗        | `'{}'::jsonb`                 |     |
| 6   | `status`            | `varchar(50)`              | ✗        | `'active'::character varying` |     |
| 7   | `created_at`        | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`           |     |
| 8   | `created_by`        | `uuid`                     | ✓        | ``                            |     |
| 9   | `updated_at`        | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`           |     |
| 10  | `updated_by`        | `uuid`                     | ✓        | ``                            |     |
| 11  | `deleted_at`        | `timestamp with time zone` | ✓        | ``                            |     |
| 12  | `deleted_by`        | `uuid`                     | ✓        | ``                            |     |
| 13  | `deletion_reason`   | `text`                     | ✓        | ``                            |     |
| 14  | `slug`              | `varchar(100)`             | ✗        | ``                            |     |
| 15  | `parent_role_id`    | `uuid`                     | ✓        | ``                            |     |
| 16  | `is_system`         | `boolean`                  | ✗        | `false`                       |     |
| 17  | `is_default`        | `boolean`                  | ✗        | `false`                       |     |
| 18  | `max_members`       | `integer`                  | ✓        | ``                            |     |
| 19  | `valid_from`        | `timestamp with time zone` | ✓        | ``                            |     |
| 20  | `valid_until`       | `timestamp with time zone` | ✓        | ``                            |     |
| 21  | `approval_required` | `boolean`                  | ✗        | `false`                       |     |

#### Foreign Keys

| Column           | References       | On Update | On Delete |
| ---------------- | ---------------- | --------- | --------- |
| `created_by`     | `adm_members.id` | CASCADE   | SET NULL  |
| `deleted_by`     | `adm_members.id` | CASCADE   | SET NULL  |
| `parent_role_id` | `adm_roles.id`   | CASCADE   | SET NULL  |
| `tenant_id`      | `adm_tenants.id` | CASCADE   | CASCADE   |
| `tenant_id`      | `adm_tenants.id` | CASCADE   | CASCADE   |
| `updated_by`     | `adm_members.id` | CASCADE   | SET NULL  |

#### Indexes

- **`adm_roles_created_by_idx`**
  ```sql
  CREATE INDEX adm_roles_created_by_idx ON public.adm_roles USING btree (created_by)
  ```
- **`adm_roles_deleted_at_idx`**
  ```sql
  CREATE INDEX adm_roles_deleted_at_idx ON public.adm_roles USING btree (deleted_at)
  ```
- **`adm_roles_permissions_gin`**
  ```sql
  CREATE INDEX adm_roles_permissions_gin ON public.adm_roles USING gin (permissions)
  ```
- **`adm_roles_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_roles_pkey ON public.adm_roles USING btree (id)
  ```
- **`adm_roles_slug_key`**
  ```sql
  CREATE UNIQUE INDEX adm_roles_slug_key ON public.adm_roles USING btree (slug)
  ```
- **`adm_roles_status_active_idx`**
  ```sql
  CREATE INDEX adm_roles_status_active_idx ON public.adm_roles USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`adm_roles_tenant_id_idx`**
  ```sql
  CREATE INDEX adm_roles_tenant_id_idx ON public.adm_roles USING btree (tenant_id)
  ```
- **`adm_roles_tenant_name_uq`**
  ```sql
  CREATE UNIQUE INDEX adm_roles_tenant_name_uq ON public.adm_roles USING btree (tenant_id, name) WHERE (deleted_at IS NULL)
  ```
- **`adm_roles_updated_by_idx`**
  ```sql
  CREATE INDEX adm_roles_updated_by_idx ON public.adm_roles USING btree (updated_by)
  ```
- **`idx_adm_roles_tenant`**
  ```sql
  CREATE INDEX idx_adm_roles_tenant ON public.adm_roles USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_adm_roles_tenant_name`**
  ```sql
  CREATE UNIQUE INDEX idx_adm_roles_tenant_name ON public.adm_roles USING btree (tenant_id, name) WHERE (deleted_at IS NULL)
  ```

---

### 10. `adm_tenant_lifecycle_events`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column           | Type                       | Nullable | Default              | PK  |
| --- | ---------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`             | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`      | `uuid`                     | ✗        | ``                   |     |
| 3   | `event_type`     | `varchar(50)`              | ✗        | ``                   |     |
| 4   | `performed_by`   | `uuid`                     | ✓        | ``                   |     |
| 5   | `effective_date` | `date`                     | ✓        | ``                   |     |
| 6   | `description`    | `text`                     | ✓        | ``                   |     |
| 7   | `created_at`     | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |

#### Foreign Keys

| Column         | References                  | On Update | On Delete |
| -------------- | --------------------------- | --------- | --------- |
| `performed_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `performed_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `tenant_id`    | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `tenant_id`    | `adm_tenants.id`            | CASCADE   | CASCADE   |

#### Indexes

- **`adm_tenant_lifecycle_events_effective_date_idx`**
  ```sql
  CREATE INDEX adm_tenant_lifecycle_events_effective_date_idx ON public.adm_tenant_lifecycle_events USING btree (effective_date DESC)
  ```
- **`adm_tenant_lifecycle_events_event_type_idx`**
  ```sql
  CREATE INDEX adm_tenant_lifecycle_events_event_type_idx ON public.adm_tenant_lifecycle_events USING btree (event_type)
  ```
- **`adm_tenant_lifecycle_events_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_tenant_lifecycle_events_pkey ON public.adm_tenant_lifecycle_events USING btree (id)
  ```
- **`adm_tenant_lifecycle_events_tenant_event_idx`**
  ```sql
  CREATE INDEX adm_tenant_lifecycle_events_tenant_event_idx ON public.adm_tenant_lifecycle_events USING btree (tenant_id, event_type)
  ```
- **`adm_tenant_lifecycle_events_tenant_id_idx`**
  ```sql
  CREATE INDEX adm_tenant_lifecycle_events_tenant_id_idx ON public.adm_tenant_lifecycle_events USING btree (tenant_id)
  ```

---

### 11. `adm_tenant_settings`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column          | Type                       | Nullable | Default             | PK  |
| --- | --------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`            | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`     | `uuid`                     | ✗        | ``                  |     |
| 3   | `setting_key`   | `varchar(100)`             | ✗        | ``                  |     |
| 4   | `setting_value` | `jsonb`                    | ✗        | ``                  |     |
| 5   | `category`      | `varchar(50)`              | ✓        | ``                  |     |
| 6   | `is_encrypted`  | `boolean`                  | ✗        | `false`             |     |
| 7   | `updated_at`    | `timestamp with time zone` | ✗        | `now()`             |     |

#### Foreign Keys

| Column      | References       | On Update | On Delete |
| ----------- | ---------------- | --------- | --------- |
| `tenant_id` | `adm_tenants.id` | CASCADE   | CASCADE   |

#### Indexes

- **`adm_tenant_settings_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_tenant_settings_pkey ON public.adm_tenant_settings USING btree (id)
  ```

---

### 12. `adm_tenant_vehicle_classes`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default                      | PK  |
| --- | ------------------- | -------------------------- | -------- | ---------------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()`         | 🔑  |
| 2   | `tenant_id`         | `uuid`                     | ✗        | ``                           |     |
| 3   | `code`              | `varchar(50)`              | ✗        | ``                           |     |
| 4   | `name`              | `varchar(100)`             | ✗        | ``                           |     |
| 5   | `description`       | `text`                     | ✓        | ``                           |     |
| 6   | `criteria`          | `jsonb`                    | ✓        | ``                           |     |
| 7   | `based_on_class_id` | `uuid`                     | ✓        | ``                           |     |
| 8   | `status`            | `lifecycle_status`         | ✗        | `'active'::lifecycle_status` |     |
| 9   | `metadata`          | `jsonb`                    | ✓        | ``                           |     |
| 10  | `created_at`        | `timestamp with time zone` | ✗        | `now()`                      |     |
| 11  | `updated_at`        | `timestamp with time zone` | ✗        | `now()`                      |     |
| 12  | `created_by`        | `uuid`                     | ✗        | ``                           |     |
| 13  | `updated_by`        | `uuid`                     | ✓        | ``                           |     |
| 14  | `deleted_at`        | `timestamp with time zone` | ✓        | ``                           |     |
| 15  | `deleted_by`        | `uuid`                     | ✓        | ``                           |     |
| 16  | `deletion_reason`   | `text`                     | ✓        | ``                           |     |

#### Foreign Keys

| Column              | References               | On Update | On Delete |
| ------------------- | ------------------------ | --------- | --------- |
| `based_on_class_id` | `dir_vehicle_classes.id` | NO ACTION | SET NULL  |
| `created_by`        | `adm_members.id`         | NO ACTION | RESTRICT  |
| `deleted_by`        | `adm_members.id`         | NO ACTION | RESTRICT  |
| `tenant_id`         | `adm_tenants.id`         | NO ACTION | CASCADE   |
| `updated_by`        | `adm_members.id`         | NO ACTION | RESTRICT  |

#### Indexes

- **`adm_tenant_vehicle_classes_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_tenant_vehicle_classes_pkey ON public.adm_tenant_vehicle_classes USING btree (id)
  ```

---

### 13. `adm_tenants`

**Rows**: 8 live, 25 dead

#### Columns

| #   | Column                    | Type                       | Nullable | Default                             | PK  |
| --- | ------------------------- | -------------------------- | -------- | ----------------------------------- | --- |
| 1   | `id`                      | `uuid`                     | ✗        | `uuid_generate_v4()`                | 🔑  |
| 2   | `name`                    | `text`                     | ✗        | ``                                  |     |
| 4   | `country_code`            | `varchar(2)`               | ✗        | ``                                  |     |
| 5   | `clerk_organization_id`   | `text`                     | ✓        | ``                                  |     |
| 6   | `vat_rate`                | `numeric`                  | ✓        | ``                                  |     |
| 7   | `default_currency`        | `char(3)`                  | ✗        | `'EUR'::character varying`          |     |
| 8   | `timezone`                | `text`                     | ✗        | `'Europe/Paris'::character varying` |     |
| 11  | `created_at`              | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`                 |     |
| 13  | `updated_at`              | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`                 |     |
| 15  | `deleted_at`              | `timestamp with time zone` | ✓        | ``                                  |     |
| 18  | `subdomain`               | `varchar(100)`             | ✓        | ``                                  |     |
| 19  | `status`                  | `tenant_status`            | ✗        | `'trialing'::tenant_status`         |     |
| 20  | `onboarding_completed_at` | `timestamp with time zone` | ✓        | ``                                  |     |
| 21  | `trial_ends_at`           | `timestamp with time zone` | ✓        | ``                                  |     |
| 22  | `next_invoice_date`       | `date`                     | ✓        | ``                                  |     |
| 23  | `primary_contact_email`   | `varchar(255)`             | ✓        | ``                                  |     |
| 24  | `primary_contact_phone`   | `varchar(50)`              | ✓        | ``                                  |     |
| 25  | `billing_email`           | `varchar(255)`             | ✓        | ``                                  |     |

#### Indexes

- **`adm_tenants_clerk_org_unique`**
  ```sql
  CREATE UNIQUE INDEX adm_tenants_clerk_org_unique ON public.adm_tenants USING btree (clerk_organization_id)
  ```
- **`adm_tenants_clerk_organization_id_idx`**
  ```sql
  CREATE INDEX adm_tenants_clerk_organization_id_idx ON public.adm_tenants USING btree (clerk_organization_id)
  ```
- **`adm_tenants_country_code_idx`**
  ```sql
  CREATE INDEX adm_tenants_country_code_idx ON public.adm_tenants USING btree (country_code)
  ```
- **`adm_tenants_default_currency_idx`**
  ```sql
  CREATE INDEX adm_tenants_default_currency_idx ON public.adm_tenants USING btree (default_currency)
  ```
- **`adm_tenants_deleted_at_idx`**
  ```sql
  CREATE INDEX adm_tenants_deleted_at_idx ON public.adm_tenants USING btree (deleted_at)
  ```
- **`adm_tenants_pkey`**
  ```sql
  CREATE UNIQUE INDEX adm_tenants_pkey ON public.adm_tenants USING btree (id)
  ```
- **`adm_tenants_subdomain_key`**
  ```sql
  CREATE UNIQUE INDEX adm_tenants_subdomain_key ON public.adm_tenants USING btree (subdomain)
  ```

---

### 14. `bil_billing_plans`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                    | Type                       | Nullable | Default                     | PK  |
| --- | ------------------------- | -------------------------- | -------- | --------------------------- | --- |
| 1   | `id`                      | `uuid`                     | ✗        | `uuid_generate_v4()`        | 🔑  |
| 2   | `plan_name`               | `text`                     | ✗        | ``                          |     |
| 3   | `description`             | `text`                     | ✓        | ``                          |     |
| 4   | `monthly_fee`             | `numeric`                  | ✗        | `0`                         |     |
| 5   | `annual_fee`              | `numeric`                  | ✗        | `0`                         |     |
| 6   | `currency`                | `varchar(3)`               | ✗        | ``                          |     |
| 7   | `features`                | `jsonb`                    | ✗        | `'{}'::jsonb`               |     |
| 9   | `metadata`                | `jsonb`                    | ✗        | `'{}'::jsonb`               |     |
| 10  | `created_at`              | `timestamp with time zone` | ✗        | `now()`                     |     |
| 11  | `created_by`              | `uuid`                     | ✓        | ``                          |     |
| 12  | `updated_at`              | `timestamp with time zone` | ✗        | `now()`                     |     |
| 13  | `updated_by`              | `uuid`                     | ✓        | ``                          |     |
| 14  | `deleted_at`              | `timestamp with time zone` | ✓        | ``                          |     |
| 15  | `deleted_by`              | `uuid`                     | ✓        | ``                          |     |
| 16  | `deletion_reason`         | `text`                     | ✓        | ``                          |     |
| 17  | `plan_code`               | `varchar(100)`             | ✓        | ``                          |     |
| 18  | `price_monthly`           | `numeric`                  | ✓        | ``                          |     |
| 19  | `price_yearly`            | `numeric`                  | ✓        | ``                          |     |
| 20  | `vat_rate`                | `numeric`                  | ✓        | ``                          |     |
| 21  | `max_vehicles`            | `integer`                  | ✓        | ``                          |     |
| 22  | `max_drivers`             | `integer`                  | ✓        | ``                          |     |
| 23  | `max_users`               | `integer`                  | ✓        | ``                          |     |
| 24  | `version`                 | `integer`                  | ✓        | `1`                         |     |
| 25  | `stripe_price_id_monthly` | `text`                     | ✓        | ``                          |     |
| 26  | `stripe_price_id_yearly`  | `text`                     | ✓        | ``                          |     |
| 27  | `billing_interval`        | `billing_interval`         | ✓        | `'month'::billing_interval` |     |
| 28  | `status`                  | `billing_plan_status`      | ✓        | ``                          |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `created_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `deleted_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `deleted_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `updated_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `updated_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |

#### Indexes

- **`bil_billing_plans_created_by_idx`**
  ```sql
  CREATE INDEX bil_billing_plans_created_by_idx ON public.bil_billing_plans USING btree (created_by)
  ```
- **`bil_billing_plans_deleted_at_idx`**
  ```sql
  CREATE INDEX bil_billing_plans_deleted_at_idx ON public.bil_billing_plans USING btree (deleted_at)
  ```
- **`bil_billing_plans_features_idx`**
  ```sql
  CREATE INDEX bil_billing_plans_features_idx ON public.bil_billing_plans USING gin (features)
  ```
- **`bil_billing_plans_metadata_idx`**
  ```sql
  CREATE INDEX bil_billing_plans_metadata_idx ON public.bil_billing_plans USING gin (metadata)
  ```
- **`bil_billing_plans_pkey`**
  ```sql
  CREATE UNIQUE INDEX bil_billing_plans_pkey ON public.bil_billing_plans USING btree (id)
  ```
- **`bil_billing_plans_plan_name_key`**
  ```sql
  CREATE UNIQUE INDEX bil_billing_plans_plan_name_key ON public.bil_billing_plans USING btree (plan_name) WHERE (deleted_at IS NULL)
  ```
- **`bil_billing_plans_updated_by_idx`**
  ```sql
  CREATE INDEX bil_billing_plans_updated_by_idx ON public.bil_billing_plans USING btree (updated_by)
  ```

---

### 15. `bil_payment_methods`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                       | Type                       | Nullable | Default                           | PK  |
| --- | ---------------------------- | -------------------------- | -------- | --------------------------------- | --- |
| 1   | `id`                         | `uuid`                     | ✗        | `uuid_generate_v4()`              | 🔑  |
| 2   | `tenant_id`                  | `uuid`                     | ✗        | ``                                |     |
| 4   | `provider_token`             | `text`                     | ✗        | ``                                |     |
| 5   | `expires_at`                 | `date`                     | ✓        | ``                                |     |
| 7   | `metadata`                   | `jsonb`                    | ✗        | `'{}'::jsonb`                     |     |
| 8   | `created_at`                 | `timestamp with time zone` | ✗        | `now()`                           |     |
| 9   | `created_by`                 | `uuid`                     | ✓        | ``                                |     |
| 10  | `updated_at`                 | `timestamp with time zone` | ✗        | `now()`                           |     |
| 11  | `updated_by`                 | `uuid`                     | ✓        | ``                                |     |
| 12  | `deleted_at`                 | `timestamp with time zone` | ✓        | ``                                |     |
| 13  | `deleted_by`                 | `uuid`                     | ✓        | ``                                |     |
| 14  | `deletion_reason`            | `text`                     | ✓        | ``                                |     |
| 15  | `provider`                   | `varchar(50)`              | ✓        | ``                                |     |
| 16  | `provider_payment_method_id` | `text`                     | ✓        | ``                                |     |
| 17  | `payment_type`               | `payment_type`             | ✓        | ``                                |     |
| 18  | `card_brand`                 | `varchar(50)`              | ✓        | ``                                |     |
| 19  | `card_last4`                 | `char(4)`                  | ✓        | ``                                |     |
| 20  | `card_exp_month`             | `integer`                  | ✓        | ``                                |     |
| 21  | `card_exp_year`              | `integer`                  | ✓        | ``                                |     |
| 22  | `bank_name`                  | `varchar(100)`             | ✓        | ``                                |     |
| 23  | `bank_account_last4`         | `char(4)`                  | ✓        | ``                                |     |
| 24  | `bank_country`               | `char(2)`                  | ✓        | ``                                |     |
| 25  | `status`                     | `payment_method_status`    | ✓        | `'active'::payment_method_status` |     |
| 26  | `is_default`                 | `boolean`                  | ✓        | `false`                           |     |
| 27  | `last_used_at`               | `timestamp with time zone` | ✓        | ``                                |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `deleted_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `tenant_id`  | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `updated_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |

#### Indexes

- **`bil_payment_methods_created_by_idx`**
  ```sql
  CREATE INDEX bil_payment_methods_created_by_idx ON public.bil_payment_methods USING btree (created_by)
  ```
- **`bil_payment_methods_deleted_at_idx`**
  ```sql
  CREATE INDEX bil_payment_methods_deleted_at_idx ON public.bil_payment_methods USING btree (deleted_at)
  ```
- **`bil_payment_methods_expires_at_idx`**
  ```sql
  CREATE INDEX bil_payment_methods_expires_at_idx ON public.bil_payment_methods USING btree (expires_at)
  ```
- **`bil_payment_methods_metadata_idx`**
  ```sql
  CREATE INDEX bil_payment_methods_metadata_idx ON public.bil_payment_methods USING gin (metadata)
  ```
- **`bil_payment_methods_pkey`**
  ```sql
  CREATE UNIQUE INDEX bil_payment_methods_pkey ON public.bil_payment_methods USING btree (id)
  ```
- **`bil_payment_methods_tenant_id_idx`**
  ```sql
  CREATE INDEX bil_payment_methods_tenant_id_idx ON public.bil_payment_methods USING btree (tenant_id)
  ```
- **`bil_payment_methods_updated_by_idx`**
  ```sql
  CREATE INDEX bil_payment_methods_updated_by_idx ON public.bil_payment_methods USING btree (updated_by)
  ```

---

### 16. `bil_promotion_usage`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column            | Type                       | Nullable | Default              | PK  |
| --- | ----------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`              | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `promotion_id`    | `uuid`                     | ✗        | ``                   |     |
| 3   | `tenant_id`       | `uuid`                     | ✗        | ``                   |     |
| 4   | `invoice_id`      | `uuid`                     | ✓        | ``                   |     |
| 5   | `applied_at`      | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 6   | `discount_amount` | `numeric`                  | ✗        | ``                   |     |

#### Foreign Keys

| Column         | References               | On Update | On Delete |
| -------------- | ------------------------ | --------- | --------- |
| `invoice_id`   | `bil_tenant_invoices.id` | NO ACTION | CASCADE   |
| `promotion_id` | `bil_promotions.id`      | NO ACTION | CASCADE   |
| `tenant_id`    | `adm_tenants.id`         | NO ACTION | CASCADE   |

#### Indexes

- **`bil_promotion_usage_pkey`**
  ```sql
  CREATE UNIQUE INDEX bil_promotion_usage_pkey ON public.bil_promotion_usage USING btree (id)
  ```

---

### 17. `bil_promotions`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default                      | PK  |
| --- | ------------------- | -------------------------- | -------- | ---------------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()`         | 🔑  |
| 2   | `code`              | `varchar(50)`              | ✗        | ``                           |     |
| 3   | `description`       | `text`                     | ✓        | ``                           |     |
| 4   | `discount_type`     | `promotion_discount_type`  | ✗        | ``                           |     |
| 5   | `discount_value`    | `numeric`                  | ✗        | ``                           |     |
| 6   | `currency`          | `char(3)`                  | ✓        | ``                           |     |
| 7   | `max_redemptions`   | `integer`                  | ✓        | ``                           |     |
| 8   | `redemptions_count` | `integer`                  | ✗        | `0`                          |     |
| 9   | `valid_from`        | `timestamp with time zone` | ✗        | ``                           |     |
| 10  | `valid_until`       | `timestamp with time zone` | ✗        | ``                           |     |
| 11  | `applies_to`        | `promotion_applies_to`     | ✗        | ``                           |     |
| 12  | `plan_id`           | `uuid`                     | ✓        | ``                           |     |
| 13  | `status`            | `promotion_status`         | ✗        | `'active'::promotion_status` |     |
| 14  | `metadata`          | `jsonb`                    | ✓        | `'{}'::jsonb`                |     |
| 15  | `created_at`        | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`          |     |
| 16  | `created_by`        | `uuid`                     | ✓        | ``                           |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `plan_id`    | `bil_billing_plans.id`      | NO ACTION | SET NULL  |

#### Indexes

- **`bil_promotions_code_key`**
  ```sql
  CREATE UNIQUE INDEX bil_promotions_code_key ON public.bil_promotions USING btree (code)
  ```
- **`bil_promotions_pkey`**
  ```sql
  CREATE UNIQUE INDEX bil_promotions_pkey ON public.bil_promotions USING btree (id)
  ```

---

### 18. `bil_tenant_invoice_lines`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column            | Type                       | Nullable | Default              | PK  |
| --- | ----------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`              | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `invoice_id`      | `uuid`                     | ✗        | ``                   |     |
| 3   | `description`     | `text`                     | ✗        | ``                   |     |
| 4   | `amount`          | `numeric`                  | ✗        | `0`                  |     |
| 5   | `quantity`        | `numeric`                  | ✗        | `1`                  |     |
| 6   | `metadata`        | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 7   | `created_at`      | `timestamp with time zone` | ✗        | `now()`              |     |
| 8   | `created_by`      | `uuid`                     | ✓        | ``                   |     |
| 9   | `updated_at`      | `timestamp with time zone` | ✗        | `now()`              |     |
| 10  | `updated_by`      | `uuid`                     | ✓        | ``                   |     |
| 11  | `deleted_at`      | `timestamp with time zone` | ✓        | ``                   |     |
| 12  | `deleted_by`      | `uuid`                     | ✓        | ``                   |     |
| 13  | `deletion_reason` | `text`                     | ✓        | ``                   |     |
| 14  | `line_type`       | `invoice_line_type`        | ✓        | ``                   |     |
| 15  | `unit_price`      | `numeric`                  | ✓        | ``                   |     |
| 16  | `tax_rate`        | `numeric`                  | ✓        | ``                   |     |
| 17  | `tax_amount`      | `numeric`                  | ✓        | ``                   |     |
| 18  | `discount_amount` | `numeric`                  | ✓        | ``                   |     |
| 19  | `source_type`     | `invoice_line_source_type` | ✓        | ``                   |     |
| 20  | `source_id`       | `uuid`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `deleted_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `invoice_id` | `bil_tenant_invoices.id`    | CASCADE   | CASCADE   |
| `updated_by` | `adm_provider_employees.id` | CASCADE   | SET NULL  |

#### Indexes

- **`bil_tenant_invoice_lines_created_by_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoice_lines_created_by_idx ON public.bil_tenant_invoice_lines USING btree (created_by)
  ```
- **`bil_tenant_invoice_lines_deleted_at_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoice_lines_deleted_at_idx ON public.bil_tenant_invoice_lines USING btree (deleted_at)
  ```
- **`bil_tenant_invoice_lines_description_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoice_lines_description_idx ON public.bil_tenant_invoice_lines USING btree (description)
  ```
- **`bil_tenant_invoice_lines_invoice_id_description_unique`**
  ```sql
  CREATE UNIQUE INDEX bil_tenant_invoice_lines_invoice_id_description_unique ON public.bil_tenant_invoice_lines USING btree (invoice_id, description) WHERE (deleted_at IS NULL)
  ```
- **`bil_tenant_invoice_lines_invoice_id_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoice_lines_invoice_id_idx ON public.bil_tenant_invoice_lines USING btree (invoice_id)
  ```
- **`bil_tenant_invoice_lines_metadata_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoice_lines_metadata_idx ON public.bil_tenant_invoice_lines USING gin (metadata)
  ```
- **`bil_tenant_invoice_lines_pkey`**
  ```sql
  CREATE UNIQUE INDEX bil_tenant_invoice_lines_pkey ON public.bil_tenant_invoice_lines USING btree (id)
  ```
- **`bil_tenant_invoice_lines_updated_by_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoice_lines_updated_by_idx ON public.bil_tenant_invoice_lines USING btree (updated_by)
  ```

---

### 19. `bil_tenant_invoices`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default              | PK  |
| --- | ------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`         | `uuid`                     | ✗        | ``                   |     |
| 3   | `invoice_number`    | `text`                     | ✗        | ``                   |     |
| 4   | `invoice_date`      | `date`                     | ✗        | ``                   |     |
| 5   | `due_date`          | `date`                     | ✗        | ``                   |     |
| 6   | `total_amount`      | `numeric`                  | ✗        | `0`                  |     |
| 7   | `currency`          | `varchar(3)`               | ✗        | ``                   |     |
| 9   | `metadata`          | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 10  | `created_at`        | `timestamp with time zone` | ✗        | `now()`              |     |
| 11  | `created_by`        | `uuid`                     | ✓        | ``                   |     |
| 12  | `updated_at`        | `timestamp with time zone` | ✗        | `now()`              |     |
| 13  | `updated_by`        | `uuid`                     | ✓        | ``                   |     |
| 14  | `deleted_at`        | `timestamp with time zone` | ✓        | ``                   |     |
| 15  | `deleted_by`        | `uuid`                     | ✓        | ``                   |     |
| 16  | `deletion_reason`   | `text`                     | ✓        | ``                   |     |
| 17  | `subscription_id`   | `uuid`                     | ✓        | ``                   |     |
| 18  | `period_start`      | `timestamp with time zone` | ✓        | ``                   |     |
| 19  | `period_end`        | `timestamp with time zone` | ✓        | ``                   |     |
| 20  | `paid_at`           | `timestamp with time zone` | ✓        | ``                   |     |
| 21  | `subtotal`          | `numeric`                  | ✓        | ``                   |     |
| 22  | `tax_rate`          | `numeric`                  | ✓        | ``                   |     |
| 23  | `tax_amount`        | `numeric`                  | ✓        | ``                   |     |
| 24  | `amount_paid`       | `numeric`                  | ✓        | `0`                  |     |
| 25  | `amount_due`        | `numeric`                  | ✓        | `0`                  |     |
| 26  | `status`            | `invoice_status`           | ✓        | ``                   |     |
| 27  | `stripe_invoice_id` | `varchar(255)`             | ✓        | ``                   |     |
| 28  | `document_url`      | `text`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column            | References                    | On Update | On Delete |
| ----------------- | ----------------------------- | --------- | --------- |
| `created_by`      | `adm_provider_employees.id`   | CASCADE   | SET NULL  |
| `deleted_by`      | `adm_provider_employees.id`   | CASCADE   | SET NULL  |
| `subscription_id` | `bil_tenant_subscriptions.id` | NO ACTION | CASCADE   |
| `tenant_id`       | `adm_tenants.id`              | CASCADE   | CASCADE   |
| `updated_by`      | `adm_provider_employees.id`   | CASCADE   | SET NULL  |

#### Indexes

- **`bil_tenant_invoices_created_by_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoices_created_by_idx ON public.bil_tenant_invoices USING btree (created_by)
  ```
- **`bil_tenant_invoices_deleted_at_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoices_deleted_at_idx ON public.bil_tenant_invoices USING btree (deleted_at)
  ```
- **`bil_tenant_invoices_due_date_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoices_due_date_idx ON public.bil_tenant_invoices USING btree (due_date)
  ```
- **`bil_tenant_invoices_invoice_date_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoices_invoice_date_idx ON public.bil_tenant_invoices USING btree (invoice_date)
  ```
- **`bil_tenant_invoices_invoice_number_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoices_invoice_number_idx ON public.bil_tenant_invoices USING btree (invoice_number)
  ```
- **`bil_tenant_invoices_metadata_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoices_metadata_idx ON public.bil_tenant_invoices USING gin (metadata)
  ```
- **`bil_tenant_invoices_pkey`**
  ```sql
  CREATE UNIQUE INDEX bil_tenant_invoices_pkey ON public.bil_tenant_invoices USING btree (id)
  ```
- **`bil_tenant_invoices_tenant_id_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoices_tenant_id_idx ON public.bil_tenant_invoices USING btree (tenant_id)
  ```
- **`bil_tenant_invoices_tenant_id_invoice_number_key`**
  ```sql
  CREATE UNIQUE INDEX bil_tenant_invoices_tenant_id_invoice_number_key ON public.bil_tenant_invoices USING btree (tenant_id, invoice_number) WHERE (deleted_at IS NULL)
  ```
- **`bil_tenant_invoices_updated_by_idx`**
  ```sql
  CREATE INDEX bil_tenant_invoices_updated_by_idx ON public.bil_tenant_invoices USING btree (updated_by)
  ```

---

### 20. `bil_tenant_subscriptions`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                     | Type                       | Nullable | Default                     | PK  |
| --- | -------------------------- | -------------------------- | -------- | --------------------------- | --- |
| 1   | `id`                       | `uuid`                     | ✗        | `uuid_generate_v4()`        | 🔑  |
| 2   | `tenant_id`                | `uuid`                     | ✗        | ``                          |     |
| 3   | `plan_id`                  | `uuid`                     | ✗        | ``                          |     |
| 4   | `subscription_start`       | `date`                     | ✗        | ``                          |     |
| 5   | `subscription_end`         | `date`                     | ✓        | ``                          |     |
| 7   | `metadata`                 | `jsonb`                    | ✗        | `'{}'::jsonb`               |     |
| 8   | `created_at`               | `timestamp with time zone` | ✗        | `now()`                     |     |
| 9   | `created_by`               | `uuid`                     | ✓        | ``                          |     |
| 10  | `updated_at`               | `timestamp with time zone` | ✗        | `now()`                     |     |
| 11  | `updated_by`               | `uuid`                     | ✓        | ``                          |     |
| 12  | `deleted_at`               | `timestamp with time zone` | ✓        | ``                          |     |
| 13  | `deleted_by`               | `uuid`                     | ✓        | ``                          |     |
| 14  | `deletion_reason`          | `text`                     | ✓        | ``                          |     |
| 15  | `previous_plan_id`         | `uuid`                     | ✓        | ``                          |     |
| 16  | `plan_version`             | `integer`                  | ✓        | ``                          |     |
| 17  | `payment_method_id`        | `uuid`                     | ✓        | ``                          |     |
| 18  | `billing_cycle`            | `billing_interval`         | ✓        | `'month'::billing_interval` |     |
| 19  | `current_period_start`     | `timestamp with time zone` | ✓        | ``                          |     |
| 20  | `current_period_end`       | `timestamp with time zone` | ✓        | ``                          |     |
| 21  | `trial_end`                | `timestamp with time zone` | ✓        | ``                          |     |
| 22  | `status`                   | `subscription_status`      | ✓        | ``                          |     |
| 23  | `cancel_at_period_end`     | `boolean`                  | ✓        | `true`                      |     |
| 24  | `auto_renew`               | `boolean`                  | ✓        | `true`                      |     |
| 25  | `provider`                 | `varchar(50)`              | ✓        | ``                          |     |
| 26  | `provider_subscription_id` | `text`                     | ✓        | ``                          |     |
| 27  | `provider_customer_id`     | `text`                     | ✓        | ``                          |     |

#### Foreign Keys

| Column              | References                  | On Update | On Delete |
| ------------------- | --------------------------- | --------- | --------- |
| `created_by`        | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `deleted_by`        | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `payment_method_id` | `bil_payment_methods.id`    | NO ACTION | SET NULL  |
| `plan_id`           | `bil_billing_plans.id`      | CASCADE   | CASCADE   |
| `previous_plan_id`  | `bil_billing_plans.id`      | NO ACTION | SET NULL  |
| `tenant_id`         | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `updated_by`        | `adm_provider_employees.id` | CASCADE   | SET NULL  |

#### Indexes

- **`bil_tenant_subscriptions_created_by_idx`**
  ```sql
  CREATE INDEX bil_tenant_subscriptions_created_by_idx ON public.bil_tenant_subscriptions USING btree (created_by)
  ```
- **`bil_tenant_subscriptions_deleted_at_idx`**
  ```sql
  CREATE INDEX bil_tenant_subscriptions_deleted_at_idx ON public.bil_tenant_subscriptions USING btree (deleted_at)
  ```
- **`bil_tenant_subscriptions_metadata_idx`**
  ```sql
  CREATE INDEX bil_tenant_subscriptions_metadata_idx ON public.bil_tenant_subscriptions USING gin (metadata)
  ```
- **`bil_tenant_subscriptions_pkey`**
  ```sql
  CREATE UNIQUE INDEX bil_tenant_subscriptions_pkey ON public.bil_tenant_subscriptions USING btree (id)
  ```
- **`bil_tenant_subscriptions_plan_id_idx`**
  ```sql
  CREATE INDEX bil_tenant_subscriptions_plan_id_idx ON public.bil_tenant_subscriptions USING btree (plan_id)
  ```
- **`bil_tenant_subscriptions_subscription_end_idx`**
  ```sql
  CREATE INDEX bil_tenant_subscriptions_subscription_end_idx ON public.bil_tenant_subscriptions USING btree (subscription_end)
  ```
- **`bil_tenant_subscriptions_subscription_start_idx`**
  ```sql
  CREATE INDEX bil_tenant_subscriptions_subscription_start_idx ON public.bil_tenant_subscriptions USING btree (subscription_start)
  ```
- **`bil_tenant_subscriptions_tenant_id_idx`**
  ```sql
  CREATE INDEX bil_tenant_subscriptions_tenant_id_idx ON public.bil_tenant_subscriptions USING btree (tenant_id)
  ```
- **`bil_tenant_subscriptions_tenant_id_plan_id_key`**
  ```sql
  CREATE UNIQUE INDEX bil_tenant_subscriptions_tenant_id_plan_id_key ON public.bil_tenant_subscriptions USING btree (tenant_id, plan_id) WHERE (deleted_at IS NULL)
  ```
- **`bil_tenant_subscriptions_updated_by_idx`**
  ```sql
  CREATE INDEX bil_tenant_subscriptions_updated_by_idx ON public.bil_tenant_subscriptions USING btree (updated_by)
  ```
- **`idx_bil_tenant_subscriptions_tenant`**
  ```sql
  CREATE INDEX idx_bil_tenant_subscriptions_tenant ON public.bil_tenant_subscriptions USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```

---

### 21. `bil_tenant_usage_metrics`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column            | Type                       | Nullable | Default              | PK  |
| --- | ----------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`              | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`       | `uuid`                     | ✗        | ``                   |     |
| 3   | `metric_name`     | `varchar(50)`              | ✗        | ``                   |     |
| 4   | `metric_value`    | `numeric`                  | ✗        | `0`                  |     |
| 5   | `period_start`    | `date`                     | ✗        | ``                   |     |
| 6   | `period_end`      | `date`                     | ✗        | ``                   |     |
| 7   | `metadata`        | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 8   | `created_at`      | `timestamp with time zone` | ✗        | `now()`              |     |
| 9   | `created_by`      | `uuid`                     | ✓        | ``                   |     |
| 10  | `updated_at`      | `timestamp with time zone` | ✗        | `now()`              |     |
| 11  | `updated_by`      | `uuid`                     | ✓        | ``                   |     |
| 12  | `deleted_at`      | `timestamp with time zone` | ✓        | ``                   |     |
| 13  | `deleted_by`      | `uuid`                     | ✓        | ``                   |     |
| 14  | `deletion_reason` | `text`                     | ✓        | ``                   |     |
| 15  | `metric_type_id`  | `uuid`                     | ✓        | ``                   |     |
| 16  | `subscription_id` | `uuid`                     | ✓        | ``                   |     |
| 17  | `plan_version`    | `integer`                  | ✓        | ``                   |     |
| 18  | `period_type`     | `period_type`              | ✓        | ``                   |     |
| 19  | `period_start_ts` | `timestamp with time zone` | ✓        | ``                   |     |
| 20  | `period_end_ts`   | `timestamp with time zone` | ✓        | ``                   |     |
| 21  | `metric_source`   | `metric_source`            | ✓        | ``                   |     |

#### Foreign Keys

| Column            | References                    | On Update | On Delete |
| ----------------- | ----------------------------- | --------- | --------- |
| `created_by`      | `adm_provider_employees.id`   | CASCADE   | SET NULL  |
| `deleted_by`      | `adm_provider_employees.id`   | CASCADE   | SET NULL  |
| `metric_type_id`  | `bil_usage_metric_types.id`   | NO ACTION | RESTRICT  |
| `subscription_id` | `bil_tenant_subscriptions.id` | NO ACTION | CASCADE   |
| `tenant_id`       | `adm_tenants.id`              | CASCADE   | CASCADE   |
| `updated_by`      | `adm_provider_employees.id`   | CASCADE   | SET NULL  |

#### Indexes

- **`bil_tenant_usage_metrics_created_by_idx`**
  ```sql
  CREATE INDEX bil_tenant_usage_metrics_created_by_idx ON public.bil_tenant_usage_metrics USING btree (created_by)
  ```
- **`bil_tenant_usage_metrics_deleted_at_idx`**
  ```sql
  CREATE INDEX bil_tenant_usage_metrics_deleted_at_idx ON public.bil_tenant_usage_metrics USING btree (deleted_at)
  ```
- **`bil_tenant_usage_metrics_metadata_idx`**
  ```sql
  CREATE INDEX bil_tenant_usage_metrics_metadata_idx ON public.bil_tenant_usage_metrics USING gin (metadata)
  ```
- **`bil_tenant_usage_metrics_metric_name_idx`**
  ```sql
  CREATE INDEX bil_tenant_usage_metrics_metric_name_idx ON public.bil_tenant_usage_metrics USING btree (metric_name)
  ```
- **`bil_tenant_usage_metrics_period_end_idx`**
  ```sql
  CREATE INDEX bil_tenant_usage_metrics_period_end_idx ON public.bil_tenant_usage_metrics USING btree (period_end)
  ```
- **`bil_tenant_usage_metrics_period_start_idx`**
  ```sql
  CREATE INDEX bil_tenant_usage_metrics_period_start_idx ON public.bil_tenant_usage_metrics USING btree (period_start)
  ```
- **`bil_tenant_usage_metrics_pkey`**
  ```sql
  CREATE UNIQUE INDEX bil_tenant_usage_metrics_pkey ON public.bil_tenant_usage_metrics USING btree (id)
  ```
- **`bil_tenant_usage_metrics_tenant_id_idx`**
  ```sql
  CREATE INDEX bil_tenant_usage_metrics_tenant_id_idx ON public.bil_tenant_usage_metrics USING btree (tenant_id)
  ```
- **`bil_tenant_usage_metrics_tenant_id_metric_name_period_start_key`**
  ```sql
  CREATE UNIQUE INDEX bil_tenant_usage_metrics_tenant_id_metric_name_period_start_key ON public.bil_tenant_usage_metrics USING btree (tenant_id, metric_name, period_start) WHERE (deleted_at IS NULL)
  ```
- **`bil_tenant_usage_metrics_updated_by_idx`**
  ```sql
  CREATE INDEX bil_tenant_usage_metrics_updated_by_idx ON public.bil_tenant_usage_metrics USING btree (updated_by)
  ```

---

### 22. `bil_usage_metric_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column               | Type                       | Nullable | Default              | PK  |
| --- | -------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                 | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `name`               | `varchar(50)`              | ✗        | ``                   |     |
| 3   | `unit`               | `varchar(20)`              | ✗        | ``                   |     |
| 4   | `description`        | `text`                     | ✓        | ``                   |     |
| 5   | `aggregation_method` | `aggregation_method`       | ✗        | ``                   |     |
| 6   | `created_at`         | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |

#### Indexes

- **`bil_usage_metric_types_name_key`**
  ```sql
  CREATE UNIQUE INDEX bil_usage_metric_types_name_key ON public.bil_usage_metric_types USING btree (name)
  ```
- **`bil_usage_metric_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX bil_usage_metric_types_pkey ON public.bil_usage_metric_types USING btree (id)
  ```

---

### 23. `crm_addresses`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column         | Type                       | Nullable | Default              | PK  |
| --- | -------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`           | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `street_line1` | `text`                     | ✗        | ``                   |     |
| 3   | `street_line2` | `text`                     | ✓        | ``                   |     |
| 4   | `city`         | `varchar(100)`             | ✗        | ``                   |     |
| 5   | `state`        | `varchar(100)`             | ✓        | ``                   |     |
| 6   | `postal_code`  | `varchar(20)`              | ✓        | ``                   |     |
| 7   | `country_code` | `char(2)`                  | ✗        | ``                   |     |
| 8   | `address_type` | `address_type`             | ✓        | ``                   |     |
| 9   | `is_default`   | `boolean`                  | ✗        | `false`              |     |
| 10  | `created_at`   | `timestamp with time zone` | ✗        | `now()`              |     |

#### Indexes

- **`crm_addresses_pkey`**
  ```sql
  CREATE UNIQUE INDEX crm_addresses_pkey ON public.crm_addresses USING btree (id)
  ```

---

### 24. `crm_contracts`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                     | Type                       | Nullable | Default              | PK  |
| --- | -------------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                       | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 3   | `lead_id`                  | `uuid`                     | ✗        | ``                   |     |
| 4   | `contract_reference`       | `text`                     | ✗        | ``                   |     |
| 5   | `contract_date`            | `date`                     | ✗        | ``                   |     |
| 6   | `effective_date`           | `date`                     | ✗        | ``                   |     |
| 7   | `expiry_date`              | `date`                     | ✓        | ``                   |     |
| 8   | `total_value`              | `numeric`                  | ✗        | ``                   |     |
| 9   | `currency`                 | `varchar(3)`               | ✗        | ``                   |     |
| 10  | `status`                   | `text`                     | ✗        | `'active'::text`     |     |
| 11  | `metadata`                 | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 12  | `created_at`               | `timestamp with time zone` | ✗        | `now()`              |     |
| 13  | `created_by`               | `uuid`                     | ✓        | ``                   |     |
| 14  | `updated_at`               | `timestamp with time zone` | ✗        | `now()`              |     |
| 15  | `updated_by`               | `uuid`                     | ✓        | ``                   |     |
| 16  | `deleted_at`               | `timestamp with time zone` | ✓        | ``                   |     |
| 17  | `deleted_by`               | `uuid`                     | ✓        | ``                   |     |
| 18  | `deletion_reason`          | `text`                     | ✓        | ``                   |     |
| 19  | `opportunity_id`           | `uuid`                     | ✓        | ``                   |     |
| 20  | `contract_code`            | `text`                     | ✓        | ``                   |     |
| 21  | `signature_date`           | `date`                     | ✓        | ``                   |     |
| 22  | `expiration_date`          | `date`                     | ✓        | ``                   |     |
| 23  | `vat_rate`                 | `numeric`                  | ✓        | ``                   |     |
| 24  | `renewal_type`             | `renewal_type`             | ✓        | ``                   |     |
| 25  | `auto_renew`               | `boolean`                  | ✓        | `false`              |     |
| 26  | `renewal_date`             | `date`                     | ✓        | ``                   |     |
| 27  | `notice_period_days`       | `integer`                  | ✓        | ``                   |     |
| 28  | `renewed_from_contract_id` | `uuid`                     | ✓        | ``                   |     |
| 29  | `tenant_id`                | `uuid`                     | ✗        | ``                   |     |
| 30  | `plan_id`                  | `uuid`                     | ✓        | ``                   |     |
| 31  | `subscription_id`          | `uuid`                     | ✓        | ``                   |     |
| 32  | `company_name`             | `text`                     | ✓        | ``                   |     |
| 33  | `contact_name`             | `text`                     | ✓        | ``                   |     |
| 34  | `contact_email`            | `citext`                   | ✓        | ``                   |     |
| 35  | `contact_phone`            | `varchar(50)`              | ✓        | ``                   |     |
| 36  | `billing_address_id`       | `uuid`                     | ✓        | ``                   |     |
| 37  | `version_number`           | `integer`                  | ✓        | `1`                  |     |
| 38  | `document_url`             | `text`                     | ✓        | ``                   |     |
| 39  | `notes`                    | `text`                     | ✓        | ``                   |     |
| 40  | `approved_by`              | `uuid`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column                     | References                    | On Update | On Delete |
| -------------------------- | ----------------------------- | --------- | --------- |
| `approved_by`              | `adm_provider_employees.id`   | NO ACTION | SET NULL  |
| `billing_address_id`       | `crm_addresses.id`            | NO ACTION | SET NULL  |
| `created_by`               | `adm_members.id`              | CASCADE   | SET NULL  |
| `created_by`               | `adm_provider_employees.id`   | NO ACTION | SET NULL  |
| `deleted_by`               | `adm_provider_employees.id`   | NO ACTION | SET NULL  |
| `deleted_by`               | `adm_members.id`              | CASCADE   | SET NULL  |
| `lead_id`                  | `crm_leads.id`                | CASCADE   | SET NULL  |
| `opportunity_id`           | `crm_opportunities.id`        | NO ACTION | SET NULL  |
| `plan_id`                  | `bil_billing_plans.id`        | NO ACTION | SET NULL  |
| `renewed_from_contract_id` | `crm_contracts.id`            | NO ACTION | SET NULL  |
| `subscription_id`          | `bil_tenant_subscriptions.id` | NO ACTION | SET NULL  |
| `tenant_id`                | `adm_tenants.id`              | NO ACTION | SET NULL  |
| `updated_by`               | `adm_provider_employees.id`   | NO ACTION | SET NULL  |
| `updated_by`               | `adm_members.id`              | CASCADE   | SET NULL  |

#### Indexes

- **`crm_contracts_client_id_idx`**
  ```sql
  CREATE INDEX crm_contracts_client_id_idx ON public.crm_contracts USING btree (lead_id)
  ```
- **`crm_contracts_contract_code_key`**
  ```sql
  CREATE UNIQUE INDEX crm_contracts_contract_code_key ON public.crm_contracts USING btree (contract_code)
  ```
- **`crm_contracts_contract_date_idx`**
  ```sql
  CREATE INDEX crm_contracts_contract_date_idx ON public.crm_contracts USING btree (contract_date)
  ```
- **`crm_contracts_created_by_idx`**
  ```sql
  CREATE INDEX crm_contracts_created_by_idx ON public.crm_contracts USING btree (created_by)
  ```
- **`crm_contracts_deleted_at_idx`**
  ```sql
  CREATE INDEX crm_contracts_deleted_at_idx ON public.crm_contracts USING btree (deleted_at)
  ```
- **`crm_contracts_effective_date_idx`**
  ```sql
  CREATE INDEX crm_contracts_effective_date_idx ON public.crm_contracts USING btree (effective_date)
  ```
- **`crm_contracts_expiry_date_idx`**
  ```sql
  CREATE INDEX crm_contracts_expiry_date_idx ON public.crm_contracts USING btree (expiry_date)
  ```
- **`crm_contracts_metadata_idx`**
  ```sql
  CREATE INDEX crm_contracts_metadata_idx ON public.crm_contracts USING gin (metadata)
  ```
- **`crm_contracts_pkey`**
  ```sql
  CREATE UNIQUE INDEX crm_contracts_pkey ON public.crm_contracts USING btree (id)
  ```
- **`crm_contracts_status_active_idx`**
  ```sql
  CREATE INDEX crm_contracts_status_active_idx ON public.crm_contracts USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`crm_contracts_updated_by_idx`**
  ```sql
  CREATE INDEX crm_contracts_updated_by_idx ON public.crm_contracts USING btree (updated_by)
  ```
- **`idx_crm_contracts_billing_address_id`**
  ```sql
  CREATE INDEX idx_crm_contracts_billing_address_id ON public.crm_contracts USING btree (billing_address_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_crm_contracts_contract_code_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_crm_contracts_contract_code_unique ON public.crm_contracts USING btree (contract_code) WHERE (deleted_at IS NULL)
  ```
- **`idx_crm_contracts_contract_reference_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_crm_contracts_contract_reference_unique ON public.crm_contracts USING btree (contract_reference) WHERE (deleted_at IS NULL)
  ```
- **`idx_crm_contracts_opportunity_id`**
  ```sql
  CREATE INDEX idx_crm_contracts_opportunity_id ON public.crm_contracts USING btree (opportunity_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_crm_contracts_tenant`**
  ```sql
  CREATE INDEX idx_crm_contracts_tenant ON public.crm_contracts USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```

---

### 25. `crm_lead_sources`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column        | Type                       | Nullable | Default              | PK  |
| --- | ------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`          | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `name`        | `varchar(50)`              | ✗        | ``                   |     |
| 3   | `description` | `text`                     | ✓        | ``                   |     |
| 4   | `is_active`   | `boolean`                  | ✗        | `true`               |     |
| 5   | `created_at`  | `timestamp with time zone` | ✗        | `now()`              |     |

#### Indexes

- **`crm_lead_sources_name_key`**
  ```sql
  CREATE UNIQUE INDEX crm_lead_sources_name_key ON public.crm_lead_sources USING btree (name)
  ```
- **`crm_lead_sources_pkey`**
  ```sql
  CREATE UNIQUE INDEX crm_lead_sources_pkey ON public.crm_lead_sources USING btree (id)
  ```

---

### 26. `crm_leads`

**Rows**: 3 live, 12 dead

#### Columns

| #   | Column                | Type                       | Nullable | Default              | PK  |
| --- | --------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                  | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 3   | `full_name`           | `text`                     | ✗        | ``                   |     |
| 4   | `email`               | `text`                     | ✗        | ``                   |     |
| 5   | `phone`               | `text`                     | ✗        | ``                   |     |
| 6   | `demo_company_name`   | `text`                     | ✓        | ``                   |     |
| 10  | `source`              | `text`                     | ✓        | ``                   |     |
| 16  | `status`              | `text`                     | ✗        | `'new'::text`        |     |
| 20  | `message`             | `text`                     | ✓        | ``                   |     |
| 22  | `created_at`          | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 24  | `updated_at`          | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 29  | `country_code`        | `varchar(2)`               | ✓        | ``                   |     |
| 30  | `fleet_size`          | `varchar(50)`              | ✓        | ``                   |     |
| 31  | `current_software`    | `varchar(255)`             | ✓        | ``                   |     |
| 32  | `assigned_to`         | `uuid`                     | ✓        | ``                   |     |
| 33  | `qualification_score` | `integer`                  | ✓        | ``                   |     |
| 34  | `qualification_notes` | `text`                     | ✓        | ``                   |     |
| 35  | `qualified_date`      | `timestamp with time zone` | ✓        | ``                   |     |
| 36  | `converted_date`      | `timestamp with time zone` | ✓        | ``                   |     |
| 37  | `utm_source`          | `varchar(255)`             | ✓        | ``                   |     |
| 38  | `utm_medium`          | `varchar(255)`             | ✓        | ``                   |     |
| 39  | `utm_campaign`        | `varchar(255)`             | ✓        | ``                   |     |
| 40  | `metadata`            | `jsonb`                    | ✓        | `'{}'::jsonb`        |     |
| 41  | `created_by`          | `uuid`                     | ✓        | ``                   |     |
| 42  | `updated_by`          | `uuid`                     | ✓        | ``                   |     |
| 43  | `deleted_at`          | `timestamp with time zone` | ✓        | ``                   |     |
| 44  | `deleted_by`          | `uuid`                     | ✓        | ``                   |     |
| 45  | `deletion_reason`     | `text`                     | ✓        | ``                   |     |
| 46  | `lead_code`           | `varchar(50)`              | ✓        | ``                   |     |
| 47  | `first_name`          | `text`                     | ✓        | ``                   |     |
| 48  | `last_name`           | `text`                     | ✓        | ``                   |     |
| 49  | `company_name`        | `text`                     | ✓        | ``                   |     |
| 50  | `industry`            | `text`                     | ✓        | ``                   |     |
| 51  | `company_size`        | `integer`                  | ✓        | ``                   |     |
| 52  | `website_url`         | `text`                     | ✓        | ``                   |     |
| 53  | `linkedin_url`        | `text`                     | ✓        | ``                   |     |
| 54  | `city`                | `text`                     | ✓        | ``                   |     |
| 55  | `lead_stage`          | `lead_stage`               | ✓        | ``                   |     |
| 56  | `fit_score`           | `numeric`                  | ✓        | ``                   |     |
| 57  | `engagement_score`    | `numeric`                  | ✓        | ``                   |     |
| 58  | `scoring`             | `jsonb`                    | ✓        | ``                   |     |
| 59  | `gdpr_consent`        | `boolean`                  | ✓        | ``                   |     |
| 60  | `consent_at`          | `timestamp with time zone` | ✓        | ``                   |     |
| 61  | `source_id`           | `uuid`                     | ✓        | ``                   |     |
| 62  | `opportunity_id`      | `uuid`                     | ✓        | ``                   |     |
| 63  | `next_action_date`    | `timestamp with time zone` | ✓        | ``                   |     |

#### Foreign Keys

| Column           | References                  | On Update | On Delete |
| ---------------- | --------------------------- | --------- | --------- |
| `assigned_to`    | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `created_by`     | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `deleted_by`     | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `opportunity_id` | `crm_opportunities.id`      | NO ACTION | SET NULL  |
| `source_id`      | `crm_lead_sources.id`       | NO ACTION | SET NULL  |
| `updated_by`     | `adm_provider_employees.id` | NO ACTION | SET NULL  |

#### Indexes

- **`crm_leads_assigned_to_idx`**
  ```sql
  CREATE INDEX crm_leads_assigned_to_idx ON public.crm_leads USING btree (assigned_to) WHERE (deleted_at IS NULL)
  ```
- **`crm_leads_country_code_idx`**
  ```sql
  CREATE INDEX crm_leads_country_code_idx ON public.crm_leads USING btree (country_code) WHERE (deleted_at IS NULL)
  ```
- **`crm_leads_created_at_idx`**
  ```sql
  CREATE INDEX crm_leads_created_at_idx ON public.crm_leads USING btree (created_at DESC)
  ```
- **`crm_leads_deleted_at_idx`**
  ```sql
  CREATE INDEX crm_leads_deleted_at_idx ON public.crm_leads USING btree (deleted_at)
  ```
- **`crm_leads_email_unique_active`**
  ```sql
  CREATE UNIQUE INDEX crm_leads_email_unique_active ON public.crm_leads USING btree (email) WHERE (deleted_at IS NULL)
  ```
- **`crm_leads_lead_code_key`**
  ```sql
  CREATE UNIQUE INDEX crm_leads_lead_code_key ON public.crm_leads USING btree (lead_code)
  ```
- **`crm_leads_notes_gin`**
  ```sql
  CREATE INDEX crm_leads_notes_gin ON public.crm_leads USING gin (to_tsvector('english'::regconfig, COALESCE(message, ''::text)))
  ```
- **`crm_leads_pkey`**
  ```sql
  CREATE UNIQUE INDEX crm_leads_pkey ON public.crm_leads USING btree (id)
  ```
- **`crm_leads_status_idx`**
  ```sql
  CREATE INDEX crm_leads_status_idx ON public.crm_leads USING btree (status)
  ```
- **`idx_crm_leads_metadata`**
  ```sql
  CREATE INDEX idx_crm_leads_metadata ON public.crm_leads USING gin (metadata)
  ```

---

### 27. `crm_opportunities`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                | Type                       | Nullable | Default                      | PK  |
| --- | --------------------- | -------------------------- | -------- | ---------------------------- | --- |
| 1   | `id`                  | `uuid`                     | ✗        | `uuid_generate_v4()`         | 🔑  |
| 3   | `lead_id`             | `uuid`                     | ✗        | ``                           |     |
| 4   | `stage`               | `text`                     | ✗        | `'prospect'::text`           |     |
| 5   | `expected_value`      | `numeric`                  | ✓        | ``                           |     |
| 6   | `close_date`          | `date`                     | ✓        | ``                           |     |
| 7   | `assigned_to`         | `uuid`                     | ✓        | ``                           |     |
| 8   | `metadata`            | `jsonb`                    | ✗        | `'{}'::jsonb`                |     |
| 9   | `created_at`          | `timestamp with time zone` | ✗        | `now()`                      |     |
| 10  | `created_by`          | `uuid`                     | ✓        | ``                           |     |
| 11  | `updated_at`          | `timestamp with time zone` | ✗        | `now()`                      |     |
| 12  | `updated_by`          | `uuid`                     | ✓        | ``                           |     |
| 13  | `deleted_at`          | `timestamp with time zone` | ✓        | ``                           |     |
| 14  | `deleted_by`          | `uuid`                     | ✓        | ``                           |     |
| 15  | `deletion_reason`     | `text`                     | ✓        | ``                           |     |
| 16  | `probability`         | `integer`                  | ✓        | ``                           |     |
| 17  | `status`              | `opportunity_status`       | ✗        | `'open'::opportunity_status` |     |
| 18  | `currency`            | `char(3)`                  | ✓        | `'EUR'::bpchar`              |     |
| 19  | `discount_amount`     | `numeric`                  | ✓        | ``                           |     |
| 20  | `probability_percent` | `numeric`                  | ✓        | `0`                          |     |
| 21  | `forecast_value`      | `numeric`                  | ✓        | ``                           |     |
| 22  | `won_value`           | `numeric`                  | ✓        | ``                           |     |
| 23  | `expected_close_date` | `date`                     | ✓        | ``                           |     |
| 24  | `won_date`            | `date`                     | ✓        | ``                           |     |
| 25  | `lost_date`           | `date`                     | ✓        | ``                           |     |
| 26  | `owner_id`            | `uuid`                     | ✓        | ``                           |     |
| 27  | `loss_reason_id`      | `uuid`                     | ✓        | ``                           |     |
| 28  | `plan_id`             | `uuid`                     | ✓        | ``                           |     |
| 29  | `contract_id`         | `uuid`                     | ✓        | ``                           |     |
| 30  | `pipeline_id`         | `uuid`                     | ✓        | ``                           |     |
| 31  | `notes`               | `text`                     | ✓        | ``                           |     |

#### Foreign Keys

| Column           | References                        | On Update | On Delete |
| ---------------- | --------------------------------- | --------- | --------- |
| `assigned_to`    | `adm_provider_employees.id`       | NO ACTION | SET NULL  |
| `assigned_to`    | `adm_members.id`                  | CASCADE   | SET NULL  |
| `contract_id`    | `crm_contracts.id`                | NO ACTION | SET NULL  |
| `created_by`     | `adm_provider_employees.id`       | NO ACTION | SET NULL  |
| `created_by`     | `adm_members.id`                  | CASCADE   | SET NULL  |
| `deleted_by`     | `adm_provider_employees.id`       | NO ACTION | SET NULL  |
| `deleted_by`     | `adm_members.id`                  | CASCADE   | SET NULL  |
| `lead_id`        | `crm_leads.id`                    | CASCADE   | CASCADE   |
| `loss_reason_id` | `crm_opportunity_loss_reasons.id` | NO ACTION | SET NULL  |
| `owner_id`       | `adm_provider_employees.id`       | NO ACTION | SET NULL  |
| `pipeline_id`    | `crm_pipelines.id`                | NO ACTION | SET NULL  |
| `plan_id`        | `bil_billing_plans.id`            | NO ACTION | SET NULL  |
| `updated_by`     | `adm_provider_employees.id`       | NO ACTION | SET NULL  |
| `updated_by`     | `adm_members.id`                  | CASCADE   | SET NULL  |

#### Indexes

- **`crm_opportunities_assigned_to_idx`**
  ```sql
  CREATE INDEX crm_opportunities_assigned_to_idx ON public.crm_opportunities USING btree (assigned_to)
  ```
- **`crm_opportunities_close_date_idx`**
  ```sql
  CREATE INDEX crm_opportunities_close_date_idx ON public.crm_opportunities USING btree (close_date)
  ```
- **`crm_opportunities_created_by_idx`**
  ```sql
  CREATE INDEX crm_opportunities_created_by_idx ON public.crm_opportunities USING btree (created_by)
  ```
- **`crm_opportunities_deleted_at_idx`**
  ```sql
  CREATE INDEX crm_opportunities_deleted_at_idx ON public.crm_opportunities USING btree (deleted_at)
  ```
- **`crm_opportunities_lead_id_idx`**
  ```sql
  CREATE INDEX crm_opportunities_lead_id_idx ON public.crm_opportunities USING btree (lead_id)
  ```
- **`crm_opportunities_metadata_idx`**
  ```sql
  CREATE INDEX crm_opportunities_metadata_idx ON public.crm_opportunities USING gin (metadata)
  ```
- **`crm_opportunities_opportunity_stage_idx`**
  ```sql
  CREATE INDEX crm_opportunities_opportunity_stage_idx ON public.crm_opportunities USING btree (stage) WHERE (deleted_at IS NULL)
  ```
- **`crm_opportunities_pkey`**
  ```sql
  CREATE UNIQUE INDEX crm_opportunities_pkey ON public.crm_opportunities USING btree (id)
  ```
- **`crm_opportunities_updated_by_idx`**
  ```sql
  CREATE INDEX crm_opportunities_updated_by_idx ON public.crm_opportunities USING btree (updated_by)
  ```
- **`idx_crm_opportunities_lead`**
  ```sql
  CREATE INDEX idx_crm_opportunities_lead ON public.crm_opportunities USING btree (lead_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_crm_opportunities_lead_id`**
  ```sql
  CREATE INDEX idx_crm_opportunities_lead_id ON public.crm_opportunities USING btree (lead_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_crm_opportunities_pipeline_id`**
  ```sql
  CREATE INDEX idx_crm_opportunities_pipeline_id ON public.crm_opportunities USING btree (pipeline_id) WHERE (deleted_at IS NULL)
  ```

---

### 28. `crm_opportunity_loss_reasons`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column        | Type           | Nullable | Default              | PK  |
| --- | ------------- | -------------- | -------- | -------------------- | --- |
| 1   | `id`          | `uuid`         | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `name`        | `varchar(100)` | ✗        | ``                   |     |
| 3   | `category`    | `varchar(50)`  | ✓        | ``                   |     |
| 4   | `description` | `text`         | ✓        | ``                   |     |
| 5   | `is_active`   | `boolean`      | ✗        | `true`               |     |

#### Indexes

- **`crm_opportunity_loss_reasons_name_key`**
  ```sql
  CREATE UNIQUE INDEX crm_opportunity_loss_reasons_name_key ON public.crm_opportunity_loss_reasons USING btree (name)
  ```
- **`crm_opportunity_loss_reasons_pkey`**
  ```sql
  CREATE UNIQUE INDEX crm_opportunity_loss_reasons_pkey ON public.crm_opportunity_loss_reasons USING btree (id)
  ```

---

### 29. `crm_pipelines`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                | Type                       | Nullable | Default              | PK  |
| --- | --------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                  | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `name`                | `varchar(100)`             | ✗        | ``                   |     |
| 3   | `description`         | `text`                     | ✓        | ``                   |     |
| 4   | `stages`              | `jsonb`                    | ✗        | ``                   |     |
| 5   | `default_probability` | `jsonb`                    | ✓        | ``                   |     |
| 6   | `is_default`          | `boolean`                  | ✗        | `false`              |     |
| 7   | `is_active`           | `boolean`                  | ✗        | `true`               |     |
| 8   | `created_at`          | `timestamp with time zone` | ✗        | `now()`              |     |

#### Indexes

- **`crm_pipelines_pkey`**
  ```sql
  CREATE UNIQUE INDEX crm_pipelines_pkey ON public.crm_pipelines USING btree (id)
  ```

---

### 30. `dir_car_makes`

**Rows**: 17 live, 49 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default                      | PK  |
| --- | ------------------- | -------------------------- | -------- | ---------------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()`         | 🔑  |
| 2   | `tenant_id`         | `uuid`                     | ✗        | ``                           |     |
| 3   | `name`              | `text`                     | ✗        | ``                           |     |
| 4   | `created_at`        | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`          |     |
| 6   | `updated_at`        | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`          |     |
| 11  | `code`              | `varchar(50)`              | ✗        | ``                           |     |
| 12  | `country_of_origin` | `char(2)`                  | ✓        | ``                           |     |
| 13  | `parent_company`    | `varchar(100)`             | ✓        | ``                           |     |
| 14  | `founded_year`      | `integer`                  | ✓        | ``                           |     |
| 15  | `logo_url`          | `text`                     | ✓        | ``                           |     |
| 16  | `status`            | `lifecycle_status`         | ✗        | `'active'::lifecycle_status` |     |
| 17  | `metadata`          | `jsonb`                    | ✓        | ``                           |     |
| 18  | `created_by`        | `uuid`                     | ✓        | ``                           |     |
| 19  | `updated_by`        | `uuid`                     | ✓        | ``                           |     |
| 20  | `deleted_at`        | `timestamp with time zone` | ✓        | ``                           |     |
| 21  | `deleted_by`        | `uuid`                     | ✓        | ``                           |     |
| 22  | `deletion_reason`   | `text`                     | ✓        | ``                           |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `deleted_by` | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `tenant_id`  | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `tenant_id`  | `adm_tenants.id`            | NO ACTION | CASCADE   |
| `updated_by` | `adm_provider_employees.id` | NO ACTION | RESTRICT  |

#### Indexes

- **`dir_car_makes_created_at_idx`**
  ```sql
  CREATE INDEX dir_car_makes_created_at_idx ON public.dir_car_makes USING btree (created_at)
  ```
- **`dir_car_makes_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_car_makes_pkey ON public.dir_car_makes USING btree (id)
  ```
- **`dir_car_makes_tenant_id_idx`**
  ```sql
  CREATE INDEX dir_car_makes_tenant_id_idx ON public.dir_car_makes USING btree (tenant_id)
  ```
- **`dir_car_makes_tenant_name_uq`**
  ```sql
  CREATE UNIQUE INDEX dir_car_makes_tenant_name_uq ON public.dir_car_makes USING btree (tenant_id, name) WHERE (deleted_at IS NULL)
  ```
- **`dir_car_makes_updated_at_idx`**
  ```sql
  CREATE INDEX dir_car_makes_updated_at_idx ON public.dir_car_makes USING btree (updated_at)
  ```
- **`idx_dir_car_makes_code`**
  ```sql
  CREATE UNIQUE INDEX idx_dir_car_makes_code ON public.dir_car_makes USING btree (code)
  ```
- **`idx_dir_car_makes_tenant_code_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_dir_car_makes_tenant_code_unique ON public.dir_car_makes USING btree (tenant_id, code) WHERE (deleted_at IS NULL)
  ```

---

### 31. `dir_car_models`

**Rows**: 37 live, 41 dead

#### Columns

| #   | Column             | Type                       | Nullable | Default                      | PK  |
| --- | ------------------ | -------------------------- | -------- | ---------------------------- | --- |
| 1   | `id`               | `uuid`                     | ✗        | `uuid_generate_v4()`         | 🔑  |
| 2   | `tenant_id`        | `uuid`                     | ✗        | ``                           |     |
| 3   | `make_id`          | `uuid`                     | ✗        | ``                           |     |
| 4   | `name`             | `text`                     | ✗        | ``                           |     |
| 6   | `created_at`       | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`          |     |
| 8   | `updated_at`       | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`          |     |
| 13  | `vehicle_class_id` | `uuid`                     | ✓        | ``                           |     |
| 14  | `code`             | `varchar(50)`              | ✗        | ``                           |     |
| 15  | `year_start`       | `integer`                  | ✓        | ``                           |     |
| 16  | `year_end`         | `integer`                  | ✓        | ``                           |     |
| 17  | `body_type`        | `varchar(50)`              | ✓        | ``                           |     |
| 18  | `fuel_type`        | `varchar(50)`              | ✓        | ``                           |     |
| 19  | `transmission`     | `varchar(50)`              | ✓        | ``                           |     |
| 20  | `seats_min`        | `integer`                  | ✓        | ``                           |     |
| 21  | `seats_max`        | `integer`                  | ✓        | ``                           |     |
| 22  | `length_mm`        | `integer`                  | ✓        | ``                           |     |
| 23  | `width_mm`         | `integer`                  | ✓        | ``                           |     |
| 24  | `height_mm`        | `integer`                  | ✓        | ``                           |     |
| 25  | `metadata`         | `jsonb`                    | ✓        | ``                           |     |
| 26  | `status`           | `car_model_status`         | ✗        | `'active'::car_model_status` |     |
| 27  | `created_by`       | `uuid`                     | ✓        | ``                           |     |
| 28  | `updated_by`       | `uuid`                     | ✓        | ``                           |     |
| 29  | `deleted_at`       | `timestamp with time zone` | ✓        | ``                           |     |
| 30  | `deleted_by`       | `uuid`                     | ✓        | ``                           |     |
| 31  | `deletion_reason`  | `text`                     | ✓        | ``                           |     |

#### Foreign Keys

| Column             | References                  | On Update | On Delete |
| ------------------ | --------------------------- | --------- | --------- |
| `created_by`       | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `deleted_by`       | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `make_id`          | `dir_car_makes.id`          | CASCADE   | CASCADE   |
| `make_id`          | `dir_car_makes.id`          | NO ACTION | RESTRICT  |
| `tenant_id`        | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `tenant_id`        | `adm_tenants.id`            | NO ACTION | CASCADE   |
| `updated_by`       | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `vehicle_class_id` | `dir_vehicle_classes.id`    | NO ACTION | SET NULL  |
| `vehicle_class_id` | `dir_vehicle_classes.id`    | CASCADE   | SET NULL  |

#### Indexes

- **`dir_car_models_created_at_idx`**
  ```sql
  CREATE INDEX dir_car_models_created_at_idx ON public.dir_car_models USING btree (created_at)
  ```
- **`dir_car_models_make_id_idx`**
  ```sql
  CREATE INDEX dir_car_models_make_id_idx ON public.dir_car_models USING btree (make_id)
  ```
- **`dir_car_models_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_car_models_pkey ON public.dir_car_models USING btree (id)
  ```
- **`dir_car_models_tenant_id_idx`**
  ```sql
  CREATE INDEX dir_car_models_tenant_id_idx ON public.dir_car_models USING btree (tenant_id)
  ```
- **`dir_car_models_tenant_make_name_uq`**
  ```sql
  CREATE UNIQUE INDEX dir_car_models_tenant_make_name_uq ON public.dir_car_models USING btree (tenant_id, make_id, name)
  ```
- **`dir_car_models_updated_at_idx`**
  ```sql
  CREATE INDEX dir_car_models_updated_at_idx ON public.dir_car_models USING btree (updated_at)
  ```
- **`dir_car_models_vehicle_class_id_idx`**
  ```sql
  CREATE INDEX dir_car_models_vehicle_class_id_idx ON public.dir_car_models USING btree (vehicle_class_id)
  ```
- **`idx_dir_car_models_make_code`**
  ```sql
  CREATE UNIQUE INDEX idx_dir_car_models_make_code ON public.dir_car_models USING btree (make_id, code)
  ```
- **`idx_dir_car_models_tenant_code_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_dir_car_models_tenant_code_unique ON public.dir_car_models USING btree (tenant_id, code) WHERE ((deleted_at IS NULL) AND (tenant_id IS NOT NULL))
  ```

---

### 32. `dir_country_regulations`

**Rows**: 3 live, 30 dead

#### Columns

| #   | Column                          | Type                       | Nullable | Default                       | PK  |
| --- | ------------------------------- | -------------------------- | -------- | ----------------------------- | --- |
| 1   | `country_code`                  | `char(2)`                  | ✗        | ``                            | 🔑  |
| 2   | `vehicle_max_age`               | `integer`                  | ✓        | ``                            |     |
| 3   | `min_vehicle_class`             | `text`                     | ✓        | ``                            |     |
| 5   | `min_fare_per_trip`             | `numeric`                  | ✓        | ``                            |     |
| 6   | `min_fare_per_km`               | `numeric`                  | ✓        | ``                            |     |
| 7   | `min_fare_per_hour`             | `numeric`                  | ✓        | ``                            |     |
| 8   | `vat_rate`                      | `numeric`                  | ✓        | ``                            |     |
| 9   | `currency`                      | `char(3)`                  | ✗        | ``                            |     |
| 10  | `timezone`                      | `text`                     | ✗        | ``                            |     |
| 12  | `created_at`                    | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`           |     |
| 13  | `updated_at`                    | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`           |     |
| 14  | `requires_vtc_card`             | `boolean`                  | ✗        | `false`                       |     |
| 15  | `min_vehicle_class_id`          | `uuid`                     | ✓        | ``                            |     |
| 16  | `min_vehicle_length_cm`         | `integer`                  | ✓        | ``                            |     |
| 17  | `min_vehicle_width_cm`          | `integer`                  | ✓        | ``                            |     |
| 18  | `min_vehicle_height_cm`         | `integer`                  | ✓        | ``                            |     |
| 19  | `max_vehicle_weight_kg`         | `integer`                  | ✓        | ``                            |     |
| 20  | `max_vehicle_mileage_km`        | `integer`                  | ✓        | ``                            |     |
| 21  | `requires_professional_license` | `boolean`                  | ✓        | ``                            |     |
| 22  | `required_documents`            | `jsonb`                    | ✓        | ``                            |     |
| 23  | `effective_date`                | `date`                     | ✓        | ``                            |     |
| 24  | `expiry_date`                   | `date`                     | ✓        | ``                            |     |
| 25  | `status`                        | `regulation_status`        | ✗        | `'active'::regulation_status` |     |
| 26  | `created_by`                    | `uuid`                     | ✓        | ``                            |     |
| 27  | `updated_by`                    | `uuid`                     | ✓        | ``                            |     |
| 28  | `deleted_at`                    | `timestamp with time zone` | ✓        | ``                            |     |
| 29  | `deleted_by`                    | `uuid`                     | ✓        | ``                            |     |
| 30  | `deletion_reason`               | `text`                     | ✓        | ``                            |     |

#### Foreign Keys

| Column                 | References                  | On Update | On Delete |
| ---------------------- | --------------------------- | --------- | --------- |
| `created_by`           | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `deleted_by`           | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `min_vehicle_class_id` | `dir_vehicle_classes.id`    | NO ACTION | SET NULL  |
| `updated_by`           | `adm_provider_employees.id` | NO ACTION | RESTRICT  |

#### Indexes

- **`dir_country_regulations_currency_idx`**
  ```sql
  CREATE INDEX dir_country_regulations_currency_idx ON public.dir_country_regulations USING btree (currency)
  ```
- **`dir_country_regulations_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_country_regulations_pkey ON public.dir_country_regulations USING btree (country_code)
  ```
- **`dir_country_regulations_timezone_idx`**
  ```sql
  CREATE INDEX dir_country_regulations_timezone_idx ON public.dir_country_regulations USING btree (timezone)
  ```

---

### 33. `dir_fine_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column         | Type                       | Nullable | Default             | PK  |
| --- | -------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`           | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `jurisdiction` | `char(2)`                  | ✗        | ``                  |     |
| 3   | `code`         | `varchar(50)`              | ✗        | ``                  |     |
| 4   | `description`  | `text`                     | ✗        | ``                  |     |
| 5   | `min_amount`   | `numeric`                  | ✗        | ``                  |     |
| 6   | `max_amount`   | `numeric`                  | ✗        | ``                  |     |
| 7   | `points`       | `integer`                  | ✓        | ``                  |     |
| 8   | `is_criminal`  | `boolean`                  | ✗        | `false`             |     |
| 9   | `active`       | `boolean`                  | ✗        | `true`              |     |
| 10  | `metadata`     | `jsonb`                    | ✗        | `'{}'::jsonb`       |     |
| 11  | `created_at`   | `timestamp with time zone` | ✗        | `now()`             |     |
| 12  | `updated_at`   | `timestamp with time zone` | ✗        | `now()`             |     |

#### Indexes

- **`dir_fine_types_jurisdiction_code_uq`**
  ```sql
  CREATE UNIQUE INDEX dir_fine_types_jurisdiction_code_uq ON public.dir_fine_types USING btree (jurisdiction, code)
  ```
- **`dir_fine_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_fine_types_pkey ON public.dir_fine_types USING btree (id)
  ```

---

### 34. `dir_maintenance_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                      | Type                       | Nullable | Default             | PK  |
| --- | --------------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                        | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`                 | `uuid`                     | ✗        | ``                  |     |
| 3   | `code`                      | `varchar(50)`              | ✗        | ``                  |     |
| 4   | `label`                     | `varchar(255)`             | ✗        | ``                  |     |
| 5   | `category`                  | `maintenance_category`     | ✗        | ``                  |     |
| 6   | `default_frequency_km`      | `integer`                  | ✓        | ``                  |     |
| 7   | `default_frequency_months`  | `integer`                  | ✓        | ``                  |     |
| 8   | `estimated_duration_hours`  | `numeric`                  | ✓        | ``                  |     |
| 9   | `estimated_cost_range`      | `jsonb`                    | ✓        | ``                  |     |
| 10  | `is_mandatory`              | `boolean`                  | ✓        | `false`             |     |
| 11  | `requires_vehicle_stoppage` | `boolean`                  | ✓        | `true`              |     |
| 12  | `description`               | `text`                     | ✓        | ``                  |     |
| 13  | `metadata`                  | `jsonb`                    | ✓        | ``                  |     |
| 14  | `created_at`                | `timestamp with time zone` | ✗        | `now()`             |     |
| 15  | `updated_at`                | `timestamp with time zone` | ✗        | `now()`             |     |
| 16  | `created_by`                | `uuid`                     | ✗        | ``                  |     |
| 17  | `updated_by`                | `uuid`                     | ✓        | ``                  |     |
| 18  | `deleted_at`                | `timestamp with time zone` | ✓        | ``                  |     |
| 19  | `deleted_by`                | `uuid`                     | ✓        | ``                  |     |
| 20  | `deletion_reason`           | `text`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column      | References       | On Update | On Delete |
| ----------- | ---------------- | --------- | --------- |
| `tenant_id` | `adm_tenants.id` | NO ACTION | CASCADE   |

#### Indexes

- **`dir_maintenance_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_maintenance_types_pkey ON public.dir_maintenance_types USING btree (id)
  ```
- **`idx_dir_maintenance_types_tenant_code_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_dir_maintenance_types_tenant_code_unique ON public.dir_maintenance_types USING btree (tenant_id, code) WHERE (deleted_at IS NULL)
  ```
- **`idx_maintenance_types_category_mandatory`**
  ```sql
  CREATE INDEX idx_maintenance_types_category_mandatory ON public.dir_maintenance_types USING btree (category, is_mandatory)
  ```
- **`idx_maintenance_types_deleted`**
  ```sql
  CREATE INDEX idx_maintenance_types_deleted ON public.dir_maintenance_types USING btree (deleted_at)
  ```

---

### 35. `dir_notification_templates`

**Rows**: 13 live, 0 dead

**Purpose**: Multilingual notification templates for email, SMS, and push notifications. Supports 13 template types across 3 languages (EN/FR/AR) with dynamic variable replacement.

#### Columns

| #   | Column                 | Type                       | Nullable | Default             | PK  |
| --- | ---------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                   | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `template_code`        | `varchar(100)`             | ✗        | ``                  |     |
| 3   | `template_name`        | `varchar(200)`             | ✗        | ``                  |     |
| 4   | `channel`              | `notification_channel`     | ✗        | ``                  |     |
| 5   | `supported_countries`  | `text[]`                   | ✗        | `[]`                |     |
| 6   | `supported_locales`    | `text[]`                   | ✗        | `[]`                |     |
| 7   | `subject_translations` | `jsonb`                    | ✗        | ``                  |     |
| 8   | `body_translations`    | `jsonb`                    | ✗        | ``                  |     |
| 9   | `variables`            | `jsonb`                    | ✓        | ``                  |     |
| 10  | `status`               | `lifecycle_status`         | ✗        | `active`            |     |
| 11  | `created_at`           | `timestamp with time zone` | ✗        | `now()`             |     |
| 12  | `created_by`           | `uuid`                     | ✓        | ``                  |     |
| 13  | `updated_at`           | `timestamp with time zone` | ✗        | `now()`             |     |
| 14  | `updated_by`           | `uuid`                     | ✓        | ``                  |     |
| 15  | `deleted_at`           | `timestamp with time zone` | ✓        | ``                  |     |
| 16  | `deleted_by`           | `uuid`                     | ✓        | ``                  |     |
| 17  | `deletion_reason`      | `text`                     | ✓        | ``                  |     |

#### JSONB Structure

**`subject_translations`**: Multilingual email subjects

```json
{
  "en": "Welcome to FleetCore",
  "fr": "Bienvenue sur FleetCore",
  "ar": "مرحباً بك في FleetCore"
}
```

**`body_translations`**: Full HTML templates with variable placeholders

```json
{
  "en": "<!DOCTYPE html>...<p>Hello {{first_name}}</p>...",
  "fr": "<!DOCTYPE html>...<p>Bonjour {{first_name}}</p>...",
  "ar": "<!DOCTYPE html dir=\"rtl\">...<p>مرحباً {{first_name}}</p>..."
}
```

**`variables`**: Supported variable names for template

```json
["first_name", "company_name", "fleet_size", "country_name", "priority"]
```

#### Template Types (13 total)

**CRM Templates**:

1. `lead_confirmation` - Lead capture confirmation
2. `sales_rep_assignment` - Sales rep notification
3. `expansion_opportunity` - Non-operational country message
4. `lead_followup` - 24h followup reminder

**Admin Templates**: 5. `member_welcome` - New member onboarding 6. `member_password_reset` - Password reset link

**Fleet Templates**: 7. `vehicle_inspection_reminder` - 7-day inspection alert 8. `insurance_expiry_alert` - 30-day renewal warning 9. `maintenance_scheduled` - Maintenance appointment

**Driver Templates**: 10. `driver_onboarding` - Driver welcome guide

**System Templates**: 11. `critical_alert` - System critical incidents 12. `webhook_test` - Integration testing 13. `integration_test_template` - Test template

#### Variable Replacement Pattern

**Syntax**: `{{variable_name}}`

**Implementation** (NotificationService):

```typescript
const placeholder = `{{${key}}}`;
renderedBody = renderedBody.replace(new RegExp(placeholder, "g"), stringValue);
```

**Common Variables**:

- `{{first_name}}` - Recipient first name
- `{{last_name}}` - Recipient last name
- `{{company_name}}` - Company name
- `{{fleet_size}}` - Fleet size (e.g., "101-200 vehicles")
- `{{country_name}}` - Country name (localized)
- `{{priority}}` - Lead priority (high, medium, low, urgent)
- `{{assigned_rep}}` - Sales representative name

#### RTL Support for Arabic

**HTML Structure**:

```html
<html dir="rtl" lang="ar">
  <body style="direction: rtl;">
    <Text style="text-align: right;">مرحباً {{first_name}}</Text>
  </body>
</html>
```

**Features**:

- Full right-to-left layout
- Text alignment: right for paragraphs
- Logos and buttons: centered (not mirrored)
- Professional Arabic translations (MSA)

#### Intelligent Email Routing

**Country-based Language Selection**:

```typescript
// NotificationService.sendEmail()
const locale = getLocaleFromCountry(countryCode) || fallbackLocale || "en";
```

**Country Mappings**:

- **Arabic**: AE, SA, QA, KW, BH, OM
- **French**: FR, BE, MA, TN, DZ
- **English**: All others (default)

**Operational vs Expansion Countries**:

```typescript
const templateCode = country.is_operational
  ? "lead_confirmation" // Operational country
  : "expansion_opportunity"; // Non-operational country
```

#### Indexes

- **`dir_notification_templates_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_notification_templates_pkey ON public.dir_notification_templates USING btree (id)
  ```
- **`uq_dir_notification_templates_code_channel`**
  ```sql
  CREATE UNIQUE INDEX uq_dir_notification_templates_code_channel ON public.dir_notification_templates USING btree (template_code, channel)
  ```

#### Usage Example

```typescript
import { NotificationService } from "@/lib/services/notification/notification.service";

const notificationService = new NotificationService();

await notificationService.sendEmail({
  recipientEmail: "user@example.com",
  templateCode: "lead_confirmation",
  variables: {
    first_name: "Ahmed",
    company_name: "FleetCore UAE",
    fleet_size: "101-200 vehicles",
    country_name: "United Arab Emirates",
  },
  leadId: "lead-uuid",
  countryCode: "AE", // Auto-selects Arabic with RTL
  fallbackLocale: "en",
});
```

#### Key Lesson Learned

**Critical**: React Email templates must use `{{variable}}` string props during generation, NOT default values.

**Correct Pattern**:

```typescript
const props = {
  first_name: "{{first_name}}", // ✅ Placeholder preserved
  company_name: "{{company_name}}",
};
```

**Wrong Pattern**:

```typescript
const props = {
  first_name: "John", // ❌ Hardcoded value baked into HTML
  company_name: "Test Company",
};
```

---

### 36. `dir_ownership_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                       | Type                       | Nullable | Default             | PK  |
| --- | ---------------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                         | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `code`                       | `varchar(50)`              | ✗        | ``                  |     |
| 3   | `name`                       | `varchar(100)`             | ✗        | ``                  |     |
| 4   | `description`                | `text`                     | ✓        | ``                  |     |
| 5   | `requires_owner`             | `boolean`                  | ✓        | `false`             |     |
| 6   | `allows_leasing`             | `boolean`                  | ✓        | `false`             |     |
| 7   | `depreciation`               | `boolean`                  | ✓        | `true`              |     |
| 8   | `maintenance_responsibility` | `varchar(20)`              | ✓        | ``                  |     |
| 9   | `insurance_responsibility`   | `varchar(20)`              | ✓        | ``                  |     |
| 10  | `display_order`              | `integer`                  | ✓        | ``                  |     |
| 11  | `is_active`                  | `boolean`                  | ✓        | `true`              |     |
| 12  | `metadata`                   | `jsonb`                    | ✓        | ``                  |     |
| 13  | `created_at`                 | `timestamp with time zone` | ✗        | `now()`             |     |
| 14  | `updated_at`                 | `timestamp with time zone` | ✗        | `now()`             |     |
| 15  | `created_by`                 | `uuid`                     | ✗        | ``                  |     |
| 16  | `updated_by`                 | `uuid`                     | ✓        | ``                  |     |
| 17  | `deleted_at`                 | `timestamp with time zone` | ✓        | ``                  |     |
| 18  | `deleted_by`                 | `uuid`                     | ✓        | ``                  |     |
| 19  | `deletion_reason`            | `text`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `deleted_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `updated_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |

#### Indexes

- **`dir_ownership_types_code_key`**
  ```sql
  CREATE UNIQUE INDEX dir_ownership_types_code_key ON public.dir_ownership_types USING btree (code)
  ```
- **`dir_ownership_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_ownership_types_pkey ON public.dir_ownership_types USING btree (id)
  ```
- **`idx_dir_ownership_types_code`**
  ```sql
  CREATE INDEX idx_dir_ownership_types_code ON public.dir_ownership_types USING btree (code)
  ```
- **`idx_dir_ownership_types_is_active`**
  ```sql
  CREATE INDEX idx_dir_ownership_types_is_active ON public.dir_ownership_types USING btree (is_active)
  ```

---

### 36. `dir_platform_configs`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                      | Type                       | Nullable | Default              | PK  |
| --- | --------------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                        | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `platform_id`               | `uuid`                     | ✗        | ``                   |     |
| 3   | `tenant_id`                 | `uuid`                     | ✗        | ``                   |     |
| 4   | `api_base_url`              | `text`                     | ✗        | ``                   |     |
| 5   | `auth_method`               | `varchar(50)`              | ✓        | ``                   |     |
| 6   | `api_version`               | `varchar(20)`              | ✓        | ``                   |     |
| 7   | `refresh_frequency_minutes` | `integer`                  | ✓        | `60`                 |     |
| 8   | `webhook_endpoints`         | `jsonb`                    | ✓        | ``                   |     |
| 9   | `supported_services`        | `jsonb`                    | ✓        | ``                   |     |
| 10  | `sandbox_config`            | `jsonb`                    | ✓        | ``                   |     |
| 11  | `production_config`         | `jsonb`                    | ✓        | ``                   |     |
| 12  | `secrets_vault_ref`         | `varchar(100)`             | ✓        | ``                   |     |
| 13  | `is_active`                 | `boolean`                  | ✓        | `true`               |     |
| 14  | `created_at`                | `timestamp with time zone` | ✗        | `now()`              |     |
| 15  | `updated_at`                | `timestamp with time zone` | ✗        | `now()`              |     |
| 16  | `created_by`                | `uuid`                     | ✗        | ``                   |     |
| 17  | `updated_by`                | `uuid`                     | ✓        | ``                   |     |
| 18  | `deleted_at`                | `timestamp with time zone` | ✓        | ``                   |     |
| 19  | `deleted_by`                | `uuid`                     | ✓        | ``                   |     |
| 20  | `deletion_reason`           | `text`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column        | References                  | On Update | On Delete |
| ------------- | --------------------------- | --------- | --------- |
| `created_by`  | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `deleted_by`  | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `platform_id` | `dir_platforms.id`          | NO ACTION | CASCADE   |
| `tenant_id`   | `adm_tenants.id`            | NO ACTION | CASCADE   |
| `updated_by`  | `adm_provider_employees.id` | NO ACTION | RESTRICT  |

#### Indexes

- **`dir_platform_configs_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_platform_configs_pkey ON public.dir_platform_configs USING btree (id)
  ```

---

### 37. `dir_platforms`

**Rows**: 3 live, 6 dead

#### Columns

| #   | Column                | Type                       | Nullable | Default                      | PK  |
| --- | --------------------- | -------------------------- | -------- | ---------------------------- | --- |
| 1   | `id`                  | `uuid`                     | ✗        | `uuid_generate_v4()`         | 🔑  |
| 2   | `name`                | `text`                     | ✗        | ``                           |     |
| 3   | `api_config`          | `jsonb`                    | ✓        | ``                           |     |
| 4   | `created_at`          | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`          |     |
| 6   | `updated_at`          | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`          |     |
| 11  | `code`                | `varchar(50)`              | ✗        | ``                           |     |
| 12  | `description`         | `text`                     | ✓        | ``                           |     |
| 13  | `logo_url`            | `text`                     | ✓        | ``                           |     |
| 14  | `provider_category`   | `varchar(50)`              | ✓        | ``                           |     |
| 15  | `supported_countries` | `jsonb`                    | ✓        | ``                           |     |
| 16  | `status`              | `lifecycle_status`         | ✗        | `'active'::lifecycle_status` |     |
| 17  | `metadata`            | `jsonb`                    | ✓        | ``                           |     |
| 18  | `created_by`          | `uuid`                     | ✓        | ``                           |     |
| 19  | `updated_by`          | `uuid`                     | ✓        | ``                           |     |
| 20  | `deleted_at`          | `timestamp with time zone` | ✓        | ``                           |     |
| 21  | `deleted_by`          | `uuid`                     | ✓        | ``                           |     |
| 22  | `deletion_reason`     | `text`                     | ✓        | ``                           |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `deleted_by` | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `updated_by` | `adm_provider_employees.id` | NO ACTION | RESTRICT  |

#### Indexes

- **`dir_platforms_api_config_gin`**
  ```sql
  CREATE INDEX dir_platforms_api_config_gin ON public.dir_platforms USING gin (api_config)
  ```
- **`dir_platforms_name_uq`**
  ```sql
  CREATE UNIQUE INDEX dir_platforms_name_uq ON public.dir_platforms USING btree (name)
  ```
- **`dir_platforms_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_platforms_pkey ON public.dir_platforms USING btree (id)
  ```

---

### 38. `dir_toll_gates`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column          | Type                       | Nullable | Default                      | PK  |
| --- | --------------- | -------------------------- | -------- | ---------------------------- | --- |
| 1   | `id`            | `uuid`                     | ✗        | `gen_random_uuid()`          | 🔑  |
| 2   | `country_code`  | `char(2)`                  | ✗        | ``                           |     |
| 3   | `gate_code`     | `varchar(50)`              | ✗        | ``                           |     |
| 4   | `gate_name`     | `text`                     | ✗        | ``                           |     |
| 5   | `location`      | `point`                    | ✓        | ``                           |     |
| 6   | `base_fee`      | `numeric`                  | ✗        | `0`                          |     |
| 7   | `currency`      | `char(3)`                  | ✗        | ``                           |     |
| 8   | `rate_schedule` | `jsonb`                    | ✓        | `'{}'::jsonb`                |     |
| 9   | `status`        | `toll_gate_status`         | ✗        | `'active'::toll_gate_status` |     |
| 10  | `active_from`   | `date`                     | ✓        | ``                           |     |
| 11  | `active_to`     | `date`                     | ✓        | ``                           |     |
| 12  | `operator`      | `varchar(100)`             | ✓        | ``                           |     |
| 13  | `metadata`      | `jsonb`                    | ✗        | `'{}'::jsonb`                |     |
| 14  | `created_at`    | `timestamp with time zone` | ✗        | `now()`                      |     |
| 15  | `updated_at`    | `timestamp with time zone` | ✗        | `now()`                      |     |

#### Foreign Keys

| Column         | References                             | On Update | On Delete |
| -------------- | -------------------------------------- | --------- | --------- |
| `country_code` | `dir_country_regulations.country_code` | CASCADE   | CASCADE   |

#### Indexes

- **`dir_toll_gates_country_gate_code_uq`**
  ```sql
  CREATE UNIQUE INDEX dir_toll_gates_country_gate_code_uq ON public.dir_toll_gates USING btree (country_code, gate_code)
  ```
- **`dir_toll_gates_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_toll_gates_pkey ON public.dir_toll_gates USING btree (id)
  ```

---

### 39. `dir_transaction_statuses`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column        | Type                       | Nullable | Default | PK  |
| --- | ------------- | -------------------------- | -------- | ------- | --- |
| 1   | `code`        | `varchar(30)`              | ✗        | ``      | 🔑  |
| 2   | `description` | `text`                     | ✗        | ``      |     |
| 3   | `created_at`  | `timestamp with time zone` | ✗        | `now()` |     |

#### Indexes

- **`dir_transaction_statuses_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_transaction_statuses_pkey ON public.dir_transaction_statuses USING btree (code)
  ```

---

### 40. `dir_transaction_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column        | Type                       | Nullable | Default | PK  |
| --- | ------------- | -------------------------- | -------- | ------- | --- |
| 1   | `code`        | `varchar(30)`              | ✗        | ``      | 🔑  |
| 2   | `description` | `text`                     | ✗        | ``      |     |
| 3   | `created_at`  | `timestamp with time zone` | ✗        | `now()` |     |

#### Indexes

- **`dir_transaction_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_transaction_types_pkey ON public.dir_transaction_types USING btree (code)
  ```

---

### 41. `dir_vehicle_classes`

**Rows**: 7 live, 14 dead

#### Columns

| #   | Column            | Type                       | Nullable | Default                      | PK  |
| --- | ----------------- | -------------------------- | -------- | ---------------------------- | --- |
| 1   | `id`              | `uuid`                     | ✗        | `uuid_generate_v4()`         | 🔑  |
| 2   | `country_code`    | `char(2)`                  | ✗        | ``                           |     |
| 3   | `name`            | `text`                     | ✗        | ``                           |     |
| 4   | `description`     | `text`                     | ✓        | ``                           |     |
| 5   | `max_age`         | `integer`                  | ✓        | ``                           |     |
| 6   | `created_at`      | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`          |     |
| 8   | `updated_at`      | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`          |     |
| 13  | `code`            | `varchar(50)`              | ✗        | ``                           |     |
| 14  | `min_length_cm`   | `integer`                  | ✓        | ``                           |     |
| 15  | `max_length_cm`   | `integer`                  | ✓        | ``                           |     |
| 16  | `min_width_cm`    | `integer`                  | ✓        | ``                           |     |
| 17  | `max_width_cm`    | `integer`                  | ✓        | ``                           |     |
| 18  | `min_height_cm`   | `integer`                  | ✓        | ``                           |     |
| 19  | `max_height_cm`   | `integer`                  | ✓        | ``                           |     |
| 20  | `min_seats`       | `integer`                  | ✓        | ``                           |     |
| 21  | `max_seats`       | `integer`                  | ✓        | ``                           |     |
| 22  | `min_age`         | `integer`                  | ✓        | ``                           |     |
| 23  | `min_weight_kg`   | `integer`                  | ✓        | ``                           |     |
| 24  | `max_weight_kg`   | `integer`                  | ✓        | ``                           |     |
| 25  | `criteria`        | `jsonb`                    | ✓        | ``                           |     |
| 26  | `status`          | `lifecycle_status`         | ✗        | `'active'::lifecycle_status` |     |
| 27  | `metadata`        | `jsonb`                    | ✓        | ``                           |     |
| 28  | `created_by`      | `uuid`                     | ✓        | ``                           |     |
| 29  | `updated_by`      | `uuid`                     | ✓        | ``                           |     |
| 30  | `deleted_at`      | `timestamp with time zone` | ✓        | ``                           |     |
| 31  | `deleted_by`      | `uuid`                     | ✓        | ``                           |     |
| 32  | `deletion_reason` | `text`                     | ✓        | ``                           |     |

#### Foreign Keys

| Column         | References                             | On Update | On Delete |
| -------------- | -------------------------------------- | --------- | --------- |
| `country_code` | `dir_country_regulations.country_code` | CASCADE   | CASCADE   |
| `country_code` | `dir_country_regulations.country_code` | NO ACTION | RESTRICT  |
| `created_by`   | `adm_provider_employees.id`            | NO ACTION | RESTRICT  |
| `deleted_by`   | `adm_provider_employees.id`            | NO ACTION | RESTRICT  |
| `updated_by`   | `adm_provider_employees.id`            | NO ACTION | RESTRICT  |

#### Indexes

- **`dir_vehicle_classes_country_code_idx`**
  ```sql
  CREATE INDEX dir_vehicle_classes_country_code_idx ON public.dir_vehicle_classes USING btree (country_code)
  ```
- **`dir_vehicle_classes_country_name_uq`**
  ```sql
  CREATE UNIQUE INDEX dir_vehicle_classes_country_name_uq ON public.dir_vehicle_classes USING btree (country_code, name)
  ```
- **`dir_vehicle_classes_created_at_idx`**
  ```sql
  CREATE INDEX dir_vehicle_classes_created_at_idx ON public.dir_vehicle_classes USING btree (created_at)
  ```
- **`dir_vehicle_classes_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_vehicle_classes_pkey ON public.dir_vehicle_classes USING btree (id)
  ```
- **`dir_vehicle_classes_updated_at_idx`**
  ```sql
  CREATE INDEX dir_vehicle_classes_updated_at_idx ON public.dir_vehicle_classes USING btree (updated_at)
  ```

---

### 42. `dir_vehicle_statuses`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                | Type                       | Nullable | Default             | PK  |
| --- | --------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                  | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `code`                | `varchar(50)`              | ✗        | ``                  |     |
| 3   | `name`                | `varchar(100)`             | ✗        | ``                  |     |
| 4   | `description`         | `text`                     | ✓        | ``                  |     |
| 5   | `color`               | `varchar(7)`               | ✓        | ``                  |     |
| 6   | `allowed_transitions` | `jsonb`                    | ✓        | ``                  |     |
| 7   | `requires_approval`   | `boolean`                  | ✓        | `false`             |     |
| 8   | `blocking_status`     | `boolean`                  | ✓        | `false`             |     |
| 9   | `automatic_actions`   | `jsonb`                    | ✓        | ``                  |     |
| 10  | `notification_rules`  | `jsonb`                    | ✓        | ``                  |     |
| 11  | `required_documents`  | `jsonb`                    | ✓        | ``                  |     |
| 12  | `validation_rules`    | `jsonb`                    | ✓        | ``                  |     |
| 13  | `display_order`       | `integer`                  | ✓        | ``                  |     |
| 14  | `is_active`           | `boolean`                  | ✓        | `true`              |     |
| 15  | `metadata`            | `jsonb`                    | ✓        | ``                  |     |
| 16  | `created_at`          | `timestamp with time zone` | ✗        | `now()`             |     |
| 17  | `updated_at`          | `timestamp with time zone` | ✗        | `now()`             |     |
| 18  | `created_by`          | `uuid`                     | ✗        | ``                  |     |
| 19  | `updated_by`          | `uuid`                     | ✓        | ``                  |     |
| 20  | `deleted_at`          | `timestamp with time zone` | ✓        | ``                  |     |
| 21  | `deleted_by`          | `uuid`                     | ✓        | ``                  |     |
| 22  | `deletion_reason`     | `text`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `deleted_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `updated_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |

#### Indexes

- **`dir_vehicle_statuses_code_key`**
  ```sql
  CREATE UNIQUE INDEX dir_vehicle_statuses_code_key ON public.dir_vehicle_statuses USING btree (code)
  ```
- **`dir_vehicle_statuses_pkey`**
  ```sql
  CREATE UNIQUE INDEX dir_vehicle_statuses_pkey ON public.dir_vehicle_statuses USING btree (id)
  ```
- **`idx_dir_vehicle_statuses_code`**
  ```sql
  CREATE INDEX idx_dir_vehicle_statuses_code ON public.dir_vehicle_statuses USING btree (code)
  ```
- **`idx_dir_vehicle_statuses_is_active`**
  ```sql
  CREATE INDEX idx_dir_vehicle_statuses_is_active ON public.dir_vehicle_statuses USING btree (is_active)
  ```

---

### 43. `doc_document_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                  | Type                       | Nullable | Default | PK  |
| --- | ----------------------- | -------------------------- | -------- | ------- | --- |
| 1   | `code`                  | `varchar(50)`              | ✗        | ``      | 🔑  |
| 2   | `name`                  | `text`                     | ✗        | ``      |     |
| 3   | `description`           | `text`                     | ✓        | ``      |     |
| 4   | `requires_expiry`       | `boolean`                  | ✗        | `false` |     |
| 5   | `default_validity_days` | `integer`                  | ✓        | ``      |     |
| 6   | `requires_verification` | `boolean`                  | ✗        | `true`  |     |
| 7   | `allowed_mime_types`    | `ARRAY`                    | ✓        | ``      |     |
| 8   | `max_file_size_mb`      | `integer`                  | ✓        | `10`    |     |
| 9   | `category`              | `varchar(50)`              | ✓        | ``      |     |
| 10  | `is_mandatory`          | `boolean`                  | ✗        | `false` |     |
| 11  | `display_order`         | `integer`                  | ✗        | `0`     |     |
| 12  | `icon`                  | `varchar(50)`              | ✓        | ``      |     |
| 13  | `created_at`            | `timestamp with time zone` | ✗        | `now()` |     |
| 14  | `created_by`            | `uuid`                     | ✓        | ``      |     |
| 15  | `updated_at`            | `timestamp with time zone` | ✗        | `now()` |     |
| 16  | `updated_by`            | `uuid`                     | ✓        | ``      |     |
| 17  | `deleted_at`            | `timestamp with time zone` | ✓        | ``      |     |
| 18  | `deleted_by`            | `uuid`                     | ✓        | ``      |     |
| 19  | `deletion_reason`       | `text`                     | ✓        | ``      |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `deleted_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `updated_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |

#### Indexes

- **`doc_document_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX doc_document_types_pkey ON public.doc_document_types USING btree (code)
  ```

---

### 44. `doc_document_versions`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                | Type                       | Nullable | Default              | PK  |
| --- | --------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                  | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `document_id`         | `uuid`                     | ✗        | ``                   |     |
| 3   | `version_number`      | `integer`                  | ✗        | ``                   |     |
| 4   | `storage_provider`    | `varchar(50)`              | ✗        | ``                   |     |
| 5   | `storage_key`         | `text`                     | ✗        | ``                   |     |
| 6   | `file_name`           | `varchar(255)`             | ✗        | ``                   |     |
| 7   | `file_size`           | `integer`                  | ✗        | ``                   |     |
| 8   | `mime_type`           | `varchar(100)`             | ✗        | ``                   |     |
| 9   | `issue_date`          | `date`                     | ✓        | ``                   |     |
| 10  | `expiry_date`         | `date`                     | ✓        | ``                   |     |
| 11  | `verification_status` | `varchar(20)`              | ✗        | ``                   |     |
| 12  | `verified_by`         | `uuid`                     | ✓        | ``                   |     |
| 13  | `verified_at`         | `timestamp with time zone` | ✓        | ``                   |     |
| 14  | `rejection_reason`    | `text`                     | ✓        | ``                   |     |
| 15  | `metadata`            | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 16  | `created_at`          | `timestamp with time zone` | ✗        | `now()`              |     |
| 17  | `created_by`          | `uuid`                     | ✗        | ``                   |     |
| 18  | `change_reason`       | `text`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column        | References         | On Update | On Delete |
| ------------- | ------------------ | --------- | --------- |
| `created_by`  | `adm_members.id`   | NO ACTION | RESTRICT  |
| `document_id` | `doc_documents.id` | NO ACTION | CASCADE   |

#### Indexes

- **`doc_document_versions_pkey`**
  ```sql
  CREATE UNIQUE INDEX doc_document_versions_pkey ON public.doc_document_versions USING btree (id)
  ```

---

### 45. `doc_documents`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                     | Type                       | Nullable | Default                          | PK  |
| --- | -------------------------- | -------------------------- | -------- | -------------------------------- | --- |
| 1   | `id`                       | `uuid`                     | ✗        | `uuid_generate_v4()`             | 🔑  |
| 2   | `tenant_id`                | `uuid`                     | ✗        | ``                               |     |
| 3   | `entity_type`              | `text`                     | ✗        | ``                               |     |
| 4   | `entity_id`                | `uuid`                     | ✗        | ``                               |     |
| 5   | `document_type`            | `text`                     | ✗        | ``                               |     |
| 6   | `file_url`                 | `text`                     | ✗        | ``                               |     |
| 10  | `issue_date`               | `date`                     | ✓        | ``                               |     |
| 11  | `expiry_date`              | `date`                     | ✓        | ``                               |     |
| 12  | `verified`                 | `boolean`                  | ✗        | `false`                          |     |
| 16  | `created_at`               | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`              |     |
| 18  | `updated_at`               | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`              |     |
| 23  | `file_name`                | `varchar(255)`             | ✓        | ``                               |     |
| 24  | `file_size`                | `integer`                  | ✓        | ``                               |     |
| 25  | `mime_type`                | `varchar(100)`             | ✓        | ``                               |     |
| 26  | `metadata`                 | `jsonb`                    | ✓        | `'{}'::jsonb`                    |     |
| 27  | `storage_provider`         | `storage_provider`         | ✓        | `'supabase'::storage_provider`   |     |
| 28  | `storage_key`              | `text`                     | ✓        | ``                               |     |
| 29  | `access_level`             | `access_level`             | ✓        | `'private'::access_level`        |     |
| 30  | `verification_status`      | `verification_status`      | ✓        | `'pending'::verification_status` |     |
| 31  | `verified_by`              | `uuid`                     | ✓        | ``                               |     |
| 32  | `verified_at`              | `timestamp with time zone` | ✓        | ``                               |     |
| 33  | `rejection_reason`         | `text`                     | ✓        | ``                               |     |
| 34  | `status`                   | `document_status`          | ✗        | `'active'::document_status`      |     |
| 35  | `expiry_notification_sent` | `boolean`                  | ✓        | `false`                          |     |
| 36  | `created_by`               | `uuid`                     | ✓        | ``                               |     |
| 37  | `updated_by`               | `uuid`                     | ✓        | ``                               |     |
| 38  | `deleted_at`               | `timestamp with time zone` | ✓        | ``                               |     |
| 39  | `deleted_by`               | `uuid`                     | ✓        | ``                               |     |
| 40  | `deletion_reason`          | `text`                     | ✓        | ``                               |     |

#### Foreign Keys

| Column          | References                | On Update | On Delete |
| --------------- | ------------------------- | --------- | --------- |
| `created_by`    | `adm_members.id`          | NO ACTION | SET NULL  |
| `deleted_by`    | `adm_members.id`          | NO ACTION | SET NULL  |
| `document_type` | `doc_document_types.code` | NO ACTION | RESTRICT  |
| `entity_type`   | `doc_entity_types.code`   | NO ACTION | RESTRICT  |
| `tenant_id`     | `adm_tenants.id`          | CASCADE   | CASCADE   |
| `updated_by`    | `adm_members.id`          | NO ACTION | SET NULL  |
| `verified_by`   | `adm_members.id`          | NO ACTION | SET NULL  |

#### Indexes

- **`doc_documents_created_at_idx`**
  ```sql
  CREATE INDEX doc_documents_created_at_idx ON public.doc_documents USING btree (created_at)
  ```
- **`doc_documents_document_type_idx`**
  ```sql
  CREATE INDEX doc_documents_document_type_idx ON public.doc_documents USING btree (document_type)
  ```
- **`doc_documents_entity_id_idx`**
  ```sql
  CREATE INDEX doc_documents_entity_id_idx ON public.doc_documents USING btree (entity_id)
  ```
- **`doc_documents_entity_type_idx`**
  ```sql
  CREATE INDEX doc_documents_entity_type_idx ON public.doc_documents USING btree (entity_type)
  ```
- **`doc_documents_expiry_date_idx`**
  ```sql
  CREATE INDEX doc_documents_expiry_date_idx ON public.doc_documents USING btree (expiry_date)
  ```
- **`doc_documents_pkey`**
  ```sql
  CREATE UNIQUE INDEX doc_documents_pkey ON public.doc_documents USING btree (id)
  ```
- **`doc_documents_tenant_document_type_idx`**
  ```sql
  CREATE INDEX doc_documents_tenant_document_type_idx ON public.doc_documents USING btree (tenant_id, document_type)
  ```
- **`doc_documents_tenant_entity_idx`**
  ```sql
  CREATE INDEX doc_documents_tenant_entity_idx ON public.doc_documents USING btree (tenant_id, entity_type, entity_id)
  ```
- **`doc_documents_tenant_id_idx`**
  ```sql
  CREATE INDEX doc_documents_tenant_id_idx ON public.doc_documents USING btree (tenant_id)
  ```
- **`doc_documents_updated_at_idx`**
  ```sql
  CREATE INDEX doc_documents_updated_at_idx ON public.doc_documents USING btree (updated_at)
  ```
- **`idx_doc_documents_entity`**
  ```sql
  CREATE INDEX idx_doc_documents_entity ON public.doc_documents USING btree (tenant_id, entity_type, entity_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_doc_documents_entity_type`**
  ```sql
  CREATE INDEX idx_doc_documents_entity_type ON public.doc_documents USING btree (entity_type) WHERE (deleted_at IS NULL)
  ```

---

### 46. `doc_entity_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column          | Type                       | Nullable | Default       | PK  |
| --- | --------------- | -------------------------- | -------- | ------------- | --- |
| 1   | `code`          | `varchar(50)`              | ✗        | ``            | 🔑  |
| 2   | `description`   | `text`                     | ✗        | ``            |     |
| 3   | `table_name`    | `varchar(100)`             | ✗        | ``            |     |
| 4   | `is_active`     | `boolean`                  | ✗        | `true`        |     |
| 5   | `display_order` | `integer`                  | ✗        | `0`           |     |
| 6   | `metadata`      | `jsonb`                    | ✗        | `'{}'::jsonb` |     |
| 7   | `created_at`    | `timestamp with time zone` | ✗        | `now()`       |     |
| 8   | `created_by`    | `uuid`                     | ✓        | ``            |     |
| 9   | `updated_at`    | `timestamp with time zone` | ✗        | `now()`       |     |
| 10  | `updated_by`    | `uuid`                     | ✓        | ``            |     |
| 11  | `deleted_at`    | `timestamp with time zone` | ✓        | ``            |     |
| 12  | `deleted_by`    | `uuid`                     | ✓        | ``            |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `deleted_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `updated_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |

#### Indexes

- **`doc_entity_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX doc_entity_types_pkey ON public.doc_entity_types USING btree (code)
  ```

---

### 47. `fin_account_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column        | Type                       | Nullable | Default | PK  |
| --- | ------------- | -------------------------- | -------- | ------- | --- |
| 1   | `code`        | `text`                     | ✗        | ``      | 🔑  |
| 2   | `label`       | `text`                     | ✗        | ``      |     |
| 3   | `description` | `text`                     | ✓        | ``      |     |
| 4   | `created_at`  | `timestamp with time zone` | ✗        | `now()` |     |
| 5   | `updated_at`  | `timestamp with time zone` | ✗        | `now()` |     |

#### Indexes

- **`fin_account_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_account_types_pkey ON public.fin_account_types USING btree (code)
  ```

---

### 48. `fin_accounts`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                 | Type                       | Nullable | Default                    | PK  |
| --- | ---------------------- | -------------------------- | -------- | -------------------------- | --- |
| 1   | `id`                   | `uuid`                     | ✗        | `uuid_generate_v4()`       | 🔑  |
| 2   | `tenant_id`            | `uuid`                     | ✗        | ``                         |     |
| 3   | `account_name`         | `text`                     | ✗        | ``                         |     |
| 4   | `account_type`         | `text`                     | ✗        | ``                         |     |
| 5   | `currency`             | `varchar(3)`               | ✗        | ``                         |     |
| 6   | `balance`              | `numeric`                  | ✗        | `0`                        |     |
| 7   | `metadata`             | `jsonb`                    | ✗        | `'{}'::jsonb`              |     |
| 8   | `created_at`           | `timestamp with time zone` | ✗        | `now()`                    |     |
| 9   | `created_by`           | `uuid`                     | ✓        | ``                         |     |
| 10  | `updated_at`           | `timestamp with time zone` | ✗        | `now()`                    |     |
| 11  | `updated_by`           | `uuid`                     | ✓        | ``                         |     |
| 12  | `deleted_at`           | `timestamp with time zone` | ✓        | ``                         |     |
| 13  | `deleted_by`           | `uuid`                     | ✓        | ``                         |     |
| 14  | `deletion_reason`      | `text`                     | ✓        | ``                         |     |
| 15  | `provider`             | `text`                     | ✓        | ``                         |     |
| 16  | `provider_account_id`  | `text`                     | ✓        | ``                         |     |
| 17  | `status`               | `account_status`           | ✗        | `'active'::account_status` |     |
| 18  | `opened_at`            | `timestamp with time zone` | ✓        | ``                         |     |
| 19  | `closed_at`            | `timestamp with time zone` | ✓        | ``                         |     |
| 20  | `max_balance`          | `numeric`                  | ✓        | ``                         |     |
| 21  | `min_balance`          | `numeric`                  | ✓        | ``                         |     |
| 22  | `account_number_last4` | `char(4)`                  | ✓        | ``                         |     |
| 23  | `bank_name`            | `text`                     | ✓        | ``                         |     |
| 24  | `iban`                 | `text`                     | ✓        | ``                         |     |
| 25  | `swift_bic`            | `text`                     | ✓        | ``                         |     |
| 26  | `description`          | `text`                     | ✓        | ``                         |     |

#### Foreign Keys

| Column         | References               | On Update | On Delete |
| -------------- | ------------------------ | --------- | --------- |
| `account_type` | `fin_account_types.code` | CASCADE   | RESTRICT  |
| `created_by`   | `adm_members.id`         | CASCADE   | SET NULL  |
| `created_by`   | `adm_members.id`         | CASCADE   | RESTRICT  |
| `deleted_by`   | `adm_members.id`         | CASCADE   | SET NULL  |
| `deleted_by`   | `adm_members.id`         | CASCADE   | RESTRICT  |
| `tenant_id`    | `adm_tenants.id`         | CASCADE   | CASCADE   |
| `tenant_id`    | `adm_tenants.id`         | CASCADE   | CASCADE   |
| `updated_by`   | `adm_members.id`         | CASCADE   | SET NULL  |
| `updated_by`   | `adm_members.id`         | CASCADE   | RESTRICT  |

#### Indexes

- **`fin_accounts_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_accounts_pkey ON public.fin_accounts USING btree (id)
  ```
- **`idx_fin_accounts_account_name`**
  ```sql
  CREATE INDEX idx_fin_accounts_account_name ON public.fin_accounts USING btree (account_name)
  ```
- **`idx_fin_accounts_account_type`**
  ```sql
  CREATE INDEX idx_fin_accounts_account_type ON public.fin_accounts USING btree (account_type)
  ```
- **`idx_fin_accounts_created_by`**
  ```sql
  CREATE INDEX idx_fin_accounts_created_by ON public.fin_accounts USING btree (created_by)
  ```
- **`idx_fin_accounts_currency`**
  ```sql
  CREATE INDEX idx_fin_accounts_currency ON public.fin_accounts USING btree (currency)
  ```
- **`idx_fin_accounts_deleted_at`**
  ```sql
  CREATE INDEX idx_fin_accounts_deleted_at ON public.fin_accounts USING btree (deleted_at)
  ```
- **`idx_fin_accounts_metadata`**
  ```sql
  CREATE INDEX idx_fin_accounts_metadata ON public.fin_accounts USING gin (metadata)
  ```
- **`idx_fin_accounts_tenant`**
  ```sql
  CREATE INDEX idx_fin_accounts_tenant ON public.fin_accounts USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_fin_accounts_tenant_account_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_fin_accounts_tenant_account_unique ON public.fin_accounts USING btree (tenant_id, account_name) WHERE (deleted_at IS NULL)
  ```
- **`idx_fin_accounts_tenant_id`**
  ```sql
  CREATE INDEX idx_fin_accounts_tenant_id ON public.fin_accounts USING btree (tenant_id)
  ```
- **`idx_fin_accounts_updated_by`**
  ```sql
  CREATE INDEX idx_fin_accounts_updated_by ON public.fin_accounts USING btree (updated_by)
  ```

---

### 49. `fin_driver_payment_batches`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default              | PK  |
| --- | ------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`         | `uuid`                     | ✗        | ``                   |     |
| 3   | `batch_reference`   | `text`                     | ✗        | ``                   |     |
| 4   | `payment_date`      | `date`                     | ✗        | ``                   |     |
| 5   | `total_amount`      | `numeric`                  | ✗        | ``                   |     |
| 6   | `currency`          | `varchar(3)`               | ✗        | ``                   |     |
| 7   | `status`            | `text`                     | ✗        | `'pending'::text`    |     |
| 8   | `metadata`          | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 9   | `created_at`        | `timestamp with time zone` | ✗        | `now()`              |     |
| 10  | `created_by`        | `uuid`                     | ✓        | ``                   |     |
| 11  | `updated_at`        | `timestamp with time zone` | ✗        | `now()`              |     |
| 12  | `updated_by`        | `uuid`                     | ✓        | ``                   |     |
| 13  | `deleted_at`        | `timestamp with time zone` | ✓        | ``                   |     |
| 14  | `deleted_by`        | `uuid`                     | ✓        | ``                   |     |
| 15  | `deletion_reason`   | `text`                     | ✓        | ``                   |     |
| 16  | `period_start`      | `date`                     | ✓        | ``                   |     |
| 17  | `period_end`        | `date`                     | ✓        | ``                   |     |
| 18  | `payroll_cycle`     | `payroll_cycle`            | ✓        | ``                   |     |
| 19  | `payment_method`    | `finance_payment_method`   | ✓        | ``                   |     |
| 20  | `batch_type`        | `batch_type`               | ✓        | ``                   |     |
| 21  | `payout_account_id` | `uuid`                     | ✓        | ``                   |     |
| 22  | `status_reason`     | `text`                     | ✓        | ``                   |     |
| 23  | `file_url`          | `text`                     | ✓        | ``                   |     |
| 24  | `exported_at`       | `timestamp with time zone` | ✓        | ``                   |     |
| 25  | `sent_at`           | `timestamp with time zone` | ✓        | ``                   |     |
| 26  | `processed_at`      | `timestamp with time zone` | ✓        | ``                   |     |
| 27  | `error_details`     | `jsonb`                    | ✓        | ``                   |     |

#### Foreign Keys

| Column              | References                        | On Update | On Delete |
| ------------------- | --------------------------------- | --------- | --------- |
| `created_by`        | `adm_members.id`                  | CASCADE   | SET NULL  |
| `created_by`        | `adm_provider_employees.id`       | CASCADE   | RESTRICT  |
| `deleted_by`        | `adm_provider_employees.id`       | CASCADE   | RESTRICT  |
| `deleted_by`        | `adm_members.id`                  | CASCADE   | SET NULL  |
| `payout_account_id` | `fin_accounts.id`                 | CASCADE   | RESTRICT  |
| `status`            | `fin_payment_batch_statuses.code` | CASCADE   | RESTRICT  |
| `tenant_id`         | `adm_tenants.id`                  | CASCADE   | CASCADE   |
| `tenant_id`         | `adm_tenants.id`                  | CASCADE   | CASCADE   |
| `updated_by`        | `adm_members.id`                  | CASCADE   | SET NULL  |
| `updated_by`        | `adm_provider_employees.id`       | CASCADE   | RESTRICT  |

#### Indexes

- **`fin_driver_payment_batches_batch_reference_idx`**
  ```sql
  CREATE INDEX fin_driver_payment_batches_batch_reference_idx ON public.fin_driver_payment_batches USING btree (batch_reference)
  ```
- **`fin_driver_payment_batches_created_by_idx`**
  ```sql
  CREATE INDEX fin_driver_payment_batches_created_by_idx ON public.fin_driver_payment_batches USING btree (created_by)
  ```
- **`fin_driver_payment_batches_deleted_at_idx`**
  ```sql
  CREATE INDEX fin_driver_payment_batches_deleted_at_idx ON public.fin_driver_payment_batches USING btree (deleted_at)
  ```
- **`fin_driver_payment_batches_metadata_idx`**
  ```sql
  CREATE INDEX fin_driver_payment_batches_metadata_idx ON public.fin_driver_payment_batches USING gin (metadata)
  ```
- **`fin_driver_payment_batches_payment_date_idx`**
  ```sql
  CREATE INDEX fin_driver_payment_batches_payment_date_idx ON public.fin_driver_payment_batches USING btree (payment_date DESC)
  ```
- **`fin_driver_payment_batches_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_driver_payment_batches_pkey ON public.fin_driver_payment_batches USING btree (id)
  ```
- **`fin_driver_payment_batches_status_active_idx`**
  ```sql
  CREATE INDEX fin_driver_payment_batches_status_active_idx ON public.fin_driver_payment_batches USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`fin_driver_payment_batches_tenant_batch_ref_unique`**
  ```sql
  CREATE UNIQUE INDEX fin_driver_payment_batches_tenant_batch_ref_unique ON public.fin_driver_payment_batches USING btree (tenant_id, batch_reference) WHERE (deleted_at IS NULL)
  ```
- **`fin_driver_payment_batches_tenant_id_idx`**
  ```sql
  CREATE INDEX fin_driver_payment_batches_tenant_id_idx ON public.fin_driver_payment_batches USING btree (tenant_id)
  ```
- **`fin_driver_payment_batches_updated_by_idx`**
  ```sql
  CREATE INDEX fin_driver_payment_batches_updated_by_idx ON public.fin_driver_payment_batches USING btree (updated_by)
  ```

---

### 50. `fin_driver_payments`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                      | Type                       | Nullable | Default              | PK  |
| --- | --------------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                        | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`                 | `uuid`                     | ✗        | ``                   |     |
| 3   | `driver_id`                 | `uuid`                     | ✗        | ``                   |     |
| 4   | `payment_batch_id`          | `uuid`                     | ✗        | ``                   |     |
| 5   | `amount`                    | `numeric`                  | ✗        | ``                   |     |
| 6   | `currency`                  | `varchar(3)`               | ✗        | ``                   |     |
| 7   | `payment_date`              | `date`                     | ✗        | ``                   |     |
| 8   | `status`                    | `text`                     | ✗        | `'pending'::text`    |     |
| 9   | `metadata`                  | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 10  | `created_at`                | `timestamp with time zone` | ✗        | `now()`              |     |
| 11  | `created_by`                | `uuid`                     | ✓        | ``                   |     |
| 12  | `updated_at`                | `timestamp with time zone` | ✗        | `now()`              |     |
| 13  | `updated_by`                | `uuid`                     | ✓        | ``                   |     |
| 14  | `deleted_at`                | `timestamp with time zone` | ✓        | ``                   |     |
| 15  | `deleted_by`                | `uuid`                     | ✓        | ``                   |     |
| 16  | `deletion_reason`           | `text`                     | ✓        | ``                   |     |
| 17  | `period_start`              | `date`                     | ✓        | ``                   |     |
| 18  | `period_end`                | `date`                     | ✓        | ``                   |     |
| 19  | `amount_in_tenant_currency` | `numeric`                  | ✓        | ``                   |     |
| 20  | `exchange_rate`             | `numeric`                  | ✓        | ``                   |     |
| 21  | `payment_method`            | `finance_payment_method`   | ✓        | ``                   |     |
| 22  | `payout_account_id`         | `uuid`                     | ✓        | ``                   |     |
| 23  | `transaction_reference`     | `text`                     | ✓        | ``                   |     |
| 24  | `status_reason`             | `text`                     | ✓        | ``                   |     |
| 25  | `error_details`             | `jsonb`                    | ✓        | ``                   |     |
| 26  | `processed_at`              | `timestamp with time zone` | ✓        | ``                   |     |
| 27  | `failed_at`                 | `timestamp with time zone` | ✓        | ``                   |     |
| 28  | `cancelled_at`              | `timestamp with time zone` | ✓        | ``                   |     |
| 29  | `notes`                     | `text`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column              | References                      | On Update | On Delete |
| ------------------- | ------------------------------- | --------- | --------- |
| `created_by`        | `adm_members.id`                | CASCADE   | SET NULL  |
| `created_by`        | `adm_provider_employees.id`     | CASCADE   | RESTRICT  |
| `deleted_by`        | `adm_members.id`                | CASCADE   | SET NULL  |
| `deleted_by`        | `adm_provider_employees.id`     | CASCADE   | RESTRICT  |
| `driver_id`         | `rid_drivers.id`                | CASCADE   | CASCADE   |
| `driver_id`         | `rid_drivers.id`                | CASCADE   | CASCADE   |
| `payment_batch_id`  | `fin_driver_payment_batches.id` | CASCADE   | CASCADE   |
| `payment_batch_id`  | `fin_driver_payment_batches.id` | CASCADE   | CASCADE   |
| `payout_account_id` | `fin_accounts.id`               | CASCADE   | SET NULL  |
| `status`            | `fin_payment_statuses.code`     | CASCADE   | RESTRICT  |
| `tenant_id`         | `adm_tenants.id`                | CASCADE   | CASCADE   |
| `tenant_id`         | `adm_tenants.id`                | CASCADE   | CASCADE   |
| `updated_by`        | `adm_provider_employees.id`     | CASCADE   | RESTRICT  |
| `updated_by`        | `adm_members.id`                | CASCADE   | SET NULL  |

#### Indexes

- **`fin_driver_payments_created_by_idx`**
  ```sql
  CREATE INDEX fin_driver_payments_created_by_idx ON public.fin_driver_payments USING btree (created_by)
  ```
- **`fin_driver_payments_deleted_at_idx`**
  ```sql
  CREATE INDEX fin_driver_payments_deleted_at_idx ON public.fin_driver_payments USING btree (deleted_at)
  ```
- **`fin_driver_payments_driver_id_idx`**
  ```sql
  CREATE INDEX fin_driver_payments_driver_id_idx ON public.fin_driver_payments USING btree (driver_id)
  ```
- **`fin_driver_payments_metadata_idx`**
  ```sql
  CREATE INDEX fin_driver_payments_metadata_idx ON public.fin_driver_payments USING gin (metadata)
  ```
- **`fin_driver_payments_payment_batch_id_idx`**
  ```sql
  CREATE INDEX fin_driver_payments_payment_batch_id_idx ON public.fin_driver_payments USING btree (payment_batch_id)
  ```
- **`fin_driver_payments_payment_date_idx`**
  ```sql
  CREATE INDEX fin_driver_payments_payment_date_idx ON public.fin_driver_payments USING btree (payment_date DESC)
  ```
- **`fin_driver_payments_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_driver_payments_pkey ON public.fin_driver_payments USING btree (id)
  ```
- **`fin_driver_payments_status_active_idx`**
  ```sql
  CREATE INDEX fin_driver_payments_status_active_idx ON public.fin_driver_payments USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`fin_driver_payments_tenant_id_idx`**
  ```sql
  CREATE INDEX fin_driver_payments_tenant_id_idx ON public.fin_driver_payments USING btree (tenant_id)
  ```
- **`fin_driver_payments_updated_by_idx`**
  ```sql
  CREATE INDEX fin_driver_payments_updated_by_idx ON public.fin_driver_payments USING btree (updated_by)
  ```
- **`idx_fin_driver_payments_date`**
  ```sql
  CREATE INDEX idx_fin_driver_payments_date ON public.fin_driver_payments USING btree (payment_date DESC)
  ```
- **`idx_fin_driver_payments_driver`**
  ```sql
  CREATE INDEX idx_fin_driver_payments_driver ON public.fin_driver_payments USING btree (driver_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_fin_driver_payments_tenant`**
  ```sql
  CREATE INDEX idx_fin_driver_payments_tenant ON public.fin_driver_payments USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```

---

### 51. `fin_payment_batch_statuses`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column        | Type                       | Nullable | Default | PK  |
| --- | ------------- | -------------------------- | -------- | ------- | --- |
| 1   | `code`        | `text`                     | ✗        | ``      | 🔑  |
| 2   | `label`       | `text`                     | ✗        | ``      |     |
| 3   | `description` | `text`                     | ✓        | ``      |     |
| 4   | `created_at`  | `timestamp with time zone` | ✗        | `now()` |     |

#### Indexes

- **`fin_payment_batch_statuses_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_payment_batch_statuses_pkey ON public.fin_payment_batch_statuses USING btree (code)
  ```

---

### 52. `fin_payment_statuses`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column        | Type                       | Nullable | Default | PK  |
| --- | ------------- | -------------------------- | -------- | ------- | --- |
| 1   | `code`        | `text`                     | ✗        | ``      | 🔑  |
| 2   | `label`       | `text`                     | ✗        | ``      |     |
| 3   | `description` | `text`                     | ✓        | ``      |     |
| 4   | `created_at`  | `timestamp with time zone` | ✗        | `now()` |     |

#### Indexes

- **`fin_payment_statuses_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_payment_statuses_pkey ON public.fin_payment_statuses USING btree (code)
  ```

---

### 53. `fin_toll_transactions`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default              | PK  |
| --- | ------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`         | `uuid`                     | ✗        | ``                   |     |
| 3   | `driver_id`         | `uuid`                     | ✗        | ``                   |     |
| 4   | `vehicle_id`        | `uuid`                     | ✗        | ``                   |     |
| 5   | `toll_gate`         | `text`                     | ✗        | ``                   |     |
| 6   | `toll_date`         | `date`                     | ✗        | ``                   |     |
| 7   | `amount`            | `numeric`                  | ✗        | ``                   |     |
| 8   | `currency`          | `varchar(3)`               | ✗        | ``                   |     |
| 9   | `metadata`          | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 10  | `created_at`        | `timestamp with time zone` | ✗        | `now()`              |     |
| 11  | `created_by`        | `uuid`                     | ✓        | ``                   |     |
| 12  | `updated_at`        | `timestamp with time zone` | ✗        | `now()`              |     |
| 13  | `updated_by`        | `uuid`                     | ✓        | ``                   |     |
| 14  | `deleted_at`        | `timestamp with time zone` | ✓        | ``                   |     |
| 15  | `deleted_by`        | `uuid`                     | ✓        | ``                   |     |
| 16  | `deletion_reason`   | `text`                     | ✓        | ``                   |     |
| 17  | `toll_gate_id`      | `uuid`                     | ✓        | ``                   |     |
| 18  | `toll_timestamp`    | `timestamp with time zone` | ✓        | ``                   |     |
| 19  | `source`            | `toll_transaction_source`  | ✓        | ``                   |     |
| 20  | `status`            | `toll_transaction_status`  | ✗        | ``                   |     |
| 21  | `payment_batch_id`  | `uuid`                     | ✓        | ``                   |     |
| 22  | `driver_payment_id` | `uuid`                     | ✓        | ``                   |     |
| 23  | `trip_id`           | `uuid`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column              | References                      | On Update | On Delete |
| ------------------- | ------------------------------- | --------- | --------- |
| `created_by`        | `adm_members.id`                | CASCADE   | RESTRICT  |
| `created_by`        | `adm_members.id`                | CASCADE   | SET NULL  |
| `deleted_by`        | `adm_members.id`                | CASCADE   | RESTRICT  |
| `deleted_by`        | `adm_members.id`                | CASCADE   | SET NULL  |
| `driver_id`         | `rid_drivers.id`                | CASCADE   | CASCADE   |
| `driver_id`         | `rid_drivers.id`                | CASCADE   | CASCADE   |
| `driver_payment_id` | `fin_driver_payments.id`        | CASCADE   | SET NULL  |
| `payment_batch_id`  | `fin_driver_payment_batches.id` | CASCADE   | SET NULL  |
| `tenant_id`         | `adm_tenants.id`                | CASCADE   | CASCADE   |
| `tenant_id`         | `adm_tenants.id`                | CASCADE   | CASCADE   |
| `toll_gate_id`      | `dir_toll_gates.id`             | CASCADE   | RESTRICT  |
| `trip_id`           | `trp_trips.id`                  | CASCADE   | SET NULL  |
| `updated_by`        | `adm_members.id`                | CASCADE   | SET NULL  |
| `updated_by`        | `adm_members.id`                | CASCADE   | RESTRICT  |
| `vehicle_id`        | `flt_vehicles.id`               | CASCADE   | CASCADE   |
| `vehicle_id`        | `flt_vehicles.id`               | CASCADE   | CASCADE   |

#### Indexes

- **`fin_toll_transactions_created_by_idx`**
  ```sql
  CREATE INDEX fin_toll_transactions_created_by_idx ON public.fin_toll_transactions USING btree (created_by)
  ```
- **`fin_toll_transactions_deleted_at_idx`**
  ```sql
  CREATE INDEX fin_toll_transactions_deleted_at_idx ON public.fin_toll_transactions USING btree (deleted_at)
  ```
- **`fin_toll_transactions_driver_id_idx`**
  ```sql
  CREATE INDEX fin_toll_transactions_driver_id_idx ON public.fin_toll_transactions USING btree (driver_id)
  ```
- **`fin_toll_transactions_metadata_idx`**
  ```sql
  CREATE INDEX fin_toll_transactions_metadata_idx ON public.fin_toll_transactions USING gin (metadata)
  ```
- **`fin_toll_transactions_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_toll_transactions_pkey ON public.fin_toll_transactions USING btree (id)
  ```
- **`fin_toll_transactions_tenant_driver_vehicle_date_unique`**
  ```sql
  CREATE UNIQUE INDEX fin_toll_transactions_tenant_driver_vehicle_date_unique ON public.fin_toll_transactions USING btree (tenant_id, driver_id, vehicle_id, toll_date) WHERE (deleted_at IS NULL)
  ```
- **`fin_toll_transactions_tenant_id_idx`**
  ```sql
  CREATE INDEX fin_toll_transactions_tenant_id_idx ON public.fin_toll_transactions USING btree (tenant_id)
  ```
- **`fin_toll_transactions_toll_date_idx`**
  ```sql
  CREATE INDEX fin_toll_transactions_toll_date_idx ON public.fin_toll_transactions USING btree (toll_date DESC)
  ```
- **`fin_toll_transactions_updated_by_idx`**
  ```sql
  CREATE INDEX fin_toll_transactions_updated_by_idx ON public.fin_toll_transactions USING btree (updated_by)
  ```
- **`fin_toll_transactions_vehicle_id_idx`**
  ```sql
  CREATE INDEX fin_toll_transactions_vehicle_id_idx ON public.fin_toll_transactions USING btree (vehicle_id)
  ```

---

### 54. `fin_traffic_fine_disputes`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                 | Type                       | Nullable | Default                     | PK  |
| --- | ---------------------- | -------------------------- | -------- | --------------------------- | --- |
| 1   | `id`                   | `uuid`                     | ✗        | `gen_random_uuid()`         | 🔑  |
| 2   | `fine_id`              | `uuid`                     | ✗        | ``                          |     |
| 3   | `submitted_by`         | `uuid`                     | ✗        | ``                          |     |
| 4   | `submitted_at`         | `timestamp with time zone` | ✗        | `now()`                     |     |
| 5   | `reason`               | `text`                     | ✗        | ``                          |     |
| 6   | `supporting_documents` | `jsonb`                    | ✓        | ``                          |     |
| 7   | `status`               | `dispute_status`           | ✗        | `'pending'::dispute_status` |     |
| 8   | `reviewed_by`          | `uuid`                     | ✓        | ``                          |     |
| 9   | `resolved_at`          | `timestamp with time zone` | ✓        | ``                          |     |
| 10  | `resolution_notes`     | `text`                     | ✓        | ``                          |     |
| 11  | `metadata`             | `jsonb`                    | ✗        | `'{}'::jsonb`               |     |
| 12  | `created_at`           | `timestamp with time zone` | ✗        | `now()`                     |     |
| 13  | `updated_at`           | `timestamp with time zone` | ✗        | `now()`                     |     |

#### Foreign Keys

| Column         | References             | On Update | On Delete |
| -------------- | ---------------------- | --------- | --------- |
| `fine_id`      | `fin_traffic_fines.id` | CASCADE   | CASCADE   |
| `reviewed_by`  | `adm_members.id`       | CASCADE   | SET NULL  |
| `submitted_by` | `adm_members.id`       | CASCADE   | CASCADE   |

#### Indexes

- **`fin_traffic_fine_disputes_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_traffic_fine_disputes_pkey ON public.fin_traffic_fine_disputes USING btree (id)
  ```

---

### 55. `fin_traffic_fines`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default              | PK  |
| --- | ------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`         | `uuid`                     | ✗        | ``                   |     |
| 3   | `driver_id`         | `uuid`                     | ✗        | ``                   |     |
| 4   | `vehicle_id`        | `uuid`                     | ✗        | ``                   |     |
| 5   | `fine_reference`    | `text`                     | ✗        | ``                   |     |
| 6   | `fine_date`         | `date`                     | ✗        | ``                   |     |
| 7   | `fine_type`         | `text`                     | ✗        | ``                   |     |
| 8   | `amount`            | `numeric`                  | ✗        | ``                   |     |
| 9   | `currency`          | `varchar(3)`               | ✗        | ``                   |     |
| 10  | `status`            | `text`                     | ✗        | `'pending'::text`    |     |
| 11  | `metadata`          | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 12  | `created_at`        | `timestamp with time zone` | ✗        | `now()`              |     |
| 13  | `created_by`        | `uuid`                     | ✓        | ``                   |     |
| 14  | `updated_at`        | `timestamp with time zone` | ✗        | `now()`              |     |
| 15  | `updated_by`        | `uuid`                     | ✓        | ``                   |     |
| 16  | `deleted_at`        | `timestamp with time zone` | ✓        | ``                   |     |
| 17  | `deleted_by`        | `uuid`                     | ✓        | ``                   |     |
| 18  | `deletion_reason`   | `text`                     | ✓        | ``                   |     |
| 19  | `fine_timestamp`    | `timestamp with time zone` | ✓        | ``                   |     |
| 20  | `fine_type_id`      | `uuid`                     | ✓        | ``                   |     |
| 21  | `location`          | `point`                    | ✓        | ``                   |     |
| 22  | `address`           | `text`                     | ✓        | ``                   |     |
| 23  | `points_penalty`    | `integer`                  | ✓        | ``                   |     |
| 24  | `issuing_authority` | `text`                     | ✓        | ``                   |     |
| 25  | `deadline_date`     | `date`                     | ✓        | ``                   |     |
| 26  | `paid_at`           | `timestamp with time zone` | ✓        | ``                   |     |
| 27  | `payment_method_id` | `uuid`                     | ✓        | ``                   |     |
| 28  | `driver_payment_id` | `uuid`                     | ✓        | ``                   |     |
| 29  | `dispute_id`        | `uuid`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column              | References                     | On Update | On Delete |
| ------------------- | ------------------------------ | --------- | --------- |
| `created_by`        | `adm_members.id`               | CASCADE   | RESTRICT  |
| `created_by`        | `adm_members.id`               | CASCADE   | SET NULL  |
| `deleted_by`        | `adm_members.id`               | CASCADE   | SET NULL  |
| `deleted_by`        | `adm_members.id`               | CASCADE   | RESTRICT  |
| `dispute_id`        | `fin_traffic_fine_disputes.id` | CASCADE   | SET NULL  |
| `driver_id`         | `rid_drivers.id`               | CASCADE   | CASCADE   |
| `driver_id`         | `rid_drivers.id`               | CASCADE   | CASCADE   |
| `driver_payment_id` | `fin_driver_payments.id`       | CASCADE   | SET NULL  |
| `fine_type_id`      | `dir_fine_types.id`            | CASCADE   | RESTRICT  |
| `payment_method_id` | `bil_payment_methods.id`       | CASCADE   | SET NULL  |
| `tenant_id`         | `adm_tenants.id`               | CASCADE   | CASCADE   |
| `tenant_id`         | `adm_tenants.id`               | CASCADE   | CASCADE   |
| `updated_by`        | `adm_members.id`               | CASCADE   | SET NULL  |
| `updated_by`        | `adm_members.id`               | CASCADE   | RESTRICT  |
| `vehicle_id`        | `flt_vehicles.id`              | CASCADE   | CASCADE   |
| `vehicle_id`        | `flt_vehicles.id`              | CASCADE   | CASCADE   |

#### Indexes

- **`fin_traffic_fines_created_by_idx`**
  ```sql
  CREATE INDEX fin_traffic_fines_created_by_idx ON public.fin_traffic_fines USING btree (created_by)
  ```
- **`fin_traffic_fines_deleted_at_idx`**
  ```sql
  CREATE INDEX fin_traffic_fines_deleted_at_idx ON public.fin_traffic_fines USING btree (deleted_at)
  ```
- **`fin_traffic_fines_driver_id_idx`**
  ```sql
  CREATE INDEX fin_traffic_fines_driver_id_idx ON public.fin_traffic_fines USING btree (driver_id)
  ```
- **`fin_traffic_fines_fine_date_idx`**
  ```sql
  CREATE INDEX fin_traffic_fines_fine_date_idx ON public.fin_traffic_fines USING btree (fine_date DESC)
  ```
- **`fin_traffic_fines_metadata_idx`**
  ```sql
  CREATE INDEX fin_traffic_fines_metadata_idx ON public.fin_traffic_fines USING gin (metadata)
  ```
- **`fin_traffic_fines_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_traffic_fines_pkey ON public.fin_traffic_fines USING btree (id)
  ```
- **`fin_traffic_fines_status_active_idx`**
  ```sql
  CREATE INDEX fin_traffic_fines_status_active_idx ON public.fin_traffic_fines USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`fin_traffic_fines_tenant_id_fine_reference_key`**
  ```sql
  CREATE UNIQUE INDEX fin_traffic_fines_tenant_id_fine_reference_key ON public.fin_traffic_fines USING btree (tenant_id, fine_reference) WHERE (deleted_at IS NULL)
  ```
- **`fin_traffic_fines_tenant_id_idx`**
  ```sql
  CREATE INDEX fin_traffic_fines_tenant_id_idx ON public.fin_traffic_fines USING btree (tenant_id)
  ```
- **`fin_traffic_fines_updated_by_idx`**
  ```sql
  CREATE INDEX fin_traffic_fines_updated_by_idx ON public.fin_traffic_fines USING btree (updated_by)
  ```
- **`fin_traffic_fines_vehicle_id_idx`**
  ```sql
  CREATE INDEX fin_traffic_fines_vehicle_id_idx ON public.fin_traffic_fines USING btree (vehicle_id)
  ```

---

### 56. `fin_transaction_categories`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column               | Type                        | Nullable | Default             | PK  |
| --- | -------------------- | --------------------------- | -------- | ------------------- | --- |
| 1   | `id`                 | `uuid`                      | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `code`               | `varchar(50)`               | ✗        | ``                  |     |
| 3   | `name`               | `text`                      | ✗        | ``                  |     |
| 4   | `description`        | `text`                      | ✓        | ``                  |     |
| 5   | `category_type`      | `transaction_category_type` | ✗        | ``                  |     |
| 6   | `parent_category_id` | `uuid`                      | ✓        | ``                  |     |
| 7   | `is_active`          | `boolean`                   | ✗        | `true`              |     |
| 8   | `created_at`         | `timestamp with time zone`  | ✗        | `now()`             |     |
| 9   | `updated_at`         | `timestamp with time zone`  | ✗        | `now()`             |     |

#### Foreign Keys

| Column               | References                      | On Update | On Delete |
| -------------------- | ------------------------------- | --------- | --------- |
| `parent_category_id` | `fin_transaction_categories.id` | NO ACTION | NO ACTION |

#### Indexes

- **`fin_transaction_categories_code_key`**
  ```sql
  CREATE UNIQUE INDEX fin_transaction_categories_code_key ON public.fin_transaction_categories USING btree (code)
  ```
- **`fin_transaction_categories_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_transaction_categories_pkey ON public.fin_transaction_categories USING btree (id)
  ```

---

### 57. `fin_transactions`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                    | Type                       | Nullable | Default              | PK  |
| --- | ------------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                      | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`               | `uuid`                     | ✗        | ``                   |     |
| 3   | `account_id`              | `uuid`                     | ✗        | ``                   |     |
| 4   | `transaction_type`        | `text`                     | ✗        | ``                   |     |
| 5   | `amount`                  | `numeric`                  | ✗        | ``                   |     |
| 6   | `currency`                | `varchar(3)`               | ✗        | ``                   |     |
| 7   | `reference`               | `text`                     | ✗        | ``                   |     |
| 8   | `description`             | `text`                     | ✓        | ``                   |     |
| 9   | `transaction_date`        | `timestamp with time zone` | ✗        | ``                   |     |
| 10  | `status`                  | `text`                     | ✗        | `'pending'::text`    |     |
| 11  | `metadata`                | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 12  | `created_at`              | `timestamp with time zone` | ✗        | `now()`              |     |
| 13  | `created_by`              | `uuid`                     | ✓        | ``                   |     |
| 14  | `updated_at`              | `timestamp with time zone` | ✗        | `now()`              |     |
| 15  | `updated_by`              | `uuid`                     | ✓        | ``                   |     |
| 16  | `deleted_at`              | `timestamp with time zone` | ✓        | ``                   |     |
| 17  | `deleted_by`              | `uuid`                     | ✓        | ``                   |     |
| 18  | `deletion_reason`         | `text`                     | ✓        | ``                   |     |
| 19  | `counterparty_account_id` | `uuid`                     | ✓        | ``                   |     |
| 20  | `net_amount`              | `numeric`                  | ✓        | ``                   |     |
| 21  | `tax_rate`                | `numeric`                  | ✓        | ``                   |     |
| 22  | `tax_amount`              | `numeric`                  | ✓        | ``                   |     |
| 23  | `exchange_rate`           | `numeric`                  | ✓        | ``                   |     |
| 24  | `category_id`             | `uuid`                     | ✓        | ``                   |     |
| 25  | `entity_type`             | `varchar(50)`              | ✓        | ``                   |     |
| 26  | `entity_id`               | `uuid`                     | ✓        | ``                   |     |
| 27  | `payment_method_id`       | `uuid`                     | ✓        | ``                   |     |
| 28  | `source_system`           | `varchar(50)`              | ✓        | ``                   |     |
| 29  | `validated_by`            | `uuid`                     | ✓        | ``                   |     |
| 30  | `validated_at`            | `timestamp with time zone` | ✓        | ``                   |     |

#### Foreign Keys

| Column                    | References                      | On Update | On Delete |
| ------------------------- | ------------------------------- | --------- | --------- |
| `account_id`              | `fin_accounts.id`               | CASCADE   | CASCADE   |
| `account_id`              | `fin_accounts.id`               | CASCADE   | CASCADE   |
| `category_id`             | `fin_transaction_categories.id` | CASCADE   | SET NULL  |
| `counterparty_account_id` | `fin_accounts.id`               | CASCADE   | SET NULL  |
| `created_by`              | `adm_members.id`                | CASCADE   | RESTRICT  |
| `created_by`              | `adm_members.id`                | CASCADE   | SET NULL  |
| `deleted_by`              | `adm_members.id`                | CASCADE   | RESTRICT  |
| `deleted_by`              | `adm_members.id`                | CASCADE   | SET NULL  |
| `payment_method_id`       | `bil_payment_methods.id`        | CASCADE   | SET NULL  |
| `status`                  | `dir_transaction_statuses.code` | CASCADE   | RESTRICT  |
| `tenant_id`               | `adm_tenants.id`                | CASCADE   | CASCADE   |
| `tenant_id`               | `adm_tenants.id`                | CASCADE   | CASCADE   |
| `transaction_type`        | `dir_transaction_types.code`    | CASCADE   | RESTRICT  |
| `updated_by`              | `adm_members.id`                | CASCADE   | SET NULL  |
| `updated_by`              | `adm_members.id`                | CASCADE   | RESTRICT  |
| `validated_by`            | `adm_members.id`                | CASCADE   | SET NULL  |

#### Indexes

- **`fin_transactions_account_id_idx`**
  ```sql
  CREATE INDEX fin_transactions_account_id_idx ON public.fin_transactions USING btree (account_id)
  ```
- **`fin_transactions_created_by_idx`**
  ```sql
  CREATE INDEX fin_transactions_created_by_idx ON public.fin_transactions USING btree (created_by)
  ```
- **`fin_transactions_deleted_at_idx`**
  ```sql
  CREATE INDEX fin_transactions_deleted_at_idx ON public.fin_transactions USING btree (deleted_at)
  ```
- **`fin_transactions_metadata_idx`**
  ```sql
  CREATE INDEX fin_transactions_metadata_idx ON public.fin_transactions USING gin (metadata)
  ```
- **`fin_transactions_pkey`**
  ```sql
  CREATE UNIQUE INDEX fin_transactions_pkey ON public.fin_transactions USING btree (id)
  ```
- **`fin_transactions_status_active_idx`**
  ```sql
  CREATE INDEX fin_transactions_status_active_idx ON public.fin_transactions USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`fin_transactions_tenant_id_idx`**
  ```sql
  CREATE INDEX fin_transactions_tenant_id_idx ON public.fin_transactions USING btree (tenant_id)
  ```
- **`fin_transactions_transaction_date_idx`**
  ```sql
  CREATE INDEX fin_transactions_transaction_date_idx ON public.fin_transactions USING btree (transaction_date DESC)
  ```
- **`fin_transactions_updated_by_idx`**
  ```sql
  CREATE INDEX fin_transactions_updated_by_idx ON public.fin_transactions USING btree (updated_by)
  ```
- **`idx_fin_transactions_account`**
  ```sql
  CREATE INDEX idx_fin_transactions_account ON public.fin_transactions USING btree (account_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_fin_transactions_date`**
  ```sql
  CREATE INDEX idx_fin_transactions_date ON public.fin_transactions USING btree (transaction_date DESC)
  ```
- **`idx_fin_transactions_metadata`**
  ```sql
  CREATE INDEX idx_fin_transactions_metadata ON public.fin_transactions USING gin (metadata)
  ```
- **`idx_fin_transactions_tenant`**
  ```sql
  CREATE INDEX idx_fin_transactions_tenant ON public.fin_transactions USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```

---

### 58. `flt_vehicle_assignments`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column               | Type                       | Nullable | Default                          | PK  |
| --- | -------------------- | -------------------------- | -------- | -------------------------------- | --- |
| 1   | `id`                 | `uuid`                     | ✗        | `uuid_generate_v4()`             | 🔑  |
| 2   | `tenant_id`          | `uuid`                     | ✗        | ``                               |     |
| 3   | `driver_id`          | `uuid`                     | ✗        | ``                               |     |
| 4   | `vehicle_id`         | `uuid`                     | ✗        | ``                               |     |
| 5   | `start_date`         | `date`                     | ✗        | ``                               |     |
| 6   | `end_date`           | `date`                     | ✓        | ``                               |     |
| 7   | `assignment_type`    | `varchar(50)`              | ✗        | `'permanent'::character varying` |     |
| 8   | `metadata`           | `jsonb`                    | ✗        | `'{}'::jsonb`                    |     |
| 9   | `status`             | `varchar(50)`              | ✗        | `'active'::character varying`    |     |
| 10  | `created_at`         | `timestamp with time zone` | ✗        | `now()`                          |     |
| 11  | `created_by`         | `uuid`                     | ✓        | ``                               |     |
| 12  | `updated_at`         | `timestamp with time zone` | ✗        | `now()`                          |     |
| 13  | `updated_by`         | `uuid`                     | ✓        | ``                               |     |
| 14  | `deleted_at`         | `timestamp with time zone` | ✓        | ``                               |     |
| 15  | `deleted_by`         | `uuid`                     | ✓        | ``                               |     |
| 16  | `deletion_reason`    | `text`                     | ✓        | ``                               |     |
| 17  | `handover_date`      | `timestamp with time zone` | ✓        | ``                               |     |
| 18  | `handover_location`  | `text`                     | ✓        | ``                               |     |
| 19  | `handover_type`      | `varchar(20)`              | ✓        | ``                               |     |
| 20  | `initial_odometer`   | `integer`                  | ✓        | ``                               |     |
| 21  | `initial_fuel_level` | `integer`                  | ✓        | ``                               |     |
| 22  | `initial_condition`  | `jsonb`                    | ✓        | ``                               |     |
| 23  | `handover_photos`    | `jsonb`                    | ✓        | ``                               |     |
| 24  | `photos_metadata`    | `jsonb`                    | ✓        | ``                               |     |
| 25  | `driver_signature`   | `text`                     | ✓        | ``                               |     |
| 26  | `fleet_signature`    | `text`                     | ✓        | ``                               |     |
| 27  | `handover_checklist` | `jsonb`                    | ✓        | ``                               |     |
| 28  | `return_date`        | `timestamp with time zone` | ✓        | ``                               |     |
| 29  | `return_odometer`    | `integer`                  | ✓        | ``                               |     |
| 30  | `return_fuel_level`  | `integer`                  | ✓        | ``                               |     |
| 31  | `return_condition`   | `jsonb`                    | ✓        | ``                               |     |
| 32  | `damages_reported`   | `jsonb`                    | ✓        | ``                               |     |
| 33  | `penalty_amount`     | `numeric`                  | ✓        | ``                               |     |
| 34  | `notes`              | `text`                     | ✓        | ``                               |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `created_by` | `adm_members.id`            | CASCADE   | SET NULL  |
| `deleted_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `deleted_by` | `adm_members.id`            | CASCADE   | SET NULL  |
| `driver_id`  | `rid_drivers.id`            | NO ACTION | NO ACTION |
| `driver_id`  | `rid_drivers.id`            | CASCADE   | CASCADE   |
| `tenant_id`  | `adm_tenants.id`            | NO ACTION | CASCADE   |
| `tenant_id`  | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `updated_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `updated_by` | `adm_members.id`            | CASCADE   | SET NULL  |
| `vehicle_id` | `flt_vehicles.id`           | NO ACTION | NO ACTION |
| `vehicle_id` | `flt_vehicles.id`           | CASCADE   | CASCADE   |

#### Indexes

- **`flt_vehicle_assignments_created_by_idx`**
  ```sql
  CREATE INDEX flt_vehicle_assignments_created_by_idx ON public.flt_vehicle_assignments USING btree (created_by)
  ```
- **`flt_vehicle_assignments_deleted_at_idx`**
  ```sql
  CREATE INDEX flt_vehicle_assignments_deleted_at_idx ON public.flt_vehicle_assignments USING btree (deleted_at)
  ```
- **`flt_vehicle_assignments_driver_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_assignments_driver_id_idx ON public.flt_vehicle_assignments USING btree (driver_id)
  ```
- **`flt_vehicle_assignments_end_date_idx`**
  ```sql
  CREATE INDEX flt_vehicle_assignments_end_date_idx ON public.flt_vehicle_assignments USING btree (end_date)
  ```
- **`flt_vehicle_assignments_metadata_idx`**
  ```sql
  CREATE INDEX flt_vehicle_assignments_metadata_idx ON public.flt_vehicle_assignments USING gin (metadata)
  ```
- **`flt_vehicle_assignments_pkey`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicle_assignments_pkey ON public.flt_vehicle_assignments USING btree (id)
  ```
- **`flt_vehicle_assignments_start_date_idx`**
  ```sql
  CREATE INDEX flt_vehicle_assignments_start_date_idx ON public.flt_vehicle_assignments USING btree (start_date)
  ```
- **`flt_vehicle_assignments_status_active_idx`**
  ```sql
  CREATE INDEX flt_vehicle_assignments_status_active_idx ON public.flt_vehicle_assignments USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`flt_vehicle_assignments_tenant_driver_vehicle_start_uq`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicle_assignments_tenant_driver_vehicle_start_uq ON public.flt_vehicle_assignments USING btree (tenant_id, driver_id, vehicle_id, start_date) WHERE (deleted_at IS NULL)
  ```
- **`flt_vehicle_assignments_tenant_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_assignments_tenant_id_idx ON public.flt_vehicle_assignments USING btree (tenant_id)
  ```
- **`flt_vehicle_assignments_updated_by_idx`**
  ```sql
  CREATE INDEX flt_vehicle_assignments_updated_by_idx ON public.flt_vehicle_assignments USING btree (updated_by)
  ```
- **`flt_vehicle_assignments_vehicle_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_assignments_vehicle_id_idx ON public.flt_vehicle_assignments USING btree (vehicle_id)
  ```
- **`idx_flt_vehicle_assignments_driver`**
  ```sql
  CREATE INDEX idx_flt_vehicle_assignments_driver ON public.flt_vehicle_assignments USING btree (driver_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_flt_vehicle_assignments_tenant`**
  ```sql
  CREATE INDEX idx_flt_vehicle_assignments_tenant ON public.flt_vehicle_assignments USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_flt_vehicle_assignments_vehicle`**
  ```sql
  CREATE INDEX idx_flt_vehicle_assignments_vehicle ON public.flt_vehicle_assignments USING btree (vehicle_id) WHERE (deleted_at IS NULL)
  ```

---

### 59. `flt_vehicle_equipments`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                   | Type                       | Nullable | Default             | PK  |
| --- | ------------------------ | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                     | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`              | `uuid`                     | ✗        | ``                  |     |
| 3   | `vehicle_id`             | `uuid`                     | ✗        | ``                  |     |
| 4   | `equipment_type`         | `varchar(50)`              | ✗        | ``                  |     |
| 5   | `name`                   | `varchar(100)`             | ✗        | ``                  |     |
| 6   | `description`            | `text`                     | ✓        | ``                  |     |
| 7   | `serial_number`          | `varchar(100)`             | ✓        | ``                  |     |
| 8   | `provided_date`          | `date`                     | ✗        | ``                  |     |
| 9   | `return_date`            | `date`                     | ✓        | ``                  |     |
| 10  | `expiry_date`            | `date`                     | ✓        | ``                  |     |
| 11  | `purchase_price`         | `numeric`                  | ✓        | ``                  |     |
| 12  | `current_value`          | `numeric`                  | ✓        | ``                  |     |
| 13  | `currency`               | `char(3)`                  | ✓        | ``                  |     |
| 14  | `depreciation_rate`      | `numeric`                  | ✓        | ``                  |     |
| 15  | `condition_at_provision` | `varchar(20)`              | ✓        | ``                  |     |
| 16  | `condition_at_return`    | `varchar(20)`              | ✓        | ``                  |     |
| 17  | `damage_notes`           | `text`                     | ✓        | ``                  |     |
| 18  | `status`                 | `varchar(20)`              | ✗        | ``                  |     |
| 19  | `current_assignment_id`  | `uuid`                     | ✓        | ``                  |     |
| 20  | `warranty_expiry`        | `date`                     | ✓        | ``                  |     |
| 21  | `warranty_provider`      | `varchar(100)`             | ✓        | ``                  |     |
| 22  | `last_maintenance_date`  | `date`                     | ✓        | ``                  |     |
| 23  | `next_maintenance_date`  | `date`                     | ✓        | ``                  |     |
| 24  | `notes`                  | `text`                     | ✓        | ``                  |     |
| 25  | `metadata`               | `jsonb`                    | ✓        | ``                  |     |
| 26  | `created_at`             | `timestamp with time zone` | ✗        | `now()`             |     |
| 27  | `updated_at`             | `timestamp with time zone` | ✗        | `now()`             |     |
| 28  | `created_by`             | `uuid`                     | ✗        | ``                  |     |
| 29  | `updated_by`             | `uuid`                     | ✓        | ``                  |     |
| 30  | `deleted_at`             | `timestamp with time zone` | ✓        | ``                  |     |
| 31  | `deleted_by`             | `uuid`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column                  | References                   | On Update | On Delete |
| ----------------------- | ---------------------------- | --------- | --------- |
| `created_by`            | `adm_provider_employees.id`  | NO ACTION | NO ACTION |
| `current_assignment_id` | `flt_vehicle_assignments.id` | NO ACTION | NO ACTION |
| `deleted_by`            | `adm_provider_employees.id`  | NO ACTION | NO ACTION |
| `tenant_id`             | `adm_tenants.id`             | NO ACTION | CASCADE   |
| `updated_by`            | `adm_provider_employees.id`  | NO ACTION | NO ACTION |
| `vehicle_id`            | `flt_vehicles.id`            | NO ACTION | NO ACTION |

#### Indexes

- **`flt_vehicle_equipments_pkey`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicle_equipments_pkey ON public.flt_vehicle_equipments USING btree (id)
  ```
- **`idx_flt_vehicle_equipments_current_assignment_id`**
  ```sql
  CREATE INDEX idx_flt_vehicle_equipments_current_assignment_id ON public.flt_vehicle_equipments USING btree (current_assignment_id)
  ```
- **`idx_flt_vehicle_equipments_status`**
  ```sql
  CREATE INDEX idx_flt_vehicle_equipments_status ON public.flt_vehicle_equipments USING btree (status)
  ```
- **`idx_flt_vehicle_equipments_tenant_id`**
  ```sql
  CREATE INDEX idx_flt_vehicle_equipments_tenant_id ON public.flt_vehicle_equipments USING btree (tenant_id)
  ```
- **`idx_flt_vehicle_equipments_vehicle_id`**
  ```sql
  CREATE INDEX idx_flt_vehicle_equipments_vehicle_id ON public.flt_vehicle_equipments USING btree (vehicle_id)
  ```

---

### 60. `flt_vehicle_events`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                  | Type                       | Nullable | Default              | PK  |
| --- | ----------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                    | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`             | `uuid`                     | ✗        | ``                   |     |
| 3   | `vehicle_id`            | `uuid`                     | ✗        | ``                   |     |
| 4   | `event_type`            | `text`                     | ✗        | ``                   |     |
| 5   | `event_date`            | `timestamp with time zone` | ✗        | ``                   |     |
| 6   | `severity`              | `text`                     | ✓        | ``                   |     |
| 7   | `downtime_hours`        | `integer`                  | ✓        | ``                   |     |
| 8   | `cost_amount`           | `numeric`                  | ✓        | ``                   |     |
| 9   | `currency`              | `char(3)`                  | ✗        | `'EUR'::bpchar`      |     |
| 10  | `details`               | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 11  | `notes`                 | `text`                     | ✓        | ``                   |     |
| 13  | `created_at`            | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 14  | `created_by`            | `uuid`                     | ✓        | ``                   |     |
| 15  | `updated_at`            | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 16  | `updated_by`            | `uuid`                     | ✓        | ``                   |     |
| 17  | `deleted_at`            | `timestamp with time zone` | ✓        | ``                   |     |
| 18  | `deleted_by`            | `uuid`                     | ✓        | ``                   |     |
| 19  | `deletion_reason`       | `text`                     | ✓        | ``                   |     |
| 20  | `driver_id`             | `uuid`                     | ✓        | ``                   |     |
| 21  | `ride_id`               | `uuid`                     | ✓        | ``                   |     |
| 22  | `assignment_id`         | `uuid`                     | ✓        | ``                   |     |
| 23  | `responsible_party`     | `varchar(20)`              | ✓        | ``                   |     |
| 24  | `fault_percentage`      | `integer`                  | ✓        | ``                   |     |
| 25  | `liability_assessment`  | `jsonb`                    | ✓        | ``                   |     |
| 26  | `police_report_number`  | `text`                     | ✓        | ``                   |     |
| 27  | `police_station`        | `text`                     | ✓        | ``                   |     |
| 28  | `insurance_claim_id`    | `uuid`                     | ✓        | ``                   |     |
| 29  | `claim_status`          | `varchar(20)`              | ✓        | ``                   |     |
| 30  | `repair_status`         | `varchar(20)`              | ✓        | ``                   |     |
| 31  | `repair_shop_id`        | `uuid`                     | ✓        | ``                   |     |
| 32  | `estimated_repair_days` | `integer`                  | ✓        | ``                   |     |
| 33  | `actual_repair_days`    | `integer`                  | ✓        | ``                   |     |
| 34  | `repair_invoice_id`     | `uuid`                     | ✓        | ``                   |     |
| 35  | `photos`                | `jsonb`                    | ✓        | ``                   |     |

#### Foreign Keys

| Column          | References                   | On Update | On Delete |
| --------------- | ---------------------------- | --------- | --------- |
| `assignment_id` | `flt_vehicle_assignments.id` | NO ACTION | NO ACTION |
| `created_by`    | `adm_provider_employees.id`  | NO ACTION | NO ACTION |
| `created_by`    | `adm_members.id`             | CASCADE   | SET NULL  |
| `deleted_by`    | `adm_members.id`             | CASCADE   | SET NULL  |
| `deleted_by`    | `adm_provider_employees.id`  | NO ACTION | NO ACTION |
| `driver_id`     | `rid_drivers.id`             | NO ACTION | NO ACTION |
| `tenant_id`     | `adm_tenants.id`             | NO ACTION | CASCADE   |
| `tenant_id`     | `adm_tenants.id`             | CASCADE   | CASCADE   |
| `updated_by`    | `adm_provider_employees.id`  | NO ACTION | NO ACTION |
| `updated_by`    | `adm_members.id`             | CASCADE   | SET NULL  |
| `vehicle_id`    | `flt_vehicles.id`            | CASCADE   | CASCADE   |
| `vehicle_id`    | `flt_vehicles.id`            | NO ACTION | NO ACTION |

#### Indexes

- **`flt_vehicle_events_created_at_idx`**
  ```sql
  CREATE INDEX flt_vehicle_events_created_at_idx ON public.flt_vehicle_events USING btree (created_at DESC)
  ```
- **`flt_vehicle_events_created_by_idx`**
  ```sql
  CREATE INDEX flt_vehicle_events_created_by_idx ON public.flt_vehicle_events USING btree (created_by)
  ```
- **`flt_vehicle_events_deleted_at_idx`**
  ```sql
  CREATE INDEX flt_vehicle_events_deleted_at_idx ON public.flt_vehicle_events USING btree (deleted_at)
  ```
- **`flt_vehicle_events_details_idx`**
  ```sql
  CREATE INDEX flt_vehicle_events_details_idx ON public.flt_vehicle_events USING gin (details)
  ```
- **`flt_vehicle_events_event_date_idx`**
  ```sql
  CREATE INDEX flt_vehicle_events_event_date_idx ON public.flt_vehicle_events USING btree (event_date)
  ```
- **`flt_vehicle_events_event_type_idx`**
  ```sql
  CREATE INDEX flt_vehicle_events_event_type_idx ON public.flt_vehicle_events USING btree (event_type)
  ```
- **`flt_vehicle_events_pkey`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicle_events_pkey ON public.flt_vehicle_events USING btree (id)
  ```
- **`flt_vehicle_events_severity_active_idx`**
  ```sql
  CREATE INDEX flt_vehicle_events_severity_active_idx ON public.flt_vehicle_events USING btree (severity) WHERE (deleted_at IS NULL)
  ```
- **`flt_vehicle_events_tenant_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_events_tenant_id_idx ON public.flt_vehicle_events USING btree (tenant_id)
  ```
- **`flt_vehicle_events_updated_by_idx`**
  ```sql
  CREATE INDEX flt_vehicle_events_updated_by_idx ON public.flt_vehicle_events USING btree (updated_by)
  ```
- **`flt_vehicle_events_vehicle_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_events_vehicle_id_idx ON public.flt_vehicle_events USING btree (vehicle_id)
  ```
- **`idx_flt_vehicle_events_event_type_active`**
  ```sql
  CREATE INDEX idx_flt_vehicle_events_event_type_active ON public.flt_vehicle_events USING btree (event_type) WHERE (deleted_at IS NULL)
  ```
- **`idx_flt_vehicle_events_vehicle_id`**
  ```sql
  CREATE INDEX idx_flt_vehicle_events_vehicle_id ON public.flt_vehicle_events USING btree (vehicle_id) WHERE (deleted_at IS NULL)
  ```

---

### 61. `flt_vehicle_expenses`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                   | Type                       | Nullable | Default              | PK  |
| --- | ------------------------ | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                     | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`              | `uuid`                     | ✗        | ``                   |     |
| 3   | `vehicle_id`             | `uuid`                     | ✗        | ``                   |     |
| 4   | `driver_id`              | `uuid`                     | ✓        | ``                   |     |
| 5   | `ride_id`                | `uuid`                     | ✓        | ``                   |     |
| 6   | `expense_date`           | `date`                     | ✗        | ``                   |     |
| 7   | `expense_category`       | `text`                     | ✗        | ``                   |     |
| 8   | `amount`                 | `numeric`                  | ✗        | ``                   |     |
| 9   | `currency`               | `char(3)`                  | ✗        | `'EUR'::bpchar`      |     |
| 10  | `payment_method`         | `text`                     | ✓        | ``                   |     |
| 11  | `receipt_url`            | `text`                     | ✓        | ``                   |     |
| 12  | `odometer_reading`       | `integer`                  | ✓        | ``                   |     |
| 13  | `quantity`               | `numeric`                  | ✓        | ``                   |     |
| 14  | `unit_price`             | `numeric`                  | ✓        | ``                   |     |
| 15  | `location`               | `text`                     | ✓        | ``                   |     |
| 16  | `vendor`                 | `text`                     | ✓        | ``                   |     |
| 17  | `description`            | `text`                     | ✓        | ``                   |     |
| 18  | `reimbursed`             | `boolean`                  | ✗        | `false`              |     |
| 19  | `reimbursed_at`          | `timestamp with time zone` | ✓        | ``                   |     |
| 20  | `reimbursed_in_batch_id` | `uuid`                     | ✓        | ``                   |     |
| 21  | `notes`                  | `text`                     | ✓        | ``                   |     |
| 22  | `metadata`               | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 23  | `created_at`             | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 24  | `created_by`             | `uuid`                     | ✓        | ``                   |     |
| 25  | `updated_at`             | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 26  | `updated_by`             | `uuid`                     | ✓        | ``                   |     |
| 27  | `deleted_at`             | `timestamp with time zone` | ✓        | ``                   |     |
| 28  | `deleted_by`             | `uuid`                     | ✓        | ``                   |     |
| 29  | `deletion_reason`        | `text`                     | ✓        | ``                   |     |
| 30  | `expense_subcategory`    | `varchar(50)`              | ✓        | ``                   |     |
| 31  | `period_start`           | `date`                     | ✓        | ``                   |     |
| 32  | `period_end`             | `date`                     | ✓        | ``                   |     |
| 33  | `mileage_start`          | `integer`                  | ✓        | ``                   |     |
| 34  | `mileage_end`            | `integer`                  | ✓        | ``                   |     |
| 35  | `trip_ids`               | `ARRAY`                    | ✓        | ``                   |     |
| 36  | `requires_approval`      | `boolean`                  | ✓        | `true`               |     |
| 37  | `approval_threshold`     | `numeric`                  | ✓        | ``                   |     |
| 38  | `approval_status`        | `varchar(20)`              | ✓        | ``                   |     |
| 39  | `approved_by`            | `uuid`                     | ✓        | ``                   |     |
| 40  | `approved_at`            | `timestamp with time zone` | ✓        | ``                   |     |
| 41  | `rejection_reason`       | `text`                     | ✓        | ``                   |     |
| 42  | `receipt_status`         | `varchar(20)`              | ✓        | ``                   |     |
| 43  | `receipt_verified_by`    | `uuid`                     | ✓        | ``                   |     |
| 44  | `receipt_verified_at`    | `timestamp with time zone` | ✓        | ``                   |     |
| 45  | `receipt_issues`         | `jsonb`                    | ✓        | ``                   |     |
| 46  | `ocr_extracted_data`     | `jsonb`                    | ✓        | ``                   |     |
| 47  | `allocation_rule`        | `varchar(20)`              | ✓        | ``                   |     |
| 48  | `driver_share_percent`   | `integer`                  | ✓        | ``                   |     |
| 49  | `fleet_share_percent`    | `integer`                  | ✓        | ``                   |     |
| 50  | `client_share_percent`   | `integer`                  | ✓        | ``                   |     |
| 51  | `cost_center_id`         | `uuid`                     | ✓        | ``                   |     |
| 52  | `payment_batch_id`       | `uuid`                     | ✓        | ``                   |     |
| 53  | `payment_status`         | `varchar(20)`              | ✓        | ``                   |     |
| 54  | `payment_date`           | `date`                     | ✓        | ``                   |     |
| 55  | `payment_reference`      | `text`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column                | References                  | On Update | On Delete |
| --------------------- | --------------------------- | --------- | --------- |
| `approved_by`         | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `created_by`          | `adm_members.id`            | CASCADE   | SET NULL  |
| `created_by`          | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `deleted_by`          | `adm_members.id`            | CASCADE   | SET NULL  |
| `deleted_by`          | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `driver_id`           | `rid_drivers.id`            | NO ACTION | NO ACTION |
| `driver_id`           | `rid_drivers.id`            | NO ACTION | SET NULL  |
| `receipt_verified_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `ride_id`             | `trp_trips.id`              | NO ACTION | SET NULL  |
| `tenant_id`           | `adm_tenants.id`            | NO ACTION | CASCADE   |
| `tenant_id`           | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `updated_by`          | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `updated_by`          | `adm_members.id`            | CASCADE   | SET NULL  |
| `vehicle_id`          | `flt_vehicles.id`           | CASCADE   | CASCADE   |
| `vehicle_id`          | `flt_vehicles.id`           | NO ACTION | NO ACTION |

#### Indexes

- **`flt_vehicle_expenses_created_at_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_created_at_idx ON public.flt_vehicle_expenses USING btree (created_at DESC)
  ```
- **`flt_vehicle_expenses_created_by_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_created_by_idx ON public.flt_vehicle_expenses USING btree (created_by)
  ```
- **`flt_vehicle_expenses_deleted_at_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_deleted_at_idx ON public.flt_vehicle_expenses USING btree (deleted_at)
  ```
- **`flt_vehicle_expenses_driver_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_driver_id_idx ON public.flt_vehicle_expenses USING btree (driver_id)
  ```
- **`flt_vehicle_expenses_expense_category_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_expense_category_idx ON public.flt_vehicle_expenses USING btree (expense_category)
  ```
- **`flt_vehicle_expenses_expense_date_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_expense_date_idx ON public.flt_vehicle_expenses USING btree (expense_date)
  ```
- **`flt_vehicle_expenses_metadata_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_metadata_idx ON public.flt_vehicle_expenses USING gin (metadata)
  ```
- **`flt_vehicle_expenses_pkey`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicle_expenses_pkey ON public.flt_vehicle_expenses USING btree (id)
  ```
- **`flt_vehicle_expenses_reimbursed_active_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_reimbursed_active_idx ON public.flt_vehicle_expenses USING btree (reimbursed) WHERE (deleted_at IS NULL)
  ```
- **`flt_vehicle_expenses_reimbursed_pending_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_reimbursed_pending_idx ON public.flt_vehicle_expenses USING btree (reimbursed) WHERE ((deleted_at IS NULL) AND (reimbursed = false))
  ```
- **`flt_vehicle_expenses_ride_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_ride_id_idx ON public.flt_vehicle_expenses USING btree (ride_id)
  ```
- **`flt_vehicle_expenses_tenant_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_tenant_id_idx ON public.flt_vehicle_expenses USING btree (tenant_id)
  ```
- **`flt_vehicle_expenses_updated_by_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_updated_by_idx ON public.flt_vehicle_expenses USING btree (updated_by)
  ```
- **`flt_vehicle_expenses_vehicle_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_expenses_vehicle_id_idx ON public.flt_vehicle_expenses USING btree (vehicle_id)
  ```
- **`idx_flt_vehicle_expenses_expense_category_active`**
  ```sql
  CREATE INDEX idx_flt_vehicle_expenses_expense_category_active ON public.flt_vehicle_expenses USING btree (expense_category) WHERE (deleted_at IS NULL)
  ```
- **`idx_flt_vehicle_expenses_vehicle_id`**
  ```sql
  CREATE INDEX idx_flt_vehicle_expenses_vehicle_id ON public.flt_vehicle_expenses USING btree (vehicle_id) WHERE (deleted_at IS NULL)
  ```

---

### 62. `flt_vehicle_inspections`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                 | Type                       | Nullable | Default             | PK  |
| --- | ---------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                   | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`            | `uuid`                     | ✗        | ``                  |     |
| 3   | `vehicle_id`           | `uuid`                     | ✗        | ``                  |     |
| 4   | `inspection_type`      | `varchar(50)`              | ✗        | ``                  |     |
| 5   | `scheduled_date`       | `date`                     | ✗        | ``                  |     |
| 6   | `actual_date`          | `date`                     | ✓        | ``                  |     |
| 7   | `status`               | `varchar(20)`              | ✗        | ``                  |     |
| 8   | `passed`               | `boolean`                  | ✓        | `false`             |     |
| 9   | `score`                | `integer`                  | ✓        | ``                  |     |
| 10  | `inspector_name`       | `varchar(100)`             | ✓        | ``                  |     |
| 11  | `inspection_center`    | `varchar(200)`             | ✓        | ``                  |     |
| 12  | `certificate_number`   | `varchar(100)`             | ✓        | ``                  |     |
| 13  | `expiry_date`          | `date`                     | ✓        | ``                  |     |
| 14  | `issues_found`         | `jsonb`                    | ✓        | ``                  |     |
| 15  | `corrective_actions`   | `jsonb`                    | ✓        | ``                  |     |
| 16  | `report_url`           | `text`                     | ✓        | ``                  |     |
| 17  | `certificate_url`      | `text`                     | ✓        | ``                  |     |
| 18  | `photos_urls`          | `jsonb`                    | ✓        | ``                  |     |
| 19  | `cost_amount`          | `numeric`                  | ✓        | ``                  |     |
| 20  | `currency`             | `char(3)`                  | ✓        | ``                  |     |
| 21  | `next_inspection_date` | `date`                     | ✓        | ``                  |     |
| 22  | `reminder_sent`        | `boolean`                  | ✓        | `false`             |     |
| 23  | `notes`                | `text`                     | ✓        | ``                  |     |
| 24  | `metadata`             | `jsonb`                    | ✓        | ``                  |     |
| 25  | `created_at`           | `timestamp with time zone` | ✓        | `now()`             |     |
| 26  | `updated_at`           | `timestamp with time zone` | ✓        | `now()`             |     |
| 27  | `created_by`           | `uuid`                     | ✗        | ``                  |     |
| 28  | `updated_by`           | `uuid`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `tenant_id`  | `adm_tenants.id`            | NO ACTION | CASCADE   |
| `updated_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `vehicle_id` | `flt_vehicles.id`           | NO ACTION | NO ACTION |

#### Indexes

- **`flt_vehicle_inspections_pkey`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicle_inspections_pkey ON public.flt_vehicle_inspections USING btree (id)
  ```
- **`idx_flt_vehicle_inspections_scheduled_date`**
  ```sql
  CREATE INDEX idx_flt_vehicle_inspections_scheduled_date ON public.flt_vehicle_inspections USING btree (scheduled_date)
  ```
- **`idx_flt_vehicle_inspections_status`**
  ```sql
  CREATE INDEX idx_flt_vehicle_inspections_status ON public.flt_vehicle_inspections USING btree (status)
  ```
- **`idx_flt_vehicle_inspections_tenant_id`**
  ```sql
  CREATE INDEX idx_flt_vehicle_inspections_tenant_id ON public.flt_vehicle_inspections USING btree (tenant_id)
  ```
- **`idx_flt_vehicle_inspections_vehicle_id`**
  ```sql
  CREATE INDEX idx_flt_vehicle_inspections_vehicle_id ON public.flt_vehicle_inspections USING btree (vehicle_id)
  ```

---

### 63. `flt_vehicle_insurances`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                 | Type                       | Nullable | Default                       | PK  |
| --- | ---------------------- | -------------------------- | -------- | ----------------------------- | --- |
| 1   | `id`                   | `uuid`                     | ✗        | `uuid_generate_v4()`          | 🔑  |
| 2   | `tenant_id`            | `uuid`                     | ✗        | ``                            |     |
| 3   | `vehicle_id`           | `uuid`                     | ✗        | ``                            |     |
| 4   | `provider_name`        | `text`                     | ✗        | ``                            |     |
| 5   | `policy_number`        | `text`                     | ✗        | ``                            |     |
| 6   | `policy_type`          | `text`                     | ✗        | ``                            |     |
| 7   | `coverage_amount`      | `numeric`                  | ✓        | ``                            |     |
| 8   | `currency`             | `char(3)`                  | ✗        | `'EUR'::bpchar`               |     |
| 9   | `deductible_amount`    | `numeric`                  | ✓        | ``                            |     |
| 10  | `premium_amount`       | `numeric`                  | ✗        | ``                            |     |
| 11  | `premium_frequency`    | `text`                     | ✗        | `'annual'::character varying` |     |
| 12  | `start_date`           | `date`                     | ✗        | ``                            |     |
| 13  | `end_date`             | `date`                     | ✗        | ``                            |     |
| 14  | `is_active`            | `boolean`                  | ✗        | `true`                        |     |
| 15  | `auto_renew`           | `boolean`                  | ✗        | `false`                       |     |
| 16  | `contact_name`         | `text`                     | ✓        | ``                            |     |
| 17  | `contact_phone`        | `text`                     | ✓        | ``                            |     |
| 18  | `contact_email`        | `text`                     | ✓        | ``                            |     |
| 19  | `document_url`         | `text`                     | ✓        | ``                            |     |
| 20  | `claim_count`          | `integer`                  | ✗        | `0`                           |     |
| 21  | `last_claim_date`      | `date`                     | ✓        | ``                            |     |
| 22  | `notes`                | `text`                     | ✓        | ``                            |     |
| 23  | `metadata`             | `jsonb`                    | ✗        | `'{}'::jsonb`                 |     |
| 24  | `created_at`           | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`           |     |
| 25  | `created_by`           | `uuid`                     | ✓        | ``                            |     |
| 26  | `updated_at`           | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`           |     |
| 27  | `updated_by`           | `uuid`                     | ✓        | ``                            |     |
| 28  | `deleted_at`           | `timestamp with time zone` | ✓        | ``                            |     |
| 29  | `deleted_by`           | `uuid`                     | ✓        | ``                            |     |
| 30  | `deletion_reason`      | `text`                     | ✓        | ``                            |     |
| 31  | `policy_category`      | `varchar(20)`              | ✓        | ``                            |     |
| 32  | `policy_priority`      | `integer`                  | ✓        | ``                            |     |
| 33  | `parent_policy_id`     | `uuid`                     | ✓        | ``                            |     |
| 34  | `coverage_territories` | `ARRAY`                    | ✓        | ``                            |     |
| 35  | `coverage_drivers`     | `varchar(20)`              | ✓        | ``                            |     |
| 36  | `driver_restrictions`  | `jsonb`                    | ✓        | ``                            |     |
| 37  | `vehicle_usage`        | `varchar(20)`              | ✓        | ``                            |     |
| 38  | `base_premium`         | `numeric`                  | ✓        | ``                            |     |
| 39  | `excess_details`       | `jsonb`                    | ✓        | ``                            |     |
| 40  | `no_claims_years`      | `integer`                  | ✓        | `0`                           |     |
| 41  | `no_claims_bonus`      | `integer`                  | ✓        | `0`                           |     |
| 42  | `claims_loading`       | `integer`                  | ✓        | `0`                           |     |
| 43  | `claims_count`         | `integer`                  | ✓        | `0`                           |     |
| 44  | `claims_detail`        | `jsonb`                    | ✓        | ``                            |     |
| 45  | `total_claims_amount`  | `numeric`                  | ✓        | ``                            |     |
| 46  | `claims_ratio`         | `numeric`                  | ✓        | ``                            |     |
| 47  | `risk_rating`          | `varchar(10)`              | ✓        | ``                            |     |
| 48  | `risk_factors`         | `jsonb`                    | ✓        | ``                            |     |
| 49  | `special_conditions`   | `jsonb`                    | ✓        | ``                            |     |
| 50  | `exclusions`           | `jsonb`                    | ✓        | ``                            |     |
| 51  | `broker_id`            | `uuid`                     | ✓        | ``                            |     |
| 52  | `broker_commission`    | `numeric`                  | ✓        | ``                            |     |
| 53  | `broker_reference`     | `text`                     | ✓        | ``                            |     |
| 54  | `renewal_date`         | `date`                     | ✓        | ``                            |     |
| 55  | `renewal_notice_sent`  | `boolean`                  | ✓        | `false`                       |     |
| 56  | `renewal_quote`        | `numeric`                  | ✓        | ``                            |     |
| 57  | `competitor_quotes`    | `jsonb`                    | ✓        | ``                            |     |
| 58  | `payment_frequency`    | `varchar(20)`              | ✓        | ``                            |     |
| 59  | `payment_method`       | `varchar(20)`              | ✓        | ``                            |     |
| 60  | `payment_schedule`     | `jsonb`                    | ✓        | ``                            |     |
| 61  | `next_payment_date`    | `date`                     | ✓        | ``                            |     |
| 62  | `outstanding_amount`   | `numeric`                  | ✓        | ``                            |     |
| 63  | `co_insurance`         | `boolean`                  | ✓        | `false`                       |     |
| 64  | `co_insurers`          | `jsonb`                    | ✓        | ``                            |     |
| 65  | `lead_insurer`         | `varchar(200)`             | ✓        | ``                            |     |

#### Foreign Keys

| Column             | References                  | On Update | On Delete |
| ------------------ | --------------------------- | --------- | --------- |
| `created_by`       | `adm_members.id`            | CASCADE   | SET NULL  |
| `created_by`       | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `deleted_by`       | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `deleted_by`       | `adm_members.id`            | CASCADE   | SET NULL  |
| `parent_policy_id` | `flt_vehicle_insurances.id` | NO ACTION | NO ACTION |
| `tenant_id`        | `adm_tenants.id`            | NO ACTION | CASCADE   |
| `tenant_id`        | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `updated_by`       | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `updated_by`       | `adm_members.id`            | CASCADE   | SET NULL  |
| `vehicle_id`       | `flt_vehicles.id`           | CASCADE   | CASCADE   |
| `vehicle_id`       | `flt_vehicles.id`           | NO ACTION | NO ACTION |

#### Indexes

- **`flt_vehicle_insurances_created_at_idx`**
  ```sql
  CREATE INDEX flt_vehicle_insurances_created_at_idx ON public.flt_vehicle_insurances USING btree (created_at DESC)
  ```
- **`flt_vehicle_insurances_end_date_active_idx`**
  ```sql
  CREATE INDEX flt_vehicle_insurances_end_date_active_idx ON public.flt_vehicle_insurances USING btree (end_date) WHERE ((deleted_at IS NULL) AND (is_active = true))
  ```
- **`flt_vehicle_insurances_is_active_active_idx`**
  ```sql
  CREATE INDEX flt_vehicle_insurances_is_active_active_idx ON public.flt_vehicle_insurances USING btree (is_active) WHERE (deleted_at IS NULL)
  ```
- **`flt_vehicle_insurances_is_active_idx`**
  ```sql
  CREATE INDEX flt_vehicle_insurances_is_active_idx ON public.flt_vehicle_insurances USING btree (is_active) WHERE (deleted_at IS NULL)
  ```
- **`flt_vehicle_insurances_metadata_idx`**
  ```sql
  CREATE INDEX flt_vehicle_insurances_metadata_idx ON public.flt_vehicle_insurances USING gin (metadata)
  ```
- **`flt_vehicle_insurances_pkey`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicle_insurances_pkey ON public.flt_vehicle_insurances USING btree (id)
  ```
- **`flt_vehicle_insurances_policy_number_idx`**
  ```sql
  CREATE INDEX flt_vehicle_insurances_policy_number_idx ON public.flt_vehicle_insurances USING btree (policy_number)
  ```
- **`flt_vehicle_insurances_policy_type_idx`**
  ```sql
  CREATE INDEX flt_vehicle_insurances_policy_type_idx ON public.flt_vehicle_insurances USING btree (policy_type)
  ```
- **`flt_vehicle_insurances_tenant_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_insurances_tenant_id_idx ON public.flt_vehicle_insurances USING btree (tenant_id)
  ```
- **`flt_vehicle_insurances_tenant_policy_uq`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicle_insurances_tenant_policy_uq ON public.flt_vehicle_insurances USING btree (tenant_id, policy_number) WHERE (deleted_at IS NULL)
  ```
- **`flt_vehicle_insurances_vehicle_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_insurances_vehicle_id_idx ON public.flt_vehicle_insurances USING btree (vehicle_id)
  ```
- **`idx_flt_vehicle_insurances_vehicle_id`**
  ```sql
  CREATE INDEX idx_flt_vehicle_insurances_vehicle_id ON public.flt_vehicle_insurances USING btree (vehicle_id) WHERE (deleted_at IS NULL)
  ```

---

### 64. `flt_vehicle_maintenance`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                   | Type                       | Nullable | Default                          | PK  |
| --- | ------------------------ | -------------------------- | -------- | -------------------------------- | --- |
| 1   | `id`                     | `uuid`                     | ✗        | `uuid_generate_v4()`             | 🔑  |
| 2   | `tenant_id`              | `uuid`                     | ✗        | ``                               |     |
| 3   | `vehicle_id`             | `uuid`                     | ✗        | ``                               |     |
| 4   | `maintenance_type`       | `text`                     | ✗        | ``                               |     |
| 5   | `scheduled_date`         | `date`                     | ✗        | ``                               |     |
| 6   | `completed_date`         | `date`                     | ✓        | ``                               |     |
| 7   | `odometer_reading`       | `integer`                  | ✓        | ``                               |     |
| 8   | `next_service_km`        | `integer`                  | ✓        | ``                               |     |
| 9   | `next_service_date`      | `date`                     | ✓        | ``                               |     |
| 10  | `provider_name`          | `text`                     | ✓        | ``                               |     |
| 11  | `provider_contact`       | `text`                     | ✓        | ``                               |     |
| 12  | `cost_amount`            | `numeric`                  | ✓        | ``                               |     |
| 13  | `currency`               | `char(3)`                  | ✗        | `'EUR'::bpchar`                  |     |
| 14  | `invoice_reference`      | `text`                     | ✓        | ``                               |     |
| 15  | `parts_replaced`         | `text`                     | ✓        | ``                               |     |
| 16  | `notes`                  | `text`                     | ✓        | ``                               |     |
| 17  | `status`                 | `text`                     | ✗        | `'scheduled'::character varying` |     |
| 18  | `metadata`               | `jsonb`                    | ✗        | `'{}'::jsonb`                    |     |
| 19  | `created_at`             | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`              |     |
| 20  | `created_by`             | `uuid`                     | ✓        | ``                               |     |
| 21  | `updated_at`             | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`              |     |
| 22  | `updated_by`             | `uuid`                     | ✓        | ``                               |     |
| 26  | `actual_start`           | `timestamp with time zone` | ✓        | ``                               |     |
| 27  | `actual_end`             | `timestamp with time zone` | ✓        | ``                               |     |
| 28  | `maintenance_category`   | `varchar(20)`              | ✓        | ``                               |     |
| 29  | `priority`               | `varchar(20)`              | ✓        | ``                               |     |
| 30  | `regulatory_requirement` | `boolean`                  | ✓        | `false`                          |     |
| 31  | `blocking_vehicle`       | `boolean`                  | ✓        | `false`                          |     |
| 32  | `warranty_covered`       | `boolean`                  | ✓        | `false`                          |     |
| 33  | `warranty_claim_number`  | `text`                     | ✓        | ``                               |     |
| 34  | `warranty_amount`        | `numeric`                  | ✓        | ``                               |     |
| 35  | `insurance_covered`      | `boolean`                  | ✓        | `false`                          |     |
| 36  | `insurance_claim_ref`    | `text`                     | ✓        | ``                               |     |
| 37  | `requested_by`           | `uuid`                     | ✓        | ``                               |     |
| 38  | `requested_at`           | `timestamp with time zone` | ✓        | ``                               |     |
| 39  | `approved_by`            | `uuid`                     | ✓        | ``                               |     |
| 40  | `approved_at`            | `timestamp with time zone` | ✓        | ``                               |     |
| 41  | `approval_notes`         | `text`                     | ✓        | ``                               |     |
| 42  | `labor_hours`            | `numeric`                  | ✓        | ``                               |     |
| 43  | `labor_rate`             | `numeric`                  | ✓        | ``                               |     |
| 44  | `labor_cost`             | `numeric`                  | ✓        | ``                               |     |
| 45  | `parts_cost`             | `numeric`                  | ✓        | ``                               |     |
| 46  | `other_costs`            | `numeric`                  | ✓        | ``                               |     |
| 47  | `tax_amount`             | `numeric`                  | ✓        | ``                               |     |
| 48  | `total_cost_excl_tax`    | `numeric`                  | ✓        | ``                               |     |
| 49  | `total_cost_incl_tax`    | `numeric`                  | ✓        | ``                               |     |
| 50  | `parts_detail`           | `jsonb`                    | ✓        | ``                               |     |
| 51  | `garage_id`              | `uuid`                     | ✓        | ``                               |     |
| 52  | `work_order_number`      | `text`                     | ✓        | ``                               |     |
| 53  | `mechanic_name`          | `text`                     | ✓        | ``                               |     |
| 54  | `mechanic_certification` | `text`                     | ✓        | ``                               |     |
| 55  | `quality_check_by`       | `uuid`                     | ✓        | ``                               |     |
| 56  | `quality_check_at`       | `timestamp with time zone` | ✓        | ``                               |     |
| 57  | `blocked_periods`        | `jsonb`                    | ✓        | ``                               |     |
| 58  | `deleted_at`             | `timestamp with time zone` | ✓        | ``                               |     |
| 59  | `deleted_by`             | `uuid`                     | ✓        | ``                               |     |
| 60  | `deletion_reason`        | `text`                     | ✓        | ``                               |     |

#### Foreign Keys

| Column             | References                  | On Update | On Delete |
| ------------------ | --------------------------- | --------- | --------- |
| `approved_by`      | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `created_by`       | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `created_by`       | `adm_members.id`            | CASCADE   | SET NULL  |
| `deleted_by`       | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `quality_check_by` | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `requested_by`     | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `tenant_id`        | `adm_tenants.id`            | NO ACTION | CASCADE   |
| `tenant_id`        | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `updated_by`       | `adm_provider_employees.id` | NO ACTION | NO ACTION |
| `updated_by`       | `adm_members.id`            | CASCADE   | SET NULL  |
| `vehicle_id`       | `flt_vehicles.id`           | CASCADE   | CASCADE   |
| `vehicle_id`       | `flt_vehicles.id`           | NO ACTION | NO ACTION |

#### Indexes

- **`flt_vehicle_maintenance_created_at_idx`**
  ```sql
  CREATE INDEX flt_vehicle_maintenance_created_at_idx ON public.flt_vehicle_maintenance USING btree (created_at DESC)
  ```
- **`flt_vehicle_maintenance_created_by_idx`**
  ```sql
  CREATE INDEX flt_vehicle_maintenance_created_by_idx ON public.flt_vehicle_maintenance USING btree (created_by)
  ```
- **`flt_vehicle_maintenance_maintenance_type_idx`**
  ```sql
  CREATE INDEX flt_vehicle_maintenance_maintenance_type_idx ON public.flt_vehicle_maintenance USING btree (maintenance_type)
  ```
- **`flt_vehicle_maintenance_metadata_idx`**
  ```sql
  CREATE INDEX flt_vehicle_maintenance_metadata_idx ON public.flt_vehicle_maintenance USING gin (metadata)
  ```
- **`flt_vehicle_maintenance_next_service_idx`**
  ```sql
  CREATE INDEX flt_vehicle_maintenance_next_service_idx ON public.flt_vehicle_maintenance USING btree (next_service_date) WHERE (status = 'completed'::text)
  ```
- **`flt_vehicle_maintenance_pkey`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicle_maintenance_pkey ON public.flt_vehicle_maintenance USING btree (id)
  ```
- **`flt_vehicle_maintenance_scheduled_date_active_idx`**
  ```sql
  CREATE INDEX flt_vehicle_maintenance_scheduled_date_active_idx ON public.flt_vehicle_maintenance USING btree (scheduled_date)
  ```
- **`flt_vehicle_maintenance_status_active_idx`**
  ```sql
  CREATE INDEX flt_vehicle_maintenance_status_active_idx ON public.flt_vehicle_maintenance USING btree (status)
  ```
- **`flt_vehicle_maintenance_tenant_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_maintenance_tenant_id_idx ON public.flt_vehicle_maintenance USING btree (tenant_id)
  ```
- **`flt_vehicle_maintenance_updated_by_idx`**
  ```sql
  CREATE INDEX flt_vehicle_maintenance_updated_by_idx ON public.flt_vehicle_maintenance USING btree (updated_by)
  ```
- **`flt_vehicle_maintenance_vehicle_id_idx`**
  ```sql
  CREATE INDEX flt_vehicle_maintenance_vehicle_id_idx ON public.flt_vehicle_maintenance USING btree (vehicle_id)
  ```
- **`idx_flt_vehicle_maintenance_vehicle_id`**
  ```sql
  CREATE INDEX idx_flt_vehicle_maintenance_vehicle_id ON public.flt_vehicle_maintenance USING btree (vehicle_id) WHERE (deleted_at IS NULL)
  ```

---

### 65. `flt_vehicles`

**Rows**: 1 live, 9 dead

#### Columns

| #   | Column                          | Type                       | Nullable | Default                        | PK  |
| --- | ------------------------------- | -------------------------- | -------- | ------------------------------ | --- |
| 1   | `id`                            | `uuid`                     | ✗        | `uuid_generate_v4()`           | 🔑  |
| 2   | `tenant_id`                     | `uuid`                     | ✗        | ``                             |     |
| 3   | `make_id`                       | `uuid`                     | ✗        | ``                             |     |
| 4   | `model_id`                      | `uuid`                     | ✗        | ``                             |     |
| 5   | `license_plate`                 | `text`                     | ✗        | ``                             |     |
| 6   | `vin`                           | `text`                     | ✓        | ``                             |     |
| 7   | `year`                          | `integer`                  | ✗        | ``                             |     |
| 8   | `color`                         | `text`                     | ✓        | ``                             |     |
| 9   | `seats`                         | `integer`                  | ✗        | `4`                            |     |
| 10  | `vehicle_class`                 | `text`                     | ✓        | ``                             |     |
| 11  | `fuel_type`                     | `text`                     | ✓        | ``                             |     |
| 12  | `transmission`                  | `text`                     | ✓        | ``                             |     |
| 13  | `registration_date`             | `date`                     | ✓        | ``                             |     |
| 14  | `insurance_number`              | `text`                     | ✓        | ``                             |     |
| 15  | `insurance_expiry`              | `date`                     | ✓        | ``                             |     |
| 16  | `last_inspection`               | `date`                     | ✓        | ``                             |     |
| 17  | `next_inspection`               | `date`                     | ✓        | ``                             |     |
| 18  | `odometer`                      | `integer`                  | ✓        | ``                             |     |
| 19  | `ownership_type`                | `text`                     | ✗        | `'owned'::character varying`   |     |
| 20  | `metadata`                      | `jsonb`                    | ✗        | `'{}'::jsonb`                  |     |
| 21  | `status`                        | `text`                     | ✗        | `'pending'::character varying` |     |
| 22  | `created_at`                    | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`            |     |
| 23  | `created_by`                    | `uuid`                     | ✓        | ``                             |     |
| 24  | `updated_at`                    | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`            |     |
| 25  | `updated_by`                    | `uuid`                     | ✓        | ``                             |     |
| 26  | `deleted_at`                    | `timestamp with time zone` | ✓        | ``                             |     |
| 27  | `deleted_by`                    | `uuid`                     | ✓        | ``                             |     |
| 28  | `deletion_reason`               | `text`                     | ✓        | ``                             |     |
| 29  | `country_code`                  | `char(2)`                  | ✓        | ``                             |     |
| 30  | `requires_professional_license` | `boolean`                  | ✓        | `false`                        |     |
| 31  | `documents_status`              | `jsonb`                    | ✓        | ``                             |     |
| 32  | `body_type`                     | `varchar(20)`              | ✓        | ``                             |     |
| 33  | `passenger_capacity`            | `integer`                  | ✓        | ``                             |     |
| 34  | `car_length_cm`                 | `integer`                  | ✓        | ``                             |     |
| 35  | `car_width_cm`                  | `integer`                  | ✓        | ``                             |     |
| 36  | `car_height_cm`                 | `integer`                  | ✓        | ``                             |     |
| 37  | `vehicle_class_id`              | `uuid`                     | ✓        | ``                             |     |
| 38  | `first_registration_date`       | `date`                     | ✓        | ``                             |     |
| 39  | `warranty_expiry`               | `date`                     | ✓        | ``                             |     |
| 40  | `service_interval_km`           | `integer`                  | ✓        | ``                             |     |
| 41  | `next_service_at_km`            | `integer`                  | ✓        | ``                             |     |
| 42  | `insurance_policy_number`       | `text`                     | ✓        | ``                             |     |
| 43  | `insurance_coverage_type`       | `text`                     | ✓        | ``                             |     |
| 44  | `insurance_amount`              | `numeric`                  | ✓        | ``                             |     |
| 45  | `insurance_issue_date`          | `date`                     | ✓        | ``                             |     |
| 46  | `ownership_type_id`             | `uuid`                     | ✓        | ``                             |     |
| 47  | `owner_id`                      | `uuid`                     | ✓        | ``                             |     |
| 48  | `acquisition_date`              | `date`                     | ✓        | ``                             |     |
| 49  | `lease_end_date`                | `date`                     | ✓        | ``                             |     |
| 50  | `residual_value`                | `numeric`                  | ✓        | ``                             |     |
| 51  | `status_id`                     | `uuid`                     | ✓        | ``                             |     |
| 52  | `status_changed_at`             | `timestamp with time zone` | ✓        | ``                             |     |

#### Foreign Keys

| Column              | References                             | On Update | On Delete |
| ------------------- | -------------------------------------- | --------- | --------- |
| `country_code`      | `dir_country_regulations.country_code` | NO ACTION | NO ACTION |
| `created_by`        | `adm_members.id`                       | CASCADE   | SET NULL  |
| `created_by`        | `adm_provider_employees.id`            | NO ACTION | NO ACTION |
| `deleted_by`        | `adm_members.id`                       | CASCADE   | SET NULL  |
| `deleted_by`        | `adm_provider_employees.id`            | NO ACTION | NO ACTION |
| `make_id`           | `dir_car_makes.id`                     | NO ACTION | NO ACTION |
| `make_id`           | `dir_car_makes.id`                     | CASCADE   | RESTRICT  |
| `model_id`          | `dir_car_models.id`                    | CASCADE   | RESTRICT  |
| `model_id`          | `dir_car_models.id`                    | NO ACTION | NO ACTION |
| `ownership_type_id` | `dir_ownership_types.id`               | NO ACTION | NO ACTION |
| `status_id`         | `dir_vehicle_statuses.id`              | NO ACTION | NO ACTION |
| `tenant_id`         | `adm_tenants.id`                       | NO ACTION | CASCADE   |
| `tenant_id`         | `adm_tenants.id`                       | CASCADE   | CASCADE   |
| `updated_by`        | `adm_members.id`                       | CASCADE   | SET NULL  |
| `updated_by`        | `adm_provider_employees.id`            | NO ACTION | NO ACTION |
| `vehicle_class_id`  | `dir_vehicle_classes.id`               | NO ACTION | NO ACTION |

#### Indexes

- **`flt_vehicles_created_by_idx`**
  ```sql
  CREATE INDEX flt_vehicles_created_by_idx ON public.flt_vehicles USING btree (created_by)
  ```
- **`flt_vehicles_deleted_at_idx`**
  ```sql
  CREATE INDEX flt_vehicles_deleted_at_idx ON public.flt_vehicles USING btree (deleted_at)
  ```
- **`flt_vehicles_license_plate_idx`**
  ```sql
  CREATE INDEX flt_vehicles_license_plate_idx ON public.flt_vehicles USING btree (license_plate)
  ```
- **`flt_vehicles_make_id_idx`**
  ```sql
  CREATE INDEX flt_vehicles_make_id_idx ON public.flt_vehicles USING btree (make_id)
  ```
- **`flt_vehicles_metadata_idx`**
  ```sql
  CREATE INDEX flt_vehicles_metadata_idx ON public.flt_vehicles USING gin (metadata)
  ```
- **`flt_vehicles_model_id_idx`**
  ```sql
  CREATE INDEX flt_vehicles_model_id_idx ON public.flt_vehicles USING btree (model_id)
  ```
- **`flt_vehicles_next_inspection_idx`**
  ```sql
  CREATE INDEX flt_vehicles_next_inspection_idx ON public.flt_vehicles USING btree (next_inspection)
  ```
- **`flt_vehicles_pkey`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicles_pkey ON public.flt_vehicles USING btree (id)
  ```
- **`flt_vehicles_status_active_idx`**
  ```sql
  CREATE INDEX flt_vehicles_status_active_idx ON public.flt_vehicles USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`flt_vehicles_tenant_id_idx`**
  ```sql
  CREATE INDEX flt_vehicles_tenant_id_idx ON public.flt_vehicles USING btree (tenant_id)
  ```
- **`flt_vehicles_tenant_plate_uq`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicles_tenant_plate_uq ON public.flt_vehicles USING btree (tenant_id, license_plate) WHERE (deleted_at IS NULL)
  ```
- **`flt_vehicles_tenant_vin_uq`**
  ```sql
  CREATE UNIQUE INDEX flt_vehicles_tenant_vin_uq ON public.flt_vehicles USING btree (tenant_id, vin) WHERE ((deleted_at IS NULL) AND (vin IS NOT NULL))
  ```
- **`flt_vehicles_updated_by_idx`**
  ```sql
  CREATE INDEX flt_vehicles_updated_by_idx ON public.flt_vehicles USING btree (updated_by)
  ```
- **`flt_vehicles_vin_idx`**
  ```sql
  CREATE INDEX flt_vehicles_vin_idx ON public.flt_vehicles USING btree (vin)
  ```
- **`idx_flt_vehicles_metadata`**
  ```sql
  CREATE INDEX idx_flt_vehicles_metadata ON public.flt_vehicles USING gin (metadata)
  ```
- **`idx_flt_vehicles_owner`**
  ```sql
  CREATE INDEX idx_flt_vehicles_owner ON public.flt_vehicles USING btree (owner_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_flt_vehicles_tenant`**
  ```sql
  CREATE INDEX idx_flt_vehicles_tenant ON public.flt_vehicles USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_flt_vehicles_tenant_status`**
  ```sql
  CREATE INDEX idx_flt_vehicles_tenant_status ON public.flt_vehicles USING btree (tenant_id, status) WHERE (deleted_at IS NULL)
  ```
- **`idx_flt_vehicles_tenant_vin_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_flt_vehicles_tenant_vin_unique ON public.flt_vehicles USING btree (tenant_id, vin) WHERE ((deleted_at IS NULL) AND (vin IS NOT NULL))
  ```
- **`idx_flt_vehicles_vin`**
  ```sql
  CREATE UNIQUE INDEX idx_flt_vehicles_vin ON public.flt_vehicles USING btree (vin) WHERE (deleted_at IS NULL)
  ```

---

### 66. `rev_driver_revenues`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type                         | Nullable | Default                            | PK  |
| --- | ------------------- | ---------------------------- | -------- | ---------------------------------- | --- |
| 1   | `id`                | `uuid`                       | ✗        | `uuid_generate_v4()`               | 🔑  |
| 2   | `tenant_id`         | `uuid`                       | ✗        | ``                                 |     |
| 3   | `driver_id`         | `uuid`                       | ✗        | ``                                 |     |
| 4   | `period_start`      | `date`                       | ✗        | ``                                 |     |
| 5   | `period_end`        | `date`                       | ✗        | ``                                 |     |
| 6   | `total_revenue`     | `numeric`                    | ✗        | `0`                                |     |
| 7   | `commission_amount` | `numeric`                    | ✗        | `0`                                |     |
| 8   | `net_revenue`       | `numeric`                    | ✗        | `0`                                |     |
| 9   | `metadata`          | `jsonb`                      | ✗        | `'{}'::jsonb`                      |     |
| 10  | `created_at`        | `timestamp with time zone`   | ✗        | `now()`                            |     |
| 11  | `created_by`        | `uuid`                       | ✓        | ``                                 |     |
| 12  | `updated_at`        | `timestamp with time zone`   | ✗        | `now()`                            |     |
| 13  | `updated_by`        | `uuid`                       | ✓        | ``                                 |     |
| 14  | `deleted_at`        | `timestamp with time zone`   | ✓        | ``                                 |     |
| 15  | `deleted_by`        | `uuid`                       | ✓        | ``                                 |     |
| 16  | `deletion_reason`   | `text`                       | ✓        | ``                                 |     |
| 17  | `platform_id`       | `uuid`                       | ✓        | ``                                 |     |
| 18  | `period_type`       | `driver_revenue_period_type` | ✓        | ``                                 |     |
| 19  | `currency`          | `char(3)`                    | ✓        | ``                                 |     |
| 20  | `import_id`         | `uuid`                       | ✓        | ``                                 |     |
| 21  | `status`            | `driver_revenue_status`      | ✗        | `'pending'::driver_revenue_status` |     |
| 22  | `validated_by`      | `uuid`                       | ✓        | ``                                 |     |
| 23  | `validated_at`      | `timestamp with time zone`   | ✓        | ``                                 |     |
| 24  | `adjustment_reason` | `text`                       | ✓        | ``                                 |     |

#### Foreign Keys

| Column         | References               | On Update | On Delete |
| -------------- | ------------------------ | --------- | --------- |
| `created_by`   | `adm_members.id`         | CASCADE   | SET NULL  |
| `created_by`   | `adm_members.id`         | CASCADE   | SET NULL  |
| `deleted_by`   | `adm_members.id`         | CASCADE   | SET NULL  |
| `deleted_by`   | `adm_members.id`         | CASCADE   | SET NULL  |
| `driver_id`    | `rid_drivers.id`         | CASCADE   | CASCADE   |
| `driver_id`    | `rid_drivers.id`         | CASCADE   | RESTRICT  |
| `import_id`    | `rev_revenue_imports.id` | CASCADE   | RESTRICT  |
| `platform_id`  | `dir_platforms.id`       | CASCADE   | RESTRICT  |
| `tenant_id`    | `adm_tenants.id`         | CASCADE   | CASCADE   |
| `tenant_id`    | `adm_tenants.id`         | CASCADE   | CASCADE   |
| `updated_by`   | `adm_members.id`         | CASCADE   | SET NULL  |
| `updated_by`   | `adm_members.id`         | CASCADE   | SET NULL  |
| `validated_by` | `adm_members.id`         | CASCADE   | SET NULL  |

#### Indexes

- **`rev_driver_revenues_created_by_idx`**
  ```sql
  CREATE INDEX rev_driver_revenues_created_by_idx ON public.rev_driver_revenues USING btree (created_by)
  ```
- **`rev_driver_revenues_deleted_at_idx`**
  ```sql
  CREATE INDEX rev_driver_revenues_deleted_at_idx ON public.rev_driver_revenues USING btree (deleted_at)
  ```
- **`rev_driver_revenues_driver_id_idx`**
  ```sql
  CREATE INDEX rev_driver_revenues_driver_id_idx ON public.rev_driver_revenues USING btree (driver_id)
  ```
- **`rev_driver_revenues_metadata_idx`**
  ```sql
  CREATE INDEX rev_driver_revenues_metadata_idx ON public.rev_driver_revenues USING gin (metadata)
  ```
- **`rev_driver_revenues_period_end_idx`**
  ```sql
  CREATE INDEX rev_driver_revenues_period_end_idx ON public.rev_driver_revenues USING btree (period_end DESC)
  ```
- **`rev_driver_revenues_period_start_idx`**
  ```sql
  CREATE INDEX rev_driver_revenues_period_start_idx ON public.rev_driver_revenues USING btree (period_start DESC)
  ```
- **`rev_driver_revenues_pkey`**
  ```sql
  CREATE UNIQUE INDEX rev_driver_revenues_pkey ON public.rev_driver_revenues USING btree (id)
  ```
- **`rev_driver_revenues_tenant_id_driver_id_period_start_key`**
  ```sql
  CREATE UNIQUE INDEX rev_driver_revenues_tenant_id_driver_id_period_start_key ON public.rev_driver_revenues USING btree (tenant_id, driver_id, period_start) WHERE (deleted_at IS NULL)
  ```
- **`rev_driver_revenues_tenant_id_idx`**
  ```sql
  CREATE INDEX rev_driver_revenues_tenant_id_idx ON public.rev_driver_revenues USING btree (tenant_id)
  ```
- **`rev_driver_revenues_updated_by_idx`**
  ```sql
  CREATE INDEX rev_driver_revenues_updated_by_idx ON public.rev_driver_revenues USING btree (updated_by)
  ```

---

### 67. `rev_reconciliation_lines`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type      | Nullable | Default             | PK  |
| --- | ------------------- | --------- | -------- | ------------------- | --- |
| 1   | `id`                | `uuid`    | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `reconciliation_id` | `uuid`    | ✗        | ``                  |     |
| 3   | `driver_id`         | `uuid`    | ✓        | ``                  |     |
| 4   | `platform_id`       | `uuid`    | ✓        | ``                  |     |
| 5   | `expected_amount`   | `numeric` | ✗        | ``                  |     |
| 6   | `received_amount`   | `numeric` | ✗        | ``                  |     |
| 7   | `notes`             | `text`    | ✓        | ``                  |     |
| 8   | `metadata`          | `jsonb`   | ✓        | `'{}'::jsonb`       |     |

#### Foreign Keys

| Column              | References               | On Update | On Delete |
| ------------------- | ------------------------ | --------- | --------- |
| `driver_id`         | `rid_drivers.id`         | CASCADE   | RESTRICT  |
| `platform_id`       | `dir_platforms.id`       | CASCADE   | RESTRICT  |
| `reconciliation_id` | `rev_reconciliations.id` | CASCADE   | CASCADE   |

#### Indexes

- **`rev_reconciliation_lines_pkey`**
  ```sql
  CREATE UNIQUE INDEX rev_reconciliation_lines_pkey ON public.rev_reconciliation_lines USING btree (id)
  ```

---

### 68. `rev_reconciliations`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                | Type                       | Nullable | Default              | PK  |
| --- | --------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                  | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`           | `uuid`                     | ✗        | ``                   |     |
| 3   | `import_id`           | `uuid`                     | ✗        | ``                   |     |
| 4   | `reconciliation_date` | `date`                     | ✗        | ``                   |     |
| 5   | `status`              | `text`                     | ✗        | `'pending'::text`    |     |
| 6   | `notes`               | `text`                     | ✓        | ``                   |     |
| 7   | `metadata`            | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 8   | `created_at`          | `timestamp with time zone` | ✗        | `now()`              |     |
| 9   | `created_by`          | `uuid`                     | ✓        | ``                   |     |
| 10  | `updated_at`          | `timestamp with time zone` | ✗        | `now()`              |     |
| 11  | `updated_by`          | `uuid`                     | ✓        | ``                   |     |
| 12  | `deleted_at`          | `timestamp with time zone` | ✓        | ``                   |     |
| 13  | `deleted_by`          | `uuid`                     | ✓        | ``                   |     |
| 14  | `deletion_reason`     | `text`                     | ✓        | ``                   |     |
| 15  | `reconciliation_type` | `reconciliation_type`      | ✓        | ``                   |     |
| 16  | `expected_amount`     | `numeric`                  | ✓        | ``                   |     |
| 17  | `received_amount`     | `numeric`                  | ✓        | ``                   |     |
| 18  | `tolerance_amount`    | `numeric`                  | ✓        | ``                   |     |
| 19  | `currency`            | `char(3)`                  | ✓        | ``                   |     |
| 20  | `auto_matched`        | `boolean`                  | ✓        | `false`              |     |
| 21  | `assigned_to`         | `uuid`                     | ✓        | ``                   |     |
| 22  | `resolved_at`         | `timestamp with time zone` | ✓        | ``                   |     |
| 23  | `resolved_by`         | `uuid`                     | ✓        | ``                   |     |
| 24  | `resolution_notes`    | `text`                     | ✓        | ``                   |     |
| 25  | `requires_action`     | `boolean`                  | ✓        | `false`              |     |
| 26  | `driver_id`           | `uuid`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column        | References               | On Update | On Delete |
| ------------- | ------------------------ | --------- | --------- |
| `assigned_to` | `adm_members.id`         | CASCADE   | SET NULL  |
| `created_by`  | `adm_members.id`         | CASCADE   | SET NULL  |
| `created_by`  | `adm_members.id`         | CASCADE   | SET NULL  |
| `deleted_by`  | `adm_members.id`         | CASCADE   | SET NULL  |
| `deleted_by`  | `adm_members.id`         | CASCADE   | SET NULL  |
| `driver_id`   | `rid_drivers.id`         | CASCADE   | RESTRICT  |
| `import_id`   | `rev_revenue_imports.id` | CASCADE   | RESTRICT  |
| `import_id`   | `rev_revenue_imports.id` | CASCADE   | CASCADE   |
| `resolved_by` | `adm_members.id`         | CASCADE   | SET NULL  |
| `tenant_id`   | `adm_tenants.id`         | CASCADE   | CASCADE   |
| `tenant_id`   | `adm_tenants.id`         | CASCADE   | CASCADE   |
| `updated_by`  | `adm_members.id`         | CASCADE   | SET NULL  |
| `updated_by`  | `adm_members.id`         | CASCADE   | SET NULL  |

#### Indexes

- **`rev_reconciliations_created_by_idx`**
  ```sql
  CREATE INDEX rev_reconciliations_created_by_idx ON public.rev_reconciliations USING btree (created_by)
  ```
- **`rev_reconciliations_deleted_at_idx`**
  ```sql
  CREATE INDEX rev_reconciliations_deleted_at_idx ON public.rev_reconciliations USING btree (deleted_at)
  ```
- **`rev_reconciliations_import_id_idx`**
  ```sql
  CREATE INDEX rev_reconciliations_import_id_idx ON public.rev_reconciliations USING btree (import_id)
  ```
- **`rev_reconciliations_metadata_idx`**
  ```sql
  CREATE INDEX rev_reconciliations_metadata_idx ON public.rev_reconciliations USING gin (metadata)
  ```
- **`rev_reconciliations_pkey`**
  ```sql
  CREATE UNIQUE INDEX rev_reconciliations_pkey ON public.rev_reconciliations USING btree (id)
  ```
- **`rev_reconciliations_reconciliation_date_idx`**
  ```sql
  CREATE INDEX rev_reconciliations_reconciliation_date_idx ON public.rev_reconciliations USING btree (reconciliation_date DESC)
  ```
- **`rev_reconciliations_status_active_idx`**
  ```sql
  CREATE INDEX rev_reconciliations_status_active_idx ON public.rev_reconciliations USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`rev_reconciliations_tenant_id_idx`**
  ```sql
  CREATE INDEX rev_reconciliations_tenant_id_idx ON public.rev_reconciliations USING btree (tenant_id)
  ```
- **`rev_reconciliations_tenant_id_import_id_reconciliation_date_key`**
  ```sql
  CREATE UNIQUE INDEX rev_reconciliations_tenant_id_import_id_reconciliation_date_key ON public.rev_reconciliations USING btree (tenant_id, import_id, reconciliation_date) WHERE (deleted_at IS NULL)
  ```
- **`rev_reconciliations_updated_by_idx`**
  ```sql
  CREATE INDEX rev_reconciliations_updated_by_idx ON public.rev_reconciliations USING btree (updated_by)
  ```

---

### 69. `rev_revenue_imports`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                    | Type                         | Nullable | Default              | PK  |
| --- | ------------------------- | ---------------------------- | -------- | -------------------- | --- |
| 1   | `id`                      | `uuid`                       | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`               | `uuid`                       | ✗        | ``                   |     |
| 3   | `import_reference`        | `text`                       | ✗        | ``                   |     |
| 4   | `import_date`             | `date`                       | ✗        | ``                   |     |
| 5   | `status`                  | `text`                       | ✗        | `'pending'::text`    |     |
| 6   | `total_revenue`           | `numeric`                    | ✗        | `0`                  |     |
| 7   | `currency`                | `varchar(3)`                 | ✗        | ``                   |     |
| 8   | `metadata`                | `jsonb`                      | ✗        | `'{}'::jsonb`        |     |
| 9   | `created_at`              | `timestamp with time zone`   | ✗        | `now()`              |     |
| 10  | `created_by`              | `uuid`                       | ✓        | ``                   |     |
| 11  | `updated_at`              | `timestamp with time zone`   | ✗        | `now()`              |     |
| 12  | `updated_by`              | `uuid`                       | ✓        | ``                   |     |
| 13  | `deleted_at`              | `timestamp with time zone`   | ✓        | ``                   |     |
| 14  | `deleted_by`              | `uuid`                       | ✓        | ``                   |     |
| 15  | `deletion_reason`         | `text`                       | ✓        | ``                   |     |
| 16  | `platform_id`             | `uuid`                       | ✓        | ``                   |     |
| 17  | `source_type`             | `revenue_import_source_type` | ✓        | ``                   |     |
| 18  | `file_url`                | `text`                       | ✓        | ``                   |     |
| 19  | `source_currency`         | `char(3)`                    | ✓        | ``                   |     |
| 20  | `exchange_rate`           | `numeric`                    | ✓        | ``                   |     |
| 21  | `converted_amount`        | `numeric`                    | ✓        | ``                   |     |
| 22  | `rows_count`              | `integer`                    | ✓        | `0`                  |     |
| 23  | `errors_count`            | `integer`                    | ✓        | `0`                  |     |
| 24  | `warnings_count`          | `integer`                    | ✓        | `0`                  |     |
| 25  | `processing_started_at`   | `timestamp with time zone`   | ✓        | ``                   |     |
| 26  | `processing_completed_at` | `timestamp with time zone`   | ✓        | ``                   |     |
| 27  | `status_reason`           | `text`                       | ✓        | ``                   |     |
| 28  | `retry_count`             | `integer`                    | ✓        | `0`                  |     |
| 29  | `last_error`              | `text`                       | ✓        | ``                   |     |

#### Foreign Keys

| Column        | References         | On Update | On Delete |
| ------------- | ------------------ | --------- | --------- |
| `created_by`  | `adm_members.id`   | CASCADE   | SET NULL  |
| `created_by`  | `adm_members.id`   | CASCADE   | SET NULL  |
| `deleted_by`  | `adm_members.id`   | CASCADE   | SET NULL  |
| `deleted_by`  | `adm_members.id`   | CASCADE   | SET NULL  |
| `platform_id` | `dir_platforms.id` | CASCADE   | RESTRICT  |
| `tenant_id`   | `adm_tenants.id`   | CASCADE   | CASCADE   |
| `tenant_id`   | `adm_tenants.id`   | CASCADE   | CASCADE   |
| `updated_by`  | `adm_members.id`   | CASCADE   | SET NULL  |
| `updated_by`  | `adm_members.id`   | CASCADE   | SET NULL  |

#### Indexes

- **`rev_revenue_imports_created_by_idx`**
  ```sql
  CREATE INDEX rev_revenue_imports_created_by_idx ON public.rev_revenue_imports USING btree (created_by)
  ```
- **`rev_revenue_imports_deleted_at_idx`**
  ```sql
  CREATE INDEX rev_revenue_imports_deleted_at_idx ON public.rev_revenue_imports USING btree (deleted_at)
  ```
- **`rev_revenue_imports_import_date_idx`**
  ```sql
  CREATE INDEX rev_revenue_imports_import_date_idx ON public.rev_revenue_imports USING btree (import_date DESC)
  ```
- **`rev_revenue_imports_metadata_idx`**
  ```sql
  CREATE INDEX rev_revenue_imports_metadata_idx ON public.rev_revenue_imports USING gin (metadata)
  ```
- **`rev_revenue_imports_pkey`**
  ```sql
  CREATE UNIQUE INDEX rev_revenue_imports_pkey ON public.rev_revenue_imports USING btree (id)
  ```
- **`rev_revenue_imports_status_active_idx`**
  ```sql
  CREATE INDEX rev_revenue_imports_status_active_idx ON public.rev_revenue_imports USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **`rev_revenue_imports_tenant_id_idx`**
  ```sql
  CREATE INDEX rev_revenue_imports_tenant_id_idx ON public.rev_revenue_imports USING btree (tenant_id)
  ```
- **`rev_revenue_imports_tenant_id_import_reference_key`**
  ```sql
  CREATE UNIQUE INDEX rev_revenue_imports_tenant_id_import_reference_key ON public.rev_revenue_imports USING btree (tenant_id, import_reference) WHERE (deleted_at IS NULL)
  ```
- **`rev_revenue_imports_updated_by_idx`**
  ```sql
  CREATE INDEX rev_revenue_imports_updated_by_idx ON public.rev_revenue_imports USING btree (updated_by)
  ```

---

### 70. `rid_driver_blacklists`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                        | Type                       | Nullable | Default                           | PK  |
| --- | ----------------------------- | -------------------------- | -------- | --------------------------------- | --- |
| 1   | `id`                          | `uuid`                     | ✗        | `uuid_generate_v4()`              | 🔑  |
| 2   | `tenant_id`                   | `uuid`                     | ✗        | ``                                |     |
| 3   | `driver_id`                   | `uuid`                     | ✗        | ``                                |     |
| 4   | `reason`                      | `text`                     | ✗        | ``                                |     |
| 5   | `start_date`                  | `timestamp with time zone` | ✗        | ``                                |     |
| 6   | `end_date`                    | `timestamp with time zone` | ✓        | ``                                |     |
| 8   | `metadata`                    | `jsonb`                    | ✗        | `'{}'::jsonb`                     |     |
| 9   | `created_at`                  | `timestamp with time zone` | ✗        | `now()`                           |     |
| 10  | `created_by`                  | `uuid`                     | ✓        | ``                                |     |
| 11  | `updated_at`                  | `timestamp with time zone` | ✗        | `now()`                           |     |
| 12  | `updated_by`                  | `uuid`                     | ✓        | ``                                |     |
| 13  | `deleted_at`                  | `timestamp with time zone` | ✓        | ``                                |     |
| 14  | `deleted_by`                  | `uuid`                     | ✓        | ``                                |     |
| 15  | `deletion_reason`             | `text`                     | ✓        | ``                                |     |
| 16  | `category`                    | `blacklist_category`       | ✓        | ``                                |     |
| 17  | `severity`                    | `blacklist_severity`       | ✓        | ``                                |     |
| 18  | `status`                      | `blacklist_status`         | ✓        | `'active'::blacklist_status`      |     |
| 19  | `incident_date`               | `timestamp with time zone` | ✓        | ``                                |     |
| 20  | `incident_location`           | `text`                     | ✓        | ``                                |     |
| 21  | `incident_description`        | `text`                     | ✓        | ``                                |     |
| 22  | `evidence_documents`          | `jsonb`                    | ✓        | `'[]'::jsonb`                     |     |
| 23  | `decided_by`                  | `uuid`                     | ✓        | ``                                |     |
| 24  | `decided_at`                  | `timestamp with time zone` | ✓        | ``                                |     |
| 25  | `decision_notes`              | `text`                     | ✓        | ``                                |     |
| 26  | `decision_reviewed`           | `boolean`                  | ✓        | `false`                           |     |
| 27  | `reviewed_by`                 | `uuid`                     | ✓        | ``                                |     |
| 28  | `reviewed_at`                 | `timestamp with time zone` | ✓        | ``                                |     |
| 29  | `appeal_status`               | `appeal_status`            | ✓        | `'not_applicable'::appeal_status` |     |
| 30  | `appeal_submitted_at`         | `timestamp with time zone` | ✓        | ``                                |     |
| 31  | `appeal_reason`               | `text`                     | ✓        | ``                                |     |
| 32  | `appeal_reviewed_at`          | `timestamp with time zone` | ✓        | ``                                |     |
| 33  | `appeal_reviewed_by`          | `uuid`                     | ✓        | ``                                |     |
| 34  | `appeal_decision`             | `text`                     | ✓        | ``                                |     |
| 35  | `appeal_outcome`              | `varchar(50)`              | ✓        | ``                                |     |
| 36  | `legal_review_required`       | `boolean`                  | ✓        | `false`                           |     |
| 37  | `legal_reviewed_at`           | `timestamp with time zone` | ✓        | ``                                |     |
| 38  | `legal_reviewed_by`           | `uuid`                     | ✓        | ``                                |     |
| 39  | `legal_case_number`           | `varchar(100)`             | ✓        | ``                                |     |
| 40  | `legal_notes`                 | `text`                     | ✓        | ``                                |     |
| 41  | `reinstatement_conditions`    | `text`                     | ✓        | ``                                |     |
| 42  | `reinstatement_eligible_date` | `date`                     | ✓        | ``                                |     |
| 43  | `reinstated_at`               | `timestamp with time zone` | ✓        | ``                                |     |
| 44  | `reinstated_by`               | `uuid`                     | ✓        | ``                                |     |
| 45  | `driver_notified_at`          | `timestamp with time zone` | ✓        | ``                                |     |
| 46  | `notification_method`         | `varchar(50)`              | ✓        | ``                                |     |
| 47  | `acknowledgment_received`     | `boolean`                  | ✓        | `false`                           |     |
| 48  | `acknowledgment_date`         | `timestamp with time zone` | ✓        | ``                                |     |

#### Foreign Keys

| Column               | References       | On Update | On Delete |
| -------------------- | ---------------- | --------- | --------- |
| `appeal_reviewed_by` | `adm_members.id` | NO ACTION | SET NULL  |
| `created_by`         | `adm_members.id` | CASCADE   | SET NULL  |
| `decided_by`         | `adm_members.id` | NO ACTION | SET NULL  |
| `deleted_by`         | `adm_members.id` | CASCADE   | SET NULL  |
| `driver_id`          | `rid_drivers.id` | CASCADE   | CASCADE   |
| `legal_reviewed_by`  | `adm_members.id` | NO ACTION | SET NULL  |
| `reinstated_by`      | `adm_members.id` | NO ACTION | SET NULL  |
| `reviewed_by`        | `adm_members.id` | NO ACTION | SET NULL  |
| `tenant_id`          | `adm_tenants.id` | CASCADE   | CASCADE   |
| `updated_by`         | `adm_members.id` | CASCADE   | SET NULL  |

#### Indexes

- **`idx_rid_driver_blacklists_driver_id`**
  ```sql
  CREATE INDEX idx_rid_driver_blacklists_driver_id ON public.rid_driver_blacklists USING btree (driver_id) WHERE (deleted_at IS NULL)
  ```
- **`rid_driver_blacklists_created_by_idx`**
  ```sql
  CREATE INDEX rid_driver_blacklists_created_by_idx ON public.rid_driver_blacklists USING btree (created_by)
  ```
- **`rid_driver_blacklists_deleted_at_idx`**
  ```sql
  CREATE INDEX rid_driver_blacklists_deleted_at_idx ON public.rid_driver_blacklists USING btree (deleted_at)
  ```
- **`rid_driver_blacklists_driver_id_idx`**
  ```sql
  CREATE INDEX rid_driver_blacklists_driver_id_idx ON public.rid_driver_blacklists USING btree (driver_id)
  ```
- **`rid_driver_blacklists_end_date_idx`**
  ```sql
  CREATE INDEX rid_driver_blacklists_end_date_idx ON public.rid_driver_blacklists USING btree (end_date)
  ```
- **`rid_driver_blacklists_metadata_gin`**
  ```sql
  CREATE INDEX rid_driver_blacklists_metadata_gin ON public.rid_driver_blacklists USING gin (metadata)
  ```
- **`rid_driver_blacklists_pkey`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_blacklists_pkey ON public.rid_driver_blacklists USING btree (id)
  ```
- **`rid_driver_blacklists_start_date_idx`**
  ```sql
  CREATE INDEX rid_driver_blacklists_start_date_idx ON public.rid_driver_blacklists USING btree (start_date)
  ```
- **`rid_driver_blacklists_tenant_id_idx`**
  ```sql
  CREATE INDEX rid_driver_blacklists_tenant_id_idx ON public.rid_driver_blacklists USING btree (tenant_id)
  ```
- **`rid_driver_blacklists_updated_by_idx`**
  ```sql
  CREATE INDEX rid_driver_blacklists_updated_by_idx ON public.rid_driver_blacklists USING btree (updated_by)
  ```

---

### 71. `rid_driver_cooperation_terms`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                       | Type                       | Nullable | Default                         | PK  |
| --- | ---------------------------- | -------------------------- | -------- | ------------------------------- | --- |
| 1   | `id`                         | `uuid`                     | ✗        | `uuid_generate_v4()`            | 🔑  |
| 2   | `tenant_id`                  | `uuid`                     | ✗        | ``                              |     |
| 3   | `driver_id`                  | `uuid`                     | ✗        | ``                              |     |
| 4   | `terms_version`              | `text`                     | ✗        | ``                              |     |
| 5   | `accepted_at`                | `timestamp with time zone` | ✓        | ``                              |     |
| 6   | `effective_date`             | `date`                     | ✓        | ``                              |     |
| 7   | `expiry_date`                | `date`                     | ✓        | ``                              |     |
| 9   | `metadata`                   | `jsonb`                    | ✗        | `'{}'::jsonb`                   |     |
| 10  | `created_at`                 | `timestamp with time zone` | ✗        | `now()`                         |     |
| 11  | `created_by`                 | `uuid`                     | ✓        | ``                              |     |
| 12  | `updated_at`                 | `timestamp with time zone` | ✗        | `now()`                         |     |
| 13  | `updated_by`                 | `uuid`                     | ✓        | ``                              |     |
| 14  | `deleted_at`                 | `timestamp with time zone` | ✓        | ``                              |     |
| 15  | `deleted_by`                 | `uuid`                     | ✓        | ``                              |     |
| 16  | `deletion_reason`            | `text`                     | ✓        | ``                              |     |
| 17  | `status`                     | `cooperation_status`       | ✓        | `'pending'::cooperation_status` |     |
| 18  | `compensation_model`         | `compensation_model`       | ✓        | ``                              |     |
| 19  | `fixed_rental_amount`        | `numeric`                  | ✓        | ``                              |     |
| 20  | `percentage_split_company`   | `numeric`                  | ✓        | ``                              |     |
| 21  | `percentage_split_driver`    | `numeric`                  | ✓        | ``                              |     |
| 22  | `salary_amount`              | `numeric`                  | ✓        | ``                              |     |
| 23  | `crew_rental_terms`          | `text`                     | ✓        | ``                              |     |
| 24  | `buyout_amount`              | `numeric`                  | ✓        | ``                              |     |
| 25  | `custom_terms`               | `text`                     | ✓        | ``                              |     |
| 26  | `signature_method`           | `signature_method`         | ✓        | ``                              |     |
| 27  | `signature_data`             | `jsonb`                    | ✓        | ``                              |     |
| 28  | `signature_ip`               | `varchar(45)`              | ✓        | ``                              |     |
| 29  | `signature_timestamp`        | `timestamp with time zone` | ✓        | ``                              |     |
| 30  | `digital_signature_verified` | `boolean`                  | ✓        | `false`                         |     |
| 31  | `previous_version_id`        | `uuid`                     | ✓        | ``                              |     |
| 32  | `version_change_reason`      | `text`                     | ✓        | ``                              |     |
| 33  | `legal_review_required`      | `boolean`                  | ✓        | `false`                         |     |
| 34  | `legal_reviewed_at`          | `timestamp with time zone` | ✓        | ``                              |     |
| 35  | `legal_reviewed_by`          | `uuid`                     | ✓        | ``                              |     |
| 36  | `legal_review_notes`         | `text`                     | ✓        | ``                              |     |
| 37  | `auto_renewal`               | `boolean`                  | ✓        | `false`                         |     |
| 38  | `auto_renewal_notice_days`   | `integer`                  | ✓        | `30`                            |     |
| 39  | `renewal_reminder_sent_at`   | `timestamp with time zone` | ✓        | ``                              |     |
| 40  | `termination_date`           | `timestamp with time zone` | ✓        | ``                              |     |
| 41  | `termination_reason`         | `text`                     | ✓        | ``                              |     |
| 42  | `termination_initiated_by`   | `uuid`                     | ✓        | ``                              |     |
| 43  | `early_termination_penalty`  | `numeric`                  | ✓        | ``                              |     |

#### Foreign Keys

| Column                     | References                        | On Update | On Delete |
| -------------------------- | --------------------------------- | --------- | --------- |
| `created_by`               | `adm_members.id`                  | CASCADE   | SET NULL  |
| `deleted_by`               | `adm_members.id`                  | CASCADE   | SET NULL  |
| `driver_id`                | `rid_drivers.id`                  | CASCADE   | CASCADE   |
| `legal_reviewed_by`        | `adm_members.id`                  | NO ACTION | SET NULL  |
| `previous_version_id`      | `rid_driver_cooperation_terms.id` | NO ACTION | SET NULL  |
| `tenant_id`                | `adm_tenants.id`                  | CASCADE   | CASCADE   |
| `termination_initiated_by` | `adm_members.id`                  | NO ACTION | SET NULL  |
| `updated_by`               | `adm_members.id`                  | CASCADE   | SET NULL  |

#### Indexes

- **`rid_driver_cooperation_terms_accepted_at_idx`**
  ```sql
  CREATE INDEX rid_driver_cooperation_terms_accepted_at_idx ON public.rid_driver_cooperation_terms USING btree (accepted_at)
  ```
- **`rid_driver_cooperation_terms_created_by_idx`**
  ```sql
  CREATE INDEX rid_driver_cooperation_terms_created_by_idx ON public.rid_driver_cooperation_terms USING btree (created_by)
  ```
- **`rid_driver_cooperation_terms_deleted_at_idx`**
  ```sql
  CREATE INDEX rid_driver_cooperation_terms_deleted_at_idx ON public.rid_driver_cooperation_terms USING btree (deleted_at)
  ```
- **`rid_driver_cooperation_terms_driver_id_idx`**
  ```sql
  CREATE INDEX rid_driver_cooperation_terms_driver_id_idx ON public.rid_driver_cooperation_terms USING btree (driver_id)
  ```
- **`rid_driver_cooperation_terms_effective_date_idx`**
  ```sql
  CREATE INDEX rid_driver_cooperation_terms_effective_date_idx ON public.rid_driver_cooperation_terms USING btree (effective_date)
  ```
- **`rid_driver_cooperation_terms_expiry_date_idx`**
  ```sql
  CREATE INDEX rid_driver_cooperation_terms_expiry_date_idx ON public.rid_driver_cooperation_terms USING btree (expiry_date)
  ```
- **`rid_driver_cooperation_terms_metadata_gin`**
  ```sql
  CREATE INDEX rid_driver_cooperation_terms_metadata_gin ON public.rid_driver_cooperation_terms USING gin (metadata)
  ```
- **`rid_driver_cooperation_terms_pkey`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_cooperation_terms_pkey ON public.rid_driver_cooperation_terms USING btree (id)
  ```
- **`rid_driver_cooperation_terms_tenant_driver_version_key`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_cooperation_terms_tenant_driver_version_key ON public.rid_driver_cooperation_terms USING btree (tenant_id, driver_id, terms_version) WHERE (deleted_at IS NULL)
  ```
- **`rid_driver_cooperation_terms_tenant_id_idx`**
  ```sql
  CREATE INDEX rid_driver_cooperation_terms_tenant_id_idx ON public.rid_driver_cooperation_terms USING btree (tenant_id)
  ```
- **`rid_driver_cooperation_terms_terms_version_idx`**
  ```sql
  CREATE INDEX rid_driver_cooperation_terms_terms_version_idx ON public.rid_driver_cooperation_terms USING btree (terms_version)
  ```
- **`rid_driver_cooperation_terms_updated_by_idx`**
  ```sql
  CREATE INDEX rid_driver_cooperation_terms_updated_by_idx ON public.rid_driver_cooperation_terms USING btree (updated_by)
  ```

---

### 72. `rid_driver_documents`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                   | Type                           | Nullable | Default                                   | PK  |
| --- | ------------------------ | ------------------------------ | -------- | ----------------------------------------- | --- |
| 1   | `id`                     | `uuid`                         | ✗        | `uuid_generate_v4()`                      | 🔑  |
| 2   | `tenant_id`              | `uuid`                         | ✗        | ``                                        |     |
| 3   | `driver_id`              | `uuid`                         | ✗        | ``                                        |     |
| 4   | `document_id`            | `uuid`                         | ✗        | ``                                        |     |
| 6   | `expiry_date`            | `date`                         | ✓        | ``                                        |     |
| 7   | `verified`               | `boolean`                      | ✗        | `false`                                   |     |
| 8   | `verified_by`            | `uuid`                         | ✓        | ``                                        |     |
| 9   | `verified_at`            | `timestamp with time zone`     | ✓        | ``                                        |     |
| 10  | `created_at`             | `timestamp with time zone`     | ✗        | `now()`                                   |     |
| 11  | `created_by`             | `uuid`                         | ✓        | ``                                        |     |
| 12  | `updated_at`             | `timestamp with time zone`     | ✗        | `now()`                                   |     |
| 13  | `updated_by`             | `uuid`                         | ✓        | ``                                        |     |
| 14  | `deleted_at`             | `timestamp with time zone`     | ✓        | ``                                        |     |
| 15  | `deleted_by`             | `uuid`                         | ✓        | ``                                        |     |
| 16  | `deletion_reason`        | `text`                         | ✓        | ``                                        |     |
| 17  | `document_type`          | `driver_document_type`         | ✓        | ``                                        |     |
| 18  | `requires_renewal`       | `boolean`                      | ✓        | `true`                                    |     |
| 19  | `renewal_frequency_days` | `integer`                      | ✓        | ``                                        |     |
| 20  | `reminder_sent_at`       | `timestamp with time zone`     | ✓        | ``                                        |     |
| 21  | `reminder_days_before`   | `integer`                      | ✓        | `30`                                      |     |
| 22  | `verification_status`    | `document_verification_status` | ✓        | `'pending'::document_verification_status` |     |
| 23  | `rejection_reason`       | `text`                         | ✓        | ``                                        |     |
| 24  | `verification_method`    | `varchar(50)`                  | ✓        | ``                                        |     |
| 25  | `document_number`        | `varchar(100)`                 | ✓        | ``                                        |     |
| 26  | `issuing_authority`      | `varchar(255)`                 | ✓        | ``                                        |     |
| 27  | `issuing_country`        | `char(2)`                      | ✓        | ``                                        |     |
| 28  | `issue_date`             | `date`                         | ✓        | ``                                        |     |
| 29  | `replaced_document_id`   | `uuid`                         | ✓        | ``                                        |     |
| 30  | `replacement_reason`     | `text`                         | ✓        | ``                                        |     |
| 31  | `ocr_data`               | `jsonb`                        | ✓        | ``                                        |     |
| 32  | `confidence_score`       | `numeric`                      | ✓        | ``                                        |     |

#### Foreign Keys

| Column                 | References                | On Update | On Delete |
| ---------------------- | ------------------------- | --------- | --------- |
| `created_by`           | `adm_members.id`          | CASCADE   | SET NULL  |
| `deleted_by`           | `adm_members.id`          | CASCADE   | SET NULL  |
| `document_id`          | `doc_documents.id`        | CASCADE   | CASCADE   |
| `driver_id`            | `rid_drivers.id`          | CASCADE   | CASCADE   |
| `replaced_document_id` | `rid_driver_documents.id` | NO ACTION | SET NULL  |
| `tenant_id`            | `adm_tenants.id`          | CASCADE   | CASCADE   |
| `updated_by`           | `adm_members.id`          | CASCADE   | SET NULL  |
| `verified_by`          | `adm_members.id`          | CASCADE   | SET NULL  |

#### Indexes

- **`idx_rid_driver_documents_driver`**
  ```sql
  CREATE INDEX idx_rid_driver_documents_driver ON public.rid_driver_documents USING btree (driver_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_rid_driver_documents_driver_id`**
  ```sql
  CREATE INDEX idx_rid_driver_documents_driver_id ON public.rid_driver_documents USING btree (driver_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_rid_driver_documents_tenant`**
  ```sql
  CREATE INDEX idx_rid_driver_documents_tenant ON public.rid_driver_documents USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`rid_driver_documents_created_by_idx`**
  ```sql
  CREATE INDEX rid_driver_documents_created_by_idx ON public.rid_driver_documents USING btree (created_by)
  ```
- **`rid_driver_documents_deleted_at_idx`**
  ```sql
  CREATE INDEX rid_driver_documents_deleted_at_idx ON public.rid_driver_documents USING btree (deleted_at)
  ```
- **`rid_driver_documents_document_id_idx`**
  ```sql
  CREATE INDEX rid_driver_documents_document_id_idx ON public.rid_driver_documents USING btree (document_id)
  ```
- **`rid_driver_documents_driver_id_idx`**
  ```sql
  CREATE INDEX rid_driver_documents_driver_id_idx ON public.rid_driver_documents USING btree (driver_id)
  ```
- **`rid_driver_documents_expiry_date_idx`**
  ```sql
  CREATE INDEX rid_driver_documents_expiry_date_idx ON public.rid_driver_documents USING btree (expiry_date)
  ```
- **`rid_driver_documents_pkey`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_documents_pkey ON public.rid_driver_documents USING btree (id)
  ```
- **`rid_driver_documents_tenant_id_idx`**
  ```sql
  CREATE INDEX rid_driver_documents_tenant_id_idx ON public.rid_driver_documents USING btree (tenant_id)
  ```
- **`rid_driver_documents_updated_by_idx`**
  ```sql
  CREATE INDEX rid_driver_documents_updated_by_idx ON public.rid_driver_documents USING btree (updated_by)
  ```

---

### 73. `rid_driver_languages`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column            | Type                       | Nullable | Default              | PK  |
| --- | ----------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`              | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`       | `uuid`                     | ✗        | ``                   |     |
| 3   | `driver_id`       | `uuid`                     | ✗        | ``                   |     |
| 4   | `language_code`   | `char(2)`                  | ✗        | ``                   |     |
| 5   | `proficiency`     | `text`                     | ✓        | ``                   |     |
| 6   | `created_at`      | `timestamp with time zone` | ✗        | `now()`              |     |
| 7   | `created_by`      | `uuid`                     | ✓        | ``                   |     |
| 8   | `updated_at`      | `timestamp with time zone` | ✗        | `now()`              |     |
| 9   | `updated_by`      | `uuid`                     | ✓        | ``                   |     |
| 10  | `deleted_at`      | `timestamp with time zone` | ✓        | ``                   |     |
| 11  | `deleted_by`      | `uuid`                     | ✓        | ``                   |     |
| 12  | `deletion_reason` | `text`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column       | References       | On Update | On Delete |
| ------------ | ---------------- | --------- | --------- |
| `created_by` | `adm_members.id` | CASCADE   | SET NULL  |
| `deleted_by` | `adm_members.id` | CASCADE   | SET NULL  |
| `driver_id`  | `rid_drivers.id` | CASCADE   | CASCADE   |
| `tenant_id`  | `adm_tenants.id` | CASCADE   | CASCADE   |
| `updated_by` | `adm_members.id` | CASCADE   | SET NULL  |

#### Indexes

- **`rid_driver_languages_lang_idx`**
  ```sql
  CREATE INDEX rid_driver_languages_lang_idx ON public.rid_driver_languages USING btree (language_code) WHERE (deleted_at IS NULL)
  ```
- **`rid_driver_languages_pkey`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_languages_pkey ON public.rid_driver_languages USING btree (id)
  ```
- **`rid_driver_languages_unique`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_languages_unique ON public.rid_driver_languages USING btree (tenant_id, driver_id, language_code) WHERE (deleted_at IS NULL)
  ```

---

### 74. `rid_driver_performances`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                      | Type                       | Nullable | Default              | PK  |
| --- | --------------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                        | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`                 | `uuid`                     | ✗        | ``                   |     |
| 3   | `driver_id`                 | `uuid`                     | ✗        | ``                   |     |
| 4   | `period_start`              | `date`                     | ✗        | ``                   |     |
| 5   | `period_end`                | `date`                     | ✗        | ``                   |     |
| 6   | `trips_completed`           | `integer`                  | ✗        | `0`                  |     |
| 7   | `trips_cancelled`           | `integer`                  | ✗        | `0`                  |     |
| 8   | `on_time_rate`              | `numeric`                  | ✓        | ``                   |     |
| 9   | `avg_rating`                | `numeric`                  | ✓        | ``                   |     |
| 10  | `incidents_count`           | `integer`                  | ✗        | `0`                  |     |
| 11  | `earnings_total`            | `numeric`                  | ✗        | `0`                  |     |
| 12  | `hours_online`              | `numeric`                  | ✓        | ``                   |     |
| 13  | `metadata`                  | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 14  | `created_at`                | `timestamp with time zone` | ✗        | `now()`              |     |
| 15  | `created_by`                | `uuid`                     | ✓        | ``                   |     |
| 16  | `updated_at`                | `timestamp with time zone` | ✗        | `now()`              |     |
| 17  | `updated_by`                | `uuid`                     | ✓        | ``                   |     |
| 18  | `deleted_at`                | `timestamp with time zone` | ✓        | ``                   |     |
| 19  | `deleted_by`                | `uuid`                     | ✓        | ``                   |     |
| 20  | `deletion_reason`           | `text`                     | ✓        | ``                   |     |
| 21  | `platform_id`               | `uuid`                     | ✓        | ``                   |     |
| 22  | `platform_trips_completed`  | `integer`                  | ✓        | `0`                  |     |
| 23  | `platform_earnings`         | `numeric`                  | ✓        | `0`                  |     |
| 24  | `cash_trips`                | `integer`                  | ✓        | `0`                  |     |
| 25  | `cash_earnings`             | `numeric`                  | ✓        | `0`                  |     |
| 26  | `card_trips`                | `integer`                  | ✓        | `0`                  |     |
| 27  | `card_earnings`             | `numeric`                  | ✓        | `0`                  |     |
| 28  | `wallet_trips`              | `integer`                  | ✓        | `0`                  |     |
| 29  | `wallet_earnings`           | `numeric`                  | ✓        | `0`                  |     |
| 30  | `mixed_payment_trips`       | `integer`                  | ✓        | `0`                  |     |
| 31  | `rank_in_period`            | `integer`                  | ✓        | ``                   |     |
| 32  | `tier`                      | `varchar(20)`              | ✓        | ``                   |     |
| 33  | `tier_change`               | `varchar(10)`              | ✓        | ``                   |     |
| 34  | `acceptance_rate`           | `numeric`                  | ✓        | ``                   |     |
| 35  | `cancellation_rate`         | `numeric`                  | ✓        | ``                   |     |
| 36  | `completion_rate`           | `numeric`                  | ✓        | ``                   |     |
| 37  | `avg_trip_duration_minutes` | `numeric`                  | ✓        | ``                   |     |
| 38  | `avg_earnings_per_trip`     | `numeric`                  | ✓        | ``                   |     |
| 39  | `avg_earnings_per_hour`     | `numeric`                  | ✓        | ``                   |     |
| 40  | `total_ratings_received`    | `integer`                  | ✓        | `0`                  |     |
| 41  | `five_star_ratings`         | `integer`                  | ✓        | `0`                  |     |
| 42  | `one_star_ratings`          | `integer`                  | ✓        | `0`                  |     |
| 43  | `compliments_received`      | `integer`                  | ✓        | `0`                  |     |
| 44  | `complaints_received`       | `integer`                  | ✓        | `0`                  |     |
| 45  | `total_fuel_cost`           | `numeric`                  | ✓        | `0`                  |     |
| 46  | `total_expenses`            | `numeric`                  | ✓        | `0`                  |     |
| 47  | `net_earnings`              | `numeric`                  | ✓        | `0`                  |     |
| 48  | `bonus_earned`              | `numeric`                  | ✓        | `0`                  |     |
| 49  | `incentives_earned`         | `numeric`                  | ✓        | `0`                  |     |
| 50  | `penalties_deducted`        | `numeric`                  | ✓        | `0`                  |     |
| 51  | `total_distance_km`         | `numeric`                  | ✓        | `0`                  |     |
| 52  | `hours_logged`              | `numeric`                  | ✓        | ``                   |     |

#### Foreign Keys

| Column        | References         | On Update | On Delete |
| ------------- | ------------------ | --------- | --------- |
| `created_by`  | `adm_members.id`   | CASCADE   | SET NULL  |
| `deleted_by`  | `adm_members.id`   | CASCADE   | SET NULL  |
| `driver_id`   | `rid_drivers.id`   | CASCADE   | CASCADE   |
| `platform_id` | `dir_platforms.id` | NO ACTION | SET NULL  |
| `tenant_id`   | `adm_tenants.id`   | CASCADE   | CASCADE   |
| `updated_by`  | `adm_members.id`   | CASCADE   | SET NULL  |

#### Indexes

- **`idx_rid_driver_performances_driver`**
  ```sql
  CREATE INDEX idx_rid_driver_performances_driver ON public.rid_driver_performances USING btree (driver_id)
  ```
- **`idx_rid_driver_performances_tenant`**
  ```sql
  CREATE INDEX idx_rid_driver_performances_tenant ON public.rid_driver_performances USING btree (tenant_id)
  ```
- **`rid_driver_performances_created_by_idx`**
  ```sql
  CREATE INDEX rid_driver_performances_created_by_idx ON public.rid_driver_performances USING btree (created_by)
  ```
- **`rid_driver_performances_deleted_at_idx`**
  ```sql
  CREATE INDEX rid_driver_performances_deleted_at_idx ON public.rid_driver_performances USING btree (deleted_at)
  ```
- **`rid_driver_performances_driver_id_idx`**
  ```sql
  CREATE INDEX rid_driver_performances_driver_id_idx ON public.rid_driver_performances USING btree (driver_id)
  ```
- **`rid_driver_performances_metadata_gin`**
  ```sql
  CREATE INDEX rid_driver_performances_metadata_gin ON public.rid_driver_performances USING gin (metadata)
  ```
- **`rid_driver_performances_period_end_idx`**
  ```sql
  CREATE INDEX rid_driver_performances_period_end_idx ON public.rid_driver_performances USING btree (period_end)
  ```
- **`rid_driver_performances_period_start_idx`**
  ```sql
  CREATE INDEX rid_driver_performances_period_start_idx ON public.rid_driver_performances USING btree (period_start)
  ```
- **`rid_driver_performances_pkey`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_performances_pkey ON public.rid_driver_performances USING btree (id)
  ```
- **`rid_driver_performances_tenant_driver_period_key`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_performances_tenant_driver_period_key ON public.rid_driver_performances USING btree (tenant_id, driver_id, period_start) WHERE (deleted_at IS NULL)
  ```
- **`rid_driver_performances_tenant_id_idx`**
  ```sql
  CREATE INDEX rid_driver_performances_tenant_id_idx ON public.rid_driver_performances USING btree (tenant_id)
  ```
- **`rid_driver_performances_updated_by_idx`**
  ```sql
  CREATE INDEX rid_driver_performances_updated_by_idx ON public.rid_driver_performances USING btree (updated_by)
  ```

---

### 75. `rid_driver_requests`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                      | Type                       | Nullable | Default                      | PK  |
| --- | --------------------------- | -------------------------- | -------- | ---------------------------- | --- |
| 1   | `id`                        | `uuid`                     | ✗        | `uuid_generate_v4()`         | 🔑  |
| 2   | `tenant_id`                 | `uuid`                     | ✗        | ``                           |     |
| 3   | `driver_id`                 | `uuid`                     | ✗        | ``                           |     |
| 5   | `request_date`              | `date`                     | ✗        | ``                           |     |
| 6   | `details`                   | `jsonb`                    | ✗        | `'{}'::jsonb`                |     |
| 8   | `resolution_notes`          | `text`                     | ✓        | ``                           |     |
| 9   | `created_at`                | `timestamp with time zone` | ✗        | `now()`                      |     |
| 10  | `created_by`                | `uuid`                     | ✓        | ``                           |     |
| 11  | `updated_at`                | `timestamp with time zone` | ✗        | `now()`                      |     |
| 12  | `updated_by`                | `uuid`                     | ✓        | ``                           |     |
| 13  | `deleted_at`                | `timestamp with time zone` | ✓        | ``                           |     |
| 14  | `deleted_by`                | `uuid`                     | ✓        | ``                           |     |
| 15  | `deletion_reason`           | `text`                     | ✓        | ``                           |     |
| 16  | `request_type`              | `driver_request_type`      | ✓        | ``                           |     |
| 17  | `status`                    | `request_status`           | ✓        | `'pending'::request_status`  |     |
| 18  | `priority`                  | `request_priority`         | ✓        | `'normal'::request_priority` |     |
| 19  | `sla_deadline`              | `timestamp with time zone` | ✓        | ``                           |     |
| 20  | `sla_breached`              | `boolean`                  | ✓        | `false`                      |     |
| 21  | `response_required_by`      | `timestamp with time zone` | ✓        | ``                           |     |
| 22  | `assigned_to`               | `uuid`                     | ✓        | ``                           |     |
| 23  | `assigned_at`               | `timestamp with time zone` | ✓        | ``                           |     |
| 24  | `review_started_at`         | `timestamp with time zone` | ✓        | ``                           |     |
| 25  | `reviewed_by`               | `uuid`                     | ✓        | ``                           |     |
| 26  | `approved_at`               | `timestamp with time zone` | ✓        | ``                           |     |
| 27  | `approved_by`               | `uuid`                     | ✓        | ``                           |     |
| 28  | `rejected_at`               | `timestamp with time zone` | ✓        | ``                           |     |
| 29  | `rejected_by`               | `uuid`                     | ✓        | ``                           |     |
| 30  | `rejection_reason`          | `text`                     | ✓        | ``                           |     |
| 31  | `completed_at`              | `timestamp with time zone` | ✓        | ``                           |     |
| 32  | `escalated`                 | `boolean`                  | ✓        | `false`                      |     |
| 33  | `escalated_at`              | `timestamp with time zone` | ✓        | ``                           |     |
| 34  | `escalated_to`              | `uuid`                     | ✓        | ``                           |     |
| 35  | `escalation_reason`         | `text`                     | ✓        | ``                           |     |
| 36  | `requires_manager_approval` | `boolean`                  | ✓        | `false`                      |     |
| 37  | `manager_approved_at`       | `timestamp with time zone` | ✓        | ``                           |     |
| 38  | `manager_approved_by`       | `uuid`                     | ✓        | ``                           |     |
| 39  | `requires_hr_approval`      | `boolean`                  | ✓        | `false`                      |     |
| 40  | `hr_approved_at`            | `timestamp with time zone` | ✓        | ``                           |     |
| 41  | `hr_approved_by`            | `uuid`                     | ✓        | ``                           |     |
| 42  | `driver_notified_at`        | `timestamp with time zone` | ✓        | ``                           |     |
| 43  | `manager_notified_at`       | `timestamp with time zone` | ✓        | ``                           |     |
| 44  | `notification_method`       | `varchar(50)`              | ✓        | ``                           |     |
| 45  | `attachments`               | `jsonb`                    | ✓        | `'[]'::jsonb`                |     |

#### Foreign Keys

| Column                | References       | On Update | On Delete |
| --------------------- | ---------------- | --------- | --------- |
| `approved_by`         | `adm_members.id` | NO ACTION | SET NULL  |
| `assigned_to`         | `adm_members.id` | NO ACTION | SET NULL  |
| `created_by`          | `adm_members.id` | CASCADE   | SET NULL  |
| `deleted_by`          | `adm_members.id` | CASCADE   | SET NULL  |
| `driver_id`           | `rid_drivers.id` | CASCADE   | CASCADE   |
| `escalated_to`        | `adm_members.id` | NO ACTION | SET NULL  |
| `hr_approved_by`      | `adm_members.id` | NO ACTION | SET NULL  |
| `manager_approved_by` | `adm_members.id` | NO ACTION | SET NULL  |
| `rejected_by`         | `adm_members.id` | NO ACTION | SET NULL  |
| `reviewed_by`         | `adm_members.id` | NO ACTION | SET NULL  |
| `tenant_id`           | `adm_tenants.id` | CASCADE   | CASCADE   |
| `updated_by`          | `adm_members.id` | CASCADE   | SET NULL  |

#### Indexes

- **`rid_driver_requests_created_by_idx`**
  ```sql
  CREATE INDEX rid_driver_requests_created_by_idx ON public.rid_driver_requests USING btree (created_by)
  ```
- **`rid_driver_requests_deleted_at_idx`**
  ```sql
  CREATE INDEX rid_driver_requests_deleted_at_idx ON public.rid_driver_requests USING btree (deleted_at)
  ```
- **`rid_driver_requests_details_gin`**
  ```sql
  CREATE INDEX rid_driver_requests_details_gin ON public.rid_driver_requests USING gin (details)
  ```
- **`rid_driver_requests_driver_id_idx`**
  ```sql
  CREATE INDEX rid_driver_requests_driver_id_idx ON public.rid_driver_requests USING btree (driver_id)
  ```
- **`rid_driver_requests_pkey`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_requests_pkey ON public.rid_driver_requests USING btree (id)
  ```
- **`rid_driver_requests_request_date_idx`**
  ```sql
  CREATE INDEX rid_driver_requests_request_date_idx ON public.rid_driver_requests USING btree (request_date)
  ```
- **`rid_driver_requests_tenant_id_idx`**
  ```sql
  CREATE INDEX rid_driver_requests_tenant_id_idx ON public.rid_driver_requests USING btree (tenant_id)
  ```
- **`rid_driver_requests_updated_by_idx`**
  ```sql
  CREATE INDEX rid_driver_requests_updated_by_idx ON public.rid_driver_requests USING btree (updated_by)
  ```

---

### 76. `rid_driver_training`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                             | Type                       | Nullable | Default                      | PK  |
| --- | ---------------------------------- | -------------------------- | -------- | ---------------------------- | --- |
| 1   | `id`                               | `uuid`                     | ✗        | `uuid_generate_v4()`         | 🔑  |
| 2   | `tenant_id`                        | `uuid`                     | ✗        | ``                           |     |
| 3   | `driver_id`                        | `uuid`                     | ✗        | ``                           |     |
| 4   | `training_name`                    | `text`                     | ✗        | ``                           |     |
| 5   | `provider`                         | `text`                     | ✓        | ``                           |     |
| 7   | `assigned_at`                      | `timestamp with time zone` | ✓        | ``                           |     |
| 8   | `due_at`                           | `timestamp with time zone` | ✓        | ``                           |     |
| 9   | `completed_at`                     | `timestamp with time zone` | ✓        | ``                           |     |
| 10  | `score`                            | `numeric`                  | ✓        | ``                           |     |
| 11  | `certificate_url`                  | `text`                     | ✓        | ``                           |     |
| 12  | `metadata`                         | `jsonb`                    | ✗        | `'{}'::jsonb`                |     |
| 13  | `created_at`                       | `timestamp with time zone` | ✗        | `now()`                      |     |
| 14  | `created_by`                       | `uuid`                     | ✓        | ``                           |     |
| 15  | `updated_at`                       | `timestamp with time zone` | ✗        | `now()`                      |     |
| 16  | `updated_by`                       | `uuid`                     | ✓        | ``                           |     |
| 17  | `deleted_at`                       | `timestamp with time zone` | ✓        | ``                           |     |
| 18  | `deleted_by`                       | `uuid`                     | ✓        | ``                           |     |
| 19  | `deletion_reason`                  | `text`                     | ✓        | ``                           |     |
| 20  | `training_type`                    | `training_type`            | ✓        | ``                           |     |
| 21  | `status`                           | `training_status`          | ✓        | `'planned'::training_status` |     |
| 22  | `provider_type`                    | `provider_type`            | ✓        | ``                           |     |
| 23  | `provider_id`                      | `uuid`                     | ✓        | ``                           |     |
| 24  | `provider_contact`                 | `varchar(255)`             | ✓        | ``                           |     |
| 25  | `provider_location`                | `text`                     | ✓        | ``                           |     |
| 26  | `description`                      | `text`                     | ✓        | ``                           |     |
| 27  | `duration_hours`                   | `numeric`                  | ✓        | ``                           |     |
| 28  | `total_sessions`                   | `integer`                  | ✓        | `1`                          |     |
| 29  | `sessions_completed`               | `integer`                  | ✓        | `0`                          |     |
| 30  | `materials_url`                    | `text`                     | ✓        | ``                           |     |
| 31  | `prerequisites_met`                | `boolean`                  | ✓        | `true`                       |     |
| 32  | `prerequisite_training_ids`        | `jsonb`                    | ✓        | `'[]'::jsonb`                |     |
| 33  | `prerequisite_documents`           | `jsonb`                    | ✓        | `'[]'::jsonb`                |     |
| 34  | `scheduled_start`                  | `timestamp with time zone` | ✓        | ``                           |     |
| 35  | `scheduled_end`                    | `timestamp with time zone` | ✓        | ``                           |     |
| 36  | `actual_start`                     | `timestamp with time zone` | ✓        | ``                           |     |
| 37  | `actual_end`                       | `timestamp with time zone` | ✓        | ``                           |     |
| 38  | `location`                         | `text`                     | ✓        | ``                           |     |
| 39  | `online_meeting_url`               | `text`                     | ✓        | ``                           |     |
| 40  | `attendance_percentage`            | `numeric`                  | ✓        | ``                           |     |
| 41  | `absences_count`                   | `integer`                  | ✓        | `0`                          |     |
| 42  | `late_arrivals_count`              | `integer`                  | ✓        | `0`                          |     |
| 43  | `evaluation_method`                | `varchar(100)`             | ✓        | ``                           |     |
| 44  | `passing_score`                    | `numeric`                  | ✓        | ``                           |     |
| 45  | `max_score`                        | `numeric`                  | ✓        | ``                           |     |
| 46  | `pass_fail_status`                 | `varchar(20)`              | ✓        | ``                           |     |
| 47  | `evaluation_date`                  | `timestamp with time zone` | ✓        | ``                           |     |
| 48  | `evaluated_by`                     | `uuid`                     | ✓        | ``                           |     |
| 49  | `evaluation_notes`                 | `text`                     | ✓        | ``                           |     |
| 50  | `certificate_issued`               | `boolean`                  | ✓        | `false`                      |     |
| 51  | `certificate_number`               | `varchar(100)`             | ✓        | ``                           |     |
| 52  | `certificate_issued_date`          | `date`                     | ✓        | ``                           |     |
| 53  | `certificate_expiry_date`          | `date`                     | ✓        | ``                           |     |
| 54  | `recertification_required`         | `boolean`                  | ✓        | `false`                      |     |
| 55  | `recertification_frequency_months` | `integer`                  | ✓        | ``                           |     |
| 56  | `training_cost`                    | `numeric`                  | ✓        | ``                           |     |
| 57  | `paid_by`                          | `paid_by`                  | ✓        | ``                           |     |
| 58  | `budget_code`                      | `varchar(50)`              | ✓        | ``                           |     |
| 59  | `invoice_number`                   | `varchar(100)`             | ✓        | ``                           |     |
| 60  | `driver_feedback`                  | `text`                     | ✓        | ``                           |     |
| 61  | `driver_rating`                    | `numeric`                  | ✓        | ``                           |     |
| 62  | `feedback_submitted_at`            | `timestamp with time zone` | ✓        | ``                           |     |

#### Foreign Keys

| Column         | References                  | On Update | On Delete |
| -------------- | --------------------------- | --------- | --------- |
| `created_by`   | `adm_members.id`            | CASCADE   | SET NULL  |
| `deleted_by`   | `adm_members.id`            | CASCADE   | SET NULL  |
| `driver_id`    | `rid_drivers.id`            | CASCADE   | CASCADE   |
| `evaluated_by` | `adm_members.id`            | NO ACTION | SET NULL  |
| `provider_id`  | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `tenant_id`    | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `updated_by`   | `adm_members.id`            | CASCADE   | SET NULL  |

#### Indexes

- **`idx_rid_driver_training_driver_id`**
  ```sql
  CREATE INDEX idx_rid_driver_training_driver_id ON public.rid_driver_training USING btree (driver_id) WHERE (deleted_at IS NULL)
  ```
- **`rid_driver_training_created_by_idx`**
  ```sql
  CREATE INDEX rid_driver_training_created_by_idx ON public.rid_driver_training USING btree (created_by)
  ```
- **`rid_driver_training_deleted_at_idx`**
  ```sql
  CREATE INDEX rid_driver_training_deleted_at_idx ON public.rid_driver_training USING btree (deleted_at)
  ```
- **`rid_driver_training_driver_id_idx`**
  ```sql
  CREATE INDEX rid_driver_training_driver_id_idx ON public.rid_driver_training USING btree (driver_id)
  ```
- **`rid_driver_training_due_at_idx`**
  ```sql
  CREATE INDEX rid_driver_training_due_at_idx ON public.rid_driver_training USING btree (due_at)
  ```
- **`rid_driver_training_metadata_gin`**
  ```sql
  CREATE INDEX rid_driver_training_metadata_gin ON public.rid_driver_training USING gin (metadata)
  ```
- **`rid_driver_training_pkey`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_training_pkey ON public.rid_driver_training USING btree (id)
  ```
- **`rid_driver_training_tenant_driver_name_key`**
  ```sql
  CREATE UNIQUE INDEX rid_driver_training_tenant_driver_name_key ON public.rid_driver_training USING btree (tenant_id, driver_id, training_name) WHERE (deleted_at IS NULL)
  ```
- **`rid_driver_training_tenant_id_idx`**
  ```sql
  CREATE INDEX rid_driver_training_tenant_id_idx ON public.rid_driver_training USING btree (tenant_id)
  ```
- **`rid_driver_training_training_name_idx`**
  ```sql
  CREATE INDEX rid_driver_training_training_name_idx ON public.rid_driver_training USING btree (training_name)
  ```
- **`rid_driver_training_updated_by_idx`**
  ```sql
  CREATE INDEX rid_driver_training_updated_by_idx ON public.rid_driver_training USING btree (updated_by)
  ```

---

### 77. `rid_drivers`

**Rows**: 1 live, 6 dead

#### Columns

| #   | Column                       | Type                       | Nullable | Default                   | PK  |
| --- | ---------------------------- | -------------------------- | -------- | ------------------------- | --- |
| 1   | `id`                         | `uuid`                     | ✗        | `uuid_generate_v4()`      | 🔑  |
| 2   | `tenant_id`                  | `uuid`                     | ✗        | ``                        |     |
| 4   | `first_name`                 | `text`                     | ✗        | ``                        |     |
| 5   | `last_name`                  | `text`                     | ✗        | ``                        |     |
| 6   | `email`                      | `text`                     | ✗        | ``                        |     |
| 7   | `phone`                      | `text`                     | ✗        | ``                        |     |
| 10  | `license_number`             | `text`                     | ✗        | ``                        |     |
| 11  | `license_issue_date`         | `date`                     | ✓        | ``                        |     |
| 12  | `license_expiry_date`        | `date`                     | ✓        | ``                        |     |
| 13  | `professional_card_no`       | `text`                     | ✓        | ``                        |     |
| 14  | `professional_expiry`        | `date`                     | ✓        | ``                        |     |
| 25  | `created_at`                 | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`       |     |
| 27  | `updated_at`                 | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`       |     |
| 29  | `deleted_at`                 | `timestamp with time zone` | ✓        | ``                        |     |
| 32  | `rating`                     | `numeric`                  | ✓        | ``                        |     |
| 33  | `notes`                      | `text`                     | ✓        | ``                        |     |
| 34  | `date_of_birth`              | `date`                     | ✓        | ``                        |     |
| 35  | `gender`                     | `text`                     | ✓        | ``                        |     |
| 36  | `nationality`                | `char(2)`                  | ✓        | ``                        |     |
| 37  | `hire_date`                  | `date`                     | ✓        | ``                        |     |
| 38  | `employment_status`          | `text`                     | ✗        | `'active'::text`          |     |
| 39  | `cooperation_type`           | `text`                     | ✓        | ``                        |     |
| 40  | `emergency_contact_name`     | `text`                     | ✓        | ``                        |     |
| 41  | `emergency_contact_phone`    | `text`                     | ✓        | ``                        |     |
| 42  | `place_of_birth`             | `varchar(100)`             | ✓        | ``                        |     |
| 43  | `emirates_id`                | `varchar(50)`              | ✓        | ``                        |     |
| 44  | `emirates_id_expiry`         | `date`                     | ✓        | ``                        |     |
| 45  | `full_name`                  | `text`                     | ✓        | ``                        |     |
| 46  | `preferred_name`             | `varchar(100)`             | ✓        | ``                        |     |
| 47  | `secondary_phone`            | `varchar(20)`              | ✓        | ``                        |     |
| 48  | `emergency_contact_relation` | `varchar(50)`              | ✓        | ``                        |     |
| 49  | `address_line1`              | `text`                     | ✓        | ``                        |     |
| 50  | `address_line2`              | `text`                     | ✓        | ``                        |     |
| 51  | `city`                       | `varchar(100)`             | ✓        | ``                        |     |
| 52  | `state`                      | `varchar(100)`             | ✓        | ``                        |     |
| 53  | `postal_code`                | `varchar(20)`              | ✓        | ``                        |     |
| 54  | `country_code`               | `char(2)`                  | ✓        | ``                        |     |
| 55  | `bank_name`                  | `varchar(100)`             | ✓        | ``                        |     |
| 56  | `bank_account_number`        | `varchar(50)`              | ✓        | ``                        |     |
| 57  | `bank_iban`                  | `varchar(34)`              | ✓        | ``                        |     |
| 58  | `bank_swift_code`            | `varchar(11)`              | ✓        | ``                        |     |
| 59  | `preferred_payment_method`   | `preferred_payment_method` | ✓        | ``                        |     |
| 60  | `wps_eligible`               | `boolean`                  | ✓        | `false`                   |     |
| 61  | `driver_status`              | `driver_status`            | ✓        | `'active'::driver_status` |     |
| 62  | `onboarded_at`               | `timestamp with time zone` | ✓        | ``                        |     |
| 63  | `last_active_at`             | `timestamp with time zone` | ✓        | ``                        |     |
| 64  | `total_trips_completed`      | `integer`                  | ✓        | `0`                       |     |
| 65  | `lifetime_earnings`          | `numeric`                  | ✓        | `0`                       |     |
| 66  | `suspension_reason`          | `text`                     | ✓        | ``                        |     |
| 67  | `suspension_start_date`      | `date`                     | ✓        | ``                        |     |
| 68  | `suspension_end_date`        | `date`                     | ✓        | ``                        |     |
| 69  | `termination_reason`         | `text`                     | ✓        | ``                        |     |
| 70  | `termination_date`           | `date`                     | ✓        | ``                        |     |
| 71  | `rehire_eligible`            | `boolean`                  | ✓        | `true`                    |     |
| 72  | `photo_url`                  | `text`                     | ✓        | ``                        |     |
| 73  | `photo_verified_at`          | `timestamp with time zone` | ✓        | ``                        |     |
| 74  | `photo_verified_by`          | `uuid`                     | ✓        | ``                        |     |
| 75  | `average_rating`             | `numeric`                  | ✓        | ``                        |     |
| 76  | `metadata`                   | `jsonb`                    | ✓        | `'{}'::jsonb`             |     |
| 77  | `preferences`                | `jsonb`                    | ✓        | `'{}'::jsonb`             |     |
| 78  | `created_by`                 | `uuid`                     | ✓        | ``                        |     |
| 79  | `updated_by`                 | `uuid`                     | ✓        | ``                        |     |
| 80  | `verified_by`                | `uuid`                     | ✓        | ``                        |     |
| 81  | `verified_at`                | `timestamp with time zone` | ✓        | ``                        |     |
| 82  | `deleted_by`                 | `uuid`                     | ✓        | ``                        |     |
| 83  | `deletion_reason`            | `text`                     | ✓        | ``                        |     |

#### Foreign Keys

| Column              | References                  | On Update | On Delete |
| ------------------- | --------------------------- | --------- | --------- |
| `created_by`        | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `deleted_by`        | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `photo_verified_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `tenant_id`         | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `updated_by`        | `adm_provider_employees.id` | NO ACTION | SET NULL  |
| `verified_by`       | `adm_provider_employees.id` | NO ACTION | SET NULL  |

#### Indexes

- **`idx_rid_drivers_license`**
  ```sql
  CREATE INDEX idx_rid_drivers_license ON public.rid_drivers USING btree (license_number) WHERE (deleted_at IS NULL)
  ```
- **`idx_rid_drivers_metadata`**
  ```sql
  CREATE INDEX idx_rid_drivers_metadata ON public.rid_drivers USING gin (metadata)
  ```
- **`idx_rid_drivers_tenant`**
  ```sql
  CREATE INDEX idx_rid_drivers_tenant ON public.rid_drivers USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_rid_drivers_tenant_email_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_rid_drivers_tenant_email_unique ON public.rid_drivers USING btree (tenant_id, email) WHERE ((deleted_at IS NULL) AND (email IS NOT NULL))
  ```
- **`idx_rid_drivers_tenant_license`**
  ```sql
  CREATE UNIQUE INDEX idx_rid_drivers_tenant_license ON public.rid_drivers USING btree (tenant_id, license_number) WHERE (deleted_at IS NULL)
  ```
- **`idx_rid_drivers_tenant_phone_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_rid_drivers_tenant_phone_unique ON public.rid_drivers USING btree (tenant_id, phone) WHERE (deleted_at IS NULL)
  ```
- **`idx_rid_drivers_tenant_status`**
  ```sql
  CREATE INDEX idx_rid_drivers_tenant_status ON public.rid_drivers USING btree (tenant_id, driver_status) WHERE (deleted_at IS NULL)
  ```
- **`rid_drivers_cooperation_type_idx`**
  ```sql
  CREATE INDEX rid_drivers_cooperation_type_idx ON public.rid_drivers USING btree (cooperation_type) WHERE (deleted_at IS NULL)
  ```
- **`rid_drivers_created_at_idx`**
  ```sql
  CREATE INDEX rid_drivers_created_at_idx ON public.rid_drivers USING btree (created_at DESC)
  ```
- **`rid_drivers_deleted_at_idx`**
  ```sql
  CREATE INDEX rid_drivers_deleted_at_idx ON public.rid_drivers USING btree (deleted_at)
  ```
- **`rid_drivers_dob_idx`**
  ```sql
  CREATE INDEX rid_drivers_dob_idx ON public.rid_drivers USING btree (date_of_birth) WHERE (deleted_at IS NULL)
  ```
- **`rid_drivers_email_idx`**
  ```sql
  CREATE INDEX rid_drivers_email_idx ON public.rid_drivers USING btree (email)
  ```
- **`rid_drivers_employment_status_idx`**
  ```sql
  CREATE INDEX rid_drivers_employment_status_idx ON public.rid_drivers USING btree (employment_status) WHERE (deleted_at IS NULL)
  ```
- **`rid_drivers_first_name_idx`**
  ```sql
  CREATE INDEX rid_drivers_first_name_idx ON public.rid_drivers USING btree (first_name)
  ```
- **`rid_drivers_hire_date_idx`**
  ```sql
  CREATE INDEX rid_drivers_hire_date_idx ON public.rid_drivers USING btree (hire_date) WHERE (deleted_at IS NULL)
  ```
- **`rid_drivers_last_name_idx`**
  ```sql
  CREATE INDEX rid_drivers_last_name_idx ON public.rid_drivers USING btree (last_name)
  ```
- **`rid_drivers_license_number_idx`**
  ```sql
  CREATE INDEX rid_drivers_license_number_idx ON public.rid_drivers USING btree (license_number)
  ```
- **`rid_drivers_nationality_idx`**
  ```sql
  CREATE INDEX rid_drivers_nationality_idx ON public.rid_drivers USING btree (nationality) WHERE (deleted_at IS NULL)
  ```
- **`rid_drivers_notes_gin_idx`**
  ```sql
  CREATE INDEX rid_drivers_notes_gin_idx ON public.rid_drivers USING gin (to_tsvector('english'::regconfig, COALESCE(notes, ''::text)))
  ```
- **`rid_drivers_phone_idx`**
  ```sql
  CREATE INDEX rid_drivers_phone_idx ON public.rid_drivers USING btree (phone)
  ```
- **`rid_drivers_pkey`**
  ```sql
  CREATE UNIQUE INDEX rid_drivers_pkey ON public.rid_drivers USING btree (id)
  ```
- **`rid_drivers_tenant_email_uq`**
  ```sql
  CREATE UNIQUE INDEX rid_drivers_tenant_email_uq ON public.rid_drivers USING btree (tenant_id, email) WHERE (deleted_at IS NULL)
  ```
- **`rid_drivers_tenant_id_idx`**
  ```sql
  CREATE INDEX rid_drivers_tenant_id_idx ON public.rid_drivers USING btree (tenant_id)
  ```
- **`rid_drivers_tenant_license_uq`**
  ```sql
  CREATE UNIQUE INDEX rid_drivers_tenant_license_uq ON public.rid_drivers USING btree (tenant_id, license_number) WHERE (deleted_at IS NULL)
  ```

---

### 78. `sch_goal_achievements`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default             | PK  |
| --- | ------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `goal_id`           | `uuid`                     | ✗        | ``                  |     |
| 3   | `achievement_date`  | `timestamp with time zone` | ✗        | ``                  |     |
| 4   | `final_value`       | `numeric`                  | ✗        | ``                  |     |
| 5   | `threshold_reached` | `goal_threshold`           | ✓        | ``                  |     |
| 6   | `reward_granted`    | `boolean`                  | ✓        | `false`             |     |
| 7   | `reward_amount`     | `numeric`                  | ✓        | ``                  |     |
| 8   | `certificate_url`   | `varchar(500)`             | ✓        | ``                  |     |
| 9   | `notes`             | `text`                     | ✓        | ``                  |     |
| 10  | `metadata`          | `jsonb`                    | ✓        | ``                  |     |
| 11  | `created_at`        | `timestamp with time zone` | ✓        | `now()`             |     |
| 12  | `created_by`        | `uuid`                     | ✗        | ``                  |     |

#### Foreign Keys

| Column    | References     | On Update | On Delete |
| --------- | -------------- | --------- | --------- |
| `goal_id` | `sch_goals.id` | NO ACTION | CASCADE   |

#### Indexes

- **`idx_goal_achievements_date`**
  ```sql
  CREATE INDEX idx_goal_achievements_date ON public.sch_goal_achievements USING btree (achievement_date)
  ```
- **`idx_goal_achievements_goal_date`**
  ```sql
  CREATE INDEX idx_goal_achievements_goal_date ON public.sch_goal_achievements USING btree (goal_id, achievement_date)
  ```
- **`idx_goal_achievements_reward`**
  ```sql
  CREATE INDEX idx_goal_achievements_reward ON public.sch_goal_achievements USING btree (reward_granted)
  ```
- **`sch_goal_achievements_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_goal_achievements_pkey ON public.sch_goal_achievements USING btree (id)
  ```

---

### 79. `sch_goal_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column               | Type                       | Nullable | Default             | PK  |
| --- | -------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                 | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`          | `uuid`                     | ✗        | ``                  |     |
| 3   | `code`               | `varchar(50)`              | ✗        | ``                  |     |
| 4   | `label`              | `varchar(255)`             | ✗        | ``                  |     |
| 5   | `category`           | `goal_category`            | ✗        | ``                  |     |
| 6   | `unit`               | `varchar(50)`              | ✗        | ``                  |     |
| 7   | `calculation_method` | `text`                     | ✓        | ``                  |     |
| 8   | `data_source_table`  | `varchar(100)`             | ✓        | ``                  |     |
| 9   | `data_source_field`  | `varchar(100)`             | ✓        | ``                  |     |
| 10  | `aggregation_type`   | `aggregation_type`         | ✓        | ``                  |     |
| 11  | `is_higher_better`   | `boolean`                  | ✓        | `true`              |     |
| 12  | `icon`               | `varchar(50)`              | ✓        | ``                  |     |
| 13  | `color`              | `varchar(20)`              | ✓        | ``                  |     |
| 14  | `metadata`           | `jsonb`                    | ✓        | ``                  |     |
| 15  | `created_at`         | `timestamp with time zone` | ✗        | `now()`             |     |
| 16  | `updated_at`         | `timestamp with time zone` | ✗        | `now()`             |     |
| 17  | `created_by`         | `uuid`                     | ✗        | ``                  |     |
| 18  | `updated_by`         | `uuid`                     | ✓        | ``                  |     |
| 19  | `deleted_at`         | `timestamp with time zone` | ✓        | ``                  |     |
| 20  | `deleted_by`         | `uuid`                     | ✓        | ``                  |     |
| 21  | `deletion_reason`    | `text`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column      | References       | On Update | On Delete |
| ----------- | ---------------- | --------- | --------- |
| `tenant_id` | `adm_tenants.id` | NO ACTION | CASCADE   |

#### Indexes

- **`idx_goal_types_category`**
  ```sql
  CREATE INDEX idx_goal_types_category ON public.sch_goal_types USING btree (category)
  ```
- **`idx_goal_types_deleted`**
  ```sql
  CREATE INDEX idx_goal_types_deleted ON public.sch_goal_types USING btree (deleted_at)
  ```
- **`idx_sch_goal_types_tenant_code_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_sch_goal_types_tenant_code_unique ON public.sch_goal_types USING btree (tenant_id, code) WHERE (deleted_at IS NULL)
  ```
- **`sch_goal_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_goal_types_pkey ON public.sch_goal_types USING btree (id)
  ```

---

### 80. `sch_goals`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                        | Type                       | Nullable | Default                 | PK  |
| --- | ----------------------------- | -------------------------- | -------- | ----------------------- | --- |
| 1   | `id`                          | `uuid`                     | ✗        | `uuid_generate_v4()`    | 🔑  |
| 2   | `tenant_id`                   | `uuid`                     | ✗        | ``                      |     |
| 3   | `goal_type`                   | `text`                     | ✗        | ``                      |     |
| 4   | `target_value`                | `numeric`                  | ✗        | ``                      |     |
| 5   | `period_start`                | `date`                     | ✗        | ``                      |     |
| 6   | `period_end`                  | `date`                     | ✗        | ``                      |     |
| 7   | `assigned_to`                 | `uuid`                     | ✗        | ``                      |     |
| 9   | `metadata`                    | `jsonb`                    | ✗        | `'{}'::jsonb`           |     |
| 10  | `created_at`                  | `timestamp with time zone` | ✗        | `now()`                 |     |
| 11  | `created_by`                  | `uuid`                     | ✓        | ``                      |     |
| 12  | `updated_at`                  | `timestamp with time zone` | ✗        | `now()`                 |     |
| 13  | `updated_by`                  | `uuid`                     | ✓        | ``                      |     |
| 14  | `deleted_at`                  | `timestamp with time zone` | ✓        | ``                      |     |
| 15  | `deleted_by`                  | `uuid`                     | ✓        | ``                      |     |
| 16  | `deletion_reason`             | `text`                     | ✓        | ``                      |     |
| 17  | `goal_type_id`                | `uuid`                     | ✓        | ``                      |     |
| 18  | `goal_category`               | `goal_category`            | ✓        | ``                      |     |
| 19  | `target_type`                 | `goal_target_type`         | ✓        | ``                      |     |
| 20  | `target_entity_type`          | `varchar(50)`              | ✓        | ``                      |     |
| 21  | `target_entity_id`            | `uuid`                     | ✓        | ``                      |     |
| 22  | `period_type`                 | `goal_period_type`         | ✓        | ``                      |     |
| 23  | `recurrence_pattern`          | `varchar(100)`             | ✓        | ``                      |     |
| 24  | `current_value`               | `numeric`                  | ✓        | `0`                     |     |
| 25  | `progress_percent`            | `numeric`                  | ✓        | ``                      |     |
| 26  | `unit`                        | `varchar(50)`              | ✓        | ``                      |     |
| 27  | `weight`                      | `numeric`                  | ✓        | `1.0`                   |     |
| 28  | `reward_type`                 | `goal_reward_type`         | ✓        | ``                      |     |
| 29  | `reward_amount`               | `numeric`                  | ✓        | ``                      |     |
| 30  | `threshold_bronze`            | `numeric`                  | ✓        | ``                      |     |
| 31  | `threshold_silver`            | `numeric`                  | ✓        | ``                      |     |
| 32  | `threshold_gold`              | `numeric`                  | ✓        | ``                      |     |
| 33  | `achievement_date`            | `timestamp with time zone` | ✓        | ``                      |     |
| 34  | `last_calculated_at`          | `timestamp with time zone` | ✓        | ``                      |     |
| 35  | `last_notified_at`            | `timestamp with time zone` | ✓        | ``                      |     |
| 36  | `notification_frequency_days` | `integer`                  | ✓        | ``                      |     |
| 37  | `status`                      | `goal_status`              | ✓        | `'active'::goal_status` |     |
| 38  | `notes`                       | `text`                     | ✓        | ``                      |     |

#### Foreign Keys

| Column         | References          | On Update | On Delete |
| -------------- | ------------------- | --------- | --------- |
| `created_by`   | `adm_members.id`    | CASCADE   | SET NULL  |
| `deleted_by`   | `adm_members.id`    | CASCADE   | SET NULL  |
| `goal_type_id` | `sch_goal_types.id` | NO ACTION | SET NULL  |
| `tenant_id`    | `adm_tenants.id`    | NO ACTION | CASCADE   |
| `tenant_id`    | `adm_tenants.id`    | CASCADE   | CASCADE   |
| `updated_by`   | `adm_members.id`    | CASCADE   | SET NULL  |

#### Indexes

- **`idx_goals_achievement_date`**
  ```sql
  CREATE INDEX idx_goals_achievement_date ON public.sch_goals USING btree (achievement_date)
  ```
- **`idx_goals_progress_status`**
  ```sql
  CREATE INDEX idx_goals_progress_status ON public.sch_goals USING btree (progress_percent, status)
  ```
- **`idx_goals_status_deleted`**
  ```sql
  CREATE INDEX idx_goals_status_deleted ON public.sch_goals USING btree (status, deleted_at)
  ```
- **`idx_goals_target_entity_status`**
  ```sql
  CREATE INDEX idx_goals_target_entity_status ON public.sch_goals USING btree (target_entity_type, target_entity_id, status)
  ```
- **`idx_sch_goals_tenant`**
  ```sql
  CREATE INDEX idx_sch_goals_tenant ON public.sch_goals USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`sch_goals_assigned_to_idx`**
  ```sql
  CREATE INDEX sch_goals_assigned_to_idx ON public.sch_goals USING btree (assigned_to)
  ```
- **`sch_goals_created_by_idx`**
  ```sql
  CREATE INDEX sch_goals_created_by_idx ON public.sch_goals USING btree (created_by)
  ```
- **`sch_goals_deleted_at_idx`**
  ```sql
  CREATE INDEX sch_goals_deleted_at_idx ON public.sch_goals USING btree (deleted_at)
  ```
- **`sch_goals_goal_type_idx`**
  ```sql
  CREATE INDEX sch_goals_goal_type_idx ON public.sch_goals USING btree (goal_type)
  ```
- **`sch_goals_metadata_gin`**
  ```sql
  CREATE INDEX sch_goals_metadata_gin ON public.sch_goals USING gin (metadata)
  ```
- **`sch_goals_period_end_idx`**
  ```sql
  CREATE INDEX sch_goals_period_end_idx ON public.sch_goals USING btree (period_end)
  ```
- **`sch_goals_period_start_idx`**
  ```sql
  CREATE INDEX sch_goals_period_start_idx ON public.sch_goals USING btree (period_start)
  ```
- **`sch_goals_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_goals_pkey ON public.sch_goals USING btree (id)
  ```
- **`sch_goals_tenant_id_idx`**
  ```sql
  CREATE INDEX sch_goals_tenant_id_idx ON public.sch_goals USING btree (tenant_id)
  ```
- **`sch_goals_tenant_type_period_assigned_unique`**
  ```sql
  CREATE UNIQUE INDEX sch_goals_tenant_type_period_assigned_unique ON public.sch_goals USING btree (tenant_id, goal_type, period_start, assigned_to) WHERE (deleted_at IS NULL)
  ```
- **`sch_goals_updated_by_idx`**
  ```sql
  CREATE INDEX sch_goals_updated_by_idx ON public.sch_goals USING btree (updated_by)
  ```

---

### 81. `sch_locations`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column            | Type                       | Nullable | Default             | PK  |
| --- | ----------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`              | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`       | `uuid`                     | ✗        | ``                  |     |
| 3   | `name`            | `varchar(255)`             | ✗        | ``                  |     |
| 4   | `code`            | `varchar(50)`              | ✗        | ``                  |     |
| 5   | `polygon`         | `jsonb`                    | ✓        | ``                  |     |
| 6   | `city`            | `varchar(100)`             | ✓        | ``                  |     |
| 7   | `country`         | `varchar(100)`             | ✓        | ``                  |     |
| 8   | `description`     | `text`                     | ✓        | ``                  |     |
| 9   | `is_active`       | `boolean`                  | ✓        | `true`              |     |
| 10  | `metadata`        | `jsonb`                    | ✓        | ``                  |     |
| 11  | `created_at`      | `timestamp with time zone` | ✗        | `now()`             |     |
| 12  | `updated_at`      | `timestamp with time zone` | ✗        | `now()`             |     |
| 13  | `created_by`      | `uuid`                     | ✗        | ``                  |     |
| 14  | `updated_by`      | `uuid`                     | ✓        | ``                  |     |
| 15  | `deleted_at`      | `timestamp with time zone` | ✓        | ``                  |     |
| 16  | `deleted_by`      | `uuid`                     | ✓        | ``                  |     |
| 17  | `deletion_reason` | `text`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column      | References       | On Update | On Delete |
| ----------- | ---------------- | --------- | --------- |
| `tenant_id` | `adm_tenants.id` | NO ACTION | CASCADE   |

#### Indexes

- **`idx_locations_active_deleted`**
  ```sql
  CREATE INDEX idx_locations_active_deleted ON public.sch_locations USING btree (is_active, deleted_at)
  ```
- **`idx_locations_city_country`**
  ```sql
  CREATE INDEX idx_locations_city_country ON public.sch_locations USING btree (city, country)
  ```
- **`idx_sch_locations_tenant_code_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_sch_locations_tenant_code_unique ON public.sch_locations USING btree (tenant_id, code) WHERE (deleted_at IS NULL)
  ```
- **`sch_locations_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_locations_pkey ON public.sch_locations USING btree (id)
  ```

---

### 82. `sch_maintenance_schedules`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                     | Type                       | Nullable | Default                           | PK  |
| --- | -------------------------- | -------------------------- | -------- | --------------------------------- | --- |
| 1   | `id`                       | `uuid`                     | ✗        | `uuid_generate_v4()`              | 🔑  |
| 2   | `tenant_id`                | `uuid`                     | ✗        | ``                                |     |
| 3   | `vehicle_id`               | `uuid`                     | ✗        | ``                                |     |
| 4   | `scheduled_date`           | `date`                     | ✗        | ``                                |     |
| 5   | `maintenance_type`         | `text`                     | ✗        | ``                                |     |
| 7   | `metadata`                 | `jsonb`                    | ✗        | `'{}'::jsonb`                     |     |
| 8   | `created_at`               | `timestamp with time zone` | ✗        | `now()`                           |     |
| 9   | `created_by`               | `uuid`                     | ✓        | ``                                |     |
| 10  | `updated_at`               | `timestamp with time zone` | ✗        | `now()`                           |     |
| 11  | `updated_by`               | `uuid`                     | ✓        | ``                                |     |
| 12  | `deleted_at`               | `timestamp with time zone` | ✓        | ``                                |     |
| 13  | `deleted_by`               | `uuid`                     | ✓        | ``                                |     |
| 14  | `deletion_reason`          | `text`                     | ✓        | ``                                |     |
| 15  | `maintenance_type_id`      | `uuid`                     | ✓        | ``                                |     |
| 16  | `scheduled_by`             | `uuid`                     | ✓        | ``                                |     |
| 17  | `estimated_duration_hours` | `numeric`                  | ✓        | ``                                |     |
| 18  | `estimated_cost`           | `numeric`                  | ✓        | ``                                |     |
| 19  | `odometer_reading`         | `integer`                  | ✓        | ``                                |     |
| 20  | `trigger_type`             | `maintenance_trigger_type` | ✓        | ``                                |     |
| 21  | `reminder_sent_at`         | `timestamp with time zone` | ✓        | ``                                |     |
| 22  | `reminder_count`           | `integer`                  | ✓        | `0`                               |     |
| 23  | `completed_maintenance_id` | `uuid`                     | ✓        | ``                                |     |
| 24  | `rescheduled_from`         | `uuid`                     | ✓        | ``                                |     |
| 25  | `rescheduled_reason`       | `text`                     | ✓        | ``                                |     |
| 26  | `blocking_operations`      | `boolean`                  | ✓        | `false`                           |     |
| 27  | `required_parts`           | `jsonb`                    | ✓        | ``                                |     |
| 28  | `assigned_garage`          | `varchar(255)`             | ✓        | ``                                |     |
| 29  | `garage_contact`           | `varchar(255)`             | ✓        | ``                                |     |
| 30  | `notes`                    | `text`                     | ✓        | ``                                |     |
| 31  | `status`                   | `maintenance_status`       | ✓        | `'scheduled'::maintenance_status` |     |

#### Foreign Keys

| Column                     | References                     | On Update | On Delete |
| -------------------------- | ------------------------------ | --------- | --------- |
| `completed_maintenance_id` | `flt_vehicle_maintenance.id`   | NO ACTION | SET NULL  |
| `created_by`               | `adm_members.id`               | CASCADE   | SET NULL  |
| `deleted_by`               | `adm_members.id`               | CASCADE   | SET NULL  |
| `maintenance_type_id`      | `dir_maintenance_types.id`     | NO ACTION | SET NULL  |
| `rescheduled_from`         | `sch_maintenance_schedules.id` | NO ACTION | SET NULL  |
| `scheduled_by`             | `adm_members.id`               | NO ACTION | SET NULL  |
| `tenant_id`                | `adm_tenants.id`               | CASCADE   | CASCADE   |
| `tenant_id`                | `adm_tenants.id`               | NO ACTION | CASCADE   |
| `updated_by`               | `adm_members.id`               | CASCADE   | SET NULL  |
| `vehicle_id`               | `flt_vehicles.id`              | CASCADE   | CASCADE   |
| `vehicle_id`               | `flt_vehicles.id`              | NO ACTION | CASCADE   |

#### Indexes

- **`idx_maintenance_schedules_odometer`**
  ```sql
  CREATE INDEX idx_maintenance_schedules_odometer ON public.sch_maintenance_schedules USING btree (odometer_reading)
  ```
- **`idx_maintenance_schedules_reminder_sent`**
  ```sql
  CREATE INDEX idx_maintenance_schedules_reminder_sent ON public.sch_maintenance_schedules USING btree (reminder_sent_at)
  ```
- **`idx_maintenance_schedules_status_deleted`**
  ```sql
  CREATE INDEX idx_maintenance_schedules_status_deleted ON public.sch_maintenance_schedules USING btree (status, deleted_at)
  ```
- **`idx_maintenance_schedules_vehicle_date_status`**
  ```sql
  CREATE INDEX idx_maintenance_schedules_vehicle_date_status ON public.sch_maintenance_schedules USING btree (vehicle_id, scheduled_date, status)
  ```
- **`sch_maintenance_schedules_created_by_idx`**
  ```sql
  CREATE INDEX sch_maintenance_schedules_created_by_idx ON public.sch_maintenance_schedules USING btree (created_by)
  ```
- **`sch_maintenance_schedules_deleted_at_idx`**
  ```sql
  CREATE INDEX sch_maintenance_schedules_deleted_at_idx ON public.sch_maintenance_schedules USING btree (deleted_at)
  ```
- **`sch_maintenance_schedules_maintenance_type_idx`**
  ```sql
  CREATE INDEX sch_maintenance_schedules_maintenance_type_idx ON public.sch_maintenance_schedules USING btree (maintenance_type)
  ```
- **`sch_maintenance_schedules_metadata_gin`**
  ```sql
  CREATE INDEX sch_maintenance_schedules_metadata_gin ON public.sch_maintenance_schedules USING gin (metadata)
  ```
- **`sch_maintenance_schedules_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_maintenance_schedules_pkey ON public.sch_maintenance_schedules USING btree (id)
  ```
- **`sch_maintenance_schedules_scheduled_date_idx`**
  ```sql
  CREATE INDEX sch_maintenance_schedules_scheduled_date_idx ON public.sch_maintenance_schedules USING btree (scheduled_date)
  ```
- **`sch_maintenance_schedules_tenant_id_idx`**
  ```sql
  CREATE INDEX sch_maintenance_schedules_tenant_id_idx ON public.sch_maintenance_schedules USING btree (tenant_id)
  ```
- **`sch_maintenance_schedules_tenant_vehicle_date_type_unique`**
  ```sql
  CREATE UNIQUE INDEX sch_maintenance_schedules_tenant_vehicle_date_type_unique ON public.sch_maintenance_schedules USING btree (tenant_id, vehicle_id, scheduled_date, maintenance_type) WHERE (deleted_at IS NULL)
  ```
- **`sch_maintenance_schedules_updated_by_idx`**
  ```sql
  CREATE INDEX sch_maintenance_schedules_updated_by_idx ON public.sch_maintenance_schedules USING btree (updated_by)
  ```
- **`sch_maintenance_schedules_vehicle_id_idx`**
  ```sql
  CREATE INDEX sch_maintenance_schedules_vehicle_id_idx ON public.sch_maintenance_schedules USING btree (vehicle_id)
  ```

---

### 83. `sch_shift_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column            | Type                       | Nullable | Default             | PK  |
| --- | ----------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`              | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`       | `uuid`                     | ✗        | ``                  |     |
| 3   | `code`            | `varchar(50)`              | ✗        | ``                  |     |
| 4   | `label`           | `varchar(255)`             | ✗        | ``                  |     |
| 5   | `pay_multiplier`  | `numeric`                  | ✗        | ``                  |     |
| 6   | `color_code`      | `varchar(20)`              | ✓        | ``                  |     |
| 7   | `is_active`       | `boolean`                  | ✓        | `true`              |     |
| 8   | `metadata`        | `jsonb`                    | ✓        | ``                  |     |
| 9   | `created_at`      | `timestamp with time zone` | ✗        | `now()`             |     |
| 10  | `updated_at`      | `timestamp with time zone` | ✗        | `now()`             |     |
| 11  | `created_by`      | `uuid`                     | ✗        | ``                  |     |
| 12  | `updated_by`      | `uuid`                     | ✓        | ``                  |     |
| 13  | `deleted_at`      | `timestamp with time zone` | ✓        | ``                  |     |
| 14  | `deleted_by`      | `uuid`                     | ✓        | ``                  |     |
| 15  | `deletion_reason` | `text`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column      | References       | On Update | On Delete |
| ----------- | ---------------- | --------- | --------- |
| `tenant_id` | `adm_tenants.id` | NO ACTION | CASCADE   |

#### Indexes

- **`idx_sch_shift_types_tenant_code_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_sch_shift_types_tenant_code_unique ON public.sch_shift_types USING btree (tenant_id, code) WHERE (deleted_at IS NULL)
  ```
- **`idx_shift_types_active_deleted`**
  ```sql
  CREATE INDEX idx_shift_types_active_deleted ON public.sch_shift_types USING btree (is_active, deleted_at)
  ```
- **`sch_shift_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_shift_types_pkey ON public.sch_shift_types USING btree (id)
  ```

---

### 84. `sch_shifts`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                   | Type                       | Nullable | Default              | PK  |
| --- | ------------------------ | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                     | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`              | `uuid`                     | ✗        | ``                   |     |
| 3   | `driver_id`              | `uuid`                     | ✗        | ``                   |     |
| 4   | `start_time`             | `timestamp with time zone` | ✗        | ``                   |     |
| 5   | `end_time`               | `timestamp with time zone` | ✗        | ``                   |     |
| 7   | `metadata`               | `jsonb`                    | ✗        | `'{}'::jsonb`        |     |
| 8   | `created_at`             | `timestamp with time zone` | ✗        | `now()`              |     |
| 9   | `created_by`             | `uuid`                     | ✓        | ``                   |     |
| 10  | `updated_at`             | `timestamp with time zone` | ✗        | `now()`              |     |
| 11  | `updated_by`             | `uuid`                     | ✓        | ``                   |     |
| 12  | `deleted_at`             | `timestamp with time zone` | ✓        | ``                   |     |
| 13  | `deleted_by`             | `uuid`                     | ✓        | ``                   |     |
| 14  | `deletion_reason`        | `text`                     | ✓        | ``                   |     |
| 15  | `shift_type_id`          | `uuid`                     | ✓        | ``                   |     |
| 16  | `shift_category`         | `varchar(50)`              | ✓        | ``                   |     |
| 17  | `location_id`            | `uuid`                     | ✓        | ``                   |     |
| 18  | `zone_name`              | `varchar(255)`             | ✓        | ``                   |     |
| 19  | `check_in_at`            | `timestamp with time zone` | ✓        | ``                   |     |
| 20  | `check_out_at`           | `timestamp with time zone` | ✓        | ``                   |     |
| 21  | `break_duration_minutes` | `integer`                  | ✓        | ``                   |     |
| 22  | `actual_work_minutes`    | `integer`                  | ✓        | ``                   |     |
| 23  | `pay_multiplier`         | `numeric`                  | ✓        | ``                   |     |
| 24  | `status`                 | `shift_status`             | ✓        | ``                   |     |
| 25  | `approved_by`            | `uuid`                     | ✓        | ``                   |     |
| 26  | `approved_at`            | `timestamp with time zone` | ✓        | ``                   |     |
| 27  | `cancellation_reason`    | `varchar(255)`             | ✓        | ``                   |     |
| 28  | `replacement_driver_id`  | `uuid`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column                  | References           | On Update | On Delete |
| ----------------------- | -------------------- | --------- | --------- |
| `approved_by`           | `adm_members.id`     | NO ACTION | SET NULL  |
| `created_by`            | `adm_members.id`     | CASCADE   | SET NULL  |
| `deleted_by`            | `adm_members.id`     | CASCADE   | SET NULL  |
| `driver_id`             | `rid_drivers.id`     | CASCADE   | CASCADE   |
| `driver_id`             | `rid_drivers.id`     | NO ACTION | CASCADE   |
| `location_id`           | `sch_locations.id`   | NO ACTION | SET NULL  |
| `replacement_driver_id` | `rid_drivers.id`     | NO ACTION | SET NULL  |
| `shift_type_id`         | `sch_shift_types.id` | NO ACTION | SET NULL  |
| `tenant_id`             | `adm_tenants.id`     | NO ACTION | CASCADE   |
| `tenant_id`             | `adm_tenants.id`     | CASCADE   | CASCADE   |
| `updated_by`            | `adm_members.id`     | CASCADE   | SET NULL  |

#### Indexes

- **`idx_sch_shifts_driver`**
  ```sql
  CREATE INDEX idx_sch_shifts_driver ON public.sch_shifts USING btree (driver_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_sch_shifts_metadata`**
  ```sql
  CREATE INDEX idx_sch_shifts_metadata ON public.sch_shifts USING gin (metadata)
  ```
- **`idx_sch_shifts_start_time`**
  ```sql
  CREATE INDEX idx_sch_shifts_start_time ON public.sch_shifts USING btree (start_time DESC)
  ```
- **`idx_sch_shifts_tenant`**
  ```sql
  CREATE INDEX idx_sch_shifts_tenant ON public.sch_shifts USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_shifts_checkin`**
  ```sql
  CREATE INDEX idx_shifts_checkin ON public.sch_shifts USING btree (check_in_at)
  ```
- **`idx_shifts_checkout`**
  ```sql
  CREATE INDEX idx_shifts_checkout ON public.sch_shifts USING btree (check_out_at)
  ```
- **`idx_shifts_driver_checkin`**
  ```sql
  CREATE INDEX idx_shifts_driver_checkin ON public.sch_shifts USING btree (driver_id, check_in_at)
  ```
- **`idx_shifts_shift_type_location`**
  ```sql
  CREATE INDEX idx_shifts_shift_type_location ON public.sch_shifts USING btree (shift_type_id, location_id)
  ```
- **`idx_shifts_status_deleted`**
  ```sql
  CREATE INDEX idx_shifts_status_deleted ON public.sch_shifts USING btree (status, deleted_at)
  ```
- **`sch_shifts_created_by_idx`**
  ```sql
  CREATE INDEX sch_shifts_created_by_idx ON public.sch_shifts USING btree (created_by)
  ```
- **`sch_shifts_deleted_at_idx`**
  ```sql
  CREATE INDEX sch_shifts_deleted_at_idx ON public.sch_shifts USING btree (deleted_at)
  ```
- **`sch_shifts_driver_id_idx`**
  ```sql
  CREATE INDEX sch_shifts_driver_id_idx ON public.sch_shifts USING btree (driver_id)
  ```
- **`sch_shifts_end_time_idx`**
  ```sql
  CREATE INDEX sch_shifts_end_time_idx ON public.sch_shifts USING btree (end_time)
  ```
- **`sch_shifts_metadata_gin`**
  ```sql
  CREATE INDEX sch_shifts_metadata_gin ON public.sch_shifts USING gin (metadata)
  ```
- **`sch_shifts_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_shifts_pkey ON public.sch_shifts USING btree (id)
  ```
- **`sch_shifts_start_time_idx`**
  ```sql
  CREATE INDEX sch_shifts_start_time_idx ON public.sch_shifts USING btree (start_time)
  ```
- **`sch_shifts_tenant_driver_start_unique`**
  ```sql
  CREATE UNIQUE INDEX sch_shifts_tenant_driver_start_unique ON public.sch_shifts USING btree (tenant_id, driver_id, start_time) WHERE (deleted_at IS NULL)
  ```
- **`sch_shifts_tenant_id_idx`**
  ```sql
  CREATE INDEX sch_shifts_tenant_id_idx ON public.sch_shifts USING btree (tenant_id)
  ```
- **`sch_shifts_updated_by_idx`**
  ```sql
  CREATE INDEX sch_shifts_updated_by_idx ON public.sch_shifts USING btree (updated_by)
  ```

---

### 85. `sch_task_comments`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column         | Type                       | Nullable | Default             | PK  |
| --- | -------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`           | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `task_id`      | `uuid`                     | ✗        | ``                  |     |
| 3   | `comment_type` | `task_comment_type`        | ✗        | ``                  |     |
| 4   | `author_id`    | `uuid`                     | ✗        | ``                  |     |
| 5   | `comment_text` | `text`                     | ✗        | ``                  |     |
| 6   | `attachments`  | `jsonb`                    | ✓        | ``                  |     |
| 7   | `is_internal`  | `boolean`                  | ✓        | `false`             |     |
| 8   | `metadata`     | `jsonb`                    | ✓        | ``                  |     |
| 9   | `created_at`   | `timestamp with time zone` | ✓        | `now()`             |     |

#### Foreign Keys

| Column      | References       | On Update | On Delete |
| ----------- | ---------------- | --------- | --------- |
| `author_id` | `adm_members.id` | NO ACTION | CASCADE   |
| `task_id`   | `sch_tasks.id`   | NO ACTION | CASCADE   |

#### Indexes

- **`idx_task_comments_author`**
  ```sql
  CREATE INDEX idx_task_comments_author ON public.sch_task_comments USING btree (author_id)
  ```
- **`idx_task_comments_task_created`**
  ```sql
  CREATE INDEX idx_task_comments_task_created ON public.sch_task_comments USING btree (task_id, created_at)
  ```
- **`idx_task_comments_type`**
  ```sql
  CREATE INDEX idx_task_comments_type ON public.sch_task_comments USING btree (comment_type)
  ```
- **`sch_task_comments_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_task_comments_pkey ON public.sch_task_comments USING btree (id)
  ```

---

### 86. `sch_task_history`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column          | Type                       | Nullable | Default             | PK  |
| --- | --------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`            | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `task_id`       | `uuid`                     | ✗        | ``                  |     |
| 3   | `changed_by`    | `uuid`                     | ✗        | ``                  |     |
| 4   | `change_type`   | `task_change_type`         | ✗        | ``                  |     |
| 5   | `old_values`    | `jsonb`                    | ✓        | ``                  |     |
| 6   | `new_values`    | `jsonb`                    | ✓        | ``                  |     |
| 7   | `change_reason` | `text`                     | ✓        | ``                  |     |
| 8   | `metadata`      | `jsonb`                    | ✓        | ``                  |     |
| 9   | `created_at`    | `timestamp with time zone` | ✓        | `now()`             |     |

#### Foreign Keys

| Column       | References       | On Update | On Delete |
| ------------ | ---------------- | --------- | --------- |
| `changed_by` | `adm_members.id` | NO ACTION | CASCADE   |
| `task_id`    | `sch_tasks.id`   | NO ACTION | CASCADE   |

#### Indexes

- **`idx_task_history_change_type`**
  ```sql
  CREATE INDEX idx_task_history_change_type ON public.sch_task_history USING btree (change_type)
  ```
- **`idx_task_history_changed_by`**
  ```sql
  CREATE INDEX idx_task_history_changed_by ON public.sch_task_history USING btree (changed_by)
  ```
- **`idx_task_history_task_created`**
  ```sql
  CREATE INDEX idx_task_history_task_created ON public.sch_task_history USING btree (task_id, created_at)
  ```
- **`sch_task_history_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_task_history_pkey ON public.sch_task_history USING btree (id)
  ```

---

### 87. `sch_task_types`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                     | Type                       | Nullable | Default             | PK  |
| --- | -------------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                       | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`                | `uuid`                     | ✗        | ``                  |     |
| 3   | `code`                     | `varchar(50)`              | ✗        | ``                  |     |
| 4   | `label`                    | `varchar(255)`             | ✗        | ``                  |     |
| 5   | `category`                 | `task_category`            | ✗        | ``                  |     |
| 6   | `default_priority`         | `task_priority`            | ✓        | ``                  |     |
| 7   | `default_duration_minutes` | `integer`                  | ✓        | ``                  |     |
| 8   | `requires_verification`    | `boolean`                  | ✓        | `false`             |     |
| 9   | `default_checklist`        | `jsonb`                    | ✓        | ``                  |     |
| 10  | `auto_assignment_rule`     | `jsonb`                    | ✓        | ``                  |     |
| 11  | `sla_hours`                | `integer`                  | ✓        | ``                  |     |
| 12  | `escalation_hours`         | `integer`                  | ✓        | ``                  |     |
| 13  | `description_template`     | `text`                     | ✓        | ``                  |     |
| 14  | `metadata`                 | `jsonb`                    | ✓        | ``                  |     |
| 15  | `created_at`               | `timestamp with time zone` | ✗        | `now()`             |     |
| 16  | `updated_at`               | `timestamp with time zone` | ✗        | `now()`             |     |
| 17  | `created_by`               | `uuid`                     | ✗        | ``                  |     |
| 18  | `updated_by`               | `uuid`                     | ✓        | ``                  |     |
| 19  | `deleted_at`               | `timestamp with time zone` | ✓        | ``                  |     |
| 20  | `deleted_by`               | `uuid`                     | ✓        | ``                  |     |
| 21  | `deletion_reason`          | `text`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column      | References       | On Update | On Delete |
| ----------- | ---------------- | --------- | --------- |
| `tenant_id` | `adm_tenants.id` | NO ACTION | CASCADE   |

#### Indexes

- **`idx_sch_task_types_tenant_code_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_sch_task_types_tenant_code_unique ON public.sch_task_types USING btree (tenant_id, code) WHERE (deleted_at IS NULL)
  ```
- **`idx_task_types_category_priority`**
  ```sql
  CREATE INDEX idx_task_types_category_priority ON public.sch_task_types USING btree (category, default_priority)
  ```
- **`idx_task_types_deleted`**
  ```sql
  CREATE INDEX idx_task_types_deleted ON public.sch_task_types USING btree (deleted_at)
  ```
- **`sch_task_types_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_task_types_pkey ON public.sch_task_types USING btree (id)
  ```

---

### 88. `sch_tasks`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                       | Type                       | Nullable | Default                   | PK  |
| --- | ---------------------------- | -------------------------- | -------- | ------------------------- | --- |
| 1   | `id`                         | `uuid`                     | ✗        | `uuid_generate_v4()`      | 🔑  |
| 2   | `tenant_id`                  | `uuid`                     | ✗        | ``                        |     |
| 3   | `task_type`                  | `text`                     | ✗        | ``                        |     |
| 4   | `description`                | `text`                     | ✗        | ``                        |     |
| 5   | `target_id`                  | `uuid`                     | ✗        | ``                        |     |
| 6   | `due_at`                     | `timestamp with time zone` | ✓        | ``                        |     |
| 8   | `metadata`                   | `jsonb`                    | ✗        | `'{}'::jsonb`             |     |
| 9   | `created_at`                 | `timestamp with time zone` | ✗        | `now()`                   |     |
| 10  | `created_by`                 | `uuid`                     | ✓        | ``                        |     |
| 11  | `updated_at`                 | `timestamp with time zone` | ✗        | `now()`                   |     |
| 12  | `updated_by`                 | `uuid`                     | ✓        | ``                        |     |
| 13  | `deleted_at`                 | `timestamp with time zone` | ✓        | ``                        |     |
| 14  | `deleted_by`                 | `uuid`                     | ✓        | ``                        |     |
| 15  | `deletion_reason`            | `text`                     | ✓        | ``                        |     |
| 16  | `task_type_id`               | `uuid`                     | ✓        | ``                        |     |
| 17  | `task_category`              | `task_category`            | ✓        | ``                        |     |
| 18  | `title`                      | `varchar(255)`             | ✓        | ``                        |     |
| 19  | `priority`                   | `task_priority`            | ✓        | `'normal'::task_priority` |     |
| 20  | `assigned_to`                | `uuid`                     | ✓        | ``                        |     |
| 21  | `assigned_at`                | `timestamp with time zone` | ✓        | ``                        |     |
| 22  | `assigned_by`                | `uuid`                     | ✓        | ``                        |     |
| 23  | `target_type`                | `varchar(50)`              | ✓        | ``                        |     |
| 24  | `related_entity_type`        | `varchar(50)`              | ✓        | ``                        |     |
| 25  | `related_entity_id`          | `uuid`                     | ✓        | ``                        |     |
| 26  | `estimated_duration_minutes` | `integer`                  | ✓        | ``                        |     |
| 27  | `actual_duration_minutes`    | `integer`                  | ✓        | ``                        |     |
| 28  | `start_date`                 | `date`                     | ✓        | ``                        |     |
| 29  | `due_date`                   | `date`                     | ✓        | ``                        |     |
| 30  | `completed_at`               | `timestamp with time zone` | ✓        | ``                        |     |
| 31  | `completed_by`               | `uuid`                     | ✓        | ``                        |     |
| 32  | `verification_required`      | `boolean`                  | ✓        | `false`                   |     |
| 33  | `verified_by`                | `uuid`                     | ✓        | ``                        |     |
| 34  | `verified_at`                | `timestamp with time zone` | ✓        | ``                        |     |
| 35  | `is_auto_generated`          | `boolean`                  | ✓        | `false`                   |     |
| 36  | `generation_trigger`         | `varchar(100)`             | ✓        | ``                        |     |
| 37  | `recurrence_pattern`         | `varchar(100)`             | ✓        | ``                        |     |
| 38  | `parent_task_id`             | `uuid`                     | ✓        | ``                        |     |
| 39  | `blocking_tasks`             | `ARRAY`                    | ✓        | ``                        |     |
| 40  | `checklist`                  | `jsonb`                    | ✓        | ``                        |     |
| 41  | `attachments`                | `jsonb`                    | ✓        | ``                        |     |
| 42  | `reminder_sent_at`           | `timestamp with time zone` | ✓        | ``                        |     |
| 43  | `reminder_frequency_days`    | `integer`                  | ✓        | ``                        |     |
| 44  | `escalation_level`           | `integer`                  | ✓        | `0`                       |     |
| 45  | `escalated_to`               | `uuid`                     | ✓        | ``                        |     |
| 46  | `tags`                       | `ARRAY`                    | ✓        | ``                        |     |
| 47  | `status`                     | `task_status`              | ✓        | `'pending'::task_status`  |     |

#### Foreign Keys

| Column           | References          | On Update | On Delete |
| ---------------- | ------------------- | --------- | --------- |
| `assigned_by`    | `adm_members.id`    | NO ACTION | SET NULL  |
| `assigned_to`    | `adm_members.id`    | NO ACTION | SET NULL  |
| `completed_by`   | `adm_members.id`    | NO ACTION | SET NULL  |
| `created_by`     | `adm_members.id`    | CASCADE   | SET NULL  |
| `deleted_by`     | `adm_members.id`    | CASCADE   | SET NULL  |
| `escalated_to`   | `adm_members.id`    | NO ACTION | SET NULL  |
| `parent_task_id` | `sch_tasks.id`      | NO ACTION | SET NULL  |
| `task_type_id`   | `sch_task_types.id` | NO ACTION | SET NULL  |
| `tenant_id`      | `adm_tenants.id`    | NO ACTION | CASCADE   |
| `tenant_id`      | `adm_tenants.id`    | CASCADE   | CASCADE   |
| `updated_by`     | `adm_members.id`    | CASCADE   | SET NULL  |
| `verified_by`    | `adm_members.id`    | NO ACTION | SET NULL  |

#### Indexes

- **`idx_sch_tasks_assigned`**
  ```sql
  CREATE INDEX idx_sch_tasks_assigned ON public.sch_tasks USING btree (tenant_id, assigned_to, status) WHERE (deleted_at IS NULL)
  ```
- **`idx_sch_tasks_created_by`**
  ```sql
  CREATE INDEX idx_sch_tasks_created_by ON public.sch_tasks USING btree (created_by)
  ```
- **`idx_sch_tasks_deleted_at`**
  ```sql
  CREATE INDEX idx_sch_tasks_deleted_at ON public.sch_tasks USING btree (deleted_at)
  ```
- **`idx_sch_tasks_due_at`**
  ```sql
  CREATE INDEX idx_sch_tasks_due_at ON public.sch_tasks USING btree (due_at)
  ```
- **`idx_sch_tasks_metadata`**
  ```sql
  CREATE INDEX idx_sch_tasks_metadata ON public.sch_tasks USING gin (metadata)
  ```
- **`idx_sch_tasks_target_id`**
  ```sql
  CREATE INDEX idx_sch_tasks_target_id ON public.sch_tasks USING btree (target_id)
  ```
- **`idx_sch_tasks_task_type_active`**
  ```sql
  CREATE INDEX idx_sch_tasks_task_type_active ON public.sch_tasks USING btree (task_type) WHERE (deleted_at IS NULL)
  ```
- **`idx_sch_tasks_tenant`**
  ```sql
  CREATE INDEX idx_sch_tasks_tenant ON public.sch_tasks USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_sch_tasks_tenant_id`**
  ```sql
  CREATE INDEX idx_sch_tasks_tenant_id ON public.sch_tasks USING btree (tenant_id)
  ```
- **`idx_sch_tasks_updated_by`**
  ```sql
  CREATE INDEX idx_sch_tasks_updated_by ON public.sch_tasks USING btree (updated_by)
  ```
- **`idx_tasks_assigned_status_due`**
  ```sql
  CREATE INDEX idx_tasks_assigned_status_due ON public.sch_tasks USING btree (assigned_to, status, due_date)
  ```
- **`idx_tasks_auto_generated`**
  ```sql
  CREATE INDEX idx_tasks_auto_generated ON public.sch_tasks USING btree (is_auto_generated, generation_trigger)
  ```
- **`idx_tasks_category_priority`**
  ```sql
  CREATE INDEX idx_tasks_category_priority ON public.sch_tasks USING btree (task_category, priority)
  ```
- **`idx_tasks_status_deleted`**
  ```sql
  CREATE INDEX idx_tasks_status_deleted ON public.sch_tasks USING btree (status, deleted_at)
  ```
- **`idx_tasks_tags`**
  ```sql
  CREATE INDEX idx_tasks_tags ON public.sch_tasks USING gin (tags)
  ```
- **`idx_tasks_target`**
  ```sql
  CREATE INDEX idx_tasks_target ON public.sch_tasks USING btree (target_type, target_id, status)
  ```
- **`sch_tasks_pkey`**
  ```sql
  CREATE UNIQUE INDEX sch_tasks_pkey ON public.sch_tasks USING btree (id)
  ```

---

### 89. `sup_canned_responses`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column         | Type                       | Nullable | Default             | PK  |
| --- | -------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`           | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`    | `uuid`                     | ✗        | ``                  |     |
| 3   | `title`        | `varchar(255)`             | ✗        | ``                  |     |
| 4   | `content`      | `text`                     | ✗        | ``                  |     |
| 5   | `category`     | `varchar(100)`             | ✓        | ``                  |     |
| 6   | `language`     | `varchar(10)`              | ✗        | ``                  |     |
| 7   | `usage_count`  | `integer`                  | ✗        | `0`                 |     |
| 8   | `last_used_at` | `timestamp with time zone` | ✓        | ``                  |     |
| 9   | `is_active`    | `boolean`                  | ✗        | `true`              |     |
| 10  | `created_at`   | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP` |     |
| 11  | `updated_at`   | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP` |     |
| 12  | `created_by`   | `uuid`                     | ✗        | ``                  |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `created_by` | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `tenant_id`  | `adm_tenants.id`            | NO ACTION | CASCADE   |

#### Indexes

- **`idx_sup_responses_language`**
  ```sql
  CREATE INDEX idx_sup_responses_language ON public.sup_canned_responses USING btree (language)
  ```
- **`idx_sup_responses_popularity`**
  ```sql
  CREATE INDEX idx_sup_responses_popularity ON public.sup_canned_responses USING btree (usage_count)
  ```
- **`idx_sup_responses_tenant`**
  ```sql
  CREATE INDEX idx_sup_responses_tenant ON public.sup_canned_responses USING btree (tenant_id, category, is_active)
  ```
- **`sup_canned_responses_pkey`**
  ```sql
  CREATE UNIQUE INDEX sup_canned_responses_pkey ON public.sup_canned_responses USING btree (id)
  ```

---

### 90. `sup_customer_feedback`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                         | Type                       | Nullable | Default                 | PK  |
| --- | ------------------------------ | -------------------------- | -------- | ----------------------- | --- |
| 1   | `id`                           | `uuid`                     | ✗        | `uuid_generate_v4()`    | 🔑  |
| 2   | `tenant_id`                    | `uuid`                     | ✗        | ``                      |     |
| 3   | `submitted_by`                 | `uuid`                     | ✗        | ``                      |     |
| 5   | `feedback_text`                | `text`                     | ✗        | ``                      |     |
| 6   | `rating`                       | `integer`                  | ✗        | ``                      |     |
| 7   | `metadata`                     | `jsonb`                    | ✓        | `'{}'::jsonb`           |     |
| 8   | `created_by`                   | `uuid`                     | ✓        | ``                      |     |
| 9   | `created_at`                   | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`     |     |
| 10  | `updated_by`                   | `uuid`                     | ✓        | ``                      |     |
| 11  | `updated_at`                   | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`     |     |
| 12  | `deleted_by`                   | `uuid`                     | ✓        | ``                      |     |
| 13  | `deleted_at`                   | `timestamp with time zone` | ✓        | ``                      |     |
| 14  | `ticket_id`                    | `uuid`                     | ✓        | ``                      |     |
| 15  | `driver_id`                    | `uuid`                     | ✓        | ``                      |     |
| 16  | `service_type`                 | `service_type`             | ✓        | `'other'::service_type` |     |
| 17  | `language`                     | `varchar(10)`              | ✓        | ``                      |     |
| 18  | `sentiment_score`              | `double precision`         | ✓        | ``                      |     |
| 19  | `is_anonymous`                 | `boolean`                  | ✓        | `false`                 |     |
| 20  | `category`                     | `varchar(100)`             | ✓        | ``                      |     |
| 21  | `tags`                         | `ARRAY`                    | ✓        | `'{}'::text[]`          |     |
| 22  | `overall_rating`               | `integer`                  | ✓        | ``                      |     |
| 23  | `response_time_rating`         | `integer`                  | ✓        | ``                      |     |
| 24  | `resolution_quality_rating`    | `integer`                  | ✓        | ``                      |     |
| 25  | `agent_professionalism_rating` | `integer`                  | ✓        | ``                      |     |
| 26  | `submitter_type`               | `submitter_type`           | ✓        | ``                      |     |

#### Foreign Keys

| Column      | References       | On Update | On Delete |
| ----------- | ---------------- | --------- | --------- |
| `driver_id` | `rid_drivers.id` | CASCADE   | SET NULL  |
| `driver_id` | `rid_drivers.id` | NO ACTION | SET NULL  |
| `tenant_id` | `adm_tenants.id` | NO ACTION | CASCADE   |
| `ticket_id` | `sup_tickets.id` | NO ACTION | SET NULL  |

#### Indexes

- **`idx_sup_feedback_category`**
  ```sql
  CREATE INDEX idx_sup_feedback_category ON public.sup_customer_feedback USING btree (category, created_at) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_feedback_driver`**
  ```sql
  CREATE INDEX idx_sup_feedback_driver ON public.sup_customer_feedback USING btree (driver_id, created_at) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_feedback_sentiment`**
  ```sql
  CREATE INDEX idx_sup_feedback_sentiment ON public.sup_customer_feedback USING btree (sentiment_score) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_feedback_tags`**
  ```sql
  CREATE INDEX idx_sup_feedback_tags ON public.sup_customer_feedback USING gin (tags) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_feedback_ticket`**
  ```sql
  CREATE INDEX idx_sup_feedback_ticket ON public.sup_customer_feedback USING btree (ticket_id, service_type) WHERE (deleted_at IS NULL)
  ```
- **`sup_customer_feedback_created_at_idx`**
  ```sql
  CREATE INDEX sup_customer_feedback_created_at_idx ON public.sup_customer_feedback USING btree (created_at DESC) WHERE (deleted_at IS NULL)
  ```
- **`sup_customer_feedback_metadata_idx`**
  ```sql
  CREATE INDEX sup_customer_feedback_metadata_idx ON public.sup_customer_feedback USING gin (metadata)
  ```
- **`sup_customer_feedback_pkey`**
  ```sql
  CREATE UNIQUE INDEX sup_customer_feedback_pkey ON public.sup_customer_feedback USING btree (id)
  ```
- **`sup_customer_feedback_rating_idx`**
  ```sql
  CREATE INDEX sup_customer_feedback_rating_idx ON public.sup_customer_feedback USING btree (rating) WHERE (deleted_at IS NULL)
  ```
- **`sup_customer_feedback_tenant_id_idx`**
  ```sql
  CREATE INDEX sup_customer_feedback_tenant_id_idx ON public.sup_customer_feedback USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`sup_customer_feedback_tenant_id_submitted_by_idx`**
  ```sql
  CREATE INDEX sup_customer_feedback_tenant_id_submitted_by_idx ON public.sup_customer_feedback USING btree (tenant_id, submitted_by) WHERE (deleted_at IS NULL)
  ```

---

### 91. `sup_ticket_categories`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                  | Type                       | Nullable | Default             | PK  |
| --- | ----------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                    | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`             | `uuid`                     | ✗        | ``                  |     |
| 3   | `name`                  | `varchar(100)`             | ✗        | ``                  |     |
| 4   | `slug`                  | `varchar(100)`             | ✗        | ``                  |     |
| 5   | `description`           | `text`                     | ✓        | ``                  |     |
| 6   | `parent_category_id`    | `uuid`                     | ✓        | ``                  |     |
| 7   | `default_priority`      | `ticket_priority`          | ✓        | ``                  |     |
| 8   | `default_assigned_team` | `varchar(100)`             | ✓        | ``                  |     |
| 9   | `sla_hours`             | `integer`                  | ✓        | ``                  |     |
| 10  | `is_active`             | `boolean`                  | ✗        | `true`              |     |
| 11  | `display_order`         | `integer`                  | ✗        | `0`                 |     |
| 12  | `created_at`            | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP` |     |
| 13  | `updated_at`            | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP` |     |
| 14  | `created_by`            | `uuid`                     | ✗        | ``                  |     |
| 15  | `updated_by`            | `uuid`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column               | References                  | On Update | On Delete |
| -------------------- | --------------------------- | --------- | --------- |
| `created_by`         | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `parent_category_id` | `sup_ticket_categories.id`  | NO ACTION | SET NULL  |
| `tenant_id`          | `adm_tenants.id`            | NO ACTION | CASCADE   |
| `updated_by`         | `adm_provider_employees.id` | NO ACTION | SET NULL  |

#### Indexes

- **`idx_sup_categories_order`**
  ```sql
  CREATE INDEX idx_sup_categories_order ON public.sup_ticket_categories USING btree (display_order)
  ```
- **`idx_sup_categories_parent`**
  ```sql
  CREATE INDEX idx_sup_categories_parent ON public.sup_ticket_categories USING btree (parent_category_id)
  ```
- **`idx_sup_categories_tenant`**
  ```sql
  CREATE INDEX idx_sup_categories_tenant ON public.sup_ticket_categories USING btree (tenant_id, is_active)
  ```
- **`sup_ticket_categories_pkey`**
  ```sql
  CREATE UNIQUE INDEX sup_ticket_categories_pkey ON public.sup_ticket_categories USING btree (id)
  ```
- **`uq_sup_categories_tenant_slug`**
  ```sql
  CREATE UNIQUE INDEX uq_sup_categories_tenant_slug ON public.sup_ticket_categories USING btree (tenant_id, slug)
  ```

---

### 92. `sup_ticket_messages`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default                  | PK  |
| --- | ------------------- | -------------------------- | -------- | ------------------------ | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()`     | 🔑  |
| 2   | `ticket_id`         | `uuid`                     | ✗        | ``                       |     |
| 3   | `sender_id`         | `uuid`                     | ✗        | ``                       |     |
| 4   | `message_body`      | `text`                     | ✗        | ``                       |     |
| 5   | `sent_at`           | `timestamp with time zone` | ✗        | `now()`                  |     |
| 6   | `metadata`          | `jsonb`                    | ✗        | `'{}'::jsonb`            |     |
| 7   | `created_at`        | `timestamp with time zone` | ✗        | `now()`                  |     |
| 8   | `created_by`        | `uuid`                     | ✓        | ``                       |     |
| 9   | `updated_at`        | `timestamp with time zone` | ✗        | `now()`                  |     |
| 10  | `updated_by`        | `uuid`                     | ✓        | ``                       |     |
| 11  | `deleted_at`        | `timestamp with time zone` | ✓        | ``                       |     |
| 12  | `deleted_by`        | `uuid`                     | ✓        | ``                       |     |
| 13  | `deletion_reason`   | `text`                     | ✓        | ``                       |     |
| 14  | `message_type`      | `message_type`             | ✓        | `'public'::message_type` |     |
| 15  | `parent_message_id` | `uuid`                     | ✓        | ``                       |     |
| 16  | `attachment_url`    | `text`                     | ✓        | ``                       |     |
| 17  | `attachment_type`   | `varchar(50)`              | ✓        | ``                       |     |
| 18  | `language`          | `varchar(10)`              | ✓        | ``                       |     |
| 19  | `sentiment_score`   | `double precision`         | ✓        | ``                       |     |
| 20  | `is_automated`      | `boolean`                  | ✓        | `false`                  |     |
| 21  | `ai_suggestions`    | `jsonb`                    | ✓        | ``                       |     |
| 22  | `translation`       | `jsonb`                    | ✓        | ``                       |     |

#### Foreign Keys

| Column              | References               | On Update | On Delete |
| ------------------- | ------------------------ | --------- | --------- |
| `created_by`        | `adm_members.id`         | CASCADE   | SET NULL  |
| `deleted_by`        | `adm_members.id`         | CASCADE   | SET NULL  |
| `parent_message_id` | `sup_ticket_messages.id` | NO ACTION | SET NULL  |
| `ticket_id`         | `sup_tickets.id`         | CASCADE   | CASCADE   |
| `updated_by`        | `adm_members.id`         | CASCADE   | SET NULL  |

#### Indexes

- **`idx_sup_messages_sender`**
  ```sql
  CREATE INDEX idx_sup_messages_sender ON public.sup_ticket_messages USING btree (sender_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_messages_threading`**
  ```sql
  CREATE INDEX idx_sup_messages_threading ON public.sup_ticket_messages USING btree (ticket_id, parent_message_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_messages_type`**
  ```sql
  CREATE INDEX idx_sup_messages_type ON public.sup_ticket_messages USING btree (message_type, sent_at) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_ticket_messages_ticket`**
  ```sql
  CREATE INDEX idx_sup_ticket_messages_ticket ON public.sup_ticket_messages USING btree (ticket_id)
  ```
- **`sup_ticket_messages_created_by_idx`**
  ```sql
  CREATE INDEX sup_ticket_messages_created_by_idx ON public.sup_ticket_messages USING btree (created_by)
  ```
- **`sup_ticket_messages_deleted_at_idx`**
  ```sql
  CREATE INDEX sup_ticket_messages_deleted_at_idx ON public.sup_ticket_messages USING btree (deleted_at)
  ```
- **`sup_ticket_messages_metadata_idx`**
  ```sql
  CREATE INDEX sup_ticket_messages_metadata_idx ON public.sup_ticket_messages USING gin (metadata)
  ```
- **`sup_ticket_messages_pkey`**
  ```sql
  CREATE UNIQUE INDEX sup_ticket_messages_pkey ON public.sup_ticket_messages USING btree (id)
  ```
- **`sup_ticket_messages_sent_at_idx`**
  ```sql
  CREATE INDEX sup_ticket_messages_sent_at_idx ON public.sup_ticket_messages USING btree (sent_at)
  ```
- **`sup_ticket_messages_ticket_id_idx`**
  ```sql
  CREATE INDEX sup_ticket_messages_ticket_id_idx ON public.sup_ticket_messages USING btree (ticket_id)
  ```
- **`sup_ticket_messages_updated_by_idx`**
  ```sql
  CREATE INDEX sup_ticket_messages_updated_by_idx ON public.sup_ticket_messages USING btree (updated_by)
  ```

---

### 93. `sup_ticket_sla_rules`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                  | Type                       | Nullable | Default             | PK  |
| --- | ----------------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`                    | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `tenant_id`             | `uuid`                     | ✗        | ``                  |     |
| 3   | `category_id`           | `uuid`                     | ✓        | ``                  |     |
| 4   | `priority`              | `ticket_priority`          | ✗        | ``                  |     |
| 5   | `response_time_hours`   | `integer`                  | ✗        | ``                  |     |
| 6   | `resolution_time_hours` | `integer`                  | ✗        | ``                  |     |
| 7   | `escalation_rules`      | `jsonb`                    | ✓        | ``                  |     |
| 8   | `business_hours_only`   | `boolean`                  | ✗        | `false`             |     |
| 9   | `is_active`             | `boolean`                  | ✗        | `true`              |     |
| 10  | `created_at`            | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP` |     |
| 11  | `updated_at`            | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP` |     |
| 12  | `created_by`            | `uuid`                     | ✗        | ``                  |     |
| 13  | `updated_by`            | `uuid`                     | ✓        | ``                  |     |

#### Foreign Keys

| Column        | References                  | On Update | On Delete |
| ------------- | --------------------------- | --------- | --------- |
| `category_id` | `sup_ticket_categories.id`  | NO ACTION | SET NULL  |
| `created_by`  | `adm_provider_employees.id` | NO ACTION | RESTRICT  |
| `tenant_id`   | `adm_tenants.id`            | NO ACTION | CASCADE   |
| `updated_by`  | `adm_provider_employees.id` | NO ACTION | SET NULL  |

#### Indexes

- **`idx_sup_sla_category`**
  ```sql
  CREATE INDEX idx_sup_sla_category ON public.sup_ticket_sla_rules USING btree (category_id)
  ```
- **`idx_sup_sla_priority`**
  ```sql
  CREATE INDEX idx_sup_sla_priority ON public.sup_ticket_sla_rules USING btree (priority)
  ```
- **`idx_sup_sla_tenant`**
  ```sql
  CREATE INDEX idx_sup_sla_tenant ON public.sup_ticket_sla_rules USING btree (tenant_id, is_active)
  ```
- **`sup_ticket_sla_rules_pkey`**
  ```sql
  CREATE UNIQUE INDEX sup_ticket_sla_rules_pkey ON public.sup_ticket_sla_rules USING btree (id)
  ```
- **`uq_sup_sla_tenant_category_priority`**
  ```sql
  CREATE UNIQUE INDEX uq_sup_sla_tenant_category_priority ON public.sup_ticket_sla_rules USING btree (tenant_id, category_id, priority)
  ```

---

### 94. `sup_tickets`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column             | Type                       | Nullable | Default                          | PK  |
| --- | ------------------ | -------------------------- | -------- | -------------------------------- | --- |
| 1   | `id`               | `uuid`                     | ✗        | `uuid_generate_v4()`             | 🔑  |
| 2   | `tenant_id`        | `uuid`                     | ✗        | ``                               |     |
| 3   | `raised_by`        | `uuid`                     | ✗        | ``                               |     |
| 4   | `subject`          | `text`                     | ✗        | ``                               |     |
| 5   | `description`      | `text`                     | ✗        | ``                               |     |
| 8   | `assigned_to`      | `uuid`                     | ✓        | ``                               |     |
| 9   | `metadata`         | `jsonb`                    | ✗        | `'{}'::jsonb`                    |     |
| 10  | `created_at`       | `timestamp with time zone` | ✗        | `now()`                          |     |
| 11  | `created_by`       | `uuid`                     | ✓        | ``                               |     |
| 12  | `updated_at`       | `timestamp with time zone` | ✗        | `now()`                          |     |
| 13  | `updated_by`       | `uuid`                     | ✓        | ``                               |     |
| 14  | `deleted_at`       | `timestamp with time zone` | ✓        | ``                               |     |
| 15  | `deleted_by`       | `uuid`                     | ✓        | ``                               |     |
| 16  | `deletion_reason`  | `text`                     | ✓        | ``                               |     |
| 17  | `category`         | `varchar(100)`             | ✓        | ``                               |     |
| 18  | `sub_category`     | `varchar(100)`             | ✓        | ``                               |     |
| 19  | `language`         | `varchar(10)`              | ✓        | ``                               |     |
| 20  | `source_platform`  | `ticket_source_platform`   | ✓        | `'web'::ticket_source_platform`  |     |
| 21  | `raised_by_type`   | `ticket_raised_by_type`    | ✓        | `'admin'::ticket_raised_by_type` |     |
| 22  | `attachments_url`  | `ARRAY`                    | ✓        | `'{}'::text[]`                   |     |
| 23  | `resolution_notes` | `text`                     | ✓        | ``                               |     |
| 24  | `sla_due_at`       | `timestamp with time zone` | ✓        | ``                               |     |
| 25  | `closed_at`        | `timestamp with time zone` | ✓        | ``                               |     |
| 26  | `status`           | `ticket_status`            | ✓        | `'new'::ticket_status`           |     |
| 27  | `priority`         | `ticket_priority`          | ✓        | `'medium'::ticket_priority`      |     |

#### Foreign Keys

| Column        | References                  | On Update | On Delete |
| ------------- | --------------------------- | --------- | --------- |
| `assigned_to` | `adm_provider_employees.id` | CASCADE   | SET NULL  |
| `created_by`  | `adm_members.id`            | CASCADE   | SET NULL  |
| `deleted_by`  | `adm_members.id`            | CASCADE   | SET NULL  |
| `raised_by`   | `adm_members.id`            | NO ACTION | RESTRICT  |
| `tenant_id`   | `adm_tenants.id`            | CASCADE   | CASCADE   |
| `updated_by`  | `adm_members.id`            | CASCADE   | SET NULL  |

#### Indexes

- **`idx_sup_tickets_analytics`**
  ```sql
  CREATE INDEX idx_sup_tickets_analytics ON public.sup_tickets USING btree (source_platform, raised_by_type) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_tickets_assigned`**
  ```sql
  CREATE INDEX idx_sup_tickets_assigned ON public.sup_tickets USING btree (tenant_id, assigned_to, status) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_tickets_filtering`**
  ```sql
  CREATE INDEX idx_sup_tickets_filtering ON public.sup_tickets USING btree (status, priority) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_tickets_sla`**
  ```sql
  CREATE INDEX idx_sup_tickets_sla ON public.sup_tickets USING btree (category, status, sla_due_at) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_tickets_tenant`**
  ```sql
  CREATE INDEX idx_sup_tickets_tenant ON public.sup_tickets USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_sup_tickets_workload`**
  ```sql
  CREATE INDEX idx_sup_tickets_workload ON public.sup_tickets USING btree (assigned_to, status) WHERE (deleted_at IS NULL)
  ```
- **`sup_tickets_assigned_to_idx`**
  ```sql
  CREATE INDEX sup_tickets_assigned_to_idx ON public.sup_tickets USING btree (assigned_to)
  ```
- **`sup_tickets_created_at_idx`**
  ```sql
  CREATE INDEX sup_tickets_created_at_idx ON public.sup_tickets USING btree (created_at)
  ```
- **`sup_tickets_created_by_idx`**
  ```sql
  CREATE INDEX sup_tickets_created_by_idx ON public.sup_tickets USING btree (created_by)
  ```
- **`sup_tickets_deleted_at_idx`**
  ```sql
  CREATE INDEX sup_tickets_deleted_at_idx ON public.sup_tickets USING btree (deleted_at)
  ```
- **`sup_tickets_metadata_idx`**
  ```sql
  CREATE INDEX sup_tickets_metadata_idx ON public.sup_tickets USING gin (metadata)
  ```
- **`sup_tickets_pkey`**
  ```sql
  CREATE UNIQUE INDEX sup_tickets_pkey ON public.sup_tickets USING btree (id)
  ```
- **`sup_tickets_raised_by_idx`**
  ```sql
  CREATE INDEX sup_tickets_raised_by_idx ON public.sup_tickets USING btree (raised_by)
  ```
- **`sup_tickets_tenant_id_idx`**
  ```sql
  CREATE INDEX sup_tickets_tenant_id_idx ON public.sup_tickets USING btree (tenant_id)
  ```
- **`sup_tickets_tenant_id_raised_by_created_at_deleted_at_key`**
  ```sql
  CREATE UNIQUE INDEX sup_tickets_tenant_id_raised_by_created_at_deleted_at_key ON public.sup_tickets USING btree (tenant_id, raised_by, created_at) WHERE (deleted_at IS NULL)
  ```
- **`sup_tickets_updated_by_idx`**
  ```sql
  CREATE INDEX sup_tickets_updated_by_idx ON public.sup_tickets USING btree (updated_by)
  ```

---

### 95. `trp_client_invoice_lines`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column        | Type                       | Nullable | Default             | PK  |
| --- | ------------- | -------------------------- | -------- | ------------------- | --- |
| 1   | `id`          | `uuid`                     | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `invoice_id`  | `uuid`                     | ✗        | ``                  |     |
| 3   | `line_number` | `integer`                  | ✗        | ``                  |     |
| 4   | `description` | `text`                     | ✗        | ``                  |     |
| 5   | `trip_id`     | `uuid`                     | ✓        | ``                  |     |
| 6   | `quantity`    | `numeric`                  | ✗        | ``                  |     |
| 7   | `unit_price`  | `numeric`                  | ✗        | ``                  |     |
| 8   | `tax_rate`    | `numeric`                  | ✓        | ``                  |     |
| 9   | `line_amount` | `numeric`                  | ✗        | ``                  |     |
| 10  | `metadata`    | `jsonb`                    | ✓        | ``                  |     |
| 11  | `created_at`  | `timestamp with time zone` | ✓        | `now()`             |     |

#### Foreign Keys

| Column       | References               | On Update | On Delete |
| ------------ | ------------------------ | --------- | --------- |
| `invoice_id` | `trp_client_invoices.id` | NO ACTION | CASCADE   |
| `trip_id`    | `trp_trips.id`           | NO ACTION | SET NULL  |

#### Indexes

- **`idx_client_invoice_lines_invoice_line`**
  ```sql
  CREATE INDEX idx_client_invoice_lines_invoice_line ON public.trp_client_invoice_lines USING btree (invoice_id, line_number)
  ```
- **`idx_client_invoice_lines_trip`**
  ```sql
  CREATE INDEX idx_client_invoice_lines_trip ON public.trp_client_invoice_lines USING btree (trip_id)
  ```
- **`trp_client_invoice_lines_pkey`**
  ```sql
  CREATE UNIQUE INDEX trp_client_invoice_lines_pkey ON public.trp_client_invoice_lines USING btree (id)
  ```

---

### 96. `trp_client_invoices`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column              | Type                       | Nullable | Default                       | PK  |
| --- | ------------------- | -------------------------- | -------- | ----------------------------- | --- |
| 1   | `id`                | `uuid`                     | ✗        | `uuid_generate_v4()`          | 🔑  |
| 2   | `tenant_id`         | `uuid`                     | ✗        | ``                            |     |
| 3   | `client_id`         | `uuid`                     | ✗        | ``                            |     |
| 4   | `invoice_number`    | `text`                     | ✗        | ``                            |     |
| 5   | `invoice_date`      | `date`                     | ✗        | ``                            |     |
| 6   | `due_date`          | `date`                     | ✗        | ``                            |     |
| 7   | `total_amount`      | `numeric`                  | ✗        | ``                            |     |
| 8   | `currency`          | `varchar(3)`               | ✗        | ``                            |     |
| 10  | `metadata`          | `jsonb`                    | ✗        | `'{}'::jsonb`                 |     |
| 11  | `created_at`        | `timestamp with time zone` | ✗        | `now()`                       |     |
| 12  | `created_by`        | `uuid`                     | ✓        | ``                            |     |
| 13  | `updated_at`        | `timestamp with time zone` | ✗        | `now()`                       |     |
| 14  | `updated_by`        | `uuid`                     | ✓        | ``                            |     |
| 15  | `deleted_at`        | `timestamp with time zone` | ✓        | ``                            |     |
| 16  | `deleted_by`        | `uuid`                     | ✓        | ``                            |     |
| 17  | `deletion_reason`   | `text`                     | ✓        | ``                            |     |
| 18  | `pricing_plan_id`   | `uuid`                     | ✓        | ``                            |     |
| 19  | `client_po_number`  | `varchar(100)`             | ✓        | ``                            |     |
| 20  | `discount_amount`   | `numeric`                  | ✓        | ``                            |     |
| 21  | `discount_reason`   | `text`                     | ✓        | ``                            |     |
| 22  | `status`            | `trp_invoice_status`       | ✓        | `'draft'::trp_invoice_status` |     |
| 23  | `paid_at`           | `timestamp with time zone` | ✓        | ``                            |     |
| 24  | `payment_reference` | `varchar(255)`             | ✓        | ``                            |     |
| 25  | `payment_method`    | `trp_payment_method`       | ✓        | ``                            |     |

#### Foreign Keys

| Column       | References       | On Update | On Delete |
| ------------ | ---------------- | --------- | --------- |
| `created_by` | `adm_members.id` | CASCADE   | SET NULL  |
| `deleted_by` | `adm_members.id` | CASCADE   | SET NULL  |
| `tenant_id`  | `adm_tenants.id` | NO ACTION | CASCADE   |
| `tenant_id`  | `adm_tenants.id` | CASCADE   | CASCADE   |
| `updated_by` | `adm_members.id` | CASCADE   | SET NULL  |

#### Indexes

- **`idx_client_invoices_client_status_date`**
  ```sql
  CREATE INDEX idx_client_invoices_client_status_date ON public.trp_client_invoices USING btree (client_id, status, invoice_date)
  ```
- **`idx_client_invoices_deleted`**
  ```sql
  CREATE INDEX idx_client_invoices_deleted ON public.trp_client_invoices USING btree (deleted_at)
  ```
- **`idx_client_invoices_paid_at`**
  ```sql
  CREATE INDEX idx_client_invoices_paid_at ON public.trp_client_invoices USING btree (paid_at)
  ```
- **`idx_client_invoices_status_due`**
  ```sql
  CREATE INDEX idx_client_invoices_status_due ON public.trp_client_invoices USING btree (status, due_date)
  ```
- **`idx_trp_client_invoices_client_id`**
  ```sql
  CREATE INDEX idx_trp_client_invoices_client_id ON public.trp_client_invoices USING btree (client_id)
  ```
- **`idx_trp_client_invoices_created_by`**
  ```sql
  CREATE INDEX idx_trp_client_invoices_created_by ON public.trp_client_invoices USING btree (created_by)
  ```
- **`idx_trp_client_invoices_deleted_at`**
  ```sql
  CREATE INDEX idx_trp_client_invoices_deleted_at ON public.trp_client_invoices USING btree (deleted_at)
  ```
- **`idx_trp_client_invoices_due_date`**
  ```sql
  CREATE INDEX idx_trp_client_invoices_due_date ON public.trp_client_invoices USING btree (due_date)
  ```
- **`idx_trp_client_invoices_invoice_date`**
  ```sql
  CREATE INDEX idx_trp_client_invoices_invoice_date ON public.trp_client_invoices USING btree (invoice_date)
  ```
- **`idx_trp_client_invoices_metadata`**
  ```sql
  CREATE INDEX idx_trp_client_invoices_metadata ON public.trp_client_invoices USING gin (metadata)
  ```
- **`idx_trp_client_invoices_tenant_id`**
  ```sql
  CREATE INDEX idx_trp_client_invoices_tenant_id ON public.trp_client_invoices USING btree (tenant_id)
  ```
- **`idx_trp_client_invoices_tenant_invoice_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_trp_client_invoices_tenant_invoice_unique ON public.trp_client_invoices USING btree (tenant_id, invoice_number) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_client_invoices_updated_by`**
  ```sql
  CREATE INDEX idx_trp_client_invoices_updated_by ON public.trp_client_invoices USING btree (updated_by)
  ```
- **`trp_client_invoices_pkey`**
  ```sql
  CREATE UNIQUE INDEX trp_client_invoices_pkey ON public.trp_client_invoices USING btree (id)
  ```

---

### 97. `trp_platform_account_keys`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column          | Type                        | Nullable | Default             | PK  |
| --- | --------------- | --------------------------- | -------- | ------------------- | --- |
| 1   | `id`            | `uuid`                      | ✗        | `gen_random_uuid()` | 🔑  |
| 2   | `account_id`    | `uuid`                      | ✗        | ``                  |     |
| 3   | `key_value`     | `text`                      | ✗        | ``                  |     |
| 4   | `key_type`      | `platform_account_key_type` | ✗        | ``                  |     |
| 5   | `expires_at`    | `timestamp with time zone`  | ✓        | ``                  |     |
| 6   | `is_active`     | `boolean`                   | ✓        | `true`              |     |
| 7   | `last_used_at`  | `timestamp with time zone`  | ✓        | ``                  |     |
| 8   | `created_at`    | `timestamp with time zone`  | ✓        | `now()`             |     |
| 9   | `revoked_at`    | `timestamp with time zone`  | ✓        | ``                  |     |
| 10  | `revoked_by`    | `uuid`                      | ✓        | ``                  |     |
| 11  | `revoke_reason` | `text`                      | ✓        | ``                  |     |

#### Foreign Keys

| Column       | References                  | On Update | On Delete |
| ------------ | --------------------------- | --------- | --------- |
| `account_id` | `trp_platform_accounts.id`  | NO ACTION | CASCADE   |
| `revoked_by` | `adm_provider_employees.id` | NO ACTION | SET NULL  |

#### Indexes

- **`idx_platform_account_keys_account_active`**
  ```sql
  CREATE INDEX idx_platform_account_keys_account_active ON public.trp_platform_account_keys USING btree (account_id, is_active)
  ```
- **`idx_platform_account_keys_expires`**
  ```sql
  CREATE INDEX idx_platform_account_keys_expires ON public.trp_platform_account_keys USING btree (expires_at)
  ```
- **`idx_platform_account_keys_type`**
  ```sql
  CREATE INDEX idx_platform_account_keys_type ON public.trp_platform_account_keys USING btree (key_type)
  ```
- **`trp_platform_account_keys_pkey`**
  ```sql
  CREATE UNIQUE INDEX trp_platform_account_keys_pkey ON public.trp_platform_account_keys USING btree (id)
  ```

---

### 98. `trp_platform_accounts`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column               | Type                       | Nullable | Default                             | PK  |
| --- | -------------------- | -------------------------- | -------- | ----------------------------------- | --- |
| 1   | `id`                 | `uuid`                     | ✗        | `uuid_generate_v4()`                | 🔑  |
| 2   | `tenant_id`          | `uuid`                     | ✗        | ``                                  |     |
| 3   | `platform_id`        | `uuid`                     | ✗        | ``                                  |     |
| 4   | `account_identifier` | `text`                     | ✗        | ``                                  |     |
| 5   | `api_key`            | `text`                     | ✓        | ``                                  |     |
| 6   | `metadata`           | `jsonb`                    | ✗        | `'{}'::jsonb`                       |     |
| 7   | `created_at`         | `timestamp with time zone` | ✗        | `now()`                             |     |
| 8   | `created_by`         | `uuid`                     | ✓        | ``                                  |     |
| 9   | `updated_at`         | `timestamp with time zone` | ✗        | `now()`                             |     |
| 10  | `updated_by`         | `uuid`                     | ✓        | ``                                  |     |
| 11  | `deleted_at`         | `timestamp with time zone` | ✓        | ``                                  |     |
| 12  | `deleted_by`         | `uuid`                     | ✓        | ``                                  |     |
| 13  | `deletion_reason`    | `text`                     | ✓        | ``                                  |     |
| 14  | `account_name`       | `varchar(255)`             | ✓        | ``                                  |     |
| 15  | `status`             | `platform_account_status`  | ✓        | `'active'::platform_account_status` |     |
| 16  | `connected_at`       | `timestamp with time zone` | ✓        | ``                                  |     |
| 17  | `last_sync_at`       | `timestamp with time zone` | ✓        | ``                                  |     |
| 18  | `last_error`         | `text`                     | ✓        | ``                                  |     |
| 19  | `error_count`        | `integer`                  | ✓        | `0`                                 |     |
| 20  | `sync_frequency`     | `varchar(50)`              | ✓        | ``                                  |     |

#### Foreign Keys

| Column        | References         | On Update | On Delete |
| ------------- | ------------------ | --------- | --------- |
| `created_by`  | `adm_members.id`   | CASCADE   | SET NULL  |
| `deleted_by`  | `adm_members.id`   | CASCADE   | SET NULL  |
| `platform_id` | `dir_platforms.id` | NO ACTION | RESTRICT  |
| `platform_id` | `dir_platforms.id` | CASCADE   | CASCADE   |
| `tenant_id`   | `adm_tenants.id`   | NO ACTION | CASCADE   |
| `tenant_id`   | `adm_tenants.id`   | CASCADE   | CASCADE   |
| `updated_by`  | `adm_members.id`   | CASCADE   | SET NULL  |

#### Indexes

- **`idx_platform_accounts_deleted`**
  ```sql
  CREATE INDEX idx_platform_accounts_deleted ON public.trp_platform_accounts USING btree (deleted_at)
  ```
- **`idx_platform_accounts_error_count`**
  ```sql
  CREATE INDEX idx_platform_accounts_error_count ON public.trp_platform_accounts USING btree (error_count)
  ```
- **`idx_platform_accounts_status_sync`**
  ```sql
  CREATE INDEX idx_platform_accounts_status_sync ON public.trp_platform_accounts USING btree (status, last_sync_at)
  ```
- **`idx_trp_platform_accounts_account_identifier`**
  ```sql
  CREATE INDEX idx_trp_platform_accounts_account_identifier ON public.trp_platform_accounts USING btree (account_identifier)
  ```
- **`idx_trp_platform_accounts_created_by`**
  ```sql
  CREATE INDEX idx_trp_platform_accounts_created_by ON public.trp_platform_accounts USING btree (created_by)
  ```
- **`idx_trp_platform_accounts_deleted_at`**
  ```sql
  CREATE INDEX idx_trp_platform_accounts_deleted_at ON public.trp_platform_accounts USING btree (deleted_at)
  ```
- **`idx_trp_platform_accounts_metadata`**
  ```sql
  CREATE INDEX idx_trp_platform_accounts_metadata ON public.trp_platform_accounts USING gin (metadata)
  ```
- **`idx_trp_platform_accounts_platform_id`**
  ```sql
  CREATE INDEX idx_trp_platform_accounts_platform_id ON public.trp_platform_accounts USING btree (platform_id)
  ```
- **`idx_trp_platform_accounts_tenant`**
  ```sql
  CREATE INDEX idx_trp_platform_accounts_tenant ON public.trp_platform_accounts USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_platform_accounts_tenant_id`**
  ```sql
  CREATE INDEX idx_trp_platform_accounts_tenant_id ON public.trp_platform_accounts USING btree (tenant_id)
  ```
- **`idx_trp_platform_accounts_tenant_platform_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_trp_platform_accounts_tenant_platform_unique ON public.trp_platform_accounts USING btree (tenant_id, platform_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_platform_accounts_updated_by`**
  ```sql
  CREATE INDEX idx_trp_platform_accounts_updated_by ON public.trp_platform_accounts USING btree (updated_by)
  ```
- **`trp_platform_accounts_pkey`**
  ```sql
  CREATE UNIQUE INDEX trp_platform_accounts_pkey ON public.trp_platform_accounts USING btree (id)
  ```

---

### 99. `trp_settlements`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                   | Type                       | Nullable | Default                              | PK  |
| --- | ------------------------ | -------------------------- | -------- | ------------------------------------ | --- |
| 1   | `id`                     | `uuid`                     | ✗        | `uuid_generate_v4()`                 | 🔑  |
| 2   | `tenant_id`              | `uuid`                     | ✗        | ``                                   |     |
| 3   | `trip_id`                | `uuid`                     | ✗        | ``                                   |     |
| 4   | `settlement_reference`   | `text`                     | ✗        | ``                                   |     |
| 5   | `amount`                 | `numeric`                  | ✗        | ``                                   |     |
| 6   | `currency`               | `varchar(3)`               | ✗        | ``                                   |     |
| 7   | `platform_commission`    | `numeric`                  | ✗        | ``                                   |     |
| 8   | `net_amount`             | `numeric`                  | ✗        | ``                                   |     |
| 9   | `settlement_date`        | `date`                     | ✗        | ``                                   |     |
| 11  | `metadata`               | `jsonb`                    | ✗        | `'{}'::jsonb`                        |     |
| 12  | `created_at`             | `timestamp with time zone` | ✗        | `now()`                              |     |
| 13  | `created_by`             | `uuid`                     | ✓        | ``                                   |     |
| 14  | `updated_at`             | `timestamp with time zone` | ✗        | `now()`                              |     |
| 15  | `updated_by`             | `uuid`                     | ✓        | ``                                   |     |
| 16  | `deleted_at`             | `timestamp with time zone` | ✓        | ``                                   |     |
| 17  | `deleted_by`             | `uuid`                     | ✓        | ``                                   |     |
| 18  | `deletion_reason`        | `text`                     | ✓        | ``                                   |     |
| 19  | `platform_account_id`    | `uuid`                     | ✓        | ``                                   |     |
| 20  | `settlement_type`        | `settlement_type`          | ✓        | `'platform_payout'::settlement_type` |     |
| 21  | `platform_settlement_id` | `varchar(255)`             | ✓        | ``                                   |     |
| 22  | `commission`             | `numeric`                  | ✓        | ``                                   |     |
| 23  | `tax_amount`             | `numeric`                  | ✓        | ``                                   |     |
| 24  | `tax_rate`               | `numeric`                  | ✓        | ``                                   |     |
| 25  | `exchange_rate`          | `numeric`                  | ✓        | ``                                   |     |
| 26  | `original_currency`      | `char(3)`                  | ✓        | ``                                   |     |
| 27  | `original_amount`        | `numeric`                  | ✓        | ``                                   |     |
| 28  | `status`                 | `settlement_status`        | ✓        | `'pending'::settlement_status`       |     |
| 29  | `paid_at`                | `timestamp with time zone` | ✓        | ``                                   |     |
| 30  | `cancelled_at`           | `timestamp with time zone` | ✓        | ``                                   |     |
| 31  | `reconciled`             | `boolean`                  | ✓        | `false`                              |     |
| 32  | `reconciliation_id`      | `uuid`                     | ✓        | ``                                   |     |

#### Foreign Keys

| Column                | References                 | On Update | On Delete |
| --------------------- | -------------------------- | --------- | --------- |
| `created_by`          | `adm_members.id`           | CASCADE   | SET NULL  |
| `deleted_by`          | `adm_members.id`           | CASCADE   | SET NULL  |
| `platform_account_id` | `trp_platform_accounts.id` | NO ACTION | CASCADE   |
| `reconciliation_id`   | `rev_reconciliations.id`   | CASCADE   | SET NULL  |
| `tenant_id`           | `adm_tenants.id`           | NO ACTION | CASCADE   |
| `tenant_id`           | `adm_tenants.id`           | CASCADE   | CASCADE   |
| `trip_id`             | `trp_trips.id`             | NO ACTION | SET NULL  |
| `trip_id`             | `trp_trips.id`             | CASCADE   | CASCADE   |
| `updated_by`          | `adm_members.id`           | CASCADE   | SET NULL  |

#### Indexes

- **`idx_settlements_deleted`**
  ```sql
  CREATE INDEX idx_settlements_deleted ON public.trp_settlements USING btree (deleted_at)
  ```
- **`idx_settlements_not_reconciled`**
  ```sql
  CREATE INDEX idx_settlements_not_reconciled ON public.trp_settlements USING btree (reconciled)
  ```
- **`idx_settlements_platform_account_date`**
  ```sql
  CREATE INDEX idx_settlements_platform_account_date ON public.trp_settlements USING btree (platform_account_id, settlement_date)
  ```
- **`idx_settlements_platform_settlement_id`**
  ```sql
  CREATE INDEX idx_settlements_platform_settlement_id ON public.trp_settlements USING btree (platform_settlement_id)
  ```
- **`idx_settlements_status_paid`**
  ```sql
  CREATE INDEX idx_settlements_status_paid ON public.trp_settlements USING btree (status, paid_at)
  ```
- **`idx_settlements_trip`**
  ```sql
  CREATE INDEX idx_settlements_trip ON public.trp_settlements USING btree (trip_id)
  ```
- **`idx_trp_settlements_created_by`**
  ```sql
  CREATE INDEX idx_trp_settlements_created_by ON public.trp_settlements USING btree (created_by)
  ```
- **`idx_trp_settlements_deleted_at`**
  ```sql
  CREATE INDEX idx_trp_settlements_deleted_at ON public.trp_settlements USING btree (deleted_at)
  ```
- **`idx_trp_settlements_metadata`**
  ```sql
  CREATE INDEX idx_trp_settlements_metadata ON public.trp_settlements USING gin (metadata)
  ```
- **`idx_trp_settlements_settlement_date`**
  ```sql
  CREATE INDEX idx_trp_settlements_settlement_date ON public.trp_settlements USING btree (settlement_date)
  ```
- **`idx_trp_settlements_tenant`**
  ```sql
  CREATE INDEX idx_trp_settlements_tenant ON public.trp_settlements USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_settlements_tenant_id`**
  ```sql
  CREATE INDEX idx_trp_settlements_tenant_id ON public.trp_settlements USING btree (tenant_id)
  ```
- **`idx_trp_settlements_tenant_trip_ref_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_trp_settlements_tenant_trip_ref_unique ON public.trp_settlements USING btree (tenant_id, trip_id, settlement_reference) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_settlements_trip_id`**
  ```sql
  CREATE INDEX idx_trp_settlements_trip_id ON public.trp_settlements USING btree (trip_id)
  ```
- **`idx_trp_settlements_updated_by`**
  ```sql
  CREATE INDEX idx_trp_settlements_updated_by ON public.trp_settlements USING btree (updated_by)
  ```
- **`trp_settlements_pkey`**
  ```sql
  CREATE UNIQUE INDEX trp_settlements_pkey ON public.trp_settlements USING btree (id)
  ```

---

### 100. `trp_trips`

**Rows**: 0 live, 0 dead

#### Columns

| #   | Column                | Type                       | Nullable | Default              | PK  |
| --- | --------------------- | -------------------------- | -------- | -------------------- | --- |
| 1   | `id`                  | `uuid`                     | ✗        | `uuid_generate_v4()` | 🔑  |
| 2   | `tenant_id`           | `uuid`                     | ✗        | ``                   |     |
| 3   | `driver_id`           | `uuid`                     | ✗        | ``                   |     |
| 4   | `vehicle_id`          | `uuid`                     | ✓        | ``                   |     |
| 5   | `platform_id`         | `uuid`                     | ✓        | ``                   |     |
| 10  | `pickup_latitude`     | `numeric`                  | ✓        | ``                   |     |
| 11  | `pickup_longitude`    | `numeric`                  | ✓        | ``                   |     |
| 12  | `start_time`          | `timestamp with time zone` | ✓        | ``                   |     |
| 14  | `dropoff_latitude`    | `numeric`                  | ✓        | ``                   |     |
| 15  | `dropoff_longitude`   | `numeric`                  | ✓        | ``                   |     |
| 16  | `end_time`            | `timestamp with time zone` | ✓        | ``                   |     |
| 17  | `distance_km`         | `numeric`                  | ✓        | ``                   |     |
| 18  | `duration_minutes`    | `numeric`                  | ✓        | ``                   |     |
| 21  | `payment_method`      | `varchar(50)`              | ✓        | ``                   |     |
| 25  | `platform_commission` | `numeric`                  | ✓        | ``                   |     |
| 26  | `net_earnings`        | `numeric`                  | ✓        | ``                   |     |
| 30  | `created_at`          | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 32  | `updated_at`          | `timestamp with time zone` | ✗        | `CURRENT_TIMESTAMP`  |     |
| 34  | `deleted_at`          | `timestamp with time zone` | ✓        | ``                   |     |
| 37  | `client_id`           | `uuid`                     | ✓        | ``                   |     |
| 38  | `trip_date`           | `date`                     | ✓        | ``                   |     |
| 39  | `fare_base`           | `numeric`                  | ✓        | ``                   |     |
| 40  | `fare_distance`       | `numeric`                  | ✓        | ``                   |     |
| 41  | `fare_time`           | `numeric`                  | ✓        | ``                   |     |
| 42  | `surge_multiplier`    | `numeric`                  | ✓        | ``                   |     |
| 43  | `tip_amount`          | `numeric`                  | ✓        | ``                   |     |
| 44  | `platform_account_id` | `uuid`                     | ✓        | ``                   |     |
| 45  | `platform_trip_id`    | `varchar(255)`             | ✓        | ``                   |     |
| 46  | `requested_at`        | `timestamp with time zone` | ✓        | ``                   |     |
| 47  | `matched_at`          | `timestamp with time zone` | ✓        | ``                   |     |
| 48  | `accepted_at`         | `timestamp with time zone` | ✓        | ``                   |     |
| 49  | `arrived_at`          | `timestamp with time zone` | ✓        | ``                   |     |
| 50  | `started_at`          | `timestamp with time zone` | ✓        | ``                   |     |
| 51  | `finished_at`         | `timestamp with time zone` | ✓        | ``                   |     |
| 52  | `pickup_lat`          | `numeric`                  | ✓        | ``                   |     |
| 53  | `pickup_lng`          | `numeric`                  | ✓        | ``                   |     |
| 54  | `dropoff_lat`         | `numeric`                  | ✓        | ``                   |     |
| 55  | `dropoff_lng`         | `numeric`                  | ✓        | ``                   |     |
| 56  | `distance`            | `numeric`                  | ✓        | ``                   |     |
| 57  | `duration`            | `integer`                  | ✓        | ``                   |     |
| 58  | `base_fare`           | `numeric`                  | ✓        | ``                   |     |
| 59  | `distance_fare`       | `numeric`                  | ✓        | ``                   |     |
| 60  | `time_fare`           | `numeric`                  | ✓        | ``                   |     |
| 61  | `surge_amount`        | `numeric`                  | ✓        | ``                   |     |
| 62  | `total_fare`          | `numeric`                  | ✓        | ``                   |     |
| 63  | `currency`            | `char(3)`                  | ✓        | ``                   |     |
| 64  | `status`              | `trip_status`              | ✓        | ``                   |     |
| 65  | `metadata`            | `jsonb`                    | ✓        | ``                   |     |
| 66  | `created_by`          | `uuid`                     | ✓        | ``                   |     |
| 67  | `updated_by`          | `uuid`                     | ✓        | ``                   |     |
| 68  | `deleted_by`          | `uuid`                     | ✓        | ``                   |     |
| 69  | `deletion_reason`     | `text`                     | ✓        | ``                   |     |

#### Foreign Keys

| Column                | References                 | On Update | On Delete |
| --------------------- | -------------------------- | --------- | --------- |
| `driver_id`           | `rid_drivers.id`           | NO ACTION | SET NULL  |
| `driver_id`           | `rid_drivers.id`           | CASCADE   | CASCADE   |
| `platform_account_id` | `trp_platform_accounts.id` | NO ACTION | CASCADE   |
| `platform_id`         | `dir_platforms.id`         | CASCADE   | RESTRICT  |
| `tenant_id`           | `adm_tenants.id`           | NO ACTION | CASCADE   |
| `tenant_id`           | `adm_tenants.id`           | CASCADE   | CASCADE   |
| `vehicle_id`          | `flt_vehicles.id`          | NO ACTION | SET NULL  |
| `vehicle_id`          | `flt_vehicles.id`          | CASCADE   | SET NULL  |

#### Indexes

- **`idx_trips_driver_status`**
  ```sql
  CREATE INDEX idx_trips_driver_status ON public.trp_trips USING btree (driver_id, status)
  ```
- **`idx_trips_requested_finished`**
  ```sql
  CREATE INDEX idx_trips_requested_finished ON public.trp_trips USING btree (requested_at, finished_at)
  ```
- **`idx_trips_status_deleted`**
  ```sql
  CREATE INDEX idx_trips_status_deleted ON public.trp_trips USING btree (status, deleted_at)
  ```
- **`idx_trips_tenant_status_started`**
  ```sql
  CREATE INDEX idx_trips_tenant_status_started ON public.trp_trips USING btree (tenant_id, status, started_at)
  ```
- **`idx_trips_vehicle_started`**
  ```sql
  CREATE INDEX idx_trips_vehicle_started ON public.trp_trips USING btree (vehicle_id, started_at)
  ```
- **`idx_trp_trips_created_at_desc`**
  ```sql
  CREATE INDEX idx_trp_trips_created_at_desc ON public.trp_trips USING btree (created_at DESC) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_trips_driver`**
  ```sql
  CREATE INDEX idx_trp_trips_driver ON public.trp_trips USING btree (driver_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_trips_driver_id`**
  ```sql
  CREATE INDEX idx_trp_trips_driver_id ON public.trp_trips USING btree (driver_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_trips_metadata`**
  ```sql
  CREATE INDEX idx_trp_trips_metadata ON public.trp_trips USING gin (metadata)
  ```
- **`idx_trp_trips_platform_account_trip_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_trp_trips_platform_account_trip_unique ON public.trp_trips USING btree (platform_account_id, platform_trip_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_trips_platform_trip_unique`**
  ```sql
  CREATE UNIQUE INDEX idx_trp_trips_platform_trip_unique ON public.trp_trips USING btree (platform_account_id, platform_trip_id) WHERE ((deleted_at IS NULL) AND (platform_trip_id IS NOT NULL))
  ```
- **`idx_trp_trips_tenant`**
  ```sql
  CREATE INDEX idx_trp_trips_tenant ON public.trp_trips USING btree (tenant_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_trips_vehicle`**
  ```sql
  CREATE INDEX idx_trp_trips_vehicle ON public.trp_trips USING btree (vehicle_id) WHERE (deleted_at IS NULL)
  ```
- **`idx_trp_trips_vehicle_id`**
  ```sql
  CREATE INDEX idx_trp_trips_vehicle_id ON public.trp_trips USING btree (vehicle_id) WHERE (deleted_at IS NULL)
  ```
- **`trp_trips_client_id_idx`**
  ```sql
  CREATE INDEX trp_trips_client_id_idx ON public.trp_trips USING btree (client_id)
  ```
- **`trp_trips_created_at_idx`**
  ```sql
  CREATE INDEX trp_trips_created_at_idx ON public.trp_trips USING btree (created_at DESC)
  ```
- **`trp_trips_deleted_at_idx`**
  ```sql
  CREATE INDEX trp_trips_deleted_at_idx ON public.trp_trips USING btree (deleted_at)
  ```
- **`trp_trips_driver_id_idx`**
  ```sql
  CREATE INDEX trp_trips_driver_id_idx ON public.trp_trips USING btree (driver_id)
  ```
- **`trp_trips_end_time_idx`**
  ```sql
  CREATE INDEX trp_trips_end_time_idx ON public.trp_trips USING btree (end_time)
  ```
- **`trp_trips_pkey`**
  ```sql
  CREATE UNIQUE INDEX trp_trips_pkey ON public.trp_trips USING btree (id)
  ```
- **`trp_trips_platform_id_idx`**
  ```sql
  CREATE INDEX trp_trips_platform_id_idx ON public.trp_trips USING btree (platform_id)
  ```
- **`trp_trips_start_time_idx`**
  ```sql
  CREATE INDEX trp_trips_start_time_idx ON public.trp_trips USING btree (start_time)
  ```
- **`trp_trips_tenant_id_idx`**
  ```sql
  CREATE INDEX trp_trips_tenant_id_idx ON public.trp_trips USING btree (tenant_id)
  ```
- **`trp_trips_trip_date_idx`**
  ```sql
  CREATE INDEX trp_trips_trip_date_idx ON public.trp_trips USING btree (trip_date)
  ```
- **`trp_trips_vehicle_id_idx`**
  ```sql
  CREATE INDEX trp_trips_vehicle_id_idx ON public.trp_trips USING btree (vehicle_id)
  ```

---

### 101. `v_fk`

**Rows**: 1 live, 0 dead

#### Columns

| #   | Column  | Type     | Nullable | Default | PK  |
| --- | ------- | -------- | -------- | ------- | --- |
| 1   | `count` | `bigint` | ✓        | ``      |     |

---
