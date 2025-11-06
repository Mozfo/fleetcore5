# MIGRATION FLEETCORE V1 → V2

**Stratégie globale** : Migration progressive en 16 sessions avec coexistence V1/V2

---

## 📋 STRUCTURE DE LA MIGRATION

### Sessions 0-13 : Migrations Structurelles (1 module par session)

**Fichiers SQL** : `sql/XX_module_structure.sql`

| Session | Module | Statut | Fichier SQL | Tables | Enums |
|---------|--------|--------|-------------|--------|-------|
| 0 | SHARED | ✅ Complété | `01_shared_enums.sql` | - | 5 |
| 1 | ADM (Admin) | ✅ Complété | `02_adm_structure.sql` | 12 | ~18 |
| 2 | DIR (Directory) | ✅ Complété | `03_dir_structure.sql` | 12 | ~15 |
| 3 | DOC (Documents) | ✅ Complété | `04_doc_structure.sql` | 4 | ~8 |
| 4 | CRM (Customer Rel.) | ✅ Complété | `05_crm_structure.sql` | 7 | ~12 |
| 5 | BIL (Billing) | ✅ Complété | `06_bil_structure.sql` | 9 | ~15 |
| 6 | SUP (Support) | ✅ Complété | `07_sup_structure.sql` | 6 | ~10 |
| 7 | RID (Rideshare Drivers) | ✅ Complété | `08_rid_structure.sql` | 7 | ~20 |
| 8 | FLT (Fleet Mgmt) | ✅ Complété | `09_flt_structure.sql` | 8 | ~30 |
| 9 | SCH (Scheduling) | ✅ Complété | `10_sch_structure.sql` | 11 | ~25 |
| 10 | TRP (Transport/Rides) | ✅ Complété | `12_trp_structure.sql` | 6 | ~20 |
| 11 | REV (Revenue) | 📋 À faire | `12_rev_structure.sql` | 4 | ~12 |
| 12 | FIN (Finance) | 📋 À faire | `13_fin_structure.sql` | 11 | ~35 |

---

## 📚 DOCUMENTS DE RÉFÉRENCE

### [Session 14 - Migration Données V1→V2](./SESSION_14_DATA_MIGRATION.md)

**Objectif** : Remplir les colonnes V2 avec les données migrées depuis V1

**Modules traités** : ADM, CRM, DOC, DIR, BIL, SUP, RID, FLT, SCH, TRP (10 modules)

**Contenu** :
- Actions SQL de migration par module et par table
- Calcul automatique de valeurs dérivées
- Extraction depuis metadata JSON
- Inférence intelligente depuis données existantes
- Valeurs par défaut pour nouveaux champs

---

### [Session 15 - Indexes avec Soft Delete](./SESSION_15_INDEXES.md)

**Objectif** : Créer les indexes UNIQUE avec clause `WHERE deleted_at IS NULL`

**Problème** : Prisma ne supporte pas `WHERE` clause dans `@@unique`

**Solution** : Création manuelle d'indexes PostgreSQL

**Modules concernés** : CRM, DOC, DIR, BIL, SUP, RID

---

### [Session 16 - Cleanup Colonnes V1](./SESSION_16_CLEANUP.md)

**Objectif** : Suppression des colonnes V1 obsolètes et RENAME des colonnes `_v2`

**⚠️ IMPORTANT** : Le suffix `_v2` est TEMPORAIRE pour coexistence V1/V2!

**Phases** :
1. DROP colonnes V1 obsolètes
2. RENAME colonnes `_v2` → enlever suffix (36 colonnes BIL, SUP, RID, SCH, TRP)
3. Validation données et tests

---

### [Guide d'Extension - Plateformes de Transport](./PLATFORM_PLUGIN_GUIDE.md)

**Objectif** : Permettre l'ajout dynamique de TOUTES plateformes de transport

**Contexte** : La table `dir_platforms` est **100% extensible** (aucun hardcode)

**Contenu** :
- Architecture sans enum plateforme → ajout dynamique sans migration
- Configuration API flexible via JSONB (api_config, metadata)
- Exemples: InDrive, Lyft, DiDi, Talabat, Deliveroo, etc.
- Catégories: rideshare, delivery, logistics, micromobility
- Support multi-région avec ISO 3166 country codes

**Plateformes initiales (seed data)** : Uber, Careem, Bolt, Yango (Middle East)

---

## 📊 STATISTIQUES GLOBALES

**Modules complétés** : 10/13 (ADM, DIR, DOC, CRM, BIL, SUP, RID, FLT, SCH, TRP)

**Tables** :
- Tables V1 existantes modifiées : 38 tables
- Nouvelles tables V2 créées : 30 tables
- **Total tables** : 68 tables

**Enums** :
- **Total enums créés** : 157 enums

**Colonnes** :
- Nouvelles colonnes V2 ajoutées : ~600+ colonnes
- Colonnes `_v2` à RENAME : 36 colonnes (BIL, SUP, RID, SCH, TRP)

---

## 🔧 STRUCTURE FICHIERS SQL (Sessions 0-13)

**Localisation** : `sql/XX_module_structure.sql`

**Structure standard** : 8 sections
1. ENUMS - Création des types énumérés
2. ALTER TABLE - Extension tables V1 existantes
3. CREATE TABLE - Nouvelles tables V2
4. FK INTERNES - Foreign keys au sein du module
5. FK EXTERNES - Foreign keys vers autres modules
6. FK FUTURES - Documentation pour modules futurs
7. INDEXES - Documentation pour Session 15
8. GATEWAY 2 - Validation avec comptages

**Idempotence** : Tous les scripts sont idempotents (IF NOT EXISTS, DO $ EXCEPTION)

---

**Dernière mise à jour** : 2025-01-04
**Prochaine session** : Session 9 (SCH - Scheduling)
