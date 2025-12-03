/**
 * useOpportunityStages - Hook pour charger les opportunity stages dynamiquement
 *
 * Charge les configurations de stages depuis crm_settings via l'API,
 * avec fallback sur valeurs par défaut et cache SWR.
 *
 * @example
 * const { stages, getLabel, getColor, getProbability, isLoading } = useOpportunityStages();
 *
 * @see app/api/v1/crm/settings/[key]/route.ts
 * @see lib/repositories/crm/settings.repository.ts
 */

"use client";

import useSWR from "swr";

// ============================================================
// TYPES
// ============================================================

export interface OpportunityStageConfig {
  value: string;
  label_en: string;
  label_fr: string;
  probability: number;
  max_days: number;
  color: string;
  order: number;
  deal_rotting: boolean;
  is_active: boolean;
}

export interface FinalStageConfig {
  color: string;
  icon: string;
}

export interface RottingConfig {
  enabled: boolean;
  use_stage_max_days: boolean;
  global_max_days: number;
}

interface OpportunityStagesSettingValue {
  stages: OpportunityStageConfig[];
  final_stages: {
    won: FinalStageConfig;
    lost: FinalStageConfig;
  };
  rotting: RottingConfig;
}

interface SettingApiResponse {
  success: boolean;
  data?: {
    id: string;
    setting_key: string;
    setting_value: OpportunityStagesSettingValue;
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

export const DEFAULT_OPPORTUNITY_STAGES: OpportunityStageConfig[] = [
  {
    value: "qualification",
    label_en: "Qualification",
    label_fr: "Qualification",
    probability: 20,
    max_days: 14,
    color: "blue",
    order: 1,
    deal_rotting: true,
    is_active: true,
  },
  {
    value: "demo",
    label_en: "Demo",
    label_fr: "Démo",
    probability: 40,
    max_days: 10,
    color: "purple",
    order: 2,
    deal_rotting: true,
    is_active: true,
  },
  {
    value: "proposal",
    label_en: "Proposal",
    label_fr: "Proposition",
    probability: 60,
    max_days: 14,
    color: "yellow",
    order: 3,
    deal_rotting: true,
    is_active: true,
  },
  {
    value: "negotiation",
    label_en: "Negotiation",
    label_fr: "Négociation",
    probability: 80,
    max_days: 10,
    color: "orange",
    order: 4,
    deal_rotting: true,
    is_active: true,
  },
  {
    value: "contract_sent",
    label_en: "Contract Sent",
    label_fr: "Contrat envoyé",
    probability: 90,
    max_days: 7,
    color: "green",
    order: 5,
    deal_rotting: true,
    is_active: true,
  },
];

export const DEFAULT_FINAL_STAGES: {
  won: FinalStageConfig;
  lost: FinalStageConfig;
} = {
  won: { color: "green", icon: "trophy" },
  lost: { color: "red", icon: "x-circle" },
};

export const DEFAULT_ROTTING: RottingConfig = {
  enabled: true,
  use_stage_max_days: true,
  global_max_days: 30,
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

export function useOpportunityStages() {
  const { data, error, isLoading, mutate } = useSWR<SettingApiResponse>(
    "/api/v1/crm/settings/opportunity_stages",
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
  const stages: OpportunityStageConfig[] =
    data?.success && data?.data?.setting_value?.stages
      ? data.data.setting_value.stages.filter((s) => s.is_active !== false)
      : DEFAULT_OPPORTUNITY_STAGES;

  // Extract final stages config
  const finalStages =
    data?.success && data?.data?.setting_value?.final_stages
      ? data.data.setting_value.final_stages
      : DEFAULT_FINAL_STAGES;

  // Extract rotting config
  const rotting =
    data?.success && data?.data?.setting_value?.rotting
      ? data.data.setting_value.rotting
      : DEFAULT_ROTTING;

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
   * Get Tailwind color class suffix for a stage value
   */
  const getColor = (value: string): string => {
    const stage = stages.find((s) => s.value === value);
    return stage?.color || "gray";
  };

  /**
   * Get probability percentage for a stage value
   */
  const getProbability = (value: string): number => {
    const stage = stages.find((s) => s.value === value);
    return stage?.probability || 0;
  };

  /**
   * Get max days (before rotting) for a stage value
   */
  const getMaxDays = (value: string): number => {
    const stage = stages.find((s) => s.value === value);
    return stage?.max_days || 14;
  };

  /**
   * Get stage config by value
   */
  const getStage = (value: string): OpportunityStageConfig | undefined => {
    return stages.find((s) => s.value === value);
  };

  /**
   * Get next stage in pipeline (by order)
   */
  const getNextStage = (
    currentValue: string
  ): OpportunityStageConfig | undefined => {
    const current = stages.find((s) => s.value === currentValue);
    if (!current) return undefined;
    return sortedStages.find((s) => s.order === current.order + 1);
  };

  /**
   * Get previous stage in pipeline (by order)
   */
  const getPreviousStage = (
    currentValue: string
  ): OpportunityStageConfig | undefined => {
    const current = stages.find((s) => s.value === currentValue);
    if (!current) return undefined;
    return sortedStages.find((s) => s.order === current.order - 1);
  };

  /**
   * Check if stage transition is valid (forward/backward by 1 step or same)
   */
  const isValidTransition = (fromStage: string, toStage: string): boolean => {
    const from = stages.find((s) => s.value === fromStage);
    const to = stages.find((s) => s.value === toStage);

    if (!from || !to) return false;

    // Allow same stage
    if (from.value === to.value) return true;

    // Allow forward or backward by 1 step
    const diff = to.order - from.order;
    return diff === 1 || diff === -1;
  };

  /**
   * Get short label (abbreviation) for a stage value
   */
  const getShortLabel = (value: string): string => {
    const shorts: Record<string, string> = {
      qualification: "Qual",
      demo: "Demo",
      proposal: "Prop",
      negotiation: "Nego",
      contract_sent: "Contract",
    };
    return shorts[value] || value.substring(0, 4).toUpperCase();
  };

  return {
    // Data
    stages: sortedStages,
    finalStages,
    rotting,

    // Helpers
    getLabel,
    getColor,
    getProbability,
    getMaxDays,
    getStage,
    getNextStage,
    getPreviousStage,
    isValidTransition,
    getShortLabel,

    // State
    isLoading,
    error,

    // Actions
    refresh: mutate,
  };
}

export default useOpportunityStages;
