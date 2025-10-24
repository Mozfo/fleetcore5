# ADR 002: Single JSONB Column for Audit Trail Storage

## Status

**Accepted** (October 14, 2025)

Supersedes: None

## Context

### Business Requirements

FleetCore is a multi-tenant SaaS platform for ride-hailing fleet management operating in the UAE and wider MENA region. As a regulated business handling personal data and financial transactions, we have strict compliance and security requirements:

1. **GDPR Article 30 Compliance**
   - Maintain records of all processing activities
   - Demonstrate data subject rights enforcement (access, rectification, erasure)
   - Provide audit trail for data protection authorities

2. **Security Audit Trail**
   - Track all modifications to critical entities (drivers, vehicles, documents)
   - Enable forensic analysis in case of security incidents
   - Support intrusion detection and anomaly monitoring

3. **Business Operations**
   - Traceability for customer support (who changed what, when, why)
   - Analytics on user behavior and system usage
   - Compliance with local regulations (UAE TDRA, Saudi CITC)

4. **Technical Requirements**
   - Support **15+ entity types** (driver, vehicle, document, organization, member, etc.)
   - Capture **10 different actions** (create, update, delete, restore, login, logout, invite, accept_invite, export, import)
   - **28 production auditLog() calls** already identified across 5 services
   - Multi-tenant isolation with strict data separation

### Technical Constraints

1. **PostgreSQL 14+ Database**
   - Running on Supabase managed infrastructure
   - Pooler connection for queries, direct connection for migrations
   - GIN indexing available for JSONB optimization

2. **Prisma ORM Limitations**
   - No dynamic schema generation at runtime
   - Column additions require migrations
   - Type safety limited to defined schema

3. **Performance Requirements**
   - Audit log insertion: <100ms (non-blocking)
   - Query performance: <200ms for typical dashboard queries
   - Support 10,000+ logs per tenant per month

4. **Schema Evolution**
   - Frequent addition of new entity types (e.g., new modules: billing, CRM)
   - Entity-specific metadata (vehicle odometer, driver license expiry)
   - External system integrations (Clerk webhooks, payment providers)

### Problem Statement

**How do we store flexible audit log data without requiring frequent database migrations while maintaining query performance and type safety?**

Traditional approaches have significant drawbacks:

- **Separate columns** � Requires migration for every new metadata field
- **EAV (Entity-Attribute-Value)** � Complex queries, poor performance, difficult indexing
- **Pure JSON without conventions** � Risk of key collisions, no structure enforcement

## Decision

### Architecture Chosen: Single JSONB Column with Metadata Prefix Convention

We implement audit logging using a **single JSONB column** (`changes`) with a **strict naming convention** for metadata fields:

- **Domain changes**: Direct keys (e.g., `name`, `status`, `email`)
- **System metadata**: `_audit_*` prefix (e.g., `_audit_snapshot`, `_audit_reason`)

#### Database Schema

```sql
CREATE TABLE adm_audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  member_id   UUID REFERENCES adm_members(id),
  entity      VARCHAR(50) NOT NULL,
  entity_id   UUID NOT NULL,
  action      VARCHAR(50) NOT NULL,
  changes     JSONB,  -- P Single flexible column
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GIN index for efficient JSONB queries
CREATE INDEX adm_audit_logs_changes_gin ON adm_audit_logs USING GIN (changes);

-- Composite index for entity lookup
CREATE INDEX adm_audit_logs_tenant_entity_entity_id_idx
  ON adm_audit_logs(tenant_id, entity, entity_id);

-- Timestamp index for time-range queries
CREATE INDEX adm_audit_logs_timestamp_idx
  ON adm_audit_logs(timestamp DESC);
```

#### JSONB Structure Convention

**CREATE action** (snapshot of full entity):

```json
{
  "_audit_snapshot": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "first_name": "Ahmed",
    "last_name": "Al-Mansouri",
    "email": "ahmed@example.com",
    "driver_status": "active"
  },
  "_audit_metadata": {
    "source": "manual_creation",
    "ip": "192.168.1.100"
  }
}
```

**UPDATE action** (old/new values + old state snapshot):

```json
{
  "email": {
    "old": "ahmed@example.com",
    "new": "ahmed.almansouri@example.com"
  },
  "driver_status": {
    "old": "active",
    "new": "suspended"
  },
  "_audit_snapshot": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "ahmed@example.com",
    "driver_status": "active"
  },
  "_audit_reason": "Suspended due to traffic violation - case #12345"
}
```

**DELETE action** (reason required for GDPR compliance):

```json
{
  "_audit_reason": "GDPR Article 17 - Right to erasure requested by user",
  "_audit_snapshot": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "first_name": "Ahmed",
    "deleted_at": "2025-10-14T10:30:00Z"
  }
}
```

**WEBHOOK action** (external system integration):

```json
{
  "_audit_snapshot": {
    "clerk_organization_id": "org_2abc123",
    "name": "FleetCo Dubai"
  },
  "_audit_clerk_id": "user_2xyz789",
  "_audit_metadata": {
    "source": "clerk_webhook",
    "event_type": "organization.created",
    "webhook_id": "wh_abc123"
  }
}
```

#### Implementation Helpers

**lib/audit.ts** provides high-level API:

```typescript
export async function auditLog(options: AuditLogOptions): Promise<void>
export function buildChangesJSON(options: ...): Prisma.InputJsonValue | null
export function serializeForAudit<T>(obj: T): Prisma.InputJsonValue
export function captureChanges(oldData, newData): Record<string, unknown>
```

**Key Design Decisions:**

1. **API Parameter Mappings**:
   - `entityType` � database column `entity` (avoid reserved keywords)
   - `performedBy` � database column `member_id` (consistent with schema naming)

2. **Non-Blocking Design**:
   - `auditLog()` catches all errors silently (try/catch)
   - Never interrupts business operations
   - Logs failures only in development mode

3. **Prefix Separation**:
   - Domain changes: No prefix (e.g., `name`, `status`)
   - System metadata: `_audit_*` prefix (e.g., `_audit_snapshot`)
   - Prevents collisions with business data

## Consequences

### Positive 

#### 1. Schema Flexibility

**No migrations required for new metadata fields:**

```typescript
// Adding new metadata field (e.g., geolocation)
await auditLog({
  tenantId,
  action: "create",
  entityType: "driver",
  entityId: driver.id,
  metadata: {
    geolocation: { lat: 25.2048, lng: 55.2708 }, // � New field
    source: "mobile_app",
  },
});
// No ALTER TABLE required!
```

**Entity-specific fields coexist naturally:**

- Vehicle: `odometer`, `fuel_level`
- Driver: `license_expiry`, `professional_card_expiry`
- Document: `file_size`, `mime_type`

**Future-proof for new modules:**

- Billing module � `_audit_invoice_id`, `_audit_payment_method`
- CRM module � `_audit_lead_source`, `_audit_campaign_id`

#### 2. Query Performance

**GIN index enables fast JSONB queries (<50ms):**

```sql
-- Containment query (GIN-optimized)
WHERE changes @> '{"_audit_reason": "GDPR"}'::jsonb
-- Execution time: 12ms (200,000 rows)

-- Key existence (GIN-optimized)
WHERE changes ? '_audit_snapshot'
-- Execution time: 8ms (200,000 rows)
```

**Single column reduces table width:**

- No sparse columns with mostly NULL values
- Better cache locality for sequential scans
- Efficient JSONB compression in PostgreSQL

**Composite indexes support complex queries:**

```sql
WHERE tenant_id = '...' AND entity = 'driver' AND entity_id = '...'
-- Uses: adm_audit_logs_tenant_entity_entity_id_idx
```

#### 3. Developer Experience

**Simple, intuitive API:**

```typescript
// CREATE
await auditLog({
  tenantId,
  action: "create",
  entityType: "driver",
  entityId: driver.id,
  snapshot: serializeForAudit(driver),
  performedBy: userId,
});

// UPDATE
await auditLog({
  tenantId,
  action: "update",
  entityType: "driver",
  entityId: driver.id,
  changes: captureChanges(oldDriver, newDriver),
  reason: "Suspended due to traffic violation",
  performedBy: userId,
});
```

**Type-safe helpers prevent malformed JSONB:**

- `serializeForAudit()` converts Dates to ISO strings
- `buildChangesJSON()` enforces `_audit_*` prefix convention
- `captureChanges()` auto-detects field differences

**Non-blocking by design:**

- Audit failures never block business operations
- Silent fail in production, logged in development
- Resilient to temporary DB connection issues

#### 4. Multi-Tenant Security

**Strict isolation via `tenant_id` foreign key:**

```sql
tenant_id UUID NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE
```

**Benefits:**

- Automatic cascade delete when tenant removed
- Query planner uses tenant_id index first
- RLS (Row Level Security) ready for future enhancement

**Validated via E2E tests:**

```bash
pnpm test:audit:e2e
#  Multi-tenant isolation - 32 log(s) found
#  No cross-tenant leakage detected
```

### Negative �

#### 1. Query Complexity

**Developers must learn PostgreSQL JSONB operators:**

| Operator | Description     | Example                                    |
| -------- | --------------- | ------------------------------------------ | ---------- | -------------------------------------------- |
| `->`     | Get JSON object | `changes->'_audit_snapshot'`               |
| `->>`    | Get JSON text   | `changes->>'_audit_reason'`                |
| `@>`     | Containment     | `changes @> '{"status": "active"}'::jsonb` |
| `?`      | Key exists      | `changes ? '_audit_snapshot'`              |
| `?       | `               | Any key exists                             | `changes ? | ARRAY['_audit_snapshot', '_audit_metadata']` |

**EXPLAIN ANALYZE required for optimization:**

```sql
EXPLAIN ANALYZE
SELECT * FROM adm_audit_logs
WHERE changes @> '{"_audit_reason": "GDPR"}'::jsonb;
```

**Mitigation:**

- Comprehensive operations guide with 16 example queries
- Performance section documenting GIN-compatible operators
- `docs/operations/AUDIT_TRAIL_GUIDE.md` provides copy-paste SQL

#### 2. Type Safety Limitations

**No database-level validation on JSONB content:**

```sql
-- L This will succeed even if malformed
INSERT INTO adm_audit_logs (tenant_id, action, entity, entity_id, changes)
VALUES ('...', 'create', 'driver', '...', '{"invalid": "structure"}'::jsonb);
```

**Application-level enforcement required:**

- Must use `auditLog()` helper (not raw Prisma)
- `buildChangesJSON()` enforces prefix convention
- Code reviews critical to prevent bypasses

**TypeScript types not enforced at DB layer:**

```typescript
// TypeScript can't prevent this at runtime
const changes = { reason: "..." }; // Missing _audit_ prefix
await prisma.adm_audit_logs.create({
  data: { changes }, // � No type error, but breaks convention
});
```

**Mitigation:**

- Automated E2E tests validate structure (9 validation checks)
- Linting rules to detect raw Prisma calls
- Developer documentation emphasizes helper usage

#### 3. Maintenance Overhead

**Prefix convention must be manually enforced:**

- Code reviews required to catch violations
- No automated linter for JSONB key naming
- Documentation must be kept in sync with conventions

**Migration complexity for retroactive changes:**

```sql
-- Example: Renaming _audit_snapshot to _audit_state
UPDATE adm_audit_logs
SET changes = jsonb_set(
  changes - '_audit_snapshot',
  '{_audit_state}',
  changes->'_audit_snapshot'
)
WHERE changes ? '_audit_snapshot';
```

**Mitigation:**

- Comprehensive ADR documentation (this document)
- Operations guide with troubleshooting section
- E2E tests validate structure continuously

## Alternatives Considered

### Alternative 1: Separate Columns for Each Metadata Field

**Schema:**

```sql
CREATE TABLE adm_audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ...
  snapshot JSONB,
  reason TEXT,
  metadata JSONB,
  clerk_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

**Pros:**

- Clear column semantics
- Type constraints possible (`reason TEXT NOT NULL` for DELETE)
- Standard SQL queries (no JSONB operators)

**Cons:**

- L **Requires migration for new fields**: Adding `geolocation` needs ALTER TABLE
- L **Sparse columns**: Most fields NULL for most rows (waste space)
- L **Entity-specific fields**: Cannot store vehicle `odometer` vs driver `license_expiry` in same schema
- L **Harder analytics**: Aggregations require COALESCE() for NULLs

**Rejected:** Too rigid for evolving requirements, frequent migrations unacceptable

### Alternative 2: Pure JSON Column (No Prefix Convention)

**Schema:**

```sql
CREATE TABLE adm_audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ...
  data JSONB  -- Everything in one column, no conventions
);
```

**Pros:**

- Maximum flexibility
- No naming rules to enforce

**Cons:**

- L **Key collision risk**: User entity has field `metadata` � conflicts with audit metadata
- L **No structure enforcement**: Developers can put anything anywhere
- L **Queries ambiguous**: `data->>'reason'` could be audit reason or business reason

**Rejected:** Too dangerous, high risk of data corruption and query bugs

### Alternative 3: EAV (Entity-Attribute-Value) Table

**Schema:**

```sql
CREATE TABLE adm_audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  entity VARCHAR(50),
  entity_id UUID,
  action VARCHAR(50)
);

CREATE TABLE adm_audit_log_attributes (
  log_id UUID REFERENCES adm_audit_logs(id),
  attribute_name VARCHAR(100),
  attribute_value TEXT,
  PRIMARY KEY (log_id, attribute_name)
);
```

**Pros:**

- Highly normalized
- Easy to add new attributes

**Cons:**

- L **Complex queries**: Retrieving full log requires JOINs + pivot
- L **Poor performance**: 1 row per attribute (10 attributes = 10 rows per log)
- L **Difficult indexing**: Cannot index on specific attribute values efficiently
- L **No JSONB benefits**: Lose GIN indexing, containment queries

**Rejected:** Query complexity and performance unacceptable for high-volume audit logs

### Alternative 4: Hybrid (Columns + JSONB)

**Schema:**

```sql
CREATE TABLE adm_audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ...
  snapshot JSONB,
  reason TEXT,
  extra_metadata JSONB  -- For additional fields
);
```

**Pros:**

- Balance between structure and flexibility
- Common fields in columns, rare fields in JSONB

**Cons:**

- L **Decision overhead**: Where to put new fields? Column or JSONB?
- L **Migration still needed**: Adding common field requires ALTER TABLE
- L **Inconsistent queries**: Mix of column and JSONB syntax

**Rejected:** Added complexity without solving core flexibility problem

## Implementation Notes

### Production Validation

**28 auditLog() calls** deployed across 5 services:

- `lib/services/drivers/driver.service.ts`: 5 calls
- `lib/services/vehicles/vehicle.service.ts`: 8 calls
- `lib/services/documents/document.service.ts`: 6 calls
- `lib/services/email/email.service.ts`: 3 calls
- `app/api/webhooks/clerk/route.ts`: 6 calls

**E2E Test Coverage (100%):**

```bash
pnpm test:audit:e2e
#  9/9 validations passed
#  Multi-tenant isolation verified
#  JSONB structure validated
```

### Performance Benchmarks

**GIN Index Effectiveness:**

```sql
EXPLAIN ANALYZE
SELECT * FROM adm_audit_logs
WHERE changes @> '{"_audit_reason": "GDPR"}'::jsonb;

-- Result:
-- Bitmap Index Scan using adm_audit_logs_changes_gin
-- Execution Time: 12.3 ms (200,000 rows in table)
```

**Without GIN index (Seq Scan):**

```
-- Execution Time: 1,847 ms (same query)
-- � 150x slower!
```

### Multi-Tenant Isolation Test Results

```bash
pnpm test:audit:e2e
# Tested 2 tenants, 32 logs total
#  No cross-tenant data leakage
#  All logs have valid tenant_id
#  Foreign key constraints enforced
```

## References

### Compliance Standards

- **GDPR Article 30**: Records of processing activities
  - https://gdpr-info.eu/art-30-gdpr/
- **ISO 27001:2013**: Audit logging and monitoring
  - https://www.iso27001security.com/html/27001.html

### Technical Documentation

- **PostgreSQL JSONB**: Data types and indexing
  - https://www.postgresql.org/docs/current/datatype-json.html
- **Prisma JSONB**: Schema definition and queries
  - https://www.prisma.io/docs/orm/prisma-schema/data-model/json-fields
- **GIN Indexes**: Generalized Inverted Indexes
  - https://www.postgresql.org/docs/current/gin-intro.html

### Internal Documentation

- **Operations Guide**: `docs/operations/AUDIT_TRAIL_GUIDE.md`
  - 16 example SQL queries
  - 5 troubleshooting scenarios
  - Developer patterns and best practices
- **Manual Tests**: `docs/AUDIT_E2E_MANUAL_TESTS.md`
  - 14 webhook/email test scenarios
  - SQL validation queries
- **E2E Tests**: `scripts/test-audit-e2e.ts`
  - 9 automated structure validations
  - Multi-tenant isolation checks

## Version History

- **v1.0 (October 14, 2025)**: Initial ADR
  - Architecture decision documented
  - 28 production calls validated
  - E2E tests passing (100%)

---

**Authors:** FleetCore Platform Team
**Last Updated:** October 14, 2025
**Status:** Accepted and Implemented
