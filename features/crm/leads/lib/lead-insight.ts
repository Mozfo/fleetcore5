import type { Lead } from "../types/lead.types";

// ── Color Maps (light + dark) ────────────────────────────────────────────

/** Tailwind class pairs for each lead status value. */
export const STATUS_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  new: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
  },
  email_verified: {
    bg: "bg-cyan-100 dark:bg-cyan-900",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  callback_requested: {
    bg: "bg-amber-100 dark:bg-amber-900",
    text: "text-amber-700 dark:text-amber-300",
  },
  qualified: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-700 dark:text-blue-300",
  },
  payment_pending: {
    bg: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-700 dark:text-yellow-300",
  },
  converted: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-700 dark:text-green-300",
  },
  nurturing: {
    bg: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-700 dark:text-purple-300",
  },
  disqualified: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-500 dark:text-gray-500",
  },
};

/** Tailwind class pairs for each priority value. */
export const PRIORITY_COLOR_MAP: Record<string, { bg: string; text: string }> =
  {
    low: {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-600 dark:text-gray-400",
    },
    medium: {
      bg: "bg-yellow-100 dark:bg-yellow-900",
      text: "text-yellow-700 dark:text-yellow-300",
    },
    high: {
      bg: "bg-orange-100 dark:bg-orange-900",
      text: "text-orange-700 dark:text-orange-300",
    },
    urgent: {
      bg: "bg-red-100 dark:bg-red-900",
      text: "text-red-700 dark:text-red-300",
    },
  };

// ── Row indicator (border-left) ──────────────────────────────────────────

const TERMINAL_STATUSES = new Set(["converted", "disqualified"]);

/**
 * Compute border-left Tailwind class for a table row.
 * Returns the first matching rule (highest priority).
 * Used via DataTable's getRowClassName prop.
 */
export function computeRowIndicator(lead: Lead): string {
  const now = new Date();
  const isActive = !TERMINAL_STATUSES.has(lead.status);

  // 1. Callback overdue → RED
  if (
    lead.callback_requested &&
    lead.callback_requested_at &&
    !lead.callback_completed_at
  ) {
    if (new Date(lead.callback_requested_at) < now) {
      return "border-l-4 border-l-red-500";
    }
  }

  // 2. Inactive > 14 days → ORANGE
  if (lead.last_activity_at && isActive) {
    const days = Math.floor(
      (now.getTime() - new Date(lead.last_activity_at).getTime()) / 86_400_000
    );
    if (days > 14) {
      return "border-l-4 border-l-orange-500";
    }
  }

  // 6. No match → transparent (keep alignment)
  return "border-l-4 border-l-transparent";
}

// ── Insight engine ────────────────────────────────────────────────────────

/** Lucide icon name for each insight rule. */
export type InsightIcon = "CalendarX" | "Clock" | "UserPlus";

export interface LeadInsight {
  /** i18n key suffix (under leads.table.insight.*) */
  key: string;
  /** Interpolation params for the i18n key */
  params?: Record<string, string | number>;
  /** Tailwind text color class */
  color: string;
  /** Lucide icon name */
  icon: InsightIcon;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

function hoursBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 3_600_000);
}

/**
 * Compute ALL matching insight rules for a lead.
 * Rules are ordered by priority — first match = most important.
 */
export function computeAllLeadInsights(lead: Lead): LeadInsight[] {
  const now = new Date();
  const insights: LeadInsight[] = [];
  const isActive = !TERMINAL_STATUSES.has(lead.status);

  // 1. Callback overdue
  if (
    lead.callback_requested &&
    lead.callback_requested_at &&
    !lead.callback_completed_at
  ) {
    const callbackDate = new Date(lead.callback_requested_at);
    if (callbackDate < now) {
      const days = daysBetween(callbackDate, now);
      insights.push({
        key: "callback_overdue",
        params: { days },
        color: "text-red-600",
        icon: "CalendarX",
      });
    }
  }

  // 2. Inactive
  if (lead.last_activity_at && isActive) {
    const lastActivity = new Date(lead.last_activity_at);
    const days = daysBetween(lastActivity, now);
    if (days > 14) {
      insights.push({
        key: "inactive",
        params: { days },
        color: "text-orange-600",
        icon: "Clock",
      });
    }
  }

  // 7. New, not contacted
  if (lead.status === "new" && lead.created_at) {
    const created = new Date(lead.created_at);
    const hours = hoursBetween(created, now);
    if (hours > 24) {
      insights.push({
        key: "not_contacted",
        color: "text-amber-600",
        icon: "UserPlus",
      });
    }
  }

  return insights;
}

/**
 * Compute the single most important insight for a lead.
 * Returns null if no rule matches.
 */
export function computeLeadInsight(lead: Lead): LeadInsight | null {
  const insights = computeAllLeadInsights(lead);
  return insights[0] ?? null;
}

// ── Urgency checks (used for date badges in columns) ─────────────────────

export function isCallbackOverdue(lead: Lead): boolean {
  if (
    !lead.callback_requested ||
    !lead.callback_requested_at ||
    lead.callback_completed_at
  )
    return false;
  return new Date(lead.callback_requested_at) < new Date();
}

export function hasUrgency(lead: Lead): boolean {
  return isCallbackOverdue(lead);
}
