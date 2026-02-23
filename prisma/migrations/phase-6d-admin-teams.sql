
-- Phase 6D: admin() plugin + teams
-- Execute manually in Supabase SQL Editor

-- 1. Admin plugin columns on auth_user
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS ban_expires TIMESTAMPTZ;

-- 2. Admin plugin column on auth_session
ALTER TABLE auth_session ADD COLUMN IF NOT EXISTS impersonated_by TEXT;

-- 3. Teams column on auth_session
ALTER TABLE auth_session ADD COLUMN IF NOT EXISTS active_team_id TEXT;

-- 4. Teams table
CREATE TABLE IF NOT EXISTS auth_team (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES auth_organization(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_auth_team_organization_id ON auth_team(organization_id);

-- 5. Team members table
CREATE TABLE IF NOT EXISTS auth_team_member (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES auth_team(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_team_member_team_id ON auth_team_member(team_id);
CREATE INDEX IF NOT EXISTS idx_auth_team_member_user_id ON auth_team_member(user_id);

-- 6. Teams column on auth_invitation
ALTER TABLE auth_invitation ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES auth_team(id) ON DELETE SET NULL;

-- 7. RLS on new tables (consistent with other auth_* tables)
ALTER TABLE auth_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_team_member ENABLE ROW LEVEL SECURITY;

-- 8. Set CEO as admin
UPDATE auth_user SET role = 'admin' WHERE email = 'mfodil@outlook.com';
