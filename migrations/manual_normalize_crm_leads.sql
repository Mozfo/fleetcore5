-- ====================================================================
-- NORMALISATION CRM_LEADS - Migrations Manuelles Supabase
-- Date: 2025-11-15
-- À exécuter dans: Supabase Dashboard > SQL Editor
-- ====================================================================

-- --------------------------------------------------------------------
-- STEP A: Normaliser company_name (supprimer demo_company_name)
-- --------------------------------------------------------------------

-- 1. Migrer données existantes
UPDATE crm_leads
SET company_name = demo_company_name
WHERE company_name IS NULL AND demo_company_name IS NOT NULL;

-- 2. Supprimer colonne redondante
ALTER TABLE crm_leads
DROP COLUMN demo_company_name;

-- VÉRIFICATION: SELECT count(*) FROM crm_leads WHERE company_name IS NOT NULL;


-- --------------------------------------------------------------------
-- STEP B: Rendre phone nullable
-- --------------------------------------------------------------------

-- 1. Supprimer contrainte NOT NULL
ALTER TABLE crm_leads
ALTER COLUMN phone DROP NOT NULL;

-- 2. Nettoyer chaînes vides existantes
UPDATE crm_leads
SET phone = NULL
WHERE phone = '';

-- VÉRIFICATION: SELECT count(*) FROM crm_leads WHERE phone IS NULL;


-- --------------------------------------------------------------------
-- STEP C: Étendre status enum (unifier versions)
-- --------------------------------------------------------------------

-- 1. Supprimer ancienne contrainte
ALTER TABLE crm_leads
DROP CONSTRAINT IF EXISTS crm_leads_status_check;

-- 2. Créer nouvelle contrainte avec valeurs unifiées
ALTER TABLE crm_leads
ADD CONSTRAINT crm_leads_status_check
CHECK (status IN (
  'new',
  'contacted',
  'working',
  'qualified',
  'disqualified',
  'converted',
  'lost'
));

-- VÉRIFICATION:
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'crm_leads_status_check';


-- ====================================================================
-- APRÈS EXÉCUTION:
-- 1. Vérifier dans Supabase UI que les colonnes sont modifiées
-- 2. Revenir dans le terminal et confirmer pour continuer
-- ====================================================================
