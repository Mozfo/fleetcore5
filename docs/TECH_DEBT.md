# FleetCore - Technical Debt Registry

> Last updated: 2025-12-05
> Quality Score: 8/10 → Target 8.5/10

## Metrics Overview

| Metric            | Current       | Target | Status  |
| ----------------- | ------------- | ------ | ------- |
| Type `any`        | 2 (justified) | 0      | OK      |
| TODOs             | 19            | 0      | Warning |
| Debug logs (prod) | ~8            | 0      | Warning |
| Test files        | 33            | +E2E   | OK      |
| Tests passing     | 530           | 530+   | OK      |

---

## TODOs to Resolve

### High Priority (Core Services)

| File                                         | Line | Description                                  |
| -------------------------------------------- | ---- | -------------------------------------------- |
| `lib/services/email/email.service.ts`        | 197  | Get tenant name from tenant data             |
| `lib/services/email/email.service.ts`        | 1152 | Get entity details and recipient email       |
| `lib/services/notification/queue.service.ts` | 317  | Implement SMS, Slack, Webhook, Push channels |

### Medium Priority (Documents/Vehicles)

| File                                         | Line    | Description                            |
| -------------------------------------------- | ------- | -------------------------------------- |
| `lib/services/documents/document.service.ts` | 105     | Implement Supabase Storage integration |
| `lib/services/documents/document.service.ts` | 134     | Trigger verification workflow          |
| `lib/services/documents/document.service.ts` | 184     | Get admin email from entity owner      |
| `lib/services/documents/document.service.ts` | 200-206 | Move country requirements to database  |
| `lib/services/documents/document.service.ts` | 603     | Implement Supabase Storage integration |
| `lib/services/documents/document.service.ts` | 609     | Implement verification workflow        |
| `lib/services/vehicles/vehicle.service.ts`   | 71      | Get admin email from tenant settings   |
| `lib/services/vehicles/vehicle.service.ts`   | 374-379 | dir_country_regulations implementation |
| `lib/services/vehicles/vehicle.service.ts`   | 415-420 | Complete maintenance scheduling        |
| `lib/services/vehicles/vehicle.service.ts`   | 460     | Get admin email from tenant settings   |

### Low Priority (Phase 2 Features)

| File                                        | Line | Description                |
| ------------------------------------------- | ---- | -------------------------- |
| `app/api/demo-leads/[id]/accept/route.ts`   | 76   | Activity logging (Phase 2) |
| `app/api/demo-leads/[id]/activity/route.ts` | 19   | Activity logging (Phase 2) |

---

## Type Safety Issues

### Files with `any` (Justified)

| File                          | Count | Justification                                              |
| ----------------------------- | ----- | ---------------------------------------------------------- |
| `lib/core/base.repository.ts` | 2     | Prisma delegate requires any due to complex internal types |

All other occurrences were false positives (word "any" in comments/text, not TypeScript type).

### Type Casting (`as unknown as`)

35 occurrences total - mostly in test files (acceptable).
Production files reviewed and considered safe.

---

## Debug Logs to Migrate

```
lib/auth/jwt.ts: 8 occurrences → migrate to logger.debug()
scripts/*.ts: Acceptable (dev tooling)
prisma/seed.ts: Acceptable (seed output)
```

---

## Archived Scripts

18 one-shot/debug scripts moved to `scripts/_archived/`:

- check-\*.ts (7 files)
- fix-\*.ts (2 files)
- verify-\*.ts (1 file)
- Migration scripts (8 files)

Production scripts kept:

- seed-crm-settings.ts
- validate-sql.ts
- generate-email-templates.ts
- generate-expansion-templates.ts
- regenerate-templates-from-react-email.ts
- test-i18n-emails.ts
- enrich-crm-settings.ts

---

## Improvement Roadmap

### Short Term (2 weeks)

- [x] ~~Type `lead-assignment.service.ts`~~ (already fully typed)
- [x] ~~Type `leads-columns.ts` and `opportunity-columns.ts`~~ (no `any` found)
- [ ] Migrate jwt.ts debug logs to logger
- [ ] Add tests for `lib/actions/crm/`
- [ ] Resolve high priority TODOs in email.service.ts

### Medium Term (1 month)

- [ ] Create `createApiHandler()` factory (DRY 57 routes)
- [ ] E2E tests with Playwright
- [ ] Fix N+1 queries in fleet crons
- [ ] Supabase Storage integration

### Long Term (Backlog)

- [ ] Split Prisma schema by domain (if >10k lines)
- [ ] SMS/Slack notification channels
- [ ] Verification workflow automation

---

## Notes

Technical debt identified and tracked. No blocking issues for production deployment.

**Updated Assessment**: Quality score revised to **8.5/10** - Type safety is excellent (only 2 justified `any`).
Remaining improvements focus on TODOs resolution and test coverage expansion.
