-- ============================================================
-- Migration: Create or update sup_ticket_messages table
-- ============================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table
CREATE TABLE IF NOT EXISTS sup_ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message_body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL,
  deleted_at TIMESTAMPTZ NULL,
  deleted_by UUID NULL,
  deletion_reason TEXT NULL
);

-- Add columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'ticket_id') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN ticket_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'sender_id') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN sender_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'message_body') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN message_body TEXT NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'sent_at') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN sent_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'metadata') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'created_at') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'created_by') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN created_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'updated_at') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'updated_by') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN updated_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'deleted_at') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'deleted_by') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN deleted_by UUID NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sup_ticket_messages' AND column_name = 'deletion_reason') THEN
    ALTER TABLE sup_ticket_messages ADD COLUMN deletion_reason TEXT NULL;
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sup_ticket_messages_ticket_id_fkey') THEN
    ALTER TABLE sup_ticket_messages ADD CONSTRAINT sup_ticket_messages_ticket_id_fkey
      FOREIGN KEY (ticket_id) REFERENCES sup_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sup_ticket_messages_created_by_fkey') THEN
    ALTER TABLE sup_ticket_messages ADD CONSTRAINT sup_ticket_messages_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sup_ticket_messages_updated_by_fkey') THEN
    ALTER TABLE sup_ticket_messages ADD CONSTRAINT sup_ticket_messages_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sup_ticket_messages_deleted_by_fkey') THEN
    ALTER TABLE sup_ticket_messages ADD CONSTRAINT sup_ticket_messages_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- Drop old indexes
DROP INDEX IF EXISTS sup_ticket_messages_ticket_id_idx;
DROP INDEX IF EXISTS sup_ticket_messages_sent_at_idx;
DROP INDEX IF EXISTS sup_ticket_messages_deleted_at_idx;
DROP INDEX IF EXISTS sup_ticket_messages_created_by_idx;
DROP INDEX IF EXISTS sup_ticket_messages_updated_by_idx;
DROP INDEX IF EXISTS sup_ticket_messages_metadata_idx;

-- Create new indexes
CREATE INDEX IF NOT EXISTS sup_ticket_messages_ticket_id_idx ON sup_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS sup_ticket_messages_sent_at_idx ON sup_ticket_messages(sent_at);
CREATE INDEX IF NOT EXISTS sup_ticket_messages_deleted_at_idx ON sup_ticket_messages(deleted_at);
CREATE INDEX IF NOT EXISTS sup_ticket_messages_created_by_idx ON sup_ticket_messages(created_by);
CREATE INDEX IF NOT EXISTS sup_ticket_messages_updated_by_idx ON sup_ticket_messages(updated_by);
CREATE INDEX IF NOT EXISTS sup_ticket_messages_metadata_idx ON sup_ticket_messages USING GIN(metadata);

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_sup_ticket_messages_updated_at'
      AND tgrelid = 'sup_ticket_messages'::regclass
  ) THEN
    CREATE TRIGGER update_sup_ticket_messages_updated_at
      BEFORE UPDATE ON sup_ticket_messages
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE sup_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS tenant_isolation_sup_ticket_messages ON sup_ticket_messages;
CREATE POLICY tenant_isolation_sup_ticket_messages ON sup_ticket_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sup_tickets t
      WHERE t.id = ticket_id
        AND t.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sup_tickets t
      WHERE t.id = ticket_id
        AND t.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS temp_allow_all_sup_ticket_messages ON sup_ticket_messages;
CREATE POLICY temp_allow_all_sup_ticket_messages ON sup_ticket_messages
  FOR ALL TO authenticated
  USING (true);
