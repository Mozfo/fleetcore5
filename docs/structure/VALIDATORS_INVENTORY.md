# VALIDATORS INVENTORY - FleetCore

> **Generated from code:** 2025-12-07
> **Source:** `lib/validators/**/*.ts`
> **Total:** 11 fichiers | 91 schemas | 5 enums | 4 constants | 6 utility functions

---

## 📊 Résumé par Fichier

| Fichier                         | Schemas | Enums | Constants | Utilities | Types Exportés |
| ------------------------------- | ------- | ----- | --------- | --------- | -------------- |
| `base.validators.ts`            | 4       | 0     | 0         | 0         | 3              |
| `admin.validators.ts`           | 9       | 0     | 0         | 0         | 9              |
| `crm.validators.ts`             | 10      | 0     | 0         | 0         | 10             |
| `directory.validators.ts`       | 9       | 0     | 0         | 0         | 9              |
| `drivers.validators.ts`         | 7       | 0     | 0         | 0         | 7              |
| `notification.validators.ts`    | 11      | 0     | 0         | 3         | 8              |
| `vehicles.validators.ts`        | 10      | 0     | 0         | 0         | 11             |
| `crm/lead.validators.ts`        | 4       | 0     | 0         | 1         | 5              |
| `crm/opportunity.validators.ts` | 2       | 0     | 0         | 0         | 2              |
| `crm/order.validators.ts`       | 6       | 0     | 4         | 0         | 10             |
| `crm/settings.validators.ts`    | 19      | 5     | 0         | 3         | 22             |
| **TOTAL**                       | **91**  | **5** | **4**     | **7**     | **96**         |

---

## 📁 1. base.validators.ts

> **Path:** `lib/validators/base.validators.ts`
> **Purpose:** Schemas réutilisables pour pagination, UUID, dates

| Schema             | Type   | Description         | Fields clés                            |
| ------------------ | ------ | ------------------- | -------------------------------------- |
| `paginationSchema` | object | Pagination standard | `page`, `limit`, `sortBy`, `sortOrder` |
| `uuidSchema`       | string | Validation UUID     | `.uuid()`                              |
| `dateRangeSchema`  | object | Range de dates      | `startDate`, `endDate` + refinement    |
| `searchSchema`     | object | Recherche texte     | `query`, `fields[]`                    |

### Types Exportés

```typescript
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
```

---

## 📁 2. admin.validators.ts

> **Path:** `lib/validators/admin.validators.ts`
> **Purpose:** Validation Admin - Tenants, Members, Roles avec RBAC

### Tenant Schemas

| Schema               | Type    | Description     | Validation clés                                                                                               |
| -------------------- | ------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `TenantCreateSchema` | object  | Création tenant | `name`, `slug` (kebab-case), `clerk_organization_id` (org\_\*), `country_code`, `max_members`, `max_vehicles` |
| `TenantUpdateSchema` | partial | Mise à jour     | `.partial()` de TenantCreateSchema                                                                            |

### Member Schemas

| Schema               | Type   | Description        | Validation clés                                                                          |
| -------------------- | ------ | ------------------ | ---------------------------------------------------------------------------------------- |
| `MemberInviteSchema` | object | Invitation membre  | `email`, `role_id` (UUID), `invitation_type` (initial_admin \| additional_user)          |
| `MemberUpdateSchema` | object | Mise à jour profil | `first_name`, `last_name`, `preferred_language` (en\|fr\|ar), `notification_preferences` |
| `MemberQuerySchema`  | object | Query params GET   | pagination + `status`, `role_id`, `team_id`, `two_factor_enabled`, `search`              |

### Role Schemas

| Schema                 | Type    | Description      | Validation clés                                                                       |
| ---------------------- | ------- | ---------------- | ------------------------------------------------------------------------------------- |
| `PermissionCRUDSchema` | object  | Permissions CRUD | `create`, `read`, `update`, `delete` (booleans)                                       |
| `RoleCreateSchema`     | object  | Création rôle    | `name`, `description`, `permissions` (CRUD par ressource), `is_system`, `max_members` |
| `RoleUpdateSchema`     | partial | Mise à jour      | `.partial()` de RoleCreateSchema                                                      |
| `RoleQuerySchema`      | object  | Query params GET | pagination + `status`, `is_system`, `is_default`, `search`                            |

### Types Exportés

```typescript
export type TenantCreateInput = z.infer<typeof TenantCreateSchema>;
export type TenantUpdateInput = z.infer<typeof TenantUpdateSchema>;
export type MemberInviteInput = z.infer<typeof MemberInviteSchema>;
export type MemberUpdateInput = z.infer<typeof MemberUpdateSchema>;
export type MemberQueryInput = z.infer<typeof MemberQuerySchema>;
export type RoleCreateInput = z.infer<typeof RoleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof RoleUpdateSchema>;
export type RoleQueryInput = z.infer<typeof RoleQuerySchema>;
```

---

## 📁 3. crm.validators.ts

> **Path:** `lib/validators/crm.validators.ts`
> **Purpose:** Validation CRM legacy - Leads, Opportunities, Orders (public form)

### Lead Schemas

| Schema              | Type    | Description                 | Validation clés                                                                                                                        |
| ------------------- | ------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `LeadCreateSchema`  | object  | Création lead (public form) | `email`, `phone` (E.164), `first_name`/`last_name` (no digits), `fleet_size` enum, `country_code`, `gdpr_consent` + refinement GDPR EU |
| `LeadUpdateSchema`  | partial | Mise à jour                 | `.partial()` de LeadCreateSchema                                                                                                       |
| `LeadQualifySchema` | object  | Qualification               | `lead_stage` (sales_qualified\|marketing_qualified), `qualification_score` (0-100), `qualification_notes`                              |
| `LeadQuerySchema`   | object  | Query params GET            | pagination + `status`, `lead_stage`, `country_code`, `assigned_to`, `source_id`, `search`, `created_after/before`                      |

### Opportunity Schemas

| Schema                    | Type    | Description          | Validation clés                                                                                                                                 |
| ------------------------- | ------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `OpportunityCreateSchema` | object  | Création opportunity | `lead_id`, `stage` (OPPORTUNITY_STAGE_VALUES), `status`, `expected_value`, `probability_percent`, `expected_close_date` (max 2 ans), `currency` |
| `OpportunityUpdateSchema` | partial | Mise à jour          | `.partial()` de OpportunityCreateSchema                                                                                                         |
| `OpportunityQuerySchema`  | object  | Query params GET     | pagination + `stage`, `status`, `pipeline_id`, `assigned_to`, `min/max_value`, `close_date_after/before`                                        |

### Order Schemas (Legacy)

| Schema              | Type    | Description      | Validation clés                                                                                                                             |
| ------------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `OrderCreateSchema` | object  | Création order   | `opportunity_id`, `start_date`, `end_date`, `total_value` (min 100), `billing_cycle`, `auto_renew` + refinements (end > start, min 30 days) |
| `OrderUpdateSchema` | partial | Mise à jour      | `.partial()` de OrderCreateSchema                                                                                                           |
| `OrderQuerySchema`  | object  | Query params GET | pagination + `status`, `billing_cycle`, `auto_renew`, `tenant_id`, `renewal_date_within_days`                                               |

### Refinements GDPR

```typescript
.refine((data) => {
  const euCountries = ["FR", "DE", "IT", ...]; // 27 EU countries
  if (euCountries.includes(data.country_code)) {
    return data.gdpr_consent === true;
  }
  return true;
}, { message: "Le consentement RGPD est obligatoire pour les pays de l'UE" })
```

---

## 📁 4. directory.validators.ts

> **Path:** `lib/validators/directory.validators.ts`
> **Purpose:** Validation Directory - Countries, Makes, Models, Platforms, Regulations, Vehicle Classes

| Schema                     | Type   | Description           | Validation clés                                                 |
| -------------------------- | ------ | --------------------- | --------------------------------------------------------------- |
| `listCountriesSchema`      | object | Query GET countries   | `sortBy` (country_code\|currency\|timezone), `sortOrder`        |
| `listMakesSchema`          | object | Query GET makes       | `search`, `sortBy` (name\|created_at), `sortOrder`              |
| `createMakeSchema`         | object | POST make             | `name` (required), `code` (required)                            |
| `createModelSchema`        | object | POST model            | `make_id` (UUID), `name`, `code`, `vehicle_class_id` (optional) |
| `listPlatformsSchema`      | object | Query GET platforms   | `search`, `sortBy`, `sortOrder`                                 |
| `createPlatformSchema`     | object | POST platform         | `name`, `code`, `api_config` (JSONB optional)                   |
| `listRegulationsSchema`    | object | Query GET regulations | `country_code` (ISO 3166-1 alpha-2)                             |
| `listVehicleClassesSchema` | object | Query GET classes     | `country_code`, `search`, `sortBy`, `sortOrder`                 |
| `createVehicleClassSchema` | object | POST vehicle class    | `country_code`, `name`, `code`, `description`, `max_age`        |

### Types Exportés

```typescript
export type ListCountriesInput = z.infer<typeof listCountriesSchema>;
export type ListMakesInput = z.infer<typeof listMakesSchema>;
export type CreateMakeInput = z.infer<typeof createMakeSchema>;
export type CreateModelInput = z.infer<typeof createModelSchema>;
export type ListPlatformsInput = z.infer<typeof listPlatformsSchema>;
export type CreatePlatformInput = z.infer<typeof createPlatformSchema>;
export type ListRegulationsInput = z.infer<typeof listRegulationsSchema>;
export type ListVehicleClassesInput = z.infer<typeof listVehicleClassesSchema>;
export type CreateVehicleClassInput = z.infer<typeof createVehicleClassSchema>;
```

---

## 📁 5. drivers.validators.ts

> **Path:** `lib/validators/drivers.validators.ts`
> **Purpose:** Validation Fleet Drivers - UAE compliance, documents, performance

| Schema                         | Type           | Description       | Validation clés                                                                                                                                                                                                                                     |
| ------------------------------ | -------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createDriverSchema`           | object         | Création driver   | `first_name`, `last_name`, `email`, `phone` (E.164), `license_number`, `date_of_birth`, `gender`, `nationality` (ISO 3166-1), `hire_date`, `employment_status`, `cooperation_type`, `emergency_contact_*`, `languages[]` + refinement license dates |
| `updateDriverSchema`           | partial+extend | Mise à jour       | `.partial()` + `driver_status`, `rating` (0-5)                                                                                                                                                                                                      |
| `driverQuerySchema`            | object         | Query params GET  | pagination + `driver_status`, `cooperation_type`, `rating_min/max`, `search`, `has_active_assignment`, `expiring_documents` + refinement rating range                                                                                               |
| `driverSuspensionSchema`       | object         | Suspension        | `reason` (5-500 chars), `metadata`                                                                                                                                                                                                                  |
| `driverDocumentSchema`         | object         | Upload document   | `document_type` (driving_license\|professional_card\|national_id), `file_url`, `issue_date`, `expiry_date`, `verified` + refinement dates                                                                                                           |
| `driverRequestsQuerySchema`    | object         | Query requests    | pagination + `status`, `request_type`, `from_date`, `to_date` + refinement dates                                                                                                                                                                    |
| `driverPerformanceQuerySchema` | object         | Query performance | `from_date`, `to_date`, `platform` + refinement dates                                                                                                                                                                                               |

### UAE Compliance Fields

```typescript
// Fields required for UAE RTA compliance:
date_of_birth: z.coerce.date();
gender: z.enum(["male", "female", "unspecified"]);
nationality: z.string()
  .length(2)
  .regex(/^[A-Z]{2}$/);
languages: z.array(z.string().length(2));
emergency_contact_name: z.string().min(1);
emergency_contact_phone: z.string().min(1);
professional_card_no: z.string().optional();
professional_expiry: z.coerce.date().optional();
```

---

## 📁 6. notification.validators.ts

> **Path:** `lib/validators/notification.validators.ts`
> **Purpose:** Validation Notifications - Email, SMS, Webhooks, 6-level CASCADE

| Schema                           | Type   | Description                 | Validation clés                                                                                                                 |
| -------------------------------- | ------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `countryCodeSchema`              | string | ISO 3166-1 alpha-2          | `.length(2).regex(/^[A-Z]{2}$/)`                                                                                                |
| `localeSchema`                   | string | ISO 639-1 locale            | `.regex(/^[a-z]{2}(-[A-Z]{2})?$/)` (en, fr, en-US)                                                                              |
| `notificationChannelSchema`      | enum   | Canal                       | email \| sms \| slack \| webhook \| push                                                                                        |
| `notificationStatusSchema`       | enum   | Status                      | pending \| sent \| delivered \| bounced \| opened \| clicked \| failed                                                          |
| `templateVariablesSchema`        | record | Variables template          | key → string\|number\|boolean\|Date\|null                                                                                       |
| `sendEmailSchema`                | object | POST send email             | `recipientEmail`, `templateCode`, `variables`, `userId`, `tenantId`, `leadId`, `countryCode`, `fallbackLocale`, `metadata`      |
| `queryHistorySchema`             | object | GET history                 | pagination + `tenantId`, `recipientId`, `recipientEmail`, `status`, `templateCode`, `channel`, `startDate`, `endDate`, `sortBy` |
| `updateNotificationStatusSchema` | object | Webhook update              | `id`, `status`, timestamps (sent_at, delivered_at, etc.), `error_message`, `external_id`                                        |
| `resendWebhookSchema`            | object | Resend webhook              | `type` (email.sent\|delivered\|bounced\|opened\|clicked), `data` (email_id, created_at, from, to, subject)                      |
| `getStatsSchema`                 | object | GET stats                   | `tenantId`, `startDate`, `endDate`                                                                                              |
| `selectTemplateSchema`           | object | Internal template selection | `templateCode`, `channel`, CASCADE params (userId, tenantId, leadId, countryCode, fallbackLocale)                               |

### Utility Functions

```typescript
export function isValidTemplateCode(code: string): boolean;
export function isValidCountryCode(code: string): boolean;
export function isValidLocale(locale: string): boolean;
```

---

## 📁 7. vehicles.validators.ts

> **Path:** `lib/validators/vehicles.validators.ts`
> **Purpose:** Validation Fleet Vehicles - Maintenance, Expenses

### Vehicle Core Schemas

| Schema                     | Type           | Description        | Validation clés                                                                                                                                                                                                                |
| -------------------------- | -------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createVehicleSchema`      | object         | Création vehicle   | `make_id`, `model_id`, `license_plate`, `vin` (17 chars, no I/O/Q), `year` (1900-currentYear+1), `seats` (2-50), `fuel_type`, `transmission`, `registration_date`, `insurance_*`, `odometer`, `ownership_type`, `country_code` |
| `updateVehicleSchema`      | partial+extend | Mise à jour        | `.partial()` + `status` (active\|inactive\|maintenance\|retired\|sold)                                                                                                                                                         |
| `vehicleAssignmentSchema`  | object         | Assignation driver | `driver_id`, `start_date`, `end_date`, `assignment_type`, `notes` + refinement dates                                                                                                                                           |
| `vehicleQuerySchema`       | object         | Query params GET   | pagination + `status`, `make_id`, `model_id`, `vehicle_class`, `fuel_type`, `min/max_year`, `min/max_seats`, `sortBy`                                                                                                          |
| `vehicleMaintenanceSchema` | object         | Legacy maintenance | `vehicle_id`, `maintenance_type`, `scheduled_date`, `provider_*`, `estimated_cost`, `notes`                                                                                                                                    |

### Fleet Maintenance Schemas

| Schema                    | Type   | Description          | Validation clés                                                                                                                      |
| ------------------------- | ------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `createMaintenanceSchema` | object | Création maintenance | `maintenance_type` enum, `scheduled_date` (future), `description`, `provider_*`, `cost_amount`, `cost_currency`, `notes`, `metadata` |
| `updateMaintenanceSchema` | object | Mise à jour          | Tous optionnels + `status`, `completed_date` + refinement (completed → completed_date required)                                      |
| `maintenanceQuerySchema`  | object | Query params GET     | pagination + `status`, `maintenance_type`, `from/to_date`, `sortBy`                                                                  |

### Fleet Expenses Schemas

| Schema                | Type   | Description      | Validation clés                                                                                                                                   |
| --------------------- | ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createExpenseSchema` | object | Création expense | `expense_date` (past), `expense_category` enum, `amount` (positive), `currency`, `description`, `driver_id`, `ride_id`, `receipt_number`, `notes` |
| `expenseQuerySchema`  | object | Query params GET | pagination + `expense_category`, `reimbursed`, `from/to_date`, `sortBy`                                                                           |

### Enums importants

```typescript
fuel_type: "petrol" |
  "diesel" |
  "hybrid" |
  "electric" |
  "lng" |
  "cng" |
  "lpg" |
  "hydrogen";
transmission: "manual" | "automatic" | "semi-automatic" | "cvt" | "dct";
ownership_type: "owned" | "leased" | "rented" | "investor" | "partner";
maintenance_type: "oil_change" |
  "service" |
  "inspection" |
  "tire_rotation" |
  "brake_service" |
  "repair" |
  "other";
expense_category: "fuel" |
  "toll" |
  "parking" |
  "wash" |
  "repair" |
  "fine" |
  "other";
```

---

## 📁 8. crm/lead.validators.ts

> **Path:** `lib/validators/crm/lead.validators.ts`
> **Purpose:** Validation API v1 Leads - Création, Update, Réponses

| Schema                       | Type   | Description                  | Validation clés                                                                                                                                                                                                                                                   |
| ---------------------------- | ------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateLeadSchema`           | object | POST /api/v1/crm/leads       | `email` (required), `first_name`, `last_name`, `phone`, `company_name`, `fleet_size`, `country_code`, `city`, `website_url`, `current_software`, `message` (10-5000), `priority`, `assigned_to_id`, `source` enum, UTM params, `gdpr_consent`, `metadata` (JSONB) |
| `UpdateLeadSchema`           | object | PATCH /api/v1/crm/leads/[id] | Tous optionnels avec `z.preprocess(emptyToNull, ...)` pour gérer "" → null                                                                                                                                                                                        |
| `LeadCreationResponseSchema` | object | Réponse succès               | `success: true`, `data` (id, lead_code, email, status, priority, scores, assignment), `message`                                                                                                                                                                   |
| `ErrorResponseSchema`        | object | Réponse erreur               | `success: false`, `error` (code, message, details)                                                                                                                                                                                                                |

### Helper Function

```typescript
// Convert empty strings to null (HTML form "" → null)
const emptyToNull = <T>(val: T): T | null => (val === "" ? null : val);
```

### Différences avec crm.validators.ts (public form)

| Aspect               | lead.validators.ts (API v1) | crm.validators.ts (Public form) |
| -------------------- | --------------------------- | ------------------------------- |
| first_name/last_name | Séparés                     | Séparés                         |
| phone                | Optionnel                   | Requis                          |
| message length       | 10-5000 chars               | max 1000 chars                  |
| GDPR                 | Optionnel                   | Requis (avec refinement EU)     |
| metadata             | JSONB flexible              | Non                             |

---

## 📁 9. crm/opportunity.validators.ts

> **Path:** `lib/validators/crm/opportunity.validators.ts`
> **Purpose:** Validation API v1 Opportunities

| Schema                    | Type   | Description                    | Validation clés                                                                                                                                                                                                              |
| ------------------------- | ------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateOpportunitySchema` | object | POST /api/v1/crm/opportunities | `lead_id` (required UUID), `expected_value` (required, positive, max 100M), `stage` (default: qualification), `status` (default: open), `currency` (default: EUR), `expected_close_date`, `assigned_to`, `notes`, `metadata` |
| `UpdateOpportunitySchema` | object | PATCH                          | `stage`, `status`, `expected_value`, `probability_percent`, `currency`, dates (expected_close, close, won, lost), `loss_reason`, `assigned_to`, `notes`, `metadata`                                                          |

### Imports externes

```typescript
import { OPPORTUNITY_STAGE_VALUES } from "@/lib/config/opportunity-stages";
import { OPPORTUNITY_STATUS_VALUES } from "@/types/crm";
```

---

## 📁 10. crm/order.validators.ts

> **Path:** `lib/validators/crm/order.validators.ts`
> **Purpose:** Validation Quote-to-Cash - Orders, MarkAsWon, Fulfillment

### Constants Exportées

| Constant               | Values                                                                             | Usage                         |
| ---------------------- | ---------------------------------------------------------------------------------- | ----------------------------- |
| `BILLING_CYCLES`       | monthly, quarterly, semi_annual, annual                                            | crm_orders.billing_cycle      |
| `FULFILLMENT_STATUSES` | pending, ready_for_fulfillment, in_progress, fulfilled, active, cancelled, expired | crm_orders.fulfillment_status |
| `ORDER_TYPES`          | new, renewal, upgrade, downgrade, amendment                                        | crm_orders.order_type         |
| `CURRENCIES`           | EUR, USD, AED, GBP, SAR, QAR                                                       | Devises FleetCore             |

### API Schemas

| Schema                             | Type   | Description             | Validation clés                                                                                                                                                                                                                                     |
| ---------------------------------- | ------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateOrderFromOpportunitySchema` | object | POST /api/v1/crm/orders | `opportunityId` (UUID), `totalValue` (min 100), `currency` (ISO 4217), `billingCycle`, `effectiveDate` (future), `durationMonths` (1-120), `autoRenew`, `noticePeriodDays` (0-365), `orderType`, `monthlyValue`, `annualValue`, `notes`, `metadata` |
| `OrderQuerySchema`                 | object | GET /api/v1/crm/orders  | pagination + `status`, `fulfillmentStatus`, `orderType`, `billingCycle`, `autoRenew`, `opportunityId`, `leadId`, value range, date ranges, `expiringWithinDays`, `search`                                                                           |

### UI Form Schema

| Schema                | Type   | Description         | Validation clés                                                                                                                                                        |
| --------------------- | ------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MarkAsWonFormSchema` | object | MarkAsWonModal form | `wonValue` (string → number), `billingCycle`, `effectiveDate` (string), `durationMonths` (string → number), `autoRenew`, `noticePeriodDays` (string → number), `notes` |

### Status Update Schemas

| Schema                          | Type   | Description       | Validation clés                              |
| ------------------------------- | ------ | ----------------- | -------------------------------------------- |
| `UpdateOrderStatusSchema`       | object | PATCH status      | `orderId` (UUID), `status` (string)          |
| `UpdateFulfillmentStatusSchema` | object | PATCH fulfillment | `orderId` (UUID), `fulfillmentStatus` (enum) |
| `CancelOrderSchema`             | object | POST cancel       | `orderId` (UUID), `reason` (10-500 chars)    |

### Types Exportés

```typescript
export type BillingCycle = (typeof BILLING_CYCLES)[number];
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];
export type OrderType = (typeof ORDER_TYPES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type CreateOrderFromOpportunityInput = z.infer<
  typeof CreateOrderFromOpportunitySchema
>;
export type MarkAsWonFormInput = z.infer<typeof MarkAsWonFormSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdateFulfillmentStatusInput = z.infer<
  typeof UpdateFulfillmentStatusSchema
>;
export type OrderQueryInput = z.infer<typeof OrderQuerySchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
```

---

## 📁 11. crm/settings.validators.ts

> **Path:** `lib/validators/crm/settings.validators.ts`
> **Purpose:** Validation CRM Settings - Pipelines, Stages, Loss Reasons (ZERO HARDCODING)

### Enums Exportés

| Enum                     | Values                                                                                                  | Usage                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------- |
| `SettingCategoryEnum`    | scoring, assignment, qualification, stages, workflows, notifications, sla, validation, integrations, ui | crm_settings.category       |
| `SettingDataTypeEnum`    | object, array, string, number, boolean                                                                  | crm_settings.data_type      |
| `StageColorEnum`         | blue, purple, green, red, yellow, orange, emerald, gray, indigo, pink                                   | UI stage badges             |
| `LossReasonCategoryEnum` | price, product, competition, timing, other                                                              | Catégorisation loss reasons |
| `LeadAutoActionEnum`     | assign_to_queue, calculate_score, archive, add_to_sequence, create_opportunity, send_notification       | Automations lead stages     |

### Generic Settings CRUD

| Schema                     | Type   | Description                                                                                                                                                             |
| -------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateSettingSchema`      | object | `setting_key` (snake_case), `setting_value` (JSONB), `category`, `data_type`, `description`, `display_label`, `help_text`, `ui_component`, `display_order`, `is_system` |
| `UpdateSettingSchema`      | object | Tous optionnels sauf key                                                                                                                                                |
| `BulkUpdateSettingsSchema` | object | `updates[]` (max 10) avec key + value                                                                                                                                   |

### Lead Stages Configuration

| Schema                   | Type   | Description                                                                                   |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------- |
| `LeadStageSchema`        | object | `value` (snake_case), `label_en`, `label_fr`, `color`, `order`, `is_active`, `auto_actions[]` |
| `LeadStagesConfigSchema` | object | `stages[]` (2-10), `transitions` (from → to[]), `default_stage`                               |

### Opportunity Pipeline Configuration

| Schema                            | Type   | Description                                                                                           |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `OpportunityStageSchema`          | object | `value`, labels, `probability`, `max_days`, `color`, `order`, `deal_rotting`, `is_active`             |
| `FinalStagesSchema`               | object | `won` (probability: 100), `lost` (probability: 0)                                                     |
| `DealRottingConfigSchema`         | object | `enabled`, `use_stage_max_days`, `global_threshold_days`, `alert_owner`, `alert_manager`, `cron_time` |
| `OpportunityPipelineConfigSchema` | object | `stages[]` (2-8), `final_stages`, `rotting`                                                           |

### Loss Reasons Configuration

| Schema                         | Type   | Description                                                                                                           |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------- |
| `LossReasonSchema`             | object | `value`, labels, `category`, `order`, `is_active`, `is_recoverable`, `recovery_delay_days`, `require_competitor_name` |
| `RecoveryWorkflowConfigSchema` | object | `auto_create_followup`, `send_reminder_email`, `reminder_days_before`, `auto_reopen`                                  |
| `LossReasonsConfigSchema`      | object | `default`, `reasons[]` (1-20), `recovery_workflow`                                                                    |

### API Request/Response

| Schema                   | Type   | Description                               |
| ------------------------ | ------ | ----------------------------------------- |
| `GetSettingsQuerySchema` | object | `category`, `include_inactive`            |
| `SettingResponseSchema`  | object | Full setting with id, version, timestamps |

### Validation Helpers

```typescript
export function validateStageTransitions(
  stages: { value: string }[],
  transitions: Record<string, string[]>
): { valid: boolean; errors: string[] };

export function validateDefaultStage(
  stages: { value: string }[],
  defaultStage: string
): boolean;

export function validateStageOrders(stages: { order: number }[]): {
  valid: boolean;
  errors: string[];
};
```

---

## 🔗 Patterns de Validation

### 1. Pattern Pagination Standard

```typescript
page: z.coerce.number().int().min(1).default(1),
limit: z.coerce.number().int().min(1).max(100).default(20),
sortBy: z.enum([...]).default("created_at"),
sortOrder: z.enum(["asc", "desc"]).default("desc"),
```

### 2. Pattern UUID Validation

```typescript
id: z.string().uuid("Invalid UUID format");
```

### 3. Pattern E.164 Phone

```typescript
phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "E.164 format required");
```

### 4. Pattern ISO Country Code

```typescript
country_code: z.string()
  .length(2)
  .regex(/^[A-Z]{2}$/)
  .toUpperCase();
```

### 5. Pattern Date Range Refinement

```typescript
.refine((data) => {
  if (data.from_date && data.to_date) {
    return data.from_date <= data.to_date;
  }
  return true;
}, { message: "from_date must be before to_date", path: ["to_date"] })
```

### 6. Pattern Empty String to Null

```typescript
const emptyToNull = <T>(val: T): T | null => (val === "" ? null : val);
// Usage: z.preprocess(emptyToNull, z.string().optional().nullable())
```

### 7. Pattern GDPR Conditional

```typescript
.refine((data) => {
  const euCountries = ["FR", "DE", ...];
  if (euCountries.includes(data.country_code)) {
    return data.gdpr_consent === true;
  }
  return true;
}, { message: "GDPR consent required for EU", path: ["gdpr_consent"] })
```

---

## 📊 Utilisations par Route API

| Route                                     | Validators utilisés                         |
| ----------------------------------------- | ------------------------------------------- |
| POST /api/demo-leads                      | `LeadCreateSchema` (crm.validators.ts)      |
| GET /api/v1/crm/leads                     | `LeadQuerySchema`                           |
| POST /api/v1/crm/leads                    | `CreateLeadSchema` (crm/lead.validators.ts) |
| PATCH /api/v1/crm/leads/[id]              | `UpdateLeadSchema`                          |
| GET /api/v1/crm/opportunities             | `OpportunityQuerySchema`                    |
| POST /api/v1/crm/opportunities            | `CreateOpportunitySchema`                   |
| POST /api/v1/crm/orders                   | `CreateOrderFromOpportunitySchema`          |
| GET /api/v1/crm/orders                    | `OrderQuerySchema`                          |
| PATCH /api/v1/crm/orders/[id]/status      | `UpdateOrderStatusSchema`                   |
| PATCH /api/v1/crm/orders/[id]/fulfillment | `UpdateFulfillmentStatusSchema`             |
| POST /api/v1/crm/orders/[id]/cancel       | `CancelOrderSchema`                         |
| GET /api/v1/crm/settings                  | `GetSettingsQuerySchema`                    |
| POST /api/v1/crm/settings                 | `CreateSettingSchema`                       |
| PUT /api/v1/crm/settings/[key]            | `UpdateSettingSchema`                       |
| POST /api/v1/notifications/send           | `sendEmailSchema`                           |
| GET /api/v1/notifications/history         | `queryHistorySchema`                        |
| POST /api/webhooks/resend                 | `resendWebhookSchema`                       |
| GET /api/v1/admin/members                 | `MemberQuerySchema`                         |
| POST /api/v1/admin/members/invite         | `MemberInviteSchema`                        |
| GET /api/v1/admin/roles                   | `RoleQuerySchema`                           |
| POST /api/v1/admin/roles                  | `RoleCreateSchema`                          |
| GET /api/v1/directory/\*                  | `list*Schema`                               |
| POST /api/v1/directory/\*                 | `create*Schema`                             |
| GET /api/v1/drivers                       | `driverQuerySchema`                         |
| POST /api/v1/drivers                      | `createDriverSchema`                        |
| GET /api/v1/vehicles                      | `vehicleQuerySchema`                        |
| POST /api/v1/vehicles                     | `createVehicleSchema`                       |
| GET /api/v1/vehicles/[id]/maintenance     | `maintenanceQuerySchema`                    |
| POST /api/v1/vehicles/[id]/maintenance    | `createMaintenanceSchema`                   |
| GET /api/v1/vehicles/[id]/expenses        | `expenseQuerySchema`                        |
| POST /api/v1/vehicles/[id]/expenses       | `createExpenseSchema`                       |

---

## ⚠️ Notes Techniques

### Coercion pour Query Params

```typescript
// Query params arrivent comme strings, .coerce convertit automatiquement
page: z.coerce.number(); // "1" → 1
limit: z.coerce.number(); // "20" → 20
startDate: z.coerce.date(); // "2025-01-01" → Date
```

### Différence entre .partial() et champs optionnels

```typescript
// .partial() rend TOUS les champs optionnels
UpdateSchema = CreateSchema.partial();

// Champs optionnels dans Create restent optionnels
// Champs requis dans Create deviennent optionnels
```

### Validation i18n

```typescript
// Messages d'erreur en français pour les formulaires publics
.min(1, "L'email est requis")

// Messages en anglais pour les API internes
.min(1, "Email is required")
```

---

## 🔄 Dernière mise à jour

- **Date:** 2025-12-07
- **Fichiers analysés:** 11
- **Total schemas:** 91
- **Total enums:** 5
- **Total constants:** 4
- **Total utilities:** 7
