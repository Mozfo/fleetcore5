# Fleetcore – Holistic Security & Clerk Integration

**Date:** 7 October 2025  
**Context:** The Fleetcore platform uses **Clerk** as its identity and authorization provider. Clerk handles user accounts, authentication (including SSO and MFA) and roles. This document re‑examines Fleetcore’s data model through that lens, ensuring that it respects multi‑tenant best practices while avoiding duplication of Clerk’s functionality.

## 1 Principles & best practices

Across the research already undertaken, a few core principles recur:

- Strong identity management is essential. Multi‑tenant SaaS should integrate with enterprise SSO providers and enforce MFA【461206092833652†L168-L179】. WorkOS emphasises secure password hashing, SSO, email verification and MFA triggers【357516310406806†L90-L161】; using an external provider like Clerk offloads these responsibilities and brings compliant IAM out of the box.
- Tenant isolation requires that every domain model include a tenant identifier and that all operations be scoped by this ID【229134380627077†L274-L284】. The platform should never expose cross‑tenant data.
- Role‑based access control (RBAC) should be managed per tenant; memberships connect users to tenants and assign roles【229134380627077†L240-L267】. Permission assignments belong in the database, not hardcoded in code【357516310406806†L163-L191】.
- Monitoring, metering and audit logging remain critical even when using a third‑party auth service. Providers must monitor resource usage and record sensitive actions【461206092833652†L181-L187】【357516310406806†L462-L550】.

## 2 Clerk integration

Clerk’s **Organizations** feature already models the relationships between users, organizations and roles; it handles invitations, membership acceptance and revocation, as well as SSO and MFA enforcement. To avoid duplicating this logic, Fleetcore should:

1. **Use Clerk identifiers**:
   - Each Fleetcore tenant (organisation) stores its `clerk_organization_id` in the `Tenant` table.
   - Each user entity stores a `clerk_user_id` that references the user in Clerk. This applies to staff (`Member`), drivers, and candidates (as soon as they become authenticated). We do **not** store passwords or MFA secrets in Fleetcore; those remain in Clerk.

2. **Role mapping**:
   - Clerk allows defining roles within an organization (e.g., `fleet_manager`, `dispatcher`, `driver`). Fleetcore may still maintain a local `Role` table for domain‑specific permissions (analytics dashboards, financial modules, etc.), but should map local roles to Clerk roles via a field (`clerk_role_id`).
   - Authorization checks should trust Clerk’s JWT/session and decode its claims to obtain the user’s organization ID and roles.

3. **Membership representation**:
   - Instead of our previously proposed `AuthUser`/`Membership` tables, we keep a simplified `Member` table that stores business metadata (name, phone, language, user preferences) and the `clerk_user_id`. Clerk’s invitation and membership flows handle adding or revoking users from organisations.
   - The `MemberRole` table can remain to associate a member with one or more local roles, but the member’s ability to access the organisation is determined by Clerk.

4. **Audit logging & monitoring**:
   - Even though Clerk handles authentication, Fleetcore must record audit events when users perform sensitive actions (vehicle updates, financial changes). The existing `AuditLog` and `IntegrationLog` tables fulfil this requirement and align with best practices【357516310406806†L462-L550】.
   - Resource usage tracking (`TenantUsageMetric`), subscription management and CRM functions (`Lead`) remain unaffected by Clerk and continue to operate per tenant.

5. **Security & privacy**:
   - Because Clerk stores personal identifiers and authentication credentials, Fleetcore only stores the Clerk user ID and minimal PII required for operational purposes.
   - When a driver leaves the company or a user is removed from a tenant, the system should purge or anonymise the associated `Member` record, retaining only the necessary references for auditing, consistent with data protection requirements.【357516310406806†L462-L550】

## 3 Updated data model adjustments

With Clerk handling IAM, the following adjustments are recommended to our data model:

| Table                                                             | Key adjustments                                                                                                                               | Rationale                                                                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant**                                                        | Add `clerk_organization_id` (string)                                                                                                          | Links each tenant to its Clerk organization; used to validate that a user’s token belongs to the tenant.                                    |
| **Member**                                                        | Replace `email`, `password_hash`, `status` with `clerk_user_id` and keep business fields like `phone`, `language`, `first_name`, `last_name`. | Auth and email verification are done in Clerk; we store only the minimal metadata.                                                          |
| **Role** & **MemberRole**                                         | Add `clerk_role_id` to map local roles to Clerk roles. Keep or simplify `MemberRole` if multiple local roles per member are needed.           | Local permissions may differ from Clerk’s high‑level roles; mapping provides flexibility.                                                   |
| **AuthUser / Membership / LoginSession / UserMfa / LoginHistory** | **Remove** these tables.                                                                                                                      | Clerk manages user sessions, MFA devices and login history. Fleetcore should consume Clerk’s webhooks or API for relevant events if needed. |
| **ApiKey**                                                        | Retain, but scope keys to tenants and service accounts; keys should be created by an authenticated Clerk user with appropriate role.          |
| **AuditLog, IntegrationLog**                                      | These tables continue to record application events not covered by Clerk and do not require any change.                                        |
| **Lead, TenantSubscription, TenantUsageMetric**                   | These provider‑level tables operate independently of the auth provider and remain as previously defined.                                      |

## 4 Conclusion

By delegating authentication, user management and organisation membership to Clerk, Fleetcore can focus on its core domain logic while adhering to industry‑standard best practices. Clerk provides SSO, MFA and invitation flows that align with the recommended IAM patterns【461206092833652†L168-L179】, and its organizations feature implements the membership model advocated by FlightControl【229134380627077†L240-L267】. Fleetcore needs to store only the Clerk IDs and the domain‑specific metadata, ensuring tenant isolation【229134380627077†L274-L284】, monitoring and metering【461206092833652†L181-L187】, and robust audit logging【357516310406806†L462-L550】. This holistic integration reduces duplication, simplifies security, and prepares Fleetcore for scalable, compliant multi‑tenant operations.
