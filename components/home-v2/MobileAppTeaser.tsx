"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Smartphone,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

export function MobileAppTeaser() {
  const { locale, localizedPath } = useLocalizedPath();

  const content = {
    en: {
      badge: "Driver Mobile App",
      title: "Your Drivers Get Their Own App",
      subtitle:
        "Keep drivers informed and engaged with a dedicated mobile experience",
      features: [
        { icon: DollarSign, text: "Track earnings in real-time" },
        { icon: Clock, text: "View shift schedules" },
        { icon: TrendingUp, text: "Performance insights" },
        { icon: Star, text: "See ratings & tips" },
      ],
      cta: "Explore Driver App",
      stats: { drivers: "15K+ drivers", rating: "4.8 rating" },
    },
    fr: {
      badge: "App Mobile Chauffeur",
      title: "Vos Chauffeurs Ont Leur Propre App",
      subtitle:
        "Gardez vos chauffeurs informés avec une expérience mobile dédiée",
      features: [
        { icon: DollarSign, text: "Suivi des revenus en temps réel" },
        { icon: Clock, text: "Consulter les plannings" },
        { icon: TrendingUp, text: "Insights performance" },
        { icon: Star, text: "Notes & pourboires" },
      ],
      cta: "Découvrir l'App Chauffeur",
      stats: { drivers: "15K+ chauffeurs", rating: "Note 4.8" },
    },
  };
  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-gray-950">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              <Smartphone className="h-4 w-4" />
              {t.badge}
            </span>

            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
              {t.title}
            </h2>

            <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
              {t.subtitle}
            </p>

            {/* Features */}
            <div className="mb-8 grid grid-cols-2 gap-4">
              {t.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                    <feature.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={localizedPath("/solopreneur")}
              className="group inline-flex items-center gap-2 font-semibold text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              {t.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative flex justify-center"
          >
            {/* Phone frame */}
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-2xl" />

              {/* Phone */}
              <div className="relative h-[560px] w-[280px] rounded-[3rem] bg-gray-900 p-2 shadow-2xl">
                {/* Screen */}
                <div className="h-full w-full overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-purple-900 to-gray-900">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-4 text-xs text-white">
                    <span>9:41</span>
                    <div className="h-6 w-20 rounded-full bg-black" />
                    <span>100%</span>
                  </div>

                  {/* App content */}
                  <div className="mt-2 p-4">
                    {/* Header */}
                    <div className="mb-6 text-center">
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                        <span className="text-2xl font-bold text-white">
                          FC
                        </span>
                      </div>
                      <h3 className="font-semibold text-white">
                        FleetCore Driver
                      </h3>
                    </div>

                    {/* Stats cards */}
                    <div className="space-y-3">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-xl bg-white/10 p-3 backdrop-blur"
                      >
                        <div className="mb-1 text-xs text-purple-300">
                          Today&apos;s Earnings
                        </div>
                        <div className="text-2xl font-bold text-white">
                          $284.50
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="rounded-xl bg-white/10 p-3 backdrop-blur"
                      >
                        <div className="mb-1 text-xs text-purple-300">
                          Online Hours
                        </div>
                        <div className="text-xl font-bold text-white">
                          6h 42m
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-between rounded-xl bg-white/10 p-3 backdrop-blur"
                      >
                        <div>
                          <div className="mb-1 text-xs text-purple-300">
                            Rating
                          </div>
                          <div className="text-xl font-bold text-white">
                            4.92
                          </div>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`}
                            />
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="absolute top-8 -left-4 rounded-lg bg-white px-3 py-2 shadow-lg dark:bg-gray-800"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t.stats.drivers}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="absolute -right-4 bottom-12 flex items-center gap-1 rounded-lg bg-white px-3 py-2 shadow-lg dark:bg-gray-800"
            >
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t.stats.rating}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
