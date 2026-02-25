"use client";

/**
 * SaveViewModal - Modal pour créer/éditer une vue sauvegardée (E2-B)
 * Pattern: HubSpot save view modal
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Columns, ArrowUpDown, LayoutGrid } from "lucide-react";
import type { SavedViewConfig } from "@/lib/types/views";

interface SaveViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, isDefault: boolean) => void;
  currentConfig: SavedViewConfig;
  advancedConditionsCount: number;
  /** Existing view names for duplicate validation */
  existingViewNames: string[];
}

export function SaveViewModal({
  isOpen,
  onClose,
  onSave,
  currentConfig,
  advancedConditionsCount,
  existingViewNames,
}: SaveViewModalProps) {
  // Load both crm (default) and common namespaces
  // Best practice: https://react.i18next.com/guides/multiple-translation-files
  const { t } = useTranslation(["crm", "common"]);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("leads.saved_views.modal.name_required"));
      return;
    }
    if (trimmedName.length < 2) {
      setError(t("leads.saved_views.modal.name_too_short"));
      return;
    }
    // Check for duplicate names (case-insensitive)
    const isDuplicate = existingViewNames.some(
      (existingName) => existingName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setError(t("leads.saved_views.modal.name_duplicate"));
      return;
    }

    onSave(trimmedName, isDefault);
    // Reset form
    setName("");
    setIsDefault(false);
    setError("");
  };

  const handleClose = () => {
    setName("");
    setIsDefault(false);
    setError("");
    onClose();
  };

  // Count what will be saved
  const visibleColumnsCount = currentConfig.visibleColumns.length;
  const viewModeLabel =
    currentConfig.viewMode === "kanban"
      ? t("leads.saved_views.modal.kanban")
      : t("leads.saved_views.modal.table");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("leads.saved_views.modal.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name input */}
          <div className="space-y-2">
            <label
              htmlFor="view-name"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("leads.saved_views.modal.name_label")} *
            </label>
            <Input
              id="view-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder={t("leads.saved_views.modal.name_placeholder")}
              className={error ? "border-red-500" : ""}
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          {/* Set as default checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="set-default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <label
              htmlFor="set-default"
              className="cursor-pointer text-sm text-gray-600 dark:text-gray-400"
            >
              {t("leads.saved_views.modal.set_default")}
            </label>
          </div>

          {/* What will be saved */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("leads.saved_views.modal.will_save")}
            </p>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                {t("leads.saved_views.modal.filters_count", {
                  count: advancedConditionsCount,
                })}
              </li>
              <li className="flex items-center gap-2">
                <Columns className="h-3.5 w-3.5" />
                {t("leads.saved_views.modal.columns_count", {
                  count: visibleColumnsCount,
                })}
              </li>
              <li className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5" />
                {t("leads.saved_views.modal.sort")}
              </li>
              <li className="flex items-center gap-2">
                <LayoutGrid className="h-3.5 w-3.5" />
                {t("leads.saved_views.modal.view_mode", {
                  mode: viewModeLabel,
                })}
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common:cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common:save", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
