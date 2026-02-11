import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FCCardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const PADDING_STYLES = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

/**
 * FCCard - Base card component
 *
 * White background, light border, configurable padding and hover effect.
 * Use as a building block for dashboard widgets, list items, etc.
 */
export function FCCard({
  children,
  className,
  padding = "md",
  hover = false,
}: FCCardProps) {
  return (
    <div
      className={cn(
        "rounded-fc-lg border-fc-border-light border bg-white dark:border-gray-700 dark:bg-gray-900",
        PADDING_STYLES[padding],
        hover &&
          "hover:border-fc-border-medium hover:shadow-fc-md cursor-pointer transition-all duration-150",
        className
      )}
    >
      {children}
    </div>
  );
}
