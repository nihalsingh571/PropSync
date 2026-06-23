import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table';
import './admin.css';

export interface DataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, any>[];
  loading?: boolean;
  enableSelection?: boolean;
  onSelectionChange?: (rows: T[]) => void;
  emptyMessage?: string;
}

function DataTable<T extends object>({
  data,
  columns,
  loading,
  enableSelection,
  onSelectionChange,
  emptyMessage = 'No records'
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection
    },
    enableRowSelection: enableSelection,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  React.useEffect(() => {
    if (enableSelection && onSelectionChange) {
      const selected = table.getSelectedRowModel().rows.map((row) => row.original);
      onSelectionChange(selected);
    }
  }, [rowSelection, enableSelection, onSelectionChange, table]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner" />
        <p>Loading data...</p>
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return <p className="empty">{emptyMessage}</p>;
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-top-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : undefined }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                  {{
                    asc: ' ▲',
                    desc: ' ▼'
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={row.getIsSelected() ? 'selected' : ''}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
