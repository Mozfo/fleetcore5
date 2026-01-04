"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { useTranslation } from "react-i18next";
import type { FeatureItem, ProcessStep, ProofMetric } from "@/lib/i18n/types";
import type { DashboardView } from "@/lib/data/dashboard-mock";
import { LiveDashboard, Navigation } from "@/components/homepage";
import { Footer } from "@/components/shared";
import { ArrowRight, CheckCircle, Zap } from "lucide-react";

export default function FleetCoreUltimatePremium() {
  const { locale, localizedPath } = useLocalizedPath();
  const [dashboardView, setDashboardView] =
    useState<DashboardView>("operations");
  // Live metrics animation
  const [metrics, setMetrics] = useState({
    activeVehicles: 342,
    dailyRevenue: 48750,
    utilization: 78.5,
    activeBookings: 127,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((_prev) => ({
        activeVehicles: 342 + Math.floor(Math.random() * 10 - 5),
        dailyRevenue: 48750 + Math.floor(Math.random() * 2000 - 1000),
        utilization: 78.5 + (Math.random() * 4 - 2),
        activeBookings: 127 + Math.floor(Math.random() * 20 - 10),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { t, ready } = useTranslation("common");

  return (
    <div className="min-h-screen">
      <div className="bg-gray-50 dark:bg-gray-950">
        <Navigation />

        {/* Hero Section with Video */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
          {/* Video Background */}
          <div className="absolute inset-0 h-full w-full">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            >
              <source src="/videos/hero-bg.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-gray-900/70 to-gray-900/90" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-2 backdrop-blur-xl"
            >
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                {t("homepage.hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              className="mb-6 text-5xl leading-tight font-bold text-white lg:text-7xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {t("homepage.hero.title")}
            </motion.h1>

            <motion.p
              className="mx-auto mb-12 max-w-4xl text-xl text-gray-300 lg:text-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {t("homepage.hero.subtitle")}
            </motion.p>

            {/* Live Metrics */}
            <motion.div
              className="mx-auto mb-12 grid max-w-4xl grid-cols-2 gap-6 lg:grid-cols-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-3xl font-bold text-white">
                  {metrics.activeVehicles}
                </p>
                <p className="text-sm text-gray-400">
                  {t("homepage.hero.metrics.vehicles")}
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-3xl font-bold text-white">
                  €{metrics.dailyRevenue}
                </p>
                <p className="text-sm text-gray-400">
                  {t("homepage.hero.metrics.revenue")}
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-3xl font-bold text-white">
                  {metrics.utilization.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-400">
                  {t("homepage.hero.metrics.utilization")}
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-3xl font-bold text-white">
                  {metrics.activeBookings}
                </p>
                <p className="text-sm text-gray-400">
                  {t("homepage.hero.metrics.bookings")}
                </p>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col justify-center gap-4 sm:flex-row"
            >
              <Link
                href={localizedPath("request-demo")}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-4 text-lg font-bold text-white transition-all hover:shadow-2xl"
              >
                {t("homepage.cta.button")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20">
                {locale === "en" ? "Watch Demo Video" : "Voir la Vidéo de Démo"}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Interactive Dashboard Section */}
        <section className="bg-white py-20 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                {t("homepage.dashboard.title")}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t("homepage.dashboard.subtitle")}
              </p>
            </div>

            <LiveDashboard
              dashboardView={dashboardView}
              setDashboardView={setDashboardView}
            />
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-20 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                {t("homepage.featuresSection.title")}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t("homepage.featuresSection.subtitle")}
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Fleet Management Features */}
              <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
                <h3 className="mb-6 text-2xl font-bold text-gray-900 lg:whitespace-nowrap dark:text-white">
                  {t("homepage.features.rental.title")}
                </h3>
                <div className="space-y-4">
                  {ready &&
                    (
                      t("homepage.features.rental.items", {
                        returnObjects: true,
                      }) as FeatureItem[]
                    ).map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={index}
                          className="flex gap-4"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            {Icon && (
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {feature.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {feature.desc}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>

              {/* Platform Integration Features */}
              <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
                <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                  {t("homepage.features.ridehailing.title")}
                </h3>
                <div className="space-y-4">
                  {ready &&
                    (
                      t("homepage.features.ridehailing.items", {
                        returnObjects: true,
                      }) as FeatureItem[]
                    ).map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={index}
                          className="flex gap-4"
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                            {Icon && (
                              <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {feature.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {feature.desc}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Timeline */}
        <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                {t("homepage.process.title")}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t("homepage.process.subtitle")}
              </p>
            </div>

            <div className="mx-auto flex max-w-5xl items-center justify-between">
              {ready &&
                (
                  t("homepage.process.steps", {
                    returnObjects: true,
                  }) as ProcessStep[]
                ).map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={index}
                      className="flex flex-col items-center text-center"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                        {Icon && <Icon className="h-8 w-8 text-white" />}
                      </div>
                      <h3 className="mb-1 font-bold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                        {step.desc}
                      </p>
                      <p className="max-w-[150px] text-xs text-gray-500">
                        {step.detail}
                      </p>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="bg-white py-20 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                {t("homepage.integrations.title")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              {ready &&
                Object.entries(
                  t("homepage.integrations.categories", { returnObjects: true })
                ).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {ready &&
                        (items as string[]).map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {item}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Proof Section */}
        <section className="bg-gray-50 py-20 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                {t("homepage.proof.title")}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {ready &&
                (
                  t("homepage.proof.metrics", {
                    returnObjects: true,
                  }) as ProofMetric[]
                ).map((metric, index) => (
                  <motion.div
                    key={index}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-5xl font-bold text-transparent">
                      {metric.value}
                    </div>
                    <div className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {metric.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.desc}
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-6 text-4xl font-bold text-white">
              {t("homepage.cta.title")}
            </h2>
            <p className="mb-8 text-xl text-white/90">
              {t("homepage.cta.subtitle")}
            </p>
            <Link
              href={localizedPath("request-demo")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-gray-900 transition-all hover:shadow-2xl"
            >
              {t("homepage.cta.button")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
