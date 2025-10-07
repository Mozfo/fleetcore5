-- CreateTable
CREATE TABLE "public"."adm_tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "clerk_organization_id" VARCHAR(255),
    "vat_rate" DECIMAL(5,2),
    "currency" VARCHAR(3) DEFAULT 'EUR',
    "timezone" VARCHAR(50) DEFAULT 'Europe/Paris',
    "metadata" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" TEXT,
    "deletion_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "adm_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adm_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "clerk_user_id" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone" VARCHAR(50),
    "role" VARCHAR(50) NOT NULL DEFAULT 'member',
    "metadata" JSONB,
    "last_login_at" TIMESTAMPTZ(6),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "adm_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_leads" (
    "id" TEXT NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "company_name" VARCHAR(255) NOT NULL,
    "fleet_size" VARCHAR(50),
    "country_code" VARCHAR(2) NOT NULL DEFAULT 'FR',
    "status" VARCHAR(50) NOT NULL DEFAULT 'new',
    "message" TEXT,
    "source" VARCHAR(100),
    "campaign_id" VARCHAR(100),
    "assigned_to" TEXT,
    "qualified_date" TIMESTAMPTZ(6),
    "converted_date" TIMESTAMPTZ(6),
    "lost_reason" TEXT,
    "tenant_id" TEXT,
    "metadata" JSONB,
    "notes" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adm_tenants_subdomain_key" ON "public"."adm_tenants"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "adm_tenants_clerk_organization_id_key" ON "public"."adm_tenants"("clerk_organization_id");

-- CreateIndex
CREATE INDEX "adm_tenants_status_idx" ON "public"."adm_tenants"("status");

-- CreateIndex
CREATE INDEX "adm_tenants_country_code_idx" ON "public"."adm_tenants"("country_code");

-- CreateIndex
CREATE INDEX "adm_tenants_deleted_at_idx" ON "public"."adm_tenants"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "adm_members_clerk_user_id_key" ON "public"."adm_members"("clerk_user_id");

-- CreateIndex
CREATE INDEX "adm_members_tenant_id_idx" ON "public"."adm_members"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_members_status_idx" ON "public"."adm_members"("status");

-- CreateIndex
CREATE INDEX "adm_members_deleted_at_idx" ON "public"."adm_members"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_members_email_idx" ON "public"."adm_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "adm_members_tenant_id_email_key" ON "public"."adm_members"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "crm_leads_email_idx" ON "public"."crm_leads"("email");

-- CreateIndex
CREATE INDEX "crm_leads_status_idx" ON "public"."crm_leads"("status");

-- CreateIndex
CREATE INDEX "crm_leads_country_code_idx" ON "public"."crm_leads"("country_code");

-- CreateIndex
CREATE INDEX "crm_leads_created_at_idx" ON "public"."crm_leads"("created_at");

-- CreateIndex
CREATE INDEX "crm_leads_tenant_id_idx" ON "public"."crm_leads"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_leads_assigned_to_idx" ON "public"."crm_leads"("assigned_to");

-- AddForeignKey
ALTER TABLE "public"."adm_members" ADD CONSTRAINT "adm_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_leads" ADD CONSTRAINT "crm_leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
