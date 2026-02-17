"use client";

import { useList, type CrudFilter } from "@refinedev/core";
import { useQueryStates } from "nuqs";
import * as React from "react";

import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
import type { Lead } from "../types/lead.types";
import { SIDEBAR_FILTER_PARSERS } from "./use-leads-table";

// ── Kanban column order (6 columns, no payment_pending) ────────────────

const KANBAN_STATUSES = [
  "callback_requested",
  "demo",
  "proposal_sent",
  "converted",
  "lost",
  "nurturing",
] as const;

export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

// ── Sidebar → CrudFilter conversion (same logic as use-leads-table) ────

function sidebarToCrudFilters(
  values: Record<string, string | string[] | number | null>
): CrudFilter[] {
  const filters: CrudFilter[] = [];

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value) && value.length > 0) {
      filters.push({ field: key, operator: "in", value });
      continue;
    }

    if (key.startsWith("min_")) {
      const field = key.slice(4);
      if (typeof value === "number" || (typeof value === "string" && value)) {
        filters.push({ field, operator: "gte", value });
      }
      continue;
    }

    if (key.startsWith("max_")) {
      const field = key.slice(4);
      if (typeof value === "number" || (typeof value === "string" && value)) {
        filters.push({ field, operator: "lte", value });
      }
      continue;
    }

    if (value === "true" || value === "false") {
      filters.push({ field: key, operator: "eq", value });
      continue;
    }
  }

  return filters;
}

// ── Hook ───────────────────────────────────────────────────────────────

export interface PendingTransition {
  leadId: string;
  lead: Lead;
  fromStatus: string;
  toStatus: string;
}

export function useLeadsKanban() {
  const { canTransitionTo, isLoading: statusesLoading } = useLeadStatuses();

  // Read sidebar filters from URL (shared with table view via nuqs)
  const [sidebarValues] = useQueryStates(SIDEBAR_FILTER_PARSERS);
  const sidebarFilters = React.useMemo<CrudFilter[]>(
    () => sidebarToCrudFilters(sidebarValues),
    [sidebarValues]
  );

  // Only fetch leads that are in kanban-visible statuses
  const statusFilter: CrudFilter = React.useMemo(
    () => ({
      field: "status",
      operator: "in" as const,
      value: [...KANBAN_STATUSES],
    }),
    []
  );

  const filters = React.useMemo<CrudFilter[]>(
    () => [statusFilter, ...sidebarFilters],
    [statusFilter, sidebarFilters]
  );

  // Fetch all pipeline leads (no pagination for kanban)
  const { query, result } = useList<Lead>({
    resource: "leads",
    pagination: { mode: "off" },
    filters,
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const leads = React.useMemo(() => result.data ?? [], [result.data]);

  // ── Group leads by status into columns ─────────────────────────────

  const columns = React.useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    for (const status of KANBAN_STATUSES) {
      grouped[status] = [];
    }
    for (const lead of leads) {
      const status = lead.status;
      if (status in grouped) {
        grouped[status].push(lead);
      }
    }
    return grouped;
  }, [leads]);

  // ── Local optimistic state ─────────────────────────────────────────

  const [optimisticColumns, setOptimisticColumns] =
    React.useState<Record<string, Lead[]>>(columns);

  // Sync optimistic state when server data changes
  React.useEffect(() => {
    setOptimisticColumns(columns);
  }, [columns]);

  // ── Transition modal state ─────────────────────────────────────────

  const [pendingTransition, setPendingTransition] =
    React.useState<PendingTransition | null>(null);

  // ── Validate and handle column change from DnD ─────────────────────

  const handleColumnsChange = React.useCallback(
    (newColumns: Record<string, Lead[]>) => {
      // Find which lead moved and to which column
      for (const status of KANBAN_STATUSES) {
        const oldLeads = optimisticColumns[status] ?? [];
        const newLeads = newColumns[status] ?? [];

        // Find lead that appeared in this column
        for (const lead of newLeads) {
          const wasHere = oldLeads.some((l) => l.id === lead.id);
          if (!wasHere) {
            // This lead was moved TO this column
            const fromStatus = lead.status;
            const toStatus = status;

            if (fromStatus === toStatus) {
              // Same column reorder — allow
              setOptimisticColumns(newColumns);
              return;
            }

            // Validate transition
            if (!canTransitionTo(fromStatus, toStatus)) {
              // Invalid — revert (don't update state)
              return;
            }

            // Valid transition — update visual immediately, open modal
            setOptimisticColumns(newColumns);
            setPendingTransition({
              leadId: lead.id,
              lead,
              fromStatus,
              toStatus,
            });
            return;
          }
        }
      }

      // Fallback: same-column reorder
      setOptimisticColumns(newColumns);
    },
    [optimisticColumns, canTransitionTo]
  );

  // ── Cancel transition (revert to server state) ─────────────────────

  const cancelTransition = React.useCallback(() => {
    setPendingTransition(null);
    setOptimisticColumns(columns);
  }, [columns]);

  // ── Confirm transition (called after modal submission) ─────────────

  const confirmTransition = React.useCallback(() => {
    setPendingTransition(null);
    // Refine will refetch and update columns automatically
  }, []);

  return {
    columns: optimisticColumns,
    columnOrder: [...KANBAN_STATUSES],
    isLoading: query.isLoading || statusesLoading,
    total: leads.length,
    handleColumnsChange,
    pendingTransition,
    cancelTransition,
    confirmTransition,
  };
}
