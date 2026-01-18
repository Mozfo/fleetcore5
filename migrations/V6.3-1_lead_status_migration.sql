-- =============================================================================
-- FLEETCORE CRM V6.3 - MIGRATION LEADS (10 → 8 STATUTS)
-- =============================================================================
-- Date: 17 Janvier 2026
-- Auteur: Claude Code
-- Description: Migration one-call close - suppression statuts intermédiaires
--
-- CHANGEMENTS:
--   - demo_scheduled → demo (renommage)
--   - qualified → proposal_sent (suppression)
--   - demo_completed → proposal_sent (suppression)
--
-- EXÉCUTER DANS: Supabase SQL Editor
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 0: VÉRIFICATION PRÉ-MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Afficher l'état actuel AVANT migration
SELECT '=== ÉTAT AVANT MIGRATION ===' AS info;

SELECT status, COUNT(*) as count
FROM crm_leads
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY status;

-- Vérifier la contrainte actuelle
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'crm_leads'::regclass
AND conname = 'crm_leads_status_check';

-- Vérifier version actuelle de lead_status_workflow
SELECT setting_value->>'version' as current_version
FROM crm_settings
WHERE setting_key = 'lead_status_workflow';

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: SUPPRIMER L'ANCIENNE CONTRAINTE (AVANT migration)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1.1 Supprimer l'ancienne contrainte pour permettre la migration
ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_status_check;

SELECT 'Contrainte crm_leads_status_check supprimée' AS step_1;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: MIGRATION DES DONNÉES
-- ═══════════════════════════════════════════════════════════════════════════

-- 2.1 Migrer demo_scheduled → demo
UPDATE crm_leads
SET status = 'demo',
    updated_at = NOW()
WHERE status = 'demo_scheduled';

SELECT 'demo_scheduled → demo: ' || COUNT(*) || ' leads migrés' AS migration_1
FROM crm_leads WHERE status = 'demo';

-- 2.2 Migrer qualified → proposal_sent
UPDATE crm_leads
SET status = 'proposal_sent',
    updated_at = NOW()
WHERE status = 'qualified';

SELECT 'qualified → proposal_sent: Migration effectuée' AS migration_2;

-- 2.3 Migrer demo_completed → proposal_sent
UPDATE crm_leads
SET status = 'proposal_sent',
    updated_at = NOW()
WHERE status = 'demo_completed';

SELECT 'demo_completed → proposal_sent: Migration effectuée' AS migration_3;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: VÉRIFICATION - AUCUN ANCIEN STATUT NE DOIT RESTER
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    old_status_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_status_count
    FROM crm_leads
    WHERE status IN ('demo_scheduled', 'qualified', 'demo_completed')
    AND deleted_at IS NULL;

    IF old_status_count > 0 THEN
        RAISE EXCEPTION 'ERREUR: % leads ont encore un ancien statut. Migration incomplète!', old_status_count;
    END IF;

    RAISE NOTICE 'OK: Aucun ancien statut trouvé. Migration des données réussie.';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: CRÉER LA NOUVELLE CONTRAINTE CHECK (8 statuts)
-- ═══════════════════════════════════════════════════════════════════════════

-- 4.1 Créer la nouvelle contrainte V6.3 (8 statuts)
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_status_check
CHECK (status IN (
    'new',
    'demo',
    'proposal_sent',
    'payment_pending',
    'converted',
    'lost',
    'nurturing',
    'disqualified'
));

-- 4.2 Ajouter commentaire de version
COMMENT ON CONSTRAINT crm_leads_status_check ON crm_leads IS
'V6.3: 8 statuts one-call close (2026-01-17). Supprimés: qualified, demo_completed, demo_scheduled→demo';

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: MISE À JOUR CRM_SETTINGS - lead_status_workflow
-- ═══════════════════════════════════════════════════════════════════════════

-- 5.1 Mettre à jour lead_status_workflow avec la config V6.3
UPDATE crm_settings
SET
  setting_value = '{
    "version": "6.3.0",
    "statuses": [
      {
        "value": "new",
        "label_fr": "Nouveau",
        "label_en": "New",
        "label_ar": "جديد",
        "phase": "incomplete",
        "probability": 5,
        "color": "#6B7280",
        "icon": "sparkles",
        "description": "Email entré, wizard pas terminé",
        "allowed_transitions": ["demo", "nurturing", "disqualified"],
        "is_terminal": false
      },
      {
        "value": "demo",
        "label_fr": "Démo",
        "label_en": "Demo",
        "label_ar": "عرض توضيحي",
        "phase": "demo",
        "probability": 50,
        "color": "#3B82F6",
        "icon": "calendar",
        "description": "Wizard terminé, RDV booké, attente appel",
        "allowed_transitions": ["proposal_sent", "nurturing", "lost", "disqualified"],
        "is_terminal": false
      },
      {
        "value": "proposal_sent",
        "label_fr": "Proposition envoyée",
        "label_en": "Proposal Sent",
        "label_ar": "تم إرسال العرض",
        "phase": "proposal",
        "probability": 85,
        "color": "#F97316",
        "icon": "document-text",
        "description": "Lien paiement Stripe généré",
        "allowed_transitions": ["payment_pending", "lost", "nurturing"],
        "is_terminal": false
      },
      {
        "value": "payment_pending",
        "label_fr": "Paiement en attente",
        "label_en": "Payment Pending",
        "label_ar": "في انتظار الدفع",
        "phase": "proposal",
        "probability": 90,
        "color": "#EAB308",
        "icon": "credit-card",
        "description": "Lien envoyé, attente paiement",
        "allowed_transitions": ["converted", "lost"],
        "is_terminal": false
      },
      {
        "value": "converted",
        "label_fr": "Converti",
        "label_en": "Converted",
        "label_ar": "تم التحويل",
        "phase": "completed",
        "probability": 100,
        "color": "#22C55E",
        "icon": "badge-check",
        "description": "Paiement reçu, tenant créé",
        "allowed_transitions": [],
        "is_terminal": true,
        "is_won": true
      },
      {
        "value": "lost",
        "label_fr": "Perdu",
        "label_en": "Lost",
        "label_ar": "خسر",
        "phase": "completed",
        "probability": 0,
        "color": "#EF4444",
        "icon": "x-circle",
        "description": "Perdu définitivement",
        "allowed_transitions": ["nurturing"],
        "is_terminal": false,
        "requires_reason": true
      },
      {
        "value": "nurturing",
        "label_fr": "En nurturing",
        "label_en": "Nurturing",
        "label_ar": "رعاية",
        "phase": "completed",
        "probability": 15,
        "color": "#8B5CF6",
        "icon": "clock",
        "description": "Timing pas bon, relance programmée",
        "allowed_transitions": ["demo", "proposal_sent", "lost"],
        "is_terminal": false,
        "requires_reason": true,
        "transition_rules": {
          "demo": "lead_action_only",
          "proposal_sent": "lead_contact_sales"
        }
      },
      {
        "value": "disqualified",
        "label_fr": "Disqualifié",
        "label_en": "Disqualified",
        "label_ar": "غير مؤهل",
        "phase": "completed",
        "probability": 0,
        "color": "#1F2937",
        "icon": "ban",
        "description": "Hors cible / Red flag",
        "allowed_transitions": [],
        "is_terminal": true,
        "requires_reason": true
      }
    ],
    "phases": [
      {"value": "incomplete", "label_fr": "Incomplet", "label_en": "Incomplete", "label_ar": "غير مكتمل", "order": 1, "color": "#6B7280"},
      {"value": "demo", "label_fr": "Démo", "label_en": "Demo", "label_ar": "عرض توضيحي", "order": 2, "color": "#3B82F6"},
      {"value": "proposal", "label_fr": "Proposition", "label_en": "Proposal", "label_ar": "عرض", "order": 3, "color": "#F59E0B"},
      {"value": "completed", "label_fr": "Terminé", "label_en": "Completed", "label_ar": "مكتمل", "order": 4, "color": "#10B981"}
    ],
    "transition_rules": {
      "payment_pending_to_converted": "Only via Stripe checkout.session.completed webhook",
      "nurturing_to_demo": "lead_action_only - Lead must click Book Demo in nurturing email",
      "nurturing_to_proposal_sent": "lead_contact_sales - Lead contacts commercial directly",
      "lost_requires_reason": true,
      "disqualified_requires_reason": true,
      "nurturing_requires_reason": true
    }
  }'::jsonb,
  schema_version = '6.3.0',
  updated_at = NOW()
WHERE setting_key = 'lead_status_workflow';

-- 5.2 Mettre à jour ou créer lead_phases (4 phases V6.3)
INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  is_system,
  description,
  created_at,
  updated_at
)
VALUES (
  'lead_phases',
  '{
    "version": "6.3.0",
    "phases": [
      {
        "key": "incomplete",
        "order": 1,
        "label_en": "Incomplete",
        "label_fr": "Incomplet",
        "label_ar": "غير مكتمل",
        "statuses": ["new"],
        "color": "#6B7280",
        "description_en": "Wizard not completed",
        "description_fr": "Wizard non terminé"
      },
      {
        "key": "demo",
        "order": 2,
        "label_en": "Demo",
        "label_fr": "Démo",
        "label_ar": "عرض توضيحي",
        "statuses": ["demo"],
        "color": "#3B82F6",
        "description_en": "Waiting for scheduled call",
        "description_fr": "Attente appel planifié"
      },
      {
        "key": "proposal",
        "order": 3,
        "label_en": "Proposal",
        "label_fr": "Proposition",
        "label_ar": "عرض",
        "statuses": ["proposal_sent", "payment_pending"],
        "color": "#F59E0B",
        "description_en": "Payment link sent, waiting",
        "description_fr": "Lien paiement envoyé, attente"
      },
      {
        "key": "completed",
        "order": 4,
        "label_en": "Completed",
        "label_fr": "Terminé",
        "label_ar": "مكتمل",
        "statuses": ["converted", "lost", "nurturing", "disqualified"],
        "color": "#10B981",
        "description_en": "Final outcome",
        "description_fr": "Issue finale"
      }
    ]
  }'::jsonb,
  'stages',
  'object',
  true,
  'V6.3: 4 phases Kanban one-call close',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  schema_version = '6.3.0',
  updated_at = NOW();

-- 5.3 Mettre à jour loss_reasons avec raisons V6.3
UPDATE crm_settings
SET
  setting_value = '{
    "version": "6.3.0",
    "reasons": [
      {
        "code": "not_interested",
        "label_en": "Not interested",
        "label_fr": "Pas intéressé",
        "category": "lost",
        "requires_detail": false
      },
      {
        "code": "chose_competitor",
        "label_en": "Chose competitor",
        "label_fr": "A choisi un concurrent",
        "category": "lost",
        "requires_detail": true
      },
      {
        "code": "price_perception",
        "label_en": "Price perception",
        "label_fr": "Prix perçu trop élevé",
        "category": "lost",
        "requires_detail": false
      },
      {
        "code": "bad_timing",
        "label_en": "Bad timing",
        "label_fr": "Mauvais timing",
        "category": "lost",
        "requires_detail": false
      },
      {
        "code": "no_response",
        "label_en": "No response",
        "label_fr": "Ne répond plus",
        "category": "lost",
        "requires_detail": false
      },
      {
        "code": "no_show",
        "label_en": "No show",
        "label_fr": "No-show au RDV",
        "category": "lost",
        "requires_detail": false
      },
      {
        "code": "wrong_segment",
        "label_en": "Wrong segment",
        "label_fr": "Mauvais segment (1 véhicule)",
        "category": "disqualified",
        "requires_detail": false
      },
      {
        "code": "wrong_country",
        "label_en": "Wrong country",
        "label_fr": "Pays non couvert",
        "category": "disqualified",
        "requires_detail": false
      },
      {
        "code": "spam_fake",
        "label_en": "Spam/Fake",
        "label_fr": "Spam ou faux lead",
        "category": "disqualified",
        "requires_detail": false
      },
      {
        "code": "duplicate",
        "label_en": "Duplicate",
        "label_fr": "Doublon",
        "category": "disqualified",
        "requires_detail": false
      },
      {
        "code": "test_lead",
        "label_en": "Test lead",
        "label_fr": "Lead de test",
        "category": "disqualified",
        "requires_detail": false
      }
    ]
  }'::jsonb,
  schema_version = '6.3.0',
  updated_at = NOW()
WHERE setting_key = 'loss_reasons';

-- 5.4 Ajouter nurturing_reasons (nouveau pour V6.3)
INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  is_system,
  description,
  created_at,
  updated_at
)
VALUES (
  'nurturing_reasons',
  '{
    "version": "6.3.0",
    "reasons": [
      {
        "code": "wizard_incomplete",
        "label_en": "Incomplete wizard",
        "label_fr": "Wizard non complété",
        "source": "system",
        "from_status": ["new"]
      },
      {
        "code": "country_waitlist",
        "label_en": "Country waitlist",
        "label_fr": "Pays non disponible",
        "source": "system",
        "from_status": ["new"]
      },
      {
        "code": "timing_q1",
        "label_en": "Recontact Q1",
        "label_fr": "Recontacter Q1",
        "source": "commercial",
        "from_status": ["demo"]
      },
      {
        "code": "timing_q2",
        "label_en": "Recontact Q2",
        "label_fr": "Recontacter Q2",
        "source": "commercial",
        "from_status": ["demo"]
      },
      {
        "code": "timing_6months",
        "label_en": "In 6 months",
        "label_fr": "Dans 6 mois",
        "source": "commercial",
        "from_status": ["demo"]
      },
      {
        "code": "budget_next_year",
        "label_en": "Budget next year",
        "label_fr": "Budget année prochaine",
        "source": "commercial",
        "from_status": ["demo"]
      },
      {
        "code": "internal_discussion",
        "label_en": "Internal discussion",
        "label_fr": "Discussion interne",
        "source": "commercial",
        "from_status": ["demo"]
      },
      {
        "code": "needs_more_time",
        "label_en": "Needs more time",
        "label_fr": "Demande plus de temps",
        "source": "commercial",
        "from_status": ["proposal_sent"]
      }
    ]
  }'::jsonb,
  'workflows',
  'object',
  true,
  'V6.3: Raisons de passage en nurturing',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  schema_version = '6.3.0',
  updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 6: VÉRIFICATION POST-MIGRATION (dans la transaction)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  status_count INTEGER;
  version_check TEXT;
  phase_count INTEGER;
BEGIN
  -- Vérifier le nombre de statuts (doit être 8)
  SELECT jsonb_array_length(setting_value->'statuses')
  INTO status_count
  FROM crm_settings
  WHERE setting_key = 'lead_status_workflow';

  -- Vérifier la version
  SELECT setting_value->>'version'
  INTO version_check
  FROM crm_settings
  WHERE setting_key = 'lead_status_workflow';

  -- Vérifier le nombre de phases (doit être 4)
  SELECT jsonb_array_length(setting_value->'phases')
  INTO phase_count
  FROM crm_settings
  WHERE setting_key = 'lead_phases';

  -- Validations
  IF status_count != 8 THEN
    RAISE EXCEPTION 'ERREUR: Attendu 8 statuts, trouvé %', status_count;
  END IF;

  IF version_check != '6.3.0' THEN
    RAISE EXCEPTION 'ERREUR: Attendu version 6.3.0, trouvé %', version_check;
  END IF;

  IF phase_count != 4 THEN
    RAISE EXCEPTION 'ERREUR: Attendu 4 phases, trouvé %', phase_count;
  END IF;

  RAISE NOTICE '✅ Migration V6.3 validée: % statuts, % phases, version %',
    status_count, phase_count, version_check;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 7: VÉRIFICATION POST-MIGRATION (hors transaction)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '=== VÉRIFICATION POST-MIGRATION ===' AS info;

-- 7.1 Vérifier la nouvelle contrainte CHECK
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'crm_leads'::regclass
AND conname = 'crm_leads_status_check';

-- 7.2 Compter les leads par statut V6.3
SELECT status, COUNT(*) as count
FROM crm_leads
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY
    CASE status
        WHEN 'new' THEN 1
        WHEN 'demo' THEN 2
        WHEN 'proposal_sent' THEN 3
        WHEN 'payment_pending' THEN 4
        WHEN 'converted' THEN 5
        WHEN 'lost' THEN 6
        WHEN 'nurturing' THEN 7
        WHEN 'disqualified' THEN 8
    END;

-- 7.3 Vérifier qu'aucun ancien statut n'existe
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✅ OK: Aucun ancien statut trouvé'
        ELSE '❌ ERREUR: ' || COUNT(*) || ' leads avec ancien statut!'
    END as verification
FROM crm_leads
WHERE status IN ('demo_scheduled', 'qualified', 'demo_completed')
AND deleted_at IS NULL;

-- 7.4 Vérifier crm_settings
SELECT
    setting_key,
    setting_value->>'version' as version,
    CASE
        WHEN setting_key = 'lead_status_workflow' THEN jsonb_array_length(setting_value->'statuses')::text || ' statuts'
        WHEN setting_key = 'lead_phases' THEN jsonb_array_length(setting_value->'phases')::text || ' phases'
        WHEN setting_key = 'loss_reasons' THEN jsonb_array_length(setting_value->'reasons')::text || ' raisons'
        WHEN setting_key = 'nurturing_reasons' THEN jsonb_array_length(setting_value->'reasons')::text || ' raisons'
        ELSE 'N/A'
    END as details
FROM crm_settings
WHERE setting_key IN ('lead_status_workflow', 'lead_phases', 'loss_reasons', 'nurturing_reasons')
ORDER BY setting_key;

SELECT '=== MIGRATION V6.3 TERMINÉE ===' AS info;
