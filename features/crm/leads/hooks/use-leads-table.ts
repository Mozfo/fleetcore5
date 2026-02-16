"use client";

import { useList, type CrudFilter, type CrudSort } from "@refinedev/core";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import {
  type Parser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import { useDataTable } from "@/hooks/use-data-table";
import { getSortingStateParser } from "@/lib/parsers";
import type { Lead } from "../types/lead.types";

/** Columns hidden by default — only the 22 CEO-selected columns are visible. */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  id: false,
  industry: false,
  company_size: false,
  linkedin_url: false,
  source: false,
  source_id: false,
  utm_source: false,
  utm_medium: false,
  utm_campaign: false,
  message: false,
  qualification_notes: false,
  scoring: false,
  fit_score: false,
  engagement_score: false,
  qualification_score: false,
  consent_at: false,
  consent_ip: false,
  updated_at: false,
  qualified_date: false,
  converted_date: false,
  next_action_date: false,
  opportunity_id: false,
  metadata: false,
  stripe_checkout_session_id: false,
  stripe_payment_link_url: false,
  payment_link_created_at: false,
  payment_link_expires_at: false,
  deleted_at: false,
  deleted_by: false,
  deletion_reason: false,
  created_by: false,
  last_activity_at: false,
  provider_id: false,
  stage_entered_at: false,
  loss_reason_code: false,
  loss_reason_detail: false,
  competitor_name: false,
  booking_confirmed_at: false,
  booking_calcom_uid: false,
  platforms_used: false,
  tenant_id: false,
  converted_at: false,
  email_verified: false,
  email_verification_code: false,
  email_verification_expires_at: false,
  email_verification_attempts: false,
  confirmation_token: false,
  attendance_confirmed: false,
  attendance_confirmed_at: false,
  j1_reminder_sent_at: false,
  reschedule_token: false,
  detected_country_code: false,
  ip_address: false,
  language: false,
  callback_completed_at: false,
  callback_notes: false,
  disqualified_at: false,
  disqualification_reason: false,
  disqualification_comment: false,
  disqualified_by: false,
  recovery_notification_sent_at: false,
  recovery_notification_clicked_at: false,
};

interface UseLeadsTableProps {
  columns: ColumnDef<Lead>[];
  initialPageSize?: number;
  savedColumnVisibility?: VisibilityState;
}

/**
 * Bridge hook: Refine useList (data fetching) + Kiranism useDataTable (UI state).
 *
 * Flow: URL state (nuqs) → Refine params → API fetch → data + pageCount → DataTable.
 * Both useList params and useDataTable read from the same nuqs URL state (safe dedup).
 */
export function useLeadsTable({
  columns,
  initialPageSize = 20,
  savedColumnVisibility,
}: UseLeadsTableProps) {
  // ── Read URL state for Refine data fetching ───────────────────────────
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState(
    "perPage",
    parseAsInteger.withDefault(initialPageSize)
  );
  const columnIds = React.useMemo(
    () => new Set(columns.map((c) => c.id).filter(Boolean) as string[]),
    [columns]
  );
  const [sorting] = useQueryState(
    "sort",
    getSortingStateParser<Lead>(columnIds).withDefault([])
  );

  const sorters = React.useMemo<CrudSort[]>(
    () => sorting.map((s) => ({ field: s.id, order: s.desc ? "desc" : "asc" })),
    [sorting]
  );

  // Build filter parsers from filterable columns (mirrors useDataTable logic)
  const filterParsers = React.useMemo(() => {
    return columns
      .filter((c) => c.enableColumnFilter)
      .reduce<Record<string, Parser<string> | Parser<string[]>>>((acc, col) => {
        acc[col.id ?? ""] = col.meta?.options
          ? parseAsArrayOf(parseAsString, ",")
          : parseAsString;
        return acc;
      }, {});
  }, [columns]);

  const [filterValues] = useQueryStates(filterParsers);

  const filters = React.useMemo<CrudFilter[]>(() => {
    return Object.entries(filterValues).reduce<CrudFilter[]>(
      (acc, [key, value]) => {
        if (value === null || value === undefined) return acc;
        if (Array.isArray(value) && value.length > 0) {
          acc.push({ field: key, operator: "in", value });
        } else if (typeof value === "string" && value) {
          acc.push({ field: key, operator: "contains", value });
        }
        return acc;
      },
      []
    );
  }, [filterValues]);

  // ── Refine data fetching ──────────────────────────────────────────────
  const { query, result } = useList<Lead>({
    resource: "leads",
    pagination: { currentPage: page, pageSize: perPage },
    sorters,
    filters,
  });

  const data = result.data;
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / perPage);

  // ── Kiranism DataTable (reads same URL state — nuqs deduplicates) ─────
  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: true,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageIndex: 0, pageSize: initialPageSize },
      columnVisibility: savedColumnVisibility ?? DEFAULT_COLUMN_VISIBILITY,
    },
  });

  return { table, isLoading: query.isLoading, isError: query.isError, total };
}
