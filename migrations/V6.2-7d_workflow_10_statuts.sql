-- ═══════════════════════════════════════════════════════════════════════════
-- V6.2-7d: Update lead_status_workflow to 10 Statuses
-- ═══════════════════════════════════════════════════════════════════════════
--
-- This migration updates crm_settings.lead_status_workflow from V6.2 (9 statuses)
-- to V6.2.1 (10 statuses) by adding 'payment_pending' status.
--
-- New flow: proposal_sent → payment_pending → converted
--
-- IMPORTANT: Run after V6.2-7c
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Update lead_status_workflow in crm_settings
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE crm_settings
SET
  setting_value = '{
    "version": "6.2.1",
    "statuses": [
      {
        "value": "new",
        "label_fr": "Nouveau",
        "label_en": "New",
        "phase": "discovery",
        "probability": 10,
        "color": "gray",
        "icon": "sparkles",
        "description": "Newly created lead",
        "allowed_transitions": ["demo_scheduled", "disqualified"],
        "auto_assign": true,
        "sla_hours": 4
      },
      {
        "value": "demo_scheduled",
        "label_fr": "Demo planifiée",
        "label_en": "Demo Scheduled",
        "phase": "discovery",
        "probability": 25,
        "color": "blue",
        "icon": "calendar",
        "description": "Demo has been scheduled via Cal.com",
        "allowed_transitions": ["qualified", "nurturing", "lost", "disqualified"],
        "auto_assign": false,
        "sla_hours": 24
      },
      {
        "value": "qualified",
        "label_fr": "Qualifié",
        "label_en": "Qualified",
        "phase": "qualification",
        "probability": 40,
        "color": "green",
        "icon": "check-circle",
        "description": "Lead qualified via CPT framework (score >= 70)",
        "allowed_transitions": ["demo_completed", "lost"],
        "auto_assign": false,
        "sla_hours": null
      },
      {
        "value": "demo_completed",
        "label_fr": "Demo terminée",
        "label_en": "Demo Completed",
        "phase": "evaluation",
        "probability": 60,
        "color": "purple",
        "icon": "play-circle",
        "description": "Demo has been completed, awaiting proposal",
        "allowed_transitions": ["proposal_sent", "nurturing", "lost"],
        "auto_assign": false,
        "sla_hours": null
      },
      {
        "value": "proposal_sent",
        "label_fr": "Proposition envoyée",
        "label_en": "Proposal Sent",
        "phase": "negotiation",
        "probability": 75,
        "color": "orange",
        "icon": "document-text",
        "description": "Commercial proposal sent, ready for payment link",
        "allowed_transitions": ["payment_pending", "lost", "nurturing"],
        "auto_assign": false,
        "sla_hours": null
      },
      {
        "value": "payment_pending",
        "label_fr": "Paiement en attente",
        "label_en": "Payment Pending",
        "phase": "closing",
        "probability": 90,
        "color": "amber",
        "icon": "credit-card",
        "description": "Stripe payment link sent, awaiting checkout completion",
        "allowed_transitions": ["converted", "lost"],
        "auto_assign": false,
        "sla_hours": 24,
        "is_new_v621": true
      },
      {
        "value": "converted",
        "label_fr": "Converti",
        "label_en": "Converted",
        "phase": "closed",
        "probability": 100,
        "color": "green",
        "icon": "badge-check",
        "description": "Lead converted to customer via Stripe webhook",
        "allowed_transitions": [],
        "auto_assign": false,
        "sla_hours": null,
        "is_terminal": true,
        "is_won": true
      },
      {
        "value": "lost",
        "label_fr": "Perdu",
        "label_en": "Lost",
        "phase": "closed",
        "probability": 0,
        "color": "red",
        "icon": "x-circle",
        "description": "Lead lost - requires loss_reason_code",
        "allowed_transitions": ["nurturing"],
        "auto_assign": false,
        "sla_hours": null,
        "requires_reason": true
      },
      {
        "value": "nurturing",
        "label_fr": "En nurturing",
        "label_en": "Nurturing",
        "phase": "nurturing",
        "probability": 15,
        "color": "yellow",
        "icon": "clock",
        "description": "Lead in nurturing program, may re-engage later",
        "allowed_transitions": ["demo_scheduled", "lost"],
        "auto_assign": false,
        "sla_hours": null
      },
      {
        "value": "disqualified",
        "label_fr": "Disqualifié",
        "label_en": "Disqualified",
        "phase": "closed",
        "probability": 0,
        "color": "gray",
        "icon": "ban",
        "description": "Lead disqualified - requires loss_reason_code",
        "allowed_transitions": [],
        "auto_assign": false,
        "sla_hours": null,
        "is_terminal": true,
        "requires_reason": true
      }
    ],
    "phases": [
      {"value": "discovery", "label_fr": "Découverte", "label_en": "Discovery", "order": 1},
      {"value": "qualification", "label_fr": "Qualification", "label_en": "Qualification", "order": 2},
      {"value": "evaluation", "label_fr": "Évaluation", "label_en": "Evaluation", "order": 3},
      {"value": "negotiation", "label_fr": "Négociation", "label_en": "Negotiation", "order": 4},
      {"value": "closing", "label_fr": "Closing", "label_en": "Closing", "order": 5},
      {"value": "closed", "label_fr": "Fermé", "label_en": "Closed", "order": 6},
      {"value": "nurturing", "label_fr": "Nurturing", "label_en": "Nurturing", "order": 7}
    ],
    "transition_rules": {
      "payment_pending_to_converted": "Only via Stripe checkout.session.completed webhook",
      "auto_qualify_threshold": 70,
      "lost_requires_reason": true,
      "disqualified_requires_reason": true
    }
  }'::jsonb,
  schema_version = '6.2.1',
  updated_at = NOW()
WHERE setting_key = 'lead_status_workflow';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Verify the update
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  status_count INTEGER;
  version_check TEXT;
BEGIN
  -- Count statuses
  SELECT jsonb_array_length(setting_value->'statuses')
  INTO status_count
  FROM crm_settings
  WHERE setting_key = 'lead_status_workflow';

  -- Check version
  SELECT setting_value->>'version'
  INTO version_check
  FROM crm_settings
  WHERE setting_key = 'lead_status_workflow';

  -- Validate
  IF status_count != 10 THEN
    RAISE EXCEPTION 'Expected 10 statuses, found %', status_count;
  END IF;

  IF version_check != '6.2.1' THEN
    RAISE EXCEPTION 'Expected version 6.2.1, found %', version_check;
  END IF;

  RAISE NOTICE 'V6.2.1 lead_status_workflow updated successfully: % statuses, version %',
    status_count, version_check;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY (run manually after migration)
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT
--   setting_value->>'version' as version,
--   jsonb_array_length(setting_value->'statuses') as status_count,
--   setting_value->'statuses'->5->>'value' as sixth_status
-- FROM crm_settings
-- WHERE setting_key = 'lead_status_workflow';
--
-- Expected: version=6.2.1, status_count=10, sixth_status=payment_pending
