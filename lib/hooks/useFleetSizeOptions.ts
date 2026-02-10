/**
 * useFleetSizeOptions - Hook pour charger les options de taille de flotte dynamiquement
 *
 * Charge les configurations depuis crm_settings via l'API,
 * avec fallback sur valeurs par défaut et cache SWR.
 *
 * @example
 * const { options, getLabel, getFitScoreWeight, isLoading } = useFleetSizeOptions();
 *
 * @see app/api/v1/crm/settings/[key]/route.ts
 */

"use client";

import useSWR from "swr";

// ============================================================
// TYPES
// ============================================================

export interface FleetSizeOption {
  value: string;
  label_en: string;
  label_fr: string;
  label_ar?: string;
  order: number;
  fit_score_weight: number;
  is_active?: boolean;
}

interface FleetSizeSettingValue {
  default: string;
  options: FleetSizeOption[];
}

interface SettingApiResponse {
  success: boolean;
  data?: {
    id: string;
    setting_key: string;
    setting_value: FleetSizeSettingValue;
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

// Aligned with wizard Step 3 (source of truth): 3 options
export const DEFAULT_FLEET_SIZE_OPTIONS: FleetSizeOption[] = [
  {
    value: "2-10",
    label_en: "2-10 vehicles",
    label_fr: "2-10 véhicules",
    order: 1,
    fit_score_weight: 20,
    is_active: true,
  },
  {
    value: "11-50",
    label_en: "11-50 vehicles",
    label_fr: "11-50 véhicules",
    order: 2,
    fit_score_weight: 50,
    is_active: true,
  },
  {
    value: "50+",
    label_en: "50+ vehicles",
    label_fr: "50+ véhicules",
    order: 3,
    fit_score_weight: 100,
    is_active: true,
  },
];

export const DEFAULT_FLEET_SIZE = "2-10";

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

export function useFleetSizeOptions() {
  const { data, error, isLoading, mutate } = useSWR<SettingApiResponse>(
    "/api/v1/crm/settings/fleet_size_options",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute cache
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
    }
  );

  // Extract options from API response or use defaults
  // IMPORTANT: Use `!== false` instead of truthy check because some options
  // may not have is_active field defined (defaults to true)
  const options: FleetSizeOption[] =
    data?.success && data?.data?.setting_value?.options
      ? data.data.setting_value.options.filter((o) => o.is_active !== false)
      : DEFAULT_FLEET_SIZE_OPTIONS;

  // Get default value
  const defaultValue =
    data?.success && data?.data?.setting_value?.default
      ? data.data.setting_value.default
      : DEFAULT_FLEET_SIZE;

  // Sort options by order
  const sortedOptions = [...options].sort((a, b) => a.order - b.order);

  /**
   * Get localized label for a fleet size value
   */
  const getLabel = (value: string, locale: string = "en"): string => {
    const option = options.find((o) => o.value === value);
    if (!option) return value;
    if (locale === "fr") return option.label_fr;
    if (locale === "ar") return option.label_ar || option.label_en;
    return option.label_en;
  };

  /**
   * Get fit score weight for a fleet size value (used in lead scoring)
   */
  const getFitScoreWeight = (value: string): number => {
    const option = options.find((o) => o.value === value);
    return option?.fit_score_weight || 0;
  };

  /**
   * Get option by value
   */
  const getOption = (value: string): FleetSizeOption | undefined => {
    return options.find((o) => o.value === value);
  };

  /**
   * Get all values as array (for Zod enum validation)
   */
  const getValues = (): string[] => {
    return sortedOptions.map((o) => o.value);
  };

  return {
    // Data
    options: sortedOptions,
    defaultValue,

    // Helpers
    getLabel,
    getFitScoreWeight,
    getOption,
    getValues,

    // State
    isLoading,
    error,

    // Actions
    refresh: mutate,
  };
}

export default useFleetSizeOptions;
