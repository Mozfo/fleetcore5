-- =============================================================================
-- FLEETCORE CRM V6.2-1 - MIGRATION CRM_LEADS
-- Date: 2026-01-04
-- Description: 9 statuts, colonnes booking Cal.com, wizard_completed
-- Référence: FLEETCORE_CRM_SPECIFICATION_V6_2_FINAL.md - Section 17.1
-- =============================================================================
--
-- INSTRUCTIONS D'EXÉCUTION:
-- 1. Ouvrir Supabase Dashboard > SQL Editor
-- 2. Copier-coller ce script
-- 3. Exécuter
-- 4. Vérifier les résultats dans Table Editor
--
-- ROLLBACK disponible en fin de fichier (commenté)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. NOUVELLES COLONNES BOOKING CAL.COM
-- =============================================================================

-- Date/heure du créneau Cal.com sélectionné
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS booking_slot_at TIMESTAMPTZ;

COMMENT ON COLUMN crm_leads.booking_slot_at IS 'V6.2: Date/heure du créneau Cal.com sélectionné par le prospect';

-- Date de confirmation via email J-1 (clic sur "I''ll be there")
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS booking_confirmed_at TIMESTAMPTZ;

COMMENT ON COLUMN crm_leads.booking_confirmed_at IS 'V6.2: Date confirmation via bouton email J-1';

-- UID unique du booking Cal.com pour traçabilité
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS booking_calcom_uid VARCHAR(100);

COMMENT ON COLUMN crm_leads.booking_calcom_uid IS 'V6.2: UID unique du booking Cal.com';

-- Plateformes VTC utilisées par le prospect (Uber, Bolt, Careem, etc.)
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS platforms_used TEXT[];

COMMENT ON COLUMN crm_leads.platforms_used IS 'V6.2: Plateformes VTC utilisées (Uber, Bolt, Careem, etc.)';

-- =============================================================================
-- 2. COLONNE WIZARD
-- =============================================================================

-- TRUE si étape 3 du wizard complétée (téléphone fourni)
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS wizard_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN crm_leads.wizard_completed IS 'V6.2: TRUE si étape 3 wizard complétée (téléphone fourni)';

-- =============================================================================
-- 3. COLONNES CONVERSION (LIEN VERS TENANT)
-- =============================================================================

-- Référence vers le tenant créé après conversion
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES adm_tenants(id);

COMMENT ON COLUMN crm_leads.tenant_id IS 'V6.2: Référence vers tenant créé après conversion Lead→Client';

-- Date/heure de conversion
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

COMMENT ON COLUMN crm_leads.converted_at IS 'V6.2: Date/heure de conversion Lead→Client';

-- =============================================================================
-- 4. INDEX POUR PERFORMANCE
-- =============================================================================

-- Index sur booking_slot_at pour filtrage par date de RDV
CREATE INDEX IF NOT EXISTS idx_crm_leads_booking_slot
ON crm_leads(booking_slot_at)
WHERE booking_slot_at IS NOT NULL;

-- Index sur booking_calcom_uid pour lookup par webhook Cal.com
CREATE INDEX IF NOT EXISTS idx_crm_leads_booking_calcom_uid
ON crm_leads(booking_calcom_uid)
WHERE booking_calcom_uid IS NOT NULL;

-- Index sur wizard_completed pour filtrage leads complets vs incomplets
CREATE INDEX IF NOT EXISTS idx_crm_leads_wizard_completed
ON crm_leads(wizard_completed);

-- Index sur tenant_id pour liaison avec comptes clients
CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant
ON crm_leads(tenant_id)
WHERE tenant_id IS NOT NULL;

-- =============================================================================
-- 5. CHECK CONSTRAINT STATUS (9 STATUTS V6.2)
-- =============================================================================

-- D'abord, migrer les anciens statuts si présents
-- demo_requested → new (ancien flux callback)
UPDATE crm_leads
SET status = 'new'
WHERE status = 'demo_requested';

-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE crm_leads
DROP CONSTRAINT IF EXISTS crm_leads_status_check;

-- Nouvelle contrainte avec les 9 statuts V6.2
-- Statuts:
--   1. new           - Email OK, pas de booking Cal.com
--   2. demo_scheduled - Créneau Cal.com confirmé
--   3. qualified      - Qualifié CPT pendant l'appel
--   4. demo_completed - Demo live réalisée
--   5. proposal_sent  - Lien paiement Stripe envoyé
--   6. converted      - Paiement reçu, tenant créé
--   7. lost           - Perdu (raison obligatoire)
--   8. nurturing      - Timing pas bon, relance programmée
--   9. disqualified   - Hors cible / Red flag
ALTER TABLE crm_leads
ADD CONSTRAINT crm_leads_status_check
CHECK (status IN (
  'new',
  'demo_scheduled',
  'qualified',
  'demo_completed',
  'proposal_sent',
  'converted',
  'lost',
  'nurturing',
  'disqualified'
));

-- =============================================================================
-- 6. MARQUER COLONNES DEPRECATED
-- =============================================================================

-- Flux callback supprimé en V6.2 (remplacé par Cal.com booking)
COMMENT ON COLUMN crm_leads.callback_requested_at IS 'DEPRECATED V6.2 - Flux callback supprimé, utiliser booking_slot_at';
COMMENT ON COLUMN crm_leads.callback_scheduled_at IS 'DEPRECATED V6.2 - Flux callback supprimé, utiliser booking_slot_at';
COMMENT ON COLUMN crm_leads.callback_mode IS 'DEPRECATED V6.2 - Flux callback supprimé';

-- =============================================================================
-- 7. COMMENTAIRE TABLE
-- =============================================================================

COMMENT ON TABLE crm_leads IS 'V6.2: Leads CRM - 9 statuts, wizard booking 3 étapes, CPT qualification. Architecture: CRM → CLT → ADM';

COMMIT;

-- =============================================================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================================================
-- Exécuter ces requêtes pour vérifier:

-- 1. Vérifier les nouvelles colonnes
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'crm_leads'
-- AND column_name IN ('booking_slot_at', 'booking_confirmed_at', 'booking_calcom_uid',
--                     'platforms_used', 'wizard_completed', 'tenant_id', 'converted_at')
-- ORDER BY column_name;

-- 2. Vérifier les index
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'crm_leads'
-- AND indexname LIKE 'idx_crm_leads_booking%' OR indexname LIKE 'idx_crm_leads_wizard%' OR indexname LIKE 'idx_crm_leads_tenant';

-- 3. Vérifier la contrainte status
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'crm_leads'::regclass
-- AND conname = 'crm_leads_status_check';

-- 4. Vérifier qu'aucun lead n'a un status invalide
-- SELECT status, COUNT(*) FROM crm_leads GROUP BY status;

-- =============================================================================
-- ROLLBACK (si nécessaire - décommenter et exécuter)
-- =============================================================================
-- BEGIN;
--
-- -- Supprimer les nouvelles colonnes
-- ALTER TABLE crm_leads DROP COLUMN IF EXISTS booking_slot_at;
-- ALTER TABLE crm_leads DROP COLUMN IF EXISTS booking_confirmed_at;
-- ALTER TABLE crm_leads DROP COLUMN IF EXISTS booking_calcom_uid;
-- ALTER TABLE crm_leads DROP COLUMN IF EXISTS platforms_used;
-- ALTER TABLE crm_leads DROP COLUMN IF EXISTS wizard_completed;
-- ALTER TABLE crm_leads DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE crm_leads DROP COLUMN IF EXISTS converted_at;
--
-- -- Supprimer les index
-- DROP INDEX IF EXISTS idx_crm_leads_booking_slot;
-- DROP INDEX IF EXISTS idx_crm_leads_booking_calcom_uid;
-- DROP INDEX IF EXISTS idx_crm_leads_wizard_completed;
-- DROP INDEX IF EXISTS idx_crm_leads_tenant;
--
-- -- Supprimer la contrainte status V6.2
-- ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_status_check;
--
-- COMMIT;
