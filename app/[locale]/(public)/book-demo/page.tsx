/**
 * Book Demo Wizard - Step 1: Email Verification
 *
 * V6.2.2 - First step of the Book Demo wizard flow.
 *
 * Flow:
 * 1. User enters their professional email
 * 2. Submit → POST /api/demo-leads { mode: "wizard_step1", email, locale }
 * 3. Success (requiresVerification) → Redirect to /book-demo/verify?leadId=xxx&email=xxx
 * 4. Success (alreadyVerified) → Redirect to /book-demo/step-2?leadId=xxx
 * 5. Error (ALREADY_CONVERTED) → Show "already a customer" message
 *
 * @module app/[locale]/(public)/book-demo/page
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowRight, Loader2, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { WizardProgressBar } from "@/components/booking/WizardProgressBar";

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const emailSchema = z.object({
  email: z.string().email(),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface ApiResponse {
  success: boolean;
  data?: {
    leadId: string;
    requiresVerification?: boolean;
    alreadyVerified?: boolean;
    expiresAt?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function BookDemoPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  // Initialize i18n with correct locale
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: "onChange",
  });

  const emailValue = watch("email");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<{
    code: string;
    message: string;
  } | null>(null);

  // Debounced email validation feedback
  const [debouncedEmail, setDebouncedEmail] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(emailValue || "");
    }, 300);
    return () => clearTimeout(timer);
  }, [emailValue]);

  // Form submission
  const onSubmit = useCallback(
    async (data: EmailFormData) => {
      setIsSubmitting(true);
      setApiError(null);

      try {
        const response = await fetch("/api/demo-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "wizard_step1",
            email: data.email.toLowerCase().trim(),
            locale,
          }),
        });

        const result: ApiResponse = await response.json();

        if (result.success && result.data) {
          const { leadId, requiresVerification, alreadyVerified } = result.data;

          if (alreadyVerified) {
            // Email already verified - skip to step 2
            router.push(`/${locale}/book-demo/step-2?leadId=${leadId}`);
          } else if (requiresVerification) {
            // Need to verify email
            router.push(
              `/${locale}/book-demo/verify?leadId=${leadId}&email=${encodeURIComponent(data.email)}`
            );
          }
        } else if (result.error) {
          // Handle specific error codes
          if (result.error.code === "ALREADY_CONVERTED") {
            setApiError({
              code: "ALREADY_CONVERTED",
              message: t("bookDemo.step1.errors.alreadyCustomer"),
            });
          } else if (result.error.code === "VALIDATION_ERROR") {
            setError("email", {
              message: t("bookDemo.step1.errors.invalidEmail"),
            });
          } else {
            setApiError({
              code: result.error.code,
              message:
                result.error.message || t("bookDemo.step1.errors.generic"),
            });
          }
        }
      } catch (_error) {
        setApiError({
          code: "NETWORK_ERROR",
          message: t("bookDemo.step1.errors.generic"),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [locale, router, setError, t]
  );

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
              {t("bookDemo.step1.title")}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {t("bookDemo.step1.subtitle")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                {t("bookDemo.step1.emailLabel")}
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder={t("bookDemo.step1.emailPlaceholder")}
                  disabled={isSubmitting}
                  {...register("email")}
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 pl-11 text-white placeholder-slate-500 transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : debouncedEmail && isValid
                        ? "border-green-500 focus:ring-green-500"
                        : "border-slate-600 focus:ring-blue-500"
                  }`}
                />
                <Mail className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-500" />
              </div>
              {errors.email && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {t("bookDemo.step1.errors.invalidEmail")}
                </p>
              )}
            </div>

            {/* API Error */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-500/10 p-4"
              >
                <p className="text-sm text-red-400">{apiError.message}</p>
                {apiError.code === "ALREADY_CONVERTED" && (
                  <Link
                    href={`/${locale}/login`}
                    className="mt-2 inline-block text-sm font-medium text-blue-400 hover:underline"
                  >
                    {t("bookDemo.step1.errors.loginLink")}
                  </Link>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("bookDemo.step1.submitting")}
                </>
              ) : (
                <>
                  {t("bookDemo.step1.cta")}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Social Proof */}
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Users className="h-4 w-4" />
            <span>{t("bookDemo.step1.socialProof")}</span>
          </div>
        </div>

        {/* Back to home link */}
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
