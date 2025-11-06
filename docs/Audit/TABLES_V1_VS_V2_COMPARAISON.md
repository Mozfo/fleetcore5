# 📊 Comparaison Tables V1 → V2 FleetCore

**Date:** 3 Novembre 2025
**Objectif:** Documentation complète des 56 tables V1 et 99 tables V2
**Source:** Analyse fichiers `prisma/schema.prisma` (V1) et `prisma/Schema v2/*.prisma` (V2)

---

## 🎯 Résumé Exécutif

| Métrique | V1 | V2 | Évolution |
|----------|----|----|-----------|
| **Tables totales** | 56 | 99 | **+43 (+77%)** |
| **Convention nommage** | snake_case | PascalCase | Mapping requis |
| **Modules** | 12 | 12 | Stable |

### Évolution par Module:
- **ADM:** 7 → 12 tables (+5, +71%)
- **BIL:** 6 → 9 tables (+3, +50%)
- **CRM:** 3 → 7 tables (+4, +133%)
- **DIR:** 5 → 7 tables (+2, +40%)
- **DOC:** 1 → 4 tables (+3, +300%)
- **FIN:** 6 → 15 tables (+9, +150%)
- **FLT:** 6 → 10 tables (+4, +67%)
- **REV:** 3 → 4 tables (+1, +33%)
- **RID:** 8 → 7 tables (-1, -12%)
- **SCH:** 4 → 12 tables (+8, +200%)
- **SUP:** 3 → 6 tables (+3, +100%)
- **TRP:** 4 → 6 tables (+2, +50%)

---

## 📋 Comparaison Détaillée par Module

### MODULE ADM (Administration)

#### V1 = 7 tables
1. `adm_audit_logs`
2. `adm_member_roles`
3. `adm_members`
4. `adm_provider_employees`
5. `adm_roles`
6. `adm_tenant_lifecycle_events`
7. `adm_tenants`

#### V2 = 12 tables (+5)
1. `AdmTenant` ✅ (existe V1: adm_tenants)
2. `AdmMember` ✅ (existe V1: adm_members)
3. `AdmRole` ✅ (existe V1: adm_roles)
4. `AdmMemberRole` ✅ (existe V1: adm_member_roles)
5. `AdmAuditLog` ✅ (existe V1: adm_audit_logs)
6. `AdmProviderEmployee` ✅ (existe V1: adm_provider_employees)
7. `AdmTenantLifecycleEvent` ✅ (existe V1: adm_tenant_lifecycle_events)
8. `AdmInvitation` ⭐ **NOUVEAU**
9. `AdmRolePermission` ⭐ **NOUVEAU**
10. `AdmRoleVersion` ⭐ **NOUVEAU**
11. `AdmMemberSession` ⭐ **NOUVEAU**
12. `AdmTenantSetting` ⭐ **NOUVEAU**

**Changements:**
- ✅ 7 tables conservées et enrichies
- ⭐ 5 nouvelles tables

---

### MODULE BIL (Billing)

#### V1 = 6 tables
1. `bil_billing_plans`
2. `bil_payment_methods`
3. `bil_tenant_invoice_lines`
4. `bil_tenant_invoices`
5. `bil_tenant_subscriptions`
6. `bil_tenant_usage_metrics`

#### V2 = 9 tables (+3)
1. `BilUsageMetricType` ⭐ **NOUVEAU**
2. `BilBillingPlan` ✅ (existe V1: bil_billing_plans)
3. `BilTenantSubscription` ✅ (existe V1: bil_tenant_subscriptions)
4. `BilTenantUsageMetric` ✅ (existe V1: bil_tenant_usage_metrics)
5. `BilTenantInvoice` ✅ (existe V1: bil_tenant_invoices)
6. `BilTenantInvoiceLine` ✅ (existe V1: bil_tenant_invoice_lines)
7. `BilPaymentMethod` ✅ (existe V1: bil_payment_methods)
8. `BilPromotion` ⭐ **NOUVEAU**
9. `BilPromotionUsage` ⭐ **NOUVEAU**

**Changements:**
- ✅ 6 tables conservées et enrichies
- ⭐ 3 nouvelles tables (metrics types, promotions)

---

### MODULE CRM (Customer Relationship Management)

#### V1 = 3 tables
1. `crm_contracts`
2. `crm_leads`
3. `crm_opportunities`

#### V2 = 7 tables (+4)
1. `CrmLead` ✅ (existe V1: crm_leads)
2. `CrmOpportunity` ✅ (existe V1: crm_opportunities)
3. `CrmContract` ✅ (existe V1: crm_contracts)
4. `CrmLeadSource` ⭐ **NOUVEAU**
5. `CrmOpportunityLossReason` ⭐ **NOUVEAU**
6. `CrmPipeline` ⭐ **NOUVEAU**
7. `CrmAddress` ⭐ **NOUVEAU**

**Changements:**
- ✅ 3 tables conservées et enrichies
- ⭐ 4 nouvelles tables (tracking sources, pipelines, addresses)

---

### MODULE DIR (Directory/Référentiels)

#### V1 = 5 tables
1. `dir_car_makes`
2. `dir_car_models`
3. `dir_country_regulations`
4. `dir_platforms`
5. `dir_vehicle_classes`

#### V2 = 7 tables (+2)
1. `DirCarMake` ✅ (existe V1: dir_car_makes)
2. `DirCarModel` ✅ (existe V1: dir_car_models)
3. `DirPlatform` ✅ (existe V1: dir_platforms)
4. `DirPlatformConfig` ⭐ **NOUVEAU**
5. `DirCountryRegulation` ✅ (existe V1: dir_country_regulations)
6. `DirVehicleClass` ✅ (existe V1: dir_vehicle_classes)
7. `AdmTenantVehicleClass` ⭐ **NOUVEAU**

**Changements:**
- ✅ 5 tables conservées et enrichies
- ⭐ 2 nouvelles tables (platform configs, tenant-specific classes)

---

### MODULE DOC (Documents)

#### V1 = 1 table
1. `doc_documents`

#### V2 = 4 tables (+3)
1. `DocDocumentType` ⭐ **NOUVEAU**
2. `DocEntityType` ⭐ **NOUVEAU**
3. `DocDocument` ✅ (existe V1: doc_documents)
4. `DocDocumentVersion` ⭐ **NOUVEAU**

**Changements:**
- ✅ 1 table conservée et enrichie
- ⭐ 3 nouvelles tables (types, entity types, versioning)

---

### MODULE FIN (Finance)

#### V1 = 6 tables
1. `fin_accounts`
2. `fin_driver_payment_batches`
3. `fin_driver_payments`
4. `fin_toll_transactions`
5. `fin_traffic_fines`
6. `fin_transactions`

#### V2 = 15 tables (+9)
1. `FinAccountType` ⭐ **NOUVEAU**
2. `DirTransactionType` ⭐ **NOUVEAU**
3. `DirTransactionStatus` ⭐ **NOUVEAU**
4. `FinTransactionCategory` ⭐ **NOUVEAU**
5. `FinPaymentBatchStatus` ⭐ **NOUVEAU**
6. `FinPaymentStatus` ⭐ **NOUVEAU**
7. `DirTollGate` ⭐ **NOUVEAU**
8. `DirFineType` ⭐ **NOUVEAU**
9. `FinAccount` ✅ (existe V1: fin_accounts)
10. `FinTransaction` ✅ (existe V1: fin_transactions)
11. `FinDriverPaymentBatch` ✅ (existe V1: fin_driver_payment_batches)
12. `FinDriverPayment` ✅ (existe V1: fin_driver_payments)
13. `FinTollTransaction` ✅ (existe V1: fin_toll_transactions)
14. `FinTrafficFine` ✅ (existe V1: fin_traffic_fines)
15. `FinTrafficFineDispute` ⭐ **NOUVEAU**

**Changements:**
- ✅ 6 tables conservées et enrichies
- ⭐ 9 nouvelles tables (référentiels types, statuts, toll gates, disputes)

---

### MODULE FLT (Fleet)

#### V1 = 6 tables
1. `flt_vehicle_assignments`
2. `flt_vehicle_events`
3. `flt_vehicle_expenses`
4. `flt_vehicle_insurances`
5. `flt_vehicle_maintenance`
6. `flt_vehicles`

#### V2 = 10 tables (+4)
1. `DirVehicleStatus` ⭐ **NOUVEAU**
2. `DirOwnershipType` ⭐ **NOUVEAU**
3. `FltVehicle` ✅ (existe V1: flt_vehicles)
4. `FltVehicleInspection` ⭐ **NOUVEAU**
5. `FltVehicleEquipment` ⭐ **NOUVEAU**
6. `FltVehicleAssignment` ✅ (existe V1: flt_vehicle_assignments)
7. `FltVehicleEvent` ✅ (existe V1: flt_vehicle_events)
8. `FltVehicleMaintenance` ✅ (existe V1: flt_vehicle_maintenance)
9. `FltVehicleExpense` ✅ (existe V1: flt_vehicle_expenses)
10. `FltVehicleInsurance` ✅ (existe V1: flt_vehicle_insurances)

**Changements:**
- ✅ 6 tables conservées et enrichies
- ⭐ 4 nouvelles tables (statuts, ownership types, inspections, equipments)

---

### MODULE REV (Revenue)

#### V1 = 3 tables
1. `rev_driver_revenues`
2. `rev_reconciliations`
3. `rev_revenue_imports`

#### V2 = 4 tables (+1)
1. `RevRevenueImport` ✅ (existe V1: rev_revenue_imports)
2. `RevDriverRevenue` ✅ (existe V1: rev_driver_revenues)
3. `RevReconciliation` ✅ (existe V1: rev_reconciliations)
4. `RevReconciliationLine` ⭐ **NOUVEAU**

**Changements:**
- ✅ 3 tables conservées et enrichies
- ⭐ 1 nouvelle table (reconciliation lines détaillées)

---

### MODULE RID (Rides/Drivers)

#### V1 = 8 tables
1. `rid_driver_blacklists`
2. `rid_driver_cooperation_terms`
3. `rid_driver_documents`
4. `rid_driver_languages` ⚠️
5. `rid_driver_performances`
6. `rid_driver_requests`
7. `rid_driver_training`
8. `rid_drivers`

#### V2 = 7 tables (-1)
1. `RidDriver` ✅ (existe V1: rid_drivers)
2. `RidDriverDocument` ✅ (existe V1: rid_driver_documents)
3. `RidDriverCooperationTerm` ✅ (existe V1: rid_driver_cooperation_terms)
4. `RidDriverRequest` ✅ (existe V1: rid_driver_requests)
5. `RidDriverPerformance` ✅ (existe V1: rid_driver_performances)
6. `RidDriverBlacklist` ✅ (existe V1: rid_driver_blacklists)
7. `RidDriverTraining` ✅ (existe V1: rid_driver_training)

**Changements:**
- ✅ 7 tables conservées et enrichies
- ❌ 1 table supprimée: `rid_driver_languages` (fusion dans rid_drivers?)

---

### MODULE SCH (Scheduling)

#### V1 = 4 tables
1. `sch_goals`
2. `sch_maintenance_schedules`
3. `sch_shifts`
4. `sch_tasks`

#### V2 = 12 tables (+8)
1. `SchShiftType` ⭐ **NOUVEAU**
2. `SchShift` ✅ (existe V1: sch_shifts)
3. `DirMaintenanceType` ⭐ **NOUVEAU**
4. `SchMaintenanceSchedule` ✅ (existe V1: sch_maintenance_schedules)
5. `SchGoalType` ⭐ **NOUVEAU**
6. `SchGoal` ✅ (existe V1: sch_goals)
7. `SchGoalAchievement` ⭐ **NOUVEAU**
8. `SchTaskType` ⭐ **NOUVEAU**
9. `SchTask` ✅ (existe V1: sch_tasks)
10. `SchTaskComment` ⭐ **NOUVEAU**
11. `SchTaskHistory` ⭐ **NOUVEAU**
12. `SchLocation` ⭐ **NOUVEAU**

**Changements:**
- ✅ 4 tables conservées et enrichies
- ⭐ 8 nouvelles tables (types, achievements, comments, history, locations)

---

### MODULE SUP (Support)

#### V1 = 3 tables
1. `sup_customer_feedback`
2. `sup_ticket_messages`
3. `sup_tickets`

#### V2 = 6 tables (+3)
1. `SupTicket` ✅ (existe V1: sup_tickets)
2. `SupTicketMessage` ✅ (existe V1: sup_ticket_messages)
3. `SupCustomerFeedback` ✅ (existe V1: sup_customer_feedback)
4. `SupTicketCategory` ⭐ **NOUVEAU**
5. `SupTicketSlaRule` ⭐ **NOUVEAU**
6. `SupCannedResponse` ⭐ **NOUVEAU**

**Changements:**
- ✅ 3 tables conservées et enrichies
- ⭐ 3 nouvelles tables (categories, SLA rules, canned responses)

---

### MODULE TRP (Trips/Transport)

#### V1 = 4 tables
1. `trp_client_invoices`
2. `trp_platform_accounts`
3. `trp_settlements`
4. `trp_trips`

#### V2 = 6 tables (+2)
1. `TrpPlatformAccount` ✅ (existe V1: trp_platform_accounts)
2. `TrpPlatformAccountKey` ⭐ **NOUVEAU**
3. `TrpTrip` ✅ (existe V1: trp_trips)
4. `TrpSettlement` ✅ (existe V1: trp_settlements)
5. `TrpClientInvoice` ✅ (existe V1: trp_client_invoices)
6. `TrpClientInvoiceLine` ⭐ **NOUVEAU**

**Changements:**
- ✅ 4 tables conservées et enrichies
- ⭐ 2 nouvelles tables (account keys, invoice lines)

---

## 📊 Synthèse Globale

### Tables par Statut

| Statut | Nombre | Pourcentage |
|--------|--------|-------------|
| **Conservées et enrichies** | 55 | 98% des tables V1 |
| **Nouvelles tables V2** | 44 | 44% des tables V2 |
| **Supprimées** | 1 | 2% (rid_driver_languages) |

### Nouvelles Tables par Module

| Module | V1 | V2 | Nouvelles | % Croissance |
|--------|----|----|-----------|--------------|
| ADM | 7 | 12 | +5 | +71% |
| BIL | 6 | 9 | +3 | +50% |
| CRM | 3 | 7 | +4 | +133% |
| DIR | 5 | 7 | +2 | +40% |
| DOC | 1 | 4 | +3 | +300% |
| FIN | 6 | 15 | +9 | +150% |
| FLT | 6 | 10 | +4 | +67% |
| REV | 3 | 4 | +1 | +33% |
| RID | 8 | 7 | -1 | -12% |
| SCH | 4 | 12 | +8 | +200% |
| SUP | 3 | 6 | +3 | +100% |
| TRP | 4 | 6 | +2 | +50% |
| **TOTAL** | **56** | **99** | **+43** | **+77%** |

### Top 3 Croissance

1. **DOC:** +300% (1→4 tables) - Système documentaire complet
2. **SCH:** +200% (4→12 tables) - Gestion enrichie scheduling
3. **FIN:** +150% (6→15 tables) - Finance approfondie

---

## 🔄 Mapping Conventions Nommage

### V1: snake_case
```
adm_tenants
adm_members
bil_billing_plans
fin_transactions
```

### V2: PascalCase
```
AdmTenant
AdmMember
BilBillingPlan
FinTransaction
```

### Règle de Conversion
```
snake_case → PascalCase
adm_audit_logs → AdmAuditLog
fin_driver_payments → FinDriverPayment
```

**Impact Migration:**
- Prisma génère automatiquement les noms de tables en snake_case depuis PascalCase
- Les modèles V2 avec `@@map("table_name")` peuvent mapper vers tables V1 existantes
- Pas besoin de renommer tables PostgreSQL

---

## ⚠️ Points d'Attention

### 1. Table Supprimée
**rid_driver_languages** (V1) n'existe plus en V2
- Vérifier si données fusionnées dans `RidDriver`
- Possibilité de colonne JSONB `languages` dans RidDriver

### 2. Nouvelles Tables Référentiels
V2 introduit beaucoup de tables "types" et "statuts":
- FinAccountType, FinTransactionCategory
- SchShiftType, SchGoalType, SchTaskType
- DirVehicleStatus, DirOwnershipType
- SupTicketCategory

**Action:** Préparer seed data pour ces référentiels

### 3. Tables de Détail/Lignes
Plusieurs tables ajoutent des "lines":
- BilTenantInvoiceLine
- TrpClientInvoiceLine
- RevReconciliationLine

**Impact:** Relations 1:N à créer

### 4. Tables d'Historique
Nouvelles capacités audit/historique:
- SchTaskHistory
- SchTaskComment
- AdmRoleVersion
- DocDocumentVersion

**Impact:** Triggers ou logic app pour populer

---

## ✅ Checklist Validation

- [x] 56 tables V1 listées
- [x] 99 tables V2 listées
- [x] Mapping V1→V2 par module
- [x] 44 nouvelles tables identifiées
- [x] 1 table supprimée documentée
- [x] Conventions nommage expliquées
- [x] Statistiques croissance calculées
- [x] Points d'attention notés

---

**Document créé le:** 3 Novembre 2025
**Par:** Claude Code Assistant (Sonnet 4.5)
**Source:** Analyse complète schema.prisma V1 et Schema v2/*.prisma
**Version:** 1.0
