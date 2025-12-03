/**
 * useLeadStages - Hook pour charger les lead stages dynamiquement
 *
 * Charge les configurations de stages depuis crm_settings via l'API,
 * avec fallback sur valeurs par défaut et cache SWR.
 *
 * @example
 * const { stages, getLabel, getColor, isLoading } = useLeadStages();
 *
 * @see app/api/v1/crm/settings/[key]/route.ts
 * @see lib/repositories/crm/settings.repository.ts
 */

"use client";

import useSWR from "swr";

// ============================================================
// TYPES
// ============================================================

export interface LeadStageConfig {
  value: string;
  label_en: string;
  label_fr: string;
  color: string;
  order: number;
  is_active: boolean;
}

interface LeadStagesSettingValue {
  stages: LeadStageConfig[];
  transitions: Record<string, string[]>;
  default_stage: string;
}

interface SettingApiResponse {
  success: boolean;
  data?: {
    id: string;
    setting_key: string;
    setting_value: LeadStagesSettingValue;
    version: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================
// DEFAULTS (fallback si API indisponible)
// ============================================================

export const DEFAULT_LEAD_STAGES: LeadStageConfig[] = [
  {
    value: "top_of_funnel",
    label_en: "Top of Funnel",
    label_fr: "Haut de l'entonnoir",
    color: "#9CA3AF",
    order: 1,
    is_active: true,
  },
  {
    value: "marketing_qualified",
    label_en: "Marketing Qualified",
    label_fr: "Qualifié Marketing",
    color: "#3B82F6",
    order: 2,
    is_active: true,
  },
  {
    value: "sales_qualified",
    label_en: "Sales Qualified",
    label_fr: "Qualifié Ventes",
    color: "#22C55E",
    order: 3,
    is_active: true,
  },
  {
    value: "opportunity",
    label_en: "Opportunity",
    label_fr: "Opportunité",
    color: "#A855F7",
    order: 4,
    is_active: true,
  },
];

export const DEFAULT_TRANSITIONS: Record<string, string[]> = {
  top_of_funnel: ["marketing_qualified"],
  marketing_qualified: ["sales_qualified", "top_of_funnel"],
  sales_qualified: ["opportunity", "marketing_qualified"],
  opportunity: ["sales_qualified"],
};

// ============================================================
// FETCHER
// ============================================================

const fetcher = async (url: string): Promise<SettingApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json();
};

// ============================================================
// HOOK
// ============================================================

export function useLeadStages() {
  const { data, error, isLoading, mutate } = useSWR<SettingApiResponse>(
    "/api/v1/crm/settings/lead_stages",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute cache
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
    }
  );

  // Extract stages from API response or use defaults
  // IMPORTANT: Use `!== false` instead of truthy check because some stages
  // may not have is_active field defined (defaults to true)
  const stages: LeadStageConfig[] =
    data?.success && data?.data?.setting_value?.stages
      ? data.data.setting_value.stages.filter((s) => s.is_active !== false)
      : DEFAULT_LEAD_STAGES;

  // Extract transitions from API response or use defaults
  const transitions: Record<string, string[]> =
    data?.success && data?.data?.setting_value?.transitions
      ? data.data.setting_value.transitions
      : DEFAULT_TRANSITIONS;

  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  /**
   * Get localized label for a stage value
   */
  const getLabel = (value: string, locale: string = "en"): string => {
    const stage = stages.find((s) => s.value === value);
    if (!stage) return value;
    return locale === "fr" ? stage.label_fr : stage.label_en;
  };

  /**
   * Get color hex for a stage value
   */
  const getColor = (value: string): string => {
    const stage = stages.find((s) => s.value === value);
    return stage?.color || "#9CA3AF";
  };

  /**
   * Get short label (abbreviation) for a stage value
   */
  const getShortLabel = (value: string): string => {
    // Common abbreviations
    const shorts: Record<string, string> = {
      top_of_funnel: "ToF",
      marketing_qualified: "MQL",
      sales_qualified: "SQL",
      opportunity: "Opp",
    };
    return shorts[value] || value.substring(0, 3).toUpperCase();
  };

  /**
   * Get available transitions from a stage
   */
  const getTransitions = (fromStage: string): string[] => {
    return transitions[fromStage] || [];
  };

  /**
   * Check if transition is allowed
   */
  const canTransition = (fromStage: string, toStage: string): boolean => {
    const allowed = transitions[fromStage] || [];
    return allowed.includes(toStage);
  };

  /**
   * Get next stage in order (for progression)
   */
  const getNextStage = (currentStage: string): string | null => {
    const currentIndex = sortedStages.findIndex(
      (s) => s.value === currentStage
    );
    if (currentIndex === -1 || currentIndex === sortedStages.length - 1) {
      return null;
    }
    return sortedStages[currentIndex + 1].value;
  };

  /**
   * Get stage by value
   */
  const getStage = (value: string): LeadStageConfig | undefined => {
    return stages.find((s) => s.value === value);
  };

  return {
    // Data
    stages: sortedStages,
    transitions,

    // Helpers
    getLabel,
    getColor,
    getShortLabel,
    getTransitions,
    canTransition,
    getNextStage,
    getStage,

    // State
    isLoading,
    error,

    // Actions
    refresh: mutate,
  };
}

export default useLeadStages;
