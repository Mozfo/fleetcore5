import { cn } from "@/lib/utils";

type FCBadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

type FCBadgeSize = "sm" | "md";

interface FCBadgeProps {
  children: React.ReactNode;
  variant?: FCBadgeVariant;
  size?: FCBadgeSize;
  className?: string;
}

/**
 * FCBadge - Vivid status badge (NEVER pastel)
 *
 * Rule: Always solid colored background + white text.
 * Replaces inconsistent badge styles across CRM pages.
 */

const VARIANT_STYLES: Record<FCBadgeVariant, string> = {
  default: "bg-fc-neutral-500 text-white",
  primary: "bg-fc-primary-500 text-white",
  success: "bg-fc-success-500 text-white",
  warning: "bg-fc-warning-500 text-white",
  danger: "bg-fc-danger-500 text-white",
  info: "bg-fc-info-500 text-white",
};

const SIZE_STYLES: Record<FCBadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
};

export function FCBadge({
  children,
  variant = "default",
  size = "md",
  className,
}: FCBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-medium",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
    >
      {children}
    </span>
  );
}
