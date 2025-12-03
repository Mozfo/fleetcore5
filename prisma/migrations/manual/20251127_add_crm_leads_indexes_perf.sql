-- =====================================================
-- PERF: Indexes crm_leads pour améliorer les queries CRM
-- Date: 27 Novembre 2025
-- Diagnostic: 3-5s pour afficher 15 leads → cible < 500ms
-- =====================================================

-- Index pour les filtres courants (GET /api/v1/crm/leads)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_assigned_to
  ON crm_leads(assigned_to);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_lead_stage
  ON crm_leads(lead_stage);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_updated_at
  ON crm_leads(updated_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_qualification_score
  ON crm_leads(qualification_score);

-- Index composite pour query pattern courant (list leads non-deleted by status/stage)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_status_stage_deleted
  ON crm_leads(deleted_at, status, lead_stage);

-- Vérification
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'crm_leads'
ORDER BY indexname;
