/** Enriched tenant type returned by the Admin Tenants API */
export interface SettingsTenant {
  id: string;
  name: string;
  slug: string;
  tenantType: string;
  tenantCode: string | null;
  countryCode: string;
  defaultCurrency: string;
  status: string;
  timezone: string;
  memberCount: number;
  createdAt: string;
}

export interface SettingsTenantsResponse {
  data: SettingsTenant[];
  total: number;
}

/** Member within a tenant detail view */
export interface SettingsTenantMember {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
}

export interface SettingsTenantDetail extends SettingsTenant {
  metadata: string | null;
  members: SettingsTenantMember[];
}
