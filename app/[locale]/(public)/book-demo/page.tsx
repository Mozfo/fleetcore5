/**
 * Book Demo Wizard - Step 1: Email + Country
 *
 * V6.2.4 - First step with country gate and waitlist for non-operational countries.
 *
 * Flow A (Operational Country):
 * 1. User enters email + selects country
 * 2. Submit → POST /api/demo-leads { mode: "wizard_step1", email, country_code, locale }
 * 3. Success → Redirect to /book-demo/verify?leadId=xxx&email=xxx
 *
 * Flow B (Non-Operational Country):
 * 1. User enters email + selects country
 * 2. Submit → Show waitlist section (same page)
 * 3. User clicks "Join Early Access" → Show fleet size cards
 * 4. User selects fleet size → POST /api/waitlist → Show thank you
 *
 * @module app/[locale]/(public)/book-demo/page
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  ArrowRight,
  Loader2,
  Users,
  AlertCircle,
  Globe,
  Sparkles,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { WizardProgressBar } from "@/components/booking/WizardProgressBar";

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const formSchema = z.object({
  email: z.string().email(),
  country_code: z.string().min(2, "Country required"),
});

type FormData = z.infer<typeof formSchema>;

interface Country {
  id: string;
  country_code: string;
  country_name_en: string;
  country_name_fr: string;
  flag_emoji: string | null;
  is_operational: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: {
    leadId: string;
    requiresVerification?: boolean;
    alreadyVerified?: boolean;
    expiresAt?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Fleet size options for waitlist (no "1" - solo drivers use mobile app)
const FLEET_SIZE_OPTIONS = [
  { value: "2-10", label: "2-10 vehicles" },
  { value: "11-50", label: "11-50 vehicles" },
  { value: "50+", label: "50+ vehicles" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function BookDemoPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  // Initialize i18n with correct locale
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const emailValue = watch("email");
  const countryValue = watch("country_code");

  // Countries state
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<{
    code: string;
    message: string;
  } | null>(null);

  // Waitlist state
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistStep, setWaitlistStep] = useState<1 | 2 | 3>(1);
  const [selectedFleetSize, setSelectedFleetSize] = useState<string | null>(
    null
  );
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Debounced email validation feedback
  const [debouncedEmail, setDebouncedEmail] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(emailValue || "");
    }, 300);
    return () => clearTimeout(timer);
  }, [emailValue]);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("/api/public/countries");
        const result = await response.json();
        if (result.success && result.data) {
          setCountries(result.data);
        }
      } catch {
        // Silent fail - countries will be empty
      } finally {
        setIsLoadingCountries(false);
      }
    };

    void fetchCountries();
  }, []);

  // Try to detect country via GeoIP
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch("/api/geo/detect");
        const result = await response.json();
        if (result.countryCode && !countryValue) {
          setValue("country_code", result.countryCode);
        }
      } catch {
        // Silent fail - user will select manually
      }
    };

    void detectCountry();
  }, [setValue, countryValue]);

  // Get selected country object
  const selectedCountry = countries.find(
    (c) => c.country_code === countryValue
  );

  // Get country name based on locale
  const getCountryName = (country: Country) => {
    return locale === "fr" ? country.country_name_fr : country.country_name_en;
  };

  // Form submission
  const onSubmit = useCallback(
    async (data: FormData) => {
      // Check if country is operational
      const country = countries.find(
        (c) => c.country_code === data.country_code
      );

      if (!country) {
        setError("country_code", { message: "Please select a valid country" });
        return;
      }

      // If country is NOT operational, show waitlist
      if (!country.is_operational) {
        setShowWaitlist(true);
        setWaitlistStep(1);
        return;
      }

      // Country is operational - proceed with normal flow
      setIsSubmitting(true);
      setApiError(null);

      try {
        const response = await fetch("/api/demo-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "wizard_step1",
            email: data.email.toLowerCase().trim(),
            country_code: data.country_code,
            locale,
          }),
        });

        const result: ApiResponse = await response.json();

        if (result.success && result.data) {
          const { leadId, requiresVerification, alreadyVerified } = result.data;

          if (alreadyVerified) {
            router.push(`/${locale}/book-demo/step-2?leadId=${leadId}`);
          } else if (requiresVerification) {
            router.push(
              `/${locale}/book-demo/verify?leadId=${leadId}&email=${encodeURIComponent(data.email)}`
            );
          }
        } else if (result.error) {
          if (result.error.code === "ALREADY_CONVERTED") {
            setApiError({
              code: "ALREADY_CONVERTED",
              message: t("bookDemo.step1.errors.alreadyCustomer"),
            });
          } else if (result.error.code === "VALIDATION_ERROR") {
            setError("email", {
              message: t("bookDemo.step1.errors.invalidEmail"),
            });
          } else {
            setApiError({
              code: result.error.code,
              message:
                result.error.message || t("bookDemo.step1.errors.generic"),
            });
          }
        }
      } catch {
        setApiError({
          code: "NETWORK_ERROR",
          message: t("bookDemo.step1.errors.generic"),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [countries, locale, router, setError, t]
  );

  // Submit waitlist
  const handleWaitlistSubmit = async () => {
    if (!selectedFleetSize || !emailValue || !countryValue) return;

    setIsSubmittingWaitlist(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailValue.toLowerCase().trim(),
          country_code: countryValue,
          fleet_size: selectedFleetSize,
          locale,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setWaitlistSuccess(true);
      } else {
        setApiError({
          code: result.error?.code || "WAITLIST_ERROR",
          message: result.error?.message || "Failed to join waitlist",
        });
      }
    } catch {
      setApiError({
        code: "NETWORK_ERROR",
        message: t("bookDemo.step1.errors.generic"),
      });
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  // Handle fleet size selection
  const handleFleetSizeSelect = (value: string) => {
    setSelectedFleetSize(value);
    void handleWaitlistSubmit();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Progress Bar */}
        <WizardProgressBar currentStep={1} totalSteps={3} className="mb-8" />

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {!showWaitlist ? (
              // ============================================================
              // MAIN FORM (Email + Country)
              // ============================================================
              <motion.div
                key="main-form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
                    <Mail className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("bookDemo.step1.title")}
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                    {t("bookDemo.step1.subtitle")}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200"
                    >
                      {t("bookDemo.step1.emailLabel")}
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        placeholder={t("bookDemo.step1.emailPlaceholder")}
                        disabled={isSubmitting}
                        {...register("email")}
                        className={`w-full rounded-lg border bg-white px-4 py-3 pl-11 text-gray-900 placeholder-gray-400 transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/50 dark:text-white dark:placeholder-slate-500 ${
                          errors.email
                            ? "border-red-500 focus:ring-red-500"
                            : debouncedEmail && isValid
                              ? "border-green-500 focus:ring-green-500"
                              : "border-gray-300 focus:ring-blue-500 dark:border-slate-600"
                        }`}
                      />
                      <Mail className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                    </div>
                    {errors.email && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        {t("bookDemo.step1.errors.invalidEmail")}
                      </p>
                    )}
                  </div>

                  {/* Country Dropdown */}
                  <div>
                    <label
                      htmlFor="country_code"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200"
                    >
                      {t("bookDemo.step1.countryLabel")}
                    </label>
                    <div className="relative">
                      <select
                        id="country_code"
                        disabled={isSubmitting || isLoadingCountries}
                        {...register("country_code")}
                        className={`w-full appearance-none rounded-lg border bg-white px-4 py-3 pr-10 pl-11 text-gray-900 transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/50 dark:text-white ${
                          errors.country_code
                            ? "border-red-500 focus:ring-red-500"
                            : countryValue
                              ? "border-green-500 focus:ring-green-500"
                              : "border-gray-300 focus:ring-blue-500 dark:border-slate-600"
                        }`}
                      >
                        <option value="">
                          {t("bookDemo.step1.selectCountry")}
                        </option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.country_code}>
                            {country.flag_emoji} {getCountryName(country)}
                          </option>
                        ))}
                      </select>
                      <Globe className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                    </div>
                    {errors.country_code && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        {t("bookDemo.step1.errors.countryRequired")}
                      </p>
                    )}
                  </div>

                  {/* API Error */}
                  {apiError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg bg-red-50 p-4 dark:bg-red-500/10"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {apiError.message}
                      </p>
                      {apiError.code === "ALREADY_CONVERTED" && (
                        <Link
                          href={`/${locale}/login`}
                          className="mt-2 inline-block text-sm font-medium text-blue-400 hover:underline"
                        >
                          {t("bookDemo.step1.errors.loginLink")}
                        </Link>
                      )}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t("bookDemo.step1.submitting")}
                      </>
                    ) : (
                      <>
                        {t("bookDemo.step1.cta")}
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Social Proof */}
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-500">
                  <Users className="h-4 w-4" />
                  <span>{t("bookDemo.step1.socialProof")}</span>
                </div>
              </motion.div>
            ) : waitlistSuccess ? (
              // ============================================================
              // WAITLIST SUCCESS
              // ============================================================
              <motion.div
                key="waitlist-success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 text-center"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                  {t("bookDemo.waitlist.successTitle", {
                    defaultValue: "You're on the list!",
                  })}
                </h2>
                <p className="mb-6 text-gray-600 dark:text-slate-400">
                  {t("bookDemo.waitlist.successMessage", {
                    defaultValue:
                      "We'll reach out as soon as we launch in your area.",
                    email: emailValue,
                  })}
                </p>
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
                >
                  {t("bookDemo.backToHome")}
                </Link>
              </motion.div>
            ) : (
              // ============================================================
              // WAITLIST FLOW
              // ============================================================
              <motion.div
                key="waitlist-flow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {waitlistStep === 1 && (
                  // Step 1: Empathetic message
                  <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
                      <Globe className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                      {t("bookDemo.waitlist.notAvailableTitle", {
                        defaultValue: "We're not in your country yet",
                        country: selectedCountry
                          ? getCountryName(selectedCountry)
                          : "",
                      })}
                    </h2>
                    <p className="mb-6 text-gray-600 dark:text-slate-400">
                      {t("bookDemo.waitlist.notAvailableMessage", {
                        defaultValue:
                          "Unfortunately, FleetCore isn't available in your country yet. But we're expanding fast — and we'd love to have you on board early.",
                      })}
                    </p>
                    <button
                      onClick={() => setWaitlistStep(2)}
                      className="w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white transition-all hover:bg-blue-700"
                    >
                      {t("bookDemo.waitlist.tellMeMore", {
                        defaultValue: "Tell me more",
                      })}
                    </button>
                    <button
                      onClick={() => {
                        setShowWaitlist(false);
                        setWaitlistStep(1);
                      }}
                      className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {t("bookDemo.waitlist.goBack", {
                        defaultValue: "Go back",
                      })}
                    </button>
                  </div>
                )}

                {waitlistStep === 2 && (
                  // Step 2: Incentive
                  <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-500/20">
                      <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-500" />
                    </div>
                    <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                      {t("bookDemo.waitlist.earlyAccessTitle", {
                        defaultValue: "Join Early Access",
                      })}
                    </h2>
                    <p className="mb-6 text-gray-600 dark:text-slate-400">
                      {t("bookDemo.waitlist.earlyAccessMessage", {
                        defaultValue:
                          "Join our early access list and be the first to know when we launch — with exclusive benefits reserved for founding members.",
                      })}
                    </p>
                    <button
                      onClick={() => setWaitlistStep(3)}
                      className="w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white transition-all hover:bg-blue-700"
                    >
                      {t("bookDemo.waitlist.countMeIn", {
                        defaultValue: "Count me in",
                      })}
                    </button>
                    <button
                      onClick={() => setWaitlistStep(1)}
                      className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {t("bookDemo.waitlist.goBack", {
                        defaultValue: "Go back",
                      })}
                    </button>
                  </div>
                )}

                {waitlistStep === 3 && (
                  // Step 3: Fleet size selection
                  <div className="text-center">
                    <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                      {t("bookDemo.waitlist.fleetSizeTitle", {
                        defaultValue: "One quick question",
                      })}
                    </h2>
                    <p className="mb-6 text-gray-600 dark:text-slate-400">
                      {t("bookDemo.waitlist.fleetSizeMessage", {
                        defaultValue:
                          "To help us prepare your experience, how many vehicles do you manage?",
                      })}
                    </p>

                    {/* Fleet Size Cards */}
                    <div className="mb-6 flex gap-3">
                      {FLEET_SIZE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleFleetSizeSelect(option.value)}
                          disabled={isSubmittingWaitlist}
                          className={`flex-1 rounded-lg border p-4 transition-all disabled:opacity-50 ${
                            selectedFleetSize === option.value
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-500"
                          }`}
                        >
                          <span className="block font-semibold">
                            {option.value}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-slate-500">
                            vehicles
                          </span>
                        </button>
                      ))}
                    </div>

                    {isSubmittingWaitlist && (
                      <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>
                          {t("bookDemo.waitlist.joining", {
                            defaultValue: "Joining...",
                          })}
                        </span>
                      </div>
                    )}

                    {apiError && (
                      <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-500/10">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {apiError.message}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setWaitlistStep(2)}
                      className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {t("bookDemo.waitlist.goBack", {
                        defaultValue: "Go back",
                      })}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back to home link */}
        {!showWaitlist && (
          <div className="mt-6 text-center">
            <Link
              href={`/${locale}`}
              className="text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
            >
              {t("bookDemo.backToHome")}
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
