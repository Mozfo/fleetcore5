-- V6.2-3bcd: Renommage tables bil_tenant_* vers clt_*
-- Ordre: subscriptions -> invoices -> invoice_lines (respect FK dependencies)

BEGIN;

-- =============================================================================
-- ETAPE 1: bil_tenant_subscriptions -> clt_subscriptions
-- =============================================================================

ALTER TABLE bil_tenant_subscriptions RENAME TO clt_subscriptions;

-- Rename indexes
ALTER INDEX IF EXISTS bil_tenant_subscriptions_pkey RENAME TO clt_subscriptions_pkey;
ALTER INDEX IF EXISTS idx_bil_tenant_subscriptions_tenant_id RENAME TO idx_clt_subscriptions_tenant_id;
ALTER INDEX IF EXISTS idx_bil_tenant_subscriptions_plan_id RENAME TO idx_clt_subscriptions_plan_id;
ALTER INDEX IF EXISTS idx_bil_tenant_subscriptions_status RENAME TO idx_clt_subscriptions_status;
ALTER INDEX IF EXISTS idx_bil_tenant_subscriptions_deleted_at RENAME TO idx_clt_subscriptions_deleted_at;

-- Rename constraints
ALTER TABLE clt_subscriptions RENAME CONSTRAINT bil_tenant_subscriptions_tenant_id_fkey TO clt_subscriptions_tenant_id_fkey;
ALTER TABLE clt_subscriptions RENAME CONSTRAINT bil_tenant_subscriptions_plan_id_fkey TO clt_subscriptions_plan_id_fkey;

-- =============================================================================
-- ETAPE 2: bil_tenant_invoices -> clt_invoices
-- =============================================================================

ALTER TABLE bil_tenant_invoices RENAME TO clt_invoices;

-- Rename indexes
ALTER INDEX IF EXISTS bil_tenant_invoices_pkey RENAME TO clt_invoices_pkey;
ALTER INDEX IF EXISTS idx_bil_tenant_invoices_tenant_id RENAME TO idx_clt_invoices_tenant_id;
ALTER INDEX IF EXISTS idx_bil_tenant_invoices_invoice_number RENAME TO idx_clt_invoices_invoice_number;
ALTER INDEX IF EXISTS idx_bil_tenant_invoices_invoice_date RENAME TO idx_clt_invoices_invoice_date;
ALTER INDEX IF EXISTS idx_bil_tenant_invoices_due_date RENAME TO idx_clt_invoices_due_date;
ALTER INDEX IF EXISTS idx_bil_tenant_invoices_status RENAME TO idx_clt_invoices_status;
ALTER INDEX IF EXISTS idx_bil_tenant_invoices_deleted_at RENAME TO idx_clt_invoices_deleted_at;

-- Rename constraints
ALTER TABLE clt_invoices RENAME CONSTRAINT bil_tenant_invoices_tenant_id_fkey TO clt_invoices_tenant_id_fkey;
ALTER TABLE clt_invoices RENAME CONSTRAINT fk_bil_invoices_subscription TO fk_clt_invoices_subscription;

-- =============================================================================
-- ETAPE 3: bil_tenant_invoice_lines -> clt_invoice_lines
-- =============================================================================

ALTER TABLE bil_tenant_invoice_lines RENAME TO clt_invoice_lines;

-- Rename indexes
ALTER INDEX IF EXISTS bil_tenant_invoice_lines_pkey RENAME TO clt_invoice_lines_pkey;
ALTER INDEX IF EXISTS idx_bil_tenant_invoice_lines_invoice_id RENAME TO idx_clt_invoice_lines_invoice_id;
ALTER INDEX IF EXISTS idx_bil_tenant_invoice_lines_deleted_at RENAME TO idx_clt_invoice_lines_deleted_at;

-- Rename constraints
ALTER TABLE clt_invoice_lines RENAME CONSTRAINT bil_tenant_invoice_lines_invoice_id_fkey TO clt_invoice_lines_invoice_id_fkey;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE clt_subscriptions IS 'V6.2-3: Abonnements client (ex bil_tenant_subscriptions)';
COMMENT ON TABLE clt_invoices IS 'V6.2-3: Factures client (ex bil_tenant_invoices)';
COMMENT ON TABLE clt_invoice_lines IS 'V6.2-3: Lignes factures client (ex bil_tenant_invoice_lines)';

COMMIT;
