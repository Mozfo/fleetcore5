This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

### API Route Tests

FleetCore uses automated testing with Clerk authentication for API routes.

#### Prerequisites

1. **Clerk JWT Template**: Create template named `test-api` in Clerk Dashboard
   - Token Lifetime: 86400 seconds (24 hours)
   - See [Clerk Testing Setup Guide](./docs/test-results/CLERK_TESTING_SETUP.md)

2. **Environment**: Copy `.env.test.example` to `.env.test` and configure

#### Running Tests

```bash
# Run Batch 3 API tests (8 routes)
pnpm run test:batch3

# Verbose logging
pnpm run test:batch3:verbose

# Run all tests (Vitest)
pnpm test
```

#### Test Results

Results saved to `docs/test-results/batch3-test-results.json`

For complete documentation, see [Clerk Testing Setup Guide](./docs/test-results/CLERK_TESTING_SETUP.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🔍 Audit Trail

FleetCore implements a comprehensive audit trail system to track all critical operations for GDPR compliance (Article 30), security forensics, and business operations.

### Quick Access

- **[Architecture Decision Record (ADR 002)](docs/architecture/decisions/002-audit-trail-jsonb.md)** - Design rationale and technical decisions
- **[Operations Guide](docs/operations/AUDIT_TRAIL_GUIDE.md)** - 16 SQL queries, troubleshooting, and developer patterns
- **[E2E Manual Tests](docs/AUDIT_E2E_MANUAL_TESTS.md)** - Manual testing procedures for webhooks and integrations

### Key Features

✅ **Non-Breaking Design**: Audit failures never interrupt business operations
✅ **JSONB Storage**: Single flexible column with GIN indexes (150x faster queries)
✅ **Multi-Tenant Isolation**: Strict tenant_id filtering with FK cascade
✅ **Prefix Convention**: `_audit_*` for system metadata vs domain changes

### Usage Example

```typescript
import { auditLog, captureChanges } from "@/lib/audit";

// CREATE: Capture full snapshot
await auditLog({
  tenantId: user.tenantId,
  performedBy: user.memberId,
  entityType: "driver",
  entityId: driver.id,
  action: "create",
  snapshot: driver,
  metadata: { source: "admin_panel" },
});

// UPDATE: Auto-detect changes + reason
await auditLog({
  tenantId: user.tenantId,
  performedBy: user.memberId,
  entityType: "driver",
  entityId: driver.id,
  action: "update",
  changes: captureChanges(oldDriver, newDriver),
  snapshot: oldDriver,
  reason: "Manual approval after verification",
});

// DELETE: GDPR compliance
await auditLog({
  tenantId: user.tenantId,
  performedBy: user.memberId,
  entityType: "driver",
  entityId: driver.id,
  action: "delete",
  snapshot: driver,
  reason: "GDPR deletion request - user requested account removal per Article 17",
});
```

### Common Queries

```sql
-- 1. List all tenant logs (last 100)
SELECT id, action, entity, entity_id, timestamp, changes
FROM adm_audit_logs
WHERE tenant_id = '...'::uuid
ORDER BY timestamp DESC LIMIT 100;

-- 2. GDPR deletion audit
SELECT id, entity, entity_id, timestamp, changes->'_audit_reason' as reason
FROM adm_audit_logs
WHERE tenant_id = '...'::uuid
  AND changes @> '{"_audit_reason": "GDPR"}'::jsonb;

-- 3. Full entity history (forensics)
SELECT action, timestamp, changes
FROM adm_audit_logs
WHERE tenant_id = '...'::uuid
  AND entity = 'vehicle'
  AND entity_id = '...'::uuid
ORDER BY timestamp ASC;
```

### Commands

```bash
# Run E2E validation tests (9 checks)
pnpm test:audit:e2e

# Validate SQL queries
pnpm validate:sql

# Generate manual test logs (dev only)
pnpm test:audit

# View audit logs in Prisma Studio
pnpm prisma:studio
```

### Coverage Statistics

- **28 `auditLog()` calls** deployed across 5 services
- **E2E Tests**: 9/9 passed (100%)
- **Manual Tests**: 14/28 documented (50%)
- **Total Validated**: 25/28 calls (89%)

**Services Instrumented**:
- `app/api/webhooks/clerk/route.ts` (6 calls)
- `lib/services/drivers/driver.service.ts` (4 calls)
- `lib/services/vehicles/vehicle.service.ts` (8 calls)
- `lib/services/documents/document.service.ts` (7 calls)
- `lib/services/email/email.service.ts` (3 calls)

### Performance

- **GIN Index Speedup**: 140-150x faster for JSONB containment queries
- **Typical Query Time**: <20ms for tenant filtering
- **Database Impact**: Non-blocking, silent failure on errors
- **Storage**: Efficient JSONB compression with nullable column

---
