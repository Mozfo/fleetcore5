-- ============================================
-- V6.6-06: Update crm_leads_status_check constraint
--
-- V6.3 constraint only allowed 8 statuses.
-- V6.6 adds 2 new statuses: email_verified, callback_requested
-- Total: 10 statuses
--
-- MUST be run BEFORE using callback or email_verified status values.
-- ============================================

BEGIN;

-- 1. Drop the old V6.3 constraint (8 statuses)
ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_status_check;

-- 2. Create new constraint with V6.6 statuses (10 statuses)
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_status_check
CHECK (status IN (
    'new',
    'email_verified',
    'callback_requested',
    'demo',
    'proposal_sent',
    'payment_pending',
    'converted',
    'lost',
    'nurturing',
    'disqualified'
));

COMMENT ON CONSTRAINT crm_leads_status_check ON crm_leads IS
'V6.6: 10 statuses - added email_verified and callback_requested (2026-02-09)';

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'crm_leads'::regclass
-- AND conname = 'crm_leads_status_check';
