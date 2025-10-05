# FLEETCORE VTC - PLAN D'ORCHESTRATION DÉVELOPPEMENT

**Version:** 2.0 - Plan de travail orchestration  
**Date:** 04/10/2025  
**Usage:** Diriger Claude Code + Validation progressive

---

## ÉTAT ACTUEL - AUDIT FACTUEL

### ✅ Fonctionnel (Jour 1-2 Complétés)

**Infrastructure**

- Next.js 15.5.3 + Turbopack
- Clerk Auth 6.32.2
- Supabase + Prisma 6.16.2
- Vercel déployé

**Pages**

- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/request-demo` + `/request-demo/form`

**Database**

- Tables: `organization` (4 records), `member`, `sys_demo_lead`, `sys_demo_lead_activity`
- Prisma generate exécuté

**API**

- `/api/demo-leads` POST/GET fonctionne

### ❌ Bloqué (Build Ne Compile Pas)

**APIs Cassées**

- `/api/demo-leads/[id]/route.ts` - MANQUANT
- `/api/demo-leads/[id]/activity/route.ts` - Erreurs syntaxe Next.js 15
- `/api/demo-leads/[id]/accept/route.ts` - Erreurs syntaxe Clerk v6

**Conséquence:** `pnpm build` ÉCHOUE

### ⏳ Manquant Complet

**Module Lead Management**

- Page admin `/admin/leads` - interface gestion commerciale
- Tableau + filtres + formulaire activité

**Multi-tenant**

- Clerk Organizations pas activé
- Création org à l'inscription
- Org switcher header
- Tests isolation JAMAIS faits
- Rôles/permissions non configurés
- Webhooks Clerk non configurés

**UI/UX**

- Page d'accueil = template Next.js
- Navigation dropdowns manquants
- Footer absent
- Dark mode non implémenté
- Responsive non vérifié

**Jour 3+**

- 35 tables VTC Spec V2
- Système paramétrage
- Tout le reste...

---

## STRUCTURE PHASES

```
PHASE 0: DÉBLOCAGE (Aujourd'hui - 2h)
    └─> Build compile + APIs OK + Page admin leads

PHASE 1: FONDATIONS (J3-J5 - 3 jours)
    ├─> J3: Multi-tenant + UI Components
    ├─> J4: Database 35 tables
    └─> J5: Système paramétrage

PHASE 2: CORE VTC (J6-J10 - 5 jours)
    ├─> J6: Repository Pattern
    ├─> J7-J8: Véhicules + Drivers CRUD
    ├─> J9: Assignments
    └─> J10: Import revenus

PHASE 3: FINANCES (J11-J15 - 5 jours)
    ├─> J11-J12: Calcul balances
    ├─> J13-J14: Paiements
    └─> J15: Réconciliation

PHASE 4: AVANCÉ (J16-J22 - 7 jours)
    └─> Maintenance + Scoring + Analytics

PHASE 5: PRODUCTION (J23-J30 - 8 jours)
    └─> Tests + Docs + Déploiement
```

---

## PHASE 0: DÉBLOCAGE CRITIQUE

**Objectif:** Build compile + Module lead management fonctionnel  
**Durée:** 2h  
**Bloqueur Actuel:** Build cassé = RIEN ne peut avancer

### Tâche 1: Corriger APIs Lead Management (1h)

#### A. Créer fichier manquant (15 min)

**Action Claude Code:**

```
ULTRATHINK

Créer /app/api/demo-leads/[id]/route.ts

Implémentation:
- GET: récupérer lead avec activités (include sys_demo_lead_activity)
- PUT: update lead
- DELETE: delete lead

Syntaxe Next.js 15:
- params DOIT être Promise<{ id: string }>
- Utiliser await params
- Utiliser await auth()

Validation:
- Vérifier types TypeScript
- Tester compilation
```

**Checkpoint Validation:**

```bash
# Vérifier fichier créé
ls -la app/api/demo-leads/[id]/route.ts

# Doit exister et contenir GET, PUT, DELETE
```

#### B. Corriger activity route (30 min)

**Action Claude Code:**

```
ULTRATHINK

Corriger /app/api/demo-leads/[id]/activity/route.ts

Problèmes à corriger:
1. params non async (Next.js 15 requirement)
2. auth() pas await
3. Transaction atomique:
   - Créer activity
   - Si outcome = "qualified" → MAJ lead.status + qualified_date
   - Si outcome = "accepted/refused" → MAJ lead.status

Syntaxe correcte:
- { params }: { params: Promise<{ id: string }> }
- const { id } = await params
- const { userId } = await auth()
- db.$transaction(async (tx) => { ... })

Validation:
- Compiler sans erreur
- Types corrects
```

**Checkpoint Validation:**

```bash
# Vérifier syntaxe
cat app/api/demo-leads/[id]/activity/route.ts | grep "await params"
cat app/api/demo-leads/[id]/activity/route.ts | grep "await auth()"

# Doit afficher les lignes correctes
```

#### C. Corriger accept route (30 min)

**Action Claude Code:**

```
ULTRATHINK

Corriger /app/api/demo-leads/[id]/accept/route.ts

Problèmes à corriger:
1. clerkClient syntaxe incorrecte (Clerk v6)
2. Syntaxe async/await

Syntaxe correcte Clerk v6:
- const clerk = await clerkClient()
- const org = await clerk.organizations.create({ ... })
- await clerk.organizations.createInvitation({ ... })

Flow:
1. Récupérer lead (status doit être "accepted")
2. Créer org Clerk avec slug
3. Créer dans table organization
4. Inviter lead par email
5. Logger conversion dans sys_demo_lead_activity

Validation:
- Compiler sans erreur
- Gérer erreurs try/catch
```

**Checkpoint Validation:**

```bash
# Vérifier syntaxe Clerk
cat app/api/demo-leads/[id]/accept/route.ts | grep "await clerkClient()"

# Doit afficher: const clerk = await clerkClient()
```

#### D. Validation Build (15 min)

**Checkpoint Validation:**

```bash
# Build complet
pnpm build

# DOIT AFFICHER:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages

# Si erreur, identifier et corriger avant de continuer
```

**Critères Succès Tâche 1:**

- [ ] 3 fichiers API corrigés/créés
- [ ] `pnpm build` passe sans erreur
- [ ] Aucune erreur TypeScript
- [ ] Syntaxes Next.js 15 + Clerk v6 correctes

---

### Tâche 2: Page Admin Leads (45 min)

**Action Claude Code:**

```
ULTRATHINK

Créer /app/(dashboard)/admin/leads/page.tsx

Structure:
- Client component (use client)
- Fetch GET /api/demo-leads
- Tableau avec colonnes: Name, Company, Status, Country, Actions
- Status avec badges colorés (pending=gray, contacted=yellow, qualified=blue, accepted=green)
- Lien "View" vers /admin/leads/[id]

Design:
- Utiliser Tailwind classes basiques
- Pas de Shadcn/ui pour l'instant (sera fait J3)
- Simple et fonctionnel

Validation:
- Page accessible
- Données affichées
- Responsive basique
```

**Checkpoint Validation:**

```bash
# Démarrer dev
pnpm dev

# Ouvrir navigateur
# http://localhost:3000/admin/leads

# DOIT AFFICHER:
# - Titre "Lead Management"
# - Tableau avec leads
# - Statuts colorés
# - Liens fonctionnels

# Test données:
# - Au moins 1 lead visible (créé via request-demo)
```

**Critères Succès Tâche 2:**

- [ ] Page accessible à /admin/leads
- [ ] Affiche liste leads
- [ ] Tableau avec 5 colonnes
- [ ] Badges status fonctionnels
- [ ] Liens vers détail

---

### Checkpoint Final Phase 0

**Validation Globale:**

```bash
# 1. Build
pnpm build
# ✅ Succès obligatoire

# 2. Dev
pnpm dev
# ✅ Démarre sans erreur

# 3. Tests API (via curl ou Postman)
curl http://localhost:3000/api/demo-leads
# ✅ Retourne JSON avec leads

curl http://localhost:3000/api/demo-leads/[test-id]
# ✅ Retourne lead avec activités

# 4. Page admin
# Naviguer /admin/leads
# ✅ Affiche tableau

# 5. Commit
git add .
git commit -m "fix: API routes Next.js 15 syntax + admin leads page"
git push
```

**Critères GO/NO-GO Phase 1:**

- [ ] Build compile
- [ ] 4 APIs testables
- [ ] Page admin accessible
- [ ] 1 lead créé en test
- [ ] Git clean

**Si Phase 0 échoue:** STOP. Identifier bloqueurs avant continuer.

---

## PHASE 1: FONDATIONS

**Durée:** 3 jours (J3-J5)  
**Objectif:** Infrastructure + UI + Database + Paramètres  
**Prérequis:** Phase 0 OK

---

### JOUR 3: Multi-tenant + UI Components

**Durée:** 8h  
**Priorité:** CRITIQUE

#### Matin (4h) - Multi-tenant Complet

##### 3.1 Configuration Clerk Organizations (2h)

**Tâche Manuel (pas Claude Code):**

```
1. Ouvrir https://dashboard.clerk.com
2. Projet FleetCore > Organization Settings
3. Activer Organizations (toggle)
4. Définir rôles:
   - org:admin
   - org:manager
   - org:commercial
   - org:accountant
   - org:viewer
5. Configurer permissions par rôle
6. Sauvegarder
```

**Checkpoint Validation:**

```bash
# Vérifier dans Clerk Dashboard
# Organizations > Settings
# ✅ Toggle "Organizations" = ON
# ✅ 5 rôles configurés
```

**Temps:** 30 min manuel

##### 3.2 Register - Création Org (1h)

**Action Claude Code:**

```
ULTRATHINK

Modifier /app/(auth)/register/page.tsx

Ajouts:
1. Champ "Company Name" (requis)
2. Checkbox "Accept Terms & Conditions" (requis)
3. Dans handleSubmit:
   - Créer user avec signUp.create
   - Créer organization avec user.createOrganization
   - Rediriger /verify-email

Validation:
- Formulaire compile
- Tous champs requis
- Gestion erreurs
```

**Checkpoint Validation:**

```bash
# Tester registration flow
pnpm dev
# Naviguer /register
# Remplir formulaire avec company name
# Soumettre

# ✅ User créé dans Clerk
# ✅ Organization créée
# ✅ Redirection email verification
```

##### 3.3 Header Org Switcher (30 min)

**Action Claude Code:**

```
ULTRATHINK

Créer /app/(dashboard)/_components/org-switcher.tsx

Utiliser:
- OrganizationSwitcher de @clerk/nextjs
- hidePersonal={true}
- afterSelectOrganizationUrl="/dashboard"
- Afficher nom org actuelle

Validation:
- Composant compile
- Switcher fonctionnel
```

**Checkpoint Validation:**

```bash
# Démarrer dev
pnpm dev

# Se connecter avec user ayant plusieurs orgs
# ✅ Switcher visible dans header
# ✅ Changement org fonctionne
# ✅ Redirection /dashboard
```

##### 3.4 Tests Multi-tenant (1h)

**Tâche Manuel + Validation:**

```
Test 1: Créer 2 organizations manuellement

1. Clerk Dashboard > Organizations > Create
   - Name: Test Fleet Dubai
   - Metadata: country_code=AE

2. Créer 2ème org:
   - Name: Test Fleet Paris
   - Metadata: country_code=FR

3. Créer 1 user par org (via Dashboard)
```

**Checkpoint Validation:**

```bash
# Vérifier dans Supabase
# Ouvrir SQL Editor

SELECT * FROM organization;
# ✅ Doit montrer 4+ organizations

SELECT * FROM member WHERE tenant_id = '[id_dubai]';
SELECT * FROM member WHERE tenant_id = '[id_paris]';
# ✅ Isolation visible

# Test JWT
# Se connecter avec user Dubai
# DevTools > Application > Session Storage > __clerk_db_jwt
# Copier token, decoder sur jwt.io
# ✅ org_id présent
# ✅ org_slug présent
# ✅ org_role présent
```

**Critères Succès Matin J3:**

- [ ] Clerk Organizations activé
- [ ] Register crée organization
- [ ] Org switcher dans header
- [ ] 2 orgs test créées
- [ ] Isolation données vérifiée
- [ ] JWT contient org_id

---

#### Après-midi (4h) - UI Components

##### 3.5 Installation Shadcn/ui (1h)

**Action Claude Code:**

```
ULTRATHINK

Tâche: Installation complète Shadcn/ui

Étapes:
1. Initialiser shadcn/ui
2. Installer composants liste:
   - button, card, table, dialog, select
   - badge, dropdown-menu, separator
   - toast, form, input, label

3. Installer dépendances charts:
   - recharts
   - date-fns

Plan:
- Exécuter commandes npx shadcn-ui
- Vérifier components/ui/ créé
- Tester import d'un composant

Validation:
- Tous composants installés
- Aucune erreur import
```

**Checkpoint Validation:**

```bash
# Vérifier installation
ls -la components/ui/

# DOIT AFFICHER:
# button.tsx
# card.tsx
# table.tsx
# dialog.tsx
# select.tsx
# badge.tsx
# dropdown-menu.tsx
# separator.tsx
# toast.tsx
# form.tsx
# input.tsx
# label.tsx

# Vérifier imports
pnpm build
# ✅ Aucune erreur
```

##### 3.6 Layout Principal (2h)

**Action Claude Code:**

```
ULTRATHINK

Créer structure layout dashboard:

Fichiers à créer:
1. /app/(dashboard)/layout.tsx - Layout principal
2. /app/(dashboard)/_components/sidebar.tsx - Navigation collapsible
3. /app/(dashboard)/_components/header.tsx - Header avec org switcher
4. /app/(dashboard)/_components/breadcrumbs.tsx - Breadcrumbs auto

Sidebar navigation items:
- Dashboard (/dashboard)
- Vehicles (/fleet/vehicles)
- Drivers (/drivers)
- Revenues (/revenues)
- Reports (/reports)
- Settings (/settings)

Features:
- Sidebar collapsible (toggle bouton)
- Active state sur route actuelle
- Responsive mobile (menu burger)
- Icons lucide-react

Validation:
- Layout fonctionnel
- Navigation cliquable
- Collapse fonctionne
```

**Checkpoint Validation:**

```bash
# Démarrer dev
pnpm dev

# Naviguer /dashboard
# ✅ Sidebar visible
# ✅ Header visible
# ✅ Org switcher présent

# Tester navigation
# Cliquer "Vehicles"
# ✅ Redirection /fleet/vehicles
# ✅ Active state visible

# Tester collapse
# Cliquer bouton menu
# ✅ Sidebar se réduit
# ✅ Icons seuls visibles

# Tester mobile
# DevTools > Responsive 375px
# ✅ Menu burger visible
# ✅ Sidebar en overlay
```

##### 3.7 Dashboard Placeholder (1h)

**Action Claude Code:**

```
ULTRATHINK

Créer /app/(dashboard)/page.tsx

Contenu:
1. Grid 4 metric cards:
   - Total Vehicles: 180
   - Active Drivers: 165
   - Revenue Today: AED 25,430
   - Fleet Utilization: 87.3%

2. Grid 2 charts (placeholders):
   - Revenue Trend (7 days)
   - Fleet Utilization

Design:
- Utiliser Card de shadcn/ui
- Icons lucide-react
- Grid responsive (1/2/4 colonnes)
- Charts = div placeholder

Validation:
- Dashboard affiche metrics
- Responsive OK
```

**Checkpoint Validation:**

```bash
# Naviguer /dashboard
# ✅ 4 metric cards visibles
# ✅ 2 chart placeholders
# ✅ Responsive 3 breakpoints

# Mobile 375px
# ✅ 1 colonne

# Tablet 768px
# ✅ 2 colonnes

# Desktop 1024px+
# ✅ 4 colonnes
```

**Critères Succès Après-midi J3:**

- [ ] Shadcn/ui installé (12 composants)
- [ ] Layout navigable
- [ ] Sidebar collapsible
- [ ] Header avec org switcher
- [ ] Dashboard avec 4 metrics
- [ ] Responsive validé

---

### Checkpoint Final Jour 3

**Validation Globale:**

```bash
# 1. Build
pnpm build
# ✅ Succès

# 2. Multi-tenant
# Se connecter avec 2 users différents
# ✅ Données isolées par org

# 3. Navigation
# Tester tous liens sidebar
# ✅ Tous fonctionnels

# 4. Responsive
# Tester 3 breakpoints
# ✅ Tout adapté

# 5. Commit
git add .
git commit -m "feat: multi-tenant complete + UI layout + dashboard"
git push
```

**Critères GO/NO-GO Jour 4:**

- [ ] Multi-tenant validé
- [ ] 2 orgs test créées
- [ ] JWT contient org_id
- [ ] UI navigable
- [ ] Build compile

---

### JOUR 4: Database Schema Complet

**Durée:** 8h  
**Priorité:** CRITIQUE

#### Matin (4h) - Prisma Schema

##### 4.1 Import Schema 35 Tables (3h)

**Action Claude Code:**

```
ULTRATHINK

Tâche: Ajouter 31 tables manquantes au schema Prisma

Source: FLEETCORE_VTC_SPECIFICATION_V2_COMPLETE.md Section 3

Tables déjà existantes (4):
- organization
- member
- sys_demo_lead
- sys_demo_lead_activity

Tables à créer (31):

PARAMÉTRAGE (3):
- system_parameters
- parameter_audit
- sequences

SYSTÈME (5):
- documents
- notifications
- audit_logs
- custom_fields
- custom_field_values

FLEET (10):
- vehicles
- vehicle_assignments
- vehicle_maintenance
- vehicle_inspections
- vehicle_insurance
- vehicle_expenses
- vehicle_documents
- vehicle_fines
- vehicle_fuel_logs
- vehicle_incidents

DRIVERS (6):
- drivers
- driver_platforms
- driver_documents
- driver_performance_metrics
- driver_scores
- driver_training_records

VTC (7):
- employers
- platform_configurations
- revenue_imports
- platform_revenues
- driver_deductions
- driver_balances
- driver_payments

Process:
1. Copier chaque table depuis spec
2. Adapter syntaxe Prisma
3. Définir relations @@relation
4. Ajouter @@index pour performance
5. Utiliser @@map pour noms tables

Validation:
- 35 models au total
- Toutes relations définies
- Types corrects
```

**Checkpoint Validation:**

```bash
# Valider schema
npx prisma validate

# DOIT AFFICHER:
# ✅ The schema.prisma file is valid

# Formater
npx prisma format

# Générer types
npx prisma generate

# DOIT AFFICHER:
# ✅ Generated Prisma Client
# ✅ 35 models
```

##### 4.2 Validation Schema (1h)

**Checkpoint Validation:**

```bash
# Compter models
cat prisma/schema.prisma | grep "^model " | wc -l
# DOIT AFFICHER: 35

# Vérifier relations vehicles
cat prisma/schema.prisma | grep -A 50 "model vehicles"
# ✅ Doit montrer relations: organization, vehicle_assignments, etc.

# Test compilation
pnpm build
# ✅ Aucune erreur types Prisma
```

---

#### Après-midi (4h) - Migration & Seed

##### 4.3 Créer Migration (1h)

**Action Claude Code:**

```
ULTRATHINK

Tâche: Créer migration database

Commande:
npx prisma migrate dev --name add_vtc_complete_schema

Validation:
- Migration créée dans prisma/migrations/
- migration.sql généré
- Appliquée à database
```

**Checkpoint Validation:**

```bash
# Vérifier migration créée
ls -la prisma/migrations/

# DOIT AFFICHER:
# [timestamp]_add_vtc_complete_schema/

# Vérifier dans Supabase
# Database > Tables
# DOIT AFFICHER: 35 tables

# Tester une table
# Table Editor > vehicles
# ✅ Colonnes visibles
# ✅ Relations définies
```

##### 4.4 Seed Data (2h30)

**Action Claude Code:**

```
ULTRATHINK

Créer /prisma/seed.ts

Données à insérer:

1. Tenant (1):
   - Demo VTC Fleet (country: AE)

2. Users (5):
   - admin@demo.com (role: org:admin)
   - manager@demo.com (role: org:manager)
   - commercial@demo.com (role: org:commercial)
   - accountant@demo.com (role: org:accountant)
   - viewer@demo.com (role: org:viewer)

3. System Parameters (10+):
   - UAE: license_plate_format, commission_rate_owned_vehicle, etc.
   - France: idem

4. Vehicles (10):
   - Mix: Toyota, Honda, Tesla
   - Status: available, assigned, maintenance
   - Ownership: owned, leased, driver_owned

5. Drivers (5):
   - Employment: employee + freelance
   - Status: active
   - Country: AE

6. Platform Configurations (3):
   - Uber, Careem, Bolt
   - Tous actifs

Process:
- Utiliser upsert pour idempotence
- Relations correctes
- Console.log progression

Validation:
- Script exécutable
- Données cohérentes
```

**Checkpoint Validation:**

```bash
# Exécuter seed
npx prisma db seed

# DOIT AFFICHER:
# 🌱 Seeding database...
# ✅ Tenant created
# ✅ Users created (5)
# ✅ Parameters created (10+)
# ✅ Vehicles created (10)
# ✅ Drivers created (5)
# ✅ Platforms created (3)
# 🎉 Seeding complete!

# Vérifier dans Prisma Studio
npx prisma studio

# Naviguer chaque table:
# organization: ✅ 1 demo tenant
# member: ✅ 5 users
# system_parameters: ✅ 10+ params
# vehicles: ✅ 10 vehicles
# drivers: ✅ 5 drivers
# platform_configurations: ✅ 3 platforms

# Test relations
# Cliquer vehicle > organization
# ✅ Relation fonctionne
```

##### 4.5 Validation Finale (30 min)

**Checkpoint Validation:**

```bash
# Test SQL queries
# Supabase > SQL Editor

SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';
# ✅ Doit retourner >= 35

SELECT * FROM vehicles LIMIT 5;
# ✅ Doit montrer 5 vehicles

SELECT v.*, o.name as org_name
FROM vehicles v
JOIN organization o ON v.tenant_id = o.id;
# ✅ Join fonctionne

# Test Prisma queries
# Créer script test:
# const vehicles = await db.vehicles.findMany({ include: { organization: true }});
# ✅ Doit retourner avec relation
```

---

### Checkpoint Final Jour 4

**Validation Globale:**

```bash
# 1. Schema
npx prisma validate
# ✅ Valid

# 2. Migration
ls prisma/migrations/
# ✅ Migration existe

# 3. Seed
npx prisma db seed
# ✅ Données chargées

# 4. Studio
npx prisma studio
# ✅ 35 tables visibles
# ✅ Données présentes

# 5. Build
pnpm build
# ✅ Aucune erreur

# 6. Commit
git add .
git commit -m "feat: 35 VTC tables schema + migration + seed"
git push
```

**Critères GO/NO-GO Jour 5:**

- [ ] 35 tables créées
- [ ] Migration appliquée
- [ ] Seed data OK
- [ ] Relations fonctionnent
- [ ] Build compile

---

### JOUR 5: Système Paramétrage

**Durée:** 8h  
**Priorité:** CRITIQUE (tout dépend de ça)

#### Matin (4h) - Service Backend

##### 5.1 ParameterService (2h30)

**Action Claude Code:**

```
ULTRATHINK

Créer /lib/services/parameter.service.ts

Classe: ParameterService

Méthodes principales:
1. getParameter(key, context)
   - Hiérarchie: tenant+country > tenant > global+country > global
   - Parser valeur selon data_type
   - Throw error si not found

2. setParameter(key, value, context)
   - Valider format (si validation_rule existe)
   - Upsert dans system_parameters
   - Créer audit dans parameter_audit

3. validateFormat(value, rule)
   - Regex si rule commence par /
   - Range si rule contient -
   - Enum si rule contient ,

Exports:
- Export singleton: export const parameterService = new ParameterService()

Validation:
- Types TypeScript corrects
- Compile sans erreur
- Toutes méthodes implémentées
```

**Checkpoint Validation:**

```bash
# Vérifier fichier
cat lib/services/parameter.service.ts | grep "class ParameterService"
# ✅ Classe définie

cat lib/services/parameter.service.ts | grep "async getParameter"
# ✅ Méthode existe

cat lib/services/parameter.service.ts | grep "async setParameter"
# ✅ Méthode existe

# Test compilation
pnpm build
# ✅ Aucune erreur
```

##### 5.2 Init Parameters Script (1h30)

**Action Claude Code:**

```
ULTRATHINK

Créer /scripts/init-parameters.ts

Paramètres à insérer:

UAE (8 params):
- license_plate_format: /^[A-Z]{1,3}[0-9]{1,5}$/
- driver_license_format: /^[0-9]{12}$/
- commission_rate_owned_vehicle: 0.20
- commission_rate_driver_vehicle: 0.15
- currency: AED
- tax_rate: 0
- daily_rental_rate_sedan: 150
- daily_rental_rate_suv: 200

France (5 params):
- license_plate_format: /^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/
- commission_rate_owned_vehicle: 0.25
- commission_rate_driver_vehicle: 0.18
- currency: EUR
- tax_rate: 0.20

Process:
- Upsert chaque paramètre
- Console.log progression

Validation:
- Script exécutable
- Idempotent (re-exécutable)
```

**Checkpoint Validation:**

```bash
# Exécuter script
npx tsx scripts/init-parameters.ts

# DOIT AFFICHER:
# Initializing parameters...
# ✅ 13 parameters initialized

# Vérifier en DB
npx prisma studio
# Table system_parameters
# ✅ 13+ lignes
# ✅ Colonnes: tenant_id (null), key, value, data_type, module, country_code

# Test query
# Supabase SQL Editor
SELECT * FROM system_parameters WHERE country_code = 'AE';
# ✅ 8 params UAE

SELECT * FROM system_parameters WHERE country_code = 'FR';
# ✅ 5 params France
```

---

#### Après-midi (4h) - API + UI

##### 5.3 API Parameters (1h30)

**Action Claude Code:**

```
ULTRATHINK

Créer APIs parameters:

1. /app/api/v1/parameters/route.ts
   - GET: liste tous (filter par module, country_code)
   - POST: valider format (validateFormat)

2. /app/api/v1/parameters/[key]/route.ts
   - GET: détail param (via service avec hiérarchie)
   - PUT: modifier param (via setParameter)

Features:
- Auth Clerk (userId requis)
- Error handling
- Types corrects Next.js 15

Validation:
- 2 fichiers API
- Compile sans erreur
```

**Checkpoint Validation:**

```bash
# Tester API GET list
pnpm dev
curl http://localhost:3000/api/v1/parameters
# ✅ Retourne JSON array de params

# Tester API GET detail
curl http://localhost:3000/api/v1/parameters/commission_rate_owned_vehicle?module=vtc&country_code=AE
# ✅ Retourne { key: "...", value: 0.20 }

# Tester API PUT (avec auth header Clerk)
# ✅ Modification sauvegardée

# Tester validation
curl -X POST http://localhost:3000/api/v1/parameters/validate \
  -d '{"value":"ABC123","rule":"/^[A-Z]{1,3}[0-9]{1,5}$/"}' \
  -H "Content-Type: application/json"
# ✅ Retourne { valid: true }
```

##### 5.4 UI Parameters Page (2h)

**Action Claude Code:**

```
ULTRATHINK

Créer /app/(dashboard)/settings/parameters/page.tsx

Layout:
1. Titre + description
2. Cards groupées par module (fleet, vtc, core, billing)
3. Chaque param = ligne avec:
   - Label + description
   - Badge country_code
   - Badge "Read-only" si !is_editable
   - Valeur affichée
   - Bouton edit (si editable)

4. Mode édition:
   - Input inline
   - Boutons Check/X
   - Validation temps réel

Design:
- Utiliser Card shadcn/ui
- Badge pour status
- Input pour edit
- Grid responsive

Validation:
- Page accessible /settings/parameters
- Affiche params groupés
- Édition fonctionne
```

**Checkpoint Validation:**

```bash
# Naviguer page
pnpm dev
# http://localhost:3000/settings/parameters

# ✅ Titre visible
# ✅ Cards par module (4 cards: fleet, vtc, core, billing)
# ✅ Params listés

# Test édition
# Cliquer edit sur "commission_rate_owned_vehicle"
# ✅ Input apparaît
# Changer valeur 0.20 → 0.22
# Cliquer Check
# ✅ Sauvegardé

# Vérifier DB
npx prisma studio
# Table system_parameters
# ✅ Valeur modifiée à 0.22
```

##### 5.5 Tests Zéro Hardcoding (30 min)

**Tests Manuels:**

**Test 1: Commission modifiable**

```bash
# 1. Aller /settings/parameters
# 2. Module VTC > commission_rate_owned_vehicle
# 3. Modifier 0.20 → 0.25
# 4. Sauvegarder

# Validation:
# Dans le code, aucune ligne ne doit contenir "0.20" hardcodé
# Recherche:
grep -r "0.20" lib/services/ --include="*.ts"
# ✅ Aucun résultat (ou uniquement dans parameter.service comme exemple)

# Toute utilisation DOIT passer par:
# const rate = await parameterService.getParameter('commission_rate_owned_vehicle', context)
```

**Test 2: Format plaque modifiable**

```bash
# 1. Aller /settings/parameters
# 2. Module Fleet > license_plate_format
# 3. Noter le regex actuel
# 4. Créer un véhicule (plus tard en J7)
# 5. La validation DOIT utiliser ce regex

# Validation code:
grep -r "A-Z.*0-9" lib/services/ --include="*.ts"
# ✅ Aucun regex hardcodé
# Toute validation DOIT passer par parameterService
```

**Test 3: Override tenant**

```bash
# Dans Prisma Studio ou SQL Editor
# Créer un param tenant-specific:

INSERT INTO system_parameters (
  tenant_id, key, value, data_type, module, country_code, scope
) VALUES (
  '[tenant_id]',
  'commission_rate_owned_vehicle',
  '0.18',
  'decimal',
  'vtc',
  'AE',
  'tenant'
);

# Test:
# Récupérer param pour ce tenant → doit retourner 0.18
# Récupérer param pour autre tenant → doit retourner 0.20 (global)
```

**Checkpoint Validation:**

```bash
# Recherche hardcoding
grep -r "0\\.2[0-9]" lib/ app/ --include="*.ts" --include="*.tsx" | grep -v parameter
# ✅ Aucun résultat (sauf dans parameter service)

grep -r "\\/\\^\\[A-Z\\]" lib/ app/ --include="*.ts" | grep -v parameter
# ✅ Aucun résultat

# Test hiérarchie
# Créer param tenant > global
# Appeler getParameter
# ✅ Retourne valeur tenant (pas global)
```

---

### Checkpoint Final Jour 5

**Validation Globale:**

```bash
# 1. Service
cat lib/services/parameter.service.ts | wc -l
# ✅ > 100 lignes (service complet)

# 2. Script init
npx tsx scripts/init-parameters.ts
# ✅ 13 params

# 3. API
curl http://localhost:3000/api/v1/parameters
# ✅ Retourne params

# 4. UI
# Naviguer /settings/parameters
# ✅ Page fonctionne
# ✅ Édition fonctionne

# 5. Tests
# Grep hardcoding
# ✅ Aucun trouvé

# 6. Build
pnpm build
# ✅ Succès

# 7. Commit
git add .
git commit -m "feat: parameter system with zero hardcoding"
git push
```

**Critères GO/NO-GO Phase 2:**

- [ ] ParameterService opérationnel
- [ ] 13+ params insérés
- [ ] API testable
- [ ] UI fonctionnelle
- [ ] Zéro hardcoding vérifié
- [ ] Build compile

---

### Checkpoint Final Phase 1

**Validation Globale Phase 1 (J3-J5):**

```bash
# Checklist complète

## Infrastructure
- [ ] Multi-tenant Clerk activé
- [ ] 2+ orgs test créées
- [ ] JWT avec org_id validé
- [ ] Isolation données prouvée

## UI
- [ ] Shadcn/ui installé (12 composants)
- [ ] Layout navigable (sidebar + header)
- [ ] Dashboard avec metrics
- [ ] Org switcher fonctionnel
- [ ] Responsive 3 breakpoints OK

## Database
- [ ] 35 tables créées et migrées
- [ ] Seed data chargé (1 tenant, 5 users, 10 vehicles, 5 drivers)
- [ ] Relations testées
- [ ] Prisma Studio accessible

## Paramètres
- [ ] ParameterService opérationnel
- [ ] 13+ params UAE + France
- [ ] API GET/PUT testables
- [ ] UI admin accessible
- [ ] Zéro hardcoding vérifié

## Build & Git
- [ ] pnpm build succès
- [ ] Aucune erreur TypeScript
- [ ] Git clean (3 commits J3, J4, J5)

# Commande finale
pnpm build && echo "✅ PHASE 1 COMPLETE"
```

**Si Phase 1 réussie:** Passer Phase 2  
**Si Phase 1 échoue:** Identifier bloqueurs critiques, ne pas continuer

---

## PHASE 2: CORE VTC (J6-J10)

**Durée:** 5 jours  
**Objectif:** Véhicules + Drivers + Assignments + Import Revenus  
**Prérequis:** Phase 1 OK

### Résumé Phase 2

**Jour 6: Repository Pattern**

- BaseRepository class
- Core repositories (Tenant, User, Document, Audit)
- Event Bus

**Jour 7: Module Véhicules**

- VehicleRepository + VehicleService
- API CRUD véhicules
- UI liste + formulaire + détail
- Validation format plaque via paramètres

**Jour 8: Module Drivers**

- DriverRepository + DriverService
- API CRUD drivers
- UI liste + formulaire + détail
- Link platforms (Uber, Careem, Bolt)

**Jour 9: Assignments**

- AssignmentService
- API assign vehicle → driver
- UI gestion assignments
- Règles: 1 driver = 1 vehicle actif max

**Jour 10: Import Revenus**

- PlatformImportService
- API import CSV/JSON
- Parser Uber/Careem/Bolt
- Stockage platform_revenues

### Checkpoints Phase 2

**Fin J10:**

- [ ] CRUD complets (vehicles, drivers)
- [ ] Assignments fonctionnels
- [ ] Import revenu testé avec CSV sample
- [ ] UI complètes et responsives
- [ ] Build compile

---

## PHASE 3: FINANCES (J11-J15)

**Durée:** 5 jours  
**Objectif:** Calcul balances + Paiements + Réconciliation  
**Prérequis:** Phase 2 OK

### Résumé Phase 3

**Jour 11: Calcul Balances**

- BalanceCalculationService
- Formule: net = revenue - commission - deductions
- Générer driver_balances hebdomadaire

**Jour 12: Déductions**

- Rental vehicles (daily_rate × jours)
- Fines
- Fuel advances
- API + UI déductions

**Jour 13: Paiements**

- PaymentService
- Générer driver_payments
- Statuts: pending → paid
- Export batch paiement

**Jour 14: Réconciliation**

- ReconciliationService
- Comparer revenus déclarés vs calculés
- Flags discrepancies
- UI tableau réconciliation

**Jour 15: Tests Finance**

- Tests E2E flow complet
- Scénarios: owned vehicle, driver vehicle
- Validation calculs

### Checkpoints Phase 3

**Fin J15:**

- [ ] Calcul balance automatique
- [ ] Déductions intégrées
- [ ] Paiements générables
- [ ] Réconciliation fonctionnelle
- [ ] Tests scenarios passés

---

## PHASE 4: AVANCÉ (J16-J22)

**Objectif:** Maintenance + Scoring + Analytics  
**Prérequis:** Phase 3 OK

### Résumé Phase 4

**J16-J17: Maintenance Véhicules**

- Preventive maintenance (PM classes A/B/C/D)
- Vehicle inspections (DVIRs)
- Alerts maintenance due

**J18-J19: Driver Scoring**

- Performance metrics
- Scoring system (safety, efficiency, compliance, service)
- Leaderboard + gamification

**J20-J21: Analytics**

- Dashboard KPIs
- Charts temps réel (Recharts)
- Reports PDF

**J22: Notifications**

- Email (Resend)
- Push notifications
- WhatsApp (optionnel)

---

## PHASE 5: PRODUCTION (J23-J30)

**Objectif:** Tests + Docs + Déploiement  
**Prérequis:** Phase 4 OK

### Résumé Phase 5

**J23-J25: Tests**

- Tests unitaires (Jest)
- Tests E2E (Playwright)
- Coverage > 70%

**J26: Security Audit**

- Auth flow
- RLS Supabase
- API protection
- Scan vulnérabilités

**J27: Documentation**

- README complet
- API docs
- User manual
- Admin guide

**J28: Staging**

- Deploy staging Vercel
- Tests production-like
- Performance audit

**J29: Formation**

- Training admin
- Training users
- Support docs

**J30: Go-Live**

- Deploy production
- Monitoring actif
- Support ready

---

## CRITÈRES DE VALIDATION GLOBAUX

### Build & Qualité

**Quotidien:**

```bash
pnpm build      # ✅ Doit passer
pnpm lint       # ✅ Aucune erreur
git status      # ✅ Clean
```

**Hebdomadaire:**

```bash
# Fin semaine 1 (J5)
- Phase 1 complète
- Demo multi-tenant
- Zéro hardcoding vérifié

# Fin semaine 2 (J10)
- CRUD fonctionnels
- Import revenus OK

# Fin semaine 3 (J15)
- Finance opérationnel
- Tests scenarios passés
```

### Performance

**Targets:**

- Page load < 2s
- API response < 500ms
- Build time < 3 min
- Lighthouse score > 90

### Security

**Checklist:**

- [ ] RLS Supabase activé toutes tables
- [ ] Auth middleware toutes routes
- [ ] Input validation partout
- [ ] CORS configuré
- [ ] Rate limiting APIs

---

## MATRICE DÉPENDANCES

```
J0 (Déblocage)
├─> J3 (Multi-tenant) ──┐
├─> J4 (Database 35) ───┤
└─> J5 (Paramètres) ────┴─> J6 (Repositories)
                             ├─> J7 (Vehicles)
                             ├─> J8 (Drivers)
                             └─> J9 (Assignments)
                                 └─> J10 (Import)
                                     └─> J11-J15 (Finance)
                                         └─> J16-J22 (Avancé)
                                             └─> J23-J30 (Prod)
```

**Règles Strictes:**

- ❌ Impossible J8 sans J5 (paramètres requis)
- ❌ Impossible J10 sans J9 (assignments requis)
- ❌ Impossible J11 sans J10 (revenus requis)
- ✅ Possible J17 parallèle J16 (si même module)

---

## PROCESSUS TRAVAIL

### Workflow Standard

**Pour chaque tâche:**

1. **Prompt Claude Code** (format ULTRATHINK)

```
ULTRATHINK

Contexte: [situation actuelle]
Objectif: [ce qu'on veut]
Contraintes: [règles à respecter]

Plan:
1. [étape 1]
2. [étape 2]
3. [étape 3]

Validation:
- [critère 1]
- [critère 2]
```

2. **Claude Code exécute**

3. **Validation (nous)**

```bash
# Checkpoints définis dans ce plan
# Exemples:
pnpm build          # Compilation
ls -la [fichier]    # Fichier créé
curl [endpoint]     # API fonctionne
npx prisma studio   # Données présentes
```

4. **Si OK:** Passer tâche suivante  
   **Si KO:** Corriger avant continuer

5. **Git commit** (fin de tâche significative)

### Format Prompts Claude Code

**Structure recommandée:**

```
ULTRATHINK

[Description tâche claire]

Fichiers à [créer/modifier]:
- [liste fichiers]

Implémentation:
- [point 1]
- [point 2]

Validation:
- [critère succès]
```

---

## STATUT DOCUMENT

**Version:** 2.0 - Plan Orchestration  
**Statut:** PRÊT POUR EXÉCUTION  
**Prochaine Action:** Phase 0 - Déblocage Critique (2h)  
**Mise à jour:** Quotidienne avec progrès réels

---

**FIN DU PLAN**
