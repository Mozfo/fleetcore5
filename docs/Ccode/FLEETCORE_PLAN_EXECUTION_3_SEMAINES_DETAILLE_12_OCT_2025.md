# FLEETCORE - PLAN D'EXÉCUTION 3 SEMAINES (SCÉNARIO 1)

## Bridge vers Plan Global 26 Semaines

**Date:** 12 Octobre 2025 - 18h00 Dubai  
**Version:** 1.0 ULTRA DÉTAILLÉE  
**Statut Actuel:** Phase 1 à 49% (27/55 APIs)  
**Durée Plan:** 3 semaines (21 jours calendaires)  
**Référence Plan Global:** FLEETCORE_STATUT_VS_PLAN_DEFINITIF_12_OCT_2025.md

---

## 📋 TABLE DES MATIÈRES

1. [Contexte et Justification](#1-contexte-et-justification)
2. [Vue d'Ensemble 3 Semaines](#2-vue-densemble-3-semaines)
3. [Semaine 1: Directory APIs (5 jours)](#3-semaine-1-directory-apis)
4. [Semaine 2: Fleet & Driver Completion (5 jours)](#4-semaine-2-fleet--driver-completion)
5. [Semaine 3: MVP Dashboard (5 jours)](#5-semaine-3-mvp-dashboard)
6. [Bridge vers Plan Global 26 Semaines](#6-bridge-vers-plan-global-26-semaines)
7. [Protocole de Travail Claude Code](#7-protocole-de-travail-claude-code)
8. [Critères de Validation](#8-critères-de-validation)
9. [Risques et Mitigations](#9-risques-et-mitigations)
10. [Documents de Continuité](#10-documents-de-continuité)

---

## 1. CONTEXTE ET JUSTIFICATION

### 1.1 État Actuel Projet

**Date de démarrage:** 10 Octobre 2025  
**Temps écoulé:** 2 jours ouvrés  
**Progression Phase 1:** 49% (27/55 APIs)

**Réalisations confirmées:**

- ✅ Architecture Core (BaseService, BaseRepository, Errors) - 100%
- ✅ Vehicle APIs - 10/20 endpoints (50%)
- ✅ Driver APIs - 17/25 endpoints (68%)
- ✅ Services métier - 4/6 (VehicleService, DriverService partiel, DocumentService, EmailService)
- ✅ Repositories - 2 (VehicleRepository, DriverRepository)
- ✅ Migration DB UAE complete (9 champs RH)
- ✅ Multi-tenant isolation stricte
- ✅ 0 erreur TypeScript

**Ce qui reste Phase 1:**

- ❌ Directory APIs - 0/10 endpoints (0%)
- ❌ Fleet APIs restantes - 0/10 endpoints (0%)
- ❌ Driver APIs restantes - 0/8 endpoints (0%)
- ❌ Tests unitaires - 0%
- ❌ UI Dashboard - 0%

### 1.2 Pourquoi Scénario 1 (Option A puis Option B)

**Décision stratégique:** Terminer Phase 1 AVANT MVP Dashboard

**Justifications métier:**

1. **Fondations solides** : Phase 1 à 100% = base stable pour toutes les phases suivantes
2. **Cooperation Terms critique** : Bloque Phase 3 Revenue Pipeline (voir section 4.2 specs fonctionnelles)
3. **Éviter dette technique** : Dashboard incomplet nécessiterait double travail (créer puis enrichir)
4. **Démo complète** : Dashboard sur Phase 1 à 100% = démo plus convaincante

**Timeline optimale:**

- Semaine 1-2: Compléter Phase 1 → **Fondations 100% solides**
- Semaine 3: MVP Dashboard → **Démo ready avec fonctionnalités complètes**

### 1.3 Déviation du Plan Initial

**Plan initial (FLEETCORE_PLAN_DEVELOPPEMENT_DEFINITIF.md):**

- Phase 1: Semaines 1-6 (6 semaines)
- Pas de dashboard avant Phase 5 (semaines 19-22)

**Notre plan 3 semaines:**

- Phase 1: Semaines 1-2 (2 semaines) ← **ACCÉLÉRÉ**
- MVP Dashboard: Semaine 3 (1 semaine) ← **ANTICIPÉ de 16 semaines**

**Impact sur plan global:**

- ✅ **Positif:** Démo fonctionnelle dès semaine 3 (vs semaine 22)
- ✅ **Positif:** Phase 1 terminée plus vite (2 sem vs 6 sem)
- ⚠️ **Attention:** Dashboard sera enrichi progressivement (Phases 2-4)

**Bridge de retour:** Section 6 détaille exactement comment on revient au plan 26 semaines après ces 3 semaines.

---

## 2. VUE D'ENSEMBLE 3 SEMAINES

### 2.1 Timeline Globale

```
SEMAINE 1 (13-17 Oct):  ██████████████████░░  90% Directory + Fleet Start
SEMAINE 2 (20-24 Oct):  ████████████████████ 100% Fleet + Driver Complete
SEMAINE 3 (27-31 Oct):  ████████████████████ 100% MVP Dashboard + Démo
                              ↓
                        Phase 1 = 100% ✅
```

### 2.2 Objectifs par Semaine

| Semaine       | Objectif                  | Livrables             | Validation                  |
| ------------- | ------------------------- | --------------------- | --------------------------- |
| **Semaine 1** | Directory + Fleet Partial | 15 APIs, 2 services   | Postman tests pass          |
| **Semaine 2** | Fleet + Driver Complete   | 13 APIs, Phase 1 100% | Postman collection complète |
| **Semaine 3** | MVP Dashboard             | 5 pages UI, seed data | Démo fonctionnelle          |

### 2.3 Métriques Cibles 3 Semaines

| Métrique         | Début (12 Oct) | Fin Sem 1 | Fin Sem 2 | Fin Sem 3 | Cible             |
| ---------------- | -------------- | --------- | --------- | --------- | ----------------- |
| **APIs Backend** | 27             | 42        | 55        | 55        | 55 ✅             |
| **Services**     | 4              | 6         | 6         | 6         | 6 ✅              |
| **Repositories** | 2              | 3         | 3         | 3         | 3 ✅              |
| **UI Pages**     | 3              | 3         | 3         | 8         | 8 ✅              |
| **Tests**        | 0              | 0         | 0         | 0         | Tests en Phase 1D |
| **% Phase 1**    | 49%            | 76%       | 100%      | 100%      | 100% ✅           |

### 2.4 Distribution Travail

**Backend (Semaines 1-2): 70% effort**

- Directory Service + Repository + Validators + APIs (10 endpoints)
- Fleet APIs restantes (10 endpoints)
- Driver APIs restantes (8 endpoints)

**Frontend (Semaine 3): 30% effort**

- Dashboard Layout + Navigation
- 5 pages principales (Overview, Vehicles, Vehicle Detail, Drivers, Driver Detail)
- Seed data script

---

## 3. SEMAINE 1: DIRECTORY APIs

**Dates:** 13-17 Octobre 2025 (5 jours ouvrés)  
**Objectif:** Créer Directory Management complet + Commencer Fleet APIs restantes  
**Livrables:** 15 APIs, 2 services nouveaux

### 3.1 Jour 1 (Lundi 13 Oct): Directory Service Layer

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 1.1: Directory Service (3h)

**Fichier à créer:** `lib/services/directory/directory.service.ts`

**Méthodes requises (8):**

```typescript
class DirectoryService extends BaseService {
  // Makes
  async createMake(
    data: CreateMakeDto,
    userId: string,
    tenantId: string
  ): Promise<CarMake>;
  async getMakes(
    tenantId: string,
    filters?: MakeFilters
  ): Promise<PaginatedResult<CarMake>>;

  // Models
  async createModel(
    data: CreateModelDto,
    userId: string,
    tenantId: string
  ): Promise<CarModel>;
  async getModels(
    tenantId: string,
    filters?: ModelFilters
  ): Promise<PaginatedResult<CarModel>>;

  // Platforms (Global)
  async getPlatforms(): Promise<Platform[]>;

  // Regulations (Global)
  async getRegulations(countryCode?: string): Promise<CountryRegulation[]>;

  // Vehicle Classes
  async getVehicleClasses(countryCode: string): Promise<VehicleClass[]>;

  // Validation métier
  private async validateMakeUnique(
    name: string,
    tenantId: string
  ): Promise<void>;
}
```

**Validations métier:**

- Prévenir doublons: `(tenant_id, name)` pour makes
- Prévenir doublons: `(tenant_id, make_id, name)` pour models
- Vérifier `make_id` existe avant créer model
- Vérifier `vehicle_class_id` existe si fourni (optionnel)

**Pattern à suivre:** Copier EXACTEMENT `VehicleService.createVehicle()` pour structure transaction

**Commandes validation:**

```bash
# Créer le fichier
npx tsc --noEmit

# Vérifier imports
grep -n "import" lib/services/directory/directory.service.ts

# Vérifier 0 erreur
echo $?  # Doit retourner 0
```

#### Tâche 1.2: Directory Repository (2h)

**Fichier à créer:** `lib/repositories/directory.repository.ts`

**Méthodes requises (6):**

```typescript
export class DirectoryRepository extends BaseRepository<any> {
  // Makes
  async findMakeByName(name: string, tenantId: string): Promise<CarMake | null>;
  async findMakeById(id: string, tenantId: string): Promise<CarMake | null>;

  // Models
  async findModelByMakeAndName(
    makeId: string,
    name: string,
    tenantId: string
  ): Promise<CarModel | null>;
  async findModelsByMake(makeId: string, tenantId: string): Promise<CarModel[]>;

  // Platforms (no tenant)
  async findAllPlatforms(): Promise<Platform[]>;

  // Regulations (no tenant)
  async findRegulationByCountry(
    countryCode: string
  ): Promise<CountryRegulation | null>;
}
```

**Commandes validation:**

```bash
# Compilation
npx tsc --noEmit

# Vérifier extends BaseRepository
grep "extends BaseRepository" lib/repositories/directory.repository.ts

# Vérifier multi-tenant pour makes/models
grep "tenant_id" lib/repositories/directory.repository.ts | wc -l  # Doit être > 4
```

#### Tâche 1.3: Directory Validators (3h)

**Fichier à créer:** `lib/validators/directory.validators.ts`

**Schemas requis (5):**

```typescript
// Makes
export const createMakeSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  country_code: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/),
  metadata: z.record(z.any()).optional(),
});

// Models
export const createModelSchema = z.object({
  make_id: z.string().uuid(),
  name: z.string().min(1).max(100).trim(),
  vehicle_class_id: z.string().uuid().optional(),
  seats: z.number().int().min(1).max(20).default(4),
  fuel_type: z
    .enum(["petrol", "diesel", "electric", "hybrid", "other"])
    .optional(),
  transmission: z.enum(["manual", "automatic", "semi-automatic"]).optional(),
  metadata: z.record(z.any()).optional(),
});

// Query filters
export const makeQuerySchema = baseQuerySchema.extend({
  country_code: z.string().length(2).optional(),
  search: z.string().optional(),
});

export const modelQuerySchema = baseQuerySchema.extend({
  make_id: z.string().uuid().optional(),
  vehicle_class_id: z.string().uuid().optional(),
  search: z.string().optional(),
});

// Country regulations query
export const regulationsQuerySchema = z.object({
  country_code: z.string().length(2).optional(),
});
```

**Commandes validation:**

```bash
# Test validation
node -e "
const { createMakeSchema } = require('./lib/validators/directory.validators');
const result = createMakeSchema.parse({ name: 'Toyota', country_code: 'FR' });
console.log('✅ Validation OK:', result);
"

# Vérifier tous les schemas exportés
grep "export const.*Schema" lib/validators/directory.validators.ts | wc -l  # Doit être 5
```

**✅ Validation Jour 1:**

```bash
# Compilation globale
npx tsc --noEmit

# Vérifier 3 fichiers créés
ls -la lib/services/directory/directory.service.ts
ls -la lib/repositories/directory.repository.ts
ls -la lib/validators/directory.validators.ts

# 0 erreur TypeScript
echo "✅ Jour 1 complété si aucune erreur ci-dessus"
```

---

### 3.2 Jour 2 (Mardi 14 Oct): Directory APIs - Makes & Models

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 2.1: Makes APIs (3h)

**Fichiers à créer:**

1. `app/api/v1/directory/makes/route.ts` (POST + GET)
2. `app/api/v1/directory/makes/[id]/route.ts` (GET)

**Endpoints (3):**

```typescript
// POST /api/v1/directory/makes
export async function POST(request: Request) {
  try {
    // 1. Extract headers
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");
    if (!userId || !tenantId) throw new UnauthorizedError();

    // 2. Parse & validate body
    const body = await request.json();
    const data = createMakeSchema.parse(body);

    // 3. Create make
    const directoryService = new DirectoryService(new DirectoryRepository());
    const make = await directoryService.createMake(data, userId, tenantId);

    // 4. Return response
    return NextResponse.json(make, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

// GET /api/v1/directory/makes
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) throw new UnauthorizedError();

    const { searchParams } = new URL(request.url);
    const filters = makeQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      country_code: searchParams.get("country_code"),
      search: searchParams.get("search"),
    });

    const directoryService = new DirectoryService(new DirectoryRepository());
    const makes = await directoryService.getMakes(tenantId, filters);

    return NextResponse.json(makes);
  } catch (error) {
    // Error handling...
  }
}
```

**Commandes validation:**

```bash
# Créer make via curl
curl -X POST http://localhost:3000/api/v1/directory/makes \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{"name": "Toyota", "country_code": "FR"}'

# Vérifier status 201
# Vérifier doublon retourne 409
curl -X POST http://localhost:3000/api/v1/directory/makes \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{"name": "Toyota", "country_code": "FR"}'
# Doit retourner 409 Conflict

# Lister makes
curl http://localhost:3000/api/v1/directory/makes \
  -H "x-tenant-id: test-tenant-id"
# Doit retourner liste avec Toyota
```

#### Tâche 2.2: Models APIs (3h)

**Fichiers à créer:**

1. `app/api/v1/directory/models/route.ts` (POST + GET)
2. `app/api/v1/directory/models/[id]/route.ts` (GET)

**Endpoints (3):**

```typescript
// POST /api/v1/directory/models
// GET /api/v1/directory/models
// GET /api/v1/directory/models/:id
```

**Pattern:** Identique à Makes APIs (copier/adapter)

**Commandes validation:**

```bash
# Créer model
curl -X POST http://localhost:3000/api/v1/directory/models \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "make_id": "uuid-du-make-toyota",
    "name": "Corolla",
    "seats": 5,
    "fuel_type": "hybrid",
    "transmission": "automatic"
  }'

# Vérifier make_id invalide retourne 404
curl -X POST http://localhost:3000/api/v1/directory/models \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "make_id": "invalid-uuid",
    "name": "Corolla"
  }'
# Doit retourner 404 Not Found

# Lister models
curl "http://localhost:3000/api/v1/directory/models?make_id=uuid-du-make-toyota" \
  -H "x-tenant-id: test-tenant-id"
```

#### Tâche 2.3: Documentation Postman (2h)

**Créer:** `postman/Directory_APIs.json`

**Collection structure:**

```json
{
  "info": {
    "name": "Fleetcore - Directory APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Makes",
      "item": [
        {
          "name": "Create Make",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/v1/directory/makes"
          }
        },
        {
          "name": "List Makes",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/v1/directory/makes"
          }
        },
        {
          "name": "Get Make by ID",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/v1/directory/makes/:id"
          }
        }
      ]
    },
    {
      "name": "Models",
      "item": [
        {
          "name": "Create Model",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/v1/directory/models"
          }
        },
        {
          "name": "List Models",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/v1/directory/models"
          }
        },
        {
          "name": "Get Model by ID",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/v1/directory/models/:id"
          }
        }
      ]
    }
  ]
}
```

**✅ Validation Jour 2:**

```bash
# 6 endpoints créés
find app/api/v1/directory -name "route.ts" | wc -l  # Doit être 4

# Postman collection valide
cat postman/Directory_APIs.json | jq '.item | length'  # Doit être 2

# Tests manuels passent
echo "✅ Jour 2 complété si tous les curls ci-dessus retournent les bons status codes"
```

---

### 3.3 Jour 3 (Mercredi 15 Oct): Directory APIs - Platforms & Regulations

**Durée:** 8h  
**Priorité:** 🟡 HAUTE

#### Tâche 3.1: Platforms APIs (2h)

**Fichier à créer:** `app/api/v1/directory/platforms/route.ts`

**Endpoint (1):**

```typescript
// GET /api/v1/directory/platforms
export async function GET(request: Request) {
  try {
    // Pas de tenant_id requis (données globales)
    const directoryService = new DirectoryService(new DirectoryRepository());
    const platforms = await directoryService.getPlatforms();

    // Masquer secrets dans api_config
    const sanitized = platforms.map((p) => ({
      ...p,
      api_config: p.api_config
        ? { ...p.api_config, api_key: "[REDACTED]" }
        : null,
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    // Error handling...
  }
}
```

**Commandes validation:**

```bash
# Lister platforms (pas de tenant_id requis)
curl http://localhost:3000/api/v1/directory/platforms

# Vérifier retourne Uber, Bolt, Careem
# Vérifier api_key masqué
```

#### Tâche 3.2: Regulations APIs (2h)

**Fichier à créer:** `app/api/v1/directory/regulations/route.ts`

**Endpoint (1):**

```typescript
// GET /api/v1/directory/regulations?country_code=FR
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = regulationsQuerySchema.parse({
      country_code: searchParams.get("country_code"),
    });

    const directoryService = new DirectoryService(new DirectoryRepository());
    const regulations = await directoryService.getRegulations(
      query.country_code
    );

    return NextResponse.json(regulations);
  } catch (error) {
    // Error handling...
  }
}
```

**Commandes validation:**

```bash
# Lister toutes regulations
curl http://localhost:3000/api/v1/directory/regulations

# Filtrer par pays
curl "http://localhost:3000/api/v1/directory/regulations?country_code=FR"
# Doit retourner regulations France VTC

curl "http://localhost:3000/api/v1/directory/regulations?country_code=AE"
# Doit retourner regulations UAE
```

#### Tâche 3.3: Seed Data Directory (4h)

**Fichier à créer:** `prisma/seed-directory.ts`

**Données à insérer:**

```typescript
async function seedDirectory() {
  // 1. Platforms (3)
  const platforms = await prisma.dir_platforms.createMany({
    data: [
      {
        name: "Uber",
        api_config: {
          base_url: "https://api.uber.com",
          version: "v1",
          services: ["rides", "eats"],
        },
      },
      {
        name: "Bolt",
        api_config: {
          base_url: "https://api.bolt.eu",
          version: "v2",
          services: ["rides", "food"],
        },
      },
      {
        name: "Careem",
        api_config: {
          base_url: "https://api.careem.com",
          version: "v1",
          services: ["rides"],
        },
      },
    ],
  });

  // 2. Country Regulations (2)
  await prisma.dir_country_regulations.createMany({
    data: [
      {
        country_code: "FR",
        vehicle_max_age: 6,
        min_vehicle_class: "sedan",
        vat_rate: 20.0,
        currency: "EUR",
        timezone: "Europe/Paris",
        requires_vtc_card: true,
      },
      {
        country_code: "AE",
        vehicle_max_age: 5,
        min_vehicle_class: "sedan",
        vat_rate: 5.0,
        currency: "AED",
        timezone: "Asia/Dubai",
        requires_vtc_card: false,
      },
    ],
  });

  // 3. Vehicle Classes (4)
  const vehicleClasses = await prisma.dir_vehicle_classes.createMany({
    data: [
      {
        country_code: "FR",
        name: "Sedan",
        description: "Standard sedan",
        max_age: 6,
      },
      {
        country_code: "FR",
        name: "Van",
        description: "7+ passengers",
        max_age: 5,
      },
      {
        country_code: "AE",
        name: "Sedan",
        description: "Standard sedan",
        max_age: 5,
      },
      {
        country_code: "AE",
        name: "Luxury",
        description: "Premium vehicles",
        max_age: 3,
      },
    ],
  });

  // 4. Makes (10 populaires)
  const makeNames = [
    "Toyota",
    "Mercedes-Benz",
    "BMW",
    "Volkswagen",
    "Audi",
    "Hyundai",
    "Nissan",
    "Ford",
    "Renault",
    "Peugeot",
  ];

  for (const name of makeNames) {
    await prisma.dir_car_makes.create({
      data: {
        tenant_id: null, // Global makes
        name,
        country_code: "FR",
      },
    });
  }

  // 5. Models (30 associés)
  // Toyota models
  const toyota = await prisma.dir_car_makes.findFirst({
    where: { name: "Toyota" },
  });
  await prisma.dir_car_models.createMany({
    data: [
      {
        tenant_id: null,
        make_id: toyota.id,
        name: "Corolla",
        seats: 5,
        fuel_type: "hybrid",
        transmission: "automatic",
      },
      {
        tenant_id: null,
        make_id: toyota.id,
        name: "Camry",
        seats: 5,
        fuel_type: "hybrid",
        transmission: "automatic",
      },
      {
        tenant_id: null,
        make_id: toyota.id,
        name: "RAV4",
        seats: 5,
        fuel_type: "hybrid",
        transmission: "automatic",
      },
    ],
  });

  // Mercedes models
  const mercedes = await prisma.dir_car_makes.findFirst({
    where: { name: "Mercedes-Benz" },
  });
  await prisma.dir_car_models.createMany({
    data: [
      {
        tenant_id: null,
        make_id: mercedes.id,
        name: "E-Class",
        seats: 5,
        fuel_type: "diesel",
        transmission: "automatic",
      },
      {
        tenant_id: null,
        make_id: mercedes.id,
        name: "S-Class",
        seats: 5,
        fuel_type: "petrol",
        transmission: "automatic",
      },
      {
        tenant_id: null,
        make_id: mercedes.id,
        name: "V-Class",
        seats: 7,
        fuel_type: "diesel",
        transmission: "automatic",
      },
    ],
  });

  // ... (répéter pour autres makes)

  console.log("✅ Directory seed completed");
}

seedDirectory();
```

**Exécution:**

```bash
# Lancer seed
npx tsx prisma/seed-directory.ts

# Vérifier données insérées
psql $DATABASE_URL -c "SELECT COUNT(*) FROM dir_platforms;"  # Doit être 3
psql $DATABASE_URL -c "SELECT COUNT(*) FROM dir_country_regulations;"  # Doit être 2
psql $DATABASE_URL -c "SELECT COUNT(*) FROM dir_car_makes WHERE tenant_id IS NULL;"  # Doit être 10
psql $DATABASE_URL -c "SELECT COUNT(*) FROM dir_car_models WHERE tenant_id IS NULL;"  # Doit être 30
```

**✅ Validation Jour 3:**

```bash
# Platforms API marche
curl http://localhost:3000/api/v1/directory/platforms | jq '. | length'  # Doit être 3

# Regulations API marche
curl http://localhost:3000/api/v1/directory/regulations | jq '. | length'  # Doit être 2

# Seed data OK
echo "✅ Jour 3 complété si seed exécuté avec succès"
```

---

### 3.4 Jour 4 (Jeudi 16 Oct): Fleet APIs Restantes - Maintenance

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 4.1: Maintenance APIs (6h)

**Fichiers à créer:**

1. `app/api/v1/vehicles/[id]/maintenance/route.ts` (POST + GET)
2. `app/api/v1/vehicles/[id]/maintenance/[maintenanceId]/route.ts` (GET + PATCH)

**Endpoints (4):**

```typescript
// POST /api/v1/vehicles/:id/maintenance
// Créer maintenance schedule
{
  "maintenance_type": "oil_change",
  "scheduled_date": "2025-11-15",
  "odometer_reading": 50000,
  "notes": "Regular oil change"
}

// GET /api/v1/vehicles/:id/maintenance
// Lister maintenance du véhicule avec filtres
// Filtres: status (scheduled/completed/cancelled), from_date, to_date

// GET /api/v1/vehicles/:id/maintenance/:maintenanceId
// Détail maintenance

// PATCH /api/v1/vehicles/:id/maintenance/:maintenanceId
// Mettre à jour maintenance (compléter, annuler)
{
  "status": "completed",
  "completed_date": "2025-11-15",
  "actual_cost": 150.00,
  "notes": "Oil changed + filter replaced"
}
```

**Validations métier:**

- Vérifier vehicle existe et appartient au tenant
- Vérifier scheduled_date >= today
- Vérifier odometer_reading >= vehicle.current_odometer
- Status transitions: scheduled → completed/cancelled uniquement

**Commandes validation:**

```bash
# Créer maintenance
curl -X POST http://localhost:3000/api/v1/vehicles/vehicle-id/maintenance \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "maintenance_type": "oil_change",
    "scheduled_date": "2025-11-15",
    "odometer_reading": 50000
  }'
# Doit retourner 201

# Lister maintenance
curl "http://localhost:3000/api/v1/vehicles/vehicle-id/maintenance?status=scheduled" \
  -H "x-tenant-id: test-tenant-id"

# Compléter maintenance
curl -X PATCH http://localhost:3000/api/v1/vehicles/vehicle-id/maintenance/maintenance-id \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "status": "completed",
    "completed_date": "2025-11-15",
    "actual_cost": 150.00
  }'
# Doit retourner 200
```

#### Tâche 4.2: Postman Collection Update (2h)

**Ajouter à:** `postman/Fleet_APIs.json`

**Nouvelles requêtes:**

- Create Maintenance
- List Vehicle Maintenance
- Get Maintenance by ID
- Update Maintenance (Complete)
- Update Maintenance (Cancel)

**✅ Validation Jour 4:**

```bash
# 4 endpoints maintenance
find app/api/v1/vehicles -path "*maintenance*route.ts" | wc -l  # Doit être 2

# Postman tests pass
newman run postman/Fleet_APIs.json --folder "Maintenance"

echo "✅ Jour 4 complété si newman tests pass"
```

---

### 3.5 Jour 5 (Vendredi 17 Oct): Fleet APIs - Expenses & Insurances

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 5.1: Expenses APIs (3h)

**Fichiers à créer:**

1. `app/api/v1/vehicles/[id]/expenses/route.ts` (POST + GET)

**Endpoints (2):**

```typescript
// POST /api/v1/vehicles/:id/expenses
{
  "expense_category": "fuel",
  "expense_date": "2025-10-17",
  "amount": 85.50,
  "currency": "EUR",
  "quantity": 65.0,
  "unit_price": 1.315,
  "odometer": 51000,
  "location": "Station Total Paris",
  "receipt_url": "https://storage.../receipt.pdf",
  "notes": "Full tank"
}

// GET /api/v1/vehicles/:id/expenses
// Filtres: expense_category, from_date, to_date, min_amount, max_amount
```

**Validations:**

- expense_date <= today
- amount > 0
- currency in ['EUR', 'AED', 'USD']
- odometer >= vehicle.current_odometer si fourni

**Commandes validation:**

```bash
# Créer expense
curl -X POST http://localhost:3000/api/v1/vehicles/vehicle-id/expenses \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "expense_category": "fuel",
    "expense_date": "2025-10-17",
    "amount": 85.50,
    "currency": "EUR",
    "quantity": 65.0
  }'

# Lister expenses avec filtres
curl "http://localhost:3000/api/v1/vehicles/vehicle-id/expenses?expense_category=fuel&from_date=2025-10-01" \
  -H "x-tenant-id: test-tenant-id"
```

#### Tâche 5.2: Insurances APIs (3h)

**Fichiers à créer:**

1. `app/api/v1/vehicles/[id]/insurances/route.ts` (POST + GET)
2. `app/api/v1/vehicles/[id]/insurances/[insuranceId]/route.ts` (GET + PATCH)

**Endpoints (4):**

```typescript
// POST /api/v1/vehicles/:id/insurances
{
  "provider_name": "AXA Insurance",
  "policy_number": "AXA-FR-123456",
  "policy_type": "comprehensive",
  "coverage_amount": 50000.00,
  "currency": "EUR",
  "deductible_amount": 500.00,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "premium_amount": 1200.00,
  "payment_frequency": "annual"
}

// GET /api/v1/vehicles/:id/insurances
// GET /api/v1/vehicles/:id/insurances/:insuranceId
// PATCH /api/v1/vehicles/:id/insurances/:insuranceId
```

**Validations:**

- end_date > start_date
- end_date >= today (pas d'insurance expirée lors création)
- policy_number unique per tenant
- coverage_amount > 0

**Commandes validation:**

```bash
# Créer insurance
curl -X POST http://localhost:3000/api/v1/vehicles/vehicle-id/insurances \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "provider_name": "AXA Insurance",
    "policy_number": "AXA-FR-123456",
    "policy_type": "comprehensive",
    "coverage_amount": 50000.00,
    "currency": "EUR",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "premium_amount": 1200.00
  }'

# Lister insurances
curl http://localhost:3000/api/v1/vehicles/vehicle-id/insurances \
  -H "x-tenant-id: test-tenant-id"
```

#### Tâche 5.3: Fleet Reports APIs (2h)

**Fichiers à créer:**

1. `app/api/v1/vehicles/[id]/performance/route.ts` (GET)
2. `app/api/v1/vehicles/[id]/history/route.ts` (GET)
3. `app/api/v1/vehicles/kpis/route.ts` (GET)

**Endpoints (3):**

```typescript
// GET /api/v1/vehicles/:id/performance
// Retourner: total_revenue, total_expenses, net_profit, revenue_per_km, cost_per_km, utilization_rate
// Filtres: from_date, to_date

// GET /api/v1/vehicles/:id/history
// Timeline événements: created, maintenance, accidents, assignments, status changes

// GET /api/v1/vehicles/kpis
// KPIs globaux flotte: total_vehicles, online_count, revenue_today, expenses_today
```

**✅ Validation Jour 5:**

```bash
# Expenses APIs
curl -X POST http://localhost:3000/api/v1/vehicles/vehicle-id/expenses -d '...'  # 201
curl http://localhost:3000/api/v1/vehicles/vehicle-id/expenses  # 200

# Insurances APIs
curl -X POST http://localhost:3000/api/v1/vehicles/vehicle-id/insurances -d '...'  # 201
curl http://localhost:3000/api/v1/vehicles/vehicle-id/insurances  # 200

# Reports APIs
curl http://localhost:3000/api/v1/vehicles/vehicle-id/performance  # 200
curl http://localhost:3000/api/v1/vehicles/vehicle-id/history  # 200
curl http://localhost:3000/api/v1/vehicles/kpis  # 200

echo "✅ Semaine 1 complétée : 15 APIs créées (10 Directory + 5 Fleet)"
```

### 3.6 Récapitulatif Semaine 1

**Livrables complétés:**

- ✅ DirectoryService (8 méthodes)
- ✅ DirectoryRepository (6 méthodes)
- ✅ Directory Validators (5 schemas)
- ✅ 10 Directory APIs (Makes, Models, Platforms, Regulations)
- ✅ 5 Fleet APIs (Maintenance 4, Expenses 2, Insurances 4, Reports 3 → total partiel)
- ✅ Seed data directory (3 platforms, 2 regulations, 10 makes, 30 models)
- ✅ Postman collections updated

**Métriques Semaine 1:**
| Métrique | Objectif | Réalisé | Status |
|----------|----------|---------|--------|
| APIs | 15 | 15 | ✅ 100% |
| Services | 2 | 2 | ✅ 100% |
| Seed data | 1 | 1 | ✅ 100% |
| Phase 1 progression | 76% | 76% | ✅ (42/55 APIs) |

---

## 4. SEMAINE 2: FLEET & DRIVER COMPLETION

**Dates:** 20-24 Octobre 2025 (5 jours ouvrés)  
**Objectif:** Terminer Phase 1 à 100%  
**Livrables:** 13 APIs restantes

### 4.1 Jour 6 (Lundi 20 Oct): Driver Documents APIs

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 6.1: Driver Documents APIs (6h)

**Fichiers à créer:**

1. `app/api/v1/drivers/[id]/documents/route.ts` (POST + GET)
2. `app/api/v1/drivers/[id]/documents/verify/route.ts` (POST)
3. `app/api/v1/drivers/[id]/documents/expiring/route.ts` (GET)

**Endpoints (4):**

```typescript
// POST /api/v1/drivers/:id/documents
{
  "document_type": "driving_license",
  "file_url": "https://storage.../license.pdf",
  "issue_date": "2020-01-15",
  "expiry_date": "2030-01-15"
}

// GET /api/v1/drivers/:id/documents
// Filtres: document_type, verified (true/false), expiring_soon (30 days)

// POST /api/v1/drivers/:id/documents/verify
{
  "document_id": "uuid",
  "verified": true,
  "verified_by": "admin-user-id",
  "notes": "Document verified manually"
}

// GET /api/v1/drivers/:id/documents/expiring
// Retourner documents expirant dans les 30 prochains jours
```

**Validations:**

- document_type in ['driving_license', 'id_card', 'vtc_card', 'passport', 'visa', 'residence_permit']
- expiry_date > issue_date
- file_url format valide (https://...)

**Commandes validation:**

```bash
# Upload document
curl -X POST http://localhost:3000/api/v1/drivers/driver-id/documents \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "document_type": "driving_license",
    "file_url": "https://storage.supabase.co/bucket/license.pdf",
    "issue_date": "2020-01-15",
    "expiry_date": "2030-01-15"
  }'

# Vérifier document
curl -X POST http://localhost:3000/api/v1/drivers/driver-id/documents/verify \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "document_id": "document-uuid",
    "verified": true
  }'

# Documents expirant
curl http://localhost:3000/api/v1/drivers/driver-id/documents/expiring \
  -H "x-tenant-id: test-tenant-id"
```

#### Tâche 6.2: Postman Collection (2h)

**Ajouter à:** `postman/Driver_APIs.json`

**✅ Validation Jour 6:**

```bash
# 4 endpoints documents
find app/api/v1/drivers -path "*documents*route.ts" | wc -l  # Doit être 3

echo "✅ Jour 6 complété"
```

---

### 4.2 Jour 7 (Mardi 21 Oct): Cooperation Terms APIs (CRITIQUE)

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE (Bloque Phase 3)

#### Tâche 7.1: Cooperation Terms Validators (2h)

**Fichier à créer:** `lib/validators/cooperation-terms.validators.ts`

**Schemas pour 6 modèles:**

```typescript
// Base schema
const baseTermsSchema = z.object({
  driver_id: z.string().uuid(),
  model_type: z.enum([
    "fixed_rental",
    "crew_rental",
    "percentage_split",
    "salary",
    "rental_variation",
    "buyout",
  ]),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().optional(),
  is_active: z.boolean().default(true),
});

// Fixed Rental
const fixedRentalTermsSchema = baseTermsSchema.extend({
  model_type: z.literal("fixed_rental"),
  terms: z.object({
    daily_rental: z.number().positive(),
    weekly_rental: z.number().positive(),
    monthly_rental: z.number().positive(),
    currency: z.string().length(3),
  }),
});

// Percentage Split
const percentageSplitTermsSchema = baseTermsSchema.extend({
  model_type: z.literal("percentage_split"),
  terms: z.object({
    platform_percentages: z.record(z.number().min(0).max(100)),
    // uber: 70, bolt: 75, careem: 80
    default_percentage: z.number().min(0).max(100),
  }),
});

// Salary Model (WPS UAE)
const salaryTermsSchema = baseTermsSchema.extend({
  model_type: z.literal("salary"),
  terms: z.object({
    monthly_salary: z.number().positive(),
    currency: z.string().length(3),
    wps_salary_month: z.string().regex(/^\d{4}-\d{2}$/),
    overtime_rate: z.number().positive().optional(),
  }),
});

// Buyout
const buyoutTermsSchema = baseTermsSchema.extend({
  model_type: z.literal("buyout"),
  terms: z.object({
    vehicle_price: z.number().positive(),
    installment_count: z.number().int().positive(),
    monthly_installment: z.number().positive(),
    down_payment: z.number().nonnegative().optional(),
    ownership_transfer_date: z.coerce.date(),
  }),
});

// Union discriminée
export const createCooperationTermsSchema = z.discriminatedUnion("model_type", [
  fixedRentalTermsSchema,
  percentageSplitTermsSchema,
  salaryTermsSchema,
  buyoutTermsSchema,
  // ... autres modèles
]);
```

#### Tâche 7.2: Cooperation Terms APIs (5h)

**Fichiers à créer:**

1. `app/api/v1/drivers/[id]/cooperation/route.ts` (POST + GET)
2. `app/api/v1/drivers/[id]/cooperation/[termId]/route.ts` (GET + PATCH)
3. `app/api/v1/drivers/[id]/cooperation/history/route.ts` (GET)

**Endpoints (5):**

```typescript
// POST /api/v1/drivers/:id/cooperation
// Créer nouveau terms (désactive l'ancien si exists)

// GET /api/v1/drivers/:id/cooperation
// Lister tous terms du driver

// GET /api/v1/drivers/:id/cooperation/:termId
// Détail terms spécifique

// PATCH /api/v1/drivers/:id/cooperation/:termId
// Mettre à jour terms (pas model_type)

// GET /api/v1/drivers/:id/cooperation/history
// Historique chronologique tous terms
```

**Business logic critique:**

```typescript
async createCooperationTerms(data, driverId, userId, tenantId) {
  return this.transaction(async (tx) => {
    // 1. Désactiver terms actif actuel
    await tx.rid_driver_cooperation_terms.updateMany({
      where: {
        driver_id: driverId,
        tenant_id: tenantId,
        is_active: true
      },
      data: {
        is_active: false,
        end_date: new Date(),
        updated_by: userId
      }
    });

    // 2. Créer nouveau terms
    const terms = await tx.rid_driver_cooperation_terms.create({
      data: {
        driver_id: driverId,
        tenant_id: tenantId,
        model_type: data.model_type,
        terms_data: data.terms,
        start_date: data.start_date,
        is_active: true,
        created_by: userId,
        updated_by: userId
      }
    });

    return terms;
  });
}
```

**Commandes validation:**

```bash
# Créer Fixed Rental terms
curl -X POST http://localhost:3000/api/v1/drivers/driver-id/cooperation \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "model_type": "fixed_rental",
    "start_date": "2025-10-20",
    "terms": {
      "daily_rental": 50,
      "weekly_rental": 300,
      "monthly_rental": 1000,
      "currency": "EUR"
    }
  }'
# Doit retourner 201

# Changer vers Percentage Split
curl -X POST http://localhost:3000/api/v1/drivers/driver-id/cooperation \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "model_type": "percentage_split",
    "start_date": "2025-11-01",
    "terms": {
      "platform_percentages": {
        "uber": 70,
        "bolt": 75
      },
      "default_percentage": 70
    }
  }'

# Vérifier ancien terms désactivé
curl http://localhost:3000/api/v1/drivers/driver-id/cooperation/history \
  -H "x-tenant-id: test-tenant-id"
# Doit montrer Fixed Rental avec is_active=false, end_date définie
```

#### Tâche 7.3: Tests Critiques (1h)

**Tester tous les 6 modèles:**

- Fixed Rental ✅
- Crew Rental ✅
- Percentage Split ✅
- Salary (WPS) ✅
- Rental Variation ✅
- Buyout ✅

**✅ Validation Jour 7:**

```bash
# Cooperation Terms APIs
find app/api/v1/drivers -path "*cooperation*route.ts" | wc -l  # Doit être 3

# Tester les 6 modèles
newman run postman/Driver_APIs.json --folder "Cooperation Terms"

echo "✅ Jour 7 complété - COOPERATION TERMS FAIT (critique pour Phase 3)"
```

---

### 4.3 Jour 8 (Mercredi 22 Oct): Driver Training & Blacklist APIs

**Durée:** 8h  
**Priorité:** 🟡 HAUTE

#### Tâche 8.1: Training APIs (4h)

**Fichiers à créer:**

1. `app/api/v1/drivers/[id]/training/route.ts` (POST + GET)
2. `app/api/v1/drivers/[id]/training/[trainingId]/complete/route.ts` (POST)

**Endpoints (3):**

```typescript
// POST /api/v1/drivers/:id/training
{
  "training_type": "safety",
  "training_date": "2025-10-25",
  "duration_hours": 4,
  "provider": "Fleet Training Center",
  "notes": "Defensive driving course"
}

// GET /api/v1/drivers/:id/training
// Filtres: training_type, from_date, to_date, completed (true/false)

// POST /api/v1/drivers/:id/training/:trainingId/complete
{
  "completed_date": "2025-10-25",
  "score": 85,
  "certificate_url": "https://storage.../cert.pdf",
  "notes": "Passed with distinction"
}
```

**Commandes validation:**

```bash
# Créer training
curl -X POST http://localhost:3000/api/v1/drivers/driver-id/training \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "training_type": "safety",
    "training_date": "2025-10-25",
    "duration_hours": 4,
    "provider": "Fleet Training Center"
  }'

# Compléter training
curl -X POST http://localhost:3000/api/v1/drivers/driver-id/training/training-id/complete \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "completed_date": "2025-10-25",
    "score": 85,
    "certificate_url": "https://storage.../cert.pdf"
  }'
```

#### Tâche 8.2: Blacklist APIs (4h)

**Fichiers à créer:**

1. `app/api/v1/drivers/blacklist/route.ts` (POST + GET + DELETE)

**Endpoints (3):**

```typescript
// POST /api/v1/drivers/blacklist
{
  "type": "driver", // ou "candidate"
  "email": "blacklisted@example.com",
  "phone": "+33612345678",
  "reason": "Multiple violations",
  "notes": "3 accidents in 2 months"
}

// GET /api/v1/drivers/blacklist
// Filtres: type, search (email/phone)

// DELETE /api/v1/drivers/blacklist/:id
// Retirer de blacklist (nécessite admin role)
```

**Validations:**

- Au moins email OU phone requis
- reason obligatoire
- Vérifier pas déjà blacklisté

**Commandes validation:**

```bash
# Ajouter à blacklist
curl -X POST http://localhost:3000/api/v1/drivers/blacklist \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin-user-id" \
  -H "x-tenant-id: test-tenant-id" \
  -d '{
    "type": "driver",
    "email": "bad@example.com",
    "reason": "Multiple violations"
  }'

# Vérifier blacklist lors onboarding
curl "http://localhost:3000/api/v1/drivers/blacklist?search=bad@example.com" \
  -H "x-tenant-id: test-tenant-id"
# Si trouvé → refuser onboarding

# Retirer de blacklist
curl -X DELETE http://localhost:3000/api/v1/drivers/blacklist/blacklist-id \
  -H "x-user-id: admin-user-id" \
  -H "x-tenant-id: test-tenant-id"
```

**✅ Validation Jour 8:**

```bash
# Training APIs
curl -X POST .../training  # 201
curl .../training  # 200
curl -X POST .../training/id/complete  # 200

# Blacklist APIs
curl -X POST .../blacklist  # 201
curl .../blacklist  # 200
curl -X DELETE .../blacklist/id  # 204

echo "✅ Jour 8 complété"
```

---

### 4.4 Jour 9 (Jeudi 23 Oct): Tests & Validation Phase 1

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 9.1: Postman Collection Complète (3h)

**Finaliser:** `postman/Fleetcore_Phase1_Complete.json`

**Collections à fusionner:**

- Directory APIs (10 requests)
- Fleet APIs (20 requests)
- Driver APIs (25 requests)
- **Total: 55 requests**

**Structure:**

```json
{
  "info": { "name": "Fleetcore Phase 1 - Complete" },
  "item": [
    { "name": "Directory", "item": [...] },
    { "name": "Fleet", "item": [...] },
    { "name": "Drivers", "item": [...] }
  ],
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000" },
    { "key": "tenantId", "value": "{{$guid}}" },
    { "key": "userId", "value": "{{$guid}}" }
  ]
}
```

#### Tâche 9.2: Tests Manuels Complets (4h)

**Scénario E2E complet:**

```bash
# 1. Directory Setup
curl -X POST .../directory/makes -d '{"name":"Toyota","country_code":"FR"}'
MAKE_ID=$(jq -r '.id' response.json)

curl -X POST .../directory/models -d '{"make_id":"'$MAKE_ID'","name":"Corolla"}'
MODEL_ID=$(jq -r '.id' response.json)

# 2. Créer véhicule
curl -X POST .../vehicles -d '{
  "license_plate": "AA-123-BB",
  "make_id": "'$MAKE_ID'",
  "model_id": "'$MODEL_ID'",
  "year": 2024,
  "ownership_type": "owned"
}'
VEHICLE_ID=$(jq -r '.id' response.json)

# 3. Créer driver
curl -X POST .../drivers -d '{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+33612345678",
  "employment_type": "employee",
  "date_of_birth": "1990-01-15",
  "nationality": "FR",
  "languages": ["FR","EN"]
}'
DRIVER_ID=$(jq -r '.id' response.json)

# 4. Créer cooperation terms
curl -X POST .../drivers/$DRIVER_ID/cooperation -d '{
  "model_type": "fixed_rental",
  "start_date": "2025-10-23",
  "terms": {
    "daily_rental": 50,
    "currency": "EUR"
  }
}'

# 5. Upload driver documents
curl -X POST .../drivers/$DRIVER_ID/documents -d '{
  "document_type": "driving_license",
  "file_url": "https://storage.../license.pdf",
  "issue_date": "2020-01-01",
  "expiry_date": "2030-01-01"
}'

# 6. Schedule maintenance
curl -X POST .../vehicles/$VEHICLE_ID/maintenance -d '{
  "maintenance_type": "oil_change",
  "scheduled_date": "2025-11-15",
  "odometer_reading": 50000
}'

# 7. Add expense
curl -X POST .../vehicles/$VEHICLE_ID/expenses -d '{
  "expense_category": "fuel",
  "expense_date": "2025-10-23",
  "amount": 85.50,
  "currency": "EUR"
}'

# 8. Create insurance
curl -X POST .../vehicles/$VEHICLE_ID/insurances -d '{
  "provider_name": "AXA",
  "policy_number": "AXA-FR-123",
  "policy_type": "comprehensive",
  "coverage_amount": 50000,
  "currency": "EUR",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}'

# 9. Schedule training
curl -X POST .../drivers/$DRIVER_ID/training -d '{
  "training_type": "safety",
  "training_date": "2025-11-01",
  "duration_hours": 4
}'

# 10. Vérifications
curl .../vehicles  # Doit retourner véhicule créé
curl .../drivers  # Doit retourner driver créé
curl .../vehicles/$VEHICLE_ID/performance  # Doit calculer KPIs
curl .../drivers/$DRIVER_ID/cooperation/history  # Doit montrer terms

echo "✅ E2E scenario passed"
```

#### Tâche 9.3: Documentation README (1h)

**Créer:** `docs/PHASE1_APIS.md`

**Contenu:**

- Liste complète 55 APIs avec méthodes HTTP
- Exemples requêtes/réponses
- Codes erreur possibles
- Variables environnement requises

**✅ Validation Jour 9:**

```bash
# Postman collection complète
jq '.item | length' postman/Fleetcore_Phase1_Complete.json  # Doit être 3 folders

# Newman tests pass
newman run postman/Fleetcore_Phase1_Complete.json

# Tous tests manuels passent
echo "✅ Jour 9 complété - Phase 1 validée"
```

---

### 4.5 Jour 10 (Vendredi 24 Oct): Buffer & Documentation

**Durée:** 8h  
**Priorité:** 🟢 MOYENNE

#### Tâche 10.1: Buffer pour retards (4h)

**Utiliser pour:**

- Corriger bugs découverts lors tests Jour 9
- Compléter documentation manquante
- Refactoring léger si nécessaire

#### Tâche 10.2: Document de Statut Phase 1 (4h)

**Créer:** `FLEETCORE_PHASE1_COMPLETE_24_OCT_2025.md`

**Contenu détaillé:**

- ✅ Toutes 55 APIs implémentées avec liens Postman
- ✅ 6 services métier créés
- ✅ 3 repositories créés
- ✅ Tests manuels 100% pass
- ✅ Documentation API complète
- ✅ Seed data opérationnel
- 📊 Métriques finales (lignes code, couverture, performance)
- 🎯 Prêt pour Phase 2 (Assignments)

**✅ Validation Jour 10:**

```bash
# Document statut créé
ls -la FLEETCORE_PHASE1_COMPLETE_24_OCT_2025.md

# Phase 1 = 100%
echo "🎉 PHASE 1 TERMINÉE À 100%"
echo "✅ 55/55 APIs"
echo "✅ 6/6 Services"
echo "✅ 3/3 Repositories"
echo "✅ Postman collection complète"
echo "✅ Seed data OK"
```

### 4.6 Récapitulatif Semaine 2

**Livrables complétés:**

- ✅ Driver Documents APIs (4 endpoints)
- ✅ Cooperation Terms APIs (5 endpoints) ← CRITIQUE
- ✅ Training APIs (3 endpoints)
- ✅ Blacklist APIs (3 endpoints)
- ✅ Tests E2E complets
- ✅ Postman collection 55 APIs
- ✅ Documentation Phase 1

**Métriques Semaine 2:**
| Métrique | Objectif | Réalisé | Status |
|----------|----------|---------|--------|
| APIs | 13 | 13 | ✅ 100% |
| Phase 1 | 100% | 100% | ✅ TERMINÉ |
| Tests manuels | Pass | Pass | ✅ 100% |
| Documentation | Complète | Complète | ✅ 100% |

---

## 5. SEMAINE 3: MVP DASHBOARD

**Dates:** 27-31 Octobre 2025 (5 jours ouvrés)  
**Objectif:** Dashboard fonctionnel pour démo partenaires  
**Livrables:** 5 pages UI + seed data

### 5.1 Jour 11 (Lundi 27 Oct): Dashboard Layout & Overview

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 11.1: Dashboard Layout (3h)

**Fichiers à créer:**

1. `app/(dashboard)/layout.tsx` - Layout principal avec sidebar
2. `app/(dashboard)/sidebar.tsx` - Navigation component
3. `app/(dashboard)/header.tsx` - Header avec user menu

**Structure:**

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

// Sidebar navigation
const navItems = [
  { name: "Overview", href: "/dashboard", icon: HomeIcon },
  { name: "Vehicles", href: "/dashboard/vehicles", icon: TruckIcon },
  { name: "Drivers", href: "/dashboard/drivers", icon: UsersIcon },
  { name: "Finance", href: "/dashboard/finance", icon: CurrencyDollarIcon },
  { name: "Reports", href: "/dashboard/reports", icon: ChartBarIcon },
];
```

#### Tâche 11.2: Overview Page (5h)

**Fichier:** `app/(dashboard)/overview/page.tsx`

**Composants requis:**

```tsx
// 1. Stats Cards (4)
<StatsCard
  title="Total Vehicles"
  value={stats.total_vehicles}
  change="+2.5%"
  icon={TruckIcon}
/>
<StatsCard title="Online Now" value={stats.online_count} />
<StatsCard title="Today Revenue" value={`€${stats.revenue_today}`} />
<StatsCard title="Active Drivers" value={stats.active_drivers} />

// 2. Online/Offline Widgets (2)
<OnlineVehiclesWidget vehicles={onlineVehicles} />
<OfflineVehiclesWidget vehicles={offlineVehicles} />

// 3. Revenue Counter (temps réel - simulé)
<RevenueCounter currentRevenue={revenue} />

// 4. Alerts Widget
<AlertsWidget alerts={[
  { type: 'maintenance', message: '3 vehicles maintenance due' },
  { type: 'documents', message: '5 documents expiring soon' }
]} />
```

**API calls:**

```tsx
// Fetch data
const stats = await fetch("/api/v1/vehicles/kpis").then((r) => r.json());
const vehicles = await fetch("/api/v1/vehicles?limit=100").then((r) =>
  r.json()
);
const drivers = await fetch("/api/v1/drivers?limit=100").then((r) => r.json());
```

**✅ Validation Jour 11:**

```bash
# Démarrer dev server
npm run dev

# Accéder dashboard
open http://localhost:3000/dashboard

# Vérifier
# - Sidebar visible et navigation fonctionne
# - 4 stats cards affichées
# - 2 widgets online/offline
# - Revenue counter animé
# - Alerts affichées

echo "✅ Jour 11 complété - Dashboard layout + Overview"
```

---

### 5.2 Jour 12 (Mardi 28 Oct): Vehicles Pages

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 12.1: Vehicles List Page (4h)

**Fichier:** `app/(dashboard)/vehicles/page.tsx`

**Fonctionnalités:**

```tsx
// 1. Filters bar
<FiltersBar>
  <Input placeholder="Search license plate..." />
  <Select options={['All Status', 'Active', 'Maintenance', 'Inactive']} />
  <Select options={['All Makes', 'Toyota', 'Mercedes', 'BMW']} />
</FiltersBar>

// 2. Table avec TanStack Table
<DataTable
  columns={[
    { header: 'License Plate', accessorKey: 'license_plate' },
    { header: 'Make/Model', cell: ({ row }) => `${row.make} ${row.model}` },
    { header: 'Status', cell: ({ row }) => <StatusBadge status={row.status} /> },
    { header: 'Driver', accessorKey: 'assigned_driver' },
    { header: 'Actions', cell: ({ row }) => <ActionsMenu row={row} /> }
  ]}
  data={vehicles}
  pagination
/>

// 3. Action buttons
<Button onClick={() => router.push('/dashboard/vehicles/new')}>
  + Add Vehicle
</Button>
```

**API integration:**

```tsx
const [vehicles, setVehicles] = useState([]);
const [filters, setFilters] = useState({});

useEffect(() => {
  const params = new URLSearchParams(filters);
  fetch(`/api/v1/vehicles?${params}`)
    .then((r) => r.json())
    .then((data) => setVehicles(data.data));
}, [filters]);
```

#### Tâche 12.2: Vehicle Detail Page (4h)

**Fichier:** `app/(dashboard)/vehicles/[id]/page.tsx`

**Sections:**

```tsx
// 1. Vehicle Info Card
<VehicleInfoCard vehicle={vehicle}>
  <p>License: {vehicle.license_plate}</p>
  <p>Make/Model: {vehicle.make} {vehicle.model}</p>
  <p>Year: {vehicle.year}</p>
  <p>Status: <StatusBadge status={vehicle.status} /></p>
  <p>Odometer: {vehicle.odometer} km</p>
</VehicleInfoCard>

// 2. Documents Section
<DocumentsSection documents={vehicle.documents}>
  {documents.map(doc => (
    <DocumentCard
      key={doc.id}
      type={doc.document_type}
      expiryDate={doc.expiry_date}
      verified={doc.verified}
    />
  ))}
</DocumentsSection>

// 3. Assignment Section
<AssignmentCard assignment={vehicle.current_assignment}>
  <p>Driver: {assignment.driver_name}</p>
  <p>Since: {assignment.start_date}</p>
  <Button>Change Driver</Button>
</AssignmentCard>

// 4. Maintenance History
<MaintenanceHistory maintenance={vehicle.maintenance}>
  <Timeline items={maintenance} />
</MaintenanceHistory>

// 5. Performance KPIs
<PerformanceCard kpis={vehicle.performance}>
  <Stat label="Revenue (30d)" value={`€${kpis.revenue_30d}`} />
  <Stat label="Expenses (30d)" value={`€${kpis.expenses_30d}`} />
  <Stat label="Net Profit" value={`€${kpis.net_profit}`} />
  <Chart data={kpis.revenue_trend} />
</PerformanceCard>
```

**✅ Validation Jour 12:**

```bash
# Vehicles list
open http://localhost:3000/dashboard/vehicles
# Vérifier table avec données, filtres fonctionnent, pagination

# Vehicle detail
open http://localhost:3000/dashboard/vehicles/[id]
# Vérifier 5 sections affichées, données chargées

echo "✅ Jour 12 complété - Vehicles pages"
```

---

### 5.3 Jour 13 (Mercredi 29 Oct): Drivers Pages

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 13.1: Drivers List Page (4h)

**Fichier:** `app/(dashboard)/drivers/page.tsx`

**Fonctionnalités:**

```tsx
// 1. Filters
<FiltersBar>
  <Input placeholder="Search name, email..." />
  <Select options={['All Status', 'Active', 'On Leave', 'Suspended']} />
  <Select options={['All Types', 'Employee', 'Contractor', 'Owner Operator']} />
</FiltersBar>

// 2. Table
<DataTable
  columns={[
    { header: 'Name', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar name={row.first_name} />
        <span>{row.first_name} {row.last_name}</span>
      </div>
    )},
    { header: 'Email', accessorKey: 'email' },
    { header: 'Status', cell: ({ row }) => <StatusBadge status={row.employment_status} /> },
    { header: 'Cooperation', accessorKey: 'cooperation_type' },
    { header: 'Vehicle', accessorKey: 'assigned_vehicle' },
    { header: 'Actions', cell: ({ row }) => <ActionsMenu row={row} /> }
  ]}
  data={drivers}
/>
```

#### Tâche 13.2: Driver Detail Page (4h)

**Fichier:** `app/(dashboard)/drivers/[id]/page.tsx`

**Sections:**

```tsx
// 1. Driver Profile
<DriverProfileCard driver={driver}>
  <Avatar size="xl" name={driver.first_name} />
  <h2>{driver.first_name} {driver.last_name}</h2>
  <p>{driver.email}</p>
  <p>{driver.phone}</p>
  <StatusBadge status={driver.employment_status} />
</DriverProfileCard>

// 2. Cooperation Terms
<CooperationTermsCard terms={driver.cooperation_terms}>
  <p>Model: {terms.model_type}</p>
  <p>Since: {terms.start_date}</p>
  {terms.model_type === 'fixed_rental' && (
    <p>Monthly Rental: €{terms.terms.monthly_rental}</p>
  )}
  <Button>View History</Button>
</CooperationTermsCard>

// 3. Documents
<DocumentsSection documents={driver.documents} />

// 4. Revenue (30 days)
<RevenueCard revenue={driver.revenue}>
  <Stat label="Gross Revenue" value={`€${revenue.gross}`} />
  <Stat label="Net Revenue" value={`€${revenue.net}`} />
  <Chart data={revenue.daily_trend} />
</RevenueCard>

// 5. Performance Metrics
<PerformanceCard metrics={driver.performance}>
  <Stat label="Total Trips" value={metrics.total_trips} />
  <Stat label="Avg Rating" value={metrics.average_rating} />
  <Stat label="Acceptance Rate" value={`${metrics.acceptance_rate}%`} />
</PerformanceCard>
```

**✅ Validation Jour 13:**

```bash
# Drivers list
open http://localhost:3000/dashboard/drivers
# Vérifier table, filtres, avatars

# Driver detail
open http://localhost:3000/dashboard/drivers/[id]
# Vérifier 5 sections, cooperation terms, revenue chart

echo "✅ Jour 13 complété - Drivers pages"
```

---

### 5.4 Jour 14 (Jeudi 30 Oct): Seed Data & Polish

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 14.1: Seed Data Script (4h)

**Fichier:** `prisma/seed-demo.ts`

**Données réalistes:**

```typescript
async function seedDemo() {
  const tenantId = "demo-tenant-id";
  const userId = "demo-user-id";

  // 1. Créer 10 véhicules
  const vehicles = [];
  for (let i = 0; i < 10; i++) {
    const vehicle = await prisma.flt_vehicles.create({
      data: {
        tenant_id: tenantId,
        license_plate: `AA-${100 + i}-BB`,
        make_id: toyotaMakeId,
        model_id: corollaModelId,
        year: 2023,
        color: ["Black", "White", "Silver"][i % 3],
        vehicle_type: "sedan",
        fuel_type: "hybrid",
        ownership_type: "owned",
        status: i < 7 ? "active" : "maintenance",
        current_odometer: 50000 + i * 5000,
        created_by: userId,
        updated_by: userId,
      },
    });
    vehicles.push(vehicle);
  }

  // 2. Créer 20 drivers
  const drivers = [];
  const firstNames = [
    "John",
    "Pierre",
    "Ahmed",
    "Mohamed",
    "Jean",
    "Marc",
    "Ali",
    "Hassan",
    "David",
    "Thomas",
  ];
  const lastNames = [
    "Dupont",
    "Martin",
    "Al-Rashid",
    "Ben Ali",
    "Dubois",
    "Bernard",
    "Al-Farsi",
    "Khalil",
    "Moreau",
    "Petit",
  ];

  for (let i = 0; i < 20; i++) {
    const driver = await prisma.rid_drivers.create({
      data: {
        tenant_id: tenantId,
        driver_code: `DRV-${1000 + i}`,
        first_name: firstNames[i % 10],
        last_name: lastNames[i % 10],
        email: `driver${i}@fleetcore.demo`,
        phone: `+336${String(i).padStart(8, "0")}`,
        date_of_birth: new Date(1985 + (i % 15), 0, 15),
        nationality: i < 10 ? "FR" : "AE",
        employment_type: ["employee", "contractor"][i % 2],
        employment_status: i < 17 ? "active" : "on_leave",
        hire_date: new Date(2024, 0, 1 + i),
        emergency_contact_name: `Emergency ${i}`,
        emergency_contact_phone: `+336${String(i + 1).padStart(8, "0")}`,
        created_by: userId,
        updated_by: userId,
      },
    });
    drivers.push(driver);

    // Créer cooperation terms
    await prisma.rid_driver_cooperation_terms.create({
      data: {
        tenant_id: tenantId,
        driver_id: driver.id,
        model_type:
          i % 3 === 0
            ? "fixed_rental"
            : i % 3 === 1
              ? "percentage_split"
              : "salary",
        terms_data:
          i % 3 === 0
            ? { daily_rental: 50, monthly_rental: 1000, currency: "EUR" }
            : i % 3 === 1
              ? {
                  platform_percentages: { uber: 70, bolt: 75 },
                  default_percentage: 70,
                }
              : { monthly_salary: 3000, currency: "EUR" },
        start_date: new Date(2025, 0, 1),
        is_active: true,
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  // 3. Créer assignments (7 véhicules actifs assignés)
  for (let i = 0; i < 7; i++) {
    await prisma.flt_vehicle_assignments.create({
      data: {
        tenant_id: tenantId,
        vehicle_id: vehicles[i].id,
        driver_id: drivers[i].id,
        start_date: new Date(2025, 0, 1 + i),
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  // 4. Créer maintenance pour 3 véhicules
  for (let i = 7; i < 10; i++) {
    await prisma.flt_vehicle_maintenance.create({
      data: {
        tenant_id: tenantId,
        vehicle_id: vehicles[i].id,
        maintenance_type: "scheduled",
        scheduled_date: new Date(2025, 10, 15 + i),
        odometer_reading: vehicles[i].current_odometer,
        status: "scheduled",
        notes: "Regular maintenance",
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  // 5. Créer expenses (fuel) pour 5 véhicules
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 10; j++) {
      await prisma.flt_vehicle_expenses.create({
        data: {
          tenant_id: tenantId,
          vehicle_id: vehicles[i].id,
          expense_category: "fuel",
          expense_date: new Date(2025, 9, 1 + j),
          amount: 80 + Math.random() * 20,
          currency: "EUR",
          quantity: 60 + Math.random() * 10,
          odometer: vehicles[i].current_odometer - (10 - j) * 500,
          created_by: userId,
          updated_by: userId,
        },
      });
    }
  }

  // 6. Créer documents pour tous drivers
  for (const driver of drivers) {
    await prisma.doc_documents.create({
      data: {
        tenant_id: tenantId,
        entity_type: "rid_drivers",
        entity_id: driver.id,
        document_type: "driving_license",
        file_url: `https://storage.demo.com/${driver.id}/license.pdf`,
        issue_date: new Date(2020, 0, 15),
        expiry_date: new Date(2030, 0, 15),
        verified: true,
      },
    });
  }

  console.log("✅ Demo seed completed");
  console.log(`   - ${vehicles.length} vehicles`);
  console.log(`   - ${drivers.length} drivers`);
  console.log(`   - 7 assignments`);
  console.log(`   - 3 scheduled maintenance`);
  console.log(`   - 50 fuel expenses`);
}

seedDemo();
```

**Exécution:**

```bash
# Lancer seed
npx tsx prisma/seed-demo.ts

# Vérifier dans dashboard
npm run dev
open http://localhost:3000/dashboard

# Dashboard doit montrer:
# - 10 véhicules (7 active, 3 maintenance)
# - 20 drivers (17 active, 3 on_leave)
# - 7 assignments
# - 3 maintenance alerts
```

#### Tâche 14.2: UI Polish (4h)

**Améliorations:**

1. **Responsive mobile** : Tester sur mobile, ajuster breakpoints
2. **Loading states** : Ajouter skeletons pendant fetch
3. **Error handling** : Toast notifications pour erreurs
4. **Animations** : Framer Motion pour transitions
5. **Dark mode** : Vérifier thème sombre fonctionne

**Commandes validation:**

```bash
# Test responsive
# - Ouvrir DevTools
# - Tester iPhone, iPad, Desktop
# - Vérifier sidebar collapse sur mobile

# Test loading states
# - Throttle network à Slow 3G
# - Vérifier skeletons apparaissent

# Test error handling
# - Arrêter backend
# - Vérifier toast error s'affiche

echo "✅ Jour 14 complété - Seed data + Polish"
```

---

### 5.5 Jour 15 (Vendredi 31 Oct): Démo Prep & Documentation

**Durée:** 8h  
**Priorité:** 🔴 CRITIQUE

#### Tâche 15.1: Script Démo (2h)

**Créer:** `docs/DEMO_SCRIPT.md`

**Scénario démo 10 minutes:**

```markdown
# Fleetcore MVP Dashboard - Demo Script (10 min)

## Préparation (faire avant démo)

1. Lancer seed data: `npx tsx prisma/seed-demo.ts`
2. Démarrer server: `npm run dev`
3. Ouvrir http://localhost:3000/dashboard
4. Préparer 2 onglets: Dashboard + Postman

## Demo Flow (10 min)

### 1. Overview Page (2 min)

- Montrer stats cards: "10 vehicles, 7 online, €1,250 revenue today"
- Pointer widgets online/offline
- Montrer revenue counter temps réel
- Pointer alerts maintenance (3 vehicles)

### 2. Vehicles (3 min)

- Cliquer "Vehicles" dans sidebar
- Montrer table avec 10 véhicules
- Utiliser filtre: Status = Active → 7 résultats
- Cliquer sur premier véhicule (AA-100-BB)
- Montrer 5 sections:
  - Vehicle info (license, make/model, status)
  - Documents (driving license verified)
  - Assignment (assigned to John Dupont)
  - Maintenance history (dernière oil change)
  - Performance (€450 revenue 30d, chart)

### 3. Drivers (3 min)

- Cliquer "Drivers" dans sidebar
- Montrer table avec 20 drivers
- Filtre: Status = Active → 17 résultats
- Cliquer sur John Dupont
- Montrer 5 sections:
  - Profile (photo, email, phone, status)
  - Cooperation terms (Fixed Rental, €1000/month)
  - Documents (license verified)
  - Revenue (€450 gross, €350 net, chart)
  - Performance (45 trips, 4.8 rating, 95% acceptance)

### 4. Backend APIs (2 min)

- Ouvrir Postman
- Montrer collection "Fleetcore Phase 1 - Complete"
- Exécuter: GET /vehicles
- Exécuter: GET /drivers
- Exécuter: GET /vehicles/:id/performance
- Montrer réponses JSON correctes

## Messages clés

✅ Phase 1 terminée: 55 APIs backend
✅ Dashboard fonctionnel avec données réelles
✅ Multi-tenant isolation
✅ Ready pour Phase 2 (Assignments & Revenue)
```

#### Tâche 15.2: Dry Run Démo (2h)

**Exécuter script démo 3 fois:**

1. **Run 1:** Identifier problèmes
2. **Run 2:** Corriger + re-tester
3. **Run 3:** Timing parfait (10 min max)

**Checklist validation:**

- [ ] Seed data exécute sans erreur
- [ ] Dashboard charge en <2 secondes
- [ ] Toutes stats cards affichent nombres corrects
- [ ] Navigation sidebar fonctionne
- [ ] Tables vehicles/drivers affichent données
- [ ] Filtres fonctionnent
- [ ] Detail pages chargent toutes sections
- [ ] Charts/graphs s'affichent
- [ ] Postman tests pass (55/55)
- [ ] Aucune erreur console browser
- [ ] Aucune erreur server logs

#### Tâche 15.3: Document Final Semaine 3 (4h)

**Créer:** `FLEETCORE_MVP_DASHBOARD_COMPLETE_31_OCT_2025.md`

**Contenu:**

```markdown
# FLEETCORE MVP DASHBOARD - COMPLETED

**Date:** 31 Octobre 2025  
**Version:** 1.0  
**Status:** ✅ READY FOR DEMO

## 📊 Livrables Semaine 3

### UI Pages (5)

- ✅ /dashboard/overview (stats + widgets)
- ✅ /dashboard/vehicles (liste + filtres)
- ✅ /dashboard/vehicles/[id] (détail 5 sections)
- ✅ /dashboard/drivers (liste + filtres)
- ✅ /dashboard/drivers/[id] (détail 5 sections)

### Composants Créés (15)

- ✅ DashboardLayout + Sidebar + Header
- ✅ StatsCard
- ✅ OnlineVehiclesWidget / OfflineVehiclesWidget
- ✅ RevenueCounter
- ✅ AlertsWidget
- ✅ DataTable (TanStack Table)
- ✅ FiltersBar
- ✅ StatusBadge
- ✅ DocumentCard
- ✅ AssignmentCard
- ✅ MaintenanceHistory Timeline
- ✅ PerformanceCard + Charts
- ✅ CooperationTermsCard
- ✅ DriverProfileCard
- ✅ RevenueCard

### Seed Data

- ✅ 10 vehicles (7 active, 3 maintenance)
- ✅ 20 drivers (17 active, 3 on leave)
- ✅ 7 vehicle assignments
- ✅ 3 scheduled maintenance
- ✅ 50 fuel expenses
- ✅ 20 documents (all verified)

### Documentation

- ✅ Demo script (10 min)
- ✅ README dashboard
- ✅ Component storybook (optionnel)

## 🎯 Résultat Final 3 Semaines

### Phase 1 (Semaines 1-2)

- ✅ 55/55 APIs Backend (100%)
- ✅ 6 Services métier
- ✅ 3 Repositories
- ✅ Postman collection complète
- ✅ Tests E2E pass

### MVP Dashboard (Semaine 3)

- ✅ 5 pages UI fonctionnelles
- ✅ 15 composants réutilisables
- ✅ Seed data réaliste
- ✅ Demo script ready

### Métriques Globales 3 Semaines

| Composant    | Lignes Code | Fichiers                | Tests      |
| ------------ | ----------- | ----------------------- | ---------- |
| **Backend**  | ~8,500      | 55 routes + 9 services  | 55 Postman |
| **Frontend** | ~3,000      | 20 components + 5 pages | Manuel     |
| **Config**   | ~500        | 10 configs              | N/A        |
| **TOTAL**    | **~12,000** | **90**                  | **55**     |

## 🚀 Prêt pour la Suite

### Phase 2 (Assignments) - Semaine 4-5

Le dashboard pourra être enrichi avec:

- Page /dashboard/assignments (handover workflow)
- Widget assignments en cours
- Timeline handovers

### Phase 3 (Revenue Pipeline) - Semaine 6-11

Le dashboard pourra être enrichi avec:

- Page /dashboard/finance/revenue
- Import trips CSV
- Reconciliation dashboard
- WPS payroll generation

## ✅ Validation Finale

- [ ] Demo exécutée 3x sans erreur
- [ ] Seed data fonctionne
- [ ] Dashboard responsive (mobile/tablet/desktop)
- [ ] Performance <2s page load
- [ ] 0 erreur console
- [ ] Screenshots pris pour présentation
- [ ] Video démo enregistrée (optionnel)
```

**✅ Validation Jour 15:**

```bash
# Demo script validé
cat docs/DEMO_SCRIPT.md

# Document final créé
cat FLEETCORE_MVP_DASHBOARD_COMPLETE_31_OCT_2025.md

# Dry run démo OK
echo "✅ Démo ready"

echo "🎉 SEMAINE 3 COMPLÉTÉE - MVP DASHBOARD READY FOR DEMO"
```

### 5.6 Récapitulatif Semaine 3

**Livrables complétés:**

- ✅ Dashboard Layout + Navigation
- ✅ Overview Page (4 stats, 4 widgets)
- ✅ Vehicles List + Detail (2 pages)
- ✅ Drivers List + Detail (2 pages)
- ✅ Seed data script (10 vehicles, 20 drivers)
- ✅ UI Polish (responsive, loading, errors)
- ✅ Demo script (10 min)
- ✅ Documentation complète

**Métriques Semaine 3:**
| Métrique | Objectif | Réalisé | Status |
|----------|----------|---------|--------|
| Pages UI | 5 | 5 | ✅ 100% |
| Composants | 15 | 15 | ✅ 100% |
| Seed data | 1 script | 1 script | ✅ 100% |
| Demo script | 1 | 1 | ✅ 100% |

---

## 6. BRIDGE VERS PLAN GLOBAL 26 SEMAINES

**Section critique:** Comment retourner au plan global après ces 3 semaines accélérées.

### 6.1 Position Actuelle vs Plan Initial

**Plan Initial (FLEETCORE_PLAN_DEVELOPPEMENT_DEFINITIF.md):**

```
Semaine 1-6:  Phase 1 Core Métier (55 APIs)
Semaine 7-8:  Phase 2 Assignments (10 APIs)
Semaine 9-14: Phase 3 Revenue Pipeline (40 APIs)
Semaine 15-18: Phase 4 Intégrations (25 APIs)
Semaine 19-22: Phase 5 UI/Dashboards (50 pages)
Semaine 23-26: Phase 6 Complétion (26 APIs + Tests)
```

**Notre Exécution (Scénario 1 - 3 semaines):**

```
Semaine 1-2: Phase 1 Core Métier (55 APIs) ✅ FAIT
Semaine 3:   MVP Dashboard (5 pages) ✅ FAIT
```

**Divergence:**

- ✅ Phase 1 terminée en 2 semaines au lieu de 6 (4 semaines d'avance)
- ✅ MVP Dashboard fait en semaine 3 au lieu de semaine 19-22 (16 semaines d'avance)
- ⚠️ Dashboard incomplet (5/50 pages) - à enrichir progressivement

### 6.2 Plan Retour Détaillé

**Après Semaine 3 (31 Oct), on retourne au plan global à partir de Phase 2.**

#### Timeline Ajustée Post-3 Semaines

```
FAIT:
✅ Semaine 1-2 (13-24 Oct): Phase 1 Complete (55 APIs)
✅ Semaine 3 (27-31 Oct): MVP Dashboard (5 pages)

À FAIRE (retour au plan):
📅 Semaine 4-5 (3-14 Nov): Phase 2 Assignments (10 APIs)
📅 Semaine 6-11 (17 Nov - 26 Dec): Phase 3 Revenue Pipeline (40 APIs)
📅 Semaine 12-15 (30 Dec - 24 Jan): Phase 4 Intégrations (25 APIs)
📅 Semaine 16-17 (27 Jan - 7 Feb): Enrichir Dashboard (+20 pages)
📅 Semaine 18-19 (10-21 Feb): Phase 6 Modules Restants (26 APIs)
📅 Semaine 20-21 (24 Feb - 7 Mar): Tests (530+)
📅 Semaine 22-23 (10-21 Mar): Production Prep
```

**Total Ajusté:** 23 semaines au lieu de 26 (3 semaines gagnées)

### 6.3 Enrichissement Progressif Dashboard

**Principe:** On enrichit le dashboard AU FUR ET À MESURE des phases backend.

**Après Phase 2 (Assignments):**

```
Dashboard à enrichir:
+ /dashboard/assignments (liste)
+ /dashboard/assignments/[id] (handover workflow)
+ Widget "Assignments Actifs" sur overview
+ Timeline handovers dans vehicle detail
```

**Après Phase 3 (Revenue Pipeline):**

```
Dashboard à enrichir:
+ /dashboard/finance (overview)
+ /dashboard/finance/revenue (per driver/vehicle)
+ /dashboard/finance/reconciliation (discrepancies)
+ /dashboard/finance/settlements (payouts)
+ Charts revenue trends sur driver detail
```

**Après Phase 4 (Intégrations):**

```
Dashboard à enrichir:
+ /dashboard/finance/billing (Stripe invoices)
+ /dashboard/tracking (GPS map temps réel - Traccar)
+ Widget "Online Map" sur overview
```

**Semaine 16-17 (Dédiées à UI):**

```
Pages restantes à créer:
+ /dashboard/finance/expenses (breakdown)
+ /dashboard/finance/cashflow (inflows/outflows)
+ /dashboard/maintenance (calendar)
+ /dashboard/reports/* (10 pages reports)
+ /dashboard/settings/* (8 pages)
+ Driver Portal (8 pages séparées)
```

### 6.4 Synchronisation avec FLEETCORE_STATUT_VS_PLAN_DEFINITIF_12_OCT_2025

**Document de référence global:** FLEETCORE_STATUT_VS_PLAN_DEFINITIF_12_OCT_2025.md

**Mise à jour requise après Semaine 3:**

**Créer:** `FLEETCORE_STATUT_GLOBAL_UPDATED_31_OCT_2025.md`

**Contenu:**

```markdown
# Mise à jour statut global post-3 semaines

## Changements vs Plan Initial

| Phase     | Plan Initial | Exécution Réelle | Delta   |
| --------- | ------------ | ---------------- | ------- |
| Phase 1   | Sem 1-6      | Sem 1-2          | -4 sem  |
| MVP Dash  | Sem 19-22    | Sem 3            | -16 sem |
| Phase 2   | Sem 7-8      | Sem 4-5          | -2 sem  |
| Phase 3   | Sem 9-14     | Sem 6-11         | -2 sem  |
| Phase 4   | Sem 15-18    | Sem 12-15        | -2 sem  |
| UI Enrich | -            | Sem 16-17        | NEW     |
| Phase 6   | Sem 23-26    | Sem 18-19        | -4 sem  |
| Tests     | Sem 25       | Sem 20-21        | -4 sem  |
| Prod      | Sem 26       | Sem 22-23        | -3 sem  |

## Nouvelle Timeline Globale: 23 semaines

**Fin projet estimée:** 21 Mars 2026 (vs 28 Mars 2026 plan initial)
**Gain:** 7 jours calendaires

## Ajustements Critiques

1. Dashboard incomplet en Sem 3 → Enrichissement progressif Phases 2-4
2. Tests déplacés à Sem 20-21 (pas fait en Phase 1)
3. Documentation API à compléter en continu

## Prochains Jalons

✅ 31 Oct 2025: Phase 1 100% + MVP Dashboard
📅 14 Nov 2025: Phase 2 Assignments terminée
📅 26 Dec 2025: Phase 3 Revenue Pipeline terminée
📅 24 Jan 2026: Phase 4 Intégrations terminées
📅 21 Feb 2026: Phase 6 Modules Restants terminés
📅 7 Mar 2026: Tests 100%
📅 21 Mar 2026: Production Ready
```

### 6.5 Documents de Continuité Requis

**À créer à la fin de Semaine 3 (31 Oct):**

1. **FLEETCORE_STATUT_GLOBAL_UPDATED_31_OCT_2025.md** (ci-dessus)
2. **FLEETCORE_PHASE2_BRIEFING.md** - Brief détaillé Phase 2 Assignments
3. **FLEETCORE_DASHBOARD_ROADMAP.md** - Plan enrichissement UI progressif
4. **FLEETCORE_3_SEMAINES_RETROSPECTIVE.md** - Leçons apprises

**Template FLEETCORE_PHASE2_BRIEFING.md:**

```markdown
# Phase 2 Assignments & Handovers - Briefing

**Dates:** 3-14 Novembre 2025 (2 semaines)  
**Prérequis:** Phase 1 100% ✅  
**Objectif:** 10 APIs Assignments + Handover Workflow

## État Hérité Phase 1

- ✅ flt_vehicles table complète
- ✅ rid_drivers table complète
- ✅ flt_vehicle_assignments table (vide, prête)
- ✅ APIs Vehicle/Driver opérationnelles
- ✅ Dashboard MVP (overview, vehicles, drivers)

## Spécifications Phase 2

**Référence:** fleetcore_functional_specification_v3.md section 3.5

**Handover Workflow 5 étapes:**

1. Pre-Checks (vehicle disponible, documents valides)
2. Photo Capture (6 angles requis)
3. Condition Record (odomètre, fuel, dégâts)
4. Signatures (digitales)
5. System Actions (update assignment, baseline odomètre)

## APIs à créer (10)

[... détails APIs ...]

## Enrichissement Dashboard

Ajouter après Phase 2:

- Page /dashboard/assignments
- Widget assignments actifs sur overview
- Section handover dans vehicle detail

## Protocole

[... même protocole Claude Code ...]
```

### 6.6 Checklist Transition Post-Semaine 3

**Avant de commencer Phase 2 (4 Nov), vérifier:**

- [ ] Phase 1 = 100% (55/55 APIs)
- [ ] MVP Dashboard déployé et fonctionnel
- [ ] Demo exécutée avec succès
- [ ] Documents continuité créés (4 documents)
- [ ] Postman collection Phase 1 complète (55 requests)
- [ ] Seed data script validé
- [ ] FLEETCORE_STATUT_GLOBAL_UPDATED_31_OCT_2025.md créé
- [ ] FLEETCORE_PHASE2_BRIEFING.md créé
- [ ] Backup DB avant Phase 2
- [ ] Team briefing fait (si équipe)
- [ ] Partenaires informés (si démo faite)

**Commandes validation:**

```bash
# Vérifier Phase 1
curl http://localhost:3000/api/v1/vehicles | jq '.data | length'  # > 0
curl http://localhost:3000/api/v1/drivers | jq '.data | length'  # > 0

# Vérifier Dashboard
open http://localhost:3000/dashboard
# Toutes pages doivent charger

# Vérifier docs créés
ls -la FLEETCORE_STATUT_GLOBAL_UPDATED_31_OCT_2025.md
ls -la FLEETCORE_PHASE2_BRIEFING.md
ls -la FLEETCORE_DASHBOARD_ROADMAP.md
ls -la FLEETCORE_3_SEMAINES_RETROSPECTIVE.md

# Backup DB
pg_dump $DATABASE_URL > backups/fleetcore_phase1_complete_31oct2025.sql

echo "✅ Prêt pour Phase 2"
```

---

## 7. PROTOCOLE DE TRAVAIL CLAUDE CODE

**Rappel du protocole strict établi:**

### 7.1 Workflow Obligatoire

```
1. JE (Claude Senior) fais le prompt détaillé
2. VOUS soumettez à Claude Code en MODE PLAN
3. VOUS me communiquez son plan
4. ON VALIDE ensemble ou ON impose modifications
5. BOUCLE jusqu'à plan validé
6. APRÈS validation: Claude Code exécute
7. VOUS me donnez le compte rendu
8. VÉRIFICATION TERMINAL obligatoire (pas juste compte rendu)
9. STEP suivant uniquement après validation terminale
```

### 7.2 Mode ULTRATHINK

**Claude Code doit être en mode ULTRATHINK pour:**

- Lire COMPLÈTEMENT les spécifications avant coder
- Vérifier dans prisma/schema.prisma les champs disponibles
- Ne jamais inventer de champs ou tables
- Suivre EXACTEMENT les patterns existants
- Penser aux edge cases et validations

### 7.3 Interdictions Formelles

❌ **INTERDIT ABSOLU:**

1. Prendre décisions impactant process métier sans accord
2. Déduire choses sans fait avéré et vérifiable
3. Faire suppositions
4. Changer règles juste pour débugger
5. Spécifier autre chose que dans spécifications
6. Inventer tables ou attributs
7. Si pas dans spécification = **INTERDIT**

### 7.4 Format Prompts pour Claude Code

**Structure obligatoire chaque prompt:**

```
ULTRATHINK

CONTEXT:
[Projet, phase, objectif, état actuel]

SPÉCIFICATIONS FONCTIONNELLES:
[Référence section specs avec numéros]

SPÉCIFICATIONS TECHNIQUES:
[Tables, champs, relations depuis datamodel]

FICHIERS À CRÉER:
[Liste numérotée avec paths complets]

CONTRAINTES STRICTES:
1. RESPECTER L'EXISTANT: [patterns à copier]
2. MULTI-TENANT: [règles isolation]
3. VALIDATION MÉTIER: [règles business]
4. PRISMA SCHEMA: [vérifications obligatoires]

STRUCTURE RÉPONSE ATTENDUE:
[Format plan détaillé]

VALIDATION:
[Commandes verification]
```

### 7.5 Validation Après Chaque STEP

**Commandes systématiques:**

```bash
# 1. Compilation TypeScript
npx tsc --noEmit
# Doit retourner 0 erreur

# 2. Vérifier fichiers créés
ls -la [fichiers attendus]

# 3. Tester endpoints
curl [endpoints créés]
# Vérifier status codes corrects

# 4. Vérifier DB
psql $DATABASE_URL -c "SELECT COUNT(*) FROM [table];"

# 5. Tests Postman si applicable
newman run postman/[collection].json
```

### 7.6 Gestion Erreurs

**Si erreur détectée:**

1. **STOP** immédiatement (ne pas continuer)
2. **ANALYSER** l'erreur avec ULTRATHINK
3. **LIRE** specs pour comprendre intention
4. **PROPOSER** correction avec justification
5. **ATTENDRE** validation Mohamed
6. **CORRIGER** après validation
7. **RE-VÉRIFIER** complètement

**NE JAMAIS:**

- Supposer cause erreur sans vérifier
- Contourner erreur en changeant specs
- Continuer malgré erreur "mineure"
- Inventer solution non documentée

---

## 8. CRITÈRES DE VALIDATION

### 8.1 Validation Par Jour

**Chaque jour (Jours 1-15) doit satisfaire:**

✅ **Code:**

- 0 erreur TypeScript (`npx tsc --noEmit`)
- Tous fichiers créés existent
- Pattern copié exactement depuis existant
- Aucun champ inventé

✅ **Tests:**

- Tous curl tests passent
- Status codes corrects (201, 200, 404, 409...)
- Réponses JSON valides
- Multi-tenant isolation vérifiée

✅ **Documentation:**

- Postman collection updated
- Commandes validation documentées
- Décisions documentées si déviations

### 8.2 Validation Par Semaine

**Fin de chaque semaine (Sem 1, 2, 3) doit satisfaire:**

✅ **Semaine 1 (17 Oct):**

- [ ] 15 APIs créées (10 Directory + 5 Fleet)
- [ ] DirectoryService complètement implémenté
- [ ] Seed data exécuté avec succès
- [ ] Postman tests 15/15 pass
- [ ] 0 erreur compilation

✅ **Semaine 2 (24 Oct):**

- [ ] 28 APIs restantes créées (Phase 1 = 100%)
- [ ] Cooperation Terms fonctionnel (critique)
- [ ] Tests E2E complet pass
- [ ] Postman collection 55/55 requests
- [ ] Document FLEETCORE_PHASE1_COMPLETE_24_OCT_2025.md créé

✅ **Semaine 3 (31 Oct):**

- [ ] 5 pages Dashboard fonctionnelles
- [ ] Seed data avec 10 vehicles + 20 drivers
- [ ] Demo script validé (3 dry runs OK)
- [ ] Dashboard responsive (mobile/tablet/desktop)
- [ ] Document FLEETCORE_MVP_DASHBOARD_COMPLETE_31_OCT_2025.md créé
- [ ] Documents transition créés (4 docs)

### 8.3 Validation Globale 3 Semaines

**31 Octobre 2025 - Checklist Finale:**

✅ **Backend (Phase 1):**

- [ ] 55/55 APIs implémentées
- [ ] 6 services métier opérationnels
- [ ] 3 repositories créés
- [ ] Multi-tenant isolation stricte
- [ ] Soft-delete fonctionnel
- [ ] Audit trail actif
- [ ] 0 erreur TypeScript
- [ ] Tests Postman 55/55 pass

✅ **Frontend (MVP Dashboard):**

- [ ] 5 pages UI fonctionnelles
- [ ] 15 composants réutilisables
- [ ] Responsive (mobile/tablet/desktop)
- [ ] Loading states implémentés
- [ ] Error handling avec toasts
- [ ] Performance <2s page load
- [ ] 0 erreur console browser

✅ **Data:**

- [ ] Seed data script fonctionnel
- [ ] 10 vehicles + 20 drivers + assignments
- [ ] Documents tous verified
- [ ] Maintenance scheduled
- [ ] Expenses enregistrées

✅ **Documentation:**

- [ ] Postman collection complète (55 requests)
- [ ] Demo script (10 min)
- [ ] FLEETCORE_PHASE1_COMPLETE_24_OCT_2025.md
- [ ] FLEETCORE_MVP_DASHBOARD_COMPLETE_31_OCT_2025.md
- [ ] FLEETCORE_STATUT_GLOBAL_UPDATED_31_OCT_2025.md
- [ ] FLEETCORE_PHASE2_BRIEFING.md
- [ ] FLEETCORE_DASHBOARD_ROADMAP.md
- [ ] FLEETCORE_3_SEMAINES_RETROSPECTIVE.md

✅ **Transition:**

- [ ] Bridge vers plan 26 semaines établi
- [ ] Phase 2 briefing prêt
- [ ] Backup DB fait
- [ ] Prêt à démarrer Phase 2 (4 Nov)

---

## 9. RISQUES ET MITIGATIONS

### 9.1 Risques Identifiés

| Risque                               | Probabilité | Impact   | Mitigation                     |
| ------------------------------------ | ----------- | -------- | ------------------------------ |
| **Retards Semaine 1**                | Moyenne     | Haute    | Buffer Jour 10 (Sem 2)         |
| **Bugs complexes Cooperation Terms** | Moyenne     | Critique | ULTRATHINK + tests exhaustifs  |
| **Dashboard seed data bugs**         | Basse       | Moyenne  | Tests dry run ×3               |
| **Performance dashboard**            | Basse       | Moyenne  | Pagination stricte, caching    |
| **Multi-tenant leaks**               | Basse       | Critique | Tests dédiés chaque API        |
| **Specs mal comprises**              | Moyenne     | Critique | Relire specs avant chaque STEP |

### 9.2 Plan Contingence

**Si retard >1 jour sur un STEP:**

1. **Évaluer impact:** Bloque suite ? Critique ?
2. **Décision:**
   - Si non-bloquant → Reporter à buffer Jour 10
   - Si bloquant → Utiliser Jour 10 immédiatement
3. **Ajuster planning:** Documenter changement
4. **Informer:** Mettre à jour statut

**Si bug critique découvert:**

1. **STOP** développement features
2. **Root cause analysis:** ULTRATHINK complet
3. **Fix & re-test:** Ne pas contourner
4. **Régression tests:** Vérifier pas cassé autre chose
5. **Documentation:** Ajouter à tests permanents

### 9.3 Points de Non-Retour

**Décisions irréversibles à prendre AVANT:**

**Avant Semaine 1:**

- [ ] Confirmer 3 semaines disponibles (15 jours ouvrés)
- [ ] Confirmer ressources (Mohamed + Claude Code)
- [ ] Confirmer environnement dev opérationnel

**Avant Semaine 3:**

- [ ] Confirmer démo nécessaire (si non, skip Semaine 3)
- [ ] Confirmer date démo partenaires
- [ ] Confirmer seed data suffisant pour démo

**Après Semaine 3:**

- [ ] Décision: Continuer Phase 2 immédiatement OU pause ?
- [ ] Si pause: Durée ? Impact timeline globale ?

---

## 10. DOCUMENTS DE CONTINUITÉ

### 10.1 Documents à Créer (10 Total)

**Pendant 3 semaines:**

1. **Jour 9:** FLEETCORE_PHASE1_COMPLETE_24_OCT_2025.md
2. **Jour 15:** FLEETCORE_MVP_DASHBOARD_COMPLETE_31_OCT_2025.md
3. **Jour 15:** FLEETCORE_STATUT_GLOBAL_UPDATED_31_OCT_2025.md
4. **Jour 15:** FLEETCORE_PHASE2_BRIEFING.md
5. **Jour 15:** FLEETCORE_DASHBOARD_ROADMAP.md
6. **Jour 15:** FLEETCORE_3_SEMAINES_RETROSPECTIVE.md

**Optionnels (recommandés):**

7. **FLEETCORE_POSTMAN_GUIDE.md** - Comment utiliser collection
8. **FLEETCORE_SEED_DATA_GUIDE.md** - Personnaliser seed data
9. **FLEETCORE_DEMO_VIDEO_GUIDE.md** - Enregistrer démo
10. **FLEETCORE_TROUBLESHOOTING.md** - Erreurs communes + solutions

### 10.2 Structure Documents Continuité

**Template standard:**

```markdown
# [TITRE DOCUMENT]

**Date:** [Date création]  
**Version:** 1.0  
**Auteur:** Équipe Fleetcore  
**Statut:** [Draft/Review/Final]  
**Référence:** [Docs précédents liés]

---

## 📋 CONTEXTE

[Expliquer pourquoi ce document existe]

## 🎯 OBJECTIF

[But précis du document]

## 📊 ÉTAT ACTUEL

[Snapshot situation au moment création]

## 🚀 PROCHAINES ÉTAPES

[Actions concrètes suite à ce document]

## ✅ VALIDATION

[Checklist critères succès]

## 📚 RÉFÉRENCES

[Liens vers autres docs]

---

**Fin du document**
```

### 10.3 Conservation Documents

**Où stocker:**

```
projet/
├── docs/
│   ├── status/
│   │   ├── FLEETCORE_PHASE1_COMPLETE_24_OCT_2025.md
│   │   ├── FLEETCORE_MVP_DASHBOARD_COMPLETE_31_OCT_2025.md
│   │   └── FLEETCORE_STATUT_GLOBAL_UPDATED_31_OCT_2025.md
│   ├── planning/
│   │   ├── FLEETCORE_PLAN_EXECUTION_3_SEMAINES_DETAILLE_12_OCT_2025.md ← CE FICHIER
│   │   ├── FLEETCORE_PHASE2_BRIEFING.md
│   │   └── FLEETCORE_DASHBOARD_ROADMAP.md
│   ├── retrospectives/
│   │   └── FLEETCORE_3_SEMAINES_RETROSPECTIVE.md
│   └── guides/
│       ├── FLEETCORE_POSTMAN_GUIDE.md
│       ├── FLEETCORE_SEED_DATA_GUIDE.md
│       └── FLEETCORE_DEMO_VIDEO_GUIDE.md
└── backups/
    └── fleetcore_phase1_complete_31oct2025.sql
```

### 10.4 Checklist Documents Transition

**Avant Phase 2 (4 Nov), vérifier tous docs créés:**

- [ ] FLEETCORE_PHASE1_COMPLETE_24_OCT_2025.md (fin Sem 2)
- [ ] FLEETCORE_MVP_DASHBOARD_COMPLETE_31_OCT_2025.md (fin Sem 3)
- [ ] FLEETCORE_STATUT_GLOBAL_UPDATED_31_OCT_2025.md (bridge plan global)
- [ ] FLEETCORE_PHASE2_BRIEFING.md (specs Phase 2 détaillées)
- [ ] FLEETCORE_DASHBOARD_ROADMAP.md (plan enrichissement UI)
- [ ] FLEETCORE_3_SEMAINES_RETROSPECTIVE.md (leçons apprises)
- [ ] Postman collection Phase 1 exportée (55 requests)
- [ ] Backup DB Phase 1 complete
- [ ] Screenshots dashboard (pour reporting)
- [ ] Vidéo démo (optionnel mais recommandé)

---

## 📊 MÉTRIQUES FINALES 3 SEMAINES

### Résumé Exécutif

**Durée:** 15 jours ouvrés (3 semaines)  
**Dates:** 13 Octobre - 31 Octobre 2025  
**Équipe:** Mohamed + Claude Code (ULTRATHINK)

**Livrables:**

- ✅ 55 APIs Backend (Phase 1 = 100%)
- ✅ 5 Pages Dashboard UI
- ✅ 6 Services métier
- ✅ 3 Repositories
- ✅ 15 Composants UI réutilisables
- ✅ Seed data script
- ✅ Demo ready (10 min)
- ✅ 8 Documents continuité

**Métriques Code:**

- Backend: ~8,500 lignes
- Frontend: ~3,000 lignes
- Config: ~500 lignes
- **Total: ~12,000 lignes**
- Fichiers: ~90 fichiers
- Tests: 55 Postman requests

**Gain Timeline:**

- Phase 1: -4 semaines (2 sem vs 6 sem plan)
- MVP Dashboard: -16 semaines (sem 3 vs sem 19-22 plan)
- **Total gain: ~3 semaines sur plan global 26 semaines**
- **Nouveau total estimé: 23 semaines**

---

## ✅ CONCLUSION

Ce plan d'exécution 3 semaines (Scénario 1) permet de:

1. ✅ **Terminer Phase 1 à 100%** en 2 semaines (vs 6 semaines plan initial)
2. ✅ **Créer MVP Dashboard fonctionnel** en 1 semaine (vs 4 semaines plan initial)
3. ✅ **Avoir démo prête** pour partenaires dès semaine 3
4. ✅ **Retourner proprement au plan global** 26 semaines avec bridge clair
5. ✅ **Enrichir dashboard progressivement** pendant Phases 2-4
6. ✅ **Gagner ~3 semaines** sur timeline globale

**Prochaine étape:** Phase 2 Assignments & Handovers (Semaines 4-5)

**Référence ce document:** Pour tout nouveau Claude dans les chats futurs, lire CE document pour comprendre où on en est et comment on est arrivé là.

---

**Document généré le:** 12 Octobre 2025 - 19h00 Dubai  
**Version:** 1.0 ULTRA DÉTAILLÉE  
**Auteur:** Claude Senior Architecte  
**Validé par:** Mohamed  
**Statut:** ✅ READY FOR EXECUTION

---

**FIN DU DOCUMENT**
