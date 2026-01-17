/**
 * useLeadLossReasons - Hook pour charger les loss reasons des leads
 *
 * V6.3: Charge les raisons de perte/nurturing/disqualification depuis crm_settings
 * Utilisé par StatusChangeReasonModal pour collecter les raisons obligatoires
 *
 * @example
 * const { reasons, getLostReasons, getDisqualifiedReasons, getNurturingReasons } = useLeadLossReasons();
 *
 * @see migrations/V6.2-4_crm_settings_config.sql
 */

"use client";

import { useMemo } from "react";
import useSWR from "swr";

// ============================================================
// TYPES
// ============================================================

export type LossReasonCategory = "lost" | "disqualified" | "nurturing";

export interface LossReasonConfig {
  code: string;
  label_en: string;
  label_fr: string;
  label_ar?: string;
  category: LossReasonCategory;
  requires_detail: boolean;
  detail_field?: string;
  order?: number;
}

interface LossReasonsSettingValue {
  version: string;
  reasons: LossReasonConfig[];
}

interface SettingApiResponse {
  success: boolean;
  data?: {
    id: string;
    setting_key: string;
    setting_value: LossReasonsSettingValue;
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

export const DEFAULT_LOSS_REASONS: LossReasonConfig[] = [
  // LOST reasons
  {
    code: "not_interested",
    label_en: "Not interested",
    label_fr: "Pas intéressé",
    label_ar: "غير مهتم",
    category: "lost",
    requires_detail: false,
  },
  {
    code: "chose_competitor",
    label_en: "Chose competitor",
    label_fr: "A choisi un concurrent",
    label_ar: "اختار منافسًا",
    category: "lost",
    requires_detail: true,
    detail_field: "competitor_name",
  },
  {
    code: "price_perception",
    label_en: "Price too high",
    label_fr: "Prix perçu trop élevé",
    label_ar: "السعر مرتفع جدًا",
    category: "lost",
    requires_detail: false,
  },
  {
    code: "bad_timing",
    label_en: "Bad timing",
    label_fr: "Mauvais timing",
    label_ar: "توقيت سيء",
    category: "lost",
    requires_detail: false,
  },
  {
    code: "no_response",
    label_en: "No response",
    label_fr: "Ne répond plus",
    label_ar: "لا يوجد رد",
    category: "lost",
    requires_detail: false,
  },
  {
    code: "no_show",
    label_en: "No show",
    label_fr: "Ne s'est pas présenté",
    label_ar: "لم يحضر",
    category: "lost",
    requires_detail: false,
  },
  // DISQUALIFIED reasons
  {
    code: "wrong_segment",
    label_en: "Wrong segment",
    label_fr: "Mauvais segment",
    label_ar: "قطاع خاطئ",
    category: "disqualified",
    requires_detail: false,
  },
  {
    code: "wrong_country",
    label_en: "Country not covered",
    label_fr: "Pays non couvert",
    label_ar: "بلد غير مغطى",
    category: "disqualified",
    requires_detail: false,
  },
  {
    code: "spam_fake",
    label_en: "Spam or fake",
    label_fr: "Spam ou faux",
    label_ar: "بريد عشوائي أو مزيف",
    category: "disqualified",
    requires_detail: false,
  },
  {
    code: "duplicate",
    label_en: "Duplicate",
    label_fr: "Doublon",
    label_ar: "مكرر",
    category: "disqualified",
    requires_detail: false,
  },
  {
    code: "test_lead",
    label_en: "Test lead",
    label_fr: "Lead de test",
    label_ar: "عميل تجريبي",
    category: "disqualified",
    requires_detail: false,
  },
  // NURTURING reasons (V6.3)
  {
    code: "timing_not_ready",
    label_en: "Not ready yet",
    label_fr: "Pas encore prêt",
    label_ar: "غير جاهز بعد",
    category: "nurturing",
    requires_detail: false,
  },
  {
    code: "need_more_info",
    label_en: "Needs more information",
    label_fr: "A besoin de plus d'informations",
    label_ar: "يحتاج مزيد من المعلومات",
    category: "nurturing",
    requires_detail: false,
  },
  {
    code: "budget_next_quarter",
    label_en: "Budget available next quarter",
    label_fr: "Budget disponible le trimestre prochain",
    label_ar: "الميزانية متاحة الربع القادم",
    category: "nurturing",
    requires_detail: false,
  },
  {
    code: "internal_approval",
    label_en: "Waiting for internal approval",
    label_fr: "En attente d'approbation interne",
    label_ar: "في انتظار الموافقة الداخلية",
    category: "nurturing",
    requires_detail: false,
  },
  {
    code: "other_nurturing",
    label_en: "Other",
    label_fr: "Autre",
    label_ar: "آخر",
    category: "nurturing",
    requires_detail: true,
    detail_field: "reason_detail",
  },
];

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

export function useLeadLossReasons() {
  const { data, error, isLoading, mutate } = useSWR<SettingApiResponse>(
    "/api/v1/crm/settings/lead_loss_reasons",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute cache
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
    }
  );

  // Extract reasons from API response or use defaults
  const reasons: LossReasonConfig[] = useMemo(() => {
    if (data?.success && data?.data?.setting_value?.reasons) {
      // Merge with nurturing defaults (not in DB yet)
      const dbReasons = data.data.setting_value.reasons;
      const nurturingDefaults = DEFAULT_LOSS_REASONS.filter(
        (r) => r.category === "nurturing"
      );
      return [...dbReasons, ...nurturingDefaults];
    }
    return DEFAULT_LOSS_REASONS;
  }, [data]);

  /**
   * Get localized label for a reason code
   */
  const getLabel = (code: string, locale: string = "en"): string => {
    const reason = reasons.find((r) => r.code === code);
    if (!reason) return code;
    if (locale === "fr") return reason.label_fr;
    if (locale === "ar") return reason.label_ar || reason.label_en;
    return reason.label_en;
  };

  /**
   * Get all reasons for a specific category
   */
  const getReasonsByCategory = (
    category: LossReasonCategory
  ): LossReasonConfig[] => {
    return reasons.filter((r) => r.category === category);
  };

  /**
   * Get all "lost" reasons
   */
  const getLostReasons = (): LossReasonConfig[] => {
    return getReasonsByCategory("lost");
  };

  /**
   * Get all "disqualified" reasons
   */
  const getDisqualifiedReasons = (): LossReasonConfig[] => {
    return getReasonsByCategory("disqualified");
  };

  /**
   * Get all "nurturing" reasons
   */
  const getNurturingReasons = (): LossReasonConfig[] => {
    return getReasonsByCategory("nurturing");
  };

  /**
   * Get reason config by code
   */
  const getReason = (code: string): LossReasonConfig | undefined => {
    return reasons.find((r) => r.code === code);
  };

  /**
   * Check if a reason requires detail
   */
  const requiresDetail = (code: string): boolean => {
    const reason = reasons.find((r) => r.code === code);
    return reason?.requires_detail === true;
  };

  /**
   * Get reasons for a specific target status
   */
  const getReasonsForStatus = (
    status: "lost" | "disqualified" | "nurturing"
  ): LossReasonConfig[] => {
    return getReasonsByCategory(status);
  };

  return {
    // Data
    reasons,

    // Category-specific getters
    getLostReasons,
    getDisqualifiedReasons,
    getNurturingReasons,
    getReasonsForStatus,

    // Helpers
    getLabel,
    getReason,
    requiresDetail,
    getReasonsByCategory,

    // State
    isLoading,
    error,

    // Actions
    refresh: mutate,
  };
}

export default useLeadLossReasons;
