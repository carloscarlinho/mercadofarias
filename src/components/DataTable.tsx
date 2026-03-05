"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
} from "@tanstack/react-table";
import { useState } from "react";
import * as XLSX from "xlsx";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    filename?: string;
    searchColumn?: string;
    searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    filename = "relatorio",
    searchColumn,
    searchPlaceholder = "Buscar...",
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
    });

    const handleExport = () => {
        // Pegar apenas os dados visíveis e na ordem atual (ou todos se preferir, mudando rowModel)
        const exportData = table.getSortedRowModel().rows.map(row => {
            // Extrai os valores reais de cada célula para o Excel
            const rowData: Record<string, any> = {};
            row.getVisibleCells().forEach(cell => {
                const columnHeader = cell.column.columnDef.header;
                // Ignora colunas sem header em texto (ex: colunas de Ações)
                if (typeof columnHeader === 'string') {
                    rowData[columnHeader] = cell.getValue();
                }
            });
            return rowData;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Planilha1");
        XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="w-full">
            {/* Toolbox: Search & Export */}
            <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
                {searchColumn && (
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </div>
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? globalFilter}
                            onChange={(e) => {
                                if (searchColumn) {
                                    table.getColumn(searchColumn)?.setFilterValue(e.target.value);
                                } else {
                                    setGlobalFilter(e.target.value);
                                }
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
                        />
                    </div>
                )}

                <button
                    onClick={handleExport}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Exportar Excel
                </button>
            </div>

            {/* Table Area */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#f8fafc] text-slate-600 font-medium border-b border-slate-200 uppercase text-xs tracking-wider">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <th
                                                key={header.id}
                                                className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                    {/* Sort Icons */}
                                                    {{
                                                        asc: <span className="material-symbols-outlined text-[16px] text-[#0ea5e9]">arrow_upward</span>,
                                                        desc: <span className="material-symbols-outlined text-[16px] text-[#0ea5e9]">arrow_downward</span>,
                                                    }[header.column.getIsSorted() as string] ?? (
                                                            header.column.getCanSort() ? <span className="material-symbols-outlined text-[16px] text-slate-300 opacity-0 group-hover:opacity-100">swap_vert</span> : null
                                                        )}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="h-32 text-center text-slate-500"
                                    >
                                        Nenhum resultado encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-slate-500">
                    Página <span className="font-medium text-slate-900">{table.getState().pagination.pageIndex + 1}</span> de{" "}
                    <span className="font-medium text-slate-900">{table.getPageCount() || 1}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
