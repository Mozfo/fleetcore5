-- ============================================
-- Migration: Add adm_notification_queue table
-- Date: 2025-11-28
-- Author: Claude (Session #29)
-- Purpose: Centralized notification queue for event-driven architecture
-- Incident: Session #27 - Email sending accidentally removed
-- ============================================

-- 1. Create enum for queue status (different from notification_status)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_status') THEN
        CREATE TYPE queue_status AS ENUM (
            'pending',
            'processing',
            'sent',
            'failed',
            'cancelled'
        );
    END IF;
END$$;

-- 2. Create the notification queue table
CREATE TABLE IF NOT EXISTS adm_notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Routing
    channel notification_channel NOT NULL DEFAULT 'email',
    template_code VARCHAR(100) NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'en',

    -- Recipient
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    recipient_user_id UUID,

    -- Content
    variables JSONB NOT NULL DEFAULT '{}',

    -- Context (optional foreign keys)
    lead_id UUID,
    member_id UUID,
    tenant_id UUID,
    country_code CHAR(2),

    -- Status tracking
    status queue_status NOT NULL DEFAULT 'pending',

    -- Retry logic
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    last_error TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    -- Prevent duplicate processing
    idempotency_key VARCHAR(255) UNIQUE,

    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    deletion_reason TEXT
);

-- 3. Add comments
COMMENT ON TABLE adm_notification_queue IS 'Centralized notification queue - Transactional Outbox Pattern. All notifications MUST go through this queue.';
COMMENT ON COLUMN adm_notification_queue.idempotency_key IS 'Unique key to prevent duplicate notifications (e.g., lead_id + template_code)';
COMMENT ON COLUMN adm_notification_queue.next_retry_at IS 'Exponential backoff: 2^attempts minutes after failure';

-- 4. Create indexes for worker polling
CREATE INDEX IF NOT EXISTS idx_adm_notification_queue_pending
ON adm_notification_queue(status, next_retry_at)
WHERE status IN ('pending', 'failed') AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_adm_notification_queue_created_at
ON adm_notification_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_adm_notification_queue_lead_id
ON adm_notification_queue(lead_id)
WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_adm_notification_queue_template
ON adm_notification_queue(template_code);

CREATE INDEX IF NOT EXISTS idx_adm_notification_queue_status
ON adm_notification_queue(status);

-- ============================================
-- Verification query (run after migration)
-- ============================================
-- SELECT
--     column_name,
--     data_type,
--     is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'adm_notification_queue'
-- ORDER BY ordinal_position;
