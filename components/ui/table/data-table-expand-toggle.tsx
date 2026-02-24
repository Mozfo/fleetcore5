"use client";

import { ChevronsUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DataTableExpandToggleProps {
  expandEnabled: boolean;
  onExpandEnabledChange: (enabled: boolean) => void;
}

export function DataTableExpandToggle({
  expandEnabled,
  onExpandEnabledChange,
}: DataTableExpandToggleProps) {
  const { t } = useTranslation("common");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8",
            expandEnabled &&
              "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => onExpandEnabledChange(!expandEnabled)}
          aria-pressed={expandEnabled}
        >
          <ChevronsUpDown className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("table.expand_rows")}</TooltipContent>
    </Tooltip>
  );
}
