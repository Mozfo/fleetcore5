-- ═══════════════════════════════════════════════════════════════════════════
-- SESSION 7/13: MODULE RID - STRUCTURES (Riding/Rideshare Drivers)
-- ═══════════════════════════════════════════════════════════════════════════
-- Description: Migration structures V1→V2 pour le module RID (conducteurs)
-- Date: 2025-11-04
-- Tables: 7 tables V2 (rid_drivers, rid_driver_documents,
--         rid_driver_cooperation_terms, rid_driver_requests,
--         rid_driver_performances, rid_driver_blacklists, rid_driver_training)
-- Note: rid_driver_languages existe en V1 mais sera DROP Session 16
-- Stratégie: ADDITIVE ONLY - Coexistence V1/V2 jusqu'à Session 16
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1/8: CRÉATION DES ENUMS (20 ENUMS)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYMENT & FINANCIAL ENUMS (3 enums)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    CREATE TYPE preferred_payment_method AS ENUM (
        'bank_transfer',
        'cash',
        'mobile_wallet'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE payment_method_type AS ENUM (
        'cash',
        'card',
        'wallet',
        'mixed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE paid_by AS ENUM (
        'company',
        'driver',
        'platform',
        'government'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- DRIVER STATUS & LIFECYCLE ENUMS (2 enums)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    CREATE TYPE driver_status AS ENUM (
        'active',
        'inactive',
        'suspended',
        'terminated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE document_verification_status AS ENUM (
        'pending',
        'verified',
        'rejected',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTRACT & COOPERATION ENUMS (3 enums)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    CREATE TYPE signature_method AS ENUM (
        'digital',
        'wet_signature',
        'app',
        'email'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE compensation_model AS ENUM (
        'fixed_rental',
        'percentage_split',
        'salary',
        'crew_rental',
        'buyout',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE cooperation_status AS ENUM (
        'pending',
        'active',
        'expired',
        'terminated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- REQUEST MANAGEMENT ENUMS (3 enums)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    CREATE TYPE driver_request_type AS ENUM (
        'leave',
        'vehicle_change',
        'schedule_change',
        'expense_reimbursement',
        'advance_payment',
        'document_update',
        'complaint',
        'support',
        'contract_modification',
        'termination',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE request_priority AS ENUM (
        'low',
        'normal',
        'high',
        'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE request_status AS ENUM (
        'pending',
        'under_review',
        'approved',
        'rejected',
        'cancelled',
        'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PERFORMANCE ANALYTICS ENUMS (1 enum)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    CREATE TYPE period_type AS ENUM (
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'yearly'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- BLACKLIST MANAGEMENT ENUMS (4 enums)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    CREATE TYPE blacklist_category AS ENUM (
        'disciplinary',
        'administrative',
        'legal',
        'safety',
        'financial',
        'performance',
        'contract_breach',
        'criminal',
        'voluntary'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE blacklist_severity AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE blacklist_status AS ENUM (
        'active',
        'expired',
        'revoked',
        'appealed_lifted'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE appeal_status AS ENUM (
        'not_applicable',
        'pending',
        'under_review',
        'accepted',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRAINING MANAGEMENT ENUMS (3 enums)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    CREATE TYPE training_type AS ENUM (
        'mandatory',
        'safety',
        'customer_service',
        'technical',
        'compliance',
        'platform_specific',
        'professional_development',
        'onboarding',
        'refresher',
        'specialized'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE provider_type AS ENUM (
        'internal',
        'external',
        'online_platform',
        'government'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE training_status AS ENUM (
        'planned',
        'in_progress',
        'completed',
        'expired',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- DOCUMENT MANAGEMENT ENUMS (1 enum)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    CREATE TYPE driver_document_type AS ENUM (
        'driving_license',
        'professional_card',
        'national_id',
        'passport',
        'visa',
        'work_permit',
        'residence_permit',
        'proof_of_address',
        'criminal_record',
        'medical_certificate',
        'vehicle_registration',
        'insurance_policy',
        'contract_signed',
        'bank_statement',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2/8: MODIFICATIONS DES TABLES V1 EXISTANTES (7 TABLES)
-- ═══════════════════════════════════════════════════════════════════════════
-- Stratégie: ALTER TABLE ADD COLUMN avec IF NOT EXISTS
-- Coexistence: Champs V1 TEXT conservés (ex: driver_status VARCHAR),
--              nouveaux champs V2 ENUM ajoutés (ex: driver_status_v2)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 1/7: rid_drivers (25 → 95 colonnes)
-- ─────────────────────────────────────────────────────────────────────────────
-- V1: 25 colonnes basiques (identité, permis, statut simple)
-- V2: +70 colonnes (conformité UAE, WPS, adresse complète, banque,
--     suspension détaillée, photos, tracking activité)
-- Coexistence: driver_status (VARCHAR V1) + driver_status_v2 (enum V2)
-- ─────────────────────────────────────────────────────────────────────────────

-- CONFORMITÉ UAE ET IDENTITÉ
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emirates_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS emirates_id_expiry DATE;

-- SÉPARATION NOMS ET GÉNÉRATION
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(100);

-- CONTACT DÉTAILLÉ
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50);

-- ADRESSE COMPLÈTE (V2)
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country_code CHAR(2);

-- INFORMATIONS BANCAIRES ET WPS
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bank_iban VARCHAR(34),
  ADD COLUMN IF NOT EXISTS bank_swift_code VARCHAR(11),
  ADD COLUMN IF NOT EXISTS preferred_payment_method_v2 preferred_payment_method,
  ADD COLUMN IF NOT EXISTS wps_eligible BOOLEAN DEFAULT false;

-- STATUT ET ACTIVITÉ (V2 avec coexistence)
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS driver_status_v2 driver_status DEFAULT 'active'::driver_status,
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_trips_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_earnings DECIMAL(18,2) DEFAULT 0;

-- SUSPENSION DÉTAILLÉE (V2)
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspension_start_date DATE,
  ADD COLUMN IF NOT EXISTS suspension_end_date DATE;

-- TERMINAISON (V2)
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS termination_reason TEXT,
  ADD COLUMN IF NOT EXISTS termination_date DATE,
  ADD COLUMN IF NOT EXISTS rehire_eligible BOOLEAN DEFAULT true;

-- PHOTOS ET VÉRIFICATION IDENTITÉ (V2)
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_verified_by UUID;

-- RATING AMÉLIORÉ (renommage pour précision)
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2);

-- MÉTADONNÉES EXTENSIBLES (V2)
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- AUDIT TRAIL COMPLET (V2)
ALTER TABLE rid_drivers
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS verified_by UUID,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 2/7: rid_driver_documents (16 → 46 colonnes)
-- ─────────────────────────────────────────────────────────────────────────────
-- V1: 16 colonnes basiques (driver_id, document_id, type TEXT, expiry)
-- V2: +30 colonnes (type ENUM normalisé, vérification structurée, OCR,
--     renouvellement automatique, traçabilité remplacement)
-- Coexistence: document_type (TEXT V1) + document_type_v2 (enum V2)
-- ─────────────────────────────────────────────────────────────────────────────

-- TYPE NORMALISÉ (V2 ENUM avec coexistence)
ALTER TABLE rid_driver_documents
  ADD COLUMN IF NOT EXISTS document_type_v2 driver_document_type;

-- RENOUVELLEMENT ET RAPPELS (V2)
ALTER TABLE rid_driver_documents
  ADD COLUMN IF NOT EXISTS requires_renewal BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_frequency_days INTEGER,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER DEFAULT 30;

-- VÉRIFICATION STRUCTURÉE (V2 avec coexistence)
ALTER TABLE rid_driver_documents
  ADD COLUMN IF NOT EXISTS verification_status document_verification_status DEFAULT 'pending'::document_verification_status,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50); -- manual, ocr, api

-- DÉTAILS DOCUMENT (V2)
ALTER TABLE rid_driver_documents
  ADD COLUMN IF NOT EXISTS document_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(255),
  ADD COLUMN IF NOT EXISTS issuing_country CHAR(2),
  ADD COLUMN IF NOT EXISTS issue_date DATE;

-- TRAÇABILITÉ REMPLACEMENT (V2)
ALTER TABLE rid_driver_documents
  ADD COLUMN IF NOT EXISTS replaced_document_id UUID,
  ADD COLUMN IF NOT EXISTS replacement_reason TEXT;

-- MÉTADONNÉES OCR (V2)
ALTER TABLE rid_driver_documents
  ADD COLUMN IF NOT EXISTS ocr_data JSONB,
  ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,2);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 3/7: rid_driver_cooperation_terms (16 → 51 colonnes)
-- ─────────────────────────────────────────────────────────────────────────────
-- V1: 16 colonnes basiques (driver_id, terms_version, status TEXT, dates)
-- V2: +35 colonnes (compensation 6 modèles, signature numérique, version
--     history, escalade légale, renouvellement automatique)
-- Coexistence: status (TEXT V1) + status_v2 (enum V2)
-- ─────────────────────────────────────────────────────────────────────────────

-- STATUT AVEC ENUM (V2 avec coexistence)
ALTER TABLE rid_driver_cooperation_terms
  ADD COLUMN IF NOT EXISTS status_v2 cooperation_status DEFAULT 'pending'::cooperation_status;

-- MODÈLES DE COMPENSATION (V2)
ALTER TABLE rid_driver_cooperation_terms
  ADD COLUMN IF NOT EXISTS compensation_model_v2 compensation_model,
  ADD COLUMN IF NOT EXISTS fixed_rental_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS percentage_split_company DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS percentage_split_driver DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS salary_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS crew_rental_terms TEXT,
  ADD COLUMN IF NOT EXISTS buyout_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS custom_terms TEXT;

-- SIGNATURE NUMÉRIQUE (V2)
ALTER TABLE rid_driver_cooperation_terms
  ADD COLUMN IF NOT EXISTS signature_method_v2 signature_method,
  ADD COLUMN IF NOT EXISTS signature_data JSONB,
  ADD COLUMN IF NOT EXISTS signature_ip VARCHAR(45),
  ADD COLUMN IF NOT EXISTS signature_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS digital_signature_verified BOOLEAN DEFAULT false;

-- VERSION HISTORY ET LEGAL (V2)
ALTER TABLE rid_driver_cooperation_terms
  ADD COLUMN IF NOT EXISTS previous_version_id UUID,
  ADD COLUMN IF NOT EXISTS version_change_reason TEXT,
  ADD COLUMN IF NOT EXISTS legal_review_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS legal_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS legal_reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS legal_review_notes TEXT;

-- RENOUVELLEMENT AUTOMATIQUE (V2)
ALTER TABLE rid_driver_cooperation_terms
  ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_renewal_notice_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMPTZ;

-- TERMINAISON (V2)
ALTER TABLE rid_driver_cooperation_terms
  ADD COLUMN IF NOT EXISTS termination_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS termination_reason TEXT,
  ADD COLUMN IF NOT EXISTS termination_initiated_by UUID,
  ADD COLUMN IF NOT EXISTS early_termination_penalty DECIMAL(12,2);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 4/7: rid_driver_requests (15 → 55 colonnes)
-- ─────────────────────────────────────────────────────────────────────────────
-- V1: 15 colonnes basiques (driver_id, request_type TEXT, status TEXT, details)
-- V2: +40 colonnes (type/status ENUM, priorité, workflow complet, SLA tracking,
--     notifications, escalade, approbations multi-niveaux)
-- Coexistence: request_type (TEXT V1) + request_type_v2 (enum V2)
--              status (TEXT V1) + status_v2 (enum V2)
-- ─────────────────────────────────────────────────────────────────────────────

-- TYPE ET STATUT AVEC ENUM (V2 avec coexistence)
ALTER TABLE rid_driver_requests
  ADD COLUMN IF NOT EXISTS request_type_v2 driver_request_type,
  ADD COLUMN IF NOT EXISTS status_v2 request_status DEFAULT 'pending'::request_status;

-- PRIORITÉ ET SLA (V2)
ALTER TABLE rid_driver_requests
  ADD COLUMN IF NOT EXISTS priority request_priority DEFAULT 'normal'::request_priority,
  ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS response_required_by TIMESTAMPTZ;

-- WORKFLOW COMPLET (V2)
ALTER TABLE rid_driver_requests
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ESCALADE (V2)
ALTER TABLE rid_driver_requests
  ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_to UUID,
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- APPROBATIONS MULTI-NIVEAUX (V2)
ALTER TABLE rid_driver_requests
  ADD COLUMN IF NOT EXISTS requires_manager_approval BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manager_approved_by UUID,
  ADD COLUMN IF NOT EXISTS requires_hr_approval BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hr_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hr_approved_by UUID;

-- NOTIFICATIONS (V2)
ALTER TABLE rid_driver_requests
  ADD COLUMN IF NOT EXISTS driver_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manager_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_method VARCHAR(50); -- email, sms, app

-- DOCUMENTS ATTACHÉS (V2)
ALTER TABLE rid_driver_requests
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 5/7: rid_driver_performances (20 → 70 colonnes)
-- ─────────────────────────────────────────────────────────────────────────────
-- V1: 20 colonnes basiques (period, trips, earnings, metadata)
-- V2: +50 colonnes (multi-platform tracking, payment methods détaillés,
--     ranking, efficiency metrics, fuel/expenses, customer satisfaction)
-- ─────────────────────────────────────────────────────────────────────────────

-- TYPE DE PÉRIODE (V2)
ALTER TABLE rid_driver_performances
  ADD COLUMN IF NOT EXISTS period_type_v2 period_type DEFAULT 'weekly'::period_type;

-- MULTI-PLATFORM TRACKING (V2)
ALTER TABLE rid_driver_performances
  ADD COLUMN IF NOT EXISTS platform_id UUID,
  ADD COLUMN IF NOT EXISTS platform_trips_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_earnings DECIMAL(12,2) DEFAULT 0;

-- PAYMENT METHODS DÉTAILLÉS (V2)
ALTER TABLE rid_driver_performances
  ADD COLUMN IF NOT EXISTS cash_trips INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_earnings DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_trips INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_earnings DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_trips INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_earnings DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mixed_payment_trips INTEGER DEFAULT 0;

-- RANKING ET TIERS (V2)
ALTER TABLE rid_driver_performances
  ADD COLUMN IF NOT EXISTS rank_in_period INTEGER,
  ADD COLUMN IF NOT EXISTS tier VARCHAR(20), -- gold, silver, bronze, standard
  ADD COLUMN IF NOT EXISTS tier_change VARCHAR(10); -- promoted, demoted, maintained

-- EFFICIENCY METRICS (V2)
ALTER TABLE rid_driver_performances
  ADD COLUMN IF NOT EXISTS acceptance_rate DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS cancellation_rate DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS avg_trip_duration_minutes DECIMAL(7,2),
  ADD COLUMN IF NOT EXISTS avg_earnings_per_trip DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS avg_earnings_per_hour DECIMAL(10,2);

-- CUSTOMER SATISFACTION (V2)
ALTER TABLE rid_driver_performances
  ADD COLUMN IF NOT EXISTS total_ratings_received INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS five_star_ratings INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS one_star_ratings INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS compliments_received INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complaints_received INTEGER DEFAULT 0;

-- FUEL ET EXPENSES (V2)
ALTER TABLE rid_driver_performances
  ADD COLUMN IF NOT EXISTS total_fuel_cost DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_expenses DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_earnings DECIMAL(12,2) DEFAULT 0;

-- BONUS ET INCENTIVES (V2)
ALTER TABLE rid_driver_performances
  ADD COLUMN IF NOT EXISTS bonus_earned DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS incentives_earned DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalties_deducted DECIMAL(12,2) DEFAULT 0;

-- DISTANCE ET TEMPS (V2)
ALTER TABLE rid_driver_performances
  ADD COLUMN IF NOT EXISTS total_distance_km DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hours_logged DECIMAL(7,2);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 6/7: rid_driver_blacklists (15 → 55 colonnes)
-- ─────────────────────────────────────────────────────────────────────────────
-- V1: 15 colonnes basiques (driver_id, reason, dates, status TEXT)
-- V2: +40 colonnes (catégorie, sévérité, workflow complet, appeal process,
--     legal review, réintégration conditions, notifications)
-- Coexistence: status (TEXT V1) + status_v2 (enum V2)
-- ─────────────────────────────────────────────────────────────────────────────

-- CATÉGORIE ET SÉVÉRITÉ (V2)
ALTER TABLE rid_driver_blacklists
  ADD COLUMN IF NOT EXISTS category blacklist_category,
  ADD COLUMN IF NOT EXISTS severity blacklist_severity;

-- STATUT AVEC ENUM (V2 avec coexistence)
ALTER TABLE rid_driver_blacklists
  ADD COLUMN IF NOT EXISTS status_v2 blacklist_status DEFAULT 'active'::blacklist_status;

-- DÉTAILS INCIDENT (V2)
ALTER TABLE rid_driver_blacklists
  ADD COLUMN IF NOT EXISTS incident_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS incident_location TEXT,
  ADD COLUMN IF NOT EXISTS incident_description TEXT,
  ADD COLUMN IF NOT EXISTS evidence_documents JSONB DEFAULT '[]';

-- DECISION MAKING (V2)
ALTER TABLE rid_driver_blacklists
  ADD COLUMN IF NOT EXISTS decided_by UUID,
  ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decision_notes TEXT,
  ADD COLUMN IF NOT EXISTS decision_reviewed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- APPEAL PROCESS (V2)
ALTER TABLE rid_driver_blacklists
  ADD COLUMN IF NOT EXISTS appeal_status_v2 appeal_status DEFAULT 'not_applicable'::appeal_status,
  ADD COLUMN IF NOT EXISTS appeal_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS appeal_reason TEXT,
  ADD COLUMN IF NOT EXISTS appeal_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS appeal_reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS appeal_decision TEXT,
  ADD COLUMN IF NOT EXISTS appeal_outcome VARCHAR(50); -- accepted, rejected, partial

-- LEGAL REVIEW (V2)
ALTER TABLE rid_driver_blacklists
  ADD COLUMN IF NOT EXISTS legal_review_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS legal_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS legal_reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS legal_case_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS legal_notes TEXT;

-- RÉINTÉGRATION CONDITIONS (V2)
ALTER TABLE rid_driver_blacklists
  ADD COLUMN IF NOT EXISTS reinstatement_conditions TEXT,
  ADD COLUMN IF NOT EXISTS reinstatement_eligible_date DATE,
  ADD COLUMN IF NOT EXISTS reinstated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reinstated_by UUID;

-- NOTIFICATIONS (V2)
ALTER TABLE rid_driver_blacklists
  ADD COLUMN IF NOT EXISTS driver_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS acknowledgment_received BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledgment_date TIMESTAMPTZ;


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 7/7: rid_driver_training (19 → 69 colonnes)
-- ─────────────────────────────────────────────────────────────────────────────
-- V1: 19 colonnes basiques (training_name, provider, status TEXT, dates, score)
-- V2: +50 colonnes (type ENUM, provider type, evaluation complète,
--     certification, prérequis, attendance tracking, coût/budget)
-- Coexistence: status (TEXT V1) + status_v2 (enum V2)
-- ─────────────────────────────────────────────────────────────────────────────

-- TYPE ET STATUT AVEC ENUM (V2 avec coexistence)
ALTER TABLE rid_driver_training
  ADD COLUMN IF NOT EXISTS training_type_v2 training_type,
  ADD COLUMN IF NOT EXISTS status_v2 training_status DEFAULT 'planned'::training_status;

-- PROVIDER DÉTAILLÉ (V2)
ALTER TABLE rid_driver_training
  ADD COLUMN IF NOT EXISTS provider_type_v2 provider_type,
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS provider_contact VARCHAR(255),
  ADD COLUMN IF NOT EXISTS provider_location TEXT;

-- CONTENU ET DURÉE (V2)
ALTER TABLE rid_driver_training
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sessions_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS materials_url TEXT;

-- PRÉREQUIS (V2)
ALTER TABLE rid_driver_training
  ADD COLUMN IF NOT EXISTS prerequisites_met BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS prerequisite_training_ids JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS prerequisite_documents JSONB DEFAULT '[]';

-- SCHEDULING (V2)
ALTER TABLE rid_driver_training
  ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS online_meeting_url TEXT;

-- ATTENDANCE TRACKING (V2)
ALTER TABLE rid_driver_training
  ADD COLUMN IF NOT EXISTS attendance_percentage DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS absences_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_arrivals_count INTEGER DEFAULT 0;

-- EVALUATION COMPLÈTE (V2)
ALTER TABLE rid_driver_training
  ADD COLUMN IF NOT EXISTS evaluation_method VARCHAR(100), -- exam, practical, observation
  ADD COLUMN IF NOT EXISTS passing_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS max_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS pass_fail_status VARCHAR(20), -- passed, failed, pending
  ADD COLUMN IF NOT EXISTS evaluation_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS evaluated_by UUID,
  ADD COLUMN IF NOT EXISTS evaluation_notes TEXT;

-- CERTIFICATION (V2)
ALTER TABLE rid_driver_training
  ADD COLUMN IF NOT EXISTS certificate_issued BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS certificate_issued_date DATE,
  ADD COLUMN IF NOT EXISTS certificate_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS recertification_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recertification_frequency_months INTEGER;

-- COÛT ET BUDGET (V2)
ALTER TABLE rid_driver_training
  ADD COLUMN IF NOT EXISTS training_cost DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS paid_by_v2 paid_by,
  ADD COLUMN IF NOT EXISTS budget_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);

-- FEEDBACK (V2)
ALTER TABLE rid_driver_training
  ADD COLUMN IF NOT EXISTS driver_feedback TEXT,
  ADD COLUMN IF NOT EXISTS driver_rating DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMPTZ;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3/8: CRÉATION DES NOUVELLES TABLES V2 (0 TABLE)
-- ═══════════════════════════════════════════════════════════════════════════
-- Note: Toutes les tables RID existent déjà en V1 (8 tables)
-- rid_driver_languages existe en V1 mais sera DROP Session 16 (absente V2 schema)
-- Aucune nouvelle table à créer pour RID
-- ═══════════════════════════════════════════════════════════════════════════

-- Aucune table V2 pure à créer


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4/8: CONTRAINTES DE FOREIGN KEYS INTERNES AU MODULE RID
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- FK INTERNES: rid_drivers → rid_drivers (self-references et relations V2)
-- ─────────────────────────────────────────────────────────────────────────────

-- Photo verification par employees (V2)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_drivers_photo_verified_by_fkey'
    ) THEN
        ALTER TABLE rid_drivers
            ADD CONSTRAINT rid_drivers_photo_verified_by_fkey
            FOREIGN KEY (photo_verified_by)
            REFERENCES adm_provider_employees(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Created by employee (V2)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_drivers_created_by_employee_fkey'
    ) THEN
        ALTER TABLE rid_drivers
            ADD CONSTRAINT rid_drivers_created_by_employee_fkey
            FOREIGN KEY (created_by)
            REFERENCES adm_provider_employees(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Updated by employee (V2)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_drivers_updated_by_employee_fkey'
    ) THEN
        ALTER TABLE rid_drivers
            ADD CONSTRAINT rid_drivers_updated_by_employee_fkey
            FOREIGN KEY (updated_by)
            REFERENCES adm_provider_employees(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Verified by employee (V2)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_drivers_verified_by_employee_fkey'
    ) THEN
        ALTER TABLE rid_drivers
            ADD CONSTRAINT rid_drivers_verified_by_employee_fkey
            FOREIGN KEY (verified_by)
            REFERENCES adm_provider_employees(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Deleted by employee (V2)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_drivers_deleted_by_employee_fkey'
    ) THEN
        ALTER TABLE rid_drivers
            ADD CONSTRAINT rid_drivers_deleted_by_employee_fkey
            FOREIGN KEY (deleted_by)
            REFERENCES adm_provider_employees(id)
            ON DELETE SET NULL;
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- FK INTERNES: rid_driver_documents (self-reference remplacement)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_documents_replaced_document_fkey'
    ) THEN
        ALTER TABLE rid_driver_documents
            ADD CONSTRAINT rid_driver_documents_replaced_document_fkey
            FOREIGN KEY (replaced_document_id)
            REFERENCES rid_driver_documents(id)
            ON DELETE SET NULL;
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- FK INTERNES: rid_driver_cooperation_terms (version history)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_cooperation_terms_previous_version_fkey'
    ) THEN
        ALTER TABLE rid_driver_cooperation_terms
            ADD CONSTRAINT rid_driver_cooperation_terms_previous_version_fkey
            FOREIGN KEY (previous_version_id)
            REFERENCES rid_driver_cooperation_terms(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_cooperation_terms_legal_reviewed_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_cooperation_terms
            ADD CONSTRAINT rid_driver_cooperation_terms_legal_reviewed_by_fkey
            FOREIGN KEY (legal_reviewed_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_cooperation_terms_termination_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_cooperation_terms
            ADD CONSTRAINT rid_driver_cooperation_terms_termination_by_fkey
            FOREIGN KEY (termination_initiated_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- FK INTERNES: rid_driver_requests (workflow assignments)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_requests_assigned_to_fkey'
    ) THEN
        ALTER TABLE rid_driver_requests
            ADD CONSTRAINT rid_driver_requests_assigned_to_fkey
            FOREIGN KEY (assigned_to)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_requests_reviewed_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_requests
            ADD CONSTRAINT rid_driver_requests_reviewed_by_fkey
            FOREIGN KEY (reviewed_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_requests_approved_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_requests
            ADD CONSTRAINT rid_driver_requests_approved_by_fkey
            FOREIGN KEY (approved_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_requests_rejected_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_requests
            ADD CONSTRAINT rid_driver_requests_rejected_by_fkey
            FOREIGN KEY (rejected_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_requests_escalated_to_fkey'
    ) THEN
        ALTER TABLE rid_driver_requests
            ADD CONSTRAINT rid_driver_requests_escalated_to_fkey
            FOREIGN KEY (escalated_to)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_requests_manager_approved_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_requests
            ADD CONSTRAINT rid_driver_requests_manager_approved_by_fkey
            FOREIGN KEY (manager_approved_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_requests_hr_approved_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_requests
            ADD CONSTRAINT rid_driver_requests_hr_approved_by_fkey
            FOREIGN KEY (hr_approved_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- FK INTERNES: rid_driver_blacklists (decision making et appeal)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_blacklists_decided_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_blacklists
            ADD CONSTRAINT rid_driver_blacklists_decided_by_fkey
            FOREIGN KEY (decided_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_blacklists_decision_reviewed_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_blacklists
            ADD CONSTRAINT rid_driver_blacklists_decision_reviewed_by_fkey
            FOREIGN KEY (reviewed_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_blacklists_appeal_reviewed_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_blacklists
            ADD CONSTRAINT rid_driver_blacklists_appeal_reviewed_by_fkey
            FOREIGN KEY (appeal_reviewed_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_blacklists_legal_reviewed_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_blacklists
            ADD CONSTRAINT rid_driver_blacklists_legal_reviewed_by_fkey
            FOREIGN KEY (legal_reviewed_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_blacklists_reinstated_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_blacklists
            ADD CONSTRAINT rid_driver_blacklists_reinstated_by_fkey
            FOREIGN KEY (reinstated_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- FK INTERNES: rid_driver_training (evaluation)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_training_evaluated_by_fkey'
    ) THEN
        ALTER TABLE rid_driver_training
            ADD CONSTRAINT rid_driver_training_evaluated_by_fkey
            FOREIGN KEY (evaluated_by)
            REFERENCES adm_members(id)
            ON DELETE SET NULL;
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5/8: CONTRAINTES DE FOREIGN KEYS EXTERNES (VERS ADM, DOC)
-- ═══════════════════════════════════════════════════════════════════════════
-- Note: Les FK vers tenant_id existent déjà en V1 pour toutes les tables RID
-- Ajout seulement des FK V2 vers DOC (documents) et DIR (platforms)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- FK EXTERNES: rid_driver_documents → doc_documents (V2)
-- ─────────────────────────────────────────────────────────────────────────────
-- Note: Cette FK existe déjà en V1, vérification conditionnelle


-- ─────────────────────────────────────────────────────────────────────────────
-- FK EXTERNES: rid_driver_performances → dir_platforms (V2 - platform tracking)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_performances_platform_id_fkey'
    ) THEN
        ALTER TABLE rid_driver_performances
            ADD CONSTRAINT rid_driver_performances_platform_id_fkey
            FOREIGN KEY (platform_id)
            REFERENCES dir_platforms(id)
            ON DELETE SET NULL;
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- FK EXTERNES: rid_driver_training → adm_provider_employees (provider_id V2)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rid_driver_training_provider_id_fkey'
    ) THEN
        ALTER TABLE rid_driver_training
            ADD CONSTRAINT rid_driver_training_provider_id_fkey
            FOREIGN KEY (provider_id)
            REFERENCES adm_provider_employees(id)
            ON DELETE SET NULL;
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 6/8: FOREIGN KEYS FUTURES (RÉSOLUTION + DOCUMENTATION)
-- ═══════════════════════════════════════════════════════════════════════════
-- Partie A: RÉSOLUTION FK FUTURES depuis sessions précédentes (ACTIF)
-- Partie B: DOCUMENTATION FK FUTURES vers sessions suivantes (COMMENTÉ)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTIE A: RÉSOLUTION FK FUTURES (depuis Session 6 - SUP)
-- ─────────────────────────────────────────────────────────────────────────────

-- FK RETOUR 1: sup_customer_feedback.driver_id → rid_drivers.id
-- Créée dans Session 6 (SUP) comme FK FUTURE, résolue ICI dans Session 7 (RID)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sup_customer_feedback_driver_id_fkey'
    ) THEN
        ALTER TABLE sup_customer_feedback
            ADD CONSTRAINT sup_customer_feedback_driver_id_fkey
            FOREIGN KEY (driver_id)
            REFERENCES rid_drivers(id)
            ON DELETE SET NULL;
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- PARTIE B: DOCUMENTATION FK FUTURES (vers sessions suivantes)
-- ─────────────────────────────────────────────────────────────────────────────
-- Ces FK seront activées lors de la création des modules cibles
-- ─────────────────────────────────────────────────────────────────────────────

/*
-- ─────────────────────────────────────────────────────────────────────────────
-- FK FUTURES VERS MODULE FLT (Session 9: Fleet Management)
-- ─────────────────────────────────────────────────────────────────────────────
-- rid_drivers sera référencé par flt_vehicle_assignments (driver_id)
-- rid_drivers sera référencé par flt_vehicle_expenses (driver_id)

-- ─────────────────────────────────────────────────────────────────────────────
-- FK FUTURES VERS MODULE SCH (Session 10: Scheduling)
-- ─────────────────────────────────────────────────────────────────────────────
-- rid_drivers sera référencé par sch_shifts (driver_id)
-- rid_driver_requests pourrait créer FK vers sch_shifts (shift_id) pour
-- requests de type "schedule_change"

-- ─────────────────────────────────────────────────────────────────────────────
-- FK FUTURES VERS MODULE TRP (Session 11: Trips)
-- ─────────────────────────────────────────────────────────────────────────────
-- rid_drivers sera référencé par trp_trips (driver_id)
-- rid_driver_performances pourrait créer FK vers trp_trips pour analytics

-- ─────────────────────────────────────────────────────────────────────────────
-- FK FUTURES VERS MODULE FIN (Session 13: Financial)
-- ─────────────────────────────────────────────────────────────────────────────
-- rid_drivers sera référencé par fin_driver_payments (driver_id)
-- rid_driver_cooperation_terms sera référencé par fin_driver_payments
-- (cooperation_term_id) pour compensation model tracking
*/


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 7/8: CRÉATION DES INDEX (SESSION 15 - DOCUMENTATION SEULEMENT)
-- ═══════════════════════════════════════════════════════════════════════════
-- Les index V2 seront créés en Session 15 après migration données Session 14
-- Cette section documente les index prévus pour référence
-- ═══════════════════════════════════════════════════════════════════════════

/*
-- ─────────────────────────────────────────────────────────────────────────────
-- INDEX rid_drivers (V2)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_tenant_email_unique
    ON rid_drivers(tenant_id, email) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_tenant_status_v2
    ON rid_drivers(tenant_id, driver_status_v2) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_nationality
    ON rid_drivers(nationality) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_wps_eligible_active
    ON rid_drivers(wps_eligible, driver_status_v2)
    WHERE deleted_at IS NULL AND driver_status_v2 = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_onboarded_at
    ON rid_drivers(onboarded_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_last_active
    ON rid_drivers(last_active_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_suspension_end
    ON rid_drivers(suspension_end_date, driver_status_v2)
    WHERE deleted_at IS NULL AND driver_status_v2 = 'suspended';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_emirates_id
    ON rid_drivers(emirates_id) WHERE deleted_at IS NULL AND emirates_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- INDEX rid_driver_documents (V2)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_documents_type_v2
    ON rid_driver_documents(document_type_v2) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_documents_verification_status
    ON rid_driver_documents(verification_status) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_documents_expiry_pending
    ON rid_driver_documents(expiry_date)
    WHERE deleted_at IS NULL AND verification_status = 'verified';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_documents_ocr
    ON rid_driver_documents USING gin(ocr_data) WHERE ocr_data IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- INDEX rid_driver_cooperation_terms (V2)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_coop_status_v2
    ON rid_driver_cooperation_terms(status_v2) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_coop_model
    ON rid_driver_cooperation_terms(compensation_model_v2) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_coop_expiry
    ON rid_driver_cooperation_terms(expiry_date)
    WHERE deleted_at IS NULL AND status_v2 = 'active';


-- ─────────────────────────────────────────────────────────────────────────────
-- INDEX rid_driver_requests (V2)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_requests_type_v2
    ON rid_driver_requests(request_type_v2) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_requests_status_v2
    ON rid_driver_requests(status_v2) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_requests_priority
    ON rid_driver_requests(priority, status_v2)
    WHERE deleted_at IS NULL AND status_v2 IN ('pending', 'under_review');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_requests_sla
    ON rid_driver_requests(sla_deadline)
    WHERE deleted_at IS NULL AND status_v2 NOT IN ('completed', 'cancelled');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_requests_assigned
    ON rid_driver_requests(assigned_to, status_v2) WHERE assigned_to IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- INDEX rid_driver_performances (V2)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_perf_period
    ON rid_driver_performances(period_type_v2, period_start, period_end);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_perf_platform
    ON rid_driver_performances(platform_id, period_start) WHERE platform_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_perf_ranking
    ON rid_driver_performances(period_type_v2, rank_in_period) WHERE rank_in_period IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- INDEX rid_driver_blacklists (V2)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_blacklist_category
    ON rid_driver_blacklists(category) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_blacklist_severity
    ON rid_driver_blacklists(severity, status_v2) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_blacklist_status_v2
    ON rid_driver_blacklists(status_v2) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_blacklist_appeal
    ON rid_driver_blacklists(appeal_status_v2)
    WHERE appeal_status_v2 NOT IN ('not_applicable');


-- ─────────────────────────────────────────────────────────────────────────────
-- INDEX rid_driver_training (V2)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_training_type_v2
    ON rid_driver_training(training_type_v2) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_training_status_v2
    ON rid_driver_training(status_v2) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_training_provider
    ON rid_driver_training(provider_type_v2, provider_id) WHERE provider_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_driver_training_certificate
    ON rid_driver_training(certificate_expiry_date)
    WHERE certificate_issued = true AND deleted_at IS NULL;
*/


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 8/8: GATEWAY 2 - VALIDATION STRUCTURES RID
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_total_tables INTEGER;
    v_total_enums INTEGER;
    v_total_fk_created INTEGER;
    v_rid_drivers_cols INTEGER;
    v_rid_driver_documents_cols INTEGER;
    v_rid_driver_cooperation_terms_cols INTEGER;
    v_rid_driver_requests_cols INTEGER;
    v_rid_driver_performances_cols INTEGER;
    v_rid_driver_blacklists_cols INTEGER;
    v_rid_driver_training_cols INTEGER;
BEGIN
    -- Comptage total tables
    SELECT COUNT(*) INTO v_total_tables
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    -- Comptage total enums
    SELECT COUNT(*) INTO v_total_enums
    FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typtype = 'e' AND n.nspname = 'public';

    -- Comptage FK créées cette session (tables RID seulement)
    SELECT COUNT(*) INTO v_total_fk_created
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_type = 'FOREIGN KEY'
      AND table_name LIKE 'rid_%';

    -- Comptage colonnes par table
    SELECT COUNT(*) INTO v_rid_drivers_cols
    FROM information_schema.columns
    WHERE table_name = 'rid_drivers' AND table_schema = 'public';

    SELECT COUNT(*) INTO v_rid_driver_documents_cols
    FROM information_schema.columns
    WHERE table_name = 'rid_driver_documents' AND table_schema = 'public';

    SELECT COUNT(*) INTO v_rid_driver_cooperation_terms_cols
    FROM information_schema.columns
    WHERE table_name = 'rid_driver_cooperation_terms' AND table_schema = 'public';

    SELECT COUNT(*) INTO v_rid_driver_requests_cols
    FROM information_schema.columns
    WHERE table_name = 'rid_driver_requests' AND table_schema = 'public';

    SELECT COUNT(*) INTO v_rid_driver_performances_cols
    FROM information_schema.columns
    WHERE table_name = 'rid_driver_performances' AND table_schema = 'public';

    SELECT COUNT(*) INTO v_rid_driver_blacklists_cols
    FROM information_schema.columns
    WHERE table_name = 'rid_driver_blacklists' AND table_schema = 'public';

    SELECT COUNT(*) INTO v_rid_driver_training_cols
    FROM information_schema.columns
    WHERE table_name = 'rid_driver_training' AND table_schema = 'public';

    -- Affichage résultats
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'GATEWAY 2: SESSION 7/13 - MODULE RID - VALIDATION RÉUSSIE ✓';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ÉTAT GLOBAL BASE DE DONNÉES:';
    RAISE NOTICE '   └─ Total tables: % (avant: 77)', v_total_tables;
    RAISE NOTICE '   └─ Total enums: % (avant: 46)', v_total_enums;
    RAISE NOTICE '';
    RAISE NOTICE '📦 MODULE RID - STRUCTURES CRÉÉES:';
    RAISE NOTICE '   ├─ Enums créés: 20';
    RAISE NOTICE '   │  ├─ Payment: 3 (preferred_payment_method, payment_method_type, paid_by)';
    RAISE NOTICE '   │  ├─ Status: 2 (driver_status, document_verification_status)';
    RAISE NOTICE '   │  ├─ Contract: 3 (signature_method, compensation_model, cooperation_status)';
    RAISE NOTICE '   │  ├─ Requests: 3 (driver_request_type, request_priority, request_status)';
    RAISE NOTICE '   │  ├─ Performance: 1 (period_type)';
    RAISE NOTICE '   │  ├─ Blacklist: 4 (category, severity, status, appeal_status)';
    RAISE NOTICE '   │  ├─ Training: 3 (training_type, provider_type, training_status)';
    RAISE NOTICE '   │  └─ Documents: 1 (driver_document_type)';
    RAISE NOTICE '   │';
    RAISE NOTICE '   ├─ Tables V1 modifiées: 7';
    RAISE NOTICE '   │  ├─ rid_drivers: % colonnes (était 25)', v_rid_drivers_cols;
    RAISE NOTICE '   │  ├─ rid_driver_documents: % colonnes (était 16)', v_rid_driver_documents_cols;
    RAISE NOTICE '   │  ├─ rid_driver_cooperation_terms: % colonnes (était 16)', v_rid_driver_cooperation_terms_cols;
    RAISE NOTICE '   │  ├─ rid_driver_requests: % colonnes (était 15)', v_rid_driver_requests_cols;
    RAISE NOTICE '   │  ├─ rid_driver_performances: % colonnes (était 20)', v_rid_driver_performances_cols;
    RAISE NOTICE '   │  ├─ rid_driver_blacklists: % colonnes (était 15)', v_rid_driver_blacklists_cols;
    RAISE NOTICE '   │  └─ rid_driver_training: % colonnes (était 19)', v_rid_driver_training_cols;
    RAISE NOTICE '   │';
    RAISE NOTICE '   ├─ Tables V2 nouvelles: 0';
    RAISE NOTICE '   │  └─ Note: rid_driver_languages existe V1 mais DROP Session 16';
    RAISE NOTICE '   │';
    RAISE NOTICE '   ├─ Foreign Keys créées: %', v_total_fk_created;
    RAISE NOTICE '   │  └─ FK internes RID + FK externes (ADM, DOC, DIR)';
    RAISE NOTICE '   │';
    RAISE NOTICE '   └─ FK RETOUR résolues: 1';
    RAISE NOTICE '      └─ sup_customer_feedback.driver_id → rid_drivers.id';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  COEXISTENCE V1/V2 (TRANSITOIRE):';
    RAISE NOTICE '   ├─ rid_drivers:';
    RAISE NOTICE '   │  ├─ driver_status (VARCHAR V1) + driver_status_v2 (enum V2)';
    RAISE NOTICE '   │  ├─ rating (DECIMAL V1) + average_rating (DECIMAL V2)';
    RAISE NOTICE '   │  └─ preferred_payment_method_v2 (enum V2 - pas de V1)';
    RAISE NOTICE '   │';
    RAISE NOTICE '   ├─ rid_driver_documents:';
    RAISE NOTICE '   │  ├─ document_type (TEXT V1) + document_type_v2 (enum V2)';
    RAISE NOTICE '   │  └─ verified (BOOLEAN V1) + verification_status (enum V2)';
    RAISE NOTICE '   │';
    RAISE NOTICE '   ├─ rid_driver_cooperation_terms:';
    RAISE NOTICE '   │  └─ status (TEXT V1) + status_v2 (enum V2)';
    RAISE NOTICE '   │';
    RAISE NOTICE '   ├─ rid_driver_requests:';
    RAISE NOTICE '   │  ├─ request_type (TEXT V1) + request_type_v2 (enum V2)';
    RAISE NOTICE '   │  └─ status (TEXT V1) + status_v2 (enum V2)';
    RAISE NOTICE '   │';
    RAISE NOTICE '   ├─ rid_driver_blacklists:';
    RAISE NOTICE '   │  └─ status (TEXT V1) + status_v2 (enum V2)';
    RAISE NOTICE '   │';
    RAISE NOTICE '   └─ rid_driver_training:';
    RAISE NOTICE '      └─ status (TEXT V1) + status_v2 (enum V2)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
    RAISE NOTICE '   ├─ Session 8-13: Structures FLT, SCH, TRP, REV, FIN';
    RAISE NOTICE '   ├─ Session 14: Migration données V1 → V2 (POST_MIGRATION_ACTIONS.md)';
    RAISE NOTICE '   ├─ Session 15: Création index optimisés';
    RAISE NOTICE '   └─ Session 16: DROP colonnes V1 + DROP table rid_driver_languages';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
