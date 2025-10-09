# 🚀 FLEETCORE - PLAN DE DÉVELOPPEMENT MVP (ULTRA-DÉTAILLÉ)

**Date:** 9 Octobre 2025
**Base:** 55 tables déployées + Stack actuel (Next.js 15 + Supabase + Clerk)
**Objectif:** MVP production-ready en **16 semaines (4 mois)**

---

## 📊 ÉTAT ACTUEL (BASELINE)

### ✅ Déjà en place

#### Infrastructure

```json
{
  "hosting": "Vercel (Next.js 15.5.3)",
  "database": "Supabase PostgreSQL (55 tables)",
  "orm": "Prisma 6.16.2",
  "auth": "Clerk 6.32.2 (Organizations)",
  "emails": "Resend 6.1.0",
  "monitoring": "Sentry 10.13.0"
}
```

#### Frontend

```typescript
// Stack confirmé
- React 19.1.0
- TailwindCSS 4.1.13
- Framer Motion 12.23.19
- Radix UI (Label, Select, Slot, Tabs)
- Lucide React (icons)
- i18next 25.5.2 (FR/EN)

// Structure actuelle
app/
├── [locale]/               # Routing localisé
│   ├── (auth)/            # Pages login/register/forgot ✅
│   ├── (public)/          # Homepage + request-demo ✅
│   ├── dashboard/         # Dashboard (vide, à implémenter)
│   └── page.tsx           # Homepage
├── adm/                   # Admin panel (leads management) ✅
│   ├── leads/
│   └── organizations/
└── api/
    ├── demo-leads/        # CRM leads CRUD ✅
    └── webhooks/clerk/    # Member sync ✅
```

#### Components UI

```typescript
components/
├── auth/                  # Clerk components ✅
└── ui/                    # Radix UI components ✅
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── label.tsx
    ├── select.tsx
    └── tabs.tsx
```

### ❌ À implémenter

```
Dashboard principal (aucune page encore)
APIs métier (fleet, drivers, trips, finance)
Services business logic
Intégrations externes (Stripe, Chatwoot, Traccar)
Reports & Analytics
```

---

## 🎯 ARCHITECTURE CIBLE

### Pattern API standardisé

```typescript
// Suivre le pattern existant de demo-leads/
app/api/
├── v1/                    # Versioned API (NOUVEAU)
│   ├── fleet/
│   │   ├── vehicles/
│   │   ├── assignments/
│   │   └── events/
│   ├── drivers/
│   │   ├── route.ts       # GET list, POST create
│   │   └── [id]/
│   │       ├── route.ts   # GET, PATCH, DELETE
│   │       ├── documents/
│   │       ├── performance/
│   │       └── requests/
│   ├── trips/
│   ├── finance/
│   └── analytics/
├── integrations/          # External services (NOUVEAU)
│   ├── stripe/
│   ├── chatwoot/
│   └── traccar/
└── webhooks/              # Webhooks (existant)
    ├── clerk/             ✅
    ├── stripe/            (NOUVEAU)
    └── chatwoot/          (NOUVEAU)
```

### Services Layer (NOUVEAU)

```typescript
lib/
├── api/                   # API utilities
│   ├── createHandler.ts   # Standardized API wrapper
│   ├── withAuth.ts        # Clerk middleware
│   ├── withTenant.ts      # RLS tenant injection
│   └── ApiResponse.ts     # Uniform response format
├── services/              # Business logic
│   ├── VehicleService.ts
│   ├── DriverService.ts
│   ├── TripService.ts
│   ├── FinanceService.ts
│   └── BillingService.ts
├── integrations/          # External clients
│   ├── StripeClient.ts
│   ├── ChatwootClient.ts
│   ├── TraccarClient.ts
│   ├── UberClient.ts
│   └── BoltClient.ts
└── validation/            # Zod schemas
    ├── vehicle.schema.ts
    ├── driver.schema.ts
    └── trip.schema.ts
```

---

## 📋 PLAN PHASE PAR PHASE

## PHASE 0: FONDATIONS BACKEND (Semaines 1-2)

**Objectif:** Créer l'architecture API/services réutilisable

### 0.1 API Framework (Semaine 1)

**Dev:** 1 Backend Senior | **Durée:** 5 jours

#### Fichiers à créer

**1. `lib/api/createHandler.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

type ApiHandler<T> = (req: NextRequest, context?: any) => Promise<T>;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function createApiHandler<T>(handler: ApiHandler<T>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const data = await handler(req, context);

      return NextResponse.json({
        success: true,
        data,
      } as ApiResponse<T>);
    } catch (error) {
      Sentry.captureException(error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json(
          { success: false, error: "Database error", message: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
```

**2. `lib/api/withAuth.ts`**

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function withAuth() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId, orgId };
}
```

**3. `lib/api/withTenant.ts`**

```typescript
import { db } from "@/lib/prisma";
import { withAuth } from "./withAuth";

export async function withTenant() {
  const auth = await withAuth();

  if (!auth.orgId) {
    return { error: "No organization selected", status: 400 };
  }

  // Get tenant from clerk_organization_id
  const tenant = await db.adm_tenants.findFirst({
    where: { clerk_organization_id: auth.orgId },
  });

  if (!tenant) {
    return { error: "Tenant not found", status: 404 };
  }

  return { userId: auth.userId, tenant };
}
```

**4. `lib/api/pagination.ts`**

```typescript
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePaginationParams(url: URL): PaginationParams {
  return {
    page: parseInt(url.searchParams.get("page") || "1"),
    limit: parseInt(url.searchParams.get("limit") || "20"),
    cursor: url.searchParams.get("cursor") || undefined,
  };
}
```

**Tests:** 15 tests unitaires

---

### 0.2 Service Layer Pattern (Semaine 2)

**Dev:** 1 Backend Senior | **Durée:** 5 jours

#### Template de service

**1. `lib/services/BaseService.ts`**

```typescript
import { db } from "@/lib/prisma";

export abstract class BaseService {
  protected db = db;

  protected async withAudit<T>(
    operation: () => Promise<T>,
    userId: string
  ): Promise<T> {
    // Auto-inject created_by/updated_by
    return operation();
  }
}
```

**2. `lib/validation/schemas/vehicle.schema.ts`**

```typescript
import { z } from "zod";

export const CreateVehicleSchema = z.object({
  make_id: z.string().uuid(),
  model_id: z.string().uuid(),
  license_plate: z.string().min(1).max(20),
  vin: z.string().optional(),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  color: z.string().optional(),
  seats: z.number().int().min(2).max(50).default(4),
});

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
```

**Tests:** 10 tests

---

## PHASE 1: MODULE FLEET (Semaines 3-5)

**Objectif:** CRUD complet véhicules + événements + documents

### 1.1 Backend Fleet (Semaine 3)

**Dev:** 1 Backend + 1 Junior | **Durée:** 5 jours

#### APIs à créer

**1. `app/api/v1/fleet/vehicles/route.ts`**

```typescript
import { createApiHandler } from "@/lib/api/createHandler";
import { withTenant } from "@/lib/api/withTenant";
import { VehicleService } from "@/lib/services/VehicleService";
import { CreateVehicleSchema } from "@/lib/validation/schemas/vehicle.schema";

const vehicleService = new VehicleService();

// GET /api/v1/fleet/vehicles?page=1&status=active
export const GET = createApiHandler(async (req) => {
  const { tenant } = await withTenant();
  const url = new URL(req.url);

  const filters = {
    status: url.searchParams.get("status"),
    make_id: url.searchParams.get("make_id"),
  };

  return vehicleService.listVehicles(tenant.id, filters);
});

// POST /api/v1/fleet/vehicles
export const POST = createApiHandler(async (req) => {
  const { tenant, userId } = await withTenant();
  const body = await req.json();

  const validated = CreateVehicleSchema.parse(body);

  return vehicleService.createVehicle(tenant.id, validated, userId);
});
```

**2. `app/api/v1/fleet/vehicles/[id]/route.ts`**

```typescript
// GET, PATCH, DELETE single vehicle
export const GET = createApiHandler(async (req, { params }) => {
  const { tenant } = await withTenant();
  return vehicleService.getVehicle(tenant.id, params.id);
});

export const PATCH = createApiHandler(async (req, { params }) => {
  const { tenant, userId } = await withTenant();
  const body = await req.json();

  return vehicleService.updateVehicle(tenant.id, params.id, body, userId);
});

export const DELETE = createApiHandler(async (req, { params }) => {
  const { tenant, userId } = await withTenant();
  return vehicleService.archiveVehicle(tenant.id, params.id, userId);
});
```

**3. `app/api/v1/fleet/vehicles/[id]/events/route.ts`**

```typescript
// GET vehicle events (timeline)
// POST new event
export const GET = createApiHandler(async (req, { params }) => {
  const { tenant } = await withTenant();
  return vehicleService.getVehicleEvents(tenant.id, params.id);
});

export const POST = createApiHandler(async (req, { params }) => {
  const { tenant, userId } = await withTenant();
  const body = await req.json();

  return vehicleService.recordEvent(tenant.id, params.id, body, userId);
});
```

#### Service Implementation

**4. `lib/services/VehicleService.ts`**

```typescript
import { BaseService } from "./BaseService";
import { CreateVehicleInput } from "@/lib/validation/schemas/vehicle.schema";

export class VehicleService extends BaseService {
  async listVehicles(tenantId: string, filters: any) {
    return this.db.flt_vehicles.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        ...filters,
      },
      include: {
        make: true,
        model: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async createVehicle(
    tenantId: string,
    data: CreateVehicleInput,
    userId: string
  ) {
    return this.db.flt_vehicles.create({
      data: {
        tenant_id: tenantId,
        ...data,
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  async getVehicle(tenantId: string, vehicleId: string) {
    const vehicle = await this.db.flt_vehicles.findFirst({
      where: {
        id: vehicleId,
        tenant_id: tenantId,
        deleted_at: null,
      },
      include: {
        make: true,
        model: true,
        events: {
          orderBy: { event_date: "desc" },
          take: 10,
        },
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    return vehicle;
  }

  async updateVehicle(
    tenantId: string,
    vehicleId: string,
    data: Partial<CreateVehicleInput>,
    userId: string
  ) {
    return this.db.flt_vehicles.update({
      where: { id: vehicleId, tenant_id: tenantId },
      data: {
        ...data,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  async archiveVehicle(tenantId: string, vehicleId: string, userId: string) {
    return this.db.flt_vehicles.update({
      where: { id: vehicleId, tenant_id: tenantId },
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
      },
    });
  }

  async recordEvent(
    tenantId: string,
    vehicleId: string,
    event: any,
    userId: string
  ) {
    return this.db.flt_vehicle_events.create({
      data: {
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        event_type: event.event_type,
        event_date: new Date(event.event_date),
        severity: event.severity || "low",
        cost_amount: event.cost_amount,
        currency: event.currency || "EUR",
        details: event.details || {},
        notes: event.notes,
        created_by: userId,
      },
    });
  }

  async getVehicleEvents(tenantId: string, vehicleId: string) {
    return this.db.flt_vehicle_events.findMany({
      where: {
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        deleted_at: null,
      },
      orderBy: { event_date: "desc" },
    });
  }
}
```

**Tests:** 40 tests unitaires + 15 tests d'intégration

---

### 1.2 Frontend Fleet (Semaines 4-5)

**Dev:** 1 Frontend + 1 Junior | **Durée:** 10 jours

#### Pages à créer

**1. `app/[locale]/dashboard/fleet/page.tsx`**

```typescript
import { Suspense } from 'react';
import { VehicleList } from './components/VehicleList';
import { VehicleFilters } from './components/VehicleFilters';

export default async function FleetPage() {
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Fleet Management</h1>
        <Link href="/dashboard/fleet/vehicles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      <VehicleFilters />

      <Suspense fallback={<VehicleListSkeleton />}>
        <VehicleList />
      </Suspense>
    </div>
  );
}
```

**2. `app/[locale]/dashboard/fleet/vehicles/[id]/page.tsx`**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleOverview } from './components/VehicleOverview';
import { VehicleEvents } from './components/VehicleEvents';
import { VehicleDocuments } from './components/VehicleDocuments';

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', params.id],
    queryFn: () => fetch(`/api/v1/fleet/vehicles/${params.id}`).then(r => r.json()),
  });

  if (isLoading) return <VehicleDetailSkeleton />;

  return (
    <div className="container py-8">
      <VehicleHeader vehicle={vehicle.data} />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <VehicleOverview vehicle={vehicle.data} />
        </TabsContent>

        <TabsContent value="events">
          <VehicleEvents vehicleId={params.id} />
        </TabsContent>

        <TabsContent value="documents">
          <VehicleDocuments vehicleId={params.id} />
        </TabsContent>

        <TabsContent value="performance">
          <VehiclePerformance vehicleId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**3. Components réutilisables**

```typescript
// app/[locale]/dashboard/fleet/vehicles/components/VehicleList.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { VehicleCard } from './VehicleCard';

export function VehicleList() {
  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => fetch('/api/v1/fleet/vehicles').then(r => r.json()),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data?.data?.map(vehicle => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}

// VehicleCard.tsx
export function VehicleCard({ vehicle }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{vehicle.license_plate}</h3>
            <p className="text-sm text-muted-foreground">
              {vehicle.make.name} {vehicle.model.name} {vehicle.year}
            </p>
          </div>
          <VehicleStatusBadge status={vehicle.status} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">VIN:</span>
            <span className="font-mono">{vehicle.vin || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Odometer:</span>
            <span>{vehicle.odometer?.toLocaleString()} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Next Inspection:</span>
            <span>{formatDate(vehicle.next_inspection)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Link href={`/dashboard/fleet/vehicles/${vehicle.id}`}>
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
```

**Tests:** 30 tests composants + 10 tests E2E

---

## PHASE 2: MODULE DRIVERS (Semaines 6-8)

**Objectif:** Onboarding + performance + documents

### 2.1 Backend Drivers (Semaine 6)

**Dev:** 1 Backend | **Durée:** 5 jours

#### APIs

**1. `app/api/v1/drivers/route.ts`**

```typescript
// GET list, POST create
// Suivre même pattern que vehicles
```

**2. `app/api/v1/drivers/[id]/route.ts`**

```typescript
// GET, PATCH, DELETE
```

**3. `app/api/v1/drivers/[id]/documents/route.ts`**

```typescript
// Upload documents via doc_documents
```

**4. `app/api/v1/drivers/[id]/performance/route.ts`**

```typescript
// Calculate KPIs from trips
```

**5. `lib/services/DriverService.ts`**

```typescript
export class DriverService extends BaseService {
  async onboardDriver(data: OnboardDriverInput, userId: string) {
    // 3-step wizard logic
    // 1. Create driver
    // 2. Upload documents
    // 3. Set cooperation terms
  }

  async calculatePerformance(driverId: string, period: DateRange) {
    // Aggregate from trp_trips
    // Store in rid_driver_performances
  }
}
```

**Tests:** 35 tests

---

### 2.2 Frontend Drivers (Semaines 7-8)

**Dev:** 1 Frontend + 1 Junior | **Durée:** 10 jours

#### Pages

**1. `app/[locale]/dashboard/drivers/page.tsx`**

- Liste drivers avec filtres (status, rating)

**2. `app/[locale]/dashboard/drivers/new/page.tsx`**

- Wizard 3 étapes (Personal info → Documents → Cooperation terms)

**3. `app/[locale]/dashboard/drivers/[id]/page.tsx`**

- Tabs: Overview, Documents, Performance, Requests

**4. Driver Portal (interface chauffeur)**

```typescript
// app/[locale]/driver-portal/page.tsx
export default async function DriverPortalPage() {
  const driver = await getCurrentDriver();

  return (
    <div>
      <DriverDashboard driver={driver} />
      <EarningsOverview driverId={driver.id} />
      <RecentTrips driverId={driver.id} />
    </div>
  );
}

// app/[locale]/driver-portal/earnings/page.tsx
// Graphiques revenus par jour/semaine/mois
```

**Tests:** 35 tests + 12 E2E

---

## PHASE 3: MODULE TRIPS (Semaine 9)

**Objectif:** Import courses + analytics

### Backend + Frontend

**Dev:** 2 Full-stack | **Durée:** 5 jours

#### APIs

**1. `app/api/v1/trips/route.ts`**

- GET list avec filtres (date, platform, driver, status)
- POST create manual trip

**2. `app/api/v1/trips/import/route.ts`**

- POST bulk import from platform CSV/JSON

**3. `app/api/integrations/uber/webhook/route.ts`**

```typescript
// Receive trip updates from Uber
export async function POST(req: Request) {
  const webhook = await req.json();

  // Verify signature
  // Process trip event
  // Update trp_trips
}
```

**4. `lib/integrations/UberClient.ts`**

```typescript
export class UberClient {
  async fetchTrips(startDate: Date, endDate: Date) {
    // Call Uber API
    // Transform to our schema
    // Return normalized trips
  }
}
```

#### Pages

**1. `app/[locale]/dashboard/trips/page.tsx`**

- DataTable avec filtres avancés

**2. `app/[locale]/dashboard/trips/[id]/page.tsx`**

- Détails course + map pickup→dropoff

**Tests:** 30 tests + 10 E2E

---

## PHASE 4: MODULE FINANCE (Semaines 10-11)

**Objectif:** Paiements WPS + transactions

### 4.1 Backend Finance (Semaine 10)

**Dev:** 1 Backend | **Durée:** 5 jours

#### APIs

**1. `app/api/v1/finance/driver-payments/batches/route.ts`**

```typescript
// GET list batches
// POST create new batch
```

**2. `app/api/v1/finance/driver-payments/batches/[id]/export-sif/route.ts`**

```typescript
// Generate WPS SIF file for UAE banks
export async function GET(req, { params }) {
  const batch = await db.fin_driver_payment_batches.findUnique({
    where: { id: params.id },
    include: { payments: true },
  });

  const sifContent = generateSIFFile(batch);

  return new Response(sifContent, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="WPS_${batch.batch_reference}.txt"`,
    },
  });
}
```

**3. `lib/services/WPSService.ts`**

```typescript
export class WPSService {
  generateSIFFile(batch: PaymentBatch): string {
    // Format: Bank-specific SIF format
    // Header + Detail lines + Trailer
  }
}
```

**Tests:** 25 tests

---

### 4.2 Frontend Finance (Semaine 11)

**Dev:** 1 Frontend | **Durée:** 5 jours

#### Pages

**1. `app/[locale]/dashboard/finance/overview/page.tsx`**

- Dashboard cashflow (revenus, dépenses, balance)

**2. `app/[locale]/dashboard/finance/driver-payments/page.tsx`**

- Liste batches WPS avec statuts

**3. `app/[locale]/dashboard/finance/transactions/page.tsx`**

- Grand livre (fin_transactions)

**Tests:** 20 tests + 8 E2E

---

## PHASE 5: INTÉGRATIONS EXTERNES (Semaines 12-13)

**Objectif:** Stripe + Chatwoot

### 5.1 Stripe Billing (Semaine 12)

**Dev:** 1 Backend | **Durée:** 5 jours

#### Setup

```bash
pnpm add stripe @stripe/stripe-js
```

#### Configuration Stripe Dashboard

```
Products:
- Basic: $49/month
- Pro: $99/month
- Enterprise: Custom

Metered billing:
- Extra driver: $5/driver
- Extra vehicle: $3/vehicle
```

#### APIs

**1. `app/api/billing/subscription/route.ts`**

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { tenant, planId } = await req.json();

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: tenant.email,
    metadata: { tenant_id: tenant.id },
  });

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: planId }],
  });

  return NextResponse.json({ subscription });
}
```

**2. `app/api/billing/webhooks/stripe/route.ts`**

```typescript
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
```

**3. Cron Job: Sync Usage**

```typescript
// lib/jobs/syncUsageToStripe.ts
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/prisma";

export async function syncUsageToStripe() {
  const tenants = await db.adm_tenants.findMany({
    where: { status: "active" },
  });

  for (const tenant of tenants) {
    // Read bil_tenant_usage_metrics
    const metrics = await db.bil_tenant_usage_metrics.findFirst({
      where: { tenant_id: tenant.id, period_start: startOfMonth(new Date()) },
    });

    // Report to Stripe
    await stripe.subscriptionItems.createUsageRecord(
      tenant.stripe_subscription_item_id,
      {
        quantity: metrics.metric_value,
        timestamp: Math.floor(Date.now() / 1000),
      }
    );
  }
}
```

**Frontend:**

```typescript
// app/[locale]/dashboard/billing/page.tsx
import { loadStripe } from '@stripe/stripe-js';

export function BillingPage() {
  const handleUpgrade = async (planId: string) => {
    const res = await fetch('/api/billing/subscription', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });

    const { sessionId } = await res.json();
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);
    await stripe.redirectToCheckout({ sessionId });
  };

  return (
    <div>
      <CurrentPlan />
      <UsageMetrics />
      <UpgradePlans onSelectPlan={handleUpgrade} />
    </div>
  );
}
```

**Tests:** 20 tests

---

### 5.2 Chatwoot Support (Semaine 13)

**Dev:** 1 Full-stack | **Durée:** 5 jours

#### Setup

```bash
# Self-hosted or Cloud
CHATWOOT_URL=https://app.chatwoot.com
CHATWOOT_API_TOKEN=xxx
CHATWOOT_ACCOUNT_ID=1
```

#### New Table

```sql
CREATE TABLE sup_ticket_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES adm_tenants,
  chatwoot_conversation_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### APIs

**1. `app/api/support/conversations/route.ts`**

```typescript
import { ChatwootClient } from "@/lib/integrations/ChatwootClient";

const chatwoot = new ChatwootClient();

export async function GET() {
  const { tenant } = await withTenant();

  const conversations = await chatwoot.getConversations(tenant.id);

  return NextResponse.json({ data: conversations });
}

export async function POST(req: Request) {
  const { tenant } = await withTenant();
  const { subject, description } = await req.json();

  const conversation = await chatwoot.createConversation({
    accountId: process.env.CHATWOOT_ACCOUNT_ID!,
    inboxId: tenant.chatwoot_inbox_id,
    contactId: tenant.chatwoot_contact_id,
    message: { content: `${subject}\n\n${description}` },
  });

  // Save mapping
  await db.sup_ticket_mapping.create({
    data: {
      tenant_id: tenant.id,
      chatwoot_conversation_id: conversation.id,
    },
  });

  return NextResponse.json({ data: conversation });
}
```

**2. `lib/integrations/ChatwootClient.ts`**

```typescript
export class ChatwootClient {
  private baseUrl = process.env.CHATWOOT_URL!;
  private token = process.env.CHATWOOT_API_TOKEN!;

  async createConversation(data: CreateConversationInput) {
    const res = await fetch(
      `${this.baseUrl}/api/v1/accounts/${data.accountId}/conversations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_access_token: this.token,
        },
        body: JSON.stringify(data),
      }
    );

    return res.json();
  }

  async getConversations(tenantId: string) {
    // Get mappings
    const mappings = await db.sup_ticket_mapping.findMany({
      where: { tenant_id: tenantId },
    });

    // Fetch from Chatwoot API
    const conversations = await Promise.all(
      mappings.map((m) => this.getConversation(m.chatwoot_conversation_id))
    );

    return conversations;
  }
}
```

**Frontend:**

```typescript
// app/[locale]/dashboard/support/page.tsx
'use client';

import Script from 'next/script';

export default function SupportPage() {
  return (
    <>
      <Script
        src="https://app.chatwoot.com/packs/js/sdk.js"
        onLoad={() => {
          window.chatwootSettings = {
            hideMessageBubble: false,
            position: 'right',
            locale: 'en',
            type: 'expanded_bubble',
          };
          window.chatwootSDK.run({
            websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_TOKEN,
            baseUrl: 'https://app.chatwoot.com',
          });
        }}
      />

      <div className="container py-8">
        <h1>Support</h1>
        <TicketList />
      </div>
    </>
  );
}
```

**Tests:** 15 tests

---

## PHASE 6: ANALYTICS & REPORTS (Semaine 14)

**Objectif:** Dashboards + exports

**Dev:** 1 Full-stack | **Durée:** 5 jours

### APIs

**1. `app/api/v1/analytics/overview/route.ts`**

```typescript
export async function GET() {
  const { tenant } = await withTenant();

  const kpis = await db.$transaction([
    db.flt_vehicles.count({
      where: { tenant_id: tenant.id, status: "active" },
    }),
    db.rid_drivers.count({
      where: { tenant_id: tenant.id, driver_status: "active" },
    }),
    db.trp_trips.count({
      where: {
        tenant_id: tenant.id,
        trip_date: { gte: startOfMonth(new Date()) },
      },
    }),
    db.trp_trips.aggregate({
      where: { tenant_id: tenant.id },
      _sum: { net_earnings: true },
    }),
  ]);

  return NextResponse.json({
    activeVehicles: kpis[0],
    activeDrivers: kpis[1],
    tripsThisMonth: kpis[2],
    totalRevenue: kpis[3]._sum.net_earnings,
  });
}
```

**2. `app/api/v1/reports/fleet/route.ts?format=pdf`**

```typescript
import jsPDF from "jspdf";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "json";

  const data = await generateFleetReport();

  if (format === "pdf") {
    const pdf = new jsPDF();
    // Generate PDF
    return new Response(pdf.output("arraybuffer"), {
      headers: { "Content-Type": "application/pdf" },
    });
  }

  return NextResponse.json(data);
}
```

### Frontend

```typescript
// app/[locale]/dashboard/page.tsx
import { Suspense } from 'react';
import { KPICards } from './components/KPICards';
import { RevenueChart } from './components/RevenueChart';

export default async function DashboardPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={<KPICardsSkeleton />}>
        <KPICards />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RevenueChart />
        <TopDriversTable />
      </div>
    </div>
  );
}
```

**Tests:** 15 tests + 8 E2E

---

## PHASE 7: POLISH & TESTING (Semaines 15-16)

**Objectif:** UX refinement + E2E tests complets

### 7.1 Mobile Responsive (Semaine 15)

**Dev:** 1 Frontend | **Durée:** 5 jours

- Touch gestures (swipe to delete, pull to refresh)
- Mobile navigation (bottom tabs)
- Offline mode (service worker + IndexedDB)

### 7.2 Performance (Semaine 15)

**Dev:** 1 Full-stack | **Durée:** 5 jours

- Image optimization (Next.js Image)
- Code splitting (dynamic imports)
- Database query optimization (indexes review)
- Caching strategy (React Query + Redis)

### 7.3 Testing & QA (Semaine 16)

**Dev:** 1 QA | **Durée:** 5 jours

- E2E tests complets (Playwright)
- Load testing (k6 or Artillery)
- Security audit (OWASP checklist)
- Accessibility audit (WCAG 2.1)

---

## 📊 RÉSUMÉ TIMELINE

| Phase       | Semaines | Durée | Équipe        | Livrables                            |
| ----------- | -------- | ----- | ------------- | ------------------------------------ |
| **Phase 0** | 1-2      | 10j   | 1 Backend     | API framework + Services pattern     |
| **Phase 1** | 3-5      | 15j   | 2 Full-stack  | Fleet module (vehicles + events)     |
| **Phase 2** | 6-8      | 15j   | 2 Full-stack  | Drivers module + portal              |
| **Phase 3** | 9        | 5j    | 2 Full-stack  | Trips module + platform integrations |
| **Phase 4** | 10-11    | 10j   | 2 devs        | Finance module + WPS                 |
| **Phase 5** | 12-13    | 10j   | 2 devs        | Stripe + Chatwoot                    |
| **Phase 6** | 14       | 5j    | 1 Full-stack  | Analytics + Reports                  |
| **Phase 7** | 15-16    | 10j   | 2 devs + 1 QA | Polish + Testing                     |

**TOTAL: 16 semaines (4 mois)**

---

## 👥 ÉQUIPE REQUISE

- **1 Tech Lead** (architecture + code reviews)
- **2 Full-stack Senior** (backend + frontend)
- **2 Full-stack Junior** (feature development)
- **1 QA Engineer** (testing + automation)

**Total: 6 FTE**

---

## 🎯 CRITÈRES DE SUCCÈS MVP

### Fonctionnels

✅ CRUD complet sur véhicules (25 champs, 5 event types)
✅ CRUD complet sur drivers (onboarding 3 étapes)
✅ Import automatique trips (Uber, Bolt, Careem)
✅ Paiements WPS (export SIF)
✅ Facturation SaaS (Stripe)
✅ Support client (Chatwoot widget)
✅ Dashboard analytics (10 KPIs)

### Techniques

✅ Response time <2s (p95)
✅ 80% test coverage (critical paths)
✅ Zero downtime deployments (Vercel)
✅ Error rate <0.1% (Sentry)
✅ Lighthouse score >90

### Business

✅ 10 tenants beta testeurs
✅ 500 vehicles registered
✅ 1000 drivers onboarded
✅ $10k MRR

---

## 🚀 DÉMARRAGE IMMÉDIAT

### Semaine 1 - Jour 1

1. ✅ Créer `lib/api/createHandler.ts`
2. ✅ Créer `lib/api/withAuth.ts`
3. ✅ Créer `lib/api/withTenant.ts`
4. ✅ Tests unitaires (15 tests)

### Semaine 1 - Jour 2

1. ✅ Créer `lib/services/BaseService.ts`
2. ✅ Créer `lib/validation/schemas/vehicle.schema.ts`
3. ✅ Tests (10 tests)

### Semaine 1 - Jour 3

1. ✅ Créer `app/api/v1/fleet/vehicles/route.ts`
2. ✅ Créer `lib/services/VehicleService.ts`
3. ✅ Tests (20 tests)

---

**STATUS:** ✅ PLAN VALIDÉ - PRÊT À DÉMARRER
**NEXT:** Créer les fichiers Phase 0 (API framework)
