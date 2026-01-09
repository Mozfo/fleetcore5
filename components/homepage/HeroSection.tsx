"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Monitor, Smartphone } from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { formatCurrencyCompact } from "@/lib/utils/format-currency";

export function HeroSection() {
  const { locale, localizedPath } = useLocalizedPath();

  const content = {
    en: {
      tagline: "Fleet Management Platform",
      title: "Optimize your fleet.",
      titleHighlight: "Grow your revenue.",
      subtitle:
        "Track earnings, manage drivers, monitor vehicles. All platforms in one place.",
      cta: "Book a Demo",
      ecosystem: {
        title: "One ecosystem, complete control",
        webapp: "Web Platform",
        webappDesc: "Manage your fleet operations",
        mobile: "Driver App",
        mobileDesc: "Manage your rides",
      },
    },
    fr: {
      tagline: "Plateforme de Gestion de Flotte",
      title: "Optimisez votre flotte.",
      titleHighlight: "Augmentez vos revenus.",
      subtitle:
        "Suivez vos revenus, gérez vos chauffeurs, surveillez vos véhicules. Toutes les plateformes en un seul endroit.",
      cta: "Réserver une Démo",
      ecosystem: {
        title: "Un écosystème, un contrôle total",
        webapp: "Plateforme Web",
        webappDesc: "Gérez vos opérations de flotte",
        mobile: "App Chauffeur",
        mobileDesc: "Gérez vos courses",
      },
    },
  };

  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section className="relative bg-white dark:bg-gray-950">
      {/* Top section with text */}
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8 lg:pt-16">
        <div className="text-center">
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-sm font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400"
          >
            {t.tagline}
          </motion.p>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl dark:text-white"
          >
            {t.title}
            <br />
            <span className="text-blue-600 dark:text-blue-400">
              {t.titleHighlight}
            </span>
          </motion.h1>

          {/* Subtitle - EXPLAINS WHAT THE APP DOES */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
          >
            {t.subtitle}
          </motion.p>

          {/* Single CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href={localizedPath("/book-demo")}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
            >
              {t.cta}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Ecosystem visual */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        id="ecosystem"
        className="relative bg-gradient-to-b from-gray-50 to-gray-100 py-16 dark:from-gray-900 dark:to-gray-800"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Ecosystem title */}
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            {t.ecosystem.title}
          </h2>

          {/* Layout: Large Webapp + iPhone */}
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
            {/* Webapp */}
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <Monitor className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t.ecosystem.webapp}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.ecosystem.webappDesc}
                  </p>
                </div>
              </div>
              {/* Screenshot */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700">
                <Image
                  src="/screenshots/dashboard-kpi.png"
                  alt="FleetCore Dashboard"
                  width={1200}
                  height={700}
                  className="w-full"
                  priority
                />
              </div>
            </div>

            {/* iPhone - Thin borders, small Dynamic Island - Links to solopreneur */}
            <Link
              href={localizedPath("/solopreneur")}
              className="block flex-shrink-0 cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t.ecosystem.mobile}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.ecosystem.mobileDesc}
                  </p>
                </div>
              </div>
              {/* iPhone frame - scaled to match webapp height */}
              <div className="relative mx-auto w-[180px]">
                {/* iPhone outer frame - THIN */}
                <div className="rounded-[36px] bg-gray-900 p-[5px] shadow-2xl">
                  {/* Dynamic Island - SMALL */}
                  <div className="absolute top-[10px] left-1/2 z-10 h-[18px] w-[56px] -translate-x-1/2 rounded-full bg-black"></div>

                  {/* Screen - iPhone ratio 9:19.5 */}
                  <div
                    className="relative overflow-hidden rounded-[31px] bg-white"
                    style={{ aspectRatio: "9/19.5" }}
                  >
                    {/* App content */}
                    <div className="h-full bg-gray-50 px-3 pt-10 pb-3">
                      {/* Header */}
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-gray-500">
                            {locale === "fr" ? "Cette semaine" : "This week"}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            Performance
                          </p>
                        </div>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                          <span className="text-[8px] font-bold text-white">
                            JD
                          </span>
                        </div>
                      </div>

                      {/* Weekly earnings */}
                      <div className="mb-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 text-white">
                        <p className="text-[8px] opacity-80">
                          {locale === "fr"
                            ? "Gains cette semaine"
                            : "Weekly Earnings"}
                        </p>
                        <p className="text-lg font-bold">
                          {formatCurrencyCompact(4235, locale)}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[7px]">
                          <span className="rounded bg-white/20 px-1 py-0.5">
                            +8%
                          </span>
                          <span className="opacity-80">vs last week</span>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="mb-2 grid grid-cols-3 gap-1">
                        <div className="rounded-lg bg-white p-1.5 text-center shadow-sm">
                          <p className="text-[6px] text-gray-500">
                            {locale === "fr" ? "Courses" : "Trips"}
                          </p>
                          <p className="text-xs font-bold text-gray-900">142</p>
                        </div>
                        <div className="rounded-lg bg-white p-1.5 text-center shadow-sm">
                          <p className="text-[6px] text-gray-500">
                            {locale === "fr" ? "Heures" : "Hours"}
                          </p>
                          <p className="text-xs font-bold text-gray-900">48h</p>
                        </div>
                        <div className="rounded-lg bg-white p-1.5 text-center shadow-sm">
                          <p className="text-[6px] text-gray-500">Score</p>
                          <p className="text-xs font-bold text-green-600">
                            4.9
                          </p>
                        </div>
                      </div>

                      {/* Weekly chart */}
                      <div className="rounded-lg bg-white p-1.5 shadow-sm">
                        <p className="mb-0.5 text-[6px] text-gray-500">
                          {locale === "fr" ? "Activité" : "Activity"}
                        </p>
                        <div className="flex h-8 items-end justify-between gap-0.5">
                          <div
                            className="w-full rounded-t-sm bg-blue-200"
                            style={{ height: "55%" }}
                          ></div>
                          <div
                            className="w-full rounded-t-sm bg-blue-300"
                            style={{ height: "70%" }}
                          ></div>
                          <div
                            className="w-full rounded-t-sm bg-purple-400"
                            style={{ height: "45%" }}
                          ></div>
                          <div
                            className="w-full rounded-t-sm bg-purple-500"
                            style={{ height: "85%" }}
                          ></div>
                          <div
                            className="w-full rounded-t-sm bg-purple-600"
                            style={{ height: "100%" }}
                          ></div>
                          <div
                            className="w-full rounded-t-sm bg-blue-400"
                            style={{ height: "60%" }}
                          ></div>
                          <div
                            className="w-full rounded-t-sm bg-gray-200"
                            style={{ height: "15%" }}
                          ></div>
                        </div>
                        <div className="mt-0.5 flex justify-between text-[5px] text-gray-400">
                          <span>M</span>
                          <span>T</span>
                          <span>W</span>
                          <span>T</span>
                          <span>F</span>
                          <span>S</span>
                          <span>S</span>
                        </div>
                      </div>
                    </div>

                    {/* Home indicator */}
                    <div className="absolute bottom-1 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full bg-gray-900"></div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
