-- 003_triggers_views.sql
CREATE OR REPLACE FUNCTION sync_driver_status_from_employment()
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
FOR EACH ROW EXECUTE FUNCTION sync_driver_status_from_employment();

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
