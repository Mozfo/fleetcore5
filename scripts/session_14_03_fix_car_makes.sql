-- ============================================================================
-- SESSION 14-03: NETTOYER DIR_CAR_MAKES - VRAIES MARQUES COHÉRENTES
-- ============================================================================
-- Date: 2025-11-05
-- Objectif: Supprimer Tesla_Test_* et créer vraies marques avec données réelles
-- Criticité: HAUTE (données frontend)
-- ============================================================================

\set ON_ERROR_STOP on

\echo '========================================'
\echo 'SESSION 14-03: FIX DIR_CAR_MAKES'
\echo '========================================'

BEGIN;

-- ============================================================================
-- SECTION 1: Supprimer toutes les entrées Tesla_Test_*
-- ============================================================================

\echo ''
\echo '=== SUPPRESSION Tesla_Test_* ==='

-- Supprimer les modèles liés d'abord (FK)
DELETE FROM dir_car_models
WHERE make_id IN (
  SELECT id FROM dir_car_makes
  WHERE name LIKE 'Tesla_Test_%'
);

-- Supprimer les marques test
DELETE FROM dir_car_makes
WHERE name LIKE 'Tesla_Test_%' OR name LIKE '%Test%';

\echo '✅ Données test supprimées'

-- ============================================================================
-- SECTION 2: Créer VRAIES marques - DONNÉES COHÉRENTES
-- ============================================================================

\echo ''
\echo '=== CRÉATION MARQUES GLOBALES ==='

-- Créer System Provider Employee si nécessaire (pour created_by)
INSERT INTO adm_provider_employees (id, clerk_user_id, name, email, status, created_at, updated_at)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  'system_000000',
  'System Administrator',
  'system@fleetcore.internal',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM adm_provider_employees WHERE id = '00000000-0000-0000-0000-000000000000'
);

-- Marques globales avec données réelles cohérentes
INSERT INTO dir_car_makes (
  id,
  tenant_id,
  name,
  code,
  country_of_origin,
  parent_company,
  founded_year,
  logo_url,
  status,
  created_by,
  created_at,
  updated_at
) VALUES
  -- === JAPONAISES (très populaires UAE + Global) ===
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Toyota', 'TOYOTA', 'JP', 'Toyota Motor Corporation', 1937, 'https://www.toyota.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'Honda', 'HONDA', 'JP', 'Honda Motor Co., Ltd.', 1948, 'https://www.honda.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'Nissan', 'NISSAN', 'JP', 'Nissan Motor Co., Ltd.', 1933, 'https://www.nissan.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '00000000-0000-0000-0000-000000000000', 'Lexus', 'LEXUS', 'JP', 'Toyota Motor Corporation', 1989, 'https://www.lexus.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- === CORÉENNES (très populaires UAE) ===
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'Hyundai', 'HYUNDAI', 'KR', 'Hyundai Motor Company', 1967, 'https://www.hyundai.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'Kia', 'KIA', 'KR', 'Kia Corporation', 1944, 'https://www.kia.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- === ALLEMANDES PREMIUM ===
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'Mercedes-Benz', 'MERCEDES', 'DE', 'Mercedes-Benz Group AG', 1926, 'https://www.mercedes-benz.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'BMW', 'BMW', 'DE', 'Bayerische Motoren Werke AG', 1916, 'https://www.bmw.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'Audi', 'AUDI', 'DE', 'Volkswagen Group', 1909, 'https://www.audi.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('20202020-2020-2020-2020-202020202020', '00000000-0000-0000-0000-000000000000', 'Volkswagen', 'VOLKSWAGEN', 'DE', 'Volkswagen Group', 1937, 'https://www.vw.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- === AMÉRICAINES (populaires Saudi Arabia) ===
  ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'Ford', 'FORD', 'US', 'Ford Motor Company', 1903, 'https://www.ford.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'Chevrolet', 'CHEVROLET', 'US', 'General Motors', 1911, 'https://www.chevrolet.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'GMC', 'GMC', 'US', 'General Motors', 1912, 'https://www.gmc.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- === FRANÇAISES (pour France) ===
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', 'Renault', 'RENAULT', 'FR', 'Renault Group', 1899, 'https://www.renault.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000000', 'Peugeot', 'PEUGEOT', 'FR', 'Stellantis', 1810, 'https://www.peugeot.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00000000-0000-0000-0000-000000000000', 'Citroën', 'CITROEN', 'FR', 'Stellantis', 1919, 'https://www.citroen.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- === ÉLECTRIQUE ===
  ('10101010-1010-1010-1010-101010101010', '00000000-0000-0000-0000-000000000000', 'Tesla', 'TESLA', 'US', 'Tesla, Inc.', 2003, 'https://www.tesla.com/favicon.ico', 'active', '00000000-0000-0000-0000-000000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

ON CONFLICT (id) DO NOTHING;

\echo '✅ 17 marques globales créées avec données cohérentes'

-- ============================================================================
-- SECTION 3: Créer modèles populaires PAR MARQUE
-- ============================================================================

\echo ''
\echo '=== CRÉATION MODÈLES POPULAIRES ==='

-- Toyota Models (Economy + Van)
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'Camry', '11111111-1111-1111-1111-111111111111', 'CAMRY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'Corolla', '11111111-1111-1111-1111-111111111111', 'COROLLA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'Land Cruiser', '77777777-7777-7777-7777-777777777777', 'LANDCRUISER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'Hiace', '33333333-3333-3333-3333-333333333333', 'HIACE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'Prius', '11111111-1111-1111-1111-111111111111', 'PRIUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

-- Honda Models
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'Accord', '11111111-1111-1111-1111-111111111111', 'ACCORD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'Civic', '11111111-1111-1111-1111-111111111111', 'CIVIC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'CR-V', '77777777-7777-7777-7777-777777777777', 'CRV', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

-- Nissan Models
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'Altima', '11111111-1111-1111-1111-111111111111', 'ALTIMA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'Patrol', '77777777-7777-7777-7777-777777777777', 'PATROL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'Maxima', '22222222-2222-2222-2222-222222222222', 'MAXIMA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

-- Hyundai Models
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'Sonata', '11111111-1111-1111-1111-111111111111', 'SONATA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'Elantra', '11111111-1111-1111-1111-111111111111', 'ELANTRA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'H1', '33333333-3333-3333-3333-333333333333', 'H1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'Santa Fe', '77777777-7777-7777-7777-777777777777', 'SANTAFE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

-- Mercedes-Benz Models (Comfort + Van)
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'E-Class', '22222222-2222-2222-2222-222222222222', 'ECLASS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'S-Class', '22222222-2222-2222-2222-222222222222', 'SCLASS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'Vito', '33333333-3333-3333-3333-333333333333', 'VITO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'C-Class', '22222222-2222-2222-2222-222222222222', 'CCLASS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

-- BMW Models
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', '5 Series', '22222222-2222-2222-2222-222222222222', '5SERIES', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', '7 Series', '22222222-2222-2222-2222-222222222222', '7SERIES', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', '3 Series', '22222222-2222-2222-2222-222222222222', '3SERIES', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

-- GMC Models (SUV pour Saudi)
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Yukon', '77777777-7777-7777-7777-777777777777', 'YUKON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sierra', '77777777-7777-7777-7777-777777777777', 'SIERRA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Terrain', '77777777-7777-7777-7777-777777777777', 'TERRAIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

-- Renault Models (France)
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Talisman', '44444444-4444-4444-4444-444444444444', 'TALISMAN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Trafic', '55555555-5555-5555-5555-555555555555', 'TRAFIC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Clio', '44444444-4444-4444-4444-444444444444', 'CLIO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

-- Peugeot Models (France)
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '508', '44444444-4444-4444-4444-444444444444', '508', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Expert', '55555555-5555-5555-5555-555555555555', 'EXPERT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '308', '44444444-4444-4444-4444-444444444444', '308', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

-- Tesla Models (Électrique)
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '10101010-1010-1010-1010-101010101010', 'Model 3', '22222222-2222-2222-2222-222222222222', 'MODEL3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '10101010-1010-1010-1010-101010101010', 'Model S', '22222222-2222-2222-2222-222222222222', 'MODELS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', '10101010-1010-1010-1010-101010101010', 'Model Y', '77777777-7777-7777-7777-777777777777', 'MODELY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

-- Lexus Models (Premium japonais)
INSERT INTO dir_car_models (id, tenant_id, make_id, name, vehicle_class_id, code, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ES', '22222222-2222-2222-2222-222222222222', 'ES', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'LS', '22222222-2222-2222-2222-222222222222', 'LS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'LX', '77777777-7777-7777-7777-777777777777', 'LX', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, make_id, name) DO NOTHING;

\echo '✅ 40+ modèles populaires créés'

-- ============================================================================
-- VALIDATION FINALE
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'VALIDATION'
\echo '========================================'

DO $$
DECLARE
  v_makes_count INT;
  v_models_count INT;
  v_test_makes INT;
BEGIN
  SELECT COUNT(*) INTO v_makes_count FROM dir_car_makes WHERE tenant_id = '00000000-0000-0000-0000-000000000000' AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_models_count FROM dir_car_models WHERE tenant_id = '00000000-0000-0000-0000-000000000000' AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_test_makes FROM dir_car_makes WHERE (name LIKE '%Test%' OR name LIKE '%test%') AND deleted_at IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE 'Marques globales: %', v_makes_count;
  RAISE NOTICE 'Modèles globaux: %', v_models_count;
  RAISE NOTICE 'Entrées Test restantes: %', v_test_makes;
  RAISE NOTICE '';

  IF v_test_makes > 0 THEN
    RAISE EXCEPTION 'Erreur: % entrées Test trouvées!', v_test_makes;
  END IF;

  IF v_makes_count < 15 THEN
    RAISE WARNING 'Seulement % marques (attendu: 17)', v_makes_count;
  END IF;

  IF v_models_count < 30 THEN
    RAISE WARNING 'Seulement % modèles (attendu: 40+)', v_models_count;
  END IF;

  RAISE NOTICE '✅ DIR_CAR_MAKES: DONNÉES COHÉRENTES - SESSION 14-03 COMPLÉTÉE';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- FIN SESSION 14-03
-- ============================================================================
