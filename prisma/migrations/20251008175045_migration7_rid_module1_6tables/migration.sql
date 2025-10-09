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

-- CreateTable
CREATE TABLE "public"."rid_rides" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "platform_id" UUID,
    "platform_ride_id" VARCHAR(255),
    "passenger_name" VARCHAR(255),
    "passenger_phone" VARCHAR(50),
    "pickup_address" TEXT NOT NULL,
    "pickup_latitude" DECIMAL(10,8),
    "pickup_longitude" DECIMAL(11,8),
    "pickup_time" TIMESTAMPTZ(6),
    "dropoff_address" TEXT NOT NULL,
    "dropoff_latitude" DECIMAL(10,8),
    "dropoff_longitude" DECIMAL(11,8),
    "dropoff_time" TIMESTAMPTZ(6),
    "distance_km" DECIMAL(10,2),
    "duration_minutes" INTEGER,
    "vehicle_class" VARCHAR(50),
    "ride_type" VARCHAR(50) NOT NULL DEFAULT 'standard',
    "payment_method" VARCHAR(50),
    "fare_amount" DECIMAL(10,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "commission_rate" DECIMAL(5,2),
    "commission_amount" DECIMAL(10,2),
    "driver_earnings" DECIMAL(10,2),
    "gps_track" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'requested',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_rides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_ride_ratings" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "ride_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "passenger_rating" INTEGER,
    "vehicle_rating" INTEGER,
    "service_rating" INTEGER,
    "tags" JSONB NOT NULL DEFAULT '{}',
    "rated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_ride_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_ride_incidents" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "ride_id" UUID NOT NULL,
    "incident_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(50) NOT NULL DEFAULT 'low',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "reported_by" VARCHAR(50),
    "reported_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location_latitude" DECIMAL(10,8),
    "location_longitude" DECIMAL(11,8),
    "evidence_urls" JSONB NOT NULL DEFAULT '[]',
    "resolution_status" VARCHAR(50) NOT NULL DEFAULT 'open',
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_ride_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_ride_expenses" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "ride_id" UUID NOT NULL,
    "expense_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "receipt_url" VARCHAR(500),
    "document_id" UUID,
    "location" VARCHAR(255),
    "incurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reimbursed" BOOLEAN NOT NULL DEFAULT false,
    "reimbursed_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_ride_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_ride_cancellations" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "ride_id" UUID NOT NULL,
    "cancelled_by" VARCHAR(50) NOT NULL,
    "cancellation_reason" VARCHAR(50) NOT NULL,
    "detailed_reason" TEXT,
    "cancelled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ride_stage" VARCHAR(50),
    "cancellation_fee" DECIMAL(10,2),
    "charged_to" VARCHAR(50),
    "wait_time_minutes" INTEGER,
    "distance_covered_km" DECIMAL(10,2),
    "refund_amount" DECIMAL(10,2),
    "refund_processed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_ride_cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_ride_waypoints" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "ride_id" UUID NOT NULL,
    "waypoint_order" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "arrival_time" TIMESTAMPTZ(6),
    "departure_time" TIMESTAMPTZ(6),
    "wait_time_minutes" INTEGER,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "skip_reason" VARCHAR(255),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_ride_waypoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rid_rides_tenant_id_idx" ON "public"."rid_rides"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_rides_driver_id_idx" ON "public"."rid_rides"("driver_id");

-- CreateIndex
CREATE INDEX "rid_rides_vehicle_id_idx" ON "public"."rid_rides"("vehicle_id");

-- CreateIndex
CREATE INDEX "rid_rides_platform_id_idx" ON "public"."rid_rides"("platform_id");

-- CreateIndex
CREATE INDEX "rid_rides_platform_id_platform_ride_id_idx" ON "public"."rid_rides"("platform_id", "platform_ride_id");

-- CreateIndex
CREATE INDEX "rid_rides_status_idx" ON "public"."rid_rides"("status");

-- CreateIndex
CREATE INDEX "rid_rides_pickup_time_idx" ON "public"."rid_rides"("pickup_time");

-- CreateIndex
CREATE INDEX "rid_rides_dropoff_time_idx" ON "public"."rid_rides"("dropoff_time");

-- CreateIndex
CREATE INDEX "rid_rides_created_at_idx" ON "public"."rid_rides"("created_at" DESC);

-- CreateIndex
CREATE INDEX "rid_rides_deleted_at_idx" ON "public"."rid_rides"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_rides_created_by_idx" ON "public"."rid_rides"("created_by");

-- CreateIndex
CREATE INDEX "rid_rides_updated_by_idx" ON "public"."rid_rides"("updated_by");

-- CreateIndex
CREATE INDEX "rid_rides_gps_track_idx" ON "public"."rid_rides" USING GIN ("gps_track");

-- CreateIndex
CREATE INDEX "rid_rides_metadata_idx" ON "public"."rid_rides" USING GIN ("metadata");

-- CreateIndex
CREATE UNIQUE INDEX "rid_rides_platform_id_platform_ride_id_deleted_at_key" ON "public"."rid_rides"("platform_id", "platform_ride_id", "deleted_at");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_tenant_id_idx" ON "public"."rid_ride_ratings"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_ride_id_idx" ON "public"."rid_ride_ratings"("ride_id");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_rating_idx" ON "public"."rid_ride_ratings"("rating");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_passenger_rating_idx" ON "public"."rid_ride_ratings"("passenger_rating");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_vehicle_rating_idx" ON "public"."rid_ride_ratings"("vehicle_rating");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_service_rating_idx" ON "public"."rid_ride_ratings"("service_rating");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_rated_at_idx" ON "public"."rid_ride_ratings"("rated_at");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_deleted_at_idx" ON "public"."rid_ride_ratings"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_created_by_idx" ON "public"."rid_ride_ratings"("created_by");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_updated_by_idx" ON "public"."rid_ride_ratings"("updated_by");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_tags_idx" ON "public"."rid_ride_ratings" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "rid_ride_ratings_metadata_idx" ON "public"."rid_ride_ratings" USING GIN ("metadata");

-- CreateIndex
CREATE UNIQUE INDEX "rid_ride_ratings_tenant_id_ride_id_deleted_at_key" ON "public"."rid_ride_ratings"("tenant_id", "ride_id", "deleted_at");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_tenant_id_idx" ON "public"."rid_ride_incidents"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_ride_id_idx" ON "public"."rid_ride_incidents"("ride_id");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_incident_type_idx" ON "public"."rid_ride_incidents"("incident_type");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_severity_idx" ON "public"."rid_ride_incidents"("severity");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_resolution_status_idx" ON "public"."rid_ride_incidents"("resolution_status");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_reported_at_idx" ON "public"."rid_ride_incidents"("reported_at");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_resolved_at_idx" ON "public"."rid_ride_incidents"("resolved_at");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_resolved_by_idx" ON "public"."rid_ride_incidents"("resolved_by");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_deleted_at_idx" ON "public"."rid_ride_incidents"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_created_by_idx" ON "public"."rid_ride_incidents"("created_by");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_updated_by_idx" ON "public"."rid_ride_incidents"("updated_by");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_evidence_urls_idx" ON "public"."rid_ride_incidents" USING GIN ("evidence_urls");

-- CreateIndex
CREATE INDEX "rid_ride_incidents_metadata_idx" ON "public"."rid_ride_incidents" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_tenant_id_idx" ON "public"."rid_ride_expenses"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_ride_id_idx" ON "public"."rid_ride_expenses"("ride_id");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_expense_type_idx" ON "public"."rid_ride_expenses"("expense_type");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_incurred_at_idx" ON "public"."rid_ride_expenses"("incurred_at");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_reimbursed_at_idx" ON "public"."rid_ride_expenses"("reimbursed_at");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_reimbursed_idx" ON "public"."rid_ride_expenses"("reimbursed");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_document_id_idx" ON "public"."rid_ride_expenses"("document_id");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_deleted_at_idx" ON "public"."rid_ride_expenses"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_created_by_idx" ON "public"."rid_ride_expenses"("created_by");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_updated_by_idx" ON "public"."rid_ride_expenses"("updated_by");

-- CreateIndex
CREATE INDEX "rid_ride_expenses_metadata_idx" ON "public"."rid_ride_expenses" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_tenant_id_idx" ON "public"."rid_ride_cancellations"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_ride_id_idx" ON "public"."rid_ride_cancellations"("ride_id");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_cancelled_by_idx" ON "public"."rid_ride_cancellations"("cancelled_by");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_cancellation_reason_idx" ON "public"."rid_ride_cancellations"("cancellation_reason");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_cancelled_at_idx" ON "public"."rid_ride_cancellations"("cancelled_at");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_ride_stage_idx" ON "public"."rid_ride_cancellations"("ride_stage");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_refund_processed_idx" ON "public"."rid_ride_cancellations"("refund_processed");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_deleted_at_idx" ON "public"."rid_ride_cancellations"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_created_by_idx" ON "public"."rid_ride_cancellations"("created_by");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_updated_by_idx" ON "public"."rid_ride_cancellations"("updated_by");

-- CreateIndex
CREATE INDEX "rid_ride_cancellations_metadata_idx" ON "public"."rid_ride_cancellations" USING GIN ("metadata");

-- CreateIndex
CREATE UNIQUE INDEX "rid_ride_cancellations_tenant_id_ride_id_deleted_at_key" ON "public"."rid_ride_cancellations"("tenant_id", "ride_id", "deleted_at");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_tenant_id_idx" ON "public"."rid_ride_waypoints"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_ride_id_idx" ON "public"."rid_ride_waypoints"("ride_id");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_ride_id_waypoint_order_idx" ON "public"."rid_ride_waypoints"("ride_id", "waypoint_order");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_arrival_time_idx" ON "public"."rid_ride_waypoints"("arrival_time");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_departure_time_idx" ON "public"."rid_ride_waypoints"("departure_time");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_completed_idx" ON "public"."rid_ride_waypoints"("completed");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_skipped_idx" ON "public"."rid_ride_waypoints"("skipped");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_deleted_at_idx" ON "public"."rid_ride_waypoints"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_created_by_idx" ON "public"."rid_ride_waypoints"("created_by");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_updated_by_idx" ON "public"."rid_ride_waypoints"("updated_by");

-- CreateIndex
CREATE INDEX "rid_ride_waypoints_metadata_idx" ON "public"."rid_ride_waypoints" USING GIN ("metadata");

-- CreateIndex
CREATE UNIQUE INDEX "rid_ride_waypoints_tenant_id_ride_id_waypoint_order_deleted_key" ON "public"."rid_ride_waypoints"("tenant_id", "ride_id", "waypoint_order", "deleted_at");

-- AddForeignKey
ALTER TABLE "public"."rid_rides" ADD CONSTRAINT "rid_rides_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_rides" ADD CONSTRAINT "rid_rides_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."flt_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_rides" ADD CONSTRAINT "rid_rides_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_rides" ADD CONSTRAINT "rid_rides_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "public"."dir_platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_rides" ADD CONSTRAINT "rid_rides_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_rides" ADD CONSTRAINT "rid_rides_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_rides" ADD CONSTRAINT "rid_rides_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_ratings" ADD CONSTRAINT "rid_ride_ratings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_ratings" ADD CONSTRAINT "rid_ride_ratings_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rid_rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_ratings" ADD CONSTRAINT "rid_ride_ratings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_ratings" ADD CONSTRAINT "rid_ride_ratings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_ratings" ADD CONSTRAINT "rid_ride_ratings_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_incidents" ADD CONSTRAINT "rid_ride_incidents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_incidents" ADD CONSTRAINT "rid_ride_incidents_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rid_rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_incidents" ADD CONSTRAINT "rid_ride_incidents_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_incidents" ADD CONSTRAINT "rid_ride_incidents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_incidents" ADD CONSTRAINT "rid_ride_incidents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_incidents" ADD CONSTRAINT "rid_ride_incidents_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_expenses" ADD CONSTRAINT "rid_ride_expenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_expenses" ADD CONSTRAINT "rid_ride_expenses_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rid_rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_expenses" ADD CONSTRAINT "rid_ride_expenses_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."doc_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_expenses" ADD CONSTRAINT "rid_ride_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_expenses" ADD CONSTRAINT "rid_ride_expenses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_expenses" ADD CONSTRAINT "rid_ride_expenses_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_cancellations" ADD CONSTRAINT "rid_ride_cancellations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_cancellations" ADD CONSTRAINT "rid_ride_cancellations_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rid_rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_cancellations" ADD CONSTRAINT "rid_ride_cancellations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_cancellations" ADD CONSTRAINT "rid_ride_cancellations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_cancellations" ADD CONSTRAINT "rid_ride_cancellations_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_waypoints" ADD CONSTRAINT "rid_ride_waypoints_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_waypoints" ADD CONSTRAINT "rid_ride_waypoints_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."rid_rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_waypoints" ADD CONSTRAINT "rid_ride_waypoints_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_waypoints" ADD CONSTRAINT "rid_ride_waypoints_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_ride_waypoints" ADD CONSTRAINT "rid_ride_waypoints_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ====================================================================
-- ENRICHMENTS: Triggers, RLS, CHECK constraints, Partial indexes
-- ====================================================================

-- Triggers for updated_at (6 tables)
CREATE TRIGGER update_rid_rides_updated_at
  BEFORE UPDATE ON "public"."rid_rides"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_rid_ride_ratings_updated_at
  BEFORE UPDATE ON "public"."rid_ride_ratings"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_rid_ride_incidents_updated_at
  BEFORE UPDATE ON "public"."rid_ride_incidents"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_rid_ride_expenses_updated_at
  BEFORE UPDATE ON "public"."rid_ride_expenses"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_rid_ride_cancellations_updated_at
  BEFORE UPDATE ON "public"."rid_ride_cancellations"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_rid_ride_waypoints_updated_at
  BEFORE UPDATE ON "public"."rid_ride_waypoints"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Enable RLS (6 tables)
ALTER TABLE "public"."rid_rides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rid_ride_ratings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rid_ride_incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rid_ride_expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rid_ride_cancellations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rid_ride_waypoints" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rid_rides
CREATE POLICY tenant_isolation_rid_rides ON "public"."rid_rides"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_rid_rides ON "public"."rid_rides"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for rid_ride_ratings
CREATE POLICY tenant_isolation_rid_ride_ratings ON "public"."rid_ride_ratings"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_rid_ride_ratings ON "public"."rid_ride_ratings"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for rid_ride_incidents
CREATE POLICY tenant_isolation_rid_ride_incidents ON "public"."rid_ride_incidents"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_rid_ride_incidents ON "public"."rid_ride_incidents"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for rid_ride_expenses
CREATE POLICY tenant_isolation_rid_ride_expenses ON "public"."rid_ride_expenses"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_rid_ride_expenses ON "public"."rid_ride_expenses"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for rid_ride_cancellations
CREATE POLICY tenant_isolation_rid_ride_cancellations ON "public"."rid_ride_cancellations"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_rid_ride_cancellations ON "public"."rid_ride_cancellations"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for rid_ride_waypoints
CREATE POLICY tenant_isolation_rid_ride_waypoints ON "public"."rid_ride_waypoints"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_rid_ride_waypoints ON "public"."rid_ride_waypoints"
  FOR ALL TO authenticated
  USING (true);

-- CHECK constraints for ratings (1-5)
ALTER TABLE "public"."rid_ride_ratings"
  ADD CONSTRAINT "rid_ride_ratings_rating_check"
  CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE "public"."rid_ride_ratings"
  ADD CONSTRAINT "rid_ride_ratings_passenger_rating_check"
  CHECK (passenger_rating IS NULL OR passenger_rating BETWEEN 1 AND 5);

ALTER TABLE "public"."rid_ride_ratings"
  ADD CONSTRAINT "rid_ride_ratings_vehicle_rating_check"
  CHECK (vehicle_rating IS NULL OR vehicle_rating BETWEEN 1 AND 5);

ALTER TABLE "public"."rid_ride_ratings"
  ADD CONSTRAINT "rid_ride_ratings_service_rating_check"
  CHECK (service_rating IS NULL OR service_rating BETWEEN 1 AND 5);

-- Partial indexes on status WHERE deleted_at IS NULL (3 tables with status)
DROP INDEX IF EXISTS "public"."rid_rides_status_idx";
CREATE INDEX "rid_rides_status_active_idx" ON "public"."rid_rides"("status") WHERE "deleted_at" IS NULL;

DROP INDEX IF EXISTS "public"."rid_ride_incidents_resolution_status_idx";
CREATE INDEX "rid_ride_incidents_resolution_status_active_idx" ON "public"."rid_ride_incidents"("resolution_status") WHERE "deleted_at" IS NULL;

-- Partial indexes on reimbursed/refund_processed WHERE deleted_at IS NULL
DROP INDEX IF EXISTS "public"."rid_ride_expenses_reimbursed_idx";
CREATE INDEX "rid_ride_expenses_reimbursed_pending_idx" ON "public"."rid_ride_expenses"("reimbursed") WHERE "deleted_at" IS NULL AND "reimbursed" = false;

DROP INDEX IF EXISTS "public"."rid_ride_cancellations_refund_processed_idx";
CREATE INDEX "rid_ride_cancellations_refund_pending_idx" ON "public"."rid_ride_cancellations"("refund_processed") WHERE "deleted_at" IS NULL AND "refund_processed" = false;
