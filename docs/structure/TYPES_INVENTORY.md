# TYPES & REPOSITORIES INVENTORY - FleetCore

> **Generated from code:** 2025-12-07
> **Source:** `types/`, `lib/core/`, `lib/repositories/`
> **Total:** 8 repositories | 60+ méthodes | 30+ types | 12 sort whitelists

---

## Résumé Global

### Fichiers Core

| Fichier                       | Purpose                     | Exports                         |
| ----------------------------- | --------------------------- | ------------------------------- |
| `lib/core/types.ts`           | Types fondamentaux          | 3 types                         |
| `lib/core/errors.ts`          | Error classes               | 8 classes, 2 helpers            |
| `lib/core/validation.ts`      | sortBy whitelist protection | 2 types, 1 fonction             |
| `lib/core/base.repository.ts` | BaseRepository abstract     | 1 classe abstraite, 7 méthodes  |
| `lib/core/base.service.ts`    | BaseService abstract        | 1 classe abstraite, 10 méthodes |

### Repositories

| Fichier                               | Entity                     | Méthodes | Sort Fields |
| ------------------------------------- | -------------------------- | -------- | ----------- |
| `crm/lead.repository.ts`              | crm_leads                  | 3        | 16          |
| `crm/order.repository.ts`             | crm_orders                 | 9        | 20          |
| `crm/settings.repository.ts`          | crm_settings               | 11       | 10          |
| `crm/country.repository.ts`           | crm_countries              | 5        | 3           |
| `notification-template.repository.ts` | dir_notification_templates | 11       | 7           |
| `notification-log.repository.ts`      | adm_notification_logs      | 9        | 13          |

### Types Domain

| Fichier        | Types Exportés      | Constants      |
| -------------- | ------------------- | -------------- |
| `types/crm.ts` | 16 interfaces/types | 5 const arrays |

---

## 1. lib/core/types.ts

Purpose: Types fondamentaux pour transactions et pagination

### Types Exportés

```typescript
// Type alias for Prisma transaction client
export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

// Standard pagination options
export interface PaginationOptions {
  page?: number; // Default: 1
  limit?: number; // Default: 20, max: 100
  sortBy?: string; // Validated against whitelist
  sortOrder?: "asc" | "desc"; // Default: "desc"
}

// Paginated result wrapper
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
```

---

## 2. lib/core/errors.ts

Purpose: Error classes avec HTTP status codes

### Error Classes

| Class               | Status | Code                    | Usage                   |
| ------------------- | ------ | ----------------------- | ----------------------- |
| `AppError`          | 500    | custom                  | Base class              |
| `ValidationError`   | 400    | VALIDATION_ERROR        | Input format invalide   |
| `NotFoundError`     | 404    | NOT_FOUND               | Resource non trouvée    |
| `UnauthorizedError` | 401    | UNAUTHORIZED            | Token manquant/invalide |
| `ForbiddenError`    | 403    | FORBIDDEN               | Permission insuffisante |
| `ConflictError`     | 409    | CONFLICT                | Duplicate entry (P2002) |
| `DatabaseError`     | 500    | DATABASE_ERROR          | Prisma errors           |
| `BusinessRuleError` | 422    | BUSINESS_RULE_VIOLATION | Domain logic violation  |

### Helpers

```typescript
export function isPrismaError(error: unknown): error is PrismaError;
export function assertDefined<T>(
  value: T | null | undefined,
  errorMessage: string
): T;
```

---

## 3. lib/core/validation.ts

Purpose: sortBy whitelist protection contre SQL injection

```typescript
export type SortFieldWhitelist = NonEmptyArray<string>;

export function validateSortBy(
  sortBy: string,
  whitelist: SortFieldWhitelist,
  tenantId?: string
): void;
```

---

## 4. lib/core/base.repository.ts

Purpose: Abstract base class for repositories

### Méthodes Héritées

| Méthode                                      | Return               | Description                        |
| -------------------------------------------- | -------------------- | ---------------------------------- |
| `findById(id, tenantId?)`                    | `T \| null`          | Find by ID with soft-delete filter |
| `findMany(where, options)`                   | `PaginatedResult<T>` | Paginated query                    |
| `create(data, userId, tenantId?)`            | `T`                  | Create with audit                  |
| `update(id, data, userId, tenantId?)`        | `T`                  | Update with audit                  |
| `softDelete(id, userId, reason?, tenantId?)` | `void`               | Soft delete                        |
| `restore(id, userId, tenantId?)`             | `T`                  | Restore                            |

---

## 5. lib/core/base.service.ts

Purpose: Abstract base class for services

### Méthodes

| Méthode                            | Purpose                       |
| ---------------------------------- | ----------------------------- |
| `executeInTransaction(op)`         | Prisma $transaction wrapper   |
| `handleError(error, context)`      | Map Prisma errors to AppError |
| `validateTenant(tenantId)`         | Check tenant exists + active  |
| `audit(options)`                   | Create audit log              |
| `create/update/softDelete/restore` | CRUD with auto audit          |

---

## 6. Repositories CRM

### lead.repository.ts

```typescript
export const LEAD_SORT_FIELDS = [
  "id", "lead_code", "email", "first_name", "last_name",
  "company_name", "status", "lead_stage",
  "fit_score", "engagement_score", "qualification_score",
  "created_at", "updated_at", "qualified_date", "converted_date",
] as const;

// Methods
findByEmail(email): Promise<LeadWithRelations | null>
countActiveLeads(assignedTo): Promise<number>
generateLeadCode(year, tx?): Promise<string>  // Format: LEAD-YYYY-NNNNN
```

### order.repository.ts

```typescript
export const ORDER_SORT_FIELDS = [
  "id", "contract_reference", "order_reference",
  "effective_date", "expiry_date",
  "total_value", "monthly_value", "annual_value",
  "status", "order_type", "fulfillment_status",
  "billing_cycle", "currency",
  "created_at", "updated_at",
] as const;

// Methods
findByIdWithRelations(id, providerId?)
findByOpportunityId(opportunityId, providerId?)
findByLeadId(leadId, providerId?)
generateOrderReference(year, tx?)  // Format: ORD-YYYY-NNNNN
generateOrderCode(year, tx?)       // Format: O2025-NNN
createOrder(data, userId, tx?)
updateOrder(id, data, userId, providerId?)
countActiveOrders(providerId)
findExpiringWithinDays(providerId, days)
findAutoRenewable(providerId, days)
```

### settings.repository.ts

```typescript
export const SettingCategory = {
  SCORING,
  ASSIGNMENT,
  QUALIFICATION,
  STAGES,
  WORKFLOWS,
  NOTIFICATIONS,
  SLA,
  VALIDATION,
  INTEGRATIONS,
  UI,
};

export const CrmSettingKey = {
  LEAD_SCORING_CONFIG,
  LEAD_ASSIGNMENT_RULES,
  LEAD_STAGES,
  OPPORTUNITY_STAGES,
  OPPORTUNITY_LOSS_REASONS,
};

// Methods
getSetting(key);
getSettingValue<T>(key);
getSettingsByCategory(category);
upsertByKey(key, data, userId);
bulkUpdate(updates, userId);
toggleActive(key, userId);
softDeleteByKey(key, userId);
```

### country.repository.ts

```typescript
// Methods
findByCode(countryCode);
isGdprCountry(countryCode); // EU/EEA check
isOperationalCountry(countryCode); // FleetCore active
findAllVisible();
countGdprCountries(); // Should return 30
```

---

## 7. Repositories Notification

### notification-template.repository.ts

```typescript
export const NOTIFICATION_TEMPLATE_SORT_FIELDS = [
  "id", "template_code", "template_name",
  "channel", "status", "created_at", "updated_at",
] as const;

// Methods
findByTemplateCode(code, channel)
findByChannel(channel, options)
findByCountryAndLocale(country, locale, channel?)
findByLocale(locale, channel?)
findByCountry(country, channel?)
findActive(channel?)
templateExists(code, channel)
getAllTemplateCodes()
getAvailableChannels()
getTemplateForLocale(code, channel, locale, fallback?)
```

### notification-log.repository.ts

```typescript
export const NOTIFICATION_LOG_SORT_FIELDS = [
  "id", "tenant_id", "recipient_id", "recipient_email",
  "template_code", "channel", "locale_used", "status",
  "sent_at", "delivered_at", "opened_at", "clicked_at", "failed_at",
  "created_at", "updated_at",
] as const;

// Methods
findByRecipient(recipientId, tenantId?, options)
findByStatus(status, tenantId?, options)
findByTemplateCode(templateCode, tenantId?, options)
findByEmail(email, options)
updateStatus(id, status, metadata?)  // Resend webhook
getStats(tenantId?, startDate?, endDate?)
getTemplateStats(tenantId?, limit?)
findByExternalId(externalId)
```

---

## 8. types/crm.ts

### Constants

```typescript
export const LEAD_STATUS_VALUES = [
  "new",
  "contacted",
  "working",
  "qualified",
  "disqualified",
  "converted",
  "lost",
];
export const LEAD_STAGE_VALUES = [
  "top_of_funnel",
  "marketing_qualified",
  "sales_qualified",
  "opportunity",
];
export const FLEET_SIZE_VALUES = ["1-10", "11-50", "51-100", "101-500", "500+"];
export const OPPORTUNITY_STATUS_VALUES = [
  "open",
  "won",
  "lost",
  "on_hold",
  "cancelled",
];
export const OPPORTUNITY_STAGE_VALUES = [
  "qualification",
  "demo",
  "proposal",
  "negotiation",
  "contract_sent",
];
```

### Lead Interface

```typescript
interface Lead {
  id: string;
  lead_code: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  company_name: string | null;
  fleet_size: string | null;
  country_code: string | null;
  status: LeadStatus;
  lead_stage: LeadStage | null;
  priority: LeadPriority | null;
  fit_score: number | null;
  engagement_score: number | null;
  qualification_score: number | null;
  assigned_to: { id; first_name; last_name } | null;
  gdpr_consent: boolean | null;
  created_at: string;
  updated_at: string | null;
  // ... more fields
}
```

### Opportunity Interface

```typescript
interface Opportunity {
  id: string;
  lead_id: string;
  stage: OpportunityStage;
  status: OpportunityStatus;
  expected_value: number | null;
  probability_percent: number | null;
  forecast_value: number | null;
  currency: string | null;
  expected_close_date: string | null;
  stage_entered_at: string;
  max_days_in_stage: number | null;
  loss_reason: string | null;
  // ... more fields
}
```

---

## Architecture Patterns

### Multi-Tenant Isolation

| Pattern            | Tables         | Mechanism           |
| ------------------ | -------------- | ------------------- |
| `tenant_id` direct | adm*\*, rid*\* | WHERE tenant_id = ? |
| `provider_id`      | crm_orders     | Multi-division      |
| `assigned_to`      | crm_leads      | Via employee        |
| Hybrid filter      | crm_settings   | System + Custom     |

### Soft-Delete

All repositories with deleted_at:

- `findById()` filters deleted_at = null
- `softDelete()` sets deleted_at, deleted_by
- `restore()` clears these fields

---

## Dernière mise à jour

- Date: 2025-12-07
- Repositories: 8
- Core files: 5
- Types: 16 interfaces
