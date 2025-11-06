-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 16 - PHASE 4: RELATIONS (FK + TRIGGERS)
-- ═══════════════════════════════════════════════════════════════════════════
-- Durée estimée: 15 minutes
-- Risque: FAIBLE
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  PHASE 4: RELATIONS (FK + TRIGGERS)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 4A: CRÉER FOREIGN KEY (1 FK)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '▶ ÉTAPE 4A: Créer Foreign Key crm_contracts.lead_id'
\echo ''

BEGIN;

ALTER TABLE crm_contracts
ADD CONSTRAINT fk_crm_contracts_lead
FOREIGN KEY (lead_id)
REFERENCES crm_leads(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

\echo '  ✓ FK créée: crm_contracts.lead_id → crm_leads.id'
\echo '     ON DELETE SET NULL, ON UPDATE CASCADE'

COMMIT;

\echo ''
\echo '✅ ÉTAPE 4A: 1 FK créée'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 4B: CRÉER TRIGGERS updated_at (9 triggers)
-- ═══════════════════════════════════════════════════════════════════════════

\echo '▶ ÉTAPE 4B: Créer 9 triggers updated_at'
\echo '   Fonction set_updated_at() existe déjà (vérifiée)'
\echo ''

-- Trigger 1: dir_maintenance_types
CREATE TRIGGER set_updated_at_dir_maintenance_types
BEFORE UPDATE ON dir_maintenance_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
\echo '  ✓ dir_maintenance_types'

-- Trigger 2: dir_ownership_types
CREATE TRIGGER set_updated_at_dir_ownership_types
BEFORE UPDATE ON dir_ownership_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
\echo '  ✓ dir_ownership_types'

-- Trigger 3: dir_vehicle_statuses
CREATE TRIGGER set_updated_at_dir_vehicle_statuses
BEFORE UPDATE ON dir_vehicle_statuses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
\echo '  ✓ dir_vehicle_statuses'

-- Trigger 4: flt_vehicle_equipments
CREATE TRIGGER set_updated_at_flt_vehicle_equipments
BEFORE UPDATE ON flt_vehicle_equipments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
\echo '  ✓ flt_vehicle_equipments'

-- Trigger 5: sch_goal_types
CREATE TRIGGER set_updated_at_sch_goal_types
BEFORE UPDATE ON sch_goal_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
\echo '  ✓ sch_goal_types'

-- Trigger 6: sch_locations
CREATE TRIGGER set_updated_at_sch_locations
BEFORE UPDATE ON sch_locations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
\echo '  ✓ sch_locations'

-- Trigger 7: sch_shift_types
CREATE TRIGGER set_updated_at_sch_shift_types
BEFORE UPDATE ON sch_shift_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
\echo '  ✓ sch_shift_types'

-- Trigger 8: sch_task_types
CREATE TRIGGER set_updated_at_sch_task_types
BEFORE UPDATE ON sch_task_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
\echo '  ✓ sch_task_types'

-- Trigger 9: rid_driver_performances
CREATE TRIGGER set_updated_at_rid_driver_performances
BEFORE UPDATE ON rid_driver_performances
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
\echo '  ✓ rid_driver_performances'

\echo ''
\echo '✅ ÉTAPE 4B: 9 triggers créés'
\echo ''

-- ═══════════════════════════════════════════════════════════════════════════
-- RÉSUMÉ PHASE 4
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  PHASE 4 COMPLÉTÉE AVEC SUCCÈS ✅'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Résumé:'
\echo '  ✅ 1 Foreign Key créée (crm_contracts.lead_id)'
\echo '  ✅ 9 Triggers updated_at créés'
\echo ''
\echo '⏭️  Prochaine étape: Phase 5 (Validation finale)'
\echo ''
