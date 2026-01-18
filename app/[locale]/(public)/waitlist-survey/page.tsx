/**
 * Early Access Survey Page
 *
 * V6.3 - Simple 1-click survey to collect fleet size and marketing consent
 *
 * Flow:
 * 1. User clicks link in email → arrives here with ?id=xxx
 * 2. User sees confirmation of early access
 * 3. User selects fleet size (1 click on clean cards)
 * 4. User checks opt-in for offers
 * 5. Submit → updates waitlist entry
 *
 * GDPR Compliance:
 * - For GDPR countries: checkbox is required + privacy policy link
 * - Records consent with IP and timestamp
 *
 * URL: /[locale]/waitlist-survey?id=xxx
 *
 * @module app/[locale]/(public)/waitlist-survey/page
 */

"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  CarTaxiFront,
  MailCheck,
} from "lucide-react";
import Link from "next/link";

// Fleet size option type (loaded from API)
interface FleetSizeOption {
  value: string;
  label_en: string;
  label_fr: string;
  label_ar?: string;
}

interface WaitlistEntryInfo {
  id: string;
  email: string;
  country_code: string;
  country_name_en: string;
  country_name_fr: string;
  is_gdpr_country: boolean;
  already_consented: boolean;
}

export default function WaitlistSurveyPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  const waitlistId = searchParams.get("id");

  const [entryInfo, setEntryInfo] = useState<WaitlistEntryInfo | null>(null);
  const [fleetSizeOptions, setFleetSizeOptions] = useState<FleetSizeOption[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFleetSize, setSelectedFleetSize] = useState<string | null>(
    null
  );
  const [wantOffers, setWantOffers] = useState(true); // Pre-checked for better UX
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize i18n with correct locale
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  // Fetch fleet size options from crm_settings
  useEffect(() => {
    async function fetchFleetSizeOptions() {
      try {
        const response = await fetch("/api/public/fleet-size-options");
        const result = await response.json();
        if (result.success && result.data) {
          setFleetSizeOptions(result.data);
        }
      } catch {
        // Silent fail - will show empty options
      }
    }
    void fetchFleetSizeOptions();
  }, []);

  // Fetch entry info on load
  useEffect(() => {
    async function fetchEntryInfo() {
      if (!waitlistId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/waitlist/survey?id=${waitlistId}`);
        const result = await response.json();

        if (result.success) {
          setEntryInfo(result.data);
          // If already consented, keep it checked
          if (result.data.already_consented) {
            setWantOffers(true);
          }
        }
      } catch {
        // Silent fail - will show invalid link message
      } finally {
        setIsLoading(false);
      }
    }

    void fetchEntryInfo();
  }, [waitlistId]);

  const handleSubmit = async () => {
    if (!waitlistId || !selectedFleetSize) {
      setError(t("waitlistSurvey.selectFleetSize"));
      return;
    }

    // For GDPR countries, consent is required
    if (entryInfo?.is_gdpr_country && !wantOffers) {
      setError(t("waitlistSurvey.gdprConsentRequired"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/waitlist/survey", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: waitlistId,
          fleet_size: selectedFleetSize,
          marketing_consent: wantOffers,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error?.message || t("waitlistSurvey.error"));
      }
    } catch {
      setError(t("waitlistSurvey.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // No ID provided or entry not found
  if (!waitlistId || !entryInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-800/50">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>
          <h1 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
            {t("waitlistSurvey.invalidLink")}
          </h1>
          <p className="mb-6 text-gray-600 dark:text-slate-400">
            {t("waitlistSurvey.invalidLinkMessage")}
          </p>
          <Link
            href={`/${locale}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("bookDemo.backToHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {isSuccess ? (
          // Success state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-white p-10 text-center shadow-2xl dark:bg-slate-800/80 dark:backdrop-blur-xl"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
              {t("waitlistSurvey.successTitle")}
            </h2>
            <p className="mb-8 text-gray-600 dark:text-slate-400">
              {t("waitlistSurvey.successMessage")}
            </p>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
            >
              {t("bookDemo.backToHome")}
            </Link>
          </motion.div>
        ) : (
          // Survey form
          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-800/80 dark:backdrop-blur-xl">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <CarTaxiFront className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold">
                {t("waitlistSurvey.title")}
              </h1>
              <p className="mt-2 text-sm text-blue-100">
                {t("waitlistSurvey.subtitle")}
              </p>
              <p className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
                {t("waitlistSurvey.earlyAdopterIncentive")}
              </p>
            </div>

            <div className="p-8">
              {/* Email confirmation */}
              <div className="mb-8 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 dark:bg-slate-700">
                  <MailCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {entryInfo.email}
                  </span>
                </div>
              </div>

              {/* Fleet size question */}
              <div className="mb-8">
                <p className="mb-4 text-center text-sm font-medium text-gray-600 dark:text-slate-400">
                  {t("waitlistSurvey.fleetSizeQuestion")}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {fleetSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedFleetSize(option.value)}
                      disabled={isSubmitting}
                      className={`min-w-[80px] rounded-xl px-5 py-3.5 text-center font-semibold transition-all disabled:opacity-50 ${
                        selectedFleetSize === option.value
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      }`}
                    >
                      {option.value}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-center text-xs text-gray-500 dark:text-slate-500">
                  {t("waitlistSurvey.vehiclesLabel")}
                </p>
              </div>

              {/* Opt-in checkbox */}
              <div className="mb-6">
                <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700">
                  <input
                    type="checkbox"
                    checked={wantOffers}
                    onChange={(e) => setWantOffers(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                    {entryInfo.is_gdpr_country
                      ? t("waitlistSurvey.gdprConsentText")
                      : t("waitlistSurvey.wantOffersText")}
                    {entryInfo.is_gdpr_country && (
                      <span className="whitespace-nowrap">
                        {" "}
                        {t("waitlistSurvey.seeOur")}{" "}
                        <Link
                          href={`/${locale}/privacy`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-medium text-purple-600 hover:underline dark:text-purple-400"
                        >
                          {t("waitlistSurvey.privacyPolicy")}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </span>
                    )}
                  </span>
                </label>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 rounded-xl bg-red-50 p-4 dark:bg-red-500/10">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Privacy reassurance */}
              <p className="mb-4 text-center text-xs text-gray-500 dark:text-slate-500">
                {t("waitlistSurvey.privacyReassurance")}
              </p>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedFleetSize}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                ) : (
                  t("waitlistSurvey.submit")
                )}
              </button>

              {/* Skip link */}
              <div className="mt-4 text-center">
                <Link
                  href={`/${locale}`}
                  className="text-sm text-gray-400 transition-colors hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-400"
                >
                  {t("waitlistSurvey.skip")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
