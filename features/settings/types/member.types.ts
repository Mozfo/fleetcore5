/** Enriched member type returned by the Admin Members API (source: adm_members) */
export interface SettingsMember {
  id: string;
  authUserId: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  preferredLanguage: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  /** Tenant info (from adm_tenants via tenant_id) */
  tenantId: string;
  tenantName: string;
  tenantCountryCode: string;
}

export interface SettingsMembersResponse {
  data: SettingsMember[];
  total: number;
}
