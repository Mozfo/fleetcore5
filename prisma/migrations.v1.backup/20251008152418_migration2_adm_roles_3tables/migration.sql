-- AlterTable
ALTER TABLE "public"."adm_members" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."adm_tenants" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- AlterTable
ALTER TABLE "public"."crm_leads" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4();

-- CreateTable
CREATE TABLE "public"."adm_roles" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "adm_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adm_member_roles" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "adm_member_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adm_audit_logs" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "member_id" UUID,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "changes" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "logged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "adm_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adm_roles_tenant_id_idx" ON "public"."adm_roles"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_roles_status_idx" ON "public"."adm_roles"("status");

-- CreateIndex
CREATE INDEX "adm_roles_deleted_at_idx" ON "public"."adm_roles"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_roles_created_by_idx" ON "public"."adm_roles"("created_by");

-- CreateIndex
CREATE INDEX "adm_roles_updated_by_idx" ON "public"."adm_roles"("updated_by");

-- CreateIndex
CREATE INDEX "adm_roles_permissions_idx" ON "public"."adm_roles" USING GIN ("permissions");

-- CreateIndex
CREATE UNIQUE INDEX "adm_roles_tenant_id_name_deleted_at_key" ON "public"."adm_roles"("tenant_id", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "adm_member_roles_tenant_id_idx" ON "public"."adm_member_roles"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_member_roles_member_id_idx" ON "public"."adm_member_roles"("member_id");

-- CreateIndex
CREATE INDEX "adm_member_roles_role_id_idx" ON "public"."adm_member_roles"("role_id");

-- CreateIndex
CREATE INDEX "adm_member_roles_deleted_at_idx" ON "public"."adm_member_roles"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_member_roles_created_by_idx" ON "public"."adm_member_roles"("created_by");

-- CreateIndex
CREATE INDEX "adm_member_roles_updated_by_idx" ON "public"."adm_member_roles"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "adm_member_roles_tenant_id_member_id_role_id_deleted_at_key" ON "public"."adm_member_roles"("tenant_id", "member_id", "role_id", "deleted_at");

-- CreateIndex
CREATE INDEX "adm_audit_logs_tenant_id_entity_type_entity_id_idx" ON "public"."adm_audit_logs"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "adm_audit_logs_tenant_id_idx" ON "public"."adm_audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_audit_logs_logged_at_idx" ON "public"."adm_audit_logs"("logged_at" DESC);

-- CreateIndex
CREATE INDEX "adm_audit_logs_deleted_at_idx" ON "public"."adm_audit_logs"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_audit_logs_created_by_idx" ON "public"."adm_audit_logs"("created_by");

-- CreateIndex
CREATE INDEX "adm_audit_logs_updated_by_idx" ON "public"."adm_audit_logs"("updated_by");

-- CreateIndex
CREATE INDEX "adm_audit_logs_changes_idx" ON "public"."adm_audit_logs" USING GIN ("changes");

-- AddForeignKey
ALTER TABLE "public"."adm_roles" ADD CONSTRAINT "adm_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_member_roles" ADD CONSTRAINT "adm_member_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_member_roles" ADD CONSTRAINT "adm_member_roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."adm_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_member_roles" ADD CONSTRAINT "adm_member_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."adm_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_audit_logs" ADD CONSTRAINT "adm_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_audit_logs" ADD CONSTRAINT "adm_audit_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_adm_roles_updated_at
  BEFORE UPDATE ON "public"."adm_roles"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_adm_member_roles_updated_at
  BEFORE UPDATE ON "public"."adm_member_roles"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_adm_audit_logs_updated_at
  BEFORE UPDATE ON "public"."adm_audit_logs"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Enable RLS
ALTER TABLE "public"."adm_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."adm_member_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."adm_audit_logs" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for adm_roles
CREATE POLICY tenant_isolation_adm_roles ON "public"."adm_roles"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_adm_roles ON "public"."adm_roles"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for adm_member_roles
CREATE POLICY tenant_isolation_adm_member_roles ON "public"."adm_member_roles"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_adm_member_roles ON "public"."adm_member_roles"
  FOR ALL TO authenticated
  USING (true);

-- RLS Policies for adm_audit_logs
CREATE POLICY tenant_isolation_adm_audit_logs ON "public"."adm_audit_logs"
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY temp_allow_all_adm_audit_logs ON "public"."adm_audit_logs"
  FOR ALL TO authenticated
  USING (true);

-- Create partial indexes on status WHERE deleted_at IS NULL
DROP INDEX IF EXISTS "public"."adm_roles_status_idx";
CREATE INDEX "adm_roles_status_active_idx" ON "public"."adm_roles"("status") WHERE "deleted_at" IS NULL;
