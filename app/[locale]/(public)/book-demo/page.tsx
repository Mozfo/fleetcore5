/**
 * Book Demo Wizard - Step 1: Email + Country
 *
 * V6.2.4 - First step with country gate and waitlist for non-operational countries.
 * V6.3 - Waitlist opt-in happens via EMAIL (not on website) - GDPR compliant
 *
 * Flow A (Operational Country):
 * 1. User enters email + selects country
 * 2. Submit → POST /api/crm/demo-leads { mode: "wizard_step1", email, country_code, locale }
 * 3. Success → Redirect to /book-demo/verify?leadId=xxx&email=xxx
 *
 * Flow B (Non-Operational Country - V6.3):
 * 1. User enters email + selects country
 * 2. Submit → POST /api/waitlist (pending entry) → Send email with opt-in link
 * 3. Show "Country not available" message (NO button on website)
 * 4. User receives email with survey link → Clicks link → /waitlist-survey page
 * 5. User submits survey → marketing_consent = true (opted in)
 *
 * @module app/[locale]/(public)/book-demo/page
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  CheckCircle,
  ChevronDown,
  Calendar,
  Send,
  Globe,
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
  country_preposition_en: string | null;
  country_preposition_fr: string | null;
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

// Fleet size options removed - V6.3: collected via email survey

// ============================================================================
// COMPONENT
// ============================================================================

export default function BookDemoPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  // UTM tracking params (from URL query string) - memoized to prevent re-renders
  const utmParams = useMemo(
    () => ({
      utm_source: searchParams.get("utm_source") || undefined,
      utm_medium: searchParams.get("utm_medium") || undefined,
      utm_campaign: searchParams.get("utm_campaign") || undefined,
    }),
    [searchParams]
  );

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

  // Waitlist state (V6.3 - opt-in happens via email, not on website)
  const [showCountryNotAvailable, setShowCountryNotAvailable] = useState(false);

  // Existing booking state (V6.2.4 - email check)
  const [existingBooking, setExistingBooking] = useState<{
    hasBooking: boolean;
    leadId: string;
  } | null>(null);
  const [isSendingReschedule, setIsSendingReschedule] = useState(false);
  const [rescheduleEmailSent, setRescheduleEmailSent] = useState(false);

  // GeoIP detected country (for analytics - track origin vs selected country)
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(
    null
  );

  // Handle browser back button for country not available state
  useEffect(() => {
    const handlePopState = () => {
      if (showCountryNotAvailable) {
        setShowCountryNotAvailable(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showCountryNotAvailable]);

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
        if (result.countryCode) {
          // Store detected country for analytics (spam detection, origin tracking)
          setDetectedCountryCode(result.countryCode);
          // Pre-fill form if no country selected yet
          if (!countryValue) {
            setValue("country_code", result.countryCode);
          }
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

  // Get country preposition based on locale (e.g., "au", "en", "aux")
  const getCountryPreposition = (country: Country) => {
    return locale === "fr"
      ? country.country_preposition_fr || "en"
      : country.country_preposition_en || "in";
  };

  // Form submission
  const onSubmit = useCallback(
    async (data: FormData) => {
      // Reset existing booking state
      setExistingBooking(null);
      setRescheduleEmailSent(false);

      // Check if country is operational
      const country = countries.find(
        (c) => c.country_code === data.country_code
      );

      if (!country) {
        setError("country_code", { message: "Please select a valid country" });
        return;
      }

      // If country is NOT operational, send email and show message (V6.3)
      // The email contains the opt-in button, not the website
      if (!country.is_operational) {
        setIsSubmitting(true);
        setApiError(null);

        try {
          // Send email with opt-in link (pending waitlist entry)
          const response = await fetch("/api/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.email.toLowerCase().trim(),
              country_code: data.country_code,
              detected_country_code: detectedCountryCode, // GeoIP origin for analytics/spam detection
              locale,
              marketing_consent: false, // Pending - will be true when they click in email
              ...utmParams, // UTM tracking
            }),
          });

          const result = await response.json();

          if (result.success || result.error?.code === "ALREADY_ON_WAITLIST") {
            // Show country not available message (email was sent)
            setShowCountryNotAvailable(true);
          } else {
            setApiError({
              code: result.error?.code || "EMAIL_ERROR",
              message: result.error?.message || "Failed to send email",
            });
          }
        } catch {
          setApiError({
            code: "NETWORK_ERROR",
            message: t("bookDemo.step1.errors.generic"),
          });
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Country is operational - check if email already has a booking
      setIsSubmitting(true);
      setApiError(null);

      try {
        // V6.2.4: Check if email exists with booking
        const checkEmailResponse = await fetch(
          `/api/crm/leads/check-email?email=${encodeURIComponent(data.email.toLowerCase().trim())}`
        );
        const checkEmailResult = await checkEmailResponse.json();

        if (checkEmailResult.success && checkEmailResult.data) {
          const { exists, hasBooking, leadId } = checkEmailResult.data;

          // CAS 2: Email exists WITH booking → show reschedule option
          if (exists && hasBooking && leadId) {
            setExistingBooking({ hasBooking: true, leadId });
            setIsSubmitting(false);
            return;
          }

          // CAS 1 & CAS 3: Email doesn't exist OR exists without booking → normal flow
        }

        // Proceed with normal flow
        const response = await fetch("/api/crm/demo-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "wizard_step1",
            email: data.email.toLowerCase().trim(),
            country_code: data.country_code,
            locale,
            ...utmParams, // UTM tracking
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
    [countries, detectedCountryCode, locale, router, setError, t, utmParams]
  );

  // Send reschedule link
  const handleSendRescheduleLink = async () => {
    if (!emailValue) return;

    setIsSendingReschedule(true);
    setApiError(null);

    try {
      const response = await fetch("/api/crm/leads/send-reschedule-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailValue.toLowerCase().trim(),
          locale,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRescheduleEmailSent(true);
      } else {
        const errorCode = result.error?.code || "RESCHEDULE_ERROR";
        const errorMessage =
          errorCode === "RESEND_TESTING_MODE"
            ? t("bookDemo.step1.existingBooking.testingModeError")
            : result.error?.message || t("bookDemo.step1.errors.generic");

        setApiError({
          code: errorCode,
          message: errorMessage,
        });
      }
    } catch {
      setApiError({
        code: "NETWORK_ERROR",
        message: t("bookDemo.step1.errors.generic"),
      });
    } finally {
      setIsSendingReschedule(false);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Progress Bar - Only show for wizard flow (not for country not available) */}
        {!showCountryNotAvailable && (
          <WizardProgressBar currentStep={1} totalSteps={3} className="mb-6" />
        )}

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-800/50 dark:shadow-none">
          <AnimatePresence mode="wait">
            {existingBooking ? (
              // ============================================================
              // EXISTING BOOKING (V6.2.4 - Email already has a booking)
              // ============================================================
              <motion.div
                key="existing-booking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                {rescheduleEmailSent ? (
                  // Email sent confirmation
                  <>
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
                      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
                    </div>
                    <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                      {t("bookDemo.step1.existingBooking.emailSent")}
                    </h2>
                    <p className="mb-6 text-gray-600 dark:text-slate-400">
                      {t("bookDemo.step1.existingBooking.emailSentMessage")}
                    </p>
                    <button
                      onClick={() => {
                        setExistingBooking(null);
                        setRescheduleEmailSent(false);
                      }}
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {t("bookDemo.waitlist.goBack", {
                        defaultValue: "Go back",
                      })}
                    </button>
                  </>
                ) : (
                  // Show existing booking message with reschedule option
                  <>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
                      <Calendar className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                      {t("bookDemo.step1.existingBooking.title")}
                    </h2>
                    <p className="mb-2 text-gray-600 dark:text-slate-400">
                      {t("bookDemo.step1.existingBooking.message")}
                    </p>
                    <p className="mb-6 text-sm text-gray-500 dark:text-slate-500">
                      {t("bookDemo.step1.existingBooking.contact")}{" "}
                      <a
                        href={`mailto:${t("bookDemo.step1.existingBooking.supportEmail")}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {t("bookDemo.step1.existingBooking.supportEmail")}
                      </a>
                    </p>

                    {/* Reschedule section */}
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                      <p className="mb-4 text-sm text-blue-700 dark:text-blue-300">
                        {t("bookDemo.step1.existingBooking.reschedulePrompt")}
                      </p>
                      <button
                        onClick={handleSendRescheduleLink}
                        disabled={isSendingReschedule}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSendingReschedule ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("bookDemo.step1.existingBooking.sending")}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            {t(
                              "bookDemo.step1.existingBooking.rescheduleButton"
                            )}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* API Error */}
                    {apiError && (
                      <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {apiError.message}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setExistingBooking(null);
                        setApiError(null);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {t("bookDemo.waitlist.goBack", {
                        defaultValue: "Go back",
                      })}
                    </button>
                  </>
                )}
              </motion.div>
            ) : showCountryNotAvailable ? (
              // ============================================================
              // COUNTRY NOT AVAILABLE (V6.3 - message only, opt-in via email)
              // ============================================================
              <motion.div
                key="country-not-available"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                {/* Confirmation icon */}
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
                  <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>

                {/* Country info */}
                <p className="mb-2 text-sm text-gray-500 dark:text-slate-500">
                  {t("bookDemo.waitlist.notAvailableMessage")}{" "}
                  {selectedCountry && getCountryPreposition(selectedCountry)}{" "}
                  <strong className="text-gray-700 dark:text-slate-300">
                    {selectedCountry
                      ? getCountryName(selectedCountry)
                      : countryValue}
                  </strong>
                </p>

                {/* Main message */}
                <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                  {t("bookDemo.waitlist.emailRegistered")}
                </h2>

                {/* Sub message */}
                <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
                  {t("bookDemo.waitlist.emailSentInfo")}
                </p>

                {/* Email reminder */}
                <div className="mb-6 rounded-lg bg-gray-50 px-4 py-3 dark:bg-slate-700/50">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {emailValue}
                  </p>
                </div>

                {/* API Error */}
                {apiError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {apiError.message}
                    </p>
                  </div>
                )}

                {/* Back to home */}
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {t("bookDemo.backToHome")}
                </Link>
              </motion.div>
            ) : (
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
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
