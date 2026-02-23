"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import type { SettingsOrg } from "../types/org.types";

function formatDate(value: unknown): string {
  if (!value) return "\u2014";
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? "\u2014" : d.toLocaleDateString();
}

const TENANT_TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "info" | "outline"
> = {
  headquarters: "info",
  division: "secondary",
  client: "default",
};

export function getOrgsColumns(): ColumnDef<SettingsOrg>[] {
  return [
    // Name
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/adm/settings/organizations/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
      meta: { label: "Name" },
    },
    // Slug
    {
      accessorKey: "slug",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Slug" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-sm">
          {row.getValue("slug")}
        </span>
      ),
      meta: { label: "Slug" },
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
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/adm/settings/organizations/${row.original.id}`}>
                <Eye className="mr-2 size-4" />
                View detail
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
  ];
}
