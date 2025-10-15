# Changelog

All notable changes to FleetCore API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed - BREAKING ⚠️

#### Error Response Format Standardization (Phase 3.4 Batch 1)

**Date**: October 15, 2025
**Affected Routes**: 10 API routes (see list below)

**Migration Status**: ✅ Batch 1 Complete (Routes 1-10 of 30)

**Breaking Change**: Error responses have been migrated from simple string format to standardized JSON envelope pattern for improved error handling, monitoring, and client-side debugging.

**Old Format** (Deprecated):

```json
{
  "error": "Driver not found"
}
```

**New Format** (Current):

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Driver not found",
    "path": "/api/v1/drivers/123",
    "timestamp": "2025-10-15T14:30:00.000Z",
    "request_id": "req_abc123"
  }
}
```

**Migrated Routes (Batch 1)**:

1. `GET /api/v1/directory/countries` - Public directory route
2. `GET /api/v1/directory/platforms` - Public directory route
3. `GET /api/v1/directory/vehicle-classes` - Public directory route
4. `GET /api/v1/drivers/:id/ratings` - Driver performance data
5. `GET /api/v1/drivers/:id/history` - Driver history timeline
6. `GET /api/v1/vehicles/available` - Available vehicles list
7. `POST /api/v1/drivers/:id/suspend` - Driver suspension
8. `POST /api/v1/drivers/:id/reactivate` - Driver reactivation
9. `PATCH /api/v1/drivers/:id` - Driver update
10. `POST /api/v1/vehicles` - Vehicle creation

**Impact**:

- **Frontend Applications**: Must update error handling to access `error.error.message` instead of `error.error`
- **Mobile Applications**: Same as frontend
- **API Tests**: Update assertions to expect envelope format
- **Monitoring/Logging**: Can now leverage new fields (`code`, `path`, `timestamp`, `request_id`)

**Error Codes**:

- `VALIDATION_ERROR` - Input validation failed (400)
- `UNAUTHORIZED` - Authentication required (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource conflict (409)
- `INTERNAL_ERROR` - Server error (500)

**Migration Guide**:

Before:

```typescript
fetch("/api/v1/drivers/123")
  .catch((res) => res.json())
  .then((data) => {
    // Old: data.error is a string
    alert(data.error);
  });
```

After:

```typescript
fetch("/api/v1/drivers/123")
  .catch((res) => res.json())
  .then((data) => {
    // New: data.error is an object
    alert(data.error.message);
    // Additional fields available:
    // - data.error.code (machine-readable)
    // - data.error.path (request path)
    // - data.error.timestamp (ISO 8601)
    // - data.error.request_id (for support)
  });
```

**Rollout Plan**:

- ✅ Phase 3.3: Implemented `handleApiError()` with Prisma support
- ✅ Phase 3.4 Batch 1: Migrated 10 routes (October 15, 2025)
- ✅ Phase 3.5 Batch 2: Migrated 10 routes (October 15, 2025)
- ⏳ Phase 3.6 Batch 3: Final ~8 routes (planned)
- ⏳ Phase 3.7-3.8: ADR documentation and frontend examples

**Technical Details**:

- Implementation: `lib/api/error-handler.ts`
- Documentation: `docs/MIGRATION_BATCH_1.md`
- Git Commits: 10 atomic commits (IDs: 017b76e through baa66d5)
- LOC Reduction: -61 lines (-35% in error handling code)

**Backward Compatibility**: None. This is a breaking change for all migrated routes.

**Deprecation Timeline**:

- Old format: ❌ Deprecated for migrated routes
- New format: ✅ Standard for all future routes
- Migration completion: Targeted for Phase 3.6 (all ~28 routes)

#### Error Response Format Standardization (Phase 3.5 Batch 2)

**Date**: October 15, 2025
**Affected Routes**: 10 additional API routes (see list below)

**Migration Status**: ✅ Batch 2 Complete (Routes 11-20 of ~28)

**Continuing the Error Format Migration**: Batch 2 continues the migration from simple string errors to standardized JSON envelope pattern, adding 10 more routes to the standardized format.

**Migrated Routes (Batch 2)**: 11. `GET /api/v1/vehicles` - Vehicle listing with pagination 12. `GET /api/v1/vehicles/:id` - Vehicle details retrieval 13. `PUT /api/v1/vehicles/:id` - Vehicle update 14. `GET /api/v1/directory/makes` - Car makes directory 15. `GET /api/v1/drivers/:id` - Driver details retrieval 16. `DELETE /api/v1/drivers/:id` - Driver soft deletion 17. `POST /api/v1/directory/platforms` - Platform creation 18. `POST /api/v1/directory/vehicle-classes` - Vehicle class creation 19. `POST /api/v1/drivers` - Driver creation 20. `GET /api/v1/drivers/:id/performance` - Driver performance metrics

**Technical Details**:

- Implementation: Same `handleApiError()` from Phase 3.3
- Documentation: `docs/MIGRATION_BATCH_2.md`
- Git Commits: 10 atomic commits (IDs: 482205b through 61c4ab2)
- LOC Reduction: -69 lines (-30% in error handling code)
- Files 100% Migrated: 5 files (9 total across both batches)

**Migration Progress**:

- Batch 1: 10 routes ✅ (October 15, 2025)
- Batch 2: 10 routes ✅ (October 15, 2025)
- Batch 3: ~8 routes remaining ⏳ (planned)
- **Total Progress**: 20/28 routes migrated (71%)

**Impact**: Same as Batch 1 - frontend/mobile apps must handle envelope format for these routes.

---

### Added

#### Centralized Error Handler (Phase 3.3)

**Date**: October 14, 2025

**Features**:

- Standardized `ErrorResponse` envelope format for all API errors
- Automatic Prisma error translation (P2002, P2025, P2003)
- Built-in Zod validation error handling
- Request correlation via `request_id` field
- ISO 8601 timestamps for log correlation
- Server-side error logging with context (tenantId, userId, path)

**Benefits**:

- Consistent error structure across all routes
- Improved client-side error handling
- Better observability and debugging
- Reduced boilerplate code (-35% LOC in error handling)
- Automatic Prisma error translation

**Implementation**: `lib/api/error-handler.ts` (826 lines)

---

## [0.1.0] - 2025-09-27

### Added

- Initial FleetCore application structure
- Next.js 15.5.3 with App Router + Turbopack
- Clerk authentication with multi-tenant support
- Internationalization (i18next) with English and French
- Prisma database schema (36+ tables)
- Request demo system with API integration
- Responsive design with dark mode
- Production-ready deployment configuration

---

## Version History

- **Unreleased**: Phase 3.4 error handling migration in progress
- **0.1.0** (Sept 27, 2025): Initial release with core features
