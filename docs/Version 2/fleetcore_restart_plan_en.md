# Fleetcore – Comprehensive Restart Plan

**Date:** 7 October 2025

This document provides Claude code with a detailed guide for relaunching the Fleetcore project in its final, fully featured version. It specifies how many tables to create, where to use `JSONB` columns, the logical order of operations and the dependencies between modules to ensure that all capabilities identified in the baseline are covered.

## 1. General principles

- **Multi‑tenancy:** every business table includes a `tenant_id` column to isolate data per organisation. Supabase RLS policies must be enabled to restrict access to users belonging to the tenant.
- **Naming convention:** tables are prefixed by domain (`adm_`, `dir_`, `doc_`, `flt_`, `rid_`, `sch_`, `trp_`, `fin_`, `rev_`, `bil_`, `crm_`, `sup_`, `hr_`, `inv_`, `sys_`) as specified in version 2【491524022416630†L64-L67】. Columns use `snake_case` and table names are plural.
- **Data types:** primary keys are `UUID` (`uuid_generate_v4()`); time fields are `TIMESTAMPTZ`. Several tables include `JSONB` columns to store extensible metadata.
- **Third‑party services:** Clerk handles authentication and organisation management; Supabase hosts the PostgreSQL database; Stripe/Paddle manages SaaS billing; Traccar provides GPS tracking; Resend handles email sending and Chatwoot/FreeScout handle customer support.

## 2. Table breakdown

The full model contains **55 tables** across 14 domains, around 12 of which use `JSONB` for flexibility. Here is a summary:

| Domain                      | Tables                                                                                                                                                                            | `JSONB` usage                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Administration (`adm_`)** | 7 tables: `adm_tenants`, `adm_members`, `adm_roles`, `adm_member_roles`, `adm_audit_logs`, `adm_provider_employees`, `adm_tenant_lifecycle_events`                                | `adm_roles.permissions`                                                                        |
| **Reference (`dir_`)**      | 5 tables: `dir_car_makes`, `dir_car_models`, `dir_platforms`, `dir_country_regulations`, `dir_vehicle_classes`                                                                    | `dir_country_regulations.metadata`                                                             |
| **Documents (`doc_`)**      | 1 table: `doc_documents`                                                                                                                                                          | `doc_documents.metadata`                                                                       |
| **Fleet (`flt_`)**          | 6 tables: `flt_vehicles`, `flt_vehicle_assignments`, `flt_vehicle_events`, `flt_vehicle_maintenance`, `flt_vehicle_expenses`, `flt_vehicle_insurances`                            | `flt_vehicles.metadata`, `flt_vehicle_events.details`                                          |
| **Drivers (`rid_`)**        | 7 tables: `rid_drivers`, `rid_driver_documents`, `rid_driver_cooperation_terms`, `rid_driver_requests`, `rid_driver_performances`, `rid_driver_blacklists`, `rid_driver_training` | `rid_drivers.metadata`, `rid_driver_cooperation_terms.terms`                                   |
| **Scheduling (`sch_`)**     | 4 tables: `sch_shifts`, `sch_maintenance_schedules`, `sch_goals`, `sch_tasks`                                                                                                     | `sch_goals.metadata`, `sch_tasks.metadata`                                                     |
| **Trips (`trp_`)**          | 4 tables: `trp_platform_accounts`, `trp_trips`, `trp_settlements`, `trp_client_invoices`                                                                                          | `trp_trips.fare_breakdown`, `trp_trips.metadata`, `trp_client_invoices.line_items`             |
| **Finance (`fin_`)**        | 6 tables: `fin_accounts`, `fin_transactions`, `fin_driver_payment_batches`, `fin_driver_payments`, `fin_toll_transactions`, `fin_traffic_fines`                                   | `fin_transactions.metadata`, `fin_driver_payments.breakdown`, `fin_toll_transactions.metadata` |
| **Revenue (`rev_`)**        | 3 tables: `rev_revenue_imports`, `rev_driver_revenues`, `rev_reconciliations`                                                                                                     | `rev_revenue_imports.metadata`, `rev_driver_revenues.metadata`                                 |
| **SaaS Billing (`bil_`)**   | 6 tables: `bil_billing_plans`, `bil_tenant_subscriptions`, `bil_tenant_usage_metrics`, `bil_tenant_invoices`, `bil_tenant_invoice_lines`, `bil_payment_methods`                   | `bil_tenant_usage_metrics.metadata`, `bil_tenant_invoices.metadata`                            |
| **CRM (`crm_`)**            | 3 tables: `crm_leads`, `crm_opportunities`, `crm_contracts`                                                                                                                       | `crm_leads.metadata`, `crm_opportunities.metadata`, `crm_contracts.metadata`                   |
| **Support (`sup_`)**        | 3 tables: `sup_tickets`, `sup_ticket_messages`, `sup_customer_feedback`                                                                                                           | `sup_tickets.metadata`, `sup_ticket_messages.metadata`                                         |
| **Human resources (`hr_`)** | 2 tables: `hr_candidates`, `hr_onboarding_stages`                                                                                                                                 | `hr_candidates.metadata`                                                                       |
| **Investors (`inv_`)**      | 2 tables: `inv_investors`, `inv_vehicle_investors`                                                                                                                                | `inv_investors.metadata`                                                                       |
| **System (`sys_`)**         | 2 tables: `sys_demo_lead`, `sys_demo_lead_activity`                                                                                                                               | `sys_demo_lead.metadata`                                                                       |

## 3. Detailed step‑by‑step

### Step 0: Preparation, regional migration and cleanup

1. **Move to the Zurich region:** the existing Supabase project in Mumbai causes high latency because Vercel is hosted in the United States. Create a new Supabase project in the `eu-central-1` region (Zurich) and enable the `uuid-ossp` and `pgcrypto` extensions. No tables have been created in this new project yet.

2. **Backup useful data:** only four legacy tables – `organization`, `member`, `sys_demo_lead` and `sys_demo_lead_activity` – are currently used by Clerk and the UI. The other 34 tables come from an incomplete schema and should be dropped. Before deleting them, export any records that you may want to reuse:
   - Use `pg_dump --data-only --table=<table name>` to generate an `INSERT` script (e.g. `pg_dump --data-only --table=public.flt_vehicles -f flt_vehicles_backup.sql`).
   - Or `\copy flt_vehicles to '/tmp/flt_vehicles.csv' with (format csv, header true);` to produce a readable CSV. Repeat for each table into which you injected test data.
   - If you prefer a JSON export, write a Node/Prisma script to read the records and save them to a file.

3. **Clean up the Mumbai schema:** remove the models corresponding to the 34 incorrect tables from `schema.prisma` and execute a migration (`npx prisma migrate dev --name drop_bad_tables`) to drop them from the existing database. Update `seed.ts` so it no longer attempts to populate these obsolete tables. Cleaning up avoids unwanted structures in future migrations.

4. **Initialize the canonical schema in Zurich:**
   - **Option A (quick compatibility):** first create the three canonical tables `adm_tenants`, `adm_members` and `crm_leads`, then create **compatibility views** named `organization`, `member` and `sys_demo_lead` so that the front‑end and Clerk continue to work without immediate changes. The views select columns from the canonical tables, for example:

     ```sql
     CREATE TABLE adm_tenants (...);
     CREATE TABLE adm_members (...);
     CREATE TABLE crm_leads (...);

     CREATE VIEW organization AS
       SELECT id, name, country_code, clerk_organization_id AS clerk_org_id, ...
       FROM adm_tenants;

     CREATE VIEW member AS
       SELECT id, tenant_id AS organization_id, clerk_user_id AS clerk_id, email, ...
       FROM adm_members;

     CREATE VIEW sys_demo_lead AS
       SELECT id, full_name, email, phone, company, country_code, created_at
       FROM crm_leads;
     ```

     This maintains backward compatibility while laying a clean foundation. You can later refactor the code to use canonical names and drop the views.

   - **Option B (direct creation of final tables):** if you prefer to start fresh, skip creating the views and implement the tables from the full model directly (see Steps 1 to 5). In this case, adapt the code immediately to use the new names (`adm_tenants` etc.) and import only the relevant data exported in step 2.

5. **Re‑import test data:** after creating the new structures in Zurich, reinject the backed up data if still relevant. For CSVs, use `\copy table_name from '/tmp/file.csv' with (format csv, header true)` and adapt the columns to the new structure. For SQL scripts, run them via `psql`.

6. **Update environment variables and services:** to reduce latency, modify only the connection URLs and anonymous keys to point to the Zurich Supabase project (no need to change the Vercel hosting). The environment variables to update include `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Check the region of your external services (Upstash Redis EU, Sentry EU, etc.) if you want further optimisation. Always mask secret values with `xxxxx` in examples.

7. **Configure Clerk and local environment files:** after creating the canonical tables in Zurich, log in to the Clerk dashboard and set up the SaaS provider organisation. Ensure that the **Allowed Origins** include your development and production domains. Update the **OAuth Redirect URLs** to point to the new domain if applicable. Record the `organization_id` of your provider organisation and save it in the environment variable `FLEETCORE_ADMIN_ORG_ID`.
   - In your project's `.env.local` (for local development) and the Vercel dashboard (for staging/production), review and update all Clerk‑related variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`, `FLEETCORE_ADMIN_ORG_ID`) so they point to the new Zurich configuration.
   - When inviting the first administrator of a tenant, use the canonical `adm_invitations` table and populate the `tenant_id`, `email`, `role` and `token` fields. Clerk will honour the invitation token and place the user in the correct organisation; the organisation name should be read‑only in the registration form.

8. **Reapply Supabase policies:** Supabase row‑level security must be re‑established on the new Zurich project. After you create the tables, go to **SQL Editor → Policies** in the Supabase dashboard and recreate policies that restrict access by `tenant_id`, just as in the Mumbai project. A typical policy looks like this:

   ```sql
   create policy "Tenant isolation" on adm_members
     for all using (tenant_id = current_setting('app.current_tenant_id')::uuid);
   ```

   You may need to set `app.current_tenant_id` in your API middleware when making server‑side requests.

9. **Verify other third‑party services:** if you decide to relocate Upstash Redis or your Sentry project to Europe to match the Zurich region, create new instances and update `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `SENTRY_DSN` in your `.env` and Vercel settings. Similarly, ensure that Resend’s domain configuration is correct for sending emails from the new environment.

### Step 1: Create administrative and reference schemas

1. **Administration:** define the models `adm_tenants`, `adm_members`, `adm_roles`, `adm_member_roles`, `adm_audit_logs`, `adm_provider_employees` and `adm_tenant_lifecycle_events`. These tables manage authentication (via `clerk_organization_id` and `clerk_user_id`), roles, audit logging and regulatory traceability.

   Complement this domain with a table `adm_invitations` to handle secure invitation links. Each record contains: the `tenant_id` of the organisation, the invitee’s `email`, a `role` indicating the access level to be granted (e.g. `admin` or `user`), a signed `token` (stored as a hash) to secure the invitation, an expiration date, and a `status` (`pending`, `used`, `expired`).

   This table is used to:
   - send a KYC link to the client once the lead is qualified (preparation of the company form),
   - create the client’s administrator account once the company is validated,
   - allow the client admin to invite additional users to their organisation,
   - and handle requests for a second admin (which require intervention from the SaaS super‑admin).

2. **Reference data:** create `dir_car_makes`, `dir_car_models`, `dir_platforms`, `dir_country_regulations` and `dir_vehicle_classes`. Seed the tables with default data: common makes and models, platforms (Uber, Bolt, Careem), country rules (maximum vehicle age, VAT rates, minimum fares【407970352218538†L268-L280】) and vehicle classes.

3. **Documents:** set up `doc_documents` with columns `entity_type`, `entity_id`, `document_type`, `file_url`, `issue_date`, `expiry_date`, `metadata` etc. Integration with a file storage system (Supabase Storage or S3) should be in place before production.

### Step 2: Fleet and driver modules

1. **Vehicles:** create `flt_vehicles` (base info plus a `metadata` JSONB for acquisition, insurance and equipment). Add `flt_vehicle_assignments` to link vehicles to drivers and `flt_vehicle_events` to record acquisitions, maintenance, accidents and handovers. Include `flt_vehicle_maintenance`, `flt_vehicle_expenses` and `flt_vehicle_insurances` to manage services, expenses and insurance policies.

2. **Drivers:** define `rid_drivers` (personal info, VTC card number, visa or Emirates ID in `metadata`). Add `rid_driver_documents` to store licences, visas, VTC cards, `rid_driver_cooperation_terms` (with JSONB `terms` field for the seven financial models【166849981038207†L355-L399】), `rid_driver_requests` (leave, vehicle change), `rid_driver_performances` (KPIs), `rid_driver_blacklists` (banned drivers) and `rid_driver_training` (mandatory training).

### Step 3: Scheduling, trips and revenue

1. **Planning:** create `sch_shifts` (shift management), `sch_maintenance_schedules` (maintenance scheduling), `sch_goals` (daily or weekly goals) and `sch_tasks` (tasks and alerts). These tables allow you to plan workdays, maintenance and detect conflicts【166849981038207†L153-L178】.

2. **Platform accounts and trips:** set up `trp_platform_accounts` (linking driver/vehicle → Uber/Bolt account), `trp_trips` (storing trips with a `fare_breakdown` JSONB for the fare components), `trp_settlements` (platform payment reconciliation) and `trp_client_invoices` (B2B invoices with `line_items` JSONB).

3. **Revenue:** create `rev_revenue_imports` (CSV/API imports), `rev_driver_revenues` (revenue per driver and per trip) and `rev_reconciliations` (comparison between expected and received revenue). These tables are essential for payroll and discrepancy detection.

### Step 4: Finance & driver payroll

1. **Financial accounts:** define `fin_accounts` (bank, cash desk, fuel card, etc.) and `fin_transactions` to record all money movements (revenue, expenses, payments, transfers). Use a `metadata` JSONB to store specific details.

2. **WPS payroll and bonuses/penalties:** create `fin_driver_payment_batches` and `fin_driver_payments` to manage monthly payroll (including SIF export for WPS) and `fin_bonus_penalty_rules` (automatic bonus/penalty rules). Tolls and fines are handled in `fin_toll_transactions` and `fin_traffic_fines`, while insurance policies are stored in `flt_vehicle_insurances`.

3. **Investors:** if you adopt the “rolling stock” model, add `inv_investors` and `inv_vehicle_investors` to associate vehicles with investors and calculate their share of revenue.

### Step 5: SaaS billing, CRM, support and HR

1. **SaaS billing:** create `bil_billing_plans` (subscription plans), `bil_tenant_subscriptions` (tenant subscriptions), `bil_tenant_usage_metrics` (usage metrics), `bil_tenant_invoices` and `bil_tenant_invoice_lines` (monthly billing), and `bil_payment_methods` to store Stripe/Paddle tokens. These tables allow you to bill tenants based on the number of drivers, vehicles and trips.

2. **CRM:** set up `crm_leads`, `crm_opportunities` and `crm_contracts` to manage prospects, sales opportunities and signed contracts.

   Implement the **complete lead management process** as discussed:
   - **Lead capture** via the public `/request-demo` page: the visitor enters their details (name, email, phone, company, country, message). Data is stored in `crm_leads` (or `sys_demo_lead` if you keep the historic table) with an initial status of `new`. Use the `metadata` and `notes` fields to record contextual information (fleet size, pain points, etc.).

   - **Commercial qualification:** super‑admins review `crm_leads` in a provider backoffice, contact the prospect, assess interest and collect supporting documents (Kbis, licence, etc.). Documents are stored in `doc_documents` with `entity_type='lead'`. The lead status changes to `qualified` once all info is collected.

   - **Company KYC invitation:** once qualified, the super‑admin creates a record in `adm_invitations` with `tenant_id=null`, role `kyc`, the prospect’s email and a signed token. An email is sent via Resend with a link to a KYC form where the prospect fills in all company information and uploads documents. This information is stored in `crm_leads` and `doc_documents`.

   - **Information validation:** the internal team checks the documents and KYC info. If compliant, they create the organisation in `adm_tenants` and activate it in Clerk (assigning a `clerk_organization_id`). The lead status becomes `converted` and a new `adm_invitations` record (role `admin`) is created to invite the client’s first administrator.

   - **Client onboarding:** the invitee clicks the signed link and lands on the `register` page. The form displays the company name (read‑only) and allows the user to set up an account (password or OAuth). Once the account is created, the invitation status becomes `used` and a record in `adm_members` linked to the `tenant_id` is created. Simple users are managed by the client admin via an internal invitation form (creating `adm_invitations` with role `user`). Requests for a second admin go through a support ticket; the super‑admin sends an invitation with role `admin`.

   This workflow reflects SaaS best practices: organisations are always created by the vendor; the client admin cannot create or modify the company name; access is strictly limited to the organisation tied to the invitation. The `adm_invitations` table ensures traceability and security for each link.

3. **Support:** create `sup_tickets`, `sup_ticket_messages` and `sup_customer_feedback`. Connect these tables to the external help desk (Chatwoot or FreeScout) and synchronise statuses via webhooks.

4. **Human resources:** add `hr_candidates` and `hr_onboarding_stages` to manage driver recruitment (applications, document checks, training stages).

### Step 6: Application development and integrations

1. **Prisma migrations:** for each step above, update `schema.prisma`, generate migrations (`prisma migrate dev`) and verify that the tables are created correctly.
2. **Data seeding:** prepare a `prisma/seed.ts` script to insert reference data (country regulations, vehicle classes, insurance types), default roles and some test records.
3. **APIs and services:** develop the routes (REST or GraphQL) for each domain (adm, dir, flt, rid, etc.), respecting separation of concerns. Implement access controls with Clerk and audit middleware. Schedule background jobs (cron or Supabase Functions) to compute driver performance and generate invoices.
4. **User interface:** create the corresponding Next.js pages (tenant dashboard, Fleet, Drivers, Scheduling, Finance, SaaS billing, CRM, Support modules). Use `react-i18next` for internationalisation (English/French), Tailwind for styling and Radix UI for components.
5. **External integrations:** plug in the Uber/Bolt APIs to import trips, Stripe/Paddle for payments, Traccar for geolocation and Chatwoot/FreeScout for support. Store API keys in environment variables and secure your webhooks.

### Step 7: Testing, compliance and decommissioning old tables

1. **Unit and E2E tests:** write tests with Vitest and Playwright to validate services (payroll calculation, invoice generation, RLS) and the user interface. Configure a CI/CD pipeline to run these tests on every commit.
2. **Legal checks:** ensure that local constraints are respected: professional VTC card mandatory in France, visa and Emirates ID in the UAE, minimum fares (9 € per trip, 1 €/km, 30 €/hour)【407970352218538†L268-L280】, correct VAT (5 % vs 20 %), WPS compliance for payroll. Set up alerts for document and contract expirations.
3. **Decommission obsolete tables:** once all new tables are in production and no code references the old tables, drop the obsolete tables through a migration. Keep data exports if necessary.

## 4. Expected deliverables

By following this plan, Claude code will deliver:

1. **A complete Prisma schema** covering the 55 tables listed above, with relations, foreign keys and correctly typed `JSONB` columns.
2. **Migration scripts** to create the new tables and, where necessary, drop obsolete ones.
3. **A seed script** to populate reference data and create test datasets.
4. **API/Service modules** per domain, including validations (Zod), error handling and audit logging.
5. **User interface**: Next.js pages and components for each module, localised in English and French.
6. **Updated `.env` files and documentation** with the required keys and explanations for deploying the application on Vercel.

---

By following this sequenced plan, you will have a comprehensive foundation for relaunching Fleetcore under good conditions, adhering to the exhaustive specifications and local constraints while maintaining a coherent, scalable data structure.
