-- ═══════════════════════════════════════════════════════════════════════════════
-- SESSION 16 - PHASE 0: DROP VIEWS DEPENDENCIES
-- ═══════════════════════════════════════════════════════════════════════════════
-- Drop views that depend on V1 columns before migration
-- These views will be recreated after Phase 1 with same definition
-- ═══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 16 - PHASE 0: DROP DEPENDENT VIEWS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '⚠️  Cette phase va supprimer temporairement les vues suivantes:'
\echo '    - v_driver_profile'
\echo ''
\echo '✅ Ces vues seront recréées après Phase 1'
\echo ''

BEGIN;

\echo ''
\echo '▶ Dropping v_driver_profile...'
DROP VIEW IF EXISTS v_driver_profile CASCADE;
\echo '  ✓ v_driver_profile dropped'

COMMIT;

\echo ''
\echo '✅ PHASE 0 COMPLÉTÉE: Vues dépendantes supprimées'
\echo ''
\echo '⏭️  Vous pouvez maintenant exécuter Phase 1'
\echo ''
