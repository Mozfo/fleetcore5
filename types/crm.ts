/**
 * CRM Types - Basé sur schema crm_leads complet
 * Tous les champs de la base de données sont inclus
 */

// LeadStatus is now dynamic - configured via crm_settings (lead_status_workflow)
// Default values for type hints only (actual statuses loaded from API)
export type LeadStatus = string;
export type LeadStatusExtended = string;

// Pre-defined status values for convenience (can be extended via settings)
export const LEAD_STATUS_VALUES = [
  "new",
  "contacted",
  "working",
  "qualified",
  "disqualified",
  "converted",
  "lost",
] as const;

// Re-export LeadStatusConfig from hook for convenience
export type { LeadStatusConfig } from "@/lib/hooks/useLeadStatuses";

// LeadStage is now dynamic - configured via crm_settings
// Default values for type hints only (actual stages loaded from API)
export type LeadStage = string;

// Pre-defined stage values for convenience (can be extended via settings)
export const LEAD_STAGE_VALUES = [
  "top_of_funnel",
  "marketing_qualified",
  "sales_qualified",
  "opportunity",
] as const;

// Re-export LeadStageConfig from hook for convenience
export type { LeadStageConfig } from "@/lib/hooks/useLeadStages";

export type LeadPriority = "low" | "medium" | "high" | "urgent";
export type LeadSource = "web" | "referral" | "event";

// FleetSize is now dynamic - configured via crm_settings (fleet_size_options)
export type FleetSize = string;

// Pre-defined fleet size values for convenience (can be extended via settings)
export const FLEET_SIZE_VALUES = [
  "1-10",
  "11-50",
  "51-100",
  "101-500",
  "500+",
] as const;

// Re-export FleetSizeOption from hook for convenience
export type { FleetSizeOption } from "@/lib/hooks/useFleetSizeOptions";

export interface Lead {
  // Core identifiers
  id: string;
  lead_code: string | null;

  // Contact information
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;

  // Company information
  company_name: string | null;
  industry: string | null;
  company_size: number | null;
  fleet_size: FleetSize | string | null;
  current_software: string | null;
  website_url: string | null;
  linkedin_url: string | null;

  // Location
  country_code: string | null;
  country: {
    country_code: string;
    country_name_en: string;
    flag_emoji: string;
    country_gdpr?: boolean;
  } | null;
  city: string | null;

  // Status & Stage
  status: LeadStatus;
  lead_stage: LeadStage | null;
  priority: LeadPriority | string | null;

  // Scoring
  fit_score: number | null;
  engagement_score: number | null;
  qualification_score: number | null;
  scoring: Record<string, unknown> | null; // JSONB scoring details

  // Source & Attribution
  source: LeadSource | string | null;
  source_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;

  // Message & Notes
  message: string | null;
  qualification_notes: string | null;

  // Assignment
  assigned_to: {
    id: string;
    first_name: string;
    last_name: string | null;
    email?: string;
  } | null;
  assigned_to_id?: string | null;

  // GDPR
  gdpr_consent: boolean | null;
  consent_at: Date | string | null;
  consent_ip: string | null;

  // Dates
  created_at: string;
  updated_at: string | null;
  qualified_date: Date | string | null;
  converted_date: Date | string | null;
  next_action_date: Date | string | null;

  // Opportunity link
  opportunity_id: string | null;

  // Metadata
  metadata: Record<string, unknown> | null;

  // Audit (soft delete)
  deleted_at?: Date | string | null;
  deleted_by?: string | null;
  deletion_reason?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface LeadsApiResponse {
  success: true;
  data: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface KanbanColumn {
  id: LeadStatus;
  title: string;
  color: string;
  leads: Lead[];
  count: number;
}

export interface FilterState {
  status?: LeadStatus;
  lead_stage?: LeadStage;
  assigned_to?: string;
  country_code?: string;
  min_score?: number;
  search?: string;
}

export interface StatCard {
  label: string;
  value: number;
  change?: {
    value: number;
    label: string;
    positive: boolean;
  };
}

// ============================================================
// OPPORTUNITY TYPES
// ============================================================

// OpportunityStatus is now dynamic - configured via crm_settings (opportunity_status_types)
// Default values for type hints only (actual statuses loaded from API)
export type OpportunityStatus = string;

// Pre-defined status values for convenience (can be extended via settings)
export const OPPORTUNITY_STATUS_VALUES = [
  "open",
  "won",
  "lost",
  "on_hold",
  "cancelled",
] as const;

// Re-export OpportunityStatusConfig from hook for convenience
export type { OpportunityStatusConfig } from "@/lib/hooks/useOpportunityStatuses";

// OpportunityStage is now dynamic - configured via crm_settings
// Default values for type hints only (actual stages loaded from API)
export type OpportunityStage = string;

// Pre-defined stage values for convenience (can be extended via settings)
export const OPPORTUNITY_STAGE_VALUES = [
  "qualification",
  "demo",
  "proposal",
  "negotiation",
  "contract_sent",
] as const;

// Re-export OpportunityStageConfig from hook for convenience
export type { OpportunityStageConfig } from "@/lib/hooks/useOpportunityStages";

/**
 * Opportunity interface - matches crm_opportunities table
 */
export interface Opportunity {
  // Core identifiers
  id: string;
  lead_id: string;

  // Pipeline stage & status
  stage: OpportunityStage;
  status: OpportunityStatus;

  // Value & Probability
  expected_value: number | null; // Decimal in DB
  probability_percent: number | null; // 0-100
  forecast_value: number | null; // expected_value * probability_percent
  won_value: number | null;
  currency: string | null; // Default: EUR

  // Discount
  discount_amount: number | null;

  // Dates
  close_date: string | null;
  expected_close_date: string | null;
  won_date: string | null;
  lost_date: string | null;
  created_at: string;
  updated_at: string | null;

  // Stage tracking (for deal rotting)
  stage_entered_at: string;
  max_days_in_stage: number | null; // Default: 14

  // Assignments
  assigned_to: string | null;
  owner_id: string | null;

  // Related entities
  pipeline_id: string | null;
  plan_id: string | null;
  contract_id: string | null;
  loss_reason: string | null; // Key from crm_settings.opportunity_loss_reasons

  // Notes & metadata
  notes: string | null;
  metadata: Record<string, unknown>;

  // Audit (soft delete)
  deleted_at?: string | null;
  deleted_by?: string | null;
  deletion_reason?: string | null;
  created_by?: string | null;
  updated_by?: string | null;

  // Relations (populated via include)
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    company_name: string | null;
    country_code: string | null;
    country?: {
      country_code: string;
      country_name_en: string;
      flag_emoji: string;
    } | null;
  };
  assignedTo?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email?: string;
  } | null;
  lossReason?: {
    id: string;
    name: string;
    category: string | null;
  } | null;
}

/**
 * Opportunity API response with pagination
 */
export interface OpportunitiesApiResponse {
  success: true;
  data: Opportunity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: OpportunityStats;
}

/**
 * Opportunity stats for dashboard/reports
 */
export interface OpportunityStats {
  total: number;
  totalValue: number;
  weightedValue: number; // Sum of forecast_value
  byStage: Record<string, { count: number; value: number }>;
  byStatus: Record<OpportunityStatus, { count: number; value: number }>;
  avgDaysInStage: number;
  rottingCount: number; // Opportunities exceeding max_days_in_stage
}

/**
 * Kanban column for Opportunities (by stage)
 */
export interface OpportunityKanbanColumn {
  id: OpportunityStage;
  title: string;
  color: string;
  opportunities: Opportunity[];
  count: number;
  totalValue: number;
  weightedValue: number;
}

/**
 * Opportunity filter state
 */
export interface OpportunityFilterState {
  stage?: OpportunityStage;
  status?: OpportunityStatus;
  assigned_to?: string;
  min_value?: number;
  max_value?: number;
  close_date_from?: string;
  close_date_to?: string;
  is_rotting?: boolean;
  search?: string;
}
