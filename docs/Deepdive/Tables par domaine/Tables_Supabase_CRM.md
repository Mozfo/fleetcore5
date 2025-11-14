crm_leads
create table public.crm_leads (
id uuid not null default extensions.uuid_generate_v4 (),
email text not null,
phone text not null,
demo_company_name text null,
source text null,
status text not null default 'new'::text,
message text null,
created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
country_code character varying(2) null,
fleet_size character varying(50) null,
current_software character varying(255) null,
assigned_to uuid null,
qualification_score integer null,
qualification_notes text null,
qualified_date timestamp with time zone null,
converted_date timestamp with time zone null,
utm_source character varying(255) null,
utm_medium character varying(255) null,
utm_campaign character varying(255) null,
metadata jsonb null default '{}'::jsonb,
created_by uuid null,
updated_by uuid null,
deleted_at timestamp with time zone null,
deleted_by uuid null,
deletion_reason text null,
lead_code character varying(50) null,
first_name text not null,
last_name text not null,
company_name text null,
industry text null,
company_size integer null,
website_url text null,
linkedin_url text null,
city text null,
lead_stage public.lead_stage null,
fit_score numeric(5, 2) null,
engagement_score numeric(5, 2) null,
scoring jsonb null,
gdpr_consent boolean null,
consent_at timestamp with time zone null,
source_id uuid null,
opportunity_id uuid null,
next_action_date timestamp with time zone null,
constraint crm_leads_pkey primary key (id),
constraint crm_leads_lead_code_key unique (lead_code),
constraint fk_crm_leads_updated_by foreign KEY (updated_by) references adm_provider_employees (id) on delete set null,
constraint fk_crm_leads_opportunity foreign KEY (opportunity_id) references crm_opportunities (id) on delete set null,
constraint fk_crm_leads_source foreign KEY (source_id) references crm_lead_sources (id) on delete set null,
constraint fk_crm_leads_assigned_to foreign KEY (assigned_to) references adm_provider_employees (id) on delete set null,
constraint fk_crm_leads_created_by foreign KEY (created_by) references adm_provider_employees (id) on delete set null,
constraint fk_crm_leads_deleted_by foreign KEY (deleted_by) references adm_provider_employees (id) on delete set null,
constraint crm_leads_status_check check (
(
status = any (
array[
'new'::text,
'qualified'::text,
'converted'::text,
'lost'::text
]
)
)
),
constraint crm_leads_source_check check (
(
(source is null)
or (
source = any (
array['web'::text, 'referral'::text, 'event'::text]
)
)
)
)
) TABLESPACE pg_default;

create index IF not exists crm_leads_created_at_idx on public.crm_leads using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists crm_leads_status_idx on public.crm_leads using btree (status) TABLESPACE pg_default;

create index IF not exists crm_leads_notes_gin on public.crm_leads using gin (
to_tsvector('english'::regconfig, COALESCE(message, ''::text))
) TABLESPACE pg_default;

create unique INDEX IF not exists crm_leads_email_unique_active on public.crm_leads using btree (email) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists crm_leads_assigned_to_idx on public.crm_leads using btree (assigned_to) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists crm_leads_country_code_idx on public.crm_leads using btree (country_code) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists crm_leads_deleted_at_idx on public.crm_leads using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists idx_crm_leads_metadata on public.crm_leads using gin (metadata) TABLESPACE pg_default;

create trigger set_crm_leads_updated_at BEFORE
update on crm_leads for EACH row
execute FUNCTION set_updated_at ();

create trigger set_updated_at_crm_leads BEFORE
update on crm_leads for EACH row
execute FUNCTION trigger_set_updated_at ();

crm_contracts
create table public.crm_contracts (
id uuid not null default extensions.uuid_generate_v4 (),
lead_id uuid not null,
contract_reference text not null,
contract_date date not null,
effective_date date not null,
expiry_date date null,
total_value numeric(18, 2) not null,
currency character varying(3) not null,
status text not null default 'active'::text,
metadata jsonb not null default '{}'::jsonb,
created_at timestamp with time zone not null default now(),
created_by uuid null,
updated_at timestamp with time zone not null default now(),
updated_by uuid null,
deleted_at timestamp with time zone null,
deleted_by uuid null,
deletion_reason text null,
opportunity_id uuid null,
contract_code text null,
signature_date date null,
expiration_date date null,
vat_rate numeric(5, 2) null,
renewal_type public.renewal_type null,
auto_renew boolean null default false,
renewal_date date null,
notice_period_days integer null,
renewed_from_contract_id uuid null,
tenant_id uuid not null,
plan_id uuid null,
subscription_id uuid null,
company_name text null,
contact_name text null,
contact_email extensions.citext null,
contact_phone character varying(50) null,
billing_address_id uuid null,
version_number integer null default 1,
document_url text null,
notes text null,
approved_by uuid null,
constraint crm_contracts_pkey primary key (id),
constraint crm_contracts_contract_code_key unique (contract_code),
constraint crm_contracts_deleted_by_fkey foreign KEY (deleted_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_crm_contracts_updated_by foreign KEY (updated_by) references adm_provider_employees (id) on delete set null,
constraint crm_contracts_created_by_fkey foreign KEY (created_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_crm_contracts_deleted_by foreign KEY (deleted_by) references adm_provider_employees (id) on delete set null,
constraint fk_crm_contracts_lead foreign KEY (lead_id) references crm_leads (id) on update CASCADE on delete set null,
constraint fk_crm_contracts_plan foreign KEY (plan_id) references bil_billing_plans (id) on delete set null,
constraint fk_crm_contracts_renewed_from foreign KEY (renewed_from_contract_id) references crm_contracts (id) on delete set null,
constraint fk_crm_contracts_subscription foreign KEY (subscription_id) references bil_tenant_subscriptions (id) on delete set null,
constraint fk_crm_contracts_tenant foreign KEY (tenant_id) references adm_tenants (id) on delete set null,
constraint crm_contracts_opportunity_id_fkey foreign KEY (opportunity_id) references crm_opportunities (id) on delete set null,
constraint crm_contracts_updated_by_fkey foreign KEY (updated_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_crm_contracts_approved_by foreign KEY (approved_by) references adm_provider_employees (id) on delete set null,
constraint fk_crm_contracts_billing_address foreign KEY (billing_address_id) references crm_addresses (id) on delete set null,
constraint fk_crm_contracts_created_by foreign KEY (created_by) references adm_provider_employees (id) on delete set null,
constraint crm_contracts_expiry_check check (
(
(expiry_date is null)
or (expiry_date >= effective_date)
)
),
constraint crm_contracts_expiry_date_check check (
(
(expiry_date is null)
or (expiry_date >= effective_date)
)
),
constraint crm_contracts_date_check check ((effective_date >= contract_date)),
constraint crm_contracts_effective_date_check check ((effective_date >= contract_date)),
constraint crm_contracts_status_check check (
(
status = any (
array[
'active'::text,
'expired'::text,
'terminated'::text
]
)
)
),
constraint crm_contracts_total_value_check check ((total_value >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists crm_contracts_client_id_idx on public.crm_contracts using btree (lead_id) TABLESPACE pg_default;

create index IF not exists crm_contracts_contract_date_idx on public.crm_contracts using btree (contract_date) TABLESPACE pg_default;

create index IF not exists crm_contracts_effective_date_idx on public.crm_contracts using btree (effective_date) TABLESPACE pg_default;

create index IF not exists crm_contracts_expiry_date_idx on public.crm_contracts using btree (expiry_date) TABLESPACE pg_default;

create index IF not exists crm_contracts_status_active_idx on public.crm_contracts using btree (status) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists crm_contracts_deleted_at_idx on public.crm_contracts using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists crm_contracts_created_by_idx on public.crm_contracts using btree (created_by) TABLESPACE pg_default;

create index IF not exists crm_contracts_updated_by_idx on public.crm_contracts using btree (updated_by) TABLESPACE pg_default;

create index IF not exists crm_contracts_metadata_idx on public.crm_contracts using gin (metadata) TABLESPACE pg_default;

create index IF not exists idx_crm_contracts_tenant on public.crm_contracts using btree (tenant_id) TABLESPACE pg_default
where
(deleted_at is null);

create unique INDEX IF not exists idx_crm_contracts_contract_code_unique on public.crm_contracts using btree (contract_code) TABLESPACE pg_default
where
(deleted_at is null);

create unique INDEX IF not exists idx_crm_contracts_contract_reference_unique on public.crm_contracts using btree (contract_reference) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists idx_crm_contracts_billing_address_id on public.crm_contracts using btree (billing_address_id) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists idx_crm_contracts_opportunity_id on public.crm_contracts using btree (opportunity_id) TABLESPACE pg_default
where
(deleted_at is null);

create trigger set_crm_contracts_updated_at BEFORE
update on crm_contracts for EACH row
execute FUNCTION set_updated_at ();

create trigger update_crm_contracts_updated_at BEFORE
update on crm_contracts for EACH row
execute FUNCTION trigger_set_updated_at ();

crm_lead_sources
create table public.crm_lead_sources (
id uuid not null default extensions.uuid_generate_v4 (),
name character varying(50) not null,
description text null,
is_active boolean not null default true,
created_at timestamp with time zone not null default now(),
constraint crm_lead_sources_pkey primary key (id),
constraint crm_lead_sources_name_key unique (name)
) TABLESPACE pg_default;

crm_addresses
create table public.crm_addresses (
id uuid not null default extensions.uuid_generate_v4 (),
street_line1 text not null,
street_line2 text null,
city character varying(100) not null,
state character varying(100) null,
postal_code character varying(20) null,
country_code character(2) not null,
address_type public.address_type null,
is_default boolean not null default false,
created_at timestamp with time zone not null default now(),
constraint crm_addresses_pkey primary key (id)
) TABLESPACE pg_default;

crm_lead_sources
create table public.crm_lead_sources (
id uuid not null default extensions.uuid_generate_v4 (),
name character varying(50) not null,
description text null,
is_active boolean not null default true,
created_at timestamp with time zone not null default now(),
constraint crm_lead_sources_pkey primary key (id),
constraint crm_lead_sources_name_key unique (name)
) TABLESPACE pg_default;

crm_opportunities
create table public.crm_opportunities (
id uuid not null default extensions.uuid_generate_v4 (),
lead_id uuid not null,
stage text not null default 'prospect'::text,
expected_value numeric(18, 2) null,
close_date date null,
assigned_to uuid null,
metadata jsonb not null default '{}'::jsonb,
created_at timestamp with time zone not null default now(),
created_by uuid null,
updated_at timestamp with time zone not null default now(),
updated_by uuid null,
deleted_at timestamp with time zone null,
deleted_by uuid null,
deletion_reason text null,
probability integer null,
status public.opportunity_status not null default 'open'::opportunity_status,
currency character(3) null default 'EUR'::bpchar,
discount_amount numeric(15, 2) null,
probability_percent numeric(5, 2) null default 0,
forecast_value numeric(15, 2) null,
won_value numeric(15, 2) null,
expected_close_date date null,
won_date date null,
lost_date date null,
owner_id uuid null,
loss_reason_id uuid null,
plan_id uuid null,
contract_id uuid null,
pipeline_id uuid null,
notes text null,
constraint crm_opportunities_pkey primary key (id),
constraint crm_opportunities_created_by_fkey foreign KEY (created_by) references adm_members (id) on update CASCADE on delete set null,
constraint crm_opportunities_deleted_by_fkey foreign KEY (deleted_by) references adm_members (id) on update CASCADE on delete set null,
constraint crm_opportunities_lead_id_fkey foreign KEY (lead_id) references crm_leads (id) on update CASCADE on delete CASCADE,
constraint fk_crm_opportunities_updated_by foreign KEY (updated_by) references adm_provider_employees (id) on delete set null,
constraint fk_crm_opportunities_plan foreign KEY (plan_id) references bil_billing_plans (id) on delete set null,
constraint crm_opportunities_assigned_to_fkey foreign KEY (assigned_to) references adm_members (id) on update CASCADE on delete set null,
constraint crm_opportunities_updated_by_fkey foreign KEY (updated_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_crm_opportunities_assigned_to foreign KEY (assigned_to) references adm_provider_employees (id) on delete set null,
constraint fk_crm_opportunities_contract foreign KEY (contract_id) references crm_contracts (id) on delete set null,
constraint fk_crm_opportunities_created_by foreign KEY (created_by) references adm_provider_employees (id) on delete set null,
constraint fk_crm_opportunities_deleted_by foreign KEY (deleted_by) references adm_provider_employees (id) on delete set null,
constraint fk_crm_opportunities_loss_reason foreign KEY (loss_reason_id) references crm_opportunity_loss_reasons (id) on delete set null,
constraint fk_crm_opportunities_owner foreign KEY (owner_id) references adm_provider_employees (id) on delete set null,
constraint fk_crm_opportunities_pipeline foreign KEY (pipeline_id) references crm_pipelines (id) on delete set null,
constraint crm_opportunities_opportunity_stage_check check (
(
stage = any (
array[
'prospect'::text,
'proposal'::text,
'negotiation'::text,
'closed'::text
]
)
)
),
constraint crm_opportunities_expected_value_check check (
(
(expected_value is null)
or (expected_value >= (0)::numeric)
)
)
) TABLESPACE pg_default;

create index IF not exists crm_opportunities_lead_id_idx on public.crm_opportunities using btree (lead_id) TABLESPACE pg_default;

create index IF not exists crm_opportunities_opportunity_stage_idx on public.crm_opportunities using btree (stage) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists crm_opportunities_close_date_idx on public.crm_opportunities using btree (close_date) TABLESPACE pg_default;

create index IF not exists crm_opportunities_assigned_to_idx on public.crm_opportunities using btree (assigned_to) TABLESPACE pg_default;

create index IF not exists crm_opportunities_deleted_at_idx on public.crm_opportunities using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists crm_opportunities_created_by_idx on public.crm_opportunities using btree (created_by) TABLESPACE pg_default;

create index IF not exists crm_opportunities_updated_by_idx on public.crm_opportunities using btree (updated_by) TABLESPACE pg_default;

create index IF not exists crm_opportunities_metadata_idx on public.crm_opportunities using gin (metadata) TABLESPACE pg_default;

create index IF not exists idx_crm_opportunities_lead on public.crm_opportunities using btree (lead_id) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists idx_crm_opportunities_lead_id on public.crm_opportunities using btree (lead_id) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists idx_crm_opportunities_pipeline_id on public.crm_opportunities using btree (pipeline_id) TABLESPACE pg_default
where
(deleted_at is null);

create trigger set_crm_opportunities_updated_at BEFORE
update on crm_opportunities for EACH row
execute FUNCTION set_updated_at ();

create trigger update_crm_opportunities_updated_at BEFORE
update on crm_opportunities for EACH row
execute FUNCTION trigger_set_updated_at ();

crm_opportunity_loss_reasons
create table public.crm_opportunity_loss_reasons (
id uuid not null default extensions.uuid_generate_v4 (),
name character varying(100) not null,
category character varying(50) null,
description text null,
is_active boolean not null default true,
constraint crm_opportunity_loss_reasons_pkey primary key (id),
constraint crm_opportunity_loss_reasons_name_key unique (name)
) TABLESPACE pg_default;

crm_pipelines
create table public.crm_pipelines (
id uuid not null default extensions.uuid_generate_v4 (),
name character varying(100) not null,
description text null,
stages jsonb not null,
default_probability jsonb null,
is_default boolean not null default false,
is_active boolean not null default true,
created_at timestamp with time zone not null default now(),
constraint crm_pipelines_pkey primary key (id)
) TABLESPACE pg_default;
