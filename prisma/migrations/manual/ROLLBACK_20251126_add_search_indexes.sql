-- ============================================================================
-- ROLLBACK: Remove Trigram Search Indexes for CRM Leads
-- Date: 2025-11-26
-- Description: Removes the indexes created by 20251126_add_search_indexes.sql
-- ============================================================================

-- Drop GIN indexes (trigram search)
DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_search_name;
DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_search_email;
DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_search_company;

-- Drop B-tree indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_stage;
DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_assigned_to;
DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_country;
DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_crm_leads_tenant_status;

-- Note: We don't drop the pg_trgm extension as it might be used by other tables
-- If you want to remove it completely, uncomment the line below:
-- DROP EXTENSION IF EXISTS pg_trgm;
