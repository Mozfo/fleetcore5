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
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
import { getStatusConfig } from "@/lib/config/pipeline-status";
import { cn } from "@/lib/utils";
import type { Lead } from "../types/lead.types";
import { LeadsKanbanCard } from "./leads-kanban-card";

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
      <KanbanBoard className="flex w-full gap-2 pb-4">
        {columnOrder.map((status) => {
          const leads = columns[status] ?? [];

          return (
            <KanbanColumn
              key={status}
              value={status}
              className="bg-accent flex-1 p-1.5"
              disabled
            >
              {/* Column header */}
              <div
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-1.5",
                  getStatusConfig(status).bgMedium
                )}
              >
                <span className="text-foreground text-sm font-semibold">
                  {getLabel(status, locale)}
                </span>
                <span className="text-foreground/60 text-sm font-medium">
                  {leads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {leads.map((lead) => (
                  <LeadsKanbanCard
                    key={lead.id}
                    lead={lead}
                    onView={onView}
                    onEdit={onEdit}
                  />
                ))}
                {leads.length === 0 && (
                  <div className="text-muted-foreground flex flex-col justify-center gap-4 pt-4 text-center text-sm">
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
    <div className="flex gap-2 pb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-accent flex flex-1 flex-col gap-2 rounded-lg p-1.5"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6" />
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}
