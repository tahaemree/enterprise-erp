"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Download,
    FolderOpen,
    Inbox,
    Plus,
    Search,
    Settings2,
    X,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    searchPlaceholder?: string
    toolbar?: React.ReactNode
    viewText?: string
    toggleColumnsText?: string
    noResultsText?: string
    rowsPerPageText?: string
    pageText?: string
    ofText?: string
    rowSelectedText?: string
    showingText?: string
    selectedText?: string
    pageCount?: number
    manualPagination?: boolean
    manualFiltering?: boolean
    pagination?: { pageIndex: number; pageSize: number }
    onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
    onSearchChange?: (search: string) => void
    /** Custom empty state content shown when no results and no active search */
    emptyState?: React.ReactNode
    /** Text for the create button in empty state (e.g., "Create Product") */
    createLabel?: string
    /** Callback when create button is clicked */
    onCreateClick?: () => void
    /** Bulk actions node to render when rows are selected */
    bulkActions?: (selectedRows: import("@tanstack/react-table").Row<TData>[]) => React.ReactNode
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Ara...",
    toolbar,
    viewText = "Görüntüle",
    toggleColumnsText = "Sütunları göster/gizle",
    noResultsText = "Sonuç bulunamadı.",
    rowsPerPageText = "Sayfa başına satır",
    pageText = "Sayfa",
    ofText = "/",
    rowSelectedText = "satır seçili.",
    showingText = "Gösterilen",
    selectedText = "seçili.",
    pageCount,
    manualPagination,
    manualFiltering,
    pagination,
    onPaginationChange,
    onSearchChange,
    emptyState,
    createLabel,
    onCreateClick,
    bulkActions,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [globalFilter, setGlobalFilter] = React.useState("")
    const t = useTranslations()

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
            ...(pagination ? { pagination } : {}),
        },
        pageCount: pageCount,
        manualPagination: manualPagination,
        manualFiltering: manualFiltering,
    })

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchKey
                                ? (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
                                : globalFilter
                            }
                            onChange={(event) => {
                                if (manualFiltering && onSearchChange) {
                                    setGlobalFilter(event.target.value)
                                    onSearchChange(event.target.value)
                                } else if (searchKey) {
                                    table.getColumn(searchKey)?.setFilterValue(event.target.value)
                                } else {
                                    setGlobalFilter(event.target.value)
                                }
                            }}
                            className="pl-9 pr-9"
                        />
                        {Boolean(searchKey
                            ? table.getColumn(searchKey)?.getFilterValue()
                            : globalFilter
                        ) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                                    onClick={() => {
                                        if (manualFiltering && onSearchChange) {
                                            setGlobalFilter("")
                                            onSearchChange("")
                                        } else if (searchKey) {
                                            table.getColumn(searchKey)?.setFilterValue("")
                                        } else {
                                            setGlobalFilter("")
                                        }
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                    </div>

                    {/* Custom toolbar */}
                    {toolbar}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    {/* Export */}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                            const dataToExport = table.getFilteredRowModel().rows.map(row => row.original)
                            if (!dataToExport.length) return
                            const keys = Object.keys(dataToExport[0] as object)
                            const csvContent = [
                                keys.join(','),
                                ...dataToExport.map(row => keys.map(k => {
                                    const val = (row as any)[k]
                                    if (val === null || val === undefined) return '""'
                                    if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
                                    return `"${String(val).replace(/"/g, '""')}"`
                                }).join(','))
                            ].join('\n')
                            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
                            const link = document.createElement('a')
                            link.href = URL.createObjectURL(blob)
                            link.download = `export-${new Date().toISOString().split('T')[0]}.csv`
                            link.click()
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Dışa Aktar
                    </Button>

                    {/* Column visibility */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings2 className="mr-2 h-4 w-4" />
                                {viewText}
                            </Button>
                        </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel>{toggleColumnsText}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {t.has(`columns.${column.id}`) 
                                            ? t(`columns.${column.id}`) 
                                            : column.id.replace(/_/g, " ").replace(/([A-Z])/g, ' $1').trim()}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/10 bg-background/60 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-primary/5">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/20 hover:bg-muted/20">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="h-11 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, index) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={cn(
                                        "cursor-pointer transition-all duration-150",
                                        "hover:bg-muted/30",
                                        "data-[state=selected]:bg-primary/5",
                                        "bg-background"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2.5 text-sm">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-48 text-center"
                                >
                                    {(() => {
                                        const hasActiveSearch = searchKey
                                            ? !!table.getColumn(searchKey)?.getFilterValue()
                                            : !!globalFilter

                                        if (hasActiveSearch) {
                                            return (
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="rounded-full bg-muted p-3">
                                                        <Search className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground font-medium">
                                                        {noResultsText}
                                                    </p>
                                                </div>
                                            )
                                        }

                                        if (emptyState) {
                                            return emptyState
                                        }

                                        return (
                                            <div className="flex flex-col items-center justify-center gap-4 py-8 animate-in fade-in zoom-in duration-300">
                                                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                                                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20 duration-1000"></div>
                                                    <FolderOpen className="h-10 w-10 text-primary" strokeWidth={1.5} />
                                                </div>
                                                <div className="text-center space-y-1.5 max-w-sm">
                                                    <h3 className="text-lg font-semibold tracking-tight">Kayıt Bulunamadı</h3>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {noResultsText} {createLabel ? "Yeni bir kayıt oluşturarak hemen başlayabilirsiniz." : "Arama kriterlerinizi değiştirerek tekrar deneyebilirsiniz."}
                                                    </p>
                                                </div>
                                                {createLabel && onCreateClick && (
                                                    <Button
                                                        variant="default"
                                                        size="default"
                                                        onClick={onCreateClick}
                                                        className="mt-2 gap-2 shadow-md transition-all hover:shadow-lg"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        {createLabel}
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    })()}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length > 0 && (
                        <span>
                            {table.getFilteredSelectedRowModel().rows.length} {ofText}{" "}
                            {table.getFilteredRowModel().rows.length} {selectedText}
                        </span>
                    )}
                    {table.getFilteredSelectedRowModel().rows.length === 0 && (
                        <span>
                            {showingText} {table.getRowModel().rows.length} {ofText}{" "}
                            {table.getFilteredRowModel().rows.length} {rowSelectedText}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{rowsPerPageText}</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                const newPageSize = Number(value)
                                if (manualPagination && onPaginationChange) {
                                    onPaginationChange({
                                        pageIndex: 0,
                                        pageSize: newPageSize,
                                    })
                                } else {
                                    table.setPageSize(newPageSize)
                                }
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                            {pageText} {table.getState().pagination.pageIndex + 1} {ofText}{" "}
                            {table.getPageCount()}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                                if (manualPagination && onPaginationChange) {
                                    onPaginationChange({ pageIndex: 0, pageSize: table.getState().pagination.pageSize })
                                } else {
                                    table.setPageIndex(0)
                                }
                            }}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                                if (manualPagination && onPaginationChange) {
                                    onPaginationChange({ pageIndex: table.getState().pagination.pageIndex - 1, pageSize: table.getState().pagination.pageSize })
                                } else {
                                    table.previousPage()
                                }
                            }}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                                if (manualPagination && onPaginationChange) {
                                    onPaginationChange({ pageIndex: table.getState().pagination.pageIndex + 1, pageSize: table.getState().pagination.pageSize })
                                } else {
                                    table.nextPage()
                                }
                            }}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                                if (manualPagination && onPaginationChange) {
                                    onPaginationChange({ pageIndex: table.getPageCount() - 1, pageSize: table.getState().pagination.pageSize })
                                } else {
                                    table.setPageIndex(table.getPageCount() - 1)
                                }
                            }}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Floating Bulk Action Bar */}
            {table.getFilteredSelectedRowModel().rows.length > 0 && bulkActions && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="flex items-center gap-4 rounded-full border border-primary/20 bg-background/80 backdrop-blur-xl px-6 py-3 shadow-2xl shadow-primary/10">
                        <span className="text-sm font-medium">
                            <span className="text-primary font-bold text-base mr-1">{table.getFilteredSelectedRowModel().rows.length}</span> 
                            {selectedText}
                        </span>
                        <div className="h-5 w-px bg-border/50 mx-2" />
                        <div className="flex items-center gap-2">
                            {bulkActions(table.getFilteredSelectedRowModel().rows)}
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-full h-8 w-8 ml-2 hover:bg-destructive/10 hover:text-destructive" 
                                onClick={() => table.toggleAllRowsSelected(false)}
                                title="Seçimi İptal Et"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
