import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FCStatCardVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger";

interface FCStatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  variant?: FCStatCardVariant;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

const ICON_STYLES: Record<FCStatCardVariant, string> = {
  default: "bg-fc-neutral-50 text-fc-neutral-500",
  primary: "bg-fc-primary-50 text-fc-primary-500",
  success: "bg-fc-success-50 text-fc-success-500",
  warning: "bg-fc-warning-50 text-fc-warning-500",
  danger: "bg-fc-danger-50 text-fc-danger-500",
};

/**
 * FCStatCard - Unified stat/metric card
 *
 * Replaces inconsistent stat cards across Dashboard and Reports pages.
 * Supports icon with semantic color variant and optional trend indicator.
 */
export function FCStatCard({
  label,
  value,
  icon,
  variant = "default",
  trend,
  className,
}: FCStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-fc-lg border-fc-border-light border bg-white p-4 dark:border-gray-700 dark:bg-gray-900",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              "rounded-fc-lg flex h-10 w-10 shrink-0 items-center justify-center",
              ICON_STYLES[variant]
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-fc-text-primary text-2xl font-semibold dark:text-white">
            {value}
          </p>
          <p className="text-fc-text-muted truncate text-xs dark:text-gray-400">
            {label}
          </p>
        </div>
        {trend && (
          <div
            className={cn(
              "ml-auto text-xs font-medium",
              trend.direction === "up" && "text-fc-success-500",
              trend.direction === "down" && "text-fc-danger-500",
              trend.direction === "neutral" && "text-fc-text-muted"
            )}
          >
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}
