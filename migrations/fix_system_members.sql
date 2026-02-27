-- =====================================================
-- FleetCore — Fix System Members for Notification Audit
-- =====================================================
-- Created: 2026-02-27
-- Purpose: Create system members referenced by lib/constants/system.ts
-- Bug: fk_adm_notification_logs_created_by violation when
--       SYSTEM_USER_ID doesn't exist in adm_members
--
-- WORKFLOW:
-- 1. Execute in Supabase Dashboard SQL Editor
-- 2. Verify notification log creation works
-- =====================================================

-- =====================================================
-- STEP 1: Create System User (for automated operations)
-- =====================================================
-- Used by: NotificationService, audit trails on automated operations
-- Constant: SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001'

INSERT INTO adm_members (
    id,
    tenant_id,
    email,
    first_name,
    last_name,
    role,
    status,
    metadata,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '7ad8173c-68c5-41d3-9918-686e4e941cc0',  -- FleetCore Admin HQ
    'system@fleetcore.app',
    'System',
    'Automated',
    'system',
    'active',
    '{"type": "system_account", "description": "Automated operations (notifications, cron jobs)"}',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: Create System Provider Employee
-- =====================================================
-- Used by: Tenant lifecycle events
-- Constant: SYSTEM_PROVIDER_EMPLOYEE_ID = '00000000-0000-0000-0000-000000000002'

INSERT INTO adm_members (
    id,
    tenant_id,
    email,
    first_name,
    last_name,
    role,
    status,
    metadata,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '7ad8173c-68c5-41d3-9918-686e4e941cc0',  -- FleetCore Admin HQ
    'system-provider@fleetcore.app',
    'System',
    'Provider',
    'system',
    'active',
    '{"type": "system_account", "description": "Tenant lifecycle and provider operations"}',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check system members exist
SELECT id, email, first_name, last_name, role, status
FROM adm_members
WHERE id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
);
