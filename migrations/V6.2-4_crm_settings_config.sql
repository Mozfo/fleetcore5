-- V6.2-4: Configuration CRM Settings
-- 4 nouvelles configurations pour le workflow V6.2

BEGIN;

-- =============================================================================
-- 1. lead_status_workflow - 9 statuts V6.2 avec transitions
-- =============================================================================

INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  is_system,
  provider_id,
  description,
  display_label,
  schema_version
) VALUES (
  'lead_status_workflow',
  '{
    "version": "6.2.0",
    "statuses": [
      {
        "value": "new",
        "label_fr": "Nouveau",
        "label_en": "New",
        "phase": "acquisition",
        "probability": 5,
        "color": "#6B7280",
        "icon": "inbox",
        "description": "Email OK, pas de booking Cal.com",
        "allowed_transitions": ["demo_scheduled", "disqualified"],
        "auto_assign": true,
        "sla_hours": null
      },
      {
        "value": "demo_scheduled",
        "label_fr": "Demo planifiee",
        "label_en": "Demo Scheduled",
        "phase": "acquisition",
        "probability": 50,
        "color": "#10B981",
        "icon": "calendar-check",
        "description": "Creneau Cal.com confirme",
        "allowed_transitions": ["qualified", "nurturing", "lost", "disqualified"],
        "auto_assign": false,
        "sla_hours": null
      },
      {
        "value": "qualified",
        "label_fr": "Qualifie",
        "label_en": "Qualified",
        "phase": "qualification",
        "probability": 70,
        "color": "#8B5CF6",
        "icon": "check-circle",
        "description": "Qualifie CPT pendant appel",
        "allowed_transitions": ["demo_completed", "lost"],
        "auto_assign": false,
        "sla_hours": null
      },
      {
        "value": "demo_completed",
        "label_fr": "Demo realisee",
        "label_en": "Demo Completed",
        "phase": "demo",
        "probability": 75,
        "color": "#22C55E",
        "icon": "presentation",
        "description": "Demo live realisee, en attente decision",
        "allowed_transitions": ["proposal_sent", "nurturing", "lost"],
        "auto_assign": false,
        "sla_hours": 1
      },
      {
        "value": "proposal_sent",
        "label_fr": "Lien envoye",
        "label_en": "Proposal Sent",
        "phase": "closing",
        "probability": 85,
        "color": "#F59E0B",
        "icon": "send",
        "description": "Lien paiement Stripe envoye",
        "allowed_transitions": ["converted", "lost", "nurturing"],
        "auto_assign": false,
        "sla_hours": 24
      },
      {
        "value": "converted",
        "label_fr": "Converti",
        "label_en": "Converted",
        "phase": "result",
        "probability": 100,
        "color": "#22C55E",
        "icon": "check-double",
        "description": "Paiement recu, tenant cree",
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
        "phase": "result",
        "probability": 0,
        "color": "#EF4444",
        "icon": "x-circle",
        "description": "Perdu (raison obligatoire)",
        "allowed_transitions": ["nurturing"],
        "auto_assign": false,
        "sla_hours": null,
        "is_terminal": false,
        "requires_reason": true
      },
      {
        "value": "nurturing",
        "label_fr": "Nurturing",
        "label_en": "Nurturing",
        "phase": "result",
        "probability": 15,
        "color": "#84CC16",
        "icon": "clock",
        "description": "Timing pas bon, relance programmee",
        "allowed_transitions": ["demo_scheduled", "lost"],
        "auto_assign": false,
        "sla_hours": null
      },
      {
        "value": "disqualified",
        "label_fr": "Disqualifie",
        "label_en": "Disqualified",
        "phase": "result",
        "probability": 0,
        "color": "#6B7280",
        "icon": "ban",
        "description": "Hors cible / Red flag",
        "allowed_transitions": [],
        "auto_assign": false,
        "sla_hours": null,
        "is_terminal": true,
        "requires_reason": true
      }
    ],
    "phases": [
      { "value": "acquisition", "label_fr": "Acquisition", "label_en": "Acquisition", "order": 1 },
      { "value": "qualification", "label_fr": "Qualification", "label_en": "Qualification", "order": 2 },
      { "value": "demo", "label_fr": "Demo", "label_en": "Demo", "order": 3 },
      { "value": "closing", "label_fr": "Closing", "label_en": "Closing", "order": 4 },
      { "value": "result", "label_fr": "Resultat", "label_en": "Result", "order": 5 }
    ]
  }'::jsonb,
  'stages',
  'object',
  true,
  NULL,
  'V6.2 Lead status workflow avec 9 statuts et transitions autorisees',
  'Lead Status Workflow',
  '6.2.0'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  schema_version = EXCLUDED.schema_version,
  updated_at = NOW();

-- =============================================================================
-- 2. qualification_framework - CPT Framework
-- =============================================================================

INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  is_system,
  provider_id,
  description,
  display_label,
  schema_version
) VALUES (
  'qualification_framework',
  '{
    "version": "6.2.0",
    "framework": "CPT",
    "questions": [
      {
        "key": "challenges",
        "question_fr": "Comment gerez-vous la reconciliation des revenus Uber/Bolt/Careem aujourd hui ?",
        "question_en": "How do you manage Uber/Bolt/Careem revenue reconciliation today?",
        "scoring": {
          "high": ["excel", "manual", "nightmare", "no visibility", "pas de visibilite"],
          "medium": ["limited system", "systeme limite", "basic"],
          "low": ["good solution", "works well", "fonctionne bien"]
        }
      },
      {
        "key": "priority",
        "question_fr": "Qu est-ce qui vous a pousse a demander une demo maintenant ?",
        "question_en": "What made you request a demo now?",
        "scoring": {
          "high": ["losing money", "scale", "growth", "urgent"],
          "medium": ["comparing", "exploring", "research"],
          "low": ["later", "just looking", "plus tard"]
        }
      },
      {
        "key": "timing",
        "question_fr": "Si FleetCore vous convient, quand voulez-vous demarrer ?",
        "question_en": "If FleetCore works for you, when do you want to start?",
        "scoring": {
          "hot": ["immediately", "asap", "now", "immediatement"],
          "warm": ["this month", "next weeks", "ce mois"],
          "cool": ["2-3 months", "quarter"],
          "cold": ["later", "6 months", "next year"]
        }
      }
    ],
    "disqualification_triggers": [
      "looking for free",
      "gratuit",
      "no pain identified",
      "6+ months timeline"
    ]
  }'::jsonb,
  'qualification',
  'object',
  true,
  NULL,
  'Framework CPT (Challenges, Priority, Timing) pour qualification leads',
  'Qualification Framework (CPT)',
  '6.2.0'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  schema_version = EXCLUDED.schema_version,
  updated_at = NOW();

-- =============================================================================
-- 3. lead_loss_reasons - Raisons lost/disqualified
-- =============================================================================

INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  is_system,
  provider_id,
  description,
  display_label,
  schema_version
) VALUES (
  'lead_loss_reasons',
  '{
    "version": "6.2.0",
    "reasons": [
      {
        "code": "not_interested",
        "label_en": "Not interested",
        "label_fr": "Pas interesse",
        "category": "lost",
        "requires_detail": false
      },
      {
        "code": "chose_competitor",
        "label_en": "Chose competitor",
        "label_fr": "A choisi un concurrent",
        "category": "lost",
        "requires_detail": true,
        "detail_field": "competitor_name"
      },
      {
        "code": "price_perception",
        "label_en": "Price too high",
        "label_fr": "Prix percu trop eleve",
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
        "label_fr": "Ne repond plus",
        "category": "lost",
        "requires_detail": false
      },
      {
        "code": "no_show",
        "label_en": "No show",
        "label_fr": "Ne s est pas presente",
        "category": "lost",
        "requires_detail": false
      },
      {
        "code": "wrong_segment",
        "label_en": "Wrong segment",
        "label_fr": "Mauvais segment",
        "category": "disqualified",
        "requires_detail": false
      },
      {
        "code": "wrong_country",
        "label_en": "Country not covered",
        "label_fr": "Pays non couvert",
        "category": "disqualified",
        "requires_detail": false
      },
      {
        "code": "spam_fake",
        "label_en": "Spam or fake",
        "label_fr": "Spam ou faux",
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
  'workflows',
  'object',
  true,
  NULL,
  'Raisons de perte/disqualification pour leads V6.2',
  'Lead Loss Reasons',
  '6.2.0'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  schema_version = EXCLUDED.schema_version,
  updated_at = NOW();

-- =============================================================================
-- 4. escalation_settings - Parametres escalade DG
-- =============================================================================

INSERT INTO crm_settings (
  setting_key,
  setting_value,
  category,
  data_type,
  is_system,
  provider_id,
  description,
  display_label,
  schema_version
) VALUES (
  'escalation_settings',
  '{
    "version": "6.2.0",
    "escalation_fleet_threshold": 20,
    "escalation_alert_hours": 48,
    "escalation_email": "dg@fleetcore.io",
    "enabled": true
  }'::jsonb,
  'sla',
  'object',
  true,
  NULL,
  'Parametres escalade automatique vers DG pour leads haute valeur',
  'Escalation Settings',
  '6.2.0'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  schema_version = EXCLUDED.schema_version,
  updated_at = NOW();

COMMIT;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- SELECT setting_key, category, is_system, schema_version
-- FROM crm_settings
-- WHERE setting_key IN ('lead_status_workflow', 'qualification_framework', 'lead_loss_reasons', 'escalation_settings');
