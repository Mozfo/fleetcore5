-- 002_create_rid_driver_languages.sql
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
