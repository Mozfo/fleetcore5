-- AlterTable
ALTER TABLE "public"."adm_audit_logs" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_invitations" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_member_roles" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_members" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_provider_employees" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_roles" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_tenant_lifecycle_events" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_tenants" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."crm_leads" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- CreateIndex
CREATE INDEX "adm_invitations_status_idx" ON "public"."adm_invitations"("status");

-- CreateIndex
CREATE INDEX "adm_provider_employees_status_idx" ON "public"."adm_provider_employees"("status");
