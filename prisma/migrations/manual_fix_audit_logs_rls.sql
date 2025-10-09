-- ============================================================================
-- FIX: Activer RLS sur adm_audit_logs
-- Date: 2025-01-09
-- Description: Active Row Level Security sur table audit manquante
-- ============================================================================

-- 1. ACTIVER RLS
ALTER TABLE adm_audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. CRÉER POLICY TENANT ISOLATION
DROP POLICY IF EXISTS tenant_isolation_policy ON adm_audit_logs;

CREATE POLICY tenant_isolation_policy ON adm_audit_logs
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- 3. CRÉER POLICY POUR LECTURE ADMIN
DROP POLICY IF EXISTS audit_logs_admin_read ON adm_audit_logs;

CREATE POLICY audit_logs_admin_read ON adm_audit_logs
    FOR SELECT
    USING (
        tenant_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.user_role', true) = 'platform_admin'
    );

-- 4. VÉRIFICATION
SELECT
    tablename,
    CASE WHEN relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status,
    (SELECT COUNT(*) FROM pg_policy WHERE polrelid = 'adm_audit_logs'::regclass) as policy_count
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE tablename = 'adm_audit_logs';

COMMENT ON TABLE adm_audit_logs IS 'Audit logs with RLS enabled for tenant isolation';
