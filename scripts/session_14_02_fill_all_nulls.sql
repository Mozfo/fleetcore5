-- ============================================================================
-- SESSION 14-02: REMPLIR TOUS LES NULL CRITIQUES (FRONTEND + AUDIT)
-- ============================================================================
-- Date: 2025-11-05
-- Objectif: ZÉRO NULL dans colonnes frontend + valeurs audit
-- Criticité: HAUTE (frontend crash si NULL)
-- ============================================================================

\set ON_ERROR_STOP on

\echo '========================================'
\echo 'SESSION 14-02: REMPLIR TOUS LES NULL'
\echo '========================================'

BEGIN;

-- ============================================================================
-- SECTION 1: ADM_MEMBERS - Générer first_name + last_name depuis email
-- ============================================================================

\echo ''
\echo '=== REMPLIR adm_members.first_name + last_name ==='

-- Extraire depuis email (avant @)
UPDATE adm_members
SET
  first_name = CASE
    -- Si email contient un tiret ou underscore, prendre la première partie
    WHEN email LIKE '%-%' THEN INITCAP(SPLIT_PART(SPLIT_PART(email, '@', 1), '-', 1))
    WHEN email LIKE '%_%' THEN INITCAP(SPLIT_PART(SPLIT_PART(email, '@', 1), '_', 1))
    -- Sinon prendre tout avant @
    ELSE INITCAP(SPLIT_PART(email, '@', 1))
  END,
  last_name = CASE
    -- Si email contient un tiret, prendre après le premier tiret
    WHEN email LIKE '%-%' THEN INITCAP(SPLIT_PART(SPLIT_PART(email, '@', 1), '-', 2))
    -- Si email contient underscore, prendre après underscore
    WHEN email LIKE '%_%' THEN INITCAP(SPLIT_PART(SPLIT_PART(email, '@', 1), '_', 2))
    -- Sinon mettre "User"
    ELSE 'User'
  END
WHERE (first_name IS NULL OR last_name IS NULL)
  AND email IS NOT NULL
  AND deleted_at IS NULL;

\echo '✅ first_name + last_name remplis depuis email'

-- ============================================================================
-- SECTION 2: ADM_MEMBERS - Générer phone fictif
-- ============================================================================

\echo ''
\echo '=== REMPLIR adm_members.phone ==='

-- Générer phone basé sur tenant country + ID
UPDATE adm_members m
SET phone = CASE
  WHEN t.country_code = 'AE' THEN '+971-50-' || LPAD((ABS(HASHTEXT(m.id::text)) % 10000000)::text, 7, '0')
  WHEN t.country_code = 'FR' THEN '+33-6-' || LPAD((ABS(HASHTEXT(m.id::text)) % 100000000)::text, 8, '0')
  WHEN t.country_code = 'SA' THEN '+966-50-' || LPAD((ABS(HASHTEXT(m.id::text)) % 10000000)::text, 7, '0')
  ELSE '+971-50-' || LPAD((ABS(HASHTEXT(m.id::text)) % 10000000)::text, 7, '0')
END
FROM adm_tenants t
WHERE m.tenant_id = t.id
  AND m.phone IS NULL
  AND m.deleted_at IS NULL;

\echo '✅ phone généré pour tous les members'

-- ============================================================================
-- SECTION 3: DIR_COUNTRY_REGULATIONS - Dimensions véhicules
-- ============================================================================

\echo ''
\echo '=== REMPLIR dir_country_regulations (dimensions) ==='

UPDATE dir_country_regulations
SET
  -- Longueur minimum (cm)
  min_vehicle_length_cm = CASE country_code
    WHEN 'AE' THEN 380  -- 3.8m minimum (compact sedan)
    WHEN 'FR' THEN 350  -- 3.5m minimum (compact)
    WHEN 'SA' THEN 380  -- 3.8m minimum
    ELSE 380
  END,

  -- Largeur minimum (cm)
  min_vehicle_width_cm = CASE country_code
    WHEN 'AE' THEN 165  -- 1.65m minimum
    WHEN 'FR' THEN 160  -- 1.60m minimum
    WHEN 'SA' THEN 165  -- 1.65m minimum
    ELSE 165
  END,

  -- Hauteur minimum (cm)
  min_vehicle_height_cm = CASE country_code
    WHEN 'AE' THEN 140  -- 1.40m minimum
    WHEN 'FR' THEN 135  -- 1.35m minimum
    WHEN 'SA' THEN 140  -- 1.40m minimum
    ELSE 140
  END,

  -- Poids maximum (kg)
  max_vehicle_weight_kg = CASE country_code
    WHEN 'AE' THEN 3500  -- 3.5 tonnes max
    WHEN 'FR' THEN 3500  -- 3.5 tonnes max
    WHEN 'SA' THEN 3500  -- 3.5 tonnes max
    ELSE 3500
  END,

  -- Kilométrage maximum (km)
  max_vehicle_mileage_km = CASE country_code
    WHEN 'AE' THEN 500000  -- 500k km max
    WHEN 'FR' THEN 400000  -- 400k km max
    WHEN 'SA' THEN 500000  -- 500k km max
    ELSE 500000
  END,

  -- Licence professionnelle requise
  requires_professional_license = CASE country_code
    WHEN 'AE' THEN false  -- Pas obligatoire aux UAE
    WHEN 'FR' THEN true   -- Carte VTC obligatoire en France
    WHEN 'SA' THEN false  -- Pas obligatoire en Arabie
    ELSE false
  END
WHERE min_vehicle_length_cm IS NULL
  OR min_vehicle_width_cm IS NULL
  OR max_vehicle_weight_kg IS NULL
  OR requires_professional_license IS NULL;

\echo '✅ dir_country_regulations dimensions remplies'

-- ============================================================================
-- SECTION 4: DIR_COUNTRY_REGULATIONS - min_vehicle_class_id
-- ============================================================================

\echo ''
\echo '=== REMPLIR dir_country_regulations.min_vehicle_class_id ==='

-- Assigner la classe Economy/Standard la plus basique par pays
UPDATE dir_country_regulations cr
SET min_vehicle_class_id = (
  SELECT vc.id
  FROM dir_vehicle_classes vc
  WHERE vc.country_code = cr.country_code
    AND vc.deleted_at IS NULL
  ORDER BY vc.min_seats ASC, vc.created_at ASC
  LIMIT 1
)
WHERE min_vehicle_class_id IS NULL;

\echo '✅ min_vehicle_class_id assigné (classe minimale)'

-- ============================================================================
-- SECTION 5: Créer System Provider Employee pour audit
-- ============================================================================

\echo ''
\echo '=== CRÉER SYSTEM PROVIDER EMPLOYEE ==='

-- Créer entrée système dans adm_provider_employees
INSERT INTO adm_provider_employees (
  id,
  clerk_user_id,
  name,
  email,
  title,
  department,
  status,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  'system_000000',  -- Unique clerk ID
  'System Administrator',
  'system@fleetcore.internal',
  'System Admin',
  'Infrastructure',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM adm_provider_employees
  WHERE id = '00000000-0000-0000-0000-000000000000'
);

\echo '✅ System provider employee créé'

-- ============================================================================
-- SECTION 6: AUDIT FIELDS - created_by = System UUID
-- ============================================================================

\echo ''
\echo '=== REMPLIR ZONES AUDIT (created_by = system) ==='

-- UUID système pour audit
DO $$
DECLARE
  v_system_uuid UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- dir_country_regulations
  UPDATE dir_country_regulations
  SET created_by = v_system_uuid
  WHERE created_by IS NULL;

  RAISE NOTICE '✅ dir_country_regulations.created_by rempli';

  -- dir_vehicle_classes
  UPDATE dir_vehicle_classes
  SET created_by = v_system_uuid
  WHERE created_by IS NULL;

  RAISE NOTICE '✅ dir_vehicle_classes.created_by rempli';

  -- dir_platforms (pas de created_by, skip)

END $$;

-- ============================================================================
-- SECTION 7: ADM_TENANTS - primary_contact_phone
-- ============================================================================

\echo ''
\echo '=== REMPLIR adm_tenants.primary_contact_phone ==='

UPDATE adm_tenants t
SET primary_contact_phone = CASE t.country_code
  WHEN 'AE' THEN '+971-4-' || LPAD((ABS(HASHTEXT(t.id::text)) % 10000000)::text, 7, '0')
  WHEN 'FR' THEN '+33-1-' || LPAD((ABS(HASHTEXT(t.id::text)) % 100000000)::text, 8, '0')
  WHEN 'SA' THEN '+966-11-' || LPAD((ABS(HASHTEXT(t.id::text)) % 10000000)::text, 7, '0')
  ELSE '+971-4-' || LPAD((ABS(HASHTEXT(t.id::text)) % 10000000)::text, 7, '0')
END
WHERE primary_contact_phone IS NULL;

\echo '✅ adm_tenants.primary_contact_phone rempli'

-- ============================================================================
-- SECTION 8: DIR_COUNTRY_REGULATIONS - required_documents (JSONB)
-- ============================================================================

\echo ''
\echo '=== REMPLIR dir_country_regulations.required_documents ==='

UPDATE dir_country_regulations
SET required_documents = CASE country_code
  WHEN 'AE' THEN
    '{"driver": ["emirates_id", "driving_license", "rta_permit"], "vehicle": ["registration_card", "insurance", "rta_sticker"]}'::jsonb
  WHEN 'FR' THEN
    '{"driver": ["carte_vtc", "permis_conduire", "carte_identite"], "vehicle": ["carte_grise", "assurance", "controle_technique"]}'::jsonb
  WHEN 'SA' THEN
    '{"driver": ["saudi_id", "driving_license", "transport_permit"], "vehicle": ["registration", "insurance", "inspection_certificate"]}'::jsonb
  ELSE
    '{"driver": ["id", "license"], "vehicle": ["registration", "insurance"]}'::jsonb
END
WHERE required_documents IS NULL;

\echo '✅ dir_country_regulations.required_documents rempli'

-- ============================================================================
-- VALIDATION FINALE
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'VALIDATION FINALE'
\echo '========================================'

DO $$
DECLARE
  v_null_first_name INT;
  v_null_last_name INT;
  v_null_phone_members INT;
  v_null_phone_tenants INT;
  v_null_dimensions INT;
  v_null_created_by_country INT;
  v_null_created_by_classes INT;
  v_null_min_class INT;
  v_null_req_license INT;
  v_null_req_docs INT;
BEGIN
  -- ADM_MEMBERS
  SELECT COUNT(*) INTO v_null_first_name FROM adm_members WHERE first_name IS NULL AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_null_last_name FROM adm_members WHERE last_name IS NULL AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_null_phone_members FROM adm_members WHERE phone IS NULL AND deleted_at IS NULL;

  -- ADM_TENANTS
  SELECT COUNT(*) INTO v_null_phone_tenants FROM adm_tenants WHERE primary_contact_phone IS NULL;

  -- DIR_COUNTRY_REGULATIONS
  SELECT COUNT(*) INTO v_null_dimensions
  FROM dir_country_regulations
  WHERE min_vehicle_length_cm IS NULL
    OR min_vehicle_width_cm IS NULL
    OR max_vehicle_weight_kg IS NULL;

  SELECT COUNT(*) INTO v_null_created_by_country FROM dir_country_regulations WHERE created_by IS NULL;
  SELECT COUNT(*) INTO v_null_min_class FROM dir_country_regulations WHERE min_vehicle_class_id IS NULL;
  SELECT COUNT(*) INTO v_null_req_license FROM dir_country_regulations WHERE requires_professional_license IS NULL;
  SELECT COUNT(*) INTO v_null_req_docs FROM dir_country_regulations WHERE required_documents IS NULL;

  -- DIR_VEHICLE_CLASSES
  SELECT COUNT(*) INTO v_null_created_by_classes FROM dir_vehicle_classes WHERE created_by IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '=== RÉSULTATS VALIDATION ===';
  RAISE NOTICE 'adm_members.first_name NULL: %', v_null_first_name;
  RAISE NOTICE 'adm_members.last_name NULL: %', v_null_last_name;
  RAISE NOTICE 'adm_members.phone NULL: %', v_null_phone_members;
  RAISE NOTICE 'adm_tenants.primary_contact_phone NULL: %', v_null_phone_tenants;
  RAISE NOTICE 'dir_country_regulations dimensions NULL: %', v_null_dimensions;
  RAISE NOTICE 'dir_country_regulations.created_by NULL: %', v_null_created_by_country;
  RAISE NOTICE 'dir_country_regulations.min_vehicle_class_id NULL: %', v_null_min_class;
  RAISE NOTICE 'dir_country_regulations.requires_professional_license NULL: %', v_null_req_license;
  RAISE NOTICE 'dir_country_regulations.required_documents NULL: %', v_null_req_docs;
  RAISE NOTICE 'dir_vehicle_classes.created_by NULL: %', v_null_created_by_classes;
  RAISE NOTICE '';

  -- Vérifier si des NULL critiques restent
  IF v_null_first_name > 0 OR v_null_last_name > 0 OR v_null_phone_members > 0 THEN
    RAISE EXCEPTION 'ÉCHEC: Members avec NULL first_name/last_name/phone';
  END IF;

  IF v_null_dimensions > 0 OR v_null_req_license > 0 OR v_null_min_class > 0 THEN
    RAISE EXCEPTION 'ÉCHEC: dir_country_regulations avec NULL critiques';
  END IF;

  RAISE NOTICE '✅ TOUS LES NULL CRITIQUES REMPLIS - SESSION 14-02 COMPLÉTÉE';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================================
-- FIN SESSION 14-02
-- ============================================================================
