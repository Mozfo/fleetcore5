/**
 * Book Demo Wizard - Step 4: Schedule (Cal.com Booking)
 *
 * V6.6.1 - Radio button UX: booking vs callback visible immediately.
 * No textarea, zero friction.
 *
 * URL: /[locale]/book-demo/schedule?leadId=xxx
 *
 * Prerequisites:
 * - Lead must have email_verified = true
 * - Lead must have wizard_completed = true (profile filled)
 *
 * Flow:
 * 1. User picks contact mode (radio: booking / callback)
 * 2. booking → Cal.com inline embed
 * 3. callback → single button, no notes
 *
 * @module app/[locale]/(public)/book-demo/schedule/page
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Calendar,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Phone,
} from "lucide-react";
import Link from "next/link";
import Cal, { getCalApi } from "@calcom/embed-react";
import { WizardProgressBar } from "@/components/booking/WizardProgressBar";

// ============================================================================
// TYPES
// ============================================================================

interface LeadData {
  id: string;
  email: string;
  email_verified: boolean;
  first_name: string | null;
  last_name: string | null;
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

type ContactMode = "booking" | "callback";

// ============================================================================
// CONSTANTS
// ============================================================================

// Cal.com event links per locale
const CALCOM_LINKS: Record<string, string> = {
  en: "fleetcore/30min",
  fr: "fleetcore/30min-fr",
};
const CALCOM_ORIGIN =
  process.env.NEXT_PUBLIC_CALCOM_ORIGIN || "https://app.cal.eu";

// Country to timezone mapping
const COUNTRY_TIMEZONES: Record<string, string> = {
  FR: "Europe/Paris",
  AE: "Asia/Dubai",
  SA: "Asia/Riyadh",
  QA: "Asia/Qatar",
  KW: "Asia/Kuwait",
  BH: "Asia/Bahrain",
  OM: "Asia/Muscat",
  MA: "Africa/Casablanca",
  TN: "Africa/Tunis",
  DZ: "Africa/Algiers",
  EG: "Africa/Cairo",
  BE: "Europe/Brussels",
  CH: "Europe/Zurich",
  LU: "Europe/Luxembourg",
  DE: "Europe/Berlin",
  GB: "Europe/London",
  ES: "Europe/Madrid",
  IT: "Europe/Rome",
  NL: "Europe/Amsterdam",
  PT: "Europe/Lisbon",
  US: "America/New_York",
  CA: "America/Toronto",
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function BookDemoSchedulePage() {
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasBooking, setHasBooking] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Contact mode
  const [contactMode, setContactMode] = useState<ContactMode>("booking");
  const [isSubmittingCallback, setIsSubmittingCallback] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  // Ref to track if Cal.com has been initialized
  const calInitializedRef = useRef(false);

  // Redirect if missing leadId
  useEffect(() => {
    if (!leadId) {
      router.replace(`/${locale}/book-demo`);
    }
  }, [leadId, locale, router]);

  // Fetch lead data on mount
  useEffect(() => {
    if (!leadId) return;

    const fetchLead = async () => {
      try {
        const response = await fetch(`/api/crm/leads/${leadId}/booking-status`);
        const result: BookingStatusResponse = await response.json();

        if (result.success && result.lead) {
          // Check if email is verified
          if (!result.lead.email_verified) {
            router.replace(
              `/${locale}/book-demo/verify?leadId=${leadId}&email=${encodeURIComponent(result.lead.email)}`
            );
            return;
          }

          // If booking already exists, redirect to confirmation
          if (result.data?.hasBooking) {
            router.replace(
              `/${locale}/book-demo/confirmation?leadId=${leadId}`
            );
            return;
          }

          setLeadData(result.lead);
          setHasBooking(false);
        } else {
          setLoadError(result.error?.message || "Failed to load");
        }
      } catch {
        setLoadError("Network error");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLead();
  }, [leadId, locale, router]);

  // Initialize Cal.com and listen for booking events
  useEffect(() => {
    if (calInitializedRef.current || isLoading || !leadData) {
      return;
    }

    const initCal = async () => {
      try {
        const cal = await getCalApi({ namespace: "fleetcore-inline" });

        // Listen for booking success → redirect to confirmation
        cal("on", {
          action: "bookingSuccessful",
          callback: () => {
            setHasBooking(true);
            setIsRedirecting(true);

            setTimeout(() => {
              if (leadId) {
                router.push(
                  `/${locale}/book-demo/confirmation?leadId=${leadId}`
                );
              }
            }, 2000);
          },
        });

        calInitializedRef.current = true;
      } catch {
        // Cal.com initialization failed silently
      }
    };

    void initCal();
  }, [isLoading, leadData, leadId, locale, router]);

  // Poll for booking status (backup)
  const checkBookingStatus = useCallback(async () => {
    if (!leadId || hasBooking) return;

    try {
      const response = await fetch(`/api/crm/leads/${leadId}/booking-status`);
      const result: BookingStatusResponse = await response.json();

      if (result.success && result.data?.hasBooking) {
        setHasBooking(true);
      }
    } catch {
      // Silently fail
    }
  }, [leadId, hasBooking]);

  // Poll every 10 seconds as backup
  useEffect(() => {
    if (!leadId || hasBooking || isLoading) return;

    const interval = setInterval(() => {
      void checkBookingStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [leadId, hasBooking, isLoading, checkBookingStatus]);

  // Handle callback request
  const handleRequestCallback = useCallback(async () => {
    if (!leadId || isSubmittingCallback) return;

    setIsSubmittingCallback(true);
    setCallbackError(null);

    try {
      const response = await fetch(
        `/api/crm/leads/${leadId}/request-callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (result.success) {
        router.push(
          `/${locale}/book-demo/confirmation?leadId=${leadId}&type=callback`
        );
      } else {
        setCallbackError(
          result.error?.message || t("bookDemo.step2.callbackError")
        );
      }
    } catch {
      setCallbackError(t("bookDemo.step2.callbackError"));
    } finally {
      setIsSubmittingCallback(false);
    }
  }, [leadId, locale, router, t, isSubmittingCallback]);

  // Don't render if missing leadId
  if (!leadId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
            {t("bookDemo.step2.error")}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">{loadError}</p>
          <Link
            href={`/${locale}/book-demo`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("bookDemo.step2.back")}
          </Link>
        </div>
      </div>
    );
  }

  // Redirecting state after booking
  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {locale === "fr" ? "Réservation confirmée !" : "Booking confirmed!"}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            {locale === "fr" ? "Redirection en cours..." : "Redirecting..."}
          </p>
          <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="mx-auto w-full">
        {/* Progress Bar - Step 4 of 4 */}
        <WizardProgressBar currentStep={4} totalSteps={4} className="mb-6" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("bookDemo.step2.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            {t("bookDemo.step2.subtitle")}
          </p>
        </motion.div>

        {/* Contact Mode Selection - Radio Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6 space-y-3"
        >
          {/* Option 1: Book a time slot */}
          <label
            className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all ${
              contactMode === "booking"
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
            }`}
          >
            <input
              type="radio"
              name="contactMode"
              value="booking"
              checked={contactMode === "booking"}
              onChange={() => {
                setContactMode("booking");
                setCallbackError(null);
              }}
              className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t("bookDemo.step2.optionBooking", {
                    defaultValue: "Book a time slot",
                  })}
                </div>
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  {t("bookDemo.step2.optionBookingDesc", {
                    defaultValue:
                      "Choose a convenient time for your personalized demo",
                  })}
                </div>
              </div>
            </div>
          </label>

          {/* Option 2: Request a callback */}
          <label
            className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all ${
              contactMode === "callback"
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
            }`}
          >
            <input
              type="radio"
              name="contactMode"
              value="callback"
              checked={contactMode === "callback"}
              onChange={() => {
                setContactMode("callback");
                setCallbackError(null);
              }}
              className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t("bookDemo.step2.optionCallback", {
                    defaultValue: "Request a callback",
                  })}
                </div>
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  {t("bookDemo.step2.optionCallbackDesc", {
                    defaultValue: "We'll call you as soon as possible",
                  })}
                </div>
              </div>
            </div>
          </label>
        </motion.div>

        {/* Conditional Content */}
        {contactMode === "booking" ? (
          <>
            {/* Booking Success Indicator */}
            {hasBooking && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-500/10 dark:text-green-400"
              >
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  {t("bookDemo.step2.booked")}
                </span>
              </motion.div>
            )}

            {/* Cal.com Inline Embed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm"
            >
              <Cal
                namespace="fleetcore-inline"
                calLink={CALCOM_LINKS[locale] || CALCOM_LINKS.en}
                calOrigin={CALCOM_ORIGIN}
                style={{ width: "100%", height: "100%", overflow: "auto" }}
                config={{
                  layout: "month_view",
                  theme: "auto",
                  locale: locale,
                  ...(leadData?.email && { email: leadData.email }),
                  ...(leadData?.first_name &&
                    leadData?.last_name && {
                      name: `${leadData.first_name} ${leadData.last_name}`,
                    }),
                  ...(leadData?.country_code &&
                    COUNTRY_TIMEZONES[leadData.country_code] && {
                      timezone: COUNTRY_TIMEZONES[leadData.country_code],
                    }),
                }}
              />
            </motion.div>
          </>
        ) : (
          /* Callback mode - single button, no textarea */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
              <Phone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="mb-6 text-sm text-gray-600 dark:text-slate-400">
              {t("bookDemo.step2.optionCallbackDesc", {
                defaultValue: "We'll call you as soon as possible",
              })}
            </p>

            {callbackError && (
              <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{callbackError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRequestCallback}
              disabled={isSubmittingCallback}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmittingCallback ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("bookDemo.step2.callbackSubmitting")}
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  {t("bookDemo.step2.validateCallback")}
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 flex items-center justify-between"
        >
          <Link
            href={`/${locale}/book-demo/profile?leadId=${leadId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("bookDemo.step2.back")}
          </Link>

          <Link
            href={`/${locale}`}
            className="text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
          >
            {t("bookDemo.backToHome")}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
