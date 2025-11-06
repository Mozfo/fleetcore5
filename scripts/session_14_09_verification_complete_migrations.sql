-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 14-09: VÉRIFICATION COMPLÈTE DES 10 MIGRATIONS
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-11-05
-- Purpose: Vérifier que TOUTES les migrations V1→V2 ont été correctement exécutées
--
-- MIGRATIONS À VÉRIFIER:
--   1. crm_leads: full_name → first_name + last_name (SPLIT)
--   2. crm_leads: demo_company_name → company_name (COPIE)
--   3. dir_car_makes: NULL → tenant_id système (FIX)
--   4. adm_tenants: name → subdomain (CALCUL)
--   5. adm_tenants: member.email → primary_contact_email (COPIE)
--   6. adm_members: NULL → default_role_id (FIX)
--   7. adm_members: tenant.country_code → preferred_language (CALCUL)
--   8. flt_vehicles: seats → passenger_capacity (COPIE)
--   9. flt_vehicles: tenant.country_code → country_code (COPIE)
--  10. rid_drivers: first_name + last_name → full_name (CONCAT)
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 14-09: VÉRIFICATION COMPLÈTE DES 10 MIGRATIONS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 5: CRM_LEADS full_name → first_name + last_name (SPLIT)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '1. MIGRATION 5: crm_leads full_name → first_name + last_name'
\echo '   Expected: All rows with full_name should have first_name + last_name'
\echo ''

SELECT
  id,
  full_name,
  first_name,
  last_name,
  CASE
    WHEN full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL) THEN '❌ FAIL - Split not done'
    WHEN full_name IS NULL AND first_name IS NULL AND last_name IS NULL THEN '⚠️ SKIP - No source data'
    WHEN full_name IS NOT NULL AND first_name IS NOT NULL AND last_name IS NOT NULL THEN '✅ PASS'
    ELSE '⚠️ PARTIAL'
  END as status
FROM crm_leads
ORDER BY created_at;

\echo ''

SELECT
  'MIGRATION 5' as migration,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN full_name IS NOT NULL AND first_name IS NOT NULL AND last_name IS NOT NULL THEN 1 END) as migrated,
  COUNT(CASE WHEN full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL) THEN 1 END) as failed,
  CASE
    WHEN COUNT(CASE WHEN full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL) THEN 1 END) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM crm_leads;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 6: CRM_LEADS demo_company_name → company_name (COPIE)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '2. MIGRATION 6: crm_leads demo_company_name → company_name'
\echo '   Expected: All rows with demo_company_name should have company_name'
\echo ''

SELECT
  id,
  demo_company_name,
  company_name,
  CASE
    WHEN demo_company_name IS NOT NULL AND company_name IS NULL THEN '❌ FAIL - Copy not done'
    WHEN demo_company_name IS NULL AND company_name IS NULL THEN '⚠️ SKIP - No source data'
    WHEN demo_company_name IS NOT NULL AND company_name IS NOT NULL THEN '✅ PASS'
    ELSE '⚠️ PARTIAL'
  END as status
FROM crm_leads
ORDER BY created_at;

\echo ''

SELECT
  'MIGRATION 6' as migration,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN demo_company_name IS NOT NULL AND company_name IS NOT NULL THEN 1 END) as migrated,
  COUNT(CASE WHEN demo_company_name IS NOT NULL AND company_name IS NULL THEN 1 END) as failed,
  CASE
    WHEN COUNT(CASE WHEN demo_company_name IS NOT NULL AND company_name IS NULL THEN 1 END) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM crm_leads;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 7: DIR_CAR_MAKES tenant_id (FIX avec tenant système)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '3. MIGRATION 7: dir_car_makes NULL → tenant_id système'
\echo '   Expected: 0 rows with NULL tenant_id'
\echo ''

SELECT
  'MIGRATION 7' as migration,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as migrated,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as failed,
  CASE
    WHEN COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM dir_car_makes;

\echo ''

-- Show distribution by tenant
SELECT
  tenant_id,
  COUNT(*) as count,
  CASE
    WHEN tenant_id = '00000000-0000-0000-0000-000000000000' THEN 'System Tenant'
    ELSE 'Other Tenant'
  END as tenant_type
FROM dir_car_makes
GROUP BY tenant_id
ORDER BY count DESC;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 3: ADM_TENANTS name → subdomain (CALCUL)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '4. MIGRATION 3: adm_tenants name → subdomain'
\echo '   Expected: All tenants should have subdomain generated from name'
\echo ''

SELECT
  id,
  name,
  subdomain,
  CASE
    WHEN name IS NOT NULL AND subdomain IS NULL THEN '❌ FAIL - Subdomain not generated'
    WHEN name IS NOT NULL AND subdomain IS NOT NULL THEN '✅ PASS'
    ELSE '⚠️ SKIP'
  END as status
FROM adm_tenants
ORDER BY created_at;

\echo ''

SELECT
  'MIGRATION 3' as migration,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN subdomain IS NOT NULL THEN 1 END) as migrated,
  COUNT(CASE WHEN name IS NOT NULL AND subdomain IS NULL THEN 1 END) as failed,
  CASE
    WHEN COUNT(CASE WHEN name IS NOT NULL AND subdomain IS NULL THEN 1 END) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM adm_tenants;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 4: ADM_TENANTS primary_contact_email (from first admin)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '5. MIGRATION 4: adm_tenants primary_contact_email from first admin'
\echo '   Expected: Tenants with admin members should have primary_contact_email'
\echo ''

SELECT
  t.id,
  t.name,
  t.primary_contact_email,
  (SELECT COUNT(*) FROM adm_members m WHERE m.tenant_id = t.id AND m.role = 'admin' AND m.deleted_at IS NULL) as admin_count,
  CASE
    WHEN (SELECT COUNT(*) FROM adm_members m WHERE m.tenant_id = t.id AND m.role = 'admin' AND m.deleted_at IS NULL) > 0
         AND t.primary_contact_email IS NULL THEN '❌ FAIL - Email not set'
    WHEN (SELECT COUNT(*) FROM adm_members m WHERE m.tenant_id = t.id AND m.role = 'admin' AND m.deleted_at IS NULL) > 0
         AND t.primary_contact_email IS NOT NULL THEN '✅ PASS'
    ELSE '⚠️ SKIP - No admin'
  END as status
FROM adm_tenants t
ORDER BY created_at;

\echo ''

SELECT
  'MIGRATION 4' as migration,
  COUNT(*) as total_tenants,
  COUNT(CASE WHEN primary_contact_email IS NOT NULL THEN 1 END) as with_email,
  COUNT(CASE WHEN primary_contact_email IS NULL THEN 1 END) as without_email,
  CASE
    WHEN COUNT(CASE
      WHEN (SELECT COUNT(*) FROM adm_members m WHERE m.tenant_id = adm_tenants.id AND m.role = 'admin' AND m.deleted_at IS NULL) > 0
           AND primary_contact_email IS NULL THEN 1
    END) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM adm_tenants;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 1: ADM_MEMBERS default_role_id (FIX)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '6. MIGRATION 1: adm_members default_role_id'
\echo '   Expected: All active members should have default_role_id'
\echo ''

SELECT
  'MIGRATION 1' as migration,
  COUNT(*) as total_members,
  COUNT(CASE WHEN default_role_id IS NOT NULL THEN 1 END) as with_role,
  COUNT(CASE WHEN default_role_id IS NULL THEN 1 END) as without_role,
  CASE
    WHEN COUNT(CASE WHEN deleted_at IS NULL AND default_role_id IS NULL THEN 1 END) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM adm_members
WHERE deleted_at IS NULL;

\echo ''

-- Show members without default_role_id
SELECT
  id,
  email,
  tenant_id,
  role,
  default_role_id,
  '❌ Missing default_role_id' as issue
FROM adm_members
WHERE deleted_at IS NULL AND default_role_id IS NULL
LIMIT 5;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 2: ADM_MEMBERS preferred_language (from tenant country_code)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '7. MIGRATION 2: adm_members preferred_language from tenant.country_code'
\echo '   Expected: All members should have preferred_language'
\echo ''

SELECT
  'MIGRATION 2' as migration,
  COUNT(*) as total_members,
  COUNT(CASE WHEN preferred_language IS NOT NULL THEN 1 END) as with_language,
  COUNT(CASE WHEN preferred_language IS NULL THEN 1 END) as without_language,
  CASE
    WHEN COUNT(CASE WHEN deleted_at IS NULL AND preferred_language IS NULL THEN 1 END) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM adm_members
WHERE deleted_at IS NULL;

\echo ''

-- Show language distribution
SELECT
  t.country_code,
  m.preferred_language,
  COUNT(*) as member_count,
  CASE
    WHEN t.country_code = 'AE' AND m.preferred_language = 'en' THEN '✅ Correct'
    WHEN t.country_code = 'FR' AND m.preferred_language = 'fr' THEN '✅ Correct'
    WHEN m.preferred_language IS NULL THEN '❌ NULL'
    ELSE '⚠️ Unexpected'
  END as status
FROM adm_members m
JOIN adm_tenants t ON m.tenant_id = t.id
WHERE m.deleted_at IS NULL
GROUP BY t.country_code, m.preferred_language
ORDER BY t.country_code, m.preferred_language;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 8: FLT_VEHICLES seats → passenger_capacity (COPIE)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '8. MIGRATION 8: flt_vehicles seats → passenger_capacity'
\echo '   Expected: All vehicles with seats should have passenger_capacity'
\echo ''

SELECT
  id,
  license_plate,
  seats,
  passenger_capacity,
  CASE
    WHEN seats IS NOT NULL AND passenger_capacity IS NULL THEN '❌ FAIL - Copy not done'
    WHEN seats IS NOT NULL AND passenger_capacity IS NOT NULL THEN '✅ PASS'
    ELSE '⚠️ SKIP'
  END as status
FROM flt_vehicles
WHERE deleted_at IS NULL;

\echo ''

SELECT
  'MIGRATION 8' as migration,
  COUNT(*) as total_vehicles,
  COUNT(CASE WHEN seats IS NOT NULL AND passenger_capacity IS NOT NULL THEN 1 END) as migrated,
  COUNT(CASE WHEN seats IS NOT NULL AND passenger_capacity IS NULL THEN 1 END) as failed,
  CASE
    WHEN COUNT(CASE WHEN seats IS NOT NULL AND passenger_capacity IS NULL THEN 1 END) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM flt_vehicles
WHERE deleted_at IS NULL;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 9: FLT_VEHICLES country_code (from tenant)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '9. MIGRATION 9: flt_vehicles country_code from tenant'
\echo '   Expected: All vehicles should have country_code'
\echo ''

SELECT
  v.id,
  v.license_plate,
  v.country_code as vehicle_country,
  t.country_code as tenant_country,
  CASE
    WHEN v.country_code IS NULL THEN '❌ FAIL - country_code NULL'
    WHEN v.country_code = t.country_code THEN '✅ PASS - Matches tenant'
    ELSE '⚠️ MISMATCH - Different from tenant'
  END as status
FROM flt_vehicles v
JOIN adm_tenants t ON v.tenant_id = t.id
WHERE v.deleted_at IS NULL;

\echo ''

SELECT
  'MIGRATION 9' as migration,
  COUNT(*) as total_vehicles,
  COUNT(CASE WHEN country_code IS NOT NULL THEN 1 END) as with_country,
  COUNT(CASE WHEN country_code IS NULL THEN 1 END) as without_country,
  CASE
    WHEN COUNT(CASE WHEN country_code IS NULL THEN 1 END) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM flt_vehicles
WHERE deleted_at IS NULL;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 10: RID_DRIVERS first_name + last_name → full_name (CONCAT)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '10. MIGRATION 10: rid_drivers first_name + last_name → full_name'
\echo '    Expected: All drivers with first_name+last_name should have full_name'
\echo ''

SELECT
  id,
  first_name,
  last_name,
  full_name,
  CASE
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND full_name IS NULL THEN '❌ FAIL - Concat not done'
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND full_name IS NOT NULL THEN '✅ PASS'
    ELSE '⚠️ SKIP'
  END as status
FROM rid_drivers
WHERE deleted_at IS NULL;

\echo ''

SELECT
  'MIGRATION 10' as migration,
  COUNT(*) as total_drivers,
  COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND full_name IS NOT NULL THEN 1 END) as migrated,
  COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND full_name IS NULL THEN 1 END) as failed,
  CASE
    WHEN COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND full_name IS NULL THEN 1 END) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM rid_drivers
WHERE deleted_at IS NULL;

\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- RÉSUMÉ FINAL: TOUTES LES MIGRATIONS
-- ═══════════════════════════════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════════════════'
\echo '  RÉSUMÉ FINAL: VÉRIFICATION DES 10 MIGRATIONS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

WITH migration_results AS (
  SELECT 5 as migration_num, 'crm_leads: full_name → first_name+last_name' as description,
    COUNT(CASE WHEN full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL) THEN 1 END) as failures
  FROM crm_leads

  UNION ALL

  SELECT 6, 'crm_leads: demo_company_name → company_name',
    COUNT(CASE WHEN demo_company_name IS NOT NULL AND company_name IS NULL THEN 1 END)
  FROM crm_leads

  UNION ALL

  SELECT 7, 'dir_car_makes: NULL → tenant_id',
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END)
  FROM dir_car_makes

  UNION ALL

  SELECT 3, 'adm_tenants: name → subdomain',
    COUNT(CASE WHEN name IS NOT NULL AND subdomain IS NULL THEN 1 END)
  FROM adm_tenants

  UNION ALL

  SELECT 4, 'adm_tenants: admin.email → primary_contact_email',
    COUNT(CASE
      WHEN (SELECT COUNT(*) FROM adm_members m WHERE m.tenant_id = adm_tenants.id AND m.role = 'admin' AND m.deleted_at IS NULL) > 0
           AND primary_contact_email IS NULL THEN 1
    END)
  FROM adm_tenants

  UNION ALL

  SELECT 1, 'adm_members: NULL → default_role_id',
    COUNT(CASE WHEN deleted_at IS NULL AND default_role_id IS NULL THEN 1 END)
  FROM adm_members

  UNION ALL

  SELECT 2, 'adm_members: tenant.country_code → preferred_language',
    COUNT(CASE WHEN deleted_at IS NULL AND preferred_language IS NULL THEN 1 END)
  FROM adm_members

  UNION ALL

  SELECT 8, 'flt_vehicles: seats → passenger_capacity',
    COUNT(CASE WHEN seats IS NOT NULL AND passenger_capacity IS NULL THEN 1 END)
  FROM flt_vehicles WHERE deleted_at IS NULL

  UNION ALL

  SELECT 9, 'flt_vehicles: tenant.country_code → country_code',
    COUNT(CASE WHEN country_code IS NULL THEN 1 END)
  FROM flt_vehicles WHERE deleted_at IS NULL

  UNION ALL

  SELECT 10, 'rid_drivers: first_name+last_name → full_name',
    COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND full_name IS NULL THEN 1 END)
  FROM rid_drivers WHERE deleted_at IS NULL
)
SELECT
  migration_num,
  description,
  failures,
  CASE WHEN failures = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM migration_results
ORDER BY migration_num;

\echo ''
\echo '✅ SESSION 14-09 COMPLETED: VÉRIFICATION COMPLÈTE DES MIGRATIONS'
\echo ''
