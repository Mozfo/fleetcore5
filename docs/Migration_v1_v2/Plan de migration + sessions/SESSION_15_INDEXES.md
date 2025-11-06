# POST-MIGRATION V2 - SESSION 15

**Document de référence** : Création des indexes avec soft delete

---

## 📋 TABLE DES MATIÈRES

1. [Session 15 : Indexes avec Soft Delete](#session-15--indexes-avec-soft-delete)
2. [Retour au sommaire principal](./README.md)

---

## SESSION 15 : INDEXES AVEC SOFT DELETE

### Problème : Prisma @@unique sans WHERE clause

**Contexte** : Prisma ne supporte pas `WHERE deleted_at IS NULL` dans `@@unique`
**Solution** : Création manuelle indexes en Session 15 (après migration données)

---

### Module CRM

#### Index 1: `idx_leads_email_unique`

**Fichier** : `05_crm_structure.sql` ligne 859
**Table** : `crm_leads`
**Colonne** : `email`

```sql
-- SESSION 15: Création index UNIQUE avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_unique
ON crm_leads(email)
WHERE deleted_at IS NULL;
```

**Raison** : Permet emails dupliqués si lead supprimé (soft delete)

---

#### Index 2: `idx_contracts_reference_unique`

**Fichier** : `05_crm_structure.sql` ligne 1020
**Table** : `crm_contracts`
**Colonne** : `reference`

```sql
-- SESSION 15: Création index UNIQUE avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_reference_unique
ON crm_contracts(reference)
WHERE deleted_at IS NULL;
```

**Raison** : Permet références dupliquées si contrat supprimé (soft delete)

---

#### Index 3: `idx_contracts_contract_code_unique`

**Fichier** : `05_crm_structure.sql` (implicite)
**Table** : `crm_contracts`
**Colonne** : `contract_code`

```sql
-- SESSION 15: Création index UNIQUE avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_contract_code_unique
ON crm_contracts(contract_code)
WHERE deleted_at IS NULL;
```

**Raison** : `contract_code` UNIQUE V2 avec soft delete

---

### Module DOC

#### Index 4: `idx_documents_code_unique`

**Table** : `doc_documents`
**Colonne** : `document_code`

```sql
-- SESSION 15: Création index UNIQUE avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_code_unique
ON doc_documents(document_code)
WHERE deleted_at IS NULL;
```

---

### Module DIR

#### Index 5: `idx_car_makes_code_unique`

**Table** : `dir_car_makes`
**Colonne** : `make_code`

```sql
-- SESSION 15: Création index UNIQUE avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_car_makes_code_unique
ON dir_car_makes(make_code)
WHERE deleted_at IS NULL;
```

---

#### Index 6: `idx_car_makes_seo_slug_unique`

**Table** : `dir_car_makes`
**Colonne** : `seo_slug`

```sql
-- SESSION 15: Création index UNIQUE avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_car_makes_seo_slug_unique
ON dir_car_makes(seo_slug)
WHERE deleted_at IS NULL;
```

---

### Module FLT

#### Index 7: `idx_vehicles_tenant_license_plate_unique`

**Fichier** : `09_flt_structure.sql` ligne 555
**Table** : `flt_vehicles`
**Colonnes** : `tenant_id`, `license_plate`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_tenant_license_plate_unique
ON flt_vehicles(tenant_id, license_plate)
WHERE deleted_at IS NULL;
```

**Raison** : Permet d'avoir plusieurs véhicules avec la même plaque d'immatriculation si l'ancien véhicule est supprimé (soft delete). Contrainte d'unicité par tenant.

**Prisma constraint** : `@@unique([tenantId, licensePlate], name: "unique_tenant_license_plate")`

---

### Module SCH

#### Index 8: `idx_shift_types_tenant_code_unique`

**Fichier** : `10_sch_structure.sql` ligne 225
**Table** : `sch_shift_types`
**Colonnes** : `tenant_id`, `code`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_shift_types_tenant_code_unique
ON sch_shift_types(tenant_id, code)
WHERE deleted_at IS NULL;
```

**Raison** : Permet d'avoir plusieurs shift types avec le même code si l'ancien type est supprimé (soft delete). Contrainte d'unicité par tenant.

**Prisma constraint** : `@@unique([tenantId, code, deletedAt], name: "sch_shift_types_tenant_code_unique")`

---

#### Index 9: `idx_shifts_tenant_driver_start_unique`

**Fichier** : `10_sch_structure.sql` ligne 275
**Table** : `sch_shifts`
**Colonnes** : `tenant_id`, `driver_id`, `start_time`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_tenant_driver_start_unique
ON sch_shifts(tenant_id, driver_id, start_time)
WHERE deleted_at IS NULL;
```

**Raison** : Empêche qu'un conducteur ait 2 shifts actifs à la même heure de début. Permet la duplication si shift supprimé (soft delete). Contrainte d'unicité par tenant.

**Prisma constraint** : `@@unique([tenantId, driverId, startTime, deletedAt], name: "sch_shifts_tenant_driver_start_unique")`

---

#### Index 10: `idx_maintenance_types_tenant_code_unique`

**Fichier** : `10_sch_structure.sql` ligne 318
**Table** : `dir_maintenance_types`
**Colonnes** : `tenant_id`, `code`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_types_tenant_code_unique
ON dir_maintenance_types(tenant_id, code)
WHERE deleted_at IS NULL;
```

**Raison** : Permet d'avoir plusieurs types de maintenance avec le même code si l'ancien type est supprimé (soft delete). Contrainte d'unicité par tenant.

**Note** : Table `dir_maintenance_types` créée dans session SCH mais avec préfixe DIR (table partagée DIR/SCH).

**Prisma constraint** : `@@unique([tenantId, code, deletedAt], name: "dir_maintenance_types_tenant_code_unique")`

---

#### Index 11: `idx_maintenance_schedules_unique`

**Fichier** : `10_sch_structure.sql` ligne 372
**Table** : `sch_maintenance_schedules`
**Colonnes** : `tenant_id`, `vehicle_id`, `scheduled_date`, `maintenance_type_id`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_schedules_unique
ON sch_maintenance_schedules(tenant_id, vehicle_id, scheduled_date, maintenance_type_id)
WHERE deleted_at IS NULL;
```

**Raison** : Empêche qu'un véhicule ait 2 maintenances actives du même type à la même date. Permet la duplication si maintenance supprimée (soft delete). Contrainte d'unicité par tenant.

**Prisma constraint** : `@@unique([tenantId, vehicleId, scheduledDate, maintenanceTypeId, deletedAt], name: "sch_maintenance_schedules_unique")`

---

#### Index 12: `idx_goal_types_tenant_code_unique`

**Fichier** : `10_sch_structure.sql` ligne 415
**Table** : `sch_goal_types`
**Colonnes** : `tenant_id`, `code`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_types_tenant_code_unique
ON sch_goal_types(tenant_id, code)
WHERE deleted_at IS NULL;
```

**Raison** : Permet d'avoir plusieurs types d'objectifs avec le même code si l'ancien type est supprimé (soft delete). Contrainte d'unicité par tenant.

**Prisma constraint** : `@@unique([tenantId, code, deletedAt], name: "sch_goal_types_tenant_code_unique")`

---

#### Index 13: `idx_goals_unique`

**Fichier** : `10_sch_structure.sql` ligne 470
**Table** : `sch_goals`
**Colonnes** : `tenant_id`, `goal_type_id`, `period_start`, `target_entity_id`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_unique
ON sch_goals(tenant_id, goal_type_id, period_start, target_entity_id)
WHERE deleted_at IS NULL;
```

**Raison** : Empêche qu'une entité (conducteur, équipe) ait 2 objectifs actifs du même type pour la même période. Permet la duplication si objectif supprimé (soft delete). Contrainte d'unicité par tenant.

**Prisma constraint** : `@@unique([tenantId, goalTypeId, periodStart, targetEntityId, deletedAt], name: "sch_goals_unique")`

---

#### Index 14: `idx_task_types_tenant_code_unique`

**Fichier** : `10_sch_structure.sql` ligne 540
**Table** : `sch_task_types`
**Colonnes** : `tenant_id`, `code`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_types_tenant_code_unique
ON sch_task_types(tenant_id, code)
WHERE deleted_at IS NULL;
```

**Raison** : Permet d'avoir plusieurs types de tâches avec le même code si l'ancien type est supprimé (soft delete). Contrainte d'unicité par tenant.

**Prisma constraint** : `@@unique([tenantId, code, deletedAt], name: "sch_task_types_tenant_code_unique")`

---

#### Index 15: `idx_locations_tenant_code_unique`

**Fichier** : `10_sch_structure.sql` ligne 701
**Table** : `sch_locations`
**Colonnes** : `tenant_id`, `code`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_tenant_code_unique
ON sch_locations(tenant_id, code)
WHERE deleted_at IS NULL;
```

**Raison** : Permet d'avoir plusieurs zones géographiques avec le même code si l'ancienne zone est supprimée (soft delete). Contrainte d'unicité par tenant.

**Prisma constraint** : `@@unique([tenantId, code, deletedAt], name: "sch_locations_tenant_code_unique")`

---

### Module TRP

#### Index 16: `idx_platform_accounts_tenant_platform_unique`

**Fichier** : `12_trp_structure.sql` ligne 523
**Table** : `trp_platform_accounts`
**Colonnes** : `tenant_id`, `platform_id`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_accounts_tenant_platform_unique
ON trp_platform_accounts(tenant_id, platform_id)
WHERE deleted_at IS NULL;
```

**Raison** : Empêche qu'un tenant ait plusieurs comptes actifs pour la même plateforme (Uber, Careem, Bolt). Permet la duplication si compte supprimé (soft delete). Contrainte d'unicité par tenant.

**Prisma constraint** : `@@unique([tenantId, platformId, deletedAt], name: "trp_platform_accounts_tenant_platform_unique")`

---

#### Index 17: `idx_trips_platform_trip_unique`

**Fichier** : `12_trp_structure.sql` ligne 529
**Table** : `trp_trips`
**Colonnes** : `platform_account_id`, `platform_trip_id`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_platform_trip_unique
ON trp_trips(platform_account_id, platform_trip_id)
WHERE deleted_at IS NULL;
```

**Raison** : Empêche l'import dupliqué d'une même course depuis la plateforme. Un `platform_trip_id` (ex: Uber Trip ID) est unique par compte plateforme. Permet la duplication si course supprimée (soft delete).

**Prisma constraint** : `@@unique([platformAccountId, platformTripId, deletedAt], name: "trp_trips_platform_trip_unique")`

---

#### Index 18: `idx_client_invoices_number_unique`

**Fichier** : `12_trp_structure.sql` ligne 535
**Table** : `trp_client_invoices`
**Colonnes** : `tenant_id`, `invoice_number`

```sql
-- SESSION 15: Création index UNIQUE composite avec soft delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_invoices_number_unique
ON trp_client_invoices(tenant_id, invoice_number)
WHERE deleted_at IS NULL;
```

**Raison** : Garantit l'unicité du numéro de facture (format INV-YYYY-NNNN) par tenant. Permet la duplication si facture annulée/supprimée (soft delete). Contrainte d'unicité par tenant.

**Prisma constraint** : `@@unique([tenantId, invoiceNumber, deletedAt], name: "trp_client_invoices_number_unique")`

---

