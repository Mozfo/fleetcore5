-- ============================================
-- FLEETCORE V2 MIGRATION - PHASE 1: STRUCTURES
-- Module: ADM (Administration)
-- Session: 1/13
-- Date: 4 Novembre 2025
-- ============================================
-- Tables modifiées (V1→V2): 5
-- Nouvelles tables (V2): 7
-- Total tables module: 12
-- ============================================


-- ============================================
-- SECTION 1: ENUMS DU MODULE ADM
-- ============================================

-- Enum 1: member_status
-- Description: Statut des membres (utilisateurs tenant)
-- Utilisation: adm_members.status
-- Valeurs:
--   - invited: Invitation envoyée, non acceptée
--   - active: Actif et opérationnel
--   - suspended: Suspendu temporairement
--   - terminated: Terminé/Révoqué définitivement
DO $$ BEGIN
  CREATE TYPE member_status AS ENUM ('invited', 'active', 'suspended', 'terminated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 2: department
-- Description: Départements des employés FleetCore
-- Utilisation: adm_provider_employees.department
-- Valeurs:
--   - support: Support client
--   - tech: Technique/IT
--   - finance: Finance/Comptabilité
--   - sales: Commercial/Ventes
DO $$ BEGIN
  CREATE TYPE department AS ENUM ('support', 'tech', 'finance', 'sales');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 3: employee_role
-- Description: Rôles des employés FleetCore
-- Utilisation: adm_provider_employees.role
-- Valeurs:
--   - support_agent: Agent de support
--   - admin: Administrateur
--   - super_admin: Super administrateur
DO $$ BEGIN
  CREATE TYPE employee_role AS ENUM ('support_agent', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 4: scope_type
-- Description: Type de scope pour les rôles
-- Utilisation: adm_member_roles.scope_type
-- Valeurs:
--   - global: Scope global (tenant entier)
--   - branch: Scope branche/agence
--   - team: Scope équipe
DO $$ BEGIN
  CREATE TYPE scope_type AS ENUM ('global', 'branch', 'team');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 5: invitation_status
-- Description: Statut des invitations
-- Utilisation: adm_invitations.status
-- Valeurs:
--   - pending: En attente
--   - accepted: Acceptée
--   - expired: Expirée
--   - revoked: Révoquée
DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 6: invitation_type
-- Description: Type d'invitation
-- Utilisation: adm_invitations.invitation_type
-- Valeurs:
--   - initial_admin: Premier admin (onboarding)
--   - additional_user: Utilisateur additionnel
--   - role_change: Changement de rôle
--   - reactivation: Réactivation compte
DO $$ BEGIN
  CREATE TYPE invitation_type AS ENUM ('initial_admin', 'additional_user', 'role_change', 'reactivation');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 7: lifecycle_event_type
-- Description: Types d'événements lifecycle tenant
-- Utilisation: adm_tenant_lifecycle_events.event_type
-- Valeurs:
--   - created: Tenant créé
--   - trial_started: Essai démarré
--   - trial_extended: Essai prolongé
--   - activated: Activé (devient payant)
--   - plan_upgraded: Plan amélioré
--   - plan_downgraded: Plan réduit
--   - suspended: Suspendu
--   - reactivated: Réactivé
--   - cancelled: Annulé
--   - archived: Archivé
--   - deleted: Supprimé
DO $$ BEGIN
  CREATE TYPE lifecycle_event_type AS ENUM ('created', 'trial_started', 'trial_extended', 'activated', 'plan_upgraded', 'plan_downgraded', 'suspended', 'reactivated', 'cancelled', 'archived', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================
-- SECTION 2: MODIFICATIONS TABLES EXISTANTES (V1→V2)
-- ============================================

-- Table 1: adm_tenants
-- Colonnes ajoutées: 7 (status, lifecycle, contacts)
-- Description: Ajout gestion statut tenant, onboarding, facturation et contacts

-- Ajout statut et lifecycle
ALTER TABLE adm_tenants
  ADD COLUMN IF NOT EXISTS status tenant_status NOT NULL DEFAULT 'trialing';

ALTER TABLE adm_tenants
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ(6);

ALTER TABLE adm_tenants
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ(6);

ALTER TABLE adm_tenants
  ADD COLUMN IF NOT EXISTS next_invoice_date DATE;

-- Ajout contacts
ALTER TABLE adm_tenants
  ADD COLUMN IF NOT EXISTS primary_contact_email VARCHAR(255);

ALTER TABLE adm_tenants
  ADD COLUMN IF NOT EXISTS primary_contact_phone VARCHAR(50);

ALTER TABLE adm_tenants
  ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);


-- Table 2: adm_members
-- Colonnes ajoutées: 10 (sécurité, 2FA, configuration)
-- Description: Ajout gestion statut membre, sécurité 2FA, verrouillage et préférences

-- Ajout statut membre
ALTER TABLE adm_members
  ADD COLUMN IF NOT EXISTS status member_status NOT NULL DEFAULT 'invited';

-- Ajout sécurité et vérification
ALTER TABLE adm_members
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ(6);

ALTER TABLE adm_members
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE adm_members
  ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

ALTER TABLE adm_members
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ(6);

ALTER TABLE adm_members
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE adm_members
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ(6);

-- Ajout configuration membre
ALTER TABLE adm_members
  ADD COLUMN IF NOT EXISTS default_role_id UUID;

ALTER TABLE adm_members
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10);

ALTER TABLE adm_members
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB;


-- Table 3: adm_roles
-- Colonnes ajoutées: 8 (hiérarchie, contrôles, validité)
-- Description: Ajout slug, hiérarchie rôles, flags système, limites et période validité

-- Ajout identification et hiérarchie
ALTER TABLE adm_roles
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NOT NULL;

ALTER TABLE adm_roles
  ADD COLUMN IF NOT EXISTS parent_role_id UUID;

ALTER TABLE adm_roles
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE adm_roles
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

-- Ajout contrôles et validité
ALTER TABLE adm_roles
  ADD COLUMN IF NOT EXISTS max_members INTEGER;

ALTER TABLE adm_roles
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ(6);

ALTER TABLE adm_roles
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ(6);

ALTER TABLE adm_roles
  ADD COLUMN IF NOT EXISTS approval_required BOOLEAN NOT NULL DEFAULT false;


-- Table 4: adm_member_roles
-- Colonnes ajoutées: 7 (traçabilité, validité, scope)
-- Description: Ajout traçabilité assignation, périodes validité, scope granulaire et priorité

-- Ajout traçabilité
ALTER TABLE adm_member_roles
  ADD COLUMN IF NOT EXISTS assigned_by UUID;

ALTER TABLE adm_member_roles
  ADD COLUMN IF NOT EXISTS assignment_reason TEXT;

-- Ajout validité temporelle
ALTER TABLE adm_member_roles
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ(6);

ALTER TABLE adm_member_roles
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ(6);

ALTER TABLE adm_member_roles
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;

-- Ajout scope
ALTER TABLE adm_member_roles
  ADD COLUMN IF NOT EXISTS scope_type scope_type;

ALTER TABLE adm_member_roles
  ADD COLUMN IF NOT EXISTS scope_id UUID;

ALTER TABLE adm_member_roles
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;


-- Table 5: adm_audit_logs
-- Colonnes ajoutées: 7 (classification, contexte, changements, rétention)
-- Description: Ajout classification sévérité/catégorie, tracking session/request, diff values, tags

-- Ajout classification
ALTER TABLE adm_audit_logs
  ADD COLUMN IF NOT EXISTS severity audit_severity NOT NULL DEFAULT 'info';

ALTER TABLE adm_audit_logs
  ADD COLUMN IF NOT EXISTS category audit_category NOT NULL DEFAULT 'operational';

-- Ajout contexte tracking
ALTER TABLE adm_audit_logs
  ADD COLUMN IF NOT EXISTS session_id UUID;

ALTER TABLE adm_audit_logs
  ADD COLUMN IF NOT EXISTS request_id UUID;

-- Ajout changements et rétention
ALTER TABLE adm_audit_logs
  ADD COLUMN IF NOT EXISTS old_values JSONB;

ALTER TABLE adm_audit_logs
  ADD COLUMN IF NOT EXISTS new_values JSONB;

ALTER TABLE adm_audit_logs
  ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ(6);

ALTER TABLE adm_audit_logs
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];


-- ============================================
-- SECTION 3: NOUVELLES TABLES (V2)
-- ============================================

-- Table 6: adm_provider_employees
-- Description: Employés FleetCore (staff provider) avec permissions et hiérarchie
-- Relations: Auto-référence (superviseur), vers adm_tenant_lifecycle_events, adm_invitations

CREATE TABLE IF NOT EXISTS adm_provider_employees (
  -- Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification unique
  employee_number VARCHAR(50) NOT NULL UNIQUE,
  clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email CITEXT NOT NULL UNIQUE,

  -- Département et rôle
  department department NOT NULL,
  title VARCHAR(100),
  role employee_role NOT NULL,

  -- Permissions spéciales
  permissions JSONB,
  can_impersonate BOOLEAN NOT NULL DEFAULT false,
  can_override_limits BOOLEAN NOT NULL DEFAULT false,
  accessible_tenants UUID[] DEFAULT ARRAY[]::UUID[],  -- Empty array = ALL tenants
  max_support_tickets INTEGER,

  -- Tracking RH
  hire_date DATE NOT NULL,
  termination_date DATE,
  contract_type VARCHAR(50),
  supervisor_id UUID,  -- FK interne (récursif)
  last_activity_at TIMESTAMPTZ(6),

  -- Audit trail
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);


-- Table 7: adm_tenant_lifecycle_events
-- Description: Historique événements lifecycle tenant (création, trial, activation, suspension, etc.)
-- Relations: vers adm_tenants (CASCADE), vers adm_provider_employees (performed_by)

CREATE TABLE IF NOT EXISTS adm_tenant_lifecycle_events (
  -- Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant et événement
  tenant_id UUID NOT NULL,  -- FK externe vers adm_tenants
  event_type lifecycle_event_type NOT NULL,
  event_date TIMESTAMPTZ(6) NOT NULL,
  effective_date TIMESTAMPTZ(6) NOT NULL,

  -- Qui a effectué l'action
  performed_by UUID,  -- FK interne vers adm_provider_employees
  performed_by_type performed_by_type NOT NULL,

  -- Contexte de l'événement
  reason TEXT NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  previous_plan_id UUID,
  new_plan_id UUID,
  related_invoice_id UUID,
  support_ticket_id UUID,

  -- Impact et actions
  features_affected JSONB,
  users_notified UUID[] DEFAULT ARRAY[]::UUID[],
  notifications_sent JSONB,
  next_action_required VARCHAR(255),
  next_action_date TIMESTAMPTZ(6),

  -- Audit
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);


-- Table 8: adm_invitations
-- Description: Gestion invitations onboarding sécurisé (tokens, tracking, acceptation)
-- Relations: vers adm_tenants (CASCADE), vers adm_provider_employees (sent_by), vers adm_members (accepted_by)

CREATE TABLE IF NOT EXISTS adm_invitations (
  -- Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant et destinataire
  tenant_id UUID NOT NULL,  -- FK externe vers adm_tenants
  email CITEXT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(100) NOT NULL,
  expires_at TIMESTAMPTZ(6) NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',

  -- Tracking envois
  sent_at TIMESTAMPTZ(6) NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 1,
  last_sent_at TIMESTAMPTZ(6) NOT NULL,

  -- Acceptation
  accepted_at TIMESTAMPTZ(6),
  accepted_from_ip INET,
  accepted_by_member_id UUID,  -- FK externe vers adm_members (SET NULL)

  -- Contexte
  invitation_type invitation_type NOT NULL,
  custom_message TEXT,
  metadata JSONB,
  sent_by UUID NOT NULL,  -- FK interne vers adm_provider_employees

  -- Audit
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);


-- Table 9: adm_role_permissions
-- Description: Permissions granulaires par rôle (resource, action, conditions)
-- Relations: vers adm_roles (CASCADE)

CREATE TABLE IF NOT EXISTS adm_role_permissions (
  -- Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rôle et permission
  role_id UUID NOT NULL,  -- FK interne vers adm_roles
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  conditions JSONB,

  -- Audit
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);


-- Table 10: adm_role_versions
-- Description: Historique versions des rôles (snapshot permissions, traçabilité)
-- Relations: vers adm_roles (CASCADE), vers adm_members (changed_by, SET NULL)

CREATE TABLE IF NOT EXISTS adm_role_versions (
  -- Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Version rôle
  role_id UUID NOT NULL,  -- FK interne vers adm_roles
  version_number INTEGER NOT NULL,
  permissions_snapshot JSONB NOT NULL,
  changed_by UUID,  -- FK externe vers adm_members
  change_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);


-- Table 11: adm_member_sessions
-- Description: Sessions actives membres (tokens hachés, tracking IP/UA, expiration)
-- Relations: vers adm_members (CASCADE)

CREATE TABLE IF NOT EXISTS adm_member_sessions (
  -- Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session member
  member_id UUID NOT NULL,  -- FK externe vers adm_members
  token_hash VARCHAR(256) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ(6) NOT NULL,
  revoked_at TIMESTAMPTZ(6),

  -- Audit
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);


-- Table 12: adm_tenant_settings
-- Description: Configuration avancée par tenant (key/value, catégories, encryption flag)
-- Relations: vers adm_tenants (CASCADE)

CREATE TABLE IF NOT EXISTS adm_tenant_settings (
  -- Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Setting tenant
  tenant_id UUID NOT NULL,  -- FK externe vers adm_tenants
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  category VARCHAR(50),
  is_encrypted BOOLEAN NOT NULL DEFAULT false,

  -- Audit
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);


-- ============================================
-- SECTION 3.5: MIGRATIONS COLONNES MANQUANTES
-- Description: Colonnes à ajouter aux tables existantes pour compatibilité FK V2
-- ============================================

-- adm_provider_employees: Ajout colonne supervisor_id pour hiérarchie employés (FK récursive)
-- Cette colonne permet de créer une relation parent-enfant entre employés FleetCore
ALTER TABLE adm_provider_employees
  ADD COLUMN IF NOT EXISTS supervisor_id UUID;


-- ============================================
-- SECTION 4: FOREIGN KEYS INTERNES
-- Description: FK vers tables créées dans CE module (ADM)
-- ============================================

-- FK 1: adm_roles.parent_role_id → adm_roles.id (récursif, hiérarchie rôles)
ALTER TABLE adm_roles
  ADD CONSTRAINT fk_adm_roles_parent
  FOREIGN KEY (parent_role_id)
  REFERENCES adm_roles(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK 2: adm_provider_employees.supervisor_id → adm_provider_employees.id (récursif, hiérarchie employés)
ALTER TABLE adm_provider_employees
  ADD CONSTRAINT fk_adm_provider_employees_supervisor
  FOREIGN KEY (supervisor_id)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK 3: adm_tenant_lifecycle_events.performed_by → adm_provider_employees.id
ALTER TABLE adm_tenant_lifecycle_events
  ADD CONSTRAINT fk_adm_tenant_lifecycle_events_performed_by
  FOREIGN KEY (performed_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK 4: adm_invitations.sent_by → adm_provider_employees.id
ALTER TABLE adm_invitations
  ADD CONSTRAINT fk_adm_invitations_sent_by
  FOREIGN KEY (sent_by)
  REFERENCES adm_provider_employees(id)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- FK 5: adm_role_permissions.role_id → adm_roles.id
ALTER TABLE adm_role_permissions
  ADD CONSTRAINT fk_adm_role_permissions_role
  FOREIGN KEY (role_id)
  REFERENCES adm_roles(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- FK 6: adm_role_versions.role_id → adm_roles.id
ALTER TABLE adm_role_versions
  ADD CONSTRAINT fk_adm_role_versions_role
  FOREIGN KEY (role_id)
  REFERENCES adm_roles(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;


-- ============================================
-- SECTION 5: FOREIGN KEYS EXTERNES (vers modules précédents)
-- Description: FK vers tables déjà créées (sessions 0 à N-1)
-- ============================================

-- Module SHARED déjà créé (Session 0) - Enums uniquement, aucune table FK

-- IMPORTANT: Le module ADM est le PREMIER module après SHARED
-- Toutes les FK suivantes sont "circulaires" entre tables du module ADM lui-même
-- et seront créées maintenant car toutes les tables ADM sont créées dans cette session

-- FK 7: adm_members.tenant_id → adm_tenants.id
ALTER TABLE adm_members
  ADD CONSTRAINT fk_adm_members_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- FK 8: adm_members.default_role_id → adm_roles.id
ALTER TABLE adm_members
  ADD CONSTRAINT fk_adm_members_default_role
  FOREIGN KEY (default_role_id)
  REFERENCES adm_roles(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK 9: adm_roles.tenant_id → adm_tenants.id
ALTER TABLE adm_roles
  ADD CONSTRAINT fk_adm_roles_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- FK 10: adm_member_roles.member_id → adm_members.id
ALTER TABLE adm_member_roles
  ADD CONSTRAINT fk_adm_member_roles_member
  FOREIGN KEY (member_id)
  REFERENCES adm_members(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- FK 11: adm_member_roles.role_id → adm_roles.id
ALTER TABLE adm_member_roles
  ADD CONSTRAINT fk_adm_member_roles_role
  FOREIGN KEY (role_id)
  REFERENCES adm_roles(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- FK 12: adm_member_roles.assigned_by → adm_members.id
ALTER TABLE adm_member_roles
  ADD CONSTRAINT fk_adm_member_roles_assigned_by
  FOREIGN KEY (assigned_by)
  REFERENCES adm_members(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK 13: adm_audit_logs.tenant_id → adm_tenants.id
ALTER TABLE adm_audit_logs
  ADD CONSTRAINT fk_adm_audit_logs_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK 14: adm_audit_logs.member_id → adm_members.id
ALTER TABLE adm_audit_logs
  ADD CONSTRAINT fk_adm_audit_logs_member
  FOREIGN KEY (member_id)
  REFERENCES adm_members(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK 15: adm_tenant_lifecycle_events.tenant_id → adm_tenants.id
ALTER TABLE adm_tenant_lifecycle_events
  ADD CONSTRAINT fk_adm_tenant_lifecycle_events_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- FK 16: adm_invitations.tenant_id → adm_tenants.id
ALTER TABLE adm_invitations
  ADD CONSTRAINT fk_adm_invitations_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- FK 17: adm_invitations.accepted_by_member_id → adm_members.id
ALTER TABLE adm_invitations
  ADD CONSTRAINT fk_adm_invitations_accepted_by
  FOREIGN KEY (accepted_by_member_id)
  REFERENCES adm_members(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK 18: adm_role_versions.changed_by → adm_members.id
ALTER TABLE adm_role_versions
  ADD CONSTRAINT fk_adm_role_versions_changed_by
  FOREIGN KEY (changed_by)
  REFERENCES adm_members(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK 19: adm_member_sessions.member_id → adm_members.id
ALTER TABLE adm_member_sessions
  ADD CONSTRAINT fk_adm_member_sessions_member
  FOREIGN KEY (member_id)
  REFERENCES adm_members(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- FK 20: adm_tenant_settings.tenant_id → adm_tenants.id
ALTER TABLE adm_tenant_settings
  ADD CONSTRAINT fk_adm_tenant_settings_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES adm_tenants(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;


-- ============================================
-- SECTION 6: DOCUMENTATION FK FUTURES
-- Description: FK vers modules PAS ENCORE CRÉÉS
-- Format strict pour extraction automatique
-- ============================================

-- IMPORTANT: Module ADM ne dépend d'aucun module futur.
-- Tous les autres modules (DIR, DOC, CRM, BIL, SUP, RID, FLT, SCH, TRP, REV, FIN)
-- créeront des FK vers ADM dans leurs propres fichiers SQL (Section 5).

-- Le module ADM est totalement autonome après cette session.
-- Aucune FK future à documenter.


-- ============================================
-- SECTION 7: DOCUMENTATION INDEXES
-- Description: Tous les indexes du module ADM
-- Format strict pour extraction automatique
-- ============================================

-- IMPORTANT: Ces indexes ne sont PAS créés maintenant.
-- Ils seront créés dans 99_pending_indexes.sql (Session 14).

-- ============================================
-- INDEXES BTREE - COLONNES FK
-- ============================================

-- INDEX-ADM-001: adm_members.tenant_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_members_tenant
--      ON adm_members(tenant_id);

-- INDEX-ADM-002: adm_members.default_role_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_members_default_role
--      ON adm_members(default_role_id);

-- INDEX-ADM-003: adm_roles.tenant_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_roles_tenant
--      ON adm_roles(tenant_id);

-- INDEX-ADM-004: adm_roles.parent_role_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_roles_parent
--      ON adm_roles(parent_role_id);

-- INDEX-ADM-005: adm_member_roles.member_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_member_roles_member
--      ON adm_member_roles(member_id);

-- INDEX-ADM-006: adm_member_roles.role_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_member_roles_role
--      ON adm_member_roles(role_id);

-- INDEX-ADM-007: adm_member_roles.assigned_by
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_member_roles_assigned_by
--      ON adm_member_roles(assigned_by);

-- INDEX-ADM-008: adm_audit_logs.tenant_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_tenant
--      ON adm_audit_logs(tenant_id);

-- INDEX-ADM-009: adm_audit_logs.member_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_user
--      ON adm_audit_logs(member_id);

-- INDEX-ADM-010: adm_provider_employees.supervisor_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_provider_employees_supervisor
--      ON adm_provider_employees(supervisor_id);

-- INDEX-ADM-011: adm_tenant_lifecycle_events.tenant_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenant_lifecycle_events_tenant
--      ON adm_tenant_lifecycle_events(tenant_id);

-- INDEX-ADM-012: adm_tenant_lifecycle_events.performed_by
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenant_lifecycle_events_performed_by
--      ON adm_tenant_lifecycle_events(performed_by);

-- INDEX-ADM-013: adm_invitations.tenant_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_invitations_tenant
--      ON adm_invitations(tenant_id);

-- INDEX-ADM-014: adm_invitations.sent_by
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_invitations_sent_by
--      ON adm_invitations(sent_by);

-- INDEX-ADM-015: adm_invitations.accepted_by_member_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_invitations_accepted_by
--      ON adm_invitations(accepted_by_member_id);

-- INDEX-ADM-016: adm_role_permissions.role_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_role_permissions_role
--      ON adm_role_permissions(role_id);

-- INDEX-ADM-017: adm_role_versions.role_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_role_versions_role
--      ON adm_role_versions(role_id);

-- INDEX-ADM-018: adm_role_versions.changed_by
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_role_versions_changed_by
--      ON adm_role_versions(changed_by);

-- INDEX-ADM-019: adm_member_sessions.member_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_member_sessions_member
--      ON adm_member_sessions(member_id);

-- INDEX-ADM-020: adm_tenant_settings.tenant_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenant_settings_tenant
--      ON adm_tenant_settings(tenant_id);

-- ============================================
-- INDEXES BTREE - COLONNES MÉTIER (déjà définis dans Prisma @@index)
-- ============================================

-- INDEX-ADM-021: adm_members(tenant_id, status)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_members_tenant_status
--      ON adm_members(tenant_id, status);

-- INDEX-ADM-022: adm_members.clerk_user_id
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_members_clerk_user
--      ON adm_members(clerk_user_id);

-- INDEX-ADM-023: adm_roles(tenant_id, is_system)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_roles_tenant_system
--      ON adm_roles(tenant_id, is_system);

-- INDEX-ADM-024: adm_roles(tenant_id, is_default)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_roles_tenant_default
--      ON adm_roles(tenant_id, is_default);

-- INDEX-ADM-025: adm_member_roles(member_id, is_primary)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_member_roles_member_primary
--      ON adm_member_roles(member_id, is_primary);

-- INDEX-ADM-026: adm_member_roles(valid_from, valid_until)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_member_roles_validity
--      ON adm_member_roles(valid_from, valid_until);

-- INDEX-ADM-027: adm_audit_logs(tenant_id, timestamp)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_tenant_timestamp
--      ON adm_audit_logs(tenant_id, timestamp);

-- INDEX-ADM-028: adm_audit_logs(category, severity, timestamp)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_category_severity
--      ON adm_audit_logs(category, severity, timestamp);

-- INDEX-ADM-029: adm_audit_logs(resource_type, resource_id)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_resource
--      ON adm_audit_logs(resource_type, resource_id);

-- INDEX-ADM-030: adm_provider_employees.department
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_provider_employees_department
--      ON adm_provider_employees(department);

-- INDEX-ADM-031: adm_provider_employees.role
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_provider_employees_role
--      ON adm_provider_employees(role);

-- INDEX-ADM-032: adm_tenant_lifecycle_events(tenant_id, event_date)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenant_lifecycle_events_tenant_date
--      ON adm_tenant_lifecycle_events(tenant_id, event_date);

-- INDEX-ADM-033: adm_tenant_lifecycle_events.event_type
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenant_lifecycle_events_type
--      ON adm_tenant_lifecycle_events(event_type);

-- INDEX-ADM-034: adm_tenant_lifecycle_events.next_action_date
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenant_lifecycle_events_next_action
--      ON adm_tenant_lifecycle_events(next_action_date);

-- INDEX-ADM-035: adm_invitations(tenant_id, status)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_invitations_tenant_status
--      ON adm_invitations(tenant_id, status);

-- INDEX-ADM-036: adm_invitations(email, status)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_invitations_email_status
--      ON adm_invitations(email, status);

-- INDEX-ADM-037: adm_invitations.expires_at
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_invitations_expires
--      ON adm_invitations(expires_at);

-- INDEX-ADM-038: adm_role_versions(role_id, created_at)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_role_versions_role_created
--      ON adm_role_versions(role_id, created_at);

-- INDEX-ADM-039: adm_member_sessions(member_id, expires_at)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_member_sessions_member_expires
--      ON adm_member_sessions(member_id, expires_at);

-- INDEX-ADM-040: adm_member_sessions.expires_at
-- TYPE: BTREE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_member_sessions_expires
--      ON adm_member_sessions(expires_at);

-- INDEX-ADM-041: adm_tenant_settings(tenant_id, category)
-- TYPE: BTREE COMPOSITE
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenant_settings_tenant_category
--      ON adm_tenant_settings(tenant_id, category);

-- ============================================
-- INDEXES GIN - COLONNES JSONB
-- ============================================

-- INDEX-ADM-042: adm_tenants.metadata
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenants_metadata
--      ON adm_tenants USING GIN(metadata);

-- INDEX-ADM-043: adm_members.notification_preferences
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_members_notification_prefs
--      ON adm_members USING GIN(notification_preferences);

-- INDEX-ADM-044: adm_roles.permissions
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_roles_permissions
--      ON adm_roles USING GIN(permissions);

-- INDEX-ADM-045: adm_audit_logs.details
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_details
--      ON adm_audit_logs USING GIN(details);

-- INDEX-ADM-046: adm_audit_logs.old_values
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_old_values
--      ON adm_audit_logs USING GIN(old_values);

-- INDEX-ADM-047: adm_audit_logs.new_values
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_new_values
--      ON adm_audit_logs USING GIN(new_values);

-- INDEX-ADM-048: adm_audit_logs.tags (array)
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_audit_logs_tags
--      ON adm_audit_logs USING GIN(tags);

-- INDEX-ADM-049: adm_provider_employees.permissions
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_provider_employees_permissions
--      ON adm_provider_employees USING GIN(permissions);

-- INDEX-ADM-050: adm_tenant_lifecycle_events.features_affected
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenant_lifecycle_events_features
--      ON adm_tenant_lifecycle_events USING GIN(features_affected);

-- INDEX-ADM-051: adm_tenant_lifecycle_events.notifications_sent
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenant_lifecycle_events_notifications
--      ON adm_tenant_lifecycle_events USING GIN(notifications_sent);

-- INDEX-ADM-052: adm_invitations.metadata
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_invitations_metadata
--      ON adm_invitations USING GIN(metadata);

-- INDEX-ADM-053: adm_role_permissions.conditions
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_role_permissions_conditions
--      ON adm_role_permissions USING GIN(conditions);

-- INDEX-ADM-054: adm_role_versions.permissions_snapshot
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_role_versions_snapshot
--      ON adm_role_versions USING GIN(permissions_snapshot);

-- INDEX-ADM-055: adm_tenant_settings.setting_value
-- TYPE: GIN
-- WHERE: -
-- SQL: CREATE INDEX IF NOT EXISTS idx_adm_tenant_settings_value
--      ON adm_tenant_settings USING GIN(setting_value);

-- ============================================
-- INDEXES UNIQUE (déjà définis dans Prisma @@unique)
-- ============================================

-- INDEX-ADM-056: adm_tenants.slug
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_tenants_slug
--      ON adm_tenants(slug);

-- INDEX-ADM-057: adm_members(tenant_id, email)
-- TYPE: UNIQUE COMPOSITE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_members_tenant_email
--      ON adm_members(tenant_id, email);

-- INDEX-ADM-058: adm_roles(tenant_id, slug)
-- TYPE: UNIQUE COMPOSITE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_roles_tenant_slug
--      ON adm_roles(tenant_id, slug);

-- INDEX-ADM-059: adm_member_roles(member_id, role_id, scope_type, scope_id)
-- TYPE: UNIQUE COMPOSITE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_member_roles_unique
--      ON adm_member_roles(member_id, role_id, scope_type, scope_id);

-- INDEX-ADM-060: adm_provider_employees.employee_number
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_provider_employees_number
--      ON adm_provider_employees(employee_number);

-- INDEX-ADM-061: adm_provider_employees.clerk_user_id
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_provider_employees_clerk
--      ON adm_provider_employees(clerk_user_id);

-- INDEX-ADM-062: adm_provider_employees.email
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_provider_employees_email
--      ON adm_provider_employees(email);

-- INDEX-ADM-063: adm_invitations.token
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_invitations_token
--      ON adm_invitations(token);

-- INDEX-ADM-064: adm_role_permissions(role_id, resource, action)
-- TYPE: UNIQUE COMPOSITE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_role_permissions_unique
--      ON adm_role_permissions(role_id, resource, action);

-- INDEX-ADM-065: adm_role_versions(role_id, version_number)
-- TYPE: UNIQUE COMPOSITE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_role_versions_unique
--      ON adm_role_versions(role_id, version_number);

-- INDEX-ADM-066: adm_member_sessions.token_hash
-- TYPE: UNIQUE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_member_sessions_token
--      ON adm_member_sessions(token_hash);

-- INDEX-ADM-067: adm_tenant_settings(tenant_id, setting_key)
-- TYPE: UNIQUE COMPOSITE
-- WHERE: -
-- SQL: CREATE UNIQUE INDEX IF NOT EXISTS idx_adm_tenant_settings_unique
--      ON adm_tenant_settings(tenant_id, setting_key);


-- ============================================
-- SECTION 8: GATEWAY 2 - VALIDATION POST-GÉNÉRATION
-- ============================================

-- STATISTIQUES GÉNÉRÉES:
-- Enums créés: 7
-- Tables modifiées (ALTER TABLE): 5
-- Nouvelles tables (CREATE TABLE): 7
-- FK internes créées: 6
-- FK externes créées: 14
-- FK futures documentées: 0
-- Indexes documentés: 67
-- Total lignes SQL exécutables: ~290

-- VÉRIFICATIONS AUTOMATIQUES:
-- [✓] Aucun DROP TABLE/COLUMN/TYPE dans le code exécutable
-- [✓] Aucun ALTER COLUMN TYPE dans le code exécutable
-- [✓] Aucun RENAME dans le code exécutable
-- [✓] Tous les IF NOT EXISTS présents (enums, tables, colonnes)
-- [✓] Tous les noms en snake_case (tables, colonnes, constraints, indexes)
-- [✓] Syntaxe DO $$ BEGIN ... EXCEPTION END $$; pour tous les enums
-- [✓] Toutes les FK avec ON DELETE et ON UPDATE explicites
-- [✓] Toutes les colonnes UUID avec type @db.Uuid
-- [✓] Toutes les colonnes TIMESTAMPTZ avec (6) pour microsecondes
-- [✓] Tous les indexes JSONB avec USING GIN
-- [✓] Tous les indexes UNIQUE correspondent au Prisma @@unique

-- POINTS D'ATTENTION:
-- [ℹ️] Tables V1: adm_member_roles et adm_audit_logs ont des colonnes supplémentaires
--      dans Prisma vs liste préliminaire (assignmentReason, sessionId, oldValues,
--      newValues, retentionUntil, tags) - Conformes au Prisma réel
-- [ℹ️] Nouvelles tables V2: Aucune n'a les colonnes audit complètes (created_by,
--      updated_by, deleted_at, deleted_by, metadata) - Décision architecturale validée
-- [ℹ️] adm_provider_employees: Pas de tenant_id (normal, employés FleetCore globaux)
-- [ℹ️] adm_tenant_settings: Pas de created_at (uniquement updated_at, normal pour settings)
-- [ℹ️] adm_tenant_lifecycle_events: Pas de updated_at (événement immuable, normal)
-- [ℹ️] adm_role_permissions: Pas de updated_at (permission immuable, versioning via adm_role_versions)
-- [✓] 67 indexes documentés (20 FK + 21 métier + 15 GIN + 11 UNIQUE)
-- [✓] Toutes les colonnes FK ont un index BTREE
-- [✓] Toutes les colonnes JSONB ont un index GIN
-- [✓] Toutes les contraintes UNIQUE du Prisma sont documentées

-- DÉPENDANCES CIRCULAIRES RÉSOLUES:
-- Le module ADM contient plusieurs relations circulaires entre ses tables:
--   - adm_members ↔ adm_tenants (membre → tenant, tenant → membres)
--   - adm_members ↔ adm_roles (membre → rôle par défaut, rôle → membres)
--   - adm_roles ↔ adm_roles (parent_role_id récursif)
--   - adm_provider_employees ↔ adm_provider_employees (supervisor_id récursif)
-- Ces FK sont toutes créées dans cette session car toutes les tables ADM
-- sont créées ensemble. Ordre de création respecté pour éviter les erreurs.

-- MODULE SUIVANT:
-- Tous les modules suivants (DIR, DOC, CRM, BIL, SUP, RID, FLT, SCH, TRP, REV, FIN)
-- pourront créer des FK vers ADM car toutes les tables ADM seront disponibles.

-- ============================================
-- FIN DU FICHIER
-- Session 1/13 complétée
-- Prochaine session: 2/13 - Module DIR (Référentiels)
-- ============================================
