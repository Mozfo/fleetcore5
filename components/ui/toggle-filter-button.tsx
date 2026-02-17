"use client";

import { cn } from "@/lib/utils";

interface ToggleFilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

export function ToggleFilterButton({
  label,
  active,
  onClick,
  count,
}: ToggleFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
        active
          ? "border-primary/50 bg-primary/10 text-primary font-medium"
          : "bg-muted/50 text-muted-foreground hover:bg-muted border-transparent"
      )}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1 text-[10px] tabular-nums",
            active
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
