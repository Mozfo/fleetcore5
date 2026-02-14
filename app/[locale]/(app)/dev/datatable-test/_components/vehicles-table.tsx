"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  status: string;
  mileage: number;
}

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Idle", value: "idle" },
];

const brandOptions = [
  { label: "Toyota", value: "Toyota" },
  { label: "Ford", value: "Ford" },
  { label: "Hyundai", value: "Hyundai" },
  { label: "Renault", value: "Renault" },
  { label: "Peugeot", value: "Peugeot" },
];

const columns: ColumnDef<Vehicle>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    size: 40,
  },
  {
    id: "plate",
    accessorKey: "plate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plate" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Plate",
      variant: "text",
      placeholder: "Search plates...",
    },
  },
  {
    id: "brand",
    accessorKey: "brand",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Brand" />
    ),
    enableColumnFilter: true,
    meta: {
      label: "Brand",
      variant: "multiSelect",
      options: brandOptions,
    },
  },
  {
    id: "model",
    accessorKey: "model",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Model" />
    ),
    meta: { label: "Model" },
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      const variant =
        status === "active"
          ? "default"
          : status === "maintenance"
            ? "destructive"
            : "secondary";
      return <Badge variant={variant}>{status}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: "Status",
      variant: "multiSelect",
      options: statusOptions,
    },
  },
  {
    id: "mileage",
    accessorKey: "mileage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mileage" />
    ),
    cell: ({ row }) => `${row.getValue<number>("mileage").toLocaleString()} km`,
    meta: { label: "Mileage" },
  },
];

interface VehiclesTableProps {
  data: Vehicle[];
  pageCount: number;
}

export function VehiclesTable({ data, pageCount }: VehiclesTableProps) {
  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 5 },
    },
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
