"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TableDensity } from "@/components/ui/table/data-table";

interface DataTableDensityToggleProps {
  density: TableDensity;
  onDensityChange: (density: TableDensity) => void;
}

export function DataTableDensityToggle({
  density,
  onDensityChange,
}: DataTableDensityToggleProps) {
  const { t } = useTranslation("common");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <SlidersHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("table.density_label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={density}
          onValueChange={(v) => onDensityChange(v as TableDensity)}
        >
          <DropdownMenuRadioItem value="compact">
            {t("table.density_compact")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="normal">
            {t("table.density_normal")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="comfortable">
            {t("table.density_comfortable")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
