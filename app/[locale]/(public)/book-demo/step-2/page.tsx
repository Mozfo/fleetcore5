/**
 * Book Demo Wizard - Step 2: Cal.com Booking
 *
 * V6.2.4 - Demo booking via Cal.com INLINE embed.
 *
 * URL: /[locale]/book-demo/step-2?leadId=xxx
 *
 * Prerequisites:
 * - Lead must have email_verified = true
 *
 * Flow:
 * 1. Fetch lead data to verify prerequisites
 * 2. Display Cal.com INLINE embed with pre-filled email
 * 3. After booking → redirect to step-3 (business info)
 *
 * @module app/[locale]/(public)/book-demo/step-2/page
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

// ============================================================================
// CONSTANTS
// ============================================================================

// Cal.com event links per locale (each has interfaceLanguage forced server-side)
const CALCOM_LINKS: Record<string, string> = {
  en: "fleetcore/30min",
  fr: "fleetcore/30min-fr",
};
const CALCOM_ORIGIN =
  process.env.NEXT_PUBLIC_CALCOM_ORIGIN || "https://app.cal.eu";

// Country to timezone mapping (for Cal.com)
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

export default function BookDemoStep2Page() {
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

  // Ref to track if Cal.com has been initialized (prevents re-initialization)
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
            // Redirect to verification
            router.replace(
              `/${locale}/book-demo/verify?leadId=${leadId}&email=${encodeURIComponent(result.lead.email)}`
            );
            return;
          }

          // CRITICAL: If booking already exists, redirect to step 3
          // This prevents multiple bookings
          if (result.data?.hasBooking) {
            router.replace(`/${locale}/book-demo/step-3?leadId=${leadId}`);
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
  // IMPORTANT: Only initialize ONCE to prevent Cal.com embed from resetting
  useEffect(() => {
    // Skip if already initialized or still loading
    if (calInitializedRef.current || isLoading || !leadData) {
      return;
    }

    const initCal = async () => {
      try {
        const cal = await getCalApi({ namespace: "fleetcore-inline" });

        // Listen for booking success
        // Name is captured via webhook (custom payload), not from this callback
        cal("on", {
          action: "bookingSuccessful",
          callback: () => {
            setHasBooking(true);
            setIsRedirecting(true);

            // Redirect to step 3 after short delay
            // Webhook will have already updated the lead with name from Cal.com
            setTimeout(() => {
              if (leadId) {
                router.push(`/${locale}/book-demo/step-3?leadId=${leadId}`);
              }
            }, 2000);
          },
        });

        // Mark as initialized to prevent future re-initialization
        calInitializedRef.current = true;
      } catch {
        // Cal.com initialization failed silently
      }
    };

    void initCal();
  }, [isLoading, leadData, leadId, locale, router]);

  // Poll for booking status (backup in case event doesn't fire)
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

  // Don't render if missing leadId
  if (!leadId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
    <div className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-4xl">
        {/* Progress Bar - Step 2 of 3 */}
        <WizardProgressBar currentStep={2} totalSteps={3} className="mb-6" />

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
              <Calendar className="h-7 w-7 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("bookDemo.step2.title")}
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {t("bookDemo.step2.subtitle")}
              </p>
            </div>
          </div>

          {/* Booking Success Indicator */}
          {hasBooking && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-500/10 dark:text-green-400"
            >
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{t("bookDemo.step2.booked")}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Cal.com Inline Embed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm"
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
              // Pre-fill email from lead
              ...(leadData?.email && { email: leadData.email }),
              // Pre-fill name if available
              ...(leadData?.first_name &&
                leadData?.last_name && {
                  name: `${leadData.first_name} ${leadData.last_name}`,
                }),
              // Set timezone based on country selected in step 1
              ...(leadData?.country_code &&
                COUNTRY_TIMEZONES[leadData.country_code] && {
                  timezone: COUNTRY_TIMEZONES[leadData.country_code],
                }),
            }}
          />
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 flex items-center justify-between"
        >
          <Link
            href={`/${locale}/book-demo/verify?leadId=${leadId}&email=${encodeURIComponent(leadData?.email || "")}`}
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
