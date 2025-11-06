-- ============================================================================
-- SESSION 14-00: SEED TABLES DIR (CONFORMITÉ)
-- ============================================================================
-- Date: 2025-11-05
-- Objectif: Populer tables DIR vides avec données minimales (3+ lignes/table)
-- Criticité: HAUTE (bloque migrations Session 14)
-- ============================================================================

\set ON_ERROR_STOP on

\echo '========================================'
\echo 'SESSION 14-00: SEED TABLES DIR'
\echo '========================================'

-- ============================================================================
-- SECTION 1: dir_country_regulations (CRITIQUE - 3 pays minimum)
-- ============================================================================

\echo ''
\echo '=== SEED: dir_country_regulations ==='

INSERT INTO dir_country_regulations (
  country_code,
  currency,
  timezone,
  vat_rate,
  vehicle_max_age,
  requires_vtc_card,
  status,
  created_at,
  updated_at
) VALUES
  -- UAE (Emirates) - Production primaire
  (
    'AE',
    'AED',
    'Asia/Dubai',
    5.00,  -- VAT 5%
    10,    -- Max 10 ans
    false,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),

  -- France - Tenant existant
  (
    'FR',
    'EUR',
    'Europe/Paris',
    20.00,  -- VAT 20%
    8,      -- Max 8 ans pour VTC
    true,   -- Carte VTC obligatoire
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),

  -- Saudi Arabia - Extension régionale
  (
    'SA',
    'SAR',
    'Asia/Riyadh',
    15.00,  -- VAT 15%
    10,     -- Max 10 ans
    false,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (country_code) DO NOTHING;

\echo '✅ dir_country_regulations: 3 pays (AE, FR, SA)'

-- ============================================================================
-- SECTION 2: dir_vehicle_classes (DÉPEND de dir_country_regulations)
-- ============================================================================

\echo ''
\echo '=== SEED: dir_vehicle_classes ==='

INSERT INTO dir_vehicle_classes (
  id,
  country_code,
  name,
  description,
  max_age,
  min_seats,
  max_seats,
  code,
  status,
  created_at,
  updated_at
) VALUES
  -- UAE Classes
  (
    '11111111-1111-1111-1111-111111111111',
    'AE',
    'Economy',
    'Standard sedan vehicles (Toyota Camry, Honda Accord)',
    10,
    4,
    5,
    'ECONOMY',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'AE',
    'Comfort',
    'Premium sedan vehicles (Mercedes E-Class, BMW 5 Series)',
    8,
    4,
    5,
    'COMFORT',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'AE',
    'Van',
    'Multi-passenger vehicles (Toyota Hiace, Hyundai H1)',
    10,
    6,
    14,
    'VAN',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),

  -- France Classes
  (
    '44444444-4444-4444-4444-444444444444',
    'FR',
    'Berline',
    'Véhicules berline standard (Peugeot 508, Renault Talisman)',
    8,
    4,
    5,
    'BERLINE',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'FR',
    'Van',
    'Véhicules multi-passagers (Mercedes Vito, Renault Trafic)',
    8,
    6,
    9,
    'VAN',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),

  -- Saudi Arabia Classes
  (
    '66666666-6666-6666-6666-666666666666',
    'SA',
    'Standard',
    'Standard sedan vehicles (Toyota Camry, Hyundai Sonata)',
    10,
    4,
    5,
    'STANDARD',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'SA',
    'SUV',
    'SUV vehicles (Toyota Land Cruiser, GMC Yukon)',
    12,
    5,
    7,
    'SUV',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (id) DO NOTHING;

\echo '✅ dir_vehicle_classes: 7 classes (AE: 3, FR: 2, SA: 2)'

-- ============================================================================
-- SECTION 3: dir_platforms (CRITIQUE pour trp_trips)
-- ============================================================================

\echo ''
\echo '=== SEED: dir_platforms ==='

INSERT INTO dir_platforms (
  id,
  name,
  api_config,
  created_at,
  updated_at
) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Uber',
    '{"api_version": "v1.2", "base_url": "https://api.uber.com", "supported_regions": ["AE", "FR", "SA"]}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Careem',
    '{"api_version": "v2.0", "base_url": "https://api.careem.com", "supported_regions": ["AE", "SA"]}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Bolt',
    '{"api_version": "v3", "base_url": "https://api.bolt.eu", "supported_regions": ["AE", "FR"]}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (name) DO NOTHING;

\echo '✅ dir_platforms: 3 platforms (Uber, Careem, Bolt)'

-- ============================================================================
-- SECTION 4: dir_vehicle_statuses (pour flt_vehicles.status)
-- ============================================================================

\echo ''
\echo '=== SEED: dir_vehicle_statuses ==='

-- Vérifier si table existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='dir_vehicle_statuses'
  ) THEN
    -- Table existe, insérer données
    INSERT INTO dir_vehicle_statuses (code, label, description, created_at, updated_at)
    VALUES
      ('ACTIVE', 'Active', 'Vehicle is active and available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('MAINTENANCE', 'In Maintenance', 'Vehicle is under maintenance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('INACTIVE', 'Inactive', 'Vehicle is temporarily inactive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (code) DO NOTHING;

    RAISE NOTICE '✅ dir_vehicle_statuses: 3 statuses seeded';
  ELSE
    RAISE NOTICE '⚠️  dir_vehicle_statuses: table does not exist (skipping)';
  END IF;
END $$;

-- ============================================================================
-- SECTION 5: Autres tables DIR (si elles existent)
-- ============================================================================

\echo ''
\echo '=== SEED: Autres tables DIR (optionnel) ==='

-- dir_fine_types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dir_fine_types') THEN
    INSERT INTO dir_fine_types (code, label, amount, created_at, updated_at)
    VALUES
      ('SPEEDING', 'Speeding', 300.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('PARKING', 'Illegal Parking', 150.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('SEATBELT', 'Seatbelt Violation', 200.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (code) DO NOTHING;
    RAISE NOTICE '✅ dir_fine_types: 3 types seeded';
  END IF;
END $$;

-- dir_maintenance_types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dir_maintenance_types') THEN
    INSERT INTO dir_maintenance_types (code, label, description, created_at, updated_at)
    VALUES
      ('OIL_CHANGE', 'Oil Change', 'Regular oil change service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('TIRE_ROTATION', 'Tire Rotation', 'Tire rotation and balance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('INSPECTION', 'Annual Inspection', 'Annual vehicle inspection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (code) DO NOTHING;
    RAISE NOTICE '✅ dir_maintenance_types: 3 types seeded';
  END IF;
END $$;

-- dir_ownership_types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dir_ownership_types') THEN
    INSERT INTO dir_ownership_types (code, label, description, created_at, updated_at)
    VALUES
      ('OWNED', 'Company Owned', 'Vehicle owned by the company', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('LEASED', 'Leased', 'Vehicle leased from third party', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('DRIVER_OWNED', 'Driver Owned', 'Vehicle owned by driver', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (code) DO NOTHING;
    RAISE NOTICE '✅ dir_ownership_types: 3 types seeded';
  END IF;
END $$;

-- dir_toll_gates (dépend de dir_country_regulations)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dir_toll_gates') THEN
    INSERT INTO dir_toll_gates (id, country_code, name, location, fee, created_at, updated_at)
    VALUES
      (uuid_generate_v4(), 'AE', 'Salik Gate 1', '{"lat": 25.2048, "lng": 55.2708}', 4.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (uuid_generate_v4(), 'AE', 'Salik Gate 2', '{"lat": 25.2532, "lng": 55.3657}', 4.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (uuid_generate_v4(), 'FR', 'Péage Paris A1', '{"lat": 48.9522, "lng": 2.5453}', 2.50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE '✅ dir_toll_gates: 3 gates seeded';
  END IF;
END $$;

-- dir_transaction_types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dir_transaction_types') THEN
    INSERT INTO dir_transaction_types (code, label, description, created_at, updated_at)
    VALUES
      ('TRIP_INCOME', 'Trip Income', 'Revenue from completed trip', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('FUEL_EXPENSE', 'Fuel Expense', 'Fuel purchase expense', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('MAINTENANCE_EXPENSE', 'Maintenance Expense', 'Vehicle maintenance cost', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (code) DO NOTHING;
    RAISE NOTICE '✅ dir_transaction_types: 3 types seeded';
  END IF;
END $$;

-- dir_transaction_statuses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dir_transaction_statuses') THEN
    INSERT INTO dir_transaction_statuses (code, label, description, created_at, updated_at)
    VALUES
      ('PENDING', 'Pending', 'Transaction is pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('COMPLETED', 'Completed', 'Transaction completed successfully', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('FAILED', 'Failed', 'Transaction failed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (code) DO NOTHING;
    RAISE NOTICE '✅ dir_transaction_statuses: 3 statuses seeded';
  END IF;
END $$;

-- dir_platform_configs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dir_platform_configs') THEN
    INSERT INTO dir_platform_configs (platform_id, config_key, config_value, created_at, updated_at)
    SELECT
      p.id,
      'commission_rate',
      '{"rate": 0.25, "currency": "AED"}'::jsonb,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM dir_platforms p
    WHERE p.name = 'Uber'
    LIMIT 1
    ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ dir_platform_configs: seeded (if applicable)';
  END IF;
END $$;

-- ============================================================================
-- VALIDATION FINALE
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'VALIDATION SEED DIR TABLES'
\echo '========================================'

DO $$
DECLARE
  v_count_country INT;
  v_count_classes INT;
  v_count_platforms INT;
BEGIN
  SELECT COUNT(*) INTO v_count_country FROM dir_country_regulations;
  SELECT COUNT(*) INTO v_count_classes FROM dir_vehicle_classes;
  SELECT COUNT(*) INTO v_count_platforms FROM dir_platforms;

  RAISE NOTICE 'dir_country_regulations: % lignes', v_count_country;
  RAISE NOTICE 'dir_vehicle_classes: % lignes', v_count_classes;
  RAISE NOTICE 'dir_platforms: % lignes', v_count_platforms;

  IF v_count_country < 3 THEN
    RAISE EXCEPTION 'dir_country_regulations: insuffisant (% < 3)', v_count_country;
  END IF;

  IF v_count_classes < 3 THEN
    RAISE EXCEPTION 'dir_vehicle_classes: insuffisant (% < 3)', v_count_classes;
  END IF;

  IF v_count_platforms < 3 THEN
    RAISE EXCEPTION 'dir_platforms: insuffisant (% < 3)', v_count_platforms;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ SEED DIR TABLES: COMPLÉTÉ';
  RAISE NOTICE '========================================'  ;
END $$;

-- ============================================================================
-- FIN SESSION 14-00
-- ============================================================================
