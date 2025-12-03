/**
 * Configuration des colonnes pour la table d'opportunities
 * Basé sur leads-columns.ts - même pattern
 */

import type { Opportunity } from "@/types/crm";

export interface OpportunityColumnConfig {
  key: string;
  labelKey: string; // i18n key (opportunity.table.columns.xxx)
  visible: boolean;
  locked?: boolean; // true = non masquable (toujours visible)
  width: string;
  defaultVisible: boolean;
  sortable?: boolean;
}

export const DEFAULT_OPPORTUNITY_COLUMNS: OpportunityColumnConfig[] = [
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
  // Company is PRIMARY column (via lead)
  {
    key: "company_name",
    labelKey: "opportunity.table.columns.company",
    visible: true,
    locked: true,
    width: "w-[200px]",
    defaultVisible: true,
    sortable: true,
  },
  // Actions always visible
  {
    key: "actions",
    labelKey: "opportunity.table.columns.actions",
    visible: true,
    locked: true,
    width: "w-[140px]",
    defaultVisible: true,
    sortable: false,
  },

  // Colonnes visibles par défaut (toggleables)
  {
    key: "contact",
    labelKey: "opportunity.table.columns.contact",
    visible: true,
    locked: false,
    width: "w-[160px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "expected_value",
    labelKey: "opportunity.table.columns.value",
    visible: true,
    locked: false,
    width: "w-[120px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "probability_percent",
    labelKey: "opportunity.table.columns.probability",
    visible: true,
    locked: false,
    width: "w-[100px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "forecast_value",
    labelKey: "opportunity.table.columns.forecast",
    visible: true,
    locked: false,
    width: "w-[120px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "stage",
    labelKey: "opportunity.table.columns.stage",
    visible: true,
    locked: false,
    width: "w-[130px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "status",
    labelKey: "opportunity.table.columns.status",
    visible: true,
    locked: false,
    width: "w-[100px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "assigned_to",
    labelKey: "opportunity.table.columns.assigned",
    visible: true,
    locked: false,
    width: "w-[140px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "expected_close_date",
    labelKey: "opportunity.table.columns.close_date",
    visible: true,
    locked: false,
    width: "w-[130px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "days_in_stage",
    labelKey: "opportunity.table.columns.days_in_stage",
    visible: true,
    locked: false,
    width: "w-[100px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "country_code",
    labelKey: "opportunity.table.columns.country",
    visible: true,
    locked: false,
    width: "w-[100px]",
    defaultVisible: true,
    sortable: true,
  },

  // Colonnes masquées par défaut
  {
    key: "created_at",
    labelKey: "opportunity.table.columns.created",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "updated_at",
    labelKey: "opportunity.table.columns.updated",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "won_date",
    labelKey: "opportunity.table.columns.won_date",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "lost_date",
    labelKey: "opportunity.table.columns.lost_date",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "won_value",
    labelKey: "opportunity.table.columns.won_value",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "currency",
    labelKey: "opportunity.table.columns.currency",
    visible: false,
    locked: false,
    width: "w-[80px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "discount_amount",
    labelKey: "opportunity.table.columns.discount",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "notes",
    labelKey: "opportunity.table.columns.notes",
    visible: false,
    locked: false,
    width: "w-[200px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "is_rotting",
    labelKey: "opportunity.table.columns.rotting",
    visible: false,
    locked: false,
    width: "w-[80px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "lead_id",
    labelKey: "opportunity.table.columns.lead_id",
    visible: false,
    locked: false,
    width: "w-[140px]",
    defaultVisible: false,
    sortable: false,
  },
];

// Default column order
export const DEFAULT_OPPORTUNITY_COLUMN_ORDER: string[] = [
  // Locked first
  "checkbox",

  // Primary columns
  "company_name",
  "contact",

  // Value columns
  "expected_value",
  "probability_percent",
  "forecast_value",
  "discount_amount",
  "won_value",
  "currency",

  // Pipeline
  "stage",
  "status",
  "days_in_stage",
  "is_rotting",

  // Assignment & Location
  "assigned_to",
  "country_code",

  // Dates
  "expected_close_date",
  "created_at",
  "updated_at",
  "won_date",
  "lost_date",

  // Notes
  "notes",

  // Links
  "lead_id",

  // Locked last
  "actions",
];

// Locked columns that cannot be reordered
export const LOCKED_OPPORTUNITY_COLUMN_KEYS = ["checkbox", "actions"];

// Default column widths in pixels
export const DEFAULT_OPPORTUNITY_COLUMN_WIDTHS: Record<string, number> = {
  // Locked
  checkbox: 40,
  actions: 140,

  // Primary
  company_name: 200,
  contact: 160,

  // Value
  expected_value: 120,
  probability_percent: 100,
  forecast_value: 120,
  discount_amount: 100,
  won_value: 120,
  currency: 80,

  // Pipeline
  stage: 130,
  status: 100,
  days_in_stage: 100,
  is_rotting: 80,

  // Assignment & Location
  assigned_to: 140,
  country_code: 100,

  // Dates
  expected_close_date: 130,
  created_at: 120,
  updated_at: 120,
  won_date: 120,
  lost_date: 120,

  // Notes
  notes: 200,

  // Links
  lead_id: 140,
};

// Helper pour obtenir les clés des colonnes visibles
export function getVisibleOpportunityColumnKeys(
  columns: OpportunityColumnConfig[]
): string[] {
  return columns.filter((c) => c.visible).map((c) => c.key);
}

// Helper pour obtenir les colonnes triables
export function getSortableOpportunityColumns(
  columns: OpportunityColumnConfig[]
): OpportunityColumnConfig[] {
  return columns.filter((c) => c.sortable && c.visible);
}

// Build SORTABLE_COLUMN_MAP dynamically from config
export const SORTABLE_OPPORTUNITY_COLUMN_MAP: Record<string, string> =
  DEFAULT_OPPORTUNITY_COLUMNS.filter((col) => col.sortable).reduce(
    (acc, col) => {
      // Special cases for nested fields
      if (col.key === "contact") {
        acc[col.key] = "lead.last_name";
      } else if (col.key === "company_name") {
        acc[col.key] = "lead.company_name";
      } else if (col.key === "country_code") {
        acc[col.key] = "lead.country_code";
      } else {
        acc[col.key] = col.key;
      }
      return acc;
    },
    {} as Record<string, string>
  );

// ============================================================================
// CSV Export Configuration
// ============================================================================

export interface OpportunityCsvColumnConfig {
  key: string;
  header: string;
  getValue: (
    opp: Opportunity & { days_in_stage?: number; is_rotting?: boolean }
  ) => string;
}

// Helper to format dates for CSV
const formatDate = (dateValue: Date | string | null | undefined): string => {
  if (!dateValue) return "";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return date.toISOString();
};

// Helper to format currency (prefixed with _ as currently unused but kept for future CSV export)
const _formatCurrency = (
  value: number | null,
  currency: string = "EUR"
): string => {
  if (value === null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// CSV column configurations
export const OPPORTUNITY_CSV_COLUMN_CONFIG: Record<
  string,
  OpportunityCsvColumnConfig
> = {
  company_name: {
    key: "company_name",
    header: "Company",
    getValue: (opp) => opp.lead?.company_name || "",
  },
  contact: {
    key: "contact",
    header: "Contact",
    getValue: (opp) =>
      opp.lead ? `${opp.lead.first_name} ${opp.lead.last_name}`.trim() : "",
  },
  expected_value: {
    key: "expected_value",
    header: "Expected Value",
    getValue: (opp) => opp.expected_value?.toString() || "",
  },
  probability_percent: {
    key: "probability_percent",
    header: "Probability (%)",
    getValue: (opp) => opp.probability_percent?.toString() || "",
  },
  forecast_value: {
    key: "forecast_value",
    header: "Forecast Value",
    getValue: (opp) => opp.forecast_value?.toString() || "",
  },
  stage: {
    key: "stage",
    header: "Stage",
    getValue: (opp) => opp.stage || "",
  },
  status: {
    key: "status",
    header: "Status",
    getValue: (opp) => opp.status || "",
  },
  assigned_to: {
    key: "assigned_to",
    header: "Assigned To",
    getValue: (opp) =>
      opp.assignedTo
        ? `${opp.assignedTo.first_name} ${opp.assignedTo.last_name || ""}`.trim()
        : "",
  },
  expected_close_date: {
    key: "expected_close_date",
    header: "Expected Close Date",
    getValue: (opp) => formatDate(opp.expected_close_date),
  },
  days_in_stage: {
    key: "days_in_stage",
    header: "Days in Stage",
    getValue: (opp) => opp.days_in_stage?.toString() || "0",
  },
  country_code: {
    key: "country_code",
    header: "Country",
    getValue: (opp) => opp.lead?.country_code || "",
  },
  created_at: {
    key: "created_at",
    header: "Created At",
    getValue: (opp) => formatDate(opp.created_at),
  },
  updated_at: {
    key: "updated_at",
    header: "Updated At",
    getValue: (opp) => formatDate(opp.updated_at),
  },
  won_date: {
    key: "won_date",
    header: "Won Date",
    getValue: (opp) => formatDate(opp.won_date),
  },
  lost_date: {
    key: "lost_date",
    header: "Lost Date",
    getValue: (opp) => formatDate(opp.lost_date),
  },
  won_value: {
    key: "won_value",
    header: "Won Value",
    getValue: (opp) => opp.won_value?.toString() || "",
  },
  currency: {
    key: "currency",
    header: "Currency",
    getValue: (opp) => opp.currency || "EUR",
  },
  discount_amount: {
    key: "discount_amount",
    header: "Discount",
    getValue: (opp) => opp.discount_amount?.toString() || "",
  },
  notes: {
    key: "notes",
    header: "Notes",
    getValue: (opp) => opp.notes || "",
  },
  is_rotting: {
    key: "is_rotting",
    header: "Rotting",
    getValue: (opp) => (opp.is_rotting ? "Yes" : "No"),
  },
  lead_id: {
    key: "lead_id",
    header: "Lead ID",
    getValue: (opp) => opp.lead_id || "",
  },
};

// Columns to exclude from CSV export (UI-only columns)
export const OPPORTUNITY_CSV_EXCLUDED_COLUMNS = ["checkbox", "actions"];

// Type for translation function
type TranslateFn = (key: string) => string;

// Helper to generate CSV from visible columns with i18n support
export function generateOpportunityCsvContent(
  opportunities: Array<
    Opportunity & { days_in_stage?: number; is_rotting?: boolean }
  >,
  orderedVisibleColumnKeys: string[],
  translateFn?: TranslateFn
): string {
  // Filter to exportable columns, preserving order
  const exportableKeys = orderedVisibleColumnKeys.filter(
    (key) =>
      !OPPORTUNITY_CSV_EXCLUDED_COLUMNS.includes(key) &&
      OPPORTUNITY_CSV_COLUMN_CONFIG[key]
  );

  // Get headers
  const headers = exportableKeys.map((key) => {
    const config = DEFAULT_OPPORTUNITY_COLUMNS.find((c) => c.key === key);
    if (translateFn && config?.labelKey) {
      return translateFn(config.labelKey);
    }
    return OPPORTUNITY_CSV_COLUMN_CONFIG[key].header;
  });

  // Get rows
  const rows = opportunities.map((opp) =>
    exportableKeys.map((key) => {
      const value = OPPORTUNITY_CSV_COLUMN_CONFIG[key].getValue(opp);
      return `"${String(value).replace(/"/g, '""')}"`;
    })
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
