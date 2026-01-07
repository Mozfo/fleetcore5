-- ═══════════════════════════════════════════════════════════════════════════
-- V6.2-7e: Add Index on clt_masterdata.client_code
-- ═══════════════════════════════════════════════════════════════════════════
--
-- This migration adds a performance index on clt_masterdata.client_code
-- for fast lookups in reporting and client search.
--
-- RULE: client_code = tenant_code = C-XXXXXX (denormalized for reporting)
--
-- IMPORTANT: Run after V6.2-7d
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Add client_code column if not exists
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE clt_masterdata
ADD COLUMN IF NOT EXISTS client_code VARCHAR(50);

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Create index on client_code
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_clt_masterdata_client_code
ON clt_masterdata(client_code)
WHERE client_code IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Add column comments for clarity
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN clt_masterdata.client_code IS
'V6.2.1: Client code (C-XXXXXX) - SAME value as adm_tenants.tenant_code.
Denormalized for reporting performance. Immutable after creation.';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY (run manually after migration)
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'clt_masterdata'
--   AND indexname LIKE '%client_code%';
