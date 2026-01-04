-- V6.2-3e: Renommage adm_members -> clt_members
-- Module CLT (Client) - Utilisateurs du client

BEGIN;

-- =============================================================================
-- ETAPE 1: Renommer la table principale
-- =============================================================================

ALTER TABLE adm_members RENAME TO clt_members;

-- =============================================================================
-- ETAPE 2: Renommer les indexes
-- =============================================================================

ALTER INDEX IF EXISTS adm_members_pkey RENAME TO clt_members_pkey;
ALTER INDEX IF EXISTS adm_members_email_key RENAME TO clt_members_email_key;
ALTER INDEX IF EXISTS adm_members_clerk_user_id_key RENAME TO clt_members_clerk_user_id_key;
ALTER INDEX IF EXISTS idx_adm_members_tenant_id RENAME TO idx_clt_members_tenant_id;
ALTER INDEX IF EXISTS idx_adm_members_email RENAME TO idx_clt_members_email;
ALTER INDEX IF EXISTS idx_adm_members_clerk_user_id RENAME TO idx_clt_members_clerk_user_id;
ALTER INDEX IF EXISTS idx_adm_members_status RENAME TO idx_clt_members_status;
ALTER INDEX IF EXISTS idx_adm_members_role RENAME TO idx_clt_members_role;
ALTER INDEX IF EXISTS idx_adm_members_deleted_at RENAME TO idx_clt_members_deleted_at;

-- =============================================================================
-- ETAPE 3: Renommer les contraintes FK de la table elle-meme (si elles existent)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'adm_members_tenant_id_fkey') THEN
    ALTER TABLE clt_members RENAME CONSTRAINT adm_members_tenant_id_fkey TO clt_members_tenant_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'adm_members_default_role_id_fkey') THEN
    ALTER TABLE clt_members RENAME CONSTRAINT adm_members_default_role_id_fkey TO clt_members_default_role_id_fkey;
  END IF;
END $$;

-- =============================================================================
-- ETAPE 4: Mettre a jour les RLS policies
-- =============================================================================

DROP POLICY IF EXISTS adm_members_tenant_isolation ON clt_members;

CREATE POLICY clt_members_tenant_isolation ON clt_members
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE clt_members IS 'V6.2-3: Utilisateurs client (ex adm_members). Relation avec Clerk auth.';

COMMIT;
