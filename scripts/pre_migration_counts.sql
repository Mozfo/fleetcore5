-- ============================================================================
-- PRÉ-MIGRATION COUNTS - État base AVANT migration V1 → V2
-- ============================================================================
--
-- Description: Capture l'état complet de la base de données AVANT migration
-- Usage: psql "$DATABASE_URL" -f scripts/pre_migration_counts.sql -o pre_migration_counts.txt
--
-- Fichier généré: pre_migration_counts.txt
-- Date: $(date)
-- ============================================================================

\echo ''
\echo '========================================================================'
\echo 'COMPTAGE PRÉ-MIGRATION - ÉTAT BASE AVANT V1 → V2'
\echo '========================================================================'
\echo ''

-- ============================================================================
-- 1. STATISTIQUES GLOBALES
-- ============================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '1. STATISTIQUES GLOBALES'
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
-- 2. TABLES PAR MODULE
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '2. TABLES PAR MODULE'
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
-- 3. ENUMS PAR MODULE
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '3. ENUMS PAR MODULE'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

WITH enum_list AS (
  SELECT
    typname,
    CASE
      WHEN typname LIKE 'adm_%' THEN 'ADM'
      WHEN typname LIKE 'dir_%' THEN 'DIR'
      WHEN typname LIKE 'doc_%' THEN 'DOC'
      WHEN typname LIKE 'crm_%' THEN 'CRM'
      WHEN typname LIKE 'bil_%' THEN 'BIL'
      WHEN typname LIKE 'sup_%' THEN 'SUP'
      WHEN typname LIKE 'rid_%' THEN 'RID'
      WHEN typname LIKE 'flt_%' THEN 'FLT'
      WHEN typname LIKE 'sch_%' THEN 'SCH'
      WHEN typname LIKE 'trp_%' THEN 'TRP'
      WHEN typname LIKE 'rev_%' THEN 'REV'
      WHEN typname LIKE 'fin_%' THEN 'FIN'
      ELSE 'SHARED/OTHER'
    END as module
  FROM pg_type
  WHERE typtype = 'e'
)
SELECT
  module as "Module",
  COUNT(*) as "Nombre Enums"
FROM enum_list
GROUP BY module
ORDER BY
  CASE module
    WHEN 'SHARED/OTHER' THEN 0
    WHEN 'ADM' THEN 1
    WHEN 'DIR' THEN 2
    WHEN 'DOC' THEN 3
    WHEN 'CRM' THEN 4
    WHEN 'BIL' THEN 5
    WHEN 'SUP' THEN 6
    WHEN 'RID' THEN 7
    WHEN 'FLT' THEN 8
    WHEN 'SCH' THEN 9
    WHEN 'TRP' THEN 10
    WHEN 'REV' THEN 11
    WHEN 'FIN' THEN 12
  END;

-- ============================================================================
-- 4. FOREIGN KEYS PAR MODULE
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '4. FOREIGN KEYS PAR MODULE'
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
-- 5. INDEXES PAR TYPE
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '5. INDEXES PAR TYPE'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

SELECT
  CASE
    WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE'
    WHEN indexdef LIKE '%USING gin%' THEN 'GIN'
    WHEN indexdef LIKE '%USING gist%' THEN 'GIST'
    ELSE 'BTREE'
  END as "Type Index",
  COUNT(*) as "Nombre"
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY
  CASE
    WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE'
    WHEN indexdef LIKE '%USING gin%' THEN 'GIN'
    WHEN indexdef LIKE '%USING gist%' THEN 'GIST'
    ELSE 'BTREE'
  END
ORDER BY "Nombre" DESC;

-- ============================================================================
-- 6. TABLES AVEC DONNÉES (9 tables critiques)
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '6. TABLES AVEC DONNÉES (9 tables critiques)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'ℹ️  Ces compteurs seront comparés après migration pour détecter perte.'
\echo ''

SELECT
  'adm_audit_logs' AS "Table",
  COUNT(*) AS "Nombre Lignes"
FROM adm_audit_logs
UNION ALL
SELECT 'adm_members', COUNT(*) FROM adm_members
UNION ALL
SELECT 'adm_roles', COUNT(*) FROM adm_roles
UNION ALL
SELECT 'adm_tenants', COUNT(*) FROM adm_tenants
UNION ALL
SELECT 'crm_leads', COUNT(*) FROM crm_leads
UNION ALL
SELECT 'dir_car_makes', COUNT(*) FROM dir_car_makes
UNION ALL
SELECT 'dir_car_models', COUNT(*) FROM dir_car_models
UNION ALL
SELECT 'flt_vehicles', COUNT(*) FROM flt_vehicles
UNION ALL
SELECT 'rid_drivers', COUNT(*) FROM rid_drivers
ORDER BY "Table";

-- ============================================================================
-- FIN DU RAPPORT PRÉ-MIGRATION
-- ============================================================================

\echo ''
\echo '========================================================================'
\echo '✅ COMPTAGE PRÉ-MIGRATION TERMINÉ'
\echo '========================================================================'
\echo ''
\echo 'Fichier généré: pre_migration_counts.txt'
\echo ''
\echo 'Prochaine étape: Exécuter scripts/migrate_supabase_v1_to_v2.sh'
\echo ''
