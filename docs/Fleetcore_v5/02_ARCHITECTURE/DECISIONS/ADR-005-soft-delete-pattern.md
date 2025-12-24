# ADR-005: Soft Delete Pattern

> **Status:** Accepted
> **Date:** August 2025
> **Decision Makers:** Engineering Team

---

## Context

FleetCore stores business-critical data including leads, opportunities, and customer relationships. Users occasionally need to "delete" records, but true deletion creates problems:

1. **Audit Trail Gaps:** Hard deletes leave holes in audit history
2. **Accidental Deletion:** No recovery path for mistaken deletions
3. **Referential Integrity:** Cascading deletes can remove dependent records unintentionally
4. **Compliance:** GDPR requires knowing what data existed, not just current state

The team needed a deletion strategy that balances user intent to remove data with operational and compliance requirements.

---

## Decision

**We will implement soft delete using `deleted_at`, `deleted_by`, and `deletion_reason` columns on all business entities. Hard delete is reserved for GDPR erasure requests with separate authorization.**

### Rationale

1. **Reversibility:** Soft deletes can be undone. Users can recover accidentally deleted leads within retention period.

2. **Audit Completeness:** Deleted records remain in database, preserving full history for compliance and debugging.

3. **Referential Integrity:** No cascading deletes. Related records remain but can filter by parent's deletion status.

4. **GDPR Compliance:** Soft delete != erasure. When GDPR "right to be forgotten" is invoked, a separate hard delete process runs with explicit authorization.

---

## Consequences

### Positive

- **Recovery:** Accidental deletions recoverable by administrators
- **Audit Trail:** Complete history of all data, including deleted records
- **Debugging:** Can reconstruct state at any point in time
- **Data Integrity:** No orphaned records from cascade deletes

### Negative

- **Storage Growth:** Deleted records consume storage indefinitely
- **Query Complexity:** Every query must filter `deleted_at IS NULL`
- **Index Overhead:** Indexes include deleted records unless partial indexes used
- **GDPR Complexity:** True erasure requires separate process

### Mitigations

- **Automatic Filtering:** `BaseRepository` includes `deleted_at` filter by default
- **Partial Indexes:** Critical indexes defined as `WHERE deleted_at IS NULL`
- **Archival Process:** Records soft-deleted > 2 years moved to archive tables
- **GDPR Workflow:** Documented process for hard delete with audit trail

---

## Implementation

### Schema Pattern

All soft-deletable tables include:

```sql
-- Schema columns
deleted_at   TIMESTAMP WITH TIME ZONE,
deleted_by   UUID REFERENCES adm_members(id),
deletion_reason TEXT

-- Partial index for queries (only index non-deleted)
CREATE INDEX idx_crm_leads_active ON crm_leads(created_at)
  WHERE deleted_at IS NULL;
```

### Repository Methods

```typescript
// lib/core/base.repository.ts

async softDelete(
  id: string,
  userId: string,
  reason?: string
): Promise<void> {
  await this.model.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: userId,
      deletion_reason: reason || "User requested deletion",
    },
  });
}

async restore(id: string, userId: string): Promise<T> {
  return await this.model.update({
    where: { id },
    data: {
      deleted_at: null,
      deleted_by: null,
      deletion_reason: null,
    },
  });
}
```

### Automatic Filtering

```typescript
// Default query behavior
async findMany(where: object): Promise<T[]> {
  return await this.model.findMany({
    where: {
      ...where,
      ...(this.shouldFilterDeleted() && { deleted_at: null }),
    },
  });
}

// Override for tables without soft-delete
protected shouldFilterDeleted(): boolean {
  return true; // Default: filter deleted records
}
```

### GDPR Hard Delete

When true erasure is required:

1. Legal/compliance team approves request
2. Admin runs hard delete script with explicit record ID
3. Audit log records: "GDPR erasure for record X by Y on date Z"
4. Record removed from all tables including audit logs
5. Confirmation sent to requester

---

_See also: [Architecture Principles: Principle 8](../03_architecture_principles.md#principle-8-soft-delete-pattern)_
