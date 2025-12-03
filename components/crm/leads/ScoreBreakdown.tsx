/**
 * ScoreBreakdown - Interactive score display with expandable details
 * Shows progress bar with gradient colors and breakdown of contributing factors
 */

"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  calculateFitBreakdown,
  calculateEngagementBreakdown,
  calculateQualificationBreakdown,
  getScoreColor,
  type ScoreBreakdown as ScoreBreakdownType,
} from "@/lib/utils/score-calculations";
import type { Lead } from "@/types/crm";

interface ScoreBreakdownProps {
  type: "fit" | "engagement" | "qualification";
  score: number | null;
  lead: Lead;
  showDetails?: boolean;
  compact?: boolean;
}

export function ScoreBreakdown({
  type,
  score,
  lead,
  showDetails = false,
  compact = false,
}: ScoreBreakdownProps) {
  const { t } = useTranslation("crm");
  const [isOpen, setIsOpen] = useState(false);

  // Calculate breakdown based on type
  const breakdown: ScoreBreakdownType = useMemo(() => {
    switch (type) {
      case "fit":
        return calculateFitBreakdown(lead);
      case "engagement":
        return calculateEngagementBreakdown(lead);
      case "qualification":
        return calculateQualificationBreakdown(lead);
    }
  }, [type, lead]);

  const displayScore = score ?? breakdown.total;
  const maxScore = type === "fit" ? 60 : 100;
  const percentage = Math.min((displayScore / maxScore) * 100, 100);
  const colors = getScoreColor(displayScore);

  // Get localized label
  const getLabel = () => {
    switch (type) {
      case "fit":
        return t("leads.scores.fit");
      case "engagement":
        return t("leads.scores.engagement");
      case "qualification":
        return t("leads.scores.qualification");
    }
  };

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      {/* Score Header with Label and Value */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-medium text-gray-700 dark:text-gray-300",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {getLabel()}
        </span>
        <span
          className={cn(
            "font-bold tabular-nums",
            colors.text,
            compact ? "text-xs" : "text-sm"
          )}
        >
          {displayScore}/{maxScore}
        </span>
      </div>

      {/* Progress Bar with Gradient */}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
          compact ? "h-1.5" : "h-2"
        )}
      >
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            colors.gradient
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Expandable Details */}
      {showDetails && breakdown.factors.length > 0 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full justify-between px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span>{t("leads.scores.view_breakdown")}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.div>
            </Button>
          </CollapsibleTrigger>
          <AnimatePresence>
            {isOpen && (
              <CollapsibleContent forceMount>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 pt-2"
                >
                  {breakdown.factors.map((factor) => (
                    <div
                      key={factor.key}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        {factor.met ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <X className="h-3 w-3 text-gray-300 dark:text-gray-600" />
                        )}
                        <span
                          className={cn(
                            !factor.met && "text-gray-400 dark:text-gray-500"
                          )}
                        >
                          {t(
                            `leads.scores.factors.${factor.key}`,
                            factor.label
                          )}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          factor.met
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-400 dark:text-gray-500"
                        )}
                      >
                        +{factor.value}
                      </span>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-xs dark:border-gray-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {t("leads.scores.total")}
                    </span>
                    <span className={cn("font-bold", colors.text)}>
                      {breakdown.total}/{breakdown.maxTotal}
                    </span>
                  </div>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Collapsible>
      )}
    </div>
  );
}
