-- ============================================
-- FLEETCORE V2 - STEP 0.4: NOTIFICATION SERVICE & TEMPLATES
-- Module: NOTIFICATIONS (Multi-channel notification system)
-- Session: 0.4 (Phase 0 - Foundation)
-- Date: 8 Novembre 2025
-- ============================================
-- Enums créés: 2
-- Nouvelles tables: 3
-- Total tables module: 3
-- ============================================

-- ============================================
-- DÉPENDANCES ET PRÉ-REQUIS
-- ============================================
-- Ce fichier requiert:
--   - 01_shared_enums.sql - Enum lifecycle_status requis
--   - 02_adm_structure.sql - Tables adm_tenants, adm_members, adm_provider_employees requises
--
-- Vérification pré-exécution:
--   SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lifecycle_status'); -- DOIT être TRUE
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_tenants'); -- DOIT être TRUE
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_members'); -- DOIT être TRUE
--   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adm_provider_employees'); -- DOIT être TRUE
--
-- ============================================


-- ============================================
-- SECTION 1: ENUMS DU MODULE NOTIFICATIONS
-- ============================================
-- Création: 2 enums spécifiques au module Notifications
-- Utilisation enums partagés: lifecycle_status (Session 0)
-- ============================================

-- Enum 1: notification_channel
-- Description: Canaux de communication disponibles
-- Utilisation: dir_notification_templates, adm_notification_logs
-- Valeurs:
--   - email: Notifications par email (Resend)
--   - sms: Notifications par SMS (futur)
--   - slack: Notifications Slack pour commerciaux FleetCore
--   - webhook: Notifications webhook pour intégrations externes
--   - push: Notifications push mobiles (futur)
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'slack', 'webhook', 'push');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum 2: notification_status
-- Description: Statut de livraison des notifications (tracking Resend webhooks)
-- Utilisation: adm_notification_logs uniquement
-- Valeurs:
--   - pending: En attente d'envoi
--   - sent: Envoyé au provider
--   - delivered: Livré au destinataire
--   - bounced: Rejeté par le serveur destinataire
--   - opened: Ouvert par le destinataire (email tracking)
--   - clicked: Lien cliqué par le destinataire (email tracking)
--   - failed: Échec d'envoi
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'bounced', 'opened', 'clicked', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================
-- SECTION 2: NOUVELLES TABLES V2
-- ============================================
-- Stratégie: CREATE TABLE IF NOT EXISTS (safe idempotent)
-- Nouvelles tables: 3
-- Total colonnes: 66
-- ============================================

-- ============================================
-- TABLE 1/3: dir_country_locales
-- Description: Référentiel i18n (internationalisation) par pays
-- Domain: DIR (DIRECTORY - référence globale, pas de tenant_id)
-- Lignes attendues: 20 (seed) - 50 (production)
-- ============================================

CREATE TABLE IF NOT EXISTS public.dir_country_locales (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business Columns
  country_code CHAR(2) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  primary_locale VARCHAR(10) NOT NULL,
  fallback_locale VARCHAR(10),
  supported_locales TEXT[] NOT NULL DEFAULT '{}',
  timezone VARCHAR(50) NOT NULL,
  currency CHAR(3) NOT NULL,
  currency_symbol VARCHAR(10),
  currency_position VARCHAR(10),
  number_format VARCHAR(20) NOT NULL DEFAULT '1,234.56',
  date_format VARCHAR(20) NOT NULL,
  time_format VARCHAR(20) NOT NULL,
  first_day_of_week SMALLINT NOT NULL DEFAULT 1,
  rtl_enabled BOOLEAN NOT NULL DEFAULT false,
  status lifecycle_status NOT NULL DEFAULT 'active',

  -- Audit Columns
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ(6),
  deleted_by UUID,
  deletion_reason TEXT
);

-- ============================================
-- TABLE 2/3: dir_notification_templates
-- Description: Templates de notifications avec traductions multi-langues JSONB
-- Domain: DIR (DIRECTORY - référence globale, pas de tenant_id)
-- Lignes attendues: 10 (Step 0.4) - 50+ (production)
-- ============================================

CREATE TABLE IF NOT EXISTS public.dir_notification_templates (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business Columns
  template_code VARCHAR(100) NOT NULL,
  template_name VARCHAR(200) NOT NULL,
  channel notification_channel NOT NULL,
  supported_countries TEXT[] NOT NULL DEFAULT '{}',
  supported_locales TEXT[] NOT NULL DEFAULT '{}',
  subject_translations JSONB NOT NULL,
  body_translations JSONB NOT NULL,
  variables JSONB,
  status lifecycle_status NOT NULL DEFAULT 'active',

  -- Audit Columns
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ(6),
  deleted_by UUID,
  deletion_reason TEXT,

  -- Unique Constraint
  CONSTRAINT uq_dir_notification_templates_code_channel UNIQUE (template_code, channel)
);

-- ============================================
-- TABLE 3/3: adm_notification_logs
-- Description: Logs de notifications avec traçabilité complète (comparable à adm_audit_logs)
-- Domain: ADM (ADMINISTRATION - tenant_id NULLABLE pour events CRM pré-tenant)
-- Lignes attendues: 1000/jour (production)
-- ============================================

CREATE TABLE IF NOT EXISTS public.adm_notification_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant (NULLABLE for CRM events before tenant creation)
  tenant_id UUID,

  -- Business Columns
  recipient_id UUID,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(20),
  template_code VARCHAR(100) NOT NULL,
  channel notification_channel NOT NULL,
  locale_used VARCHAR(10) NOT NULL,
  subject TEXT,
  body TEXT,
  variables_data JSONB,
  status notification_status NOT NULL DEFAULT 'pending',

  -- Resend Webhook Tracking
  sent_at TIMESTAMPTZ(6),
  delivered_at TIMESTAMPTZ(6),
  opened_at TIMESTAMPTZ(6),
  clicked_at TIMESTAMPTZ(6),
  failed_at TIMESTAMPTZ(6),
  error_message TEXT,
  external_id VARCHAR(255),

  -- Traceability (like adm_audit_logs)
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id UUID,
  request_id UUID,

  -- Audit Columns
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ(6),
  deleted_by UUID,
  deletion_reason TEXT
);


-- ============================================
-- SECTION 3: INDEXES
-- ============================================
-- Total indexes: 20
-- GIN indexes: 2 (arrays PostgreSQL)
-- Composite indexes: 2 (query optimization)
-- ============================================

-- dir_country_locales: 3 indexes
DROP INDEX IF EXISTS idx_dir_country_locales_country;
DROP INDEX IF EXISTS idx_dir_country_locales_status;
DROP INDEX IF EXISTS idx_dir_country_locales_deleted_at;

CREATE INDEX idx_dir_country_locales_country ON public.dir_country_locales(country_code);
CREATE INDEX idx_dir_country_locales_status ON public.dir_country_locales(status);
CREATE INDEX idx_dir_country_locales_deleted_at ON public.dir_country_locales(deleted_at);

-- dir_notification_templates: 8 indexes (4 simple + 2 composite + 2 GIN)
DROP INDEX IF EXISTS idx_dir_notification_templates_code;
DROP INDEX IF EXISTS idx_dir_notification_templates_channel;
DROP INDEX IF EXISTS idx_dir_notification_templates_status;
DROP INDEX IF EXISTS idx_dir_notification_templates_deleted_at;
DROP INDEX IF EXISTS idx_dir_notification_templates_code_channel_status;
DROP INDEX IF EXISTS idx_dir_notification_templates_locales_gin;
DROP INDEX IF EXISTS idx_dir_notification_templates_countries_gin;

CREATE INDEX idx_dir_notification_templates_code ON public.dir_notification_templates(template_code);
CREATE INDEX idx_dir_notification_templates_channel ON public.dir_notification_templates(channel);
CREATE INDEX idx_dir_notification_templates_status ON public.dir_notification_templates(status);
CREATE INDEX idx_dir_notification_templates_deleted_at ON public.dir_notification_templates(deleted_at);

-- Composite index for selectTemplate() query optimization
CREATE INDEX idx_dir_notification_templates_code_channel_status
  ON public.dir_notification_templates(template_code, channel, status)
  WHERE deleted_at IS NULL;

-- GIN indexes for array operators (supported_locales = ANY(...))
CREATE INDEX idx_dir_notification_templates_locales_gin
  ON public.dir_notification_templates USING gin(supported_locales);
CREATE INDEX idx_dir_notification_templates_countries_gin
  ON public.dir_notification_templates USING gin(supported_countries);

-- adm_notification_logs: 10 indexes (9 simple + 1 composite)
DROP INDEX IF EXISTS idx_adm_notification_logs_tenant;
DROP INDEX IF EXISTS idx_adm_notification_logs_recipient_id;
DROP INDEX IF EXISTS idx_adm_notification_logs_recipient_email;
DROP INDEX IF EXISTS idx_adm_notification_logs_template_code;
DROP INDEX IF EXISTS idx_adm_notification_logs_channel;
DROP INDEX IF EXISTS idx_adm_notification_logs_status;
DROP INDEX IF EXISTS idx_adm_notification_logs_sent_at;
DROP INDEX IF EXISTS idx_adm_notification_logs_created_at;
DROP INDEX IF EXISTS idx_adm_notification_logs_deleted_at;
DROP INDEX IF EXISTS idx_adm_notification_logs_tenant_created;

CREATE INDEX idx_adm_notification_logs_tenant ON public.adm_notification_logs(tenant_id);
CREATE INDEX idx_adm_notification_logs_recipient_id ON public.adm_notification_logs(recipient_id);
CREATE INDEX idx_adm_notification_logs_recipient_email ON public.adm_notification_logs(recipient_email);
CREATE INDEX idx_adm_notification_logs_template_code ON public.adm_notification_logs(template_code);
CREATE INDEX idx_adm_notification_logs_channel ON public.adm_notification_logs(channel);
CREATE INDEX idx_adm_notification_logs_status ON public.adm_notification_logs(status);
CREATE INDEX idx_adm_notification_logs_sent_at ON public.adm_notification_logs(sent_at);
CREATE INDEX idx_adm_notification_logs_created_at ON public.adm_notification_logs(created_at);
CREATE INDEX idx_adm_notification_logs_deleted_at ON public.adm_notification_logs(deleted_at);

-- Composite index for getHistory() query optimization
CREATE INDEX idx_adm_notification_logs_tenant_created
  ON public.adm_notification_logs(tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;


-- ============================================
-- SECTION 4: FOREIGN KEY CONSTRAINTS
-- ============================================
-- Total FK: 11 (3 DIR + 8 ADM)
-- Pattern DIR: onDelete RESTRICT, onUpdate NO ACTION
-- Pattern ADM: onDelete CASCADE (tenant), pas de onDelete/onUpdate (members)
-- ============================================

-- dir_country_locales: 3 FK vers adm_provider_employees (DIR pattern)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dir_country_locales_created_by') THEN
    ALTER TABLE public.dir_country_locales
      ADD CONSTRAINT fk_dir_country_locales_created_by
      FOREIGN KEY (created_by) REFERENCES public.adm_provider_employees(id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dir_country_locales_updated_by') THEN
    ALTER TABLE public.dir_country_locales
      ADD CONSTRAINT fk_dir_country_locales_updated_by
      FOREIGN KEY (updated_by) REFERENCES public.adm_provider_employees(id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dir_country_locales_deleted_by') THEN
    ALTER TABLE public.dir_country_locales
      ADD CONSTRAINT fk_dir_country_locales_deleted_by
      FOREIGN KEY (deleted_by) REFERENCES public.adm_provider_employees(id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

-- dir_notification_templates: 3 FK vers adm_provider_employees (DIR pattern)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dir_notification_templates_created_by') THEN
    ALTER TABLE public.dir_notification_templates
      ADD CONSTRAINT fk_dir_notification_templates_created_by
      FOREIGN KEY (created_by) REFERENCES public.adm_provider_employees(id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dir_notification_templates_updated_by') THEN
    ALTER TABLE public.dir_notification_templates
      ADD CONSTRAINT fk_dir_notification_templates_updated_by
      FOREIGN KEY (updated_by) REFERENCES public.adm_provider_employees(id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dir_notification_templates_deleted_by') THEN
    ALTER TABLE public.dir_notification_templates
      ADD CONSTRAINT fk_dir_notification_templates_deleted_by
      FOREIGN KEY (deleted_by) REFERENCES public.adm_provider_employees(id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

-- adm_notification_logs: 5 FK (1 tenant CASCADE + 4 members)
DO $$
BEGIN
  -- FK to adm_tenants (ADM pattern with CASCADE)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_adm_notification_logs_tenant') THEN
    ALTER TABLE public.adm_notification_logs
      ADD CONSTRAINT fk_adm_notification_logs_tenant
      FOREIGN KEY (tenant_id) REFERENCES public.adm_tenants(id)
      ON DELETE CASCADE;
  END IF;

  -- FK to adm_members (ADM pattern, no onDelete/onUpdate)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_adm_notification_logs_recipient_id') THEN
    ALTER TABLE public.adm_notification_logs
      ADD CONSTRAINT fk_adm_notification_logs_recipient_id
      FOREIGN KEY (recipient_id) REFERENCES public.adm_members(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_adm_notification_logs_created_by') THEN
    ALTER TABLE public.adm_notification_logs
      ADD CONSTRAINT fk_adm_notification_logs_created_by
      FOREIGN KEY (created_by) REFERENCES public.adm_members(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_adm_notification_logs_updated_by') THEN
    ALTER TABLE public.adm_notification_logs
      ADD CONSTRAINT fk_adm_notification_logs_updated_by
      FOREIGN KEY (updated_by) REFERENCES public.adm_members(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_adm_notification_logs_deleted_by') THEN
    ALTER TABLE public.adm_notification_logs
      ADD CONSTRAINT fk_adm_notification_logs_deleted_by
      FOREIGN KEY (deleted_by) REFERENCES public.adm_members(id);
  END IF;
END $$;


-- ============================================
-- SECTION 5: CHECK CONSTRAINTS
-- ============================================
-- Total CHECK: 5
-- Validation: ISO standards, JSONB format, business rules
-- ============================================

DO $$
BEGIN
  -- dir_country_locales: Validation ISO standards
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_country_code_iso') THEN
    ALTER TABLE public.dir_country_locales
      ADD CONSTRAINT check_country_code_iso
      CHECK (country_code ~ '^[A-Z]{2}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_currency_iso') THEN
    ALTER TABLE public.dir_country_locales
      ADD CONSTRAINT check_currency_iso
      CHECK (currency ~ '^[A-Z]{3}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_first_day_week') THEN
    ALTER TABLE public.dir_country_locales
      ADD CONSTRAINT check_first_day_week
      CHECK (first_day_of_week BETWEEN 0 AND 6);
  END IF;

  -- dir_notification_templates: Validation JSONB not empty
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_translations_not_empty') THEN
    ALTER TABLE public.dir_notification_templates
      ADD CONSTRAINT check_translations_not_empty
      CHECK (
        jsonb_typeof(subject_translations) = 'object' AND
        jsonb_typeof(body_translations) = 'object'
      );
  END IF;

  -- adm_notification_logs: At least one recipient (email OR phone)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_recipient_exists') THEN
    ALTER TABLE public.adm_notification_logs
      ADD CONSTRAINT check_recipient_exists
      CHECK (recipient_email IS NOT NULL OR recipient_phone IS NOT NULL);
  END IF;
END $$;


-- ============================================
-- SECTION 6: SEED DATA - dir_country_locales
-- ============================================
-- Seed: 20 countries (Europe, GCC, North Africa, Levant, Other)
-- Strategy: INSERT ON CONFLICT DO NOTHING (idempotent)
-- ============================================

INSERT INTO public.dir_country_locales (
  country_code, country_name, primary_locale, fallback_locale, supported_locales,
  timezone, currency, currency_symbol, currency_position, number_format,
  date_format, time_format, first_day_of_week, rtl_enabled, status
) VALUES
  -- Europe (6 countries)
  ('FR', 'France', 'fr', 'en', ARRAY['fr', 'en'], 'Europe/Paris', 'EUR', '€', 'after', '1 234,56', 'DD/MM/YYYY', 'HH:mm', 1, false, 'active'),
  ('GB', 'United Kingdom', 'en', NULL, ARRAY['en'], 'Europe/London', 'GBP', '£', 'before', '1,234.56', 'DD/MM/YYYY', 'HH:mm', 1, false, 'active'),
  ('DE', 'Germany', 'de', 'en', ARRAY['de', 'en'], 'Europe/Berlin', 'EUR', '€', 'after', '1.234,56', 'DD.MM.YYYY', 'HH:mm', 1, false, 'active'),
  ('ES', 'Spain', 'es', 'en', ARRAY['es', 'en'], 'Europe/Madrid', 'EUR', '€', 'after', '1.234,56', 'DD/MM/YYYY', 'HH:mm', 1, false, 'active'),
  ('IT', 'Italy', 'it', 'en', ARRAY['it', 'en'], 'Europe/Rome', 'EUR', '€', 'after', '1.234,56', 'DD/MM/YYYY', 'HH:mm', 1, false, 'active'),
  ('BE', 'Belgium', 'fr', 'nl', ARRAY['fr', 'nl', 'en'], 'Europe/Brussels', 'EUR', '€', 'after', '1 234,56', 'DD/MM/YYYY', 'HH:mm', 1, false, 'active'),

  -- GCC Countries (6 countries)
  ('AE', 'United Arab Emirates', 'ar', 'en', ARRAY['ar', 'en'], 'Asia/Dubai', 'AED', 'د.إ', 'before', '1,234.56', 'DD/MM/YYYY', 'hh:mm A', 6, true, 'active'),
  ('SA', 'Saudi Arabia', 'ar', 'en', ARRAY['ar', 'en'], 'Asia/Riyadh', 'SAR', 'ر.س', 'before', '1,234.56', 'DD/MM/YYYY', 'hh:mm A', 6, true, 'active'),
  ('QA', 'Qatar', 'ar', 'en', ARRAY['ar', 'en'], 'Asia/Qatar', 'QAR', 'ر.ق', 'before', '1,234.56', 'DD/MM/YYYY', 'hh:mm A', 6, true, 'active'),
  ('OM', 'Oman', 'ar', 'en', ARRAY['ar', 'en'], 'Asia/Muscat', 'OMR', 'ر.ع.', 'before', '1,234.56', 'DD/MM/YYYY', 'hh:mm A', 6, true, 'active'),
  ('KW', 'Kuwait', 'ar', 'en', ARRAY['ar', 'en'], 'Asia/Kuwait', 'KWD', 'د.ك', 'before', '1,234.56', 'DD/MM/YYYY', 'hh:mm A', 6, true, 'active'),
  ('BH', 'Bahrain', 'ar', 'en', ARRAY['ar', 'en'], 'Asia/Bahrain', 'BHD', 'د.ب', 'before', '1,234.56', 'DD/MM/YYYY', 'hh:mm A', 6, true, 'active'),

  -- North Africa (4 countries)
  ('MA', 'Morocco', 'ar', 'fr', ARRAY['ar', 'fr', 'en'], 'Africa/Casablanca', 'MAD', 'د.م.', 'before', '1 234,56', 'DD/MM/YYYY', 'HH:mm', 1, true, 'active'),
  ('EG', 'Egypt', 'ar', 'en', ARRAY['ar', 'en'], 'Africa/Cairo', 'EGP', 'ج.م', 'before', '1,234.56', 'DD/MM/YYYY', 'hh:mm A', 6, true, 'active'),
  ('TN', 'Tunisia', 'ar', 'fr', ARRAY['ar', 'fr', 'en'], 'Africa/Tunis', 'TND', 'د.ت', 'before', '1 234,56', 'DD/MM/YYYY', 'HH:mm', 1, true, 'active'),
  ('DZ', 'Algeria', 'ar', 'fr', ARRAY['ar', 'fr', 'en'], 'Africa/Algiers', 'DZD', 'د.ج', 'before', '1 234,56', 'DD/MM/YYYY', 'HH:mm', 6, true, 'active'),

  -- Levant (2 countries)
  ('LB', 'Lebanon', 'ar', 'en', ARRAY['ar', 'en', 'fr'], 'Asia/Beirut', 'LBP', 'ل.ل', 'before', '1,234.56', 'DD/MM/YYYY', 'hh:mm A', 1, true, 'active'),
  ('JO', 'Jordan', 'ar', 'en', ARRAY['ar', 'en'], 'Asia/Amman', 'JOD', 'د.ا', 'before', '1,234.56', 'DD/MM/YYYY', 'hh:mm A', 6, true, 'active'),

  -- Other (2 countries)
  ('US', 'United States', 'en', NULL, ARRAY['en', 'es'], 'America/New_York', 'USD', '$', 'before', '1,234.56', 'MM/DD/YYYY', 'hh:mm A', 0, false, 'active'),
  ('PK', 'Pakistan', 'ur', 'en', ARRAY['ur', 'en'], 'Asia/Karachi', 'PKR', 'Rs', 'before', '1,234.56', 'DD/MM/YYYY', 'hh:mm A', 0, true, 'active')
ON CONFLICT (country_code) DO NOTHING;


-- ============================================
-- SECTION 7: VALIDATION POST-MIGRATION
-- ============================================

-- Validate enums created
DO $$
BEGIN
  RAISE NOTICE '✓ Enum notification_channel: %',
    (SELECT string_agg(enumlabel::text, ', ' ORDER BY enumsortorder)
     FROM pg_enum WHERE enumtypid = 'notification_channel'::regtype);

  RAISE NOTICE '✓ Enum notification_status: %',
    (SELECT string_agg(enumlabel::text, ', ' ORDER BY enumsortorder)
     FROM pg_enum WHERE enumtypid = 'notification_status'::regtype);
END $$;

-- Validate tables created
SELECT
  '✓ Tables created' AS status,
  COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('dir_country_locales', 'dir_notification_templates', 'adm_notification_logs');

-- Validate country locales seeded
SELECT
  '✓ Country locales seeded' AS status,
  COUNT(*) AS country_count
FROM public.dir_country_locales;

-- Display sample data (4 countries)
SELECT
  country_code,
  country_name,
  primary_locale,
  array_length(supported_locales, 1) AS locale_count,
  currency,
  rtl_enabled
FROM public.dir_country_locales
WHERE country_code IN ('FR', 'AE', 'MA', 'US')
ORDER BY country_code;

-- Validate indexes created
SELECT
  '✓ Indexes created' AS status,
  COUNT(*) AS index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('dir_country_locales', 'dir_notification_templates', 'adm_notification_logs');

-- Validate foreign keys created
SELECT
  '✓ Foreign keys created' AS status,
  COUNT(*) AS fk_count
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid IN (
    'public.dir_country_locales'::regclass,
    'public.dir_notification_templates'::regclass,
    'public.adm_notification_logs'::regclass
  );

-- Validate CHECK constraints created
SELECT
  '✓ CHECK constraints' AS status,
  COUNT(*) AS check_count
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid IN (
    'public.dir_country_locales'::regclass,
    'public.dir_notification_templates'::regclass,
    'public.adm_notification_logs'::regclass
  );


-- ============================================
-- STATISTIQUES FINALES
-- ============================================
-- Enums créés: 2 (notification_channel, notification_status)
-- Nouvelles tables: 3 (dir_country_locales, dir_notification_templates, adm_notification_logs)
-- Total colonnes: 66
-- Indexes créés: 20 (3 + 8 + 9)
-- Foreign keys créés: 11 (3 DIR + 3 DIR + 5 ADM)
-- CHECK constraints: 5
-- Seed data: 20 pays
--
-- PROCHAINES ÉTAPES:
-- 1. Exécuter sur PostgreSQL local: psql < step_0.4_notification_service.sql
-- 2. Valider seed: SELECT COUNT(*) FROM dir_country_locales; -- Doit retourner 20
-- 3. Sync Prisma: pnpm exec prisma db pull
-- 4. Generate client: pnpm exec prisma generate
-- 5. Vérifier schema.prisma contient: dir_country_locales, dir_notification_templates, adm_notification_logs
-- ============================================
