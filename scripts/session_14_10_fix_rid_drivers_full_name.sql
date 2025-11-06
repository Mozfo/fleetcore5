-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 14-10: FIX RID_DRIVERS FULL_NAME INCOHÉRENCE
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-11-05
-- Purpose: Corriger l'incohérence entre full_name et first_name + last_name
--
-- PROBLÈME TROUVÉ:
--   first_name: "Rashid"
--   last_name: "Al-Mazrouei"
--   full_name: "Test Driver" ❌ INCOHÉRENT
--
-- SOLUTION:
--   Régénérer full_name depuis first_name + last_name
--   full_name: "Rashid Al-Mazrouei" ✅
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 14-10: FIX RID_DRIVERS FULL_NAME INCOHÉRENCE'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- Show current state (BEFORE)
\echo 'ÉTAT AVANT CORRECTION:'
SELECT
  id,
  first_name,
  last_name,
  full_name,
  CASE
    WHEN full_name = CONCAT(first_name, ' ', last_name) THEN '✅ Cohérent'
    ELSE '❌ INCOHÉRENT'
  END as coherence_check
FROM rid_drivers
WHERE deleted_at IS NULL;

\echo ''

-- Regenerate full_name from first_name + last_name
\echo 'Régénération de full_name depuis first_name + last_name...'

UPDATE rid_drivers
SET
  full_name = CONCAT(first_name, ' ', last_name),
  updated_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NULL
  AND first_name IS NOT NULL
  AND last_name IS NOT NULL
  AND full_name != CONCAT(first_name, ' ', last_name);

\echo ''

-- Show updated state (AFTER)
\echo 'ÉTAT APRÈS CORRECTION:'
SELECT
  id,
  first_name,
  last_name,
  full_name,
  CASE
    WHEN full_name = CONCAT(first_name, ' ', last_name) THEN '✅ Cohérent'
    ELSE '❌ INCOHÉRENT'
  END as coherence_check
FROM rid_drivers
WHERE deleted_at IS NULL;

\echo ''

-- Validation
\echo '🔍 VALIDATION:'
SELECT
  'rid_drivers incohérence check' as check_name,
  COUNT(CASE WHEN full_name != CONCAT(first_name, ' ', last_name) THEN 1 END) as incoherent_count,
  CASE
    WHEN COUNT(CASE WHEN full_name != CONCAT(first_name, ' ', last_name) THEN 1 END) = 0
    THEN '✅ PASS - All coherent'
    ELSE '❌ FAIL - Incoherence remains'
  END as status
FROM rid_drivers
WHERE deleted_at IS NULL
  AND first_name IS NOT NULL
  AND last_name IS NOT NULL;

COMMIT;

\echo ''
\echo '✅ SESSION 14-10 COMPLETED: RID_DRIVERS FULL_NAME COHÉRENT'
\echo ''
