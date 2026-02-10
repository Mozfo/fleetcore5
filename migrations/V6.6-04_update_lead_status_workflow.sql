-- ============================================
-- SCRIPT T3 : UPDATE crm_settings lead_status_workflow
-- À exécuter dans Supabase SQL Editor
-- Version : V6.6
-- Date : 2026-02-09
-- ============================================

-- Update lead_status_workflow with V6.6 statuses (10 statuts, 4 phases)
UPDATE crm_settings
SET setting_value = '{
  "default": "new",
  "statuses": [
    {
      "value": "new",
      "label_en": "New",
      "label_fr": "Nouveau",
      "color": "gray",
      "icon": "sparkles",
      "order": 1,
      "is_active": true,
      "is_initial": true,
      "transitions_to": ["email_verified", "demo", "nurturing", "disqualified"]
    },
    {
      "value": "email_verified",
      "label_en": "Email Verified",
      "label_fr": "Email vérifié",
      "color": "cyan",
      "icon": "check-circle",
      "order": 2,
      "is_active": true,
      "transitions_to": ["callback_requested", "demo"]
    },
    {
      "value": "callback_requested",
      "label_en": "Callback Requested",
      "label_fr": "Rappel demandé",
      "color": "amber",
      "icon": "phone",
      "order": 3,
      "is_active": true,
      "transitions_to": ["demo", "disqualified", "lost"]
    },
    {
      "value": "demo",
      "label_en": "Demo",
      "label_fr": "Démo",
      "color": "blue",
      "icon": "calendar",
      "order": 4,
      "is_active": true,
      "transitions_to": ["proposal_sent", "nurturing", "lost", "disqualified"]
    },
    {
      "value": "proposal_sent",
      "label_en": "Proposal Sent",
      "label_fr": "Proposition envoyée",
      "color": "orange",
      "icon": "document-text",
      "order": 5,
      "is_active": true,
      "transitions_to": ["payment_pending", "lost", "nurturing"]
    },
    {
      "value": "payment_pending",
      "label_en": "Payment Pending",
      "label_fr": "Paiement en attente",
      "color": "yellow",
      "icon": "credit-card",
      "order": 6,
      "is_active": true,
      "transitions_to": ["converted", "lost"]
    },
    {
      "value": "converted",
      "label_en": "Converted",
      "label_fr": "Converti",
      "color": "green",
      "icon": "badge-check",
      "order": 7,
      "is_active": true,
      "is_terminal": true,
      "is_success": true,
      "transitions_to": []
    },
    {
      "value": "lost",
      "label_en": "Lost",
      "label_fr": "Perdu",
      "color": "red",
      "icon": "x-circle",
      "order": 8,
      "is_active": true,
      "transitions_to": ["nurturing"]
    },
    {
      "value": "nurturing",
      "label_en": "Nurturing",
      "label_fr": "En nurturing",
      "color": "purple",
      "icon": "clock",
      "order": 9,
      "is_active": true,
      "transitions_to": ["demo", "proposal_sent", "lost"]
    },
    {
      "value": "disqualified",
      "label_en": "Disqualified",
      "label_fr": "Disqualifié",
      "color": "gray",
      "icon": "ban",
      "order": 10,
      "is_active": true,
      "is_terminal": true,
      "transitions_to": []
    }
  ]
}'::jsonb,
version = version + 1,
updated_at = NOW()
WHERE setting_key = 'lead_status_workflow';
