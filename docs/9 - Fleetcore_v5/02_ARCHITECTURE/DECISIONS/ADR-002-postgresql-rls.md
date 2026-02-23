# ADR-002: PostgreSQL Row-Level Security

> **Status:** Accepted
> **Date:** June 2025
> **Decision Makers:** Engineering Team

---

## Context

FleetCore is a multi-tenant SaaS platform where data isolation between tenants is critical. A bug in application code that bypasses tenant filtering could expose one customer's data to another, creating both security and compliance violations.

The team needed to decide between application-level filtering (WHERE clauses in every query) and database-level enforcement (Row-Level Security policies).

### Options Evaluated

1. **Application-Level Filtering Only:** Add `tenant_id` or `provider_id` to every query. Simpler to implement but relies entirely on developer discipline.

2. **Separate Databases per Tenant:** Physical isolation eliminates cross-tenant queries but increases operational complexity and costs.

3. **PostgreSQL Row-Level Security:** Database enforces filtering policies regardless of application code. Defense in depth.

---

## Decision

**We will implement Row-Level Security (RLS) policies in PostgreSQL as a defense-in-depth layer for tenant isolation.**

### Rationale

1. **Defense in Depth:** Even if application code contains a bug that omits tenant filtering, RLS policies prevent data leakage. The database becomes the last line of defense.

2. **Single Source of Truth:** Policies defined once in the database apply to all queries, including those from Prisma, direct SQL, or any future tool.

3. **Supabase Integration:** Supabase provides a dashboard for managing RLS policies, reducing the learning curve and operational burden.

4. **Compliance Documentation:** RLS policies provide auditable evidence of data isolation for SOC2 and GDPR compliance.

---

## Consequences

### Positive

- **Security:** Application bugs cannot leak data across tenants. Security does not depend solely on developer vigilance.
- **Simplicity:** Application code does not need defensive programming around tenant isolation; RLS handles it.
- **Auditability:** Policies are defined in SQL, versioned with migrations, and auditable.
- **Universal Enforcement:** Applies to all database access methods, not just application queries.

### Negative

- **Complexity:** Developers must understand RLS to debug unexpected query results. Policies can have subtle interactions.
- **Performance:** RLS policies add overhead to every query. Complex policies can impact performance significantly.
- **Testing Difficulty:** Tests must set up proper session context or use service role to bypass RLS.
- **Migration Challenges:** Adding RLS to existing tables requires careful migration to avoid locking issues.

### Mitigations

- **Documentation:** RLS policies documented in schema comments and this ADR.
- **Testing Pattern:** Integration tests use Supabase service role with explicit tenant filters rather than relying on RLS.
- **Performance Monitoring:** Sentry tracks query latency; significant degradation triggers policy review.

---

## Implementation

### Policy Structure

RLS policies use PostgreSQL session variables set at connection time:

```sql
-- Set by application at connection start
SET app.current_provider_id = 'uuid-here';
SET app.current_tenant_id = 'uuid-here';
SET app.is_admin = 'false';

-- Example policy for CRM tables
CREATE POLICY "crm_leads_provider_isolation" ON crm_leads
  FOR ALL
  USING (
    provider_id = current_setting('app.current_provider_id')::uuid
    OR current_setting('app.is_admin')::boolean = true
  );

-- Example policy for operational tables
CREATE POLICY "flt_vehicles_tenant_isolation" ON flt_vehicles
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    OR current_setting('app.is_admin')::boolean = true
  );
```

### Session Variable Injection

Supabase connection pooler supports per-request session variables via custom headers, allowing the application to set context without persistent connections.

### Fallback to Application Filtering

Despite RLS, application code still includes explicit filters through `buildProviderFilter()` and `buildTenantFilter()`. This dual-layer approach means:

- If application filter fails, RLS catches it
- If RLS is misconfigured, application filter catches it

---

_See also: [ADR-003: Provider vs Tenant Isolation](./ADR-003-provider-tenant-isolation.md)_
