"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import {
  Car,
  User,
  FileText,
  Wrench,
  Smartphone,
  DollarSign,
  Check,
} from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

const PLATFORMS = [
  { name: "Uber", color: "#000000", bg: "#ffffff" },
  { name: "Bolt", color: "#34D186", bg: "#ffffff" },
  { name: "Careem", color: "#4CAF50", bg: "#ffffff" },
  { name: "Yango", color: "#FC3F1D", bg: "#ffffff" },
  { name: "FreeNow", color: "#C8102E", bg: "#ffffff" },
  { name: "InDriver", color: "#9FE802", bg: "#000000" },
];

interface StepContent {
  title: string;
  description: string;
}

const STEPS: { en: StepContent; fr: StepContent }[] = [
  {
    en: {
      title: "A vehicle joins your fleet",
      description: "Add vehicles with full documentation and tracking",
    },
    fr: {
      title: "Un véhicule rejoint votre flotte",
      description: "Ajoutez des véhicules avec documentation complète",
    },
  },
  {
    en: {
      title: "A driver joins your team",
      description: "Onboard drivers with digital document verification",
    },
    fr: {
      title: "Un chauffeur rejoint votre équipe",
      description: "Intégrez les chauffeurs avec vérification digitale",
    },
  },
  {
    en: {
      title: "Driver gets assigned to vehicle",
      description: "Smart assignment based on availability and skills",
    },
    fr: {
      title: "Chauffeur assigné au véhicule",
      description: "Assignation intelligente selon disponibilité",
    },
  },
  {
    en: {
      title: "Driver goes online on platforms",
      description: "Connect to Uber, Bolt, Careem and start earning",
    },
    fr: {
      title: "Chauffeur en ligne sur les plateformes",
      description: "Connecté à Uber, Bolt, Careem pour gagner",
    },
  },
  {
    en: {
      title: "Everything syncs to FleetCore",
      description: "Complete visibility, zero manual work",
    },
    fr: {
      title: "Tout se synchronise sur FleetCore",
      description: "Visibilité totale, zéro travail manuel",
    },
  },
];

export function AnimatedStory() {
  const { locale } = useLocalizedPath();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Transform scroll progress to step index (0-4)
  const currentStep = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6, 0.8, 1],
    [0, 1, 2, 3, 4, 4]
  );

  const content = {
    en: { sectionTitle: "See How FleetCore Works", stepLabel: "Step" },
    fr: {
      sectionTitle: "Découvrez Comment FleetCore Fonctionne",
      stepLabel: "Étape",
    },
  };
  const t = content[locale as keyof typeof content] || content.en;

  return (
    <section
      ref={containerRef}
      className="relative min-h-[500vh] bg-gray-50 dark:bg-gray-900"
    >
      {/* Sticky container */}
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" />

        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8881_1px,transparent_1px),linear-gradient(to_bottom,#8881_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
          {/* Section title */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-12 text-center text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white"
          >
            {t.sectionTitle}
          </motion.h2>

          {/* Animation canvas */}
          <div className="relative h-[500px] w-full">
            {/* FleetCore Hub (center) */}
            <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                className="relative"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/30">
                  <div className="text-center text-white">
                    <div className="text-lg font-bold">FleetCore</div>
                    <div className="text-xs opacity-80">Hub</div>
                  </div>
                </div>
                {/* Pulse rings */}
                <div
                  className="absolute inset-0 animate-ping rounded-full border-2 border-blue-400/50"
                  style={{ animationDuration: "2s" }}
                />
                <div
                  className="absolute inset-[-8px] animate-ping rounded-full border border-blue-400/30"
                  style={{ animationDuration: "3s" }}
                />
              </motion.div>
            </div>

            {/* Step 1: Vehicle */}
            <VehicleAnimation scrollProgress={scrollYProgress} />

            {/* Step 2: Driver */}
            <DriverAnimation scrollProgress={scrollYProgress} />

            {/* Step 3: Connection line */}
            <ConnectionAnimation scrollProgress={scrollYProgress} />

            {/* Step 4: Platforms */}
            <PlatformsAnimation scrollProgress={scrollYProgress} />

            {/* Step 5: Data flows */}
            <DataFlowsAnimation scrollProgress={scrollYProgress} />
          </div>

          {/* Step indicators */}
          <div className="mt-8 flex justify-center gap-2">
            {STEPS.map((step, index) => (
              <StepIndicator
                key={index}
                index={index}
                currentStep={currentStep}
                step={step[locale as keyof typeof step] || step.en}
                label={t.stepLabel}
              />
            ))}
          </div>

          {/* Current step description */}
          <StepDescription
            currentStep={currentStep}
            steps={STEPS}
            locale={locale}
          />
        </div>

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
          style={{
            width: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]),
          }}
        />
      </div>
    </section>
  );
}

// Vehicle animation component
function VehicleAnimation({
  scrollProgress,
}: {
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const x = useTransform(scrollProgress, [0, 0.15], [-200, 0]);
  const opacity = useTransform(scrollProgress, [0, 0.1, 0.15], [0, 0.5, 1]);
  const scale = useTransform(scrollProgress, [0.1, 0.15], [0.8, 1]);

  return (
    <motion.div
      className="absolute top-1/2 left-[15%] -translate-y-1/2"
      style={{ x, opacity, scale }}
    >
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/30">
          <Car className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-md dark:bg-gray-800 dark:text-gray-300">
          Vehicle
        </div>
      </div>
    </motion.div>
  );
}

// Driver animation component
function DriverAnimation({
  scrollProgress,
}: {
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const x = useTransform(scrollProgress, [0.15, 0.3], [200, 0]);
  const opacity = useTransform(scrollProgress, [0.15, 0.2, 0.3], [0, 0.5, 1]);
  const scale = useTransform(scrollProgress, [0.2, 0.3], [0.8, 1]);

  return (
    <motion.div
      className="absolute top-1/2 right-[15%] -translate-y-1/2"
      style={{ x, opacity, scale }}
    >
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl shadow-green-500/30">
          <User className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-md dark:bg-gray-800 dark:text-gray-300">
          Driver
        </div>
      </div>
    </motion.div>
  );
}

// Connection line animation
function ConnectionAnimation({
  scrollProgress,
}: {
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const pathLength = useTransform(scrollProgress, [0.3, 0.45], [0, 1]);
  const opacity = useTransform(scrollProgress, [0.3, 0.35], [0, 1]);

  return (
    <motion.svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity }}
    >
      {/* Vehicle to center */}
      <motion.line
        x1="25%"
        y1="50%"
        x2="42%"
        y2="50%"
        stroke="url(#gradient-blue)"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ pathLength }}
      />
      {/* Driver to center */}
      <motion.line
        x1="75%"
        y1="50%"
        x2="58%"
        y2="50%"
        stroke="url(#gradient-green)"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ pathLength }}
      />
      {/* Connection arc between vehicle and driver */}
      <motion.path
        d="M 25% 45% Q 50% 25% 75% 45%"
        fill="none"
        stroke="url(#gradient-purple)"
        strokeWidth="2"
        strokeDasharray="5,5"
        style={{ pathLength }}
      />
      <defs>
        <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Platforms animation
function PlatformsAnimation({
  scrollProgress,
}: {
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const opacity = useTransform(scrollProgress, [0.45, 0.55], [0, 1]);
  const scale = useTransform(scrollProgress, [0.45, 0.55], [0.5, 1]);

  const positions = [
    { x: "50%", y: "10%", delay: 0 },
    { x: "75%", y: "20%", delay: 0.1 },
    { x: "85%", y: "45%", delay: 0.2 },
    { x: "75%", y: "70%", delay: 0.3 },
    { x: "50%", y: "85%", delay: 0.4 },
    { x: "25%", y: "70%", delay: 0.5 },
  ];

  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      {PLATFORMS.map((platform, index) => {
        const pos = positions[index];
        return (
          <motion.div
            key={platform.name}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pos.x, top: pos.y, scale }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: pos.delay }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl border-2 text-xs font-bold shadow-lg"
              style={{
                backgroundColor: platform.bg,
                color: platform.color,
                borderColor: platform.color + "40",
              }}
            >
              {platform.name.slice(0, 2).toUpperCase()}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Data flows animation (final step)
function DataFlowsAnimation({
  scrollProgress,
}: {
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const opacity = useTransform(scrollProgress, [0.7, 0.8], [0, 1]);

  const outputs = [
    {
      icon: DollarSign,
      label: "Revenue",
      color: "text-green-500",
      position: "top-[15%] left-[10%]",
    },
    {
      icon: FileText,
      label: "Documents",
      color: "text-blue-500",
      position: "top-[15%] right-[10%]",
    },
    {
      icon: Wrench,
      label: "Maintenance",
      color: "text-orange-500",
      position: "bottom-[15%] left-[10%]",
    },
    {
      icon: Smartphone,
      label: "Driver App",
      color: "text-purple-500",
      position: "bottom-[15%] right-[10%]",
    },
  ];

  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      {outputs.map((output, index) => (
        <motion.div
          key={output.label}
          className={`absolute ${output.position}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-lg dark:bg-gray-800">
            <output.icon className={`h-5 w-5 ${output.color}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {output.label}
            </span>
            <Check className="h-4 w-4 text-green-500" />
          </div>
        </motion.div>
      ))}

      {/* Animated particles flowing */}
      <FlowingParticles scrollProgress={scrollProgress} />
    </motion.div>
  );
}

// Flowing particles effect
function FlowingParticles({
  scrollProgress,
}: {
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const opacity = useTransform(scrollProgress, [0.55, 0.65], [0, 1]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      style={{ opacity }}
    >
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
          style={{
            left: `${50 + Math.cos((i * Math.PI) / 4) * 25}%`,
            top: `${50 + Math.sin((i * Math.PI) / 4) * 25}%`,
          }}
          animate={{
            x: [0, Math.cos((i * Math.PI) / 4) * -80],
            y: [0, Math.sin((i * Math.PI) / 4) * -80],
            opacity: [1, 0],
            scale: [1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut",
          }}
        />
      ))}
    </motion.div>
  );
}

// Step indicator component
function StepIndicator({
  index,
  currentStep,
  step: _step,
  label,
}: {
  index: number;
  currentStep: MotionValue<number>;
  step: StepContent;
  label: string;
}) {
  const isActive = useTransform(currentStep, (v: number) => v >= index);
  const bgColor = useTransform(isActive, (active: boolean) =>
    active ? "#8B5CF6" : "#D1D5DB"
  );

  return (
    <motion.div className="group relative" whileHover={{ scale: 1.1 }}>
      <motion.div
        className="h-3 w-3 rounded-full transition-colors"
        style={{ backgroundColor: bgColor }}
      />
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white dark:bg-gray-700">
          {label} {index + 1}
        </div>
      </div>
    </motion.div>
  );
}

// Step description component
function StepDescription({
  currentStep,
  steps,
  locale,
}: {
  currentStep: MotionValue<number>;
  steps: typeof STEPS;
  locale: string;
}) {
  return (
    <div className="relative mt-8 h-24 text-center">
      {steps.map((step, index) => (
        <StepDescriptionItem
          key={index}
          index={index}
          currentStep={currentStep}
          content={step[locale as keyof typeof step] || step.en}
        />
      ))}
    </div>
  );
}

// Individual step description item
function StepDescriptionItem({
  index,
  currentStep,
  content,
}: {
  index: number;
  currentStep: MotionValue<number>;
  content: StepContent;
}) {
  const opacity = useTransform(currentStep, (v: number) =>
    Math.round(v) === index ? 1 : 0
  );
  const y = useTransform(currentStep, (v: number) =>
    Math.round(v) === index ? 0 : 20
  );

  return (
    <motion.div className="absolute right-0 left-0" style={{ opacity, y }}>
      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
        {content.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">{content.description}</p>
    </motion.div>
  );
}
