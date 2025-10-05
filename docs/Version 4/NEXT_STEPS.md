# FLEETCORE - NEXT STEPS

**Date:** 06 Octobre 2025 00h00
**État:** Phase 0 terminée, Phase 1 Jour 3 à démarrer
**Référence:** FLEETCORE_STATUS_SESSION_v1.md + FLEETCORE_PLAN_DEVELOPPEMENT_COMPLET_V2.md

---

## PROCHAINES ÉTAPES PRIORITAIRES

### Option A: Database Expansion (35 tables VTC) - **PRIORITÉ CRITIQUE 🔴**

**Durée:** 1 jour
**Impact:** **BLOQUANT** - Sans ces tables, FleetCore ne peut rien gérer

**Pourquoi CRITIQUE:**

- ❌ Sans tables = Impossible CRUD véhicules
- ❌ Sans tables = Impossible gérer chauffeurs
- ❌ Sans tables = Impossible importer revenus
- ❌ Sans tables = Impossible paramétrage système
- **✅ Avec tables = Débloquer TOUTES les features core**

**Tâches:**

1. **Import 31 tables depuis spec** (2h)
   - Source: `FLEETCORE_VTC_SPECIFICATION_V2_COMPLETE.md`
   - Tables critiques:
     - `system_parameters`, `parameter_audit`, `sequences` (paramétrage)
     - `vehicles`, `vehicle_assignments`, `vehicle_maintenance` (flotte)
     - `drivers`, `driver_platforms`, `driver_documents` (chauffeurs)
     - `employers`, `platform_configurations` (employeurs)
     - `revenue_imports`, `driver_revenues`, `driver_balances` (revenus)
     - `driver_payments`, `driver_deductions` (paiements)
     - `documents`, `notifications`, `custom_fields` (support)
   - Adapter syntaxe Prisma
   - Définir relations (foreign keys)
   - Ajouter index performance

2. **Validation schema** (30 min)
   - `npx prisma validate` ✅
   - Compter models: 35 total
   - `npx prisma format`
   - Vérifier relations cohérentes

3. **Migration database** (1h)
   - `npx prisma migrate dev --name add_35_tables_vtc_complete`
   - Vérifier migration appliquée Supabase
   - `npx prisma studio` → vérifier 35 tables créées

4. **Seed data** (2h)
   - Créer `prisma/seed.ts`
   - Données essentielles:
     - Organization "FleetCore Admin" (avec FLEETCORE_ADMIN_ORG_ID)
     - System parameters UAE (13 params: vat_rate, aed_to_usd, etc.)
     - System parameters France (13 params)
     - Test vehicles (5): Toyota Camry, Honda Accord, etc.
     - Test drivers (5): avec platforms (Uber, Careem)
     - Test leads (3)
   - `npx prisma db seed`
   - Vérifier données dans Prisma Studio

**Total estimé: 5h30 (1 jour)**

---

### Option B: Soft Delete + Audit Trail - **PRIORITÉ HAUTE 🟠**

**Durée:** 2/3 jour
**Impact:** Conformité RGPD + traçabilité complète
**Prérequis:** Peut se faire EN PARALLÈLE d'Option A

**Tâches:**

1. **Ajouter colonnes soft delete** (1h)
   - Modifier `prisma/schema.prisma`
   - Colonnes à ajouter (member, organization, sys_demo_lead):
     - `status String @default("active")`
     - `deleted_at DateTime?`
     - `deleted_by String?`
     - `deletion_reason String?`
   - Migration: `npx prisma migrate dev --name add_soft_delete`

2. **Créer table audit_logs** (30 min)
   - Model Prisma complet
   - Colonnes: action, entity_type, entity_id, snapshot, changes, performed_by, reason, metadata
   - Index: tenant_id, entity_type, entity_id, action

3. **Créer API webhooks Clerk** (3h)
   - Route: `/api/webhooks/clerk/route.ts`
   - Vérification signature Svix
   - Events: user._, organization._, organizationMembership.\*
   - Sync Clerk → Supabase avec audit trail

4. **Configurer webhooks Clerk Dashboard** (30 min MANUEL)
   - Créer endpoint dans Clerk Dashboard
   - Copier signing secret → `.env.local`
   - Tester

5. **Tests webhooks** (1h)
   - Créer user Clerk → vérifier sync Supabase + audit_logs
   - Soft delete user → vérifier audit trail

**Total estimé: 6h (2/3 jour)**

---

### Option C: Workflow Invitation Client - **PRIORITÉ HAUTE 🟠**

**Durée:** 1 jour
**Impact:** Débloquer onboarding clients complet
**Prérequis:** Nécessite Option B (webhooks) pour fonctionner complètement

**Tâches:**

1. **Créer helper permissions** (30 min)
   - Fichier: `lib/auth/permissions.ts`
   - Fonctions: `canManageLeads()`, `canConvertLeads()`, `canImpersonateClients()`

2. **Créer API conversion lead** (1h)
   - Route: `/api/demo-leads/[id]/convert`
   - Actions: Créer org Clerk + Supabase + invitation

3. **Créer page onboarding client** (2h)
   - Route: `/onboarding/complete?token=xxx`
   - Collecte documents (pas création compte)

4. **Créer page accept-invitation** (2h)
   - Route: `/accept-invitation?__clerk_ticket=xxx`
   - Société GRISÉE, password seul champ éditable

5. **Créer page invitation membres** (1h30)
   - Route: `/dashboard/team/invite`
   - Restriction: UNIQUEMENT `org:member`

6. **Créer page invitation 2ème admin** (1h)
   - Route: `/adm/organizations/[id]/invite-admin`
   - Super admin FleetCore uniquement

**Total estimé: 8h (1 jour)**

---

## RECOMMANDATION FINALE

**Ordre OBLIGATOIRE:**

### **JOUR 1: Option A (Database Expansion)** 🔴

- **CRITIQUE** - Fondation de tout le système
- Sans ces tables, rien ne fonctionne
- Débloquer CRUD véhicules/chauffeurs/revenus

### **JOUR 2: Option B (Soft Delete + Audit)** 🟠

- Conformité RGPD obligatoire
- Webhooks Clerk essentiels pour workflow invitation
- Peut commencer en parallèle jour 1 si besoin

### **JOUR 3: Option C (Workflow Invitation)** 🟠

- Nécessite webhooks (Option B)
- Débloquer onboarding clients
- Valeur business visible

**Total Phase 1:** 3 jours

---

## CRITÈRES DE VALIDATION

**Fin Option A (Database):**

- [ ] 35 tables dans schema.prisma
- [ ] `npx prisma validate` ✅
- [ ] Migration appliquée à Supabase
- [ ] Seed data chargé (params UAE/FR + test data)
- [ ] `npx prisma studio` affiche 35 tables avec données
- [ ] Build compile
- [ ] Git commit

**Fin Option B (Soft Delete + Audit):**

- [ ] Colonnes soft delete ajoutées (migration appliquée)
- [ ] Table `audit_logs` créée
- [ ] API `/api/webhooks/clerk` fonctionne
- [ ] Webhooks configurés dans Clerk Dashboard
- [ ] Test: créer user Clerk → sync Supabase → vérifier audit_logs
- [ ] Build compile
- [ ] Git commit

**Fin Option C (Workflow Invitation):**

- [ ] Page `/onboarding/complete` accessible avec token
- [ ] Page `/accept-invitation` avec société grisée
- [ ] API conversion lead → org fonctionne
- [ ] Workflow complet testé: demo → onboarding → accept → login dashboard
- [ ] Build compile
- [ ] Git commit

---

## BLOCAGES CONNUS

**Aucun bloqueur technique**

Database Mumbai: Performance acceptable (optimisée)

**Migration Supabase:** Archivée (hors plan) - voir FLEETCORE_STATUS_SESSION_v1.md section 5

---

## DÉCISIONS ARCHITECTURALES À RESPECTER

1. **❌ PAS d'accès direct Clerk** - Tout via formulaires FleetCore
2. **❌ PAS d'accès direct Supabase** - Aucune interface database externe
3. **✅ Organisation TOUJOURS connue** - Via workflow invitation uniquement
4. **✅ Nom société JAMAIS modifiable** - Pré-rempli et grisé partout
5. **✅ Admin client peut UNIQUEMENT inviter org:member** - Pas org:admin
6. **✅ Queries TOUJOURS scopées** - `where: { tenant_id: orgId }`
7. **✅ Rôles Clerk simples** - Pas de custom permissions

---

## DOCUMENTS DE RÉFÉRENCE

- **FLEETCORE_STATUS_SESSION_v1.md** - État actuel complet + workflow invitation (section 10)
- **FLEETCORE_PLAN_DEVELOPPEMENT_COMPLET_V2.md** - Plan phases détaillé
- **FLEETCORE_VTC_SPECIFICATION_V2_COMPLETE.md** - Spec 35 tables database

---

**Dernière mise à jour:** 06/10/2025 00h00
**Prochaine action:** Option A - Database Expansion (CRITIQUE - 1 jour)
