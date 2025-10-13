-- 005_backfill.sql
UPDATE public.rid_drivers
SET employment_status = CASE driver_status
  WHEN 'active' THEN 'active'
  WHEN 'suspended' THEN 'suspended'
  WHEN 'terminated' THEN 'terminated'
  ELSE 'active'
END,
updated_at = now()
WHERE employment_status IS NULL;

UPDATE public.rid_drivers d
SET cooperation_type = COALESCE(v.cooperation_type,'contractor'),
    updated_at = now()
FROM (
  SELECT t.tenant_id, t.driver_id,
         COALESCE(t.metadata->>'cooperation_type','contractor') AS cooperation_type
  FROM public.rid_driver_cooperation_terms t
  WHERE t.deleted_at IS NULL
    AND (t.expiry_date IS NULL OR t.expiry_date >= CURRENT_DATE)
    AND (t.effective_date IS NULL OR t.effective_date <= CURRENT_DATE)
) v
WHERE v.driver_id = d.id AND v.tenant_id = d.tenant_id
  AND d.deleted_at IS NULL;
