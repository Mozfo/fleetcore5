"use client";

/**
 * Book Demo Split Layout - Client Component
 *
 * Split-screen layout: Form left, Product showcase right.
 * Mobile: Stacked layout with form on top.
 */

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { TrendingUp, Star, CheckCircle2 } from "lucide-react";

interface BookDemoLayoutClientProps {
  children: React.ReactNode;
}

const stats = [
  { value: "+30%", key: "revenueIncrease" },
  { value: "10h", key: "timeSaved" },
  { value: "500+", key: "fleetManagers" },
];

export function BookDemoLayoutClient({ children }: BookDemoLayoutClientProps) {
  const params = useParams();
  const locale = (params.locale as string) || "en";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col overflow-y-auto lg:w-[45%] xl:w-[40%]">
        {/* Logo */}
        <div className="shrink-0 p-4 lg:p-6">
          <a href={`/${locale}`} className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
              F
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              FleetCore
            </span>
          </a>
        </div>

        {/* Form Content */}
        <div className="flex flex-1 items-center justify-center px-4 py-4 lg:px-8">
          <div className="w-full max-w-2xl">{children}</div>
        </div>
      </div>

      {/* Right Side - Product Showcase (hidden on mobile) */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 lg:flex lg:w-[55%] xl:w-[60%]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex w-full flex-col justify-between p-6 xl:p-10">
          {/* Top - Value Proposition */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-2 text-2xl font-bold text-white xl:text-3xl"
            >
              {locale === "fr"
                ? "La plateforme tout-en-un pour les flottes VTC"
                : "The all-in-one platform for rideshare fleets"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4 text-sm text-blue-100/80 xl:text-base"
            >
              {locale === "fr"
                ? "Connectez toutes vos plateformes, suivez la rentabilité par chauffeur, optimisez vos opérations."
                : "Connect all your platforms, track profitability per driver, optimize your operations."}
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 flex gap-6"
            >
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl font-bold text-white xl:text-3xl">
                    {stat.value}
                  </div>
                  <div className="text-xs text-blue-200/70">
                    {locale === "fr"
                      ? stat.key === "revenueIncrease"
                        ? "CA en plus"
                        : stat.key === "timeSaved"
                          ? "gagnées/semaine"
                          : "gestionnaires"
                      : stat.key === "revenueIncrease"
                        ? "more revenue"
                        : stat.key === "timeSaved"
                          ? "saved/week"
                          : "fleet managers"}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Center - Dashboard Screenshot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative min-h-0 flex-1"
          >
            {/* Browser Frame */}
            <div className="h-full max-h-[280px] overflow-hidden rounded-lg bg-slate-800 shadow-2xl ring-1 ring-white/10 xl:max-h-[340px]">
              {/* Browser Header */}
              <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800/80 px-3 py-2">
                <div className="flex gap-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-3 flex-1 rounded bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
                  app.fleetcore.io/dashboard
                </div>
              </div>
              {/* Screenshot */}
              <div className="relative h-[calc(100%-28px)]">
                <Image
                  src="/screenshots/webapp-dashboard.png"
                  alt="FleetCore Dashboard"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -right-2 -bottom-2 rounded-lg bg-white p-2 shadow-xl xl:-right-4 xl:-bottom-4 xl:p-3"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 xl:h-10 xl:w-10">
                  <TrendingUp className="h-4 w-4 text-green-600 xl:h-5 xl:w-5" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 xl:text-xs">
                    {locale === "fr" ? "CA ce mois" : "Revenue this month"}
                  </div>
                  <div className="text-sm font-bold text-gray-900 xl:text-base">
                    +24.5%
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom - Benefits + Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-4 shrink-0"
          >
            {/* Benefits */}
            <div className="mb-4 grid grid-cols-2 gap-2 xl:gap-3">
              {[
                {
                  icon: CheckCircle2,
                  text:
                    locale === "fr"
                      ? "Multi-plateformes (Uber, Bolt...)"
                      : "Multi-platform (Uber, Bolt...)",
                },
                {
                  icon: CheckCircle2,
                  text:
                    locale === "fr"
                      ? "Rentabilité par chauffeur"
                      : "Profitability per driver",
                },
                {
                  icon: CheckCircle2,
                  text:
                    locale === "fr"
                      ? "Gestion maintenance & docs"
                      : "Maintenance & docs",
                },
                {
                  icon: CheckCircle2,
                  text:
                    locale === "fr"
                      ? "Rapports automatisés"
                      : "Automated reports",
                },
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <benefit.icon className="h-4 w-4 shrink-0 text-green-400" />
                  <span className="text-xs text-blue-100/90 xl:text-sm">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-3 border-t border-white/10 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-medium text-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-xs text-blue-200/70">
                  {locale === "fr"
                    ? "Noté 4.9/5 par nos utilisateurs"
                    : "Rated 4.9/5 by our users"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
