/**
 * TablePagination - Pagination pour la vue Table des Leads
 *
 * Features:
 * - Affichage "1-25 sur 84"
 * - Boutons Précédent/Suivant
 * - Sélecteur de taille de page (10, 25, 50)
 * - i18n support
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const { t } = useTranslation("crm");

  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    onPageSizeChange(newSize);
    // Reset to first page when changing page size
    onPageChange(1);
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
      {/* Left: Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">
          {t("leads.pagination.rows_per_page")}
        </span>
        <Select
          value={pageSize.toString()}
          onChange={handlePageSizeChange}
          className="h-8 w-[70px]"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size.toString()}>
              {size}
            </option>
          ))}
        </Select>
      </div>

      {/* Center: Range display */}
      <div className="text-muted-foreground text-sm">
        {t("leads.pagination.showing", {
          start: startItem,
          end: endItem,
          total: totalItems,
        })}
      </div>

      {/* Right: Navigation buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">{t("leads.pagination.previous")}</span>
        </Button>
        <span className="text-muted-foreground px-2 text-sm">
          {t("leads.pagination.page_of", {
            current: currentPage,
            total: totalPages || 1,
          })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canGoNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">{t("leads.pagination.next")}</span>
        </Button>
      </div>
    </div>
  );
}
