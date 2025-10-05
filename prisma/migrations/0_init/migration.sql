CREATE TABLE public.member (
    id text NOT NULL,
    tenant_id text NOT NULL,
    email text NOT NULL,
    clerk_id text NOT NULL,
    role text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);
CREATE TABLE public.organization (
    id text NOT NULL,
    name text NOT NULL,
    subdomain text NOT NULL,
    country_code text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    clerk_org_id character varying(255)
);
CREATE TABLE public.sys_demo_lead (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    demo_company_name character varying(255) NOT NULL,
    fleet_size character varying(50) NOT NULL,
    phone character varying(50),
    message text,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    country_code character varying(2) DEFAULT 'AE'::character varying NOT NULL,
    assigned_to uuid,
    qualified_date timestamp with time zone
);
COMMENT ON TABLE public.sys_demo_lead IS 'Leads from demo request form - pending commercial contact';
CREATE TABLE public.sys_demo_lead_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    activity_type character varying(50) NOT NULL,
    activity_date timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    performed_by uuid NOT NULL,
    next_action character varying(255),
    next_action_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    outcome character varying(50),
    duration integer,
    priority character varying(20) DEFAULT 'medium'::character varying,
    status character varying(20) DEFAULT 'completed'::character varying
);
ALTER TABLE ONLY public.sys_demo_lead
    ADD CONSTRAINT "DemoLead_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public.organization
    ADD CONSTRAINT "Tenant_clerk_org_id_key" UNIQUE (clerk_org_id);
ALTER TABLE ONLY public.organization
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public.member
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public.sys_demo_lead_activity
    ADD CONSTRAINT sys_demo_lead_activity_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON public.organization USING btree (subdomain);
CREATE UNIQUE INDEX "User_clerk_id_key" ON public.member USING btree (clerk_id);
CREATE UNIQUE INDEX "User_tenant_id_email_key" ON public.member USING btree (tenant_id, email);
CREATE INDEX idx_demo_lead_activity_date ON public.sys_demo_lead_activity USING btree (activity_date DESC);
CREATE INDEX idx_demo_lead_activity_lead ON public.sys_demo_lead_activity USING btree (lead_id);
CREATE INDEX idx_demo_lead_activity_performed_by ON public.sys_demo_lead_activity USING btree (performed_by);
CREATE INDEX idx_demo_lead_activity_status ON public.sys_demo_lead_activity USING btree (status);
CREATE INDEX idx_demo_lead_assigned ON public.sys_demo_lead USING btree (assigned_to);
CREATE INDEX idx_demo_lead_country ON public.sys_demo_lead USING btree (country_code);
CREATE INDEX idx_demo_lead_created ON public.sys_demo_lead USING btree (created_at DESC);
CREATE INDEX idx_demo_lead_demo_company ON public.sys_demo_lead USING btree (demo_company_name);
CREATE INDEX idx_demo_lead_email ON public.sys_demo_lead USING btree (email);
CREATE INDEX idx_demo_lead_status ON public.sys_demo_lead USING btree (status);
ALTER TABLE ONLY public.member
    ADD CONSTRAINT "User_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.organization(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY public.sys_demo_lead_activity
    ADD CONSTRAINT sys_demo_lead_activity_lead_fk FOREIGN KEY (lead_id) REFERENCES public.sys_demo_lead(id) ON DELETE CASCADE;

-- Note: RLS policies are managed by Supabase and not included in migrations
