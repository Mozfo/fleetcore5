# 📸 FLEETCORE V1 - ÉTAT ACTUEL (PRÉ-MIGRATION)

**Date:** 7 Octobre 2025
**Branch:** main
**Commit:** aed6273 feat(seed): complete operational coverage with 96% table population

---

## DATABASE CONFIGURATION

**Provider:** Supabase PostgreSQL
**Region:** aws-1-ap-south-1 (Mumbai, India)
**Connection:** Voir .env.local pour DATABASE_URL

---

## SCHEMA ACTUEL - 36 TABLES

### CORE (4 tables)

- `organization` (18 columns) - Tenant principal
- `member` (16 columns) - Utilisateurs
- `sys_demo_lead` (18 columns) - Demandes de démo
- `sys_demo_lead_activity` (11 columns) - Historique activités

### ADM (10 tables: adm\_\*)

- `adm_audit_logs` (13 columns)
- `adm_system_parameters` (9 columns)
- `adm_parameter_audit` (7 columns)
- `adm_sequences` (6 columns)
- `adm_documents` (13 columns)
- `adm_notifications` (11 columns)
- `adm_custom_fields` (10 columns)
- `adm_custom_field_values` (6 columns)
- `adm_platform_configurations` (11 columns)
- `adm_employers` (15 columns)

### FLT (8 tables: flt\_\*)

- `flt_vehicles` (24 columns)
- `flt_vehicle_assignments` (9 columns)
- `flt_vehicle_maintenance` (20 columns)
- `flt_vehicle_inspections` (17 columns)
- `flt_vehicle_insurance` (13 columns)
- `flt_vehicle_expenses` (13 columns)
- `flt_vehicle_accidents` (20 columns)
- `flt_vehicle_telemetry` (13 columns)

### RID (7 tables: rid\_\*)

- `rid_drivers` (19 columns)
- `rid_driver_platforms` (9 columns)
- `rid_driver_documents` (12 columns)
- `rid_driver_performance` (17 columns)
- `rid_driver_scores` (11 columns)
- `rid_driver_training` (12 columns)
- `rid_driver_violations` (16 columns)

### REV (3 tables: rev\_\*)

- `rev_revenue_imports` (13 columns)
- `rev_driver_revenues` (17 columns)
- `rev_reconciliations` (11 columns)

### BIL (4 tables: bil\_\*)

- `bil_driver_balances` (14 columns)
- `bil_driver_deductions` (11 columns)
- `bil_driver_payments` (15 columns)
- `bil_payment_batches` (13 columns)

---

## SEED DATA COVERAGE

**Script:** prisma/seed.ts (1,804 lignes)

**Données actuelles:**

- Organizations: 2 (Dubai UAE, Paris France)
- Members: Sample data
- System Parameters: UAE + France (VAT rates, commission rates)
- Employers: 2 (1 UAE, 1 France)
- Vehicles: 16 (8 UAE, 8 France)
- Vehicle Assignments: 16
- Drivers: 20 (10 UAE, 10 France)
- Driver Platforms: 20
- Revenue Imports: 2
- Driver Revenues: Sample trips
- Driver Balances: 20
- Driver Payments: Sample payments

---

## CODE DEPENDENCIES

### Prisma Models Used in Code

**Webhook Clerk:** `organization`, `member`
**Demo Leads API:** `sys_demo_lead`, `sys_demo_lead_activity`
**Admin Pages:** `organization`, `sys_demo_lead`
**Lib helpers:** `organization`, `adm_audit_logs`

---

## MIGRATIONS APPLIQUÉES

```bash
migrations/
└── 0_init/
    └── migration.sql (création initiale 36 tables)
```

**Status:** 1 migration déployée sur Mumbai

---

## RLS POLICIES (MUMBAI)

**Status:** Mentionné dans commit 8c2ba8e

- 32 tables avec RLS
- 39 policies tenant-scoped

**Note:** Politiques à vérifier et réappliquer sur Zurich

---

## BACKUP CHECKLIST

Avant migration vers Zurich, exporter:

- Schema complet (pg_dump --schema-only)
- Données organization
- Données member
- Données sys_demo_lead
- Données sys_demo_lead_activity
- Fichiers Supabase Storage (si existants)

---

## DIVERGENCES AVEC SPEC V2

### Tables à supprimer (non spécifiées V2)

- adm_system_parameters
- adm_parameter_audit
- adm_sequences
- adm_notifications
- adm_custom_fields
- adm_custom_field_values
- adm_platform_configurations
- adm_employers
- flt_vehicle_inspections
- flt_vehicle_accidents
- flt_vehicle_telemetry
- rid_driver_platforms
- rid_driver_scores
- rid_driver_violations
- sys_demo_lead_activity

### Tables à renommer

- organization → adm_tenants
- member → adm_members
- sys_demo_lead → crm_leads
- flt_vehicle_insurance → flt_vehicle_insurances (pluriel)
- rid_driver_performance → rid_driver_performances (pluriel)
- bil*\* (4 tables) → fin*\* (domaine finance au lieu de billing)

### Tables manquantes (spec V2)

**Total: 29 tables à créer**

Voir docs/Version 2/fleetcore_restart_plan_en.md pour liste complète

---

## NEXT STEPS

1. Créer projet Supabase Zurich (eu-central-1)
2. Activer extensions: uuid-ossp, pgcrypto
3. Exporter données Mumbai
4. Créer nouveau schema Prisma (55 tables V2)
5. Générer migration v2_full_migration
6. Créer vues de compatibilité
7. Appliquer RLS policies
8. Réimporter données
9. Adapter seed.ts
10. Migrer code API/UI

---

**Document créé pour référence historique - Ne pas modifier**
