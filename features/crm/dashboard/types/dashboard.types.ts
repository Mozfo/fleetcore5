export interface DashboardData {
  summary: {
    total: number;
    total_trend: number;
    by_status: Record<string, number>;
    by_stage: Record<string, number>;
    cold_leads: number;
    cold_threshold_months: number;
  };
  conversion: {
    rate: number;
    rate_previous: number;
    trend: number;
    avg_days_to_qualification: number;
    qualified_this_period: number;
    qualified_previous_period: number;
    converted_this_period: number;
    converted_previous_period: number;
  };
  quality: {
    avg_fit_score: number;
    avg_engagement_score: number;
    avg_qualification_score: number;
  };
  charts: {
    time_series: Array<{ week: string; count: number }>;
    status_distribution: Array<{ status: string; count: number }>;
    sources: Array<{ source: string; count: number }>;
  };
  period: {
    start: string;
    end: string;
    previous_start: string;
    previous_end: string;
  };
  my_leads: { total: number; active: number };
  active_leads: number;
}

export interface TargetCardProps {
  conversionRate: number;
  targetRate: number;
  qualifiedThisPeriod: number;
}

export interface TotalLeadsCardProps {
  total: number;
  trend: number;
}

export interface ConversionRateCardProps {
  rate: number;
  trend: number;
  qualified: number;
}

export interface PipelineValueCardProps {
  activeLeads: number;
  byStatus: Record<string, number>;
}

export interface AvgScoreCardProps {
  avgQualificationScore: number;
  avgFitScore: number;
  avgEngagementScore: number;
}

export interface TimeToConvertCardProps {
  avgDays: number;
}

export interface LeadBySourceCardProps {
  sources: Array<{ source: string; count: number }>;
}

export interface SalesPipelineCardProps {
  byStatus: Record<string, number>;
}

export interface LeadsOverTimeCardProps {
  timeSeries: Array<{ week: string; count: number }>;
}

export interface TopSourcesCardProps {
  sources: Array<{ source: string; count: number }>;
}
