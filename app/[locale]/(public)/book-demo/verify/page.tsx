/**
 * Book Demo Wizard - Step 1b: Email Verification Code
 *
 * V6.2.2 - Verification code entry page.
 *
 * URL: /[locale]/book-demo/verify?leadId=xxx&email=xxx
 *
 * Flow:
 * 1. User enters 6-digit code from email
 * 2. Auto-submit on completion
 * 3. Success → Redirect to /book-demo/step-2?leadId=xxx
 * 4. Error → Show message, allow resend
 *
 * @module app/[locale]/(public)/book-demo/verify/page
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Mail,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { WizardProgressBar } from "@/components/booking/WizardProgressBar";
import { VerificationCodeInput } from "@/components/forms/VerificationCodeInput";

// ============================================================================
// TYPES
// ============================================================================

interface VerifyResponse {
  success: boolean;
  data?: {
    leadId: string;
    redirectUrl?: string;
  };
  error?: {
    code: string;
    message: string;
    attemptsRemaining?: number;
  };
}

interface ResendResponse {
  success: boolean;
  data?: {
    expiresAt: string;
  };
  error?: {
    code: string;
    message: string;
    cooldownSeconds?: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Mask email for display: user@example.com → u***@example.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;

  const maskedLocal = local.length > 1 ? local[0] + "***" : local[0] + "***";

  return `${maskedLocal}@${domain}`;
}

/**
 * Format seconds as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function VerifyCodePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  // Query params
  const leadId = searchParams.get("leadId");
  const email = searchParams.get("email");

  // Initialize i18n
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  // Redirect if missing params
  useEffect(() => {
    if (!leadId || !email) {
      router.replace(`/${locale}/book-demo`);
    }
  }, [leadId, email, locale, router]);

  // State
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<{
    code: string;
    message: string;
    attemptsRemaining?: number;
  } | null>(null);
  const [shake, setShake] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Timer state
  const [expiresAt, setExpiresAt] = useState<Date | null>(() => {
    // Default: 15 minutes from now
    return new Date(Date.now() + 15 * 60 * 1000);
  });
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);
  const [cooldown, setCooldown] = useState(0);

  // Refs for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(
        0,
        Math.floor((expiresAt.getTime() - now) / 1000)
      );
      setTimeRemaining(remaining);
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expiresAt]);

  // Cooldown countdown
  const hasCooldown = cooldown > 0;
  useEffect(() => {
    if (!hasCooldown) return;

    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [hasCooldown]);

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (timeRemaining <= 30) return "text-red-500";
    if (timeRemaining <= 120) return "text-amber-500";
    return "text-slate-400";
  };

  // Get localized error message
  const getErrorMessage = useCallback(
    (code: string, attemptsRemaining?: number): string => {
      switch (code) {
        case "INVALID_CODE":
          return t("bookDemo.verify.errors.invalid", {
            attempts: attemptsRemaining ?? 0,
          });
        case "EXPIRED":
          return t("bookDemo.verify.errors.expired");
        case "MAX_ATTEMPTS":
          return t("bookDemo.verify.errors.maxAttempts");
        default:
          return t("bookDemo.verify.errors.generic");
      }
    },
    [t]
  );

  // Verify code
  const handleVerify = useCallback(
    async (code: string) => {
      if (!leadId || isVerifying) return;

      setIsVerifying(true);
      setError(null);
      setResendSuccess(false);

      try {
        const response = await fetch("/api/crm/leads/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId,
            code,
          }),
        });

        const result: VerifyResponse = await response.json();

        if (result.success && result.data) {
          // Success - redirect to step 2
          router.push(
            `/${locale}/book-demo/step-2?leadId=${result.data.leadId}`
          );
        } else if (result.error) {
          setError({
            code: result.error.code,
            message: getErrorMessage(
              result.error.code,
              result.error.attemptsRemaining
            ),
            attemptsRemaining: result.error.attemptsRemaining,
          });

          // Trigger shake animation
          setShake(true);
          setTimeout(() => setShake(false), 500);

          // Clear inputs for retry (unless max attempts)
          if (result.error.code !== "MAX_ATTEMPTS") {
            setClearTrigger((prev) => prev + 1);
          }
        }
      } catch (_err) {
        setError({
          code: "NETWORK_ERROR",
          message: t("bookDemo.verify.errors.generic"),
        });
      } finally {
        setIsVerifying(false);
      }
    },
    [leadId, locale, router, t, isVerifying, getErrorMessage]
  );

  // Resend code
  const handleResend = useCallback(async () => {
    if (!leadId || isResending || cooldown > 0) return;

    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const response = await fetch("/api/crm/leads/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          locale,
        }),
      });

      const result: ResendResponse = await response.json();

      if (result.success && result.data) {
        // Success - update timer
        setExpiresAt(new Date(result.data.expiresAt));
        setClearTrigger((prev) => prev + 1);
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      } else if (result.error) {
        if (
          result.error.code === "RATE_LIMITED" &&
          result.error.cooldownSeconds
        ) {
          setCooldown(result.error.cooldownSeconds);
        } else {
          setError({
            code: result.error.code,
            message: result.error.message,
          });
        }
      }
    } catch (_err) {
      setError({
        code: "NETWORK_ERROR",
        message: t("bookDemo.verify.errors.generic"),
      });
    } finally {
      setIsResending(false);
    }
  }, [leadId, locale, isResending, cooldown, t]);

  // Don't render if missing params
  if (!leadId || !email) {
    return null;
  }

  const isExpired = timeRemaining <= 0;
  const isLocked = error?.code === "MAX_ATTEMPTS";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Progress Bar */}
        <WizardProgressBar currentStep={1} totalSteps={3} className="mb-8" />

        {/* Card */}
        <div className="rounded-2xl bg-slate-800/50 p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {t("bookDemo.verify.title")}
            </h1>
            <p className="mt-2 text-slate-400">
              {t("bookDemo.verify.subtitle")}
            </p>
            <p className="mt-1 font-medium text-white">{maskEmail(email)}</p>
          </div>

          {/* Timer */}
          {!isExpired && !isLocked && (
            <div
              className={`mb-6 flex items-center justify-center gap-2 ${getTimerColor()}`}
            >
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {t("bookDemo.verify.expiresIn")} {formatTime(timeRemaining)}
              </span>
            </div>
          )}

          {/* Expired State */}
          {isExpired && !isLocked && (
            <div className="mb-6 flex items-center justify-center gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t("bookDemo.verify.expired")}
              </span>
            </div>
          )}

          {/* Code Input */}
          <div className="mb-6">
            <label className="mb-3 block text-center text-sm font-medium text-slate-300">
              {t("bookDemo.verify.inputLabel")}
            </label>
            <VerificationCodeInput
              length={6}
              onComplete={handleVerify}
              disabled={isVerifying || isExpired || isLocked}
              error={!!error}
              shake={shake}
              clearTrigger={clearTrigger}
              autoFocus
            />
          </div>

          {/* Verifying State */}
          {isVerifying && (
            <div className="mb-6 flex items-center justify-center gap-2 text-blue-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t("bookDemo.verify.verifying")}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-lg bg-red-500/10 p-4 text-center"
            >
              <p className="text-sm text-red-400">{error.message}</p>
            </motion.div>
          )}

          {/* Resend Success */}
          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-400"
            >
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">
                {t("bookDemo.verify.resendSuccess")}
              </span>
            </motion.div>
          )}

          {/* Resend Section */}
          <div className="text-center">
            <p className="mb-2 text-sm text-slate-500">
              {t("bookDemo.verify.resend")}
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={
                isResending || (cooldown > 0 && !isExpired && !isLocked)
              }
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("bookDemo.verify.resendButton")}
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t("bookDemo.verify.resendCooldown", { seconds: cooldown })}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t("bookDemo.verify.resendButton")}
                </>
              )}
            </button>
          </div>

          {/* Change Email Link */}
          <div className="mt-6 text-center">
            <Link
              href={`/${locale}/book-demo`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("bookDemo.verify.changeEmail")}
            </Link>
          </div>
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
