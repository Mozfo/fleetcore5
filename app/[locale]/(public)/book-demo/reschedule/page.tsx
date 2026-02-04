/**
 * Book Demo - Reschedule Page
 *
 * V6.2.5 - Uses @calcom/embed-react for responsive mobile support
 *
 * Flow:
 * 1. User clicks reschedule link in email
 * 2. Arrives on this page with booking UID
 * 3. Page validates the booking exists
 * 4. Shows Cal.com reschedule embed OR error message
 *
 * @module app/[locale]/(public)/book-demo/reschedule/page
 */

"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Cal, { getCalApi } from "@calcom/embed-react";

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReschedulePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  // Get booking UID from query params
  const bookingUid = searchParams.get("uid");

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingInfo, setBookingInfo] = useState<{
    valid: boolean;
    leadName?: string;
    bookingDate?: string;
  } | null>(null);
  const [rescheduleComplete, setRescheduleComplete] = useState(false);

  // Initialize i18n with correct locale
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  // Validate booking on mount
  useEffect(() => {
    const validateBooking = async () => {
      if (!bookingUid) {
        setError(
          t("bookDemo.reschedule.errors.missingUid", {
            defaultValue:
              "Invalid reschedule link. No booking reference found.",
          })
        );
        setIsLoading(false);
        return;
      }

      try {
        // Validate the booking exists in our system
        const response = await fetch(
          `/api/crm/leads/validate-booking?uid=${encodeURIComponent(bookingUid)}`
        );
        const result = await response.json();

        if (result.success && result.data?.valid) {
          setBookingInfo({
            valid: true,
            leadName: result.data.leadName,
            bookingDate: result.data.bookingDate,
          });
        } else {
          setError(
            t("bookDemo.reschedule.errors.invalidBooking", {
              defaultValue:
                "This booking could not be found or has already been cancelled.",
            })
          );
        }
      } catch {
        setError(
          t("bookDemo.reschedule.errors.generic", {
            defaultValue:
              "Unable to verify your booking. Please try again later.",
          })
        );
      } finally {
        setIsLoading(false);
      }
    };

    void validateBooking();
  }, [bookingUid, t]);

  // Initialize Cal.com embed API and listen for events
  useEffect(() => {
    void (async function () {
      const cal = await getCalApi();
      // Listen for booking success events
      cal("on", {
        action: "bookingSuccessful",
        callback: () => {
          setRescheduleComplete(true);
        },
      });
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:flex md:items-center md:justify-center md:py-4 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-2xl"
      >
        {/* Card */}
        <div className="rounded-2xl bg-white p-4 shadow-xl md:p-8 dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm">
          {isLoading ? (
            // Loading state
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
              <p className="mt-4 text-gray-600 dark:text-slate-400">
                {t("bookDemo.reschedule.loading", {
                  defaultValue: "Verifying your booking...",
                })}
              </p>
            </div>
          ) : error ? (
            // Error state
            <div className="py-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
              </div>
              <h1 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                {t("bookDemo.reschedule.errorTitle", {
                  defaultValue: "Booking Not Found",
                })}
              </h1>
              <p className="mb-6 text-gray-600 dark:text-slate-400">{error}</p>
              <p className="mb-6 text-sm text-gray-500 dark:text-slate-500">
                {t("bookDemo.reschedule.contactSupport", {
                  defaultValue:
                    "If you believe this is an error, please contact",
                })}{" "}
                <a
                  href="mailto:support@fleetcore.io"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  support@fleetcore.io
                </a>
              </p>
              <Link
                href={`/${locale}/book-demo`}
                className="inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("bookDemo.reschedule.bookNew", {
                  defaultValue: "Book a new demo",
                })}
              </Link>
            </div>
          ) : rescheduleComplete ? (
            // Success state
            <div className="py-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
              </div>
              <h1 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                {t("bookDemo.reschedule.successTitle", {
                  defaultValue: "Changes Saved!",
                })}
              </h1>
              <p className="mb-6 text-gray-600 dark:text-slate-400">
                {t("bookDemo.reschedule.successMessage", {
                  defaultValue:
                    "Your booking has been updated. You'll receive a confirmation email shortly.",
                })}
              </p>
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-all hover:bg-blue-700"
              >
                {t("bookDemo.backToHome", { defaultValue: "Back to Homepage" })}
              </Link>
            </div>
          ) : (
            // Cal.com reschedule embed
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
                  <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t("bookDemo.reschedule.title", {
                    defaultValue: "Modify Your Demo",
                  })}
                </h1>
                {bookingInfo?.leadName && (
                  <p className="mt-2 text-gray-600 dark:text-slate-400">
                    {t("bookDemo.reschedule.hello", { defaultValue: "Hello" })},{" "}
                    {bookingInfo.leadName}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-500">
                  {t("bookDemo.reschedule.subtitle", {
                    defaultValue:
                      "Select a new time or cancel your booking below.",
                  })}
                </p>
              </div>

              {/* Cal.com Reschedule Embed - responsive height via @calcom/embed-react */}
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700">
                <Cal
                  calLink={`reschedule/${bookingUid}`}
                  calOrigin={
                    process.env.NEXT_PUBLIC_CALCOM_ORIGIN ||
                    "https://app.cal.eu"
                  }
                  style={{ width: "100%", height: "100%", minHeight: "500px" }}
                  config={{
                    theme: "light",
                    locale: locale,
                  }}
                />
              </div>

              <p className="mt-4 text-center text-xs text-gray-400 dark:text-slate-600">
                {t("bookDemo.reschedule.poweredBy", {
                  defaultValue: "Scheduling powered by Cal.com",
                })}
              </p>
            </>
          )}
        </div>

        {/* Back to home link */}
        {!rescheduleComplete && !error && (
          <div className="mt-6 text-center">
            <Link
              href={`/${locale}`}
              className="text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300"
            >
              {t("bookDemo.backToHome", { defaultValue: "Back to Homepage" })}
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
