"use client";

/**
 * ConvertToOpportunityModal - Modal for converting a lead to an opportunity
 *
 * Only available for leads that are Sales Qualified (sales_qualified stage).
 * Creates a new crm_opportunities record and updates the lead.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRightCircle,
  Building2,
  User,
  CheckCircle,
  Loader2,
  AlertCircle,
  Euro,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select-native";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { convertLeadToOpportunityAction } from "@/lib/actions/crm/convert.actions";
import { toast } from "sonner";
import {
  useOpportunityStages,
  DEFAULT_OPPORTUNITY_STAGES,
} from "@/lib/hooks/useOpportunityStages";
import type { Lead } from "@/types/crm";

interface ConvertToOpportunityModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: {
    lead: Lead;
    opportunity: Record<string, unknown>;
  }) => void;
}

export function ConvertToOpportunityModal({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: ConvertToOpportunityModalProps) {
  const { t } = useTranslation("crm");

  // Load stages dynamically from crm_settings
  const { stages, getLabel } = useOpportunityStages();

  // Default stage is the first one in the pipeline
  const defaultStage = stages[0]?.value || DEFAULT_OPPORTUNITY_STAGES[0].value;

  const [formData, setFormData] = useState({
    opportunityName: lead.company_name || "",
    expectedValue: "",
    expectedCloseDate: "",
    stage: defaultStage,
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check eligibility - must be sales_qualified
  const isEligible = lead.lead_stage === "sales_qualified";

  // Format fleet size
  const formatFleetSize = (size: string | null): string => {
    if (!size) return "—";
    return size.replace("-", " - ") + " vehicles";
  };

  const handleConvert = async () => {
    if (!formData.opportunityName.trim()) {
      toast.error(t("leads.convert.error_name_required"));
      return;
    }

    setIsLoading(true);
    try {
      const result = await convertLeadToOpportunityAction(lead.id, {
        opportunityName: formData.opportunityName,
        expectedValue: formData.expectedValue || undefined,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        stage: formData.stage,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        toast.success(t("leads.convert.success"));
        onSuccess({
          lead: result.lead as unknown as Lead,
          opportunity: result.opportunity,
        });
        handleClose();
      } else {
        toast.error(result.error ?? t("leads.convert.error"));
      }
    } catch {
      toast.error(t("leads.convert.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      opportunityName: lead.company_name || "",
      expectedValue: "",
      expectedCloseDate: "",
      stage: defaultStage,
      notes: "",
    });
    onClose();
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightCircle className="h-5 w-5 text-green-500" />
            {t("leads.convert.title")}
          </DialogTitle>
          <DialogDescription>
            {t("leads.convert.description", {
              company: lead.company_name || "this lead",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Eligibility check */}
          {!isEligible ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {t("leads.convert.not_eligible_title")}
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  {t("leads.convert.not_eligible", {
                    stage: t(
                      `leads.qualify.stages.${lead.lead_stage || "top_of_funnel"}`
                    ),
                  })}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Lead summary card */}
              <div className="bg-muted space-y-2 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Building2 className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">{lead.company_name}</span>
                  {lead.country?.flag_emoji && (
                    <span>{lead.country.flag_emoji}</span>
                  )}
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <User className="h-3 w-3" />
                  <span>
                    {lead.first_name} {lead.last_name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  >
                    Score: {lead.qualification_score ?? "—"}
                  </Badge>
                  <Badge variant="outline">
                    {formatFleetSize(lead.fleet_size)}
                  </Badge>
                </div>
              </div>

              {/* Opportunity form */}
              <div className="space-y-4">
                {/* Opportunity Name */}
                <div className="space-y-2">
                  <Label htmlFor="opportunityName">
                    {t("leads.convert.opportunity_name")} *
                  </Label>
                  <Input
                    id="opportunityName"
                    value={formData.opportunityName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        opportunityName: e.target.value,
                      }))
                    }
                    placeholder={lead.company_name || "Opportunity name"}
                  />
                </div>

                {/* Value and Date row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expectedValue">
                      {t("leads.convert.estimated_value")}
                    </Label>
                    <div className="relative">
                      <Euro className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                      <Input
                        id="expectedValue"
                        type="number"
                        className="pl-9"
                        value={formData.expectedValue}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expectedValue: e.target.value,
                          }))
                        }
                        placeholder="10000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedCloseDate">
                      {t("leads.convert.expected_close")}
                    </Label>
                    <Input
                      id="expectedCloseDate"
                      type="date"
                      value={formData.expectedCloseDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          expectedCloseDate: e.target.value,
                        }))
                      }
                      min={today}
                    />
                  </div>
                </div>

                {/* Pipeline Stage */}
                <div className="space-y-2">
                  <Label htmlFor="stage">
                    {t("leads.convert.pipeline_stage")}
                  </Label>
                  <Select
                    id="stage"
                    value={formData.stage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stage: e.target.value,
                      }))
                    }
                  >
                    {stages.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {getLabel(stage.value, "en")}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">
                    {t("leads.convert.notes")}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({t("common:optional", "optional")})
                    </span>
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder={t("leads.convert.notes_placeholder")}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* What happens next */}
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                  {t("leads.convert.what_happens")}
                </p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {t("leads.convert.step_1")}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {t("leads.convert.step_2")}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {t("leads.convert.step_3")}
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t("common:cancel", "Cancel")}
          </Button>
          {isEligible && (
            <Button
              onClick={handleConvert}
              disabled={!formData.opportunityName.trim() || isLoading}
              className={cn(
                "bg-green-600 text-white hover:bg-green-700",
                "dark:bg-green-700 dark:hover:bg-green-600"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common:converting", "Converting...")}
                </>
              ) : (
                <>
                  <ArrowRightCircle className="mr-2 h-4 w-4" />
                  {t("leads.convert.confirm")}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
