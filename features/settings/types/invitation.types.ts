/** Invitation type returned by the Settings Invitations API */
export interface SettingsInvitation {
  id: string;
  email: string;
  role: string | null;
  status: string;
  tenantId: string;
  tenantName: string;
  inviterName: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface SettingsInvitationsResponse {
  data: SettingsInvitation[];
  total: number;
}
