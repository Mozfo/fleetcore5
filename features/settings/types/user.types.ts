/** Enriched user type returned by the Settings Users API */
export interface SettingsUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  /** Organization memberships */
  memberships: {
    organizationId: string;
    organizationName: string;
    role: string;
  }[];
}

export interface SettingsUsersResponse {
  data: SettingsUser[];
  total: number;
}
