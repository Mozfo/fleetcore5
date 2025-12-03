"use client";

/**
 * ExportButton - Export leads to CSV or JSON
 * Respects active filters for filtered export
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  Loader2,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  filters: Record<string, unknown>;
  selectedIds?: string[];
  locale: "en" | "fr";
}

export function ExportButton({
  filters,
  selectedIds,
  locale: _locale,
}: ExportButtonProps) {
  const { t } = useTranslation("crm");
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    setIsOpen(false);

    try {
      const response = await fetch("/api/v1/crm/leads/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          filters,
          ids: selectedIds,
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      if (format === "csv") {
        // Download CSV file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Download JSON file
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // Silent fail
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={cn(
          "flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50",
          isOpen && "ring-2 ring-blue-300"
        )}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {t("reports.export.button", "Export")}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 z-50 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <button
              onClick={() => handleExport("csv")}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="font-medium">
                  {t("reports.export.csv", "Export CSV")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("reports.export.csv_desc", "For Excel, Power BI")}
                </div>
              </div>
            </button>
            <button
              onClick={() => handleExport("json")}
              className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <FileJson className="h-4 w-4 text-amber-600" />
              <div>
                <div className="font-medium">
                  {t("reports.export.json", "Export JSON")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("reports.export.json_desc", "For developers, APIs")}
                </div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Selected indicator */}
      {selectedIds && selectedIds.length > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-medium text-white">
          {selectedIds.length}
        </span>
      )}
    </div>
  );
}
