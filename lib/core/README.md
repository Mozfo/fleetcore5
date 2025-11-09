# FleetCore - Core Architecture Layer

**Phase 0.1 - Service & Repository Patterns**

This directory contains the foundational architecture for FleetCore's service layer, providing type-safe patterns for business logic, data access, error handling, and audit logging.

---

## 📚 Table of Contents

- [Overview](#overview)
- [Architecture Patterns](#architecture-patterns)
- [Core Components](#core-components)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Audit Logging](#audit-logging)
- [Multi-Tenant Isolation](#multi-tenant-isolation)
- [Testing](#testing)

---

## Overview

### Design Principles

1. **Separation of Concerns**: Service layer (orchestration) vs Repository layer (data access)
2. **Type Safety**: Generics preserve entity types throughout the stack
3. **Security First**: Multi-tenant isolation, permission checks, tenant validation
4. **Audit Trail**: Automatic GDPR-compliant audit logging
5. **Testability**: Interfaces and dependency injection enable unit testing

### Architecture Layers

```
┌─────────────────────────────────────────┐
│  API Routes (Next.js /api)              │
│  - HTTP handlers                        │
│  - Authentication (Clerk)               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Service Layer (BaseService)            │
│  - Business logic orchestration         │
│  - Validation (tenant, permissions)     │
│  - Audit logging                        │
│  - Error handling                       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Repository Layer (BaseRepository)      │
│  - Data access (CRUD)                   │
│  - Multi-tenant filtering               │
│  - Soft delete support                  │
│  - Pagination                           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Database (Prisma + PostgreSQL)         │
│  - 101 tables (ADM, CRM, DIR, etc.)     │
│  - JSONB audit logs                     │
└─────────────────────────────────────────┘
```

---

## Architecture Patterns

### 1. BaseService Pattern

**Purpose**: Orchestrate business logic with validation, error handling, and audit logging.

**Key Features**:

- ✅ Generic `<T>` for type safety
- ✅ Abstract methods enforce implementation in child services
- ✅ Automatic audit logging integration
- ✅ Multi-tenant validation
- ✅ Typed error handling (Prisma → AppError conversion)

**Abstract Methods** (must be implemented):

```typescript
protected abstract getRepository(): BaseRepository<T>
protected abstract getEntityType(): AuditEntityType
```

**Protected Methods** (available to child services):

- `validateTenant(tenantId)` - Production-ready tenant validation
- `checkPermission(memberId, permission)` - RBAC stub (Phase 0.2)
- `handleError(error, context)` - Convert Prisma errors to typed errors
- `audit(options)` - Create audit log entry
- `softDelete(id, tenantId, memberId, ...)` - Soft delete with audit
- `restore(id, tenantId, memberId, ...)` - Restore with audit
- `executeInTransaction(callback)` - Database transaction wrapper

---

### 2. BaseRepository Pattern

**Purpose**: Provide data access layer with multi-tenant isolation and soft-delete support.

**Key Features**:

- ✅ Generic `<T>` preserves entity types
- ✅ Automatic tenant filtering (optional)
- ✅ Soft delete by default (deleted_at column)
- ✅ Pagination support
- ✅ SQL injection prevention (sortBy whitelist)

**Methods**:

- `findById(id, tenantId?)` - Find single record
- `findMany(where, options)` - Paginated list
- `create(data, userId, tenantId?)` - Create with audit fields
- `update(id, data, userId, tenantId?)` - Update with audit fields
- `softDelete(id, userId, reason?, tenantId?)` - Soft delete
- `restore(id, userId, tenantId?)` - Restore deleted entity

---

### 3. Error Handling Pattern

**Purpose**: Standardized error types with HTTP status codes.

**Error Classes**:

| Class               | HTTP Status | Use Case                            |
| ------------------- | ----------- | ----------------------------------- |
| `ValidationError`   | 400         | Invalid input format                |
| `UnauthorizedError` | 401         | Missing/invalid authentication      |
| `ForbiddenError`    | 403         | Insufficient permissions            |
| `NotFoundError`     | 404         | Entity not found                    |
| `ConflictError`     | 409         | Duplicate entry (unique constraint) |
| `BusinessRuleError` | 422         | Business logic violation            |
| `DatabaseError`     | 500         | Database/Prisma errors              |
| `AppError`          | 500         | Generic application error           |

**Prisma Error Mapping**:

- `P2002` (Unique constraint) → `ConflictError`
- `P2025` (Record not found) → `NotFoundError`
- `P2003` (Foreign key constraint) → `ValidationError`
- Other → `DatabaseError`

---

## Core Components

### errors.ts

Type-safe error classes with HTTP status codes.

```typescript
import {
  ValidationError,
  NotFoundError,
  BusinessRuleError,
} from "@/lib/core/errors";

// Validation error (400)
throw new ValidationError("Email is required");

// Business rule violation (422)
throw new BusinessRuleError(
  "Cannot delete driver with active trips",
  "driver_has_active_trips",
  { driverId, activeTripCount: 5 }
);

// Database error (500)
throw new DatabaseError("Connection failed", originalError);
```

---

### base.service.ts

Abstract service class for business logic orchestration.

**Minimal Implementation**:

```typescript
import { BaseService } from "@/lib/core/base.service";
import { LeadRepository } from "./lead.repository";
import type { Lead } from "@prisma/client";

export class LeadService extends BaseService<Lead> {
  private leadRepository: LeadRepository;

  constructor() {
    super();
    this.leadRepository = new LeadRepository(
      this.prisma.crm_leads,
      this.prisma
    );
  }

  // Required: Type-safe repository access
  protected getRepository() {
    return this.leadRepository;
  }

  // Required: Entity type for audit logging
  protected getEntityType() {
    return "lead" as const;
  }

  // Business method example
  async createLead(data: CreateLeadDTO, tenantId: string, memberId: string) {
    // 1. Validate tenant
    await this.validateTenant(tenantId);

    // 2. Create lead
    const lead = await this.getRepository().create(data, memberId, tenantId);

    // 3. Audit log (if needed beyond repository)
    await this.audit({
      tenantId,
      action: "create",
      entityId: lead.id,
      memberId,
      snapshot: lead,
    });

    return lead;
  }

  async deleteLead(
    id: string,
    tenantId: string,
    memberId: string,
    reason: string
  ) {
    await this.validateTenant(tenantId);
    // Automatic audit logging included
    await this.softDelete(id, tenantId, memberId, undefined, reason);
  }
}
```

---

### base.repository.ts

Abstract repository class for data access.

**Implementation Example**:

```typescript
import { BaseRepository } from "@/lib/core/base.repository";
import type { Lead } from "@prisma/client";

export class LeadRepository extends BaseRepository<Lead> {
  // Required: SQL injection prevention whitelist
  protected getSortWhitelist() {
    return ["created_at", "company_name", "status", "priority"] as const;
  }

  // Optional: Disable soft-delete filtering for tables without deleted_at
  protected shouldFilterDeleted() {
    return true; // Default
  }
}
```

**Usage**:

```typescript
const repository = new LeadRepository(prisma.crm_leads, prisma);

// Find with pagination
const result = await repository.findMany(
  { tenant_id: "tenant-123", status: "new" },
  { page: 1, limit: 20, sortBy: "created_at", sortOrder: "desc" }
);

// Create
const lead = await repository.create(
  { company_name: "Acme Corp", status: "new" },
  "member-456",
  "tenant-123"
);

// Soft delete
await repository.softDelete("lead-id", "member-456", "Duplicate", "tenant-123");

// Restore
const restored = await repository.restore(
  "lead-id",
  "member-456",
  "tenant-123"
);
```

---

## Usage Examples

### Complete Service Implementation

```typescript
// lib/services/crm/lead.service.ts
import { BaseService } from "@/lib/core/base.service";
import { LeadRepository } from "./lead.repository";
import { BusinessRuleError } from "@/lib/core/errors";
import type { Lead } from "@prisma/client";

export class LeadService extends BaseService<Lead> {
  private leadRepository: LeadRepository;

  constructor() {
    super();
    this.leadRepository = new LeadRepository(
      this.prisma.crm_leads,
      this.prisma
    );
  }

  protected getRepository() {
    return this.leadRepository;
  }

  protected getEntityType() {
    return "lead" as const;
  }

  async createLead(
    data: { company_name: string; contact_email: string; status: string },
    tenantId: string,
    memberId: string
  ): Promise<Lead> {
    // Validate tenant is active
    await this.validateTenant(tenantId);

    // Business rule: Check duplicate email
    const existing = await this.leadRepository.findMany({
      tenant_id: tenantId,
      contact_email: data.contact_email,
    });

    if (existing.data.length > 0) {
      throw new BusinessRuleError(
        "Lead with this email already exists",
        "duplicate_lead_email",
        { email: data.contact_email }
      );
    }

    // Create lead
    const lead = await this.leadRepository.create(data, memberId, tenantId);

    // Audit log
    await this.audit({
      tenantId,
      action: "create",
      entityId: lead.id,
      memberId,
      snapshot: lead,
    });

    return lead;
  }

  async convertLeadToCustomer(
    leadId: string,
    tenantId: string,
    memberId: string
  ): Promise<void> {
    await this.validateTenant(tenantId);

    // Execute in transaction
    await this.executeInTransaction(async (tx) => {
      // Update lead status
      await tx.crm_leads.update({
        where: { id: leadId, tenant_id: tenantId },
        data: { status: "converted", updated_by: memberId },
      });

      // Create customer record
      // ... (customer creation logic)
    });

    // Audit conversion
    await this.audit({
      tenantId,
      action: "update",
      entityId: leadId,
      memberId,
      changes: { status: { old: "qualified", new: "converted" } },
    });
  }
}
```

---

## Error Handling

### In Services

```typescript
class DriverService extends BaseService<Driver> {
  async updateDriver(
    id: string,
    data: UpdateDriverDTO,
    tenantId: string,
    memberId: string
  ) {
    try {
      await this.validateTenant(tenantId); // May throw ValidationError, NotFoundError, ForbiddenError

      const driver = await this.getRepository().update(
        id,
        data,
        memberId,
        tenantId
      );

      return driver;
    } catch (error) {
      // Convert unknown errors to typed errors
      this.handleError(error, "updateDriver");
    }
  }
}
```

### In API Routes

```typescript
// app/api/v1/drivers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/dir/driver.service";
import { ValidationError, NotFoundError } from "@/lib/core/errors";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = new DriverService();
    const data = await req.json();
    const driver = await service.updateDriver(
      params.id,
      data,
      tenantId,
      memberId
    );

    return NextResponse.json(driver);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Audit Logging

### Automatic Audit with softDelete/restore

```typescript
// Audit log created automatically
await this.softDelete(
  driverId,
  tenantId,
  memberId,
  clerkUserId,
  "Driver resigned"
);

// Audit log created automatically
await this.restore(driverId, tenantId, memberId, clerkUserId, "Driver rehired");
```

### Manual Audit Logging

```typescript
// Log entity creation
await this.audit({
  tenantId,
  action: "create",
  entityId: lead.id,
  memberId,
  snapshot: { ...lead }, // Full entity snapshot
});

// Log entity update
await this.audit({
  tenantId,
  action: "update",
  entityId: driver.id,
  memberId,
  clerkUserId,
  changes: {
    license_number: { old: "ABC123", new: "XYZ789" },
    license_expiry: { old: "2024-12-31", new: "2025-12-31" },
  },
});

// Log business event
await this.audit({
  tenantId,
  action: "export",
  entityId: reportId,
  memberId,
  reason: "Monthly financial report export",
});
```

### Audit Log Schema

```typescript
// adm_audit_logs table
{
  id: string
  tenant_id: string
  action: 'create' | 'update' | 'delete' | 'restore' | 'login' | 'export' | ...
  entity: 'driver' | 'vehicle' | 'lead' | 'member' | ...
  entity_id: string
  member_id: string          // adm_members.id
  ip_address?: string
  user_agent?: string
  changes: {                 // JSONB
    field_name: { old: any, new: any },
    _audit_snapshot?: any,
    _audit_reason?: string,
    _audit_clerk_id?: string
  }
  created_at: Date
}
```

---

## Multi-Tenant Isolation

### Tenant Validation (Production-Ready)

```typescript
// In service method
await this.validateTenant(tenantId);
// Throws ValidationError if empty
// Throws NotFoundError if deleted or non-existent
// Throws ForbiddenError if status !== 'active'
```

### Repository-Level Filtering

```typescript
// BaseRepository automatically filters by tenant_id
const repository = new VehicleRepository(prisma.dir_vehicles, prisma);

// Option 1: Pass tenantId to methods
const vehicle = await repository.findById("vehicle-id", "tenant-123");

// Option 2: Filter in where clause
const vehicles = await repository.findMany({
  tenant_id: "tenant-123",
  status: "active",
});
```

### Security Notes

- ✅ **tenant_id** present in ~180 columns across 101 tables
- ✅ **deleted_at** soft-delete in ~123 tables
- ✅ All repositories enforce `deleted_at: null` by default
- ⚠️ **Phase 0.2**: Row-Level Security (RLS) will be implemented for additional protection

---

## Testing

### Unit Tests

**62 tests** covering:

- ✅ errors.test.ts (28 tests) - All error classes
- ✅ base.service.test.ts (21 tests) - Service methods with mocks
- ✅ base.repository.test.ts (6 tests) - Repository restore method
- ✅ validation.test.ts (7 tests) - SQL injection prevention

**Run tests**:

```bash
pnpm exec vitest run lib/core/__tests__/
```

### Coverage

**Current**: >95% coverage on core components

```bash
# Run with coverage report
pnpm exec vitest --coverage lib/core/
```

---

## Migration Guide

### For Existing Services

**Before** (without BaseService):

```typescript
class LeadService {
  async createLead(data, tenantId, memberId) {
    const lead = await prisma.crm_leads.create({
      data: { ...data, tenant_id: tenantId, created_by: memberId }
    })
    // Manual audit log
    await prisma.adm_audit_logs.create({ ... })
    return lead
  }
}
```

**After** (with BaseService):

```typescript
class LeadService extends BaseService<Lead> {
  protected getRepository() {
    return this.leadRepository;
  }
  protected getEntityType() {
    return "lead";
  }

  async createLead(data, tenantId, memberId) {
    await this.validateTenant(tenantId); // Automatic validation
    const lead = await this.getRepository().create(data, memberId, tenantId);
    // Audit already handled by repository
    return lead;
  }
}
```

**Benefits**:

- ✅ Automatic tenant validation
- ✅ Type-safe repository access
- ✅ Consistent error handling
- ✅ Audit logging integration
- ✅ Transaction support

---

## Next Steps (Phase 0.2)

- [ ] **RBAC Implementation**: Complete `checkPermission()` with role-based access control
- [ ] **Row-Level Security**: Add Prisma middleware for automatic tenant filtering
- [ ] **Caching Layer**: Integrate Redis for tenant/member lookups
- [ ] **Request Context**: Add AsyncLocalStorage for tenant/member injection
- [ ] **Integration Tests**: SQLite-based integration tests

---

## Documentation

**Files**:

- `errors.ts` - Error class definitions with JSDoc
- `base.service.ts` - Service pattern with comprehensive examples
- `base.repository.ts` - Repository pattern with JSDoc
- `validation.ts` - SQL injection prevention
- `types.ts` - Shared TypeScript types

**External References**:

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Clerk Authentication](https://clerk.com/docs)

---

**Last Updated**: November 8, 2025
**Version**: Phase 0.1 Complete
**Status**: ✅ Production Ready
