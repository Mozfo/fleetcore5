/** Enriched organization type returned by the Settings Orgs API */
export interface SettingsOrg {
  id: string;
  name: string;
  slug: string;
  tenantType: string;
  memberCount: number;
  createdAt: string;
}

export interface SettingsOrgsResponse {
  data: SettingsOrg[];
  total: number;
}

/** Member within an org detail view */
export interface SettingsOrgMember {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
}

export interface SettingsOrgDetail extends SettingsOrg {
  metadata: string | null;
  members: SettingsOrgMember[];
}
