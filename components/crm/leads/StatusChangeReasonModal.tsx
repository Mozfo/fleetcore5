/**
 * StatusChangeReasonModal - Modal for collecting reason when changing status
 *
 * V6.3: Required for status transitions to lost, nurturing, disqualified
 * Shows appropriate reason dropdown based on target status
 *
 * @module components/crm/leads/StatusChangeReasonModal
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { AlertCircle, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLeadLossReasons } from "@/lib/hooks/useLeadLossReasons";
import type { LeadStatus } from "@/types/crm";

// Statuts qui requièrent une raison
const STATUS_REQUIRES_REASON: LeadStatus[] = [
  "lost",
  "nurturing",
  "disqualified",
];

interface StatusChangeReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: StatusChangeReasonData) => void;
  targetStatus: LeadStatus;
  leadName?: string;
  isLoading?: boolean;
}

export interface StatusChangeReasonData {
  status: LeadStatus;
  reasonCode: string;
  reasonDetail?: string;
}

export function StatusChangeReasonModal({
  isOpen,
  onClose,
  onConfirm,
  targetStatus,
  leadName,
  isLoading = false,
}: StatusChangeReasonModalProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";

  const { getReasonsForStatus, getLabel, requiresDetail } =
    useLeadLossReasons();

  const [selectedReasonCode, setSelectedReasonCode] = useState<string>("");
  const [reasonDetail, setReasonDetail] = useState<string>("");

  // Reset form when modal opens with new status
  useEffect(() => {
    if (isOpen) {
      setSelectedReasonCode("");
      setReasonDetail("");
    }
  }, [isOpen, targetStatus]);

  // Get reasons for the target status
  const availableReasons = useMemo(() => {
    if (!STATUS_REQUIRES_REASON.includes(targetStatus)) return [];
    return getReasonsForStatus(
      targetStatus as "lost" | "disqualified" | "nurturing"
    );
  }, [targetStatus, getReasonsForStatus]);

  // Check if selected reason requires detail
  const selectedReasonRequiresDetail = useMemo(() => {
    return selectedReasonCode ? requiresDetail(selectedReasonCode) : false;
  }, [selectedReasonCode, requiresDetail]);

  // Form validation
  const isFormValid = useMemo(() => {
    if (!selectedReasonCode) return false;
    if (selectedReasonRequiresDetail && !reasonDetail.trim()) return false;
    return true;
  }, [selectedReasonCode, selectedReasonRequiresDetail, reasonDetail]);

  const handleConfirm = () => {
    if (!isFormValid) return;

    onConfirm({
      status: targetStatus,
      reasonCode: selectedReasonCode,
      reasonDetail: reasonDetail.trim() || undefined,
    });
  };

  // Get status color for display
  const getStatusColor = (status: LeadStatus): string => {
    const colors: Record<LeadStatus, string> = {
      new: "bg-gray-500",
      demo: "bg-blue-500",
      proposal_sent: "bg-orange-500",
      payment_pending: "bg-amber-500",
      converted: "bg-green-500",
      lost: "bg-red-500",
      nurturing: "bg-purple-500",
      disqualified: "bg-gray-400",
    };
    return colors[status] || "bg-gray-500";
  };

  // Get modal title based on status
  const getModalTitle = (): string => {
    switch (targetStatus) {
      case "lost":
        return t("leads.status_reason.lost_title", "Mark as Lost");
      case "nurturing":
        return t("leads.status_reason.nurturing_title", "Move to Nurturing");
      case "disqualified":
        return t("leads.status_reason.disqualified_title", "Disqualify Lead");
      default:
        return t("leads.status_reason.title", "Change Status");
    }
  };

  // Get modal description based on status
  const getModalDescription = (): string => {
    switch (targetStatus) {
      case "lost":
        return t(
          "leads.status_reason.lost_description",
          "Please select a reason for marking this lead as lost."
        );
      case "nurturing":
        return t(
          "leads.status_reason.nurturing_description",
          "Please select a reason for moving this lead to nurturing."
        );
      case "disqualified":
        return t(
          "leads.status_reason.disqualified_description",
          "Please select a reason for disqualifying this lead."
        );
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${getStatusColor(targetStatus)}`}
            />
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            {leadName && (
              <span className="font-medium text-gray-900 dark:text-white">
                {leadName}
              </span>
            )}
            {leadName && " - "}
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {t("leads.status_reason.reason_label", "Reason")}
              <span className="text-red-500">*</span>
            </Label>
            <div className="max-h-[200px] space-y-1 overflow-y-auto rounded-lg border p-2">
              {availableReasons.map((reason) => (
                <button
                  key={reason.code}
                  type="button"
                  onClick={() => setSelectedReasonCode(reason.code)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                    selectedReasonCode === reason.code
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <span className="flex-1 text-sm">
                    {getLabel(reason.code, locale)}
                  </span>
                  {selectedReasonCode === reason.code && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Detail Textarea (conditional) */}
          {selectedReasonRequiresDetail && (
            <div className="space-y-2">
              <Label htmlFor="detail" className="flex items-center gap-1">
                {t("leads.status_reason.detail_label", "Details")}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="detail"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder={t(
                  "leads.status_reason.detail_placeholder",
                  "Please provide more details..."
                )}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-muted-foreground text-xs">
                {reasonDetail.length}/500
              </p>
            </div>
          )}

          {/* Warning for terminal statuses */}
          {targetStatus === "disqualified" && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {t(
                  "leads.status_reason.disqualified_warning",
                  "Disqualified leads cannot be reactivated. This action is permanent."
                )}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!isFormValid || isLoading}
            className={
              targetStatus === "lost"
                ? "bg-red-600 hover:bg-red-700"
                : targetStatus === "disqualified"
                  ? "bg-gray-600 hover:bg-gray-700"
                  : "bg-purple-600 hover:bg-purple-700"
            }
          >
            {isLoading
              ? t("common.saving", "Saving...")
              : t("leads.status_reason.confirm", "Confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Helper function to check if a status requires reason
 */
export function statusRequiresReason(status: LeadStatus): boolean {
  return STATUS_REQUIRES_REASON.includes(status);
}

export default StatusChangeReasonModal;
