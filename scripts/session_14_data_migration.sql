-- ═══════════════════════════════════════════════════════════════════════════
-- FLEETCORE V1→V2 MIGRATION
-- SESSION 14 : MIGRATION DONNÉES V1→V2
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Date création : 05 novembre 2025
-- Durée estimée : < 1 seconde (102 lignes totales)
--
-- OBJECTIF : Remplir colonnes V2 NULL depuis données V1 existantes
-- PÉRIMÈTRE : 5 tables avec migrations (59 lignes concernées)
--
-- MIGRATIONS :
--   1. crm_leads (3 lignes) - HAUTE PRIORITÉ
--      - full_name → first_name + last_name (SPLIT)
--      - demo_company_name → company_name (COPIE)
--
--   2. dir_car_makes (16 lignes) - HAUTE PRIORITÉ
--      - NULL → tenant_id (FIX avec tenant système)
--
--   3. adm_tenants (8 lignes) - MOYENNE PRIORITÉ
--      - name → subdomain (CALCUL)
--      - member.email → primary_contact_email (COPIE)
--
--   4. adm_members (30 lignes) - MOYENNE PRIORITÉ
--      - NULL → default_role_id (FIX)
--      - tenant.country_code → preferred_language (CALCUL)
--
--   5. flt_vehicles (1 ligne) - MOYENNE PRIORITÉ
--      - seats → passenger_capacity (COPIE)
--      - tenant.country_code → country_code (COPIE)
--
--   6. rid_drivers (1 ligne) - MOYENNE PRIORITÉ
--      - first_name + last_name → full_name (CONCAT)
--
-- TABLES SANS MIGRATION (43 lignes) :
--   - adm_audit_logs (41 lignes) : Colonnes V2 nouvelles/optionnelles
--   - adm_roles (1 ligne) : Colonnes V2 déjà remplies
--   - dir_car_models (1 ligne) : Colonnes V2 nouvelles
--
-- STRATÉGIE : Transaction unique (ROLLBACK complet si erreur)
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Activer timing pour mesurer performances
\timing on
\set ON_ERROR_STOP on

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo 'SESSION 14 : MIGRATION DONNÉES V1→V2'
\echo 'Début :'
SELECT NOW();
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo ''

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 0 : PRÉPARATION
-- ───────────────────────────────────────────────────────────────────────────

\echo '→ Comptage lignes AVANT migration...'

CREATE TEMP TABLE _session14_counts_before AS
SELECT
  'crm_leads' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(first_name) AS first_name_filled,
  COUNT(company_name) AS company_name_filled
FROM crm_leads
UNION ALL
SELECT
  'dir_car_makes',
  COUNT(*),
  0,
  COUNT(tenant_id)
FROM dir_car_makes
UNION ALL
SELECT
  'adm_tenants',
  COUNT(*),
  COUNT(subdomain),
  COUNT(primary_contact_email)
FROM adm_tenants
UNION ALL
SELECT
  'adm_members',
  COUNT(*),
  COUNT(default_role_id),
  COUNT(preferred_language)
FROM adm_members
UNION ALL
SELECT
  'flt_vehicles',
  COUNT(*),
  COUNT(passenger_capacity),
  COUNT(country_code)
FROM flt_vehicles
UNION ALL
SELECT
  'rid_drivers',
  COUNT(*),
  COUNT(full_name),
  0
FROM rid_drivers;

\echo ''
\echo 'État AVANT migration :'
SELECT * FROM _session14_counts_before ORDER BY table_name;
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- TRANSACTION UNIQUE
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 : HAUTE PRIORITÉ - CRM_LEADS (3 lignes)
-- ───────────────────────────────────────────────────────────────────────────

\echo '───────────────────────────────────────────────────────────────────────────'
\echo 'SECTION 1 : CRM_LEADS (HAUTE PRIORITÉ)'
\echo '───────────────────────────────────────────────────────────────────────────'
\echo ''

-- MIGRATION 5: full_name → first_name + last_name
\echo '→ MIGRATION 5: full_name → first_name + last_name (SPLIT)...'

-- Cas 1: Nom avec espace(s) - Split premier mot = first_name, reste = last_name
UPDATE crm_leads
SET
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
WHERE first_name IS NULL
  AND full_name IS NOT NULL
  AND full_name LIKE '% %';

-- Cas 2: Nom sans espace - Tout dans first_name
UPDATE crm_leads
SET first_name = full_name
WHERE first_name IS NULL
  AND full_name IS NOT NULL
  AND full_name NOT LIKE '% %';

\echo '✓ MIGRATION 5 complétée'

-- MIGRATION 6: demo_company_name → company_name
\echo '→ MIGRATION 6: demo_company_name → company_name (COPIE)...'

UPDATE crm_leads
SET company_name = demo_company_name
WHERE company_name IS NULL
  AND demo_company_name IS NOT NULL;

\echo '✓ MIGRATION 6 complétée'
\echo ''

-- Vérification CRM_LEADS
DO $$
DECLARE
  v_null_first_name INTEGER;
  v_null_company INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_first_name FROM crm_leads WHERE first_name IS NULL AND full_name IS NOT NULL;
  SELECT COUNT(*) INTO v_null_company FROM crm_leads WHERE company_name IS NULL AND demo_company_name IS NOT NULL;

  IF v_null_first_name > 0 THEN
    RAISE WARNING 'crm_leads: % lignes avec first_name toujours NULL', v_null_first_name;
  END IF;

  IF v_null_company > 0 THEN
    RAISE WARNING 'crm_leads: % lignes avec company_name toujours NULL', v_null_company;
  END IF;

  RAISE NOTICE '✅ CRM_LEADS: Migration complétée (first_name NULL: %, company_name NULL: %)', v_null_first_name, v_null_company;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 : HAUTE PRIORITÉ - DIR_CAR_MAKES (16 lignes)
-- ───────────────────────────────────────────────────────────────────────────

\echo '───────────────────────────────────────────────────────────────────────────'
\echo 'SECTION 2 : DIR_CAR_MAKES (HAUTE PRIORITÉ)'
\echo '───────────────────────────────────────────────────────────────────────────'
\echo ''

-- MIGRATION 7: NULL → tenant_id (tenant système)
\echo '→ MIGRATION 7: Assigner tenant_id NULL au tenant System...'

-- Vérifier que le tenant système existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM adm_tenants WHERE id = '00000000-0000-0000-0000-000000000000') THEN
    RAISE EXCEPTION 'Tenant système (00000000-0000-0000-0000-000000000000) introuvable!';
  END IF;
  RAISE NOTICE '✓ Tenant système trouvé';
END $$;

-- Assigner les 15 lignes NULL au tenant système
UPDATE dir_car_makes
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE tenant_id IS NULL;

\echo '✓ MIGRATION 7 complétée'
\echo ''

-- Vérification DIR_CAR_MAKES
DO $$
DECLARE
  v_null_tenant INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_tenant FROM dir_car_makes WHERE tenant_id IS NULL;

  IF v_null_tenant > 0 THEN
    RAISE WARNING 'dir_car_makes: % lignes avec tenant_id toujours NULL', v_null_tenant;
  END IF;

  RAISE NOTICE '✅ DIR_CAR_MAKES: Migration complétée (tenant_id NULL: %)', v_null_tenant;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 : MOYENNE PRIORITÉ - ADM_TENANTS (8 lignes)
-- ───────────────────────────────────────────────────────────────────────────

\echo '───────────────────────────────────────────────────────────────────────────'
\echo 'SECTION 3 : ADM_TENANTS (MOYENNE PRIORITÉ)'
\echo '───────────────────────────────────────────────────────────────────────────'
\echo ''

-- MIGRATION 3: name → subdomain
\echo '→ MIGRATION 3: Générer subdomain depuis name...'

UPDATE adm_tenants
SET subdomain = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),  -- Enlever caractères spéciaux
    '\s+', '-', 'g'  -- Remplacer espaces par tirets
  )
)
WHERE subdomain IS NULL;

\echo '✓ MIGRATION 3 complétée'

-- MIGRATION 4: member.email → primary_contact_email
\echo '→ MIGRATION 4: Récupérer primary_contact_email depuis premier admin...'

UPDATE adm_tenants t
SET primary_contact_email = (
  SELECT m.email
  FROM adm_members m
  WHERE m.tenant_id = t.id
    AND m.role = 'admin'
    AND m.deleted_at IS NULL
  ORDER BY m.created_at ASC
  LIMIT 1
)
WHERE t.primary_contact_email IS NULL;

\echo '✓ MIGRATION 4 complétée'
\echo ''

-- Vérification ADM_TENANTS
DO $$
DECLARE
  v_null_subdomain INTEGER;
  v_null_email INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_subdomain FROM adm_tenants WHERE subdomain IS NULL;
  SELECT COUNT(*) INTO v_null_email FROM adm_tenants WHERE primary_contact_email IS NULL;

  IF v_null_subdomain > 0 THEN
    RAISE WARNING 'adm_tenants: % lignes avec subdomain toujours NULL', v_null_subdomain;
  END IF;

  RAISE NOTICE '✅ ADM_TENANTS: Migration complétée (subdomain NULL: %, primary_contact_email NULL: %)', v_null_subdomain, v_null_email;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4 : MOYENNE PRIORITÉ - ADM_MEMBERS (30 lignes)
-- ───────────────────────────────────────────────────────────────────────────

\echo '───────────────────────────────────────────────────────────────────────────'
\echo 'SECTION 4 : ADM_MEMBERS (MOYENNE PRIORITÉ)'
\echo '───────────────────────────────────────────────────────────────────────────'
\echo ''

-- MIGRATION 1: NULL → default_role_id (pour tenant CI)
\echo '→ MIGRATION 1: Assigner default_role_id pour tenant CI...'

UPDATE adm_members
SET default_role_id = 'aef858a5-b42a-437b-aefa-d8e6f01d71f5'
WHERE default_role_id IS NULL
  AND tenant_id = 'bfea0f9d-2ae3-42cc-8506-7ce1ed4c67bb';

\echo '✓ MIGRATION 1 complétée'

-- MIGRATION 2: tenant.country_code → preferred_language
\echo '→ MIGRATION 2: Déduire preferred_language depuis tenant.country_code...'

UPDATE adm_members m
SET preferred_language = CASE
  WHEN t.country_code = 'AE' THEN 'en'
  WHEN t.country_code = 'FR' THEN 'fr'
  ELSE 'en'
END
FROM adm_tenants t
WHERE m.tenant_id = t.id
  AND m.preferred_language IS NULL;

\echo '✓ MIGRATION 2 complétée'
\echo ''

-- Vérification ADM_MEMBERS
DO $$
DECLARE
  v_null_role INTEGER;
  v_null_lang INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_role FROM adm_members WHERE default_role_id IS NULL;
  SELECT COUNT(*) INTO v_null_lang FROM adm_members WHERE preferred_language IS NULL;

  RAISE NOTICE '✅ ADM_MEMBERS: Migration complétée (default_role_id NULL: %, preferred_language NULL: %)', v_null_role, v_null_lang;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 5 : MOYENNE PRIORITÉ - FLT_VEHICLES (1 ligne)
-- ───────────────────────────────────────────────────────────────────────────

\echo '───────────────────────────────────────────────────────────────────────────'
\echo 'SECTION 5 : FLT_VEHICLES (MOYENNE PRIORITÉ)'
\echo '───────────────────────────────────────────────────────────────────────────'
\echo ''

-- MIGRATION 8: seats → passenger_capacity
\echo '→ MIGRATION 8: Copier seats → passenger_capacity...'

UPDATE flt_vehicles
SET passenger_capacity = seats
WHERE passenger_capacity IS NULL
  AND seats IS NOT NULL;

\echo '✓ MIGRATION 8 complétée'

-- MIGRATION 9: tenant.country_code → country_code
\echo '→ MIGRATION 9: Récupérer country_code depuis tenant...'

UPDATE flt_vehicles v
SET country_code = t.country_code
FROM adm_tenants t
WHERE v.tenant_id = t.id
  AND v.country_code IS NULL;

\echo '✓ MIGRATION 9 complétée'
\echo ''

-- Vérification FLT_VEHICLES
DO $$
DECLARE
  v_null_capacity INTEGER;
  v_null_country INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_capacity FROM flt_vehicles WHERE passenger_capacity IS NULL AND seats IS NOT NULL;
  SELECT COUNT(*) INTO v_null_country FROM flt_vehicles WHERE country_code IS NULL;

  IF v_null_capacity > 0 OR v_null_country > 0 THEN
    RAISE WARNING 'flt_vehicles: passenger_capacity NULL: %, country_code NULL: %', v_null_capacity, v_null_country;
  END IF;

  RAISE NOTICE '✅ FLT_VEHICLES: Migration complétée (passenger_capacity NULL: %, country_code NULL: %)', v_null_capacity, v_null_country;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 6 : MOYENNE PRIORITÉ - RID_DRIVERS (1 ligne)
-- ───────────────────────────────────────────────────────────────────────────

\echo '───────────────────────────────────────────────────────────────────────────'
\echo 'SECTION 6 : RID_DRIVERS (MOYENNE PRIORITÉ)'
\echo '───────────────────────────────────────────────────────────────────────────'
\echo ''

-- MIGRATION 10: first_name + last_name → full_name
\echo '→ MIGRATION 10: Générer full_name depuis first_name + last_name...'

UPDATE rid_drivers
SET full_name = CONCAT(first_name, ' ', last_name)
WHERE full_name IS NULL
  AND first_name IS NOT NULL
  AND last_name IS NOT NULL;

\echo '✓ MIGRATION 10 complétée'
\echo ''

-- Vérification RID_DRIVERS
DO $$
DECLARE
  v_null_full_name INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_full_name FROM rid_drivers WHERE full_name IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL;

  IF v_null_full_name > 0 THEN
    RAISE WARNING 'rid_drivers: % lignes avec full_name toujours NULL', v_null_full_name;
  END IF;

  RAISE NOTICE '✅ RID_DRIVERS: Migration complétée (full_name NULL: %)', v_null_full_name;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- VALIDATION FINALE
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo 'VALIDATION FINALE'
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo ''

-- Comptage lignes APRÈS migration
\echo '→ Comptage lignes APRÈS migration...'

CREATE TEMP TABLE _session14_counts_after AS
SELECT
  'crm_leads' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(first_name) AS first_name_filled,
  COUNT(company_name) AS company_name_filled
FROM crm_leads
UNION ALL
SELECT
  'dir_car_makes',
  COUNT(*),
  0,
  COUNT(tenant_id)
FROM dir_car_makes
UNION ALL
SELECT
  'adm_tenants',
  COUNT(*),
  COUNT(subdomain),
  COUNT(primary_contact_email)
FROM adm_tenants
UNION ALL
SELECT
  'adm_members',
  COUNT(*),
  COUNT(default_role_id),
  COUNT(preferred_language)
FROM adm_members
UNION ALL
SELECT
  'flt_vehicles',
  COUNT(*),
  COUNT(passenger_capacity),
  COUNT(country_code)
FROM flt_vehicles
UNION ALL
SELECT
  'rid_drivers',
  COUNT(*),
  COUNT(full_name),
  0
FROM rid_drivers;

\echo ''
\echo 'État APRÈS migration :'
SELECT * FROM _session14_counts_after ORDER BY table_name;
\echo ''

-- Comparaison AVANT/APRÈS
\echo 'Différences AVANT/APRÈS (lignes totales - doit être 0) :'
SELECT
  COALESCE(a.table_name, b.table_name) AS table_name,
  b.total_rows AS before,
  a.total_rows AS after,
  a.total_rows - b.total_rows AS diff
FROM _session14_counts_after a
FULL OUTER JOIN _session14_counts_before b USING (table_name)
WHERE a.total_rows != b.total_rows OR a.total_rows IS NULL OR b.total_rows IS NULL;
\echo ''

-- Vérification finale des colonnes critiques
\echo 'Vérification colonnes V2 remplies :'

DO $$
DECLARE
  v_total_errors INTEGER := 0;
  v_errors TEXT := '';
BEGIN
  -- CRM_LEADS
  IF EXISTS (SELECT 1 FROM crm_leads WHERE first_name IS NULL AND full_name IS NOT NULL) THEN
    v_total_errors := v_total_errors + 1;
    v_errors := v_errors || E'\n  - crm_leads: first_name NULL avec full_name rempli';
  END IF;

  IF EXISTS (SELECT 1 FROM crm_leads WHERE company_name IS NULL AND demo_company_name IS NOT NULL) THEN
    v_total_errors := v_total_errors + 1;
    v_errors := v_errors || E'\n  - crm_leads: company_name NULL avec demo_company_name rempli';
  END IF;

  -- DIR_CAR_MAKES
  IF EXISTS (SELECT 1 FROM dir_car_makes WHERE tenant_id IS NULL) THEN
    v_total_errors := v_total_errors + 1;
    v_errors := v_errors || E'\n  - dir_car_makes: tenant_id NULL';
  END IF;

  -- FLT_VEHICLES
  IF EXISTS (SELECT 1 FROM flt_vehicles WHERE passenger_capacity IS NULL AND seats IS NOT NULL) THEN
    v_total_errors := v_total_errors + 1;
    v_errors := v_errors || E'\n  - flt_vehicles: passenger_capacity NULL avec seats rempli';
  END IF;

  IF EXISTS (SELECT 1 FROM flt_vehicles WHERE country_code IS NULL) THEN
    v_total_errors := v_total_errors + 1;
    v_errors := v_errors || E'\n  - flt_vehicles: country_code NULL';
  END IF;

  -- RID_DRIVERS
  IF EXISTS (SELECT 1 FROM rid_drivers WHERE full_name IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL) THEN
    v_total_errors := v_total_errors + 1;
    v_errors := v_errors || E'\n  - rid_drivers: full_name NULL avec first_name+last_name remplis';
  END IF;

  IF v_total_errors > 0 THEN
    RAISE WARNING 'ERREURS DÉTECTÉES (%): %', v_total_errors, v_errors;
    RAISE EXCEPTION 'Migration incomplète - ROLLBACK nécessaire';
  ELSE
    RAISE NOTICE '✅ TOUTES LES VÉRIFICATIONS PASSÉES - Aucune colonne V2 critique NULL';
  END IF;
END $$;

-- Si tout est OK, COMMIT
COMMIT;

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo 'RÉSUMÉ SESSION 14'
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo ''
\echo '✅ Migration données V1→V2 COMPLÉTÉE avec succès!'
\echo ''
\echo 'Tables migrées : 5 tables (59 lignes)'
\echo '  1. crm_leads (3 lignes) - 2 migrations'
\echo '  2. dir_car_makes (15 lignes) - 1 migration'
\echo '  3. adm_tenants (8 lignes) - 2 migrations'
\echo '  4. adm_members (30 lignes) - 2 migrations'
\echo '  5. flt_vehicles (1 ligne) - 2 migrations'
\echo '  6. rid_drivers (1 ligne) - 1 migration'
\echo ''
\echo 'Total migrations : 10 migrations'
\echo ''
\echo 'Fin :'
SELECT NOW();
\echo ''
\echo 'Prochaine étape : Session 15 (Indexes Soft Delete)'
\echo '═══════════════════════════════════════════════════════════════════════════'
