"use client";

import { CalendarX, Clock, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Lead } from "../types/lead.types";
import { computeAllLeadInsights, type InsightIcon } from "../lib/lead-insight";

const ICON_MAP: Record<
  InsightIcon,
  React.ComponentType<{ className?: string }>
> = {
  CalendarX,
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
  const hasInsights = insights.length > 0;
  const hasContent = hasMessage || hasInsights;

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
      {hasInsights && (
        <div className="space-y-1.5">
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

      {/* Message */}
      {hasMessage && (
        <div>
          <span className="text-muted-foreground text-xs font-medium">
            {t("leads.table.columns.message")}
          </span>
          <p className="mt-1 whitespace-pre-line">{lead.message}</p>
        </div>
      )}
    </div>
  );
}
