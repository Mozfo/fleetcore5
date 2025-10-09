# Fleetcore – Naming Conventions & Module Prefixes

**Date:** 7 October 2025  
**Purpose:** This document defines naming conventions for Fleetcore’s database and code modules. Clear, consistent naming improves readability, maintainability and onboarding. The conventions are derived from industry best practices and should be applied across all new tables, fields and code files. A blog article on SQL naming reminds us that there is no universal standard; the key is to **choose a style and stick with it**【491524022416630†L64-L67】.

## 1 General Rules

1. **Table names in plural, snake_case** – Use lowercase names separated by underscores. Adopt a plural noun (`vehicles`, `driver_documents`) to represent a collection. This aligns with web‑framework norms and avoids reserved-word conflicts【491524022416630†L119-L124】.
2. **Columns in singular, snake_case** – Column names describe the attribute of a single row (`vehicle_id`, `payment_date`, `created_at`). Avoid abbreviations unless widely understood (`id`, `VAT`).
3. **Join tables** – For many‑to‑many relationships, compose the names of the two tables in plural, ordered alphabetically (`drivers_vehicles`, `roles_members`)【491524022416630†L121-L123】.
4. **Reference tables** – For lookup/reference data, use plural names (`countries`, `vehicle_classes`, `insurance_types`)【491524022416630†L119-L127】.
5. **Timestamps and metadata** – Include standard metadata columns on all business tables:
   - `id` (UUID primary key)
   - `tenant_id` (UUID foreign key) for multi‑tenant separation
   - `created_at`, `updated_at`, `deleted_at` (soft delete)
   - Additional audit fields if required (`created_by`, `updated_by`)
6. **Enum values** – Enumerations should be lowercase strings with underscores (`purchase`, `lease_return`, `on_trip`). Use meaningful names and document all possible values in your code.
7. **Consistent prefixes** – Prefix table names with a short domain code to quickly identify the owning module and avoid collisions.
8. **Documentation & enforcement** – Publish these rules in the engineering handbook and enforce them via code reviews or a schema linter. Consistency matters more than any individual choice【491524022416630†L64-L67】【491524022416630†L137-L141】.

## 2 Module Prefixes

Use the following prefixes for database tables and corresponding code modules. Each prefix reflects a functional domain:

|     Prefix | Domain / Module            | Example tables                                                                                                                                                  |
| ---------: | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`dir_`** | Directory & reference data | `dir_car_makes`, `dir_car_models`, `dir_platforms`                                                                                                              |
| **`flt_`** | Fleet / vehicles           | `flt_vehicles`, `flt_vehicle_maintenance`, `flt_vehicle_acquisitions`, `flt_vehicle_disposals`, `flt_vehicle_lifecycle_events`, `flt_vehicle_platform_statuses` |
| **`rid_`** | Drivers & assignments      | `rid_drivers`, `rid_driver_documents`, `rid_driver_performance`, `rid_driver_requests`, `rid_driver_blacklist`                                                  |
| **`fin_`** | Finance & accounting       | `fin_accounts`, `fin_transactions`, `fin_bonus_penalty_rules`                                                                                                   |
| **`trp_`** | Trips & bookings           | `trp_trips`, `trp_office_trip_bookings`, `trp_settlements`                                                                                                      |
| **`bil_`** | Billing & subscriptions    | `bil_subscriptions`, `bil_usage_metrics`, `bil_invoices`, `bil_payments`                                                                                        |
| **`crm_`** | CRM & commercial           | `crm_leads`, `crm_opportunities`, `crm_contracts`, `crm_contacts`                                                                                               |
| **`sup_`** | Support & tickets          | `sup_tickets`, `sup_ticket_messages`, `sup_customer_feedback`                                                                                                   |
| **`adm_`** | Administration & audit     | `adm_audit_logs`, `adm_integration_logs`, `adm_tenant_lifecycle_events`                                                                                         |
| **`inv_`** | Investors & ownership      | `inv_investors`, `inv_vehicle_investors`                                                                                                                        |

The prefix applies to both the table name in the database and the Prisma model name (CamelCase with prefix in uppercase, e.g. `FltVehicle`).

## 3 File & Code Naming

1. **Next.js routes and API** – Use descriptive folder names reflecting the module (e.g., `app/flt/vehicles/page.tsx`, `app/bil/subscriptions/api.ts`). Use `kebab-case` for URL paths and file names (`vehicle-list.tsx`, `driver-profile.tsx`).
2. **React components** – Component files should use PascalCase names that reflect their purpose (`VehicleTable.tsx`, `DriverForm.tsx`). Keep UI components in a `components/` directory under each domain.
3. **Prisma models** – Define models with singular CamelCase names (`FltVehicle`, `RidDriver`) and map them to the appropriate plural table via `@@map("flt_vehicles")`.
4. **Enums & constants** – Store shared enums or lookup constants in a central module (e.g., `constants/enums.ts`) and use the same values across backend and frontend.
5. **API parameters & DTOs** – Use `camelCase` for JSON payload keys (`firstName`, `vehicleId`), matching TypeScript conventions.

## 4 Examples

- **Fleet vehicles table**
  - Table: `flt_vehicles`
  - Model (Prisma): `model FltVehicle { … @@map("flt_vehicles") }`
  - Primary key: `id UUID`
  - Foreign key: `tenant_id`
  - Columns: `make_id`, `model_id`, `year`, `purchase_date`, `status`, `created_at`, etc.

- **Join table between drivers and vehicles**
  - Table: `rid_drivers_vehicles`
  - Purpose: track assignments of drivers to vehicles over time.

- **Support ticket messages**
  - Table: `sup_ticket_messages`
  - Columns: `ticket_id`, `sender_user_id`, `message`, `created_at`.

## 5 Governance

- **Documentation** – Keep this guide accessible to all developers. Update it whenever a new domain or pattern emerges.
- **Automation** – Implement a naming‑lint in CI/CD that validates new migrations against these conventions. Several open‑source tools can parse Prisma schema files and enforce naming rules.
- **Training** – Introduce the conventions during onboarding. Encourage reviewers to flag violations during code reviews.

## Conclusion

Adhering to these naming conventions ensures that Fleetcore’s growing codebase remains easy to navigate and maintain. Consistency is more valuable than any single naming rule【491524022416630†L64-L67】. By grouping tables and code by domain and following simple patterns (plural tables, singular columns, snake_case, domain prefixes), you enable fast identification of modules and reduce cognitive overhead for all team members.
