-- Migration: Add country_preposition_en column to crm_countries
-- Date: 2025-01-22
-- Purpose: Add English prepositions (in/in the) for grammatically correct country names

-- Add column with default value
ALTER TABLE crm_countries
ADD COLUMN IF NOT EXISTS country_preposition_en VARCHAR(10) DEFAULT 'in';

-- Update prepositions for countries that require "the"
-- Countries with "the" in English (in the)
UPDATE crm_countries SET country_preposition_en = 'in the' WHERE country_code IN (
  'US', -- United States
  'GB', -- United Kingdom
  'NL', -- Netherlands
  'AE'  -- United Arab Emirates
);

-- All other countries use "in" (already default)
-- For reference, these countries use simple "in":
UPDATE crm_countries SET country_preposition_en = 'in' WHERE country_code IN (
  'FR', -- France
  'ES', -- Spain
  'BE', -- Belgium
  'CH', -- Switzerland
  'DE', -- Germany
  'AT', -- Austria
  'AU', -- Australia
  'CA', -- Canada
  'DZ', -- Algeria
  'EG', -- Egypt
  'GR', -- Greece
  'IE', -- Ireland
  'IT', -- Italy
  'MA', -- Morocco
  'PL', -- Poland
  'NO', -- Norway
  'SE', -- Sweden
  'TN', -- Tunisia
  'TR', -- Turkey
  'SA', -- Saudi Arabia
  'QA', -- Qatar
  'PT', -- Portugal
  'KW', -- Kuwait
  'BH', -- Bahrain
  'OM', -- Oman
  'DK'  -- Denmark
);

-- Verify the update
SELECT country_code, country_name_en, country_preposition_en
FROM crm_countries
ORDER BY country_code;
