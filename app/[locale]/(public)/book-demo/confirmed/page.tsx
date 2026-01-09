/**
 * Book Demo Wizard - Confirmed Page (J-1 Email Click)
 *
 * V6.2.6 - Display confirmation when lead clicks "I'll be there" in J-1 email
 *
 * URL: /[locale]/book-demo/confirmed?token=xxx
 *
 * Features:
 * - Animated party emoji
 * - Personalized thank you message
 * - What to prepare list
 * - Reschedule link
 * - i18n (en/fr)
 *
 * @module app/[locale]/(public)/book-demo/confirmed/page
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  PartyPopper,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Phone,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface ConfirmationData {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string;
  bookingSlotAt: string | null;
  bookingCalcomUid: string | null;
  rescheduleUrl: string | null;
  alreadyConfirmed: boolean;
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
// COMPONENT
// ============================================================================

export default function BookDemoConfirmedPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  // Query params
  const token = searchParams.get("token");

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
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Redirect if missing token
  useEffect(() => {
    if (!token) {
      router.replace(`/${locale}`);
    }
  }, [token, locale, router]);

  // Confirm attendance on mount
  useEffect(() => {
    if (!token) return;

    const confirmAttendance = async () => {
      try {
        const response = await fetch(
          `/api/crm/leads/confirm-attendance?token=${encodeURIComponent(token)}`
        );
        const result: APIResponse = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error?.message || "Failed to confirm");
          setErrorCode(result.error?.code || "UNKNOWN");
        }
      } catch (_err) {
        setError("Network error");
        setErrorCode("NETWORK_ERROR");
      } finally {
        setIsLoading(false);
      }
    };

    void confirmAttendance();
  }, [token]);

  // Don't render if missing token
  if (!token) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600 dark:text-slate-400">
            {t("bookDemo.confirmed.loading")}
          </p>
        </div>
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
            {errorCode === "INVALID_TOKEN"
              ? t("bookDemo.confirmed.invalidToken")
              : error}
          </h1>
          <Link
            href={`/${locale}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t("bookDemo.backToHome")}
          </Link>
        </div>
      </div>
    );
  }

  // Parse booking date
  const bookingDate = data?.bookingSlotAt ? new Date(data.bookingSlotAt) : null;

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

  // Get display name
  const displayName = data?.firstName || data?.email?.split("@")[0] || "there";
  const companyName = data?.companyName || "your company";

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
          {/* Animated Party Emoji */}
          <div className="mb-6 flex justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-500/20"
            >
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.8,
                  ease: "easeInOut",
                }}
              >
                <PartyPopper className="h-12 w-12 text-yellow-500 dark:text-yellow-400" />
              </motion.div>
            </motion.div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 text-center"
          >
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              {t("bookDemo.confirmed.title")}
            </h1>
          </motion.div>

          {/* Already Confirmed Notice */}
          {data?.alreadyConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-green-50 p-4 dark:bg-green-500/10"
            >
              <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-300">
                {t("bookDemo.confirmed.alreadyConfirmed")}
              </span>
            </motion.div>
          )}

          {/* Personalized Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6 text-center"
          >
            <p className="text-lg text-gray-700 dark:text-slate-300">
              {t("bookDemo.confirmed.thanks", { firstName: displayName })}
            </p>
            <p className="mt-2 text-gray-600 dark:text-slate-400">
              {t("bookDemo.confirmed.preparing", { companyName })}
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
                    {formattedTime}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* What to Prepare */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-6"
          >
            <h2 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400">
              {t("bookDemo.confirmed.whatToPrepare")}
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-slate-300">
                  {t("bookDemo.confirmed.prepare1")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20">
                  <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-slate-300">
                  {t("bookDemo.confirmed.prepare2")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-slate-300">
                  {t("bookDemo.confirmed.prepare3")}
                </span>
              </li>
            </ul>
          </motion.div>

          {/* Reschedule Link */}
          {data?.rescheduleUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-slate-600 dark:bg-slate-700/30"
            >
              <p className="mb-3 text-sm text-gray-600 dark:text-slate-400">
                {t("bookDemo.confirmed.reschedule")}
              </p>
              <a
                href={data.rescheduleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
              >
                <RefreshCw className="h-4 w-4" />
                {t("bookDemo.confirmed.rescheduleButton")}
              </a>
            </motion.div>
          )}

          {/* Back to Homepage */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Link
              href={`/${locale}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t("bookDemo.backToHome")}
            </Link>
          </motion.div>
        </div>

        {/* Footer */}
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
