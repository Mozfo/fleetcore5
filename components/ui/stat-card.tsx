/**
 * StatCard Component - Style Stripe
 * Carte de statistique avec animation de nombre et variation
 * Support dark mode + micro-interactions
 */

"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  change?: {
    value: number;
    label: string;
    positive: boolean;
  };
  className?: string;
  loading?: boolean;
}

/**
 * Animated Number Component
 * Anime le changement de valeur avec spring physics
 */
function AnimatedNumber({
  value,
  className,
}: {
  value: number | string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  // Convert string to number if needed
  const numericValue =
    typeof value === "string" ? parseFloat(value) || 0 : value;

  const spring = useSpring(numericValue, {
    damping: 15,
    stiffness: 100,
  });

  const display = useTransform(spring, (current) => {
    // Format based on magnitude
    if (current >= 1000000) {
      return `${(current / 1000000).toFixed(1)}M`;
    } else if (current >= 1000) {
      return `${(current / 1000).toFixed(1)}K`;
    }
    return Math.round(current).toString();
  });

  useEffect(() => {
    spring.set(numericValue);
  }, [numericValue, spring]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      setDisplayValue(v as unknown as number);
    });
    return () => unsubscribe();
  }, [display]);

  if (typeof value === "string" && isNaN(parseFloat(value))) {
    // If string is not numeric, display as-is
    return <span className={className}>{value}</span>;
  }

  return (
    <motion.span className={className}>{displayValue || value}</motion.span>
  );
}

/**
 * StatCard - Carte de statistique animée style Stripe
 *
 * @example
 * <StatCard
 *   icon={<Inbox className="h-4 w-4" />}
 *   label="New Leads"
 *   value={23}
 *   change={{ value: 5, label: "today", positive: true }}
 * />
 */
export function StatCard({
  icon,
  label,
  value,
  change,
  className,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "space-y-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{
        y: -2,
        boxShadow:
          "0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "space-y-2 rounded-lg border border-gray-200 bg-white p-4 transition-shadow dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <div className="flex-shrink-0">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>

      {/* Value avec animation */}
      <div>
        <AnimatedNumber
          value={value}
          className="text-2xl font-bold text-gray-900 dark:text-white"
        />
      </div>

      {/* Variation (optionnel) */}
      {change && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            change.positive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          {change.positive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>
            {change.value > 0 ? "+" : ""}
            {change.value} {change.label}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
