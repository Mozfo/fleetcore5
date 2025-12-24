# ADR-003: Provider vs Tenant Isolation

> **Status:** Accepted
> **Date:** July 2025
> **Decision Makers:** Engineering Team, Product

---

## Context

FleetCore's business model involves two distinct levels of multi-tenancy:

1. **FleetCore Regional Divisions:** FleetCore UAE, FleetCore France, and future markets operate as separate business units with their own sales teams and pipelines.

2. **Fleet Operators (Customers):** Each fleet operator using FleetCore for vehicle management is a separate customer whose data must be isolated.

The initial design used a single `tenant_id` for all isolation, but this created confusion about whether "tenant" meant FleetCore's divisions or FleetCore's customers.

---

## Decision

**We will use `provider_id` for CRM/pre-sale data isolation (FleetCore divisions) and `tenant_id` for operational/post-sale data isolation (fleet operator customers).**

### Rationale

1. **Semantic Clarity:** The term "provider" refers to FleetCore as a service provider with regional divisions. The term "tenant" refers to customers who "rent" the platform.

2. **Different Access Patterns:** CRM data (leads, opportunities) should be visible to FleetCore sales reps within their division. Operational data (vehicles, drivers) should be visible only to the specific fleet operator.

3. **Lifecycle Separation:** A lead has a `provider_id` from creation. It only gains a `tenant_id` after contract signature when the tenant record is created.

4. **Future Scalability:** If FleetCore licenses its platform to other companies (white-label), `provider_id` distinguishes between license holders while `tenant_id` distinguishes their customers.

---

## Consequences

### Positive

- **Clear Mental Model:** Developers know `provider_id` = FleetCore internal, `tenant_id` = customer.
- **Appropriate Isolation:** Sales reps see all leads in their market; fleet operators see only their vehicles.
- **Flexible Permissions:** CEO can access all providers (global view); regional manager sees only their provider.
- **Migration Path:** Converting leads to tenants is an explicit business process, not implicit data sharing.

### Negative

- **Two Isolation Systems:** Developers must understand when to use which isolation pattern.
- **Query Complexity:** Some reports need to join across provider and tenant boundaries with appropriate permissions.
- **Documentation Burden:** Every table's isolation model must be clearly documented.

### Mitigations

- **Naming Convention:** Tables prefixed with `crm_` use `provider_id`; tables prefixed with `flt_` or `rid_` use `tenant_id`.
- **Helper Functions:** `buildProviderFilter()` and `buildHybridProviderFilter()` centralize filter generation.
- **Code Review Focus:** PRs touching isolation logic require explicit verification of correct filter usage.

---

## Implementation

### Table Assignment

| Prefix | Isolation     | Use Case                                                               |
| ------ | ------------- | ---------------------------------------------------------------------- |
| `crm_` | `provider_id` | Leads, opportunities, activities, quotes                               |
| `adm_` | Mixed         | Tenants (by `provider_id`), employees (by `provider_id`), audit (both) |
| `flt_` | `tenant_id`   | Vehicles, maintenance, assignments                                     |
| `rid_` | `tenant_id`   | Drivers, trips, earnings                                               |
| `dir_` | None (global) | Countries, car makes/models (reference data)                           |

### Context Functions

```typescript
// lib/utils/provider-context.ts

// For CRM tables
export function buildProviderFilter(providerId: string | null) {
  if (providerId === null) return {}; // CEO sees all
  return { provider_id: providerId };
}

// For tables with is_system + provider_id (hybrid)
export function buildHybridProviderFilter(providerId: string | null) {
  if (providerId === null) return {};
  return {
    OR: [
      { is_system: true }, // System records visible to all
      { provider_id: providerId }, // Provider-specific records
    ],
  };
}
```

### Lead to Tenant Conversion

When a lead becomes a paying customer:

1. Create `adm_tenants` record with new `tenant_id`
2. Create Clerk organization with `public_metadata.tenantId`
3. Link opportunity to tenant via `tenant_id` field
4. User gains access to operational data through tenant membership

---

_See also: [ADR-002: PostgreSQL Row-Level Security](./ADR-002-postgresql-rls.md)_
