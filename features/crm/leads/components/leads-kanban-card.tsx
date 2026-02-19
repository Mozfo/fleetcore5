"use client";

import { memo } from "react";
import { AlertTriangle, Car, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Item as KanbanItem } from "@/components/ui/kanban";
import { cn } from "@/lib/utils";
import { LeadContextMenu } from "@/components/crm/leads/LeadContextMenu";
import type { Lead, LeadStatus } from "../types/lead.types";

// ── Utilities ───────────────────────────────────────────────────────

function formatTimeAgo(
  isoDate: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const now = new Date();
  const date = new Date(isoDate);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return t("leads.time.just_now");
  if (seconds < 3600)
    return t("leads.time.minutes_ago", { count: Math.floor(seconds / 60) });
  if (seconds < 86400)
    return t("leads.time.hours_ago", { count: Math.floor(seconds / 3600) });
  if (seconds < 604800)
    return t("leads.time.days_ago", { count: Math.floor(seconds / 86400) });
  return t("leads.time.weeks_ago", { count: Math.floor(seconds / 604800) });
}

function getOverdueDays(lead: Lead): number | null {
  if (lead.status !== "callback_requested") return null;
  const created = new Date(lead.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  if (hoursDiff <= 48) return null;
  return Math.floor(hoursDiff / 24);
}

// ── Component ───────────────────────────────────────────────────────

interface LeadsKanbanCardProps {
  lead: Lead;
  onView?: (leadId: string) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDisqualify?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
}

export const LeadsKanbanCard = memo(
  function LeadsKanbanCard({
    lead,
    onView,
    onEdit,
    onConvert,
    onDisqualify,
    onDelete,
    onStatusChange,
  }: LeadsKanbanCardProps) {
    const { t } = useTranslation("crm");

    const overdueDays = getOverdueDays(lead);

    return (
      <KanbanItem value={lead.id} asHandle>
        <LeadContextMenu
          lead={lead}
          onView={() => onView?.(lead.id)}
          onEdit={() => onEdit?.(lead.id)}
          onStatusChange={(status) => onStatusChange?.(lead.id, status)}
          onConvert={() => onConvert?.(lead.id)}
          onDisqualify={() => onDisqualify?.(lead.id)}
          onDelete={() => onDelete?.(lead.id)}
        >
          <Card
            onClick={() => onView?.(lead.id)}
            className={cn(
              "gap-0 border-0 py-0",
              overdueDays !== null && "ring-destructive/50 ring-2"
            )}
          >
            <CardHeader className="p-3 pb-1.5">
              {lead.lead_code && (
                <p className="text-primary font-mono text-sm font-bold tracking-wide">
                  {lead.lead_code}
                </p>
              )}

              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                <span className="truncate">
                  {lead.company_name || "Unknown Company"}
                </span>
                {lead.country?.flag_emoji && (
                  <span
                    className="flex-shrink-0 text-sm"
                    title={lead.country.country_name_en}
                  >
                    {lead.country.flag_emoji}
                  </span>
                )}
              </CardTitle>

              {(lead.first_name || lead.last_name) && (
                <CardDescription>
                  {[lead.first_name, lead.last_name].filter(Boolean).join(" ")}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-2 px-3 pt-0 pb-3">
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  {lead.fleet_size && (
                    <span className="inline-flex items-center gap-1">
                      <Car className="size-3.5" />
                      {String(lead.fleet_size).replace(/\s*vehicles?/i, "")}
                    </span>
                  )}
                  {lead.qualification_score !== null &&
                    lead.qualification_score !== undefined && (
                      <span className="font-semibold">
                        {lead.qualification_score}
                      </span>
                    )}
                </div>
                {lead.source && (
                  <span className="truncate text-xs">{lead.source}</span>
                )}
              </div>

              <Separator />

              {overdueDays !== null && (
                <div className="text-destructive flex items-center gap-1 text-xs font-medium">
                  <AlertTriangle className="size-3.5" />
                  {t("leads.kanban.overdue_days", { count: overdueDays })}
                </div>
              )}

              <div className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
                <Clock className="size-3" />
                {formatTimeAgo(lead.created_at, t)}
              </div>
            </CardContent>
          </Card>
        </LeadContextMenu>
      </KanbanItem>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.lead.id === nextProps.lead.id &&
      prevProps.lead.status === nextProps.lead.status &&
      prevProps.lead.updated_at === nextProps.lead.updated_at &&
      prevProps.lead.qualification_score ===
        nextProps.lead.qualification_score &&
      prevProps.lead.assigned_to?.id === nextProps.lead.assigned_to?.id
    );
  }
);
