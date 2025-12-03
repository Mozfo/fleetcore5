"use client";

/**
 * BulkStatusModal - Modal for bulk changing lead status
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Check } from "lucide-react";
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
import type { LeadStatus } from "@/types/crm";

interface BulkStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: LeadStatus) => Promise<void>;
  selectedCount: number;
  isLoading?: boolean;
}

const STATUS_OPTIONS: { value: LeadStatus; color: string }[] = [
  { value: "new", color: "bg-blue-500" },
  { value: "working", color: "bg-yellow-500" },
  { value: "qualified", color: "bg-green-500" },
  { value: "lost", color: "bg-gray-500" },
];

export function BulkStatusModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isLoading = false,
}: BulkStatusModalProps) {
  const { t } = useTranslation("crm");
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null);

  const handleConfirm = async () => {
    if (!selectedStatus) return;
    await onConfirm(selectedStatus);
    setSelectedStatus(null);
  };

  const handleClose = () => {
    setSelectedStatus(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t("leads.bulk_actions.status_modal.title", {
              count: selectedCount,
            })}
          </DialogTitle>
          <DialogDescription>
            {t("leads.bulk_actions.status_modal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("leads.bulk_actions.status_modal.select_status")}
          </label>

          <div className="mt-3 space-y-1 rounded-lg border p-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedStatus(option.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  selectedStatus === option.value
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <div className={cn("h-3 w-3 rounded-full", option.color)} />
                <span className="flex-1 text-sm">
                  {t(`leads.columns.${option.value}`)}
                </span>
                {selectedStatus === option.value && (
                  <Check className="h-4 w-4 text-blue-600" />
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
            onClick={handleConfirm}
            disabled={!selectedStatus || isLoading}
          >
            {isLoading
              ? t("leads.bulk_actions.status_modal.updating")
              : t("leads.bulk_actions.status_modal.update")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
