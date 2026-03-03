"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface InfoRowAction {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  actions?: InfoRowAction[];
  emptyText?: string;
  className?: string;
}

export function InfoRow({
  label,
  value,
  actions,
  emptyText = "—",
  className,
}: InfoRowProps) {
  const displayValue =
    value !== null && value !== undefined && value !== ""
      ? String(value)
      : emptyText;
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-medium",
            isEmpty && "text-muted-foreground italic"
          )}
        >
          {displayValue}
        </p>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-1">
          {actions.map((action, i) => {
            const ActionIcon = action.icon;
            if (action.href) {
              return (
                <Button
                  key={i}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-primary/10 hover:text-primary h-7 w-7 transition-colors"
                  asChild
                >
                  <a href={action.href} title={action.label}>
                    <ActionIcon className="h-4 w-4" />
                  </a>
                </Button>
              );
            }
            return (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:text-primary h-7 w-7 transition-colors"
                onClick={action.onClick}
                title={action.label}
              >
                <ActionIcon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
