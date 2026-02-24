"use client";

import type { Column } from "@tanstack/react-table";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  EyeOff,
  Rows3,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.ComponentProps<typeof DropdownMenuTrigger> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useTranslation("common");
  const canSort = column.getCanSort();
  const canHide = column.getCanHide();
  const canPin = column.getCanPin();
  const canGroup = column.getCanGroup();

  if (!canSort && !canHide && !canPin && !canGroup) {
    return <div className={cn(className)}>{title}</div>;
  }

  const isPinned = column.getIsPinned();
  const isGrouped = column.getIsGrouped();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "hover:bg-accent focus:ring-ring data-[state=open]:bg-accent [&_svg]:text-muted-foreground -ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 focus:ring-1 focus:outline-none [&_svg]:size-4 [&_svg]:shrink-0",
          className
        )}
        {...props}
      >
        {title}
        {canSort &&
          (column.getIsSorted() === "desc" ? (
            <ChevronDown />
          ) : column.getIsSorted() === "asc" ? (
            <ChevronUp />
          ) : (
            <ChevronsUpDown />
          ))}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {/* ── Sort ─────────────────────────── */}
        {canSort && (
          <>
            <DropdownMenuCheckboxItem
              className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={column.getIsSorted() === "asc"}
              onClick={() => column.toggleSorting(false)}
            >
              <ChevronUp />
              {t("table.sort_asc")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={column.getIsSorted() === "desc"}
              onClick={() => column.toggleSorting(true)}
            >
              <ChevronDown />
              {t("table.sort_desc")}
            </DropdownMenuCheckboxItem>
            {column.getIsSorted() && (
              <DropdownMenuItem
                className="[&_svg]:text-muted-foreground pl-2"
                onClick={() => column.clearSorting()}
              >
                <X />
                {t("table.sort_reset")}
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* ── Pin ──────────────────────────── */}
        {canPin && (
          <>
            {canSort && <DropdownMenuSeparator />}
            {isPinned !== "left" && (
              <DropdownMenuItem
                className="[&_svg]:text-muted-foreground pl-2"
                onClick={() => column.pin("left")}
              >
                <ArrowLeftToLine />
                {t("table.column_pin_left")}
              </DropdownMenuItem>
            )}
            {isPinned !== "right" && (
              <DropdownMenuItem
                className="[&_svg]:text-muted-foreground pl-2"
                onClick={() => column.pin("right")}
              >
                <ArrowRightToLine />
                {t("table.column_pin_right")}
              </DropdownMenuItem>
            )}
            {isPinned && (
              <DropdownMenuItem
                className="[&_svg]:text-muted-foreground pl-2"
                onClick={() => column.pin(false)}
              >
                <X />
                {t("table.column_unpin")}
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* ── Group ────────────────────────── */}
        {canGroup && (
          <>
            {(canSort || canPin) && <DropdownMenuSeparator />}
            <DropdownMenuCheckboxItem
              className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={isGrouped}
              onClick={() => column.toggleGrouping()}
            >
              <Rows3 />
              {t("table.column_group_by")}
            </DropdownMenuCheckboxItem>
          </>
        )}

        {/* ── Hide ─────────────────────────── */}
        {canHide && (
          <>
            {(canSort || canPin || canGroup) && <DropdownMenuSeparator />}
            <DropdownMenuCheckboxItem
              className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={column.getIsVisible()}
              onClick={() => column.toggleVisibility(!column.getIsVisible())}
            >
              <EyeOff />
              {t("table.column_hide")}
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
