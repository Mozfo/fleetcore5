/**
 * LeadsPageHeader - Salesforce Cosmos compact header (44px)
 *
 * Left: Title
 * Right: Export, New Lead, ViewToggle
 */

"use client";

import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ViewToggle, type ViewMode } from "./ViewToggle";

interface LeadsPageHeaderProps {
  onNewLead?: () => void;
  onExport?: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function LeadsPageHeader({
  onNewLead,
  onExport,
  viewMode,
  onViewModeChange,
}: LeadsPageHeaderProps) {
  const { t } = useTranslation("crm");

  return (
    <div className="flex h-11 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
      {/* Left: Title */}
      <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
        {t("leads.title")}
      </h1>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t("leads.actions.export", { defaultValue: "Export" })}
            </span>
          </Button>
        )}

        {onNewLead && (
          <Button size="sm" onClick={onNewLead} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            {t("leads.actions.new_lead")}
          </Button>
        )}

        <ViewToggle value={viewMode} onChange={onViewModeChange} />
      </div>
    </div>
  );
}
