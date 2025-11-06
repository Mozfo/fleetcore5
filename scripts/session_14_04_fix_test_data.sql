-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 14-04: FIX TEST DATA - REPLACE INCOHERENT VALUES WITH REALISTIC DATA
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-11-05
-- Purpose: Fix all test/placeholder data found during comprehensive table audit
-- Issues Found:
--   1. adm_members: 22+ test members with "Test Fleetcore" names (incoherent)
--   2. rid_drivers: 1 test driver with "Test Driver" and "TEST123" license
--   3. flt_vehicles: 1 vehicle with test license plate "AB-123-CD", missing VIN/color
--
-- Strategy: Replace all test data with realistic, coherent values
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 14-04: FIXING TEST DATA ACROSS ALL TABLES'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: FIX ADM_MEMBERS - REPLACE "TEST FLEETCORE" WITH REALISTIC NAMES
-- ═══════════════════════════════════════════════════════════════════════════

\echo '📝 STEP 1: Fixing adm_members test data...'

-- Create array of realistic name pairs for test members
DO $$
DECLARE
  v_member_record RECORD;
  v_first_names TEXT[] := ARRAY[
    'Mohammed', 'Ahmed', 'Fatima', 'Aisha', 'Omar', 'Ali', 'Hassan', 'Layla',
    'Youssef', 'Zainab', 'Khalid', 'Mariam', 'Abdullah', 'Sarah', 'Ibrahim',
    'Noor', 'Hamza', 'Amira', 'Tariq', 'Rania', 'Samir', 'Leila'
  ];
  v_last_names TEXT[] := ARRAY[
    'Al-Maktoum', 'Al-Nahyan', 'Al-Qasimi', 'Al-Sharqi', 'Abdullah', 'Rahman',
    'Hassan', 'Ahmad', 'Salem', 'Rashid', 'Mansour', 'Khalifa', 'Sultan',
    'Faisal', 'Hamdan', 'Majid', 'Saeed', 'Mohamed', 'Ali', 'Hussain'
  ];
  v_counter INTEGER := 0;
BEGIN
  -- Update all test members with realistic names
  FOR v_member_record IN
    SELECT id, email
    FROM adm_members
    WHERE (first_name = 'Test' AND last_name = 'Fleetcore')
      OR email LIKE 'test-fleetcore-%@example.com'
    ORDER BY created_at
  LOOP
    v_counter := v_counter + 1;

    UPDATE adm_members
    SET
      first_name = v_first_names[1 + (v_counter % array_length(v_first_names, 1))],
      last_name = v_last_names[1 + (v_counter % array_length(v_last_names, 1))],
      updated_at = CURRENT_TIMESTAMP
    WHERE id = v_member_record.id;
  END LOOP;

  RAISE NOTICE '✅ Updated % test members with realistic names', v_counter;
END $$;

-- Verify fix
SELECT
  COUNT(*) as "Test Members Remaining"
FROM adm_members
WHERE first_name = 'Test' AND last_name = 'Fleetcore';

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: FIX RID_DRIVERS - REPLACE TEST DRIVER WITH REALISTIC DATA
-- ═══════════════════════════════════════════════════════════════════════════

\echo '📝 STEP 2: Fixing rid_drivers test data...'

UPDATE rid_drivers
SET
  first_name = 'Rashid',
  last_name = 'Al-Mazrouei',
  email = 'rashid.almazrouei@dubaifleet.ae',
  phone = '+971-50-7849203',
  license_number = 'AE-DXB-2345678',
  license_expiry_date = CURRENT_DATE + INTERVAL '2 years',
  state = 'active',
  updated_at = CURRENT_TIMESTAMP
WHERE
  first_name = 'Test'
  AND last_name = 'Driver'
  AND email = 'test@test.com';

-- Verify fix
SELECT
  first_name,
  last_name,
  email,
  license_number,
  license_expiry_date,
  state
FROM rid_drivers
WHERE deleted_at IS NULL;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: FIX FLT_VEHICLES - ADD REALISTIC LICENSE PLATE, VIN, COLOR
-- ═══════════════════════════════════════════════════════════════════════════

\echo '📝 STEP 3: Fixing flt_vehicles test data...'

UPDATE flt_vehicles
SET
  license_plate = 'A-12345',  -- Dubai format
  vin = 'JTDBR32E300' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),  -- Toyota VIN format
  color = 'White',
  fuel_type = 'Petrol',
  transmission = 'Automatic',
  updated_at = CURRENT_TIMESTAMP
WHERE
  license_plate = 'AB-123-CD'
  AND country_code = 'AE';

-- Verify fix
SELECT
  v.license_plate,
  v.vin,
  mk.name as make_name,
  md.name as model_name,
  v.year,
  v.color,
  v.fuel_type,
  v.transmission,
  v.country_code
FROM flt_vehicles v
JOIN dir_car_makes mk ON v.make_id = mk.id
JOIN dir_car_models md ON v.model_id = md.id
WHERE v.deleted_at IS NULL;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- FINAL VALIDATION: ENSURE NO TEST DATA REMAINS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '🔍 FINAL VALIDATION: Checking for remaining test data...'
\echo ''

-- Check adm_members
SELECT
  'adm_members' as table_name,
  COUNT(*) as test_entries_remaining
FROM adm_members
WHERE
  (first_name ILIKE '%test%' AND last_name ILIKE '%test%')
  OR (first_name = 'Test' OR last_name = 'Fleetcore')
  OR email LIKE '%test@test.%';

-- Check rid_drivers
SELECT
  'rid_drivers' as table_name,
  COUNT(*) as test_entries_remaining
FROM rid_drivers
WHERE
  first_name ILIKE '%test%'
  OR last_name ILIKE '%test%'
  OR email LIKE '%test@test%'
  OR license_number LIKE '%TEST%';

-- Check flt_vehicles
SELECT
  'flt_vehicles' as table_name,
  COUNT(*) as test_entries_remaining
FROM flt_vehicles
WHERE
  license_plate LIKE 'AB-%-%'
  OR license_plate LIKE '%TEST%';

-- Summary stats
\echo ''
\echo '📊 SUMMARY OF FIXED DATA:'
SELECT
  'Total Members' as metric,
  COUNT(*) as value
FROM adm_members
WHERE deleted_at IS NULL
UNION ALL
SELECT
  'Members with Realistic Names',
  COUNT(*)
FROM adm_members
WHERE deleted_at IS NULL
  AND first_name != 'Test'
  AND last_name != 'Fleetcore'
UNION ALL
SELECT
  'Active Drivers',
  COUNT(*)
FROM rid_drivers
WHERE deleted_at IS NULL
  AND state = 'active'
UNION ALL
SELECT
  'Vehicles with VIN',
  COUNT(*)
FROM flt_vehicles
WHERE deleted_at IS NULL
  AND vin IS NOT NULL;

COMMIT;

\echo ''
\echo '✅ SESSION 14-04 COMPLETED: ALL TEST DATA REPLACED WITH REALISTIC VALUES'
\echo ''
