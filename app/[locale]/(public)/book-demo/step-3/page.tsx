/**
 * Book Demo Wizard - Step 3: Business Information
 *
 * V6.2.2 - Collect business info with conditional GDPR consent.
 *
 * URL: /[locale]/book-demo/step-3?leadId=xxx
 *
 * Prerequisites:
 * - Lead must have email_verified = true
 * - Lead should have a booking (optional, allow skip for UX)
 *
 * Flow:
 * 1. Verify lead prerequisites
 * 2. Display form with:
 *    - first_name, last_name (required)
 *    - company_name (required)
 *    - phone (optional)
 *    - country_code (required - from dropdown)
 *    - fleet_size (required)
 *    - platforms_used (multi-select)
 *    - GDPR consent (conditional based on EU country)
 * 3. On submit → PATCH lead + wizard_completed: true
 * 4. Redirect to /book-demo/confirmation
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
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
  Phone,
  Globe,
  Truck,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { WizardProgressBar } from "@/components/booking/WizardProgressBar";
import { GdprConsentField } from "@/components/forms/GdprConsentField";
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
  display_order: number;
}

interface LeadData {
  id: string;
  email: string;
  email_verified: boolean;
  first_name: string | null;
  last_name: string | null;
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
  "1",
  "2-5",
  "6-10",
  "11-20",
  "21-50",
  "51-100",
  "100+",
];

const PLATFORM_OPTIONS = [
  "uber",
  "bolt",
  "careem",
  "yango",
  "freenow",
  "other",
];

// ============================================================================
// SCHEMA
// ============================================================================

const step3Schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  company_name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  country_code: z.string().min(1, "Required"),
  fleet_size: z.string().min(1, "Required"),
  platforms_used: z.array(z.string()).optional(),
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

  // Query params
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
      first_name: "",
      last_name: "",
      company_name: "",
      phone: "",
      country_code: "",
      fleet_size: "",
      platforms_used: [],
      gdpr_consent: false,
    },
  });

  // Watch form values
  const selectedCountryCode = watch("country_code");
  const gdprConsent = watch("gdpr_consent") || false;
  const platformsUsed = watch("platforms_used") || [];

  // GDPR validation
  const { requiresGdpr, isValid: isGdprValid } = useGdprValidation(
    countries,
    selectedCountryCode,
    gdprConsent
  );

  // Get country name based on locale
  const getCountryName = (country: Country) => {
    switch (locale) {
      case "fr":
        return country.country_name_fr;
      case "ar":
        return country.country_name_ar;
      default:
        return country.country_name_en;
    }
  };

  // Sorted countries: operational first, then by display_order
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => {
      // Operational countries first
      if (a.is_operational && !b.is_operational) return -1;
      if (!a.is_operational && b.is_operational) return 1;
      // Then by display_order
      return a.display_order - b.display_order;
    });
  }, [countries]);

  // Redirect if missing leadId
  useEffect(() => {
    if (!leadId) {
      router.replace(`/${locale}/book-demo`);
    }
  }, [leadId, locale, router]);

  // Fetch lead data and countries on mount
  useEffect(() => {
    if (!leadId) return;

    const fetchData = async () => {
      try {
        // Fetch lead and countries in parallel
        const [leadResponse, countriesResponse] = await Promise.all([
          fetch(`/api/crm/leads/${leadId}/booking-status`),
          fetch("/api/public/countries"),
        ]);

        const leadResult: BookingStatusResponse = await leadResponse.json();
        const countriesResult = await countriesResponse.json();

        // Handle lead result
        if (leadResult.success && leadResult.lead) {
          // Check if email is verified
          if (!leadResult.lead.email_verified) {
            router.replace(
              `/${locale}/book-demo/verify?leadId=${leadId}&email=${encodeURIComponent(leadResult.lead.email)}`
            );
            return;
          }

          setLeadData(leadResult.lead);

          // Pre-fill form with existing lead data
          if (leadResult.lead.first_name) {
            setValue("first_name", leadResult.lead.first_name);
          }
          if (leadResult.lead.last_name) {
            setValue("last_name", leadResult.lead.last_name);
          }
        } else {
          setLoadError(leadResult.error?.message || "Failed to load lead");
          return;
        }

        // Handle countries result
        if (countriesResult.success && countriesResult.data) {
          setCountries(countriesResult.data);
        }
      } catch (_err) {
        setLoadError("Network error");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [leadId, locale, router, setValue]);

  // Handle platform checkbox toggle
  const handlePlatformToggle = (platform: string) => {
    const current = platformsUsed || [];
    if (current.includes(platform)) {
      setValue(
        "platforms_used",
        current.filter((p) => p !== platform)
      );
    } else {
      setValue("platforms_used", [...current, platform]);
    }
  };

  // Handle form submission
  const onSubmit = async (data: Step3FormData) => {
    if (!leadId) return;

    // Check GDPR if required
    if (requiresGdpr && !data.gdpr_consent) {
      setSubmitError(t("bookDemo.step3.errors.gdprRequired"));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/crm/leads/${leadId}/complete-wizard`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          company_name: data.company_name,
          phone: data.phone || null,
          country_code: data.country_code,
          fleet_size: data.fleet_size,
          platforms_used: data.platforms_used || [],
          gdpr_consent: data.gdpr_consent || false,
          wizard_completed: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to confirmation page
        router.push(`/${locale}/book-demo/confirmation?leadId=${leadId}`);
      } else {
        setSubmitError(
          result.error?.message || t("bookDemo.step3.errors.generic")
        );
      }
    } catch (_err) {
      setSubmitError(t("bookDemo.step3.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if missing leadId
  if (!leadId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md rounded-2xl bg-slate-800/50 p-8 text-center backdrop-blur-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-white">
            {t("bookDemo.step3.error")}
          </h1>
          <p className="mt-2 text-slate-400">{loadError}</p>
          <Link
            href={`/${locale}/book-demo`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("bookDemo.step3.back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Progress Bar */}
        <WizardProgressBar currentStep={3} totalSteps={3} className="mb-8" />

        {/* Card */}
        <div className="rounded-2xl bg-slate-800/50 p-6 backdrop-blur-sm sm:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {t("bookDemo.step3.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {t("bookDemo.step3.subtitle")}
            </p>
            {leadData?.email && (
              <p className="mt-1 text-xs text-slate-500">{leadData.email}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* First Name */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <User className="h-4 w-4" />
                  {t("bookDemo.step3.firstName")} *
                </label>
                <input
                  {...register("first_name")}
                  type="text"
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.first_name
                      ? "border-red-500"
                      : "border-slate-700 focus:border-blue-500"
                  }`}
                  placeholder={t("bookDemo.step3.firstNamePlaceholder")}
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-400">
                    {t("bookDemo.step3.errors.required")}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <User className="h-4 w-4" />
                  {t("bookDemo.step3.lastName")} *
                </label>
                <input
                  {...register("last_name")}
                  type="text"
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.last_name
                      ? "border-red-500"
                      : "border-slate-700 focus:border-blue-500"
                  }`}
                  placeholder={t("bookDemo.step3.lastNamePlaceholder")}
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-400">
                    {t("bookDemo.step3.errors.required")}
                  </p>
                )}
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Building2 className="h-4 w-4" />
                {t("bookDemo.step3.companyName")} *
              </label>
              <input
                {...register("company_name")}
                type="text"
                className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.company_name
                    ? "border-red-500"
                    : "border-slate-700 focus:border-blue-500"
                }`}
                placeholder={t("bookDemo.step3.companyNamePlaceholder")}
              />
              {errors.company_name && (
                <p className="mt-1 text-xs text-red-400">
                  {t("bookDemo.step3.errors.required")}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Phone className="h-4 w-4" />
                {t("bookDemo.step3.phone")}
              </label>
              <input
                {...register("phone")}
                type="tel"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder={t("bookDemo.step3.phonePlaceholder")}
              />
            </div>

            {/* Country & Fleet Size Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Country */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Globe className="h-4 w-4" />
                  {t("bookDemo.step3.country")} *
                </label>
                <select
                  {...register("country_code")}
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.country_code
                      ? "border-red-500"
                      : "border-slate-700 focus:border-blue-500"
                  }`}
                >
                  <option value="">{t("bookDemo.step3.selectCountry")}</option>
                  {sortedCountries.map((country) => (
                    <option
                      key={country.country_code}
                      value={country.country_code}
                    >
                      {country.flag_emoji} {getCountryName(country)}
                      {country.is_operational && " *"}
                    </option>
                  ))}
                </select>
                {errors.country_code && (
                  <p className="mt-1 text-xs text-red-400">
                    {t("bookDemo.step3.errors.required")}
                  </p>
                )}
              </div>

              {/* Fleet Size */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Truck className="h-4 w-4" />
                  {t("bookDemo.step3.fleetSize")} *
                </label>
                <select
                  {...register("fleet_size")}
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.fleet_size
                      ? "border-red-500"
                      : "border-slate-700 focus:border-blue-500"
                  }`}
                >
                  <option value="">
                    {t("bookDemo.step3.selectFleetSize")}
                  </option>
                  {FLEET_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size === "100+"
                        ? t("bookDemo.step3.fleetSizeOptions.moreThan100")
                        : `${size} ${t("bookDemo.step3.vehicles")}`}
                    </option>
                  ))}
                </select>
                {errors.fleet_size && (
                  <p className="mt-1 text-xs text-red-400">
                    {t("bookDemo.step3.errors.required")}
                  </p>
                )}
              </div>
            </div>

            {/* Platforms Used */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                {t("bookDemo.step3.platformsUsed")}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PLATFORM_OPTIONS.map((platform) => (
                  <label
                    key={platform}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                      platformsUsed.includes(platform)
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 bg-slate-900/30 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={platformsUsed.includes(platform)}
                      onChange={() => handlePlatformToggle(platform)}
                      className="sr-only"
                    />
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        platformsUsed.includes(platform)
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-600"
                      }`}
                    >
                      {platformsUsed.includes(platform) && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <span className="text-sm text-slate-300">
                      {t(`bookDemo.step3.platforms.${platform}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* GDPR Consent (conditional) */}
            <GdprConsentField
              countries={countries}
              selectedCountryCode={selectedCountryCode}
              value={gdprConsent}
              onChange={(consented) => setValue("gdpr_consent", consented)}
              locale={locale}
            />

            {/* Submit Error */}
            {submitError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href={`/${locale}/book-demo/step-2?leadId=${leadId}`}
                className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("bookDemo.step3.back")}
              </Link>

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
                  t("bookDemo.step3.submit")
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href={`/${locale}`}
            className="text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            {t("bookDemo.backToHome")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
