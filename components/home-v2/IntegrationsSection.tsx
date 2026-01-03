"use client";

import { motion } from "framer-motion";
import { Plug, Check } from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

const INTEGRATIONS = {
  platforms: [
    { name: "Uber", logo: "U", color: "#000000", bg: "#ffffff" },
    { name: "Bolt", logo: "B", color: "#34D186", bg: "#ffffff" },
    { name: "Careem", logo: "C", color: "#4CAF50", bg: "#ffffff" },
    { name: "Yango", logo: "Y", color: "#FC3F1D", bg: "#ffffff" },
    { name: "FreeNow", logo: "F", color: "#C8102E", bg: "#ffffff" },
    { name: "InDriver", logo: "I", color: "#9FE802", bg: "#000000" },
  ],
  payments: [
    { name: "Stripe", logo: "S", color: "#635BFF", bg: "#ffffff" },
    { name: "PayPal", logo: "P", color: "#003087", bg: "#ffffff" },
    { name: "Square", logo: "Sq", color: "#000000", bg: "#ffffff" },
  ],
  tools: [
    { name: "QuickBooks", logo: "QB", color: "#2CA01C", bg: "#ffffff" },
    { name: "Xero", logo: "X", color: "#13B5EA", bg: "#ffffff" },
    { name: "Excel", logo: "E", color: "#217346", bg: "#ffffff" },
  ],
  hardware: [
    { name: "GPS", logo: "📍", color: "#000", bg: "#f3f4f6" },
    { name: "Dashcam", logo: "📹", color: "#000", bg: "#f3f4f6" },
    { name: "OBD", logo: "🔌", color: "#000", bg: "#f3f4f6" },
  ],
};

export function IntegrationsSection() {
  const { locale } = useLocalizedPath();

  const content = {
    en: {
      badge: "Integrations",
      title: "Works With Everything You Use",
      subtitle: "Seamless connections to your favorite platforms and tools",
      categories: {
        platforms: "Ride-Hailing Platforms",
        payments: "Payment Systems",
        tools: "Accounting Tools",
        hardware: "Hardware",
      },
      more: "and more...",
    },
    fr: {
      badge: "Intégrations",
      title: "Compatible Avec Tous Vos Outils",
      subtitle: "Connexions transparentes avec vos plateformes préférées",
      categories: {
        platforms: "Plateformes VTC",
        payments: "Systèmes de Paiement",
        tools: "Outils Comptables",
        hardware: "Matériel",
      },
      more: "et plus...",
    },
  };
  const t = content[locale as keyof typeof content] || content.en;

  const categories = [
    { key: "platforms", items: INTEGRATIONS.platforms },
    { key: "payments", items: INTEGRATIONS.payments },
    { key: "tools", items: INTEGRATIONS.tools },
    { key: "hardware", items: INTEGRATIONS.hardware },
  ];

  return (
    <section className="relative overflow-hidden bg-gray-50 py-24 dark:bg-gray-900">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            <Plug className="h-4 w-4" />
            {t.badge}
          </span>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            {t.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Integration categories */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, catIndex) => (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                {t.categories[category.key as keyof typeof t.categories]}
              </h3>

              <div className="space-y-3">
                {category.items.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: catIndex * 0.1 + index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold shadow-sm"
                      style={{
                        backgroundColor: item.bg,
                        color: item.color,
                        borderColor: item.color + "30",
                      }}
                    >
                      {item.logo}
                    </div>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                    <Check className="h-4 w-4 text-green-500" />
                  </motion.div>
                ))}
              </div>

              <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                {t.more}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
