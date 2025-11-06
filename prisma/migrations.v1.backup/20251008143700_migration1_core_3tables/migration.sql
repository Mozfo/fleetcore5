-- Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA extensions;

-- CreateTable
CREATE TABLE "public"."adm_tenants" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "subdomain" VARCHAR(100) NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "clerk_organization_id" VARCHAR(255),
    "vat_rate" DECIMAL(5,2),
    "currency" VARCHAR(3) DEFAULT 'EUR',
    "timezone" VARCHAR(50) DEFAULT 'Europe/Paris',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "adm_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adm_members" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "clerk_user_id" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone" VARCHAR(50),
    "role" VARCHAR(50) NOT NULL DEFAULT 'member',
    "last_login_at" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "adm_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_leads" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID,
    "full_name" VARCHAR(200) NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" VARCHAR(50),
    "company_name" VARCHAR(200),
    "company_size" VARCHAR(50),
    "country_code" VARCHAR(2) NOT NULL,
    "city" VARCHAR(100),
    "source" VARCHAR(100),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(100),
    "message" TEXT,
    "assigned_to" UUID,
    "status" VARCHAR(50) NOT NULL DEFAULT 'new',
    "priority" VARCHAR(50) DEFAULT 'medium',
    "contacted_at" TIMESTAMPTZ(6),
    "converted_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adm_tenants_country_code_idx" ON "public"."adm_tenants"("country_code");

-- CreateIndex
CREATE INDEX "adm_tenants_status_idx" ON "public"."adm_tenants"("status");

-- CreateIndex
CREATE INDEX "adm_tenants_deleted_at_idx" ON "public"."adm_tenants"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_tenants_created_by_idx" ON "public"."adm_tenants"("created_by");

-- CreateIndex
CREATE INDEX "adm_tenants_updated_by_idx" ON "public"."adm_tenants"("updated_by");

-- CreateIndex
CREATE INDEX "adm_tenants_metadata_idx" ON "public"."adm_tenants" USING GIN ("metadata");

-- CreateIndex
CREATE UNIQUE INDEX "adm_tenants_subdomain_deleted_at_key" ON "public"."adm_tenants"("subdomain", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "adm_tenants_clerk_organization_id_deleted_at_key" ON "public"."adm_tenants"("clerk_organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "adm_members_tenant_id_idx" ON "public"."adm_members"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_members_email_idx" ON "public"."adm_members"("email");

-- CreateIndex
CREATE INDEX "adm_members_clerk_user_id_idx" ON "public"."adm_members"("clerk_user_id");

-- CreateIndex
CREATE INDEX "adm_members_role_idx" ON "public"."adm_members"("role");

-- CreateIndex
CREATE INDEX "adm_members_status_idx" ON "public"."adm_members"("status");

-- CreateIndex
CREATE INDEX "adm_members_deleted_at_idx" ON "public"."adm_members"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_members_created_by_idx" ON "public"."adm_members"("created_by");

-- CreateIndex
CREATE INDEX "adm_members_updated_by_idx" ON "public"."adm_members"("updated_by");

-- CreateIndex
CREATE INDEX "adm_members_last_login_at_idx" ON "public"."adm_members"("last_login_at");

-- CreateIndex
CREATE INDEX "adm_members_metadata_idx" ON "public"."adm_members" USING GIN ("metadata");

-- CreateIndex
CREATE UNIQUE INDEX "adm_members_tenant_id_email_deleted_at_key" ON "public"."adm_members"("tenant_id", "email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "adm_members_tenant_id_clerk_user_id_deleted_at_key" ON "public"."adm_members"("tenant_id", "clerk_user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "crm_leads_tenant_id_idx" ON "public"."crm_leads"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_leads_email_idx" ON "public"."crm_leads"("email");

-- CreateIndex
CREATE INDEX "crm_leads_country_code_idx" ON "public"."crm_leads"("country_code");

-- CreateIndex
CREATE INDEX "crm_leads_status_idx" ON "public"."crm_leads"("status");

-- CreateIndex
CREATE INDEX "crm_leads_priority_idx" ON "public"."crm_leads"("priority");

-- CreateIndex
CREATE INDEX "crm_leads_assigned_to_idx" ON "public"."crm_leads"("assigned_to");

-- CreateIndex
CREATE INDEX "crm_leads_created_at_idx" ON "public"."crm_leads"("created_at" DESC);

-- CreateIndex
CREATE INDEX "crm_leads_deleted_at_idx" ON "public"."crm_leads"("deleted_at");

-- CreateIndex
CREATE INDEX "crm_leads_created_by_idx" ON "public"."crm_leads"("created_by");

-- CreateIndex
CREATE INDEX "crm_leads_updated_by_idx" ON "public"."crm_leads"("updated_by");

-- CreateIndex
CREATE INDEX "crm_leads_contacted_at_idx" ON "public"."crm_leads"("contacted_at");

-- CreateIndex
CREATE INDEX "crm_leads_metadata_idx" ON "public"."crm_leads" USING GIN ("metadata");

-- CreateIndex
CREATE UNIQUE INDEX "crm_leads_email_deleted_at_key" ON "public"."crm_leads"("email", "deleted_at");

-- AddForeignKey
ALTER TABLE "public"."adm_members" ADD CONSTRAINT "adm_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_leads" ADD CONSTRAINT "crm_leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_leads" ADD CONSTRAINT "crm_leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_adm_tenants_updated_at
  BEFORE UPDATE ON "public"."adm_tenants"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_adm_members_updated_at
  BEFORE UPDATE ON "public"."adm_members"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON "public"."crm_leads"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Enable RLS
ALTER TABLE "public"."adm_tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."adm_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."crm_leads" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for adm_tenants
-- Temporary permissive policy for migration (will be replaced by proper policies in next migration)
CREATE POLICY temp_allow_all_adm_tenants ON "public"."adm_tenants"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for adm_members
CREATE POLICY tenant_isolation_adm_members ON "public"."adm_members"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Temporary permissive policy for admin bypass (will be replaced)
CREATE POLICY temp_allow_all_adm_members ON "public"."adm_members"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for crm_leads
CREATE POLICY tenant_isolation_crm_leads ON "public"."crm_leads"
  FOR ALL TO authenticated
  USING (tenant_id IS NULL OR tenant_id::text = current_setting('app.current_tenant_id', true));

-- Temporary permissive policy for admin bypass (will be replaced)
CREATE POLICY temp_allow_all_crm_leads ON "public"."crm_leads"
  FOR ALL TO authenticated
  USING (true);

-- Create partial indexes on status WHERE deleted_at IS NULL
DROP INDEX IF EXISTS "public"."adm_tenants_status_idx";
CREATE INDEX "adm_tenants_status_active_idx" ON "public"."adm_tenants"("status") WHERE "deleted_at" IS NULL;

DROP INDEX IF EXISTS "public"."adm_members_status_idx";
CREATE INDEX "adm_members_status_active_idx" ON "public"."adm_members"("status") WHERE "deleted_at" IS NULL;
