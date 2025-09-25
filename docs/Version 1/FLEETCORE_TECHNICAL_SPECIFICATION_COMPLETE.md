# FLEETCORE - SPÉCIFICATION TECHNIQUE COMPLÈTE

## Version 1.0 - Septembre 2025

---

## TABLE DES MATIÈRES

1. [EXECUTIVE SUMMARY](#1-executive-summary)
2. [VISION PRODUIT](#2-vision-produit)
3. [ARCHITECTURE GLOBALE](#3-architecture-globale)
4. [STACK TECHNOLOGIQUE](#4-stack-technologique)
5. [MODULES FONCTIONNELS](#5-modules-fonctionnels)
6. [MODULE DE PARAMÉTRAGE](#6-module-de-paramétrage)
7. [ARCHITECTURE BACKEND](#7-architecture-backend)
8. [ARCHITECTURE FRONTEND](#8-architecture-frontend)
9. [RÈGLES MÉTIER](#9-règles-métier)
10. [INTÉGRATIONS EXTERNES](#10-intégrations-externes)
11. [SÉCURITÉ](#11-sécurité)
12. [PERFORMANCE & SCALABILITÉ](#12-performance-scalabilité)
13. [DÉPLOIEMENT & INFRASTRUCTURE](#13-déploiement-infrastructure)
14. [MONITORING & OBSERVABILITÉ](#14-monitoring-observabilité)
15. [DOCUMENTATION & FORMATION](#15-documentation-formation)
16. [ROADMAP & ÉVOLUTIONS](#16-roadmap-évolutions)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Qu'est-ce que FleetCore ?

FleetCore est une plateforme SaaS multi-tenant de gestion de flotte automobile combinant :

- **Gestion de flotte VTC** pour plateformes Uber/Bolt/Careem
- **Location de véhicules** B2B et B2C
- **Réconciliation financière** automatique driver-customer
- **Support véhicules autonomes** (prévu 2026)

### 1.2 Proposition de Valeur

**Pour les opérateurs de flotte VTC :**

- Import automatique des revenus plateformes
- Calcul automatique des commissions et déductions
- Gestion multi-driver avec support employés/freelance
- Réconciliation automatique pour drivers qui sont aussi locataires

**Pour les sociétés de location :**

- Gestion complète du cycle de location
- Tarification flexible par client/période
- États des lieux digitalisés avec photos
- Recouvrement automatisé

**Différenciateurs clés :**

- **100% paramétrable** : Aucune règle métier codée en dur
- **Multi-pays natif** : UAE/France avec règles locales
- **Véhicules autonomes ready** : Architecture prévue pour 2026
- **Réconciliation unique** : Compensation automatique dettes/revenus

### 1.3 Volumétrie Cible

- **Immédiat** : 1,000 véhicules, 200 utilisateurs simultanés
- **Fin 2025** : 5,000 véhicules, 1,000 utilisateurs
- **2026+** : 10,000 véhicules incluant autonomes

### 1.4 Utilisateurs

1. **Superadmins** : Éditeur logiciel (support technique)
2. **Tenant Admins** : Administrateurs société cliente
3. **Fleet Managers** : Gestionnaires de flotte
4. **Finance Managers** : Responsables financiers
5. **Agents** : Opérationnels terrain
6. **Drivers** : Via mobile app (lot 2)
7. **Customers** : Via portail self-service (lot 2)

---

## 2. VISION PRODUIT

### 2.1 Contexte Marché

**Problèmes actuels :**

- Solutions existantes mono-fonction (soit VTC, soit location)
- Pas de gestion native multi-pays avec règles locales
- Impossible de gérer un driver qui est aussi customer
- Intégrations plateformes VTC complexes ou manuelles
- Aucune préparation pour véhicules autonomes

**Notre solution :**

- Plateforme unifiée VTC + Location
- Paramétrage complet par pays/société
- Réconciliation native driver-customer
- Intégrations automatisées (avec fallback manuel)
- Architecture ready pour autonome

### 2.2 Philosophie Technique

**Principes fondamentaux :**

1. **Zero Hardcoding**
   - TOUTES les règles dans la base de données
   - Modification sans toucher au code
   - Évolution sans redéploiement

2. **Multi-tenant Natif**
   - Isolation complète par tenant_id
   - Pas de données partagées
   - Scalabilité horizontale

3. **API-First**
   - Toute fonctionnalité exposée via API
   - Documentation OpenAPI
   - Versioning strict

4. **Mobile-Ready**
   - Responsive par défaut
   - API optimisée pour mobile
   - Offline-first (lot 2)

### 2.3 Cas d'Usage Principaux

**Use Case 1 : Fleet Operator VTC Dubai**

- 100 véhicules, 120 chauffeurs (rotation)
- Mix employés + freelances
- Import quotidien Uber/Careem
- Paiement hebdomadaire dimanche

**Use Case 2 : Société Location Paris**

- 50 véhicules location longue durée
- Certains chauffeurs louent leurs véhicules
- Facturation mensuelle
- Réconciliation automatique

**Use Case 3 : Opérateur Hybride**

- Véhicules en location ET en VTC
- Drivers qui sont customers
- Multi-pays (Dubai + Paris)
- Véhicules autonomes en 2026

---

## 3. ARCHITECTURE GLOBALE

### 3.1 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────┬──────────────┬──────────────┬────────────────────┤
│   Web App   │  Mobile App  │  Public API  │  Partner Portal    │
│  (Next.js)  │ (React Native)│   (REST)    │   (Next.js)       │
└──────┬──────┴──────┬───────┴──────┬───────┴────────────────────┘
       │             │              │
       ▼             ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Next.js API Routes)             │
│  • Authentication  • Rate Limiting  • Routing  • Monitoring      │
└─────────────────────────────────────────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   CORE       │      │   BUSINESS   │      │  INTEGRATION │
│  SERVICES    │      │   MODULES    │      │   SERVICES   │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ • Auth       │      │ • Fleet      │      │ • Uber API   │
│ • Tenant     │      │ • VTC        │      │ • Bolt       │
│ • User       │      │ • Rental     │      │ • Careem     │
│ • Audit      │      │ • Finance    │      │ • WhatsApp   │
│ • Parameter  │      │ • Compliance │      │ • Email      │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                      │
       └─────────────────────┼──────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  • PostgreSQL (Supabase)  • Redis Cache  • File Storage (S3)    │
│  • Row Level Security     • Prisma ORM   • Backup/Archive       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Architecture Patterns

**Pattern Principal : Modular Monolith**

Pourquoi ce choix :

- Simplicité de déploiement
- Pas de latence inter-services
- Évolutif vers microservices si besoin
- Coût infrastructure réduit

Structure modulaire :

```
/src
  /modules
    /core       # Services fondamentaux
    /fleet      # Gestion véhicules
    /vtc        # Opérations chauffeurs
    /rental     # Location véhicules
    /finance    # Facturation/Paiements
    /compliance # Conformité légale
```

Chaque module :

- Isolé et indépendant
- Communication via events/API interne
- Peut devenir microservice futur

### 3.3 Multi-Tenancy

**Strategy : Single Database + Row Level Security**

Implementation :

```typescript
// Toutes les tables ont tenant_id
// RLS PostgreSQL assure l'isolation
// JWT contient tenant_id dans metadata
```

Avantages :

- Maintenance simplifiée (1 DB)
- Backup centralisé
- Migrations uniques
- Coût réduit

### 3.4 Base de Données

**Structure complète : 57 tables**
Voir document : `FLEETCORE_DATABASE_SPECIFICATION_COMPLETE.md`

Organisation :

- **Core** : 11 tables système
- **Fleet** : 10 tables véhicules
- **VTC** : 10 tables chauffeurs
- **Rental** : 11 tables location
- **Finance** : 12 tables comptables
- **Compliance** : 3 tables conformité

---

## 4. STACK TECHNOLOGIQUE

### 4.1 Frontend

```yaml
Framework:
  Principal: Next.js 15.5.3
  Routing: App Router
  Rendering: SSR + Client Components

Language:
  TypeScript: 5.3+
  Mode: Strict

Styling:
  CSS: Tailwind CSS 3.4
  Components: shadcn/ui
  Icons: Lucide React

State:
  Server: React Server Components
  Client: React hooks + Zustand
  Cache: React Query (TanStack)

Forms:
  Validation: Zod
  Builder: React Hook Form

Tables:
  DataGrid: TanStack Table
  Export: React-PDF, ExcelJS

Charts:
  Library: Recharts
  Maps: Mapbox GL
```

### 4.2 Backend

```yaml
Runtime:
  Node.js: 20 LTS
  Framework: Next.js API Routes

Language:
  TypeScript: 5.3+

Database:
  PostgreSQL: 15+ (via Supabase)
  ORM: Prisma 6.16.2
  Migrations: Prisma Migrate

Authentication:
  Provider: Supabase Auth
  Strategy: JWT in httpOnly cookies
  MFA: SMS/TOTP (lot 2)

Cache:
  Redis: Upstash
  Strategy: Cache-aside

Queue:
  BullMQ: Background jobs
  Redis: Queue backend

Storage:
  Files: Supabase Storage
  CDN: Cloudflare
```

### 4.3 Infrastructure

```yaml
Hosting:
  Application: Vercel
  Database: Supabase
  Cache: Upstash

Regions:
  Primary: Dubai (UAE)
  Secondary: Paris (France)

CI/CD:
  VCS: GitHub
  CI: GitHub Actions
  CD: Vercel Auto-deploy

Monitoring:
  APM: Vercel Analytics
  Errors: Sentry
  Logs: Supabase

Security:
  WAF: Cloudflare
  DDoS: Cloudflare
  Secrets: Vercel Env
```

### 4.4 Outils Développement

```yaml
IDE:
  Recommended: VS Code
  Extensions:
    - Prisma
    - Tailwind IntelliSense
    - ESLint
    - Prettier

Testing:
  Unit: Vitest
  Integration: Jest
  E2E: Playwright
  API: Supertest

Quality:
  Linting: ESLint
  Formatting: Prettier
  Types: TypeScript strict
  Pre-commit: Husky

Documentation:
  API: OpenAPI/Swagger
  Code: TSDoc
  User: Docusaurus
```

---

## 5. MODULES FONCTIONNELS

### 5.1 Module CORE

**Responsabilités :**

- Gestion multi-tenant
- Authentification/Autorisation
- Paramétrage système
- Audit trail
- Notifications

**Services principaux :**

```typescript
// Tenant Service
class TenantService {
  - createTenant(data: TenantData): Promise<Tenant>
  - getTenantBySubdomain(subdomain: string): Promise<Tenant>
  - updateSettings(tenantId: string, settings: Settings): Promise<void>
  - suspendTenant(tenantId: string): Promise<void>
}

// Auth Service
class AuthService {
  - login(credentials: Credentials): Promise<Session>
  - logout(sessionId: string): Promise<void>
  - refreshToken(token: string): Promise<Token>
  - validatePermission(userId: string, permission: string): Promise<boolean>
}

// Parameter Service
class ParameterService {
  - getParameter(key: string, context: Context): Promise<any>
  - setParameter(key: string, value: any): Promise<void>
  - validateAgainstRules(entity: any, rules: Rules): Promise<ValidationResult>
}

// Audit Service
class AuditService {
  - logAction(action: AuditAction): Promise<void>
  - getAuditTrail(filters: Filters): Promise<AuditLog[]>
  - exportCompliance(period: DateRange): Promise<Report>
}
```

### 5.2 Module FLEET

**Responsabilités :**

- Gestion cycle de vie véhicules
- Maintenance programmée
- Assurances et sinistres
- Tracking consommation
- Support véhicules autonomes

**Workflows principaux :**

1. **Acquisition véhicule**

   ```
   Commande → Réception → Immatriculation → Assurance → Mise en service
   ```

2. **Maintenance préventive**

   ```
   Planification → Rappel → Exécution → Validation → Facturation
   ```

3. **Gestion sinistre**

   ```
   Déclaration → Photos → Assurance → Réparation → Clôture
   ```

4. **Véhicule autonome (2026)**
   ```
   Création véhicule → Auto-création driver virtuel → Assignment automatique
   ```

**APIs exposées :**

```
GET    /api/v1/fleet/vehicles
POST   /api/v1/fleet/vehicles
GET    /api/v1/fleet/vehicles/:vin
PUT    /api/v1/fleet/vehicles/:vin
GET    /api/v1/fleet/vehicles/:vin/maintenance
POST   /api/v1/fleet/vehicles/:vin/maintenance
GET    /api/v1/fleet/vehicles/:vin/assignments
POST   /api/v1/fleet/fuel-transactions
GET    /api/v1/fleet/insurance/policies
POST   /api/v1/fleet/insurance/claims
```

### 5.3 Module VTC

**Responsabilités :**

- Gestion drivers (humains et virtuels)
- Import revenus plateformes
- Calcul commissions/déductions
- Paiements hebdo/mensuels
- Support multi-employer

**Intégrations plateformes :**

| Plateforme | Méthode      | Fréquence  | Status   |
| ---------- | ------------ | ---------- | -------- |
| Uber       | API OAuth    | Temps réel | ✅ Actif |
| Bolt       | Web scraping | Quotidien  | ⚠️ Beta  |
| Careem     | CSV import   | Manuel     | ✅ Actif |

**Process Import Revenus :**

```
1. Fetch data (API/CSV/Scraping)
2. Normalize format
3. Deduplicate trips
4. Match driver/vehicle
5. Calculate commissions
6. Store in platform_revenues
7. Update driver balance
```

**Calcul Balance Driver :**

```typescript
interface DriverBalance {
  gross_revenue: number; // Revenus bruts plateformes
  platform_commission: number; // -Commission Uber/Bolt
  company_commission: number; // -Commission société
  vehicle_rental: number; // -Location véhicule
  fuel_cost: number; // -Carburant
  fines: number; // -Amendes
  other_deductions: number; // -Autres
  net_balance: number; // =Solde net
}
```

### 5.4 Module RENTAL

**Responsabilités :**

- Gestion cycle commercial (lead → customer)
- Devis et contrats
- Check-in/out véhicules
- Extensions et avenants
- Réservations

**Cycle Location Complet :**

```
Lead → Qualification → Devis → Négociation → Contrat →
Delivery → Usage → Return → Inspection → Facturation → Clôture
```

**Tarification Flexible :**

```typescript
interface PricingRules {
  base_rates: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  modifiers: {
    seasonal: SeasonalRate[];
    customer_category: CategoryRate[];
    long_term_discount: VolumeDiscount[];
  };
  additional: {
    insurance: number;
    additional_driver: number;
    young_driver_fee: number;
  };
}
```

**Check-in/out Digital :**

- Photos obligatoires (extérieur 360°)
- Signature électronique
- Relevé kilométrique
- Niveau carburant
- État des lieux détaillé
- Génération PDF automatique

### 5.5 Module FINANCE

**Responsabilités :**

- Facturation automatique
- Gestion paiements
- Réconciliation bancaire
- Recouvrement
- **Réconciliation driver-customer** (feature unique)

**Réconciliation Driver-Customer :**

Cas d'usage : Mohammed est driver ET customer

```typescript
// Calcul mensuel
const driverBalance = 5000; // Mohammed doit recevoir (revenus VTC)
const customerDebt = 3000; // Mohammed doit payer (location véhicule)

// Réconciliation automatique
const offset = Math.min(driverBalance, customerDebt); // 3000
const finalDriverPayment = driverBalance - offset; // 2000
const finalCustomerBalance = customerDebt - offset; // 0

// Résultat : Un seul paiement de 2000 AED au lieu de 2 transactions
```

**Workflow Facturation :**

```
1. Génération automatique (scheduler)
2. Calcul lignes (location, extras, pénalités)
3. Application TVA/VAT
4. Envoi email avec PDF
5. Suivi échéances
6. Relances automatiques (J+3, J+7, J+14)
7. Escalade recouvrement
```

**Intégration Bancaire :**

- Import relevés (CSV/API)
- Matching automatique
- Réconciliation ML-based
- Exceptions pour validation manuelle

### 5.6 Module COMPLIANCE

**Responsabilités :**

- Rapports réglementaires
- Déclarations fiscales
- Archivage légal
- Conformité RGPD

**Rapports par Pays :**

| UAE                    | France          |
| ---------------------- | --------------- |
| VAT Return (mensuel)   | Déclaration TVA |
| WPS (Wage Protection)  | DAS2 (annuel)   |
| Corporate Tax (annuel) | Liasse fiscale  |
| Trade License renewal  | Contrôle URSSAF |

**Archivage Légal :**

- UAE : 5 ans minimum
- France : 10 ans comptable, 6 ans commercial
- Hash SHA-256 pour intégrité
- Destruction automatique après période

---

## 6. MODULE DE PARAMÉTRAGE

### 6.1 Philosophie

**Principe fondamental : ZERO HARDCODING**

Tout est paramétrable :

- Formats de données (plaques, ID, téléphones)
- Règles métier (commissions, délais, plafonds)
- Workflows (approbations, escalades)
- Documents requis
- Calculs financiers
- Textes et traductions

### 6.2 Structure Paramètres

```typescript
interface SystemParameter {
  // Identification
  tenant_id: string;
  country_code?: string; // NULL = global tenant
  module: string; // 'legal', 'finance', 'vtc'
  category: string; // 'validation', 'calculation'
  parameter_key: string;

  // Valeur
  parameter_value: any; // JSONB flexible
  parameter_type: string; // 'regex', 'number', 'json'

  // Validité
  is_active: boolean;
  valid_from: Date;
  valid_to?: Date;
}
```

### 6.3 Hiérarchie Application

```
1. Valeur système (défaut FleetCore)
    ↓ Override par
2. Valeur tenant (société)
    ↓ Override par
3. Valeur employer (pour drivers)
    ↓ Override par
4. Valeur temporelle (période spécifique)
```

### 6.4 Exemples Concrets

**Validation Format Plaque UAE vs France :**

```json
// UAE
{
  "module": "validation",
  "category": "vehicle",
  "key": "plate_format",
  "value": {
    "regex": "^[A-Z]{1,3}\\s[A-Z]?\\s?\\d{1,5}$",
    "example": "DXB A 12345",
    "error_message": "Format: Emirate Code Number"
  }
}

// France
{
  "module": "validation",
  "category": "vehicle",
  "key": "plate_format",
  "value": {
    "regex": "^[A-Z]{2}-\\d{3}-[A-Z]{2}$",
    "example": "AA-123-BB",
    "error_message": "Format: AA-123-BB"
  }
}
```

**Commission VTC Paramétrable :**

```json
{
  "module": "vtc",
  "category": "commission",
  "key": "rates",
  "value": {
    "tenant_owned_vehicle": 15, // 15% si véhicule société
    "driver_owned_vehicle": 10, // 10% si véhicule driver
    "platform_rates": {
      "uber": 25,
      "bolt": 20,
      "careem": 23
    }
  }
}
```

**Règles Remboursement Frais :**

```json
{
  "module": "expenses",
  "category": "fuel",
  "key": "reimbursement",
  "value": {
    "enabled": true,
    "percentage": 100, // 100% remboursé
    "max_monthly": 1500, // Plafond 1500 AED/mois
    "requires_receipt": true,
    "auto_approve_below": 100 // Auto-approuvé si < 100 AED
  }
}
```

### 6.5 Interface Administration

**Page Paramétrage Backoffice :**

```
/admin/settings
  /validation    # Formats et regex
  /business      # Règles métier
  /financial     # Calculs financiers
  /documents     # Documents requis
  /workflows     # Processus approbation
  /localization  # Traductions
```

Chaque paramètre :

- Description claire
- Valeur actuelle vs défaut
- Historique modifications
- Test en temps réel
- Impact analysis

---

## 7. ARCHITECTURE BACKEND

### 7.1 Structure Projet

```
/src
  /modules
    /core
      /domain
        /entities      # Entités métier
        /value-objects # Objets valeur
        /events       # Domain events
      /repositories   # Accès données
      /services      # Logique métier
      /api          # Routes API
      /dto          # Data Transfer Objects
    /fleet
      /domain
      /repositories
      /services
      /api
    /vtc
    /rental
    /finance
    /compliance

  /shared
    /database      # Config Prisma
    /middleware    # Auth, logging, etc
    /utils        # Helpers
    /types        # Types partagés

  /infrastructure
    /queue        # Background jobs
    /cache        # Redis
    /storage      # Files
    /email        # Notifications
```

### 7.2 API Design

**Principes REST :**

- Resources au pluriel : `/vehicles`, `/drivers`
- Verbes HTTP standards : GET, POST, PUT, DELETE
- Status codes appropriés : 200, 201, 400, 401, 404, 500
- Pagination : `?page=1&limit=50`
- Filtering : `?status=active&type=sedan`
- Sorting : `?sort=created_at:desc`

**Format Réponse Standard :**

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    page?: number;
    total?: number;
    limit?: number;
  };
}
```

**Versioning :**

```
/api/v1/...  # Version stable
/api/v2/...  # Breaking changes
```

### 7.3 Services Architecture

**Base Service Pattern :**

```typescript
abstract class BaseService<T> {
  protected repository: BaseRepository<T>;
  protected validator: Validator;
  protected eventBus: EventBus;

  async create(data: CreateDTO): Promise<T> {
    // 1. Validate
    await this.validator.validate(data);

    // 2. Apply business rules
    const processed = await this.applyBusinessRules(data);

    // 3. Persist
    const entity = await this.repository.create(processed);

    // 4. Emit event
    await this.eventBus.emit(new EntityCreatedEvent(entity));

    // 5. Return
    return entity;
  }
}
```

**Repository Pattern :**

```typescript
class VehicleRepository extends BaseRepository<Vehicle> {
  async findAvailable(date: Date): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: {
        tenant_id: this.tenantId,
        status: "available",
        assignments: {
          none: {
            OR: [
              { assigned_from: { gt: date } },
              { assigned_to: { lt: date } },
            ],
          },
        },
      },
    });
  }
}
```

### 7.4 Multi-Tenant Implementation

**Middleware Tenant Isolation :**

```typescript
export async function tenantMiddleware(req: Request) {
  // 1. Extract tenant from JWT
  const token = req.headers.authorization;
  const payload = await verifyJWT(token);
  const tenantId = payload.app_metadata.tenant_id;

  // 2. Set Prisma client with tenant
  req.prisma = prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Auto-inject tenant_id
          if (args.where) {
            args.where = { ...args.where, tenant_id: tenantId };
          }
          return query(args);
        },
      },
    },
  });

  // 3. Set context
  req.context = { tenantId, userId: payload.sub };
}
```

### 7.5 Background Jobs

**Queue Configuration :**

```typescript
// Bull Queue pour jobs asynchrones
const queues = {
  import: new Queue("import-revenues"),
  notification: new Queue("send-notifications"),
  report: new Queue("generate-reports"),
  maintenance: new Queue("schedule-maintenance"),
};

// Worker Example
importQueue.process(async (job) => {
  const { platform, tenantId, period } = job.data;

  // 1. Fetch data
  const data = await platformService.fetchRevenues(platform, period);

  // 2. Process
  const revenues = await revenueService.processImport(data);

  // 3. Update balances
  await balanceService.updateDriverBalances(revenues);

  // 4. Notify
  await notificationService.notifyImportComplete(tenantId);
});
```

**Scheduled Jobs :**

```typescript
// Cron jobs
schedule.scheduleJob("0 0 * * 0", async () => {
  // Weekly payment calculation (Sunday midnight)
  await processWeeklyPayments("AE");
});

schedule.scheduleJob("0 0 1 * *", async () => {
  // Monthly invoicing (1st of month)
  await generateMonthlyInvoices("FR");
});
```

### 7.6 Event-Driven Architecture

**Domain Events :**

```typescript
class EventBus {
  private handlers = new Map<string, Handler[]>();

  on(event: string, handler: Handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }

  async emit(event: DomainEvent) {
    // 1. Store event
    await prisma.domainEvent.create({
      data: {
        type: event.type,
        aggregate_id: event.aggregateId,
        payload: event.payload,
        occurred_at: event.occurredAt,
      },
    });

    // 2. Execute handlers
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map((h) => h(event)));
  }
}

// Usage
eventBus.on("vehicle.assigned", async (event) => {
  await notificationService.notifyDriverAssignment(event.payload);
  await maintenanceService.scheduleForVehicle(event.payload.vehicleId);
});
```

---

## 8. ARCHITECTURE FRONTEND

### 8.1 Structure Application

```
/app                      # Next.js App Router
  /(auth)
    /login
    /register
    /forgot-password
  /(dashboard)
    /layout.tsx          # Layout avec sidebar
    /page.tsx           # Dashboard principal
    /fleet
      /vehicles
        /page.tsx       # Liste véhicules
        /[vin]/page.tsx # Détail véhicule
      /maintenance
      /insurance
    /vtc
      /drivers
      /revenues
      /balances
    /rental
      /customers
      /contracts
      /invoices
    /settings
      /parameters
      /users
      /billing
  /api                  # API Routes
    /v1
      /auth
      /fleet
      /vtc

/components
  /ui                   # shadcn/ui components
  /features            # Composants métier
    /fleet
      VehicleCard.tsx
      VehicleForm.tsx
      MaintenanceCalendar.tsx
    /vtc
      DriverList.tsx
      RevenueImporter.tsx
      BalanceCalculator.tsx
    /rental
      ContractWizard.tsx
      CheckInOutForm.tsx
  /layouts
    DashboardLayout.tsx
    AuthLayout.tsx
  /shared
    DataTable.tsx
    FormBuilder.tsx

/hooks                 # Custom React hooks
  useAuth.ts
  useTenant.ts
  useRealtime.ts

/lib                  # Utilities
  /api
    client.ts        # API client
  /utils
    formatters.ts
    validators.ts
```

### 8.2 Composants Clés

**DataTable Universel :**

```typescript
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]

  // Features
  pagination?: boolean
  sorting?: boolean
  filtering?: boolean
  selection?: boolean
  exporting?: boolean

  // Actions
  onRowClick?: (row: T) => void
  bulkActions?: BulkAction[]
  rowActions?: RowAction[]
}

// Usage
<DataTable
  data={vehicles}
  columns={vehicleColumns}
  pagination
  sorting
  filtering
  exporting
  bulkActions={[
    { label: 'Assign Driver', action: handleBulkAssign },
    { label: 'Schedule Maintenance', action: handleBulkMaintenance }
  ]}
/>
```

**Dashboard Widgets :**

```typescript
// Widget configurable
interface DashboardWidget {
  type: 'metric' | 'chart' | 'list' | 'map'
  title: string
  size: 'small' | 'medium' | 'large' | 'full'

  // Data source
  dataSource: {
    endpoint?: string      // API endpoint
    realtime?: boolean     // Subscribe to updates
    refreshInterval?: number
  }

  // Configuration spécifique
  config: WidgetConfig
}

// Metric Widget
<MetricWidget
  title="Active Vehicles"
  value={activeVehicles}
  trend={+5}
  icon={<Car />}
  color="green"
/>

// Chart Widget
<ChartWidget
  title="Revenue Trend"
  type="line"
  data={revenueData}
  xAxis="date"
  yAxis="amount"
/>
```

### 8.3 State Management

**Pattern : Context + Hooks**

```typescript
// Auth Context
const AuthContext = createContext<AuthState>()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user)
      setLoading(false)
    })

    // Subscribe to changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user)
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Usage
function ProtectedPage() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" />

  return <Dashboard />
}
```

### 8.4 Real-time Features

**Supabase Realtime Integration :**

```typescript
// Hook for real-time updates
function useRealtime(table: string, filter?: Filter) {
  const [data, setData] = useState([])

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      const { data } = await supabase
        .from(table)
        .select('*')
        .match(filter || {})
      setData(data)
    }
    fetchData()

    // Subscribe to changes
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => [...prev, payload.new])
          }
          // Handle UPDATE, DELETE
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [table, filter])

  return data
}

// Usage
function VehicleList() {
  const vehicles = useRealtime('vehicles', { status: 'available' })

  return (
    <div>
      {vehicles.map(vehicle => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  )
}
```

### 8.5 Forms & Validation

**Dynamic Form Builder :**

```typescript
// Schema-driven forms with Zod
const vehicleSchema = z.object({
  vin: z.string().length(17),
  registration_number: z.string().regex(/^[A-Z]{2}-\d{3}-[A-Z]{2}$/),
  make: z.string().min(2),
  model: z.string().min(2),
  year: z.number().min(2000).max(new Date().getFullYear() + 1),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid'])
})

// Form component
function VehicleForm({ onSubmit }) {
  const form = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      fuel_type: 'petrol'
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="vin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VIN</FormLabel>
              <FormControl>
                <Input {...field} maxLength={17} />
              </FormControl>
              <FormDescription>
                17-character Vehicle Identification Number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Other fields */}
        <Button type="submit">Save Vehicle</Button>
      </form>
    </Form>
  )
}
```

### 8.6 Responsive & PWA

**Mobile-First Design :**

```typescript
// Responsive layout utilities
<div className="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
  gap-4
">
  {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
</div>

// Responsive navigation
<Sheet>
  <SheetTrigger asChild className="md:hidden">
    <Button variant="ghost" size="icon">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <MobileNav />
  </SheetContent>
</Sheet>
```

**PWA Configuration (Lot 2) :**

```json
// manifest.json
{
  "name": "FleetCore",
  "short_name": "FleetCore",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## 9. RÈGLES MÉTIER

### 9.1 Règles VTC Operations

**Assignment Véhicules :**

```
RÈGLE: Un driver ne peut avoir qu'UN véhicule actif à la fois
IMPLEMENTATION: Constraint unique sur (driver_id, status='active')

RÈGLE: Un véhicule ne peut avoir qu'UN driver actif à la fois
IMPLEMENTATION: Check overlap dates dans vehicle_assignments

RÈGLE: Driver virtuel créé automatiquement pour véhicule autonome
IMPLEMENTATION: Trigger sur insert vehicle avec is_autonomous=true
```

**Calcul Revenus :**

```
RÈGLE: Commission société varie selon propriété véhicule
- Véhicule société: 15% (paramétrable)
- Véhicule driver: 10% (paramétrable)
- Véhicule employer: 12% (paramétrable)

RÈGLE: Revenus vont au driver ou employer selon statut
- Freelance UAE: Direct au driver
- Employé: À l'employer
- France: Toujours via société (SASU/EURL obligatoire)
```

**Déductions :**

```
RÈGLE: Ordre de déduction paramétrable
DEFAULT: 1. Location 2. Amendes 3. Carburant 4. Autres

RÈGLE: Plafond déduction paramétrable
DEFAULT: 100% du revenu (peut être limité à 80% par exemple)

RÈGLE: Amendes payées par driver ou société selon statut
- Employé: Société paie (remboursable ou non selon config)
- Freelance: Driver paie
```

### 9.2 Règles Rental

**Tarification :**

```
RÈGLE: Prix dégressif selon durée
- Daily: Tarif plein
- Weekly: -15%
- Monthly: -30%
- Long-term (>6 mois): -40%

RÈGLE: Majoration jeune conducteur
- <25 ans: +20%
- <21 ans: +50%

RÈGLE: Caution paramétrable
- Standard: 20% du montant total
- VIP customers: 0%
- Nouveaux clients: 30%
```

**Check-in/out :**

```
RÈGLE: Photos obligatoires
MINIMUM: 4 angles extérieur + compteur + carburant

RÈGLE: Tolérance retour
DEFAULT: 1 heure gratuite, puis 50 AED/heure

RÈGLE: Carburant
OPTION 1: Full-to-full (rendre plein)
OPTION 2: Prepaid (on fait le plein, facturé +20%)
```

### 9.3 Règles Finance

**Facturation :**

```
RÈGLE: Fréquence selon pays et type
- UAE VTC: Hebdomadaire (dimanche)
- UAE Rental: Mensuelle
- France: Mensuelle (fin de mois)

RÈGLE: Pénalités retard paramétrable
DEFAULT: 1.5% par mois
MAXIMUM: Taux usure légal

RÈGLE: Relances automatiques
J+3: Email rappel
J+7: Email + SMS
J+14: Appel téléphonique
J+30: Mise en recouvrement
```

**Réconciliation Driver-Customer :**

```
RÈGLE: Compensation automatique si lien existe
CONDITION: driver_customer_links ou employer_customer_links

RÈGLE: Priorité compensation
1. Dettes anciennes d'abord
2. Montant maximum paramétrable
3. Notification obligatoire

EXEMPLE:
Driver gagne 5000 AED (VTC)
Driver doit 3000 AED (location)
→ Compensation: 3000 AED
→ Paiement net: 2000 AED
```

### 9.4 Règles Compliance

**Documents Obligatoires :**

```yaml
UAE:
  Driver:
    - Emirates ID (valide)
    - Driving License (valide)
    - Visa (si expatrié)
    - Medical Certificate (annuel)
  Vehicle:
    - Registration (Mulkiya)
    - Insurance (comprehensive)
    - Annual passing

France:
  Driver:
    - Carte d'identité/Passeport
    - Permis B (>3 ans)
    - Carte VTC
    - KBIS société (<3 mois)
  Vehicle:
    - Carte grise
    - Contrôle technique
    - Assurance pro
```

**Archivage :**

```
RÈGLE: Conservation selon juridiction
- UAE: 5 ans minimum
- France: 10 ans commercial, 6 ans fiscal

RÈGLE: Hash SHA-256 obligatoire
PURPOSE: Garantir intégrité documents

RÈGLE: Destruction automatique
AFTER: Période légale + 1 an sécurité
```

### 9.5 Règles Spéciales 2026

**Véhicules Autonomes :**

```
RÈGLE: Driver virtuel obligatoire
- 1 driver virtuel par véhicule autonome
- Peut gérer N véhicules selon config
- Revenus vont à l'operating_employer

RÈGLE: Monitoring spécial
- Télémétrie continue
- Intervention remote operator
- Logs détaillés obligatoires

RÈGLE: Responsabilité
- Amendes: Operating employer
- Accidents: Assurance spéciale
- Maintenance: Prédictive par IA
```

---

## 10. INTÉGRATIONS EXTERNES

### 10.1 Plateformes VTC

**Uber Integration :**

```typescript
class UberService {
  private oauth: OAuth2Client;

  async authenticate() {
    return this.oauth.getToken({
      client_id: process.env.UBER_CLIENT_ID,
      client_secret: process.env.UBER_CLIENT_SECRET,
      grant_type: "authorization_code",
    });
  }

  async fetchPayments(startDate: Date, endDate: Date) {
    const response = await fetch("https://api.uber.com/v1/partners/payments", {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
      params: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
    });

    return this.normalizePayments(response.data);
  }

  private normalizePayments(uberData: UberPayment[]): PlatformRevenue[] {
    return uberData.map((payment) => ({
      platform: "uber",
      trip_id: payment.trip_uuid,
      driver_id: this.mapDriverId(payment.driver_uuid),
      trip_date: payment.trip_time,
      gross_amount: payment.fare,
      platform_commission: payment.uber_fee,
      net_amount: payment.driver_earnings,
    }));
  }
}
```

**Bolt Scraping (No API) :**

```typescript
class BoltScraperService {
  private browser: Browser;

  async scrapeRevenues(credentials: Credentials) {
    const page = await this.browser.newPage();

    // Login
    await page.goto("https://fleets.bolt.eu");
    await page.type("#email", credentials.email);
    await page.type("#password", credentials.password);
    await page.click("#login-button");

    // Navigate to payments
    await page.goto("https://fleets.bolt.eu/payments");

    // Extract data
    const payments = await page.evaluate(() => {
      const rows = document.querySelectorAll(".payment-row");
      return Array.from(rows).map((row) => ({
        date: row.querySelector(".date").textContent,
        amount: parseFloat(row.querySelector(".amount").textContent),
        trips: parseInt(row.querySelector(".trips").textContent),
      }));
    });

    return this.processPayments(payments);
  }
}
```

### 10.2 Communications

**WhatsApp Business API :**

```typescript
class WhatsAppService {
  async sendMessage(to: string, template: string, params: any) {
    const response = await fetch(
      "https://graph.facebook.com/v17.0/PHONE_ID/messages",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "template",
          template: {
            name: template,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: params,
              },
            ],
          },
        }),
      }
    );

    return response.json();
  }

  // Templates pré-approuvés
  async sendPaymentReminder(driver: Driver, amount: number) {
    return this.sendMessage(driver.phone, "payment_reminder", [
      { type: "text", text: driver.first_name },
      { type: "currency", currency: { amount: amount * 100, code: "AED" } },
    ]);
  }
}
```

**Email Service (Resend) :**

```typescript
class EmailService {
  private resend: Resend;

  async sendInvoice(invoice: Invoice, customer: Customer) {
    const pdf = await this.generateInvoicePDF(invoice);

    return this.resend.emails.send({
      from: "invoices@fleetcore.ae",
      to: customer.email,
      subject: `Invoice ${invoice.number}`,
      html: await this.renderTemplate("invoice", { invoice, customer }),
      attachments: [
        {
          filename: `invoice-${invoice.number}.pdf`,
          content: pdf.toString("base64"),
        },
      ],
    });
  }
}
```

### 10.3 Banking & Payments

**Bank Statement Import :**

```typescript
interface BankTransaction {
  date: Date;
  description: string;
  reference: string;
  debit?: number;
  credit?: number;
  balance: number;
}

class BankImportService {
  async importCSV(file: File): Promise<BankTransaction[]> {
    const csv = await parseCSV(file);

    return csv.map((row) => ({
      date: parseDate(row["Date"]),
      description: row["Description"],
      reference: row["Reference"],
      debit: parseFloat(row["Debit"]) || undefined,
      credit: parseFloat(row["Credit"]) || undefined,
      balance: parseFloat(row["Balance"]),
    }));
  }

  async matchTransactions(transactions: BankTransaction[]) {
    for (const tx of transactions) {
      // Try to match with payment
      const payment = await this.findPaymentByReference(tx.reference);
      if (payment) {
        await this.reconcilePayment(payment, tx);
        continue;
      }

      // Try ML matching
      const mlMatch = await this.mlMatcher.match(tx);
      if (mlMatch.confidence > 0.9) {
        await this.reconcileMLMatch(mlMatch, tx);
        continue;
      }

      // Mark for manual review
      await this.createPendingReconciliation(tx);
    }
  }
}
```

### 10.4 Government APIs

**UAE Trade License Verification :**

```typescript
class UAEGovService {
  async verifyTradeLicense(licenseNumber: string) {
    // Call DED API (Dubai Economic Department)
    const response = await fetch("https://api.ded.ae/verify", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.DED_API_KEY,
      },
      body: JSON.stringify({ license: licenseNumber }),
    });

    return response.json();
  }

  async submitWPSReport(data: WPSData) {
    // Submit to MOHRE (Ministry of Human Resources)
    // Wage Protection System
  }
}
```

**France URSSAF Integration :**

```typescript
class FranceGovService {
  async validateSIRET(siret: string) {
    const response = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3/siret/${siret}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.INSEE_TOKEN}`,
        },
      }
    );

    return response.json();
  }

  async submitDAS2(year: number, data: DAS2Data) {
    // Annual declaration of salaries
    // Via net-entreprises.fr API
  }
}
```

---

## 11. SÉCURITÉ

### 11.1 Architecture Sécurité

**Defense in Depth :**

```
Internet → Cloudflare WAF → Vercel → Application → Supabase
             ↓                ↓           ↓           ↓
          DDoS Protection  Rate Limit  Auth Check  RLS
```

### 11.2 Authentication & Authorization

**JWT Structure :**

```json
{
  "sub": "user-uuid",
  "email": "user@company.com",
  "app_metadata": {
    "tenant_id": "tenant-uuid",
    "role": "fleet_manager",
    "permissions": ["fleet.read", "fleet.write", "driver.read"]
  },
  "exp": 1234567890
}
```

**RBAC Implementation :**

```typescript
const roles = {
  super_admin: ["*"],
  admin: ["*:*"],
  fleet_manager: ["fleet:*", "driver:*", "revenue:read"],
  finance_manager: ["invoice:*", "payment:*", "report:*"],
  agent: ["customer:read", "contract:read", "vehicle:read"],
};

// Middleware
function authorize(permission: string) {
  return (req: Request, res: Response, next: Next) => {
    const userPermissions = req.user.permissions;

    if (!hasPermission(userPermissions, permission)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

// Usage
router.post("/vehicles", authorize("fleet:write"), createVehicle);
```

### 11.3 Data Protection

**Encryption :**

```typescript
// At rest - Supabase handles via PostgreSQL TDE
// In transit - TLS 1.3 minimum

// Sensitive fields encryption
class EncryptionService {
  private key: Buffer;

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString("base64");
  }

  decrypt(encryptedText: string): string {
    const buffer = Buffer.from(encryptedText, "base64");
    const iv = buffer.slice(0, 16);
    const tag = buffer.slice(16, 32);
    const encrypted = buffer.slice(32);

    const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final("utf8");
  }
}
```

**PII Handling :**

```typescript
// Masking for logs
function maskPII(data: any): any {
  const masked = { ...data };

  // Mask sensitive fields
  if (masked.national_id) {
    masked.national_id = masked.national_id.slice(0, 3) + "****";
  }
  if (masked.phone) {
    masked.phone = masked.phone.slice(0, 4) + "****";
  }
  if (masked.email) {
    const [user, domain] = masked.email.split("@");
    masked.email = user[0] + "***@" + domain;
  }

  return masked;
}

// Audit log
logger.info("User created", maskPII(userData));
```

### 11.4 Security Headers

```typescript
// middleware/security.ts
export function securityHeaders(req: Request, res: Response, next: Next) {
  // OWASP recommended headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // CSP
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co"
  );

  // HSTS
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  next();
}
```

### 11.5 Input Validation & Sanitization

```typescript
// Validation with Zod
const createDriverSchema = z.object({
  first_name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z\s-']+$/),
  last_name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z\s-']+$/),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
  national_id: z.string().refine((val) => validateNationalId(val)),
  license_number: z.string(),
  license_expiry: z.date().min(new Date()),
});

// SQL Injection Prevention - Using Prisma parameterized queries
// Never use raw SQL concatenation
const drivers = await prisma.$queryRaw`
  SELECT * FROM drivers 
  WHERE tenant_id = ${tenantId}
  AND name LIKE ${searchTerm + "%"}
`;

// XSS Prevention
import DOMPurify from "isomorphic-dompurify";

function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
    ALLOWED_ATTR: [],
  });
}
```

---

## 12. PERFORMANCE & SCALABILITÉ

### 12.1 Database Optimization

**Indexes Strategy :**

```sql
-- Tenant isolation (most queries)
CREATE INDEX idx_tenant ON ALL_TABLES (tenant_id);

-- Frequent lookups
CREATE INDEX idx_vehicles_status ON vehicles (tenant_id, status);
CREATE INDEX idx_drivers_active ON drivers (tenant_id, status) WHERE status = 'active';
CREATE INDEX idx_assignments_current ON vehicle_assignments (vehicle_id, assigned_from, assigned_to);

-- Date ranges (reports)
CREATE INDEX idx_revenues_period ON platform_revenues (tenant_id, trip_date, driver_id);
CREATE INDEX idx_invoices_due ON invoices (tenant_id, due_date) WHERE status != 'paid';

-- JSONB searches
CREATE INDEX idx_metadata_gin ON vehicles USING gin (metadata);

-- Full text search
CREATE INDEX idx_search ON vehicles USING gin (
  to_tsvector('english', make || ' ' || model || ' ' || registration_number)
);
```

**Query Optimization :**

```typescript
// Bad - N+1 query
const drivers = await prisma.driver.findMany();
for (const driver of drivers) {
  const assignments = await prisma.vehicleAssignment.findMany({
    where: { driver_id: driver.id },
  });
}

// Good - Single query with relations
const drivers = await prisma.driver.findMany({
  include: {
    assignments: {
      include: {
        vehicle: true,
      },
    },
  },
});

// Better - Select only needed fields
const drivers = await prisma.driver.findMany({
  select: {
    id: true,
    first_name: true,
    last_name: true,
    assignments: {
      select: {
        vehicle: {
          select: {
            vin: true,
            registration_number: true,
          },
        },
      },
    },
  },
});
```

### 12.2 Caching Strategy

**Multi-Level Cache :**

```typescript
class CacheService {
  private memory: Map<string, CacheEntry> = new Map();
  private redis: Redis;

  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (instant)
    const memoryHit = this.memory.get(key);
    if (memoryHit && !this.isExpired(memoryHit)) {
      return memoryHit.value;
    }

    // L2: Redis cache (fast)
    const redisHit = await this.redis.get(key);
    if (redisHit) {
      const value = JSON.parse(redisHit);
      this.memory.set(key, { value, expires: Date.now() + 60000 });
      return value;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl: number = 3600) {
    // Set in both caches
    this.memory.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });

    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  invalidate(pattern: string) {
    // Clear matching keys
    for (const key of this.memory.keys()) {
      if (key.includes(pattern)) {
        this.memory.delete(key);
      }
    }

    // Clear Redis
    this.redis.eval(
      `
      local keys = redis.call('keys', ARGV[1])
      for i=1,#keys do
        redis.call('del', keys[i])
      end
    `,
      0,
      pattern
    );
  }
}

// Usage
const vehicles =
  (await cache.get(`vehicles:${tenantId}`)) || (await fetchAndCache());
```

### 12.3 API Performance

**Rate Limiting :**

```typescript
const rateLimiter = new RateLimiter({
  points: 100, // Requests
  duration: 60, // Per minute
  blockDuration: 60, // Block for 1 minute
});

export async function rateLimit(req: Request, res: Response, next: Next) {
  const key = `${req.context.tenantId}:${req.ip}`;

  try {
    await rateLimiter.consume(key);
    next();
  } catch {
    res.status(429).json({
      error: "Too many requests",
    });
  }
}
```

**Response Compression :**

```typescript
import compression from "compression";

app.use(
  compression({
    filter: (req, res) => {
      // Compress JSON and text
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress > 1KB
  })
);
```

### 12.4 Frontend Performance

**Code Splitting :**

```typescript
// Dynamic imports for route-based splitting
const FleetModule = dynamic(() => import('@/modules/fleet'), {
  loading: () => <ModuleLoader />,
  ssr: false
})

// Component lazy loading
const HeavyChart = lazy(() => import('@/components/charts/HeavyChart'))

function Dashboard() {
  const [showChart, setShowChart] = useState(false)

  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        Show Analytics
      </button>

      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  )
}
```

**Image Optimization :**

```typescript
import Image from 'next/image'

// Automatic optimization with Next.js
<Image
  src="/vehicle.jpg"
  alt="Vehicle"
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
  blurDataURL={vehicleBlurData}
/>

// Responsive images
<Image
  src="/hero.jpg"
  alt="Hero"
  fill
  sizes="(max-width: 768px) 100vw,
         (max-width: 1200px) 50vw,
         33vw"
  priority // Load immediately for above-fold
/>
```

### 12.5 Scalability Planning

**Horizontal Scaling :**

```yaml
# Current: Single instance
1 Server → 1 DB → 1 Cache

# Phase 1: Multiple instances (1000 vehicles)
3 Servers (Load Balanced)
    ↓
1 DB Master + 1 Read Replica
    ↓
1 Redis Cluster

# Phase 2: Regional deployment (5000 vehicles)
UAE Region:
  3 Servers → DB Cluster → Redis

France Region:
  3 Servers → DB Cluster → Redis

Cross-region sync via CDC

# Phase 3: Microservices (10000+ vehicles)
API Gateway
    ↓
Fleet Service | VTC Service | Finance Service
    ↓            ↓              ↓
Fleet DB      VTC DB        Finance DB
```

**Database Partitioning (Future) :**

```sql
-- Partition by tenant for large deployments
CREATE TABLE platform_revenues_2025_q1
PARTITION OF platform_revenues
FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

-- Partition by tenant_id for isolation
CREATE TABLE vehicles_tenant_001
PARTITION OF vehicles
FOR VALUES IN ('tenant-uuid-001');
```

---

## 13. DÉPLOIEMENT & INFRASTRUCTURE

### 13.1 Environnements

```yaml
Development:
  URL: http://localhost:3000
  Database: Local PostgreSQL
  Auth: Supabase Local
  Storage: Local filesystem

Staging:
  URL: https://staging.fleetcore.app
  Database: Supabase Staging Project
  Auth: Supabase Auth
  Storage: Supabase Storage
  Features: All enabled

Production:
  URL: https://app.fleetcore.ae
  Database: Supabase Production
  Auth: Supabase Auth + MFA
  Storage: Supabase Storage + CDN
  Features: Feature flags controlled
```

### 13.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm run test

      - name: Run E2E tests
        run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: vercel/action@v28
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true

      - name: Run migrations
        run: |
          npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: "Production deployment completed"
```

### 13.3 Infrastructure as Code

```typescript
// infrastructure/vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "regions": ["dxb1", "cdg1"], // Dubai, Paris
  "functions": {
    "app/api/v1/import/*": {
      "maxDuration": 60 // Long running imports
    }
  },
  "env": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_APP_URL": "https://app.fleetcore.ae"
  },
  "crons": [
    {
      "path": "/api/cron/weekly-payments",
      "schedule": "0 0 * * 0" // Sunday midnight
    },
    {
      "path": "/api/cron/monthly-invoices",
      "schedule": "0 0 1 * *" // 1st of month
    }
  ]
}
```

### 13.4 Backup & Disaster Recovery

```yaml
Backup Strategy:
  Database:
    Frequency: Daily automated
    Retention: 30 days
    Type: Point-in-time recovery
    Location: Cross-region replication

  Files:
    Storage: S3 compatible
    Versioning: Enabled
    Retention: 90 days

  Code:
    Repository: GitHub
    Branches: Protected main
    Tags: Version releases

Recovery Objectives:
  RTO: 4 hours (Recovery Time Objective)
  RPO: 1 hour (Recovery Point Objective)

Disaster Scenarios:
  Region Failure:
    Action: Failover to secondary region
    Time: < 30 minutes

  Data Corruption:
    Action: Restore from backup
    Time: < 2 hours

  Security Breach:
    Action: Isolate, audit, restore
    Time: < 4 hours
```

### 13.5 Deployment Checklist

```markdown
## Pre-Deployment

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] Feature flags configured

## Deployment

- [ ] Create deployment tag
- [ ] Deploy to staging
- [ ] Smoke tests on staging
- [ ] Deploy to production (canary)
- [ ] Monitor metrics (15 min)
- [ ] Full production deploy

## Post-Deployment

- [ ] Verify all services healthy
- [ ] Check error rates
- [ ] Monitor performance metrics
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Document any issues
```

---

## 14. MONITORING & OBSERVABILITÉ

### 14.1 Metrics & KPIs

**System Metrics :**

```typescript
interface SystemMetrics {
  // Performance
  response_time_p50: number;
  response_time_p95: number;
  response_time_p99: number;

  // Availability
  uptime_percentage: number;
  error_rate: number;

  // Load
  requests_per_second: number;
  concurrent_users: number;

  // Resources
  cpu_usage: number;
  memory_usage: number;
  database_connections: number;
}
```

**Business Metrics :**

```typescript
interface BusinessMetrics {
  // Fleet
  vehicles_active: number;
  utilization_rate: number;
  maintenance_overdue: number;

  // VTC
  drivers_active: number;
  revenue_processed_daily: number;
  average_driver_rating: number;

  // Rental
  contracts_active: number;
  occupancy_rate: number;
  average_rental_duration: number;

  // Finance
  invoices_overdue: number;
  collection_rate: number;
  reconciliation_accuracy: number;
}
```

### 14.2 Logging Strategy

```typescript
// Structured logging with context
class Logger {
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
  }

  info(message: string, data?: any) {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message,
        ...this.context,
        data: this.sanitize(data),
      })
    );
  }

  error(message: string, error: Error, data?: any) {
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        ...this.context,
        error: {
          message: error.message,
          stack: error.stack,
        },
        data: this.sanitize(data),
      })
    );

    // Send to Sentry
    Sentry.captureException(error, {
      contexts: { ...this.context, ...data },
    });
  }

  private sanitize(data: any) {
    // Remove PII
    return maskPII(data);
  }
}

// Usage
const logger = new Logger({
  service: "vtc",
  tenant_id: req.context.tenantId,
  user_id: req.context.userId,
  request_id: req.id,
});

logger.info("Revenue imported", {
  platform: "uber",
  trips: 150,
  amount: 5000,
});
```

### 14.3 Alerting Rules

```yaml
Critical Alerts (Immediate):
  - API response time > 5 seconds
  - Error rate > 5%
  - Database connection pool exhausted
  - Payment processing failure
  - Authentication service down

High Priority (15 minutes):
  - Disk usage > 80%
  - Memory usage > 90%
  - Failed background jobs > 10
  - Reconciliation mismatch > 1000 AED

Medium Priority (1 hour):
  - Slow queries > 1 second
  - Cache hit rate < 60%
  - Failed login attempts > 50

Low Priority (Daily):
  - Unused indexes
  - Stale data detection
  - License expiries upcoming
```

### 14.4 Dashboards

**Operations Dashboard :**

```
┌─────────────────────────────────────┐
│          FLEET OPERATIONS           │
├──────────┬──────────┬──────────────┤
│ Active   │ In Maint │ Available    │
│   850    │    45    │    105       │
├──────────┴──────────┴──────────────┤
│         Utilization Graph           │
│         ████████░░ 85%              │
├─────────────────────────────────────┤
│         Issues & Alerts             │
│ ⚠ 3 vehicles maintenance overdue    │
│ ⚠ 2 insurance expiring this week    │
└─────────────────────────────────────┘
```

**Financial Dashboard :**

```
┌─────────────────────────────────────┐
│         FINANCIAL OVERVIEW          │
├──────────┬──────────┬──────────────┤
│ Revenue  │ Collected│ Outstanding  │
│ 500K AED │ 450K AED │  50K AED     │
├──────────┴──────────┴──────────────┤
│      Collection Rate Graph          │
│      📈 90% (↑5% from last month)   │
├─────────────────────────────────────┤
│         Reconciliation              │
│ ✓ 95% auto-matched                 │
│ ⚠ 5% pending review                │
└─────────────────────────────────────┘
```

### 14.5 Tracing

```typescript
// Distributed tracing with OpenTelemetry
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("fleetcore");

async function importRevenues(platform: string) {
  const span = tracer.startSpan("import_revenues", {
    attributes: {
      platform,
      tenant_id: context.tenantId,
    },
  });

  try {
    // Fetch data
    const fetchSpan = tracer.startSpan("fetch_platform_data");
    const data = await platformService.fetch(platform);
    fetchSpan.end();

    // Process
    const processSpan = tracer.startSpan("process_revenues");
    const revenues = await processRevenues(data);
    processSpan.setAttribute("revenue_count", revenues.length);
    processSpan.end();

    // Store
    const storeSpan = tracer.startSpan("store_revenues");
    await storeRevenues(revenues);
    storeSpan.end();

    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
```

---

## 15. DOCUMENTATION & FORMATION

### 15.1 Documentation Structure

```
/docs
  /api
    openapi.yaml        # OpenAPI specification
    postman.json       # Postman collection

  /guides
    /admin
      setup.md         # Initial setup
      users.md         # User management
      parameters.md    # Configuration

    /operations
      vehicles.md      # Fleet management
      drivers.md       # Driver operations
      revenues.md      # Revenue import

    /finance
      invoicing.md     # Billing process
      reconciliation.md # Reconciliation guide
      reports.md       # Financial reports

  /technical
    architecture.md    # System architecture
    database.md       # Database schema
    deployment.md     # Deployment guide
    security.md       # Security practices
```

### 15.2 API Documentation

```yaml
# OpenAPI Specification
openapi: 3.0.0
info:
  title: FleetCore API
  version: 1.0.0
  description: Fleet management platform API

servers:
  - url: https://api.fleetcore.ae/v1
    description: Production
  - url: https://staging-api.fleetcore.ae/v1
    description: Staging

security:
  - bearerAuth: []

paths:
  /vehicles:
    get:
      summary: List vehicles
      tags: [Fleet]
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [available, assigned, maintenance]
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
      responses:
        200:
          description: Vehicles list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/Vehicle"
                  metadata:
                    $ref: "#/components/schemas/Pagination"
```

### 15.3 User Training

**Role-Based Training Modules :**

| Role            | Training Content                             | Duration |
| --------------- | -------------------------------------------- | -------- |
| Admin           | System setup, User management, Parameters    | 2 days   |
| Fleet Manager   | Vehicle operations, Maintenance, Assignments | 1 day    |
| Finance Manager | Invoicing, Payments, Reconciliation, Reports | 1 day    |
| Agent           | Customer service, Contracts, Check-in/out    | 4 hours  |

**Training Materials :**

- Video tutorials (screen recordings)
- Interactive walkthroughs
- Sandbox environment
- Quick reference cards
- FAQ documentation

### 15.4 Developer Onboarding

````markdown
## Developer Setup Guide

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 15+
- Git

### Setup Steps

1. Clone repository

```bash
git clone https://github.com/fleetcore/fleetcore.git
cd fleetcore
```
````

2. Install dependencies

```bash
npm install
```

3. Setup environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. Setup database

```bash
npx prisma migrate dev
npx prisma db seed
```

5. Start development

```bash
npm run dev
```

### Development Workflow

1. Create feature branch

```bash
git checkout -b feature/your-feature
```

2. Make changes with tests

```bash
npm run test:watch
```

3. Run checks

```bash
npm run lint
npm run type-check
npm run test
```

4. Submit PR with description

```

### 15.5 Support Procedures

**Incident Response :**
```

Level 1 (Critical):
Examples: System down, data loss, security breach
Response: Immediate (< 15 minutes)
Escalation: CTO + DevOps team

Level 2 (High):
Examples: Feature broken, performance degraded
Response: < 1 hour
Escalation: Tech lead

Level 3 (Medium):
Examples: Non-critical bug, UI issue
Response: < 4 hours
Escalation: Developer on rotation

Level 4 (Low):
Examples: Enhancement request, documentation
Response: < 24 hours
Escalation: Backlog for planning

````

---

## 16. ROADMAP & ÉVOLUTIONS

### 16.1 Phase 1: MVP (Current - 4 weeks)

**Core Features :**
- ✅ Multi-tenant architecture
- ✅ Vehicle & Driver management
- ✅ Revenue import (manual + Uber API)
- ✅ Basic reconciliation
- ✅ Invoice generation
- ✅ Parameter system

**Target :**
- 3 pilot customers
- 500 vehicles
- UAE only

### 16.2 Phase 2: Production (Q1 2025)

**Additions :**
- Bolt/Careem integration
- WhatsApp notifications
- Advanced reporting
- Mobile app (drivers)
- France support
- Customer portal

**Target :**
- 20 customers
- 2,000 vehicles
- UAE + France

### 16.3 Phase 3: Scale (Q2-Q3 2025)

**Enhancements :**
- ML-powered reconciliation
- Predictive maintenance
- Route optimization
- Multi-language (Arabic)
- B2C rental module
- API marketplace

**Target :**
- 50 customers
- 5,000 vehicles
- 3 countries

### 16.4 Phase 4: Innovation (Q4 2025 - 2026)

**Future Features :**
- Autonomous vehicle support
- AI driver virtual
- Blockchain documents
- IoT integration
- Dynamic pricing
- Carbon tracking

**Target :**
- 100+ customers
- 10,000+ vehicles
- 5+ countries
- First autonomous fleets

### 16.5 Technical Debt & Refactoring

**Planned Improvements :**

```markdown
## Q1 2025
- [ ] Migrate to Prisma 7
- [ ] Implement GraphQL (optional endpoints)
- [ ] Add Redis cache layer
- [ ] Improve test coverage to 80%

## Q2 2025
- [ ] Extract notification service
- [ ] Implement event sourcing for audit
- [ ] Add Kubernetes support
- [ ] Database read replicas

## Q3 2025
- [ ] Microservices extraction (Finance module)
- [ ] API Gateway implementation
- [ ] Multi-region database
- [ ] CDN for static assets

## Q4 2025
- [ ] Full microservices architecture
- [ ] Service mesh (Istio)
- [ ] Advanced monitoring (Datadog)
- [ ] Chaos engineering tests
````

### 16.6 Success Metrics

**Technical KPIs :**

- API response time < 200ms (p95)
- Uptime > 99.9%
- Zero security incidents
- Deployment frequency > 2/week
- Test coverage > 80%

**Business KPIs :**

- 100 customers by end 2025
- 10,000 vehicles managed
- 95% reconciliation automation
- 90% customer satisfaction
- 5 countries coverage

---

## CONCLUSION

FleetCore est conçu pour être une plateforme évolutive, maintenable et extensible. Les principes clés sont :

1. **Zero Hardcoding** - Flexibilité totale via paramétrage
2. **Multi-tenant Native** - Isolation et scalabilité
3. **API-First** - Intégrations facilitées
4. **Module Architecture** - Évolution vers microservices
5. **Automation Focus** - Réduction travail manuel

Le système est prêt pour gérer les besoins actuels (VTC + Location) tout en étant architecturé pour le futur (véhicules autonomes, expansion internationale).

---

**Document maintenu par :** FleetCore Team  
**Dernière mise à jour :** Septembre 2025  
**Version :** 1.0.0  
**Statut :** ACTIF

---

## ANNEXES

### A. Glossaire Technique

- **RLS** : Row Level Security (PostgreSQL)
- **JWT** : JSON Web Token
- **ORM** : Object Relational Mapping
- **RBAC** : Role-Based Access Control
- **PWA** : Progressive Web App
- **CSP** : Content Security Policy
- **PII** : Personally Identifiable Information
- **CDC** : Change Data Capture
- **SLA** : Service Level Agreement
- **RTO/RPO** : Recovery Time/Point Objective

### B. Références

- Database Schema : `FLEETCORE_DATABASE_SPECIFICATION_COMPLETE.md`
- API Documentation : `https://api.fleetcore.ae/docs`
- Postman Collection : `https://postman.fleetcore.ae/collection`
- Support : `support@fleetcore.ae`
- Repository : `https://github.com/fleetcore/fleetcore`

### C. Contacts

| Role          | Contact              | Responsabilité |
| ------------- | -------------------- | -------------- |
| Product Owner | owner@fleetcore.ae   | Vision produit |
| Tech Lead     | tech@fleetcore.ae    | Architecture   |
| DevOps        | devops@fleetcore.ae  | Infrastructure |
| Support       | support@fleetcore.ae | Client support |

---

END OF DOCUMENT
