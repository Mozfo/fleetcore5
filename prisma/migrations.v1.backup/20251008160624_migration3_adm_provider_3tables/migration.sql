-- AlterTable
ALTER TABLE "public"."adm_audit_logs" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_member_roles" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_members" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_roles" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_tenants" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."crm_leads" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- CreateTable
CREATE TABLE "public"."adm_provider_employees" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "clerk_user_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "department" VARCHAR(50),
    "title" VARCHAR(50),
    "permissions" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "adm_provider_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adm_tenant_lifecycle_events" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "performed_by" UUID,
    "effective_date" DATE,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "adm_tenant_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adm_invitations" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "sent_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "adm_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adm_provider_employees_clerk_user_id_idx" ON "public"."adm_provider_employees"("clerk_user_id");

-- CreateIndex
CREATE INDEX "adm_provider_employees_email_idx" ON "public"."adm_provider_employees"("email");

-- CreateIndex
CREATE INDEX "adm_provider_employees_status_idx" ON "public"."adm_provider_employees"("status");

-- CreateIndex
CREATE INDEX "adm_provider_employees_deleted_at_idx" ON "public"."adm_provider_employees"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_provider_employees_created_by_idx" ON "public"."adm_provider_employees"("created_by");

-- CreateIndex
CREATE INDEX "adm_provider_employees_updated_by_idx" ON "public"."adm_provider_employees"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "adm_provider_employees_clerk_user_id_deleted_at_key" ON "public"."adm_provider_employees"("clerk_user_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "adm_provider_employees_email_deleted_at_key" ON "public"."adm_provider_employees"("email", "deleted_at");

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_tenant_id_event_type_idx" ON "public"."adm_tenant_lifecycle_events"("tenant_id", "event_type");

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_tenant_id_idx" ON "public"."adm_tenant_lifecycle_events"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_event_type_idx" ON "public"."adm_tenant_lifecycle_events"("event_type");

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_effective_date_idx" ON "public"."adm_tenant_lifecycle_events"("effective_date" DESC);

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_deleted_at_idx" ON "public"."adm_tenant_lifecycle_events"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_created_by_idx" ON "public"."adm_tenant_lifecycle_events"("created_by");

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_updated_by_idx" ON "public"."adm_tenant_lifecycle_events"("updated_by");

-- CreateIndex
CREATE INDEX "adm_invitations_tenant_id_idx" ON "public"."adm_invitations"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_invitations_token_idx" ON "public"."adm_invitations"("token");

-- CreateIndex
CREATE INDEX "adm_invitations_expires_at_idx" ON "public"."adm_invitations"("expires_at");

-- CreateIndex
CREATE INDEX "adm_invitations_status_idx" ON "public"."adm_invitations"("status");

-- CreateIndex
CREATE INDEX "adm_invitations_deleted_at_idx" ON "public"."adm_invitations"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_invitations_created_by_idx" ON "public"."adm_invitations"("created_by");

-- CreateIndex
CREATE INDEX "adm_invitations_updated_by_idx" ON "public"."adm_invitations"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "adm_invitations_token_deleted_at_key" ON "public"."adm_invitations"("token", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "adm_invitations_tenant_id_email_role_status_deleted_at_key" ON "public"."adm_invitations"("tenant_id", "email", "role", "status", "deleted_at");

-- AddForeignKey
ALTER TABLE "public"."adm_provider_employees" ADD CONSTRAINT "adm_provider_employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_provider_employees" ADD CONSTRAINT "adm_provider_employees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_provider_employees" ADD CONSTRAINT "adm_provider_employees_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_tenant_lifecycle_events" ADD CONSTRAINT "adm_tenant_lifecycle_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_tenant_lifecycle_events" ADD CONSTRAINT "adm_tenant_lifecycle_events_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_invitations" ADD CONSTRAINT "adm_invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_invitations" ADD CONSTRAINT "adm_invitations_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_adm_provider_employees_updated_at
  BEFORE UPDATE ON "public"."adm_provider_employees"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_adm_tenant_lifecycle_events_updated_at
  BEFORE UPDATE ON "public"."adm_tenant_lifecycle_events"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_adm_invitations_updated_at
  BEFORE UPDATE ON "public"."adm_invitations"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Enable RLS
ALTER TABLE "public"."adm_provider_employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."adm_tenant_lifecycle_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."adm_invitations" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for adm_provider_employees (table globale, pas de tenant_isolation)
CREATE POLICY temp_allow_all_adm_provider_employees ON "public"."adm_provider_employees"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for adm_tenant_lifecycle_events
CREATE POLICY tenant_isolation_adm_tenant_lifecycle_events ON "public"."adm_tenant_lifecycle_events"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_adm_tenant_lifecycle_events ON "public"."adm_tenant_lifecycle_events"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for adm_invitations
CREATE POLICY tenant_isolation_adm_invitations ON "public"."adm_invitations"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_adm_invitations ON "public"."adm_invitations"
  FOR ALL TO authenticated
  USING (true);

-- Create partial indexes on status WHERE deleted_at IS NULL
DROP INDEX IF EXISTS "public"."adm_provider_employees_status_idx";
CREATE INDEX "adm_provider_employees_status_active_idx" ON "public"."adm_provider_employees"("status") WHERE "deleted_at" IS NULL;

DROP INDEX IF EXISTS "public"."adm_invitations_status_idx";
CREATE INDEX "adm_invitations_status_active_idx" ON "public"."adm_invitations"("status") WHERE "deleted_at" IS NULL;
