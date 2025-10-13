# RLS Baseline — Session Variables (PostgreSQL)

**Decision:** Keep `current_setting('app.current_tenant_id')` as the multi-tenant isolation mechanism. Clerk remains the IdP; middleware sets Postgres session GUCs on every request.

## Session GUCs to set

- `app.current_tenant_id` — UUID of tenant
- `app.current_member_id` — UUID of adm_members (or NULL for system jobs)
- `app.role` — `provider_employee` | `tenant_admin` | `tenant_member` | `system_job`

## Example (Supabase / PostgREST)

```sql
-- At connection/request start
select set_config('app.current_tenant_id', :tenant_id, true);
select set_config('app.current_member_id', :member_id, true);
select set_config('app.role', :role, true);
```

## Policy template (row-level)

```sql
-- Read
create policy rls_{table_name}_read on {schema}.{table_name}
as permissive for select
to authenticated
using (
  coalesce({schema}.{table_name}.tenant_id::text, current_setting('app.current_tenant_id', true)) = current_setting('app.current_tenant_id', true)
);

-- Write (example)
create policy rls_{table_name}_write on {schema}.{table_name}
as permissive for insert
to authenticated
with check (
  {schema}.{table_name}.tenant_id::text = current_setting('app.current_tenant_id', true)
);
```

> **Note:** Tables without `tenant_id` (global directories like `dir_country_regulations`) should **not** compare tenant_id and must gate access by role (`app.role in (...)`) or be fully public read if approved.
