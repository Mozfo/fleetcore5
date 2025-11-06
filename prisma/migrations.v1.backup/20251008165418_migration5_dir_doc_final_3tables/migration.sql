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

-- CreateTable
CREATE TABLE "public"."dir_country_regulations" (
    "country_code" CHAR(2) NOT NULL,
    "vehicle_max_age" INTEGER,
    "min_vehicle_class" VARCHAR(50),
    "requires_vtc_card" BOOLEAN NOT NULL DEFAULT false,
    "min_fare_per_trip" DECIMAL(10,2),
    "min_fare_per_km" DECIMAL(10,2),
    "min_fare_per_hour" DECIMAL(10,2),
    "vat_rate" DECIMAL(5,2),
    "currency" CHAR(3),
    "timezone" VARCHAR(50),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dir_country_regulations_pkey" PRIMARY KEY ("country_code")
);

-- CreateTable
CREATE TABLE "public"."dir_vehicle_classes" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "country_code" CHAR(2) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "max_age" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "dir_vehicle_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."doc_documents" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" VARCHAR(255),
    "file_size" INTEGER,
    "mime_type" VARCHAR(100),
    "issue_date" DATE,
    "expiry_date" DATE,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "doc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dir_vehicle_classes_country_code_idx" ON "public"."dir_vehicle_classes"("country_code");

-- CreateIndex
CREATE INDEX "dir_vehicle_classes_deleted_at_idx" ON "public"."dir_vehicle_classes"("deleted_at");

-- CreateIndex
CREATE INDEX "dir_vehicle_classes_created_by_idx" ON "public"."dir_vehicle_classes"("created_by");

-- CreateIndex
CREATE INDEX "dir_vehicle_classes_updated_by_idx" ON "public"."dir_vehicle_classes"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "dir_vehicle_classes_country_code_name_deleted_at_key" ON "public"."dir_vehicle_classes"("country_code", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "doc_documents_tenant_id_entity_type_entity_id_idx" ON "public"."doc_documents"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "doc_documents_tenant_id_idx" ON "public"."doc_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "doc_documents_tenant_id_document_type_idx" ON "public"."doc_documents"("tenant_id", "document_type");

-- CreateIndex
CREATE INDEX "doc_documents_expiry_date_idx" ON "public"."doc_documents"("expiry_date");

-- CreateIndex
CREATE INDEX "doc_documents_deleted_at_idx" ON "public"."doc_documents"("deleted_at");

-- CreateIndex
CREATE INDEX "doc_documents_created_by_idx" ON "public"."doc_documents"("created_by");

-- CreateIndex
CREATE INDEX "doc_documents_updated_by_idx" ON "public"."doc_documents"("updated_by");

-- CreateIndex
CREATE INDEX "doc_documents_metadata_idx" ON "public"."doc_documents" USING GIN ("metadata");

-- AddForeignKey
ALTER TABLE "public"."dir_vehicle_classes" ADD CONSTRAINT "dir_vehicle_classes_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."dir_country_regulations"("country_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_vehicle_classes" ADD CONSTRAINT "dir_vehicle_classes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_vehicle_classes" ADD CONSTRAINT "dir_vehicle_classes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_vehicle_classes" ADD CONSTRAINT "dir_vehicle_classes_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doc_documents" ADD CONSTRAINT "doc_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doc_documents" ADD CONSTRAINT "doc_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_dir_country_regulations_updated_at
  BEFORE UPDATE ON "public"."dir_country_regulations"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_dir_vehicle_classes_updated_at
  BEFORE UPDATE ON "public"."dir_vehicle_classes"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_doc_documents_updated_at
  BEFORE UPDATE ON "public"."doc_documents"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Enable RLS
ALTER TABLE "public"."dir_country_regulations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."dir_vehicle_classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."doc_documents" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dir_country_regulations (table globale de référence)
CREATE POLICY temp_allow_all_dir_country_regulations ON "public"."dir_country_regulations"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for dir_vehicle_classes (table globale)
CREATE POLICY temp_allow_all_dir_vehicle_classes ON "public"."dir_vehicle_classes"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for doc_documents (tenant-scoped)
CREATE POLICY tenant_isolation_doc_documents ON "public"."doc_documents"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_doc_documents ON "public"."doc_documents"
  FOR ALL TO authenticated
  USING (true);
