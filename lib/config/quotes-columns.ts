/**
 * Configuration des colonnes pour la table de quotes
 * Basé sur opportunity-columns.ts - même pattern pour cohérence UX
 */

import type { Quote } from "@/lib/repositories/crm/quote.repository";

export interface QuoteColumnConfig {
  key: string;
  labelKey: string; // i18n key (quotes.table.columns.xxx)
  visible: boolean;
  locked?: boolean; // true = non masquable (toujours visible)
  width: string;
  defaultVisible: boolean;
  sortable?: boolean;
}

export const DEFAULT_QUOTE_COLUMNS: QuoteColumnConfig[] = [
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
  // Quote reference is PRIMARY column
  {
    key: "quote_reference",
    labelKey: "quotes.table.columns.reference",
    visible: true,
    locked: true,
    width: "w-[160px]",
    defaultVisible: true,
    sortable: true,
  },
  // Actions always visible
  {
    key: "actions",
    labelKey: "quotes.table.columns.actions",
    visible: true,
    locked: true,
    width: "w-[140px]",
    defaultVisible: true,
    sortable: false,
  },

  // Colonnes visibles par défaut (toggleables)
  {
    key: "company_name",
    labelKey: "quotes.table.columns.company",
    visible: true,
    locked: false,
    width: "w-[180px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "total_value",
    labelKey: "quotes.table.columns.total_value",
    visible: true,
    locked: false,
    width: "w-[120px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "status",
    labelKey: "quotes.table.columns.status",
    visible: true,
    locked: false,
    width: "w-[100px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "valid_until",
    labelKey: "quotes.table.columns.valid_until",
    visible: true,
    locked: false,
    width: "w-[120px]",
    defaultVisible: true,
    sortable: true,
  },
  {
    key: "created_at",
    labelKey: "quotes.table.columns.created_at",
    visible: true,
    locked: false,
    width: "w-[120px]",
    defaultVisible: true,
    sortable: true,
  },

  // Colonnes masquées par défaut
  {
    key: "quote_code",
    labelKey: "quotes.table.columns.code",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "quote_version",
    labelKey: "quotes.table.columns.version",
    visible: false,
    locked: false,
    width: "w-[80px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "currency",
    labelKey: "quotes.table.columns.currency",
    visible: false,
    locked: false,
    width: "w-[80px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "subtotal",
    labelKey: "quotes.table.columns.subtotal",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "monthly_recurring_value",
    labelKey: "quotes.table.columns.monthly",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "annual_recurring_value",
    labelKey: "quotes.table.columns.annual",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "discount_type",
    labelKey: "quotes.table.columns.discount_type",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "discount_value",
    labelKey: "quotes.table.columns.discount_value",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "tax_rate",
    labelKey: "quotes.table.columns.tax_rate",
    visible: false,
    locked: false,
    width: "w-[80px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "billing_cycle",
    labelKey: "quotes.table.columns.billing_cycle",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: false,
  },
  {
    key: "contract_duration_months",
    labelKey: "quotes.table.columns.duration",
    visible: false,
    locked: false,
    width: "w-[100px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "valid_from",
    labelKey: "quotes.table.columns.valid_from",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "sent_at",
    labelKey: "quotes.table.columns.sent_at",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "accepted_at",
    labelKey: "quotes.table.columns.accepted_at",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "view_count",
    labelKey: "quotes.table.columns.views",
    visible: false,
    locked: false,
    width: "w-[80px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "updated_at",
    labelKey: "quotes.table.columns.updated_at",
    visible: false,
    locked: false,
    width: "w-[120px]",
    defaultVisible: false,
    sortable: true,
  },
  {
    key: "opportunity_id",
    labelKey: "quotes.table.columns.opportunity",
    visible: false,
    locked: false,
    width: "w-[140px]",
    defaultVisible: false,
    sortable: false,
  },
];

// Default column order
export const DEFAULT_QUOTE_COLUMN_ORDER: string[] = [
  // Locked first
  "checkbox",

  // Primary columns
  "quote_reference",
  "quote_code",
  "quote_version",
  "company_name",

  // Value columns
  "total_value",
  "subtotal",
  "monthly_recurring_value",
  "annual_recurring_value",
  "currency",

  // Discount & Tax
  "discount_type",
  "discount_value",
  "tax_rate",

  // Status & Pipeline
  "status",
  "billing_cycle",
  "contract_duration_months",

  // Dates
  "valid_from",
  "valid_until",
  "sent_at",
  "accepted_at",
  "created_at",
  "updated_at",

  // Metrics
  "view_count",

  // Links
  "opportunity_id",

  // Locked last
  "actions",
];

// Locked columns that cannot be reordered
export const LOCKED_QUOTE_COLUMN_KEYS = ["checkbox", "actions"];

// Default column widths in pixels
export const DEFAULT_QUOTE_COLUMN_WIDTHS: Record<string, number> = {
  // Locked
  checkbox: 40,
  actions: 140,

  // Primary
  quote_reference: 160,
  quote_code: 100,
  quote_version: 80,
  company_name: 180,

  // Value
  total_value: 120,
  subtotal: 120,
  monthly_recurring_value: 120,
  annual_recurring_value: 120,
  currency: 80,

  // Discount & Tax
  discount_type: 100,
  discount_value: 100,
  tax_rate: 80,

  // Status & Pipeline
  status: 100,
  billing_cycle: 100,
  contract_duration_months: 100,

  // Dates
  valid_from: 120,
  valid_until: 120,
  sent_at: 120,
  accepted_at: 120,
  created_at: 120,
  updated_at: 120,

  // Metrics
  view_count: 80,

  // Links
  opportunity_id: 140,
};

// Helper pour obtenir les clés des colonnes visibles
export function getVisibleQuoteColumnKeys(
  columns: QuoteColumnConfig[]
): string[] {
  return columns.filter((c) => c.visible).map((c) => c.key);
}

// Helper pour obtenir les colonnes triables
export function getSortableQuoteColumns(
  columns: QuoteColumnConfig[]
): QuoteColumnConfig[] {
  return columns.filter((c) => c.sortable && c.visible);
}

// Build SORTABLE_COLUMN_MAP dynamically from config
export const SORTABLE_QUOTE_COLUMN_MAP: Record<string, string> =
  DEFAULT_QUOTE_COLUMNS.filter((col) => col.sortable).reduce(
    (acc, col) => {
      // Special cases for nested fields
      if (col.key === "company_name") {
        acc[col.key] = "crm_opportunities.crm_leads.company_name";
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

export interface QuoteCsvColumnConfig {
  key: string;
  header: string;
  getValue: (quote: Quote) => string;
}

// Helper to format dates for CSV
const formatDate = (dateValue: Date | string | null | undefined): string => {
  if (!dateValue) return "";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return date.toISOString();
};

// Helper to format currency for CSV export
// Accepts Prisma Decimal | number | null and converts to formatted string
const formatCurrencyForCsv = (
  value: { toNumber?: () => number } | number | null | undefined,
  currency: string = "EUR"
): string => {
  if (value === null || value === undefined) return "";
  // Handle Prisma Decimal objects (have toNumber method) or plain numbers
  const numValue =
    typeof value === "object" && value.toNumber
      ? value.toNumber()
      : Number(value);
  if (isNaN(numValue)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

// CSV column configurations
export const QUOTE_CSV_COLUMN_CONFIG: Record<string, QuoteCsvColumnConfig> = {
  quote_reference: {
    key: "quote_reference",
    header: "Reference",
    getValue: (quote) => quote.quote_reference || "",
  },
  quote_code: {
    key: "quote_code",
    header: "Code",
    getValue: (quote) => quote.quote_code || "",
  },
  quote_version: {
    key: "quote_version",
    header: "Version",
    getValue: (quote) => quote.quote_version?.toString() || "1",
  },
  company_name: {
    key: "company_name",
    header: "Company",
    getValue: () => "", // Will be filled from opportunity relation
  },
  total_value: {
    key: "total_value",
    header: "Total Value",
    getValue: (quote) =>
      formatCurrencyForCsv(quote.total_value, quote.currency || "EUR"),
  },
  subtotal: {
    key: "subtotal",
    header: "Subtotal",
    getValue: (quote) =>
      formatCurrencyForCsv(quote.subtotal, quote.currency || "EUR"),
  },
  monthly_recurring_value: {
    key: "monthly_recurring_value",
    header: "Monthly Recurring",
    getValue: (quote) =>
      formatCurrencyForCsv(
        quote.monthly_recurring_value,
        quote.currency || "EUR"
      ),
  },
  annual_recurring_value: {
    key: "annual_recurring_value",
    header: "Annual Recurring",
    getValue: (quote) =>
      formatCurrencyForCsv(
        quote.annual_recurring_value,
        quote.currency || "EUR"
      ),
  },
  currency: {
    key: "currency",
    header: "Currency",
    getValue: (quote) => quote.currency || "EUR",
  },
  status: {
    key: "status",
    header: "Status",
    getValue: (quote) => quote.status || "",
  },
  discount_type: {
    key: "discount_type",
    header: "Discount Type",
    getValue: (quote) => quote.discount_type || "",
  },
  discount_value: {
    key: "discount_value",
    header: "Discount Value",
    getValue: (quote) => quote.discount_value?.toString() || "",
  },
  tax_rate: {
    key: "tax_rate",
    header: "Tax Rate",
    getValue: (quote) =>
      quote.tax_rate ? `${quote.tax_rate.toString()}%` : "",
  },
  billing_cycle: {
    key: "billing_cycle",
    header: "Billing Cycle",
    getValue: (quote) => quote.billing_cycle || "",
  },
  contract_duration_months: {
    key: "contract_duration_months",
    header: "Contract Duration (months)",
    getValue: (quote) => quote.contract_duration_months?.toString() || "",
  },
  valid_from: {
    key: "valid_from",
    header: "Valid From",
    getValue: (quote) => formatDate(quote.valid_from),
  },
  valid_until: {
    key: "valid_until",
    header: "Valid Until",
    getValue: (quote) => formatDate(quote.valid_until),
  },
  sent_at: {
    key: "sent_at",
    header: "Sent At",
    getValue: (quote) => formatDate(quote.sent_at),
  },
  accepted_at: {
    key: "accepted_at",
    header: "Accepted At",
    getValue: (quote) => formatDate(quote.accepted_at),
  },
  created_at: {
    key: "created_at",
    header: "Created At",
    getValue: (quote) => formatDate(quote.created_at),
  },
  updated_at: {
    key: "updated_at",
    header: "Updated At",
    getValue: (quote) => formatDate(quote.updated_at),
  },
  view_count: {
    key: "view_count",
    header: "View Count",
    getValue: (quote) => quote.view_count?.toString() || "0",
  },
  opportunity_id: {
    key: "opportunity_id",
    header: "Opportunity ID",
    getValue: (quote) => quote.opportunity_id || "",
  },
};

// Columns to exclude from CSV export (UI-only columns)
export const QUOTE_CSV_EXCLUDED_COLUMNS = ["checkbox", "actions"];

// Type for translation function
type TranslateFn = (key: string) => string;

// Helper to generate CSV from visible columns with i18n support
export function generateQuoteCsvContent(
  quotes: Quote[],
  orderedVisibleColumnKeys: string[],
  translateFn?: TranslateFn
): string {
  // Filter to exportable columns, preserving order
  const exportableKeys = orderedVisibleColumnKeys.filter(
    (key) =>
      !QUOTE_CSV_EXCLUDED_COLUMNS.includes(key) && QUOTE_CSV_COLUMN_CONFIG[key]
  );

  // Get headers
  const headers = exportableKeys.map((key) => {
    const config = DEFAULT_QUOTE_COLUMNS.find((c) => c.key === key);
    if (translateFn && config?.labelKey) {
      return translateFn(config.labelKey);
    }
    return QUOTE_CSV_COLUMN_CONFIG[key].header;
  });

  // Get rows
  const rows = quotes.map((quote) =>
    exportableKeys.map((key) => {
      const value = QUOTE_CSV_COLUMN_CONFIG[key].getValue(quote);
      return `"${String(value).replace(/"/g, '""')}"`;
    })
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
