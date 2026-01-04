"use client";

import { motion } from "framer-motion";
import { Clock, Eye, Calculator, TrendingUp } from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

const CHALLENGES = [
  {
    icon: Clock,
    en: {
      title: "Administrative overload",
      description:
        "Hours spent on spreadsheets, reconciling revenues, managing documents.",
    },
    fr: {
      title: "Surcharge administrative",
      description:
        "Des heures passées sur Excel, à réconcilier les revenus, gérer les documents.",
    },
  },
  {
    icon: Eye,
    en: {
      title: "No visibility",
      description:
        "Hard to know which driver performs best, which platform pays more.",
    },
    fr: {
      title: "Manque de visibilité",
      description:
        "Difficile de savoir quel chauffeur performe, quelle plateforme rapporte plus.",
    },
  },
  {
    icon: Calculator,
    en: {
      title: "Hidden costs",
      description:
        "Fuel, maintenance, dead miles... real profitability is unclear.",
    },
    fr: {
      title: "Coûts cachés",
      description:
        "Carburant, maintenance, kilomètres à vide... la rentabilité réelle est floue.",
    },
  },
  {
    icon: TrendingUp,
    en: {
      title: "Growth blocked",
      description:
        "Scaling means more chaos. Adding vehicles without the right tools is risky.",
    },
    fr: {
      title: "Croissance bloquée",
      description:
        "Grandir = plus de chaos. Ajouter des véhicules sans les bons outils est risqué.",
    },
  },
];

export function ValueProps() {
  const { locale } = useLocalizedPath();

  const content = {
    en: {
      title: "The challenges you face",
      subtitle: "Managing a fleet is complex. We understand.",
    },
    fr: {
      title: "Les défis que vous rencontrez",
      subtitle: "Gérer une flotte est complexe. Nous comprenons.",
    },
  };

  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section className="bg-white py-20 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
            {t.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Challenges grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {CHALLENGES.map((challenge, index) => {
            const text =
              challenge[locale as keyof typeof challenge] || challenge.en;
            if (typeof text === "function") return null;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <challenge.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {(text as { title: string; description: string }).title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {(text as { title: string; description: string }).description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
