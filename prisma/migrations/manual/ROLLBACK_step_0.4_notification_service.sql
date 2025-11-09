-- ============================================
-- ROLLBACK: Step 0.4 - Notification Service & Templates
-- Purpose: Annuler la migration Step 0.4 (exécutée par erreur sur PROD)
-- Date: 8 Novembre 2025
-- ============================================

BEGIN;

-- ============================================
-- SECTION 1: DROP FOREIGN KEY CONSTRAINTS
-- ============================================

ALTER TABLE public.adm_notification_logs DROP CONSTRAINT IF EXISTS fk_adm_notification_logs_deleted_by;
ALTER TABLE public.adm_notification_logs DROP CONSTRAINT IF EXISTS fk_adm_notification_logs_updated_by;
ALTER TABLE public.adm_notification_logs DROP CONSTRAINT IF EXISTS fk_adm_notification_logs_created_by;
ALTER TABLE public.adm_notification_logs DROP CONSTRAINT IF EXISTS fk_adm_notification_logs_recipient_id;
ALTER TABLE public.adm_notification_logs DROP CONSTRAINT IF EXISTS fk_adm_notification_logs_tenant;

ALTER TABLE public.dir_notification_templates DROP CONSTRAINT IF EXISTS fk_dir_notification_templates_deleted_by;
ALTER TABLE public.dir_notification_templates DROP CONSTRAINT IF EXISTS fk_dir_notification_templates_updated_by;
ALTER TABLE public.dir_notification_templates DROP CONSTRAINT IF EXISTS fk_dir_notification_templates_created_by;

ALTER TABLE public.dir_country_locales DROP CONSTRAINT IF EXISTS fk_dir_country_locales_deleted_by;
ALTER TABLE public.dir_country_locales DROP CONSTRAINT IF EXISTS fk_dir_country_locales_updated_by;
ALTER TABLE public.dir_country_locales DROP CONSTRAINT IF EXISTS fk_dir_country_locales_created_by;


-- ============================================
-- SECTION 2: DROP INDEXES
-- ============================================

-- adm_notification_logs
DROP INDEX IF EXISTS idx_adm_notification_logs_tenant_created;
DROP INDEX IF EXISTS idx_adm_notification_logs_deleted_at;
DROP INDEX IF EXISTS idx_adm_notification_logs_created_at;
DROP INDEX IF EXISTS idx_adm_notification_logs_sent_at;
DROP INDEX IF EXISTS idx_adm_notification_logs_status;
DROP INDEX IF EXISTS idx_adm_notification_logs_channel;
DROP INDEX IF EXISTS idx_adm_notification_logs_template_code;
DROP INDEX IF EXISTS idx_adm_notification_logs_recipient_email;
DROP INDEX IF EXISTS idx_adm_notification_logs_recipient_id;
DROP INDEX IF EXISTS idx_adm_notification_logs_tenant;

-- dir_notification_templates
DROP INDEX IF EXISTS idx_dir_notification_templates_countries_gin;
DROP INDEX IF EXISTS idx_dir_notification_templates_locales_gin;
DROP INDEX IF EXISTS idx_dir_notification_templates_code_channel_status;
DROP INDEX IF EXISTS idx_dir_notification_templates_deleted_at;
DROP INDEX IF EXISTS idx_dir_notification_templates_status;
DROP INDEX IF EXISTS idx_dir_notification_templates_channel;
DROP INDEX IF EXISTS idx_dir_notification_templates_code;

-- dir_country_locales
DROP INDEX IF EXISTS idx_dir_country_locales_deleted_at;
DROP INDEX IF EXISTS idx_dir_country_locales_status;
DROP INDEX IF EXISTS idx_dir_country_locales_country;


-- ============================================
-- SECTION 3: DROP TABLES
-- ============================================

DROP TABLE IF EXISTS public.adm_notification_logs CASCADE;
DROP TABLE IF EXISTS public.dir_notification_templates CASCADE;
DROP TABLE IF EXISTS public.dir_country_locales CASCADE;


-- ============================================
-- SECTION 4: DROP ENUMS
-- ============================================

DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;


-- ============================================
-- SECTION 5: VALIDATION
-- ============================================

-- Vérifier que les tables sont supprimées
SELECT
  '✓ Tables supprimées' AS status,
  COUNT(*) AS remaining_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('dir_country_locales', 'dir_notification_templates', 'adm_notification_logs');

-- Vérifier que les enums sont supprimés
SELECT
  '✓ Enums supprimés' AS status,
  COUNT(*) AS remaining_count
FROM pg_type
WHERE typname IN ('notification_channel', 'notification_status');

COMMIT;

-- ============================================
-- ROLLBACK TERMINÉ
-- Les tables Step 0.4 ont été supprimées de PRODUCTION
-- ============================================
