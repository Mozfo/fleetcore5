/**
 * Payment Cancelled Page
 *
 * V6.2-9B - Display message when user cancels Stripe checkout
 *
 * URL: /[locale]/payment-cancelled
 *
 * Features:
 * - Friendly cancellation message
 * - Retry payment button
 * - Contact support info
 * - i18n (en/fr)
 *
 * @module app/[locale]/(public)/payment-cancelled/page
 */

"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  XCircle,
  RefreshCw,
  Headphones,
  ArrowRight,
  MessageCircle,
  Clock,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// COMPONENT
// ============================================================================

export default function PaymentCancelledPage() {
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  // Initialize i18n
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 py-8 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Cancelled Card */}
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8 dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm">
          {/* Animated X Icon */}
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
              className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20"
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
                <XCircle className="h-12 w-12 text-amber-500" />
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
              {t("paymentCancelled.title", "Payment Cancelled")}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-slate-400">
              {t(
                "paymentCancelled.subtitle",
                "No worries! Your payment was not processed."
              )}
            </p>
          </motion.div>

          {/* Reassurance Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6 rounded-xl bg-gray-100 p-4 dark:bg-slate-700/50"
          >
            <p className="text-center text-sm text-gray-600 dark:text-slate-300">
              {t(
                "paymentCancelled.noCharge",
                "You have not been charged. Your card information was not saved."
              )}
            </p>
          </motion.div>

          {/* Why You Might Have Cancelled */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-6"
          >
            <h2 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400">
              {t("paymentCancelled.needHelp", "Need help?")}
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("paymentCancelled.questionTitle", "Have questions?")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {t(
                      "paymentCancelled.questionDesc",
                      "Our team is here to answer any questions about pricing or features."
                    )}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-lg bg-purple-50 p-3 dark:bg-purple-500/10">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("paymentCancelled.notReadyTitle", "Not ready yet?")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {t(
                      "paymentCancelled.notReadyDesc",
                      "Your demo booking is still valid. Take your time to decide."
                    )}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-500/10">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t(
                      "paymentCancelled.talkTitle",
                      "Want to talk to someone?"
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {t(
                      "paymentCancelled.talkDesc",
                      "Schedule another demo or chat with our support team."
                    )}
                  </p>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            {/* Retry Payment - Primary */}
            <Link
              href={`/${locale}/book-demo`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              {t("paymentCancelled.tryAgain", "Book Another Demo")}
            </Link>

            {/* Back to Homepage - Secondary */}
            <Link
              href={`/${locale}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              {t("paymentCancelled.backToHome", "Back to Homepage")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Support Contact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400"
          >
            <Headphones className="h-4 w-4" />
            <span>
              {t("paymentCancelled.contactSupport", "Contact us:")}{" "}
              <a
                href="mailto:support@fleetcore.io"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                support@fleetcore.io
              </a>
            </span>
          </motion.div>
        </div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-4 text-center text-xs text-gray-400 dark:text-slate-500"
        >
          <p>
            {t(
              "paymentCancelled.trustMessage",
              "Join 500+ fleet managers already using FleetCore"
            )}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
