# Fleetcore – Comprehensive Functional Specification

**Date:** 7 October 2025

This document complements the _Fleetcore restart plan_ by providing detailed functional specifications and process descriptions for the final version of the Fleetcore SaaS. It covers every domain and business process involved in the end‑to‑end lifecycle of vehicles, drivers, revenues, billing, CRM, support, HR and investor management. The goal is to ensure that no capability is lost and that the relationships between tables are clear. All table names follow the naming conventions defined in version 2 (prefixes by domain and `snake_case` for columns【491524022416630†L64-L67】).

## 1. Overview and guiding principles

Fleetcore is a multi‑tenant ride‑hailing fleet management system designed for the United Arab Emirates and France. It manages vehicles, drivers, trips, finances, investor shares and SaaS billing, while providing CRM and support modules for the SaaS provider. The platform must comply with local regulations such as VTC licence requirements, vehicle age limits, minimum fares and VAT rates【407970352218538†L268-L280】. Data is isolated per tenant via a `tenant_id` and row‑level security policies (RLS) in Supabase. Authentication and organisation management are handled by Clerk, while Stripe (or Paddle) manages SaaS billing. Other third‑party services include Traccar (GPS), Resend (email), Upstash (cache) and Sentry (monitoring).

## 2. Domains and data model

The final data model consists of fourteen domains and **55 tables** (see the restart plan for table names). Each domain encapsulates a portion of the business processes. This section explains the functional purpose of each domain, the key tables and their relationships, and how they fit into the overall workflows. Throughout the document, we reference requirements from the MyTaxiCRM baseline where appropriate.

### 2.1 Administration (`adm_` domain)

**Purpose:** Manage tenants (organisations), user accounts, roles, audit logs and invitations. It also stores provider employees and lifecycle events.

**Tables:**

| Table                         | Description                                                                                                                                                                                                                                                   | Relationships                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `adm_tenants`                 | Represents a fleet operator or corporate customer. Stores the company name, country (e.g. `AE` or `FR`), default currency, VAT rate, timezone and status. Also contains `clerk_organization_id` for mapping to Clerk and `metadata` JSONB for extra settings. | Has many `adm_members`, `adm_invitations` and all business objects (`flt_vehicles`, `rid_drivers`, etc.) share the same `tenant_id`. |
| `adm_members`                 | Users who access Fleetcore. Each member has a `tenant_id`, a `clerk_user_id` (mapping to Clerk), email, name and status. Members belong to one tenant and can have multiple roles.                                                                            | Many‑to‑many with `adm_roles` via `adm_member_roles`.                                                                                |
| `adm_roles`                   | Defines RBAC roles per tenant. Stores a name, description and permissions JSONB (list of modules accessible).                                                                                                                                                 | Linked to `adm_members` via `adm_member_roles`.                                                                                      |
| `adm_member_roles`            | Junction table linking members to roles.                                                                                                                                                                                                                      | Points to `adm_members` and `adm_roles`.                                                                                             |
| `adm_audit_logs`              | Records all user actions on entities for compliance. Contains actor (`member_id`), entity type, entity id, action (create/update/delete), changes (JSONB), timestamp and IP address.                                                                          | Linked to `adm_members` and any entity.                                                                                              |
| `adm_provider_employees`      | List of SaaS provider staff (sales, support, product). Each has a Clerk ID and assigned department.                                                                                                                                                           | Used by the provider backoffice.                                                                                                     |
| `adm_tenant_lifecycle_events` | Records lifecycle changes for tenants (creation, plan change, suspension, reactivation, cancellation). Each event includes the tenant, event type, date and who performed it.                                                                                 | Linked to `adm_tenants`.                                                                                                             |
| `adm_invitations`             | Central table for managing secure invitation links. Fields include `tenant_id` (organisation to join), `email` of invitee, `role`, signed `token`, `expires_at` and `status`. Used for KYC invitations, admin invites and user invites.                       | Linked to `adm_tenants`; consumed during registration to create a `adm_members` entry.                                               |

**Process flows:**

1. **Tenant provisioning:** When a lead is validated, a new tenant is created in `adm_tenants` and a new organisation is created in Clerk. The provider stores the `clerk_organization_id`. An invitation record in `adm_invitations` is generated to invite the first admin. The admin registers using the invitation link; the company name appears read‑only in the registration form because it is derived from the invitation’s `tenant_id`. Upon sign‑up, a `adm_members` entry is created and linked to the appropriate tenant. The admin receives default roles via `adm_member_roles`.
2. **RBAC management:** Provider staff can define roles per tenant (`adm_roles`) and assign them to members (`adm_member_roles`). Permissions are stored as JSONB arrays of allowed actions and modules. This allows different user profiles (e.g. accountant, dispatcher, mechanic) with tailored access.
3. **Audit and compliance:** All sensitive actions (creating vehicles, updating contracts, exporting payroll) must log an entry in `adm_audit_logs`. This ensures traceability and supports legal audits.
4. **Invitations:** The `adm_invitations` table underpins every external invitation. When a prospect receives a KYC link, a record with `role=kyc` and a signed token is created. When the first admin needs to be invited, a record with `role=admin` is created. When the client admin invites a new user, a record with `role=user` is created. The status is updated to `used` once the link is consumed or `expired` after the expiry date.

### 2.2 Reference data (`dir_` domain)

**Purpose:** Provide shared lists of car makes, models, platforms, country regulations and vehicle classes. These directories support data entry and enforce localisation rules.

**Tables & key relationships:**

| Table                     | Description                                                                                                                                                                                                   | Relationships                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `dir_car_makes`           | Stores car makes (Toyota, Ford, Mercedes). Optional `tenant_id` allows custom makes per tenant.                                                                                                               | Many `dir_car_models` reference a make.                         |
| `dir_car_models`          | Defines car models (Corolla, Ranger) and the class (sedan, SUV, van). References `dir_car_makes`.                                                                                                             | Linked to `flt_vehicles`.                                       |
| `dir_platforms`           | List of ride‑hailing platforms supported (Uber, Bolt, Careem). Each record stores API configuration JSONB.                                                                                                    | Used by `trp_platform_accounts` and `trp_trips`.                |
| `dir_country_regulations` | Stores regulatory data per country: maximum vehicle age, minimum vehicle class, whether a professional VTC card is required, minimum fares per trip/kilometre/hour and VAT rate【407970352218538†L268-L280】. | Used during validations (vehicle onboarding, fare calculation). |
| `dir_vehicle_classes`     | Defines vehicle class codes per country (luxury, executive, economy) with descriptions and optional age limits.                                                                                               | Referenced by `flt_vehicles` for category compliance.           |

**Processes and validations:**

1. **Vehicle onboarding validation:** When creating a vehicle in `flt_vehicles`, the system checks `dir_country_regulations` for the tenant’s country. If the vehicle’s year implies an age older than `vehicle_max_age` or its class does not meet `min_vehicle_class`, the system rejects the creation. This ensures regulatory compliance.
2. **Fare calculation:** Minimum fares (per trip, per kilometre, per hour) and VAT rates are stored per country. When generating B2B invoices or tenant invoices, the system applies the correct VAT (5 % in the UAE, 20 % in France)【407970352218538†L268-L280】.
3. **Platform integration:** Each row in `dir_platforms` stores API endpoints and credentials for a ride‑hailing platform. The integrator uses these configurations in scheduled jobs to import trips and revenues into `trp_trips` and `rev_revenue_imports`.

### 2.3 Documents (`doc_` domain)

**Purpose:** Manage all uploaded documents (vehicle registration, insurance, driver licences, visas, contracts, photos). Ensures traceability and expiry tracking.

**Table:**

| Table           | Description                                                                                                                                                                                                                                                                                                                         | Relationships                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `doc_documents` | Polymorphic document store. Fields: `entity_type` (vehicle, driver, member, contract, vehicle_event), `entity_id`, `document_type` (registration, insurance, visa, Emirates ID, licence, professional card, contract, photo, report), `file_url`, `issue_date`, `expiry_date`, `verified`, `metadata` (JSONB) and audit timestamps. | Linked to multiple domains via `entity_type` and `entity_id`: vehicles, drivers, contracts, events. Document expiry triggers tasks in `sch_tasks` and alerts users. |

**Processes:**

1. **Uploading documents:** The UI provides file upload components. On submit, the server stores the file in Supabase Storage (or S3) and creates a row in `doc_documents`. The `entity_type` and `entity_id` identify which object it belongs to. For example, a vehicle’s insurance certificate will have `entity_type='vehicle'`, `entity_id=<vehicle_id>` and `document_type='insurance'`.
2. **Verification and alerts:** Provider staff can mark documents as verified. The system automatically checks upcoming expiry dates (e.g. registration, insurance) and creates tasks in `sch_tasks` to remind administrators to renew them. In France, the VTC card (professional card) must be renewed every five years【407970352218538†L268-L280】.
3. **Photos and reports:** Handover photos, accident photos, and inspection reports are stored as documents with appropriate types (`photo`, `report`). Their metadata may include GPS coordinates, descriptions, and links to the related event.

### 2.4 Fleet (`flt_` domain)

**Purpose:** Manage vehicles throughout their lifecycle – acquisition, onboarding, assignments, maintenance, accidents, expenses and insurance. Provide all data needed to make informed decisions on replacements or retirements.

**Tables:**

| Table                     | Description                                                                                                                                                                                                                                                                                            | Relationships                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flt_vehicles`            | The core vehicle table. Fields: make, model, year, plate number, VIN, body type, owner type (fleet, leasing, investor), owner id, status (active, maintenance, retired, sold), current driver id, traccar device id, metadata (acquisition type, cost, insurance details, equipment) and audit fields. | Linked to `dir_car_makes`, `dir_car_models`, `adm_tenants`, `rid_drivers`. Has many events, assignments, maintenance, expenses, insurances.           |
| `flt_vehicle_assignments` | Records assignments of vehicles to drivers. Fields: vehicle id, driver id, start and end times, status (active, completed, cancelled), metadata (assignment type).                                                                                                                                     | Links vehicles to drivers. Only one active assignment per vehicle at a given time.                                                                    |
| `flt_vehicle_events`      | Generalised event table for vehicles: acquisition, disposal, maintenance, accident, handover, inspection, insurance. Fields: event type, event date, details (JSONB).                                                                                                                                  | Linked to vehicles. Each event may reference other tables (e.g. accidents create `doc_documents` for photos and `fin_transactions` for repair costs). |
| `flt_vehicle_maintenance` | Records scheduled and performed maintenance (oil changes, services). Fields: vehicle id, maintenance type, scheduled date, completion date, provider, cost, currency, notes.                                                                                                                           | Linked to vehicles. Maintenance events are also recorded in `flt_vehicle_events` for history.                                                         |
| `flt_vehicle_expenses`    | Tracks expenses incurred by a vehicle: fuel, tolls, parking, miscellaneous. Fields: vehicle id, expense date, category, amount, currency, description.                                                                                                                                                 | Linked to vehicles and drivers (optional) via `driver_id`. Invoices may be generated from these expenses.                                             |
| `flt_vehicle_insurances`  | Stores insurance policies: provider, policy number, coverage amount, currency, start and end dates, premium.                                                                                                                                                                                           | Linked to vehicles. Expiry triggers a task.                                                                                                           |

**Processes:**

1. **Acquisition and onboarding:** When a vehicle is purchased or leased, an event with `event_type='acquisition'` is recorded in `flt_vehicle_events` with details (cost, supplier). The vehicle is then created in `flt_vehicles`, referencing its make, model, year and owner type. The system stores registration, insurance and inspection documents in `doc_documents`. The status is set to `active`.
2. **Assignment and scheduling:** Assigning a vehicle to a driver creates an entry in `flt_vehicle_assignments`. Only one assignment can be active at a time, ensuring exclusive use. For scheduled shifts, you can predefine future assignments. Assignments reference both vehicle and driver and can be updated via the scheduling module. Handover events (returning the vehicle) are recorded in `flt_vehicle_events` with `event_type='handover'` and details such as odometer readings, fuel levels and photo IDs【166849981038207†L153-L178】.
3. **Maintenance and inspections:** Planned services are stored in `flt_vehicle_maintenance` and reflected in `flt_vehicle_events`. Each maintenance record tracks the provider, cost and next service. Inspections (e.g. annual inspection) are also events that generate tasks when due. These tasks are listed in `sch_tasks`.
4. **Accidents and repairs:** When an accident occurs, create an event with `event_type='accident'` and fill the `details` JSONB with severity, third‑party involvement, police report reference, insurance claim reference and downtime. Photos and reports are stored in `doc_documents`. Expenses for repairs are recorded in `fin_transactions` with an appropriate type (`expense`) and linked to the vehicle and trip if relevant.
5. **Expenses:** Fuel, toll and other expenses are captured in `flt_vehicle_expenses`. Tolls may also be imported automatically via `fin_toll_transactions`. Fuel expenses may be reimbursed or charged to drivers depending on the cooperation model.
6. **Insurance management:** Policies are stored in `flt_vehicle_insurances` with start and end dates. When an insurance is about to expire, create a task in `sch_tasks` to notify administrators to renew it.
7. **Disposal and replacement:** When a vehicle reaches the maximum age or becomes unprofitable, an event `event_type='disposal'` is recorded. The vehicle’s status changes to `retired` or `sold`, and the buyer or scrap details are saved. Financial proceeds are recorded in `fin_transactions`.

### 2.5 Drivers (`rid_` domain)

**Purpose:** Manage driver personal information, documents, financial models, performance metrics, requests, training and blacklisting. Comply with local regulations such as UAE visa requirements and French professional cards.

**Tables:**

| Table                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                | Relationships                                                                                                                                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rid_drivers`                  | Stores driver identity (name, phone, email), licence number, licence issue and expiry dates, professional card number and expiry (for France), status (active, suspended, terminated, blacklisted) and a `metadata` JSONB (Emirates ID, visa, labour card, bank account, emergency contact).                                                                                                                                                               | Each driver belongs to a tenant and can have multiple assignments (`flt_vehicle_assignments`) and cooperation terms (`rid_driver_cooperation_terms`). Linked to `doc_documents` for documents and `fin_driver_payments` for payroll. |
| `rid_driver_documents`         | Lists driver documents (licence, Emirates ID, passport, professional card, visa). Fields: driver id, document type, file url, issue date, expiry date and verified flag.                                                                                                                                                                                                                                                                                   | Complements the `metadata` JSONB. Expiry generates tasks.                                                                                                                                                                            |
| `rid_driver_cooperation_terms` | Defines the financial arrangement between the driver and the fleet. Fields: driver id, cooperation type (`fixed_rent`, `crew_rental`, `percentage`, `salary`, `rental_model`, `buy_out`, `investor_partner`【166849981038207†L355-L399】), start and end dates, and a `terms` JSONB storing model parameters (rent amount, percentage rate per platform, salary base, allowances, WPS eligibility, buy‑out price, number of instalments, investor shares). | Linked to drivers; used in payroll calculations. A driver can have multiple terms over time but only one active at any given time.                                                                                                   |
| `rid_driver_requests`          | Records driver requests (leave, vehicle change, financial aid, document update, maintenance issue, complaint). Fields: driver id, request type, priority, subject, description, assigned team or member, SLA deadline, status, escalation, resolution notes.                                                                                                                                                                                               | Linked to drivers and members. Workflow may involve `sch_tasks`.                                                                                                                                                                     |
| `rid_driver_performances`      | Stores aggregated performance metrics by period (trips count, total revenue, ratings, cancellation rate, punctuality). Fields: driver id, period start and end dates, metrics and notes.                                                                                                                                                                                                                                                                   | Derived from `trp_trips` and `rev_driver_revenues`. Used for bonuses and penalties.                                                                                                                                                  |
| `rid_driver_blacklists`        | Records drivers who are blacklisted due to repeated violations or serious misconduct. Fields: driver id, reason, blacklisted at, blacklisted by, resolved at.                                                                                                                                                                                                                                                                                              | Linked to drivers. Blacklisted drivers cannot accept new trips.                                                                                                                                                                      |
| `rid_driver_training`          | Tracks training courses attended by drivers. Fields: driver id, course name, provider, completion date, status, certificate file url.                                                                                                                                                                                                                                                                                                                      | Ensures mandatory training compliance (e.g. RTA training in the UAE).                                                                                                                                                                |

**Processes:**

1. **Recruitment and onboarding:** Candidate drivers are stored in `hr_candidates` (see HR domain). Once approved, a driver record is created in `rid_drivers`, and the system generates a unique driver ID. During onboarding, the driver’s documents (licence, Emirates ID, VTC card) are uploaded to `rid_driver_documents`. The cooperation terms are defined in `rid_driver_cooperation_terms`; for example, a UAE driver may have a salary model with WPS eligibility, whereas a French driver may have a percentage model. The driver receives credentials via Clerk and can log into the application.
2. **Contract management:** Drivers may switch cooperation types over time (e.g. from percentage to buy‑out). Each new contract is a new record in `rid_driver_cooperation_terms` with new start and end dates. Payroll calculations reference the active contract when processing trips and revenue.
3. **Performance tracking:** Data from `trp_trips` (trip count, rating, cancellation, lateness) and `rev_driver_revenues` (total revenue) feeds into `rid_driver_performances`. Reports can calculate cost per kilometre, profit per driver and identify underperforming drivers.
4. **Requests and complaints:** Drivers can submit requests via a portal. Each request is stored in `rid_driver_requests`, with an assigned handler (e.g. HR, mechanic, finance). The system tracks SLA deadlines and escalations. When resolved, the resolution notes are stored, and tasks can be auto‑generated (e.g. schedule maintenance).
5. **Blacklisting:** If a driver accumulates serious violations (e.g. multiple accidents, fraudulent behaviour), an entry is created in `rid_driver_blacklists`. The driver’s status in `rid_drivers` is set to `blacklisted`, preventing new assignments. The blacklisting may expire or be revoked after review.

### 2.6 Scheduling (`sch_` domain)

**Purpose:** Provide planning tools for shifts, maintenance, goals and tasks. This ensures that vehicles and drivers are scheduled properly, conflicts are avoided, and tasks are tracked.【166849981038207†L153-L178】 describes an interactive planning tool with visual calendars.

**Tables:**

| Table                       | Description                                                                                                                                                                                                                                                                          | Relationships                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `sch_shifts`                | Defines shifts (driver × vehicle × time). Fields: driver id, vehicle id, start time, end time, status (scheduled, in_progress, completed, cancelled), notes.                                                                                                                         | Linked to vehicles and drivers. Overlaps are prevented.                                                                          |
| `sch_maintenance_schedules` | Specifies planned maintenance tasks: vehicle id, maintenance type, scheduled start and end, status (planned, in_progress, completed, cancelled), provider, notes.                                                                                                                    | Linked to `flt_vehicles`. When a maintenance schedule is due, the vehicle status becomes `maintenance`.                          |
| `sch_goals`                 | Stores fleet or driver goals (e.g. number of trips per day, revenue targets). Fields: scope (fleet, vehicle, driver), reference id, metric (trips, revenue, rating), target value, period (daily, weekly, monthly), start and end date, metadata (e.g. threshold, bonus conditions). | Linked to vehicles or drivers.                                                                                                   |
| `sch_tasks`                 | Task queue: reminders and alerts. Fields: task type (maintenance_alert, document_expiry, payment_overdue, custom), subject, description, assigned member, status (new, in_progress, resolved, closed), priority, created at, due at, resolved at.                                    | Linked to various entities. Tasks can be created automatically (e.g. document expiry), by support staff or from driver requests. |

**Processes:**

1. **Shift planning:** Dispatchers create shifts in `sch_shifts` specifying the driver, vehicle and period. The system checks for conflicts: a vehicle cannot be scheduled for two drivers at the same time; a driver cannot be assigned to two vehicles simultaneously. The planning tool highlighted in the baseline shows a visual calendar for scheduling shifts and detects conflicts【166849981038207†L153-L178】.
2. **Maintenance scheduling:** Mechanics or managers plan services via `sch_maintenance_schedules`. When the scheduled date arrives, a task is created in `sch_tasks` and the vehicle status is updated to `maintenance`. Upon completion, a record in `flt_vehicle_maintenance` is created, and the next maintenance is scheduled.
3. **Goal tracking:** Managers define goals via `sch_goals`. For example, a driver must complete at least 200 trips per month. The system monitors progress by aggregating data from `trp_trips` and `rid_driver_performances`. If a goal is not met, it can trigger a penalty or coaching session. Achieving a goal may trigger a bonus.
4. **Task management:** `sch_tasks` centralises all tasks: document renewals (from `doc_documents` expiry), maintenance reminders, payroll approvals, outstanding settlements and custom tasks (e.g. check fuel cards). Tasks have priorities and due dates. When completed, the status is set to `resolved`. Overdue tasks are escalated.

### 2.7 Trips (`trp_` domain)

**Purpose:** Store trips from ride‑hailing platforms and B2B office bookings, manage platform accounts and reconcile platform payouts.

**Tables:**

| Table                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                          | Relationships                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `trp_platform_accounts` | Links internal drivers and vehicles to external platform accounts. Fields: driver id, vehicle id, platform id, platform user id (e.g. Uber UUID), status (active, inactive, pending, blocked), cash_enabled and metadata.                                                                                                                                                                                                            | Linked to `rid_drivers`, `flt_vehicles` and `dir_platforms`. Used to match imported trips to internal entities.                                              |
| `trp_trips`             | Stores trips from platforms and office bookings. Fields: trip type (`platform` or `office`), platform id, driver id, vehicle id, trip date, start time, end time, pickup/dropoff coordinates, distance, duration, `fare_breakdown` JSONB (base, distance, time, surge, tip, commission, net), payment method, status, `paid_in_batch_id` (links to payroll batches for WPS), metadata (office booking details) and external trip id. | Linked to `rid_drivers`, `flt_vehicles`, `dir_platforms` and `fin_transactions` via revenue entries. Used to calculate driver revenue and fleet performance. |
| `trp_settlements`       | Holds settlements received from platforms. Fields: platform id, period start/end, expected amount (sum of trip net earnings), received amount (actual bank transfer), discrepancy and status.                                                                                                                                                                                                                                        | Linked to `dir_platforms`. A discrepancy triggers an investigation via tasks.                                                                                |
| `trp_client_invoices`   | B2B invoices for corporate clients (office bookings). Fields: tenant id, client id, invoice date, due date, amounts (subtotal, VAT, total), status (draft, issued, paid, overdue, cancelled), `line_items` JSONB (list of services rendered), paid date, payment reference and metadata.                                                                                                                                             | Linked to corporate clients (CRM extension).                                                                                                                 |

**Processes:**

1. **Platform account creation:** Each driver and vehicle must be linked to their platform accounts via `trp_platform_accounts`. This record stores the external user id and any status flags. When importing trips, the platform’s driver id or vehicle id is matched to internal IDs via this table.
2. **Trip import:** Scheduled jobs call the platforms’ APIs to import completed trips. Each trip is stored in `trp_trips` with all its details. The `fare_breakdown` is saved as JSONB (base fare, distance fee, time fee, surge, tip, commission, net). The `external_trip_id` ensures idempotence (no duplicates). For office bookings, the metadata field stores booking information (service type, passengers, special requirements, booking status). Trips are the basis for revenue calculations and driver performance metrics.
3. **Revenue reconciliation:** The sum of net earnings from `trp_trips` per platform and period forms the expected amount. When a settlement is received (bank transfer), a row is created in `trp_settlements` with the received amount. If `received_amount` differs from `expected_amount`, the discrepancy triggers an investigation task. The settlement may reference transactions in `fin_transactions` (account receipts).
4. **Trip lifecycle:** A trip’s `status` can be `completed`, `cancelled` or `no_show`. Cancelled or no‑show trips may still carry a minimum fee depending on the platform’s policy. Trips can also include `office` service types, where the trip is not linked to a platform and is billed via `trp_client_invoices`.

### 2.8 Finance (`fin_` domain)

**Purpose:** Manage all monetary transactions, accounts, payroll, bonuses/penalties and tolls/fines.

**Tables and relationships:**

| Table                        | Description                                                                                                                                                                                                                                                                                                              | Relationships                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `fin_accounts`               | Records financial accounts (bank accounts, cash desks, fuel cards, toll cards). Each has a name, type, currency, initial balance and metadata.                                                                                                                                                                           | Linked to `fin_transactions` and used in payroll batches.                         |
| `fin_transactions`           | Central ledger for all money movements: revenue, expenses, payments, deductions, payouts, transfers. Fields: account id, transaction type, entity_type/entity_id (polymorphic reference to trips, drivers, vehicles, invoices, batches), amount, currency, reference, description, counterparty, metadata and date/time. | Linked to accounts and other entities. Sources of truth for financial statements. |
| `fin_driver_payment_batches` | Represents payroll batches (usually monthly). Fields: period start/end, account id (bank), total amount, currency, file_url (SIF file for WPS), status and metadata.                                                                                                                                                     | Linked to `fin_accounts` and `fin_driver_payments`.                               |
| `fin_driver_payments`        | Individual salary entries per driver. Fields: driver id, batch id, gross salary, allowances, deductions, net pay, currency, account number, bank code, breakdown (JSONB with earnings/allowances/deductions details), status and remarks.                                                                                | Linked to `rid_drivers`, `fin_driver_payment_batches` and `fin_transactions`.     |
| `fin_bonus_penalty_rules`    | Defines bonus or penalty rules: rule type (`bonus` or `penalty`), name, trigger conditions (JSONB), amount type (`fixed` or `percentage`), amount, currency, active flag. Used by the payroll engine to generate adjustments.                                                                                            | Linked to tenants.                                                                |
| `fin_toll_transactions`      | Records toll transactions (Salik or French tolls). Fields: vehicle id, driver id, trip id, toll gate id, date/time, amount, currency, payment status.                                                                                                                                                                    | Linked to vehicles, drivers, trips and `fin_transactions`.                        |
| `fin_traffic_fines`          | Records traffic fines: vehicle id, driver id, violation type (speeding, parking), description, fine amount, currency, issue date, due date, paid date, status, points, authority, location and metadata.                                                                                                                 | Linked to vehicles and drivers.                                                   |

**Processes:**

1. **Account management:** Tenants set up accounts for bank, cash, fuel and toll cards. Each transaction is recorded in `fin_transactions` with a type (revenue, expense, payment, deduction). The ledger must always balance – for every revenue entry there is a payment entry to the driver or investor.
2. **Revenue capture:** When a trip is completed, a revenue entry is recorded in `fin_transactions` with `transaction_type='revenue'`, referencing the trip. If the cooperation model involves a percentage, the share for the driver is calculated and recorded in `fin_transactions` with `transaction_type='payment'` (linked to the driver). The net revenue to the fleet is the difference between trip net and driver share.
3. **Payroll and WPS:** Each month, run a job to aggregate driver earnings (trips, bonuses and allowances) and deductions (rent, fuel, tolls, fines). For each driver, a row in `fin_driver_payments` is created with the breakdown JSONB. Payments are grouped in `fin_driver_payment_batches`. In the UAE, the batch generates a Salary Information File (SIF) to submit to WPS; the batch status tracks progress (draft, exported, sent_to_bank, processed). The payroll engine ensures compliance with WPS rules (70 % of employees paid via WPS, within deadlines).
4. **Bonuses and penalties:** The `fin_bonus_penalty_rules` table stores rules such as “bonus of 500 AED for more than 200 trips in a month” or “penalty of 100 € for late vehicle handover”. A job runs daily/weekly to evaluate these rules against performance metrics in `rid_driver_performances`. If a rule is triggered, a transaction is created in `fin_transactions` and added to the payroll breakdown.
5. **Tolls and fines:** Toll transactions are imported automatically (e.g. Salik) into `fin_toll_transactions`. Fines are logged in `fin_traffic_fines` with the issuing authority and due date. Depending on the cooperation model, the driver or the fleet pays these amounts. The payroll engine deducts unpaid tolls/fines from the next salary. Paid fines are recorded in `fin_transactions`. Repeat offenders may be blacklisted (`rid_driver_blacklists`).
6. **Investor payouts (optional):** If using the “rolling stock” model, investor shares are calculated per vehicle. The system aggregates revenue and expenses for the vehicle, then splits profits according to the ownership percentage in `inv_vehicle_investors`. Payouts are recorded in `fin_transactions` and summarised in investor statements.

### 2.9 Revenue (`rev_` domain)

**Purpose:** Consolidate revenue data imported from platforms and compute driver revenue per trip. Support reconciliation and auditing.

**Tables:**

| Table                 | Description                                                                                                                                                                                                                                            | Relationships                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `rev_revenue_imports` | Stores raw CSV or API data imported from platforms. Fields: platform id, import date, row count, metadata (file name, import status) and a JSONB for file content.                                                                                     | Pre‑processes data to populate `trp_trips`.                 |
| `rev_driver_revenues` | Aggregated driver revenue per trip or period. Fields: driver id, trip id, period start/end, revenue amount, tips, fees, commission, net revenue, currency, metadata.                                                                                   | Derived from `trp_trips`. Used for payroll and performance. |
| `rev_reconciliations` | Stores reconciliation results between expected revenue (from `trp_trips`) and revenue declared by the platform. Fields: period start/end, platform id, expected revenue, declared revenue, discrepancy, status (matched, pending, discrepancy), notes. | Linked to `trp_settlements`.                                |

**Processes:**

1. **Import processing:** Import files (CSV or API responses) are stored in `rev_revenue_imports`. A job parses the file and matches each row to a trip via `trp_platform_accounts`. If the trip does not exist, it is created in `trp_trips` with the extracted fare breakdown and metadata. The job then updates `rev_driver_revenues`, splitting the revenue between driver and fleet according to the driver’s cooperation terms.
2. **Revenue aggregation:** For each driver and period, summarise the revenue, tips and fees into `rev_driver_revenues`. This data feeds into payroll and performance metrics. The payroll engine uses these aggregates rather than scanning individual trips.
3. **Reconciliation:** At the end of each period, sum the net revenue per platform from `trp_trips` and compare it to the revenue reported by the platform. Record the expected revenue, declared revenue and discrepancy in `rev_reconciliations`. If a mismatch exists, open a support ticket or create a task to investigate.

### 2.10 SaaS billing (`bil_` domain)

**Purpose:** Manage subscription plans, track tenant usage and generate invoices for the SaaS service. Ensure correct billing according to the number of vehicles, drivers, trips and modules used.

**Tables:**

| Table                      | Description                                                                                                                                                           | Relationships                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `bil_billing_plans`        | Defines SaaS subscription plans: plan name, description, monthly fee, currency, driver/vehicle/trip limits, overage fee per unit and metadata.                        | Selected by tenants in `bil_tenant_subscriptions`. |
| `bil_tenant_subscriptions` | Records tenant subscriptions: tenant id, plan id, start and end dates, status (trial, active, cancelled, suspended, expired), auto‑renew flag.                        | Linked to `adm_tenants` and `bil_billing_plans`.   |
| `bil_tenant_usage_metrics` | Tracks usage by period: number of drivers, vehicles, trips, storage used, API calls, health score and churn risk. Includes a JSONB `metadata` for additional metrics. | Generated monthly from operational data.           |
| `bil_tenant_invoices`      | SaaS invoices issued monthly: tenant id, invoice date, due date, period start/end, amounts (subtotal, VAT, total), currency, status and metadata.                     | Linked to `adm_tenants`.                           |
| `bil_tenant_invoice_lines` | Invoice line items for `bil_tenant_invoices`: description, quantity, unit price, VAT rate, line total.                                                                | Linked to `bil_tenant_invoices`.                   |
| `bil_payment_methods`      | Stores payment methods for tenants (e.g. Stripe customer id, Paddle subscription id).                                                                                 | Linked to `adm_tenants`.                           |

**Processes:**

1. **Subscription management:** Tenants choose a plan from `bil_billing_plans`. A row is created in `bil_tenant_subscriptions` with start date, initial status and auto‑renew settings. During onboarding, the provider sets the plan according to the sales contract.
2. **Usage metering:** At the end of each billing period, compute usage metrics per tenant: count of active drivers, vehicles, completed trips, storage space, API calls and ticket volumes. Store them in `bil_tenant_usage_metrics` and compute the health score and churn risk. These metrics drive overage charges and help account managers monitor tenant health.
3. **Invoice generation:** For each active tenant subscription, generate an invoice in `bil_tenant_invoices`. The `line_items` table stores base plan charges and overages (e.g. extra drivers or vehicles). VAT is calculated based on the tenant’s country (`dir_country_regulations.vat_rate`)【407970352218538†L268-L280】. Invoices are issued and emailed via Resend; if not paid by the due date, they are marked as overdue and reminders are sent. Payment status is updated when Stripe/Paddle confirms the charge.
4. **Payment method management:** Tenants can provide card or direct debit details stored in `bil_payment_methods` via Stripe or Paddle tokens. On invoice generation, the system attempts to collect the payment automatically. Failed payments create tasks to follow up.

### 2.11 CRM (`crm_` domain)

**Purpose:** Manage leads, sales opportunities and contracts. Ensure a smooth transition from prospect to paying tenant.

**Tables:**

| Table               | Description                                                                                                                                                                                                                       | Relationships                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `crm_leads`         | Stores prospective customers (data from the demo request form): contact name, email, phone, company name, country code, status (new, qualified, converted, lost), notes and metadata.                                             | Linked to `doc_documents` for uploaded KYC documents. When converted, a tenant is created in `adm_tenants`. |
| `crm_opportunities` | Qualified leads become opportunities. Fields: lead id, value, currency, sales stage (prospecting, proposal, negotiation, won, lost), expected close date, probability, responsible employee and notes.                            | Linked to leads, provider employees and `adm_tenants`.                                                      |
| `crm_contracts`     | Signed contracts between the SaaS provider and tenants (or B2B clients). Fields: tenant id, client id, contract type (saas_subscription, b2b_service, partnership), start and end dates, total value, currency, status and terms. | Linked to `adm_tenants` or B2B clients; may reference `crm_opportunities`.                                  |

**Processes:**

1. **Demo request:** Visitors submit a form at `/request-demo` with contact details. Data is stored in `crm_leads` (previously `sys_demo_lead`). RLS ensures only super‑admins can read leads. Use `metadata` to store fleet size, pain points and preferred country.
2. **Qualification and KYC:** Sales staff review the lead, call the prospect and gather documents. Document uploads are stored in `doc_documents` with `entity_type='lead'`. Once complete, the lead is marked as `qualified`. The provider sends a KYC invitation via `adm_invitations` with a signed token. The prospect completes the company form; data is stored back in `crm_leads`. After verification, the lead is converted to a tenant in `adm_tenants` and associated with a new `crm_contracts` record.
3. **Sales pipeline:** `crm_opportunities` track the deal value, probability and stage. Sales staff update the stage from `prospecting` to `won` or `lost`. When won, a subscription is created in `bil_tenant_subscriptions`. Sales metrics (conversion rate, pipeline value) are tracked.
4. **Contract management:** `crm_contracts` store the signed agreement. Contract terms (e.g. plan, price, duration, service level) are stored in `terms` or as an external PDF. The end date triggers a renewal task or a proposal for upsell.

### 2.12 Support (`sup_` domain)

**Purpose:** Handle customer support tickets, conversation threads and feedback.

**Tables:**

| Table                   | Description                                                                                                                                                                                                                                                                | Relationships                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `sup_tickets`           | Tickets created by tenants (e.g. technical issue, billing query). Fields: tenant id, opened by (member id), subject, category, priority, status (open, in_progress, resolved, closed), assigned to (provider employee), created and updated dates, closed at and metadata. | Linked to `adm_tenants`, `adm_members` and `adm_provider_employees`. |
| `sup_ticket_messages`   | Conversation threads for tickets. Fields: ticket id, sender id, message content, attachments (metadata), sent at.                                                                                                                                                          | Linked to tickets and members.                                       |
| `sup_customer_feedback` | Records ratings and comments at ticket closure. Fields: ticket id, rating (1–5), comments and submitted at.                                                                                                                                                                | Linked to tickets.                                                   |

**Processes:**

1. **Ticket creation:** Tenants can submit tickets through the UI; each ticket is stored in `sup_tickets` with initial status `open`. Support staff can assign tickets to themselves or others. Integrate with Chatwoot or FreeScout for richer conversation features; store the external ticket ID in the `metadata` field. Attachments are stored via `doc_documents`.
2. **Conversation:** `sup_ticket_messages` store the back‑and‑forth messages. Each message has a sender (tenant member or provider employee) and timestamp. The UI displays messages in chronological order. If using Chatwoot/FreeScout, sync messages via webhooks.
3. **Resolution and feedback:** When resolved, the ticket status is set to `resolved`. The system requests feedback and stores it in `sup_customer_feedback`. Feedback scores feed into support analytics.
4. **Escalation:** Tickets can be escalated if not resolved within the SLA. This triggers a higher priority, possible reassignment or management involvement. Escalations are logged in `adm_audit_logs`.

### 2.13 Human resources (`hr_` domain)

**Purpose:** Manage recruitment of drivers and their onboarding stages. Supports the HR workflow from application to hiring.

**Tables:**

| Table                  | Description                                                                                                                                                                                                                   | Relationships                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `hr_candidates`        | Stores candidate drivers’ applications: name, phone, email, application date, status (applied, documents_submitted, interview_scheduled, interview_completed, background_check, approved, rejected, hired), source and notes. | Linked to `doc_documents` for uploaded CVs and documents. |
| `hr_onboarding_stages` | Records onboarding progress for hired drivers: candidate id, stage (matches the status values), start and end timestamps, assigned HR member.                                                                                 | Linked to `hr_candidates`.                                |

**Processes:**

1. **Application submission:** Prospective drivers apply via a form; data is stored in `hr_candidates`. Upload CVs and identification documents. Status starts at `applied`.
2. **Document verification:** Candidates submit documents (licence, Emirates ID, visa). HR staff verify the documents; once complete, the status becomes `documents_submitted`.
3. **Interview & background check:** HR schedules interviews and background checks. Each stage is recorded in `hr_onboarding_stages`. The status moves through `interview_scheduled`, `interview_completed` and `background_check`.
4. **Hiring:** Approved candidates have a status of `approved`. Once hired, a driver record is created in `rid_drivers` and an onboarding stage `hired` is recorded. The candidate is deleted or archived.

### 2.14 Investors (`inv_` domain)

**Purpose:** Manage investors and link them to vehicles for revenue sharing.

**Tables:**

| Table                   | Description                                                                                                                                                     | Relationships                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `inv_investors`         | Stores investor entities (name, contact information, country, investment terms). May include banking details for payouts and a `metadata` JSONB for extra info. | Linked to `inv_vehicle_investors`.                                     |
| `inv_vehicle_investors` | Junction table linking vehicles to investors with an `ownership_pct` field.                                                                                     | Linked to `flt_vehicles` and `inv_investors`. Used for revenue splits. |

**Processes:**

1. **Investor onboarding:** Register an investor in `inv_investors` with contact details, KYC documents and terms. Each investor may invest in multiple vehicles.
2. **Vehicle investment allocation:** Link investors to vehicles via `inv_vehicle_investors` and specify the ownership percentage (e.g. 40 %). A vehicle may have several investors.
3. **Revenue sharing:** At the end of each period, calculate the net profit for each vehicle (revenue minus expenses). Multiply by each investor’s percentage to determine the payout. Record payouts in `fin_transactions` with `transaction_type='payout'`.
4. **Reporting:** Provide statements to investors summarising income, expenses and net profit per vehicle. Display in the investor portal.

### 2.15 System (`sys_` domain)

**Purpose:** Provide system‑level tables for demo requests and lead activities used during the initial product phase.

**Tables:**

| Table                    | Description                                                                        | Relationships                                |
| ------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------- |
| `sys_demo_lead`          | Stores demo requests (similar to `crm_leads`). May be kept for historical reasons. | Replaced by `crm_leads` but can be retained. |
| `sys_demo_lead_activity` | Records interactions with demo leads (calls, emails).                              | May be merged into `crm_leads` or removed.   |

**Processes:** This domain is legacy and is recommended to be phased out. Lead handling should use the CRM domain instead.

## 3. Cross‑domain process flows

The system workflows are multi‑domain, combining several tables. Below is a summary of the key flows.

### 3.1 Lead capture to client onboarding

1. **Demo request:** A prospect fills out the `/request-demo` form. Data is stored in `crm_leads` with status `new`. An entry in `sys_demo_lead` may still be created for legacy compatibility but is optional.
2. **Qualification:** Sales staff evaluate the lead, contact the prospect, add notes and request KYC documents. Documents are stored in `doc_documents`. Once the lead is deemed qualified, its status changes to `qualified` and a record is added to `crm_opportunities` with estimated value and stage.
3. **KYC:** The sales staff send a secure invitation (role `kyc`) using `adm_invitations`. The prospect receives a link to a form to supply company details and attachments. Information is stored in `crm_leads` and `doc_documents`. A task may be created in `sch_tasks` if documents are missing.
4. **Tenant creation:** After verifying the information, the provider creates a row in `adm_tenants`, sets the `country_code`, `vat_rate` and other metadata (e.g. local regulations). A new organisation is created in Clerk and its ID is stored in `clerk_organization_id`. The lead status changes to `converted`. A contract is created in `crm_contracts` (type `saas_subscription`) specifying the plan and start date.
5. **Admin invitation:** Using `adm_invitations`, the provider creates a link with `role='admin'` for the customer’s first administrator. The admin registers via Clerk; the company name is pre‑filled and non editable. Upon registration, a row is inserted in `adm_members` and linked to the tenant. The admin receives default roles via `adm_member_roles`.
6. **Subscription activation:** A row in `bil_tenant_subscriptions` is created referencing the chosen plan. Usage metering starts via `bil_tenant_usage_metrics`. The billing cycle begins and invoices will be generated automatically.

### 3.2 Vehicle lifecycle

1. **Acquisition:** Record an event `acquisition` in `flt_vehicle_events` with cost and supplier. Create a row in `flt_vehicles`. Upload registration and insurance documents via `doc_documents`. Set the vehicle’s status to `active`.
2. **Assignment:** Create an entry in `flt_vehicle_assignments` linking the vehicle to a driver. Optionally schedule shifts in `sch_shifts` and record a handover event in `flt_vehicle_events` with odometer readings, fuel level and photos. The driver starts using the vehicle.
3. **Operation:** The vehicle is used for trips. Each trip is recorded in `trp_trips`; revenue entries are logged in `fin_transactions` and aggregated into `rev_driver_revenues`. Tolls and fines are imported into `fin_toll_transactions` and `fin_traffic_fines`.
4. **Maintenance:** At the scheduled time, tasks are generated in `sch_tasks`. When maintenance is completed, record the service in `flt_vehicle_maintenance` and update the vehicle event (type `maintenance`).
5. **Accidents:** If an accident occurs, record an `accident` event. Collect photos and police reports in `doc_documents`. Record repair costs in `fin_transactions`. If the accident is severe, update the driver’s performance and consider blacklisting.
6. **Retirement or sale:** Once the vehicle reaches its age or cost threshold, record a `disposal` event. Change the status to `retired` or `sold` and enter the buyer and sale amount. Reflect this in `fin_transactions`.

### 3.3 Driver lifecycle

1. **Recruitment:** Candidates apply via `hr_candidates`. HR staff review applications, schedule interviews and check documents. Successful candidates move through `hr_onboarding_stages` and are eventually created in `rid_drivers` with their documents stored in `rid_driver_documents`.
2. **Onboarding:** Create a `rid_driver_cooperation_terms` row specifying the model (percentage, salary, etc.) and its parameters. Upload necessary documents (licence, visa, Emirates ID or VTC card). Provide training courses via `rid_driver_training`. The driver receives login credentials via Clerk.
3. **Operation:** The driver performs trips recorded in `trp_trips`. Revenue is calculated and stored in `rev_driver_revenues`. Metrics feed into `rid_driver_performances`. The driver can submit requests via `rid_driver_requests` and the system tracks them.
4. **Performance review:** Periodic reviews consider metrics like trip counts, revenue, ratings, cancellation rate and punctuality. Bonus and penalty rules may apply. Training requirements are tracked in `rid_driver_training`.
5. **Termination or blacklisting:** If a driver resigns or is dismissed, set status to `terminated`. If blacklisted, create a record in `rid_driver_blacklists`. Deactivate the driver’s account in Clerk and remove platform accounts.

### 3.4 Payroll and investor payouts

1. **Payroll preparation:** At the end of each payroll period, gather data: `rev_driver_revenues` for revenue, `fin_toll_transactions` and `fin_traffic_fines` for deductions, `flt_vehicle_expenses` for fuel costs, fixed rents from `rid_driver_cooperation_terms`, and bonuses/penalties from `fin_bonus_penalty_rules`. Summarise these in a JSONB structure.
2. **Salary calculation:** For each driver, compute gross earnings, allowances, deductions and net pay. Insert a row into `fin_driver_payments`. Group payments into `fin_driver_payment_batches`. Generate a SIF file for WPS (UAE) or prepare bank transfer orders (France). Update the payment status as processed once funds are transferred.
3. **Investor revenue sharing:** If investor management is activated, compute net profit per vehicle and distribute it according to `inv_vehicle_investors.ownership_pct`. Record payouts in `fin_transactions` with `transaction_type='payout'`. Provide statements via the investor portal.

### 3.5 SaaS billing and usage

1. **Plan selection:** Tenants select or are assigned a plan from `bil_billing_plans`. Subscriptions are recorded in `bil_tenant_subscriptions` with start/end dates and auto‑renew settings.
2. **Metering:** At the end of each billing period, run a job to populate `bil_tenant_usage_metrics` with counts of active drivers, vehicles, trips, storage and API calls. Compute a health score and churn risk. Compare usage with plan limits to calculate any overage charges.
3. **Invoice issuance:** For each active subscription, create a row in `bil_tenant_invoices` with the period and amounts. Generate line items in `bil_tenant_invoice_lines` for base plan and overages. Apply the correct VAT rate according to `dir_country_regulations`. Send the invoice via Resend and attempt payment via Stripe/Paddle using tokens stored in `bil_payment_methods`. Update the invoice status (paid, overdue, cancelled) accordingly.
4. **Plan changes and renewals:** When a tenant upgrades or downgrades, a new `adm_tenant_lifecycle_events` record is created. The subscription in `bil_tenant_subscriptions` is updated with the new plan and prorations are applied. At end of contract, a renewal process triggers a sales opportunity in `crm_opportunities`.

### 3.6 Support workflow

1. **Ticket submission:** Clients raise tickets via the portal. Tickets are stored in `sup_tickets` with a category (billing, technical, platform, other) and priority. The system assigns tickets to provider employees based on availability and skill.
2. **Conversation and updates:** All messages are stored in `sup_ticket_messages`. Tickets may be linked to tasks or incidents in other domains (e.g. a billing issue may reference `bil_tenant_invoices`).
3. **Resolution:** When resolved, the ticket is closed and a feedback request is sent. Responses are stored in `sup_customer_feedback` and feed into support performance metrics.
4. **Escalation:** If a ticket is overdue or critical, it is escalated to management. Escalations trigger alerts in `sch_tasks` and entries in `adm_audit_logs`.

### 3.7 HR and recruitment workflow

1. **Candidate intake:** Applicants fill out a form and are stored in `hr_candidates`. They may come from referral links or job portals.
2. **Screening:** HR reviews candidates, schedules interviews and verifies documents. Each stage is recorded in `hr_onboarding_stages`. Rejected candidates are archived or recorded with status `rejected` and reason.
3. **Offer and hire:** Approved candidates are offered a contract. Once accepted, a row is created in `rid_drivers`. The candidate record is marked `hired`. Onboarding begins and training is scheduled. HR ensures compliance with local visa and labour laws.

## 4. Data relationships and dependencies

The following points summarise the most important relationships between tables:

- `adm_tenants` is the root. Most tables have a foreign key to `tenant_id` to ensure data isolation. Examples: `rid_drivers.tenant_id`, `flt_vehicles.tenant_id`, `crm_leads.tenant_id`, etc.
- `adm_members` → `adm_roles` via `adm_member_roles`: a member can have multiple roles; roles can be tenant‑specific.
- `doc_documents` is polymorphic: uses `entity_type` and `entity_id` to link to vehicles, drivers, members, contracts or events. There is no explicit foreign key constraint; referential integrity must be handled by the application.
- `flt_vehicle_assignments` links vehicles and drivers. Each assignment references one vehicle and one driver. Only one active assignment per vehicle and driver at any time (application-level constraint).
- `rid_driver_cooperation_terms` links to drivers; only one active term per driver is valid for payroll.
- `trp_platform_accounts` links drivers and vehicles to platforms. When importing trips, the platform’s driver id is matched via this table to internal `driver_id`. The vehicle id is used to identify which vehicle performed the trip.
- `trp_trips` references drivers, vehicles and platforms. The `paid_in_batch_id` links to `fin_driver_payment_batches` to avoid double payment.
- `fin_transactions` uses polymorphic references (`entity_type`, `entity_id`) to link to many entities: a revenue transaction might link to a trip; a deduction might link to a fine; a payout might link to an investor.
- `fin_driver_payments` references drivers and batches. The breakdown JSONB must align with the cooperation terms.
- `rev_driver_revenues` references both drivers and trips to summarise revenue. `rev_reconciliations` references platforms and settlements.
- `bil_tenant_subscriptions`, `bil_tenant_usage_metrics`, `bil_tenant_invoices` and `bil_payment_methods` all reference `adm_tenants` to manage billing.
- `crm_leads` can optionally reference `adm_tenants` once converted. `crm_opportunities` references leads and `adm_tenants`. `crm_contracts` references tenants or corporate clients.
- `sup_tickets` references tenants and members (both clients and provider employees). `sup_ticket_messages` references tickets and members.
- `hr_candidates` and `hr_onboarding_stages` reference each other. `inv_vehicle_investors` references both `inv_investors` and `flt_vehicles`.

## 5. Conclusion

This functional specification aims to provide a comprehensive understanding of the Fleetcore system and the relationships between its components. It elaborates on each domain’s tables and their roles in the business processes, ensuring that every capability identified in the baseline (vehicle and driver management, multi‑platform status tracking, maintenance and scheduling, financial management, CRM and lead handling, investor management and SaaS billing) is covered. Combined with the _restart plan_, this document forms a complete startup kit that guides the implementation, migration and configuration of Fleetcore in its final form.
