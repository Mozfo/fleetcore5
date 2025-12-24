/**
 * OpportunityFormModal - Modal for manual opportunity creation
 *
 * Features:
 * - Lead selection with search filter
 * - Stage selection from dynamic crm_settings
 * - Expected value and close date inputs
 * - Assignment dropdown
 * - Notes textarea
 *
 * @module components/crm/opportunities/OpportunityFormModal
 */

"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Plus, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useOpportunityStages } from "@/lib/hooks/useOpportunityStages";
import { createOpportunityAction } from "@/lib/actions/crm/opportunity.actions";
import type { Opportunity } from "@/types/crm";

// ===== CONSTANTS =====

const CURRENCY_OPTIONS = [
  { value: "EUR", label: "EUR - Euro" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "QAR", label: "QAR - Qatari Riyal" },
] as const;

// ===== COMPONENT =====

interface OpportunityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (opportunity: Partial<Opportunity>) => void;
  leads: Array<{
    id: string;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
  }>;
  owners?: Array<{
    id: string;
    first_name: string;
    last_name: string | null;
  }>;
}

export function OpportunityFormModal({
  isOpen,
  onClose,
  onSuccess,
  leads,
  owners = [],
}: OpportunityFormModalProps) {
  const { t } = useTranslation("crm");

  // Load stages dynamically from crm_settings
  const { stages, getLabel: getStageLabel } = useOpportunityStages();

  // Default stage is the first one in the pipeline
  const defaultStage = stages[0]?.value || "qualification";

  // Default expected close date: 30 days from now
  const defaultCloseDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    lead_id: "",
    expected_value: "",
    currency: "EUR",
    stage: defaultStage,
    expected_close_date: defaultCloseDate,
    assigned_to: "",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        lead_id: "",
        expected_value: "",
        currency: "EUR",
        stage: defaultStage,
        expected_close_date: defaultCloseDate,
        assigned_to: "",
        notes: "",
      });
      setLeadSearchQuery("");
    }
  }, [isOpen, defaultStage, defaultCloseDate]);

  // Filter leads based on search query
  const filteredLeads = useMemo(() => {
    if (!leadSearchQuery) return leads.slice(0, 50);

    const query = leadSearchQuery.toLowerCase();
    return leads
      .filter(
        (lead) =>
          lead.company_name?.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.first_name?.toLowerCase().includes(query) ||
          lead.last_name?.toLowerCase().includes(query)
      )
      .slice(0, 50);
  }, [leads, leadSearchQuery]);

  // Find selected lead for display
  const selectedLead = useMemo(
    () => leads.find((l) => l.id === formData.lead_id),
    [leads, formData.lead_id]
  );

  // Auto-generate opportunity name from lead
  const handleLeadChange = (leadId: string) => {
    setFormData((prev) => {
      const lead = leads.find((l) => l.id === leadId);
      let newName = prev.name;

      // Auto-generate name if empty and lead selected
      if (!prev.name && lead) {
        const leadName =
          lead.company_name || `${lead.first_name} ${lead.last_name}`;
        newName = `Opportunity - ${leadName}`;
      }

      return { ...prev, lead_id: leadId, name: newName };
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error(
        t("opportunity.modal.validation.name_required", "Name is required")
      );
      return;
    }
    if (formData.name.length < 3) {
      toast.error(
        t(
          "opportunity.modal.validation.name_min",
          "Name must be at least 3 characters"
        )
      );
      return;
    }
    if (!formData.lead_id) {
      toast.error(
        t("opportunity.modal.validation.lead_required", "Please select a lead")
      );
      return;
    }
    if (!formData.expected_value || parseFloat(formData.expected_value) < 0) {
      toast.error(
        t(
          "opportunity.modal.validation.value_required",
          "Expected value is required"
        )
      );
      return;
    }
    if (!formData.expected_close_date) {
      toast.error(
        t(
          "opportunity.modal.validation.date_required",
          "Expected close date is required"
        )
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await createOpportunityAction({
        name: formData.name,
        lead_id: formData.lead_id,
        expected_value: parseFloat(formData.expected_value),
        currency: formData.currency,
        stage: formData.stage as
          | "qualification"
          | "demo"
          | "proposal"
          | "negotiation"
          | "contract_sent",
        expected_close_date: new Date(formData.expected_close_date),
        assigned_to: formData.assigned_to || null,
        notes: formData.notes || null,
      });

      if (!result.success) {
        toast.error(
          result.error ||
            t("opportunity.modal.error_generic", "Failed to create opportunity")
        );
        return;
      }

      toast.success(
        t(
          "opportunity.modal.success_created",
          "Opportunity created successfully"
        )
      );

      if (onSuccess && result.opportunity) {
        onSuccess({
          id: result.opportunity.id,
          lead_id: result.opportunity.lead_id,
          stage: result.opportunity.stage,
          status: result.opportunity.status,
          expected_value: result.opportunity.expected_value,
          probability_percent: result.opportunity.probability_percent,
          forecast_value: result.opportunity.forecast_value,
          expected_close_date: result.opportunity.expected_close_date,
          created_at: result.opportunity.created_at,
        });
      }

      onClose();
    } catch {
      toast.error(
        t("opportunity.modal.error_generic", "Failed to create opportunity")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      lead_id: "",
      expected_value: "",
      currency: "EUR",
      stage: defaultStage,
      expected_close_date: defaultCloseDate,
      assigned_to: "",
      notes: "",
    });
    setLeadSearchQuery("");
    onClose();
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            {t("opportunity.modal.title_create", "Create Opportunity")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "opportunity.modal.description_create",
              "Create a new opportunity from a qualified lead"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Lead Selection with Search */}
          <div className="space-y-2">
            <Label htmlFor="lead_id">
              {t("opportunity.modal.fields.lead", "Lead")} *
            </Label>

            {/* Search input */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t(
                  "opportunity.modal.search_lead",
                  "Search leads..."
                )}
                className="pl-9"
                value={leadSearchQuery}
                onChange={(e) => setLeadSearchQuery(e.target.value)}
              />
              {leadSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLeadSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Lead select */}
            <Select
              id="lead_id"
              value={formData.lead_id}
              onChange={(e) => handleLeadChange(e.target.value)}
            >
              <option value="">
                {t("opportunity.modal.select_lead", "Select a lead...")}
              </option>
              {filteredLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.company_name || `${lead.first_name} ${lead.last_name}`}{" "}
                  - {lead.email}
                </option>
              ))}
            </Select>

            {/* Selected lead indicator */}
            {selectedLead && (
              <p className="text-muted-foreground text-xs">
                {t("opportunity.modal.selected", "Selected")}:{" "}
                {selectedLead.company_name ||
                  `${selectedLead.first_name} ${selectedLead.last_name}`}
              </p>
            )}
          </div>

          {/* Opportunity Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t("opportunity.modal.fields.name", "Name")} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={t(
                "opportunity.modal.placeholders.name",
                "e.g., Fleet expansion - ACME Corp"
              )}
            />
          </div>

          {/* Expected Value & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_value">
                {t("opportunity.modal.fields.expected_value", "Expected Value")}{" "}
                *
              </Label>
              <Input
                id="expected_value"
                type="number"
                min="0"
                step="100"
                value={formData.expected_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expected_value: e.target.value,
                  }))
                }
                placeholder={t(
                  "opportunity.modal.placeholders.expected_value",
                  "e.g., 50000"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">
                {t("opportunity.modal.fields.currency", "Currency")}
              </Label>
              <Select
                id="currency"
                value={formData.currency}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currency: e.target.value }))
                }
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Stage & Expected Close Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">
                {t("opportunity.modal.fields.stage", "Stage")} *
              </Label>
              <Select
                id="stage"
                value={formData.stage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, stage: e.target.value }))
                }
              >
                {stages.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {getStageLabel(stage.value, "en")}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_close_date">
                {t(
                  "opportunity.modal.fields.expected_close_date",
                  "Expected Close Date"
                )}{" "}
                *
              </Label>
              <Input
                id="expected_close_date"
                type="date"
                min={today}
                value={formData.expected_close_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expected_close_date: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to">
              {t("opportunity.modal.fields.assigned_to", "Assigned To")}
            </Label>
            <Select
              id="assigned_to"
              value={formData.assigned_to}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  assigned_to: e.target.value,
                }))
              }
            >
              <option value="">
                {t("opportunity.modal.unassigned", "Unassigned")}
              </option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.first_name} {owner.last_name || ""}
                </option>
              ))}
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {t("opportunity.modal.fields.notes", "Notes")}{" "}
              <span className="text-muted-foreground font-normal">
                ({t("common:optional", "optional")})
              </span>
            </Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder={t(
                "opportunity.modal.placeholders.notes",
                "Add any relevant notes..."
              )}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t("opportunity.modal.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim() || !formData.lead_id}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("opportunity.modal.creating", "Creating...")}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {t("opportunity.modal.create", "Create Opportunity")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
