-- =====================================================
-- FleetCore — Tenant Country Routing
-- =====================================================
-- Created: 2026-02-27
-- Purpose: Route leads to tenants based on country
--
-- WORKFLOW:
-- 1. Review this SQL
-- 2. Execute in Supabase Dashboard SQL Editor
-- 3. Verify with checks at the bottom
-- =====================================================

-- =====================================================
-- STEP 0: CLEANUP — Soft-delete test tenants
-- =====================================================
-- These tenants have 0 leads and 0 members

UPDATE adm_tenants
SET deleted_at = NOW(), updated_at = NOW()
WHERE id IN (
    '464ea42f-14c0-4b30-afe7-3c3e7af56898',  -- okpok (test, wrongly set as headquarters)
    'f87d4d69-3196-4b34-abab-1c6cd5dfc2be',  -- test deooodeo
    'f5a2a78b-93c6-4d08-a4dd-d8628ad69c83'   -- Audit Test Tenant
);

-- =====================================================
-- STEP 1: ADD CHECK CONSTRAINT on tenant_type
-- =====================================================
-- Column already exists (varchar, default 'division')
-- Adding constraint to enforce valid values

-- First, fix the default to 'client' (matches Prisma schema)
ALTER TABLE adm_tenants ALTER COLUMN tenant_type SET DEFAULT 'client';
ALTER TABLE adm_tenants ALTER COLUMN tenant_type SET NOT NULL;

ALTER TABLE adm_tenants
ADD CONSTRAINT adm_tenants_tenant_type_check
CHECK (tenant_type IN ('headquarters', 'division', 'expansion', 'client'));

CREATE INDEX IF NOT EXISTS idx_adm_tenants_tenant_type
ON adm_tenants(tenant_type) WHERE deleted_at IS NULL;

-- =====================================================
-- STEP 2: CREATE TENANT — FleetCore Expansion
-- =====================================================
-- country_code 'XX' = ISO 3166 reserved (no specific country)
-- Serves as "unassigned queue" for non-operational countries

INSERT INTO adm_tenants (name, country_code, tenant_type, status, default_currency, timezone)
VALUES (
    'FleetCore Expansion',
    'XX',
    'expansion',
    'active',
    'EUR',
    'UTC'
);

-- =====================================================
-- STEP 3: CREATE TABLE — adm_tenant_countries
-- =====================================================
-- Maps country_code → tenant_id (one country = one tenant)
-- Pattern follows adm_member_roles (audit columns, FK constraints)

CREATE TABLE adm_tenant_countries (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
    country_code CHAR(2)    NOT NULL,
    is_primary  BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID,

    -- One country can only be assigned to ONE tenant
    CONSTRAINT uq_adm_tenant_countries_country UNIQUE (country_code)
);

CREATE INDEX idx_adm_tenant_countries_tenant ON adm_tenant_countries(tenant_id);
CREATE INDEX idx_adm_tenant_countries_country ON adm_tenant_countries(country_code);

-- =====================================================
-- STEP 4: SEED — Operational countries → HQ tenant
-- =====================================================
-- All 12 operational countries point to FleetCore Admin HQ
-- Non-operational countries are NOT mapped (fallback to expansion tenant)

INSERT INTO adm_tenant_countries (tenant_id, country_code, is_primary)
SELECT
    '7ad8173c-68c5-41d3-9918-686e4e941cc0',  -- FleetCore Admin HQ
    country_code,
    true
FROM crm_countries
WHERE is_operational = true;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- 1. Check expansion tenant exists
-- SELECT id, name, tenant_type, country_code FROM adm_tenants WHERE tenant_type = 'expansion';

-- 2. Check tenant_type constraint works
-- SELECT id, name, tenant_type FROM adm_tenants WHERE deleted_at IS NULL ORDER BY created_at;

-- 3. Check country mappings (should be 12 operational countries)
-- SELECT tc.country_code, c.country_name_en, t.name as tenant_name
-- FROM adm_tenant_countries tc
-- JOIN crm_countries c ON c.country_code = tc.country_code
-- JOIN adm_tenants t ON t.id = tc.tenant_id
-- ORDER BY c.country_name_en;

-- 4. Check test tenants are soft-deleted
-- SELECT id, name, deleted_at FROM adm_tenants WHERE name IN ('okpok', 'test deooodeo', 'Audit Test Tenant');

-- 5. Verify non-operational countries have NO mapping (should return 18 rows)
-- SELECT c.country_code, c.country_name_en
-- FROM crm_countries c
-- LEFT JOIN adm_tenant_countries tc ON c.country_code = tc.country_code
-- WHERE tc.id IS NULL
-- ORDER BY c.country_name_en;
