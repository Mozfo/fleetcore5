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

-- CreateTable
CREATE TABLE "public"."flt_drivers" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "member_id" UUID,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "national_id" VARCHAR(100),
    "driver_license_number" VARCHAR(100) NOT NULL,
    "license_issue_date" DATE,
    "license_expiry_date" DATE,
    "professional_card_number" VARCHAR(100),
    "professional_card_expiry_date" DATE,
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country_code" CHAR(2) NOT NULL,
    "iban" VARCHAR(34),
    "bank_name" VARCHAR(100),
    "emergency_contact" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_driver_licenses" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "license_number" VARCHAR(100) NOT NULL,
    "license_type" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "issuing_country" CHAR(2) NOT NULL,
    "document_id" UUID,
    "metadata" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_driver_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_vehicles" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "make_id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "license_plate" VARCHAR(20) NOT NULL,
    "vin" VARCHAR(17),
    "year" INTEGER NOT NULL,
    "color" VARCHAR(50),
    "seats" INTEGER NOT NULL DEFAULT 4,
    "vehicle_class" VARCHAR(50),
    "fuel_type" VARCHAR(50),
    "transmission" VARCHAR(50),
    "registration_date" DATE,
    "insurance_number" VARCHAR(100),
    "insurance_expiry" DATE,
    "last_inspection" DATE,
    "next_inspection" DATE,
    "odometer" INTEGER,
    "ownership_type" VARCHAR(50) NOT NULL DEFAULT 'owned',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_driver_vehicle_assignments" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "assignment_type" VARCHAR(50) NOT NULL DEFAULT 'permanent',
    "metadata" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_driver_vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_driver_platform_accounts" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "account_id" VARCHAR(255) NOT NULL,
    "account_email" VARCHAR(255),
    "activation_date" DATE,
    "metadata" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_driver_platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_driver_availability" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_driver_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flt_drivers_tenant_id_idx" ON "public"."flt_drivers"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_drivers_member_id_idx" ON "public"."flt_drivers"("member_id");

-- CreateIndex
CREATE INDEX "flt_drivers_email_idx" ON "public"."flt_drivers"("email");

-- CreateIndex
CREATE INDEX "flt_drivers_driver_license_number_idx" ON "public"."flt_drivers"("driver_license_number");

-- CreateIndex
CREATE INDEX "flt_drivers_status_idx" ON "public"."flt_drivers"("status");

-- CreateIndex
CREATE INDEX "flt_drivers_country_code_idx" ON "public"."flt_drivers"("country_code");

-- CreateIndex
CREATE INDEX "flt_drivers_deleted_at_idx" ON "public"."flt_drivers"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_drivers_created_by_idx" ON "public"."flt_drivers"("created_by");

-- CreateIndex
CREATE INDEX "flt_drivers_updated_by_idx" ON "public"."flt_drivers"("updated_by");

-- CreateIndex
CREATE INDEX "flt_drivers_emergency_contact_idx" ON "public"."flt_drivers" USING GIN ("emergency_contact");

-- CreateIndex
CREATE INDEX "flt_drivers_metadata_idx" ON "public"."flt_drivers" USING GIN ("metadata");

-- CreateIndex
CREATE UNIQUE INDEX "flt_drivers_tenant_id_email_deleted_at_key" ON "public"."flt_drivers"("tenant_id", "email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "flt_drivers_tenant_id_driver_license_number_deleted_at_key" ON "public"."flt_drivers"("tenant_id", "driver_license_number", "deleted_at");

-- CreateIndex
CREATE INDEX "flt_driver_licenses_tenant_id_idx" ON "public"."flt_driver_licenses"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_driver_licenses_driver_id_idx" ON "public"."flt_driver_licenses"("driver_id");

-- CreateIndex
CREATE INDEX "flt_driver_licenses_license_number_idx" ON "public"."flt_driver_licenses"("license_number");

-- CreateIndex
CREATE INDEX "flt_driver_licenses_expiry_date_idx" ON "public"."flt_driver_licenses"("expiry_date");

-- CreateIndex
CREATE INDEX "flt_driver_licenses_status_idx" ON "public"."flt_driver_licenses"("status");

-- CreateIndex
CREATE INDEX "flt_driver_licenses_deleted_at_idx" ON "public"."flt_driver_licenses"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_driver_licenses_created_by_idx" ON "public"."flt_driver_licenses"("created_by");

-- CreateIndex
CREATE INDEX "flt_driver_licenses_updated_by_idx" ON "public"."flt_driver_licenses"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "flt_driver_licenses_tenant_id_driver_id_license_number_dele_key" ON "public"."flt_driver_licenses"("tenant_id", "driver_id", "license_number", "deleted_at");

-- CreateIndex
CREATE INDEX "flt_vehicles_tenant_id_idx" ON "public"."flt_vehicles"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicles_make_id_idx" ON "public"."flt_vehicles"("make_id");

-- CreateIndex
CREATE INDEX "flt_vehicles_model_id_idx" ON "public"."flt_vehicles"("model_id");

-- CreateIndex
CREATE INDEX "flt_vehicles_license_plate_idx" ON "public"."flt_vehicles"("license_plate");

-- CreateIndex
CREATE INDEX "flt_vehicles_vin_idx" ON "public"."flt_vehicles"("vin");

-- CreateIndex
CREATE INDEX "flt_vehicles_status_idx" ON "public"."flt_vehicles"("status");

-- CreateIndex
CREATE INDEX "flt_vehicles_next_inspection_idx" ON "public"."flt_vehicles"("next_inspection");

-- CreateIndex
CREATE INDEX "flt_vehicles_deleted_at_idx" ON "public"."flt_vehicles"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_vehicles_created_by_idx" ON "public"."flt_vehicles"("created_by");

-- CreateIndex
CREATE INDEX "flt_vehicles_updated_by_idx" ON "public"."flt_vehicles"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicles_metadata_idx" ON "public"."flt_vehicles" USING GIN ("metadata");

-- CreateIndex
CREATE UNIQUE INDEX "flt_vehicles_tenant_id_license_plate_deleted_at_key" ON "public"."flt_vehicles"("tenant_id", "license_plate", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "flt_vehicles_tenant_id_vin_deleted_at_key" ON "public"."flt_vehicles"("tenant_id", "vin", "deleted_at");

-- CreateIndex
CREATE INDEX "flt_driver_vehicle_assignments_tenant_id_idx" ON "public"."flt_driver_vehicle_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_driver_vehicle_assignments_driver_id_idx" ON "public"."flt_driver_vehicle_assignments"("driver_id");

-- CreateIndex
CREATE INDEX "flt_driver_vehicle_assignments_vehicle_id_idx" ON "public"."flt_driver_vehicle_assignments"("vehicle_id");

-- CreateIndex
CREATE INDEX "flt_driver_vehicle_assignments_start_date_idx" ON "public"."flt_driver_vehicle_assignments"("start_date");

-- CreateIndex
CREATE INDEX "flt_driver_vehicle_assignments_end_date_idx" ON "public"."flt_driver_vehicle_assignments"("end_date");

-- CreateIndex
CREATE INDEX "flt_driver_vehicle_assignments_status_idx" ON "public"."flt_driver_vehicle_assignments"("status");

-- CreateIndex
CREATE INDEX "flt_driver_vehicle_assignments_deleted_at_idx" ON "public"."flt_driver_vehicle_assignments"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_driver_vehicle_assignments_created_by_idx" ON "public"."flt_driver_vehicle_assignments"("created_by");

-- CreateIndex
CREATE INDEX "flt_driver_vehicle_assignments_updated_by_idx" ON "public"."flt_driver_vehicle_assignments"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "flt_driver_vehicle_assignments_tenant_id_driver_id_vehicle__key" ON "public"."flt_driver_vehicle_assignments"("tenant_id", "driver_id", "vehicle_id", "start_date", "deleted_at");

-- CreateIndex
CREATE INDEX "flt_driver_platform_accounts_tenant_id_idx" ON "public"."flt_driver_platform_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_driver_platform_accounts_driver_id_idx" ON "public"."flt_driver_platform_accounts"("driver_id");

-- CreateIndex
CREATE INDEX "flt_driver_platform_accounts_platform_id_idx" ON "public"."flt_driver_platform_accounts"("platform_id");

-- CreateIndex
CREATE INDEX "flt_driver_platform_accounts_account_id_idx" ON "public"."flt_driver_platform_accounts"("account_id");

-- CreateIndex
CREATE INDEX "flt_driver_platform_accounts_status_idx" ON "public"."flt_driver_platform_accounts"("status");

-- CreateIndex
CREATE INDEX "flt_driver_platform_accounts_deleted_at_idx" ON "public"."flt_driver_platform_accounts"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_driver_platform_accounts_created_by_idx" ON "public"."flt_driver_platform_accounts"("created_by");

-- CreateIndex
CREATE INDEX "flt_driver_platform_accounts_updated_by_idx" ON "public"."flt_driver_platform_accounts"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "flt_driver_platform_accounts_tenant_id_driver_id_platform_i_key" ON "public"."flt_driver_platform_accounts"("tenant_id", "driver_id", "platform_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "flt_driver_platform_accounts_platform_id_account_id_deleted_key" ON "public"."flt_driver_platform_accounts"("platform_id", "account_id", "deleted_at");

-- CreateIndex
CREATE INDEX "flt_driver_availability_tenant_id_idx" ON "public"."flt_driver_availability"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_driver_availability_driver_id_idx" ON "public"."flt_driver_availability"("driver_id");

-- CreateIndex
CREATE INDEX "flt_driver_availability_day_of_week_idx" ON "public"."flt_driver_availability"("day_of_week");

-- CreateIndex
CREATE INDEX "flt_driver_availability_is_available_idx" ON "public"."flt_driver_availability"("is_available");

-- CreateIndex
CREATE INDEX "flt_driver_availability_deleted_at_idx" ON "public"."flt_driver_availability"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_driver_availability_created_by_idx" ON "public"."flt_driver_availability"("created_by");

-- CreateIndex
CREATE INDEX "flt_driver_availability_updated_by_idx" ON "public"."flt_driver_availability"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "flt_driver_availability_tenant_id_driver_id_day_of_week_sta_key" ON "public"."flt_driver_availability"("tenant_id", "driver_id", "day_of_week", "start_time", "deleted_at");

-- AddForeignKey
ALTER TABLE "public"."flt_drivers" ADD CONSTRAINT "flt_drivers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_drivers" ADD CONSTRAINT "flt_drivers_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_licenses" ADD CONSTRAINT "flt_driver_licenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_licenses" ADD CONSTRAINT "flt_driver_licenses_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."flt_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_licenses" ADD CONSTRAINT "flt_driver_licenses_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."doc_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicles" ADD CONSTRAINT "flt_vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicles" ADD CONSTRAINT "flt_vehicles_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "public"."dir_car_makes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicles" ADD CONSTRAINT "flt_vehicles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."dir_car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_vehicle_assignments" ADD CONSTRAINT "flt_driver_vehicle_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_vehicle_assignments" ADD CONSTRAINT "flt_driver_vehicle_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."flt_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_vehicle_assignments" ADD CONSTRAINT "flt_driver_vehicle_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_platform_accounts" ADD CONSTRAINT "flt_driver_platform_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_platform_accounts" ADD CONSTRAINT "flt_driver_platform_accounts_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."flt_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_platform_accounts" ADD CONSTRAINT "flt_driver_platform_accounts_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "public"."dir_platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_availability" ADD CONSTRAINT "flt_driver_availability_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_driver_availability" ADD CONSTRAINT "flt_driver_availability_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."flt_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add triggers for updated_at
CREATE TRIGGER update_flt_drivers_updated_at
  BEFORE UPDATE ON "public"."flt_drivers"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_flt_driver_licenses_updated_at
  BEFORE UPDATE ON "public"."flt_driver_licenses"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_flt_vehicles_updated_at
  BEFORE UPDATE ON "public"."flt_vehicles"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_flt_driver_vehicle_assignments_updated_at
  BEFORE UPDATE ON "public"."flt_driver_vehicle_assignments"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_flt_driver_platform_accounts_updated_at
  BEFORE UPDATE ON "public"."flt_driver_platform_accounts"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_flt_driver_availability_updated_at
  BEFORE UPDATE ON "public"."flt_driver_availability"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Enable RLS
ALTER TABLE "public"."flt_drivers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flt_driver_licenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flt_vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flt_driver_vehicle_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flt_driver_platform_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flt_driver_availability" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flt_drivers
CREATE POLICY tenant_isolation_flt_drivers ON "public"."flt_drivers"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_flt_drivers ON "public"."flt_drivers"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for flt_driver_licenses
CREATE POLICY tenant_isolation_flt_driver_licenses ON "public"."flt_driver_licenses"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_flt_driver_licenses ON "public"."flt_driver_licenses"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for flt_vehicles
CREATE POLICY tenant_isolation_flt_vehicles ON "public"."flt_vehicles"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_flt_vehicles ON "public"."flt_vehicles"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for flt_driver_vehicle_assignments
CREATE POLICY tenant_isolation_flt_driver_vehicle_assignments ON "public"."flt_driver_vehicle_assignments"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_flt_driver_vehicle_assignments ON "public"."flt_driver_vehicle_assignments"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for flt_driver_platform_accounts
CREATE POLICY tenant_isolation_flt_driver_platform_accounts ON "public"."flt_driver_platform_accounts"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_flt_driver_platform_accounts ON "public"."flt_driver_platform_accounts"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for flt_driver_availability
CREATE POLICY tenant_isolation_flt_driver_availability ON "public"."flt_driver_availability"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_flt_driver_availability ON "public"."flt_driver_availability"
  FOR ALL TO authenticated
  USING (true);

-- Create partial indexes on status WHERE deleted_at IS NULL
DROP INDEX IF EXISTS "public"."flt_drivers_status_idx";
CREATE INDEX "flt_drivers_status_active_idx" ON "public"."flt_drivers"("status") WHERE "deleted_at" IS NULL;

DROP INDEX IF EXISTS "public"."flt_driver_licenses_status_idx";
CREATE INDEX "flt_driver_licenses_status_active_idx" ON "public"."flt_driver_licenses"("status") WHERE "deleted_at" IS NULL;

DROP INDEX IF EXISTS "public"."flt_vehicles_status_idx";
CREATE INDEX "flt_vehicles_status_active_idx" ON "public"."flt_vehicles"("status") WHERE "deleted_at" IS NULL;

DROP INDEX IF EXISTS "public"."flt_driver_vehicle_assignments_status_idx";
CREATE INDEX "flt_driver_vehicle_assignments_status_active_idx" ON "public"."flt_driver_vehicle_assignments"("status") WHERE "deleted_at" IS NULL;

DROP INDEX IF EXISTS "public"."flt_driver_platform_accounts_status_idx";
CREATE INDEX "flt_driver_platform_accounts_status_active_idx" ON "public"."flt_driver_platform_accounts"("status") WHERE "deleted_at" IS NULL;
