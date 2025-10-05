# FLEETCORE - PLAN DE CONSTRUCTION LOGIQUE

**Date:** 06 Octobre 2025
**Principe:** Construction par dépendances (comme un immeuble: étage 1 avant étage 2)

---

## ANALYSE DES DÉPENDANCES GLOBALES

### Vue d'ensemble du système FleetCore

```
FleetCore = Plateforme SaaS multi-tenant pour gestion flottes VTC

Composants majeurs:
1. Infrastructure & Auth (Clerk multi-tenant)
2. Database (35 tables Prisma + PostgreSQL)
3. Backoffice Admin (/adm - FleetCore team)
4. Dashboard Clients (/dashboard - Organisations clientes)
5. Module Fleet (Véhicules + Maintenance)
6. Module Drivers (Chauffeurs + Documents + Performance)
7. Module Revenus (Import platforms + Calculs + Paiements)
8. Module Paramétrage (System parameters UAE/France)
9. Application Mobile Drivers (React Native)
10. Intégrations Plateformes (Uber/Careem/Bolt APIs)
```

---

## PHASE 0: FONDATIONS (ÉTAT ACTUEL - COMPLÉTÉ ✅)

**Durée:** Terminé
**Statut:** ✅ Production ready

### Ce qui existe déjà:

**Infrastructure:**

- ✅ Next.js 15.5.3 + Turbopack
- ✅ Clerk Auth 6.32.2
- ✅ Supabase PostgreSQL (Mumbai)
- ✅ Prisma 6.16.2
- ✅ Vercel déployé
- ✅ i18n (EN/FR)

**Pages Auth:**

- ✅ /[locale]/login
- ✅ /[locale]/forgot-password
- ✅ /[locale]/reset-password
- ❌ /en/register (supprimé - workflow invitation only)

**Backoffice Admin:**

- ✅ /adm/leads (gestion leads commerciaux - OPTIMISÉ)
- ✅ /adm/organizations
- ✅ Middleware auto-redirect admin

**Database:**

- ✅ 4 tables: organization, member, sys_demo_lead, sys_demo_lead_activity

**APIs:**

- ✅ /api/demo-leads (CRUD complet)

**Décisions architecturales validées:**

- ✅ `/adm` pour backoffice FleetCore (pas `/platform`)
- ✅ Organisation "FleetCore Admin" dans Clerk
- ✅ Rôles: org:adm_admin, org:adm_commercial, org:adm_support
- ✅ Pas de custom permissions Clerk (code-based checks)
- ✅ Workflow invitation uniquement (pas de register public)

---

## PHASE 1: FONDATIONS DATABASE & AUDIT (2 JOURS) 🔴

**Objectif:** Créer la base de données complète + système d'audit
**Principe:** Sans database complète, RIEN ne peut être construit
**Bloquant pour:** TOUTES les phases suivantes

### ✅ ÉTAPE 1.1: Schema Database Complet - TERMINÉ

**Date:** 06 Octobre 2025
**Commit:** c2c447e
**Durée réelle:** 5h (avec correction naming)
**Statut:** ✅ COMPLETE

**Résultat:**

- ✅ 37 tables créées (36 app + 1 \_prisma_migrations)
- ✅ Conventions de nommage respectées: adm*, flt*, rid*, rev*, bil\_
- ✅ Soft delete ajouté: organization, member, sys_demo_lead
- ✅ Données existantes conservées: 7 orgs, 4 members, 4 leads
- ✅ TypeScript compilation OK
- ✅ `prisma db push` en 9.83s

**Tables par catégorie:**

- `adm_` (10): audit_logs, system_parameters, parameter_audit, sequences, documents, notifications, custom_fields, custom_field_values, platform_configurations, employers
- `flt_` (8): vehicles, vehicle_assignments, vehicle_maintenance, vehicle_inspections, vehicle_insurance, vehicle_expenses, vehicle_accidents, vehicle_telemetry
- `rid_` (7): drivers, driver_platforms, driver_documents, driver_performance, driver_scores, driver_training, driver_violations
- `rev_` (3): revenue_imports, driver_revenues, reconciliations
- `bil_` (4): driver_balances, driver_deductions, driver_payments, payment_batches

**Leçons apprises:**

- ✅ ULTRATHINK avant d'exécuter (chercher docs officielles)
- ✅ Toujours commit AVANT migration
- ✅ Utiliser `prisma db push` pour Supabase (évite shadow database)
- ✅ Valider données intactes après modifications

**RLS Policies:**

- ✅ 32 tables avec Row Level Security activé
- ✅ 39 policies créées (tenant-scoped via auth.jwt())
- ✅ Pattern: `tenant_id IN (SELECT tenant_id FROM member WHERE clerk_id = auth.jwt() ->> 'sub')`
- ✅ Tables ADM: policies SELECT/INSERT/UPDATE séparées selon logique métier
- ✅ Tables FLT/RID/REV/BIL: policy ALL pour simplifier

---

### ÉTAPE 1.2: Seed Data (PROCHAINE - 2h)

**Pourquoi en premier:**

- ❌ Sans tables = Impossible de coder les features
- ✅ Database = Fondation de tout le système
- ✅ Permet développement parallèle ensuite

**Sous-tâches:**

#### 1. Créer prisma/seed.ts (PROCHAINE)

**Données de base à créer:**

```typescript
// Organization FleetCore Admin déjà existe
deleted_at      DateTime?
deleted_by      String?
deletion_reason String?
```

#### 2. Créer table audit_logs (30 min)

**Schema complet:**

```prisma
model audit_logs {
  id                  String    @id @default(uuid())
  tenant_id           String?
  action              String
  entity_type         String
  entity_id           String
  snapshot            Json?
  changes             Json?
  performed_by        String?
  performed_by_clerk_id String?
  ip_address          String?
  user_agent          String?
  reason              String?
  metadata            Json?
  created_at          DateTime  @default(now())

  @@index([tenant_id, created_at])
  @@index([entity_type, entity_id])
  @@index([action, created_at])
}
```

#### 3. Importer 31 tables VTC (3h)

**Tables Système (3):**

- system_parameters
- parameter_audit
- sequences

**Tables Support (4):**

- documents
- notifications
- custom_fields
- custom_field_values

**Tables Fleet (8):**

- vehicles
- vehicle_assignments
- vehicle_maintenance
- vehicle_inspections
- vehicle_insurance
- vehicle_expenses
- vehicle_accidents
- vehicle_telemetry

**Tables Drivers (7):**

- drivers
- driver_platforms
- driver_documents
- driver_performance
- driver_scores
- driver_training
- driver_violations

**Tables Employers (1):**

- employers (France uniquement)

**Tables Revenus (8):**

- platform_configurations
- revenue_imports
- driver_revenues
- driver_balances
- driver_deductions
- driver_payments
- payment_batches
- reconciliations

**Source:** FLEETCORE_VTC_SPECIFICATION_V2_COMPLETE.md

#### 4. Validation schema (30 min)

```bash
npx prisma validate
npx prisma format
cat prisma/schema.prisma | grep "^model " | wc -l  # Doit afficher 35
```

#### 5. Créer migration (30 min)

```bash
npx prisma migrate dev --name phase1_complete_database_35_tables
```

**Livrables:**

- ✅ 35 tables dans schema.prisma
- ✅ Migration appliquée à Supabase
- ✅ npx prisma validate passe
- ✅ Aucune erreur TypeScript
- ✅ Build compile

---

### ÉTAPE 1.2: Seed Data (JOUR 1 - 2h)

**Dépend de:** Étape 1.1 (migration appliquée)

**Pourquoi:**

- ✅ Parameters système essentiels (VAT, commissions, etc.)
- ✅ Test data pour développement
- ✅ Vérifier intégrité relations

**Données à insérer:**

1. **Organization FleetCore Admin**
   - clerk_org_id: FLEETCORE_ADMIN_ORG_ID
   - name: FleetCore Admin
   - country_code: AE

2. **System Parameters UAE (9 params)**
   - vat_rate_uae: 0.05
   - aed_to_usd: 0.27
   - commission_uber_uae: 0.25
   - commission_careem_uae: 0.20
   - commission_bolt_uae: 0.15
   - fuel_price_aed: 2.50
   - min_balance_threshold: 500
   - payment_frequency: weekly
   - rental_rate_daily: 80

3. **System Parameters France (6 params)**
   - vat_rate_fr: 0.20
   - eur_to_usd: 1.10
   - commission_uber_fr: 0.25
   - commission_bolt_fr: 0.15
   - fuel_price_eur: 1.80
   - payment_frequency: monthly

4. **Test Vehicles (3)**
   - VEH001: Toyota Camry 2023
   - VEH002: Tesla Model 3 2024
   - VEH003: Honda Accord 2023

5. **Test Drivers (3)**
   - DRV001: Ahmed Al Mansouri
   - DRV002: Mohammed Hassan
   - DRV003: Fatima Al Zaabi

**Commandes:**

```bash
npx prisma db seed
npx prisma studio  # Vérifier données
```

**Livrables:**

- ✅ Seed script créé (prisma/seed.ts)
- ✅ Parameters UAE/FR insérés
- ✅ Test data visible dans Prisma Studio
- ✅ Aucune erreur FK constraints

---

### ÉTAPE 1.3: Webhooks Clerk & Audit (JOUR 2 - 4h)

**Dépend de:** Étape 1.1 (table audit_logs existe)

**Pourquoi:**

- ✅ Nécessaire pour workflow invitation (Phase 2)
- ✅ Sync automatique Clerk → Supabase
- ✅ Audit trail obligatoire (RGPD)

**Actions:**

1. **Créer API webhook** (3h)
   - Route: /app/api/webhooks/clerk/route.ts
   - Vérification signature Svix
   - Events: user._, organization._, organizationMembership.\*
   - Handlers: sync member + audit trail
   - Soft delete support

2. **Configurer Clerk Dashboard** (30 min MANUEL)
   - Webhooks > Add Endpoint
   - URL: https://[votre-url]/api/webhooks/clerk
   - Events: sélectionner tous
   - Copier signing secret → .env.local

3. **Tester** (30 min)
   - Créer user test dans Clerk Dashboard
   - Vérifier sync dans Prisma Studio:
     - Table member: nouveau row
     - Table audit_logs: event user.created

**Livrables:**

- ✅ API webhooks créée
- ✅ Webhooks configurés Clerk Dashboard
- ✅ Test sync réussi (user → member)
- ✅ Audit logs fonctionnel
- ✅ Build compile

---

**VALIDATION PHASE 1:**

```bash
# Database
npx prisma studio  # 35 tables visibles + seed data

# Build
pnpm build  # ✅ Succès

# Webhooks
# Créer user Clerk → vérifier member créé + audit_log

# Git
git add .
git commit -m "feat(phase1): complete database 35 tables + webhooks + audit"
```

**Critères passage Phase 2:**

- ✅ 35 tables en production
- ✅ Seed data chargé
- ✅ Webhooks testés
- ✅ Build stable

---

## PHASE 2: WORKFLOW INVITATION CLIENT (1 JOUR) 🟠

**Objectif:** Onboarding clients complet (demo → organisation active)
**Dépend de:** Phase 1 (webhooks + database)
**Bloquant pour:** Aucune phase (peut continuer en parallèle)

### ÉTAPE 2.1: Helper Permissions (30 min)

**Fichier:** lib/auth/permissions.ts

**Fonctions:**

- canManageLeads()
- canConvertLeads()
- canImpersonateClients()

**Logique:** Vérifications orgRole + orgId

---

### ÉTAPE 2.2: API Conversion Lead (1h)

**Route:** /api/demo-leads/[id]/convert

**Dépend de:** Helper permissions

**Flow:**

1. Vérifier canConvertLeads()
2. Vérifier lead.status === 'validated'
3. Créer org Clerk
4. Créer org Supabase
5. Créer invitation Clerk (org:admin)
6. Update lead → converted
7. Audit log

---

### ÉTAPE 2.3: Page Onboarding Client (2h)

**Route:** /onboarding/complete?token=xxx

**IMPORTANT:** Collecte documents UNIQUEMENT (pas création compte)

**Formulaire:**

- Raison sociale
- SIRET / Trade License
- IBAN
- Upload assurance flotte
- Upload Kbis

**Action:** Update lead → awaiting_validation

---

### ÉTAPE 2.4: Page Accept Invitation (2h)

**Route:** /accept-invitation?\_\_clerk_ticket=xxx

**UI:**

- Société: GRISÉ (non modifiable)
- Email: PRÉ-REMPLI (non modifiable)
- Password: SEUL champ éditable

**Flow:**

1. Récupérer infos invitation Clerk
2. Afficher formulaire
3. Submit → Clerk.signUp.create() avec ticket
4. Webhook sync → table member
5. Redirect /dashboard

---

### ÉTAPE 2.5: Pages Invitation Membres (2h)

**Routes:**

- /dashboard/team/invite (admin client → org:member uniquement)
- /adm/organizations/[id]/invite-admin (super admin → org:admin)

---

**VALIDATION PHASE 2:**

Test workflow complet:

1. ✅ Lead dans /adm/leads
2. ✅ Convert → org Clerk + Supabase créées
3. ✅ Email invitation reçu
4. ✅ Accept invitation → compte créé
5. ✅ Webhook sync → member table
6. ✅ Login → redirect /dashboard

---

## PHASE 3: MODULES CORE VTC (5 JOURS) 🟠

**Objectif:** Features business essentielles
**Dépend de:** Phase 1 (database)
**Bloquant pour:** Phase 4 (calculs)

### JOUR 3: Repository Pattern + Services

**Pourquoi:**

- ✅ Réutiliser code
- ✅ Éviter duplication queries
- ✅ Faciliter tests

**Créations:**

1. BaseRepository (2h)
2. VehicleRepository + VehicleService (2h)
3. DriverRepository + DriverService (2h)
4. ParameterService (2h)

---

### JOUR 4: Module Véhicules CRUD

**Dépend de:** VehicleRepository

**APIs:**

- GET /api/v1/vehicles
- POST /api/v1/vehicles
- PUT /api/v1/vehicles/[id]
- DELETE /api/v1/vehicles/[id] (soft delete)

**UI:**

- /dashboard/fleet/vehicles (liste + filtres)
- /dashboard/fleet/vehicles/new (formulaire création)
- /dashboard/fleet/vehicles/[id]/edit

---

### JOUR 5: Module Chauffeurs CRUD

**Dépend de:** DriverRepository

**Actions similaires JOUR 4**

---

### JOUR 6: Module Assignments

**Dépend de:** Véhicules + Chauffeurs

**Règle business:** 1 driver = 1 vehicle actif max

**APIs:**

- POST /api/v1/assignments
- GET /api/v1/assignments
- PUT /api/v1/assignments/[id]/end

**UI:**

- /dashboard/fleet/assignments
- Validation règles métier

---

### JOUR 7: Import Revenus

**Dépend de:** Drivers + Platform configurations

**Parsers:**

- CSV Uber
- CSV Careem
- CSV Bolt

**UI:**

- Upload fichier
- Preview données
- Validation + Import

---

**VALIDATION PHASE 3:**

- ✅ CRUD véhicules fonctionnel
- ✅ CRUD chauffeurs fonctionnel
- ✅ Assignments créés avec validation
- ✅ Import revenus testé (3 platforms)

---

## PHASE 4: CALCULS & PAIEMENTS (3 JOURS) 🟡

**Objectif:** Calcul balances + génération paiements
**Dépend de:** Phase 3 (import revenus)
**Bloquant pour:** Phase 5 (modules avancés)

### JOUR 8: Calcul Balances

**Service:** BalanceCalculationService

**Formule:**

```
net = gross_revenue - platform_commission - deductions
```

**Gérer:**

- UAE: paiements hebdomadaires
- France: paiements mensuels

---

### JOUR 9: Déductions & Paiements

**APIs:**

- POST /api/v1/deductions
- POST /api/v1/payments
- POST /api/v1/payment-batches

**UI:**

- Gérer déductions (rental, fuel, fines)
- Générer batch paiements
- Export CSV/Excel

---

### JOUR 10: Réconciliation

**Service:** ReconciliationService

**Logique:** Comparer revenus déclarés vs calculés

**UI:** Dashboard écarts

---

**VALIDATION PHASE 4:**

- ✅ Balances calculées correctement
- ✅ Paiements générés
- ✅ Export batch fonctionnel
- ✅ Tests E2E flow complet

---

## PHASE 5: MODULES AVANCÉS (5 JOURS) 🟡

**Dépend de:** Phase 4

### JOUR 11-12: Maintenance Véhicules

- Preventive maintenance scheduling
- Inspections tracking
- Alerts (assurance, contrôle technique)

### JOUR 13-14: Performance Drivers

- KPIs calculation
- Scoring system
- Leaderboard

### JOUR 15: Notifications

- Email (Resend)
- Push notifications setup

---

## PHASE 6: APPLICATION MOBILE (10 JOURS) 🟢

**Dépend de:** Phase 3 (APIs disponibles)

**Stack:** React Native + Expo

**Features:**

1. Login Clerk
2. Dashboard revenus
3. Scan documents
4. Notifications push
5. GPS tracking

---

## PHASE 7: PRODUCTION (5 JOURS) 🟢

**Dépend de:** Toutes phases

### JOUR 26-28: Tests

- Tests unitaires (Jest)
- Tests E2E (Playwright)
- Coverage > 70%

### JOUR 29: Security

- Auth audit
- API protection
- RLS Supabase

### JOUR 30: Deploy

- Staging
- Production
- Monitoring

---

## RÉSUMÉ TIMELINE

```
PHASE 0: FONDATIONS                               ✅ 0 jours (FAIT)
PHASE 1: DATABASE & AUDIT                         🔴 2 jours (CRITIQUE)
PHASE 2: WORKFLOW INVITATION                      🟠 1 jour
PHASE 3: MODULES CORE VTC                         🟠 5 jours
PHASE 4: CALCULS & PAIEMENTS                      🟡 3 jours
PHASE 5: MODULES AVANCÉS                          🟡 5 jours
PHASE 6: APP MOBILE                               🟢 10 jours
PHASE 7: PRODUCTION                               🟢 5 jours

TOTAL: 31 jours (~6 semaines)
```

---

## GRAPHE DE DÉPENDANCES

```
PHASE 1: DATABASE
  ├─→ Tables (35)
  ├─→ Seed data
  └─→ Webhooks
       │
       ├─→ PHASE 2: WORKFLOW INVITATION
       │    └─→ (Peut continuer en parallèle)
       │
       └─→ PHASE 3: MODULES CORE
            ├─→ Repositories
            ├─→ Véhicules CRUD
            ├─→ Chauffeurs CRUD
            ├─→ Assignments
            └─→ Import Revenus
                 │
                 └─→ PHASE 4: CALCULS
                      ├─→ Balances
                      ├─→ Paiements
                      └─→ Réconciliation
                           │
                           ├─→ PHASE 5: AVANCÉS
                           │    ├─→ Maintenance
                           │    ├─→ Scoring
                           │    └─→ Notifications
                           │
                           └─→ PHASE 6: MOBILE
                                └─→ PHASE 7: PRODUCTION
```

---

## RÈGLES DE CONSTRUCTION

**RÈGLE 1: Dépendances strictes**

- ❌ Impossible Phase N+1 sans Phase N complète
- ❌ Impossible créer drivers sans table drivers
- ❌ Impossible calculer balances sans import revenus

**RÈGLE 2: Validation à chaque étape**

- ✅ Build compile
- ✅ Tests passent
- ✅ Git commit
- ✅ Vérification données Prisma Studio

**RÈGLE 3: Parallélisation possible**

- ✅ Phase 2 peut continuer pendant Phase 3
- ✅ Mobile app peut démarrer dès APIs disponibles
- ❌ Mais toujours respecter dépendances

---

## PROCHAINE ACTION

**DÉMARRER PHASE 1 ÉTAPE 1.1**

**Checklist avant de commencer:**

- [ ] Lire FLEETCORE_VTC_SPECIFICATION_V2_COMPLETE.md (tables détaillées)
- [ ] Backup database actuelle
- [ ] Créer branche git: feature/phase1-database
- [ ] Préparer environnement: npx prisma studio ouvert

**Première tâche:**
Ajouter colonnes soft delete aux 3 tables existantes (member, organization, sys_demo_lead)

**Durée estimée:** 30 minutes

---

**Dernière mise à jour:** 06/10/2025 00h45
**Statut:** Plan logique complet validé
**Type:** Plan de construction par dépendances
