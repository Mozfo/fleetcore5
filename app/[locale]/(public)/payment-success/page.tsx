/**
 * Payment Success Page
 *
 * V6.2-9B - Display payment confirmation after successful Stripe checkout
 *
 * URL: /[locale]/payment-success?session_id=xxx
 *
 * Features:
 * - Animated success state (Framer Motion)
 * - Welcome message with company name
 * - Next steps (24h verification process)
 * - Contact support info
 * - i18n (en/fr)
 *
 * @module app/[locale]/(public)/payment-success/page
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Mail,
  Clock,
  Shield,
  Sparkles,
  ArrowRight,
  Loader2,
  Headphones,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface PaymentSuccessData {
  companyName: string | null;
  email: string;
  planName: string;
  amount: string;
  currency: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

function PaymentSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  // Query params
  const sessionId = searchParams.get("session_id");

  // Initialize i18n
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  // State
  const [data, setData] = useState<PaymentSuccessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch session details from Stripe (optional - for displaying order info)
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) {
        // No session ID - show generic success page
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/public/crm/payment-success?session_id=${sessionId}`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setData(result.data);
          }
        }
        // If API fails, we still show the success page without details
      } catch {
        // Silently fail - show generic success
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [sessionId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

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
              {t("paymentSuccess.title", "Payment Successful!")}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-slate-400">
              {data?.companyName
                ? t("paymentSuccess.welcomeWithName", {
                    name: data.companyName,
                    defaultValue: `Welcome to FleetCore, ${data.companyName}!`,
                  })
                : t("paymentSuccess.welcome", "Welcome to FleetCore!")}
            </p>
          </motion.div>

          {/* Order Summary (if available) */}
          {data && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-6 rounded-xl bg-gray-100 p-4 dark:bg-slate-700/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {data.planName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {data.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {data.amount} {data.currency}
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
              <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {t("paymentSuccess.emailSent", "Confirmation email sent")}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                {t(
                  "paymentSuccess.checkInbox",
                  "Check your inbox for payment receipt and next steps."
                )}
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
              {t("paymentSuccess.whatNext", "What happens next?")}
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 dark:bg-green-500/20 dark:text-green-400">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("paymentSuccess.step1Title", "Account Verification")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {t(
                      "paymentSuccess.step1Desc",
                      "Our team will verify your account within 24 hours."
                    )}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 dark:bg-green-500/20 dark:text-green-400">
                  2
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("paymentSuccess.step2Title", "Receive Your Credentials")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {t(
                      "paymentSuccess.step2Desc",
                      "You'll receive your login details via email."
                    )}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 dark:bg-green-500/20 dark:text-green-400">
                  3
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("paymentSuccess.step3Title", "Start Using FleetCore")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {t(
                      "paymentSuccess.step3Desc",
                      "Log in and start managing your fleet efficiently."
                    )}
                  </p>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* Verification Notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mb-6 flex items-start gap-3 rounded-lg bg-amber-50 p-4 dark:bg-amber-500/10"
          >
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-200">
                {t("paymentSuccess.verificationTitle", "24-Hour Verification")}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                {t(
                  "paymentSuccess.verificationDesc",
                  "Your account is being set up. You'll be notified once everything is ready."
                )}
              </p>
            </div>
          </motion.div>

          {/* Support Contact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400"
          >
            <Headphones className="h-4 w-4" />
            <span>
              {t("paymentSuccess.needHelp", "Need help?")}{" "}
              <a
                href="mailto:support@fleetcore.io"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                support@fleetcore.io
              </a>
            </span>
          </motion.div>

          {/* Back to Homepage */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Link
              href={`/${locale}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700"
            >
              {t("paymentSuccess.backToHome", "Back to Homepage")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-slate-500"
        >
          <Shield className="h-4 w-4" />
          <span>
            {t(
              "paymentSuccess.securePayment",
              "Secure payment powered by Stripe"
            )}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
