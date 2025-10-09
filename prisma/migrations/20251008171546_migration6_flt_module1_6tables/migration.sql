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

-- AlterTable
ALTER TABLE "public"."dir_car_makes" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."dir_car_models" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."dir_platforms" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."dir_vehicle_classes" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."doc_documents" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."flt_driver_availability" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."flt_driver_licenses" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."flt_driver_platform_accounts" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."flt_driver_vehicle_assignments" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."flt_drivers" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."flt_vehicles" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- CreateIndex
CREATE INDEX "flt_driver_licenses_status_idx" ON "public"."flt_driver_licenses"("status");

-- CreateIndex
CREATE INDEX "flt_driver_platform_accounts_status_idx" ON "public"."flt_driver_platform_accounts"("status");

-- CreateIndex
CREATE INDEX "flt_driver_vehicle_assignments_status_idx" ON "public"."flt_driver_vehicle_assignments"("status");

-- CreateIndex
CREATE INDEX "flt_drivers_status_idx" ON "public"."flt_drivers"("status");

-- CreateIndex
CREATE INDEX "flt_vehicles_status_idx" ON "public"."flt_vehicles"("status");
