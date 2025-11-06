-- ============================================================================
-- POST-MIGRATION VALIDATION - État base APRÈS migration V1 → V2
-- ============================================================================
--
-- Description: Validation complète après migration Phase 1 (Structures)
-- Usage: psql "$DATABASE_URL" -f scripts/post_migration_validation.sql
--
-- Prérequis: Fichier pre_counts_critical.txt doit exister (généré par script bash)
-- ============================================================================

\echo ''
\echo '========================================================================'
\echo 'VALIDATION POST-MIGRATION - ÉTAT BASE APRÈS V1 → V2'
\echo '========================================================================'
\echo ''

-- ============================================================================
-- 1. STATISTIQUES GLOBALES POST-MIGRATION
-- ============================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '1. STATISTIQUES GLOBALES APRÈS MIGRATION'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

\echo 'Total Tables:'
SELECT COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';

\echo ''
\echo 'Total Enums:'
SELECT COUNT(*) as total_enums
FROM pg_type
WHERE typtype = 'e';

\echo ''
\echo 'Total Foreign Keys:'
SELECT COUNT(*) as total_foreign_keys
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';

\echo ''
\echo 'Total Indexes:'
SELECT COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public';

\echo ''
\echo 'Total Colonnes:'
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_schema = 'public';

-- ============================================================================
-- 2. CHARGEMENT COMPTEURS PRÉ-MIGRATION (CORRECTION ULTRATHINK 2)
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '2. CHARGEMENT COMPTEURS PRÉ-MIGRATION'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Créer table temporaire pour compteurs AVANT migration
CREATE TEMP TABLE pre_counts (
  table_name TEXT,
  count_before INTEGER
);

-- Charger fichier pre_counts_critical.txt (format: table|count)
-- CORRECTION ULTRATHINK 2: Utilisation de \copy pour charger le fichier
\copy pre_counts FROM 'pre_counts_critical.txt' WITH (FORMAT csv, DELIMITER '|');

\echo 'Compteurs PRÉ-migration chargés depuis: pre_counts_critical.txt'
\echo ''

SELECT * FROM pre_counts ORDER BY table_name;

-- ============================================================================
-- 3. COMPARAISON PRÉ vs POST (9 TABLES CRITIQUES)
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '3. COMPARAISON PRÉ vs POST (9 tables critiques)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'ℹ️  Vérification intégrité données (détection perte)...'
\echo ''

WITH post_counts AS (
  SELECT 'adm_audit_logs' AS table_name, COUNT(*)::INTEGER AS count_after
  FROM adm_audit_logs
  UNION ALL
  SELECT 'adm_members', COUNT(*)::INTEGER FROM adm_members
  UNION ALL
  SELECT 'adm_roles', COUNT(*)::INTEGER FROM adm_roles
  UNION ALL
  SELECT 'adm_tenants', COUNT(*)::INTEGER FROM adm_tenants
  UNION ALL
  SELECT 'crm_leads', COUNT(*)::INTEGER FROM crm_leads
  UNION ALL
  SELECT 'dir_car_makes', COUNT(*)::INTEGER FROM dir_car_makes
  UNION ALL
  SELECT 'dir_car_models', COUNT(*)::INTEGER FROM dir_car_models
  UNION ALL
  SELECT 'flt_vehicles', COUNT(*)::INTEGER FROM flt_vehicles
  UNION ALL
  SELECT 'rid_drivers', COUNT(*)::INTEGER FROM rid_drivers
)
SELECT
  pre.table_name AS "Table",
  pre.count_before AS "Avant Migration",
  post.count_after AS "Après Migration",
  post.count_after - pre.count_before AS "Différence",
  CASE
    WHEN post.count_after = pre.count_before THEN '✅ OK - AUCUNE PERTE'
    WHEN post.count_after > pre.count_before THEN '⚠️ AUGMENTATION'
    ELSE '❌ PERTE DE DONNÉES'
  END AS "Statut"
FROM pre_counts pre
JOIN post_counts post ON pre.table_name = post.table_name
ORDER BY
  CASE
    WHEN post.count_after < pre.count_before THEN 0  -- Pertes en premier
    WHEN post.count_after > pre.count_before THEN 1  -- Augmentations en second
    ELSE 2                                            -- OK en dernier
  END,
  pre.table_name;

-- ============================================================================
-- 4. VÉRIFICATION FINALE - ABSENCE DE PERTE
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '4. VÉRIFICATION FINALE - ABSENCE DE PERTE'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

WITH post_counts AS (
  SELECT 'adm_audit_logs' AS table_name, COUNT(*)::INTEGER AS count_after
  FROM adm_audit_logs
  UNION ALL
  SELECT 'adm_members', COUNT(*)::INTEGER FROM adm_members
  UNION ALL
  SELECT 'adm_roles', COUNT(*)::INTEGER FROM adm_roles
  UNION ALL
  SELECT 'adm_tenants', COUNT(*)::INTEGER FROM adm_tenants
  UNION ALL
  SELECT 'crm_leads', COUNT(*)::INTEGER FROM crm_leads
  UNION ALL
  SELECT 'dir_car_makes', COUNT(*)::INTEGER FROM dir_car_makes
  UNION ALL
  SELECT 'dir_car_models', COUNT(*)::INTEGER FROM dir_car_models
  UNION ALL
  SELECT 'flt_vehicles', COUNT(*)::INTEGER FROM flt_vehicles
  UNION ALL
  SELECT 'rid_drivers', COUNT(*)::INTEGER FROM rid_drivers
),
data_loss_check AS (
  SELECT COUNT(*) as loss_count
  FROM pre_counts pre
  JOIN post_counts post ON pre.table_name = post.table_name
  WHERE post.count_after < pre.count_before
)
SELECT
  CASE
    WHEN loss_count > 0 THEN '❌ ERREUR: PERTE DE DONNÉES DÉTECTÉE'
    ELSE '✅ VALIDATION OK: AUCUNE PERTE DE DONNÉES'
  END AS "Résultat Final"
FROM data_loss_check;

-- ============================================================================
-- 5. TABLES PAR MODULE APRÈS MIGRATION
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '5. TABLES PAR MODULE APRÈS MIGRATION'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

WITH module_tables AS (
  SELECT
    CASE
      WHEN tablename LIKE 'adm_%' THEN 'ADM (Admin)'
      WHEN tablename LIKE 'dir_%' THEN 'DIR (Directory)'
      WHEN tablename LIKE 'doc_%' THEN 'DOC (Documents)'
      WHEN tablename LIKE 'crm_%' THEN 'CRM (Customer Rel.)'
      WHEN tablename LIKE 'bil_%' THEN 'BIL (Billing)'
      WHEN tablename LIKE 'sup_%' THEN 'SUP (Support)'
      WHEN tablename LIKE 'rid_%' THEN 'RID (Rideshare)'
      WHEN tablename LIKE 'flt_%' THEN 'FLT (Fleet)'
      WHEN tablename LIKE 'sch_%' THEN 'SCH (Scheduling)'
      WHEN tablename LIKE 'trp_%' THEN 'TRP (Transport)'
      WHEN tablename LIKE 'rev_%' THEN 'REV (Revenue)'
      WHEN tablename LIKE 'fin_%' THEN 'FIN (Finance)'
      ELSE 'OTHER'
    END as module,
    CASE
      WHEN tablename LIKE 'adm_%' THEN 1
      WHEN tablename LIKE 'dir_%' THEN 2
      WHEN tablename LIKE 'doc_%' THEN 3
      WHEN tablename LIKE 'crm_%' THEN 4
      WHEN tablename LIKE 'bil_%' THEN 5
      WHEN tablename LIKE 'sup_%' THEN 6
      WHEN tablename LIKE 'rid_%' THEN 7
      WHEN tablename LIKE 'flt_%' THEN 8
      WHEN tablename LIKE 'sch_%' THEN 9
      WHEN tablename LIKE 'trp_%' THEN 10
      WHEN tablename LIKE 'rev_%' THEN 11
      WHEN tablename LIKE 'fin_%' THEN 12
      ELSE 99
    END as module_order
  FROM pg_tables
  WHERE schemaname = 'public'
)
SELECT
  module as "Module",
  COUNT(*) as "Nombre Tables"
FROM module_tables
GROUP BY module, module_order
ORDER BY module_order;

-- ============================================================================
-- 6. FOREIGN KEYS PAR MODULE
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '6. FOREIGN KEYS PAR MODULE'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

WITH fk_by_module AS (
  SELECT
    tc.table_name,
    CASE
      WHEN tc.table_name LIKE 'adm_%' THEN 'ADM'
      WHEN tc.table_name LIKE 'dir_%' THEN 'DIR'
      WHEN tc.table_name LIKE 'doc_%' THEN 'DOC'
      WHEN tc.table_name LIKE 'crm_%' THEN 'CRM'
      WHEN tc.table_name LIKE 'bil_%' THEN 'BIL'
      WHEN tc.table_name LIKE 'sup_%' THEN 'SUP'
      WHEN tc.table_name LIKE 'rid_%' THEN 'RID'
      WHEN tc.table_name LIKE 'flt_%' THEN 'FLT'
      WHEN tc.table_name LIKE 'sch_%' THEN 'SCH'
      WHEN tc.table_name LIKE 'trp_%' THEN 'TRP'
      WHEN tc.table_name LIKE 'rev_%' THEN 'REV'
      WHEN tc.table_name LIKE 'fin_%' THEN 'FIN'
      ELSE 'OTHER'
    END as module,
    CASE
      WHEN tc.table_name LIKE 'adm_%' THEN 1
      WHEN tc.table_name LIKE 'dir_%' THEN 2
      WHEN tc.table_name LIKE 'doc_%' THEN 3
      WHEN tc.table_name LIKE 'crm_%' THEN 4
      WHEN tc.table_name LIKE 'bil_%' THEN 5
      WHEN tc.table_name LIKE 'sup_%' THEN 6
      WHEN tc.table_name LIKE 'rid_%' THEN 7
      WHEN tc.table_name LIKE 'flt_%' THEN 8
      WHEN tc.table_name LIKE 'sch_%' THEN 9
      WHEN tc.table_name LIKE 'trp_%' THEN 10
      WHEN tc.table_name LIKE 'rev_%' THEN 11
      WHEN tc.table_name LIKE 'fin_%' THEN 12
      ELSE 99
    END as module_order
  FROM information_schema.table_constraints tc
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
)
SELECT
  module as "Module",
  COUNT(*) as "Nombre FK"
FROM fk_by_module
GROUP BY module, module_order
ORDER BY module_order;

-- ============================================================================
-- 7. INFORMATION: NOUVELLES COLONNES V2 (CORRECTION ULTRATHINK 3)
-- ============================================================================

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'ℹ️  NOUVELLES COLONNES V2 (État après Phase 1 - Structures)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Les 9 tables avec données ont maintenant de nouvelles colonnes V2.'
\echo ''
\echo 'État actuel (NORMAL et ATTENDU):'
\echo ''
\echo '  📌 Colonnes avec DEFAULT: Remplies automatiquement'
\echo '     Exemples:'
\echo '       - metadata = {}'
\echo '       - lifecycle_status = active'
\echo '       - created_at = now()'
\echo '       - updated_at = now()'
\echo ''
\echo '  📌 Colonnes sans DEFAULT: NULL'
\echo '     Exemples:'
\echo '       - business_type = NULL'
\echo '       - incorporation_date = NULL'
\echo '       - notes = NULL'
\echo '       - external_id = NULL'
\echo ''
\echo '⚠️  Les valeurs NULL sont NORMALES après Phase 1 (structures).'
\echo ''
\echo '✅  Session 14 (Migration Données) remplira ces colonnes depuis:'
\echo '    1. Données V1 existantes'
\echo '    2. Calculs dérivés automatiques'
\echo '    3. Extraction metadata JSON V1'
\echo '    4. Inférence intelligente depuis données existantes'
\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ============================================================================
-- 8. EXEMPLE: COLONNES NULL DANS UNE TABLE CRITIQUE
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '8. EXEMPLE: Colonnes V2 dans adm_tenants (première table)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'Vérification échantillon (3 premières lignes):'
\echo ''

SELECT
  id,
  name,
  -- Colonnes V2 avec DEFAULT (remplies automatiquement)
  metadata IS NOT NULL as "metadata_ok",
  created_at IS NOT NULL as "created_at_ok",
  updated_at IS NOT NULL as "updated_at_ok",
  -- Colonnes V2 sans DEFAULT (NULL attendu)
  business_type,
  incorporation_date,
  notes
FROM adm_tenants
ORDER BY created_at DESC
LIMIT 3;

\echo ''
\echo 'ℹ️  Si business_type, incorporation_date, notes = NULL → NORMAL ✅'
\echo ''

-- ============================================================================
-- FIN DE LA VALIDATION POST-MIGRATION
-- ============================================================================

\echo ''
\echo '========================================================================'
\echo '✅ VALIDATION POST-MIGRATION TERMINÉE'
\echo '========================================================================'
\echo ''
\echo 'Prochaines étapes:'
\echo ''
\echo '  1. Si validation OK:'
\echo '     → Session 14: Migration Données V1→V2'
\echo '     → Fichier: docs/Migration_v1_v2/SESSION_14_DATA_MIGRATION.md'
\echo ''
\echo '  2. Session 15: Création indexes avec soft delete'
\echo '     → Fichier: docs/Migration_v1_v2/SESSION_15_INDEXES.md'
\echo ''
\echo '  3. Session 16: Cleanup colonnes V1 + RENAME _v2'
\echo '     → Fichier: docs/Migration_v1_v2/SESSION_16_CLEANUP.md'
\echo ''
\echo '========================================================================'
\echo ''
