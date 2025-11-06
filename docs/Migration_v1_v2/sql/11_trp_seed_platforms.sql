-- ============================================================================
-- SESSION 12 - MODULE TRP (Transport/Rides)
-- SEED DATA: Plateformes de Transport Initiales
-- ============================================================================
--
-- OBJECTIF:
--   Insertion des 4 plateformes principales du Middle East
--   Ces données sont des EXEMPLES - le système supporte TOUTES plateformes
--
-- RÉFÉRENCE: ../PLATFORM_PLUGIN_GUIDE.md pour ajouter d'autres plateformes
--
-- IMPORTANT:
--   ✅ Architecture EXTENSIBLE: dir_platforms peut contenir ANY plateforme
--   ✅ Pas d'enum plateforme → ajout dynamique sans migration schema
--   ✅ api_config JSONB → configuration unique par plateforme
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SEED DATA: 4 Plateformes Principales Middle East
-- ----------------------------------------------------------------------------

-- Note: Utilisation de DO $ EXCEPTION pour ignorer les doublons (idempotent)

-- Plateforme 1/4: Uber (Global Leader)
DO $$
BEGIN
  INSERT INTO dir_platforms (
  code,
  name,
  provider_category,
  supported_countries,
  status,
  api_config,
  metadata
) VALUES (
  'UBER',
  'Uber',
  'rideshare',
  '["US", "CA", "GB", "FR", "AE", "SA", "EG", "IN", "BR", "MX"]'::JSONB,
  'active'::lifecycle_status,
  '{
    "base_url": "https://api.uber.com/v1",
    "auth_type": "oauth2",
    "api_version": "1.0",
    "supports_webhooks": true,
    "supports_real_time": true
  }'::JSONB,
  '{
    "documentation_url": "https://developer.uber.com",
    "features": ["real_time_tracking", "scheduled_rides", "uber_pool"],
    "commission_structure": {
      "type": "percentage",
      "rate": 25.0
    }
  }'::JSONB
  );
EXCEPTION
  WHEN unique_violation THEN NULL;
END $$;

-- Plateforme 2/4: Careem (Middle East Leader, acquired by Uber)
DO $$
BEGIN
  INSERT INTO dir_platforms (
  code,
  name,
  provider_category,
  supported_countries,
  status,
  api_config,
  metadata
) VALUES (
  'CAREEM',
  'Careem',
  'rideshare',
  '["AE", "SA", "KW", "BH", "OM", "QA", "JO", "LB", "EG", "PK"]'::JSONB,
  'active'::lifecycle_status,
  '{
    "base_url": "https://api.careem.com/v1",
    "auth_type": "oauth2",
    "api_version": "1.0",
    "supports_webhooks": true,
    "supports_real_time": true
  }'::JSONB,
  '{
    "documentation_url": "https://developer.careem.com",
    "features": ["real_time_tracking", "scheduled_rides", "careem_bike"],
    "commission_structure": {
      "type": "percentage",
      "rate": 20.0
    }
  }'::JSONB
  );
EXCEPTION
  WHEN unique_violation THEN NULL;
END $$;

-- Plateforme 3/4: Bolt (Europe & Middle East)
DO $$
BEGIN
  INSERT INTO dir_platforms (
  code,
  name,
  provider_category,
  supported_countries,
  status,
  api_config,
  metadata
) VALUES (
  'BOLT',
  'Bolt',
  'rideshare',
  '["AE", "SA", "EE", "LV", "LT", "PL", "RO", "ZA", "KE", "NG"]'::JSONB,
  'active'::lifecycle_status,
  '{
    "base_url": "https://api.bolt.eu/v1",
    "auth_type": "api_key",
    "api_version": "1.0",
    "supports_webhooks": true,
    "supports_real_time": true
  }'::JSONB,
  '{
    "documentation_url": "https://docs.bolt.eu",
    "features": ["real_time_tracking", "scheduled_rides", "bolt_scooter"],
    "commission_structure": {
      "type": "percentage",
      "rate": 15.0
    }
  }'::JSONB
  );
EXCEPTION
  WHEN unique_violation THEN NULL;
END $$;

-- Plateforme 4/4: Yango (Russia & Middle East, by Yandex)
DO $$
BEGIN
  INSERT INTO dir_platforms (
  code,
  name,
  provider_category,
  supported_countries,
  status,
  api_config,
  metadata
) VALUES (
  'YANGO',
  'Yango',
  'rideshare',
  '["RU", "AE", "SA", "JO", "GH", "CI", "SN", "UZ", "FI", "NO"]'::JSONB,
  'active'::lifecycle_status,
  '{
    "base_url": "https://api.yango.com/v1",
    "auth_type": "bearer_token",
    "api_version": "1.0",
    "supports_webhooks": false,
    "supports_real_time": true
  }'::JSONB,
  '{
    "documentation_url": "https://yango.com/developers",
    "features": ["real_time_tracking", "cash_payment"],
    "commission_structure": {
      "type": "percentage",
      "rate": 18.0
    }
  }'::JSONB
  );
EXCEPTION
  WHEN unique_violation THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- VALIDATION: Vérifier que les 4 plateformes sont insérées
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM dir_platforms
  WHERE code IN ('UBER', 'CAREEM', 'BOLT', 'YANGO');

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED DATA - PLATEFORMES INITIALES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Plateformes insérées: % / 4', v_count;

  IF v_count = 4 THEN
    RAISE NOTICE '✓ Seed data complet';
  ELSE
    RAISE NOTICE '⚠ Seed data incomplet (% plateformes)', v_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: Ces 4 plateformes sont des EXEMPLES';
  RAISE NOTICE 'Le système supporte TOUTES plateformes!';
  RAISE NOTICE 'Voir: PLATFORM_PLUGIN_GUIDE.md pour ajouter autres';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- FIN SEED DATA
-- ============================================================================
