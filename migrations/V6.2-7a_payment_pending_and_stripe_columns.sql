-- ═══════════════════════════════════════════════════════════════════════════
-- V6.2-7a: 10th Status (payment_pending) + Stripe Columns on crm_leads
-- ═══════════════════════════════════════════════════════════════════════════
--
-- This migration:
-- 1. Updates CHECK constraint to include 10 statuses (V6.2 had 9)
-- 2. Adds Stripe checkout session columns to crm_leads
-- 3. Creates performance indexes
--
-- IMPORTANT: Run in order: V6.2-7a, V6.2-7b, V6.2-7c, V6.2-7d
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Update CHECK constraint for 10 statuses
-- ═══════════════════════════════════════════════════════════════════════════
-- Adding 'payment_pending' between 'proposal_sent' and 'converted'

ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_status_check;

ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_status_check
CHECK (status IN (
  'new',
  'demo_scheduled',
  'qualified',
  'demo_completed',
  'proposal_sent',
  'payment_pending',   -- NEW in V6.2.1
  'converted',
  'lost',
  'nurturing',
  'disqualified'
));

COMMENT ON CONSTRAINT crm_leads_status_check ON crm_leads IS
'V6.2.1: 10 statuses - added payment_pending for Stripe checkout flow';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Add Stripe checkout session columns to crm_leads
-- ═══════════════════════════════════════════════════════════════════════════

-- Stripe Checkout Session ID (for idempotence and tracking)
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);

-- Payment link URL sent to lead
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS stripe_payment_link_url TEXT;

-- Timestamps for payment link lifecycle
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS payment_link_created_at TIMESTAMPTZ;

ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN crm_leads.stripe_checkout_session_id IS
'Stripe Checkout Session ID (cs_xxx) - used for webhook correlation';

COMMENT ON COLUMN crm_leads.stripe_payment_link_url IS
'Full Stripe Checkout URL sent to lead for payment';

COMMENT ON COLUMN crm_leads.payment_link_created_at IS
'Timestamp when payment link was created';

COMMENT ON COLUMN crm_leads.payment_link_expires_at IS
'Timestamp when payment link expires (default: 24h after creation)';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Create indexes for performance
-- ═══════════════════════════════════════════════════════════════════════════

-- Index on Stripe checkout session ID for webhook lookups
CREATE INDEX IF NOT EXISTS idx_crm_leads_stripe_checkout
ON crm_leads(stripe_checkout_session_id)
WHERE stripe_checkout_session_id IS NOT NULL;

-- Partial index for payment_pending status (faster queries for active checkouts)
CREATE INDEX IF NOT EXISTS idx_crm_leads_payment_pending
ON crm_leads(status, payment_link_expires_at)
WHERE status = 'payment_pending';

-- Index for expired payment links cleanup
CREATE INDEX IF NOT EXISTS idx_crm_leads_payment_link_expires
ON crm_leads(payment_link_expires_at)
WHERE payment_link_expires_at IS NOT NULL;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY (run manually after migration)
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT
--   constraint_name,
--   check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'crm_leads_status_check';
