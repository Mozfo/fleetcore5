/**
 * Book Demo Wizard - Step 3: Business Information
 *
 * V6.2.5 - Collect business info after Cal.com booking.
 *
 * Name is now captured via Cal.com webhook (custom payload).
 * This step only collects: company_name, phone, fleet_size, GDPR consent.
 *
 * URL: /[locale]/book-demo/step-3?leadId=xxx
 *
 * @module app/[locale]/(public)/book-demo/step-3/page
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Truck,
  User,
} from "lucide-react";
import Link from "next/link";
import { WizardProgressBar } from "@/components/booking/WizardProgressBar";
import { GdprConsentField } from "@/components/forms/GdprConsentField";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { useGdprValidation } from "@/hooks/useGdprValidation";

// ============================================================================
// TYPES
// ============================================================================

interface Country {
  id: string;
  country_code: string;
  country_name_en: string;
  country_name_fr: string;
  country_name_ar: string;
  flag_emoji: string | null;
  is_operational: boolean;
  country_gdpr: boolean;
  phone_prefix: string | null;
  phone_example: string | null;
  display_order: number;
}

interface LeadData {
  id: string;
  email: string;
  email_verified: boolean;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  country_code: string | null;
}

interface BookingStatusResponse {
  success: boolean;
  data?: {
    hasBooking: boolean;
    bookingSlotAt: string | null;
    canProceed: boolean;
  };
  lead?: LeadData;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FLEET_SIZE_OPTIONS = [
  { value: "2-10", label: "2-10" },
  { value: "11-50", label: "11-50" },
  { value: "50+", label: "50+" },
];

// ============================================================================
// SCHEMA - No longer includes first_name/last_name (from webhook)
// ============================================================================

const step3Schema = z.object({
  company_name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  fleet_size: z.string().min(1, "Required"),
  gdpr_consent: z.boolean().optional(),
});

type Step3FormData = z.infer<typeof step3Schema>;

// ============================================================================
// COMPONENT
// ============================================================================

export default function BookDemoStep3Page() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  const leadId = searchParams.get("leadId");

  // Initialize i18n
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  // State
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      company_name: "",
      phone: "",
      fleet_size: "",
      gdpr_consent: false,
    },
  });

  const phoneValue = watch("phone") || "";
  const gdprConsent = watch("gdpr_consent") || false;
  const fleetSize = watch("fleet_size") || "";

  const leadCountryCode = leadData?.country_code || "";

  const { requiresGdpr, isValid: isGdprValid } = useGdprValidation(
    countries,
    leadCountryCode,
    gdprConsent
  );

  const selectedCountry = useMemo(() => {
    if (!leadCountryCode || !countries.length) return null;
    return countries.find((c) => c.country_code === leadCountryCode) || null;
  }, [leadCountryCode, countries]);

  // Redirect if missing leadId
  useEffect(() => {
    if (!leadId) {
      router.replace(`/${locale}/book-demo`);
    }
  }, [leadId, locale, router]);

  // Fetch lead data and countries
  useEffect(() => {
    if (!leadId) return;

    const fetchData = async () => {
      try {
        const [leadResponse, countriesResponse] = await Promise.all([
          fetch(`/api/crm/leads/${leadId}/booking-status`),
          fetch("/api/public/countries?operational=true"),
        ]);

        const leadResult: BookingStatusResponse = await leadResponse.json();
        const countriesResult = await countriesResponse.json();

        if (leadResult.success && leadResult.lead) {
          if (!leadResult.lead.email_verified) {
            router.replace(
              `/${locale}/book-demo/verify?leadId=${leadId}&email=${encodeURIComponent(leadResult.lead.email)}`
            );
            return;
          }

          setLeadData(leadResult.lead);

          // Pre-fill company_name if available
          if (leadResult.lead.company_name) {
            setValue("company_name", leadResult.lead.company_name);
          }
        } else {
          setLoadError(leadResult.error?.message || "Failed to load lead");
          return;
        }

        if (countriesResult.success && countriesResult.data) {
          setCountries(countriesResult.data);
        }
      } catch {
        setLoadError("Network error");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [leadId, locale, router, setValue]);

  const handleFleetSizeSelect = (value: string) => {
    setValue("fleet_size", value);
  };

  const onSubmit = async (data: Step3FormData) => {
    if (!leadId) return;

    if (requiresGdpr && !data.gdpr_consent) {
      setSubmitError(t("bookDemo.step3.errors.gdprRequired"));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/crm/leads/${leadId}/complete-wizard`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: data.company_name,
          phone: data.phone,
          fleet_size: data.fleet_size,
          gdpr_consent: data.gdpr_consent || false,
          wizard_completed: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/${locale}/book-demo/confirmation?leadId=${leadId}`);
      } else {
        setSubmitError(
          result.error?.message || t("bookDemo.step3.errors.generic")
        );
      }
    } catch {
      setSubmitError(t("bookDemo.step3.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!leadId) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
            {t("bookDemo.step3.error")}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">{loadError}</p>
          <Link
            href={`/${locale}/book-demo`}
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            {t("bookDemo.step3.back")}
          </Link>
        </div>
      </div>
    );
  }

  // Build welcome message
  const firstName = leadData?.first_name;
  const welcomeMessage = firstName
    ? locale === "fr"
      ? `Bonjour ${firstName} !`
      : `Welcome, ${firstName}!`
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 py-8 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <WizardProgressBar currentStep={3} totalSteps={3} className="mb-8" />

        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8 dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            </div>

            {/* Welcome message with name (from webhook) */}
            {welcomeMessage && (
              <div className="mb-3 flex items-center justify-center gap-2 text-lg font-medium text-green-600 dark:text-green-400">
                <User className="h-5 w-5" />
                {welcomeMessage}
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("bookDemo.step3.title")}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              {t("bookDemo.step3.subtitle")}
            </p>
            {leadData?.email && (
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                {leadData.email}
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Company Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                <Building2 className="h-4 w-4" />
                {t("bookDemo.step3.companyName")} *
              </label>
              <input
                {...register("company_name")}
                type="text"
                className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900/50 dark:text-white dark:placeholder-slate-500 ${
                  errors.company_name
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500 dark:border-slate-700"
                }`}
                placeholder={t("bookDemo.step3.companyNamePlaceholder")}
              />
              {errors.company_name && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {t("bookDemo.step3.errors.required")}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
                {t("bookDemo.step3.phone")} *
                {selectedCountry && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-slate-500">
                    ({selectedCountry.flag_emoji} {selectedCountry.phone_prefix}
                    )
                  </span>
                )}
              </label>
              <PhoneInput
                countries={countries}
                selectedCountryCode={leadCountryCode}
                value={phoneValue}
                onChange={(val) => setValue("phone", val)}
                placeholder={t("bookDemo.step3.phonePlaceholder")}
                locale={locale}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {t("bookDemo.step3.errors.required")}
                </p>
              )}
            </div>

            {/* Fleet Size */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                <Truck className="h-4 w-4" />
                {t("bookDemo.step3.fleetSize")} *
              </label>
              <div className="flex gap-3">
                {FLEET_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFleetSizeSelect(option.value)}
                    className={`flex-1 rounded-lg border p-4 transition-all ${
                      fleetSize === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-500"
                    }`}
                  >
                    <span className="block font-semibold">{option.label}</span>
                    <span className="block text-xs text-gray-500 dark:text-slate-500">
                      {t("bookDemo.step3.vehicles")}
                    </span>
                  </button>
                ))}
              </div>
              {errors.fleet_size && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {t("bookDemo.step3.errors.required")}
                </p>
              )}
            </div>

            {/* GDPR Consent */}
            <GdprConsentField
              countries={countries}
              selectedCountryCode={leadCountryCode}
              value={gdprConsent}
              onChange={(consented) => setValue("gdpr_consent", consented)}
              locale={locale}
            />

            {/* Submit Error */}
            {submitError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting || (requiresGdpr && !isGdprValid)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("bookDemo.step3.submitting")}
                  </>
                ) : (
                  <>
                    {t("bookDemo.step3.submit")}
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href={`/${locale}`}
            className="text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
          >
            {t("bookDemo.backToHome")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
