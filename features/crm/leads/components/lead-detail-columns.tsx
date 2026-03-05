"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Eye,
  MoreHorizontal,
  UserPlus,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/data-table";
import type { Lead, LeadStatusConfig } from "../types/lead.types";
import { STATUS_COLOR_MAP, PRIORITY_COLOR_MAP } from "../lib/lead-insight";
import { formatDateCell as formatDate } from "@/lib/format";
import { getBantCriteriaMet } from "@/lib/constants/crm/bant.constants";

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

// ── Column builder (manager-oriented) ───────────────────────────────────

export function getLeadDetailColumns(
  t: TranslationFn,
  statuses: LeadStatusConfig[],
  localizedPath: (path: string) => string,
  onAssign?: (leadId: string) => void,
  onDisqualify?: (leadId: string) => void
): ColumnDef<Lead>[] {
  const statusOptions: Option[] = statuses.map((s) => ({
    label: s.label_en,
    value: s.value,
  }));

  return [
    // ── Select ────────────────────────────────────────────────────────
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      enableResizing: false,
      enablePinning: false,
      enableGrouping: false,
      size: 40,
    },

    // ── Expander ───────────────────────────────────────────────────────
    {
      id: "expand",
      header: () => null,
      cell: ({ row }) => {
        if (!row.getCanExpand()) return null;
        return (
          <button
            className="flex items-center"
            onClick={row.getToggleExpandedHandler()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: false,
      enablePinning: false,
      enableGrouping: false,
      size: 30,
    },

    // ── Lead code (Link to profile) ──────────────────────────────────
    {
      id: "lead_code",
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.lead_account")}
        />
      ),
      cell: ({ row }) => {
        const lead = row.original;
        const code = lead.lead_code ?? "—";
        return (
          <Link
            href={localizedPath(`/crm/leads/${lead.id}`)}
            prefetch={true}
            className="text-primary font-mono font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {code}
          </Link>
        );
      },
      meta: { label: t("leads.table.columns.lead_account") },
      size: 140,
    },

    // ── Company ──────────────────────────────────────────────────────
    {
      id: "company_name",
      accessorKey: "company_name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.company")}
        />
      ),
      meta: { label: t("leads.table.columns.company") },
      size: 180,
    },

    // ── Email ────────────────────────────────────────────────────────
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.email")}
        />
      ),
      cell: ({ row }) => {
        const email = row.getValue<string>("email");
        const verified = row.original.email_verified;
        return (
          <div className="flex items-center gap-1.5">
            <span className="truncate">{email ?? "—"}</span>
            {verified === true && (
              <BadgeCheck className="size-4 shrink-0 text-green-600" />
            )}
          </div>
        );
      },
      meta: { label: t("leads.table.columns.email") },
      size: 200,
    },

    // ── First name ───────────────────────────────────────────────────
    {
      id: "first_name",
      accessorKey: "first_name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.first_name")}
        />
      ),
      meta: { label: t("leads.table.columns.first_name") },
      size: 120,
    },

    // ── Status ───────────────────────────────────────────────────────
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.status")}
        />
      ),
      cell: ({ row }) => {
        const value = row.getValue<string>("status");
        const config = statuses.find((s) => s.value === value);
        const colors = STATUS_COLOR_MAP[value];
        return (
          <Badge
            variant="outline"
            className={cn(
              "border-transparent",
              colors?.bg ?? "bg-gray-100 dark:bg-gray-800",
              colors?.text ?? "text-gray-700 dark:text-gray-300"
            )}
          >
            {config?.label_en ?? value}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: t("leads.table.columns.status"),
        variant: "multiSelect",
        options: statusOptions,
      },
      size: 150,
    },

    // ── Priority ─────────────────────────────────────────────────────
    {
      id: "priority",
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.priority")}
        />
      ),
      cell: ({ row }) => {
        const value = row.getValue<string | null>("priority");
        if (!value) return "—";
        const colors = PRIORITY_COLOR_MAP[value];
        const label = t(`leads.card.priority.${value}`, {
          defaultValue: value,
        });
        return (
          <Badge
            variant="outline"
            className={cn(
              "border-transparent",
              colors?.bg ?? "bg-gray-100 dark:bg-gray-800",
              colors?.text ?? "text-gray-600 dark:text-gray-400"
            )}
          >
            {label}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: t("leads.table.columns.priority"),
        variant: "multiSelect",
        options: [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
          { label: "Urgent", value: "urgent" },
        ],
      },
      size: 100,
    },

    // ── Assigned to (key manager column) ─────────────────────────────
    {
      id: "assigned_to",
      accessorFn: (row) =>
        row.assigned_to
          ? [row.assigned_to.first_name, row.assigned_to.last_name]
              .filter(Boolean)
              .join(" ")
          : null,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.assigned")}
        />
      ),
      meta: { label: t("leads.table.columns.assigned") },
      size: 160,
    },

    // ── Country ──────────────────────────────────────────────────────
    {
      id: "country_code",
      accessorKey: "country_code",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.country")}
        />
      ),
      cell: ({ row }) => {
        const lead = row.original;
        return `${lead.country?.flag_emoji ?? ""} ${lead.country_code ?? "—"}`;
      },
      meta: { label: t("leads.table.columns.country") },
      size: 100,
    },

    // ── Fleet size ───────────────────────────────────────────────────
    {
      id: "fleet_size",
      accessorKey: "fleet_size",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.fleet_size")}
        />
      ),
      meta: { label: t("leads.table.columns.fleet_size") },
      size: 100,
    },

    // ── Source ────────────────────────────────────────────────────────
    {
      id: "source",
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.source")}
        />
      ),
      meta: { label: t("leads.table.columns.source") },
      size: 120,
    },

    // ── Created at ───────────────────────────────────────────────────
    {
      id: "created_at",
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.created")}
        />
      ),
      cell: ({ row }) => formatDate(row.getValue<string>("created_at")),
      meta: { label: t("leads.table.columns.created") },
      size: 150,
    },

    // ── Last activity at (cold lead detection) ───────────────────────
    {
      id: "last_activity_at",
      accessorKey: "last_activity_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.last_activity_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.last_activity_at),
      meta: { label: t("leads.table.columns.last_activity_at") },
      size: 150,
    },

    // ── Next action date ─────────────────────────────────────────────
    {
      id: "next_action_date",
      accessorKey: "next_action_date",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.next_action_date")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.next_action_date),
      meta: { label: t("leads.table.columns.next_action_date") },
      size: 150,
    },

    // ── BANT Score (computed: X/4) ───────────────────────────────────
    {
      id: "bant_score",
      accessorFn: (row) => getBantCriteriaMet(row),
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads_detail.columns.bant_score", { defaultValue: "BANT" })}
        />
      ),
      cell: ({ getValue }) => {
        const score = getValue<number>();
        const variant =
          score >= 4 ? "default" : score >= 2 ? "secondary" : "outline";
        return <Badge variant={variant}>{score}/4</Badge>;
      },
      meta: {
        label: t("leads_detail.columns.bant_score", { defaultValue: "BANT" }),
      },
      size: 80,
    },

    // ── Days in Status (computed from updated_at) ────────────────────
    {
      id: "days_in_status",
      accessorFn: (row) => {
        if (!row.updated_at) return null;
        return Math.floor(
          (Date.now() - new Date(row.updated_at).getTime()) / 86400000
        );
      },
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads_detail.columns.days_in_status", {
            defaultValue: "Days in Status",
          })}
        />
      ),
      cell: ({ getValue }) => {
        const days = getValue<number | null>();
        if (days === null) return "—";
        const variant =
          days > 14 ? "destructive" : days > 7 ? "warning" : "secondary";
        return <Badge variant={variant}>{days}d</Badge>;
      },
      meta: {
        label: t("leads_detail.columns.days_in_status", {
          defaultValue: "Days in Status",
        }),
      },
      size: 100,
    },

    // ── Actions ──────────────────────────────────────────────────────
    {
      id: "actions",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={localizedPath(`/crm/leads/${lead.id}`)}
                  prefetch={true}
                >
                  <Eye className="mr-2 size-4" />
                  {t("leads_detail.actions.view_profile", {
                    defaultValue: "View Profile",
                  })}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAssign?.(lead.id)}>
                <UserPlus className="mr-2 size-4" />
                {t("leads_detail.actions.assign", {
                  defaultValue: "Assign",
                })}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDisqualify?.(lead.id)}
              >
                <Ban className="mr-2 size-4" />
                {t("leads_detail.actions.disqualify", {
                  defaultValue: "Disqualify",
                })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      enableResizing: false,
      enablePinning: false,
      enableGrouping: false,
      size: 40,
    },
  ];
}
