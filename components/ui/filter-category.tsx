"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface FilterCategoryProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Number of active filters — displayed as a badge next to the title. */
  activeCount?: number;
  className?: string;
}

export function FilterCategory({
  title,
  children,
  defaultOpen = true,
  activeCount,
  className,
}: FilterCategoryProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("", className)}>
      <CollapsibleTrigger className="group text-muted-foreground hover:text-foreground flex w-full items-center justify-between py-1.5 text-xs font-medium transition-colors">
        <span className="flex items-center gap-1.5">
          {title}
          {activeCount !== undefined && activeCount > 0 && (
            <span className="bg-primary/15 text-primary inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className="text-muted-foreground/60 size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}
