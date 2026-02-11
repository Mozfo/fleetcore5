import { ReactNode } from "react";

interface FCPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

/**
 * FCPageHeader - Unified page header (48px)
 *
 * Replaces inconsistent headers across Dashboard, CRM, Settings pages.
 * Always: white bg, border-bottom, 48px height, title left, actions right.
 */
export function FCPageHeader({
  title,
  subtitle,
  actions,
  badge,
}: FCPageHeaderProps) {
  return (
    <header className="border-fc-border-light flex h-12 shrink-0 items-center justify-between border-b bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <h1 className="text-fc-text-primary text-lg font-semibold dark:text-white">
          {title}
        </h1>
        {badge}
        {subtitle && (
          <span className="text-fc-text-muted text-sm dark:text-gray-400">
            {subtitle}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
