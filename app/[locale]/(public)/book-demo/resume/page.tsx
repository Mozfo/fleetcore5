/**
 * Book Demo Wizard - Resume via Nurturing Token
 *
 * V6.6 - Validates a resume_token from nurturing emails
 * and redirects to the appropriate wizard step.
 *
 * URL: /[locale]/book-demo/resume?token=xxx
 *
 * Flow:
 * 1. Read token from URL
 * 2. Call GET /api/crm/nurturing/resume?token=xxx
 * 3. On success → redirect to profile/schedule (via API redirect_to)
 * 4. On error → show expired/invalid message with CTA
 *
 * SEO: noindex, nofollow (personalized links)
 *
 * @module app/[locale]/(public)/book-demo/resume/page
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Loader2,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

type ResumeState =
  | "loading"
  | "expired"
  | "invalid"
  | "already_completed"
  | "error";

interface ResumeAPIResponse {
  success: boolean;
  data?: {
    nurturing_id: string;
    email: string;
    redirect_to: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function BookDemoResumePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  const token = searchParams.get("token");

  // Initialize i18n
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  // State
  const [state, setState] = useState<ResumeState>("loading");

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(
          `/api/crm/nurturing/resume?token=${encodeURIComponent(token)}`
        );
        const result: ResumeAPIResponse = await response.json();

        if (result.success && result.data?.redirect_to) {
          // Token valid → redirect to the appropriate wizard step
          router.replace(result.data.redirect_to);
          return;
        }

        // Handle error cases
        const errorCode = result.error?.code;
        if (errorCode === "INVALID_TOKEN" && response.status === 404) {
          setState("expired");
        } else if (errorCode === "INVALID_TOKEN") {
          setState("invalid");
        } else if (errorCode === "ALREADY_CONVERTED") {
          setState("already_completed");
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    };

    void validateToken();
  }, [token, router]);

  // Add noindex meta tag
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // Loading state
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />
          <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
            {t("bookDemo.resume.loading")}
          </p>
        </motion.div>
      </div>
    );
  }

  // Error/expired/invalid states
  const stateConfig: Record<
    Exclude<ResumeState, "loading">,
    {
      icon: React.ReactNode;
      iconBg: string;
      title: string;
      subtitle: string;
      ctaLabel: string;
      ctaHref: string;
    }
  > = {
    expired: {
      icon: <Clock className="h-12 w-12 text-amber-500" />,
      iconBg: "bg-amber-100 dark:bg-amber-500/20",
      title: t("bookDemo.resume.expired"),
      subtitle: t("bookDemo.resume.expiredSubtitle"),
      ctaLabel: t("bookDemo.resume.restartDemo"),
      ctaHref: `/${locale}/book-demo`,
    },
    invalid: {
      icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
      iconBg: "bg-red-100 dark:bg-red-500/20",
      title: t("bookDemo.resume.invalid"),
      subtitle: t("bookDemo.resume.invalidSubtitle"),
      ctaLabel: t("bookDemo.resume.restartDemo"),
      ctaHref: `/${locale}/book-demo`,
    },
    already_completed: {
      icon: <CheckCircle className="h-12 w-12 text-green-500" />,
      iconBg: "bg-green-100 dark:bg-green-500/20",
      title: t("bookDemo.resume.alreadyCompleted"),
      subtitle: t("bookDemo.resume.alreadyCompletedSubtitle"),
      ctaLabel: t("bookDemo.resume.backToHome"),
      ctaHref: `/${locale}`,
    },
    error: {
      icon: <AlertCircle className="h-12 w-12 text-red-500" />,
      iconBg: "bg-red-100 dark:bg-red-500/20",
      title: t("bookDemo.resume.error"),
      subtitle: t("bookDemo.resume.errorSubtitle"),
      ctaLabel: t("bookDemo.resume.restartDemo"),
      ctaHref: `/${locale}/book-demo`,
    },
  };

  const config = stateConfig[state];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full ${config.iconBg}`}
            >
              {config.icon}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {config.title}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            {config.subtitle}
          </p>

          {/* CTA */}
          <Link
            href={config.ctaHref}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            {config.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Back to home (for non-home CTAs) */}
        {state !== "already_completed" && (
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
