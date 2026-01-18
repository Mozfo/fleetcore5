/**
 * Configuration des filtres avancés pour les leads
 * Best Practices: DevExpress FilterBuilder + React Query Builder + Syncfusion
 * @see https://react-querybuilder.js.org/
 * @see https://js.devexpress.com/React/Documentation/Guide/UI_Components/FilterBuilder/Overview/
 */

// Types pour les opérateurs de filtre
export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equals"
  | "less_than_or_equals"
  | "between"
  | "is_empty"
  | "is_not_empty"
  | "in"
  | "not_in";

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "multi_select"
  | "boolean";

export type LogicOperator = "AND" | "OR";

// Structure d'une condition de filtre (Best Practice: DevExpress)
export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  // Pour opérateur "between"
  valueTo?: unknown;
}

// Structure d'un groupe de filtres avec support nested (Best Practice: React Query Builder)
export interface FilterGroup {
  id: string;
  logic: LogicOperator;
  conditions: FilterCondition[];
  groups: FilterGroup[]; // Nested groups for complex queries
}

// Configuration d'un champ filtrable
export interface FilterableField {
  key: string;
  labelKey: string; // i18n key
  type: FieldType;
  options?: string; // Reference to options list (countries, statuses, etc.)
}

// Opérateurs disponibles par type de champ (Best Practice: Syncfusion)
export const OPERATORS_BY_TYPE: Record<FieldType, FilterOperator[]> = {
  text: [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "is_empty",
    "is_not_empty",
  ],
  number: [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "greater_than_or_equals",
    "less_than_or_equals",
    "between",
    "is_empty",
    "is_not_empty",
  ],
  date: [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "between",
    "is_empty",
    "is_not_empty",
  ],
  select: ["equals", "not_equals", "is_empty", "is_not_empty"],
  multi_select: ["in", "not_in", "is_empty", "is_not_empty"],
  boolean: ["equals"], // V6.2.1: Boolean fields only support equals (true/false)
};

// Labels i18n pour les opérateurs
export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: "leads.filters.operators.equals",
  not_equals: "leads.filters.operators.not_equals",
  contains: "leads.filters.operators.contains",
  not_contains: "leads.filters.operators.not_contains",
  starts_with: "leads.filters.operators.starts_with",
  ends_with: "leads.filters.operators.ends_with",
  greater_than: "leads.filters.operators.greater_than",
  less_than: "leads.filters.operators.less_than",
  greater_than_or_equals: "leads.filters.operators.greater_than_or_equals",
  less_than_or_equals: "leads.filters.operators.less_than_or_equals",
  between: "leads.filters.operators.between",
  is_empty: "leads.filters.operators.is_empty",
  is_not_empty: "leads.filters.operators.is_not_empty",
  in: "leads.filters.operators.in",
  not_in: "leads.filters.operators.not_in",
};

// Champs filtrables pour les leads
export const LEADS_FILTERABLE_FIELDS: FilterableField[] = [
  {
    key: "last_name",
    labelKey: "leads.filters.fields.last_name",
    type: "text",
  },
  {
    key: "first_name",
    labelKey: "leads.filters.fields.first_name",
    type: "text",
  },
  { key: "email", labelKey: "leads.filters.fields.email", type: "text" },
  {
    key: "company_name",
    labelKey: "leads.filters.fields.company",
    type: "text",
  },
  { key: "phone", labelKey: "leads.filters.fields.phone", type: "text" },
  {
    key: "country_code",
    labelKey: "leads.filters.fields.country",
    type: "select",
    options: "countries",
  },
  {
    key: "status",
    labelKey: "leads.filters.fields.status",
    type: "select",
    options: "statuses",
  },
  {
    key: "lead_stage",
    labelKey: "leads.filters.fields.stage",
    type: "select",
    options: "stages",
  },
  {
    key: "priority",
    labelKey: "leads.filters.fields.priority",
    type: "select",
    options: "priorities",
  },
  {
    key: "qualification_score",
    labelKey: "leads.filters.fields.qualification_score",
    type: "number",
  },
  {
    key: "fit_score",
    labelKey: "leads.filters.fields.fit_score",
    type: "number",
  },
  {
    key: "engagement_score",
    labelKey: "leads.filters.fields.engagement_score",
    type: "number",
  },
  {
    key: "fleet_size",
    labelKey: "leads.filters.fields.fleet_size",
    type: "select",
    options: "fleet_sizes",
  },
  {
    key: "created_at",
    labelKey: "leads.filters.fields.created_at",
    type: "date",
  },
  // V6.2.1: New booking/wizard filters
  {
    key: "has_booking",
    labelKey: "leads.filters.fields.has_booking",
    type: "boolean",
  },
  {
    key: "wizard_completed",
    labelKey: "leads.filters.fields.wizard_completed",
    type: "boolean",
  },
  {
    key: "booking_slot_at",
    labelKey: "leads.filters.fields.booking_date",
    type: "date",
  },
];

// Options statiques pour les selects (V6.3: 8 statuts)
export const STATIC_OPTIONS = {
  statuses: [
    { value: "new", labelKey: "leads.statuses.new" },
    { value: "demo", labelKey: "leads.statuses.demo" },
    { value: "proposal_sent", labelKey: "leads.statuses.proposal_sent" },
    { value: "payment_pending", labelKey: "leads.statuses.payment_pending" },
    { value: "converted", labelKey: "leads.statuses.converted" },
    { value: "lost", labelKey: "leads.statuses.lost" },
    { value: "nurturing", labelKey: "leads.statuses.nurturing" },
    { value: "disqualified", labelKey: "leads.statuses.disqualified" },
  ],
  stages: [
    { value: "top_of_funnel", labelKey: "leads.card.stage.top_of_funnel" },
    {
      value: "marketing_qualified",
      labelKey: "leads.card.stage.marketing_qualified",
    },
    { value: "sales_qualified", labelKey: "leads.card.stage.sales_qualified" },
  ],
  priorities: [
    { value: "low", labelKey: "leads.card.priority.low" },
    { value: "medium", labelKey: "leads.card.priority.medium" },
    { value: "high", labelKey: "leads.card.priority.high" },
    { value: "urgent", labelKey: "leads.card.priority.urgent" },
  ],
  fleet_sizes: [
    { value: "1-10", labelKey: "1-10" },
    { value: "11-50", labelKey: "11-50" },
    { value: "51-100", labelKey: "51-100" },
    { value: "101-500", labelKey: "101-500" },
    { value: "500+", labelKey: "500+" },
  ],
};

// Helper: créer une condition vide
export function createEmptyCondition(): FilterCondition {
  return {
    id: crypto.randomUUID(),
    field: LEADS_FILTERABLE_FIELDS[0].key,
    operator: "equals",
    value: "",
  };
}

// Helper: créer un groupe vide
export function createEmptyGroup(logic: LogicOperator = "AND"): FilterGroup {
  return {
    id: crypto.randomUUID(),
    logic,
    conditions: [createEmptyCondition()],
    groups: [],
  };
}

// Helper: obtenir le type d'un champ
export function getFieldType(fieldKey: string): FieldType {
  const field = LEADS_FILTERABLE_FIELDS.find((f) => f.key === fieldKey);
  return field?.type ?? "text";
}

// Helper: obtenir les opérateurs pour un champ
export function getOperatorsForField(fieldKey: string): FilterOperator[] {
  const type = getFieldType(fieldKey);
  return OPERATORS_BY_TYPE[type];
}

// Helper: vérifier si l'opérateur nécessite une valeur
export function operatorRequiresValue(operator: FilterOperator): boolean {
  return !["is_empty", "is_not_empty"].includes(operator);
}

// Helper: vérifier si l'opérateur nécessite deux valeurs (between)
export function operatorRequiresTwoValues(operator: FilterOperator): boolean {
  return operator === "between";
}
