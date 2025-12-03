"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatWidgetProps {
  value: string | number;
  label?: string;
  change?: number; // Percentage change
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "purple" | "orange" | "red";
}

const colorClasses = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  purple:
    "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  orange:
    "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

/**
 * StatWidget - Display a single KPI stat
 */
export function StatWidget({
  value,
  label,
  change,
  changeLabel,
  icon,
  color = "blue",
}: StatWidgetProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="h-3 w-3" />;
    }
    return change > 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-gray-500";
    return change > 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between">
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              colorClasses[color]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {label && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {label}
          </p>
        )}
      </div>

      {change !== undefined && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-sm",
            getTrendColor()
          )}
        >
          {getTrendIcon()}
          <span>
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          {changeLabel && (
            <span className="text-gray-500 dark:text-gray-400">
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
