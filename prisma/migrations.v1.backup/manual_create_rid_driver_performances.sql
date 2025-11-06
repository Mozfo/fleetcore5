-- ============================================================================
-- Migration: Create rid_driver_performances table
-- Description: Aggregates driver performance metrics (ratings, punctuality, trips, cancellations, incidents, online hours, earnings)
-- Domain: RID (Drivers)
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.rid_driver_performances (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  trips_completed INTEGER NOT NULL DEFAULT 0 CHECK (trips_completed >= 0),
  trips_cancelled INTEGER NOT NULL DEFAULT 0 CHECK (trips_cancelled >= 0),
  on_time_rate NUMERIC(5,2) CHECK (on_time_rate >= 0 AND on_time_rate <= 100),
  avg_rating NUMERIC(3,2) CHECK (avg_rating >= 0 AND avg_rating <= 5),
  incidents_count INTEGER NOT NULL DEFAULT 0 CHECK (incidents_count >= 0),
  earnings_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (earnings_total >= 0),
  hours_online NUMERIC(7,2) CHECK (hours_online >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason TEXT
);

-- Add columns if table already exists
DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS driver_id UUID NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS period_start DATE NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS period_end DATE NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS trips_completed INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS trips_cancelled INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS on_time_rate NUMERIC(5,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS incidents_count INTEGER NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS earnings_total NUMERIC(12,2) NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS hours_online NUMERIC(7,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS created_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS updated_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS deleted_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add check constraints
DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_trips_completed_check
    CHECK (trips_completed >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_trips_cancelled_check
    CHECK (trips_cancelled >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_on_time_rate_check
    CHECK (on_time_rate >= 0 AND on_time_rate <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_avg_rating_check
    CHECK (avg_rating >= 0 AND avg_rating <= 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_incidents_count_check
    CHECK (incidents_count >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_earnings_total_check
    CHECK (earnings_total >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_hours_online_check
    CHECK (hours_online >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_period_check
    CHECK (period_end >= period_start);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_driver_id_fkey
    FOREIGN KEY (driver_id) REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rid_driver_performances
    ADD CONSTRAINT rid_driver_performances_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS rid_driver_performances_tenant_id_idx
  ON rid_driver_performances(tenant_id);

CREATE INDEX IF NOT EXISTS rid_driver_performances_driver_id_idx
  ON rid_driver_performances(driver_id);

CREATE INDEX IF NOT EXISTS rid_driver_performances_period_start_idx
  ON rid_driver_performances(period_start);

CREATE INDEX IF NOT EXISTS rid_driver_performances_period_end_idx
  ON rid_driver_performances(period_end);

CREATE INDEX IF NOT EXISTS rid_driver_performances_deleted_at_idx
  ON rid_driver_performances(deleted_at);

CREATE INDEX IF NOT EXISTS rid_driver_performances_created_by_idx
  ON rid_driver_performances(created_by);

CREATE INDEX IF NOT EXISTS rid_driver_performances_updated_by_idx
  ON rid_driver_performances(updated_by);

CREATE INDEX IF NOT EXISTS rid_driver_performances_metadata_gin
  ON rid_driver_performances USING GIN(metadata);

-- Create partial unique index
DROP INDEX IF EXISTS rid_driver_performances_tenant_driver_period_key;
CREATE UNIQUE INDEX rid_driver_performances_tenant_driver_period_key
  ON rid_driver_performances(tenant_id, driver_id, period_start)
  WHERE deleted_at IS NULL;

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_rid_driver_performances_updated_at'
      AND tgrelid = 'rid_driver_performances'::regclass
  ) THEN
    CREATE TRIGGER update_rid_driver_performances_updated_at
      BEFORE UPDATE ON rid_driver_performances
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE rid_driver_performances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_rid_driver_performances ON rid_driver_performances;
CREATE POLICY tenant_isolation_rid_driver_performances ON rid_driver_performances
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS temp_allow_all_rid_driver_performances ON rid_driver_performances;
CREATE POLICY temp_allow_all_rid_driver_performances ON rid_driver_performances
  FOR ALL TO authenticated
  USING (true);

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '✓ rid_driver_performances table created successfully';
  RAISE NOTICE '   - Primary key: id (UUID)';
  RAISE NOTICE '   - Foreign keys: 5 (tenant, driver, audit fields)';
  RAISE NOTICE '   - Partial unique index: (tenant_id, driver_id, period_start) WHERE deleted_at IS NULL';
  RAISE NOTICE '   - Indexes: 8 btree + 1 GIN (metadata)';
  RAISE NOTICE '   - Check constraints: 8 (counters >= 0, on_time_rate 0-100, avg_rating 0-5, period_end >= period_start)';
  RAISE NOTICE '   - RLS policies: 2 (tenant_isolation + temp_allow_all)';
  RAISE NOTICE '   - Trigger: update_rid_driver_performances_updated_at';
END $$;
