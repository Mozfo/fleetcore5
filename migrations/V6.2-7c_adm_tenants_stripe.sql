-- ═══════════════════════════════════════════════════════════════════════════
-- V6.2-7c: Add Stripe & Verification Columns to adm_tenants
-- ═══════════════════════════════════════════════════════════════════════════
--
-- This migration adds columns to adm_tenants for:
-- 1. Stripe customer and subscription tracking
-- 2. 24h verification flow (token, expiry)
-- 3. Admin designation (name, email, invited_at)
-- 4. CGI/CGU acceptance tracking (ip, version, timestamp)
--
-- IMPORTANT: Run after V6.2-7b
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Stripe Integration Columns
-- ═══════════════════════════════════════════════════════════════════════════

-- Stripe Customer ID (cus_xxx)
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Stripe Subscription ID (sub_xxx)
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

COMMENT ON COLUMN adm_tenants.stripe_customer_id IS
'Stripe Customer ID (cus_xxx) - created during checkout.session.completed';

COMMENT ON COLUMN adm_tenants.stripe_subscription_id IS
'Stripe Subscription ID (sub_xxx) - linked to billing cycle';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Verification Flow Columns (24h token)
-- ═══════════════════════════════════════════════════════════════════════════

-- Verification token (sent in email after payment)
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(100);

-- Token expiry (default: 24h after creation)
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

-- Completion timestamp (NULL = not yet verified)
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN adm_tenants.verification_token IS
'Random token sent via email for 24h verification flow';

COMMENT ON COLUMN adm_tenants.verification_token_expires_at IS
'Expiry timestamp for verification token (24h from creation)';

COMMENT ON COLUMN adm_tenants.verification_completed_at IS
'Timestamp when client completed verification form (NULL = pending)';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Admin Designation Columns
-- ═══════════════════════════════════════════════════════════════════════════
-- Admin is designated BY THE CLIENT (not FleetCore) via verification form

-- Admin full name
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255);

-- Admin email (for Clerk invitation)
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);

-- Clerk invitation timestamp
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS admin_invited_at TIMESTAMPTZ;

COMMENT ON COLUMN adm_tenants.admin_name IS
'Name of designated admin (submitted by client via verification form)';

COMMENT ON COLUMN adm_tenants.admin_email IS
'Email of designated admin (receives Clerk Organization invitation)';

COMMENT ON COLUMN adm_tenants.admin_invited_at IS
'Timestamp when Clerk invitation was sent to admin';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: CGI/CGU Acceptance Tracking
-- ═══════════════════════════════════════════════════════════════════════════

-- CGI acceptance timestamp
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS cgi_accepted_at TIMESTAMPTZ;

-- Client IP at acceptance (for compliance)
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS cgi_accepted_ip VARCHAR(45);

-- Version of CGI/CGU accepted
ALTER TABLE adm_tenants
ADD COLUMN IF NOT EXISTS cgi_version VARCHAR(20);

COMMENT ON COLUMN adm_tenants.cgi_accepted_at IS
'Timestamp when CGI/CGU was accepted (required for service activation)';

COMMENT ON COLUMN adm_tenants.cgi_accepted_ip IS
'Client IP address at CGI acceptance (IPv4 or IPv6, max 45 chars)';

COMMENT ON COLUMN adm_tenants.cgi_version IS
'Version of CGI/CGU document accepted (e.g., "2026-01")';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: Create Indexes
-- ═══════════════════════════════════════════════════════════════════════════

-- Index on verification token for token lookup
CREATE INDEX IF NOT EXISTS idx_adm_tenants_verification_token
ON adm_tenants(verification_token)
WHERE verification_token IS NOT NULL;

-- Index on Stripe customer ID for webhook correlation
CREATE INDEX IF NOT EXISTS idx_adm_tenants_stripe_customer
ON adm_tenants(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Index on Stripe subscription ID for subscription events
CREATE INDEX IF NOT EXISTS idx_adm_tenants_stripe_subscription
ON adm_tenants(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;

-- Index for pending verifications (NULL completed_at)
CREATE INDEX IF NOT EXISTS idx_adm_tenants_pending_verification
ON adm_tenants(verification_token_expires_at)
WHERE verification_completed_at IS NULL
  AND verification_token IS NOT NULL;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY (run manually after migration)
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'adm_tenants'
--   AND column_name LIKE 'stripe_%'
--    OR column_name LIKE 'verification_%'
--    OR column_name LIKE 'admin_%'
--    OR column_name LIKE 'cgi_%'
-- ORDER BY column_name;
