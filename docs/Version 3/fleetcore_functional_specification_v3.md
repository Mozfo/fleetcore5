# Fleetcore v3 – Comprehensive Functional Specification (English)

**Date:** 7 October 2025 (user timezone: Asia/Dubai)

This document supersedes the earlier versions of the Fleetcore functional
specification. It integrates all modules described in version 1 and
includes enhancements introduced in version 2, such as WPS payroll
integration, investor management, vehicle lifecycle tracking and SaaS
billing. Unlike previous iterations, every module is described
explicitly; no chapters are merely labelled as "unchanged". This
specification serves as the definitive reference for implementing
Fleetcore and should be read alongside the data model version 2.

## 1 Overview and Goals

Fleetcore is a **multi‑tenant SaaS platform** that helps companies
operating ride‑hailing fleets (VTC in France, limousine/taxi fleets in the
UAE and similar markets) manage their vehicles, drivers, finances and
operations. By centralising data from ride‑hailing platforms and
providing tools for scheduling, financial reconciliation, reporting and
compliance, Fleetcore aims to improve fleet efficiency and profitability
while simplifying regulatory compliance.

### 1.1 Stakeholders and Personas

| Persona                    | Description                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Fleet Owner**            | Owns or finances the fleet; needs consolidated dashboards, financial reports and tools to manage investors and subscription plans.                     |
| **Fleet Manager**          | Oversees day‑to‑day operations: vehicle acquisitions, assignments, maintenance, scheduling, payroll preparation and platform integrations.             |
| **Driver**                 | Employee or contractor who drives vehicles on platforms; accesses the driver portal to view earnings, expenses, documents and submit requests.         |
| **Finance Admin**          | Handles cashboxes, settlements, revenue allocation, investor payouts, driver payroll (including WPS) and tenant invoicing.                             |
| **HR Admin**               | Manages recruitment, onboarding, document collection, visa/residency compliance and driver performance tracking.                                       |
| **Mechanic**               | Performs maintenance, inspections and accident repairs; records repair events and parts used.                                                          |
| **Dispatcher/Call‑centre** | Manages corporate bookings and dispatches vehicles for office trips.                                                                                   |
| **External Client**        | Corporate customer booking B2B “office trips”; uses a dedicated portal to request rides, view trips and pay invoices.                                  |
| **Investor**               | Individual or entity financing vehicles; tracks vehicle performance and receives payouts proportional to ownership share【705897994408243†L395-L401】. |
| **Provider Staff**         | Account managers, support agents and sales representatives who administer tenants, manage subscriptions and resolve support requests.                  |

### 1.2 Cross‑Cutting Requirements

Fleetcore must meet a range of non‑functional requirements:

- **Multi‑tenant Isolation:** Each organisation (tenant) has its own data
  partition identified by `tenant_id`【229134380627077†L274-L284】. Cross‑tenant data
  access is prevented both at the database and application levels.
- **Role‑based Access Control (RBAC):** A configurable role hierarchy
  controls permissions. Users can have multiple roles per tenant and
  the platform integrates with Clerk to manage authentication, SSO and
  MFA【461206092833652†L168-L179】.
- **Internationalisation & Localisation:** The user interface is
  multilingual (English and French). Local currencies (AED, EUR) and
  date formats apply per tenant. Regulatory compliance is localised:
  UAE fleets must manage visas and WPS payroll, while French fleets must
  comply with VTC regulations (e.g., professional VTC cards, minimum
  vehicle size and age limits, red stickers, pre‑booked rides)【611243862873268†L268-L280】.
- **Data Protection & Privacy:** Sensitive documents (IDs, licences,
  residency permits) are encrypted at rest; access is logged and
  retention periods follow GDPR and UAE data protection laws. Drivers
  can request data deletion after legal retention periods.
- **Audit Logging & Monitoring:** All user actions affecting persistent
  state are logged (user, tenant, timestamp, IP, action). Platform
  integrations and API calls generate integration logs【357516310406806†L462-L550】.
- **Scalability & Performance:** Fleetcore is hosted as a SaaS and must
  support dozens of tenants with potentially thousands of drivers. Key
  tables (trips, transactions, audit logs) should be partitioned and
  indexed by `tenant_id` and time. The UI must deliver sub‑second
  responses with efficient pagination and search.
- **Document Storage:** Documents and photos are stored in secure cloud
  storage (S3 or equivalent) with metadata in the database. Versioning
  and expiry reminders are supported.
- **Time‑zones:** Scheduling and reporting use the tenant’s default
  timezone; driver portals display times converted to the driver’s local
  timezone.

## 2 Directory Management (Module 1)

This module provides shared reference data across the platform. It is
managed per tenant.

### 2.1 Car Makes, Models and Classes

A **car directory** stores car makes (brands) and models. It avoids
duplicating make/model entries within a tenant and ensures consistent
selection when creating vehicles【567670092230000†L32-L45】. Key features:

- **CRUD Operations:** authorised users can add, edit and delete make and
  model entries via the admin portal. Duplicate make + model
  combinations are prevented【567670092230000†L32-L45】. Model records include fields
  for body type (sedan, SUV, van), fuel type, passenger capacity and
  optional regulatory class codes (e.g., luxury, standard) relevant to
  ride‑hailing platforms.
- **Vehicle Classes:** to support VTC regulations, tenants can define
  custom vehicle classes (sedan, estate, van, limousine) with minimum
  size and age requirements. These classes are used during vehicle
  onboarding and platform registration.

### 2.2 Platforms & Services Directory

Fleetcore maintains a directory of ride‑hailing platforms (Uber, Bolt,
Careem, Uklon, Yango and future additions) with metadata:

- API base URL, authentication method, refresh frequency and supported
  services (ride‑hailing, food delivery).
- Platform‑specific settings per tenant, such as default commission
  percentage, accepted vehicle classes and documentation requirements.

### 2.3 Regulatory & Reference Data

To support compliance, the directory contains:

- **Country Regulations:** per country, specify vehicle age limits,
  minimum vehicle dimensions, required documents (registration, insurance,
  VTC licence), minimum fares and VAT rates【611243862873268†L268-L280】. For example,
  France requires a red VTC sticker and pre‑booked trips【611243862873268†L268-L280】.
- **Insurance Types:** list of insurance coverage levels (third party,
  comprehensive) with minimum coverage amounts. Tenants choose from
  these types when insuring vehicles.
- **Toll Gates & Fees:** for jurisdictions like Dubai’s Salik system,
  store toll gate locations and fees【751851848749800†L164-L168】. Toll transactions
  are recorded automatically when vehicles pass under a gate.

## 3 Vehicle Management (Module 2)

This module manages the entire lifecycle of vehicles from acquisition to
retirement.

### 3.1 Vehicle Master Data

Each **vehicle** record captures static information about the vehicle
【567670092230000†L56-L84】:

1. **Identification:** foreign keys to car make and model; year of
   manufacture; registration plate (unique per jurisdiction); VIN (unique);
   colour; passenger capacity and body type.
2. **Documentation:** registration certificate, insurance certificate,
   inspection certificate (MOT/RTA), platform approval documents and
   optional extras (limousine licence, branding permit). Each document
   stores issue and expiry dates; the system alerts users 30 days before
   expiry【567670092230000†L74-L79】.
3. **Insurance Details:** policy number, insurer, coverage type, coverage
   amount and expiry date【567670092230000†L74-L79】.
4. **Ownership & Financing:** owner type (fleet, lease, investor), owner
   ID (link to owner or investor table), acquisition date, lease/rental
   contract reference, lease term and residual value.
5. **Equipment:** items included with the vehicle such as smartphones,
   mounting kits, child seats, tracking devices and telematics units【567670092230000†L80-L83】.
6. **Status:** active, inactive, under maintenance, scrapped. Vehicles
   with expired documents or beyond age limits are automatically marked
   inactive.

### 3.2 Vehicle Historical Data & KPIs

Fleetcore maintains a read‑only **vehicle history** to analyse
profitability【567670092230000†L90-L118】:

- **Trip Metrics:** number of trips, distance travelled and revenue per
  platform; aggregated daily/weekly/monthly【567670092230000†L90-L118】.
- **Earnings:** gross and net revenue, platform commissions, investor
  shares and driver shares【567670092230000†L90-L118】.
- **Expenses:** fuel, maintenance, insurance, tolls, fines and other
  costs【567670092230000†L90-L118】.
- **Utilisation & Efficiency:** utilisation rate (active hours vs available
  hours), revenue per kilometre and cost per kilometre.

The history is populated via platform integrations, expense entries and
manual adjustments. It drives dashboards in the Reports module.

### 3.3 Real‑Time Platform Status & Monitoring

Fleetcore polls each connected platform to update **real‑time status** for
vehicles and drivers【567670092230000†L127-L146】:

- **Vehicle Status:** online, offline, busy (in trip) or unavailable due to
  maintenance. Statuses are tracked per platform. The dashboard
  prevents dispatching a vehicle on another platform when it is already
  engaged.
- **Driver Status:** available, en‑route, waiting, in trip or offline. When
  drivers operate multiple platforms, the system aggregates statuses
  preventing over‑work and conflicts.
- **Analytics:** total online hours per platform, average waiting time,
  cancellations and acceptance rates are visualised.

### 3.4 Vehicle Schedule Planning & Maintenance

The **vehicle cycle planner** is a calendar/timeline showing scheduled
activities【567670092230000†L153-L178】:

- **Maintenance & Inspections:** plan regular services (e.g., every
  10 000 km), government inspections and repairs. Blocking periods in the
  planner prevents assigning the vehicle during maintenance【567670092230000†L153-L178】.
- **Driver Shifts:** schedule drivers to vehicles in morning, evening and
  night shifts. The planner prevents overlapping assignments and sends
  reminders to drivers.
- **Public Holidays:** define workdays and holidays; the planner adjusts
  shift counts accordingly.
- **Conflict Detection & Alerts:** if a shift overlaps maintenance or a
  driver’s documents are expired, the system warns the Fleet Manager.

### 3.5 Automated Vehicle Handover Process

Whenever a vehicle changes hands, Fleetcore performs a **handover
workflow**【567670092230000†L153-L178】:

1. **Pre‑Checks:** confirm vehicle is available and documents are valid;
   verify driver cooperation terms are active.
2. **Photo Capture:** the outgoing party takes photos of all sides of the
   vehicle and the interior. These photos are stored as evidence of
   condition【567670092230000†L153-L178】.
3. **Condition Record:** capture odometer reading, fuel level, damage
   notes and equipment inventory.
4. **Confirmation:** both parties sign the digital handover; optional
   manager approval for high‑value vehicles.
5. **System Actions:** update `flt_vehicle_assignments`, set odometer
   baseline, activate telematics and update driver portal.

### 3.6 Vehicle Performance Reporting & Daily Controls

Fleetcore generates **vehicle performance reports** with filters (date
range, platform, driver) and KPIs such as net profit, revenue per km and
utilisation【567670092230000†L90-L118】. Daily controls monitor odometer readings
(service due), insurance expiry and outstanding fines. Alerts are sent
via email/SMS.

### 3.7 Lifecycle Management

The v2 enhancement introduces **vehicle lifecycle tracking**【705897994408243†L120-L124】:

- **Acquisition:** record purchase/lease details including cost,
  financier, currency, contract terms and funding source.
- **Registration & Inspection:** log registration and inspection events
  with dates and supporting documents.
- **Maintenance & Repairs:** schedule and log maintenance sessions,
  unscheduled repairs and accident repairs with providers and costs.
- **Assignments & Handovers:** maintain a chronology of driver assignments
  and handovers with timestamps and photos【567670092230000†L153-L178】.
- **Accidents & Fines:** store accident reports and fines linked to
  vehicles; allocate costs and handle insurance claims.
- **Disposal:** record sale/return/scrap events with disposal type,
  buyer and sale price. Ensure all fines and documents are settled
  before disposal.

Analytics help determine when to retire or replace vehicles based on
utilisation, maintenance cost and residual value【705897994408243†L273-L274】.

### 3.8 Investor Rolling Stock Management

For vehicles financed by investors, Fleetcore implements an **Investor
Rolling Stock** model【705897994408243†L395-L401】:

- **Investor Profiles:** create investor records with contact details and
  contract terms. Investors may own multiple vehicles; vehicles may
  have multiple investors.
- **Ownership Shares:** specify ownership percentages per vehicle. These
  percentages determine revenue allocation.
- **Revenue & Expense Allocation:** when trips generate revenue or
  expenses, the system splits amounts among driver, fleet and investors.
  Investor payouts occur periodically (monthly/quarterly) and statements
  show earnings, costs and net profit.
- **Investor Portal:** investors access dashboards showing vehicle
  performance, ROI, upcoming maintenance and investment maturity.

## 4 Driver Management (Module 3)

This module manages drivers from recruitment through offboarding.

### 4.1 Driver Master Data

A **driver** record stores personal and professional data【567670092230000†L90-L118】:

- **Personal Info:** full name, date of birth, gender, nationality,
  languages, contact details and emergency contact.
- **Documents:** photos of passport/ID, driver licence, residence permit
  or work visa, medical certificate and professional VTC card (France)
  with issue and expiry dates. Alerts are sent 30 days before expiry.
  Drivers cannot be assigned if documents are invalid【611243862873268†L268-L280】.
- **Employment Details:** hire date, termination date, employment status
  (employee, contractor) and cooperation type.
- **Eligibility & Compliance:** driving licence categories, minimum
  driving experience and background check status. In France, drivers
  must hold a professional VTC licence and display the red sticker【611243862873268†L268-L280】.

### 4.2 Cooperation Terms & Contract Models

Fleetcore supports multiple **cooperation models**【567670092230000†L90-L118】:

1. **Fixed Rental:** the driver pays a fixed fee (monthly/weekly) to
   operate a vehicle; they keep all earnings.
2. **Crew/Shift Rental:** multiple drivers share a vehicle and pay
   per‑shift rental fees. Shifts are scheduled via the planner.
3. **Percentage Split:** drivers remit a percentage of gross earnings to
   the fleet. Percentages may vary by platform. The system can
   support multi‑level splits (fleet, supervisor, driver)【567670092230000†L90-L118】.
4. **Salary Model:** drivers are salaried employees; used for WPS
   compliance. Fields: base salary, allowances, pay frequency.
5. **Rental Model:** variations of rental (daily, weekly, monthly) with
   discounts for longer periods and mileage limits.
6. **Buyout/Lease‑to‑Own:** drivers pay instalments towards eventual
   ownership of the vehicle. Fields: vehicle price, down payment,
   instalment schedule.
7. **Investor Rolling Stock:** when drivers are investors in the
   vehicle; share percentages are defined.

Advanced term settings include platform‑specific percentages, bonus rules,
penalty rules, mileage limits, fuel and maintenance cost splits and
conditions for over‑mileage charges【567670092230000†L90-L118】.

### 4.3 Driver Performance Monitoring

Fleetcore aggregates driver performance metrics【567670092230000†L90-L118】:

- **Trip Metrics:** number of completed, cancelled and rejected trips;
  revenue by platform; acceptance and cancellation rates.
- **Online Hours:** total online time per platform, utilisation rate
  (online hours vs scheduled shift) and idle time.
- **Shift Tracking:** start/end times, duration and notes.
- **Status Monitoring:** driver status across platforms (available,
  en‑route, waiting, in trip, offline).
- **Alerts & Coaching:** high cancellation rate, low ratings (<4.5), low
  online hours, frequent negative feedback. Fleet managers can assign
  coaching sessions or training.

### 4.4 Driver Onboarding & Recruitment

The recruitment module manages the hiring pipeline【567670092230000†L90-L118】:

1. **Job Postings & Applications:** HR publishes job openings; candidates
   apply via web form. Each candidate record stores CV, contact info and
   notes.
2. **Candidate Workflow:** statuses include `applied`, `documents
submitted`, `interview`, `background_check`, `approved`, `rejected` and
   `hired`. HR can schedule interviews and record outcomes.
3. **Lead Capture & Call‑Centre:** inbound calls are logged with lead
   qualification details. Marketing spend per channel and cost per
   hire are tracked.
4. **Onboarding:** once approved, a driver record is created; required
   documents are collected; cooperation terms are assigned. Driver
   accounts are provisioned in Clerk and the driver portal.

### 4.5 Driver Communication & Request System

Drivers interact with the fleet via the **personal cabinet**:

- **Request Submission:** drivers submit requests for vehicle issues,
  payment issues, schedule changes, document updates or other topics【567670092230000†L90-L118】.
  Requests are routed to the appropriate department (mechanic, finance
  admin, fleet manager, HR). Each request has a status (`new`,
  `in_progress`, `resolved`, `closed`), SLA timers and escalation rules.
- **Self‑Service:** drivers view cooperation terms, earnings, expenses,
  bonuses, limits, handover histories, contracts and trip histories【567670092230000†L90-L118】.
  They can update personal information, upload documents and view
  notifications.
- **Chat & Notifications:** the portal includes chat or messaging for
  support interactions; notifications alert drivers to new shifts,
  salary payments, documents expiring and upcoming maintenance.

### 4.6 Driver Offboarding & Blacklist

When a driver leaves the fleet, the system performs an offboarding
process:

- Close all active shifts and assignments; ensure handover of vehicle and
  equipment.
- Set driver status to inactive; record termination date and reason.
- Archive driver documents according to retention policies; anonymise
  personal data when retention periods expire.

The platform maintains blacklists for both candidates and former
drivers【567670092230000†L90-L118】. Blacklist entries include reason and date; they
prevent re‑application without management approval. Drivers can
appeal via the HR portal.

## 5 Financial Management (Module 4)

The finance module handles cashboxes, transactions, payroll, investor
payouts and tenant billing.

### 5.1 Cashbox & Accounts

Fleetcore models multiple financial accounts【567670092230000†L90-L118】:

- **Bank Accounts:** main operating account, WPS salary account, reserve
  account and dedicated investor accounts.
- **Cash Desks:** office cash, driver collections, petty cash.
- **Card Accounts:** fuel cards, maintenance cards, toll accounts.
- **Investor Accounts:** accounts used to hold investor funds and pay
  dividends.

Accounts have real‑time balances, multi‑currency support and transaction
history with filters by date, type and account. Reconciliation tools
match bank statements to platform settlements.

### 5.2 Driver & Vehicle Financial Performance

A financial dashboard displays income and expenses per driver and per
vehicle【567670092230000†L90-L118】. It breaks down gross earnings, platform
commissions, rental fees, penalties, bonuses, advances, fuel costs,
maintenance costs, insurance premiums, tolls and net profit. Drivers
and fleet managers can view performance at different granularity.

### 5.3 Financial Incentives & Deductions

Fleetcore automatically applies bonuses and penalties based on
cooperation terms【567670092230000†L90-L118】. Bonus rules may include trip
milestones, high ratings or referral programs. Penalties are applied
for rule violations (e.g., smoking in vehicle, customer complaints),
traffic violations or payment delays. The system notifies drivers of
bonuses and penalties and records appeals.

### 5.4 Payment Processing & Settlements

Financial flows include:

- **Internal Transactions:** rental payments from drivers to fleet,
  salary payments from fleet to drivers, loans and advances. The
  `fin_transactions` table records all debit/credit events with
  references to vehicles, drivers and investors.
- **External Settlements:** weekly settlements from ride‑hailing
  platforms. The finance module calculates expected amounts from trip
  data and compares them with actual transfers; discrepancies trigger
  reconciliation workflows.
- **Corporate Payments:** invoices to corporate clients for office trips
  (Module 6) with payment terms (e.g., net 30). Reminders and dunning
  rules ensure timely payment.
- **Vendor Payments:** payments to maintenance providers, insurers and
  other vendors, with approval workflows for high amounts.

### 5.5 Automated Repayment & Debt Management

Drivers who owe the fleet (debts, penalties, advances) have amounts
automatically deducted from future earnings in a defined priority
(debts → penalties → advances). Repayment schedules are visible in
both driver and finance portals.

### 5.6 Financial Reporting & Export

The finance module provides P&L statements, cash flow statements,
balance sheets and detailed reconciliation reports. Users can filter
reports by tenant, date, driver or vehicle, export to Excel/PDF/CSV and
schedule recurring reports.

### 5.7 Investor Payouts & Revenue Sharing

When investors fund vehicles, earnings and expenses are allocated to
investors according to ownership percentages【705897994408243†L395-L401】. The system:

- Calculates investor shares of trip revenue after deducting platform
  commissions and expenses.
- Generates periodic statements summarising revenue, expenses and net
  income per vehicle.
- Initiates payouts to investor bank accounts or wallets at scheduled
  intervals. Payouts appear as transactions in the finance ledger.

### 5.8 Driver Payroll & WPS (UAE)

This section describes salary processing compliant with the UAE **Wage
Protection System (WPS)**. Salary runs may be monthly or bi‑monthly:

1. **Salary Inputs:** Finance admins record or approve base salaries and
   allowances; the system automatically imports penalties, advances and
   deductions (e.g., unpaid fines). Driver documents (visa, Emirates ID,
   labour card) must be valid【611243862873268†L268-L280】; otherwise, the driver is
   excluded from the batch.
2. **Batch Processing:** Drivers are grouped by WPS bank account and
   salary period. Each batch holds the total amount and individual
   payments (`fin_driver_payment_batches`).
3. **File Generation:** The system generates a SIF file for the bank,
   containing all drivers’ payment details. The admin downloads and
   uploads it to the bank portal.
4. **Status Tracking:** Batch status transitions from `draft` to
   `exported`, `sent` and `processed`. Errors (invalid IBAN, closed
   account) are flagged for manual correction.
5. **Payslips:** Drivers receive detailed payslips showing salary,
   allowances, deductions and net pay via the portal.
6. **Non‑WPS Payroll:** For other jurisdictions (e.g., France), payroll is
   processed via SEPA or local bank transfers. The payroll engine
   supports multiple payout methods (bank transfer, mobile money, cash).

### 5.9 Tenant Billing & Subscription Management

Fleetcore is offered as a subscription service; this sub‑module handles
billing of tenants:

- **Plan Management:** define plans (Basic, Pro, Enterprise) with base
  monthly fees, included resources (drivers, vehicles, trips) and
  overage charges. Add‑ons (premium support, advanced analytics) are
  available.
- **Subscription Records:** each tenant subscribes to a plan with start
  date, status (active, trial, suspended, cancelled) and auto‑renew
  flag. Plan changes are prorated.
- **Usage Tracking:** the platform logs usage metrics – number of
  drivers, vehicles, trips, API calls, storage used and support
  tickets – per billing period【535592711015414†L482-L505】.
- **Invoicing:** at the end of the billing cycle, Fleetcore generates
  invoices containing the base fee, overage charges and VAT (5 % UAE,
  20 % France)【611243862873268†L268-L280】. Tenants view invoices in the admin
  portal, download PDF versions and pay via credit card, bank
  transfer or direct debit.
- **Payments & Reconciliation:** payments are matched to invoices and
  statuses updated. Automatic reminders and dunning rules help manage
  overdue accounts.

## 6 Schedule & Online Management (Module 5)

This module provides unified planning for drivers and vehicles and an
operations dashboard.

### 6.1 Schedule Planning

- **Driver Activity Planning:** create and manage shifts (morning,
  afternoon, night), days off and holidays. Drivers can request
  shift swaps; managers approve or reject. Overtime hours are
  tracked.
- **Vehicle Workload Planning:** schedule maintenance blocks, corporate
  bookings and driver assignments; balance vehicle usage evenly across
  the fleet.
- **Goal Setting:** define goals for fleet, vehicles and drivers (e.g.,
  number of trips per day, revenue targets). Track progress and
  display status on the dashboard.

### 6.2 Online Dashboard

The dashboard displays live operational metrics【5206060583002†L888-L892】:

- **Online Drivers:** list of drivers currently online with status and
  platform distribution; filter by platform.
- **Offline Drivers:** list of drivers offline with last active time.
- **Idle Vehicles:** vehicles without drivers (idle or in maintenance).
- **Trip Monitoring:** real‑time map of active trips, notifications for
  trip start/end and live revenue counters. The system compares
  planned vs actual values and highlights underperformance.
- **Summary Panel:** circular charts show total earnings, trips
  completed, active vehicles and progress towards goals.

### 6.3 User Interface Customisation

Users can customise the dashboard: hide or reorder columns, save
preferences and set default filters. A filter menu allows selection
of vehicles, drivers, platforms, rental models and date ranges. Settings
are saved per user per organisation.

## 7 Office Trips – B2B Bookings (Module 6)

Fleetcore supports private corporate bookings (“office trips”) for
business clients【5206060583002†L888-L892】.

### 7.1 Corporate Client Management

- **Client Profiles:** store company name, billing contact, contract
  terms, credit limits and discount structures.
- **Booking Management:** call‑centre operators or clients can create
  bookings – one‑way, round trip or hourly – for future dates/times or
  recurring services. Bookings store pickup/drop‑off locations,
  passenger count, special requirements and preferred vehicle class.
- **Station‑Based Order Management:** orders can be assigned to specific
  taxi stations; drivers are assigned based on proximity or queue
  rules. Manual override is allowed.
- **Commission Structure:** configure commission levels for corporate
  trips (e.g., share for partner station) and define steps to activate
  each station.
- **Price Review Workflow:** customers can request price adjustments
  after trips; managers analyse justifications, compare actual vs
  expected routes and approve or reject. Approved adjustments
  generate credit notes.
- **Invoicing:** automatically generate invoices (weekly or monthly)
  with itemised trip details and VAT. The system tracks invoice
  status and sends reminders for overdue payments.

### 7.2 Driver Interaction

Drivers see assigned corporate trips in their portal with pickup time,
location and passenger information. They can accept or decline; if
declined, the trip moves to the next driver in the queue. Data privacy
ensures drivers see only necessary information.

## 8 Reports & Analytics (Module 7)

Fleetcore provides built‑in reports for all stakeholders【567670092230000†L90-L118】:

- **Driver Reports:** attendance, performance, earnings, violations,
  retention and satisfaction scores.
- **Vehicle Reports:** utilisation, profitability, maintenance history
  and downtime.
- **Financial Reports:** P&L, cash flow, balance sheet, revenue by
  platform, expense breakdowns and reconciliation statements.
- **Operational Reports:** fleet efficiency, platform performance,
  customer satisfaction, compliance status (document expirations,
  fines) and trip analytics.
- **Statements Section:** display settlements and statements from
  ride‑hailing platforms with discrepancy analysis.
- **Custom Reports:** a report builder allows users to select fields,
  apply filters, save templates and schedule recurring reports with
  email delivery.

Reports support multi‑level filtering (date, driver, vehicle, platform,
trip type) and export to Excel, PDF or CSV.

## 9 Platform Integrations (Module 8)

Fleetcore connects to ride‑hailing platforms and other services.

### 9.1 Ride‑hailing Platforms

Integration includes【567670092230000†L127-L146】:

- **Data Synchronisation:** import driver status (online/offline), trip
  details (time, location, distance, fare breakdown, commissions,
  payment method) and vehicle status (active/inactive, compliance
  status). Export updated driver availability, vehicle documents and
  payment method settings to platforms.
- **Automated Aggregation:** schedule hourly synchronisations; unify
  trip data to drivers and vehicles; detect discrepancies and raise
  reconciliation tasks.
- **Unified Dashboard:** compare revenue and performance across
  platforms; highlight top performers and underperformers.

Integration modules securely store API credentials per platform and
per tenant. Error handling ensures failed synchronisations are retried
and flagged for support.

### 9.2 GPS & Telematics Integrations

Fleetcore integrates with GPS providers like Mapon, DT and Wialon. It
collects real‑time location, speed, geofence events, driver behaviour
(harsh braking, rapid acceleration), odometer readings and CAN bus
information【5206060583002†L888-L892】. Data feeds into the online dashboard,
vehicle history and maintenance schedule.

### 9.3 Payment & Accounting Integrations

Payment integrations include deposit kiosks (Citi24), payment terminals
(Network), generic bank interfaces and fuel card providers. Accounting
integrations export transactions to third‑party systems (QuickBooks,
Xero, Zoho). These integrations handle deposit and withdrawal events,
match them to driver balances and support automated settlement.

### 9.4 Communication Integrations

While Telegram is excluded, Fleetcore integrates with smart telephony
(e.g., Binotel) and SMS providers. Calls are logged automatically;
customer requests via phone are recorded into the CRM; SMS messages
notify drivers and managers of shifts, payments and important events.
The system is designed to support future messaging providers via a
plugin architecture.

## 10 Staff Management & ERP (Module 9)

### 10.1 Role‑Based Access Control

Fleetcore implements a multi‑level role system with roles such as Fleet
Owner, CEO, Fleet Manager, Supervisor, Dispatcher, Driver Specialist,
Car Specialist, Finance Admin, HR Admin, Mechanic and Call Centre
Agent. Each role maps to permissions to view and edit specific
resources. Custom roles can be defined; users may have multiple roles
per tenant. Clerk manages authentication, SSO and MFA; Fleetcore
stores only the Clerk user ID and business metadata【229134380627077†L240-L267】.

### 10.2 Internal Task Management

An internal task management system automatically generates tasks based
on system events. Examples: vehicle maintenance due (odometer
threshold), document expiry approaching, unpaid invoices, driver
violations. Tasks are assigned to the responsible role (mechanic,
finance admin, fleet manager). Escalation rules ensure unresolved
issues are escalated to supervisors.

### 10.3 Internal Staff ERP

Beyond fleet management, Fleetcore serves as a lightweight ERP for
provider staff. It manages employee contracts, departments, salary
structures, internal KPIs, revenue attribution and expense tracking.
Project management features allow teams to create projects, assign
resources and track progress.

## 11 Custom Services (Module 10)

Fleetcore offers optional professional services:

- **Business Consulting:** access to industry benchmarks, best practices
  and scaling strategies tailored to ride‑hailing fleets.
- **Custom BI Dashboards:** integration with external BI tools (Looker
  Studio, Power BI, Tableau) for bespoke analytics and advanced data
  visualisations. Data is exposed via secure APIs or warehouse
  connectors.
- **Implementation Support:** assistance with onboarding, data migration
  and custom integrations.

These services are delivered outside the core SaaS subscription and
require separate agreements.

## 12 Customer Onboarding Program (Module 11)

Fleetcore prescribes an onboarding programme for new tenants to ensure
successful adoption【567670092230000†L90-L118】:

1. **Discovery & Scoping:** gather information about the customer’s
   fleet size, platforms, cooperation models and regulatory
   requirements.
2. **Data Migration:** import existing vehicle, driver and trip data;
   map data fields and cleanse duplicates.
3. **Configuration:** set up cooperation terms, vehicle classes,
   platform credentials, roles and permissions, subscription plan and
   billing details.
4. **Training:** provide training for managers, finance staff, HR and
   drivers on using the portal, mobile app and admin interfaces.
5. **Go‑Live & Support:** run parallel operations with the old system,
   monitor performance and assist with go‑live. Post‑launch support
   includes regular check‑ins and feature adoption reviews.

## 13 SaaS Billing & Subscription Management (Module 12)

This module manages the commercial relationship between the SaaS provider
and tenants. It encompasses plan definition, subscription records,
usage tracking, invoicing and payment processing. See section 5.9 for
financial details.

## 14 Support & Customer Service (Module 13)

Fleetcore includes a built‑in support ticketing system inspired by
SaaS support best practices【535592711015414†L455-L460】【535592711015414†L466-L475】:

- **Ticket Management:** tenants and drivers can raise support tickets
  specifying subject, category (technical, billing, training,
  feature request, commercial), priority and description. Tickets are
  assigned to provider support agents. Statuses include `open`,
  `in_progress`, `awaiting_customer`, `resolved` and `closed`.
- **Conversation Threads:** each ticket stores a threaded conversation.
  Users receive notifications when new messages are posted.
- **Proactive Support:** provider agents can create tickets on behalf
  of customers (e.g., when monitoring detects repeated errors) and
  proactively offer help【535592711015414†L440-L448】.
- **Customer Feedback:** after resolution, customers can rate the
  service and provide feedback. This feedback informs improvements
  in product and support processes【535592711015414†L455-L460】.
- **Reporting:** support metrics (time to respond, time to resolve,
  satisfaction scores) feed into provider dashboards and influence
  resource allocation.

## 15 Lots & Phasing

Fleetcore’s rollout is divided into phases (lots) to manage scope and
complexity:

- **Lot 1 (V1):** includes all core modules above except the extended
  capabilities marked for Lot 2. Specifically, V1 covers directory
  management, vehicle and driver management with lifecycle tracking and
  investor management, financial management (including WPS payroll and
  tenant billing), scheduling, B2B bookings, reporting, platform
  integrations, staff management, onboarding, SaaS billing and support.
- **Lot 2 (V2):** introduces advanced features such as stock &
  inventory management (tracking phones, tablets, accessories),
  geolocation & telematics (real‑time GPS, driving behaviour), HR
  processes (leave management, training plans, appraisals), marketing
  campaigns and extended telemetry analytics. These modules build on
  the foundations established in Lot 1 and require additional
  integration and design work.

---

This comprehensive functional specification ensures that all modules
required for Fleetcore’s v3 release are fully documented. It
integrates baseline features from MytaxiCRM, incorporates enhancements
such as WPS payroll and investor management, and details SaaS billing
and support operations while maintaining compliance with local
regulations【611243862873268†L268-L280】 and industry best practices【535592711015414†L455-L460】.
