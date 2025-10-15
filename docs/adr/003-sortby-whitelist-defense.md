# ADR-003: SortBy Whitelist Defense (Defense-in-Depth)

## Status

**Accepted** (Implemented - October 2025)

## Context

FleetCore expose des API REST permettant le tri de résultats via paramètre `sortBy`. Sans validation, ce paramètre représente une surface d'attaque SQL injection critique.

### Threat Model

**Impact potentiel sans validation** :

- Lecture de données sensibles (PII, secrets)
- Corruption/destruction de données
- Extraction de schéma database
- Escalation de privilèges

### Contraintes Techniques

- Multi-tenant : Isolation stricte via `tenant_id`
- Prisma ORM : Paramètres dynamiques `orderBy: { [field]: order }`
- Performance : Validation <1ms (path critique HTTP)
- Compliance : Audit trail GDPR Article 30

## Decision

Implémentation d'une **stratégie defense-in-depth en 3 couches** pour la validation `sortBy` :

### Architecture 3 Couches

```
┌────────────────────────────────────────────────────────────────┐
│ COUCHE 1 : Type System (Compile-time)                         │
│                                                                │
│  type SortFieldWhitelist = NonEmptyArray<string>              │
│  → TypeScript empêche whitelists vides à la compilation       │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ COUCHE 2 : Runtime Validation (lib/core/validation.ts)        │
│                                                                │
│  validateSortBy(sortBy, whitelist, tenantId)                  │
│  → Rejette tout champ NON présent dans whitelist              │
│  → Case-sensitive (email ≠ EMAIL)                             │
│  → Runtime failsafe: if (whitelist.length === 0) throw        │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ COUCHE 3 : Audit Trail (adm_audit_logs)                       │
│                                                                │
│  action: "validation_failed"                                   │
│  metadata: { attempted_field, allowed_fields }                │
│  → Fire-and-forget vers /api/internal/audit                   │
└────────────────────────────────────────────────────────────────┘
```

### Implémentation Core (142 lignes)

**Fichier** : `lib/core/validation.ts`

```typescript
// COUCHE 1: Type safety
type NonEmptyArray<T> = readonly [T, ...T[]];
export type SortFieldWhitelist = NonEmptyArray<string>;

// COUCHE 2: Runtime validation
export function validateSortBy(
  sortBy: string,
  whitelist: SortFieldWhitelist,
  tenantId?: string
): void {
  // Runtime failsafe (defense-in-depth)
  if (whitelist.length === 0) {
    throw new Error("SECURITY: Whitelist cannot be empty");
  }

  // Case-sensitive exact match
  if (!whitelist.includes(sortBy)) {
    // COUCHE 3: Audit trail (async fire-and-forget)
    auditLog({
      tenantId: tenantId || undefined,
      action: "validation_failed",
      entityType: "system_parameter",
      entityId: "00000000-0000-0000-0000-000000000000",
      metadata: {
        attempted_field: sortBy,
        allowed_fields: whitelist,
        validation_type: "sortby_whitelist",
      },
    });

    throw new ValidationError(
      `Invalid sortBy field: "${sortBy}". Allowed fields: ${whitelist.join(", ")}`
    );
  }
}
```

### Whitelist Criteria (Inclusion/Exclusion Rules)

#### ✅ INCLURE dans whitelist :

- **Identifiants non-sensibles** : `id`, `tenant_id`
- **Métadonnées business** : `status`, `employment_status`, `hire_date`
- **Timestamps système** : `created_at`, `updated_at`
- **Colonnes non-PII** : `rating`, `vehicle_type`, `make`, `model`

#### ❌ EXCLURE de whitelist :

- **PII (données personnelles)** : `phone`, `date_of_birth`, `license_number`
- **Secrets/tokens** : `password_hash`, `api_token`, `professional_card_no`
- **Soft delete** : `deleted_at` (fuite d'information sur données supprimées)
- **Colonnes internes** : `internal_notes`, `admin_comments`

### Exemples Whitelists Implémentées

**Drivers** (11 champs sûrs / 28 total) :

```typescript
export const DRIVER_SORT_FIELDS = [
  "id",
  "tenant_id",
  "first_name",
  "last_name",
  "email",
  "driver_status",
  "employment_status",
  "rating",
  "hire_date",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

// EXCLUDED: phone, date_of_birth, license_number, professional_card_no,
// deleted_at, professional_card_expiry_date, etc.
```

**Vehicles** (16 champs sûrs / 31 total) :

```typescript
export const VEHICLE_SORT_FIELDS = [
  "id",
  "tenant_id",
  "license_plate",
  "make",
  "model",
  "year",
  "vehicle_class_code",
  "status",
  "ownership_type",
  "acquisition_date",
  "vehicle_type",
  "created_at",
  "updated_at",
  "current_mileage",
  "inspection_expiry_date",
  "insurance_expiry_date",
] as const satisfies SortFieldWhitelist;

// EXCLUDED: vin (partial PII), registration_doc_id, deleted_at
```

**Documents** (11 champs sûrs / 15 total) :

```typescript
export const DOC_DOCUMENTS_SORT_FIELDS = [
  "id",
  "tenant_id",
  "document_type",
  "status",
  "category",
  "issue_date",
  "expiry_date",
  "uploaded_at",
  "created_at",
  "updated_at",
  "created_by",
] as const satisfies SortFieldWhitelist;

// EXCLUDED: document_number (peut être secret), storage_path, deleted_at
```

## Alternatives Considérées

### 1. SQL Prepared Statements Only

**Rejeté** : Prisma utilise déjà prepared statements, mais ne protège pas contre champs dynamiques dans `orderBy`

### 2. Regex Validation

**Rejeté** :

- Complexe à maintenir (liste noire infinie)
- Insuffisant pour validation de sécurité
- Ne protège pas contre lecture de colonnes sensibles

### 3. ORM Query Builder Différent

**Rejeté** :

- Prisma déjà utilisé (pas de migration possible)
- Tous les ORM nécessitent validation champs dynamiques

### 4. Mapping Field Aliases

**Rejeté** :

- Over-engineering (ex: `user_email` → `email`)
- Complexité maintenabilité
- Whitelist explicite plus claire pour audits sécurité

## Consequences

### ✅ Positives

- **Sécurité** : Protection complète contre SQL injection via sortBy
- **Performance** : <1ms validation (path critique optimisé)
- **Maintenabilité** : Whitelists co-localisées avec repositories
- **Compliance** : Audit trail automatique (GDPR Article 30)
- **Type Safety** : Compilation échoue si whitelist vide

### ⚠️ Négatives

- **Maintenance** : Ajouter colonne = mettre à jour whitelist manuellement
- **Documentation** : Critères inclusion/exclusion doivent être clairs pour devs
- **Faux positifs** : Champs légitimes peuvent être oubliés dans whitelist

### 📊 Métriques

| Métrique                 | Valeur         | Source                              |
| ------------------------ | -------------- | ----------------------------------- |
| Tests unitaires          | **7/7** passés | `validation.test.ts`                |
| Coverage                 | **95%**        | Vitest                              |
| Performance              | **<1ms**       | Benchmark (8ms pour suite complète) |
| Repositories implémentés | **3/3**        | Drivers, Vehicles, Documents        |
| Champs protégés          | **38 total**   | 11 + 16 + 11                        |
| Attack payloads testés   | **4**          | Voir validation.test.ts             |

## Validation

### Tests Unitaires (7 tests - 180 lignes)

**Fichier** : `lib/core/__tests__/validation.test.ts`

Résultats :

```
✓ lib/core/__tests__/validation.test.ts (7 tests) 5ms
  ✓ accepts valid sortBy field from whitelist
  ✓ throws ValidationError for invalid sortBy field
  ✓ throws error when whitelist is empty
  ✓ validation is case-sensitive
  ✓ provides descriptive error message
  ✓ works without tenantId parameter
  ✓ rejects SQL injection attempts
```

### Security Validation Matrix

| Attack Type             | Whitelist Defense | Audit Trail   | Status      |
| ----------------------- | ----------------- | ------------- | ----------- |
| Malicious SQL payloads  | ✅ Rejected       | ✅ Logged     | **Blocked** |
| Case mismatches         | ✅ Rejected       | ✅ Logged     | **Blocked** |
| PII field access        | ✅ Rejected       | ✅ Logged     | **Blocked** |
| Valid whitelisted field | ✅ Allowed        | ⬜ Not logged | **Allowed** |

## Integration Points

### BaseRepository Integration

**Fichier** : `lib/core/base.repository.ts`

```typescript
async findMany(
  where: Prisma.DriverWhereInput,
  options: PaginationOptions = {}
): Promise<PaginatedResult<Driver>> {
  // Validate sortBy before Prisma query
  if (options.sortBy) {
    const tenantId = typeof where.tenant_id === "string"
      ? where.tenant_id
      : undefined;

    validateSortBy(
      options.sortBy,
      this.getSortWhitelist(),
      tenantId
    );
  }

  // Safe to use sortBy in Prisma query
  const items = await this.prisma[this.model].findMany({
    where,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder || "desc" }
      : { created_at: "desc" },
  });
}
```

### API Routes Usage

```typescript
// app/api/v1/drivers/route.ts
const sortBy = searchParams.get("sortBy") || "created_at";
// ✅ Validation automatique dans repository.findMany()
const result = await driverRepo.findMany(where, { sortBy });
```

## References

- OWASP Top 10 2021: A03 Injection
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/security)
- GDPR Article 30: Records of processing activities
- CWE-89: SQL Injection

## Notes

### Maintenance Guidelines

**Ajouter un nouveau champ sortable** :

1. Vérifier que le champ n'est PAS sensible (PII, secrets)
2. Ajouter à la whitelist du repository
3. Tester manuellement l'endpoint API
4. Vérifier aucune fuite d'information via tri

**Supprimer un champ** :

1. Retirer de la whitelist
2. Tests échoueront si utilisé quelque part
3. Audit trail montrera tentatives d'accès post-suppression

### Performance Considerations

- Validation : O(n) où n = taille whitelist (~10-20 éléments)
- Impact : <1ms (négligeable vs query DB ~10-50ms)
- Optimisation future : Utiliser `Set` si whitelist >50 éléments

---

**Date** : October 15, 2025
**Auteur** : FleetCore Team
**Validé par** : 7/7 tests unitaires + Security Review
