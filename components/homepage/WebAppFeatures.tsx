"use client";

import { motion } from "framer-motion";
import {
  Car,
  Users,
  DollarSign,
  FileText,
  Wrench,
  BarChart3,
  Calendar,
  Bell,
  Shield,
} from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

const FEATURES = [
  {
    icon: Car,
    color: "from-blue-500 to-blue-600",
    shadow: "shadow-blue-500/30",
    en: {
      title: "Vehicle Management",
      desc: "Full lifecycle tracking, documents, GPS",
    },
    fr: {
      title: "Gestion Véhicules",
      desc: "Cycle de vie complet, documents, GPS",
    },
  },
  {
    icon: Users,
    color: "from-green-500 to-emerald-600",
    shadow: "shadow-green-500/30",
    en: {
      title: "Driver Management",
      desc: "Onboarding, documents, performance",
    },
    fr: {
      title: "Gestion Chauffeurs",
      desc: "Intégration, documents, performance",
    },
  },
  {
    icon: DollarSign,
    color: "from-yellow-500 to-orange-500",
    shadow: "shadow-yellow-500/30",
    en: {
      title: "Revenue Tracking",
      desc: "Multi-platform import, reconciliation",
    },
    fr: {
      title: "Suivi Revenus",
      desc: "Import multi-plateformes, réconciliation",
    },
  },
  {
    icon: FileText,
    color: "from-purple-500 to-pink-500",
    shadow: "shadow-purple-500/30",
    en: { title: "Document Control", desc: "Expiry alerts, digital storage" },
    fr: {
      title: "Gestion Documents",
      desc: "Alertes expiration, stockage digital",
    },
  },
  {
    icon: Wrench,
    color: "from-orange-500 to-red-500",
    shadow: "shadow-orange-500/30",
    en: { title: "Maintenance", desc: "Scheduling, cost tracking, vendors" },
    fr: { title: "Maintenance", desc: "Planification, coûts, prestataires" },
  },
  {
    icon: BarChart3,
    color: "from-cyan-500 to-blue-500",
    shadow: "shadow-cyan-500/30",
    en: { title: "Analytics", desc: "Real-time dashboards, custom reports" },
    fr: { title: "Analytics", desc: "Tableaux de bord temps réel, rapports" },
  },
  {
    icon: Calendar,
    color: "from-indigo-500 to-purple-500",
    shadow: "shadow-indigo-500/30",
    en: { title: "Scheduling", desc: "Shifts, assignments, calendar view" },
    fr: { title: "Planification", desc: "Shifts, assignations, calendrier" },
  },
  {
    icon: Bell,
    color: "from-pink-500 to-rose-500",
    shadow: "shadow-pink-500/30",
    en: { title: "Alerts", desc: "Smart notifications, customizable" },
    fr: {
      title: "Alertes",
      desc: "Notifications intelligentes, personnalisables",
    },
  },
  {
    icon: Shield,
    color: "from-emerald-500 to-teal-500",
    shadow: "shadow-emerald-500/30",
    en: { title: "Compliance", desc: "Audit trail, regulatory tracking" },
    fr: { title: "Conformité", desc: "Audit trail, suivi réglementaire" },
  },
];

export function WebAppFeatures() {
  const { locale } = useLocalizedPath();

  const content = {
    en: {
      badge: "Web Application",
      title: "Everything You Need in One Dashboard",
      subtitle: "Powerful features designed for fleet operators",
    },
    fr: {
      badge: "Application Web",
      title: "Tout Ce Dont Vous Avez Besoin en Un Tableau de Bord",
      subtitle: "Fonctionnalités puissantes pour opérateurs de flotte",
    },
  };
  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-gray-950">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-purple-100/50 blur-3xl dark:bg-purple-900/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            <BarChart3 className="h-4 w-4" />
            {t.badge}
          </span>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            {t.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const text = feature[locale as keyof typeof feature] || feature.en;
            if (typeof text === "string" || !("title" in text)) return null;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div className="relative h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
                  {/* Icon */}
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4 flex items-center justify-center shadow-lg ${feature.shadow}`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {text.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {text.desc}
                  </p>

                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
