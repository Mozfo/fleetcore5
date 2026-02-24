import type { Table } from "@tanstack/react-table";
import { toast } from "sonner";

interface ExportOptions {
  filename?: string;
  excludeColumns?: string[];
  onlySelected?: boolean;
}

/** Format a cell value for export — handles dates, objects, arrays, nulls */
function formatExportValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) {
    return formatDateForExport(val);
  }
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      return val.map((v) => formatExportValue(v)).join(", ");
    }
    // Check for date-like strings stored as objects
    const dateCheck = (val as { toISOString?: unknown }).toISOString;
    if (typeof dateCheck === "function") {
      return formatDateForExport(val as Date);
    }
    // Skip rendering raw objects as [object Object]
    try {
      return JSON.stringify(val);
    } catch {
      return "";
    }
  }
  // Check if string looks like an ISO date
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return formatDateForExport(d);
  }
  return String(val);
}

function formatDateForExport(d: Date): string {
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: ExportOptions = {}
) {
  const {
    filename = "export",
    excludeColumns = ["select", "actions", "expander"],
    onlySelected = false,
  } = opts;

  const headers = table
    .getAllLeafColumns()
    .filter((col) => !excludeColumns.includes(col.id) && col.getIsVisible());

  const rows = onlySelected
    ? table.getFilteredSelectedRowModel().rows
    : table.getFilteredRowModel().rows;

  const csvHeaders = headers.map((h) => {
    const label =
      (h.columnDef.meta as Record<string, unknown> | undefined)?.label ?? h.id;
    return `"${String(label).replace(/"/g, '""')}"`;
  });

  const csvRows = rows.map((row) =>
    headers
      .map((h) => {
        const val = row.getValue(h.id);
        const formatted = formatExportValue(val);
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [csvHeaders.join(","), ...csvRows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${filename}.csv`);
}

export async function exportTableToExcel<TData>(
  table: Table<TData>,
  opts: ExportOptions = {}
) {
  const {
    filename = "export",
    excludeColumns = ["select", "actions", "expander"],
    onlySelected = false,
  } = opts;

  let XLSX: typeof import("xlsx");
  try {
    XLSX = await import("xlsx");
  } catch {
    toast.error(
      "Excel export requires the 'xlsx' package. Install it with: pnpm add xlsx"
    );
    return;
  }

  const headers = table
    .getAllLeafColumns()
    .filter((col) => !excludeColumns.includes(col.id) && col.getIsVisible());

  const rows = onlySelected
    ? table.getFilteredSelectedRowModel().rows
    : table.getFilteredRowModel().rows;

  const headerLabels = headers.map(
    (h) =>
      ((h.columnDef.meta as Record<string, unknown> | undefined)?.label ??
        h.id) as string
  );

  const data = rows.map((row) =>
    headers.reduce<Record<string, unknown>>((acc, h, i) => {
      const val = row.getValue(h.id);
      acc[headerLabels[i] ?? h.id] = formatExportValue(val);
      return acc;
    }, {})
  );

  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (err) {
    toast.error(
      `Excel export failed: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
