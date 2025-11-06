-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 14-07: ULTRA COMPREHENSIVE DATA VALIDATION - ALL TABLES
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-11-05
-- Purpose: Deep validation of ALL tables to find ANY remaining data issues
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  ULTRA COMPREHENSIVE DATA VALIDATION - ALL TABLES'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 1: ADM_MEMBERS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '1. ADM_MEMBERS - Deep Validation:'

SELECT
  COUNT(*) as total_members,
  COUNT(CASE WHEN first_name IS NULL OR first_name = '' THEN 1 END) as null_first_name,
  COUNT(CASE WHEN last_name IS NULL OR last_name = '' THEN 1 END) as null_last_name,
  COUNT(CASE WHEN phone IS NULL OR phone = '' THEN 1 END) as null_phone,
  COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as null_email,
  COUNT(CASE WHEN default_role_id IS NULL THEN 1 END) as null_role,
  COUNT(CASE WHEN clerk_user_id IS NULL OR clerk_user_id = '' THEN 1 END) as null_clerk_id
FROM adm_members
WHERE deleted_at IS NULL;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 2: ADM_TENANTS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '2. ADM_TENANTS - Deep Validation:'

SELECT
  COUNT(*) as total_tenants,
  COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as null_name,
  COUNT(CASE WHEN subdomain IS NULL OR subdomain = '' THEN 1 END) as null_subdomain,
  COUNT(CASE WHEN country_code IS NULL THEN 1 END) as null_country,
  COUNT(CASE WHEN primary_contact_phone IS NULL THEN 1 END) as null_phone,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status
FROM adm_tenants;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 3: DIR_COUNTRY_REGULATIONS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '3. DIR_COUNTRY_REGULATIONS - Deep Validation:'

SELECT
  country_code,
  CASE WHEN currency IS NULL THEN '❌' ELSE '✅' END as has_currency,
  CASE WHEN timezone IS NULL THEN '❌' ELSE '✅' END as has_timezone,
  CASE WHEN vat_rate IS NULL THEN '❌' ELSE '✅' END as has_vat,
  CASE WHEN vehicle_max_age IS NULL THEN '❌' ELSE '✅' END as has_max_age,
  CASE WHEN min_vehicle_length_cm IS NULL THEN '❌' ELSE '✅' END as has_length,
  CASE WHEN min_vehicle_width_cm IS NULL THEN '❌' ELSE '✅' END as has_width,
  CASE WHEN min_fare_per_trip IS NULL THEN '❌' ELSE '✅' END as has_min_fare,
  CASE WHEN created_by IS NULL THEN '❌' ELSE '✅' END as has_audit
FROM dir_country_regulations
ORDER BY country_code;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 4: DIR_VEHICLE_CLASSES
-- ═══════════════════════════════════════════════════════════════════════════

\echo '4. DIR_VEHICLE_CLASSES - Deep Validation:'

SELECT
  country_code,
  name,
  CASE WHEN code IS NULL OR code = '' THEN '❌' ELSE '✅' END as has_code,
  CASE WHEN min_seats IS NULL THEN '❌' ELSE '✅' END as has_min_seats,
  CASE WHEN max_seats IS NULL THEN '❌' ELSE '✅' END as has_max_seats,
  CASE WHEN max_age IS NULL THEN '❌' ELSE '✅' END as has_max_age,
  CASE WHEN created_by IS NULL THEN '❌' ELSE '✅' END as has_audit
FROM dir_vehicle_classes
ORDER BY country_code, name;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 5: DIR_PLATFORMS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '5. DIR_PLATFORMS - Deep Validation:'

SELECT
  name,
  CASE WHEN code IS NULL OR code = '' THEN '❌' ELSE '✅' END as has_code,
  CASE WHEN status IS NULL THEN '❌' ELSE '✅' END as has_status,
  CASE WHEN api_config IS NULL THEN '❌' ELSE '✅' END as has_api_config,
  CASE WHEN created_by IS NULL THEN '❌' ELSE '✅' END as has_audit
FROM dir_platforms
ORDER BY name;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 6: DIR_CAR_MAKES
-- ═══════════════════════════════════════════════════════════════════════════

\echo '6. DIR_CAR_MAKES - Ultra Deep Validation (Sample):'

SELECT
  name,
  code,
  country_of_origin,
  founded_year,
  CASE WHEN code IS NULL OR code = '' THEN '❌' ELSE '✅' END as has_code,
  CASE WHEN country_of_origin IS NULL THEN '❌' ELSE '✅' END as has_origin,
  CASE WHEN founded_year IS NULL THEN '❌' ELSE '✅' END as has_year,
  CASE WHEN parent_company IS NULL THEN '❌' ELSE '✅' END as has_parent,
  CASE WHEN created_by IS NULL THEN '❌' ELSE '✅' END as has_audit
FROM dir_car_makes
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
ORDER BY name
LIMIT 10;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 7: DIR_CAR_MODELS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '7. DIR_CAR_MODELS - Ultra Deep Validation (Sample):'

SELECT
  mk.name as make,
  md.name as model,
  md.code,
  CASE WHEN md.code IS NULL OR md.code = '' THEN '❌' ELSE '✅' END as has_code,
  CASE WHEN md.vehicle_class_id IS NULL THEN '❌' ELSE '✅' END as has_class,
  CASE WHEN md.created_by IS NULL THEN '❌' ELSE '✅' END as has_audit,
  CASE WHEN NOT EXISTS (SELECT 1 FROM dir_car_makes WHERE id = md.make_id) THEN '❌' ELSE '✅' END as valid_make_fk
FROM dir_car_models md
LEFT JOIN dir_car_makes mk ON md.make_id = mk.id
WHERE md.tenant_id = '00000000-0000-0000-0000-000000000000'
ORDER BY mk.name, md.name
LIMIT 10;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 8: CRM_LEADS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '8. CRM_LEADS - Deep Validation:'

SELECT
  COUNT(*) as total_leads,
  COUNT(CASE WHEN first_name IS NULL OR first_name = '' THEN 1 END) as null_first_name,
  COUNT(CASE WHEN last_name IS NULL OR last_name = '' THEN 1 END) as null_last_name,
  COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as null_email,
  COUNT(CASE WHEN phone IS NULL OR phone = '' THEN 1 END) as null_phone,
  COUNT(CASE WHEN company_name IS NULL OR company_name = '' THEN 1 END) as null_company
FROM crm_leads;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 9: RID_DRIVERS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '9. RID_DRIVERS - Deep Validation:'

SELECT
  first_name || ' ' || last_name as name,
  CASE WHEN license_number IS NULL OR license_number = '' THEN '❌' ELSE '✅' END as has_license,
  CASE WHEN license_expiry_date IS NULL THEN '❌' ELSE '✅' END as has_expiry,
  CASE WHEN state IS NULL OR state = '' THEN '❌' ELSE '✅' END as has_state,
  CASE WHEN phone IS NULL OR phone = '' THEN '❌' ELSE '✅' END as has_phone,
  CASE WHEN email IS NULL OR email = '' THEN '❌' ELSE '✅' END as has_email
FROM rid_drivers
WHERE deleted_at IS NULL;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 10: FLT_VEHICLES
-- ═══════════════════════════════════════════════════════════════════════════

\echo '10. FLT_VEHICLES - Deep Validation:'

SELECT
  license_plate,
  CASE WHEN vin IS NULL OR vin = '' THEN '❌' ELSE '✅' END as has_vin,
  CASE WHEN make_id IS NULL THEN '❌' ELSE '✅' END as has_make,
  CASE WHEN model_id IS NULL THEN '❌' ELSE '✅' END as has_model,
  CASE WHEN year IS NULL THEN '❌' ELSE '✅' END as has_year,
  CASE WHEN color IS NULL OR color = '' THEN '❌' ELSE '✅' END as has_color,
  CASE WHEN country_code IS NULL THEN '❌' ELSE '✅' END as has_country,
  CASE WHEN status IS NULL THEN '❌' ELSE '✅' END as has_status
FROM flt_vehicles
WHERE deleted_at IS NULL;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- COMPREHENSIVE SUMMARY: ALL DATA QUALITY CHECKS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════════════════'
\echo '  COMPREHENSIVE DATA QUALITY SUMMARY'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT
  'adm_members with NULL critical fields' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM adm_members
WHERE deleted_at IS NULL
  AND (first_name IS NULL OR last_name IS NULL OR phone IS NULL OR email IS NULL)

UNION ALL

SELECT
  'dir_country_regulations with NULL fields',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_country_regulations
WHERE currency IS NULL OR timezone IS NULL OR vat_rate IS NULL
   OR min_vehicle_length_cm IS NULL OR min_vehicle_width_cm IS NULL

UNION ALL

SELECT
  'dir_vehicle_classes with NULL critical fields',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_vehicle_classes
WHERE code IS NULL OR min_seats IS NULL OR max_seats IS NULL OR max_age IS NULL

UNION ALL

SELECT
  'dir_platforms with NULL critical fields',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_platforms
WHERE code IS NULL OR status IS NULL OR created_by IS NULL

UNION ALL

SELECT
  'dir_car_makes with NULL codes',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_car_makes
WHERE code IS NULL OR code = ''

UNION ALL

SELECT
  'dir_car_models with NULL codes',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_car_models
WHERE code IS NULL OR code = ''

UNION ALL

SELECT
  'dir_car_makes with NULL audit fields',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_car_makes
WHERE created_by IS NULL

UNION ALL

SELECT
  'dir_car_models with NULL audit fields',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM dir_car_models
WHERE created_by IS NULL

UNION ALL

SELECT
  'flt_vehicles with invalid references',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM flt_vehicles v
WHERE v.deleted_at IS NULL
  AND (
    NOT EXISTS (SELECT 1 FROM dir_car_makes WHERE id = v.make_id)
    OR NOT EXISTS (SELECT 1 FROM dir_car_models WHERE id = v.model_id)
  )

UNION ALL

SELECT
  'rid_drivers with NULL critical fields',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM rid_drivers
WHERE deleted_at IS NULL
  AND (license_number IS NULL OR license_expiry_date IS NULL OR state IS NULL);

\echo ''
\echo '✅ SESSION 14-07 COMPLETED: ULTRA COMPREHENSIVE VALIDATION'
\echo ''
