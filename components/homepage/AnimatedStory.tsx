"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  User,
  Smartphone,
  Wallet,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { formatCurrencyCompact } from "@/lib/utils/format-currency";

// Platform data with full names and brand colors
const PLATFORMS = [
  { name: "Uber", color: "#000000", textColor: "#ffffff" },
  { name: "Bolt", color: "#34D186", textColor: "#ffffff" },
  { name: "Careem", color: "#4CAF50", textColor: "#ffffff" },
  { name: "Yango", color: "#FC3F1D", textColor: "#ffffff" },
];

const STEP_DURATION = 3500; // 3.5 seconds per step

interface StepContent {
  title: string;
  description: string;
}

const STEPS: { en: StepContent; fr: StepContent }[] = [
  {
    en: {
      title: "A vehicle joins your fleet",
      description: "Register your vehicle in FleetCore with all documents",
    },
    fr: {
      title: "Un véhicule rejoint votre flotte",
      description:
        "Enregistrez votre véhicule dans FleetCore avec tous les documents",
    },
  },
  {
    en: {
      title: "A driver joins your team",
      description: "Onboard your driver with verified documents",
    },
    fr: {
      title: "Un chauffeur rejoint votre équipe",
      description: "Intégrez votre chauffeur avec documents vérifiés",
    },
  },
  {
    en: {
      title: "Driver gets in the vehicle",
      description: "Smart assignment connects driver to vehicle",
    },
    fr: {
      title: "Le chauffeur monte dans le véhicule",
      description: "L'assignation intelligente connecte chauffeur et véhicule",
    },
  },
  {
    en: {
      title: "Connected to ride platforms",
      description: "Work on Uber, Bolt, Careem, Yango simultaneously",
    },
    fr: {
      title: "Connecté aux plateformes VTC",
      description: "Travaillez sur Uber, Bolt, Careem, Yango simultanément",
    },
  },
  {
    en: {
      title: "Earnings sync automatically",
      description: "All revenue tracked in real-time on your dashboard & app",
    },
    fr: {
      title: "Les revenus se synchronisent",
      description:
        "Tous les revenus suivis en temps réel sur votre tableau de bord",
    },
  },
];

export function AnimatedStory() {
  const { locale } = useLocalizedPath();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const content = {
    en: {
      sectionTitle: "See How FleetCore Works",
      sectionSubtitle: "Watch the complete workflow in action",
    },
    fr: {
      sectionTitle: "Découvrez FleetCore en Action",
      sectionSubtitle: "Regardez le workflow complet",
    },
  };
  const t = content[locale as keyof typeof content] || content.en;
  const stepContent =
    STEPS[currentStep]?.[locale as keyof (typeof STEPS)[0]] ||
    STEPS[currentStep]?.en;

  // Auto-advance steps
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS.length);
    }, STEP_DURATION);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const restart = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-950">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-purple-100/50 blur-3xl dark:bg-purple-900/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            {t.sectionTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t.sectionSubtitle}
          </p>
        </div>

        {/* Animation Stage */}
        <div className="relative mx-auto mb-8 h-[350px] max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          {/* Road/Ground */}
          <div className="absolute right-0 bottom-0 left-0 h-20 bg-gradient-to-t from-gray-100 to-transparent dark:from-gray-800">
            <div className="absolute right-0 bottom-8 left-0 h-2 bg-gray-300 dark:bg-gray-600">
              {/* Road markings */}
              <div className="flex h-full items-center justify-around">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-0.5 w-8 bg-yellow-400" />
                ))}
              </div>
            </div>
          </div>

          {/* FleetCore Hub - Always visible in center */}
          <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{
                scale: currentStep >= 2 ? [1, 1.05, 1] : 1,
                boxShadow:
                  currentStep >= 4
                    ? "0 0 60px rgba(139, 92, 246, 0.5)"
                    : "0 0 30px rgba(139, 92, 246, 0.3)",
              }}
              transition={{
                duration: 1,
                repeat: currentStep >= 2 ? Infinity : 0,
              }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600"
            >
              <span className="text-center text-sm font-bold text-white">
                FleetCore
              </span>
            </motion.div>
          </div>

          {/* Step 0 & 1: Vehicle Animation */}
          <AnimatePresence>
            {currentStep >= 0 && (
              <motion.div
                initial={{ x: -150, opacity: 0 }}
                animate={{
                  x: currentStep >= 2 ? 0 : currentStep >= 1 ? -60 : -100,
                  y: currentStep >= 2 ? 0 : 60,
                  opacity: 1,
                  scale: currentStep >= 2 ? 0.9 : 1,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute bottom-16 left-1/4 z-20"
              >
                <div className="relative">
                  {/* Car body */}
                  <motion.div
                    className="flex h-16 w-28 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg"
                    animate={{
                      rotate: currentStep === 0 ? [0, -1, 1, 0] : 0,
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: currentStep === 0 ? Infinity : 0,
                    }}
                  >
                    <Car className="h-8 w-8 text-white" />
                  </motion.div>
                  {/* Wheels */}
                  <motion.div
                    className="absolute -bottom-2 left-3 h-5 w-5 rounded-full border-4 border-gray-700 bg-gray-800"
                    animate={{ rotate: currentStep <= 1 ? 360 : 0 }}
                    transition={{
                      duration: 0.5,
                      repeat: currentStep <= 1 ? Infinity : 0,
                      ease: "linear",
                    }}
                  />
                  <motion.div
                    className="absolute right-3 -bottom-2 h-5 w-5 rounded-full border-4 border-gray-700 bg-gray-800"
                    animate={{ rotate: currentStep <= 1 ? 360 : 0 }}
                    transition={{
                      duration: 0.5,
                      repeat: currentStep <= 1 ? Infinity : 0,
                      ease: "linear",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: Driver Animation */}
          <AnimatePresence>
            {currentStep >= 1 && (
              <motion.div
                initial={{ x: 150, opacity: 0 }}
                animate={{
                  x: currentStep >= 2 ? -30 : 60,
                  y: currentStep >= 2 ? 0 : 60,
                  opacity: currentStep >= 2 ? 0 : 1,
                  scale: currentStep >= 2 ? 0.5 : 1,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute right-1/4 bottom-12 z-20"
              >
                <div className="relative">
                  {/* Person body */}
                  <motion.div
                    className="flex h-20 w-12 flex-col items-center"
                    animate={{ y: currentStep === 1 ? [0, -3, 0] : 0 }}
                    transition={{
                      duration: 0.4,
                      repeat: currentStep === 1 ? Infinity : 0,
                    }}
                  >
                    {/* Head */}
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500" />
                    {/* Body */}
                    <div className="mt-1 h-10 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600" />
                    {/* Legs animation */}
                    <motion.div
                      className="flex gap-1"
                      animate={{ scaleY: currentStep === 1 ? [1, 0.9, 1] : 1 }}
                      transition={{
                        duration: 0.4,
                        repeat: currentStep === 1 ? Infinity : 0,
                      }}
                    >
                      <div className="h-4 w-2 rounded-b bg-gray-700" />
                      <div className="h-4 w-2 rounded-b bg-gray-700" />
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 2: Driver in car indicator */}
          <AnimatePresence>
            {currentStep >= 2 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute bottom-20 left-[calc(25%-10px)] z-30"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-lg">
                  <User className="h-3 w-3 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Platform connections */}
          <AnimatePresence>
            {currentStep >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                {/* Connection lines */}
                <svg className="absolute inset-0 h-full w-full">
                  {PLATFORMS.map((_, i) => {
                    const angle = (i * 90 - 45) * (Math.PI / 180);
                    const endX = 50 + Math.cos(angle) * 35;
                    const endY = 50 + Math.sin(angle) * 35;
                    return (
                      <motion.line
                        key={i}
                        x1="50%"
                        y1="50%"
                        x2={`${endX}%`}
                        y2={`${endY}%`}
                        stroke="url(#lineGradient)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                    );
                  })}
                  <defs>
                    <linearGradient
                      id="lineGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Platform logos */}
                {PLATFORMS.map((platform, i) => {
                  const angle = (i * 90 - 45) * (Math.PI / 180);
                  const x = 50 + Math.cos(angle) * 38;
                  const y = 50 + Math.sin(angle) * 38;
                  return (
                    <motion.div
                      key={platform.name}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <div
                        className="flex h-12 w-20 items-center justify-center rounded-lg font-bold shadow-lg"
                        style={{
                          backgroundColor: platform.color,
                          color: platform.textColor,
                        }}
                      >
                        {platform.name}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 4: Money flowing & App */}
          <AnimatePresence>
            {currentStep >= 4 && (
              <>
                {/* Money particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: `${20 + Math.random() * 60}%`,
                      y: "20%",
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      y: "50%",
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute z-30"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 shadow-lg">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                  </motion.div>
                ))}

                {/* Mobile App showing earnings */}
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-1/2 right-8 z-30 -translate-y-1/2"
                >
                  <div className="h-48 w-24 rounded-2xl border-4 border-gray-800 bg-gray-900 p-2 shadow-2xl">
                    <div className="h-full rounded-lg bg-gradient-to-b from-purple-600 to-blue-600 p-2">
                      <div className="mb-2 text-center text-[8px] text-white/80">
                        FleetCore
                      </div>
                      <div className="rounded bg-white/20 p-1.5 text-center">
                        <div className="text-[7px] text-white/70">Today</div>
                        <motion.div
                          className="text-sm font-bold text-white"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          {formatCurrencyCompact(847, locale)}
                        </motion.div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {PLATFORMS.slice(0, 3).map((p) => (
                          <div
                            key={p.name}
                            className="flex items-center justify-between rounded bg-white/10 px-1 py-0.5"
                          >
                            <span className="text-[6px] text-white">
                              {p.name}
                            </span>
                            <span className="text-[6px] font-bold text-green-300">
                              +$
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Smartphone className="absolute -top-2 -right-2 h-6 w-6 text-purple-500" />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Step Info */}
        <div className="mb-6 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
                {stepContent?.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {stepContent?.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Timeline & Controls */}
        <div className="flex flex-col items-center gap-4">
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className="group relative"
              >
                <motion.div
                  className={`h-3 w-3 rounded-full transition-colors ${
                    index <= currentStep
                      ? "bg-purple-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
                {index === currentStep && (
                  <motion.div
                    layoutId="activeStep"
                    className="absolute inset-0 rounded-full border-2 border-purple-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{ margin: -2 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1 w-64 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-transform hover:scale-110"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 pl-0.5" />
              )}
            </button>
            <button
              onClick={restart}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-transform hover:scale-110 dark:bg-gray-700 dark:text-gray-300"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
