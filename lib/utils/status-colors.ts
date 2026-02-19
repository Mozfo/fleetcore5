/**
 * Centralized status → color utilities for lead statuses.
 *
 * Delegates to lib/config/pipeline-status.ts (single source of truth).
 * All classes use CSS variable tokens — NO hardcoded Tailwind colors.
 */

import { getStatusConfig } from "@/lib/config/pipeline-status";

/** Get badge color classes (bg + text) for a status */
export function getStatusBadgeColor(status: string): string {
  const cfg = getStatusConfig(status);
  return `${cfg.bgMedium} ${cfg.text}`;
}

/** Get border-left color class for a status (Kanban cards) */
export function getStatusBorderLeft(status: string): string {
  return getStatusConfig(status).borderLeft;
}

/** Get section background tint for a status (subtle) */
export function getStatusSectionBg(status: string): string {
  return getStatusConfig(status).bgSubtle;
}

/** Get header background tint — stronger than section bg */
export function getStatusHeaderBg(status: string): string {
  return getStatusConfig(status).bgMedium;
}
