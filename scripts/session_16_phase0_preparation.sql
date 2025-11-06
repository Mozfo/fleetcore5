-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 16 - PHASE 0: PRÉPARATION & VALIDATIONS PRÉ-MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-11-05
-- Durée estimée: 15 minutes
-- Risque: FAIBLE (read-only + backup)
--
-- ⚠️⚠️⚠️ AVERTISSEMENT CRITIQUE ⚠️⚠️⚠️
--
-- CE SCRIPT DOIT ÊTRE TESTÉ SUR DB LOCALE/DEV EN PREMIER!
--
-- ORDRE OBLIGATOIRE:
--   1. Tester sur DB locale (PostgreSQL local)
--   2. Tester sur environnement dev (si disponible)
--   3. SEULEMENT APRÈS validation dev → Exécuter sur Supabase Production
--
-- NE JAMAIS exécuter directement sur Supabase sans tests préalables!
--
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 16 - PHASE 0: PRÉPARATION & VALIDATIONS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '⚠️  IMPORTANT: Vérifiez que vous êtes sur le BON environnement!'
\echo ''
\echo '   Environnements acceptables:'
\echo '     ✅ DB locale (postgresql://localhost/fleetcore_dev)'
\echo '     ✅ DB dev/staging (non-production)'
\echo '     ⚠️  DB Supabase Production (SEULEMENT après tests dev!)'
\echo ''

-- Afficher l'environnement actuel
\echo '▶ Environnement actuel:'
SELECT
  current_database() as database_name,
  inet_server_addr() as server_address,
  version() as postgres_version;

\echo ''
\echo '⏸️  PAUSE: Confirmez que c''est le BON environnement avant de continuer.'
\echo '   Tapez Ctrl+C pour annuler, ou Entrée pour continuer.'
\echo ''
\prompt 'Continuer? (yes/no): ' continue_choice

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: BACKUP COMPLET DB
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '▶ SECTION 1: BACKUP BASE DE DONNÉES'
\echo '   Durée: 5-10 minutes (selon taille DB)'
\echo ''
\echo '   IMPORTANT: Backup doit être créé AVANT toute modification!'
\echo ''
\echo '   Commande backup à exécuter (dans un terminal séparé):'
\echo ''
\echo '   pg_dump "postgresql://..." \'
\echo '     --format=custom \'
\echo '     --file=backup_session_16_pre_$(date +%Y%m%d_%H%M%S).dump \'
\echo '     --verbose'
\echo ''
\echo '   Puis vérifier:'
\echo '   ls -lh backup_session_16_pre_*.dump'
\echo ''
\prompt 'Backup créé et vérifié? (yes/no): ' backup_created

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: VALIDATIONS PRÉ-MIGRATION (6 CHECKS CRITIQUES)
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SECTION 2: VALIDATIONS PRÉ-MIGRATION (6 CHECKS)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '⚠️  Si UN SEUL check échoue → STOP migration!'
\echo ''

-- ───────────────────────────────────────────────────────────────────────────
-- CHECK 1: Comptage exact colonnes _v2
-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ CHECK 1: Compter colonnes _v2 (attendu: 34 total)'

SELECT
  CASE
    WHEN table_name LIKE 'bil_%' THEN 'BIL'
    WHEN table_name LIKE 'sup_%' THEN 'SUP'
    WHEN table_name LIKE 'rid_%' THEN 'RID'
    WHEN table_name LIKE 'sch_%' THEN 'SCH'
    WHEN table_name LIKE 'trp_%' THEN 'TRP'
    ELSE 'OTHER'
  END as module,
  COUNT(*) as colonnes_v2
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%_v2'
GROUP BY module
ORDER BY module;

\echo ''
\echo '✓ ATTENDU: BIL=5, RID=14, SCH=7, SUP=4, TRP=4 (TOTAL: 34)'
\echo ''

-- Validation automatique
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name LIKE '%_v2';

  IF v_count != 34 THEN
    RAISE EXCEPTION '❌ CHECK 1 FAILED: Attendu 34 colonnes _v2, trouvé %', v_count;
  ELSE
    RAISE NOTICE '✅ CHECK 1 PASSED: 34 colonnes _v2 confirmées';
  END IF;
END $$;

\echo ''

-- ───────────────────────────────────────────────────────────────────────────
-- CHECK 2: ZÉRO NULL sur colonnes critiques
-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ CHECK 2: Vérifier ZÉRO NULL sur colonnes critiques'

SELECT
  'adm_members.phone' as column_check,
  COUNT(*) FILTER (WHERE phone IS NULL) as null_count,
  CASE
    WHEN COUNT(*) FILTER (WHERE phone IS NULL) = 0 THEN '✅ OK'
    ELSE '❌ FAIL'
  END as status
FROM adm_members
UNION ALL
SELECT
  'crm_leads.phone',
  COUNT(*) FILTER (WHERE phone IS NULL),
  CASE WHEN COUNT(*) FILTER (WHERE phone IS NULL) = 0 THEN '✅ OK' ELSE '❌ FAIL' END
FROM crm_leads
UNION ALL
SELECT
  'dir_car_makes.code',
  COUNT(*) FILTER (WHERE code IS NULL),
  CASE WHEN COUNT(*) FILTER (WHERE code IS NULL) = 0 THEN '✅ OK' ELSE '❌ FAIL' END
FROM dir_car_makes
UNION ALL
SELECT
  'rid_drivers.driver_status_v2',
  COUNT(*) FILTER (WHERE driver_status_v2 IS NULL),
  CASE WHEN COUNT(*) FILTER (WHERE driver_status_v2 IS NULL) = 0 THEN '✅ OK' ELSE '❌ FAIL' END
FROM rid_drivers;

\echo ''
\echo '✓ ATTENDU: null_count = 0 pour TOUTES les colonnes'
\echo ''

-- ───────────────────────────────────────────────────────────────────────────
-- CHECK 3: ZÉRO doublon sur colonnes UNIQUE futures
-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ CHECK 3: Vérifier ZÉRO doublon sur colonnes UNIQUE futures'

-- adm_members(tenant_id, email)
\echo '  3.1: adm_members(tenant_id, email)'
SELECT
  tenant_id,
  email,
  COUNT(*) as duplicates
FROM adm_members
WHERE deleted_at IS NULL
GROUP BY tenant_id, email
HAVING COUNT(*) > 1;
-- Attendu: 0 lignes

-- rid_drivers(tenant_id, phone)
\echo '  3.2: rid_drivers(tenant_id, phone)'
SELECT
  tenant_id,
  phone,
  COUNT(*) as duplicates
FROM rid_drivers
WHERE deleted_at IS NULL
GROUP BY tenant_id, phone
HAVING COUNT(*) > 1;
-- Attendu: 0 lignes

-- flt_vehicles(tenant_id, vin) - nullable
\echo '  3.3: flt_vehicles(tenant_id, vin)'
SELECT
  tenant_id,
  vin,
  COUNT(*) as duplicates
FROM flt_vehicles
WHERE deleted_at IS NULL AND vin IS NOT NULL
GROUP BY tenant_id, vin
HAVING COUNT(*) > 1;
-- Attendu: 0 lignes

\echo ''
\echo '✓ ATTENDU: 0 lignes de doublons pour chaque requête'
\echo ''

-- ───────────────────────────────────────────────────────────────────────────
-- CHECK 4: Espace disque disponible
-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ CHECK 4: Vérifier espace disque disponible'

SELECT
  pg_size_pretty(pg_database_size(current_database())) as taille_db,
  CASE
    WHEN pg_database_size(current_database()) < (SELECT setting::bigint FROM pg_settings WHERE name = 'shared_buffers') * 10
      THEN '✅ Espace suffisant'
    ELSE '⚠️ Vérifier espace disque'
  END as disk_status;

\echo ''
\echo '✓ ATTENDU: Taille DB raisonnable, espace suffisant'
\echo ''

-- ───────────────────────────────────────────────────────────────────────────
-- CHECK 5: Aucune transaction longue active
-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ CHECK 5: Vérifier aucune transaction longue active'

SELECT
  pid,
  state,
  now() - xact_start AS duration,
  LEFT(query, 60) as query_preview
FROM pg_stat_activity
WHERE state != 'idle'
  AND xact_start IS NOT NULL
  AND (now() - xact_start) > interval '5 minutes'
ORDER BY duration DESC
LIMIT 5;

\echo ''
\echo '✓ ATTENDU: Aucune transaction > 5 minutes (0 lignes)'
\echo ''

-- ───────────────────────────────────────────────────────────────────────────
-- CHECK 6: Connexions actives
-- ───────────────────────────────────────────────────────────────────────────

\echo '▶ CHECK 6: Compter connexions actives'

SELECT
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE state = 'active') as active_connections,
  COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = current_database();

\echo ''
\echo '✓ ATTENDU: Connexions raisonnables (< 50 total)'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: EXPORT ÉTAT PRÉ-MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SECTION 3: EXPORT ÉTAT PRÉ-MIGRATION'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- Liste toutes les colonnes _v2 pour référence
\echo '▶ 3.1: Liste complète colonnes _v2 (export pour comparaison post-migration)'

\o /tmp/session_16_pre_migration_colonnes_v2.txt
SELECT
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%_v2'
ORDER BY table_name, column_name;
\o

\echo '   ✓ Export sauvegardé: /tmp/session_16_pre_migration_colonnes_v2.txt'
\echo ''

-- Compter tous les index
\echo '▶ 3.2: Comptage index pré-migration'

SELECT
  COUNT(*) as total_indexes,
  COUNT(*) FILTER (WHERE indexdef LIKE '%WHERE%deleted_at%') as indexes_soft_delete,
  COUNT(*) FILTER (WHERE indexdef LIKE '%UNIQUE%') as indexes_unique
FROM pg_indexes
WHERE schemaname = 'public';

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: RÉSUMÉ VALIDATION
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  RÉSUMÉ VALIDATION PHASE 0'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '✅ CHECK 1: 34 colonnes _v2 confirmées'
\echo '✅ CHECK 2: ZÉRO NULL sur colonnes critiques'
\echo '✅ CHECK 3: ZÉRO doublon sur UNIQUE futures'
\echo '✅ CHECK 4: Espace disque suffisant'
\echo '✅ CHECK 5: Aucune transaction longue'
\echo '✅ CHECK 6: Connexions raisonnables'
\echo ''
\echo '✅ Backup créé et vérifié'
\echo '✅ État pré-migration exporté'
\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  PHASE 0 COMPLÉTÉE AVEC SUCCÈS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '⏭️  Prochaine étape: Phase 1 (Cleanup _v2)'
\echo ''
\echo '⚠️  RAPPEL: Si vous êtes sur DB locale/dev:'
\echo '   → Continuez vers Phase 1'
\echo ''
\echo '⚠️  Si vous êtes sur DB Supabase Production:'
\echo '   → STOP! Testez d''abord sur DB locale/dev!'
\echo '   → Validez que Phase 1-5 fonctionnent correctement en dev'
\echo '   → Revenez ici seulement après validation dev complète'
\echo ''
