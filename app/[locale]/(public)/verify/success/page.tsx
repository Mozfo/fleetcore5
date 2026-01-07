"use client";

/**
 * Verification Success Page - V6.2-8b
 *
 * Displayed after successful verification form submission.
 * Informs the user that an admin invitation has been sent.
 *
 * URL: /[locale]/verify/success?code=C-XXXXXX
 *
 * @module app/[locale]/(public)/verify/success/page
 */

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CheckCircle, Mail, ArrowRight, Clock, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function VerificationSuccessPage() {
  const { t } = useTranslation("public");
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const tenantCode = searchParams.get("code");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg rounded-2xl bg-slate-800/50 p-8 text-center backdrop-blur-sm"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20"
        >
          <CheckCircle className="h-10 w-10 text-green-500" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white">
          {t("verify.success.title")}
        </h1>

        {/* Account Code */}
        {tenantCode && (
          <div className="mt-4 rounded-lg bg-slate-700/50 p-3">
            <p className="text-sm text-slate-400">
              {t("verify.success.accountCode")}
            </p>
            <p className="font-mono text-xl font-bold text-white">
              {tenantCode}
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-8 space-y-4 text-left">
          <h2 className="text-lg font-semibold text-white">
            {t("verify.success.nextSteps")}
          </h2>

          <div className="space-y-3">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-3 rounded-lg bg-slate-700/30 p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                <Mail className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">
                  {t("verify.success.step1.title")}
                </p>
                <p className="text-sm text-slate-400">
                  {t("verify.success.step1.description")}
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-3 rounded-lg bg-slate-700/30 p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                <Clock className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">
                  {t("verify.success.step2.title")}
                </p>
                <p className="text-sm text-slate-400">
                  {t("verify.success.step2.description")}
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start gap-3 rounded-lg bg-slate-700/30 p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                <ArrowRight className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white">
                  {t("verify.success.step3.title")}
                </p>
                <p className="text-sm text-slate-400">
                  {t("verify.success.step3.description")}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/login`}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {t("verify.success.loginButton")}
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href={`/${locale}`}
            className="text-sm text-slate-400 transition-colors hover:text-white"
          >
            {t("verify.success.homeButton")}
          </Link>
        </div>

        {/* Help */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
          <HelpCircle className="h-4 w-4" />
          <span>
            {t("verify.success.needHelp")}{" "}
            <a
              href="mailto:support@fleetcore.io"
              className="text-blue-400 hover:underline"
            >
              support@fleetcore.io
            </a>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
