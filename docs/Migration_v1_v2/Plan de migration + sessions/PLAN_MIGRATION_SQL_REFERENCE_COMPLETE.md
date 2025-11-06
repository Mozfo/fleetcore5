# 📘 PLAN MIGRATION SQL V1→V2 - DOCUMENT DE RÉFÉRENCE COMPLET

**Date:** 3 Novembre 2025  
**Version:** 1.0 - DÉFINITIF  
**Durée totale estimée:** 8h36  
**Objectif:** Migrer FleetCore de V1 (56 tables) vers V2 (99 tables) via SQL pur additif

---

## 🎯 VUE D'ENSEMBLE

### Architecture en 3 Phases

```
PHASE 1: STRUCTURES (Sessions 0-12)
├─ 13 fichiers SQL progressifs
├─ 1 fichier = 1 module
├─ Contenu: Enums + Tables + FK internes + FK vers précédents
├─ Durée: 5h25 (13 × 25 min)
└─ Livrable: 13 fichiers SQL applicables

PHASE 2: AGRÉGATION (Session 14)
├─ Extraction FK futures documentées
├─ Extraction indexes documentés
├─ Durée: 1h20
└─ Livrable: 2 fichiers SQL (FK + indexes)

PHASE 3: VALIDATION (Session 15)
├─ Rapport complet migration
├─ Statistiques globales
├─ Durée: 25 min
└─ Livrable: RAPPORT_FINAL.md
```

**Total:** 15 sessions, 16 fichiers générés

---

## 📂 STRUCTURE FINALE

```
docs/Migration v1 -> v2/sql/
├── 01_shared_enums.sql              # Session 0  - Enums globaux (5 min)
├── 02_adm_structure.sql             # Session 1  - Administration (25 min)
├── 03_dir_structure.sql             # Session 2  - Référentiels (25 min)
├── 04_doc_structure.sql             # Session 3  - Documents (20 min)
├── 05_crm_structure.sql             # Session 4  - CRM (20 min)
├── 06_bil_structure.sql             # Session 5  - Billing (25 min)
├── 07_sup_structure.sql             # Session 6  - Support (20 min)
├── 08_rid_structure.sql             # Session 7  - Drivers (30 min)
├── 09_flt_structure.sql             # Session 8  - Fleet (30 min)
├── 10_sch_structure.sql             # Session 9  - Scheduling (30 min)
├── 11_trp_structure.sql             # Session 10 - Trips (25 min)
├── 12_rev_structure.sql             # Session 11 - Revenue (20 min)
├── 13_fin_structure.sql             # Session 12 - Finance (30 min)
├── 98_pending_fk.sql                # Session 14 - FK différées (80 min)
├── 99_pending_indexes.sql           # Session 14 - Indexes (inclus dans 80 min)
└── RAPPORT_FINAL.md                 # Session 15 - Validation (25 min)
```

---

## 📊 DONNÉES DE RÉFÉRENCE

### Chiffres Exacts V1→V2

| Métrique | V1 | V2 | Évolution |
|----------|----|----|-----------|
| **Tables totales** | 56 | 99 | +43 (+77%) |
| **Tables modifiées** | 55 | 55 | Enrichies |
| **Nouvelles tables** | 0 | 44 | Créées |
| **Tables supprimées** | 1 | 0 | rid_driver_languages |
| **Enums** | ~20 | ~120 | +100 |
| **FK totales** | ~120 | ~500 | +380 |
| **Indexes** | ~180 | ~450 | +270 |

### Ordre Strict des Modules

```
01. SHARED  → Base (5 enums globaux)
02. ADM     → Base (12 tables, ~18 FK internes)
03. DIR     → Base (12 tables, ~15 FK vers ADM)
04. DOC     → 4 tables, ~8 FK vers ADM
05. CRM     → 7 tables, ~12 FK vers ADM
06. BIL     → 9 tables, ~15 FK vers ADM
07. SUP     → 6 tables, ~10 FK vers ADM+RID
08. RID     → 7 tables, ~20 FK vers ADM+DOC
09. FLT     → 8 tables, ~30 FK vers ADM+DIR+RID
10. SCH     → 11 tables, ~25 FK vers ADM+RID+FLT+DIR
11. TRP     → 6 tables, ~20 FK vers ADM+DIR+RID+FLT+CRM
12. REV     → 4 tables, ~12 FK vers ADM+RID+TRP
13. FIN     → 11 tables, ~35 FK vers tous
```

**Règle absolue:** Ne jamais dévier de cet ordre.

---

## 🔄 PHASE 1: GÉNÉRATION STRUCTURES (Sessions 0-12)

### Template Session Standard

**Durée par session:** 20-35 minutes

**Breakdown:**
1. Génération SQL par Claude Code: 5-10 min
2. Validation manuelle utilisateur: 10-15 min
3. Application psql: 2-5 min
4. Tests post-application: 3-5 min

---

### SESSION N: Structure Complète

#### ÉTAPE 1: Préparation (2 min)

**Checklist GATE 1:**
- [ ] Module précédent validé et appliqué (ou Session 0 pour Session 1)
- [ ] Fichier .prisma disponible dans `/mnt/user-data/uploads/`
- [ ] RANKING_DEPENDENCIES_SQL.md consulté
- [ ] Liste modules précédents connue

**Commandes:**
```bash
# Vérifier état DB actuel
psql -d fleetcore -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Vérifier dernier fichier appliqué OK
psql -d fleetcore -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" | tail -20
```

**Si GATE 1 échoue → STOP, corriger avant continuer**

---

#### ÉTAPE 2: Génération SQL par Claude Code (5-10 min)

**Input pour Claude Code:**

```markdown
# SESSION [N]/13: Module [NOM]

## CONTEXTE

**Module cible:** [NOM] (exemple: ADM, DIR, CRM, etc.)
**Fichier Prisma V2:** `/chemin/vers/[nom].prisma`
**Fichier Prisma V1:** `prisma/schema.prisma` (actuel)
**Ranking:** `/chemin/vers/RANKING_DEPENDENCIES_SQL.md`

**Modules DÉJÀ CRÉÉS (tables disponibles):**
[Liste des modules créés dans sessions 0 à N-1]

Exemple Session 5 (BIL):
- SHARED: Enums globaux disponibles
- ADM: adm_tenants, adm_members, adm_roles, etc. (12 tables)
- DIR: dir_car_makes, dir_platforms, etc. (12 tables)
- DOC: doc_documents, doc_document_types, etc. (4 tables)
- CRM: crm_leads, crm_opportunities, etc. (7 tables)

---

## MISSION

Générer **1 fichier SQL complet** pour le module [NOM].

**Fichier de sortie:** `0N_[nom]_structure.sql`

---

## STRUCTURE OBLIGATOIRE DU FICHIER SQL

```sql
-- ============================================
-- FLEETCORE V2 MIGRATION - PHASE 1: STRUCTURES
-- Module: [NOM COMPLET]
-- Session: [N]/13
-- Date: [DATE]
-- ============================================
-- Tables modifiées (V1→V2): X
-- Nouvelles tables (V2): Y
-- Total tables module: X+Y
-- ============================================


-- ============================================
-- SECTION 1: ENUMS DU MODULE
-- ============================================

-- Enum 1: [nom_enum]
-- Utilisation: [description]
DO $$ BEGIN
  CREATE TYPE enum_name AS ENUM ('value1', 'value2', 'value3');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Répéter pour chaque enum du module
-- Note: Ne PAS recréer les enums de SHARED (déjà créés)


-- ============================================
-- SECTION 2: MODIFICATIONS TABLES EXISTANTES (V1→V2)
-- ============================================

-- Table: table_existante_v1
-- Colonnes ajoutées: X
-- Description: [brève description des ajouts]

ALTER TABLE table_existante_v1 
  ADD COLUMN IF NOT EXISTS nouvelle_colonne TEXT;

ALTER TABLE table_existante_v1 
  ADD COLUMN IF NOT EXISTS autre_colonne INTEGER NOT NULL DEFAULT 0;

ALTER TABLE table_existante_v1 
  ADD COLUMN IF NOT EXISTS reference_id UUID;  -- Colonne FK sans REFERENCES

ALTER TABLE table_existante_v1 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE table_existante_v1 
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Répéter pour chaque table V1 modifiée


-- ============================================
-- SECTION 3: NOUVELLES TABLES (V2)
-- ============================================

-- Table: nouvelle_table
-- Description: [description fonctionnelle]
-- Relations: [liste FK principales]

CREATE TABLE IF NOT EXISTS nouvelle_table (
  -- Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant isolation (OBLIGATOIRE sauf référentiels DIR globaux)
  tenant_id UUID NOT NULL,  -- FK créée en Section 4 ou 5
  
  -- Colonnes métier
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  
  -- Colonnes FK (UUID sans REFERENCES)
  parent_id UUID,           -- FK interne, créée en Section 4
  other_table_id UUID,      -- FK externe, créée en Section 5
  
  -- Colonnes JSONB/Arrays
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Audit trail (OBLIGATOIRE)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,          -- FK vers adm_members, créée en Section 5
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,          -- FK vers adm_members, créée en Section 5
  
  -- Soft delete (OBLIGATOIRE)
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,          -- FK vers adm_members, créée en Section 5
  deletion_reason TEXT
);

-- Répéter pour chaque nouvelle table


-- ============================================
-- SECTION 4: FOREIGN KEYS INTERNES
-- Description: FK vers tables créées dans CE module
-- ============================================

-- FK: nouvelle_table.parent_id → nouvelle_table.id (récursif)
ALTER TABLE nouvelle_table 
  ADD CONSTRAINT fk_nouvelle_table_parent
  FOREIGN KEY (parent_id) 
  REFERENCES nouvelle_table(id) 
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK: table_enfant.table_parent_id → table_parent.id
ALTER TABLE table_enfant 
  ADD CONSTRAINT fk_table_enfant_parent
  FOREIGN KEY (table_parent_id) 
  REFERENCES table_parent(id) 
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Répéter pour TOUTES les FK internes du module


-- ============================================
-- SECTION 5: FOREIGN KEYS EXTERNES (vers modules précédents)
-- Description: FK vers tables déjà créées (sessions 0 à N-1)
-- ============================================

-- FK vers ADM (toujours disponible sauf Session 1)
ALTER TABLE table_name 
  ADD CONSTRAINT fk_table_tenant
  FOREIGN KEY (tenant_id) 
  REFERENCES adm_tenants(id) 
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE table_name 
  ADD CONSTRAINT fk_table_created_by
  FOREIGN KEY (created_by) 
  REFERENCES adm_members(id) 
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK vers DIR (disponible dès Session 3+)
ALTER TABLE table_name 
  ADD CONSTRAINT fk_table_platform
  FOREIGN KEY (platform_id) 
  REFERENCES dir_platforms(id) 
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- FK vers autres modules précédents
-- (selon les dépendances du module actuel)

-- Répéter pour TOUTES les FK vers modules précédents


-- ============================================
-- SECTION 6: DOCUMENTATION FK FUTURES
-- Description: FK vers modules PAS ENCORE CRÉÉS
-- Format strict pour extraction automatique
-- ============================================

-- IMPORTANT: Ces FK ne doivent PAS être exécutées maintenant
-- Elles seront créées soit:
--   1. Dans le fichier SQL du module cible (Section 5)
--   2. Dans 98_pending_fk.sql si oubliées

-- FK-[MODULE]-001: table_name.column → future_table.id
-- MODULE_CIBLE: [MODULE] (Session [X])
-- ON_DELETE: [CASCADE/SET NULL/RESTRICT]
-- SQL: ALTER TABLE table_name 
--      ADD CONSTRAINT fk_table_column
--      FOREIGN KEY (column) REFERENCES future_table(id) ON DELETE [ACTION];

-- Exemple concret:
-- FK-FLT-005: flt_vehicles.driver_id → rid_drivers.id
-- MODULE_CIBLE: RID (Session 7)
-- ON_DELETE: SET NULL
-- SQL: ALTER TABLE flt_vehicles
--      ADD CONSTRAINT fk_flt_vehicles_driver
--      FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON DELETE SET NULL;

-- Répéter pour CHAQUE FK vers modules futurs


-- ============================================
-- SECTION 7: DOCUMENTATION INDEXES
-- Description: Tous les indexes du module
-- Format strict pour extraction automatique
-- ============================================

-- IMPORTANT: Ces indexes ne sont PAS créés maintenant
-- Ils seront créés dans 99_pending_indexes.sql (Session 14)

-- INDEX-[MODULE]-001: table_name.column
-- TYPE: [BTREE/GIN/UNIQUE]
-- WHERE: [condition optionnelle]
-- SQL: CREATE INDEX IF NOT EXISTS idx_table_column 
--      ON table_name(column) [WHERE condition];

-- Indexes BTREE (colonnes FK, tenant_id)
-- INDEX-ADM-001: adm_members.tenant_id
-- TYPE: BTREE
-- WHERE: deleted_at IS NULL
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_members_tenant 
--      ON adm_members(tenant_id) WHERE deleted_at IS NULL;

-- INDEX-ADM-002: adm_members.default_role_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_members_role 
--      ON adm_members(default_role_id);

-- Indexes GIN (JSONB, Arrays)
-- INDEX-ADM-010: adm_tenants.metadata
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenants_metadata 
--      ON adm_tenants USING GIN(metadata);

-- Indexes UNIQUE (avec deleted_at pour soft delete)
-- INDEX-ADM-020: adm_members(tenant_id, email, deleted_at)
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_members_unique_email
--      ON adm_members(tenant_id, email, deleted_at);

-- Répéter pour TOUS les indexes du module
-- Recommandations:
--   - Index sur TOUTES les colonnes FK
--   - Index sur tenant_id (avec WHERE deleted_at IS NULL)
--   - Index GIN sur TOUTES les colonnes JSONB
--   - Index GIN sur TOUTES les colonnes Arrays
--   - Index UNIQUE incluant deleted_at


-- ============================================
-- SECTION 8: GATEWAY 2 - VALIDATION POST-GÉNÉRATION
-- ============================================

-- STATISTIQUES GÉNÉRÉES:
-- Enums créés: X
-- Tables modifiées (ALTER TABLE): Y
-- Nouvelles tables (CREATE TABLE): Z
-- FK internes créées: A
-- FK externes créées: B
-- FK futures documentées: C
-- Indexes documentés: D
-- Total lignes SQL exécutables: ~XXX

-- VÉRIFICATIONS AUTOMATIQUES:
-- [✓] Aucun DROP TABLE/COLUMN/TYPE dans le code exécutable
-- [✓] Aucun ALTER COLUMN TYPE dans le code exécutable
-- [✓] Aucun RENAME dans le code exécutable
-- [✓] Tous les IF NOT EXISTS présents (enums, tables, colonnes)
-- [✓] Tous les noms en snake_case (tables, colonnes, constraints, indexes)
-- [✓] Audit trail complet (created_at, updated_at, deleted_at)
-- [✓] Audit users complet (created_by, updated_by, deleted_by)
-- [✓] Metadata JSONB présent sur toutes les tables
-- [✓] tenant_id présent sur toutes les tables (sauf DIR globaux)

-- POINTS D'ATTENTION:
-- [Liste ici tout ce qui nécessite vérification manuelle]
-- Exemple:
--   - Table xyz: vérifier colonne abc vs spec (ambiguïté détectée)
--   - FK vers module RID: sera créée dans Session 7
--   - Enum custom_enum: vérifier valeurs vs métier

-- ============================================
-- FIN DU FICHIER
-- Session [N]/13 complétée
-- Prochaine session: [N+1]/13 - Module [SUIVANT]
-- ============================================
```

---

## RÈGLES CRITIQUES POUR GÉNÉRATION

### NOMMAGE (violation = ÉCHEC)

**Tables PostgreSQL:**
```sql
✅ CORRECT: adm_tenants, bil_billing_plans, fin_driver_payments
❌ INTERDIT: AdmTenants, BilBillingPlans, FinDriverPayments
❌ INTERDIT: AdmTenant, BilBillingPlan, FinDriverPayment
```

**Colonnes:**
```sql
✅ CORRECT: created_at, tenant_id, first_name, updated_by
❌ INTERDIT: createdAt, tenantId, firstName, updatedBy
```

**Constraints/Indexes:**
```sql
✅ CORRECT: fk_table_column, idx_table_column
❌ INTERDIT: FK_Table_Column, IdxTableColumn
```

### OPÉRATIONS SQL (violation = ÉCHEC)

```sql
✅ AUTORISÉ:
  - DO $$ BEGIN CREATE TYPE ... EXCEPTION END $$;
  - CREATE TABLE IF NOT EXISTS
  - ALTER TABLE ADD COLUMN IF NOT EXISTS
  - ALTER TABLE ADD CONSTRAINT (pour FK)
  - -- Commentaires (pour documentation)

❌ ABSOLUMENT INTERDIT:
  - DROP TABLE
  - DROP COLUMN
  - DROP TYPE
  - ALTER COLUMN TYPE
  - ALTER COLUMN SET
  - RENAME TABLE
  - RENAME COLUMN
  - TRUNCATE
  - DELETE FROM (sauf cas très spécifiques documentés)
```

### COLONNES OBLIGATOIRES (toutes les tables)

```sql
-- Audit trail
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by UUID                                 -- FK vers adm_members
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_by UUID                                 -- FK vers adm_members

-- Soft delete
deleted_at TIMESTAMPTZ
deleted_by UUID                                 -- FK vers adm_members
deletion_reason TEXT

-- Metadata
metadata JSONB DEFAULT '{}'::jsonb

-- Tenant (sauf référentiels DIR globaux)
tenant_id UUID NOT NULL                         -- FK vers adm_tenants
```

### FOREIGN KEYS

**Règles de décision:**

1. **FK vers table du MÊME module** → Section 4 (FK INTERNES)
```sql
-- Exemple dans FLT:
-- flt_vehicle_assignments.vehicle_id → flt_vehicles.id
ALTER TABLE flt_vehicle_assignments
  ADD CONSTRAINT fk_flt_assignments_vehicle
  FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id);
```

2. **FK vers module DÉJÀ CRÉÉ** → Section 5 (FK EXTERNES)
```sql
-- Exemple Session 5 (BIL), FK vers ADM (Session 1):
ALTER TABLE bil_billing_plans
  ADD CONSTRAINT fk_bil_plans_created_by
  FOREIGN KEY (created_by) REFERENCES adm_members(id);
```

3. **FK vers module PAS ENCORE CRÉÉ** → Section 6 (DOCUMENTATION)
```sql
-- Exemple Session 8 (FLT), FK vers RID (Session 7 pas encore fait):
-- FK-FLT-005: flt_vehicles.driver_id → rid_drivers.id
-- MODULE_CIBLE: RID (Session 7)
-- ON_DELETE: SET NULL
-- SQL: ALTER TABLE flt_vehicles
--      ADD CONSTRAINT fk_flt_vehicles_driver
--      FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON DELETE SET NULL;
```

**ON DELETE:**
- `CASCADE`: Si parent supprimé → enfant supprimé (ex: tenant_id)
- `SET NULL`: Si parent supprimé → enfant.fk = NULL (ex: assigned_to)
- `RESTRICT`: Empêche suppression parent si enfant existe (ex: enums utilisés)

### INDEXES

**Tous les indexes vont dans Section 7 (DOCUMENTATION).**

**Types d'indexes obligatoires:**

1. **BTREE sur colonnes FK:**
```sql
-- INDEX-XXX-001: table.foreign_key_column
-- TYPE: BTREE
-- WHERE: deleted_at IS NULL
-- SQL: CREATE INDEX IF NOT EXISTS idx_table_fk
--      ON table(foreign_key_column) WHERE deleted_at IS NULL;
```

2. **BTREE sur tenant_id:**
```sql
-- INDEX-XXX-002: table.tenant_id
-- TYPE: BTREE
-- WHERE: deleted_at IS NULL
-- SQL: CREATE INDEX IF NOT EXISTS idx_table_tenant
--      ON table(tenant_id) WHERE deleted_at IS NULL;
```

3. **GIN sur JSONB:**
```sql
-- INDEX-XXX-010: table.metadata
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_table_metadata
--      ON table USING GIN(metadata);
```

4. **GIN sur Arrays:**
```sql
-- INDEX-XXX-011: table.tags
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_table_tags
--      ON table USING GIN(tags);
```

5. **UNIQUE (avec deleted_at):**
```sql
-- INDEX-XXX-020: table(tenant_id, email, deleted_at)
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_table_unique_email
--      ON table(tenant_id, email, deleted_at);
```

### COMPARAISON V1→V2

**Pour identifier quelles tables modifier:**

1. Lire `prisma/schema.prisma` (V1 actuel)
2. Lister tous les models du module:
```
Exemple ADM en V1:
- model AdmTenant { @@map("adm_tenants") }
- model AdmMember { @@map("adm_members") }
- model AdmRole { @@map("adm_roles") }
- model AdmMemberRole { @@map("adm_member_roles") }
- model AdmAuditLog { @@map("adm_audit_logs") }
- model AdmProviderEmployee { @@map("adm_provider_employees") }
- model AdmTenantLifecycleEvent { @@map("adm_tenant_lifecycle_events") }
```

3. Lire `[module].prisma` V2
4. Comparer:
   - Tables présentes en V1 ET V2 → ALTER TABLE (Section 2)
   - Tables présentes en V2 UNIQUEMENT → CREATE TABLE (Section 3)
   - Tables présentes en V1 UNIQUEMENT → ⚠️ Suppression (documenter)

**Note suppression rid_driver_languages:**
Cette table V1 n'existe pas en V2. Fonctionnalité migrée vers `rid_drivers.languages` (JSONB ou TEXT[]). Ne PAS la recréer.

---

## GATEWAY 2: AUTO-VALIDATION PENDANT GÉNÉRATION

**Claude Code DOIT vérifier pour CHAQUE table générée:**

```
Checklist table: [nom_table]
[ ] Nom en snake_case (pas PascalCase)
[ ] IF NOT EXISTS présent (CREATE TABLE ou ALTER TABLE ADD COLUMN)
[ ] created_at TIMESTAMPTZ présent
[ ] updated_at TIMESTAMPTZ présent
[ ] deleted_at TIMESTAMPTZ présent
[ ] created_by UUID présent
[ ] updated_by UUID présent
[ ] deleted_by UUID présent
[ ] deletion_reason TEXT présent
[ ] metadata JSONB présent
[ ] tenant_id UUID présent (sauf DIR globaux)
[ ] Toutes FK avec ON DELETE spécifié
[ ] Toutes FK avec ON UPDATE spécifié
[ ] Aucune clause REFERENCES pour colonnes vers modules futurs
```

**Si 1 checkbox échoue → Corriger avant de continuer à la table suivante.**

---

## OUTPUT ATTENDU

**Claude Code génère 1 fichier:**
- `0N_[module]_structure.sql`
- Taille: 200-600 lignes (selon module)
- Format: SQL pur exécutable
- Sections 1-5: Code SQL exécutable
- Sections 6-7: Commentaires SQL (documentation)
- Section 8: Validation (commentaires)

**Exemples de tailles:**
- `02_adm_structure.sql`: ~450 lignes
- `03_dir_structure.sql`: ~350 lignes
- `04_doc_structure.sql`: ~180 lignes
- `09_flt_structure.sql`: ~550 lignes

```

**Durée génération:** 5-10 minutes

---

#### ÉTAPE 3: Validation Utilisateur (10-15 min)

**GATE 3: Validation Post-Génération**

**Checklist rapide (3 min):**

1. **Lire Section 8 (Gateway validation):**
```sql
-- STATISTIQUES GÉNÉRÉES:
-- Enums créés: 9
-- Tables modifiées: 7
-- Nouvelles tables: 5
-- FK internes: 18
-- FK externes: 15
-- FK futures documentées: 0
-- Indexes documentés: 25
```

**Vérifier:**
- [ ] Stats cohérentes avec module (consulter RANKING)
- [ ] Nombre tables = attendu
- [ ] FK futures documentées si module dépend de modules futurs

2. **Lire Points d'attention:**
```sql
-- POINTS D'ATTENTION:
-- Table adm_invitations: vérifier colonne invitation_token (généré auto?)
-- FK vers adm_members.id: vérifier ON DELETE SET NULL (pas CASCADE)
```

**Action:** Noter les points, vérifier si besoin

3. **Scan rapide du fichier (5 min):**

**Chercher visuellement:**
```bash
# Ouvrir le fichier dans éditeur
code 0N_module_structure.sql

# Chercher violations possibles (devrait être 0)
grep -i "DROP\|RENAME\|AdmTenant\|BilPlan\|PascalCase" 0N_module_structure.sql
# Résultat attendu: aucune ligne (sauf commentaires)

# Vérifier snake_case dans tables
grep "CREATE TABLE\|ALTER TABLE" 0N_module_structure.sql | head -20
# Vérifier visuellement: tous snake_case

# Compter FK créées vs documentées
grep "ADD CONSTRAINT fk_" 0N_module_structure.sql | wc -l
grep "^-- FK-" 0N_module_structure.sql | wc -l
# Vérifier cohérence avec Section 8
```

4. **Validation approfondie (5 min) - Si doute détecté:**

**Lire en détail:**
- Section 2 (ALTER TABLE): Vérifier colonnes cohérentes
- Section 3 (CREATE TABLE): Vérifier 1-2 tables complètes
- Section 4 (FK internes): Vérifier ON DELETE logique
- Section 5 (FK externes): Vérifier modules cibles créés
- Section 6 (FK futures): Vérifier modules cibles futurs

**Si anomalie détectée → Corriger avant application**

**Corrections possibles:**
```bash
# Corriger PascalCase → snake_case
sed -i 's/AdmTenant/adm_tenants/g' 0N_module_structure.sql

# Corriger FK manquante
# Éditer manuellement, ajouter dans Section 4 ou 5
```

**GATE 3 PASSÉ → Continuer Étape 4**

---

#### ÉTAPE 4: Application SQL (2-5 min)

**GATE 4: Pré-Application**

**Checklist:**
- [ ] Validation GATE 3 complète
- [ ] Fichier SQL relu et approuvé
- [ ] Connexion DB active
- [ ] Aucune session concurrente sur DB

**Backup (optionnel mais recommandé):**
```bash
# Backup rapide si premier run de la journée
pg_dump fleetcore > backup_avant_session_N_$(date +%Y%m%d_%H%M%S).sql
```

**Application:**
```bash
# Se placer dans le bon dossier
cd docs/Migration\ v1\ -\>\ v2/sql/

# Appliquer le fichier SQL
psql -d fleetcore -f 0N_module_structure.sql

# Vérifier le code retour
echo $?
# Attendu: 0 (succès)
# Si != 0 → Lire l'erreur psql et corriger
```

**Gestion erreur psql:**

**Erreur type 1: Relation does not exist**
```
ERROR:  relation "rid_drivers" does not exist
```
**Cause:** FK vers table pas encore créée  
**Action:**
1. Identifier la ligne FK problématique
2. La supprimer du fichier SQL (Section 4 ou 5)
3. La documenter en Section 6 (FK futures)
4. Réappliquer le fichier

**Erreur type 2: Duplicate column**
```
ERROR:  column "metadata" of relation "adm_tenants" already exists
```
**Cause:** Colonne déjà ajoutée (fichier appliqué 2×)  
**Action:**
1. Vérifier état DB: `psql -d fleetcore -c "\d adm_tenants"`
2. Si colonne existe → Supprimer la ligne ALTER TABLE du fichier
3. Réappliquer

**Erreur type 3: Syntax error**
```
ERROR:  syntax error at or near "DO"
```
**Cause:** Erreur syntaxe SQL  
**Action:**
1. Lire la ligne incriminée
2. Corriger syntaxe
3. Réappliquer

**Si erreur non résolue rapidement (>5 min) → Rollback:**
```bash
# Restaurer backup si créé
psql -d fleetcore < backup_avant_session_N_*.sql

# Ou rollback manuel
psql -d fleetcore -c "DROP TABLE IF EXISTS nouvelle_table_creee CASCADE;"
# (pour chaque table créée dans cette session)
```

**Application OK → Continuer Étape 5**

---

#### ÉTAPE 5: Tests Post-Application (3-5 min)

**GATE 5: Post-Application**

**Tests obligatoires:**

1. **Vérifier compteur tables:**
```bash
psql -d fleetcore -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Comparer avec avant
# Attendu: augmentation = nb nouvelles tables créées (Section 3)
```

2. **Vérifier tables créées:**
```bash
# Lister dernières tables
psql -d fleetcore -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" | tail -20

# Vérifier les nouvelles tables du module sont présentes
```

3. **Vérifier FK créées:**
```bash
# Exemple pour ADM
psql -d fleetcore -c "
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name LIKE 'adm_%'
ORDER BY tc.table_name, tc.constraint_name;
"

# Vérifier nombre FK cohérent avec Section 8 (FK internes + externes)
```

4. **Test requête simple:**
```bash
# Vérifier une table peut être requêtée
psql -d fleetcore -c "SELECT COUNT(*) FROM adm_tenants;"
# Doit fonctionner sans erreur

# Si nouvelle table créée, tester insertion
psql -d fleetcore -c "
INSERT INTO adm_invitations (id, tenant_id, email, invited_by, created_at, updated_at) 
VALUES (gen_random_uuid(), (SELECT id FROM adm_tenants LIMIT 1), 'test@example.com', NULL, NOW(), NOW())
RETURNING id;
"
# Vérifier insertion OK

# Cleanup test
psql -d fleetcore -c "DELETE FROM adm_invitations WHERE email='test@example.com';"
```

5. **Prisma validate (optionnel à ce stade):**
```bash
cd /chemin/vers/fleetcore
npx prisma validate
# Peut échouer car schema.prisma pas encore mis à jour
# Normal, on mettra à jour schema.prisma à la fin
```

**Si 1 test échoue → Investiguer:**
- Relire erreur
- Vérifier fichier SQL appliqué
- Vérifier état DB
- Si besoin, rollback et corriger

**GATE 5 PASSÉ → Continuer Étape 6**

---

#### ÉTAPE 6: Finalisation Session (3 min)

**GATE 6: Validation Module**

**Checklist:**
- [ ] Application SQL OK
- [ ] Tests post-application OK (GATE 5)
- [ ] Aucune erreur détectée
- [ ] Fichier SQL sauvegardé

**Documentation session (optionnel mais recommandé):**
```bash
# Créer note session
cat > notes_session_N.md << EOF
# Session [N]/13 - Module [NOM]

**Date:** $(date)
**Durée réelle:** [X] min
**Statut:** ✅ Succès

## Actions réalisées
- Généré 0N_module_structure.sql ([Y] lignes)
- Tables modifiées: [Z]
- Nouvelles tables: [W]
- FK créées: [A]
- FK documentées: [B]

## Problèmes rencontrés
- Aucun / [Liste]

## Points d'attention
- [Copier depuis Section 8 du fichier SQL]

## Prochaine session
- Session [N+1]/13: Module [SUIVANT]
EOF
```

**Commit Git (recommandé):**
```bash
git add docs/Migration\ v1\ -\>\ v2/sql/0N_module_structure.sql
git add notes_session_N.md
git commit -m "feat(migration): Session [N]/13 - Module [NOM] structure SQL

- Tables modifiées: [Z]
- Nouvelles tables: [W]
- FK internes: [A]
- FK externes: [B]
- Status: ✅ Applied and tested"
```

**GATE 6 PASSÉ → Session N terminée**

**Pause recommandée:** 5-10 min entre sessions (sauf urgence)

---

### SESSIONS DÉTAILLÉES PAR MODULE

#### SESSION 0: SHARED ENUMS (5 min)

**Module:** SHARED  
**Fichier input:** `shared.prisma`  
**Fichier output:** `01_shared_enums.sql`

**Spécificités:**
- Pas de tables, uniquement 5 enums globaux
- Pas de FK
- Pas d'indexes

**Enums à créer:**
1. `lifecycle_status` (active, inactive, deprecated)
2. `tenant_status` (trialing, active, suspended, past_due, cancelled)
3. `audit_severity` (info, warning, error, critical)
4. `audit_category` (security, financial, compliance, operational)
5. `performed_by_type` (system, employee, api)

**Template SQL:**
```sql
-- Enum 1: lifecycle_status
DO $$ BEGIN
  CREATE TYPE lifecycle_status AS ENUM ('active', 'inactive', 'deprecated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- (Répéter pour les 5 enums)
```

**Validation:**
- [ ] 5 enums créés
- [ ] Aucune table
- [ ] Aucune FK

**Application:**
```bash
psql -d fleetcore -f 01_shared_enums.sql
```

**Test:**
```bash
psql -d fleetcore -c "\dT lifecycle_status"
# Doit afficher l'enum
```

---

#### SESSION 1: ADM STRUCTURES (25 min)

**Module:** ADM (Administration)  
**Fichier input:** `adm.prisma`  
**Fichier output:** `02_adm_structure.sql`

**Modules disponibles:** SHARED uniquement

**Tables V1 à modifier (7):**
1. adm_tenants
2. adm_members
3. adm_roles
4. adm_member_roles
5. adm_audit_logs
6. adm_provider_employees
7. adm_tenant_lifecycle_events

**Nouvelles tables V2 (5):**
8. adm_invitations
9. adm_role_permissions
10. adm_role_versions
11. adm_member_sessions
12. adm_tenant_settings

**Enums module:** ~9 enums ADM-spécifiques

**FK INTERNES (~18):**
- adm_members → adm_tenants
- adm_members → adm_roles
- adm_roles → adm_roles (parent_role_id)
- adm_member_roles → adm_members
- adm_member_roles → adm_roles
- adm_member_roles → adm_members (assigned_by)
- adm_audit_logs → adm_tenants
- adm_audit_logs → adm_members (performed_by)
- adm_provider_employees → adm_tenants
- adm_tenant_lifecycle_events → adm_tenants
- adm_invitations → adm_tenants
- adm_invitations → adm_members (invited_by)
- adm_invitations → adm_members (accepted_by)
- adm_role_permissions → adm_roles
- adm_role_versions → adm_roles
- adm_role_versions → adm_members (changed_by)
- adm_member_sessions → adm_members
- adm_tenant_settings → adm_tenants

**FK EXTERNES:** Aucune (ADM est la base)

**FK FUTURES:** Aucune

**Indexes (~25):**
- tenant_id sur toutes tables
- member_id, role_id, etc.
- Metadata GIN
- Unique constraints

**Points d'attention:**
- adm_tenants: Colonne `status` doit utiliser enum `tenant_status` (SHARED)
- adm_members: email doit être UNIQUE par tenant
- adm_roles: parent_role_id nullable (hiérarchie optionnelle)

---

#### SESSION 2: DIR STRUCTURES (25 min)

**Module:** DIR (Référentiels)  
**Fichier input:** `dir.prisma`  
**Fichier output:** `03_dir_structure.sql`

**Modules disponibles:** SHARED, ADM

**Tables V1 à modifier (5):**
1. dir_car_makes
2. dir_car_models
3. dir_platforms
4. dir_country_regulations
5. dir_vehicle_classes

**Nouvelles tables V2 (7 + référentiels pour autres modules):**
6. dir_platform_config
7. adm_tenant_vehicle_classes
8. dir_vehicle_statuses (pour FLT)
9. dir_ownership_types (pour FLT)
10. dir_maintenance_types (pour SCH)
11. dir_transaction_types (pour FIN)
12. dir_transaction_statuses (pour FIN)
13. dir_toll_gates (pour FIN)
14. dir_fine_types (pour FIN)

**Total:** 12 tables

**Enums module:** Utilise `lifecycle_status` de SHARED

**FK INTERNES (~5):**
- dir_car_models → dir_car_makes
- dir_car_models → dir_vehicle_classes
- dir_platform_config → dir_platforms
- adm_tenant_vehicle_classes → dir_vehicle_classes

**FK EXTERNES vers ADM (~15):**
- Toutes tables: tenant_id → adm_tenants (sauf référentiels globaux)
- Toutes tables: created_by → adm_provider_employees
- Toutes tables: updated_by → adm_provider_employees
- Toutes tables: deleted_by → adm_provider_employees

**FK FUTURES:** Aucune

**Indexes (~20):**
- tenant_id, make_id, platform_id, etc.

**Points d'attention:**
- Tables référentiels globaux (dir_car_makes, dir_platforms, etc.): `tenant_id` nullable ou absent selon si référentiel global ou par tenant
- dir_platform_config: tenant-specific config

---

#### SESSION 3: DOC STRUCTURES (20 min)

**Module:** DOC (Documents)  
**Fichier input:** `doc.prisma`  
**Fichier output:** `04_doc_structure.sql`

**Modules disponibles:** SHARED, ADM, DIR

**Tables V1 à modifier (1):**
1. doc_documents

**Nouvelles tables V2 (3):**
2. doc_document_types
3. doc_entity_types
4. doc_document_versions

**Enums module:** ~4 enums DOC-spécifiques

**FK INTERNES (~3):**
- doc_documents → doc_entity_types
- doc_documents → doc_document_types
- doc_document_versions → doc_documents

**FK EXTERNES vers ADM (~5):**
- doc_documents → adm_tenants
- doc_documents → adm_members (verified_by, created_by, updated_by)
- doc_document_types → adm_provider_employees (created_by, etc.)
- doc_entity_types → adm_provider_employees (created_by, etc.)

**FK FUTURES:** Aucune

**Indexes (~12):**
- tenant_id, entity_type, document_type, etc.

**Points d'attention:**
- doc_documents: `storage_provider` enum (supabase, s3, azure, gcs)
- doc_document_versions: Versioning documents

---

#### SESSION 4: CRM STRUCTURES (20 min)

**Module:** CRM  
**Fichier input:** `crm.prisma`  
**Fichier output:** `05_crm_structure.sql`

**Modules disponibles:** SHARED, ADM, DIR, DOC

**Tables V1 à modifier (3):**
1. crm_leads
2. crm_opportunities
3. crm_contracts

**Nouvelles tables V2 (4):**
4. crm_lead_sources
5. crm_opportunity_loss_reasons
6. crm_pipelines
7. crm_addresses

**Enums module:** ~11 enums CRM-spécifiques

**FK INTERNES (~8):**
- crm_leads → crm_lead_sources
- crm_leads → crm_opportunities
- crm_opportunities → crm_leads
- crm_opportunities → crm_opportunity_loss_reasons
- crm_contracts → crm_opportunities
- crm_addresses → crm_leads

**FK EXTERNES vers ADM (~10):**
- Toutes tables → adm_tenants
- crm_leads → adm_provider_employees (assigned_to, created_by)
- crm_opportunities → adm_provider_employees (assigned_to, owner)
- crm_contracts → adm_tenants

**FK FUTURES:** Aucune

**Indexes (~15):**
- tenant_id, source_id, opportunity_id, etc.

**Points d'attention:**
- crm_leads: Champs `first_name`/`last_name` vs V1 `full_name` (si V1 a full_name, garder + ajouter les 2 nouveaux)
- crm_opportunities: Pipeline multi-stages

---

#### SESSION 5: BIL STRUCTURES (25 min)

**Module:** BIL (Billing)  
**Fichier input:** `bil.prisma`  
**Fichier output:** `06_bil_structure.sql`

**Modules disponibles:** SHARED, ADM, DIR, DOC, CRM

**Tables V1 à modifier (6):**
1. bil_billing_plans
2. bil_tenant_subscriptions
3. bil_tenant_usage_metrics
4. bil_tenant_invoices
5. bil_tenant_invoice_lines
6. bil_payment_methods

**Nouvelles tables V2 (3):**
7. bil_usage_metric_types
8. bil_promotions
9. bil_promotion_usages

**Enums module:** ~14 enums BIL-spécifiques

**FK INTERNES (~10):**
- bil_tenant_subscriptions → bil_billing_plans
- bil_tenant_subscriptions → bil_billing_plans (previous_plan_id)
- bil_tenant_subscriptions → bil_payment_methods
- bil_tenant_usage_metrics → bil_tenant_subscriptions
- bil_tenant_usage_metrics → bil_usage_metric_types
- bil_tenant_invoices → bil_tenant_subscriptions
- bil_tenant_invoice_lines → bil_tenant_invoices
- bil_promotion_usages → bil_promotions
- bil_promotion_usages → bil_tenant_subscriptions

**FK EXTERNES vers ADM (~8):**
- Toutes tables → adm_tenants
- bil_billing_plans → adm_provider_employees (created_by)
- bil_tenant_subscriptions → adm_tenants
- bil_tenant_invoices → adm_tenants
- bil_payment_methods → adm_tenants

**FK FUTURES:** Aucune

**Indexes (~18):**
- tenant_id, plan_id, subscription_id, etc.

**Points d'attention:**
- bil_tenant_subscriptions: Gestion période d'essai, renouvellement
- bil_promotions: Codes promo

---

#### SESSION 6: SUP STRUCTURES (20 min)

**Module:** SUP (Support)  
**Fichier input:** `sup.prisma`  
**Fichier output:** `07_sup_structure.sql`

**Modules disponibles:** SHARED, ADM, DIR, DOC, CRM, BIL

**Tables V1 à modifier (3):**
1. sup_tickets
2. sup_ticket_messages
3. sup_customer_feedback

**Nouvelles tables V2 (3):**
4. sup_ticket_categories
5. sup_ticket_sla_rules
6. sup_canned_responses

**Enums module:** ~7 enums SUP-spécifiques

**FK INTERNES (~6):**
- sup_tickets → sup_ticket_categories
- sup_tickets → sup_ticket_sla_rules
- sup_ticket_messages → sup_tickets
- sup_customer_feedback → sup_tickets

**FK EXTERNES vers ADM (~8):**
- sup_tickets → adm_tenants
- sup_tickets → adm_members (created_by, assigned_to, resolved_by)
- sup_canned_responses → adm_members (created_by)

**FK FUTURES (documenter, ne PAS créer):**
```sql
-- FK-SUP-001: sup_customer_feedback.driver_id → rid_drivers.id
-- MODULE_CIBLE: RID (Session 7)
-- ON_DELETE: SET NULL
-- SQL: ALTER TABLE sup_customer_feedback
--      ADD CONSTRAINT fk_sup_feedback_driver
--      FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON DELETE SET NULL;
```
Cette FK sera créée en Session 7 (Section 5).

**Indexes (~12):**
- tenant_id, ticket_id, category_id, etc.

**Points d'attention:**
- sup_tickets: SLA tracking
- sup_customer_feedback: Lien vers drivers (Session 7)

---

#### SESSION 7: RID STRUCTURES (30 min)

**Module:** RID (Rides/Drivers)  
**Fichier input:** `rid.prisma`  
**Fichier output:** `08_rid_structure.sql`

**Modules disponibles:** SHARED, ADM, DIR, DOC, CRM, BIL, SUP

**Tables V1 à modifier (7):**
1. rid_drivers
2. rid_driver_documents
3. rid_driver_cooperation_terms
4. rid_driver_requests
5. rid_driver_performances
6. rid_driver_blacklists
7. rid_driver_training

**Note:** `rid_driver_languages` SUPPRIMÉE (V1→V2), ne PAS recréer

**Nouvelles tables V2:** Aucune

**Enums module:** ~20 enums RID-spécifiques

**FK INTERNES (~7):**
- rid_driver_documents → rid_drivers
- rid_driver_cooperation_terms → rid_drivers
- rid_driver_requests → rid_drivers
- rid_driver_performances → rid_drivers
- rid_driver_blacklists → rid_drivers
- rid_driver_training → rid_drivers

**FK EXTERNES vers ADM (~8):**
- rid_drivers → adm_tenants
- rid_drivers → adm_provider_employees (created_by, verified_by, photo_verified_by)

**FK EXTERNES vers DOC (~1):**
- rid_driver_documents → doc_documents

**FK RETOUR (depuis SUP - créer ICI):**
```sql
-- Résolution FK différée de Session 6
ALTER TABLE sup_customer_feedback 
  ADD CONSTRAINT fk_sup_feedback_driver
  FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON DELETE SET NULL;
```

**FK FUTURES:** Aucune (RID ne dépend pas de modules futurs)

**Indexes (~20):**
- tenant_id, driver_id, document_id, etc.

**Points d'attention:**
- rid_drivers: Colonnes `languages` (JSONB ou TEXT[]) remplace table rid_driver_languages
- rid_driver_documents: Gestion expiration documents

---

#### SESSION 8: FLT STRUCTURES (30 min)

**Module:** FLT (Fleet)  
**Fichier input:** `flt.prisma`  
**Fichier output:** `09_flt_structure.sql`

**Modules disponibles:** SHARED, ADM, DIR, DOC, CRM, BIL, SUP, RID

**Tables V1 à modifier (6):**
1. flt_vehicles
2. flt_vehicle_assignments
3. flt_vehicle_events
4. flt_vehicle_maintenance
5. flt_vehicle_expenses
6. flt_vehicle_insurances

**Nouvelles tables V2 (2 + 2 référentiels DIR créés en Session 2):**
7. flt_vehicle_inspections
8. flt_vehicle_equipments

**Note:** `dir_vehicle_statuses` et `dir_ownership_types` déjà créés en Session 2

**Enums module:** ~32 enums FLT-spécifiques

**FK INTERNES (~8):**
- flt_vehicle_assignments → flt_vehicles
- flt_vehicle_events → flt_vehicles
- flt_vehicle_maintenance → flt_vehicles
- flt_vehicle_expenses → flt_vehicles
- flt_vehicle_insurances → flt_vehicles
- flt_vehicle_inspections → flt_vehicles
- flt_vehicle_equipments → flt_vehicles

**FK EXTERNES vers ADM (~5):**
- flt_vehicles → adm_tenants
- flt_vehicles → adm_provider_employees (created_by)

**FK EXTERNES vers DIR (~5):**
- flt_vehicles → dir_car_makes
- flt_vehicles → dir_car_models
- flt_vehicles → dir_vehicle_classes
- flt_vehicles → dir_vehicle_statuses
- flt_vehicles → dir_ownership_types

**FK EXTERNES vers RID (~2):**
- flt_vehicle_assignments → rid_drivers
- flt_vehicles → rid_drivers (assigned_driver_id)

**FK FUTURES:** Aucune

**Indexes (~30):**
- tenant_id, vehicle_id, driver_id, make_id, model_id, etc.

**Points d'attention:**
- flt_vehicles: Gestion statuts complexes
- flt_vehicle_insurances: Multi-policies

---

#### SESSION 9: SCH STRUCTURES (30 min)

**Module:** SCH (Scheduling)  
**Fichier input:** `sch.prisma`  
**Fichier output:** `10_sch_structure.sql`

**Modules disponibles:** SHARED, ADM, DIR, DOC, CRM, BIL, SUP, RID, FLT

**Tables V1 à modifier (4):**
1. sch_shifts
2. sch_maintenance_schedules
3. sch_goals
4. sch_tasks

**Nouvelles tables V2 (7 + 1 référentiel DIR créé en Session 2):**
5. sch_shift_types
6. sch_goal_types
7. sch_goal_achievements
8. sch_task_types
9. sch_task_comments
10. sch_task_history
11. sch_locations

**Note:** `dir_maintenance_types` déjà créé en Session 2

**Enums module:** ~19 enums SCH-spécifiques

**FK INTERNES (~10):**
- sch_shifts → sch_shift_types
- sch_shifts → sch_locations
- sch_goals → sch_goal_types
- sch_goal_achievements → sch_goals
- sch_tasks → sch_task_types
- sch_task_comments → sch_tasks
- sch_task_history → sch_tasks

**FK EXTERNES vers ADM (~5):**
- sch_shifts → adm_tenants
- sch_shifts → adm_members (approved_by)
- sch_goals → adm_tenants

**FK EXTERNES vers RID (~2):**
- sch_shifts → rid_drivers
- sch_goals → rid_drivers

**FK EXTERNES vers FLT (~2):**
- sch_shifts → flt_vehicles
- sch_maintenance_schedules → flt_vehicles

**FK EXTERNES vers DIR (~1):**
- sch_maintenance_schedules → dir_maintenance_types

**FK FUTURES:** Aucune

**Indexes (~25):**
- tenant_id, shift_id, driver_id, vehicle_id, etc.

**Points d'attention:**
- sch_shifts: Gestion horaires complexes
- sch_goals: KPI tracking

---

#### SESSION 10: TRP STRUCTURES (25 min)

**Module:** TRP (Trips/Transport)  
**Fichier input:** `trp.prisma`  
**Fichier output:** `11_trp_structure.sql`

**Modules disponibles:** SHARED, ADM, DIR, DOC, CRM, BIL, SUP, RID, FLT, SCH

**Tables V1 à modifier (4):**
1. trp_platform_accounts
2. trp_trips
3. trp_settlements
4. trp_client_invoices

**Nouvelles tables V2 (2):**
5. trp_platform_account_keys
6. trp_client_invoice_lines

**Enums module:** ~7 enums TRP-spécifiques

**FK INTERNES (~5):**
- trp_platform_account_keys → trp_platform_accounts
- trp_trips → trp_platform_accounts
- trp_settlements → trp_platform_accounts
- trp_client_invoices → trp_platform_accounts
- trp_client_invoice_lines → trp_client_invoices

**FK EXTERNES vers ADM (~5):**
- trp_platform_accounts → adm_tenants
- trp_platform_accounts → adm_provider_employees (created_by)
- trp_trips → adm_tenants
- trp_settlements → adm_tenants

**FK EXTERNES vers DIR (~1):**
- trp_platform_accounts → dir_platforms

**FK EXTERNES vers RID (~2):**
- trp_trips → rid_drivers
- trp_settlements → rid_drivers

**FK EXTERNES vers FLT (~1):**
- trp_trips → flt_vehicles

**FK EXTERNES vers CRM (~1):**
- trp_client_invoices → crm_contracts (ou crm_addresses, selon modélisation)

**FK FUTURES:** Aucune

**Indexes (~20):**
- tenant_id, account_id, driver_id, vehicle_id, etc.

**Points d'attention:**
- trp_trips: Gestion multi-platforms
- trp_settlements: Paiements drivers

---

#### SESSION 11: REV STRUCTURES (20 min)

**Module:** REV (Revenue)  
**Fichier input:** `rev.prisma`  
**Fichier output:** `12_rev_structure.sql`

**Modules disponibles:** SHARED, ADM, DIR, DOC, CRM, BIL, SUP, RID, FLT, SCH, TRP

**Tables V1 à modifier (3):**
1. rev_revenue_imports
2. rev_driver_revenues
3. rev_reconciliations

**Nouvelles tables V2 (1):**
4. rev_reconciliation_lines

**Enums module:** ~6 enums REV-spécifiques

**FK INTERNES (~3):**
- rev_driver_revenues → rev_revenue_imports
- rev_reconciliations → rev_revenue_imports
- rev_reconciliation_lines → rev_reconciliations

**FK EXTERNES vers ADM (~3):**
- rev_revenue_imports → adm_tenants
- rev_driver_revenues → adm_tenants

**FK EXTERNES vers RID (~2):**
- rev_driver_revenues → rid_drivers
- rev_reconciliations → rid_drivers

**FK EXTERNES vers TRP (~2):**
- rev_driver_revenues → trp_trips
- rev_reconciliations → trp_platform_accounts

**FK FUTURES:** Aucune

**Indexes (~12):**
- tenant_id, import_id, driver_id, trip_id, etc.

**Points d'attention:**
- rev_reconciliations: Matching revenus multi-sources

---

#### SESSION 12: FIN STRUCTURES (30 min)

**Module:** FIN (Finance) - **DERNIER MODULE**  
**Fichier input:** `fin.prisma`  
**Fichier output:** `13_fin_structure.sql`

**Modules disponibles:** TOUS (SHARED, ADM, DIR, DOC, CRM, BIL, SUP, RID, FLT, SCH, TRP, REV)

**Tables V1 à modifier (6):**
1. fin_accounts
2. fin_transactions
3. fin_driver_payment_batches
4. fin_driver_payments
5. fin_toll_transactions
6. fin_traffic_fines

**Nouvelles tables V2 (5 + 4 référentiels DIR créés en Session 2):**
7. fin_account_types
8. fin_transaction_categories
9. fin_payment_batch_statuses
10. fin_payment_statuses
11. fin_traffic_fine_disputes

**Note:** Référentiels DIR déjà créés en Session 2:
- dir_transaction_types
- dir_transaction_statuses
- dir_toll_gates
- dir_fine_types

**Enums module:** ~14 enums FIN-spécifiques

**FK INTERNES (~8):**
- fin_accounts → fin_account_types
- fin_transactions → fin_accounts
- fin_transactions → fin_transaction_categories
- fin_driver_payments → fin_driver_payment_batches
- fin_traffic_fine_disputes → fin_traffic_fines

**FK EXTERNES vers ADM (~5):**
- fin_accounts → adm_tenants
- fin_transactions → adm_tenants

**FK EXTERNES vers DIR (~4):**
- fin_transactions → dir_transaction_types
- fin_transactions → dir_transaction_statuses
- fin_toll_transactions → dir_toll_gates
- fin_traffic_fines → dir_fine_types

**FK EXTERNES vers RID (~2):**
- fin_driver_payment_batches → rid_drivers
- fin_driver_payments → rid_drivers

**FK EXTERNES vers TRP (~2):**
- fin_transactions → trp_trips
- fin_driver_payments → trp_settlements

**FK EXTERNES vers REV (~1):**
- fin_driver_payments → rev_driver_revenues

**FK EXTERNES vers BIL (~1):**
- fin_transactions → bil_tenant_invoices

**FK EXTERNES vers FLT (~2):**
- fin_toll_transactions → flt_vehicles
- fin_traffic_fines → flt_vehicles

**FK FUTURES:** Aucune (dernier module)

**Indexes (~25):**
- tenant_id, account_id, transaction_id, driver_id, vehicle_id, etc.

**Points d'attention:**
- fin_transactions: Multi-types (revenue, expense, transfer)
- fin_traffic_fines: Gestion disputes

**FIN DE PHASE 1 après Session 12** ✅

---

## 🔄 PHASE 2: AGRÉGATION FK/INDEXES (Session 14)

**Durée:** 80 minutes

**Acteur:** Claude Chat (moi)

---

### ÉTAPE 1: Extraction FK Futures (30 min)

**Process:**

1. **Lire les 13 fichiers SQL de Phase 1**
```bash
cd docs/Migration\ v1\ -\>\ v2/sql/
ls -la 0*.sql
```

2. **Extraire toutes les lignes FK documentées**
```bash
# Extraire lignes "-- FK-XXX-NNN:"
grep -h "^-- FK-" 0*.sql > fk_documentees.txt

# Compter
wc -l fk_documentees.txt
# Attendu: ~50-100 FK documentées
```

3. **Analyser les FK documentées**

**Exemple extraction:**
```
-- FK-FLT-005: flt_vehicles.driver_id → rid_drivers.id
-- MODULE_CIBLE: RID (Session 7)
-- ON_DELETE: SET NULL
-- SQL: ALTER TABLE flt_vehicles
--      ADD CONSTRAINT fk_flt_vehicles_driver
--      FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON DELETE SET NULL;
```

**Vérifier pour chaque FK:**
- Module source (FLT)
- Module cible (RID)
- Session cible (7)
- Session actuelle du module source (8 pour FLT)

**Si Session cible < Session source → FK déjà créée (Section 5 du module cible)**
**Si Session cible > Session source → Impossible (dépendances respectées)**
**Donc: Toutes FK documentées devraient être déjà créées**

4. **Vérifier les FK réellement créées**
```bash
# Pour chaque FK documentée, chercher si elle a été créée
for fk in $(grep "^-- FK-" fk_documentees.txt | awk -F: '{print $1}' | sed 's/-- //'); do
  echo "Vérification $fk..."
  grep -r "ADD CONSTRAINT.*$fk" 0*.sql || echo "  ⚠️ FK $fk non créée"
done
```

5. **Générer 98_pending_fk.sql**

**Si AUCUNE FK manquante (cas normal):**
```sql
-- ============================================
-- FLEETCORE V2 MIGRATION - PHASE 2: FK DIFFÉRÉES
-- ============================================
-- Date: [DATE]
-- Description: FK externes différées (modules futurs)
-- ============================================

-- ✅ TOUTES LES FK ONT ÉTÉ CRÉÉES
-- Aucune FK différée détectée.
-- Toutes les FK ont été appliquées dans les sections 5 des modules cibles.

-- Vérification:
-- Total FK documentées: [X]
-- Total FK créées: [X]
-- FK manquantes: 0

-- ============================================
-- FIN DU FICHIER
-- ============================================
```

**Si FK manquantes (cas exceptionnel):**
```sql
-- ============================================
-- FLEETCORE V2 MIGRATION - PHASE 2: FK DIFFÉRÉES
-- ============================================

-- ⚠️ FK MANQUANTES DÉTECTÉES: [X]
-- Ces FK ont été documentées mais non créées.
-- Raison possible: erreur Session cible ou FK oubliée.

-- FK-XXX-001: table.column → target_table.id
ALTER TABLE table 
  ADD CONSTRAINT fk_table_column
  FOREIGN KEY (column) REFERENCES target_table(id) ON DELETE [ACTION];

-- Répéter pour chaque FK manquante

-- ============================================
-- FIN DU FICHIER
-- ============================================
```

**Output:** `98_pending_fk.sql`

---

### ÉTAPE 2: Extraction Indexes (30 min)

**Process:**

1. **Extraire toutes les lignes INDEX documentées**
```bash
grep -h "^-- INDEX-" 0*.sql > indexes_documentes.txt

# Compter
wc -l indexes_documentes.txt
# Attendu: ~250-300 indexes
```

2. **Parser et générer SQL**

**Format extraction:**
```
-- INDEX-ADM-001: adm_members.tenant_id
-- TYPE: BTREE
-- WHERE: deleted_at IS NULL
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_members_tenant 
--      ON adm_members(tenant_id) WHERE deleted_at IS NULL;
```

3. **Regrouper par type**

**Générer `99_pending_indexes.sql`:**
```sql
-- ============================================
-- FLEETCORE V2 MIGRATION - PHASE 3: INDEXES
-- ============================================
-- Date: [DATE]
-- Total indexes: [X]
--   - BTREE: [Y]
--   - GIN: [Z]
--   - UNIQUE: [W]
-- ============================================


-- ============================================
-- SECTION 1: INDEXES BTREE (colonnes FK, tenant_id)
-- ============================================

-- Module: ADM
CREATE INDEX IF NOT EXISTS idx_adm_members_tenant 
  ON adm_members(tenant_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_adm_members_role 
  ON adm_members(default_role_id);

CREATE INDEX IF NOT EXISTS idx_adm_member_roles_member 
  ON adm_member_roles(member_id);

-- (Tous les indexes BTREE, regroupés par module)


-- ============================================
-- SECTION 2: INDEXES GIN (JSONB, Arrays)
-- ============================================

-- Module: ADM
CREATE INDEX IF NOT EXISTS idx_adm_tenants_metadata 
  ON adm_tenants USING GIN(metadata);

CREATE INDEX IF NOT EXISTS idx_adm_tenants_feature_flags 
  ON adm_tenants USING GIN(feature_flags);

-- (Tous les indexes GIN, regroupés par module)


-- ============================================
-- SECTION 3: INDEXES UNIQUE (avec deleted_at)
-- ============================================

-- Module: ADM
CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_members_unique_email
  ON adm_members(tenant_id, email, deleted_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_roles_unique_slug
  ON adm_roles(tenant_id, slug, deleted_at);

-- (Tous les indexes UNIQUE, regroupés par module)


-- ============================================
-- SECTION 4: VALIDATION
-- ============================================

-- Total indexes créés: [X]
--   - BTREE: [Y]
--   - GIN: [Z]
--   - UNIQUE: [W]

-- Vérifications:
-- [✓] Tous les noms en snake_case
-- [✓] Tous IF NOT EXISTS présents
-- [✓] Index sur toutes colonnes FK
-- [✓] Index sur tenant_id avec WHERE deleted_at IS NULL
-- [✓] Index GIN sur toutes colonnes JSONB
-- [✓] Index UNIQUE incluent deleted_at

-- ============================================
-- FIN DU FICHIER
-- ============================================
```

**Output:** `99_pending_indexes.sql`

---

### ÉTAPE 3: Validation Session 14 (20 min)

**Checklist validation:**

**Fichier 98_pending_fk.sql:**
- [ ] FK manquantes = 0 (cas normal)
- [ ] Si FK présentes: vérifier cohérence (module cible existe)
- [ ] Tous noms snake_case
- [ ] Tous ON DELETE spécifiés

**Fichier 99_pending_indexes.sql:**
- [ ] ~250-300 indexes générés
- [ ] Regroupés par type (BTREE, GIN, UNIQUE)
- [ ] Tous noms snake_case
- [ ] IF NOT EXISTS partout
- [ ] Index sur TOUTES colonnes FK
- [ ] Index sur tenant_id partout
- [ ] Index GIN sur toutes JSONB
- [ ] Index UNIQUE incluent deleted_at

**Validation manuelle (spot check):**
```bash
# Compter indexes
grep -c "CREATE INDEX" 99_pending_indexes.sql
# Vérifier ~250-300

# Vérifier snake_case
grep "CREATE.*INDEX" 99_pending_indexes.sql | grep -E "[A-Z]" | head -10
# Doit être vide (aucun PascalCase)

# Vérifier IF NOT EXISTS
grep "CREATE INDEX" 99_pending_indexes.sql | grep -v "IF NOT EXISTS" | wc -l
# Doit être 0

# Spot check 10 indexes aléatoires
grep "CREATE INDEX" 99_pending_indexes.sql | shuf | head -10
# Vérifier visuellement: syntax OK, noms cohérents
```

---

### ÉTAPE 4: Application Session 14 (5-10 min)

**Application FK (si présentes):**
```bash
psql -d fleetcore -f 98_pending_fk.sql

# Vérifier
echo $?
# Attendu: 0
```

**Application Indexes:**
```bash
psql -d fleetcore -f 99_pending_indexes.sql

# Vérifier
echo $?
# Attendu: 0

# Note: Création indexes peut prendre 2-5 min selon volume données
```

**Tests post-application:**
```bash
# Compter indexes
psql -d fleetcore -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public';"
# Vérifier augmentation ~250

# Lister quelques indexes
psql -d fleetcore -c "SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname;" | tail -30

# Vérifier performance (optionnel)
psql -d fleetcore -c "EXPLAIN ANALYZE SELECT * FROM adm_members WHERE tenant_id = (SELECT id FROM adm_tenants LIMIT 1) AND deleted_at IS NULL LIMIT 10;"
# Doit utiliser l'index idx_adm_members_tenant
```

**FIN DE PHASE 2** ✅

---

## 🔄 PHASE 3: VALIDATION GLOBALE (Session 15)

**Durée:** 25 minutes

**Acteur:** Claude Chat (moi)

---

### ÉTAPE 1: Génération Rapport Final (15 min)

**Process:**

1. **Analyser tous les fichiers générés**
```bash
cd docs/Migration\ v1\ -\>\ v2/sql/
ls -la *.sql

# Compter lignes totales
wc -l *.sql
```

2. **Extraire statistiques de chaque fichier**
```bash
# Pour chaque fichier, lire Section 8 (Gateway validation)
for f in 0*.sql; do
  echo "=== $f ==="
  grep -A 20 "^-- STATISTIQUES GÉNÉRÉES:" "$f"
done
```

3. **Compter DB actuelle**
```bash
# Tables
psql -d fleetcore -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Enums
psql -d fleetcore -c "SELECT COUNT(*) FROM pg_type WHERE typtype='e';"

# FK
psql -d fleetcore -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='public';"

# Indexes
psql -d fleetcore -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public';"
```

4. **Générer RAPPORT_FINAL.md**

**Template complet:**
```markdown
# RAPPORT FINAL - Migration SQL V1→V2 FleetCore

**Date:** [DATE]  
**Durée totale:** [X]h[Y]min  
**Sessions complétées:** 15/15  
**Statut:** ✅ SUCCÈS / ⚠️ AVEC RÉSERVES / ❌ ÉCHEC

---

## 📊 STATISTIQUES GLOBALES

### Attendu vs Généré

| Métrique | Attendu | Généré | Status |
|----------|---------|--------|--------|
| **Tables totales V2** | 99 | [X] | [✅/❌] |
| **Tables modifiées (ALTER)** | 55 | [Y] | [✅/❌] |
| **Tables nouvelles (CREATE)** | 44 | [Z] | [✅/❌] |
| **Enums créés** | ~120 | [W] | [✅/❌] |
| **FK créées** | ~500 | [A] | [✅/❌] |
| **Indexes créés** | ~250 | [B] | [✅/❌] |
| **Fichiers SQL** | 16 | [C] | [✅/❌] |

**STATUT GLOBAL:** [✅ CONFORME / ⚠️ ÉCARTS MINEURS / ❌ ÉCARTS MAJEURS]

---

## 📋 DÉTAILS PAR MODULE

### Module 00: SHARED

**Fichier:** `01_shared_enums.sql`  
**Session:** 0  
**Durée:** [X] min  
**Statut:** [✅/❌]

| Métrique | Attendu | Généré | Status |
|----------|---------|--------|--------|
| Enums créés | 5 | [X] | [✅/❌] |

**Enums créés:**
1. lifecycle_status
2. tenant_status
3. audit_severity
4. audit_category
5. performed_by_type

---

### Module 01: ADM (Administration)

**Fichier:** `02_adm_structure.sql`  
**Session:** 1  
**Durée:** [X] min  
**Statut:** [✅/❌]

| Métrique | Attendu | Généré | Status |
|----------|---------|--------|--------|
| Enums créés | 9 | [X] | [✅/❌] |
| Tables modifiées | 7 | [Y] | [✅/❌] |
| Nouvelles tables | 5 | [Z] | [✅/❌] |
| FK internes | 18 | [A] | [✅/❌] |
| FK externes | 0 | [B] | [✅/❌] |
| Indexes documentés | 25 | [C] | [✅/❌] |

**Tables modifiées:**
1. adm_tenants
2. adm_members
3. adm_roles
4. adm_member_roles
5. adm_audit_logs
6. adm_provider_employees
7. adm_tenant_lifecycle_events

**Nouvelles tables:**
1. adm_invitations
2. adm_role_permissions
3. adm_role_versions
4. adm_member_sessions
5. adm_tenant_settings

**Points d'attention:**
- [Copier depuis Section 8 du fichier]

---

[RÉPÉTER POUR LES 12 MODULES]

---

### Module 13: Agrégation FK/Indexes

**Fichiers:** `98_pending_fk.sql`, `99_pending_indexes.sql`  
**Session:** 14  
**Durée:** [X] min  
**Statut:** [✅/❌]

| Métrique | Attendu | Généré | Status |
|----------|---------|--------|--------|
| FK différées | 0 | [X] | [✅/❌] |
| Indexes BTREE | ~150 | [Y] | [✅/❌] |
| Indexes GIN | ~50 | [Z] | [✅/❌] |
| Indexes UNIQUE | ~50 | [W] | [✅/❌] |
| **Total indexes** | ~250 | [A] | [✅/❌] |

**FK différées:**
- [Liste si présentes]
- Aucune (cas normal)

---

## 🔍 VALIDATIONS GLOBALES

### ✅ Convention Nommage

**Vérification 100% snake_case:**
- [ ] Aucun nom de table en PascalCase détecté
- [ ] Aucun nom de colonne en camelCase détecté
- [ ] Aucun nom de constraint/index en PascalCase détecté

**Méthode vérification:**
```bash
grep -rE "(CREATE TABLE|ALTER TABLE|CREATE INDEX|ADD CONSTRAINT).*[A-Z]{2,}" *.sql
# Résultat: [Aucune ligne / X lignes détectées]
```

---

### ✅ Règles SQL

**Vérification opérations interdites:**
- [ ] Aucun DROP TABLE dans aucun fichier
- [ ] Aucun DROP COLUMN dans aucun fichier
- [ ] Aucun ALTER COLUMN TYPE dans aucun fichier
- [ ] Aucun RENAME dans aucun fichier

**Méthode vérification:**
```bash
grep -ri "DROP TABLE\|DROP COLUMN\|ALTER COLUMN TYPE\|RENAME" *.sql | grep -v "^--"
# Résultat: [Aucune ligne / X lignes détectées]
```

---

### ✅ Colonnes Obligatoires

**Vérification présence sur 99 tables:**

**Audit trail:**
- [ ] created_at présent sur 99/99 tables
- [ ] updated_at présent sur 99/99 tables
- [ ] deleted_at présent sur 99/99 tables
- [ ] created_by présent sur 99/99 tables
- [ ] updated_by présent sur 99/99 tables
- [ ] deleted_by présent sur 99/99 tables

**Metadata:**
- [ ] metadata JSONB présent sur 99/99 tables

**Tenant isolation:**
- [ ] tenant_id présent sur 95/99 tables (sauf 4 référentiels DIR globaux)

**Méthode vérification:**
```bash
# Pour chaque table, vérifier présence colonnes
psql -d fleetcore -c "
SELECT 
  t.table_name,
  CASE WHEN c1.column_name IS NOT NULL THEN '✓' ELSE '✗' END AS created_at,
  CASE WHEN c2.column_name IS NOT NULL THEN '✓' ELSE '✗' END AS updated_at,
  CASE WHEN c3.column_name IS NOT NULL THEN '✓' ELSE '✗' END AS deleted_at,
  CASE WHEN c4.column_name IS NOT NULL THEN '✓' ELSE '✗' END AS metadata,
  CASE WHEN c5.column_name IS NOT NULL THEN '✓' ELSE 'N/A' END AS tenant_id
FROM information_schema.tables t
LEFT JOIN information_schema.columns c1 
  ON t.table_name = c1.table_name AND c1.column_name = 'created_at'
LEFT JOIN information_schema.columns c2 
  ON t.table_name = c2.table_name AND c2.column_name = 'updated_at'
LEFT JOIN information_schema.columns c3 
  ON t.table_name = c3.table_name AND c3.column_name = 'deleted_at'
LEFT JOIN information_schema.columns c4 
  ON t.table_name = c4.table_name AND c4.column_name = 'metadata'
LEFT JOIN information_schema.columns c5 
  ON t.table_name = c5.table_name AND c5.column_name = 'tenant_id'
WHERE t.table_schema = 'public'
ORDER BY t.table_name;
"
```

---

### ✅ Foreign Keys

**Vérification intégrité:**
- [ ] Toutes les FK ont ON DELETE spécifié
- [ ] Toutes les FK ont ON UPDATE spécifié
- [ ] Aucune FK vers table inexistante

**Méthode vérification:**
```bash
# Lister toutes les FK
psql -d fleetcore -c "
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
"

# Vérifier aucune règle NULL
```

---

### ✅ Indexes

**Vérification couverture:**
- [ ] Index sur toutes les colonnes FK
- [ ] Index sur tenant_id sur toutes tables
- [ ] Index GIN sur toutes colonnes JSONB
- [ ] Index UNIQUE incluent deleted_at

**Méthode vérification:**
```bash
# Lister tous les indexes
psql -d fleetcore -c "
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"

# Comparer avec colonnes FK
# Vérifier tenant_id indexé partout
```

---

## ⚠️ POINTS D'ATTENTION GLOBAUX

### Tables Supprimées V1→V2

**rid_driver_languages (V1)**
- Statut: Supprimée en V2
- Raison: Fonctionnalité migrée vers rid_drivers.languages (JSONB/Array)
- Migration données: [À planifier si nécessaire]
- Impact: [Aucun si colonne languages créée en rid_drivers]

---

### FK Circulaires

**Détectées:** [Aucune / Liste]

**Résolution:** [N/A / Description]

---

### Anomalies Détectées

**[Liste toute anomalie détectée durant les 15 sessions]**

Exemple:
- Session 5 (BIL): Table bil_promotions manquait colonne `max_redemptions` (corrigé)
- Session 8 (FLT): FK vers rid_drivers oubliée (créée dans 98_pending_fk.sql)

---

## 📋 CHECKLIST VALIDATION HUMAINE

**Avant mise en production, vérifier:**

### Validation Rapide (15 min)

- [ ] Lire ce rapport RAPPORT_FINAL.md en entier
- [ ] Vérifier statistiques: 55 modifiées + 44 nouvelles = 99 total
- [ ] Vérifier statut global = ✅ CONFORME
- [ ] Vérifier aucune erreur dans "Points d'attention"
- [ ] Vérifier tous checkboxes "Validations" sont ✅

### Validation Détaillée Fichiers Critiques (30 min)

- [ ] Ouvrir et lire `02_adm_structure.sql` (base critique)
- [ ] Ouvrir et lire `03_dir_structure.sql` (référentiels)
- [ ] Ouvrir et lire `09_flt_structure.sql` (module le plus gros)
- [ ] Ouvrir et lire `13_fin_structure.sql` (finance critique)
- [ ] Spot check 10 FK aléatoires dans `98_pending_fk.sql`
- [ ] Spot check 20 indexes aléatoires dans `99_pending_indexes.sql`

### Tests Fonctionnels (30 min)

- [ ] Requête simple chaque module:
```bash
psql -d fleetcore -c "SELECT COUNT(*) FROM adm_tenants;"
psql -d fleetcore -c "SELECT COUNT(*) FROM dir_platforms;"
psql -d fleetcore -c "SELECT COUNT(*) FROM flt_vehicles;"
# ... etc pour chaque module
```

- [ ] Test FK:
```bash
# Insérer tenant test
psql -d fleetcore -c "
INSERT INTO adm_tenants (id, name, status, created_at, updated_at, metadata) 
VALUES (gen_random_uuid(), 'Test Tenant', 'trialing', NOW(), NOW(), '{}'::jsonb)
RETURNING id;
"

# Insérer member lié
psql -d fleetcore -c "
INSERT INTO adm_members (id, tenant_id, email, created_at, updated_at, metadata)
VALUES (gen_random_uuid(), '[tenant_id]', 'test@example.com', NOW(), NOW(), '{}'::jsonb)
RETURNING id;
"

# Vérifier FK fonctionne
psql -d fleetcore -c "
SELECT m.email, t.name 
FROM adm_members m
JOIN adm_tenants t ON m.tenant_id = t.id
WHERE m.email = 'test@example.com';
"

# Cleanup
psql -d fleetcore -c "DELETE FROM adm_members WHERE email='test@example.com';"
psql -d fleetcore -c "DELETE FROM adm_tenants WHERE name='Test Tenant';"
```

- [ ] Test soft delete:
```bash
# Marquer tenant comme deleted
psql -d fleetcore -c "
UPDATE adm_tenants 
SET deleted_at = NOW(), deleted_by = NULL, deletion_reason = 'Test'
WHERE name = 'Test Tenant'
RETURNING id;
"

# Vérifier exclus des requêtes actives
psql -d fleetcore -c "
SELECT COUNT(*) FROM adm_tenants WHERE deleted_at IS NULL;
"
```

- [ ] Test performance index:
```bash
psql -d fleetcore -c "
EXPLAIN ANALYZE 
SELECT * FROM adm_members 
WHERE tenant_id = '[random_tenant_id]' 
  AND deleted_at IS NULL 
LIMIT 10;
"
# Vérifier utilise index idx_adm_members_tenant
```

---

## 🚀 ORDRE D'APPLICATION RECOMMANDÉ

**Si migration complète à refaire (rollback complet):**

### Option A: Application Progressive (Recommandée)

```bash
cd docs/Migration\ v1\ -\>\ v2/sql/

# Phase 1: Structures (progressif, valider après chaque)
psql -d fleetcore -f 01_shared_enums.sql
psql -d fleetcore -f 02_adm_structure.sql
psql -d fleetcore -f 03_dir_structure.sql
psql -d fleetcore -f 04_doc_structure.sql
psql -d fleetcore -f 05_crm_structure.sql
psql -d fleetcore -f 06_bil_structure.sql
psql -d fleetcore -f 07_sup_structure.sql
psql -d fleetcore -f 08_rid_structure.sql
psql -d fleetcore -f 09_flt_structure.sql
psql -d fleetcore -f 10_sch_structure.sql
psql -d fleetcore -f 11_trp_structure.sql
psql -d fleetcore -f 12_rev_structure.sql
psql -d fleetcore -f 13_fin_structure.sql

# Phase 2: FK/Indexes
psql -d fleetcore -f 98_pending_fk.sql
psql -d fleetcore -f 99_pending_indexes.sql
```

**Avantage:** Rollback facile si erreur

---

### Option B: Application Monobloc (Déconseillée)

```bash
cd docs/Migration\ v1\ -\>\ v2/sql/

# Tout d'un coup
cat 01_*.sql 02_*.sql 03_*.sql 04_*.sql 05_*.sql 06_*.sql 07_*.sql 08_*.sql 09_*.sql 10_*.sql 11_*.sql 12_*.sql 13_*.sql 98_*.sql 99_*.sql > migration_complete.sql

psql -d fleetcore -f migration_complete.sql
```

**Désavantage:** Si erreur, dur de localiser

---

## 🔄 PROCHAINES ÉTAPES

### Étape 1: Mise à jour schema.prisma

**Après validation migration SQL OK:**

1. **Remplacer schema.prisma par version modulaire:**
```bash
cd /chemin/vers/fleetcore

# Backup V1 (si pas déjà fait)
cp prisma/schema.prisma prisma/schema.prisma.v1.backup

# Créer nouveau schema.prisma principal
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Imports modules
import { * } from "./modules/shared.prisma"
import { * } from "./modules/adm.prisma"
import { * } from "./modules/dir.prisma"
import { * } from "./modules/crm.prisma"
import { * } from "./modules/doc.prisma"
import { * } from "./modules/bil.prisma"
import { * } from "./modules/sup.prisma"
import { * } from "./modules/rid.prisma"
import { * } from "./modules/flt.prisma"
import { * } from "./modules/sch.prisma"
import { * } from "./modules/trp.prisma"
import { * } from "./modules/rev.prisma"
import { * } from "./modules/fin.prisma"
EOF

# Copier modules .prisma
mkdir -p prisma/modules
cp /chemin/vers/fichiers/*.prisma prisma/modules/

# Valider
npx prisma validate

# Générer client
npx prisma generate
```

2. **Tester client Prisma:**
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  // Test simple
  const tenants = await prisma.admTenant.findMany({
    take: 10
  })
  console.log('Tenants:', tenants.length)
  
  // Test FK
  const membersWithTenant = await prisma.admMember.findMany({
    include: { tenant: true },
    take: 5
  })
  console.log('Members with tenant:', membersWithTenant)
}

test()
```

3. **Commit:**
```bash
git add prisma/
git commit -m "feat(prisma): Update schema to V2 modular structure

- 99 tables total (55 modified, 44 new)
- 12 modules (ADM, DIR, CRM, DOC, BIL, SUP, RID, FLT, SCH, TRP, REV, FIN)
- ~500 FK, ~250 indexes, ~120 enums
- Status: ✅ SQL migration applied and tested"
```

---

### Étape 2: Tests Intégration

**Tester app complète:**
- [ ] Démarrer serveur dev
- [ ] Tester routes API principales
- [ ] Vérifier auth/permissions
- [ ] Tester créations/modifications/suppressions
- [ ] Vérifier soft delete fonctionne
- [ ] Tester requêtes complexes multi-FK

---

### Étape 3: Documentation

**Mettre à jour documentation projet:**
- [ ] README.md (mentionner V2)
- [ ] CHANGELOG.md (lister changements V1→V2)
- [ ] API docs (si colonnes modifiées)
- [ ] ERD (Entity Relationship Diagram) V2

---

### Étape 4: Déploiement Production

**Checklist pré-déploiement:**
- [ ] Backup DB production récent
- [ ] Tests intégration OK
- [ ] Prisma generate OK
- [ ] Migration SQL testée sur staging
- [ ] Rollback plan prêt
- [ ] Downtime communiqué
- [ ] Monitoring actif

**Application production:**
```bash
# Backup prod
pg_dump production_db > backup_prod_avant_v2_$(date +%Y%m%d_%H%M%S).sql

# Appliquer migration
psql -d production_db -f docs/Migration\ v1\ -\>\ v2/sql/01_*.sql
# ... (tous les fichiers)

# Vérifier
psql -d production_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
# Attendu: 99

# Redémarrer app
pm2 restart fleetcore

# Monitorer logs
pm2 logs fleetcore --lines 100
```

---

## 📝 NOTES FINALES

### Temps Total Réel

**Phase 1 (Structures):** [X]h[Y]min (Estimé: 5h25)  
**Phase 2 (Agrégation):** [X]h[Y]min (Estimé: 1h20)  
**Phase 3 (Validation):** [X]h[Y]min (Estimé: 25min)  
**Imprévus/Corrections:** [X]h[Y]min (Estimé: 1h25)

**TOTAL:** [X]h[Y]min (Estimé: 8h36)

**Écart estimé vs réel:** [+/-X]h[Y]min

---

### Sessions Problématiques

**[Liste des sessions ayant rencontré des problèmes]**

Exemple:
- Session 8 (FLT): FK vers rid_drivers oubliée, corrigée en Session 14
- Session 12 (FIN): Timeout lors création indexes (table grosse), réessai OK

---

### Recommandations Futures

**Pour prochaines migrations:**
1. [Recommandation 1]
2. [Recommandation 2]
3. [Recommandation 3]

---

**Document généré le:** [DATE HEURE]  
**Par:** Claude Assistant  
**Pour:** FleetCore Migration V1→V2  
**Statut final:** [✅ MIGRATION RÉUSSIE]
```

**Output:** `RAPPORT_FINAL.md`

---

### ÉTAPE 2: Validation Rapport (10 min)

**Lecture utilisateur:**
- [ ] Lire rapport complet (15 min)
- [ ] Vérifier statistiques globales
- [ ] Vérifier tous modules ✅
- [ ] Lire points d'attention
- [ ] Lire anomalies détectées
- [ ] Lire checklist validation

**Si anomalies majeures → Investiguer et corriger**  
**Si anomalies mineures → Documenter pour correction post-migration**  
**Si tout OK → MIGRATION VALIDÉE**

---

**FIN DU PLAN DÉTAILLÉ**

---

## 🛡️ GESTION D'ERREURS ET ROLLBACK

### Rollback Session N

**Si erreur durant Session N:**

```bash
# 1. Identifier tables créées dans cette session
grep "CREATE TABLE" 0N_module_structure.sql | awk '{print $5}' | sed 's/IF//' | sed 's/NOT//' | sed 's/EXISTS//'

# 2. Supprimer tables créées (CASCADE pour FK)
psql -d fleetcore -c "DROP TABLE IF EXISTS nouvelle_table1 CASCADE;"
psql -d fleetcore -c "DROP TABLE IF EXISTS nouvelle_table2 CASCADE;"

# 3. Supprimer enums créés
grep "CREATE TYPE" 0N_module_structure.sql | awk '{print $3}'
psql -d fleetcore -c "DROP TYPE IF EXISTS enum1 CASCADE;"

# 4. Vérifier état DB
psql -d fleetcore -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
# Doit correspondre à avant Session N

# 5. Corriger fichier SQL
# Éditer 0N_module_structure.sql pour corriger erreur

# 6. Réappliquer
psql -d fleetcore -f 0N_module_structure.sql
```

---

### Rollback Complet V1

**Si problème critique après toutes les sessions:**

```bash
# 1. Restaurer backup
psql -d fleetcore < backup_prod_avant_v2_[date].sql

# 2. Vérifier restauration
psql -d fleetcore -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
# Doit être 56 (V1)

# 3. Restaurer schema.prisma V1
cp prisma/schema.prisma.v1.backup prisma/schema.prisma

# 4. Régénérer client
npx prisma generate

# 5. Redémarrer app
pm2 restart fleetcore
```

---

## 📞 SUPPORT ET RÉFÉRENCES

### Fichiers Clés

**Documentation:**
- RANKING_DEPENDENCIES_SQL.md
- TABLES_V1_VS_V2_COMPARAISON.md
- Ce document (PLAN_MIGRATION_SQL_REFERENCE_COMPLETE.md)

**Fichiers Prisma:**
- prisma/schema.prisma (V1 actuel)
- /mnt/user-data/uploads/*.prisma (V2 modules)

**Fichiers générés:**
- docs/Migration v1 -> v2/sql/ (tous les SQL)
- notes_session_N.md (optionnel, par session)

---

### Commandes Utiles

**Prisma:**
```bash
npx prisma validate
npx prisma format
npx prisma generate
npx prisma db execute --stdin <<< "SELECT 1;"
```

**PostgreSQL:**
```bash
psql -d fleetcore -c "\dt"  # Lister tables
psql -d fleetcore -c "\dT"  # Lister enums
psql -d fleetcore -c "\d table_name"  # Détails table
```

**Git:**
```bash
git status
git log --oneline -10
git diff prisma/
```

---

## ✅ CHECKLIST FINALE

**Avant de commencer:**
- [ ] Document lu en entier
- [ ] Environnement technique prêt (Node, psql, etc.)
- [ ] Fichiers .prisma disponibles
- [ ] Backup DB créé
- [ ] Git propre

**Après Phase 1 (Session 12):**
- [ ] 13 fichiers SQL générés
- [ ] Tous appliqués sans erreur
- [ ] 99 tables en DB
- [ ] ~18 FK créées

**Après Phase 2 (Session 14):**
- [ ] 98_pending_fk.sql généré
- [ ] 99_pending_indexes.sql généré
- [ ] Appliqués sans erreur
- [ ] ~500 FK totales
- [ ] ~250 indexes totaux

**Après Phase 3 (Session 15):**
- [ ] RAPPORT_FINAL.md généré
- [ ] Lu et validé
- [ ] Tous checks ✅
- [ ] Anomalies documentées
- [ ] Migration déclarée SUCCÈS

**Post-migration:**
- [ ] schema.prisma mis à jour
- [ ] Prisma client régénéré
- [ ] Tests intégration OK
- [ ] Documentation mise à jour
- [ ] Prêt pour production

---

**🎉 FIN DU DOCUMENT DE RÉFÉRENCE 🎉**

**Ce document est LA source de vérité pour les prochaines 8-10 heures.**

**Bonne migration ! 🚀**
