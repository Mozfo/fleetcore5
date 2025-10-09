# Fleetcore Data Model v2 – Detailed & Domain‑Prefixed Naming

**Date:** 7 October 2025 (user timezone: Asia/Dubai)

This document presents a **high‑fidelity data model** for Fleetcore v1,
incorporating all functional requirements (fleet operations, driver
management, finance, ride‑hailing integrations, SaaS billing, CRM and
support) plus local regulations for the United Arab Emirates and France.
Each table is named following the **domain‑prefixed naming convention**
defined in the naming guidelines: tables use plural nouns in `snake_case`
with a short prefix indicating the domain (`adm_` for administration,
`dir_` for directory, `flt_` for fleet, `rid_` for riders/drivers,
`fin_` for finance, `trp_` for trips/bookings, `sch_` for scheduling,
`hr_` for onboarding/HR, `bil_` for billing, `crm_` for CRM, `sup_` for
support, `inv_` for investors, `doc_` for polymorphic documents)【491524022416630†L64-L67】.
All primary keys use **UUIDs** (`id`), and every operational table
contains a `tenant_id` foreign key for multi‑tenant isolation. Timestamps
(`created_at`, `updated_at`, `deleted_at`) support auditing and soft
deletion.

## 1 Administration & Tenants (`adm_`)

These tables manage Fleetcore tenants and internal users (members), roles,
audit logs and lifecycle events. They store metadata about the SaaS
provider’s clients and the staff who operate the system.

### 1.1 `adm_tenants`

| Field                   | Type         | Description                                                    |
| ----------------------- | ------------ | -------------------------------------------------------------- |
| `id`                    | UUID (PK)    | Unique identifier for the tenant/company.                      |
| `name`                  | Text         | Legal name of the company.                                     |
| `country_code`          | Char(2)      | ISO‑3166 country code (`AE`, `FR`).                            |
| `default_currency`      | Char(3)      | Currency used by the tenant (`AED`, `EUR`).                    |
| `timezone`              | Text         | Default time‑zone (e.g., `Asia/Dubai`).                        |
| `vat_rate`              | Decimal(5,2) | VAT rate applied to invoices (5 % in UAE, 20 % in France).     |
| `clerk_organization_id` | Text         | Reference to Clerk organisation for authentication (optional). |
| `created_at`            | Timestamp    | Creation time.                                                 |
| `updated_at`            | Timestamp    | Last update.                                                   |
| `deleted_at`            | Timestamp    | Soft‑delete (null if active).                                  |

### 1.2 `adm_members`

Represents all users (fleet staff and providers) who can log into
Fleetcore. Authentication is delegated to Clerk; the system stores
metadata and assigns roles per tenant.

| Field           | Type      | Description                               |
| --------------- | --------- | ----------------------------------------- |
| `id`            | UUID (PK) | User identifier.                          |
| `tenant_id`     | UUID (FK) | Tenant this member belongs to.            |
| `clerk_user_id` | Text      | Identifier in Clerk (for SSO/MFA).        |
| `email`         | Text      | Email address.                            |
| `phone`         | Text      | Phone number in E.164 format.             |
| `first_name`    | Text      | First name.                               |
| `last_name`     | Text      | Last name.                                |
| `language`      | Char(2)   | Preferred UI language (`en`, `fr`, `ar`). |
| `status`        | Enum      | `active`, `suspended`, `pending`.         |
| `created_at`    | Timestamp | Created.                                  |
| `updated_at`    | Timestamp | Last updated.                             |
| `deleted_at`    | Timestamp | Soft‑delete.                              |

### 1.3 `adm_roles` & `adm_member_roles`

`adm_roles` defines the roles available in a tenant (e.g., `fleet_manager`,
`dispatcher`, `driver`) and `adm_member_roles` is a junction table
associating members with roles (many‑to‑many). Each member may hold
multiple roles.

**`adm_roles`**

| Field         | Type      | Description                                               |
| ------------- | --------- | --------------------------------------------------------- |
| `id`          | UUID (PK) | Role ID.                                                  |
| `tenant_id`   | UUID (FK) | Tenant where the role is defined (null for global roles). |
| `name`        | Text      | Role name.                                                |
| `description` | Text      | Description of the role.                                  |

**`adm_member_roles`**

| Field       | Type      | Description     |
| ----------- | --------- | --------------- |
| `id`        | UUID (PK) | Association ID. |
| `tenant_id` | UUID (FK) | Tenant context. |
| `member_id` | UUID (FK) | Member ID.      |
| `role_id`   | UUID (FK) | Role ID.        |

### 1.4 `adm_audit_logs`

Stores immutable audit records for critical actions taken by members.

| Field        | Type      | Description                                      |
| ------------ | --------- | ------------------------------------------------ |
| `id`         | UUID (PK) | Log ID.                                          |
| `tenant_id`  | UUID (FK) | Tenant.                                          |
| `member_id`  | UUID (FK) | User who performed the action.                   |
| `entity`     | Text      | Name of entity affected (e.g., `flt_vehicles`).  |
| `action`     | Text      | Action (`create`, `update`, `delete`, `export`). |
| `entity_id`  | UUID      | ID of the record impacted.                       |
| `changes`    | JSON      | Before/after values (if applicable).             |
| `ip_address` | Text      | Source IP address.                               |
| `user_agent` | Text      | Browser/user‑agent string.                       |
| `timestamp`  | Timestamp | Time of action.                                  |

### 1.5 `adm_integration_logs`

Records the status of synchronisation jobs with external systems (ride‑hailing platforms, GPS providers, payment gateways).

| Field           | Type      | Description                                             |
| --------------- | --------- | ------------------------------------------------------- |
| `id`            | UUID (PK) | Log ID.                                                 |
| `tenant_id`     | UUID (FK) | Tenant.                                                 |
| `integration`   | Text      | Integration name (`Uber`, `Mapon`, etc.).               |
| `entity`        | Text      | Entity being synchronised (`trp_trips`, `rid_drivers`). |
| `action`        | Text      | `pull`, `push`, `webhook`.                              |
| `status`        | Enum      | `success`, `failure`.                                   |
| `error_message` | Text      | Error details.                                          |
| `timestamp`     | Timestamp | Timestamp of the event.                                 |

### 1.6 `adm_tenant_lifecycle_events`

Captures significant events in a tenant’s lifecycle, such as creation,
plan changes, suspension and reactivation.

| Field            | Type      | Description                                                          |
| ---------------- | --------- | -------------------------------------------------------------------- |
| `id`             | UUID (PK) | Event ID.                                                            |
| `tenant_id`      | UUID (FK) | Tenant.                                                              |
| `event_type`     | Enum      | `created`, `plan_changed`, `suspended`, `reactivated`, `cancelled`.  |
| `performed_by`   | UUID (FK) | Provider employee initiating the event (nullable for system events). |
| `effective_date` | Date      | Date the event takes effect.                                         |
| `description`    | Text      | Additional context.                                                  |
| `created_at`     | Timestamp | Created.                                                             |

### 1.7 Provider administration (optional)

When operating Fleetcore as a SaaS, the provider requires internal staff
structures and tenant oversight. The following tables support these
processes (see also CRM and billing domains below). They are optional
extensions beyond the core fleet operations.

**`adm_provider_employees`**: directory of the SaaS provider’s staff.

| Field        | Type      | Description                                 |
| ------------ | --------- | ------------------------------------------- |
| `id`         | UUID (PK) | Employee ID.                                |
| `name`       | Text      | Full name.                                  |
| `email`      | Text      | Company email.                              |
| `department` | Text      | Department (sales, support, product).       |
| `role`       | Text      | Job title (account manager, support agent). |
| `created_at` | Timestamp | Created.                                    |
| `updated_at` | Timestamp | Last update.                                |

**`adm_tenant_account_managers`**: associates tenants with provider employees.

| Field         | Type      | Description                                         |
| ------------- | --------- | --------------------------------------------------- |
| `id`          | UUID (PK) | Record ID.                                          |
| `tenant_id`   | UUID (FK) | Tenant.                                             |
| `employee_id` | UUID (FK) | Provider employee responsible.                      |
| `role`        | Text      | Relationship (`owner`, `support_rep`, `sales_rep`). |
| `start_date`  | Date      | Start of responsibility.                            |
| `end_date`    | Date      | End (nullable for current).                         |

## 2 Directory (`dir_`)

Directory tables provide shared reference data. They are often tenant‑specific to
allow customised lists per organisation.

### 2.1 `dir_car_makes` & `dir_car_models`

**`dir_car_makes`**

| Field        | Type      | Description                    |
| ------------ | --------- | ------------------------------ |
| `id`         | UUID (PK) | Make ID.                       |
| `tenant_id`  | UUID (FK) | Tenant.                        |
| `name`       | Text      | Brand name (Toyota, Mercedes). |
| `created_at` | Timestamp | Created.                       |
| `updated_at` | Timestamp | Updated.                       |

**`dir_car_models`**

| Field              | Type      | Description                       |
| ------------------ | --------- | --------------------------------- |
| `id`               | UUID (PK) | Model ID.                         |
| `tenant_id`        | UUID (FK) | Tenant.                           |
| `make_id`          | UUID (FK) | References `dir_car_makes`.       |
| `name`             | Text      | Model name (Camry, E‑Class).      |
| `vehicle_class_id` | UUID (FK) | References `dir_vehicle_classes`. |
| `created_at`       | Timestamp | Created.                          |
| `updated_at`       | Timestamp | Updated.                          |

### 2.2 `dir_platforms`

List of ride‑hailing platforms integrated (Uber, Bolt, Careem, etc.).

| Field        | Type      | Description                       |
| ------------ | --------- | --------------------------------- |
| `id`         | UUID (PK) | Platform ID.                      |
| `name`       | Text      | Name of the platform.             |
| `api_key`    | Text      | Encrypted API key or credentials. |
| `created_at` | Timestamp | Created.                          |
| `updated_at` | Timestamp | Updated.                          |

### 2.3 Localisation tables (`dir_country_regulations`, `dir_vehicle_classes`)

These tables capture regulatory parameters that vary by country.

**`dir_country_regulations`**

| Field               | Type         | Description                                                                        |
| ------------------- | ------------ | ---------------------------------------------------------------------------------- |
| `country_code`      | Char(2) (PK) | Country (`AE`, `FR`).                                                              |
| `vehicle_max_age`   | Integer      | Maximum vehicle age allowed for ride‑hailing services.                             |
| `min_vehicle_class` | Text         | Minimum vehicle class permitted (e.g., sedan).                                     |
| `requires_vtc_card` | Boolean      | Whether drivers must hold a professional VTC licence【611243862873268†L268-L280】. |
| `min_fare_per_trip` | Decimal      | Minimum fare per trip (local currency)【611243862873268†L268-L280】.               |
| `min_fare_per_km`   | Decimal      | Minimum fare per kilometre.                                                        |
| `min_fare_per_hour` | Decimal      | Minimum fare per hour for hourly rentals.                                          |
| `vat_rate`          | Decimal(5,2) | VAT rate (redundant to tenant).                                                    |
| `currency`          | Char(3)      | Currency (`AED`, `EUR`).                                                           |
| `timezone`          | Text         | Default time‑zone.                                                                 |
| `created_at`        | Timestamp    | Created.                                                                           |
| `updated_at`        | Timestamp    | Updated.                                                                           |

**`dir_vehicle_classes`** (optional)

| Field          | Type      | Description                                |
| -------------- | --------- | ------------------------------------------ |
| `id`           | UUID (PK) | Class ID.                                  |
| `country_code` | Char(2)   | Country (FK to `dir_country_regulations`). |
| `name`         | Text      | Class name (`sedan`, `SUV`, `limousine`).  |
| `description`  | Text      | Description and regulatory requirements.   |
| `max_age`      | Integer   | Override for maximum age.                  |
| `created_at`   | Timestamp | Created.                                   |
| `updated_at`   | Timestamp | Updated.                                   |

## 3 Fleet Domain (`flt_`)

Manages vehicles, their documents, lifecycle events, investors and platform
statuses. These tables enable end‑to‑end tracking from acquisition to
disposal.

### 3.1 `flt_vehicles`

| Field               | Type      | Description                                                   |
| ------------------- | --------- | ------------------------------------------------------------- |
| `id`                | UUID (PK) | Vehicle ID.                                                   |
| `tenant_id`         | UUID (FK) | Tenant.                                                       |
| `make_id`           | UUID (FK) | Reference to `dir_car_makes`.                                 |
| `model_id`          | UUID (FK) | Reference to `dir_car_models`.                                |
| `year`              | Integer   | Year of manufacture.                                          |
| `plate_number`      | Text      | Licence plate.                                                |
| `vin`               | Text      | Vehicle identification number.                                |
| `colour`            | Text      | Colour.                                                       |
| `body_type`         | Text      | Sedan, SUV, etc.                                              |
| `owner_type`        | Enum      | `fleet`, `leasing`, `investor`.                               |
| `owner_id`          | UUID      | References `adm_tenants`, `inv_investors` or leasing partner. |
| `purchase_date`     | Date      | Date of acquisition.                                          |
| `status`            | Enum      | `active`, `maintenance`, `retired`, `sold`.                   |
| `current_driver_id` | UUID (FK) | Current driver (nullable).                                    |
| `gps_device_id`     | Text      | Telematics device identifier.                                 |
| `created_at`        | Timestamp | Created.                                                      |
| `updated_at`        | Timestamp | Updated.                                                      |
| `deleted_at`        | Timestamp | Soft‑delete.                                                  |

### 3.2 `doc_documents`

A polymorphic table for storing documents related to vehicles, drivers,
members or other entities. Avoids multiple one‑to‑one document tables.

| Field           | Type      | Description                                                                                                |
| --------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `id`            | UUID (PK) | Document ID.                                                                                               |
| `tenant_id`     | UUID (FK) | Tenant.                                                                                                    |
| `entity_type`   | Text      | Entity category (`flt_vehicle`, `rid_driver`, `adm_member`, `contract`).                                   |
| `entity_id`     | UUID      | Identifier of the entity.                                                                                  |
| `document_type` | Text      | Type (`registration`, `insurance`, `visa`, `residence_visa`, `emirates_id`, `platform_approval`, `other`). |
| `file_url`      | Text      | URL of the stored file.                                                                                    |
| `issue_date`    | Date      | Issuance date.                                                                                             |
| `expiry_date`   | Date      | Expiry date.                                                                                               |
| `verified`      | Boolean   | Whether validated.                                                                                         |
| `created_at`    | Timestamp | Created.                                                                                                   |
| `updated_at`    | Timestamp | Updated.                                                                                                   |

### 3.3 `flt_vehicle_insurances`

| Field               | Type      | Description                         |
| ------------------- | --------- | ----------------------------------- |
| `id`                | UUID (PK) | Insurance record.                   |
| `tenant_id`         | UUID (FK) | Tenant.                             |
| `vehicle_id`        | UUID (FK) | Vehicle.                            |
| `insurance_type_id` | UUID (FK) | Type (FK to `fin_insurance_types`). |
| `policy_number`     | Text      | Policy number.                      |
| `provider`          | Text      | Insurance provider.                 |
| `coverage_amount`   | Decimal   | Sum assured.                        |
| `currency`          | Char(3)   | Currency.                           |
| `start_date`        | Date      | Start of coverage.                  |
| `end_date`          | Date      | End of coverage.                    |
| `premium_amount`    | Decimal   | Premium cost per period.            |
| `created_at`        | Timestamp | Created.                            |
| `updated_at`        | Timestamp | Updated.                            |

### 3.4 `flt_vehicle_maintenances`

Records completed maintenance activities (while planned maintenance lives in
`sch_maintenance_schedules`).

| Field          | Type      | Description                                   |
| -------------- | --------- | --------------------------------------------- |
| `id`           | UUID (PK) | Maintenance ID.                               |
| `tenant_id`    | UUID (FK) | Tenant.                                       |
| `vehicle_id`   | UUID (FK) | Vehicle serviced.                             |
| `service_date` | Date      | Date of service.                              |
| `service_type` | Text      | Type of maintenance (oil change, inspection). |
| `provider`     | Text      | Service provider/garage.                      |
| `cost`         | Decimal   | Total cost.                                   |
| `odometer`     | Integer   | Odometer reading at service time.             |
| `notes`        | Text      | Additional notes.                             |

### 3.5 `flt_vehicle_expenses`

Captures miscellaneous expenses (fuel, tolls, parking) not recorded in
maintenance.

| Field          | Type      | Description                                     |
| -------------- | --------- | ----------------------------------------------- |
| `id`           | UUID (PK) | Expense ID.                                     |
| `tenant_id`    | UUID (FK) | Tenant.                                         |
| `vehicle_id`   | UUID (FK) | Vehicle.                                        |
| `expense_date` | Date      | Date incurred.                                  |
| `category`     | Enum      | `fuel`, `toll`, `parking`, `insurance`, `misc`. |
| `amount`       | Decimal   | Expense amount.                                 |
| `description`  | Text      | Additional details.                             |

### 3.6 `flt_vehicle_assignments`

Historical assignments of vehicles to drivers.

| Field        | Type      | Description                         |
| ------------ | --------- | ----------------------------------- |
| `id`         | UUID (PK) | Assignment ID.                      |
| `tenant_id`  | UUID (FK) | Tenant.                             |
| `vehicle_id` | UUID (FK) | Assigned vehicle.                   |
| `driver_id`  | UUID (FK) | Assigned driver.                    |
| `start_time` | Timestamp | Start timestamp.                    |
| `end_time`   | Timestamp | End timestamp (null if ongoing).    |
| `status`     | Enum      | `active`, `completed`, `cancelled`. |

### 3.7 `flt_vehicle_handovers`

Handover events when a vehicle passes from one party to another (driver
switches, shift changes).

| Field              | Type      | Description                         |
| ------------------ | --------- | ----------------------------------- |
| `id`               | UUID (PK) | Handover ID.                        |
| `tenant_id`        | UUID (FK) | Tenant.                             |
| `vehicle_id`       | UUID (FK) | Vehicle.                            |
| `from_member_id`   | UUID (FK) | Outgoing party (driver or fleet).   |
| `to_member_id`     | UUID (FK) | Incoming party.                     |
| `start_time`       | Timestamp | Start of handover.                  |
| `end_time`         | Timestamp | End of handover.                    |
| `odometer_start`   | Integer   | Odometer reading at handover start. |
| `odometer_end`     | Integer   | Odometer reading at handover end.   |
| `fuel_level_start` | Decimal   | Fuel level at start (0–1).          |
| `fuel_level_end`   | Decimal   | Fuel level at end (0–1).            |
| `notes`            | Text      | Handover notes.                     |

### 3.8 `flt_vehicle_lifecycle_events`

Generic event log capturing all major lifecycle events of a vehicle【705897994408243†L120-L124】. It enables
full traceability and supports analytics on vehicle utilisation and
retirement【705897994408243†L273-L274】.

| Field        | Type      | Description                                                                                                                        |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | UUID (PK) | Event ID.                                                                                                                          |
| `tenant_id`  | UUID (FK) | Tenant.                                                                                                                            |
| `vehicle_id` | UUID (FK) | Vehicle.                                                                                                                           |
| `event_type` | Enum      | `acquisition`, `registration`, `inspection`, `insurance`, `assignment`, `maintenance`, `accident`, `fine`, `handover`, `disposal`. |
| `event_date` | Date      | Date the event occurred.                                                                                                           |
| `details`    | JSON      | Structured details (cost, provider, policy, etc.).                                                                                 |
| `created_by` | UUID (FK) | Member who recorded the event.                                                                                                     |
| `created_at` | Timestamp | Created.                                                                                                                           |

### 3.9 `flt_vehicle_acquisitions` & `flt_vehicle_disposals`

These tables store specific acquisition and disposal data for vehicles,
providing financial context and supplier information.

**`flt_vehicle_acquisitions`**

| Field              | Type      | Description                                 |
| ------------------ | --------- | ------------------------------------------- |
| `id`               | UUID (PK) | Acquisition record.                         |
| `tenant_id`        | UUID (FK) | Tenant.                                     |
| `vehicle_id`       | UUID (FK) | Vehicle.                                    |
| `acquisition_type` | Enum      | `purchase`, `lease`, `rent`.                |
| `supplier_id`      | UUID (FK) | Vendor or leasing company (optional).       |
| `cost`             | Decimal   | Purchase or lease cost.                     |
| `currency`         | Char(3)   | Currency.                                   |
| `start_date`       | Date      | Acquisition or lease start.                 |
| `end_date`         | Date      | End of lease (null if purchase).            |
| `buyback_value`    | Decimal   | Residual or buyback value.                  |
| `notes`            | Text      | Notes (financing terms, invoice reference). |
| `created_at`       | Timestamp | Created.                                    |

**`flt_vehicle_disposals`**

| Field           | Type      | Description                                |
| --------------- | --------- | ------------------------------------------ |
| `id`            | UUID (PK) | Disposal record.                           |
| `tenant_id`     | UUID (FK) | Tenant.                                    |
| `vehicle_id`    | UUID (FK) | Vehicle.                                   |
| `disposal_type` | Enum      | `sold`, `scrapped`, `returned`, `donated`. |
| `date`          | Date      | Date of disposal.                          |
| `buyer_id`      | UUID (FK) | Buyer (if sold).                           |
| `sale_price`    | Decimal   | Amount received.                           |
| `currency`      | Char(3)   | Currency.                                  |
| `reason`        | Text      | Reason for disposal.                       |
| `notes`         | Text      | Additional information.                    |
| `created_at`    | Timestamp | Created.                                   |

### 3.10 `inv_investors` & `inv_vehicle_investors`

Fleetcore supports vehicles financed by external investors. An investor
provides capital and receives a share of the revenue (rolling stock
management)【705897994408243†L395-L401】.

**`inv_investors`**

| Field               | Type      | Description                              |
| ------------------- | --------- | ---------------------------------------- |
| `id`                | UUID (PK) | Investor ID.                             |
| `tenant_id`         | UUID (FK) | Tenant (owner of the fleet).             |
| `name`              | Text      | Investor name.                           |
| `contact_info`      | JSON      | Contact details (phone, email, address). |
| `agreement_details` | JSON      | Terms of investment.                     |
| `created_at`        | Timestamp | Created.                                 |
| `updated_at`        | Timestamp | Updated.                                 |

**`inv_vehicle_investors`**

| Field                  | Type      | Description                     |
| ---------------------- | --------- | ------------------------------- |
| `id`                   | UUID (PK) | Record ID.                      |
| `tenant_id`            | UUID (FK) | Tenant.                         |
| `vehicle_id`           | UUID (FK) | Vehicle.                        |
| `investor_id`          | UUID (FK) | Investor.                       |
| `ownership_percentage` | Decimal   | Percentage ownership (0–100).   |
| `invested_amount`      | Decimal   | Amount invested.                |
| `currency`             | Char(3)   | Currency.                       |
| `start_date`           | Date      | Start of investment.            |
| `end_date`             | Date      | End of investment (if buyback). |
| `created_at`           | Timestamp | Created.                        |

### 3.11 `flt_vehicle_platform_statuses`

Stores real‑time online/offline statuses per vehicle and platform, enabling
dashboards that show which vehicles are available on each ride‑hailing
platform【705897994408243†L127-L144】.

| Field         | Type      | Description                                 |
| ------------- | --------- | ------------------------------------------- |
| `id`          | UUID (PK) | Status ID.                                  |
| `tenant_id`   | UUID (FK) | Tenant.                                     |
| `vehicle_id`  | UUID (FK) | Vehicle.                                    |
| `platform_id` | UUID (FK) | Reference to `dir_platforms`.               |
| `status`      | Enum      | `online`, `offline`, `busy`, `maintenance`. |
| `status_time` | Timestamp | When the status was recorded.               |
| `created_at`  | Timestamp | Created.                                    |

## 4 Driver Domain (`rid_`)

Manages drivers (riders), their contracts, performance and requests.

### 4.1 `rid_drivers`

| Field                  | Type      | Description                                                      |
| ---------------------- | --------- | ---------------------------------------------------------------- |
| `id`                   | UUID (PK) | Driver ID.                                                       |
| `tenant_id`            | UUID (FK) | Tenant.                                                          |
| `first_name`           | Text      | First name.                                                      |
| `last_name`            | Text      | Last name.                                                       |
| `phone`                | Text      | Phone number.                                                    |
| `email`                | Text      | Email address.                                                   |
| `license_number`       | Text      | Driving licence number.                                          |
| `license_issue_date`   | Date      | Issue date.                                                      |
| `license_expiry_date`  | Date      | Expiry date.                                                     |
| `professional_card_no` | Text      | VTC/limousine card number (France)【611243862873268†L268-L280】. |
| `professional_expiry`  | Date      | Expiry of professional card.                                     |
| `driver_status`        | Enum      | `active`, `suspended`, `terminated`.                             |
| `rating`               | Decimal   | Average passenger rating.                                        |
| `notes`                | Text      | Internal notes.                                                  |
| `created_at`           | Timestamp | Created.                                                         |
| `updated_at`           | Timestamp | Updated.                                                         |
| `deleted_at`           | Timestamp | Soft‑delete.                                                     |

### 4.2 `rid_driver_cooperation_terms`

Stores the contractual terms between a driver and the fleet. Drivers may be
employees, contractors, investors or partners.

| Field                | Type      | Description                                                          |
| -------------------- | --------- | -------------------------------------------------------------------- |
| `id`                 | UUID (PK) | Record ID.                                                           |
| `tenant_id`          | UUID (FK) | Tenant.                                                              |
| `driver_id`          | UUID (FK) | Driver.                                                              |
| `cooperation_type`   | Enum      | `fixed_rent`, `percentage`, `salary`, `buy_out`, `investor_partner`. |
| `start_date`         | Date      | Start of cooperation.                                                |
| `end_date`           | Date      | End (null if ongoing).                                               |
| `fixed_rent_amount`  | Decimal   | Fixed weekly/monthly rent (if applicable).                           |
| `percentage_rate`    | Decimal   | Percentage share of revenue.                                         |
| `min_guarantee`      | Decimal   | Minimum guaranteed earnings.                                         |
| `weekly_work_hours`  | Integer   | Expected working hours.                                              |
| `wps_eligible`       | Boolean   | Whether the driver is paid via WPS (UAE).                            |
| `contract_reference` | Text      | Link to signed contract document.                                    |
| `signed_at`          | Date      | Date of signature.                                                   |
| `created_at`         | Timestamp | Created.                                                             |
| `updated_at`         | Timestamp | Updated.                                                             |

### 4.3 `rid_driver_performances`

Periodically stores key performance indicators for each driver.

| Field               | Type      | Description                  |
| ------------------- | --------- | ---------------------------- |
| `id`                | UUID (PK) | Record ID.                   |
| `tenant_id`         | UUID (FK) | Tenant.                      |
| `driver_id`         | UUID (FK) | Driver.                      |
| `period_start`      | Date      | Start of measurement period. |
| `period_end`        | Date      | End.                         |
| `trips_count`       | Integer   | Number of trips.             |
| `revenue_total`     | Decimal   | Total revenue generated.     |
| `rating_average`    | Decimal   | Average passenger rating.    |
| `cancellation_rate` | Decimal   | Rate of cancellations.       |
| `punctuality_score` | Decimal   | Score for on‑time pickups.   |
| `feedback_notes`    | Text      | Summary of feedback.         |

### 4.4 `rid_driver_requests`

Tracks requests submitted by drivers (leave, change of vehicle, loan requests).

| Field              | Type      | Description                                          |
| ------------------ | --------- | ---------------------------------------------------- |
| `id`               | UUID (PK) | Request ID.                                          |
| `tenant_id`        | UUID (FK) | Tenant.                                              |
| `driver_id`        | UUID (FK) | Driver.                                              |
| `request_type`     | Enum      | `leave`, `vehicle_change`, `financial_aid`, `other`. |
| `requested_at`     | Timestamp | When the request was made.                           |
| `status`           | Enum      | `pending`, `approved`, `rejected`, `completed`.      |
| `resolution_notes` | Text      | Notes on how it was resolved.                        |

### 4.5 `rid_driver_blacklists`

Lists drivers who are banned or suspended, with reasons and durations.

| Field            | Type      | Description                              |
| ---------------- | --------- | ---------------------------------------- |
| `id`             | UUID (PK) | Record ID.                               |
| `tenant_id`      | UUID (FK) | Tenant.                                  |
| `driver_id`      | UUID (FK) | Driver.                                  |
| `reason`         | Text      | Reason for blacklisting.                 |
| `blacklisted_at` | Timestamp | When the ban was applied.                |
| `blacklisted_by` | UUID (FK) | Member who initiated the ban.            |
| `resolved_at`    | Timestamp | When ban was lifted (null if permanent). |

## 5 Finance Domain (`fin_`)

Handles monetary accounts, transactions, payroll and bonus/penalty rules.

### 5.1 `fin_accounts`

| Field          | Type      | Description                                                                                |
| -------------- | --------- | ------------------------------------------------------------------------------------------ |
| `id`           | UUID (PK) | Account ID.                                                                                |
| `tenant_id`    | UUID (FK) | Tenant.                                                                                    |
| `account_type` | Enum      | `bank`, `cash_desk`, `fuel_card`, `maintenance_card`, `salik_card`, `investor`, `partner`. |
| `name`         | Text      | Label (Main Bank).                                                                         |
| `currency`     | Char(3)   | Currency.                                                                                  |
| `balance`      | Decimal   | Current balance.                                                                           |
| `created_at`   | Timestamp | Created.                                                                                   |
| `updated_at`   | Timestamp | Updated.                                                                                   |

### 5.2 `fin_transactions`

Represents any money movement. The system calculates driver balances on
the fly by aggregating transactions.

| Field              | Type      | Description                                                                                                     |
| ------------------ | --------- | --------------------------------------------------------------------------------------------------------------- |
| `id`               | UUID (PK) | Transaction ID.                                                                                                 |
| `tenant_id`        | UUID (FK) | Tenant.                                                                                                         |
| `account_id`       | UUID (FK) | Account affected.                                                                                               |
| `counterparty_id`  | UUID      | Driver, vendor, platform or client associated.                                                                  |
| `transaction_type` | Enum      | `cash_in`, `cash_out`, `transfer_in`, `transfer_out`, `settlement`, `salary`, `driver_payment`, `fine`, `toll`. |
| `amount`           | Decimal   | Positive value.                                                                                                 |
| `currency`         | Char(3)   | Currency.                                                                                                       |
| `date_time`        | Timestamp | Timestamp of transaction.                                                                                       |
| `reference`        | Text      | Description or reference number.                                                                                |
| `related_trip_id`  | UUID      | Trip reference (if applicable).                                                                                 |
| `created_at`       | Timestamp | Created.                                                                                                        |

### 5.3 `fin_bonus_penalty_rules`

Configuration for bonus and penalty policies (e.g., reward for achieving
targets, fines for late handovers).

| Field         | Type      | Description                          |
| ------------- | --------- | ------------------------------------ |
| `id`          | UUID (PK) | Rule ID.                             |
| `tenant_id`   | UUID (FK) | Tenant.                              |
| `rule_type`   | Enum      | `bonus`, `penalty`.                  |
| `name`        | Text      | Name of the rule.                    |
| `description` | Text      | Description.                         |
| `trigger`     | JSON      | Conditions (e.g., trip_count ≥ 100). |
| `amount`      | Decimal   | Fixed amount or percentage.          |
| `currency`    | Char(3)   | Currency (if fixed).                 |
| `active`      | Boolean   | Enabled/disabled.                    |

### 5.4 `fin_driver_payment_batches`

Defines payroll batches for UAE WPS or other salary runs. Each batch
groups multiple driver payments and generates a file to be sent to a bank.

| Field          | Type      | Description                                                 |
| -------------- | --------- | ----------------------------------------------------------- |
| `id`           | UUID (PK) | Batch ID.                                                   |
| `tenant_id`    | UUID (FK) | Tenant paying the drivers.                                  |
| `period_start` | Date      | Start of salary period.                                     |
| `period_end`   | Date      | End of period.                                              |
| `account_id`   | UUID (FK) | Bank account used for payments (WPS‑compliant).             |
| `total_amount` | Decimal   | Sum of all driver payments.                                 |
| `currency`     | Char(3)   | Currency.                                                   |
| `file_url`     | Text      | Link to generated WPS file (e.g., SIF).                     |
| `status`       | Enum      | `draft`, `exported`, `sent_to_bank`, `processed`, `failed`. |
| `created_by`   | UUID (FK) | Member who created the batch.                               |
| `created_at`   | Timestamp | Created.                                                    |
| `updated_at`   | Timestamp | Updated.                                                    |

### 5.5 `fin_driver_payments`

Each record represents an individual driver’s salary within a payroll batch.

| Field            | Type      | Description                                                   |
| ---------------- | --------- | ------------------------------------------------------------- |
| `id`             | UUID (PK) | Payment ID.                                                   |
| `tenant_id`      | UUID (FK) | Tenant.                                                       |
| `batch_id`       | UUID (FK) | Payroll batch (link to `fin_driver_payment_batches`).         |
| `driver_id`      | UUID (FK) | Driver being paid.                                            |
| `gross_salary`   | Decimal   | Base salary.                                                  |
| `allowances`     | Decimal   | Allowances (housing, transport).                              |
| `deductions`     | Decimal   | Total deductions (penalties, advances).                       |
| `net_pay`        | Decimal   | Net salary after allowances and deductions.                   |
| `currency`       | Char(3)   | Currency.                                                     |
| `account_number` | Text      | Driver’s bank account or WPS card number.                     |
| `bank_code`      | Text      | Bank identifier (WPS requirement).                            |
| `remarks`        | Text      | Comments.                                                     |
| `status`         | Enum      | `pending`, `included_in_batch`, `exported`, `paid`, `failed`. |
| `created_at`     | Timestamp | Created.                                                      |
| `updated_at`     | Timestamp | Updated.                                                      |

## 6 Trip & Booking Domain (`trp_`)

Centralised tables for trip data, platform accounts, B2B bookings and
settlements.

### 6.1 `trp_platform_accounts`

Associates drivers or vehicles with ride‑hailing platform profiles.

| Field              | Type      | Description                                        |
| ------------------ | --------- | -------------------------------------------------- |
| `id`               | UUID (PK) | Record ID.                                         |
| `tenant_id`        | UUID (FK) | Tenant.                                            |
| `driver_id`        | UUID (FK) | Driver (nullable if account belongs to a vehicle). |
| `vehicle_id`       | UUID (FK) | Vehicle (nullable if account belongs to a driver). |
| `platform_id`      | UUID (FK) | Reference to `dir_platforms`.                      |
| `platform_user_id` | Text      | Identifier on the platform.                        |
| `status`           | Enum      | `active`, `inactive`, `pending`, `blocked`.        |
| `cash_enabled`     | Boolean   | Whether cash rides are allowed.                    |
| `created_at`       | Timestamp | Created.                                           |
| `updated_at`       | Timestamp | Updated.                                           |

### 6.2 `trp_trips`

Generalised trip records imported from platforms or created for internal
bookings.

| Field                 | Type      | Description                                      |
| --------------------- | --------- | ------------------------------------------------ |
| `id`                  | UUID (PK) | Trip ID.                                         |
| `tenant_id`           | UUID (FK) | Tenant.                                          |
| `platform_id`         | UUID (FK) | Platform (nullable for office trips).            |
| `driver_id`           | UUID (FK) | Driver.                                          |
| `vehicle_id`          | UUID (FK) | Vehicle.                                         |
| `client_id`           | UUID (FK) | Corporate client (see CRM).                      |
| `trip_date`           | Date      | Date of trip.                                    |
| `start_time`          | Timestamp | Start time.                                      |
| `end_time`            | Timestamp | End time.                                        |
| `pickup_latitude`     | Decimal   | Latitude of pickup.                              |
| `pickup_longitude`    | Decimal   | Longitude of pickup.                             |
| `dropoff_latitude`    | Decimal   | Latitude of drop‑off.                            |
| `dropoff_longitude`   | Decimal   | Longitude of drop‑off.                           |
| `distance_km`         | Decimal   | Distance travelled.                              |
| `duration_minutes`    | Decimal   | Duration in minutes.                             |
| `fare_base`           | Decimal   | Base fare.                                       |
| `fare_distance`       | Decimal   | Distance component.                              |
| `fare_time`           | Decimal   | Time component.                                  |
| `surge_multiplier`    | Decimal   | Surge factor.                                    |
| `tip_amount`          | Decimal   | Tip.                                             |
| `platform_commission` | Decimal   | Commission taken by platform.                    |
| `net_earnings`        | Decimal   | Driver earnings after commission.                |
| `payment_method`      | Enum      | `cash`, `card`, `wallet`, `invoice`.             |
| `status`              | Enum      | `completed`, `cancelled`, `rejected`, `no_show`. |
| `created_at`          | Timestamp | Created.                                         |

### 6.3 `trp_office_trip_bookings`

B2B (office) bookings created by corporate clients.

| Field                  | Type      | Description                                                     |
| ---------------------- | --------- | --------------------------------------------------------------- |
| `id`                   | UUID (PK) | Booking ID.                                                     |
| `tenant_id`            | UUID (FK) | Tenant.                                                         |
| `client_id`            | UUID (FK) | Corporate client (CRM).                                         |
| `requested_by`         | UUID (FK) | Member who created the booking.                                 |
| `service_type`         | Enum      | `one_way`, `round_trip`, `hourly`.                              |
| `pickup_time`          | Timestamp | Scheduled pickup.                                               |
| `pickup_location`      | Text      | Pickup address.                                                 |
| `dropoff_location`     | Text      | Drop‑off address.                                               |
| `passengers`           | Integer   | Number of passengers.                                           |
| `preferred_class`      | Text      | Desired vehicle class.                                          |
| `special_requirements` | Text      | Child seat, luggage, etc.                                       |
| `assigned_vehicle_id`  | UUID (FK) | Assigned vehicle.                                               |
| `assigned_driver_id`   | UUID (FK) | Assigned driver.                                                |
| `commission_level`     | Decimal   | Commission percentage credited to referrer.                     |
| `status`               | Enum      | `pending`, `accepted`, `in_progress`, `completed`, `cancelled`. |
| `created_at`           | Timestamp | Created.                                                        |
| `updated_at`           | Timestamp | Updated.                                                        |

### 6.4 `trp_client_invoices` & `trp_client_invoice_lines`

Invoices billed to corporate clients for trips and services, distinct from
tenant billing (see Billing domain). Each invoice contains multiple
lines describing individual trips or services.

**`trp_client_invoices`**

| Field          | Type      | Description                                        |
| -------------- | --------- | -------------------------------------------------- |
| `id`           | UUID (PK) | Invoice ID.                                        |
| `tenant_id`    | UUID (FK) | Tenant.                                            |
| `client_id`    | UUID (FK) | Corporate client.                                  |
| `invoice_date` | Date      | Date issued.                                       |
| `due_date`     | Date      | Payment due date.                                  |
| `status`       | Enum      | `draft`, `issued`, `paid`, `overdue`, `cancelled`. |
| `total_amount` | Decimal   | Total including VAT.                               |
| `vat_amount`   | Decimal   | VAT portion.                                       |
| `currency`     | Char(3)   | Currency.                                          |
| `created_at`   | Timestamp | Created.                                           |
| `updated_at`   | Timestamp | Updated.                                           |

**`trp_client_invoice_lines`**

| Field         | Type      | Description                         |
| ------------- | --------- | ----------------------------------- |
| `id`          | UUID (PK) | Line ID.                            |
| `invoice_id`  | UUID (FK) | Reference to `trp_client_invoices`. |
| `description` | Text      | Description (trip details).         |
| `quantity`    | Integer   | Number of units (trips, hours).     |
| `unit_price`  | Decimal   | Unit price.                         |
| `vat_rate`    | Decimal   | VAT rate applied.                   |
| `line_total`  | Decimal   | Line total.                         |

### 6.5 `trp_settlements`

Records settlements received from ride‑hailing platforms (weekly or
monthly). Each settlement covers a period and is reconciled with
aggregate trip revenue.

| Field             | Type      | Description                                |
| ----------------- | --------- | ------------------------------------------ |
| `id`              | UUID (PK) | Settlement ID.                             |
| `tenant_id`       | UUID (FK) | Tenant.                                    |
| `platform_id`     | UUID (FK) | Platform.                                  |
| `period_start`    | Date      | Start of settlement period.                |
| `period_end`      | Date      | End of period.                             |
| `expected_amount` | Decimal   | Calculated expected amount from trip data. |
| `received_amount` | Decimal   | Amount actually received.                  |
| `status`          | Enum      | `reconciled`, `discrepancy`, `pending`.    |
| `created_at`      | Timestamp | Created.                                   |

## 7 Scheduling Domain (`sch_`)

Manages driver shifts, maintenance appointments, goals and tasks.

### 7.1 `sch_shifts`

| Field        | Type      | Description                                           |
| ------------ | --------- | ----------------------------------------------------- |
| `id`         | UUID (PK) | Shift ID.                                             |
| `tenant_id`  | UUID (FK) | Tenant.                                               |
| `driver_id`  | UUID (FK) | Driver.                                               |
| `vehicle_id` | UUID (FK) | Vehicle.                                              |
| `start_time` | Timestamp | Start of shift.                                       |
| `end_time`   | Timestamp | End of shift.                                         |
| `status`     | Enum      | `scheduled`, `in_progress`, `completed`, `cancelled`. |
| `notes`      | Text      | Optional notes.                                       |

### 7.2 `sch_maintenance_schedules`

| Field              | Type      | Description                                         |
| ------------------ | --------- | --------------------------------------------------- |
| `id`               | UUID (PK) | Schedule ID.                                        |
| `tenant_id`        | UUID (FK) | Tenant.                                             |
| `vehicle_id`       | UUID (FK) | Vehicle.                                            |
| `maintenance_type` | Text      | Service type.                                       |
| `scheduled_start`  | Timestamp | Planned start time.                                 |
| `scheduled_end`    | Timestamp | Planned end time.                                   |
| `status`           | Enum      | `planned`, `in_progress`, `completed`, `cancelled`. |
| `provider`         | Text      | Service provider.                                   |
| `notes`            | Text      | Notes.                                              |

### 7.3 `sch_goals`

Defines targets for fleets, vehicles or drivers (e.g., number of trips).

| Field          | Type      | Description                            |
| -------------- | --------- | -------------------------------------- |
| `id`           | UUID (PK) | Goal ID.                               |
| `tenant_id`    | UUID (FK) | Tenant.                                |
| `scope`        | Enum      | `fleet`, `vehicle`, `driver`.          |
| `reference_id` | UUID      | Vehicle or driver ID (null for fleet). |
| `metric`       | Text      | Metric name (`trips`, `revenue`).      |
| `target_value` | Decimal   | Target.                                |
| `period`       | Enum      | `daily`, `weekly`, `monthly`.          |
| `start_date`   | Date      | Start date.                            |
| `end_date`     | Date      | End date.                              |
| `created_at`   | Timestamp | Created.                               |

### 7.4 `sch_tasks`

Internal tasks and alerts generated by the system or manually created.

| Field         | Type      | Description                                                                            |
| ------------- | --------- | -------------------------------------------------------------------------------------- |
| `id`          | UUID (PK) | Task ID.                                                                               |
| `tenant_id`   | UUID (FK) | Tenant.                                                                                |
| `task_type`   | Enum      | `maintenance_alert`, `zone_violation`, `document_expiry`, `payment_overdue`, `custom`. |
| `subject`     | Text      | Brief summary.                                                                         |
| `description` | Text      | Detailed description.                                                                  |
| `assigned_to` | UUID (FK) | Member assigned.                                                                       |
| `status`      | Enum      | `new`, `in_progress`, `resolved`, `closed`.                                            |
| `priority`    | Enum      | `low`, `medium`, `high`.                                                               |
| `created_at`  | Timestamp | Creation time.                                                                         |
| `due_at`      | Timestamp | Due date/time.                                                                         |
| `resolved_at` | Timestamp | Resolution date/time.                                                                  |

## 8 Onboarding & HR Domain (`hr_`)

Manages recruitment and onboarding for drivers.

### 8.1 `hr_candidates`

| Field              | Type      | Description                                                                                                                          |
| ------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `id`               | UUID (PK) | Candidate ID.                                                                                                                        |
| `tenant_id`        | UUID (FK) | Tenant.                                                                                                                              |
| `first_name`       | Text      | First name.                                                                                                                          |
| `last_name`        | Text      | Last name.                                                                                                                           |
| `phone`            | Text      | Phone number.                                                                                                                        |
| `email`            | Text      | Email.                                                                                                                               |
| `application_date` | Date      | Date of application.                                                                                                                 |
| `status`           | Enum      | `applied`, `documents_submitted`, `interview_scheduled`, `interview_completed`, `background_check`, `approved`, `rejected`, `hired`. |
| `source`           | Text      | Source of application.                                                                                                               |
| `notes`            | Text      | HR notes.                                                                                                                            |
| `created_at`       | Timestamp | Created.                                                                                                                             |
| `updated_at`       | Timestamp | Updated.                                                                                                                             |

### 8.2 `hr_onboarding_stages`

| Field          | Type      | Description                |
| -------------- | --------- | -------------------------- |
| `id`           | UUID (PK) | Stage record.              |
| `tenant_id`    | UUID (FK) | Tenant.                    |
| `candidate_id` | UUID (FK) | Candidate.                 |
| `stage`        | Enum      | Matches candidate status.  |
| `start_at`     | Timestamp | Stage start.               |
| `end_at`       | Timestamp | Stage end.                 |
| `assigned_to`  | UUID (FK) | Member handling the stage. |

## 9 Billing & Subscription Domain (`bil_`)

Supports SaaS billing: plans, subscriptions, usage metrics and invoices for
tenants. These tables allow the provider to charge tenants based on their
plan and usage.

### 9.1 `bil_billing_plans`

Defines the available subscription plans.

| Field           | Type      | Description                  |
| --------------- | --------- | ---------------------------- |
| `id`            | UUID (PK) | Plan ID.                     |
| `name`          | Text      | Plan name.                   |
| `description`   | Text      | Description of features.     |
| `monthly_fee`   | Decimal   | Base monthly fee.            |
| `currency`      | Char(3)   | Currency.                    |
| `driver_limit`  | Integer   | Number of drivers included.  |
| `vehicle_limit` | Integer   | Number of vehicles included. |
| `trip_limit`    | Integer   | Number of trips included.    |
| `overage_fee`   | Decimal   | Fee per unit over limit.     |
| `created_at`    | Timestamp | Created.                     |
| `updated_at`    | Timestamp | Updated.                     |

### 9.2 `bil_tenant_subscriptions`

| Field        | Type      | Description                                   |
| ------------ | --------- | --------------------------------------------- |
| `id`         | UUID (PK) | Subscription ID.                              |
| `tenant_id`  | UUID (FK) | Tenant.                                       |
| `plan_id`    | UUID (FK) | Selected plan.                                |
| `start_date` | Date      | Start date.                                   |
| `end_date`   | Date      | End date (null for ongoing).                  |
| `status`     | Enum      | `active`, `canceled`, `suspended`, `expired`. |
| `auto_renew` | Boolean   | Auto‑renew flag.                              |
| `created_at` | Timestamp | Created.                                      |
| `updated_at` | Timestamp | Updated.                                      |

### 9.3 `bil_tenant_usage_metrics`

Aggregated metrics for each billing period, used to calculate overage fees
and monitor adoption【535592711015414†L482-L505】.

| Field                   | Type      | Description                       |
| ----------------------- | --------- | --------------------------------- |
| `id`                    | UUID (PK) | Metric ID.                        |
| `tenant_id`             | UUID (FK) | Tenant.                           |
| `period_start`          | Date      | Start of period.                  |
| `period_end`            | Date      | End of period.                    |
| `drivers_count`         | Integer   | Active drivers.                   |
| `vehicles_count`        | Integer   | Active vehicles.                  |
| `trips_count`           | Integer   | Number of completed trips.        |
| `support_tickets_count` | Integer   | Support tickets raised.           |
| `storage_gb`            | Decimal   | Storage used in GB.               |
| `api_calls`             | Integer   | Number of API calls (if metered). |
| `generated_at`          | Timestamp | When metrics were generated.      |

### 9.4 `bil_tenant_invoices` & `bil_tenant_invoice_lines`

Invoices issued to tenants for subscription and usage.

**`bil_tenant_invoices`**

| Field             | Type      | Description                                       |
| ----------------- | --------- | ------------------------------------------------- |
| `id`              | UUID (PK) | Invoice ID.                                       |
| `tenant_id`       | UUID (FK) | Tenant.                                           |
| `invoice_date`    | Date      | Date of issue.                                    |
| `due_date`        | Date      | Due date.                                         |
| `period_start`    | Date      | Start of billed period.                           |
| `period_end`      | Date      | End of billed period.                             |
| `status`          | Enum      | `draft`, `issued`, `paid`, `overdue`, `canceled`. |
| `subtotal_amount` | Decimal   | Total before VAT.                                 |
| `vat_amount`      | Decimal   | VAT.                                              |
| `total_amount`    | Decimal   | Subtotal + VAT.                                   |
| `currency`        | Char(3)   | Currency.                                         |
| `notes`           | Text      | Additional comments.                              |
| `created_at`      | Timestamp | Created.                                          |
| `updated_at`      | Timestamp | Updated.                                          |

**`bil_tenant_invoice_lines`**

| Field         | Type      | Description                              |
| ------------- | --------- | ---------------------------------------- |
| `id`          | UUID (PK) | Line ID.                                 |
| `invoice_id`  | UUID (FK) | Reference to `bil_tenant_invoices`.      |
| `description` | Text      | Description (subscription fee, overage). |
| `quantity`    | Integer   | Number of units (extra drivers).         |
| `unit_price`  | Decimal   | Price per unit.                          |
| `vat_rate`    | Decimal   | VAT rate applied.                        |
| `line_total`  | Decimal   | Total for this line.                     |
| `created_at`  | Timestamp | Created.                                 |
| `updated_at`  | Timestamp | Updated.                                 |

### 9.5 `bil_tenant_payments`

| Field                   | Type      | Description                                     |
| ----------------------- | --------- | ----------------------------------------------- |
| `id`                    | UUID (PK) | Payment ID.                                     |
| `tenant_id`             | UUID (FK) | Tenant.                                         |
| `invoice_id`            | UUID (FK) | Tenant invoice being paid.                      |
| `payment_date`          | Date      | Date of payment.                                |
| `amount`                | Decimal   | Amount paid.                                    |
| `currency`              | Char(3)   | Currency.                                       |
| `payment_method`        | Enum      | `bank_transfer`, `credit_card`, `direct_debit`. |
| `transaction_reference` | Text      | Bank or gateway reference.                      |
| `status`                | Enum      | `received`, `applied`, `refunded`, `failed`.    |
| `created_at`            | Timestamp | Created.                                        |
| `updated_at`            | Timestamp | Updated.                                        |

## 10 CRM & Commercial Domain (`crm_`)

Supports marketing, sales and client management.

### 10.1 `crm_leads`

| Field           | Type      | Description                              |
| --------------- | --------- | ---------------------------------------- |
| `id`            | UUID (PK) | Lead ID.                                 |
| `tenant_id`     | UUID (FK) | Tenant.                                  |
| `contact_name`  | Text      | Name of contact person.                  |
| `contact_email` | Text      | Email.                                   |
| `contact_phone` | Text      | Phone.                                   |
| `company_name`  | Text      | Company.                                 |
| `source`        | Text      | Source (`web`, `referral`, `event`).     |
| `status`        | Enum      | `new`, `qualified`, `converted`, `lost`. |
| `notes`         | Text      | Notes.                                   |
| `created_at`    | Timestamp | Created.                                 |
| `updated_at`    | Timestamp | Updated.                                 |

### 10.2 `crm_opportunities`

Represents potential deals with a monetary value.

| Field                 | Type      | Description                                              |
| --------------------- | --------- | -------------------------------------------------------- |
| `id`                  | UUID (PK) | Opportunity ID.                                          |
| `tenant_id`           | UUID (FK) | Tenant.                                                  |
| `lead_id`             | UUID (FK) | Lead (nullable if created directly).                     |
| `value`               | Decimal   | Estimated deal value.                                    |
| `currency`            | Char(3)   | Currency.                                                |
| `stage`               | Enum      | `prospecting`, `proposal`, `negotiation`, `won`, `lost`. |
| `expected_close_date` | Date      | Anticipated closure.                                     |
| `probability`         | Decimal   | Probability (0–1).                                       |
| `responsible_id`      | UUID (FK) | Member responsible.                                      |
| `notes`               | Text      | Notes.                                                   |
| `created_at`          | Timestamp | Created.                                                 |
| `updated_at`          | Timestamp | Updated.                                                 |

### 10.3 `crm_contracts`

Stores signed contracts with corporate clients.

| Field           | Type      | Description                         |
| --------------- | --------- | ----------------------------------- |
| `id`            | UUID (PK) | Contract ID.                        |
| `tenant_id`     | UUID (FK) | Tenant.                             |
| `client_id`     | UUID (FK) | Corporate client.                   |
| `contract_type` | Text      | Type (`annual_service`, `project`). |
| `start_date`    | Date      | Start date.                         |
| `end_date`      | Date      | End date.                           |
| `status`        | Enum      | `active`, `terminated`, `expired`.  |
| `total_value`   | Decimal   | Total contract value.               |
| `currency`      | Char(3)   | Currency.                           |
| `terms`         | Text      | Contract terms.                     |
| `created_at`    | Timestamp | Created.                            |
| `updated_at`    | Timestamp | Updated.                            |

## 11 Support Domain (`sup_`)

Manages customer support tickets and feedback, ensuring issues are tracked,
history is preserved and customer satisfaction is measured【535592711015414†L466-L475】【535592711015414†L455-L460】.

### 11.1 `sup_support_tickets`

| Field         | Type      | Description                                             |
| ------------- | --------- | ------------------------------------------------------- |
| `id`          | UUID (PK) | Ticket ID.                                              |
| `tenant_id`   | UUID (FK) | Tenant submitting the ticket.                           |
| `opened_by`   | UUID (FK) | Member or client who opened the ticket.                 |
| `subject`     | Text      | Ticket subject.                                         |
| `category`    | Text      | Category (`billing`, `technical`, `platform`, `other`). |
| `priority`    | Enum      | `low`, `medium`, `high`, `urgent`.                      |
| `status`      | Enum      | `open`, `in_progress`, `resolved`, `closed`.            |
| `assigned_to` | UUID (FK) | Provider employee handling the ticket.                  |
| `created_at`  | Timestamp | Created.                                                |
| `updated_at`  | Timestamp | Updated.                                                |
| `closed_at`   | Timestamp | Closed date (null if open).                             |

### 11.2 `sup_ticket_messages`

Stores conversation threads within a ticket.

| Field       | Type      | Description                           |
| ----------- | --------- | ------------------------------------- |
| `id`        | UUID (PK) | Message ID.                           |
| `tenant_id` | UUID (FK) | Tenant.                               |
| `ticket_id` | UUID (FK) | Ticket.                               |
| `sender_id` | UUID (FK) | Sender (member or provider employee). |
| `message`   | Text      | Message text.                         |
| `sent_at`   | Timestamp | When the message was sent.            |

### 11.3 `sup_customer_feedback`

Collects ratings and feedback after ticket resolution.

| Field          | Type      | Description             |
| -------------- | --------- | ----------------------- |
| `id`           | UUID (PK) | Feedback ID.            |
| `tenant_id`    | UUID (FK) | Tenant.                 |
| `ticket_id`    | UUID (FK) | Ticket being evaluated. |
| `rating`       | Integer   | Rating (1–5).           |
| `comments`     | Text      | Feedback comments.      |
| `submitted_at` | Timestamp | Submitted.              |

## 12 Local Fees & Violations Domain (`fin_`)

Captures tolls, fines and insurance categories specific to each country.

### 12.1 `fin_toll_gates`

| Field            | Type      | Description                                                         |
| ---------------- | --------- | ------------------------------------------------------------------- |
| `id`             | UUID (PK) | Toll gate ID.                                                       |
| `country_code`   | Char(2)   | Country where gate is located.                                      |
| `name`           | Text      | Name of toll gate.                                                  |
| `location`       | Text      | Address or GPS coordinates.                                         |
| `toll_fee`       | Decimal   | Fee charged per pass (local currency)【751851848749800†L164-L168】. |
| `currency`       | Char(3)   | Currency.                                                           |
| `effective_date` | Date      | Start date for this fee.                                            |
| `expiry_date`    | Date      | End date (null if current).                                         |
| `created_at`     | Timestamp | Created.                                                            |
| `updated_at`     | Timestamp | Updated.                                                            |

### 12.2 `fin_toll_transactions`

| Field          | Type      | Description                                                       |
| -------------- | --------- | ----------------------------------------------------------------- |
| `id`           | UUID (PK) | Toll event ID.                                                    |
| `tenant_id`    | UUID (FK) | Tenant.                                                           |
| `vehicle_id`   | UUID (FK) | Vehicle.                                                          |
| `driver_id`    | UUID (FK) | Driver (nullable).                                                |
| `trip_id`      | UUID (FK) | Trip (nullable).                                                  |
| `toll_gate_id` | UUID (FK) | Toll gate.                                                        |
| `date_time`    | Timestamp | Date/time of event.                                               |
| `amount`       | Decimal   | Fee amount.                                                       |
| `currency`     | Char(3)   | Currency.                                                         |
| `paid_status`  | Enum      | `pending`, `deducted_from_driver`, `deducted_from_fleet`, `paid`. |
| `created_at`   | Timestamp | Created.                                                          |
| `updated_at`   | Timestamp | Updated.                                                          |

### 12.3 `fin_traffic_fines`

| Field            | Type      | Description                                                   |
| ---------------- | --------- | ------------------------------------------------------------- |
| `id`             | UUID (PK) | Fine ID.                                                      |
| `tenant_id`      | UUID (FK) | Tenant.                                                       |
| `vehicle_id`     | UUID (FK) | Vehicle.                                                      |
| `driver_id`      | UUID (FK) | Driver (nullable).                                            |
| `violation_type` | Text      | Classification (`speeding`, `parking`, `salik_unpaid`, etc.). |
| `description`    | Text      | Description of the violation.                                 |
| `fine_amount`    | Decimal   | Amount.                                                       |
| `currency`       | Char(3)   | Currency.                                                     |
| `issue_date`     | Date      | Date issued.                                                  |
| `due_date`       | Date      | Payment deadline.                                             |
| `paid_date`      | Date      | Date paid.                                                    |
| `status`         | Enum      | `issued`, `disputed`, `paid`, `cancelled`.                    |
| `points`         | Integer   | Licence points.                                               |
| `authority`      | Text      | Issuing authority.                                            |
| `location`       | Text      | Location.                                                     |
| `created_at`     | Timestamp | Created.                                                      |
| `updated_at`     | Timestamp | Updated.                                                      |

### 12.4 `fin_insurance_types`

| Field              | Type      | Description                            |
| ------------------ | --------- | -------------------------------------- |
| `id`               | UUID (PK) | Insurance type ID.                     |
| `country_code`     | Char(2)   | Country.                               |
| `name`             | Text      | Name (`third_party`, `comprehensive`). |
| `minimum_coverage` | Decimal   | Minimum coverage required.             |
| `currency`         | Char(3)   | Currency.                              |
| `description`      | Text      | Additional notes.                      |
| `created_at`       | Timestamp | Created.                               |
| `updated_at`       | Timestamp | Updated.                               |

---

This detailed model provides the foundation for Fleetcore’s first release and
future iterations. It aligns with multi‑tenant best practices, incorporates
local compliance requirements【611243862873268†L268-L280】, supports SaaS billing and offers a clear,
domain‑prefixed naming scheme to simplify implementation and maintenance. The
model can be extended in later lots (e.g., stock management, geolocation
télémetrie, HR processes) without major changes to the core structure.
