-- Migration: Add country_preposition_fr column to crm_countries
-- Date: 2025-01-16
-- Purpose: Add French prepositions (en/au/aux) for grammatically correct country names

-- Add column with default value
ALTER TABLE crm_countries
ADD COLUMN IF NOT EXISTS country_preposition_fr VARCHAR(5) DEFAULT 'en';

-- Update prepositions for all countries
-- Masculine countries (au)
UPDATE crm_countries SET country_preposition_fr = 'au' WHERE country_code IN (
  'CA', -- Canada
  'MA', -- Maroc
  'QA', -- Qatar
  'GB', -- Royaume-Uni
  'PT', -- Portugal
  'KW', -- Koweït
  'BH', -- Bahreïn
  'OM', -- Oman
  'DK'  -- Danemark
);

-- Plural countries (aux)
UPDATE crm_countries SET country_preposition_fr = 'aux' WHERE country_code IN (
  'AE', -- Émirats Arabes Unis
  'US', -- États-Unis
  'NL'  -- Pays-Bas
);

-- Feminine countries (en) - already default, but listing for clarity
UPDATE crm_countries SET country_preposition_fr = 'en' WHERE country_code IN (
  'FR', -- France
  'ES', -- Espagne
  'BE', -- Belgique
  'CH', -- Suisse
  'DE', -- Allemagne
  'AT', -- Autriche
  'AU', -- Australie
  'DZ', -- Algérie
  'EG', -- Égypte
  'GR', -- Grèce
  'IE', -- Irlande
  'IT', -- Italie
  'PL', -- Pologne
  'NO', -- Norvège
  'SE', -- Suède
  'TN', -- Tunisie
  'TR', -- Turquie
  'SA'  -- Arabie Saoudite (special case: "en Arabie Saoudite")
);

-- Verify the update
SELECT country_code, country_name_fr, country_preposition_fr
FROM crm_countries
ORDER BY country_code;
