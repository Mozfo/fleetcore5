"use client";

/**
 * BulkDeleteModal - Modal for bulk deleting leads with reason
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  selectedCount: number;
  isLoading?: boolean;
}

const DELETE_REASONS = [
  "duplicate",
  "invalid_data",
  "request_from_lead",
  "no_longer_interested",
  "other",
] as const;

type DeleteReason = (typeof DELETE_REASONS)[number];

export function BulkDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isLoading = false,
}: BulkDeleteModalProps) {
  const { t } = useTranslation("crm");
  const [selectedReason, setSelectedReason] = useState<DeleteReason | null>(
    null
  );

  const handleConfirm = async () => {
    if (!selectedReason) return;
    await onConfirm(selectedReason);
    setSelectedReason(null);
  };

  const handleClose = () => {
    setSelectedReason(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t("leads.bulk_actions.delete_modal.title", {
              count: selectedCount,
            })}
          </DialogTitle>
          <DialogDescription className="text-destructive/80">
            {t("leads.bulk_actions.delete_modal.warning")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("leads.bulk_actions.delete_modal.reason_label")} *
          </label>

          <div className="mt-3 space-y-1 rounded-lg border p-2">
            {DELETE_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  selectedReason === reason
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <span className="flex-1 text-sm">
                  {t(`leads.bulk_actions.delete_modal.reasons.${reason}`)}
                </span>
                {selectedReason === reason && (
                  <Check className="h-4 w-4 text-red-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t("common:cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selectedReason || isLoading}
          >
            {isLoading
              ? t("leads.bulk_actions.delete_modal.deleting")
              : t("leads.bulk_actions.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
