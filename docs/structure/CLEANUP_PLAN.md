# CLEANUP PLAN - FleetCore Documentation

> **Generated from code:** 2025-12-07
> **Status:** ANALYSE COMPLETE
> **Quality Score (from TECH_DEBT.md):** 8.5/10

---

## Executive Summary

Ce document analyse le codebase FleetCore pour identifier:

1. **ARCHIVER** - Scripts/fichiers obsolètes ou one-shot
2. **CONSERVER** - Code production actif
3. **GENERER** - Documentation manquante à créer
4. **NETTOYER** - Dead code à supprimer

---

## 1. SCRIPTS ANALYSIS

### Scripts Déjà Archivés (scripts/\_archived/)

18 fichiers déjà archivés - AUCUNE ACTION REQUISE:

| Fichier                           | Purpose (historical) |
| --------------------------------- | -------------------- |
| check-duplicate-email.ts          | Debug one-shot       |
| check-notification-logs.ts        | Debug one-shot       |
| check-delivered-logs.ts           | Debug one-shot       |
| fix-priority-final.ts             | Migration one-shot   |
| update-db-with-fixed-templates.ts | Migration one-shot   |
| check-es-country.ts               | Debug one-shot       |
| regenerate-all-templates.ts       | Migration one-shot   |
| manual-update-seed-templates.ts   | Migration one-shot   |
| count-templates.ts                | Debug one-shot       |
| fix-sales-rep-fr.ts               | Migration one-shot   |
| seed-priority-config.ts           | Migration one-shot   |
| check-priority-in-fr.ts           | Debug one-shot       |
| check-uae.ts                      | Debug one-shot       |
| add-expansion-to-seed.ts          | Migration one-shot   |
| check-expansion-template.ts       | Debug one-shot       |
| audit-all-templates-final.ts      | Debug one-shot       |
| decode-test-jwt.ts                | Debug one-shot       |
| verify-audit-logs.ts              | Debug one-shot       |

### Scripts Production (CONSERVER)

| Script                                     | Purpose                            | Usage                   |
| ------------------------------------------ | ---------------------------------- | ----------------------- |
| `seed-crm-settings.ts`                     | Seed CRM settings                  | prisma/seed integration |
| `validate-sql.ts`                          | Validate SQL files                 | CI/CD                   |
| `generate-email-templates.ts`              | Generate React Email templates     | Build pipeline          |
| `generate-expansion-templates.ts`          | Generate expansion email templates | Build pipeline          |
| `regenerate-templates-from-react-email.ts` | Regenerate templates               | Build pipeline          |
| `test-i18n-emails.ts`                      | Test i18n email rendering          | Dev testing             |
| `enrich-crm-settings.ts`                   | Enrich CRM settings with i18n      | Migration utility       |
| `degrade-inactive-leads.ts`                | CRON: Degrade inactive leads       | Scheduled job           |

### Shell Scripts (CONSERVER)

| Script                  | Purpose                     |
| ----------------------- | --------------------------- |
| `archive-fleetcore.sh`  | Archive old FleetCore data  |
| `export-mumbai-data.sh` | Export Mumbai region data   |
| `wait-for-server.sh`    | Wait for dev server startup |
| `verify-archive.sh`     | Verify archive integrity    |
| `session_16_MASTER.sh`  | Master migration script     |

### SQL Scripts (CONSERVER)

| Script                          | Purpose                       |
| ------------------------------- | ----------------------------- |
| `post_migration_validation.sql` | Validate post-migration state |
| `pre_migration_counts.sql`      | Count records pre-migration   |

---

## 2. DOCUMENTATION ANALYSIS

### docs/ Structure Actuelle

```
docs/
├── structure/              <-- NOUVEAU (Phase 1-6)
│   ├── API_INVENTORY.md    ✅ COMPLETE
│   ├── SERVICES_INVENTORY.md ✅ COMPLETE
│   ├── VALIDATORS_INVENTORY.md ✅ COMPLETE
│   ├── TYPES_INVENTORY.md  ✅ COMPLETE
│   └── CLEANUP_PLAN.md     ✅ CE FICHIER
├── TECH_DEBT.md            ✅ ACTUEL - Quality 8.5/10
├── CRONS.md                ✅ ACTUEL - CRON documentation
├── CODE_QUALITY_REPORT.md  📋 À VERIFIER
├── Plan/                   📋 À ORGANISER
│   ├── 1-10 Sprint docs    📋 Historical
│   ├── CRM_SETTINGS_SPECIFICATION.md ✅ ACTUEL
│   ├── claude.md           ✅ ACTUEL
│   ├── Completed/          📋 Archive
│   ├── Implementation QUOTE TO CASH/ ✅ ACTUEL
│   └── Technical debt a implementer/ 📋 À VERIFIER
├── Audit/                  📋 Historical
├── Deepdive/               📋 Technical deep-dives
├── Modules metiers/        📋 Business modules
├── Reference/              📋 Reference docs
├── Logo/                   📋 Assets
└── test-results/           📋 Test outputs
```

### Documentation MANQUANTE (À GÉNÉRER)

| Document                            | Priority | Content                       |
| ----------------------------------- | -------- | ----------------------------- |
| `docs/structure/README.md`          | HIGH     | Index de tous les inventaires |
| `docs/structure/ARCHITECTURE.md`    | HIGH     | Vue d'ensemble architecture   |
| `docs/structure/DATABASE_SCHEMA.md` | MEDIUM   | Schéma DB from Prisma         |
| `docs/structure/PATTERNS.md`        | MEDIUM   | Design patterns utilisés      |
| `docs/CONTRIBUTING.md`              | LOW      | Guide contribution            |
| `docs/DEPLOYMENT.md`                | LOW      | Guide déploiement             |

---

## 3. DEAD CODE ANALYSIS

### Files Potentiellement Obsolètes

| File/Pattern                 | Status     | Action                          |
| ---------------------------- | ---------- | ------------------------------- |
| `docs/Plan/1-10 Sprint docs` | Historical | ARCHIVE (move to docs/archive/) |
| `docs/Audit/`                | Historical | ARCHIVE                         |
| `docs/test-results/`         | Generated  | GITIGNORE                       |
| `.DS_Store` files            | MacOS      | Already in .gitignore           |

### Code Dupliqué Identifié

| Pattern                  | Occurrences         | Action                                     |
| ------------------------ | ------------------- | ------------------------------------------ |
| API route error handling | 57 routes           | Create `createApiHandler()` (TECH_DEBT.md) |
| Pagination schema        | Multiple validators | Extract to base.validators.ts              |
| SortBy validation        | All repositories    | Already centralized in validation.ts       |

### Tests Coverage Gaps

| Area              | Current     | Gap                      |
| ----------------- | ----------- | ------------------------ |
| Unit tests        | 530 passing | Good                     |
| Integration tests | Partial     | lib/actions/crm/ missing |
| E2E tests         | None        | Playwright needed        |

---

## 4. ACTION PLAN

### Immediate Actions (Now)

- [x] Create docs/structure/ directory
- [x] Generate API_INVENTORY.md
- [x] Generate SERVICES_INVENTORY.md
- [x] Generate VALIDATORS_INVENTORY.md
- [x] Generate TYPES_INVENTORY.md
- [x] Generate CLEANUP_PLAN.md (this file)

### Short Term Actions (This Week)

| Action                          | Priority | Effort |
| ------------------------------- | -------- | ------ |
| Create docs/structure/README.md | HIGH     | 30min  |
| Archive old Plan docs           | MEDIUM   | 1h     |
| Add .gitignore for test-results | LOW      | 5min   |

### Medium Term Actions (This Month)

| Action                              | Priority | Effort |
| ----------------------------------- | -------- | ------ |
| Create `createApiHandler()` factory | HIGH     | 4h     |
| Add tests for lib/actions/crm/      | HIGH     | 8h     |
| Setup Playwright E2E                | MEDIUM   | 4h     |
| Create ARCHITECTURE.md              | MEDIUM   | 2h     |

### Long Term Backlog

| Action                           | Priority | Effort |
| -------------------------------- | -------- | ------ |
| Split Prisma schema by domain    | LOW      | 16h    |
| SMS/Slack notification channels  | LOW      | 8h     |
| Verification workflow automation | LOW      | 16h    |

---

## 5. FILE COUNTS SUMMARY

| Category             | Count             | Status     |
| -------------------- | ----------------- | ---------- |
| API Routes           | 58                | Documented |
| Service Files        | 15                | Documented |
| Validator Files      | 11                | Documented |
| Repository Files     | 8                 | Documented |
| Type Files           | 1 (crm.ts) + core | Documented |
| Test Files           | 434               | Active     |
| Scripts (production) | 8                 | Maintained |
| Scripts (archived)   | 18                | Archived   |

---

## 6. QUALITY METRICS (from TECH_DEBT.md)

| Metric            | Current       | Target | Status |
| ----------------- | ------------- | ------ | ------ |
| Type `any`        | 2 (justified) | 0      | OK     |
| TODOs             | 2             | 0      | OK     |
| Debug logs (prod) | 0             | 0      | OK     |
| Test files        | 33+           | +E2E   | OK     |
| Tests passing     | 530           | 530+   | OK     |

**Quality Score: 8.5/10** - Production ready

---

## 7. RECOMMENDATIONS

### Do Not Touch (Critical)

- `lib/core/` - Base infrastructure
- `lib/prisma/` - Database layer
- `lib/services/` - Business logic
- `lib/repositories/` - Data access
- `lib/validators/` - Input validation
- `app/api/` - API routes
- `prisma/schema.prisma` - Database schema

### Safe to Archive

- `docs/Plan/1-10 Sprint docs` → `docs/archive/sprints/`
- `docs/Audit/` → `docs/archive/audits/`
- Old migration plans → `docs/archive/migrations/`

### Safe to Delete

- Generated files in `docs/test-results/`
- `.DS_Store` files (macOS artifacts)
- Any `*.log` files

### Keep Monitoring

- `TECH_DEBT.md` - Update regularly
- Test coverage - Add E2E tests
- Bundle size - Monitor in CI

---

## 8. VERIFICATION CHECKLIST

Before making any cleanup changes:

- [ ] Run `pnpm typecheck` - No errors
- [ ] Run `pnpm test` - 530+ tests pass
- [ ] Run `pnpm build` - Build succeeds
- [ ] Verify no console errors in dev
- [ ] Verify API routes respond correctly

After cleanup:

- [ ] Same typecheck, test, build results
- [ ] Git commit with clear message
- [ ] Update TECH_DEBT.md if needed

---

## Last Updated

- **Date:** 2025-12-07
- **By:** Claude Code Documentation Phase 6
- **Next Review:** After completing SHORT TERM actions
