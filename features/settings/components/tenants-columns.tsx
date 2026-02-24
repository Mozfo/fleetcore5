"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
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
import type { SettingsTenant } from "../types/tenant.types";

function formatDate(value: unknown): string {
  if (!value) return "\u2014";
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? "\u2014" : d.toLocaleDateString();
}

/** Convert ISO 3166-1 alpha-2 country code to flag emoji */
function countryFlag(code: string): string {
  const upper = code.toUpperCase();
  const codePoints = [...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

const TENANT_TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "info" | "outline"
> = {
  headquarters: "info",
  division: "secondary",
  client: "default",
};

const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "destructive" | "secondary" | "outline"
> = {
  active: "success",
  suspended: "destructive",
  past_due: "warning",
  cancelled: "destructive",
};

interface GetTenantsColumnsOptions {
  localizedPath: (path: string) => string;
  onEdit?: (tenantId: string) => void;
  onToggleStatus?: (tenantId: string, currentStatus: string) => void;
  onDelete?: (tenantId: string) => void;
}

export function getTenantsColumns({
  localizedPath,
  onEdit,
  onToggleStatus,
  onDelete,
}: GetTenantsColumnsOptions): ColumnDef<SettingsTenant>[] {
  return [
    // Select
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    // Name with country flag
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const cc = row.original.countryCode;
        const flag = cc ? countryFlag(cc) : "";
        return (
          <Link
            href={localizedPath(`admin/tenants/${row.original.id}`)}
            className="font-medium hover:underline"
          >
            {flag && <span className="mr-2">{flag}</span>}
            {row.getValue("name")}
          </Link>
        );
      },
      meta: { label: "Name" },
    },
    // Country
    {
      accessorKey: "countryCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Country" />
      ),
      cell: ({ row }) => {
        const cc = row.getValue<string>("countryCode");
        return (
          <span className="text-muted-foreground">
            {cc ? `${countryFlag(cc)} ${cc}` : "\u2014"}
          </span>
        );
      },
      meta: { label: "Country" },
    },
    // Currency
    {
      accessorKey: "defaultCurrency",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Currency" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-sm">
          {row.getValue("defaultCurrency")}
        </span>
      ),
      meta: { label: "Currency" },
    },
    // Tenant type
    {
      accessorKey: "tenantType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue<string>("tenantType");
        const variant = TENANT_TYPE_VARIANT[type] ?? "outline";
        return <Badge variant={variant}>{type}</Badge>;
      },
      meta: {
        label: "Type",
        variant: "select" as const,
        options: [
          { label: "Headquarters", value: "headquarters" },
          { label: "Division", value: "division" },
          { label: "Client", value: "client" },
        ],
      },
      enableColumnFilter: true,
    },
    // Status
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        const variant = STATUS_VARIANT[status] ?? "outline";
        return (
          <Badge variant={variant} className="capitalize">
            {status.replace("_", " ")}
          </Badge>
        );
      },
      meta: {
        label: "Status",
        variant: "select" as const,
        options: [
          { label: "Active", value: "active" },
          { label: "Suspended", value: "suspended" },
          { label: "Past Due", value: "past_due" },
          { label: "Cancelled", value: "cancelled" },
        ],
      },
      enableColumnFilter: true,
    },
    // Member count
    {
      accessorKey: "memberCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Members" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("memberCount")}
        </span>
      ),
      meta: { label: "Members" },
    },
    // Created
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
      meta: { label: "Created" },
    },
    // Actions
    {
      id: "actions",
      cell: ({ row }) => {
        const tenant = row.original;
        const isActive = tenant.status === "active";
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
                <Link href={localizedPath(`admin/tenants/${tenant.id}`)}>
                  <Eye className="mr-2 size-4" />
                  View detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(tenant.id)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onToggleStatus?.(tenant.id, tenant.status)}
              >
                <Power className="mr-2 size-4" />
                {isActive ? "Suspend" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(tenant.id)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
  ];
}
