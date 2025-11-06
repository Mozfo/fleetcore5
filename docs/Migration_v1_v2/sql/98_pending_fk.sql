-- ============================================================================
-- SESSION 98: FK FUTURES
-- ============================================================================
-- Date: 2025-11-04
-- Prérequis: Sessions 01-13 complétées (101 tables, 548 FK)
-- Objectif: Créer FK "backward" manquantes
-- FK détectées manquantes: 1 (trp_settlements.reconciliation_id)
-- ============================================================================

-- VÉRIFICATION PRÉREQUIS
DO $$
DECLARE
  v_tables INT;
  v_fk INT;
BEGIN
  SELECT COUNT(*) INTO v_tables FROM information_schema.tables WHERE table_schema='public';
  SELECT COUNT(*) INTO v_fk FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='public';

  IF v_tables < 101 THEN RAISE EXCEPTION 'Tables insuffisantes: %', v_tables; END IF;
  IF v_fk < 548 THEN RAISE EXCEPTION 'FK insuffisantes: %', v_fk; END IF;

  RAISE NOTICE '✅ Prérequis: % tables, % FK', v_tables, v_fk;
END $$;

-- ============================================================================
-- SECTION 1: CRM → BIL (3 FK)
-- ============================================================================

-- FK 1/7: crm_opportunities.plan_id → bil_billing_plans.id
DO $$
DECLARE v_col BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_opportunities' AND column_name='plan_id') INTO v_col;
    IF v_col THEN
        ALTER TABLE crm_opportunities ADD CONSTRAINT fk_crm_opportunities_plan FOREIGN KEY (plan_id) REFERENCES bil_billing_plans(id) ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✅ FK créée: crm_opportunities → bil_billing_plans';
    ELSE RAISE NOTICE '⏭️  Colonne plan_id inexistante';
    END IF;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE '⏭️  FK existe: crm_opportunities → bil_billing_plans';
END $$;

-- FK 2/7: crm_contracts.plan_id → bil_billing_plans.id
DO $$
DECLARE v_col BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_contracts' AND column_name='plan_id') INTO v_col;
    IF v_col THEN
        ALTER TABLE crm_contracts ADD CONSTRAINT fk_crm_contracts_plan FOREIGN KEY (plan_id) REFERENCES bil_billing_plans(id) ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✅ FK créée: crm_contracts → bil_billing_plans';
    ELSE RAISE NOTICE '⏭️  Colonne plan_id inexistante';
    END IF;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE '⏭️  FK existe: crm_contracts → bil_billing_plans';
END $$;

-- FK 3/7: crm_contracts.subscription_id → bil_tenant_subscriptions.id
DO $$
DECLARE v_col BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_contracts' AND column_name='subscription_id') INTO v_col;
    IF v_col THEN
        ALTER TABLE crm_contracts ADD CONSTRAINT fk_crm_contracts_subscription FOREIGN KEY (subscription_id) REFERENCES bil_tenant_subscriptions(id) ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✅ FK créée: crm_contracts → bil_tenant_subscriptions';
    ELSE RAISE NOTICE '⏭️  Colonne subscription_id inexistante';
    END IF;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE '⏭️  FK existe: crm_contracts → bil_tenant_subscriptions';
END $$;

-- ============================================================================
-- SECTION 2: SUP → RID (1 FK)
-- ============================================================================

-- FK 4/7: sup_customer_feedback.driver_id → rid_drivers.id
DO $$
DECLARE v_col BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sup_customer_feedback' AND column_name='driver_id') INTO v_col;
    IF v_col THEN
        ALTER TABLE sup_customer_feedback ADD CONSTRAINT fk_sup_feedback_driver FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✅ FK créée: sup_customer_feedback → rid_drivers';
    ELSE RAISE NOTICE '⏭️  Colonne driver_id inexistante';
    END IF;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE '⏭️  FK existe: sup_customer_feedback → rid_drivers';
END $$;

-- ============================================================================
-- SECTION 3: TRP → REV (1 FK) ⚠️ FK MANQUANTE DÉTECTÉE
-- ============================================================================

-- FK 5/7: trp_settlements.reconciliation_id → rev_reconciliations.id
-- Source: 11_trp_structure.sql lignes 500-515
-- Statut: ❌ MANQUANTE (détectée par check automatique)
DO $$
DECLARE v_col BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trp_settlements' AND column_name='reconciliation_id') INTO v_col;
    IF v_col THEN
        ALTER TABLE trp_settlements ADD CONSTRAINT fk_trp_settlements_reconciliation FOREIGN KEY (reconciliation_id) REFERENCES rev_reconciliations(id) ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✅ FK créée: trp_settlements → rev_reconciliations';
    ELSE RAISE NOTICE '⏭️  Colonne reconciliation_id inexistante';
    END IF;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE '⏭️  FK existe: trp_settlements → rev_reconciliations';
END $$;

-- ============================================================================
-- SECTION 4: SCH → FLT (1 FK)
-- ============================================================================

-- FK 6/7: sch_shifts.vehicle_id → flt_vehicles.id
DO $$
DECLARE v_col BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sch_shifts' AND column_name='vehicle_id') INTO v_col;
    IF v_col THEN
        ALTER TABLE sch_shifts ADD CONSTRAINT fk_sch_shifts_vehicle FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id) ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✅ FK créée: sch_shifts → flt_vehicles';
    ELSE RAISE NOTICE '⏭️  Colonne vehicle_id inexistante';
    END IF;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE '⏭️  FK existe: sch_shifts → flt_vehicles';
END $$;

-- ============================================================================
-- SECTION 5: BIL → RID (1 FK)
-- ============================================================================

-- FK 7/7: bil_invoices.driver_id → rid_drivers.id
DO $$
DECLARE v_col BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bil_invoices' AND column_name='driver_id') INTO v_col;
    IF v_col THEN
        ALTER TABLE bil_invoices ADD CONSTRAINT fk_bil_invoices_driver FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE '✅ FK créée: bil_invoices → rid_drivers';
    ELSE RAISE NOTICE '⏭️  Colonne driver_id inexistante';
    END IF;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE '⏭️  FK existe: bil_invoices → rid_drivers';
END $$;

-- ============================================================================
-- VALIDATION FINALE
-- ============================================================================
DO $$
DECLARE
  v_fk_final INT;
  v_fk_added INT := 0;
BEGIN
  SELECT COUNT(*) INTO v_fk_final FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='public';
  v_fk_added := v_fk_final - 548;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SESSION 98: FK FUTURES COMPLÉTÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FK avant: 548';
  RAISE NOTICE 'FK ajoutées: %', v_fk_added;
  RAISE NOTICE 'FK après: %', v_fk_final;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ GATEWAY 2 COMPLETED';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIN SESSION 98
-- Prochaine: Session 99 (Indexes)
-- ============================================================================
