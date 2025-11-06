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

-- AlterTable
ALTER TABLE "public"."rid_ride_cancellations" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."rid_ride_expenses" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."rid_ride_incidents" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."rid_ride_ratings" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."rid_ride_waypoints" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."rid_rides" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- CreateTable
CREATE TABLE "public"."flt_vehicle_events" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "event_date" TIMESTAMPTZ(6) NOT NULL,
    "severity" VARCHAR(20),
    "downtime_hours" INTEGER,
    "cost_amount" DECIMAL(10,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "details" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_vehicle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_vehicle_maintenance" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "maintenance_type" VARCHAR(50) NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "completed_date" DATE,
    "odometer_reading" INTEGER,
    "next_service_km" INTEGER,
    "next_service_date" DATE,
    "provider_name" VARCHAR(255),
    "provider_contact" VARCHAR(100),
    "cost_amount" DECIMAL(10,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "invoice_reference" VARCHAR(100),
    "parts_replaced" TEXT,
    "notes" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_vehicle_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_vehicle_expenses" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID,
    "ride_id" UUID,
    "expense_date" DATE NOT NULL,
    "expense_category" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "payment_method" VARCHAR(50),
    "receipt_url" TEXT,
    "odometer_reading" INTEGER,
    "quantity" DECIMAL(10,2),
    "unit_price" DECIMAL(10,2),
    "location" VARCHAR(255),
    "vendor" VARCHAR(255),
    "description" TEXT,
    "reimbursed" BOOLEAN NOT NULL DEFAULT false,
    "reimbursed_at" TIMESTAMPTZ(6),
    "reimbursed_in_batch_id" UUID,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_vehicle_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_vehicle_insurances" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "provider_name" VARCHAR(255) NOT NULL,
    "policy_number" VARCHAR(100) NOT NULL,
    "policy_type" VARCHAR(50) NOT NULL,
    "coverage_amount" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "deductible_amount" DECIMAL(10,2),
    "premium_amount" DECIMAL(10,2) NOT NULL,
    "premium_frequency" VARCHAR(20) NOT NULL DEFAULT 'annual',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "contact_name" VARCHAR(255),
    "contact_phone" VARCHAR(50),
    "contact_email" VARCHAR(255),
    "document_url" TEXT,
    "claim_count" INTEGER NOT NULL DEFAULT 0,
    "last_claim_date" DATE,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_vehicle_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flt_vehicle_events_tenant_id_idx" ON "public"."flt_vehicle_events"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_vehicle_id_idx" ON "public"."flt_vehicle_events"("vehicle_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_event_type_idx" ON "public"."flt_vehicle_events"("event_type");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_event_date_idx" ON "public"."flt_vehicle_events"("event_date");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_severity_idx" ON "public"."flt_vehicle_events"("severity");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_created_at_idx" ON "public"."flt_vehicle_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "flt_vehicle_events_deleted_at_idx" ON "public"."flt_vehicle_events"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_created_by_idx" ON "public"."flt_vehicle_events"("created_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_updated_by_idx" ON "public"."flt_vehicle_events"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_details_idx" ON "public"."flt_vehicle_events" USING GIN ("details");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_metadata_idx" ON "public"."flt_vehicle_events" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_tenant_id_idx" ON "public"."flt_vehicle_maintenance"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_vehicle_id_idx" ON "public"."flt_vehicle_maintenance"("vehicle_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_maintenance_type_idx" ON "public"."flt_vehicle_maintenance"("maintenance_type");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_scheduled_date_idx" ON "public"."flt_vehicle_maintenance"("scheduled_date");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_status_idx" ON "public"."flt_vehicle_maintenance"("status");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_next_service_date_idx" ON "public"."flt_vehicle_maintenance"("next_service_date");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_created_at_idx" ON "public"."flt_vehicle_maintenance"("created_at" DESC);

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_deleted_at_idx" ON "public"."flt_vehicle_maintenance"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_created_by_idx" ON "public"."flt_vehicle_maintenance"("created_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_updated_by_idx" ON "public"."flt_vehicle_maintenance"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_metadata_idx" ON "public"."flt_vehicle_maintenance" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_tenant_id_idx" ON "public"."flt_vehicle_expenses"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_vehicle_id_idx" ON "public"."flt_vehicle_expenses"("vehicle_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_driver_id_idx" ON "public"."flt_vehicle_expenses"("driver_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_ride_id_idx" ON "public"."flt_vehicle_expenses"("ride_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_expense_category_idx" ON "public"."flt_vehicle_expenses"("expense_category");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_expense_date_idx" ON "public"."flt_vehicle_expenses"("expense_date");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_reimbursed_idx" ON "public"."flt_vehicle_expenses"("reimbursed");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_created_at_idx" ON "public"."flt_vehicle_expenses"("created_at" DESC);

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_deleted_at_idx" ON "public"."flt_vehicle_expenses"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_created_by_idx" ON "public"."flt_vehicle_expenses"("created_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_updated_by_idx" ON "public"."flt_vehicle_expenses"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_metadata_idx" ON "public"."flt_vehicle_expenses" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_tenant_id_idx" ON "public"."flt_vehicle_insurances"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_vehicle_id_idx" ON "public"."flt_vehicle_insurances"("vehicle_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_policy_number_idx" ON "public"."flt_vehicle_insurances"("policy_number");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_policy_type_idx" ON "public"."flt_vehicle_insurances"("policy_type");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_end_date_idx" ON "public"."flt_vehicle_insurances"("end_date");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_is_active_idx" ON "public"."flt_vehicle_insurances"("is_active");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_created_at_idx" ON "public"."flt_vehicle_insurances"("created_at" DESC);

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_deleted_at_idx" ON "public"."flt_vehicle_insurances"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_created_by_idx" ON "public"."flt_vehicle_insurances"("created_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_updated_by_idx" ON "public"."flt_vehicle_insurances"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_metadata_idx" ON "public"."flt_vehicle_insurances" USING GIN ("metadata");

-- CreateIndex
CREATE UNIQUE INDEX "flt_vehicle_insurances_tenant_id_policy_number_deleted_at_key" ON "public"."flt_vehicle_insurances"("tenant_id", "policy_number", "deleted_at");

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_events" ADD CONSTRAINT "flt_vehicle_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_events" ADD CONSTRAINT "flt_vehicle_events_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_events" ADD CONSTRAINT "flt_vehicle_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_events" ADD CONSTRAINT "flt_vehicle_events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_events" ADD CONSTRAINT "flt_vehicle_events_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_maintenance" ADD CONSTRAINT "flt_vehicle_maintenance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_maintenance" ADD CONSTRAINT "flt_vehicle_maintenance_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_maintenance" ADD CONSTRAINT "flt_vehicle_maintenance_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_maintenance" ADD CONSTRAINT "flt_vehicle_maintenance_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_maintenance" ADD CONSTRAINT "flt_vehicle_maintenance_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."flt_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rid_rides"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_insurances" ADD CONSTRAINT "flt_vehicle_insurances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_insurances" ADD CONSTRAINT "flt_vehicle_insurances_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_insurances" ADD CONSTRAINT "flt_vehicle_insurances_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_insurances" ADD CONSTRAINT "flt_vehicle_insurances_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_insurances" ADD CONSTRAINT "flt_vehicle_insurances_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ====================================================================
-- ENRICHMENTS: Triggers, RLS, CHECK constraints, Partial indexes
-- ====================================================================

-- ====================================================================
-- Triggers pour updated_at
-- ====================================================================

CREATE TRIGGER update_flt_vehicle_events_updated_at
  BEFORE UPDATE ON "public"."flt_vehicle_events"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_flt_vehicle_maintenance_updated_at
  BEFORE UPDATE ON "public"."flt_vehicle_maintenance"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_flt_vehicle_expenses_updated_at
  BEFORE UPDATE ON "public"."flt_vehicle_expenses"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_flt_vehicle_insurances_updated_at
  BEFORE UPDATE ON "public"."flt_vehicle_insurances"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ====================================================================
-- RLS ENABLE
-- ====================================================================

ALTER TABLE "public"."flt_vehicle_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flt_vehicle_maintenance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flt_vehicle_expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flt_vehicle_insurances" ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS Policies (2 per table)
-- ====================================================================

-- flt_vehicle_events
CREATE POLICY tenant_isolation_flt_vehicle_events ON "public"."flt_vehicle_events"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_flt_vehicle_events ON "public"."flt_vehicle_events"
  FOR ALL TO authenticated
  USING (true);

-- flt_vehicle_maintenance
CREATE POLICY tenant_isolation_flt_vehicle_maintenance ON "public"."flt_vehicle_maintenance"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_flt_vehicle_maintenance ON "public"."flt_vehicle_maintenance"
  FOR ALL TO authenticated
  USING (true);

-- flt_vehicle_expenses
CREATE POLICY tenant_isolation_flt_vehicle_expenses ON "public"."flt_vehicle_expenses"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_flt_vehicle_expenses ON "public"."flt_vehicle_expenses"
  FOR ALL TO authenticated
  USING (true);

-- flt_vehicle_insurances
CREATE POLICY tenant_isolation_flt_vehicle_insurances ON "public"."flt_vehicle_insurances"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_flt_vehicle_insurances ON "public"."flt_vehicle_insurances"
  FOR ALL TO authenticated
  USING (true);

-- ====================================================================
-- CHECK Constraints
-- ====================================================================

-- flt_vehicle_events
ALTER TABLE "public"."flt_vehicle_events"
  ADD CONSTRAINT "flt_vehicle_events_event_type_check"
  CHECK (event_type IN ('acquisition', 'disposal', 'maintenance', 'accident', 'handover', 'inspection', 'insurance'));

ALTER TABLE "public"."flt_vehicle_events"
  ADD CONSTRAINT "flt_vehicle_events_severity_check"
  CHECK (severity IS NULL OR severity IN ('minor', 'moderate', 'severe', 'total_loss'));

-- flt_vehicle_maintenance
ALTER TABLE "public"."flt_vehicle_maintenance"
  ADD CONSTRAINT "flt_vehicle_maintenance_type_check"
  CHECK (maintenance_type IN ('oil_change', 'service', 'inspection', 'tire_rotation', 'brake_service', 'repair', 'other'));

ALTER TABLE "public"."flt_vehicle_maintenance"
  ADD CONSTRAINT "flt_vehicle_maintenance_status_check"
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE "public"."flt_vehicle_maintenance"
  ADD CONSTRAINT "flt_vehicle_maintenance_dates_check"
  CHECK (completed_date IS NULL OR completed_date >= scheduled_date);

-- flt_vehicle_expenses
ALTER TABLE "public"."flt_vehicle_expenses"
  ADD CONSTRAINT "flt_vehicle_expenses_category_check"
  CHECK (expense_category IN ('fuel', 'toll', 'parking', 'wash', 'repair', 'fine', 'other'));

ALTER TABLE "public"."flt_vehicle_expenses"
  ADD CONSTRAINT "flt_vehicle_expenses_payment_method_check"
  CHECK (payment_method IS NULL OR payment_method IN ('cash', 'card', 'fuel_card', 'toll_card', 'company_account'));

ALTER TABLE "public"."flt_vehicle_expenses"
  ADD CONSTRAINT "flt_vehicle_expenses_amount_check"
  CHECK (amount > 0);

-- flt_vehicle_insurances
ALTER TABLE "public"."flt_vehicle_insurances"
  ADD CONSTRAINT "flt_vehicle_insurances_policy_type_check"
  CHECK (policy_type IN ('comprehensive', 'third_party', 'collision', 'other'));

ALTER TABLE "public"."flt_vehicle_insurances"
  ADD CONSTRAINT "flt_vehicle_insurances_frequency_check"
  CHECK (premium_frequency IN ('annual', 'semi_annual', 'quarterly', 'monthly'));

ALTER TABLE "public"."flt_vehicle_insurances"
  ADD CONSTRAINT "flt_vehicle_insurances_dates_check"
  CHECK (end_date > start_date);

ALTER TABLE "public"."flt_vehicle_insurances"
  ADD CONSTRAINT "flt_vehicle_insurances_premium_check"
  CHECK (premium_amount > 0);

ALTER TABLE "public"."flt_vehicle_insurances"
  ADD CONSTRAINT "flt_vehicle_insurances_claims_check"
  CHECK (claim_count >= 0);

-- ====================================================================
-- Partial Indexes (optimized for active records)
-- ====================================================================

-- flt_vehicle_events - severity for active accidents
DROP INDEX IF EXISTS "public"."flt_vehicle_events_severity_idx";
CREATE INDEX "flt_vehicle_events_severity_active_idx"
  ON "public"."flt_vehicle_events"("severity")
  WHERE "deleted_at" IS NULL;

-- flt_vehicle_maintenance - scheduled_date for active maintenance
DROP INDEX IF EXISTS "public"."flt_vehicle_maintenance_scheduled_date_idx";
CREATE INDEX "flt_vehicle_maintenance_scheduled_date_active_idx"
  ON "public"."flt_vehicle_maintenance"("scheduled_date")
  WHERE "deleted_at" IS NULL;

-- flt_vehicle_maintenance - status for active maintenance
DROP INDEX IF EXISTS "public"."flt_vehicle_maintenance_status_idx";
CREATE INDEX "flt_vehicle_maintenance_status_active_idx"
  ON "public"."flt_vehicle_maintenance"("status")
  WHERE "deleted_at" IS NULL;

-- flt_vehicle_maintenance - next_service_date alert monitoring
DROP INDEX IF EXISTS "public"."flt_vehicle_maintenance_next_service_date_idx";
CREATE INDEX "flt_vehicle_maintenance_next_service_alert_idx"
  ON "public"."flt_vehicle_maintenance"("next_service_date")
  WHERE "deleted_at" IS NULL AND "status" = 'completed';

-- flt_vehicle_expenses - reimbursed pending
DROP INDEX IF EXISTS "public"."flt_vehicle_expenses_reimbursed_idx";
CREATE INDEX "flt_vehicle_expenses_reimbursed_pending_idx"
  ON "public"."flt_vehicle_expenses"("reimbursed")
  WHERE "deleted_at" IS NULL AND "reimbursed" = false;

-- flt_vehicle_insurances - end_date for active policy expiry monitoring
DROP INDEX IF EXISTS "public"."flt_vehicle_insurances_end_date_idx";
CREATE INDEX "flt_vehicle_insurances_end_date_active_idx"
  ON "public"."flt_vehicle_insurances"("end_date")
  WHERE "deleted_at" IS NULL AND "is_active" = true;

-- flt_vehicle_insurances - is_active for filtering active policies
DROP INDEX IF EXISTS "public"."flt_vehicle_insurances_is_active_idx";
CREATE INDEX "flt_vehicle_insurances_is_active_active_idx"
  ON "public"."flt_vehicle_insurances"("is_active")
  WHERE "deleted_at" IS NULL;
