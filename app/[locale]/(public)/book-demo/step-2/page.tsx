/**
 * Book Demo Wizard - Step 2: Cal.com Booking
 *
 * V6.2.2 - Demo booking via Cal.com embed.
 *
 * URL: /[locale]/book-demo/step-2?leadId=xxx
 *
 * Prerequisites:
 * - Lead must have email_verified = true
 * - If not verified → redirect to /book-demo/verify
 *
 * Flow:
 * 1. Fetch lead data to verify email is verified
 * 2. Display Cal.com embed with pre-filled email
 * 3. After booking, Cal.com webhook updates lead status
 * 4. User clicks Continue → redirect to step-3
 *
 * @module app/[locale]/(public)/book-demo/step-2/page
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Calendar,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { WizardProgressBar } from "@/components/booking/WizardProgressBar";

// Dynamic import for Cal.com embed to avoid SSR issues
const Cal = dynamic(
  () => import("@calcom/embed-react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-lg bg-slate-900/50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    ),
  }
);

// ============================================================================
// TYPES
// ============================================================================

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

// Cal.com link - can be overridden via env
const CALCOM_LINK = process.env.NEXT_PUBLIC_CALCOM_LINK || "fleetcore/demo";

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
  const [isCheckingBooking, setIsCheckingBooking] = useState(false);
  const [calLoaded, setCalLoaded] = useState(false);

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

          setLeadData(result.lead);
          setHasBooking(result.data?.hasBooking || false);
        } else {
          setLoadError(result.error?.message || "Failed to load");
        }
      } catch (_err) {
        setLoadError("Network error");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLead();
  }, [leadId, locale, router]);

  // Initialize Cal.com UI
  useEffect(() => {
    if (!calLoaded) return;

    const initCal = async () => {
      try {
        const { getCalApi } = await import("@calcom/embed-react");
        const cal = await getCalApi();
        cal("ui", {
          theme: "dark",
          styles: { branding: { brandColor: "#3b82f6" } },
          hideEventTypeDetails: false,
        });
      } catch {
        // Cal.com initialization failed - embed will still work
      }
    };

    void initCal();
  }, [calLoaded]);

  // Check booking status
  const checkBookingStatus = useCallback(async () => {
    if (!leadId) return;

    setIsCheckingBooking(true);
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/booking-status`);
      const result: BookingStatusResponse = await response.json();

      if (result.success && result.data) {
        setHasBooking(result.data.hasBooking);
        if (result.data.canProceed) {
          // Proceed to step 3
          router.push(`/${locale}/book-demo/step-3?leadId=${leadId}`);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setIsCheckingBooking(false);
    }
  }, [leadId, locale, router]);

  // Handle continue button
  const handleContinue = useCallback(async () => {
    if (!leadId) return;

    setIsCheckingBooking(true);
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/booking-status`);
      const result: BookingStatusResponse = await response.json();

      if (result.success && result.data?.canProceed) {
        router.push(`/${locale}/book-demo/step-3?leadId=${leadId}`);
      } else {
        // Show message that booking is required
        setHasBooking(false);
      }
    } catch {
      // Allow proceeding anyway in case of network issues
      router.push(`/${locale}/book-demo/step-3?leadId=${leadId}`);
    } finally {
      setIsCheckingBooking(false);
    }
  }, [leadId, locale, router]);

  // Poll for booking status periodically (Cal.com doesn't have client-side events)
  useEffect(() => {
    if (!leadId || !calLoaded || hasBooking) return;

    // Poll every 5 seconds to check if booking was made
    const interval = setInterval(() => {
      void checkBookingStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [leadId, calLoaded, hasBooking, checkBookingStatus]);

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
            {t("bookDemo.step2.error")}
          </h1>
          <p className="mt-2 text-slate-400">{loadError}</p>
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        {/* Progress Bar */}
        <WizardProgressBar currentStep={2} totalSteps={3} className="mb-8" />

        {/* Card */}
        <div className="rounded-2xl bg-slate-800/50 p-6 backdrop-blur-sm sm:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {t("bookDemo.step2.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {t("bookDemo.step2.subtitle")}
            </p>
          </div>

          {/* Booking Success Indicator */}
          {hasBooking && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-400"
            >
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{t("bookDemo.step2.booked")}</span>
            </motion.div>
          )}

          {/* Cal.com Embed */}
          <div className="mb-6 overflow-hidden rounded-lg">
            <Cal
              calLink={CALCOM_LINK}
              style={{
                width: "100%",
                height: "500px",
                overflow: "scroll",
              }}
              config={{
                layout: "month_view",
                theme: "dark",
                ...(leadData?.email && { email: leadData.email }),
                ...(leadData?.first_name &&
                  leadData?.last_name && {
                    name: `${leadData.first_name} ${leadData.last_name}`,
                  }),
              }}
              onLoad={() => setCalLoaded(true)}
            />
          </div>

          {/* After Booking Instructions */}
          <p className="mb-6 text-center text-sm text-slate-400">
            {t("bookDemo.step2.afterBooking")}
          </p>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Link
              href={`/${locale}/book-demo/verify?leadId=${leadId}&email=${encodeURIComponent(leadData?.email || "")}`}
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("bookDemo.step2.back")}
            </Link>

            <button
              type="button"
              onClick={handleContinue}
              disabled={isCheckingBooking}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-all ${
                hasBooking
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isCheckingBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("bookDemo.step2.checking")}
                </>
              ) : (
                <>
                  {t("bookDemo.step2.continue")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* No Booking Warning */}
          {!hasBooking && !isCheckingBooking && (
            <p className="mt-4 text-center text-sm text-amber-400">
              {t("bookDemo.step2.noBooking")}
            </p>
          )}
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
