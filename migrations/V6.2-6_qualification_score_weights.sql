-- V6.2-6: Ajouter score_weights et thresholds au qualification_framework
-- Les scores CPT doivent etre configurables, pas hardcodes
--
-- Verification avant execution:
-- SELECT setting_value FROM crm_settings WHERE setting_key = 'qualification_framework';
-- → Confirme qu'il n'y a pas encore de "score_weights" ni "thresholds"

BEGIN;

-- Ajouter score_weights et thresholds via merge JSONB
-- Le || merge les objets: si la cle n'existe pas, elle est ajoutee
UPDATE crm_settings
SET
  setting_value = setting_value || '{
    "score_weights": {
      "challenges": { "high": 40, "medium": 25, "low": 10 },
      "priority": { "high": 35, "medium": 20, "low": 10 },
      "timing": { "hot": 25, "warm": 15, "cool": 5, "cold": 0 }
    },
    "thresholds": {
      "proceed": 70,
      "nurture": 40
    }
  }'::jsonb,
  updated_at = NOW()
WHERE setting_key = 'qualification_framework';

COMMIT;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- SELECT
--   setting_key,
--   setting_value->>'version' as version,
--   setting_value->'score_weights' as score_weights,
--   setting_value->'thresholds' as thresholds
-- FROM crm_settings
-- WHERE setting_key = 'qualification_framework';
