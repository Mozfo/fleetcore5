# Fleetcore – SaaS Provider Management Tables

**Date:** 7 October 2025  
**Scope:** This document extends Fleetcore’s data model with tables needed to operate the platform from the SaaS provider’s perspective. These tables support tenant lifecycle management, activity monitoring, technical support, and commercial operations.

## 1 Principles from SaaS support best practices

A good SaaS operation requires more than just product functionality. Customer support and commercial teams need tools to handle communication, track customer health and drive revenue. A recent guide on SaaS customer support advises to **prioritize communication channels** rather than offering every possible channel【535592711015414†L427-L436】, **be proactive** by warning customers of issues before they occur【535592711015414†L440-L448】, use **customer feedback** to improve services【535592711015414†L455-L460】, leverage **conversation history** to provide faster responses【535592711015414†L466-L475】, **monitor progress** using measurable metrics【535592711015414†L482-L504】, and **integrate support across functions** so feedback influences product, marketing and sales【535592711015414†L510-L525】. These practices inform how we structure our data tables.

## 2 Tenant lifecycle management

### 2.1 Tenant creation and administration

- **Tenant** – the existing `Tenant` table records each organisation’s name, country, currency, timezone and creation date. To support provider‑side administration, add:

  | Field        | Type      | Description                                                               |
  | ------------ | --------- | ------------------------------------------------------------------------- |
  | `created_by` | UUID (FK) | Clerk user ID of the provider employee who created the tenant.            |
  | `status`     | Enum      | `active`, `trial`, `suspended`, `closed` – indicates the lifecycle state. |
  | `notes`      | Text      | Internal remarks on tenant history.                                       |

  These additions allow provider staff to track who created the tenant and its current state.

- **TenantLifecycleEvent** – captures significant events in a tenant’s lifecycle (creation, suspension, reactivation, plan change).

  | Field           | Type      | Description                                                      |
  | --------------- | --------- | ---------------------------------------------------------------- |
  | `id`            | UUID (PK) | Event ID.                                                        |
  | `tenant_id`     | UUID (FK) | Tenant concerned.                                                |
  | `event_type`    | Enum      | `created`, `plan_changed`, `suspended`, `reactivated`, `closed`. |
  | `actor_user_id` | UUID (FK) | Clerk user ID of the provider staff performing the action.       |
  | `details`       | JSON      | Additional context (e.g., old/new plan).                         |
  | `timestamp`     | Timestamp | Event time.                                                      |

### 2.2 Account management

- **ProviderEmployee** – stores information about SaaS provider staff (sales, support, account managers). These are flagged as `is_provider_admin` in `AuthUser`/Clerk and hold business metadata.

  | Field           | Type      | Description                                      |
  | --------------- | --------- | ------------------------------------------------ |
  | `id`            | UUID (PK) | Employee ID.                                     |
  | `clerk_user_id` | UUID (FK) | Corresponding Clerk user.                        |
  | `department`    | Enum      | `sales`, `support`, `product`, `marketing`, etc. |
  | `title`         | Text      | Job title (Account Manager, Support Agent).      |
  | `created_at`    | Timestamp | Added date.                                      |
  | `updated_at`    | Timestamp | Last update.                                     |

- **TenantAccountManager** – links a provider employee to a tenant and defines the account management relationship.

  | Field         | Type      | Description                                                     |
  | ------------- | --------- | --------------------------------------------------------------- |
  | `id`          | UUID (PK) | Relationship ID.                                                |
  | `tenant_id`   | UUID (FK) | Tenant.                                                         |
  | `employee_id` | UUID (FK) | ProviderEmployee (account manager).                             |
  | `role`        | Enum      | `owner`, `coordinator`, `technical_contact`, `billing_contact`. |
  | `start_date`  | Date      | When the relationship began.                                    |
  | `end_date`    | Date      | End date (nullable if active).                                  |

## 3 Activity monitoring

While the `AuditLog` captures fine‑grained changes, provider teams may need summarised activity metrics:

- **TenantActivityMetric** – aggregates key engagement metrics for each tenant on a daily or weekly basis.

  | Field              | Type      | Description                                                        |
  | ------------------ | --------- | ------------------------------------------------------------------ |
  | `id`               | UUID (PK) | Record ID.                                                         |
  | `tenant_id`        | UUID (FK) | Tenant.                                                            |
  | `period_start`     | Date      | Start date of the period.                                          |
  | `period_end`       | Date      | End date.                                                          |
  | `active_users`     | Integer   | Number of unique users who logged in during the period.            |
  | `driver_count`     | Integer   | Number of active drivers.                                          |
  | `vehicle_count`    | Integer   | Number of active vehicles.                                         |
  | `trip_count`       | Integer   | Trips completed during the period.                                 |
  | `support_tickets`  | Integer   | Number of support tickets created.                                 |
  | `churn_risk_score` | Decimal   | Score indicating potential churn (calculated from usage patterns). |

- **TenantActivityEvent** – optional table capturing notable actions (e.g., integration failures, unusual spikes) for real‑time alerts.

## 4 Support management

Based on support best practices like using ticket histories to inform messaging and monitoring progress【535592711015414†L466-L475】【535592711015414†L482-L505】, we propose the following tables:

- **SupportTicket** – centralises all customer inquiries (technical or commercial). Each ticket may have multiple messages attached and can be assigned to a provider employee.

  | Field          | Type      | Description                                                                 |
  | -------------- | --------- | --------------------------------------------------------------------------- |
  | `id`           | UUID (PK) | Ticket ID.                                                                  |
  | `tenant_id`    | UUID (FK) | Tenant raising the ticket.                                                  |
  | `submitted_by` | UUID (FK) | Clerk user ID of the requester (can be a tenant user or provider employee). |
  | `subject`      | Text      | Short description of the issue.                                             |
  | `category`     | Enum      | `technical`, `billing`, `training`, `feature_request`, `commercial`.        |
  | `priority`     | Enum      | `low`, `medium`, `high`, `urgent`.                                          |
  | `status`       | Enum      | `open`, `in_progress`, `awaiting_customer`, `resolved`, `closed`.           |
  | `assigned_to`  | UUID (FK) | ProviderEmployee handling the ticket.                                       |
  | `created_at`   | Timestamp | Creation time.                                                              |
  | `updated_at`   | Timestamp | Last update.                                                                |
  | `closed_at`    | Timestamp | Closure time.                                                               |

- **TicketMessage** – stores the threaded conversation of a ticket. Messages can originate from the tenant or the support agent.

  | Field            | Type      | Description                  |
  | ---------------- | --------- | ---------------------------- |
  | `id`             | UUID (PK) | Message ID.                  |
  | `ticket_id`      | UUID (FK) | Associated SupportTicket.    |
  | `sender_user_id` | UUID (FK) | Clerk user ID of the sender. |
  | `message`        | Text      | Body of the message.         |
  | `created_at`     | Timestamp | When message was posted.     |

- **CustomerFeedback** – collects feedback after ticket resolution or periodically to inform continuous improvement【535592711015414†L455-L460】【535592711015414†L482-L505】.

  | Field        | Type      | Description                                     |
  | ------------ | --------- | ----------------------------------------------- |
  | `id`         | UUID (PK) | Feedback ID.                                    |
  | `ticket_id`  | UUID (FK) | Ticket associated with the feedback (nullable). |
  | `tenant_id`  | UUID (FK) | Tenant providing feedback.                      |
  | `rating`     | Integer   | Satisfaction score (e.g., 1–5).                 |
  | `comment`    | Text      | Open‑ended feedback.                            |
  | `created_at` | Timestamp | Feedback date.                                  |

These tables support a ticketing system that records conversations, allows proactive monitoring and collects feedback to improve the service.

## 5 Commercial operations

Sales and account teams need to track potential opportunities and contract details:

- **SalesOpportunity** – manages the commercial pipeline for new or expanding tenants.

  | Field                | Type      | Description                                                                |
  | -------------------- | --------- | -------------------------------------------------------------------------- |
  | `id`                 | UUID (PK) | Opportunity ID.                                                            |
  | `lead_id`            | UUID (FK) | Associated lead (if opportunity arises from a lead).                       |
  | `tenant_id`          | UUID (FK) | Current tenant (for expansion/up‑sell).                                    |
  | `pipeline_stage`     | Enum      | `prospecting`, `qualified`, `proposal_sent`, `negotiation`, `won`, `lost`. |
  | `estimated_value`    | Decimal   | Potential annual value.                                                    |
  | `currency`           | Char(3)   | Currency.                                                                  |
  | `close_date`         | Date      | Expected closure date.                                                     |
  | `account_manager_id` | UUID (FK) | ProviderEmployee responsible.                                              |
  | `created_at`         | Timestamp | Creation date.                                                             |
  | `updated_at`         | Timestamp | Last update.                                                               |

- **Contract** – stores contract terms when a tenant subscribes or renews.

  | Field            | Type      | Description                                           |
  | ---------------- | --------- | ----------------------------------------------------- |
  | `id`             | UUID (PK) | Contract ID.                                          |
  | `tenant_id`      | UUID (FK) | Tenant.                                               |
  | `effective_date` | Date      | Start date.                                           |
  | `expiry_date`    | Date      | End date.                                             |
  | `plan_name`      | Text      | Plan (corresponding to TenantSubscription).           |
  | `terms`          | Text      | Legal terms or link to PDF.                           |
  | `status`         | Enum      | `active`, `expired`, `terminated`, `pending_renewal`. |
  | `created_at`     | Timestamp | Creation.                                             |
  | `updated_at`     | Timestamp | Last update.                                          |

These tables help commercial teams track opportunities, manage account relationships and capture contractual obligations.

## 6 Summary

Incorporating these SaaS provider tables extends Fleetcore’s data model beyond fleet operations into the realm of tenant lifecycle management, activity monitoring, technical support and commercial operations. The design follows customer support best practices – focusing on selected communication channels, proactive outreach, feedback loops, performance monitoring and cross‑functional integration【535592711015414†L427-L436】【535592711015414†L440-L448】【535592711015414†L510-L525】 – and lays the foundation for a robust provider‑side portal.
