/**
 * ScoreGauge - Circular gauge for score visualization
 * Animated SVG ring with color-coded progress
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getScoreColor } from "@/lib/utils/score-calculations";

interface ScoreGaugeProps {
  score: number | null;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizeConfig = {
  sm: {
    width: 56,
    strokeWidth: 4,
    fontSize: "text-sm",
    labelSize: "text-[10px]",
  },
  md: { width: 80, strokeWidth: 6, fontSize: "text-xl", labelSize: "text-xs" },
  lg: {
    width: 120,
    strokeWidth: 8,
    fontSize: "text-3xl",
    labelSize: "text-sm",
  },
};

export function ScoreGauge({
  score,
  maxScore = 100,
  size = "md",
  showLabel = true,
  label,
  className,
}: ScoreGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const displayScore = score ?? 0;
  const percentage = Math.min((displayScore / maxScore) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  const colors = getScoreColor(score);

  // Get stroke color based on score
  const getStrokeColor = () => {
    if (score === null) return "#9ca3af"; // gray-400
    if (score >= 70) return "#10b981"; // emerald-500
    if (score >= 40) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
    >
      {/* SVG Gauge */}
      <div
        className="relative"
        style={{ width: config.width, height: config.width }}
      >
        <svg
          width={config.width}
          height={config.width}
          className="-rotate-90 transform"
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-gray-100 dark:text-gray-800"
          />
          {/* Progress circle */}
          <motion.circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>

        {/* Center Score Value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={cn(
              "font-bold tabular-nums",
              config.fontSize,
              colors.text
            )}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {score !== null ? displayScore : "—"}
          </motion.span>
        </div>
      </div>

      {/* Label */}
      {showLabel && label && (
        <span
          className={cn(
            "mt-1.5 text-center font-medium text-gray-500 dark:text-gray-400",
            config.labelSize
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
