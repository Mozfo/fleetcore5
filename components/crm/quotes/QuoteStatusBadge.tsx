/**
 * QuoteStatusBadge - Colored badge for quote status
 */

"use client";

import { useTranslation } from "react-i18next";
import {
  FileEdit,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { quote_status } from "@prisma/client";

const STATUS_CONFIG: Record<
  quote_status,
  {
    color: string;
    bgColor: string;
    darkBgColor: string;
    icon: typeof FileEdit;
  }
> = {
  draft: {
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100",
    darkBgColor: "dark:bg-gray-800",
    icon: FileEdit,
  },
  sent: {
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100",
    darkBgColor: "dark:bg-blue-900/30",
    icon: Send,
  },
  viewed: {
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100",
    darkBgColor: "dark:bg-purple-900/30",
    icon: Eye,
  },
  accepted: {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100",
    darkBgColor: "dark:bg-green-900/30",
    icon: CheckCircle,
  },
  rejected: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100",
    darkBgColor: "dark:bg-red-900/30",
    icon: XCircle,
  },
  expired: {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100",
    darkBgColor: "dark:bg-orange-900/30",
    icon: Clock,
  },
  converted: {
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100",
    darkBgColor: "dark:bg-emerald-900/30",
    icon: ArrowRight,
  },
};

interface QuoteStatusBadgeProps {
  status: quote_status;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export function QuoteStatusBadge({
  status,
  showIcon = true,
  size = "sm",
}: QuoteStatusBadgeProps) {
  const { t } = useTranslation("crm");
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.color,
        config.bgColor,
        config.darkBgColor,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {showIcon && <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />}
      {t(`quotes.status.${status}`, status)}
    </span>
  );
}

// Export config for use in Kanban headers
export { STATUS_CONFIG as QUOTE_STATUS_CONFIG };
