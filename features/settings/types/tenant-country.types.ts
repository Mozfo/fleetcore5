/** Enriched tenant-country mapping returned by the Admin Tenant Countries API */
export interface SettingsTenantCountry {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantType: string;
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  isPrimary: boolean;
  createdAt: string;
}
