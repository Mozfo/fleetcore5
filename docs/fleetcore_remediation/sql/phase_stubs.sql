-- Fleetcore Remediation — SQL Stubs
-- Generated: 2025-10-12

-- === P0-01: RLS policies (template) ===
-- Apply similar policies to each multi-tenant table
-- Example for adm_members
create policy if not exists rls_adm_members_select on adm_members
as permissive for select
to authenticated
using (tenant_id::text = current_setting('app.current_tenant_id', true));

-- === P0-02: rid_drivers columns ===
alter table rid_drivers
  add column if not exists date_of_birth date,
  add column if not exists gender text check (gender in ('male','female','other')),
  add column if not exists nationality text,
  add column if not exists languages text[],
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists hire_date date,
  add column if not exists employment_status text not null default 'active'
    check (employment_status in ('active','suspended','terminated','on_leave')),
  add column if not exists cooperation_type text
    check (cooperation_type in ('employee','contractor','partner'));

-- === P0-03: Payment providers neutrality ===
create table if not exists bil_payment_providers (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  display_name text not null,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

alter table bil_payment_methods
  add column if not exists provider_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bil_payment_methods_provider_fk'
  ) then
    alter table bil_payment_methods
      add constraint bil_payment_methods_provider_fk
      foreign key (provider_id) references bil_payment_providers(id)
      on update cascade on delete set null;
  end if;
end $$;

drop index if exists bil_payment_methods_tenant_id_payment_type_unique;
create unique index if not exists bil_pm_tenant_type_provider_uq
  on bil_payment_methods(tenant_id, payment_type, coalesce(provider_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where deleted_at is null;

-- === P0-04: doc_documents document_type extension ===
-- handled in application constraints; keep check domain if maintained centrally

-- === P1-02: Materialized views (example) ===
create materialized view if not exists rpt_daily_trip_kpis as
select
  tenant_id,
  date_trunc('day', coalesce(start_time, end_time))::date as day,
  count(*) filter (where status='completed') as trips_completed,
  sum(net_earnings) as net_earnings
from trp_trips
where deleted_at is null
group by tenant_id, date_trunc('day', coalesce(start_time, end_time));
create index if not exists rpt_daily_trip_kpis_tenant_day_idx on rpt_daily_trip_kpis(tenant_id, day);
