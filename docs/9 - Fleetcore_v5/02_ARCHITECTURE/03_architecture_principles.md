# Architecture Principles

> **Document Type:** Design Guidelines
> **Version:** 1.1
> **Last Updated:** December 2025

---

## Introduction

Architecture principles serve as the guiding philosophy behind technical decisions. They provide consistency when multiple valid approaches exist and help new team members understand why the codebase evolved in its particular direction. FleetCore adheres to ten core principles, each emerging from the specific challenges of building multi-tenant SaaS for the fleet management industry.

These principles are not abstract ideals but practical guidelines observable throughout the codebase. Each principle section explains the underlying problem, the chosen solution, and references to actual implementation code.

---

## Principle 1: Provider Isolation

### The Problem

FleetCore operates as a single platform serving multiple regional divisions, each with their own sales teams, leads, and operational territories. FleetCore UAE and FleetCore France share the same codebase and infrastructure but must not see each other's commercial data.

### The Solution

Every CRM table includes a `provider_id` column that links records to a specific provider division. The application layer enforces this isolation through a centralized context mechanism.

**Implementation:** `lib/utils/provider-context.ts`

```typescript
export async function getCurrentProviderId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const employee = await prisma.adm_provider_employees.findFirst({
    where: { clerk_user_id: userId, status: "active", deleted_at: null },
    select: { provider_id: true },
  });

  return employee?.provider_id ?? null;
}

export function buildProviderFilter(providerId: string | null) {
  if (providerId === null) return {}; // Global access (CEO role)
  return { provider_id: providerId };
}
```

### Provider vs Tenant: When to Use Which

| Isolation Level | Use Case                       | Column        | Tables                                               |
| --------------- | ------------------------------ | ------------- | ---------------------------------------------------- |
| **Provider**    | FleetCore internal divisions   | `provider_id` | crm_leads, crm_opportunities, adm_provider_employees |
| **Tenant**      | Customer (fleet operator) data | `tenant_id`   | flt_vehicles, rid_drivers, adm_tenants               |

**Provider Isolation (CRM):** Separates pre-sale data. Sales rep in Dubai cannot see Paris leads. Used throughout the sales pipeline until a lead converts to customer.

**Tenant Isolation (Operations):** Separates post-sale data. Fleet Operator A cannot see Fleet Operator B's vehicles or drivers. Applied after contract signature when tenant is created.

### Observable Behavior

When a FleetCore UAE employee accesses the leads dashboard, queries include `WHERE provider_id = 'uae-uuid'`. RLS policies at the database level provide defense in depth.

---

## Principle 2: Repository Pattern

### The Problem

Direct database access scattered throughout the codebase creates SQL injection vulnerabilities, duplicated logic, and inconsistent soft-delete handling.

### The Solution

All database access flows through repository classes extending `BaseRepository`. This centralizes cross-cutting concerns.

**Implementation:** `lib/core/base.repository.ts`

```typescript
export abstract class BaseRepository<T> {
  protected abstract getSortWhitelist(): SortFieldWhitelist;

  protected shouldFilterDeleted(): boolean {
    return true; // Override for tables without deleted_at
  }

  async findById(id: string, tenantId?: string): Promise<T | null> {
    return await this.model.findFirst({
      where: { id, deleted_at: null, ...(tenantId && { tenant_id: tenantId }) },
    });
  }
}
```

The abstract `getSortWhitelist()` forces each repository to declare safe sort fields, preventing SQL injection through ORDER BY.

---

## Principle 3: Service Layer Abstraction

### The Problem

Business logic in API handlers becomes difficult to test, reuse, and maintain. Transaction management and error handling vary between endpoints.

### The Solution

All business operations flow through service classes extending `BaseService`. Services manage transactions, map errors, and trigger audit logging.

**Implementation:** `lib/core/base.service.ts`

```typescript
protected async executeInTransaction<T>(
  operation: (tx: PrismaTransaction) => Promise<T>
): Promise<T> {
  return await this.prisma.$transaction(async (tx) => operation(tx));
}

protected handleError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") throw new ConflictError("Record already exists");
    if (error.code === "P2025") throw new NotFoundError("Record not found");
  }
  throw error;
}
```

---

## Principle 4: Type-Safe Error Handling

### The Problem

Generic error handling obscures the distinction between client errors and server errors. API consumers cannot determine whether to retry, modify input, or report a bug.

### The Solution

FleetCore defines an error class hierarchy in `lib/core/errors.ts`:

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code?: string
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 422, "BUSINESS_RULE_VIOLATION");
  }
}
```

API handlers catch these typed errors to return consistent HTTP responses with machine-readable codes.

---

## Principle 5: Audit Trail Compliance

### The Problem

Regulated industries require detailed records of who did what and when. Simple database logs do not capture business context.

### The Solution

The audit system in `lib/audit.ts` captures operations with full context:

```typescript
export async function auditLog(params: {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  providerId?: string;
  changes?: object;
}): Promise<void> {
  await prisma.adm_audit_logs.create({
    data: {
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      changes: JSON.stringify(params.changes),
    },
  });
}
```

For automated operations (CRON jobs), the System User UUID `00000000-0000-0000-0000-000000000001` maintains audit trail.

---

## Principle 6: Zero-Hardcoding Configuration

### The Problem

Business rules change more frequently than code deploys. Hardcoded thresholds require developer intervention for business decisions.

### The Solution

Configurable rules live in `crm_settings` table as JSONB. The application reads at runtime.

**Implementation:** `lib/validators/crm/settings.validators.ts`

```typescript
export const ScoringConfigSchema = z.object({
  fitScore: z.object({
    maxScore: z.number().min(0).max(100),
    fleetSizeWeight: z.number().min(0).max(1),
  }),
  qualificationThresholds: z.object({
    sql: z.number(), // Sales Qualified Lead threshold
    mql: z.number(), // Marketing Qualified Lead threshold
  }),
});
```

When an administrator adjusts the SQL threshold from 70 to 65, the change takes effect without deployment.

---

## Principle 7: SQL Injection Protection

### The Problem

Dynamic query construction for sorting creates SQL injection vulnerabilities, even with an ORM.

### The Solution

`validateSortBy()` in `lib/core/validation.ts` checks against explicit whitelists:

```typescript
export function validateSortBy(
  sortBy: string,
  whitelist: SortFieldWhitelist
): void {
  if (!whitelist.includes(sortBy as any)) {
    throw new ValidationError(
      `Invalid sort field: ${sortBy}. Allowed: ${whitelist.join(", ")}`
    );
  }
}
```

New sortable fields must be explicitly added to the repository's whitelist.

---

## Principle 8: Soft Delete Pattern

### The Problem

Hard deletion loses data permanently, making recovery impossible and violating audit trail requirements. GDPR "right to erasure" requires controlled deletion with accountability.

### The Solution

All business entities implement soft delete with three columns:

| Column            | Type      | Purpose                                 |
| ----------------- | --------- | --------------------------------------- |
| `deleted_at`      | timestamp | When record was deleted (NULL = active) |
| `deleted_by`      | uuid      | Who deleted the record                  |
| `deletion_reason` | text      | Why it was deleted                      |

**Implementation in BaseRepository:**

```typescript
async softDelete(id: string, userId: string, reason?: string): Promise<void> {
  await this.model.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: userId,
      deletion_reason: reason || "No reason provided",
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

**Automatic Filtering:** `BaseRepository.findMany()` automatically excludes `deleted_at IS NOT NULL` unless `shouldFilterDeleted()` returns false.

**GDPR Hard Delete:** True data erasure is a separate process requiring explicit authorization, audit documentation, and runs outside normal application flow.

### Observable Behavior

When a user "deletes" a lead, the record remains in database with `deleted_at` populated. Queries automatically exclude it. Administrators can restore it if deletion was accidental. Audit log records both deletion and any restoration.

---

## Principle 9: Type Safety End-to-End

### The Problem

Type mismatches between database, API, and frontend cause runtime errors that TypeScript cannot catch.

### The Solution

FleetCore maintains type safety from database to UI:

```
PostgreSQL Schema
       ↓
   Prisma Schema (schema.prisma)
       ↓
   Prisma Client (generated types)
       ↓
   Zod Schemas (runtime validation)
       ↓
   TypeScript Interfaces (inferred from Zod)
       ↓
   React Components (type-safe props)
```

**Key Patterns:**

```typescript
// Type inference from Zod
type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

// Prisma types for repository returns
import { crm_leads } from "@prisma/client";
async findById(id: string): Promise<crm_leads | null>

// No any allowed (ESLint enforced)
"@typescript-eslint/no-explicit-any": "error"
```

**ESLint Enforcement:** The `no-explicit-any` rule prevents type escape hatches. All external data must pass through Zod validation before entering the type system.

---

## Principle 10: Explicit Over Implicit

### The Problem

Magic strings, implicit conventions, and undocumented behaviors create maintenance burden and onboarding friction.

### The Solution

FleetCore favors explicit, self-documenting patterns:

### Naming Conventions

| Prefix | Domain                           | Examples                                 |
| ------ | -------------------------------- | ---------------------------------------- |
| `crm_` | Customer Relationship Management | crm_leads, crm_opportunities             |
| `adm_` | Administration                   | adm_tenants, adm_members, adm_audit_logs |
| `flt_` | Fleet Management                 | flt_vehicles, flt_vehicle_maintenance    |
| `rid_` | Ride Operations                  | rid_drivers, rid_trips                   |
| `dir_` | Directory (Reference Data)       | dir_countries, dir_car_makes             |

### Constants Over Magic Values

```typescript
// ❌ Bad: Magic string
if (lead.stage === "sql") { ... }

// ✅ Good: Named constant
import { LEAD_STAGES } from "@/lib/constants";
if (lead.stage === LEAD_STAGES.SQL) { ... }

// System User for automated operations
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";
```

### JSDoc for Complex Functions

```typescript
/**
 * Calculate lead qualification score
 *
 * @param lead - Lead record from database
 * @param config - Scoring configuration from crm_settings
 * @returns Score between 0-100, higher = more qualified
 *
 * @example
 * const score = calculateQualificationScore(lead, config);
 * if (score >= config.thresholds.sql) { // SQL threshold typically 70
 *   await promoteToSQL(lead);
 * }
 */
export function calculateQualificationScore(
  lead: crm_leads,
  config: ScoringConfig
): number { ... }
```

### Contextual Error Messages

```typescript
// ❌ Bad: Generic error
throw new Error("Invalid input");

// ✅ Good: Contextual error
throw new ValidationError(
  `Lead ${leadId} cannot transition from ${currentStage} to ${targetStage}. ` +
    `Valid transitions: ${VALID_TRANSITIONS[currentStage].join(", ")}`
);
```

---

## Conclusion

These ten principles emerge from practical experience building multi-tenant SaaS platforms. They are not theoretical guidelines but observable patterns throughout the FleetCore codebase. Understanding them helps developers make consistent decisions when adding features and helps auditors assess architectural coherence.

Each principle addresses a specific class of problems:

- **1-3:** Data access and business logic organization
- **4-5:** Error handling and compliance
- **6-7:** Configuration and security
- **8-10:** Data integrity and code quality

Together, they create a codebase that is secure by default, maintainable over time, and adaptable to changing requirements.

---

_For specific decisions that implement these principles, see the [Architecture Decision Records](./DECISIONS/00_index.md)._
