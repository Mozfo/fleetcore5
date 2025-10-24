-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."adm_audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "member_id" UUID,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "changes" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adm_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adm_member_roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
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
CREATE TABLE "public"."adm_members" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "clerk_user_id" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone" VARCHAR(50),
    "role" VARCHAR(50) NOT NULL DEFAULT 'member',
    "last_login_at" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "adm_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adm_provider_employees" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
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
CREATE TABLE "public"."adm_roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
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
CREATE TABLE "public"."adm_tenant_lifecycle_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "performed_by" UUID,
    "effective_date" DATE,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adm_tenant_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adm_tenants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "clerk_organization_id" TEXT,
    "vat_rate" DECIMAL(5,2),
    "default_currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "subdomain" VARCHAR(100),

    CONSTRAINT "adm_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bil_billing_plans" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "plan_name" TEXT NOT NULL,
    "description" TEXT,
    "monthly_fee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "annual_fee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "features" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "bil_billing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bil_payment_methods" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "payment_type" TEXT NOT NULL,
    "provider_token" TEXT NOT NULL,
    "expires_at" DATE,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "bil_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bil_tenant_invoice_lines" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "bil_tenant_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bil_tenant_invoices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "bil_tenant_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bil_tenant_subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "subscription_start" DATE NOT NULL,
    "subscription_end" DATE,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "bil_tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bil_tenant_usage_metrics" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "metric_name" VARCHAR(50) NOT NULL,
    "metric_value" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "bil_tenant_usage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_contracts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lead_id" UUID NOT NULL,
    "contract_reference" TEXT NOT NULL,
    "contract_date" DATE NOT NULL,
    "effective_date" DATE NOT NULL,
    "expiry_date" DATE,
    "total_value" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,
    "opportunity_id" UUID,

    CONSTRAINT "crm_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_leads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "demo_company_name" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country_code" VARCHAR(2),
    "fleet_size" VARCHAR(50),
    "current_software" VARCHAR(255),
    "assigned_to" UUID,
    "qualification_score" INTEGER,
    "qualification_notes" TEXT,
    "qualified_date" TIMESTAMPTZ(6),
    "converted_date" TIMESTAMPTZ(6),
    "utm_source" VARCHAR(255),
    "utm_medium" VARCHAR(255),
    "utm_campaign" VARCHAR(255),
    "metadata" JSONB DEFAULT '{}',
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_opportunities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lead_id" UUID NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'prospect',
    "expected_value" DECIMAL(18,2),
    "close_date" DATE,
    "assigned_to" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,
    "probability" INTEGER,

    CONSTRAINT "crm_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dir_car_makes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dir_car_makes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dir_car_models" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID,
    "make_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicle_class_id" UUID,

    CONSTRAINT "dir_car_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dir_country_regulations" (
    "country_code" CHAR(2) NOT NULL,
    "vehicle_max_age" INTEGER,
    "min_vehicle_class" TEXT,
    "min_fare_per_trip" DECIMAL(10,2),
    "min_fare_per_km" DECIMAL(10,2),
    "min_fare_per_hour" DECIMAL(10,2),
    "vat_rate" DECIMAL(5,2),
    "currency" CHAR(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requires_vtc_card" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "dir_country_regulations_pkey" PRIMARY KEY ("country_code")
);

-- CreateTable
CREATE TABLE "public"."dir_platforms" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "api_config" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dir_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dir_vehicle_classes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "country_code" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_age" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dir_vehicle_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."doc_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "issue_date" DATE,
    "expiry_date" DATE,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fin_accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "fin_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fin_driver_payment_batches" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "batch_reference" TEXT NOT NULL,
    "payment_date" DATE NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "fin_driver_payment_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fin_driver_payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "payment_batch_id" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "payment_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "fin_driver_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fin_toll_transactions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "toll_gate" TEXT NOT NULL,
    "toll_date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "fin_toll_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fin_traffic_fines" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "fine_reference" TEXT NOT NULL,
    "fine_date" DATE NOT NULL,
    "fine_type" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "fin_traffic_fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fin_transactions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT,
    "transaction_date" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "fin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_vehicle_assignments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "assignment_type" VARCHAR(50) NOT NULL DEFAULT 'permanent',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "flt_vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_vehicle_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_date" TIMESTAMPTZ(6) NOT NULL,
    "severity" TEXT,
    "downtime_hours" INTEGER,
    "cost_amount" DECIMAL(10,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "details" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
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
CREATE TABLE "public"."flt_vehicle_expenses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID,
    "ride_id" UUID,
    "expense_date" DATE NOT NULL,
    "expense_category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "payment_method" TEXT,
    "receipt_url" TEXT,
    "odometer_reading" INTEGER,
    "quantity" DECIMAL(10,2),
    "unit_price" DECIMAL(10,2),
    "location" TEXT,
    "vendor" TEXT,
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
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "provider_name" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "policy_type" TEXT NOT NULL,
    "coverage_amount" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "deductible_amount" DECIMAL(10,2),
    "premium_amount" DECIMAL(10,2) NOT NULL,
    "premium_frequency" TEXT NOT NULL DEFAULT 'annual',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
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

-- CreateTable
CREATE TABLE "public"."flt_vehicle_maintenance" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "maintenance_type" TEXT NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "completed_date" DATE,
    "odometer_reading" INTEGER,
    "next_service_km" INTEGER,
    "next_service_date" DATE,
    "provider_name" TEXT,
    "provider_contact" TEXT,
    "cost_amount" DECIMAL(10,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "invoice_reference" TEXT,
    "parts_replaced" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "flt_vehicle_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flt_vehicles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "make_id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "license_plate" TEXT NOT NULL,
    "vin" TEXT,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "seats" INTEGER NOT NULL DEFAULT 4,
    "vehicle_class" TEXT,
    "fuel_type" TEXT,
    "transmission" TEXT,
    "registration_date" DATE,
    "insurance_number" TEXT,
    "insurance_expiry" DATE,
    "last_inspection" DATE,
    "next_inspection" DATE,
    "odometer" INTEGER,
    "ownership_type" TEXT NOT NULL DEFAULT 'owned',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
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
CREATE TABLE "public"."rev_driver_revenues" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "total_revenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "commission_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "net_revenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rev_driver_revenues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rev_reconciliations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "import_id" UUID NOT NULL,
    "reconciliation_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rev_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rev_revenue_imports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "import_reference" TEXT NOT NULL,
    "import_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_revenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rev_revenue_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_driver_blacklists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_driver_blacklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_driver_cooperation_terms" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "terms_version" TEXT NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "effective_date" DATE,
    "expiry_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_driver_cooperation_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_driver_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "expiry_date" DATE,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_driver_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_driver_performances" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "trips_completed" INTEGER NOT NULL DEFAULT 0,
    "trips_cancelled" INTEGER NOT NULL DEFAULT 0,
    "on_time_rate" DECIMAL(5,2),
    "avg_rating" DECIMAL(3,2),
    "incidents_count" INTEGER NOT NULL DEFAULT 0,
    "earnings_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hours_online" DECIMAL(7,2),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_driver_performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_driver_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "request_type" TEXT NOT NULL,
    "request_date" DATE NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolution_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_driver_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_driver_training" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "training_name" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "assigned_at" TIMESTAMPTZ(6),
    "due_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "score" DECIMAL(5,2),
    "certificate_url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_driver_training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_drivers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "license_issue_date" DATE,
    "license_expiry_date" DATE,
    "professional_card_no" TEXT,
    "professional_expiry" DATE,
    "driver_status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "rating" DECIMAL,
    "notes" TEXT,
    "date_of_birth" DATE,
    "gender" TEXT,
    "nationality" CHAR(2),
    "hire_date" DATE,
    "employment_status" TEXT NOT NULL DEFAULT 'active',
    "cooperation_type" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,

    CONSTRAINT "rid_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sch_goals" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "goal_type" TEXT NOT NULL,
    "target_value" DECIMAL NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "assigned_to" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "sch_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sch_maintenance_schedules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "maintenance_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "sch_maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sch_shifts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "end_time" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "sch_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sch_tasks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "task_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "due_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "sch_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sup_customer_feedback" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "submitter_type" VARCHAR(50) NOT NULL,
    "feedback_text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "sup_customer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sup_ticket_messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ticket_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "message_body" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "sup_ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sup_tickets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "raised_by" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assigned_to" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "sup_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trp_client_invoices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "trp_client_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trp_platform_accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "account_identifier" TEXT NOT NULL,
    "api_key" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "trp_platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trp_settlements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "settlement_reference" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "platform_commission" DECIMAL(14,2) NOT NULL,
    "net_amount" DECIMAL(14,2) NOT NULL,
    "settlement_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "trp_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trp_trips" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "platform_id" UUID,
    "pickup_latitude" DECIMAL(10,8),
    "pickup_longitude" DECIMAL(11,8),
    "start_time" TIMESTAMPTZ(6),
    "dropoff_latitude" DECIMAL(10,8),
    "dropoff_longitude" DECIMAL(11,8),
    "end_time" TIMESTAMPTZ(6),
    "distance_km" DECIMAL(10,2),
    "duration_minutes" DECIMAL,
    "payment_method" VARCHAR(50),
    "platform_commission" DECIMAL(10,2),
    "net_earnings" DECIMAL(10,2),
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "client_id" UUID,
    "trip_date" DATE,
    "fare_base" DECIMAL,
    "fare_distance" DECIMAL,
    "fare_time" DECIMAL,
    "surge_multiplier" DECIMAL,
    "tip_amount" DECIMAL,

    CONSTRAINT "trp_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rid_driver_languages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "language_code" CHAR(2) NOT NULL,
    "proficiency" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deletion_reason" TEXT,

    CONSTRAINT "rid_driver_languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adm_audit_logs_changes_gin" ON "public"."adm_audit_logs" USING GIN ("changes");

-- CreateIndex
CREATE INDEX "adm_audit_logs_changes_idx" ON "public"."adm_audit_logs" USING GIN ("changes");

-- CreateIndex
CREATE INDEX "adm_audit_logs_tenant_entity_entity_id_idx" ON "public"."adm_audit_logs"("tenant_id", "entity", "entity_id");

-- CreateIndex
CREATE INDEX "adm_audit_logs_tenant_id_idx" ON "public"."adm_audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_audit_logs_timestamp_idx" ON "public"."adm_audit_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "adm_member_roles_created_by_idx" ON "public"."adm_member_roles"("created_by");

-- CreateIndex
CREATE INDEX "adm_member_roles_deleted_at_idx" ON "public"."adm_member_roles"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_member_roles_member_id_idx" ON "public"."adm_member_roles"("member_id");

-- CreateIndex
CREATE INDEX "adm_member_roles_role_id_idx" ON "public"."adm_member_roles"("role_id");

-- CreateIndex
CREATE INDEX "adm_member_roles_tenant_id_idx" ON "public"."adm_member_roles"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_member_roles_updated_by_idx" ON "public"."adm_member_roles"("updated_by");

-- CreateIndex
CREATE INDEX "adm_members_clerk_user_id_idx" ON "public"."adm_members"("clerk_user_id");

-- CreateIndex
CREATE INDEX "adm_members_created_by_idx" ON "public"."adm_members"("created_by");

-- CreateIndex
CREATE INDEX "adm_members_deleted_at_idx" ON "public"."adm_members"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_members_email_idx" ON "public"."adm_members"("email");

-- CreateIndex
CREATE INDEX "adm_members_last_login_at_idx" ON "public"."adm_members"("last_login_at");

-- CreateIndex
CREATE INDEX "adm_members_metadata_gin" ON "public"."adm_members" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "adm_members_metadata_idx" ON "public"."adm_members" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "adm_members_tenant_id_idx" ON "public"."adm_members"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_members_updated_by_idx" ON "public"."adm_members"("updated_by");

-- CreateIndex
CREATE INDEX "adm_provider_employees_created_by_idx" ON "public"."adm_provider_employees"("created_by");

-- CreateIndex
CREATE INDEX "adm_provider_employees_deleted_at_idx" ON "public"."adm_provider_employees"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_provider_employees_permissions_gin" ON "public"."adm_provider_employees" USING GIN ("permissions");

-- CreateIndex
CREATE INDEX "adm_provider_employees_updated_by_idx" ON "public"."adm_provider_employees"("updated_by");

-- CreateIndex
CREATE INDEX "adm_roles_created_by_idx" ON "public"."adm_roles"("created_by");

-- CreateIndex
CREATE INDEX "adm_roles_deleted_at_idx" ON "public"."adm_roles"("deleted_at");

-- CreateIndex
CREATE INDEX "adm_roles_permissions_gin" ON "public"."adm_roles" USING GIN ("permissions");

-- CreateIndex
CREATE INDEX "adm_roles_tenant_id_idx" ON "public"."adm_roles"("tenant_id");

-- CreateIndex
CREATE INDEX "adm_roles_updated_by_idx" ON "public"."adm_roles"("updated_by");

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_effective_date_idx" ON "public"."adm_tenant_lifecycle_events"("effective_date" DESC);

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_event_type_idx" ON "public"."adm_tenant_lifecycle_events"("event_type");

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_tenant_event_idx" ON "public"."adm_tenant_lifecycle_events"("tenant_id", "event_type");

-- CreateIndex
CREATE INDEX "adm_tenant_lifecycle_events_tenant_id_idx" ON "public"."adm_tenant_lifecycle_events"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "adm_tenants_clerk_org_unique" ON "public"."adm_tenants"("clerk_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "adm_tenants_subdomain_key" ON "public"."adm_tenants"("subdomain");

-- CreateIndex
CREATE INDEX "adm_tenants_clerk_organization_id_idx" ON "public"."adm_tenants"("clerk_organization_id");

-- CreateIndex
CREATE INDEX "adm_tenants_country_code_idx" ON "public"."adm_tenants"("country_code");

-- CreateIndex
CREATE INDEX "adm_tenants_default_currency_idx" ON "public"."adm_tenants"("default_currency");

-- CreateIndex
CREATE INDEX "adm_tenants_deleted_at_idx" ON "public"."adm_tenants"("deleted_at");

-- CreateIndex
CREATE INDEX "bil_billing_plans_created_by_idx" ON "public"."bil_billing_plans"("created_by");

-- CreateIndex
CREATE INDEX "bil_billing_plans_deleted_at_idx" ON "public"."bil_billing_plans"("deleted_at");

-- CreateIndex
CREATE INDEX "bil_billing_plans_features_idx" ON "public"."bil_billing_plans" USING GIN ("features");

-- CreateIndex
CREATE INDEX "bil_billing_plans_metadata_idx" ON "public"."bil_billing_plans" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "bil_billing_plans_updated_by_idx" ON "public"."bil_billing_plans"("updated_by");

-- CreateIndex
CREATE INDEX "bil_payment_methods_created_by_idx" ON "public"."bil_payment_methods"("created_by");

-- CreateIndex
CREATE INDEX "bil_payment_methods_deleted_at_idx" ON "public"."bil_payment_methods"("deleted_at");

-- CreateIndex
CREATE INDEX "bil_payment_methods_expires_at_idx" ON "public"."bil_payment_methods"("expires_at");

-- CreateIndex
CREATE INDEX "bil_payment_methods_metadata_idx" ON "public"."bil_payment_methods" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "bil_payment_methods_payment_type_idx" ON "public"."bil_payment_methods"("payment_type");

-- CreateIndex
CREATE INDEX "bil_payment_methods_tenant_id_idx" ON "public"."bil_payment_methods"("tenant_id");

-- CreateIndex
CREATE INDEX "bil_payment_methods_updated_by_idx" ON "public"."bil_payment_methods"("updated_by");

-- CreateIndex
CREATE INDEX "bil_tenant_invoice_lines_created_by_idx" ON "public"."bil_tenant_invoice_lines"("created_by");

-- CreateIndex
CREATE INDEX "bil_tenant_invoice_lines_deleted_at_idx" ON "public"."bil_tenant_invoice_lines"("deleted_at");

-- CreateIndex
CREATE INDEX "bil_tenant_invoice_lines_description_idx" ON "public"."bil_tenant_invoice_lines"("description");

-- CreateIndex
CREATE INDEX "bil_tenant_invoice_lines_invoice_id_idx" ON "public"."bil_tenant_invoice_lines"("invoice_id");

-- CreateIndex
CREATE INDEX "bil_tenant_invoice_lines_metadata_idx" ON "public"."bil_tenant_invoice_lines" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "bil_tenant_invoice_lines_updated_by_idx" ON "public"."bil_tenant_invoice_lines"("updated_by");

-- CreateIndex
CREATE INDEX "bil_tenant_invoices_created_by_idx" ON "public"."bil_tenant_invoices"("created_by");

-- CreateIndex
CREATE INDEX "bil_tenant_invoices_deleted_at_idx" ON "public"."bil_tenant_invoices"("deleted_at");

-- CreateIndex
CREATE INDEX "bil_tenant_invoices_due_date_idx" ON "public"."bil_tenant_invoices"("due_date");

-- CreateIndex
CREATE INDEX "bil_tenant_invoices_invoice_date_idx" ON "public"."bil_tenant_invoices"("invoice_date");

-- CreateIndex
CREATE INDEX "bil_tenant_invoices_invoice_number_idx" ON "public"."bil_tenant_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "bil_tenant_invoices_metadata_idx" ON "public"."bil_tenant_invoices" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "bil_tenant_invoices_tenant_id_idx" ON "public"."bil_tenant_invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "bil_tenant_invoices_updated_by_idx" ON "public"."bil_tenant_invoices"("updated_by");

-- CreateIndex
CREATE INDEX "bil_tenant_subscriptions_created_by_idx" ON "public"."bil_tenant_subscriptions"("created_by");

-- CreateIndex
CREATE INDEX "bil_tenant_subscriptions_deleted_at_idx" ON "public"."bil_tenant_subscriptions"("deleted_at");

-- CreateIndex
CREATE INDEX "bil_tenant_subscriptions_metadata_idx" ON "public"."bil_tenant_subscriptions" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "bil_tenant_subscriptions_plan_id_idx" ON "public"."bil_tenant_subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "bil_tenant_subscriptions_subscription_end_idx" ON "public"."bil_tenant_subscriptions"("subscription_end");

-- CreateIndex
CREATE INDEX "bil_tenant_subscriptions_subscription_start_idx" ON "public"."bil_tenant_subscriptions"("subscription_start");

-- CreateIndex
CREATE INDEX "bil_tenant_subscriptions_tenant_id_idx" ON "public"."bil_tenant_subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "bil_tenant_subscriptions_updated_by_idx" ON "public"."bil_tenant_subscriptions"("updated_by");

-- CreateIndex
CREATE INDEX "bil_tenant_usage_metrics_created_by_idx" ON "public"."bil_tenant_usage_metrics"("created_by");

-- CreateIndex
CREATE INDEX "bil_tenant_usage_metrics_deleted_at_idx" ON "public"."bil_tenant_usage_metrics"("deleted_at");

-- CreateIndex
CREATE INDEX "bil_tenant_usage_metrics_metadata_idx" ON "public"."bil_tenant_usage_metrics" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "bil_tenant_usage_metrics_metric_name_idx" ON "public"."bil_tenant_usage_metrics"("metric_name");

-- CreateIndex
CREATE INDEX "bil_tenant_usage_metrics_period_end_idx" ON "public"."bil_tenant_usage_metrics"("period_end");

-- CreateIndex
CREATE INDEX "bil_tenant_usage_metrics_period_start_idx" ON "public"."bil_tenant_usage_metrics"("period_start");

-- CreateIndex
CREATE INDEX "bil_tenant_usage_metrics_tenant_id_idx" ON "public"."bil_tenant_usage_metrics"("tenant_id");

-- CreateIndex
CREATE INDEX "bil_tenant_usage_metrics_updated_by_idx" ON "public"."bil_tenant_usage_metrics"("updated_by");

-- CreateIndex
CREATE INDEX "crm_contracts_client_id_idx" ON "public"."crm_contracts"("lead_id");

-- CreateIndex
CREATE INDEX "crm_contracts_contract_date_idx" ON "public"."crm_contracts"("contract_date");

-- CreateIndex
CREATE INDEX "crm_contracts_created_by_idx" ON "public"."crm_contracts"("created_by");

-- CreateIndex
CREATE INDEX "crm_contracts_deleted_at_idx" ON "public"."crm_contracts"("deleted_at");

-- CreateIndex
CREATE INDEX "crm_contracts_effective_date_idx" ON "public"."crm_contracts"("effective_date");

-- CreateIndex
CREATE INDEX "crm_contracts_expiry_date_idx" ON "public"."crm_contracts"("expiry_date");

-- CreateIndex
CREATE INDEX "crm_contracts_metadata_idx" ON "public"."crm_contracts" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "crm_contracts_updated_by_idx" ON "public"."crm_contracts"("updated_by");

-- CreateIndex
CREATE INDEX "crm_leads_created_at_idx" ON "public"."crm_leads"("created_at" DESC);

-- CreateIndex
CREATE INDEX "crm_leads_deleted_at_idx" ON "public"."crm_leads"("deleted_at");

-- CreateIndex
CREATE INDEX "crm_leads_status_idx" ON "public"."crm_leads"("status");

-- CreateIndex
CREATE INDEX "crm_opportunities_assigned_to_idx" ON "public"."crm_opportunities"("assigned_to");

-- CreateIndex
CREATE INDEX "crm_opportunities_close_date_idx" ON "public"."crm_opportunities"("close_date");

-- CreateIndex
CREATE INDEX "crm_opportunities_created_by_idx" ON "public"."crm_opportunities"("created_by");

-- CreateIndex
CREATE INDEX "crm_opportunities_deleted_at_idx" ON "public"."crm_opportunities"("deleted_at");

-- CreateIndex
CREATE INDEX "crm_opportunities_lead_id_idx" ON "public"."crm_opportunities"("lead_id");

-- CreateIndex
CREATE INDEX "crm_opportunities_metadata_idx" ON "public"."crm_opportunities" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "crm_opportunities_updated_by_idx" ON "public"."crm_opportunities"("updated_by");

-- CreateIndex
CREATE INDEX "dir_car_makes_created_at_idx" ON "public"."dir_car_makes"("created_at");

-- CreateIndex
CREATE INDEX "dir_car_makes_tenant_id_idx" ON "public"."dir_car_makes"("tenant_id");

-- CreateIndex
CREATE INDEX "dir_car_makes_updated_at_idx" ON "public"."dir_car_makes"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "dir_car_makes_tenant_name_uq" ON "public"."dir_car_makes"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "dir_car_models_created_at_idx" ON "public"."dir_car_models"("created_at");

-- CreateIndex
CREATE INDEX "dir_car_models_make_id_idx" ON "public"."dir_car_models"("make_id");

-- CreateIndex
CREATE INDEX "dir_car_models_tenant_id_idx" ON "public"."dir_car_models"("tenant_id");

-- CreateIndex
CREATE INDEX "dir_car_models_updated_at_idx" ON "public"."dir_car_models"("updated_at");

-- CreateIndex
CREATE INDEX "dir_car_models_vehicle_class_id_idx" ON "public"."dir_car_models"("vehicle_class_id");

-- CreateIndex
CREATE UNIQUE INDEX "dir_car_models_tenant_make_name_uq" ON "public"."dir_car_models"("tenant_id", "make_id", "name");

-- CreateIndex
CREATE INDEX "dir_country_regulations_currency_idx" ON "public"."dir_country_regulations"("currency");

-- CreateIndex
CREATE INDEX "dir_country_regulations_timezone_idx" ON "public"."dir_country_regulations"("timezone");

-- CreateIndex
CREATE UNIQUE INDEX "dir_platforms_name_uq" ON "public"."dir_platforms"("name");

-- CreateIndex
CREATE INDEX "dir_platforms_api_config_gin" ON "public"."dir_platforms" USING GIN ("api_config");

-- CreateIndex
CREATE INDEX "dir_vehicle_classes_country_code_idx" ON "public"."dir_vehicle_classes"("country_code");

-- CreateIndex
CREATE INDEX "dir_vehicle_classes_created_at_idx" ON "public"."dir_vehicle_classes"("created_at");

-- CreateIndex
CREATE INDEX "dir_vehicle_classes_updated_at_idx" ON "public"."dir_vehicle_classes"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "dir_vehicle_classes_country_name_uq" ON "public"."dir_vehicle_classes"("country_code", "name");

-- CreateIndex
CREATE INDEX "doc_documents_created_at_idx" ON "public"."doc_documents"("created_at");

-- CreateIndex
CREATE INDEX "doc_documents_document_type_idx" ON "public"."doc_documents"("document_type");

-- CreateIndex
CREATE INDEX "doc_documents_entity_id_idx" ON "public"."doc_documents"("entity_id");

-- CreateIndex
CREATE INDEX "doc_documents_entity_type_idx" ON "public"."doc_documents"("entity_type");

-- CreateIndex
CREATE INDEX "doc_documents_expiry_date_idx" ON "public"."doc_documents"("expiry_date");

-- CreateIndex
CREATE INDEX "doc_documents_tenant_document_type_idx" ON "public"."doc_documents"("tenant_id", "document_type");

-- CreateIndex
CREATE INDEX "doc_documents_tenant_entity_idx" ON "public"."doc_documents"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "doc_documents_tenant_id_idx" ON "public"."doc_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "doc_documents_updated_at_idx" ON "public"."doc_documents"("updated_at");

-- CreateIndex
CREATE INDEX "idx_fin_accounts_account_name" ON "public"."fin_accounts"("account_name");

-- CreateIndex
CREATE INDEX "idx_fin_accounts_account_type" ON "public"."fin_accounts"("account_type");

-- CreateIndex
CREATE INDEX "idx_fin_accounts_created_by" ON "public"."fin_accounts"("created_by");

-- CreateIndex
CREATE INDEX "idx_fin_accounts_currency" ON "public"."fin_accounts"("currency");

-- CreateIndex
CREATE INDEX "idx_fin_accounts_deleted_at" ON "public"."fin_accounts"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_fin_accounts_metadata" ON "public"."fin_accounts" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "idx_fin_accounts_tenant_id" ON "public"."fin_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_fin_accounts_updated_by" ON "public"."fin_accounts"("updated_by");

-- CreateIndex
CREATE INDEX "fin_driver_payment_batches_batch_reference_idx" ON "public"."fin_driver_payment_batches"("batch_reference");

-- CreateIndex
CREATE INDEX "fin_driver_payment_batches_created_by_idx" ON "public"."fin_driver_payment_batches"("created_by");

-- CreateIndex
CREATE INDEX "fin_driver_payment_batches_deleted_at_idx" ON "public"."fin_driver_payment_batches"("deleted_at");

-- CreateIndex
CREATE INDEX "fin_driver_payment_batches_metadata_idx" ON "public"."fin_driver_payment_batches" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "fin_driver_payment_batches_payment_date_idx" ON "public"."fin_driver_payment_batches"("payment_date" DESC);

-- CreateIndex
CREATE INDEX "fin_driver_payment_batches_tenant_id_idx" ON "public"."fin_driver_payment_batches"("tenant_id");

-- CreateIndex
CREATE INDEX "fin_driver_payment_batches_updated_by_idx" ON "public"."fin_driver_payment_batches"("updated_by");

-- CreateIndex
CREATE INDEX "fin_driver_payments_created_by_idx" ON "public"."fin_driver_payments"("created_by");

-- CreateIndex
CREATE INDEX "fin_driver_payments_deleted_at_idx" ON "public"."fin_driver_payments"("deleted_at");

-- CreateIndex
CREATE INDEX "fin_driver_payments_driver_id_idx" ON "public"."fin_driver_payments"("driver_id");

-- CreateIndex
CREATE INDEX "fin_driver_payments_metadata_idx" ON "public"."fin_driver_payments" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "fin_driver_payments_payment_batch_id_idx" ON "public"."fin_driver_payments"("payment_batch_id");

-- CreateIndex
CREATE INDEX "fin_driver_payments_payment_date_idx" ON "public"."fin_driver_payments"("payment_date" DESC);

-- CreateIndex
CREATE INDEX "fin_driver_payments_tenant_id_idx" ON "public"."fin_driver_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "fin_driver_payments_updated_by_idx" ON "public"."fin_driver_payments"("updated_by");

-- CreateIndex
CREATE INDEX "fin_toll_transactions_created_by_idx" ON "public"."fin_toll_transactions"("created_by");

-- CreateIndex
CREATE INDEX "fin_toll_transactions_deleted_at_idx" ON "public"."fin_toll_transactions"("deleted_at");

-- CreateIndex
CREATE INDEX "fin_toll_transactions_driver_id_idx" ON "public"."fin_toll_transactions"("driver_id");

-- CreateIndex
CREATE INDEX "fin_toll_transactions_metadata_idx" ON "public"."fin_toll_transactions" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "fin_toll_transactions_tenant_id_idx" ON "public"."fin_toll_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "fin_toll_transactions_toll_date_idx" ON "public"."fin_toll_transactions"("toll_date" DESC);

-- CreateIndex
CREATE INDEX "fin_toll_transactions_updated_by_idx" ON "public"."fin_toll_transactions"("updated_by");

-- CreateIndex
CREATE INDEX "fin_toll_transactions_vehicle_id_idx" ON "public"."fin_toll_transactions"("vehicle_id");

-- CreateIndex
CREATE INDEX "fin_traffic_fines_created_by_idx" ON "public"."fin_traffic_fines"("created_by");

-- CreateIndex
CREATE INDEX "fin_traffic_fines_deleted_at_idx" ON "public"."fin_traffic_fines"("deleted_at");

-- CreateIndex
CREATE INDEX "fin_traffic_fines_driver_id_idx" ON "public"."fin_traffic_fines"("driver_id");

-- CreateIndex
CREATE INDEX "fin_traffic_fines_fine_date_idx" ON "public"."fin_traffic_fines"("fine_date" DESC);

-- CreateIndex
CREATE INDEX "fin_traffic_fines_metadata_idx" ON "public"."fin_traffic_fines" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "fin_traffic_fines_tenant_id_idx" ON "public"."fin_traffic_fines"("tenant_id");

-- CreateIndex
CREATE INDEX "fin_traffic_fines_updated_by_idx" ON "public"."fin_traffic_fines"("updated_by");

-- CreateIndex
CREATE INDEX "fin_traffic_fines_vehicle_id_idx" ON "public"."fin_traffic_fines"("vehicle_id");

-- CreateIndex
CREATE INDEX "fin_transactions_account_id_idx" ON "public"."fin_transactions"("account_id");

-- CreateIndex
CREATE INDEX "fin_transactions_created_by_idx" ON "public"."fin_transactions"("created_by");

-- CreateIndex
CREATE INDEX "fin_transactions_deleted_at_idx" ON "public"."fin_transactions"("deleted_at");

-- CreateIndex
CREATE INDEX "fin_transactions_metadata_idx" ON "public"."fin_transactions" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "fin_transactions_tenant_id_idx" ON "public"."fin_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "fin_transactions_transaction_date_idx" ON "public"."fin_transactions"("transaction_date" DESC);

-- CreateIndex
CREATE INDEX "fin_transactions_updated_by_idx" ON "public"."fin_transactions"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_assignments_created_by_idx" ON "public"."flt_vehicle_assignments"("created_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_assignments_deleted_at_idx" ON "public"."flt_vehicle_assignments"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_vehicle_assignments_driver_id_idx" ON "public"."flt_vehicle_assignments"("driver_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_assignments_end_date_idx" ON "public"."flt_vehicle_assignments"("end_date");

-- CreateIndex
CREATE INDEX "flt_vehicle_assignments_metadata_idx" ON "public"."flt_vehicle_assignments" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "flt_vehicle_assignments_start_date_idx" ON "public"."flt_vehicle_assignments"("start_date");

-- CreateIndex
CREATE INDEX "flt_vehicle_assignments_tenant_id_idx" ON "public"."flt_vehicle_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_assignments_updated_by_idx" ON "public"."flt_vehicle_assignments"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_assignments_vehicle_id_idx" ON "public"."flt_vehicle_assignments"("vehicle_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_created_at_idx" ON "public"."flt_vehicle_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "flt_vehicle_events_created_by_idx" ON "public"."flt_vehicle_events"("created_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_deleted_at_idx" ON "public"."flt_vehicle_events"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_details_idx" ON "public"."flt_vehicle_events" USING GIN ("details");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_event_date_idx" ON "public"."flt_vehicle_events"("event_date");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_event_type_idx" ON "public"."flt_vehicle_events"("event_type");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_tenant_id_idx" ON "public"."flt_vehicle_events"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_updated_by_idx" ON "public"."flt_vehicle_events"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_events_vehicle_id_idx" ON "public"."flt_vehicle_events"("vehicle_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_created_at_idx" ON "public"."flt_vehicle_expenses"("created_at" DESC);

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_created_by_idx" ON "public"."flt_vehicle_expenses"("created_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_deleted_at_idx" ON "public"."flt_vehicle_expenses"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_driver_id_idx" ON "public"."flt_vehicle_expenses"("driver_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_expense_category_idx" ON "public"."flt_vehicle_expenses"("expense_category");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_expense_date_idx" ON "public"."flt_vehicle_expenses"("expense_date");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_metadata_idx" ON "public"."flt_vehicle_expenses" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_ride_id_idx" ON "public"."flt_vehicle_expenses"("ride_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_tenant_id_idx" ON "public"."flt_vehicle_expenses"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_updated_by_idx" ON "public"."flt_vehicle_expenses"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_expenses_vehicle_id_idx" ON "public"."flt_vehicle_expenses"("vehicle_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_created_at_idx" ON "public"."flt_vehicle_insurances"("created_at" DESC);

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_metadata_idx" ON "public"."flt_vehicle_insurances" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_policy_number_idx" ON "public"."flt_vehicle_insurances"("policy_number");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_policy_type_idx" ON "public"."flt_vehicle_insurances"("policy_type");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_tenant_id_idx" ON "public"."flt_vehicle_insurances"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_insurances_vehicle_id_idx" ON "public"."flt_vehicle_insurances"("vehicle_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_created_at_idx" ON "public"."flt_vehicle_maintenance"("created_at" DESC);

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_created_by_idx" ON "public"."flt_vehicle_maintenance"("created_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_maintenance_type_idx" ON "public"."flt_vehicle_maintenance"("maintenance_type");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_metadata_idx" ON "public"."flt_vehicle_maintenance" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_scheduled_date_active_idx" ON "public"."flt_vehicle_maintenance"("scheduled_date");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_status_active_idx" ON "public"."flt_vehicle_maintenance"("status");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_tenant_id_idx" ON "public"."flt_vehicle_maintenance"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_updated_by_idx" ON "public"."flt_vehicle_maintenance"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicle_maintenance_vehicle_id_idx" ON "public"."flt_vehicle_maintenance"("vehicle_id");

-- CreateIndex
CREATE INDEX "flt_vehicles_created_by_idx" ON "public"."flt_vehicles"("created_by");

-- CreateIndex
CREATE INDEX "flt_vehicles_deleted_at_idx" ON "public"."flt_vehicles"("deleted_at");

-- CreateIndex
CREATE INDEX "flt_vehicles_license_plate_idx" ON "public"."flt_vehicles"("license_plate");

-- CreateIndex
CREATE INDEX "flt_vehicles_make_id_idx" ON "public"."flt_vehicles"("make_id");

-- CreateIndex
CREATE INDEX "flt_vehicles_metadata_idx" ON "public"."flt_vehicles" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "flt_vehicles_model_id_idx" ON "public"."flt_vehicles"("model_id");

-- CreateIndex
CREATE INDEX "flt_vehicles_next_inspection_idx" ON "public"."flt_vehicles"("next_inspection");

-- CreateIndex
CREATE INDEX "flt_vehicles_tenant_id_idx" ON "public"."flt_vehicles"("tenant_id");

-- CreateIndex
CREATE INDEX "flt_vehicles_updated_by_idx" ON "public"."flt_vehicles"("updated_by");

-- CreateIndex
CREATE INDEX "flt_vehicles_vin_idx" ON "public"."flt_vehicles"("vin");

-- CreateIndex
CREATE INDEX "rev_driver_revenues_created_by_idx" ON "public"."rev_driver_revenues"("created_by");

-- CreateIndex
CREATE INDEX "rev_driver_revenues_deleted_at_idx" ON "public"."rev_driver_revenues"("deleted_at");

-- CreateIndex
CREATE INDEX "rev_driver_revenues_driver_id_idx" ON "public"."rev_driver_revenues"("driver_id");

-- CreateIndex
CREATE INDEX "rev_driver_revenues_metadata_idx" ON "public"."rev_driver_revenues" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "rev_driver_revenues_period_end_idx" ON "public"."rev_driver_revenues"("period_end" DESC);

-- CreateIndex
CREATE INDEX "rev_driver_revenues_period_start_idx" ON "public"."rev_driver_revenues"("period_start" DESC);

-- CreateIndex
CREATE INDEX "rev_driver_revenues_tenant_id_idx" ON "public"."rev_driver_revenues"("tenant_id");

-- CreateIndex
CREATE INDEX "rev_driver_revenues_updated_by_idx" ON "public"."rev_driver_revenues"("updated_by");

-- CreateIndex
CREATE INDEX "rev_reconciliations_created_by_idx" ON "public"."rev_reconciliations"("created_by");

-- CreateIndex
CREATE INDEX "rev_reconciliations_deleted_at_idx" ON "public"."rev_reconciliations"("deleted_at");

-- CreateIndex
CREATE INDEX "rev_reconciliations_import_id_idx" ON "public"."rev_reconciliations"("import_id");

-- CreateIndex
CREATE INDEX "rev_reconciliations_metadata_idx" ON "public"."rev_reconciliations" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "rev_reconciliations_reconciliation_date_idx" ON "public"."rev_reconciliations"("reconciliation_date" DESC);

-- CreateIndex
CREATE INDEX "rev_reconciliations_tenant_id_idx" ON "public"."rev_reconciliations"("tenant_id");

-- CreateIndex
CREATE INDEX "rev_reconciliations_updated_by_idx" ON "public"."rev_reconciliations"("updated_by");

-- CreateIndex
CREATE INDEX "rev_revenue_imports_created_by_idx" ON "public"."rev_revenue_imports"("created_by");

-- CreateIndex
CREATE INDEX "rev_revenue_imports_deleted_at_idx" ON "public"."rev_revenue_imports"("deleted_at");

-- CreateIndex
CREATE INDEX "rev_revenue_imports_import_date_idx" ON "public"."rev_revenue_imports"("import_date" DESC);

-- CreateIndex
CREATE INDEX "rev_revenue_imports_metadata_idx" ON "public"."rev_revenue_imports" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "rev_revenue_imports_tenant_id_idx" ON "public"."rev_revenue_imports"("tenant_id");

-- CreateIndex
CREATE INDEX "rev_revenue_imports_updated_by_idx" ON "public"."rev_revenue_imports"("updated_by");

-- CreateIndex
CREATE INDEX "rid_driver_blacklists_created_by_idx" ON "public"."rid_driver_blacklists"("created_by");

-- CreateIndex
CREATE INDEX "rid_driver_blacklists_deleted_at_idx" ON "public"."rid_driver_blacklists"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_driver_blacklists_driver_id_idx" ON "public"."rid_driver_blacklists"("driver_id");

-- CreateIndex
CREATE INDEX "rid_driver_blacklists_end_date_idx" ON "public"."rid_driver_blacklists"("end_date");

-- CreateIndex
CREATE INDEX "rid_driver_blacklists_metadata_gin" ON "public"."rid_driver_blacklists" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "rid_driver_blacklists_start_date_idx" ON "public"."rid_driver_blacklists"("start_date");

-- CreateIndex
CREATE INDEX "rid_driver_blacklists_tenant_id_idx" ON "public"."rid_driver_blacklists"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_driver_blacklists_updated_by_idx" ON "public"."rid_driver_blacklists"("updated_by");

-- CreateIndex
CREATE INDEX "rid_driver_cooperation_terms_accepted_at_idx" ON "public"."rid_driver_cooperation_terms"("accepted_at");

-- CreateIndex
CREATE INDEX "rid_driver_cooperation_terms_created_by_idx" ON "public"."rid_driver_cooperation_terms"("created_by");

-- CreateIndex
CREATE INDEX "rid_driver_cooperation_terms_deleted_at_idx" ON "public"."rid_driver_cooperation_terms"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_driver_cooperation_terms_driver_id_idx" ON "public"."rid_driver_cooperation_terms"("driver_id");

-- CreateIndex
CREATE INDEX "rid_driver_cooperation_terms_effective_date_idx" ON "public"."rid_driver_cooperation_terms"("effective_date");

-- CreateIndex
CREATE INDEX "rid_driver_cooperation_terms_expiry_date_idx" ON "public"."rid_driver_cooperation_terms"("expiry_date");

-- CreateIndex
CREATE INDEX "rid_driver_cooperation_terms_metadata_gin" ON "public"."rid_driver_cooperation_terms" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "rid_driver_cooperation_terms_tenant_id_idx" ON "public"."rid_driver_cooperation_terms"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_driver_cooperation_terms_terms_version_idx" ON "public"."rid_driver_cooperation_terms"("terms_version");

-- CreateIndex
CREATE INDEX "rid_driver_cooperation_terms_updated_by_idx" ON "public"."rid_driver_cooperation_terms"("updated_by");

-- CreateIndex
CREATE INDEX "rid_driver_documents_created_by_idx" ON "public"."rid_driver_documents"("created_by");

-- CreateIndex
CREATE INDEX "rid_driver_documents_deleted_at_idx" ON "public"."rid_driver_documents"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_driver_documents_document_id_idx" ON "public"."rid_driver_documents"("document_id");

-- CreateIndex
CREATE INDEX "rid_driver_documents_document_type_idx" ON "public"."rid_driver_documents"("document_type");

-- CreateIndex
CREATE INDEX "rid_driver_documents_driver_id_idx" ON "public"."rid_driver_documents"("driver_id");

-- CreateIndex
CREATE INDEX "rid_driver_documents_expiry_date_idx" ON "public"."rid_driver_documents"("expiry_date");

-- CreateIndex
CREATE INDEX "rid_driver_documents_tenant_id_idx" ON "public"."rid_driver_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_driver_documents_updated_by_idx" ON "public"."rid_driver_documents"("updated_by");

-- CreateIndex
CREATE INDEX "rid_driver_performances_created_by_idx" ON "public"."rid_driver_performances"("created_by");

-- CreateIndex
CREATE INDEX "rid_driver_performances_deleted_at_idx" ON "public"."rid_driver_performances"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_driver_performances_driver_id_idx" ON "public"."rid_driver_performances"("driver_id");

-- CreateIndex
CREATE INDEX "rid_driver_performances_metadata_gin" ON "public"."rid_driver_performances" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "rid_driver_performances_period_end_idx" ON "public"."rid_driver_performances"("period_end");

-- CreateIndex
CREATE INDEX "rid_driver_performances_period_start_idx" ON "public"."rid_driver_performances"("period_start");

-- CreateIndex
CREATE INDEX "rid_driver_performances_tenant_id_idx" ON "public"."rid_driver_performances"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_driver_performances_updated_by_idx" ON "public"."rid_driver_performances"("updated_by");

-- CreateIndex
CREATE INDEX "rid_driver_requests_created_by_idx" ON "public"."rid_driver_requests"("created_by");

-- CreateIndex
CREATE INDEX "rid_driver_requests_deleted_at_idx" ON "public"."rid_driver_requests"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_driver_requests_details_gin" ON "public"."rid_driver_requests" USING GIN ("details");

-- CreateIndex
CREATE INDEX "rid_driver_requests_driver_id_idx" ON "public"."rid_driver_requests"("driver_id");

-- CreateIndex
CREATE INDEX "rid_driver_requests_request_date_idx" ON "public"."rid_driver_requests"("request_date");

-- CreateIndex
CREATE INDEX "rid_driver_requests_request_type_idx" ON "public"."rid_driver_requests"("request_type");

-- CreateIndex
CREATE INDEX "rid_driver_requests_tenant_id_idx" ON "public"."rid_driver_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_driver_requests_updated_by_idx" ON "public"."rid_driver_requests"("updated_by");

-- CreateIndex
CREATE INDEX "rid_driver_training_created_by_idx" ON "public"."rid_driver_training"("created_by");

-- CreateIndex
CREATE INDEX "rid_driver_training_deleted_at_idx" ON "public"."rid_driver_training"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_driver_training_driver_id_idx" ON "public"."rid_driver_training"("driver_id");

-- CreateIndex
CREATE INDEX "rid_driver_training_due_at_idx" ON "public"."rid_driver_training"("due_at");

-- CreateIndex
CREATE INDEX "rid_driver_training_metadata_gin" ON "public"."rid_driver_training" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "rid_driver_training_tenant_id_idx" ON "public"."rid_driver_training"("tenant_id");

-- CreateIndex
CREATE INDEX "rid_driver_training_training_name_idx" ON "public"."rid_driver_training"("training_name");

-- CreateIndex
CREATE INDEX "rid_driver_training_updated_by_idx" ON "public"."rid_driver_training"("updated_by");

-- CreateIndex
CREATE INDEX "rid_drivers_created_at_idx" ON "public"."rid_drivers"("created_at" DESC);

-- CreateIndex
CREATE INDEX "rid_drivers_deleted_at_idx" ON "public"."rid_drivers"("deleted_at");

-- CreateIndex
CREATE INDEX "rid_drivers_driver_status_idx" ON "public"."rid_drivers"("driver_status");

-- CreateIndex
CREATE INDEX "rid_drivers_email_idx" ON "public"."rid_drivers"("email");

-- CreateIndex
CREATE INDEX "rid_drivers_first_name_idx" ON "public"."rid_drivers"("first_name");

-- CreateIndex
CREATE INDEX "rid_drivers_last_name_idx" ON "public"."rid_drivers"("last_name");

-- CreateIndex
CREATE INDEX "rid_drivers_license_number_idx" ON "public"."rid_drivers"("license_number");

-- CreateIndex
CREATE INDEX "rid_drivers_phone_idx" ON "public"."rid_drivers"("phone");

-- CreateIndex
CREATE INDEX "rid_drivers_tenant_id_idx" ON "public"."rid_drivers"("tenant_id");

-- CreateIndex
CREATE INDEX "sch_goals_assigned_to_idx" ON "public"."sch_goals"("assigned_to");

-- CreateIndex
CREATE INDEX "sch_goals_created_by_idx" ON "public"."sch_goals"("created_by");

-- CreateIndex
CREATE INDEX "sch_goals_deleted_at_idx" ON "public"."sch_goals"("deleted_at");

-- CreateIndex
CREATE INDEX "sch_goals_goal_type_idx" ON "public"."sch_goals"("goal_type");

-- CreateIndex
CREATE INDEX "sch_goals_metadata_gin" ON "public"."sch_goals" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "sch_goals_period_end_idx" ON "public"."sch_goals"("period_end");

-- CreateIndex
CREATE INDEX "sch_goals_period_start_idx" ON "public"."sch_goals"("period_start");

-- CreateIndex
CREATE INDEX "sch_goals_tenant_id_idx" ON "public"."sch_goals"("tenant_id");

-- CreateIndex
CREATE INDEX "sch_goals_updated_by_idx" ON "public"."sch_goals"("updated_by");

-- CreateIndex
CREATE INDEX "sch_maintenance_schedules_created_by_idx" ON "public"."sch_maintenance_schedules"("created_by");

-- CreateIndex
CREATE INDEX "sch_maintenance_schedules_deleted_at_idx" ON "public"."sch_maintenance_schedules"("deleted_at");

-- CreateIndex
CREATE INDEX "sch_maintenance_schedules_maintenance_type_idx" ON "public"."sch_maintenance_schedules"("maintenance_type");

-- CreateIndex
CREATE INDEX "sch_maintenance_schedules_metadata_gin" ON "public"."sch_maintenance_schedules" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "sch_maintenance_schedules_scheduled_date_idx" ON "public"."sch_maintenance_schedules"("scheduled_date");

-- CreateIndex
CREATE INDEX "sch_maintenance_schedules_tenant_id_idx" ON "public"."sch_maintenance_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "sch_maintenance_schedules_updated_by_idx" ON "public"."sch_maintenance_schedules"("updated_by");

-- CreateIndex
CREATE INDEX "sch_maintenance_schedules_vehicle_id_idx" ON "public"."sch_maintenance_schedules"("vehicle_id");

-- CreateIndex
CREATE INDEX "sch_shifts_created_by_idx" ON "public"."sch_shifts"("created_by");

-- CreateIndex
CREATE INDEX "sch_shifts_deleted_at_idx" ON "public"."sch_shifts"("deleted_at");

-- CreateIndex
CREATE INDEX "sch_shifts_driver_id_idx" ON "public"."sch_shifts"("driver_id");

-- CreateIndex
CREATE INDEX "sch_shifts_end_time_idx" ON "public"."sch_shifts"("end_time");

-- CreateIndex
CREATE INDEX "sch_shifts_metadata_gin" ON "public"."sch_shifts" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "sch_shifts_start_time_idx" ON "public"."sch_shifts"("start_time");

-- CreateIndex
CREATE INDEX "sch_shifts_tenant_id_idx" ON "public"."sch_shifts"("tenant_id");

-- CreateIndex
CREATE INDEX "sch_shifts_updated_by_idx" ON "public"."sch_shifts"("updated_by");

-- CreateIndex
CREATE INDEX "idx_sch_tasks_created_by" ON "public"."sch_tasks"("created_by");

-- CreateIndex
CREATE INDEX "idx_sch_tasks_deleted_at" ON "public"."sch_tasks"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_sch_tasks_due_at" ON "public"."sch_tasks"("due_at");

-- CreateIndex
CREATE INDEX "idx_sch_tasks_metadata" ON "public"."sch_tasks" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "idx_sch_tasks_target_id" ON "public"."sch_tasks"("target_id");

-- CreateIndex
CREATE INDEX "idx_sch_tasks_tenant_id" ON "public"."sch_tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_sch_tasks_updated_by" ON "public"."sch_tasks"("updated_by");

-- CreateIndex
CREATE INDEX "sup_customer_feedback_metadata_idx" ON "public"."sup_customer_feedback" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "sup_ticket_messages_created_by_idx" ON "public"."sup_ticket_messages"("created_by");

-- CreateIndex
CREATE INDEX "sup_ticket_messages_deleted_at_idx" ON "public"."sup_ticket_messages"("deleted_at");

-- CreateIndex
CREATE INDEX "sup_ticket_messages_metadata_idx" ON "public"."sup_ticket_messages" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "sup_ticket_messages_sent_at_idx" ON "public"."sup_ticket_messages"("sent_at");

-- CreateIndex
CREATE INDEX "sup_ticket_messages_ticket_id_idx" ON "public"."sup_ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "sup_ticket_messages_updated_by_idx" ON "public"."sup_ticket_messages"("updated_by");

-- CreateIndex
CREATE INDEX "sup_tickets_assigned_to_idx" ON "public"."sup_tickets"("assigned_to");

-- CreateIndex
CREATE INDEX "sup_tickets_created_at_idx" ON "public"."sup_tickets"("created_at");

-- CreateIndex
CREATE INDEX "sup_tickets_created_by_idx" ON "public"."sup_tickets"("created_by");

-- CreateIndex
CREATE INDEX "sup_tickets_deleted_at_idx" ON "public"."sup_tickets"("deleted_at");

-- CreateIndex
CREATE INDEX "sup_tickets_metadata_idx" ON "public"."sup_tickets" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "sup_tickets_raised_by_idx" ON "public"."sup_tickets"("raised_by");

-- CreateIndex
CREATE INDEX "sup_tickets_tenant_id_idx" ON "public"."sup_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "sup_tickets_updated_by_idx" ON "public"."sup_tickets"("updated_by");

-- CreateIndex
CREATE INDEX "idx_trp_client_invoices_client_id" ON "public"."trp_client_invoices"("client_id");

-- CreateIndex
CREATE INDEX "idx_trp_client_invoices_created_by" ON "public"."trp_client_invoices"("created_by");

-- CreateIndex
CREATE INDEX "idx_trp_client_invoices_deleted_at" ON "public"."trp_client_invoices"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_trp_client_invoices_due_date" ON "public"."trp_client_invoices"("due_date");

-- CreateIndex
CREATE INDEX "idx_trp_client_invoices_invoice_date" ON "public"."trp_client_invoices"("invoice_date");

-- CreateIndex
CREATE INDEX "idx_trp_client_invoices_metadata" ON "public"."trp_client_invoices" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "idx_trp_client_invoices_tenant_id" ON "public"."trp_client_invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_trp_client_invoices_updated_by" ON "public"."trp_client_invoices"("updated_by");

-- CreateIndex
CREATE INDEX "idx_trp_platform_accounts_account_identifier" ON "public"."trp_platform_accounts"("account_identifier");

-- CreateIndex
CREATE INDEX "idx_trp_platform_accounts_created_by" ON "public"."trp_platform_accounts"("created_by");

-- CreateIndex
CREATE INDEX "idx_trp_platform_accounts_deleted_at" ON "public"."trp_platform_accounts"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_trp_platform_accounts_metadata" ON "public"."trp_platform_accounts" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "idx_trp_platform_accounts_platform_id" ON "public"."trp_platform_accounts"("platform_id");

-- CreateIndex
CREATE INDEX "idx_trp_platform_accounts_tenant_id" ON "public"."trp_platform_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_trp_platform_accounts_updated_by" ON "public"."trp_platform_accounts"("updated_by");

-- CreateIndex
CREATE INDEX "idx_trp_settlements_created_by" ON "public"."trp_settlements"("created_by");

-- CreateIndex
CREATE INDEX "idx_trp_settlements_deleted_at" ON "public"."trp_settlements"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_trp_settlements_metadata" ON "public"."trp_settlements" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "idx_trp_settlements_settlement_date" ON "public"."trp_settlements"("settlement_date");

-- CreateIndex
CREATE INDEX "idx_trp_settlements_tenant_id" ON "public"."trp_settlements"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_trp_settlements_trip_id" ON "public"."trp_settlements"("trip_id");

-- CreateIndex
CREATE INDEX "idx_trp_settlements_updated_by" ON "public"."trp_settlements"("updated_by");

-- CreateIndex
CREATE INDEX "trp_trips_client_id_idx" ON "public"."trp_trips"("client_id");

-- CreateIndex
CREATE INDEX "trp_trips_created_at_idx" ON "public"."trp_trips"("created_at" DESC);

-- CreateIndex
CREATE INDEX "trp_trips_deleted_at_idx" ON "public"."trp_trips"("deleted_at");

-- CreateIndex
CREATE INDEX "trp_trips_driver_id_idx" ON "public"."trp_trips"("driver_id");

-- CreateIndex
CREATE INDEX "trp_trips_end_time_idx" ON "public"."trp_trips"("end_time");

-- CreateIndex
CREATE INDEX "trp_trips_platform_id_idx" ON "public"."trp_trips"("platform_id");

-- CreateIndex
CREATE INDEX "trp_trips_start_time_idx" ON "public"."trp_trips"("start_time");

-- CreateIndex
CREATE INDEX "trp_trips_tenant_id_idx" ON "public"."trp_trips"("tenant_id");

-- CreateIndex
CREATE INDEX "trp_trips_trip_date_idx" ON "public"."trp_trips"("trip_date");

-- CreateIndex
CREATE INDEX "trp_trips_vehicle_id_idx" ON "public"."trp_trips"("vehicle_id");

-- AddForeignKey
ALTER TABLE "public"."adm_audit_logs" ADD CONSTRAINT "adm_audit_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_audit_logs" ADD CONSTRAINT "adm_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_member_roles" ADD CONSTRAINT "adm_member_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_member_roles" ADD CONSTRAINT "adm_member_roles_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_member_roles" ADD CONSTRAINT "adm_member_roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."adm_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_member_roles" ADD CONSTRAINT "adm_member_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."adm_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_member_roles" ADD CONSTRAINT "adm_member_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_member_roles" ADD CONSTRAINT "adm_member_roles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_members" ADD CONSTRAINT "adm_members_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_members" ADD CONSTRAINT "adm_members_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_members" ADD CONSTRAINT "adm_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_members" ADD CONSTRAINT "adm_members_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_provider_employees" ADD CONSTRAINT "adm_provider_employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_provider_employees" ADD CONSTRAINT "adm_provider_employees_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_provider_employees" ADD CONSTRAINT "adm_provider_employees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_roles" ADD CONSTRAINT "adm_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_roles" ADD CONSTRAINT "adm_roles_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_roles" ADD CONSTRAINT "adm_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_roles" ADD CONSTRAINT "adm_roles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_tenant_lifecycle_events" ADD CONSTRAINT "adm_tenant_lifecycle_events_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adm_tenant_lifecycle_events" ADD CONSTRAINT "adm_tenant_lifecycle_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_billing_plans" ADD CONSTRAINT "bil_billing_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_billing_plans" ADD CONSTRAINT "bil_billing_plans_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_billing_plans" ADD CONSTRAINT "bil_billing_plans_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_payment_methods" ADD CONSTRAINT "bil_payment_methods_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_payment_methods" ADD CONSTRAINT "bil_payment_methods_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_payment_methods" ADD CONSTRAINT "bil_payment_methods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_payment_methods" ADD CONSTRAINT "bil_payment_methods_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_invoice_lines" ADD CONSTRAINT "bil_tenant_invoice_lines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_invoice_lines" ADD CONSTRAINT "bil_tenant_invoice_lines_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_invoice_lines" ADD CONSTRAINT "bil_tenant_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."bil_tenant_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_invoice_lines" ADD CONSTRAINT "bil_tenant_invoice_lines_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_invoices" ADD CONSTRAINT "bil_tenant_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_invoices" ADD CONSTRAINT "bil_tenant_invoices_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_invoices" ADD CONSTRAINT "bil_tenant_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_invoices" ADD CONSTRAINT "bil_tenant_invoices_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_subscriptions" ADD CONSTRAINT "bil_tenant_subscriptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_subscriptions" ADD CONSTRAINT "bil_tenant_subscriptions_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_subscriptions" ADD CONSTRAINT "bil_tenant_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."bil_billing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_subscriptions" ADD CONSTRAINT "bil_tenant_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_subscriptions" ADD CONSTRAINT "bil_tenant_subscriptions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_usage_metrics" ADD CONSTRAINT "bil_tenant_usage_metrics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_usage_metrics" ADD CONSTRAINT "bil_tenant_usage_metrics_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_usage_metrics" ADD CONSTRAINT "bil_tenant_usage_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bil_tenant_usage_metrics" ADD CONSTRAINT "bil_tenant_usage_metrics_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_contracts" ADD CONSTRAINT "crm_contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_contracts" ADD CONSTRAINT "crm_contracts_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_contracts" ADD CONSTRAINT "crm_contracts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."crm_opportunities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."crm_contracts" ADD CONSTRAINT "crm_contracts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_opportunities" ADD CONSTRAINT "crm_opportunities_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_opportunities" ADD CONSTRAINT "crm_opportunities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_opportunities" ADD CONSTRAINT "crm_opportunities_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_opportunities" ADD CONSTRAINT "crm_opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_opportunities" ADD CONSTRAINT "crm_opportunities_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_car_makes" ADD CONSTRAINT "dir_car_makes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_car_models" ADD CONSTRAINT "dir_car_models_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "public"."dir_car_makes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_car_models" ADD CONSTRAINT "dir_car_models_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_car_models" ADD CONSTRAINT "dir_car_models_vehicle_class_id_fkey" FOREIGN KEY ("vehicle_class_id") REFERENCES "public"."dir_vehicle_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dir_vehicle_classes" ADD CONSTRAINT "dir_vehicle_classes_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "public"."dir_country_regulations"("country_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doc_documents" ADD CONSTRAINT "doc_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_accounts" ADD CONSTRAINT "fin_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_accounts" ADD CONSTRAINT "fin_accounts_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_accounts" ADD CONSTRAINT "fin_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_accounts" ADD CONSTRAINT "fin_accounts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_driver_payment_batches" ADD CONSTRAINT "fin_driver_payment_batches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_driver_payment_batches" ADD CONSTRAINT "fin_driver_payment_batches_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_driver_payment_batches" ADD CONSTRAINT "fin_driver_payment_batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_driver_payment_batches" ADD CONSTRAINT "fin_driver_payment_batches_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_driver_payments" ADD CONSTRAINT "fin_driver_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_driver_payments" ADD CONSTRAINT "fin_driver_payments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_driver_payments" ADD CONSTRAINT "fin_driver_payments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_driver_payments" ADD CONSTRAINT "fin_driver_payments_payment_batch_id_fkey" FOREIGN KEY ("payment_batch_id") REFERENCES "public"."fin_driver_payment_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_driver_payments" ADD CONSTRAINT "fin_driver_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_driver_payments" ADD CONSTRAINT "fin_driver_payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_toll_transactions" ADD CONSTRAINT "fin_toll_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_toll_transactions" ADD CONSTRAINT "fin_toll_transactions_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_toll_transactions" ADD CONSTRAINT "fin_toll_transactions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_toll_transactions" ADD CONSTRAINT "fin_toll_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_toll_transactions" ADD CONSTRAINT "fin_toll_transactions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_toll_transactions" ADD CONSTRAINT "fin_toll_transactions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_traffic_fines" ADD CONSTRAINT "fin_traffic_fines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_traffic_fines" ADD CONSTRAINT "fin_traffic_fines_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_traffic_fines" ADD CONSTRAINT "fin_traffic_fines_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_traffic_fines" ADD CONSTRAINT "fin_traffic_fines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_traffic_fines" ADD CONSTRAINT "fin_traffic_fines_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_traffic_fines" ADD CONSTRAINT "fin_traffic_fines_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_transactions" ADD CONSTRAINT "fin_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."fin_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_transactions" ADD CONSTRAINT "fin_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_transactions" ADD CONSTRAINT "fin_transactions_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_transactions" ADD CONSTRAINT "fin_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fin_transactions" ADD CONSTRAINT "fin_transactions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_assignments" ADD CONSTRAINT "flt_vehicle_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_assignments" ADD CONSTRAINT "flt_vehicle_assignments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_assignments" ADD CONSTRAINT "flt_vehicle_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_assignments" ADD CONSTRAINT "flt_vehicle_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_assignments" ADD CONSTRAINT "flt_vehicle_assignments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_assignments" ADD CONSTRAINT "flt_vehicle_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_events" ADD CONSTRAINT "flt_vehicle_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_events" ADD CONSTRAINT "flt_vehicle_events_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_events" ADD CONSTRAINT "flt_vehicle_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_events" ADD CONSTRAINT "flt_vehicle_events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_events" ADD CONSTRAINT "flt_vehicle_events_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."trp_trips"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_expenses" ADD CONSTRAINT "flt_vehicle_expenses_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_insurances" ADD CONSTRAINT "flt_vehicle_insurances_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_insurances" ADD CONSTRAINT "flt_vehicle_insurances_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_insurances" ADD CONSTRAINT "flt_vehicle_insurances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_insurances" ADD CONSTRAINT "flt_vehicle_insurances_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_insurances" ADD CONSTRAINT "flt_vehicle_insurances_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_maintenance" ADD CONSTRAINT "flt_vehicle_maintenance_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_maintenance" ADD CONSTRAINT "flt_vehicle_maintenance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_maintenance" ADD CONSTRAINT "flt_vehicle_maintenance_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicle_maintenance" ADD CONSTRAINT "flt_vehicle_maintenance_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicles" ADD CONSTRAINT "flt_vehicles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicles" ADD CONSTRAINT "flt_vehicles_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicles" ADD CONSTRAINT "flt_vehicles_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "public"."dir_car_makes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicles" ADD CONSTRAINT "flt_vehicles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."dir_car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicles" ADD CONSTRAINT "flt_vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flt_vehicles" ADD CONSTRAINT "flt_vehicles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_driver_revenues" ADD CONSTRAINT "rev_driver_revenues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_driver_revenues" ADD CONSTRAINT "rev_driver_revenues_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_driver_revenues" ADD CONSTRAINT "rev_driver_revenues_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_driver_revenues" ADD CONSTRAINT "rev_driver_revenues_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_driver_revenues" ADD CONSTRAINT "rev_driver_revenues_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_reconciliations" ADD CONSTRAINT "rev_reconciliations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_reconciliations" ADD CONSTRAINT "rev_reconciliations_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_reconciliations" ADD CONSTRAINT "rev_reconciliations_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "public"."rev_revenue_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_reconciliations" ADD CONSTRAINT "rev_reconciliations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_reconciliations" ADD CONSTRAINT "rev_reconciliations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_revenue_imports" ADD CONSTRAINT "rev_revenue_imports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_revenue_imports" ADD CONSTRAINT "rev_revenue_imports_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_revenue_imports" ADD CONSTRAINT "rev_revenue_imports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rev_revenue_imports" ADD CONSTRAINT "rev_revenue_imports_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_blacklists" ADD CONSTRAINT "rid_driver_blacklists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_blacklists" ADD CONSTRAINT "rid_driver_blacklists_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_blacklists" ADD CONSTRAINT "rid_driver_blacklists_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_blacklists" ADD CONSTRAINT "rid_driver_blacklists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_blacklists" ADD CONSTRAINT "rid_driver_blacklists_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_cooperation_terms" ADD CONSTRAINT "rid_driver_cooperation_terms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_cooperation_terms" ADD CONSTRAINT "rid_driver_cooperation_terms_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_cooperation_terms" ADD CONSTRAINT "rid_driver_cooperation_terms_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_cooperation_terms" ADD CONSTRAINT "rid_driver_cooperation_terms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_cooperation_terms" ADD CONSTRAINT "rid_driver_cooperation_terms_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_documents" ADD CONSTRAINT "rid_driver_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_documents" ADD CONSTRAINT "rid_driver_documents_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_documents" ADD CONSTRAINT "rid_driver_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."doc_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_documents" ADD CONSTRAINT "rid_driver_documents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_documents" ADD CONSTRAINT "rid_driver_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_documents" ADD CONSTRAINT "rid_driver_documents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_documents" ADD CONSTRAINT "rid_driver_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_performances" ADD CONSTRAINT "rid_driver_performances_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_performances" ADD CONSTRAINT "rid_driver_performances_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_performances" ADD CONSTRAINT "rid_driver_performances_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_performances" ADD CONSTRAINT "rid_driver_performances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_performances" ADD CONSTRAINT "rid_driver_performances_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_requests" ADD CONSTRAINT "rid_driver_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_requests" ADD CONSTRAINT "rid_driver_requests_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_requests" ADD CONSTRAINT "rid_driver_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_requests" ADD CONSTRAINT "rid_driver_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_requests" ADD CONSTRAINT "rid_driver_requests_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_training" ADD CONSTRAINT "rid_driver_training_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_training" ADD CONSTRAINT "rid_driver_training_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_training" ADD CONSTRAINT "rid_driver_training_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_training" ADD CONSTRAINT "rid_driver_training_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_training" ADD CONSTRAINT "rid_driver_training_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_drivers" ADD CONSTRAINT "rid_drivers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_goals" ADD CONSTRAINT "sch_goals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_goals" ADD CONSTRAINT "sch_goals_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_goals" ADD CONSTRAINT "sch_goals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_goals" ADD CONSTRAINT "sch_goals_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_maintenance_schedules" ADD CONSTRAINT "sch_maintenance_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_maintenance_schedules" ADD CONSTRAINT "sch_maintenance_schedules_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_maintenance_schedules" ADD CONSTRAINT "sch_maintenance_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_maintenance_schedules" ADD CONSTRAINT "sch_maintenance_schedules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_maintenance_schedules" ADD CONSTRAINT "sch_maintenance_schedules_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_shifts" ADD CONSTRAINT "sch_shifts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_shifts" ADD CONSTRAINT "sch_shifts_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_shifts" ADD CONSTRAINT "sch_shifts_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_shifts" ADD CONSTRAINT "sch_shifts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_shifts" ADD CONSTRAINT "sch_shifts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_tasks" ADD CONSTRAINT "sch_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_tasks" ADD CONSTRAINT "sch_tasks_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_tasks" ADD CONSTRAINT "sch_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sch_tasks" ADD CONSTRAINT "sch_tasks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sup_customer_feedback" ADD CONSTRAINT "sup_customer_feedback_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sup_ticket_messages" ADD CONSTRAINT "sup_ticket_messages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sup_ticket_messages" ADD CONSTRAINT "sup_ticket_messages_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sup_ticket_messages" ADD CONSTRAINT "sup_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."sup_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sup_ticket_messages" ADD CONSTRAINT "sup_ticket_messages_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sup_tickets" ADD CONSTRAINT "sup_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."adm_provider_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sup_tickets" ADD CONSTRAINT "sup_tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sup_tickets" ADD CONSTRAINT "sup_tickets_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sup_tickets" ADD CONSTRAINT "sup_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sup_tickets" ADD CONSTRAINT "sup_tickets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_client_invoices" ADD CONSTRAINT "trp_client_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_client_invoices" ADD CONSTRAINT "trp_client_invoices_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_client_invoices" ADD CONSTRAINT "trp_client_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_client_invoices" ADD CONSTRAINT "trp_client_invoices_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_platform_accounts" ADD CONSTRAINT "trp_platform_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_platform_accounts" ADD CONSTRAINT "trp_platform_accounts_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_platform_accounts" ADD CONSTRAINT "trp_platform_accounts_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "public"."dir_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_platform_accounts" ADD CONSTRAINT "trp_platform_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_platform_accounts" ADD CONSTRAINT "trp_platform_accounts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_settlements" ADD CONSTRAINT "trp_settlements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_settlements" ADD CONSTRAINT "trp_settlements_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_settlements" ADD CONSTRAINT "trp_settlements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_settlements" ADD CONSTRAINT "trp_settlements_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trp_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_settlements" ADD CONSTRAINT "trp_settlements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_trips" ADD CONSTRAINT "trp_trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_trips" ADD CONSTRAINT "trp_trips_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "public"."dir_platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_trips" ADD CONSTRAINT "trp_trips_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trp_trips" ADD CONSTRAINT "trp_trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."flt_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_languages" ADD CONSTRAINT "rid_driver_languages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_languages" ADD CONSTRAINT "rid_driver_languages_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_languages" ADD CONSTRAINT "rid_driver_languages_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."rid_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_languages" ADD CONSTRAINT "rid_driver_languages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."adm_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rid_driver_languages" ADD CONSTRAINT "rid_driver_languages_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."adm_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

