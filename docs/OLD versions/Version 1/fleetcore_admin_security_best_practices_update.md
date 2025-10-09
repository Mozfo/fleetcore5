# Fleetcore – Security & Provider Administration Update

**Date:** 7 October 2025  
**Scope:** This document assesses Fleetcore’s data model against industry best practices for multi‑tenant SaaS and proposes additional tables for security, user management and provider‑level administration. It draws on reputable sources (Frontegg, FlightControl and WorkOS) to validate compliance and enrich the model.

## 1 Best‑practice research

Multi‑tenant SaaS applications must balance tenant isolation with ease of operation. The following practices are highlighted in recent industry literature:

- **Identity and access management (IAM)** – A multi‑tenant platform should incorporate strong authentication, authorization and auditing. Frontegg notes that IAM controls access to resources and should integrate **single sign‑on (SSO)** and **multi‑factor authentication (MFA)** to prevent unauthorized access【461206092833652†L168-L179】. WorkOS similarly emphasises SSO via SAML/OIDC, secure password hashing, email verification and MFA triggers for high‑risk actions【357516310406806†L90-L161】.
- **Tenant isolation & data partitioning** – Every model must include a tenant identifier to ensure data segregation. FlightControl’s guide recommends adding `organization_id` (tenant ID) to every table except the global user model and scoping all queries by this key【229134380627077†L274-L284】. It also suggests using a **Membership** table to link users and organizations and storing a `role` on each membership for role‑based access control (RBAC)【229134380627077†L240-L267】.
- **Invitation and revocation flows** – Inviting users to an organization involves creating a **Membership** with an invitation token and null `user_id`; revocation sets `user_id` to `null` or deletes the membership【229134380627077†L492-L537】. The membership’s `role` property underpins RBAC【229134380627077†L539-L552】.
- **Monitoring, metering and analytics** – Providers should monitor and meter resource usage for each tenant to manage capacity and billing. Frontegg states that monitoring tracks system performance while metering records resource consumption, enabling accurate billing and capacity management【461206092833652†L181-L187】.
- **Audit logging and compliance** – Enterprise customers expect tamper‑evident audit logs that record authentication events, permission changes and sensitive data access【357516310406806†L462-L550】. Logs should capture timestamp, actor, target resource, action and metadata and be immutable and exportable for compliance audits【357516310406806†L462-L550】.
- **RBAC and resource‑level permissions** – WorkOS recommends implementing RBAC with roles tied to an organization and storing role assignments in the database【357516310406806†L163-L191】. Fine‑grained access can be achieved by mapping roles to resources via a separate permissions table【357516310406806†L192-L213】.

## 2 Compliance of the current model

Fleetcore’s current model already incorporates several best practices:

- **Tenant isolation:** Every table contains a `tenant_id`, ensuring that data remains scoped to its organisation as FlightControl recommends【229134380627077†L274-L284】.
- **RBAC:** User roles are stored in a separate `Role` table and linked to members via `MemberRole`. This aligns with WorkOS’s suggestion to store role assignments in the database【357516310406806†L163-L191】.
- **Audit logging:** An `AuditLog` table records key actions with actor, entity and timestamp; this satisfies the need for immutable logs【357516310406806†L462-L550】.
- **Integration log & compliance tables:** Tables like `CountryRegulation`, `VehicleClass`, `TollGate`, `TrafficFine` and `InsuranceType` enable local regulatory compliance.

However, to fully adhere to the researched best practices and address the provider’s needs, additional **security** and **provider‑administration** features are required.

## 3 Proposed new tables and modifications

### 3.1 Global user & membership model

To support cross‑tenant access and invitations, introduce two global tables:

- **`AuthUser`** – represents a person in the system regardless of organisation. Each row stores credentials and global preferences. Tenants reference `AuthUser` via the membership table rather than duplicating user records.

  | Field               | Type      | Description                                           |
  | ------------------- | --------- | ----------------------------------------------------- |
  | `id`                | UUID (PK) | Globally unique user ID.                              |
  | `email`             | Text      | Unique email address; verified via token.             |
  | `password_hash`     | Text      | Hashed password (bcrypt/argon2).                      |
  | `name`              | Text      | Display name.                                         |
  | `language`          | Char(2)   | Default UI language.                                  |
  | `is_provider_admin` | Boolean   | True if the user is an employee of the SaaS provider. |
  | `status`            | Enum      | `active`, `inactive`, `pending`, `locked`.            |
  | `last_login_at`     | Timestamp | Last login time.                                      |
  | `created_at`        | Timestamp | Creation timestamp.                                   |
  | `updated_at`        | Timestamp | Last update.                                          |

- **`Membership`** – follows the FlightControl model【229134380627077†L240-L267】. It links an `AuthUser` to a `Tenant` and holds invitation metadata and role.

  | Field           | Type      | Description                                   |
  | --------------- | --------- | --------------------------------------------- |
  | `id`            | UUID (PK) | Membership ID.                                |
  | `tenant_id`     | UUID (FK) | Organisation this membership belongs to.      |
  | `auth_user_id`  | UUID (FK) | User ID (nullable until invitation accepted). |
  | `role_id`       | UUID (FK) | Assigned role.                                |
  | `invitation_id` | UUID      | Invitation token for pending users.           |
  | `invited_email` | Text      | Email used to invite user.                    |
  | `invited_at`    | Timestamp | When invitation was sent.                     |
  | `expires_at`    | Timestamp | Invitation expiry.                            |
  | `status`        | Enum      | `pending`, `active`, `revoked`.               |
  | `created_at`    | Timestamp | Created.                                      |
  | `updated_at`    | Timestamp | Updated.                                      |

Existing `Member` and `MemberRole` tables can be deprecated in favour of `AuthUser` and `Membership`, reducing duplication and enabling users to belong to multiple tenants. The `Role` table remains as is.

### 3.2 Authentication & security tables

Implement additional tables to support secure IAM as per the WorkOS guide【357516310406806†L90-L161】:

- **`LoginSession`** – tracks active sessions for security and audit. Each entry stores session tokens (access/refresh), IP address, device, expiry time and associated membership.

  | Field           | Type      | Description                          |
  | --------------- | --------- | ------------------------------------ |
  | `id`            | UUID (PK) | Session ID.                          |
  | `auth_user_id`  | UUID (FK) | User owning the session.             |
  | `membership_id` | UUID (FK) | Membership context for this session. |
  | `access_token`  | Text      | JWT or opaque token.                 |
  | `refresh_token` | Text      | Refresh token.                       |
  | `ip_address`    | Text      | IP from which login occurred.        |
  | `user_agent`    | Text      | Browser/OS information.              |
  | `created_at`    | Timestamp | Session creation.                    |
  | `expires_at`    | Timestamp | Expiry timestamp.                    |
  | `revoked_at`    | Timestamp | When session was revoked.            |

- **`UserMfa`** – registers a user’s MFA factors (e.g., TOTP secret, WebAuthn credential) to enforce MFA【357516310406806†L148-L161】.

  | Field          | Type      | Description                        |
  | -------------- | --------- | ---------------------------------- |
  | `id`           | UUID (PK) | Record ID.                         |
  | `auth_user_id` | UUID (FK) | User.                              |
  | `factor_type`  | Enum      | `totp`, `webauthn`, `backup_code`. |
  | `factor_data`  | Text      | Encrypted secret or credential ID. |
  | `verified_at`  | Timestamp | When factor was verified.          |
  | `created_at`   | Timestamp | Creation.                          |

- **`ApiKey`** – stores API keys issued to tenants or service accounts for integrations, with scopes and expiry.

  | Field          | Type      | Description                                                            |
  | -------------- | --------- | ---------------------------------------------------------------------- |
  | `id`           | UUID (PK) | Key ID.                                                                |
  | `tenant_id`    | UUID (FK) | Organisation this key is scoped to (nullable for provider‑level keys). |
  | `auth_user_id` | UUID (FK) | User who created the key.                                              |
  | `name`         | Text      | Friendly name.                                                         |
  | `token_hash`   | Text      | Hashed API token (store only hash).                                    |
  | `scopes`       | Text      | Comma‑separated or JSON list of permissions.                           |
  | `expires_at`   | Timestamp | Expiry date.                                                           |
  | `created_at`   | Timestamp | Creation.                                                              |
  | `revoked_at`   | Timestamp | Revocation time.                                                       |

- **`LoginHistory`** – logs every login attempt (success or failure), capturing timestamp, IP and outcome. This helps satisfy audit requirements【357516310406806†L462-L552】.

  | Field          | Type      | Description                           |
  | -------------- | --------- | ------------------------------------- |
  | `id`           | UUID (PK) | Event ID.                             |
  | `auth_user_id` | UUID (FK) | User.                                 |
  | `timestamp`    | Timestamp | Attempt time.                         |
  | `ip_address`   | Text      | IP address.                           |
  | `user_agent`   | Text      | User agent.                           |
  | `result`       | Enum      | `success`, `failure`, `mfa_required`. |
  | `method`       | Enum      | `password`, `sso`, `magic_link`.      |

These tables allow security features like session revocation, MFA enforcement and auditing of login activity.

### 3.3 Provider‑level administration

The SaaS provider needs to manage tenants, subscriptions, leads and usage metrics. The following tables support these functions:

- **`Lead`** – a simple CRM table to capture prospective tenants. Fields include company name, contact details, lead source and status.

  | Field          | Type      | Description                                                  |
  | -------------- | --------- | ------------------------------------------------------------ |
  | `id`           | UUID (PK) | Lead ID.                                                     |
  | `company_name` | Text      | Name of the prospective fleet operator.                      |
  | `contact_name` | Text      | Name of the contact person.                                  |
  | `email`        | Text      | Contact email.                                               |
  | `phone`        | Text      | Contact phone.                                               |
  | `country_code` | Char(2)   | Country of prospect.                                         |
  | `source`       | Text      | Where the lead originated (web form, referral, event).       |
  | `status`       | Enum      | `new`, `contacted`, `qualified`, `closed_lost`, `converted`. |
  | `notes`        | Text      | Additional remarks.                                          |
  | `created_at`   | Timestamp | Creation date.                                               |
  | `updated_at`   | Timestamp | Last update.                                                 |

- **`TenantSubscription`** – records the subscription plan for each tenant, enabling billing and feature gating.

  | Field               | Type      | Description                                   |
  | ------------------- | --------- | --------------------------------------------- |
  | `id`                | UUID (PK) | Subscription ID.                              |
  | `tenant_id`         | UUID (FK) | Organisation subscribed.                      |
  | `plan_name`         | Text      | Plan (trial, basic, pro, enterprise).         |
  | `seat_limit`        | Integer   | Maximum number of active memberships allowed. |
  | `start_date`        | Date      | Subscription start.                           |
  | `end_date`          | Date      | Subscription end.                             |
  | `status`            | Enum      | `active`, `trial`, `past_due`, `cancelled`.   |
  | `billing_frequency` | Enum      | `monthly`, `annual`.                          |
  | `price`             | Decimal   | Recurring cost in provider’s currency.        |
  | `currency`          | Char(3)   | Currency.                                     |
  | `created_at`        | Timestamp | Creation.                                     |
  | `updated_at`        | Timestamp | Last update.                                  |

- **`TenantUsageMetric`** – captures usage statistics for each tenant to support metering and billing【461206092833652†L181-L187】.

  | Field           | Type      | Description                      |
  | --------------- | --------- | -------------------------------- |
  | `id`            | UUID (PK) | Metric ID.                       |
  | `tenant_id`     | UUID (FK) | Organisation.                    |
  | `period_start`  | Date      | Start of the measurement period. |
  | `period_end`    | Date      | End of the measurement period.   |
  | `driver_count`  | Integer   | Number of active drivers.        |
  | `vehicle_count` | Integer   | Number of active vehicles.       |
  | `trip_count`    | Integer   | Number of completed trips.       |
  | `storage_bytes` | BigInt    | Disk/storage usage.              |
  | `api_calls`     | Integer   | Number of API requests.          |
  | `created_at`    | Timestamp | When record was created.         |

- **`ProviderSupportTicket`** (optional) – tracks support requests from tenants and their status. Useful for customer success teams.

  | Field         | Type      | Description                                  |
  | ------------- | --------- | -------------------------------------------- |
  | `id`          | UUID (PK) | Ticket ID.                                   |
  | `tenant_id`   | UUID (FK) | Tenant raising the ticket.                   |
  | `subject`     | Text      | Brief summary.                               |
  | `description` | Text      | Detailed description.                        |
  | `status`      | Enum      | `open`, `in_progress`, `resolved`, `closed`. |
  | `priority`    | Enum      | `low`, `medium`, `high`, `urgent`.           |
  | `created_at`  | Timestamp | Created.                                     |
  | `updated_at`  | Timestamp | Updated.                                     |

### 3.4 Other improvements and optimisation

- **Polymorphic document storage:** As previously suggested, unify `VehicleDocument`, `DriverDocument` and `DriverResidency` into a single `Document` table with `entity_type`, `entity_id`, `document_type`, `file_url`, `issue_date` and `expiry_date`. This reduces one‑to‑one tables and simplifies uploads.
- **Replace `DriverBalance` and `DriverDeduction`:** Model all financial events via the `Transaction` table; compute balances dynamically. Use views or materialised views for performance.
- **Roles & permissions:** Consolidate `Role` and `Permission` by using a JSON field on `Role` that lists allowed actions. Map roles to resource types for fine‑grained control as recommended by WorkOS【357516310406806†L163-L213】.
- **Indexing and partitioning:** Partition high‑volume tables (`Trip`, `Transaction`, `AuditLog`) by `tenant_id` and time period. Create composite indexes on (`tenant_id`, `date_time`) to optimize queries.

## 4 Summary and table count

With the additions above, Fleetcore’s model comprises approximately **50 tables** (depending on whether optional tables like `ProviderSupportTicket` are implemented). While the newly introduced tables expand the schema, the fundamental domains – fleet management, drivers, finance and operations – remain as previously defined. We replace `Member` and `MemberRole` with `AuthUser` and `Membership` and add new security and provider‑admin tables. These changes align Fleetcore with **best practices for multi‑tenant SaaS**: tenant isolation【229134380627077†L274-L284】, robust IAM with SSO/MFA【461206092833652†L168-L179】【357516310406806†L90-L161】, RBAC and invitation flows【229134380627077†L492-L537】【357516310406806†L163-L191】, monitoring and metering per tenant【461206092833652†L181-L187】, comprehensive audit logging【357516310406806†L462-L550】, and provider‑level administrative features (lead tracking, subscriptions, usage metrics).
