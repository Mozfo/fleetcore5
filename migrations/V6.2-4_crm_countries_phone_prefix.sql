-- V6.2-4: Add phone_prefix column to crm_countries
-- This enables phone number validation with country-specific dial codes

-- Add phone_prefix column
ALTER TABLE crm_countries
ADD COLUMN IF NOT EXISTS phone_prefix VARCHAR(10);

-- Update phone prefixes for common countries
UPDATE crm_countries SET phone_prefix = '+33' WHERE country_code = 'FR';  -- France
UPDATE crm_countries SET phone_prefix = '+1' WHERE country_code = 'US';   -- USA
UPDATE crm_countries SET phone_prefix = '+44' WHERE country_code = 'GB';  -- UK
UPDATE crm_countries SET phone_prefix = '+49' WHERE country_code = 'DE';  -- Germany
UPDATE crm_countries SET phone_prefix = '+34' WHERE country_code = 'ES';  -- Spain
UPDATE crm_countries SET phone_prefix = '+39' WHERE country_code = 'IT';  -- Italy
UPDATE crm_countries SET phone_prefix = '+32' WHERE country_code = 'BE';  -- Belgium
UPDATE crm_countries SET phone_prefix = '+31' WHERE country_code = 'NL';  -- Netherlands
UPDATE crm_countries SET phone_prefix = '+41' WHERE country_code = 'CH';  -- Switzerland
UPDATE crm_countries SET phone_prefix = '+43' WHERE country_code = 'AT';  -- Austria
UPDATE crm_countries SET phone_prefix = '+351' WHERE country_code = 'PT'; -- Portugal
UPDATE crm_countries SET phone_prefix = '+48' WHERE country_code = 'PL';  -- Poland
UPDATE crm_countries SET phone_prefix = '+46' WHERE country_code = 'SE';  -- Sweden
UPDATE crm_countries SET phone_prefix = '+47' WHERE country_code = 'NO';  -- Norway
UPDATE crm_countries SET phone_prefix = '+45' WHERE country_code = 'DK';  -- Denmark
UPDATE crm_countries SET phone_prefix = '+358' WHERE country_code = 'FI'; -- Finland
UPDATE crm_countries SET phone_prefix = '+353' WHERE country_code = 'IE'; -- Ireland
UPDATE crm_countries SET phone_prefix = '+30' WHERE country_code = 'GR';  -- Greece
UPDATE crm_countries SET phone_prefix = '+420' WHERE country_code = 'CZ'; -- Czech Republic
UPDATE crm_countries SET phone_prefix = '+36' WHERE country_code = 'HU';  -- Hungary
UPDATE crm_countries SET phone_prefix = '+40' WHERE country_code = 'RO';  -- Romania
UPDATE crm_countries SET phone_prefix = '+359' WHERE country_code = 'BG'; -- Bulgaria
UPDATE crm_countries SET phone_prefix = '+385' WHERE country_code = 'HR'; -- Croatia
UPDATE crm_countries SET phone_prefix = '+421' WHERE country_code = 'SK'; -- Slovakia
UPDATE crm_countries SET phone_prefix = '+386' WHERE country_code = 'SI'; -- Slovenia
UPDATE crm_countries SET phone_prefix = '+370' WHERE country_code = 'LT'; -- Lithuania
UPDATE crm_countries SET phone_prefix = '+371' WHERE country_code = 'LV'; -- Latvia
UPDATE crm_countries SET phone_prefix = '+372' WHERE country_code = 'EE'; -- Estonia
UPDATE crm_countries SET phone_prefix = '+356' WHERE country_code = 'MT'; -- Malta
UPDATE crm_countries SET phone_prefix = '+357' WHERE country_code = 'CY'; -- Cyprus
UPDATE crm_countries SET phone_prefix = '+352' WHERE country_code = 'LU'; -- Luxembourg

-- Middle East & North Africa
UPDATE crm_countries SET phone_prefix = '+971' WHERE country_code = 'AE'; -- UAE
UPDATE crm_countries SET phone_prefix = '+966' WHERE country_code = 'SA'; -- Saudi Arabia
UPDATE crm_countries SET phone_prefix = '+974' WHERE country_code = 'QA'; -- Qatar
UPDATE crm_countries SET phone_prefix = '+965' WHERE country_code = 'KW'; -- Kuwait
UPDATE crm_countries SET phone_prefix = '+973' WHERE country_code = 'BH'; -- Bahrain
UPDATE crm_countries SET phone_prefix = '+968' WHERE country_code = 'OM'; -- Oman
UPDATE crm_countries SET phone_prefix = '+962' WHERE country_code = 'JO'; -- Jordan
UPDATE crm_countries SET phone_prefix = '+961' WHERE country_code = 'LB'; -- Lebanon
UPDATE crm_countries SET phone_prefix = '+20' WHERE country_code = 'EG';  -- Egypt
UPDATE crm_countries SET phone_prefix = '+212' WHERE country_code = 'MA'; -- Morocco
UPDATE crm_countries SET phone_prefix = '+216' WHERE country_code = 'TN'; -- Tunisia
UPDATE crm_countries SET phone_prefix = '+213' WHERE country_code = 'DZ'; -- Algeria

-- Other regions
UPDATE crm_countries SET phone_prefix = '+7' WHERE country_code = 'RU';   -- Russia
UPDATE crm_countries SET phone_prefix = '+90' WHERE country_code = 'TR';  -- Turkey
UPDATE crm_countries SET phone_prefix = '+27' WHERE country_code = 'ZA';  -- South Africa
UPDATE crm_countries SET phone_prefix = '+91' WHERE country_code = 'IN';  -- India
UPDATE crm_countries SET phone_prefix = '+86' WHERE country_code = 'CN';  -- China
UPDATE crm_countries SET phone_prefix = '+81' WHERE country_code = 'JP';  -- Japan
UPDATE crm_countries SET phone_prefix = '+82' WHERE country_code = 'KR';  -- South Korea
UPDATE crm_countries SET phone_prefix = '+61' WHERE country_code = 'AU';  -- Australia
UPDATE crm_countries SET phone_prefix = '+64' WHERE country_code = 'NZ';  -- New Zealand
UPDATE crm_countries SET phone_prefix = '+55' WHERE country_code = 'BR';  -- Brazil
UPDATE crm_countries SET phone_prefix = '+52' WHERE country_code = 'MX';  -- Mexico
UPDATE crm_countries SET phone_prefix = '+1' WHERE country_code = 'CA';   -- Canada
UPDATE crm_countries SET phone_prefix = '+65' WHERE country_code = 'SG';  -- Singapore
UPDATE crm_countries SET phone_prefix = '+852' WHERE country_code = 'HK'; -- Hong Kong
