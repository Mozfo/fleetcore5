-- V6.4-3: Rename locale to language in crm_leads
-- The language the user chose on the homepage (en, fr, ar)
-- This is the ONLY source of truth for email language - no guessing from country_code

-- Step 1: Rename column
ALTER TABLE crm_leads RENAME COLUMN locale TO language;

-- Step 2: Drop old index
DROP INDEX IF EXISTS idx_crm_leads_locale;

-- Step 3: Create new index with correct name
CREATE INDEX IF NOT EXISTS idx_crm_leads_language
ON crm_leads(language)
WHERE deleted_at IS NULL;

-- Step 4: Update comment
COMMENT ON COLUMN crm_leads.language IS 'Language chosen by user on homepage (en/fr/ar). Used for all email communications.';
