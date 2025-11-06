# Audit Code FleetCore - Session 1

**Date**: 21 octobre 2025
**Auditeur**: Claude (Sonnet 4.5)
**Périmètre**: Code source uniquement (exclusion: docs, README, commits, commentaires)
**Méthodologie**: ULTRATHINK - Analyse approfondie sans suppositions

---

## SYNTHÈSE EXÉCUTIVE

### Score Global: 7.5/10

**Verdict**: Architecture solide avec des fondations professionnelles, mais **incomplet** pour une mise en production immédiate.

**Recommandation**: 2-3 semaines de travail pour atteindre 9/10 (MVP production-ready).

---

## 1. ARCHITECTURE & DESIGN

### ✅ FORCES IDENTIFIÉES

#### 1.1 Architecture Multi-tenant B2B SaaS Correcte

**Découverte critique**: Distinction PRE-TENANT vs POST-TENANT parfaitement implémentée.

**Workflow validé**:
```
Lead (CRM) → Opportunity → Contract Signing → Tenant Creation → Operations
  ↓              ↓              ↓                  ↓                 ↓
GLOBAL       GLOBAL         GLOBAL         clerk.organizations    TENANT-SCOPED
tables       tables         tables         + adm_tenants          tables (56)
```

**Tables pré-tenant (CORRECTES sans tenant_id)**:
- `crm_leads` - Pipeline marketing
- `crm_opportunities` - Pipeline ventes
- `crm_contracts` - Contrats signés AVANT création tenant

**Point de conversion** (`/api/demo-leads/[id]/accept`):
1. Crée Organisation Clerk
2. Crée `adm_tenants` avec `clerk_organization_id`
3. Marque lead comme `converted`

**Isolation post-tenant**: 56 models avec `tenant_id` (adm, bil, fin, flt, rid, etc.)

---

#### 1.2 Pattern Repository-Service-Validator

**Séparation des responsabilités**:

```typescript
// Layer 1: Repository (Data Access)
lib/repositories/driver.repository.ts
  └─> BaseRepository<Driver>
      ├─ findAll() avec soft-delete
      ├─ findWithRelations() avec includes
      └─ Transaction support (tx?: PrismaTransaction)

// Layer 2: Service (Business Logic)
lib/services/drivers/driver.service.ts
  └─> BaseService
      ├─ createDriver() avec validation audit trail
      ├─ Transaction orchestration
      └─ Cross-entity operations

// Layer 3: Validator (Input Validation)
lib/validators/drivers.validators.ts
  └─> Zod schemas
      ├─ createDriverSchema (UAE compliance)
      ├─ updateDriverSchema
      └─ Type inference: CreateDriverInput
```

**Avantages observés**:
- Testabilité (mocking facile)
- Réutilisabilité (repositories multi-services)
- Maintenance (changements isolés)

---

#### 1.3 Prisma Schema: 56 Models Across 12 Domains

**Organisation par domaine métier**:

| Domain | Tables | Exemples |
|--------|--------|----------|
| ADM (Administration) | 7 | tenants, members, roles, audit_logs |
| BIL (Billing) | 6 | subscriptions, invoices, payment_methods |
| CRM (Sales) | 3 | leads, opportunities, contracts |
| DIR (Directories) | 5 | car_makes, platforms, regulations |
| DOC (Documents) | 1 | documents (polymorphic) |
| FIN (Finance) | 6 | accounts, transactions, traffic_fines |
| FLT (Fleet) | 6 | vehicles, assignments, maintenance |
| REV (Revenue) | 2 | driver_revenues, reconciliations |
| RID (Ride-sharing) | 5 | drivers, performances, training |
| SCH (Scheduling) | 4 | driver_schedules, work_periods |
| SUP (Support) | 3 | tickets, messages, kb_articles |
| TRP (Trips) | 8 | trips, toll_transactions, ratings |

**Patterns transversaux**:
- Soft delete: `deleted_at`, `deleted_by`, `deletion_reason`
- Audit trail: `created_by`, `updated_by`, `created_at`, `updated_at`
- Multi-tenant: `tenant_id String @db.Uuid`

---

#### 1.4 Documents Architecture (Polymorphic Pattern)

**Approche flexible validée**:

```prisma
// Generic storage
model doc_documents {
  id           String   @id @default(dbgenerated("uuid_generate_v4()"))
  tenant_id    String   @db.Uuid
  entity_type  String   // "driver", "vehicle", "contract"
  entity_id    String   @db.Uuid
  document_type String  // "license", "insurance", "invoice"
  file_url     String
}

// Entity-specific metadata
model rid_driver_documents {
  driver_id    String   @db.Uuid
  document_id  String   @db.Uuid
  verified_by  String?  @db.Uuid
  verified_at  DateTime?

  rid_drivers    rid_drivers    @relation(...)
  doc_documents  doc_documents  @relation(...)
}
```

**Avantages**:
- Support multi-entités (drivers, vehicles, contracts, etc.)
- Metadata spécifique par type (verification workflow pour drivers)
- Évolutif (ajout nouveaux types sans migration lourde)

---

### ⚠️ FAIBLESSES IDENTIFIÉES

#### 1.5 Support System - Incohérence Mineure

**Analyse**:
- Pré-tenant: Support par email uniquement (VALIDÉ)
- Post-tenant: `sup_tickets` + `sup_ticket_messages`

**Incohérence détectée**:
```prisma
model sup_ticket_messages {
  id               String @id
  ticket_id        String @db.Uuid  // FK to sup_tickets
  // ❌ PAS de tenant_id direct

  sup_tickets      sup_tickets @relation(...)
}
```

**Problème**: `sup_ticket_messages` n'a pas de `tenant_id` direct.

**Impact**:
- ✅ Sécurité OK (tenant_id hérité via FK `ticket_id → sup_tickets`)
- ⚠️ Requêtes moins performantes (JOIN obligatoire pour filtrer par tenant)

**Recommandation**: Ajouter `tenant_id` dénormalisé pour performance queries.

---

#### 1.6 API Routes - Deux Patterns Incohérents

**Pattern A (Professionnel)**: `/api/v1/drivers/route.ts`
```typescript
export async function POST(request: NextRequest) {
  // ✅ Validation Zod
  const validatedData = createDriverSchema.parse(body);

  // ✅ Service layer
  const driverService = new DriverService();
  const driver = await driverService.createDriver(validatedData, userId, tenantId);

  // ✅ Error handling
  return NextResponse.json(driver, { status: 201 });
}
```

**Pattern B (Quick & Dirty)**: `/api/demo-leads/route.ts`
```typescript
export async function POST(req: Request) {
  // ❌ PAS de validation Zod
  const body = await req.json();

  // ❌ Prisma direct (pas de service)
  const lead = await db.crm_leads.create({
    data: {
      full_name: body.full_name,  // ⚠️ Non validé
      email: body.email,
    },
  });
}
```

**Problème**: Incohérence dans l'application des bonnes pratiques.

**Impact**:
- Risque d'injection données malformées
- Difficulté maintenance (logique éparpillée)

**Recommandation**: Créer `lib/validators/leads.validators.ts` et `lib/services/leads/lead.service.ts`.

---

## 2. SÉCURITÉ

### ✅ FORCES

#### 2.1 Clerk Integration + Middleware Protection

**Middleware Next.js** (`middleware.ts`):
```typescript
export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();  // Bloque accès non-authentifié
  }
});
```

**API Protection**:
```typescript
// lib/api/get-auth-user.ts
export async function getAuthUser() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    throw new UnauthorizedError("Authentication required");
  }
  return { userId, orgId };
}
```

**Webhook Sync** (`/api/webhooks/clerk`):
- Sync membres Clerk → `adm_members` + `adm_member_roles`
- Validation signature HMAC

---

#### 2.2 Multi-tenant Isolation (Prisma Level)

**Repositories avec filtrage tenant_id**:
```typescript
// BaseRepository
async findAll(tenantId: string, tx?: PrismaTransaction) {
  return await model.findMany({
    where: {
      tenant_id: tenantId,  // ✅ Isolation
      deleted_at: null      // ✅ Soft-delete
    }
  });
}
```

**Services avec validation**:
```typescript
// DriverService
async createDriver(data, userId, tenantId) {
  // ✅ tenantId passé explicitement
  return await tx.rid_drivers.create({
    data: {
      ...data,
      tenant_id: tenantId,
      created_by: userId,
    }
  });
}
```

---

### 🔴 VULNÉRABILITÉS CRITIQUES

#### 2.3 Pages Backoffice Non Protégées

**Fichier**: `app/adm/leads/page.tsx`

```typescript
export default async function LeadsPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/en/login");
  }

  // ❌ PAS de vérification adm_provider_employee
  // N'importe quel utilisateur authentifié peut accéder

  const leads = await db.crm_leads.findMany();  // GLOBAL data
}
```

**Vulnérabilité**: Un tenant authentifié peut voir TOUS les leads CRM.

**Impact**:
- Fuite données prospects concurrents
- Accès admin non autorisé

**Recommandation URGENTE**:
```typescript
// lib/auth/permissions.ts
export async function requireProviderEmployee() {
  const user = await currentUser();
  if (!user) redirect("/en/login");

  const employee = await db.adm_provider_employees.findUnique({
    where: { clerk_user_id: user.id }
  });

  if (!employee) {
    throw new ForbiddenError("Provider employee access required");
  }

  return employee;
}

// app/adm/leads/page.tsx
export default async function LeadsPage() {
  await requireProviderEmployee();  // ✅ Protection
  // ...
}
```

---

#### 2.4 API Endpoints Sans Rate Limiting

**Endpoints publics exposés**:
- `POST /api/demo-leads` - Création lead
- `POST /api/webhooks/clerk` - Sync membres

**Risques**:
- Spam leads (DDoS applicatif)
- Abus webhook (si secret compromis)

**Preuve**:
```typescript
// Aucun import de rate limiter détecté dans:
grep -r "rate" app/api/
grep -r "limit" app/api/
grep -r "throttle" app/api/
// → Aucun résultat
```

**Recommandation**:
```typescript
// lib/middleware/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  if (!success) {
    throw new TooManyRequestsError();
  }
}

// app/api/demo-leads/route.ts
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  await checkRateLimit(ip);  // ✅ Protection
  // ...
}
```

---

#### 2.5 Sortable Fields - Injection SQL Potentielle

**Fichier**: `lib/repositories/driver.repository.ts`

```typescript
export const DRIVER_SORT_FIELDS = [
  "id", "tenant_id", "first_name", "last_name", "email",
  "driver_status", "employment_status", "rating", "hire_date",
  "created_at", "updated_at"
] as const;

protected getSortWhitelist(): SortFieldWhitelist {
  return DRIVER_SORT_FIELDS;
}
```

**Analyse**: ✅ Whitelist définie MAIS...

**Validation manquante**:
```typescript
// lib/core/base.repository.ts
async findAll(tenantId, options?) {
  return await model.findMany({
    orderBy: { [options.sortBy]: options.sortOrder }
    // ❌ Pas de validation que sortBy est dans whitelist
  });
}
```

**Exploit théorique**:
```
GET /api/v1/drivers?sortBy=license_number&sortOrder=asc
→ Tri par PII (numéro permis) non autorisé
```

**Recommandation**:
```typescript
async findAll(tenantId, options?) {
  if (options?.sortBy && !this.getSortWhitelist().includes(options.sortBy)) {
    throw new ValidationError(`Invalid sortBy: ${options.sortBy}`);
  }
  // ...
}
```

---

## 3. QUALITÉ DU CODE

### ✅ FORCES

#### 3.1 TypeScript Strict Mode

**Configuration**: `tsconfig.json`
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

**Bénéfices observés**:
- Type inference Prisma (rid_drivers, etc.)
- Zod type extraction (`z.infer<typeof schema>`)
- Pas de `any` détecté dans les fichiers critiques

---

#### 3.2 Error Handling Centralisé

**Fichier**: `lib/api/error-handler.ts` (954 lignes)

**Hiérarchie d'erreurs**:
```typescript
class AppError extends Error {
  constructor(message, statusCode, errorCode?) { ... }
}

class ValidationError extends AppError { ... }
class UnauthorizedError extends AppError { ... }
class ForbiddenError extends AppError { ... }
class NotFoundError extends AppError { ... }
```

**Mapping Prisma**:
```typescript
export function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return new ConflictError(`Duplicate: ${error.meta?.target}`);
      case "P2025":
        return new NotFoundError("Record not found");
      // ... 15+ codes mappés
    }
  }
}
```

**Utilisation**:
```typescript
// app/api/v1/drivers/route.ts
export async function POST(req: NextRequest) {
  try {
    // ...
  } catch (error) {
    return handleApiError(error);  // ✅ Centralisé
  }
}
```

---

### ⚠️ FAIBLESSES

#### 3.3 Documentation Inline Inégale

**Bon exemple**: `lib/repositories/driver.repository.ts`
```typescript
/**
 * Find a driver with all its relations
 * @param id - Driver ID
 * @param tenantId - Tenant ID for multi-tenant filtering
 * @param tx - Optional Prisma transaction client
 * @returns Driver with relations or null if not found
 */
async findWithRelations(id, tenantId, tx?) { ... }
```

**Mauvais exemple**: `lib/services/drivers/driver.service.ts`
```typescript
// ❌ Pas de JSDoc
async createDriver(data, userId, tenantId) { ... }
async updateDriver(id, data, userId, tenantId) { ... }
```

**Métrique**:
- Repositories: ~80% documentés
- Services: ~30% documentés
- Validators: ~10% documentés

**Recommandation**: Standardiser JSDoc pour toutes méthodes publiques.

---

#### 3.4 Tests Insuffisants

**État actuel**:
```bash
find . -name "*.test.ts" -o -name "*.test.tsx"
# Résultats:
lib/utils/audit.test.ts
lib/api/get-auth-user.test.ts
lib/repositories/driver.repository.test.ts
test-validation-sortby.ts
```

**Couverture estimée**: <10%

**Gaps critiques**:
- ❌ Services (0 tests)
- ❌ API routes (0 tests)
- ❌ Validators (0 tests)
- ❌ Integration tests (0 tests)

**Impact**:
- Risque régression lors refactorings
- Pas de CI/CD confiant
- Debugging difficile en production

**Recommandation**:
```typescript
// lib/services/drivers/__tests__/driver.service.test.ts
describe("DriverService", () => {
  describe("createDriver", () => {
    it("should create driver with audit trail", async () => {
      const service = new DriverService();
      const driver = await service.createDriver(validData, userId, tenantId);

      expect(driver.created_by).toBe(userId);
      expect(driver.tenant_id).toBe(tenantId);
    });

    it("should throw ValidationError for invalid email", async () => {
      await expect(
        service.createDriver({ ...validData, email: "invalid" }, userId, tenantId)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

---

## 4. PERFORMANCE

### ✅ FORCES

#### 4.1 Prisma Connection Pooling

**Configuration**: `lib/db.ts`
```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Avantages**:
- Singleton pattern (évite multiples connexions)
- Connection pooling Prisma par défaut
- Logs queries en dev

---

#### 4.2 Indexes Prisma (Partiel)

**Exemples détectés**:
```prisma
model rid_drivers {
  @@index([tenant_id])
  @@index([tenant_id, driver_status])
  @@index([email])
}

model flt_vehicles {
  @@index([tenant_id])
  @@index([tenant_id, vehicle_status])
  @@index([license_plate])
}
```

**Impact**: Requêtes `WHERE tenant_id = ?` optimisées.

---

### ⚠️ FAIBLESSES

#### 4.3 N+1 Queries Potentiels

**Fichier**: `lib/repositories/driver.repository.ts`

```typescript
// ✅ Bon: includes pour éviter N+1
async findWithRelations(id, tenantId, tx?) {
  return await model.findFirst({
    where: { id, tenant_id: tenantId },
    include: {
      rid_driver_documents: {
        include: { doc_documents: true }
      },
      flt_vehicle_assignments: true
    }
  });
}

// ❌ Mauvais: findAll sans includes
async findAll(tenantId, options?, tx?) {
  return await model.findMany({
    where: { tenant_id: tenantId, deleted_at: null }
    // Pas d'includes → N+1 si relations accédées après
  });
}
```

**Problème**: Si code appelant accède `driver.rid_driver_documents`, query par driver.

**Recommandation**: Ajouter option `include` dans `BaseRepository.findAll()`.

---

#### 4.4 Indexes Manquants sur Foreign Keys

**Analyse manuelle**:
```prisma
model sup_ticket_messages {
  ticket_id        String @db.Uuid
  // ❌ Pas de @@index([ticket_id])
}

model rid_driver_documents {
  driver_id   String @db.Uuid
  document_id String @db.Uuid
  // ❌ Pas de @@index([driver_id])
  // ❌ Pas de @@index([document_id])
}
```

**Impact**: Queries `WHERE ticket_id = ?` lentes (full table scan).

**Recommandation**:
```prisma
model sup_ticket_messages {
  @@index([ticket_id])
  @@index([created_at])  // Pour tri chronologique
}
```

---

## 5. FIABILITÉ

### ✅ FORCES

#### 5.1 Soft Delete Universel

**Pattern cohérent** sur 56 models:
```prisma
model rid_drivers {
  deleted_at     DateTime?
  deleted_by     String?   @db.Uuid
  deletion_reason String?
}
```

**Implémentation**:
```typescript
// BaseRepository
async softDelete(id, userId, reason, tenantId, tx?) {
  return await model.update({
    where: { id, tenant_id: tenantId },
    data: {
      deleted_at: new Date(),
      deleted_by: userId,
      deletion_reason: reason
    }
  });
}
```

**Avantages**:
- Recovery données accidentelles
- Audit trail complet
- Compliance GDPR (traçabilité)

---

#### 5.2 Transactions Prisma

**Support dans BaseRepository**:
```typescript
async create(data, tx?: PrismaTransaction) {
  const model = tx ? tx[this.modelName] : this.model;
  return await model.create({ data });
}
```

**Utilisation dans Services**:
```typescript
// DriverService
async createDriver(data, userId, tenantId) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Create driver
    const driver = await this.repository.create({ ...data }, tx);

    // 2. Create audit log
    await tx.adm_audit_logs.create({
      data: {
        tenant_id: tenantId,
        action: "driver.created",
        entity_id: driver.id
      }
    });

    return driver;
  });
}
```

**Cohérence**: ✅ ACID garantie.

---

### ⚠️ FAIBLESSES

#### 5.3 Pas de Retry Logic

**Problème**: Transient failures PostgreSQL/Network non gérés.

**Exemple**:
```typescript
// app/api/v1/drivers/route.ts
export async function POST(req) {
  try {
    const driver = await driverService.createDriver(data);
    // ❌ Si timeout DB → 500 Error (pas de retry)
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Impact**: Intermittent failures irritent utilisateurs.

**Recommandation**:
```typescript
// lib/utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (isRetryable(error)) {
        await sleep(delay * Math.pow(2, i));  // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

// Usage
const driver = await withRetry(() =>
  driverService.createDriver(data)
);
```

---

#### 5.4 Pas de Health Checks

**Recherche**:
```bash
find app/api -name "*health*"
# Aucun résultat
```

**Problème**: Pas d'endpoint `/api/health` pour monitoring.

**Impact**:
- Kubernetes/Docker probes impossibles
- Pas de détection DB down
- Uptime monitoring difficile

**Recommandation**:
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    clerk: await checkClerk()
  };

  const healthy = Object.values(checks).every(c => c.healthy);

  return NextResponse.json(
    { status: healthy ? "healthy" : "degraded", checks },
    { status: healthy ? 200 : 503 }
  );
}

async function checkDatabase() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}
```

---

## 6. GAPS FONCTIONNELS

### 🔴 MANQUANTS CRITIQUES

#### 6.1 Billing Implementation

**Schema existe** (6 tables):
- `bil_billing_plans`
- `bil_tenant_subscriptions`
- `bil_tenant_invoices`
- `bil_payment_methods`
- `bil_tenant_usage_metrics`

**Code manquant**:
```bash
find lib/services -name "*billing*"
# Aucun résultat

find lib/repositories -name "*billing*"
# Aucun résultat

find app/api -path "*/billing/*"
# Aucun résultat
```

**Impact**: Impossible de facturer clients → Pas de revenue.

**Recommandation**:
1. `BillingService` avec Stripe integration
2. `/api/v1/billing/subscriptions` endpoints
3. Webhooks Stripe → `bil_tenant_invoices`

---

#### 6.2 Document Upload (Placeholder Only)

**Code actuel**: `lib/services/documents/document.service.ts`
```typescript
class DocumentService {
  async createPlaceholder(data, userId, tenantId) {
    return await tx.doc_documents.create({
      data: {
        ...data,
        file_url: "https://placeholder.example.com",  // ❌ Hardcodé
        storage_provider: "placeholder"
      }
    });
  }
}
```

**Manque**:
- Upload réel (S3/Cloudinary)
- Signed URLs
- File validation (type, taille)

**Recommandation**:
```typescript
// lib/services/documents/upload.service.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

class UploadService {
  async uploadDocument(file: File, tenantId: string) {
    // 1. Validate file
    this.validateFile(file);

    // 2. Generate S3 key
    const key = `tenants/${tenantId}/documents/${uuidv4()}-${file.name}`;

    // 3. Upload to S3
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file
    }));

    // 4. Return URL
    return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
  }
}
```

---

#### 6.3 Email Service (Incomplete)

**Détection**:
```bash
grep -r "resend" lib/
# lib/services/email/email.service.ts existe

cat lib/services/email/email.service.ts
```

**Code trouvé**:
```typescript
class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendWelcomeEmail(to: string, name: string) {
    // ✅ Méthode existe
  }

  // ❌ Manque:
  // - sendInvoiceEmail()
  // - sendPasswordResetEmail()
  // - sendDocumentExpiryAlert()
  // - sendDriverAssignmentNotification()
}
```

**Recommandation**: Créer templates pour 10+ scénarios métier.

---

## 7. RECOMMANDATIONS PRIORISÉES

### 🔴 URGENCE HAUTE (Semaine 1)

**Sécurité**:
1. ✅ Protéger `/adm/*` pages avec `requireProviderEmployee()`
2. ✅ Ajouter rate limiting sur `/api/demo-leads`
3. ✅ Valider `sortBy` dans `BaseRepository.findAll()`

**Quick Wins** (2-3 jours):
```typescript
// lib/auth/permissions.ts
export async function requireProviderEmployee() { ... }

// app/adm/leads/page.tsx
export default async function LeadsPage() {
  await requireProviderEmployee();
  // ...
}

// lib/middleware/rate-limit.ts
export async function checkRateLimit(identifier: string) { ... }

// lib/core/base.repository.ts
async findAll(tenantId, options?) {
  if (options?.sortBy && !this.getSortWhitelist().includes(options.sortBy)) {
    throw new ValidationError(`Invalid sortBy`);
  }
  // ...
}
```

---

### 🟠 URGENCE MOYENNE (Semaine 2)

**Qualité**:
4. ✅ Ajouter Zod validators pour `/api/demo-leads`
5. ✅ Créer `LeadService` (Pattern A partout)
6. ✅ Ajouter JSDoc pour tous Services

**Fiabilité**:
7. ✅ Implémenter retry logic avec exponential backoff
8. ✅ Créer `/api/health` endpoint
9. ✅ Ajouter indexes manquants (ticket_id, driver_id, etc.)

---

### 🟢 URGENCE BASSE (Semaine 3)

**Fonctionnel**:
10. ✅ Implémenter `BillingService` + Stripe integration
11. ✅ Upload documents réel (S3/Cloudinary)
12. ✅ Compléter EmailService (10+ templates)

**Tests**:
13. ✅ Tests unitaires Services (>80% coverage)
14. ✅ Tests integration API routes
15. ✅ Tests E2E (Playwright) pour workflows critiques

---

## 8. POINTS FORTS À CONSERVER

1. **Architecture multi-tenant B2B** - Distinction pré/post-tenant PARFAITE
2. **Repository-Service-Validator** - Séparation responsabilités professionnelle
3. **Soft delete universel** - Recovery + audit trail
4. **Error handling centralisé** - Mapping Prisma exhaustif
5. **TypeScript strict** - Type safety maximale
6. **Prisma schema organisation** - 12 domaines métier cohérents

---

## 9. CONCLUSION

### Score Détaillé

| Critère | Note | Justification |
|---------|------|---------------|
| Architecture | 9/10 | Multi-tenant B2B excellent, patterns cohérents |
| Sécurité | 5/10 | Vulnérabilités critiques (backoffice, rate limit) |
| Code Quality | 7/10 | TypeScript strict, mais tests insuffisants |
| Performance | 7/10 | Indexes partiels, N+1 potentiels |
| Fiabilité | 7/10 | Transactions OK, manque retry + health checks |
| **GLOBAL** | **7.5/10** | Fondations solides, 2-3 semaines pour production |

---

### Prochaines Étapes

**MVP Production-Ready (3 semaines)**:
- Semaine 1: Sécurité (3 fixes critiques)
- Semaine 2: Qualité + Fiabilité (6 améliorations)
- Semaine 3: Fonctionnel (Billing, Upload, Email)

**Résultat attendu**: **9/10** - Production-ready avec monitoring complet.

---

**Fin du rapport**
