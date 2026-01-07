"use client";

/**
 * Terms and Conditions Page - V6.2-8b
 *
 * Public page displaying CGI/CGU (General Terms and Conditions).
 * Accessible from verification form and footer links.
 *
 * URL: /[locale]/terms
 *
 * @module app/[locale]/(public)/terms/page
 */

import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Shield, Scale, Clock } from "lucide-react";

export default function TermsPage() {
  const { t } = useTranslation("public");
  const params = useParams();
  const locale = params.locale as string;

  const sections = [
    {
      id: "acceptance",
      icon: FileText,
      title: t("terms.sections.acceptance.title"),
      content: t("terms.sections.acceptance.content"),
    },
    {
      id: "services",
      icon: Shield,
      title: t("terms.sections.services.title"),
      content: t("terms.sections.services.content"),
    },
    {
      id: "obligations",
      icon: Scale,
      title: t("terms.sections.obligations.title"),
      content: t("terms.sections.obligations.content"),
    },
    {
      id: "payment",
      icon: Clock,
      title: t("terms.sections.payment.title"),
      content: t("terms.sections.payment.content"),
    },
    {
      id: "data",
      icon: Shield,
      title: t("terms.sections.data.title"),
      content: t("terms.sections.data.content"),
    },
    {
      id: "liability",
      icon: Scale,
      title: t("terms.sections.liability.title"),
      content: t("terms.sections.liability.content"),
    },
    {
      id: "termination",
      icon: Clock,
      title: t("terms.sections.termination.title"),
      content: t("terms.sections.termination.content"),
    },
    {
      id: "governing",
      icon: Scale,
      title: t("terms.sections.governing.title"),
      content: t("terms.sections.governing.content"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("terms.backToHome")}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Title */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t("terms.title")}</h1>
          <p className="mt-2 text-slate-400">
            {t("terms.lastUpdated")}: {t("terms.updateDate")}
          </p>
        </div>

        {/* Introduction */}
        <div className="mb-12 rounded-xl bg-slate-800/50 p-6 backdrop-blur-sm">
          <p className="leading-relaxed text-slate-300">
            {t("terms.introduction")}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <section
              key={section.id}
              className="rounded-xl bg-slate-800/30 p-6 backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                  <section.icon className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {index + 1}. {section.title}
                </h2>
              </div>
              <div className="pl-13 leading-relaxed whitespace-pre-line text-slate-300">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 rounded-xl bg-slate-800/50 p-6 text-center backdrop-blur-sm">
          <h3 className="mb-2 text-lg font-semibold text-white">
            {t("terms.contact.title")}
          </h3>
          <p className="text-slate-400">{t("terms.contact.description")}</p>
          <a
            href="mailto:legal@fleetcore.io"
            className="mt-2 inline-block text-blue-400 hover:underline"
          >
            legal@fleetcore.io
          </a>
        </div>

        {/* Back button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("terms.backButton")}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-6 text-center text-sm text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} FleetCore.{" "}
          {t("terms.allRightsReserved")}
        </p>
      </footer>
    </div>
  );
}
