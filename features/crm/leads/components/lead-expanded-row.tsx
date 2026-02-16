"use client";

import {
  Calendar,
  CalendarX,
  Clock,
  Flame,
  Snowflake,
  UserPlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Lead } from "../types/lead.types";
import {
  computeAllLeadInsights,
  getScoreBarColor,
  getScoreColor,
  type InsightIcon,
} from "../lib/lead-insight";

const ICON_MAP: Record<
  InsightIcon,
  React.ComponentType<{ className?: string }>
> = {
  CalendarX,
  Calendar,
  Flame,
  Snowflake,
  Clock,
  UserPlus,
};

interface LeadExpandedRowProps {
  lead: Lead;
}

export function LeadExpandedRow({ lead }: LeadExpandedRowProps) {
  const { t } = useTranslation("crm");
  const insights = computeAllLeadInsights(lead);
  const hasMessage = !!lead.message;
  const hasNotes = !!lead.qualification_notes;
  const hasScore =
    lead.qualification_score !== null && lead.qualification_score !== undefined;
  const hasInsights = insights.length > 0;
  const hasContent = hasMessage || hasNotes || hasScore || hasInsights;

  if (!hasContent) {
    return (
      <p className="text-muted-foreground text-sm italic">
        {t("leads.table.expanded.no_notes", { defaultValue: "No notes" })}
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {/* Insights section */}
      {(hasInsights || hasScore) && (
        <div className="space-y-1.5">
          {hasScore && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {t("leads.table.columns.score")}:
              </span>
              <div className="bg-muted h-2 w-20 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full",
                    getScoreBarColor(lead.qualification_score)
                  )}
                  style={{
                    width: `${Math.min(lead.qualification_score ?? 0, 100)}%`,
                  }}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  getScoreColor(lead.qualification_score)
                )}
              >
                {lead.qualification_score}/100
              </span>
            </div>
          )}
          {insights.map((insight) => {
            const Icon = ICON_MAP[insight.icon];
            return (
              <div
                key={insight.key}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  insight.color
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>
                  {t(
                    `leads.table.insight.${insight.key}`,
                    insight.params ?? {}
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Notes / Message */}
      {(hasMessage || hasNotes) && (
        <div className="grid gap-4 md:grid-cols-2">
          {hasMessage && (
            <div>
              <span className="text-muted-foreground text-xs font-medium">
                {t("leads.table.columns.message")}
              </span>
              <p className="mt-1 whitespace-pre-line">{lead.message}</p>
            </div>
          )}
          {hasNotes && (
            <div>
              <span className="text-muted-foreground text-xs font-medium">
                {t("leads.table.columns.qualification_notes")}
              </span>
              <p className="mt-1 whitespace-pre-line">
                {lead.qualification_notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
