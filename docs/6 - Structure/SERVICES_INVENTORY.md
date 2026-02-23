# SERVICES INVENTORY - FleetCore

> **Generated from code**: 2025-12-07
> **Source of truth**: `lib/services/**/*.ts`
> **Total services**: 15 fichiers
> **Total public methods**: 106 methodes

---

## RESUME STATISTIQUE

| Categorie        | Fichiers | Methodes Publiques | Pattern                  |
| ---------------- | -------- | ------------------ | ------------------------ |
| CRM              | 6        | 30                 | Service + Repository     |
| Notification     | 3        | 17                 | Transactional Outbox     |
| Admin            | 2        | 11                 | Service + Audit          |
| Fleet (Drivers)  | 1        | 12                 | BaseService + Repository |
| Fleet (Vehicles) | 1        | 16                 | BaseService + Repository |
| Directory        | 1        | 11                 | BaseService + Repository |
| Documents        | 1        | 11                 | BaseService + Repository |
| **TOTAL**        | **15**   | **106**            | -                        |

---

## 1. CRM SERVICES

### 1.1 LeadCreationService

**Fichier**: `lib/services/crm/lead-creation.service.ts`

| Methode      | Signature                                                                                       | Description                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `createLead` | `(input: CreateLeadInput, providerId: string, createdBy?: string): Promise<LeadCreationResult>` | Orchestration complete: code generation + scoring + priority + assignment + notification |

**Dependances**:

- `LeadRepository`
- `CrmSettingsRepository`
- `LeadScoringService`
- `LeadAssignmentService`
- `CountryService`
- `sendNotification()`

**Pattern**: Orchestrator - coordonne 7 etapes dans une seule transaction

---

### 1.2 LeadAssignmentService

**Fichier**: `lib/services/crm/lead-assignment.service.ts`

| Methode            | Signature                                                                                        | Description                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `assignToSalesRep` | `(lead: LeadAssignmentInput, availableEmployees: EligibleEmployee[]): Promise<AssignmentResult>` | Algorithme 4 etapes: fleet size → geographic → fallback → ultimate |

**Algorithme CASCADE**:

1. **Fleet size priority**: 500+ → Senior Account Manager
2. **Geographic zones**: UAE, KSA, France, EU, MENA
3. **Fallback pattern**: Sales Manager
4. **Ultimate fallback**: Any active employee

**Configuration**: `crm_settings.lead_assignment_rules`

---

### 1.3 LeadScoringService

**Fichier**: `lib/services/crm/lead-scoring.service.ts`

| Methode                       | Signature                                                                   | Description                                        |
| ----------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| `calculateFitScore`           | `(input: FitScoreInput): Promise<number>`                                   | Fleet size + country = 0-60 points                 |
| `calculateEngagementScore`    | `(input: EngagementScoreInput): Promise<number>`                            | Message + phone + page views + time = 0-100 points |
| `calculateQualificationScore` | `(fitScore: number, engagementScore: number): Promise<QualificationResult>` | Formule: (fit × 0.6) + (engagement × 0.4)          |
| `calculateLeadScores`         | `(leadData: Partial<...>): Promise<QualificationResult>`                    | All-in-one convenience method                      |
| `recalculateScores`           | `(leadId: string): Promise<RecalculateScoresResult>`                        | Recalcul + update DB + notification si SQL         |
| `degradeInactiveScores`       | `(): Promise<DegradeScoresResult>`                                          | Batch decay pour leads inactifs                    |

**Lead Stages**:

- `sales_qualified`: score >= 70
- `marketing_qualified`: 40 <= score < 70
- `top_of_funnel`: score < 40

**Configuration**: `crm_settings.lead_scoring_config`

---

### 1.4 CountryService

**Fichier**: `lib/services/crm/country.service.ts`

| Methode                  | Signature                                        | Description                   |
| ------------------------ | ------------------------------------------------ | ----------------------------- |
| `isGdprCountry`          | `(countryCode: string): Promise<boolean>`        | Check GDPR (EU/EEA = 30 pays) |
| `isOperational`          | `(countryCode: string): Promise<boolean>`        | Check si FleetCore actif      |
| `getCountryDetails`      | `(countryCode: string): Promise<CountryDetails>` | Record complet                |
| `getCountryInfo`         | `(countryCode: string): Promise<CountryInfo>`    | Info simplifiee (API safe)    |
| `getAllVisibleCountries` | `(): Promise<CountryDetails[]>`                  | Pour formulaires publics      |
| `clearCache`             | `(): void`                                       | Vider caches (1h TTL)         |

**Caching**: In-memory avec TTL 1 heure

---

### 1.5 OpportunityRottingService

**Fichier**: `lib/services/crm/opportunity-rotting.service.ts`

| Methode                       | Signature                                | Description                               |
| ----------------------------- | ---------------------------------------- | ----------------------------------------- |
| `detectRottingOpportunities`  | `(): Promise<RottingOpportunity[]>`      | Detecte opportunities > max_days_in_stage |
| `processRottingOpportunities` | `(): Promise<RottingDetectionResult>`    | Detection + alerting complet              |
| `getRottingSummary`           | `(): Promise<{total, rotting, byStage}>` | Statistiques dashboard                    |

**Cron**: `/api/cron/opportunities/rotting` - Daily 8:00 AM
**Provider Filter**: Multi-division isolation via `getCurrentProviderId()`

---

### 1.6 OrderService

**Fichier**: `lib/services/crm/order.service.ts`

| Methode                      | Signature                                                                                   | Description                        |
| ---------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------- |
| `createOrderFromOpportunity` | `(params: CreateOrderFromOpportunityParams): Promise<OrderCreationResult>`                  | Quote-to-Cash: opportunity → order |
| `getOrderById`               | `(id: string, providerId?: string): Promise<OrderWithRelations \| null>`                    | Order avec relations               |
| `getOrdersByOpportunity`     | `(opportunityId: string, providerId?: string): Promise<Order[]>`                            | Orders par opportunity             |
| `getOrdersByLead`            | `(leadId: string, providerId?: string): Promise<Order[]>`                                   | Orders par lead                    |
| `updateOrderStatus`          | `(id: string, status: string, userId: string, providerId?: string): Promise<Order>`         | Mise a jour status                 |
| `updateFulfillmentStatus`    | `(id: string, fulfillmentStatus: ..., userId: string, providerId?: string): Promise<Order>` | Fulfillment status                 |
| `cancelOrder`                | `(id: string, reason: string, userId: string, providerId?: string): Promise<Order>`         | Annuler order                      |
| `getExpiringOrders`          | `(providerId: string, days: number): Promise<Order[]>`                                      | Orders expirant bientot            |
| `getAutoRenewableOrders`     | `(providerId: string, daysBeforeExpiry: number): Promise<Order[]>`                          | Auto-renouvellement                |
| `countActiveOrders`          | `(providerId: string): Promise<number>`                                                     | Compteur actifs                    |

**Pattern**: Service + Repository separation
**Singleton**: `export const orderService = new OrderService()`

---

## 2. NOTIFICATION SERVICES

### 2.1 NotificationService

**Fichier**: `lib/services/notification/notification.service.ts`

| Methode               | Signature                                                                                     | Description                                          |
| --------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `selectTemplate`      | `(params: SelectTemplateParams): Promise<SelectedTemplate>`                                   | CASCADE 6 niveaux pour locale                        |
| `renderTemplate`      | `(template: SelectedTemplate, variables: Record<string, unknown>): Promise<RenderedTemplate>` | Remplacement {{variables}}                           |
| `sendEmail`           | `(params: SendEmailParams): Promise<NotificationResult>`                                      | Orchestration complete: select → render → send → log |
| `getHistory`          | `(params: GetHistoryParams): Promise<PaginatedResult<adm_notification_logs>>`                 | Historique pagine                                    |
| `getStats`            | `(tenantId?: string, startDate?: Date, endDate?: Date)`                                       | Statistiques                                         |
| `handleResendWebhook` | `(webhookData: {...}): Promise<void>`                                                         | Webhook Resend (delivered, bounced, opened, clicked) |

**CASCADE Locale** (ZERO HARDCODING):

1. `adm_tenant_settings.notification_locale`
2. `adm_members.preferred_language` / `adm_provider_employees.preferred_locale`
3. `params.locale` (explicit)
4. `fallbackLocale` (default: 'en')

**Dependances**:

- `CountryLocaleRepository`
- `NotificationTemplateRepository`
- `NotificationLogRepository`
- `EmailService`

---

### 2.2 NotificationQueueService

**Fichier**: `lib/services/notification/queue.service.ts`

| Methode              | Signature                                                 | Description                     |
| -------------------- | --------------------------------------------------------- | ------------------------------- |
| `queueNotification`  | `(params: QueueNotificationParams): Promise<QueueResult>` | Ajouter a la queue (idempotent) |
| `processQueue`       | `(batchSize?: number): Promise<ProcessQueueResult>`       | Traiter notifications pending   |
| `cancelNotification` | `(queueId: string): Promise<boolean>`                     | Annuler notification            |
| `getQueueStats`      | `(): Promise<Record<queue_status, number>>`               | Stats par status                |

**Pattern**: Transactional Outbox

- Queue dans meme transaction que business logic
- Retry avec exponential backoff (2^attempts minutes)
- Max 3 attempts
- `processImmediately: true` en dev mode

**Table**: `adm_notification_queue`

---

### 2.3 EmailService

**Fichier**: `lib/services/email/email.service.ts`

| Methode                      | Signature                                                                                              | Description              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------ |
| `sendVehicleCreated`         | `(vehicle, tenantId, recipientEmail, locale?): Promise<EmailSendResult>`                               | Email nouveau vehicule   |
| `sendInsuranceExpiryAlert`   | `(vehicle, daysUntilExpiry, recipientEmail, locale?): Promise<EmailSendResult>`                        | Alerte assurance         |
| `sendDriverOnboarding`       | `(driver, tenantId, tempPassword, locale?): Promise<EmailSendResult>`                                  | Onboarding conducteur    |
| `sendDocumentExpiryAlert`    | `(document, entityName, tenantId, recipientEmail, daysUntilExpiry, locale?): Promise<EmailSendResult>` | Alerte document          |
| `sendMaintenanceReminder`    | `(vehicle, maintenance, tenantId, recipientEmail, locale?): Promise<EmailSendResult>`                  | Rappel maintenance       |
| `sendDriverStatusChanged`    | `(driver, newStatus, reason, tenantId, locale?): Promise<EmailSendResult>`                             | Changement status        |
| `send`                       | `(params: {to, subject, html, text?}): Promise<EmailSendResult>`                                       | Email generique (public) |
| `sendDocumentExpiryReminder` | `(doc): Promise<EmailSendResult>`                                                                      | Wrapper expiry           |
| `sendDocumentExpired`        | `(doc): Promise<EmailSendResult>`                                                                      | Wrapper expired          |

**Integration**: Resend API
**Locales**: `en`, `fr` (translations inline)
**Dev mode**: Log instead of send (unless `FORCE_SEND_EMAILS=true`)

---

## 3. ADMIN SERVICES

### 3.1 AuditService

**Fichier**: `lib/services/admin/audit.service.ts`

| Methode                    | Signature                                                                      | Description                 |
| -------------------------- | ------------------------------------------------------------------------------ | --------------------------- |
| `getDiff`                  | `(oldValues: Record<...>, newValues: Record<...>): Record<string, {old, new}>` | Calcul differences          |
| `logAction`                | `(params: LogActionParams): Promise<void>`                                     | Logger action audit         |
| `query`                    | `(filters: AuditQueryFilters): Promise<AuditQueryResult>`                      | Requete paginnee            |
| `detectSuspiciousBehavior` | `(params: {...}): Promise<SuspiciousBehaviorResult>`                           | Detection patterns suspects |

**Severity auto-determinee**:

- `create/update/login/logout`: info
- `delete/export/import`: warning
- `ip_blocked`: critical

**Category auto-determinee par entity**:

- `tenant/member/role`: security
- `contract/payment`: financial
- `lead/opportunity`: operational

**Retention par category**:

- security: 2 ans
- financial: 10 ans
- compliance: 3 ans
- operational: 1 an

---

### 3.2 ClerkSyncService

**Fichier**: `lib/services/admin/clerk-sync.service.ts`

| Methode                     | Signature                                                          | Description                       |
| --------------------------- | ------------------------------------------------------------------ | --------------------------------- |
| `handleUserCreated`         | `(data: ClerkUserData): Promise<void>`                             | user.created webhook              |
| `handleUserUpdated`         | `(data: ClerkUserData): Promise<void>`                             | user.updated webhook              |
| `handleUserDeleted`         | `(data: Pick<ClerkUserData, 'clerkUserId'>): Promise<void>`        | user.deleted webhook              |
| `handleOrganizationCreated` | `(data: ClerkOrganizationData): Promise<void>`                     | organization.created webhook      |
| `handleOrganizationUpdated` | `(data: ClerkOrganizationData): Promise<void>`                     | organization.updated webhook      |
| `handleOrganizationDeleted` | `(data: Pick<ClerkOrganizationData, 'clerkOrgId'>): Promise<void>` | organization.deleted webhook      |
| `verifySync`                | `(): Promise<SyncVerificationResult>`                              | Verification sync Clerk/FleetCore |

**Idempotence**: Check `clerk_user_id` / `clerk_organization_id` avant creation
**Flow user.created**:

1. Check idempotence
2. Find invitation by email
3. Find role by slug
4. Create member + assign role
5. Mark invitation accepted
6. Audit log

---

## 4. FLEET SERVICES

### 4.1 DriverService

**Fichier**: `lib/services/drivers/driver.service.ts`

| Methode                   | Signature                                                                                 | Description                               |
| ------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| `createDriver`            | `(data: CreateDriverDto, userId: string, tenantId: string): Promise<DriverWithRelations>` | Creation + documents + onboarding         |
| `updateDriver`            | `(id, data, userId, tenantId): Promise<DriverWithRelations>`                              | Update avec validation                    |
| `deleteDriver`            | `(id, userId, tenantId, reason?): Promise<void>`                                          | Soft delete                               |
| `getDriver`               | `(id, tenantId): Promise<DriverWithRelations \| null>`                                    | Get avec relations                        |
| `listDrivers`             | `(filters, options, tenantId): Promise<PaginatedResult<Driver>>`                          | Liste paginee                             |
| `listDriverRequests`      | `(driverId, filters, options, tenantId): Promise<PaginatedResult<unknown>>`               | Demandes conducteur                       |
| `getDriverPerformance`    | `(driverId, filters, tenantId): Promise<{...}>`                                           | Metriques agregees                        |
| `getDriverHistory`        | `(driverId, tenantId): Promise<DriverHistory>`                                            | Historique complet                        |
| `validateDriverDocuments` | `(driverId, tenantId): Promise<DocumentValidationResult>`                                 | Validation documents                      |
| `calculateDriverRating`   | `(driverId, tenantId): Promise<number>`                                                   | Calcul rating (10 dernieres performances) |
| `suspendDriver`           | `(driverId, reason, userId, tenantId): Promise<void>`                                     | Suspendre + email                         |
| `reactivateDriver`        | `(driverId, userId, tenantId): Promise<void>`                                             | Reactiver (documents valides requis)      |

**Dependances**:

- `DriverRepository`
- `DocumentService`
- `EmailService`

**UAE Compliance Fields**: `date_of_birth`, `gender`, `nationality`, `hire_date`, `employment_status`, `cooperation_type`, `emergency_contact_*`, `languages`

---

### 4.2 VehicleService

**Fichier**: `lib/services/vehicles/vehicle.service.ts`

| Methode                             | Signature                                                         | Description                                 |
| ----------------------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `createVehicle`                     | `(data, userId, tenantId): Promise<VehicleWithRelations>`         | Creation + documents + maintenance initiale |
| `updateVehicle`                     | `(id, data, userId, tenantId): Promise<VehicleWithRelations>`     | Update + check insurance                    |
| `deleteVehicle`                     | `(id, userId, tenantId, reason?): Promise<void>`                  | Soft delete (pas d'assignment actif)        |
| `assignToDriver`                    | `(vehicleId, driverId, startDate, userId, tenantId)`              | Creer assignment                            |
| `getVehicle`                        | `(id, tenantId): Promise<VehicleWithRelations \| null>`           | Get avec relations                          |
| `listAvailableVehicles`             | `(tenantId): Promise<Vehicle[]>`                                  | Vehicules disponibles                       |
| `listVehiclesRequiringMaintenance`  | `(tenantId): Promise<Vehicle[]>`                                  | Maintenance requise                         |
| `listVehiclesWithExpiringInsurance` | `(tenantId, daysAhead?): Promise<Vehicle[]>`                      | Assurance expirant                          |
| `listVehicles`                      | `(filters, options, tenantId): Promise<PaginatedResult<Vehicle>>` | Liste paginee                               |
| `unassignDriver`                    | `(vehicleId, userId, tenantId): Promise<void>`                    | Terminer assignment                         |
| `createMaintenance`                 | `(vehicleId, data, userId, tenantId)`                             | Creer maintenance                           |
| `getVehicleMaintenance`             | `(vehicleId, tenantId, filters?)`                                 | Get maintenances                            |
| `updateMaintenance`                 | `(vehicleId, maintenanceId, data, userId, tenantId)`              | Update maintenance                          |
| `createExpense`                     | `(vehicleId, data, userId, tenantId)`                             | Creer depense                               |
| `getVehicleExpenses`                | `(vehicleId, tenantId, filters?)`                                 | Get depenses                                |

**Maintenance Status Transitions**:

- `scheduled` → `in_progress`, `cancelled`
- `in_progress` → `completed`, `cancelled`
- `completed`, `cancelled` → (terminal)

---

## 5. DIRECTORY SERVICE

### 5.1 DirectoryService

**Fichier**: `lib/services/directory/directory.service.ts`

| Methode              | Signature                                                               | Description               |
| -------------------- | ----------------------------------------------------------------------- | ------------------------- |
| `listCountries`      | `(sortBy?, sortOrder?): Promise<CountryRegulation[]>`                   | Liste pays                |
| `listMakes`          | `(tenantId, search?, sortBy?, sortOrder?): Promise<CarMake[]>`          | Marques (global + tenant) |
| `getMakeById`        | `(id, tenantId): Promise<CarMake>`                                      | Get marque                |
| `createMake`         | `(data, tenantId): Promise<CarMake>`                                    | Creer marque              |
| `listModelsByMake`   | `(makeId, tenantId): Promise<CarModel[]>`                               | Modeles par marque        |
| `createModel`        | `(data, tenantId, checkTenantId): Promise<CarModel>`                    | Creer modele              |
| `listPlatforms`      | `(search?, sortBy?, sortOrder?): Promise<Platform[]>`                   | Liste plateformes         |
| `createPlatform`     | `(data): Promise<Platform>`                                             | Creer plateforme          |
| `listRegulations`    | `(countryCode?): Promise<CountryRegulation[]>`                          | Reglementations           |
| `listVehicleClasses` | `(countryCode?, search?, sortBy?, sortOrder?): Promise<VehicleClass[]>` | Classes vehicule          |
| `createVehicleClass` | `(data): Promise<VehicleClass>`                                         | Creer classe              |

**Scope**: Global + tenant-specific car makes/models

---

## 6. DOCUMENT SERVICE

### 6.1 DocumentService

**Fichier**: `lib/services/documents/document.service.ts`

| Methode                           | Signature                                                                         | Description                             |
| --------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------- |
| `createPlaceholder`               | `(entityType, entityId, documentType, tenantId, userId, tx?): Promise<Document>`  | Creer placeholder                       |
| `uploadDocument`                  | `(documentId, data, userId, tenantId): Promise<Document>`                         | Upload fichier                          |
| `validateDocument`                | `(documentId, data, tenantId): Promise<Document>`                                 | Verifier/rejeter                        |
| `getRequiredDocumentsByCountry`   | `(country, entityType): Promise<DocumentTypeConfig[]>`                            | Documents requis par pays               |
| `checkDocumentExpiry`             | `(entityType, entityId, tenantId): Promise<DocumentExpiryCheck[]>`                | Verifier expirations                    |
| `sendExpiryNotifications`         | `(tenantId): Promise<void>`                                                       | Envoyer alertes (30, 15, 7, 3, 1 jours) |
| `getEntityDocuments`              | `(entityType, entityId, tenantId): Promise<DocumentWithMetadata[]>`               | Documents entite                        |
| `getPendingVerificationDocuments` | `(tenantId): Promise<Document[]>`                                                 | En attente verification                 |
| `searchDocuments`                 | `(filters, tenantId): Promise<DocumentWithMetadata[]>`                            | Recherche filtree                       |
| `batchUploadDocuments`            | `(entityType, entityId, documents, userId, tenantId): Promise<BatchUploadResult>` | Upload multiple                         |
| `deleteDocument`                  | `(documentId, userId, reason, tenantId): Promise<void>`                           | Supprimer document                      |

**Country Document Requirements** (hardcoded Phase 1):

- **FR**: registration, insurance, professional_license, technical_control, driving_license, professional_card, medical_certificate, criminal_record
- **AE**: registration, insurance, rta_permit, emirates_insurance, driving_license, emirates_id, rta_license, medical_fitness
- **US**: registration, insurance, commercial_permit, safety_inspection, driving_license, tlc_license, background_check, drug_test

---

## ARCHITECTURE PATTERNS

### Pattern 1: BaseService

```typescript
export class XXXService extends BaseService {
  constructor() {
    super(); // Inject prisma singleton
  }

  protected getEntityType(): AuditEntityType {
    return "xxx";
  }

  async executeInTransaction(fn: (tx) => Promise<T>): Promise<T> {
    // Transaction wrapper
  }
}
```

### Pattern 2: Service + Repository

```
Service (business logic)
   ↓
Repository (data access)
   ↓
Prisma (ORM)
   ↓
PostgreSQL
```

### Pattern 3: Transactional Outbox

```
API Route
   ↓
Queue Service (insert dans transaction)
   ↓
adm_notification_queue table
   ↓
Cron Worker (processQueue)
   ↓
Notification Service (send)
```

### Pattern 4: Singleton Export

```typescript
export class OrderService { ... }
export const orderService = new OrderService();
```

---

## DEPENDANCES INTER-SERVICES

```
LeadCreationService
├── LeadScoringService
├── LeadAssignmentService
├── CountryService
├── CrmSettingsRepository
└── sendNotification()

VehicleService
├── VehicleRepository
├── DocumentService
└── EmailService

NotificationService
├── NotificationTemplateRepository
├── NotificationLogRepository
├── CountryLocaleRepository
└── EmailService

DriverService
├── DriverRepository
├── DocumentService
└── EmailService
```

---

## CONFIG KEYS (crm_settings)

| Setting Key             | Used By                   | Description                                |
| ----------------------- | ------------------------- | ------------------------------------------ |
| `lead_scoring_config`   | LeadScoringService        | Points fleet_size, country, message, etc.  |
| `lead_assignment_rules` | LeadAssignmentService     | Fleet priority, geographic zones, fallback |
| `lead_priority_config`  | LeadCreationService       | Thresholds urgent/high/medium/low          |
| `score_decay`           | LeadScoringService        | Inactivity decay rules                     |
| `opportunity_stages`    | OpportunityRottingService | rotting.enabled, rotting.alert_owner       |

---

_Document genere automatiquement depuis le code source_
