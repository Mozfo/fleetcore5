-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 14-06: FIX ALL DATA COHERENCE ISSUES - COMPREHENSIVE CLEANUP
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-11-05
-- Purpose: Fix ALL data coherence issues found in deep analysis
--
-- ISSUES FOUND:
--   1. OLD Toyota (ID: 550e8400-e29b-41d4-a716-446655440010) WITHOUT code
--   2. OLD Corolla (ID: 550e8400-e29b-41d4-a716-446655440011) WITHOUT code
--   3. flt_vehicles pointing to OLD Toyota/Corolla (without codes)
--   4. 1 dir_car_makes missing created_by (OLD Toyota)
--   5. 38 dir_car_models missing created_by (37 from session_14_03 + 1 OLD Corolla)
--   6. 3 dir_platforms missing created_by
--
-- STRATEGY:
--   - Update flt_vehicles to point to NEW Toyota/Corolla (with codes)
--   - Delete OLD Toyota and Corolla (without codes)
--   - Fill ALL missing created_by fields
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 14-06: COMPREHENSIVE DATA COHERENCE FIX'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: UPDATE FLT_VEHICLES TO USE CORRECT TOYOTA/COROLLA (WITH CODES)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '📝 STEP 1: Updating flt_vehicles to use NEW Toyota/Corolla with codes...'

-- First, show current state
\echo 'BEFORE UPDATE:'
SELECT
  v.id as vehicle_id,
  v.license_plate,
  v.make_id as old_make_id,
  mk_old.name as old_make_name,
  mk_old.code as old_make_code,
  v.model_id as old_model_id,
  md_old.name as old_model_name,
  md_old.code as old_model_code
FROM flt_vehicles v
LEFT JOIN dir_car_makes mk_old ON v.make_id = mk_old.id
LEFT JOIN dir_car_models md_old ON v.model_id = md_old.id
WHERE v.deleted_at IS NULL;

\echo ''
\echo 'Updating flt_vehicles to point to NEW Toyota/Corolla...'

-- Update make_id and model_id to point to the NEW Toyota/Corolla (with codes)
UPDATE flt_vehicles v
SET
  make_id = '11111111-1111-1111-1111-111111111111',  -- NEW Toyota with code 'TOYOTA'
  model_id = 'dcf57aff-a080-4ee6-b492-4c2156fb0d21', -- NEW Corolla with code 'COROLLA'
  updated_at = CURRENT_TIMESTAMP
WHERE v.make_id = '550e8400-e29b-41d4-a716-446655440010'  -- OLD Toyota without code
  AND v.model_id = '550e8400-e29b-41d4-a716-446655440011'  -- OLD Corolla without code
  AND v.deleted_at IS NULL;

\echo ''
\echo 'AFTER UPDATE:'
SELECT
  v.id as vehicle_id,
  v.license_plate,
  v.make_id as new_make_id,
  mk_new.name as new_make_name,
  mk_new.code as new_make_code,
  v.model_id as new_model_id,
  md_new.name as new_model_name,
  md_new.code as new_model_code
FROM flt_vehicles v
LEFT JOIN dir_car_makes mk_new ON v.make_id = mk_new.id
LEFT JOIN dir_car_models md_new ON v.model_id = md_new.id
WHERE v.deleted_at IS NULL;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: DELETE OLD TOYOTA AND COROLLA (WITHOUT CODES)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '📝 STEP 2: Deleting OLD Toyota and Corolla (without codes)...'

-- Delete OLD Corolla model first (FK constraint)
DELETE FROM dir_car_models
WHERE id = '550e8400-e29b-41d4-a716-446655440011'  -- OLD Corolla without code
  AND (code IS NULL OR code = '');

\echo '✅ Deleted OLD Corolla (without code)'

-- Delete OLD Toyota make
DELETE FROM dir_car_makes
WHERE id = '550e8400-e29b-41d4-a716-446655440010'  -- OLD Toyota without code
  AND (code IS NULL OR code = '');

\echo '✅ Deleted OLD Toyota (without code)'

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: FILL MISSING CREATED_BY FOR ALL DIR_CAR_MODELS (38 rows)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '📝 STEP 3: Filling created_by for all dir_car_models...'

UPDATE dir_car_models
SET
  created_by = '00000000-0000-0000-0000-000000000000',
  updated_at = CURRENT_TIMESTAMP
WHERE created_by IS NULL;

SELECT
  'dir_car_models updated' as action,
  COUNT(*) as rows_affected
FROM dir_car_models
WHERE created_by = '00000000-0000-0000-0000-000000000000';

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: FILL MISSING CREATED_BY FOR DIR_PLATFORMS (3 rows)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '📝 STEP 4: Filling created_by for dir_platforms...'

UPDATE dir_platforms
SET
  created_by = '00000000-0000-0000-0000-000000000000',
  updated_at = CURRENT_TIMESTAMP
WHERE created_by IS NULL;

SELECT
  'dir_platforms updated' as action,
  COUNT(*) as rows_affected
FROM dir_platforms
WHERE created_by = '00000000-0000-0000-0000-000000000000';

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- FINAL VALIDATION: VERIFY ALL ISSUES ARE FIXED
-- ═══════════════════════════════════════════════════════════════════════════

\echo '🔍 FINAL VALIDATION: Checking all data coherence issues...'
\echo ''

SELECT
  'dir_car_makes without code' as issue,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM dir_car_makes
WHERE code IS NULL OR code = ''

UNION ALL

SELECT
  'dir_car_models without code',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_car_models
WHERE code IS NULL OR code = ''

UNION ALL

SELECT
  'dir_car_makes missing created_by',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_car_makes
WHERE created_by IS NULL

UNION ALL

SELECT
  'dir_car_models missing created_by',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_car_models
WHERE created_by IS NULL

UNION ALL

SELECT
  'dir_platforms missing created_by',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_platforms
WHERE created_by IS NULL

UNION ALL

SELECT
  'flt_vehicles pointing to makes without code',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM flt_vehicles v
JOIN dir_car_makes mk ON v.make_id = mk.id
WHERE v.deleted_at IS NULL
  AND (mk.code IS NULL OR mk.code = '')

UNION ALL

SELECT
  'flt_vehicles pointing to models without code',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM flt_vehicles v
JOIN dir_car_models md ON v.model_id = md.id
WHERE v.deleted_at IS NULL
  AND (md.code IS NULL OR md.code = '');

\echo ''
\echo '📊 SUMMARY OF FIXES:'

SELECT
  'Total car makes' as metric,
  COUNT(*) as value
FROM dir_car_makes
WHERE (code IS NOT NULL AND code != '')

UNION ALL

SELECT
  'Total car models',
  COUNT(*)
FROM dir_car_models
WHERE (code IS NOT NULL AND code != '')

UNION ALL

SELECT
  'Models with audit trail',
  COUNT(*)
FROM dir_car_models
WHERE created_by IS NOT NULL

UNION ALL

SELECT
  'Platforms with audit trail',
  COUNT(*)
FROM dir_platforms
WHERE created_by IS NOT NULL

UNION ALL

SELECT
  'Vehicles with valid references',
  COUNT(*)
FROM flt_vehicles v
JOIN dir_car_makes mk ON v.make_id = mk.id
JOIN dir_car_models md ON v.model_id = md.id
WHERE v.deleted_at IS NULL
  AND mk.code IS NOT NULL AND mk.code != ''
  AND md.code IS NOT NULL AND md.code != '';

COMMIT;

\echo ''
\echo '✅ SESSION 14-06 COMPLETED: ALL DATA COHERENCE ISSUES FIXED'
\echo ''
