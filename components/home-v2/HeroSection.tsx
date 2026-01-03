"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Smartphone } from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

export function HeroSection() {
  const { locale, localizedPath } = useLocalizedPath();

  const content = {
    en: {
      badge: "Fleet Management Ecosystem",
      title: "The Complete Fleet Management Platform",
      subtitle:
        "One platform, two apps. Everything you need to manage vehicles, drivers, and revenue.",
      cta1: "Schedule Demo",
      cta2: "Download App",
      scroll: "Scroll to see how it works",
    },
    fr: {
      badge: "Écosystème de Gestion de Flotte",
      title: "La Plateforme Complète de Gestion de Flotte",
      subtitle:
        "Une plateforme, deux apps. Tout ce qu'il vous faut pour gérer véhicules, chauffeurs et revenus.",
      cta1: "Réserver une Démo",
      cta2: "Télécharger l'App",
      scroll: "Scrollez pour voir comment ça marche",
    },
  };

  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-100/50 blur-3xl dark:bg-purple-900/20" />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-100/30 to-purple-100/30 blur-3xl dark:from-blue-900/10 dark:to-purple-900/10" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-[size:50px_50px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-800/50 dark:text-blue-300">
            <Play className="h-4 w-4" />
            {t.badge}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white"
        >
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            {t.title}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl dark:text-gray-400"
        >
          {t.subtitle}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href={localizedPath("/request-demo/form")}
            className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30"
          >
            {t.cta1}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 -translate-x-full rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </Link>

          <Link
            href={localizedPath("/solopreneur")}
            className="group flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white/80 px-8 py-4 text-base font-semibold text-gray-900 backdrop-blur-sm transition-all hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900/80 dark:text-white dark:hover:border-blue-700"
          >
            <Smartphone className="h-4 w-4" />
            {t.cta2}
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="text-sm">{t.scroll}</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex h-10 w-6 justify-center rounded-full border-2 border-gray-300 pt-2 dark:border-gray-600"
            >
              <div className="h-3 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
