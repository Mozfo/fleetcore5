-- AlterTable
ALTER TABLE "public"."adm_members" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_tenants" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."crm_leads" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- CreateIndex
CREATE INDEX "adm_members_status_idx" ON "public"."adm_members"("status");

-- CreateIndex
CREATE INDEX "adm_tenants_status_idx" ON "public"."adm_tenants"("status");
