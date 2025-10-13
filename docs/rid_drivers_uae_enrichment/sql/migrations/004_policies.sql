-- 004_policies.sql
-- Exemple de policies RLS (à adapter)
CREATE POLICY IF NOT EXISTS rid_drivers_sel ON public.rid_drivers
FOR SELECT USING (
  tenant_id::text = coalesce((auth.jwt() ->> 'tenant_id'), '')
  AND deleted_at IS NULL
);

CREATE POLICY IF NOT EXISTS rid_driver_languages_rw ON public.rid_driver_languages
FOR ALL USING (
  tenant_id::text = coalesce((auth.jwt() ->> 'tenant_id'), '')
) WITH CHECK (
  tenant_id::text = coalesce((auth.jwt() ->> 'tenant_id'), '')
);
