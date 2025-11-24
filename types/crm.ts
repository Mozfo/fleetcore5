/**
 * CRM Types - Basé sur structure API v1
 * Source: GET /api/v1/crm/leads response
 */

export type LeadStatus = "new" | "working" | "qualified" | "lost";
export type LeadStage =
  | "top_of_funnel"
  | "marketing_qualified"
  | "sales_qualified";
export type LeadPriority = "low" | "medium" | "high" | "urgent";
export type FleetSize = "1-10" | "11-50" | "51-100" | "101-500" | "500+";

export interface Lead {
  id: string;
  lead_code: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  phone: string | null;
  country_code: string | null;
  country: {
    country_code: string;
    country_name_en: string;
    flag_emoji: string;
  } | null;
  fleet_size: FleetSize | string | null;
  status: LeadStatus;
  lead_stage: LeadStage;
  priority: LeadPriority | string | null;
  fit_score: number | null;
  engagement_score: number | null;
  qualification_score: number | null;
  assigned_to: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
  created_at: string;
  updated_at: string | null;
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
