/**
 * LossReasonsList - List of loss reasons by category
 *
 * Displays reasons in collapsible category sections:
 * - Price, Product, Competition, Timing, Other
 *
 * @module components/crm/settings/LossReasonsList
 */

"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Package,
  Trophy,
  Clock,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { LossReasonConfig } from "./types";

type LossReasonCategory =
  | "price"
  | "product"
  | "competition"
  | "timing"
  | "other";

const CATEGORY_CONFIG: Record<
  LossReasonCategory,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  price: {
    icon: DollarSign,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
  },
  product: {
    icon: Package,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  competition: {
    icon: Trophy,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  timing: {
    icon: Clock,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
  other: {
    icon: HelpCircle,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900/20",
  },
};

const CATEGORY_ORDER: LossReasonCategory[] = [
  "price",
  "product",
  "competition",
  "timing",
  "other",
];

interface LossReasonsListProps {
  reasons: LossReasonConfig[];
  onEdit: (reason: LossReasonConfig) => void;
  onDelete: (reason: LossReasonConfig) => void;
  onAddToCategory: (category: LossReasonCategory) => void;
}

export function LossReasonsList({
  reasons,
  onEdit,
  onDelete,
  onAddToCategory,
}: LossReasonsListProps) {
  const { t, i18n } = useTranslation("crm");
  const locale = i18n.language;

  // Track which categories are open
  const [openCategories, setOpenCategories] = useState<Set<LossReasonCategory>>(
    new Set(CATEGORY_ORDER)
  );

  // Group reasons by category
  const reasonsByCategory = CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = reasons
        .filter((r) => r.category === category && r.is_active)
        .sort((a, b) => a.order - b.order);
      return acc;
    },
    {} as Record<LossReasonCategory, LossReasonConfig[]>
  );

  // Toggle category open/closed
  const toggleCategory = (category: LossReasonCategory) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Get label based on locale
  const getLabel = (reason: LossReasonConfig): string => {
    return locale === "fr" ? reason.label_fr : reason.label_en;
  };

  return (
    <div className="space-y-3">
      {CATEGORY_ORDER.map((category) => {
        const config = CATEGORY_CONFIG[category];
        const Icon = config.icon;
        const categoryReasons = reasonsByCategory[category];
        const isOpen = openCategories.has(category);

        return (
          <Collapsible
            key={category}
            open={isOpen}
            onOpenChange={() => toggleCategory(category)}
          >
            <div className={`rounded-lg border ${config.bgColor}`}>
              {/* Category Header */}
              <CollapsibleTrigger asChild>
                <button
                  className="flex w-full items-center justify-between rounded-t-lg px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    <span className="font-medium">
                      {t(
                        `settings.lossReasons.categories.${category}`,
                        category
                      )}
                    </span>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {categoryReasons.length}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="text-muted-foreground h-4 w-4" />
                  ) : (
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  )}
                </button>
              </CollapsibleTrigger>

              {/* Category Content */}
              <CollapsibleContent>
                <div className="space-y-1 border-t px-4 py-2">
                  {categoryReasons.length === 0 ? (
                    <p className="text-muted-foreground py-3 text-center text-sm">
                      {t(
                        "settings.lossReasons.noReasonsInCategory",
                        "No reasons in this category"
                      )}
                    </p>
                  ) : (
                    categoryReasons.map((reason) => (
                      <div
                        key={reason.value}
                        className="group flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="truncate text-sm font-medium">
                            {getLabel(reason)}
                          </span>
                          {/* Badges */}
                          <div className="flex flex-shrink-0 items-center gap-1.5">
                            {reason.is_recoverable && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                title={t(
                                  "settings.lossReasons.recoverableTooltip",
                                  `Recoverable after ${reason.recovery_delay_days} days`
                                )}
                              >
                                <RefreshCw className="h-3 w-3" />
                                {reason.recovery_delay_days}d
                              </span>
                            )}
                            {reason.require_competitor_name && (
                              <span
                                className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                title={t(
                                  "settings.lossReasons.competitorRequiredTooltip",
                                  "Competitor name required"
                                )}
                              >
                                <AlertCircle className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onEdit(reason)}
                            title={t("settings.edit", "Edit")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => onDelete(reason)}
                            title={t("settings.delete", "Delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground mt-1 w-full justify-start"
                    onClick={() => onAddToCategory(category)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("settings.lossReasons.addToCategory", "Add reason")}
                  </Button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}

export { CATEGORY_ORDER };
export type { LossReasonCategory };
