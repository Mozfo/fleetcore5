-- V6.4-3: Add phone validation rules to crm_countries
-- These fields define the expected phone number length (excluding country code)

ALTER TABLE crm_countries 
ADD COLUMN IF NOT EXISTS phone_min_digits INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS phone_max_digits INTEGER DEFAULT 12;

-- Update common countries with their actual phone rules
-- France: 9 digits (e.g., 6 12 34 56 78)
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'FR';

-- UAE: 9 digits (e.g., 50 123 4567)
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'AE';

-- Algeria: 9 digits
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'DZ';

-- Morocco: 9 digits
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'MA';

-- Tunisia: 8 digits
UPDATE crm_countries SET phone_min_digits = 8, phone_max_digits = 8 WHERE country_code = 'TN';

-- Saudi Arabia: 9 digits
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'SA';

-- Italy: 9-10 digits
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 10 WHERE country_code = 'IT';

-- Spain: 9 digits
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'ES';

-- Germany: 10-11 digits (variable)
UPDATE crm_countries SET phone_min_digits = 10, phone_max_digits = 11 WHERE country_code = 'DE';

-- Belgium: 9 digits
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'BE';

-- UK: 10 digits
UPDATE crm_countries SET phone_min_digits = 10, phone_max_digits = 10 WHERE country_code = 'GB';

-- USA: 10 digits
UPDATE crm_countries SET phone_min_digits = 10, phone_max_digits = 10 WHERE country_code = 'US';

-- Egypt: 10 digits
UPDATE crm_countries SET phone_min_digits = 10, phone_max_digits = 10 WHERE country_code = 'EG';

-- Qatar: 8 digits
UPDATE crm_countries SET phone_min_digits = 8, phone_max_digits = 8 WHERE country_code = 'QA';

-- Kuwait: 8 digits
UPDATE crm_countries SET phone_min_digits = 8, phone_max_digits = 8 WHERE country_code = 'KW';

-- Bahrain: 8 digits
UPDATE crm_countries SET phone_min_digits = 8, phone_max_digits = 8 WHERE country_code = 'BH';

-- Oman: 8 digits
UPDATE crm_countries SET phone_min_digits = 8, phone_max_digits = 8 WHERE country_code = 'OM';

-- Jordan: 9 digits
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'JO';

-- Lebanon: 8 digits
UPDATE crm_countries SET phone_min_digits = 8, phone_max_digits = 8 WHERE country_code = 'LB';

-- Portugal: 9 digits
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'PT';

-- Netherlands: 9 digits
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'NL';

-- Sweden: 9 digits
UPDATE crm_countries SET phone_min_digits = 9, phone_max_digits = 9 WHERE country_code = 'SE';

-- Norway: 8 digits
UPDATE crm_countries SET phone_min_digits = 8, phone_max_digits = 8 WHERE country_code = 'NO';

COMMENT ON COLUMN crm_countries.phone_min_digits IS 'Minimum digits for phone number (excluding country code)';
COMMENT ON COLUMN crm_countries.phone_max_digits IS 'Maximum digits for phone number (excluding country code)';
