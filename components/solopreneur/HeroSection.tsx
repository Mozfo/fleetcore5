"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Star, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";

export function HeroSection() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "en";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 lg:py-32 dark:from-gray-900 dark:to-gray-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-100/50 blur-3xl dark:bg-purple-900/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <Download className="h-4 w-4" />
              {t("solopreneur.hero.badge")}
            </span>

            {/* Title */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
              {t("solopreneur.hero.title")}
            </h1>

            {/* Subtitle */}
            <p className="mb-8 max-w-lg text-lg text-gray-600 dark:text-gray-400">
              {t("solopreneur.hero.subtitle")}
            </p>

            {/* Store Buttons */}
            <div className="flex flex-wrap gap-4">
              {/* App Store Button */}
              <a
                href="#"
                className="group flex items-center gap-3 rounded-xl bg-gray-900 px-6 py-3 text-white transition-all hover:bg-gray-800 hover:shadow-lg dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">
                    {t("solopreneur.hero.downloadFree")}
                  </div>
                  <div className="text-sm font-semibold">
                    {t("solopreneur.hero.appStore")}
                  </div>
                </div>
              </a>

              {/* Google Play Button */}
              <a
                href="#"
                className="group flex items-center gap-3 rounded-xl bg-gray-900 px-6 py-3 text-white transition-all hover:bg-gray-800 hover:shadow-lg dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5.31 0 .61.1.86.27L20.14 11c.56.33.86.94.86 1.5s-.3 1.17-.86 1.5L5.36 22.23c-.25.17-.55.27-.86.27-.83 0-1.5-.67-1.5-1.5z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">
                    {t("solopreneur.hero.downloadFree")}
                  </div>
                  <div className="text-sm font-semibold">
                    {t("solopreneur.hero.googlePlay")}
                  </div>
                </div>
              </a>
            </div>

            {/* Rating */}
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span>{t("solopreneur.hero.rating")}</span>
            </div>
          </motion.div>

          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative z-10 h-[580px] w-[280px] overflow-hidden rounded-[3rem] border-8 border-gray-900 bg-gray-900 shadow-2xl dark:border-gray-700">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-gray-900 dark:bg-gray-700" />

                {/* Screen Content */}
                <div className="h-full w-full bg-gradient-to-b from-blue-600 to-purple-700 p-4 pt-10">
                  {/* Status Bar */}
                  <div className="mb-6 flex items-center justify-between text-xs text-white/80">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-4 rounded-sm border border-white/50" />
                    </div>
                  </div>

                  {/* App Content Preview */}
                  <div className="space-y-4">
                    <div className="text-center text-white">
                      <div className="mb-1 text-xs opacity-70">
                        Today&apos;s Earnings
                      </div>
                      <div className="text-3xl font-bold">
                        {formatCurrency(247.5, locale)}
                      </div>
                    </div>

                    {/* Mini Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
                        <div className="text-xs text-white/70">Uber</div>
                        <div className="text-lg font-semibold text-white">
                          {formatCurrency(142.3, locale)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
                        <div className="text-xs text-white/70">Bolt</div>
                        <div className="text-lg font-semibold text-white">
                          {formatCurrency(105.2, locale)}
                        </div>
                      </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                      <div className="mb-2 text-xs text-white/70">
                        Weekly Trend
                      </div>
                      <div className="flex h-16 items-end justify-between gap-1">
                        {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                          <div
                            key={i}
                            className="w-full rounded-t bg-white/40"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bottom Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center text-white">
                      <div>
                        <div className="text-lg font-bold">12</div>
                        <div className="text-xs opacity-70">Trips</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">6.2h</div>
                        <div className="text-xs opacity-70">Online</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">87mi</div>
                        <div className="text-xs opacity-70">Miles</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-4 -bottom-4 h-72 w-72 rounded-full bg-blue-200/50 blur-2xl dark:bg-blue-900/30" />
              <div className="absolute -top-4 -left-4 h-48 w-48 rounded-full bg-purple-200/50 blur-2xl dark:bg-purple-900/30" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
