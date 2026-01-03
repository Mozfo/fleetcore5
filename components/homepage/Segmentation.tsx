"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Loader2,
  Smartphone,
  Building2,
  Sparkles,
} from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

interface SegmentFeature {
  en: string;
  fr: string;
}

interface SegmentCta {
  text: { en: string; fr: string };
  link: string;
  show_app_badges: boolean;
}

interface Segment {
  id: string;
  icon: string;
  color: string;
  fleet_size: { min: number; max: number | null };
  name: { en: string; fr: string };
  subtitle: { en: string; fr: string };
  tagline: { en: string; fr: string };
  features: SegmentFeature[];
  cta: SegmentCta;
}

interface SegmentsConfig {
  segments: Segment[];
}

export function Segmentation() {
  const { t } = useTranslation("common");
  const { locale, localizedPath } = useLocalizedPath();
  const [config, setConfig] = useState<SegmentsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchSegments() {
      try {
        const response = await fetch("/api/public/segments");
        const result = await response.json();
        if (result.success && result.data?.segments) {
          setConfig(result.data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    void fetchSegments();
  }, []);

  const getText = (obj: { en: string; fr: string }) =>
    locale === "fr" ? obj.fr : obj.en;

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 py-24 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
        </div>
      </section>
    );
  }

  if (error || !config) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 py-24 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-100/40 blur-3xl dark:bg-purple-900/20" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300"
          >
            <Sparkles className="h-4 w-4" />
            {locale === "fr"
              ? "Choisissez votre solution"
              : "Choose your solution"}
          </motion.span>

          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            {t("homepage.segmentation.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            {t("homepage.segmentation.subtitle")}
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-8 lg:grid-cols-2">
          {config.segments.map((segment, index) => {
            const isFleet = segment.id === "fleet";
            const isSolo = segment.id === "solo";

            return (
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="group relative"
              >
                {/* Card */}
                <div
                  className={`relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl dark:bg-gray-900/80 ${
                    isFleet
                      ? "border-purple-200 shadow-xl shadow-purple-500/10 hover:shadow-purple-500/20 dark:border-purple-800"
                      : "border-gray-200 shadow-lg hover:shadow-gray-500/10 dark:border-gray-800"
                  }`}
                >
                  {/* Top gradient bar */}
                  <div
                    className={`h-1.5 w-full ${
                      isFleet
                        ? "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500"
                        : "bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500"
                    }`}
                  />

                  {/* Recommended badge */}
                  {isFleet && (
                    <div className="absolute top-8 -right-12 z-10 rotate-45">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-12 py-1 text-xs font-bold text-white shadow-lg">
                        {locale === "fr" ? "RECOMMANDÉ" : "RECOMMENDED"}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-8">
                    {/* Header */}
                    <div className="mb-8">
                      {/* Icon + Badge row */}
                      <div className="mb-6 flex items-center justify-between">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                            isFleet
                              ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
                              : "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
                          }`}
                        >
                          {isSolo ? (
                            <Smartphone className="h-7 w-7 text-white" />
                          ) : (
                            <Building2 className="h-7 w-7 text-white" />
                          )}
                        </div>

                        <span
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                            isFleet
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                          }`}
                        >
                          {getText(segment.subtitle)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                        {getText(segment.name)}
                      </h3>

                      {/* Tagline */}
                      <p className="text-gray-600 dark:text-gray-400">
                        {getText(segment.tagline)}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="mb-8 flex-1 space-y-4">
                      {segment.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              isFleet
                                ? "bg-purple-100 dark:bg-purple-900/50"
                                : "bg-blue-100 dark:bg-blue-900/50"
                            }`}
                          >
                            <Check
                              className={`h-3 w-3 ${
                                isFleet
                                  ? "text-purple-600 dark:text-purple-400"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}
                              strokeWidth={3}
                            />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {getText(feature)}
                          </span>
                        </motion.li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="mt-auto space-y-3">
                      <Link
                        href={
                          segment.cta.link.startsWith("/")
                            ? localizedPath(segment.cta.link)
                            : segment.cta.link
                        }
                        className={`group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-4 text-base font-semibold text-white transition-all ${
                          isFleet
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/30"
                            : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/30"
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {getText(segment.cta.text)}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </span>
                        {/* Shine effect */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full" />
                      </Link>

                      {/* Subtext */}
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        {isSolo
                          ? "App Store & Google Play"
                          : locale === "fr"
                            ? "Démo personnalisée de 30 min"
                            : "30-min personalized demo"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom trust indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {locale === "fr"
              ? "Rejoignez plus de 500 opérateurs de flotte satisfaits"
              : "Join 500+ satisfied fleet operators"}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
