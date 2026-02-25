"use client";

/**
 * QualifyModal - Modal for qualifying leads to next stage
 *
 * Allows progression through: top_of_funnel → marketing_qualified → sales_qualified
 * (opportunity is handled by Convert action in G3)
 *
 * Uses dynamic stages from crm_settings via useLeadStages hook.
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { CheckCircle, Check, Loader2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { qualifyLeadAction } from "@/lib/actions/crm/qualify.actions";
import { useLeadStages } from "@/lib/hooks/useLeadStages";
import { toast } from "sonner";
import type { Lead } from "@/types/crm";

interface QualifyModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedLead: Lead) => void;
}

export function QualifyModal({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: QualifyModalProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load stages dynamically from crm_settings
  const { stages, getLabel, getShortLabel } = useLeadStages();

  // Get current stage index
  const currentStage = (lead.lead_stage as string) || "top_of_funnel";
  const currentIndex = stages.findIndex((s) => s.value === currentStage);

  // Calculate available stages (only those AFTER current, excluding "opportunity")
  // Opportunity is handled by Convert action in G3
  const availableStages = useMemo(() => {
    return stages.filter((stage) => {
      // Exclude opportunity stage (handled by Convert)
      if (stage.value === "opportunity") return false;
      // Only show stages AFTER current
      const stageIndex = stages.findIndex((s) => s.value === stage.value);
      return stageIndex > currentIndex;
    });
  }, [stages, currentIndex]);

  // Check if lead can be qualified (not already at last qualifying stage or beyond)
  // Find the last stage before "opportunity" (which is the last qualifying stage)
  const lastQualifyingStageIndex =
    stages.findIndex((s) => s.value === "opportunity") - 1;
  const canQualify =
    currentIndex < lastQualifyingStageIndex ||
    (currentIndex === -1 && stages.length > 1);

  // Get criteria for selected stage (with fallback for known stages)
  const getCriteria = (stageValue: string): string[] => {
    if (stageValue === "marketing_qualified") {
      return [
        t("leads.qualify.criteria.mql.icp"),
        t("leads.qualify.criteria.mql.engagement"),
        t("leads.qualify.criteria.mql.contact"),
      ];
    }
    if (stageValue === "sales_qualified") {
      return [
        t("leads.qualify.criteria.sql.budget"),
        t("leads.qualify.criteria.sql.need"),
        t("leads.qualify.criteria.sql.timeline"),
        t("leads.qualify.criteria.sql.decision_maker"),
      ];
    }
    // For custom stages, return a generic criteria message
    return [t("leads.qualify.criteria.generic")];
  };

  const handleQualify = async () => {
    if (!selectedStage) return;

    setIsLoading(true);
    try {
      const result = await qualifyLeadAction(
        lead.id,
        selectedStage,
        notes || undefined
      );

      if (result.success) {
        toast.success(
          t("leads.qualify.success", {
            stage: t(`leads.qualify.stages.${selectedStage}`),
          })
        );
        onSuccess(result.lead as unknown as Lead);
        handleClose();
      } else {
        toast.error(result.error ?? t("leads.qualify.error"));
      }
    } catch {
      toast.error(t("leads.qualify.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStage(null);
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {t("leads.qualify.title")}
          </DialogTitle>
          <DialogDescription>
            {t("leads.qualify.description", {
              company: lead.company_name || "this lead",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Current stage indicator */}
          <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
            <span className="text-muted-foreground text-sm">
              {t("leads.qualify.current_stage")}:
            </span>
            <Badge variant="outline" className="font-medium">
              {getLabel(currentStage, locale)}
            </Badge>
          </div>

          {/* Stage stepper visualization */}
          <div className="flex items-center justify-between px-2">
            {stages.map((stage, i) => {
              const isCompleted = i < currentIndex;
              const isCurrent = i === currentIndex;
              const isTarget =
                selectedStage &&
                stages.findIndex((s) => s.value === selectedStage) === i;

              return (
                <div key={stage.value} className="flex items-center">
                  {/* Stage circle */}
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all",
                      isCompleted && "bg-green-500 text-white",
                      isCurrent &&
                        "bg-blue-500 text-white ring-2 ring-blue-200",
                      isTarget &&
                        "bg-blue-100 ring-2 ring-blue-500 dark:bg-blue-900",
                      !isCompleted &&
                        !isCurrent &&
                        !isTarget &&
                        "bg-gray-100 text-gray-400 dark:bg-gray-800"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      getShortLabel(stage.value)
                    )}
                  </div>
                  {/* Connector line */}
                  {i < stages.length - 1 && (
                    <div
                      className={cn(
                        "mx-1 h-0.5 w-6 sm:w-10",
                        i < currentIndex
                          ? "bg-green-500"
                          : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Stage selection */}
          {canQualify ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("leads.qualify.select_stage")}
              </label>
              <div className="space-y-2 rounded-lg border p-2">
                {availableStages.map((stage) => (
                  <button
                    key={stage.value}
                    type="button"
                    onClick={() => setSelectedStage(stage.value)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors",
                      selectedStage === stage.value
                        ? "bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-900/20"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2",
                        selectedStage === stage.value
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      )}
                    >
                      {selectedStage === stage.value && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">
                        {getLabel(stage.value, locale)}
                      </span>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {stage.value === "marketing_qualified"
                          ? t("leads.qualify.criteria.mql.icp")
                          : stage.value === "sales_qualified"
                            ? t("leads.qualify.criteria.sql.need")
                            : t("leads.qualify.criteria.generic")}
                      </p>
                    </div>
                    <ArrowRight className="text-muted-foreground h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t("leads.qualify.cannot_qualify")}
              </p>
            </div>
          )}

          {/* Notes textarea */}
          {canQualify && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("leads.qualify.notes")}{" "}
                <span className="text-muted-foreground font-normal">
                  ({t("common:optional", "optional")})
                </span>
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("leads.qualify.notes_placeholder")}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Qualification criteria checklist */}
          {selectedStage && (
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                {t("leads.qualify.criteria_title")}
              </p>
              <ul className="space-y-1.5">
                {getCriteria(selectedStage).map((criterion, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
                  >
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t("common:cancel", "Cancel")}
          </Button>
          {canQualify && (
            <Button
              onClick={handleQualify}
              disabled={!selectedStage || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common:saving", "Saving...")}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t("leads.qualify.confirm")}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
