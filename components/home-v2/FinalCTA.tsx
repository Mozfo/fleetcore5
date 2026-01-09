"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Calendar, MessageCircle } from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

export function FinalCTA() {
  const { locale, localizedPath } = useLocalizedPath();

  const content = {
    en: {
      badge: "Ready to Transform Your Fleet?",
      title: "Start Your Journey Today",
      subtitle:
        "Join hundreds of fleet operators who've already transformed their operations",
      cta1: "Schedule a Demo",
      cta1Sub: "30-min personalized walkthrough",
      cta2: "Contact Sales",
      cta2Sub: "Talk to our team",
      guarantee: "No commitment required • Free demo • Setup in 48 hours",
    },
    fr: {
      badge: "Prêt à Transformer Votre Flotte ?",
      title: "Commencez Votre Parcours Aujourd'hui",
      subtitle:
        "Rejoignez des centaines d'opérateurs qui ont déjà transformé leurs opérations",
      cta1: "Réserver une Démo",
      cta1Sub: "Présentation personnalisée de 30 min",
      cta2: "Contacter les Ventes",
      cta2Sub: "Parlez à notre équipe",
      guarantee: "Sans engagement • Démo gratuite • Mise en place en 48h",
    },
  };
  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section className="relative overflow-hidden py-24">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700" />

      {/* Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-400/30 blur-3xl" />
      <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-purple-400/30 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            {t.badge}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-6 text-4xl font-bold text-white sm:text-5xl"
        >
          {t.title}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-xl text-blue-100"
        >
          {t.subtitle}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          {/* Primary CTA */}
          <Link
            href={localizedPath("/book-demo")}
            className="group relative flex flex-col items-center rounded-2xl bg-white px-8 py-4 shadow-xl shadow-black/20 transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-blue-600" />
              {t.cta1}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
            <span className="mt-1 text-xs text-gray-500">{t.cta1Sub}</span>
          </Link>

          {/* Secondary CTA */}
          <Link
            href={`mailto:contact@fleetcore.io`}
            className="group flex flex-col items-center rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-4 backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20"
          >
            <div className="flex items-center gap-2 font-semibold text-white">
              <MessageCircle className="h-5 w-5" />
              {t.cta2}
            </div>
            <span className="mt-1 text-xs text-blue-200">{t.cta2Sub}</span>
          </Link>
        </motion.div>

        {/* Guarantee */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-sm text-blue-200"
        >
          {t.guarantee}
        </motion.p>
      </div>
    </section>
  );
}
