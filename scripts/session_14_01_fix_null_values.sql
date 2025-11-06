-- ============================================================================
-- SESSION 14-01: FIX NULL VALUES (Remplir colonnes critiques)
-- ============================================================================
-- Date: 2025-11-05
-- Objectif: Créer rôles par défaut pour les tenants et assigner aux members
-- Criticité: MOYENNE (amélioration qualité données)
-- ============================================================================

\set ON_ERROR_STOP on

\echo '========================================'
\echo 'SESSION 14-01: FIX NULL VALUES'
\echo '========================================'

BEGIN;

-- ============================================================================
-- SECTION 1: Créer rôles par défaut pour tenants sans rôles
-- ============================================================================

\echo ''
\echo '=== CRÉATION RÔLES PAR DÉFAUT ==='

-- 1. Dubai Fleet Operations
INSERT INTO adm_roles (
  id,
  tenant_id,
  name,
  slug,
  description,
  is_system,
  is_default,
  approval_required,
  created_at,
  updated_at
)
SELECT
  uuid_generate_v4(),
  t.id,
  'Default Member',
  'default-member',
  'Default role for all members',
  false,
  true,  -- C'est le rôle par défaut
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM adm_tenants t
WHERE t.name IN ('Dubai Fleet Operations', 'Paris VTC Services', 'FleetCore Test Organization')
  AND NOT EXISTS (
    SELECT 1 FROM adm_roles r
    WHERE r.tenant_id = t.id AND r.deleted_at IS NULL
  )
ON CONFLICT DO NOTHING;

\echo '✅ Rôles par défaut créés pour 3 tenants'

-- ============================================================================
-- SECTION 2: Assigner default_role_id aux members sans rôle
-- ============================================================================

\echo ''
\echo '=== ASSIGNATION default_role_id ==='

UPDATE adm_members m
SET default_role_id = (
  SELECT r.id
  FROM adm_roles r
  WHERE r.tenant_id = m.tenant_id
    AND r.is_default = true
    AND r.deleted_at IS NULL
  LIMIT 1
)
WHERE m.default_role_id IS NULL
  AND m.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM adm_roles r
    WHERE r.tenant_id = m.tenant_id
      AND r.is_default = true
      AND r.deleted_at IS NULL
  );

\echo '✅ default_role_id assignés'

-- ============================================================================
-- SECTION 3: Remplir primary_contact_email pour tenants avec members
-- ============================================================================

\echo ''
\echo '=== REMPLIR primary_contact_email ==='

-- Mettre l'email du premier member (pas besoin d'être admin)
UPDATE adm_tenants t
SET primary_contact_email = (
  SELECT m.email
  FROM adm_members m
  WHERE m.tenant_id = t.id
    AND m.deleted_at IS NULL
    AND m.email IS NOT NULL
  ORDER BY m.created_at ASC
  LIMIT 1
)
WHERE t.primary_contact_email IS NULL
  AND EXISTS (
    SELECT 1 FROM adm_members m
    WHERE m.tenant_id = t.id
      AND m.deleted_at IS NULL
      AND m.email IS NOT NULL
  );

\echo '✅ primary_contact_email remplis pour tenants avec members'

-- ============================================================================
-- SECTION 4: Créer rôles admin pour tenants avec role='admin'
-- ============================================================================

\echo ''
\echo '=== CRÉATION RÔLES ADMIN ==='

DO $$
DECLARE
  v_tenant_id UUID;
  v_tenant_name TEXT;
  v_role_id UUID;
BEGIN
  -- Pour chaque tenant avec des members role='admin' mais sans rôle admin
  FOR v_tenant_id, v_tenant_name IN
    SELECT DISTINCT m.tenant_id, t.name
    FROM adm_members m
    JOIN adm_tenants t ON m.tenant_id = t.id
    WHERE m.role = 'admin'
      AND m.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM adm_roles r
        WHERE r.tenant_id = m.tenant_id
          AND r.name ILIKE '%admin%'
          AND r.deleted_at IS NULL
      )
  LOOP
    -- Créer rôle admin avec slug unique par tenant
    INSERT INTO adm_roles (
      id,
      tenant_id,
      name,
      slug,
      description,
      is_system,
      is_default,
      approval_required,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      v_tenant_id,
      'Admin',
      'admin-' || REPLACE(LOWER(v_tenant_name), ' ', '-'),
      'Administrator role with full permissions',
      false,
      false,  -- Pas le rôle par défaut
      false,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING id INTO v_role_id;

    -- Assigner ce rôle aux admins de ce tenant
    UPDATE adm_members
    SET default_role_id = v_role_id
    WHERE tenant_id = v_tenant_id
      AND role = 'admin'
      AND default_role_id IS NULL
      AND deleted_at IS NULL;

    RAISE NOTICE '✅ Rôle admin créé et assigné pour tenant: %', v_tenant_name;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 5: Remplir dir_country_regulations (tarifs minimaux)
-- ============================================================================

\echo ''
\echo '=== REMPLIR dir_country_regulations (tarifs) ==='

UPDATE dir_country_regulations
SET
  min_fare_per_trip = CASE country_code
    WHEN 'AE' THEN 12.00  -- AED minimum trip fare Dubai
    WHEN 'FR' THEN 7.50   -- EUR minimum trip fare Paris
    WHEN 'SA' THEN 15.00  -- SAR minimum trip fare Riyadh
    ELSE 10.00
  END,
  min_fare_per_km = CASE country_code
    WHEN 'AE' THEN 1.80   -- AED per km
    WHEN 'FR' THEN 1.50   -- EUR per km
    WHEN 'SA' THEN 2.00   -- SAR per km
    ELSE 1.50
  END,
  min_fare_per_hour = CASE country_code
    WHEN 'AE' THEN 40.00  -- AED per hour
    WHEN 'FR' THEN 25.00  -- EUR per hour
    WHEN 'SA' THEN 50.00  -- SAR per hour
    ELSE 30.00
  END
WHERE min_fare_per_trip IS NULL
  OR min_fare_per_km IS NULL
  OR min_fare_per_hour IS NULL;

\echo '✅ dir_country_regulations tarifs remplis'

-- ============================================================================
-- SECTION 6: Remplir dir_vehicle_classes.criteria (critères JSONB)
-- ============================================================================

\echo ''
\echo '=== REMPLIR dir_vehicle_classes.criteria ==='

UPDATE dir_vehicle_classes
SET criteria = CASE
  -- UAE Economy
  WHEN id = '11111111-1111-1111-1111-111111111111' THEN
    '{"engine_min_cc": 1600, "min_comfort_score": 3, "allowed_fuel_types": ["petrol", "hybrid"], "required_features": ["air_conditioning", "power_windows"]}'::jsonb

  -- UAE Comfort
  WHEN id = '22222222-2222-2222-2222-222222222222' THEN
    '{"engine_min_cc": 2000, "min_comfort_score": 4, "allowed_fuel_types": ["petrol", "hybrid", "electric"], "required_features": ["air_conditioning", "leather_seats", "power_windows", "bluetooth"]}'::jsonb

  -- UAE Van
  WHEN id = '33333333-3333-3333-3333-333333333333' THEN
    '{"engine_min_cc": 2500, "min_comfort_score": 3, "allowed_fuel_types": ["diesel", "petrol"], "required_features": ["air_conditioning", "power_windows", "sliding_doors"]}'::jsonb

  -- France Berline
  WHEN id = '44444444-4444-4444-4444-444444444444' THEN
    '{"engine_min_cc": 1400, "min_comfort_score": 3, "allowed_fuel_types": ["diesel", "petrol", "hybrid"], "required_features": ["air_conditioning", "gps"]}'::jsonb

  -- France Van
  WHEN id = '55555555-5555-5555-5555-555555555555' THEN
    '{"engine_min_cc": 2000, "min_comfort_score": 3, "allowed_fuel_types": ["diesel"], "required_features": ["air_conditioning", "gps", "sliding_doors"]}'::jsonb

  -- SA Standard
  WHEN id = '66666666-6666-6666-6666-666666666666' THEN
    '{"engine_min_cc": 1800, "min_comfort_score": 3, "allowed_fuel_types": ["petrol"], "required_features": ["air_conditioning", "power_windows"]}'::jsonb

  -- SA SUV
  WHEN id = '77777777-7777-7777-7777-777777777777' THEN
    '{"engine_min_cc": 3000, "min_comfort_score": 4, "allowed_fuel_types": ["petrol", "diesel"], "required_features": ["air_conditioning", "4wd", "power_windows", "leather_seats"]}'::jsonb

  ELSE '{"engine_min_cc": 1600, "min_comfort_score": 3}'::jsonb
END
WHERE criteria IS NULL;

\echo '✅ dir_vehicle_classes.criteria remplis'

-- ============================================================================
-- VALIDATION FINALE
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'VALIDATION'
\echo '========================================'

DO $$
DECLARE
  v_null_role_count INT;
  v_null_email_count INT;
  v_null_email_with_members INT;
  v_null_tarifs INT;
  v_null_criteria INT;
BEGIN
  -- Compter members sans role
  SELECT COUNT(*) INTO v_null_role_count
  FROM adm_members
  WHERE default_role_id IS NULL AND deleted_at IS NULL;

  -- Compter tenants sans email
  SELECT COUNT(*) INTO v_null_email_count
  FROM adm_tenants
  WHERE primary_contact_email IS NULL;

  -- Compter tenants sans email MAIS avec members
  SELECT COUNT(*) INTO v_null_email_with_members
  FROM adm_tenants t
  WHERE t.primary_contact_email IS NULL
    AND EXISTS (
      SELECT 1 FROM adm_members m
      WHERE m.tenant_id = t.id AND m.deleted_at IS NULL
    );

  -- Compter dir_country_regulations avec tarifs NULL
  SELECT COUNT(*) INTO v_null_tarifs
  FROM dir_country_regulations
  WHERE min_fare_per_trip IS NULL
    OR min_fare_per_km IS NULL
    OR min_fare_per_hour IS NULL;

  -- Compter dir_vehicle_classes avec criteria NULL
  SELECT COUNT(*) INTO v_null_criteria
  FROM dir_vehicle_classes
  WHERE criteria IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '=== RÉSULTATS FINAUX ===';
  RAISE NOTICE 'Members sans default_role_id: %', v_null_role_count;
  RAISE NOTICE 'Tenants sans primary_contact_email: %', v_null_email_count;
  RAISE NOTICE 'Tenants avec members mais sans email: %', v_null_email_with_members;
  RAISE NOTICE 'Countries avec tarifs NULL: %', v_null_tarifs;
  RAISE NOTICE 'Vehicle classes avec criteria NULL: %', v_null_criteria;
  RAISE NOTICE '';

  IF v_null_email_with_members > 0 THEN
    RAISE WARNING 'Attention: % tenants avec members mais sans email de contact', v_null_email_with_members;
  END IF;

  IF v_null_role_count > 0 THEN
    RAISE WARNING 'Attention: % members sans default_role_id', v_null_role_count;
  END IF;

  IF v_null_tarifs > 0 THEN
    RAISE WARNING 'Attention: % countries avec tarifs NULL', v_null_tarifs;
  END IF;

  IF v_null_criteria > 0 THEN
    RAISE WARNING 'Attention: % vehicle classes avec criteria NULL', v_null_criteria;
  END IF;

  RAISE NOTICE '✅ SESSION 14-01 COMPLÉTÉE';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- FIN SESSION 14-01
-- ============================================================================
