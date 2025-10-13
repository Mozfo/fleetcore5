-- 001_alter_rid_drivers_add_fields.sql
ALTER TABLE public.rid_drivers
  ADD COLUMN IF NOT EXISTS date_of_birth date NULL
    CHECK (date_of_birth <= CURRENT_DATE),
  ADD COLUMN IF NOT EXISTS gender text NULL
    CHECK (gender IN ('male','female','unspecified')),
  ADD COLUMN IF NOT EXISTS nationality char(2) NULL
    CHECK (nationality ~ '^[A-Za-z]{2}$'),
  ADD COLUMN IF NOT EXISTS hire_date date NULL,
  ADD COLUMN IF NOT EXISTS employment_status text NOT NULL DEFAULT 'active'
    CHECK (employment_status IN ('active','on_leave','suspended','terminated')),
  ADD COLUMN IF NOT EXISTS cooperation_type text NULL
    CHECK (cooperation_type IN ('employee','contractor','owner_operator','partner_driver')),
  ADD COLUMN IF NOT EXISTS emergency_contact_name text NULL,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text NULL;

CREATE INDEX IF NOT EXISTS rid_drivers_dob_idx
  ON public.rid_drivers (date_of_birth) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_drivers_nationality_idx
  ON public.rid_drivers (nationality) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_drivers_hire_date_idx
  ON public.rid_drivers (hire_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_drivers_employment_status_idx
  ON public.rid_drivers (employment_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_drivers_cooperation_type_idx
  ON public.rid_drivers (cooperation_type) WHERE deleted_at IS NULL;
