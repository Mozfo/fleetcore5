
-- 000_rid_drivers_enrichment_all.sql
-- Transactionnelle, Postgres 15+, à exécuter une seule fois
BEGIN;

-- 1) Colonnes rid_drivers (ajout sans défaut risqué)
ALTER TABLE public.rid_drivers
  ADD COLUMN IF NOT EXISTS date_of_birth date NULL
    CHECK (date_of_birth <= CURRENT_DATE),
  ADD COLUMN IF NOT EXISTS gender text NULL,
  ADD COLUMN IF NOT EXISTS nationality char(2) NULL
    CHECK (nationality ~ '^[A-Za-z]{2}$'),
  ADD COLUMN IF NOT EXISTS hire_date date NULL,
  ADD COLUMN IF NOT EXISTS employment_status text NULL, -- NULLABLE pour backfill sûr
  ADD COLUMN IF NOT EXISTS cooperation_type text NULL,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text NULL,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text NULL;

-- 2) Index utiles
CREATE INDEX IF NOT EXISTS rid_drivers_dob_idx
  ON public.rid_drivers (date_of_birth) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_drivers_nationality_idx
  ON public.rid_drivers (nationality) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_drivers_hire_date_idx
  ON public.rid_drivers (hire_date) WHERE deleted_at IS NULL;

-- 3) Backfill EMPLOYMENT_STATUS depuis driver_status
UPDATE public.rid_drivers
SET employment_status = CASE driver_status
  WHEN 'active' THEN 'active'
  WHEN 'suspended' THEN 'suspended'
  WHEN 'terminated' THEN 'terminated'
  ELSE 'active'
END,
updated_at = now()
WHERE employment_status IS NULL;

-- 4) Contraintes et défauts après backfill
ALTER TABLE public.rid_drivers
  ALTER COLUMN employment_status SET DEFAULT 'active',
  ALTER COLUMN employment_status SET NOT NULL;

-- checks formels
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rid_drivers_employment_status_check'
  ) THEN
    ALTER TABLE public.rid_drivers
      ADD CONSTRAINT rid_drivers_employment_status_check
      CHECK (employment_status IN ('active','on_leave','suspended','terminated'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rid_drivers_gender_check'
  ) THEN
    ALTER TABLE public.rid_drivers
      ADD CONSTRAINT rid_drivers_gender_check
      CHECK (gender IS NULL OR gender IN ('male','female','unspecified'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rid_drivers_cooperation_type_check'
  ) THEN
    ALTER TABLE public.rid_drivers
      ADD CONSTRAINT rid_drivers_cooperation_type_check
      CHECK (cooperation_type IS NULL OR cooperation_type IN ('employee','contractor','owner_operator','partner_driver'));
  END IF;
END $$;

-- 5) Table langues (0..N)
CREATE TABLE IF NOT EXISTS public.rid_driver_languages (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  language_code char(2) NOT NULL CHECK (language_code ~ '^[A-Za-z]{2}$'),
  proficiency text NULL CHECK (proficiency IN ('basic','conversational','fluent','native')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason text NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS rid_driver_languages_unique
  ON public.rid_driver_languages (tenant_id, driver_id, language_code)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_driver_languages_lang_idx
  ON public.rid_driver_languages (language_code) WHERE deleted_at IS NULL;

-- 6) Trigger cohérence RH → opérationnel
CREATE OR REPLACE FUNCTION public.sync_driver_status_from_employment()
RETURNS trigger AS $$
BEGIN
  IF NEW.employment_status = 'terminated' THEN
    NEW.driver_status := 'terminated';
  ELSIF NEW.employment_status = 'suspended' AND NEW.driver_status <> 'terminated' THEN
    NEW.driver_status := 'suspended';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_driver_status ON public.rid_drivers;
CREATE TRIGGER trg_sync_driver_status
BEFORE INSERT OR UPDATE OF employment_status ON public.rid_drivers
FOR EACH ROW EXECUTE FUNCTION public.sync_driver_status_from_employment();

-- 7) Vue profil consolidé
CREATE OR REPLACE VIEW public.v_driver_profile AS
SELECT
  d.id AS driver_id,
  d.tenant_id,
  d.first_name, d.last_name, d.email, d.phone,
  d.date_of_birth, d.gender, d.nationality,
  d.hire_date, d.employment_status, d.driver_status,
  d.cooperation_type,
  d.emergency_contact_name, d.emergency_contact_phone,
  array_remove(array_agg(DISTINCT l.language_code) FILTER (WHERE l.deleted_at IS NULL), NULL) AS languages
FROM public.rid_drivers d
LEFT JOIN public.rid_driver_languages l
  ON l.driver_id = d.id AND l.tenant_id = d.tenant_id AND l.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.tenant_id, d.first_name, d.last_name, d.email, d.phone,
         d.date_of_birth, d.gender, d.nationality,
         d.hire_date, d.employment_status, d.driver_status,
         d.cooperation_type, d.emergency_contact_name, d.emergency_contact_phone;

-- 8) RLS policies (current_setting)
-- Lecture intra-tenant
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rid_drivers' AND policyname='rid_drivers_select_cs') THEN
    CREATE POLICY rid_drivers_select_cs ON public.rid_drivers
    FOR SELECT USING (
      tenant_id::text = COALESCE(current_setting('app.current_tenant_id', true),'')
      AND deleted_at IS NULL
    );
  END IF;
END $$;

-- Ecriture (INSERT/UPDATE/DELETE) intra-tenant
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rid_drivers' AND policyname='rid_drivers_write_cs') THEN
    CREATE POLICY rid_drivers_write_cs ON public.rid_drivers
    FOR ALL USING (
      tenant_id::text = COALESCE(current_setting('app.current_tenant_id', true),'')
    ) WITH CHECK (
      tenant_id::text = COALESCE(current_setting('app.current_tenant_id', true),'')
    );
  END IF;
END $$;

-- Table langues
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rid_driver_languages' AND policyname='rid_driver_languages_cs') THEN
    CREATE POLICY rid_driver_languages_cs ON public.rid_driver_languages
    FOR ALL USING (
      tenant_id::text = COALESCE(current_setting('app.current_tenant_id', true),'')
    ) WITH CHECK (
      tenant_id::text = COALESCE(current_setting('app.current_tenant_id', true),'')
    );
  END IF;
END $$;

-- 9) Helpers RPC + wrappers
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.set_tenant(p_tenant_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER AS $$
  SELECT set_config('app.current_tenant_id', p_tenant_id::text, true);
$$;

-- Wrapper d'INSERT simple (exemple)
CREATE OR REPLACE FUNCTION app.rid_driver_insert(
  p_tenant_id uuid,
  p_first_name text,
  p_last_name  text,
  p_email text,
  p_phone text
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
  INSERT INTO public.rid_drivers(tenant_id, first_name, last_name, email, phone)
  VALUES (p_tenant_id, p_first_name, p_last_name, p_email, p_phone)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Wrapper de SELECT profil (exemple)
CREATE OR REPLACE FUNCTION app.rid_driver_profile_get(
  p_tenant_id uuid,
  p_driver_id uuid
) RETURNS SETOF public.v_driver_profile LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
  RETURN QUERY
  SELECT * FROM public.v_driver_profile v
  WHERE v.driver_id = p_driver_id AND v.tenant_id = p_tenant_id;
END;
$$;

-- (Option DEV) Allow-all policy (commentée par défaut)
-- -- CREATE POLICY dev_allow_all ON public.rid_drivers FOR ALL USING (true) WITH CHECK (true);

COMMIT;
