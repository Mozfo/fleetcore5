"use client";

import { motion } from "framer-motion";
import { PieChart, Clock, TrendingUp, Shield, Check } from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

const BENEFITS = [
  {
    icon: PieChart,
    en: {
      title: "Know your real profitability",
      description:
        "See exactly what you earn after all costs. No more guessing, no more surprises at month end.",
      features: ["Revenue per vehicle", "Cost breakdown", "Profit margins"],
    },
    fr: {
      title: "Connaissez votre rentabilité réelle",
      description:
        "Voyez exactement ce que vous gagnez après tous les coûts. Plus de suppositions, plus de surprises en fin de mois.",
      features: [
        "Revenus par véhicule",
        "Détail des coûts",
        "Marges bénéficiaires",
      ],
    },
  },
  {
    icon: Clock,
    en: {
      title: "Save hours every week",
      description:
        "Automatic calculations, centralized data. Stop wasting time on spreadsheets.",
      features: ["Auto-import data", "One dashboard", "Export reports"],
    },
    fr: {
      title: "Économisez des heures chaque semaine",
      description:
        "Calculs automatiques, données centralisées. Arrêtez de perdre du temps sur Excel.",
      features: [
        "Import auto des données",
        "Un seul tableau de bord",
        "Export des rapports",
      ],
    },
  },
  {
    icon: TrendingUp,
    en: {
      title: "Grow with confidence",
      description:
        "Add vehicles and drivers knowing your numbers are under control.",
      features: ["Scalable system", "Multi-vehicle view", "Growth tracking"],
    },
    fr: {
      title: "Grandissez en confiance",
      description:
        "Ajoutez des véhicules et des chauffeurs en sachant que vos chiffres sont sous contrôle.",
      features: [
        "Système évolutif",
        "Vue multi-véhicules",
        "Suivi de croissance",
      ],
    },
  },
  {
    icon: Shield,
    en: {
      title: "Stay compliant",
      description:
        "Never miss a renewal. Documents, insurance, maintenance - all tracked automatically.",
      features: ["Expiry alerts", "Document storage", "Compliance status"],
    },
    fr: {
      title: "Restez conforme",
      description:
        "Ne manquez jamais un renouvellement. Documents, assurance, maintenance - tout est suivi.",
      features: [
        "Alertes d'expiration",
        "Stockage documents",
        "Statut conformité",
      ],
    },
  },
];

export function Features() {
  const { locale } = useLocalizedPath();

  const content = {
    en: {
      headline: "Everything you need to run your fleet",
      intro:
        "FleetCore handles the complexity so you can focus on what matters.",
    },
    fr: {
      headline: "Tout ce qu'il faut pour gérer votre flotte",
      intro:
        "FleetCore gère la complexité pour que vous puissiez vous concentrer sur l'essentiel.",
    },
  };

  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section className="bg-gray-50 py-16 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t.headline}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-600 dark:text-gray-400">
            {t.intro}
          </p>
        </motion.div>

        {/* Benefits grid - 4 columns on large screens */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit, index) => {
            const text = benefit[locale as keyof typeof benefit] || benefit.en;
            if (typeof text === "function") return null;
            const textData = text as {
              title: string;
              description: string;
              features: string[];
            };

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600">
                  <benefit.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                  {textData.title}
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {textData.description}
                </p>
                <ul className="space-y-1.5">
                  {textData.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300"
                    >
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
