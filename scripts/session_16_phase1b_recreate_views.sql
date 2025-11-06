-- ═══════════════════════════════════════════════════════════════════════════════
-- SESSION 16 - PHASE 1B: RECREATE VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Recreate views after Phase 1 migration (after _v2 columns renamed)
-- ═══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  SESSION 16 - PHASE 1B: RECREATE VIEWS'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

BEGIN;

\echo '▶ Creating v_driver_profile...'

CREATE OR REPLACE VIEW v_driver_profile AS
SELECT
  d.id AS driver_id,
  d.tenant_id,
  d.first_name,
  d.last_name,
  d.email,
  d.phone,
  d.date_of_birth,
  d.gender,
  d.nationality,
  d.hire_date,
  d.employment_status,
  d.driver_status,
  d.cooperation_type,
  d.emergency_contact_name,
  d.emergency_contact_phone,
  d.license_number,
  d.license_issue_date,
  d.license_expiry_date,
  d.professional_card_no,
  d.professional_expiry,
  d.rating,
  d.created_at,
  d.updated_at,
  array_remove(array_agg(DISTINCT l.language_code) FILTER (WHERE l.deleted_at IS NULL), NULL::bpchar) AS languages,
  json_agg(json_build_object('code', l.language_code, 'proficiency', l.proficiency)) FILTER (WHERE l.deleted_at IS NULL) AS languages_detail
FROM rid_drivers d
LEFT JOIN rid_driver_languages l
  ON l.driver_id = d.id
  AND l.tenant_id = d.tenant_id
  AND l.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY
  d.id, d.tenant_id, d.first_name, d.last_name, d.email, d.phone,
  d.date_of_birth, d.gender, d.nationality, d.hire_date, d.employment_status,
  d.driver_status, d.cooperation_type, d.emergency_contact_name,
  d.emergency_contact_phone, d.license_number, d.license_issue_date,
  d.license_expiry_date, d.professional_card_no, d.professional_expiry,
  d.rating, d.created_at, d.updated_at;

\echo '  ✓ v_driver_profile created'

COMMIT;

\echo ''
\echo '✅ PHASE 1B COMPLÉTÉE: Views recréées'
\echo ''
