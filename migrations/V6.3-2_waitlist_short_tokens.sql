-- ============================================================================
-- V6.3-2: Add short_token to crm_waitlist for iOS Mail compatibility
-- ============================================================================
-- Problem: iOS Mail app doesn't handle long URLs (>60 chars) in buttons
-- Solution: Short tokens for email links (e.g., /w/Xk9mP2 instead of ?id=uuid)
-- ============================================================================

-- 1. Add short_token column
ALTER TABLE crm_waitlist
ADD COLUMN IF NOT EXISTS short_token VARCHAR(8);

-- 2. Generate tokens for existing entries using random alphanumeric string
-- Uses base62 characters (a-z, A-Z, 0-9) for URL-safe tokens
UPDATE crm_waitlist
SET short_token = substr(md5(random()::text || id::text), 1, 6)
WHERE short_token IS NULL;

-- 3. Add unique constraint
ALTER TABLE crm_waitlist
ADD CONSTRAINT crm_waitlist_short_token_unique UNIQUE (short_token);

-- 4. Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_crm_waitlist_short_token
ON crm_waitlist(short_token);

-- ============================================================================
-- Verification
-- ============================================================================
-- SELECT id, email, short_token FROM crm_waitlist LIMIT 10;
