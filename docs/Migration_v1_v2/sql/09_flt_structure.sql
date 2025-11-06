-- ============================================================================
-- FLEETCORE V2 - MIGRATION STRUCTURELLE
-- MODULE: FLT (Fleet Management) - Session 8/13
-- ============================================================================
-- Description: Migration structure du module Fleet Management
-- Tables: 10 total (6 V1 existantes + 4 nouvelles V2)
-- Enums: 32 nouveaux
-- Features: Handover protocol, predictive maintenance, expense validation,
--           multi-policy insurance, multi-country compliance
--
-- IMPORTANT: Migration ADDITIVE - Coexistence V1/V2
--   - Les colonnes V1 existantes sont PRÉSERVÉES
--   - Les nouvelles colonnes V2 sont AJOUTÉES avec suffixe ou nom distinct
--   - Session 14: Migration des données V1 → V2
--   - Session 16: DROP V1 + RENAME _v2 → colonnes finales
-- ============================================================================

-- ============================================================================
-- SECTION 1: CRÉATION DES ENUMS (40 nouveaux)
-- ============================================================================
-- Stratégie: Idempotence avec DO $$ EXCEPTION blocks
-- Note: Les enums ne peuvent pas être modifiés, seulement créés ou recréés

-- Assignment Enums (3)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_type') THEN
        CREATE TYPE assignment_type AS ENUM ('permanent', 'temporary', 'trial');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
        CREATE TYPE assignment_status AS ENUM ('active', 'completed', 'cancelled');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'handover_type') THEN
        CREATE TYPE handover_type AS ENUM ('pickup', 'return', 'transfer');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Vehicle Event Enums (5)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_event_type') THEN
        CREATE TYPE vehicle_event_type AS ENUM ('accident', 'maintenance', 'violation', 'recovery', 'impound', 'theft', 'breakdown');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'responsible_party') THEN
        CREATE TYPE responsible_party AS ENUM ('fleet', 'driver', 'third_party');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_severity') THEN
        CREATE TYPE event_severity AS ENUM ('minor', 'moderate', 'major', 'total_loss');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status') THEN
        CREATE TYPE claim_status AS ENUM ('filed', 'processing', 'approved', 'rejected', 'closed');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'repair_status') THEN
        CREATE TYPE repair_status AS ENUM ('pending', 'approved', 'in_progress', 'completed', 'cancelled');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Maintenance Enums (4)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_type') THEN
        CREATE TYPE maintenance_type AS ENUM ('oil_change', 'tire_rotation', 'brake_service', 'engine_service', 'transmission_service', 'battery_replacement', 'air_filter', 'coolant_flush', 'alignment', 'inspection', 'other');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_category') THEN
        CREATE TYPE maintenance_category AS ENUM ('preventive', 'corrective', 'regulatory', 'emergency');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_priority') THEN
        CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent', 'emergency');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status') THEN
        CREATE TYPE maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'deferred');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Expense Enums (5)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
        CREATE TYPE expense_category AS ENUM ('fuel', 'toll', 'parking', 'wash', 'repair', 'fine', 'insurance_deductible', 'registration', 'inspection', 'permit', 'other');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'auto_approved');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_status') THEN
        CREATE TYPE receipt_status AS ENUM ('pending', 'verified', 'invalid', 'missing');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'allocation_rule') THEN
        CREATE TYPE allocation_rule AS ENUM ('driver', 'fleet', 'shared', 'client');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'processed', 'failed', 'refunded');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Insurance Enums (6)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'policy_category') THEN
        CREATE TYPE policy_category AS ENUM ('main', 'supplementary', 'temporary', 'rider');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coverage_drivers') THEN
        CREATE TYPE coverage_drivers AS ENUM ('named', 'any', 'professional');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_usage') THEN
        CREATE TYPE vehicle_usage AS ENUM ('commercial', 'private', 'mixed');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_status') THEN
        CREATE TYPE insurance_status AS ENUM ('active', 'expired', 'cancelled', 'suspended');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_frequency') THEN
        CREATE TYPE payment_frequency AS ENUM ('annual', 'semi_annual', 'quarterly', 'monthly');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('direct_debit', 'bank_transfer', 'credit_card', 'cash', 'cheque');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Inspection Enums (2)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_type') THEN
        CREATE TYPE inspection_type AS ENUM ('annual', 'pre_trip', 'post_accident', 'regulatory', 'pre_sale', 'custom');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_status') THEN
        CREATE TYPE inspection_status AS ENUM ('scheduled', 'passed', 'failed', 'pending', 'cancelled');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Equipment Enums (3)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_type') THEN
        CREATE TYPE equipment_type AS ENUM ('dashcam', 'gps_tracker', 'tablet', 'phone_charger', 'phone_mount', 'spare_tire', 'jack', 'warning_triangle', 'first_aid_kit', 'fire_extinguisher', 'reflective_vest', 'other');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_status') THEN
        CREATE TYPE equipment_status AS ENUM ('provided', 'returned', 'lost', 'damaged', 'stolen');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_condition') THEN
        CREATE TYPE equipment_condition AS ENUM ('new_item', 'excellent', 'good', 'fair', 'poor', 'damaged');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Additional Enums (4)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_rating') THEN
        CREATE TYPE risk_rating AS ENUM ('A', 'B', 'C', 'D', 'E');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'body_type') THEN
        CREATE TYPE body_type AS ENUM ('sedan', 'hatchback', 'suv', 'van', 'minivan', 'pickup', 'coupe', 'wagon', 'limousine', 'other');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_type') THEN
        CREATE TYPE fuel_type AS ENUM ('gasoline', 'diesel', 'hybrid', 'electric', 'plugin_hybrid', 'cng', 'lpg', 'hydrogen');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transmission_type') THEN
        CREATE TYPE transmission_type AS ENUM ('manual', 'automatic', 'semi_automatic', 'cvt');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 2: ALTER TABLE - Extension des 6 tables V1 existantes
-- ============================================================================
-- Stratégie: Ajout de colonnes avec IF NOT EXISTS
-- Note: Préservation des colonnes V1, ajout colonnes V2

-- ----------------------------------------------------------------------------
-- 2.1: flt_vehicles - 28 → 49 colonnes (21 nouvelles)
-- ----------------------------------------------------------------------------
-- V1: 28 colonnes de base (make_id, model_id, license_plate, vin, year, etc.)
-- V2: Ajout de 21 colonnes (multi-country compliance, dimensions, predictive maintenance, ownership, status_id)

-- Multi-country compliance (3 colonnes)
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS country_code CHAR(2);
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS requires_professional_license BOOLEAN DEFAULT false;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS documents_status JSONB;

-- Physical dimensions (6 colonnes)
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS body_type VARCHAR(20);
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS passenger_capacity INTEGER;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS car_length_cm INTEGER;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS car_width_cm INTEGER;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS car_height_cm INTEGER;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS seats INTEGER;

-- Vehicle class modification
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS vehicle_class_id UUID;

-- Registration dates
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS first_registration_date DATE;

-- Predictive maintenance (3 colonnes)
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS warranty_expiry DATE;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS service_interval_km INTEGER;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS next_service_at_km INTEGER;

-- Insurance detailed (5 colonnes)
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS insurance_coverage_type TEXT;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS insurance_amount DECIMAL(18,2);
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS insurance_issue_date DATE;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS insurance_expiry DATE;

-- Ownership & Finance (5 colonnes)
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS ownership_type_id UUID;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS acquisition_date DATE;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS lease_end_date DATE;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS residual_value DECIMAL(18,2);

-- Current state
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS status_id UUID;
ALTER TABLE flt_vehicles ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

-- ----------------------------------------------------------------------------
-- 2.2: flt_vehicle_assignments - 16 → 37 colonnes (21 nouvelles)
-- ----------------------------------------------------------------------------
-- V1: 16 colonnes de base (driver_id, vehicle_id, start_date, end_date, etc.)
-- V2: Ajout de 21 colonnes (handover protocol, photos, digital signatures, return state)

-- Handover protocol (3 colonnes)
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS handover_date TIMESTAMPTZ;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS handover_location TEXT;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS handover_type VARCHAR(20);

-- Initial vehicle state (3 colonnes)
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS initial_odometer INTEGER;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS initial_fuel_level INTEGER;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS initial_condition JSONB;

-- Photos protocol (2 colonnes)
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS handover_photos JSONB;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS photos_metadata JSONB;

-- Digital validation (3 colonnes)
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS driver_signature TEXT;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS fleet_signature TEXT;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS handover_checklist JSONB;

-- Return vehicle state (7 colonnes)
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS return_date TIMESTAMPTZ;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS return_odometer INTEGER;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS return_fuel_level INTEGER;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS return_condition JSONB;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS damages_reported JSONB;
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS penalty_amount DECIMAL(18,2);

-- Metadata
ALTER TABLE flt_vehicle_assignments ADD COLUMN IF NOT EXISTS notes TEXT;

-- ----------------------------------------------------------------------------
-- 2.3: flt_vehicle_events - 18 → 37 colonnes (19 nouvelles)
-- ----------------------------------------------------------------------------
-- V1: 18 colonnes de base (event_type, event_date, details, etc.)
-- V2: Ajout de 19 colonnes (driver_id, links, responsibility, police/insurance, repair management, photos)

-- Links (3 colonnes)
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS driver_id UUID;
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS ride_id UUID;
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS assignment_id UUID;

-- Responsibility tracking (3 colonnes)
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS responsible_party VARCHAR(20);
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS fault_percentage INTEGER;
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS liability_assessment JSONB;

-- Accident specifics
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS severity VARCHAR(20);

-- Police & Insurance (5 colonnes)
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS police_report_number TEXT;
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS police_station TEXT;
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS insurance_claim_id UUID;
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS claim_status VARCHAR(20);

-- Repair management (5 colonnes)
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS repair_status VARCHAR(20);
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS repair_shop_id UUID;
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS estimated_repair_days INTEGER;
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS actual_repair_days INTEGER;
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS repair_invoice_id UUID;

-- Financial impact
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS downtime_hours INTEGER;

-- Photos
ALTER TABLE flt_vehicle_events ADD COLUMN IF NOT EXISTS photos JSONB;

-- ----------------------------------------------------------------------------
-- 2.4: flt_vehicle_maintenance - 22 → 48 colonnes (26 nouvelles)
-- ----------------------------------------------------------------------------
-- V1: 22 colonnes de base (maintenance_type, scheduled_date, status, provider, cost, etc.)
-- V2: Ajout de 26 colonnes (workflow, warranty, cost breakdown, parts detail, garage management, soft delete)

-- Scheduling
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS actual_start TIMESTAMPTZ;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS actual_end TIMESTAMPTZ;

-- Categorization (4 colonnes)
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS maintenance_category VARCHAR(20);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS priority VARCHAR(20);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS regulatory_requirement BOOLEAN DEFAULT false;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS blocking_vehicle BOOLEAN DEFAULT false;

-- Warranty management (5 colonnes)
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS warranty_covered BOOLEAN DEFAULT false;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS warranty_claim_number TEXT;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS warranty_amount DECIMAL(18,2);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS insurance_covered BOOLEAN DEFAULT false;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS insurance_claim_ref TEXT;

-- Validation workflow (5 colonnes)
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS requested_by UUID;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Cost breakdown (9 colonnes)
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS labor_hours DECIMAL(8,2);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS labor_rate DECIMAL(18,2);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(18,2);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS parts_cost DECIMAL(18,2);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS other_costs DECIMAL(18,2);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(18,2);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS total_cost_excl_tax DECIMAL(18,2);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS total_cost_incl_tax DECIMAL(18,2);
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS currency CHAR(3);

-- Parts detail
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS parts_detail JSONB;

-- Garage management (6 colonnes)
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS garage_id UUID;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS work_order_number TEXT;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS mechanic_name TEXT;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS mechanic_certification TEXT;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS quality_check_by UUID;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS quality_check_at TIMESTAMPTZ;

-- Blocking periods
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS blocked_periods JSONB;

-- Soft delete (3 colonnes)
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE flt_vehicle_maintenance ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ----------------------------------------------------------------------------
-- 2.5: flt_vehicle_expenses - 29 → 55 colonnes (26 nouvelles)
-- ----------------------------------------------------------------------------
-- V1: 29 colonnes de base (expense_category, expense_date, amount, driver_id, etc.)
-- V2: Ajout de 26 colonnes (validation circuit, receipt verification, cost allocation, reimbursement, period tracking)

-- Category enhancement
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS expense_subcategory VARCHAR(50);

-- Period tracking (4 colonnes)
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS mileage_start INTEGER;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS mileage_end INTEGER;

-- Multiple trips
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS trip_ids UUID[];

-- Validation circuit (6 colonnes)
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS approval_threshold DECIMAL(18,2);
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20);
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Receipt verification (6 colonnes)
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS receipt_status VARCHAR(20);
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS receipt_verified_by UUID;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS receipt_verified_at TIMESTAMPTZ;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS receipt_issues JSONB;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS ocr_extracted_data JSONB;

-- Cost allocation (5 colonnes)
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS allocation_rule VARCHAR(20);
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS driver_share_percent INTEGER;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS fleet_share_percent INTEGER;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS client_share_percent INTEGER;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS cost_center_id UUID;

-- Reimbursement (4 colonnes)
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS payment_batch_id UUID;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20);
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE flt_vehicle_expenses ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- ----------------------------------------------------------------------------
-- 2.6: flt_vehicle_insurances - 30 → 65 colonnes (35 nouvelles)
-- ----------------------------------------------------------------------------
-- V1: 30 colonnes de base (policy_number, insurer_name, start_date, end_date, premium, etc.)
-- V2: Ajout de 35 colonnes (multi-policy, coverage detailed, bonus/malus, claims tracking, risk, broker, renewal, payments, co-insurance)

-- Multi-policy support (3 colonnes)
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS policy_category VARCHAR(20);
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS policy_priority INTEGER;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS parent_policy_id UUID;

-- Coverage detailed (4 colonnes)
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS coverage_territories TEXT[];
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS coverage_drivers VARCHAR(20);
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS driver_restrictions JSONB;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS vehicle_usage VARCHAR(20);

-- Premium breakdown
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS base_premium DECIMAL(18,2);

-- Franchises structured
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS excess_details JSONB;

-- Bonus/Malus (3 colonnes)
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS no_claims_years INTEGER DEFAULT 0;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS no_claims_bonus INTEGER DEFAULT 0;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS claims_loading INTEGER DEFAULT 0;

-- Claims tracking (4 colonnes)
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS claims_count INTEGER DEFAULT 0;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS claims_detail JSONB;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS total_claims_amount DECIMAL(18,2);
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS claims_ratio DECIMAL(8,4);

-- Risk management (4 colonnes)
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS risk_rating VARCHAR(10);
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS risk_factors JSONB;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS special_conditions JSONB;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS exclusions JSONB;

-- Broker (3 colonnes)
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS broker_id UUID;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS broker_commission DECIMAL(5,2);
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS broker_reference TEXT;

-- Renewal (4 colonnes)
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS renewal_notice_sent BOOLEAN DEFAULT false;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS renewal_quote DECIMAL(18,2);
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS competitor_quotes JSONB;

-- Payments (5 colonnes)
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20);
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS payment_schedule JSONB;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS next_payment_date DATE;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(18,2);

-- Co-insurance (3 colonnes)
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS co_insurance BOOLEAN DEFAULT false;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS co_insurers JSONB;
ALTER TABLE flt_vehicle_insurances ADD COLUMN IF NOT EXISTS lead_insurer VARCHAR(200);

-- ============================================================================
-- SECTION 3: CREATE TABLE - 4 nouvelles tables V2
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1: dir_vehicle_statuses - Référentiel des statuts véhicules
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dir_vehicle_statuses (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color for UI

    -- Workflow rules
    allowed_transitions JSONB, -- Array of allowed status codes
    requires_approval BOOLEAN DEFAULT false,
    blocking_status BOOLEAN DEFAULT false, -- If true, vehicle cannot be assigned

    -- Triggers
    automatic_actions JSONB, -- Actions to trigger on status change
    notification_rules JSONB, -- Who to notify and how

    -- Validation
    required_documents JSONB, -- Documents required for this status
    validation_rules JSONB, -- Conditions to enter/exit this status

    -- Metadata
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT
);

-- Indexes pour dir_vehicle_statuses
CREATE INDEX IF NOT EXISTS idx_dir_vehicle_statuses_code ON dir_vehicle_statuses(code);
CREATE INDEX IF NOT EXISTS idx_dir_vehicle_statuses_is_active ON dir_vehicle_statuses(is_active);

-- ----------------------------------------------------------------------------
-- 3.2: dir_ownership_types - Référentiel des types de propriété
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dir_ownership_types (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Ownership rules
    requires_owner BOOLEAN DEFAULT false, -- If true, owner_id is mandatory
    allows_leasing BOOLEAN DEFAULT false,
    depreciation BOOLEAN DEFAULT true, -- If false, no depreciation

    -- Financial rules
    maintenance_responsibility VARCHAR(20), -- owner, lessee, fleet
    insurance_responsibility VARCHAR(20), -- owner, lessee, fleet

    -- Metadata
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT
);

-- Indexes pour dir_ownership_types
CREATE INDEX IF NOT EXISTS idx_dir_ownership_types_code ON dir_ownership_types(code);
CREATE INDEX IF NOT EXISTS idx_dir_ownership_types_is_active ON dir_ownership_types(is_active);

-- ----------------------------------------------------------------------------
-- 3.3: flt_vehicle_inspections - Historique des inspections
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flt_vehicle_inspections (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,

    -- Inspection details
    inspection_type VARCHAR(50) NOT NULL, -- annual, pre_trip, post_accident, etc
    scheduled_date DATE NOT NULL,
    actual_date DATE,

    -- Results
    status VARCHAR(20) NOT NULL, -- scheduled, passed, failed, pending
    passed BOOLEAN DEFAULT false,
    score INTEGER, -- Score out of 100

    -- Details
    inspector_name VARCHAR(100),
    inspection_center VARCHAR(200),
    certificate_number VARCHAR(100),
    expiry_date DATE,

    -- Issues found
    issues_found JSONB, -- Array of issues
    corrective_actions JSONB, -- Actions required

    -- Documents
    report_url TEXT,
    certificate_url TEXT,
    photos_urls JSONB, -- Array of photo URLs

    -- Costs
    cost_amount DECIMAL(18,2),
    currency CHAR(3),

    -- Next inspection
    next_inspection_date DATE,
    reminder_sent BOOLEAN DEFAULT false,

    -- Notes
    notes TEXT,
    metadata JSONB,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID
);

-- Indexes pour flt_vehicle_inspections
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_inspections_tenant_id ON flt_vehicle_inspections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_inspections_vehicle_id ON flt_vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_inspections_scheduled_date ON flt_vehicle_inspections(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_inspections_status ON flt_vehicle_inspections(status);

-- ----------------------------------------------------------------------------
-- 3.4: flt_vehicle_equipments - Inventaire des équipements
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flt_vehicle_equipments (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,

    -- Equipment details
    equipment_type VARCHAR(50) NOT NULL, -- dashcam, gps, tablet, charger, etc
    name VARCHAR(100) NOT NULL,
    description TEXT,
    serial_number VARCHAR(100),

    -- Lifecycle
    provided_date DATE NOT NULL,
    return_date DATE,
    expiry_date DATE, -- For items with limited lifespan

    -- Financial
    purchase_price DECIMAL(18,2),
    current_value DECIMAL(18,2),
    currency CHAR(3),
    depreciation_rate DECIMAL(5,2), -- Percentage per year

    -- Condition
    condition_at_provision VARCHAR(20), -- new, good, fair, poor
    condition_at_return VARCHAR(20),
    damage_notes TEXT,

    -- Status
    status VARCHAR(20) NOT NULL, -- provided, returned, lost, damaged
    current_assignment_id UUID, -- FK to assignment if currently assigned

    -- Warranty
    warranty_expiry DATE,
    warranty_provider VARCHAR(100),

    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,

    -- Notes
    notes TEXT,
    metadata JSONB,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- Indexes pour flt_vehicle_equipments
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_equipments_tenant_id ON flt_vehicle_equipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_equipments_vehicle_id ON flt_vehicle_equipments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_equipments_status ON flt_vehicle_equipments(status);
CREATE INDEX IF NOT EXISTS idx_flt_vehicle_equipments_current_assignment_id ON flt_vehicle_equipments(current_assignment_id);

-- ============================================================================
-- SECTION 4: FOREIGN KEYS - INTERNES (au sein du module FLT)
-- ============================================================================

-- FK depuis flt_vehicle_inspections vers flt_vehicles
ALTER TABLE flt_vehicle_inspections
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_inspections_vehicle_id,
    ADD CONSTRAINT fk_flt_vehicle_inspections_vehicle_id
    FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id);

-- FK depuis flt_vehicle_equipments vers flt_vehicles
ALTER TABLE flt_vehicle_equipments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_equipments_vehicle_id,
    ADD CONSTRAINT fk_flt_vehicle_equipments_vehicle_id
    FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id);

-- FK depuis flt_vehicle_equipments vers flt_vehicle_assignments
ALTER TABLE flt_vehicle_equipments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_equipments_current_assignment_id,
    ADD CONSTRAINT fk_flt_vehicle_equipments_current_assignment_id
    FOREIGN KEY (current_assignment_id) REFERENCES flt_vehicle_assignments(id);

-- FK depuis flt_vehicle_assignments vers flt_vehicles
-- (déjà existante en V1, vérification)
ALTER TABLE flt_vehicle_assignments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_assignments_vehicle_id,
    ADD CONSTRAINT fk_flt_vehicle_assignments_vehicle_id
    FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id);

-- FK depuis flt_vehicle_events vers flt_vehicles
-- (déjà existante en V1, vérification)
ALTER TABLE flt_vehicle_events
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_events_vehicle_id,
    ADD CONSTRAINT fk_flt_vehicle_events_vehicle_id
    FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id);

-- FK depuis flt_vehicle_events vers flt_vehicle_assignments (NEW V2)
ALTER TABLE flt_vehicle_events
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_events_assignment_id,
    ADD CONSTRAINT fk_flt_vehicle_events_assignment_id
    FOREIGN KEY (assignment_id) REFERENCES flt_vehicle_assignments(id);

-- FK depuis flt_vehicle_maintenance vers flt_vehicles
-- (déjà existante en V1, vérification)
ALTER TABLE flt_vehicle_maintenance
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_maintenance_vehicle_id,
    ADD CONSTRAINT fk_flt_vehicle_maintenance_vehicle_id
    FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id);

-- FK depuis flt_vehicle_expenses vers flt_vehicles
-- (déjà existante en V1, vérification)
ALTER TABLE flt_vehicle_expenses
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_expenses_vehicle_id,
    ADD CONSTRAINT fk_flt_vehicle_expenses_vehicle_id
    FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id);

-- FK depuis flt_vehicle_insurances vers flt_vehicles
-- (déjà existante en V1, vérification)
ALTER TABLE flt_vehicle_insurances
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_insurances_vehicle_id,
    ADD CONSTRAINT fk_flt_vehicle_insurances_vehicle_id
    FOREIGN KEY (vehicle_id) REFERENCES flt_vehicles(id);

-- FK depuis flt_vehicle_insurances vers flt_vehicle_insurances (parent policy)
ALTER TABLE flt_vehicle_insurances
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_insurances_parent_policy_id,
    ADD CONSTRAINT fk_flt_vehicle_insurances_parent_policy_id
    FOREIGN KEY (parent_policy_id) REFERENCES flt_vehicle_insurances(id);

-- ============================================================================
-- SECTION 5: FOREIGN KEYS - EXTERNES (vers autres modules)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1: FK vers module ADM (Tenants et Employés)
-- ----------------------------------------------------------------------------

-- FK depuis dir_vehicle_statuses vers adm_provider_employees (audit)
ALTER TABLE dir_vehicle_statuses
    DROP CONSTRAINT IF EXISTS fk_dir_vehicle_statuses_created_by,
    ADD CONSTRAINT fk_dir_vehicle_statuses_created_by
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id);

ALTER TABLE dir_vehicle_statuses
    DROP CONSTRAINT IF EXISTS fk_dir_vehicle_statuses_updated_by,
    ADD CONSTRAINT fk_dir_vehicle_statuses_updated_by
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id);

ALTER TABLE dir_vehicle_statuses
    DROP CONSTRAINT IF EXISTS fk_dir_vehicle_statuses_deleted_by,
    ADD CONSTRAINT fk_dir_vehicle_statuses_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id);

-- FK depuis dir_ownership_types vers adm_provider_employees (audit)
ALTER TABLE dir_ownership_types
    DROP CONSTRAINT IF EXISTS fk_dir_ownership_types_created_by,
    ADD CONSTRAINT fk_dir_ownership_types_created_by
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id);

ALTER TABLE dir_ownership_types
    DROP CONSTRAINT IF EXISTS fk_dir_ownership_types_updated_by,
    ADD CONSTRAINT fk_dir_ownership_types_updated_by
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id);

ALTER TABLE dir_ownership_types
    DROP CONSTRAINT IF EXISTS fk_dir_ownership_types_deleted_by,
    ADD CONSTRAINT fk_dir_ownership_types_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id);

-- FK depuis flt_vehicles vers adm_tenants
ALTER TABLE flt_vehicles
    DROP CONSTRAINT IF EXISTS fk_flt_vehicles_tenant_id,
    ADD CONSTRAINT fk_flt_vehicles_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

-- FK depuis flt_vehicles vers adm_provider_employees (audit)
ALTER TABLE flt_vehicles
    DROP CONSTRAINT IF EXISTS fk_flt_vehicles_created_by,
    ADD CONSTRAINT fk_flt_vehicles_created_by
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicles
    DROP CONSTRAINT IF EXISTS fk_flt_vehicles_updated_by,
    ADD CONSTRAINT fk_flt_vehicles_updated_by
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicles
    DROP CONSTRAINT IF EXISTS fk_flt_vehicles_deleted_by,
    ADD CONSTRAINT fk_flt_vehicles_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id);

-- FK depuis flt_vehicle_inspections vers adm_tenants
ALTER TABLE flt_vehicle_inspections
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_inspections_tenant_id,
    ADD CONSTRAINT fk_flt_vehicle_inspections_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

-- FK depuis flt_vehicle_inspections vers adm_provider_employees (audit)
ALTER TABLE flt_vehicle_inspections
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_inspections_created_by,
    ADD CONSTRAINT fk_flt_vehicle_inspections_created_by
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_inspections
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_inspections_updated_by,
    ADD CONSTRAINT fk_flt_vehicle_inspections_updated_by
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id);

-- FK depuis flt_vehicle_equipments vers adm_tenants
ALTER TABLE flt_vehicle_equipments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_equipments_tenant_id,
    ADD CONSTRAINT fk_flt_vehicle_equipments_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

-- FK depuis flt_vehicle_equipments vers adm_provider_employees (audit)
ALTER TABLE flt_vehicle_equipments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_equipments_created_by,
    ADD CONSTRAINT fk_flt_vehicle_equipments_created_by
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_equipments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_equipments_updated_by,
    ADD CONSTRAINT fk_flt_vehicle_equipments_updated_by
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_equipments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_equipments_deleted_by,
    ADD CONSTRAINT fk_flt_vehicle_equipments_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id);

-- FK depuis flt_vehicle_assignments vers adm_tenants
ALTER TABLE flt_vehicle_assignments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_assignments_tenant_id,
    ADD CONSTRAINT fk_flt_vehicle_assignments_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

-- FK depuis flt_vehicle_assignments vers adm_provider_employees (audit)
ALTER TABLE flt_vehicle_assignments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_assignments_created_by,
    ADD CONSTRAINT fk_flt_vehicle_assignments_created_by
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_assignments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_assignments_updated_by,
    ADD CONSTRAINT fk_flt_vehicle_assignments_updated_by
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_assignments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_assignments_deleted_by,
    ADD CONSTRAINT fk_flt_vehicle_assignments_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id);

-- FK depuis flt_vehicle_events vers adm_tenants
ALTER TABLE flt_vehicle_events
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_events_tenant_id,
    ADD CONSTRAINT fk_flt_vehicle_events_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

-- FK depuis flt_vehicle_events vers adm_provider_employees (audit)
ALTER TABLE flt_vehicle_events
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_events_created_by,
    ADD CONSTRAINT fk_flt_vehicle_events_created_by
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_events
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_events_updated_by,
    ADD CONSTRAINT fk_flt_vehicle_events_updated_by
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_events
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_events_deleted_by,
    ADD CONSTRAINT fk_flt_vehicle_events_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id);

-- FK depuis flt_vehicle_maintenance vers adm_tenants
ALTER TABLE flt_vehicle_maintenance
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_maintenance_tenant_id,
    ADD CONSTRAINT fk_flt_vehicle_maintenance_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

-- FK depuis flt_vehicle_maintenance vers adm_provider_employees (audit + workflow)
ALTER TABLE flt_vehicle_maintenance
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_maintenance_requested_by,
    ADD CONSTRAINT fk_flt_vehicle_maintenance_requested_by
    FOREIGN KEY (requested_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_maintenance
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_maintenance_approved_by,
    ADD CONSTRAINT fk_flt_vehicle_maintenance_approved_by
    FOREIGN KEY (approved_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_maintenance
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_maintenance_quality_check_by,
    ADD CONSTRAINT fk_flt_vehicle_maintenance_quality_check_by
    FOREIGN KEY (quality_check_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_maintenance
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_maintenance_created_by,
    ADD CONSTRAINT fk_flt_vehicle_maintenance_created_by
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_maintenance
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_maintenance_updated_by,
    ADD CONSTRAINT fk_flt_vehicle_maintenance_updated_by
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_maintenance
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_maintenance_deleted_by,
    ADD CONSTRAINT fk_flt_vehicle_maintenance_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id);

-- FK depuis flt_vehicle_expenses vers adm_tenants
ALTER TABLE flt_vehicle_expenses
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_expenses_tenant_id,
    ADD CONSTRAINT fk_flt_vehicle_expenses_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

-- FK depuis flt_vehicle_expenses vers adm_provider_employees (audit + validation)
ALTER TABLE flt_vehicle_expenses
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_expenses_approved_by,
    ADD CONSTRAINT fk_flt_vehicle_expenses_approved_by
    FOREIGN KEY (approved_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_expenses
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_expenses_receipt_verified_by,
    ADD CONSTRAINT fk_flt_vehicle_expenses_receipt_verified_by
    FOREIGN KEY (receipt_verified_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_expenses
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_expenses_created_by,
    ADD CONSTRAINT fk_flt_vehicle_expenses_created_by
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_expenses
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_expenses_updated_by,
    ADD CONSTRAINT fk_flt_vehicle_expenses_updated_by
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_expenses
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_expenses_deleted_by,
    ADD CONSTRAINT fk_flt_vehicle_expenses_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id);

-- FK depuis flt_vehicle_insurances vers adm_tenants
ALTER TABLE flt_vehicle_insurances
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_insurances_tenant_id,
    ADD CONSTRAINT fk_flt_vehicle_insurances_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON DELETE CASCADE;

-- FK depuis flt_vehicle_insurances vers adm_provider_employees (audit)
ALTER TABLE flt_vehicle_insurances
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_insurances_created_by,
    ADD CONSTRAINT fk_flt_vehicle_insurances_created_by
    FOREIGN KEY (created_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_insurances
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_insurances_updated_by,
    ADD CONSTRAINT fk_flt_vehicle_insurances_updated_by
    FOREIGN KEY (updated_by) REFERENCES adm_provider_employees(id);

ALTER TABLE flt_vehicle_insurances
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_insurances_deleted_by,
    ADD CONSTRAINT fk_flt_vehicle_insurances_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES adm_provider_employees(id);

-- ----------------------------------------------------------------------------
-- 5.2: FK vers module DIR (Car Makes/Models, Countries, Vehicle Classes)
-- ----------------------------------------------------------------------------

-- FK depuis flt_vehicles vers dir_car_makes
ALTER TABLE flt_vehicles
    DROP CONSTRAINT IF EXISTS fk_flt_vehicles_make_id,
    ADD CONSTRAINT fk_flt_vehicles_make_id
    FOREIGN KEY (make_id) REFERENCES dir_car_makes(id);

-- FK depuis flt_vehicles vers dir_car_models
ALTER TABLE flt_vehicles
    DROP CONSTRAINT IF EXISTS fk_flt_vehicles_model_id,
    ADD CONSTRAINT fk_flt_vehicles_model_id
    FOREIGN KEY (model_id) REFERENCES dir_car_models(id);

-- FK depuis flt_vehicles vers dir_vehicle_classes (NEW V2)
ALTER TABLE flt_vehicles
    DROP CONSTRAINT IF EXISTS fk_flt_vehicles_vehicle_class_id,
    ADD CONSTRAINT fk_flt_vehicles_vehicle_class_id
    FOREIGN KEY (vehicle_class_id) REFERENCES dir_vehicle_classes(id);

-- FK depuis flt_vehicles vers dir_country_regulations (NEW V2)
ALTER TABLE flt_vehicles
    DROP CONSTRAINT IF EXISTS fk_flt_vehicles_country_code,
    ADD CONSTRAINT fk_flt_vehicles_country_code
    FOREIGN KEY (country_code) REFERENCES dir_country_regulations(country_code);

-- FK depuis flt_vehicles vers dir_vehicle_statuses (NEW V2)
ALTER TABLE flt_vehicles
    DROP CONSTRAINT IF EXISTS fk_flt_vehicles_status_id,
    ADD CONSTRAINT fk_flt_vehicles_status_id
    FOREIGN KEY (status_id) REFERENCES dir_vehicle_statuses(id);

-- FK depuis flt_vehicles vers dir_ownership_types (NEW V2)
ALTER TABLE flt_vehicles
    DROP CONSTRAINT IF EXISTS fk_flt_vehicles_ownership_type_id,
    ADD CONSTRAINT fk_flt_vehicles_ownership_type_id
    FOREIGN KEY (ownership_type_id) REFERENCES dir_ownership_types(id);

-- ----------------------------------------------------------------------------
-- 5.3: FK vers module RID (Drivers) - NEW V2
-- ----------------------------------------------------------------------------

-- FK depuis flt_vehicle_assignments vers rid_drivers
ALTER TABLE flt_vehicle_assignments
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_assignments_driver_id,
    ADD CONSTRAINT fk_flt_vehicle_assignments_driver_id
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id);

-- FK depuis flt_vehicle_events vers rid_drivers (NEW V2)
ALTER TABLE flt_vehicle_events
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_events_driver_id,
    ADD CONSTRAINT fk_flt_vehicle_events_driver_id
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id);

-- FK depuis flt_vehicle_expenses vers rid_drivers
ALTER TABLE flt_vehicle_expenses
    DROP CONSTRAINT IF EXISTS fk_flt_vehicle_expenses_driver_id,
    ADD CONSTRAINT fk_flt_vehicle_expenses_driver_id
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id);

-- ============================================================================
-- SECTION 6: FOREIGN KEYS - FUTURES (résolution + documentation pour futurs modules)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1: RÉSOLUTION des FK RETOUR depuis module RID (Session 7)
-- ----------------------------------------------------------------------------
-- Référence: 08_rid_structure.sql lignes 1246-1249
-- Ces FK ont été documentées dans RID et sont maintenant créées côté FLT

-- FK déjà résolues en Section 5.3:
-- ✅ rid_drivers → flt_vehicle_assignments.driver_id (résolu)
-- ✅ rid_drivers → flt_vehicle_expenses.driver_id (résolu)

-- ----------------------------------------------------------------------------
-- 6.2: DOCUMENTATION des FK FUTURES vers modules futurs
-- ----------------------------------------------------------------------------

-- FK FUTURES VERS MODULE SCH (Session 9: Scheduling)
-- flt_vehicle_maintenance.blocked_periods sera utilisé par sch_scheduling
-- pour bloquer les créneaux de disponibilité pendant les maintenances

-- FK FUTURES VERS MODULE TRP (Session 12: Transport/Rides)
-- flt_vehicle_events.ride_id → trp_rides.id
-- flt_vehicle_expenses.ride_id → trp_rides.id
-- Ces FK seront créées lors de la Session 12 (TRP)

-- FK FUTURES VERS MODULE INV (Session future: Investors/Owners)
-- flt_vehicles.owner_id → inv_investors.id
-- Cette FK sera créée lors de la Session INV si module créé

-- ============================================================================
-- SECTION 7: INDEXES - Documentation pour optimisation (Session 15)
-- ============================================================================
-- Note: Indexes déjà créés inline avec les tables
-- Cette section documente les indexes additionnels pour Session 15

-- INDEXES MULTI-COLONNES recommandés pour performance:

-- flt_vehicles
-- CREATE INDEX idx_flt_vehicles_tenant_status ON flt_vehicles(tenant_id, status_id) WHERE deleted_at IS NULL;
-- CREATE INDEX idx_flt_vehicles_make_model_year ON flt_vehicles(make_id, model_id, year);
-- CREATE INDEX idx_flt_vehicles_country_ownership ON flt_vehicles(country_code, ownership_type_id);

-- flt_vehicle_assignments
-- CREATE INDEX idx_flt_vehicle_assignments_driver_active ON flt_vehicle_assignments(driver_id, status) WHERE status = 'active';
-- CREATE INDEX idx_flt_vehicle_assignments_vehicle_period ON flt_vehicle_assignments(vehicle_id, start_date, end_date);

-- flt_vehicle_events
-- CREATE INDEX idx_flt_vehicle_events_type_date ON flt_vehicle_events(event_type, event_date);
-- CREATE INDEX idx_flt_vehicle_events_responsibility ON flt_vehicle_events(responsible_party, severity);

-- flt_vehicle_maintenance
-- CREATE INDEX idx_flt_vehicle_maintenance_scheduled_status ON flt_vehicle_maintenance(scheduled_date, status);
-- CREATE INDEX idx_flt_vehicle_maintenance_category_priority ON flt_vehicle_maintenance(maintenance_category, priority);

-- flt_vehicle_expenses
-- CREATE INDEX idx_flt_vehicle_expenses_approval ON flt_vehicle_expenses(approval_status, expense_date);
-- CREATE INDEX idx_flt_vehicle_expenses_payment ON flt_vehicle_expenses(payment_status, payment_date);

-- flt_vehicle_insurances
-- CREATE INDEX idx_flt_vehicle_insurances_active_expiry ON flt_vehicle_insurances(status, end_date) WHERE status = 'active';
-- CREATE INDEX idx_flt_vehicle_insurances_category_priority ON flt_vehicle_insurances(policy_category, policy_priority);

-- ============================================================================
-- SECTION 8: GATEWAY 2 - Validation et notifications
-- ============================================================================

DO $$
DECLARE
    v_enum_count INT;
    v_table_count INT;
    v_flt_vehicles_cols INT;
    v_flt_vehicle_assignments_cols INT;
    v_flt_vehicle_events_cols INT;
    v_flt_vehicle_maintenance_cols INT;
    v_flt_vehicle_expenses_cols INT;
    v_flt_vehicle_insurances_cols INT;
    v_dir_vehicle_statuses_cols INT;
    v_dir_ownership_types_cols INT;
    v_flt_vehicle_inspections_cols INT;
    v_flt_vehicle_equipments_cols INT;
    v_fk_count INT;
    v_idx_count INT;
BEGIN
    -- ========================================================================
    -- 8.1: COMPTAGE DES ENUMS (attendu: 40 nouveaux)
    -- ========================================================================
    SELECT COUNT(*) INTO v_enum_count
    FROM pg_type
    WHERE typname IN (
        'assignment_type', 'assignment_status', 'handover_type',
        'vehicle_event_type', 'responsible_party', 'event_severity', 'claim_status', 'repair_status',
        'maintenance_type', 'maintenance_category', 'maintenance_priority', 'maintenance_status',
        'expense_category', 'approval_status', 'receipt_status', 'allocation_rule', 'payment_status',
        'policy_category', 'coverage_drivers', 'vehicle_usage', 'insurance_status', 'payment_frequency', 'payment_method',
        'inspection_type', 'inspection_status',
        'equipment_type', 'equipment_status', 'equipment_condition',
        'risk_rating', 'body_type', 'fuel_type', 'transmission_type'
    );

    RAISE NOTICE '✓ ENUMS: % enums FLT créés (attendu: 32)', v_enum_count;

    -- ========================================================================
    -- 8.2: COMPTAGE DES TABLES (attendu: 10 tables FLT)
    -- ========================================================================
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'dir_vehicle_statuses', 'dir_ownership_types',
        'flt_vehicles', 'flt_vehicle_inspections', 'flt_vehicle_equipments',
        'flt_vehicle_assignments', 'flt_vehicle_events',
        'flt_vehicle_maintenance', 'flt_vehicle_expenses', 'flt_vehicle_insurances'
    );

    RAISE NOTICE '✓ TABLES: % tables FLT (attendu: 10)', v_table_count;

    -- ========================================================================
    -- 8.3: COMPTAGE DES COLONNES PAR TABLE
    -- ========================================================================

    -- dir_vehicle_statuses (attendu: ~25 colonnes)
    SELECT COUNT(*) INTO v_dir_vehicle_statuses_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dir_vehicle_statuses';
    RAISE NOTICE '✓ dir_vehicle_statuses: % colonnes (attendu: ~25)', v_dir_vehicle_statuses_cols;

    -- dir_ownership_types (attendu: ~20 colonnes)
    SELECT COUNT(*) INTO v_dir_ownership_types_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dir_ownership_types';
    RAISE NOTICE '✓ dir_ownership_types: % colonnes (attendu: ~20)', v_dir_ownership_types_cols;

    -- flt_vehicles (attendu: 49 colonnes)
    SELECT COUNT(*) INTO v_flt_vehicles_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicles';
    RAISE NOTICE '✓ flt_vehicles: % colonnes (attendu: 49)', v_flt_vehicles_cols;

    -- flt_vehicle_inspections (attendu: ~30 colonnes)
    SELECT COUNT(*) INTO v_flt_vehicle_inspections_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicle_inspections';
    RAISE NOTICE '✓ flt_vehicle_inspections: % colonnes (attendu: ~30)', v_flt_vehicle_inspections_cols;

    -- flt_vehicle_equipments (attendu: ~35 colonnes)
    SELECT COUNT(*) INTO v_flt_vehicle_equipments_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicle_equipments';
    RAISE NOTICE '✓ flt_vehicle_equipments: % colonnes (attendu: ~35)', v_flt_vehicle_equipments_cols;

    -- flt_vehicle_assignments (attendu: 37 colonnes)
    SELECT COUNT(*) INTO v_flt_vehicle_assignments_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicle_assignments';
    RAISE NOTICE '✓ flt_vehicle_assignments: % colonnes (attendu: 37)', v_flt_vehicle_assignments_cols;

    -- flt_vehicle_events (attendu: 37 colonnes)
    SELECT COUNT(*) INTO v_flt_vehicle_events_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicle_events';
    RAISE NOTICE '✓ flt_vehicle_events: % colonnes (attendu: 37)', v_flt_vehicle_events_cols;

    -- flt_vehicle_maintenance (attendu: 48 colonnes)
    SELECT COUNT(*) INTO v_flt_vehicle_maintenance_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicle_maintenance';
    RAISE NOTICE '✓ flt_vehicle_maintenance: % colonnes (attendu: 48)', v_flt_vehicle_maintenance_cols;

    -- flt_vehicle_expenses (attendu: 55 colonnes)
    SELECT COUNT(*) INTO v_flt_vehicle_expenses_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicle_expenses';
    RAISE NOTICE '✓ flt_vehicle_expenses: % colonnes (attendu: 55)', v_flt_vehicle_expenses_cols;

    -- flt_vehicle_insurances (attendu: 65 colonnes)
    SELECT COUNT(*) INTO v_flt_vehicle_insurances_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flt_vehicle_insurances';
    RAISE NOTICE '✓ flt_vehicle_insurances: % colonnes (attendu: 65)', v_flt_vehicle_insurances_cols;

    -- ========================================================================
    -- 8.4: COMPTAGE DES FOREIGN KEYS
    -- ========================================================================
    SELECT COUNT(*) INTO v_fk_count
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND constraint_type = 'FOREIGN KEY'
    AND table_name LIKE 'flt_%' OR table_name LIKE 'dir_vehicle_%' OR table_name LIKE 'dir_ownership_%';

    RAISE NOTICE '✓ FOREIGN KEYS: % FK créées pour module FLT', v_fk_count;

    -- ========================================================================
    -- 8.5: COMPTAGE DES INDEXES
    -- ========================================================================
    SELECT COUNT(*) INTO v_idx_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND (tablename LIKE 'flt_%' OR tablename LIKE 'dir_vehicle_%' OR tablename LIKE 'dir_ownership_%');

    RAISE NOTICE '✓ INDEXES: % indexes créés pour module FLT', v_idx_count;

    -- ========================================================================
    -- 8.6: RÉSUMÉ FINAL
    -- ========================================================================
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'MIGRATION FLT (Session 8/13) - RÉSUMÉ';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Enums créés:         % / 32', v_enum_count;
    RAISE NOTICE 'Tables:              % / 10', v_table_count;
    RAISE NOTICE 'Foreign Keys:        %', v_fk_count;
    RAISE NOTICE 'Indexes:             %', v_idx_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Tables détails:';
    RAISE NOTICE '  - dir_vehicle_statuses:      % colonnes', v_dir_vehicle_statuses_cols;
    RAISE NOTICE '  - dir_ownership_types:       % colonnes', v_dir_ownership_types_cols;
    RAISE NOTICE '  - flt_vehicles:              % colonnes', v_flt_vehicles_cols;
    RAISE NOTICE '  - flt_vehicle_inspections:   % colonnes', v_flt_vehicle_inspections_cols;
    RAISE NOTICE '  - flt_vehicle_equipments:    % colonnes', v_flt_vehicle_equipments_cols;
    RAISE NOTICE '  - flt_vehicle_assignments:   % colonnes', v_flt_vehicle_assignments_cols;
    RAISE NOTICE '  - flt_vehicle_events:        % colonnes', v_flt_vehicle_events_cols;
    RAISE NOTICE '  - flt_vehicle_maintenance:   % colonnes', v_flt_vehicle_maintenance_cols;
    RAISE NOTICE '  - flt_vehicle_expenses:      % colonnes', v_flt_vehicle_expenses_cols;
    RAISE NOTICE '  - flt_vehicle_insurances:    % colonnes', v_flt_vehicle_insurances_cols;
    RAISE NOTICE '';
    RAISE NOTICE 'FK FUTURES documentées:';
    RAISE NOTICE '  → SCH: flt_vehicle_maintenance.blocked_periods';
    RAISE NOTICE '  → TRP: flt_vehicle_events.ride_id, flt_vehicle_expenses.ride_id';
    RAISE NOTICE '  → INV: flt_vehicles.owner_id';
    RAISE NOTICE '';
    RAISE NOTICE 'ÉTAPES SUIVANTES:';
    RAISE NOTICE '  Session 14: Migration données V1 → V2 (10 tables)';
    RAISE NOTICE '  Session 15: Création indexes de performance';
    RAISE NOTICE '  Session 16: DROP colonnes V1 + RENAME _v2';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
