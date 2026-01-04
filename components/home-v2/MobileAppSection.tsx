"use client";

import { motion } from "framer-motion";
import { Smartphone, Check } from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { formatCurrencyCompact } from "@/lib/utils/format-currency";

export function MobileAppSection() {
  const { locale } = useLocalizedPath();

  const content = {
    en: {
      badge: "Driver App",
      title: "Your drivers stay informed",
      subtitle:
        "Give your drivers autonomy. They see their earnings, track their hours, upload documents - all from their phone.",
      features: [
        "Real-time earnings tracking",
        "Digital document upload",
        "Performance dashboard",
        "Shift schedules",
      ],
    },
    fr: {
      badge: "App Chauffeur",
      title: "Vos chauffeurs restent informés",
      subtitle:
        "Donnez de l'autonomie à vos chauffeurs. Ils voient leurs gains, suivent leurs heures, uploadent leurs documents - tout depuis leur téléphone.",
      features: [
        "Suivi des gains en temps réel",
        "Upload de documents digital",
        "Tableau de bord performance",
        "Planning des shifts",
      ],
    },
  };

  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section className="bg-white py-24 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* iPhone with real proportions */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative w-[260px]">
              {/* iPhone outer frame - THIN */}
              <div className="rounded-[44px] bg-gray-900 p-[6px] shadow-2xl">
                {/* Dynamic Island - SMALL */}
                <div className="absolute top-[12px] left-1/2 z-10 h-[22px] w-[72px] -translate-x-1/2 rounded-full bg-black"></div>

                {/* Screen - iPhone 15 Pro ratio 9:19.5 */}
                <div
                  className="relative overflow-hidden rounded-[38px] bg-white"
                  style={{ aspectRatio: "9/19.5" }}
                >
                  {/* App content - Weekly view */}
                  <div className="h-full bg-gray-50 px-4 pt-12 pb-4">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-gray-500">
                          {locale === "fr" ? "Cette semaine" : "This week"}
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          Performance
                        </p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
                        <span className="text-[11px] font-bold text-white">
                          JD
                        </span>
                      </div>
                    </div>

                    {/* Weekly earnings */}
                    <div className="mb-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                      <p className="text-[11px] opacity-80">
                        {locale === "fr"
                          ? "Gains cette semaine"
                          : "Weekly Earnings"}
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrencyCompact(4235, locale)}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px]">
                        <span className="rounded bg-white/20 px-2 py-0.5">
                          +8%
                        </span>
                        <span className="opacity-80">vs last week</span>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                        <p className="text-[10px] text-gray-500">
                          {locale === "fr" ? "Courses" : "Trips"}
                        </p>
                        <p className="text-lg font-bold text-gray-900">142</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                        <p className="text-[10px] text-gray-500">
                          {locale === "fr" ? "Heures" : "Hours"}
                        </p>
                        <p className="text-lg font-bold text-gray-900">48h</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                        <p className="text-[10px] text-gray-500">Score</p>
                        <p className="text-lg font-bold text-green-600">4.9</p>
                      </div>
                    </div>

                    {/* Weekly chart */}
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="mb-2 text-[10px] text-gray-500">
                        {locale === "fr" ? "Activité" : "Activity"}
                      </p>
                      <div className="flex h-16 items-end justify-between gap-1.5">
                        <div
                          className="w-full rounded-t-sm bg-blue-200"
                          style={{ height: "55%" }}
                        ></div>
                        <div
                          className="w-full rounded-t-sm bg-blue-300"
                          style={{ height: "70%" }}
                        ></div>
                        <div
                          className="w-full rounded-t-sm bg-blue-400"
                          style={{ height: "45%" }}
                        ></div>
                        <div
                          className="w-full rounded-t-sm bg-blue-500"
                          style={{ height: "85%" }}
                        ></div>
                        <div
                          className="w-full rounded-t-sm bg-blue-600"
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
                      <div className="mt-2 flex justify-between text-[9px] text-gray-400">
                        <span>L</span>
                        <span>M</span>
                        <span>M</span>
                        <span>J</span>
                        <span>V</span>
                        <span>S</span>
                        <span>D</span>
                      </div>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-gray-900"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              <Smartphone className="h-4 w-4" />
              {t.badge}
            </span>

            <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl dark:text-white">
              {t.title}
            </h2>

            <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
              {t.subtitle}
            </p>

            <ul className="space-y-4">
              {t.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
