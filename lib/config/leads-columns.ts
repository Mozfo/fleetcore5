/**
 * Configuration des colonnes pour la table de leads
 * Définit les colonnes visibles par défaut, masquables et locked
 */

import type { Lead } from "@/types/crm";

export interface ColumnConfig {
  key: string;
  labelKey: string; // i18n key (leads.table.columns.xxx)
  visible: boolean;
  locked?: boolean; // true = non masquable (toujours visible)
  width: string;
  defaultVisible: boolean;
  sortable?: boolean;
}

export const DEFAULT_LEADS_COLUMNS: ColumnConfig[] = [
  // Colonnes toujours visibles (locked)
  {
    key: "checkbox",
    labelKey: "",
    visible: true,
    locked: true,
    width: "w-[40px]",
    defaultVisible: true,
    sortable: false,
  },
  // B2B Company-First: Company is the PRIMARY column (locked)
  {
    key: "company_name",
    labelKey: "leads.table.columns.company",
    visible: true,
    locked: true,
    width: "w-[200px]",
    defaultVisible: true,
    sortable: true,
  },
  // Contact is SECONDARY (not locked, can be hidden)
  {
    key: "contact",
    labelKey: "leads.table.columns.contact",
    visible: true,
    locked: false,
    width: "w-[160px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "actions",
    labelKey: "leads.table.columns.actions",
    visible: true,
    locked: true,
    width: "w-[140px]",
    defaultVisible: true,
    sortable: false,
  },

  // Colonnes visibles par défaut (toggleables)
  // Renamed: lead_code → ref
  {
    key: "ref",
    labelKey: "leads.table.columns.ref",
    visible: true,
    locked: false,
    width: "w-[120px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "country_code",
    labelKey: "leads.table.columns.country",
    visible: true,
    locked: false,
    width: "w-[100px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "qualification_score",
    labelKey: "leads.table.columns.score",
    visible: true,
    locked: false,
    width: "w-[100px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "lead_stage",
    labelKey: "leads.table.columns.stage",
    visible: true,
    locked: false,
    width: "w-[120px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "assigned_to",
    labelKey: "leads.table.columns.assigned",
    visible: true,
    locked: false,
    width: "w-[140px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "created_at",
    labelKey: "leads.table.columns.created",
    visible: true,
    locked: false,
    width: "w-[120px]",
    defaultVisible: true,
    sortable: true,
  },

  // 4 NEW colonnes VISIBLES par défaut
  {
    key: "source",
    labelKey: "leads.table.columns.source",
    visible: true,
    locked: false,
    width: "w-[120px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "next_action_date",
    labelKey: "leads.table.columns.next_action_date",
    visible: true,
    locked: false,
    width: "w-[130px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "current_software",
    labelKey: "leads.table.columns.current_software",
    visible: true,
    locked: false,
    width: "w-[140px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "city",
    labelKey: "leads.table.columns.city",
    visible: true,
    locked: false,
    width: "w-[120px]",
    defaultVisible: true,
    sortable: true,
  },

  // Colonnes masquées par défaut (existantes)
  {
    key: "email",
    labelKey: "leads.table.columns.email",
    visible: false,
    locked: false,
    width: "w-[200px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "phone",
    labelKey: "leads.table.columns.phone",
    visible: false,
    locked: false,
    width: "w-[140px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "fleet_size",
    labelKey: "leads.table.columns.fleet_size",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "status",
    labelKey: "leads.table.columns.status",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "priority",
    labelKey: "leads.table.columns.priority",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "fit_score",
    labelKey: "leads.table.columns.fit_score",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "engagement_score",
    labelKey: "leads.table.columns.engagement",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: true,
  },

  // 16 NEW colonnes MASQUÉES par défaut
  {
    key: "industry",
    labelKey: "leads.table.columns.industry",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "company_size",
    labelKey: "leads.table.columns.company_size",
    visible: false,
    locked: false,
    width: "w-[130px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "website_url",
    labelKey: "leads.table.columns.website_url",
    visible: false,
    locked: false,
    width: "w-[180px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "linkedin_url",
    labelKey: "leads.table.columns.linkedin_url",
    visible: false,
    locked: false,
    width: "w-[180px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "utm_source",
    labelKey: "leads.table.columns.utm_source",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "utm_medium",
    labelKey: "leads.table.columns.utm_medium",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "utm_campaign",
    labelKey: "leads.table.columns.utm_campaign",
    visible: false,
    locked: false,
    width: "w-[140px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "qualified_date",
    labelKey: "leads.table.columns.qualified_date",
    visible: false,
    locked: false,
    width: "w-[130px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "converted_date",
    labelKey: "leads.table.columns.converted_date",
    visible: false,
    locked: false,
    width: "w-[130px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "updated_at",
    labelKey: "leads.table.columns.updated_at",
    visible: false,
    locked: false,
    width: "w-[130px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "message",
    labelKey: "leads.table.columns.message",
    visible: false,
    locked: false,
    width: "w-[200px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "qualification_notes",
    labelKey: "leads.table.columns.qualification_notes",
    visible: false,
    locked: false,
    width: "w-[200px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "gdpr_consent",
    labelKey: "leads.table.columns.gdpr_consent",
    visible: false,
    locked: false,
    width: "w-[80px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "consent_at",
    labelKey: "leads.table.columns.consent_at",
    visible: false,
    locked: false,
    width: "w-[130px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "consent_ip",
    labelKey: "leads.table.columns.consent_ip",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "opportunity_id",
    labelKey: "leads.table.columns.opportunity_id",
    visible: false,
    locked: false,
    width: "w-[140px]",
    defaultVisible: false,
    sortable: false,
  },
];

// Default column order (E1-D) - 37 colonnes total
// B2B Company-First: Company comes before Contact
export const DEFAULT_COLUMN_ORDER: string[] = [
  // Locked first
  "checkbox",

  // B2B Company-First: Company before Contact
  "company_name",
  "contact",

  // Core identification
  "ref", // renamed from lead_code
  "email",
  "phone",
  "industry",
  "company_size",
  "fleet_size",
  "current_software",
  "website_url",
  "linkedin_url",

  // Location
  "country_code",
  "city",

  // Source & Attribution
  "source",
  "utm_source",
  "utm_medium",
  "utm_campaign",

  // Scoring
  "qualification_score",
  "fit_score",
  "engagement_score",

  // Status & Stage
  "lead_stage",
  "status",
  "priority",

  // Assignment & Dates
  "assigned_to",
  "next_action_date",
  "created_at",
  "updated_at",
  "qualified_date",
  "converted_date",

  // GDPR
  "gdpr_consent",
  "consent_at",
  "consent_ip",

  // Notes & Message
  "message",
  "qualification_notes",

  // Links
  "opportunity_id",

  // Locked last
  "actions",
];

// Locked columns that cannot be reordered (always first/last)
export const LOCKED_COLUMN_KEYS = ["checkbox", "actions"];

// Default column widths in pixels (E1-E) - 37 colonnes
// B2B Company-First: Company has more width as primary column
export const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  // Locked
  checkbox: 40,
  actions: 140,

  // B2B Company-First
  company_name: 200, // Primary column - wider
  contact: 160, // Secondary column

  // Core identification
  ref: 120, // renamed from lead_code
  email: 200,
  phone: 140,
  industry: 120,
  company_size: 130,
  fleet_size: 100,
  current_software: 140,
  website_url: 180,
  linkedin_url: 180,

  // Location
  country_code: 100,
  city: 120,

  // Source & Attribution
  source: 120,
  utm_source: 120,
  utm_medium: 120,
  utm_campaign: 140,

  // Scoring
  qualification_score: 100,
  fit_score: 100,
  engagement_score: 100,

  // Status & Stage
  lead_stage: 120,
  status: 100,
  priority: 100,

  // Assignment & Dates
  assigned_to: 140,
  next_action_date: 130,
  created_at: 120,
  updated_at: 130,
  qualified_date: 130,
  converted_date: 130,

  // GDPR
  gdpr_consent: 80,
  consent_at: 130,
  consent_ip: 120,

  // Notes & Message
  message: 200,
  qualification_notes: 200,

  // Links
  opportunity_id: 140,
};

// Helper pour obtenir les clés des colonnes visibles
export function getVisibleColumnKeys(columns: ColumnConfig[]): string[] {
  return columns.filter((c) => c.visible).map((c) => c.key);
}

// Helper pour obtenir les colonnes triables
export function getSortableColumns(columns: ColumnConfig[]): ColumnConfig[] {
  return columns.filter((c) => c.sortable && c.visible);
}

// ============================================================================
// CSV Export Configuration
// ============================================================================

export interface CsvColumnConfig {
  key: string;
  header: string;
  getValue: (lead: Lead) => string;
}

// Helper to format dates for CSV
const formatDate = (dateValue: Date | string | null): string => {
  if (!dateValue) return "";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return date.toISOString();
};

// CSV column configurations - maps column keys to headers and value extractors
export const CSV_COLUMN_CONFIG: Record<string, CsvColumnConfig> = {
  // Renamed: lead_code → ref
  ref: {
    key: "ref",
    header: "Ref",
    getValue: (lead) => lead.lead_code || "",
  },
  contact: {
    key: "contact",
    header: "Contact",
    getValue: (lead) =>
      `${lead.first_name || ""} ${lead.last_name || ""}`.trim(),
  },
  email: {
    key: "email",
    header: "Email",
    getValue: (lead) => lead.email || "",
  },
  phone: {
    key: "phone",
    header: "Phone",
    getValue: (lead) => lead.phone || "",
  },
  company_name: {
    key: "company_name",
    header: "Company",
    getValue: (lead) => lead.company_name || "",
  },
  industry: {
    key: "industry",
    header: "Industry",
    getValue: (lead) => lead.industry || "",
  },
  company_size: {
    key: "company_size",
    header: "Company Size",
    getValue: (lead) => lead.company_size?.toString() || "",
  },
  fleet_size: {
    key: "fleet_size",
    header: "Fleet Size",
    getValue: (lead) => lead.fleet_size || "",
  },
  current_software: {
    key: "current_software",
    header: "Current Software",
    getValue: (lead) => lead.current_software || "",
  },
  website_url: {
    key: "website_url",
    header: "Website",
    getValue: (lead) => lead.website_url || "",
  },
  linkedin_url: {
    key: "linkedin_url",
    header: "LinkedIn",
    getValue: (lead) => lead.linkedin_url || "",
  },
  country_code: {
    key: "country_code",
    header: "Country",
    getValue: (lead) => lead.country_code || "",
  },
  city: {
    key: "city",
    header: "City",
    getValue: (lead) => lead.city || "",
  },
  source: {
    key: "source",
    header: "Source",
    getValue: (lead) => lead.source || "",
  },
  utm_source: {
    key: "utm_source",
    header: "UTM Source",
    getValue: (lead) => lead.utm_source || "",
  },
  utm_medium: {
    key: "utm_medium",
    header: "UTM Medium",
    getValue: (lead) => lead.utm_medium || "",
  },
  utm_campaign: {
    key: "utm_campaign",
    header: "UTM Campaign",
    getValue: (lead) => lead.utm_campaign || "",
  },
  qualification_score: {
    key: "qualification_score",
    header: "Qualification Score",
    getValue: (lead) => lead.qualification_score?.toString() || "",
  },
  fit_score: {
    key: "fit_score",
    header: "Fit Score",
    getValue: (lead) => lead.fit_score?.toString() || "",
  },
  engagement_score: {
    key: "engagement_score",
    header: "Engagement Score",
    getValue: (lead) => lead.engagement_score?.toString() || "",
  },
  lead_stage: {
    key: "lead_stage",
    header: "Stage",
    getValue: (lead) => lead.lead_stage || "",
  },
  status: {
    key: "status",
    header: "Status",
    getValue: (lead) => lead.status || "",
  },
  priority: {
    key: "priority",
    header: "Priority",
    getValue: (lead) => lead.priority || "",
  },
  assigned_to: {
    key: "assigned_to",
    header: "Assigned To",
    getValue: (lead) =>
      lead.assigned_to
        ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name || ""}`.trim()
        : "",
  },
  next_action_date: {
    key: "next_action_date",
    header: "Next Action Date",
    getValue: (lead) => formatDate(lead.next_action_date),
  },
  created_at: {
    key: "created_at",
    header: "Created At",
    getValue: (lead) => formatDate(lead.created_at),
  },
  updated_at: {
    key: "updated_at",
    header: "Updated At",
    getValue: (lead) => formatDate(lead.updated_at),
  },
  qualified_date: {
    key: "qualified_date",
    header: "Qualified Date",
    getValue: (lead) => formatDate(lead.qualified_date),
  },
  converted_date: {
    key: "converted_date",
    header: "Converted Date",
    getValue: (lead) => formatDate(lead.converted_date),
  },
  gdpr_consent: {
    key: "gdpr_consent",
    header: "GDPR Consent",
    getValue: (lead) =>
      lead.gdpr_consent === true
        ? "Yes"
        : lead.gdpr_consent === false
          ? "No"
          : "",
  },
  consent_at: {
    key: "consent_at",
    header: "Consent Date",
    getValue: (lead) => formatDate(lead.consent_at),
  },
  consent_ip: {
    key: "consent_ip",
    header: "Consent IP",
    getValue: (lead) => lead.consent_ip || "",
  },
  message: {
    key: "message",
    header: "Message",
    getValue: (lead) => lead.message || "",
  },
  qualification_notes: {
    key: "qualification_notes",
    header: "Qualification Notes",
    getValue: (lead) => lead.qualification_notes || "",
  },
  opportunity_id: {
    key: "opportunity_id",
    header: "Opportunity ID",
    getValue: (lead) => lead.opportunity_id || "",
  },
};

// Columns to exclude from CSV export (UI-only columns)
export const CSV_EXCLUDED_COLUMNS = ["checkbox", "actions"];

// Type for translation function
type TranslateFn = (key: string) => string;

// Helper to generate CSV from visible columns with i18n support
// orderedVisibleColumnKeys: column keys in the order they appear in the table
// translateFn: optional i18n translation function for headers
export function generateCsvContent(
  leads: Lead[],
  orderedVisibleColumnKeys: string[],
  translateFn?: TranslateFn
): string {
  // Filter to exportable columns (exclude UI-only columns), preserving order
  const exportableKeys = orderedVisibleColumnKeys.filter(
    (key) => !CSV_EXCLUDED_COLUMNS.includes(key) && CSV_COLUMN_CONFIG[key]
  );

  // Get headers - use i18n if translate function provided, else fallback to English
  const headers = exportableKeys.map((key) => {
    const config = DEFAULT_LEADS_COLUMNS.find((c) => c.key === key);
    if (translateFn && config?.labelKey) {
      // Use i18n translation
      return translateFn(config.labelKey);
    }
    // Fallback to English header from CSV config
    return CSV_COLUMN_CONFIG[key].header;
  });

  // Get rows
  const rows = leads.map((lead) =>
    exportableKeys.map((key) => {
      const value = CSV_COLUMN_CONFIG[key].getValue(lead);
      // Escape quotes for CSV
      return `"${String(value).replace(/"/g, '""')}"`;
    })
  );

  // Combine headers and rows
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
