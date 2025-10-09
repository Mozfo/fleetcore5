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

-- CreateTable
CREATE TABLE "public"."dir_car_makes" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "dir_car_makes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dir_car_models" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID,
    "make_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "vehicle_class" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "dir_car_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dir_platforms" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "api_config" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "dir_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dir_car_makes_tenant_id_idx" ON "public"."dir_car_makes"("tenant_id");

-- CreateIndex
CREATE INDEX "dir_car_makes_deleted_at_idx" ON "public"."dir_car_makes"("deleted_at");

-- CreateIndex
CREATE INDEX "dir_car_makes_created_by_idx" ON "public"."dir_car_makes"("created_by");

-- CreateIndex
CREATE INDEX "dir_car_makes_updated_by_idx" ON "public"."dir_car_makes"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "dir_car_makes_tenant_id_name_deleted_at_key" ON "public"."dir_car_makes"("tenant_id", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "dir_car_models_tenant_id_idx" ON "public"."dir_car_models"("tenant_id");

-- CreateIndex
CREATE INDEX "dir_car_models_make_id_idx" ON "public"."dir_car_models"("make_id");

-- CreateIndex
CREATE INDEX "dir_car_models_deleted_at_idx" ON "public"."dir_car_models"("deleted_at");

-- CreateIndex
CREATE INDEX "dir_car_models_created_by_idx" ON "public"."dir_car_models"("created_by");

-- CreateIndex
CREATE INDEX "dir_car_models_updated_by_idx" ON "public"."dir_car_models"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "dir_car_models_tenant_id_make_id_name_deleted_at_key" ON "public"."dir_car_models"("tenant_id", "make_id", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "dir_platforms_name_idx" ON "public"."dir_platforms"("name");

-- CreateIndex
CREATE INDEX "dir_platforms_deleted_at_idx" ON "public"."dir_platforms"("deleted_at");

-- CreateIndex
CREATE INDEX "dir_platforms_created_by_idx" ON "public"."dir_platforms"("created_by");

-- CreateIndex
CREATE INDEX "dir_platforms_updated_by_idx" ON "public"."dir_platforms"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "dir_platforms_name_deleted_at_key" ON "public"."dir_platforms"("name", "deleted_at");

-- AddForeignKey
ALTER TABLE "public"."dir_car_makes" ADD CONSTRAINT "dir_car_makes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_car_models" ADD CONSTRAINT "dir_car_models_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_car_models" ADD CONSTRAINT "dir_car_models_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "public"."dir_car_makes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_platforms" ADD CONSTRAINT "dir_platforms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_platforms" ADD CONSTRAINT "dir_platforms_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_platforms" ADD CONSTRAINT "dir_platforms_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_dir_car_makes_updated_at
  BEFORE UPDATE ON "public"."dir_car_makes"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_dir_car_models_updated_at
  BEFORE UPDATE ON "public"."dir_car_models"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_dir_platforms_updated_at
  BEFORE UPDATE ON "public"."dir_platforms"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Enable RLS
ALTER TABLE "public"."dir_car_makes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."dir_car_models" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."dir_platforms" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dir_car_makes (global ou tenant-specific avec NULL support)
CREATE POLICY tenant_isolation_dir_car_makes ON "public"."dir_car_makes"
  FOR ALL TO authenticated
  USING (tenant_id IS NULL OR tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_dir_car_makes ON "public"."dir_car_makes"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for dir_car_models (global ou tenant-specific avec NULL support)
CREATE POLICY tenant_isolation_dir_car_models ON "public"."dir_car_models"
  FOR ALL TO authenticated
  USING (tenant_id IS NULL OR tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_dir_car_models ON "public"."dir_car_models"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for dir_platforms (table globale provider, pas de tenant_isolation)
CREATE POLICY temp_allow_all_dir_platforms ON "public"."dir_platforms"
  FOR ALL TO authenticated
  USING (true);
