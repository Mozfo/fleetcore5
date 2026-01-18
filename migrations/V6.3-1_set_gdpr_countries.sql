-- V6.3-1: Set country_gdpr = true for EU/EEA countries
-- GDPR applies to: EU member states + EEA (Iceland, Liechtenstein, Norway)
-- Also includes UK (maintains GDPR equivalent post-Brexit)

UPDATE crm_countries SET country_gdpr = true WHERE country_code IN (
  -- EU Member States (27 countries)
  'AT', -- Austria
  'BE', -- Belgium
  'BG', -- Bulgaria
  'HR', -- Croatia
  'CY', -- Cyprus
  'CZ', -- Czech Republic
  'DK', -- Denmark
  'EE', -- Estonia
  'FI', -- Finland
  'FR', -- France
  'DE', -- Germany
  'GR', -- Greece
  'HU', -- Hungary
  'IE', -- Ireland
  'IT', -- Italy
  'LV', -- Latvia
  'LT', -- Lithuania
  'LU', -- Luxembourg
  'MT', -- Malta
  'NL', -- Netherlands
  'PL', -- Poland
  'PT', -- Portugal
  'RO', -- Romania
  'SK', -- Slovakia
  'SI', -- Slovenia
  'ES', -- Spain
  'SE', -- Sweden

  -- EEA Countries (non-EU but GDPR applies)
  'IS', -- Iceland
  'LI', -- Liechtenstein
  'NO', -- Norway

  -- UK (UK GDPR post-Brexit)
  'GB'  -- United Kingdom
);

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM crm_countries WHERE country_gdpr = true;
  RAISE NOTICE 'GDPR countries updated: % countries now have country_gdpr = true', updated_count;
END $$;
