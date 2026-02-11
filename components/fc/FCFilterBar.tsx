import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { X } from "lucide-react";

interface FCFilterBarProps {
  children: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}

/**
 * FCFilterBar - Inline filter bar (48px, Cosmos style)
 *
 * Container for filter dropdowns/inputs. Shows reset button when filters active.
 * Replaces inconsistent filter bars across CRM pages.
 */
export function FCFilterBar({
  children,
  onReset,
  showReset = false,
  className,
}: FCFilterBarProps) {
  return (
    <div
      className={cn(
        "border-fc-border-light flex h-12 shrink-0 items-center gap-3 border-b bg-white px-4 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {children}

      {showReset && onReset && (
        <button
          onClick={onReset}
          className="rounded-fc-md text-fc-text-muted hover:bg-fc-bg-hover hover:text-fc-text-primary ml-auto flex h-8 items-center gap-1.5 px-3 text-xs transition-colors duration-150 dark:hover:bg-gray-800"
        >
          <X className="h-3 w-3" />
          Reset
        </button>
      )}
    </div>
  );
}
