"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, MoreHorizontal, User } from "lucide-react";
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
import type { SettingsUser } from "../types/user.types";

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(value: unknown): string {
  if (!value) return "\u2014";
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? "\u2014" : d.toLocaleDateString();
}

// ── Column builder ───────────────────────────────────────────────────────

interface GetUsersColumnsOptions {
  onResetPassword?: (userId: string) => void;
}

export function getUsersColumns({
  onResetPassword,
}: GetUsersColumnsOptions = {}): ColumnDef<SettingsUser>[] {
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
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    // Name
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/adm/settings/users/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
      meta: { label: "Name" },
    },
    // Email
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("email")}</span>
      ),
      meta: { label: "Email" },
    },
    // Role
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue<string | null>("role");
        return (
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {role ?? "user"}
          </Badge>
        );
      },
      meta: {
        label: "Role",
        variant: "select" as const,
        options: [
          { label: "Admin", value: "admin" },
          { label: "User", value: "user" },
        ],
      },
      enableColumnFilter: true,
    },
    // Status
    {
      id: "status",
      accessorFn: (row) => (row.banned ? "banned" : "active"),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const banned = row.original.banned;
        return (
          <Badge variant={banned ? "destructive" : "success"}>
            {banned ? "Banned" : "Active"}
          </Badge>
        );
      },
      meta: {
        label: "Status",
        variant: "select" as const,
        options: [
          { label: "Active", value: "active" },
          { label: "Banned", value: "banned" },
        ],
      },
      enableColumnFilter: true,
    },
    // Organizations count
    {
      id: "organizations",
      accessorFn: (row) => row.memberships.length,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Orgs" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.memberships.length}
        </span>
      ),
      meta: { label: "Organizations" },
      enableSorting: false,
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
        const user = row.original;
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
                <Link href={`/adm/settings/users/${user.id}`}>
                  <User className="mr-2 size-4" />
                  View detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onResetPassword?.(user.id)}>
                <KeyRound className="mr-2 size-4" />
                Reset password
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
