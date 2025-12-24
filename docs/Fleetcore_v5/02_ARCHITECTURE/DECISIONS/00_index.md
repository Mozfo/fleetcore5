# Architecture Decision Records

> **Document Type:** ADR Index
> **Last Updated:** December 2025

---

## What is an ADR?

Architecture Decision Records capture significant architectural decisions made during the development of FleetCore. Each ADR documents the context that led to a decision, the decision itself, and the consequences, both positive and negative, that result from it.

ADRs serve as institutional memory, helping future team members understand not just what was decided but why. They prevent relitigating settled decisions while providing clear documentation for when circumstances change enough to warrant revisiting a choice.

---

## ADR Format

Each ADR follows a consistent structure:

1. **Status:** Accepted, Superseded, or Deprecated
2. **Context:** The circumstances and constraints that led to this decision
3. **Decision:** The choice made and its rationale
4. **Consequences:** Trade-offs accepted, both positive and negative
5. **Implementation:** References to code implementing the decision

---

## Decision Log

| ADR                                                | Title                         | Status   | Date    |
| -------------------------------------------------- | ----------------------------- | -------- | ------- |
| [ADR-001](./ADR-001-clerk-authentication.md)       | Clerk for Authentication      | Accepted | 2025-06 |
| [ADR-002](./ADR-002-postgresql-rls.md)             | PostgreSQL Row-Level Security | Accepted | 2025-06 |
| [ADR-003](./ADR-003-provider-tenant-isolation.md)  | Provider vs Tenant Isolation  | Accepted | 2025-07 |
| [ADR-004](./ADR-004-prisma-manual-sql-workflow.md) | Prisma Manual SQL Workflow    | Accepted | 2025-08 |
| [ADR-005](./ADR-005-soft-delete-pattern.md)        | Soft Delete Pattern           | Accepted | 2025-08 |
| [ADR-006](./ADR-006-jsonb-configuration.md)        | JSONB Dynamic Configuration   | Accepted | 2025-09 |
| [ADR-007](./ADR-007-lead-scoring-algorithm.md)     | Lead Scoring Algorithm        | Accepted | 2025-10 |

---

## Conventions

**Naming:** Files are named `ADR-NNN-short-description.md` where NNN is a zero-padded sequence number.

**Immutability:** Once accepted, ADRs should not be modified except to add "Superseded by ADR-XXX" status. If circumstances change, create a new ADR that supersedes the old one.

**Scope:** ADRs document architectural decisions with system-wide impact. Local implementation choices do not require ADRs.

---

_Return to [Architecture Overview](../01_system_overview.md)_
