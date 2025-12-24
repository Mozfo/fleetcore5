-- =============================================================================
-- MIGRATION: Quote-to-Cash Part 2 - Billing Enterprise avec Stripe
-- Date: 2025-12-11
-- Description: Tables et ENUMs pour Subscription Schedules, Phases, Amendments
-- =============================================================================

BEGIN;

-- =============================================================================
-- ETAPE 1: ENUMS
-- =============================================================================

-- Schedule status
DO $$ BEGIN
  CREATE TYPE schedule_status AS ENUM (
    'not_started',
    'active',
    'completed',
    'canceled',
    'released'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Schedule end behavior
DO $$ BEGIN
  CREATE TYPE schedule_end_behavior AS ENUM (
    'release',
    'cancel',
    'none'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Amendment type
DO $$ BEGIN
  CREATE TYPE amendment_type AS ENUM (
    'upgrade',
    'downgrade',
    'quantity_change',
    'plan_change',
    'billing_change',
    'cancel_immediate',
    'cancel_scheduled',
    'pause',
    'resume'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Amendment status
DO $$ BEGIN
  CREATE TYPE amendment_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'applied',
    'rejected',
    'canceled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Proration behavior
DO $$ BEGIN
  CREATE TYPE proration_behavior AS ENUM (
    'create_prorations',
    'none',
    'always_invoice'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- ETAPE 2: TABLE bil_subscription_schedules
-- =============================================================================

CREATE TABLE IF NOT EXISTS bil_subscription_schedules (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  schedule_reference VARCHAR(50) NOT NULL,

  -- Relations
  tenant_id UUID NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES crm_orders(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES adm_providers(id) ON DELETE CASCADE,

  -- Stripe sync
  stripe_schedule_id VARCHAR(100),
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),

  -- Status
  status schedule_status NOT NULL DEFAULT 'not_started',
  end_behavior schedule_end_behavior NOT NULL DEFAULT 'cancel',

  -- Phases tracking
  total_phases INTEGER NOT NULL DEFAULT 1,
  current_phase_number INTEGER DEFAULT 1,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  current_phase_start DATE,
  current_phase_end DATE,

  -- Values
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  total_contract_value DECIMAL(18,2),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Sync tracking
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,

  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT
);

-- Index bil_subscription_schedules
CREATE UNIQUE INDEX IF NOT EXISTS idx_bil_schedules_reference
  ON bil_subscription_schedules(schedule_reference)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_schedules_tenant_id
  ON bil_subscription_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bil_schedules_order_id
  ON bil_subscription_schedules(order_id)
  WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bil_schedules_provider_id
  ON bil_subscription_schedules(provider_id);
CREATE INDEX IF NOT EXISTS idx_bil_schedules_status
  ON bil_subscription_schedules(status)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_schedules_stripe_schedule_id
  ON bil_subscription_schedules(stripe_schedule_id)
  WHERE stripe_schedule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bil_schedules_stripe_subscription_id
  ON bil_subscription_schedules(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_bil_subscription_schedules_updated_at ON bil_subscription_schedules;
CREATE TRIGGER set_bil_subscription_schedules_updated_at
  BEFORE UPDATE ON bil_subscription_schedules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE bil_subscription_schedules ENABLE ROW LEVEL SECURITY;

-- Policy dev (a remplacer en prod)
DROP POLICY IF EXISTS temp_allow_all_bil_schedules_dev ON bil_subscription_schedules;
CREATE POLICY temp_allow_all_bil_schedules_dev
  ON bil_subscription_schedules FOR ALL USING (true) WITH CHECK (true);

-- Comment
COMMENT ON TABLE bil_subscription_schedules IS
  'Subscription schedules multi-phases avec sync Stripe';

-- =============================================================================
-- ETAPE 3: TABLE bil_subscription_schedule_phases
-- =============================================================================

CREATE TABLE IF NOT EXISTS bil_subscription_schedule_phases (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  schedule_id UUID NOT NULL REFERENCES bil_subscription_schedules(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES bil_billing_plans(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES adm_providers(id) ON DELETE CASCADE,

  -- Phase info
  phase_number INTEGER NOT NULL,
  phase_name VARCHAR(100),

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER,

  -- Pricing
  unit_price DECIMAL(15,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  phase_total DECIMAL(15,2) NOT NULL,

  -- Billing
  billing_cycle billing_interval NOT NULL DEFAULT 'month',
  proration_behavior proration_behavior DEFAULT 'create_prorations',

  -- Trial (first phase only)
  trial_days INTEGER DEFAULT 0,

  -- Stripe sync
  stripe_price_id VARCHAR(100),
  stripe_coupon_id VARCHAR(100),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_phase_dates CHECK (end_date > start_date),
  CONSTRAINT chk_phase_number CHECK (phase_number > 0),
  CONSTRAINT chk_discount_percent CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

-- Index bil_subscription_schedule_phases
CREATE INDEX IF NOT EXISTS idx_bil_schedule_phases_schedule_id
  ON bil_subscription_schedule_phases(schedule_id);
CREATE INDEX IF NOT EXISTS idx_bil_schedule_phases_plan_id
  ON bil_subscription_schedule_phases(plan_id)
  WHERE plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bil_schedule_phases_provider_id
  ON bil_subscription_schedule_phases(provider_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bil_schedule_phases_unique
  ON bil_subscription_schedule_phases(schedule_id, phase_number);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_bil_schedule_phases_updated_at ON bil_subscription_schedule_phases;
CREATE TRIGGER set_bil_schedule_phases_updated_at
  BEFORE UPDATE ON bil_subscription_schedule_phases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE bil_subscription_schedule_phases ENABLE ROW LEVEL SECURITY;

-- Policy dev
DROP POLICY IF EXISTS temp_allow_all_bil_phases_dev ON bil_subscription_schedule_phases;
CREATE POLICY temp_allow_all_bil_phases_dev
  ON bil_subscription_schedule_phases FOR ALL USING (true) WITH CHECK (true);

-- Comment
COMMENT ON TABLE bil_subscription_schedule_phases IS
  'Phases individuelles des subscription schedules';

-- =============================================================================
-- ETAPE 4: TABLE bil_amendments
-- =============================================================================

CREATE TABLE IF NOT EXISTS bil_amendments (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  amendment_reference VARCHAR(50) NOT NULL,

  -- Relations
  tenant_id UUID NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES bil_tenant_subscriptions(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES bil_subscription_schedules(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES adm_providers(id) ON DELETE CASCADE,

  -- Type et status
  amendment_type amendment_type NOT NULL,
  status amendment_status NOT NULL DEFAULT 'draft',

  -- Changes
  old_plan_id UUID REFERENCES bil_billing_plans(id) ON DELETE SET NULL,
  new_plan_id UUID REFERENCES bil_billing_plans(id) ON DELETE SET NULL,
  old_quantity INTEGER,
  new_quantity INTEGER,
  old_price DECIMAL(15,2),
  new_price DECIMAL(15,2),
  old_billing_cycle billing_interval,
  new_billing_cycle billing_interval,

  -- Dates
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_date DATE NOT NULL,
  applied_at TIMESTAMPTZ,

  -- Proration
  proration_behavior proration_behavior NOT NULL DEFAULT 'create_prorations',
  proration_amount DECIMAL(15,2),
  proration_invoice_id VARCHAR(100),

  -- Approval
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Stripe sync
  stripe_amendment_id VARCHAR(100),
  stripe_invoice_id VARCHAR(100),

  -- Notes
  reason TEXT,
  internal_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- Index bil_amendments
CREATE UNIQUE INDEX IF NOT EXISTS idx_bil_amendments_reference
  ON bil_amendments(amendment_reference)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_amendments_tenant_id
  ON bil_amendments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bil_amendments_subscription_id
  ON bil_amendments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_bil_amendments_schedule_id
  ON bil_amendments(schedule_id)
  WHERE schedule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bil_amendments_provider_id
  ON bil_amendments(provider_id);
CREATE INDEX IF NOT EXISTS idx_bil_amendments_status
  ON bil_amendments(status)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bil_amendments_type
  ON bil_amendments(amendment_type);
CREATE INDEX IF NOT EXISTS idx_bil_amendments_effective_date
  ON bil_amendments(effective_date);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_bil_amendments_updated_at ON bil_amendments;
CREATE TRIGGER set_bil_amendments_updated_at
  BEFORE UPDATE ON bil_amendments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE bil_amendments ENABLE ROW LEVEL SECURITY;

-- Policy dev
DROP POLICY IF EXISTS temp_allow_all_bil_amendments_dev ON bil_amendments;
CREATE POLICY temp_allow_all_bil_amendments_dev
  ON bil_amendments FOR ALL USING (true) WITH CHECK (true);

-- Comment
COMMENT ON TABLE bil_amendments IS
  'Modifications de subscriptions avec proration et sync Stripe';

-- =============================================================================
-- ETAPE 5: TABLE stripe_webhook_logs
-- =============================================================================

CREATE TABLE IF NOT EXISTS stripe_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_duration_ms INTEGER,
  status VARCHAR(20) DEFAULT 'processed',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index stripe_webhook_logs
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_event_type
  ON stripe_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_created_at
  ON stripe_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_status
  ON stripe_webhook_logs(status);

-- Comment
COMMENT ON TABLE stripe_webhook_logs IS
  'Logs des webhooks Stripe pour debugging et audit';

COMMIT;

-- =============================================================================
-- VERIFICATION: Compter les nouvelles tables
-- =============================================================================
-- SELECT
--   'bil_subscription_schedules' as table_name,
--   COUNT(*) as column_count
-- FROM information_schema.columns
-- WHERE table_name = 'bil_subscription_schedules'
-- UNION ALL
-- SELECT
--   'bil_subscription_schedule_phases' as table_name,
--   COUNT(*) as column_count
-- FROM information_schema.columns
-- WHERE table_name = 'bil_subscription_schedule_phases'
-- UNION ALL
-- SELECT
--   'bil_amendments' as table_name,
--   COUNT(*) as column_count
-- FROM information_schema.columns
-- WHERE table_name = 'bil_amendments'
-- UNION ALL
-- SELECT
--   'stripe_webhook_logs' as table_name,
--   COUNT(*) as column_count
-- FROM information_schema.columns
-- WHERE table_name = 'stripe_webhook_logs';
