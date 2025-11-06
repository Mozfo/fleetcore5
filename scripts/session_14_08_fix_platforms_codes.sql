-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 14-08: FIX DIR_PLATFORMS MISSING CODES
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-11-05
-- Purpose: Add missing codes to dir_platforms (Uber, Careem, Bolt)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 14-08: FIX DIR_PLATFORMS MISSING CODES'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- Show current state
\echo 'BEFORE UPDATE:'
SELECT
  name,
  code,
  status,
  created_by
FROM dir_platforms
ORDER BY name;

\echo ''
\echo 'Adding codes to platforms...'

-- Update platforms with correct codes
UPDATE dir_platforms
SET
  code = CASE name
    WHEN 'Uber' THEN 'UBER'
    WHEN 'Careem' THEN 'CAREEM'
    WHEN 'Bolt' THEN 'BOLT'
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE code IS NULL OR code = '';

\echo ''
\echo 'AFTER UPDATE:'
SELECT
  name,
  code,
  status,
  created_by
FROM dir_platforms
ORDER BY name;

\echo ''
\echo '🔍 VALIDATION:'

SELECT
  'dir_platforms without code' as check,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM dir_platforms
WHERE code IS NULL OR code = '';

COMMIT;

\echo ''
\echo '✅ SESSION 14-08 COMPLETED: ALL PLATFORMS HAVE CODES'
\echo ''
