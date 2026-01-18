"use client";

/**
 * CPTQualificationModal - Modal for CPT Framework lead qualification
 *
 * V6.2-11: Replaces the old stage-based QualifyModal with CPT framework:
 * - Challenges: Pain points and problems to solve
 * - Priority: Budget and decision authority
 * - Timing: When they want to implement
 *
 * Calls POST /api/v1/crm/leads/[id]/qualify
 * Score weights and thresholds loaded from crm_settings.qualification_framework
 *
 * @see lib/services/crm/lead-qualification.service.ts
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle,
  Loader2,
  AlertTriangle,
  Target,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Lead } from "@/types/crm";

// ============================================================
// TYPES & VALIDATION
// ============================================================

const cptFormSchema = z.object({
  challenges: z.object({
    response: z
      .string()
      .min(10, "Minimum 10 characters required")
      .max(1000, "Maximum 1000 characters"),
    score: z.enum(["high", "medium", "low"]),
  }),
  priority: z.object({
    response: z
      .string()
      .min(10, "Minimum 10 characters required")
      .max(1000, "Maximum 1000 characters"),
    score: z.enum(["high", "medium", "low"]),
  }),
  timing: z.object({
    response: z
      .string()
      .min(5, "Minimum 5 characters required")
      .max(1000, "Maximum 1000 characters"),
    score: z.enum(["hot", "warm", "cool", "cold"]),
  }),
});

type CPTFormData = z.infer<typeof cptFormSchema>;

interface QualificationResult {
  success: boolean;
  leadId: string;
  qualification_score: number;
  recommendation: "proceed" | "nurture" | "disqualify";
  status_updated: boolean;
  suggested_action?: string;
  qualified_date: string;
}

interface CPTQualificationModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: QualificationResult) => void;
  initialData?: Partial<CPTFormData>;
}

// ============================================================
// SCORE WEIGHTS (for preview - actual values from DB)
// ============================================================

const SCORE_WEIGHTS = {
  challenges: { high: 40, medium: 25, low: 10 },
  priority: { high: 35, medium: 20, low: 10 },
  timing: { hot: 25, warm: 20, cool: 10, cold: 5 },
};

// ============================================================
// SECTION COMPONENT
// ============================================================

interface CPTSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  isOpen: boolean;
  onToggle: () => void;
  scoreValue: string;
  scoreBadgeColor: string;
  children: React.ReactNode;
}

function CPTSection({
  title,
  icon,
  iconColor,
  isOpen,
  onToggle,
  scoreValue,
  scoreBadgeColor,
  children,
}: CPTSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2">
          <span className={cn("text-sm", iconColor)}>{icon}</span>
          <span className="text-sm font-medium">{title}</span>
          {scoreValue && (
            <Badge
              variant="secondary"
              className={cn("ml-2 text-xs", scoreBadgeColor)}
            >
              {scoreValue.toUpperCase()}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export function CPTQualificationModal({
  lead,
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CPTQualificationModalProps) {
  const { t } = useTranslation(["crm", "common"]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [openSections, setOpenSections] = useState({
    challenges: true,
    priority: true,
    timing: true,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CPTFormData>({
    resolver: zodResolver(cptFormSchema),
    defaultValues: {
      challenges: {
        response: initialData?.challenges?.response || "",
        score: initialData?.challenges?.score || "medium",
      },
      priority: {
        response: initialData?.priority?.response || "",
        score: initialData?.priority?.score || "medium",
      },
      timing: {
        response: initialData?.timing?.response || "",
        score: initialData?.timing?.score || "warm",
      },
    },
  });

  // Watch all scores for preview calculation
  const watchedValues = watch();

  // Calculate preview score when values change
  useEffect(() => {
    const { challenges, priority, timing } = watchedValues;
    if (challenges?.score && priority?.score && timing?.score) {
      const challengesPoints = SCORE_WEIGHTS.challenges[challenges.score] || 0;
      const priorityPoints = SCORE_WEIGHTS.priority[priority.score] || 0;
      const timingPoints = SCORE_WEIGHTS.timing[timing.score] || 0;
      setPreviewScore(challengesPoints + priorityPoints + timingPoints);
    }
  }, [watchedValues]);

  // Get recommendation based on score
  const getRecommendation = (
    score: number
  ): "proceed" | "nurture" | "disqualify" => {
    if (score >= 70) return "proceed";
    if (score >= 40) return "nurture";
    return "disqualify";
  };

  // Get recommendation color
  const getRecommendationColor = (recommendation: string): string => {
    switch (recommendation) {
      case "proceed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "nurture":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "disqualify":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Get score badge color
  const getScoreBadgeColor = (
    score: string,
    type: "challenges" | "priority" | "timing"
  ): string => {
    if (type === "timing") {
      switch (score) {
        case "hot":
          return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
        case "warm":
          return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
        case "cool":
          return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
        default:
          return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      }
    }
    switch (score) {
      case "high":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Handle form submission
  const onSubmit = async (data: CPTFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/crm/leads/${lead.id}/qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage =
          result.error?.message ||
          t("crm:leads.cpt.error", "Qualification failed");
        toast.error(errorMessage);
        return;
      }

      // Success
      const qualResult = result.data as QualificationResult;
      toast.success(
        t("crm:leads.cpt.success", {
          score: qualResult.qualification_score,
          defaultValue: `Lead qualified with score ${qualResult.qualification_score}/100`,
        })
      );

      onSuccess(qualResult);
      handleClose();
    } catch {
      toast.error(t("common:error", "An error occurred"));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    reset();
    setPreviewScore(null);
    onClose();
  };

  // Toggle section
  const toggleSection = (section: "challenges" | "priority" | "timing") => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Check if lead can be qualified
  const invalidStatuses = ["converted", "disqualified"];
  const canQualify = !invalidStatuses.includes(lead.status);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            {t("crm:leads.cpt.title", "CPT Qualification")}
          </DialogTitle>
          <DialogDescription>
            {t("crm:leads.cpt.description", {
              company: lead.company_name || lead.email,
              defaultValue: `Qualify ${lead.company_name || lead.email} using CPT framework`,
            })}
          </DialogDescription>
        </DialogHeader>

        {!canQualify ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t("crm:leads.cpt.cannot_qualify", {
                  status: lead.status,
                  defaultValue: `Cannot qualify a lead with status: ${lead.status}`,
                })}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Lead Info */}
            <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {lead.company_name || lead.first_name || lead.email}
                </p>
                <p className="text-muted-foreground text-xs">{lead.email}</p>
              </div>
              <Badge variant="outline">{lead.status}</Badge>
            </div>

            {/* Challenges Section */}
            <CPTSection
              title={t("crm:leads.cpt.challenges", "Challenges")}
              icon={<AlertTriangle className="h-4 w-4" />}
              iconColor="text-orange-500"
              isOpen={openSections.challenges}
              onToggle={() => toggleSection("challenges")}
              scoreValue={watchedValues.challenges?.score || ""}
              scoreBadgeColor={getScoreBadgeColor(
                watchedValues.challenges?.score || "",
                "challenges"
              )}
            >
              <div className="space-y-3">
                <div>
                  <Label htmlFor="challenges-response" className="text-sm">
                    {t(
                      "crm:leads.cpt.challengesLabel",
                      "Describe the main challenges..."
                    )}
                  </Label>
                  <Textarea
                    id="challenges-response"
                    {...register("challenges.response")}
                    placeholder={t(
                      "crm:leads.cpt.challengesPlaceholder",
                      "Excel nightmare, manual reconciliation, no real-time tracking..."
                    )}
                    rows={3}
                    className="mt-1.5 resize-none"
                  />
                  {errors.challenges?.response && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.challenges.response.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm">
                    {t("crm:leads.cpt.challengesScore", "Challenge intensity")}
                  </Label>
                  <Select
                    {...register("challenges.score")}
                    className="mt-1.5"
                    onChange={(e) =>
                      setValue(
                        "challenges.score",
                        e.target.value as "high" | "medium" | "low"
                      )
                    }
                  >
                    <option value="high">
                      {t("crm:leads.cpt.score_high", "High")} (40 pts)
                    </option>
                    <option value="medium">
                      {t("crm:leads.cpt.score_medium", "Medium")} (25 pts)
                    </option>
                    <option value="low">
                      {t("crm:leads.cpt.score_low", "Low")} (10 pts)
                    </option>
                  </Select>
                </div>
              </div>
            </CPTSection>

            {/* Priority Section */}
            <CPTSection
              title={t("crm:leads.cpt.priority", "Priority")}
              icon={<TrendingUp className="h-4 w-4" />}
              iconColor="text-blue-500"
              isOpen={openSections.priority}
              onToggle={() => toggleSection("priority")}
              scoreValue={watchedValues.priority?.score || ""}
              scoreBadgeColor={getScoreBadgeColor(
                watchedValues.priority?.score || "",
                "priority"
              )}
            >
              <div className="space-y-3">
                <div>
                  <Label htmlFor="priority-response" className="text-sm">
                    {t(
                      "crm:leads.cpt.priorityLabel",
                      "How urgent is the solution?"
                    )}
                  </Label>
                  <Textarea
                    id="priority-response"
                    {...register("priority.response")}
                    placeholder={t(
                      "crm:leads.cpt.priorityPlaceholder",
                      "Budget approved, decision maker involved, actively looking for solutions..."
                    )}
                    rows={3}
                    className="mt-1.5 resize-none"
                  />
                  {errors.priority?.response && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.priority.response.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm">
                    {t("crm:leads.cpt.priorityScore", "Priority level")}
                  </Label>
                  <Select
                    {...register("priority.score")}
                    className="mt-1.5"
                    onChange={(e) =>
                      setValue(
                        "priority.score",
                        e.target.value as "high" | "medium" | "low"
                      )
                    }
                  >
                    <option value="high">
                      {t("crm:leads.cpt.score_high", "High")} (35 pts)
                    </option>
                    <option value="medium">
                      {t("crm:leads.cpt.score_medium", "Medium")} (20 pts)
                    </option>
                    <option value="low">
                      {t("crm:leads.cpt.score_low", "Low")} (10 pts)
                    </option>
                  </Select>
                </div>
              </div>
            </CPTSection>

            {/* Timing Section */}
            <CPTSection
              title={t("crm:leads.cpt.timing", "Timing")}
              icon={<Clock className="h-4 w-4" />}
              iconColor="text-purple-500"
              isOpen={openSections.timing}
              onToggle={() => toggleSection("timing")}
              scoreValue={watchedValues.timing?.score || ""}
              scoreBadgeColor={getScoreBadgeColor(
                watchedValues.timing?.score || "",
                "timing"
              )}
            >
              <div className="space-y-3">
                <div>
                  <Label htmlFor="timing-response" className="text-sm">
                    {t(
                      "crm:leads.cpt.timingLabel",
                      "When do they want to implement?"
                    )}
                  </Label>
                  <Textarea
                    id="timing-response"
                    {...register("timing.response")}
                    placeholder={t(
                      "crm:leads.cpt.timingPlaceholder",
                      "ASAP, Q1 2026, within 3 months..."
                    )}
                    rows={2}
                    className="mt-1.5 resize-none"
                  />
                  {errors.timing?.response && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.timing.response.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm">
                    {t("crm:leads.cpt.timingScore", "Implementation timeline")}
                  </Label>
                  <Select
                    {...register("timing.score")}
                    className="mt-1.5"
                    onChange={(e) =>
                      setValue(
                        "timing.score",
                        e.target.value as "hot" | "warm" | "cool" | "cold"
                      )
                    }
                  >
                    <option value="hot">
                      {t("crm:leads.cpt.timing_hot", "Hot")} - ASAP (25 pts)
                    </option>
                    <option value="warm">
                      {t("crm:leads.cpt.timing_warm", "Warm")} - 1-3 months (20
                      pts)
                    </option>
                    <option value="cool">
                      {t("crm:leads.cpt.timing_cool", "Cool")} - 3-6 months (10
                      pts)
                    </option>
                    <option value="cold">
                      {t("crm:leads.cpt.timing_cold", "Cold")} - 6+ months (5
                      pts)
                    </option>
                  </Select>
                </div>
              </div>
            </CPTSection>

            {/* Score Preview */}
            {previewScore !== null && (
              <div
                className={cn(
                  "rounded-lg p-4",
                  getRecommendationColor(getRecommendation(previewScore))
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {t("crm:leads.cpt.scoreResult", "Qualification Score")}
                    </p>
                    <p className="text-2xl font-bold">{previewScore}/100</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs tracking-wide uppercase opacity-75">
                      {t("crm:leads.cpt.recommendation", "Recommendation")}
                    </p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mt-1 text-sm font-semibold",
                        getRecommendationColor(getRecommendation(previewScore))
                      )}
                    >
                      {getRecommendation(previewScore) === "proceed" &&
                        t("crm:leads.cpt.rec_proceed", "Proceed")}
                      {getRecommendation(previewScore) === "nurture" &&
                        t("crm:leads.cpt.rec_nurture", "Nurture")}
                      {getRecommendation(previewScore) === "disqualify" &&
                        t("crm:leads.cpt.rec_disqualify", "Disqualify")}
                    </Badge>
                  </div>
                </div>
                {getRecommendation(previewScore) === "proceed" && (
                  <p className="mt-2 text-xs opacity-75">
                    {t(
                      "crm:leads.cpt.proceed_note",
                      "Status will be automatically updated to 'qualified'"
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t("common:cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common:saving", "Saving...")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t("crm:leads.cpt.submit", "Qualify Lead")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
