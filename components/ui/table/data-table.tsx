import {
  type Row,
  type Table as TanstackTable,
  flexRender,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { DataTablePagination } from "@/components/ui/table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCommonPinningStyles } from "@/lib/data-table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type TableDensity = "compact" | "normal" | "comfortable";

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  density?: TableDensity;
  renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
  /** Optional per-row className (e.g. border-left indicator). */
  getRowClassName?: (row: Row<TData>) => string | undefined;
}

const densityCellClasses: Record<TableDensity, string> = {
  compact: "py-1 text-xs",
  normal: "",
  comfortable: "py-4 text-base",
};

const DENSITY_ROW_HEIGHTS: Record<TableDensity, number> = {
  compact: 33,
  normal: 41,
  comfortable: 57,
};

export function DataTable<TData>({
  table,
  actionBar,
  children,
  density = "normal",
  renderExpandedRow,
  getRowClassName,
}: DataTableProps<TData>) {
  const { t } = useTranslation("common");

  // ── Scroll container ref (for virtualizer) ──────────────────────
  const [scrollElement, setScrollElement] = React.useState<HTMLElement | null>(
    null
  );
  const scrollAreaRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const viewport = node.querySelector('[data-slot="scroll-area-viewport"]');
      setScrollElement((viewport as HTMLElement) ?? null);
    } else {
      setScrollElement(null);
    }
  }, []);

  // ── Column ordering (HTML5 drag) ──────────────────────────────
  const handleDragStart = React.useCallback(
    (e: React.DragEvent, headerId: string) => {
      e.dataTransfer.setData("text/plain", headerId);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");
      if (draggedId === targetId) return;

      const currentOrder = table.getState().columnOrder.length
        ? [...table.getState().columnOrder]
        : table.getAllLeafColumns().map((c) => c.id);

      const from = currentOrder.indexOf(draggedId);
      const to = currentOrder.indexOf(targetId);
      if (from === -1 || to === -1) return;
      currentOrder.splice(from, 1);
      currentOrder.splice(to, 0, draggedId);
      table.setColumnOrder(currentOrder);
    },
    [table]
  );

  // ── Helpers ───────────────────────────────────────────────────
  const cellDensity = densityCellClasses[density];
  const colCount = table.getAllColumns().length;

  // ── Row sections (pinned top / center / pinned bottom) ────────
  const topRows = table.getTopRows();
  const centerRows = table.getCenterRows();
  const bottomRows = table.getBottomRows();
  const hasRows =
    topRows.length > 0 || centerRows.length > 0 || bottomRows.length > 0;

  // ── Virtualizer (always runs — only outputs used when rows > threshold)
  const rowVirtualizer = useVirtualizer({
    count: centerRows.length,
    estimateSize: () => DENSITY_ROW_HEIGHTS[density],
    getScrollElement: () => scrollElement,
    overscan: 10,
  });

  const useVirtual = centerRows.length > 100;

  // ── Row rendering ─────────────────────────────────────────────
  const renderSingleRow = (row: Row<TData>) => (
    <React.Fragment key={row.id}>
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        className={cn(
          row.getIsPinned() && "bg-muted/50",
          getRowClassName?.(row)
        )}
      >
        {row.getVisibleCells().map((cell) => {
          const pinStyles = getCommonPinningStyles({
            column: cell.column,
            withBorder: true,
          });
          const cellStyle = { width: cell.column.getSize(), ...pinStyles };

          const metaClassName = cell.column.columnDef.meta?.className;

          // Grouped cell (group header with expand/collapse)
          if (cell.getIsGrouped()) {
            return (
              <TableCell
                key={cell.id}
                className={cn(cellDensity, metaClassName)}
                style={cellStyle}
              >
                <button
                  className="flex items-center gap-1 font-medium"
                  onClick={row.getToggleExpandedHandler()}
                >
                  {row.getIsExpanded() ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  <span className="text-muted-foreground ml-1">
                    ({row.subRows.length})
                  </span>
                </button>
              </TableCell>
            );
          }

          // Aggregated cell
          if (cell.getIsAggregated()) {
            return (
              <TableCell
                key={cell.id}
                className={cn(cellDensity, metaClassName)}
                style={cellStyle}
              >
                {flexRender(
                  cell.column.columnDef.aggregatedCell ??
                    cell.column.columnDef.cell,
                  cell.getContext()
                )}
              </TableCell>
            );
          }

          // Placeholder cell
          if (cell.getIsPlaceholder()) {
            return (
              <TableCell
                key={cell.id}
                className={cn(cellDensity, metaClassName)}
                style={cellStyle}
              />
            );
          }

          // Normal cell
          return (
            <TableCell
              key={cell.id}
              className={cn(cellDensity, metaClassName)}
              style={cellStyle}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          );
        })}
      </TableRow>

      {/* Expanded row content */}
      {row.getIsExpanded() && !row.getIsGrouped() && renderExpandedRow && (
        <TableRow>
          <TableCell colSpan={colCount} className="bg-muted/30 p-4">
            {renderExpandedRow(row)}
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );

  // ── Virtual center rows ─────────────────────────────────────────
  const renderCenterRows = () => {
    if (!useVirtual) {
      return centerRows.map(renderSingleRow);
    }

    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) return null;

    const totalSize = rowVirtualizer.getTotalSize();
    const firstItem = virtualItems[0];
    const lastItem = virtualItems[virtualItems.length - 1];

    return (
      <>
        {firstItem.start > 0 && <tr style={{ height: firstItem.start }} />}
        {virtualItems.map((virtualRow) => {
          const row = centerRows[virtualRow.index];
          return renderSingleRow(row);
        })}
        {lastItem.end < totalSize && (
          <tr style={{ height: totalSize - lastItem.end }} />
        )}
      </>
    );
  };

  return (
    <div className="flex flex-1 flex-col space-y-4">
      {children}
      <div className="relative flex flex-1">
        <div className="absolute inset-0 flex overflow-hidden rounded-lg border">
          <ScrollArea ref={scrollAreaRef} className="h-full w-full">
            <Table noWrapper style={{ minWidth: table.getCenterTotalSize() }}>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isPinned = header.column.getIsPinned();
                      return (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          className={cn(
                            "relative",
                            header.column.columnDef.meta?.className
                          )}
                          draggable={!header.isPlaceholder && !isPinned}
                          onDragStart={(e) => handleDragStart(e, header.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, header.id)}
                          style={{
                            width: header.getSize(),
                            ...getCommonPinningStyles({
                              column: header.column,
                              withBorder: true,
                            }),
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              onDoubleClick={() => header.column.resetSize()}
                              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none ${
                                header.column.getIsResizing()
                                  ? "bg-primary opacity-100"
                                  : "bg-border opacity-0 hover:opacity-100"
                              }`}
                            />
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {hasRows ? (
                  <>
                    {topRows.map(renderSingleRow)}
                    {renderCenterRows()}
                    {bottomRows.map(renderSingleRow)}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={colCount} className="h-24 text-center">
                      {t("table.no_results")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} />
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}
