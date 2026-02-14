"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import type { Option } from "@/types/data-table";
import type { Lead, LeadStatusConfig } from "../types/lead.types";

type TranslationFn = (key: string) => string;

/**
 * Build lead column definitions for DataTable.
 * Pure function — call via useMemo in consuming component.
 *
 * @param t - Translation function (from useTranslation)
 * @param statuses - Dynamic status configs (from useLeadStatuses)
 */
export function getLeadColumns(
  t: TranslationFn,
  statuses: LeadStatusConfig[]
): ColumnDef<Lead>[] {
  const statusOptions: Option[] = statuses.map((s) => ({
    label: s.label_en,
    value: s.value,
  }));

  return [
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
      size: 40,
    },
    {
      id: "lead_code",
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.ref")}
        />
      ),
      meta: { label: t("leads.table.columns.ref") },
    },
    {
      id: "company_name",
      accessorKey: "company_name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.company")}
        />
      ),
      enableColumnFilter: true,
      meta: {
        label: t("leads.table.columns.company"),
        variant: "text",
        placeholder: t("leads.filters.search"),
      },
    },
    {
      id: "contact",
      accessorFn: (row) =>
        [row.first_name, row.last_name].filter(Boolean).join(" ") || "—",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.contact")}
        />
      ),
      meta: { label: t("leads.table.columns.contact") },
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.email")}
        />
      ),
      meta: { label: t("leads.table.columns.email") },
    },
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
        return (
          <Badge
            variant="outline"
            style={{ borderColor: config?.color, color: config?.color }}
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
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.priority")}
        />
      ),
      enableColumnFilter: true,
      meta: {
        label: t("leads.table.columns.priority"),
        variant: "multiSelect",
        options: [
          { label: t("leads.card.priority.low"), value: "low" },
          { label: t("leads.card.priority.medium"), value: "medium" },
          { label: t("leads.card.priority.high"), value: "high" },
          { label: t("leads.card.priority.urgent"), value: "urgent" },
        ],
      },
    },
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
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.created")}
        />
      ),
      cell: ({ row }) => {
        const date = row.getValue<string>("created_at");
        return date ? new Date(date).toLocaleDateString() : "—";
      },
      meta: { label: t("leads.table.columns.created") },
    },
  ];
}
