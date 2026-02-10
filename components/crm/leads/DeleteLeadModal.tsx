"use client";

/**
 * DeleteLeadModal - Modal for single lead deletion with GDPR options
 *
 * Features:
 * - Soft delete by default (sets deleted_at timestamp)
 * - GDPR permanent delete option (actual DELETE from DB)
 * - Reason selection required
 * - Confirmation input required for permanent delete
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Trash2, Shield, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface DeleteLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, permanentDelete: boolean) => Promise<void>;
  leadName: string;
  leadEmail: string;
  isLoading?: boolean;
}

export const DELETE_REASONS = [
  "duplicate",
  "invalid_data",
  "request_from_lead",
  "no_longer_interested",
  "gdpr_erasure_request",
  "other",
] as const;

export type DeleteReason = (typeof DELETE_REASONS)[number];

export function DeleteLeadModal({
  isOpen,
  onClose,
  onConfirm,
  leadName,
  leadEmail,
  isLoading = false,
}: DeleteLeadModalProps) {
  const { t } = useTranslation("crm");
  const [selectedReason, setSelectedReason] = useState<DeleteReason | null>(
    null
  );
  const [permanentDelete, setPermanentDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isGdprReason = selectedReason === "gdpr_erasure_request";
  const requiresConfirmation = permanentDelete;

  // Get the confirmation word from i18n (DELETE in EN, SUPPRIMER in FR)
  const confirmWord = t("leads.delete.confirm_word");
  const confirmationValid = confirmText === confirmWord;

  const canSubmit =
    selectedReason && (!requiresConfirmation || confirmationValid);

  const handleConfirm = async () => {
    if (!selectedReason || !canSubmit) return;
    await onConfirm(selectedReason, permanentDelete);
    resetState();
  };

  const resetState = () => {
    setSelectedReason(null);
    setPermanentDelete(false);
    setConfirmText("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Auto-enable permanent delete for GDPR requests
  const handleReasonSelect = (reason: DeleteReason) => {
    setSelectedReason(reason);
    if (reason === "gdpr_erasure_request") {
      setPermanentDelete(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[480px]"
        data-testid="delete-lead-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            {t("leads.delete.title")}
          </DialogTitle>
          <DialogDescription className="text-destructive/80">
            {t("leads.delete.warning")}
          </DialogDescription>
        </DialogHeader>

        {/* Lead Info */}
        <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {leadName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {leadEmail}
          </p>
        </div>

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("leads.delete.reason_label")} *
          </label>

          <div className="space-y-1 rounded-lg border p-2">
            {DELETE_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => handleReasonSelect(reason)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  selectedReason === reason
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {reason === "gdpr_erasure_request" && (
                  <Shield className="h-4 w-4 text-blue-600" />
                )}
                <span className="flex-1 text-sm">
                  {t(`leads.delete.reasons.${reason}`)}
                </span>
                {selectedReason === reason && (
                  <Check className="h-4 w-4 text-red-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* GDPR Permanent Delete Option */}
        {selectedReason && !isGdprReason && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={permanentDelete}
                onChange={(e) => setPermanentDelete(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <div>
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  {t("leads.delete.permanent_delete_label")}
                </span>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  {t("leads.delete.permanent_delete_warning")}
                </p>
              </div>
            </label>
          </div>
        )}

        {/* GDPR Notice */}
        {isGdprReason && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {t("leads.delete.gdpr_notice_title")}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {t("leads.delete.gdpr_notice_description")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Input for Permanent Delete */}
        {requiresConfirmation && (
          <div className="space-y-2">
            <label className="text-destructive text-sm font-medium">
              {t("leads.delete.confirm_label")}
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder={t("leads.delete.confirm_placeholder")}
              className="border-destructive/50 font-mono uppercase"
            />
            <p className="text-xs text-gray-500">
              {t("leads.delete.confirm_hint")}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            data-testid="delete-lead-cancel"
          >
            {t("common:cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canSubmit || isLoading}
            data-testid="delete-lead-confirm"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("leads.delete.deleting")}
              </span>
            ) : permanentDelete ? (
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t("leads.delete.permanent_button")}
              </span>
            ) : (
              t("leads.delete.button")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
