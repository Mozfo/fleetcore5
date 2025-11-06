-- =====================================================
-- Table: public.sup_customer_feedback
-- Description: Customer feedback and satisfaction ratings
-- Domain: SUP (Support)
-- =====================================================

-- Drop existing objects if they exist (idempotent)
DROP TRIGGER IF EXISTS trg_sup_customer_feedback_updated_at ON public.sup_customer_feedback;
DROP INDEX IF EXISTS sup_customer_feedback_tenant_id_idx;
DROP INDEX IF EXISTS sup_customer_feedback_tenant_id_submitted_by_idx;
DROP INDEX IF EXISTS sup_customer_feedback_rating_idx;
DROP INDEX IF EXISTS sup_customer_feedback_created_at_idx;
DROP TABLE IF EXISTS public.sup_customer_feedback CASCADE;

-- Create table
CREATE TABLE public.sup_customer_feedback (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.adm_tenants(id) ON DELETE CASCADE,

    -- Polymorphic submitter (no FK - can be driver, client, member)
    submitted_by UUID NOT NULL,
    submitter_type VARCHAR(50) NOT NULL,

    -- Feedback content
    feedback_text TEXT NOT NULL,
    rating INTEGER NOT NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_by UUID,
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT sup_customer_feedback_rating_check CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT sup_customer_feedback_submitter_type_check CHECK (submitter_type IN ('driver', 'client', 'member', 'guest'))
);

-- Indexes
CREATE INDEX sup_customer_feedback_tenant_id_idx ON public.sup_customer_feedback(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX sup_customer_feedback_tenant_id_submitted_by_idx ON public.sup_customer_feedback(tenant_id, submitted_by) WHERE deleted_at IS NULL;
CREATE INDEX sup_customer_feedback_rating_idx ON public.sup_customer_feedback(rating) WHERE deleted_at IS NULL;
CREATE INDEX sup_customer_feedback_created_at_idx ON public.sup_customer_feedback(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX sup_customer_feedback_metadata_idx ON public.sup_customer_feedback USING gin(metadata);

-- Enable RLS
ALTER TABLE public.sup_customer_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS tenant_isolation_sup_customer_feedback ON public.sup_customer_feedback;
DROP POLICY IF EXISTS temp_allow_all_sup_customer_feedback ON public.sup_customer_feedback;

-- RLS Policies
CREATE POLICY tenant_isolation_sup_customer_feedback ON public.sup_customer_feedback
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Temporary permissive policy for development
CREATE POLICY temp_allow_all_sup_customer_feedback ON public.sup_customer_feedback
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER trg_sup_customer_feedback_updated_at
    BEFORE UPDATE ON public.sup_customer_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.sup_customer_feedback IS 'Customer feedback and satisfaction ratings';
COMMENT ON COLUMN public.sup_customer_feedback.submitted_by IS 'Polymorphic reference to feedback submitter';
COMMENT ON COLUMN public.sup_customer_feedback.rating IS 'Satisfaction rating from 1 (worst) to 5 (best)';
