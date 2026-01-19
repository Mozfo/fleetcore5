"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Car } from "lucide-react";

const platforms = [
  { name: "Uber", color: "#000000", textColor: "#FFFFFF" },
  { name: "Bolt", color: "#34D186", textColor: "#000000" },
  { name: "Careem", color: "#4CB848", textColor: "#FFFFFF" },
  { name: "Yango", color: "#FF4433", textColor: "#FFFFFF" },
  { name: "FreeNow", color: "#E31E5C", textColor: "#FFFFFF" },
  { name: "InDriver", color: "#00CC00", textColor: "#FFFFFF" },
];

export function PlatformHub() {
  const { t } = useTranslation("common");

  return (
    <section className="bg-white py-20 lg:py-32 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            {t("solopreneur.platforms.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            {t("solopreneur.platforms.subtitle")}
          </p>
        </motion.div>

        {/* Hub and Spoke Design */}
        <div className="flex justify-center">
          <div className="relative h-[400px] w-[400px] sm:h-[500px] sm:w-[500px]">
            {/* Connection Lines + Animated Dots - SVG for perfect alignment */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              {platforms.map((_, index) => {
                const angle = (index * 60 - 90) * (Math.PI / 180);
                // Use percentages: center at 50, radius 36 to match platform positions
                const x2 = 50 + 36 * Math.cos(angle);
                const y2 = 50 + 36 * Math.sin(angle);

                return (
                  <motion.line
                    key={`line-${index}`}
                    x1="50"
                    y1="50"
                    x2={x2}
                    y2={y2}
                    stroke="#6366F1"
                    strokeWidth="0.5"
                    strokeDasharray="2 1"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  />
                );
              })}

              {/* Animated Data Flow Dots - inside SVG for perfect alignment */}
              {platforms.map((_, index) => {
                const angle = (index * 60 - 90) * (Math.PI / 180);
                const startX = 50 + 36 * Math.cos(angle);
                const startY = 50 + 36 * Math.sin(angle);

                return (
                  <motion.circle
                    key={`dot-${index}`}
                    r="1"
                    fill="#3B82F6"
                    initial={{ cx: startX, cy: startY, opacity: 0 }}
                    animate={{
                      cx: [startX, 50],
                      cy: [startY, 50],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}
            </svg>

            {/* Center Hub - FleetCore */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: "spring" }}
              className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-700 shadow-xl shadow-blue-500/30 sm:h-32 sm:w-32">
                <div className="text-center">
                  <Car className="mx-auto h-8 w-8 text-white sm:h-10 sm:w-10" />
                  <span className="mt-1 block text-xs font-bold text-white sm:text-sm">
                    FleetCore
                  </span>
                </div>
              </div>

              {/* Pulse Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-500/50"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Platform Nodes */}
            {platforms.map((platform, index) => {
              const angle = (index * 60 - 90) * (Math.PI / 180);
              const x = 50 + 36 * Math.cos(angle); // percentage
              const y = 50 + 36 * Math.sin(angle);

              return (
                <motion.div
                  key={platform.name}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full shadow-lg transition-shadow hover:shadow-xl sm:h-20 sm:w-20"
                    style={{ backgroundColor: platform.color }}
                  >
                    <span
                      className="text-xs font-bold sm:text-sm"
                      style={{ color: platform.textColor }}
                    >
                      {platform.name}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Connected Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            6 {t("solopreneur.platforms.connected")}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
