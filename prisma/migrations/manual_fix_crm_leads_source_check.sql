-- Fix crm_leads_source_check constraint
-- The old constraint only allowed: NULL, 'web', 'referral', 'event'
-- The application now supports: website, referral, paid_ad, social_media, event, cold_outreach, partner, other
-- Also keep 'web' for backward compatibility with existing data

-- Step 1: Drop the old constraint
ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_source_check;

-- Step 2: Migrate existing 'web' values to 'website' for consistency
UPDATE crm_leads SET source = 'website' WHERE source = 'web';

-- Step 3: Add the new constraint with all valid source values
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_source_check
  CHECK (source IS NULL OR source = ANY (ARRAY[
    'website'::text,
    'referral'::text,
    'paid_ad'::text,
    'social_media'::text,
    'event'::text,
    'cold_outreach'::text,
    'partner'::text,
    'other'::text
  ]));
