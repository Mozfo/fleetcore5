-- ============================================================================
-- FLEETCORE V1 → V2 MIGRATION
-- SESSION 10: MODULE SCH (Scheduling)
-- ============================================================================
-- Description: Planning shifts, maintenance préventive, objectifs KPI, workflow tâches
-- Enums: 18 nouveaux
-- Tables: 12 tables (4 MODIFY V1 + 8 NEW V2)
-- Relations: ADM (tenant), RID (drivers), FLT (vehicles, maintenance)
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUMS - Types énumérés Scheduling (18 enums)
-- ============================================================================

-- ENUM 1/18: shift_type - Types de shifts avec prime
DO $$ BEGIN
    CREATE TYPE shift_type AS ENUM (
        'day',
        'night',
        'weekend',
        'peak_hour',
        'special_event'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 2/18: shift_status - Statut shift
DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM (
        'scheduled',
        'completed',
        'cancelled',
        'no_show',
        'partial'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 3/18: maintenance_priority - Priorité maintenance
DO $$ BEGIN
    CREATE TYPE maintenance_priority AS ENUM (
        'low',
        'normal',
        'high',
        'urgent',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 4/18: maintenance_trigger_type - Déclencheur maintenance
DO $$ BEGIN
    CREATE TYPE maintenance_trigger_type AS ENUM (
        'mileage_based',
        'time_based',
        'condition_based',
        'manual'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 5/18: maintenance_status - Statut maintenance schedulée
DO $$ BEGIN
    CREATE TYPE maintenance_status AS ENUM (
        'scheduled',
        'completed',
        'cancelled',
        'overdue',
        'in_progress',
        'rescheduled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 6/18: maintenance_category - Catégorie maintenance
DO $$ BEGIN
    CREATE TYPE maintenance_category AS ENUM (
        'preventive',
        'corrective',
        'regulatory'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 7/18: goal_category - Catégorie objectif KPI
DO $$ BEGIN
    CREATE TYPE goal_category AS ENUM (
        'revenue',
        'trips',
        'quality',
        'efficiency',
        'safety'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 8/18: goal_target_type - Type cible objectif
DO $$ BEGIN
    CREATE TYPE goal_target_type AS ENUM (
        'individual',
        'team',
        'branch',
        'company'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 9/18: goal_period_type - Période objectif
DO $$ BEGIN
    CREATE TYPE goal_period_type AS ENUM (
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'yearly'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 10/18: goal_reward_type - Type récompense
DO $$ BEGIN
    CREATE TYPE goal_reward_type AS ENUM (
        'bonus',
        'certificate',
        'badge',
        'promotion'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 11/18: goal_status - Statut objectif
DO $$ BEGIN
    CREATE TYPE goal_status AS ENUM (
        'active',
        'in_progress',
        'completed',
        'cancelled',
        'expired',
        'on_track',
        'at_risk',
        'achieved',
        'exceeded'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 12/18: goal_threshold - Paliers achievement
DO $$ BEGIN
    CREATE TYPE goal_threshold AS ENUM (
        'bronze',
        'silver',
        'gold',
        'exceeded'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 13/18: task_category - Catégorie tâche
DO $$ BEGIN
    CREATE TYPE task_category AS ENUM (
        'admin',
        'maintenance',
        'document',
        'training',
        'support'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 14/18: task_priority - Priorité tâche
DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM (
        'low',
        'normal',
        'high',
        'urgent',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 15/18: task_status - Statut tâche
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'pending',
        'in_progress',
        'completed',
        'cancelled',
        'overdue',
        'blocked',
        'waiting_verification',
        'reopened'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 16/18: task_comment_type - Type commentaire tâche
DO $$ BEGIN
    CREATE TYPE task_comment_type AS ENUM (
        'note',
        'status_change',
        'escalation'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 17/18: task_change_type - Type changement audit
DO $$ BEGIN
    CREATE TYPE task_change_type AS ENUM (
        'created',
        'assigned',
        'status_changed',
        'escalated'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ENUM 18/18: aggregation_type - Type agrégation calcul KPI
DO $$ BEGIN
    CREATE TYPE aggregation_type AS ENUM (
        'sum',
        'avg',
        'count',
        'min',
        'max'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 2: ALTER TABLE - Extension tables V1 existantes (4 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE 1/4: sch_shifts (MODIFY)
-- V1 → V2 : 10 → 30 colonnes (20 nouvelles)
-- Description: Planning conducteurs avancé avec check-in/out temps réel
-- ----------------------------------------------------------------------------
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS shift_type_id UUID;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS shift_category VARCHAR(50);
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS zone_name VARCHAR(255);
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMPTZ;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMPTZ;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS break_duration_minutes INTEGER;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS actual_work_minutes INTEGER;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS pay_multiplier DECIMAL(4, 2);
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS status_v2 shift_status; -- ⚠️ CONFLIT avec status VARCHAR V1
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255);
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS replacement_driver_id UUID;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE sch_shifts ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ----------------------------------------------------------------------------
-- TABLE 2/4: sch_maintenance_schedules (MODIFY)
-- V1 → V2 : 12 → 36 colonnes (24 nouvelles)
-- Description: Maintenance préventive avec rappels automatiques
-- ----------------------------------------------------------------------------
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS maintenance_type_id UUID;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS scheduled_by UUID;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS priority_v2 maintenance_priority DEFAULT 'normal'::maintenance_priority; -- ⚠️ CONFLIT avec priority VARCHAR V1
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS estimated_duration_hours DECIMAL(5, 2);
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 2);
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS odometer_reading INTEGER;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS trigger_type maintenance_trigger_type;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS completed_maintenance_id UUID;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS rescheduled_from UUID;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS rescheduled_reason TEXT;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS blocking_operations BOOLEAN DEFAULT false;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS required_parts JSONB;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS assigned_garage VARCHAR(255);
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS garage_contact VARCHAR(255);
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS status_v2 maintenance_status DEFAULT 'scheduled'::maintenance_status; -- ⚠️ CONFLIT avec status VARCHAR V1
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE sch_maintenance_schedules ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ----------------------------------------------------------------------------
-- TABLE 3/4: sch_goals (MODIFY)
-- V1 → V2 : 10 → 41 colonnes (31 nouvelles)
-- Description: Objectifs KPI mesurables en temps réel avec gamification
-- ----------------------------------------------------------------------------
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS goal_type_id UUID;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS goal_category_v2 goal_category; -- ⚠️ CONFLIT potentiel avec category VARCHAR V1
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS target_type goal_target_type;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS target_entity_type VARCHAR(50);
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS target_entity_id UUID;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS period_type goal_period_type;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(100);
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS target_value DECIMAL(12, 2);
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS current_value DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS progress_percent DECIMAL(5, 2);
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS weight DECIMAL(5, 2) DEFAULT 1.0;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS reward_type goal_reward_type;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(10, 2);
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS threshold_bronze DECIMAL(12, 2);
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS threshold_silver DECIMAL(12, 2);
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS threshold_gold DECIMAL(12, 2);
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS achievement_date TIMESTAMPTZ;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS last_calculated_at TIMESTAMPTZ;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS notification_frequency_days INTEGER;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS status_v2 goal_status DEFAULT 'active'::goal_status; -- ⚠️ CONFLIT avec status VARCHAR V1
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE sch_goals ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ----------------------------------------------------------------------------
-- TABLE 4/4: sch_tasks (MODIFY)
-- V1 → V2 : 15 → 55 colonnes (40 nouvelles)
-- Description: Tâches assignées avec workflow validation et escalade
-- ----------------------------------------------------------------------------
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS task_type_id UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS task_category_v2 task_category; -- ⚠️ CONFLIT avec category VARCHAR V1
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS priority_v2 task_priority DEFAULT 'normal'::task_priority; -- ⚠️ CONFLIT avec priority VARCHAR V1
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS assigned_by UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS target_type VARCHAR(50);
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS target_id UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS related_entity_id UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS completed_by UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS verification_required BOOLEAN DEFAULT false;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS generation_trigger VARCHAR(100);
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(100);
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS blocking_tasks UUID[];
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS checklist JSONB;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS attachments JSONB;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS reminder_frequency_days INTEGER;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS escalated_to UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS status_v2 task_status DEFAULT 'pending'::task_status; -- ⚠️ CONFLIT avec status VARCHAR V1
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE sch_tasks ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- ============================================================================
-- SECTION 3: CREATE TABLE - Nouvelles tables V2 (8 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE 1/8: sch_shift_types (NEW)
-- Description: Types de shifts référentiel avec coefficients prime
-- Colonnes: 16 colonnes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_shift_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    code VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    pay_multiplier DECIMAL(4, 2) NOT NULL,
    color_code VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT
);

-- ----------------------------------------------------------------------------
-- TABLE 2/8: dir_maintenance_types (NEW - table partagée DIR/SCH)
-- Description: Types maintenances référentiel avec fréquence
-- Colonnes: 18 colonnes
-- Note: Préfixe dir_ mais créée dans SCH car nécessaire pour relations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dir_maintenance_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    code VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    category maintenance_category NOT NULL,
    default_frequency_km INTEGER,
    default_frequency_months INTEGER,
    estimated_duration_hours DECIMAL(5, 2),
    estimated_cost_range JSONB,
    is_mandatory BOOLEAN DEFAULT false,
    requires_vehicle_stoppage BOOLEAN DEFAULT true,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT
);

-- ----------------------------------------------------------------------------
-- TABLE 3/8: sch_goal_types (NEW)
-- Description: Types objectifs KPI référentiel avec calcul automatique
-- Colonnes: 19 colonnes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_goal_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    code VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    category goal_category NOT NULL,
    unit VARCHAR(50) NOT NULL,
    calculation_method TEXT,
    data_source_table VARCHAR(100),
    data_source_field VARCHAR(100),
    aggregation_type aggregation_type,
    is_higher_better BOOLEAN DEFAULT true,
    icon VARCHAR(50),
    color VARCHAR(20),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT
);

-- ----------------------------------------------------------------------------
-- TABLE 4/8: sch_task_types (NEW)
-- Description: Types tâches référentiel avec SLA et template checklist
-- Colonnes: 20 colonnes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_task_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    code VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    category task_category NOT NULL,
    default_priority task_priority,
    default_duration_minutes INTEGER,
    requires_verification BOOLEAN DEFAULT false,
    default_checklist JSONB,
    auto_assignment_rule JSONB,
    sla_hours INTEGER,
    escalation_hours INTEGER,
    description_template TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT
);

-- ----------------------------------------------------------------------------
-- TABLE 5/8: sch_locations (NEW)
-- Description: Zones géographiques pour optimisation dispatch
-- Colonnes: 16 colonnes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    polygon JSONB, -- GeoJSON polygon
    city VARCHAR(100),
    country VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT
);

-- ----------------------------------------------------------------------------
-- TABLE 6/8: sch_goal_achievements (NEW)
-- Description: Historique succès objectifs avec paliers et récompenses
-- Colonnes: 11 colonnes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_goal_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL,
    achievement_date TIMESTAMPTZ NOT NULL,
    final_value DECIMAL(12, 2) NOT NULL,
    threshold_reached goal_threshold,
    reward_granted BOOLEAN DEFAULT false,
    reward_amount DECIMAL(10, 2),
    certificate_url VARCHAR(500),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE 7/8: sch_task_comments (NEW)
-- Description: Commentaires tâches pour collaboration
-- Colonnes: 9 colonnes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    comment_type task_comment_type NOT NULL,
    author_id UUID NOT NULL,
    comment_text TEXT NOT NULL,
    attachments JSONB,
    is_internal BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- TABLE 8/8: sch_task_history (NEW)
-- Description: Audit trail complet changements tâches
-- Colonnes: 9 colonnes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    changed_by UUID NOT NULL,
    change_type task_change_type NOT NULL,
    old_values JSONB,
    new_values JSONB,
    change_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECTION 4: FOREIGN KEYS INTERNES - Relations au sein module SCH
-- ============================================================================

-- FK: sch_shifts → sch_shift_types
DO $$ BEGIN
    ALTER TABLE sch_shifts
    ADD CONSTRAINT fk_shifts_shift_type
    FOREIGN KEY (shift_type_id)
    REFERENCES sch_shift_types(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_shifts → sch_locations
DO $$ BEGIN
    ALTER TABLE sch_shifts
    ADD CONSTRAINT fk_shifts_location
    FOREIGN KEY (location_id)
    REFERENCES sch_locations(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_maintenance_schedules → dir_maintenance_types
DO $$ BEGIN
    ALTER TABLE sch_maintenance_schedules
    ADD CONSTRAINT fk_maintenance_schedules_maintenance_type
    FOREIGN KEY (maintenance_type_id)
    REFERENCES dir_maintenance_types(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK SELF-REFERENCE: sch_maintenance_schedules.rescheduled_from → sch_maintenance_schedules
DO $$ BEGIN
    ALTER TABLE sch_maintenance_schedules
    ADD CONSTRAINT fk_maintenance_schedules_rescheduled_from
    FOREIGN KEY (rescheduled_from)
    REFERENCES sch_maintenance_schedules(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_goals → sch_goal_types
DO $$ BEGIN
    ALTER TABLE sch_goals
    ADD CONSTRAINT fk_goals_goal_type
    FOREIGN KEY (goal_type_id)
    REFERENCES sch_goal_types(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_goal_achievements → sch_goals
DO $$ BEGIN
    ALTER TABLE sch_goal_achievements
    ADD CONSTRAINT fk_goal_achievements_goal
    FOREIGN KEY (goal_id)
    REFERENCES sch_goals(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_tasks → sch_task_types
DO $$ BEGIN
    ALTER TABLE sch_tasks
    ADD CONSTRAINT fk_tasks_task_type
    FOREIGN KEY (task_type_id)
    REFERENCES sch_task_types(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK SELF-REFERENCE: sch_tasks.parent_task_id → sch_tasks (hiérarchie)
DO $$ BEGIN
    ALTER TABLE sch_tasks
    ADD CONSTRAINT fk_tasks_parent_task
    FOREIGN KEY (parent_task_id)
    REFERENCES sch_tasks(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_task_comments → sch_tasks
DO $$ BEGIN
    ALTER TABLE sch_task_comments
    ADD CONSTRAINT fk_task_comments_task
    FOREIGN KEY (task_id)
    REFERENCES sch_tasks(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_task_history → sch_tasks
DO $$ BEGIN
    ALTER TABLE sch_task_history
    ADD CONSTRAINT fk_task_history_task
    FOREIGN KEY (task_id)
    REFERENCES sch_tasks(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 5: FOREIGN KEYS EXTERNES - Relations vers autres modules
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FK vers module ADM (tenant_id pour toutes les tables)
-- ----------------------------------------------------------------------------

-- FK: sch_shift_types → adm_tenants
DO $$ BEGIN
    ALTER TABLE sch_shift_types
    ADD CONSTRAINT fk_shift_types_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_shifts → adm_tenants
DO $$ BEGIN
    ALTER TABLE sch_shifts
    ADD CONSTRAINT fk_shifts_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: dir_maintenance_types → adm_tenants
DO $$ BEGIN
    ALTER TABLE dir_maintenance_types
    ADD CONSTRAINT fk_maintenance_types_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_maintenance_schedules → adm_tenants
DO $$ BEGIN
    ALTER TABLE sch_maintenance_schedules
    ADD CONSTRAINT fk_maintenance_schedules_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_goal_types → adm_tenants
DO $$ BEGIN
    ALTER TABLE sch_goal_types
    ADD CONSTRAINT fk_goal_types_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_goals → adm_tenants
DO $$ BEGIN
    ALTER TABLE sch_goals
    ADD CONSTRAINT fk_goals_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_task_types → adm_tenants
DO $$ BEGIN
    ALTER TABLE sch_task_types
    ADD CONSTRAINT fk_task_types_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_tasks → adm_tenants
DO $$ BEGIN
    ALTER TABLE sch_tasks
    ADD CONSTRAINT fk_tasks_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_locations → adm_tenants
DO $$ BEGIN
    ALTER TABLE sch_locations
    ADD CONSTRAINT fk_locations_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES adm_tenants(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- FK vers module RID (Rideshare Drivers)
-- ----------------------------------------------------------------------------

-- FK: sch_shifts.driver_id → rid_drivers
DO $$ BEGIN
    ALTER TABLE sch_shifts
    ADD CONSTRAINT fk_shifts_driver
    FOREIGN KEY (driver_id)
    REFERENCES rid_drivers(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_shifts.replacement_driver_id → rid_drivers
DO $$ BEGIN
    ALTER TABLE sch_shifts
    ADD CONSTRAINT fk_shifts_replacement_driver
    FOREIGN KEY (replacement_driver_id)
    REFERENCES rid_drivers(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- FK vers module FLT (Fleet Management)
-- ----------------------------------------------------------------------------

-- FK: sch_maintenance_schedules.vehicle_id → flt_vehicles
DO $$ BEGIN
    ALTER TABLE sch_maintenance_schedules
    ADD CONSTRAINT fk_maintenance_schedules_vehicle
    FOREIGN KEY (vehicle_id)
    REFERENCES flt_vehicles(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_maintenance_schedules.completed_maintenance_id → flt_vehicle_maintenance
DO $$ BEGIN
    ALTER TABLE sch_maintenance_schedules
    ADD CONSTRAINT fk_maintenance_schedules_completed_maintenance
    FOREIGN KEY (completed_maintenance_id)
    REFERENCES flt_vehicle_maintenance(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- FK vers module ADM (Users - created_by, updated_by, deleted_by)
-- Note: Relations vers adm_members et adm_provider_employees
-- ----------------------------------------------------------------------------

-- FK: sch_shifts → adm_members (approved_by)
DO $$ BEGIN
    ALTER TABLE sch_shifts
    ADD CONSTRAINT fk_shifts_approved_by
    FOREIGN KEY (approved_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_maintenance_schedules → adm_members (scheduled_by)
DO $$ BEGIN
    ALTER TABLE sch_maintenance_schedules
    ADD CONSTRAINT fk_maintenance_schedules_scheduled_by
    FOREIGN KEY (scheduled_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_tasks → adm_members (assigned_to, assigned_by, completed_by, verified_by, escalated_to)
DO $$ BEGIN
    ALTER TABLE sch_tasks
    ADD CONSTRAINT fk_tasks_assigned_to
    FOREIGN KEY (assigned_to)
    REFERENCES adm_members(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE sch_tasks
    ADD CONSTRAINT fk_tasks_assigned_by
    FOREIGN KEY (assigned_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE sch_tasks
    ADD CONSTRAINT fk_tasks_completed_by
    FOREIGN KEY (completed_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE sch_tasks
    ADD CONSTRAINT fk_tasks_verified_by
    FOREIGN KEY (verified_by)
    REFERENCES adm_members(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE sch_tasks
    ADD CONSTRAINT fk_tasks_escalated_to
    FOREIGN KEY (escalated_to)
    REFERENCES adm_members(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_task_comments → adm_members (author_id)
DO $$ BEGIN
    ALTER TABLE sch_task_comments
    ADD CONSTRAINT fk_task_comments_author
    FOREIGN KEY (author_id)
    REFERENCES adm_members(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- FK: sch_task_history → adm_members (changed_by)
DO $$ BEGIN
    ALTER TABLE sch_task_history
    ADD CONSTRAINT fk_task_history_changed_by
    FOREIGN KEY (changed_by)
    REFERENCES adm_members(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 6: FK FUTURES - Relations vers modules futurs (documentation)
-- ============================================================================

-- ⚠️ SCH N'A PAS DE FK VERS MODULES FUTURS
-- Le module SCH ne référence pas TRP, ACT, COM, ANL
-- Aucune FK future à créer

-- ============================================================================
-- SECTION 7: INDEXES - Documentation indexes UNIQUE avec soft delete
-- ============================================================================

-- ⚠️ INDEXES CRÉÉS EN SESSION 15 (Après migration données Session 14)
-- Raison: Prisma ne supporte pas WHERE deleted_at IS NULL dans @@unique

-- INDEX 1/8: sch_shift_types - unique (tenant_id, code) avec soft delete
-- Référence ligne: 225
-- CREATE UNIQUE INDEX idx_shift_types_tenant_code_unique
-- ON sch_shift_types(tenant_id, code)
-- WHERE deleted_at IS NULL;

-- INDEX 2/8: sch_shifts - unique (tenant_id, driver_id, start_time) avec soft delete
-- Référence ligne: 275
-- CREATE UNIQUE INDEX idx_shifts_tenant_driver_start_unique
-- ON sch_shifts(tenant_id, driver_id, start_time)
-- WHERE deleted_at IS NULL;

-- INDEX 3/8: dir_maintenance_types - unique (tenant_id, code) avec soft delete
-- Référence ligne: 318
-- CREATE UNIQUE INDEX idx_maintenance_types_tenant_code_unique
-- ON dir_maintenance_types(tenant_id, code)
-- WHERE deleted_at IS NULL;

-- INDEX 4/8: sch_maintenance_schedules - unique composite avec soft delete
-- Référence ligne: 372
-- CREATE UNIQUE INDEX idx_maintenance_schedules_unique
-- ON sch_maintenance_schedules(tenant_id, vehicle_id, scheduled_date, maintenance_type_id)
-- WHERE deleted_at IS NULL;

-- INDEX 5/8: sch_goal_types - unique (tenant_id, code) avec soft delete
-- Référence ligne: 415
-- CREATE UNIQUE INDEX idx_goal_types_tenant_code_unique
-- ON sch_goal_types(tenant_id, code)
-- WHERE deleted_at IS NULL;

-- INDEX 6/8: sch_goals - unique composite avec soft delete
-- Référence ligne: 470
-- CREATE UNIQUE INDEX idx_goals_unique
-- ON sch_goals(tenant_id, goal_type_id, period_start, target_entity_id)
-- WHERE deleted_at IS NULL;

-- INDEX 7/8: sch_task_types - unique (tenant_id, code) avec soft delete
-- Référence ligne: 540
-- CREATE UNIQUE INDEX idx_task_types_tenant_code_unique
-- ON sch_task_types(tenant_id, code)
-- WHERE deleted_at IS NULL;

-- INDEX 8/8: sch_locations - unique (tenant_id, code) avec soft delete
-- Référence ligne: 701
-- CREATE UNIQUE INDEX idx_locations_tenant_code_unique
-- ON sch_locations(tenant_id, code)
-- WHERE deleted_at IS NULL;

-- Indexes performances (créés automatiquement, pas de WHERE clause)
CREATE INDEX IF NOT EXISTS idx_shifts_driver_checkin ON sch_shifts(driver_id, check_in_at);
CREATE INDEX IF NOT EXISTS idx_shifts_shift_type_location ON sch_shifts(shift_type_id, location_id);
CREATE INDEX IF NOT EXISTS idx_shifts_checkin ON sch_shifts(check_in_at);
CREATE INDEX IF NOT EXISTS idx_shifts_checkout ON sch_shifts(check_out_at);
CREATE INDEX IF NOT EXISTS idx_shifts_status_deleted ON sch_shifts(status_v2, deleted_at);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_vehicle_date_status ON sch_maintenance_schedules(vehicle_id, scheduled_date, status_v2);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_trigger_priority ON sch_maintenance_schedules(trigger_type, priority_v2);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_reminder_sent ON sch_maintenance_schedules(reminder_sent_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_odometer ON sch_maintenance_schedules(odometer_reading);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_status_deleted ON sch_maintenance_schedules(status_v2, deleted_at);

CREATE INDEX IF NOT EXISTS idx_goals_target_entity_status ON sch_goals(target_entity_type, target_entity_id, status_v2);
CREATE INDEX IF NOT EXISTS idx_goals_progress_status ON sch_goals(progress_percent, status_v2);
CREATE INDEX IF NOT EXISTS idx_goals_achievement_date ON sch_goals(achievement_date);
CREATE INDEX IF NOT EXISTS idx_goals_status_deleted ON sch_goals(status_v2, deleted_at);

CREATE INDEX IF NOT EXISTS idx_goal_achievements_goal_date ON sch_goal_achievements(goal_id, achievement_date);
CREATE INDEX IF NOT EXISTS idx_goal_achievements_date ON sch_goal_achievements(achievement_date);
CREATE INDEX IF NOT EXISTS idx_goal_achievements_reward ON sch_goal_achievements(reward_granted);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status_due ON sch_tasks(assigned_to, status_v2, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category_priority ON sch_tasks(task_category_v2, priority_v2);
CREATE INDEX IF NOT EXISTS idx_tasks_auto_generated ON sch_tasks(is_auto_generated, generation_trigger);
CREATE INDEX IF NOT EXISTS idx_tasks_target ON sch_tasks(target_type, target_id, status_v2);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON sch_tasks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_tasks_status_deleted ON sch_tasks(status_v2, deleted_at);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_created ON sch_task_comments(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_task_comments_author ON sch_task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_type ON sch_task_comments(comment_type);

CREATE INDEX IF NOT EXISTS idx_task_history_task_created ON sch_task_history(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_by ON sch_task_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_task_history_change_type ON sch_task_history(change_type);

CREATE INDEX IF NOT EXISTS idx_shift_types_active_deleted ON sch_shift_types(is_active, deleted_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_types_category_mandatory ON dir_maintenance_types(category, is_mandatory);
CREATE INDEX IF NOT EXISTS idx_maintenance_types_deleted ON dir_maintenance_types(deleted_at);
CREATE INDEX IF NOT EXISTS idx_goal_types_category ON sch_goal_types(category);
CREATE INDEX IF NOT EXISTS idx_goal_types_deleted ON sch_goal_types(deleted_at);
CREATE INDEX IF NOT EXISTS idx_task_types_category_priority ON sch_task_types(category, default_priority);
CREATE INDEX IF NOT EXISTS idx_task_types_deleted ON sch_task_types(deleted_at);
CREATE INDEX IF NOT EXISTS idx_locations_active_deleted ON sch_locations(is_active, deleted_at);
CREATE INDEX IF NOT EXISTS idx_locations_city_country ON sch_locations(city, country);

-- ============================================================================
-- SECTION 8: GATEWAY 2 - Validation création structures
-- ============================================================================

DO $$
DECLARE
    v_enum_count INTEGER;
    v_table_count INTEGER;
    v_sch_shifts_cols INTEGER;
    v_sch_maintenance_schedules_cols INTEGER;
    v_sch_goals_cols INTEGER;
    v_sch_tasks_cols INTEGER;
    v_fk_count INTEGER;
    v_index_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'GATEWAY 2 - VALIDATION SESSION 10 (SCH)';
    RAISE NOTICE '========================================';

    -- Validation 1: Compter enums SCH
    SELECT COUNT(*) INTO v_enum_count
    FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typtype = 'e'
      AND t.typname IN (
        'shift_type', 'shift_status',
        'maintenance_priority', 'maintenance_trigger_type', 'maintenance_status', 'maintenance_category',
        'goal_category', 'goal_target_type', 'goal_period_type', 'goal_reward_type', 'goal_status', 'goal_threshold',
        'task_category', 'task_priority', 'task_status', 'task_comment_type', 'task_change_type',
        'aggregation_type'
      );

    RAISE NOTICE 'Enums SCH: % / 18 enums', v_enum_count;
    IF v_enum_count < 18 THEN
        RAISE WARNING 'ATTENTION: Seulement % enums créés sur 18 attendus', v_enum_count;
    END IF;

    -- Validation 2: Compter tables SCH
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'sch_shift_types', 'sch_shifts',
        'dir_maintenance_types', 'sch_maintenance_schedules',
        'sch_goal_types', 'sch_goals', 'sch_goal_achievements',
        'sch_task_types', 'sch_tasks', 'sch_task_comments', 'sch_task_history',
        'sch_locations'
      );

    RAISE NOTICE 'Tables SCH: % / 12 tables', v_table_count;
    IF v_table_count < 12 THEN
        RAISE WARNING 'ATTENTION: Seulement % tables créées sur 12 attendues', v_table_count;
    END IF;

    -- Validation 3: Vérifier colonnes tables modifiées
    SELECT COUNT(*) INTO v_sch_shifts_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sch_shifts';
    RAISE NOTICE 'sch_shifts: % colonnes (attendu: ~30)', v_sch_shifts_cols;

    SELECT COUNT(*) INTO v_sch_maintenance_schedules_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sch_maintenance_schedules';
    RAISE NOTICE 'sch_maintenance_schedules: % colonnes (attendu: ~36)', v_sch_maintenance_schedules_cols;

    SELECT COUNT(*) INTO v_sch_goals_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sch_goals';
    RAISE NOTICE 'sch_goals: % colonnes (attendu: ~41)', v_sch_goals_cols;

    SELECT COUNT(*) INTO v_sch_tasks_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sch_tasks';
    RAISE NOTICE 'sch_tasks: % colonnes (attendu: ~55)', v_sch_tasks_cols;

    -- Validation 4: Compter foreign keys SCH
    SELECT COUNT(*) INTO v_fk_count
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND constraint_type = 'FOREIGN KEY'
      AND table_name LIKE 'sch_%' OR table_name = 'dir_maintenance_types';

    RAISE NOTICE 'Foreign Keys SCH: % FK créées', v_fk_count;

    -- Validation 5: Compter indexes SCH
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename LIKE 'sch_%' OR tablename = 'dir_maintenance_types';

    RAISE NOTICE 'Indexes SCH: % indexes créés', v_index_count;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ GATEWAY 2 COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
