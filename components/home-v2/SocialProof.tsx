"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote, Users, TrendingUp, Clock } from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

const TESTIMONIALS = [
  {
    en: {
      quote:
        "FleetCore transformed how we manage our 200+ vehicle fleet. The multi-platform revenue import alone saves us 20 hours per week.",
      author: "Mohammed Al-Rashid",
      role: "Fleet Manager, Dubai",
      company: "RideMax Fleet",
    },
    fr: {
      quote:
        "FleetCore a transformé la gestion de notre flotte de 200+ véhicules. L'import multi-plateformes nous fait gagner 20h par semaine.",
      author: "Mohammed Al-Rashid",
      role: "Gestionnaire de Flotte, Dubaï",
      company: "RideMax Fleet",
    },
  },
  {
    en: {
      quote:
        "The real-time analytics helped us increase our fleet utilization from 65% to 87%. The ROI was visible within the first month.",
      author: "Sarah Chen",
      role: "Operations Director",
      company: "Swift Mobility",
    },
    fr: {
      quote:
        "Les analytics temps réel ont augmenté notre utilisation de 65% à 87%. Le ROI était visible dès le premier mois.",
      author: "Sarah Chen",
      role: "Directrice des Opérations",
      company: "Swift Mobility",
    },
  },
  {
    en: {
      quote:
        "Finally, a platform that understands ride-hailing operations. Document management and maintenance alerts are game changers.",
      author: "Ahmed Benali",
      role: "CEO",
      company: "Atlas Transport",
    },
    fr: {
      quote:
        "Enfin une plateforme qui comprend le VTC. La gestion documentaire et les alertes maintenance changent tout.",
      author: "Ahmed Benali",
      role: "PDG",
      company: "Atlas Transport",
    },
  },
];

const STATS = [
  {
    value: 500,
    suffix: "+",
    en: { label: "Fleet Operators" },
    fr: { label: "Opérateurs de Flotte" },
    icon: Users,
  },
  {
    value: 25000,
    suffix: "+",
    en: { label: "Vehicles Managed" },
    fr: { label: "Véhicules Gérés" },
    icon: TrendingUp,
  },
  {
    value: 3,
    suffix: "hrs",
    en: { label: "Saved Daily" },
    fr: { label: "Gagnées par Jour" },
    icon: Clock,
  },
];

export function SocialProof() {
  const { locale } = useLocalizedPath();

  const content = {
    en: {
      badge: "Trusted by Industry Leaders",
      title: "Join 500+ Fleet Operators",
      subtitle: "See why fleet managers worldwide choose FleetCore",
    },
    fr: {
      badge: "La Confiance des Leaders du Secteur",
      title: "Rejoignez 500+ Opérateurs de Flotte",
      subtitle:
        "Découvrez pourquoi les gestionnaires de flotte choisissent FleetCore",
    },
  };
  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-gray-950">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-100/30 to-purple-100/30 blur-3xl dark:from-blue-900/10 dark:to-purple-900/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
            <Star className="h-4 w-4 fill-current" />
            {t.badge}
          </span>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            {t.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mb-16 grid grid-cols-3 gap-8">
          {STATS.map((stat, index) => {
            const text = stat[locale as keyof typeof stat];
            if (typeof text !== "object" || !("label" in text)) return null;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mb-3 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  className="text-4xl font-bold text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {text.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => {
            const text =
              testimonial[locale as keyof typeof testimonial] || testimonial.en;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900"
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-blue-500/20" />

                {/* Rating */}
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="mb-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  &ldquo;{text.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                    {text.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {text.author}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {text.role} • {text.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AnimatedCounter({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
