/**
 * Book Demo Wizard - Confirmation Page
 *
 * V6.2.2 - Display booking confirmation with animated success state
 *
 * URL: /[locale]/book-demo/confirmation?leadId=xxx
 *
 * Features:
 * - Animated check icon (Framer Motion)
 * - Booking date/time display
 * - Email confirmation notice
 * - Add to Calendar buttons (Google, Apple, Outlook)
 * - Cal.com reschedule link
 * - i18n (en/fr)
 *
 * @module app/[locale]/(public)/book-demo/confirmation/page
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Mail,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { AddToCalendarButtons } from "@/components/booking/AddToCalendarButtons";

// ============================================================================
// TYPES
// ============================================================================

interface ConfirmationData {
  lead: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  };
  booking: {
    dateTime: string | null;
    calcomUid: string | null;
    rescheduleUrl: string | null;
  };
  status: string;
}

interface APIResponse {
  success: boolean;
  data?: ConfirmationData;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEMO_DURATION_MINUTES = 20;
const CALCOM_LINK = process.env.NEXT_PUBLIC_CALCOM_LINK || "fleetcore/30min";

// ============================================================================
// COMPONENT
// ============================================================================

export default function BookDemoConfirmationPage() {
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
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  // Redirect if missing leadId
  useEffect(() => {
    if (!leadId) {
      router.replace(`/${locale}/book-demo`);
    }
  }, [leadId, locale, router]);

  // Fetch confirmation details
  useEffect(() => {
    if (!leadId) return;

    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/crm/leads/${leadId}/confirmation-details`
        );
        const result: APIResponse = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error?.message || "Failed to load confirmation");
        }
      } catch (_err) {
        setError("Network error");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [leadId]);

  // Listen for Cal.com postMessage events (reschedule success)
  useEffect(() => {
    if (!showRescheduleModal) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const eventData = event.data;

        // Cal.com booking successful events
        if (eventData?.type === "CAL:bookingSuccessful") {
          setRescheduleSuccess(true);
          setShowRescheduleModal(false);
          return;
        }

        // Route change to booking confirmation
        if (
          eventData?.type === "__routeChanged" &&
          typeof eventData?.data === "string" &&
          eventData.data.includes("/booking/")
        ) {
          setRescheduleSuccess(true);
          setShowRescheduleModal(false);
          return;
        }

        // Cal namespace events
        if (eventData?.["Cal.namespace"]) {
          const type = eventData.type || eventData.action;
          if (
            type === "bookingSuccessful" ||
            type === "rescheduleBookingSuccessful"
          ) {
            setRescheduleSuccess(true);
            setShowRescheduleModal(false);
            return;
          }
        }
      } catch {
        // Ignore parsing errors
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [showRescheduleModal]);

  // Cal.com origin for reschedule iframe
  const calcomOrigin =
    process.env.NEXT_PUBLIC_CALCOM_ORIGIN || "https://app.cal.eu";

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
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
            {t("bookDemo.step2.error")}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">{error}</p>
          <Link
            href={`/${locale}/book-demo`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t("bookDemo.backToHome")}
          </Link>
        </div>
      </div>
    );
  }

  // Parse booking date
  const bookingDate = data?.booking.dateTime
    ? new Date(data.booking.dateTime)
    : null;
  const bookingEndDate = bookingDate
    ? new Date(bookingDate.getTime() + DEMO_DURATION_MINUTES * 60 * 1000)
    : null;

  // Format date for display
  const formattedDate = bookingDate
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(bookingDate)
    : null;

  const formattedTime = bookingDate
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(bookingDate)
    : null;

  // Calendar event for Add to Calendar buttons
  const calendarEvent =
    bookingDate && bookingEndDate
      ? {
          title: "FleetCore Demo",
          description: `Personalized demo with FleetCore fleet expert.\n\nCompany: ${data?.lead.companyName || "N/A"}\nEmail: ${data?.lead.email}`,
          startTime: bookingDate,
          endTime: bookingEndDate,
          location: "Phone call",
        }
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 py-8 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Success Card */}
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8 dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm">
          {/* Animated Check Icon */}
          <div className="mb-6 flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.4,
                }}
              >
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </motion.div>
            </motion.div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6 text-center"
          >
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              {t("bookDemo.confirmation.title")}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-slate-400">
              {t("bookDemo.confirmation.subtitle")}
            </p>
          </motion.div>

          {/* Booking Details */}
          {bookingDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-6 rounded-xl bg-gray-100 p-4 dark:bg-slate-700/50"
            >
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-slate-600">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Date
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formattedDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Time
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formattedTime} ({DEMO_DURATION_MINUTES} min)
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Email Confirmation Notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-6 flex items-start gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-500/10"
          >
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                {t("bookDemo.confirmation.checkEmail")}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                {data?.lead.email}
              </p>
            </div>
          </motion.div>

          {/* What Happens Next */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-6"
          >
            <h2 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400">
              {t("bookDemo.confirmation.whatNext")}
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 dark:bg-green-500/20 dark:text-green-400">
                  1
                </span>
                <span className="text-sm text-gray-700 dark:text-slate-300">
                  {t("bookDemo.confirmation.step1")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 dark:bg-green-500/20 dark:text-green-400">
                  2
                </span>
                <span className="text-sm text-gray-700 dark:text-slate-300">
                  {t("bookDemo.confirmation.step2")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 dark:bg-green-500/20 dark:text-green-400">
                  3
                </span>
                <span className="text-sm text-gray-700 dark:text-slate-300">
                  {t("bookDemo.confirmation.step3")}
                </span>
              </li>
            </ul>
          </motion.div>

          {/* Add to Calendar Buttons */}
          {calendarEvent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mb-6"
            >
              <h2 className="mb-3 text-center text-sm font-medium text-gray-500 dark:text-slate-400">
                {t("bookDemo.confirmation.addToCalendar")}
              </h2>
              <AddToCalendarButtons event={calendarEvent} />
            </motion.div>
          )}

          {/* Reschedule Button */}
          {data?.booking.calcomUid && !rescheduleSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mb-6 text-center"
            >
              <button
                type="button"
                onClick={() => setShowRescheduleModal(true)}
                className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                <RefreshCw className="h-4 w-4" />
                {locale === "fr" ? "Reprogrammer" : "Reschedule"}
              </button>
            </motion.div>
          )}

          {/* Reschedule Success Message */}
          {rescheduleSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-lg bg-green-50 p-4 text-center dark:bg-green-500/10"
            >
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-300">
                {locale === "fr"
                  ? "Votre réservation a été modifiée avec succès !"
                  : "Your booking has been updated successfully!"}
              </p>
            </motion.div>
          )}

          {/* Back to Homepage */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Link
              href={`/${locale}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t("bookDemo.confirmation.backToHome")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Reschedule Modal */}
      {showRescheduleModal && data?.booking.calcomUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-800"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {locale === "fr"
                  ? "Modifier votre réservation"
                  : "Modify Your Booking"}
              </h2>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Cal.com Reschedule Iframe */}
            <div className="h-[500px] w-full overflow-hidden">
              <iframe
                src={`${calcomOrigin}/${CALCOM_LINK}?rescheduleUid=${data.booking.calcomUid}&embed=true&theme=light`}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                title="Reschedule Booking"
                allow="camera; microphone"
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 text-center dark:border-slate-700">
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {locale === "fr"
                  ? "Planification via Cal.com"
                  : "Scheduling powered by Cal.com"}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
