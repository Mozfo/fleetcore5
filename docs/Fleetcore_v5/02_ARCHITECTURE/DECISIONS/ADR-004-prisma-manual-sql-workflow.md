# ADR-004: Prisma Manual SQL Workflow

> **Status:** Accepted
> **Date:** August 2025
> **Decision Makers:** Engineering Team

---

## Context

FleetCore uses Prisma as the ORM for type-safe database access. Prisma offers several workflows for schema management:

1. **Prisma Migrate:** Generate and apply migrations from `schema.prisma` changes
2. **Prisma DB Push:** Push `schema.prisma` directly to database (development)
3. **Prisma DB Pull:** Introspect database and update `schema.prisma`

The team encountered significant issues with automated migration workflows when using Supabase:

- RLS policies and custom PostgreSQL features not captured by Prisma
- Schema drift between Prisma's model and Supabase's actual schema
- Migrations failing due to missing RLS policy handling
- `db push` overwriting carefully crafted indexes and constraints

---

## Decision

**We will use a manual SQL workflow: write SQL directly in Supabase, manually update `schema.prisma` to match, then run `prisma generate`. We will NEVER use `db push`, `db pull`, or `migrate` commands.**

### Rationale

1. **Full Control:** Supabase's SQL editor provides precise control over schema changes including RLS policies, triggers, and functions that Prisma doesn't model.

2. **No Drift:** By treating Supabase as the source of truth and manually syncing `schema.prisma`, there's no automated process that can cause drift.

3. **Safe Production:** Production database changes go through Supabase's migration system, not Prisma's, allowing for proper review and rollback.

4. **RLS Preservation:** Prisma commands can inadvertently drop or reset RLS policies. Manual SQL ensures policies remain intact.

---

## Consequences

### Positive

- **Reliability:** No automated tool modifying production database unexpectedly
- **Full PostgreSQL Features:** Use triggers, functions, RLS policies without worrying about Prisma support
- **Clear Responsibility:** Database schema owned by SQL migrations in Supabase
- **Consistent Types:** `schema.prisma` always reflects actual database structure

### Negative

- **Manual Synchronization:** Developers must keep `schema.prisma` in sync with database manually
- **Error-Prone:** Typos in manual `schema.prisma` updates cause type mismatches
- **Slower Iteration:** Adding a column requires SQL change + schema update + generate, not just schema change
- **Documentation Burden:** Workflow must be clearly documented to prevent misuse

### Mitigations

- **Pre-commit Hook Check:** TypeScript compilation catches schema mismatches
- **CI Validation:** Build fails if generated Prisma types don't compile
- **Team Training:** Workflow documented in onboarding materials
- **Code Review:** Schema changes require explicit verification of SQL + schema.prisma alignment

---

## Implementation

### Correct Workflow

```bash
# 1. Write SQL migration in Supabase SQL Editor
ALTER TABLE crm_leads ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
CREATE INDEX idx_crm_leads_priority ON crm_leads(priority);

# 2. Manually update schema.prisma
model crm_leads {
  // ... existing fields
  priority String? @default("normal")
  // Note: Index defined in database, not in schema.prisma
}

# 3. Regenerate Prisma Client
pnpm prisma generate
```

### Forbidden Commands

| Command                 | Why Forbidden                                     |
| ----------------------- | ------------------------------------------------- |
| `prisma db push`        | Overwrites database schema, drops RLS policies    |
| `prisma db pull`        | Can corrupt schema.prisma with incorrect mappings |
| `prisma migrate dev`    | Creates migrations that don't account for RLS     |
| `prisma migrate deploy` | Applies Prisma migrations to production           |

### Verification

After any schema change, verify:

```bash
# Types compile correctly
pnpm typecheck

# Application starts without Prisma errors
pnpm dev

# Queries return expected results
# (manual testing in development)
```

---

## Related

This workflow was adopted after incidents where `db push` dropped RLS policies in staging, temporarily exposing data across tenants until policies were restored.

---

_See also: [ADR-002: PostgreSQL Row-Level Security](./ADR-002-postgresql-rls.md)_
