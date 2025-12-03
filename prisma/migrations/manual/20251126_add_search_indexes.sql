-- ============================================================================
-- Migration: Add Trigram Search Indexes for CRM Leads
-- Date: 2025-11-26
-- Description: Creates pg_trgm extension and GIN indexes for fast fuzzy search
--              on leads table (first_name, last_name, email, company_name)
-- ============================================================================

-- Enable pg_trgm extension for fuzzy text search
-- This extension provides functions and operators for determining string similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- IMPORTANT: Run these indexes with CONCURRENTLY to avoid table locks
-- This allows the database to remain fully available during index creation
-- ============================================================================

-- Index for full name search (first_name + last_name)
-- Uses gin_trgm_ops for fuzzy matching with ILIKE queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_search_name
ON crm_leads USING GIN (
  (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) gin_trgm_ops
);

-- Index for email search
-- Optimizes ILIKE '%keyword%' queries on email field
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_search_email
ON crm_leads USING GIN (email gin_trgm_ops);

-- Index for company name search
-- Optimizes ILIKE '%keyword%' queries on company_name field
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_search_company
ON crm_leads USING GIN (company_name gin_trgm_ops);

-- ============================================================================
-- Additional B-tree indexes for common filter/sort columns
-- ============================================================================

-- Index for status filtering (common WHERE clause)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_status
ON crm_leads (status);

-- Index for lead_stage filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_stage
ON crm_leads (lead_stage);

-- Index for assigned_to filtering (owner filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_assigned_to
ON crm_leads (assigned_to_member_id);

-- Index for country filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_country
ON crm_leads (country_code);

-- Index for created_at sorting (common ORDER BY)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_created_at
ON crm_leads (created_at DESC);

-- Composite index for common Kanban query pattern
-- (tenant_id + status) for filtering leads per tenant per status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_tenant_status
ON crm_leads (tenant_id, status);

-- ============================================================================
-- VERIFY: Check that indexes were created
-- ============================================================================
-- Run this query to verify:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'crm_leads';
