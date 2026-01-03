"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Car,
  Users,
  TrendingUp,
  DollarSign,
  ChevronUp,
  Activity,
  MapPin,
} from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

export function LiveDashboardPreview() {
  const { locale } = useLocalizedPath();
  const [activeVehicles, setActiveVehicles] = useState(127);
  const [dailyRevenue, setDailyRevenue] = useState(24850);
  const [onlineDrivers, setOnlineDrivers] = useState(98);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVehicles((v) => v + Math.floor(Math.random() * 3 - 1));
      setDailyRevenue((v) => v + Math.floor(Math.random() * 100 - 30));
      setOnlineDrivers((v) =>
        Math.max(80, Math.min(110, v + Math.floor(Math.random() * 5 - 2)))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const content = {
    en: {
      badge: "Live Dashboard",
      title: "Real-Time Fleet Overview",
      subtitle: "See everything happening in your fleet at a glance",
      vehicles: "Active Vehicles",
      revenue: "Today's Revenue",
      drivers: "Online Drivers",
      utilization: "Fleet Utilization",
      trips: "Active Trips",
      alerts: "Pending Alerts",
      liveIndicator: "Live",
    },
    fr: {
      badge: "Tableau de Bord Live",
      title: "Vue d'Ensemble Temps Réel",
      subtitle: "Voyez tout ce qui se passe dans votre flotte en un coup d'œil",
      vehicles: "Véhicules Actifs",
      revenue: "Revenus du Jour",
      drivers: "Chauffeurs en Ligne",
      utilization: "Utilisation Flotte",
      trips: "Courses Actives",
      alerts: "Alertes en Attente",
      liveIndicator: "En direct",
    },
  };
  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section className="relative overflow-hidden bg-gray-50 py-24 dark:bg-gray-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8881_1px,transparent_1px),linear-gradient(to_bottom,#8881_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            {t.badge}
          </span>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            {t.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 rounded-t-2xl bg-gray-800 p-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div className="mx-4 flex-1">
              <div className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-1.5 text-sm text-gray-400">
                <MapPin className="h-4 w-4" />
                app.fleetcore.io/dashboard
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              {t.liveIndicator}
            </div>
          </div>

          {/* Dashboard content */}
          <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            {/* Stats row */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                icon={Car}
                label={t.vehicles}
                value={activeVehicles}
                change={+5}
                color="blue"
              />
              <StatCard
                icon={DollarSign}
                label={t.revenue}
                value={dailyRevenue}
                prefix="$"
                change={+12}
                color="green"
              />
              <StatCard
                icon={Users}
                label={t.drivers}
                value={onlineDrivers}
                change={+3}
                color="purple"
              />
              <StatCard
                icon={TrendingUp}
                label={t.utilization}
                value={87}
                suffix="%"
                change={+2}
                color="orange"
              />
            </div>

            {/* Activity visualization */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Mini chart */}
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.trips}
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    42
                  </span>
                </div>
                <div className="flex h-20 items-end gap-1">
                  {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 42].map(
                    (h, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-sm bg-gradient-to-t from-blue-500 to-blue-400"
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Activity feed */}
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.alerts}
                  </span>
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-900/50 dark:text-orange-400">
                    3
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      color: "bg-yellow-500",
                      text: "Insurance expiring: VH-2847",
                    },
                    { color: "bg-blue-500", text: "Maintenance due: VH-1923" },
                    {
                      color: "bg-green-500",
                      text: "New driver verified: Ahmed K.",
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <Activity className="h-4 w-4" />
                      <div className={`h-2 w-2 rounded-full ${item.color}`} />
                      {item.text}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Glow effect */}
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  suffix = "",
  change,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  color: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 shadow-blue-500/30",
    green: "from-green-500 to-emerald-600 shadow-green-500/30",
    purple: "from-purple-500 to-pink-600 shadow-purple-500/30",
    orange: "from-orange-500 to-red-500 shadow-orange-500/30",
  };

  return (
    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mb-2 flex items-center justify-between">
        <div
          className={`h-8 w-8 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center shadow-lg`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-green-500">
          <ChevronUp className="h-3 w-3" />
          {change}%
        </div>
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="text-2xl font-bold text-gray-900 dark:text-white"
      >
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </motion.div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {label}
      </div>
    </div>
  );
}
