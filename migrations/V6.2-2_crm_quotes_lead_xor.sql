-- =============================================================================
-- FLEETCORE CRM V6.2-2 - CONTRAINTE XOR CRM_QUOTES
-- Date: 2026-01-04
-- Description: Quote liée à Lead (acquisition) OU Opportunity (upsell), jamais les deux
-- Référence: FLEETCORE_CRM_SPECIFICATION_V6_2_FINAL.md - Section 17.2
-- =============================================================================
--
-- PRÉ-REQUIS: Vérifier qu'aucune quote n'a les deux NULL ou les deux remplis
-- SELECT CASE
--   WHEN lead_id IS NULL AND opportunity_id IS NULL THEN 'BOTH_NULL'
--   WHEN lead_id IS NOT NULL AND opportunity_id IS NOT NULL THEN 'BOTH_SET'
--   ELSE 'OK'
-- END as state, COUNT(*) FROM crm_quotes GROUP BY 1;
--
-- INSTRUCTIONS:
-- 1. Ouvrir Supabase Dashboard > SQL Editor
-- 2. Copier-coller ce script
-- 3. Exécuter
-- =============================================================================

BEGIN;

-- Contrainte XOR : lead_id OU opportunity_id (jamais les deux, toujours l'un)
-- - Lead: acquisition Segment 4 (négociation)
-- - Opportunity: upsell futur depuis compte client existant
ALTER TABLE crm_quotes
ADD CONSTRAINT crm_quotes_lead_or_opportunity_xor
CHECK (
  (lead_id IS NOT NULL AND opportunity_id IS NULL) OR
  (lead_id IS NULL AND opportunity_id IS NOT NULL)
);

COMMENT ON CONSTRAINT crm_quotes_lead_or_opportunity_xor ON crm_quotes
IS 'V6.2: Quote liée à Lead (acquisition) OU Opportunity (upsell), jamais les deux';

COMMIT;

-- =============================================================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================================================
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'crm_quotes'::regclass
-- AND conname = 'crm_quotes_lead_or_opportunity_xor';

-- =============================================================================
-- ROLLBACK (si nécessaire)
-- =============================================================================
-- ALTER TABLE crm_quotes DROP CONSTRAINT IF EXISTS crm_quotes_lead_or_opportunity_xor;
