"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

/**
 * Country type with GDPR flag
 */
interface Country {
  country_code: string;
  country_name_en: string;
  country_name_fr: string;
  country_gdpr: boolean;
}

/**
 * Props for GdprConsentField component
 */
interface GdprConsentFieldProps {
  /** List of countries with GDPR flag */
  countries: Country[];
  /** Currently selected country code (2-letter ISO) */
  selectedCountryCode: string | null;
  /** Current consent state */
  value: boolean;
  /** Callback when consent changes */
  onChange: (consented: boolean) => void;
  /** Current locale for translations */
  locale?: string;
  /** Optional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * GDPR Consent Field Component
 *
 * Displays a conditional GDPR consent checkbox for EU/EEA countries.
 * Automatically shows/hides based on selected country's `country_gdpr` flag.
 *
 * Business Rule:
 * - Show checkbox ONLY when FleetCore = data controller (marketing forms)
 * - Do NOT show for operational forms where client = controller
 *
 * @example
 * ```tsx
 * <GdprConsentField
 *   countries={countries}
 *   selectedCountryCode={formData.country_code}
 *   value={formData.gdpr_consent}
 *   onChange={(consented) => setFormData({...formData, gdpr_consent: consented})}
 *   locale="fr"
 * />
 * ```
 */
export function GdprConsentField({
  countries,
  selectedCountryCode,
  value,
  onChange,
  className = "",
  disabled = false,
}: GdprConsentFieldProps) {
  const { t } = useTranslation("common");

  // Detect if selected country requires GDPR consent
  const requiresGdpr = useMemo(() => {
    if (!selectedCountryCode) return false;

    const country = countries.find(
      (c) => c.country_code === selectedCountryCode
    );

    return country?.country_gdpr || false;
  }, [countries, selectedCountryCode]);

  // Hide component if GDPR not required
  if (!requiresGdpr) return null;

  return (
    <div
      className={`rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20 ${className}`}
    >
      {/* Title */}
      <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
        {t("gdpr.title")}
      </h3>

      {/* Explanation */}
      <p className="mb-3 text-sm text-blue-700 dark:text-blue-300">
        {t("gdpr.explanation")}
      </p>

      {/* Checkbox + Label */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t("gdpr.consent")}{" "}
          <Link
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            {t("gdpr.privacyPolicy")}
          </Link>
        </span>
      </label>

      {/* Error message if required but not checked */}
      {requiresGdpr && !value && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          * {t("gdpr.required")}
        </p>
      )}
    </div>
  );
}
