/** Company profile data stored in adm_tenant_settings */
export interface CompanyProfileData {
  identity: {
    legal_name: string;
    trade_name: string;
    website: string;
    legal_form: string;
  };
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  legal: Record<string, string>;
  contacts: {
    primary_email: string;
    primary_phone: string;
    billing_email: string;
  };
}

export interface LegalField {
  key: string;
  label: string;
  placeholder: string;
}

/** Legal fields per country code */
export const LEGAL_FIELDS_BY_COUNTRY: Record<string, LegalField[]> = {
  FR: [
    { key: "siret", label: "SIRET", placeholder: "000 000 000 00000" },
    { key: "siren", label: "SIREN", placeholder: "000 000 000" },
    { key: "naf_code", label: "Code NAF/APE", placeholder: "0000A" },
    { key: "rcs", label: "RCS", placeholder: "RCS Paris B 000 000 000" },
    {
      key: "tva_intracom",
      label: "N\u00b0 TVA Intracommunautaire",
      placeholder: "FR00000000000",
    },
  ],
  AE: [
    {
      key: "trn",
      label: "TRN (Tax Registration Number)",
      placeholder: "100000000000000",
    },
    {
      key: "trade_license_no",
      label: "Trade License No.",
      placeholder: "000000",
    },
  ],
};
