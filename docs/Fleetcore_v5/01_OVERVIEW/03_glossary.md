# Glossary

> **Document Type:** Reference
> **Version:** 1.0
> **Last Updated:** December 2025

---

## Business Terms

| Term               | Definition                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **ARR**            | Annual Recurring Revenue. Total yearly revenue from subscription contracts, excluding one-time fees.                        |
| **Fleet Operator** | A business entity that owns and manages multiple vehicles for ride-hailing platforms. May operate 10 to 500+ vehicles.      |
| **Lead**           | A potential customer who has expressed interest in FleetCore services. Captured through demo requests, forms, or referrals. |
| **MQL**            | Marketing Qualified Lead. A lead that has met minimum engagement criteria and is ready for sales outreach.                  |
| **SQL**            | Sales Qualified Lead. A lead that has been vetted by sales and confirmed as a genuine opportunity.                          |
| **Opportunity**    | A qualified lead with defined value, timeline, and probability of closing. Tracked through pipeline stages.                 |
| **Quote**          | A formal price proposal sent to a prospect, specifying services, pricing, and terms.                                        |
| **Order**          | A confirmed commercial agreement from a won opportunity. Triggers fulfillment and billing processes.                        |
| **Agreement**      | A signed contract document (MSA, SLA, NDA) associated with an order.                                                        |
| **Churn**          | Customer cancellation rate, typically measured monthly or annually.                                                         |
| **LTV**            | Lifetime Value. Total expected revenue from a customer over their entire relationship with FleetCore.                       |
| **CAC**            | Customer Acquisition Cost. Total sales and marketing spend divided by number of customers acquired.                         |
| **NRR**            | Net Revenue Retention. Measures revenue growth from existing customers including expansion and churn.                       |

---

## Technical Terms

| Term            | Definition                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| **API**         | Application Programming Interface. HTTP endpoints that external systems use to interact with FleetCore.  |
| **App Router**  | Next.js 13+ routing system using file-system based routing in the `app/` directory.                      |
| **Clerk**       | Third-party authentication provider handling user login, SSO, and organization management.               |
| **CRON**        | Scheduled background jobs that run at specified intervals (e.g., lead degradation, renewal checks).      |
| **DTO**         | Data Transfer Object. Typed structures for data passed between layers (API → Service → Repository).      |
| **i18n**        | Internationalization. System supporting multiple languages (currently English and French).               |
| **JSONB**       | PostgreSQL binary JSON column type. Used for flexible configuration storage (zero-hardcoding principle). |
| **JWT**         | JSON Web Token. Secure token format used for API authentication.                                         |
| **ORM**         | Object-Relational Mapping. Prisma translates TypeScript code to SQL queries.                             |
| **Prisma**      | TypeScript ORM providing type-safe database access and migration management.                             |
| **RLS**         | Row-Level Security. PostgreSQL feature enforcing data access rules at the database level.                |
| **Resend**      | Email delivery service used for transactional emails (confirmations, notifications).                     |
| **REST**        | Representational State Transfer. Architectural style for FleetCore's HTTP API design.                    |
| **SSR**         | Server-Side Rendering. Pages rendered on the server before sending to the browser.                       |
| **Supabase**    | Managed PostgreSQL hosting with built-in authentication and RLS support.                                 |
| **TailwindCSS** | Utility-first CSS framework used for FleetCore's user interface styling.                                 |
| **Turbopack**   | Next.js bundler providing fast development server hot-reload.                                            |
| **Vercel**      | Cloud platform hosting FleetCore's production deployment with automatic scaling.                         |
| **Webhook**     | HTTP callback triggered by external events (e.g., Clerk user creation, Resend delivery status).          |
| **Zod**         | TypeScript schema validation library used for API input validation.                                      |

---

## Architecture Terms

| Term                   | Definition                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| **BaseRepository**     | Abstract class providing standard CRUD operations inherited by all repositories.                           |
| **BaseService**        | Abstract class providing transaction handling, error mapping, and audit logging for services.              |
| **Multi-Tenant**       | Architecture where single application instance serves multiple isolated customer organizations.            |
| **Provider**           | A FleetCore division or licensed operator (e.g., FleetCore UAE, FleetCore France).                         |
| **Provider Isolation** | Data separation ensuring each provider sees only their own data. Enforced via `provider_id` column.        |
| **Soft Delete**        | Deletion pattern using `deleted_at` timestamp instead of physical row removal. Enables recovery and audit. |
| **Sort Whitelist**     | Predefined list of allowed sort fields preventing SQL injection through dynamic ORDER BY clauses.          |
| **System User**        | Special UUID (`00000000-0000-0000-0000-000000000001`) used for automated actions in audit logs.            |
| **Tenant**             | A customer organization within a provider. Has its own users, data, and configuration.                     |
| **Zero-Hardcoding**    | Principle requiring all business configuration stored in database JSONB, not application code.             |

---

## CRM Pipeline Terms

| Term                    | Definition                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **TOF**                 | Top of Funnel. Initial pipeline stage for new, unqualified leads.                                                     |
| **Lead Stage**          | Current position in qualification pipeline: `top_of_funnel`, `marketing_qualified`, `sales_qualified`, `opportunity`. |
| **Lead Status**         | Operational state: `new`, `contacted`, `working`, `qualified`, `disqualified`, `converted`, `lost`.                   |
| **Fit Score**           | Automated score (0-100) measuring how well a lead matches ideal customer profile.                                     |
| **Engagement Score**    | Automated score (0-100) measuring lead's interaction level with FleetCore content and team.                           |
| **Qualification Score** | Combined score determining lead priority. Formula: `(Fit Score × 0.6) + (Engagement Score × 0.4)`.                    |
| **Lead Priority**       | Calculated urgency: `critical`, `high`, `medium`, `low`. Drives SLA and assignment rules.                             |
| **SLA**                 | Service Level Agreement. Maximum time allowed for sales actions at each pipeline stage.                               |
| **Assignment Rules**    | Logic determining which sales representative receives a new lead based on geography, capacity, expertise.             |

---

## Quote-to-Cash Terms

| Term                   | Definition                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Quote Reference**    | Unique identifier format: `QT-YYYY-NNNNN` (e.g., QT-2025-00042).                                                          |
| **Order Reference**    | Unique identifier format: `ORD-YYYY-NNNNN` (e.g., ORD-2025-00015).                                                        |
| **Order Code**         | Short reference format: `O2025-NNN` for UI and communications.                                                            |
| **Fulfillment Status** | Order processing state: `pending`, `ready_for_fulfillment`, `in_progress`, `fulfilled`, `active`, `cancelled`, `expired`. |
| **Billing Cycle**      | Invoice frequency: `monthly`, `quarterly`, `semi_annual`, `annual`.                                                       |
| **Auto-Renew**         | Flag indicating order automatically renews at expiry unless cancelled.                                                    |
| **Notice Period**      | Days before expiry that cancellation must be received for non-renewal.                                                    |

---

## Database Prefixes

| Prefix    | Domain                           | Examples                                                     |
| --------- | -------------------------------- | ------------------------------------------------------------ |
| **adm\_** | Administration                   | `adm_tenants`, `adm_audit_logs`, `adm_notification_logs`     |
| **crm\_** | Customer Relationship Management | `crm_leads`, `crm_opportunities`, `crm_orders`, `crm_quotes` |
| **dir\_** | Directory/Reference              | `dir_notification_templates`, `dir_countries`                |
| **rid\_** | Ride Operations                  | `rid_drivers`, `rid_vehicles`, `rid_maintenance`             |
| **bil\_** | Billing                          | `bil_invoices`, `bil_payments` (planned)                     |

---

## Status Values Reference

### Lead Status

| Value          | Description                                   |
| -------------- | --------------------------------------------- |
| `new`          | Just created, no contact attempted            |
| `contacted`    | Initial outreach made                         |
| `working`      | Active engagement in progress                 |
| `qualified`    | Confirmed as valid opportunity                |
| `disqualified` | Determined not a fit                          |
| `converted`    | Successfully became customer                  |
| `lost`         | Opportunity lost to competitor or no decision |

### Opportunity Status

| Value       | Description                    |
| ----------- | ------------------------------ |
| `open`      | Active opportunity in pipeline |
| `won`       | Deal closed successfully       |
| `lost`      | Deal lost                      |
| `on_hold`   | Temporarily paused             |
| `cancelled` | Opportunity cancelled          |

### Opportunity Stage

| Value           | Description                                  |
| --------------- | -------------------------------------------- |
| `qualification` | Initial discovery and fit assessment         |
| `demo`          | Product demonstration scheduled or completed |
| `proposal`      | Quote sent, awaiting response                |
| `negotiation`   | Terms being finalized                        |
| `contract_sent` | Agreement sent for signature                 |

---

## Acronym Quick Reference

| Acronym | Expansion                             |
| ------- | ------------------------------------- |
| ADR     | Architecture Decision Record          |
| API     | Application Programming Interface     |
| ARR     | Annual Recurring Revenue              |
| CAC     | Customer Acquisition Cost             |
| CRM     | Customer Relationship Management      |
| DTO     | Data Transfer Object                  |
| JWT     | JSON Web Token                        |
| LTV     | Lifetime Value                        |
| MENA    | Middle East and North Africa          |
| MQL     | Marketing Qualified Lead              |
| NRR     | Net Revenue Retention                 |
| ORM     | Object-Relational Mapping             |
| RLS     | Row-Level Security                    |
| SaaS    | Software as a Service                 |
| SLA     | Service Level Agreement               |
| SQL     | Sales Qualified Lead (in CRM context) |
| SSO     | Single Sign-On                        |
| SSR     | Server-Side Rendering                 |
| TOF     | Top of Funnel                         |
| UAE     | United Arab Emirates                  |
| UUID    | Universally Unique Identifier         |

---

_Return to [00_INDEX.md](../00_INDEX.md) for documentation navigation._
