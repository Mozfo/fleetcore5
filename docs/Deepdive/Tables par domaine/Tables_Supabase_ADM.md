adm_tenants
create table public.adm_tenants (
id uuid not null default extensions.uuid_generate_v4 (),
name text not null,
country_code character varying(2) not null,
clerk_organization_id text null,
vat_rate numeric(5, 2) null,
default_currency character(3) not null default 'EUR'::character varying,
timezone text not null default 'Europe/Paris'::character varying,
created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
deleted_at timestamp with time zone null,
subdomain character varying(100) null,
status public.tenant_status not null default 'trialing'::tenant_status,
onboarding_completed_at timestamp with time zone null,
trial_ends_at timestamp with time zone null,
next_invoice_date date null,
primary_contact_email character varying(255) null,
primary_contact_phone character varying(50) null,
billing_email character varying(255) null,
constraint adm_tenants_pkey primary key (id),
constraint adm_tenants_clerk_org_unique unique (clerk_organization_id),
constraint adm_tenants_subdomain_key unique (subdomain)
) TABLESPACE pg_default;

create index IF not exists adm_tenants_country_code_idx on public.adm_tenants using btree (country_code) TABLESPACE pg_default;

create index IF not exists adm_tenants_deleted_at_idx on public.adm_tenants using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists adm_tenants_clerk_organization_id_idx on public.adm_tenants using btree (clerk_organization_id) TABLESPACE pg_default;

create index IF not exists adm_tenants_default_currency_idx on public.adm_tenants using btree (default_currency) TABLESPACE pg_default;

create trigger set_updated_at_adm_tenants BEFORE
update on adm_tenants for EACH row
execute FUNCTION trigger_set_updated_at ();

adm_tenant_vehicle_classes
create table public.adm_tenant_vehicle_classes (
id uuid not null default extensions.uuid_generate_v4 (),
tenant_id uuid not null,
code character varying(50) not null,
name character varying(100) not null,
description text null,
criteria jsonb null,
based_on_class_id uuid null,
status public.lifecycle_status not null default 'active'::lifecycle_status,
metadata jsonb null,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
created_by uuid not null,
updated_by uuid null,
deleted_at timestamp with time zone null,
deleted_by uuid null,
deletion_reason text null,
constraint adm_tenant_vehicle_classes_pkey primary key (id),
constraint fk_adm_tenant_vehicle_classes_based_on foreign KEY (based_on_class_id) references dir_vehicle_classes (id) on delete set null,
constraint fk_adm_tenant_vehicle_classes_created_by foreign KEY (created_by) references adm_members (id) on delete RESTRICT,
constraint fk_adm_tenant_vehicle_classes_deleted_by foreign KEY (deleted_by) references adm_members (id) on delete RESTRICT,
constraint fk_adm_tenant_vehicle_classes_tenant foreign KEY (tenant_id) references adm_tenants (id) on delete CASCADE,
constraint fk_adm_tenant_vehicle_classes_updated_by foreign KEY (updated_by) references adm_members (id) on delete RESTRICT
) TABLESPACE pg_default;

adm_tenant_settings
create table public.adm_tenant_settings (
id uuid not null default gen_random_uuid (),
tenant_id uuid not null,
setting_key character varying(100) not null,
setting_value jsonb not null,
category character varying(50) null,
is_encrypted boolean not null default false,
updated_at timestamp with time zone not null default now(),
constraint adm_tenant_settings_pkey primary key (id),
constraint fk_adm_tenant_settings_tenant foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

adm_tenant_lifecycle_events
create table public.adm_tenant_lifecycle_events (
id uuid not null default extensions.uuid_generate_v4 (),
tenant_id uuid not null,
event_type character varying(50) not null,
performed_by uuid null,
effective_date date null,
description text null,
created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
constraint adm_tenant_lifecycle_events_pkey primary key (id),
constraint adm_tenant_lifecycle_events_performed_by_fkey foreign KEY (performed_by) references adm_provider_employees (id) on update CASCADE on delete set null,
constraint adm_tenant_lifecycle_events_tenant_id_fkey foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE,
constraint fk_adm_tenant_lifecycle_events_performed_by foreign KEY (performed_by) references adm_provider_employees (id) on update CASCADE on delete set null,
constraint fk_adm_tenant_lifecycle_events_tenant foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE,
constraint adm_tenant_lifecycle_events_event_type_check check (
(
(event_type)::text = any (
(
array[
'created'::character varying,
'plan_changed'::character varying,
'suspended'::character varying,
'reactivated'::character varying,
'cancelled'::character varying
]
)::text[]
)
)
)
) TABLESPACE pg_default;

create index IF not exists adm_tenant_lifecycle_events_tenant_id_idx on public.adm_tenant_lifecycle_events using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists adm_tenant_lifecycle_events_event_type_idx on public.adm_tenant_lifecycle_events using btree (event_type) TABLESPACE pg_default;

create index IF not exists adm_tenant_lifecycle_events_effective_date_idx on public.adm_tenant_lifecycle_events using btree (effective_date desc) TABLESPACE pg_default;

create index IF not exists adm_tenant_lifecycle_events_tenant_event_idx on public.adm_tenant_lifecycle_events using btree (tenant_id, event_type) TABLESPACE pg_default;

adm_roles
create table public.adm_roles (
id uuid not null default extensions.uuid_generate_v4 (),
tenant_id uuid not null,
name character varying(100) not null,
description text null,
permissions jsonb not null default '{}'::jsonb,
status character varying(50) not null default 'active'::character varying,
created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
created_by uuid null,
updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
updated_by uuid null,
deleted_at timestamp with time zone null,
deleted_by uuid null,
deletion_reason text null,
slug character varying(100) not null,
parent_role_id uuid null,
is_system boolean not null default false,
is_default boolean not null default false,
max_members integer null,
valid_from timestamp with time zone null,
valid_until timestamp with time zone null,
approval_required boolean not null default false,
constraint adm_roles_pkey primary key (id),
constraint adm_roles_slug_key unique (slug),
constraint adm_roles_tenant_id_fkey foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE,
constraint adm_roles_updated_by_fkey foreign KEY (updated_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_adm_roles_parent foreign KEY (parent_role_id) references adm_roles (id) on update CASCADE on delete set null,
constraint adm_roles_created_by_fkey foreign KEY (created_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_adm_roles_tenant foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE,
constraint adm_roles_deleted_by_fkey foreign KEY (deleted_by) references adm_members (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create index IF not exists adm_roles_tenant_id_idx on public.adm_roles using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists adm_roles_deleted_at_idx on public.adm_roles using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists adm_roles_created_by_idx on public.adm_roles using btree (created_by) TABLESPACE pg_default;

create index IF not exists adm_roles_updated_by_idx on public.adm_roles using btree (updated_by) TABLESPACE pg_default;

create index IF not exists adm_roles_status_active_idx on public.adm_roles using btree (status) TABLESPACE pg_default
where
(deleted_at is null);

create unique INDEX IF not exists adm_roles_tenant_name_uq on public.adm_roles using btree (tenant_id, name) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists adm_roles_permissions_gin on public.adm_roles using gin (permissions) TABLESPACE pg_default;

create index IF not exists idx_adm_roles_tenant on public.adm_roles using btree (tenant_id) TABLESPACE pg_default
where
(deleted_at is null);

create unique INDEX IF not exists idx_adm_roles_tenant_name on public.adm_roles using btree (tenant_id, name) TABLESPACE pg_default
where
(deleted_at is null);

create trigger update_adm_roles_updated_at BEFORE
update on adm_roles for EACH row
execute FUNCTION trigger_set_updated_at ();

adm_role_versions
create table public.adm_role_versions (
id uuid not null default gen_random_uuid (),
role_id uuid not null,
version_number integer not null,
permissions_snapshot jsonb not null,
changed_by uuid null,
change_reason text null,
created_at timestamp with time zone not null default now(),
constraint adm_role_versions_pkey primary key (id),
constraint fk_adm_role_versions_changed_by foreign KEY (changed_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_adm_role_versions_role foreign KEY (role_id) references adm_roles (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

adm_role_permissions
create table public.adm_role_permissions (
id uuid not null default gen_random_uuid (),
role_id uuid not null,
resource character varying(100) not null,
action character varying(50) not null,
conditions jsonb null,
created_at timestamp with time zone not null default now(),
constraint adm_role_permissions_pkey primary key (id),
constraint fk_adm_role_permissions_role foreign KEY (role_id) references adm_roles (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

adm_provider_employees
create table public.adm_provider_employees (
id uuid not null default extensions.uuid_generate_v4 (),
clerk_user_id character varying(255) not null,
name character varying(100) not null,
email character varying(255) not null,
department character varying(50) null,
title character varying(50) null,
permissions jsonb null,
status character varying(50) not null default 'active'::character varying,
created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
created_by uuid null,
updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
updated_by uuid null,
deleted_at timestamp with time zone null,
deleted_by uuid null,
deletion_reason text null,
supervisor_id uuid null,
constraint adm_provider_employees_pkey primary key (id),
constraint adm_provider_employees_created_by_fkey foreign KEY (created_by) references adm_provider_employees (id) on update CASCADE on delete set null,
constraint adm_provider_employees_deleted_by_fkey foreign KEY (deleted_by) references adm_provider_employees (id) on update CASCADE on delete set null,
constraint adm_provider_employees_updated_by_fkey foreign KEY (updated_by) references adm_provider_employees (id) on update CASCADE on delete set null,
constraint fk_adm_provider_employees_supervisor foreign KEY (supervisor_id) references adm_provider_employees (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create index IF not exists adm_provider_employees_deleted_at_idx on public.adm_provider_employees using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists adm_provider_employees_created_by_idx on public.adm_provider_employees using btree (created_by) TABLESPACE pg_default;

create index IF not exists adm_provider_employees_updated_by_idx on public.adm_provider_employees using btree (updated_by) TABLESPACE pg_default;

create index IF not exists adm_provider_employees_status_active_idx on public.adm_provider_employees using btree (status) TABLESPACE pg_default
where
(deleted_at is null);

create unique INDEX IF not exists adm_provider_employees_clerk_user_id_uq on public.adm_provider_employees using btree (clerk_user_id) TABLESPACE pg_default
where
(deleted_at is null);

create unique INDEX IF not exists adm_provider_employees_email_uq on public.adm_provider_employees using btree (email) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists adm_provider_employees_permissions_gin on public.adm_provider_employees using gin (permissions) TABLESPACE pg_default;

create trigger set_updated_at_adm_provider_employees BEFORE
update on adm_provider_employees for EACH row
execute FUNCTION set_updated_at ();

adm_notification_logs
create table public.adm_notification_logs (
id uuid not null default gen_random_uuid (),
tenant_id uuid null,
recipient_id uuid null,
recipient_email character varying(255) not null,
recipient_phone character varying(20) null,
template_code character varying(100) not null,
channel public.notification_channel not null,
locale_used character varying(10) not null,
subject text null,
body text null,
variables_data jsonb null,
status public.notification_status not null default 'pending'::notification_status,
sent_at timestamp with time zone null,
delivered_at timestamp with time zone null,
opened_at timestamp with time zone null,
clicked_at timestamp with time zone null,
failed_at timestamp with time zone null,
error_message text null,
external_id character varying(255) null,
ip_address character varying(45) null,
user_agent text null,
session_id uuid null,
request_id uuid null,
created_at timestamp with time zone not null default now(),
created_by uuid null,
updated_at timestamp with time zone not null default now(),
updated_by uuid null,
deleted_at timestamp with time zone null,
deleted_by uuid null,
deletion_reason text null,
constraint adm_notification_logs_pkey primary key (id),
constraint fk_adm_notification_logs_created_by foreign KEY (created_by) references adm_members (id),
constraint fk_adm_notification_logs_deleted_by foreign KEY (deleted_by) references adm_members (id),
constraint fk_adm_notification_logs_updated_by foreign KEY (updated_by) references adm_members (id),
constraint fk_adm_notification_logs_recipient_id foreign KEY (recipient_id) references adm_members (id),
constraint fk_adm_notification_logs_tenant foreign KEY (tenant_id) references adm_tenants (id) on delete CASCADE,
constraint check_recipient_exists check (
(
(recipient_email is not null)
or (recipient_phone is not null)
)
)
) TABLESPACE pg_default;

create index IF not exists idx_adm_notification_logs_tenant on public.adm_notification_logs using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists idx_adm_notification_logs_recipient_id on public.adm_notification_logs using btree (recipient_id) TABLESPACE pg_default;

create index IF not exists idx_adm_notification_logs_recipient_email on public.adm_notification_logs using btree (recipient_email) TABLESPACE pg_default;

create index IF not exists idx_adm_notification_logs_template_code on public.adm_notification_logs using btree (template_code) TABLESPACE pg_default;

create index IF not exists idx_adm_notification_logs_channel on public.adm_notification_logs using btree (channel) TABLESPACE pg_default;

create index IF not exists idx_adm_notification_logs_status on public.adm_notification_logs using btree (status) TABLESPACE pg_default;

create index IF not exists idx_adm_notification_logs_sent_at on public.adm_notification_logs using btree (sent_at) TABLESPACE pg_default;

create index IF not exists idx_adm_notification_logs_created_at on public.adm_notification_logs using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_adm_notification_logs_deleted_at on public.adm_notification_logs using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists idx_adm_notification_logs_tenant_created on public.adm_notification_logs using btree (tenant_id, created_at desc) TABLESPACE pg_default
where
(deleted_at is null);

adm_members
create table public.adm_members (
id uuid not null default extensions.uuid_generate_v4 (),
tenant_id uuid not null,
email extensions.citext not null,
clerk_user_id character varying(255) not null,
first_name character varying(100) null,
last_name character varying(100) null,
phone character varying(50) not null,
role character varying(50) not null default 'member'::character varying,
last_login_at timestamp with time zone null,
metadata jsonb not null default '{}'::jsonb,
status character varying(50) not null default 'active'::character varying,
created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
created_by uuid null,
updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
updated_by uuid null,
deleted_at timestamp with time zone null,
deleted_by uuid null,
deletion_reason text null,
email_verified_at timestamp with time zone null,
two_factor_enabled boolean not null default false,
two_factor_secret text null,
password_changed_at timestamp with time zone null,
failed_login_attempts integer not null default 0,
locked_until timestamp with time zone null,
default_role_id uuid null,
preferred_language character varying(10) null,
notification_preferences jsonb null,
constraint adm_members_pkey primary key (id),
constraint adm_members_deleted_by_fkey foreign KEY (deleted_by) references adm_members (id) on update CASCADE on delete set null,
constraint adm_members_created_by_fkey foreign KEY (created_by) references adm_members (id) on update CASCADE on delete set null,
constraint adm_members_updated_by_fkey foreign KEY (updated_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_adm_members_default_role foreign KEY (default_role_id) references adm_roles (id) on update CASCADE on delete set null,
constraint fk_adm_members_tenant foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE,
constraint adm_members_tenant_id_fkey foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists adm_members_tenant_id_idx on public.adm_members using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists adm_members_email_idx on public.adm_members using btree (email) TABLESPACE pg_default;

create index IF not exists adm_members_clerk_user_id_idx on public.adm_members using btree (clerk_user_id) TABLESPACE pg_default;

create index IF not exists adm_members_deleted_at_idx on public.adm_members using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists adm_members_created_by_idx on public.adm_members using btree (created_by) TABLESPACE pg_default;

create index IF not exists adm_members_updated_by_idx on public.adm_members using btree (updated_by) TABLESPACE pg_default;

create index IF not exists adm_members_last_login_at_idx on public.adm_members using btree (last_login_at) TABLESPACE pg_default;

create index IF not exists adm_members_metadata_idx on public.adm_members using gin (metadata) TABLESPACE pg_default;

create index IF not exists adm_members_status_active_idx on public.adm_members using btree (status) TABLESPACE pg_default
where
(deleted_at is null);

create unique INDEX IF not exists adm_members_tenant_email_uq on public.adm_members using btree (tenant_id, email) TABLESPACE pg_default
where
(deleted_at is null);

create unique INDEX IF not exists adm_members_tenant_clerk_uq on public.adm_members using btree (tenant_id, clerk_user_id) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists adm_members_metadata_gin on public.adm_members using gin (metadata) TABLESPACE pg_default;

create index IF not exists idx_adm_members_tenant on public.adm_members using btree (tenant_id) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists idx_adm_members_role on public.adm_members using btree (default_role_id) TABLESPACE pg_default
where
(deleted_at is null);

create unique INDEX IF not exists idx_adm_members_tenant_email on public.adm_members using btree (tenant_id, email) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists idx_adm_members_metadata on public.adm_members using gin (metadata) TABLESPACE pg_default;

create index IF not exists idx_adm_members_email on public.adm_members using btree (email) TABLESPACE pg_default
where
(deleted_at is null);

create unique INDEX IF not exists idx_adm_members_tenant_email_unique on public.adm_members using btree (tenant_id, email) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists idx_adm_members_tenant_status on public.adm_members using btree (tenant_id, status) TABLESPACE pg_default
where
(deleted_at is null);

create trigger set_updated_at_adm_members BEFORE
update on adm_members for EACH row
execute FUNCTION set_updated_at ();

adm_member_sessions
create table public.adm_member_sessions (
id uuid not null default gen_random_uuid (),
member_id uuid not null,
token_hash character varying(256) not null,
ip_address inet null,
user_agent text null,
expires_at timestamp with time zone not null,
revoked_at timestamp with time zone null,
created_at timestamp with time zone not null default now(),
constraint adm_member_sessions_pkey primary key (id),
constraint adm_member_sessions_token_hash_key unique (token_hash),
constraint fk_adm_member_sessions_member foreign KEY (member_id) references adm_members (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

adm_member_roles
create table public.adm_member_roles (
id uuid not null default extensions.uuid_generate_v4 (),
tenant_id uuid not null,
member_id uuid not null,
role_id uuid not null,
assigned_at timestamp with time zone not null default CURRENT_TIMESTAMP,
created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
created_by uuid null,
updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
updated_by uuid null,
deleted_at timestamp with time zone null,
deleted_by uuid null,
deletion_reason text null,
assigned_by uuid null,
assignment_reason text null,
valid_from timestamp with time zone null,
valid_until timestamp with time zone null,
is_primary boolean not null default false,
scope_type public.scope_type null,
scope_id uuid null,
priority integer null default 0,
constraint adm_member_roles_pkey primary key (id),
constraint adm_member_roles_deleted_by_fkey foreign KEY (deleted_by) references adm_members (id) on update CASCADE on delete set null,
constraint adm_member_roles_member_id_fkey foreign KEY (member_id) references adm_members (id) on update CASCADE on delete CASCADE,
constraint adm_member_roles_role_id_fkey foreign KEY (role_id) references adm_roles (id) on update CASCADE on delete CASCADE,
constraint adm_member_roles_tenant_id_fkey foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE,
constraint adm_member_roles_updated_by_fkey foreign KEY (updated_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_adm_member_roles_assigned_by foreign KEY (assigned_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_adm_member_roles_member foreign KEY (member_id) references adm_members (id) on update CASCADE on delete CASCADE,
constraint adm_member_roles_created_by_fkey foreign KEY (created_by) references adm_members (id) on update CASCADE on delete set null,
constraint fk_adm_member_roles_role foreign KEY (role_id) references adm_roles (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists adm_member_roles_tenant_id_member_id_role_id_key on public.adm_member_roles using btree (tenant_id, member_id, role_id) TABLESPACE pg_default
where
(deleted_at is null);

create index IF not exists adm_member_roles_tenant_id_idx on public.adm_member_roles using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists adm_member_roles_member_id_idx on public.adm_member_roles using btree (member_id) TABLESPACE pg_default;

create index IF not exists adm_member_roles_role_id_idx on public.adm_member_roles using btree (role_id) TABLESPACE pg_default;

create index IF not exists adm_member_roles_deleted_at_idx on public.adm_member_roles using btree (deleted_at) TABLESPACE pg_default;

create index IF not exists adm_member_roles_created_by_idx on public.adm_member_roles using btree (created_by) TABLESPACE pg_default;

create index IF not exists adm_member_roles_updated_by_idx on public.adm_member_roles using btree (updated_by) TABLESPACE pg_default;

create index IF not exists idx_adm_member_roles_member on public.adm_member_roles using btree (member_id) TABLESPACE pg_default;

create index IF not exists idx_adm_member_roles_role on public.adm_member_roles using btree (role_id) TABLESPACE pg_default;

create trigger set_updated_at_adm_member_roles BEFORE
update on adm_member_roles for EACH row
execute FUNCTION set_updated_at ();

adm_invitations
create table public.adm_invitations (
id uuid not null default gen_random_uuid (),
tenant_id uuid not null,
email extensions.citext not null,
token character varying(255) not null,
role character varying(100) not null,
expires_at timestamp with time zone not null,
status public.invitation_status not null default 'pending'::invitation_status,
sent_at timestamp with time zone not null,
sent_count integer not null default 1,
last_sent_at timestamp with time zone not null,
accepted_at timestamp with time zone null,
accepted_from_ip inet null,
accepted_by_member_id uuid null,
invitation_type public.invitation_type not null,
custom_message text null,
metadata jsonb null,
sent_by uuid not null,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
constraint adm_invitations_pkey primary key (id),
constraint adm_invitations_token_key unique (token),
constraint fk_adm_invitations_accepted_by foreign KEY (accepted_by_member_id) references adm_members (id) on update CASCADE on delete set null,
constraint fk_adm_invitations_sent_by foreign KEY (sent_by) references adm_provider_employees (id) on update CASCADE on delete RESTRICT,
constraint fk_adm_invitations_tenant foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

adm_audit_logs
create table public.adm_audit_logs (
id uuid not null default extensions.uuid_generate_v4 (),
tenant_id uuid not null,
member_id uuid null,
entity character varying(50) not null,
entity_id uuid not null,
action character varying(50) not null,
changes jsonb null,
ip_address character varying(45) null,
user_agent text null,
timestamp timestamp with time zone not null default CURRENT_TIMESTAMP,
severity public.audit_severity not null default 'info'::audit_severity,
category public.audit_category not null default 'operational'::audit_category,
session_id uuid null,
request_id uuid null,
old_values jsonb null,
new_values jsonb null,
retention_until timestamp with time zone null,
tags text[] null default array[]::text[],
constraint adm_audit_logs_pkey primary key (id),
constraint adm_audit_logs_member_id_fkey foreign KEY (member_id) references adm_members (id) on update CASCADE on delete set null,
constraint adm_audit_logs_tenant_id_fkey foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE,
constraint fk_adm_audit_logs_member foreign KEY (member_id) references adm_members (id) on update CASCADE on delete set null,
constraint fk_adm_audit_logs_tenant foreign KEY (tenant_id) references adm_tenants (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create index IF not exists adm_audit_logs_tenant_entity_entity_id_idx on public.adm_audit_logs using btree (tenant_id, entity, entity_id) TABLESPACE pg_default;

create index IF not exists adm_audit_logs_timestamp_idx on public.adm_audit_logs using btree ("timestamp" desc) TABLESPACE pg_default;

create index IF not exists adm_audit_logs_changes_gin on public.adm_audit_logs using gin (changes) TABLESPACE pg_default;

create index IF not exists adm_audit_logs_tenant_id_idx on public.adm_audit_logs using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists adm_audit_logs_changes_idx on public.adm_audit_logs using gin (changes) TABLESPACE pg_default;

create index IF not exists idx_adm_audit_logs_tenant on public.adm_audit_logs using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists idx_adm_audit_logs_timestamp on public.adm_audit_logs using btree ("timestamp" desc) TABLESPACE pg_default;
