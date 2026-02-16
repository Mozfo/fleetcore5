import type { Table } from "@tanstack/react-table";

interface ExportOptions {
  filename?: string;
  excludeColumns?: string[];
  onlySelected?: boolean;
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
        if (val === null || val === undefined) return "";
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
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

  const XLSX = await import("xlsx");

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
      acc[headerLabels[i] ?? h.id] = row.getValue(h.id) ?? "";
      return acc;
    }, {})
  );

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
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
