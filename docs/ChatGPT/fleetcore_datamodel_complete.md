# Fleetcore Data Model – 55 Tables (Complete Specification)

## Introduction

This document describes the full data model used in the Fleetcore platform for the 55 tables defined in the restart plan. It consolidates conventions and best practices across all domains and provides detailed definitions for each table, including fields, data types, foreign‑key relationships, unique constraints, index recommendations, and row‑level security (RLS) policies. This document is intended to be a definitive reference when aligning database schemas with the Fleetcore specification.

### General conventions

- **Naming** – Each table is prefixed with a two‑ or three‑letter domain code followed by a plural noun in snake_case. For example, `adm_tenants` belongs to the administration domain and stores tenants. See the naming guidelines for the full list of prefixes.
- **Primary keys** – Every table uses a `uuid` primary key named `id` with a default of `uuid_generate_v4()`. The primary key is unique and immutable.
- **Multi‑tenant isolation** – Tables that belong to tenants include a `tenant_id` of type `uuid` referencing `adm_tenants(id)` with `ON DELETE CASCADE`. Use RLS policies to ensure each tenant sees only their own data.
- **Audit fields and soft delete** – Unless noted otherwise, tables include:
  - `created_at` (timestamp with time zone, default now())
  - `created_by` (uuid, FK to `adm_members(id)`, nullable, `ON DELETE SET NULL`)
  - `updated_at` (timestamp with time zone, default now())
  - `updated_by` (uuid, FK to `adm_members(id)`, nullable, `ON DELETE SET NULL`)
  - `deleted_at` (timestamp with time zone, nullable)
  - `deleted_by` (uuid, FK to `adm_members(id)`, nullable, `ON DELETE SET NULL`)
  - `deletion_reason` (text, nullable)
    When `deleted_at` is not null, the row is considered soft deleted.
- **Unique constraints** – Functional keys are enforced with unique indexes **partial** on the active rows: e.g. `UNIQUE (tenant_id, email) WHERE deleted_at IS NULL` allows recreation after soft deletion.
- **JSON fields** – Optional or extensible data is stored as `jsonb` with `DEFAULT '{}'::jsonb`. A GIN index may be created on JSON columns if queries require filtering by their contents.
- **RLS policies** – For each multi‑tenant table, enable RLS and create:
  - **Tenant isolation policy**: `USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)` and `WITH CHECK` on the same condition.
  - **Admin bypass**: Grant full access to a designated role (e.g. `app_super_admin`).
    A temporary `temp_allow_all` policy may be used during development and removed before production.
- **Triggers** – A trigger named `set_updated_at` is attached to each table with `BEFORE UPDATE` to set `updated_at = now()` automatically.

## 1. Administration domain (`adm_*`)

### 1.1 `adm_tenants`

Represents the organisations (tenants) that use the platform.

| Column                | Type         | Description                               | Constraints                                              |
| --------------------- | ------------ | ----------------------------------------- | -------------------------------------------------------- |
| id                    | uuid         | Unique tenant identifier                  | PK, default `uuid_generate_v4()`                         |
| name                  | text         | Human‑readable name                       | NOT NULL                                                 |
| subdomain             | varchar(100) | Subdomain assigned to the tenant          | NOT NULL, unique per tenant (`WHERE deleted_at IS NULL`) |
| country_code          | char(2)      | ISO country code                          | NOT NULL                                                 |
| clerk_organization_id | varchar(255) | Identifier in the authentication provider | Nullable, unique partial                                 |
| vat_rate              | numeric(5,2) | Default VAT rate                          | Nullable                                                 |
| currency              | char(3)      | Default currency code                     | NOT NULL, default 'EUR'                                  |
| timezone              | varchar(50)  | Default time zone                         | NOT NULL, default 'Europe/Paris'                         |
| metadata              | jsonb        | Extra tenant metadata                     | NOT NULL DEFAULT '{}'::jsonb                             |
| status                | varchar(50)  | Lifecycle status (active/inactive)        | NOT NULL DEFAULT 'active'                                |
| …                     | …            | Audit fields                              | As per general conventions                               |

Indexes:

- `UNIQUE (subdomain) WHERE deleted_at IS NULL` – ensures active subdomain uniqueness.
- `UNIQUE (clerk_organization_id) WHERE deleted_at IS NULL` – unique mapping to the auth provider.
- Btree indexes on `country_code`, `status` (partial), `deleted_at`, and JSONB GIN on `metadata`.

RLS: enable RLS; tenant isolation is not strictly needed because tenants can be read by super admins; restrict modification to admin roles only.

### 1.2 `adm_members`

Holds the users (members) of each tenant organisation. Members authenticate through the identity provider and are assigned roles.

| Column        | Type         | Description                         | Constraints                                 |
| ------------- | ------------ | ----------------------------------- | ------------------------------------------- |
| id            | uuid         | Unique member identifier            | PK                                          |
| tenant_id     | uuid         | Tenant ownership                    | NOT NULL, FK → `adm_tenants(id)` on cascade |
| email         | citext       | Email address used for login        | NOT NULL                                    |
| clerk_user_id | varchar(255) | Identifier in the identity provider | NOT NULL                                    |
| first_name    | text         | First name                          | Nullable                                    |
| last_name     | text         | Last name                           | Nullable                                    |
| phone         | varchar(50)  | Phone number                        | Nullable                                    |
| role          | varchar(50)  | Application role (member/admin)     | NOT NULL DEFAULT 'member'                   |
| metadata      | jsonb        | Additional attributes               | NOT NULL DEFAULT '{}'::jsonb                |
| status        | varchar(50)  | Status (active/suspended/invited)   | NOT NULL DEFAULT 'active'                   |
| last_login_at | timestamptz  | Last login timestamp                | Nullable                                    |
| …             | …            | Audit fields                        | As per general conventions                  |

Constraints:

- Unique partial indexes:
  - `UNIQUE (tenant_id, email) WHERE deleted_at IS NULL` – avoids duplicate active accounts per tenant.
  - `UNIQUE (tenant_id, clerk_user_id) WHERE deleted_at IS NULL` – ensures each identity user is tied to a single tenant account.
- Btree indexes on `tenant_id`, `status` (partial), `deleted_at`, `created_by`, `updated_by`, plus GIN index on `metadata`.

RLS: tenant isolation; super admin bypass.

### 1.3 `adm_roles`

Defines named roles within a tenant (e.g. manager, driver, dispatcher). A role aggregates permissions.

| Column      | Type         | Description                    | Constraints                  |
| ----------- | ------------ | ------------------------------ | ---------------------------- |
| id          | uuid         | Unique role id                 | PK                           |
| tenant_id   | uuid         | Tenant ownership               | NOT NULL, FK → `adm_tenants` |
| name        | varchar(100) | Name of the role               | NOT NULL                     |
| description | text         | Description                    | Nullable                     |
| permissions | jsonb        | Structured list of permissions | NOT NULL DEFAULT '{}'::jsonb |
| status      | varchar(50)  | Status (active/inactive)       | NOT NULL DEFAULT 'active'    |
| …           | …            | Audit fields                   |

- Unique partial index: `UNIQUE (tenant_id, name) WHERE deleted_at IS NULL`.
- Indexes on `tenant_id`, `status` (partial), `deleted_at`, `created_by`, `updated_by`, and GIN on `permissions`.

RLS: tenant isolation.

### 1.4 `adm_member_roles`

Associates members with roles (many‑to‑many). A member may have multiple roles.

| Column      | Type        | Description             | Constraints                                 |
| ----------- | ----------- | ----------------------- | ------------------------------------------- |
| id          | uuid        | Unique id               | PK                                          |
| tenant_id   | uuid        | Tenant ownership        | NOT NULL, FK → `adm_tenants`                |
| member_id   | uuid        | Member                  | NOT NULL, FK → `adm_members(id)` on cascade |
| role_id     | uuid        | Role                    | NOT NULL, FK → `adm_roles(id)` on cascade   |
| assigned_at | timestamptz | Date/time of assignment | NOT NULL DEFAULT now()                      |
| …           | …           | Audit fields            |

- Unique partial index: `UNIQUE (tenant_id, member_id, role_id) WHERE deleted_at IS NULL`.
- Indexes on `tenant_id`, `member_id`, `role_id`, `deleted_at`, `created_by`, `updated_by`.

RLS: tenant isolation.

### 1.5 `adm_audit_logs`

Immutable log of significant actions performed by members. Unlike other tables, it does **not** implement soft‑delete or RLS restrictions; logs are read‑only and permanent【358557911812333†L100-L111】.

| Column     | Type        | Description                                                      | Constraints                                  |
| ---------- | ----------- | ---------------------------------------------------------------- | -------------------------------------------- |
| id         | uuid        | Unique log id                                                    | PK                                           |
| tenant_id  | uuid        | Tenant                                                           | NOT NULL, FK → `adm_tenants(id)` on cascade  |
| member_id  | uuid        | Member performing the action                                     | Nullable, FK → `adm_members(id)` on set null |
| entity     | varchar(50) | Name of the entity affected (e.g. 'adm_members', 'flt_vehicles') | NOT NULL                                     |
| entity_id  | uuid        | ID of the entity affected                                        | NOT NULL                                     |
| action     | varchar(50) | Action performed (create/update/delete)                          | NOT NULL                                     |
| changes    | jsonb       | JSON describing the changes                                      | Nullable                                     |
| ip_address | varchar(45) | IP address of actor                                              | Nullable                                     |
| user_agent | text        | User agent string                                                | Nullable                                     |
| timestamp  | timestamptz | Date/time of the action                                          | NOT NULL DEFAULT now()                       |

Indexes: composite `(tenant_id, entity, entity_id)`, plus indexes on `tenant_id`, `timestamp`, and a GIN index on `changes`.

RLS: not enabled; logs are global and immutable.

### 1.6 `adm_provider_employees`

Stores employees of the SaaS provider. These employees manage all tenants and are not tied to a single tenant.

| Column        | Type         | Description                       | Constraints               |
| ------------- | ------------ | --------------------------------- | ------------------------- |
| id            | uuid         | Unique employee id                | PK                        |
| clerk_user_id | varchar(255) | Identity provider id              | NOT NULL                  |
| name          | varchar(100) | Full name                         | NOT NULL                  |
| email         | varchar(255) | Email address                     | NOT NULL                  |
| department    | varchar(50)  | Department (support, sales, etc.) | Nullable                  |
| title         | varchar(50)  | Job title                         | Nullable                  |
| permissions   | jsonb        | Custom permissions                | Nullable                  |
| status        | varchar(50)  | Status (active/inactive)          | NOT NULL DEFAULT 'active' |
| …             | …            | Audit fields                      |

- Unique partial indexes: `UNIQUE (clerk_user_id) WHERE deleted_at IS NULL`, `UNIQUE (email) WHERE deleted_at IS NULL`.
- Indexes on `status` (partial), `deleted_at`, `created_by`, `updated_by`.

RLS: since this table is global (not multi‑tenant), enforce access restrictions via roles rather than tenant isolation.

### 1.7 `adm_tenant_lifecycle_events`

Tracks events in the life cycle of a tenant (e.g. subscription start, upgrade, suspension).

| Column         | Type        | Description                                         | Constraints                                 |
| -------------- | ----------- | --------------------------------------------------- | ------------------------------------------- |
| id             | uuid        | Event id                                            | PK                                          |
| tenant_id      | uuid        | Tenant                                              | NOT NULL, FK → `adm_tenants`                |
| event_type     | varchar(50) | Event type (created, suspended, renewed, cancelled) | NOT NULL                                    |
| performed_by   | uuid        | Provider employee                                   | Nullable, FK → `adm_provider_employees(id)` |
| effective_date | date        | Date of effect                                      | Nullable                                    |
| description    | text        | Description/details                                 | Nullable                                    |
| …              | …           | Audit fields                                        |

- Indexes: composite `(tenant_id, event_type)`, and indexes on `tenant_id`, `event_type`, `effective_date`, `deleted_at`, `created_by`, `updated_by`.

RLS: enable if tenant managers may view their own events; provider employees may see all.

### 1.8 `adm_invitations` (Optional)

Not part of the original spec, but sometimes needed to manage manual invitations. If you choose to implement it, follow the conventions: `id`, `tenant_id`, `email`, `role`, `token`, `expires_at`, `status` (pending/accepted/expired), and audit fields. Enforce `UNIQUE (tenant_id, email, role) WHERE deleted_at IS NULL`.

## 2. Directory domain (`dir_*`)

### 2.1 `dir_car_makes`

List of vehicle makes (manufacturer) scoped optionally to a tenant. If `tenant_id` is null, the record is global.

| Column    | Type         | Description                     | Constraints                       |
| --------- | ------------ | ------------------------------- | --------------------------------- |
| id        | uuid         | Make id                         | PK                                |
| tenant_id | uuid         | Tenant or null for global entry | FK → `adm_tenants(id)` on cascade |
| name      | varchar(100) | Manufacturer name               | NOT NULL                          |
| …         | …            | Audit fields                    |

- Unique partial index: `UNIQUE (tenant_id, name) WHERE deleted_at IS NULL`.
- Indexes on `tenant_id`, `deleted_at`, `created_by`, `updated_by`.

RLS: allow reading global makes (`tenant_id IS NULL`) and tenant‑specific makes (`tenant_id = current tenant`).

### 2.2 `dir_car_models`

Catalogues car models associated with makes. Each model may also be scoped to a tenant.

| Column        | Type         | Description                 | Constraints                        |
| ------------- | ------------ | --------------------------- | ---------------------------------- |
| id            | uuid         | Model id                    | PK                                 |
| tenant_id     | uuid         | Tenant or null              | FK → `adm_tenants`                 |
| make_id       | uuid         | FK to the make              | NOT NULL, FK → `dir_car_makes(id)` |
| name          | varchar(100) | Model name                  | NOT NULL                           |
| vehicle_class | varchar(50)  | Category (sedan, SUV, etc.) | Nullable                           |
| …             | …            | Audit fields                |

- Unique partial index: `UNIQUE (tenant_id, make_id, name) WHERE deleted_at IS NULL`.
- Indexes on `tenant_id`, `make_id`, `deleted_at`, `created_by`, `updated_by`.

RLS: similar to `dir_car_makes`.

### 2.3 `dir_platforms`

Lists ride‑sharing platforms (Uber, Bolt, etc.). This table is global (no tenant_id).

| Column     | Type         | Description                                                                      | Constraints |
| ---------- | ------------ | -------------------------------------------------------------------------------- | ----------- |
| id         | uuid         | Platform id                                                                      | PK          |
| name       | varchar(100) | Platform name                                                                    | NOT NULL    |
| api_config | jsonb        | API credentials/settings                                                         | Nullable    |
| …          | …            | Audit fields (created_by, updated_by, deleted_at) referencing provider employees |

- Unique partial index: `UNIQUE (name) WHERE deleted_at IS NULL`.
- Indexes on `deleted_at`, `created_by`, `updated_by`.

RLS: not tenant‑specific; restrict via roles rather than tenant isolation.

### 2.4 `dir_country_regulations`

Holds regulatory parameters by country (vehicle age limits, VAT rates, minimum fares). This is a static reference table; no audit or soft‑delete fields.

| Column            | Type          | Description                | Constraints            |
| ----------------- | ------------- | -------------------------- | ---------------------- |
| country_code      | char(2)       | ISO code                   | PK                     |
| vehicle_max_age   | integer       | Maximum age of vehicles    | Nullable               |
| min_vehicle_class | varchar(50)   | Minimum class allowed      | Nullable               |
| requires_vtc_card | boolean       | Requires professional card | NOT NULL DEFAULT false |
| min_fare_per_trip | numeric(10,2) | Minimum fare per trip      | Nullable               |
| min_fare_per_km   | numeric(10,2) | Minimum fare per kilometre | Nullable               |
| min_fare_per_hour | numeric(10,2) | Minimum fare per hour      | Nullable               |
| vat_rate          | numeric(5,2)  | VAT rate                   | Nullable               |
| currency          | char(3)       | Local currency             | Nullable               |
| timezone          | varchar(50)   | Time zone                  | Nullable               |
| metadata          | jsonb         | Extra info                 | Nullable               |
| created_at        | timestamptz   | Creation timestamp         | NOT NULL DEFAULT now() |
| updated_at        | timestamptz   | Update timestamp           | NOT NULL DEFAULT now() |

RLS: global read access; updates restricted to provider employees.

### 2.5 `dir_vehicle_classes`

Vehicle category definitions by country.

| Column       | Type        | Description                    | Constraints          |
| ------------ | ----------- | ------------------------------ | -------------------- |
| id           | uuid        | Category id                    | PK                   |
| country_code | char(2)     | FK → `dir_country_regulations` | NOT NULL, on cascade |
| name         | varchar(50) | Category name                  | NOT NULL             |
| description  | text        | Description                    | Nullable             |
| max_age      | integer     | Maximum allowed age            | Nullable             |
| …            | …           | Audit fields                   |

- Unique partial index: `UNIQUE (country_code, name) WHERE deleted_at IS NULL`.
- Indexes on `country_code`, `deleted_at`, `created_by`, `updated_by`.

RLS: global; restrict modifications via roles.

## 3. Document domain (`doc_*`)

### 3.1 `doc_documents`

Generic document store. Documents can be attached to various entities: vehicles, drivers, trips, invoices, etc. Use `entity_type` and `entity_id` to identify the parent.

| Column        | Type         | Description                                     | Constraints                      |
| ------------- | ------------ | ----------------------------------------------- | -------------------------------- |
| id            | uuid         | Document id                                     | PK                               |
| tenant_id     | uuid         | Tenant                                          | NOT NULL, FK → `adm_tenants`     |
| entity_type   | varchar(50)  | Type of parent (e.g. 'flt_vehicles')            | NOT NULL                         |
| entity_id     | uuid         | ID of parent entity                             | NOT NULL                         |
| document_type | varchar(50)  | Nature of document (license, contract, invoice) | NOT NULL                         |
| file_url      | text         | URL or storage key                              | NOT NULL                         |
| file_name     | varchar(255) | Original file name                              | Nullable                         |
| file_size     | integer      | Size in bytes                                   | Nullable                         |
| mime_type     | varchar(100) | MIME type                                       | Nullable                         |
| issue_date    | date         | Date of issue                                   | Nullable                         |
| expiry_date   | date         | Date of expiry                                  | Nullable                         |
| verified      | boolean      | Verification status                             | NOT NULL DEFAULT false           |
| verified_by   | uuid         | Verifier                                        | Nullable, FK → `adm_members(id)` |
| verified_at   | timestamptz  | Verification timestamp                          | Nullable                         |
| metadata      | jsonb        | Extra details                                   | Nullable                         |
| …             | …            | Audit fields                                    |

Indexes: composite `(tenant_id, entity_type, entity_id)`, `(tenant_id, document_type)`, plus `expiry_date`, `deleted_at`, `created_by`, `updated_by`, and GIN on `metadata`.

RLS: tenant isolation on `tenant_id`; admins may view all documents.

## 4. Fleet domain (`flt_*`)

### 4.1 `flt_vehicles`

Represents a vehicle in the fleet. Vehicles are assigned to drivers and used in trips. Vehicles belong to a tenant.

| Column            | Type         | Description                      | Constraints                         |
| ----------------- | ------------ | -------------------------------- | ----------------------------------- |
| id                | uuid         | Vehicle id                       | PK                                  |
| tenant_id         | uuid         | Tenant                           | NOT NULL, FK → `adm_tenants`        |
| make_id           | uuid         | Manufacturer                     | NOT NULL, FK → `dir_car_makes(id)`  |
| model_id          | uuid         | Model                            | NOT NULL, FK → `dir_car_models(id)` |
| license_plate     | varchar(20)  | Registration plate               | NOT NULL                            |
| vin               | varchar(17)  | Vehicle identification number    | Nullable                            |
| year              | integer      | Year of manufacture              | NOT NULL                            |
| color             | varchar(50)  | Colour                           | Nullable                            |
| seats             | integer      | Number of seats                  | NOT NULL DEFAULT 4                  |
| vehicle_class     | varchar(50)  | Class (SUV, sedan…)              | Nullable                            |
| fuel_type         | varchar(50)  | Fuel type                        | Nullable                            |
| transmission      | varchar(50)  | Transmission type                | Nullable                            |
| registration_date | date         | Date of registration             | Nullable                            |
| insurance_number  | varchar(100) | Insurance policy number          | Nullable                            |
| insurance_expiry  | date         | Expiry date of insurance         | Nullable                            |
| last_inspection   | date         | Date of last inspection          | Nullable                            |
| next_inspection   | date         | Planned next inspection date     | Nullable                            |
| odometer          | integer      | Odometer reading                 | Nullable                            |
| ownership_type    | varchar(50)  | owned/leased/rented              | NOT NULL DEFAULT 'owned'            |
| metadata          | jsonb        | Additional details               | NOT NULL DEFAULT '{}'::jsonb        |
| status            | varchar(50)  | Status (pending/active/inactive) | NOT NULL DEFAULT 'pending'          |
| …                 | …            | Audit fields                     |

- Unique partial indexes: `UNIQUE (tenant_id, license_plate) WHERE deleted_at IS NULL`, `UNIQUE (tenant_id, vin) WHERE deleted_at IS NULL AND vin IS NOT NULL`.
- Indexes on `tenant_id`, `make_id`, `model_id`, `status` (partial), `next_inspection`, `deleted_at`, `created_by`, `updated_by`, GIN on `metadata`.

RLS: tenant isolation.

### 4.2 `flt_vehicle_assignments`

Links vehicles to drivers for specific time periods.

| Column          | Type        | Description              | Constraints                       |
| --------------- | ----------- | ------------------------ | --------------------------------- |
| id              | uuid        | Assignment id            | PK                                |
| tenant_id       | uuid        | Tenant                   | NOT NULL, FK → `adm_tenants`      |
| driver_id       | uuid        | Driver                   | NOT NULL, FK → `rid_drivers(id)`  |
| vehicle_id      | uuid        | Vehicle                  | NOT NULL, FK → `flt_vehicles(id)` |
| start_date      | date        | Assignment start         | NOT NULL                          |
| end_date        | date        | Assignment end           | Nullable                          |
| assignment_type | varchar(50) | Type (permanent/temp)    | NOT NULL DEFAULT 'permanent'      |
| metadata        | jsonb       | Extra data               | Nullable                          |
| status          | varchar(50) | Status (active/inactive) | NOT NULL DEFAULT 'active'         |
| …               | …           | Audit fields             |

- Unique partial index: `UNIQUE (tenant_id, driver_id, vehicle_id, start_date) WHERE deleted_at IS NULL`.
- Indexes on `tenant_id`, `driver_id`, `vehicle_id`, `start_date`, `end_date`, `status` (partial), `deleted_at`, `created_by`, `updated_by`.

RLS: tenant isolation.

### 4.3 `flt_vehicle_events`

Records events in the vehicle’s life cycle (acquisition, disposal, maintenance, accident, handover, inspection, insurance). See the corrected migration for the full definition.

- Fields: `id`, `tenant_id`, `vehicle_id`, `event_type` (enum), `event_date`, `severity` (enum), `downtime_hours`, `cost_amount`, `currency` (default 'EUR'), `details` (JSONB), `notes` (text), `metadata` (JSONB), plus audit fields.
- Constraints: check on `event_type` and `severity` values.
- Indexes on `tenant_id`, `vehicle_id`, `event_type`, `event_date`, `severity` (partial), `created_at DESC`, `deleted_at`, `created_by`, `updated_by`, plus GIN on `details` and `metadata`.
- RLS: tenant isolation.

### 4.4 `flt_vehicle_maintenance`

Tracks scheduled and completed maintenance tasks. Fields include `maintenance_type` (enum), `scheduled_date`, `completed_date`, `odometer_reading`, `next_service_km`, `next_service_date`, provider details, cost, currency, invoice reference, replaced parts, notes, `status` (scheduled/in_progress/completed/cancelled), and metadata. The corrected migration ensures proper check constraints and partial indexes on `scheduled_date`, `status`, and `next_service_date`.

### 4.5 `flt_vehicle_expenses`

Captures expenses associated with a vehicle (fuel, toll, parking, wash, repair, fine, other) and optionally links to a driver or ride. Fields include `expense_date`, `expense_category` (enum), `amount`, `currency`, `payment_method` (enum), `receipt_url`, `odometer_reading`, `quantity`, `unit_price`, `location`, `vendor`, `description`, `reimbursed` flag, `reimbursed_at`, `reimbursed_in_batch_id`, `notes`, `metadata`, plus audit fields. Check constraints enforce positive amounts and valid categories and payment methods. Indexes cover tenant, vehicle, driver, ride, category, date, reimbursement status, plus partial on `reimbursed` when not deleted.

### 4.6 `flt_vehicle_insurances`

Stores insurance policies for vehicles. Fields include provider details, policy number, policy type (enum), coverage amount, deductible, premium amount and frequency (enum), start/end dates, active/auto_renew flags, contact info, document URL, claim count, last claim date, notes, metadata, plus audit fields. Unique partial index on `(tenant_id, policy_number) WHERE deleted_at IS NULL`; partial indexes on `end_date` where `is_active` is true and on `is_active`; check constraints on enumerated values.

## 5. Drivers domain (`rid_*`)

### 5.1 `rid_drivers`

Represents drivers associated with a tenant. After the alignment described earlier, the fields are:

| Column               | Type        | Description                          | Constraints                          |
| -------------------- | ----------- | ------------------------------------ | ------------------------------------ |
| id                   | uuid        | Driver id                            | PK                                   |
| tenant_id            | uuid        | Tenant                               | NOT NULL, FK → `adm_tenants`         |
| first_name           | text        | First name                           | NOT NULL                             |
| last_name            | text        | Last name                            | NOT NULL                             |
| phone                | text        | Phone number                         | NOT NULL                             |
| email                | text        | Email                                | NOT NULL                             |
| license_number       | text        | Driver licence number                | NOT NULL                             |
| license_issue_date   | date        | Issue date                           | Nullable                             |
| license_expiry_date  | date        | Expiry date                          | Nullable                             |
| professional_card_no | text        | Professional card                    | Nullable                             |
| professional_expiry  | date        | Expiry of professional card          | Nullable                             |
| driver_status        | varchar(50) | Status (active/suspended/terminated) | NOT NULL DEFAULT 'active' with CHECK |
| rating               | decimal     | Average rating                       | Nullable                             |
| notes                | text        | Free notes                           | Nullable                             |
| …                    | …           | Audit fields                         |

- Unique partial indexes: `UNIQUE (tenant_id, email) WHERE deleted_at IS NULL`, `UNIQUE (tenant_id, license_number) WHERE deleted_at IS NULL`.
- Indexes on `tenant_id`, `driver_status` (partial), `deleted_at`, `created_at DESC`.
- RLS: tenant isolation.

### 5.2 `rid_driver_documents`

Links drivers to documents stored in `doc_documents`. Fields: `driver_id` (FK → `rid_drivers`), `document_id` (FK → `doc_documents`), `document_type` (license, permit, contract, etc.), `expiry_date`, `verified`, `verified_by`, `verified_at`, plus audit fields. Unique partial index on `(driver_id, document_type) WHERE deleted_at IS NULL` ensures one active document of each type per driver.

### 5.3 `rid_driver_cooperation_terms`

Records drivers’ contract or terms acceptance. Fields: `driver_id`, `term_version`, `accepted_at`, `accepted_by`, plus audit fields. Unique partial index on `(driver_id, term_version) WHERE deleted_at IS NULL`.

### 5.4 `rid_driver_requests`

Tracks requests made by drivers (onboarding, support, payment issues). Fields include `request_type` (enum), `status`, `description`, `metadata` (JSONB), plus audit fields. Indexes on `driver_id`, `request_type`, `status` (partial).

### 5.5 `rid_driver_performances`

Aggregates performance metrics for drivers (ratings, on‑time percentage, completed trips, cancellations, earnings). Use fields like `metrics` (JSONB), `period_start`, `period_end`, `rating`, etc. Unique partial index on `(driver_id, period_start) WHERE deleted_at IS NULL`.

### 5.6 `rid_driver_blacklists`

Stores blacklisted drivers with reason and effective period. Fields: `driver_id`, `reason`, `start_date`, `end_date`, plus audit fields. Unique partial index on `(driver_id) WHERE deleted_at IS NULL`.

### 5.7 `rid_driver_training`

Keeps track of completed trainings. Fields: `driver_id`, `training_name`, `completion_date`, `score`, `certificate_url`, plus audit fields. Unique partial index on `(driver_id, training_name) WHERE deleted_at IS NULL`.

## 6. Scheduling domain (`sch_*`)

### 6.1 `sch_shifts`

Defines working shifts for drivers. Fields: `id`, `tenant_id`, `driver_id`, `start_time`, `end_time`, `status` (scheduled/completed/cancelled), `metadata`, plus audit fields. Unique partial index on `(driver_id, start_time) WHERE deleted_at IS NULL`.

### 6.2 `sch_maintenance_schedules`

Schedules maintenance tasks for vehicles. Fields: `id`, `tenant_id`, `vehicle_id`, `scheduled_date`, `maintenance_type`, `status` (scheduled/completed/cancelled), `metadata`, plus audit fields. Unique partial index on `(vehicle_id, scheduled_date, maintenance_type) WHERE deleted_at IS NULL`.

### 6.3 `sch_goals`

Defines goals (KPIs) for teams or individuals. Fields: `id`, `tenant_id`, `goal_type`, `target_value`, `period_start`, `period_end`, `assigned_to` (driver_id or team id), `status`, `metadata`, plus audit fields. Unique partial index on `(tenant_id, goal_type, period_start, assigned_to) WHERE deleted_at IS NULL`.

### 6.4 `sch_tasks`

Assigns tasks to drivers or vehicles (e.g. pickup package, deliver parcel). Fields: `id`, `tenant_id`, `task_type`, `description`, `target_id` (driver_id or vehicle_id), `due_at`, `status`, `metadata`, plus audit fields. Indexes on `tenant_id`, `target_id`, `due_at`, `status` (partial).

## 7. Trips domain (`trp_*`)

### 7.1 `trp_platform_accounts`

Links tenants to their accounts on ride‑sharing platforms. Fields: `id`, `tenant_id`, `platform_id`, `account_identifier`, `api_key`, `metadata`, plus audit fields. Unique partial index on `(tenant_id, platform_id) WHERE deleted_at IS NULL`.

### 7.2 `trp_trips`

Represents trips executed by drivers on behalf of tenants. Use the corrected schema: fields include `tenant_id`, `platform_id`, `driver_id`, `vehicle_id`, `client_id`, `trip_date`, `start_time`, `end_time`, pickup/dropoff coordinates, distance, duration, fare components (`fare_base`, `fare_distance`, `fare_time`), surge multiplier, tip amount, `platform_commission`, `net_earnings`, `payment_method` (enum), `status` (enum), plus audit fields. Unique partial index may be added on `(platform_id, platform_ride_id) WHERE deleted_at IS NULL` if `platform_ride_id` is kept for correlation.

### 7.3 `trp_settlements`

Summarises settlements between platform and tenant for a trip or group of trips. Fields: `trip_id`, `settlement_reference`, `amount`, `currency`, `platform_commission`, `net_amount`, `settlement_date`, `status`, plus audit fields. Unique partial index on `(trip_id, settlement_reference) WHERE deleted_at IS NULL`.

### 7.4 `trp_client_invoices`

Invoices issued to clients for trips. Fields: `id`, `tenant_id`, `client_id`, `invoice_number`, `invoice_date`, `due_date`, `total_amount`, `currency`, `status` (draft/sent/paid/cancelled), `metadata`, plus audit fields. Unique partial index on `(tenant_id, invoice_number) WHERE deleted_at IS NULL`. Invoice lines stored in `trp_client_invoice_lines`.

## 8. Finance domain (`fin_*`)

### 8.1 `fin_accounts`

Represents financial accounts (bank, cash, virtual). Fields: `id`, `tenant_id`, `account_name`, `account_type` (bank/cash/digital), `currency`, `balance`, `metadata`, plus audit fields. Unique partial index on `(tenant_id, account_name) WHERE deleted_at IS NULL`.

### 8.2 `fin_transactions`

General ledger of financial transactions. Fields: `id`, `tenant_id`, `account_id`, `transaction_type` (credit/debit), `amount`, `currency`, `reference`, `description`, `transaction_date`, `status`, `metadata`, plus audit fields. Indexes on `tenant_id`, `account_id`, `transaction_date`, `status` (partial).

### 8.3 `fin_driver_payment_batches`

Aggregates payments made to drivers in batches. Fields: `id`, `tenant_id`, `batch_reference`, `payment_date`, `total_amount`, `currency`, `status`, `metadata`, plus audit fields. Unique partial index on `(tenant_id, batch_reference) WHERE deleted_at IS NULL`.

### 8.4 `fin_driver_payments`

Individual payments to drivers. Fields: `id`, `tenant_id`, `driver_id`, `payment_batch_id`, `amount`, `currency`, `payment_date`, `status`, `metadata`, plus audit fields. Indexes on `tenant_id`, `driver_id`, `payment_batch_id`, `status` (partial), `payment_date`.

### 8.5 `fin_toll_transactions`

Captures toll payments recorded by the platform. Fields: `id`, `tenant_id`, `driver_id`, `vehicle_id`, `toll_gate`, `toll_date`, `amount`, `currency`, `metadata`, plus audit fields. Unique partial index on `(tenant_id, driver_id, vehicle_id, toll_date) WHERE deleted_at IS NULL`.

### 8.6 `fin_traffic_fines`

Records traffic fines incurred by drivers. Fields: `id`, `tenant_id`, `driver_id`, `vehicle_id`, `fine_reference`, `fine_date`, `fine_type`, `amount`, `currency`, `status` (pending/paid/disputed), `metadata`, plus audit fields. Unique partial index on `(tenant_id, fine_reference) WHERE deleted_at IS NULL`.

## 9. Revenue domain (`rev_*`)

### 9.1 `rev_revenue_imports`

Tracks imported revenue records from external sources. Fields: `id`, `tenant_id`, `import_reference`, `import_date`, `status`, `total_revenue`, `currency`, `metadata`, plus audit fields. Unique partial index on `(tenant_id, import_reference) WHERE deleted_at IS NULL`.

### 9.2 `rev_driver_revenues`

Stores aggregated revenue per driver and period. Fields: `id`, `tenant_id`, `driver_id`, `period_start`, `period_end`, `total_revenue`, `commission_amount`, `net_revenue`, `metadata`, plus audit fields. Unique partial index on `(driver_id, period_start) WHERE deleted_at IS NULL`.

### 9.3 `rev_reconciliations`

Captures reconciliation records between imported revenue and actual transactions. Fields: `id`, `tenant_id`, `import_id`, `reconciliation_date`, `status`, `notes`, plus audit fields. Unique partial index on `(import_id, reconciliation_date) WHERE deleted_at IS NULL`.

## 10. SaaS billing domain (`bil_*`)

### 10.1 `bil_billing_plans`

Defines SaaS subscription plans. Fields: `id`, `plan_name`, `description`, `monthly_fee`, `annual_fee`, `currency`, `features` (JSONB), `status`, plus audit fields. Unique partial index on `(plan_name) WHERE deleted_at IS NULL`.

### 10.2 `bil_tenant_subscriptions`

Links tenants to billing plans. Fields: `id`, `tenant_id`, `plan_id`, `subscription_start`, `subscription_end`, `status` (active/inactive/cancelled), `metadata`, plus audit fields. Unique partial index on `(tenant_id, plan_id) WHERE deleted_at IS NULL`.

### 10.3 `bil_tenant_usage_metrics`

Stores usage metrics per tenant (requests, API calls, storage). Fields: `id`, `tenant_id`, `metric_name`, `metric_value`, `period_start`, `period_end`, `metadata`, plus audit fields. Unique partial index on `(tenant_id, metric_name, period_start) WHERE deleted_at IS NULL`.

### 10.4 `bil_tenant_invoices`

Invoices issued by the SaaS provider to tenants. Fields: `id`, `tenant_id`, `invoice_number`, `invoice_date`, `due_date`, `total_amount`, `currency`, `status` (draft/sent/paid/overdue), `metadata`, plus audit fields. Unique partial index on `(tenant_id, invoice_number) WHERE deleted_at IS NULL`.

### 10.5 `bil_tenant_invoice_lines`

Line items for each tenant invoice. Fields: `id`, `invoice_id`, `description`, `amount`, `quantity`, `metadata`, plus audit fields. FK to `bil_tenant_invoices(id)` on cascade; unique partial index on `(invoice_id, description) WHERE deleted_at IS NULL`.

### 10.6 `bil_payment_methods`

Stores payment methods for tenants. Fields: `id`, `tenant_id`, `payment_type` (card, bank, PayPal), `provider_token`, `expires_at`, `status`, `metadata`, plus audit fields. Unique partial index on `(tenant_id, payment_type) WHERE deleted_at IS NULL`.

## 11. CRM domain (`crm_*`)

### 11.1 `crm_leads`

Captures potential customers (leads). Fields: `id`, `tenant_id`, `full_name`, `company_name`, `email`, `phone`, `country_code`, `fleet_size`, `current_software`, `message`, `status` (new/qualified/disqualified), `lead_source`, `assigned_to` (FK → `adm_members`), `qualification_score`, `qualification_notes`, `utm_source`, `utm_medium`, `utm_campaign`, `metadata`, plus audit fields. Unique partial index on `(tenant_id, email) WHERE deleted_at IS NULL`.

### 11.2 `crm_opportunities`

Represents sales opportunities. Fields: `id`, `tenant_id`, `lead_id`, `opportunity_stage` (prospect/proposal/negotiation/closed), `expected_value`, `close_date`, `assigned_to` (member), `metadata`, plus audit fields. Unique partial index on `(tenant_id, lead_id) WHERE deleted_at IS NULL`.

### 11.3 `crm_contracts`

Represents signed agreements with clients. Fields: `id`, `tenant_id`, `client_id`, `contract_reference`, `contract_date`, `effective_date`, `expiry_date`, `total_value`, `currency`, `status`, `metadata`, plus audit fields. Unique partial index on `(tenant_id, contract_reference) WHERE deleted_at IS NULL`.

## 12. Support domain (`sup_*`)

### 12.1 `sup_tickets`

Support tickets raised by tenants or drivers. Fields: `id`, `tenant_id`, `raised_by` (member or driver), `subject`, `description`, `status` (open/pending/resolved/closed), `priority` (low/medium/high), `assigned_to` (provider employee), `metadata`, plus audit fields. Unique partial index on `(tenant_id, raised_by, created_at) WHERE deleted_at IS NULL`.

### 12.2 `sup_ticket_messages`

Messages exchanged within a support ticket. Fields: `id`, `ticket_id` (FK → `sup_tickets`), `sender_id` (member or provider employee), `message_body`, `sent_at`, `metadata`, plus audit fields. Index on `ticket_id` and `sent_at`. RLS: ensure only participants can read messages.

### 12.3 `sup_customer_feedback`

Stores feedback from tenants or drivers about the service. Fields: `id`, `tenant_id`, `submitted_by` (member or driver), `feedback_text`, `rating` (1–5), `submitted_at`, `metadata`, plus audit fields. Indexes on `tenant_id`, `submitted_by`, and `submitted_at`.

---

This data model covers all 55 tables defined in the Fleetcore restart plan. By following the conventions and definitions provided here, you can ensure that your database aligns with the platform’s architecture and maintains consistency across domains. When creating or modifying tables, always apply the general conventions for primary keys, audit fields, soft deletion, unique constraints, JSONB usage, RLS policies, and triggers.
