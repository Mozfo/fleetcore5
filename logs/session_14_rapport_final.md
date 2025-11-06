# RAPPORT SESSION 14 - MIGRATION DONNÉES V1→V2

**Date**: 05 novembre 2025
**Durée estimée**: < 1 seconde
**Criticité**: HAUTE (données production)

---

## 📊 RÉSUMÉ EXÉCUTIF

### Tables analysées
- **Total**: 9 tables avec données (102 lignes)
- **Avec migration**: 5 tables (59 lignes)
- **Sans migration**: 4 tables (43 lignes)

### Migrations effectuées
- **Total**: 10 migrations
- **Haute priorité**: 3 migrations (19 lignes)
- **Moyenne priorité**: 7 migrations (40 lignes)

### Stratégie
- **Transaction**: Unique (ROLLBACK complet si erreur)
- **Exécution**: Séquentielle par priorité
- **Validations**: 6 vérifications automatiques

---

## 📋 DÉTAIL DES TABLES

### ✅ TABLES AVEC MIGRATION (5 tables, 10 migrations)

#### 1. **CRM_LEADS** (3 lignes) - 🔴 HAUTE PRIORITÉ

**Données avant migration**:
```sql
id: 770e8400-e29b-41d4-a716-446655440001
full_name: "Hassan Abdullah"
first_name: NULL  ← À REMPLIR
last_name: NULL   ← À REMPLIR
demo_company_name: "Emirates Fleet Services"
company_name: NULL  ← À REMPLIR
```

**Migrations**:

**MIGRATION 5**: `full_name` → `first_name` + `last_name` (SPLIT)
```sql
UPDATE crm_leads
SET
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
WHERE first_name IS NULL AND full_name LIKE '% %';
```
- **Résultats**:
  - "Hassan Abdullah" → first="Hassan", last="Abdullah"
  - "Jean-Pierre Martin" → first="Jean-Pierre", last="Martin"
  - "Fatima Al-Rashid" → first="Fatima", last="Al-Rashid"
- **Impact**: 3 lignes

**MIGRATION 6**: `demo_company_name` → `company_name` (COPIE)
```sql
UPDATE crm_leads
SET company_name = demo_company_name
WHERE company_name IS NULL AND demo_company_name IS NOT NULL;
```
- **Impact**: 3 lignes

---

#### 2. **DIR_CAR_MAKES** (16 lignes) - 🔴 HAUTE PRIORITÉ

**Problème identifié**: 15/16 lignes ont `tenant_id` NULL

**Données avant migration**:
```sql
total_rows: 16
has_tenant_id: 1
null_tenant_id: 15  ← CRITIQUE!
```

**MIGRATION 7**: Assigner `tenant_id` NULL au tenant système
```sql
UPDATE dir_car_makes
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE tenant_id IS NULL;
```
- **Tenant système**:
  - id: `00000000-0000-0000-0000-000000000000`
  - name: "System"
  - country_code: "AE"
- **Impact**: 15 lignes

**Raison des NULL**: Données seed/test créées avant ajout de `tenant_id` obligatoire

---

#### 3. **ADM_TENANTS** (8 lignes) - 🟡 MOYENNE PRIORITÉ

**Données avant migration**:
```sql
name: "Dubai Fleet Operations"
subdomain: NULL  ← À GÉNÉRER
primary_contact_email: NULL  ← À RÉCUPÉRER
```

**MIGRATION 3**: Générer `subdomain` depuis `name` (CALCUL)
```sql
UPDATE adm_tenants
SET subdomain = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE subdomain IS NULL;
```
- **Exemples**:
  - "Dubai Fleet Operations" → "dubai-fleet-operations"
  - "FleetCore Test Organization" → "fleetcore-test-organization"
- **Impact**: 8 lignes

**MIGRATION 4**: `primary_contact_email` depuis premier admin (COPIE)
```sql
UPDATE adm_tenants t
SET primary_contact_email = (
  SELECT m.email FROM adm_members m
  WHERE m.tenant_id = t.id
    AND m.role = 'admin'
    AND m.deleted_at IS NULL
  ORDER BY m.created_at ASC
  LIMIT 1
)
WHERE t.primary_contact_email IS NULL;
```
- **Impact**: Dépend du nombre de tenants avec admins (max 8 lignes)

---

#### 4. **ADM_MEMBERS** (30 lignes) - 🟡 MOYENNE PRIORITÉ

**Distribution tenants**:
```
AE (UAE): 7 tenants
FR (France): 1 tenant
```

**MIGRATION 1**: Assigner `default_role_id` pour tenant CI (FIX)
```sql
UPDATE adm_members
SET default_role_id = 'aef858a5-b42a-437b-aefa-d8e6f01d71f5'
WHERE default_role_id IS NULL
  AND tenant_id = 'bfea0f9d-2ae3-42cc-8506-7ce1ed4c67bb';
```
- **Impact**: 1 ligne (membre du tenant CI)

**MIGRATION 2**: Déduire `preferred_language` depuis `tenant.country_code` (CALCUL)
```sql
UPDATE adm_members m
SET preferred_language = CASE
  WHEN t.country_code = 'AE' THEN 'en'
  WHEN t.country_code = 'FR' THEN 'fr'
  ELSE 'en'
END
FROM adm_tenants t
WHERE m.tenant_id = t.id AND m.preferred_language IS NULL;
```
- **Mapping**: AE→'en', FR→'fr'
- **Impact**: 30 lignes

---

#### 5. **FLT_VEHICLES** (1 ligne) - 🟡 MOYENNE PRIORITÉ

**MIGRATION 8**: `seats` → `passenger_capacity` (COPIE)
```sql
UPDATE flt_vehicles
SET passenger_capacity = seats
WHERE passenger_capacity IS NULL AND seats IS NOT NULL;
```
- **Impact**: 1 ligne

**MIGRATION 9**: `country_code` depuis tenant (COPIE)
```sql
UPDATE flt_vehicles v
SET country_code = t.country_code
FROM adm_tenants t
WHERE v.tenant_id = t.id AND v.country_code IS NULL;
```
- **Impact**: 1 ligne

---

#### 6. **RID_DRIVERS** (1 ligne) - 🟡 MOYENNE PRIORITÉ

**Données avant migration**:
```sql
first_name: "Test"
last_name: "Driver"
full_name: NULL  ← À GÉNÉRER
```

**MIGRATION 10**: `first_name` + `last_name` → `full_name` (CONCAT)
```sql
UPDATE rid_drivers
SET full_name = CONCAT(first_name, ' ', last_name)
WHERE full_name IS NULL
  AND first_name IS NOT NULL
  AND last_name IS NOT NULL;
```
- **Résultat**: "Test Driver"
- **Impact**: 1 ligne

**Note**: Direction inverse de CRM_LEADS (voulu selon source de données)

---

### ✅ TABLES SANS MIGRATION (4 tables, 43 lignes)

#### 1. **ADM_AUDIT_LOGS** (41 lignes) - ✅ OK

**Raison**: Colonnes V2 nouvelles ou optionnelles
```
ip_address: 12/41 remplis (optionnel)
user_agent: 11/41 remplis (optionnel)
Nouveaux V2: session_id, request_id, old_values, new_values, retention_until
```

#### 2. **ADM_ROLES** (1 ligne) - ✅ OK

**Raison**: Colonnes V2 déjà remplies
```
slug: "test-admin-role" ✅
is_system: false ✅
is_default: false ✅
approval_required: false ✅
Nouveaux V2 optionnels: parent_role_id, max_members, valid_from, valid_until
```

#### 3. **DIR_CAR_MODELS** (1 ligne) - ✅ OK

**Raison**: Colonnes V2 entièrement nouvelles
```
Nouveaux V2: vehicle_class_id, code, year_start/end, body_type,
             fuel_type, transmission, dimensions
Pas d'équivalent V1 pour remplir
```

---

## 🔍 RÉPONSES AUX 6 QUESTIONS CRITIQUES

### 1️⃣ Tables sans migration
**Question**: 4 tables sur 9 sans migration - pourquoi?

**Réponse**: ✅ **OPTION A CONFIRMÉE**
- Ces tables n'ont pas de colonnes V2 à remplir depuis V1
- Colonnes V2 soit nouvelles, soit optionnelles, soit déjà remplies

---

### 2️⃣ Tenant système
**Question**: Existe-t-il? Faut-il le créer?

**Réponse**: ✅ **EXISTE DÉJÀ**
```
id: 00000000-0000-0000-0000-000000000000
name: "System"
country_code: "AE"
default_currency: "AED"
```
**Action**: Utilisation directe pour les 15 lignes `dir_car_makes` NULL

---

### 3️⃣ Split full_name (3+ mots)
**Question**: Comment gérer "Hassan Abdullah Al-Maktoum"?

**Réponse**: ✅ **STRATÉGIE ROBUSTE**
```sql
first_name = SPLIT_PART(full_name, ' ', 1)      -- Premier mot
last_name = SUBSTRING(...POSITION(' ')...)      -- Tout le reste
```
**Exemples**:
- "Hassan Abdullah Al-Maktoum" → first="Hassan", last="Abdullah Al-Maktoum"
- "Jean-Pierre Martin" → first="Jean-Pierre", last="Martin"

**Données réelles**: Tous les 3 leads ont 2 mots → Stratégie validée

---

### 4️⃣ Country_code des tenants
**Question**: Quels pays? Mapping complet?

**Réponse**: ✅ **MAPPING COMPLET VALIDÉ**
```
AE (UAE): 7 tenants → 'en'
FR (France): 1 tenant → 'fr'
```
**Couverture**: 100% des 8 tenants

---

### 5️⃣ Direction CRM vs RID
**Question**: Pourquoi direction inverse?

**Réponse**: ✅ **VOULU - SELON SOURCE**
- **CRM**: Formulaire public 1 champ → SPLIT nécessaire
- **RID**: Formulaire interne 2 champs → CONCAT nécessaire

---

### 6️⃣ Transaction unique ou par module?
**Question**: Quelle stratégie?

**Réponse**: ✅ **TRANSACTION UNIQUE**
```sql
BEGIN;
  -- 10 migrations
COMMIT;
```
**Raisons**:
1. Intégrité (FK liées)
2. Volume faible (102 lignes)
3. Sécurité (tout-ou-rien)
4. Simplicité (1 ROLLBACK)

---

## ✅ VALIDATIONS INCLUSES

Le script effectue 6 vérifications automatiques:

### 1. Intégrité lignes (AVANT/APRÈS)
```sql
SELECT table_name, before, after, diff
FROM counts_comparison
WHERE diff != 0;
```
**Résultat attendu**: 0 lignes (aucune perte)

### 2. CRM_LEADS
```sql
-- first_name NULL avec full_name rempli
-- company_name NULL avec demo_company_name rempli
```
**Résultat attendu**: 0 lignes

### 3. DIR_CAR_MAKES
```sql
-- tenant_id NULL
```
**Résultat attendu**: 0 lignes (15 assignés au tenant système)

### 4. FLT_VEHICLES
```sql
-- passenger_capacity NULL avec seats rempli
-- country_code NULL
```
**Résultat attendu**: 0 lignes

### 5. RID_DRIVERS
```sql
-- full_name NULL avec first_name+last_name remplis
```
**Résultat attendu**: 0 lignes

### 6. Validation globale
```sql
IF v_total_errors > 0 THEN
  RAISE EXCEPTION 'Migration incomplète - ROLLBACK';
END IF;
```
**Action**: ROLLBACK automatique si 1+ erreur

---

## 📈 STATISTIQUES FINALES

### Par priorité
| Priorité | Tables | Migrations | Lignes |
|----------|--------|------------|--------|
| 🔴 HAUTE | 2 | 3 | 19 |
| 🟡 MOYENNE | 4 | 7 | 40 |
| **Total** | **6** | **10** | **59** |

### Par type de transformation
| Type | Migrations | Exemples |
|------|------------|----------|
| COPIE | 4 | `demo_company_name → company_name` |
| SPLIT | 1 | `full_name → first_name + last_name` |
| CONCAT | 1 | `first_name + last_name → full_name` |
| CALCUL | 2 | `name → subdomain`, `country_code → preferred_language` |
| FIX | 2 | `NULL → tenant_id système`, `NULL → default_role_id` |

### Par module
| Module | Tables | Migrations | Lignes |
|--------|--------|------------|--------|
| CRM | 1 | 2 | 3 |
| DIR | 1 | 1 | 15 |
| ADM | 2 | 4 | 38 |
| FLT | 1 | 2 | 1 |
| RID | 1 | 1 | 1 |

---

## 🚀 INSTRUCTIONS D'EXÉCUTION

### Prérequis
1. **Backup obligatoire**:
```bash
cd /Users/mohamedfodil/Documents/fleetcore_backups
pg_dump 'postgresql://postgres.joueofbaqjkrpjcailkx:jeXP1Ht3PzRlw8TH@aws-1-eu-central-2.pooler.supabase.com:5432/postgres' \
  > backup_before_session_14_$(date +%Y%m%d_%H%M%S).sql
gzip backup_before_session_14_*.sql
```

2. **Vérifier connexion**:
```bash
psql 'postgresql://postgres.joueofbaqjkrpjcailkx:jeXP1Ht3PzRlw8TH@aws-1-eu-central-2.pooler.supabase.com:5432/postgres' -c "SELECT NOW();"
```

### Exécution
```bash
cd /Users/mohamedfodil/Documents/fleetcore5
psql 'postgresql://postgres.joueofbaqjkrpjcailkx:jeXP1Ht3PzRlw8TH@aws-1-eu-central-2.pooler.supabase.com:5432/postgres' \
  -f scripts/session_14_data_migration.sql \
  > logs/session_14_execution_$(date +%Y%m%d_%H%M%S).log 2>&1
```

### Vérification post-exécution
```bash
# 1. Vérifier succès
grep -i "migration complétée" logs/session_14_execution_*.log

# 2. Vérifier aucune erreur
grep -i "error\|warning" logs/session_14_execution_*.log

# 3. Compter lignes migrées
psql ... -c "SELECT COUNT(*) FROM crm_leads WHERE first_name IS NOT NULL;"
```

---

## ⚠️ EN CAS D'ERREUR

### Si ROLLBACK automatique
Le script inclut `\set ON_ERROR_STOP on` et validations finales.

**Erreur détectée** → `RAISE EXCEPTION` → `ROLLBACK` automatique

**Actions**:
1. Lire le log d'erreur
2. Identifier la cause
3. Corriger le script SQL
4. Ré-exécuter

### Si erreur manuelle
```sql
-- Si déjà dans transaction
ROLLBACK;

-- Restaurer backup
psql ... < backup_before_session_14_YYYYMMDD_HHMMSS.sql
```

---

## 📋 CHECKLIST POST-MIGRATION

- [ ] Backup créé avant exécution
- [ ] Script exécuté sans erreur
- [ ] Log vérifié (0 WARNING, 0 ERROR)
- [ ] Colonnes V2 remplies (6 vérifications OK)
- [ ] Comptage lignes identique (AVANT = APRÈS)
- [ ] Session 15 (Indexes) prête à lancer

---

## 🎯 PROCHAINES ÉTAPES

### Session 15: Indexes Soft Delete
```sql
-- Créer indexes partiels WHERE deleted_at IS NULL
-- Pour toutes les tables multi-tenant
```

### Session 16: Cleanup V1
```sql
-- DROP colonnes V1 obsolètes
-- RENAME colonnes _v2 → nom final
```

---

**FIN DU RAPPORT SESSION 14**
