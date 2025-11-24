/**
 * ProgressBar Component
 * Barre de progression visuelle pour scores/pourcentages
 * Support animation + dark mode
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
}

/**
 * Determine la couleur en fonction du score
 */
function getColorByScore(value: number, max: number): string {
  const percentage = (value / max) * 100;

  if (percentage >= 75) return "bg-green-500";
  if (percentage >= 50) return "bg-blue-500";
  if (percentage >= 25) return "bg-amber-500";
  return "bg-red-500";
}

/**
 * ProgressBar - Barre de progression animée
 *
 * @example
 * <ProgressBar value={72} max={100} showLabel />
 * <ProgressBar value={45} max={100} variant="success" size="lg" />
 */
export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  size = "md",
  variant = "default",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: getColorByScore(value, max),
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Container de la barre */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800",
          sizeClasses[size]
        )}
      >
        {/* Barre de progression animée */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1], // easeOutExpo
          }}
          className={cn(
            "relative h-full overflow-hidden rounded-full",
            variantClasses[variant]
          )}
        >
          {/* Shimmer effect sur la barre */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }}
          />
        </motion.div>
      </div>

      {/* Label optionnel */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
        >
          <span>{value}</span>
          <span>{max}</span>
        </motion.div>
      )}
    </div>
  );
}

/**
 * ProgressBar circulaire (pour usage futur - dashboards)
 */
export function CircularProgress({
  value,
  max = 100,
  size = 60,
  strokeWidth = 4,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-800"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={getColorByScore(value, max).replace("bg-", "text-")}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {/* Value label */}
      <span className="absolute text-sm font-medium">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}
