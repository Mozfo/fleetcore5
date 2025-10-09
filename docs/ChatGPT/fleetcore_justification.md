# Fleetcore Data Model – Table Justification and Integration with External Services

This document explains why each table in the **Fleetcore** data model is present and how it fits within a SaaS ecosystem that relies on external services such as **Clerk** (auth), **Stripe Billing** (subscription billing and payments), **Chatwoot/FreeScout** (support desk), **Resend** (transactional email), **Traccar** (GPS tracking), **Vercel + Supabase** (hosting and data), and **Sentry** (monitoring).  
The model comprises **55 tables**, grouped by functional domain. Each table serves a specific role in supporting the core platform, even when external services handle parts of the process.

> **Note:** Fleetcore uses **Clerk** for user authentication and session management, **Stripe** for payment processing, **Chatwoot/FreeScout** for customer support, **Resend** for outgoing emails, **Traccar** for GPS data, **Vercel + Supabase** for infrastructure and database, and **Sentry** for error monitoring. The Fleetcore database stores references and internal state, while the external services handle the heavy lifting.

---

## 1 Administration (`adm_`)

These tables define tenants (customers), user accounts, roles and permissions, audit logs, provider employees, and tenant lifecycle events. They integrate with Clerk for authentication and with Stripe for subscription tracking.

| Table                           | Purpose / Integration                                                                                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **adm_tenants**                 | Stores tenant/company information (name, country, currency, tax settings). Used throughout the system for multi‑tenant isolation. Links to Stripe via **`bil_tenant_subscriptions`** for billing.                                |
| **adm_members**                 | Users belonging to tenants; includes Clerk identifiers (e.g. `clerk_user_id`) so that Clerk manages auth and sessions. Roles map to **`adm_roles`** and permission sets.                                                         |
| **adm_roles**                   | Defines roles (e.g. admin, manager, driver manager). Contains a JSONB `permissions` field to hold fine‑grained rights. Assigned to members via **`adm_member_roles`**.                                                           |
| **adm_member_roles**            | Many‑to‑many mapping between members and roles. Enforces unique assignments per tenant and member.                                                                                                                               |
| **adm_audit_logs**              | Immutable log of actions by members; stores entity, action, changes, IP and user agent. Used for compliance and debugging (monitored by Sentry). No soft‑delete: logs are permanent.                                             |
| **adm_provider_employees**      | Personnel employed by Fleetcore itself (e.g. support agents). Self‑referencing FKs track who created/updated/deleted employees. These staff may be responsible for responding via Chatwoot/FreeScout and can access all tenants. |
| **adm_tenant_lifecycle_events** | Records lifecycle changes (created, plan changed, suspended, reactivated, cancelled) for tenants. It helps the billing engine (Stripe) and support to understand tenant status over time.                                        |

### Use of External Services

- **Clerk**: `adm_members` uses `clerk_user_id` to link internal user records to Clerk’s authentication system. Login, password management, and sessions are handled by Clerk.
- **Stripe Billing**: `adm_tenants` is linked to Stripe via `clerk_organization_id` or a similar field, and lifecycle events help to coordinate subscription states.
- **Sentry**: Audit log entries and tenant events can be used to trigger alerts.

---

## 2 Reference Data (`dir_`)

Tables in this domain act as look‑ups or directories. They are often global or multi‑tenant and are referenced by other tables.

| Table                       | Purpose / Integration                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **dir_car_makes**           | Defines vehicle manufacturers (e.g. Toyota, Ford). Optional tenant ID allows tenants to add makes if not globally available.             |
| **dir_car_models**          | Models per make, with `vehicle_class_id` referencing **`dir_vehicle_classes`**.                                                          |
| **dir_vehicle_classes**     | Vehicle classifications (e.g. economy, SUV, luxury). Linked to country regulations.                                                      |
| **dir_platforms**           | Ride‑hailing platforms (Uber, Bolt, etc.). Each platform’s API configuration may be stored in JSON.                                      |
| **dir_country_regulations** | Government regulations by country (max vehicle age, minimum fares, VAT rates). Used to validate fleet vehicles and calculate compliance. |

### Use of External Services

- **Traccar**: When vehicles transmit GPS data, the system associates the `vehicle_class` and regulatory constraints from `dir_country_regulations` to compute compliance (e.g. service intervals). Traccar itself is external but Fleetcore stores configuration for classification.

---

## 3 Documents (`doc_`)

| Table             | Purpose / Integration                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **doc_documents** | Polymorphic table storing references to uploaded files (driver licences, vehicle registration, insurance certificates, contracts, etc.). `entity_type` and `entity_id` link to any entity (vehicles, drivers, members, contracts). Verified flags record whether an admin has checked authenticity. Files themselves are stored via Supabase storage or another storage provider; this table holds metadata and URLs. |

### Use of External Services

- **Resend**: When a document expires or needs renewal, Resend can notify the relevant driver or tenant via email. The table tracks expiry and verification dates for such triggers.

---

## 4 Fleet (`flt_`)

These tables represent vehicles and related events, maintenance, expenses, insurances, and assignments. They rely on the reference data (`dir_`) and track operational details.

| Table                       | Purpose / Integration                                                                                                                                                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **flt_vehicles**            | Core table storing all vehicle assets per tenant (make, model, VIN, registration dates, ownership type, etc.). Integrates with `rid_drivers` through assignments and with insurance/maintenance records.                                                                                                              |
| **flt_vehicle_assignments** | (Already implemented) Assigns vehicles to drivers for specific periods, with audit and RLS for multi‑tenant isolation. Can trigger notifications when an assignment ends.                                                                                                                                             |
| **flt_vehicle_events**      | Logs lifecycle events (acquisition, disposal, maintenance, accidents, handovers, inspections, insurance changes). `severity` and `event_type` enumerations allow filtering by importance. Used to schedule follow‑ups and interface with maintenance. Could integrate with Traccar incident reports or Sentry alerts. |
| **flt_vehicle_maintenance** | Records scheduled and completed maintenance tasks (oil change, inspection, brake service, repair, etc.). Tracks odometer readings and next service reminders. Integrates with Traccar or other fleet‑management systems that emit maintenance alerts.                                                                 |
| **flt_vehicle_expenses**    | Captures costs like fuel, tolls, parking, washes, repairs, fines. Items link to `trp_trips` or `fin_transactions` when relevant for settlements. Support categories and payment methods via CHECK constraints.                                                                                                        |
| **flt_vehicle_insurances**  | Stores insurance policies per vehicle (provider, policy number, coverage, currency, deductible, premium, frequency, dates, active flag). Ensures vehicles remain insured and triggers renewal reminders.                                                                                                              |

### Use of External Services

- **Traccar**: Real‑time GPS data (mileage, location) influences maintenance scheduling and cost tracking.
- **Stripe**: Some costs (e.g. fleet subscription tiers) may impact billing metrics captured in `bil_tenant_usage_metrics`.
- **Resend**: Renewal notifications for insurances or maintenance tasks.

---

## 5 Drivers (`rid_`)

These tables represent drivers, their documents, cooperation terms, performance, and requests.

| Table                            | Purpose / Integration                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **rid_drivers**                  | Core table for driver identity (names, contact info, licences, professional cards, status, ratings, notes). Soft‑delete allows reactivation. Integrated with Clerk via `adm_members` for driver authentication; tied to vehicles and trips. |
| **rid_driver_documents**         | Associates drivers with specific documents in `doc_documents` (e.g. driver licence, work permit). Tracks verification status and expiry.                                                                                                    |
| **rid_driver_cooperation_terms** | Records which version of cooperation/contract terms each driver accepted, including effective and expiry dates. Ensures compliance with legal requirements and monitors term changes.                                                       |
| **rid_driver_requests**          | Logs formal requests from drivers (leave, shift change, licence renewal), with status progression and resolution notes.                                                                                                                     |
| **rid_driver_performances**      | Intended to capture performance metrics (e.g. completed trips, punctuality, ratings). These metrics feed driver incentives or penalties and may integrate with `rev_driver_revenues`.                                                       |
| **rid_driver_blacklists**        | Maintains a list of drivers banned or blocked by certain tenants for misconduct or policy violations. Soft‑delete allows re‑evaluation.                                                                                                     |
| **rid_driver_training**          | Tracks mandatory training sessions, certification renewals, and assessments. Ensures compliance with local transport authorities.                                                                                                           |

### Use of External Services

- **Clerk**: Drivers may log into a portal using Clerk, which links to `rid_drivers` for personal data.
- **Resend**: Notifications about document expiry, training due, or contract updates.
- **Stripe**: Metrics from driver performances can influence revenue distributions or subscription usage.
- **Chatwoot/FreeScout**: Support tickets from drivers may relate to requests recorded here.

---

## 6 Scheduling (`sch_`)

Scheduling tables define shifts, tasks, goals, and maintenance schedules across the fleet.

| Table                         | Purpose / Integration                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sch_shifts**                | Defines working shifts for drivers (start, end, recurrence). Used to assign vehicles and tasks; integrates with leave requests to avoid conflicts.             |
| **sch_maintenance_schedules** | Schedules routine maintenance (oil changes, inspections) based on usage metrics (mileage/time). Linked to `flt_vehicle_maintenance` for actual work performed. |
| **sch_goals**                 | Sets strategic goals (e.g. monthly revenue, trip volume) per tenant. Progress metrics integrate with analytics dashboards.                                     |
| **sch_tasks**                 | Assigns tasks to staff (vehicle inspection, document verification, onboarding). Acts as a lightweight workflow engine integrated with support and operations.  |

### Use of External Services

- **Traccar**: Shift schedules may be cross‑checked with actual GPS logs to detect unauthorized usage.
- **Resend**: Automatic reminders to drivers about upcoming shifts or tasks.
- **Chatwoot/FreeScout**: Task assignments may generate support tickets.

---

## 7 Trips (`trp_`)

Trips tables record ride details, settlements, invoices and platform accounts. They integrate heavily with external ride‑hailing platforms.

| Table                     | Purpose / Integration                                                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **trp_trips**             | Represents each trip (tenant, driver, vehicle, platform, pickup/drop‑off coordinates, times, distance, duration, fares, commissions, net earnings, status). Soft‑delete used for cancellation or corrections. |
| **trp_platform_accounts** | Tracks credentials or identifiers linking vehicles and drivers to external ride‑hailing platforms. Separate from billing to allow many‑to‑many relationships.                                                 |
| **trp_settlements**       | Aggregates trip earnings and commission calculations per driver/platform period. Feeds into financial payouts (via `fin_driver_payment_batches`) and revenue reports.                                         |
| **trp_client_invoices**   | Creates customer invoices when the tenant is a corporate client (e.g. a company using the fleet for staff transport), distinct from subscription billing. Linked to trips and documents.                      |

### Use of External Services

- **Stripe Billing**: Billing metrics (distance, duration) may influence subscription usage; invoices are settled via Stripe but recorded here for auditing. Commission rates align with platform agreements.
- **Traccar**: Trip start/end times and coordinates can be validated against GPS data.
- **Chatwoot/FreeScout**: Trip disputes or cancellations may result in support tickets.

---

## 8 Finance (`fin_`)

Financial tables record accounts, transactions, payment batches, payouts, tolls and fines.

| Table                          | Purpose / Integration                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **fin_accounts**               | Lists financial accounts used by tenants or drivers for payouts. May include Stripe account IDs and bank details.                     |
| **fin_transactions**           | General ledger of debits and credits (e.g. subscription charges, driver payouts, reimbursements). Linked to trips and fleet expenses. |
| **fin_driver_payment_batches** | Groups payouts by period or pay cycle for drivers. Contains total earnings, deductions and references to Stripe payout objects.       |
| **fin_driver_payments**        | Individual driver payments per batch; references the bank or Stripe account used.                                                     |
| **fin_toll_transactions**      | Records toll charges billed by tolling authorities. May auto‑import data and reconcile with trip routes.                              |
| **fin_traffic_fines**          | Captures traffic fines issued to drivers/vehicles. This table ensures transparency and assignment of liability.                       |

### Use of External Services

- **Stripe Billing**: Some transactions originate from subscription invoices; others involve payouts to drivers via Stripe (treated as connected accounts). Fleetcore tracks them for accounting and reconciliation.
- **Traccar**: Toll and fine detection may be automated using GPS data and route information.

---

## 9 Revenue (`rev_`)

Revenue tables import data from platforms, calculate driver revenues and reconcile them with settlements.

| Table                   | Purpose / Integration                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **rev_revenue_imports** | Stages raw revenue data imported from ride‑hailing platforms (e.g. weekly reports). Temporary table to parse and validate before insertion into settlements. |
| **rev_driver_revenues** | Holds the final revenue per driver and per period after reconciliation. Serves as basis for driver payouts.                                                  |
| **rev_reconciliations** | Stores summary of reconciliation runs, capturing discrepancies between platform data and internal trips. Helps identify missing trips or mismatched fares.   |

### Use of External Services

- **Stripe**: Revenues drive payout calculations to drivers and invoice amounts to tenants. Data imported from platforms (Uber, etc.) is reconciled internally before creating `fin_driver_payments`.
- **Sentry**: Reconciliation failures or mismatches can trigger alerts.

---

## 10 SaaS Billing (`bil_`)

Even though Stripe handles payments, Fleetcore maintains billing tables to define subscription plans, track usage, and generate invoices. This ensures transparency and traceability independent of Stripe’s internal data.

| Table                        | Purpose / Integration                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **bil_billing_plans**        | Defines subscription plans (monthly fee, included mileage/trips, overage costs). Tenants subscribe to plans via `bil_tenant_subscriptions`.                         |
| **bil_tenant_subscriptions** | Links tenants to plans, storing start/end dates, current status (active, trial, cancelled), trial usage, and plan version.                                          |
| **bil_tenant_usage_metrics** | Tracks usage metrics for billing (number of trips, kilometres, number of drivers, etc.). Stripe invoices are generated based on these metrics and plan definitions. |
| **bil_tenant_invoices**      | Stores invoices issued to tenants (id, period, status, total amounts, currency). Links to Stripe invoice objects.                                                   |
| **bil_tenant_invoice_lines** | Contains individual line items (base plan, overage, taxes).                                                                                                         |
| **bil_payment_methods**      | Lists payment methods associated with each tenant (Stripe customer IDs, card brands, expiry dates).                                                                 |

### Use of External Services

- **Stripe Billing**: Invoices created in Fleetcore are mirrored in Stripe. Payment methods are stored in `bil_payment_methods` as references to Stripe payment sources. Usage metrics feed into Stripe’s invoice generation.

---

## 11 CRM (`crm_`)

Customer Relationship Management tables handle leads, opportunities and contracts. They integrate with Stripe for contract payments and with support services for follow‑ups.

| Table                 | Purpose / Integration                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| **crm_leads**         | Contains sales leads (contact info, company, status, priority). Helps sales teams track potential customers. |
| **crm_opportunities** | Represents qualified opportunities (deal stage, value, probability). Helps forecast revenue and pipeline.    |
| **crm_contracts**     | Formal contracts resulting from opportunities. Linked to Stripe subscription or one‑off payments.            |

### Use of External Services

- **Chatwoot/FreeScout**: Leads and opportunities generate tasks and tickets for follow‑up.
- **Stripe**: Contracts may involve subscription activation or one‑off invoices recorded in billing tables.

---

## 12 Support (`sup_`)

Fleetcore integrates with **Chatwoot** or **FreeScout** for customer support. These tables record internal metadata for tickets and messages.

| Table                     | Purpose / Integration                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **sup_tickets**           | Captures support tickets (tenant, reporter, subject, status, priority). Mirrors chat/conversation threads on external support systems.        |
| **sup_ticket_messages**   | Messages attached to tickets (sender, message body, timestamp, attachments). Links to `adm_provider_employees` and `adm_members` for senders. |
| **sup_customer_feedback** | Stores feedback (ratings, comments) from tenants and drivers. Helps improve service quality.                                                  |

### Use of External Services

- **Chatwoot/FreeScout**: Actual communications are handled by external support tools, but Fleetcore maintains a record of tickets and messages for auditing and analytics.
- **Resend**: Outgoing support notifications or updates can be sent via Resend.

---

## Conclusion

Even with powerful external services like **Clerk** for authentication, **Stripe Billing** for payments, **Chatwoot/FreeScout** for support, **Resend** for email, **Traccar** for GPS, **Vercel + Supabase** for hosting, and **Sentry** for monitoring, Fleetcore must maintain its own **database tables** to store internal state, enforce multi‑tenant isolation, manage business logic, and provide a consistent view across services. The tables are not mere duplicates of external systems; they ensure that data is normalized, auditable, and connected across domains. They allow Fleetcore to orchestrate workflows, enforce rules (e.g. unique documents, valid driver licences), support reporting and reconciliation, and offer flexibility to integrate or switch providers in the future without losing historical context.
