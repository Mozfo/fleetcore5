# FleetCore API Inventory

> **Generated from code:** 2025-12-07
> **Source of truth:** `app/api/**/*.ts`
> **Total routes:** 58

---

## Table of Contents

1. [Summary Statistics](#summary-statistics)
2. [CRON Routes](#cron-routes)
3. [Demo Leads Routes](#demo-leads-routes)
4. [Internal/Public Routes](#internalpublic-routes)
5. [Webhooks Routes](#webhooks-routes)
6. [V1 CRM Routes](#v1-crm-routes)
7. [V1 Directory Routes](#v1-directory-routes)
8. [V1 Drivers Routes](#v1-drivers-routes)
9. [V1 Vehicles Routes](#v1-vehicles-routes)
10. [V1 Notifications Routes](#v1-notifications-routes)
11. [V1 Admin Routes](#v1-admin-routes)
12. [V1 Dashboard Routes](#v1-dashboard-routes)
13. [V1 Test Routes](#v1-test-routes)
14. [Zod Validators Index](#zod-validators-index)

---

## Summary Statistics

| Category         | Count  | Auth Type                | Zod Coverage |
| ---------------- | ------ | ------------------------ | ------------ |
| CRON             | 5      | CRON_SECRET              | 0%           |
| Demo Leads       | 4      | Mixed (Public/Protected) | 0%           |
| Internal/Public  | 2      | Token/Public             | 0%           |
| Webhooks         | 2      | Svix Signature           | 50%          |
| V1 CRM           | 12     | Middleware               | 75%          |
| V1 Directory     | 7      | Middleware               | 100%         |
| V1 Drivers       | 12     | Middleware               | 58%          |
| V1 Vehicles      | 9      | Middleware               | 67%          |
| V1 Notifications | 3      | Clerk                    | 100%         |
| V1 Admin         | 1      | Clerk + RBAC             | 100%         |
| V1 Dashboard     | 1      | Clerk                    | 0%           |
| V1 Test          | 2      | Mixed                    | 0%           |
| **TOTAL**        | **58** | -                        | **~55%**     |

---

## CRON Routes

All CRON routes use `CRON_SECRET` Bearer token authentication.

| #   | Endpoint                          | Methods | Zod Validators | Purpose                               |
| --- | --------------------------------- | ------- | -------------- | ------------------------------------- |
| 1   | `/api/cron/fleet/inspections`     | GET     | None           | Vehicle inspections due within 7 days |
| 2   | `/api/cron/fleet/insurance`       | GET     | None           | Insurance renewals within 30 days     |
| 3   | `/api/cron/fleet/maintenance`     | GET     | None           | Maintenance scheduled today/tomorrow  |
| 4   | `/api/cron/notifications/process` | GET     | None           | Process notification queue (batch=10) |
| 5   | `/api/cron/opportunities/rotting` | GET     | None           | Detect stagnant opportunities         |

**Source files:**

- `app/api/cron/fleet/inspections/route.ts`
- `app/api/cron/fleet/insurance/route.ts`
- `app/api/cron/fleet/maintenance/route.ts`
- `app/api/cron/notifications/process/route.ts`
- `app/api/cron/opportunities/rotting/route.ts`

---

## Demo Leads Routes

| #   | Endpoint                        | Methods          | Zod  | Auth      | Purpose                      |
| --- | ------------------------------- | ---------------- | ---- | --------- | ---------------------------- |
| 6   | `/api/demo-leads`               | POST, GET        | None | Public    | Create lead from public form |
| 7   | `/api/demo-leads/[id]`          | GET, PUT, DELETE | None | Protected | Lead CRUD                    |
| 8   | `/api/demo-leads/[id]/accept`   | POST             | None | Protected | Convert lead to customer     |
| 9   | `/api/demo-leads/[id]/activity` | POST             | None | Protected | Record lead activity         |

**Source files:**

- `app/api/demo-leads/route.ts`
- `app/api/demo-leads/[id]/route.ts`
- `app/api/demo-leads/[id]/accept/route.ts`
- `app/api/demo-leads/[id]/activity/route.ts`

---

## Internal/Public Routes

| #   | Endpoint                | Methods | Zod  | Auth                 | Purpose                |
| --- | ----------------------- | ------- | ---- | -------------------- | ---------------------- |
| 10  | `/api/internal/audit`   | POST    | None | INTERNAL_AUDIT_TOKEN | Write audit logs       |
| 11  | `/api/public/countries` | GET     | None | Public               | List visible countries |

**Source files:**

- `app/api/internal/audit/route.ts`
- `app/api/public/countries/route.ts`

---

## Webhooks Routes

| #   | Endpoint               | Methods | Zod                   | Auth | Purpose                 |
| --- | ---------------------- | ------- | --------------------- | ---- | ----------------------- |
| 12  | `/api/webhooks/clerk`  | POST    | None (WebhookEvent)   | Svix | Clerk org/member events |
| 13  | `/api/webhooks/resend` | POST    | `resendWebhookSchema` | Svix | Email delivery tracking |

**Clerk webhook events handled:**

- `organization.created` - Create adm_tenants
- `organization.updated` - Update adm_tenants
- `organization.deleted` - Soft-delete adm_tenants
- `organizationMembership.created` - Create adm_members + welcome email
- `organizationMembership.updated` - Update member role
- `organizationMembership.deleted` - Soft-delete adm_members

**Source files:**

- `app/api/webhooks/clerk/route.ts`
- `app/api/webhooks/resend/route.ts`

---

## V1 CRM Routes

All V1 CRM routes use middleware authentication (x-user-id, x-org-id headers).

### Leads

| #   | Endpoint                             | Methods            | Zod Validators                      | Purpose              |
| --- | ------------------------------------ | ------------------ | ----------------------------------- | -------------------- |
| 14  | `/api/v1/crm/leads`                  | GET, POST          | `CreateLeadSchema`                  | List/create leads    |
| 15  | `/api/v1/crm/leads/[id]`             | GET, PATCH, DELETE | `UpdateLeadSchema`                  | Lead CRUD            |
| 16  | `/api/v1/crm/leads/[id]/recalculate` | POST               | `RecalculateRequestSchema` (inline) | Recalculate scores   |
| 17  | `/api/v1/crm/leads/export`           | POST               | None                                | Export CSV/JSON      |
| 18  | `/api/v1/crm/leads/stats`            | GET                | None                                | Dashboard statistics |

### Opportunities

| #   | Endpoint                         | Methods            | Zod Validators                     | Purpose                   |
| --- | -------------------------------- | ------------------ | ---------------------------------- | ------------------------- |
| 19  | `/api/v1/crm/opportunities`      | GET, POST          | `CreateOpportunitySchema`          | List/create opportunities |
| 20  | `/api/v1/crm/opportunities/[id]` | GET, PATCH, DELETE | `UpdateOpportunitySchema` (inline) | Opportunity CRUD          |

### Settings

| #   | Endpoint                     | Methods          | Zod Validators                                  | Purpose              |
| --- | ---------------------------- | ---------------- | ----------------------------------------------- | -------------------- |
| 21  | `/api/v1/crm/settings`       | GET, POST        | `CreateSettingSchema`, `GetSettingsQuerySchema` | List/create settings |
| 22  | `/api/v1/crm/settings/[key]` | GET, PUT, DELETE | `UpdateSettingSchema`                           | Setting CRUD by key  |
| 23  | `/api/v1/crm/settings/bulk`  | POST             | `BulkUpdateSettingsSchema`                      | Bulk update (max 10) |

**Source files:**

- `app/api/v1/crm/leads/route.ts`
- `app/api/v1/crm/leads/[id]/route.ts`
- `app/api/v1/crm/leads/[id]/recalculate/route.ts`
- `app/api/v1/crm/leads/export/route.ts`
- `app/api/v1/crm/leads/stats/route.ts`
- `app/api/v1/crm/opportunities/route.ts`
- `app/api/v1/crm/opportunities/[id]/route.ts`
- `app/api/v1/crm/settings/route.ts`
- `app/api/v1/crm/settings/[key]/route.ts`
- `app/api/v1/crm/settings/bulk/route.ts`

---

## V1 Directory Routes

All V1 Directory routes use middleware authentication.

| #   | Endpoint                              | Methods   | Zod Validators                                         | Purpose                         |
| --- | ------------------------------------- | --------- | ------------------------------------------------------ | ------------------------------- |
| 24  | `/api/v1/directory/countries`         | GET       | `listCountriesSchema`                                  | List countries with regulations |
| 25  | `/api/v1/directory/makes`             | GET, POST | `listMakesSchema`, `createMakeSchema`                  | Car makes                       |
| 26  | `/api/v1/directory/makes/[id]/models` | GET       | None                                                   | Models by make                  |
| 27  | `/api/v1/directory/models`            | POST      | `createModelSchema`                                    | Create model                    |
| 28  | `/api/v1/directory/platforms`         | GET, POST | `listPlatformsSchema`, `createPlatformSchema`          | Ride platforms                  |
| 29  | `/api/v1/directory/regulations`       | GET       | `listRegulationsSchema`                                | Country regulations             |
| 30  | `/api/v1/directory/vehicle-classes`   | GET, POST | `listVehicleClassesSchema`, `createVehicleClassSchema` | Vehicle classes                 |

**Source files:**

- `app/api/v1/directory/countries/route.ts`
- `app/api/v1/directory/makes/route.ts`
- `app/api/v1/directory/makes/[id]/models/route.ts`
- `app/api/v1/directory/models/route.ts`
- `app/api/v1/directory/platforms/route.ts`
- `app/api/v1/directory/regulations/route.ts`
- `app/api/v1/directory/vehicle-classes/route.ts`

---

## V1 Drivers Routes

All V1 Drivers routes use middleware authentication.

| #   | Endpoint                                  | Methods            | Zod Validators                            | Purpose             |
| --- | ----------------------------------------- | ------------------ | ----------------------------------------- | ------------------- |
| 31  | `/api/v1/drivers`                         | GET, POST          | `createDriverSchema`, `driverQuerySchema` | List/create drivers |
| 32  | `/api/v1/drivers/[id]`                    | GET, PATCH, DELETE | `updateDriverSchema`                      | Driver CRUD         |
| 33  | `/api/v1/drivers/[id]/documents`          | GET, POST          | `driverDocumentSchema`                    | Driver documents    |
| 34  | `/api/v1/drivers/[id]/documents/expiring` | GET                | None                                      | Expiring documents  |
| 35  | `/api/v1/drivers/[id]/documents/verify`   | POST               | None (inline)                             | Verify document     |
| 36  | `/api/v1/drivers/[id]/history`            | GET                | None                                      | Driver timeline     |
| 37  | `/api/v1/drivers/[id]/performance`        | GET                | `driverPerformanceQuerySchema`            | Performance metrics |
| 38  | `/api/v1/drivers/[id]/ratings`            | GET                | None (manual)                             | Rating history      |
| 39  | `/api/v1/drivers/[id]/reactivate`         | POST               | None                                      | Reactivate driver   |
| 40  | `/api/v1/drivers/[id]/requests`           | GET                | `driverRequestsQuerySchema`               | Driver requests     |
| 41  | `/api/v1/drivers/[id]/statistics`         | GET                | None (manual)                             | Statistics          |
| 42  | `/api/v1/drivers/[id]/suspend`            | POST               | `driverSuspensionSchema`                  | Suspend driver      |

**Source files:**

- `app/api/v1/drivers/route.ts`
- `app/api/v1/drivers/[id]/route.ts`
- `app/api/v1/drivers/[id]/documents/route.ts`
- `app/api/v1/drivers/[id]/documents/expiring/route.ts`
- `app/api/v1/drivers/[id]/documents/verify/route.ts`
- `app/api/v1/drivers/[id]/history/route.ts`
- `app/api/v1/drivers/[id]/performance/route.ts`
- `app/api/v1/drivers/[id]/ratings/route.ts`
- `app/api/v1/drivers/[id]/reactivate/route.ts`
- `app/api/v1/drivers/[id]/requests/route.ts`
- `app/api/v1/drivers/[id]/statistics/route.ts`
- `app/api/v1/drivers/[id]/suspend/route.ts`

---

## V1 Vehicles Routes

All V1 Vehicles routes use middleware authentication.

| #   | Endpoint                                            | Methods          | Zod Validators                                      | Purpose                |
| --- | --------------------------------------------------- | ---------------- | --------------------------------------------------- | ---------------------- |
| 43  | `/api/v1/vehicles`                                  | GET, POST        | `createVehicleSchema`, `vehicleQuerySchema`         | List/create vehicles   |
| 44  | `/api/v1/vehicles/[id]`                             | GET, PUT, DELETE | `updateVehicleSchema`                               | Vehicle CRUD           |
| 45  | `/api/v1/vehicles/[id]/assign`                      | POST, DELETE     | `vehicleAssignmentSchema`                           | Assign/unassign driver |
| 46  | `/api/v1/vehicles/[id]/expenses`                    | GET, POST        | `createExpenseSchema`, `expenseQuerySchema`         | Vehicle expenses       |
| 47  | `/api/v1/vehicles/[id]/maintenance`                 | GET, POST        | `createMaintenanceSchema`, `maintenanceQuerySchema` | Maintenance records    |
| 48  | `/api/v1/vehicles/[id]/maintenance/[maintenanceId]` | PATCH            | `updateMaintenanceSchema`                           | Update maintenance     |
| 49  | `/api/v1/vehicles/available`                        | GET              | None                                                | Available vehicles     |
| 50  | `/api/v1/vehicles/insurance-expiring`               | GET              | None                                                | Expiring insurance     |
| 51  | `/api/v1/vehicles/maintenance`                      | GET              | None                                                | Maintenance due        |

**Source files:**

- `app/api/v1/vehicles/route.ts`
- `app/api/v1/vehicles/[id]/route.ts`
- `app/api/v1/vehicles/[id]/assign/route.ts`
- `app/api/v1/vehicles/[id]/expenses/route.ts`
- `app/api/v1/vehicles/[id]/maintenance/route.ts`
- `app/api/v1/vehicles/[id]/maintenance/[maintenanceId]/route.ts`
- `app/api/v1/vehicles/available/route.ts`
- `app/api/v1/vehicles/insurance-expiring/route.ts`
- `app/api/v1/vehicles/maintenance/route.ts`

---

## V1 Notifications Routes

All V1 Notifications routes use Clerk authentication.

| #   | Endpoint                        | Methods | Zod Validators       | Purpose           |
| --- | ------------------------------- | ------- | -------------------- | ----------------- |
| 52  | `/api/v1/notifications/history` | GET     | `queryHistorySchema` | Notification logs |
| 53  | `/api/v1/notifications/send`    | POST    | `sendEmailSchema`    | Send notification |
| 54  | `/api/v1/notifications/stats`   | GET     | `getStatsSchema`     | Statistics        |

**Source files:**

- `app/api/v1/notifications/history/route.ts`
- `app/api/v1/notifications/send/route.ts`
- `app/api/v1/notifications/stats/route.ts`

---

## V1 Admin Routes

| #   | Endpoint              | Methods | Zod Validators              | Auth         | Purpose          |
| --- | --------------------- | ------- | --------------------------- | ------------ | ---------------- |
| 55  | `/api/v1/admin/audit` | GET     | `AuditQuerySchema` (inline) | Clerk + RBAC | Query audit logs |

**Source files:**

- `app/api/v1/admin/audit/route.ts`

---

## V1 Dashboard Routes

| #   | Endpoint                   | Methods          | Zod Validators | Auth  | Purpose               |
| --- | -------------------------- | ---------------- | -------------- | ----- | --------------------- |
| 56  | `/api/v1/dashboard/layout` | GET, PUT, DELETE | None (manual)  | Clerk | User dashboard layout |

**Source files:**

- `app/api/v1/dashboard/layout/route.ts`

---

## V1 Test Routes

| #   | Endpoint             | Methods   | Zod Validators | Auth           | Purpose             |
| --- | -------------------- | --------- | -------------- | -------------- | ------------------- |
| 57  | `/api/v1/test`       | GET, POST | None           | Custom headers | Test middleware     |
| 58  | `/api/v1/test-error` | GET       | None           | Public         | Test error handling |

**Source files:**

- `app/api/v1/test/route.ts`
- `app/api/v1/test-error/route.ts`

---

## Zod Validators Index

### By Validator File

| File                                           | Schemas Exported                                                                                                                                                                                                    | Routes Using                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `lib/validators/crm/lead.validators.ts`        | CreateLeadSchema, UpdateLeadSchema                                                                                                                                                                                  | /api/v1/crm/leads                              |
| `lib/validators/crm/opportunity.validators.ts` | CreateOpportunitySchema, UpdateOpportunitySchema                                                                                                                                                                    | /api/v1/crm/opportunities                      |
| `lib/validators/crm/settings.validators.ts`    | CreateSettingSchema, UpdateSettingSchema, BulkUpdateSettingsSchema, GetSettingsQuerySchema                                                                                                                          | /api/v1/crm/settings                           |
| `lib/validators/crm/order.validators.ts`       | CreateOrderFromOpportunitySchema, MarkAsWonFormSchema, OrderQuerySchema, CancelOrderSchema                                                                                                                          | Server Actions                                 |
| `lib/validators/directory.validators.ts`       | list*/create* schemas (9 total)                                                                                                                                                                                     | /api/v1/directory/\*                           |
| `lib/validators/drivers.validators.ts`         | createDriverSchema, updateDriverSchema, driverQuerySchema, driverSuspensionSchema, driverDocumentSchema, driverRequestsQuerySchema, driverPerformanceQuerySchema (7 total)                                          | /api/v1/drivers/\*                             |
| `lib/validators/vehicles.validators.ts`        | createVehicleSchema, updateVehicleSchema, vehicleQuerySchema, vehicleAssignmentSchema, createMaintenanceSchema, updateMaintenanceSchema, maintenanceQuerySchema, createExpenseSchema, expenseQuerySchema (10 total) | /api/v1/vehicles/\*                            |
| `lib/validators/notification.validators.ts`    | sendEmailSchema, queryHistorySchema, getStatsSchema, resendWebhookSchema, selectTemplateSchema (11 total)                                                                                                           | /api/v1/notifications/\*, /api/webhooks/resend |
| `lib/validators/admin.validators.ts`           | TenantCreateSchema, MemberInviteSchema, RoleCreateSchema, etc. (9 total)                                                                                                                                            | Not currently used by routes                   |
| `lib/validators/base.validators.ts`            | paginationSchema, uuidSchema, dateRangeSchema, searchSchema (4 total)                                                                                                                                               | Base schemas                                   |

### Routes Without Zod Validation (26 routes)

| Route                                   | Reason                         |
| --------------------------------------- | ------------------------------ |
| All CRON routes (5)                     | Simple header auth, no body    |
| All demo-leads routes (4)               | Legacy code, inline validation |
| /api/internal/audit                     | Manual JSON parsing            |
| /api/public/countries                   | Read-only, no params           |
| /api/webhooks/clerk                     | Uses Clerk WebhookEvent type   |
| /api/v1/crm/leads/export                | Manual body destructuring      |
| /api/v1/crm/leads/stats                 | Manual param parsing           |
| /api/v1/directory/makes/[id]/models     | No query params                |
| /api/v1/drivers/[id]/documents/expiring | No params                      |
| /api/v1/drivers/[id]/documents/verify   | Inline validation              |
| /api/v1/drivers/[id]/history            | No params                      |
| /api/v1/drivers/[id]/ratings            | Manual validation              |
| /api/v1/drivers/[id]/reactivate         | No body                        |
| /api/v1/drivers/[id]/statistics         | Manual date validation         |
| /api/v1/vehicles/available              | No params                      |
| /api/v1/vehicles/insurance-expiring     | Manual param validation        |
| /api/v1/vehicles/maintenance            | No params                      |
| /api/v1/dashboard/layout                | Manual validation              |
| /api/v1/test                            | Test route                     |
| /api/v1/test-error                      | Test route                     |

---

## Authentication Methods Summary

| Method                           | Routes | Implementation       |
| -------------------------------- | ------ | -------------------- |
| Public                           | 2      | No auth required     |
| CRON_SECRET                      | 5      | Bearer token header  |
| INTERNAL_AUDIT_TOKEN             | 1      | Custom header        |
| Svix Signature                   | 2      | Webhook verification |
| Clerk auth()                     | 5      | Direct Clerk SDK     |
| Middleware (x-user-id, x-org-id) | 43     | FleetCore middleware |

---

## HTTP Methods Distribution

| Method | Count | Usage                |
| ------ | ----- | -------------------- |
| GET    | 45    | List/Read operations |
| POST   | 32    | Create operations    |
| PUT    | 3     | Full updates         |
| PATCH  | 5     | Partial updates      |
| DELETE | 8     | Soft deletes         |

**Note:** Many routes expose multiple methods.

---

_Document generated from codebase analysis. Source of truth: `app/api/\*\*/_.ts`\*
