"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";

import {
  Kanban,
  Board as KanbanBoard,
  Column as KanbanColumn,
  Overlay as KanbanOverlay,
} from "@/components/ui/kanban";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
import { cn } from "@/lib/utils";
import type { Lead } from "../types/lead.types";
import { LeadsKanbanCard, STATUS_DOT_COLOR } from "./leads-kanban-card";

// ── Props ───────────────────────────────────────────────────────────

interface LeadsKanbanBoardProps {
  columns: Record<string, Lead[]>;
  columnOrder: string[];
  isLoading: boolean;
  onColumnsChange: (columns: Record<string, Lead[]>) => void;
  onView?: (leadId: string) => void;
  onEdit?: (leadId: string) => void;
}

// ── Component ───────────────────────────────────────────────────────

export function LeadsKanbanBoardComponent({
  columns,
  columnOrder,
  isLoading,
  onColumnsChange,
  onView,
  onEdit,
}: LeadsKanbanBoardProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { getLabel } = useLeadStatuses();

  if (isLoading) {
    return <KanbanSkeleton />;
  }

  return (
    <Kanban
      value={columns}
      onValueChange={onColumnsChange}
      getItemValue={(lead: Lead) => lead.id}
    >
      <KanbanBoard className="gap-3 pb-4">
        {columnOrder.map((status) => {
          const leads = columns[status] ?? [];
          const dotColor = STATUS_DOT_COLOR[status] ?? "bg-gray-400";

          return (
            <KanbanColumn
              key={status}
              value={status}
              className="min-w-[160px] flex-1"
              disabled
            >
              {/* Column header */}
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className={cn("size-2.5 rounded-full", dotColor)} />
                  <span className="text-sm font-semibold">
                    {getLabel(status, locale)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {leads.length}
                  </Badge>
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-0.5">
                {leads.map((lead) => (
                  <LeadsKanbanCard
                    key={lead.id}
                    lead={lead}
                    onView={onView}
                    onEdit={onEdit}
                  />
                ))}
                {leads.length === 0 && (
                  <div className="text-muted-foreground flex h-20 items-center justify-center rounded-md border border-dashed text-xs">
                    {t("leads.kanban.empty_column")}
                  </div>
                )}
              </div>
            </KanbanColumn>
          );
        })}
      </KanbanBoard>

      <KanbanOverlay>
        {({ variant }) =>
          variant === "item" ? (
            <div className="bg-primary/10 h-20 w-48 rounded-md" />
          ) : null
        }
      </KanbanOverlay>
    </Kanban>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="flex gap-3 pb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-muted flex min-w-[160px] flex-1 flex-col gap-2 rounded-lg p-2.5"
        >
          <div className="mb-2 flex items-center gap-2 px-1">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-32 w-full rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}
